// ── Supabase Sync Engine ──────────────────────────────────────────────
async function supabaseFetch(path, method = 'GET', body = null, extraHeaders = {}) {
  const { url, anonKey, userId } = state.supabase;
  if (!url || !anonKey || !userId) throw new Error('Supabase not configured');
  const fullUrl = `${url.replace(/\/$/, '')}/rest/v1/${path}`;
  console.log('[Supabase]', method, fullUrl, body ? JSON.stringify(body).slice(0,200) : '');
  const res = await fetch(fullUrl, {
    method,
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const responseText = await res.text();
  console.log('[Supabase] Response', res.status, responseText.slice(0, 500));
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${responseText}`);
  }
  if (method === 'GET' && responseText) {
    try { return JSON.parse(responseText); } catch(e) { return []; }
  }
  return null;
}

async function syncToSupabase(showFeedback = true) {
  const { url, anonKey, userId } = state.supabase;
  if (!url || !anonKey || !userId) {
    if (showFeedback) showToast('Configure Supabase in Settings first', false);
    return;
  }
  if (state.supabase.syncing) return;
  state.supabase = { ...state.supabase, syncing: true, syncError: '' };
  if (showFeedback) render();
  try {
    const payload = {
      user_id: userId,
      profile: state.profile,
      assignments: state.assignments,
      civilian_jobs: state.civilianJobs,
      awards: state.awards,
      jobs: state.jobs,
      checklist: state.checklist,
      scout_filters: state.scoutFilters,
      sf86: state.sf86,
      documents: state.documents.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        uploadDate: d.uploadDate,
        content: d.content || '',
        fileType: d.fileType || '',
        size: d.size || 0,
      })),
      updated_at: new Date().toISOString(),
    };
    await supabaseFetch('afteraction_data', 'POST', payload, {
      'Prefer': 'resolution=merge-duplicates,return=representation',
    });
    const now = new Date().toLocaleTimeString();
    state.supabase = { ...state.supabase, syncing: false, lastSync: now, syncError: '' };
    saveKey('supabase');
    if (showFeedback) { showToast('✓ Synced to cloud!'); render(); }
    else render();
  } catch(err) {
    state.supabase = { ...state.supabase, syncing: false, syncError: err.message };
    saveKey('supabase');
    if (showFeedback) showToast('Sync failed: ' + err.message, false);
    render();
  }
}

async function loadFromSupabase() {
  const { url, anonKey, userId } = state.supabase;
  if (!url || !anonKey || !userId) { showToast('Configure Supabase in Settings first', false); return; }
  state.supabase = { ...state.supabase, syncing: true, syncError: '' };
  render();
  try {
    const rows = await supabaseFetch(`afteraction_data?user_id=eq.${encodeURIComponent(userId)}&limit=1`);
    console.log('[Supabase] Load rows:', JSON.stringify(rows).slice(0, 500));
    if (!rows || rows.length === 0) {
      state.supabase = { ...state.supabase, syncing: false, syncError: 'No data found for this User ID' };
      showToast('No cloud data found for this User ID. Check that you synced from the other device first.', false);
      render(); return;
    }
    const d = rows[0];
    if (d.profile)       { state.profile      = d.profile;       saveKey('profile'); }
    if (d.assignments)   { state.assignments   = d.assignments;   saveKey('assignments'); }
    if (d.civilian_jobs) { state.civilianJobs  = d.civilian_jobs; saveKey('civilianJobs'); }
    if (d.awards)        { state.awards        = d.awards;        saveKey('awards'); }
    if (d.jobs)          { state.jobs          = d.jobs;          saveKey('jobs'); }
    if (d.checklist)     { state.checklist     = d.checklist;     saveKey('checklist'); }
    if (d.scout_filters) { state.scoutFilters  = d.scout_filters; saveKey('scoutFilters'); }
    if (d.sf86)          { state.sf86          = d.sf86;          saveKey('sf86'); }
    if (d.documents)     { state.documents     = d.documents;     saveKey('documents'); }
    const now = new Date().toLocaleTimeString();
    state.supabase = { ...state.supabase, syncing: false, lastSync: now, syncError: '' };
    saveKey('supabase');
    showToast('✓ Data loaded from cloud!');
    render();
  } catch(err) {
    state.supabase = { ...state.supabase, syncing: false, syncError: err.message };
    saveKey('supabase');
    showToast('Load failed: ' + err.message, false);
    render();
  }
}

function saveSupabaseConfig() {
  const url     = document.getElementById('sb-url')?.value?.trim();
  const anonKey = document.getElementById('sb-anon')?.value?.trim();
  const userId  = document.getElementById('sb-userid')?.value?.trim();
  if (!url || !anonKey || !userId) { showToast('Fill in all three Supabase fields', false); return; }
  setState({ supabase: { ...state.supabase, url, anonKey, userId } });
  showToast('Supabase config saved! ✓');
}

async function testSupabaseConnection() {
  const { url, anonKey, userId } = state.supabase;
  if (!url || !anonKey || !userId) { showToast('Save your config first', false); return; }
  showToast('Testing connection...', true);
  try {
    const rows   = await supabaseFetch(`afteraction_data?limit=1`);
    const myRows = await supabaseFetch(`afteraction_data?user_id=eq.${encodeURIComponent(userId)}&limit=1`);
    if (!myRows || myRows.length === 0) {
      showToast(`⚠️ Connection works but NO DATA found for User ID "${userId}". Click "Sync Now" from your main device first.`, false);
    } else {
      const d = myRows[0];
      const updatedAt = d.updated_at ? new Date(d.updated_at).toLocaleString() : 'unknown';
      showToast(`✅ Connected! Found your data (last updated: ${updatedAt}). Profile name: ${d.profile?.fullName||'(empty)'}`);
    }
  } catch(err) {
    showToast(`❌ Connection failed: ${err.message}`, false);
  }
}

// ── Settings ──────────────────────────────────────────────────────────
function renderSettings() {
  const sb = state.supabase;
  const syncConfigured = !!(sb.url && sb.anonKey && sb.userId);
  const userIsPro = isPro();

  // ── Manage Subscription button ──────────────────────────────────────
  const manageBtn = userIsPro
    ? `<button id="manage-billing-btn" class="btn btn-secondary"
              onclick="openCustomerPortal()"
              style="margin-top:12px">
         💳 Manage Subscription
       </button>`
    : `<button class="btn btn-secondary" disabled
              style="margin-top:12px;opacity:0.45;cursor:not-allowed"
              title="Subscribe to Pro to manage billing">
         💳 Manage Subscription
       </button>`;

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">Settings</h1>
    <p style="color:var(--muted);font-size:14px;margin:0 0 20px">Subscription, cloud sync, and data management</p>

    <!-- Subscription -->
    <div class="card">
      <h2>🎟️ Subscription</h2>
      ${userIsPro ? `
        <div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;
                    padding:14px;display:flex;align-items:center;gap:12px">
          <span style="font-size:28px">✅</span>
          <div>
            <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;color:var(--green);font-size:15px">
              Pro Access Active
            </div>
            <div style="font-size:13px;color:var(--green)">
              ${proExpiresLabel()}${getAccess().promoCode ? ' · Code: ' + getAccess().promoCode : ''}
            </div>
          </div>
        </div>
        <p style="font-size:12px;color:var(--dim);margin:10px 0 0;font-family:'Familjen Grotesk',sans-serif">
          Cancel, update your payment method, or view invoices via the Stripe Customer Portal.
        </p>
        ${manageBtn}
      ` : `
        <div style="background:var(--paper-dark);border:1px solid var(--rule);border-radius:2px;
                    padding:14px;margin-bottom:16px">
          <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:14px;
                      color:var(--text);margin-bottom:4px">Free Plan</div>
          <div style="font-size:13px;color:var(--muted)">
            Upgrade to Pro for AI Resume Builder, Job Scout, Interview Prep, and 6 more tools.
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="openUpgradeModal()">
            ⭐ Upgrade to Pro — $15/mo
          </button>
          ${manageBtn}
        </div>
        <div style="margin-top:16px">
          <div style="font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;
                      letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">
            Have a promo code?
          </div>
          ${promoCodeWidget('settings')}
        </div>
      `}
    </div>

    <!-- AI Status -->
    <div class="card">
      <h2>🤖 AI Features</h2>
      <div style="display:flex;align-items:center;gap:10px;background:var(--green-light);
                  border:1px solid #c8e6cd;border-radius:2px;padding:14px;font-size:14px;color:var(--green)">
        <span style="font-size:24px">✅</span>
        <div>
          <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700">AI is included with your subscription</div>
          <div style="font-size:13px;margin-top:2px">All AI features are ready to use — no personal API key needed.</div>
        </div>
      </div>
    </div>

    <!-- Supabase Cloud Sync -->
    <div class="card">
      <h2>☁️ Cloud Sync (Supabase)</h2>
      <p style="font-size:13px;color:var(--muted);margin:0 0 14px">Connect Supabase to sync your data across devices. Free tier is plenty — takes about 5 minutes to set up.</p>

      <div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:14px;margin-bottom:18px;font-size:13px;color:var(--green)">
        <strong>One-time setup (free):</strong><br>
        1. Go to <strong>supabase.com</strong> → Create a free account → New Project<br>
        2. Once created, go to <strong>Settings → API</strong> — copy your <strong>Project URL</strong> and <strong>anon public</strong> key<br>
        3. Go to <strong>SQL Editor</strong> and run this one-time setup query:<br>
        <pre style="background:var(--paper-dark);padding:10px;border-radius:2px;margin-top:8px;font-size:12px;overflow-x:auto;color:var(--text)">CREATE TABLE IF NOT EXISTS afteraction_data (
  user_id TEXT PRIMARY KEY,
  profile JSONB,
  assignments JSONB,
  civilian_jobs JSONB,
  awards JSONB,
  jobs JSONB,
  checklist JSONB,
  scout_filters JSONB,
  documents JSONB,
  sf86 JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE afteraction_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY &quot;anon full access&quot; ON afteraction_data FOR ALL USING (true) WITH CHECK (true);</pre>
        <div style="background:var(--gold-light);border:1px solid #e8d5a0;border-radius:2px;padding:8px 10px;margin-top:8px;font-size:12px;color:var(--gold)">
          <strong>Already have the table?</strong> Run this to add new columns:<br>
          <code>ALTER TABLE afteraction_data ADD COLUMN IF NOT EXISTS documents JSONB;</code><br>
          <code style="margin-top:4px;display:inline-block">ALTER TABLE afteraction_data ADD COLUMN IF NOT EXISTS sf86 JSONB;</code>
        </div>
        4. Choose any <strong>User ID</strong> — a nickname, email, or any unique string you'll remember<br>
        5. Paste all three below and click Save
      </div>

      <div class="grid2">
        <div class="field"><label class="field-label">Supabase Project URL</label>
          <input id="sb-url" value="${esc(sb.url||'')}" placeholder="https://xxxxxxxxxxxx.supabase.co" style="font-family:'DM Mono',monospace;font-size:12px"></div>
        <div class="field"><label class="field-label">Anon Public Key</label>
          <input id="sb-anon" value="${esc(sb.anonKey||'')}" placeholder="eyJhbGci..." style="font-family:'DM Mono',monospace;font-size:12px"></div>
        <div class="field"><label class="field-label">Your User ID (any unique nickname)</label>
          <input id="sb-userid" value="${esc(sb.userId||'')}" placeholder="john.smith or myemail@example.com"></div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="saveSupabaseConfig()">💾 Save Supabase Config</button>
        ${syncConfigured ? `
          <button class="btn btn-primary" onclick="syncToSupabase(true)" ${sb.syncing?'disabled':''} style="background:var(--green)">
            ${sb.syncing ? '<div class="spinner"></div> Syncing...' : '☁️ Sync Now'}
          </button>
          <button class="btn btn-secondary" onclick="loadFromSupabase()" ${sb.syncing?'disabled':''}>⬇ Load from Cloud</button>
          <button class="btn btn-secondary" onclick="testSupabaseConnection()">🔍 Test Connection</button>
        ` : ''}
      </div>
      ${syncConfigured ? `
        <div style="margin-top:12px;font-size:13px">
          ${sb.syncError ? `<div style="color:var(--red);background:var(--red-light);border-radius:2px;padding:8px;margin-bottom:6px">❌ ${esc(sb.syncError)}</div>` : ''}
          ${sb.lastSync && !sb.syncError ? `<div style="color:var(--green);margin-bottom:6px">✅ Last synced: ${esc(sb.lastSync)} — changes auto-sync within 2 seconds</div>` : ''}
          ${!sb.lastSync && !sb.syncError ? `<div style="color:var(--muted);margin-bottom:6px">⬆ Click "Sync Now" to push your local data to the cloud for the first time.</div>` : ''}
          <div style="color:var(--muted)">🔎 Verify your data: <a href="https://supabase.com/dashboard" target="_blank" style="color:var(--accent)">Open Supabase Dashboard ↗</a> → your project → Table Editor → <strong>afteraction_data</strong></div>
        </div>
      ` : `<div style="margin-top:12px;font-size:13px;color:var(--dim)">Configure and save Supabase credentials above to enable cloud sync.</div>`}
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
        💾 <strong>Recommendation:</strong> Export a backup before switching devices. Cloud sync is the better long-term solution.
      </div>
    </div>

    <!-- Privacy -->
    <div class="card">
      <h2>🔒 Privacy & Security</h2>
      <div style="font-size:13px;color:var(--muted)">
        <p>🔒 Your session is managed by Clerk — enterprise-grade authentication, never stored by T2T.</p>
        <p>🔒 AI calls go through our secure Worker proxy — your data is never sent to third parties.</p>
        <p>☁️ If Supabase sync is enabled, your profile and job data is stored in your own Supabase project.</p>
        <p>⚠️ Your Supabase anon key is stored in your browser. Keep your User ID and anon key private.</p>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="card" style="border:2px solid #fecaca">
      <h2 style="color:var(--red)">⚠️ Danger Zone</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">These actions are permanent and cannot be undone.</p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;
                    background:var(--red-light);border:1px solid #fecaca;border-radius:2px;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:14px;color:var(--text)">Restart Onboarding</div>
            <div style="font-size:12px;color:var(--muted)">Clears all your data and runs the setup wizard again.</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="confirmResetAndOnboard()">
            🔄 Erase & Restart
          </button>
        </div>
      </div>
    </div>`;
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
  const keys = ['profile','assignments','civilianJobs','awards','documents','jobs',
                 'apiKey','checklist','scoutFilters','sf86','supabase'];
  keys.forEach(k => localStorage.removeItem('vc_' + k));
  localStorage.removeItem('t2t_onboarding_complete');
  setState({
    profile: { fullName:'', email:'', phone:'', location:'', linkedin:'', branch:'', rank:'',
               yearsOfService:'', mosRate:'', clearance:'', clearanceStatus:'', workPreference:'',
               willingToRelocate:'', targetLocations:'', targetIndustries:[], technicalSkills:[],
               softSkills:[], education:'', certifications:'', training:'', elevatorPitch:'' },
    assignments: [], civilianJobs: [], awards: [], documents: [], jobs: [],
    checklist: {}, scoutFilters: {}, sf86: {},
    ui: { onboardStep: 1 },
    view: 'onboarding'
  });
}

function confirmResetAndOnboard() {
  if (confirm('⚠️ This will permanently erase all your profile data, documents, jobs, and resume history.\n\nAre you sure you want to start over?')) {
    resetAllData();
    showToast('Data cleared — starting onboarding');
  }
}

function exportData() {
  const exportPackage = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      profile:      state.profile,
      assignments:  state.assignments,
      civilianJobs: state.civilianJobs,
      awards:       state.awards,
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
        profile:      imported.data.profile      || {},
        assignments:  imported.data.assignments   || [],
        civilianJobs: imported.data.civilianJobs  || [],
        awards:       imported.data.awards        || [],
        documents:    imported.data.documents     || [],
        jobs:         imported.data.jobs          || [],
        checklist:    imported.data.checklist     || {},
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
