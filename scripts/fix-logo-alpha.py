"""
Make the exterior background of the Knight Ads logo truly transparent.
Uses flood-fill from all 4 corners: any pixel reachable from a border
through "background-like" (low-saturation grayish) pixels gets alpha=0.
The central shield emblem (disconnected from the background) is preserved.
"""
from PIL import Image
import numpy as np
from collections import deque

SRC = '/home/z/my-project/public/knight-logo.png'
OUT = '/home/z/my-project/public/knight-logo.png'

img = Image.open(SRC).convert('RGBA')
arr = np.array(img)
h, w = arr.shape[:2]

r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

# Compute saturation in HSV-ish: max-min / max
mx = np.maximum(np.maximum(r, g), b).astype(np.float32)
mn = np.minimum(np.minimum(r, g), b).astype(np.float32)
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
bright = mx / 255.0

# "Background-like": low saturation (grayish). The cosmic background is grayish
# with some star particles. Allow moderate tolerance to catch the starfield too.
bg_mask = (sat < 0.15) & (bright > 0.35)

# Flood fill from all 4 corners through bg_mask pixels only.
# BFS so we don't cross into the shield.
visited = np.zeros((h, w), dtype=bool)
queue = deque()
corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
for (x, y) in corners:
    if bg_mask[y, x] and not visited[y, x]:
        visited[y, x] = True
        queue.append((x, y))

while queue:
    x, y = queue.popleft()
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx] and bg_mask[ny, nx]:
            visited[ny, nx] = True
            queue.append((nx, ny))

# Pixels visited by the flood fill = exterior background → make transparent
arr[:, :, 3] = np.where(visited, 0, 255)

# Also: anti-alias edges. For pixels at the boundary that are partially background
# (mid saturation), reduce their alpha to soften the shield's outline.
edge = (sat < 0.10) & (bright > 0.40) & (~visited)
arr[:, :, 3] = np.where(edge, np.clip(arr[:, :, 3].astype(np.int32) - 120, 0, 255).astype(np.uint8), arr[:, :, 3])

Image.fromarray(arr).save(OUT)
print(f'Saved {OUT}')

# Verify
v = Image.open(OUT).convert('RGBA')
p = v.load()
transparent = 0; opaque = 0
for y in range(0, v.size[1], 8):
    for x in range(0, v.size[0], 8):
        if p[x, y][3] == 0: transparent += 1
        else: opaque += 1
print(f'After: {transparent} transparent, {opaque} opaque (sampled)')
for corner in [(0,0), (v.size[0]-1, 0), (0, v.size[1]-1), (v.size[0]-1, v.size[1]-1)]:
    print(f'  corner {corner}: rgba={p[corner[0], corner[1]]}')
