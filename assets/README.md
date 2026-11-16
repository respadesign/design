# Assets — placeholder slots

Every visual slot on the site is a **separate placeholder file** in `assets/img/`,
drawn as a simple original SVG. They mirror the *position, role and proportions*
of the final RESPA artwork so that re-skinning the site later is a
**1:1 file replacement**: export your real artwork at the recommended size,
save it over the placeholder (same filename), done. No code changes needed.

If you prefer a different filename/format (e.g. PNG instead of SVG), change the
path once in the `ASSETS` config object at the top of `js/data.js` — that is the
only place asset paths live in code.

## Slots

| Slot | File |
|---|---|
| Logo | `img/logo.svg` |
| Mascot character | `img/mascot.svg` |
| Hero / OG image | `img/hero.svg` |
| Town background | `img/town-bg.svg` |
| Town building — EMOTE | `img/building-emote.svg` |
| Town building — STREAM KIT | `img/building-streamkit.svg` |
| Town building — ABOUT US | `img/building-about.svg` |
| Town building — GACHA | `img/building-gacha.svg` |
| Town building — VTUBER | `img/building-vtuber.svg` |
| Town building — SHOP | `img/building-shop.svg` |
| Town building — COMING SOON | `img/building-comingsoon.svg` |
| Shop banner | `img/banner-shop.svg` |
| VTuber placeholder art | `img/vtuber-placeholder.svg` |

Full details (where each appears, recommended dimensions/format, notes):
see **ASSET-MAP.md** in this folder.

## Product / emote thumbnails

Catalog thumbnails (commission, stream kit, shop, gacha rewards) are
*procedurally generated* placeholders (gradient + emoji) by design — there are
hundreds of them. Each catalog item in `js/data.js` has an `img` field:

- `img: null` → procedural placeholder is used.
- `img: 'assets/img/products/my-emote.png'` → your real image is used instead,
  everywhere the item appears (cards, detail, cart).

All rendering goes through one helper (`artInner()` in `js/app.js`), so this
override works site-wide with no other changes.
