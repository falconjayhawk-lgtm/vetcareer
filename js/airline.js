// ── airline.js — Phase 2: Airline Resume Generator ───────────────────
// Provides:
//   renderAirlineMode()         — config UI (called from resume.js)
//   renderAirlineResumeResult() — formatted output (called from resume.js)
//   generateAirlineResume()     — generation logic
//   downloadAirlineResume()     — Word export
//   printAirlineResume()        — print / PDF
// ──────────────────────────────────────────────────────────────────────

// ── Airline-specific state helpers ────────────────────────────────────

function getAirlineProfile() {
  return state.profile.airlineProfile || {
    instructor: '',   // additional hours not in pilot.js
    evaluator:  '',
    passport:   false,
    targetAirlines: '',
    notes: ''
  };
}

function saveAirlineProfile() {
  const ap = {
    instructor:     document.getElementById('al-instructor')?.value     || '',
    evaluator:      document.getElementById('al-evaluator')?.value      || '',
    passport:       document.getElementById('al-passport')?.checked     || false,
    targetAirlines: document.getElementById('al-airlines')?.value       || '',
    notes:          document.getElementById('al-notes')?.value          || ''
  };
  state.profile = { ...state.profile, airlineProfile: ap };
  try { localStorage.setItem('vc_profile', JSON.stringify(state.profile)); } catch(e) {}
  return ap;
}

// ── Airline mode UI ───────────────────────────────────────────────────

function renderAirlineMode() {
  const ap      = getAirlineProfile();
  const certs   = getPilotCerts ? getPilotCerts() : (state.profile.pilotCerts || {});
  const fh      = (typeof getFlightHours === 'function') ? getFlightHours() : (state.flightHours || {});
  const combined = (typeof calcCombinedHours === 'function') ? calcCombinedHours() : {};
  const busy    = state.ui.resumeBusy || false;
  const airlineOn = typeof isAirlinePath === 'function' ? isAirlinePath() : false;

  // Warn if airline path not active / profile incomplete
  if (!airlineOn) {
    return `
      <div style="background:var(--gold-light);border:2px solid var(--gold);border-radius:2px;padding:20px;text-align:center">
        <div style="font-size:28px;margin-bottom:8px">✈️</div>
        <div style="font-weight:700;font-size:15px;color:var(--accent);margin-bottom:8px">Activate Airline Path First</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:16px">Go to your Profile, scroll down to Career Paths, and activate the ✈️ Airline path to unlock this resume type.</div>
        <button class="btn btn-primary" onclick="setState({view:'profile'})">Go to Profile</button>
      </div>`;
  }

  const hasCerts   = certs.atp || certs.commercial;
  const hasHours   = combined.total > 0 || fh.military?.total;
  const missingItems = [];
  if (!hasCerts)  missingItems.push('FAA certificates (ATP, Commercial)');
  if (!hasHours)  missingItems.push('Flight hours (military or civilian)');
  if (!state.profile.fullName) missingItems.push('Your name in Profile');

  return `
    ${missingItems.length ? `
    <div style="background:#fffbeb;border:1px solid var(--gold);border-radius:2px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#92400e">
      ⚠️ <strong>Missing data that will appear blank in the resume:</strong> ${missingItems.join(', ')}.
      <button onclick="setState({view:'profile'})" style="background:none;border:none;color:var(--accent);font-weight:700;cursor:pointer;padding:0;margin-left:4px;font-size:13px">Fill in Profile →</button>
    </div>` : ''}

    <!-- Data preview — shows what will populate the resume -->
    <div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:14px 16px;margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;color:var(--green);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:10px">✓ Data Pre-Loaded from Your Profile</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--muted)">
        <div><strong style="color:var(--text)">Certificates:</strong> ${[certs.atp&&'ATP', certs.commercial&&'Commercial', certs.cfi&&'CFI', certs.cfii&&'CFII'].filter(Boolean).join(', ')||'None entered'}</div>
        <div><strong style="color:var(--text)">Type Ratings:</strong> ${certs.typeRatings||'None entered'}</div>
        <div><strong style="color:var(--text)">Medical:</strong> ${certs.faaClass ? `${certs.faaClass}${certs.faaExpiry?' exp '+certs.faaExpiry:''}` : 'Not entered'}</div>
        <div><strong style="color:var(--text)">Total Hours:</strong> ${combined.total>0 ? combined.total.toLocaleString() : (fh.military?.total||'Not entered')}</div>
        <div><strong style="color:var(--text)">PIC:</strong> ${combined.pic>0 ? combined.pic.toLocaleString() : (fh.military?.pic||'Not entered')}</div>
        <div><strong style="color:var(--text)">Instrument:</strong> ${combined.instrument>0 ? combined.instrument.toLocaleString() : (fh.military?.instrument||'Not entered')}</div>
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--green)">Update flight hours and certificates in your <button onclick="setState({view:'profile'})" style="background:none;border:none;color:var(--accent);font-weight:700;cursor:pointer;padding:0;font-size:11px">Profile → Airline section</button></div>
    </div>

    <!-- Additional fields needed for airline format -->
    <div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;margin-bottom:10px">Additional Hours (for Airline Resume Table)</div>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Instructor Hours</label>
          <input type="number" id="al-instructor" value="${esc(ap.instructor)}" placeholder="0" min="0" step="0.1" style="font-size:14px">
          <div style="font-size:11px;color:var(--dim);margin-top:2px">Time spent instructing other pilots</div>
        </div>
        <div class="field">
          <label class="field-label">Evaluator Hours</label>
          <input type="number" id="al-evaluator" value="${esc(ap.evaluator)}" placeholder="0" min="0" step="0.1" style="font-size:14px">
          <div style="font-size:11px;color:var(--dim);margin-top:2px">Check rides given, Stan/Eval time</div>
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-bottom:14px">
        <input type="checkbox" id="al-passport" ${ap.passport?'checked':''} style="width:auto;accent-color:var(--accent)">
        <span>I hold a valid U.S. Passport</span>
      </label>
    </div>

    <!-- Target airline and notes -->
    <div class="grid2" style="margin-bottom:16px">
      <div class="field">
        <label class="field-label">Target Airline(s) — optional</label>
        <input id="al-airlines" value="${esc(ap.targetAirlines)}" placeholder="United, Delta, FedEx..." style="font-size:13px">
        <div style="font-size:11px;color:var(--dim);margin-top:2px">Claude will tailor the experience framing for this carrier type</div>
      </div>
      <div class="field">
        <label class="field-label">Special Instructions — optional</label>
        <input id="al-notes" value="${esc(ap.notes)}" placeholder="Emphasize international experience, highlight jet time..." style="font-size:13px">
      </div>
    </div>

    <div style="background:var(--accent-light);border:1px solid #c0cfe0;border-radius:2px;padding:10px 14px;font-size:12px;color:var(--accent);margin-bottom:16px">
      ✈️ <strong>Airline resume format:</strong> No cover letter · Flight time table at top · Lean experience entries · Aviation terminology kept — airlines know what it means
    </div>

    <button class="btn btn-primary" onclick="generateAirlineResume()" ${busy?'disabled':''} style="padding:12px 24px">
      ${busy?'<div class="spinner"></div> Building...':'✈️ Generate Airline Resume'}
    </button>

    ${busy ? `
    <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:16px;margin-top:12px">
      <div style="font-weight:700;color:var(--accent);font-size:13px;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em">🤖 BUILDING YOUR AIRLINE RESUME...</div>
      <div style="font-size:12px;color:var(--muted);margin-top:6px">Writing experience section in airline format · Takes 15–25 seconds</div>
    </div>` : ''}`;
}

// ── Result renderer ───────────────────────────────────────────────────

function renderAirlineResumeResult(result) {
  if (!result || !result.isAirline) return '';
  return `
    <div class="card" style="border-left:4px solid var(--accent)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">✈️ Airline Resume</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">Standard airline pilot format · No cover letter · Download and submit directly</p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="copyResumeToClipboard()">📋 Copy Text</button>
          <button class="btn btn-secondary btn-sm" onclick="downloadAirlineResume()">📥 Download .docx</button>
          <button class="btn btn-primary btn-sm" onclick="printAirlineResume()">🖨 Print / PDF</button>
        </div>
      </div>
      <p style="font-size:12px;color:var(--muted);margin:0 0 12px">
        Print → Save as PDF in the print dialog · Or download as Word to make edits first
      </p>
      <div class="resume-preview" id="resume-text-output" style="font-family:Arial,sans-serif">
        ${esc(result.resume)}
      </div>
    </div>`;
}

// ── Generation function ───────────────────────────────────────────────

async function generateAirlineResume() {
  const ap      = saveAirlineProfile();
  const p       = state.profile;
  const certs   = getPilotCerts ? getPilotCerts() : (p.pilotCerts || {});
  const fh      = (typeof getFlightHours === 'function') ? getFlightHours() : (state.flightHours || { military:{}, civilian:[] });
  const combined = (typeof calcCombinedHours === 'function') ? calcCombinedHours() : {};

  if (!p.fullName) { showToast('Add your name to Profile first', false); return; }

  setState({ ui: { ...state.ui, resumeBusy: true, resumeStatus: 'Building airline resume...', resumeResult: null, resumeError: '' } });

  try {
    // ── Build the non-AI sections directly from data ──────────────────

    const name = normalizeAirlineName(p.fullName);

    // Contact line
    const contact = [p.location, p.phone, p.email].filter(Boolean).join('    ');

    // Licenses & Ratings block
    const licenseLines = [];

    if (certs.atp) {
      const typeRatings = certs.typeRatings ? ', ' + certs.typeRatings : '';
      licenseLines.push(`Airline Transport Pilot — Airplane Multiengine Land${typeRatings}`);
    } else if (certs.commercial) {
      licenseLines.push('Commercial Pilot Certificate — Airplane Multiengine Land');
    }

    if (certs.cfii) licenseLines.push('Flight Instructor — Multiengine, Instrument Airplane');
    else if (certs.cfi) licenseLines.push('Flight Instructor — Airplane');

    if (certs.faaClass) {
      const expiry = certs.faaExpiry ? ` — expires ${certs.faaExpiry}` : '';
      const limit  = 'No limitations';
      licenseLines.push(`FAA ${certs.faaClass} Medical — ${limit}${expiry}`);
    }

    if (certs.fcc)   licenseLines.push('FCC Restricted Radiotelephone Operator Permit');
    if (ap.passport) licenseLines.push('U.S. Passport');

    // Flight time table — two rows matching airline standard format
    const n = (v) => v > 0 ? Number(v).toLocaleString() : (v || '0');
    const milTotal    = parseFloat(fh.military?.total    || 0);
    const civTotal    = (fh.civilian||[]).reduce((s,e) => s+(parseFloat(e.hours)||0), 0);
    const totalTime   = combined.total   || milTotal + civTotal;
    const picTime     = combined.pic     || parseFloat(fh.military?.pic        || 0);
    const instTime    = combined.instrument || parseFloat(fh.military?.instrument || 0);
    const instrHours  = parseFloat(ap.instructor || fh.military?.instructor || 0);
    const evalHours   = parseFloat(ap.evaluator  || fh.military?.evaluator  || 0);

    // Aircraft list for experience context
    const aircraftByType = fh.military?.byAircraft || [];
    const civAircraft    = (fh.civilian||[]).map(e => ({ type: e.aircraft, hours: e.hours, turbine: e.turbine, multiEngine: e.multiEngine }));
    const allAircraft    = [...aircraftByType, ...civAircraft];

    // Education — parse from profile
    const education = p.education || '';
    const training  = p.training  || '';
    const awards    = state.awards || [];

    // ── AI generates the experience section ──────────────────────────

    const expText = [...state.assignments]
      .sort((a,b) => new Date(b.startDate||0) - new Date(a.startDate||0))
      .map(a => `${a.dutyTitle||''}${a.rank?' ('+a.rank+')':''}  |  ${a.unit||''}  |  ${a.base||''}  |  ${a.startDate||'?'} – ${a.endDate||'Present'}\n${(a.accomplishments||'').slice(0,400)}`)
      .join('\n---\n');

    const civJobsText = (state.civilianJobs||[])
      .sort((a,b) => new Date(b.startDate||0) - new Date(a.startDate||0))
      .map(j => `CIVILIAN: ${j.title||''} at ${j.company||''}  |  ${j.location||''}  |  ${j.startDate||'?'} – ${j.endDate||'Present'}\n${(j.accomplishments||'').slice(0,300)}`)
      .join('\n---\n');

    const aircraftContext = allAircraft.length
      ? allAircraft.map(a => `${a.type}: ${Number(a.hours).toLocaleString()} hrs`).join(', ')
      : 'Not specified';

    const targetContext = ap.targetAirlines
      ? `Target airline(s): ${ap.targetAirlines}. Tailor experience framing toward this type of operation.`
      : '';

    const experienceRaw = await callClaude(
      `You are an expert at writing airline pilot resumes. Your job is to write the EXPERIENCE section only.

AIRLINE RESUME DOCTRINE — follow without exception:
- Airlines know aviation. Keep military terminology (B-52, Weapons School, AOC, evaluator, etc.) — no civilian translation needed
- Format each employer as a single header line, then roles beneath it
- Employer header: [ORGANIZATION NAME] — [Aircraft/Type] — [Location]    [Date range]
- Each role: one line only. No bullets. No metrics. Just title and date range
- Most recent positions first within each employer block
- If the veteran flew for a civilian airline (UPS, FedEx, Southwest, etc.), list that as a separate employer block
- Keep the entire section under 25 lines total
- No summary, no objective, no "responsible for"
- ${targetContext}
- Return ONLY the formatted experience text. No headers, no preamble.`,

      `Write the EXPERIENCE section for this pilot's airline resume.

MILITARY ASSIGNMENTS:
${expText || 'None'}

CIVILIAN AVIATION JOBS:
${civJobsText || 'None'}

AIRCRAFT FLOWN: ${aircraftContext}
PRIMARY AIRCRAFT: ${fh.military?.byAircraft?.[0]?.type || 'B-52H'}
TOTAL HOURS: ${n(totalTime)}    INSTRUCTOR HOURS: ${n(instrHours)}    EVALUATOR HOURS: ${n(evalHours)}

${ap.notes ? `SPECIAL INSTRUCTIONS: ${ap.notes}` : ''}

Format each block as:
UNITED STATES AIR FORCE — B-52H — Various USAF Bases    May 2003–Present
Oct 20–Present: Commander, B-52 Formal Training Unit
Jun 17–Nov 19: Director of Operations, 96th Bomb Squadron
[etc.]

Keep it tight. Airlines read dozens of these. Brevity is professional.`
    );

    // ── Assemble the complete resume ──────────────────────────────────

    const divider = '─'.repeat(72);

    const licBlock = licenseLines.length
      ? `LICENSES & RATINGS:\n${licenseLines.map(l => '  ' + l).join('\n')}`
      : 'LICENSES & RATINGS:\n  [Add FAA certificates in Profile → Airline section]';

    const ftRow1 = `  TOTAL TIME: ${n(totalTime)}    MILITARY: ${n(milTotal)}    PIC/PRIMARY: ${n(picTime)}`;
    const ftRow2 = `  INSTRUMENT: ${n(instTime)}    INSTRUCTOR: ${n(instrHours)}    EVALUATOR: ${n(evalHours)}`;
    const flightBlock = `FLIGHT TIME:\n${ftRow1}\n${ftRow2}`;

    const expBlock = `EXPERIENCE:\n\n${experienceRaw.trim()}`;

    const eduBlock = education
      ? `EDUCATION:\n${education.split('\n').map(l => '  ' + l.trim()).filter(Boolean).join('\n')}`
      : '';

    const trainBlock = training
      ? `TRAINING:\n${training.split('\n').map(l => '  ' + l.trim()).filter(Boolean).join('\n')}`
      : '';

    const achBlock = awards.length
      ? `ACHIEVEMENTS:\n${awards.map(a => `  ${a.name}${a.date ? ',  ' + a.date : ''}`).join('\n')}`
      : '';

    const sections = [licBlock, flightBlock, expBlock, eduBlock, trainBlock, achBlock]
      .filter(Boolean)
      .join('\n\n' + divider + '\n\n');

    const resume = [
      name,
      contact,
      '',
      divider,
      '',
      sections
    ].join('\n');

    setState({
      ui: {
        ...state.ui,
        resumeBusy: false,
        resumeStatus: '',
        resumeResult: { resume, isAirline: true },
        resumeModal: false,
        resumeError: ''
      }
    });

    if (typeof trackAction === 'function') trackAction('resume_generate');
    showToast('✈️ Airline resume ready!');

  } catch(err) {
    setState({ ui: { ...state.ui, resumeBusy: false, resumeStatus: '', resumeError: 'Error: ' + err.message } });
  }
}

// ── Name normalization (airline resumes often use ALL CAPS name) ───────

function normalizeAirlineName(raw) {
  if (!raw) return '[NAME]';
  const commaMatch = raw.match(/^([^,]+),\s*(.+)$/);
  if (commaMatch) {
    const last  = commaMatch[1].trim();
    const first = commaMatch[2].trim().split(/\s+/)[0];
    raw = `${first} ${last}`;
  }
  // Capitalize properly
  return raw.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .replace(/\b[A-Z]{1}\b/g, m => m); // keep initials
}

// ── Print ─────────────────────────────────────────────────────────────

function printAirlineResume() {
  const text = state.ui.resumeResult?.resume || document.getElementById('resume-text-output')?.innerText || '';
  if (!text) { showToast('No resume to print', false); return; }

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
<html><head>
<title>Airline Resume</title>
<style>
  @page { margin: 0.85in; size: letter; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #000;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  /* Name line — larger and bold */
  body > pre:first-child { display: none; }
</style>
</head><body>
<pre style="font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.45;white-space:pre-wrap;margin:0">${
  text
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    // Bold the name (first line)
    .replace(/^(.+)/, '<strong style="font-size:14pt">$1</strong>')
    // Bold section headers (ALL CAPS lines followed by colon)
    .replace(/^([A-Z &\/]+:)$/gm, '<strong>$1</strong>')
}</pre>
</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
}

// ── Word download ─────────────────────────────────────────────────────

async function downloadAirlineResume() {
  const text = state.ui.resumeResult?.resume || document.getElementById('resume-text-output')?.innerText || '';
  if (!text) { showToast('No resume to download', false); return; }

  showToast('Building document...', true);
  try {
    await loadJSZip();
    const name = (state.profile?.fullName || 'Airline_Resume').replace(/\s+/g, '_').replace(/,/g,'');
    // Re-use the existing letter docx builder — airline resume is plain text formatted
    const blob = await buildLetterDocx(text, 'Airline Resume');
    saveAs(blob, `Airline_Resume_${name}.docx`);
    showToast('✓ Airline resume downloaded');
  } catch(err) {
    showToast('Export failed — try Print → Save as PDF instead', false);
    console.error('Airline resume export error:', err);
  }
}
