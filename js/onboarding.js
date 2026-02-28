// ── Onboarding Wizard ──────────────────────────────────────────────────
// Shows automatically for new users. 5 steps:
// 1. Welcome + path choice (DD-214 or manual)
// 2a. DD-214 upload (auto-populates profile)
// 2b. Manual profile entry
// 3. Additional documents (upload or paste, skippable)
// 4. Pick first goal → drops into that feature

function shouldShowOnboarding() {
  // Show if: never completed onboarding AND no profile name AND not explicitly dismissed
  const completed = localStorage.getItem('t2t_onboarding_complete');
  if (completed) return false;
  if (state.profile?.fullName) return false;
  return true;
}

function completeOnboarding(goalView) {
  localStorage.setItem('t2t_onboarding_complete', '1');
  setState({ view: goalView || 'dashboard' });
}

function dismissOnboarding() {
  localStorage.setItem('t2t_onboarding_complete', '1');
  setState({ view: 'dashboard', ui: { ...state.ui, onboardStep: null } });
}

function renderOnboarding() {
  const step = state.ui.onboardStep || 1;
  const path = state.ui.onboardPath || ''; // 'dd214' or 'manual'

  return `
  <div style="max-width:600px;margin:0 auto;padding:20px">

    <!-- Progress bar -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:32px">
      ${[1,2,3,4].map((s,i) => `
        <div style="flex:1;height:4px;border-radius:2px;background:${step>s?'#2563eb':step===s?'#93c5fd':'#e5e7eb'}"></div>
        ${i<3?'':''}
      `).join('')}
      <span style="font-size:12px;color:#6b7280;white-space:nowrap">Step ${step} of 4</span>
    </div>

    ${step === 1 ? renderOnboardStep1() : ''}
    ${step === 2 && path === 'dd214' ? renderOnboardStep2DD214() : ''}
    ${step === 2 && path === 'manual' ? renderOnboardStep2Manual() : ''}
    ${step === 3 ? renderOnboardStep3() : ''}
    ${step === 4 ? renderOnboardStep4() : ''}

    <!-- Skip / dismiss -->
    <div style="text-align:center;margin-top:20px">
      <button onclick="dismissOnboarding()" style="background:none;border:none;color:#9ca3af;font-size:12px;cursor:pointer;text-decoration:underline">
        Skip setup — I'll explore on my own
      </button>
    </div>
  </div>`;
}

// ── Step 1: Welcome + path choice ────────────────────────────────────
function renderOnboardStep1() {
  return `
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-size:48px;margin-bottom:12px">🎖️</div>
      <h1 style="font-size:28px;font-weight:800;color:#1f2937;margin:0 0 8px">Welcome to Tactics 2 Talent</h1>
      <p style="font-size:15px;color:#6b7280;margin:0">Let's get your profile set up so Claude can write you a killer resume. Takes about 2 minutes.</p>
    </div>

    <p style="font-size:14px;font-weight:600;color:#374151;text-align:center;margin-bottom:16px">Do you have your DD-214 handy?</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px">
      <div onclick="setState({ui:{...state.ui,onboardStep:2,onboardPath:'dd214'}})"
        style="padding:20px;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;text-align:center;transition:all 0.15s"
        onmouseover="this.style.borderColor='#2563eb';this.style.background='#eff6ff'"
        onmouseout="this.style.borderColor='#e5e7eb';this.style.background='white'">
        <div style="font-size:32px;margin-bottom:8px">📄</div>
        <div style="font-weight:700;font-size:15px;color:#1f2937;margin-bottom:4px">Yes, I have my DD-214</div>
        <div style="font-size:12px;color:#6b7280">Upload it and we'll fill in your profile automatically</div>
      </div>
      <div onclick="setState({ui:{...state.ui,onboardStep:2,onboardPath:'manual'}})"
        style="padding:20px;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;text-align:center;transition:all 0.15s"
        onmouseover="this.style.borderColor='#2563eb';this.style.background='#eff6ff'"
        onmouseout="this.style.borderColor='#e5e7eb';this.style.background='white'">
        <div style="font-size:32px;margin-bottom:8px">✏️</div>
        <div style="font-weight:700;font-size:15px;color:#1f2937;margin-bottom:4px">No, I'll enter it manually</div>
        <div style="font-size:12px;color:#6b7280">Fill in a quick form with your key details</div>
      </div>
    </div>`;
}

// ── Step 2a: DD-214 Upload ────────────────────────────────────────────
function renderOnboardStep2DD214() {
  const busy = state.ui.onboardBusy;
  const status = state.ui.onboardStatus || '';
  const error = state.ui.onboardError || '';
  const done = state.ui.onboardDD214Done;

  return `
    <div style="text-align:center;margin-bottom:24px">
      <h2 style="font-size:22px;font-weight:800;color:#1f2937;margin:0 0 8px">Upload your DD-214</h2>
      <p style="font-size:14px;color:#6b7280;margin:0">Claude will read it and fill in your profile automatically — branch, rank, MOS, service dates, and more.</p>
    </div>

    ${done ? `
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
        <div style="font-size:32px;margin-bottom:8px">✅</div>
        <div style="font-weight:700;font-size:16px;color:#15803d;margin-bottom:4px">Profile populated!</div>
        <div style="font-size:13px;color:#166534">Found: ${esc(state.profile.fullName||'')}${state.profile.branch?' · '+esc(state.profile.branch):''}${state.profile.rank?' · '+esc(state.profile.rank):''}</div>
      </div>
      <button class="btn btn-primary" onclick="setState({ui:{...state.ui,onboardStep:3}})" style="width:100%;padding:14px;font-size:15px">
        Continue → Add More Documents
      </button>
    ` : `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:12px;color:#92400e;margin-bottom:16px">
        💡 <strong>Privacy tip:</strong> Consider redacting Box 3 (SSN) and Box 5 (DOB) before uploading — we only need your career history.
      </div>

      <div style="border:2px dashed #d1d5db;border-radius:12px;padding:32px;text-align:center;margin-bottom:16px;cursor:pointer"
        onclick="document.getElementById('onboard-dd214-file').click()"
        onmouseover="this.style.borderColor='#2563eb';this.style.background='#f9fafb'"
        onmouseout="this.style.borderColor='#d1d5db';this.style.background='white'">
        <div style="font-size:36px;margin-bottom:8px">📤</div>
        <div style="font-weight:600;color:#374151;margin-bottom:4px">Click to upload your DD-214</div>
        <div style="font-size:12px;color:#9ca3af">PDF format · Max 10MB</div>
        <input type="file" id="onboard-dd214-file" accept=".pdf" style="display:none" onchange="onboardProcessDD214(this.files[0])">
      </div>

      ${busy ? `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px">
          <div class="spinner"></div>
          <div style="font-size:13px;font-weight:600;color:#1e40af">${esc(status) || '🤖 Claude is reading your DD-214...'}</div>
        </div>
      ` : ''}
      ${error ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;font-size:13px;color:#dc2626;margin-top:8px">${esc(error)}</div>` : ''}

      <div style="text-align:center;margin-top:12px">
        <button onclick="setState({ui:{...state.ui,onboardStep:2,onboardPath:'manual'}})" style="background:none;border:none;color:#6b7280;font-size:13px;cursor:pointer">
          Don't have it as a PDF? Enter manually instead →
        </button>
      </div>
    `}`;
}

// ── Step 2b: Manual profile entry ────────────────────────────────────
function renderOnboardStep2Manual() {
  const p = state.profile;
  return `
    <div style="text-align:center;margin-bottom:24px">
      <h2 style="font-size:22px;font-weight:800;color:#1f2937;margin:0 0 8px">Tell us about your service</h2>
      <p style="font-size:14px;color:#6b7280;margin:0">Just the essentials — you can fill in more details later.</p>
    </div>

    <div class="grid2" style="gap:12px;margin-bottom:12px">
      <div class="field">
        <label class="field-label">Full Name *</label>
        <input id="ob-name" placeholder="First Last" value="${esc(p.fullName||'')}" oninput="updateProfileField('fullName',this.value)">
      </div>
      <div class="field">
        <label class="field-label">Branch of Service *</label>
        <select id="ob-branch" onchange="updateProfileField('branch',this.value)">
          <option value="">Select branch...</option>
          ${['Army','Navy','Marine Corps','Air Force','Space Force','Coast Guard','National Guard','Reserve'].map(b=>`<option value="${b}" ${p.branch===b?'selected':''}>${b}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field-label">Highest Rank</label>
        <input id="ob-rank" placeholder="e.g. Lieutenant Colonel, E-7" value="${esc(p.rank||'')}" oninput="updateProfileField('rank',this.value)">
      </div>
      <div class="field">
        <label class="field-label">Years of Service</label>
        <input id="ob-years" placeholder="e.g. 21" type="number" value="${esc(p.yearsOfService||'')}" oninput="updateProfileField('yearsOfService',this.value)">
      </div>
      <div class="field">
        <label class="field-label">MOS / Rate / AFSC</label>
        <input id="ob-mos" placeholder="e.g. 11F, 68W, IT" value="${esc(p.mosRate||'')}" oninput="updateProfileField('mosRate',this.value)">
      </div>
      <div class="field">
        <label class="field-label">Security Clearance</label>
        <select onchange="updateProfileField('clearance',this.value)">
          <option value="">None / Unknown</option>
          ${['Confidential','Secret','Top Secret','TS/SCI','TS/SCI + Poly'].map(c=>`<option value="${c}" ${p.clearance===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
    </div>

    <button class="btn btn-primary" onclick="onboardManualNext()" style="width:100%;padding:14px;font-size:15px">
      Continue → Add Documents
    </button>`;
}

// ── Step 3: Additional documents ─────────────────────────────────────
function renderOnboardStep3() {
  const queue = state.ui.onboardQueue || [];
  const processed = state.ui.onboardProcessed || 0;
  const total = state.ui.onboardTotal || 0;
  const busy = state.ui.onboardDocBusy;
  const currentFile = state.ui.onboardCurrentFile || '';
  const errors = state.ui.onboardErrors || [];
  const addedCount = state.ui.onboardAddedCount || 0;

  const isProcessing = busy && total > 0;
  const isDone = !busy && total > 0;

  return `
    <div style="text-align:center;margin-bottom:24px">
      <h2 style="font-size:22px;font-weight:800;color:#1f2937;margin:0 0 8px">Add your documents</h2>
      <p style="font-size:14px;color:#6b7280;margin:0">Upload as many as you have — performance reports, training records, existing resume, awards. The more Claude sees, the better your results.</p>
    </div>

    <!-- Drop zone -->
    ${!isProcessing ? `
    <div id="onboard-dropzone"
      style="border:2px dashed #d1d5db;border-radius:12px;padding:32px;text-align:center;margin-bottom:16px;cursor:pointer;transition:all 0.15s"
      onclick="document.getElementById('onboard-doc-files').click()"
      ondragover="event.preventDefault();this.style.borderColor='#2563eb';this.style.background='#eff6ff'"
      ondragleave="this.style.borderColor='#d1d5db';this.style.background='white'"
      ondrop="event.preventDefault();this.style.borderColor='#d1d5db';this.style.background='white';onboardQueueFiles(event.dataTransfer.files)">
      <div style="font-size:36px;margin-bottom:8px">📁</div>
      <div style="font-weight:600;color:#374151;font-size:15px;margin-bottom:4px">Drop files here or click to browse</div>
      <div style="font-size:12px;color:#9ca3af">PDF files · Select as many as you want at once</div>
      <input type="file" id="onboard-doc-files" accept=".pdf" multiple style="display:none"
        onchange="onboardQueueFiles(this.files)">
    </div>

    <div style="font-size:12px;color:#6b7280;margin-bottom:16px;text-align:center">
      Works with: Performance Reports · OERs/NCOERs · DD-214 · Training Records · Existing Resume · Awards · Any PDF
    </div>
    ` : ''}

    <!-- Processing progress -->
    ${isProcessing ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div class="spinner"></div>
          <div style="font-size:13px;font-weight:600;color:#1e40af">
            Processing ${processed + 1} of ${total} — ${esc(currentFile)}
          </div>
        </div>
        <div style="background:#bfdbfe;border-radius:4px;height:6px;overflow:hidden">
          <div style="background:#2563eb;height:100%;width:${Math.round((processed/total)*100)}%;transition:width 0.3s"></div>
        </div>
        <div style="font-size:11px;color:#6b7280;margin-top:6px">Processing one at a time to stay within limits — please don't close this tab</div>
      </div>
    ` : ''}

    <!-- Done summary -->
    ${isDone ? `
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:10px;padding:16px;margin-bottom:16px">
        <div style="font-weight:700;color:#15803d;font-size:15px;margin-bottom:4px">✅ ${addedCount} of ${total} document${total>1?'s':''} processed</div>
        ${errors.length > 0 ? `
          <div style="font-size:12px;color:#92400e;margin-top:6px">
            ⚠️ ${errors.length} file${errors.length>1?'s':''} couldn't be read: ${errors.map(e=>esc(e)).join(', ')}
          </div>` : ''}
        <button class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="setState({ui:{...state.ui,onboardTotal:0,onboardProcessed:0,onboardAddedCount:0,onboardErrors:[]}})">
          + Add more documents
        </button>
      </div>
    ` : ''}

    <!-- Paste text option -->
    <div style="text-align:center;margin-bottom:16px">
      <button onclick="onboardShowPaste('paste','document')" style="background:none;border:none;color:#6b7280;font-size:13px;cursor:pointer;text-decoration:underline">
        📋 Paste text instead of uploading a file
      </button>
    </div>

    ${state.ui.onboardPasteDocId ? `
      <div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:16px">
        <div style="font-weight:600;font-size:13px;margin-bottom:8px">Paste document text:</div>
        <textarea id="onboard-paste-text" rows="6" placeholder="Paste any document text here — resume, performance report, training history..." style="width:100%;font-size:13px;box-sizing:border-box"></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary btn-sm" onclick="onboardProcessPaste()">Extract Info</button>
          <button class="btn btn-secondary btn-sm" onclick="setState({ui:{...state.ui,onboardPasteDocId:null}})">Cancel</button>
        </div>
      </div>
    ` : ''}

    <button class="btn btn-primary" onclick="setState({ui:{...state.ui,onboardStep:4}})"
      style="width:100%;padding:14px;font-size:15px" ${isProcessing?'disabled':''}>
      ${addedCount > 0 || (isDone) ? `Continue → Pick Your First Goal` : `Skip for Now → Pick Your First Goal`}
    </button>`;
}

// ── Step 4: Pick first goal ───────────────────────────────────────────
function renderOnboardStep4() {
  const name = state.profile?.fullName ? state.profile.fullName.split(' ')[0] : 'there';
  return `
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-size:40px;margin-bottom:12px">🎯</div>
      <h2 style="font-size:22px;font-weight:800;color:#1f2937;margin:0 0 8px">You're set up, ${esc(name)}!</h2>
      <p style="font-size:14px;color:#6b7280;margin:0">What would you like to tackle first?</p>
    </div>

    <div style="display:grid;gap:10px">
      ${[
        { view:'resume', icon:'📄', label:'Build My Resume', desc:'AI writes a tailored resume for a specific job or a general one' },
        { view:'jobs', icon:'🔍', label:'Find Jobs to Apply For', desc:'Browse and track job opportunities that match your background' },
        { view:'interview', icon:'🎤', label:'Prep for an Interview', desc:'Get AI-generated questions and answers based on your experience' },
        { view:'linkedin', icon:'💼', label:'Optimize My LinkedIn', desc:'Rewrite your profile for civilian hiring managers' },
        { view:'dashboard', icon:'🗺️', label:'Explore the Dashboard', desc:'See everything the platform offers' },
      ].map(goal => `
        <div onclick="completeOnboarding('${goal.view}')"
          style="padding:16px;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;display:flex;gap:14px;align-items:center;transition:all 0.15s"
          onmouseover="this.style.borderColor='#2563eb';this.style.background='#eff6ff'"
          onmouseout="this.style.borderColor='#e5e7eb';this.style.background='white'">
          <span style="font-size:28px;flex-shrink:0">${goal.icon}</span>
          <div>
            <div style="font-weight:700;font-size:15px;color:#1f2937">${goal.label}</div>
            <div style="font-size:12px;color:#6b7280">${goal.desc}</div>
          </div>
          <span style="margin-left:auto;color:#9ca3af;font-size:18px">→</span>
        </div>
      `).join('')}
    </div>`;
}

// ── Onboarding action handlers ────────────────────────────────────────
function updateProfileField(field, value) {
  setState({ profile: { ...state.profile, [field]: value } }, false);
}

function onboardManualNext() {
  if (!state.profile.fullName?.trim()) {
    showToast('Please enter your name', false); return;
  }
  setState({ ui: { ...state.ui, onboardStep: 3 } });
}

async function onboardProcessDD214(file) {
  if (!file) return;
  setState({ ui: { ...state.ui, onboardBusy: true, onboardStatus: '🤖 Claude is reading your DD-214...', onboardError: '' } });
  try {
    const base64 = await readFileAsBase64(file);
    const mime = 'application/pdf';
    const raw = await callClaudeWithFile(
      'You are an expert at reading military DD-214 discharge documents. Extract all career information and return ONLY JSON.',
      `Extract all military career information from this DD-214 and return ONLY this JSON (no markdown, no extra text):
{
  "profile": {
    "fullName": "", "branch": "", "rank": "", "mosRate": "", "yearsOfService": "",
    "separationDate": "", "characterOfService": "", "clearance": "", "email": "", "phone": "", "location": ""
  },
  "assignments": [{ "dutyTitle": "", "unit": "", "startDate": "", "endDate": "", "accomplishments": "" }],
  "awards": [{ "name": "", "date": "" }],
  "education": "",
  "summary": "Plain English summary of what was extracted"
}`,
      base64, mime
    );

    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const p = data.profile || {};

    // Apply profile fields
    const updates = {};
    ['fullName','branch','rank','mosRate','yearsOfService','separationDate','characterOfService','clearance','email','phone','location'].forEach(f => {
      if (p[f]) updates[f] = p[f];
    });
    if (Object.keys(updates).length) setState({ profile: { ...state.profile, ...updates } });

    // Apply assignments
    if ((data.assignments||[]).length) {
      setState({ assignments: [...state.assignments, ...data.assignments.filter(a => a.dutyTitle)] });
    }

    // Apply awards
    if ((data.awards||[]).length) {
      setState({ awards: [...state.awards, ...data.awards.filter(a => a.name)] });
    }

    setState({ ui: { ...state.ui, onboardBusy: false, onboardDD214Done: true, onboardStatus: '',
      onboardAddedDocs: [...(state.ui.onboardAddedDocs||[]), 'dd214'] } });

  } catch(err) {
    setState({ ui: { ...state.ui, onboardBusy: false, onboardError: 'Could not read the DD-214: ' + err.message + '. Try the manual option below.' } });
  }
}

// ── Sequential document queue ─────────────────────────────────────────
let _onboardQueueRunning = false;
let _onboardFileQueue = [];

function onboardQueueFiles(fileList) {
  const files = Array.from(fileList);
  if (!files.length) return;
  _onboardFileQueue.push(...files);
  const total = (_onboardFileQueue.length) + (state.ui.onboardProcessed || 0);
  setState({ ui: {
    ...state.ui,
    onboardTotal: (state.ui.onboardTotal || 0) + files.length,
    onboardDocBusy: true,
    onboardErrors: state.ui.onboardErrors || []
  }});
  if (!_onboardQueueRunning) _onboardRunQueue();
}

async function _onboardRunQueue() {
  _onboardQueueRunning = true;
  while (_onboardFileQueue.length > 0) {
    const file = _onboardFileQueue.shift();
    setState({ ui: { ...state.ui, onboardCurrentFile: file.name, onboardDocBusy: true } });
    await _onboardProcessOneFile(file);
    // Small pause between documents to avoid rate limits
    if (_onboardFileQueue.length > 0) await new Promise(r => setTimeout(r, 1500));
  }
  _onboardQueueRunning = false;
  setState({ ui: { ...state.ui, onboardDocBusy: false, onboardCurrentFile: '' } });
}

async function _onboardProcessOneFile(file, retryCount = 0) {
  try {
    const base64 = await readFileAsBase64(file);
    const raw = await callClaudeWithFile(
      'You are an expert at reading military documents. Extract career information and return ONLY JSON.',
      `Extract career information from this document and return ONLY JSON:
{"assignments":[{"dutyTitle":"","unit":"","startDate":"","endDate":"","accomplishments":""}],
 "civilianJobs":[{"title":"","company":"","startDate":"","endDate":"","accomplishments":""}],
 "awards":[{"name":"","date":""}],
 "education":"","certifications":"","summary":""}`,
      base64, 'application/pdf'
    );
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if ((data.assignments||[]).length) setState({ assignments: [...state.assignments, ...data.assignments.filter(a=>a.dutyTitle)] });
    if ((data.civilianJobs||[]).length) setState({ civilianJobs: [...state.civilianJobs, ...data.civilianJobs.filter(j=>j.title)] });
    if ((data.awards||[]).length) setState({ awards: [...state.awards, ...data.awards.filter(a=>a.name)] });
    setState({ ui: {
      ...state.ui,
      onboardProcessed: (state.ui.onboardProcessed || 0) + 1,
      onboardAddedCount: (state.ui.onboardAddedCount || 0) + 1,
    }});
  } catch(err) {
    const is429 = err.message?.includes('429') || err.status === 429;
    if (is429 && retryCount < 2) {
      // Rate limited — wait and retry
      const waitMs = (retryCount + 1) * 4000; // 4s, then 8s
      setState({ ui: { ...state.ui, onboardCurrentFile: `⏳ Rate limit hit — retrying ${file.name} in ${waitMs/1000}s...` } });
      await new Promise(r => setTimeout(r, waitMs));
      return _onboardProcessOneFile(file, retryCount + 1);
    }
    // Failed after retries — log error, keep going
    setState({ ui: {
      ...state.ui,
      onboardProcessed: (state.ui.onboardProcessed || 0) + 1,
      onboardErrors: [...(state.ui.onboardErrors || []), file.name],
    }});
  }
}

// Legacy single-file handler (kept for paste flow)
async function onboardAddDocument(docId, file, docLabel) {
  onboardQueueFiles([file]);
}

function onboardShowPaste(docId, docLabel) {
  setState({ ui: { ...state.ui, onboardPasteDocId: docId, onboardPasteDocLabel: docLabel } });
  setTimeout(() => document.getElementById('onboard-paste-text')?.focus(), 50);
}

async function onboardProcessPaste() {
  const text = document.getElementById('onboard-paste-text')?.value?.trim();
  const docId = state.ui.onboardPasteDocId;
  const docLabel = state.ui.onboardPasteDocLabel;
  if (!text) { showToast('Please paste some text first', false); return; }
  setState({ ui: { ...state.ui, onboardDocBusy: true, onboardPasteDocId: null } });
  try {
    const raw = await callClaude(
      'You are an expert at reading military documents. Extract career information and return ONLY JSON.',
      `Extract career information from this document text and return ONLY JSON:
{"assignments":[{"dutyTitle":"","unit":"","startDate":"","endDate":"","accomplishments":""}],
 "civilianJobs":[{"title":"","company":"","startDate":"","endDate":"","accomplishments":""}],
 "awards":[{"name":"","date":""}],
 "education":"","certifications":"","summary":""}

DOCUMENT TEXT:
${text}`
    );
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if ((data.assignments||[]).length) setState({ assignments: [...state.assignments, ...data.assignments.filter(a=>a.dutyTitle)] });
    if ((data.civilianJobs||[]).length) setState({ civilianJobs: [...state.civilianJobs, ...data.civilianJobs.filter(j=>j.title)] });
    if ((data.awards||[]).length) setState({ awards: [...state.awards, ...data.awards.filter(a=>a.name)] });
    setState({ ui: { ...state.ui, onboardDocBusy: false, onboardAddedDocs: [...(state.ui.onboardAddedDocs||[]), docId] } });
    showToast(`✅ ${docLabel} processed`);
  } catch(err) {
    setState({ ui: { ...state.ui, onboardDocBusy: false } });
    showToast('Could not process text — check format and try again', false);
  }
}
