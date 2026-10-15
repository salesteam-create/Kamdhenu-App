/* Mohit Ispat admin panel. Reads and changes state only through MI (mi-data.js). */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const E = MI.esc;
  const S = () => MI.load();
  const DAY = MI.DAY;

  const ui = { keep: true, lastHash: null, splitOpen: {}, saved: {}, sheetOk: null };

  /* ---------- icons ---------- */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    orders: '<path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z"/><path d="M16 5h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2"/><path d="M9 12h6M9 16h4"/>',
    wallet: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
    check: '<path d="M5 12.5 10 17 19 7"/>',
    weight: '<path d="M6 8h12l2 12H4z"/><circle cx="12" cy="5" r="2"/>',
    userPlus: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  };
  const ic = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ---------- small helpers ---------- */
  const pin = n => `<button class="qpin" type="button" data-q="${n}" title="Point to confirm C${n}">C${n}</button>`;
  const day0 = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const dayDiff = ts => Math.round((day0(ts) - MI.today0()) / DAY);
  const relDay = ts => {
    const n = dayDiff(ts);
    if (n === 0) return 'today';
    if (n === 1) return 'tomorrow';
    if (n === -1) return 'yesterday';
    return n > 0 ? `in ${n} days` : `${-n} days ago`;
  };
  const dt = ts => `${MI.date(ts)}, ${MI.time(ts)}`;
  const sum = (list, fn) => list.reduce((a, x) => a + fn(x), 0);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
  const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + MI.inr(Math.abs(n));
  const termOf = o => ({ label: MI.termLabel(o), days: o.termDays, adj: o.adj });
  const roleName = r => (r === 'dealer' ? 'Dealer' : r === 'distributor' ? 'Distributor' : 'Admin');
  const typeName = o => (o.type === 'lumpsum' ? 'Lump-sum' : 'Full split');
  const pathName = o => (o.path === 'combined' ? 'Combined' : 'Direct');
  const unpaid = o => o.payment.status !== 'paid' && o.status !== 'cancelled';
  const byPlaced = (a, b) => b.placedAt - a.placedAt;

  const STATUS_CLS = { pending_dist: 'warn', booked: 'brand', confirmed: 'info', ready: 'info', dispatching: 'info', delivered: 'good', cancelled: '' };
  const statusPill = o => {
    const cls = o.status === 'confirmed' && MI.needsSplit(o) ? 'warn' : STATUS_CLS[o.status] || '';
    return `<span class="pill ${cls}">${E(MI.statusLabel(o))}</span>`;
  };
  const PAY = { paid: ['good', 'Paid'], overdue: ['brand', 'Overdue'], due_soon: ['warn', 'Due soon'], open: ['', 'Not due yet'] };
  const payPill = o => {
    if (o.status === 'cancelled' && o.payment.status !== 'paid') return '<span class="pill">No payment</span>';
    const [cls, label] = PAY[MI.payState(o)];
    return `<span class="pill ${cls}">${label}</span>`;
  };
  const delta = (cur, prev) => {
    if (prev == null) return '<span class="delta flat">First price</span>';
    const d = cur - prev;
    if (!d) return '<span class="delta flat">No change</span>';
    return `<span class="delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '↑' : '↓'} ${MI.inr(Math.abs(d))}</span>`;
  };

  /* ---------- order groups ---------- */
  const G = {
    live: s => s.orders.filter(o => o.status !== 'cancelled'),
    awaiting: s => s.orders.filter(o => o.status === 'booked'),
    pendingDist: s => s.orders.filter(o => o.status === 'pending_dist'),
    missing: s => s.orders.filter(o => o.type === 'lumpsum' && MI.needsSplit(o) && !['cancelled', 'delivered'].includes(o.status)),
    dispatch: s => s.orders.filter(o => o.status === 'ready' || o.status === 'dispatching'),
    delivered: s => s.orders.filter(o => o.status === 'delivered'),
    overdue: s => s.orders.filter(o => unpaid(o) && MI.payState(o, s) === 'overdue'),
    dueSoon: s => s.orders.filter(o => unpaid(o) && MI.payState(o, s) === 'due_soon'),
    unpaid: s => s.orders.filter(unpaid),
    trucks: s => s.orders.flatMap(o => o.trucks.filter(t => t.status === 'dispatched').map(t => ({ o, t }))),
    priceDue: () => MI.STATES.filter(st => !MI.priceToday(st).isToday),
  };
  const FILTERS = [
    { k: 'all', label: 'All', list: s => s.orders },
    { k: 'awaiting', label: 'Awaiting confirmation', list: G.awaiting, alert: true },
    { k: 'split', label: 'Missing size split', list: G.missing, alert: true },
    { k: 'dispatch', label: 'In dispatch', list: G.dispatch },
    { k: 'delivered', label: 'Delivered', list: G.delivered },
    { k: 'overdue', label: 'Payment overdue', list: G.overdue, alert: true },
  ];

  /* ---------- presenter mode ---------- */
  const PKEY = 'mi-presenter';
  function readPresenter() {
    try { const v = localStorage.getItem(PKEY); return v === null ? true : v === '1'; } catch (e) { return true; }
  }
  function setPresenter(on) {
    try { localStorage.setItem(PKEY, on ? '1' : '0'); } catch (e) { /* storage blocked */ }
    document.body.classList.toggle('presenter', on);
    $('#presenterToggle').checked = on;
  }

  /* ---------- toast and sheet ---------- */
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = ic('check', 16) + '<span></span>';
    el.lastChild.textContent = msg;
    $('#toasts').appendChild(el);
    const all = $$('#toasts .toast'); if (all.length > 3) all.slice(0, all.length - 3).forEach(t => t.remove());
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
  }
  function openSheet(html, wide) {
    const body = $('#sheetBody');
    body.className = 'sheet' + (wide ? ' wide' : '');
    body.innerHTML = html;
    $('#sheet').classList.add('open');
    const first = body.querySelector('[data-autofocus]') || body.querySelector('.btn');
    if (first) first.focus();
  }
  function closeSheet() { $('#sheet').classList.remove('open'); ui.sheetOk = null; }
  function confirmSheet({ title, body, ok, okCls = '', cancel = 'Cancel', onOk }) {
    ui.sheetOk = onOk;
    openSheet(`<h3>${title}</h3><div class="sheet-text">${body}</div>
      <div class="sheet-actions"><button class="btn ghost sm" data-act="sheet-close">${cancel}</button><button class="btn sm ${okCls}" data-act="sheet-ok" data-autofocus>${ok}</button></div>`);
  }
  function openPin(n) {
    const q = MI.questions.find(x => x.n === +n);
    if (!q) return;
    openSheet(`<div class="q-label">Point to confirm C${q.n}</div><h3>${E(q.title)}</h3>
      <div class="q-ask">${E(q.ask)}</div>
      <p class="q-assume"><b>Prototype assumption:</b> ${E(q.assume)}</p>
      <div class="sheet-actions"><a class="btn ghost sm" href="#/points" data-act="sheet-close">All points</a><button class="btn sm" data-act="sheet-close" data-autofocus>Close</button></div>`);
  }

  // Run a state change made by this page; the next render starts with fresh form values
  function act(fn, msg) {
    ui.keep = false;
    fn();
    ui.keep = true;
    if (msg) toast(msg);
  }

  /* ---------- routing ---------- */
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    return { page: parts[0] || 'dashboard', id: parts[1] || '' };
  }

  const PAGES = {
    dashboard: { title: 'Dashboard', nav: 'dashboard', render: pDashboard },
    price: { title: 'Daily price', nav: 'price', render: pPrice },
    orders: { title: 'Orders', nav: 'orders', render: pOrders },
    order: { title: 'Order', nav: 'orders', render: pOrder },
    payments: { title: 'Payments', nav: 'payments', render: pPayments },
    users: { title: 'Distributors and dealers', nav: 'users', render: pUsers },
    settings: { title: 'Settings', nav: 'settings', render: pSettings },
    points: { title: 'Points to confirm', nav: 'points', render: pPoints },
  };

  function render() {
    const r = route();
    const page = PAGES[r.page] ? r.page : 'dashboard';
    const main = $('#main');
    const sameRoute = ui.lastHash === location.hash;
    const kept = sameRoute && ui.keep ? snapshot(main) : null;
    const focusId = sameRoute && document.activeElement && main.contains(document.activeElement) ? document.activeElement.id : '';

    const out = PAGES[page].render(r.id);
    main.innerHTML = out.html;
    $('#title').textContent = out.title || PAGES[page].title;
    $('#crumbs').innerHTML = out.crumbs || '';
    document.title = `${out.title || PAGES[page].title} · Mohit Ispat Admin`;
    renderNav(PAGES[page].nav);

    if (kept) restore(main, kept);
    if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
    $$('[data-saved]', main).forEach(el => {
      const t = ui.saved[el.dataset.saved];
      if (t && Date.now() - t < 1800) {
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 1800 - (Date.now() - t));
      }
    });
    if (!sameRoute) window.scrollTo(0, 0);
    ui.lastHash = location.hash;
  }
  // Keep what the user is typing when another tab changes the data
  function snapshot(root) {
    const map = {};
    $$('input[id], select[id]', root).forEach(el => { map[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
    return map;
  }
  function restore(root, map) {
    $$('input[id], select[id]', root).forEach(el => {
      if (!(el.id in map) || el.dataset.live) return;
      if (el.type === 'checkbox') el.checked = map[el.id]; else el.value = map[el.id];
    });
    $$('[data-split-form]', root).forEach(updateSplitTotal);
  }

  function renderNav(active) {
    const s = S();
    const nAct = G.awaiting(s).length + G.missing(s).length + G.pendingDist(s).length;
    const nOver = G.overdue(s).length;
    const nSoon = G.dueSoon(s).length;
    const nPrice = G.priceDue().length;
    const badge = (n, cls = '') => (n ? `<span class="count ${cls}">${n}</span>` : '');
    const items = [
      { sec: 'Overview' },
      { k: 'dashboard', label: 'Dashboard', icon: 'home' },
      { sec: 'Sales' },
      { k: 'price', label: 'Daily price', icon: 'tag', b: nPrice ? badge('Due', 'alert') : '' },
      { k: 'orders', label: 'Orders', icon: 'orders', b: badge(nAct, 'alert') },
      { k: 'payments', label: 'Payments', icon: 'wallet', b: nOver ? badge(nOver, 'alert') : badge(nSoon, 'warn') },
      { sec: 'Network' },
      { k: 'users', label: 'Users', icon: 'users', b: badge(s.signups.length, 'warn') },
      { sec: 'Setup' },
      { k: 'settings', label: 'Settings', icon: 'sliders' },
      { k: 'points', label: 'Points to confirm', icon: 'help', b: badge(MI.questions.length, 'q') },
    ];
    $('#nav').innerHTML = items.map(it => it.sec
      ? `<div class="nav-sec">${it.sec}</div>`
      : `<a class="nav-item${it.k === active ? ' on' : ''}" href="#/${it.k}"${it.k === active ? ' aria-current="page"' : ''}>${ic(it.icon)}<span>${it.label}</span>${it.b || ''}</a>`).join('');
  }

  /* =========================================================
     1. Dashboard
     ========================================================= */
  function pDashboard() {
    const s = S();
    const now = new Date();
    const m0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const month = G.live(s).filter(o => o.placedAt >= m0);
    const monthT = sum(month, o => o.tonnes);
    const awaiting = G.awaiting(s);
    const missing = G.missing(s);
    const trucks = G.trucks(s);
    const overdue = G.overdue(s);
    const dueSoon = G.dueSoon(s);
    const amt = list => MI.inr(sum(list, o => MI.amount(o, s)));
    const monthName = now.toLocaleDateString('en-IN', { month: 'long' });
    const firstCut = missing.length ? Math.min(...missing.map(o => MI.cutoffAt(o, s))) : 0;

    const kpis = `
      <div class="grid-3">
        <a class="card kpi" href="#/orders">
          <div class="k-top"><span class="k-ic info">${ic('weight', 16)}</span>Tonnes booked in ${monthName}</div>
          <div class="k-val">${E(MI.tFmt(monthT))}</div>
          <div class="k-sub">${plural(month.length, 'order')} since ${MI.date(m0)}</div>
        </a>
        <a class="card kpi" href="#/orders/awaiting">
          <div class="k-top"><span class="k-ic brand">${ic('orders', 16)}</span>Awaiting confirmation</div>
          <div class="k-val">${awaiting.length}</div>
          <div class="k-sub">${awaiting.length ? `${E(MI.tFmt(sum(awaiting, o => o.tonnes)))} to confirm` : 'All orders confirmed'}</div>
        </a>
        <a class="card kpi" href="#/orders/split">
          <div class="k-top"><span class="k-ic warn">${ic('grid', 16)}</span>Lump-sum orders missing size split</div>
          <div class="k-val">${missing.length}</div>
          <div class="k-sub">${missing.length ? `First cut-off ${MI.date(firstCut)}, ${relDay(firstCut)}` : 'No splits missing'}</div>
        </a>
        <a class="card kpi" href="#/orders/dispatch">
          <div class="k-top"><span class="k-ic info">${ic('truck', 16)}</span>Trucks on the road</div>
          <div class="k-val">${trucks.length}</div>
          <div class="k-sub">${trucks.length ? `${E(MI.tFmt(sum(trucks, x => x.t.weightT)))} in transit` : 'No trucks out'}</div>
        </a>
        <a class="card kpi" href="#/payments">
          <div class="k-top"><span class="k-ic ${overdue.length ? 'brand' : 'warn'}">${ic('wallet', 16)}</span>Payments</div>
          <div class="k-split">
            <div><div class="k-val ${overdue.length ? 't-brand' : ''}">${overdue.length} <small>overdue</small></div><div class="k-sub">${amt(overdue)}</div></div>
            <div><div class="k-val ${dueSoon.length ? 't-warn' : ''}">${dueSoon.length} <small>due soon</small></div><div class="k-sub">${amt(dueSoon)}</div></div>
          </div>
        </a>
        <a class="card kpi" href="#/users/approvals">
          <div class="k-top"><span class="k-ic good">${ic('userPlus', 16)}</span>Signups awaiting approval</div>
          <div class="k-val">${s.signups.length}</div>
          <div class="k-sub">${s.signups.length ? 'Numbers not on the dealer list' : 'Queue is clear'}</div>
        </a>
      </div>`;

    // Needs attention
    const items = [];
    G.priceDue().forEach(st => {
      const p = MI.priceToday(st, s);
      items.push({ dot: 'brand', href: '#/price', title: `Publish today's price for ${E(st)}`, sub: p.at ? `Last published ${MI.date(p.at)}: ${MI.inr(p.value)}/t` : 'No price yet' });
    });
    G.pendingDist(s).forEach(o => items.push({ dot: 'info', href: `#/order/${o.id}`, title: `${o.id} is waiting for distributor approval`, sub: `${E(MI.who(o.by.id, s))}, ${E(MI.tFmt(o.tonnes))}` }));
    awaiting.forEach(o => items.push({ dot: 'brand', href: `#/order/${o.id}`, title: `Confirm ${o.id}`, sub: `${E(MI.who(o.by.id, s))}, ${E(MI.tFmt(o.tonnes))}, placed ${relDay(o.placedAt)}` }));
    missing.forEach(o => {
      const c = MI.cutoffAt(o, s);
      const past = c < Date.now();
      items.push({ dot: past ? 'brand' : 'warn', href: `#/order/${o.id}`, title: `${o.id} needs a size split`, sub: `${E(MI.who(o.by.id, s))}, lump-sum ${E(MI.tFmt(o.tonnes))}. Cut-off ${MI.date(c)}${past ? ', passed' : `, ${relDay(c)}`}` });
    });
    s.orders.filter(o => o.status === 'confirmed' && !MI.needsSplit(o)).forEach(o => items.push({ dot: 'info', href: `#/order/${o.id}`, title: `Mark ${o.id} ready for dispatch`, sub: `${E(MI.who(o.by.id, s))}, ${E(MI.tFmt(o.tonnes))}, size split complete` }));
    s.orders.filter(o => o.status === 'ready' && !o.trucks.length).forEach(o => items.push({ dot: 'info', href: `#/order/${o.id}`, title: `Dispatch trucks for ${o.id}`, sub: `${E(MI.tFmt(MI.pendingT(o)))} ready to load` }));
    trucks.forEach(({ o, t }) => items.push({ dot: dayDiff(t.eta) <= 0 ? 'warn' : 'info', href: `#/order/${o.id}`, title: `Truck ${E(t.vehicle)} on the road for ${o.id}`, sub: `${E(MI.tFmt(t.weightT))}, expected ${MI.date(t.eta)} (${relDay(t.eta)})` }));
    overdue.forEach(o => items.push({ dot: 'brand', href: `#/order/${o.id}`, title: `Payment overdue on ${o.id}`, sub: `${E(MI.who(o.by.id, s))}, ${MI.inr(MI.amount(o, s))}, was due ${MI.date(MI.dueAt(o, s))}` }));
    dueSoon.forEach(o => items.push({ dot: 'warn', href: `#/order/${o.id}`, title: `Payment due soon on ${o.id}`, sub: `${E(MI.who(o.by.id, s))}, ${MI.inr(MI.amount(o, s))}, due ${MI.date(MI.dueAt(o, s))} (${relDay(MI.dueAt(o, s))})` }));
    if (s.signups.length) items.push({ dot: 'warn', href: '#/users/approvals', title: `${plural(s.signups.length, 'signup')} to approve`, sub: s.signups.map(x => E(x.name)).join(', ') });

    const attention = `
      <section class="card">
        <div class="card-h"><div><h2>Needs attention</h2><div class="sub">${items.length ? plural(items.length, 'item') : 'Nothing waiting'}</div></div></div>
        ${items.length ? `<ul class="att">${items.map(it => `<li><a href="${it.href}"><span class="dot ${it.dot}"></span><span class="a-main"><b>${it.title}</b><div class="small">${it.sub}</div></span><span class="chev">${ic('chev', 16)}</span></a></li>`).join('')}</ul>`
          : '<div class="empty">All caught up.</div>'}
      </section>`;

    const prices = `
      <section class="card">
        <div class="card-h"><div><h2>Today's price</h2><div class="sub">Per tonne, all sizes</div></div><a class="btn ghost sm" href="#/price">Update price</a></div>
        <div class="state-prices">${MI.STATES.map(st => {
          const p = MI.priceToday(st, s);
          return `<div>
            <div class="row between"><b>${E(st)}</b>${p.isToday ? '<span class="pill good">Published today</span>' : '<span class="pill warn">Not published today</span>'}</div>
            <div class="price-big" style="margin-top:10px">${p.value ? MI.inr(p.value) : 'Not set'}<small>/t</small></div>
            <div class="row" style="margin-top:6px">${delta(p.value, p.prev)}<span class="small muted">vs previous ${p.prev ? MI.inr(p.prev) : ''}</span></div>
            <div class="small muted" style="margin-top:4px">${p.at ? `Published ${MI.date(p.at)}, ${MI.time(p.at)}` : ''}</div>
          </div>`;
        }).join('')}</div>
      </section>`;

    const recent = s.orders.slice().sort(byPlaced).slice(0, 6);
    const recentCard = `
      <section class="card">
        <div class="card-h"><div><h2>Latest orders</h2><div class="sub">Newest first</div></div><a class="btn ghost sm" href="#/orders">All orders</a></div>
        <div class="tbl-wrap"><table class="tbl compact">
          <thead><tr><th>Order</th><th>Placed by</th><th class="num">Tonnes</th><th class="num">Amount</th><th>Status</th><th>Payment</th></tr></thead>
          <tbody>${recent.map(o => `<tr class="click" data-href="#/order/${o.id}">
            <td><a class="id" href="#/order/${o.id}">${o.id}</a><span class="sub2">${dt(o.placedAt)}</span></td>
            <td>${E(MI.who(o.by.id, s))}<span class="sub2">${roleName(o.by.role)}</span></td>
            <td class="num">${E(MI.tFmt(o.tonnes))}</td>
            <td class="num">${MI.inr(MI.amount(o, s))}</td>
            <td>${statusPill(o)}</td><td>${payPill(o)}</td></tr>`).join('')}</tbody>
        </table></div>
      </section>`;

    const title = `Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}`;
    return {
      title: 'Dashboard',
      crumbs: `${E(MI.dateLong(Date.now()))}`,
      html: `<div class="stack">
        <p class="lead">${title}. Here is what needs your attention across orders, dispatch and payments.</p>
        ${kpis}
        <div class="dash-grid">${attention}${prices}</div>
        ${recentCard}
      </div>`,
    };
  }

  /* =========================================================
     2. Daily price
     ========================================================= */
  function pPrice() {
    const s = S();
    const cards = MI.STATES.map(st => {
      const p = MI.priceToday(st, s);
      const all = s.prices.filter(x => x.state === st).sort((a, b) => a.at - b.at);
      const hist = all.map((x, i) => ({ ...x, prev: i ? all[i - 1].value : null })).reverse().slice(0, 8);
      return `<section class="card">
        <div class="card-h"><div><h2>${E(st)}</h2><div class="sub">Delivered price per tonne, all sizes ${pin(13)}</div></div>
          ${p.isToday ? '<span class="pill good">Published today</span>' : '<span class="pill warn">Not published today</span>'}</div>
        <div class="card-b">
          <div class="price-row">
            <div>
              <div class="small muted">Current price</div>
              <div class="price-big">${p.value ? MI.inr(p.value) : 'Not set'}<small>/t</small></div>
            </div>
            <div style="text-align:right">${delta(p.value, p.prev)}<div class="small muted">${p.at ? `Published ${MI.dateLong(p.at)}, ${MI.time(p.at)}` : ''}</div></div>
          </div>
          <form class="publish" data-form="publish" data-state="${E(st)}" novalidate>
            <div class="field"><label for="price-${E(st)}">New price for today</label>
              <div class="rupee-input"><span class="pre">₹</span><input class="input" id="price-${E(st)}" type="number" inputmode="numeric" min="1" step="50" value="${p.value || ''}"><span class="post">/t</span></div>
            </div>
            <button class="btn" type="submit">Publish today's price</button>
          </form>
          <div class="err" id="price-err-${E(st)}"></div>
        </div>
        <div class="tbl-wrap" style="border-top:1px solid var(--line)"><table class="tbl compact">
          <thead><tr><th>Date</th><th>Time</th><th class="num">Price</th><th class="num">Change</th></tr></thead>
          <tbody>${hist.map(h => {
            const d = h.prev == null ? 0 : h.value - h.prev;
            return `<tr><td>${MI.dateLong(h.at)}${dayDiff(h.at) === 0 ? ' <span class="pill info">Today</span>' : ''}</td><td class="muted">${MI.time(h.at)}</td><td class="num"><b>${MI.inr(h.value)}</b></td>
              <td class="num ${d > 0 ? 't-good' : d < 0 ? 't-brand' : 'muted'}">${h.prev == null ? 'First' : d ? signed(d) : 'No change'}</td></tr>`;
          }).join('')}</tbody>
        </table></div>
      </section>`;
    }).join('');

    const ex = s.settings.sizeExtra || {};
    const extras = `<section class="card">
      <div class="card-h"><div><h2>Size extras (₹/t) ${pin(9)}</h2><div class="sub">Added on top of the daily price for that size. Leave at 0 for one price for all sizes.</div></div><span class="saved" data-saved="extras">${ic('check', 14)} Saved</span></div>
      <div class="card-b"><div class="extras">${MI.SIZES.map(k => `<div class="field"><label for="extra-${k}">${k} mm</label>
        <input class="input" id="extra-${k}" type="number" step="50" value="${+ex[k] || 0}" data-extra="${k}"></div>`).join('')}</div></div>
    </section>`;

    return {
      title: 'Daily price',
      html: `<div class="stack">
        <p class="lead">Publish the price per tonne each morning. Orders lock the price of the day they are booked. One price for distributors and dealers ${pin(8)}</p>
        <div class="grid-2 collapse" style="align-items:start">${cards}</div>
        ${extras}
      </div>`,
    };
  }

  /* =========================================================
     3. Orders
     ========================================================= */
  function pOrders(filterKey) {
    const s = S();
    const f = FILTERS.find(x => x.k === filterKey) || FILTERS[0];
    const list = f.list(s).slice().sort(byPlaced);
    const chips = FILTERS.map(x => {
      const n = x.list(s).length;
      return `<a class="chip${x === f ? ' on' : ''}" href="#/orders/${x.k}">${x.label}<span class="c${x.alert && n && x !== f ? ' alert' : ''}">${n}</span></a>`;
    }).join('');

    const rows = list.map(o => {
      const t = termOf(o);
      const disp = MI.dispatchedT(o);
      const pct = o.tonnes ? Math.min(100, (disp / o.tonnes) * 100) : 0;
      const hl = (o.status === 'booked' || (o.type === 'lumpsum' && MI.needsSplit(o) && o.status !== 'cancelled') || (unpaid(o) && MI.payState(o, s) === 'overdue')) ? ' hl' : '';
      return `<tr class="click${hl}" data-href="#/order/${o.id}">
        <td class="nowrap"><a class="id" href="#/order/${o.id}">${o.id}</a><span class="sub2">${MI.date(o.placedAt)}, ${MI.time(o.placedAt)}</span><span class="sub2 show-md">${pathName(o)}, ${typeName(o)}</span></td>
        <td class="name">${E(MI.who(o.by.id, s))}<span class="sub2">${roleName(o.by.role)}</span></td>
        <td class="name">${E(MI.who(o.distributorId, s))}${o.dealerId ? `<span class="sub2">Dealer: ${E(MI.who(o.dealerId, s))}</span>` : ''}</td>
        <td class="nowrap hide-md">${pathName(o)}<span class="sub2">${typeName(o)}</span></td>
        <td class="num">${E(MI.tFmt(o.tonnes))}<span class="sub2 show-md">${MI.inr(MI.lockedRate(o, s))}/t</span><span class="sub2 show-md">${E(t.label)}</span></td>
        <td class="num hide-md">${MI.inr(MI.lockedRate(o, s))}<span class="sub2">${E(t.label)}</span></td>
        <td>${statusPill(o)}<div class="show-md" style="margin-top:6px">${payPill(o)}</div></td>
        <td class="nowrap">${E(MI.tFmt(disp))}<span class="sub2">${E(MI.tFmt(MI.pendingT(o)))} pending</span><div class="mini-bar"><i class="${o.status === 'delivered' ? 'done' : ''}" style="width:${pct}%"></i></div></td>
        <td class="hide-md">${payPill(o)}${unpaid(o) ? `<span class="sub2">Due ${MI.date(MI.dueAt(o, s))}</span>` : ''}</td>
      </tr>`;
    }).join('');

    return {
      title: 'Orders',
      html: `<div class="stack">
        <div class="chips">${chips}</div>
        <section class="card">
          <div class="card-h"><div><h2>${f.k === 'all' ? 'All orders' : f.label}</h2><div class="sub">${plural(list.length, 'order')}, ${E(MI.tFmt(sum(list, o => o.tonnes)))}. Click a row to open it.</div></div></div>
          ${list.length ? `<div class="tbl-wrap"><table class="tbl orders-tbl">
            <thead><tr><th>Order</th><th>Placed by</th><th>Distributor / dealer ${pin(6)}</th><th class="hide-md">Path / type</th><th class="num">Tonnes</th><th class="num hide-md">Locked rate</th><th>Status</th><th>Dispatched</th><th class="hide-md">Payment</th></tr></thead>
            <tbody>${rows}</tbody></table></div>` : '<div class="empty">No orders match this filter.</div>'}
        </section>
      </div>`,
    };
  }

  /* =========================================================
     Order detail
     ========================================================= */
  function truckDefaults(o) {
    const n = o.trucks.length;
    const list = o.state === 'Karnataka' ? ['KA 22 B 6643', 'KA 25 C 1187', 'KA 22 D 9012'] : ['GA 08 T 4521', 'GA 07 F 2210', 'GA 02 X 7781', 'GA 09 K 3304'];
    return {
      vehicle: list[n % list.length],
      driver: `+91 98500 ${11010 + n}`,
      weight: MI.r3(Math.min(MI.pendingT(o), 18)),
      eta: MI.ymd(Date.now() + DAY),
    };
  }

  function pOrder(id) {
    const s = S();
    const o = MI.order(id, s);
    const crumbs = '<a href="#/orders">Orders</a> / ' + E(id);
    if (!o) {
      return { title: 'Order not found', crumbs, html: `<section class="card"><div class="empty">No order called ${E(id)}. <a href="#/orders">Back to orders</a></div></section>` };
    }
    const t = termOf(o);
    const needs = MI.needsSplit(o);
    const editable = ['pending_dist', 'booked', 'confirmed'].includes(o.status);
    const cancellable = ['pending_dist', 'booked', 'confirmed', 'ready'].includes(o.status) && !o.trucks.length;
    const tol = s.settings.tolerance;
    const tolPct = `±${MI.r3(tol * 100)}%`;

    // header and actions
    const actions = [];
    if (o.status === 'booked' || o.status === 'pending_dist') actions.push(`<button class="btn sm" data-act="confirm" data-id="${o.id}">${ic('check', 16)} Confirm order</button>`);
    if (o.status === 'confirmed') {
      actions.push(needs
        ? `<button class="btn sm" disabled title="Add the size split first">Mark ready for dispatch</button>`
        : `<button class="btn sm" data-act="ready" data-id="${o.id}">${ic('truck', 16)} Mark ready for dispatch</button>`);
    }
    if (cancellable) actions.push(`<button class="btn ghost sm" data-act="cancel" data-id="${o.id}">Cancel order</button>`);

    const step = MI.stepIndex(o);
    const steps = `<div class="steps${o.status === 'cancelled' ? ' cancelled' : ''}">${MI.STEPS.map((label, i) => `<div class="step ${o.status === 'cancelled' ? '' : i < step || o.status === 'delivered' ? 'done' : i === step ? 'cur' : ''}"><i></i>${label}</div>`).join('')}</div>`;

    const head = `<section class="card">
      <div class="card-b o-head">
        <div>
          <h2>${o.id} ${statusPill(o)}</h2>
          <p class="lead">${typeName(o)} order, ${pathName(o).toLowerCase()}, ${E(MI.tFmt(o.tonnes))} for ${E(o.state)}. Placed ${MI.dateLong(o.placedAt)}, ${MI.time(o.placedAt)} by ${E(MI.who(o.by.id, s))}.</p>
        </div>
        <div class="o-actions">${actions.join('')}</div>
      </div>
      ${o.status === 'pending_dist' ? '<div class="card-b" style="padding-top:0"><div class="note warn">Waiting for the distributor to approve this direct dealer order. You can still confirm it here.</div></div>' : ''}
      ${o.status === 'cancelled' ? '<div class="card-b" style="padding-top:0"><div class="note warn">This order was cancelled. The customer was notified.</div></div>' : ''}
      <div style="border-top:1px solid var(--line)">${steps}</div>
    </section>`;

    // summary
    const summary = `<section class="card">
      <div class="card-h"><h2>Summary</h2></div>
      <div class="card-b"><div class="facts">
        <div class="fact"><div class="k">Placed by</div><div class="v">${E(MI.who(o.by.id, s))} <span class="small">${roleName(o.by.role)}</span></div></div>
        <div class="fact"><div class="k">Distributor ${pin(6)}</div><div class="v">${E(MI.who(o.distributorId, s))}</div></div>
        <div class="fact"><div class="k">Dealer</div><div class="v">${o.dealerId ? E(MI.who(o.dealerId, s)) : '<span class="small">None, distributor order</span>'}</div></div>
        <div class="fact"><div class="k">Path</div><div class="v">${pathName(o)}${o.path === 'combined' ? ' <span class="small">dealer orders combined</span>' : ''}</div></div>
        <div class="fact"><div class="k">Type</div><div class="v">${typeName(o)}</div></div>
        <div class="fact"><div class="k">State</div><div class="v">${E(o.state)}</div></div>
        <div class="fact"><div class="k">Booked</div><div class="v">${E(MI.tFmt(o.tonnes))}</div></div>
        <div class="fact"><div class="k">Price on booking day</div><div class="v">${MI.inr(o.base)}/t</div></div>
        <div class="fact"><div class="k">Term ${pin(1)}</div><div class="v">${E(t.label)} <span class="small">${signed(t.adj)}/t</span></div></div>
        <div class="fact"><div class="k">Locked rate</div><div class="v">${MI.inr(MI.lockedRate(o, s))}/t</div></div>
        <div class="fact"><div class="k">Placed</div><div class="v">${MI.dateLong(o.placedAt)}, ${MI.time(o.placedAt)}</div></div>
        <div class="fact"><div class="k">Payment due ${pin(10)}</div><div class="v">${MI.dateLong(MI.dueAt(o, s))}</div></div>
      </div></div>
    </section>`;

    // size split
    const total = MI.splitTotal(o.split);
    const cut = MI.cutoffAt(o, s);
    const cutPast = cut < Date.now();
    const splitOpen = editable && (ui.splitOpen[o.id] || false);
    const splitWarn = needs && o.status !== 'cancelled' ? `<div class="note warn" style="margin-bottom:14px">${ic('alert', 16)}<div><b>Size split missing.</b> ${E(MI.tFmt(total))} of ${E(MI.tFmt(o.tonnes))} entered.
        ${cutPast ? `The cut-off passed on ${MI.dateLong(cut)}. Call the customer, then enter the split here or cancel the order.`
          : `The customer can add it until ${MI.dateLong(cut)} (${relDay(cut)}). After that, enter it here after a call, or cancel the order.`} ${pin(11)}</div></div>` : '';
    const splitTable = `<div class="tbl-wrap"><table class="tbl split-tbl compact">
      <thead><tr><th>Size</th>${MI.SIZES.map(k => `<th>${k} mm</th>`).join('')}<th>Total</th></tr></thead>
      <tbody><tr><td class="muted">Tonnes</td>${MI.SIZES.map(k => `<td>${+o.split[k] ? `<b>${E(MI.tFmt(+o.split[k]))}</b>` : '<span class="muted">0</span>'}</td>`).join('')}<td><b>${E(MI.tFmt(total))}</b></td></tr></tbody>
    </table></div>`;
    const splitForm = splitOpen ? `<form data-form="split" data-split-form data-id="${o.id}" data-tonnes="${o.tonnes}" novalidate style="margin-top:16px">
        <div class="split-form">${MI.SIZES.map(k => `<div class="field"><label for="sp-${o.id}-${k}">${k} mm</label><input class="input" id="sp-${o.id}-${k}" type="number" min="0" step="0.5" value="${+o.split[k] || ''}" placeholder="0" data-size="${k}"></div>`).join('')}</div>
        <div class="split-total"><span class="small" data-split-total></span>
          <span class="row"><button class="btn ghost sm" type="button" data-act="split-toggle" data-id="${o.id}">Cancel</button><button class="btn sm" type="submit">Save size split</button></span></div>
        <div class="err" data-split-err></div>
      </form>` : '';
    const splitCard = `<section class="card">
      <div class="card-h"><div><h2>Size split</h2><div class="sub">${E(MI.tFmt(total))} of ${E(MI.tFmt(o.tonnes))} entered</div></div>
        ${editable && !splitOpen ? `<button class="btn ${needs ? '' : 'ghost'} sm" data-act="split-toggle" data-id="${o.id}">${needs ? 'Enter split' : 'Edit split'}</button>` : ''}</div>
      <div class="card-b">${splitWarn}${splitTable}${splitForm}</div>
    </section>`;

    // dispatch
    const disp = MI.dispatchedT(o);
    const del = MI.deliveredT(o);
    const pend = MI.pendingT(o);
    const scale = Math.max(o.tonnes, disp) || 1;
    const progress = `<div class="prog">
      <div class="prog-bar"><span class="del" style="width:${(del / scale) * 100}%"></span><span class="dis" style="width:${((disp - del) / scale) * 100}%"></span></div>
      <div class="prog-legend">
        <div><div class="k"><i style="background:#c3c9d3"></i>Booked</div><div class="v">${E(MI.tFmt(o.tonnes))}</div></div>
        <div><div class="k"><i style="background:#7aa7e6"></i>Dispatched</div><div class="v">${E(MI.tFmt(disp))}</div></div>
        <div><div class="k"><i style="background:var(--good)"></i>Delivered</div><div class="v">${E(MI.tFmt(del))}</div></div>
        <div><div class="k"><i></i>Pending</div><div class="v">${E(MI.tFmt(pend))}</div></div>
      </div></div>`;
    const truckRows = o.trucks.map(tr => `<tr>
      <td class="nowrap"><b>${E(tr.vehicle)}</b><span class="sub2">Sent ${dt(tr.at)}</span></td>
      <td class="nowrap">${E(tr.driver)}</td>
      <td class="num">${E(MI.tFmt(tr.weightT))}</td>
      <td class="nowrap">${MI.date(tr.eta)}${tr.status === 'dispatched' ? `<span class="sub2">${relDay(tr.eta)}</span>` : ''}</td>
      <td>${tr.status === 'delivered' ? '<span class="pill good">Delivered</span>' : '<span class="pill info">On the road</span>'}</td>
      <td class="nowrap">${tr.status === 'delivered'
        ? `${MI.date(tr.deliveredAt)}, ${MI.time(tr.deliveredAt)}<span class="sub2">by ${tr.by === 'admin' ? 'admin' : 'customer'}</span>`
        : `<button class="btn soft sm" data-act="truck-delivered" data-id="${o.id}" data-truck="${E(tr.id)}">Mark delivered</button>`}</td>
    </tr>`).join('');
    const canTruck = ['ready', 'dispatching'].includes(o.status);
    const d = truckDefaults(o);
    const truckForm = canTruck ? `<form data-form="truck" data-id="${o.id}" novalidate class="card-b" style="border-top:1px solid var(--line)">
        <h3 style="font-size:14px;margin-bottom:12px">Add truck dispatch</h3>
        <div class="form-grid">
          <div class="field"><label for="tr-veh-${o.id}">Vehicle number</label><input class="input" id="tr-veh-${o.id}" value="${E(d.vehicle)}" autocomplete="off"></div>
          <div class="field"><label for="tr-drv-${o.id}">Driver phone</label><input class="input" id="tr-drv-${o.id}" type="tel" value="${E(d.driver)}" autocomplete="off"></div>
          <div class="field"><label for="tr-wt-${o.id}">Actual loaded weight (t)</label><input class="input" id="tr-wt-${o.id}" type="number" min="0" step="0.01" value="${d.weight || ''}"></div>
          <div class="field"><label for="tr-eta-${o.id}">Expected delivery</label><input class="input" id="tr-eta-${o.id}" type="date" min="${MI.ymd(Date.now())}" value="${d.eta}"></div>
        </div>
        <div class="row between" style="margin-top:12px;flex-wrap:wrap">
          <span class="small muted">${pend > 0 ? `${E(MI.tFmt(pend))} still to dispatch. The customer gets the vehicle and driver details.` : 'Booked tonnes are fully dispatched.'}</span>
          <button class="btn sm" type="submit">${ic('truck', 16)} Dispatch truck</button>
        </div>
        <div class="err" id="tr-err-${o.id}"></div>
      </form>` : '';
    const dispatchNote = !canTruck && o.status !== 'delivered' && o.status !== 'cancelled'
      ? `<div class="card-b" style="border-top:1px solid var(--line)"><div class="note">${o.status === 'confirmed' && needs ? 'Add the size split, then mark the order ready for dispatch to add trucks.' : 'Mark the order ready for dispatch to add trucks.'}</div></div>` : '';
    const closeBar = o.status === 'dispatching' ? `<div class="card-f row between" style="flex-wrap:wrap">
        <span class="small muted">The order closes by itself when delivered weight is within ${tolPct} of booked tonnes. ${pin(12)}</span>
        <button class="btn ghost sm" data-act="close-order" data-id="${o.id}">Close order as delivered</button></div>`
      : o.status === 'delivered' ? `<div class="card-f small muted">${o.closed ? `Closed as delivered by admin at ${E(MI.tFmt(del))}.` : `Delivered in full: ${E(MI.tFmt(del))} against ${E(MI.tFmt(o.tonnes))} booked.`}</div>` : '';
    const dispatchCard = `<section class="card">
      <div class="card-h"><div><h2>Dispatch ${pin(3)}</h2><div class="sub">No GPS. Each truck is tracked by vehicle number and driver phone.</div></div></div>
      <div class="card-b">${progress}</div>
      ${o.trucks.length ? `<div class="tbl-wrap" style="border-top:1px solid var(--line)"><table class="tbl compact">
        <thead><tr><th>Vehicle</th><th>Driver phone</th><th class="num">Weight</th><th>Expected</th><th>Status</th><th>Delivery ${pin(4)}</th></tr></thead>
        <tbody>${truckRows}</tbody></table></div>` : ''}
      ${truckForm}${dispatchNote}${closeBar}
    </section>`;

    // payment
    const ps = o.status === 'cancelled' && o.payment.status !== 'paid' ? null : MI.payState(o, s);
    const due = MI.dueAt(o, s);
    const payCard = `<section class="card">
      <div class="card-h"><h2>Payment</h2>${payPill(o)}</div>
      <div class="card-b">
        <div class="amount-big">${MI.inr(MI.amount(o, s))}</div>
        <div class="small muted">${o.status === 'delivered' ? `Final bill on actual loaded weight, ${E(MI.tFmt(MI.billT(o)))}` : `Estimate on ${E(MI.tFmt(MI.billT(o)))}. Final bill uses actual loaded weight.`}</div>
        <div class="hr"></div>
        <div class="kv">
          <div><span class="k">Term</span><span class="v">${E(t.label)}</span></div>
          <div><span class="k">Locked rate</span><span class="v">${MI.inr(MI.lockedRate(o, s))}/t</span></div>
          <div><span class="k">Due date ${pin(10)}</span><span class="v">${MI.dateLong(due)}${ps && ps !== 'paid' ? `<span class="sub2 small muted" style="display:block;font-weight:400">${relDay(due)}</span>` : ''}</span></div>
          ${o.payment.status === 'paid' ? `<div><span class="k">Paid on</span><span class="v">${MI.dateLong(o.payment.paidAt)}, ${MI.time(o.payment.paidAt)}</span></div>
            <div><span class="k">Method</span><span class="v">${E(o.payment.method)}</span></div>` : ''}
        </div>
        ${ps === 'overdue' ? `<div class="note warn" style="margin-top:14px">Payment is overdue. The customer sees a warning. New orders are not blocked. ${pin(14)}</div>` : ''}
        ${ps === 'due_soon' ? `<div class="note warn" style="margin-top:14px">Due ${relDay(due)}. The customer has a Pay now reminder. ${pin(2)}</div>` : ''}
        ${unpaid(o) ? `<button class="btn ghost block sm" style="margin-top:14px" data-act="pay" data-id="${o.id}">Mark payment received offline</button>` : ''}
      </div>
    </section>`;

    // parts
    const partsCard = o.parts && o.parts.length ? `<section class="card">
      <div class="card-h"><div><h2>Parts per dealer ${pin(7)}</h2><div class="sub">Combined by ${E(MI.who(o.by.id, s))}</div></div></div>
      <div class="tbl-wrap"><table class="tbl compact">
        <thead><tr><th>For</th><th class="num">Tonnes</th><th class="num">Share</th></tr></thead>
        <tbody>${o.parts.map(p => `<tr><td>${E(p.name || MI.who(p.dealerId, s))}<span class="sub2">${p.dealerId ? 'Dealer on the app' : p.name === 'Own stock' ? 'Distributor stock' : 'Added by hand'}</span></td>
          <td class="num">${E(MI.tFmt(p.tonnes))}</td><td class="num muted">${Math.round((p.tonnes / o.tonnes) * 100)}%</td></tr>`).join('')}</tbody>
      </table></div>
    </section>` : '';

    const logCard = `<section class="card">
      <div class="card-h"><h2>Activity</h2><span class="small muted">Newest first</span></div>
      <div class="card-b"><ul class="log">${o.log.slice().sort((a, b) => b.t - a.t).map(l => `<li>${E(l.text)}<span class="when">${MI.dateLong(l.t)}, ${MI.time(l.t)}</span></li>`).join('')}</ul></div>
    </section>`;

    return {
      title: `Order ${o.id}`,
      crumbs,
      html: `<div class="stack">${head}
        <div class="detail-grid">
          <div class="stack">${summary}${splitCard}${dispatchCard}</div>
          <div class="stack detail-side">${payCard}${partsCard}${logCard}</div>
        </div></div>`,
    };
  }

  function updateSplitTotal(form) {
    const tonnes = +form.dataset.tonnes;
    const total = MI.r3(sum($$('[data-size]', form), el => +el.value || 0));
    const left = MI.r3(tonnes - total);
    const out = $('[data-split-total]', form);
    if (!out) return;
    out.innerHTML = `Total <b>${E(MI.tFmt(total))}</b> of ${E(MI.tFmt(tonnes))}. ${left > 0 ? `<span class="t-warn">${E(MI.tFmt(left))} left to assign</span>` : left < 0 ? `<span class="t-brand">${E(MI.tFmt(-left))} too much</span>` : '<span class="t-good">Matches booked tonnes</span>'}`;
  }

  /* =========================================================
     4. Payments
     ========================================================= */
  function pPayments() {
    const s = S();
    const open = G.unpaid(s).sort((a, b) => MI.dueAt(a, s) - MI.dueAt(b, s));
    const overdue = G.overdue(s);
    const soon = G.dueSoon(s);
    const paid = s.orders.filter(o => o.payment.status === 'paid').sort((a, b) => b.payment.paidAt - a.payment.paidAt);
    const amt = list => MI.inr(sum(list, o => MI.amount(o, s)));
    const customer = o => `${E(MI.who(o.by.id, s))}<span class="sub2">${roleName(o.by.role)}${o.by.role === 'dealer' ? `, under ${E(MI.who(o.distributorId, s))}` : ''}</span>`;
    const online = m => /netbank|online|upi|gateway/i.test(m || '');

    const kpis = `<div class="grid-3">
      <div class="card kpi"><div class="k-top"><span class="k-ic info">${ic('wallet', 16)}</span>Outstanding</div><div class="k-val">${amt(open)}</div><div class="k-sub">${plural(open.length, 'unpaid order')}</div></div>
      <div class="card kpi"><div class="k-top"><span class="k-ic brand">${ic('alert', 16)}</span>Overdue ${pin(14)}</div><div class="k-val ${overdue.length ? 't-brand' : ''}">${amt(overdue)}</div><div class="k-sub">${overdue.length ? plural(overdue.length, 'order') : 'Nothing overdue'}</div></div>
      <div class="card kpi"><div class="k-top"><span class="k-ic warn">${ic('clock', 16)}</span>Due in the next ${plural(s.settings.reminderDays, 'day')}</div><div class="k-val ${soon.length ? 't-warn' : ''}">${amt(soon)}</div><div class="k-sub">${soon.length ? `${plural(soon.length, 'order')}. Customers see Pay now.` : 'Nothing due soon'}</div></div>
    </div>`;

    const openCard = `<section class="card">
      <div class="card-h"><div><h2>Outstanding</h2><div class="sub">Unpaid orders, earliest due first. Credit runs from the booking date ${pin(10)}</div></div></div>
      ${open.length ? `<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Order</th><th>Customer</th><th>Term</th><th>Due date</th><th class="num">Amount</th><th>State ${pin(14)}</th><th></th></tr></thead>
        <tbody>${open.map(o => {
          const st = MI.payState(o, s);
          const due = MI.dueAt(o, s);
          return `<tr class="click${st === 'overdue' ? ' hl' : ''}" data-href="#/order/${o.id}">
            <td class="nowrap"><a class="id" href="#/order/${o.id}">${o.id}</a><span class="sub2">${E(MI.statusLabel(o))}</span></td>
            <td class="name">${customer(o)}</td>
            <td class="nowrap">${E(termOf(o).label)}</td>
            <td class="nowrap"><b class="${st === 'overdue' ? 't-brand' : st === 'due_soon' ? 't-warn' : ''}">${MI.dateLong(due)}</b><span class="sub2">${st === 'overdue' ? `Overdue, due ${relDay(due)}` : relDay(due)}</span></td>
            <td class="num"><b>${MI.inr(MI.amount(o, s))}</b>${o.status !== 'delivered' ? '<span class="sub2">estimate</span>' : ''}</td>
            <td>${payPill(o)}</td>
            <td class="num"><button class="btn ghost sm" data-act="pay" data-id="${o.id}">Mark received</button></td>
          </tr>`;
        }).join('')}</tbody></table></div>` : '<div class="empty">No outstanding payments.</div>'}
    </section>`;

    const paidCard = `<section class="card">
      <div class="card-h"><div><h2>Paid</h2><div class="sub">${plural(paid.length, 'order')}, ${amt(paid)} received</div></div></div>
      ${paid.length ? `<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Order</th><th>Customer</th><th class="num">Amount</th><th>Method</th><th>Paid on</th></tr></thead>
        <tbody>${paid.map(o => `<tr class="click" data-href="#/order/${o.id}">
          <td class="nowrap"><a class="id" href="#/order/${o.id}">${o.id}</a></td>
          <td>${customer(o)}</td>
          <td class="num"><b>${MI.inr(MI.amount(o, s))}</b></td>
          <td>${online(o.payment.method) ? `<span class="pill info">Paid online</span> ${pin(16)}<span class="sub2">${E(o.payment.method)}</span>` : `<span class="pill">Offline</span><span class="sub2">${E(o.payment.method)}</span>`}</td>
          <td class="nowrap">${MI.dateLong(o.payment.paidAt)}<span class="sub2">${MI.time(o.payment.paidAt)}</span></td>
        </tr>`).join('')}</tbody></table></div>` : '<div class="empty">No payments yet.</div>'}
    </section>`;

    return { title: 'Payments', html: `<div class="stack">${kpis}${openCard}${paidCard}</div>` };
  }

  /* =========================================================
     5. Distributors and dealers
     ========================================================= */
  function pUsers(tab) {
    const s = S();
    tab = ['distributors', 'dealers', 'approvals'].includes(tab) ? tab : 'distributors';
    const tabs = [
      ['distributors', 'Distributors', s.distributors.length],
      ['dealers', 'Dealers', s.dealers.length],
      ['approvals', 'Approval queue', s.signups.length],
    ].map(([k, label, n]) => `<a class="tab${k === tab ? ' on' : ''}" href="#/users/${k}" style="text-decoration:none">${label}<span class="c${k === 'approvals' && n ? ' alert' : ''}">${n}</span></a>`).join('');

    let body = '';
    if (tab === 'distributors') {
      body = `<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Distributor</th><th>City</th><th>State</th><th>Phone</th><th class="num">Dealers</th><th class="num">On app</th><th class="num">Orders</th><th class="num">Outstanding</th></tr></thead>
        <tbody>${s.distributors.map(d => {
          const ds = s.dealers.filter(x => x.distributorId === d.id);
          const os = s.orders.filter(o => o.distributorId === d.id);
          return `<tr><td><b>${E(d.name)}</b></td><td>${E(d.city)}</td><td>${E(d.state)}</td><td class="nowrap">${E(d.phone)}</td>
            <td class="num"><b>${ds.length}</b></td><td class="num">${ds.filter(x => x.onApp).length} of ${ds.length}</td>
            <td class="num">${os.length}</td><td class="num">${MI.inr(sum(os.filter(unpaid), o => MI.amount(o, s)))}</td></tr>`;
        }).join('')}</tbody></table></div>`;
    } else if (tab === 'dealers') {
      body = `<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Dealer</th><th>Area</th><th>State</th><th>Distributor</th><th>Phone</th><th>On app</th></tr></thead>
        <tbody>${s.dealers.map(d => `<tr><td><b>${E(d.name)}</b></td><td>${E(d.area)}</td><td>${E(d.state)}</td><td>${E(MI.who(d.distributorId, s))}</td>
          <td class="nowrap">${E(d.phone)}</td><td>${d.onApp ? '<span class="yes">Yes</span>' : '<span class="no">No</span>'}</td></tr>`).join('')}</tbody></table></div>`;
    } else {
      body = `<div class="card-b" style="border-bottom:1px solid var(--line)"><div class="note">These numbers signed up on the app but are not on the uploaded dealer list. Check who they are, pick their distributor and approve, or reject.</div></div>
        ${s.signups.length ? s.signups.map(sg => `<div class="signup">
          <div><b>${E(sg.name)}</b><div class="small muted">${E(sg.area)}, ${E(sg.phone)}</div><div class="small muted">Signed up ${MI.date(sg.at)}, ${MI.time(sg.at)}</div></div>
          <div class="field"><label for="sg-dist-${E(sg.id)}">Distributor</label><select class="input" id="sg-dist-${E(sg.id)}">${s.distributors.map(d => `<option value="${E(d.id)}">${E(d.name)} (${E(d.city)})</option>`).join('')}</select></div>
          <div class="row"><button class="btn ghost sm" data-act="reject" data-id="${E(sg.id)}">Reject</button><button class="btn sm" data-act="approve" data-id="${E(sg.id)}">Approve</button></div>
        </div>`).join('') : '<div class="empty">No signups waiting.</div>'}`;
    }

    return {
      title: 'Distributors and dealers',
      html: `<div class="stack"><section class="card">
        <div class="card-h"><div><h2>Network</h2><div class="sub">${plural(s.distributors.length, 'distributor')}, ${plural(s.dealers.length, 'dealer')}, ${s.dealers.filter(d => d.onApp).length} on the app</div></div>
          <button class="btn soft sm" data-act="upload">${ic('upload', 16)} Upload dealer list</button></div>
        <div class="tabs">${tabs}</div>
        ${body}
      </section></div>`,
    };
  }

  /* =========================================================
     6. Settings
     ========================================================= */
  function pSettings() {
    const s = S();
    const st = s.settings;
    const goa = MI.priceToday(MI.STATES[0], s).value || 0;
    const saved = k => `<span class="saved" data-saved="${k}">${ic('check', 14)} Saved</span>`;
    const terms = `<section class="card">
      <div class="card-h"><div><h2>Payment terms ${pin(1)}</h2><div class="sub">The adjustment is added to the daily price. Use a minus value for a discount.</div></div>${saved('terms')}</div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Term label</th><th>Credit days</th><th>Price adjustment (₹/t)</th><th class="num">Example on ${E(MI.STATES[0])} price</th></tr></thead>
        <tbody>${s.terms.map(t => `<tr>
          <td><input class="input" id="term-${E(t.id)}-label" value="${E(t.label)}" data-term="${E(t.id)}" data-field="label" style="max-width:200px"></td>
          <td><input class="input" id="term-${E(t.id)}-days" type="number" min="0" step="1" value="${t.days}" data-term="${E(t.id)}" data-field="days" style="max-width:110px"></td>
          <td><input class="input" id="term-${E(t.id)}-adj" type="number" step="50" value="${t.adj}" data-term="${E(t.id)}" data-field="adj" style="max-width:140px"></td>
          <td class="num"><b>${MI.inr(goa + t.adj)}/t</b><span class="sub2">${MI.inr(goa)} ${signed(t.adj)}</span></td>
        </tr>`).join('')}</tbody></table></div>
    </section>`;

    const num = (key, label, desc, q, unit, value, attrs) => `<div class="set-row">
      <div><h3>${label} ${pin(q)}</h3><p>${desc}</p></div>
      <div class="set-ctl">${saved(key)}<div class="unit-input"><input class="input" id="set-${key}" type="number" value="${value}" data-set="${key}" ${attrs}><span class="post">${unit}</span></div></div>
    </div>`;
    const rules = `<section class="card">
      <div class="card-h"><div><h2>Ordering rules</h2><div class="sub">Each change saves right away and applies in the app.</div></div></div>
      <div class="set-list">
        ${num('cutoffDays', 'Size split cut-off', 'Days after booking for the customer to add sizes to a lump-sum order.', 11, 'days', st.cutoffDays, 'min="1" step="1"')}
        ${num('reminderDays', 'Payment reminder', 'Days before the due date when the reminder and Pay now prompt appear.', 2, 'days', st.reminderDays, 'min="0" step="1"')}
        ${num('tolerance', 'Delivery tolerance', 'An order counts as delivered when delivered weight is within this share of booked tonnes.', 12, '%', MI.r3(st.tolerance * 100), 'min="0" max="20" step="0.5"')}
        ${num('minOrderT', 'Minimum order', 'Smallest order a distributor or dealer can book.', 15, 'tonnes', st.minOrderT, 'min="0.5" step="0.5"')}
        <div class="set-row">
          <div><h3>Distributor must approve dealer direct orders ${pin(5)}</h3><p>When on, a dealer's direct order waits for his distributor before it reaches Mohit Ispat. When off, the distributor only sees it.</p></div>
          <div class="set-ctl">${saved('distributorApproval')}<label class="switch brand"><input type="checkbox" id="set-distributorApproval" data-toggle="distributorApproval"${st.distributorApproval ? ' checked' : ''}><span class="track"><span class="knob"></span></span><span>${st.distributorApproval ? 'On' : 'Off'}</span></label></div>
        </div>
      </div>
    </section>`;
    return { title: 'Settings', html: `<div class="stack">${terms}${rules}</div>` };
  }

  /* =========================================================
     7. Points to confirm
     ========================================================= */
  const Q_WHERE = {
    1: ['#/settings', 'Settings, payment terms'], 2: ['#/settings', 'Settings, payment reminder'], 3: ['#/order/MI-1038', 'Order dispatch section'],
    4: ['#/order/MI-1038', 'Order dispatch section'], 5: ['#/settings', 'Settings, ordering rules'], 6: ['#/orders', 'Orders, distributor / dealer column'],
    7: ['#/order/MI-1038', 'Combined order, parts per dealer'], 8: ['#/price', 'Daily price'], 9: ['#/price', 'Daily price, size extras'],
    10: ['#/payments', 'Payments, due dates'], 11: ['#/order/MI-1042', 'Lump-sum order MI-1042'], 12: ['#/order/MI-1038', 'Order dispatch, close order'],
    13: ['#/price', 'Daily price'], 14: ['#/payments', 'Payments, overdue'], 15: ['#/settings', 'Settings, minimum order'], 16: ['#/payments', 'Payments, paid online'],
  };
  function pPoints() {
    return {
      title: 'Points to confirm',
      html: `<div class="stack">
        <p class="lead">Open questions for Mohit Ispat. The prototype works on the assumption shown for each. Turn on "Show discussion points" to see the yellow C pins where each one appears.</p>
        <div class="qgrid">${MI.questions.map(q => {
          const w = Q_WHERE[q.n];
          return `<article class="card qcard">
            <div class="q-top"><span class="q-num">C${q.n}</span><h3>${E(q.title)}</h3></div>
            <div class="q-ask">${E(q.ask)}</div>
            <p class="q-assume"><b>Prototype assumption:</b> ${E(q.assume)}</p>
            ${w ? `<a class="q-link" href="${w[0]}">See it: ${E(w[1])} ›</a>` : ''}
          </article>`;
        }).join('')}</div>
      </div>`,
    };
  }

  /* =========================================================
     Events
     ========================================================= */
  const ACTIONS = {
    'sheet-close': () => closeSheet(),
    'sheet-ok': () => { const fn = ui.sheetOk; closeSheet(); if (fn) fn(); },
    reset: () => confirmSheet({
      title: 'Reset demo data?',
      body: 'All orders, prices, users and settings go back to the demo start. The dealer and distributor app resets too.',
      ok: 'Reset demo',
      onOk: () => { ui.splitOpen = {}; act(() => MI.reset(), 'Demo data reset'); },
    }),
    confirm: el => {
      const o = MI.order(el.dataset.id);
      act(() => MI.confirmOrder(o.id), `${o.id} confirmed. ${MI.who(o.by.id)} has been notified.`);
    },
    ready: el => act(() => MI.markReady(el.dataset.id), `${el.dataset.id} is ready for dispatch. Size split locked.`),
    cancel: el => {
      const o = MI.order(el.dataset.id);
      confirmSheet({
        title: `Cancel ${o.id}?`,
        body: `${E(MI.who(o.by.id))} booked ${E(MI.tFmt(o.tonnes))} at ${MI.inr(MI.lockedRate(o))}/t. They get a notification that the order is cancelled.`,
        ok: 'Cancel order', cancel: 'Keep order',
        onOk: () => act(() => MI.cancelOrder(o.id), `${o.id} cancelled`),
      });
    },
    'split-toggle': el => { ui.splitOpen[el.dataset.id] = !ui.splitOpen[el.dataset.id]; ui.keep = false; render(); ui.keep = true; const f = $('[data-split-form]'); if (f) { updateSplitTotal(f); const first = $('[data-size]', f); if (first) first.focus(); } },
    'truck-delivered': el => {
      const id = el.dataset.id;
      const tr = MI.order(id).trucks.find(t => t.id === el.dataset.truck);
      act(() => MI.truckReceived(id, tr.id, 'admin'));
      const o = MI.order(id);
      toast(o.status === 'delivered' ? `Truck ${tr.vehicle} delivered. ${o.id} is now delivered in full.` : `Truck ${tr.vehicle} marked delivered`);
    },
    'close-order': el => {
      const s = S();
      const o = MI.order(el.dataset.id, s);
      const onRoad = o.trucks.filter(t => t.status !== 'delivered');
      const tolPct = `±${MI.r3(s.settings.tolerance * 100)}%`;
      confirmSheet({
        title: `Close ${o.id} as delivered?`,
        body: `<p>Delivered so far: <b>${E(MI.tFmt(MI.deliveredT(o)))}</b> of ${E(MI.tFmt(o.tonnes))} booked.${onRoad.length ? ` ${plural(onRoad.length, 'truck')} on the road will be marked delivered.` : ''}</p>
          <div class="note">Orders close by themselves when delivered weight is within ${tolPct} of booked tonnes. Use this when the customer accepts a short or extra delivery. The bill uses actual loaded weight, ${E(MI.tFmt(MI.dispatchedT(o)))}.</div>`,
        ok: 'Close order',
        onOk: () => act(() => MI.closeOrder(o.id), `${o.id} closed as delivered`),
      });
    },
    pay: el => {
      const o = MI.order(el.dataset.id);
      confirmSheet({
        title: `Mark payment received for ${o.id}?`,
        body: `<p><b>${MI.inr(MI.amount(o))}</b> from ${E(MI.who(o.by.id))}, received outside the app (bank transfer, cheque or cash).</p>`,
        ok: 'Mark received',
        onOk: () => act(() => MI.pay(o.id, 'Offline (marked by admin)'), `Payment for ${o.id} marked received`),
      });
    },
    approve: el => {
      const s = S();
      const sg = s.signups.find(x => x.id === el.dataset.id);
      const sel = document.getElementById(`sg-dist-${sg.id}`);
      const did = sel ? sel.value : s.distributors[0].id;
      act(() => MI.approveSignup(sg.id, did), `${sg.name} approved and added under ${MI.who(did)}`);
    },
    reject: el => {
      const sg = S().signups.find(x => x.id === el.dataset.id);
      confirmSheet({
        title: `Reject ${E(sg.name)}?`,
        body: 'The number is removed from the queue and cannot order on the app.',
        ok: 'Reject signup',
        onOk: () => act(() => MI.rejectSignup(sg.id), `${sg.name} rejected`),
      });
    },
    upload: () => openSheet(`<h3>Upload dealer list</h3>
      <p class="sheet-text">Upload a CSV file with one dealer per row. Dealers on the list can sign in with their phone number straight away. Other numbers go to the approval queue.</p>
      <pre class="csv">name,phone,area,distributor
Shree Ganesh Hardware,+91 98221 55667,Navelim,Sai Steel Distributors
Mapusa Hardware Mart,+91 98227 66120,Mapusa,Coastal Steel Agencies
Tilakwadi Steel Point,+91 94481 23098,Belagavi,Belgaum Steel Traders</pre>
      <div class="drop">${ic('upload', 20)}<div><b>dealers-october.csv</b> selected (demo file, 12 rows)</div></div>
      <div class="sheet-actions"><button class="btn ghost sm" data-act="sheet-close">Cancel</button><button class="btn sm" data-act="upload-go" data-autofocus>Upload</button></div>`, true),
    'upload-go': () => { closeSheet(); toast('12 dealers imported (demo)'); },
  };

  document.addEventListener('click', e => {
    const pinEl = e.target.closest('.qpin');
    if (pinEl) { e.preventDefault(); e.stopPropagation(); openPin(pinEl.dataset.q); return; }
    if (e.target === $('#sheet')) { closeSheet(); return; }
    const a = e.target.closest('[data-act]');
    if (a && ACTIONS[a.dataset.act]) {
      if (a.tagName !== 'A') e.preventDefault();
      ACTIONS[a.dataset.act](a);
      return;
    }
    const row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a, button, input, select, label')) location.hash = row.dataset.href;
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sheet').classList.contains('open')) closeSheet(); });

  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    FORMS[f.dataset.form](f);
  });

  const FORMS = {
    publish: f => {
      const st = f.dataset.state;
      const input = f.querySelector('input');
      const err = document.getElementById(`price-err-${st}`);
      const v = Math.round(+input.value);
      if (!input.value || !(v >= 10000 && v <= 200000)) { err.textContent = 'Enter a price per tonne, for example 55200.'; input.focus(); return; }
      err.textContent = '';
      const cur = MI.priceToday(st);
      const d = cur.value ? v - cur.value : 0;
      confirmSheet({
        title: `Publish today's price for ${E(st)}?`,
        body: `<div class="price-big" style="margin:6px 0 4px">${MI.inr(v)}<small>/t</small></div>
          <p>${cur.value ? (d ? `${signed(d)} vs current ${MI.inr(cur.value)}` : `Same as current ${MI.inr(cur.value)}`) : ''}</p>
          <div class="note">All distributors and dealers get a notification. New orders in ${E(st)} book at this price.</div>
          ${cur.isToday ? '<div class="note warn">A price is already published today. This one replaces it for new orders. Booked orders keep their price.</div>' : ''}`,
        ok: 'Publish and notify',
        onOk: () => act(() => MI.publishPrice(st, v), `${st} price published: ${MI.inr(v)}/t. Everyone notified.`),
      });
    },
    split: f => {
      const id = f.dataset.id;
      const tonnes = +f.dataset.tonnes;
      const split = Object.fromEntries(MI.SIZES.map(k => [k, MI.r3(Math.max(0, +(f.querySelector(`[data-size="${k}"]`).value) || 0))]));
      const total = MI.splitTotal(split);
      const err = $('[data-split-err]', f);
      if (!total) { err.textContent = 'Enter tonnes for at least one size.'; return; }
      if (total > tonnes + 1e-9) { err.textContent = `Total ${MI.tFmt(total)} is more than the ${MI.tFmt(tonnes)} booked.`; return; }
      ui.splitOpen[id] = false;
      const left = MI.r3(tonnes - total);
      act(() => MI.saveSplit(id, split), left > 0 ? `Split saved. ${MI.tFmt(left)} still to assign.` : `Size split saved for ${id}. You can now mark it ready.`);
    },
    truck: f => {
      const id = f.dataset.id;
      const o = MI.order(id);
      const val = k => document.getElementById(`tr-${k}-${id}`).value.trim();
      const err = document.getElementById(`tr-err-${id}`);
      const vehicle = val('veh').toUpperCase().replace(/\s+/g, ' ');
      const driver = val('drv');
      const w = +val('wt');
      const etaStr = val('eta');
      const msg =
        vehicle.length < 4 ? 'Enter the vehicle number.'
          : driver.replace(/\D/g, '').length < 10 ? 'Enter the driver phone, 10 digits.'
            : !(w > 0) ? 'Enter the actual loaded weight in tonnes.'
              : w > 40 ? 'One truck carries 40 t at most. Check the weight.'
                : !/^\d{4}-\d{2}-\d{2}$/.test(etaStr) ? 'Pick the expected delivery date.'
                  : '';
      if (msg) { err.textContent = msg; return; }
      const [y, m, d] = etaStr.split('-').map(Number);
      const eta = new Date(y, m - 1, d, 10).getTime();
      if (day0(eta) < MI.today0()) { err.textContent = 'Expected delivery cannot be in the past.'; return; }
      err.textContent = '';
      act(() => MI.addTruck(o.id, { vehicle, driver, weightT: w, eta }), `Truck ${vehicle} dispatched with ${MI.tFmt(w)}. Customer notified.`);
    },
  };

  document.addEventListener('input', e => {
    const f = e.target.closest('[data-split-form]');
    if (f) { updateSplitTotal(f); const er = $('[data-split-err]', f); if (er) er.textContent = ''; }
  });

  function flashSaved(key) { ui.saved[key] = Date.now(); }
  // Save after the browser moves focus, so Tab lands on the next field after the re-render
  const later = fn => setTimeout(fn, 0);
  function invalid(msg) { toast(msg); ui.keep = false; render(); ui.keep = true; }

  document.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'presenterToggle') { setPresenter(el.checked); return; }
    if (el.dataset.set) {
      const key = el.dataset.set;
      const v = +el.value;
      const rules = {
        cutoffDays: [1, 60, true], reminderDays: [0, 30, true], tolerance: [0, 20, false], minOrderT: [0.5, 100, false],
      }[key];
      if (el.value === '' || !(v >= rules[0] && v <= rules[1]) || (rules[2] && !Number.isInteger(v))) return invalid(`Enter a value from ${rules[0]} to ${rules[1]}`);
      flashSaved(key);
      later(() => act(() => MI.commit(s => { s.settings[key] = key === 'tolerance' ? MI.r3(v / 100) : v; })));
      return;
    }
    if (el.dataset.toggle) {
      const key = el.dataset.toggle;
      flashSaved(key);
      act(() => MI.commit(s => { s.settings[key] = el.checked; }), el.checked ? 'Distributors now approve direct dealer orders' : 'Direct dealer orders go straight to Mohit Ispat');
      return;
    }
    if (el.dataset.term) {
      const { term: tid, field } = el.dataset;
      let v = el.value.trim();
      if (field === 'label') { if (!v) return invalid('Enter a term label'); } else {
        v = +v;
        if (el.value === '' || !Number.isFinite(v) || !Number.isInteger(v)) return invalid('Enter a whole number');
        if (field === 'days' && (v < 0 || v > 180)) return invalid('Credit days must be from 0 to 180');
        if (field === 'adj' && Math.abs(v) > 10000) return invalid('Adjustment must be within ₹10,000/t');
      }
      flashSaved('terms');
      later(() => act(() => MI.commit(s => { const t = s.terms.find(x => x.id === tid); if (t) t[field] = v; })));
      return;
    }
    if (el.dataset.extra) {
      const k = el.dataset.extra;
      const v = el.value === '' ? 0 : +el.value;
      if (!Number.isFinite(v) || v < 0 || v > 20000) return invalid('Size extra must be from ₹0 to ₹20,000/t');
      flashSaved('extras');
      later(() => act(() => MI.commit(s => { s.settings.sizeExtra = s.settings.sizeExtra || {}; s.settings.sizeExtra[k] = v; })));
    }
  });

  window.addEventListener('mi:state', render);
  window.addEventListener('hashchange', () => { closeSheet(); render(); });

  setPresenter(readPresenter());
  if (!location.hash) history.replaceState(null, '', '#/dashboard');
  render();
})();
