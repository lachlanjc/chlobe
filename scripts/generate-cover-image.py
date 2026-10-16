"""Generate the Chlobe project cover: globe at 2/3 height + title.

Forked from the palette of website/app/opengraph-image.tsx (Booton SemiBold,
mint #ABF1D0 title on black, globe asset from website/public/opengraph-globe.png).

Usage:
    python scripts/generate-cover-image.py [output-path]

Requires: pillow (`pip install pillow`)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
GLOBE_SRC = ROOT / 'website' / 'public' / 'opengraph-globe.png'
FONT_SRC = ROOT / 'website' / 'app' / 'fonts' / 'Booton-SemiBold.ttf'

W, H = 1440, 720
BG = (0, 0, 0)
MINT = (171, 241, 208)  # #ABF1D0


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'chlobe-cover.webp'

    globe = Image.open(GLOBE_SRC).convert('RGB')
    font = ImageFont.truetype(str(FONT_SRC), 215)

    canvas = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(canvas)

    # Globe: 2/3 of canvas height, fully visible
    gsize = int(H * 2 / 3)
    globe = globe.resize((gsize, gsize), Image.LANCZOS)
    gx, gy = 90, (H - gsize) // 2
    canvas.paste(globe, (gx, gy))

    # Title: as large as fits with generous gap and margin
    text = 'chlobe'
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = W - tw - 90
    ty = (H - th) // 2 - 22
    d.text((tx, ty), text, font=font, fill=MINT)

    canvas.save(out, 'WEBP', quality=92)
    print(f'saved {out} ({W}x{H})')


if __name__ == '__main__':
    main()
