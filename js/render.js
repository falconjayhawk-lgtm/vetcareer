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
  return `
    <div class="login-page">
      <div class="login-card" style="width:420px;max-width:95vw">
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:48px;margin-bottom:8px">&#9876;</div>
          <h1 style="font-size:26px;font-weight:800;margin:0;color:#111827">Tactics 2 Talent</h1>
          <p style="color:#6b7280;font-size:14px;margin:6px 0 0">Your military-to-civilian transition platform</p>
        </div>

        ${clerkError
          ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;text-align:center;font-size:13px;color:#dc2626">
               Sign-in failed to load. Please refresh the page.<br>
               <button onclick="location.reload()" class="btn btn-primary btn-sm" style="margin-top:8px">Refresh</button>
             </div>`
          : `<div id="clerk-signin-container" style="min-height:100px">
               <div style="text-align:center;padding:24px;color:#9ca3af;font-size:13px">
                 <div class="spinner" style="margin:0 auto 8px"></div>
                 Loading sign-in...
               </div>
             </div>`
        }

        <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:20px">
          Your data is encrypted and never sold. Built for veterans, by a veteran.
        </p>
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

  return `
    <div class="sidebar">
      <div style="padding:16px;border-bottom:1px solid #f3f4f6">
        <div style="font-weight:800;color:#1d4ed8;font-size:18px">🎖️ Tactics 2 Talent</div>
        <div style="font-size:11px;color:#9ca3af">Career Transition &middot; v0.8</div>
        ${displayName ? `<div style="font-size:12px;color:#6b7280;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(displayName)}">&#128100; ${esc(displayName)}</div>` : ''}
      </div>
      <nav style="flex:1;padding:8px;overflow-y:auto">
        ${items.map(i=>`<button class="nav-btn${state.view===i.id?' active':''}${i.highlight&&state.documents.length===0?' start-here':''}" onclick="setState({view:'${i.id}'}); closeNav()">${i.label}${i.highlight&&state.documents.length===0?' <span style="font-size:10px;background:#22c55e;color:white;padding:2px 6px;border-radius:999px;margin-left:4px">START</span>':''}</button>`).join('')}
      </nav>
     <div style="padding:8px;border-top:1px solid #f3f4f6">
        <button class="nav-btn" style="color:#ef4444" onclick="clerkSignOut()">&#128682; Sign Out</button>
        <div style="padding:4px 10px 8px;display:flex;gap:12px">
          <a href="/privacy.html" target="_blank" style="font-size:10px;color:#9ca3af;text-decoration:none">Privacy Policy</a>
          <a href="/terms.html" target="_blank" style="font-size:10px;color:#9ca3af;text-decoration:none">Terms of Service</a>
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
