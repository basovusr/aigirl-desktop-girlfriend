from PIL import Image, ImageDraw

def heart(size, path, color=(255, 105, 180, 255)):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size / 2.0
    # simple heart: two circles + triangle
    r = size * 0.24
    cx = size * 0.5
    top = size * 0.32
    d.ellipse([cx - size*0.28, top - r, cx, top + r], fill=color)
    d.ellipse([cx, top - r, cx + size*0.28, top + r], fill=color)
    d.polygon([(cx - size*0.28, top + r*0.55), (cx + size*0.28, top + r*0.55), (cx, size*0.86)], fill=color)
    img.save(path)
    print("saved", path)

heart(32, "F:/aigirl/assets/tray.png")
heart(256, "F:/aigirl/assets/icon.png")
