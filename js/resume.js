// ── Resume Builder ────────────────────────────────────────────────────
function renderResume() {
  const jobs = state.jobs;
  const selJob = state.ui.resumeJob || '';
  const fmt = state.ui.resumeFmt || 'ats';
  const mode = state.ui.resumeMode || 'targeted'; // 'targeted' or 'generic'
  const job = jobs.find(j=>j.id===selJob);
  const busy = state.ui.resumeBusy || false;
  const status = state.ui.resumeStatus || '';
  const result = state.ui.resumeResult || null;
  const error = state.ui.resumeError || '';

  const jobOptions = jobs.map(j=>`<option value="${j.id}" ${selJob===j.id?'selected':''}>${esc(j.title)} — ${esc(j.company)}</option>`).join('');

  const canGenTargeted = !busy && !!selJob;
  const canGenGeneric  = !busy && !!!!state.profile?.fullName;

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">Resume Builder</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">AI-powered resume writing — Claude reads your actual experience and writes a real resume</p>
    

    <!-- Mode selector tabs -->
    <div style="display:flex;gap:0;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1.5px solid #e5e7eb;width:fit-content">
      <button onclick="toggleUI('resumeMode','targeted')" style="padding:10px 22px;border:none;cursor:pointer;font-size:14px;font-weight:600;background:${mode==='targeted'?'#2563eb':'white'};color:${mode==='targeted'?'white':'#6b7280'};transition:all 0.15s">🎯 Tailored to a Job</button>
      <button onclick="toggleUI('resumeMode','generic')" style="padding:10px 22px;border:none;cursor:pointer;font-size:14px;font-weight:600;background:${mode==='generic'?'#2563eb':'white'};color:${mode==='generic'?'white':'#6b7280'};transition:all 0.15s;border-left:1.5px solid #e5e7eb">📋 General Resume</button>
    </div>

    <div class="card">
      <h2>${mode==='targeted'?'Configure & Generate Tailored Resume':'Generate General-Purpose Resume'}</h2>

      ${mode==='targeted'?`
      <p style="font-size:13px;color:#6b7280;margin:-8px 0 16px">Select a job from your tracker — Claude will tailor your resume and cover letter specifically for it.</p>
      <div class="grid2">
        <div class="field"><label class="field-label">Target Job</label>
          <select id="resume-job" onchange="toggleUI('resumeJob',this.value)"><option value="">Select a job...</option>${jobOptions}</select></div>
        <div class="field"><label class="field-label">Resume Format</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${[{id:'ats',l:'ATS-Friendly',d:'Passes screening bots'},{id:'visual',l:'Professional',d:'Polished for humans'}].map(f=>`
              <div onclick="toggleUI('resumeFmt','${f.id}')" style="padding:10px;border:2px solid ${fmt===f.id?'#2563eb':'#e5e7eb'};background:${fmt===f.id?'#eff6ff':'white'};border-radius:8px;cursor:pointer">
                <div style="font-weight:600;font-size:13px">${f.l}</div>
                <div style="font-size:11px;color:#6b7280">${f.d}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
      ${job?`<div style="background:#f9fafb;border-radius:8px;padding:10px;font-size:13px;margin-bottom:14px"><strong>${esc(job.title)}</strong> at <span style="color:#2563eb">${esc(job.company)}</span>${job.location?' — '+esc(job.location):''}${job.salaryRange?` <span style="color:#16a34a;font-weight:600">· ${esc(job.salaryRange)}</span>`:''}</div>`:''}
      <div class="field" style="margin-bottom:16px">
        <label class="field-label">Optional: Special instructions for this resume</label>
        <textarea id="resume-instructions" rows="3" placeholder="e.g., Consolidate all active duty into one section called 'Military Experience'&#10;Emphasize leadership over technical skills&#10;Keep it to one page&#10;Lead with my security clearance" style="font-size:13px" onchange="toggleUI('resumeInstructions',this.value)">${esc(state.ui.resumeInstructions||'')}</textarea>
        <div style="font-size:11px;color:#9ca3af;margin-top:3px">Tell Claude how you want this specific resume structured or weighted — it will follow your lead.</div>
      </div>
      <button class="btn btn-primary" onclick="generateResume()" ${canGenTargeted?'':'disabled'} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Building...':'🚀 Generate Resume & Cover Letter'}
      </button>
      ${!state.jobs.length&&!busy?`<p style="font-size:13px;color:#f59e0b;margin-top:10px">💡 No jobs in your tracker yet — <button onclick="setState({view:'jobs'})" style="background:none;border:none;color:#2563eb;cursor:pointer;font-size:13px;font-weight:600;padding:0">add one</button>, or use the General Resume tab instead.</p>`:''}
      `:`
      <p style="font-size:13px;color:#6b7280;margin:-8px 0 16px">Generates a strong all-purpose resume you can hand out at career fairs, networking events, or any job posting. Also creates a short professional bio you can use on LinkedIn or email.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:13px;color:#1e40af;margin-bottom:16px">
        💡 This resume highlights your strongest experience across all industries. Use it when you don't have a specific job posting yet.
      </div>
      <div class="grid2" style="margin-bottom:14px">
        <div class="field"><label class="field-label">Resume Format</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${[{id:'ats',l:'ATS-Friendly',d:'Passes screening bots'},{id:'visual',l:'Professional',d:'Polished for humans'}].map(f=>`
              <div onclick="toggleUI('resumeFmt','${f.id}')" style="padding:10px;border:2px solid ${fmt===f.id?'#2563eb':'#e5e7eb'};background:${fmt===f.id?'#eff6ff':'white'};border-radius:8px;cursor:pointer">
                <div style="font-weight:600;font-size:13px">${f.l}</div>
                <div style="font-size:11px;color:#6b7280">${f.d}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="field"><label class="field-label">Optional: Any specific focus areas?</label>
          <input id="generic-focus" placeholder="e.g., leadership roles, project management, defense sector..." value="${esc(state.ui.genericFocus||'')}">
          <div style="font-size:11px;color:#9ca3af;margin-top:4px">Leave blank for a broad general resume</div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="generateGenericResume()" ${canGenGeneric?'':'disabled'} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Building...':'📋 Generate General Resume & Bio'}
      </button>
      ${!state.profile?.fullName&&!busy?`<p style="font-size:13px;color:#f59e0b;margin-top:10px">⚠️ Complete your profile first — <button onclick="setState({view:'profile'})" style="background:none;border:none;color:#2563eb;cursor:pointer;font-size:13px;font-weight:600;padding:0">go to Profile</button>.</p>`:''}
      `}

      ${busy?`<div style="background:#eff6ff;border-radius:8px;padding:12px;margin-top:12px;display:flex;align-items:center;gap:10px"><div class="spinner"></div><div><div style="font-weight:600;color:#1e40af;font-size:14px">${status}</div><div style="font-size:12px;color:#3b82f6;margin-top:2px">Takes 20–40 seconds — Claude is reading your experience</div></div></div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>
    ${result?renderResumeResult(result,fmt):''}`;
}

function renderResumeResult(result, fmt) {
  const sc = result.ats?.score;
  const scoreGrad = sc>=85?'linear-gradient(135deg,#22c55e,#16a34a)':sc>=70?'linear-gradient(135deg,#3b82f6,#2563eb)':sc>=55?'linear-gradient(135deg,#f59e0b,#d97706)':'linear-gradient(135deg,#ef4444,#dc2626)';
  const scoreBg = sc>=85?'#f0fdf4':sc>=70?'#eff6ff':sc>=55?'#fffbeb':'#fef2f2';
  const scoreBorder = sc>=85?'#86efac':sc>=70?'#bfdbfe':sc>=55?'#fde68a':'#fecaca';
  const scoreLabel = sc>=85?'Strong Match — Apply with confidence':sc>=70?'Good Match — Address gaps in cover letter':sc>=55?'Moderate Fit — Emphasize transferable skills':'Stretch Role — Lead with cover letter';
  const isGeneric = result.isGeneric || false;

  return `
    ${!isGeneric && result.ats ? `
    <!-- Overall Score -->
    <div class="card" style="background:${scoreBg};border:2px solid ${scoreBorder}">
      <h2 style="margin-bottom:12px">🎯 Resume Fit Analysis</h2>
      <div style="display:flex;gap:20px;align-items:center;margin-bottom:16px">
        <div class="score-circle" style="background:${scoreGrad};flex-shrink:0">
          <span style="font-size:28px;font-weight:800">${sc}</span>
          <span style="font-size:11px;opacity:0.9">Grade: ${result.ats.grade}</span>
        </div>
        <div>
          <div style="font-weight:700;font-size:17px;margin-bottom:4px">${scoreLabel}</div>
          <div style="font-size:14px;color:#4b5563;line-height:1.5">${esc(result.ats.summary||'')}</div>
          ${result.ats.clearance_value ? `<div style="margin-top:8px;background:#ede9fe;border:1px solid #c4b5fd;border-radius:6px;padding:6px 10px;font-size:12px;color:#6d28d9;font-weight:600">🔐 ${esc(result.ats.clearance_value)}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Transferable Skills — the key veteran section -->
    ${(result.ats.transferable_strengths||[]).length ? `
    <div class="card" style="border-left:4px solid #2563eb">
      <h2 style="margin-bottom:4px">🪖 → 💼 Your Military Experience Translates</h2>
      <p style="font-size:13px;color:#6b7280;margin:0 0 12px">Here's how your military background maps to what this employer needs — even if the words look different on paper.</p>
      ${(result.ats.transferable_strengths||[]).map(s=>`
        <div style="display:flex;gap:10px;align-items:start;padding:10px;background:#eff6ff;border-radius:8px;margin-bottom:8px">
          <span style="font-size:18px;flex-shrink:0">✓</span>
          <span style="font-size:14px;color:#1e3a8a;line-height:1.5">${esc(s)}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Coaching tip -->
    ${result.ats.coaching_tip ? `
    <div class="card" style="background:#fffbeb;border:1px solid #fde68a">
      <h2 style="margin-bottom:6px">💡 Top Coaching Tip</h2>
      <p style="font-size:14px;color:#92400e;margin:0;line-height:1.6">${esc(result.ats.coaching_tip)}</p>
    </div>` : ''}

    <!-- Strengths & Gaps -->
    <div class="card">
      <h2 style="margin-bottom:12px">📋 Detailed Breakdown</h2>
      <div class="grid2">
        <div>
          ${(result.ats.strengths||[]).length?`
          <div style="font-size:12px;font-weight:700;color:#16a34a;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">✅ Resume Strengths</div>
          ${(result.ats.strengths||[]).map(s=>`<div style="font-size:13px;color:#166534;padding:6px 8px;background:#f0fdf4;border-radius:6px;margin-bottom:6px">• ${esc(s)}</div>`).join('')}`:''}
        </div>
        <div>
          ${(result.ats.gaps||[]).length?`
          <div style="font-size:12px;font-weight:700;color:#d97706;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">⚠️ Areas to Strengthen</div>
          ${(result.ats.gaps||[]).map(g=>`<div style="font-size:13px;color:#92400e;padding:6px 8px;background:#fffbeb;border-radius:6px;margin-bottom:6px">• ${esc(g)}</div>`).join('')}`:''}
        </div>
      </div>
      ${(result.ats.keywords_missing||[]).length?`
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f3f4f6">
        <div style="font-size:12px;font-weight:700;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">🔑 Keywords to Add (ATS Screening)</div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px">Consider weaving these into your resume naturally — these terms help get past automated screening.</div>
        <div>${(result.ats.keywords_missing||[]).map(k=>`<span class="tag tag-orange">${esc(k)}</span>`).join('')}</div>
      </div>`:''}
    </div>` : ''}

    <!-- Resume output -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <h2 style="margin:0">📄 ${isGeneric?'General Resume':'Resume'} — ${fmt==='ats'?'ATS-Friendly':'Professional'} Format</h2>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="copyResumeToClipboard()">📋 Copy Text</button>
          <button class="btn btn-secondary btn-sm" onclick="exportResumeToWord()">📝 Export Word</button>
          <button class="btn btn-primary btn-sm" onclick="printResume()">🖨 Print / Save PDF</button>
        </div>
      </div>
      <p style="font-size:12px;color:#6b7280;margin:0 0 12px">Print / Save PDF → in print dialog choose <strong>Save as PDF</strong> · Or copy text to paste into Word/Google Docs for formatting</p>
      <div class="resume-preview" id="resume-text-output" style="font-family:${fmt==='ats'?'Arial':'Georgia'},serif">${esc(result.resume)}</div>
    </div>

    ${result.bio ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">🙋 Professional Bio</h2>
          <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Use on LinkedIn "About" section, email intros, or anywhere you need a quick summary.</p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="copyBioToClipboard()">📋 Copy for LinkedIn</button>
          <button class="btn btn-primary btn-sm" onclick="downloadBio()">⬇ Download .txt</button>
        </div>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 12px;font-size:12px;color:#1e40af;margin-bottom:10px">
        💡 <strong>LinkedIn tip:</strong> Paste this into your LinkedIn "About" section. Then add 3-5 bullet points below it listing your key skills and clearance level.
      </div>
      <div class="resume-preview" id="bio-text">${esc(result.bio)}</div>
    </div>` : ''}

    ${result.coverLetter ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 style="margin:0">✉️ Cover Letter</h2>
        <button class="btn btn-primary btn-sm" onclick="downloadCover()">⬇ Download .txt</button>
      </div>
      <div class="resume-preview" id="cover-text">${esc(result.coverLetter)}</div>
    </div>` : ''}`;
}

async function generateResume() {
  const selJob = state.ui.resumeJob;
  if (!selJob) { alert('Select a job first'); return; }
  if (!state.profile?.fullName) { alert('Complete your profile first (add your name in Profile)'); return; }
    const job = state.jobs.find(j=>j.id===selJob);

  // Capture latest instructions value from textarea before generating
  const instrEl = document.getElementById('resume-instructions');
  if (instrEl) toggleUI('resumeInstructions', instrEl.value);

  const setStatus = (s) => setState({ ui:{...state.ui, resumeBusy:true, resumeStatus:s, resumeError:'', resumeResult:null} });

  const context = buildResumeContext(job);

  try {
    setStatus('✍️ Writing tailored resume...');
    // Snapshot any unsaved profile fields from the DOM before generating
    const p = { ...state.profile };
    ['fullName','email','phone','location','linkedin'].forEach(f => {
      const el = document.getElementById('p-'+f); if(el && el.value) p[f] = el.value;
    });

    const contactBlock = [
      p.fullName || '[Name]',
      [p.phone, p.email].filter(Boolean).join(' | '),
      p.linkedin ? p.linkedin.replace(/^https?:\/\//,'') : '',
      p.location || ''
    ].filter(Boolean).join('\n');

    const userInstructions = state.ui.resumeInstructions?.trim() || '';

    // Pre-compute awards flag from user instructions
    const wantNoAwards = /no.*(award|medal|decoration|recognition)/i.test(userInstructions || '');

    const resumeSystemPrompt = `You are an expert military-to-civilian resume translator. A civilian hiring manager reads this resume — they have zero military context. Your job is translating every military title, unit, and term into the corporate equivalent a Fortune 500 recruiter would immediately recognize. Secondary job: keep it to 2 pages.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #1 — RANK-TO-TITLE MAPPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use the ROLE the person held (not just their rank) to determine the civilian title.
Always consider what level of organization they led and what their function was.

COMMAND ROLES (the person ran the organization):
  Flight/Company Commander     → Program Manager
  Squadron/Battalion Commander → Division Manager
  Group/Brigade Commander      → COO
  Deputy Group/Brigade Cmdr    → VP (Vice President)
  Wing/Division Commander      → CEO
  Above Wing                   → President / Senior Executive

DEPUTY / SECOND-IN-COMMAND ROLES:
  Director of Operations (DO) at Squadron/Battalion level → Deputy Division Manager
  Executive Officer (XO) at Squadron/Battalion level      → Chief of Staff
  Executive Officer (XO) at Group/Brigade level           → Senior Operations Manager

STAFF / FUNCTIONAL ROLES (translate by function):
  Chief of Stan/Eval              → Senior Quality Assurance Manager
  Operations Officer (Navy)       → Senior Operations Manager
  Chief Enlisted Manager / Command Chief → Senior Operations Manager & Administrator
  Flight Commander                → Program Manager
  Intelligence Officer (S2/J2)   → Intelligence Director / Senior Intelligence Analyst
  Logistics Officer (S4/J4)      → Director of Logistics / Supply Chain Manager
  Personnel Officer (S1/J1)      → HR Director
  Plans Officer / Planner        → Strategic Planning Manager
  Communications Officer (S6/J6) → IT Director / Technology Manager
  Finance Officer (S8/J8)        → CFO / Finance Director
  Surgeon / Medical Officer       → Medical Director
  JAG Officer                    → General Counsel
  PAO / Public Affairs Officer   → Communications Director / PR Manager

INSTRUCTOR / ADVISOR ROLES:
  Weapons Instructor              → Senior Tactics Instructor & Advisor
  Instructor Pilot / IP           → Senior Flight Instructor
  Technical Advisor               → Senior Technical Advisor / Subject Matter Expert

CELL / SHOP / BRANCH CHIEFS (translate the function, drop the military label):
  "Chief, [Any] Plans Cell"       → "Director, [Function] Planning"
  "Chief, Current Operations"     → "Director of Operations"
  "Chief, [Any] Division"         → "Division Director"
  "NCOIC / OIC of [shop]"         → "Manager, [function]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #2 — UNIT SIZE = ORG SIZE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When writing bullets about scope, translate organizational scale this way:

  Flight / Company (~20-100 people)       = Team
  Squadron / Battalion (~200-600 people)  = Division
  Group / Brigade (~1,000-4,000 people)   = Vertical (business vertical)
  Wing / Division (~5,000-15,000 people)  = Company
  Corps / MAJCOM and above                = Enterprise / Corporation

EXAMPLES:
  "Led a flight of 24 personnel"          → "Led a team of 24 professionals"
  "Commanded a 450-person squadron"       → "Directed a 450-person division"
  "Led operations across the group"       → "Led operations across the business vertical"
  "Wing-level policy"                     → "Company-wide policy"
  "MAJCOM-level program"                  → "Enterprise-wide program"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #3 — ORGANIZATION NAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Strip ALL unit numbers. Keep branch + functional description only.

"479th Operations Support Squadron, U.S. Air Force" → "U.S. Air Force"
"613th Air Operations Center (Pacific Air Forces)"  → "Air Operations Center, U.S. Air Force (Pacific)"
"453rd Electronic Warfare Squadron, U.S. Air Force" → "U.S. Air Force"
"2nd Bomb Wing (Air Force Global Strike Command)"   → "Air Force Global Strike Command"
"11th Bomb Squadron, U.S. Air Force"                → "U.S. Air Force"
"1st Special Forces Group, U.S. Army"               → "U.S. Army Special Forces"
"3rd Infantry Division"                             → "U.S. Army"
"Joint Base [Name]"                                 → use just City, State

Rule: Civilians care about BRANCH and FUNCTION. Never show unit numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #4 — BULLET POINT LANGUAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every military term in a bullet must be translated. Exact before/after examples:

BEFORE: "Managed 17,000+ training events achieving 99% effectiveness for seven major commands"
AFTER:  "Led enterprise-scale training programs for 7 commands, achieving 99% completion rate across 17,000+ annual sessions"

BEFORE: "Graduated 330 students annually meeting national training objectives"
AFTER:  "Certified 330 professionals annually against national performance standards"

BEFORE: "Directed 365 air tasking orders supporting 20,000+ international missions"
AFTER:  "Directed daily operational planning cycles supporting 20,000+ international missions at 100% on-time rate"

BEFORE: "Coordinated 18 combined international joint fire strikes"
AFTER:  "Coordinated 18 multinational operations with allied partner nations"

BEFORE: "Built inaugural electronic warfare training plan transitioning 80 personnel to operational roles"
AFTER:  "Built organization's first formal training program, qualifying 80 personnel for operational assignments"

BEFORE: "Coordinated 1,700 combat sorties across four operating areas totaling 43,000+ missions annually"
AFTER:  "Coordinated 1,700+ flight operations across 4 theaters supporting 43,000+ annual missions"

BEFORE: "Graduated 150 combat crews at 98% on-time rate through consolidation training"
AFTER:  "Certified 150 flight crews at 98% on-time rate through a consolidated training program"

BEFORE: "Built $900,000 classified mission planning network reducing monthly workload by 200 person-hours"
AFTER:  "Designed and deployed $900K classified planning system, cutting monthly workload by 200 hours"

KEY JARGON → CIVILIAN DICTIONARY (translate every occurrence):
- "sorties"                  → "missions" or "flight operations"
- "air tasking order / ATO"  → "operational planning cycle" or "mission directive"
- "joint fires"              → "coordinated joint operations" or "multinational strike operations"
- "combat crews"             → "flight crews" or "operational crews"
- "graduated [N] students"   → "certified [N] professionals"
- "training events"          → "training programs" or "training sessions"
- "major commands / MAJCOM"  → "major commands" or "enterprise commands"
- "ISR"                      → "intelligence, surveillance & reconnaissance"
- "OPORD / CONOP / TASKORD"  → "operational plan" or "mission directive"
- "FOB / AOR / FARP"         → omit or use "operational theater"
- "OIC / NCOIC"              → "program director" or "department manager"
- "NCO / SNCO / E-7 through E-9" → "senior manager" or "team lead"
- "Task Force"               → "cross-functional team"
- "expeditionary"            → "deployed" or "forward-deployed"
- "G/J/N/A-staff"            → describe the function (logistics, ops, intel)
- "COCOM / CENTCOM / PACAF"  → spell out, or "combatant command"
- "PCS / TDY"                → omit or "relocation" / "temporary assignment"
- "MOS / AFSC / NEC / DMOS"  → "specialty" or omit
- "clearance / TS/SCI"       → keep as-is (valued in civilian market)
- "AOC / Air Operations Center" → keep as-is (defense industry knows it)
- "C2 / command and control" → keep "C2" as acronym (recognized in defense/tech)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #5 — SUMMARY & COMPETENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: Lead with the civilian VALUE PROPOSITION, not rank or branch.
BEFORE: "Retired Lieutenant Colonel with 21 years leading large-scale operations..."
AFTER:  "Operations and business development leader with 20+ years driving results at the intersection of technology, strategy, and execution..."
— Mention rank/branch only in sentence 2, as credibility context, not the opener.

Competencies: Use business language. No military program names.
BEFORE: "Command-and-control systems, Air Operations Centers management, Joint operational planning"
AFTER:  "C2 & Operations Management, Strategic Planning & Execution, Cross-Functional Team Leadership"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TWO-PAGE RULES (absolute)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Max 20 bullets total. Count them.
- Max 15 words per bullet.
- Summary: 2-3 sentences.
- Core Competencies: one comma-separated line.
- ${wantNoAwards ? 'NO awards section — user requested.' : 'Awards: names only, one line.'}
- Combine or omit roles pre-2010.
- Return ONLY the resume. No preamble or commentary.

USER INSTRUCTIONS (follow exactly): ${userInstructions || 'None'}

FINAL CHECK: Every bullet has a strong opening verb and one metric. Zero unexplained military acronyms.`;

    const resumeUserPrompt = `Write a tailored 2-page resume for this veteran.

${context}

START with this contact block verbatim:
${contactBlock}

SECTIONS:
=== PROFESSIONAL SUMMARY ===
2 sentences only.

=== CORE COMPETENCIES ===
Single comma-separated line.

=== PROFESSIONAL EXPERIENCE ===
Per role: **Title** | Org | Location | Years
Then max 3 bullets, each under 12 words with one metric.

${wantNoAwards ? '' : '=== AWARDS & RECOGNITION ===\nMedal names only, one line.\n\n'}=== EDUCATION ===
=== CERTIFICATIONS ===

FINAL CHECK: Count your bullets. If more than 20, delete the weakest ones until you have 20 or fewer.`;

    const resume = await callClaude(resumeSystemPrompt, resumeUserPrompt);

    // Post-generation trim: if resume has > 25 bullets, ask Claude to trim it
    const bulletCount = (resume.match(/^[•\-·]/gm) || []).length;
    let finalResume = resume;
    if (bulletCount > 25) {
      setStatus('✂️ Trimming to 2 pages...');
      finalResume = await callClaude(
        'You are a resume editor. Your only job is to trim this resume to fit on 2 pages. Keep the same === section structure and contact block. Cut bullets ruthlessly — 3 per role max, 15 words per bullet max. Do NOT add anything. Return ONLY the trimmed resume, no commentary.',
        `Trim this resume to 2 pages (max 22 bullets total). Remove older roles if needed. Keep most recent 10 years. Return ONLY the resume:\n\n${resume}`
      );
    }
    const resumeToUse = finalResume;

    setStatus('✉️ Writing cover letter...');
    const coverLetter = await callClaude(
      `You are a career coach who writes cover letters that actually get read. You write them the way a confident, accomplished person would write them — specific, direct, and human. You avoid every cliché in the book.

COVER LETTER RULES:
- Open with something specific and compelling — NOT "I am writing to express my interest in..."
- Never use: "I am passionate about", "I believe I would be a great fit", "Please find attached", "Thank you for your consideration", "I look forward to hearing from you"
- Mention 2-3 real accomplishments with actual numbers
- Connect military experience to business outcomes the company cares about
- Sound like a real person wrote this at 9pm after doing research on the company — not like a template
- Close with confidence, not desperation
- Under 380 words. Plain text paragraphs only.`,
      `Write a tailored cover letter for this veteran.\n\n${context}\n\nWrite 3-4 paragraphs. Paragraph 1: Strong opening hook — lead with your biggest relevant strength, not with "I am applying for...". Paragraph 2-3: Two specific accomplishments with numbers that directly connect to what this company needs. Final paragraph: Direct, confident close — why this role, what you bring, what happens next.`
    );

    setStatus('🔍 Analyzing fit & transferable skills...');
    const atsRaw = await callClaude(
      `You are a senior hiring manager and veteran career specialist who deeply understands military-to-civilian transitions. You evaluate resumes with full awareness that military experience translates powerfully to civilian roles — even when the exact civilian keywords aren't present.

CRITICAL SCORING PHILOSOPHY:
- Score based on DEMONSTRATED CAPABILITY, not keyword matching alone
- A veteran who "led logistics for 200 personnel across 3 FOBs" has supply chain and operations management experience — score it accordingly
- A veteran who "managed $4M equipment accountability program" has budget management and asset tracking experience
- Military leadership roles (platoon sergeant, XO, OIC) translate directly to team management, project leadership, operations roles
- Intelligence analysts have data analysis, reporting, and pattern recognition skills
- Combat arms veterans have crisis management, decision-making under pressure, team leadership
- Security clearances are a SIGNIFICANT positive differentiator — always call this out
- Do NOT penalize for lack of corporate buzzwords if the underlying competency is clearly demonstrated
- NEVER score a veteran below 55 purely because of keyword gaps — focus on transferable capability`,

      `You are evaluating a MILITARY VETERAN's resume for a civilian job. Score generously for transferable skills, not just keyword matches.

RESUME:
${resume}

TARGET JOB: ${job.title} at ${job.company}
Job Notes/Requirements: ${job.notes || 'Not provided'}

VETERAN BACKGROUND:
Branch: ${state.profile.branch||'N/A'} | Rank: ${state.profile.rank||'N/A'} | Years: ${state.profile.yearsOfService||'N/A'}
Clearance: ${state.profile.clearance||'None'} (${state.profile.clearanceStatus||'N/A'})

SCORING INSTRUCTIONS:
1. Identify what the job REALLY needs (core competencies behind the job title)
2. Map military experience to those core competencies — look for equivalence, not exact matches
3. Score 0-100 where:
   - 85-100: Strong match, military background directly applicable
   - 70-84: Good match, most core competencies covered via transferable experience
   - 55-69: Moderate match, solid foundation but some real gaps to address
   - 40-54: Stretch role, significant gaps but worth attempting with strong cover letter
   - Below 40: Poor fit, fundamental requirements not met

Return ONLY this JSON (no markdown, no extra text):
{
  "score": <0-100>,
  "grade": "A/B/C/D/F",
  "summary": "One plain-English sentence on overall fit",
  "transferable_strengths": ["3-5 specific military-to-civilian translations — e.g., 'Combat logistics experience directly maps to supply chain management'"],
  "strengths": ["3-4 resume strengths as written"],
  "gaps": ["2-4 genuine gaps or areas to strengthen — be specific and actionable, not just 'lacks X keyword'"],
  "keywords_missing": ["5-8 keywords from the job posting not in the resume that would help ATS screening"],
  "keywords_found": ["5-8 important keywords present"],
  "clearance_value": "Brief note on clearance value for this role, or empty string if not applicable",
  "coaching_tip": "One specific, actionable tip to improve this application"
}`
    );

    let ats = { score:75, grade:'B', summary:'Good transferable match.', transferable_strengths:[], strengths:[], gaps:[], keywords_missing:[], keywords_found:[], clearance_value:'', coaching_tip:'' };
    try { ats = JSON.parse(atsRaw.replace(/```json|```/g,'').trim()); } catch(e) {}

    setState({ ui:{...state.ui, resumeBusy:false, resumeStatus:'', resumeResult:{resume:resumeToUse,coverLetter,ats}} });
  } catch(err) {
    setState({ ui:{...state.ui, resumeBusy:false, resumeStatus:'', resumeError:'Error: '+err.message+'.'} });
  }
}

async function generateGenericResume() {
  if (!state.profile?.fullName) { alert('Complete your profile first (at least your name and branch)'); return; }
  
  const focus = document.getElementById('generic-focus')?.value?.trim() || '';
  toggleUI('genericFocus', focus);

  const setStatus = (s) => setState({ ui:{...state.ui, resumeBusy:true, resumeStatus:s, resumeError:'', resumeResult:null} });

  const p = state.profile;
  const exp = [...state.assignments.map(a => {
    let t = `MILITARY: ${a.dutyTitle}${a.rank?' ('+a.rank+')':''} | ${a.unit||''} | ${a.base||''} | ${a.startDate||'?'}-${a.endDate||'Present'}\nAccomplishments:\n${a.accomplishments||'None'}`;
    if ((a.roles||[]).length>0) { t += '\nAdditional roles: ' + a.roles.map(r=>`${r.title}${r.rank?' ('+r.rank+')':''}${r.accomplishments?': '+r.accomplishments.slice(0,100):''}`).join(' | '); }
    return t;
  }), ...state.civilianJobs.map(j=>`CIVILIAN: ${j.title} at ${j.company} | ${j.startDate||'?'}-${j.endDate||'Present'}\nAccomplishments:\n${j.accomplishments||'None'}`)].join('\n---\n');
  const awards = state.awards.map(a=>`${a.name}${a.civilianTranslation?' — '+a.civilianTranslation:''}`).join('\n');

  const context = `VETERAN PROFILE:
Name: ${p.fullName} | Phone: ${p.phone||'N/A'} | Email: ${p.email||'N/A'} | LinkedIn: ${p.linkedin||'N/A'} | Location: ${p.location||'N/A'}
Branch: ${p.branch} | Rank: ${p.rank} | Years of Service: ${p.yearsOfService}
MOS/Rate: ${p.mosRate||'N/A'} | Security Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Work Preference: ${p.workPreference||'N/A'} | Willing to Relocate: ${p.willingToRelocate||'N/A'}
Technical Skills: ${(p.technicalSkills||[]).join(', ')||'None'}
Leadership/Soft Skills: ${(p.softSkills||[]).join(', ')||'None'}
Education: ${p.education||'N/A'}
Certifications: ${p.certifications||'N/A'}
Training & Methodologies: ${p.training||'N/A'}
Professional Summary: ${p.elevatorPitch||'Not written'}
Target Industries: ${(p.targetIndustries||[]).map(i=>typeof i==='object'?(i.subType?i.name+' ('+i.subType+')':i.name):i).join(', ')||'Not specified'}

EXPERIENCE:
${exp||'None'}

AWARDS & DECORATIONS:
${awards||'None'}

${focus?`FOCUS AREAS REQUESTED BY VETERAN: ${focus}`:'NO SPECIFIC FOCUS — write a broad, versatile general resume'}`;

  const systemPrompt = `You are a former military officer turned senior resume writer. You've written hundreds of resumes for veterans and you know exactly what makes hiring managers stop scrolling. Your resumes sound like a real person wrote them — not a bot, not a template, not an HR form.

FORBIDDEN WORDS AND PHRASES (never use any of these):
"results-driven" / "results-oriented" / "proven track record" / "dynamic" / "synergistic" / "leveraged" / "passionate about" / "detail-oriented" / "hard-working" / "go-getter" / "strategic thinker" / "thought leader" / "innovative" / "spearheaded" / "orchestrated" / "facilitated" / "championed" / "executed" (use "ran"/"delivered") / "stakeholders" (use "partners"/"decision-makers") / "deliverables" (use "results"/"outputs") / "utilize" (use "use") / "impactful" / "value-add" / "bandwidth" / "robust" / "scalable" / "mission-critical" / "best practices"

BULLET POINTS: Every one needs a number. Vary length and structure. Use at least 6 different opening verbs. Translate ALL military jargon.
PROFESSIONAL SUMMARY: First person. Start with accomplishment or context, not "I am a...". 2-3 sentences max.
CONTACT BLOCK: Copy verbatim — do not add, remove, or reformat anything.
OUTPUT: Resume content only — no preamble, no "Here is your resume:", no commentary.`;

  try {
    setStatus('✍️ Writing your general resume...');
    // Snapshot any unsaved profile fields from the DOM
    ['fullName','email','phone','location','linkedin'].forEach(f => {
      const el = document.getElementById('p-'+f); if(el && el.value) p[f] = el.value;
    });
    const contactBlock = [
      p.fullName || '[Name]',
      [p.phone, p.email].filter(Boolean).join(' | '),
      p.linkedin ? p.linkedin.replace(/^https?:\/\//,'') : '',
      p.location || ''
    ].filter(Boolean).join('\n');

    const resume = await callClaude(
      systemPrompt,
      `Write a strong, versatile general-purpose resume for this veteran. This resume should present them at their best without being targeted to a single job.

${context}

Use this EXACT contact block at the very top (copy it verbatim, do not change it):
${contactBlock}

SECTIONS (use === headers):
1. === PROFESSIONAL SUMMARY === (2 sentences MAX)
2. === CORE COMPETENCIES === (single comma-separated line, no bullets, 14-18 skills)
3. === PROFESSIONAL EXPERIENCE === (reverse chronological — most recent first)
4. === AWARDS & RECOGNITION === (medal/award names only, single line, no descriptions)
5. === EDUCATION ===
6. === CERTIFICATIONS ===

EXPERIENCE FORMAT — each role:
**Job Title** | Organization | Location | Start–End Year
• Bullet (max 15 words)
• Bullet (max 15 words)
• Bullet (max 15 words — 3 bullets max per role)

TWO-PAGE HARD LIMIT: You have room for 18–22 bullets total across ALL roles. Count them. Do not exceed this. Prioritize the last 10–12 years. Combine roles at the same organization. Omit any role before 2005 unless exceptional.`
    );

    setStatus('🙋 Writing your professional bio...');
    const bio = await callClaude(
      'You write crisp, confident professional bios for veterans transitioning to civilian careers. Bios should sound human, specific, and compelling — like a LinkedIn "About" section written by someone who knows their own value.',
      `Write a 3-paragraph professional bio for this veteran.

${context}

Paragraph 1 (3-4 sentences): Who they are, years of service, branch, and their career-defining achievement — be specific with numbers.
Paragraph 2 (3-4 sentences): The skills and experiences that make them uniquely valuable to civilian employers — translate military strengths into business impact.
Paragraph 3 (2-3 sentences): What they're looking for next and what they bring to the table — forward-looking and confident.

Rules:
- First person ("I" voice)
- No military jargon
- No clichés: "passionate about", "proven track record", "results-driven", "seeking to leverage"
- Sound like a real, confident human who knows their value
- Plain text paragraphs only`
    );

    setState({ ui:{...state.ui, resumeBusy:false, resumeStatus:'', resumeResult:{resume, bio, isGeneric:true}} });
  } catch(err) {
    setState({ ui:{...state.ui, resumeBusy:false, resumeStatus:'', resumeError:'Error: '+err.message+'.'} });
  }
}

function downloadBio() {
  const text = document.getElementById('bio-text')?.innerText || '';
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  a.download = `Professional_Bio_${(state.profile.fullName||'').replace(/\s+/g,'_')}.txt`;
  a.click();
}

function buildResumeContext(job) {
  const p = state.profile;

  // Cap text per role — prevents AI from writing a 5-page resume when given pages of raw input
  const cap = (t, max) => !t ? '' : t.length > max ? t.slice(0, max) + '...' : t;

  const assignmentText = state.assignments.map(a => {
    let text = `MILITARY: ${a.dutyTitle}${a.rank?' ('+a.rank+')':''} | ${a.unit||''} | ${a.startDate||'?'}-${a.endDate||'Present'}`;
    if (a.accomplishments) text += `\n${cap(a.accomplishments, 500)}`;
    if ((a.roles||[]).length > 0) {
      a.roles.slice(0,2).forEach(r => {
        text += `\n  Role: ${r.title}`;
        if (r.accomplishments) text += ` — ${cap(r.accomplishments, 150)}`;
      });
    }
    return text;
  }).join('\n---\n');

  const civText = state.civilianJobs.map(j =>
    `CIVILIAN: ${j.title} at ${j.company} | ${j.startDate||'?'}-${j.endDate||'Present'}\n${cap(j.accomplishments, 500)}`
  ).join('\n---\n');

  const awards = state.awards.map(a => a.name).join(', ');
  const docs = state.documents.map(d=>`[${d.type}] ${d.name}:\n${(d.content||'').slice(0,300)}`).join('\n---\n');

  return `VETERAN CONTACT INFO (copy exactly into resume header — do not omit or alter):
Full Name: ${p.fullName||'[Name not set — ask veteran to complete Profile]'}
Phone: ${p.phone||'[Phone not set]'}
Email: ${p.email||'[Email not set]'}
LinkedIn: ${p.linkedin||''}
City/State: ${p.location||'[Location not set]'}

VETERAN BACKGROUND:
Branch: ${p.branch||'N/A'} | Rank: ${p.rank||'N/A'} | Years of Service: ${p.yearsOfService||'N/A'}
MOS/Rate: ${p.mosRate||'N/A'} | Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Work Preference: ${p.workPreference||'N/A'} | Willing to Relocate: ${p.willingToRelocate||'N/A'}
Technical Skills: ${(p.technicalSkills||[]).join(', ')||'None'}
Leadership/Soft Skills: ${(p.softSkills||[]).join(', ')||'None'}
Education: ${p.education||'N/A'}
Certifications: ${p.certifications||'N/A'}
Training & Methodologies: ${p.training||'N/A'}
Professional Summary: ${p.elevatorPitch||'Not written'}
Target Industries: ${(p.targetIndustries||[]).map(i=>typeof i==='object'?(i.subType?i.name+' ('+i.subType+')':i.name):i).join(', ')||'Not specified'}

EXPERIENCE:
${assignmentText||'None'}
${civText?'\n---\n'+civText:''}

AWARDS:
${awards||'None'}

PERFORMANCE DOCUMENTS:
${docs||'None'}

TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location||'N/A'}
Salary: ${job.salaryRange||'N/A'}
Job Notes / Requirements: ${job.notes||'None'}`;
}

function copyResumeToClipboard() {
  const text = document.getElementById('resume-text-output')?.innerText || '';
  navigator.clipboard.writeText(text).then(() => showToast('✓ Resume copied! Paste into Word or Google Docs')).catch(()=>{
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✓ Resume copied!');
  });
}

function copyBioToClipboard() {
  const text = document.getElementById('bio-text')?.innerText || '';
  navigator.clipboard.writeText(text).then(() => showToast('✓ Bio copied — paste into LinkedIn "About" section!')).catch(()=>{
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✓ Bio copied!');
  });
}

function printResume() {
  const text = document.getElementById('resume-text-output')?.innerText || document.querySelector('.resume-preview')?.innerText || '';
  const fmt = state.ui.resumeFmt || 'ats';
  const name = state.profile.fullName || 'Resume';
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>${name} — Resume</title><style>
    @page { margin: 0.65in; }
    body { font-family:${fmt==='ats'?'Arial, Helvetica':'Georgia, serif'};font-size:10.5pt;color:#111;max-width:100%;line-height:1.55;margin:0 }
    pre { font-family:inherit;white-space:pre-wrap;font-size:10.5pt;margin:0 }
    @media print { body { margin:0 } }
  </style></head><body><pre>${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
  w.document.close();
  setTimeout(()=>{ w.focus(); w.print(); }, 500);
}

function downloadCover() {
  const text = document.getElementById('cover-text')?.innerText || '';
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  a.download = `Cover_Letter_${(state.profile.fullName||'').replace(/\s+/g,'_')}.txt`;
  a.click();
}

