// ── Render engine ─────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  if (!state.loggedIn) { app.innerHTML = renderLogin(); return; }
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
      <div class="login-card">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:48px;margin-bottom:8px">⚔</div>
          <h1 style="font-size:24px;font-weight:800;margin:0">VetCareer</h1>
          <p style="color:#6b7280;font-size:14px;margin:4px 0 0">Your transition to civilian success</p>
        </div>
        <div class="field">
          <label class="field-label">Email Address</label>
          <input type="email" id="login-email" placeholder="veteran@email.com" />
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px" onclick="doLogin()">Sign In →</button>
        <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:16px">Demo — enter any email to continue</p>
      </div>
    </div>`;
}

function doLogin() {
  const email = document.getElementById('login-email')?.value;
  if (!email) return;
  setState({ loggedIn: true, view: 'dashboard' });
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
  return `
    <div class="sidebar">
      <div style="padding:16px;border-bottom:1px solid #f3f4f6">
        <div style="font-weight:800;color:#1d4ed8;font-size:18px">⚔ VetCareer</div>
        <div style="font-size:11px;color:#9ca3af">Career Transition · v0.7</div>
      </div>
      <nav style="flex:1;padding:8px;overflow-y:auto">
        ${items.map(i=>`<button class="nav-btn${state.view===i.id?' active':''}${i.highlight&&state.documents.length===0?' start-here':''}" onclick="setState({view:'${i.id}'}); closeNav()">${i.label}${i.highlight&&state.documents.length===0?' <span style="font-size:10px;background:#22c55e;color:white;padding:2px 6px;border-radius:999px;margin-left:4px">START</span>':''}</button>`).join('')}
      </nav>
      <div style="padding:8px;border-top:1px solid #f3f4f6">
        <button class="nav-btn" style="color:#ef4444" onclick="setState({loggedIn:false,view:'dashboard'})">🚪 Sign Out</button>
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

