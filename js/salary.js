// ── Salary Intel ──────────────────────────────────────────────────────
function renderSalary() {
  const jobs = state.jobs;
  const selJob = state.ui.salaryJob||'';
  const busy = state.ui.salaryBusy||false;
  const result = state.ui.salaryResult||null;
  const error = state.ui.salaryError||'';
  const jobOptions = jobs.map(j=>`<option value="${j.id}" ${selJob===j.id?'selected':''}>${esc(j.title)} — ${esc(j.company)}</option>`).join('');
  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">💰 Salary Intelligence</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Know your number before you walk in. Get market-calibrated salary ranges, negotiation anchors, and veteran-specific leverage points for any target role.</p>
    
    <div class="card">
      <h2>Configure Salary Research</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Target Job (from tracker)</label>
          <select id="sal-job" onchange="toggleUI('salaryJob',this.value)">
            <option value="">Select a job...</option>${jobOptions}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Or enter role manually</label>
          <input id="sal-role" placeholder="e.g., Business Development Director — Defense" value="${esc(state.ui.salaryRole||'')}">
        </div>
        <div class="field">
          <label class="field-label">Location / Market</label>
          <input id="sal-location" placeholder="Washington DC metro, Remote, San Diego..." value="${esc(state.ui.salaryLocation||state.profile.location||'')}">
        </div>
        <div class="field">
          <label class="field-label">Company Type</label>
          <select id="sal-company-type" onchange="toggleUI('salaryCompanyType',this.value)">
            <option value="large-defense" ${(state.ui.salaryCompanyType||'large-defense')==='large-defense'?'selected':''}>Large Defense Contractor (Leidos, SAIC, Northrop)</option>
            <option value="mid-defense" ${(state.ui.salaryCompanyType||'')==='mid-defense'?'selected':''}>Mid-size Defense / GovCon</option>
            <option value="startup-defense" ${(state.ui.salaryCompanyType||'')==='startup-defense'?'selected':''}>Defense Tech Startup (Anduril, Shield AI, Palantir)</option>
            <option value="federal" ${(state.ui.salaryCompanyType||'')==='federal'?'selected':''}>Federal Government (GS/SES)</option>
            <option value="commercial" ${(state.ui.salaryCompanyType||'')==='commercial'?'selected':''}>Commercial Tech / Private Sector</option>
            <option value="consulting" ${(state.ui.salaryCompanyType||'')==='consulting'?'selected':''}>Consulting Firm</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Current / Most Recent Compensation</label>
          <input id="sal-current" placeholder="Military pay + BAH, or last salary — helps anchor the negotiation" value="${esc(state.ui.salaryCurrent||'')}">
        </div>
        <div class="field">
          <label class="field-label">Your biggest negotiation worry</label>
          <input id="sal-worry" placeholder="e.g., don't know if clearance premium applies, first civilian job..." value="${esc(state.ui.salaryWorry||'')}">
        </div>
      </div>
      <button class="btn btn-primary" onclick="generateSalaryIntel()" ${busy?'disabled':''} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Researching...':'💰 Get Salary Intelligence'}
      </button>
      ${busy?`<div style="background:#eff6ff;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#1e40af;display:flex;align-items:center;gap:10px"><div class="spinner"></div> Analyzing market data and your negotiation position...</div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>
    ${result?`
    <div class="card" style="border-left:4px solid #16a34a">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div><h2 style="margin:0">💰 Salary Intelligence Report</h2>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Based on Claude's knowledge of market rates — verify with Glassdoor, Levels.fyi, or similar for current data</p></div>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('salaryResult',null)">Clear</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        ${[['Floor',result.floor,'#6b7280'],['Target',result.target,'#16a34a'],['Ceiling',result.ceiling,'#2563eb']].map(([l,v,c])=>`
        <div style="text-align:center;background:#f9fafb;border-radius:10px;padding:14px;border:2px solid ${c}20">
          <div style="font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${l}</div>
          <div style="font-size:20px;font-weight:800;color:${c}">${esc(v||'N/A')}</div>
        </div>`).join('')}
      </div>

      <div style="font-size:14px;color:#374151;line-height:1.7;margin-bottom:16px">${esc(result.marketContext||'')}</div>

      ${result.veteranPremiums?`
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">🎖 Your Veteran Leverage Points</div>
        <div style="font-size:13px;color:#1e3a8a;white-space:pre-line">${esc(result.veteranPremiums)}</div>
      </div>`:''}

      ${result.negotiationScript?`
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">💬 What to Say When They Ask</div>
        <div style="font-size:13px;color:#166534;white-space:pre-line;font-style:italic">${esc(result.negotiationScript)}</div>
      </div>`:''}

      ${result.totalComp?`
      <div style="background:#faf5ff;border:1px solid #ddd6fe;border-radius:8px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#6d28d9;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">📦 Total Compensation to Negotiate</div>
        <div style="font-size:13px;color:#6d28d9;white-space:pre-line">${esc(result.totalComp)}</div>
      </div>`:''}

      ${result.redFlags?`
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px">
        <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">⚠️ Watch Out For</div>
        <div style="font-size:13px;color:#92400e;white-space:pre-line">${esc(result.redFlags)}</div>
      </div>`:''}
    </div>`:''}`;
}

async function generateSalaryIntel() {
    const selJob = state.ui.salaryJob;
  const manualRole = document.getElementById('sal-role')?.value?.trim()||'';
  const location = document.getElementById('sal-location')?.value?.trim()||'';
  const companyType = document.getElementById('sal-company-type')?.value||'';
  const current = document.getElementById('sal-current')?.value?.trim()||'';
  const worry = document.getElementById('sal-worry')?.value?.trim()||'';
  toggleUI('salaryRole', manualRole); toggleUI('salaryLocation', location); toggleUI('salaryCurrent', current); toggleUI('salaryWorry', worry); toggleUI('salaryCompanyType', companyType);
  const job = selJob ? state.jobs.find(j=>j.id===selJob) : null;
  const roleDescription = job ? `${job.title} at ${job.company} (${job.location||location||'location unknown'})` : manualRole;
  if (!roleDescription) { showToast('Select a job or enter a role', false); return; }
  setState({ ui:{...state.ui, salaryBusy:true, salaryError:'', salaryResult:null} });
  const p = state.profile;
  try {
    const raw = await callClaude(
      `You are a compensation expert and career coach who specializes in helping military veterans negotiate their first or next civilian salary. You understand the defense contracting market, GS pay scales, defense-tech startup comp structures, and how to translate military experience into salary leverage. You give direct, specific advice — not platitudes.`,
      `Provide salary intelligence and negotiation coaching for this veteran.

ROLE: ${roleDescription}
COMPANY TYPE: ${companyType}
MARKET: ${location||'Not specified'}
VETERAN: ${p.branch} | ${p.rank} | ${p.yearsOfService} years | Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
CURRENT/RECENT COMP: ${current||'Not provided'}
NEGOTIATION CONCERN: ${worry||'None specified'}
SKILLS: ${[...(p.technicalSkills||[]),(p.softSkills||[])].slice(0,8).join(', ')||'N/A'}

Return ONLY this JSON (no markdown):
{
  "floor": "Minimum acceptable — e.g. $95,000",
  "target": "What to ask for — e.g. $125,000",
  "ceiling": "Stretch number for strong negotiators — e.g. $145,000",
  "marketContext": "2-3 sentences explaining why these numbers are right for this role/market/company type. Be specific about what drives comp in this sector.",
  "veteranPremiums": "Bullet list of the veteran's specific leverage points — clearance value in dollar terms if applicable, leadership experience premium, any in-demand skills. Be specific with numbers where possible.",
  "negotiationScript": "Word-for-word script for when they ask 'What are your salary expectations?' — confident, specific, leaves room to negotiate. 3-4 sentences.",
  "totalComp": "Beyond base: what else to negotiate — signing bonus, equity/RSUs if startup, annual bonus target, clearance maintenance pay, remote flexibility, PTO, professional development budget. List as bullets.",
  "redFlags": "2-3 specific things to watch out for in this type of offer — common lowball tactics, benefits traps, title inflation, etc."
}`, 'salary');
    let result;
    try { result = extractJSON(raw); } catch(e) { throw new Error('Could not parse salary data. Try again.'); }
    setState({ ui:{...state.ui, salaryBusy:false, salaryResult:result} });
    showToast('✓ Salary intelligence ready!');
  } catch(err) {
    setState({ ui:{...state.ui, salaryBusy:false, salaryError:err.message} });
  }
}

