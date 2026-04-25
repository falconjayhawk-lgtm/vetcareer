// ── va-claim.js — VA Claim Documentation Assistant ────────────────────
//
// Helps veterans identify potentially ratable conditions, track
// documentation gathered per condition, and prepare for the C&P exam.
//
// Critical context: Filing BEFORE separation (BDD program, 180-90 days
// prior) is significantly faster than filing after. This tool surfaces
// that at every opportunity.
//
// State: state.vaClaim = {
//   filingStatus: 'pre-sep|post-sep|already-filed',
//   separationDate: '',  // pulled from timeline if available
//   conditions: [{ id, name, bodySystem, serviceConnection, rating,
//                  docs:[], notes, status }],
//   examDate: '',
//   ratingReceived: null
// }
// ──────────────────────────────────────────────────────────────────────

const VA_BODY_SYSTEMS = [
  { id:'musculoskeletal', label:'Musculoskeletal',      icon:'🦴', examples:'Knees, back, shoulders, hips, ankles, neck' },
  { id:'hearing',         label:'Hearing / Tinnitus',   icon:'👂', examples:'Hearing loss, tinnitus (ringing) — most common VA claim' },
  { id:'mental-health',   label:'Mental Health',        icon:'🧠', examples:'PTSD, anxiety, depression, MST' },
  { id:'respiratory',     label:'Respiratory',          icon:'🫁', examples:'Sleep apnea, rhinitis, burn pit exposure' },
  { id:'skin',            label:'Skin',                 icon:'🩹', examples:'Eczema, rashes, scars, fungal conditions' },
  { id:'vision',          label:'Vision',               icon:'👁️', examples:'Eye conditions, migraine with aura' },
  { id:'gi',              label:'Gastrointestinal',     icon:'🫀', examples:'GERD, IBS, ulcers from NSAIDs' },
  { id:'cardiovascular',  label:'Cardiovascular',       icon:'❤️', examples:'Hypertension, heart conditions' },
  { id:'neurological',    label:'Neurological',         icon:'⚡', examples:'Migraines, TBI, nerve damage' },
  { id:'reproductive',    label:'Reproductive / Other', icon:'🏥', examples:'Conditions not listed above' }
];

const CONNECTION_TYPES = [
  { id:'direct',    label:'Direct Service Connection',    desc:'Condition caused by or during military service' },
  { id:'secondary', label:'Secondary Service Connection', desc:'Caused or aggravated by a service-connected condition' },
  { id:'aggravated',label:'Aggravation',                  desc:'Pre-existing condition made worse by military service' },
  { id:'presumptive',label:'Presumptive',                 desc:'Exposure-based (burn pits, Agent Orange, Camp Lejeune, etc.)' }
];

const RATING_BRACKETS = [0,10,20,30,40,50,60,70,80,90,100];

const REQUIRED_DOCS = [
  { id:'str',     label:'Service Treatment Records (STR)', priority:'critical', desc:'Request from your MTF medical records office or VA. These are the foundation of every claim.' },
  { id:'dd214',   label:'DD-214',                          priority:'critical', desc:'Required for all VA claims. Get multiple certified copies.' },
  { id:'buddy',   label:'Buddy / Lay Statements',          priority:'high',     desc:'Written statements from people who witnessed your condition or its impact. Powerful evidence.' },
  { id:'nexus',   label:'Nexus Letter (private physician)',priority:'high',     desc:'Letter from a doctor connecting your condition to military service. Strongest medical evidence you can get.' },
  { id:'private-records', label:'Private Medical Records', priority:'high',     desc:'Any civilian doctor treatment for the condition — shows continuity.' },
  { id:'photos',  label:'Photos / Other Evidence',         priority:'medium',   desc:'Photos of visible conditions, activity logs, anything documenting impact on daily life.' },
  { id:'shpe',    label:'SHPE (Separation Physical)',       priority:'high',     desc:'The Separation History and Physical Exam. Make sure ALL conditions are documented here.' }
];

// ── State helpers ──────────────────────────────────────────────────────

function getVAClaim() {
  if (!state.vaClaim) {
    state.vaClaim = { filingStatus: '', separationDate: '', conditions: [], examDate: '', ratingReceived: null };
  }
  return state.vaClaim;
}

function saveVAClaim() {
  try { localStorage.setItem('vc_vaclaim', JSON.stringify(state.vaClaim)); } catch(e) {}
  scheduleSync();
}

function loadVAClaimFromStorage() {
  try {
    const s = localStorage.getItem('vc_vaclaim');
    if (s) state.vaClaim = JSON.parse(s);
    else state.vaClaim = { filingStatus: '', separationDate: '', conditions: [], examDate: '', ratingReceived: null };
  } catch(e) {
    state.vaClaim = { filingStatus: '', separationDate: '', conditions: [], examDate: '', ratingReceived: null };
  }
}

// ── Main render ────────────────────────────────────────────────────────

function renderVAClaim() {
  const claim  = getVAClaim();
  const sepDate = claim.separationDate || state.timeline?.separationDate || '';
  const daysToSep = sepDate ? Math.round((new Date(sepDate) - new Date()) / (1000*60*60*24)) : null;
  const conditions = claim.conditions || [];
  const activeTab  = state.ui.vaTab || 'overview';

  // Estimate combined rating
  const combinedRating = conditions.length > 0
    ? estimateCombinedRating(conditions.filter(c => c.rating > 0).map(c => c.rating))
    : null;

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent)">🏥 VA Claim Documentation</h1>
    <p style="color:var(--muted);font-size:13px;margin:0 0 20px">Track your conditions, gather evidence, and prepare for your C&P exam. File before you separate — not after.</p>

    <!-- BDD urgency banner -->
    ${daysToSep !== null && daysToSep > 0 && daysToSep <= 180 && claim.filingStatus !== 'already-filed' ? `
    <div class="card" style="border:2px solid ${daysToSep<=90?'var(--red)':'var(--gold)'};background:${daysToSep<=90?'var(--red-light)':'var(--gold-light)'};margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:28px;flex-shrink:0">${daysToSep<=90?'🚨':'⏰'}</span>
        <div>
          <div style="font-weight:700;font-size:14px;color:${daysToSep<=90?'var(--red)':'var(--accent)'};font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">
            ${daysToSep<=90?`BDD Window Closing — ${daysToSep} days left`:`${daysToSep} days to separation — BDD window is open`}
          </div>
          <div style="font-size:13px;color:var(--text);line-height:1.6">
            The Benefits Delivery at Discharge (BDD) program lets you file ${daysToSep<=90?'now (still possible)':'180 to 90 days before separation'}.
            Veterans who file through BDD receive decisions faster and start receiving compensation sooner.
            ${daysToSep<=90?'File immediately at va.gov or visit your VA regional office.':'File now — don\'t wait until your separation date.'}
          </div>
        </div>
      </div>
    </div>` : ''}

    ${daysToSep !== null && daysToSep > 180 ? `
    <div class="card" style="border-left:4px solid var(--accent);background:var(--accent-light);margin-bottom:16px">
      <div style="font-weight:700;font-size:13px;color:var(--accent);margin-bottom:4px">📅 BDD Window Opens in ${daysToSep-180} days</div>
      <div style="font-size:13px;color:var(--text)">Use this time to gather your evidence. The BDD program opens 180 days before your separation date — that's when you should file, not on your last day.</div>
    </div>` : ''}

    <!-- Tabs -->
    <div style="display:flex;gap:0;margin-bottom:20px;border-radius:2px;overflow:hidden;border:1.5px solid var(--rule-dark);width:fit-content;flex-wrap:wrap">
      ${[
        ['overview',    '📋 Overview'],
        ['conditions',  `🩺 Conditions (${conditions.length})`],
        ['evidence',    '📁 Evidence Tracker'],
        ['cpe',         '🏥 C&P Exam Prep'],
        ['calculator',  '🧮 Rating Calculator']
      ].map(([id,label]) => `
        <button onclick="toggleUI('vaTab','${id}')" style="padding:10px 18px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${activeTab===id?'var(--accent)':'white'};color:${activeTab===id?'white':'var(--muted)'};transition:all 0.15s;border-left:${id!=='overview'?'1.5px solid var(--rule-dark)':'none'}">
          ${label}
        </button>`).join('')}
    </div>

    ${activeTab === 'overview'    ? renderVAOverview(claim, conditions, combinedRating, daysToSep) : ''}
    ${activeTab === 'conditions'  ? renderVAConditions(conditions) : ''}
    ${activeTab === 'evidence'    ? renderVAEvidence(conditions) : ''}
    ${activeTab === 'cpe'         ? renderVACPEPrep(conditions) : ''}
    ${activeTab === 'calculator'  ? renderVARatingCalculator(conditions) : ''}`;
}

// ── Overview tab ───────────────────────────────────────────────────────

function renderVAOverview(claim, conditions, combinedRating, daysToSep) {
  const ratedConditions = conditions.filter(c=>c.rating>0);
  const withDocs = conditions.filter(c=>(c.docs||[]).some(d=>d.have));
  const completePct = conditions.length > 0
    ? Math.round((withDocs.length/conditions.length)*100)
    : 0;

  return `
    <!-- Filing status -->
    <div class="card">
      <h2>Filing Status</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Where are you in the process?</label>
          <select id="va-filing-status" onchange="updateVAField('filingStatus',this.value)" style="font-size:13px">
            <option value="">Select...</option>
            <option value="pre-sep"      ${claim.filingStatus==='pre-sep'      ?'selected':''}>Pre-separation — haven't filed yet</option>
            <option value="bdd-filed"    ${claim.filingStatus==='bdd-filed'    ?'selected':''}>Filed through BDD program</option>
            <option value="post-sep"     ${claim.filingStatus==='post-sep'     ?'selected':''}>Post-separation — filing now</option>
            <option value="already-filed"${claim.filingStatus==='already-filed'?'selected':''}>Already filed — awaiting decision</option>
            <option value="rated"        ${claim.filingStatus==='rated'        ?'selected':''}>Rated — decision received</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Separation Date (for BDD tracking)</label>
          <input type="date" id="va-sep-date" value="${esc(claim.separationDate||state.timeline?.separationDate||'')}"
            onchange="updateVAField('separationDate',this.value)">
        </div>
        ${claim.filingStatus === 'rated' ? `
        <div class="field">
          <label class="field-label">Combined Rating Received</label>
          <select id="va-rating" onchange="updateVAField('ratingReceived',parseInt(this.value))" style="font-size:13px">
            <option value="">Select...</option>
            ${RATING_BRACKETS.map(r=>`<option value="${r}" ${claim.ratingReceived===r?'selected':''}>${r}%</option>`).join('')}
          </select>
        </div>` : ''}
        ${(claim.filingStatus === 'rated' || claim.filingStatus === 'already-filed') ? `
        <div class="field">
          <label class="field-label">C&P Exam Date</label>
          <input type="date" id="va-exam-date" value="${esc(claim.examDate||'')}"
            onchange="updateVAField('examDate',this.value)">
        </div>` : ''}
      </div>
    </div>

    <!-- Stats -->
    <div class="grid3" style="margin-bottom:16px">
      ${[
        { label:'Conditions',      value: conditions.length,   color:'var(--accent)' },
        { label:'Evidence Ready',  value: withDocs.length+'/'+conditions.length, color: completePct>=80?'var(--green)':'var(--gold)' },
        { label:'Est. Combined',   value: combinedRating!==null?combinedRating+'%':'—', color:'var(--green)' }
      ].map(s=>`
        <div class="card" style="margin-bottom:0;text-align:center">
          <div style="font-size:28px;font-weight:800;color:${s.color};font-family:'Familjen Grotesk',sans-serif;line-height:1">${s.value}</div>
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:4px;font-family:'Familjen Grotesk',sans-serif">${s.label}</div>
        </div>`).join('')}
    </div>

    <!-- Pre-separation critical checklist -->
    <div class="card" style="border-left:4px solid var(--red)">
      <h2 style="color:var(--red)">⚡ File Before You Separate</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 14px">These are the highest-impact actions, in order. Don't skip any of them.</p>
      ${[
        { done: conditions.length >= 3,        label:'Identify all potentially ratable conditions — aim for at least 5-10',                    detail:'More is not greedier. Every condition costs you something. Document everything — it\'s easier to withdraw a condition than to add it later.' },
        { done: conditions.some(c=>c.docs?.find(d=>d.id==='str'&&d.have)), label:'Request your complete Service Treatment Records (STR)', detail:'Do this immediately — it can take weeks or months. Visit your MTF medical records office in person if possible.' },
        { done: !!claim.separationDate && daysToSep!==null && daysToSep<=180, label:'Schedule your Separation History and Physical Exam (SHPE)', detail:'This is your last chance to get conditions documented in your military medical record. Be thorough — mention everything, even if it seems minor.' },
        { done: conditions.some(c=>c.docs?.find(d=>d.id==='buddy'&&d.have)), label:'Get buddy statements from people who witnessed your conditions', detail:'Service members, spouses, roommates, supervisors who saw you limping, taking medication, going to sick call. Written statements. Powerful evidence.' },
        { done: (daysToSep!==null&&daysToSep<=180&&claim.filingStatus==='bdd-filed')||claim.filingStatus==='already-filed'||claim.filingStatus==='rated', label:'File your claim through the BDD program (180-90 days before separation)', detail:'Go to va.gov, call 1-800-827-1000, or visit your nearest VA regional office. This is the single most important step.' }
      ].map(item => `
        <div style="display:flex;align-items:start;gap:12px;padding:10px 0;border-bottom:1px solid var(--rule)">
          <div style="width:22px;height:22px;border-radius:50%;border:2px solid ${item.done?'var(--green)':'var(--red)'};background:${item.done?'var(--green)':'white'};flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;color:white;font-size:11px">
            ${item.done?'✓':''}
          </div>
          <div>
            <div style="font-weight:700;font-size:13px;color:${item.done?'var(--green)':'var(--text)'};${item.done?'text-decoration:line-through;opacity:0.7':''}">${item.label}</div>
            <div style="font-size:12px;color:var(--muted);line-height:1.5;margin-top:3px">${item.detail}</div>
          </div>
        </div>`).join('')}
    </div>`;
}

// ── Conditions tab ─────────────────────────────────────────────────────

function renderVAConditions(conditions) {
  const adding = state.ui.vaAddCondition || false;
  const expandedId = state.ui.vaExpandedCondition || null;

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div style="font-size:13px;color:var(--muted)">
        List every condition — not just the obvious ones. Hearing loss and tinnitus are the most common claims. Sleep apnea is nearly universal. GERD from NSAID use is very common.
      </div>
      <div style="display:flex;gap:8px">
        ${conditions.length > 0 ? `<button class="btn btn-secondary btn-sm" onclick="generateConditionSuggestions()">🤖 Suggest Conditions</button>` : ''}
        <button class="btn btn-primary btn-sm" onclick="toggleUI('vaAddCondition',true)">+ Add Condition</button>
      </div>
    </div>

    ${conditions.length === 0 && !adding ? `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light)">
      <h2>Start here: what are your conditions?</h2>
      <p style="font-size:13px;color:var(--text);line-height:1.7;margin-bottom:12px">
        Think through every part of your body that isn't 100% the same as when you came in.
        Knees, back, shoulders, hearing, tinnitus, sleep, mental health, skin.
        If it happened during or was made worse by your service, it's potentially ratable.
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="toggleUI('vaAddCondition',true)">+ Add My First Condition</button>
        <button class="btn btn-secondary" onclick="generateConditionSuggestions()">🤖 Help Me Identify Conditions</button>
      </div>
    </div>` : ''}

    ${adding ? renderAddConditionForm() : ''}

    ${conditions.map(c => renderConditionCard(c, expandedId===c.id)).join('')}`;
}

function renderAddConditionForm() {
  return `
    <div class="card" style="border:2px solid var(--accent);margin-bottom:16px">
      <h2>+ Add Condition</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Condition Name *</label>
          <input id="va-cond-name" placeholder="e.g., Left knee pain (medial meniscus), Tinnitus (bilateral), PTSD">
        </div>
        <div class="field">
          <label class="field-label">Body System *</label>
          <select id="va-cond-system" style="font-size:13px">
            <option value="">Select...</option>
            ${VA_BODY_SYSTEMS.map(s=>`<option value="${s.id}">${s.icon} ${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Service Connection Type</label>
          <select id="va-cond-connection" style="font-size:13px">
            <option value="">Select...</option>
            ${CONNECTION_TYPES.map(c=>`<option value="${c.id}">${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Current Rating (if already rated)</label>
          <select id="va-cond-rating" style="font-size:13px">
            <option value="0">Not rated / Unknown</option>
            ${[10,20,30,40,50,60,70,80,90,100].map(r=>`<option value="${r}">${r}%</option>`).join('')}
          </select>
        </div>
        <div class="field" style="grid-column:1/-1">
          <label class="field-label">How did service cause or aggravate this?</label>
          <textarea id="va-cond-notes" rows="2" placeholder="e.g., Repetitive jumping and rucking caused left knee deterioration starting 2018. Documented in STR 3 times."></textarea>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="saveVACondition()">Add Condition</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('vaAddCondition',false)">Cancel</button>
      </div>
    </div>`;
}

function renderConditionCard(c, expanded) {
  const sys  = VA_BODY_SYSTEMS.find(s=>s.id===c.bodySystem)||{icon:'🏥',label:'Unknown'};
  const conn = CONNECTION_TYPES.find(t=>t.id===c.serviceConnection)||{label:'Unknown'};
  const docsHave = (c.docs||[]).filter(d=>d.have).length;
  const docsTotal = (c.docs||[]).length || REQUIRED_DOCS.length;
  const pct = Math.round((docsHave/REQUIRED_DOCS.length)*100);
  const statusColor = pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--red)';

  return `
    <div class="card" style="margin-bottom:10px;border-left:4px solid ${statusColor}">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;margin-bottom:8px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-size:18px">${sys.icon}</span>
            <span style="font-weight:700;font-size:14px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${esc(c.name)}</span>
            ${c.rating>0?`<span style="background:var(--green-light);color:var(--green);border:1px solid #c8e6cd;border-radius:2px;padding:1px 8px;font-size:11px;font-weight:700;font-family:'Familjen Grotesk',sans-serif">${c.rating}%</span>`:''}
          </div>
          <div style="font-size:11px;color:var(--muted)">${sys.label} · ${conn.label}</div>
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0">
          <button onclick="toggleUI('vaExpandedCondition',${expanded?'null':"'"+c.id+"'"})" class="btn btn-secondary btn-sm">${expanded?'▼':'▶'}</button>
          <button onclick="removeVACondition('${c.id}')" class="btn btn-danger btn-sm">✕</button>
        </div>
      </div>

      <!-- Evidence progress bar -->
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1;height:5px;background:var(--rule);border-radius:3px;overflow:hidden">
          <div style="height:5px;background:${statusColor};width:${pct}%;border-radius:3px"></div>
        </div>
        <div style="font-size:10px;color:var(--muted);white-space:nowrap;font-family:'Familjen Grotesk',sans-serif">${docsHave}/${REQUIRED_DOCS.length} docs</div>
      </div>

      ${expanded ? `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--rule)">
        ${c.notes ? `<div style="font-size:13px;color:var(--text);margin-bottom:12px;font-style:italic">${esc(c.notes)}</div>` : ''}

        <!-- Evidence checklist -->
        <div style="font-size:11px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Evidence Checklist</div>
        ${REQUIRED_DOCS.map(doc => {
          const existing = (c.docs||[]).find(d=>d.id===doc.id);
          const have = existing?.have || false;
          const priorityColor = doc.priority==='critical'?'var(--red)':doc.priority==='high'?'var(--gold)':'var(--muted)';
          return `
          <div style="display:flex;align-items:start;gap:10px;padding:7px 0;border-bottom:1px solid var(--rule)">
            <input type="checkbox" ${have?'checked':''} onchange="toggleConditionDoc('${c.id}','${doc.id}',this.checked)"
              style="width:auto;margin-top:3px;accent-color:var(--green)">
            <div style="flex:1">
              <div style="font-size:12px;font-weight:700;color:${have?'var(--green)':'var(--text)'}">
                ${esc(doc.label)} <span style="font-size:9px;font-weight:700;color:${priorityColor};text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif">${doc.priority}</span>
              </div>
              <div style="font-size:11px;color:var(--muted);line-height:1.5">${doc.desc}</div>
            </div>
          </div>`;
        }).join('')}

        <!-- Rating selector -->
        <div style="margin-top:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <label class="field-label" style="margin:0;white-space:nowrap">Claimed/Received Rating:</label>
          <select onchange="updateConditionRating('${c.id}',parseInt(this.value))" style="font-size:13px;width:auto;padding:5px 10px">
            <option value="0" ${!c.rating?'selected':''}>Not rated</option>
            ${[10,20,30,40,50,60,70,80,90,100].map(r=>`<option value="${r}" ${c.rating===r?'selected':''}>${r}%</option>`).join('')}
          </select>
        </div>
      </div>` : ''}
    </div>`;
}

// ── Evidence tracker tab ───────────────────────────────────────────────

function renderVAEvidence(conditions) {
  if (!conditions.length) return `
    <div class="card" style="text-align:center;padding:32px;color:var(--muted)">
      Add conditions first — then track your evidence here.
      <div style="margin-top:12px"><button class="btn btn-primary btn-sm" onclick="toggleUI('vaTab','conditions')">→ Add Conditions</button></div>
    </div>`;

  // Roll up all evidence across conditions
  const docStatus = {};
  REQUIRED_DOCS.forEach(doc => {
    docStatus[doc.id] = {
      doc,
      conditions: conditions.map(c => ({
        name: c.name,
        have: (c.docs||[]).find(d=>d.id===doc.id)?.have || false
      }))
    };
  });

  return `
    <div class="card" style="margin-bottom:16px">
      <h2>📁 Evidence Status by Document Type</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 14px">Check off each document as you gather it in the Conditions tab. This view shows your overall evidence coverage.</p>
      ${REQUIRED_DOCS.map(doc => {
        const condStatuses = docStatus[doc.id].conditions;
        const haveCount = condStatuses.filter(c=>c.have).length;
        const pct = conditions.length > 0 ? Math.round((haveCount/conditions.length)*100) : 0;
        const priorityColor = doc.priority==='critical'?'var(--red)':doc.priority==='high'?'var(--gold)':'var(--muted)';
        return `
          <div style="padding:10px 0;border-bottom:1px solid var(--rule)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:4px">
              <div>
                <span style="font-weight:700;font-size:13px;color:var(--text)">${esc(doc.label)}</span>
                <span style="font-size:9px;font-weight:700;color:${priorityColor};text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-left:6px">${doc.priority}</span>
              </div>
              <div style="font-size:11px;color:var(--muted);font-family:'Familjen Grotesk',sans-serif">${haveCount}/${conditions.length} conditions</div>
            </div>
            <div style="height:4px;background:var(--rule);border-radius:2px;overflow:hidden;margin-bottom:4px">
              <div style="height:4px;background:${pct>=80?'var(--green)':pct>=50?'var(--gold)':'var(--red)'};width:${pct}%;border-radius:2px"></div>
            </div>
            <div style="font-size:11px;color:var(--dim)">${doc.desc}</div>
          </div>`;
      }).join('')}
    </div>

    <!-- What to get first -->
    <div class="card" style="background:var(--accent-light);border:1px solid #c0cfe0">
      <h2>📋 Priority Action List</h2>
      ${REQUIRED_DOCS.filter(d=>d.priority==='critical'||d.priority==='high').map(doc => {
        const haveCount = docStatus[doc.id].conditions.filter(c=>c.have).length;
        const missing = docStatus[doc.id].conditions.filter(c=>!c.have).map(c=>c.name);
        if (!missing.length) return '';
        return `
          <div style="padding:8px 0;border-bottom:1px solid var(--rule)">
            <div style="font-weight:700;font-size:13px;color:var(--accent)">${esc(doc.label)}</div>
            <div style="font-size:12px;color:var(--muted)">Missing for: ${missing.map(n=>esc(n)).join(', ')}</div>
          </div>`;
      }).filter(Boolean).join('')||`<div style="color:var(--green);font-weight:700">✓ All critical and high-priority documents accounted for</div>`}
    </div>`;
}

// ── C&P Exam prep tab ─────────────────────────────────────────────────

function renderVACPEPrep(conditions) {
  const busy  = state.ui.cpeBusy  || false;
  const prep  = state.vaClaim?.cpePrep || null;
  const error = state.ui.cpeError || '';

  return `
    <div class="card" style="border-left:4px solid var(--accent);margin-bottom:16px">
      <h2>🏥 What Is a C&P Exam?</h2>
      <div style="font-size:13px;color:var(--text);line-height:1.8">
        A Compensation and Pension exam is a medical exam ordered by the VA to evaluate the severity and service connection of your claimed conditions.
        It is conducted by a VA physician or contracted examiner. The exam results heavily influence your rating decision.<br><br>
        <strong>The most important thing to understand:</strong> Describe your worst days, not your average days. Veterans consistently undersell their symptoms because they're trained to push through. The examiner is documenting how your condition affects your daily life and functioning — not whether you can operate in the field.
      </div>
    </div>

    <!-- Key rules -->
    <div class="card" style="background:var(--gold-light);border:1px solid var(--gold);margin-bottom:16px">
      <h2>⚠️ C&P Exam Rules Veterans Get Wrong</h2>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[
          ['Describe your worst days, not your average days', 'The examiner documents functional impact. If your back prevents you from sitting for more than 20 minutes on bad days — say that, even if most days are 45 minutes.'],
          ['Do not minimize or soldier through', 'You are not being evaluated on toughness. You are documenting a medical condition. "I manage fine" is the most expensive sentence a veteran can say in this exam.'],
          ['Bring evidence with you', 'Bring your STR, buddy statements, and private medical records to the exam. Ask the examiner to review them.'],
          ['You can record the exam', 'In most states, you have the right to record your C&P exam. Check your state laws and inform the examiner before starting.'],
          ['Nexus letters matter', 'If you have a private physician who can connect your condition to service, bring their nexus letter. It carries significant weight.'],
          ['You can appeal', 'If the rating is wrong, you can file a supplemental claim, request a Higher-Level Review, or appeal to the Board of Veterans Appeals.']
        ].map(([title, detail]) => `
          <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--rule)30">
            <span style="color:var(--gold);font-size:14px;flex-shrink:0;margin-top:2px">⚠</span>
            <div>
              <div style="font-weight:700;font-size:13px;color:var(--accent)">${title}</div>
              <div style="font-size:12px;color:var(--muted);line-height:1.5;margin-top:2px">${detail}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- AI prep generator -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">🤖 C&P Exam Prep — Condition-Specific</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">Claude generates specific questions to prepare for, what the examiner will evaluate, and what to say and not say.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="generateCPEPrep()" ${busy||!conditions.length?'disabled':''}>
          ${busy?'<div class="spinner"></div> Preparing...':prep?'🔄 Regenerate':'Generate C&P Prep'}
        </button>
      </div>
      ${!conditions.length ? `<div style="font-size:13px;color:var(--muted)">Add your conditions first to generate condition-specific prep.</div>` : ''}
      ${error ? `<div style="color:var(--red);font-size:13px">${esc(error)}</div>` : ''}
      ${prep ? `<div style="font-size:13px;color:var(--text);line-height:1.8;white-space:pre-line;margin-top:12px">${esc(prep)}</div>` : ''}
    </div>`;
}

// ── Rating calculator tab ──────────────────────────────────────────────

function renderVARatingCalculator(conditions) {
  const ratedConditions = conditions.filter(c=>c.rating>0);
  const combined = ratedConditions.length > 0
    ? estimateCombinedRating(ratedConditions.map(c=>c.rating))
    : null;

  // Manual input for calculator
  const manualRatings = state.ui.vaCalcRatings || '';

  return `
    <div class="card">
      <h2>🧮 Combined Rating Calculator</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 16px">
        The VA does NOT add ratings together. It uses the "whole person" method — each condition is applied to the remaining healthy person.
        A veteran with 60% and 40% does NOT have 100% — they have approximately 76% (rounded to 80%).
      </p>

      <!-- From conditions -->
      ${ratedConditions.length > 0 ? `
      <div style="margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">From Your Conditions</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">
          ${ratedConditions.sort((a,b)=>b.rating-a.rating).map(c=>`
            <div style="background:var(--accent-light);border:1px solid #c0cfe0;border-radius:2px;padding:6px 12px;font-size:13px">
              <span style="font-weight:700;color:var(--accent)">${c.rating}%</span>
              <span style="color:var(--muted);margin-left:4px">${esc(c.name.slice(0,25))}</span>
            </div>`).join('')}
        </div>
        <div style="background:var(--navy);color:white;border-radius:2px;padding:16px;text-align:center">
          <div style="font-size:11px;opacity:0.6;font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Estimated Combined Rating</div>
          <div style="font-size:42px;font-weight:800;font-family:'Familjen Grotesk',sans-serif;line-height:1;color:var(--gold)">${combined}%</div>
          <div style="font-size:11px;opacity:0.5;margin-top:6px">VA rounds to nearest 10% · This is an estimate</div>
        </div>
      </div>` : ''}

      <!-- Manual calculator -->
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Manual Calculator</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Enter ratings separated by commas (e.g., 50, 30, 20, 10)</div>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <input id="va-calc-input" value="${esc(manualRatings)}" placeholder="e.g., 70, 50, 30, 20, 10"
            oninput="toggleUI('vaCalcRatings',this.value)"
            style="flex:1;font-size:13px">
          <button class="btn btn-primary btn-sm" onclick="calculateManualRating()">Calculate</button>
        </div>
        ${state.ui.vaCalcResult ? `
        <div style="background:var(--navy);color:white;border-radius:2px;padding:14px;text-align:center">
          <div style="font-size:11px;opacity:0.6;font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Combined Rating</div>
          <div style="font-size:36px;font-weight:800;font-family:'Familjen Grotesk',sans-serif;color:var(--gold)">${state.ui.vaCalcResult}%</div>
          <div style="font-size:11px;opacity:0.5;margin-top:4px">Individual ratings: ${esc(manualRatings)}</div>
        </div>` : ''}
      </div>

      <!-- How the math works -->
      <div style="margin-top:16px;background:var(--paper);border-radius:2px;padding:14px;font-size:13px;color:var(--muted);line-height:1.7">
        <strong style="color:var(--text)">How the math works:</strong> The VA sorts ratings highest to lowest.
        The highest rating is applied first (e.g., 60% disabled = 40% "whole person" remaining).
        The next rating (e.g., 40%) is applied to that remaining 40%, yielding 16% more disability.
        Total: 76%, rounded to 80%. This is why ratings don't add up the way you'd expect.
      </div>
    </div>`;
}

// ── Calculation engine ─────────────────────────────────────────────────

function estimateCombinedRating(ratings) {
  if (!ratings.length) return 0;
  const sorted = [...ratings].sort((a,b) => b-a);
  let remaining = 100;
  let combined  = 0;
  for (const r of sorted) {
    const contribution = remaining * (r/100);
    combined  += contribution;
    remaining -= contribution;
  }
  // Round to nearest 10 per VA rules
  return Math.round(Math.round(combined) / 10) * 10;
}

function calculateManualRating() {
  const input = document.getElementById('va-calc-input')?.value || state.ui.vaCalcRatings || '';
  const ratings = input.split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n)&&n>0&&n<=100);
  if (!ratings.length) { showToast('Enter at least one rating', false); return; }
  const result = estimateCombinedRating(ratings);
  setState({ ui: { ...state.ui, vaCalcResult: result } });
}

// ── CRUD ───────────────────────────────────────────────────────────────

function saveVACondition() {
  const name       = document.getElementById('va-cond-name')?.value?.trim();
  const bodySystem = document.getElementById('va-cond-system')?.value;
  if (!name) { showToast('Enter a condition name', false); return; }

  const condition = {
    id:                id(),
    name,
    bodySystem:        bodySystem || 'musculoskeletal',
    serviceConnection: document.getElementById('va-cond-connection')?.value || 'direct',
    rating:            parseInt(document.getElementById('va-cond-rating')?.value||'0'),
    notes:             document.getElementById('va-cond-notes')?.value?.trim() || '',
    docs:              REQUIRED_DOCS.map(d=>({ id:d.id, have:false })),
    status:            'documenting'
  };

  const claim = getVAClaim();
  claim.conditions = [...(claim.conditions||[]), condition];
  state.vaClaim = claim;
  saveVAClaim();
  setState({ ui: { ...state.ui, vaAddCondition: false } });
  showToast(`✓ "${name}" added`);
}

function removeVACondition(cid) {
  if (!confirm('Remove this condition?')) return;
  const claim = getVAClaim();
  claim.conditions = (claim.conditions||[]).filter(c=>c.id!==cid);
  state.vaClaim = claim;
  saveVAClaim();
  setState({});
}

function toggleConditionDoc(cid, docId, have) {
  const claim = getVAClaim();
  claim.conditions = (claim.conditions||[]).map(c => {
    if (c.id !== cid) return c;
    const docs = (c.docs||REQUIRED_DOCS.map(d=>({id:d.id,have:false}))).map(d =>
      d.id === docId ? { ...d, have } : d
    );
    return { ...c, docs };
  });
  state.vaClaim = claim;
  saveVAClaim();
  setState({});
}

function updateConditionRating(cid, rating) {
  const claim = getVAClaim();
  claim.conditions = (claim.conditions||[]).map(c =>
    c.id === cid ? { ...c, rating } : c
  );
  state.vaClaim = claim;
  saveVAClaim();
  setState({});
}

function updateVAField(field, value) {
  const claim = getVAClaim();
  claim[field] = value;
  state.vaClaim = claim;
  saveVAClaim();
  setState({});
}

// ── AI: Suggest conditions ─────────────────────────────────────────────

async function generateConditionSuggestions() {
  const p = state.profile;
  const existing = (state.vaClaim?.conditions||[]).map(c=>c.name);
  showToast('🤖 Identifying potentially ratable conditions...', true);

  try {
    const raw = await callClaude(
      `You are a VSO (Veterans Service Organization) expert who helps veterans identify potentially ratable VA disability conditions. You are thorough, not conservative — you want the veteran to claim everything that is legitimately service-connected. Return JSON only.`,
      `Identify potentially ratable VA disability conditions for this veteran.

VETERAN: ${p.branch||'Military'} | ${p.rank||'N/A'} | ${p.yearsOfService||'N/A'} years of service | MOS: ${p.mosRate||'N/A'}
Experience: ${state.assignments.slice(0,3).map(a=>`${a.dutyTitle} at ${a.base}: ${(a.accomplishments||'').slice(0,200)}`).join('; ')||'Not specified'}

EXISTING CONDITIONS (do not duplicate): ${existing.join(', ')||'None'}

Based on the veteran's MOS, years of service, and typical military service patterns, suggest potentially ratable conditions across body systems.

For a ${p.yearsOfService||'20'}-year ${p.branch||'military'} veteran, commonly ratable conditions include:
- Musculoskeletal: knees, back, shoulders, hips, ankles, feet (nearly universal in active duty)
- Hearing: tinnitus (most common VA claim), hearing loss
- Sleep: sleep apnea (very common in veterans)
- Mental health: PTSD, anxiety, depression (particularly with combat or high-stress MOS)
- GI: GERD, IBS (from NSAID use for pain management)
- Skin: conditions from environment, uniforms, sun exposure

Return ONLY this JSON array (no markdown):
[
  {
    "name": "Specific condition name (be specific, e.g., 'Left knee degenerative joint disease' not just 'knee pain')",
    "bodySystem": "musculoskeletal|hearing|mental-health|respiratory|skin|vision|gi|cardiovascular|neurological|reproductive",
    "serviceConnection": "direct|secondary|presumptive",
    "rationale": "One sentence explaining why this is likely service-connected for this veteran",
    "priority": "high|medium|low"
  }
]

Return 6-10 conditions. Include only conditions that are genuinely plausible for this veteran's service history.`
    );

    let suggestions;
    try {
      suggestions = typeof extractJSON === 'function'
        ? extractJSON(raw)
        : JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) { throw new Error('Parse error. Try again.'); }

    // Show as a selection UI
    setState({ ui: { ...state.ui, vaConditionSuggestions: suggestions } });

    // Render them as a selection modal
    const container = document.querySelector('.main');
    if (!container) return;

    const existingNames = new Set(existing);
    const filtered = suggestions.filter(s => !existingNames.has(s.name));

    if (!filtered.length) { showToast('No new suggestions — your existing conditions cover the key areas'); return; }

    // Add all suggested conditions at once
    const claim = getVAClaim();
    const newConds = filtered.map(s => ({
      id: id(),
      name: s.name,
      bodySystem: s.bodySystem || 'musculoskeletal',
      serviceConnection: s.serviceConnection || 'direct',
      rating: 0,
      notes: s.rationale || '',
      docs: REQUIRED_DOCS.map(d=>({ id:d.id, have:false })),
      status: 'suggested'
    }));
    claim.conditions = [...(claim.conditions||[]), ...newConds];
    state.vaClaim = claim;
    saveVAClaim();
    setState({});
    showToast(`✓ Added ${newConds.length} suggested conditions — review and remove any that don't apply`);
  } catch(err) {
    showToast('Error: ' + err.message, false);
  }
}

// ── AI: C&P exam prep ─────────────────────────────────────────────────

async function generateCPEPrep() {
  const conditions = state.vaClaim?.conditions || [];
  if (!conditions.length) { showToast('Add conditions first', false); return; }

  setState({ ui: { ...state.ui, cpeBusy: true, cpeError: '' } });
  const p = state.profile;

  try {
    const prep = await callClaude(
      `You are a VA claims expert and VSO who prepares veterans for C&P exams. You give specific, direct advice — not generic information. You tell veterans exactly what to say, what not to say, and what to bring.`,
      `Prepare this veteran for their VA C&P exam across their claimed conditions.

VETERAN: ${p.branch||'Military'} | ${p.rank||'N/A'} | ${p.yearsOfService||'N/A'} years
CONDITIONS CLAIMED:
${conditions.map(c=>`• ${c.name} (${VA_BODY_SYSTEMS.find(s=>s.id===c.bodySystem)?.label||'unknown'}) — ${c.rating>0?c.rating+'% rated':'unrated'}`).join('\n')}

For each condition, provide:
1. What the examiner is specifically evaluating (the diagnostic criteria they're using)
2. The range of motion or functional tests they'll likely perform
3. Exactly what to say and demonstrate — describe worst days, not average days
4. What NOT to say (common veteran mistakes that lower ratings)
5. Any condition-specific tips

Then provide:
- General C&P exam rules (brief — 3-5 key points)
- What to bring to the exam

Write in plain language. Be specific and direct. This is the most important exam they'll take.`
    );

    const claim = getVAClaim();
    claim.cpePrep = prep;
    state.vaClaim = claim;
    saveVAClaim();
    setState({ ui: { ...state.ui, cpeBusy: false, cpeError: '' } });
    if (typeof trackAction === 'function') trackAction('va_cpe_prep');
    showToast('✓ C&P prep generated');
  } catch(err) {
    setState({ ui: { ...state.ui, cpeBusy: false, cpeError: err.message } });
  }
}
