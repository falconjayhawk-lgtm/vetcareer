// ── Job Scout ─────────────────────────────────────────────────────────
// Uses Claude with real-time web search to find actual job postings

function renderScout() {
  const p = state.profile;
  const busy = state.ui.scoutBusy || false;
  const results = state.ui.scoutResults || [];
  const rawText = state.ui.scoutRawText || '';
  const error = state.ui.scoutError || '';

  const industries = (p.targetIndustries || [])
    .map(i => {
      if (typeof i === 'string') return i;
      if (i.subTypes && i.subTypes.length) return `${i.name} (${i.subTypes.join(', ')})`;
      if (i.subType) return `${i.name} (${i.subType})`;
      return `${i.name} (all areas)`;
    })
    .join(', ') || 'Not specified';

  const savedLocation = state.ui.scoutLocation !== undefined ? state.ui.scoutLocation : (p.location || '');
  // Map profile workPreference (capitalized) to scout remoteOpts (lowercase)
  const wpMap = {'Remote':'remote','Hybrid':'hybrid','On-Site':'onsite','Flexible':'any'};
  const savedRemote = state.ui.scoutRemote !== undefined ? state.ui.scoutRemote : (wpMap[p.workPreference] || 'any');
  const savedIndustries = state.ui.scoutIndustries !== undefined ? state.ui.scoutIndustries : industries;
  const savedClearance  = state.ui.scoutClearance  !== undefined ? state.ui.scoutClearance  : (p.clearance || '');
  const savedSeniority  = state.ui.scoutSeniority  || 'mid-senior';
  const savedKeywords   = state.ui.scoutKeywords   || '';

  const remoteOpts = ['any','remote','hybrid','onsite'];
  const seniorOpts = [
    {v:'entry',    l:'Entry / Junior'},
    {v:'mid-senior',l:'Mid / Senior'},
    {v:'senior',   l:'Senior / Director'},
    {v:'manager',  l:'Manager / Lead'},
    {v:'executive',l:'Executive / VP'},
  ];

  const jobCards = Array.isArray(results) ? results.map((job, i) => {
    const gradeColor = job.grade >= 8 ? '#16a34a' : job.grade >= 6 ? '#d97706' : '#dc2626';
    const gradeLabel = job.grade >= 8 ? 'Strong Match' : job.grade >= 6 ? 'Good Match' : 'Possible Match';
    const tracked = (state.jobs || []).some(j => j.jobUrl === job.url);
    return `
      <div class="card" style="margin-bottom:12px;border-left:4px solid ${gradeColor}">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-weight:700;font-size:16px">${esc(job.title)}</span>
              <span style="background:${gradeColor}18;color:${gradeColor};border:1px solid ${gradeColor}40;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:700">${job.grade}/10 — ${gradeLabel}</span>
            </div>
            <div style="font-size:14px;color:#4b5563;margin-bottom:2px"><strong>${esc(job.company)}</strong> · ${esc(job.location)}</div>
            ${job.reqId ? `<div style="font-size:12px;color:#9ca3af">Req ID: ${esc(job.reqId)}</div>` : ''}
            ${job.posted ? `<div style="font-size:12px;color:#9ca3af">Posted: ${esc(job.posted)}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
            ${job.url ? `<a href="${esc(job.url)}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none;text-align:center">Apply →</a>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="trackScoutJob(${i})" ${tracked ? 'disabled' : ''}>
              ${tracked ? '✓ Tracked' : '+ Track'}
            </button>
          </div>
        </div>
        ${job.whyFits ? `
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px;margin-top:10px;font-size:13px;color:#0c4a6e">
          <strong>✅ Why it fits:</strong> ${esc(job.whyFits)}
        </div>` : ''}
        ${job.pros ? `
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px;margin-top:6px;font-size:13px;color:#14532d">
          <strong>👍 Pros:</strong> ${esc(job.pros)}
        </div>` : ''}
        ${job.watchOut ? `
        <div style="background:#fffbeb;border:1px solid #fed7aa;border-radius:8px;padding:10px;margin-top:6px;font-size:13px;color:#92400e">
          <strong>⚠️ Watch out:</strong> ${esc(job.watchOut)}
        </div>` : ''}
      </div>`;
  }).join('') : '';

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">🔍 Job Scout</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Real-time job search powered by live web browsing</p>

    <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:14px;margin-bottom:20px;font-size:13px;color:#92400e">
      <strong>⚠️ Important:</strong> Job Scout searches the web in real time, but AI can still make mistakes.
      Always verify postings directly on the company's career site before applying.
    </div>

    <div class="card">
      <h2>Search Filters</h2>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="field">
          <label class="field-label">Target Industries</label>
          <input type="text" id="sc-industries" value="${esc(savedIndustries)}" placeholder="e.g. Defense Contracting, Cybersecurity">
          <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">From your profile — edit to refine</p>
        </div>
        <div class="field">
          <label class="field-label">Target Location</label>
          <input type="text" id="sc-location" value="${esc(savedLocation)}" placeholder="e.g. Northern Virginia, Washington DC">
          <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">City/region — separate from remote preference below</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="field">
          <label class="field-label">Clearance Level</label>
          <input type="text" id="sc-clearance" value="${esc(savedClearance)}" placeholder="e.g. TS/SCI">
        </div>
        <div class="field">
          <label class="field-label">Seniority Level</label>
          <select id="sc-seniority">
            ${seniorOpts.map(o => `<option value="${o.v}" ${savedSeniority===o.v?'selected':''}>${o.l}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Work Preference</label>
          <select id="sc-remote">
            ${remoteOpts.map(o => `<option value="${o}" ${savedRemote===o?'selected':''}>${o.charAt(0).toUpperCase()+o.slice(1)}</option>`).join('')}
          </select>
          <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Filters jobs by remote/on-site</p>
        </div>
      </div>

      <div class="field" style="margin-bottom:16px">
        <label class="field-label">Additional Keywords / Notes</label>
        <input type="text" id="sc-keywords" value="${esc(savedKeywords)}" placeholder="e.g. program manager, B-21, logistics, no travel required">
      </div>

      <div class="field" style="margin-bottom:20px">
        <label class="field-label">Feedback / Refinements (optional)</label>
        <textarea id="sc-feedback" rows="2" placeholder="e.g. Too many junior roles. Focus on GS-13+ equivalents. More Raytheon/L3Harris. Skip staffing firms.">${esc(state.ui.scoutLastFeedback || '')}</textarea>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Tell Scout what to adjust from last time</p>
      </div>

      <button class="btn btn-primary" onclick="runScout()" ${busy ? 'disabled' : ''} style="padding:12px 28px;font-size:15px">
        ${busy ? '🔍 Searching the web...' : '🔍 Find Real Jobs'}
      </button>
      ${busy ? `<p style="font-size:13px;color:#6b7280;margin:12px 0 0">Browsing job boards live — this takes 20–40 seconds...</p>` : ''}
    </div>

    ${error ? `<div class="card" style="background:#fef2f2;border-color:#fecaca"><p style="color:#dc2626;margin:0">❌ ${esc(error)}</p></div>` : ''}

    ${Array.isArray(results) && results.length > 0 ? `
    <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 12px">
      <h2 style="margin:0;font-size:18px;font-weight:700">Search Results (${results.length} jobs found)</h2>
      <button class="btn btn-secondary btn-sm" onclick="copyScoutResults()">📋 Copy All</button>
    </div>
    ${jobCards}
    <div class="card" style="margin-top:4px">
      <h3 style="font-size:15px;font-weight:700;margin:0 0 8px">📝 Refine Next Search</h3>
      <textarea id="sc-new-feedback" rows="2" placeholder="e.g. Good results but too many in Texas. Find more remote. I want more SAIC. Skip anything requiring a move." style="width:100%;box-sizing:border-box"></textarea>
      <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="saveScoutFeedback()">Save Feedback & Search Again</button>
    </div>` : ''}
  `;
}

async function runScout() {
  const p = state.profile;
  const industries = document.getElementById('sc-industries')?.value || '';
  const location   = document.getElementById('sc-location')?.value || '';
  const clearance  = document.getElementById('sc-clearance')?.value || '';
  const seniority  = document.getElementById('sc-seniority')?.value || 'mid-senior';
  const remote     = document.getElementById('sc-remote')?.value || 'any';
  const keywords   = document.getElementById('sc-keywords')?.value || '';
  const feedback   = document.getElementById('sc-feedback')?.value || '';

  // Persist all filter values so they survive re-renders
  setState({ ui: { ...state.ui,
    scoutBusy: true, scoutError: '', scoutResults: [], scoutRawText: '',
    scoutLocation: location, scoutIndustries: industries, scoutClearance: clearance,
    scoutSeniority: seniority, scoutRemote: remote, scoutKeywords: keywords
  }});

  const remoteInstruction = remote === 'any' ? 'any work arrangement'
    : remote === 'remote' ? 'REMOTE positions only — do not include on-site or hybrid'
    : remote === 'hybrid' ? 'hybrid positions (mix of remote and on-site)'
    : 'on-site positions';

  const prompt = `Find 6 real current job postings for this veteran. Search USAJobs, LinkedIn, Indeed, ClearanceJobs, and company career pages now.

Profile: ${p.rank || ''} ${p.branch || ''}, MOS ${p.mosRate || ''}, clearance: ${clearance || p.clearance || 'none'}, seeking ${seniority} ${industries || 'defense/gov'} roles, ${remoteInstruction}, near ${location || 'anywhere'}.${keywords ? ' Keywords: '+keywords+'.' : ''}${feedback ? ' Adjust: '+feedback : ''}

Return ONLY this JSON (no other text):
{"jobs":[{"title":"","company":"","location":"","reqId":"","posted":"","url":"","grade":8,"whyFits":"","pros":"","watchOut":""}]}

grade=1-10 match. Only real verified postings with working URLs.`;

  try {
    const token = await getClerkToken();
    const res = await fetch(`${WORKER_URL}/api/scout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }

    const data = await res.json();
    const rawText = data.text || '';

    // Parse JSON from response
    let jobs = [];
    try {
      const match = rawText.match(/\{[\s\S]*"jobs"[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        jobs = parsed.jobs || [];
      }
    } catch(e) {
      // If JSON parse fails, fall back to showing raw text
      setState({ ui: { ...state.ui, scoutBusy: false, scoutRawText: rawText, scoutResults: [], scoutError: '' }});
      return;
    }

    setState({ ui: { ...state.ui, scoutBusy: false, scoutResults: jobs, scoutRawText: rawText, scoutError: '' }});

  } catch (err) {
    setState({ ui: { ...state.ui, scoutBusy: false, scoutError: err.message }});
  }
}

function trackScoutJob(index) {
  const jobs = state.ui.scoutResults || [];
  const job = jobs[index];
  if (!job) return;
  const now = new Date().toISOString();
  const newJob = {
    id: id(),
    title: job.title,
    company: job.company,
    location: job.location,
    jobUrl: job.url,
    status: 'interested',
    dateAdded: now.split('T')[0],
    dateApplied: '',
    contactName: '',
    salaryRange: '',
    interviewDates: '',
    notes: `Req ID: ${job.reqId || 'N/A'} | Match: ${job.grade}/10 — ${job.whyFits || ''}`,
    activityLog: [{ date: now, type: 'status', from: null, to: 'interested', note: 'Added from Job Scout' }]
  };
  setState({ jobs: [...state.jobs, newJob] });
  showToast(`${job.title} added to Job Tracker ✓`);
}

function saveScoutFeedback() {
  const feedback = document.getElementById('sc-new-feedback')?.value || '';
  setState({ ui: { ...state.ui, scoutLastFeedback: feedback }});
  showToast('Feedback saved — searching...');
  setTimeout(runScout, 300);
}

function copyScoutResults() {
  const jobs = state.ui.scoutResults || [];
  const text = jobs.map(j =>
    `${j.title} at ${j.company}\n${j.location} | Match: ${j.grade}/10\nReq ID: ${j.reqId||'N/A'}\nURL: ${j.url||'N/A'}\n${j.whyFits||''}`
  ).join('\n\n---\n\n');
  navigator.clipboard.writeText(text).then(() => showToast('Results copied ✓'));
}
