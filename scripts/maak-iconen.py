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

# The duck sits in the middle of the badge. Whatever surrounds it — a ring of
# lettering, or nothing at all — is judged against the colour of the border.
AFSTAND = 60.0


def inktmasker(bron: Image.Image) -> np.ndarray:
    """True where the drawing is, whichever way round the colours run.

    A badge can be black on white, white on blue, or a shape on nothing. So the
    ground is read from the border of the image and everything far enough from
    that colour counts as drawing. That way the same code cuts out a dark duck
    and a light one.
    """
    rgba = bron.convert("RGBA")
    arr = np.asarray(rgba).astype(np.float64)
    alpha = arr[:, :, 3]
    if (alpha < 250).mean() > 0.05:
        return alpha > 128
    rand = np.concatenate([arr[0, :, :3], arr[-1, :, :3], arr[:, 0, :3], arr[:, -1, :3]])
    grond = np.median(rand, axis=0)
    return np.linalg.norm(arr[:, :, :3] - grond, axis=2) > AFSTAND


def _componenten(masker: np.ndarray) -> list[np.ndarray]:
    """Every connected run of drawing, biggest first."""
    h, w = masker.shape
    bezocht = np.zeros_like(masker, dtype=bool)
    gevonden: list[np.ndarray] = []
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
        gevonden.append(blob)
    gevonden.sort(key=lambda b: int(b.sum()), reverse=True)
    return gevonden


def _kader(blob: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(blob)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def eendmasker(masker: np.ndarray) -> np.ndarray:
    """The bird: the biggest shape, plus the loose bits that lie inside it.

    A beak tip or a crest feather can be cut off from the body by a hairline of
    background. Dropping those would eat the bird piece by piece, so anything
    whose box falls inside the body's box comes along.
    """
    delen = _componenten(masker)
    if not delen:
        raise SystemExit("geen tekening gevonden in de bron")
    romp = delen[0]
    x0, y0, x1, y1 = _kader(romp)
    marge_x, marge_y = (x1 - x0) * 0.04, (y1 - y0) * 0.04
    samen = romp.copy()
    for deel in delen[1:]:
        dx0, dy0, dx1, dy1 = _kader(deel)
        binnen = (
            dx0 >= x0 - marge_x
            and dy0 >= y0 - marge_y
            and dx1 <= x1 + marge_x
            and dy1 <= y1 + marge_y
        )
        if binnen:
            samen |= deel
    return samen


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
    blob = eendmasker(masker)
    kader = _kader(blob)
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
        ("icoon-192.png", 192, 0.22, 0.76),
        ("icoon-512.png", 512, 0.22, 0.76),
        # iOS rounds the corners itself, so leave it a little more room.
        ("apple-touch-icon.png", 180, 0.0, 0.70),
        # Maskable: everything outside the middle 80% can be cropped away.
        ("icoon-maskable-512.png", 512, 0.0, 0.60),
    ):
        teken(silhouet, maat, radius, vulling).save(uit / naam)
        print("geschreven", uit / naam)


if __name__ == "__main__":
    main()
