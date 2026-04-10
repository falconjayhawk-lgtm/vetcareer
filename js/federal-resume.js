// ── federal-resume.js — USAJOBS Federal Resume Generator ──────────────
//
// A real federal resume is NOT a civilian resume with different formatting.
// Key differences:
//   - 4-6 pages, verbose by design — brevity is penalized
//   - Hours per week and salary required for EVERY position
//   - Supervisor name/phone and permission-to-contact for every role
//   - Detailed duties in paragraph form, not bullets
//   - Keywords must match the job announcement almost verbatim
//   - Veteran's preference and citizenship stated explicitly
//   - KSA (Knowledge, Skills, Abilities) narratives for announcement keywords
//   - GS pay grade equivalent noted where applicable
//
// ──────────────────────────────────────────────────────────────────────

// ── Config UI ─────────────────────────────────────────────────────────

function renderFederalResumeMode() {
  const busy   = state.ui.fedResumeBusy   || false;
  const result = state.ui.fedResumeResult || null;
  const error  = state.ui.fedResumeError  || '';
  const cfg    = state.ui.fedResumeCfg    || {};
  const p      = state.profile;

  // Check what data we have to work with
  const hasAssignments = state.assignments.length > 0;
  const hasProfile     = !!(p.fullName && p.branch);

  return `
    <!-- What makes federal resumes different -->
    <div class="card" style="border-left:4px solid var(--accent);background:var(--accent-light)">
      <div style="display:flex;align-items:start;gap:12px">
        <span style="font-size:22px;flex-shrink:0">🏛️</span>
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;margin-bottom:6px">Federal resumes are different — here's what that means</div>
          <div style="font-size:13px;color:var(--text);line-height:1.7">
            USAJOBS uses automated screening before a human ever reads your application. The system scans for keywords from the job announcement — if they're not in your resume verbatim, you're screened out regardless of your qualifications.<br><br>
            Federal resumes are also intentionally long. 4-6 pages is normal. You must include hours per week, supervisor name and contact, and salary for <strong>every position</strong>. Veteran's preference (10-point or 5-point) is stated explicitly and can move you to the top of the cert list.
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Configure Federal Resume</h2>

      <!-- Job announcement paste -->
      <div class="field">
        <label class="field-label">USAJOBS Job Announcement *</label>
        <textarea id="fed-announcement" rows="6"
          placeholder="Paste the full job announcement text here — especially the Duties and Qualifications sections. Claude will extract the required keywords and tailor your resume to match them exactly."
          style="font-size:13px">${esc(cfg.announcement||'')}</textarea>
        <div style="font-size:11px;color:var(--dim);margin-top:3px">The more of the announcement you paste, the better Claude can match keywords. At minimum paste the Duties, Qualifications, and Required/Desired Skills sections.</div>
      </div>

      <div class="grid2">
        <div class="field">
          <label class="field-label">Target Series / Grade</label>
          <input id="fed-series" value="${esc(cfg.series||'')}"
            placeholder="e.g., GS-0343-13, GS-0080-12, SES, GS-2210-14">
          <div style="font-size:10px;color:var(--dim);margin-top:2px">Find this in the announcement header — e.g. "0343-13/14"</div>
        </div>
        <div class="field">
          <label class="field-label">Agency / Office</label>
          <input id="fed-agency" value="${esc(cfg.agency||'')}"
            placeholder="e.g., Department of Defense, DHS, VA, Air Force">
        </div>
        <div class="field">
          <label class="field-label">Announcement Number</label>
          <input id="fed-announcement-num" value="${esc(cfg.announcementNum||'')}"
            placeholder="e.g., DE-12345678-24-ABC">
        </div>
        <div class="field">
          <label class="field-label">Position Location</label>
          <input id="fed-pos-location" value="${esc(cfg.posLocation||p.location||'')}"
            placeholder="Pentagon, VA / Remote / Multiple Locations">
        </div>
      </div>

      <!-- Veteran preference -->
      <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:14px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;color:var(--gold);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:12px">🎖️ Veteran's Preference</div>
        <div class="grid2">
          <div class="field" style="margin-bottom:0">
            <label class="field-label">Preference Type</label>
            <select id="fed-vet-pref">
              <option value="10-point-disabled" ${(cfg.vetPref||'10-point-disabled')==='10-point-disabled'?'selected':''}>10-Point — Service-Connected Disability</option>
              <option value="10-point-derived"  ${cfg.vetPref==='10-point-derived' ?'selected':''}>10-Point — Derived Preference (spouse/widow)</option>
              <option value="5-point"            ${cfg.vetPref==='5-point'          ?'selected':''}>5-Point — Honorable Discharge</option>
              <option value="none"               ${cfg.vetPref==='none'             ?'selected':''}>No Preference / Not Applicable</option>
            </select>
          </div>
          <div class="field" style="margin-bottom:0">
            <label class="field-label">Character of Discharge</label>
            <select id="fed-discharge">
              <option value="Honorable"          ${(cfg.discharge||'Honorable')==='Honorable'?'selected':''}>Honorable</option>
              <option value="General"            ${cfg.discharge==='General'       ?'selected':''}>General (Under Honorable Conditions)</option>
              <option value="Other"              ${cfg.discharge==='Other'         ?'selected':''}>Other Than Honorable</option>
            </select>
          </div>
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--gold)">
          10-point preference moves you to the top of the certified list. 5-point adds 5 points to your score. Both require documentation (DD-214).
        </div>
      </div>

      <!-- Additional federal-specific fields -->
      <div class="grid2">
        <div class="field">
          <label class="field-label">Citizenship</label>
          <select id="fed-citizenship">
            <option value="U.S. Citizen" ${(cfg.citizenship||'U.S. Citizen')==='U.S. Citizen'?'selected':''}>U.S. Citizen</option>
            <option value="U.S. National" ${cfg.citizenship==='U.S. National'?'selected':''}>U.S. National</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Highest Federal Civilian Grade (if any)</label>
          <input id="fed-highest-grade" value="${esc(cfg.highestGrade||'')}"
            placeholder="e.g., GS-13, N/A if none">
        </div>
        <div class="field">
          <label class="field-label">Resume Focus</label>
          <select id="fed-focus">
            <option value="leadership"     ${(cfg.focus||'leadership')==='leadership'?'selected':''}>Leadership & Management</option>
            <option value="technical"      ${cfg.focus==='technical'     ?'selected':''}>Technical / Specialist</option>
            <option value="program-mgmt"   ${cfg.focus==='program-mgmt'  ?'selected':''}>Program / Project Management</option>
            <option value="operations"     ${cfg.focus==='operations'    ?'selected':''}>Operations</option>
            <option value="intelligence"   ${cfg.focus==='intelligence'  ?'selected':''}>Intelligence</option>
            <option value="it-cyber"       ${cfg.focus==='it-cyber'      ?'selected':''}>IT / Cybersecurity</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Number of KSA Narratives to Generate</label>
          <select id="fed-ksa-count">
            <option value="3">3 KSAs — standard</option>
            <option value="5" selected>5 KSAs — thorough</option>
            <option value="7">7 KSAs — comprehensive</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="field-label">Special Instructions</label>
        <input id="fed-instructions" value="${esc(cfg.instructions||'')}"
          placeholder="e.g., emphasize cyber background, lead with joint experience, highlight GS-equivalent grades...">
      </div>

      ${!hasProfile || !hasAssignments ? `
      <div style="background:var(--red-light);border:1px solid #e8c0c0;border-radius:2px;padding:12px;margin-bottom:14px;font-size:13px;color:var(--red)">
        ⚠️ ${!hasProfile ? 'Complete your Profile first. ' : ''}${!hasAssignments ? 'Add at least one assignment in Experience. ' : ''}Federal resumes require detailed position information from your background.
      </div>` : ''}

      <button class="btn btn-primary" onclick="generateFederalResume()" ${busy||(!hasProfile||!hasAssignments)?'disabled':''} style="padding:12px 24px">
        ${busy ? '<div class="spinner"></div> Building Federal Resume...' : '🏛️ Generate USAJOBS Federal Resume'}
      </button>

      ${busy ? `
      <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:14px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;margin-bottom:8px">🤖 BUILDING YOUR FEDERAL RESUME...</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.7">
          Extracting job announcement keywords · Writing detailed duty descriptions ·
          Generating KSA narratives · Formatting for USAJOBS compliance<br>
          <strong>This takes 30-45 seconds</strong> — federal resumes require significantly more content than civilian resumes.
        </div>
      </div>` : ''}

      ${error ? `<div style="background:var(--red-light);border:1px solid #e8c0c0;border-radius:2px;padding:12px;margin-top:12px;font-size:13px;color:var(--red)">${esc(error)}</div>` : ''}
    </div>

    ${result ? renderFederalResumeResult(result) : ''}`;
}

// ── Result renderer ────────────────────────────────────────────────────

function renderFederalResumeResult(result) {
  if (!result || !result.isFederal) return '';

  return `
    <!-- Keywords matched -->
    ${result.keywordsMatched?.length ? `
    <div class="card" style="border-left:4px solid var(--green)">
      <h2>🎯 Keywords Matched to Announcement</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 12px">These terms from the job announcement are woven into your resume. USAJOBS automated screening looks for these specifically.</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${result.keywordsMatched.map(k => `<span style="background:var(--green-light);color:var(--green);border:1px solid #c8e6cd;border-radius:2px;padding:3px 10px;font-size:12px;font-weight:600;font-family:'Familjen Grotesk',sans-serif">${esc(k)}</span>`).join('')}
      </div>
    </div>` : ''}

    <!-- The resume -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">🏛️ Federal Resume — USAJOBS Format</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">
            4-6 pages is correct for federal resumes — do not shorten it.
            Copy into USAJOBS resume builder or paste into Word and upload as attachment.
          </p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="copyFederalResume()">📋 Copy Text</button>
          <button class="btn btn-secondary btn-sm" onclick="downloadFederalResume()">📥 Download .docx</button>
          <button class="btn btn-primary btn-sm" onclick="printFederalResume()">🖨 Print / PDF</button>
        </div>
      </div>

      <!-- USAJOBS paste tip -->
      <div style="background:var(--accent-light);border:1px solid #c0cfe0;border-radius:2px;padding:10px 14px;font-size:12px;color:var(--accent);margin-bottom:16px">
        💡 <strong>How to use:</strong> On USAJOBS, go to <strong>Documents → Upload Resume</strong> and upload the Word file.
        Or use <strong>Build Resume</strong> and copy-paste each section into the appropriate fields.
        Fill in supervisor names, phone numbers, and exact salary figures before submitting.
      </div>

      <div id="fed-resume-output" style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:20px;font-family:Georgia,serif;font-size:11pt;line-height:1.7;white-space:pre-wrap;color:var(--text)">${esc(result.resume)}</div>
    </div>

    <!-- KSA narratives -->
    ${result.ksas?.length ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">📝 KSA Narratives</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">Knowledge, Skills, and Abilities responses — paste these into the USAJOBS questionnaire or essay fields.</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="copyAllKSAs()">📋 Copy All KSAs</button>
      </div>
    </div>
    ${result.ksas.map((ksa, i) => `
    <div class="card" style="border-left:4px solid var(--accent)">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;gap:8px">
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif">KSA ${i+1}</div>
          <div style="font-weight:700;font-size:14px;color:var(--accent);margin-top:2px">${esc(ksa.title||'')}</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="copyKSA(${i})" style="flex-shrink:0">📋 Copy</button>
      </div>
      <div id="ksa-text-${i}" style="font-size:13px;color:var(--text);line-height:1.75;white-space:pre-wrap;background:var(--paper);border-radius:2px;padding:12px">${esc(ksa.narrative||'')}</div>
      ${ksa.wordCount ? `<div style="font-size:11px;color:var(--dim);margin-top:6px">${ksa.wordCount} words</div>` : ''}
    </div>`).join('')}` : ''}

    <!-- Submission checklist -->
    <div class="card" style="background:var(--gold-light);border:1px solid var(--gold)">
      <h2>✅ Before You Submit</h2>
      <div style="font-size:13px;color:var(--text);line-height:1.8">
        ${[
          'Fill in supervisor names and phone numbers for every position',
          'Verify hours per week for each role (40 hrs/week standard)',
          'Add exact salary figures — military: use base pay + BAH + BAS',
          'Upload your DD-214 as supporting documentation',
          'If claiming 10-point preference, also upload your VA disability letter',
          'Answer all self-assessment questionnaire items — rate yourself accurately (not modestly)',
          'Submit before the closing date — USAJOBS closes at 11:59 PM Eastern',
          'Save the announcement number — you\'ll need it to track your application'
        ].map(item => `
          <div style="display:flex;align-items:start;gap:8px;margin-bottom:6px">
            <div style="width:16px;height:16px;border:1.5px solid var(--gold);border-radius:2px;flex-shrink:0;margin-top:2px"></div>
            <span>${item}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── Generator ──────────────────────────────────────────────────────────

async function generateFederalResume() {
  // Read DOM values
  const announcement    = document.getElementById('fed-announcement')?.value?.trim()     || '';
  const series          = document.getElementById('fed-series')?.value?.trim()           || '';
  const agency          = document.getElementById('fed-agency')?.value?.trim()           || '';
  const announcementNum = document.getElementById('fed-announcement-num')?.value?.trim() || '';
  const posLocation     = document.getElementById('fed-pos-location')?.value?.trim()     || '';
  const vetPref         = document.getElementById('fed-vet-pref')?.value                 || '10-point-disabled';
  const discharge       = document.getElementById('fed-discharge')?.value                || 'Honorable';
  const citizenship     = document.getElementById('fed-citizenship')?.value              || 'U.S. Citizen';
  const highestGrade    = document.getElementById('fed-highest-grade')?.value?.trim()    || '';
  const focus           = document.getElementById('fed-focus')?.value                    || 'leadership';
  const ksaCount        = parseInt(document.getElementById('fed-ksa-count')?.value       || '5');
  const instructions    = document.getElementById('fed-instructions')?.value?.trim()     || '';

  if (!announcement) { showToast('Paste the job announcement first', false); return; }

  const cfg = { announcement, series, agency, announcementNum, posLocation, vetPref, discharge, citizenship, highestGrade, focus, ksaCount, instructions };
  setState({ ui: { ...state.ui, fedResumeBusy: true, fedResumeError: '', fedResumeResult: null, fedResumeCfg: cfg } });

  const p = state.profile;

  // Build detailed experience for federal format
  const expText = state.assignments
    .sort((a,b) => new Date(b.startDate||0) - new Date(a.startDate||0))
    .map(a => `
POSITION: ${a.dutyTitle||'Unknown'}
EMPLOYER: United States ${p.branch||'Military'}
UNIT/OFFICE: ${a.unit||'Not specified'}
LOCATION: ${a.base||'Not specified'}, USA
START: ${a.startDate||'?'} | END: ${a.endDate||'Present'}
HOURS/WEEK: 40 (estimated — verify)
SALARY: [INSERT FROM LES]
SUPERVISOR: [INSERT NAME AND PHONE]
MAY CONTACT: Yes
ACCOMPLISHMENTS: ${(a.accomplishments||'').slice(0,600)}
DESCRIPTION: ${(a.description||a.civilianSummary||'').slice(0,400)}`).join('\n\n---\n\n');

  const civText = state.civilianJobs.length > 0
    ? state.civilianJobs.sort((a,b) => new Date(b.startDate||0) - new Date(a.startDate||0))
        .map(j => `
POSITION: ${j.title||'Unknown'}
EMPLOYER: ${j.company||'Unknown'}
LOCATION: ${j.location||'Unknown'}
START: ${j.startDate||'?'} | END: ${j.endDate||'Present'}
HOURS/WEEK: 40 (verify)
SALARY: ${j.salaryRange||'[INSERT]'}
SUPERVISOR: [INSERT NAME AND PHONE]
MAY CONTACT: Yes
ACCOMPLISHMENTS: ${(j.accomplishments||'').slice(0,400)}`).join('\n\n---\n\n')
    : '';

  const achievementsCtx = typeof buildAchievementsContext === 'function'
    ? buildAchievementsContext(8)
    : '';

  try {
    const raw = await callClaude(
      `You are a federal resume expert with 20 years of experience writing USAJOBS applications for transitioning military veterans. You know exactly how federal HR specialists and automated systems screen resumes. You write federal resumes that are detailed, keyword-rich, and formatted precisely to USAJOBS standards.

FEDERAL RESUME DOCTRINE — non-negotiable:
1. VERBOSITY IS REQUIRED. Federal resumes are 4-6 pages. Write full paragraphs for duties, not bullets.
2. KEYWORD MATCHING. Extract exact phrases from the job announcement and use them verbatim in duties descriptions.
3. EVERY POSITION must include: start/end dates (MM/YYYY), hours per week, salary (use [INSERT FROM LES] for military), supervisor name placeholder, and may-we-contact field.
4. DUTIES are written as dense paragraphs describing what the person actually did — minimum 150 words per position.
5. VETERAN'S PREFERENCE must be explicitly stated in the header.
6. ACCOMPLISHMENTS are woven into duties paragraphs, not listed separately.
7. GS EQUIVALENT GRADES — translate military grades to GS equivalents where applicable (O-1 to O-3 ≈ GS-7 to GS-11, O-4 to O-5 ≈ GS-12 to GS-13, O-6 ≈ GS-14 to GS-15).
8. RETURN ONLY JSON. No markdown.`,

      `Generate a complete USAJOBS federal resume for this veteran.

VETERAN PROFILE:
Name: ${p.fullName||'[NAME]'}
Address: ${p.location||'[CITY, STATE ZIP]'}
Phone: ${p.phone||'[PHONE]'}
Email: ${p.email||'[EMAIL]'}
Citizenship: ${citizenship}
Veteran's Preference: ${vetPref} | Discharge: ${discharge}
Branch: ${p.branch||'N/A'} | Rank: ${p.rank||'N/A'} | Years: ${p.yearsOfService||'N/A'}
MOS/Rate: ${p.mosRate||'N/A'}
Security Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Highest Federal Grade: ${highestGrade||'N/A'}
Education: ${p.education||'N/A'}
Certifications: ${p.certifications||'N/A'}
Training: ${p.training||'N/A'}
Technical Skills: ${(p.technicalSkills||[]).join(', ')||'N/A'}

TARGET POSITION:
Agency: ${agency||'[AGENCY]'}
Series/Grade: ${series||'[SERIES-GRADE]'}
Announcement: ${announcementNum||'[ANNOUNCEMENT NUMBER]'}
Location: ${posLocation}
Focus Area: ${focus}

JOB ANNOUNCEMENT:
${announcement}

MILITARY EXPERIENCE:
${expText||'[No assignments entered]'}

CIVILIAN EXPERIENCE:
${civText||'None'}
${achievementsCtx}

INSTRUCTIONS: ${instructions||'None'}

Return ONLY this JSON (no markdown):
{
  "isFederal": true,
  "keywordsMatched": ["array of 8-15 specific keywords extracted from the announcement that are woven into the resume"],
  "resume": "The complete federal resume as plain text. Include ALL of these sections in order:\\n\\n1. PERSONAL INFORMATION\\n   Name, address, phone, email, citizenship, veteran preference, clearance\\n\\n2. OBJECTIVE / SUMMARY\\n   2-3 sentences targeting the specific announcement\\n\\n3. WORK EXPERIENCE (most recent first)\\n   For EACH position:\\n   Job Title | Pay Plan/Series/Grade (GS equivalent)\\n   Employer | City, State, Country\\n   From: MM/YYYY To: MM/YYYY | Hours per week: 40\\n   Salary: $XX,XXX per year [or INSERT FROM LES]\\n   Supervisor: [NAME] | Phone: [PHONE] | May Contact: Yes\\n   \\n   Duties: [Dense paragraph, minimum 150 words, uses exact keywords from announcement verbatim, describes scope, scale, responsibilities in detail]\\n   \\n   Key Accomplishments: [2-3 specific accomplishments with metrics, woven into or following the duties paragraph]\\n\\n4. EDUCATION\\n   Degree, Institution, City State, Month Year\\n   GPA if above 3.0, relevant coursework\\n\\n5. MILITARY SERVICE SUMMARY\\n   Branch, Highest Grade, Dates, Character of Discharge\\n   Key qualifications and specialized training\\n\\n6. TRAINING & PROFESSIONAL DEVELOPMENT\\n   Relevant courses, PME, professional development\\n\\n7. SKILLS\\n   Computer/Technical skills, language proficiencies, security clearances\\n\\n8. AWARDS & HONORS\\n   Military decorations with brief civilian-language descriptions",
  "ksas": [
    {
      "title": "KSA title extracted from the announcement",
      "narrative": "250-350 word narrative using the CCAR format (Context, Challenge, Action, Result). First person. Specific, with metrics. References actual experience. Directly addresses the KSA as stated in the announcement.",
      "wordCount": 300
    }
  ]
}`
    );

    let result;
    try {
      result = typeof extractJSON === 'function'
        ? extractJSON(raw)
        : JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) {
      throw new Error('Could not parse results. The announcement may be very long — try shortening it and try again.');
    }

    setState({ ui: { ...state.ui, fedResumeBusy: false, fedResumeResult: result } });
    if (typeof trackAction === 'function') trackAction('resume_generate');
    showToast('🏛️ Federal resume ready — scroll down to review');
  } catch(err) {
    setState({ ui: { ...state.ui, fedResumeBusy: false, fedResumeError: err.message } });
  }
}

// ── Copy / export helpers ──────────────────────────────────────────────

function copyFederalResume() {
  const text = document.getElementById('fed-resume-output')?.innerText || '';
  navigator.clipboard.writeText(text)
    .then(() => showToast('✓ Federal resume copied'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('✓ Copied');
    });
}

function copyKSA(index) {
  const el = document.getElementById(`ksa-text-${index}`);
  const text = el?.innerText || '';
  navigator.clipboard.writeText(text)
    .then(() => showToast(`✓ KSA ${index + 1} copied`))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('✓ Copied');
    });
}

function copyAllKSAs() {
  const result = state.ui.fedResumeResult;
  if (!result?.ksas?.length) { showToast('No KSAs to copy', false); return; }
  const text = result.ksas.map((k, i) =>
    `KSA ${i + 1}: ${k.title}\n\n${k.narrative}`
  ).join('\n\n' + '─'.repeat(60) + '\n\n');
  navigator.clipboard.writeText(text)
    .then(() => showToast(`✓ All ${result.ksas.length} KSAs copied`))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('✓ Copied');
    });
}

function printFederalResume() {
  const text = state.ui.fedResumeResult?.resume || document.getElementById('fed-resume-output')?.innerText || '';
  if (!text) { showToast('No resume to print', false); return; }
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
<html><head>
<title>Federal Resume — USAJOBS</title>
<style>
  @page { margin: 1in; size: letter; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #000;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  @media print { body { margin: 0; } }
</style>
</head><body><pre style="font-family:Georgia,serif;font-size:11pt;line-height:1.7;white-space:pre-wrap;margin:0">${
    text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }</pre></body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
}

async function downloadFederalResume() {
  const text = state.ui.fedResumeResult?.resume || document.getElementById('fed-resume-output')?.innerText || '';
  if (!text) { showToast('No resume to download', false); return; }
  showToast('Building document...', true);
  try {
    await loadJSZip();
    const name = (state.profile?.fullName || 'Federal_Resume').replace(/\s+/g, '_').replace(/,/g,'');
    const blob = await buildLetterDocx(text, 'Federal Resume — USAJOBS');
    saveAs(blob, `Federal_Resume_${name}.docx`);
    showToast('✓ Federal resume downloaded');
  } catch(err) {
    showToast('Export failed — try Print → Save as PDF instead', false);
  }
}
