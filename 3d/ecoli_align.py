"""ばらばらの向きの大腸菌が、左から波のように同じ向きにそろい、また戻るループ。

CG Python(Victor Stepanov)のループ作品の作り方に寄せている。同じ形を並べ、
動き出しを1つずつずらし、跳ねる緩急で動かし、望遠と浅いピントで見せる。

実行例:
  blender -b -P 3d/ecoli_align.py -- --out 3d/out/align
"""

import argparse
import math
import random
import sys
from pathlib import Path

import bmesh
import bpy

# tokens.cssの色
INK = "#0d0f12"
PAGE = "#dfe4ea"
ORANGE = "#ffb347"
BLUE = "#2962ff"


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", default="3d/out/align")
    p.add_argument("--mode", choices=["frames", "poster", "all"], default="all")
    p.add_argument("--fps", type=int, default=30)
    p.add_argument("--seconds", type=int, default=6)
    p.add_argument("--res", default="1080x1080")
    p.add_argument("--samples", type=int, default=64)
    p.add_argument("--grid", type=int, default=9)
    p.add_argument("--seed", type=int, default=7)
    p.add_argument("--save-blend", action="store_true")
    return p.parse_args(argv)


def linear(hex_color, alpha=1.0):
    h = hex_color.lstrip("#")

    def ch(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return tuple(ch(int(h[i : i + 2], 16)) for i in (0, 2, 4)) + (alpha,)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = linear(INK)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    return scene


def capsule_mesh(length=0.9, radius=0.17):
    """球の上半分と下半分を引き離して、両端が丸い円柱にする。"""
    mesh = bpy.data.meshes.new("capsule")
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=radius)
    half = (length - 2 * radius) / 2
    for v in bm.verts:
        if v.co.z > 1e-6:
            v.co.z += half
        elif v.co.z < -1e-6:
            v.co.z -= half
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    return mesh


def metallic(name, hex_color, roughness=0.3):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = linear(hex_color)
    bsdf.inputs["Metallic"].default_value = 0.85
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def build_grid(n, frames, rng):
    mesh = capsule_mesh()
    body = metallic("cell", PAGE)
    accent = metallic("cell.accent", ORANGE, roughness=0.3)
    mesh.materials.append(body)
    spacing = 1.15
    offset = (n - 1) * spacing / 2
    # そろった向きは横倒しで+X方向。One Directionの向き。
    aligned = (0.0, math.radians(90), 0.0)

    # 遅れは左の列ほど早い。最後の戻りがループの終わりに間に合うよう上限を決める。
    move = 26
    start_in, start_out = 12, frames // 2 + 6
    max_delay = frames // 2 - move - 14
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "BACK"

    cells = []
    for ix in range(n):
        for iy in range(n):
            obj = bpy.data.objects.new(f"cell.{ix}.{iy}", mesh)
            bpy.context.collection.objects.link(obj)
            obj.location = (ix * spacing - offset, iy * spacing - offset, 0.0)
            # メッシュを共有したまま菌ごとに色を変えるため、マテリアルはオブジェクト側に持たせる。
            # 1割ほどをオレンジにして、ロゴの差し色に合わせる。
            obj.material_slots[0].link = "OBJECT"
            obj.material_slots[0].material = accent if rng.random() < 0.12 else body

            rand = (
                rng.uniform(-math.pi, math.pi),
                rng.uniform(-math.pi, math.pi),
                rng.uniform(-math.pi, math.pi),
            )
            delay = int(max_delay * ix / max(n - 1, 1)) + rng.randint(0, 3)
            keys = [
                (1, rand),
                (start_in + delay, rand),
                (start_in + delay + move, aligned),
                (start_out + delay, aligned),
                (start_out + delay + move, rand),
                (frames + 1, rand),
            ]
            for frame, rot in keys:
                obj.rotation_euler = rot
                obj.keyframe_insert("rotation_euler", frame=frame)
            cells.append(obj)
    return cells


def add_lights():
    bpy.ops.object.light_add(type="SUN", rotation=(math.radians(-60), math.radians(-15), math.radians(-45)))
    bpy.context.object.data.energy = 2.5

    # 真上の大きな面光源で、金属の上面に柔らかいハイライトを出す
    bpy.ops.object.light_add(type="AREA", location=(0, -2, 8))
    top = bpy.context.object
    top.data.size = 12
    top.data.energy = 900

    # 下からオレンジ、斜め上から青を当てて、金属の映り込みに色を出す
    bpy.ops.object.light_add(type="AREA", location=(0, 0, -4))
    under = bpy.context.object
    under.rotation_euler = (math.radians(180), 0, 0)
    under.data.size = 10
    under.data.energy = 300
    under.data.color = linear(ORANGE)[:3]

    bpy.ops.object.light_add(type="AREA", location=(-6, 6, 6))
    rim = bpy.context.object
    rim.data.size = 6
    rim.data.energy = 500
    rim.data.color = linear(BLUE)[:3]
    target = bpy.data.objects.new("rim.target", None)
    bpy.context.collection.objects.link(target)
    c = rim.constraints.new("TRACK_TO")
    c.target = target


def setup_camera(scene):
    target = bpy.data.objects.new("camera.target", None)
    bpy.context.collection.objects.link(target)
    bpy.ops.object.camera_add(location=(0, -17.5, 13))
    cam = bpy.context.object
    cam.data.lens = 70
    cam.data.dof.use_dof = True
    cam.data.dof.focus_object = target
    cam.data.dof.aperture_fstop = 0.6
    c = cam.constraints.new("TRACK_TO")
    c.target = target
    scene.camera = cam


def setup_render(scene, args):
    scene.render.engine = "BLENDER_EEVEE"
    w, h = (int(v) for v in args.res.lower().split("x"))
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = 100
    scene.render.fps = args.fps
    scene.frame_start = 1
    scene.frame_end = args.fps * args.seconds
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.eevee.taa_render_samples = args.samples
    scene.eevee.use_raytracing = True
    scene.eevee.use_fast_gi = True
    scene.view_settings.view_transform = "AgX"
    for look in ("AgX - Very High Contrast", "AgX - High Contrast", "AgX - Punchy"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            continue


def main():
    args = parse_args()
    rng = random.Random(args.seed)
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    scene = reset()
    frames = args.fps * args.seconds
    build_grid(args.grid, frames, rng)
    add_lights()
    setup_camera(scene)
    setup_render(scene, args)

    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=str(out / "ecoli_align.blend"))

    if args.mode in ("poster", "all"):
        # そろい切った瞬間を静止画にする
        scene.frame_set(frames // 2)
        scene.render.filepath = str(out / "ecoli-align-poster.png")
        bpy.ops.render.render(write_still=True)
    if args.mode == "poster":
        # 確認用に、ばらばらの状態とそろう途中も出す
        for f in (1, 30):
            scene.frame_set(f)
            scene.render.filepath = str(out / f"check_{f:03d}.png")
            bpy.ops.render.render(write_still=True)

    if args.mode in ("frames", "all"):
        (out / "frames").mkdir(exist_ok=True)
        scene.render.filepath = str(out / "frames" / "frame_")
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
