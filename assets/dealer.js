/* Kamdhenu App prototype: dealer app (signed in as the demo dealer) */
(() => {
  const app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => KD.load();
  const commit = fn => { const s = S(); fn(s); KD.save(s); };
  const ME = KD.dealer(KD.DEMO_DEALER);

  // UI-only state (not persisted)
  const ui = { weights: {}, vehicle: 'GA 08 T 4521', ewb: '', otp: '', photo: false, seen: new Set() };

  /* ---------- icons ---------- */
  const ic = {
    back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    list: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    wallet: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/></svg>',
    store: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/></svg>',
    phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    camera: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    check: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    pin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  };

  /* ---------- discussion pins ---------- */
  const q = (...ns) => `<span class="qpins">${ns.map(n => `<button class="qpin" data-act="q" data-n="${n}" title="Discussion point ${n}">Q${n}</button>`).join('')}</span>`;
  const screenQs = {
    login: { name: 'Sign in', qs: [9, 12] },
    otp: { name: 'Verify OTP', qs: [9] },
    orders: { name: 'Orders', qs: [6, 9] },
    ship: { name: 'Order detail', qs: [1, 4, 7, 8] },
    payouts: { name: 'Payouts', qs: [13, 3] },
    store: { name: 'Store settings', qs: [9, 10, 12] },
  };

  function renderNotes(key) {
    const meta = screenQs[key] || { name: '', qs: [] };
    document.getElementById('screenName').textContent = meta.name;
    document.getElementById('notesBody').innerHTML = meta.qs.length
      ? meta.qs.map(n => {
          const x = KD.questions.find(x => x.n === n);
          return `<div class="q-item"><b><span class="qnum">Q${n}</span>${esc(x.title)}</b><p>${esc(x.answer)}</p><p class="ask">${esc(x.ask)}</p></div>`;
        }).join('')
      : '<p class="small muted">Nothing to confirm on this screen.</p>';
  }

  function openQ(n) {
    const x = KD.questions.find(x => x.n === +n);
    document.getElementById('qsheetBody').innerHTML = `
      <div class="q-label">Discussion point Q${x.n}</div>
      <h3>${esc(x.title)}</h3>
      <p><b>Proposed:</b> ${esc(x.answer)}</p>
      <div class="q-ask"><b>To confirm:</b> ${esc(x.ask)}</div>
      <button class="btn block" style="margin-top:16px" data-act="closeq">Got it</button>`;
    document.getElementById('qsheet').classList.add('open');
  }

  function syncPresenter() {
    const on = !!S().presenter;
    document.body.classList.toggle('presenter', on);
    document.getElementById('presenterSwitch').classList.toggle('on', on);
    document.getElementById('notes').style.display = on ? '' : 'none';
  }

  /* ---------- helpers ---------- */
  const go = hash => { location.hash = hash; };
  const route = () => {
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
    return { view: parts[0] || '', arg: parts[1] };
  };
  const isOnline = () => KD.online(ME);

  function toast(msg) {
    let t = app.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; app.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toast.tm);
    toast.tm = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function psheet(html) {
    let b = app.querySelector('.psheet-backdrop');
    if (!b) { b = document.createElement('div'); b.className = 'psheet-backdrop'; app.appendChild(b); }
    b.innerHTML = `<div class="psheet"><div class="grab"></div>${html}</div>`;
    b.classList.add('open');
  }
  const closeSheet = () => { const b = app.querySelector('.psheet-backdrop'); if (b) b.classList.remove('open'); };

  const topbar = (title, back, extra = '') => `
    <div class="topbar">
      ${back ? `<button class="iconbtn" data-act="go" data-to="${back}" aria-label="Back">${ic.back}</button>` : ''}
      <h2>${title}</h2>${extra}
    </div>`;

  const nav = active => `
    <nav class="bottomnav" style="grid-template-columns:repeat(3,1fr)">
      <button class="${active === 'orders' ? 'on' : ''}" data-act="go" data-to="#/orders">${ic.list}Orders${offers().length ? `<span class="badge">${offers().length}</span>` : ''}</button>
      <button class="${active === 'payouts' ? 'on' : ''}" data-act="go" data-to="#/payouts">${ic.wallet}Payouts</button>
      <button class="${active === 'store' ? 'on' : ''}" data-act="go" data-to="#/store">${ic.store}Store</button>
    </nav>`;

  // Shipments offered to me right now, and shipments I have taken
  const offers = () => {
    const out = [];
    S().orders.forEach(o => o.shipments.forEach(sh => {
      const f = sh.status === 'routing' && sh.offers.find(x => x.result === 'pending' && x.dealerId === ME.id);
      if (f) out.push({ o, sh, f });
    }));
    return out;
  };
  const mine = statuses => {
    const out = [];
    S().orders.forEach(o => o.shipments.forEach(sh => {
      if (sh.dealerId === ME.id && statuses.includes(sh.status)) out.push({ o, sh });
    }));
    return out;
  };
  const itemsText = (o, sh) => sh.lines.map(i => `${o.lines[i].label} ${KD.variant(o.lines[i].variantId).product.short}`).join(', ');
  const qtyText = (o, sh) => {
    const sum = unit => KD.roundQty(sh.lines.filter(i => o.lines[i].unit === unit).reduce((a, i) => a + o.lines[i].qty, 0), unit);
    return ['t', 'kg', 'bag'].filter(u => sum(u)).map(u => KD.qtyFmt(sum(u), u)).join(' + ');
  };
  const left = f => Math.max(0, KD.ACCEPT_MIN * 60000 - (Date.now() - f.at));
  const mmss = ms => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
  const firstName = n => String(n || '').split(' ')[0];

  /* ---------- screens ---------- */
  function vLogin() {
    return `<div class="screen">
      <div class="login-hero dealer">
        <div class="wordmark"><span class="mark">K</span><span>Kamdhenu Partner<small>For Kamdhenu dealers</small></span></div>
        <h1>New orders from customers near your shop.</h1>
        <p>Accept, deliver and get paid to your bank account. No chasing payments.</p>
        <div class="trust"><div>Prepaid orders only</div><div>Payout 24 h after delivery</div><div>Kamdhenu brand demand</div></div>
      </div>
      <div class="pad">
        <div class="field"><label>Registered mobile number</label>
          <div class="phone-input"><span>+91</span><input inputmode="numeric" value="98221 55667"></div>
        </div>
        <button class="btn block lg" data-act="go" data-to="#/otp">Get OTP</button>
        <div class="field" style="margin-top:18px"><label>Language ${q(12)}</label>
          <div class="chips"><button class="chip on">English</button><button class="chip" disabled>ಕನ್ನಡ</button><button class="chip" disabled>हिंदी</button><button class="chip" disabled>कोंकणी</button></div>
        </div>
        <p class="small muted" style="text-align:center;margin-top:18px">New dealer? Your Mohit Ispat sales officer will register you. ${q(9)}</p>
      </div>
    </div>`;
  }

  function vOtp() {
    return `${topbar('Verify your number', '#/login')}
    <div class="screen pad">
      <p class="muted">Enter the 4-digit code sent to +91 98221 55667</p>
      <div class="otp"><input value="7" maxlength="1"><input value="3" maxlength="1"><input value="0" maxlength="1"><input value="9" maxlength="1"></div>
      <button class="btn block lg" data-act="signin">Verify and continue</button>
    </div>`;
  }

  function offerCard({ o, sh, f }) {
    const t = sh.quote;
    return `<div class="card offer">
      <div class="offer-head"><b><span class="dot"></span>New order request</b><span class="cd" data-cd="${f.at}">${mmss(left(f))}</span></div>
      <div class="offer-body">
        <div class="row between small"><span class="row" style="gap:4px">${ic.pin}${esc(o.site.area)} · ${sh.km} km away</span><span class="muted">${sh.id}</span></div>
        <div class="offer-items">${sh.lines.map(i => `<div><span>${esc(o.lines[i].label)} ${esc(KD.variant(o.lines[i].variantId).product.short)}</span><b>${KD.qtyFmt(o.lines[i].qty, o.lines[i].unit)}</b></div>`).join('')}</div>
        <div class="earn"><span class="small">Order value<br>incl. GST and ${KD.inr(t.delivery)} delivery</span><b>${KD.inr(t.material + t.gst + t.delivery)}</b></div>
        <p class="small muted">Prepaid. Customer details are shared once you accept. ${q(6)}</p>
        <div class="offer-actions">
          <button class="btn ghost" data-act="decline" data-s="${sh.id}">Decline</button>
          <button class="btn good" data-act="accept" data-s="${sh.id}">Accept</button>
        </div>
      </div>
    </div>`;
  }

  function jobRow({ o, sh }) {
    const tag = {
      accepted: ['To dispatch', 'pill info'], dispatched: ['On the way', 'pill brand'],
      delivered: sh.issue && sh.issue.status === 'open' ? ['Payout on hold', 'pill warn'] : ['Payout in 24 h', 'pill good'],
      settled: ['Paid', 'pill good'],
    }[sh.status];
    return `<button class="jobrow" data-act="go" data-to="#/ship/${sh.id}">
      <span class="ic">${sh.lines.some(i => KD.productOf(o.lines[i]) === 'tmt') ? 'TMT' : sh.lines.some(i => KD.productOf(o.lines[i]) === 'wire') ? 'BW' : 'NL'}</span>
      <div class="grow"><b class="small">${esc(firstName(o.user && o.user.name))} · ${esc(o.site.area)}</b><div class="small muted">${qtyText(o, sh)} · ${sh.id}</div></div>
      <span class="${tag[1]}">${tag[0]}</span>
    </button>`;
  }

  function vOrders() {
    const offs = offers();
    const todo = mine(['accepted']);
    const road = mine(['dispatched']);
    const done = mine(['delivered', 'settled']);
    const on = isOnline();
    return `<div class="screen">
      <div class="dhead">
        <div class="row between">
          <div class="who"><b>${esc(ME.name)}</b><span>${esc(ME.area)} · Kamdhenu dealer</span></div>
          <div class="online">${on ? 'Online' : 'Offline'}<button class="switch ${on ? 'on' : ''}" data-act="online" aria-label="Accepting orders"></button></div>
        </div>
        <div class="stats">
          <div><b>${offs.length}</b><span>New requests</span></div>
          <div><b>${todo.length}</b><span>To dispatch</span></div>
          <div><b>${road.length}</b><span>On the way</span></div>
        </div>
      </div>
      <div class="pad">
        ${on ? '' : `<div class="note warn" style="margin-bottom:12px"><span>!</span><span>You are offline. New orders go to the next nearest dealer. ${q(9)}</span></div>`}
        <div class="section-title" style="margin-top:4px">New requests ${q(6)}</div>
        ${offs.length ? offs.map(offerCard).join('') : `<div class="card pad small" style="text-align:center">
          <b>No new requests</b>
          <p class="muted" style="margin:4px 0 12px">You get an SMS and WhatsApp alert as soon as an order comes in near your shop.</p>
          <button class="btn demo sm" data-act="demoOrder" ${on ? '' : 'disabled'}>Demo: receive a test order</button>
        </div>`}
        ${todo.length || road.length ? `<div class="section-title">In progress</div><div class="card">${[...todo, ...road].map(jobRow).join('')}</div>` : ''}
        ${done.length ? `<div class="section-title">Delivered</div><div class="card">${done.map(jobRow).join('')}</div>` : ''}
      </div>
    </div>${nav('orders')}`;
  }

  function invoicePreview(o, sh, actual) {
    const t = KD.totals(o.lines, sh.lines, sh.km, actual);
    return `<div class="sum" style="padding:0">
      <div><span>Taxable value</span><span>${KD.inr2(t.material)}</span></div>
      <div><span>CGST 9% + SGST 9%</span><span>${KD.inr2(t.gst)}</span></div>
      <div><span>Delivery charges</span><span>${KD.inr2(t.delivery)}</span></div>
      <div class="total" style="font-size:15px"><span>Invoice total</span><span>${KD.inr2(t.total)}</span></div>
    </div>`;
  }

  function weightsFor(o, sh) {
    if (!ui.weights[sh.id]) {
      ui.weights[sh.id] = {};
      sh.lines.forEach(i => { ui.weights[sh.id][i] = o.lines[i].qty; });
    }
    return ui.weights[sh.id];
  }
  const overLimit = (o, sh, w) => sh.lines.filter(i => o.lines[i].unit !== 'bag' && +w[i] > KD.maxQty(o.lines[i]));

  function vShip(id) {
    const { o, sh } = KD.find(S(), id);
    if (!o || sh.dealerId !== ME.id) return `${topbar('Order', '#/orders')}<div class="screen pad">This order is not assigned to you.</div>${nav('orders')}`;
    let action = '';
    if (sh.status === 'accepted') {
      const w = weightsFor(o, sh);
      const bad = overLimit(o, sh, w);
      const needEwb = sh.quote.total > 50000;
      action = `<div class="section-title">Load and dispatch ${q(1, 4)}</div>
      <div class="card pad">
        <p class="small muted" style="margin-bottom:10px">Enter the weighbridge weight for each item: TMT in tonnes (for example 1.206), binding wire in kg. The customer is billed on this weight.</p>
        ${sh.lines.map(i => {
          const l = o.lines[i];
          const isBad = bad.includes(i);
          return `<div class="wline">
            <div><b class="small">${esc(l.label)} ${esc(KD.variant(l.variantId).product.short)}</b><div class="small muted">Ordered ${KD.qtyFmt(l.qty, l.unit)}${l.unit !== 'bag' ? ` · paid up to ${KD.qtyFmt(KD.maxQty(l), l.unit)}` : ''}</div></div>
            ${l.unit !== 'bag'
              ? `<input class="input ${isBad ? 'bad' : ''}" data-w="${i}" data-s="${sh.id}" inputmode="decimal" value="${w[i]}">`
              : `<div style="text-align:right"><b>${KD.qtyFmt(l.qty, 'bag')}</b></div>`}
            <div class="err" data-err="${i}">${isBad ? `Above what the customer paid for. Load at most ${KD.qtyFmt(KD.maxQty(l), l.unit)}.` : ''}</div>
          </div>`;
        }).join('')}
        <div class="hr"></div>
        <div class="field"><label>Vehicle number</label><input class="input" data-f="vehicle" value="${esc(ui.vehicle)}"></div>
        ${needEwb ? `<div class="field"><label>E-way bill number (required above ₹50,000)</label><input class="input" data-f="ewb" placeholder="12-digit EWB number" value="${esc(ui.ewb)}"></div>` : ''}
        <div class="hr"></div>
        <div class="row between" style="margin-bottom:8px"><b class="small">Invoice preview, issued in your name</b><span class="small muted">GSTIN ${ME.gstin}</span></div>
        <div id="invPrev">${invoicePreview(o, sh, w)}</div>
        <button class="btn block lg" style="margin-top:14px" data-act="dispatch" data-s="${sh.id}" id="dispatchBtn" ${bad.length || (needEwb && !ui.ewb.trim()) ? 'disabled' : ''}>Confirm invoice and dispatch</button>
        ${needEwb ? `<button class="btn demo sm block" style="margin-top:8px" data-act="fillEwb">Demo: fill e-way bill</button>` : ''}
      </div>`;
    } else if (sh.status === 'dispatched') {
      const ok = ui.otp === sh.otp && ui.photo;
      action = `<div class="section-title">Hand over at site ${q(7)}</div>
      <div class="card pad">
        <div class="field"><label>Delivery OTP from customer or site contact</label>
          <input class="input" data-f="otp" inputmode="numeric" maxlength="4" placeholder="4-digit OTP" value="${esc(ui.otp)}" style="font-size:20px;letter-spacing:8px;text-align:center;font-weight:800">
          ${ui.otp.length === 4 && ui.otp !== sh.otp ? '<span class="small" style="color:var(--brand)">That OTP does not match. Ask the customer to check their SMS.</span>' : ''}
        </div>
        <button class="photo ${ui.photo ? 'done' : ''}" data-act="photo"><span class="thumb">${ui.photo ? ic.check : ic.camera}</span><span><b class="small">${ui.photo ? 'Site photo added' : 'Add site photo'}</b><br><span class="small muted">Material unloaded at site</span></span></button>
        <button class="btn block lg good" style="margin-top:14px" data-act="deliver" data-s="${sh.id}" id="deliverBtn" ${ok ? '' : 'disabled'}>Confirm delivery</button>
        <button class="btn demo sm block" style="margin-top:8px" data-act="fillOtp" data-s="${sh.id}">Demo: customer shares OTP ${sh.otp}</button>
      </div>`;
    } else {
      const p = KD.payout(sh);
      const hold = sh.issue && sh.issue.status === 'open';
      action = `<div class="section-title">Payout ${q(13, 3)}</div>
      <div class="card pad">
        <div class="sum" style="padding:0">
          <div><span>Invoice total (customer paid)</span><span>${KD.inr(p.gross)}</span></div>
          <div><span>Payment gateway charges (2%)</span><span>− ${KD.inr(p.fee)}</span></div>
          <div class="total"><span>Your payout</span><span>${KD.inr(p.net)}</span></div>
        </div>
        ${sh.status === 'settled'
          ? `<div class="note good" style="margin-top:10px"><span>✓</span><span>Paid to your bank account on ${KD.date(sh.settledAt)}.</span></div>`
          : hold
            ? `<div class="note warn" style="margin-top:10px"><span>!</span><span>On hold. The customer reported: ${esc(sh.issue.type)}. Mohit Ispat will call you to resolve it. ${q(8)}</span></div>`
            : `<div class="note" style="margin-top:10px"><span>ℹ</span><span>Releases 24 hours after delivery if the customer raises no issue.</span></div>
               <button class="btn demo sm block" style="margin-top:8px" data-act="settle" data-s="${sh.id}">Demo: 24 hours pass</button>`}
      </div>`;
    }
    const pill = { accepted: '<span class="pill info">To dispatch</span>', dispatched: '<span class="pill brand">On the way</span>', delivered: '<span class="pill good">Delivered</span>', settled: '<span class="pill good">Paid</span>' }[sh.status];
    return `${topbar(sh.id, '#/orders', pill)}
    <div class="screen pad">
      <div class="card pad">
        <div class="contact"><div><b>${esc(o.user ? o.user.name : '')}</b><div class="small muted">Customer · ${esc(o.user ? o.user.phone : '')}</div></div><button class="callbtn" data-act="toast" data-msg="Calls go through a masked number in the live app" aria-label="Call customer">${ic.phone}</button></div>
        <div class="hr"></div>
        <div class="contact"><div><b class="small">Site contact</b><div class="small muted">${esc(o.site.contact)} · ${esc(o.site.contactPhone)}</div></div><button class="callbtn" data-act="toast" data-msg="Calls go through a masked number in the live app" aria-label="Call site contact">${ic.phone}</button></div>
        <div class="hr"></div>
        <b class="small">Deliver to</b>
        <p class="small muted">${esc(o.site.addr)}, ${esc(o.site.area)} ${o.site.pincode || ''} · ${sh.km} km</p>
        <button class="btn ghost sm" style="margin-top:8px" data-act="toast" data-msg="Opens Google Maps directions in the live app">${ic.pin} Directions</button>
      </div>
      ${sh.status !== 'accepted' && sh.actual ? `<div class="section-title">Loaded weight</div>
      <div class="card pad"><table class="wtable"><thead><tr><th>Item</th><th>Ordered</th><th>Loaded</th></tr></thead><tbody>
        ${sh.lines.map(i => `<tr><td>${esc(o.lines[i].label)} ${esc(KD.variant(o.lines[i].variantId).product.short)}</td><td>${KD.qtyFmt(o.lines[i].qty, o.lines[i].unit)}</td><td><b>${KD.qtyFmt(sh.actual[i], o.lines[i].unit)}</b></td></tr>`).join('')}
      </tbody></table>${sh.vehicle ? `<p class="small muted" style="margin-top:8px">Vehicle ${esc(sh.vehicle)}${sh.ewb ? ` · E-way bill ${esc(sh.ewb)}` : ''}</p>` : ''}</div>` : ''}
      ${action}
      <div class="section-title">Activity</div>
      <div class="card pad timeline">${sh.log.slice().reverse().map(e => `<div><span>${KD.time(e.t)}</span><p>${esc(e.text)}</p></div>`).join('')}</div>
    </div>${nav('orders')}`;
  }

  function vPayouts() {
    const rows = mine(['delivered', 'settled']);
    const pending = rows.filter(r => r.sh.status === 'delivered').reduce((a, r) => a + KD.payout(r.sh).net, 0);
    const paid = rows.filter(r => r.sh.status === 'settled').reduce((a, r) => a + KD.payout(r.sh).net, 0);
    return `${topbar('Payouts', '#/orders')}
    <div class="screen pad">
      <div class="paytop">
        <div><span>Releasing soon</span><b>${KD.inr(pending)}</b></div>
        <div><span>Paid this month</span><b>${KD.inr(paid)}</b></div>
      </div>
      <p class="small muted" style="margin:10px 2px">Paid to HDFC Bank ···· 4417. Payouts release 24 hours after delivery. ${q(3)}</p>
      <div class="section-title">Orders ${q(13)}</div>
      ${rows.length ? `<div class="card">${rows.map(({ o, sh }) => {
        const p = KD.payout(sh);
        const hold = sh.issue && sh.issue.status === 'open';
        return `<button class="payrow" style="border-left:0;border-right:0;border-bottom:0;background:#fff;width:100%;text-align:left" data-act="go" data-to="#/ship/${sh.id}">
          <div class="row between"><b class="small">${sh.id} · ${esc(firstName(o.user && o.user.name))}</b><b>${KD.inr(p.net)}</b></div>
          <div class="split"><span>Invoice ${KD.inr(p.gross)} · gateway − ${KD.inr(p.fee)}</span>${sh.status === 'settled' ? '<span class="pill good">Paid</span>' : hold ? '<span class="pill warn">On hold</span>' : '<span class="pill info">In 24 h</span>'}</div>
        </button>`;
      }).join('')}</div>` : '<div class="card pad small muted" style="text-align:center">Payouts for delivered orders show here.</div>'}
      <div class="note" style="margin-top:12px"><span>ℹ</span><span>Tax deductions (GST TCS and income tax TDS), if they apply, will be shown here once confirmed. ${q(3)}</span></div>
    </div>${nav('payouts')}`;
  }

  // Simple deterministic QR-style pattern for the shop counter poster
  function qrSvg() {
    const n = 25, cells = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#1b2129"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#1b2129"/>`;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > 0.52) cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#1b2129"/>`);
    return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/>${cells.join('')}${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}<rect x="10" y="10" width="5" height="5" fill="#b3121b"/></svg>`;
  }

  function vStore() {
    const s = S();
    const st = KD.stocks(ME, s);
    const on = isOnline();
    return `${topbar('Store', '#/orders')}
    <div class="screen pad">
      <div class="card">
        <div class="tog"><div><b>Accepting orders</b><div class="small muted">Turn off on holidays or when you have no vehicle</div></div><button class="switch ${on ? 'on' : ''}" data-act="online" aria-label="Accepting orders"></button></div>
        <div class="tog"><div><b>Business hours</b><div class="small muted">Orders outside these hours wait for the morning</div></div><span class="small">9:00 AM to 7:00 PM</span></div>
      </div>
      <div class="section-title">Products you stock ${q(9)}</div>
      <div class="card">
        ${KD.products.map(p => `<div class="tog"><div><b>${p.short}</b><div class="small muted">${p.variants.map(v => v.label).join(', ')}</div></div><button class="switch ${st.includes(p.id) ? 'on' : ''}" data-act="stock" data-p="${p.id}" aria-label="Stock ${p.short}"></button></div>`).join('')}
      </div>
      <p class="small muted" style="margin:8px 2px 0">You only get orders for products you stock. Kamdhenu TMT prices are set by Mohit Ispat for your zone.</p>
      <div class="section-title">Counter QR code ${q(10)}</div>
      <div class="card">
        <div class="qr">${qrSvg()}<b style="margin-top:10px">Scan to order Kamdhenu steel</b><span class="small muted">Print and keep at your counter</span></div>
        <div style="padding:0 14px 14px"><button class="btn ghost block sm" data-act="toast" data-msg="Downloads a printable A5 poster in the live app">Download poster</button></div>
      </div>
      <div class="section-title">Account</div>
      <div class="card">
        <div class="listrow"><div class="grow small"><b>GSTIN</b><div class="muted">${ME.gstin}</div></div></div>
        <div class="listrow"><div class="grow small"><b>Payout account</b><div class="muted">HDFC Bank ···· 4417</div></div></div>
        <div class="listrow"><div class="grow small"><b>Language</b> ${q(12)}<div class="muted">English</div></div></div>
        <div class="listrow"><div class="grow small"><b>Dealer support</b><div class="muted">Mohit Ispat sales office, Margao</div></div></div>
      </div>
      <button class="btn ghost block" style="margin-top:16px" data-act="signout">Sign out</button>
    </div>${nav('store')}`;
  }

  /* ---------- render ---------- */
  function render() {
    const s = S();
    let { view, arg } = route();
    if (!s.dealerSignedIn && !['login', 'otp'].includes(view)) view = 'login';
    else if (s.dealerSignedIn && ['login', 'otp', ''].includes(view)) view = 'orders';
    const views = { login: vLogin, otp: vOtp, orders: vOrders, ship: () => vShip(arg), payouts: vPayouts, store: vStore };
    const sameView = render.last === view + '/' + arg;
    const keep = app.querySelector('.screen');
    const scroll = sameView && keep ? keep.scrollTop : 0;
    const focused = document.activeElement && app.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = focused && (focused.dataset.w != null ? `[data-w="${focused.dataset.w}"]` : focused.dataset.f ? `[data-f="${focused.dataset.f}"]` : null);
    const keepers = sameView ? [...app.querySelectorAll('.psheet-backdrop.open, .toast')] : [];
    app.innerHTML = (views[view] || vOrders)();
    keepers.forEach(k => app.appendChild(k));
    const scr = app.querySelector('.screen');
    if (scr) scr.scrollTop = scroll;
    if (sameView && focusKey) {
      const el = app.querySelector(focusKey);
      if (el) { el.focus(); const v = el.value; el.value = ''; el.value = v; }
    }
    render.last = view + '/' + arg;
    renderNotes(view);
    syncPresenter();
    announceOffers(s);
  }

  // Alert once for each new request that reaches this dealer
  function announceOffers(s) {
    if (!s.dealerSignedIn) return;
    offers().forEach(({ f, sh }) => {
      const key = sh.id + f.at;
      if (ui.seen.has(key)) return;
      ui.seen.add(key);
      if (route().view !== 'orders') toast(`New order request ${sh.id}. Open Orders to accept.`);
    });
  }

  function refreshInvoice(shipId) {
    const { o, sh } = KD.find(S(), shipId);
    if (!sh) return;
    const w = weightsFor(o, sh);
    const bad = overLimit(o, sh, w);
    const prev = document.getElementById('invPrev');
    if (prev) prev.innerHTML = invoicePreview(o, sh, w);
    sh.lines.forEach(i => {
      const el = app.querySelector(`[data-w="${i}"]`);
      if (el) el.classList.toggle('bad', bad.includes(i));
      const err = app.querySelector(`[data-err="${i}"]`);
      if (err) err.textContent = bad.includes(i) ? `Above what the customer paid for. Load at most ${KD.qtyFmt(KD.maxQty(o.lines[i]), o.lines[i].unit)}.` : '';
    });
    const btn = document.getElementById('dispatchBtn');
    if (btn) btn.disabled = bad.length > 0 || (sh.quote.total > 50000 && !ui.ewb.trim());
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) {
      if (e.target.classList.contains('psheet-backdrop')) closeSheet();
      if (e.target.id === 'qsheet') document.getElementById('qsheet').classList.remove('open');
      return;
    }
    const a = el.dataset.act;
    if (a === 'go') return go(el.dataset.to);
    if (a === 'q') return openQ(el.dataset.n);
    if (a === 'closeq') return document.getElementById('qsheet').classList.remove('open');
    if (a === 'closeSheet') return closeSheet();
    if (a === 'toast') return toast(el.dataset.msg);
    if (a === 'reset') { KD.reset(); Object.assign(ui, { weights: {}, ewb: '', otp: '', photo: false }); ui.seen.clear(); return go('#/login'); }
    if (a === 'signin') { commit(s => { s.dealerSignedIn = true; }); return go('#/orders'); }
    if (a === 'signout') { commit(s => { s.dealerSignedIn = false; }); return go('#/login'); }
    if (a === 'online') { commit(s => { s.dealerOffline = { ...(s.dealerOffline || {}), [ME.id]: isOnline() }; }); return; }
    if (a === 'stock') {
      commit(s => {
        const cur = KD.stocks(ME, s).slice();
        const p = el.dataset.p;
        s.dealerStock = { ...(s.dealerStock || {}), [ME.id]: cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p] };
      });
      return;
    }
    if (a === 'demoOrder') { KD.demoOrder(); return toast('Test order placed by a customer in Navelim'); }
    if (a === 'accept') {
      if (KD.respond(el.dataset.s, ME.id, true)) { toast('Accepted. Customer details unlocked.'); go('#/ship/' + el.dataset.s); }
      return;
    }
    if (a === 'decline') {
      return psheet(`<h3>Decline this order?</h3>
        <p class="small muted" style="margin:4px 0 12px">It goes straight to the next nearest dealer. Mohit Ispat can see decline reasons.</p>
        <div class="radio-list">${['Out of stock', 'No vehicle available', 'Too far for today', 'Shop closing'].map((r, i) => `<label><input type="radio" name="reason" value="${r}" ${i === 0 ? 'checked' : ''}>${r}</label>`).join('')}</div>
        <div class="row" style="margin-top:14px"><button class="btn ghost grow" data-act="closeSheet">Back</button><button class="btn grow" data-act="confirmDecline" data-s="${el.dataset.s}">Decline order</button></div>`);
    }
    if (a === 'confirmDecline') {
      const reason = (app.querySelector('input[name="reason"]:checked') || {}).value;
      closeSheet();
      if (KD.respond(el.dataset.s, ME.id, false, { reason })) toast('Declined. Offered to the next nearest dealer.');
      return;
    }
    if (a === 'fillEwb') { ui.ewb = KD.randomEwb(); return render(); }
    if (a === 'dispatch') {
      const { o, sh } = KD.find(S(), el.dataset.s);
      const w = weightsFor(o, sh);
      const actual = {};
      sh.lines.forEach(i => { actual[i] = o.lines[i].unit === 'bag' ? o.lines[i].qty : KD.roundQty(+w[i], o.lines[i].unit); });
      KD.dispatch(sh.id, { actual, vehicle: ui.vehicle.trim(), ewb: ui.ewb.trim() || null });
      ui.ewb = ''; ui.otp = ''; ui.photo = false;
      return toast('Invoice confirmed. Customer notified that the order is on the way.');
    }
    if (a === 'photo') { ui.photo = !ui.photo; return render(); }
    if (a === 'fillOtp') { const { sh } = KD.find(S(), el.dataset.s); ui.otp = sh.otp; return render(); }
    if (a === 'deliver') {
      KD.deliver(el.dataset.s);
      ui.otp = ''; ui.photo = false;
      return toast('Delivered. Payout releases in 24 hours.');
    }
    if (a === 'settle') { KD.settle(el.dataset.s); return toast('Payout released to your bank account.'); }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.w != null) {
      const shipId = t.dataset.s;
      ui.weights[shipId][t.dataset.w] = t.value.replace(/[^\d.]/g, '');
      return refreshInvoice(shipId);
    }
    if (t.dataset.f === 'vehicle') ui.vehicle = t.value;
    if (t.dataset.f === 'ewb') { ui.ewb = t.value; const { view, arg } = route(); if (view === 'ship') refreshInvoice(arg); }
    if (t.dataset.f === 'otp') {
      ui.otp = t.value.replace(/\D/g, '').slice(0, 4);
      if (ui.otp.length === 4 || t.value.length === 0) render();
    }
  });

  document.getElementById('presenterSwitch').addEventListener('click', () => commit(s => { s.presenter = !s.presenter; }));

  // Countdown on open requests
  setInterval(() => app.querySelectorAll('[data-cd]').forEach(el => { el.textContent = mmss(left({ at: +el.dataset.cd })); }), 1000);
  // Tell the routing engine this dealer app is open, so offers wait for a tap
  const beat = () => { if (S().dealerSignedIn) KD.heartbeat(); };
  beat();
  setInterval(beat, 1500);

  KD.startTicker();
  window.addEventListener('hashchange', render);
  window.addEventListener('kd:state', render);
  render();
})();
