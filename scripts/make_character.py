from rembg import remove, new_session
from PIL import Image
import os

SRC = "F:/aigirl/assets/character_raw.png"
OUT_DIR = "F:/aigirl/renderer/models/character"
OUT = os.path.join(OUT_DIR, "character.png")

os.makedirs(OUT_DIR, exist_ok=True)
im = Image.open(SRC).convert("RGBA")
session = new_session("u2net")
cut = remove(im, session=session)
alpha = cut.split()[-1]
bbox = alpha.getbbox()
print("alpha bbox:", bbox)

pad = 8
x0 = max(0, bbox[0] - pad)
y0 = max(0, bbox[1] - pad)
x1 = min(cut.width, bbox[2] + pad)
y1 = min(cut.height, bbox[3] + pad)
crop = cut.crop((x0, y0, x1, y1))
crop.save(OUT)
print("saved", OUT, crop.size)
