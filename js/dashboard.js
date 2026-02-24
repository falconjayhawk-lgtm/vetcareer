// ── Dashboard ─────────────────────────────────────────────────────────
function renderDashboard() {
  const p = state.profile;
  const active = state.jobs.filter(j=>['applied','interviewing'].includes(j.status)).length;
  const total = state.jobs.length;
  
  // Documents count as done if: files uploaded locally, OR profile was clearly populated from doc extraction
  const docsEffectivelyDone = state.documents.length > 0 || 
    state.documents.some(d => d.content && d.content.length > 0) ||
    !!(p.fullName && p.branch && p.rank && p.mosRate);
  const checks = [
    {label:'Upload your documents (DD-214, performance reports, resume)', autoDone: docsEffectivelyDone, view:'documents', priority:true},
    {label:'Complete your profile', autoDone:!!(p.fullName&&p.branch), view:'profile'},
    {label:'Review & edit your experience', autoDone:state.assignments.length>0 || state.civilianJobs.length>0, view:'experience'},
    {label:'Add jobs to tracker', autoDone:state.jobs.length>0, view:'jobs'},
    {label:'You\'re connected! AI features are ready to use.', autoDone:true, view:'dashboard'},
    {label:'Generate your LinkedIn profile', autoDone:false, view:'linkedin', manualOnly:true},
    {label:'Generate a tailored resume', autoDone:false, view:'resume', manualOnly:true},
    {label:'Run interview prep for a target job', autoDone:false, view:'interview', manualOnly:true},
    {label:'Get salary intelligence for a target role', autoDone:false, view:'salary', manualOnly:true},
    {label:'Generate a reference letter', autoDone:false, view:'refletter', manualOnly:true},
    {label:'Start your SF-86 prep', autoDone:!!(state.sf86?.residences?.length), view:'sf86', manualOnly:false},
    {label:'Review gap analysis', autoDone:false, view:'gap', manualOnly:true},
  ];

  // Merge auto-done status with manual checks
  const checksWithStatus = checks.map(c => ({
    ...c,
    done: c.autoDone || !!state.checklist[c.label]
  }));

  const pct = Math.round(checksWithStatus.filter(c=>c.done).length/checksWithStatus.length*100);
  const doneCount = checksWithStatus.filter(c=>c.done).length;
  const totalCount = checksWithStatus.length;
  const name = p.fullName ? ', ' + p.fullName.split(' ')[0] : '';
  const isNewUser = state.documents.length === 0 && !p.fullName && state.assignments.length === 0;
  
  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 20px">Welcome back${name}! 👋</h1>
    
    ${isNewUser ? `
    <div class="card" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #3b82f6">
      <h2 style="color:#1e40af">🚀 Get Started in 3 Steps</h2>
      <div style="font-size:14px;color:#1e3a8a;line-height:1.7">
        <strong>1. Upload Documents</strong> — Start with your DD-214, performance reports, or civilian resume. Claude will auto-fill everything.<br>
        <strong>2. Review & Fill Gaps</strong> — Check your Profile and Experience pages, add anything missing.<br>
        <strong>3. Build Resumes</strong> — Add jobs to your tracker, then let Claude write tailored resumes for each one.
      </div>
      <button class="btn btn-primary" onclick="setState({view:'documents'})" style="margin-top:12px;padding:10px 20px">📤 Start: Upload Documents</button>
    </div>` : ''}
    
    <div class="grid3" style="margin-bottom:20px">
      ${[['Active Applications',active+'/'+total,'#2563eb'],['Profile Complete',pct+'%',pct===100?'#16a34a':'#ca8a04'],['Documents',state.documents.length + (state.documents.length>0?' ✓':''),'#7c3aed']].map(([l,v,c])=>`
        <div class="card" style="margin-bottom:0;text-align:center">
          <div style="font-size:32px;font-weight:800;color:${c}">${v}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px">${l}</div>
        </div>`).join('')}
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h2 style="margin:0">Getting Started Checklist</h2>
        <span style="font-size:13px;font-weight:700;color:${pct===100?'#16a34a':'#4b5563'}">${doneCount}/${totalCount} complete</span>
      </div>
      <div style="height:8px;background:#e5e7eb;border-radius:4px;margin-bottom:16px;overflow:hidden">
        <div style="height:8px;border-radius:4px;background:${pct===100?'linear-gradient(90deg,#22c55e,#16a34a)':pct>=60?'linear-gradient(90deg,#3b82f6,#2563eb)':'linear-gradient(90deg,#f59e0b,#d97706)'};width:${pct}%;transition:width 0.4s ease"></div>
      </div>
      ${checksWithStatus.map(c=>`
        <div class="checklist-item${c.done?' done':''}" onclick="${c.done?'':''}${c.manualOnly?`toggleChecklistItem('${c.label}')`:c.done?'':`setState({view:'${c.view}'})`}" style="${c.priority&&!c.done?'border-color:#3b82f6;background:#eff6ff;':''}" >
          <div class="check-circle${c.done?' done':' todo'}" ${c.manualOnly&&!c.done?`onclick="event.stopPropagation();toggleChecklistItem('${c.label}')"`:''}>${c.done?'✓':c.priority?'!':''}</div>
          <span style="${c.done?'text-decoration:line-through;color:#9ca3af':c.priority&&!c.done?'font-weight:600;color:#1e40af':''}">${c.label}</span>
          ${!c.done&&!c.manualOnly?'<span style="margin-left:auto;color:#93c5fd;font-size:12px">→ Go</span>':''}
          ${c.manualOnly&&!c.done?'<span style="margin-left:auto;color:#9ca3af;font-size:11px;font-style:italic">Click to mark done</span>':''}
        </div>`).join('')}
      ${pct===100?`<div style="text-align:center;padding:12px;background:#f0fdf4;border-radius:8px;margin-top:8px;color:#16a34a;font-weight:700">🎉 You've completed the setup checklist! Your profile is ready.</div>`:''}
    </div>`;
}

function toggleChecklistItem(label) {
  const current = state.checklist[label] || false;
  setState({ checklist: { ...state.checklist, [label]: !current } });
}

