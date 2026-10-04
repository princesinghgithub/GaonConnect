"""public/ ki vehicle photos ko card ke liye taiyaar karta hai -> public/vehicles/

Asli photos app ke ek screenshot grid se cati hui hain, isliye teen dikkat hain:
  1. Har photo ke andar apna English label pill baked hai ("Auto", "Bike").
     Card apna naam Hindi mein dikhata hai, to wo label duplicate aur galat
     bhasha mein aa jaata tha.
  2. Har photo apna gehra studio background le kar aati hai. Safed card par wo
     ek kaala chaukor ban kar chubhta hai.
  3. Sizes alag-alag hain (256x275, 192x165, 192x185, 192x215), to ek hi grid
     mein har card ki gaadi alag naap ki dikhti thi.

Ye script label kaat kar, background hata kar (transparent PNG jaisa cutout),
sabko ek hi naap ke canvas par beech mein rakh deti hai. Cutout kisi bhi rang ke
card par baithta hai — light ho ya dark — isliye kuch chubhta nahi.

Nayi photo public/ mein daalne ke baad dobara chala dena:
    python scripts/normalize_service_images.py
"""
from PIL import Image, ImageFilter
from collections import deque
import numpy as np
import os

SRC, OUT = 'public', 'public/vehicles'
TW, TH = 360, 270              # sab cutouts ek hi canvas par, taaki grid barabar dikhe
PAD    = 0.05                  # canvas ke kinare thodi saans
KEEP   = 0.79                  # neeche ka 21% = baked-in label, hata do
INSET  = 0.06                  # kinare par bagal wali tile ka tukda aa jaata hai
DEG    = 5                     # background gradient ka polynomial degree
THR    = 30.0                  # background model se itna door = gaadi
LOCAL  = 16.0                  # flood fill ki local tolerance
ROUNDS = 4

NAMES = [
    # services grid + BookRide ke vehicle cards
    'auto', 'bike', 'car', 'tractor', 'sedan', 'truck', 'tempo', 'pickup',
    'jcb', 'thresher', 'harvester',
    # tractor/JCB sub-services
    'plough', 'rotavator', 'seed_drill', 'trolley', 'tipper', 'trailer',
    'sprayer', 'straw_reaper', 'rake', 'water_tanker',
    'jcb_excavator', 'leveler', 'jcb_loader', 'jcb_backhoe',
]


def fit_background(a, mask, deg=DEG):
    """Background ek smooth studio gradient hai — uspar 2D polynomial fit."""
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    Y, X = (yy / h).ravel(), (xx / w).ravel()
    A = np.stack([X**i * Y**j for i in range(deg + 1) for j in range(deg + 1 - i)], 1)
    sel = mask.ravel()
    est = np.zeros_like(a, dtype=np.float32)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A[sel], a[..., c].ravel()[sel].astype(np.float32), rcond=None)
        est[..., c] = (A @ coef).reshape(h, w)
    return est


def flood_from_border(maybe, dist):
    """Background wahi hai jo kinare se juda ho — gaadi ke andar ka koi patch
    galti se na kate."""
    h, w = maybe.shape
    bg = np.zeros((h, w), bool)
    q = deque()
    seeds = [(y, x) for x in range(w) for y in (0, h - 1)] + \
            [(y, x) for y in range(h) for x in (0, w - 1)]
    for y, x in seeds:
        if maybe[y, x] and not bg[y, x]:
            bg[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and maybe[ny, nx]:
                if abs(float(dist[ny, nx]) - float(dist[y, x])) < LOCAL:
                    bg[ny, nx] = True
                    q.append((ny, nx))
    return bg


def keep_main_parts(fg, frac=0.15, edge_frac=0.40):
    """Bagal wali tile ke tukde aur chhoti specks hata do.

    Do niyam: bahut chhota tukda gaadi ka hissa nahi hai; aur jo tukda daayen ya
    baayen kinare ko chhoo raha hai wo aam taur par padosi tile ka bacha hua
    hissa hota hai (asli gaadi inset ke baad beech mein rehti hai), isliye uske
    liye shart aur sakht hai."""
    h, w = fg.shape
    lab = np.zeros((h, w), np.int32)
    sizes, touches_side, n = [0], [False], 0
    for sy in range(h):
        for sx in range(w):
            if fg[sy, sx] and lab[sy, sx] == 0:
                n += 1
                cnt, side = 0, False
                q = deque([(sy, sx)])
                lab[sy, sx] = n
                while q:
                    y, x = q.popleft()
                    cnt += 1
                    if x == 0 or x == w - 1:
                        side = True
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and lab[ny, nx] == 0:
                            lab[ny, nx] = n
                            q.append((ny, nx))
                sizes.append(cnt)
                touches_side.append(side)
    if n == 0:
        return fg
    biggest = max(sizes)
    good = {i for i, s in enumerate(sizes)
            if i and s >= biggest * (edge_frac if touches_side[i] else frac)}
    return np.isin(lab, list(good))


os.makedirs(OUT, exist_ok=True)

for name in NAMES:
    src = os.path.join(SRC, name + '.webp')
    if not os.path.exists(src):
        print('SKIP (missing)', src)
        continue

    im = Image.open(src).convert('RGB')
    W, H = im.size
    im = im.crop((int(W * INSET), 0, int(W * (1 - INSET)), int(H * KEEP)))
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape

    # Kinare ki patti se shuru; har round mein model ko ab tak mile background
    # par dobara fit karte hain. Sirf kinare se fit karne par beech ka radial
    # glow model mein aata hi nahi tha aur gaadi ke peechhe halo bach jaata tha.
    mask = np.zeros((h, w), bool)
    r = 6
    mask[:r, :] = mask[-r:, :] = mask[:, :r] = mask[:, -r:] = True
    for _ in range(ROUNDS):
        est = fit_background(a, mask)
        dist = np.sqrt(((a - est) ** 2).sum(2))
        mask = flood_from_border(dist < THR, dist)

    fg = keep_main_parts(~mask)
    if not fg.any():
        print('SKIP (kuch nahi mila)', name)
        continue

    alpha = Image.fromarray(np.where(fg, 255, 0).astype(np.uint8), 'L')
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))
    cut = im.convert('RGBA')
    cut.putalpha(alpha)
    cut = cut.crop(cut.getbbox())

    # Ek hi canvas par beech mein — sab cards mein gaadi barabar dikhe
    box_w, box_h = int(TW * (1 - 2 * PAD)), int(TH * (1 - 2 * PAD))
    s = min(box_w / cut.width, box_h / cut.height)
    cut = cut.resize((max(1, int(cut.width * s)), max(1, int(cut.height * s))), Image.LANCZOS)

    canvas = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
    canvas.paste(cut, ((TW - cut.width) // 2, (TH - cut.height) // 2), cut)
    canvas.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=88, method=6)
    print('%-16s %sx%s -> cutout %sx%s' % (name, W, H, TW, TH))
