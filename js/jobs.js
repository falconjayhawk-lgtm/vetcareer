// ── Job Tracker ───────────────────────────────────────────────────────
function renderJobs() {
  const jobTab = state.ui.jobTab || 'standard';
  const airlineOn = typeof isAirlinePath === 'function' && isAirlinePath();

  // Tab bar — airline tab only visible when airline path is active
  const tabBar = `
    <div style="display:flex;gap:0;margin-bottom:20px;border-radius:2px;overflow:hidden;border:1.5px solid var(--rule-dark);width:fit-content">
      <button onclick="toggleUI('jobTab','standard')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${jobTab==='standard'?'var(--accent)':'white'};color:${jobTab==='standard'?'white':'var(--muted)'};transition:all 0.15s">💼 STANDARD JOBS</button>
      ${airlineOn ? `<button onclick="toggleUI('jobTab','airline')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${jobTab==='airline'?'var(--accent)':'white'};color:${jobTab==='airline'?'white':'var(--muted)'};transition:all 0.15s;border-left:1.5px solid var(--rule-dark)">✈️ AIRLINE APPS</button>` : ''}
    </div>`;

  // Route to airline tracker when that tab is active
  if (jobTab === 'airline' && airlineOn) {
    return `
      <h1 style="font-size:24px;font-weight:800;margin:0 0 16px">Job Tracker</h1>
      ${tabBar}
      ${typeof renderAirlineJobs === 'function' ? renderAirlineJobs() : '<p style="color:var(--muted)">Loading airline tracker...</p>'}`;
  }

  // ── Standard job tracker below ────────────────────────────────────
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
          <div class="field"><label class="field-label">Contact Name</label><input id="${pre}-contactName" value="${esc(j.contactName||'')}" placeholder="Recruiter or hiring manager name"></div>
          <div class="field"><label class="field-label">Salary Offered</label><input id="${pre}-salaryOffered" value="${esc(j.salaryOffered||'')}" placeholder="e.g. $115,000 + 10% bonus"></div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px">
          <div style="font-weight:700;font-size:13px;color:#374151;margin-bottom:10px">🔍 Pipeline Intelligence</div>
          <div class="grid2">
            <div class="field"><label class="field-label">Hiring Manager</label><input id="${pre}-hiringManager" value="${esc(j.hiringManager||'')}" placeholder="Name / title if known"></div>
            <div class="field"><label class="field-label">Team Size</label><input id="${pre}-teamSize" value="${esc(j.teamSize||'')}" placeholder="e.g. 8-person BD team"></div>
            <div class="field"><label class="field-label">Budget / Contract Cycle</label><input id="${pre}-budgetCycle" value="${esc(j.budgetCycle||'')}" placeholder="e.g. FY26 budget, IDIQ, open headcount"></div>
            <div class="field"><label class="field-label">Referral / Warm Intro</label><input id="${pre}-warmIntro" value="${esc(j.warmIntro||'')}" placeholder="Name of connection, if any"></div>
          </div>
        </div>

        <div class="field"><label class="field-label">Interview Dates & Details</label><textarea id="${pre}-interviewDates" rows="2" placeholder="Phone screen: 2/15 @ 2pm">${esc(j.interviewDates||'')}</textarea></div>
        <div class="field"><label class="field-label">Notes</label><textarea id="${pre}-notes" rows="3" placeholder="Key requirements, culture, follow-ups...">${esc(j.notes||'')}</textarea></div>

        ${job && (job.status === 'rejected' || job.status === 'withdrawn') ? `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:14px">
          <div style="font-weight:700;font-size:13px;color:#991b1b;margin-bottom:8px">📋 Loss Library — What Happened?</div>
          <div class="field" style="margin-bottom:8px">
            <label class="field-label">Rejection Reason</label>
            <select id="${pre}-rejectionReason">
              <option value="">Select reason...</option>
              ${['No response','Resume screened out','Phone screen failed','Interview — cultural fit','Interview — technical gap','Interview — salary mismatch','Offer declined by me','Position filled internally','Req cancelled','Overqualified','Underqualified','Unknown'].map(r=>`<option value="${r}" ${j.rejectionReason===r?'selected':''}>${r}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label">Lessons Learned</label>
            <textarea id="${pre}-lessonsLearned" rows="3" placeholder="What would you do differently? What did you learn about this company, role, or your approach?">${esc(j.lessonsLearned||'')}</textarea>
          </div>
        </div>
        ` : ''}

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
    const log = (j.activityLog||[]).slice().reverse();
    const showLog = state.ui[`showLog_${j.id}`] || false;
    return `
      <div class="card" style="margin-bottom:12px;border-left:4px solid ${STATUS_COLORS[j.status]||'#e5e7eb'}">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
              <span style="font-weight:700;font-size:16px">${esc(j.title)}</span> ${statusBadge(j.status)}
              ${j.scorecard ? (() => {
                const g = j.scorecard.grade || 'C';
                const cfg = {A:{color:'var(--green)',bg:'var(--green-light)'},B:{color:'#2563eb',bg:'#eff6ff'},C:{color:'var(--gold)',bg:'var(--gold-light)'},D:{color:'#e65100',bg:'#fff3e0'},F:{color:'var(--red)',bg:'var(--red-light)'}};
                const c = cfg[g]||cfg['C'];
                return `<span style="background:${c.bg};color:${c.color};border:1.5px solid ${c.color}60;border-radius:2px;padding:2px 10px;font-size:12px;font-weight:800;font-family:'Familjen Grotesk',sans-serif">Grade ${g} — ${esc(j.scorecard.verdict||'')}</span>`;
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
          ${['interviewing','offered','rejected','withdrawn'].includes(j.status) ? `
            <button onclick="setState({view:'debrief',ui:{...state.ui,debriefJobId:'${j.id}',activeDebriefId:null,debriefAdding:false}})"
              style="background:#faf5ff;color:#7c3aed;border:1px solid #ddd6fe;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;cursor:pointer">
              📝 ${(j.debriefs||[]).length > 0 ? `${j.debriefs.length} Debrief${j.debriefs.length>1?'s':''}` : 'Debrief'}
            </button>
          ` : ''}
        </div>

        <!-- Company research button -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          ${j.companyResearch ? `
            <button onclick="toggleUI('showResearch_${j.id}',!state.ui['showResearch_${j.id}'])"
              style="background:#f0fdf4;color:#15803d;border:1px solid #86efac;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;cursor:pointer">
              🔍 Research ${state.ui['showResearch_${j.id}'] ? '▼' : '▶'}
            </button>` : `
            <button onclick="researchCompany('${j.id}')" ${state.ui["researching_${j.id}"]?'disabled':''}
              style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600;cursor:pointer">
              ${state.ui["researching_${j.id}"]?'🔍 Researching...':'🔍 Research Company'}
            </button>`}
        </div>

        <!-- Research results (collapsible) -->
        ${j.companyResearch && state.ui['showResearch_${j.id}'] ? `
        <div style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:12px;margin-top:8px">
          <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:8px">
            Company Intelligence · ${new Date(j.companyResearch.fetchedAt).toLocaleDateString()}
          </div>
          <div style="font-size:13px;color:var(--text);line-height:1.75;white-space:pre-line">${esc(j.companyResearch.data)}</div>
          <button onclick="researchCompany('${j.id}')" style="background:none;border:none;color:var(--muted);font-size:11px;cursor:pointer;margin-top:8px">🔄 Refresh</button>
        </div>` : ''}

        ${(j.hiringManager||j.teamSize||j.budgetCycle||j.warmIntro||j.salaryOffered) ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          ${j.salaryOffered?`<span style="background:#f0fdf4;color:#15803d;border:1px solid #86efac;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600">💰 ${esc(j.salaryOffered)}</span>`:''}
          ${j.hiringManager?`<span style="background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;border-radius:999px;padding:2px 8px;font-size:11px">👤 ${esc(j.hiringManager)}</span>`:''}
          ${j.teamSize?`<span style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:999px;padding:2px 8px;font-size:11px">👥 ${esc(j.teamSize)}</span>`:''}
          ${j.budgetCycle?`<span style="background:#fffbeb;color:#92400e;border:1px solid #fde68a;border-radius:999px;padding:2px 8px;font-size:11px">📅 ${esc(j.budgetCycle)}</span>`:''}
          ${j.warmIntro?`<span style="background:#fdf2f8;color:#9d174d;border:1px solid #fbcfe8;border-radius:999px;padding:2px 8px;font-size:11px">🤝 Via ${esc(j.warmIntro)}</span>`:''}
        </div>` : ''}

        ${j.notes?`<div style="background:#f9fafb;border-radius:6px;padding:8px;font-size:12px;margin-top:8px;color:#374151">${esc(j.notes)}</div>`:''}

        ${(j.status==='rejected'||j.status==='withdrawn') ? `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;margin-top:8px">
          <div style="font-size:11px;font-weight:700;color:#991b1b;margin-bottom:4px">📋 LOSS LIBRARY</div>
          ${j.rejectionReason?`<div style="font-size:12px;color:#7f1d1d;margin-bottom:2px"><strong>Reason:</strong> ${esc(j.rejectionReason)}</div>`:`<div style="font-size:12px;color:#9ca3af;font-style:italic">No rejection reason recorded — <button onclick="toggleUI('editJobId','${j.id}')" style="background:none;border:none;color:#2563eb;font-size:12px;cursor:pointer;padding:0">edit to add</button></div>`}
          ${j.lessonsLearned?`<div style="font-size:12px;color:#7f1d1d;margin-top:4px"><strong>Lessons:</strong> ${esc(j.lessonsLearned)}</div>`:''}
        </div>` : ''}

        ${NEXT_STATUS[j.status]?`
        <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:12px;color:#6b7280">Move to:</span>
          ${Object.entries(STATUS_COLORS).filter(([s])=>s!==j.status&&s!=='withdrawn').map(([s,c])=>`
            <button onclick="quickStatusChange('${j.id}','${s}')" style="background:${c}18;color:${c};border:1px solid ${c}40;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s">${s}</button>
          `).join('')}
        </div>`:''}

        <div style="margin-top:10px;display:flex;gap:6px">
          <input id="note-input-${j.id}" placeholder="Add a note — interview feedback, next steps, contact info..." style="font-size:12px;padding:6px 10px;flex:1">
          <button class="btn btn-secondary btn-sm" onclick="addActivityNote('${j.id}')">+ Note</button>
        </div>

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
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h1 style="font-size:24px;font-weight:800;margin:0">Job Tracker</h1>
      <button class="btn btn-primary" onclick="toggleUI('addJob',true);toggleUI('jobAnalysisResult',null)">+ Add Job</button>
    </div>
    ${tabBar}
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
    salaryOffered:document.getElementById(pre+'-salaryOffered')?.value || '',
    hiringManager:document.getElementById(pre+'-hiringManager')?.value || '',
    teamSize:document.getElementById(pre+'-teamSize')?.value || '',
    budgetCycle:document.getElementById(pre+'-budgetCycle')?.value || '',
    warmIntro:document.getElementById(pre+'-warmIntro')?.value || '',
    rejectionReason: '',
    lessonsLearned: '',
    scorecard: state.ui.jobAnalysisResult?.scorecard || null,
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
    salaryOffered:document.getElementById(pre+'-salaryOffered')?.value || existing?.salaryOffered || '',
    hiringManager:document.getElementById(pre+'-hiringManager')?.value || existing?.hiringManager || '',
    teamSize:document.getElementById(pre+'-teamSize')?.value || existing?.teamSize || '',
    budgetCycle:document.getElementById(pre+'-budgetCycle')?.value || existing?.budgetCycle || '',
    warmIntro:document.getElementById(pre+'-warmIntro')?.value || existing?.warmIntro || '',
    rejectionReason:document.getElementById(pre+'-rejectionReason')?.value || existing?.rejectionReason || '',
    lessonsLearned:document.getElementById(pre+'-lessonsLearned')?.value || existing?.lessonsLearned || '',
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

async function researchCompany(jid) {
  const job = state.jobs.find(j => j.id === jid);
  if (!job) return;
  setState({ ui: { ...state.ui, [`researching_${jid}`]: true } }, false);

  // Optimistically update the card button
  const btn = document.querySelector(`[onclick="researchCompany('${jid}')"]`);
  if (btn) btn.textContent = '🔍 Researching...';

  const p = state.profile;
  try {
    const raw = await callClaude(
      `You are a career intelligence researcher who helps veterans evaluate companies before applying or interviewing. You give direct, useful information — not generic overviews. You flag things that matter specifically to a transitioning military veteran.`,
      `Research this company for a transitioning military veteran.

COMPANY: ${job.company}
ROLE: ${job.title}
VETERAN: ${p.branch||'Military'} | ${p.rank||'N/A'} | ${p.yearsOfService||'N/A'} years | Clearance: ${p.clearance||'None'}

Provide intelligence across these areas (use clear section headers, keep each section to 2-4 sentences, be specific not generic):

**Company Overview**
Size, industry, business model, recent trajectory.

**Veteran & Military Hiring**
Do they actively recruit veterans? Any veteran affinity groups, veteran hiring programs, military-friendly reputation? Is this a cleared environment?

**Culture & Work Environment**
What's the actual culture like? Pace, hierarchy, autonomy. How do former military typically describe the adjustment?

**Recent News & Stability**
Any recent layoffs, contract wins/losses, leadership changes, financial news, or major developments in the past 12 months that affect whether to pursue this role.

**Insider Tips**
1-2 specific things a veteran should know before interviewing here that aren't obvious from the job posting.

Keep each section specific and direct. Skip anything you don't have good information on rather than writing vague generalities.`
    );

    const updatedJobs = state.jobs.map(j =>
      j.id === jid
        ? { ...j, companyResearch: { data: raw.trim(), fetchedAt: new Date().toISOString() } }
        : j
    );
    setState({
      jobs: updatedJobs,
      ui: { ...state.ui, [`researching_${jid}`]: false, [`showResearch_${jid}`]: true }
    });
    if (typeof trackAction === 'function') trackAction('company_research');
    showToast(`✓ ${job.company} researched`);
  } catch(err) {
    setState({ ui: { ...state.ui, [`researching_${jid}`]: false } });
    showToast('Research failed: ' + err.message, false);
  }
}

function removeJob(jid) { if(confirm('Delete this job?')) setState({ jobs: state.jobs.filter(j=>j.id!==jid) }); }

async function analyzeJobPosting() {
  const input = document.getElementById('job-analysis-input')?.value?.trim();
  if (!input) { showToast('Please paste a job URL or description', false); return; }
  setState({ ui: { ...state.ui, jobAnalyzing: true, jobAnalysisError: '', jobAnalysisResult: null } });
  try {
    const p  = state.profile;
    const sf = state.scoutFilters;

    const veteranContext = `VETERAN PROFILE:
Branch: ${p.branch||'N/A'} | Rank: ${p.rank||'N/A'} | Years: ${p.yearsOfService||'N/A'} | MOS: ${p.mosRate||'N/A'}
Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Location: ${p.location||'N/A'} | Willing to relocate: ${p.willingToRelocate||'Unknown'}
Target salary: ${p.targetSalary||sf?.salary||'Not specified'}
Technical Skills: ${(p.technicalSkills||[]).join(', ')||'None'}
Soft Skills: ${(p.softSkills||[]).join(', ')||'None'}
Target Industries: ${(p.targetIndustries||[]).map(i=>typeof i==='object'?i.name:i).join(', ')||'Not specified'}
Target Roles: ${sf?.roleTypes||'Not specified'} | Seniority: ${sf?.seniority||'Not specified'}
Hard Exclusions: ${sf?.exclusions||'None'}

RECENT EXPERIENCE:
${[...state.assignments.slice(0,3).map(a=>`${a.dutyTitle} at ${a.base}: ${(a.accomplishments||'').slice(0,250)}`),
   ...state.civilianJobs.slice(0,2).map(j=>`${j.title} at ${j.company}: ${(j.accomplishments||'').slice(0,200)}`)
].join('\n')||'None'}`;

    const result = await callClaude(
      `You are a military-to-civilian career transition expert and hiring advisor with deep knowledge of defense, federal, and commercial hiring. You evaluate job fit across 10 weighted dimensions and give direct, opinionated assessments. Scores of 1-5 per dimension. Return valid JSON only.`,
      `Score this job posting for the veteran below across 10 dimensions. Be specific and direct in each insight.

${veteranContext}

JOB POSTING:
${input.slice(0, 4000)}

SCORING DIMENSIONS AND WEIGHTS:
1. role_fit (weight 20) — Does title/function match their experience level and background?
2. skills_match (weight 20) — Required skills vs. their actual skill inventory?
3. clearance_fit (weight 15) — Required clearance vs. held clearance and status?
4. comp_fit (weight 10) — Posted/implied comp vs. their target and military equivalent?
5. seniority_fit (weight 10) — Is the level/grade a match, stretch, or mismatch?
6. location_fit (weight 8) — Location/remote compatibility with their situation?
7. industry_fit (weight 7) — Does their military background translate to this industry?
8. veteran_culture (weight 5) — Company's known track record with veterans and military hires?
9. growth_potential (weight 3) — Does this role position them well for career advancement?
10. ats_match (weight 2) — Does their likely resume language match the posting keywords?

GRADE SCALE: A=85-100, B=70-84, C=55-69, D=40-54, F=below 40
Composite = sum(score/5 * weight) for all dimensions

Return ONLY this JSON (no markdown):
{
  "title": "extracted job title",
  "company": "extracted company",
  "location": "extracted location",
  "clearance": "clearance requirement or empty string",
  "salaryRange": "extracted salary or empty string",
  "reqId": "req/job ID if present or empty string",
  "scorecard": {
    "grade": "A|B|C|D|F",
    "composite": <0-100 number>,
    "recommendation": "yes|caution|no",
    "verdict": "5-8 word verdict e.g. Strong match — apply this week",
    "dimensions": [
      {"id":"role_fit","label":"Role / Title Fit","score":<1-5>,"weight":20,"insight":"One specific sentence. Reference actual job title and their rank/role."},
      {"id":"skills_match","label":"Skills Match","score":<1-5>,"weight":20,"insight":"One specific sentence. Name the matching and missing skills."},
      {"id":"clearance_fit","label":"Clearance Alignment","score":<1-5>,"weight":15,"insight":"One specific sentence. State required vs. held."},
      {"id":"comp_fit","label":"Compensation Fit","score":<1-5>,"weight":10,"insight":"One specific sentence. Reference actual numbers if available."},
      {"id":"seniority_fit","label":"Seniority / Level","score":<1-5>,"weight":10,"insight":"One specific sentence. On-target, stretch, or mismatch?"},
      {"id":"location_fit","label":"Location / Remote","score":<1-5>,"weight":8,"insight":"One specific sentence."},
      {"id":"industry_fit","label":"Industry Fit","score":<1-5>,"weight":7,"insight":"One specific sentence. How does military experience translate here?"},
      {"id":"veteran_culture","label":"Veteran-Friendly Culture","score":<1-5>,"weight":5,"insight":"One specific sentence. What is this company's veteran hiring reputation?"},
      {"id":"growth_potential","label":"Growth Potential","score":<1-5>,"weight":3,"insight":"One specific sentence."},
      {"id":"ats_match","label":"Resume Keyword Match","score":<1-5>,"weight":2,"insight":"One specific sentence. List 2-3 keywords from the posting."}
    ],
    "strengths": ["2-3 specific veteran leverage points for this role"],
    "gaps": ["2-3 specific gaps or things to address"],
    "applyAdvice": "2-3 sentences of direct apply advice — what to lead with, what to address, whether to apply at all."
  }
}`
    );

    let analysis;
    try {
      analysis = typeof extractJSON === 'function'
        ? extractJSON(result)
        : JSON.parse(result.replace(/```json|```/g,'').trim());
    } catch(e) { throw new Error('Could not parse analysis. Try pasting the full job description text instead of a URL.'); }

    // Auto-fill the form fields
    if (analysis.title)      { const el = document.getElementById('nj-title');      if(el) el.value = analysis.title; }
    if (analysis.company)    { const el = document.getElementById('nj-company');    if(el) el.value = analysis.company; }
    if (analysis.location)   { const el = document.getElementById('nj-location');   if(el) el.value = analysis.location; }
    if (analysis.salaryRange){ const el = document.getElementById('nj-salaryRange');if(el) el.value = analysis.salaryRange; }
    if (input.startsWith('http')) { const el = document.getElementById('nj-jobUrl'); if(el) el.value = input.split('\n')[0]; }
    let notesContent = '';
    if (analysis.clearance) notesContent += `Clearance Required: ${analysis.clearance}\n`;
    if (analysis.reqId)     notesContent += `Req ID: ${analysis.reqId}\n`;
    const gaps = analysis.scorecard?.gaps;
    if (gaps?.length) notesContent += `Gaps to address: ${gaps.join('; ')}\n`;
    if (notesContent) { const el = document.getElementById('nj-notes'); if(el) el.value = notesContent.trim(); }

    setState({ ui: { ...state.ui, jobAnalyzing: false, jobAnalysisResult: analysis } });
    if (typeof trackAction === 'function') trackAction('job_analyze');
    showToast('✓ Job scored — see your A-F scorecard below');
  } catch(err) {
    setState({ ui: { ...state.ui, jobAnalyzing: false, jobAnalysisError: err.message } });
  }
}

// ── Scorecard panel renderer ──────────────────────────────────────────

function renderScorecardPanel(analysis) {
  const sc = analysis?.scorecard;
  if (!sc) return '';

  const grade     = sc.grade || 'C';
  const composite = sc.composite || 0;
  const gradeCfg  = {
    A: { color:'var(--green)',  bg:'var(--green-light)', border:'#c8e6cd', label:'Apply immediately' },
    B: { color:'#2563eb',      bg:'#eff6ff',            border:'#bfdbfe', label:'Strong — apply this week' },
    C: { color:'var(--gold)',  bg:'var(--gold-light)',  border:'#e8d5a0', label:'Worth a shot — address gaps' },
    D: { color:'#e65100',      bg:'#fff3e0',            border:'#ffcc80', label:'Stretch — apply if passionate' },
    F: { color:'var(--red)',   bg:'var(--red-light)',   border:'#e8c0c0', label:'Not the right fit right now' }
  };
  const gc = gradeCfg[grade] || gradeCfg['C'];

  const dimColors = { 5:'var(--green)', 4:'#16a34a', 3:'var(--gold)', 2:'#e65100', 1:'var(--red)' };

  return `
    <div style="border:2px solid ${gc.border};border-radius:2px;padding:18px;margin-bottom:16px;background:${gc.bg}">

      <!-- Header: grade + verdict -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-wrap:wrap">
        <div style="width:72px;height:72px;border-radius:2px;background:${gc.color};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
          <div style="font-size:36px;font-weight:800;color:white;font-family:'Familjen Grotesk',sans-serif;line-height:1">${grade}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.7);font-family:'Familjen Grotesk',sans-serif">${composite}/100</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:16px;color:${gc.color};font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">${esc(sc.verdict||gc.label)}</div>
          <div style="font-size:13px;color:var(--text);line-height:1.6">${esc(sc.applyAdvice||'')}</div>
        </div>
      </div>

      <!-- Dimension bars -->
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
        ${(sc.dimensions||[]).map(d => {
          const score = d.score || 1;
          const pct   = Math.round((score/5)*100);
          const color = dimColors[score] || dimColors[3];
          return `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">
              <div style="font-size:11px;font-weight:700;color:var(--text);font-family:'Familjen Grotesk',sans-serif">${esc(d.label)}</div>
              <div style="font-size:10px;color:var(--muted);white-space:nowrap;margin-left:8px">${score}/5 · ${d.weight}%</div>
            </div>
            <div style="height:5px;background:var(--rule);border-radius:3px;overflow:hidden;margin-bottom:2px">
              <div style="height:5px;background:${color};width:${pct}%;border-radius:3px"></div>
            </div>
            <div style="font-size:11px;color:var(--muted);line-height:1.4">${esc(d.insight||'')}</div>
          </div>`;
        }).join('')}
      </div>

      <!-- Strengths + Gaps -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        ${(sc.strengths||[]).length ? `
        <div style="background:white;border-radius:2px;padding:10px;border:1px solid #c8e6cd">
          <div style="font-size:10px;font-weight:700;color:var(--green);font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Your Leverage</div>
          ${sc.strengths.map(s=>`<div style="font-size:12px;color:var(--text);margin-bottom:3px">✓ ${esc(s)}</div>`).join('')}
        </div>` : ''}
        ${(sc.gaps||[]).length ? `
        <div style="background:white;border-radius:2px;padding:10px;border:1px solid #e8d5a0">
          <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Address These</div>
          ${sc.gaps.map(g=>`<div style="font-size:12px;color:var(--text);margin-bottom:3px">⚠ ${esc(g)}</div>`).join('')}
        </div>` : ''}
      </div>

      <button class="btn btn-secondary btn-sm" onclick="toggleUI('jobAnalysisResult',null)">Clear Analysis</button>
    </div>`;
}
