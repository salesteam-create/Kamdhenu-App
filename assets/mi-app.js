/* Kamdhenu Ordering App (B2B) prototype: dealer and distributor mobile app */
(() => {
  const app = document.getElementById('app');
  const esc = MI.esc;
  const S = () => MI.load();
  const params = new URLSearchParams(location.search);
  const ROLE = params.get('as') === 'distributor' ? 'distributor' : 'dealer';
  const ME = { role: ROLE, id: ROLE === 'distributor' ? 'D1' : 'R1' };
  const isDist = ROLE === 'distributor';
  const SIGNED = 'mi-signed-' + ROLE;

  // UI-only state
  const ui = {
    route: 'direct', type: 'full', tonnes: 10, split: {}, splitNow: false, termId: 'd7',
    edit: {}, combine: { picked: null, own: 0, manual: [] }, bank: 'SBI',
  };

  /* ---------- small helpers ---------- */
  const signedIn = () => { try { return sessionStorage.getItem(SIGNED) === '1'; } catch (e) { return ui.signed; } };
  const setSigned = v => { ui.signed = v; try { v ? sessionStorage.setItem(SIGNED, '1') : sessionStorage.removeItem(SIGNED); } catch (e) { /* ignore */ } };
  const presenterOn = () => { try { return localStorage.getItem('mi-presenter') !== '0'; } catch (e) { return true; } };
  const setPresenter = v => { try { localStorage.setItem('mi-presenter', v ? '1' : '0'); } catch (e) { /* ignore */ } syncPresenter(); };
  const go = h => { location.hash = h; };
  const route = () => { const p = (location.hash.replace(/^#\/?/, '') || '').split('/'); return { view: p[0] || '', arg: p[1] }; };
  const myState = () => MI.stateOf(ME);
  const meName = () => MI.who(ME.id);
  const myDist = () => isDist ? MI.distributor('D1') : MI.distributor(MI.dealer(ME.id).distributorId);
  const blankSplit = () => Object.fromEntries(MI.SIZES.map(k => [k, 0]));

  const ic = {
    back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    list: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    plus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    users: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.7c2 .6 3.5 2.4 3.5 5.3"/></svg>',
    wallet: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/></svg>',
    user: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
    bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
    truck: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4h14v12H1z"/><path d="M15 9h4l3 3v4h-7"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>',
    phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    check: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    down: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    up: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  };

  /* ---------- points to confirm (C pins) ---------- */
  const c = (...ns) => `<span class="qpins">${ns.map(n => `<button class="qpin" data-act="q" data-n="${n}" title="Point to confirm C${n}">C${n}</button>`).join('')}</span>`;
  const screenQs = {
    login: ['Sign in', []], otp: ['Verify OTP', []],
    home: ['Home', [13, 1, 9, 2, 14]],
    new: ['Place order', [5, 15, 11, 1, 10, 13]],
    orders: ['My orders', [6]],
    order: ['Order tracking', [3, 4, 12, 10, 16, 11]],
    split: ['Size split', [11, 9]],
    payments: ['Payments', [2, 14, 16, 10]],
    dealers: ['Dealer requests', [7, 5]],
    combine: ['Combined order', [7, 1, 11]],
    alerts: ['Notifications', []],
    account: ['Account', [8]],
  };
  function renderNotes(view) {
    const [name, qs] = screenQs[view] || ['', []];
    document.getElementById('screenName').textContent = name;
    document.getElementById('roleName').textContent = isDist ? 'Distributor app' : 'Dealer app';
    document.getElementById('notesBody').innerHTML = qs.length
      ? qs.map(n => { const x = MI.questions[n - 1]; return `<div class="q-item"><b><span class="qnum">C${n}</span>${esc(x.title)}</b><p>${esc(x.ask)}</p><p class="ask"><b>Assumed:</b> ${esc(x.assume)}</p></div>`; }).join('')
      : '<p class="small muted">Nothing to confirm on this screen.</p>';
  }
  function openQ(n) {
    const x = MI.questions[n - 1];
    document.getElementById('qsheetBody').innerHTML = `<div class="q-label">Point to confirm C${n}</div><h3>${esc(x.title)}</h3>
      <p>${esc(x.ask)}</p><div class="q-ask"><b>Prototype assumption:</b> ${esc(x.assume)}</div>
      <button class="btn block" style="margin-top:16px" data-act="closeq">Got it</button>`;
    document.getElementById('qsheet').classList.add('open');
  }
  function syncPresenter() {
    const on = presenterOn();
    document.body.classList.toggle('presenter', on);
    document.getElementById('presenterSwitch').classList.toggle('on', on);
    document.getElementById('notes').style.display = on ? '' : 'none';
  }

  /* ---------- shell ---------- */
  const hist = [];
  const track = h => { if (hist[hist.length - 1] === h) return; if (hist[hist.length - 2] === h) hist.pop(); else hist.push(h); };
  const back = fb => go(hist.length > 1 ? hist[hist.length - 2] : fb);
  const topbar = (title, fallback, extra = '') => `<div class="topbar">${fallback ? `<button class="iconbtn" data-act="back" data-to="${fallback}" aria-label="Back">${ic.back}</button>` : ''}<h2>${title}</h2>${extra}</div>`;
  function nav(active) {
    const reqs = isDist ? S().requests.filter(r => r.status === 'pending' && MI.dealer(r.dealerId).distributorId === ME.id).length : 0;
    const due = myOrders().filter(o => o.by.id === ME.id && ['due_soon', 'overdue'].includes(MI.payState(o))).length;
    const tab = (key, icon, label, badge) => `<button class="${active === key ? 'on' : ''}" data-act="go" data-to="#/${key}">${icon}${label}${badge ? `<span class="badge">${badge}</span>` : ''}</button>`;
    return `<nav class="bottomnav five">
      ${tab('home', ic.home, 'Home')}
      ${tab('orders', ic.list, 'Orders')}
      <button class="fab" data-act="go" data-to="#/new" aria-label="New order">${ic.plus}</button>
      ${isDist ? tab('dealers', ic.users, 'Dealers', reqs) : tab('payments', ic.wallet, 'Payments', due)}
      ${isDist ? tab('payments', ic.wallet, 'Payments', due) : tab('account', ic.user, 'Account')}
    </nav>`;
  }
  function toast(msg) {
    let t = app.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; app.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toast.tm); toast.tm = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function psheet(html) {
    let b = app.querySelector('.psheet-backdrop');
    if (!b) { b = document.createElement('div'); b.className = 'psheet-backdrop'; app.appendChild(b); }
    b.innerHTML = `<div class="psheet"><div class="grab"></div>${html}</div>`;
    b.classList.add('open');
  }
  const closeSheet = () => { const b = app.querySelector('.psheet-backdrop'); if (b) b.classList.remove('open'); };

  /* ---------- data views ---------- */
  const myOrders = () => MI.ordersFor(ME);
  const isMine = o => o.by.id === ME.id;
  const myPart = o => (o.parts || []).find(p => p.dealerId === ME.id);
  const payPill = o => ({
    paid: '<span class="pill good">Paid</span>', overdue: '<span class="pill brand">Overdue</span>',
    due_soon: '<span class="pill warn">Due soon</span>', open: '<span class="pill">Unpaid</span>',
  }[MI.payState(o)]);
  const statusPill = o => {
    const l = MI.statusLabel(o);
    const cls = { Delivered: 'good', 'Awaiting size split': 'warn', 'Awaiting distributor': 'warn', Cancelled: '', Booked: 'info', Confirmed: 'info', 'Ready for dispatch': 'info' }[l];
    return `<span class="pill ${cls == null ? 'brand' : cls}">${l}</span>`;
  };
  const termRates = st => S().terms.map(t => ({ ...t, r: MI.rate(MI.priceToday(st).value, t.id) }));

  /* ---------- screens ---------- */
  function vLogin() {
    return `<div class="screen">
      <div class="login-hero ${isDist ? 'dealer' : ''}">
        <div class="wordmark"><span class="mark">K</span><span>Kamdhenu Ordering<small>by Mohit Ispat</small></span></div>
        <h1>Book Kamdhenu TMT at today's price.</h1>
        <p>Daily price, payment terms, size split and truck tracking in one place.</p>
        <div class="trust"><div>Daily price alert</div><div>Lock price, add sizes later</div><div>Track every truck</div></div>
      </div>
      <div class="pad">
        <div class="field"><label>Registered mobile number</label>
          <div class="phone-input"><span>+91</span><input inputmode="numeric" value="${isDist ? '98230 11223' : '98221 55667'}"></div>
        </div>
        <button class="btn block lg" data-act="go" data-to="#/otp">Get OTP</button>
        <p class="small muted" style="text-align:center;margin-top:16px">Your number is matched with Mohit Ispat's ${isDist ? 'distributor' : 'dealer'} list. New numbers are approved by Mohit Ispat.</p>
      </div>
    </div>`;
  }
  function vOtp() {
    return `${topbar('Verify your number', '#/login')}
    <div class="screen pad">
      <p class="muted">Enter the 4-digit code sent to your mobile</p>
      <div class="otp"><input value="5" maxlength="1"><input value="2" maxlength="1"><input value="7" maxlength="1"><input value="3" maxlength="1"></div>
      <div class="card pad small" style="margin-bottom:14px"><b>${esc(meName())}</b><div class="muted">${isDist ? `Distributor · ${esc(myDist().city)}, ${esc(myDist().state)}` : `Dealer · ${esc(MI.dealer(ME.id).area)} · supplied by ${esc(myDist().name)}`}</div></div>
      <button class="btn block lg" data-act="signin">Verify and continue</button>
    </div>`;
  }

  function priceCard() {
    const st = myState();
    const p = MI.priceToday(st);
    const diff = p.prev ? p.value - p.prev : 0;
    return `<div class="pricecard">
      <div class="row between"><span class="tag">Today's price · ${esc(st)} ${c(13, 9)}</span><span class="small" style="opacity:.75">${p.isToday ? `Published ${MI.time(p.at)}` : `Last published ${MI.date(p.at)}`}</span></div>
      <div class="row" style="align-items:baseline;gap:10px;margin-top:6px"><span class="big">${MI.inr(p.value)}</span><span class="small" style="opacity:.8">per tonne + GST</span></div>
      ${diff ? `<div class="chg ${diff < 0 ? 'down' : 'up'}">${diff < 0 ? ic.down : ic.up} ${MI.inr(Math.abs(diff))} vs yesterday${diff < 0 ? '. A good day to book' : ''}</div>` : ''}
      <div class="terms">${termRates(st).map(t => `<div><span>${t.label}</span><b>${MI.inr(t.r)}</b></div>`).join('')}</div>
      <div class="row" style="justify-content:space-between;margin-top:12px"><span class="small" style="opacity:.75">Delivered price, freight included ${c(1)}</span><button class="btn sm light" data-act="go" data-to="#/new">Book now</button></div>
    </div>`;
  }

  function attention() {
    const out = [];
    const mine = myOrders().filter(isMine);
    mine.filter(o => o.payment.status !== 'paid' && ['due_soon', 'overdue'].includes(MI.payState(o))).forEach(o => {
      const od = MI.payState(o) === 'overdue';
      out.push(`<div class="alertcard ${od ? 'red' : 'amber'}"><div class="grow"><b>${od ? 'Payment overdue' : 'Payment due soon'} · ${o.id}</b><div class="small">${MI.inr(MI.amount(o))} due ${MI.date(MI.dueAt(o))} ${c(od ? 14 : 2)}</div></div><button class="btn sm" data-act="paynow" data-o="${o.id}">Pay now</button></div>`);
    });
    mine.filter(o => o.type === 'lumpsum' && MI.needsSplit(o) && o.status !== 'cancelled').forEach(o => {
      out.push(`<div class="alertcard amber"><div class="grow"><b>Add sizes for ${o.id}</b><div class="small">${MI.tFmt(o.tonnes - MI.splitTotal(o.split))} still to split. Cut-off ${MI.date(MI.cutoffAt(o))} ${c(11)}</div></div><button class="btn sm ghost" data-act="go" data-to="#/split/${o.id}">Add sizes</button></div>`);
    });
    if (isDist) {
      const n = S().requests.filter(r => r.status === 'pending' && MI.dealer(r.dealerId).distributorId === ME.id).length;
      if (n) out.push(`<div class="alertcard blue"><div class="grow"><b>${n} dealer request${n > 1 ? 's' : ''} waiting</b><div class="small">Approve and combine them into one order</div></div><button class="btn sm ghost" data-act="go" data-to="#/dealers">Review</button></div>`);
    }
    return out.join('');
  }

  function orderCard(o) {
    const part = !isMine(o) && myPart(o);
    const who = isMine(o) ? '' : part ? `Your ${MI.tFmt(part.tonnes)}, in a combined order by ${esc(MI.who(o.by.id))}` : `Placed by ${esc(MI.who(o.by.id))} · view only`;
    const disp = MI.dispatchedT(o);
    return `<button class="card ocard" data-act="go" data-to="#/order/${o.id}">
      <div class="row between"><b>${o.id} · ${MI.tFmt(o.tonnes)}</b>${statusPill(o)}</div>
      <div class="small muted" style="margin:4px 0 8px">${MI.date(o.placedAt)} · ${o.type === 'lumpsum' ? 'Lump-sum' : 'Full order'}${o.path === 'combined' ? ' · Combined' : ''} · ${MI.inr(MI.lockedRate(o))}/t ${esc(MI.term(o.termId).label)}</div>
      ${who ? `<div class="small" style="margin-bottom:8px">${who}</div>` : ''}
      ${disp ? `<div class="bar"><i style="width:${Math.min(100, MI.deliveredT(o) / o.tonnes * 100)}%"></i><i class="b2" style="width:${Math.min(100, (disp - MI.deliveredT(o)) / o.tonnes * 100)}%"></i></div><div class="small muted" style="margin-top:4px">${MI.tFmt(MI.deliveredT(o))} delivered · ${MI.tFmt(MI.pendingT(o))} pending</div>` : ''}
      ${isMine(o) ? `<div class="row" style="margin-top:8px">${payPill(o)}<span class="small muted">Due ${MI.date(MI.dueAt(o))}</span></div>` : ''}
    </button>`;
  }

  function vHome() {
    const s = S();
    const active = myOrders().filter(o => !['delivered', 'cancelled'].includes(o.status)).slice(0, 3);
    const unread = MI.unreadFor(ME);
    return `<div class="screen">
      <div class="home-head">
        <div class="row between">
          <div class="wordmark"><span class="mark">K</span><span>Kamdhenu Ordering</span></div>
          <div class="row" style="gap:2px">
            <button class="iconbtn badgebtn" data-act="alerts" aria-label="Notifications">${ic.bell}${unread ? `<span class="badge">${unread}</span>` : ''}</button>
            ${isDist ? `<button class="iconbtn" data-act="go" data-to="#/account" aria-label="Account">${ic.user}</button>` : ''}
          </div>
        </div>
        <div class="hello"><b>${esc(meName())}</b><span>${isDist ? `Distributor · ${esc(myDist().city)}` : `Dealer · supplied by ${esc(myDist().name)}`}</span></div>
      </div>
      <div class="pad">
        ${priceCard()}
        ${attention()}
        <div class="section-title">Active orders <button class="linkbtn" data-act="go" data-to="#/orders">All orders ${ic.chevron}</button></div>
        ${active.length ? `<div class="olist">${active.map(orderCard).join('')}</div>` : '<div class="card pad small muted" style="text-align:center">No active orders. Book at today\'s price.</div>'}
        ${s.prices ? `<div class="section-title">Price last 7 days</div>${sparkline()}` : ''}
      </div>
    </div>${nav('home')}`;
  }

  function sparkline() {
    const st = myState();
    const list = S().prices.filter(p => p.state === st).sort((a, b) => a.at - b.at).slice(-8);
    const vals = list.map(p => p.value);
    const lo = Math.min(...vals) - 100, hi = Math.max(...vals) + 100;
    const W = 320, H = 70;
    const x = i => 10 + i * (W - 20) / (list.length - 1);
    const y = v => H - 10 - (v - lo) / (hi - lo) * (H - 22);
    const pts = list.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
    const last = list[list.length - 1];
    return `<div class="card pad">
      <svg viewBox="0 0 ${W} ${H + 14}" class="spark" role="img" aria-label="Price trend">
        <polyline points="${pts}" fill="none" stroke="var(--brand)" stroke-width="2"/>
        ${list.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="${i === list.length - 1 ? 4 : 2.5}" fill="${i === list.length - 1 ? 'var(--brand)' : '#fff'}" stroke="var(--brand)" stroke-width="1.5"/>`).join('')}
        <text x="${x(0)}" y="${H + 12}" font-size="10" fill="var(--ink-3)">${MI.date(list[0].at)}</text>
        <text x="${x(list.length - 1)}" y="${H + 12}" font-size="10" fill="var(--ink-3)" text-anchor="end">Today ${MI.inr(last.value)}</text>
      </svg>
    </div>`;
  }

  /* place order */
  function newTotals() {
    const st = myState();
    const p = MI.priceToday(st);
    const r = MI.rate(p.value, ui.termId);
    const t = +ui.tonnes || 0;
    return { p, r, t, amt: MI.amountFor(t, ui.split, r), splitT: MI.splitTotal(ui.split) };
  }
  function splitRows(split, max) {
    return `<div class="vrows">${MI.SIZES.map(k => `<div class="vrow">
        <div><b>${k} mm</b>${+S().settings.sizeExtra[k] ? `<div class="meta">+ ${MI.inr(S().settings.sizeExtra[k])}/t size extra</div>` : ''}</div>
        <div class="qty"><button data-act="sstep" data-k="${k}" data-d="-1" aria-label="Less">−</button><input data-split="${k}" inputmode="decimal" value="${+split[k] || ''}" placeholder="0"><span class="u">t</span><button data-act="sstep" data-k="${k}" data-d="1" aria-label="More">+</button></div>
      </div>`).join('')}</div>
      <div class="splitbar" id="splitBar">${splitBarHtml(split, max)}</div>`;
  }
  function splitBarHtml(split, max) {
    const tot = MI.splitTotal(split);
    const over = tot > max + 1e-9;
    const done = Math.abs(tot - max) < 1e-9;
    return `<div class="row between small"><span>${over ? `Sizes add up to more than ${MI.tFmt(max)}` : done ? 'All tonnes split by size' : `${MI.tFmt(max - tot)} left to split`}</span><b>${MI.tFmt(tot)} / ${MI.tFmt(max)}</b></div>
      <div class="minbar"><i style="width:${Math.min(100, max ? tot / max * 100 : 0)}%;background:${over ? 'var(--brand)' : done ? 'var(--good)' : 'var(--warn)'}"></i></div>`;
  }

  function vNew() {
    const s = S();
    const { p, r, t, amt, splitT } = newTotals();
    const toDist = !isDist && ui.route === 'dist';
    const needSplit = ui.type === 'full' && !toDist;
    const showSplit = needSplit || (toDist && ui.splitNow);
    const min = s.settings.minOrderT;
    const cutoff = Date.now() + s.settings.cutoffDays * MI.DAY;
    const due = t => Date.now() + MI.term(t.id).days * MI.DAY;
    let problem = '';
    if (t < min) problem = `Minimum order is ${MI.tFmt(min)}`;
    else if (needSplit && Math.abs(splitT - t) > 1e-9) problem = splitT > t ? 'Sizes add up to more than the total' : 'Split all tonnes by size, or switch to lump-sum';
    else if (showSplit && splitT > t + 1e-9) problem = 'Sizes add up to more than the total';
    const rows = termRates(myState());
    return `${topbar('Place order', '#/home')}
    <div class="screen pad">
      ${!isDist ? `<div class="section-title" style="margin-top:0">How do you want to order? ${c(5)}</div>
      <div class="seg" style="margin-bottom:6px">
        <button class="${ui.route === 'direct' ? 'on' : ''}" data-act="route" data-v="direct">Order direct</button>
        <button class="${ui.route === 'dist' ? 'on' : ''}" data-act="route" data-v="dist">Send to my distributor</button>
      </div>
      <p class="small muted" style="margin-bottom:6px">${ui.route === 'direct' ? `Mohit Ispat delivers to you. ${esc(myDist().name)} can see this order.` : `${esc(myDist().name)} combines it with other dealers' orders. The price locks when they place the order.`}</p>` : ''}
      ${!toDist ? `<div class="section-title">Order type ${c(11)}</div>
      <div class="typecards">
        <button class="typecard ${ui.type === 'full' ? 'on' : ''}" data-act="type" data-v="full"><b>Full order</b><span>Total tonnes and sizes now</span></button>
        <button class="typecard ${ui.type === 'lumpsum' ? 'on' : ''}" data-act="type" data-v="lumpsum"><b>Lump-sum booking</b><span>Lock today's price, add sizes later</span></button>
      </div>` : ''}
      <div class="section-title">Total quantity ${c(15)}</div>
      <div class="card pad row between">
        <div><b>Tonnes</b><div class="small muted">Minimum ${MI.tFmt(min)}. Billed on actual loaded weight.</div></div>
        <div class="qty"><button data-act="tstep" data-d="-1" aria-label="Less">−</button><input id="tonnes" inputmode="decimal" value="${ui.tonnes}"><span class="u">t</span><button data-act="tstep" data-d="1" aria-label="More">+</button></div>
      </div>
      ${toDist ? `<label class="checkrow"><input type="checkbox" data-act="splitnow" ${ui.splitNow ? 'checked' : ''}> Add sizes now (optional)</label>` : ''}
      ${showSplit ? `<div class="section-title">Size split</div>${splitRows(ui.split, t)}` : ''}
      ${ui.type === 'lumpsum' && !toDist ? `<div class="note warn" style="margin-top:12px"><span>ℹ</span><span>Add the size split by <b>${MI.date(cutoff)}</b>. The order can be dispatched only once all ${MI.tFmt(t)} are split by size. ${c(11)}</span></div>` : ''}
      ${!toDist ? `<div class="section-title">Payment term ${c(1, 10)}</div>
      <div class="terms-pick">${rows.map(x => `<button class="termopt ${ui.termId === x.id ? 'on' : ''}" data-act="term" data-v="${x.id}">
        <span class="radio"></span><span class="grow"><b>${x.label}</b><span>${x.adj < 0 ? `${MI.inr(-x.adj)}/t off` : `${MI.inr(x.adj)}/t credit charge`} · due ${MI.date(due(x))}</span></span>
        <span class="tr"><b>${MI.inr(x.r)}</b><small>per tonne</small></span></button>`).join('')}</div>
      <div class="card sum" style="margin-top:14px">
        <div><span>Today's price (${esc(myState())})</span><span>${MI.inr(p.value)}/t</span></div>
        <div><span>${esc(MI.term(ui.termId).label)} adjustment</span><span>${MI.term(ui.termId).adj < 0 ? '−' : '+'} ${MI.inr(Math.abs(MI.term(ui.termId).adj))}/t</span></div>
        <div><span>Locked rate</span><b>${MI.inr(r)}/t</b></div>
        <div class="total"><span>Estimated amount</span><span>${MI.inr(amt)} + GST</span></div>
        <p class="small muted">Final bill uses the actual loaded weight. Payment due ${MI.date(Date.now() + MI.term(ui.termId).days * MI.DAY)}. Pay offline, or online by netbanking.</p>
      </div>` : `<div class="card sum" style="margin-top:14px">
        <div><span>Estimated rate today</span><span>${MI.inr(MI.rate(p.value, 'd7'))}/t</span></div>
        <div class="total"><span>Estimated amount</span><span>${MI.inr(t * MI.rate(p.value, 'd7'))} + GST</span></div>
        <p class="small muted">Estimate only. Your distributor picks the payment term and the price locks on the day they place the combined order.</p>
      </div>`}
      ${problem ? `<div class="note warn" style="margin-top:12px"><span>!</span><span>${problem}</span></div>` : ''}
    </div>
    <div class="footerbar"><button class="btn block lg" data-act="place" ${problem ? 'disabled' : ''}>${toDist ? `Send ${MI.tFmt(t)} to distributor` : `Place order · ${MI.tFmt(t)}`}</button></div>`;
  }

  /* orders list */
  function vOrders() {
    const all = myOrders();
    const mine = all.filter(o => isMine(o) || myPart(o));
    const theirs = isDist ? all.filter(o => !isMine(o)) : [];
    const reqs = !isDist ? S().requests.filter(r => r.dealerId === ME.id) : [];
    const tab = ui.otab || 'mine';
    return `${topbar('Orders', '#/home')}
    <div class="screen pad">
      ${isDist ? `<div class="seg" style="margin-bottom:12px"><button class="${tab === 'mine' ? 'on' : ''}" data-act="otab" data-v="mine">My orders</button><button class="${tab === 'theirs' ? 'on' : ''}" data-act="otab" data-v="theirs">Dealers' direct orders</button></div>` : ''}
      ${isDist && tab === 'theirs' ? `<p class="small muted" style="margin-bottom:10px">Orders your dealers placed direct with Mohit Ispat. View only. ${c(5, 6)}</p>
        ${theirs.length ? `<div class="olist">${theirs.map(o => `${orderCard(o)}${o.status === 'pending_dist' ? `<button class="btn good sm block" style="margin:-4px 0 6px" data-act="approveDirect" data-o="${o.id}">Approve ${o.id}</button>` : ''}`).join('')}</div>` : '<div class="card pad small muted">No direct orders from your dealers.</div>'}`
      : `${reqs.length ? `<div class="section-title" style="margin-top:0">Sent to ${esc(myDist().name)}</div><div class="card">${reqs.map(r => `<div class="listrow"><div class="grow"><b class="small">${r.id} · ${MI.tFmt(r.tonnes)}</b><div class="small muted">${MI.date(r.at)} · ${MI.splitTotal(r.split) ? 'sizes added' : 'sizes later'}${r.note ? ` · ${esc(r.note)}` : ''}</div></div>${r.status === 'combined' ? `<button class="linkbtn" data-act="go" data-to="#/order/${r.orderId}">In ${r.orderId} ${ic.chevron}</button>` : `<span class="pill ${r.status === 'approved' ? 'good' : r.status === 'rejected' ? 'brand' : 'warn'}">${{ pending: 'Waiting', approved: 'Approved', rejected: 'Rejected' }[r.status]}</span>`}</div>`).join('')}</div><div class="section-title">My orders</div>` : ''}
        ${mine.length ? `<div class="olist">${mine.map(orderCard).join('')}</div>` : '<div class="card pad small muted">No orders yet.</div>'}`}
    </div>${nav('orders')}`;
  }

  /* order detail */
  function vOrder(id) {
    const s = S();
    const o = MI.order(id);
    if (!o) return `${topbar('Order', '#/orders')}<div class="screen pad">Order not found.</div>`;
    const mine = isMine(o);
    const part = myPart(o);
    const idx = MI.stepIndex(o);
    const cancelled = o.status === 'cancelled';
    const delivered = MI.deliveredT(o), disp = MI.dispatchedT(o), pend = MI.pendingT(o);
    const showPay = mine;
    return `${topbar(o.id, '#/orders', statusPill(o))}
    <div class="screen pad">
      <div class="card pad">
        <div class="row between"><b style="font-size:18px">${MI.tFmt(o.tonnes)}</b><span class="small muted">${MI.dateLong(o.placedAt)}</span></div>
        <div class="small muted" style="margin-top:2px">${o.type === 'lumpsum' ? 'Lump-sum booking' : 'Full order'} · ${o.path === 'combined' ? 'Combined order' : 'Direct order'}${!mine ? ` · placed by ${esc(MI.who(o.by.id))}` : ''}</div>
        ${part && !mine ? `<div class="note" style="margin-top:10px"><span>ℹ</span><span>Your ${MI.tFmt(part.tonnes)} is part of this order. Steel is delivered to ${esc(MI.who(o.by.id))}.</span></div>` : ''}
        ${!mine && !part ? `<div class="note" style="margin-top:10px"><span>ℹ</span><span>View only. Placed direct by your dealer. ${c(5)}</span></div>` : ''}
      </div>
      ${cancelled ? '<div class="note warn" style="margin-top:12px">This order was cancelled by Mohit Ispat.</div>' : `<div class="card" style="margin-top:12px">
        <div class="stepper">${MI.STEPS.map((l, i) => `<div class="${i < idx || o.status === 'delivered' ? 'done' : i === idx ? 'now' : ''}"><i></i>${l}</div>`).join('')}</div>
        ${o.status === 'pending_dist' ? '<p class="small pad" style="padding-top:0">Waiting for your distributor to approve. <span class="muted">(Admin setting)</span></p>' : ''}
        ${MI.needsSplit(o) ? `<div class="pad" style="padding-top:0"><div class="note warn"><span>!</span><span><b>Awaiting size split.</b> ${MI.tFmt(o.tonnes - MI.splitTotal(o.split))} still to split by ${MI.date(MI.cutoffAt(o))}. Dispatch starts once sizes are complete. ${c(11)}</span></div></div>` : ''}
      </div>`}
      ${disp || ['ready', 'dispatching', 'delivered'].includes(o.status) ? `<div class="section-title">Delivery ${c(12)}</div>
      <div class="card pad">
        <div class="tgrid"><div><span>Booked</span><b>${MI.tFmt(o.tonnes)}</b></div><div><span>Dispatched</span><b>${MI.tFmt(disp)}</b></div><div><span>Delivered</span><b>${MI.tFmt(delivered)}</b></div><div><span>Pending</span><b>${MI.tFmt(pend)}</b></div></div>
        <div class="bar" style="margin-top:10px"><i style="width:${Math.min(100, delivered / o.tonnes * 100)}%"></i><i class="b2" style="width:${Math.min(100, (disp - delivered) / o.tonnes * 100)}%"></i></div>
        <p class="small muted" style="margin-top:6px">Complete when delivered weight is within ±${Math.round(s.settings.tolerance * 100)}% of the booked tonnes.</p>
      </div>` : ''}
      ${o.trucks.length ? `<div class="section-title">Trucks ${c(3, 4)}</div>
      <div class="card">${o.trucks.slice().reverse().map(tr => `<div class="truck">
        <div class="row between"><span class="row" style="gap:8px">${ic.truck}<b>${esc(tr.vehicle)}</b></span>${tr.status === 'delivered' ? '<span class="pill good">Received</span>' : '<span class="pill brand">On the way</span>'}</div>
        <div class="small muted">${MI.tFmt(tr.weightT)} loaded · dispatched ${MI.date(tr.at)} ${MI.time(tr.at)}</div>
        <div class="small">${tr.status === 'delivered' ? `Received ${MI.date(tr.deliveredAt)} ${MI.time(tr.deliveredAt)}${tr.by === 'admin' ? ' (marked by Mohit Ispat)' : ''}` : `Expected ${MI.date(tr.eta)}`}</div>
        ${tr.status !== 'delivered' ? `<div class="row" style="margin-top:8px;gap:8px">
          <button class="btn ghost sm" data-act="toast" data-msg="Calls the driver in the live app">${ic.phone} Driver ${esc(tr.driver)}</button>
          ${mine ? `<button class="btn good sm grow" data-act="received" data-o="${o.id}" data-t="${tr.id}">Received</button>` : ''}
        </div>` : ''}
      </div>`).join('')}</div><p class="small muted" style="margin-top:6px">No live GPS. Truck details are updated by Mohit Ispat.</p>` : ''}
      ${o.parts ? `<div class="section-title">Tonnage per dealer</div><div class="card">${o.parts.map(pt => `<div class="listrow"><div class="grow small"><b>${esc(pt.name)}</b>${pt.dealerId === ME.id ? ' <span class="pill info">You</span>' : ''}</div><b class="small">${MI.tFmt(pt.tonnes)}</b></div>`).join('')}</div>` : ''}
      ${!part || mine ? `<div class="section-title">Size split ${mine && MI.canEditSplit(o) ? `<button class="linkbtn" data-act="go" data-to="#/split/${o.id}">Edit sizes ${ic.chevron}</button>` : ''}</div>
      <div class="card pad">${MI.splitTotal(o.split) ? `<div class="sizegrid">${MI.SIZES.filter(k => +o.split[k]).map(k => `<div><span>${k} mm</span><b>${MI.tFmt(+o.split[k])}</b></div>`).join('')}</div>` : '<p class="small muted">No sizes added yet.</p>'}
        <p class="small muted" style="margin-top:8px">${MI.canEditSplit(o) ? `Sizes can be changed until ${MI.date(MI.cutoffAt(o))}.` : 'Size split is locked.'}</p></div>` : ''}
      ${showPay ? `<div class="section-title">Price and payment ${c(10, 16)}</div>
      <div class="card sum">
        <div><span>Price on ${MI.date(o.placedAt)}</span><span>${MI.inr(o.base)}/t</span></div>
        <div><span>${esc(MI.term(o.termId).label)} term</span><span>${MI.term(o.termId).adj < 0 ? '−' : '+'} ${MI.inr(Math.abs(MI.term(o.termId).adj))}/t</span></div>
        <div><span>Locked rate</span><b>${MI.inr(MI.lockedRate(o))}/t</b></div>
        <div><span>${o.status === 'delivered' ? `Final bill (${MI.tFmt(MI.billT(o))} loaded)` : `Estimate on ${MI.tFmt(o.tonnes)}`}</span><b>${MI.inr(MI.amount(o))} + GST</b></div>
        <div class="total"><span>Due ${MI.dateLong(MI.dueAt(o))}</span>${payPill(o)}</div>
        ${o.payment.status === 'paid' ? `<p class="small muted">Paid ${MI.date(o.payment.paidAt)} · ${esc(o.payment.method)}</p>` : `<button class="btn block" data-act="paynow" data-o="${o.id}">Pay now by netbanking</button><p class="small muted">Or pay offline. Mohit Ispat marks it received.</p>`}
      </div>` : ''}
      <div class="section-title">Activity</div>
      <div class="card pad timeline">${o.log.slice().reverse().map(e => `<div><span>${MI.date(e.t)}</span><p>${esc(e.text)}</p></div>`).join('')}</div>
      ${!cancelled && o.status !== 'delivered' && mine ? `<div class="demo-box">
        <div class="small muted" style="margin-bottom:8px">Simulate Mohit Ispat's admin steps</div>
        ${['booked'].includes(o.status) ? `<button class="btn demo sm block" data-act="demo" data-do="confirm" data-o="${o.id}">Demo: admin confirms order</button>` : ''}
        ${o.status === 'confirmed' && !MI.needsSplit(o) ? `<button class="btn demo sm block" data-act="demo" data-do="ready" data-o="${o.id}">Demo: admin marks ready for dispatch</button>` : ''}
        ${['ready', 'dispatching'].includes(o.status) && pend > 0.05 ? `<button class="btn demo sm block" data-act="demo" data-do="truck" data-o="${o.id}">Demo: admin dispatches a truck</button>` : ''}
      </div>` : ''}
    </div>${nav('orders')}`;
  }

  function vSplit(id) {
    const o = MI.order(id);
    if (!ui.edit[id]) ui.edit[id] = { ...o.split };
    const sp = ui.edit[id];
    const over = MI.splitTotal(sp) > o.tonnes + 1e-9;
    return `${topbar(`Sizes for ${o.id}`, `#/order/${o.id}`)}
    <div class="screen pad">
      <p class="small muted" style="margin-bottom:10px">Split ${MI.tFmt(o.tonnes)} by size. You can change this until <b>${MI.date(MI.cutoffAt(o))}</b>. ${c(11, 9)}</p>
      ${splitRows(sp, o.tonnes)}
    </div>
    <div class="footerbar"><button class="btn block lg" data-act="saveSplit" data-o="${o.id}" id="saveSplit" ${over ? 'disabled' : ''}>Save sizes</button></div>`;
  }

  function vPayments() {
    const mine = myOrders().filter(isMine).filter(o => o.status !== 'cancelled');
    const unpaid = mine.filter(o => o.payment.status !== 'paid').sort((a, b) => MI.dueAt(a) - MI.dueAt(b));
    const paid = mine.filter(o => o.payment.status === 'paid');
    const sum = list => list.reduce((a, o) => a + MI.amount(o), 0);
    const overdue = unpaid.filter(o => MI.payState(o) === 'overdue');
    const soon = unpaid.filter(o => MI.payState(o) === 'due_soon');
    return `${topbar('Payments', '#/home')}
    <div class="screen pad">
      <div class="paytiles"><div><span>Outstanding</span><b>${MI.inr(sum(unpaid))}</b></div><div class="${soon.length ? 'amber' : ''}"><span>Due soon ${c(2)}</span><b>${MI.inr(sum(soon))}</b></div><div class="${overdue.length ? 'red' : ''}"><span>Overdue ${c(14)}</span><b>${MI.inr(sum(overdue))}</b></div></div>
      ${overdue.length ? `<div class="note warn" style="margin-top:12px"><span>!</span><span>You have overdue payments. Please clear them to keep ordering smoothly. ${c(14)}</span></div>` : ''}
      <div class="section-title">To pay ${c(10)}</div>
      ${unpaid.length ? `<div class="card">${unpaid.map(o => `<div class="payrow2"><div class="grow"><b class="small">${o.id} · ${MI.tFmt(MI.billT(o))}</b><div class="small muted">Due ${MI.date(MI.dueAt(o))} · ${esc(MI.term(o.termId).label)}${o.status === 'delivered' ? ' · final' : ' · estimate'}</div></div><div style="text-align:right"><b>${MI.inr(MI.amount(o))}</b><div>${payPill(o)}</div></div><button class="btn sm" data-act="paynow" data-o="${o.id}">Pay</button></div>`).join('')}</div>` : '<div class="card pad small muted">Nothing to pay.</div>'}
      <p class="small muted" style="margin-top:6px">Pay early any time. Offline payments are marked received by Mohit Ispat. ${c(16)}</p>
      <div class="section-title">Paid</div>
      ${paid.length ? `<div class="card">${paid.map(o => `<div class="payrow2"><div class="grow"><b class="small">${o.id}</b><div class="small muted">${MI.date(o.payment.paidAt)} · ${esc(o.payment.method)}</div></div><b>${MI.inr(MI.amount(o))}</b></div>`).join('')}</div>` : '<div class="card pad small muted">No payments yet.</div>'}
    </div>${nav('payments')}`;
  }

  /* distributor: dealer requests and dealers */
  function myRequests() { return S().requests.filter(r => MI.dealer(r.dealerId).distributorId === ME.id); }
  function vDealers() {
    const reqs = myRequests();
    const pending = reqs.filter(r => r.status === 'pending');
    const approved = reqs.filter(r => r.status === 'approved');
    const est = MI.rate(MI.priceToday(myState()).value, 'd7');
    const dealers = S().dealers.filter(d => d.distributorId === ME.id);
    return `${topbar('Dealers', '#/home')}
    <div class="screen pad">
      <div class="section-title" style="margin-top:0">Requests waiting ${c(5)}</div>
      ${pending.length ? pending.map(r => `<div class="card reqcard">
        <div class="row between"><b>${esc(MI.who(r.dealerId))}</b><span class="small muted">${MI.time(r.at)}</span></div>
        <div class="row between" style="margin-top:4px"><span class="big2">${MI.tFmt(r.tonnes)}</span><span class="small muted">≈ ${MI.inr(r.tonnes * est)} + GST</span></div>
        <div class="small muted">${MI.splitTotal(r.split) ? MI.SIZES.filter(k => +r.split[k]).map(k => `${k} mm ${MI.tFmt(+r.split[k])}`).join(' · ') : 'Sizes to be added later'}${r.note ? ` · ${esc(r.note)}` : ''}</div>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn ghost sm" data-act="rq" data-do="reject" data-r="${r.id}">Reject</button><button class="btn ghost sm" data-act="rqedit" data-r="${r.id}">Edit</button><button class="btn good sm grow" data-act="rq" data-do="approve" data-r="${r.id}">Approve</button></div>
      </div>`).join('') : '<div class="card pad small muted">No new requests.</div>'}
      <div class="combinebar ${approved.length ? '' : 'off'}">
        <div class="grow"><b>${approved.length} approved · ${MI.tFmt(approved.reduce((a, r) => a + r.tonnes, 0))}</b><div class="small">Combine into one order with your own stock</div></div>
        <button class="btn sm light" data-act="go" data-to="#/combine" ${approved.length ? '' : 'disabled'}>Combine</button>
      </div>
      <div class="section-title">My dealers ${c(7)}</div>
      <div class="card">${dealers.map(d => `<div class="listrow"><div class="grow"><b class="small">${esc(d.name)}</b><div class="small muted">${esc(d.area)} · ${esc(d.phone)}</div></div>${d.onApp ? '<span class="pill good">On app</span>' : '<span class="pill">Not on app</span>'}</div>`).join('')}</div>
      <p class="small muted" style="margin-top:6px">Dealer list is managed by Mohit Ispat.</p>
    </div>${nav('dealers')}`;
  }

  function vCombine() {
    const s = S();
    const approved = myRequests().filter(r => r.status === 'approved');
    if (ui.combine.picked === null) ui.combine.picked = approved.map(r => r.id);
    const picked = approved.filter(r => ui.combine.picked.includes(r.id));
    const manual = ui.combine.manual;
    const own = +ui.combine.own || 0;
    const total = MI.r3(picked.reduce((a, r) => a + r.tonnes, 0) + manual.reduce((a, m) => a + (+m.tonnes || 0), 0) + own);
    const p = MI.priceToday(myState());
    const r = MI.rate(p.value, ui.termId);
    const offApp = s.dealers.filter(d => d.distributorId === ME.id && !d.onApp);
    const sized = MI.splitTotal(picked.reduce((acc, rq) => { MI.SIZES.forEach(k => { acc[k] = (acc[k] || 0) + (+rq.split[k] || 0); }); return acc; }, {}));
    return `${topbar('Combined order', '#/dealers')}
    <div class="screen pad">
      <div class="section-title" style="margin-top:0">Dealer requests</div>
      <div class="card">${approved.length ? approved.map(rq => `<label class="listrow pick"><input type="checkbox" data-act="pick" data-r="${rq.id}" ${ui.combine.picked.includes(rq.id) ? 'checked' : ''}><div class="grow"><b class="small">${esc(MI.who(rq.dealerId))}</b><div class="small muted">${MI.splitTotal(rq.split) ? 'Sizes added' : 'Sizes later'}</div></div><b class="small">${MI.tFmt(rq.tonnes)}</b></label>`).join('') : '<div class="pad small muted">No approved requests.</div>'}</div>
      <div class="section-title">Orders taken by phone ${c(7)}</div>
      <div class="card">
        ${manual.map((m, i) => `<div class="listrow"><div class="grow small"><b>${esc(m.name)}</b><div class="muted">Added by hand</div></div><b class="small">${MI.tFmt(+m.tonnes)}</b><button class="x" data-act="rmManual" data-i="${i}">Remove</button></div>`).join('')}
        <div class="pad manualrow"><select class="input" id="manualDealer">${offApp.map(d => `<option value="${d.id}">${esc(d.name)} (not on app)</option>`).join('')}<option value="other">Other dealer</option></select><input class="input" id="manualT" inputmode="decimal" placeholder="Tonnes" style="width:90px"><button class="btn soft sm" data-act="addManual">Add</button></div>
      </div>
      <div class="section-title">Own stock</div>
      <div class="card pad row between"><span class="small">Tonnes for your own stock</span><div class="qty"><button data-act="ostep" data-d="-1">−</button><input id="ownT" inputmode="decimal" value="${ui.combine.own || ''}" placeholder="0"><span class="u">t</span><button data-act="ostep" data-d="1">+</button></div></div>
      <div class="section-title">Payment term ${c(1)}</div>
      <div class="terms-pick">${termRates(myState()).map(x => `<button class="termopt ${ui.termId === x.id ? 'on' : ''}" data-act="term" data-v="${x.id}"><span class="radio"></span><span class="grow"><b>${x.label}</b><span>due ${MI.date(Date.now() + x.days * MI.DAY)}</span></span><span class="tr"><b>${MI.inr(x.r)}</b><small>per tonne</small></span></button>`).join('')}</div>
      <div class="card sum" style="margin-top:14px">
        <div><span>Total</span><b>${MI.tFmt(total)}</b></div>
        <div><span>Locked rate</span><b>${MI.inr(r)}/t</b></div>
        <div class="total"><span>Estimated amount</span><span>${MI.inr(total * r)} + GST</span></div>
        <p class="small muted">${sized < total ? `${MI.tFmt(total - sized)} has no sizes yet. It goes in as a lump-sum booking, with sizes added by ${MI.date(Date.now() + s.settings.cutoffDays * MI.DAY)}. ${c(11)}` : 'All tonnes have sizes.'} Each dealer is told the final price.</p>
      </div>
    </div>
    <div class="footerbar"><button class="btn block lg" data-act="placeCombined" ${total >= s.settings.minOrderT ? '' : 'disabled'}>Place combined order · ${MI.tFmt(total)}</button></div>`;
  }

  function vAlerts() {
    const list = MI.notifsFor(ME);
    const seen = ui.seenAtOpen || 0;
    return `${topbar('Notifications', '#/home')}
    <div class="screen pad">${list.length ? `<div class="card">${list.map(n => `<button class="listrow alert ${n.at > seen ? 'new' : ''}" data-act="go" data-to="${n.link || '#/home'}"><span class="dotnew"></span><div class="grow small">${esc(n.text)}<div class="muted">${MI.date(n.at)} ${MI.time(n.at)}</div></div></button>`).join('')}</div>` : '<p class="small muted">No notifications.</p>'}</div>`;
  }

  function vAccount() {
    const d = isDist ? myDist() : MI.dealer(ME.id);
    return `${topbar('Account', '#/home')}
    <div class="screen pad">
      <div class="card pad"><b>${esc(d.name)}</b><p class="small muted">${isDist ? `Distributor · ${esc(d.city)}, ${esc(d.state)}` : `Dealer · ${esc(d.area)}, ${esc(d.state)}`}<br>${esc(d.phone)}</p></div>
      ${!isDist ? `<div class="section-title">Your distributor</div><div class="card pad"><b class="small">${esc(myDist().name)}</b><p class="small muted">${esc(myDist().city)} · ${esc(myDist().phone)}</p><p class="small muted" style="margin-top:6px">Assigned by Mohit Ispat from its dealer list.</p></div>` : ''}
      <div class="section-title">Pricing ${c(8)}</div>
      <div class="card pad small muted">Distributors and dealers see the same daily price. Separate dealer pricing can be added later.</div>
      <div class="section-title">Language</div>
      <div class="card pad small muted">English. Other languages are planned for a later version.</div>
      <button class="btn ghost block" style="margin-top:18px" data-act="signout">Sign out</button>
    </div>${nav(isDist ? 'home' : 'account')}`;
  }

  /* ---------- netbanking (simulated) ---------- */
  function paySheet(o) {
    const banks = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Bank of Baroda', 'Canara Bank'];
    psheet(`<h3>Pay ${MI.inr(MI.amount(o))}</h3>
      <p class="small muted" style="margin:4px 0 12px">${o.id} · due ${MI.date(MI.dueAt(o))} · ${o.status === 'delivered' ? 'final bill' : 'estimate on booked tonnes'} + GST ${c(16)}</p>
      <div class="radio-list">${banks.map(b => `<label><input type="radio" name="bank" value="${b}" ${b === ui.bank ? 'checked' : ''}>${b}</label>`).join('')}</div>
      <div class="row" style="gap:10px;margin-top:14px"><button class="btn ghost grow" data-act="closeSheet">Cancel</button><button class="btn grow" data-act="doPay" data-o="${o.id}">Continue to netbanking</button></div>`);
  }

  /* ---------- render ---------- */
  function render() {
    let { view, arg } = route();
    if (!signedIn() && !['login', 'otp'].includes(view)) view = 'login';
    else if (signedIn() && ['login', 'otp', ''].includes(view)) view = 'home';
    if (!isDist && ['dealers', 'combine'].includes(view)) view = 'home';
    const views = { login: vLogin, otp: vOtp, home: vHome, new: vNew, orders: vOrders, order: () => vOrder(arg), split: () => vSplit(arg), payments: vPayments, dealers: vDealers, combine: vCombine, alerts: vAlerts, account: vAccount };
    track('#/' + view + (arg ? '/' + arg : ''));
    const sameView = render.last === view + '/' + arg;
    const scr = app.querySelector('.screen');
    const scroll = sameView && scr ? scr.scrollTop : 0;
    const focused = document.activeElement && app.contains(document.activeElement) && document.activeElement.id ? document.activeElement.id : null;
    const focusedSplit = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.split;
    const keep = sameView ? [...app.querySelectorAll('.psheet-backdrop.open, .toast, .overlay')] : [];
    app.innerHTML = (views[view] || vHome)();
    keep.forEach(k => app.appendChild(k));
    const ns = app.querySelector('.screen');
    if (ns) ns.scrollTop = scroll;
    if (sameView) {
      const el = focused ? document.getElementById(focused) : focusedSplit ? app.querySelector(`[data-split="${focusedSplit}"]`) : null;
      if (el) { el.focus(); const v = el.value; el.value = ''; el.value = v; }
    }
    render.last = view + '/' + arg;
    renderNotes(view);
    syncPresenter();
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
    const o = el.dataset.o;
    if (a === 'go') return go(el.dataset.to);
    if (a === 'back') return back(el.dataset.to);
    if (a === 'q') return openQ(+el.dataset.n);
    if (a === 'closeq') return document.getElementById('qsheet').classList.remove('open');
    if (a === 'closeSheet') return closeSheet();
    if (a === 'toast') return toast(el.dataset.msg);
    if (a === 'reset') { MI.reset(); setSigned(false); return go('#/login'); }
    if (a === 'signin') { setSigned(true); return go('#/home'); }
    if (a === 'signout') { setSigned(false); return go('#/login'); }
    if (a === 'alerts') { ui.seenAtOpen = S().seen[ME.id] || 0; MI.markSeen(ME); return go('#/alerts'); }
    if (a === 'route') { ui.route = el.dataset.v; return render(); }
    if (a === 'type') { ui.type = el.dataset.v; return render(); }
    if (a === 'term') { ui.termId = el.dataset.v; return render(); }
    if (a === 'otab') { ui.otab = el.dataset.v; return render(); }
    if (a === 'splitnow') { ui.splitNow = el.checked; return render(); }
    if (a === 'tstep') { ui.tonnes = Math.max(0, MI.r3((+ui.tonnes || 0) + +el.dataset.d)); return render(); }
    if (a === 'ostep') { ui.combine.own = Math.max(0, MI.r3((+ui.combine.own || 0) + +el.dataset.d)); return render(); }
    if (a === 'sstep') {
      const { view, arg } = route();
      const sp = view === 'split' ? ui.edit[arg] : ui.split;
      sp[el.dataset.k] = Math.max(0, MI.r3((+sp[el.dataset.k] || 0) + +el.dataset.d));
      return render();
    }
    if (a === 'place') {
      const t = +ui.tonnes;
      if (!isDist && ui.route === 'dist') {
        const id = MI.sendRequest({ dealerId: ME.id, tonnes: t, split: ui.splitNow ? ui.split : blankSplit() });
        ui.split = {}; ui.splitNow = false;
        toast(`${id} sent to ${myDist().name}`);
        return go('#/orders');
      }
      const id = MI.placeOrder({ by: ME, type: ui.type, tonnes: t, split: ui.type === 'full' ? { ...blankSplit(), ...ui.split } : blankSplit(), termId: ui.termId });
      ui.split = {};
      psheet(`<div style="text-align:center"><div class="success-ic">${ic.check}</div><h3>Order ${id} booked</h3>
        <p class="small muted" style="margin:6px 0 16px">${MI.tFmt(t)} at ${MI.inr(MI.lockedRate(MI.order(id)))}/t, ${esc(MI.term(ui.termId).label)}. Mohit Ispat will confirm it shortly.</p>
        <button class="btn block" data-act="viewOrder" data-o="${id}">Track order</button></div>`);
      return;
    }
    if (a === 'viewOrder') { closeSheet(); return go('#/order/' + o); }
    if (a === 'received') { MI.truckReceived(o, el.dataset.t, 'customer'); return toast('Marked as received. Thank you.'); }
    if (a === 'paynow') return paySheet(MI.order(o));
    if (a === 'doPay') {
      ui.bank = (app.querySelector('input[name="bank"]:checked') || {}).value || ui.bank;
      closeSheet();
      const ov = document.createElement('div');
      ov.className = 'overlay';
      ov.innerHTML = `<div><div class="spinner"></div><b>Redirecting to ${esc(ui.bank)}</b><p class="small muted">Simulated netbanking</p></div>`;
      app.appendChild(ov);
      setTimeout(() => { MI.pay(o, `Netbanking, ${ui.bank}`); ov.remove(); toast('Payment successful. Receipt sent by SMS.'); }, 1300);
      return;
    }
    if (a === 'saveSplit') { MI.saveSplit(o, { ...blankSplit(), ...ui.edit[o] }); delete ui.edit[o]; toast('Sizes saved'); return go('#/order/' + o); }
    if (a === 'approveDirect') { MI.approveDirect(o); return toast(`${o} approved`); }
    if (a === 'rq') { MI.reviewRequest(el.dataset.r, el.dataset.do); ui.combine.picked = null; return toast(el.dataset.do === 'approve' ? 'Approved. Ready to combine.' : 'Rejected. Dealer notified.'); }
    if (a === 'rqedit') {
      const rq = S().requests.find(r => r.id === el.dataset.r);
      return psheet(`<h3>Edit ${esc(MI.who(rq.dealerId))}'s request</h3><div class="field" style="margin-top:12px"><label>Tonnes</label><input class="input" id="rqT" inputmode="decimal" value="${rq.tonnes}"></div><div class="row" style="gap:10px"><button class="btn ghost grow" data-act="closeSheet">Cancel</button><button class="btn grow" data-act="rqsave" data-r="${rq.id}">Save</button></div>`);
    }
    if (a === 'rqsave') { const v = +document.getElementById('rqT').value; if (v > 0) MI.reviewRequest(el.dataset.r, 'edit', v); closeSheet(); return toast('Request updated'); }
    if (a === 'pick') {
      const id = el.dataset.r;
      ui.combine.picked = el.checked ? [...ui.combine.picked, id] : ui.combine.picked.filter(x => x !== id);
      return render();
    }
    if (a === 'addManual') {
      const sel = document.getElementById('manualDealer');
      const t = +document.getElementById('manualT').value;
      if (!(t > 0)) return toast('Enter tonnes for this dealer');
      const d = MI.dealer(sel.value);
      ui.combine.manual.push({ dealerId: d ? d.id : null, name: d ? d.name : 'Other dealer (phone order)', tonnes: MI.r3(t) });
      return render();
    }
    if (a === 'rmManual') { ui.combine.manual.splice(+el.dataset.i, 1); return render(); }
    if (a === 'placeCombined') {
      const approved = myRequests().filter(r => r.status === 'approved' && ui.combine.picked.includes(r.id));
      const split = blankSplit();
      approved.forEach(rq => MI.SIZES.forEach(k => { split[k] = MI.r3(split[k] + (+rq.split[k] || 0)); }));
      const parts = [
        ...approved.map(rq => ({ dealerId: rq.dealerId, name: MI.who(rq.dealerId), tonnes: rq.tonnes, requestId: rq.id })),
        ...ui.combine.manual.map(m => ({ dealerId: m.dealerId, name: m.name, tonnes: m.tonnes })),
        ...(+ui.combine.own ? [{ dealerId: null, name: 'Own stock', tonnes: +ui.combine.own }] : []),
      ];
      const total = MI.r3(parts.reduce((x, p) => x + p.tonnes, 0));
      const type = MI.splitTotal(split) >= total - 1e-9 ? 'full' : 'lumpsum';
      const id = MI.placeOrder({ by: ME, type, tonnes: total, split, termId: ui.termId, parts });
      ui.combine = { picked: null, own: 0, manual: [] };
      toast(`Combined order ${id} placed. Dealers notified.`);
      return go('#/order/' + id);
    }
    if (a === 'demo') {
      const ord = MI.order(o);
      if (el.dataset.do === 'confirm') MI.confirmOrder(o);
      if (el.dataset.do === 'ready') MI.markReady(o);
      if (el.dataset.do === 'truck') {
        const w = MI.r3(Math.min(MI.pendingT(ord), 18) * (1 + (Math.random() * 0.02 - 0.008)));
        MI.addTruck(o, { vehicle: `GA 0${3 + ord.trucks.length} T ${4100 + ord.trucks.length * 37}`, driver: '+91 98500 1100' + (ord.trucks.length + 1), weightT: w, eta: Date.now() + MI.DAY });
      }
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'tonnes') { ui.tonnes = t.value.replace(/[^\d.]/g, ''); return render(); }
    if (t.id === 'ownT') { ui.combine.own = t.value.replace(/[^\d.]/g, ''); return render(); }
    if (t.dataset && t.dataset.split) {
      const { view, arg } = route();
      const sp = view === 'split' ? ui.edit[arg] : ui.split;
      sp[t.dataset.split] = t.value.replace(/[^\d.]/g, '');
      render();
    }
  });

  document.getElementById('presenterSwitch').addEventListener('click', () => setPresenter(!presenterOn()));
  window.addEventListener('storage', e => { if (e.key === 'mi-presenter') syncPresenter(); });
  window.addEventListener('hashchange', render);
  window.addEventListener('mi:state', render);
  render();
})();
