// ── Render engine ─────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');

  if (!state.loggedIn) {
    app.innerHTML = renderLogin();
    // Mount Clerk's sign-in widget after the container is in the DOM
    setTimeout(() => mountClerkSignIn('clerk-signin-container'), 50);
    return;
  }

  app.innerHTML = `
    <div style="display:flex;min-height:100vh">
      ${renderSidebar()}
      <div class="main">${renderView()}</div>
    </div>`;

  // Show mobile back button when not on dashboard
  const backBtn = document.getElementById('mobile-back');
  if (backBtn) backBtn.style.display = state.view !== 'dashboard' ? 'block' : 'none';
  bindEvents();
}

function renderLogin() {
  return `
    <div class="login-page">
      <div class="login-card" style="width:420px;max-width:95vw">
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:48px;margin-bottom:8px">⚔</div>
          <h1 style="font-size:26px;font-weight:800;margin:0;color:#111827">VetCareer</h1>
          <p style="color:#6b7280;font-size:14px;margin:6px 0 0">Your military-to-civilian transition platform</p>
        </div>

        <!-- Clerk mounts its sign-in UI here -->
        <div id="clerk-signin-container"></div>

        <p style="text-align:center;font-size:11px;color:#d1d5db;margin-top:20px">
          Your data is encrypted and never sold. Built for veterans, by a veteran.
        </p>
      </div>
    </div>`;
}

function renderSidebar() {
  const items = [
    {id:'dashboard',label:'🏠 Dashboard'},
    {id:'documents',label:'📤 Upload Docs',highlight:true},
    {id:'profile',label:'👤 Profile'},
    {id:'experience',label:'🗺 Experience'},
    {id:'jobs',label:'💼 Job Tracker'},
    {id:'scout',label:'🔭 Job Scout'},
    {id:'resume',label:'📄 Resume Builder'},
    {id:'linkedin',label:'💼 LinkedIn Generator'},
    {id:'interview',label:'🎤 Interview Prep'},
    {id:'salary',label:'💰 Salary Intel'},
    {id:'network',label:'📬 Networking Emails'},
    {id:'refletter',label:'📜 Reference Letter'},
    {id:'sf86',label:'🔐 SF-86 Prep'},
    {id:'gap',label:'📊 Gap Analysis'},
    {id:'settings',label:'⚙ Settings'},
  ];

  const displayName = getDisplayName();

  return `
    <div class="sidebar">
      <div style="padding:16px;border-bottom:1px solid #f3f4f6">
        <div style="font-weight:800;color:#1d4ed8;font-size:18px">⚔ VetCareer</div>
        <div style="font-size:11px;color:#9ca3af">Career Transition · v0.8</div>
        ${displayName ? `<div style="font-size:12px;color:#6b7280;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(displayName)}">👤 ${esc(displayName)}</div>` : ''}
      </div>
      <nav style="flex:1;padding:8px;overflow-y:auto">
        ${items.map(i=>`<button class="nav-btn${state.view===i.id?' active':''}${i.highlight&&state.documents.length===0?' start-here':''}" onclick="setState({view:'${i.id}'}); closeNav()">${i.label}${i.highlight&&state.documents.length===0?' <span style="font-size:10px;background:#22c55e;color:white;padding:2px 6px;border-radius:999px;margin-left:4px">START</span>':''}</button>`).join('')}
      </nav>
      <div style="padding:8px;border-top:1px solid #f3f4f6">
        <button class="nav-btn" style="color:#ef4444" onclick="clerkSignOut()">🚪 Sign Out</button>
      </div>
    </div>`;
}

function renderView() {
  switch(state.view) {
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
    default: return renderDashboard();
  }
}
