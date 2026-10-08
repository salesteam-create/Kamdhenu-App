/* Kamdhenu App prototype: shared demo data, pricing rules and state.
   All names, prices and numbers are illustrative demo values. */
const KD = (() => {
  const GST = 0.18;          // TMT, binding wire and nails
  const BUFFER = 0.02;       // refundable weight buffer on kg-billed items
  const MIN_TMT_KG = 500;    // minimum TMT per order
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
  const tmtBase = { 8: 58.5, 10: 57.0, 12: 56.0, 16: 55.5, 20: 55.5, 25: 56.0, 32: 56.5 };

  const products = [
    {
      id: 'tmt', name: 'Kamdhenu TMT Bars', short: 'TMT Bars', brand: 'Kamdhenu',
      blurb: 'Fe 550D TMT bars, 12 m length. Billed on actual weight.',
      unit: 'kg', byWeight: true, piecesAllowed: true, icon: 'tmt',
      variants: [8, 10, 12, 16, 20, 25, 32].map(d => ({
        id: `tmt-${d}`, label: `${d} mm`, rate: tmtBase[d], pieceKg: barKg(d),
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
    { n: 2, title: 'Delivery fee and minimum order', answer: 'Fee by distance slab (0 to 5, 5 to 10, 10 to 15 km), shown before payment, paid to the dealer. Each shipment carries its own fee. Minimum 500 kg TMT. Unloading not included. If an order is re-routed to a farther dealer, the customer still pays the quoted fee.', ask: 'Are the slabs and amounts right? Is 500 kg the right minimum?' },
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
  const qtyFmt = (qty, unit) => unit === 'bag' ? `${qty} bag${qty === 1 ? '' : 's'}` : kgFmt(qty);
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
    return override != null ? override : +(hit.variant.rate + (zoneAdj[zoneId] || 0)).toFixed(2);
  };

  /* ---------- routing plan: nearest stocking dealer per product ---------- */
  const nearestFor = (productId, exclude = []) =>
    dealers
      .filter(d => d.km <= RADIUS_KM && d.stocks.includes(productId) && !exclude.includes(d.id))
      .sort((a, b) => a.km - b.km)[0];

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
      if (l.unit === 'kg') weighted += amt;
    });
    const gst = material * GST;
    const delivery = feeFor(km);
    const buffer = actual ? 0 : weighted * (1 + GST) * BUFFER;
    return { material, gst, delivery, buffer, total: material + gst + delivery + buffer };
  };

  /* ---------- state (localStorage with in-memory fallback) ---------- */
  const KEY = 'kd-demo-v1';
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

  return {
    GST, BUFFER, MIN_TMT_KG, RADIUS_KM, ACCEPT_MIN, slabs, feeFor, slabLabel,
    zones, products, variant, dealers, dealer, questions,
    inr, inr2, kgFmt, qtyFmt, time, date,
    rateFor, nearestFor, plan, totals, load, save, reset, log,
  };
})();
