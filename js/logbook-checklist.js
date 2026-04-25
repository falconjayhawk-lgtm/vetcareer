// ── logbook-checklist.js — Airline Logbook Documentation Checklist ────
//
// Per-carrier document requirements for military pilots proving their
// flight hours during the airline hiring process. Each airline has
// specific requirements for what they'll accept as hour verification.
//
// State: state.logbookChecklist = {
//   [carrierId]: { items: [{ id, have, note }], lastUpdated }
// }
// ──────────────────────────────────────────────────────────────────────

// ── Universal documents needed by all carriers ────────────────────────

const UNIVERSAL_DOCS = [
  {
    id:       'dd214',
    label:    'DD-214 (Member Copy 4)',
    priority: 'critical',
    desc:     'Required by all carriers. Must show character of discharge (Honorable), dates of service, and MOS/AFSC. Get multiple certified copies.',
    tip:      'Request 10+ certified copies — you will need them repeatedly. Order at archives.gov/veterans'
  },
  {
    id:       'faa-cert',
    label:    'FAA Commercial or ATP Certificate',
    priority: 'critical',
    desc:     'Your actual FAA pilot certificate. Must be Commercial or ATP minimum.',
    tip:      'Lost? Order replacement at faa.gov/pilots/mylicense'
  },
  {
    id:       'faa-medical',
    label:    'FAA First Class Medical Certificate (current)',
    priority: 'critical',
    desc:     'Current First Class medical required for Part 121 operations. Must be valid at time of application.',
    tip:      'First class medical is valid 12 months for ATP ops if under 40, 6 months if 40+'
  },
  {
    id:       'official-logbook',
    label:    'Official Military Logbook (hard copy)',
    priority: 'critical',
    desc:     'Your physical logbook with all entries. Some carriers want to physically review it at the interview.',
    tip:      'Scan every page and back it up digitally. Military logbooks are irreplaceable.'
  },
  {
    id:       'afms-printout',
    label:    'AFMS / ARMS Computer Printout',
    priority: 'critical',
    desc:     'Official computer-generated summary of all logged flight time from the Air Force or Army aviation record management system. This is the primary verification document.',
    tip:      'Request from your wing aviation resource manager (ARM) before separation. Navy/Marines: NATOPS records. Army: ARMS printout.'
  },
  {
    id:       'ratings-certs',
    label:    'Type Ratings and Instrument Rating Certificate',
    priority: 'high',
    desc:     'Certificates for any type ratings you hold and your instrument rating.',
    tip:      'Military-equivalent type ratings may not transfer directly — verify with FAA before applying'
  }
];

// ── Per-carrier requirements ────────────────────────────────────────────

const CARRIER_REQUIREMENTS = [
  {
    id:         'delta',
    name:       'Delta Air Lines',
    icon:       '🔴',
    type:       'major',
    hrs_url:    'https://www.gojet.com/careers (apply through DALPA/Delta careers)',
    notes:      'Delta uses a third-party verification service (Pilot Credentials). Military hours are well-accepted. The AFMS printout is the primary proof of military flight time.',
    specific: [
      { id:'pilot-credentials', label:'Pilot Credentials profile (delta.pilotcredentials.com)', priority:'critical', desc:'Delta requires all applicants to create a Pilot Credentials profile. Upload your logbook summary and certificates there before applying.', tip:'Create your profile early — it takes time to process documents.' },
      { id:'mil-flight-orders', label:'Military flight orders (at least 3 most recent)', priority:'high', desc:'Deployment orders or TDY orders showing flight duty. Helps verify operational context of hours.', tip:'Pull from myPers or ARMS system before separation' },
      { id:'unit-letter',       label:'Letter from unit commander verifying hours', priority:'medium', desc:'Optional but helpful for borderline hour counts or to clarify simulator vs. actual flight time.', tip:'Ask your squadron commander or DO to write this' }
    ]
  },
  {
    id:         'united',
    name:       'United Airlines',
    icon:       '🔵',
    type:       'major',
    notes:      'United uses Aviate for their pilot pipeline and has a dedicated military recruiting team. Strong track record of hiring military pilots. AFMS printout is primary verification.',
    specific: [
      { id:'aviate-profile', label:'United Aviate profile (aviateunited.com)', priority:'critical', desc:'United\'s primary application platform. Create and maintain your Aviate profile — it tracks your progress through the hiring pipeline.', tip:'Join Aviate early — some programs have pipeline benefits for military applicants' },
      { id:'afms-certified', label:'Certified AFMS printout (within 6 months)', priority:'high', desc:'United may require a recent AFMS printout to verify hours are current. Request a fresh one close to your interview date.', tip:'Request from your ARM within 6 months of applying' },
      { id:'flight-evals',   label:'Recent military flight evaluations (last 2-3)', priority:'medium', desc:'Standardization evaluations, instrument checks, or equivalent. Demonstrates proficiency standards.', tip:'Pull from your flight records before separation' }
    ]
  },
  {
    id:         'american',
    name:       'American Airlines',
    icon:       '🦅',
    type:       'major',
    notes:      'American uses a direct application process. Their military hiring team is active at many installations. Accept AFMS printout as primary military hour verification.',
    specific: [
      { id:'aa-online-app', label:'American Airlines online application with logbook upload', priority:'critical', desc:'Upload a digital copy of your complete logbook (all pages) and AFMS printout directly in the application.', tip:'PDF scan your entire logbook before applying — both can be submitted together' },
      { id:'awards-citations', label:'Military awards and citations (if relevant)', priority:'low', desc:'DFCs, Air Medals, and other aviation-specific awards can be included to demonstrate operational excellence.', tip:'Include in your application package, not the logbook itself' }
    ]
  },
  {
    id:         'southwest',
    name:       'Southwest Airlines',
    icon:       '💛',
    type:       'major',
    notes:      'Southwest accepts standard military documentation. All-737 fleet — type rating can be earned after hire. Known for thorough logbook review at interview.',
    specific: [
      { id:'sw-logbook-summary', label:'Logbook summary sheet (hours by category)', priority:'critical', desc:'Southwest wants a clean summary showing total, PIC, SIC, cross-country, night, and instrument hours separately. Prepare a one-page breakdown.', tip:'Use a spreadsheet to calculate and verify your totals before the interview' },
      { id:'sw-resume-form',    label:'Southwest Pilot Resume form (their specific format)', priority:'critical', desc:'Southwest uses their own pilot resume format. Download from Southwest careers page and complete it exactly as required.', tip:'Do not submit a standard resume — use their specific form' }
    ]
  },
  {
    id:         'alaska',
    name:       'Alaska Airlines',
    icon:       '🏔️',
    type:       'major',
    notes:      'Alaska uses Pilot Credentials like Delta. West Coast focus. Military hiring is active particularly from Pacific-area installations.',
    specific: [
      { id:'alaska-credentials', label:'Pilot Credentials profile (alaskaair.pilotcredentials.com)', priority:'critical', desc:'Alaska requires the Pilot Credentials platform for application. Upload all documentation there.', tip:'Same platform as Delta — one profile can serve both' },
      { id:'alaska-background',  label:'10-year background check documentation', priority:'high', desc:'Alaska requires comprehensive 10-year background check. Have addresses, employers, and supervisor contacts for the past 10 years ready.', tip:'Start compiling this list early — 10 years of contact info takes time' }
    ]
  },
  {
    id:         'fedex',
    name:       'FedEx Express',
    icon:       '📦',
    type:       'cargo',
    notes:      'FedEx has a dedicated military pipeline and historically offers longevity credit for prior military service. Night flying required. AFMS printout is primary verification. Strong veteran hiring culture.',
    specific: [
      { id:'fedex-futurecrew', label:'FedEx FUTURECREW program profile', priority:'critical', desc:'FedEx uses FUTURECREW for their pilot pipeline. Military applicants can qualify for accelerated consideration through the military path.', tip:'Join FUTURECREW early — military pilots have a dedicated path with different minimums' },
      { id:'fedex-afms-orig',  label:'Original (not copy) AFMS printout', priority:'critical', desc:'FedEx may require the original AFMS computer printout with official stamp, not a scanned copy.', tip:'Request two official copies from your ARM — bring one to the interview' },
      { id:'fedex-longevity',  label:'Service record showing years for longevity credit', priority:'high', desc:'FedEx offers pay scale credit for prior military experience. Have documentation ready to support longevity credit negotiation.', tip:'Know your total years of military aviation service — it directly affects starting pay' },
      { id:'type-ratings',     label:'All current type rating certificates', priority:'high', desc:'FedEx flies B767, B777, MD-11, and ATR. Any relevant type ratings should be documented.', tip:'Military-equivalent type ratings may need FAA conversion — check before applying' }
    ]
  },
  {
    id:         'ups',
    name:       'UPS Airlines',
    icon:       '🟤',
    type:       'cargo',
    notes:      'UPS has strong veteran hiring. Large widebody operation (B747, B767, MD-11). Similar to FedEx in documentation requirements. Night flying is the job.',
    specific: [
      { id:'ups-ipa-app', label:'UPS IPA application (ipa-ups.com)', priority:'critical', desc:'UPS pilots are represented by the Independent Pilots Association. Applications go through the IPA portal.', tip:'Check current hiring minimums at IPA — they change frequently' },
      { id:'ups-afms',    label:'Certified AFMS printout (recent)', priority:'critical', desc:'UPS requires recent AFMS printout. Get one within 90 days of application.', tip:'Request close to your application date to ensure it captures all recent hours' },
      { id:'ups-letter',  label:'Letter of recommendation from current or former military supervisor', priority:'medium', desc:'Optional but UPS culture values military hierarchy references. A letter from a commanding officer or squadron commander carries weight.', tip:'' }
    ]
  },
  {
    id:         'skywest',
    name:       'SkyWest Airlines',
    icon:       '🌤️',
    type:       'regional',
    notes:      'SkyWest is a major regional pipeline to the majors (Delta, United, American, Alaska). Military pilots can often start here to build Part 121 time quickly. Excellent for R-ATP pathway.',
    specific: [
      { id:'sw-apply',         label:'SkyWest online application with full logbook upload', priority:'critical', desc:'Upload your complete logbook and AFMS printout directly in the online application.', tip:'SkyWest is a fast hiring process — have all docs ready before applying' },
      { id:'sw-ratp-docs',     label:'R-ATP Military qualification documentation', priority:'high', desc:'If claiming military R-ATP pathway (750 hours), provide documentation of military pilot training program graduation.', tip:'Specifically: record of completion of a military undergraduate pilot training program' },
      { id:'sw-poh',           label:'POH/AFM familiarity (CRJ or E175)', priority:'medium', desc:'SkyWest flies CRJ200, CRJ700, CRJ900, and E175. Basic systems knowledge is expected. Study before the interview.', tip:'' }
    ]
  }
];

// ── State helpers ──────────────────────────────────────────────────────

function getLogbookChecklist() {
  if (!state.logbookChecklist) state.logbookChecklist = {};
  return state.logbookChecklist;
}

function saveLogbookChecklist() {
  try { localStorage.setItem('vc_logbookChecklist', JSON.stringify(state.logbookChecklist)); } catch(e) {}
}

function loadLogbookChecklistFromStorage() {
  try {
    const s = localStorage.getItem('vc_logbookChecklist');
    if (s) state.logbookChecklist = JSON.parse(s);
    else state.logbookChecklist = {};
  } catch(e) { state.logbookChecklist = {}; }
}

function getCarrierChecklist(carrierId) {
  const clists = getLogbookChecklist();
  if (!clists[carrierId]) clists[carrierId] = { items: {}, lastUpdated: null };
  return clists[carrierId];
}

function toggleLogbookDoc(carrierId, docId, have) {
  const cl = getCarrierChecklist(carrierId);
  cl.items[docId] = have;
  cl.lastUpdated = new Date().toISOString();
  state.logbookChecklist = getLogbookChecklist();
  saveLogbookChecklist();
  setState({});
}

// ── Main render ────────────────────────────────────────────────────────

function renderLogbookChecklist() {
  const airlineOn = typeof isAirlinePath === 'function' && isAirlinePath();

  if (!airlineOn) {
    return `
      <h1 style="font-size:24px;font-weight:800;margin:0 0 16px">✈️ Logbook Documentation Checklist</h1>
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:32px;margin-bottom:12px">✈️</div>
        <div style="font-weight:700;font-size:15px;color:var(--accent);margin-bottom:8px">Activate your Airline path first</div>
        <button class="btn btn-primary" onclick="setState({view:'profile'})">Go to Profile</button>
      </div>`;
  }

  const selectedCarrier = state.ui.logbookCarrier || null;
  const carrier = selectedCarrier ? CARRIER_REQUIREMENTS.find(c => c.id === selectedCarrier) : null;

  // Overall completion across all carriers
  const allDocs = [...UNIVERSAL_DOCS, ...CARRIER_REQUIREMENTS.flatMap(c=>c.specific)];
  const allHave = allDocs.filter(d => {
    const clist = getCarrierChecklist(d.carrier||'universal');
    return clist.items[d.id];
  }).length;

  // Universal doc completion
  const universalHave = UNIVERSAL_DOCS.filter(d => {
    const clist = getCarrierChecklist('universal');
    return clist.items[d.id];
  }).length;

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent)">📋 Logbook Documentation Checklist</h1>
    <p style="color:var(--muted);font-size:13px;margin:0 0 20px">Per-carrier document requirements for proving your military flight hours during airline hiring. Get these ready before you apply.</p>

    <!-- Universal docs -->
    <div class="card" style="border-left:4px solid var(--accent);margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">📁 Universal Documents — Every Carrier</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">Get these first. All carriers require them.</p>
        </div>
        <div style="font-size:13px;font-weight:700;color:${universalHave===UNIVERSAL_DOCS.length?'var(--green)':'var(--muted)'}">
          ${universalHave}/${UNIVERSAL_DOCS.length} ready
        </div>
      </div>
      <div style="height:5px;background:var(--rule);border-radius:3px;overflow:hidden;margin-bottom:14px">
        <div style="height:5px;background:${universalHave===UNIVERSAL_DOCS.length?'var(--green)':'var(--accent)'};border-radius:3px;width:${Math.round(universalHave/UNIVERSAL_DOCS.length*100)}%;transition:width 0.4s"></div>
      </div>
      ${UNIVERSAL_DOCS.map(doc => renderDocItem(doc, 'universal')).join('')}
    </div>

    <!-- Carrier selector -->
    <div class="card" style="margin-bottom:16px">
      <h2>Select a Carrier for Specific Requirements</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">
        ${CARRIER_REQUIREMENTS.map(c => {
          const cl     = getCarrierChecklist(c.id);
          const total  = c.specific.length;
          const have   = c.specific.filter(d=>cl.items[d.id]).length;
          const pct    = total > 0 ? Math.round(have/total*100) : 0;
          const isSelected = selectedCarrier === c.id;
          return `
          <div onclick="toggleUI('logbookCarrier','${isSelected?null:c.id}')"
            style="padding:12px;border:2px solid ${isSelected?'var(--accent)':'var(--rule-dark)'};background:${isSelected?'var(--gold-light)':'white'};border-radius:2px;cursor:pointer;transition:all 0.15s">
            <div style="font-size:22px;margin-bottom:4px">${c.icon}</div>
            <div style="font-weight:700;font-size:12px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;line-height:1.2;margin-bottom:6px">${c.name}</div>
            <div style="height:4px;background:var(--rule);border-radius:2px;overflow:hidden;margin-bottom:4px">
              <div style="height:4px;background:${pct===100?'var(--green)':'var(--gold)'};width:${pct}%;border-radius:2px"></div>
            </div>
            <div style="font-size:10px;color:var(--muted);font-family:'Familjen Grotesk',sans-serif">${have}/${total} specific docs</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Selected carrier requirements -->
    ${carrier ? `
    <div class="card" style="border-left:4px solid var(--gold)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <span style="font-size:26px">${carrier.icon}</span>
        <div>
          <h2 style="margin:0">${carrier.name} — Specific Requirements</h2>
          <div style="font-size:10px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-top:2px">${carrier.type} airline</div>
        </div>
      </div>
      <div style="background:var(--paper);border-radius:2px;padding:10px 14px;font-size:13px;color:var(--text);line-height:1.7;margin-bottom:16px">
        ${esc(carrier.notes)}
      </div>
      ${carrier.specific.map(doc => renderDocItem(doc, carrier.id)).join('')}
      ${carrier.hrs_url ? `
      <div style="margin-top:12px;font-size:12px;color:var(--muted)">
        📎 Apply at: <a href="${esc(carrier.hrs_url)}" target="_blank" style="color:var(--accent)">${esc(carrier.hrs_url)}</a>
      </div>` : ''}
    </div>` : ''}

    <!-- Tips section -->
    <div class="card" style="background:var(--gold-light);border:1px solid var(--gold)">
      <h2>⚡ Before You Apply — Key Reminders</h2>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${[
          ['Get your AFMS printout before separation', 'This is the most important document and the hardest to get after you leave. Visit your wing ARM in person and request an official certified printout. Request two copies.'],
          ['Scan your entire logbook now', 'Every page. Front to back. PDF it and back it up in multiple places. If your logbook is lost or damaged after separation, reconstruction is painful and takes months.'],
          ['Calculate your totals independently', 'Run your own hour calculations before any interview. Know your exact totals (to the tenth of an hour) for total time, PIC, SIC, night, instrument, cross-country, and simulator.'],
          ['Understand what counts as cross-country', 'The FAA definition (landing point >50nm from departure) may differ from how you\'ve been logging. Review your entries and calculate accordingly.'],
          ['Simulator hours have limits', 'For R-ATP and ATP requirements, simulator hours count but are capped (25 hours max for instrument time). Know which of your hours are actual vs. sim.'],
          ['Get your FAA Commercial or ATP cert before you need it', 'Don\'t let your FAA medical lapse. Don\'t wait until you\'re applying to airlines to get your commercial certificate from your military experience.']
        ].map(([title, detail]) => `
          <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid rgba(184,134,11,0.2)">
            <span style="color:var(--gold);font-weight:700;flex-shrink:0">⚡</span>
            <div>
              <div style="font-weight:700;font-size:13px;color:var(--accent)">${title}</div>
              <div style="font-size:12px;color:var(--muted);line-height:1.5;margin-top:2px">${detail}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── Document item renderer ─────────────────────────────────────────────

function renderDocItem(doc, carrierId) {
  const cl   = getCarrierChecklist(carrierId);
  const have = cl.items[doc.id] || false;
  const priorityColor = doc.priority==='critical'?'var(--red)':doc.priority==='high'?'var(--gold)':'var(--muted)';

  return `
    <div style="display:flex;align-items:start;gap:12px;padding:10px 0;border-bottom:1px solid var(--rule)">
      <input type="checkbox" ${have?'checked':''}
        onchange="toggleLogbookDoc('${carrierId}','${doc.id}',this.checked)"
        style="width:auto;margin-top:3px;flex-shrink:0;accent-color:var(--green)">
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;color:${have?'var(--green)':'var(--text)'};${have?'text-decoration:line-through;opacity:0.7':''}">
          ${esc(doc.label)}
          <span style="font-size:9px;font-weight:700;color:${priorityColor};text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-left:6px">${doc.priority}</span>
        </div>
        <div style="font-size:12px;color:var(--muted);line-height:1.5;margin-top:2px">${esc(doc.desc)}</div>
        ${doc.tip ? `<div style="font-size:11px;color:var(--accent);background:var(--accent-light);border-radius:2px;padding:3px 8px;margin-top:5px;display:inline-block">💡 ${esc(doc.tip)}</div>` : ''}
      </div>
    </div>`;
}
