// ── Settings & Data Management ────────────────────────────────────────
function renderSettings() {
  const userIsPro = isPro();

  const manageBtn = userIsPro
    ? `<button id="manage-billing-btn" class="btn btn-secondary" onclick="openCustomerPortal()" style="margin-top:12px">💳 Manage Subscription</button>`
    : `<button class="btn btn-secondary" disabled style="margin-top:12px;opacity:0.45;cursor:not-allowed" title="Subscribe to Pro to manage billing">💳 Manage Subscription</button>`;

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">Settings</h1>
    <p style="color:var(--muted);font-size:14px;margin:0 0 20px">Subscription and data management</p>

    <!-- Subscription -->
    <div class="card">
      <h2>🎟️ Subscription</h2>
      ${userIsPro ? `
        <div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:14px;display:flex;align-items:center;gap:12px">
          <span style="font-size:28px">✅</span>
          <div>
            <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;color:var(--green);font-size:15px">Pro Access Active</div>
            <div style="font-size:13px;color:var(--green)">${proExpiresLabel()}${getAccess().promoCode ? ' · Code: ' + getAccess().promoCode : ''}</div>
          </div>
        </div>
        <p style="font-size:12px;color:var(--dim);margin:10px 0 0;font-family:'Familjen Grotesk',sans-serif">Cancel, update your payment method, or view invoices via the Stripe Customer Portal.</p>
        ${manageBtn}
      ` : `
        <div style="background:var(--paper-dark);border:1px solid var(--rule);border-radius:2px;padding:14px;margin-bottom:16px">
          <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:14px;color:var(--text);margin-bottom:4px">Free Plan</div>
          <div style="font-size:13px;color:var(--muted)">Upgrade to Pro for AI Resume Builder, Job Scout, Interview Prep, and 6 more tools.</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="openUpgradeModal()">⭐ Upgrade to Pro — $15/mo</button>
          ${manageBtn}
        </div>
        <div style="margin-top:16px">
          <div style="font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Have a promo code?</div>
          ${promoCodeWidget('settings')}
        </div>
      `}
    </div>

    <!-- AI Status -->
    <div class="card">
      <h2>🤖 AI Features</h2>
      <div style="display:flex;align-items:center;gap:10px;background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:14px;font-size:14px;color:var(--green)">
        <span style="font-size:24px">✅</span>
        <div>
          <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700">AI is included with your subscription</div>
          <div style="font-size:13px;margin-top:2px">All AI features are ready to use — no personal API key needed.</div>
        </div>
      </div>
    </div>

    <!-- Data Backup -->
    <div class="card">
      <h2>📦 Data Backup & Restore</h2>
      <p style="font-size:13px;color:var(--muted);margin:0 0 16px">Download a local backup of all your data, or restore from a previous backup file.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="exportData()">⬇ Export All Data</button>
        <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">⬆ Import Data</button>
        <input type="file" id="import-file" accept=".json" style="display:none" onchange="importData(event)">
      </div>
      <div style="background:var(--gold-light);border:1px solid #e8d5a0;border-radius:2px;padding:12px;margin-top:14px;font-size:13px;color:var(--gold)">
        💾 <strong>Recommendation:</strong> Export a backup regularly, and before switching devices.
      </div>
    </div>

    <!-- Privacy -->
    <div class="card">
      <h2>🔒 Privacy & Security</h2>
      <div style="font-size:13px;color:var(--muted)">
        <p>🔒 Your session is managed by Clerk — enterprise-grade authentication, never stored by T2T.</p>
        <p>🔒 AI calls go through our secure Worker proxy — your data is never sent to third parties.</p>
        <p>💾 Your data is stored locally in this browser. Export a backup to move it between devices.</p>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="card" style="border:2px solid #fecaca">
      <h2 style="color:var(--red)">⚠️ Danger Zone</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">These actions are permanent and cannot be undone.</p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--red-light);border:1px solid #fecaca;border-radius:2px;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:14px;color:var(--text)">Restart Onboarding</div>
            <div style="font-size:12px;color:var(--muted)">Clears all your data and runs the setup wizard again.</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="confirmResetAndOnboard()">🔄 Erase & Restart</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--red-light);border:1px solid #fecaca;border-radius:2px;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:14px;color:var(--text)">Delete All My Data</div>
            <div style="font-size:12px;color:var(--muted)">Erases your data in this browser and the records we hold on our servers. Billing records are kept as required by law.</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteAllMyData()">🗑 Delete Everything</button>
        </div>
      </div>
    </div>`;
}

// Deletes server-side records first, then everything held locally. Server first
// on purpose: if the request fails we stop and tell the user, rather than wiping
// their browser and leaving orphaned records behind.
async function deleteAllMyData() {
  if (!confirm(
    '⚠️ This permanently deletes your data.\n\n' +
    'On our servers: feedback you have submitted, promo access, and cached job searches.\n' +
    'In this browser: your profile, documents, job tracker, SF-86 worksheet, and everything else.\n\n' +
    'This cannot be undone. Export a backup first if you want to keep a copy.\n\nContinue?'
  )) return;

  if (!confirm('Last check — delete everything? This cannot be reversed.')) return;

  try {
    const token = await getClerkToken();
    const res = await fetch(`${WORKER_URL}/api/account/delete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 409) {
      alert(data.error || 'Please cancel your active subscription before deleting your data.');
      return;
    }
    if (!res.ok) throw new Error(data.error || 'Deletion failed. Please try again.');

    resetAllData();
    showToast('✓ Your data has been deleted.');
  } catch (err) {
    showToast('❌ ' + err.message, false);
  }
}

function saveApiKey() {
  const val = document.getElementById('api-key-input')?.value?.trim();
  if (!val) return;
  setState({ apiKey: val });
  showToast('API key saved! ✓');
}
function clearApiKey() { if(confirm('Remove API key?')) setState({ apiKey:'' }); }
function toggleApiKeyVis() {
  const el = document.getElementById('api-key-input');
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

// ── Reset & onboarding restart ────────────────────────────────────────
function resetAllData() {
  const keys = ['profile','assignments','civilianJobs','awards','achievements',
                 'documents','jobs','apiKey','checklist','scoutFilters','sf86'];
  // Clear both stores — sf86 lives in sessionStorage (S9), the rest in localStorage.
  keys.forEach(k => { localStorage.removeItem('vc_' + k); sessionStorage.removeItem('vc_' + k); });
  localStorage.removeItem('t2t_onboarding_complete');
  setState({
    profile: {
      fullName:'', email:'', phone:'', location:'', linkedin:'', branch:'', rank:'',
      yearsOfService:'', mosRate:'', clearance:'', clearanceStatus:'', workPreference:'',
      willingToRelocate:'', targetLocations:'', targetIndustries:[], technicalSkills:[],
      softSkills:[], education:'', certifications:'', training:'', elevatorPitch:''
    },
    assignments: [], civilianJobs: [], awards: [], achievements: [],
    documents: [], jobs: [], checklist: {}, scoutFilters: {}, sf86: {},
    ui: { onboardStep: 1 },
    view: 'onboarding'
  });
}

function confirmResetAndOnboard() {
  if (confirm('⚠️ This will permanently erase all your profile data, documents, jobs, achievements, and resume history.\n\nAre you sure you want to start over?')) {
    resetAllData();
    showToast('Data cleared — starting onboarding');
  }
}

function exportData() {
  const exportPackage = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      profile:      state.profile,
      assignments:  state.assignments,
      civilianJobs: state.civilianJobs,
      awards:       state.awards,
      achievements: state.achievements || [],
      stories:      state.stories      || [],
      timeline:     state.timeline     || {},
      documents:    state.documents,
      jobs:         state.jobs,
      checklist:    state.checklist,
    }
  };
  const json = JSON.stringify(exportPackage, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Tactical2Talent_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Data exported! Check your downloads folder.');
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.version || !imported.data) throw new Error('Invalid backup file format');
      if (!confirm('This will replace all current data with the imported backup. Continue?')) return;
      setState({
        profile:      imported.data.profile       || {},
        assignments:  imported.data.assignments    || [],
        civilianJobs: imported.data.civilianJobs   || [],
        awards:       imported.data.awards         || [],
        achievements: imported.data.achievements   || [],
        stories:      imported.data.stories        || [],
        timeline:     imported.data.timeline      || {},
        documents:    imported.data.documents      || [],
        jobs:         imported.data.jobs           || [],
        checklist:    imported.data.checklist      || {},
        view: 'dashboard'
      });
      showToast('✓ Data imported successfully!');
    } catch (err) {
      alert('Error importing data: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
