// ── plan90.js — 90-Day Onboarding Plan Generator (#10) ────────────────
//
// Post-hire module. Surfaces from job cards with status "offered".
// Generates a role-specific 90-day plan: who to meet, what to learn,
// what to deliver, how to navigate the civilian culture shock.
//
// Data lives on the job: job.plan90 = { ...generated plan }
// ──────────────────────────────────────────────────────────────────────

// ── Main render ────────────────────────────────────────────────────────

function renderPlan90() {
  const jobId  = state.ui.plan90JobId;
  const job    = jobId ? state.jobs.find(j => j.id === jobId) : null;
  const busy   = state.ui.plan90Busy  || false;
  const error  = state.ui.plan90Error || '';
  const plan   = job?.plan90 || null;

  // If no job pre-selected, show job picker
  const offeredJobs = state.jobs.filter(j => j.status === 'offered');

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent)">🗓️ 90-Day Onboarding Plan</h1>
    <p style="color:var(--muted);font-size:13px;margin:0 0 20px">You got the job. Now make the first 90 days count. Claude builds a role-specific plan for what to learn, who to meet, and what to deliver.</p>

    ${offeredJobs.length === 0 && !job ? `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light)">
      <div style="font-size:32px;margin-bottom:8px">🎉</div>
      <div style="font-weight:700;font-size:15px;color:var(--accent);margin-bottom:6px">No offers in your job tracker yet</div>
      <div style="font-size:13px;color:var(--text);margin-bottom:12px">When you receive an offer, update the job status to "Offered" and come back here to generate your 90-day plan.</div>
      <button class="btn btn-secondary" onclick="setState({view:'jobs'})">Go to Job Tracker</button>
    </div>` : ''}

    <!-- Job selector -->
    ${!job && offeredJobs.length > 0 ? `
    <div class="card">
      <h2>Select Your Offer</h2>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${offeredJobs.map(j => `
          <div class="card" style="margin-bottom:0;cursor:pointer;border:2px solid var(--rule-dark)" onclick="toggleUI('plan90JobId','${j.id}')">
            <div style="font-weight:700;font-size:14px;color:var(--accent)">${esc(j.title)}</div>
            <div style="font-size:13px;color:var(--muted)">${esc(j.company)}${j.location?' · '+esc(j.location):''}</div>
            ${j.plan90 ? `<div style="font-size:11px;color:var(--green);margin-top:4px">✓ Plan already generated — click to view or regenerate</div>` : ''}
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${job ? `
    <!-- Selected job + config -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div style="flex:1">
        <div style="font-weight:700;font-size:16px;color:var(--accent)">${esc(job.title)}</div>
        <div style="font-size:13px;color:var(--muted)">${esc(job.company)}${job.location?' · '+esc(job.location):''}</div>
      </div>
      <button onclick="toggleUI('plan90JobId',null)" class="btn btn-secondary btn-sm">Change Job</button>
    </div>

    <div class="card">
      <h2>Configure Your Plan</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Start Date</label>
          <input type="date" id="p90-start" value="${esc(state.ui.plan90Start||'')}">
        </div>
        <div class="field">
          <label class="field-label">Work Environment</label>
          <select id="p90-env">
            <option value="office">In-Office</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Fully Remote</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Team Size</label>
          <input id="p90-team" placeholder="e.g., 8-person team, solo contributor, managing 15..." value="${esc(state.ui.plan90Team||job.teamSize||'')}">
        </div>
        <div class="field">
          <label class="field-label">Industry / Sector</label>
          <input id="p90-industry" placeholder="e.g., defense contractor, tech startup, federal agency..." value="${esc(state.ui.plan90Industry||'')}">
        </div>
        <div class="field" style="grid-column:1/-1">
          <label class="field-label">What do you already know about this role / company?</label>
          <textarea id="p90-context" rows="3" placeholder="e.g., They're ramping up a new program, my manager mentioned the first 60 days will be heavy onboarding, I'll have a portfolio of 3 contracts to manage...">${esc(state.ui.plan90Context||job.notes||'')}</textarea>
        </div>
        <div class="field" style="grid-column:1/-1">
          <label class="field-label">Your biggest concern about the transition to civilian life?</label>
          <input id="p90-concern" placeholder="e.g., moving from direct authority to influence, slower pace, no uniform structure..." value="${esc(state.ui.plan90Concern||'')}">
        </div>
      </div>
      <button class="btn btn-primary" onclick="generatePlan90('${job.id}')" ${busy?'disabled':''} style="padding:12px 24px">
        ${busy ? '<div class="spinner"></div> Building your plan...' : plan ? '🔄 Regenerate Plan' : '🗓️ Generate 90-Day Plan'}
      </button>
      ${busy ? `<div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:12px;margin-top:12px;font-size:13px;color:var(--accent);display:flex;align-items:center;gap:8px"><div class="spinner"></div> Building your role-specific 90-day roadmap — takes about 20 seconds</div>` : ''}
      ${error ? `<div style="color:var(--red);font-size:13px;margin-top:10px">${esc(error)}</div>` : ''}
    </div>

    ${plan ? renderPlan90Result(plan, job) : ''}
    ` : ''}`;
}

// ── Plan result renderer ───────────────────────────────────────────────

function renderPlan90Result(plan, job) {
  if (!plan) return '';

  const phases = [
    { key:'day1_7',   label:'Days 1-7',   icon:'🚀', color:'var(--accent)',  subtitle:'Orient and observe' },
    { key:'day8_30',  label:'Days 8-30',  icon:'🔍', color:'#7c3aed',        subtitle:'Learn and build relationships' },
    { key:'day31_60', label:'Days 31-60', icon:'⚡', color:'var(--gold)',     subtitle:'Start contributing' },
    { key:'day61_90', label:'Days 61-90', icon:'🎯', color:'var(--green)',    subtitle:'Demonstrate impact' }
  ];

  return `
    <div class="card" style="border-left:4px solid var(--accent)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">🗓️ Your 90-Day Plan</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">${esc(job.title)} at ${esc(job.company)}</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="copyPlan90()">📋 Copy Plan</button>
      </div>
    </div>

    <!-- Culture shock section first — most important for veterans -->
    ${plan.cultureShock ? `
    <div class="card" style="border-left:4px solid var(--red);background:var(--red-light)">
      <h2 style="color:var(--red)">🪖 → 💼 Culture Shift: What's Different</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 12px">The hardest part of the first 90 days is often not the job — it's the environment. Here's what to watch for.</p>
      <div id="plan90-culture" style="font-size:13px;color:var(--text);line-height:1.8;white-space:pre-line">${esc(plan.cultureShock)}</div>
    </div>` : ''}

    <!-- Phase cards -->
    ${phases.map(phase => {
      const content = plan[phase.key];
      if (!content) return '';
      return `
        <div class="card" style="border-left:4px solid ${phase.color}">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <span style="font-size:24px">${phase.icon}</span>
            <div>
              <div style="font-weight:700;font-size:15px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${phase.label}</div>
              <div style="font-size:12px;color:var(--muted)">${phase.subtitle}</div>
            </div>
          </div>
          <div style="font-size:13px;color:var(--text);line-height:1.8;white-space:pre-line">${esc(content)}</div>
        </div>`;
    }).join('')}

    <!-- Who to meet -->
    ${plan.whoToMeet ? `
    <div class="card" style="background:var(--accent-light);border:1px solid #c0cfe0">
      <h2>🤝 Who to Meet in the First 30 Days</h2>
      <div style="font-size:13px;color:var(--text);line-height:1.8;white-space:pre-line">${esc(plan.whoToMeet)}</div>
    </div>` : ''}

    <!-- Questions to ask before day 1 -->
    ${plan.questionsToAsk ? `
    <div class="card" style="background:var(--gold-light);border:1px solid var(--gold)">
      <h2>❓ Questions to Ask Before Day 1</h2>
      <div style="font-size:13px;color:var(--text);line-height:1.8;white-space:pre-line">${esc(plan.questionsToAsk)}</div>
    </div>` : ''}

    <!-- 90-day win -->
    ${plan.day90Win ? `
    <div class="card" style="background:var(--green-light);border:2px solid #c8e6cd">
      <h2 style="color:var(--green)">🏆 Your 90-Day Win</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 10px">This is what "done well" looks like at day 90. Keep it in mind from day 1.</p>
      <div style="font-size:14px;color:var(--text);line-height:1.7;font-weight:600">${esc(plan.day90Win)}</div>
    </div>` : ''}`;
}

// ── Generator ──────────────────────────────────────────────────────────

async function generatePlan90(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;

  const startDate  = document.getElementById('p90-start')?.value     || '';
  const env        = document.getElementById('p90-env')?.value        || 'hybrid';
  const team       = document.getElementById('p90-team')?.value?.trim()     || '';
  const industry   = document.getElementById('p90-industry')?.value?.trim() || '';
  const context    = document.getElementById('p90-context')?.value?.trim()  || '';
  const concern    = document.getElementById('p90-concern')?.value?.trim()  || '';

  setState({ ui: { ...state.ui, plan90Busy: true, plan90Error: '',
    plan90Start: startDate, plan90Team: team, plan90Industry: industry,
    plan90Context: context, plan90Concern: concern } });

  const p = state.profile;

  try {
    const raw = await callClaude(
      `You are a veteran career coach who specializes in helping military officers and senior enlisted personnel navigate the civilian workplace in their first 90 days. You understand that the hardest part is often not the job — it's the culture. You give specific, actionable advice that accounts for the military-to-civilian culture gap.

Your 90-day plans are specific to the role, not generic templates. You reference the actual job, company type, and veteran's background throughout.`,
      `Generate a 90-day onboarding plan for this veteran's new civilian role.

VETERAN:
Branch: ${p.branch||'Military'} | Rank: ${p.rank||'N/A'} | Years: ${p.yearsOfService||'N/A'}
MOS/Rate: ${p.mosRate||'N/A'}

NEW ROLE:
Title: ${job.title}
Company: ${job.company}
Industry/Sector: ${industry||'Not specified'}
Location: ${job.location||'Not specified'}
Work Environment: ${env}
Team Size: ${team||'Not specified'}
Start Date: ${startDate||'Not specified'}
Additional Context: ${context||'None'}
Veteran's Concern: ${concern||'None specified'}
Job Notes: ${job.notes||'None'}

Return ONLY this JSON (no markdown):
{
  "cultureShock": "4-6 specific, direct observations about what will feel different coming from military service into THIS type of civilian role. Not generic — reference the specific industry/company type. Cover: pace, authority, ambiguity, feedback culture, how decisions get made, what success looks like.",
  "day1_7": "Days 1-7 action items. What to do, what to observe, what NOT to do yet. Format as numbered action items with brief explanations. 6-8 items.",
  "day8_30": "Days 8-30 action items. Relationship building, learning the landscape, identifying quick wins. 6-8 numbered items.",
  "day31_60": "Days 31-60. Start contributing. First deliverables, first opinions offered, first initiatives. 6-8 numbered items.",
  "day61_90": "Days 61-90. Demonstrate impact. Consolidate relationships, lead something, establish your identity. 6-8 numbered items.",
  "whoToMeet": "Specific types of people to schedule time with in the first 30 days — not generic 'meet your boss' advice. Tailor to this role and industry. 5-7 specific stakeholder types with why each matters.",
  "questionsToAsk": "8-10 smart questions to ask before or on day 1. Mix of tactical (how does X work here) and strategic (what does success look like in 6 months). Questions that signal they've done their homework.",
  "day90Win": "One paragraph describing exactly what 'succeeding in the first 90 days' looks like for THIS role. What will people be saying about them? What will they have delivered? What relationships will they have built?"
}`
    );

    let plan;
    try {
      plan = typeof extractJSON === 'function'
        ? extractJSON(raw)
        : JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) { throw new Error('Could not parse plan. Try again.'); }

    const updatedJobs = state.jobs.map(j =>
      j.id === jobId ? { ...j, plan90: plan } : j
    );
    setState({ jobs: updatedJobs, ui: { ...state.ui, plan90Busy: false, plan90Error: '' } });
    if (typeof trackAction === 'function') trackAction('plan90_generate');
    showToast('🗓️ 90-day plan ready');
  } catch(err) {
    setState({ ui: { ...state.ui, plan90Busy: false, plan90Error: err.message } });
  }
}

function copyPlan90() {
  const job  = state.jobs.find(j => j.id === state.ui.plan90JobId);
  const plan = job?.plan90;
  if (!plan) { showToast('No plan to copy', false); return; }

  const text = [
    `90-DAY ONBOARDING PLAN — ${job.title} at ${job.company}`,
    '',
    '═══ CULTURE SHIFT ═══',
    plan.cultureShock || '',
    '',
    '═══ DAYS 1-7 ═══',
    plan.day1_7 || '',
    '',
    '═══ DAYS 8-30 ═══',
    plan.day8_30 || '',
    '',
    '═══ DAYS 31-60 ═══',
    plan.day31_60 || '',
    '',
    '═══ DAYS 61-90 ═══',
    plan.day61_90 || '',
    '',
    '═══ WHO TO MEET ═══',
    plan.whoToMeet || '',
    '',
    '═══ QUESTIONS TO ASK ═══',
    plan.questionsToAsk || '',
    '',
    '═══ YOUR 90-DAY WIN ═══',
    plan.day90Win || ''
  ].join('\n');

  navigator.clipboard.writeText(text)
    .then(() => showToast('✓ Plan copied'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('✓ Copied');
    });
}
