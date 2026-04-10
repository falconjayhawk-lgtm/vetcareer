// ── timeline.js — Separation Timeline & Countdown ─────────────────────
//
// Two-layer architecture:
//   Layer 1: Calculated dates — auto-derived from separation date
//   Layer 2: Actual dates    — user-entered overrides that lock in
//
// State shape: state.timeline = {
//   separationDate: 'YYYY-MM-DD',
//   separationType: 'retirement|ets|medical|early-release|resignation',
//   milestones: [{ id, label, category, daysOffset, calculatedDate,
//                  actualDate, completed, notes, isCustom, t2tLink }]
// }
// ──────────────────────────────────────────────────────────────────────

// ── Standard milestone definitions ────────────────────────────────────
// daysOffset: negative = before separation, positive = after

const STANDARD_MILESTONES = [
  // ── 18+ months out ──────────────────────────────────────────────
  {
    id: 'taps_register',
    label: 'Register for TAPS / TAP Program',
    category: 'transition',
    daysOffset: -540,
    description: 'You must complete TAP (Transition Assistance Program) before separation. Register early — slots fill up fast at most installations. The program is mandatory and takes 5 days.',
    missConsequence: 'Cannot separate without a DD-214 noting TAP completion. Missing this delays your separation date.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'va_records_gather',
    label: 'Start gathering VA medical records',
    category: 'benefits',
    daysOffset: -540,
    description: 'Request your service treatment records (STR) from your MTF. These are the foundation of any VA disability claim. Getting them now gives you time to identify conditions to claim.',
    missConsequence: 'VA claims without treatment records take significantly longer to process. Filing after separation means delayed compensation.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'networking_start',
    label: 'Start professional networking',
    category: 'job-search',
    daysOffset: -540,
    description: 'Begin building your civilian professional network now. LinkedIn, veteran networking groups (MOAA, Service Academy alumni, LinkedIn veteran groups), and informational interviews with peers who already transitioned.',
    missConsequence: 'Job searches started less than 6 months from separation typically take longer and result in lower first offers.',
    t2tLink: 'network',
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },

  // ── 12 months out ──────────────────────────────────────────────
  {
    id: 'va_claim_file',
    label: '⚡ File VA disability claim',
    category: 'benefits',
    daysOffset: -365,
    description: 'File your VA claim BEFORE separation — not after. Filing while still on active duty (IDES/LDES process or BDD program) is faster, preserves your records, and starts the compensation clock earlier. You can file up to 180 days before separation through the BDD (Benefits Delivery at Discharge) program.',
    missConsequence: 'Filing after separation means months without VA compensation while your claim processes. Veterans who file before separation typically receive decisions faster.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation'],
    isHighPriority: true
  },
  {
    id: 'linkedin_build',
    label: 'Build your LinkedIn profile',
    category: 'job-search',
    daysOffset: -365,
    description: 'Your LinkedIn profile should be live and active 12 months before separation. Recruiters search LinkedIn constantly — a profile that has been active for months looks more credible than one created a week before you start applying.',
    missConsequence: 'No direct miss consequence but a dormant profile signals you just started your transition.',
    t2tLink: 'linkedin',
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'job_search_start',
    label: 'Begin active job search',
    category: 'job-search',
    daysOffset: -365,
    description: 'Start applying and interviewing 12 months out. Defense and government positions often have 3-6 month hiring timelines. A corporate job search that takes 3 months looks quick to civilians but may still leave a gap if you start too late.',
    missConsequence: 'Starting less than 6 months out significantly increases the risk of a gap between separation and first paycheck.',
    t2tLink: 'scout',
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'tsp_decisions',
    label: 'Make TSP decisions',
    category: 'financial',
    daysOffset: -365,
    description: 'Understand your TSP options: leave it in TSP, roll it to a civilian 401(k) or IRA, or a combination. If under BRS (Blended Retirement System), understand the matching contributions that stop at separation. Consult a financial advisor — this is one of your largest financial assets.',
    missConsequence: 'No hard deadline but decisions made under pressure at separation often result in suboptimal choices.',
    t2tLink: null,
    separationTypes: ['retirement','ets','early-release','resignation']
  },

  // ── 9 months out ──────────────────────────────────────────────
  {
    id: 'taps_complete',
    label: 'Complete TAPS / TAP Program',
    category: 'transition',
    daysOffset: -270,
    description: 'Complete the full 5-day TAP program. Get a copy of your Individual Transition Plan (ITP). If you\'re pursuing a higher education track or entrepreneurship, request the specific track curriculum.',
    missConsequence: 'Required for separation. Cannot obtain DD-214 without completion certificate.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'resume_build',
    label: 'Build your first civilian resume',
    category: 'job-search',
    daysOffset: -270,
    description: 'Draft your civilian resume and get feedback from veterans who\'ve already made the transition. Your first version won\'t be your last — start early so you have time to iterate.',
    missConsequence: 'Resumes written in the last 30 days before separation are noticeably rushed and translate poorly.',
    t2tLink: 'resume',
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'ompf_request',
    label: 'Request Official Military Personnel File (OMPF)',
    category: 'records',
    daysOffset: -270,
    description: 'Request your full OMPF from the National Personnel Records Center or your branch records system. Verify it contains all your performance reports, awards, and training records. Correct errors now — it\'s significantly harder after separation.',
    missConsequence: 'Missing records are difficult to reconstruct after separation and can affect VA claims and federal job applications.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },

  // ── 6 months out ──────────────────────────────────────────────
  {
    id: 'terminal_leave_plan',
    label: 'Plan terminal leave with command',
    category: 'transition',
    daysOffset: -180,
    description: 'Coordinate your terminal leave dates with your commander and first sergeant/chief. Understand your leave balance and ensure you\'re taking maximum leave entitled. Terminal leave is paid — don\'t sell it back at a lower rate.',
    missConsequence: 'Unsold leave after separation is cashed out at a lower daily rate than terminal leave. Poor planning can cost thousands of dollars.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'tricare_research',
    label: 'Research TRICARE transition options',
    category: 'benefits',
    daysOffset: -180,
    description: 'Understand your TRICARE options post-separation. Retirees retain TRICARE. ETS veterans have a 180-day transitional TRICARE window (TRS). Research TRICARE Reserve Select if joining a Reserve component. Compare costs to civilian employer healthcare.',
    missConsequence: 'TRICARE elections must be made within 60 days of separation. Missing this window means lapse in coverage.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'sbp_election',
    label: '⚡ Survivor Benefit Plan (SBP) election',
    category: 'financial',
    daysOffset: -180,
    description: 'If retiring, you must elect SBP coverage at separation — you cannot add it later. This decision affects your spouse\'s financial security. Full SBP costs ~6.5% of retired pay but provides inflation-adjusted annuity.',
    missConsequence: 'SBP elections are permanent and cannot be changed after separation except in specific circumstances. Default is full coverage if married.',
    t2tLink: null,
    separationTypes: ['retirement']
  },
  {
    id: 'va_home_loan',
    label: 'Understand VA Home Loan entitlement',
    category: 'benefits',
    daysOffset: -180,
    description: 'If you plan to buy a home in the next few years, understand your VA loan entitlement now. Veterans with 10%+ VA disability rating are exempt from the funding fee — this can save $3,000-$10,000 on a home purchase.',
    missConsequence: 'No hard deadline but acting before separation means you can use any disability rating on your loan application.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },

  // ── 4 months out ──────────────────────────────────────────────
  {
    id: 'outprocessing_begin',
    label: 'Begin final out-processing checklist',
    category: 'transition',
    daysOffset: -120,
    description: 'Most installations have a formal out-processing checklist. Start working through it: finance, housing, legal (wills, POAs), transportation, medical records, dental, library, vehicle registration, base access stickers.',
    missConsequence: 'Incomplete out-processing can delay your separation date and cause issues with final pay.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'separation_physical',
    label: 'Schedule separation physical (SPBE)',
    category: 'benefits',
    daysOffset: -120,
    description: 'The Separation History and Physical Exam (SHPE) or equivalent is required and documents your health status at separation. This is one of the most important VA claim documents — be thorough about reporting every condition, even minor ones.',
    missConsequence: 'Conditions not documented at separation are harder to service-connect for VA disability later.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation'],
    isHighPriority: true
  },
  {
    id: 'dd214_verify',
    label: 'Verify DD-214 draft information',
    category: 'records',
    daysOffset: -120,
    description: 'Request a draft of your DD-214 and verify every field: dates of service, MOS/AFSC, character of discharge, awards and decorations, foreign service, and education. Errors on a DD-214 can affect VA claims, federal job applications, and veteran preference.',
    missConsequence: 'Correcting DD-214 errors after separation requires a DD-215 amendment process that can take months.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },

  // ── 3 months out ──────────────────────────────────────────────
  {
    id: 'clearance_portability',
    label: 'Understand clearance portability window',
    category: 'transition',
    daysOffset: -90,
    description: 'Security clearances are portable for 24 months after separation if you join a cleared contractor or federal agency. After 24 months, you\'ll need a new investigation. Have your clearance level documented and understand how to transfer sponsorship to a new employer.',
    missConsequence: 'A 24-month gap in cleared employment requires a full re-investigation. Clearances that lapse increase onboarding timelines at cleared employers.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'gtc_closeout',
    label: 'Close Government Travel Card (GTC)',
    category: 'transition',
    daysOffset: -90,
    description: 'Ensure your GTC is paid to zero and properly closed. Outstanding GTC balances become personal debt at separation and can affect your credit.',
    missConsequence: 'Outstanding GTC balances are collected from final pay or pursued as debt after separation.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'id_card_plan',
    label: 'Plan ID card transition',
    category: 'transition',
    daysOffset: -90,
    description: 'Understand when your CAC expires and what ID you\'ll need post-separation. Retirees receive a Uniformed Services ID. ETS veterans receive a DD-214 which serves as proof of veteran status. Plan for dependent ID cards as well.',
    missConsequence: 'Expired CAC means loss of base access for you and dependents.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },

  // ── 30 days out ──────────────────────────────────────────────
  {
    id: 'final_pay_confirm',
    label: 'Confirm final pay timeline',
    category: 'financial',
    daysOffset: -30,
    description: 'Verify with finance exactly when your final military paycheck arrives and when retirement pay begins (if applicable). There is typically a gap. Plan your cash flow for 30-90 days accordingly.',
    missConsequence: 'Veterans who don\'t plan for the pay gap can face financial stress in the first months post-separation.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'final_records_check',
    label: 'Final check on all records and awards',
    category: 'records',
    daysOffset: -30,
    description: 'Last chance to ensure all awards are entered in the system, performance reports are filed, and training records are complete. Request updated OMPF if changes were made.',
    missConsequence: 'Missing awards or records after separation require amendment processes.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },

  // ── Separation day ──────────────────────────────────────────
  {
    id: 'separation_day',
    label: '🎖️ Separation / Retirement Day',
    category: 'transition',
    daysOffset: 0,
    description: 'Sign your DD-214 CAREFULLY. Read every field before signing — errors are much harder to fix after you sign. Get multiple certified copies (at least 10). Store in multiple secure locations.',
    missConsequence: 'Signing an incorrect DD-214 creates a long amendment process.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation'],
    isHighPriority: true
  },

  // ── Post-separation ──────────────────────────────────────────
  {
    id: 'tricare_elect',
    label: '⚡ TRICARE election deadline',
    category: 'benefits',
    daysOffset: 60,
    description: 'You have 60 days from separation to elect TRICARE Transitional (TRS) for ETS veterans, or confirm your retiree TRICARE enrollment. After 60 days, you cannot elect TRS and will have a coverage gap.',
    missConsequence: 'Missing this window means no TRICARE coverage until the next open enrollment period. You will be uninsured.',
    t2tLink: null,
    separationTypes: ['ets','early-release','resignation'],
    isHighPriority: true
  },
  {
    id: 'tsp_rollover',
    label: 'TSP rollover decision',
    category: 'financial',
    daysOffset: 90,
    description: 'Decide whether to keep TSP, roll to an IRA, or roll to your new employer\'s 401(k). TSP has some of the lowest expense ratios of any retirement account — you don\'t have to move it. But if you want to consolidate, now is a good time.',
    missConsequence: 'No hard deadline. TSP account remains accessible indefinitely. However, you can no longer contribute without active federal employment or uniformed service.',
    t2tLink: null,
    separationTypes: ['retirement','ets','early-release','resignation']
  },
  {
    id: 'va_comp_confirm',
    label: 'Verify VA compensation payments',
    category: 'benefits',
    daysOffset: 90,
    description: 'Verify your VA disability rating has been established and payments are correct. Check eBenefits or VA.gov. If you haven\'t received a decision, follow up on your claim status.',
    missConsequence: 'Delayed action on VA claims means delayed compensation.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  },
  {
    id: 'civilian_taxes',
    label: 'Prepare for civilian tax filing',
    category: 'financial',
    daysOffset: 180,
    description: 'Your first year of taxes post-separation will be different. Military retirement pay is taxable (some states exempt it). VA compensation is not taxable. W-2 from military, 1099-R for retirement pay, civilian employer W-2. Consider a tax professional for the first year.',
    missConsequence: 'Surprises at tax time. Some veterans owe significant amounts their first year due to withholding mismatches.',
    t2tLink: null,
    separationTypes: ['retirement','ets','medical','early-release','resignation']
  }
];

const SEPARATION_TYPES = [
  { id: 'retirement',     label: 'Military Retirement (20+ years)' },
  { id: 'ets',            label: 'ETS / End of Enlistment / REFRAD' },
  { id: 'medical',        label: 'Medical Separation / IDES' },
  { id: 'early-release',  label: 'Early Release / VSP / SSB' },
  { id: 'resignation',    label: 'Officer Resignation' }
];

const CATEGORY_CONFIG = {
  'transition':  { label: 'Transition',       color: 'var(--accent)', bg: 'var(--accent-light)', icon: '🎖️' },
  'benefits':    { label: 'Benefits',         color: '#7c3aed',       bg: '#f5f3ff',             icon: '🏥' },
  'financial':   { label: 'Financial',        color: 'var(--green)',  bg: 'var(--green-light)',  icon: '💰' },
  'job-search':  { label: 'Job Search',       color: 'var(--gold)',   bg: 'var(--gold-light)',   icon: '💼' },
  'records':     { label: 'Records',          color: '#0891b2',       bg: '#e0f7fa',             icon: '📋' }
};

// ── State helpers ──────────────────────────────────────────────────────

function getTimeline() {
  if (!state.timeline) {
    state.timeline = { separationDate: '', separationType: '', milestones: [] };
  }
  return state.timeline;
}

function saveTimeline() {
  try { localStorage.setItem('vc_timeline', JSON.stringify(state.timeline)); } catch(e) {}
  scheduleSync();
}

function loadTimelineFromStorage() {
  try {
    const stored = localStorage.getItem('vc_timeline');
    if (stored) state.timeline = JSON.parse(stored);
    else state.timeline = { separationDate: '', separationType: '', milestones: [] };
  } catch(e) {
    state.timeline = { separationDate: '', separationType: '', milestones: [] };
  }
}

// ── Date calculator ────────────────────────────────────────────────────

function calcMilestoneDate(separationDate, daysOffset) {
  if (!separationDate) return '';
  const d = new Date(separationDate);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function generateMilestonesForSeparation(separationDate, separationType) {
  const existing = state.timeline?.milestones || [];
  const existingMap = Object.fromEntries(existing.map(m => [m.id, m]));

  const standard = STANDARD_MILESTONES
    .filter(m => m.separationTypes.includes(separationType))
    .map(m => {
      const ex = existingMap[m.id] || {};
      return {
        id:             m.id,
        label:          m.label,
        category:       m.category,
        daysOffset:     m.daysOffset,
        calculatedDate: calcMilestoneDate(separationDate, m.daysOffset),
        actualDate:     ex.actualDate     || '',
        completed:      ex.completed      || false,
        notes:          ex.notes          || '',
        isCustom:       false,
        isHighPriority: m.isHighPriority  || false,
        description:    m.description,
        missConsequence:m.missConsequence,
        t2tLink:        m.t2tLink
      };
    });

  // Preserve custom milestones
  const custom = existing.filter(m => m.isCustom);

  return [...standard, ...custom].sort((a, b) => a.daysOffset - b.daysOffset);
}

function daysFromNow(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now    = new Date();
  now.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

function formatTimelineDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysLabel(days) {
  if (days === null) return '';
  if (days === 0)   return 'TODAY';
  if (days > 0)     return `${days}d away`;
  if (days === -1)  return 'Yesterday';
  return `${Math.abs(days)}d ago`;
}

// ── Main render ────────────────────────────────────────────────────────

function renderTimeline() {
  const tl            = getTimeline();
  const hasSetup      = !!(tl.separationDate && tl.separationType);
  const milestones    = tl.milestones || [];
  const showAddCustom = state.ui.tlAddCustom || false;
  const filterCat     = state.ui.tlFilter || 'all';
  const showCompleted = state.ui.tlShowCompleted !== false;

  // Countdown to separation
  const sepDays   = tl.separationDate ? daysFromNow(tl.separationDate) : null;
  const totalMil  = milestones.length;
  const doneMil   = milestones.filter(m => m.completed).length;
  const upcoming  = milestones
    .filter(m => !m.completed)
    .map(m => ({ ...m, days: daysFromNow(m.actualDate || m.calculatedDate) }))
    .filter(m => m.days !== null && m.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent)">📅 Separation Timeline</h1>
    <p style="color:var(--muted);font-size:13px;margin:0 0 20px">Your date-driven separation roadmap — standard military milestones plus your own confirmed dates.</p>

    ${!hasSetup ? renderTimelineSetup() : `

    <!-- Countdown hero -->
    <div class="card" style="background:var(--accent);color:white;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.6;font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">
            ${SEPARATION_TYPES.find(t=>t.id===tl.separationType)?.label || 'Separation'}
          </div>
          <div style="font-size:13px;opacity:0.8">${formatTimelineDate(tl.separationDate)}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:52px;font-weight:800;font-family:'Familjen Grotesk',sans-serif;line-height:1;color:${sepDays !== null && sepDays <= 30 ? '#fde68a' : 'white'}">
            ${sepDays === null ? '—' : sepDays === 0 ? 'TODAY' : Math.abs(sepDays)}
          </div>
          <div style="font-size:12px;opacity:0.7;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.08em">
            ${sepDays === null ? 'SET DATE' : sepDays === 0 ? 'SEPARATION DAY' : sepDays > 0 ? 'DAYS REMAINING' : 'DAYS SINCE SEPARATION'}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;opacity:0.6;font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Progress</div>
          <div style="font-size:22px;font-weight:800;font-family:'Familjen Grotesk',sans-serif">${doneMil}/${totalMil}</div>
          <div style="font-size:11px;opacity:0.6">milestones done</div>
        </div>
      </div>
      <div style="height:4px;background:rgba(255,255,255,0.2);border-radius:2px;margin-top:16px;overflow:hidden">
        <div style="height:4px;background:var(--gold);border-radius:2px;width:${totalMil>0?Math.round(doneMil/totalMil*100):0}%;transition:width 0.4s"></div>
      </div>
      <button onclick="toggleUI('tlEditSetup',true)" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:white;font-size:11px;padding:4px 10px;border-radius:2px;cursor:pointer;margin-top:12px;font-family:'Familjen Grotesk',sans-serif">✏️ Edit Separation Date</button>
    </div>

    ${state.ui.tlEditSetup ? `
    <div class="card" style="border:2px solid var(--accent)">
      ${renderTimelineSetupFields(tl)}
    </div>` : ''}

    <!-- Upcoming deadlines -->
    ${upcoming.length > 0 ? `
    <div class="card" style="border-left:4px solid var(--red);background:var(--red-light)">
      <h2 style="color:var(--red);margin-bottom:12px">⏰ Next Up</h2>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${upcoming.map(m => {
          const cat = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG['transition'];
          const dateStr = m.actualDate || m.calculatedDate;
          return `
          <div style="display:flex;align-items:center;gap:12px;background:white;border-radius:2px;padding:10px 14px;cursor:pointer" onclick="toggleUI('tlExpanded_${m.id}',!state.ui['tlExpanded_${m.id}'])">
            <div style="font-size:20px;flex-shrink:0">${cat.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:13px;color:var(--accent)">${esc(m.label)}</div>
              <div style="font-size:11px;color:var(--muted)">${formatTimelineDate(dateStr)}${m.actualDate ? ' · ✓ Confirmed' : ' · Estimated'}</div>
            </div>
            <div style="font-size:13px;font-weight:700;color:${m.days<=7?'var(--red)':'var(--accent)'};white-space:nowrap;font-family:'Familjen Grotesk',sans-serif">
              ${m.days === 0 ? 'TODAY' : `${m.days}d`}
            </div>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();completeMilestone('${m.id}')" style="font-size:10px;flex-shrink:0">✓ Done</button>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- Filter bar -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
      <span style="font-size:11px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.06em;text-transform:uppercase">Filter:</span>
      <button onclick="toggleUI('tlFilter','all')" style="padding:4px 12px;border-radius:2px;border:1.5px solid ${filterCat==='all'?'var(--accent)':'var(--rule-dark)'};background:${filterCat==='all'?'var(--accent)':'white'};color:${filterCat==='all'?'white':'var(--muted)'};font-size:12px;font-weight:600;cursor:pointer;font-family:'Familjen Grotesk',sans-serif">All</button>
      ${Object.entries(CATEGORY_CONFIG).map(([k,v]) => `
        <button onclick="toggleUI('tlFilter','${k}')" style="padding:4px 12px;border-radius:2px;border:1.5px solid ${filterCat===k?v.color:'var(--rule-dark)'};background:${filterCat===k?v.bg:'white'};color:${filterCat===k?v.color:'var(--muted)'};font-size:12px;font-weight:600;cursor:pointer;font-family:'Familjen Grotesk',sans-serif">
          ${v.icon} ${v.label}
        </button>`).join('')}
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);cursor:pointer;margin-left:auto">
        <input type="checkbox" ${showCompleted?'checked':''} onchange="toggleUI('tlShowCompleted',this.checked)" style="width:auto;accent-color:var(--accent)">
        Show completed
      </label>
    </div>

    <!-- Timeline milestones -->
    ${renderMilestoneList(milestones, filterCat, showCompleted)}

    <!-- Add custom milestone -->
    <div style="margin-top:8px">
      ${showAddCustom ? renderAddCustomForm() : `
      <button class="btn btn-secondary" onclick="toggleUI('tlAddCustom',true)" style="width:100%;justify-content:center">
        + Add Custom Milestone
      </button>`}
    </div>
    `}`;
}

// ── Setup screen ───────────────────────────────────────────────────────

function renderTimelineSetup() {
  return `
    <div class="card" style="border:2px solid var(--accent)">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:40px;margin-bottom:8px">📅</div>
        <div style="font-weight:700;font-size:16px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;margin-bottom:6px">Set Up Your Separation Timeline</div>
        <p style="font-size:13px;color:var(--muted);margin:0">Enter your separation date and type — T2T will generate a personalized milestone roadmap with the right tasks at the right time.</p>
      </div>
      ${renderTimelineSetupFields({})}
    </div>`;
}

function renderTimelineSetupFields(tl) {
  return `
    <div class="grid2">
      <div class="field">
        <label class="field-label">Separation / Retirement Date *</label>
        <input type="date" id="tl-sep-date" value="${esc(tl.separationDate||'')}"
          style="font-size:14px;font-weight:600">
        <div style="font-size:11px;color:var(--dim);margin-top:2px">Use your best estimate if not confirmed — you can update it anytime</div>
      </div>
      <div class="field">
        <label class="field-label">Separation Type *</label>
        <select id="tl-sep-type" style="font-size:13px">
          <option value="">Select...</option>
          ${SEPARATION_TYPES.map(t => `<option value="${t.id}" ${tl.separationType===t.id?'selected':''}>${t.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" onclick="saveTimelineSetup()">
        ${tl.separationDate ? 'Update Timeline' : '📅 Generate My Timeline'}
      </button>
      ${tl.separationDate ? `<button class="btn btn-secondary" onclick="toggleUI('tlEditSetup',false)">Cancel</button>` : ''}
    </div>`;
}

function saveTimelineSetup() {
  const sepDate = document.getElementById('tl-sep-date')?.value;
  const sepType = document.getElementById('tl-sep-type')?.value;
  if (!sepDate) { showToast('Enter your separation date', false); return; }
  if (!sepType) { showToast('Select your separation type', false); return; }

  const milestones = generateMilestonesForSeparation(sepDate, sepType);
  state.timeline = { separationDate: sepDate, separationType: sepType, milestones };
  saveTimeline();
  setState({ ui: { ...state.ui, tlEditSetup: false } });
  showToast(`✓ Timeline generated — ${milestones.length} milestones`);
}

// ── Milestone list ─────────────────────────────────────────────────────

function renderMilestoneList(milestones, filterCat, showCompleted) {
  let filtered = milestones;
  if (filterCat !== 'all') filtered = filtered.filter(m => m.category === filterCat);
  if (!showCompleted) filtered = filtered.filter(m => !m.completed);
  if (!filtered.length) return `<div class="card" style="text-align:center;padding:32px;color:var(--muted)">No milestones to show. <button onclick="toggleUI('tlShowCompleted',true)" style="background:none;border:none;color:var(--accent);cursor:pointer;font-weight:700">Show completed</button></div>`;

  // Group by phase
  const phases = [
    { label: '18+ Months Out',  min: -9999, max: -365 },
    { label: '12-6 Months Out', min: -365,  max: -180 },
    { label: '6-3 Months Out',  min: -180,  max: -90  },
    { label: '3-1 Months Out',  min: -90,   max: -1   },
    { label: 'Separation Week', min: -1,    max: 7    },
    { label: 'Post-Separation', min: 7,     max: 9999 }
  ];

  return phases.map(phase => {
    const phaseMil = filtered.filter(m => m.daysOffset > phase.min && m.daysOffset <= phase.max);
    if (!phaseMil.length) return '';
    return `
      <div style="margin-bottom:4px">
        <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:0.12em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;padding:4px 0;margin-bottom:6px;border-bottom:1px solid var(--rule)">${phase.label}</div>
        ${phaseMil.map(m => renderMilestoneCard(m)).join('')}
      </div>`;
  }).join('');
}

function renderMilestoneCard(m) {
  const cat        = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG['transition'];
  const expanded   = state.ui[`tlExpanded_${m.id}`] || false;
  const editingDate= state.ui[`tlEditDate_${m.id}`] || false;
  const displayDate= m.actualDate || m.calculatedDate;
  const days       = daysFromNow(displayDate);
  const isOverdue  = days !== null && days < 0 && !m.completed;
  const isUrgent   = days !== null && days >= 0 && days <= 14 && !m.completed;

  const borderColor = m.completed ? '#c8e6cd' : m.isHighPriority ? 'var(--red)' : isOverdue ? '#fecaca' : isUrgent ? 'var(--gold)' : cat.color;

  return `
    <div class="card" style="margin-bottom:8px;border-left:4px solid ${borderColor};${m.completed?'opacity:0.65':''}">
      <div style="display:flex;align-items:start;gap:10px">

        <!-- Complete toggle -->
        <button onclick="completeMilestone('${m.id}')"
          style="width:22px;height:22px;border-radius:50%;border:2px solid ${m.completed?'var(--green)':'var(--rule-dark)'};background:${m.completed?'var(--green)':'white'};color:white;font-size:11px;cursor:pointer;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center">
          ${m.completed ? '✓' : ''}
        </button>

        <div style="flex:1;min-width:0">
          <!-- Label + badges -->
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-weight:700;font-size:13px;color:${m.completed?'var(--dim)':'var(--accent)'};${m.completed?'text-decoration:line-through':''}">${esc(m.label)}</span>
            <span style="background:${cat.bg};color:${cat.color};border-radius:2px;padding:1px 6px;font-size:10px;font-weight:700;font-family:'Familjen Grotesk',sans-serif">${cat.icon} ${cat.label}</span>
            ${m.isHighPriority&&!m.completed?`<span style="background:var(--red-light);color:var(--red);border-radius:2px;padding:1px 6px;font-size:10px;font-weight:700;font-family:'Familjen Grotesk',sans-serif">HIGH PRIORITY</span>`:''}
            ${m.isCustom?`<span style="background:var(--paper-dark);color:var(--muted);border-radius:2px;padding:1px 6px;font-size:10px;font-family:'Familjen Grotesk',sans-serif">Custom</span>`:''}
          </div>

          <!-- Date row -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--muted)">
            ${m.actualDate ? `
              <span style="color:var(--green);font-weight:600">✓ ${formatTimelineDate(m.actualDate)}</span>
              <span style="color:var(--dim)">· Confirmed</span>
            ` : `
              <span>${formatTimelineDate(m.calculatedDate)}</span>
              <span style="color:var(--dim)">· Estimated</span>
            `}
            ${days !== null && !m.completed ? `
              <span style="font-weight:700;color:${isOverdue?'var(--red)':isUrgent?'var(--gold)':'var(--muted)'};font-family:'Familjen Grotesk',sans-serif">
                ${daysLabel(days)}
              </span>` : ''}
            <button onclick="toggleUI('tlEditDate_${m.id}',!state.ui['tlEditDate_${m.id}'])"
              style="background:none;border:1px solid var(--rule-dark);border-radius:2px;color:var(--accent);font-size:10px;padding:1px 6px;cursor:pointer;font-family:'Familjen Grotesk',sans-serif">
              ${m.actualDate ? '✏️ Edit date' : '📅 I have a date'}
            </button>
            ${m.actualDate ? `<button onclick="clearMilestoneDate('${m.id}')" style="background:none;border:none;color:var(--dim);font-size:10px;cursor:pointer">× Clear</button>` : ''}
          </div>

          <!-- Date input (when editing) -->
          ${editingDate ? `
          <div style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap">
            <input type="date" id="ml-date-${m.id}" value="${esc(m.actualDate||m.calculatedDate||'')}"
              style="font-size:13px;padding:5px 8px;flex:1;min-width:140px">
            <button class="btn btn-primary btn-sm" onclick="saveMilestoneDate('${m.id}')">Confirm Date</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('tlEditDate_${m.id}',false)">Cancel</button>
          </div>` : ''}

          <!-- Expand toggle -->
          <button onclick="toggleUI('tlExpanded_${m.id}',!state.ui['tlExpanded_${m.id}'])"
            style="background:none;border:none;color:var(--dim);font-size:11px;cursor:pointer;padding:4px 0;margin-top:4px;display:flex;align-items:center;gap:4px">
            ${expanded ? '▼ Less' : '▶ Details'}
          </button>

          <!-- Expanded content -->
          ${expanded ? `
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--rule)">
            <div style="font-size:13px;color:var(--text);line-height:1.7;margin-bottom:8px">${esc(m.description||'')}</div>
            ${m.missConsequence ? `
            <div style="background:var(--red-light);border-left:3px solid var(--red);padding:8px 10px;font-size:12px;color:var(--red);margin-bottom:8px;border-radius:0 2px 2px 0">
              <strong>If you miss this:</strong> ${esc(m.missConsequence)}
            </div>` : ''}
            ${m.t2tLink ? `
            <button onclick="setState({view:'${m.t2tLink}'})" class="btn btn-secondary btn-sm">
              → Open in T2T: ${m.t2tLink.charAt(0).toUpperCase()+m.t2tLink.slice(1)}
            </button>` : ''}
            <div style="margin-top:10px">
              <label class="field-label">Notes</label>
              <div style="display:flex;gap:6px">
                <input id="ml-note-${m.id}" value="${esc(m.notes||'')}"
                  placeholder="Add notes, contacts, reference numbers..."
                  style="font-size:12px;flex:1">
                <button class="btn btn-secondary btn-sm" onclick="saveMilestoneNote('${m.id}')">Save</button>
              </div>
            </div>
            ${m.isCustom ? `<button class="btn btn-danger btn-sm" onclick="removeCustomMilestone('${m.id}')" style="margin-top:8px;font-size:11px">Remove</button>` : ''}
          </div>` : ''}
        </div>
      </div>
    </div>`;
}

// ── Milestone actions ──────────────────────────────────────────────────

function completeMilestone(mid) {
  const tl = getTimeline();
  tl.milestones = tl.milestones.map(m =>
    m.id === mid ? { ...m, completed: !m.completed } : m
  );
  state.timeline = tl;
  saveTimeline();
  setState({});
}

function saveMilestoneDate(mid) {
  const el  = document.getElementById(`ml-date-${mid}`);
  const val = el?.value;
  if (!val) { showToast('Enter a date', false); return; }
  const tl = getTimeline();
  tl.milestones = tl.milestones.map(m =>
    m.id === mid ? { ...m, actualDate: val } : m
  );
  state.timeline = tl;
  saveTimeline();
  setState({ ui: { ...state.ui, [`tlEditDate_${mid}`]: false } });
  showToast('✓ Date confirmed');
}

function clearMilestoneDate(mid) {
  const tl = getTimeline();
  tl.milestones = tl.milestones.map(m =>
    m.id === mid ? { ...m, actualDate: '' } : m
  );
  state.timeline = tl;
  saveTimeline();
  setState({});
}

function saveMilestoneNote(mid) {
  const el   = document.getElementById(`ml-note-${mid}`);
  const note = el?.value || '';
  const tl   = getTimeline();
  tl.milestones = tl.milestones.map(m =>
    m.id === mid ? { ...m, notes: note } : m
  );
  state.timeline = tl;
  saveTimeline();
  showToast('Note saved');
}

// ── Custom milestone ───────────────────────────────────────────────────

function renderAddCustomForm() {
  return `
    <div class="card" style="border:2px solid var(--accent)">
      <h2>+ Add Custom Milestone</h2>
      <div class="grid2">
        <div class="field" style="grid-column:1/-1">
          <label class="field-label">Label *</label>
          <input id="cml-label" placeholder="e.g., Final out with 1SG, Terminal leave starts, PCS move date...">
        </div>
        <div class="field">
          <label class="field-label">Your Date *</label>
          <input type="date" id="cml-date">
        </div>
        <div class="field">
          <label class="field-label">Category</label>
          <select id="cml-category">
            ${Object.entries(CATEGORY_CONFIG).map(([k,v]) =>
              `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="grid-column:1/-1">
          <label class="field-label">Notes</label>
          <input id="cml-notes" placeholder="Any details, contacts, reference numbers...">
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="saveCustomMilestone()">Save Milestone</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('tlAddCustom',false)">Cancel</button>
      </div>
    </div>`;
}

function saveCustomMilestone() {
  const label    = document.getElementById('cml-label')?.value?.trim();
  const date     = document.getElementById('cml-date')?.value;
  const category = document.getElementById('cml-category')?.value || 'transition';
  const notes    = document.getElementById('cml-notes')?.value?.trim() || '';
  if (!label) { showToast('Enter a label', false); return; }
  if (!date)  { showToast('Enter a date', false);  return; }

  const tl     = getTimeline();
  const sepDate = tl.separationDate;
  const offset  = sepDate ? Math.round((new Date(date) - new Date(sepDate)) / (1000*60*60*24)) : 0;

  const milestone = {
    id:             'custom_' + Date.now(),
    label,
    category,
    daysOffset:     offset,
    calculatedDate: date,
    actualDate:     date,
    completed:      false,
    notes,
    isCustom:       true,
    isHighPriority: false,
    description:    notes,
    missConsequence:'',
    t2tLink:        null
  };

  tl.milestones = [...tl.milestones, milestone]
    .sort((a, b) => a.daysOffset - b.daysOffset);

  state.timeline = tl;
  saveTimeline();
  setState({ ui: { ...state.ui, tlAddCustom: false } });
  showToast(`✓ "${label}" added`);
}

function removeCustomMilestone(mid) {
  if (!confirm('Remove this milestone?')) return;
  const tl = getTimeline();
  tl.milestones = tl.milestones.filter(m => m.id !== mid);
  state.timeline = tl;
  saveTimeline();
  setState({});
}

// ── Dashboard context — upcoming deadlines ────────────────────────────
// Called by dashboard.js to show next 3 upcoming milestones

function getUpcomingMilestones(limit = 3) {
  const tl = getTimeline();
  if (!tl.separationDate || !tl.milestones?.length) return [];
  return tl.milestones
    .filter(m => !m.completed)
    .map(m => ({ ...m, days: daysFromNow(m.actualDate || m.calculatedDate) }))
    .filter(m => m.days !== null && m.days >= -7) // include things up to a week past
    .sort((a, b) => a.days - b.days)
    .slice(0, limit);
}
