# RESPA Studio — interactive studio website

A complete, dependency-free vanilla JS single-page app for **RESPA Studio**
(respadesign): a gamified "town map" portfolio + commission + shop site for a
kawaii streamer-art studio. All artwork is **original placeholder art**
(CSS/SVG/emoji) and all copy is original placeholder copy, structured so the
real RESPA assets can be dropped in 1:1 later (see *Replacing assets*).

No build step, no framework, no backend. State (accounts, cart, orders,
favorites, gacha) lives in the visitor's `localStorage`.

## Run locally

Any static server works, for example:

```bash
cd respa-studio-site
python3 -m http.server 8000
# open http://localhost:8000
```

…or simply open `index.html` in a browser.

## Deploy to GitHub Pages

1. Push this folder as a repository (or repo root).
2. GitHub → Settings → Pages → Source: `main` branch, `/ (root)`.
3. The included empty `.nojekyll` file keeps Pages from running Jekyll.
4. Your site is live at `https://<user>.github.io/<repo>/`.

## Project structure

```
index.html        Shell only: splash, loading, header/nav, <main id="app">,
                  footer, chat widget, modal & toast roots
css/styles.css    All styling (yellow/black/pink, rounded playful UI)
js/data.js        ASSETS config + all catalog data (generated deterministically)
js/state.js       localStorage store: auth, cart, wishlist, gacha, orders, requests
js/app.js         Hash router + every page renderer + interactions
assets/           Placeholder asset slots (see assets/ASSET-MAP.md)
```

## Features

- **Splash → Loading → Town**: black splash with logo & "Tap to enter",
  animated loading bar with a walking character, then the town.
- **Town of RESPA** (`#/`): pannable map (drag to pan, wheel to zoom) with a
  river/bridge, beach, park & fountain, windmill and NPCs. Buildings use the
  two-click pattern (1st click = speech bubble, 2nd click = enter):
  EMOTE → commission, STREAM KIT, ABOUT US, GACHA, VTUBER, SHOP, and a fenced
  COMING SOON plot. Portrait phones get a rotate-to-landscape hint.
  Optional subtle WebAudio melody (off by default, toggle bottom-right).
- **Commission** (`#/commission/<category>`): 8 YCH categories (101 items),
  rating summary + reviews modal (12 reviews), search, type filter chips,
  5 sort orders, favorite hearts with counts (persisted), item detail modal,
  sticky estimated-price bar, DETAIL & TOS pricing box.
- **Custom Request** (`#/commission/custom`): full validated form with add-on
  calculator (Commercial/Merch/NDA +$50 per emote × quantity), file picker and
  Drive link; saved requests appear on the Orders page.
- **Stream Kit** (`#/stream-kit`): 7 sub-tabs, 20 animated "video" cards with
  play/pause, $100 each, estimated-price bar.
- **VTubers** (`#/vtubers`): FULL MODEL (23) / CHIBI (18) / READY TO ADOPT (10,
  with SOLD OUT badges) in arched black frames; detail modal requires login.
- **Shop** (`#/shop`): 187 products across 14 categories (counts in the
  sidebar), search, 6 sort orders, 12-per-page pagination, product pages
  (`#/shop/product/<slug>`) with gallery, pay-what-you-want (min $2.50,
  freebies $0), accordions and "You may also like".
- **Gacha** (`#/gacha`): playable capsule machine — 2,000 starting coins,
  1 pull = 100 / 5 pulls = 450, shake animation with skip, rarity reveals
  (Common/Rare/Epic/Legendary), duplicates convert to +20 coins, 20-piece
  collection grid, daily free +500 coins, FAQ modal. Fully persisted.
- **Auth** (`#/login`, `#/register`): localStorage accounts, passwords stored
  only as a tiny hash (front-end demo — **not** real security), "Hi, <name>"
  account menu, and login guards on cart/checkout/detail/chat actions, like a
  real store.
- **Cart / Orders / Wishlist / Profile** (`#/cart`, `#/orders`, `#/wishlist`,
  `#/profile`): quantities, demo checkout creating orders with status chips,
  favorites grid, account stats.
- **TOS** (`#/tos`): original terms in an expandable yellow box (General,
  Payments, Revisions, Deadlines, Use, IP, Refunds, Communication).
- **About** (`#/about`) & **How to Order** (`#/how-to-order`), a canned-reply
  **Chat Me** widget (Fiverr/Discord links), toasts, ESC-to-close modals, a
  cute 404 page, and responsive layout throughout.

## Replacing assets (the re-skin guide)

All fixed visual slots are individual files under `assets/img/` and are
referenced **only** through the `ASSETS` object at the top of `js/data.js`.
Catalog items carry an `img` field (`null` = procedural gradient+emoji
placeholder); set it to a real image path and that image is used everywhere
the item appears.

👉 **Full slot-by-slot table (file, where it appears, recommended dimensions,
notes): `assets/ASSET-MAP.md`**

Quick version:

| Slot | File |
|---|---|
| Logo | `assets/img/logo.svg` |
| Mascot | `assets/img/mascot.svg` |
| Hero / OG (1200×630) | `assets/img/hero.svg` |
| Town background (1700×1000) | `assets/img/town-bg.svg` |
| Town buildings (×7, 1:1) | `assets/img/building-*.svg` |
| Shop banner | `assets/img/banner-shop.svg` |
| VTuber placeholder art | `assets/img/vtuber-placeholder.svg` |

## Editing data

Everything commercial lives in `js/data.js`: commission categories & pricing
tiers, stream-kit items, VTuber lists, shop categories (counts generate the
catalog), gacha rewards & FAQ, and the sample reviews. The catalog generators
use a seeded PRNG, so edits to counts/names stay deterministic.
