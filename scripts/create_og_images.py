"""Generate OG preview images for social media sharing."""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'img')
os.makedirs(OUT_DIR, exist_ok=True)

FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

# Colors matching the site
BLUE_DARK = (0, 90, 135)
BLUE_MID = (0, 158, 219)
WHITE = (255, 255, 255)
LIGHT_GRAY = (200, 215, 225)


def draw_gradient(draw, w, h, color1, color2):
    for y in range(h):
        r = int(color1[0] + (color2[0] - color1[0]) * y / h)
        g = int(color1[1] + (color2[1] - color1[1]) * y / h)
        b = int(color1[2] + (color2[2] - color1[2]) * y / h)
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def center_text(draw, text, font, y, fill, width=W):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)


def draw_globe_circle(draw, cx, cy, r):
    """Draw a simple stylized globe."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=WHITE, width=3)
    # Horizontal lines
    for offset in [-r * 0.5, 0, r * 0.5]:
        y = cy + offset
        # Calculate x extent at this y
        import math
        dy = abs(offset)
        if dy < r:
            dx = math.sqrt(r * r - dy * dy)
            draw.line([(cx - dx, y), (cx + dx, y)], fill=WHITE, width=2)
    # Vertical ellipse (meridian)
    draw.ellipse([cx - r * 0.35, cy - r, cx + r * 0.35, cy + r], outline=WHITE, width=2)
    # Another meridian
    draw.ellipse([cx - r * 0.7, cy - r, cx + r * 0.7, cy + r], outline=WHITE, width=2)


def create_main_preview():
    img = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(img)
    draw_gradient(draw, W, H, BLUE_DARK, BLUE_MID)

    # Subtle decorative line at top
    draw.rectangle([0, 0, W, 6], fill=WHITE)

    # Globe
    draw_globe_circle(draw, W // 2, 195, 70)

    # Title
    font_title = ImageFont.truetype(FONT_BOLD, 52)
    center_text(draw, 'Global Prosperity Barometer', font_title, 290, WHITE)

    # Divider line
    line_w = 200
    draw.line([(W // 2 - line_w, 365), (W // 2 + line_w, 365)], fill=LIGHT_GRAY, width=2)

    # Subtitle stats
    font_sub = ImageFont.truetype(FONT_REG, 28)
    center_text(draw, '100 Countries  |  12 Pillars  |  Open Data', font_sub, 385, LIGHT_GRAY)

    # Bottom tagline
    font_small = ImageFont.truetype(FONT_REG, 22)
    center_text(draw, 'Real-time monitoring of global prosperity indicators', font_small, 450, (170, 200, 220))

    # Bottom bar
    draw.rectangle([0, H - 50, W, H], fill=(0, 70, 105))
    font_url = ImageFont.truetype(FONT_REG, 20)
    center_text(draw, 'gpb-world.github.io', font_url, H - 42, LIGHT_GRAY)

    img.save(os.path.join(OUT_DIR, 'og-preview.png'), 'PNG')
    print('Created og-preview.png')


def create_quiz_preview():
    img = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(img)
    draw_gradient(draw, W, H, (0, 70, 110), BLUE_MID)

    # Top bar
    draw.rectangle([0, 0, W, 6], fill=(255, 200, 50))

    # Big emoji-style text
    font_big = ImageFont.truetype(FONT_BOLD, 72)
    center_text(draw, '10/10', font_big, 80, (255, 200, 50))

    # Challenge text
    font_title = ImageFont.truetype(FONT_BOLD, 48)
    center_text(draw, 'Can You Score 10/10?', font_title, 185, WHITE)

    # Divider
    line_w = 180
    draw.line([(W // 2 - line_w, 260), (W // 2 + line_w, 260)], fill=LIGHT_GRAY, width=2)

    # Subtitle
    font_sub = ImageFont.truetype(FONT_REG, 30)
    center_text(draw, 'Prosperity Quiz', font_sub, 280, WHITE)

    # Description
    font_desc = ImageFont.truetype(FONT_REG, 24)
    center_text(draw, 'Democracy  |  GDP  |  Corruption  |  Press Freedom', font_desc, 340, LIGHT_GRAY)
    center_text(draw, '125 countries  |  Real data  |  10 questions', font_desc, 380, (170, 200, 220))

    # Globe
    draw_globe_circle(draw, W // 2, 480, 45)

    # Bottom bar
    draw.rectangle([0, H - 50, W, H], fill=(0, 55, 85))
    font_url = ImageFont.truetype(FONT_REG, 20)
    center_text(draw, 'gpb-world.github.io/quiz', font_url, H - 42, LIGHT_GRAY)

    img.save(os.path.join(OUT_DIR, 'og-quiz.png'), 'PNG')
    print('Created og-quiz.png')


if __name__ == '__main__':
    create_main_preview()
    create_quiz_preview()
