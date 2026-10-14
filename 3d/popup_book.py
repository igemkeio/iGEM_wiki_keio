"""方眼紙の机に開いた本から、DNA二重らせんが立ち上がって回るカットを書き出す。

実行例:
  blender -b -P 3d/popup_book.py -- --mode all --out 3d/out/book
"""

import argparse
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dna_helix  # noqa: E402

PAPER = "#f5f2ec"
GRID_LINE = "#c3cad3"
PAGE_W, PAGE_H = 3.0, 4.0
PAGE_CURL = 0.12
COVER_THICKNESS = 0.18


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["frames", "poster", "all"], default="all")
    p.add_argument("--out", default="3d/out/book")
    p.add_argument("--frames", type=int, default=300)
    p.add_argument("--fps", type=int, default=30)
    p.add_argument("--res", default="1920x1080")
    p.add_argument("--samples", type=int, default=48)
    # らせんがページから出てくる秒数と、最後にページへ戻る秒数。
    p.add_argument("--rise", type=float, default=2.5)
    p.add_argument("--sink", type=float, default=1.5)
    p.add_argument("--save-blend", action="store_true")
    return p.parse_args(argv)


def hex_rgb(hex_color):
    h = hex_color.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255


def draw_page_image(name, width=1024, height=1365, figure="helix", seed=0):
    """本のページに貼る画像。方眼、見出し、本文風の線、図版を描く。"""
    rng = np.random.default_rng(seed)
    img = np.ones((height, width, 3), dtype=np.float32) * hex_rgb(PAPER)

    def rect(x0, y0, x1, y1, color):
        img[max(y0, 0) : min(y1, height), max(x0, 0) : min(x1, width)] = color

    def disc(cx, cy, r, color):
        x0, x1 = int(cx - r - 1), int(cx + r + 2)
        y0, y1 = int(cy - r - 1), int(cy + r + 2)
        ys, xs = np.mgrid[max(y0, 0) : min(y1, height), max(x0, 0) : min(x1, width)]
        mask = (xs - cx) ** 2 + (ys - cy) ** 2 <= r * r
        img[max(y0, 0) : min(y1, height), max(x0, 0) : min(x1, width)][mask] = color

    grid = hex_rgb(GRID_LINE) * 0.25 + hex_rgb(PAPER) * 0.75
    for x in range(0, width, 64):
        rect(x, 0, x + 1, height, grid)
    for y in range(0, height, 64):
        rect(0, y, width, y + 1, grid)

    ink = hex_rgb(dna_helix.COLORS["ink"])
    muted = hex_rgb(dna_helix.COLORS["muted"])
    orange = hex_rgb(dna_helix.COLORS["orange"])
    blue = hex_rgb(dna_helix.COLORS["blue"])
    margin = 96

    # 見出しと本文の行。長さを揺らして活字らしく見せる。
    rect(margin, margin, margin + 420, margin + 28, ink)
    rect(margin, margin + 44, margin + 180, margin + 52, orange)
    y = margin + 110
    for _ in range(9):
        w = int(rng.uniform(0.55, 1.0) * (width - 2 * margin))
        rect(margin, y, margin + w, y + 7, muted)
        y += 22

    fig_top, fig_bottom = y + 60, height - margin
    if figure == "helix":
        cx = width / 2
        amp = (width - 2 * margin) * 0.28
        n = 1400
        for i in range(n):
            t = i / n
            py = fig_top + t * (fig_bottom - fig_top)
            ang = 2 * math.pi * 3 * t
            xa = cx + amp * math.sin(ang)
            xb = cx + amp * math.sin(ang + dna_helix.HELIX["strand_phase"])
            disc(xa, py, 5, ink)
            disc(xb, py, 5, muted)
            if i % 46 == 0:
                mid = (xa + xb) / 2
                steps = 24
                for k in range(steps + 1):
                    px = xa + (xb - xa) * k / steps
                    disc(px, py, 3, orange if px < mid else blue)
    else:
        # 細胞の模式図。輪郭と核、小器官の点。
        cx, cy = width / 2, (fig_top + fig_bottom) / 2
        r = min(width - 2 * margin, fig_bottom - fig_top) * 0.42
        disc(cx, cy, r, ink)
        disc(cx, cy, r - 6, hex_rgb(PAPER))
        disc(cx - r * 0.2, cy - r * 0.1, r * 0.3, blue)
        disc(cx - r * 0.2, cy - r * 0.1, r * 0.3 - 6, hex_rgb(PAPER))
        disc(cx - r * 0.2, cy - r * 0.1, r * 0.12, blue)
        for _ in range(28):
            a = rng.uniform(0, 2 * math.pi)
            d = rng.uniform(0.35, 0.85) * r
            disc(cx + d * math.cos(a), cy + d * math.sin(a), rng.uniform(6, 14), orange)

    # 枠外に小さな脚注。
    rect(margin, height - margin + 30, margin + 260, height - margin + 36, muted)

    image = bpy.data.images.new(name, width=width, height=height)
    rgba = np.concatenate([img, np.ones((height, width, 1), dtype=np.float32)], axis=2)
    # Blenderの画像は下の行が先頭なので上下を反転して渡す。
    image.pixels.foreach_set(np.flipud(rgba).ravel())
    image.pack()
    return image


def make_paper_material(name, image):
    mat = bpy.data.materials.new(name)
    if not mat.use_nodes:
        mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.85
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.interpolation = "Cubic"
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def make_grid_desk_material():
    mat = bpy.data.materials.new("Desk")
    if not mat.use_nodes:
        mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.9
    brick = nodes.new("ShaderNodeTexBrick")
    brick.offset = 0.0
    brick.squash = 1.0
    brick.inputs["Scale"].default_value = 2.0
    brick.inputs["Mortar Size"].default_value = 0.02
    brick.inputs["Mortar Smooth"].default_value = 0.4
    brick.inputs["Brick Width"].default_value = 1.0
    brick.inputs["Row Height"].default_value = 1.0
    paper = dna_helix.srgb_to_linear(PAPER)
    brick.inputs["Color1"].default_value = paper
    brick.inputs["Color2"].default_value = paper
    brick.inputs["Mortar"].default_value = dna_helix.srgb_to_linear(GRID_LINE)
    coord = nodes.new("ShaderNodeTexCoord")
    links.new(coord.outputs["Object"], brick.inputs["Vector"])
    links.new(brick.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def add_page(name, side, material):
    """side は -1 が左ページ、+1 が右ページ。背側が少し持ち上がる反りを付ける。"""
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=40, y_subdivisions=40, size=1.0)
    page = bpy.context.object
    page.name = name
    for v in page.data.vertices:
        u = v.co.x + 0.5  # 0が背側、1が小口側
        if side < 0:
            u = 1.0 - u
        x = (v.co.x + 0.5) * PAGE_W if side > 0 else -(0.5 - v.co.x) * PAGE_W
        y = v.co.y * PAGE_H
        z = PAGE_CURL * (1.0 - u) ** 2 + 0.01 * math.sin(u * math.pi) * (1 - u)
        v.co = Vector((x, y, z))
    page.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return page


def add_cover():
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, -COVER_THICKNESS / 2))
    cover = bpy.context.object
    cover.name = "Cover"
    cover.scale = (PAGE_W * 2 + 0.2, PAGE_H + 0.2, COVER_THICKNESS)
    mat = dna_helix.make_material("CoverBlue", dna_helix.COLORS["blue"], roughness=0.6)
    cover.data.materials.append(mat)
    return cover


def add_desk():
    bpy.ops.mesh.primitive_plane_add(size=60.0, location=(0.0, 0.0, -COVER_THICKNESS))
    desk = bpy.context.object
    desk.name = "Desk"
    desk.data.materials.append(make_grid_desk_material())
    return desk


def add_helix_on_page(frames, fps, rise, sink):
    materials = {
        "a": dna_helix.make_material("StrandInk", dna_helix.COLORS["ink"], roughness=0.4),
        "b": dna_helix.make_material("StrandMuted", dna_helix.COLORS["muted"], roughness=0.4),
        "orange": dna_helix.make_material("Orange", dna_helix.COLORS["orange"], roughness=0.3),
        "blue": dna_helix.make_material("Blue", dna_helix.COLORS["blue"], roughness=0.3),
    }
    parts = dna_helix.build_helix(materials)
    root = dna_helix.build_rig(parts, frames)
    # らせんは全長8.5なので、ページの上に収まるよう縮めて立てる。
    scale = 0.26
    root.scale = (scale, scale, scale)
    root.rotation_euler = (0.0, 0.0, 0.0)
    height = dna_helix.HELIX["rise_per_turn"] * dna_helix.HELIX["turns"] * scale
    x, y = PAGE_W * 0.5, 0.2
    up = height / 2 + 0.05
    hidden = -height / 2 - 0.1  # 表紙と机の下に隠れる高さ

    # ページから出てきて、回り、ページへ戻る。先頭と末尾が同じ姿勢なのでループできる。
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"
    root.location = (x, y, hidden)
    root.keyframe_insert("location", frame=1)
    root.location = (x, y, up)
    root.keyframe_insert("location", frame=1 + int(rise * fps))
    root.keyframe_insert("location", frame=frames - int(sink * fps))
    root.location = (x, y, hidden)
    root.keyframe_insert("location", frame=frames + 1)
    return root, height


def setup_lights():
    bpy.ops.object.light_add(type="SUN", location=(6, -4, 10))
    sun = bpy.context.object
    sun.data.energy = 1.8
    sun.data.angle = math.radians(3.0)
    sun.rotation_euler = (math.radians(38), math.radians(12), math.radians(40))

    bpy.ops.object.light_add(type="AREA", location=(-6, -3, 6))
    fill = bpy.context.object
    fill.data.energy = 120.0
    fill.data.size = 8.0
    fill.rotation_euler = (math.radians(50), 0.0, math.radians(-110))


def setup_world(scene):
    world = bpy.data.worlds.new("World")
    scene.world = world
    if not world.use_nodes:
        world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = dna_helix.srgb_to_linear(dna_helix.COLORS["page"])
    bg.inputs["Strength"].default_value = 0.45


def setup_camera(scene, target, frames):
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=target)
    aim = bpy.context.object
    aim.name = "Aim"

    bpy.ops.object.camera_add(location=(-1.6, -9.8, 6.0))
    cam = bpy.context.object
    cam.data.lens = 45
    cam.data.dof.use_dof = True
    cam.data.dof.focus_object = aim
    cam.data.dof.aperture_fstop = 2.2
    track = cam.constraints.new("TRACK_TO")
    track.target = aim
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    scene.camera = cam

    # カメラは1ループで元の位置に戻る小さな弧を描く。
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"
    base = Vector(cam.location)
    for i, t in enumerate((0.0, 0.25, 0.5, 0.75, 1.0)):
        ang = 2 * math.pi * t
        cam.location = base + Vector((0.5 * math.sin(ang), 0.3 * (1 - math.cos(ang)), 0.2 * math.sin(ang)))
        cam.keyframe_insert("location", frame=1 + int(frames * t))
    return cam


def setup_render(scene, args):
    dna_helix.pick_engine(scene)
    scene.frame_start = 1
    scene.frame_end = args.frames
    scene.render.fps = args.fps
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.eevee.taa_render_samples = args.samples
    scene.eevee.use_shadows = True
    scene.eevee.use_raytracing = True


def main():
    args = parse_args()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    scene = dna_helix.reset_scene()
    left_img = draw_page_image("PageLeft", figure="cell", seed=1)
    right_img = draw_page_image("PageRight", figure="helix", seed=2)
    add_desk()
    add_cover()
    add_page("PageLeft", -1, make_paper_material("PaperLeft", left_img))
    add_page("PageRight", +1, make_paper_material("PaperRight", right_img))
    root, height = add_helix_on_page(args.frames, args.fps, args.rise, args.sink)
    setup_lights()
    setup_world(scene)
    setup_camera(scene, (PAGE_W * 0.25, 0.0, height * 0.35), args.frames)
    setup_render(scene, args)

    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=str(out / "popup_book.blend"))

    dna_helix.set_resolution(scene, args.res)
    if args.mode in ("poster", "all"):
        # 先頭はらせんが隠れているので、出きった頃の絵を静止画にする。
        scene.frame_set(args.frames // 2)
        scene.render.filepath = str(out / "popup-book-poster.png")
        bpy.ops.render.render(write_still=True)

    if args.mode in ("frames", "all"):
        frames_dir = out / "frames"
        frames_dir.mkdir(exist_ok=True)
        scene.render.filepath = str(frames_dir / "frame_")
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
