// ── Job Tracker ───────────────────────────────────────────────────────
function renderJobs() {
  const filter = state.ui.jobFilter || 'all';
  const editId = state.ui.editJobId || null;
  const addMode = state.ui.addJob || false;
  const STATUSES = ['interested','applied','interviewing','offered','rejected','withdrawn'];
  const filtered = filter==='all' ? state.jobs : state.jobs.filter(j=>j.status===filter);

  const form = (job) => {
    const j = job || { title:'',company:'',location:'',salaryRange:'',jobUrl:'',status:'interested',dateAdded:new Date().toISOString().split('T')[0],dateApplied:'',interviewDates:'',contactName:'',notes:'' };
    const pre = job ? 'ej' : 'nj';
    return `
      <div class="card">
        <h2>${job?'Edit Job':'Add New Job'}</h2>
        
        ${!job ? `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:16px">
          <div style="font-weight:700;color:#1e40af;margin-bottom:6px">🤖 AI Job Analysis — Auto-Fill from Posting</div>
          <div style="font-size:13px;color:#1e3a8a;margin-bottom:10px">Paste a job URL or the full job description. Claude will extract the details AND analyze how well it matches your background.</div>
          <div class="field" style="margin-bottom:10px">
            <textarea id="job-analysis-input" rows="5" placeholder="Paste job URL (e.g., https://careers.company.com/job/12345) OR paste the full job description text..." style="font-size:13px"></textarea>
          </div>
          <button class="btn btn-primary btn-sm" onclick="analyzeJobPosting()" ${state.ui.jobAnalyzing?'disabled':''}>
            ${state.ui.jobAnalyzing?'<div class="spinner"></div> Analyzing...':'🔍 Analyze & Auto-Fill'}
          </button>
          ${state.ui.jobAnalysisError?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px;margin-top:10px;font-size:12px;color:#dc2626">${esc(state.ui.jobAnalysisError)}</div>`:''}
        </div>` : ''}
        
        ${state.ui.jobAnalysisResult ? `
        <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="font-weight:700;color:#15803d;font-size:15px;margin-bottom:10px">✅ Job Analysis Complete — Form Auto-Filled Below</div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 16px;font-size:13px;margin-bottom:10px">
            <span style="font-weight:600;color:#166534">Fit Score:</span><span style="font-weight:700">${state.ui.jobAnalysisResult.fitScore}/10 — ${esc(state.ui.jobAnalysisResult.fitLabel)}</span>
            <span style="font-weight:600;color:#166534">Seniority:</span><span>${esc(state.ui.jobAnalysisResult.seniority)}</span>
            <span style="font-weight:600;color:#166534">Worth Applying:</span><span>${state.ui.jobAnalysisResult.worthYourTime===true?'✅ Yes':state.ui.jobAnalysisResult.worthYourTime===false?'⚠️ Proceed with caution':'Not assessed'}</span>
            ${state.ui.jobAnalysisResult.clearance?`<span style="font-weight:600;color:#166534">Clearance:</span><span>${esc(state.ui.jobAnalysisResult.clearance)}</span>`:''}
          </div>
          <div style="font-size:13px;color:#166534;line-height:1.6;margin-bottom:8px">${esc(state.ui.jobAnalysisResult.assessment)}</div>
          ${state.ui.jobAnalysisResult.whyItMatters?`<div style="font-size:13px;color:#1e40af;background:#eff6ff;border-radius:6px;padding:8px;margin-bottom:6px"><strong>🎯</strong> ${esc(state.ui.jobAnalysisResult.whyItMatters)}</div>`:''}
          ${state.ui.jobAnalysisResult.watchOut?`<div style="font-size:13px;color:#92400e;background:#fffbeb;border-radius:6px;padding:8px;margin-bottom:6px"><strong>⚠️</strong> ${esc(state.ui.jobAnalysisResult.watchOut)}</div>`:''}
          ${(state.ui.jobAnalysisResult.transferableStrengths||[]).length?`<div style="font-size:12px;color:#374151;margin-top:6px"><strong>Transferable strengths:</strong> ${state.ui.jobAnalysisResult.transferableStrengths.map(s=>esc(s)).join(' · ')}</div>`:''}
          <button class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="toggleUI('jobAnalysisResult',null)">Clear Analysis</button>
        </div>` : ''}
        
        <div class="grid2">
          <div class="field"><label class="field-label">Job Title *</label><input id="${pre}-title" value="${esc(j.title)}"></div>
          <div class="field"><label class="field-label">Company *</label><input id="${pre}-company" value="${esc(j.company)}"></div>
          <div class="field"><label class="field-label">Location</label><input id="${pre}-location" value="${esc(j.location)}" placeholder="City, State or Remote"></div>
          <div class="field"><label class="field-label">Salary Range</label><input id="${pre}-salaryRange" value="${esc(j.salaryRange)}" placeholder="$85k–$110k"></div>
          <div class="field"><label class="field-label">Job URL</label><input id="${pre}-jobUrl" value="${esc(j.jobUrl)}" placeholder="https://..."></div>
          <div class="field"><label class="field-label">Status</label>
            <select id="${pre}-status">${STATUSES.map(s=>`<option ${j.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label class="field-label">Date Added</label><input type="date" id="${pre}-dateAdded" value="${j.dateAdded}"></div>
          <div class="field"><label class="field-label">Date Applied</label><input type="date" id="${pre}-dateApplied" value="${j.dateApplied||''}"></div>
          <div class="field"><label class="field-label">Contact Name</label><input id="${pre}-contactName" value="${esc(j.contactName||'')}" placeholder="Recruiter name"></div>
        </div>
        <div class="field"><label class="field-label">Interview Dates & Details</label><textarea id="${pre}-interviewDates" rows="2" placeholder="Phone screen: 2/15 @ 2pm">${esc(j.interviewDates||'')}</textarea></div>
        <div class="field"><label class="field-label">Notes</label><textarea id="${pre}-notes" rows="3" placeholder="Key requirements, culture, follow-ups...">${esc(j.notes||'')}</textarea></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="${job?`updateJob('${job.id}')`:'saveJob()'}">${job?'Update':'Save'}</button>
          <button class="btn btn-secondary btn-sm" onclick="toggleUI('addJob',false);toggleUI('editJobId',null);toggleUI('jobAnalysisResult',null)">Cancel</button>
        </div>
      </div>`;
  };

  const STATUS_COLORS = { interested:'#6b7280', applied:'#2563eb', interviewing:'#7c3aed', offered:'#16a34a', rejected:'#dc2626', withdrawn:'#9ca3af' };
  const NEXT_STATUS = { interested:'applied', applied:'interviewing', interviewing:'offered' };

  const jobCards = filtered.map(j=>{
    if (editId===j.id) return form(j);
    const log = (j.activityLog||[]).slice().reverse(); // newest first
    const showLog = state.ui[`showLog_${j.id}`] || false;
    return `
      <div class="card" style="margin-bottom:12px;border-left:4px solid ${STATUS_COLORS[j.status]||'#e5e7eb'}">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
              <span style="font-weight:700;font-size:16px">${esc(j.title)}</span> ${statusBadge(j.status)}
              ${j.fitScore ? (() => {
                const s = j.fitScore;
                const color = s >= 8 ? '#16a34a' : s >= 6 ? '#2563eb' : s >= 4 ? '#d97706' : '#dc2626';
                const bg = s >= 8 ? '#f0fdf4' : s >= 6 ? '#eff6ff' : s >= 4 ? '#fffbeb' : '#fef2f2';
                return `<span style="background:${bg};color:${color};border:1.5px solid ${color}60;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700">⭐ ${s}/10 ${j.fitLabel||''}</span>`;
              })() : ''}
            </div>
            <div style="font-size:14px;color:#4b5563">${esc(j.company)}${j.location?' — '+esc(j.location):''}</div>
            ${j.salaryRange?`<div style="color:#16a34a;font-weight:600;font-size:14px">${esc(j.salaryRange)}</div>`:''}
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;margin-left:8px">
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('editJobId','${j.id}')">✏</button>
            <button class="btn btn-danger btn-sm" onclick="removeJob('${j.id}')">✕</button>
          </div>
        </div>

        <!-- Quick metadata row -->
        <div style="display:flex;gap:12px;font-size:12px;color:#9ca3af;margin-top:8px;flex-wrap:wrap">
          ${j.dateAdded?`<span>Added ${new Date(j.dateAdded).toLocaleDateString()}</span>`:''}
          ${j.dateApplied?`<span>Applied ${new Date(j.dateApplied).toLocaleDateString()}</span>`:''}
          ${j.contactName?`<span>📞 ${esc(j.contactName)}</span>`:''}
          ${j.jobUrl?`<a href="${esc(j.jobUrl)}" target="_blank" style="color:#2563eb;text-decoration:none">View posting →</a>`:''}
          ${(j.resumeVersions||[]).length > 0 ? `
            <button onclick="setState({view:'resume',ui:{...state.ui,resumeJob:'${j.id}',resumeMode:'targeted'}})"
              style="background:#f0fdf4;color:#15803d;border:1px solid #86efac;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;cursor:pointer">
              📄 ${j.resumeVersions.length} Resume Version${j.resumeVersions.length>1?'s':''}
            </button>
          ` : `
            <button onclick="setState({view:'resume',ui:{...state.ui,resumeJob:'${j.id}',resumeMode:'targeted'}})"
              style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;cursor:pointer">
              ✨ Build Resume
            </button>
          `}
        </div>

        ${j.notes?`<div style="background:#f9fafb;border-radius:6px;padding:8px;font-size:12px;margin-top:8px;color:#374151">${esc(j.notes)}</div>`:''}

        <!-- Quick status advance -->
        ${NEXT_STATUS[j.status]?`
        <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:12px;color:#6b7280">Move to:</span>
          ${Object.entries(STATUS_COLORS).filter(([s])=>s!==j.status&&s!=='withdrawn').map(([s,c])=>`
            <button onclick="quickStatusChange('${j.id}','${s}')" style="background:${c}18;color:${c};border:1px solid ${c}40;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">${s}</button>
          `).join('')}
        </div>`:''}

        <!-- Add note -->
        <div style="margin-top:10px;display:flex;gap:6px">
          <input id="note-input-${j.id}" placeholder="Add a note — interview feedback, next steps, contact info..." style="font-size:12px;padding:6px 10px;flex:1">
          <button class="btn btn-secondary btn-sm" onclick="addActivityNote('${j.id}')">+ Note</button>
        </div>

        <!-- Activity log toggle -->
        ${log.length>0?`
        <div style="margin-top:10px">
          <button onclick="toggleUI('showLog_${j.id}',${!showLog})" style="background:none;border:none;color:#6b7280;font-size:12px;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px">
            ${showLog?'▼':'▶'} Activity Log (${log.length} ${log.length===1?'entry':'entries'})
          </button>
          ${showLog?`
          <div style="margin-top:8px;border-left:2px solid #e5e7eb;padding-left:12px">
            ${log.map(entry=>`
              <div style="margin-bottom:8px;font-size:12px">
                <span style="color:#9ca3af">${new Date(entry.date).toLocaleDateString()} ${new Date(entry.date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                ${entry.type==='status'?`
                  <span style="margin-left:6px">
                    ${entry.from?`<span style="color:#6b7280">${entry.from}</span> → `:''}
                    <span style="color:${STATUS_COLORS[entry.to]||'#374151'};font-weight:600">${entry.to}</span>
                  </span>
                `:`<span style="color:#374151;margin-left:6px">${esc(entry.note)}</span>`}
              </div>`).join('')}
          </div>`:''}
        </div>`:''}
      </div>`;
  }).join('');

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1 style="font-size:24px;font-weight:800;margin:0">Job Tracker</h1>
      <button class="btn btn-primary" onclick="toggleUI('addJob',true);toggleUI('jobAnalysisResult',null)">+ Add Job</button>
    </div>
    <div class="grid3" style="margin-bottom:16px">
      ${STATUSES.map(s=>`<div style="background:white;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);padding:10px;text-align:center;cursor:pointer;${filter===s?'border:2px solid #3b82f6':'border:2px solid transparent'}" onclick="toggleUI('jobFilter','${s}')">
        <div style="font-size:22px;font-weight:800">${state.jobs.filter(j=>j.status===s).length}</div>
        <div style="font-size:11px;color:#6b7280;text-transform:capitalize">${s}</div>
      </div>`).join('')}
    </div>
    <div style="display:flex;align-items:center;gap:10px;background:white;border-radius:8px;padding:10px 14px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
      <span style="font-size:13px;color:#6b7280">Filter:</span>
      <select onchange="toggleUI('jobFilter',this.value)" style="width:auto;padding:4px 8px">
        <option value="all" ${filter==='all'?'selected':''}>All (${state.jobs.length})</option>
        ${STATUSES.map(s=>`<option value="${s}" ${filter===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)} (${state.jobs.filter(j=>j.status===s).length})</option>`).join('')}
      </select>
    </div>
    ${addMode&&!editId?form(null):''}
    ${filtered.length===0&&!addMode?'<div class="card" style="text-align:center;padding:40px;color:#9ca3af">💼 No jobs found. Click "+ Add Job" to start tracking — use AI Job Analysis to auto-fill from a posting.</div>':''}
    ${jobCards}`;
}

function saveJob() {
  const pre = 'nj';
  const title = document.getElementById(pre+'-title')?.value?.trim();
  const company = document.getElementById(pre+'-company')?.value?.trim();
  if (!title||!company) { alert('Title and Company required'); return; }
  const status = document.getElementById(pre+'-status')?.value || 'interested';
  const now = new Date().toISOString();
  const j = {
    id:id(), title, company,
    location:document.getElementById(pre+'-location')?.value,
    salaryRange:document.getElementById(pre+'-salaryRange')?.value,
    jobUrl:document.getElementById(pre+'-jobUrl')?.value,
    status,
    dateAdded:document.getElementById(pre+'-dateAdded')?.value || now.split('T')[0],
    dateApplied:document.getElementById(pre+'-dateApplied')?.value,
    contactName:document.getElementById(pre+'-contactName')?.value,
    interviewDates:document.getElementById(pre+'-interviewDates')?.value,
    notes:document.getElementById(pre+'-notes')?.value,
    // Carry over match score from job analysis if available
    fitScore: state.ui.jobAnalysisResult?.fitScore || null,
    fitLabel: state.ui.jobAnalysisResult?.fitLabel || null,
    // Activity log — auto-started with creation event
    activityLog: [{ date: now, type: 'status', from: null, to: status, note: 'Job added to tracker' }]
  };
  setState({ jobs:[...state.jobs,j], ui:{...state.ui,addJob:false,jobAnalysisResult:null} });
}

function updateJob(jid) {
  const pre = 'ej';
  const title = document.getElementById(pre+'-title')?.value?.trim();
  const company = document.getElementById(pre+'-company')?.value?.trim();
  if (!title||!company) return;
  const existing = state.jobs.find(j=>j.id===jid);
  const newStatus = document.getElementById(pre+'-status')?.value;
  const now = new Date().toISOString();
  const log = [...(existing?.activityLog||[])];
  // Auto-log status change if it changed
  if (existing && newStatus !== existing.status) {
    log.push({ date: now, type: 'status', from: existing.status, to: newStatus, note: '' });
  }
  const updated = {
    ...existing,
    id:jid, title, company,
    location:document.getElementById(pre+'-location')?.value,
    salaryRange:document.getElementById(pre+'-salaryRange')?.value,
    jobUrl:document.getElementById(pre+'-jobUrl')?.value,
    status:newStatus,
    dateAdded:document.getElementById(pre+'-dateAdded')?.value,
    dateApplied:document.getElementById(pre+'-dateApplied')?.value,
    contactName:document.getElementById(pre+'-contactName')?.value,
    interviewDates:document.getElementById(pre+'-interviewDates')?.value,
    notes:document.getElementById(pre+'-notes')?.value,
    activityLog: log,
  };
  setState({ jobs:state.jobs.map(j=>j.id===jid?updated:j), ui:{...state.ui,editJobId:null} });
  if (typeof trackAction==='function') trackAction('job_added');
    showToast('Job updated! ✓');
}

function quickStatusChange(jid, newStatus) {
  const existing = state.jobs.find(j=>j.id===jid);
  if (!existing || existing.status === newStatus) return;
  const now = new Date().toISOString();
  const log = [...(existing.activityLog||[]), { date: now, type: 'status', from: existing.status, to: newStatus, note: '' }];
  setState({ jobs: state.jobs.map(j => j.id===jid ? {...j, status:newStatus, activityLog:log} : j) });
  showToast(`Status → ${newStatus} ✓`);
}

function addActivityNote(jid) {
  const input = document.getElementById(`note-input-${jid}`);
  const note = input?.value?.trim();
  if (!note) return;
  const existing = state.jobs.find(j=>j.id===jid);
  if (!existing) return;
  const now = new Date().toISOString();
  const log = [...(existing.activityLog||[]), { date: now, type: 'note', note }];
  setState({ jobs: state.jobs.map(j => j.id===jid ? {...j, activityLog:log} : j) });
  if (input) input.value = '';
  showToast('Note added ✓');
}

function removeJob(jid) { if(confirm('Delete this job?')) setState({ jobs: state.jobs.filter(j=>j.id!==jid) }); }

async function analyzeJobPosting() {
  const input = document.getElementById('job-analysis-input')?.value?.trim();
  if (!input) { showToast('Please paste a job URL or description', false); return; }
    
  setState({ ui: { ...state.ui, jobAnalyzing: true, jobAnalysisError: '', jobAnalysisResult: null } });
  
  try {
    const p = state.profile;
    const sf = state.scoutFilters;

    // Build rich veteran context including standing filters if set
    const veteranContext = `VETERAN PROFILE:
Name: ${p.fullName || 'Not provided'}
Branch: ${p.branch || 'N/A'} | Rank: ${p.rank || 'N/A'} | Years: ${p.yearsOfService || 'N/A'}
Clearance: ${p.clearance || 'None'} (${p.clearanceStatus || 'N/A'})
Location: ${p.location || 'N/A'}
Technical Skills: ${(p.technicalSkills||[]).join(', ') || 'None listed'}
Leadership Skills: ${(p.softSkills||[]).join(', ') || 'None listed'}
Target Industries: ${(p.targetIndustries||[]).map(i=>typeof i==='object'?(i.subType?i.name+' - '+i.subType:i.name):i).join(', ') || 'Not specified'}

RECENT EXPERIENCE:
${[...state.assignments.slice(0,3).map(a=>`${a.dutyTitle} at ${a.base}: ${(a.accomplishments||'').slice(0,200)}`), ...state.civilianJobs.slice(0,2).map(j=>`${j.title} at ${j.company}: ${(j.accomplishments||'').slice(0,200)}`)].join('\n') || 'None'}

${sf.roleTypes ? `STANDING JOB PREFERENCES (use these to calibrate fit):
Target Roles: ${sf.roleTypes}
Target Domains: ${sf.domains || 'N/A'}
Geography: ${sf.geography || 'N/A'}
Seniority Target: ${sf.seniority || 'N/A'}
Hard Exclusions: ${sf.exclusions || 'None'}` : ''}`;

    const result = await callClaude(
      'You are a military-to-civilian career transition expert and hiring advisor. You give direct, opinionated assessments — not generic ones. You understand that military experience translates powerfully even when the exact civilian keywords are absent. Return valid JSON only.',
      `Analyze this job posting for a veteran. Be opinionated and specific about fit.

${veteranContext}

JOB POSTING:
${input}

Scoring philosophy:
- Score based on demonstrated CAPABILITY, not keyword matching alone
- Military leadership, operations, and program management translate broadly — credit it
- Never score below 50 purely for missing civilian buzzwords
- If standing filters are provided, weigh them heavily — a role that violates a hard exclusion should score very low regardless of other factors
- Security clearances are a SIGNIFICANT positive for cleared roles — call this out explicitly

Return ONLY this JSON (no markdown):
{
  "title": "extracted job title",
  "company": "company name",
  "location": "location or Remote",
  "clearance": "clearance requirement or empty string",
  "salaryRange": "salary if mentioned or empty string",
  "reqId": "req ID if found or empty string",
  "fitScore": <1-10>,
  "fitLabel": "Strong Fit / Good Fit / Moderate Fit / Weak Fit / Poor Fit",
  "seniority": "On-Target / Stretch / Too Senior / Too Junior",
  "worthYourTime": true or false,
  "assessment": "2-3 sentence plain-English fit explanation — be specific and direct, not generic",
  "whyItMatters": "One sentence on why this specific veteran should or shouldn't care about this role",
  "watchOut": "One red flag or concern to be aware of, or empty string if none",
  "transferableStrengths": ["2-3 specific military experiences that directly map to this role's needs"]
}`
    );
    
    let analysis;
    try { analysis = JSON.parse(result.replace(/```json|```/g, '').trim()); }
    catch(e) { throw new Error('Could not parse analysis. Try pasting the job description text instead of a URL.'); }
    
    // Auto-populate the add job form
    if (analysis.title) { const el = document.getElementById('nj-title'); if(el) el.value = analysis.title; }
    if (analysis.company) { const el = document.getElementById('nj-company'); if(el) el.value = analysis.company; }
    if (analysis.location) { const el = document.getElementById('nj-location'); if(el) el.value = analysis.location; }
    if (analysis.salaryRange) { const el = document.getElementById('nj-salaryRange'); if(el) el.value = analysis.salaryRange; }
    if (input.startsWith('http')) { const el = document.getElementById('nj-jobUrl'); if(el) el.value = input.split('\n')[0]; }
    let notesContent = '';
    if (analysis.clearance) notesContent += `Clearance Required: ${analysis.clearance}\n`;
    if (analysis.reqId) notesContent += `Req ID: ${analysis.reqId}\n`;
    if (analysis.watchOut) notesContent += `⚠️ ${analysis.watchOut}\n`;
    if (notesContent) { const el = document.getElementById('nj-notes'); if(el) el.value = notesContent.trim(); }
    
    setState({ ui: { ...state.ui, jobAnalyzing: false, jobAnalysisResult: analysis } });
    showToast('✓ Job analyzed and form auto-filled!');
  } catch(err) {
    setState({ ui: { ...state.ui, jobAnalyzing: false, jobAnalysisError: err.message } });
  }
}

