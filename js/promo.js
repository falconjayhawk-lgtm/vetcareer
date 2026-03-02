// ── Promo Code System ─────────────────────────────────────────────────
// Codes are stored in Cloudflare KV (or localStorage in dev mode).
// Each code: { code, type, durationDays, uses, maxUses, createdAt, note }
// User access: state.access = { plan:'pro'|'free', proUntil: ISO date|'lifetime', promoCode }

// ── Access helpers ────────────────────────────────────────────────────
function getAccess() {
  return state.access || { plan: 'free', proUntil: null, promoCode: null };
}

function isPro() {
  const a = getAccess();
  if (a.plan !== 'pro') return false;
  if (a.proUntil === 'lifetime') return true;
  return new Date(a.proUntil) > new Date();
}

function proExpiresLabel() {
  const a = getAccess();
  if (!isPro()) return null;
  if (a.proUntil === 'lifetime') return 'Lifetime access';
  const d = new Date(a.proUntil);
  return `Pro access until ${d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
}

// ── Redeem a code ─────────────────────────────────────────────────────
async function redeemPromoCode(rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) { showToast('Enter a code first.', false); return; }

  // Show spinner on button
  const btn = document.getElementById('promo-redeem-btn');
  const input = document.getElementById('promo-code-input');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Checking...'; }

  try {
    // Check against Cloudflare KV via worker
    const resp = await fetch(`/api/promo/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId: state.supabase?.userId || state.profile?.fullName || 'anonymous' })
    });

    if (!resp.ok) {
      // If worker not set up yet, fall back to hardcoded dev codes
      const devResult = checkDevCode(code);
      if (devResult) {
        applyProAccess(devResult, code);
        return;
      }
      throw new Error('Invalid or expired code.');
    }

    const result = await resp.json();
    if (result.valid) {
      applyProAccess(result, code);
    } else {
      throw new Error(result.message || 'Invalid or expired code.');
    }
  } catch (err) {
    // Fallback to dev codes if worker isn't deployed yet
    const devResult = checkDevCode(code);
    if (devResult) {
      applyProAccess(devResult, code);
      return;
    }
    showToast('❌ ' + err.message, false);
    if (btn) { btn.disabled = false; btn.innerHTML = '🎟️ Redeem'; }
  }
}

// Dev/beta codes baked in for launch — change or remove post-launch
function checkDevCode(code) {
  const betaCodes = {
    'BETA2026':    { durationDays: 90,  note: 'Beta tester — 3 months free' },
    'FRIEND2026':  { durationDays: 90,  note: 'Friends & family — 3 months free' },
    'LIFETIME':    { durationDays: -1,  note: 'Lifetime access' },   // -1 = lifetime
  };
  // Also check any codes created this session via createPromoCode() or generatePromoCodes()
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

  // Hide the input, show success
  const input = document.getElementById('promo-code-input');
  const btn = document.getElementById('promo-redeem-btn');
  if (input) input.value = '';
  if (btn) { btn.disabled = false; btn.innerHTML = '🎟️ Redeem'; }

  const label = proUntil === 'lifetime' ? 'lifetime access' :
    `access until ${new Date(proUntil).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;

  showToast(`✅ Code accepted! You have Pro ${label}.`);
  setTimeout(() => render(), 300);
}

// ── Promo code input widget (reusable HTML) ───────────────────────────
function promoCodeWidget(context = 'settings') {
  const access = getAccess();
  if (isPro()) {
    return `
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px">
        <span style="font-size:24px">✅</span>
        <div>
          <div style="font-weight:700;color:#15803d">Pro Access Active</div>
          <div style="font-size:13px;color:#166534">${proExpiresLabel()}${access.promoCode ? ` · Code: ${access.promoCode}` : ''}</div>
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
      <button id="promo-redeem-btn" class="btn btn-primary" onclick="redeemPromoCode(document.getElementById('promo-code-input').value)">
        🎟️ Redeem
      </button>
    </div>
    <div style="font-size:11px;color:#9ca3af;margin-top:4px">Beta testers and invited users — enter your code here for free Pro access.</div>`;
}

// ── Admin: generate codes (run from browser console) ─────────────────
//
// CUSTOM code (you name it):
//   createPromoCode('PATRICK', 90)        → adds PATRICK for 90 days
//   createPromoCode('JOHNDOE', -1)        → adds JOHNDOE for lifetime
//
// RANDOM codes (batch):
//   generatePromoCodes('BETA', 5, 90)     → 5 codes like BETA-A3XK2P
//   generatePromoCodes('T2T', 10, 90)     → 10 codes like T2T-B7YM4Q
//
// All generated codes are added to the live betaCodes list for the session.
// To make them permanent, copy the output into the betaCodes object in promo.js.

const _dynamicCodes = {};  // runtime-added codes this session

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
