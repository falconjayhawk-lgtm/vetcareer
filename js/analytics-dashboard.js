// ── Analytics Dashboard — for Patrick's eyes only ─────────────────────
// Accessible at view 'stats' — not shown in sidebar to regular users
// Add ?stats=1 to URL or type setState({view:'stats'}) in console

function renderStats() {
  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">📊 Usage Analytics</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Feature usage across all beta users — updates as you load this page</p>
    <div id="stats-container">
      <div style="text-align:center;padding:40px;color:#9ca3af">
        <div class="spinner" style="margin:0 auto 12px"></div>
        Loading stats...
      </div>
    </div>
  `;
}

async function loadStats() {
  if (state.view !== 'stats') return;
  const container = document.getElementById('stats-container');
  if (!container) return;

  try {
    const token = await getClerkToken();
    const res = await fetch(`https://afteraction-api.falconjayhawk.workers.dev/api/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    const VIEW_LABELS = {
      dashboard:'Dashboard', documents:'Upload Docs', profile:'Profile',
      experience:'Experience', jobs:'Job Tracker', scout:'Job Scout',
      resume:'Resume Builder', linkedin:'LinkedIn Generator',
      interview:'Interview Prep', salary:'Salary Intel',
      network:'Networking Emails', refletter:'Reference Letter',
      sf86:'SF-86 Prep', gap:'Gap Analysis', settings:'Settings', faq:'Help & FAQ'
    };
    const ACTION_LABELS = {
      resume_generate:'Resumes Generated', linkedin_generate:'LinkedIn Profiles Generated',
      interview_generate:'Interview Preps Run', salary_generate:'Salary Reports Run',
      network_generate:'Networking Emails Written', refletter_generate:'Reference Letters Generated',
      scout_search:'Job Scout Searches', doc_upload:'Documents Uploaded',
      doc_paste:'Documents Pasted', job_added:'Jobs Added to Tracker',
      gap_analyze:'Gap Analyses Run', feedback_sent:'Feedback Submitted'
    };

    const maxView = Math.max(...Object.values(data.views || {}), 1);
    const maxAction = Math.max(...Object.values(data.actions || {}), 1);

    const bar = (count, max, color) => {
      const pct = Math.round((count / max) * 100);
      return `<div style="flex:1;background:#f3f4f6;border-radius:999px;height:8px;overflow:hidden">
        <div style="width:${pct}%;background:${color};height:100%;border-radius:999px;transition:width 0.4s"></div>
      </div>`;
    };

    const rowsViews = Object.entries(data.views || {})
      .sort((a,b) => b[1]-a[1])
      .map(([k,v]) => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6">
          <div style="width:150px;font-size:13px;font-weight:600;color:#374151;flex-shrink:0">${VIEW_LABELS[k]||k}</div>
          ${bar(v, maxView, '#3b82f6')}
          <div style="width:36px;text-align:right;font-size:14px;font-weight:800;color:#1d4ed8">${v}</div>
        </div>`).join('') || '<p style="color:#9ca3af;font-size:13px">No data yet</p>';

    const rowsActions = Object.entries(data.actions || {})
      .sort((a,b) => b[1]-a[1])
      .map(([k,v]) => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6">
          <div style="width:200px;font-size:13px;font-weight:600;color:#374151;flex-shrink:0">${ACTION_LABELS[k]||k}</div>
          ${bar(v, maxAction, '#22c55e')}
          <div style="width:36px;text-align:right;font-size:14px;font-weight:800;color:#15803d">${v}</div>
        </div>`).join('') || '<p style="color:#9ca3af;font-size:13px">No data yet</p>';

    const totalViews = Object.values(data.views||{}).reduce((a,b)=>a+b,0);
    const totalActions = Object.values(data.actions||{}).reduce((a,b)=>a+b,0);

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="card" style="text-align:center;padding:20px">
          <div style="font-size:36px;font-weight:800;color:#1d4ed8">${totalViews}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">Total Page Views</div>
        </div>
        <div class="card" style="text-align:center;padding:20px">
          <div style="font-size:36px;font-weight:800;color:#16a34a">${totalActions}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">Total Feature Uses</div>
        </div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <h2>🗺️ Page Navigation</h2>
        <p style="font-size:12px;color:#9ca3af;margin:-8px 0 12px">Which pages are users visiting?</p>
        ${rowsViews}
      </div>
      <div class="card">
        <h2>⚡ Feature Usage</h2>
        <p style="font-size:12px;color:#9ca3af;margin:-8px 0 12px">Which AI features are users actually using?</p>
        ${rowsActions}
      </div>
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:16px">
        Data updates in real-time. Reload this page to refresh. · 
        <button onclick="setState({view:'dashboard'})" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:12px;text-decoration:underline">Back to Dashboard</button>
      </p>
    `;
  } catch(e) {
    container.innerHTML = `<div style="color:#dc2626;font-size:13px;padding:20px">Error loading stats: ${e.message}</div>`;
  }
}
