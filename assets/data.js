/* Kamdhenu App prototype: shared demo data, pricing rules and state.
   All names, prices and numbers are illustrative demo values. */
const KD = (() => {
  const GST = 0.18;          // TMT, binding wire and nails
  const BUFFER = 0.02;       // refundable weight buffer on kg-billed items
  const MIN_TMT_T = 0.5;    // minimum TMT per order, in tonnes
  const RADIUS_KM = 15;
  const ACCEPT_MIN = 15;

  const slabs = [
    { upto: 5, fee: 800 },
    { upto: 10, fee: 1200 },
    { upto: 15, fee: 1600 },
  ];
  const feeFor = km => (slabs.find(s => km <= s.upto) || slabs[slabs.length - 1]).fee;
  const slabLabel = km => {
    const i = slabs.findIndex(s => km <= s.upto);
    const lo = i <= 0 ? 0 : slabs[i - 1].upto;
    return `${lo} to ${slabs[i].upto} km`;
  };

  const zones = [
    { id: 'sgoa', name: 'South Goa', state: 'Goa' },
    { id: 'ngoa', name: 'North Goa', state: 'Goa' },
    { id: 'bgm', name: 'Belagavi', state: 'Karnataka' },
    { id: 'hbl', name: 'Hubballi-Dharwad', state: 'Karnataka' },
  ];

  // Standard 12 m bar weight: d^2 / 162 kg per metre
  const barKg = d => +((d * d) / 162 * 12).toFixed(2);
  // TMT is traded in tonnes: rates are per tonne
  const tmtBase = { 8: 58500, 10: 57000, 12: 56000, 16: 55500, 20: 55500, 25: 56000, 32: 56500 };

  const products = [
    {
      id: 'tmt', name: 'Kamdhenu TMT Bars', short: 'TMT Bars', brand: 'Kamdhenu',
      blurb: 'Fe 550D TMT bars, 12 m length. Ordered in tonnes, billed on actual weight.',
      unit: 't', byWeight: true, piecesAllowed: true, icon: 'tmt',
      variants: [8, 10, 12, 16, 20, 25, 32].map(d => ({
        id: `tmt-${d}`, label: `${d} mm`, rate: tmtBase[d], pieceKg: barKg(d), pieceT: barKg(d) / 1000,
      })),
    },
    {
      id: 'wire', name: 'Binding Wire', short: 'Binding Wire', brand: 'Kamdhenu',
      blurb: 'Annealed binding wire for tying reinforcement. Billed on actual weight.',
      unit: 'kg', byWeight: true, piecesAllowed: false, icon: 'wire',
      variants: [
        { id: 'wire-18', label: '18 gauge', rate: 76 },
        { id: 'wire-20', label: '20 gauge', rate: 78 },
      ],
    },
    {
      id: 'nails', name: 'Nails (5 kg bag)', short: 'Nails', brand: 'Kamdhenu',
      blurb: 'Wire nails packed in sealed 5 kg bags.',
      unit: 'bag', byWeight: false, piecesAllowed: false, icon: 'nails',
      variants: [
        { id: 'nails-2', label: '2 inch', rate: 430 },
        { id: 'nails-3', label: '3 inch', rate: 415 },
        { id: 'nails-4', label: '4 inch', rate: 405 },
      ],
    },
  ];

  const variant = id => {
    for (const p of products) {
      const v = p.variants.find(v => v.id === id);
      if (v) return { product: p, variant: v };
    }
    return null;
  };

  // Fictional demo dealers. Distances are from the demo site.
  const dealers = [
    { id: 'd1', name: 'Shree Ganesh Hardware', area: 'Navelim, Margao', km: 2.1, gstin: '30AAPFS1234K1Z2', stocks: ['tmt', 'wire'] },
    { id: 'd2', name: 'Naik Steel and Cement', area: 'Fatorda, Margao', km: 3.4, gstin: '30AAKFN5678L1Z9', stocks: ['tmt', 'wire', 'nails'] },
    { id: 'd3', name: 'Fernandes Building Supplies', area: 'Benaulim', km: 4.8, gstin: '30AACFF9012M1Z4', stocks: ['tmt', 'wire', 'nails'] },
    { id: 'd4', name: 'Dessai Traders', area: 'Curchorem', km: 13.6, gstin: '30AAGFD3456N1Z1', stocks: ['tmt', 'wire', 'nails'] },
  ];
  const dealer = id => dealers.find(d => d.id === id);

  // Proposed answers shown to the client during the walkthrough
  const questions = [
    { n: 1, title: 'Weight variance', answer: 'Customer pays for the ordered weight plus a 2% refundable buffer, held in escrow. Final bill uses the actual weight; unused amount is refunded automatically within 48 hours.', ask: 'Is a 2% buffer acceptable, or should the dealer absorb small variances?' },
    { n: 2, title: 'Delivery fee and minimum order', answer: 'Fee by distance slab (0 to 5, 5 to 10, 10 to 15 km), shown before payment, paid to the dealer. Each shipment carries its own fee. Minimum 0.5 tonne of TMT. Unloading not included. If an order is re-routed to a farther dealer, the customer still pays the quoted fee.', ask: 'Are the slabs and amounts right? Is 0.5 tonne the right minimum?' },
    { n: 3, title: 'Escrow and payments', answer: 'Payment gateway split settlement. Funds held per shipment, released to the dealer 24 hours after delivery. Mohit Ispat is the marketplace operator. TCS and TDS position to be confirmed by your CA.', ask: 'Which gateway do you prefer, and can your CA confirm the tax position?' },
    { n: 4, title: 'GST invoice', answer: 'The app generates the invoice in the dealer’s name and GSTIN from the actual weight. The dealer confirms it. The dealer issues the e-way bill where needed and the app records its number.', ask: 'Are dealers comfortable with app-generated invoices?' },
    { n: 5, title: 'TMT pricing by zone', answer: 'One price per size per zone (for example North Goa, South Goa, Belagavi), set by admin and updatable daily. Price is locked at payment.', ask: 'Which zones for the pilot, and who updates prices each day?' },
    { n: 6, title: 'Routing', answer: 'Nearest dealer within 15 km who stocks the item gets 15 minutes to accept. Up to 3 dealers are tried, then admin is alerted. Full refund if unassigned after 2 hours.', ask: 'Are 15 km and 15 minutes right? What are business hours?' },
    { n: 7, title: 'Remote buyers', answer: 'Customer names a site contact. The delivery OTP goes to both. The dealer uploads a delivery photo.', ask: 'Anything else the site contact needs to do?' },
    { n: 8, title: 'Cancellations and disputes', answer: 'Free cancellation until dispatch. Short delivery or damage can be reported within 24 hours with photos. Payout stays on hold until admin resolves it.', ask: 'Who on your team resolves disputes?' },
    { n: 9, title: 'Dealer adoption', answer: 'Very simple dealer app with large Accept and Decline buttons, plus SMS and WhatsApp alerts. Admin can accept on a dealer’s behalf after a call. Pilot with 10 to 20 dealers.', ask: 'How many dealers will join the pilot, and where?' },
    { n: 10, title: 'Customer acquisition', answer: 'Outside the app build. The app supports it with a dealer counter QR code and shareable product links.', ask: 'Who will promote the app to end buyers?' },
    { n: 11, title: 'Brand rights', answer: 'App branded Kamdhenu, with “Operated by Mohit Ispat Ltd” shown.', ask: 'Can you confirm Kamdhenu Ltd permits this in writing?' },
    { n: 12, title: 'Languages', answer: 'English at launch. The build is ready to add Kannada and Hindi.', ask: 'Which languages are needed at launch for customers and dealers?' },
    { n: 13, title: 'Gateway fees and platform fee', answer: 'No platform commission in Phase 1. Payment gateway charges (about 2%) are deducted from the dealer payout.', ask: 'Is this acceptable? Will there ever be a platform commission?' },
  ];

  /* ---------- formatting ---------- */
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const inr2 = n => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kgFmt = n => n.toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' kg';
  const tFmt = n => n.toLocaleString('en-IN', { maximumFractionDigits: 3 }) + ' t';
  const qtyFmt = (qty, unit) => unit === 'bag' ? `${qty} bag${qty === 1 ? '' : 's'}` : unit === 't' ? tFmt(qty) : kgFmt(qty);
  const unitWord = unit => ({ t: 'tonne', kg: 'kg', bag: 'bag' }[unit]);
  // Precision a quantity is kept to: tonnes to the kg, kg to 100 g, bags whole
  const roundQty = (qty, unit) => unit === 't' ? Math.round(qty * 1000) / 1000 : unit === 'kg' ? Math.round(qty * 10) / 10 : Math.round(qty);
  const time = ts => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const date = ts => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  /* ---------- rates by zone ---------- */
  const zoneAdj = { sgoa: 0, ngoa: 0.5, bgm: -0.8, hbl: -0.5 };
  const rateFor = (variantId, zoneId) => {
    const hit = variant(variantId);
    if (!hit) return 0;
    if (hit.product.id !== 'tmt') return hit.variant.rate;
    const s = load();
    const override = s.prices && s.prices[zoneId] && s.prices[zoneId][variantId];
    return override != null ? override : hit.variant.rate + (zoneAdj[zoneId] || 0) * 1000;
  };

  /* ---------- routing plan: nearest stocking dealer per product ---------- */
  // A dealer's stock list and online status can be changed from the dealer app
  const stocks = (d, s = load()) => (s.dealerStock && s.dealerStock[d.id]) || d.stocks;
  const online = (d, s = load()) => !(s.dealerOffline && s.dealerOffline[d.id]);
  const eligible = (productIds, s = load()) =>
    dealers
      .filter(d => d.km <= RADIUS_KM && online(d, s) && productIds.every(p => stocks(d, s).includes(p)))
      .sort((a, b) => a.km - b.km);
  const nearestFor = productId => eligible([productId])[0];

  // Group cart lines into shipments by the dealer that would fulfil them
  const plan = lines => {
    const groups = {};
    lines.forEach((l, i) => {
      const d = nearestFor(variant(l.variantId).product.id);
      if (!d) return;
      (groups[d.id] = groups[d.id] || { dealerId: d.id, km: d.km, lines: [] }).lines.push(i);
    });
    return Object.values(groups);
  };

  /* ---------- money ---------- */
  const lineAmount = (l, qty = l.qty) => l.rate * qty;
  const totals = (lines, idxs, km, actual) => {
    let material = 0, weighted = 0;
    idxs.forEach(i => {
      const l = lines[i];
      const q = actual && actual[i] != null ? actual[i] : l.qty;
      const amt = lineAmount(l, q);
      material += amt;
      if (l.unit !== 'bag') weighted += amt;
    });
    const gst = material * GST;
    const delivery = feeFor(km);
    const buffer = actual ? 0 : weighted * (1 + GST) * BUFFER;
    return { material, gst, delivery, buffer, total: material + gst + delivery + buffer };
  };

  /* ---------- state (localStorage with in-memory fallback) ---------- */
  const KEY = 'kd-demo-v2';
  let mem = null;
  const seed = () => ({
    user: null, sites: [], activeSite: null, cart: [], orders: [],
    presenter: true, prices: {}, seq: 24817,
  });
  function load() {
    if (mem) return mem;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { mem = JSON.parse(raw); return mem; }
    } catch (e) { /* storage blocked */ }
    mem = seed();
    return mem;
  }
  function save(s) {
    mem = s;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked */ }
    window.dispatchEvent(new CustomEvent('kd:state'));
  }
  function reset() {
    mem = seed();
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    save(mem);
  }
  // Keep other open tabs (dealer, admin) in sync
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    try { mem = e.newValue ? JSON.parse(e.newValue) : seed(); } catch (err) { mem = seed(); }
    window.dispatchEvent(new CustomEvent('kd:state'));
  });

  const log = (ship, text, who = 'system') => ship.log.push({ t: Date.now(), text, who });

  /* ---------- orders ---------- */
  const productOf = line => line.variantId.split('-')[0];

  // Builds a paid order with one shipment per fulfilling dealer and adds it to state
  function createOrder(s, { user, site, lines, method }) {
    const id = 'KD-' + (s.seq++);
    const groups = plan(lines);
    const now = Date.now();
    const order = {
      id, at: now, user, method, site: { ...site }, lines,
      shipments: groups.map((g, k) => {
        const sh = {
          id: `${id}-${k + 1}`, n: k + 1, of: groups.length, lines: g.lines, km: g.km,
          quote: totals(lines, g.lines, g.km), dealerId: null, offers: [], step: now,
          status: 'routing', otp: String(1000 + Math.floor(Math.random() * 9000)),
          actual: null, final: null, refund: null, issue: null, ewb: null, vehicle: null, log: [],
        };
        log(sh, `Payment of ${inr(sh.quote.total)} received and held in escrow`);
        return sh;
      }),
    };
    order.paid = order.shipments.reduce((a, sh) => a + sh.quote.total, 0);
    s.orders.unshift(order);
    return order;
  }

  const find = (s, shipId) => {
    for (const o of s.orders) {
      const sh = o.shipments.find(x => x.id === shipId);
      if (sh) return { o, sh };
    }
    return {};
  };

  /* ---------- routing engine ----------
     Offers go to the nearest eligible dealer one at a time. The demo dealer
     (d1) waits for a real tap when the dealer app is open; every other
     dealer answers automatically after a short pause. */
  const DEMO_DEALER = 'd1';
  const AUTO_MS = 2600;
  const STEP_MS = 900;
  const MAX_TRIES = 3;
  const HB_KEY = 'kd-dealer-seen';
  const heartbeat = () => { try { localStorage.setItem(HB_KEY, String(Date.now())); } catch (e) { /* ignore */ } };
  const dealerLive = () => { try { return Date.now() - (+localStorage.getItem(HB_KEY) || 0) < 5000; } catch (e) { return false; } };
  // Demo behaviour: Naik Steel turns down nail orders (out of stock)
  const autoAnswer = (dealerId, o, sh) =>
    dealerId === 'd2' && sh.lines.some(i => productOf(o.lines[i]) === 'nails') ? 'decline' : 'accept';

  function resolveOffer(o, sh, offer, result, { reason, who = 'dealer' } = {}) {
    const d = dealer(offer.dealerId);
    offer.result = result;
    offer.doneAt = Date.now();
    sh.step = Date.now();
    if (result === 'accepted') {
      sh.dealerId = d.id;
      sh.status = 'accepted';
      sh.acceptedAt = Date.now();
      log(sh, `Accepted by ${d.name}${who === 'admin' ? ' (confirmed by admin after a call)' : ''}`, who);
    } else if (result === 'declined') {
      offer.reason = reason || 'Not available';
      log(sh, `Declined by ${d.name}: ${offer.reason}`, who);
    } else {
      log(sh, `No response from ${d.name} in ${ACCEPT_MIN} min`);
    }
  }

  // Dealer (or admin on the dealer's behalf) answers the pending offer
  function respond(shipId, dealerId, accept, opts) {
    const s = load();
    const { o, sh } = find(s, shipId);
    if (!sh || sh.status !== 'routing') return false;
    const offer = sh.offers.find(f => f.result === 'pending' && f.dealerId === dealerId);
    if (!offer) return false;
    resolveOffer(o, sh, offer, accept ? 'accepted' : 'declined', opts);
    save(s);
    return true;
  }

  const PAGE = Math.random().toString(36).slice(2);
  function tick() {
    const s = load();
    const now = Date.now();
    if (s.tick && s.tick.owner !== PAGE && now - s.tick.at < 3000) return;
    let changed = false;
    s.orders.forEach(o => o.shipments.forEach(sh => {
      if (sh.status !== 'routing') return;
      const pending = sh.offers.find(f => f.result === 'pending');
      if (pending) {
        const waitsForTap = pending.dealerId === DEMO_DEALER && dealerLive();
        if (!waitsForTap && now - pending.at > AUTO_MS) {
          const ans = autoAnswer(pending.dealerId, o, sh);
          resolveOffer(o, sh, pending, ans === 'accept' ? 'accepted' : 'declined', { reason: 'Out of stock' });
          changed = true;
        } else if (waitsForTap && now - pending.at > ACCEPT_MIN * 60000) {
          resolveOffer(o, sh, pending, 'expired');
          changed = true;
        }
        return;
      }
      if (now - (sh.step || 0) < STEP_MS) return;
      const tried = sh.offers.map(f => f.dealerId);
      const prods = [...new Set(sh.lines.map(i => productOf(o.lines[i])))];
      const next = eligible(prods, s).find(d => !tried.includes(d.id));
      if (next && tried.length < MAX_TRIES) {
        sh.offers.push({ dealerId: next.id, at: now, result: 'pending' });
        log(sh, `Offered to ${next.name} (${next.km} km), ${ACCEPT_MIN} min to accept`);
      } else {
        sh.status = 'unassigned';
        log(sh, 'No dealer accepted. Admin alerted. Full refund if unassigned within 2 hours');
      }
      sh.step = now;
      changed = true;
    }));
    if (changed) { s.tick = { owner: PAGE, at: now }; save(s); }
  }
  let ticker = null;
  const startTicker = () => { if (!ticker) { tick(); ticker = setInterval(tick, 500); } };

  /* ---------- fulfilment ---------- */
  // Max weight the customer has paid for: ordered weight plus the buffer
  const maxQty = line => line.unit === 'bag' ? line.qty : roundQty(line.qty * (1 + BUFFER), line.unit);

  function dispatch(shipId, { actual, vehicle, ewb }) {
    const s = load();
    const { o, sh } = find(s, shipId);
    if (!sh || sh.status !== 'accepted') return;
    sh.actual = actual;
    sh.vehicle = vehicle || null;
    sh.ewb = ewb || null;
    sh.final = totals(o.lines, sh.lines, sh.km, actual);
    sh.status = 'dispatched';
    sh.dispatchedAt = Date.now();
    log(sh, `Invoice confirmed on loaded weight ${inr(sh.final.total)}. Dispatched${vehicle ? ` in ${vehicle}` : ''}${ewb ? `, e-way bill ${ewb}` : ''}`, 'dealer');
    save(s);
  }

  function deliver(shipId, { by = 'dealer' } = {}) {
    const s = load();
    const { o, sh } = find(s, shipId);
    if (!sh || sh.status !== 'dispatched') return;
    sh.status = 'delivered';
    sh.deliveredAt = Date.now();
    sh.photo = true;
    sh.refund = Math.max(0, sh.quote.total - sh.final.total);
    log(sh, 'Delivered. OTP verified, site photo uploaded', by);
    log(sh, `Final bill ${inr(sh.final.total)}. Refund of ${inr(sh.refund)} to customer initiated`);
    save(s);
  }

  function settle(shipId) {
    const s = load();
    const { sh } = find(s, shipId);
    if (!sh || sh.status !== 'delivered' || (sh.issue && sh.issue.status === 'open')) return;
    sh.status = 'settled';
    sh.settledAt = Date.now();
    log(sh, `No dispute in 24 hours. Payout of ${inr(payout(sh).net)} released to ${dealer(sh.dealerId).name}`);
    save(s);
  }

  // Dealer payout for a shipment: final bill less payment gateway charges
  const GATEWAY = 0.02;
  const payout = sh => {
    const gross = sh.final ? sh.final.total : sh.quote.total;
    const fee = sh.quote.total * GATEWAY;
    return { gross, fee, net: gross - fee };
  };

  // Simulated actual weights, used when no dealer app is driving the order
  const simulatedActual = (o, sh) => {
    const a = {};
    sh.lines.forEach(i => {
      const l = o.lines[i];
      const f = l.unit === 'bag' ? 1 : (productOf(l) === 'tmt' ? 1.012 : 0.994);
      a[i] = roundQty(l.qty * f, l.unit);
    });
    return a;
  };
  const randomEwb = () => `1812 ${1000 + Math.floor(Math.random() * 9000)} ${1000 + Math.floor(Math.random() * 9000)}`;

  // A sample order from another customer, so the dealer app can be demoed on its own
  function demoOrder() {
    const s = load();
    const site = { id: 'demo', name: 'Shetty residence', addr: 'House 22, Colmorod, near Navelim church', area: 'Navelim, Margao', pincode: '403707', zone: 'sgoa', contact: 'Ravi Naik (contractor)', contactPhone: '+91 98500 44556' };
    const pick = [['tmt-10', 0.4], ['tmt-12', 0.9], ['wire-20', 20]];
    const lines = pick.map(([vid, qty]) => {
      const { product, variant: v } = variant(vid);
      return { variantId: vid, name: product.name, label: v.label, qty, unit: product.unit, mode: product.unit, pieces: null, rate: rateFor(vid, site.zone) };
    });
    const o = createOrder(s, { user: { name: 'Priya Shetty', phone: '+91 99230 77881' }, site, lines, method: 'UPI' });
    save(s);
    return o;
  }

  return {
    GST, BUFFER, MIN_TMT_T, RADIUS_KM, ACCEPT_MIN, slabs, feeFor, slabLabel,
    zones, products, variant, dealers, dealer, questions,
    inr, inr2, kgFmt, tFmt, qtyFmt, unitWord, roundQty, time, date,
    rateFor, nearestFor, plan, totals, load, save, reset, log,
    stocks, online, productOf, createOrder, find, DEMO_DEALER, heartbeat, dealerLive, respond, tick, startTicker,
    maxQty, dispatch, deliver, settle, payout, GATEWAY, simulatedActual, randomEwb, demoOrder,
  };
})();
