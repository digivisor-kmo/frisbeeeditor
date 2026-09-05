#!/usr/bin/env python3
"""Build the app icons from the club badge.

The duck is cut out of the badge by its own outline, not by a hand-typed
rectangle. A hand-typed one is how the first set ended up with the bird's belly
sliced off flat: the numbers looked right and nobody looked at the picture.

Usage:
    python3 scripts/maak-iconen.py scripts/bron-embleem.png

It writes the four PNGs into public/ and, beside the script,
uitsnede-controle.png: the badge with the box it found drawn on it. Look at
that file before you commit anything.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

BLAUW = (0x34, 0x52, 0xFE)
WIT = (255, 255, 255)

# The duck sits in the middle of the badge; the ring of lettering around it is
# a separate shape. Keep only the blob that covers the centre of the image.
DREMPEL = 128


def inktmasker(bron: Image.Image) -> np.ndarray:
    """True where there is ink: dark pixels, or opaque ones on a clear ground."""
    rgba = bron.convert("RGBA")
    arr = np.asarray(rgba).astype(np.int16)
    alpha = arr[:, :, 3]
    grijs = arr[:, :, :3].mean(axis=2)
    if (alpha < 250).mean() > 0.05:
        return alpha > 128
    return grijs < DREMPEL


def grootste_blob_bij_midden(masker: np.ndarray) -> np.ndarray:
    """The connected component nearest the centre, grown with a flood fill."""
    h, w = masker.shape
    bezocht = np.zeros_like(masker, dtype=bool)
    beste: np.ndarray | None = None
    beste_score = -1.0
    mid = np.array([h / 2, w / 2])
    ys, xs = np.nonzero(masker)
    for y0, x0 in zip(ys, xs):
        if bezocht[y0, x0]:
            continue
        stapel = [(int(y0), int(x0))]
        bezocht[y0, x0] = True
        blob = np.zeros_like(masker, dtype=bool)
        blob[y0, x0] = True
        while stapel:
            y, x = stapel.pop()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and masker[ny, nx] and not bezocht[ny, nx]:
                    bezocht[ny, nx] = True
                    blob[ny, nx] = True
                    stapel.append((ny, nx))
        oppervlak = blob.sum()
        by, bx = np.nonzero(blob)
        zwaartepunt = np.array([by.mean(), bx.mean()])
        afstand = np.linalg.norm(zwaartepunt - mid) / max(h, w)
        score = oppervlak * (1.0 - min(afstand, 0.99))
        if score > beste_score:
            beste_score, beste = score, blob
    if beste is None:
        raise SystemExit("geen inkt gevonden in de bron")
    return beste


def vierkant_met_marge(kader: tuple[int, int, int, int], marge: float) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = kader
    b, h = x1 - x0, y1 - y0
    zijde = max(b, h) * (1 + 2 * marge)
    cx, cy = x0 + b / 2, y0 + h / 2
    return (
        int(round(cx - zijde / 2)),
        int(round(cy - zijde / 2)),
        int(round(cx + zijde / 2)),
        int(round(cy + zijde / 2)),
    )


def teken(silhouet: Image.Image, maat: int, radius: float, vulling: float) -> Image.Image:
    """The duck in white on club blue, filling `vulling` of the tile."""
    doek = Image.new("RGBA", (maat, maat), (0, 0, 0, 0))
    grond = Image.new("RGBA", (maat, maat), BLAUW + (255,))
    if radius > 0:
        vorm = Image.new("L", (maat, maat), 0)
        ImageDraw.Draw(vorm).rounded_rectangle(
            (0, 0, maat - 1, maat - 1), radius=int(maat * radius), fill=255
        )
        doek.paste(grond, (0, 0), vorm)
    else:
        doek.paste(grond, (0, 0))

    breed = int(maat * vulling)
    schaal = breed / max(silhouet.size)
    nieuw = (max(1, int(silhouet.width * schaal)), max(1, int(silhouet.height * schaal)))
    eend = silhouet.resize(nieuw, Image.LANCZOS)
    doek.alpha_composite(eend, ((maat - nieuw[0]) // 2, (maat - nieuw[1]) // 2))
    return doek


def main() -> None:
    bron_pad = Path(sys.argv[1] if len(sys.argv) > 1 else "scripts/bron-embleem.png")
    uit = Path("public")
    bron = Image.open(bron_pad)
    masker = inktmasker(bron)
    blob = grootste_blob_bij_midden(masker)
    ys, xs = np.nonzero(blob)
    kader = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    raakt = [
        naam
        for naam, waar in (
            ("links", kader[0] <= 0),
            ("boven", kader[1] <= 0),
            ("rechts", kader[2] >= bron.width),
            ("onder", kader[3] >= bron.height),
        )
        if waar
    ]
    print(f"bron {bron.size}, eend {kader}")
    if raakt:
        print(f"LET OP: de vorm raakt de rand ({', '.join(raakt)}) — de bron is zelf al afgesneden")

    # The silhouette in white, with the shape's own alpha.
    alpha = Image.fromarray((blob * 255).astype(np.uint8), "L").crop(kader)
    silhouet = Image.new("RGBA", alpha.size, WIT + (0,))
    silhouet.putalpha(alpha)

    controle = bron.convert("RGB").copy()
    ImageDraw.Draw(controle).rectangle(kader, outline=(255, 0, 0), width=max(1, bron.width // 200))
    controle_pad = Path(__file__).parent / "uitsnede-controle.png"
    controle.save(controle_pad)
    print("controlebeeld", controle_pad)

    for naam, maat, radius, vulling in (
        ("icoon-192.png", 192, 0.22, 0.66),
        ("icoon-512.png", 512, 0.22, 0.66),
        ("apple-touch-icon.png", 180, 0.0, 0.66),
        # Maskable: everything outside the middle 80% can be cropped away.
        ("icoon-maskable-512.png", 512, 0.0, 0.52),
    ):
        teken(silhouet, maat, radius, vulling).save(uit / naam)
        print("geschreven", uit / naam)


if __name__ == "__main__":
    main()
