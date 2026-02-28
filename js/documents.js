// ── Documents ─────────────────────────────────────────────────────────
function renderDocuments() {
  const busy = state.ui.docBusy || false;
  const status = state.ui.docStatus || '';
  const result = state.ui.docResult || null;
  const error = state.ui.docError || '';

  // Document type options — generic names covering all service branches
  const DOC_TYPES = [
    'DD-214 (Discharge Document)',
    'Annual Performance Report',
    'Award / Decoration Citation',
    'Civilian Resume',
    'Letter of Recommendation',
    'Training / Course Certificate',
    'Other'
  ];

  const docList = state.documents.map(d=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;background:white">
      <div>
        <div style="font-weight:600;font-size:14px">📄 ${esc(d.name)}</div>
        <div style="font-size:12px;color:#6b7280">${esc(d.type)} · ${new Date(d.uploadDate).toLocaleDateString()}</div>
        ${d.processed ? '<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600;margin-top:4px;display:inline-block">✓ AI Processed</span>' : ''}
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeDoc('${d.id}')">✕</button>
    </div>`).join('');

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <h1 style="font-size:24px;font-weight:800;margin:0">📤 Upload Documents</h1>
      ${state.documents.length === 0 ? `<span style="background:#22c55e;color:white;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700">STEP 1 — START HERE</span>` : ''}
    </div>
    ${state.documents.length === 0 ? `
    <div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:12px;padding:16px;margin-bottom:20px">
      <div style="font-weight:700;color:#1e40af;font-size:15px;margin-bottom:8px">👋 Welcome! Start by uploading your documents</div>
      <div style="font-size:13px;color:#1e40af;line-height:1.6">
        <strong>The fastest way to get started:</strong> Upload your DD-214, performance reports, or civilian resume. Claude will read them and automatically fill in your profile, assignments, and skills. You can then review and fill any gaps.<br><br>
        <strong>Don't have documents?</strong> That's okay — you can skip to Profile and fill everything in manually.
      </div>
    </div>` : ''}
    <p style="font-size:13px;color:#6b7280;margin:0 0 16px">Upload your DD-214, performance reports, award citations, civilian resumes — Claude reads them and auto-fills your profile and experience.</p>

    <!-- PII / Privacy notice -->
    <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:16px 18px;margin-bottom:20px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div style="font-size:22px;flex-shrink:0">🔒</div>
        <div>
          <div style="font-weight:800;color:#15803d;font-size:14px;margin-bottom:6px">Your documents are never stored — here's exactly what happens</div>
          <div style="font-size:13px;color:#166534;line-height:1.65">
            <strong>1.</strong> Your file is read in your browser and sent to Claude for analysis.<br>
            <strong>2.</strong> Claude extracts career data only — duty titles, dates, assignments, awards.<br>
            <strong>3.</strong> That structured data is saved to your profile. <strong>The original file is discarded immediately.</strong><br>
            <strong>4.</strong> We never store, sell, or share your documents or PII.
          </div>
          <div style="margin-top:10px;padding:8px 12px;background:rgba(255,255,255,0.6);border-radius:7px;font-size:12px;color:#166534">
            💡 <strong>Recommended:</strong> Before uploading your DD-214, consider redacting Box 3 (SSN) and Box 5 (DOB) with a PDF editor or marker — Tactics 2 Talent only needs your career history, not those fields. Questions? See the <button onclick="setState({view:'faq'})" style="background:none;border:none;color:#15803d;font-weight:700;cursor:pointer;padding:0;font-size:12px;text-decoration:underline">Help & FAQ</button> page.
          </div>
        </div>
      </div>
    </div>

    <!-- Upload card -->
    <div class="card">
      <h2>Upload & Extract with AI</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Document Type *</label>
          <select id="d-type">
            <option value="">Select type...</option>
            ${DOC_TYPES.map(t=>`<option>${t}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">File <span style="color:#dc2626">*</span> — PDF only recommended</label>
          <input type="file" id="d-file" accept=".pdf" style="padding:6px;font-size:13px">
          <div style="font-size:11px;color:#9ca3af;margin-top:3px">PDF format required for best results. Image files (JPG/PNG) may produce errors.</div>
        </div>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:13px;color:#1e40af;margin-bottom:14px">
        💡 <strong>What happens:</strong> Claude reads your document and automatically extracts your assignments, rank, dates, awards, and accomplishments — then adds them directly to your Experience page.
      </div>
      <button class="btn btn-primary" onclick="processUpload()" ${busy  ? 'disabled' : ''}>
        ${busy ? `<div class="spinner"></div> ${esc(status)}` : '🤖 Upload & Extract with AI'}
      </button>
    </div>

    <!-- Result card -->
    ${result ? `
    <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:20px;margin-bottom:20px">
      <div style="font-weight:700;color:#16a34a;font-size:16px;margin-bottom:10px">✅ Extraction Complete!</div>
      <div style="white-space:pre-line;font-size:13px;color:#374151;line-height:1.7;margin-bottom:14px">${esc(result)}</div>
      <button class="btn btn-primary btn-sm" onclick="setState({view:'experience'})">→ Review Your Experience Page</button>
    </div>` : ''}

    ${error ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:#dc2626">${esc(error)}</div>` : ''}

    <!-- Paste fallback -->
    <div class="card">
      <h2>Or Paste Document Text</h2>
      <p style="font-size:13px;color:#6b7280;margin:-8px 0 14px">Can't upload a file? Paste the text content here instead.</p>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Document Type *</label>
          <select id="dp-type">
            <option value="">Select type...</option>
            ${DOC_TYPES.map(t=>`<option>${t}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Document Name</label>
          <input id="dp-name" placeholder="e.g., FY2023 Performance Report">
        </div>
      </div>
      <div class="field">
        <label class="field-label">Paste Document Text Here</label>
        <textarea id="dp-content" rows="10" placeholder="Paste the full text from your document..."></textarea>
      </div>
      <button class="btn btn-primary" onclick="processPastedDoc()" ${state.ui.pasteBusy ? 'disabled' : ''}>
        ${state.ui.pasteBusy ? `<div class="spinner"></div> ${esc(state.ui.pasteStatus||'Processing...')}` : '🤖 Extract with AI'}
      </button>
    </div>

    <!-- Uploaded docs list -->
    <div class="card">
      <h2>Uploaded Documents (${state.documents.length})</h2>
      ${state.documents.length === 0 ? '<p style="color:#9ca3af;font-size:14px;text-align:center;padding:20px">No documents yet. Start with your DD-214 — it will auto-fill most of your profile.</p>' : docList}
    </div>`;
}

// ── Document processing ───────────────────────────────────────────────

function buildExtractionPrompt(docType) {
  if (docType.includes('DD-214')) return `Extract from this DD-214 and return ONLY this JSON (no markdown, no extra text):
{
  "docType": "DD-214",
  "profile": {
    "fullName": "", "branch": "", "rank": "", "mosRate": "",
    "yearsOfService": "", "separationDate": "", "characterOfService": "", "clearance": ""
  },
  "assignments": [
    { "base":"", "unit":"", "dutyTitle":"", "rank":"", "startDate":"", "endDate":"",
      "location":"", "description":"role description in civilian terms",
      "accomplishments":"bullet points with metrics", "civilianSummary":"" }
  ],
  "awards": [
    { "name":"", "date":"", "citation":"", "civilianTranslation":"business impact translation" }
  ],
  "education": "",
  "summary": "Plain English summary of what was extracted and added to the profile"
}`;

  if (docType.includes('Performance')) return `Extract from this military performance evaluation and return ONLY this JSON:
{
  "docType": "evaluation",
  "assignment": {
    "dutyTitle":"", "rank":"", "unit":"", "base":"", "startDate":"", "endDate":"", "location":"",
    "description": "civilian-friendly role description",
    "accomplishments": "extracted bullet points translated to civilian language with metrics and outcomes",
    "civilianSummary": "2-3 sentence civilian summary of performance and achievements"
  },
  "keyAccomplishments": ["list of key accomplishments with metrics"],
  "awards": [],
  "summary": "Plain English summary of what was extracted"
}`;

  if (docType.includes('Award') || docType.includes('Decoration')) return `Extract from this award citation and return ONLY this JSON:
{
  "docType": "award",
  "award": {
    "name": "", "date": "",
    "citation": "full citation text",
    "civilianTranslation": "translate to civilian business impact — what was accomplished, what metrics, what outcome?"
  },
  "summary": "Plain English summary of what was extracted"
}`;

  if (docType.includes('Civilian Resume')) return `Extract from this civilian resume and return ONLY this JSON (no markdown, no extra text):

CRITICAL RULE: Classify jobs carefully based on BOTH the employer AND the job title format:
- If the employer is a military branch (U.S. Air Force, U.S. Army, Navy, Marines, Coast Guard, Space Force) AND the job title uses military jargon or rank-based titles (e.g., "Flight Commander", "Squadron Commander", "Operations Officer") → put in "militaryRoles"
- If the employer is a Reserve or National Guard unit (Air Force Reserve, Army Reserve, Air National Guard, Army National Guard, etc.) AND the job title is already civilian-style (e.g., "Director", "Manager", "Analyst", "Program Lead") → put in "civilianJobs" — these are real professional roles performed by part-time military members
- If the employer is a military unit but the person clearly held a civilian-titled role with business-style accomplishments → put in "civilianJobs"
- Only truly civilian employers (private companies, government contractors, federal agencies as a civilian employee) AND Reserve/Guard roles with civilian titles go in "civilianJobs"

{
  "docType": "civilianResume",
  "profile": {
    "fullName": "", "email": "", "phone": "", "location": ""
  },
  "civilianJobs": [
    {
      "company": "civilian employer only — never a military branch",
      "title": "", "location": "", "startDate": "", "endDate": "",
      "description": "role description",
      "accomplishments": "bullet points with metrics — extract all achievement bullets"
    }
  ],
  "militaryRoles": [
    {
      "note": "These were military service entries found in the document — already captured in military assignments, do not duplicate",
      "employer": "", "title": "", "startDate": "", "endDate": ""
    }
  ],
  "skills": {
    "technical": ["list of technical skills mentioned"],
    "soft": ["list of leadership/soft skills mentioned"]
  },
  "education": "degree(s) and institution(s)",
  "certifications": "certifications listed",
  "summary": "Plain English summary of what was extracted and added"
}`;

  return `Extract all military career information from this document and return ONLY this JSON:
{
  "docType": "${docType}",
  "profile": {}, "assignments": [], "awards": [], "education": "",
  "summary": "Plain English summary of what was extracted"
}`;
}

async function applyExtraction(rawJson, docType, fileName) {
  let data;
  try {
    const cleaned = rawJson.replace(/```json|```/g, '').trim();
    // Find JSON object in response in case there's extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    data = JSON.parse(jsonMatch[0]);
  } catch(e) {
    throw new Error('Could not parse AI response. Try again or use the paste option.');
  }

  const newAssignments = [...state.assignments];
  const newCivilianJobs = [...state.civilianJobs];
  const newAwards = [...state.awards];
  let profileUpdates = {};

  // Apply profile fields (from DD-214 or civilian resume)
  if (data.profile) {
    const p = data.profile;
    const profileFields = ['fullName','branch','rank','mosRate','yearsOfService','separationDate','characterOfService','clearance','email','phone','location'];
    profileFields.forEach(f => { if (p[f]) profileUpdates[f] = p[f]; });
    if (p.education) profileUpdates.education = p.education;
  }

  // Apply single assignment (performance report)
  if (data.assignment) {
    const a = data.assignment;
    const accs = data.keyAccomplishments?.length
      ? data.keyAccomplishments.map(k => '• ' + k).join('\n')
      : a.accomplishments;
    newAssignments.unshift({ id:id(), source:'AI:'+docType, ...a, accomplishments: accs });
  }

  // Apply multiple assignments (DD-214)
  if (data.assignments?.length) {
    data.assignments.forEach(a => {
      if (a.dutyTitle || a.base) newAssignments.push({ id:id(), source:'AI:'+docType, ...a });
    });
  }

  // Apply civilian jobs (from civilian resume) — skip any that are military employers or overlap existing assignments
  if (data.civilianJobs?.length) {
    // Block pure active-duty military employers — but ALLOW Reserve/Guard units
    // Reservists and Guard members hold real civilian-titled roles that should be captured
    const RESERVE_GUARD = /\b(reserve|national guard|ang|afrc|usar|usnr|usmcr)\b/i;
    const MILITARY_EMPLOYERS = /\b(air force|army|navy|marine|coast guard|space force|united states military|u\.s\. military|armed forces|department of defense)\b/i;

    // Build list of existing military date ranges to detect overlaps
    const assignmentRanges = state.assignments.map(a => ({
      start: a.startDate ? new Date(a.startDate).getFullYear() : null,
      end: a.endDate ? new Date(a.endDate).getFullYear() : new Date().getFullYear()
    })).filter(r => r.start);

    data.civilianJobs.forEach(j => {
      if (!j.title || !j.company) return;

      // Skip if employer is a military branch — UNLESS it's a Reserve/Guard unit
      // Reserve and Guard members hold civilian-titled roles that are real work experience
      const isReserveOrGuard = RESERVE_GUARD.test(j.company);
      const hasCivilianTitle = /\b(director|manager|analyst|engineer|specialist|coordinator|lead|chief|head|supervisor|officer(?! of)|advisor|consultant|developer|administrator)\b/i.test(j.title);
      
      if (MILITARY_EMPLOYERS.test(j.company) && !isReserveOrGuard && !hasCivilianTitle) {
        console.log(`Skipping active-duty military employer: ${j.company} - ${j.title}`);
        return;
      }

      // Check for date overlap with existing military assignments
      const jobStart = j.startDate ? new Date(j.startDate).getFullYear() : null;
      const jobEnd = j.endDate ? new Date(j.endDate).getFullYear() : new Date().getFullYear();

      if (jobStart) {
        const overlaps = assignmentRanges.some(r =>
          r.start && jobStart <= r.end && jobEnd >= r.start
        );
        if (overlaps) {
          // Still add it — civilian contractor roles can overlap with AD service — but tag it
          newCivilianJobs.push({ id:id(), source:'AI:'+docType, possibleOverlap: true, ...j });
          return;
        }
      }

      newCivilianJobs.push({ id:id(), source:'AI:'+docType, ...j });
    });
  }

  // Apply skills (from civilian resume)
  if (data.skills) {
    const currentTech = state.profile.technicalSkills || [];
    const currentSoft = state.profile.softSkills || [];
    const newTech = data.skills.technical || [];
    const newSoft = data.skills.soft || [];
    
    // Merge without duplicates
    const mergedTech = [...new Set([...currentTech, ...newTech])];
    const mergedSoft = [...new Set([...currentSoft, ...newSoft])];
    
    if (newTech.length > 0) profileUpdates.technicalSkills = mergedTech;
    if (newSoft.length > 0) profileUpdates.softSkills = mergedSoft;
  }

  // Apply certifications (from civilian resume)
  if (data.certifications) {
    const current = state.profile.certifications || '';
    profileUpdates.certifications = current ? `${current}\n${data.certifications}` : data.certifications;
  }

  // Apply awards
  const awardsData = data.award ? [data.award] : (data.awards || []);
  awardsData.forEach(a => { if (a.name) newAwards.push({ id:id(), source:'AI:'+docType, ...a }); });

  // Store the document record
  const doc = { id:id(), name:fileName, type:docType, uploadDate:new Date().toISOString(), processed:true };

  setState({
    profile: { ...state.profile, ...profileUpdates },
    assignments: newAssignments,
    civilianJobs: newCivilianJobs,
    awards: newAwards,
    documents: [...state.documents, doc],
    ui: { ...state.ui, docBusy:false, docStatus:'', docResult: data.summary || 'Extraction complete. Review your Experience page.', docError:'' }
  });
  if (typeof trackAction === 'function') trackAction('doc_upload');
    showToast('Document processed! ✓');
}

async function processUpload() {
  const fileEl = document.getElementById('d-file');
  const typeEl = document.getElementById('d-type');
  const file = fileEl?.files?.[0];
  const docType = typeEl?.value;
  if (!file) { showToast('Please select a file', false); return; }
  if (!docType) { showToast('Please select a document type', false); return; }
  
  setState({ ui: { ...state.ui, docBusy:true, docStatus:'🤖 Claude is reading your document...', docResult:null, docError:'' }});
  try {
    const base64 = await readFileAsBase64(file);
    const mime = file.type.includes('pdf') ? 'application/pdf' : file.type;
    const prompt = buildExtractionPrompt(docType);
    const raw = await callClaudeWithFile(
      'You are an expert at reading military documents and extracting structured data. Translate ALL military jargon to civilian equivalents. Return JSON only — no markdown, no extra text.',
      prompt, base64, mime
    );
    await applyExtraction(raw, docType, file.name);
  } catch(err) {
    const msg = err.message || 'Unknown error';
    const hint = msg.includes('rate') ? 'Daily limit reached — try again tomorrow.' 
               : msg.includes('size') || msg.includes('large') ? 'File may be too large — try compressing the PDF or use the paste option below.'
               : msg.includes('type') || msg.includes('format') ? 'File format not supported — please use PDF only.'
               : 'Try the paste option below, or check your file is a valid PDF.';
    setState({ ui: { ...state.ui, docBusy:false, docStatus:'', docError:`Error: ${msg}. ${hint}` }});
  }
}

async function processPastedDoc() {
  const content = document.getElementById('dp-content')?.value?.trim();
  const docType = document.getElementById('dp-type')?.value;
  const name = document.getElementById('dp-name')?.value?.trim() || docType || 'Document';
  if (!content) { showToast('Please paste document text', false); return; }
  if (!docType) { showToast('Please select a document type', false); return; }
  if (state.ui.pasteBusy) { showToast('Already processing, please wait...', false); return; }
  
  setState({ ui: { ...state.ui, pasteBusy:true, pasteStatus:'🤖 Extracting information...', docResult:null, docError:'' }});
  try {
    const prompt = buildExtractionPrompt(docType) + '\n\nDOCUMENT TEXT:\n' + content;
    const raw = await callClaude(
      'You are an expert at reading military documents and extracting structured data. Translate ALL military jargon to civilian equivalents. Return JSON only — no markdown.',
      prompt
    );
    await applyExtraction(raw, docType, name);
    setState({ ui: { ...state.ui, pasteBusy:false, pasteStatus:'' }});
  } catch(err) {
    setState({ ui: { ...state.ui, pasteBusy:false, pasteStatus:'', docError:'Error: ' + err.message + '. Try shortening the pasted text if it is very long.' }});
  }
}

function removeDoc(did) { setState({ documents: state.documents.filter(d=>d.id!==did) }); }

