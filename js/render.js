// ── Render engine ─────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');

  if (!state.loggedIn) {
    app.innerHTML = renderLogin();
    setTimeout(() => mountClerkSignIn('clerk-signin-container'), 50);
    return;
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
    <polyline points="4,4 28,24 52,4" fill="none" stroke="#1a3a6b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="4,18 28,38 52,18" fill="none" stroke="#b8860b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  return `
    <div class="login-page">
      <div class="login-card" style="text-align:center">

        <div style="margin-bottom:20px">${logoSVG}</div>

        <div style="font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--gold);margin-bottom:6px">Veteran Career Platform</div>
        <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:30px;font-weight:700;margin:0 0 6px;color:var(--accent)">Tactics 2 Talent</h1>
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
  const items = [
    {id:'dashboard',label:'&#127968; Dashboard'},
    {id:'documents',label:'&#128228; Upload Docs',highlight:true},
    {id:'profile',label:'&#128100; Profile'},
    {id:'experience',label:'&#128506; Experience'},
    {id:'scout',label:'&#128301; Job Scout'},
    {id:'jobs',label:'&#128188; Job Tracker'},
    {id:'resume',label:'&#128196; Resume Builder'},
    {id:'linkedin',label:'&#128188; LinkedIn Generator'},
    {id:'interview',label:'&#127908; Interview Prep'},
    {id:'salary',label:'&#128176; Salary Intel'},
    {id:'network',label:'&#128140; Networking Emails'},
    {id:'refletter',label:'&#128220; Reference Letter'},
    {id:'sf86',label:'&#128272; SF-86 Prep'},
    {id:'gap',label:'&#128202; Gap Analysis'},
    {id:'settings',label:'&#9881; Settings'},
    {id:'faq',label:'&#10067; Help & FAQ'},
  ];

  const displayName = getDisplayName();

  // Chevron mark inline SVG for sidebar
  const chevronMark = `<svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
    <polygon points="4,12 14,12 24,22 34,12 44,12 24,32" fill="none" stroke="#b8860b" stroke-width="4" stroke-linejoin="round"/>
    <polygon points="4,22 14,22 24,32 34,22 44,22 24,42" fill="none" stroke="rgba(184,134,11,0.4)" stroke-width="3.5" stroke-linejoin="round"/>
  </svg>`;

  return `
    <div class="sidebar">

      <!-- Brand -->
      <div style="padding:18px 16px 14px;border-bottom:1px solid rgba(255,255,255,0.1)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${chevronMark}
          <div>
            <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;color:white;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;line-height:1.1">Tactics 2 Talent</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.35);font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.12em;text-transform:uppercase">Career Transition · v0.8</div>
          </div>
        </div>
        ${displayName ? `
        <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:rgba(255,255,255,0.08);border-radius:2px;margin-top:8px">
          <div style="width:6px;height:6px;border-radius:50%;background:var(--gold);flex-shrink:0"></div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);font-family:'Familjen Grotesk',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(displayName)}">${esc(displayName)}</div>
        </div>` : ''}
      </div>

      <!-- Nav items -->
      <nav style="flex:1;padding:8px;overflow-y:auto">
        ${items.map(i => `
          <button class="nav-btn${state.view===i.id?' active':''}${i.highlight&&state.documents.length===0?' start-here':''}"
            onclick="setState({view:'${i.id}'}); closeNav()">
            ${i.label}
            ${i.highlight&&state.documents.length===0
              ? `<span style="font-size:9px;background:var(--gold);color:white;padding:2px 6px;border-radius:2px;margin-left:4px;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.08em">START</span>`
              : ''}
          </button>`).join('')}
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
  switch(state.view) {
    case 'onboarding': return renderOnboarding();
    case 'dashboard': return renderDashboard();
    case 'profile': return renderProfile();
    case 'experience': return renderExperience();
    case 'documents': return renderDocuments();
    case 'jobs': return renderJobs();
    case 'scout': return renderScout();
    case 'resume': return renderResume();
    case 'linkedin': return renderLinkedIn();
    case 'interview': return renderInterview();
    case 'salary': return renderSalary();
    case 'network': return renderNetwork();
    case 'refletter': return renderRefLetter();
    case 'sf86': return renderSF86();
    case 'gap': return renderGap();
    case 'settings': return renderSettings();
    case 'faq': return renderFAQ();
    case 'stats': return renderStats();
    default: return renderDashboard();
  }
}
