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
      // Sync document metadata + extracted text, but strip raw file binary (too large)
      documents: state.documents.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        uploadDate: d.uploadDate,
        content: d.content || '',       // extracted text — this is what matters
        fileType: d.fileType || '',
        size: d.size || 0,
        // Deliberately exclude: d.rawFile, d.dataUrl, d.base64 — raw binary
      })),
      updated_at: new Date().toISOString(),
    };
    // Use upsert: POST with merge-duplicates resolves INSERT vs UPDATE based on primary key
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
    if (d.profile) { state.profile = d.profile; saveKey('profile'); }
    if (d.assignments) { state.assignments = d.assignments; saveKey('assignments'); }
    if (d.civilian_jobs) { state.civilianJobs = d.civilian_jobs; saveKey('civilianJobs'); }
    if (d.awards) { state.awards = d.awards; saveKey('awards'); }
    if (d.jobs) { state.jobs = d.jobs; saveKey('jobs'); }
    if (d.checklist) { state.checklist = d.checklist; saveKey('checklist'); }
    if (d.scout_filters) { state.scoutFilters = d.scout_filters; saveKey('scoutFilters'); }
    if (d.sf86) { state.sf86 = d.sf86; saveKey('sf86'); }
    if (d.documents) { state.documents = d.documents; saveKey('documents'); }
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
  const url = document.getElementById('sb-url')?.value?.trim();
  const anonKey = document.getElementById('sb-anon')?.value?.trim();
  const userId = document.getElementById('sb-userid')?.value?.trim();
  if (!url || !anonKey || !userId) { showToast('Fill in all three Supabase fields', false); return; }
  setState({ supabase: { ...state.supabase, url, anonKey, userId } });
  showToast('Supabase config saved! ✓');
}

async function testSupabaseConnection() {
  const { url, anonKey, userId } = state.supabase;
  if (!url || !anonKey || !userId) { showToast('Save your config first', false); return; }
  showToast('Testing connection...', true);
  try {
    // Test 1: Can we reach the table at all?
    const rows = await supabaseFetch(`afteraction_data?limit=1`);
    console.log('[Test] Table accessible, rows:', rows?.length);
    
    // Test 2: Does a row exist for this user_id?
    const myRows = await supabaseFetch(`afteraction_data?user_id=eq.${encodeURIComponent(userId)}&limit=1`);
    console.log('[Test] My rows:', myRows?.length, myRows);
    
    if (!myRows || myRows.length === 0) {
      showToast(`⚠️ Connection works but NO DATA found for User ID "${userId}". Click "Sync Now" from your main device first.`, false);
    } else {
      const d = myRows[0];
      const updatedAt = d.updated_at ? new Date(d.updated_at).toLocaleString() : 'unknown';
      showToast(`✅ Connected! Found your data (last updated: ${updatedAt}). Profile name: ${d.profile?.fullName||'(empty)'}`);
    }
  } catch(err) {
    console.error('[Test] Error:', err);
    showToast(`❌ Connection failed: ${err.message}`, false);
  }
}

// ── Settings ──────────────────────────────────────────────────────────
function renderSettings() {
  const k = state.apiKey;
  const sb = state.supabase;
  const syncConfigured = !!(sb.url && sb.anonKey && sb.userId);
  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">Settings</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">API keys, cloud sync, and data management</p>

    <!-- AI Status -->
    <div class="card">
      <h2>🤖 AI Features</h2>
      <div style="display:flex;align-items:center;gap:10px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px;font-size:14px;color:#166534">
        <span style="font-size:24px">✅</span>
        <div>
          <div style="font-weight:700">AI is included with your subscription</div>
          <div style="font-size:13px;margin-top:2px">All resume generation, interview prep, salary intel, and other AI features are ready to use — no API key needed.</div>
        </div>
      </div>
    </div>

    <!-- Supabase Cloud Sync -->
    <div class="card">
      <h2>☁️ Cloud Sync (Supabase)</h2>
      <p style="font-size:13px;color:#4b5563;margin:0 0 14px">Connect Supabase to sync your data across devices. Free tier is plenty — takes about 5 minutes to set up.</p>

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px;margin-bottom:18px;font-size:13px;color:#166534">
        <strong>One-time setup (free):</strong><br>
        1. Go to <strong>supabase.com</strong> → Create a free account → New Project<br>
        2. Once created, go to <strong>Settings → API</strong> — copy your <strong>Project URL</strong> and <strong>anon public</strong> key<br>
        3. Go to <strong>SQL Editor</strong> and run this one-time setup query:<br>
        <pre style="background:#dcfce7;padding:10px;border-radius:6px;margin-top:8px;font-size:12px;overflow-x:auto">CREATE TABLE IF NOT EXISTS afteraction_data (
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
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 10px;margin-top:8px;font-size:12px;color:#92400e">
          <strong>Already have the table?</strong> Run this to add new columns:<br>
          <code style="background:#fef9c3;padding:2px 6px;border-radius:4px">ALTER TABLE afteraction_data ADD COLUMN IF NOT EXISTS documents JSONB;</code><br>
          <code style="background:#fef9c3;padding:2px 6px;border-radius:4px;margin-top:4px;display:inline-block">ALTER TABLE afteraction_data ADD COLUMN IF NOT EXISTS sf86 JSONB;</code>
        </div>
        4. Choose any <strong>User ID</strong> — a nickname, email, or any unique string you'll remember<br>
        5. Paste all three below and click Save
      </div>

      <div class="grid2">
        <div class="field"><label class="field-label">Supabase Project URL</label>
          <input id="sb-url" value="${esc(sb.url||'')}" placeholder="https://xxxxxxxxxxxx.supabase.co" style="font-family:monospace;font-size:12px"></div>
        <div class="field"><label class="field-label">Anon Public Key</label>
          <input id="sb-anon" value="${esc(sb.anonKey||'')}" placeholder="eyJhbGci..." style="font-family:monospace;font-size:12px"></div>
        <div class="field"><label class="field-label">Your User ID (any unique nickname)</label>
          <input id="sb-userid" value="${esc(sb.userId||'')}" placeholder="john.smith or myemail@example.com"></div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="saveSupabaseConfig()">💾 Save Supabase Config</button>
        ${syncConfigured?`
          <button class="btn btn-primary" onclick="syncToSupabase(true)" ${sb.syncing?'disabled':''} style="background:#059669">
            ${sb.syncing?'<div class="spinner"></div> Syncing...':'☁️ Sync Now'}
          </button>
          <button class="btn btn-secondary" onclick="loadFromSupabase()" ${sb.syncing?'disabled':''}>⬇ Load from Cloud</button>
          <button class="btn btn-secondary" onclick="testSupabaseConnection()">🔍 Test Connection</button>
        `:''}
      </div>
      ${syncConfigured?`
        <div style="margin-top:12px;font-size:13px">
          ${sb.syncError?`<div style="color:#dc2626;background:#fef2f2;border-radius:6px;padding:8px;margin-bottom:6px">❌ ${esc(sb.syncError)}</div>`:''}
          ${sb.lastSync&&!sb.syncError?`<div style="color:#16a34a;margin-bottom:6px">✅ Last synced: ${esc(sb.lastSync)} — changes auto-sync within 2 seconds</div>`:''}
          ${!sb.lastSync&&!sb.syncError?`<div style="color:#6b7280;margin-bottom:6px">⬆ Click "Sync Now" to push your local data to the cloud for the first time.</div>`:''}
          <div style="color:#6b7280">🔎 Verify your data: <a href="https://supabase.com/dashboard" target="_blank" style="color:#2563eb">Open Supabase Dashboard ↗</a> → your project → Table Editor → <strong>afteraction_data</strong></div>
        </div>
      `:`<div style="margin-top:12px;font-size:13px;color:#9ca3af">Configure and save Supabase credentials above to enable cloud sync.</div>`}
    </div>

    <!-- Data Backup -->
    <div class="card">
      <h2>📦 Data Backup & Restore</h2>
      <p style="font-size:13px;color:#4b5563;margin:0 0 16px">Download a local backup of all your data, or restore from a previous backup file.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="exportData()">⬇ Export All Data</button>
        <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">⬆ Import Data</button>
        <input type="file" id="import-file" accept=".json" style="display:none" onchange="importData(event)">
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-top:14px;font-size:13px;color:#92400e">
        💾 <strong>Recommendation:</strong> Export a backup before switching devices. Cloud sync is the better long-term solution.
      </div>
    </div>

    <!-- Privacy -->
    <div class="card">
      <h2>🔒 Privacy & Security</h2>
      <div style="font-size:13px;color:#4b5563">
        <p>🔒 Your Claude API key is stored only in your browser — never on any server.</p>
        <p>🔒 Resume generation calls go directly from your browser to Anthropic — no third parties.</p>
        <p>☁️ If Supabase sync is enabled, your profile and job data is stored in your own Supabase project — not on AfterAction servers.</p>
        <p>⚠️ Your Supabase anon key is stored in your browser. Anyone with your User ID and anon key could read your data — keep them private.</p>
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
  if (el) el.type = el.type==='password' ? 'text' : 'password';
}
function exportData() {

  const json = JSON.stringify(exportPackage, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AfterAction_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
      
      if (!imported.version || !imported.data) {
        throw new Error('Invalid backup file format');
      }

      // Confirm before overwriting
      if (!confirm('This will replace all current data with the imported backup. Your API key will not be affected. Continue?')) {
        return;
      }

      // Restore data
      setState({
        profile: imported.data.profile || {},
        assignments: imported.data.assignments || [],
        civilianJobs: imported.data.civilianJobs || [],
        awards: imported.data.awards || [],
        documents: imported.data.documents || [],
        jobs: imported.data.jobs || [],
        checklist: imported.data.checklist || {},
        view: 'dashboard' // Navigate to dashboard after import
      });

      showToast('✓ Data imported successfully!');
    } catch (err) {
      alert('Error importing data: ' + err.message + '. Make sure you selected a valid AfterAction backup file.');
    }
  };
  reader.readAsText(file);
  
  // Reset file input so the same file can be imported again if needed
  event.target.value = '';
}

