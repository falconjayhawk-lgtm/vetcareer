// ── Gap Analysis ──────────────────────────────────────────────────────
function renderGap() {
  const p = state.profile;
  const gaps = [], good = [];

  if (!p?.fullName) gaps.push({sev:'high',area:'Profile',issue:'Name not entered',fix:'Go to Profile and enter your name'});
  else good.push('Profile started');
  if (!p?.elevatorPitch) gaps.push({sev:'high',area:'Profile',issue:'No professional summary written',fix:'Add an elevator pitch in Profile — the first thing hiring managers read'});
  else good.push('Professional summary written');
  if (!p?.mosRate) gaps.push({sev:'low',area:'Profile',issue:'MOS/Rate not specified',fix:'Add your military specialty code'});
  if (!(p?.technicalSkills?.length)) gaps.push({sev:'medium',area:'Skills',issue:'No technical skills listed',fix:'Add technical skills in Profile → Skills'});
  else good.push(`${p.technicalSkills.length} technical skill(s) listed`);
  if (!(p?.softSkills?.length)) gaps.push({sev:'medium',area:'Skills',issue:'No leadership/soft skills listed',fix:'Add leadership skills in Profile → Skills'});
  if (!p?.education) gaps.push({sev:'low',area:'Education',issue:'Education not filled in',fix:'Add education — military training counts too'});
  else good.push('Education on file');
  if (!p?.certifications) gaps.push({sev:'low',area:'Certs',issue:'No certifications listed',fix:'Add certifications — even military ones like PMP, Security+'});
  else good.push('Certifications listed');
  good.push('AI features ready ✓');
  if (state.assignments.length===0) gaps.push({sev:'high',area:'Experience',issue:'No assignment history added',fix:'Go to Experience → add your military assignments'});
  else good.push(`${state.assignments.length} assignment(s) on record`);
  const noAccomp = state.assignments.filter(a=>!a.accomplishments?.trim());
  if (noAccomp.length>0) gaps.push({sev:'high',area:'Experience',issue:`${noAccomp.length} assignment(s) missing accomplishments`,fix:'Edit each assignment — add 3–5 bullets with numbers (team size, budget, % improvement)'});
  const noMetrics = state.assignments.filter(a=>a.accomplishments&&!/\d/.test(a.accomplishments));
  if (noMetrics.length>0) gaps.push({sev:'medium',area:'Experience',issue:`${noMetrics.length} assignment(s) have bullets but no numbers`,fix:'Quantify: "Led 12-person team" beats "Led a team"'});
  if (state.awards.length===0) gaps.push({sev:'medium',area:'Awards',issue:'No awards or decorations added',fix:'Add awards in Profile → Awards section'});
  else good.push(`${state.awards.length} award(s) listed`);
  const noTrans = state.awards.filter(a=>!a.civilianTranslation);
  if (noTrans.length>0) gaps.push({sev:'medium',area:'Awards',issue:`${noTrans.length} award(s) missing civilian translation`,fix:"Edit each award — hiring managers don't know what ARCOM means"});
  if (state.jobs.length===0) gaps.push({sev:'medium',area:'Jobs',issue:'No jobs in tracker',fix:'Add jobs to the Job Tracker — needed to generate tailored resumes'});
  else good.push(`${state.jobs.length} job(s) tracked`);
  if (state.civilianJobs.length>0) good.push(`${state.civilianJobs.length} civilian job(s) added`);
  if (p?.clearance&&p?.clearanceStatus==='Active') good.push(`Active ${p.clearance} clearance — high value`);

  const hi=gaps.filter(g=>g.sev==='high'), med=gaps.filter(g=>g.sev==='medium'), lo=gaps.filter(g=>g.sev==='low');
  const score = Math.max(0, 100-hi.length*20-med.length*8-lo.length*3);
  const scoreGrad = score>=80?'linear-gradient(135deg,#22c55e,#16a34a)':score>=50?'linear-gradient(135deg,#f59e0b,#d97706)':'linear-gradient(135deg,#ef4444,#dc2626)';

  const gapHtml = (list, cls, label, tag) => list.length===0?'':`
    <div class="card">
      <h2>${label}</h2>
      ${list.map(g=>`<div class="${cls}"><div style="display:flex;justify-content:space-between"><div><span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">${g.area}</span><div style="font-weight:600;font-size:14px;margin:2px 0">${esc(g.issue)}</div><div style="font-size:13px;color:#4b5563">💡 ${esc(g.fix)}</div></div><span class="badge" style="${tag}">${g.sev.toUpperCase()}</span></div></div>`).join('')}
    </div>`;

  // Smarter skill matching — considers transferable equivalents, not just exact string matches
  // Maps civilian certifications/tools to military equivalents that indicate the same competency
  const TRANSFERABLE_EQUIVALENTS = {
    'PMP': ['program manager','project officer','operations officer','XO','executive officer','OIC','officer in charge'],
    'Agile': ['rapid planning','sprint','iterative','quick reaction','adaptive planning'],
    'Security+': ['cybersecurity','information security','IA','information assurance','ISSO','ISSM','cyber'],
    'CISSP': ['cybersecurity','information security','IA officer','information assurance','cyber operations'],
    'SAP': ['supply','logistics','property book','accountable officer','S4','G4'],
    'Six Sigma': ['lean','process improvement','PDCA','efficiency','waste reduction','kaizen'],
    'OSHA': ['safety officer','safety NCO','ground safety','flight safety','safety program'],
    'FAR/DFARS': ['contracting','acquisition','AFAR','government contracting','contracting officer'],
    'AWS': ['cloud','azure','cloud computing','infrastructure','IT systems','server'],
    'Budget Management': ['resource manager','resource management','RM','fiscal','funds','financial management','S8','G8'],
    'Program Management': ['program manager','PEO','product manager','project officer','program office'],
    'Risk Management': ['risk','threat assessment','vulnerability','risk mitigation','safety','hazard'],
    'Change Management': ['transformation','reorganization','reorg','restructure','transition','standup'],
    'Talent Acquisition': ['recruiting','recruiter','accessions','AMEDD','talent management'],
    'Community Policing': ['law enforcement','MP','military police','provost marshal','security forces','OSI','CID'],
    'ICS/NIMS': ['incident command','EOC','emergency operations','FEMA','first responder','emergency management'],
    'Grant Writing': ['resource acquisition','funding','budget justification','congressional','appropriations'],
  };

  function hasTransferableSkill(skillName, profileText) {
    const lower = profileText.toLowerCase();
    // Direct match
    if (lower.includes(skillName.toLowerCase())) return true;
    // Transferable equivalent match
    const equivalents = TRANSFERABLE_EQUIVALENTS[skillName] || [];
    return equivalents.some(eq => lower.includes(eq.toLowerCase()));
  }

  const allExperienceText = [
    ...(p.technicalSkills||[]),
    p.certifications||'',
    p.training||'',
    p.mosRate||'',
    ...state.assignments.map(a=>{
      const roleText = (a.roles||[]).map(r=>`${r.title||''} ${r.accomplishments||''}`).join(' ');
      return `${a.dutyTitle||''} ${a.description||''} ${a.accomplishments||''} ${roleText}`;
    }),
    ...state.civilianJobs.map(j=>`${j.title||''} ${j.description||''} ${j.accomplishments||''}`),
  ].join(' ');

  const industryGaps = (p?.targetIndustries||[]).map(ind=>{
    const industryName = typeof ind === 'string' ? ind : ind.name;
    const subType = typeof ind === 'object' ? ind.subType : null;
    const recs = SKILL_RECS[industryName]||[];
    const label = subType ? `${industryName} — ${subType}` : industryName;

    const covered = recs.filter(s => hasTransferableSkill(s, allExperienceText));
    const missing = recs.filter(s => !hasTransferableSkill(s, allExperienceText));

    return `<div style="padding:14px;background:#f9fafb;border-radius:8px;margin-bottom:10px;border:1px solid #e5e7eb">
      <div style="font-weight:700;font-size:14px;margin-bottom:8px">🎯 ${esc(label)}</div>
      ${covered.length>0?`
        <div style="font-size:11px;font-weight:700;color:#16a34a;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">✓ Covered (including transferable skills)</div>
        <div style="margin-bottom:8px">${covered.map(s=>`<span class="tag" style="background:#dcfce7;color:#15803d">${esc(s)}</span>`).join('')}</div>`:''}
      ${missing.length>0?`
        <div style="font-size:11px;font-weight:700;color:#d97706;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Consider Adding or Obtaining</div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px">These would strengthen your candidacy — some may be formal certs, others just adding the right keywords.</div>
        <div>${missing.map(s=>`<span class="tag tag-orange">${esc(s)}</span>`).join('')}</div>`:''}
      ${missing.length===0?'<div style="color:#16a34a;font-size:13px;font-weight:600">✅ Strong skill coverage for this path</div>':''}
    </div>`;
  }).join('');

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 20px">Gap Analysis</h1>
    <div class="card">
      <h2>Resume Readiness Score</h2>
      <div style="display:flex;gap:24px;align-items:center">
        <div class="score-circle" style="background:${scoreGrad}">
          <span style="font-size:32px;font-weight:800">${score}</span><span style="font-size:11px">/ 100</span>
        </div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:17px;margin-bottom:6px">${score>=80?'✅ Ready to Apply':score>=50?'⚠️ Needs Work':'🔴 Significant Gaps'}</div>
          <div style="font-size:13px;color:#4b5563;margin-bottom:10px">${score>=80?'Strong profile. Address remaining items to maximize interview rates.':score>=50?'Good start. Fix critical items and your response rate will improve significantly.':'Focus on completing profile and assignment history before applying.'}</div>
          <div style="display:flex;gap:16px;font-size:13px;font-weight:600">
            <span style="color:#dc2626">${hi.length} Critical</span>
            <span style="color:#d97706">${med.length} Important</span>
            <span style="color:#2563eb">${lo.length} Minor</span>
            <span style="color:#16a34a">${good.length} ✓ Good</span>
          </div>
          <div style="height:8px;background:#e5e7eb;border-radius:4px;margin-top:12px"><div style="height:8px;border-radius:4px;background:${scoreGrad};width:${score}%"></div></div>
        </div>
      </div>
    </div>
    ${good.length?`<div class="card"><h2>✅ Strengths</h2><div class="grid2">${good.map(s=>`<div class="gap-good"><span style="color:#22c55e;margin-right:6px">✓</span>${esc(s)}</div>`).join('')}</div></div>`:''}
    ${gapHtml(hi,'gap-high','🔴 Critical — Fix These First','background:#fee2e2;color:#dc2626')}
    ${gapHtml(med,'gap-med','⚠️ Important — Address Soon','background:#fef9c3;color:#a16207')}
    ${gapHtml(lo,'gap-low','ℹ️ Minor — Nice to Have','background:#dbeafe;color:#1d4ed8')}
    ${industryGaps?`<div class="card"><h2>📊 Skills vs Target Industries</h2>${industryGaps}</div>`:''}`;
}

