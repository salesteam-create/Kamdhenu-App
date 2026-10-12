/* Kamdhenu App prototype: customer app */
(() => {
  const app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => KD.load();
  const commit = fn => { const s = S(); fn(s); KD.save(s); };

  // UI-only state (not persisted)
  const ui = { mode: 't', draft: {}, pay: 'upi', emi: 6, paying: false, lang: 'en' };

  /* ---------- icons ---------- */
  const ic = {
    back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    box: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
    cart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6"/></svg>',
    user: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
    pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
    check: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  };
  const prodIcon = {
    tmt: '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#b3121b" stroke-width="2.2" stroke-linecap="round"><path d="M5 26L26 5"/><path d="M9 28L28 9"/><path d="M4 21L21 4"/><path d="M8 22l2 2M12 18l2 2M16 14l2 2M20 10l2 2"/></svg>',
    wire: '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#b3121b" stroke-width="2.2"><ellipse cx="16" cy="16" rx="11" ry="11"/><ellipse cx="16" cy="16" rx="7" ry="7"/><ellipse cx="16" cy="16" rx="3" ry="3"/></svg>',
    nails: '<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#b3121b" stroke-width="2.2" stroke-linecap="round"><path d="M9 5h8M13 5v20l-1 3"/><path d="M18 9h8M22 9v16l-1 3"/></svg>',
  };

  /* ---------- discussion pins ---------- */
  const q = (...ns) => `<span class="qpins">${ns.map(n => `<button class="qpin" data-act="q" data-n="${n}" title="Discussion point ${n}">Q${n}</button>`).join('')}</span>`;
  const screenQs = {
    login: { name: 'Sign in', qs: [11, 12] },
    otp: { name: 'Verify OTP', qs: [11] },
    site: { name: 'Add site', qs: [7, 5, 6] },
    home: { name: 'Home', qs: [11, 5, 10] },
    product: { name: 'Product', qs: [1, 5] },
    cart: { name: 'Cart', qs: [2, 1] },
    checkout: { name: 'Checkout', qs: [3, 7, 8, 13] },
    order: { name: 'Order tracking', qs: [6, 7, 1, 4, 8] },
    orders: { name: 'My orders', qs: [] },
    account: { name: 'Account', qs: [12, 11] },
    paid: { name: 'Payment successful', qs: [3] },
    search: { name: 'Search', qs: [] },
    alerts: { name: 'Notifications', qs: [7] },
  };

  function renderNotes(key) {
    const meta = screenQs[key] || { name: '', qs: [] };
    document.getElementById('screenName').textContent = meta.name;
    const body = document.getElementById('notesBody');
    body.innerHTML = meta.qs.length
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
  const site = () => { const s = S(); return s.sites.find(x => x.id === s.activeSite); };
  const zoneName = id => (KD.zones.find(z => z.id === id) || {}).name || '';
  const cartCount = () => S().cart.length;
  const tmtT = lines => KD.roundQty(lines.filter(l => l.variantId.startsWith('tmt')).reduce((a, l) => a + l.qty, 0), 't');

  function toast(msg) {
    let t = app.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; app.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toast.tm);
    toast.tm = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function psheet(html) {
    let b = app.querySelector('.psheet-backdrop');
    if (!b) { b = document.createElement('div'); b.className = 'psheet-backdrop'; app.appendChild(b); }
    b.innerHTML = `<div class="psheet"><div class="grab"></div>${html}</div>`;
    b.classList.add('open');
  }
  const closeSheet = () => { const b = app.querySelector('.psheet-backdrop'); if (b) b.classList.remove('open'); };

  // In-app history so Back returns to the previous screen, with a sensible fallback
  const hist = [];
  function track(h) {
    if (hist[hist.length - 1] === h) return;
    if (hist[hist.length - 2] === h) hist.pop(); else hist.push(h);
  }
  const back = fallback => go(hist.length > 1 ? hist[hist.length - 2] : fallback);

  const topbar = (title, fallback, extra = '') => `
    <div class="topbar">
      ${fallback ? `<button class="iconbtn" data-act="back" data-to="${fallback}" aria-label="Back">${ic.back}</button>` : ''}
      <h2>${title}</h2>${extra}
    </div>`;

  // Sticky "View cart" bar shown on browsing screens
  function cartBar() {
    const s = S();
    if (!s.cart.length) return '';
    const lines = cartLinesWithRates();
    const amt = lines.reduce((a, l) => a + l.qty * l.rate, 0);
    return `<button class="cartbar" data-act="go" data-to="#/cart">
      <span class="cb-count">${s.cart.length}</span>
      <span class="grow"><b>${s.cart.length} item${s.cart.length > 1 ? 's' : ''} in cart</b><small>${KD.inr(amt)} + GST</small></span>
      <span class="cb-go">View cart ${ic.chevron}</span>
    </button>`;
  }

  const nav = active => `
    <nav class="bottomnav">
      <button class="${active === 'home' ? 'on' : ''}" data-act="go" data-to="#/home">${ic.home}Home</button>
      <button class="${active === 'orders' ? 'on' : ''}" data-act="go" data-to="#/orders">${ic.box}Orders</button>
      <button class="${active === 'cart' ? 'on' : ''}" data-act="go" data-to="#/cart">${ic.cart}Cart${cartCount() ? `<span class="badge">${cartCount()}</span>` : ''}</button>
      <button class="${active === 'account' ? 'on' : ''}" data-act="go" data-to="#/account">${ic.user}Account</button>
    </nav>`;

  /* ---------- screens ---------- */
  function vLogin() {
    return `<div class="screen">
      <div class="login-hero">
        <div class="wordmark"><span class="mark">K</span><span>Kamdhenu<small>Steel, delivered to your site</small></span></div>
        <h1>Genuine Kamdhenu TMT, delivered to your site.</h1>
        <p>Order from anywhere. Pay securely. A Kamdhenu dealer near your site delivers.</p>
        <div class="trust"><div>Genuine product</div><div>GST invoice</div><div>Dealer paid after delivery</div></div>
      </div>
      <div class="pad">
        <div class="field"><label>Mobile number</label>
          <div class="phone-input"><span>+91</span><input id="phoneNo" inputmode="numeric" value="98220 12345"></div>
        </div>
        <button class="btn block lg" data-act="go" data-to="#/otp">Get OTP</button>
        <div class="field" style="margin-top:18px"><label>Language ${q(12)}</label>
          <div class="chips">
            <button class="chip on">English</button>
            <button class="chip" disabled title="Planned">ಕನ್ನಡ</button>
            <button class="chip" disabled title="Planned">हिंदी</button>
          </div>
        </div>
        <p class="small muted" style="text-align:center;margin-top:18px">Operated by Mohit Ispat Ltd ${q(11)}</p>
      </div>
    </div>`;
  }

  function vOtp() {
    return `${topbar('Verify your number', '#/login')}
    <div class="screen pad">
      <p class="muted">Enter the 4-digit code sent to +91 98220 12345</p>
      <div class="otp"><input value="4" maxlength="1"><input value="8" maxlength="1"><input value="2" maxlength="1"><input value="1" maxlength="1"></div>
      <div class="field"><label>Your name</label><input class="input" id="userName" value="Anil Kamat"></div>
      <button class="btn block lg" data-act="verify">Verify and continue</button>
      <p class="small muted" style="text-align:center;margin-top:14px">Didn't get it? Resend in 0:24</p>
    </div>`;
  }

  const mapSvg = `<svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMid slice">
      <rect width="360" height="180" fill="#e9edf0"/>
      <path d="M0 120 C80 110 140 140 220 120 S330 90 360 100" stroke="#fff" stroke-width="12" fill="none"/>
      <path d="M90 0 L120 180" stroke="#fff" stroke-width="9"/>
      <path d="M250 0 C240 60 270 120 260 180" stroke="#fff" stroke-width="7"/>
      <path d="M0 50 L360 70" stroke="#fff" stroke-width="5"/>
      <rect x="140" y="20" width="60" height="38" rx="4" fill="#dfe5d8"/>
      <rect x="280" y="120" width="70" height="50" rx="4" fill="#dfe5d8"/>
      <circle cx="180" cy="88" r="40" fill="#b3121b" opacity=".08"/>
      <path d="M180 92s14-12.4 14-24a14 14 0 0 0-28 0c0 11.6 14 24 14 24z" fill="#b3121b"/>
      <circle cx="180" cy="68" r="5" fill="#fff"/>
    </svg>`;

  function vSite() {
    const s = S();
    const first = !s.sites.length;
    return `${topbar('Add your site', first ? '' : '#/home')}
    <div class="screen pad">
      <p class="muted small" style="margin-bottom:12px">We use your site location to find the nearest Kamdhenu dealer and today's price for your area.</p>
      <div class="map">${mapSvg}<div class="pinlabel"><b>Navelim, Margao, Goa 403707</b><br><span class="muted">Drag the map to adjust the pin</span></div></div>
      <div class="row" style="margin:10px 0 16px"><span class="pill info">Pricing zone: South Goa</span>${q(5)}<span class="pill good">3 dealers within ${KD.RADIUS_KM} km</span>${q(6)}</div>
      <div class="field"><label>Site name</label><input class="input" id="siteName" value="New house, Navelim"></div>
      <div class="field"><label>Plot, street and landmark</label><input class="input" id="siteAddr" value="Plot 14, Rua de Navelim, near St. Francis Chapel"></div>
      <div class="hr"></div>
      <div class="row between" style="margin-bottom:8px"><b>Site contact</b>${q(7)}</div>
      <p class="small muted" style="margin-bottom:10px">The person who receives material at site. The delivery OTP is sent to them as well.</p>
      <div class="field"><label>Name</label><input class="input" id="scName" value="Suresh Gaonkar (site supervisor)"></div>
      <div class="field"><label>Mobile</label><input class="input" id="scPhone" value="+91 98901 23456"></div>
      <button class="btn block lg" data-act="saveSite">Save site</button>
    </div>`;
  }

  function vHome() {
    const st = site();
    const tmt = KD.products[0];
    const from = Math.min(...tmt.variants.map(v => KD.rateFor(v.id, st.zone)));
    return `<div class="screen">
      <div class="home-head">
        <div class="row between">
          <div class="wordmark"><span class="mark">K</span><span>Kamdhenu</span></div>
          <button class="iconbtn cart-ic" data-act="alerts" aria-label="Notifications">${ic.bell}${unread() ? `<span class="badge">${unread()}</span>` : ''}</button>
        </div>
        <button class="sitechip" data-act="sites">${ic.pin}<div class="grow"><b>${esc(st.name)}</b><span>${esc(st.area)} · ${zoneName(st.zone)}</span></div>${ic.chevron}</button>
        <button class="search" data-act="go" data-to="#/search">${ic.search}Search TMT, binding wire, nails</button>
      </div>
      <div class="pad">
        ${activeOrderCard()}
        <div class="banner">
          <div class="tag">Today's ${zoneName(st.zone)} price ${q(5)}</div>
          <h3>Kamdhenu TMT from ${KD.inr(from)}/tonne</h3>
          <p>Plus GST. Delivered by a Kamdhenu dealer near your site.</p>
          <button class="btn sm" style="margin-top:12px" data-act="go" data-to="#/product/tmt">Order TMT</button>
          <svg class="bars" width="120" height="90" viewBox="0 0 120 90" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="7" stroke-linecap="round"><path d="M10 85L85 10"/><path d="M30 88L110 8"/><path d="M50 90L118 22"/></svg>
        </div>
        <div class="section-title">Shop by category</div>
        <div class="cats">
          ${KD.products.map(p => `<button class="cat" data-act="go" data-to="#/product/${p.id}"><span class="ic">${prodIcon[p.icon]}</span>${p.short}<small>${p.variants.length} options</small></button>`).join('')}
        </div>
        <div class="section-title">Coming soon <span class="pill">Phase 2</span></div>
        <div class="soon"><span>Cement</span><span>Pipes</span><span>Structural steel</span><span>Paints</span></div>
        <div class="section-title">How it works</div>
        <div class="card pad steps">
          <div><i>1</i><span>Add what your engineer or contractor has asked for, in tonnes or kg.</span></div>
          <div><i>2</i><span>Pay online. Your money is held securely until delivery.</span></div>
          <div><i>3</i><span>The nearest Kamdhenu dealer delivers to your site. You pay only for the actual weight delivered.</span></div>
        </div>
        <p class="small muted" style="text-align:center;margin:18px 0 4px">Operated by Mohit Ispat Ltd ${q(11)}</p>
      </div>
    </div>${cartBar()}${nav('home')}`;
  }

  function draftKg(v, p) {
    const val = +ui.draft[v.id] || 0;
    if (p.unit === 'bag') return val;
    return p.unit === 't' && ui.mode === 'kg' ? KD.roundQty(val / 1000, 't') : val;
  }

  function productTotals(p) {
    const st = site();
    let qty = 0, amt = 0;
    p.variants.forEach(v => {
      const k = draftKg(v, p);
      qty += k;
      amt += k * KD.rateFor(v.id, st.zone);
    });
    return { qty, amt };
  }

  function approxText(v, p) {
    const val = +ui.draft[v.id] || 0;
    if (!val || p.unit !== 't') return '';
    return ui.mode === 'kg' ? `= ${KD.tFmt(KD.roundQty(val / 1000, 't'))}` : `= ${KD.kgFmt(Math.round(val * 1000))}`;
  }

  function vProduct(id) {
    const p = KD.products.find(x => x.id === id) || KD.products[0];
    const st = site();
    const inKg = p.unit === 't' && ui.mode === 'kg';
    const unitLabel = p.unit === 'bag' ? 'bags' : p.unit === 't' && !inKg ? 'tonnes' : 'kg';
    const step = p.unit === 'bag' ? 1 : p.unit === 't' ? (inKg ? 50 : 0.1) : 5;
    const t = productTotals(p);
    return `${topbar(p.name, '#/home', `<button class="iconbtn cart-ic" data-act="go" data-to="#/cart" aria-label="Cart">${ic.cart}${cartCount() ? `<span class="badge">${cartCount()}</span>` : ''}</button>`)}
    <div class="screen pad">
      <p class="muted small">${p.blurb}</p>
      <div class="row between" style="margin:14px 0 10px">
        <span class="small"><b>Today's price, ${zoneName(st.zone)}</b> <span class="muted">· updated 9:00 AM</span>${q(5)}</span>
      </div>
      ${p.unit === 't' ? `<div class="seg" style="margin-bottom:12px">
        <button class="${ui.mode === 't' ? 'on' : ''}" data-act="mode" data-m="t">Order in tonnes</button>
        <button class="${ui.mode === 'kg' ? 'on' : ''}" data-act="mode" data-m="kg">Order in kg</button>
      </div>` : ''}
      <div class="vrows">
        ${p.variants.map(v => `
          <div class="vrow">
            <div>
              <b>${v.label}</b>
              <div class="meta">${p.unit === 't' ? `${KD.inr(KD.rateFor(v.id, st.zone))} / tonne · ${KD.inr2(KD.rateFor(v.id, st.zone) / 1000)} / kg` : `${KD.inr2(KD.rateFor(v.id, st.zone))} / ${KD.unitWord(p.unit)}`} + GST</div>
              <div class="approx" data-approx="${v.id}">${approxText(v, p)}</div>
              ${inCart(v.id) ? `<div class="incart">✓ ${KD.lineQty(S().cart.find(x => x.variantId === v.id))} in cart</div>` : ''}
            </div>
            <div class="qty">
              <button data-act="step" data-v="${v.id}" data-d="-${step}" aria-label="Less">−</button>
              <input data-qty="${v.id}" inputmode="${p.unit === 't' && !inKg ? 'decimal' : 'numeric'}" value="${ui.draft[v.id] || ''}" placeholder="0">
              <span class="u">${unitLabel}</span>
              <button data-act="step" data-v="${v.id}" data-d="${step}" aria-label="More">+</button>
            </div>
          </div>`).join('')}
      </div>
      ${p.byWeight ? `<div class="note" style="margin-top:12px"><span>ℹ</span><span>Billing is on the actual weight loaded at the dealer. You pay a 2% refundable buffer, and any unused amount comes back to you after delivery. ${q(1)}</span></div>` : ''}
    </div>
    <div class="footerbar" id="pFooter" ${!t.qty && cartCount() ? 'hidden' : ''}>
      <div class="row between" style="margin-bottom:10px">
        <span class="muted small" id="pTotQty">${t.qty ? KD.lineQty({ unit: p.unit, mode: ui.mode }, KD.roundQty(t.qty, p.unit)) : 'Nothing added yet'}</span>
        <b id="pTotAmt">${KD.inr(t.amt)} <span class="muted small" style="font-weight:500">+ GST</span></b>
      </div>
      <button class="btn block lg" data-act="addCart" data-p="${p.id}" id="addBtn" ${t.qty ? '' : 'disabled'}>Add to cart</button>
    </div>
    <div id="pCartBar" ${!t.qty && cartCount() ? '' : 'hidden'}>${cartBar()}</div>`;
  }

  const inCart = vid => { const l = S().cart.find(x => x.variantId === vid); return l ? l.qty : 0; };

  function refreshProductFooter(p) {
    const t = productTotals(p);
    document.getElementById('pTotQty').textContent = t.qty ? KD.lineQty({ unit: p.unit, mode: ui.mode }, KD.roundQty(t.qty, p.unit)) : 'Nothing added yet';
    document.getElementById('pTotAmt').innerHTML = `${KD.inr(t.amt)} <span class="muted small" style="font-weight:500">+ GST</span>`;
    document.getElementById('addBtn').disabled = !t.qty;
    const showBar = !t.qty && cartCount() > 0;
    document.getElementById('pFooter').hidden = showBar;
    document.getElementById('pCartBar').hidden = !showBar;
    p.variants.forEach(v => {
      const el = app.querySelector(`[data-approx="${v.id}"]`);
      if (el) el.textContent = approxText(v, p);
    });
  }

  function cartLinesWithRates() {
    const st = site();
    return S().cart.map(l => ({ ...l, rate: KD.rateFor(l.variantId, st.zone) }));
  }

  function billSummary(lines, groups) {
    const all = groups.map(g => KD.totals(lines, g.lines, g.km));
    const sum = k => all.reduce((a, t) => a + t[k], 0);
    return { material: sum('material'), gst: sum('gst'), delivery: sum('delivery'), buffer: sum('buffer'), total: sum('total'), per: all };
  }

  function summaryHtml(b, groups) {
    return `<div class="sum">
      <div><span>Material</span><span>${KD.inr(b.material)}</span></div>
      <div><span>GST (18%)</span><span>${KD.inr(b.gst)}</span></div>
      <div><span>Delivery (${groups.length} shipment${groups.length > 1 ? 's' : ''}) ${q(2)}</span><span>${KD.inr(b.delivery)}</span></div>
      <div><span>Weight buffer, refundable (2%) ${q(1)}</span><span>${KD.inr(b.buffer)}</span></div>
      <div class="total"><span>Max payable</span><span>${KD.inr(b.total)}</span></div>
      <p class="small muted">You are billed on actual weight delivered. Any unused amount is refunded within 48 hours of delivery.</p>
    </div>`;
  }

  function vCart() {
    const s = S();
    if (!s.cart.length) {
      return `${topbar('Cart', '#/home')}
      <div class="screen pad" style="text-align:center;padding-top:60px">
        <div class="success-ic" style="background:var(--bg);color:var(--ink-3)">${ic.cart}</div>
        <b>Your cart is empty</b><p class="muted small" style="margin:6px 0 16px">Add TMT bars, binding wire or nails to get started.</p>
        <button class="btn" data-act="go" data-to="#/product/tmt">Shop TMT</button>
      </div>${nav('cart')}`;
    }
    const lines = cartLinesWithRates();
    const groups = KD.plan(lines);
    const b = billSummary(lines, groups);
    const tTmt = tmtT(lines);
    const short = tTmt < KD.MIN_TMT_T;
    return `${topbar('Cart', '#/home')}
    <div class="screen pad">
      <div class="card">
        ${lines.map((l, i) => `<div class="line">
          <div><b>${esc(l.name)} · ${esc(l.label)}</b><div class="small muted">${l.unit === 't' ? KD.inr(l.rate) : KD.inr2(l.rate)}/${KD.unitWord(l.unit)}</div></div>
          <div style="text-align:right"><b>${KD.inr(l.qty * l.rate)}</b></div>
          <div class="qty sm">
            <button data-act="cq" data-i="${i}" data-d="-1" aria-label="Less">−</button>
            <span class="qv">${KD.lineQty(l)}</span>
            <button data-act="cq" data-i="${i}" data-d="1" aria-label="More">+</button>
          </div>
          <button class="x" data-act="rm" data-i="${i}">Remove</button>
        </div>`).join('')}
        <button class="listrow addmore" data-act="go" data-to="#/home"><b class="small">+ Add more items</b></button>
      </div>
      <div class="minorder ${short ? '' : 'ok'}">
        <div class="row between small"><span>${short ? `Add ${KD.tFmt(KD.roundQty(KD.MIN_TMT_T - tTmt, 't'))} more TMT to place the order` : 'Minimum order reached'} ${q(2)}</span><b>${KD.tFmt(tTmt)} / ${KD.tFmt(KD.MIN_TMT_T)}</b></div>
        <div class="minbar"><i style="width:${Math.min(100, tTmt / KD.MIN_TMT_T * 100)}%"></i></div>
      </div>
      <div class="section-title">Delivery plan ${q(2)}</div>
      <div class="card">
        ${groups.map((g, k) => `<div class="ship-plan">
          <div><b>Shipment ${k + 1}</b><div class="small muted">${g.lines.map(i => lines[i].label + ' ' + KD.products.find(p => lines[i].variantId.startsWith(p.id)).short).join(', ')}</div></div>
          <div style="text-align:right"><b>${KD.inr(KD.feeFor(g.km))}</b><div class="small muted">${KD.slabLabel(g.km)}</div></div>
        </div>`).join('')}
      </div>
      ${groups.length > 1 ? `<p class="small muted" style="margin-top:8px">Your items come from different dealers near your site, so they arrive as separate shipments.</p>` : ''}
      <p class="small muted" style="margin-top:6px">Unloading at site is not included.</p>
      <div class="section-title">Bill summary</div>
      <div class="card">${summaryHtml(b, groups)}</div>
    </div>
    <div class="footerbar">
      <button class="btn block lg" data-act="go" data-to="#/checkout" ${short ? 'disabled' : ''}>Continue · ${KD.inr(b.total)}</button>
    </div>${nav('cart')}`;
  }

  function vCheckout() {
    const st = site();
    const lines = cartLinesWithRates();
    const groups = KD.plan(lines);
    const b = billSummary(lines, groups);
    const opt = (id, title, sub) => `<button class="payopt ${ui.pay === id ? 'on' : ''}" data-act="pay" data-m="${id}"><span class="radio"></span><span><b>${title}</b><span>${sub}</span></span></button>`;
    return `${topbar('Checkout', '#/cart')}
    <div class="screen pad">
      <div class="section-title" style="margin-top:4px"><span>Deliver to ${q(7)}</span><button class="linkbtn" data-act="sites">Change</button></div>
      <div class="card pad">
        <b>${esc(st.name)}</b>
        <p class="small muted">${esc(st.addr)}, ${esc(st.area)}</p>
        <div class="hr"></div>
        <p class="small"><b>Site contact:</b> ${esc(st.contact)} · ${esc(st.contactPhone)}</p>
        <p class="small muted">The delivery OTP is sent to you and to the site contact.</p>
      </div>
      <div class="section-title">Payment method</div>
      <div class="paylist">
        ${opt('upi', 'UPI', 'Google Pay, PhonePe, Paytm, any UPI app')}
        ${opt('card', 'Credit or debit card', 'Visa, Mastercard, RuPay')}
        ${opt('emi', 'Card EMI', 'Split into 3, 6 or 9 monthly payments')}
        ${ui.pay === 'emi' ? `<div class="chips" style="padding:2px 4px 6px">${[3, 6, 9].map(m => `<button class="chip ${ui.emi === m ? 'on' : ''}" data-act="emi" data-m="${m}">${m} months · ${KD.inr(b.total / m)}/mo</button>`).join('')}<p class="small muted" style="width:100%">Plus bank interest, as shown by your card issuer.</p></div>` : ''}
        ${opt('nb', 'Net banking', 'All major banks')}
      </div>
      <div class="note good" style="margin-top:14px">${ic.shield}<span>Your payment is held securely and released to the dealer only after delivery. ${q(3)}</span></div>
      <div class="note" style="margin-top:8px"><span>ℹ</span><span>Prices are locked when you pay. Free cancellation until the order is dispatched. ${q(8)}</span></div>
      <div class="card" style="margin-top:14px">${summaryHtml(b, groups)}</div>
      <p class="small muted" style="margin-top:8px">No convenience fee for you. ${q(13)}</p>
    </div>
    <div class="footerbar">
      <button class="btn block lg" data-act="placeOrder">Pay ${KD.inr(b.total)}</button>
    </div>`;
  }

  /* ---------- order lifecycle ---------- */
  const STEPS = ['Paid', 'Dealer confirmed', 'Out for delivery', 'Delivered', 'Completed'];
  const stepIndex = st => ({ routing: 0, accepted: 1, dispatched: 2, delivered: 3, settled: 4 }[st] ?? 0);
  const statusPill = sh => {
    if (sh.status === 'cancelled') return '<span class="pill">Cancelled</span>';
    if (sh.issue && sh.issue.status === 'open') return '<span class="pill warn">Issue under review</span>';
    return {
      routing: '<span class="pill info">Finding dealer</span>',
      unassigned: '<span class="pill warn">Finding dealer</span>',
      accepted: '<span class="pill info">Confirmed</span>',
      dispatched: '<span class="pill brand">Out for delivery</span>',
      delivered: '<span class="pill good">Delivered</span>',
      settled: '<span class="pill good">Completed</span>',
    }[sh.status];
  };

  function placeOrder() {
    const lines = cartLinesWithRates();
    const st = site();
    let id;
    commit(s => {
      const method = ui.pay === 'emi' ? `Card EMI, ${ui.emi} months` : { upi: 'UPI', card: 'Card', nb: 'Net banking' }[ui.pay];
      id = KD.createOrder(s, { user: s.user, site: st, lines, method }).id;
      s.cart = [];
    });
    return id;
  }

  // Demo shortcut for steps the dealer would normally do in the dealer app
  function advance(orderId, shipId) {
    const { o, sh } = KD.find(S(), shipId);
    if (!sh) return;
    if (sh.status === 'accepted') KD.dispatch(shipId, { actual: KD.simulatedActual(o, sh), vehicle: 'GA 08 T 4521', ewb: sh.quote.total > 50000 ? KD.randomEwb() : null });
    else if (sh.status === 'dispatched') KD.deliver(shipId);
    else if (sh.status === 'delivered') KD.settle(shipId);
  }

  function vOrder(id) {
    const o = S().orders.find(x => x.id === id);
    if (!o) return `${topbar('Order', '#/orders')}<div class="screen pad">Order not found.</div>`;
    return `${topbar(`Order ${o.id}`, '#/orders')}
    <div class="screen pad">
      <div class="row between" style="margin-bottom:12px">
        <span class="small muted">${KD.date(o.at)} · ${KD.time(o.at)} · ${esc(o.method)}</span>
        <b style="white-space:nowrap">${KD.inr(o.paid)} paid</b>
      </div>
      ${o.shipments.map(sh => shipCard(o, sh)).join('')}
      <div class="card pad small">
        <b>Deliver to</b>
        <p class="muted">${esc(o.site.name)}<br>${esc(o.site.addr)}<br>Site contact: ${esc(o.site.contact)}</p>
        <button class="btn ghost sm" style="margin-top:10px" data-act="toast" data-msg="Tracking link sent to ${esc(o.site.contact.split(' (')[0])} on WhatsApp">Share tracking with site contact ${q(7)}</button>
      </div>
      <button class="btn soft block" style="margin-top:12px" data-act="reorder" data-o="${o.id}">Order the same items again</button>
      <p class="small muted" style="text-align:center;margin-top:6px">Handy for the next stage of your site. Today's prices apply.</p>
    </div>${nav('orders')}`;
  }

  function shipCard(o, sh) {
    const idx = stepIndex(sh.status);
    const items = sh.lines.map(i => o.lines[i]);
    const cancelled = sh.status === 'cancelled';
    let body = '';
    if (cancelled) {
      body = `<div class="note">Cancelled. Full refund of ${KD.inr(sh.quote.total)} initiated to your original payment method.</div>`;
    } else if (sh.status === 'routing') {
      body = `<div class="row" style="gap:12px"><div class="spinner" style="width:24px;height:24px;border-width:3px;margin:0"></div><div><b>Finding the nearest Kamdhenu dealer</b><p class="small muted">Dealers within ${KD.RADIUS_KM} km get ${KD.ACCEPT_MIN} minutes each to accept. ${q(6)}</p></div></div>`;
    } else if (sh.status === 'unassigned') {
      body = `<div class="note warn"><span>!</span><span>Nearby dealers could not take this right now. Our team is arranging it and will call you. If it is not assigned within 2 hours, you get a full refund. ${q(6)}</span></div>`;
    } else if (sh.status === 'accepted') {
      body = `<p class="small">Confirmed by a Kamdhenu dealer near your site. Expected delivery <b>today by 6:00 PM</b>.</p>
        <div class="row"><button class="btn ghost sm" data-act="askCancel" data-o="${o.id}" data-s="${sh.id}">Cancel shipment</button>${q(8)}</div>`;
    } else if (sh.status === 'dispatched') {
      body = `<div class="otpcard"><div><div class="small" style="opacity:.75">Delivery OTP ${q(7)}</div><div class="code">${sh.otp}</div></div><div class="small" style="text-align:right;opacity:.85">Also sent to<br>${esc(o.site.contact.split(' (')[0])}</div></div>
        <p class="small muted">Share this code only after the material is unloaded and checked.${sh.ewb ? ` E-way bill ${sh.ewb}.` : ''}</p>`;
    } else {
      body = `<table class="wtable"><thead><tr><th>Item</th><th>Ordered</th><th>Delivered</th></tr></thead><tbody>
        ${sh.lines.map(i => `<tr><td>${esc(o.lines[i].label)} ${esc(KD.variant(o.lines[i].variantId).product.short)}</td><td>${KD.lineQty(o.lines[i])}</td><td><b>${KD.lineQty(o.lines[i], sh.actual[i])}</b></td></tr>`).join('')}
        </tbody></table>
        <div class="sum" style="padding:0">
          ${sh.quote.buffer ? `<div><span>Paid (max payable)</span><span>${KD.inr(sh.quote.total)}</span></div>
          <div><span>Final bill on actual weight</span><span>${KD.inr(sh.final.total)}</span></div>
          <div class="total" style="font-size:14px"><span>Refund to you ${q(1)}</span><span style="color:var(--good)">${KD.inr(sh.refund)}</span></div>`
          : `<div><span>Amount paid, fixed pack size</span><span>${KD.inr(sh.final.total)}</span></div>`}
        </div>
        ${sh.issue ? `<div class="note warn"><span>!</span><span>${sh.issue.status === 'open' ? `Issue reported: ${esc(sh.issue.type)}. Our team is reviewing it and the dealer payout is on hold.` : 'Issue resolved.'}</span></div>` : ''}
        <div class="row">
          <button class="btn ghost sm grow" data-act="invoice" data-o="${o.id}" data-s="${sh.id}">GST invoice</button>${q(4)}
          ${sh.status === 'delivered' && !sh.issue ? `<button class="btn ghost sm grow" data-act="issue" data-o="${o.id}" data-s="${sh.id}">Report an issue</button>${q(8)}` : ''}
        </div>`;
    }
    const demoLabel = { accepted: 'Demo: dealer dispatches', dispatched: 'Demo: delivered at site', delivered: 'Demo: 24 hours pass' }[sh.status];
    const dealerDrives = sh.dealerId === KD.DEMO_DEALER && KD.dealerLive() && sh.status !== 'delivered';
    const canDemo = demoLabel && !dealerDrives && !(sh.issue && sh.issue.status === 'open');
    return `<div class="card ship">
      <div class="ship-head">
        <div><b>Shipment ${sh.n} of ${sh.of}</b><div class="small muted">${items.map(l => `${l.label} ${KD.variant(l.variantId).product.short}`).join(', ')}</div></div>
        ${statusPill(sh)}
      </div>
      ${cancelled ? '' : `<div class="stepper">${STEPS.map((label, i) => `<div class="${i < idx || sh.status === 'settled' ? 'done' : i === idx ? 'now' : ''}"><i></i>${label}</div>`).join('')}</div>`}
      <div class="ship-body" ${cancelled ? 'style="padding-top:14px"' : ''}>
        ${body}
        ${canDemo ? `<button class="btn demo sm" data-act="advance" data-o="${o.id}" data-s="${sh.id}">${demoLabel}</button>` : ''}
      </div>
    </div>`;
  }

  function vPaid(id) {
    const o = S().orders.find(x => x.id === id);
    if (!o) return vHome();
    return `<div class="screen pad" style="display:grid;place-items:center;text-align:center">
      <div>
        <div class="success-ic">${ic.check}</div>
        <h3>Payment successful</h3>
        <p class="small muted" style="margin:6px 0 4px">Order ${o.id} · ${KD.inr(o.paid)} via ${esc(o.method)}</p>
        <p class="small muted" style="margin-bottom:18px">Your money is held securely and released to the dealer only after delivery. ${q(3)}</p>
        <button class="btn block" data-act="go" data-to="#/order/${o.id}">Track order</button>
      </div>
    </div>`;
  }

  // Customer-facing events for each shipment (dealer names and routing stay hidden)
  function alerts() {
    const out = [];
    S().orders.forEach(o => o.shipments.forEach(sh => {
      const tag = `${o.id}, shipment ${sh.n}`;
      out.push({ t: o.at, o, text: `Payment received for ${tag}. Finding a dealer near your site.` });
      if (sh.acceptedAt) out.push({ t: sh.acceptedAt, o, text: `${tag} confirmed by a Kamdhenu dealer. Delivery today by 6:00 PM.` });
      if (sh.dispatchedAt) out.push({ t: sh.dispatchedAt, o, text: `${tag} is out for delivery. Your OTP is ${sh.otp}.` });
      if (sh.deliveredAt) out.push({ t: sh.deliveredAt, o, text: `${tag} delivered. Refund of ${KD.inr(sh.refund || 0)} initiated.` });
      if (sh.status === 'cancelled') out.push({ t: Date.now(), o, text: `${tag} cancelled. Full refund initiated.` });
    }));
    return out.sort((a, b) => b.t - a.t);
  }
  const unread = () => alerts().filter(x => x.t > (S().alertsSeen || 0)).length;

  function vAlerts() {
    const list = alerts();
    const seen = ui.alertsSeenAtOpen || 0;
    return `${topbar('Notifications', '#/home')}
    <div class="screen pad">
      ${list.length ? `<div class="card">${list.map(x => `<button class="listrow alert ${x.t > seen ? 'new' : ''}" data-act="go" data-to="#/order/${x.o.id}">
        <span class="dotnew"></span><div class="grow small">${esc(x.text)}<div class="muted">${KD.time(x.t)}</div></div></button>`).join('')}</div>`
        : '<div style="text-align:center;padding-top:60px"><b>No notifications yet</b><p class="small muted" style="margin-top:6px">Order updates also come by SMS and WhatsApp.</p></div>'}
    </div>`;
  }

  function activeOrderCard() {
    const o = S().orders.find(o => o.shipments.some(sh => !['settled', 'cancelled'].includes(sh.status)));
    if (!o) return '';
    const live = o.shipments.filter(sh => !['settled', 'cancelled'].includes(sh.status));
    return `<button class="card activecard" data-act="go" data-to="#/order/${o.id}">
      <div class="grow"><span class="small muted">Your order ${o.id}</span><div class="row" style="flex-wrap:wrap;margin-top:6px">${live.map(statusPill).join('')}</div></div>
      <span class="linkbtn">Track ${ic.chevron}</span>
    </button>`;
  }

  const allVariants = () => KD.products.flatMap(p => p.variants.map(v => ({ p, v, text: `${v.label} ${p.short} ${p.name}`.toLowerCase() })));
  function searchResults(term) {
    const t = term.trim().toLowerCase();
    const st = site();
    const hits = t ? allVariants().filter(x => t.split(/\s+/).every(w => x.text.includes(w))) : allVariants().filter(x => ['tmt-12', 'tmt-16', 'tmt-8', 'wire-20', 'nails-3'].includes(x.v.id));
    return `${t ? '' : '<div class="small muted" style="margin-bottom:8px">Popular</div>'}
      ${hits.length ? `<div class="card">${hits.map(x => `<button class="listrow" data-act="go" data-to="#/product/${x.p.id}">
        <span class="sic">${prodIcon[x.p.icon]}</span><div class="grow"><b class="small">${x.v.label} ${x.p.short}</b><div class="small muted">${KD.inr2(KD.rateFor(x.v.id, st.zone))} / ${x.p.unit} + GST</div></div>${ic.chevron}</button>`).join('')}</div>`
        : `<p class="small muted" style="text-align:center;margin-top:30px">No match. Cement, pipes and paints are coming in Phase 2.</p>`}`;
  }
  function vSearch() {
    return `${topbar('Search', '#/home')}
    <div class="screen pad">
      <div class="search" style="margin:0 0 14px">${ic.search}<input id="searchBox" placeholder="Try 12 mm, binding wire, nails" value="${esc(ui.term || '')}" autocomplete="off"></div>
      <div id="searchResults">${searchResults(ui.term || '')}</div>
    </div>${cartBar()}${nav('home')}`;
  }

  // Shown after Add to cart: what was added, next steps and a binding wire suggestion
  function addedSheet(addedLines) {
    const lines = cartLinesWithRates();
    const tTmt = tmtT(lines);
    const hasWire = lines.some(l => l.variantId.startsWith('wire'));
    const wireKg = Math.max(5, Math.ceil(tTmt * 9 / 5) * 5);
    const amt = lines.reduce((a, l) => a + l.qty * l.rate, 0);
    psheet(`<div class="added">
      <div class="row" style="gap:10px"><span class="okdot">${ic.check}</span><div><h3>Added to cart</h3><span class="small muted">${addedLines.map(l => `${l.label} ${l.short} · ${KD.lineQty(l)}`).join(', ')}</span></div></div>
      <div class="row between small" style="margin:14px 0 4px"><span>${lines.length} item${lines.length > 1 ? 's' : ''} in cart</span><b>${KD.inr(amt)} + GST</b></div>
      ${tTmt && tTmt < KD.MIN_TMT_T ? `<div class="note warn" style="margin-top:8px"><span>!</span><span>Add ${KD.tFmt(KD.roundQty(KD.MIN_TMT_T - tTmt, 't'))} more TMT to reach the ${KD.tFmt(KD.MIN_TMT_T)} minimum.</span></div>` : ''}
      ${tTmt && !hasWire ? `<div class="suggest">
        <div class="grow"><b class="small">Need binding wire?</b><div class="small muted">Commonly 8 to 10 kg per tonne of TMT. For your ${KD.tFmt(tTmt)}, about ${wireKg} kg. Check with your engineer.</div></div>
        <button class="btn soft sm" data-act="addWire" data-kg="${wireKg}">Add ${wireKg} kg</button>
      </div>` : ''}
      <div class="row" style="margin-top:16px;gap:10px">
        <button class="btn ghost grow" data-act="keepShopping">Continue shopping</button>
        <button class="btn grow" data-act="viewCart">View cart</button>
      </div>
    </div>`);
  }

  function vOrders() {
    const orders = S().orders;
    return `${topbar('My orders', '#/home')}
    <div class="screen pad">
      ${orders.length ? `<div class="olist">${orders.map(o => {
        const done = o.shipments.filter(sh => ['delivered', 'settled'].includes(sh.status)).length;
        return `<button class="card ocard" data-act="go" data-to="#/order/${o.id}">
          <div class="row between"><b>${o.id}</b><b>${KD.inr(o.paid)}</b></div>
          <div class="small muted" style="margin:4px 0 8px">${KD.date(o.at)} · ${esc(o.site.name)}</div>
          <div class="row" style="flex-wrap:wrap">${o.shipments.map(statusPill).join('')}<span class="small muted">${done}/${o.shipments.length} delivered</span></div>
        </button>`;
      }).join('')}</div>` : `<div style="text-align:center;padding-top:60px"><b>No orders yet</b><p class="small muted" style="margin-top:6px">Your orders and deliveries will show here.</p></div>`}
    </div>${nav('orders')}`;
  }

  function vAccount() {
    const s = S();
    return `${topbar('Account', '#/home')}
    <div class="screen pad">
      <div class="card pad row" style="gap:12px">
        <div class="success-ic" style="margin:0;width:48px;height:48px;background:var(--brand-soft);color:var(--brand)">${ic.user}</div>
        <div><b>${esc(s.user ? s.user.name : '')}</b><p class="small muted">+91 98220 12345</p></div>
      </div>
      <div class="section-title">My sites</div>
      <div class="card">
        ${s.sites.map(x => `<div class="listrow">${ic.pin}<div class="grow"><b class="small">${esc(x.name)}</b><div class="small muted">${esc(x.area)} · ${zoneName(x.zone)}</div></div>${x.id === s.activeSite ? '<span class="pill good">Active</span>' : ''}</div>`).join('')}
        <button class="listrow" data-act="go" data-to="#/site"><b class="small" style="color:var(--brand)">+ Add another site</b></button>
      </div>
      <div class="section-title">Language ${q(12)}</div>
      <div class="chips"><button class="chip on">English</button><button class="chip" disabled>ಕನ್ನಡ · planned</button><button class="chip" disabled>हिंदी · planned</button></div>
      <div class="section-title">Help</div>
      <div class="card">
        <div class="listrow"><div class="grow small">Call support</div>${ic.chevron}</div>
        <div class="listrow"><div class="grow small">Refund and cancellation policy</div>${ic.chevron}</div>
        <div class="listrow"><div class="grow small">Terms of use</div>${ic.chevron}</div>
      </div>
      <p class="small muted" style="text-align:center;margin:18px 0">Kamdhenu App · Operated by Mohit Ispat Ltd ${q(11)}</p>
      <button class="btn ghost block" data-act="reset">Sign out and reset demo</button>
    </div>${nav('account')}`;
  }

  /* ---------- sheets ---------- */
  function invoiceSheet(o, sh) {
    const d = KD.dealer(sh.dealerId);
    const hsn = id => ({ tmt: '7214', wire: '7217', nails: '7317' }[id.split('-')[0]]);
    const half = sh.final.gst / 2;
    psheet(`<div class="invoice">
      <div class="row between"><h3>Tax invoice</h3><span class="pill">${d.id.toUpperCase()}/26-27/0${412 + sh.n}</span></div>
      <div class="inv-grid">
        <div><b>Sold by</b><br>${esc(d.name)}<br>${esc(d.area)}, Goa<br>GSTIN ${d.gstin}</div>
        <div><b>Bill to / ship to</b><br>${esc(o.user ? o.user.name : '')}<br>${esc(o.site.addr)}<br>${esc(o.site.area)}</div>
      </div>
      <table><thead><tr><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>
        ${sh.lines.map(i => { const l = o.lines[i]; return `<tr><td>${esc(l.name)} ${esc(l.label)}</td><td>${hsn(l.variantId)}</td><td>${KD.qtyFmt(sh.actual[i], l.unit)}</td><td>${KD.inr2(l.rate)}</td><td>${KD.inr2(l.rate * sh.actual[i])}</td></tr>`; }).join('')}
        <tr><td colspan="4">Taxable value</td><td>${KD.inr2(sh.final.material)}</td></tr>
        <tr><td colspan="4">CGST 9%</td><td>${KD.inr2(half)}</td></tr>
        <tr><td colspan="4">SGST 9%</td><td>${KD.inr2(half)}</td></tr>
        <tr><td colspan="4">Delivery charges</td><td>${KD.inr2(sh.final.delivery)}</td></tr>
        <tr><td colspan="4"><b>Invoice total</b></td><td><b>${KD.inr2(sh.final.total)}</b></td></tr>
      </tbody></table>
      <p class="muted" style="margin-top:10px">Place of supply: Goa (30).${sh.ewb ? ` E-way bill ${sh.ewb}.` : ''} Order ${o.id} placed through the Kamdhenu App, operated by Mohit Ispat Ltd. Invoice issued by the dealer.</p>
      <div class="row" style="margin-top:14px"><button class="btn ghost grow" data-act="closeSheet">Close</button><button class="btn grow" data-act="toast" data-msg="PDF download works in the live app">Download PDF</button></div>
    </div>`);
  }

  function issueSheet(o, sh) {
    psheet(`<h3>Report an issue</h3>
      <p class="small muted" style="margin:4px 0 12px">Within 24 hours of delivery. The dealer payout stays on hold until our team resolves it.</p>
      <div class="radio-list">
        ${['Short delivery', 'Damaged material', 'Wrong size delivered', 'Other'].map((t, i) => `<label><input type="radio" name="itype" value="${t}" ${i === 0 ? 'checked' : ''}>${t}</label>`).join('')}
      </div>
      <div class="field" style="margin-top:12px"><label>Details</label><textarea class="input" id="idetail" rows="3">12 mm bars counted 4 fewer than the slip.</textarea></div>
      <div class="upload">+ Add photos (required)<br><span class="small">2 photos attached</span></div>
      <div class="row" style="margin-top:14px"><button class="btn ghost grow" data-act="closeSheet">Cancel</button><button class="btn grow" data-act="submitIssue" data-o="${o.id}" data-s="${sh.id}">Submit</button></div>`);
  }

  function sitesSheet() {
    const s = S();
    psheet(`<h3>Deliver to</h3>
      <div class="card" style="margin-top:12px;box-shadow:none;border:1px solid var(--line)">
        ${s.sites.map(x => `<button class="listrow" data-act="useSite" data-id="${x.id}">${ic.pin}<div class="grow"><b class="small">${esc(x.name)}</b><div class="small muted">${esc(x.area)} · ${zoneName(x.zone)}</div></div>${x.id === s.activeSite ? '<span class="pill good">Active</span>' : ''}</button>`).join('')}
      </div>
      <p class="small muted" style="margin-top:10px">Each site gets its own nearest dealer and zone price.</p>
      <button class="btn block" style="margin-top:12px" data-act="addSite">+ Add a new site</button>`);
  }

  /* ---------- render ---------- */
  function render() {
    const s = S();
    let { view, arg } = route();
    if (!s.user && !['login', 'otp'].includes(view)) view = 'login';
    else if (s.user && !s.sites.length && view !== 'site') view = 'site';
    else if (s.user && ['login', 'otp', ''].includes(view)) view = 'home';
    const views = {
      login: vLogin, otp: vOtp, site: vSite, home: vHome,
      product: () => vProduct(arg), cart: vCart, checkout: vCheckout,
      order: () => vOrder(arg), orders: vOrders, account: vAccount, paid: () => vPaid(arg),
      search: vSearch, alerts: vAlerts,
    };
    const here = '#/' + view + (arg ? '/' + arg : '');
    if (view === 'paid') hist.splice(0, hist.length, '#/home');
    // the payment screen is a one-off: never return to it with Back
    else if ((hist[hist.length - 1] || '').startsWith('#/paid/')) hist.pop();
    if (['login', 'otp', 'site'].includes(view) && !s.sites.length) hist.length = 0;
    track(here);
    const keep = app.querySelector('.screen');
    const sameView = render.last === view + '/' + arg;
    const scroll = sameView && keep ? keep.scrollTop : 0;
    const keepers = sameView ? [...app.querySelectorAll('.psheet-backdrop.open, .toast, .overlay')] : [];
    app.innerHTML = (views[view] || vHome)();
    keepers.forEach(k => app.appendChild(k));
    const scr = app.querySelector('.screen');
    if (scr) scr.scrollTop = scroll;
    render.last = view + '/' + arg;
    renderNotes(view);
    syncPresenter();
    if (view === 'search' && !sameView) { const b = document.getElementById('searchBox'); if (b) b.focus(); }
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
    if (a === 'back') return back(el.dataset.to);
    if (a === 'alerts') {
      ui.alertsSeenAtOpen = S().alertsSeen || 0;
      commit(s => { s.alertsSeen = Date.now(); });
      return go('#/alerts');
    }
    if (a === 'keepShopping') { closeSheet(); return go('#/home'); }
    if (a === 'viewCart') { closeSheet(); return go('#/cart'); }
    if (a === 'addWire') {
      const kg = +el.dataset.kg;
      commit(s => {
        const ex = s.cart.find(l => l.variantId === 'wire-20');
        if (ex) ex.qty += kg;
        else s.cart.push({ variantId: 'wire-20', name: 'Binding Wire', label: '20 gauge', qty: kg, unit: 'kg', mode: 'kg', rate: KD.rateFor('wire-20', site().zone) });
      });
      app.querySelector('.suggest').outerHTML = `<div class="note good" style="margin-top:12px"><span>✓</span><span>${kg} kg binding wire added.</span></div>`;
      return;
    }
    if (a === 'cq') {
      commit(s => {
        const l = s.cart[+el.dataset.i];
        const d = +el.dataset.d;
        const stepBy = l.unit === 't' ? (l.mode === 'kg' ? 0.05 : 0.1) : { bag: 1, kg: 5 }[l.unit];
        l.qty = Math.max(0, KD.roundQty(l.qty + d * stepBy, l.unit));
        if (!l.qty) s.cart.splice(+el.dataset.i, 1);
      });
      return;
    }
    if (a === 'reorder') {
      const o = S().orders.find(x => x.id === el.dataset.o);
      commit(s => {
        o.lines.forEach(l => {
          const ex = s.cart.find(c => c.variantId === l.variantId);
          if (ex) ex.qty = KD.roundQty(ex.qty + l.qty, l.unit);
          else s.cart.push({ ...l, rate: KD.rateFor(l.variantId, site().zone) });
        });
      });
      toast('Items added to your cart at today\'s prices');
      return go('#/cart');
    }
    if (a === 'askCancel') {
      const { sh } = KD.find(S(), el.dataset.s);
      return psheet(`<h3>Cancel this shipment?</h3>
        <p class="small muted" style="margin:6px 0 14px">The dealer has not dispatched it yet, so you get a full refund of ${KD.inr(sh.quote.total)} to your original payment method within 5 to 7 working days.</p>
        <div class="row" style="gap:10px"><button class="btn ghost grow" data-act="closeSheet">Keep it</button><button class="btn grow" data-act="cancel" data-o="${el.dataset.o}" data-s="${el.dataset.s}">Yes, cancel</button></div>`);
    }
    if (a === 'q') { e.stopPropagation(); return openQ(el.dataset.n); }
    if (a === 'closeq') return document.getElementById('qsheet').classList.remove('open');
    if (a === 'closeSheet') return closeSheet();
    if (a === 'toast') return toast(el.dataset.msg);
    if (a === 'reset') { KD.reset(); Object.assign(ui, { draft: {}, mode: 't', pay: 'upi' }); return go('#/login'); }
    if (a === 'verify') {
      const name = document.getElementById('userName').value.trim() || 'Customer';
      commit(s => { s.user = { name, phone: '+91 98220 12345' }; });
      return go(S().sites.length ? '#/home' : '#/site');
    }
    if (a === 'saveSite') {
      const val = id => document.getElementById(id).value.trim();
      commit(s => {
        const id = 'site' + (s.sites.length + 1);
        s.sites.push({ id, name: val('siteName') || 'My site', addr: val('siteAddr'), area: 'Navelim, Margao', pincode: '403707', zone: 'sgoa', contact: val('scName'), contactPhone: val('scPhone') });
        s.activeSite = id;
      });
      return go('#/home');
    }
    if (a === 'sites') return sitesSheet();
    if (a === 'useSite') { commit(s => { s.activeSite = el.dataset.id; }); closeSheet(); return render(); }
    if (a === 'addSite') { closeSheet(); return go('#/site'); }
    if (a === 'mode') {
      // convert drafts between tonnes and kg so the quantity stays the same
      const p = KD.products[0];
      const to = el.dataset.m;
      if (to !== ui.mode) {
        p.variants.forEach(v => {
          const val = +ui.draft[v.id];
          if (!val) return;
          ui.draft[v.id] = to === 'kg' ? Math.round(val * 1000) : KD.roundQty(val / 1000, 't');
        });
        ui.mode = to;
      }
      return render();
    }
    if (a === 'step') {
      const cur = +ui.draft[el.dataset.v] || 0;
      ui.draft[el.dataset.v] = Math.max(0, KD.roundQty(cur + +el.dataset.d, 't')) || '';
      const input = app.querySelector(`[data-qty="${el.dataset.v}"]`);
      if (input) input.value = ui.draft[el.dataset.v];
      return refreshProductFooter(KD.variant(el.dataset.v).product);
    }
    if (a === 'addCart') {
      const p = KD.products.find(x => x.id === el.dataset.p);
      const st = site();
      let added = 0;
      commit(s => {
        p.variants.forEach(v => {
          const qty = draftKg(v, p);
          if (!qty) return;
          const mode = p.unit === 't' ? ui.mode : p.unit;
          const existing = s.cart.find(l => l.variantId === v.id);
          if (existing) { existing.qty = KD.roundQty(existing.qty + qty, p.unit); existing.mode = mode; }
          else s.cart.push({ variantId: v.id, name: p.name.replace(' (5 kg bag)', ''), label: v.label, qty, unit: p.unit, mode, rate: KD.rateFor(v.id, st.zone) });
          added++;
        });
      });
      const addedLines = p.variants.filter(v => draftKg(v, p)).map(v => ({ label: v.label, short: p.short, qty: draftKg(v, p), unit: p.unit, mode: p.unit === 't' ? ui.mode : p.unit }));
      p.variants.forEach(v => { delete ui.draft[v.id]; });
      render();
      return addedSheet(addedLines);
    }
    if (a === 'rm') { commit(s => { s.cart.splice(+el.dataset.i, 1); }); return render(); }
    if (a === 'pay') { ui.pay = el.dataset.m; return render(); }
    if (a === 'emi') { ui.emi = +el.dataset.m; return render(); }
    if (a === 'placeOrder') {
      const ov = document.createElement('div');
      ov.className = 'overlay';
      ov.innerHTML = '<div><div class="spinner"></div><b>Processing payment</b><p class="small muted">Secure payment gateway</p></div>';
      app.appendChild(ov);
      setTimeout(() => go('#/paid/' + placeOrder()), 1400);
      return;
    }
    if (a === 'advance') { advance(el.dataset.o, el.dataset.s); return; }
    if (a === 'cancel') {
      closeSheet();
      commit(s => {
        const sh = s.orders.find(x => x.id === el.dataset.o).shipments.find(x => x.id === el.dataset.s);
        sh.status = 'cancelled';
        KD.log(sh, `Cancelled by customer before dispatch. Full refund of ${KD.inr(sh.quote.total)} initiated`, 'customer');
      });
      return toast('Shipment cancelled. Full refund initiated.');
    }
    if (a === 'invoice' || a === 'issue') {
      const o = S().orders.find(x => x.id === el.dataset.o);
      const sh = o.shipments.find(x => x.id === el.dataset.s);
      return a === 'invoice' ? invoiceSheet(o, sh) : issueSheet(o, sh);
    }
    if (a === 'submitIssue') {
      const type = (app.querySelector('input[name="itype"]:checked') || {}).value || 'Other';
      const note = (document.getElementById('idetail') || {}).value || '';
      commit(s => {
        const sh = s.orders.find(x => x.id === el.dataset.o).shipments.find(x => x.id === el.dataset.s);
        sh.issue = { type, note, at: Date.now(), status: 'open' };
        KD.log(sh, `Customer reported: ${type}. Payout on hold`, 'customer');
      });
      closeSheet();
      return toast('Issue reported. Our team will call you.');
    }
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'searchBox') {
      ui.term = e.target.value;
      document.getElementById('searchResults').innerHTML = searchResults(ui.term);
      return;
    }
    const id = e.target.dataset && e.target.dataset.qty;
    if (!id) return;
    ui.draft[id] = e.target.value.replace(/[^\d.]/g, '');
    refreshProductFooter(KD.variant(id).product);
  });

  document.getElementById('presenterSwitch').addEventListener('click', () => {
    commit(s => { s.presenter = !s.presenter; });
  });

  KD.startTicker();
  window.addEventListener('hashchange', render);
  window.addEventListener('kd:state', render);
  render();
})();
