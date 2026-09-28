#!/usr/bin/env python3
"""
Turn the source film clips into the browser image sequence + manifest.

    python3 tools/extract_frames.py            # uses media-src/film/*.mp4

Output (always into a fresh staging dir, then swapped in):
    public/media/film/l/f-0000.webp ...   landscape set, 1600x900
    public/media/film/p/f-0000.webp ...   portrait crop around the summit, 640x960
    public/media/film/manifest.json       counts, clip offsets, sizes, focus

The grade is applied here, once, to every clip, so seams never shift colour:
it pulls Kling's teal drift back to the brand's green-black and lifts nothing.
Needs ffmpeg with libwebp (system ffmpeg, or `pip install imageio-ffmpeg`).
"""
import json, os, shutil, subprocess, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "media-src", "film")
OUT = os.path.join(ROOT, "public", "media", "film")

# clip id, file, sampling fps. A and C carry the most visible motion.
CLIPS = [("A", "A-line-to-ridge.mp4", 14), ("B", "B-first-light.mp4", 11), ("C", "C-above-the-clouds.mp4", 13)]
LAND = (1600, 900)
PORT = (640, 960)
FOCUS = (0.645, 0.40)          # the summit, as a fraction of the frame
LINE_Y = 0.383                 # height of the line of light in frame 0
# Measured: raw sky mid-clip A ≈ rgb(0,21,21) teal → graded ≈ rgb(4,20,13); brand void is rgb(4,20,10).
GRADE = "colorbalance=rs=0.025:gs=-0.005:bs=-0.04:bm=-0.025,eq=saturation=0.8"
Q_LAND, Q_PORT = 72, 70


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found: install ffmpeg or `pip install imageio-ffmpeg`")


def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main():
    ff = ffmpeg()
    stage = OUT + ".staging"
    shutil.rmtree(stage, ignore_errors=True)
    os.makedirs(os.path.join(stage, "l"))
    os.makedirs(os.path.join(stage, "p"))

    clips, total = [], 0
    for cid, name, fps in CLIPS:
        src = os.path.join(SRC, name)
        if not os.path.exists(src):
            sys.exit(f"missing {src}")
        tmp = os.path.join(stage, "tmp_" + cid)
        os.makedirs(tmp)
        # landscape
        run([ff, "-y", "-i", src, "-an", "-vf",
             f"fps={fps},{GRADE},scale={LAND[0]}:{LAND[1]}:flags=lanczos,setsar=1",
             "-c:v", "libwebp", "-quality", str(Q_LAND), "-compression_level", "6",
             os.path.join(tmp, "l-%04d.webp")])
        # portrait: crop a 2:3 window centred on the summit from the full-height source
        cw = f"trunc(ih*{PORT[0]}/{PORT[1]}/2)*2"
        cx = f"max(0\\,min(iw-{cw}\\,iw*{FOCUS[0]}-{cw}/2))"
        run([ff, "-y", "-i", src, "-an", "-vf",
             f"fps={fps},{GRADE},crop={cw}:ih:{cx}:0,scale={PORT[0]}:{PORT[1]}:flags=lanczos,setsar=1",
             "-c:v", "libwebp", "-quality", str(Q_PORT), "-compression_level", "6",
             os.path.join(tmp, "p-%04d.webp")])
        lf = sorted(glob.glob(os.path.join(tmp, "l-*.webp")))
        pf = sorted(glob.glob(os.path.join(tmp, "p-*.webp")))
        n = min(len(lf), len(pf))
        for k in range(n):
            os.rename(lf[k], os.path.join(stage, "l", f"f-{total + k:04d}.webp"))
            os.rename(pf[k], os.path.join(stage, "p", f"f-{total + k:04d}.webp"))
        clips.append({"id": cid, "file": name, "fps": fps, "start": total, "frames": n})
        total += n
        shutil.rmtree(tmp)
        print(f"clip {cid}: {n} frames")

    size = lambda d: sum(os.path.getsize(f) for f in glob.glob(os.path.join(stage, d, "*.webp")))
    manifest = {
        "count": total,
        "clips": clips,
        "lineY": LINE_Y,
        "sets": {
            "landscape": {"path": "media/film/l/", "prefix": "f-", "ext": ".webp", "pad": 4,
                          "width": LAND[0], "height": LAND[1], "focus": [FOCUS[0], FOCUS[1]], "bytes": size("l")},
            "portrait": {"path": "media/film/p/", "prefix": "f-", "ext": ".webp", "pad": 4,
                         "width": PORT[0], "height": PORT[1], "focus": [0.5, FOCUS[1]], "bytes": size("p")},
        },
        "grade": GRADE,
    }
    with open(os.path.join(stage, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)

    shutil.rmtree(OUT, ignore_errors=True)
    os.rename(stage, OUT)
    print(json.dumps({k: manifest[k] for k in ("count", "clips")}, indent=1))
    print("landscape %.1f MB, portrait %.1f MB" % (manifest["sets"]["landscape"]["bytes"] / 1e6, manifest["sets"]["portrait"]["bytes"] / 1e6))


if __name__ == "__main__":
    main()
