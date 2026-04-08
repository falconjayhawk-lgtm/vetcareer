// ── airline-interview.js — Phase 4: Aviation Interview Prep ───────────
// Covers:
//   - CRM/Behavioral questions (TMAAT format, crew-focused)
//   - Technical knowledge by category (weather, FARs, systems, emergencies)
//   - Situational CRM scenarios (captain pressure, go/no-go decisions)
//   - Airline-specific red flags to avoid
// ──────────────────────────────────────────────────────────────────────

const AVIATION_TECH_CATEGORIES = [
  { id: 'weather',    label: 'Weather',          icon: '⛈️',  desc: 'Thunderstorms, icing, wind shear, fog, SIGMET' },
  { id: 'fars',       label: 'FARs & Regs',      icon: '📋',  desc: 'Part 121, rest rules, alternates, fuel minimums' },
  { id: 'aero',       label: 'Aerodynamics',     icon: '🔄',  desc: 'Stalls, V-speeds, performance, swept-wing effects' },
  { id: 'systems',    label: 'Aircraft Systems', icon: '⚙️',  desc: 'Hydraulics, electrical, pressurization, avionics' },
  { id: 'emergency',  label: 'Emergencies',      icon: '🚨',  desc: 'Engine failure, fire, depressurization, bird strike' },
  { id: 'airspace',   label: 'Airspace & ATC',   icon: '🗺️',  desc: 'Class B/C/D, MOA, TFR, ADIZ, lost comms' }
];

// ── Config UI ─────────────────────────────────────────────────────────

function renderAirlineInterviewMode() {
  const cfg      = state.ui.airlineIvConfig || {};
  const busy     = state.ui.airlineIvBusy   || false;
  const error    = state.ui.airlineIvError  || '';
  const result   = state.ui.airlineIvResult || null;
  const certs    = (typeof getPilotCerts === 'function') ? getPilotCerts() : (state.profile.pilotCerts || {});
  const fh       = (typeof getFlightHours === 'function') ? getFlightHours() : (state.flightHours || {});
  const combined = (typeof calcCombinedHours === 'function') ? calcCombinedHours() : {};

  const selCats = cfg.techCategories || [];
  const ivType  = cfg.ivType || 'behavioral';

  return `
    <div class="card">
      <h2>✈️ Airline Interview Configuration</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 16px">
        Airline interviews test CRM thinking, not just experience. Claude generates questions and coached answers using your actual flying background — then flags the red flags that wash pilots out.
      </p>

      <!-- Data pre-load status -->
      <div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:12px 14px;margin-bottom:16px;font-size:12px">
        <div style="font-weight:700;color:var(--green);margin-bottom:6px;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em">✓ FLYING BACKGROUND LOADED</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;color:var(--muted)">
          <span><strong style="color:var(--text)">Total:</strong> ${combined.total > 0 ? combined.total.toLocaleString() : (fh.military?.total || '?')} hrs</span>
          <span><strong style="color:var(--text)">PIC:</strong> ${combined.pic > 0 ? combined.pic.toLocaleString() : (fh.military?.pic || '?')} hrs</span>
          <span><strong style="color:var(--text)">Aircraft:</strong> ${(fh.military?.byAircraft||[]).map(a=>a.type).join(', ') || 'Not entered'}</span>
          <span><strong style="color:var(--text)">ATP:</strong> ${certs.atp ? '✓' : 'Not entered'}</span>
        </div>
        <div style="margin-top:6px;font-size:11px;color:var(--green)">Missing data? Update in <button onclick="setState({view:'profile'})" style="background:none;border:none;color:var(--accent);font-weight:700;cursor:pointer;padding:0;font-size:11px">Profile → Airline section</button></div>
      </div>

      <div class="grid2">
        <div class="field">
          <label class="field-label">Interview Type</label>
          <select id="aiv-type" onchange="setState({ui:{...state.ui, airlineIvConfig:{...(state.ui.airlineIvConfig||{}), ivType:this.value}}}, false)">
            <option value="behavioral"  ${ivType==='behavioral' ?'selected':''}>HR / Behavioral (CRM focus)</option>
            <option value="technical"   ${ivType==='technical'  ?'selected':''}>Technical Knowledge</option>
            <option value="situational" ${ivType==='situational'?'selected':''}>Situational / Go-No-Go</option>
            <option value="full"        ${ivType==='full'       ?'selected':''}>Full Pack (all types)</option>
          </select>
          <div style="font-size:11px;color:var(--dim);margin-top:3px">
            ${ivType==='behavioral'  ? 'TMAAT questions with CRM framing — what every airline HR panel asks' : ''}
            ${ivType==='technical'   ? 'Knowledge review by category — select categories below' : ''}
            ${ivType==='situational' ? 'Go/no-go decisions, captain conflict, ATC pressure scenarios' : ''}
            ${ivType==='full'        ? 'Complete prep: behavioral + situational + 1 technical category' : ''}
          </div>
        </div>
        <div class="field">
          <label class="field-label">Target Airline — optional</label>
          <input id="aiv-airline" value="${esc(cfg.targetAirline||'')}" placeholder="United, Delta, FedEx, Southwest...">
          <div style="font-size:11px;color:var(--dim);margin-top:3px">Claude tailors questions for this carrier's known interview style</div>
        </div>
        <div class="field">
          <label class="field-label">Interview Stage</label>
          <select id="aiv-stage">
            <option value="initial">Initial HR Screen</option>
            <option value="panel">Full Panel Interview</option>
            <option value="final">Final / Chief Pilot Interview</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Your biggest concern going in?</label>
          <input id="aiv-concern" value="${esc(cfg.concern||'')}" placeholder="e.g., low total hours, gap since military, explaining ATP written...">
        </div>
      </div>

      <!-- Technical category selector — shows when technical or full -->
      ${ivType === 'technical' || ivType === 'full' ? `
      <div style="margin-bottom:16px">
        <label class="field-label">Technical Categories${ivType==='full'?' (pick 1 for full pack)':''}</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-top:6px">
          ${AVIATION_TECH_CATEGORIES.map(cat => `
            <label style="display:flex;align-items:start;gap:8px;padding:10px;border:1.5px solid ${selCats.includes(cat.id)?'var(--accent)':'var(--rule-dark)'};background:${selCats.includes(cat.id)?'var(--gold-light)':'white'};border-radius:2px;cursor:pointer">
              <input type="checkbox" value="${cat.id}" ${selCats.includes(cat.id)?'checked':''}
                onchange="toggleAirlineIvCategory('${cat.id}', this.checked)"
                style="width:auto;accent-color:var(--accent);margin-top:2px;flex-shrink:0">
              <div>
                <div style="font-weight:700;font-size:12px;color:var(--accent)">${cat.icon} ${cat.label}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:1px">${cat.desc}</div>
              </div>
            </label>`).join('')}
        </div>
      </div>` : ''}

      <div style="background:var(--accent-light);border:1px solid #c0cfe0;border-radius:2px;padding:10px 14px;font-size:12px;color:var(--accent);margin-bottom:16px">
        ✈️ <strong>Airline interview doctrine:</strong> Airlines want crew, not heroes. Every answer should show you follow SOPs, communicate clearly, and would challenge authority for safety — while never being the person who causes a scene.
      </div>

      <button class="btn btn-primary" onclick="generateAirlineInterviewPrep()" ${busy?'disabled':''} style="padding:12px 24px">
        ${busy ? '<div class="spinner"></div> Generating...' : '🎤 Generate Aviation Interview Prep'}
      </button>
      ${busy ? `<div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:12px;margin-top:12px;font-size:13px;color:var(--accent);display:flex;align-items:center;gap:10px"><div class="spinner"></div> Building questions from your flying background — takes 20-30 seconds</div>` : ''}
      ${error ? `<div style="background:var(--red-light);border:1px solid #e8c0c0;border-radius:2px;padding:12px;margin-top:12px;font-size:13px;color:var(--red)">${esc(error)}</div>` : ''}
    </div>

    ${result ? renderAirlineInterviewResult(result) : ''}`;
}

function toggleAirlineIvCategory(catId, checked) {
  const cfg  = state.ui.airlineIvConfig || {};
  const cats = cfg.techCategories || [];
  const updated = checked ? [...cats, catId] : cats.filter(c => c !== catId);
  setState({ ui: { ...state.ui, airlineIvConfig: { ...cfg, techCategories: updated } } }, false);
}

// ── Result renderer ────────────────────────────────────────────────────

function renderAirlineInterviewResult(result) {
  if (!result) return '';
  const questions = result.questions || [];

  const typeColors = {
    behavioral:  { bg:'#dbeafe', text:'#1d4ed8', border:'#2563eb' },
    technical:   { bg:'#ede9fe', text:'#6d28d9', border:'#7c3aed' },
    situational: { bg:'#fef9c3', text:'#a16207', border:'#d97706' },
    crm:         { bg:'#dcfce7', text:'#15803d', border:'#16a34a' }
  };

  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">✈️ Aviation Interview Prep</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">Practice out loud. Airlines hire the pilot, not the answer.</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="setState({ui:{...state.ui,airlineIvResult:null}})">Clear</button>
      </div>
      ${result.openingTip ? `
      <div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:12px;margin:12px 0;font-size:13px;color:var(--green)">
        <strong>💡 Going in:</strong> ${esc(result.openingTip)}
      </div>` : ''}
    </div>

    ${questions.map((q, i) => {
      const tc = typeColors[q.type] || typeColors.behavioral;
      return `
      <div class="card" style="border-left:4px solid ${tc.border}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <span style="background:${tc.bg};color:${tc.text};border-radius:2px;padding:2px 10px;font-size:11px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.06em;text-transform:uppercase">${q.type||'general'}</span>
          ${q.crmPrinciple ? `<span style="background:var(--gold-light);color:var(--gold);border:1px solid var(--gold);border-radius:2px;padding:2px 8px;font-size:11px;font-weight:600">CRM: ${esc(q.crmPrinciple)}</span>` : ''}
          ${q.difficulty ? `<span style="font-size:11px;color:var(--muted)">${esc(q.difficulty)}</span>` : ''}
        </div>

        <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:12px;line-height:1.4">"${esc(q.question||'')}"</div>

        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;font-family:'Familjen Grotesk',sans-serif">💬 Coached Answer</div>
        <div style="font-size:13px;color:var(--text);line-height:1.75;background:var(--paper);border-radius:2px;padding:12px;white-space:pre-line;margin-bottom:${q.redFlag||q.tip?'10px':'0'}">${esc(q.answer||'')}</div>

        ${q.redFlag ? `
        <div style="background:var(--red-light);border:1px solid #e8c0c0;border-radius:2px;padding:8px 12px;font-size:12px;color:var(--red);margin-bottom:8px">
          <strong>🚩 Don't say:</strong> ${esc(q.redFlag)}
        </div>` : ''}

        ${q.tip ? `
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:2px;padding:8px 12px;font-size:12px;color:#6d28d9">
          <strong>Pro tip:</strong> ${esc(q.tip)}
        </div>` : ''}
      </div>`;
    }).join('')}

    ${result.redFlagsToAvoid ? `
    <div class="card" style="background:var(--red-light);border:2px solid #e8c0c0">
      <h2 style="color:var(--red);margin-bottom:8px">🚩 What Washes Pilots Out</h2>
      <p style="font-size:13px;color:var(--muted);margin:0 0 10px">These patterns end interviews. Don't do any of these.</p>
      <div style="font-size:13px;color:var(--red);white-space:pre-line;line-height:1.8">${esc(result.redFlagsToAvoid)}</div>
    </div>` : ''}

    ${result.closingQuestions ? `
    <div class="card" style="background:var(--gold-light);border:1px solid var(--gold)">
      <h2 style="margin-bottom:8px">❓ Questions to Ask Them</h2>
      <p style="font-size:13px;color:var(--muted);margin:0 0 10px">Pick 2. Asking nothing signals you're not serious. Asking about schedule first signals wrong priorities.</p>
      <div style="font-size:13px;color:#92400e;white-space:pre-line;line-height:1.8">${esc(result.closingQuestions)}</div>
    </div>` : ''}`;
}

// ── Generation ─────────────────────────────────────────────────────────

async function generateAirlineInterviewPrep() {
  const cfg         = state.ui.airlineIvConfig || {};
  const ivType      = document.getElementById('aiv-type')?.value    || cfg.ivType      || 'behavioral';
  const targetAir   = document.getElementById('aiv-airline')?.value || cfg.targetAirline || '';
  const stage       = document.getElementById('aiv-stage')?.value   || 'panel';
  const concern     = document.getElementById('aiv-concern')?.value || cfg.concern      || '';
  const selCats     = cfg.techCategories || [];

  const p       = state.profile;
  const certs   = (typeof getPilotCerts    === 'function') ? getPilotCerts()    : (p.pilotCerts || {});
  const fh      = (typeof getFlightHours   === 'function') ? getFlightHours()   : (state.flightHours || { military:{}, civilian:[] });
  const combined = (typeof calcCombinedHours === 'function') ? calcCombinedHours() : {};
  const airProf = p.airlineProfile || {};

  // Build pilot context for the prompt
  const aircraft = (fh.military?.byAircraft || []).map(a => `${a.type}: ${Number(a.hours||0).toLocaleString()} hrs`).join(', ') || 'Not specified';
  const expText  = state.assignments
    .sort((a,b) => new Date(b.startDate||0) - new Date(a.startDate||0))
    .slice(0,5)
    .map(a => `${a.dutyTitle} at ${a.base} (${a.startDate||'?'}–${a.endDate||'present'}): ${(a.accomplishments||'').slice(0,200)}`)
    .join('\n');

  setState({ ui: { ...state.ui, airlineIvBusy: true, airlineIvError: '', airlineIvResult: null,
    airlineIvConfig: { ...cfg, ivType, targetAirline: targetAir, concern } } });

  const catNames = AVIATION_TECH_CATEGORIES.filter(c => selCats.includes(c.id)).map(c => c.label).join(', ');

  const questionTypes = {
    behavioral:  'CRM behavioral questions (TMAAT format). Focus on: conflict with crew, speaking up to authority, error handling, emergency decision-making, workload management. 6 questions.',
    technical:   `Technical knowledge Q&A in these categories: ${catNames||'Weather, FARs, Emergencies'}. 6-8 questions with complete study-guide answers.`,
    situational: 'Situational scenarios — go/no-go decisions, captain pressure, ATC instruction conflict, passenger emergency, weather deterioration in flight. 6 questions.',
    full:        `Mixed: 3 CRM behavioral + 2 situational + 3 technical (${catNames||'Weather + Emergencies'}). 8 questions total.`
  };

  try {
    const raw = await callClaude(
      `You are an airline captain, check airman, and interview coach who has sat on hiring boards at major U.S. carriers. You know exactly what chief pilots and HR interviewers are looking for — and what gets pilots cut.

AIRLINE INTERVIEW DOCTRINE:
The single biggest wash-out pattern: pilots who make themselves the hero. Airlines hire crew members, not cowboys. Every coached answer must demonstrate:
1. SOP compliance — you follow the book
2. CRM awareness — you use your crew
3. Safety over schedule — always
4. Assertiveness without aggression — you speak up, professionally
5. Vulnerability — you can admit error and learn from it

For BEHAVIORAL questions: answers must be specific, first-person, and reference real events. No "I would" — only "I did." Use loose STAR structure but vary it.
For TECHNICAL questions: give complete, accurate answers a check airman would approve.
For SITUATIONAL questions: walk through decision-making transparently. State what you'd do and why.

RETURN ONLY VALID JSON. No markdown, no extra text.`,

      `Generate aviation interview prep for this pilot.

PILOT PROFILE:
Branch: ${p.branch||'Military'} | Rank: ${p.rank||'N/A'} | Years: ${p.yearsOfService||'N/A'}
Total Hours: ${combined.total > 0 ? combined.total.toLocaleString() : (fh.military?.total||'?')}
PIC Hours: ${combined.pic > 0 ? combined.pic.toLocaleString() : (fh.military?.pic||'?')}
Instructor Hours: ${airProf.instructor||fh.military?.instructor||'?'}
Aircraft Flown: ${aircraft}
ATP: ${certs.atp?'Yes':'No'} | Type Ratings: ${certs.typeRatings||'None'} | Medical: ${certs.faaClass||'Not entered'}
Civilian Airline Experience: ${(fh.civilian||[]).length > 0 ? (fh.civilian||[]).map(e=>`${e.aircraft} ${e.hours} hrs`).join(', ') : 'None'}

MILITARY EXPERIENCE:
${expText||'None entered'}

TARGET: ${targetAir||'Major US carrier'} — ${stage} stage
${concern ? `PILOT CONCERN: ${concern}` : ''}

GENERATE: ${questionTypes[ivType] || questionTypes.behavioral}

Return this JSON:
{
  "openingTip": "One specific tactical tip for THIS interview stage and carrier",
  "questions": [
    {
      "question": "Exact question as the interviewer would ask it",
      "type": "behavioral|technical|situational",
      "crmPrinciple": "CRM principle being tested (behavioral/situational only) or empty string",
      "difficulty": "Standard|Tough|Known Differentiator",
      "answer": "Coached answer. Specific, first-person. References the pilot's actual aircraft and experience. 3-5 sentences. No filler. Demonstrates CRM thinking.",
      "redFlag": "The wrong way to answer this that washes pilots out — one sentence",
      "tip": "One delivery tip"
    }
  ],
  "redFlagsToAvoid": "5 specific behaviors/phrases that end airline interviews — numbered list",
  "closingQuestions": "4 smart questions to ask the interviewers — numbered list. No questions about schedule, pay, or vacation in round 1."
}`
    );

    let result;
    try {
      result = typeof extractJSON === 'function'
        ? extractJSON(raw)
        : JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) {
      throw new Error('Could not parse results. Try again.');
    }

    setState({ ui: { ...state.ui, airlineIvBusy: false, airlineIvResult: result } });
    if (typeof trackAction === 'function') trackAction('interview_generate');
    showToast('✈️ Aviation interview prep ready!');

  } catch(err) {
    setState({ ui: { ...state.ui, airlineIvBusy: false, airlineIvError: err.message } });
  }
}
