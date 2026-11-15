"""Add dahlia photos to the shop.

1. Put photos in a folder, each named after its variety. For several photos of
   one variety, number them in the order you want them shown:
     "Thomas Edison 1.jpg", "Thomas Edison 2.jpg", "cafe au lait.png"
   (capitals, spaces and accents don't matter).
2. Run from the site folder:
     python3 tools/add-dahlia-photos.py path/to/photo-folder
3. Each photo is cropped to a centered square, resized to 1000 x 1000,
   saved as images/dahlias/<variety>-1.webp, -2.webp ..., and linked in
   js/catalog.js as that variety's gallery. Re-running replaces the gallery.

Needs Python 3 with Pillow:  pip install Pillow
"""
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

SITE = Path(__file__).resolve().parent.parent
CATALOG = SITE / "js" / "catalog.js"
OUT = SITE / "images" / "dahlias"
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}


def slug(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def main(folder):
    src = Path(folder)
    if not src.is_dir():
        sys.exit(f"Folder not found: {src}")
    catalog = CATALOG.read_text()
    # match a photo by the variety's id or by the name shown on the site
    known = {}
    for sid, name in re.findall(r'^\s*"tuber-([a-z0-9-]+)":\s*\{\s*name:\s*"([^"]*)"', catalog, flags=re.M):
        known[sid] = sid
        known[slug(re.sub(r"\(.*?\)", "", name.replace("Dahlia tuber:", "")))] = sid
    OUT.mkdir(parents=True, exist_ok=True)
    groups, skipped = {}, []
    for f in sorted(src.iterdir(), key=lambda p: p.name.lower()):
        if f.suffix.lower() not in EXTS:
            continue
        stem = f.stem.split(".")[0]
        m = re.match(r"^(.*?)[\s_-]*(\d+)?$", stem)          # "Thomas Edison 2" -> ("Thomas Edison", 2)
        s, n = slug(m.group(1)), int(m.group(2) or 0)
        if s not in known:
            skipped.append(f.name)
            continue
        s = known[s]
        groups.setdefault(s, []).append((n, f))
    for s, files in groups.items():
        paths = []
        for i, (_, f) in enumerate(sorted(files, key=lambda x: (x[0], x[1].name.lower())), start=1):
            im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
            side = min(im.size)
            left, top = (im.width - side) // 2, (im.height - side) // 2
            im = im.crop((left, top, left + side, top + side)).resize((1000, 1000), Image.LANCZOS)
            im.save(OUT / f"{s}-{i}.webp", quality=82)
            paths.append(f"images/dahlias/{s}-{i}.webp")
        line_re = re.compile(rf'^(\s*"tuber-{re.escape(s)}":\s*\{{)(.*?)(\}},?)$', re.M)
        def link(m):
            body = re.sub(r',?\s*photos?:\s*(\[[^\]]*\]|"[^"]*")', "", m.group(2)).rstrip()
            return f'{m.group(1)}{body}, photos: [{", ".join(chr(34) + p + chr(34) for p in paths)}] {m.group(3)}'
        catalog = line_re.sub(link, catalog, count=1)
    CATALOG.write_text(catalog)
    print(f"Added photos for {len(groups)} variet{'y' if len(groups) == 1 else 'ies'}:")
    for s, files in groups.items():
        print(f"  {s}: {len(files)} photo(s)")
    if skipped:
        print("Not matched to a variety (check the file name):")
        for name in skipped:
            print("  " + name)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
