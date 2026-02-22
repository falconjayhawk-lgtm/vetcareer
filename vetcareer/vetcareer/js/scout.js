// ── Job Scout ─────────────────────────────────────────────────────────
function renderScout() {
  const sf = state.scoutFilters;
  const busy = state.ui.scoutBusy || false;
  const results = state.ui.scoutResults || null;
  const error = state.ui.scoutError || '';
  const status = state.ui.scoutStatus || '';
  const filtersSet = !!(sf.roleTypes || sf.domains || sf.geography);

  // Already-tracked job titles for deduplication hint
  const trackedTitles = state.jobs.map(j=>`${j.title} at ${j.company}`).join(', ') || 'None yet';

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">🔭 Job Scout</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Set your standing filters once — then run a targeted pull anytime to surface new, relevant postings with fit assessments. Think of this as a recruiter who already knows you.</p>

    ${!state.apiKey?`<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:20px;font-size:14px;color:#92400e">⚠️ <strong>API Key Required.</strong> Go to <strong>⚙ Settings</strong> to add your key first.</div>`:''}

    <!-- Standing Filters -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <h2 style="margin:0">⚙️ Your Standing Filters</h2>
        <button class="btn btn-primary btn-sm" onclick="saveScoutFilters()">💾 Save Filters</button>
      </div>
      <p style="font-size:13px;color:#6b7280;margin:0 0 16px">These are saved permanently and used every time you run a scout — you don't need to re-enter them. Be specific; Claude uses these to filter aggressively.</p>

      <div class="grid2">
        <div class="field">
          <label class="field-label">Target Role Types *</label>
          <textarea id="sf-roleTypes" rows="3" placeholder="Business Development Manager / Director&#10;Capture Manager / Strategic Capture&#10;Strategic Account Manager (DoD focused)&#10;Growth / Partnerships / Mission Strategy">${esc(sf.roleTypes)}</textarea>
          <div style="font-size:11px;color:#9ca3af;margin-top:3px">One role type per line, or comma-separated</div>
        </div>
        <div class="field">
          <label class="field-label">Target Domains / Mission Areas</label>
          <textarea id="sf-domains" rows="3" placeholder="USAF / USSF / INDOPACOM&#10;ABMS / JADC2 / C2 / ISR&#10;EW, autonomy, unmanned systems&#10;AI-enabled planning, kill chains">${esc(sf.domains)}</textarea>
          <div style="font-size:11px;color:#9ca3af;margin-top:3px">Specific programs, domains, or mission areas</div>
        </div>
        <div class="field">
          <label class="field-label">Geography Preference</label>
          <input id="sf-geography" value="${esc(sf.geography)}" placeholder="Remote preferred; Kansas City metro hybrid acceptable">
        </div>
        <div class="field">
          <label class="field-label">Target Seniority Level</label>
          <input id="sf-seniority" value="${esc(sf.seniority)}" placeholder="Director / Senior Manager — not VP with large team ownership">
        </div>
        <div class="field">
          <label class="field-label">Hard Exclusions (roles to skip)</label>
          <textarea id="sf-exclusions" rows="3" placeholder="Procurement / contracts admin&#10;Scrum Master / Agile Coach&#10;Non-remote outside my metro&#10;Civilian agencies not tied to DoD">${esc(sf.exclusions)}</textarea>
          <div style="font-size:11px;color:#9ca3af;margin-top:3px">Be specific — these are hard filters Claude will apply</div>
        </div>
        <div class="field">
          <label class="field-label">Target Companies (optional)</label>
          <textarea id="sf-companies" rows="3" placeholder="Leidos, Booz Allen, SAIC&#10;Palantir, Anduril, Shield AI&#10;Northrop, Raytheon, L3Harris&#10;Or leave blank to search broadly">${esc(sf.companies)}</textarea>
        </div>
      </div>
      <div class="field">
        <label class="field-label">Additional Standing Context</label>
        <textarea id="sf-additionalContext" rows="2" placeholder="Any other standing instructions — e.g., 'I have an active TS/SCI and prefer roles where clearance is a differentiator' or 'I am not interested in roles requiring >25% travel'">${esc(sf.additionalContext)}</textarea>
      </div>
    </div>

    <!-- Run Scout -->
    <div class="card" style="${!filtersSet?'opacity:0.6':''}">
      <h2>🚀 Run Job Scout</h2>
      <p style="font-size:13px;color:#6b7280;margin:-8px 0 14px">Claude will search for relevant postings, filter against your criteria, and return only jobs worth your time — with plain-English fit assessments. Jobs already in your tracker are flagged as duplicates.</p>

      ${!filtersSet?`<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px;color:#92400e">⚠️ Set your standing filters above and save them before running the scout.</div>`:''}

      <div class="field">
        <label class="field-label">Optional: Narrow this run (overrides nothing — just adds focus)</label>
        <input id="scout-focus" placeholder="e.g., 'Focus this run on Anduril and Shield AI only' or 'Only INDOPACOM-aligned roles this time'" value="${esc(state.ui.scoutFocus||'')}">
      </div>

      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="runScout()" ${busy||!filtersSet||!state.apiKey?'disabled':''} style="padding:12px 24px">
          ${busy?`<div class="spinner"></div> ${esc(status)}`:'🔭 Run Job Scout'}
        </button>
        ${results?`<button class="btn btn-secondary btn-sm" onclick="toggleUI('scoutResults',null)">Clear Results</button>`:''}
      </div>

      ${busy?`<div style="background:#eff6ff;border-radius:8px;padding:12px;margin-top:14px;font-size:13px;color:#1e40af;display:flex;align-items:center;gap:10px"><div class="spinner"></div> ${esc(status)} — this takes 30–60 seconds</div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>

    <!-- Results -->
    ${results ? renderScoutResults(results) : ''}`;
}

function renderScoutResults(results) {
  if (!results || !results.jobs) return '';
  const jobs = results.jobs || [];
  const summary = results.summary || '';
  const noResults = jobs.length === 0;

  return `
    <div class="card" style="border-left:4px solid #2563eb">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div>
          <h2 style="margin:0 0 4px">🔭 Scout Results</h2>
          <div style="font-size:13px;color:#6b7280">${esc(summary)}</div>
        </div>
        <span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;white-space:nowrap">${jobs.length} found</span>
      </div>

      ${noResults ? `
        <div style="text-align:center;padding:30px;color:#6b7280">
          <div style="font-size:32px;margin-bottom:8px">🔍</div>
          <div style="font-weight:600;margin-bottom:4px">No strong matches found this run</div>
          <div style="font-size:13px">That's useful signal — the market may be thin right now, or your filters are very tight. Try broadening your role types or companies and run again.</div>
        </div>` :
        jobs.map((j, idx) => {
          const scoreColor = j.fitScore>=8?'#16a34a':j.fitScore>=6?'#2563eb':j.fitScore>=4?'#d97706':'#dc2626';
          const scoreBg = j.fitScore>=8?'#dcfce7':j.fitScore>=6?'#dbeafe':j.fitScore>=4?'#fef9c3':'#fee2e2';
          const alreadyTracked = state.jobs.some(tj =>
            tj.title?.toLowerCase().includes((j.title||'').toLowerCase().split(' ')[0]) &&
            tj.company?.toLowerCase().includes((j.company||'').toLowerCase().split(' ')[0])
          );
          return `
            <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:12px;background:${alreadyTracked?'#f9fafb':'white'}">
              <div style="display:flex;justify-content:space-between;align-items:start;gap:12px;flex-wrap:wrap">
                <div style="flex:1">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                    <span style="font-weight:700;font-size:15px">${esc(j.title||'Unknown Title')}</span>
                    ${alreadyTracked?`<span style="background:#e5e7eb;color:#6b7280;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600">Already Tracked</span>`:''}
                    ${j.clearanceRequired?`<span style="background:#ede9fe;color:#6d28d9;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600">🔐 ${esc(j.clearanceRequired)}</span>`:''}
                  </div>
                  <div style="font-size:14px;color:#2563eb;font-weight:500">${esc(j.company||'')}${j.location?' — '+esc(j.location):''}</div>
                  ${j.salaryRange?`<div style="font-size:13px;color:#16a34a;font-weight:600">${esc(j.salaryRange)}</div>`:''}
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0">
                  <div style="width:52px;height:52px;border-radius:50%;background:${scoreBg};border:2px solid ${scoreColor};display:flex;flex-direction:column;align-items:center;justify-content:center">
                    <span style="font-size:18px;font-weight:800;color:${scoreColor};line-height:1">${j.fitScore||'?'}</span>
                    <span style="font-size:9px;color:${scoreColor};font-weight:600">/10</span>
                  </div>
                  <div style="font-size:10px;color:${scoreColor};font-weight:700;text-align:center;max-width:60px">${esc(j.fitLabel||'')}</div>
                </div>
              </div>

              <div style="margin-top:10px;background:#f8fafc;border-radius:8px;padding:10px">
                <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:4px">📋 ${esc(j.seniority||'')} ${j.worthYourTime===false?'— ⚠️ Flagged: Read notes':j.worthYourTime===true?'— ✅ Worth applying':''}</div>
                <div style="font-size:13px;color:#374151;line-height:1.6">${esc(j.assessment||'')}</div>
              </div>

              ${j.whyItMatters?`<div style="margin-top:8px;font-size:13px;color:#1e40af;background:#eff6ff;border-radius:6px;padding:8px"><strong>🎯 Why this fits you:</strong> ${esc(j.whyItMatters)}</div>`:''}
              ${j.watchOut?`<div style="margin-top:6px;font-size:13px;color:#92400e;background:#fffbeb;border-radius:6px;padding:8px"><strong>⚠️ Watch out:</strong> ${esc(j.watchOut)}</div>`:''}

              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                ${!alreadyTracked?`<button class="btn btn-primary btn-sm" onclick="addScoutJobToTracker(${idx})">+ Add to Tracker</button>`:''}
                ${j.jobUrl?`<a href="${esc(j.jobUrl)}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none">View Posting →</a>`:''}
              </div>
            </div>`;
        }).join('')}
    </div>`;
}

function saveScoutFilters() {
  const sf = {
    roleTypes: document.getElementById('sf-roleTypes')?.value?.trim() || '',
    domains: document.getElementById('sf-domains')?.value?.trim() || '',
    geography: document.getElementById('sf-geography')?.value?.trim() || '',
    seniority: document.getElementById('sf-seniority')?.value?.trim() || '',
    exclusions: document.getElementById('sf-exclusions')?.value?.trim() || '',
    companies: document.getElementById('sf-companies')?.value?.trim() || '',
    additionalContext: document.getElementById('sf-additionalContext')?.value?.trim() || '',
  };
  setState({ scoutFilters: sf });
  showToast('Scout filters saved! ✓');
}

async function runScout() {
  if (!state.apiKey) { showToast('Add your API key in Settings first', false); return; }
  const sf = state.scoutFilters;
  if (!sf.roleTypes) { showToast('Set your target role types first', false); return; }

  const focus = document.getElementById('scout-focus')?.value?.trim() || '';
  toggleUI('scoutFocus', focus);

  setState({ ui: { ...state.ui, scoutBusy: true, scoutStatus: '🔭 Searching for relevant postings...', scoutResults: null, scoutError: '' }});

  // Build the veteran context
  const p = state.profile;
  const vetContext = `VETERAN BACKGROUND (use this to assess fit — do not summarize back):
Branch: ${p.branch||'Not specified'} | Rank: ${p.rank||'N/A'} | Years of Service: ${p.yearsOfService||'N/A'}
MOS/Rate: ${p.mosRate||'N/A'} | Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Location: ${p.location||'Not specified'}
Recent Experience: ${state.assignments.slice(0,3).map(a=>`${a.dutyTitle} at ${a.base}`).join(', ')||'Not specified'}
Technical Skills: ${(p.technicalSkills||[]).slice(0,8).join(', ')||'Not specified'}`;

  const alreadyTracked = state.jobs.length > 0
    ? `JOBS ALREADY IN TRACKER (do not re-surface these):\n${state.jobs.map(j=>`${j.title} at ${j.company}`).join('\n')}`
    : 'No jobs tracked yet — surface anything that fits.';

  const prompt = `You are acting as a senior defense-industry job scout and career advisor who specializes in military-to-civilian transitions. You think like a recruiter who knows this veteran personally.

${vetContext}

STANDING FILTERS — apply these strictly:

TARGET ROLE TYPES (only surface roles matching these):
${sf.roleTypes}

TARGET DOMAINS / MISSION AREAS (prioritize postings in these areas):
${sf.domains || 'Not specified — use role types as primary filter'}

GEOGRAPHY:
${sf.geography || 'Not specified'}

TARGET SENIORITY:
${sf.seniority || 'Mid-to-senior level'}

HARD EXCLUSIONS — exclude any role that matches these:
${sf.exclusions || 'None specified'}

TARGET COMPANIES (if specified, prioritize these; otherwise search broadly):
${sf.companies || 'Search broadly across defense and defense-tech industry'}

ADDITIONAL CONTEXT:
${sf.additionalContext || 'None'}

${focus ? `THIS RUN FOCUS (additional narrowing for this run only):\n${focus}` : ''}

${alreadyTracked}

YOUR TASK:
Think carefully about the current defense-industry job market. Based on your knowledge of companies like Leidos, Booz Allen, SAIC, Northrop, Raytheon, L3Harris, Palantir, Anduril, Shield AI, Epirus, Rebellion Defense, and others — identify 4-8 SPECIFIC real job opportunities that:
1. Match the role types and domains above
2. Pass the hard exclusion filters
3. Are realistic for this veteran's background
4. Are NOT already in the tracker

For each job, provide an OPINIONATED assessment — be direct about whether it's worth pursuing. If a role looks like a bad fit, say so clearly.

Return ONLY this JSON (no markdown, no extra text):
{
  "summary": "One plain-English summary of what you found and the overall market signal",
  "jobs": [
    {
      "title": "exact job title",
      "company": "company name",
      "location": "location or Remote",
      "salaryRange": "estimated range if knowable, else empty string",
      "clearanceRequired": "clearance level if typically required, else empty string",
      "jobUrl": "careers page URL if you know the specific posting or company careers page, else empty string",
      "fitScore": <1-10>,
      "fitLabel": "Strong Fit / Good Fit / Moderate Fit / Weak Fit",
      "seniority": "On-Target / Stretch / Too Senior / Too Junior",
      "worthYourTime": true or false,
      "assessment": "2-3 sentence plain-English fit summary — be opinionated",
      "whyItMatters": "One sentence on why THIS veteran specifically should care about this role",
      "watchOut": "One sentence on any red flag or concern, or empty string if none"
    }
  ]
}`;

  try {
    setState({ ui: { ...state.ui, scoutBusy: true, scoutStatus: '🤖 Claude is scanning the market...' }});
    const raw = await callClaude(
      'You are a senior defense-industry career advisor and job scout who specializes in military-to-civilian transitions. You are direct, opinionated, and focused on signal over noise. You know the defense-tech job market well. Return valid JSON only.',
      prompt
    );

    let results;
    try {
      results = JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) {
      throw new Error('Could not parse scout results. Try again.');
    }

    setState({ ui: { ...state.ui, scoutBusy: false, scoutStatus: '', scoutResults: results, scoutError: '' }});
    showToast(`✓ Scout complete — ${results.jobs?.length||0} jobs found`);
  } catch(err) {
    setState({ ui: { ...state.ui, scoutBusy: false, scoutStatus: '', scoutError: 'Error: ' + err.message }});
  }
}

function addScoutJobToTracker(idx) {
  const jobs = state.ui.scoutResults?.jobs || [];
  const j = jobs[idx];
  if (!j) return;
  const newJob = {
    id: id(),
    title: j.title || '',
    company: j.company || '',
    location: j.location || '',
    salaryRange: j.salaryRange || '',
    jobUrl: j.jobUrl || '',
    status: 'interested',
    dateAdded: new Date().toISOString().split('T')[0],
    dateApplied: '',
    contactName: '',
    interviewDates: '',
    notes: [
      j.clearanceRequired ? `Clearance Required: ${j.clearanceRequired}` : '',
      j.watchOut ? `⚠️ Note: ${j.watchOut}` : '',
      `Scout Assessment: ${j.assessment||''}`
    ].filter(Boolean).join('\n'),
  };
  setState({ jobs: [...state.jobs, newJob] });
  showToast(`✓ "${j.title}" added to Job Tracker`);
}

