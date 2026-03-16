// ── Render engine ─────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');

  if (!state.loggedIn) {
    app.innerHTML = renderLogin();
    setTimeout(() => mountClerkSignIn('clerk-signin-container'), 50);
    return;
  }

  // Trigger subscription check once per login session (async — non-blocking)
  if (typeof checkSubscription === 'function' && !window._subscriptionChecked) {
    window._subscriptionChecked = true;
    checkSubscription();
  }

  app.innerHTML = `
    <div style="display:flex;min-height:100vh">
      ${renderSidebar()}
      <div class="main">${renderView()}</div>
    </div>`;
  if (typeof trackView === 'function') trackView(state.view);
  if (state.view === 'stats' && typeof loadStats === 'function') setTimeout(loadStats, 50);

  const backBtn = document.getElementById('mobile-back');
  if (backBtn) backBtn.style.display = state.view !== 'dashboard' ? 'block' : 'none';
  bindEvents();
}

function renderLogin() {
  const clerkError = state.ui && state.ui.clerkError;

  const logoSVG = `<svg width="56" height="44" viewBox="0 0 56 44" xmlns="http://www.w3.org/2000/svg">
    <polyline points="4,24 28,4 52,24" fill="none" stroke="#1a3a6b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="4,40 28,20 52,40" fill="none" stroke="#b8860b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  return `
    <div class="login-page">
      <div class="login-card" style="text-align:center">

        <div style="margin-bottom:20px">${logoSVG}</div>

        <div style="font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--gold);margin-bottom:6px">Veteran Career Platform</div>
        <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:30px;font-weight:700;margin:0 0 6px;color:var(--accent)">Tactical 2 Talent</h1>
        <p style="font-family:'Lora',serif;font-style:italic;color:var(--muted);font-size:14px;margin:0 0 28px">Your military-to-civilian transition platform</p>

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
          <div style="flex:1;height:1px;background:var(--rule-dark)"></div>
          <div style="font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--dim)">Sign In</div>
          <div style="flex:1;height:1px;background:var(--rule-dark)"></div>
        </div>

        ${clerkError
          ? `<div style="background:var(--red-light);border:1px solid #e8c0c0;border-radius:2px;padding:14px;font-size:13px;color:var(--red);margin-bottom:16px">
               Sign-in failed to load. Please refresh the page.<br>
               <button onclick="location.reload()" class="btn btn-primary btn-sm" style="margin-top:8px">Refresh</button>
             </div>`
          : `<div id="clerk-signin-container" style="min-height:80px;text-align:left">
               <div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">
                 <div class="spinner" style="margin:0 auto 8px"></div>
                 Loading sign-in...
               </div>
             </div>`
        }

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--rule)">
          <p style="font-family:'Familjen Grotesk',sans-serif;font-size:10px;letter-spacing:0.08em;color:var(--dim);margin:0 0 8px">
            YOUR DATA IS ENCRYPTED AND NEVER SOLD &nbsp;·&nbsp; BUILT FOR VETERANS, BY A VETERAN
          </p>
          <div style="display:flex;gap:16px;justify-content:center">
            <a href="/privacy.html" target="_blank" style="font-size:11px;color:var(--muted);text-decoration:none;font-family:'Familjen Grotesk',sans-serif">Privacy Policy</a>
            <a href="/terms.html" target="_blank" style="font-size:11px;color:var(--muted);text-decoration:none;font-family:'Familjen Grotesk',sans-serif">Terms of Service</a>
          </div>
        </div>

      </div>
    </div>`;
}

function renderSidebar() {
  // pro:true = requires Pro subscription
  const items = [
    { id:'dashboard',  label:'&#127968; Dashboard' },
    { id:'documents',  label:'&#128228; Upload Docs', highlight:true },
    { id:'profile',    label:'&#128100; Profile' },
    { id:'experience', label:'&#128506; Experience' },
    { id:'jobs',       label:'&#128188; Job Tracker' },
    { id:'scout',      label:'&#128301; Job Scout',          pro:true },
    { id:'resume',     label:'&#128196; Resume Builder',     pro:true },
    { id:'linkedin',   label:'&#128188; LinkedIn Generator', pro:true },
    { id:'interview',  label:'&#127908; Interview Prep',     pro:true },
    { id:'salary',     label:'&#128176; Salary Intel',       pro:true },
    { id:'network',    label:'&#128140; Networking Emails',  pro:true },
    { id:'refletter',  label:'&#128220; Reference Letter',   pro:true },
    { id:'sf86',       label:'&#128272; SF-86 Prep',         pro:true },
    { id:'gap',        label:'&#128202; Gap Analysis',       pro:true },
    { id:'settings',   label:'&#9881; Settings' },
    { id:'faq',        label:'&#10067; Help & FAQ' },
  ];

  const userIsPro      = typeof isPro === 'function' && isPro();
  const displayName    = getDisplayName();

  // Subscription status pill shown in sidebar header
  const subPill = userIsPro
    ? `<div style="display:inline-flex;align-items:center;gap:4px;background:rgba(184,134,11,0.25);
                   border:1px solid rgba(184,134,11,0.4);border-radius:2px;padding:2px 8px;margin-top:6px">
         <div style="width:5px;height:5px;border-radius:50%;background:var(--gold)"></div>
         <div style="font-size:9px;font-family:'Familjen Grotesk',sans-serif;font-weight:700;
                     letter-spacing:0.12em;text-transform:uppercase;color:#fde68a">Pro</div>
       </div>`
    : `<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.08);
                   border:1px solid rgba(255,255,255,0.15);border-radius:2px;padding:2px 8px;margin-top:6px;
                   cursor:pointer" onclick="openUpgradeModal()">
         <div style="font-size:9px;font-family:'Familjen Grotesk',sans-serif;font-weight:700;
                     letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5)">Free</div>
         <div style="font-size:9px;font-family:'Familjen Grotesk',sans-serif;font-weight:700;
                     letter-spacing:0.08em;text-transform:uppercase;color:var(--gold)">→ Upgrade</div>
       </div>`;

  const chevronMark = `<svg width="22" height="22" viewBox="0 0 56 44" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
    <polyline points="4,24 28,4 52,24" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="4,40 28,20 52,40" fill="none" stroke="#b8860b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  return `
    <div class="sidebar">

      <!-- Brand -->
      <div style="padding:18px 16px 14px;border-bottom:1px solid rgba(255,255,255,0.1)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${chevronMark}
          <div>
            <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;color:white;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.1">Tactical 2 Talent</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.35);font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.12em;text-transform:uppercase">Career Transition · v0.8</div>
          </div>
        </div>
        ${displayName ? `
        <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:rgba(255,255,255,0.08);border-radius:2px;margin-top:8px">
          <div style="width:6px;height:6px;border-radius:50%;background:var(--gold);flex-shrink:0"></div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);font-family:'Familjen Grotesk',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(displayName)}">${esc(displayName)}</div>
        </div>` : ''}
        ${subPill}
      </div>

      <!-- Nav items -->
      <nav style="flex:1;padding:8px;overflow-y:auto">
        ${items.map(item => {
          const isLocked  = item.pro && !userIsPro;
          const lockBadge = isLocked
            ? `<span style="font-size:9px;color:rgba(255,255,255,0.3);margin-left:auto">🔒</span>`
            : (item.pro && userIsPro
                ? `<span style="font-size:8px;background:rgba(184,134,11,0.3);color:#fde68a;padding:1px 5px;border-radius:2px;margin-left:auto;font-family:'Familjen Grotesk',sans-serif;font-weight:700;letter-spacing:0.06em">PRO</span>`
                : '');
          const startBadge = item.highlight && state.documents.length === 0
            ? `<span style="font-size:9px;background:var(--gold);color:white;padding:2px 6px;border-radius:2px;margin-left:4px;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.08em">START</span>`
            : '';
          const extraStyle = isLocked ? 'opacity:0.6' : '';
          const clickAction = isLocked
            ? `openUpgradeModal(); closeNav()`
            : `setState({view:'${item.id}'}); closeNav()`;

          return `
            <button class="nav-btn${state.view === item.id ? ' active' : ''}${item.highlight && state.documents.length === 0 ? ' start-here' : ''}"
              onclick="${clickAction}"
              style="display:flex;align-items:center;${extraStyle}">
              <span>${item.label}</span>
              ${startBadge}
              ${lockBadge}
            </button>`;
        }).join('')}
      </nav>

      <!-- Bottom: sign out + legal -->
      <div style="padding:8px;border-top:1px solid rgba(255,255,255,0.1)">
        <button class="nav-btn" style="color:#f87171" onclick="clerkSignOut()">&#128682; Sign Out</button>
        <div style="padding:4px 10px 6px;display:flex;gap:14px">
          <a href="/privacy.html" target="_blank" style="font-size:10px;color:rgba(255,255,255,0.3);text-decoration:none;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;transition:color 0.15s" onmouseover="this.style.color='rgba(255,255,255,0.65)'" onmouseout="this.style.color='rgba(255,255,255,0.3)'">Privacy</a>
          <a href="/terms.html" target="_blank" style="font-size:10px;color:rgba(255,255,255,0.3);text-decoration:none;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;transition:color 0.15s" onmouseover="this.style.color='rgba(255,255,255,0.65)'" onmouseout="this.style.color='rgba(255,255,255,0.3)'">Terms</a>
        </div>
      </div>

    </div>`;
}

function renderView() {
  // Pro gate check helper
  const gate = (featureName, description) =>
    (typeof isPro === 'function' && isPro())
      ? null
      : renderProGate(featureName, description);

  switch(state.view) {
    case 'onboarding':  return renderOnboarding();
    case 'dashboard':   return renderDashboard();
    case 'profile':     return renderProfile();
    case 'experience':  return renderExperience();
    case 'documents':   return renderDocuments();
    case 'jobs':        return renderJobs();

    // ── Pro-gated views ───────────────────────────────────────────────
    case 'scout':
      return gate('Job Scout', 'Search and score real federal job listings matched to your military background.') || renderScout();
    case 'resume':
      return gate('Resume Builder', 'Generate tailored AI resumes and cover letters for any civilian job.') || renderResume();
    case 'linkedin':
      return gate('LinkedIn Generator', 'Build a complete LinkedIn profile that translates your military experience.') || renderLinkedIn();
    case 'interview':
      return gate('Interview Prep', 'Practice with AI-coached answers tailored to your MOS and target role.') || renderInterview();
    case 'salary':
      return gate('Salary Intelligence', 'Know your worth — market rates, negotiation scripts, and equity guidance.') || renderSalary();
    case 'network':
      return gate('Networking Emails', 'AI-drafted outreach emails for recruiters, veterans networks, and referrals.') || renderNetwork();
    case 'refletter':
      return gate('Reference Letter Generator', 'Create professional reference letters formatted for civilian employers.') || renderRefLetter();
    case 'sf86':
      return gate('SF-86 Prep', 'Organize your 10-year lookback data for security clearance applications.') || renderSF86();
    case 'gap':
      return gate('Gap Analysis', 'Identify skill gaps between your background and your target industries.') || renderGap();
    // ─────────────────────────────────────────────────────────────────

    case 'settings':    return renderSettings();
    case 'faq':         return renderFAQ();
    case 'stats':       return renderStats();
    default:            return renderDashboard();
  }
}
