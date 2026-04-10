// ── Dashboard ─────────────────────────────────────────────────────────
function renderDashboard() {
  const p = state.profile;
  const active = state.jobs.filter(j=>['applied','interviewing'].includes(j.status)).length;
  const total = state.jobs.length;
  const achievements = state.achievements || [];

  // Documents count as done if: files uploaded locally, OR profile was clearly populated from doc extraction
  const docsEffectivelyDone = state.documents.length > 0 ||
    state.documents.some(d => d.content && d.content.length > 0) ||
    !!(p.fullName && p.branch && p.rank && p.mosRate);

  const checks = [
    {label:'Upload your documents (DD-214, performance reports, resume)', autoDone: docsEffectivelyDone, view:'documents', priority:true},
    {label:'Complete your profile', autoDone:!!(p.fullName&&p.branch), view:'profile'},
    {label:'Review & edit your experience', autoDone:state.assignments.length>0 || state.civilianJobs.length>0, view:'experience'},
    {label:'Build your achievements library', autoDone:achievements.length>=3, view:'achievements'},
    {label:'Set up your separation timeline', autoDone:!!(state.timeline?.separationDate), view:'timeline'},
    {label:'Search for jobs', autoDone:state.jobs.length>0||state.ui.scoutResults?.length>0, view:'scout'},
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

  // Profile completeness
  const profileFields = [
    !!(p.fullName), !!(p.branch), !!(p.rank), !!(p.yearsOfService),
    !!(p.mosRate), !!(p.location), !!(p.email || p.phone), !!(p.clearance),
    !!(p.elevatorPitch), !!(p.identityFrame),
    !!(p.technicalSkills?.length), !!(p.softSkills?.length),
    !!(p.targetIndustries?.length), !!(state.assignments.length > 0),
  ];
  const profilePct = Math.round(profileFields.filter(Boolean).length / profileFields.length * 100);
  const name = p.fullName ? ', ' + p.fullName.split(' ')[0] : '';
  const isNewUser = state.documents.length === 0 && !p.fullName && state.assignments.length === 0;
  const needsSkillsGen = state.assignments.length > 0 && (state.profile.technicalSkills||[]).length === 0 && !state.ui.skillsGenDismissed;
  const needsSummaryGen = state.assignments.length > 0 && !state.profile.elevatorPitch && !state.ui.summaryGenDismissed;

  // Achievements prompt — show when experience exists but brag book is empty or thin
  const needsAchievements = state.assignments.length > 0 && achievements.length < 3 && !state.ui.achievementsDismissed;

  const appColor = '#1a3a6b';
  const profileColor = profilePct === 100 ? '#1a5c2a' : profilePct >= 70 ? '#b8860b' : '#8b1a1a';
  const docsColor = state.documents.length > 0 || state.assignments.length > 0 ? '#1a5c2a' : '#1a3a6b';

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 20px;color:var(--accent);letter-spacing:0.02em">Welcome back${name}! 👋</h1>

    ${isNewUser ? `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light)">
      <h2>🚀 Get Started in 3 Steps</h2>
      <div style="font-size:14px;color:var(--text);line-height:1.8">
        <strong>1. Upload Documents</strong> — Start with your DD-214, performance reports, or civilian resume. Claude will auto-fill everything.<br>
        <strong>2. Review & Fill Gaps</strong> — Check your Profile and Experience pages, add anything missing.<br>
        <strong>3. Build Resumes</strong> — Add jobs to your tracker, then let Claude write tailored resumes for each one.
      </div>
      <button class="btn btn-primary" onclick="setState({view:'documents'})" style="margin-top:12px">📤 Start: Upload Documents</button>
    </div>` : ''}

    <div class="grid3" style="margin-bottom:20px">
      ${[
        ['Active Applications', active+'/'+total, appColor],
        ['Profile Complete', profilePct+'%', profileColor],
        ['Documents', (() => { const n = state.documents.length; return n > 0 ? n + ' ✓' : (state.assignments.length > 0 ? '✓' : '0'); })(), docsColor]
      ].map(([l,v,c])=>`
        <div class="card" style="margin-bottom:0;text-align:center">
          <div style="font-size:32px;font-weight:800;color:${c};font-family:'Familjen Grotesk',sans-serif">${v}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.06em;text-transform:uppercase">${l}</div>
        </div>`).join('')}
    </div>

    ${(needsSkillsGen || needsSummaryGen) ? `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light)">
      <div style="display:flex;align-items:start;gap:12px">
        <span style="font-size:20px;flex-shrink:0">🤖</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;color:var(--accent);margin-bottom:4px;font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.04em">Your profile is missing a few things Claude needs</div>
          <div style="font-size:13px;color:var(--text);margin-bottom:12px">You have experience loaded but ${[needsSkillsGen?'no skills inventory':null,needsSummaryGen?'no professional summary':null].filter(Boolean).join(' and ')}. These are used in every resume, LinkedIn profile, and interview answer.</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${needsSkillsGen ? `<button class="btn btn-primary btn-sm" onclick="setState({view:'profile'});setTimeout(extractSkillsFromExperience,300)">✨ Auto-generate Skills</button>` : ''}
            ${needsSummaryGen ? `<button class="btn btn-primary btn-sm" onclick="setState({view:'profile'});setTimeout(generateElevatorPitch,300)">✨ Auto-generate Summary</button>` : ''}
            <button onclick="setState({ui:{...state.ui,skillsGenDismissed:true,summaryGenDismissed:true}})" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:4px">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    ${needsAchievements ? `
    <div class="card" style="border-left:4px solid var(--gold)">
      <div style="display:flex;align-items:start;gap:12px">
        <span style="font-size:20px;flex-shrink:0">🏆</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;color:var(--accent);margin-bottom:4px;font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.04em">Build your achievements library</div>
          <div style="font-size:13px;color:var(--text);margin-bottom:12px">
            You have experience loaded but no brag book yet. Claude uses your achievements library to write stronger resume bullets, more specific interview answers, and better cover letters.
            ${achievements.length > 0 ? `You have <strong>${achievements.length}</strong> — aim for at least 5 to 8.` : 'Claude can auto-extract your best wins from your experience in one click.'}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="setState({view:'achievements'})">🏆 Open Achievements Library</button>
            <button class="btn btn-secondary btn-sm" onclick="setState({view:'achievements'});setTimeout(extractAchievementsFromExperience,300)">🤖 Auto-Extract Now</button>
            <button onclick="setState({ui:{...state.ui,achievementsDismissed:true}})" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:4px">Dismiss</button>
          </div>
        </div>
      </div>
    </div>` : ''}


    ${(typeof getUpcomingMilestones === 'function' && getUpcomingMilestones(3).length > 0) ? `
    <div class="card" style="border-left:4px solid var(--accent)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 style="margin:0">📅 Upcoming Timeline Deadlines</h2>
        <button onclick="setState({view:'timeline'})" style="background:none;border:none;color:var(--accent);font-weight:700;cursor:pointer;font-size:12px;font-family:'Familjen Grotesk',sans-serif">View full timeline →</button>
      </div>
      ${getUpcomingMilestones(3).map(m => {
        const days = m.days;
        const isUrgent = days <= 7;
        const dateStr = m.actualDate || m.calculatedDate;
        return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--rule);cursor:pointer" onclick="setState({view:'timeline'})">
          <div style="font-size:18px;flex-shrink:0">${
            m.category === 'benefits' ? '🏥' :
            m.category === 'financial' ? '💰' :
            m.category === 'job-search' ? '💼' :
            m.category === 'records' ? '📋' : '🎖️'
          }</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:13px;color:var(--accent)">${esc(m.label.replace(/^⚡ /,''))}</div>
            <div style="font-size:11px;color:var(--muted)">${formatTimelineDate ? formatTimelineDate(dateStr) : dateStr}${m.actualDate?' · ✓ Confirmed':' · Estimated'}</div>
          </div>
          <div style="font-size:12px;font-weight:700;color:${isUrgent?'var(--red)':'var(--muted)'};white-space:nowrap;font-family:'Familjen Grotesk',sans-serif">
            ${days === 0 ? 'TODAY' : days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
          </div>
        </div>`;
      }).join('')}
    </div>` : ''}

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h2 style="margin:0">Getting Started Checklist</h2>
        <span style="font-size:12px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;color:${pct===100?'var(--green)':'var(--muted)'}">${doneCount}/${totalCount} complete</span>
      </div>
      <div style="height:6px;background:var(--rule);border-radius:2px;margin-bottom:16px;overflow:hidden">
        <div style="height:6px;border-radius:2px;background:${pct===100?'var(--green)':'var(--gold)'};width:${pct}%;transition:width 0.4s ease"></div>
      </div>
      ${checksWithStatus.map(c=>`
        <div class="checklist-item${c.done?' done':''}" onclick="${c.done?'':''}${c.manualOnly?`toggleChecklistItem('${c.label}')`:c.done?'':`setState({view:'${c.view}'})`}" style="${c.priority&&!c.done?'border-color:var(--gold);background:var(--gold-light);':''}">
          <div class="check-circle${c.done?' done':' todo'}" ${c.manualOnly&&!c.done?`onclick="event.stopPropagation();toggleChecklistItem('${c.label}')"`:''}>${c.done?'✓':c.priority?'!':''}</div>
          <span style="${c.done?'text-decoration:line-through;color:var(--dim)':c.priority&&!c.done?'font-weight:600;color:var(--accent)':''}">${c.label}</span>
          ${!c.done&&!c.manualOnly?'<span style="margin-left:auto;color:var(--gold);font-size:12px;font-weight:700">→</span>':''}
          ${c.manualOnly&&!c.done?'<span style="margin-left:auto;color:var(--dim);font-size:11px;font-style:italic;font-family:\'Familjen Grotesk\',sans-serif">Click to mark done</span>':''}
        </div>`).join('')}
      ${pct===100?`<div style="text-align:center;padding:12px;background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;margin-top:8px;color:var(--green);font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em">🎉 SETUP COMPLETE — YOUR PROFILE IS READY</div>`:''}
    </div>`;
}

function toggleChecklistItem(label) {
  const current = state.checklist[label] || false;
  setState({ checklist: { ...state.checklist, [label]: !current } });
}
