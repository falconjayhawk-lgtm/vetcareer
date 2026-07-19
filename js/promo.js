// ── Promo Code System ─────────────────────────────────────────────────
// Codes are stored in Cloudflare KV (or localStorage in dev mode).
// Each code: { code, type, durationDays, uses, maxUses, createdAt, note }
// User access: state.access = { plan:'pro'|'free', proUntil: ISO date|'lifetime', promoCode }
//
// NOTE: isPro() and getAccess() live in subscription.js, which loads after
// this file. subscription.js's isPro() checks BOTH Stripe subscriptions
// AND promo code access, so everything works together.

// ── Access helper ─────────────────────────────────────────────────────
function getAccess() {
  return state.access || { plan: 'free', proUntil: null, promoCode: null };
}

function proExpiresLabel() {
  if (!isPro()) return null;
  // Stripe subscription takes precedence for label
  if (_subscription.tier === 'pro') {
    if (_subscription.status === 'trialing' && _subscription.trialEnd) {
      const d = new Date(_subscription.trialEnd * 1000);
      return `Trial active until ${d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
    }
    if (_subscription.status === 'active' && _subscription.currentPeriodEnd) {
      const d = new Date(_subscription.currentPeriodEnd * 1000);
      return `Pro access renews ${d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
    }
    return 'Pro access active';
  }
  // Promo code label
  const a = getAccess();
  if (a.proUntil === 'lifetime') return 'Lifetime access';
  const d = new Date(a.proUntil);
  return `Pro access until ${d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
}

// ── Redeem a code ─────────────────────────────────────────────────────
async function redeemPromoCode(rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) { showToast('Enter a code first.', false); return; }

  const btn   = document.getElementById('promo-redeem-btn');
  const input = document.getElementById('promo-code-input');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Checking...'; }

  try {
    const token = await getClerkToken();
    const resp = await fetch(`/api/promo/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ code })
    });

    if (!resp.ok) {
      const devResult = checkDevCode(code);
      if (devResult) { applyProAccess(devResult, code); return; }
      throw new Error('Invalid or expired code.');
    }

    const result = await resp.json();
    if (result.valid) {
      applyProAccess(result, code);
    } else {
      throw new Error(result.message || 'Invalid or expired code.');
    }
  } catch (err) {
    const devResult = checkDevCode(code);
    if (devResult) { applyProAccess(devResult, code); return; }
    showToast('❌ ' + err.message, false);
    if (btn) { btn.disabled = false; btn.innerHTML = '🎟️ Redeem'; }
  }
}

// Dev/beta codes baked in for launch — change or remove post-launch
function checkDevCode(code) {
  const betaCodes = {
    'BETA2026':   { durationDays: 90, note: 'Beta tester — 3 months free' },
    'FRIEND2026': { durationDays: 90, note: 'Friends & family — 3 months free' },
    'LIFETIME':   { durationDays: -1, note: 'Lifetime access' },
  };
  return betaCodes[code] || _dynamicCodes[code] || null;
}

function applyProAccess(result, code) {
  let proUntil;
  if (result.durationDays === -1 || result.durationDays === 'lifetime') {
    proUntil = 'lifetime';
  } else {
    const d = new Date();
    d.setDate(d.getDate() + (result.durationDays || 365));
    proUntil = d.toISOString();
  }

  setState({
    access: { plan: 'pro', proUntil, promoCode: code, redeemedAt: new Date().toISOString() }
  });

  const input = document.getElementById('promo-code-input');
  const btn   = document.getElementById('promo-redeem-btn');
  if (input) input.value = '';
  if (btn)   { btn.disabled = false; btn.innerHTML = '🎟️ Redeem'; }

  const label = proUntil === 'lifetime' ? 'lifetime access' :
    `access until ${new Date(proUntil).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;

  showToast(`✅ Code accepted! You have Pro ${label}.`);

  // Close upgrade modal if open, then re-render
  closeUpgradeModal();
  setTimeout(() => render(), 300);
}

// ── Promo code input widget (reusable HTML) ───────────────────────────
function promoCodeWidget(context = 'settings') {
  const access = getAccess();
  if (isPro()) {
    return `
      <div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;
                  padding:14px;display:flex;align-items:center;gap:12px">
        <span style="font-size:24px">✅</span>
        <div>
          <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;color:var(--green)">Pro Access Active</div>
          <div style="font-size:13px;color:var(--green)">${proExpiresLabel()}${access.promoCode ? ` · Code: ${access.promoCode}` : ''}</div>
        </div>
      </div>`;
  }

  const placeholder = context === 'onboarding' ?
    'Have a promo or beta code? Enter it here' :
    'Enter promo code (e.g. BETA2026)';

  return `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input id="promo-code-input" placeholder="${placeholder}"
        style="flex:1;min-width:160px;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;font-size:14px"
        onkeydown="if(event.key==='Enter') redeemPromoCode(this.value)"
        oninput="this.value=this.value.toUpperCase()">
      <button id="promo-redeem-btn" class="btn btn-primary"
              onclick="redeemPromoCode(document.getElementById('promo-code-input').value)">
        🎟️ Redeem
      </button>
    </div>
    <div style="font-size:11px;color:var(--dim);margin-top:4px">
      Beta testers and invited users — enter your code here for free Pro access.
    </div>`;
}

// ── Admin: generate codes (run from browser console) ──────────────────
//
// CUSTOM code (you name it):
//   createPromoCode('PATRICK', 90)        → adds PATRICK for 90 days
//   createPromoCode('JOHNDOE', -1)        → adds JOHNDOE for lifetime
//
// RANDOM codes (batch):
//   generatePromoCodes('BETA', 5, 90)     → 5 codes like BETA-A3XK2P
//   generatePromoCodes('T2T', 10, 90)     → 10 codes like T2T-B7YM4Q
//
// To make codes permanent, copy the output into betaCodes in promo.js.

const _dynamicCodes = {};

function createPromoCode(code, durationDays = 90, note = '') {
  const key = code.trim().toUpperCase();
  if (!key) { console.error('Code cannot be empty'); return; }
  _dynamicCodes[key] = { durationDays, note: note || `Custom code — ${durationDays === -1 ? 'lifetime' : durationDays + ' days'}` };
  console.log(`✅ Code created: ${key} (${durationDays === -1 ? 'lifetime' : durationDays + ' days'})`);
  console.log(`   To make permanent, add this to betaCodes in promo.js:`);
  console.log(`   '${key}': { durationDays: ${durationDays}, note: '${_dynamicCodes[key].note}' },`);
  return key;
}

function generatePromoCodes(prefix = 'T2T', count = 1, durationDays = 90) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing O,0,I,1
  const codes = [];
  for (let i = 0; i < count; i++) {
    let rand = '';
    for (let j = 0; j < 6; j++) rand += chars[Math.floor(Math.random() * chars.length)];
    const code = `${prefix}-${rand}`;
    _dynamicCodes[code] = { durationDays, note: `Generated — ${durationDays === -1 ? 'lifetime' : durationDays + ' days'}` };
    codes.push(code);
  }
  console.log(`\n✅ Generated ${count} code(s) — ${durationDays === -1 ? 'lifetime' : durationDays + ' days'}:`);
  codes.forEach(c => console.log(`   ${c}`));
  console.log(`\nTo make permanent, add to betaCodes in promo.js.`);
  return codes;
}
