# ASSET MAP — RESPA Studio placeholder slots

Prepare your RESPA replacements file-by-file using this table. Keep the same
filename (and viewBox proportions for SVGs) and the swap is drop-in.
Config source of truth: `ASSETS` in `js/data.js`.

| # | Slot | File | Where it appears | Recommended replacement | Notes |
|---|---|---|---|---|---|
| 1 | Logo | `assets/img/logo.svg` | Splash screen, loading screen, black header, yellow footer, login & register cards | SVG or transparent PNG, ~960×320 (3:1), shown 44–56 px tall | Dark-badge style works best: header is black, footer is yellow. Keep clear space around the wordmark. |
| 2 | Mascot character | `assets/img/mascot.svg` | About page hero | Transparent PNG/SVG, 800×880 (about 10:11), full-body chibi | Placeholder is an original generic chibi — replace with the real RESPA mascot, same standing pose area. |
| 3 | Hero / OG image | `assets/img/hero.svg` | Social share preview (`og:image`), About page banner, 404 page | JPG/PNG 1200×630 exactly | If you switch to JPG/PNG, update the `hero` path in `ASSETS` (one line). |
| 4 | Town background | `assets/img/town-bg.svg` | Home — full town scene background | SVG or PNG, 1700×1000 (17:10) | Must keep the layout logic: river left, beach+sea top-right, park centre, path cross. Buildings/NPCs/trees are layered on top in code at fixed coordinates — keep landmarks roughly in place. |
| 5 | Building — EMOTE | `assets/img/building-emote.svg` | Town map, left-lower area → Commission | Transparent PNG/SVG, 480×480 (1:1), shown ~150 px | Orange-roof house slot. Keep the building centred with ground shadow at the bottom. |
| 6 | Building — STREAM KIT | `assets/img/building-streamkit.svg` | Town map, centre-right → Stream Kit | Transparent PNG/SVG, 480×480 (1:1) | Yellow building slot. |
| 7 | Building — ABOUT US | `assets/img/building-about.svg` | Town map, left-centre → About | Transparent PNG/SVG, 480×480 (1:1) | Pink building slot. |
| 8 | Building — GACHA | `assets/img/building-gacha.svg` | Town map, right-upper → Gacha | Transparent PNG/SVG, 480×480 (1:1) | Capsule-machine slot. |
| 9 | Building — VTUBER | `assets/img/building-vtuber.svg` | Town map, right-lower → VTubers | Transparent PNG/SVG, 480×480 (1:1) | Dome slot. |
| 10 | Building — SHOP | `assets/img/building-shop.svg` | Town map, centre-lower → Shop | Transparent PNG/SVG, 480×480 (1:1) | Blue/white shop slot with awning. |
| 11 | Building — COMING SOON | `assets/img/building-comingsoon.svg` | Town map, far right — fenced, label only, never navigates | Transparent PNG/SVG, 480×480 (1:1) | Construction slot. When the feature launches, this becomes a normal building. |
| 12 | Shop banner | `assets/img/banner-shop.svg` | Shop page, top strip | JPG/PNG/SVG, 2400×520 (about 4.6:1), shown full-width | Keep headline text inside the centre 60% so it survives narrow screens. |
| 13 | VTuber placeholder art | `assets/img/vtuber-placeholder.svg` | Every VTuber card (arched frame) + detail modal, until a per-model image is set | PNG/SVG, 900×1080 (5:6), arched crop (rounded top) | Per-model override: set `img` on the VTuber item in `js/data.js`. Art is cropped with `object-fit: cover` inside the arch. |
| 14 | Product thumbnails (per item) | — (procedural) | Commission / Stream Kit / Shop cards, product page, cart | PNG with transparency, 800×800 (1:1) recommended | Set `img: 'assets/img/products/<file>'` on the item in `js/data.js`. Create `assets/img/products/` for these. One helper renders all of them. |
| 15 | Gacha reward art (per reward) | — (procedural) | Gacha reveal + collection grid | PNG with transparency, 512×512 | Set `img` on the reward in `GACHA_REWARDS` in `js/data.js`. |

## Rules that keep replacement painless

1. Same filename + same proportions = zero code changes.
2. New filename/format? Change it once in `ASSETS` (`js/data.js`).
3. Per-item art always goes through the `img` field — never hardcode an image
   path inside page templates.

## Animated sprites (assets/img/sprites/)
Frame sequences driven by one animation loop on the town page — replace frame-for-frame, same filenames:
- walk-01..08.svg — mascot walk cycle (side view, facing right)
- fountain-01..06.svg — crystal fountain loop (placed on the plaza)
- water-01..04.svg — pond water surface loop
- tree-01..06.svg — fantasy trees (sway via CSS)
- xmas-*.svg — Christmas decor: tree, snowman, gifts, wreath, lantern, sleigh
- ../mascot-santa.svg — Christmas mascot used in the sale banners

## Gacha & chat (v3)
assets/img/gacha-machine.svg    ~560 tall — the big capsule machine on the gacha page
assets/img/mascot-present.svg   ~560 tall — RESPA presenting (one arm out, holding a capsule) — gacha page + begin gate
assets/img/chat-head.svg        300×300  — mascot head/bust inside the Chat Me badge + chat panel header

## v4 notes
assets/img/logo.svg — ANIMATED logo (SMIL flipbook, 17 frames sampled from Smith's own logo GIF, 1.98s loop). To replace: rebuild from the GIF frames, or drop a static SVG here to go back to a still logo.
assets/img/building-*.svg — hand-drawn VECTOR cartoon buildings (drawn in code, ~2 KB each). Edit the SVG shapes directly to restyle.

## v5 notes
assets/img/building-*.svg — isometric soft-3D-cartoon buildings, AI-generated one by one in the reference's art style but with ORIGINAL shapes (pencil-tower atelier, capsule-ball gacha pavilion, shopping-bag shop, moon observatory, TV stream hall, treehouse, construction site). Regenerate or replace per file; keep the same filenames.
assets/img/sprites/tree-*.svg + fountain-*.svg — same style pass (trees sliced from one sheet; fountain is a 6-frame loop sliced from one sheet, frames share geometry — do not trim individually).
Map interaction: drag-only (zoom disabled on purpose), full screen.

## v6 notes
Buildings/trees/fountain regenerated in FLAT vector isometric style (the reference's actual art style — flat colours, soft cel shading, matte) with the same original shapes as v5; the glossy 3D versions were superseded the same day at Smith's direction.
Town ambience: code-drawn bubble particles rise at the fountain and pond, and small sparkles twinkle at building doors (TownAnim.updateParticles) — an original implementation of the floating-bubble effect Smith referenced via webm; no external asset files.
