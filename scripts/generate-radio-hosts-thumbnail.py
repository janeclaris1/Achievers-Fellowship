#!/usr/bin/env python3
"""Build radio-hosts-studio-thumbnail.jpg from the real host photos (faces unchanged)."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'public' / 'departments'
W, H = 1280, 720


def fit_cover(img: Image.Image, tw: int, th: int, focus_y: float = 0.2) -> Image.Image:
    iw, ih = img.size
    scale = max(tw / iw, th / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = int((nh - th) * focus_y)
    top = max(0, min(top, nh - th))
    return resized.crop((left, top, left + tw, top + th))


def main() -> None:
    sister = Image.open(BASE / 'hosts' / 'sister-host.png').convert('RGB')
    brother = Image.open(BASE / 'hosts' / 'brother-host.png').convert('RGB')
    studio_bg = Image.open(BASE / 'radio-outreach-hero.png').convert('RGB')

    canvas = fit_cover(studio_bg, W, H, focus_y=0.45)
    canvas = Image.blend(canvas, Image.new('RGB', (W, H), (25, 18, 45)), 0.35)

    half = W // 2
    left_panel = fit_cover(sister, half + 40, H, focus_y=0.08)
    right_panel = fit_cover(brother, half + 40, H, focus_y=0.02)
    canvas.paste(left_panel, (-20, 0))
    canvas.paste(right_panel, (half - 20, 0))

    console = fit_cover(studio_bg, W, 180, focus_y=0.85).filter(ImageFilter.GaussianBlur(1))
    canvas.paste(console, (0, H - 140))

    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(H):
        if y < 80:
            alpha = int(90 * (1 - y / 80))
            od.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
        if y > H - 200:
            alpha = int(200 * (y - (H - 200)) / 200)
            od.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
    canvas = Image.alpha_composite(canvas.convert('RGBA'), overlay).convert('RGB')

    draw = ImageDraw.Draw(canvas)
    draw.line([(half, 40), (half, H - 140)], fill=(255, 255, 255), width=2)

    badge_w, badge_h = 220, 36
    badge = Image.new('RGBA', (badge_w, badge_h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    bd.rounded_rectangle((0, 0, badge_w - 1, badge_h - 1), radius=18, fill=(220, 38, 38, 235))
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 15)
    except OSError:
        font = ImageFont.load_default()
    bd.text((badge_w // 2, badge_h // 2), 'ACHIEVERS RADIO', fill='white', font=font, anchor='mm')
    canvas.paste(badge, (W - badge_w - 20, 16), badge)

    out = BASE / 'radio-hosts-studio-thumbnail.jpg'
    canvas.save(out, 'JPEG', quality=92, optimize=True)
    print(f'Wrote {out}')


if __name__ == '__main__':
    main()
