// ── Interview Prep ────────────────────────────────────────────────────
function renderInterview() {
  const ivTab    = state.ui.ivTab || 'standard';
  const airlineOn = typeof isAirlinePath === 'function' && isAirlinePath();

  const tabBar = `
    <div style="display:flex;gap:0;margin-bottom:20px;border-radius:2px;overflow:hidden;border:1.5px solid var(--rule-dark);width:fit-content">
      <button onclick="toggleUI('ivTab','standard')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${ivTab==='standard'?'var(--accent)':'white'};color:${ivTab==='standard'?'white':'var(--muted)'};transition:all 0.15s">🎤 CIVILIAN PREP</button>
      ${airlineOn ? `<button onclick="toggleUI('ivTab','airline')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${ivTab==='airline'?'var(--accent)':'white'};color:${ivTab==='airline'?'white':'var(--muted)'};transition:all 0.15s;border-left:1.5px solid var(--rule-dark)">✈️ AIRLINE INTERVIEW</button>` : ''}
    </div>`;

  if (ivTab === 'airline' && airlineOn) {
    return `
      <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">🎤 Interview Prep</h1>
      <p style="color:var(--muted);font-size:14px;margin:0 0 20px">Aviation interview prep — CRM behavioral, technical knowledge, and situational scenarios.</p>
      ${tabBar}
      ${typeof renderAirlineInterviewMode === 'function' ? renderAirlineInterviewMode() : '<p style="color:var(--muted)">Loading airline interview module...</p>'}`;
  }

  const jobs       = state.jobs;
  const selJob     = state.ui.interviewJob || '';
  const busy       = state.ui.interviewBusy || false;
  const result     = state.ui.interviewResult || null;
  const error      = state.ui.interviewError || '';
  const jobOptions = jobs.map(j=>`<option value="${j.id}" ${selJob===j.id?'selected':''}>${esc(j.title)} — ${esc(j.company)}</option>`).join('');
  const achCount   = (state.achievements||[]).length;

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">🎤 Interview Prep</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Claude reads the job and your background, then generates the questions you're most likely to face — with coached answers drawn from your actual experience.</p>
    ${tabBar}

    ${achCount > 0 ? `
    <div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:var(--green);display:flex;align-items:center;gap:8px">
      <span>🏆</span>
      <span><strong>${achCount} achievement${achCount===1?'':'s'}</strong> from your brag book will be used to write more specific coached answers.</span>
    </div>` : `
    <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#92400e">
      💡 <strong>Tip:</strong> Build your <button onclick="setState({view:'achievements'})" style="background:none;border:none;color:var(--accent);font-weight:700;cursor:pointer;padding:0;font-size:13px">Achievements Library</button> first — Claude uses it to write more specific, metric-driven interview answers.
    </div>`}

    <div class="card">
      <h2>Configure Interview Prep</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Target Job (from tracker)</label>
          <select id="iv-job" onchange="toggleUI('interviewJob',this.value)">
            <option value="">Select a tracked job...</option>${jobOptions}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Or enter role manually</label>
          <input id="iv-manual-role" placeholder="e.g., Program Manager — Defense"
            value="${esc(state.ui.interviewManualRole||'')}"
            oninput="setState({ui:{...state.ui, interviewManualRole:this.value}}, false)">
        </div>
        <div class="field">
          <label class="field-label">Company (if entering manually)</label>
          <input id="iv-manual-company" placeholder="e.g., Leidos, Anduril..."
            value="${esc(state.ui.interviewManualCompany||'')}"
            oninput="setState({ui:{...state.ui, interviewManualCompany:this.value}}, false)">
        </div>
        <div class="field">
          <label class="field-label">Interview Stage</label>
          <select id="iv-stage">
            <option value="phone">Phone Screen / Recruiter Call</option>
            <option value="behavioral">Behavioral Interview</option>
            <option value="technical">Technical / Skills Interview</option>
            <option value="panel">Panel Interview</option>
            <option value="executive">Executive / Final Round</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Number of Questions</label>
          <select id="iv-count">
            <option value="5">5 questions — quick prep</option>
            <option value="6" selected>6 questions — standard</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Your biggest concern going in?</label>
          <input id="iv-concern" placeholder="e.g., gaps in technical background, explaining my clearance, salary question..."
            value="${esc(state.ui.interviewConcern||'')}"
            oninput="setState({ui:{...state.ui, interviewConcern:this.value}}, false)">
        </div>
      </div>
      <button class="btn btn-primary" onclick="generateInterviewPrep()" ${busy?'disabled':''} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Generating...':'🎤 Generate Interview Prep'}
      </button>
      ${busy?`<div style="background:#eff6ff;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#1e40af;display:flex;align-items:center;gap:10px"><div class="spinner"></div> Generating questions and coached answers...</div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>
    ${result?renderInterviewResult(result):''}`;
}

function renderInterviewResult(result) {
  const questions = result.questions||[];
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:8px">
        <div><h2 style="margin:0">Interview Questions & Coached Answers</h2>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0">These answers are starting points — adapt them in your own voice. Practice saying them out loud.</p></div>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('interviewResult',null)">Clear</button>
      </div>
      ${result.openingTip?`<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;margin:12px 0;font-size:13px;color:#166534"><strong>💡 Opening tip:</strong> ${esc(result.openingTip)}</div>`:''}
    </div>
    ${questions.map((q,i)=>`
    <div class="card" style="border-left:4px solid ${q.type==='behavioral'?'#2563eb':q.type==='technical'?'#7c3aed':q.type==='curveball'?'#dc2626':'#d97706'}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:700;background:${q.type==='behavioral'?'#dbeafe':q.type==='technical'?'#ede9fe':q.type==='curveball'?'#fee2e2':'#fef9c3'};color:${q.type==='behavioral'?'#1d4ed8':q.type==='technical'?'#6d28d9':q.type==='curveball'?'#dc2626':'#a16207'};border-radius:999px;padding:2px 10px;text-transform:uppercase;letter-spacing:0.5px">${q.type||'general'}</span>
        ${q.adjacent_flag?`<span style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600">Adjacent experience</span>`:''}
        <span style="font-size:12px;color:#6b7280">${q.difficulty||''}</span>
      </div>
      <div style="font-weight:700;font-size:15px;color:#111;margin-bottom:12px">"${esc(q.question||'')}"</div>
      <div style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">💬 Coached Answer</div>
      <div style="font-size:13px;color:#374151;line-height:1.7;background:#f9fafb;border-radius:8px;padding:12px;white-space:pre-line">${esc(q.answer||'')}</div>
      ${q.adjacent_note?`<div style="font-size:12px;color:#e65100;background:#fff3e0;border-radius:6px;padding:8px;margin-top:8px"><strong>Note:</strong> ${esc(q.adjacent_note)}</div>`:''}
      ${q.tip?`<div style="font-size:12px;color:#6d28d9;background:#faf5ff;border-radius:6px;padding:8px;margin-top:8px"><strong>Pro tip:</strong> ${esc(q.tip)}</div>`:''}
    </div>`).join('')}
    ${result.closingQuestions?`
    <div class="card" style="background:#fffbeb;border:1px solid #fde68a">
      <h2 style="margin-bottom:8px">❓ Questions to Ask Them</h2>
      <p style="font-size:13px;color:#6b7280;margin:0 0 10px">Asking smart questions signals you've done your homework. Pick 2-3 from this list.</p>
      <div style="font-size:13px;color:#92400e;white-space:pre-line">${esc(result.closingQuestions)}</div>
    </div>`:''}`;
}

async function generateInterviewPrep() {
  const selJob        = state.ui.interviewJob;
  const job           = selJob ? state.jobs.find(j=>j.id===selJob) : null;
  const manualRole    = state.ui.interviewManualRole?.trim()    || document.getElementById('iv-manual-role')?.value?.trim()    || '';
  const manualCompany = state.ui.interviewManualCompany?.trim() || document.getElementById('iv-manual-company')?.value?.trim() || '';
  if (!job && !manualRole) { showToast('Select a job or enter a role to prep for', false); return; }
  const stage   = document.getElementById('iv-stage')?.value || 'behavioral';
  const count   = Math.min(parseInt(document.getElementById('iv-count')?.value||'6'), 6);
  const concern = state.ui.interviewConcern?.trim() || document.getElementById('iv-concern')?.value?.trim() || '';

  setState({ ui:{...state.ui, interviewBusy:true, interviewError:'', interviewResult:null} });

  const p      = state.profile;
  const exp    = state.assignments.slice(0,4).map(a=>`${a.dutyTitle} at ${a.base}: ${(a.accomplishments||'').slice(0,300)}`).join('\n');
  const awards = state.awards.slice(0,3).map(a=>a.name).join(', ');

  // Pull achievements context if available
  const achievementsContext = typeof buildAchievementsContext === 'function'
    ? buildAchievementsContext(6)
    : '';

  try {
    const raw = await callClaude(
      `You are a senior executive coach who specializes in preparing military veterans for civilian job interviews. You know exactly what interviewers at defense contractors, tech companies, and federal agencies ask — and you know how to help veterans translate their experience into answers that land. When an achievements library is provided, reference specific wins with real metrics in the coached answers. You write coached answers that sound like the veteran is speaking, not reading from a script.`,
      `Generate ${count} interview questions and coached answers for this veteran. Interview stage: ${stage}.
${concern ? 'Veteran concern: '+concern : ''}

VETERAN:
Branch: ${p.branch} | Rank: ${p.rank} | Years: ${p.yearsOfService} | MOS: ${p.mosRate||'N/A'}
Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Skills: ${[...(p.technicalSkills||[]),(p.softSkills||[])].slice(0,10).join(', ')}
Experience: ${exp}
Awards: ${awards||'None'}
${achievementsContext}

TARGET JOB: ${job ? job.title+' at '+job.company : manualRole+(manualCompany?' at '+manualCompany:'')}
Requirements/Notes: ${job?.notes||'Not specified'}

INSTRUCTIONS:
- Mix question types: behavioral (STAR format), technical/role-specific, situational, and 1-2 curveballs
- When achievements are provided, reference specific wins with real metrics in coached answers
- Every behavioral answer should follow STAR loosely but not robotically — vary the structure
- Flag questions where military background is a strength vs where it needs bridging
- Be direct — if an answer needs to address a potential gap, say so and coach around it
- For adjacent (not direct) experience, set adjacent_flag:true and fill adjacent_note

Return ONLY this JSON (no markdown, no extra text):
{
  "openingTip": "One tactical tip for this interview stage",
  "questions": [
    {
      "question": "exact interview question",
      "type": "behavioral|technical|situational|curveball",
      "difficulty": "Expected|Tough|Curveball",
      "adjacent_flag": false,
      "adjacent_note": "",
      "answer": "Coached answer. 2-3 sentences. First person. Reference specific metrics from achievements where possible. No filler.",
      "tip": "One delivery tip for this question"
    }
  ],
  "closingQuestions": "4 smart questions to ask, numbered list"
}`, 'interview');

    let result;
    try {
      result = typeof extractJSON === 'function'
        ? extractJSON(raw)
        : JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) { throw new Error('Could not parse results. Try again.'); }

    setState({ ui:{...state.ui, interviewBusy:false, interviewResult:result} });
    if (typeof trackAction==='function') trackAction('interview_generate');
    showToast('✓ Interview prep generated!');
  } catch(err) {
    setState({ ui:{...state.ui, interviewBusy:false, interviewError:err.message} });
  }
}
