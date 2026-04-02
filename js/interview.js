// ── Interview Prep ────────────────────────────────────────────────────
function renderInterview() {
  const jobs = state.jobs;
  const selJob = state.ui.interviewJob||'';
  const busy = state.ui.interviewBusy||false;
  const result = state.ui.interviewResult||null;
  const error = state.ui.interviewError||'';
  const jobOptions = jobs.map(j=>`<option value="${j.id}" ${selJob===j.id?'selected':''}>${esc(j.title)} — ${esc(j.company)}</option>`).join('');
  const hasInput = selJob || (state.ui.interviewManualRole||'');
  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent);letter-spacing:0.02em">🎤 Interview Prep</h1>
    <p style="color:var(--muted);font-size:14px;margin:0 0 20px">Claude reads the job and your background, then generates the questions you're most likely to face — with coached answers drawn from your actual experience.</p>
    
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
          <input id="iv-concern" placeholder="e.g., gaps in technical background, explaining my clearance, salary question, career pivot..."
            value="${esc(state.ui.interviewConcern||'')}"
            oninput="setState({ui:{...state.ui, interviewConcern:this.value}}, false)">
          <div style="font-size:11px;color:var(--dim);margin-top:3px">Claude will make sure your concern gets addressed directly in the prep.</div>
        </div>
      </div>

      <!-- Immigration / logistics reminder -->
      <div style="background:var(--paper-dark);border:1px solid var(--rule);border-radius:2px;padding:10px 14px;font-size:12px;color:var(--muted);margin-bottom:16px">
        💡 <strong>Recruiter screen tip:</strong> Always be ready to confirm work authorization, location preference, remote/hybrid/on-site flexibility, and salary expectations clearly and concisely. Claude will include prep for these.
      </div>

      <button class="btn btn-primary" onclick="generateInterviewPrep()" ${busy?'disabled':''} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Generating...':'🎤 Generate Interview Prep'}
      </button>
      ${busy?`<div style="background:var(--accent-light);border-radius:2px;padding:12px;margin-top:12px;font-size:13px;color:var(--accent);display:flex;align-items:center;gap:10px"><div class="spinner"></div> Generating questions and coached answers...</div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:2px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>
    ${result?renderInterviewResult(result):''}`;
}

function renderInterviewResult(result) {
  const questions = result.questions||[];
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">Interview Questions & Coached Answers</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">These answers are starting points — adapt them in your own voice. Practice saying them out loud.</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('interviewResult',null)">Clear</button>
      </div>
      ${result.openingTip?`<div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:12px;margin:12px 0;font-size:13px;color:var(--green)"><strong>💡 Opening tip:</strong> ${esc(result.openingTip)}</div>`:''}
    </div>
    ${questions.map((q,i)=>`
    <div class="card" style="border-left:4px solid ${q.type==='behavioral'?'var(--accent)':q.type==='technical'?'#7c3aed':q.type==='curveball'?'var(--red)':q.type==='logistics'?'var(--green)':'var(--gold)'}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:700;background:${q.type==='behavioral'?'var(--accent-light)':q.type==='technical'?'#ede9fe':q.type==='curveball'?'var(--red-light)':q.type==='logistics'?'var(--green-light)':'var(--gold-light)'};color:${q.type==='behavioral'?'var(--accent)':q.type==='technical'?'#6d28d9':q.type==='curveball'?'var(--red)':q.type==='logistics'?'var(--green)':'var(--gold)'};border-radius:2px;padding:2px 10px;text-transform:uppercase;letter-spacing:0.5px;font-family:'Familjen Grotesk',sans-serif">${q.type||'general'}</span>
        <span style="font-size:12px;color:var(--muted)">${q.difficulty||''}</span>
        ${q.adjacent_flag?`<span style="font-size:11px;font-weight:700;background:#fffbeb;color:#92400e;border:1px solid #fde68a;border-radius:2px;padding:1px 7px;font-family:'Familjen Grotesk',sans-serif">⚡ Adjacent experience — see framing note</span>`:''}
      </div>
      <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:12px">"${esc(q.question||'')}"</div>
      <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-family:'Familjen Grotesk',sans-serif">💬 Coached Answer</div>
      <div style="font-size:13px;color:var(--text);line-height:1.7;background:var(--paper);border-radius:2px;padding:12px;white-space:pre-line">${esc(q.answer||'')}</div>
      ${q.adjacent_note?`<div style="font-size:12px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:2px;padding:8px;margin-top:8px"><strong>⚡ Framing note (adjacent experience):</strong> ${esc(q.adjacent_note)}</div>`:''}
      ${q.tip?`<div style="font-size:12px;color:#6d28d9;background:#faf5ff;border-radius:2px;padding:8px;margin-top:8px"><strong>Pro tip:</strong> ${esc(q.tip)}</div>`:''}
    </div>`).join('')}
    ${result.closingQuestions?`
    <div class="card" style="background:var(--gold-light);border:1px solid #e8d5a0">
      <h2 style="margin-bottom:8px">❓ Questions to Ask Them</h2>
      <p style="font-size:13px;color:var(--muted);margin:0 0 10px">Asking smart questions signals you've done your homework. Pick 2-3 from this list.</p>
      <div style="font-size:13px;color:#92400e;white-space:pre-line">${esc(result.closingQuestions)}</div>
    </div>`:''}
    ${result.logisticsPrep?`
    <div class="card" style="background:var(--green-light);border:1px solid #c8e6cd">
      <h2 style="margin-bottom:8px">📋 Logistics & Screening Q&A</h2>
      <p style="font-size:13px;color:var(--muted);margin:0 0 10px">Have crisp answers to these before the call. Recruiters ask these in the first 5 minutes.</p>
      <div style="font-size:13px;color:var(--green);white-space:pre-line">${esc(result.logisticsPrep)}</div>
    </div>`:''}`;
}

async function generateInterviewPrep() {
  const selJob = state.ui.interviewJob;
  const job = selJob ? state.jobs.find(j=>j.id===selJob) : null;
  
  const manualRole = state.ui.interviewManualRole?.trim()||document.getElementById('iv-manual-role')?.value?.trim()||'';
  const manualCompany = state.ui.interviewManualCompany?.trim()||document.getElementById('iv-manual-company')?.value?.trim()||'';
  
  if (!job && !manualRole) { 
    showToast('Select a job or enter a role to prep for', false); 
    return; 
  }
  const stage   = document.getElementById('iv-stage')?.value||'behavioral';
  const count   = Math.min(parseInt(document.getElementById('iv-count')?.value||'6'), 6);
  const concern = state.ui.interviewConcern?.trim()||document.getElementById('iv-concern')?.value?.trim()||'';

  setState({ ui:{...state.ui, interviewBusy:true, interviewError:'', interviewResult:null} });

  const p = state.profile;
  const exp = state.assignments.slice(0,4).map(a=>`${a.dutyTitle} at ${a.base||a.unit||'N/A'}: ${(a.accomplishments||'').slice(0,300)}`).join('\n');
  const civExp = state.civilianJobs.slice(0,2).map(j=>`${j.title} at ${j.company}: ${(j.accomplishments||'').slice(0,200)}`).join('\n');
  const awards = state.awards.slice(0,3).map(a=>a.name).join(', ');

  try {
    const raw = await callClaude(
      `You are a senior executive coach who specializes in preparing military veterans for civilian job interviews. You know exactly what interviewers at defense contractors, tech companies, and federal agencies ask — and you coach veterans to answer with specificity, confidence, and honesty.

CORE COACHING PHILOSOPHY:
1. HONESTY ABOUT DIRECT vs. ADJACENT EXPERIENCE: Veterans often have transferable skills but not direct hands-on experience. The best interview answers acknowledge this honestly rather than overstating. When a veteran has adjacent (not direct) experience, coach them to frame from the requirements/integration/business side — not to claim hands-on expertise they don't have. Flag these cases explicitly with "adjacent_flag: true".

2. SPECIFICITY OVER GENERALITIES: Every behavioral answer should reference a real assignment, a real number, or a real outcome. "I led a team" is weak. "I led a 14-person team that delivered X result under Y constraint" is strong.

3. MILITARY JARGON = ZERO: All coached answers use civilian language. No acronyms, no military titles, no unit designations that a civilian wouldn't recognize.

4. STAR STRUCTURE — NOT ROBOTICALLY: Use Situation-Task-Action-Result loosely. Vary the structure. Not every answer needs all four components in sequence.

5. LOGISTICS READINESS: A recruiter screen almost always includes work authorization, location preference, remote/hybrid/on-site willingness, and salary. Veterans often fumble these. Include a logistics prep section in every response.

6. IMMIGRATION/WORK AUTH: Always include a logistics answer confirming U.S. work authorization clearly and concisely. Use present tense for current status, past tense for former roles.

TONE: Confident without arrogance. Direct without being abrupt. Specific without being a robot. Sound like a person who knows their value and can communicate it clearly.`,

      `Generate ${count} interview questions and coached answers for this veteran.

INTERVIEW STAGE: ${stage}
${concern ? `VETERAN'S BIGGEST CONCERN: ${concern} — make sure this gets addressed directly in the prep.` : ''}

VETERAN PROFILE:
Branch: ${p.branch} | Rank: ${p.rank} | Years: ${p.yearsOfService} | MOS: ${p.mosRate||'N/A'}
Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Technical Skills: ${[...(p.technicalSkills||[]),(p.softSkills||[])].slice(0,10).join(', ')}
Military Experience:
${exp}
${civExp ? `Civilian Experience:\n${civExp}` : ''}
Awards: ${awards||'None'}
Work Authorization: U.S. Citizen (military veteran)
Location/Work Preference: ${p.workPreference||'Not specified'} | Willing to Relocate: ${p.willingToRelocate||'Not specified'}

TARGET JOB: ${job ? job.title+' at '+job.company : manualRole+(manualCompany?' at '+manualCompany:'')}
Requirements/Notes: ${job?.notes||'Not specified'}

INSTRUCTIONS:
- Mix question types: behavioral (STAR format), technical/role-specific, situational, 1-2 curveballs, and logistics questions
- Coached answers use the veteran's ACTUAL experience — reference real assignments, real numbers
- When the veteran has ADJACENT (not direct) experience for a required skill, set "adjacent_flag": true and add "adjacent_note" explaining how to frame it from the requirements/integration/business side — not as hands-on expertise
- Never coach the veteran to claim direct experience they don't have
- Flag questions where military background is a strength vs. where it needs bridging
- Include work auth, location, and salary questions as "logistics" type

Return ONLY this JSON (no markdown, no extra text):
{
  "openingTip": "One tactical tip for this interview stage",
  "questions": [
    {
      "question": "exact interview question",
      "type": "behavioral|technical|situational|curveball|logistics",
      "difficulty": "Expected|Tough|Curveball",
      "answer": "Coached answer. 2-4 sentences. First person. One specific metric where possible. No filler. No military jargon.",
      "adjacent_flag": false,
      "adjacent_note": "",
      "tip": "One delivery tip for this question"
    }
  ],
  "closingQuestions": "4 smart questions to ask the interviewer, numbered list",
  "logisticsPrep": "Crisp pre-written answers for: work authorization, location/remote preference, availability/start date, and salary expectations. Format as Q: / A: pairs."
}`, 'interview');

    let result;
    try { result = extractJSON(raw); } catch(e) { throw new Error('Could not parse results. Try again.'); }
    setState({ ui:{...state.ui, interviewBusy:false, interviewResult:result} });
    if (typeof trackAction==='function') trackAction('interview_generate');
    showToast('✓ Interview prep generated!');
  } catch(err) {
    console.error('[Interview] ERROR:', err.message, err);
    setState({ ui:{...state.ui, interviewBusy:false, interviewError:err.message} });
  }
}
