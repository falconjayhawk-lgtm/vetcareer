// ── Job Scout v3 ──────────────────────────────────────────────────────
// Real USAJobs listings + civilian board links + saved searches + multi-search

function renderScout() {
  const p = state.profile;
  const busy = state.ui.scoutBusy || false;
  const multiSearchBusy = state.ui.multiSearchBusy || false;
  const results = state.ui.scoutResults || [];
  const multiResults = state.ui.multiResults || [];
  const error = state.ui.scoutError || '';
  const multiError = state.ui.multiError || '';
  const savedSearches = state.ui.savedSearches || [];
  const activeTab = state.ui.scoutActiveTab || 'single';

  const savedLocation  = state.ui.scoutLocation  !== undefined ? state.ui.scoutLocation  : (p.location || '');
  const savedKeywords  = state.ui.scoutKeywords  || '';
  const savedClearance = state.ui.scoutClearance !== undefined ? state.ui.scoutClearance : (p.clearance || '');
  const savedSeniority = state.ui.scoutSeniority || 'mid-senior';

  const seniorOpts = [
    {v:'entry',     l:'Entry / Junior (GS-5 to GS-9)'},
    {v:'mid-senior',l:'Mid / Senior (GS-11 to GS-13)'},
    {v:'senior',    l:'Senior / Director (GS-14 to GS-15)'},
    {v:'executive', l:'Executive / SES'},
  ];

  // Multi-search rows state
  const multiRows = state.ui.multiRows || [
    { keywords: '', location: savedLocation },
    { keywords: '', location: '' },
  ];

  function jobCard(job, i, isMulti) {
    const grade = job.grade || 5;
    const gradeColor = grade >= 8 ? '#16a34a' : grade >= 6 ? '#2563eb' : '#6b7280';
    const gradeLabel = grade >= 8 ? 'Strong Match' : grade >= 6 ? 'Good Match' : 'Possible Match';
    const tracked = !!(state.jobs || []).find(j => j.jobUrl === job.url);
    const trackedJob = (state.jobs || []).find(j => j.jobUrl === job.url);
    const trackFn = isMulti ? `trackMultiJob(${i})` : `trackScoutJob(${i})`;
    return `
      <div class="card" style="margin-bottom:10px;border-left:4px solid ${gradeColor}">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px">
              <span style="font-weight:700;font-size:15px">${esc(job.title)}</span>
              <span style="background:${gradeColor}18;color:${gradeColor};border:1px solid ${gradeColor}40;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:700">${grade}/10 ${gradeLabel}</span>
              ${job.veteranPreference ? `<span style="background:#fef3c7;color:#92400e;border:1px solid #fbbf24;border-radius:999px;padding:1px 7px;font-size:11px;font-weight:700">🎖 Vet Pref</span>` : ''}
            </div>
            <div style="font-size:13px;color:#4b5563"><strong>${esc(job.agency||job.company||'')}</strong> · ${esc(job.location)}</div>
            ${job.salary ? `<div style="font-size:12px;color:#16a34a;font-weight:600">${esc(job.salary)}</div>` : ''}
            ${job.gsGrade ? `<div style="font-size:11px;color:#6b7280">${esc(job.gsGrade)}</div>` : ''}
            ${job.closeDate ? `<div style="font-size:11px;color:#dc2626;font-weight:600">⏰ Closes: ${esc(job.closeDate)}</div>` : ''}
            ${job.searchLabel ? `<div style="font-size:11px;color:#7c3aed">🔍 ${esc(job.searchLabel)}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
            ${job.url ? `<a href="${esc(job.url)}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none;text-align:center">View →</a>` : ''}
            <button class="btn ${tracked?'btn-danger':'btn-secondary'} btn-sm" onclick="${tracked?`untrackScoutJob('${trackedJob?.id||''}')`:`${trackFn}`}">
              ${tracked ? '✕ Remove' : '+ Track'}
            </button>
          </div>
        </div>
        ${job.whyFits ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:8px;margin-top:8px;font-size:12px;color:#0c4a6e"><strong>✅</strong> ${esc(job.whyFits)}</div>` : ''}
        ${job.duties ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-top:4px;font-size:11px;color:#374151">${esc(job.duties)}</div>` : ''}
      </div>`;
  }

  // Build civilian links from current keyword/location inputs
  const buildCivilianLinks = (kw, loc) => {
    const k = encodeURIComponent(kw || 'program manager defense');
    const l = encodeURIComponent(loc || '');
    return [
      { name: 'LinkedIn',      icon: '💼', url: `https://www.linkedin.com/jobs/search/?keywords=${k}&location=${l}` },
      { name: 'ClearanceJobs', icon: '🔐', url: `https://www.clearancejobs.com/jobs?query=${k}&location=${l}` },
      { name: 'Indeed',        icon: '🔍', url: `https://www.indeed.com/jobs?q=${k}&l=${l}` },
      { name: 'USAJobs',       icon: '🏛️', url: `https://www.usajobs.gov/Search/Results?k=${k}&l=${l}` },
      { name: 'ZipRecruiter',  icon: '⚡', url: `https://www.ziprecruiter.com/jobs-search?search=${k}&location=${l}` },
      { name: 'Glassdoor',     icon: '🪟', url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${k}&locT=C&locName=${l}` },
    ];
  };

  const civilianLinks = buildCivilianLinks(savedKeywords, savedLocation);

  // Saved search chips
  const savedSearchChips = savedSearches.map((s, i) => `
    <div style="display:flex;align-items:center;gap:4px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:6px 10px">
      <button onclick="loadSavedSearch(${i})" style="background:none;border:none;cursor:pointer;font-size:12px;font-weight:600;color:#1d4ed8;padding:0;text-align:left">
        ${esc(s.name)}
        <span style="font-weight:400;color:#6b7280"> · ${esc(s.keywords)}</span>
        ${s.location ? `<span style="color:#9ca3af"> @ ${esc(s.location)}</span>` : ''}
      </button>
      <button onclick="deleteSavedSearch(${i})" style="background:none;border:none;cursor:pointer;color:#9ca3af;font-size:14px;padding:0 0 0 4px" title="Delete">✕</button>
    </div>`).join('');

  // Multi-search rows
  const multiRowHtml = multiRows.map((row, i) => `
    <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-bottom:8px">
      <div class="field" style="margin:0">
        ${i===0?'<label class="field-label">Keywords</label>':''}
        <input placeholder="e.g. business development manager" value="${esc(row.keywords)}"
          oninput="updateMultiRow(${i},'keywords',this.value)" style="font-size:13px">
      </div>
      <div class="field" style="margin:0">
        ${i===0?'<label class="field-label">Location</label>':''}
        <input placeholder="e.g. Kansas City, Remote, DC" value="${esc(row.location)}"
          oninput="updateMultiRow(${i},'location',this.value)" style="font-size:13px">
      </div>
      <button onclick="removeMultiRow(${i})" style="background:none;border:1px solid #e5e7eb;border-radius:6px;padding:6px 10px;cursor:pointer;color:#6b7280;font-size:14px;${i===0?'margin-top:22px':''}" title="Remove">✕</button>
    </div>`).join('');

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">🔍 Job Scout</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 16px">Real federal listings from USAJobs · Direct links to civilian boards · Multi-search</p>

    <!-- Tab bar -->
    <div style="display:flex;gap:4px;margin-bottom:20px;border-bottom:2px solid #e5e7eb;padding-bottom:0">
      ${[['single','🎯 Single Search'],['multi','⚡ Multi-Search'],['boards','🔗 Civilian Boards']].map(([t,l])=>`
        <button onclick="toggleUI('scoutActiveTab','${t}')" style="padding:8px 18px;font-size:13px;font-weight:600;border:none;border-bottom:${activeTab===t?'2px solid #2563eb':'2px solid transparent'};background:none;color:${activeTab===t?'#2563eb':'#6b7280'};cursor:pointer;margin-bottom:-2px">${l}</button>
      `).join('')}
    </div>

    <!-- ── SINGLE SEARCH TAB ── -->
    ${activeTab === 'single' ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h2 style="margin:0">Search Federal Jobs (USAJobs)</h2>
      </div>

      <!-- Saved searches -->
      ${savedSearches.length ? `
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Saved Searches</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${savedSearchChips}</div>
      </div>` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
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
            ${seniorOpts.map(o=>`<option value="${o.v}" ${savedSeniority===o.v?'selected':''}>${o.l}</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary" onclick="runScout()" ${busy?'disabled':''} style="padding:10px 22px">
          ${busy?'<div class="spinner"></div> Searching...':'🏛️ Search Federal Jobs (USAJobs)'}
        </button>
        <button class="btn btn-secondary" onclick="promptSaveSearch()" style="padding:10px 16px">💾 Save Search</button>
      </div>
      ${busy?`<div style="background:#eff6ff;border-radius:8px;padding:10px;margin-top:10px;font-size:13px;color:#1e40af">Fetching live listings from USAJobs...</div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin-top:10px;color:#dc2626;font-size:13px">❌ ${esc(error)}</div>`:''}

      <!-- Civilian boards inline -->
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid #f3f4f6">
        <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Also search civilian boards with these keywords →</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px" id="inline-board-btns">
          <button onclick="scoutOpenBoard('linkedin')" style="display:flex;align-items:center;gap:5px;padding:7px 13px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#374151">💼 LinkedIn</button>
          <button onclick="scoutOpenBoard('clearance')" style="display:flex;align-items:center;gap:5px;padding:7px 13px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#374151">🔐 ClearanceJobs</button>
          <button onclick="scoutOpenBoard('indeed')" style="display:flex;align-items:center;gap:5px;padding:7px 13px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#374151">🔍 Indeed</button>
          <button onclick="scoutOpenBoard('zip')" style="display:flex;align-items:center;gap:5px;padding:7px 13px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#374151">⚡ ZipRecruiter</button>
          <button onclick="scoutOpenBoard('glassdoor')" style="display:flex;align-items:center;gap:5px;padding:7px 13px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#374151">🪟 Glassdoor</button>
          <button onclick="scoutOpenAllBoards()" style="display:flex;align-items:center;gap:5px;padding:7px 13px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;color:#1d4ed8">🚀 All at once</button>
        </div>
        <p style="font-size:11px;color:#9ca3af;margin:6px 0 0">Uses the keywords and location you typed above</p>
      </div>
    </div>

    ${results.length > 0 ? `
    <div style="display:flex;justify-content:space-between;align-items:center;margin:16px 0 10px">
      <div>
        <h2 style="margin:0;font-size:17px;font-weight:700">Federal Results (${results.length} found)</h2>
        <p style="margin:2px 0 0;font-size:12px;color:#16a34a">✅ Real verified listings pulled directly from USAJobs</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="copyScoutResults()">📋 Copy All</button>
    </div>
    ${results.map((job,i)=>jobCard(job,i,false)).join('')}` : ''}
    ` : ''}

    <!-- ── MULTI-SEARCH TAB ── -->
    ${activeTab === 'multi' ? `
    <div class="card">
      <h2 style="margin:0 0 6px">⚡ Multi-Search</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 16px">Search multiple keyword + location combos at once. Great for casting a wide net across roles and regions.</p>

      ${multiRowHtml}

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button onclick="addMultiRow()" class="btn btn-secondary btn-sm">+ Add Row</button>
        <button onclick="addMultiFromSaved()" class="btn btn-secondary btn-sm" ${savedSearches.length?'':'disabled'}>+ Load from Saved (${savedSearches.length})</button>
      </div>

      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #f3f4f6">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
          <div class="field">
            <label class="field-label">Clearance (applies to all)</label>
            <input id="mc-clearance" value="${esc(savedClearance)}" placeholder="e.g. TS/SCI, Secret">
          </div>
          <div class="field">
            <label class="field-label">Seniority (applies to all)</label>
            <select id="mc-seniority">
              ${seniorOpts.map(o=>`<option value="${o.v}" ${savedSeniority===o.v?'selected':''}>${o.l}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-primary" onclick="runMultiSearch()" ${multiSearchBusy?'disabled':''} style="padding:10px 22px">
          ${multiSearchBusy?'<div class="spinner"></div> Searching all...':'⚡ Search All Combos'}
        </button>
      </div>
      ${multiSearchBusy?`<div style="background:#eff6ff;border-radius:8px;padding:10px;margin-top:10px;font-size:13px;color:#1e40af">Running ${multiRows.filter(r=>r.keywords).length} searches in parallel...</div>`:''}
      ${multiError?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin-top:10px;color:#dc2626;font-size:13px">❌ ${esc(multiError)}</div>`:''}
    </div>

    ${multiResults.length > 0 ? `
    <div style="display:flex;justify-content:space-between;align-items:center;margin:16px 0 10px">
      <div>
        <h2 style="margin:0;font-size:17px;font-weight:700">Multi-Search Results (${multiResults.length} total)</h2>
        <p style="margin:2px 0 0;font-size:12px;color:#16a34a">✅ Sorted by match score · Duplicates removed</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="copyMultiResults()">📋 Copy All</button>
    </div>
    ${multiResults.map((job,i)=>jobCard(job,i,true)).join('')}` : ''}
    ` : ''}

    <!-- ── CIVILIAN BOARDS TAB ── -->
    ${activeTab === 'boards' ? `
    <div class="card">
      <h2 style="margin:0 0 4px">🔗 Civilian Job Boards</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 16px">Links open pre-filled with your keywords and location. Always real, always current.</p>

      <!-- Quick filter inputs just for link building -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="field">
          <label class="field-label">Keywords</label>
          <input id="bl-keywords" value="${esc(savedKeywords)}" placeholder="e.g. defense business development">
        </div>
        <div class="field">
          <label class="field-label">Location</label>
          <input id="bl-location" value="${esc(savedLocation)}" placeholder="e.g. Kansas City, Remote">
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="refreshBoardLinks()" style="margin-bottom:16px">🔄 Update Links</button>

      <!-- Board grid -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px" id="civilian-links-grid">
        ${civilianLinks.map(l=>`
          <a href="${esc(l.url)}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;text-decoration:none;color:#111827;font-weight:600;font-size:13px" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='#f9fafb'">
            <span style="font-size:20px">${l.icon}</span><span>${l.name}</span>
          </a>`).join('')}
      </div>

      <!-- Saved search quick-launch -->
      ${savedSearches.length ? `
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6">
        <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Launch Saved Searches on All Boards</div>
        ${savedSearches.map((s,si)=>{
          const links2 = buildCivilianLinks(s.keywords, s.location);
          return `
          <div style="margin-bottom:14px">
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:6px">${esc(s.name)}: <span style="font-weight:400;color:#6b7280">"${esc(s.keywords)}"${s.location?' @ '+esc(s.location):''}</span></div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${links2.map(l=>`<a href="${esc(l.url)}" target="_blank" style="font-size:12px;padding:4px 12px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:999px;text-decoration:none;color:#374151;font-weight:600">${l.icon} ${l.name}</a>`).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>` : `
      <div style="margin-top:16px;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:13px;color:#92400e">
        💡 Save searches in the Single Search tab to get quick-launch buttons here for every board.
      </div>`}
    </div>
    ` : ''}
  `;

}

// ── Civilian board quick-launch (reads live input values) ──────────────
function scoutGetCurrentInputs() {
  const kw  = document.getElementById('sc-keywords')?.value?.trim() || state.ui.scoutKeywords || '';
  const loc = document.getElementById('sc-location')?.value?.trim() || state.ui.scoutLocation || '';
  return { kw, loc };
}

function scoutOpenBoard(board) {
  const { kw, loc } = scoutGetCurrentInputs();
  const k = encodeURIComponent(kw);
  const l = encodeURIComponent(loc);
  const urls = {
    linkedin:  `https://www.linkedin.com/jobs/search/?keywords=${k}&location=${l}`,
    clearance: `https://www.clearancejobs.com/jobs?query=${k}&location=${l}`,
    indeed:    `https://www.indeed.com/jobs?q=${k}&l=${l}`,
    zip:       `https://www.ziprecruiter.com/jobs-search?search=${k}&location=${l}`,
    glassdoor: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${k}&locT=C&locName=${l}`,
  };
  const url = urls[board];
  if (url) window.open(url, '_blank');
}

function scoutOpenAllBoards() {
  ['linkedin','clearance','indeed','zip','glassdoor'].forEach(b => scoutOpenBoard(b));
}

// ── Single Search ──────────────────────────────────────────────────────
async function runScout() {
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
    const jobs = await fetchScoutJobs({ keywords, location, clearance, seniority });
    if (typeof trackAction==='function') trackAction('scout_search');
    setState({ ui: { ...state.ui, scoutBusy: false, scoutResults: jobs,
      scoutError: jobs.length === 0 ? 'No listings found. Try broader keywords or a different location.' : ''
    }});
  } catch(err) {
    setState({ ui: { ...state.ui, scoutBusy: false, scoutError: err.message }});
  }
}

// ── Multi-Search ───────────────────────────────────────────────────────
async function runMultiSearch() {
  const rows = state.ui.multiRows || [];
  const clearance = document.getElementById('mc-clearance')?.value?.trim() || state.ui.scoutClearance || '';
  const seniority = document.getElementById('mc-seniority')?.value || 'mid-senior';
  const activeRows = rows.filter(r => r.keywords.trim());

  if (!activeRows.length) { showToast('Add at least one keyword row', false); return; }

  setState({ ui: { ...state.ui, multiSearchBusy: true, multiError: '', multiResults: [] }});

  try {
    // Run all searches in parallel
    const searches = activeRows.map(row =>
      fetchScoutJobs({ keywords: row.keywords, location: row.location, clearance, seniority })
        .then(jobs => jobs.map(j => ({ ...j, searchLabel: `${row.keywords}${row.location?' @ '+row.location:''}` })))
        .catch(() => [])
    );

    const allResults = await Promise.all(searches);

    // Flatten, deduplicate by URL, sort by grade
    const seen = new Set();
    const combined = allResults.flat()
      .filter(j => { if (!j.url || seen.has(j.url)) return false; seen.add(j.url); return true; })
      .sort((a, b) => b.grade - a.grade);

    setState({ ui: { ...state.ui, multiSearchBusy: false, multiResults: combined,
      multiError: combined.length === 0 ? 'No results found across any of your searches. Try broader keywords.' : ''
    }});
  } catch(err) {
    setState({ ui: { ...state.ui, multiSearchBusy: false, multiError: err.message }});
  }
}

// ── Shared fetch helper ────────────────────────────────────────────────
async function fetchScoutJobs({ keywords, location, clearance, seniority }) {
  const token = await getClerkToken();
  const res = await fetch(`${WORKER_URL}/api/scout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ mode: 'usajobs', keywords, location, clearance, seniority,
      veteranProfile: {
        branch: state.profile.branch, rank: state.profile.rank,
        mosRate: state.profile.mosRate,
        targetIndustries: (state.profile.targetIndustries||[]).map(i=>typeof i==='object'?i.name:i).join(', ')
      }
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  const data = await res.json();
  return data.jobs || [];
}

// ── Saved Searches ─────────────────────────────────────────────────────
function promptSaveSearch() {
  const keywords = document.getElementById('sc-keywords')?.value?.trim() || '';
  const location = document.getElementById('sc-location')?.value?.trim() || '';
  if (!keywords) { showToast('Enter keywords before saving', false); return; }
  const name = prompt(`Name this search:\n"${keywords}"${location?' @ '+location:''}`, keywords.slice(0,30));
  if (!name) return;
  const saved = [...(state.ui.savedSearches || []), { name: name.trim(), keywords, location }];
  setState({ ui: { ...state.ui, savedSearches: saved }});
  showToast(`"${name}" saved ✓`);
}

function loadSavedSearch(i) {
  const s = (state.ui.savedSearches || [])[i];
  if (!s) return;
  setState({ ui: { ...state.ui, scoutKeywords: s.keywords, scoutLocation: s.location, scoutActiveTab: 'single' }});
  showToast(`Loaded "${s.name}"`);
}

function deleteSavedSearch(i) {
  const saved = (state.ui.savedSearches || []).filter((_,idx) => idx !== i);
  setState({ ui: { ...state.ui, savedSearches: saved }});
}

// ── Multi-row helpers ──────────────────────────────────────────────────
function updateMultiRow(i, field, value) {
  const rows = [...(state.ui.multiRows || [])];
  rows[i] = { ...rows[i], [field]: value };
  setState({ ui: { ...state.ui, multiRows: rows }});
}

function addMultiRow() {
  const rows = [...(state.ui.multiRows || []), { keywords: '', location: state.ui.scoutLocation || '' }];
  setState({ ui: { ...state.ui, multiRows: rows }});
}

function removeMultiRow(i) {
  const rows = (state.ui.multiRows || []).filter((_,idx) => idx !== i);
  setState({ ui: { ...state.ui, multiRows: rows.length ? rows : [{ keywords:'', location:'' }] }});
}

function addMultiFromSaved() {
  const saved = state.ui.savedSearches || [];
  if (!saved.length) return;
  const newRows = saved.map(s => ({ keywords: s.keywords, location: s.location || '' }));
  setState({ ui: { ...state.ui, multiRows: newRows }});
  showToast(`Loaded ${newRows.length} saved searches`);
}

function refreshBoardLinks() {
  const kw = document.getElementById('bl-keywords')?.value?.trim() || '';
  const loc = document.getElementById('bl-location')?.value?.trim() || '';
  setState({ ui: { ...state.ui, scoutKeywords: kw, scoutLocation: loc }});
  showToast('Links updated ✓');
}

// ── Tracking ───────────────────────────────────────────────────────────
function trackScoutJob(i) {
  const job = (state.ui.scoutResults || [])[i];
  if (!job) return;
  _addJobToTracker(job);
}

function trackMultiJob(i) {
  const job = (state.ui.multiResults || [])[i];
  if (!job) return;
  _addJobToTracker(job);
}

function _addJobToTracker(job) {
  const now = new Date().toISOString();
  const newJob = {
    id: id(), title: job.title, company: job.agency||job.company||'',
    location: job.location, jobUrl: job.url, status: 'interested',
    dateAdded: now.split('T')[0], dateApplied:'', contactName:'',
    salaryRange: job.salary||'', interviewDates:'',
    notes: `${job.gsGrade?job.gsGrade+' | ':''}Closes: ${job.closeDate||'N/A'} | Match: ${job.grade}/10\n${job.whyFits||''}`,
    fitScore: job.grade,
    fitLabel: job.grade>=8?'Strong Match':job.grade>=6?'Good Match':'Possible Match',
    activityLog: [{ date: now, type:'status', from:null, to:'interested', note:'Added from Job Scout (USAJobs)' }]
  };
  setState({ jobs: [...state.jobs, newJob] });
  showToast(`${job.title} added to tracker ✓`);
}

function untrackScoutJob(jobId) {
  setState({ jobs: state.jobs.filter(j => j.id !== jobId) });
  showToast('Removed from tracker');
}

function copyScoutResults() {
  const jobs = state.ui.scoutResults || [];
  const text = jobs.map(j=>`${j.title} — ${j.agency||j.company}\n${j.location} | ${j.gsGrade||''} | ${j.salary||''}\nCloses: ${j.closeDate||'N/A'} | Match: ${j.grade}/10\n${j.url||''}`).join('\n\n---\n\n');
  navigator.clipboard.writeText(text).then(()=>showToast('Copied ✓'));
}

function copyMultiResults() {
  const jobs = state.ui.multiResults || [];
  const text = jobs.map(j=>`${j.title} — ${j.agency||j.company}\n${j.location} | ${j.salary||''} | Match: ${j.grade}/10\n${j.searchLabel||''}\n${j.url||''}`).join('\n\n---\n\n');
  navigator.clipboard.writeText(text).then(()=>showToast('Copied ✓'));
}
