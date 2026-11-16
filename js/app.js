/* ============================================================
   RESPA Studio — app: router, pages, interactions
   Vanilla JS SPA with hash routing. No build step.
   ============================================================ */
'use strict';
const D = window.DATA;
const app = document.getElementById('app');
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$' + Number(n).toFixed(2).replace(/\.00$/, '');
const artStyle = (hue, extra) => `background:linear-gradient(135deg,hsl(${hue},92%,84%),hsl(${(hue + 45) % 360},88%,68%))` + (extra || '');
const A = D.ASSETS; // central asset config — the only source of asset paths in code

/* Single thumbnail helper for ALL catalog art.
   item.img set  -> real image file (drop-in replacement).
   item.img null -> procedural placeholder (gradient + emoji). */
function artInner(item, bigClass) {
  if (item && item.img) return `<img class="art-img" src="${esc(item.img)}" alt="${esc(item.name || '')}">`;
  return `<span class="${bigClass || 'big'}">${item ? item.emoji : '🎨'}</span>`;
}
function thumbStyle(item) { return item && item.img ? '' : artStyle(item.hue); }
/* Apply config-driven asset slots that live in the static shell (logos, OG image) */
function applyShellAssets() {
  $$('.asset-logo').forEach(img => { img.src = A.logo; });
  const og = document.querySelector('meta[property="og:image"]');
  if (og) og.setAttribute('content', A.hero);
}

/* ---------------- toast ---------------- */
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.getElementById('toast-root').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2600);
  setTimeout(() => t.remove(), 3000);
}

/* ---------------- modal ---------------- */
function openModal(html, wide) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-back"><div class="modal-box${wide ? ' wide' : ''}">
    <button class="modal-close" id="modal-close">✕</button>${html}</div></div>`;
  $('.modal-back', root).addEventListener('click', e => { if (e.target.classList.contains('modal-back')) closeModal(); });
  $('#modal-close', root).onclick = closeModal;
}
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---------------- sound: WebAudio music box + SFX ----------------
   Music starts only after a user gesture (browser autoplay rules):
   the splash "Tap to enter" tap (or the gacha begin gate) starts it,
   unless the visitor previously muted it — the choice is remembered. */
const Sound = {
  ctx: null, timer: null, step: 0,
  pref: Store.data.sound, // true = on, false = muted, undefined = not chosen yet
  on: Store.data.sound === true,
  melody: [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 587.33, 659.25, 698.46, 659.25, 587.33, 493.88, 587.33],
  bass: [130.81, 196.0, 146.83, 164.81],
  ensure() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, delay, dur, type, vol) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.045, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  },
  beep(freq, dur) { this.tone(freq, 0, dur || 0.3, 'sine', 0.05); }, // legacy callers
  sfx(name) {
    if (!this.on) return;
    this.ensure(); if (!this.ctx) return;
    if (name === 'click') this.tone(1150, 0, 0.07, 'triangle', 0.035);
    else if (name === 'select') { this.tone(880, 0, 0.12, 'sine', 0.05); this.tone(1318, 0.06, 0.14, 'sine', 0.04); }
    else if (name === 'coin') { [988, 1319, 1568].forEach((f, i) => this.tone(f, i * 0.07, 0.16, 'square', 0.028)); }
    else if (name === 'win') { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.09, 0.3, 'triangle', 0.05)); }
    else if (name === 'error') this.tone(196, 0, 0.22, 'sawtooth', 0.03);
  },
  start() {
    this.ensure(); if (!this.ctx) return;
    this.stop(); this.on = true; this.pref = true; Store.data.sound = true; Store.save(); this.syncBtns();
    this.timer = setInterval(() => {
      if (!this.on) return;
      this.tone(this.melody[this.step % this.melody.length], 0, 0.42, 'sine', 0.042);
      if (this.step % 4 === 0) this.tone(this.bass[(this.step / 4) % this.bass.length], 0, 0.9, 'triangle', 0.026);
      this.step++;
    }, 430);
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; },
  autoStart() { if (this.pref === false) return; if (!this.on) this.start(); },
  toggle() {
    if (this.on) { this.on = false; this.pref = false; Store.data.sound = false; Store.save(); this.stop(); this.syncBtns(); }
    else this.start();
    return this.on;
  },
  syncBtns() {
    const label = this.on ? '🔊' : '🔇';
    const sb = $('#sound-btn'); if (sb) sb.textContent = label;
    const sm = $('#splash-mute'); if (sm) sm.textContent = label;
    const gm = $('#gacha-mute'); if (gm) gm.textContent = this.on ? '🔊 Mute background sound' : '🔇 Unmute background sound';
  },
};

/* ---------------- seasonal sale helpers ---------------- */
const SALE_ON = !!(window.DATA && window.DATA.SALE && window.DATA.SALE.active);
const SALE_PCT = SALE_ON ? window.DATA.SALE.pct : 0;
function salePrice(p) { return SALE_ON ? Math.round(p * (100 - SALE_PCT)) / 100 : p; }
function priceHTML(p, cls) {
  if (!SALE_ON) return `<span class="${cls || 'price'}">${money(p)}</span>`;
  return `<span class="price-was">${money(p)}</span> <span class="${cls || 'price'}">${money(salePrice(p))}</span> <span class="sale-badge">−${SALE_PCT}%</span>`;
}
function vtuberPriceLabel(i) {
  if (!SALE_ON) return i.priceLabel;
  return money(salePrice(i.priceMin)) + ' – ' + money(salePrice(i.priceMax));
}

/* ---------------- header / chrome ---------------- */
function updateHeader() {
  const count = Store.cartCount();
  const badge = $('#cart-count');
  badge.textContent = count; badge.classList.toggle('hidden', count === 0);
  $('#account-label').textContent = Store.user ? 'Hi, ' + Store.user.name.split(' ')[0] : 'LOGIN';
  $$('.pill-nav a').forEach(a => {
    const route = location.hash.replace('#/', '').split('/')[0];
    a.classList.toggle('active', a.dataset.nav === route);
  });
}
function showChrome() {
  $('#site-header').classList.remove('hidden');
  $('#site-footer').classList.remove('hidden');
  $('#sound-btn').classList.remove('hidden');
}
function requireLogin(notice) {
  if (Store.user) return true;
  toast(notice || 'Please log in first to continue ♡');
  sessionStorage.setItem('respa_redirect', location.hash || '#/');
  location.hash = '#/login';
  return false;
}
function addToCartGuarded(item, silent) {
  if (!requireLogin('Log in to add items to your cart ♡')) return false;
  Store.addToCart(item);
  updateHeader();
  if (!silent) toast('Added to cart: ' + item.name + ' 🛒');
  return true;
}

/* ---------------- splash & loading ---------------- */
let entered = sessionStorage.getItem('respa_entered') === '1';
function initSplash() {
  if (entered) { $('#splash').classList.add('hidden'); showChrome(); return; }
  const walker = $('#loading-walker');
  if (walker) walker.innerHTML = `<img src="${esc(A.mascot)}" alt="">`;
  const ptWalker = document.querySelector('.pt-walker');
  if (ptWalker) ptWalker.innerHTML = `<img src="${esc(A.mascot)}" alt="">`;
  $('#splash-enter').onclick = () => {
    Sound.autoStart();
    $('#splash').classList.add('hidden');
    const load = $('#loading'); load.classList.remove('hidden');
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 7);
      $('#loading-bar').style.width = p + '%';
      $('#loading-walker').style.left = `calc(${p}% - 30px)`;
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          load.classList.add('hidden');
          entered = true; sessionStorage.setItem('respa_entered', '1');
          showChrome(); updateHeader();
          if (!location.hash) location.hash = '#/';
          route();
        }, 250);
      }
    }, 90);
  };
  $('#splash-mute').onclick = () => { Sound.toggle(); };
  Sound.syncBtns();
}

/* ============================================================
   HOME — Town of RESPA (pannable map)
   ============================================================ */
const WORLD = { w: 1920, h: 1280 };
let town = { x: 0, y: 0, scale: 1, base: 1, userZoom: false, selected: null };
const BUILDINGS = [
  { id: 'emote',    emoji: '🏠', name: 'EMOTE',       label: '✿ Emote commissions this way!', x: 300,  y: 590, route: '#/commission' },
  { id: 'streamkit',emoji: '🏬', name: 'STREAM KIT',  label: '📺 Full stream packages!',      x: 1400, y: 630, route: '#/stream-kit' },
  { id: 'about',    emoji: '🏩', name: 'ABOUT US',    label: '💖 Meet the studio!',           x: 285,  y: 150, route: '#/about' },
  { id: 'gacha',    emoji: '🎰', name: 'GACHA',       label: '🎁 Try your luck — free coins!', x: 1150, y: 165, route: '#/gacha' },
  { id: 'vtuber',   emoji: '🔮', name: 'VTUBER',      label: '🎀 Live2D models & adopts!',    x: 1470, y: 285, route: '#/vtubers' },
  { id: 'shop',     emoji: '🏪', name: 'SHOP',        label: '🛍️ Ready-made goodies!',       x: 1180, y: 845, route: '#/shop' },
  { id: 'soon',     emoji: '🚧', name: 'COMING SOON', label: '🚧 Under construction… check back later!', x: 170, y: 915, route: null },
];

/* One rAF loop drives every town animation (walker, fountain, water).
   route() calls TownAnim.stop() on every navigation, so nothing leaks
   or stacks when the visitor leaves and returns to the map. */
const TownAnim = {
  raf: 0, running: false,
  stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; },
  start(walker, fountain, water) {
    this.stop(); this.running = true;
    [...A.sprites.walk, ...A.sprites.fountain, ...A.sprites.water].forEach(src => { const im = new Image(); im.src = src; });
    // Wall-clock timing: frames are a pure function of elapsed time, so a
    // throttled/backgrounded tab can never make the animation run slow —
    // whenever a frame is painted it shows the correct frame for that moment.
    const t0 = performance.now();
    const X0 = 250, X1 = 1620, SPAN = X1 - X0, SPEED = 58; // world px per second
    const tick = (now) => {
      if (!this.running) return;
      const t = (now - t0) / 1000;
      const dist = t * SPEED;
      const m = dist % (2 * SPAN);
      const dir = m <= SPAN ? 1 : -1;
      const x = dir === 1 ? X0 + m : X1 - (m - SPAN);
      walker.style.transform = `translateX(${x}px) scaleX(${dir})`;
      const wf = Math.floor(dist / 17) % 8;
      if (walker.dataset.f != wf) { walker.dataset.f = wf; walker.src = A.sprites.walk[wf]; }
      const nf = Math.floor(t / 0.13) % 6;
      if (fountain.dataset.f != nf) { fountain.dataset.f = nf; fountain.src = A.sprites.fountain[nf]; }
      const nw = Math.floor(t / 0.26) % 4;
      if (water.dataset.f != nw) { water.dataset.f = nw; water.src = A.sprites.water[nw]; }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  },
};

function renderHome() {
  TownAnim.stop();
  const sp = A.sprites;
  const treesAt = [[110, 415, 0, 205], [695, 250, 3, 175], [1045, 465, 1, 185], [1700, 765, 2, 215], [610, 890, 4, 165], [80, 685, 5, 195]];
  const trees = treesAt.map(([x, y, t, h], i) => `<img class="tree-sprite sway" style="left:${x}px;top:${y}px;height:${h}px;animation-delay:${(i % 4) * 0.7}s" src="${sp.trees[t]}" alt="">`).join('');
  const buildings = BUILDINGS.map(b => `
    <button class="building" data-b="${b.id}" style="left:${b.x}px;top:${b.y}px">
      <span class="bubble">${esc(b.label)}</span>
      <img class="b-img" src="${esc(A.buildings[b.id] || '')}" alt="${esc(b.name)} building">
      <span class="b-name">${b.name}</span>
    </button>`).join('');
  app.innerHTML = `
  <div class="town-shell">
    <div class="town-viewport" id="town-vp">
      <div class="town-scene" id="town-scene" style="width:${WORLD.w}px;height:${WORLD.h}px;background-image:url('${esc(A.townBg)}');background-size:cover">
        <div class="cloud cloud-a"></div><div class="cloud cloud-b"></div>
        ${trees}
        <img id="town-fountain" class="fountain-sprite" data-f="0" src="${sp.fountain[0]}" alt="Crystal fountain">
        <div class="pond"><img id="town-water" data-f="0" src="${sp.water[0]}" alt=""></div>
        <img class="xmas-sprite" style="left:690px;top:505px;height:215px" src="${sp.xmas.tree}" alt="Christmas tree">
        <img class="xmas-sprite" style="left:1115px;top:745px;height:120px" src="${sp.xmas.snowman}" alt="Snowman">
        <img class="xmas-sprite" style="left:1335px;top:1095px;height:95px" src="${sp.xmas.gifts}" alt="Gifts">
        <img class="xmas-sprite" style="left:1555px;top:985px;height:110px" src="${sp.xmas.sleigh}" alt="Sleigh">
        <img id="town-walker" class="walker" data-f="0" src="${sp.walk[0]}" alt="RESPA mascot out for a walk">
        ${buildings}
        <div class="town-sign">✦ Town of RESPA ✦</div>
      </div>
      <div class="rotate-hint"><span style="font-size:44px">📱↔️</span>Rotate your phone to landscape<br>for the best town view!</div>
      <div class="town-hint">🖱️ Drag to explore · Click a building to enter · RESPA is out for a walk!</div>
    </div>
  </div>`;
  const vp = $('#town-vp'), scene = $('#town-scene');
  const clampApply = () => {
    const sw = WORLD.w * town.scale, sh = WORLD.h * town.scale;
    const vw = vp.clientWidth, vh = vp.clientHeight;
    town.x = sw <= vw ? (vw - sw) / 2 : Math.max(vw - sw, Math.min(0, town.x));
    town.y = sh <= vh ? (vh - sh) / 2 : Math.max(vh - sh, Math.min(0, town.y));
    scene.style.transform = `translate(${town.x}px,${town.y}px) scale(${town.scale})`;
  };
  const fit = (center) => {
    town.base = Math.max(vp.clientWidth / WORLD.w, vp.clientHeight / WORLD.h) * 1.04;
    if (!town.userZoom) town.scale = town.base;
    if (center) { town.x = vp.clientWidth / 2 - 960 * town.scale; town.y = vp.clientHeight / 2 - 640 * town.scale; }
    clampApply();
  };
  fit(true);
  addEventListener('resize', () => { if (document.getElementById('town-vp')) fit(false); });
  /* --- drag with pointer capture (the old once-only pointerup got stuck) --- */
  let drag = null, movedPx = 0, suppressClick = false;
  vp.addEventListener('pointerdown', e => {
    drag = { px: e.clientX, py: e.clientY, ox: town.x, oy: town.y, captured: false }; movedPx = 0;
    // NOTE: no pointer capture here — capturing on pointerdown retargets the
    // click event to the viewport and building buttons would never be clicked.
    // Capture starts lazily in pointermove, once a real drag is under way.
  });
  vp.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.px, dy = e.clientY - drag.py;
    movedPx = Math.max(movedPx, Math.abs(dx) + Math.abs(dy));
    if (movedPx > 7 && !drag.captured) {
      try { vp.setPointerCapture(e.pointerId); drag.captured = true; } catch (err) { /* older browser */ }
    }
    town.x = drag.ox + dx; town.y = drag.oy + dy; clampApply();
  });
  const endDrag = () => { if (drag && movedPx > 7) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 60); } drag = null; };
  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', endDrag);
  vp.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const wx = (mx - town.x) / town.scale, wy = (my - town.y) / town.scale;
    town.scale = Math.max(town.base * 0.85, Math.min(town.base * 2.4, town.scale * (e.deltaY < 0 ? 1.09 : 0.92)));
    town.userZoom = true;
    town.x = mx - wx * town.scale; town.y = my - wy * town.scale; clampApply();
  }, { passive: false });
  let coarse = false;
  try { coarse = matchMedia('(hover: none)').matches; } catch (e) { /* very old browser: assume mouse */ }
  $$('.building', vp).forEach(btn => btn.addEventListener('click', () => {
    if (suppressClick) return;
    const b = BUILDINGS.find(x => x.id === btn.dataset.b);
    if (coarse && town.selected !== b.id) { // touch: first tap shows the bubble, second tap enters
      town.selected = b.id;
      $$('.building', vp).forEach(x => x.classList.toggle('selected', x.dataset.b === b.id));
      Sound.sfx('select');
      return;
    }
    town.selected = b.id;
    Sound.sfx('select');
    if (b.route) location.hash = b.route;
    else toast('🚧 Coming soon — this spot is still being built!');
  }));
  TownAnim.start($('#town-walker'), $('#town-fountain'), $('#town-water'));
}

/* ============================================================
   COMMISSION
   ============================================================ */
let commState = { q: '', type: 'All', sort: 'new' };
const COMM_TYPES = ['All', 'YCH Emote', 'Chibi', 'Fanart', 'Custom', 'Full Body', 'Animated'];

function estBar(kind, checkoutHash) {
  const n = Store.cartCountKind(kind), total = Store.cartTotal(kind);
  return `<div class="est-bar"><span>ESTIMATED PRICE</span><b>${n} item${n === 1 ? '' : 's'} = ${money(total)}</b>
    <a class="btn btn-pink" href="${checkoutHash || '#/cart'}">Checkout →</a></div>`;
}
function favCount(item) { return item.favs + (Store.isFav(item.id) ? 1 : 0); }

function commissionCard(item) {
  return `<div class="card" data-open="${item.id}">
    <span class="code-chip">${item.code}</span>
    <button class="heart ${Store.isFav(item.id) ? 'on' : ''}" data-fav="${item.id}">${Store.isFav(item.id) ? '❤️' : '🤍'} ${favCount(item)}</button>
    <div class="thumb" style="${thumbStyle(item)}">${artInner(item)}</div>
    <button class="cart-add" data-add="${item.id}" title="Add to cart">🛒</button>
    <div class="meta"><h3>${esc(item.name)}</h3>
      <div>${item.tags.map((t, i) => `<span class="tag ${i % 2 ? 'alt' : ''}">#${t}</span>`).join('')}</div>
      <div class="row"><span>${priceHTML(item.price)}</span><span class="sold-note">${item.type}</span></div>
    </div></div>`;
}
function bindCommissionCards(scope, items) {
  $$('[data-fav]', scope).forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    Store.toggleFav(b.dataset.fav); updateHeader(); route();
  }));
  $$('[data-add]', scope).forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const it = items.find(x => x.id === b.dataset.add);
    addToCartGuarded({ key: 'comm-' + it.id, kind: 'commission', refId: it.id, name: it.name + ' (' + it.code + ')', price: salePrice(it.price), emoji: it.emoji, hue: it.hue, img: it.img });
    route();
  }));
  $$('[data-open]', scope).forEach(c => c.addEventListener('click', () => openCommissionDetail(c.dataset.open)));
}
function openCommissionDetail(id) {
  const it = D.COMMISSION_ITEMS.find(x => x.id === id);
  if (!it) return;
  openModal(`
    <div class="modal-art" style="${thumbStyle(it)}">${artInner(it, '')}
      <button class="heart ${Store.isFav(it.id) ? 'on' : ''}" id="d-fav">${Store.isFav(it.id) ? '❤️' : '🤍'} ${favCount(it)}</button>
    </div>
    <h2>${esc(it.name)} <span class="code-chip" style="position:static">${it.code}</span></h2>
    <p style="margin:8px 0">${it.tags.map(t => `<span class="tag">#${t}</span>`).join('')} <span class="tag alt">${esc(it.categoryLabel)}</span> <span class="tag alt">${esc(it.type)}</span></p>
    <p style="font-weight:700;color:var(--ink2);line-height:1.6">A cute “your character here” ${esc(it.type.toLowerCase())} slot, hand-drawn to match your character, pet or mascot. You receive every platform size plus a bonus large PNG. Turnaround 2–3 weeks.</p>
    <div class="row" style="display:flex;justify-content:space-between;align-items:center;margin:16px 0">
      <span style="font-size:22px">${priceHTML(it.price)}</span><span class="sold-note">${it.sold} sold · listed ${it.date}</span>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-pink" id="d-checkout">Checkout Now</button>
      <button class="btn btn-yellow" id="d-add">Add to cart</button>
      <a class="btn btn-white" href="#/how-to-order" onclick="closeModal()">Not sure how to order?</a>
    </div>`);
  $('#d-fav').onclick = () => { Store.toggleFav(it.id); openCommissionDetail(it.id); route(); };
  const asCart = () => ({ key: 'comm-' + it.id, kind: 'commission', refId: it.id, name: it.name + ' (' + it.code + ')', price: salePrice(it.price), emoji: it.emoji, hue: it.hue, img: it.img });
  $('#d-add').onclick = () => { if (addToCartGuarded(asCart())) { closeModal(); route(); } };
  $('#d-checkout').onclick = () => {
    if (!requireLogin('Log in to check out ♡')) { closeModal(); return; }
    Store.addToCart(asCart()); updateHeader(); closeModal(); location.hash = '#/cart';
  };
}
function openReviews() {
  openModal(`<h2>⭐ Client Reviews</h2>
    <p style="font-weight:800;margin:6px 0 4px"><span class="stars">★★★★★</span> 4.97 · 527 reviews (placeholder data)</p>
    ${D.REVIEWS.map(r => `<div class="review-row"><b>${esc(r.name)}</b> <span class="stars">★★★★★</span>
      <span class="sold-note">${r.date} · ordered “${esc(r.item)}”</span><p style="font-weight:700;color:var(--ink2)">${esc(r.text)}</p></div>`).join('')}`, true);
}
function renderCommission(catId) {
  const cat = D.COMMISSION_CATEGORIES.find(c => c.id === catId) || D.COMMISSION_CATEGORIES[0];
  let items = D.COMMISSION_ITEMS.filter(i => i.category === cat.id);
  if (commState.type !== 'All') items = items.filter(i => i.type === commState.type);
  if (commState.q) items = items.filter(i => (i.name + ' ' + i.code + ' ' + i.tags.join(' ')).toLowerCase().includes(commState.q));
  const sorters = {
    new: (a, b) => b.date.localeCompare(a.date), old: (a, b) => a.date.localeCompare(b.date),
    'low-high': (a, b) => a.price - b.price, 'high-low': (a, b) => b.price - a.price,
    popular: (a, b) => favCount(b) - favCount(a),
  };
  items = items.slice().sort(sorters[commState.sort] || sorters.new);
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>🎨 Commission — ${esc(cat.label)}</h1><p>Pick a YCH slot, we draw your character in it. That simple!</p></div>
    ${saleStrip()}
    <div class="comm-layout">
      <aside class="side"><h3>Categories</h3>
        ${D.COMMISSION_CATEGORIES.map(c => `<a href="#/commission/${c.id}" class="${c.id === cat.id ? 'on' : ''}">${esc(c.label)} <span class="sold-note">(${c.count})</span></a>`).join('')}
        <a class="custom-link" href="#/commission/custom">✏️ CUSTOM REQUEST</a>
      </aside>
      <div>
        <div class="rating-box"><span class="big-score">4.97</span>
          <div><span class="stars" style="font-size:20px">★★★★★</span><br><b>527 reviews</b> <span class="sold-note">(placeholder data)</span></div>
          <button class="btn btn-white" id="see-reviews" style="margin-left:auto">See all reviews</button></div>
        <div class="toolbar">
          <label class="search">🔎 <input id="comm-q" type="text" placeholder="Search emotes…" value="${esc(commState.q)}"></label>
          <select class="input" id="comm-sort">
            ${[['new', 'Newest'], ['old', 'Oldest'], ['low-high', 'Price: low → high'], ['high-low', 'Price: high → low'], ['popular', 'Most Popular']].map(([v, l]) => `<option value="${v}" ${commState.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="toolbar">${COMM_TYPES.map(t => `<button class="chip ${commState.type === t ? 'on' : ''}" data-type="${t}">${t}</button>`).join('')}</div>
        <div class="grid">${items.map(commissionCard).join('') || '<div class="empty-note">No cuties match that search 🌧️</div>'}</div>
        ${estBar('commission')}
        <div class="info-box"><h3>📋 DETAIL & TOS</h3>
          <div class="tier-grid">${D.PRICING_TIERS.map(t => `<div class="tier"><h4>${esc(t.title)}</h4><ul>${t.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`).join('')}</div>
          <p style="margin-top:12px;font-weight:700;color:var(--ink2)">Full terms live on the <a href="#/tos" style="color:var(--pink-dark);font-weight:800">TOS page</a>.</p>
        </div>
      </div>
    </div></div>`;
  $('#see-reviews').onclick = openReviews;
  $('#comm-q').addEventListener('input', e => { commState.q = e.target.value.trim().toLowerCase(); renderCommission(cat.id); const q = $('#comm-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); });
  $('#comm-sort').onchange = e => { commState.sort = e.target.value; renderCommission(cat.id); };
  $$('[data-type]').forEach(b => b.onclick = () => { commState.type = b.dataset.type; renderCommission(cat.id); });
  bindCommissionCards(app, D.COMMISSION_ITEMS);
}

/* ---------------- CUSTOM REQUEST ---------------- */
function renderCustom() {
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>✏️ Custom Request</h1><p>Something totally unique in mind? Tell us everything!</p></div>
    <div class="panel" style="max-width:760px;margin:0 auto">
      <form id="custom-form" class="form-grid" novalidate>
        <div class="form-2">
          <label>Your name *<input class="input" name="name" required placeholder="e.g. Mochi"></label>
          <label>Email *<input class="input" name="email" type="email" required placeholder="you@mail.com"></label>
        </div>
        <label>Service type
          <select class="input" name="service" style="width:100%;border-radius:14px">
            <option>Static Emotes</option><option>Animated Emotes</option><option>Chibi Illustration</option>
            <option>Stream Kit</option><option>VTuber Model</option><option>Other</option>
          </select></label>
        <label>Describe your request *<textarea class="input" name="desc" rows="4" required placeholder="Character, poses, expressions, colours, vibe…"></textarea></label>
        <div class="form-2">
          <label>Quantity<input class="input" name="qty" type="number" min="1" value="6"></label>
          <label>Deadline<input class="input" name="deadline" type="date"></label>
        </div>
        <label>Reference images (max 100MB)<input class="input" name="file" type="file" accept="image/*" id="custom-file">
          <span class="sold-note" id="file-note">No file chosen yet</span></label>
        <label>…or a Google Drive link<input class="input" name="drive" type="url" placeholder="https://drive.google.com/…"></label>
        <label>Preferred contact platform
          <select class="input" name="platform" style="width:100%;border-radius:14px">
            <option>VGen</option><option>Twitter</option><option>Email</option><option>Discord</option>
          </select></label>
        <fieldset style="border:3px dashed #f0d060;border-radius:16px;padding:14px 16px">
          <legend style="font-family:var(--font-head);font-weight:700;padding:0 8px">Add-ons (per emote)</legend>
          <label class="check-line"><input type="checkbox" class="addon" value="50"> Commercial Use +$50 / emote</label>
          <label class="check-line"><input type="checkbox" class="addon" value="50"> Merch Use +$50 / emote</label>
          <label class="check-line"><input type="checkbox" class="addon" value="50"> NDA +$50 / emote</label>
          <p style="margin-top:8px">Estimated add-on total: <b class="price" id="addon-total">$0</b> <span class="sold-note">(× quantity)</span></p>
        </fieldset>
        <label>Partner code (optional)<input class="input" name="partner" placeholder="e.g. FRIEND10"></label>
        <div id="custom-msg"></div>
        <button class="btn btn-pink btn-big" type="submit">💌 Send request</button>
      </form>
      <div id="custom-done"></div>
    </div></div>`;
  const qtyEl = $('[name=qty]');
  const updateTotal = () => {
    const per = $$('.addon').filter(a => a.checked).reduce((s, a) => s + (+a.value), 0);
    $('#addon-total').textContent = money(per * Math.max(1, +qtyEl.value || 1));
  };
  $$('.addon').forEach(a => a.onchange = updateTotal);
  qtyEl.oninput = updateTotal;
  $('#custom-file').onchange = e => { $('#file-note').textContent = e.target.files[0] ? '📎 ' + e.target.files[0].name : 'No file chosen yet'; };
  $('#custom-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = String(f.get('name') || '').trim(), email = String(f.get('email') || '').trim(), desc = String(f.get('desc') || '').trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || desc.length < 5) {
      $('#custom-msg').innerHTML = '<div class="form-error">Please fill name, a valid email, and a description (5+ characters) 🌧️</div>';
      return;
    }
    const addons = $$('.addon').filter(a => a.checked).length * 50 * Math.max(1, +f.get('qty') || 1);
    Store.addRequest({
      id: 'CR' + Date.now(), date: todayStr(), name, email, service: f.get('service'),
      desc, qty: +f.get('qty') || 1, deadline: f.get('deadline') || 'Flexible',
      platform: f.get('platform'), addons, status: 'Custom request — received',
    });
    $('#custom-form').classList.add('hidden');
    $('#custom-done').innerHTML = `<div class="form-ok">💌 Request sent! Thank you, ${esc(name)}.<br>
      We saved it — you can see it any time on your <a href="#/orders" style="color:var(--pink-dark)">Orders page</a>.<br>
      We usually reply within 2–3 days via ${esc(f.get('platform'))}.</div>`;
    toast('Custom request saved 💌');
  });
}

/* ============================================================
   STREAM KIT
   ============================================================ */
let skState = { sub: 'Special' };
function renderStreamKit() {
  const items = D.STREAMKIT_ITEMS.filter(i => i.tab === skState.sub);
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>📺 Stream Kit</h1><p>Ready-made animated stream packages — screens, alerts, panels & more.</p></div>
    ${saleStrip()}
    <div class="tabs">
      <a class="tab" href="#/commission" style="font-family:var(--font-head);font-weight:800;padding:10px 20px;border-radius:999px;background:#fff;border:3px solid #f0d060;color:var(--ink2)">YCH EMOTES</a>
      <button class="tab on">YCH STREAM KIT</button>
      <a class="tab" href="#/commission/custom" style="font-family:var(--font-head);font-weight:800;padding:10px 20px;border-radius:999px;background:#fff;border:3px solid #f0d060;color:var(--ink2)">CUSTOM</a>
    </div>
    <div class="tabs">${D.STREAMKIT_SUBTABS.map(t => `<button class="chip ${skState.sub === t ? 'on' : ''}" data-sub="${t}">${t}</button>`).join('')}</div>
    <div class="grid">
      ${items.map(i => `<div class="card video-card" data-vid="${i.id}">
        <div class="thumb" style="${thumbStyle(i)}">${artInner(i)}
          <div class="vid-ui"><button class="play-btn" data-play="${i.id}">▶</button><span>⏱ ${i.duration}</span><span>🔇</span></div></div>
        <div class="meta"><h3>${esc(i.name)}</h3>
          <div class="row"><span>${priceHTML(i.price)}</span>
          <button class="btn btn-yellow" style="padding:6px 16px;font-size:14px" data-add-sk="${i.id}">＋ Add</button></div>
        </div></div>`).join('') || '<div class="empty-note">Nothing here yet 🌧️</div>'}
    </div>
    ${estBar('streamkit')}</div>`;
  $$('[data-sub]').forEach(b => b.onclick = () => { skState.sub = b.dataset.sub; renderStreamKit(); });
  $$('[data-play]').forEach(b => b.onclick = () => {
    const card = b.closest('.video-card');
    const playing = card.classList.toggle('playing');
    b.textContent = playing ? '⏸' : '▶';
  });
  $$('[data-add-sk]').forEach(b => b.onclick = () => {
    const i = D.STREAMKIT_ITEMS.find(x => x.id === b.dataset.addSk);
    if (addToCartGuarded({ key: 'sk-' + i.id, kind: 'streamkit', refId: i.id, name: i.name, price: salePrice(i.price), emoji: i.emoji, hue: i.hue, img: i.img })) renderStreamKit();
  });
}

/* ============================================================
   VTUBERS
   ============================================================ */
let vtState = { tab: 'full' };
function renderVtubers() {
  const items = D.VTUBER_ITEMS.filter(i => i.tab === vtState.tab);
  app.innerHTML = `<div class="page wrap" style="background:linear-gradient(180deg,#fff6cf,#ffe9a8);border-radius:26px">
    <div class="sec-head"><h1>🎀 VTuber Models</h1><p>Full models, chibi models, and ready-to-adopt designs — rigging included.</p></div>
    ${saleStrip()}
    <div class="tabs" style="justify-content:center">${D.VTUBER_TABS.map(t => `<button class="tab ${vtState.tab === t.id ? 'on' : ''}" data-vt="${t.id}">${t.label}</button>`).join('')}</div>
    <div class="vt-grid">
      ${items.map(i => `<div class="vt-card">
        ${i.soldOut ? '<span class="sold-out">SOLD OUT</span>' : ''}
        <div class="arch" style="${thumbStyle(i)}">${i.img ? `<img class="arch-img contain" src="${esc(i.img)}" alt="${esc(i.name)}">` : `<img class="arch-img" src="${esc(A.vtuberPlaceholder)}" alt="VTuber placeholder art">`}</div>
        <h3>${esc(i.name)}</h3><div class="price">${vtuberPriceLabel(i)}${SALE_ON ? ' <span class="sale-badge">−20%</span>' : ''}</div>
        <button class="btn btn-yellow" style="margin-top:10px;padding:8px 18px;font-size:14px" data-vt-detail="${i.id}" ${i.soldOut ? 'disabled' : ''}>${i.soldOut ? 'SOLD OUT' : 'SHOW DETAIL'}</button>
      </div>`).join('')}
    </div></div>`;
  $$('[data-vt]').forEach(b => b.onclick = () => { vtState.tab = b.dataset.vt; renderVtubers(); });
  $$('[data-vt-detail]').forEach(b => b.onclick = () => {
    if (!requireLogin('Log in to view model details ♡')) return;
    const i = D.VTUBER_ITEMS.find(x => x.id === b.dataset.vtDetail);
    openModal(`<div class="modal-art" style="${thumbStyle(i)}">${i.img ? `<img class="arch-img contain" src="${esc(i.img)}" alt="${esc(i.name)}">` : `<img class="arch-img contain" src="${esc(A.vtuberPlaceholder)}" alt="VTuber placeholder art">`}</div>
      <h2>${esc(i.name)}</h2>
      <p style="font-weight:800;margin:6px 0"><span class="price" style="font-size:24px">${vtuberPriceLabel(i)}</span>${SALE_ON ? ' <span class="sale-badge">−20%</span>' : ''}</p>
      <p style="font-weight:700;color:var(--ink2);line-height:1.65">A hand-drawn ${i.tab === 'chibi' ? 'chibi' : 'full'} VTuber model in RESPA's signature cute style. Placeholder description — final copy and real artwork will replace this.</p>
      <ul style="margin:12px 0 12px 20px;font-weight:700;color:var(--ink2);line-height:1.7">
        <li>Live2D model art (.psd, separated layers)</li><li>Rigging included — ready for VTube Studio</li>
        <li>3 expressions + 2 toggles included</li><li>Commercial streaming use included</li><li>Delivery in ±3–5 weeks</li></ul>
      <a class="btn btn-pink" href="#/commission/custom" onclick="closeModal()">Order this model → Custom form</a>`);
  });
}

/* ============================================================
   SHOP
   ============================================================ */
let shopState = { cat: 'All', q: '', sort: 'new', page: 1 };
const SHOP_SORTS = [['new', 'Newest'], ['old', 'Oldest'], ['az', 'A – Z'], ['za', 'Z – A'], ['low-high', 'Price: low → high'], ['high-low', 'Price: high → low']];
function shopCard(i) {
  return `<div class="card" data-product="${i.slug}">
    <div class="thumb" style="${thumbStyle(i)}">${artInner(i)}</div>
    <div class="meta"><span class="tag alt">${esc(i.category)}</span>
      <h3 style="margin-top:5px">${esc(i.name)}</h3>
      <div class="row"><span>${i.originalPrice ? `<span class="price-was">${money(i.originalPrice)}</span> ` : ''}${i.free ? '<span class="price">$0 · Free</span>' : priceHTML(i.price)}</span>
      <span class="stars">★ ${i.rating}</span></div>
      <div class="sold-note">${i.sold} sold</div>
    </div></div>`;
}
function saleStrip() {
  if (!SALE_ON) return '';
  return `<div class="sale-strip"><img src="${esc(A.santa)}" alt="Santa RESPA"><div><b>🎄 Christmas Sale — ${SALE_PCT}% OFF everything!</b><span>Commission, stream kits, VTuber models & shop list prices — discount already applied. Happy holidays from RESPA Studio!</span></div><span class="sale-strip-badge">−${SALE_PCT}%</span></div>`;
}
function renderShop() {
  let items = D.SHOP_ITEMS.slice();
  if (shopState.cat !== 'All') items = items.filter(i => i.category === shopState.cat);
  if (shopState.q) items = items.filter(i => i.name.toLowerCase().includes(shopState.q));
  const sorters = {
    new: (a, b) => b.date.localeCompare(a.date), old: (a, b) => a.date.localeCompare(b.date),
    az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name),
    'low-high': (a, b) => a.price - b.price, 'high-low': (a, b) => b.price - a.price,
  };
  items.sort(sorters[shopState.sort] || sorters.new);
  const perPage = 12, pages = Math.max(1, Math.ceil(items.length / perPage));
  shopState.page = Math.min(shopState.page, pages);
  const pageItems = items.slice((shopState.page - 1) * perPage, shopState.page * perPage);
  const counts = { All: D.SHOP_ITEMS.length };
  D.SHOP_CATEGORIES.forEach(([c, n]) => counts[c] = n);
  app.innerHTML = `<div class="page wrap">
    <img class="banner-img" src="${esc(A.shopBanner)}" alt="RESPA Shop — ready-made overlays, badges, emotes and freebies" style="margin-bottom:22px">
    ${saleStrip()}
    <div class="shop-layout">
      <aside class="side"><h3>🗂️ Categories</h3>
        ${['All', ...D.SHOP_CATEGORIES.map(c => c[0])].map(c => `<div class="cat-radio ${shopState.cat === c ? 'on' : ''}" data-cat="${esc(c)}"><span>${c === 'All' ? '✿ Everything' : esc(c)}</span><span class="cnt">${counts[c]}</span></div>`).join('')}
      </aside>
      <div>
        <div class="toolbar">
          <label class="search">🔎 <input id="shop-q" type="text" placeholder="Search the shop…" value="${esc(shopState.q)}"></label>
          <select class="input" id="shop-sort">${SHOP_SORTS.map(([v, l]) => `<option value="${v}" ${shopState.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        </div>
        <p class="sold-note" style="margin-bottom:12px">${items.length} product${items.length === 1 ? '' : 's'} · page ${shopState.page} of ${pages}</p>
        <div class="grid">${pageItems.map(shopCard).join('') || '<div class="empty-note">Nothing found 🌧️</div>'}</div>
        <div class="pagination">
          <button data-pg="prev" ${shopState.page <= 1 ? 'disabled' : ''}>← Prev</button>
          ${Array.from({ length: pages }, (_, k) => `<button data-pg="${k + 1}" class="${shopState.page === k + 1 ? 'on' : ''}">${k + 1}</button>`).join('')}
          <button data-pg="next" ${shopState.page >= pages ? 'disabled' : ''}>Next →</button>
        </div>
      </div>
    </div></div>`;
  $$('[data-cat]').forEach(el => el.onclick = () => { shopState.cat = el.dataset.cat; shopState.page = 1; renderShop(); });
  $('#shop-q').addEventListener('input', e => { shopState.q = e.target.value.trim().toLowerCase(); shopState.page = 1; renderShop(); const q = $('#shop-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); });
  $('#shop-sort').onchange = e => { shopState.sort = e.target.value; shopState.page = 1; renderShop(); };
  $$('[data-pg]').forEach(b => b.onclick = () => {
    if (b.dataset.pg === 'prev') shopState.page--; else if (b.dataset.pg === 'next') shopState.page++; else shopState.page = +b.dataset.pg;
    renderShop(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $$('[data-product]').forEach(c => c.onclick = () => { location.hash = '#/shop/product/' + c.dataset.product; });
}
function renderProduct(slug) {
  const i = D.SHOP_ITEMS.find(x => x.slug === slug);
  if (!i) return render404();
  const minPwyw = i.free ? 0 : 2.50;
  const variants = [0, 40, 120, 220].map(h => (i.hue + h) % 360);
  const like = D.SHOP_ITEMS.filter(x => x.category === i.category && x.slug !== i.slug).slice(0, 3);
  app.innerHTML = `<div class="page wrap">
    <p style="margin-bottom:14px"><a href="#/shop" style="font-weight:800;color:var(--pink-dark)">← Back to Shop</a></p>
    <div class="pdp">
      <div>
        <div class="pdp-main" id="pdp-main" style="${artStyle(variants[0])}">${i.img ? `<img class="art-img" style="position:static;border-radius:22px" src="${esc(i.img)}" alt="${esc(i.name)}">` : `<span>${i.emoji}</span>`}</div>
        <div class="pdp-thumbs">${variants.map((h, k) => `<button data-thumb="${k}" class="${k === 0 ? 'on' : ''}" style="${artStyle(h)}">${i.emoji}</button>`).join('')}</div>
      </div>
      <div>
        <span class="tag alt">${esc(i.category)}</span>
        <h1 style="font-size:34px;margin:8px 0">${esc(i.name)}</h1>
        <p><span class="stars">★ ${i.rating}</span> · <b>${i.sold} sold</b> · listed ${i.date}</p>
        <p style="font-size:26px;margin:12px 0">${i.originalPrice ? `<span class="price-was">${money(i.originalPrice)}</span> ` : ''}${i.free ? '<span class="price">$0 · Freebie</span>' : priceHTML(i.price)}</p>
        ${SALE_ON && !i.free ? `<p class="sold-note" style="margin-bottom:8px">🎄 ${window.DATA.SALE.note}</p>` : ''}
        <label style="font-family:var(--font-head);font-weight:700;display:grid;gap:6px;max-width:320px">Pay what you want (min ${money(minPwyw)})
          <input class="input" id="pwyw" type="number" step="0.50" min="${minPwyw}" value="${salePrice(i.price)}"></label>
        <div style="display:flex;gap:10px;margin:18px 0;flex-wrap:wrap">
          <button class="btn btn-pink" id="pdp-add">🛒 Add to cart</button>
          <a class="btn btn-white" href="#/shop">Keep browsing</a>
        </div>
        <details class="acc" open><summary>📝 Description</summary><p>An original, ready-to-use ${esc(i.category.toLowerCase())} pack drawn in RESPA's cute style. Placeholder description — real product notes will replace this text. Works with Twitch, Discord, YouTube and most streaming tools.</p></details>
        <details class="acc"><summary>⚡ Instant Download</summary><p>Files are available immediately after checkout (demo store — no real payment is taken).</p></details>
        <details class="acc"><summary>🗂️ Digital file type</summary><p>PNG / GIF / WEBM depending on the pack, neatly organised in a ZIP archive.</p></details>
        <details class="acc"><summary>📅 Listed date</summary><p>First listed on ${i.date}. Updates are free for existing buyers.</p></details>
      </div>
    </div>
    <h2 style="margin:34px 0 14px">💖 You may also like</h2>
    <div class="grid">${like.map(shopCard).join('')}</div>
  </div>`;
  $$('[data-thumb]').forEach(b => b.onclick = () => {
    $$('[data-thumb]').forEach(x => x.classList.remove('on')); b.classList.add('on');
    if (!i.img) $('#pdp-main').style.cssText = artStyle(variants[+b.dataset.thumb]);
  });
  $$('[data-product]').forEach(c => c.onclick = () => { location.hash = '#/shop/product/' + c.dataset.product; });
  $('#pdp-add').onclick = () => {
    const val = parseFloat($('#pwyw').value);
    if (isNaN(val) || val < minPwyw) { toast(`Minimum for this item is ${money(minPwyw)} 🌧️`); return; }
    if (addToCartGuarded({ key: 'shop-' + i.slug, kind: 'shop', refId: i.slug, name: i.name, price: Math.round(val * 100) / 100, emoji: i.emoji, hue: i.hue, img: i.img })) route();
  };
}

/* ============================================================
   GACHA
   ============================================================ */
let gachaStarted = false, gachaAnimating = false, gachaTimer = null, pendingRewards = null;
function rollReward() {
  const pool = [];
  D.GACHA_REWARDS.forEach(r => { const w = D.GACHA_RARITY_WEIGHTS[r.rarity]; for (let k = 0; k < w; k++) pool.push(r); });
  return pool[Math.floor(Math.random() * pool.length)];
}
function renderGacha() {
  const g = Store.gacha();
  const owned = Store.ownedCount();
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>🎰 RESPA Gacha</h1><p>Collect all 20 original emote & sticker designs — just for fun, free coins only!</p>
    ${Store.user ? '' : '<p style="margin-top:8px"><span class="tag">👤 You are playing as a guest — <a href="#/login" style="font-weight:800;color:var(--pink-dark)">log in</a> so your progress feels official (it is saved in this browser either way).</span></p>'}
    </div>
    <div class="gacha-stage" id="gacha-stage">
      ${!gachaStarted ? `
        <div class="panel" style="max-width:520px;margin:20px auto;cursor:pointer" id="gacha-begin">
          <div style="font-size:80px">🎰</div>
          <h2 style="font-size:30px;margin:8px 0">Press any key to begin</h2>
          <p style="font-weight:700;color:var(--ink2)">…or click here. Your starting balance: <b>2,000 coins</b> 🪙</p>
        </div>` : `
        <div style="margin-bottom:14px"><span class="coin-pill">🪙 <span id="g-balance">${g.balance.toLocaleString()}</span> coins</span>
          <span class="coin-pill" style="background:#fff;color:var(--ink);border:3px solid var(--black);margin-left:8px">📦 Collection ${owned}/20</span></div>
        <div class="gacha-machine" id="gacha-machine">
          <div class="gacha-globe">🧸</div>
          <h2 style="margin-top:12px;font-size:26px">RESPA CAPSULE</h2>
          <p style="font-weight:700">1 pull = 100 · 5 pulls = 450 coins</p>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:18px 0">
          <button class="btn btn-pink" id="pull-1" ${gachaAnimating ? 'disabled' : ''}>🎁 1x PULL · 100</button>
          <button class="btn btn-yellow" id="pull-5" ${gachaAnimating ? 'disabled' : ''}>🎁🎁 5x PULL · 450</button>
          <button class="btn btn-white hidden" id="pull-skip">⏩ Skip to reward</button>
          <button class="btn btn-white" id="gacha-finish">✔ FINISH</button>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-white" id="daily" ${Store.canClaimDaily() ? '' : 'disabled'}>🗓️ Claim daily coins +500 ${Store.canClaimDaily() ? '' : '(claimed today)'}</button>
          <button class="btn btn-white" id="gacha-faq">❓ FAQ</button>
          <button class="btn btn-white" id="gacha-collection">📦 My Rewards (${owned}/20)</button>
          <button class="btn btn-white" id="gacha-mute">🔊 Mute background sound</button>
          <a class="btn btn-white" href="#/">🏘️ Back to town</a>
        </div>
        <h2 style="margin:34px 0 14px">📦 Rewards Collection — ${owned}/20</h2>
        <div class="grid">${D.GACHA_REWARDS.map(r => {
          const has = !!g.collection[r.id];
          return `<div class="reward-card rarity-${r.rarity} ${has ? '' : 'locked'}">
            <div class="thumb">${has ? artInner(r, '') : '❔'}</div>
            <h3>${has ? esc(r.name) : '???'}</h3>
            <div class="rarity-label">${r.rarity}</div>
            <div class="sold-note">${has ? 'Owned ×' + g.collection[r.id] : 'Not yet collected'}</div></div>`;
        }).join('')}</div>`}
    </div></div>`;
  if (!gachaStarted) {
    const begin = () => { Sound.autoStart(); gachaStarted = true; renderGacha(); };
    $('#gacha-begin').onclick = begin;
    const keyH = () => { document.removeEventListener('keydown', keyH); if ((location.hash || '').startsWith('#/gacha')) begin(); };
    document.addEventListener('keydown', keyH);
    return;
  }
  const bind = () => {
    const b1 = $('#pull-1'), b5 = $('#pull-5');
    if (b1) b1.onclick = () => doPull(1);
    if (b5) b5.onclick = () => doPull(5);
    const fin = $('#gacha-finish'); if (fin) fin.onclick = () => { gachaStarted = false; renderGacha(); };
    const daily = $('#daily'); if (daily) daily.onclick = () => { if (Store.claimDaily()) { toast('+500 daily coins claimed! 🪙'); renderGacha(); } };
    const faq = $('#gacha-faq'); if (faq) faq.onclick = () => openModal(`<h2>❓ Gacha FAQ</h2>${D.GACHA_FAQ.map(([q, a]) => `<div class="review-row"><b>${esc(q)}</b><p style="font-weight:700;color:var(--ink2)">${esc(a)}</p></div>`).join('')}`);
    const col = $('#gacha-collection'); if (col) col.onclick = () => document.querySelector('.reward-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const skip = $('#pull-skip'); if (skip) skip.onclick = revealRewards;
    const gm = $('#gacha-mute'); if (gm) gm.onclick = () => { Sound.toggle(); Sound.syncBtns(); };
    Sound.syncBtns();
  };
  bind();
}
function doPull(n) {
  const cost = n === 5 ? 450 : 100;
  const g = Store.gacha();
  if (g.balance < cost) { Sound.sfx('error'); toast('Not enough coins 🌧️ Claim your daily +500!'); return; }
  Sound.sfx('coin');
  Store.setBalance(g.balance - cost);
  pendingRewards = Array.from({ length: n }, rollReward);
  gachaAnimating = true; renderGacha();
  const machine = $('#gacha-machine'); if (machine) machine.classList.add('shaking');
  const skip = $('#pull-skip'); if (skip) skip.classList.remove('hidden');
  gachaTimer = setTimeout(revealRewards, 1200);
}
function revealRewards() {
  if (!pendingRewards) return;
  if (gachaTimer) clearTimeout(gachaTimer);
  gachaAnimating = false;
  const rewards = pendingRewards; pendingRewards = null;
  let dupCoins = 0;
  const cards = rewards.map(r => {
    const isNew = Store.ownReward(r.id);
    if (!isNew) { dupCoins += 20; }
    return { r, isNew };
  });
  if (dupCoins > 0) Store.setBalance(Store.gacha().balance + dupCoins);
  Sound.sfx('win');
  Store.save(); updateHeader();
  openModal(`<h2 style="text-align:center">🎉 Your Rewards!</h2>
    ${dupCoins ? `<p style="text-align:center;font-weight:800;margin:6px 0">Duplicates converted: +${dupCoins} coins 🪙</p>` : ''}
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin-top:12px">
      ${cards.map(({ r, isNew }) => `<div class="reward-card rarity-${r.rarity}"><div class="thumb">${artInner(r, '')}</div>
        <h3 style="font-size:15px">${esc(r.name)}</h3><div class="rarity-label">${r.rarity}</div>
        <div class="sold-note">${isNew ? '✨ NEW!' : 'Duplicate → +20 🪙'}</div></div>`).join('')}
    </div>
    <div style="text-align:center;margin-top:16px"><button class="btn btn-pink" onclick="closeModal()">Collect ♡</button></div>`);
  renderGacha();
}

/* ============================================================
   AUTH
   ============================================================ */
function renderLogin() {
  app.innerHTML = `<div class="auth-shell"><div class="auth-card">
    <img class="asset-logo logo-img" style="margin:0 auto 10px;height:56px" alt="RESPA Studio logo">
    <h1>Welcome back!</h1><p class="sub">Log in to order, check out and save your gacha progress.</p>
    <form id="login-form" class="form-grid">
      <label>Email<input class="input" name="email" type="email" required placeholder="you@mail.com"></label>
      <label>Password<input class="input" name="password" type="password" required placeholder="••••••••"></label>
      <label class="check-line"><input type="checkbox" name="remember" checked> Remember me</label>
      <div id="login-msg"></div>
      <button class="btn btn-pink" type="submit" style="width:100%">LOGIN</button>
    </form>
    <p style="text-align:center;margin-top:14px;font-weight:700">
      <a href="#" id="forgot" style="color:var(--pink-dark)">Forgot password?</a><br>
      New here? <a href="#/register" style="color:var(--pink-dark);font-weight:800">Register an account →</a></p>
  </div></div>`;
  applyShellAssets();
  $('#forgot').onclick = e => { e.preventDefault(); $('#login-msg').innerHTML = '<div class="form-ok">📧 Check your email — we sent a password reset link (demo: nothing was actually sent).</div>'; };
  $('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const res = Store.login(String(f.get('email')).trim().toLowerCase(), String(f.get('password')));
    if (!res.ok) { $('#login-msg').innerHTML = `<div class="form-error">${esc(res.error)}</div>`; return; }
    updateHeader(); toast('Welcome back, ' + Store.user.name + '! ♡');
    const back = sessionStorage.getItem('respa_redirect');
    sessionStorage.removeItem('respa_redirect');
    location.hash = back && back !== '#/login' ? back : '#/';
  });
}
function renderRegister() {
  app.innerHTML = `<div class="auth-shell"><div class="auth-card">
    <img class="asset-logo logo-img" style="margin:0 auto 10px;height:56px" alt="RESPA Studio logo">
    <h1>Join RESPA Studio</h1><p class="sub">One account for commissions, shop, orders & gacha.</p>
    <form id="reg-form" class="form-grid">
      <label>Name<input class="input" name="name" required placeholder="Your display name"></label>
      <label>Email<input class="input" name="email" type="email" required placeholder="you@mail.com"></label>
      <label>Password<input class="input" name="password" type="password" required minlength="6" placeholder="Min. 6 characters"></label>
      <label>Confirm password<input class="input" name="confirm" type="password" required placeholder="Repeat it"></label>
      <label class="check-line"><input type="checkbox" id="robot"> 🤖 I'm not a robot</label>
      <div id="reg-msg"></div>
      <button class="btn btn-pink" type="submit" style="width:100%">REGISTER</button>
    </form>
    <p style="text-align:center;margin-top:14px;font-weight:700">Already have an account? <a href="#/login" style="color:var(--pink-dark);font-weight:800">Log in →</a></p>
  </div></div>`;
  applyShellAssets();
  $('#reg-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const err = (m) => { $('#reg-msg').innerHTML = `<div class="form-error">${m}</div>`; };
    if (!$('#robot').checked) return err('Please tick “I\'m not a robot” 🤖');
    if (String(f.get('password')) !== String(f.get('confirm'))) return err('Passwords do not match 🌧️');
    const res = Store.register(String(f.get('name')).trim(), String(f.get('email')).trim().toLowerCase(), String(f.get('password')));
    if (!res.ok) return err(esc(res.error));
    updateHeader(); toast('Account created — welcome, ' + Store.user.name + '! 🎉');
    location.hash = '#/';
  });
}

/* ============================================================
   CART · ORDERS · WISHLIST · PROFILE
   ============================================================ */
function renderCart() {
  const cart = Store.data.cart;
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>🛒 Your Cart</h1><p>${cart.length ? 'Almost yours — review and check out!' : 'Your cart is feeling lonely…'}</p></div>
    <div style="max-width:820px;margin:0 auto">
      ${cart.map(c => `<div class="cart-row">
        <div class="cart-thumb" style="${thumbStyle(c)}">${artInner(c, '')}</div>
        <div><b>${esc(c.name)}</b><div class="sold-note">${esc(c.kind)} · ${money(c.price)} each</div></div>
        <div style="display:flex;gap:7px;align-items:center">
          <button class="qty-btn" data-dec="${esc(c.key)}">−</button><b>${c.qty}</b><button class="qty-btn" data-inc="${esc(c.key)}">+</button>
        </div>
        <b>${money(c.price * c.qty)}</b>
        <button class="qty-btn" style="background:#ffe1e1" data-del="${esc(c.key)}" title="Remove">🗑</button>
      </div>`).join('') || '<div class="empty-note">🛒 Cart is empty — visit the <a href="#/shop" style="color:var(--pink-dark)">Shop</a> or <a href="#/commission" style="color:var(--pink-dark)">Commission</a> pages!</div>'}
      ${cart.length ? `<div class="panel" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div style="font-family:var(--font-head);font-size:21px">Subtotal: <b class="price" style="font-size:24px">${money(Store.cartTotal())}</b></div>
        <button class="btn btn-pink btn-big" id="checkout">Checkout →</button></div>` : ''}
    </div></div>`;
  $$('[data-inc]').forEach(b => b.onclick = () => { const it = Store.data.cart.find(c => c.key === b.dataset.inc); Store.setQty(b.dataset.inc, it.qty + 1); updateHeader(); renderCart(); });
  $$('[data-dec]').forEach(b => b.onclick = () => { const it = Store.data.cart.find(c => c.key === b.dataset.dec); Store.setQty(b.dataset.dec, it.qty - 1); updateHeader(); renderCart(); });
  $$('[data-del]').forEach(b => b.onclick = () => { Store.removeFromCart(b.dataset.del); updateHeader(); renderCart(); toast('Removed from cart'); });
  const co = $('#checkout');
  if (co) co.onclick = () => {
    if (!requireLogin('Log in to check out ♡')) return;
    const order = {
      id: 'RS' + Date.now().toString().slice(-8), date: todayStr(),
      total: Store.cartTotal(), items: Store.data.cart.map(c => `${c.name} ×${c.qty}`),
      status: 'Waiting for payment — demo',
    };
    Store.addOrder(order); Store.clearCart(); updateHeader();
    toast('Order placed! (demo — no real payment) 🎉');
    location.hash = '#/orders';
  };
}
function renderOrders() {
  if (!requireLogin('Log in to see your orders ♡')) return;
  const orders = Store.data.orders, reqs = Store.data.requests;
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>📦 My Orders</h1><p>Your purchases and custom requests, all in one place.</p></div>
    <div style="max-width:820px;margin:0 auto">
      ${orders.map(o => `<div class="order-card">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><b>#${o.id}</b><span class="status-chip">${esc(o.status)}</span></div>
        <div class="sold-note" style="margin:5px 0">${o.date} · Total <b>${money(o.total)}</b></div>
        <ul style="margin-left:18px;font-weight:700;color:var(--ink2)">${o.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>`).join('')}
      ${reqs.map(r => `<div class="order-card">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><b>✏️ Custom request — ${esc(r.service)}</b><span class="status-chip">${esc(r.status)}</span></div>
        <div class="sold-note" style="margin:5px 0">${r.date} · Qty ${r.qty} · Deadline: ${esc(r.deadline)} · via ${esc(r.platform)}${r.addons ? ' · Add-ons ' + money(r.addons) : ''}</div>
        <p style="font-weight:700;color:var(--ink2)">${esc(r.desc)}</p>
      </div>`).join('')}
      ${!orders.length && !reqs.length ? '<div class="empty-note">No orders yet — your future cuteness will appear here ♡</div>' : ''}
    </div></div>`;
}
function renderWishlist() {
  if (!requireLogin('Log in to see your wishlist ♡')) return;
  const favs = D.COMMISSION_ITEMS.filter(i => Store.isFav(i.id));
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>💖 My Wishlist</h1><p>Every piece you hearted on the commission pages.</p></div>
    <div class="grid">${favs.map(commissionCard).join('') || '<div class="empty-note">No favorites yet — tap 🤍 on any commission piece!</div>'}</div></div>`;
  bindCommissionCards(app, D.COMMISSION_ITEMS);
}
function renderProfile() {
  if (!requireLogin('Log in to view your profile ♡')) return;
  const u = Store.user;
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>👤 Profile</h1></div>
    <div class="panel" style="max-width:640px;margin:0 auto;text-align:center">
      <div style="font-size:74px">🧑‍🎨</div>
      <h2 style="font-size:28px">${esc(u.name)}</h2>
      <p style="font-weight:700;color:var(--ink2)">${esc(u.email)}</p>
      <div class="stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin-top:22px">
        <div class="stat panel" style="padding:16px"><div class="num" style="font-family:var(--font-head);font-size:30px;font-weight:800;color:var(--pink-dark)">${Store.data.orders.length}</div><div class="lbl" style="font-weight:800;color:var(--ink2)">Orders</div></div>
        <div class="stat panel" style="padding:16px"><div class="num" style="font-family:var(--font-head);font-size:30px;font-weight:800;color:var(--pink-dark)">${Store.favIds().length}</div><div class="lbl" style="font-weight:800;color:var(--ink2)">Favorites</div></div>
        <div class="stat panel" style="padding:16px"><div class="num" style="font-family:var(--font-head);font-size:30px;font-weight:800;color:var(--pink-dark)">${Store.ownedCount()}/20</div><div class="lbl" style="font-weight:800;color:var(--ink2)">Gacha collection</div></div>
        <div class="stat panel" style="padding:16px"><div class="num" style="font-family:var(--font-head);font-size:30px;font-weight:800;color:var(--pink-dark)">${Store.gacha().balance.toLocaleString()}</div><div class="lbl" style="font-weight:800;color:var(--ink2)">Gacha coins 🪙</div></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:22px;flex-wrap:wrap">
        <a class="btn btn-yellow" href="#/orders">📦 My Orders</a>
        <a class="btn btn-white" href="#/wishlist">💖 Wishlist</a>
        <button class="btn btn-white" id="profile-logout">🚪 Log out</button>
      </div>
    </div></div>`;
  $('#profile-logout').onclick = () => { Store.logout(); updateHeader(); toast('Logged out — see you soon! 👋'); location.hash = '#/'; };
}

/* ============================================================
   TOS · ABOUT · HOW TO ORDER · 404
   ============================================================ */
function renderTOS() {
  const sections = [
    ['1. General', 'By ordering from RESPA Studio you agree to these terms. All products are digital artworks made to order; no physical item is shipped. Placeholder terms for demo purposes — the studio will publish its final wording here.'],
    ['2. Payments', 'Work begins after payment is confirmed through the checkout channel agreed with the studio. Prices are in USD. The demo checkout on this site never takes a real payment.'],
    ['3. Revisions', 'Each commission includes a sketch preview and reasonable small revisions during the sketch stage. Large changes after colouring has started may cost an edit fee starting at $5.'],
    ['4. Deadlines', 'Standard turnaround is 2–3 weeks depending on queue and complexity. Rush delivery may be available for a fee — ask before ordering if you have a fixed date.'],
    ['5. Use', 'Finished emotes may be used on your own channels and communities. Commercial and merch use require the matching add-on. You may not resell, redistribute, or claim the artwork as your own creation.'],
    ['6. Intellectual Property', 'RESPA Studio retains copyright of the artwork and may display it in portfolios and social media unless an NDA add-on is purchased. Characters and references you provide remain yours.'],
    ['7. Refunds', 'Full refunds are possible before the sketch is approved. After approval, partial refunds depend on how much work is completed. Completed work is not refundable.'],
    ['8. Communication', 'Please keep communication polite and in one thread where possible. Response times are usually within 2–3 days. Chargebacks without contacting the studio first will result in a ban from future orders.'],
  ];
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>📜 Terms of Service</h1><p>Please read before ordering — short, friendly and fair.</p></div>
    <div class="tos-box" id="tos-box">
      ${sections.map(([t, p]) => `<h3>${t}</h3><p>${p}</p>`).join('')}
    </div>
    <div style="text-align:center;margin-top:16px"><button class="btn btn-yellow" id="tos-expand">▼ Expand full TOS</button></div>
  </div>`;
  $('#tos-expand').onclick = () => {
    const box = $('#tos-box'), open = box.classList.toggle('expanded');
    $('#tos-expand').textContent = open ? '▲ Collapse TOS' : '▼ Expand full TOS';
  };
}
function renderAbout() {
  app.innerHTML = `<div class="page wrap">
    <div class="about-hero">
      <img class="mascot-img" src="${esc(A.mascot)}" alt="RESPA Studio mascot (placeholder)">
      <h1 style="font-size:clamp(32px,5vw,48px);font-weight:800;margin-top:10px">About RESPA Studio ✿</h1>
      <p style="max-width:640px;margin:10px auto;font-weight:700;color:var(--ink2);line-height:1.65">
        RESPA Studio (respadesign) began as one artist with a tablet and a soft spot for chubby-cheeked characters.
        Today we serve gaming and streaming communities all over the world with custom emotes, animated goodies,
        stream kits and VTuber models — every piece hand-drawn, every client treated like a neighbour in our little town.</p>
    </div>
    <div class="steps-grid" style="margin-top:28px">
      <div class="step"><div style="font-size:36px">🐾</div><h3>Emotes & Chibi Art</h3><p style="font-weight:700;color:var(--ink2)">Static and animated emotes of pets, mascots and characters, in every platform size.</p></div>
      <div class="step"><div style="font-size:36px">📺</div><h3>Stream Kits</h3><p style="font-weight:700;color:var(--ink2)">Screens, alerts, panels and banners that make a channel feel like home.</p></div>
      <div class="step"><div style="font-size:36px">🎀</div><h3>VTuber Models</h3><p style="font-weight:700;color:var(--ink2)">Full and chibi Live2D models, plus ready-to-adopt designs looking for a home.</p></div>
      <div class="step"><div style="font-size:36px">🛍️</div><h3>Digital Shop</h3><p style="font-weight:700;color:var(--ink2)">Ready-made overlays, badges and freebies with instant download.</p></div>
    </div>
    <div style="text-align:center;margin:30px 0">
      <img class="hero-img" src="${esc(A.hero)}" alt="RESPA Studio hero artwork (placeholder)" style="max-width:760px;margin:0 auto 22px">
      <div class="footer-social" style="justify-content:center">
        <a href="#">🎨 VGen</a><a href="#">☕ Ko-fi</a><a href="#">💬 Discord</a><a href="#">📸 Instagram</a>
        <a href="#">𝕏</a><a href="#">🎵 TikTok</a><a href="#">▶️ YouTube</a><a href="https://www.fiverr.com/respadesign" target="_blank" rel="noopener">⭐ Fiverr</a><a href="#">✉️ Email</a>
      </div>
      <a class="btn btn-pink btn-big" href="#/commission" style="margin-top:10px">✿ Commission us</a>
    </div></div>`;
}
function renderHowToOrder() {
  const steps = [
    ['Pick your favourite', 'Browse the Commission pages or the Shop. Heart the pieces you love so they land in your wishlist.'],
    ['Log in & add to cart', 'Transactional steps need an account — it takes a minute and keeps your orders tidy.'],
    ['Check out', 'Review your cart and place the order. In this demo no real payment happens; the real studio confirms payment details with you directly.'],
    ['Send your references', 'For YCH slots, send photos or references of your character/pet after ordering — or use the Custom Request form for something unique.'],
    ['Approve the sketch', 'We send a preview first. Ask for small tweaks, then we colour and polish.'],
    ['Receive all sizes', 'Final files arrive in every platform size (112/56/28 px plus a bonus 500 px PNG, or GIF for animated). Upload and enjoy!'],
  ];
  app.innerHTML = `<div class="page wrap">
    <div class="sec-head"><h1>🧾 How to Order</h1><p>From “aww, cute!” to emotes in your chat — in six easy steps.</p></div>
    <div class="steps-grid">${steps.map(([t, p], i) => `<div class="step"><div class="n">${i + 1}</div><h3>${t}</h3><p style="font-weight:700;color:var(--ink2);line-height:1.55">${p}</p></div>`).join('')}</div>
    <div style="text-align:center;margin-top:28px"><a class="btn btn-pink" href="#/commission">Start at the Commission page →</a></div>
  </div>`;
}
function render404() {
  app.innerHTML = `<div class="page wrap" style="text-align:center">
    <img class="hero-img" src="${esc(A.hero)}" alt="RESPA Studio hero artwork (placeholder)" style="max-width:640px;margin:0 auto 20px">
    <h1 style="font-size:40px;font-weight:800">🍃 Lost in town?</h1>
    <p style="font-weight:700;color:var(--ink2);margin:10px 0 20px">That street doesn't exist in the Town of RESPA (yet).</p>
    <a class="btn btn-pink" href="#/">🏘️ Back to the town map</a></div>`;
}

/* ============================================================
   ROUTER
   ============================================================ */
function route() {
  TownAnim.stop();
  closeModal();
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\//, '').split('/');
  const head = parts[0] || '';
  window.scrollTo({ top: 0 });
  if (hash === '#/' || hash === '#' || hash === '') renderHome();
  else if (head === 'commission' && parts[1] === 'custom') renderCustom();
  else if (head === 'commission') renderCommission(parts[1] || 'static');
  else if (head === 'stream-kit') renderStreamKit();
  else if (head === 'vtubers') renderVtubers();
  else if (head === 'shop' && parts[1] === 'product') renderProduct(parts[2] || '');
  else if (head === 'shop') renderShop();
  else if (head === 'gacha') renderGacha();
  else if (head === 'login') renderLogin();
  else if (head === 'register') renderRegister();
  else if (head === 'cart') renderCart();
  else if (head === 'orders') renderOrders();
  else if (head === 'wishlist') renderWishlist();
  else if (head === 'profile') renderProfile();
  else if (head === 'tos') renderTOS();
  else if (head === 'about') renderAbout();
  else if (head === 'how-to-order') renderHowToOrder();
  else render404();
  updateHeader();
}
/* Page transitions: a short loading overlay (logo + progress bar +
   mascot) plays on every route change — the reference site's pattern. */
let transToken = 0;
function routeWithTransition() {
  if (!entered) { route(); return; }
  const ov = $('#page-transition');
  if (!ov) { route(); return; }
  const token = ++transToken;
  ov.classList.remove('hidden');
  requestAnimationFrame(() => ov.classList.add('show'));
  setTimeout(() => {
    if (token !== transToken) return;
    route();
    setTimeout(() => {
      if (token !== transToken) return;
      ov.classList.remove('show');
      setTimeout(() => { if (token === transToken) ov.classList.add('hidden'); }, 240);
    }, 80);
  }, 430);
}
window.addEventListener('hashchange', routeWithTransition);

/* ============================================================
   CHAT WIDGET + HEADER EVENTS + SOUND BUTTON
   ============================================================ */
function botReply(text) {
  const t = text.toLowerCase();
  if (/(price|harga|cost|much)/.test(t)) return 'Static emote packs start at $60 for 6, animated from $30 each. Full tiers are on the Commission page ♡';
  if (/(order|commission|buy)/.test(t)) return 'You can order via the Commission page, or message us on Fiverr: fiverr.com/respadesign ⭐';
  if (/(hi|hello|halo|hey)/.test(t)) return 'Hello hello! ✿ Looking for emotes, a stream kit, or a VTuber model today?';
  if (/(gacha|coin)/.test(t)) return 'The gacha machine lives in town — 1 pull is 100 coins and daily coins are free! 🎰';
  if (/(time|long|deadline|turnaround)/.test(t)) return 'Standard turnaround is 2–3 weeks. Rush slots depend on the queue — ask us here!';
  return 'Thanks for your message! A human (or a very cute bot) will reply soon. Meanwhile, the Commission and Shop pages might have what you need ✿';
}
function initChat() {
  const panel = $('#chat-panel'), log = $('#chat-log');
  let greeted = false;
  $('#chat-btn').onclick = () => {
    if (!Store.user) { requireLogin('Log in to chat with us ♡'); return; }
    panel.classList.toggle('hidden');
    if (!greeted) {
      greeted = true;
      log.innerHTML += `<div class="msg bot">Hi ${esc(Store.user.name.split(' ')[0])}! ✿ I'm the RESPA helper bot. Ask me about prices, orders or turnaround!</div>`;
      log.scrollTop = log.scrollHeight;
    }
  };
  $('#chat-close').onclick = () => panel.classList.add('hidden');
  $('#chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#chat-input'), v = input.value.trim();
    if (!v) return;
    log.innerHTML += `<div class="msg me">${esc(v)}</div>`;
    input.value = '';
    log.scrollTop = log.scrollHeight;
    setTimeout(() => { log.innerHTML += `<div class="msg bot">${esc(botReply(v))}</div>`; log.scrollTop = log.scrollHeight; }, 450);
  });
}
function initHeader() {
  $('#account-btn').onclick = (e) => {
    e.stopPropagation();
    if (!Store.user) { location.hash = '#/login'; return; }
    $('#account-menu').classList.toggle('hidden');
  };
  document.addEventListener('click', e => {
    const menu = $('#account-menu');
    if (menu && !menu.classList.contains('hidden') && !e.target.closest('.account-wrap')) menu.classList.add('hidden');
  });
  $('#logout-btn').onclick = () => {
    Store.logout(); updateHeader();
    $('#account-menu').classList.add('hidden');
    toast('Logged out — see you soon! 👋');
    location.hash = '#/';
  };
  $('#sound-btn').onclick = () => { Sound.toggle(); toast(Sound.on ? 'Music on 🎵' : 'Music off 🔇'); };
}

/* ---------------- global click SFX (subtle, throttled) ---------------- */
let lastClickSfx = 0;
document.addEventListener('click', e => {
  if (!Sound.on) return;
  if (!e.target.closest('button, a.btn, .chip, .tab, .cat-radio')) return;
  const now = Date.now(); if (now - lastClickSfx < 70) return;
  lastClickSfx = now; Sound.sfx('click');
}, true);

/* ---------------- Christmas snow ---------------- */
const Snow = {
  cv: null, cx: null, flakes: [], raf: 0, running: false,
  start() {
    if (this.running) return;
    this.cv = $('#snow-canvas'); if (!this.cv) return;
    this.cx = this.cv.getContext('2d');
    if (!this.cx) { this.running = false; return; }
    this.running = true;
    const fit = () => { this.cv.width = innerWidth; this.cv.height = innerHeight; };
    fit(); addEventListener('resize', fit);
    this.flakes = Array.from({ length: 70 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 1 + Math.random() * 2.4, s: 0.4 + Math.random() * 0.9, ph: Math.random() * 6.28 }));
    const tick = () => {
      if (!this.running) return;
      const { cx, cv } = this; cx.clearRect(0, 0, cv.width, cv.height);
      cx.fillStyle = 'rgba(255,255,255,.85)';
      for (const f of this.flakes) {
        f.y += f.s; f.ph += 0.008; f.x += Math.sin(f.ph) * 0.4;
        if (f.y > cv.height + 4) { f.y = -4; f.x = Math.random() * cv.width; }
        cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.29); cx.fill();
      }
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  },
};

/* ---------------- boot ---------------- */
applyShellAssets();
Snow.start();
initSplash();
initHeader();
initChat();
if (entered) { showChrome(); updateHeader(); route(); }
else if (location.hash && location.hash !== '#/') { /* still show splash first, like the original */ }
