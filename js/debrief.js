// ── debrief.js — Interview Debrief Form ───────────────────────────────
//
// Surfaces post-interview on any job card with status:
//   interviewing | offered | rejected | withdrawn
//
// Data lives on the job object: job.debriefs = [...]
// Each debrief: { id, date, format, stage, interviewers[], questions[],
//                 militaryLanding, energyRead, strongMoments, weakMoments,
//                 rawNotes, claudeCoaching, thankYouEmail }
// ──────────────────────────────────────────────────────────────────────

const DEBRIEF_FORMATS = [
  { id: 'phone',     label: 'Phone Call' },
  { id: 'video',     label: 'Video Call (Zoom/Teams)' },
  { id: 'in-person', label: 'In-Person' },
  { id: 'panel',     label: 'Panel (multiple interviewers)' },
  { id: 'hybrid',    label: 'Hybrid (some remote, some in-person)' }
];

const DEBRIEF_STAGES = [
  { id: 'phone-screen', label: 'Phone Screen / Recruiter Call' },
  { id: 'first-round',  label: 'First Round' },
  { id: 'second-round', label: 'Second Round' },
  { id: 'panel',        label: 'Panel Interview' },
  { id: 'final',        label: 'Final Round' },
  { id: 'executive',    label: 'Executive / C-Suite' }
];

// ── Main debrief view ──────────────────────────────────────────────────
// Called when state.view === 'debrief' with state.ui.debriefJobId set

function renderDebrief() {
  const jobId   = state.ui.debriefJobId;
  const job     = state.jobs.find(j => j.id === jobId);
  const debriefId = state.ui.activeDebriefId;

  if (!job) {
    return `
      <h1 style="font-size:24px;font-weight:800;margin:0 0 16px">Interview Debrief</h1>
      <div class="card" style="text-align:center;padding:40px;color:var(--muted)">
        Job not found. <button onclick="setState({view:'jobs'})" class="btn btn-secondary btn-sm" style="margin-left:8px">Back to Job Tracker</button>
      </div>`;
  }

  const debriefs  = job.debriefs || [];
  const isAdding  = state.ui.debriefAdding || false;
  const activeDebrief = debriefId ? debriefs.find(d => d.id === debriefId) : null;

  return `
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;flex-wrap:wrap">
      <button onclick="setState({view:'jobs'})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;padding:0;display:flex;align-items:center;gap:4px">← Job Tracker</button>
      <span style="color:var(--rule-dark)">·</span>
      <h1 style="font-size:22px;font-weight:800;margin:0;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">📝 Interview Debrief</h1>
    </div>
    <div style="font-size:13px;color:var(--muted);margin:0 0 20px">
      <strong>${esc(job.title)}</strong> at <strong>${esc(job.company)}</strong>
    </div>

    <!-- What is this + why it matters -->
    ${debriefs.length === 0 && !isAdding ? `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light);margin-bottom:16px">
      <div style="font-weight:700;font-size:14px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;margin-bottom:6px">Why debrief every interview</div>
      <div style="font-size:13px;color:var(--text);line-height:1.7">
        Most veterans leave interviews with vague feelings — it went okay, or it felt off. The debrief turns that into actionable intelligence.
        What questions caught you off guard? How did the military background translate? What would you say differently in round two?
        Claude reads your notes and gives specific coaching — plus writes a thank-you email that references something real from the conversation.
      </div>
    </div>` : ''}

    <!-- Past debriefs list -->
    ${debriefs.length > 0 && !isAdding && !activeDebrief ? `
    <div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:10px">Past Debriefs (${debriefs.length})</div>
      ${[...debriefs].reverse().map(d => `
        <div class="card" style="margin-bottom:8px;cursor:pointer;border-left:4px solid var(--accent)" onclick="toggleUI('activeDebriefId','${d.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--accent)">${esc(DEBRIEF_STAGES.find(s=>s.id===d.stage)?.label||d.stage||'Interview')}</div>
              <div style="font-size:12px;color:var(--muted)">
                ${d.date ? new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'No date'} ·
                ${esc(DEBRIEF_FORMATS.find(f=>f.id===d.format)?.label||d.format||'Unknown format')}
                ${d.interviewers?.length ? ` · ${d.interviewers.filter(i=>i.name).map(i=>esc(i.name)).join(', ')}` : ''}
              </div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              ${d.claudeCoaching ? `<span style="background:var(--green-light);color:var(--green);border-radius:2px;padding:2px 8px;font-size:11px;font-weight:600;font-family:'Familjen Grotesk',sans-serif">✓ Coached</span>` : ''}
              ${d.thankYouEmail ? `<span style="background:var(--accent-light);color:var(--accent);border-radius:2px;padding:2px 8px;font-size:11px;font-weight:600;font-family:'Familjen Grotesk',sans-serif">✉️ Email ready</span>` : ''}
              <span style="color:var(--gold);font-size:12px">View →</span>
            </div>
          </div>
        </div>`).join('')}
    </div>` : ''}

    <!-- Active debrief view -->
    ${activeDebrief ? renderDebriefDetail(activeDebrief, job) : ''}

    <!-- Add new debrief form -->
    ${isAdding ? renderDebriefForm(job) : ''}

    <!-- Add button -->
    ${!isAdding && !activeDebrief ? `
    <button class="btn btn-primary" onclick="toggleUI('debriefAdding',true)" style="width:100%;justify-content:center;padding:14px">
      + Log New Interview
    </button>` : ''}`;
}

// ── Debrief form ───────────────────────────────────────────────────────

function renderDebriefForm(job) {
  const draft   = state.ui.debriefDraft || {};
  const questions = draft.questions || [{ question:'', myAnswer:'', betterAnswer:'' }];

  return `
    <div class="card" style="border:2px solid var(--accent)">
      <h2>Log This Interview</h2>

      <!-- Basic info -->
      <div class="grid2">
        <div class="field">
          <label class="field-label">Interview Date *</label>
          <input type="date" id="db-date" value="${esc(draft.date||new Date().toISOString().split('T')[0])}">
        </div>
        <div class="field">
          <label class="field-label">Format</label>
          <select id="db-format">
            ${DEBRIEF_FORMATS.map(f=>`<option value="${f.id}" ${draft.format===f.id?'selected':''}>${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Stage</label>
          <select id="db-stage">
            ${DEBRIEF_STAGES.map(s=>`<option value="${s.id}" ${draft.stage===s.id?'selected':''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Duration</label>
          <input id="db-duration" value="${esc(draft.duration||'')}" placeholder="e.g., 45 minutes, 2 hours">
        </div>
      </div>

      <!-- Interviewers -->
      <div style="margin-bottom:16px">
        <label class="field-label">Interviewers</label>
        <div id="db-interviewers">
          ${(draft.interviewers||[{ name:'', title:'' }]).map((iv, i) => `
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <input id="db-iv-name-${i}" value="${esc(iv.name||'')}" placeholder="Name" style="flex:1;font-size:13px">
            <input id="db-iv-title-${i}" value="${esc(iv.title||'')}" placeholder="Title / Role" style="flex:1;font-size:13px">
            ${i>0?`<button onclick="removeInterviewer(${i})" class="btn btn-danger btn-sm" style="flex-shrink:0">✕</button>`:''}
          </div>`).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="addInterviewer()">+ Add Interviewer</button>
      </div>

      <!-- Questions -->
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <label class="field-label" style="margin:0">Questions & Answers</label>
          <div style="font-size:11px;color:var(--dim)">Add the actual questions they asked</div>
        </div>
        <div id="db-questions">
          ${questions.map((q, i) => renderQuestionRow(q, i)).join('')}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="addDebriefQuestion()">+ Add Question</button>
      </div>

      <!-- Military translation read -->
      <div style="background:var(--accent-light);border:1px solid #c0cfe0;border-radius:2px;padding:14px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:12px">🪖 Military Background Read</div>
        <div class="grid2">
          <div class="field">
            <label class="field-label">How did the military background land?</label>
            <select id="db-mil-landing">
              <option value="strong"   ${draft.militaryLanding==='strong'  ?'selected':''}>💪 Strong — they got it immediately</option>
              <option value="neutral"  ${(draft.militaryLanding||'neutral')==='neutral'?'selected':''}>😐 Neutral — no reaction either way</option>
              <option value="confused" ${draft.militaryLanding==='confused'?'selected':''}>❓ Confused — needed a lot of translation</option>
              <option value="awkward"  ${draft.militaryLanding==='awkward' ?'selected':''}>😬 Awkward — it seemed to work against me</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Overall energy read</label>
            <select id="db-energy">
              <option value="very-interested" ${draft.energyRead==='very-interested'?'selected':''}>🔥 Very interested</option>
              <option value="interested"      ${(draft.energyRead||'interested')==='interested'?'selected':''}>✓ Interested</option>
              <option value="neutral"         ${draft.energyRead==='neutral'?'selected':''}>😐 Hard to read</option>
              <option value="uncertain"       ${draft.energyRead==='uncertain'?'selected':''}>⚠️ Seemed uncertain about me</option>
              <option value="not-interested"  ${draft.energyRead==='not-interested'?'selected':''}>❌ Not interested</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Military translation notes — what worked, what fell flat</label>
          <textarea id="db-mil-notes" rows="2" placeholder="e.g., They didn't know what a squadron was but responded well when I said 'division of 300 people'. The deployment experience seemed to resonate...">${esc(draft.militaryNotes||'')}</textarea>
        </div>
      </div>

      <!-- Strong / weak moments -->
      <div class="grid2">
        <div class="field">
          <label class="field-label">Strong moments</label>
          <textarea id="db-strong" rows="3" placeholder="What felt right? When did you feel the energy shift in your favor?">${esc(draft.strongMoments||'')}</textarea>
        </div>
        <div class="field">
          <label class="field-label">Weak moments</label>
          <textarea id="db-weak" rows="3" placeholder="What caught you off guard? What answer do you wish you'd given?">${esc(draft.weakMoments||'')}</textarea>
        </div>
      </div>

      <!-- Raw notes dump -->
      <div class="field">
        <label class="field-label">Raw notes — dump everything here</label>
        <textarea id="db-notes" rows="5" placeholder="Anything else — the office vibe, what they mentioned about the team, salary signals, timeline hints, who was in the room, what they emphasized...">${esc(draft.rawNotes||'')}</textarea>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="saveDebrief('${job.id}')">Save Debrief</button>
        <button class="btn btn-secondary" onclick="toggleUI('debriefAdding',false);toggleUI('debriefDraft',{})">Cancel</button>
      </div>
    </div>`;
}

function renderQuestionRow(q, i) {
  return `
    <div id="dbq-row-${i}" style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:11px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.06em">Question ${i+1}</div>
        ${i>0?`<button onclick="removeDebriefQuestion(${i})" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:12px">✕ Remove</button>`:''}
      </div>
      <div class="field">
        <label class="field-label">What they asked</label>
        <input id="dbq-q-${i}" value="${esc(q.question||'')}" placeholder="e.g., Tell me about a time you led through ambiguity..." style="font-size:13px">
      </div>
      <div class="grid2">
        <div class="field" style="margin-bottom:0">
          <label class="field-label">What I said</label>
          <textarea id="dbq-mine-${i}" rows="2" placeholder="Your actual answer..." style="font-size:13px">${esc(q.myAnswer||'')}</textarea>
        </div>
        <div class="field" style="margin-bottom:0">
          <label class="field-label">What I wish I'd said</label>
          <textarea id="dbq-better-${i}" rows="2" placeholder="Better answer, or things I forgot to mention..." style="font-size:13px">${esc(q.betterAnswer||'')}</textarea>
        </div>
      </div>
    </div>`;
}

// ── Debrief detail view ────────────────────────────────────────────────

function renderDebriefDetail(d, job) {
  const coachBusy  = state.ui.coachBusy  || false;
  const emailBusy  = state.ui.emailBusy  || false;
  const coachError = state.ui.coachError || '';
  const emailError = state.ui.emailError || '';

  const energyLabels = {
    'very-interested':'🔥 Very interested',
    'interested':'✓ Interested',
    'neutral':'😐 Hard to read',
    'uncertain':'⚠️ Seemed uncertain',
    'not-interested':'❌ Not interested'
  };
  const milLabels = {
    'strong':'💪 Strong — they got it immediately',
    'neutral':'😐 Neutral — no reaction either way',
    'confused':'❓ Confused — needed a lot of translation',
    'awkward':'😬 Awkward — worked against me'
  };

  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-weight:700;font-size:16px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">
            ${esc(DEBRIEF_STAGES.find(s=>s.id===d.stage)?.label||d.stage||'Interview')}
          </div>
          <div style="font-size:12px;color:var(--muted)">
            ${d.date ? new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : ''}
            ${d.format ? ` · ${DEBRIEF_FORMATS.find(f=>f.id===d.format)?.label||d.format}` : ''}
            ${d.duration ? ` · ${esc(d.duration)}` : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="toggleUI('activeDebriefId',null)" class="btn btn-secondary btn-sm">← Back</button>
          <button onclick="deleteDebrief('${job.id}','${d.id}')" class="btn btn-danger btn-sm">Delete</button>
        </div>
      </div>

      <!-- Summary chips -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${d.energyRead ? `<span style="background:var(--gold-light);color:var(--gold);border:1px solid var(--gold);border-radius:2px;padding:3px 10px;font-size:12px;font-weight:600">${energyLabels[d.energyRead]||d.energyRead}</span>` : ''}
        ${d.militaryLanding ? `<span style="background:var(--accent-light);color:var(--accent);border:1px solid #c0cfe0;border-radius:2px;padding:3px 10px;font-size:12px;font-weight:600">${milLabels[d.militaryLanding]||d.militaryLanding}</span>` : ''}
        ${d.interviewers?.filter(i=>i.name).map(i=>`<span style="background:var(--paper-dark);color:var(--muted);border-radius:2px;padding:3px 10px;font-size:12px">${esc(i.name)}${i.title?` · ${esc(i.title)}`:''}</span>`).join('') || ''}
      </div>

      <!-- Questions -->
      ${d.questions?.length ? `
      <div class="card" style="margin-bottom:12px">
        <h2>Questions & Answers</h2>
        ${d.questions.map((q,i) => q.question ? `
          <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--rule)">
            <div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:8px">"${esc(q.question)}"</div>
            ${q.myAnswer ? `
            <div style="margin-bottom:6px">
              <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:3px">What I said</div>
              <div style="font-size:13px;color:var(--text);background:var(--paper);padding:8px;border-radius:2px">${esc(q.myAnswer)}</div>
            </div>` : ''}
            ${q.betterAnswer ? `
            <div>
              <div style="font-size:10px;font-weight:700;color:var(--green);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:3px">Better answer</div>
              <div style="font-size:13px;color:var(--text);background:var(--green-light);padding:8px;border-radius:2px;border-left:3px solid var(--green)">${esc(q.betterAnswer)}</div>
            </div>` : ''}
          </div>` : '').join('')}
      </div>` : ''}

      <!-- Notes summary -->
      ${(d.strongMoments||d.weakMoments||d.rawNotes||d.militaryNotes) ? `
      <div class="card" style="margin-bottom:12px">
        <h2>Interview Notes</h2>
        ${d.strongMoments ? `<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">Strong moments</div><div style="font-size:13px;color:var(--text)">${esc(d.strongMoments)}</div></div>` : ''}
        ${d.weakMoments ? `<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">Weak moments</div><div style="font-size:13px;color:var(--text)">${esc(d.weakMoments)}</div></div>` : ''}
        ${d.militaryNotes ? `<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">Military translation</div><div style="font-size:13px;color:var(--text)">${esc(d.militaryNotes)}</div></div>` : ''}
        ${d.rawNotes ? `<div><div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">Raw notes</div><div style="font-size:13px;color:var(--text);white-space:pre-line">${esc(d.rawNotes)}</div></div>` : ''}
      </div>` : ''}

      <!-- Claude coaching -->
      <div class="card" style="margin-bottom:12px;border-left:4px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
          <h2 style="margin:0">🤖 Claude Coaching</h2>
          <button class="btn btn-primary btn-sm" onclick="generateCoaching('${job.id}','${d.id}')" ${coachBusy?'disabled':''}>
            ${coachBusy?'<div class="spinner"></div> Analyzing...':d.claudeCoaching?'🔄 Regenerate':'Get Coaching'}
          </button>
        </div>
        ${coachError ? `<div style="color:var(--red);font-size:13px;margin-bottom:8px">${esc(coachError)}</div>` : ''}
        ${d.claudeCoaching ? `
        <div style="font-size:13px;color:var(--text);line-height:1.8;white-space:pre-line">${esc(d.claudeCoaching)}</div>` : `
        <div style="font-size:13px;color:var(--muted);font-style:italic">
          Claude will analyze your questions, answers, energy read, and military translation notes — then give you specific coaching for the next round or next application.
        </div>`}
      </div>

      <!-- Thank-you email -->
      <div class="card" style="border-left:4px solid var(--green)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
          <div>
            <h2 style="margin:0">✉️ Thank-You Email</h2>
            <p style="font-size:12px;color:var(--muted);margin:4px 0 0">Personalized — references something real from the conversation</p>
          </div>
          <div style="display:flex;gap:6px">
            ${d.thankYouEmail ? `<button class="btn btn-secondary btn-sm" onclick="copyThankYou('${d.id}')">📋 Copy</button>` : ''}
            <button class="btn btn-primary btn-sm" onclick="generateThankYou('${job.id}','${d.id}')" ${emailBusy?'disabled':''} style="background:var(--green)">
              ${emailBusy?'<div class="spinner"></div> Writing...':d.thankYouEmail?'🔄 Regenerate':'Generate Email'}
            </button>
          </div>
        </div>
        ${emailError ? `<div style="color:var(--red);font-size:13px;margin-bottom:8px">${esc(emailError)}</div>` : ''}
        ${d.thankYouEmail ? `
        <div id="ty-email-${d.id}" style="font-size:13px;color:var(--text);line-height:1.8;white-space:pre-line;background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:16px;font-family:'Lora',serif">${esc(d.thankYouEmail)}</div>` : `
        <div style="font-size:13px;color:var(--muted);font-style:italic">
          Not a generic "thank you for your time" — Claude writes a specific email that references something real from your interview. Send within 24 hours.
        </div>`}
      </div>
    </div>`;
}

// ── CRUD ───────────────────────────────────────────────────────────────

function saveDebrief(jobId) {
  const date     = document.getElementById('db-date')?.value;
  const format   = document.getElementById('db-format')?.value   || 'video';
  const stage    = document.getElementById('db-stage')?.value    || 'first-round';
  const duration = document.getElementById('db-duration')?.value?.trim() || '';

  // Collect interviewers
  const interviewers = [];
  let ivIdx = 0;
  while (document.getElementById(`db-iv-name-${ivIdx}`)) {
    const name  = document.getElementById(`db-iv-name-${ivIdx}`)?.value?.trim()  || '';
    const title = document.getElementById(`db-iv-title-${ivIdx}`)?.value?.trim() || '';
    if (name || title) interviewers.push({ name, title });
    ivIdx++;
  }

  // Collect questions
  const questions = [];
  let qIdx = 0;
  while (document.getElementById(`dbq-q-${qIdx}`)) {
    const question   = document.getElementById(`dbq-q-${qIdx}`)?.value?.trim()      || '';
    const myAnswer   = document.getElementById(`dbq-mine-${qIdx}`)?.value?.trim()   || '';
    const betterAnswer = document.getElementById(`dbq-better-${qIdx}`)?.value?.trim() || '';
    if (question || myAnswer) questions.push({ question, myAnswer, betterAnswer });
    qIdx++;
  }

  const debrief = {
    id:              'db_' + Date.now(),
    date,
    format,
    stage,
    duration,
    interviewers,
    questions,
    militaryLanding: document.getElementById('db-mil-landing')?.value || 'neutral',
    energyRead:      document.getElementById('db-energy')?.value      || 'interested',
    militaryNotes:   document.getElementById('db-mil-notes')?.value?.trim() || '',
    strongMoments:   document.getElementById('db-strong')?.value?.trim()   || '',
    weakMoments:     document.getElementById('db-weak')?.value?.trim()     || '',
    rawNotes:        document.getElementById('db-notes')?.value?.trim()    || '',
    claudeCoaching:  null,
    thankYouEmail:   null,
    createdAt:       new Date().toISOString()
  };

  // Save to job
  const updatedJobs = state.jobs.map(j => {
    if (j.id !== jobId) return j;
    const now = new Date().toISOString();
    const log = [...(j.activityLog||[]), {
      date: now, type: 'note',
      note: `Interview logged: ${DEBRIEF_STAGES.find(s=>s.id===stage)?.label||stage} · ${format}`
    }];
    return { ...j, debriefs: [...(j.debriefs||[]), debrief], activityLog: log };
  });

  setState({
    jobs: updatedJobs,
    ui: { ...state.ui, debriefAdding: false, debriefDraft: {}, activeDebriefId: debrief.id }
  });
  showToast('✓ Interview logged');
}

function deleteDebrief(jobId, debriefId) {
  if (!confirm('Delete this debrief?')) return;
  const updatedJobs = state.jobs.map(j =>
    j.id === jobId
      ? { ...j, debriefs: (j.debriefs||[]).filter(d => d.id !== debriefId) }
      : j
  );
  setState({ jobs: updatedJobs, ui: { ...state.ui, activeDebriefId: null } });
  showToast('Debrief deleted');
}

// ── Dynamic form helpers ───────────────────────────────────────────────

function addInterviewer() {
  const draft = state.ui.debriefDraft || {};
  const ivs   = [...(draft.interviewers||[{ name:'', title:'' }]), { name:'', title:'' }];
  setState({ ui: { ...state.ui, debriefDraft: { ...draft, interviewers: ivs } } }, false);
  const container = document.getElementById('db-interviewers');
  if (container) {
    const i = ivs.length - 1;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
    div.innerHTML = `
      <input id="db-iv-name-${i}" placeholder="Name" style="flex:1;padding:8px 12px;border:1px solid var(--rule-dark);border-radius:2px;font-size:13px;font-family:'Lora',serif;background:var(--paper)">
      <input id="db-iv-title-${i}" placeholder="Title / Role" style="flex:1;padding:8px 12px;border:1px solid var(--rule-dark);border-radius:2px;font-size:13px;font-family:'Lora',serif;background:var(--paper)">
      <button onclick="this.parentElement.remove()" class="btn btn-danger btn-sm" style="flex-shrink:0">✕</button>`;
    container.appendChild(div);
  }
}

function removeInterviewer(idx) {
  const draft = state.ui.debriefDraft || {};
  const ivs   = (draft.interviewers||[]).filter((_,i) => i !== idx);
  setState({ ui: { ...state.ui, debriefDraft: { ...draft, interviewers: ivs } } });
}

function addDebriefQuestion() {
  const draft = state.ui.debriefDraft || {};
  const qs    = [...(draft.questions||[{ question:'', myAnswer:'', betterAnswer:'' }]), { question:'', myAnswer:'', betterAnswer:'' }];
  setState({ ui: { ...state.ui, debriefDraft: { ...draft, questions: qs } } }, false);
  const container = document.getElementById('db-questions');
  if (container) {
    const i   = qs.length - 1;
    const div = document.createElement('div');
    div.id = `dbq-row-${i}`;
    div.style.cssText = 'background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:12px;margin-bottom:10px';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:11px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.06em">Question ${i+1}</div>
        <button onclick="this.closest('[id^=dbq-row]').remove()" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:12px">✕ Remove</button>
      </div>
      <div class="field"><label class="field-label">What they asked</label>
        <input id="dbq-q-${i}" placeholder="e.g., Tell me about a time you led through ambiguity..." style="font-size:13px">
      </div>
      <div class="grid2">
        <div class="field" style="margin-bottom:0"><label class="field-label">What I said</label>
          <textarea id="dbq-mine-${i}" rows="2" placeholder="Your actual answer..." style="font-size:13px"></textarea>
        </div>
        <div class="field" style="margin-bottom:0"><label class="field-label">What I wish I'd said</label>
          <textarea id="dbq-better-${i}" rows="2" placeholder="Better answer..." style="font-size:13px"></textarea>
        </div>
      </div>`;
    container.appendChild(div);
  }
}

function removeDebriefQuestion(idx) {
  const row = document.getElementById(`dbq-row-${idx}`);
  if (row) row.remove();
}

// ── AI functions ───────────────────────────────────────────────────────

async function generateCoaching(jobId, debriefId) {
  const job     = state.jobs.find(j => j.id === jobId);
  const debrief = job?.debriefs?.find(d => d.id === debriefId);
  if (!job || !debrief) return;

  setState({ ui: { ...state.ui, coachBusy: true, coachError: '' } });

  const p   = state.profile;
  const qText = (debrief.questions||[])
    .filter(q => q.question)
    .map((q, i) => `Q${i+1}: "${q.question}"\nMy answer: ${q.myAnswer||'(not recorded)'}\nBetter answer: ${q.betterAnswer||'(none noted)'}`)
    .join('\n\n');

  try {
    const coaching = await callClaude(
      `You are a senior executive coach who specializes in military-to-civilian transition. You give direct, specific post-interview coaching — not generic advice. You read between the lines of interview notes to identify what the hiring team was actually evaluating and where the veteran can improve their presentation.`,
      `Give specific post-interview coaching for this veteran.

VETERAN: ${p.branch||'Military'} | ${p.rank||'N/A'} | ${p.yearsOfService||'N/A'} years
JOB: ${job.title} at ${job.company}

INTERVIEW DETAILS:
Stage: ${DEBRIEF_STAGES.find(s=>s.id===debrief.stage)?.label||debrief.stage}
Format: ${DEBRIEF_FORMATS.find(f=>f.id===debrief.format)?.label||debrief.format}
Interviewers: ${debrief.interviewers?.filter(i=>i.name).map(i=>`${i.name} (${i.title||'?'})`).join(', ')||'Not recorded'}
Energy read: ${debrief.energyRead||'Not recorded'}
Military landing: ${debrief.militaryLanding||'Not recorded'}

QUESTIONS & ANSWERS:
${qText||'None recorded'}

STRONG MOMENTS: ${debrief.strongMoments||'None noted'}
WEAK MOMENTS: ${debrief.weakMoments||'None noted'}
MILITARY TRANSLATION NOTES: ${debrief.militaryNotes||'None'}
RAW NOTES: ${debrief.rawNotes||'None'}

Write specific post-interview coaching in plain text. Cover:
1. OVERALL READ — What does this interview signal about where they stand?
2. WHAT LANDED — What specific things worked well and should be repeated
3. WHAT MISSED — What specific things fell flat and how to fix them
4. MILITARY TRANSLATION — Did it land? What to adjust for the next round
5. PREP FOR ROUND 2 — If there's a next round, what will they likely probe deeper on
6. ACTION ITEMS — 2-3 specific things to do before the next interaction

Be direct. Be specific. Reference actual details from their notes.
No generic advice. No "great job overall" padding.`
    );

    const updatedJobs = state.jobs.map(j =>
      j.id === jobId
        ? { ...j, debriefs: j.debriefs.map(d => d.id === debriefId ? { ...d, claudeCoaching: coaching } : d) }
        : j
    );
    setState({ jobs: updatedJobs, ui: { ...state.ui, coachBusy: false, coachError: '' } });
    if (typeof trackAction === 'function') trackAction('debrief_coach');
    showToast('✓ Coaching generated');
  } catch(err) {
    setState({ ui: { ...state.ui, coachBusy: false, coachError: err.message } });
  }
}

async function generateThankYou(jobId, debriefId) {
  const job     = state.jobs.find(j => j.id === jobId);
  const debrief = job?.debriefs?.find(d => d.id === debriefId);
  if (!job || !debrief) return;

  setState({ ui: { ...state.ui, emailBusy: true, emailError: '' } });

  const p = state.profile;
  const interviewerName = debrief.interviewers?.find(i=>i.name)?.name || 'Hiring Manager';

  try {
    const email = await callClaude(
      `You write thank-you emails for veterans after job interviews. The emails are warm, professional, and specific — they reference something real from the conversation. They are NOT generic. They do NOT say "thank you for your time and consideration" as the opening. They are 100-150 words, no more.`,
      `Write a post-interview thank-you email for this veteran.

VETERAN: ${p.fullName||'[Name]'} | ${p.branch||'Military'} veteran
JOB: ${job.title} at ${job.company}
INTERVIEWER: ${interviewerName}
STAGE: ${DEBRIEF_STAGES.find(s=>s.id===debrief.stage)?.label||debrief.stage}
DATE: ${debrief.date||'recently'}

INTERVIEW NOTES:
Strong moments: ${debrief.strongMoments||'none noted'}
Topics discussed: ${debrief.rawNotes||'none noted'}
Questions asked: ${(debrief.questions||[]).filter(q=>q.question).map(q=>q.question).join(' | ')||'none recorded'}

RULES:
- Open with something specific from the interview — NOT "thank you for your time"
- Reference one specific topic, insight, or moment from the conversation
- Reinforce their strongest qualification for this specific role in one sentence
- Close with a confident, specific next step (not "I look forward to hearing from you")
- Include subject line
- Sign with name, phone, email placeholders
- 100-150 words total
- Plain text only — no bullets, no formatting

Format:
Subject: [subject line]

[email body]

${p.fullName||'[Your Name]'}
${p.phone||'[Phone]'}
${p.email||'[Email]'}`
    );

    const updatedJobs = state.jobs.map(j =>
      j.id === jobId
        ? { ...j, debriefs: j.debriefs.map(d => d.id === debriefId ? { ...d, thankYouEmail: email } : d) }
        : j
    );
    setState({ jobs: updatedJobs, ui: { ...state.ui, emailBusy: false, emailError: '' } });
    if (typeof trackAction === 'function') trackAction('debrief_email');
    showToast('✓ Thank-you email generated');
  } catch(err) {
    setState({ ui: { ...state.ui, emailBusy: false, emailError: err.message } });
  }
}

function copyThankYou(debriefId) {
  const el   = document.getElementById(`ty-email-${debriefId}`);
  const text = el?.innerText || '';
  navigator.clipboard.writeText(text)
    .then(() => showToast('✓ Email copied — paste into your email client'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('✓ Copied');
    });
}
