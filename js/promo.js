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
    if (_subscription.status === 'promo' && _subscription.proUntil) {
      if (_subscription.proUntil === 'lifetime') return 'Lifetime access';
      const d = new Date(_subscription.proUntil);
      return `Pro access until ${d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
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
    // Must go to the Worker, not the Netlify origin. A relative URL here would
    // hit tactical2talent.com and 404 — this is why redemption never worked.
    const resp = await fetch(`${WORKER_URL}/api/promo/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ code })
    });

    if (!resp.ok) {
      throw new Error('Invalid or expired code.');
    }

    const result = await resp.json();
    if (result.valid) {
      applyProAccess(result, code);
    } else {
      throw new Error(result.message || 'Invalid or expired code.');
    }
  } catch (err) {
    showToast('❌ ' + err.message, false);
    if (btn) { btn.disabled = false; btn.innerHTML = '🎟️ Redeem'; }
  }
}

// SECURITY: the old checkDevCode() fallback lived here with BETA2026 /
// FRIEND2026 / LIFETIME hardcoded. This file is served publicly, so those codes
// were readable by anyone — and once server-side redemption started working,
// they granted real Pro access. Codes now come only from the admin panel, and
// only the Worker decides whether one is valid. Never hardcode a code here.

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
    'Enter your promo code';

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

// Promo codes are created in the admin panel (Promo Codes tab), which stores
// them server-side in KV. The old browser-console generators that used to live
// here only wrote to an in-memory list the client checked itself — they never
// persisted, and their instructions told you to paste codes into this public
// file. Both are gone. Use the admin panel.
