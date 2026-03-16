// ── Subscription state ────────────────────────────────────────────────
// Managed in memory only (never persisted to localStorage).
// Refreshed from the server every time the user logs in.

let _subscription = { tier: 'free', status: 'none', trialEnd: null };
let _subscriptionChecked = false;

// Monthly and Annual Stripe price IDs
const PRICE_MONTHLY = 'price_1TBb3LQp1f5cSrlSuisk2O4V';
const PRICE_ANNUAL  = 'price_1TBb3LQp1f5cSrlSwIJtNkOM';

// Which nav views require Pro
const PRO_VIEWS = new Set([
  'scout', 'resume', 'linkedin', 'interview',
  'salary', 'network', 'refletter', 'sf86', 'gap'
]);

// ── Public API ─────────────────────────────────────────────────────────

/** Returns true if the current user has an active Pro or trialing subscription. */
function isPro() {
  return _subscription.tier === 'pro';
}

/** Returns true if the given view requires a Pro subscription. */
function isProView(viewId) {
  return PRO_VIEWS.has(viewId);
}

/**
 * Fetch subscription status from the Worker and update local state.
 * Called automatically on login; triggers a re-render when done.
 */
async function checkSubscription() {
  _subscriptionChecked = true;
  try {
    const sub = await getSubscription();
    _subscription = sub;
    render(); // Re-render now that we know the real tier
  } catch (err) {
    // Network error — fail open (stay on free, don't block the user)
    console.warn('Subscription check failed:', err.message);
  }
}

/** Reset subscription state on sign-out. */
function resetSubscription() {
  _subscription        = { tier: 'free', status: 'none', trialEnd: null };
  _subscriptionChecked = false;
}

// ── Pro feature gate card ──────────────────────────────────────────────
/**
 * Returns the HTML to display instead of a Pro feature when the user is on Free.
 * @param {string} featureName - Display name, e.g. "Resume Builder"
 * @param {string} description - One-line description of what they're missing
 */
function renderProGate(featureName, description) {
  return `
    <div style="max-width:560px;margin:48px auto">
      <div class="card" style="text-align:center;padding:40px 32px">

        <div style="font-size:40px;margin-bottom:16px">🔒</div>

        <h2 style="font-family:'Familjen Grotesk',sans-serif;font-size:18px;font-weight:700;
                   color:var(--accent);margin:0 0 8px;text-transform:none;letter-spacing:0;
                   border:none;padding:0">
          ${featureName}
        </h2>

        <p style="color:var(--muted);font-size:14px;margin:0 0 28px;font-family:'Lora',serif">
          ${description}
        </p>

        <div style="background:var(--gold-light);border:1px solid #e8d5a0;border-radius:2px;
                    padding:14px 18px;margin-bottom:24px;text-align:left">
          <div style="font-family:'Familjen Grotesk',sans-serif;font-size:11px;font-weight:700;
                      color:var(--gold);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px">
            ✨ What's included in Pro
          </div>
          <div style="font-size:13px;color:var(--text);display:grid;grid-template-columns:1fr 1fr;gap:6px 16px">
            <div>📄 AI Resume Builder</div>
            <div>🎤 Interview Prep</div>
            <div>🔍 Job Scout (Federal)</div>
            <div>💰 Salary Intelligence</div>
            <div>💼 LinkedIn Generator</div>
            <div>📬 Networking Emails</div>
            <div>📜 Reference Letters</div>
            <div>🔐 SF-86 Prep</div>
            <div>📊 Gap Analysis</div>
            <div>⚡ Unlimited AI calls</div>
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
          <button class="btn btn-primary" onclick="openUpgradeModal()"
                  style="font-size:14px;padding:12px 28px">
            Start 7-Day Free Trial
          </button>
        </div>

        <p style="font-size:11px;color:var(--dim);font-family:'Familjen Grotesk',sans-serif;
                  letter-spacing:0.04em;margin:0">
          No charge during trial · Cancel anytime · $15/mo or $120/yr after
        </p>

      </div>
    </div>`;
}

// ── Upgrade modal ──────────────────────────────────────────────────────
function openUpgradeModal() {
  // Remove any existing modal first
  const existing = document.getElementById('upgrade-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'upgrade-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;
    display:flex;align-items:center;justify-content:center;padding:16px;
  `;

  modal.innerHTML = `
    <div style="background:var(--paper);border:1px solid var(--rule-dark);border-radius:2px;
                box-shadow:8px 8px 0 rgba(0,0,0,0.2);width:100%;max-width:480px;
                max-height:90vh;overflow-y:auto">

      <!-- Header -->
      <div style="background:var(--accent);padding:20px 24px;display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <div style="font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;
                      letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:4px">
            Tactical 2 Talent Pro
          </div>
          <div style="font-family:'Familjen Grotesk',sans-serif;font-size:20px;font-weight:700;color:white">
            Upgrade Your Transition
          </div>
        </div>
        <button onclick="closeUpgradeModal()" style="background:none;border:none;color:rgba(255,255,255,0.6);
                font-size:24px;cursor:pointer;padding:0;line-height:1;margin-top:-2px">&times;</button>
      </div>

      <!-- Trial callout -->
      <div style="background:var(--gold-light);border-bottom:1px solid #e8d5a0;padding:12px 24px;
                  display:flex;align-items:center;gap:10px">
        <div style="font-size:18px">🎖️</div>
        <div>
          <div style="font-family:'Familjen Grotesk',sans-serif;font-size:12px;font-weight:700;color:var(--gold)">
            7-DAY FREE TRIAL
          </div>
          <div style="font-size:12px;color:var(--muted)">
            Full Pro access. No charge until day 8. Cancel anytime.
          </div>
        </div>
      </div>

      <!-- Plans -->
      <div style="padding:20px 24px">

        <!-- Monthly -->
        <div id="plan-monthly"
             onclick="selectPlan('monthly')"
             style="border:2px solid var(--rule-dark);border-radius:2px;padding:16px;margin-bottom:10px;
                    cursor:pointer;transition:all 0.15s;background:white">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:14px;color:var(--text)">
                <span id="plan-monthly-check" style="color:var(--accent);margin-right:6px">○</span>
                Monthly Plan
              </div>
              <div style="font-size:12px;color:var(--muted);margin-top:4px">Billed monthly · Pause anytime</div>
            </div>
            <div style="text-align:right">
              <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:20px;color:var(--accent)">$15</div>
              <div style="font-size:11px;color:var(--dim)">/month</div>
            </div>
          </div>
        </div>

        <!-- Annual (highlighted) -->
        <div id="plan-annual"
             onclick="selectPlan('annual')"
             style="border:2px solid var(--accent);border-radius:2px;padding:16px;margin-bottom:20px;
                    cursor:pointer;transition:all 0.15s;background:var(--accent-light);position:relative">
          <div style="position:absolute;top:-10px;right:12px;background:var(--gold);color:white;
                      font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;
                      padding:2px 8px;border-radius:2px;letter-spacing:0.08em">
            BEST VALUE
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:14px;color:var(--accent)">
                <span id="plan-annual-check" style="color:var(--accent);margin-right:6px">●</span>
                Annual Plan
              </div>
              <div style="font-size:12px;color:var(--muted);margin-top:4px">$10/mo — save $60/year</div>
            </div>
            <div style="text-align:right">
              <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:20px;color:var(--accent)">$120</div>
              <div style="font-size:11px;color:var(--dim)">/year</div>
            </div>
          </div>
        </div>

        <!-- CTA button -->
        <button id="checkout-btn"
                onclick="startCheckout()"
                class="btn btn-primary"
                style="width:100%;justify-content:center;font-size:14px;padding:14px">
          Start Free Trial
        </button>

        <p id="checkout-error"
           style="display:none;color:var(--red);font-size:12px;text-align:center;margin-top:10px"></p>

        <p style="font-size:11px;color:var(--dim);text-align:center;margin-top:12px;
                  font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em">
          Secured by Stripe · No card stored by T2T · Cancel in Stripe Customer Portal
        </p>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeUpgradeModal(); });
}

let _selectedPlan = 'annual'; // default

function selectPlan(plan) {
  _selectedPlan = plan;

  const monthlyEl = document.getElementById('plan-monthly');
  const annualEl  = document.getElementById('plan-annual');
  const mCheck    = document.getElementById('plan-monthly-check');
  const aCheck    = document.getElementById('plan-annual-check');

  if (plan === 'monthly') {
    monthlyEl.style.borderColor   = 'var(--accent)';
    monthlyEl.style.background    = 'var(--accent-light)';
    annualEl.style.borderColor    = 'var(--rule-dark)';
    annualEl.style.background     = 'white';
    mCheck.textContent = '●';
    aCheck.textContent = '○';
  } else {
    annualEl.style.borderColor    = 'var(--accent)';
    annualEl.style.background     = 'var(--accent-light)';
    monthlyEl.style.borderColor   = 'var(--rule-dark)';
    monthlyEl.style.background    = 'white';
    aCheck.textContent = '●';
    mCheck.textContent = '○';
  }
}

function closeUpgradeModal() {
  const modal = document.getElementById('upgrade-modal');
  if (modal) modal.remove();
  _selectedPlan = 'annual'; // reset to default
}

async function startCheckout() {
  const btn = document.getElementById('checkout-btn');
  const errEl = document.getElementById('checkout-error');

  btn.disabled    = true;
  btn.textContent = 'Redirecting to Stripe…';
  errEl.style.display = 'none';

  try {
    const priceId = _selectedPlan === 'monthly' ? PRICE_MONTHLY : PRICE_ANNUAL;
    const email   = clerkInstance?.user?.primaryEmailAddress?.emailAddress || '';

    const result = await createCheckout(priceId, email);

    if (result.url) {
      window.location.href = result.url; // Redirect to Stripe Checkout
    } else {
      throw new Error('No checkout URL returned');
    }

  } catch (err) {
    console.error('Checkout error:', err);
    errEl.textContent   = err.message || 'Something went wrong. Please try again.';
    errEl.style.display = 'block';
    btn.disabled        = false;
    btn.textContent     = 'Start Free Trial';
  }
}

// ── Checkout success / cancel handling ────────────────────────────────
// Called from index.html on page load if ?checkout=success or ?checkout=cancel
function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const result = params.get('checkout');
  if (!result) return;

  // Clean the URL immediately
  window.history.replaceState({}, '', window.location.pathname);

  if (result === 'success') {
    // Re-check subscription (webhook may have already fired)
    setTimeout(async () => {
      await checkSubscription();
      showCheckoutBanner('success');
    }, 1500); // small delay to give webhook time to process
  }
  // cancel: no action needed
}

function showCheckoutBanner(type) {
  const existing = document.getElementById('checkout-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'checkout-banner';
  banner.style.cssText = `
    position:fixed;top:0;left:0;right:0;z-index:500;
    background:var(--green);color:white;padding:14px 20px;
    font-family:'Familjen Grotesk',sans-serif;font-size:13px;font-weight:700;
    letter-spacing:0.04em;display:flex;align-items:center;justify-content:space-between;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    <span>🎖️ Welcome to Tactical 2 Talent Pro! Your 7-day trial is active.</span>
    <button onclick="document.getElementById('checkout-banner').remove()"
            style="background:none;border:none;color:white;font-size:20px;cursor:pointer;padding:0">&times;</button>
  `;

  document.body.prepend(banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 8000);
}
