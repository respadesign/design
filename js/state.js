/* ============================================================
   RESPA Studio — localStorage store
   Front-end demo only: accounts, cart, orders etc. live in the
   visitor's browser. Passwords are stored as a tiny hash,
   never as plaintext (still NOT secure — demo purposes only).
   ============================================================ */
'use strict';

const STORE_KEY = 'respa_studio_v1';

function tinyHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(16);
}
function todayStr() { return new Date().toISOString().slice(0, 10); }

const defaultState = () => ({
  users: [],            // {name, email, passHash}
  user: null,           // {name, email} when logged in
  cart: [],             // {key, kind, refId, name, price, qty, emoji, hue}
  favorites: {},        // commission item id -> true
  gacha: { balance: 2000, collection: {}, lastDaily: null },
  orders: [],           // {id, date, total, items:[names], status}
  requests: [],         // custom request records
  sound: false,
});

const Store = {
  data: defaultState(),
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) this.data = Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { /* corrupted storage -> start fresh */ }
    return this.data;
  },
  save() { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); },

  /* ---- auth ---- */
  register(name, email, password) {
    if (this.data.users.some(u => u.email === email)) return { ok: false, error: 'That email is already registered. Try logging in!' };
    this.data.users.push({ name, email, passHash: tinyHash(password) });
    this.data.user = { name, email };
    this.save();
    return { ok: true };
  },
  login(email, password) {
    const u = this.data.users.find(u => u.email === email);
    if (!u) return { ok: false, error: 'No account with that email yet. Register first!' };
    if (u.passHash !== tinyHash(password)) return { ok: false, error: 'Wrong password. Try again!' };
    this.data.user = { name: u.name, email: u.email };
    this.save();
    return { ok: true };
  },
  logout() { this.data.user = null; this.save(); },
  get user() { return this.data.user; },

  /* ---- cart ---- */
  addToCart(item) {
    const found = this.data.cart.find(c => c.key === item.key);
    if (found) found.qty += item.qty || 1;
    else this.data.cart.push(Object.assign({ qty: 1 }, item));
    this.save();
  },
  removeFromCart(key) { this.data.cart = this.data.cart.filter(c => c.key !== key); this.save(); },
  setQty(key, qty) {
    const it = this.data.cart.find(c => c.key === key);
    if (it) it.qty = Math.max(1, qty);
    this.save();
  },
  cartCount() { return this.data.cart.reduce((s, c) => s + c.qty, 0); },
  cartTotal(kind) {
    return this.data.cart
      .filter(c => !kind || c.kind === kind)
      .reduce((s, c) => s + c.price * c.qty, 0);
  },
  cartCountKind(kind) {
    return this.data.cart.filter(c => c.kind === kind).reduce((s, c) => s + c.qty, 0);
  },
  clearCart() { this.data.cart = []; this.save(); },

  /* ---- favorites ---- */
  isFav(id) { return !!this.data.favorites[id]; },
  toggleFav(id) {
    if (this.data.favorites[id]) delete this.data.favorites[id];
    else this.data.favorites[id] = true;
    this.save();
    return !!this.data.favorites[id];
  },
  favIds() { return Object.keys(this.data.favorites); },

  /* ---- orders & requests ---- */
  addOrder(order) { this.data.orders.unshift(order); this.save(); },
  addRequest(req) { this.data.requests.unshift(req); this.save(); },

  /* ---- gacha ---- */
  gacha() { return this.data.gacha; },
  setBalance(v) { this.data.gacha.balance = v; this.save(); },
  ownReward(id) {
    const g = this.data.gacha;
    if (g.collection[id]) { g.collection[id]++; return false; } // duplicate
    g.collection[id] = 1; return true;
  },
  ownedCount() { return Object.keys(this.data.gacha.collection).length; },
  canClaimDaily() { return this.data.gacha.lastDaily !== todayStr(); },
  claimDaily() {
    if (!this.canClaimDaily()) return false;
    this.data.gacha.lastDaily = todayStr();
    this.data.gacha.balance += 500;
    this.save();
    return true;
  },
};
Store.load();
window.Store = Store;
window.tinyHash = tinyHash;
window.todayStr = todayStr;
