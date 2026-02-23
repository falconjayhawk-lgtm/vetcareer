// ── Job Scout ─────────────────────────────────────────────────────────
// Uses Claude with real-time web search to find actual job postings

function renderScout() {
  const p = state.profile;
  const busy = state.ui.scoutBusy || false;
  const results = state.ui.scoutResults || '';
  const error = state.ui.scoutError || '';
  const feedback = state.ui.scoutFeedback || {};

  const industries = (p.targetIndustries || [])
    .map(i => typeof i === 'object' ? (i.subTypes && i.subTypes.length ? `${i.name} – ${i.subTypes.join(', ')}` : i.subType ? `${i.name} – ${i.subType}` : i.name) : i)
    .join(', ') || 'Not specified';

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">🔍 Job Scout</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Real-time job search powered by live web browsing</p>

    <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:14px;margin-bottom:20px;font-size:13px;color:#92400e">
      <strong>⚠️ Important:</strong> Job Scout searches the web in real time, but AI can still make mistakes. 
      Always verify postings directly on the company's career site before applying. 
      Postings may close quickly — check that the role is still active.
    </div>

    <div class="card">
      <h2>Search Filters</h2>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="field">
          <label class="field-label">Target Industries</label>
          <input type="text" id="sc-industries" value="${esc(industries)}" placeholder="e.g. Defense Contracting, Cybersecurity">
          <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">From your profile — edit here to refine</p>
        </div>
        <div class="field">
          <label class="field-label">Target Location</label>
          <input type="text" id="sc-location" value="${esc(p.location || '')}" placeholder="e.g. Washington DC, Remote, Northern Virginia">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="field">
          <label class="field-label">Clearance Level</label>
          <input type="text" id="sc-clearance" value="${esc(p.clearance || '')}" placeholder="e.g. TS/SCI">
        </div>
        <div class="field">
          <label class="field-label">Seniority Level</label>
          <select id="sc-seniority">
            <option value="mid-senior">Mid / Senior</option>
            <option value="senior">Senior / Director</option>
            <option value="manager">Manager / Lead</option>
            <option value="executive">Executive / VP</option>
            <option value="entry">Entry / Junior</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Work Preference</label>
          <select id="sc-remote">
            <option value="any">Any</option>
            <option value="remote">Remote only</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </div>
      </div>

      <div class="field" style="margin-bottom:16px">
        <label class="field-label">Additional Keywords / Notes</label>
        <input type="text" id="sc-keywords" placeholder="e.g. program manager, B-21, logistics, no travel required">
      </div>

      <div class="field" style="margin-bottom:20px">
        <label class="field-label">Feedback from Last Search (optional)</label>
        <textarea id="sc-feedback" rows="2" placeholder="e.g. Too many junior roles. Focus on GS-13+ equivalents. Avoid staffing firms. More Raytheon/L3Harris.">${esc(state.ui.scoutLastFeedback || '')}</textarea>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Tell Scout what to do differently this time</p>
      </div>

      <button class="btn btn-primary" onclick="runScout()" ${busy ? 'disabled' : ''} style="padding:12px 28px;font-size:15px">
        ${busy ? '🔍 Searching the web...' : '🔍 Find Real Jobs'}
      </button>
      ${busy ? `<p style="font-size:13px;color:#6b7280;margin:12px 0 0">Scout is browsing job boards and career pages live — this takes 20–40 seconds...</p>` : ''}
    </div>

    ${error ? `<div class="card" style="background:#fef2f2;border-color:#fecaca"><p style="color:#dc2626;margin:0">❌ ${esc(error)}</p></div>` : ''}

    ${results ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="margin:0">Search Results</h2>
        <button class="btn btn-secondary btn-sm" onclick="copyScoutResults()">📋 Copy All</button>
      </div>
      <div style="font-size:14px;line-height:1.7">${renderMarkdown(results)}</div>

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb">
        <h3 style="font-size:15px;font-weight:700;margin:0 0 8px">📝 Refine Next Search</h3>
        <p style="font-size:13px;color:#6b7280;margin:0 0 10px">Tell Scout what worked and what didn't — it will adjust next time.</p>
        <textarea id="sc-new-feedback" rows="3" placeholder="e.g. Good results but too many in Texas. Find more remote roles. I want more L3Harris and SAIC. Skip anything requiring a move." style="width:100%;box-sizing:border-box"></textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="saveScoutFeedback()">Save Feedback & Search Again</button>
      </div>
    </div>` : ''}
  `;
}

async function runScout() {
  const p = state.profile;
  const industries = document.getElementById('sc-industries')?.value || '';
  const location = document.getElementById('sc-location')?.value || '';
  const clearance = document.getElementById('sc-clearance')?.value || '';
  const seniority = document.getElementById('sc-seniority')?.value || 'mid-senior';
  const remote = document.getElementById('sc-remote')?.value || 'any';
  const keywords = document.getElementById('sc-keywords')?.value || '';
  const feedback = document.getElementById('sc-feedback')?.value || '';

  setState({ ui: { ...state.ui, scoutBusy: true, scoutError: '', scoutResults: '' }});

  const prompt = `You are a veteran career specialist. Search the web RIGHT NOW for real, currently posted job openings that match this veteran's profile.

VETERAN PROFILE:
- Name: ${p.fullName || 'Veteran'}
- Branch/Rank: ${p.branch || ''} ${p.rank || ''}
- MOS/Rate: ${p.mosRate || ''}
- Security Clearance: ${clearance || p.clearance || 'None listed'}
- Target Industries: ${industries}
- Target Location: ${location || 'Open'}
- Work Preference: ${remote}
- Seniority Level: ${seniority}
- Additional Keywords: ${keywords || 'None'}
${feedback ? `\nFEEDBACK FROM LAST SEARCH (adjust accordingly):\n${feedback}` : ''}

INSTRUCTIONS:
1. Search real job boards: LinkedIn, Indeed, USAJobs, and company career pages (Workday, iCIMS, Greenhouse portals)
2. Focus on companies known to hire veterans: Leidos, SAIC, Booz Allen, Raytheon, L3Harris, Northrop Grumman, General Dynamics, BAE Systems, ManTech, CACI, Peraton, and similar
3. Find 8-10 REAL, VERIFIED, CURRENTLY OPEN positions
4. For each job provide ALL of these fields:

---
**[Job Title]** at **[Company]**
📍 Location | 🏠 Remote/Hybrid/On-site
🔢 Req ID: [requisition number from the posting]
🔗 URL: [direct link to the job posting]
📅 Posted: [date or "recent"]
✅ Why it fits: [2-3 sentences connecting their background to this role]
---

5. If you cannot verify a posting is real and currently open, DO NOT include it.
6. After the listings, add a "🔍 Search Tips" section with 2-3 targeted search URLs the veteran can use themselves on LinkedIn and Indeed.

Search now and return only verified, real postings.`;

  try {
    const token = await getClerkToken();
    const res = await fetch(`${WORKER_URL}/api/scout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }

    const data = await res.json();
    setState({ ui: { ...state.ui, scoutBusy: false, scoutResults: data.text, scoutError: '' }});

  } catch (err) {
    setState({ ui: { ...state.ui, scoutBusy: false, scoutError: err.message }});
  }
}

function saveScoutFeedback() {
  const feedback = document.getElementById('sc-new-feedback')?.value || '';
  setState({ ui: { ...state.ui, scoutLastFeedback: feedback }});
  showToast('Feedback saved — starting new search...');
  setTimeout(runScout, 500);
}

function copyScoutResults() {
  const results = state.ui.scoutResults || '';
  navigator.clipboard.writeText(results).then(() => showToast('Results copied ✓'));
}
