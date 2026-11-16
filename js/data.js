/* ============================================================
   RESPA Studio — catalog data (all placeholder, easy to edit)
   Everything here is generated deterministically so the site
   feels full on day one. Swap names/prices/art freely.
   ============================================================ */
'use strict';

/* Tiny deterministic PRNG so generated catalogs are stable */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* ============================================================
   ASSETS — the ONLY place asset file paths are defined.
   Every slot is a placeholder file in assets/img/, drawn to the
   same position/role/proportions as the final RESPA artwork.
   To re-skin the site: replace the file (same name) or point a
   slot at a new path here. Catalog items also carry an `img`
   field: null = procedural placeholder (gradient + emoji);
   set it to an image path to override per item.
   See assets/ASSET-MAP.md for dimensions per slot.
   ============================================================ */
const ASSETS = {
  logo: 'assets/img/logo.svg',
  mascot: 'assets/img/mascot.svg',
  hero: 'assets/img/hero.svg',               // OG image / hero placeholder (1200x630)
  townBg: 'assets/img/town-bg.svg',          // town scene background (1700x1000)
  shopBanner: 'assets/img/banner-shop.svg',  // shop page banner strip (1200x260)
  vtuberPlaceholder: 'assets/img/vtuber-placeholder.svg', // VTuber card art (600x720, arched)
  buildings: {
    emote: 'assets/img/building-emote.svg',
    streamkit: 'assets/img/building-streamkit.svg',
    about: 'assets/img/building-about.svg',
    gacha: 'assets/img/building-gacha.svg',
    vtuber: 'assets/img/building-vtuber.svg',
    shop: 'assets/img/building-shop.svg',
    soon: 'assets/img/building-comingsoon.svg',
  },
  santa: 'assets/img/mascot-santa.svg',      // Christmas mascot (seasonal art)
  sprites: {
    walk: [1, 2, 3, 4, 5, 6, 7, 8].map(i => 'assets/img/sprites/walk-' + String(i).padStart(2, '0') + '.svg'),
    fountain: [1, 2, 3, 4, 5, 6].map(i => 'assets/img/sprites/fountain-' + String(i).padStart(2, '0') + '.svg'),
    water: [1, 2, 3, 4].map(i => 'assets/img/sprites/water-' + String(i).padStart(2, '0') + '.svg'),
    trees: [1, 2, 3, 4, 5, 6].map(i => 'assets/img/sprites/tree-' + String(i).padStart(2, '0') + '.svg'),
    xmas: {
      tree: 'assets/img/sprites/xmas-tree.svg', snowman: 'assets/img/sprites/xmas-snowman.svg',
      gifts: 'assets/img/sprites/xmas-gifts.svg', wreath: 'assets/img/sprites/xmas-wreath.svg',
      lantern: 'assets/img/sprites/xmas-lantern.svg', sleigh: 'assets/img/sprites/xmas-sleigh.svg',
    },
  },
};

/* ---------- Seasonal sale (Christmas) ---------- */
const SALE = { active: true, pct: 20, label: 'Christmas Sale', note: 'Prices shown include the discount. Shop pay-what-you-want minimum stays $2.50.' };

const rng = mulberry32(20261116);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const between = (min, max) => min + Math.floor(rng() * (max - min + 1));

/* ---------- Commission categories ---------- */
const COMMISSION_CATEGORIES = [
  { id: 'static',    label: 'Static YCH',       count: 15, prefix: 'S',  prices: [20, 60, 60, 70, 80],  type: 'YCH Emote' },
  { id: 'animated',  label: 'Animated Meme YCH', count: 24, prefix: 'A',  prices: [30, 75, 75, 150],   type: 'Animated' },
  { id: 'halloween', label: 'Halloween YCH',     count: 12, prefix: 'H',  prices: [20, 60, 75],        type: 'YCH Emote' },
  { id: 'christmas', label: 'Christmas YCH',     count: 12, prefix: 'C',  prices: [20, 60, 75],        type: 'YCH Emote' },
  { id: 'fanart',    label: 'Fanart YCH',        count: 10, prefix: 'F',  prices: [35, 50, 85],        type: 'Fanart' },
  { id: 'valentine', label: 'Valentine YCH',     count: 10, prefix: 'V',  prices: [20, 60, 75],        type: 'YCH Emote' },
  { id: 'summer',    label: 'Summer YCH',        count: 10, prefix: 'U',  prices: [20, 60, 75],        type: 'YCH Emote' },
  { id: 'handpicked',label: 'Handpicked',        count: 8,  prefix: 'P',  prices: [45, 85, 120, 150],  type: 'Chibi' },
];

const EMOJI_BY_CAT = {
  static:    ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐷', '🐸'],
  animated:  ['🪩', '💃', '🕺', '🎉', '😹', '🥳', '🎶', '🌀'],
  halloween: ['🎃', '👻', '🦇', '🕷️', '🧙', '💀', '🍬', '🌕'],
  christmas: ['🎄', '🎅', '🦌', '⛄', '🎁', '🍪', '🔔', '❄️'],
  fanart:    ['⭐', '🗡️', '🔮', '🎮', '📺', '💫', '🎧', '🏆'],
  valentine: ['💖', '💌', '🌹', '🧸', '💘', '🍫', '😘', '💞'],
  summer:    ['🌴', '🍉', '🏖️', '🍦', '🌊', '☀️', '🦩', '🍹'],
  handpicked:['✨', '👑', '🌸', '🦋', '🍓', '🧁', '🌈', '💎'],
};
const NAME_A = ['Boba', 'Mochi', 'Pudding', 'Starry', 'Bubble', 'Peachy', 'Cloudy', 'Honey', 'Sundae', 'Pocky', 'Mellow', 'Twinkle', 'Cocoa', 'Berry', 'Sunny', 'Dizzy'];
const NAME_B = ['Wiggle', 'Giggle', 'Nom Nom', 'Heart Eyes', 'Sleepy', 'Rage Quit', 'Dance Party', 'Hug Attack', 'Sips Tea', 'Wow Face', 'Cry Laugh', 'Bonk', 'Cheer', 'Pout', 'Sparkle', 'Zoomies'];
const TAG_POOL = ['emote', 'chibi', 'streamer', 'twitch', 'discord', 'cute', 'kawaii', 'pet', 'mascot', 'gif', 'meme', 'vtuber'];

function makeCommissionItems() {
  const items = [];
  for (const cat of COMMISSION_CATEGORIES) {
    for (let i = 1; i <= cat.count; i++) {
      const tags = [];
      while (tags.length < 3) { const t = pick(TAG_POOL); if (!tags.includes(t)) tags.push(t); }
      const day = between(1, 28), month = between(1, 11);
      items.push({
        kind: 'commission',
        img: null, // set to an image path to override the procedural placeholder
        id: cat.id + '-' + i,
        code: cat.prefix + i,
        category: cat.id,
        categoryLabel: cat.label,
        name: pick(NAME_A) + ' ' + pick(NAME_B),
        price: pick(cat.prices),
        type: cat.id === 'fanart' && i % 3 === 0 ? 'Full Body' : cat.type,
        tags,
        favs: between(3, 240),
        emoji: pick(EMOJI_BY_CAT[cat.id]),
        hue: between(0, 359),
        date: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        sold: between(2, 90),
      });
    }
  }
  return items;
}
const COMMISSION_ITEMS = makeCommissionItems();

/* ---------- Reviews (original placeholder texts) ---------- */
const REVIEW_NAMES = ['Mika', 'Raka', 'Lulu', 'Benji', 'Sora', 'Tania', 'Kiko', 'Dimas', 'Yuna', 'Omar', 'Pia', 'Felix'];
const REVIEW_TEXTS = [
  'My community fell in love with these emotes instantly. Super cute and delivered on time!',
  'The expressions are spot on. Communication was fast and friendly the whole way.',
  'Third time ordering and the quality keeps getting better. Highly recommended!',
  'My pet has never looked this adorable. The preview process made revisions easy.',
  'Animated emotes came out bouncy and clean at every size. Worth every coin.',
  'Lovely lineart, lovely colours, lovely artist. Will commission again soon!',
  'Chat spams these emotes non-stop now. Best purchase for my channel this year.',
  'Fast turnaround and the bonus sizes were a sweet surprise. Thank you!',
  'Exactly matched my reference while adding extra charm. Five stars, no notes.',
  'The seasonal pack was perfect for the holidays. My viewers keep asking who made them.',
  'Professional, patient with my revision requests, and the final files were tidy.',
  'I ordered for my Discord server and everyone wants their own set now!',
];
const REVIEWS = REVIEW_NAMES.map((name, i) => ({
  name, stars: 5, text: REVIEW_TEXTS[i],
  date: `2026-${String(11 - (i % 6)).padStart(2, '0')}-${String(3 + i * 2).padStart(2, '0')}`,
  item: pick(COMMISSION_ITEMS).name,
}));

/* ---------- Stream Kit ---------- */
const STREAMKIT_SUBTABS = ['Special', 'Stream Screen', 'Alert', 'Panel', 'Chibi Art', 'Banner & PP', 'Stinger Transitions'];
const STREAMKIT_ITEMS = [
  ['Special', 'Starlight Welcome Package', '🌟'], ['Special', 'Sakura Season Full Set', '🌸'],
  ['Stream Screen', 'Cozy Room Starting Screen', '🛋️'], ['Stream Screen', 'Pixel Sky BRB Screen', '☁️'],
  ['Stream Screen', 'Lo-fi Window Ending Screen', '🌙'], ['Alert', 'Boba Pop Follow Alert', '🧋'],
  ['Alert', 'Confetti Rain Sub Alert', '🎊'], ['Alert', 'Sleepy Cat Raid Alert', '🐱'],
  ['Panel', 'Pastel Ribbon Panel Pack', '🎀'], ['Panel', 'Arcade Cabinet Panel Pack', '🕹️'],
  ['Chibi Art', 'Chibi Greeter Illustration', '🧸'], ['Chibi Art', 'Chibi Duo Pose Art', '👯'],
  ['Banner & PP', 'Dreamy Gradient Banner', '🌈'], ['Banner & PP', 'Matching Profile Picture Set', '🖼️'],
  ['Stinger Transitions', 'Sparkle Wipe Stinger', '✨'], ['Stinger Transitions', 'Cloud Zoom Stinger', '💨'],
  ['Special', 'Birthday Bash Overlay Set', '🎂'], ['Stream Screen', 'Aquarium Chill Screen', '🐠'],
  ['Alert', 'Golden Bell Donation Alert', '🔔'], ['Panel', 'Cloud Shelf Panel Pack', '☁️'],
].map(([tab, name, emoji], i) => ({
  kind: 'streamkit', img: null, id: 'sk-' + (i + 1), tab, name, emoji,
  price: 100, duration: '0:' + String(12 + (i * 7) % 40).padStart(2, '0'), hue: (i * 47) % 360,
}));

/* ---------- VTubers ---------- */
function makeVtuberItems(tab, count, prefix, priceMin, priceMax, soldOutEvery) {
  const emojis = ['🎀', '🌸', '🦊', '🐰', '🐱', '🦋', '🍓', '🌙', '⭐', '🍰', '🎧', '💐'];
  return Array.from({ length: count }, (_, i) => ({
    kind: 'vtuber', img: null, tab, id: prefix + '-' + (i + 1),
    name: pick(NAME_A) + ' ' + ['Model', 'Live2D', 'Chibi', 'Design'][i % 4] + ' #' + (i + 1),
    emoji: emojis[i % emojis.length], hue: (i * 53 + 20) % 360,
    priceMin: priceMin + i * 15, priceMax: priceMax + i * 15,
    priceLabel: '$' + (priceMin + i * 15) + ' – $' + (priceMax + i * 15),
    soldOut: soldOutEvery ? (i % soldOutEvery === 1) : false,
  }));
}
const VTUBER_TABS = [
  { id: 'full',  label: 'FULL MODEL' },
  { id: 'chibi', label: 'CHIBI' },
  { id: 'adopt', label: 'READY TO ADOPT' },
];
const VTUBER_ITEMS = [
  ...makeVtuberItems('full', 23, 'vt-full', 250, 600, 0),
  ...makeVtuberItems('chibi', 18, 'vt-chibi', 120, 300, 0),
  ...makeVtuberItems('adopt', 10, 'vt-adopt', 180, 450, 2),
];

/* ---------- Shop ---------- */
const SHOP_CATEGORIES = [
  ['Stream Overlay', 18], ['Sub Badges', 14], ['Emotes', 43], ['Freebies', 26],
  ['Alerts', 16], ['Stream Pack', 12], ['Panels', 11], ['Banner', 6],
  ['Scenes', 15], ['Stinger', 7], ['Stream Widget', 5], ['Stream Avatar', 2],
  ['Custom Emotes', 7], ['Halloween', 5],
]; // total = 187
const SHOP_EMOJI = ['🎨', '🏅', '😻', '🎁', '🔔', '📦', '🪟', '🖼️', '🎬', '💫', '🧩', '🧑‍🎨', '✏️', '🎃'];
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function makeShopItems() {
  const items = [];
  SHOP_CATEGORIES.forEach(([cat, count], ci) => {
    for (let i = 1; i <= count; i++) {
      const free = cat === 'Freebies';
      const basePrice = free ? 0 : [5, 8, 10, 12, 15, 20, 25][between(0, 6)];
      const discounted = !free && rng() < 0.3;
      const name = pick(NAME_A) + ' ' + cat.split(' ')[0] + ' Pack ' + i;
      items.push({
        kind: 'shop', img: null, category: cat, name,
        slug: slugify(cat) + '-' + i,
        price: basePrice,
        originalPrice: discounted ? Math.round(basePrice * 1.5) : null,
        sold: between(0, 420), rating: (4.5 + rng() * 0.5).toFixed(1),
        emoji: SHOP_EMOJI[ci % SHOP_EMOJI.length], hue: between(0, 359),
        date: `2026-${String(between(1, 11)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
        free,
      });
    }
  });
  return items;
}
const SHOP_ITEMS = makeShopItems();

/* ---------- Gacha ---------- */
const GACHA_REWARDS = [
  ['Mochi Bounce', 'Common', '🍡'], ['Sleepy Kitten', 'Common', '🐱'], ['Boba Sip', 'Common', '🧋'],
  ['Tiny Wave', 'Common', '👋'], ['Pudding Pout', 'Common', '🍮'], ['Sprout Buddy', 'Common', '🌱'],
  ['Star Cheer', 'Rare', '⭐'], ['Bubble Dance', 'Rare', '🫧'], ['Peach Wink', 'Rare', '🍑'],
  ['Cloud Nap', 'Rare', '☁️'], ['Ribbon Fox', 'Rare', '🦊'], ['Melody Bunny', 'Epic', '🐰'],
  ['Crystal Tears', 'Epic', '💎'], ['Sakura Storm', 'Epic', '🌸'], ['Golden Bell Cat', 'Epic', '🔔'],
  ['Rainbow Zoomies', 'Legendary', '🌈'], ['Moonlight Idol', 'Legendary', '🌙'],
  ['Dragon Snack', 'Legendary', '🐲'], ['Celestial Hug', 'Legendary', '💫'], ['Royal Mochi King', 'Legendary', '👑'],
].map(([name, rarity, emoji], i) => ({ id: 'g' + (i + 1), name, rarity, emoji, img: null }));
const GACHA_RARITY_WEIGHTS = { Common: 55, Rare: 28, Epic: 12, Legendary: 5 };
const GACHA_FAQ = [
  ['What do I win?', 'One of 20 original emote & sticker designs, revealed after each pull. Collect them all!'],
  ['What happens with duplicates?', 'Duplicates are automatically converted into +20 coins, so no pull is ever wasted.'],
  ['How do I get more coins?', 'Claim the free daily +500 coins once per calendar day, right on this page.'],
  ['Is this real-money gambling?', 'No. Gacha here uses free in-game coins only — it is a just-for-fun collection mini-game.'],
];

/* ---------- Pricing tiers (shown in DETAIL & TOS box) ---------- */
const PRICING_TIERS = [
  { title: 'Static YCH', lines: ['6 emotes — $60', 'Single emote — $20', 'Extra emote after 6 — $10 each', 'Recolour / expression change — from $5', 'Sizes: 112 / 56 / 28 px + bonus 500 px PNG'] },
  { title: 'Animated Meme YCH', lines: ['1 animated emote — $30', '3 animated emotes — $75', '6 animated emotes (1 character) — $150', 'Edits — from $5', 'Format: GIF · Turnaround 2–3 weeks'] },
  { title: 'Seasonal YCH (Halloween / Christmas / Valentine / Summer)', lines: ['Packs follow the Static & Animated tier prices', 'Limited seasonal slots each year', 'Turnaround 2–3 weeks — order early!'] },
  { title: 'Good to know', lines: ['General turnaround: 2–3 weeks', 'Commercial use add-on available on the Custom form', 'Payment via the checkout flow — demo store, no real charge'] },
];

/* ---------- Temporary AI art assignment (swappable per ASSET-MAP) ----------
   Pools of generated transparent art in assets/img/items/, cycled per group.
   Replace any file 1:1 with your own art, or set an item's img to override. */
const ITEM_ART = 'assets/img/items/';
const _pool = (prefix, n) => Array.from({ length: n }, (_, i) => ITEM_ART + prefix + '-' + String(i + 1).padStart(2, '0') + '.svg');
const ART_POOLS = {
  emote: [..._pool('emote-a', 16), ..._pool('emote-b', 16)],
  gacha: _pool('gacha', 20),
  shop: _pool('shop', 16),
  streamkit: _pool('streamkit', 16),
  vtuberFull: [..._pool('vtuber-full-a', 6), ..._pool('vtuber-full-b', 6)],
  vtuberChibi: _pool('vtuber-chibi', 9),
  vtuberAdopt: _pool('vtuber-adopt', 6),
};
COMMISSION_ITEMS.forEach((it, i) => { it.img = ART_POOLS.emote[i % ART_POOLS.emote.length]; });
SHOP_ITEMS.forEach((it, i) => { it.img = ART_POOLS.shop[i % ART_POOLS.shop.length]; });
STREAMKIT_ITEMS.forEach((it, i) => { it.img = ART_POOLS.streamkit[i % ART_POOLS.streamkit.length]; });
GACHA_REWARDS.forEach((it, i) => { it.img = ART_POOLS.gacha[i % ART_POOLS.gacha.length]; });
VTUBER_ITEMS.forEach((it, i) => {
  const pool = String(it.tab).includes('chibi') ? ART_POOLS.vtuberChibi
    : String(it.tab).includes('adopt') ? ART_POOLS.vtuberAdopt : ART_POOLS.vtuberFull;
  it.img = pool[i % pool.length];
});

window.DATA = {
  ASSETS, SALE,
  COMMISSION_CATEGORIES, COMMISSION_ITEMS, REVIEWS, PRICING_TIERS,
  STREAMKIT_SUBTABS, STREAMKIT_ITEMS, VTUBER_TABS, VTUBER_ITEMS,
  SHOP_CATEGORIES, SHOP_ITEMS, GACHA_REWARDS, GACHA_RARITY_WEIGHTS, GACHA_FAQ,
};
