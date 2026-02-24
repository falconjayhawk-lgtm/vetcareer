// ── Networking Emails ─────────────────────────────────────────────────
function renderNetwork() {
  const busy = state.ui.networkBusy||false;
  const result = state.ui.networkResult||null;
  const error = state.ui.networkError||'';
  const jobs = state.jobs;
  const jobOptions = jobs.map(j=>`<option value="${j.id}">${esc(j.title)} — ${esc(j.company)}</option>`).join('');
  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">📬 Networking Emails</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Generate targeted outreach emails — cold contact, referral requests, informational interviews, or reconnecting with old contacts. Written from your actual background, not a template.</p>
    
    <div class="card">
      <h2>Configure Your Outreach</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Email Type *</label>
          <select id="net-type" onchange="toggleUI('networkType',this.value)">
            <option value="cold-contact" ${(state.ui.networkType||'cold-contact')==='cold-contact'?'selected':''}>Cold contact — someone you don't know at a target company</option>
            <option value="referral-request" ${(state.ui.networkType||'')==='referral-request'?'selected':''}>Referral request — asking a connection to refer you</option>
            <option value="info-interview" ${(state.ui.networkType||'')==='info-interview'?'selected':''}>Informational interview request</option>
            <option value="reconnect" ${(state.ui.networkType||'')==='reconnect'?'selected':''}>Reconnecting with an old colleague / contact</option>
            <option value="follow-up" ${(state.ui.networkType||'')==='follow-up'?'selected':''}>Follow-up after applying or meeting someone</option>
            <option value="thank-you" ${(state.ui.networkType||'')==='thank-you'?'selected':''}>Post-interview thank you</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Link to a Job (optional)</label>
          <select id="net-job">
            <option value="">No specific job — general outreach</option>${jobOptions}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Recipient Name</label>
          <input id="net-name" placeholder="John Smith" value="${esc(state.ui.networkName||'')}">
        </div>
        <div class="field">
          <label class="field-label">Recipient Title / Role</label>
          <input id="net-title" placeholder="VP of Business Development, Hiring Manager, Recruiter..." value="${esc(state.ui.networkTitle||'')}">
        </div>
        <div class="field">
          <label class="field-label">Their Company</label>
          <input id="net-company" placeholder="Leidos, Anduril, Booz Allen..." value="${esc(state.ui.networkCompany||'')}">
        </div>
        <div class="field">
          <label class="field-label">Connection / Context</label>
          <input id="net-context" placeholder="Met at a conference, mutual connection Jane Doe, applied online last week..." value="${esc(state.ui.networkContext||'')}">
        </div>
      </div>
      <div class="field">
        <label class="field-label">Key point you want to make in this email</label>
        <input id="net-point" placeholder="Emphasize my TS/SCI, mention our shared SOCOM background, reference the Palantir contract..." value="${esc(state.ui.networkPoint||'')}">
      </div>
      <button class="btn btn-primary" onclick="generateNetworkEmail()" ${busy?'disabled':''} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Writing...':'📬 Generate Email'}
      </button>
      ${busy?`<div style="background:#eff6ff;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#1e40af;display:flex;align-items:center;gap:10px"><div class="spinner"></div> Writing your outreach email...</div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>
    ${result?`
    <div class="card" style="border-left:4px solid #2563eb">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div><h2 style="margin:0">Your Email</h2>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Edit as needed before sending — make it sound like you</p></div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="copySection('net-email-output')">📋 Copy</button>
          <button class="btn btn-secondary btn-sm" onclick="toggleUI('networkResult',null)">Clear</button>
        </div>
      </div>
      ${result.subject?`<div style="background:#f3f4f6;border-radius:6px;padding:8px 12px;font-size:13px;margin-bottom:10px"><strong>Subject:</strong> ${esc(result.subject)}</div>`:''}
      <div id="net-email-output" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:13px;line-height:1.8;white-space:pre-line">${esc(result.body||'')}</div>
      ${result.followUpTip?`<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-top:12px;font-size:13px;color:#92400e"><strong>💡 Follow-up tip:</strong> ${esc(result.followUpTip)}</div>`:''}
      ${result.alternativeSubject?`<div style="font-size:12px;color:#6b7280;margin-top:8px"><strong>Alternative subject line:</strong> ${esc(result.alternativeSubject)}</div>`:''}
    </div>`:''}`;
}

async function generateNetworkEmail() {
    const type = document.getElementById('net-type')?.value||'cold-contact';
  const selJob = document.getElementById('net-job')?.value||'';
  const name = document.getElementById('net-name')?.value?.trim()||'';
  const title = document.getElementById('net-title')?.value?.trim()||'';
  const company = document.getElementById('net-company')?.value?.trim()||'';
  const context = document.getElementById('net-context')?.value?.trim()||'';
  const point = document.getElementById('net-point')?.value?.trim()||'';
  toggleUI('networkName',name); toggleUI('networkTitle',title); toggleUI('networkCompany',company); toggleUI('networkContext',context); toggleUI('networkPoint',point);
  const job = selJob ? state.jobs.find(j=>j.id===selJob) : null;
  setState({ ui:{...state.ui, networkBusy:true, networkError:'', networkResult:null} });
  const p = state.profile;
  const topExp = state.assignments.slice(0,2).map(a=>`${a.dutyTitle} at ${a.base||''}: ${(a.accomplishments||'').slice(0,200)}`).join(' | ');
  try {
    const raw = await callClaude(
      `You are a career coach who writes networking emails for military veterans. Your emails get replies because they sound like a real person wrote them — specific, confident, brief, and respectful of the recipient's time. You never write generic templates. You never use: "I hope this email finds you well", "I am reaching out to...", "I wanted to touch base", "synergy", "leverage", "circle back", "I am passionate about", or any other hollow opener. Every email opens with something specific and interesting.`,
      `Write a ${type} networking email for this veteran.

VETERAN:
Name: ${p.fullName||'[Veteran]'} | Branch: ${p.branch} | Rank: ${p.rank} | Years: ${p.yearsOfService}
Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Location: ${p.location||'N/A'}
Recent experience: ${topExp||'Military service'}
Key skills: ${[...(p.technicalSkills||[]),(p.softSkills||[])].slice(0,6).join(', ')||'N/A'}

RECIPIENT:
Name: ${name||'[Name]'} | Title: ${title||'Not specified'} | Company: ${company||'Target company'}
Context/Connection: ${context||'Cold outreach'}
${job?`TARGET JOB: ${job.title} at ${job.company} — ${job.notes||'no specific notes'}`:''}
KEY POINT TO MAKE: ${point||'General interest in the company / connection'}

EMAIL RULES:
- Under 150 words for cold/reconnect emails. Up to 200 for referral requests.
- Open with something specific — a shared connection, a recent company news item, a specific program, or a direct statement of who you are
- One clear ask — not multiple questions
- Sound like the veteran wrote it themselves, not a PR department
- If clearance is active, mention it naturally if relevant to the recipient/company
- No attachments mentioned unless it's a follow-up type

Return ONLY this JSON:
{
  "subject": "Email subject line — specific and compelling, under 50 chars",
  "alternativeSubject": "A second subject line option with different angle",
  "body": "The full email body — plain text, no markdown. Sign off with veteran's name.",
  "followUpTip": "One specific tip on when and how to follow up if no response"
}`, 'network');
    let result;
    try { result = extractJSON(raw); } catch(e) { throw new Error('Could not parse result. Try again.'); }
    setState({ ui:{...state.ui, networkBusy:false, networkResult:result} });
    showToast('✓ Email generated!');
  } catch(err) {
    setState({ ui:{...state.ui, networkBusy:false, networkError:err.message} });
  }
}

