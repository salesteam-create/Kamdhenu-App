/* Kamdhenu Ordering App (B2B) prototype: shared data, rules and state.
   Used by the dealer/distributor app and the admin panel. All names,
   numbers and prices are demo data. */
const MI = (() => {
  const SIZES = [8, 10, 12, 16, 20, 25, 32];
  const STATES = ['Goa', 'Karnataka'];
  const DAY = 864e5;
  const KEY = 'mi-demo-v2';

  /* ---------- points to confirm (shown as C1 to C16 pins) ---------- */
  const questions = [
    { n: 1, title: 'Payment terms and rates', ask: 'What are the actual payment terms and their rates?', assume: 'Immediate −₹500/t, 7 days −₹200/t, 30 days +₹600/t. Example values, editable by the admin.' },
    { n: 2, title: 'Payment reminder timing', ask: 'How many days before the due date should the reminder and Pay now prompt appear?', assume: '2 days before, editable by the admin. Pay early is always available.' },
    { n: 3, title: 'Live GPS tracking', ask: 'Is live GPS tracking of trucks needed?', assume: 'No. Admin updates status with vehicle number and driver phone. GPS can be added later.' },
    { n: 4, title: 'Who confirms delivery', ask: 'Who confirms delivery?', assume: 'The customer taps Received. The admin can also mark it delivered.' },
    { n: 5, title: 'Distributor approval of direct dealer orders', ask: 'When a dealer orders direct, does the distributor need to approve it?', assume: 'No. The distributor only sees it. Approval is an admin toggle, off by default.' },
    { n: 6, title: 'Billing of direct dealer orders', ask: 'Is a direct dealer order billed to the dealer or to his distributor?', assume: 'Handled offline. The admin panel shows both names on every order.' },
    { n: 7, title: 'Dealers not on the app', ask: 'Can the distributor add orders he took by phone, for dealers not on the app?', assume: 'Yes, he can add a dealer line by hand on the combined order screen.' },
    { n: 8, title: 'Separate dealer pricing', ask: 'Should there be separate dealer pricing later?', assume: 'Single price for v1, with room to add it later.' },
    { n: 9, title: 'Size extras', ask: 'Is it one price for all sizes, or are there size extras (for example 8 mm costing more)?', assume: 'One price for all sizes. The admin price screen has an optional size-extra field, set to zero.' },
    { n: 10, title: 'When credit starts', ask: 'Does the credit period start at booking, or at dispatch?', assume: 'At booking, as in the brief. A 30-day order dispatched two weeks later then has about 16 days of credit left.' },
    { n: 11, title: 'Missed size split cut-off', ask: 'What happens to a lump-sum order whose size split is not added by the cut-off?', assume: 'Cut-off is 7 days after booking. The admin is alerted and can enter the split after a call, or cancel the order.' },
    { n: 12, title: 'Delivered with weight variance', ask: 'When does a multi-truck order count as delivered, given actual weights never match exactly?', assume: 'When delivered weight is within ±2% of the booked tonnes. The admin can also close an order manually.' },
    { n: 13, title: 'Freight', ask: 'Is freight included in the price, or charged separately?', assume: 'Included. The daily price is a delivered price.' },
    { n: 14, title: 'Credit limits and overdue', ask: 'Are there credit limits, and are customers with overdue payments blocked from new orders?', assume: 'The customer sees overdue amounts and a warning, and the admin is alerted. New orders are not blocked.' },
    { n: 15, title: 'Minimum order', ask: 'Is there a minimum order quantity?', assume: '1 tonne per order, editable by the admin.' },
    { n: 16, title: 'Netbanking in v1', ask: 'Will v1 include a live netbanking connection, or only show the option?', assume: 'v1 includes netbanking through a payment gateway. The prototype simulates it.' },
  ];

  /* ---------- dates and formatting ---------- */
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const ymd = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const tFmt = n => (Math.round(n * 1000) / 1000).toLocaleString('en-IN', { maximumFractionDigits: 3 }) + ' t';
  const date = ts => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const dateLong = ts => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = ts => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const r3 = n => Math.round(n * 1000) / 1000;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- seed ---------- */
  function seed() {
    const t = today0();
    const at = (days, h = 10, m = 0) => t + days * DAY + (h * 60 + m) * 60000;
    const hist = { Goa: [55900, 55800, 56100, 56300, 56000, 55700, 55400, 55200], Karnataka: [55400, 55300, 55600, 55800, 55500, 55200, 55000, 54800] };
    const prices = [];
    STATES.forEach(st => hist[st].forEach((v, i) => prices.push({ state: st, day: ymd(at(i - 7)), value: v, at: at(i - 7, 9, 0) })));
    const split = o => Object.fromEntries(SIZES.map(s => [s, o[s] || 0]));
    const s = {
      seq: 1044, rseq: 203, tseq: 9,
      settings: { cutoffDays: 7, reminderDays: 2, tolerance: 0.02, minOrderT: 1, distributorApproval: false, sizeExtra: split({}) },
      terms: [
        { id: 'imm', label: 'Immediate', days: 0, adj: -500 },
        { id: 'd7', label: '7 days', days: 7, adj: -200 },
        { id: 'd30', label: '30 days', days: 30, adj: 600 },
      ],
      prices,
      distributors: [
        { id: 'D1', name: 'Sai Steel Distributors', city: 'Margao', state: 'Goa', phone: '+91 98230 11223' },
        { id: 'D2', name: 'Coastal Steel Agencies', city: 'Mapusa', state: 'Goa', phone: '+91 98220 44551' },
        { id: 'D3', name: 'Belgaum Steel Traders', city: 'Belagavi', state: 'Karnataka', phone: '+91 94480 66778' },
      ],
      dealers: [
        { id: 'R1', name: 'Shree Ganesh Hardware', area: 'Navelim', state: 'Goa', distributorId: 'D1', phone: '+91 98221 55667', onApp: true },
        { id: 'R2', name: 'Naik Steel and Cement', area: 'Fatorda', state: 'Goa', distributorId: 'D1', phone: '+91 98221 30012', onApp: true },
        { id: 'R3', name: 'Fernandes Building Supplies', area: 'Benaulim', state: 'Goa', distributorId: 'D1', phone: '+91 98500 21877', onApp: true },
        { id: 'R4', name: 'Dessai Traders', area: 'Curchorem', state: 'Goa', distributorId: 'D1', phone: '+91 98904 11290', onApp: false },
        { id: 'R5', name: 'Mapusa Hardware Mart', area: 'Mapusa', state: 'Goa', distributorId: 'D2', phone: '+91 98227 66120', onApp: true },
        { id: 'R6', name: 'Tilakwadi Steel Point', area: 'Belagavi', state: 'Karnataka', distributorId: 'D3', phone: '+91 94481 23098', onApp: true },
      ],
      signups: [{ id: 'S1', name: 'Kamat Hardware', area: 'Ponda', phone: '+91 97654 32109', at: at(0, 8, 40) }],
      requests: [
        { id: 'RQ-201', dealerId: 'R3', tonnes: 15, split: split({ 10: 4, 12: 6, 16: 5 }), at: at(0, 9, 30), status: 'pending', orderId: null, note: '' },
        { id: 'RQ-202', dealerId: 'R2', tonnes: 10, split: split({}), at: at(0, 9, 55), status: 'pending', orderId: null, note: '' },
      ],
      orders: [],
      notifs: [],
      seen: {},
    };

    const mk = o => ({ log: [], trucks: [], payment: { status: 'unpaid' }, parts: null, closed: false, ...o });
    s.orders.push(mk({
      id: 'MI-1038', by: { role: 'distributor', id: 'D1' }, distributorId: 'D1', dealerId: null, path: 'combined', type: 'full',
      state: 'Goa', tonnes: 60, termId: 'd30', base: 56300, placedAt: at(-12, 11, 5), status: 'dispatching',
      split: split({ 8: 6, 10: 10, 12: 18, 16: 14, 20: 8, 25: 4 }),
      parts: [
        { dealerId: 'R2', name: 'Naik Steel and Cement', tonnes: 20 },
        { dealerId: 'R3', name: 'Fernandes Building Supplies', tonnes: 25 },
        { dealerId: null, name: 'Own stock', tonnes: 15 },
      ],
      trucks: [
        { id: 'T1', vehicle: 'GA 08 T 4521', driver: '+91 98500 11001', weightT: 18.42, eta: at(-9), at: at(-10, 15), status: 'delivered', deliveredAt: at(-9, 12), by: 'customer' },
        { id: 'T2', vehicle: 'GA 07 F 2210', driver: '+91 98500 11002', weightT: 17.86, eta: at(-8), at: at(-9, 16), status: 'delivered', deliveredAt: at(-8, 11), by: 'customer' },
        { id: 'T3', vehicle: 'GA 08 T 4521', driver: '+91 98500 11001', weightT: 15.1, eta: at(0), at: at(-1, 17), status: 'dispatched' },
      ],
    }));
    s.orders.push(mk({
      id: 'MI-1040', by: { role: 'dealer', id: 'R1' }, distributorId: 'D1', dealerId: 'R1', path: 'direct', type: 'full',
      state: 'Goa', tonnes: 10, termId: 'd7', base: 55700, placedAt: at(-6, 10, 20), status: 'delivered',
      split: split({ 8: 2, 10: 3, 12: 5 }),
      trucks: [{ id: 'T4', vehicle: 'GA 02 X 7781', driver: '+91 98500 11004', weightT: 10.08, eta: at(-4), at: at(-5, 14), status: 'delivered', deliveredAt: at(-4, 10), by: 'customer' }],
    }));
    s.orders.push(mk({
      id: 'MI-1042', by: { role: 'distributor', id: 'D1' }, distributorId: 'D1', dealerId: null, path: 'direct', type: 'lumpsum',
      state: 'Goa', tonnes: 40, termId: 'd7', base: 55400, placedAt: at(-2, 9, 45), status: 'confirmed', split: split({}),
    }));
    s.orders.push(mk({
      id: 'MI-1035', by: { role: 'dealer', id: 'R1' }, distributorId: 'D1', dealerId: 'R1', path: 'direct', type: 'full',
      state: 'Goa', tonnes: 8, termId: 'imm', base: 56100, placedAt: at(-20, 12), status: 'delivered',
      split: split({ 10: 3, 12: 5 }),
      trucks: [{ id: 'T5', vehicle: 'GA 08 T 4521', driver: '+91 98500 11001', weightT: 7.94, eta: at(-19), at: at(-20, 17), status: 'delivered', deliveredAt: at(-19, 11), by: 'admin' }],
      payment: { status: 'paid', paidAt: at(-20, 12, 30), method: 'Netbanking' },
    }));
    s.orders.push(mk({
      id: 'MI-1043', by: { role: 'dealer', id: 'R2' }, distributorId: 'D1', dealerId: 'R2', path: 'direct', type: 'full',
      state: 'Goa', tonnes: 12, termId: 'd30', base: 55400, placedAt: at(-1, 16, 10), status: 'booked',
      split: split({ 12: 6, 16: 6 }),
    }));
    s.orders.push(mk({
      id: 'MI-1036', by: { role: 'distributor', id: 'D1' }, distributorId: 'D1', dealerId: null, path: 'direct', type: 'full',
      state: 'Goa', tonnes: 20, termId: 'd7', base: 56000, placedAt: at(-11, 10), status: 'delivered',
      split: split({ 10: 6, 12: 8, 16: 6 }),
      trucks: [{ id: 'T6', vehicle: 'GA 07 F 2210', driver: '+91 98500 11002', weightT: 19.86, eta: at(-9), at: at(-10, 15), status: 'delivered', deliveredAt: at(-9, 11), by: 'customer' }],
    }));
    s.orders.forEach(o => {
      freeze(o, s);
      o.log.push({ t: o.placedAt, text: `Booked ${tFmt(o.tonnes)} at ${inr(o.rate)}/t (${o.termLabel})` });
    });
    s.orders.sort((a, b) => b.placedAt - a.placedAt);

    s.notifs.push(
      { id: 'n1', to: 'all', text: `Today's price published: Goa ${inr(55200)}/t, Karnataka ${inr(54800)}/t`, at: at(0, 9), link: '#/home' },
      { id: 'n2', to: 'D1', text: 'New request from Fernandes Building Supplies: 15 t', at: at(0, 9, 30), link: '#/dealers' },
      { id: 'n3', to: 'D1', text: 'New request from Naik Steel and Cement: 10 t', at: at(0, 9, 55), link: '#/dealers' },
      { id: 'n4', to: 'D1', text: 'Truck GA 08 T 4521 dispatched for MI-1038: 15.1 t, arriving today', at: at(-1, 17), link: '#/order/MI-1038' },
      { id: 'n5', to: 'R1', text: 'Payment of MI-1040 is due soon. Pay now by netbanking.', at: at(0, 8), link: '#/order/MI-1040' },
    );
    return s;
  }

  /* ---------- state ---------- */
  let mem = null;
  function load() {
    if (mem) return mem;
    try { const raw = localStorage.getItem(KEY); if (raw) { mem = JSON.parse(raw); return mem; } } catch (e) { /* storage blocked */ }
    mem = seed();
    return mem;
  }
  function save(s) {
    mem = s;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked */ }
    window.dispatchEvent(new CustomEvent('mi:state'));
  }
  function reset() { mem = seed(); try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } save(mem); }
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    try { mem = e.newValue ? JSON.parse(e.newValue) : seed(); } catch (err) { mem = seed(); }
    window.dispatchEvent(new CustomEvent('mi:state'));
  });
  const commit = fn => { const s = load(); const out = fn(s); save(s); return out; };

  /* ---------- lookups ---------- */
  const dealer = (id, s = load()) => s.dealers.find(d => d.id === id);
  const distributor = (id, s = load()) => s.distributors.find(d => d.id === id);
  const who = (id, s = load()) => (dealer(id, s) || distributor(id, s) || {}).name || 'Mohit Ispat';
  const stateOf = (user, s = load()) => (dealer(user.id, s) || distributor(user.id, s) || {}).state || 'Goa';
  const term = (id, s = load()) => s.terms.find(t => t.id === id);
  const order = (id, s = load()) => s.orders.find(o => o.id === id);

  /* ---------- prices ---------- */
  // Latest published price for a state, and the one before it
  const priceToday = (state, s = load()) => {
    const list = s.prices.filter(p => p.state === state).sort((a, b) => a.at - b.at);
    const cur = list[list.length - 1];
    const prev = list[list.length - 2];
    return { ...cur, prev: prev && prev.value, isToday: cur && cur.day === ymd(Date.now()) };
  };
  const rate = (base, termId, s = load()) => base + (term(termId, s) || { adj: 0 }).adj;
  const splitTotal = split => r3(SIZES.reduce((a, k) => a + (+split[k] || 0), 0));
  // Amount using the split for size extras where known
  const amountFor = (tonnes, split, r, s = load(), frozenExtra) => {
    const ex = frozenExtra || s.settings.sizeExtra;
    const known = splitTotal(split || {});
    const extras = SIZES.reduce((a, k) => a + (+((split || {})[k]) || 0) * (+ex[k] || 0), 0);
    return tonnes * r + (known ? extras * (tonnes / known) : 0);
  };

  /* ---------- order facts ---------- */
  // Rate, term and size extras are frozen on the order at booking, so later setting changes never alter it
  const lockedRate = (o, s = load()) => (o.rate != null ? o.rate : rate(o.base, o.termId, s));
  const dueAt = (o, s = load()) => o.placedAt + (o.termDays != null ? o.termDays : term(o.termId, s).days) * DAY;
  const termLabel = (o, s = load()) => o.termLabel || term(o.termId, s).label;
  const freeze = (o, s) => { const t = term(o.termId, s); o.rate = o.base + t.adj; o.termDays = t.days; o.termLabel = t.label; o.adj = t.adj; o.sizeExtra = { ...s.settings.sizeExtra }; };
  const cutoffAt = (o, s = load()) => o.placedAt + s.settings.cutoffDays * DAY;
  const needsSplit = o => splitTotal(o.split) < o.tonnes - 1e-9;
  const dispatchedT = o => r3(o.trucks.reduce((a, t) => a + t.weightT, 0));
  const deliveredT = o => r3(o.trucks.filter(t => t.status === 'delivered').reduce((a, t) => a + t.weightT, 0));
  const pendingT = o => (o.status === 'delivered' ? 0 : Math.max(0, r3(o.tonnes - dispatchedT(o))));
  // Billed on actual loaded weight once dispatched; estimate on booked tonnes before
  const billT = o => (o.status === 'delivered' ? dispatchedT(o) : Math.max(dispatchedT(o), o.tonnes));
  const amount = (o, s = load()) => amountFor(billT(o), o.split, lockedRate(o, s), s, o.sizeExtra);
  const canEditSplit = (o, s = load()) => ['pending_dist', 'booked', 'confirmed'].includes(o.status) && Date.now() < cutoffAt(o, s);
  const payState = (o, s = load()) => {
    if (o.payment.status === 'paid') return 'paid';
    const left = dueAt(o, s) - Date.now();
    if (left < -DAY) return 'overdue';
    if (left <= s.settings.reminderDays * DAY) return 'due_soon';
    return 'open';
  };
  const statusLabel = o => {
    if (o.status === 'pending_dist') return 'Awaiting distributor';
    if (o.status === 'booked') return 'Booked';
    if (o.status === 'confirmed') return needsSplit(o) ? 'Awaiting size split' : 'Confirmed';
    if (o.status === 'ready') return 'Ready for dispatch';
    if (o.status === 'dispatching') return pendingT(o) > 0 ? 'Part dispatched' : 'Dispatched';
    if (o.status === 'delivered') return 'Delivered';
    if (o.status === 'cancelled') return 'Cancelled';
    return o.status;
  };
  const STEPS = ['Booked', 'Confirmed', 'Ready for dispatch', 'Dispatched', 'Delivered'];
  const stepIndex = o => ({ pending_dist: 0, booked: 0, confirmed: 1, ready: 2, dispatching: 3, delivered: 4 }[o.status] ?? 0);

  /* ---------- visibility ---------- */
  const userKey = u => u.id;
  // Orders a user can see: his own, combined orders with his part, and (distributor) his dealers' direct orders
  function ordersFor(u, s = load()) {
    return s.orders.filter(o => {
      if (o.by.id === u.id) return true;
      if (u.role === 'dealer') return (o.parts || []).some(p => p.dealerId === u.id);
      if (u.role === 'distributor') return o.distributorId === u.id;
      return false;
    }).sort((a, b) => b.placedAt - a.placedAt);
  }
  const notifsFor = (u, s = load()) => s.notifs.filter(n => n.to === 'all' || n.to === userKey(u)).sort((a, b) => b.at - a.at);
  const unreadFor = (u, s = load()) => notifsFor(u, s).filter(n => n.at > (s.seen[userKey(u)] || 0)).length;
  const notify = (s, to, text, link) => s.notifs.push({ id: 'n' + Math.random().toString(36).slice(2, 8), to, text, at: Date.now(), link });

  /* ---------- actions ---------- */
  function placeOrder({ by, type, tonnes, split, termId, parts = null }) {
    return commit(s => {
      const st = stateOf(by, s);
      const p = priceToday(st, s);
      const isDealer = by.role === 'dealer';
      const dist = isDealer ? dealer(by.id, s).distributorId : by.id;
      const id = 'MI-' + (s.seq++);
      const o = {
        id, by, distributorId: dist, dealerId: isDealer ? by.id : null, path: parts ? 'combined' : 'direct', type,
        state: st, tonnes: r3(tonnes), split: { ...split }, termId, base: p.value, placedAt: Date.now(),
        status: isDealer && s.settings.distributorApproval ? 'pending_dist' : 'booked',
        parts, trucks: [], payment: { status: 'unpaid' }, closed: false, log: [],
      };
      freeze(o, s);
      o.log.push({ t: Date.now(), text: `Booked ${tFmt(o.tonnes)} at ${inr(o.rate)}/t (${o.termLabel})` });
      s.orders.unshift(o);
      if (isDealer) notify(s, dist, `New direct order from ${who(by.id, s)}: ${tFmt(o.tonnes)} (for information)`, `#/order/${id}`);
      if (parts) {
        parts.filter(pt => pt.dealerId).forEach(pt => {
          notify(s, pt.dealerId, `Your ${tFmt(pt.tonnes)} is in combined order ${id}. Final price ${inr(rate(o.base, termId, s))}/t`, `#/order/${id}`);
          const rq = pt.requestId && s.requests.find(r => r.id === pt.requestId);
          if (rq) { rq.status = 'combined'; rq.orderId = id; }
        });
      }
      return id;
    });
  }

  function sendRequest({ dealerId, tonnes, split }) {
    return commit(s => {
      const id = 'RQ-' + (s.rseq++);
      s.requests.unshift({ id, dealerId, tonnes: r3(tonnes), split: { ...split }, at: Date.now(), status: 'pending', orderId: null, note: '' });
      notify(s, dealer(dealerId, s).distributorId, `New request from ${who(dealerId, s)}: ${tFmt(tonnes)}`, '#/dealers');
      return id;
    });
  }

  function reviewRequest(id, action, tonnes) {
    commit(s => {
      const rq = s.requests.find(r => r.id === id);
      if (action === 'edit') { rq.tonnes = r3(tonnes); rq.note = 'Edited by distributor'; return; }
      rq.status = action === 'approve' ? 'approved' : 'rejected';
      notify(s, rq.dealerId, `Your request ${id} for ${tFmt(rq.tonnes)} was ${rq.status} by your distributor`, '#/orders');
    });
  }

  function approveDirect(orderId) {
    commit(s => { const o = order(orderId, s); o.status = 'booked'; o.log.push({ t: Date.now(), text: 'Approved by distributor' }); notify(s, o.by.id, `${o.id} approved by your distributor`, `#/order/${o.id}`); });
  }

  function saveSplit(orderId, split) {
    commit(s => {
      const o = order(orderId, s);
      o.split = { ...split };
      o.log.push({ t: Date.now(), text: `Size split ${needsSplit(o) ? 'updated' : 'completed'}: ${SIZES.filter(k => +split[k]).map(k => `${k} mm ${tFmt(+split[k])}`).join(', ')}` });
    });
  }

  function confirmOrder(orderId) {
    commit(s => {
      const o = order(orderId, s);
      o.status = 'confirmed';
      o.log.push({ t: Date.now(), text: 'Confirmed by Mohit Ispat' });
      notify(s, o.by.id, `${o.id} confirmed at ${inr(lockedRate(o, s))}/t, ${term(o.termId, s).label}, due ${date(dueAt(o, s))}`, `#/order/${o.id}`);
    });
  }

  function markReady(orderId) {
    commit(s => { const o = order(orderId, s); o.status = 'ready'; o.log.push({ t: Date.now(), text: 'Size split locked. Ready for dispatch' }); });
  }

  function addTruck(orderId, { vehicle, driver, weightT, eta }) {
    commit(s => {
      const o = order(orderId, s);
      const tr = { id: 'T' + (s.tseq++), vehicle, driver, weightT: r3(weightT), eta, at: Date.now(), status: 'dispatched' };
      o.trucks.push(tr);
      o.status = 'dispatching';
      o.log.push({ t: Date.now(), text: `Truck ${vehicle} dispatched with ${tFmt(tr.weightT)}` });
      notify(s, o.by.id, `${o.id}: truck ${vehicle} dispatched with ${tFmt(tr.weightT)}. Driver ${driver}. Expected ${date(eta)}`, `#/order/${o.id}`);
    });
  }

  // Order is delivered once delivered weight is within tolerance of booked tonnes (C12)
  function settleDelivery(s, o) {
    const done = deliveredT(o) >= o.tonnes * (1 - s.settings.tolerance) && o.trucks.every(t => t.status === 'delivered');
    if (done && o.status !== 'delivered') {
      o.status = 'delivered';
      o.log.push({ t: Date.now(), text: `Delivered in full: ${tFmt(deliveredT(o))}` });
      notify(s, o.by.id, `${o.id} delivered: ${tFmt(deliveredT(o))}. Final bill ${inr(amount(o, s))}`, `#/order/${o.id}`);
    }
  }

  function truckReceived(orderId, truckId, by = 'customer') {
    commit(s => {
      const o = order(orderId, s);
      const tr = o.trucks.find(t => t.id === truckId);
      tr.status = 'delivered'; tr.deliveredAt = Date.now(); tr.by = by;
      o.log.push({ t: Date.now(), text: `Truck ${tr.vehicle} received (${by === 'admin' ? 'marked by admin' : 'confirmed by customer'})` });
      settleDelivery(s, o);
    });
  }

  function closeOrder(orderId) {
    commit(s => {
      const o = order(orderId, s);
      o.trucks.forEach(t => { if (t.status !== 'delivered') { t.status = 'delivered'; t.deliveredAt = Date.now(); t.by = 'admin'; } });
      o.closed = true; o.status = 'delivered';
      o.log.push({ t: Date.now(), text: `Closed by admin at ${tFmt(deliveredT(o))}` });
      notify(s, o.by.id, `${o.id} closed as delivered: ${tFmt(deliveredT(o))}. Final bill ${inr(amount(o, s))}`, `#/order/${o.id}`);
    });
  }

  function pay(orderId, method) {
    commit(s => {
      const o = order(orderId, s);
      o.payment = { status: 'paid', paidAt: Date.now(), method };
      o.log.push({ t: Date.now(), text: `Payment of ${inr(amount(o, s))} received (${method})` });
      notify(s, o.by.id, `Payment received for ${o.id}: ${inr(amount(o, s))}`, `#/order/${o.id}`);
    });
  }

  function cancelOrder(orderId) {
    commit(s => { const o = order(orderId, s); o.status = 'cancelled'; o.log.push({ t: Date.now(), text: 'Cancelled by admin' }); notify(s, o.by.id, `${o.id} was cancelled by Mohit Ispat`, `#/order/${o.id}`); });
  }

  function publishPrice(state, value) {
    commit(s => {
      const now = Date.now();
      s.prices.push({ state, day: ymd(now), value: +value, at: now });
      notify(s, 'all', `Today's price published: ${state} ${inr(+value)}/t`, '#/home');
    });
  }

  function approveSignup(id, distributorId) {
    commit(s => {
      const sg = s.signups.find(x => x.id === id);
      s.signups = s.signups.filter(x => x.id !== id);
      const did = 'R' + (Math.max(...s.dealers.map(d => +d.id.slice(1))) + 1);
      const d = distributor(distributorId, s);
      s.dealers.push({ id: did, name: sg.name, area: sg.area, state: d.state, distributorId, phone: sg.phone, onApp: true });
    });
  }
  const rejectSignup = id => commit(s => { s.signups = s.signups.filter(x => x.id !== id); });
  const markSeen = u => commit(s => { s.seen[userKey(u)] = Date.now(); });

  return {
    SIZES, STATES, DAY, questions, esc,
    today0, ymd, inr, tFmt, date, dateLong, time, r3,
    load, save, reset, commit,
    dealer, distributor, who, stateOf, term, order,
    priceToday, rate, splitTotal, amountFor,
    lockedRate, dueAt, termLabel, cutoffAt, needsSplit, dispatchedT, deliveredT, pendingT, billT, amount, canEditSplit, payState, statusLabel, STEPS, stepIndex,
    ordersFor, notifsFor, unreadFor,
    placeOrder, sendRequest, reviewRequest, approveDirect, saveSplit, confirmOrder, markReady, addTruck, truckReceived, closeOrder, pay, cancelOrder,
    publishPrice, approveSignup, rejectSignup, markSeen,
  };
})();
