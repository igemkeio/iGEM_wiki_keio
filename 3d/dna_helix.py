"""DNA二重らせんのシーンを組み、glb・ループ動画のフレーム・ポスターを書き出す。

実行例:
  blender -b -P 3d/dna_helix.py -- --mode all --out 3d/out
"""

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

# tokens.cssの色。sRGBのhexで持ち、マテリアルに渡すときに線形に直す。
COLORS = {
    "ink": "#0d0f12",
    "page": "#dfe4ea",
    "orange": "#ffb347",
    "blue": "#2962ff",
    "muted": "#5d646e",
}

# らせんの形。半径1に対して1巻きで3.4上がるのはB型DNAの比率。
HELIX = {
    "radius": 1.0,
    "rise_per_turn": 3.4,
    "turns": 2.5,
    "pairs_per_turn": 10,
    "strand_phase": math.radians(126),
    "atom_radius": 0.16,
    "bond_radius": 0.07,
    "rung_radius": 0.08,
    "tilt_deg": 18.0,
}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["glb", "frames", "poster", "all"], default="all")
    p.add_argument("--out", default="3d/out")
    p.add_argument("--frames", type=int, default=300)
    p.add_argument("--fps", type=int, default=30)
    p.add_argument("--res", default="1920x1080")
    p.add_argument("--poster-res", default="1600x1200")
    p.add_argument("--samples", type=int, default=32)
    # 動画は背景なので画面からはみ出させ、ポスターは全体を収める。
    p.add_argument("--frame-distance", type=float, default=11.0)
    p.add_argument("--poster-distance", type=float, default=15.0)
    p.add_argument("--save-blend", action="store_true")
    return p.parse_args(argv)


def srgb_to_linear(hex_color):
    def channel(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    h = hex_color.lstrip("#")
    return tuple(channel(int(h[i : i + 2], 16)) for i in (0, 2, 4)) + (1.0,)


def make_material(name, hex_color, roughness=0.35, metallic=0.0):
    mat = bpy.data.materials.new(name)
    if not mat.use_nodes:
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = srgb_to_linear(hex_color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def add_sphere(location, radius, material):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16, ring_count=8, radius=radius, location=location
    )
    obj = bpy.context.object
    obj.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return obj


def add_bond(start, end, radius, material):
    direction = end - start
    length = direction.length
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12, radius=radius, depth=length, location=(start + end) / 2
    )
    obj = bpy.context.object
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return obj


def helix_point(t, phase):
    angle = 2 * math.pi * HELIX["turns"] * t + phase
    z = HELIX["rise_per_turn"] * HELIX["turns"] * (t - 0.5)
    return Vector(
        (HELIX["radius"] * math.cos(angle), HELIX["radius"] * math.sin(angle), z)
    )


def join(objects, name):
    if not objects:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    joined = bpy.context.object
    joined.name = name
    return joined


def build_helix(materials):
    pairs = int(HELIX["turns"] * HELIX["pairs_per_turn"])
    # 骨格はリング間に3個の球を挟み、滑らかに見せる。
    subdiv = 3
    strands = {"a": [], "b": []}
    bonds = {"a": [], "b": []}
    rungs = {"orange": [], "blue": []}

    for key, phase in (("a", 0.0), ("b", HELIX["strand_phase"])):
        n = pairs * subdiv
        pts = [helix_point(i / n, phase) for i in range(n + 1)]
        for pt in pts:
            strands[key].append(add_sphere(pt, HELIX["atom_radius"], materials[key]))
        for s, e in zip(pts, pts[1:]):
            bonds[key].append(add_bond(s, e, HELIX["bond_radius"], materials[key]))

    for i in range(pairs + 1):
        t = i / pairs
        a = helix_point(t, 0.0)
        b = helix_point(t, HELIX["strand_phase"])
        mid = (a + b) / 2
        # 塩基対は中央で色を分け、対になっていることを見せる。
        first, second = ("orange", "blue") if i % 2 == 0 else ("blue", "orange")
        rungs[first].append(add_bond(a, mid, HELIX["rung_radius"], materials[first]))
        rungs[second].append(add_bond(mid, b, HELIX["rung_radius"], materials[second]))

    parts = [
        join(strands["a"] + bonds["a"], "StrandA"),
        join(strands["b"] + bonds["b"], "StrandB"),
        join(rungs["orange"], "RungsOrange"),
        join(rungs["blue"], "RungsBlue"),
    ]
    return [p for p in parts if p]


def build_rig(parts, frames):
    bpy.ops.object.empty_add(type="PLAIN_AXES")
    spin = bpy.context.object
    spin.name = "Spin"
    for p in parts:
        p.parent = spin

    bpy.ops.object.empty_add(type="PLAIN_AXES")
    root = bpy.context.object
    root.name = "DNA"
    root.rotation_euler = (0.0, math.radians(HELIX["tilt_deg"]), 0.0)
    spin.parent = root

    # 最終フレームの次で1回転するので、先頭に戻っても継ぎ目が出ない。等速にしないと継ぎ目で止まって見える。
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
    spin.rotation_euler = (0.0, 0.0, 0.0)
    spin.keyframe_insert("rotation_euler", frame=1)
    spin.rotation_euler = (0.0, 0.0, 2 * math.pi)
    spin.keyframe_insert("rotation_euler", frame=frames + 1)
    return root


def setup_world_and_lights(scene):
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = srgb_to_linear(COLORS["page"])
    bg.inputs["Strength"].default_value = 1.0

    bpy.ops.object.light_add(type="SUN", location=(4, -4, 8))
    sun = bpy.context.object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(45), math.radians(15), math.radians(35))

    bpy.ops.object.light_add(type="AREA", location=(-5, 3, 4))
    fill = bpy.context.object
    fill.data.energy = 400.0
    fill.data.size = 6.0
    fill.rotation_euler = (math.radians(60), 0.0, math.radians(-120))


def setup_camera(scene, distance):
    bpy.ops.object.camera_add(location=(0.4, -distance, 0.3))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(88.5), 0.0, 0.0)
    cam.data.lens = 35
    scene.camera = cam
    return cam


def pick_engine(scene):
    names = {
        e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items
    }
    for candidate in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        if candidate in names:
            scene.render.engine = candidate
            return


def setup_render(scene, args):
    pick_engine(scene)
    scene.frame_start = 1
    scene.frame_end = args.frames
    scene.render.fps = args.fps
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    # hexの色をそのまま出したいのでAgXやFilmicは使わない。
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    if hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = args.samples


def set_resolution(scene, text):
    w, h = (int(v) for v in text.lower().split("x"))
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.resolution_percentage = 100


def export_glb(path):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_animations=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )


def main():
    args = parse_args()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    scene = reset_scene()
    materials = {
        "a": make_material("StrandInk", COLORS["ink"], roughness=0.4),
        "b": make_material("StrandMuted", COLORS["muted"], roughness=0.4),
        "orange": make_material("Orange", COLORS["orange"], roughness=0.3),
        "blue": make_material("Blue", COLORS["blue"], roughness=0.3),
    }
    parts = build_helix(materials)
    build_rig(parts, args.frames)
    setup_world_and_lights(scene)
    cam = setup_camera(scene, args.poster_distance)
    setup_render(scene, args)

    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=str(out / "dna_helix.blend"))

    if args.mode in ("glb", "all"):
        export_glb(out / "dna-helix.glb")

    if args.mode in ("poster", "all"):
        set_resolution(scene, args.poster_res)
        scene.frame_set(1)
        scene.render.filepath = str(out / "dna-helix-poster.png")
        bpy.ops.render.render(write_still=True)

    if args.mode in ("frames", "all"):
        cam.location.y = -args.frame_distance
        set_resolution(scene, args.res)
        frames_dir = out / "frames"
        frames_dir.mkdir(exist_ok=True)
        scene.render.filepath = str(frames_dir / "frame_")
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
