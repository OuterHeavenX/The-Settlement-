# High-fidelity building art slots

The runtime supports transparent WebP building sprites with `Architecture2D` as a safe fallback. No visual choice is stored in save data.

Use painterly/isometric medieval strategy-game artwork on transparent backgrounds with a consistent camera and light direction. Keep silhouette readability strong at iPhone gameplay scale. Artwork may extend vertically beyond the logical footprint; keep the ground contact point near the bottom-center.

Recommended source size: roughly 512–1024 px on the longest side depending on complexity. Optional `*-low.webp` files are optimized LOW-quality variants.

For each of `cottage`, `bakery`, `mill`, `blacksmith`, `warehouse`, `quarry`, `training`, `archery`, and `lumber`, provide `basic.webp`, `established.webp`, `advanced.webp`, and `master.webp`. The same slots are wired for `barracks`, `mason`, `ironMine`, `smelter`, and `market`.

Town Hall keeps seven City Era stages and expects `mainHall/era-1-settlement.webp`, `era-2-hamlet.webp`, `era-3-village.webp`, `era-4-town.webp`, `era-5-walled-town.webp`, `era-6-city.webp`, and `era-7-great-city.webp`. Optional LOW versions insert `-low` before `.webp`.
