// ── Job Scout v2 ──────────────────────────────────────────────────────
// Real jobs from USAJobs API + curated civilian board search links
// No more AI hallucinated listings

function renderScout() {
  const p = state.profile;
  const busy = state.ui.scoutBusy || false;
  const results = state.ui.scoutResults || [];
  const error = state.ui.scoutError || '';
  const tab = state.ui.scoutTab || 'federal';

  const savedLocation   = state.ui.scoutLocation   !== undefined ? state.ui.scoutLocation   : (p.location || '');
  const savedKeywords   = state.ui.scoutKeywords   || '';
  const savedClearance  = state.ui.scoutClearance  !== undefined ? state.ui.scoutClearance  : (p.clearance || '');
  const savedSeniority  = state.ui.scoutSeniority  || 'mid-senior';
  const savedRemote     = state.ui.scoutRemote     || 'any';

  const seniorOpts = [
    {v:'entry',    l:'Entry / Junior (GS-5 to GS-9)'},
    {v:'mid-senior',l:'Mid / Senior (GS-11 to GS-13)'},
    {v:'senior',   l:'Senior / Director (GS-14 to GS-15)'},
    {v:'executive',l:'Executive / SES'},
  ];

  const federalResults = results.filter(j => j.source === 'USAJobs');
  const jobCards = results.map((job, i) => {
    const grade = job.grade || 5;
    const gradeColor = grade >= 8 ? '#16a34a' : grade >= 6 ? '#2563eb' : '#6b7280';
    const gradeLabel = grade >= 8 ? 'Strong Match' : grade >= 6 ? 'Good Match' : 'Possible Match';
    const tracked = !!(state.jobs || []).find(j => j.jobUrl === job.url);
    const trackedJob = (state.jobs || []).find(j => j.jobUrl === job.url);
    return `
      <div class="card" style="margin-bottom:12px;border-left:4px solid ${gradeColor}">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-weight:700;font-size:16px">${esc(job.title)}</span>
              <span style="background:${gradeColor}18;color:${gradeColor};border:1px solid ${gradeColor}40;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:700">${grade}/10 — ${gradeLabel}</span>
              ${job.veteranPreference ? `<span style="background:#fef3c7;color:#92400e;border:1px solid #fbbf24;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:700">🎖 Vet Pref</span>` : ''}
            </div>
            <div style="font-size:14px;color:#4b5563;margin-bottom:4px"><strong>${esc(job.agency || job.company)}</strong> · ${esc(job.location)}</div>
            ${job.salary ? `<div style="font-size:13px;color:#16a34a;font-weight:600">${esc(job.salary)}</div>` : ''}
            ${job.gsGrade ? `<div style="font-size:12px;color:#6b7280">${esc(job.gsGrade)}</div>` : ''}
            ${job.closeDate ? `<div style="font-size:12px;color:#dc2626;font-weight:600">⏰ Closes: ${esc(job.closeDate)}</div>` : ''}
            <div style="font-size:11px;color:#9ca3af;margin-top:2px">Source: ${esc(job.source)}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
            ${job.url ? `<a href="${esc(job.url)}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none;text-align:center">View →</a>` : ''}
            <button class="btn ${tracked ? 'btn-danger' : 'btn-secondary'} btn-sm" onclick="${tracked ? `untrackScoutJob('${trackedJob ? trackedJob.id : ''}')` : `trackScoutJob(${i})`}">
              ${tracked ? '✕ Remove' : '+ Track'}
            </button>
          </div>
        </div>
        ${job.whyFits ? `
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px;margin-top:10px;font-size:13px;color:#0c4a6e">
          <strong>✅ Why it fits:</strong> ${esc(job.whyFits)}
        </div>` : ''}
        ${job.duties ? `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-top:6px;font-size:12px;color:#374151">
          <strong>Role summary:</strong> ${esc(job.duties)}
        </div>` : ''}
      </div>`;
  }).join('');

  // Build civilian search links based on current filters
  const kw = encodeURIComponent(savedKeywords || 'program manager defense');
  const loc = encodeURIComponent(savedLocation || '');
  const civilianLinks = [
    { name: 'LinkedIn Jobs', icon: '💼', url: `https://www.linkedin.com/jobs/search/?keywords=${kw}&location=${loc}`, color: '#0077b5' },
    { name: 'ClearanceJobs', icon: '🔐', url: `https://www.clearancejobs.com/jobs?query=${kw}&location=${loc}`, color: '#1d4ed8' },
    { name: 'Indeed', icon: '🔍', url: `https://www.indeed.com/jobs?q=${kw}&l=${loc}`, color: '#2164f3' },
    { name: 'Handshake (Vet)', icon: '🤝', url: `https://joinhandshake.com/career-advice/job-search/`, color: '#e85d26' },
    { name: 'USAF Civilian', icon: '✈️', url: `https://www.usajobs.gov/Search/Results?a=AF&k=${kw}`, color: '#003087' },
    { name: 'DoD STEM Jobs', icon: '🛡️', url: `https://www.usajobs.gov/Search/Results?a=DD&k=${kw}`, color: '#4b5563' },
  ];

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">🔍 Job Scout</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Real federal job listings from USAJobs + direct links to civilian boards</p>

    <div class="card">
      <h2 style="margin:0 0 16px">Search Filters</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="field">
          <label class="field-label">Keywords / Role</label>
          <input id="sc-keywords" value="${esc(savedKeywords)}" placeholder="e.g. program manager, cybersecurity, logistics">
        </div>
        <div class="field">
          <label class="field-label">Location</label>
          <input id="sc-location" value="${esc(savedLocation)}" placeholder="e.g. Kansas City, Washington DC, Remote">
        </div>
        <div class="field">
          <label class="field-label">Clearance Level</label>
          <input id="sc-clearance" value="${esc(savedClearance)}" placeholder="e.g. TS/SCI, Secret">
        </div>
        <div class="field">
          <label class="field-label">Seniority / Grade</label>
          <select id="sc-seniority">
            ${seniorOpts.map(o => `<option value="${o.v}" ${savedSeniority===o.v?'selected':''}>${o.l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="runScout()" ${busy?'disabled':''} style="padding:10px 24px">
          ${busy ? '<div class="spinner"></div> Searching USAJobs...' : '🏛️ Search Federal Jobs'}
        </button>
        <button class="btn btn-secondary" onclick="updateCivilianLinks()" style="padding:10px 24px">
          🔗 Update Civilian Links
        </button>
      </div>
      ${busy ? `<div style="background:#eff6ff;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#1e40af">
        Fetching real listings from USAJobs... this takes a few seconds.</div>` : ''}
      ${error ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px;color:#dc2626;font-size:13px">❌ ${esc(error)}</div>` : ''}
    </div>

    <!-- Civilian job board links — always visible -->
    <div class="card" style="margin-top:16px">
      <h2 style="margin:0 0 4px">🔗 Civilian Job Boards</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 14px">Click to search these boards with your current filters. These are real job boards — results are always current.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px" id="civilian-links-grid">
        ${civilianLinks.map(l => `
          <a href="${l.url}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;text-decoration:none;color:#111827;font-weight:600;font-size:13px;transition:all 0.15s" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='#f9fafb'">
            <span style="font-size:20px">${l.icon}</span>
            <span>${l.name}</span>
          </a>`).join('')}
      </div>
    </div>

    ${results.length > 0 ? `
    <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 12px">
      <h2 style="margin:0;font-size:18px;font-weight:700">🏛️ Federal Listings (${results.length} found on USAJobs)</h2>
      <button class="btn btn-secondary btn-sm" onclick="copyScoutResults()">📋 Copy All</button>
    </div>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px;margin-bottom:14px;font-size:12px;color:#0c4a6e">
      ✅ These are <strong>real, verified listings</strong> pulled directly from USAJobs right now. Closing dates are live.
    </div>
    ${jobCards}` : ''}
  `;
}

async function runScout() {
  // Read all values before any state changes
  const keywords  = document.getElementById('sc-keywords')?.value?.trim() || '';
  const location  = document.getElementById('sc-location')?.value?.trim() || '';
  const clearance = document.getElementById('sc-clearance')?.value?.trim() || '';
  const seniority = document.getElementById('sc-seniority')?.value || 'mid-senior';

  setState({ ui: { ...state.ui,
    scoutBusy: true, scoutError: '', scoutResults: [],
    scoutKeywords: keywords, scoutLocation: location,
    scoutClearance: clearance, scoutSeniority: seniority
  }});

  try {
    const token = await getClerkToken();
    const res = await fetch(`${WORKER_URL}/api/scout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ mode: 'usajobs', keywords, location, clearance, seniority,
        veteranProfile: {
          branch: state.profile.branch,
          rank: state.profile.rank,
          mosRate: state.profile.mosRate,
          targetIndustries: (state.profile.targetIndustries||[]).map(i=>typeof i==='object'?i.name:i).join(', ')
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }

    const data = await res.json();
    setState({ ui: { ...state.ui, scoutBusy: false, scoutResults: data.jobs || [], scoutError: data.jobs?.length === 0 ? 'No listings found. Try broader keywords or a different location.' : '' }});

  } catch(err) {
    setState({ ui: { ...state.ui, scoutBusy: false, scoutError: err.message }});
  }
}

function updateCivilianLinks() {
  const keywords = document.getElementById('sc-keywords')?.value?.trim() || '';
  const location = document.getElementById('sc-location')?.value?.trim() || '';
  setState({ ui: { ...state.ui, scoutKeywords: keywords, scoutLocation: location }});
  showToast('Civilian links updated with your filters ✓');
}

function trackScoutJob(index) {
  const job = (state.ui.scoutResults || [])[index];
  if (!job) return;
  const now = new Date().toISOString();
  const newJob = {
    id: id(), title: job.title, company: job.agency || job.company || '',
    location: job.location, jobUrl: job.url, status: 'interested',
    dateAdded: now.split('T')[0], dateApplied: '', contactName: '',
    salaryRange: job.salary || '', interviewDates: '',
    notes: `${job.gsGrade ? job.gsGrade+' | ' : ''}Closes: ${job.closeDate || 'N/A'} | Match: ${job.grade}/10\n${job.whyFits || ''}`,
    fitScore: job.grade, fitLabel: job.grade >= 8 ? 'Strong Match' : job.grade >= 6 ? 'Good Match' : 'Possible Match',
    activityLog: [{ date: now, type: 'status', from: null, to: 'interested', note: 'Added from Job Scout (USAJobs)' }]
  };
  setState({ jobs: [...state.jobs, newJob] });
  showToast(`${job.title} added to Job Tracker ✓`);
}

function untrackScoutJob(jobId) {
  setState({ jobs: state.jobs.filter(j => j.id !== jobId) });
  showToast('Removed from Job Tracker');
}

function copyScoutResults() {
  const jobs = state.ui.scoutResults || [];
  const text = jobs.map(j =>
    `${j.title} — ${j.agency || j.company}\n${j.location} | ${j.gsGrade || ''} | ${j.salary || ''}\nCloses: ${j.closeDate || 'N/A'} | Match: ${j.grade}/10\n${j.url || ''}`
  ).join('\n\n---\n\n');
  navigator.clipboard.writeText(text).then(() => showToast('Copied ✓'));
}
