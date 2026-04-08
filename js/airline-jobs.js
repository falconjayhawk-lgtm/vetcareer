// ── airline-jobs.js — Phase 3: Airline Application Tracker ────────────
// State lives in state.airlineApps (array), initialized defensively.
// All state access: state.airlineApps = state.airlineApps || [];
// ──────────────────────────────────────────────────────────────────────

// ── Status pipeline ────────────────────────────────────────────────────
const AIRLINE_STATUSES = [
  { id: 'researching', label: 'Researching',  color: '#6b7280', icon: '🔍' },
  { id: 'applied',     label: 'Applied',       color: '#2563eb', icon: '📋' },
  { id: 'oa',          label: 'Online Test',   color: '#7c3aed', icon: '📝' },
  { id: 'hr_screen',   label: 'HR Screen',     color: '#d97706', icon: '📞' },
  { id: 'interview',   label: 'Interview',     color: '#ea580c', icon: '🎤' },
  { id: 'cjo',         label: 'CJO',           color: '#16a34a', icon: '✅' },
  { id: 'class_date',  label: 'Class Date',    color: '#0891b2', icon: '🗓️' },
  { id: 'flying',      label: 'Flying',        color: '#1a3a6b', icon: '✈️' },
  { id: 'no_offer',    label: 'No Offer',      color: '#dc2626', icon: '❌' },
  { id: 'withdrew',    label: 'Withdrew',      color: '#9ca3af', icon: '↩️' }
];

const AIRLINE_STATUS_MAP = Object.fromEntries(AIRLINE_STATUSES.map(s => [s.id, s]));

// Pipeline stages in order (for progress display)
const PIPELINE_STAGES = ['researching','applied','oa','hr_screen','interview','cjo','class_date','flying'];

// Common airline bases for autocomplete hint
const COMMON_BASES = ['ATL','BOS','CLT','DEN','DFW','DTW','EWR','HNL','IAD','IAH','JFK','LAX','LGA','MCO','MDW','MEM','MIA','MKE','MSP','MSY','ORD','PHL','PHX','SEA','SFO','SLC','SNA','STL','TPA'];

// ── Main render ────────────────────────────────────────────────────────

function renderAirlineJobs() {
  state.airlineApps = state.airlineApps || [];
  const apps       = state.airlineApps;
  const addMode    = state.ui.addAirlineApp || false;
  const editId     = state.ui.editAirlineId || null;
  const filterStatus = state.ui.airlineFilter || 'all';

  const filtered = filterStatus === 'all' ? apps : apps.filter(a => a.status === filterStatus);
  const activePipeline = apps.filter(a => !['no_offer','withdrew'].includes(a.status));

  // Summary stats
  const stats = {
    total:     apps.length,
    active:    activePipeline.length,
    interview: apps.filter(a => a.status === 'interview').length,
    cjo:       apps.filter(a => ['cjo','class_date','flying'].includes(a.status)).length
  };

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <h2 style="margin:0;font-family:'Familjen Grotesk',sans-serif;font-size:18px;font-weight:700;color:var(--accent)">✈️ Airline Applications</h2>
        <p style="font-size:12px;color:var(--muted);margin:2px 0 0">Track your airline hiring pipeline — from research to class date</p>
      </div>
      <button class="btn btn-primary" onclick="toggleUI('addAirlineApp',true);toggleUI('editAirlineId',null)">+ Add Airline</button>
    </div>

    <!-- Summary stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
      ${[
        { label:'Total',     value: stats.total,     color:'var(--accent)' },
        { label:'Active',    value: stats.active,    color:'var(--gold)' },
        { label:'Interview', value: stats.interview, color:'#ea580c' },
        { label:'CJO+',      value: stats.cjo,       color:'var(--green)' }
      ].map(s => `
        <div style="background:white;border:1px solid var(--rule-dark);border-radius:2px;padding:10px;text-align:center;box-shadow:2px 2px 0 var(--rule)">
          <div style="font-size:26px;font-weight:800;color:${s.color};font-family:'Familjen Grotesk',sans-serif;line-height:1">${s.value}</div>
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-top:3px">${s.label}</div>
        </div>`).join('')}
    </div>

    <!-- Filter row -->
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px;background:white;border:1px solid var(--rule-dark);border-radius:2px;padding:10px 14px;box-shadow:2px 2px 0 var(--rule)">
      <span style="font-size:12px;color:var(--muted);font-weight:600">FILTER:</span>
      <button onclick="toggleUI('airlineFilter','all')" style="padding:3px 12px;border-radius:2px;border:1.5px solid ${filterStatus==='all'?'var(--accent)':'var(--rule-dark)'};background:${filterStatus==='all'?'var(--accent)':'white'};color:${filterStatus==='all'?'white':'var(--muted)'};font-size:12px;font-weight:600;cursor:pointer;font-family:'Familjen Grotesk',sans-serif">All (${apps.length})</button>
      ${AIRLINE_STATUSES.filter(s => apps.some(a => a.status === s.id)).map(s => `
        <button onclick="toggleUI('airlineFilter','${s.id}')" style="padding:3px 12px;border-radius:2px;border:1.5px solid ${filterStatus===s.id?s.color:'var(--rule-dark)'};background:${filterStatus===s.id?s.color+'18':'white'};color:${filterStatus===s.id?s.color:'var(--muted)'};font-size:12px;font-weight:600;cursor:pointer;font-family:'Familjen Grotesk',sans-serif">
          ${s.icon} ${s.label} (${apps.filter(a=>a.status===s.id).length})
        </button>`).join('')}
    </div>

    ${addMode && !editId ? renderAirlineAppForm(null) : ''}

    ${filtered.length === 0 && !addMode ? `
      <div class="card" style="text-align:center;padding:40px;color:var(--muted)">
        ✈️ No airline applications yet.<br>
        <span style="font-size:13px">Click "+ Add Airline" to start tracking your pipeline.</span>
      </div>` : ''}

    ${filtered.map(app => editId === app.id ? renderAirlineAppForm(app) : renderAirlineAppCard(app)).join('')}`;
}

// ── Application card ───────────────────────────────────────────────────

function renderAirlineAppCard(app) {
  const st     = AIRLINE_STATUS_MAP[app.status] || AIRLINE_STATUS_MAP['researching'];
  const log    = (app.activityLog || []).slice().reverse();
  const showLog = state.ui[`alLog_${app.id}`] || false;

  // Pipeline progress bar
  const stageIdx = PIPELINE_STAGES.indexOf(app.status);
  const pipelineHtml = PIPELINE_STAGES.map((s, i) => {
    const info    = AIRLINE_STATUS_MAP[s];
    const done    = stageIdx > i;
    const current = stageIdx === i;
    return `<div style="flex:1;text-align:center;position:relative">
      <div style="width:20px;height:20px;border-radius:50%;margin:0 auto 3px;font-size:10px;line-height:20px;background:${done?'var(--green)':current?st.color:'var(--rule)'};color:${done||current?'white':'var(--muted)'};font-weight:700">${done?'✓':i+1}</div>
      <div style="font-size:9px;color:${current?st.color:done?'var(--green)':'var(--muted)'};font-weight:${current?'700':'400'};letter-spacing:0.03em;white-space:nowrap">${info?.label||s}</div>
      ${i < PIPELINE_STAGES.length-1 ? `<div style="position:absolute;top:10px;left:50%;right:-50%;height:2px;background:${done?'var(--green)':'var(--rule)'};z-index:0"></div>` : ''}
    </div>`;
  }).join('');

  // Key dates display
  const dates = [
    { label: 'Applied',     value: app.applicationDate },
    { label: 'OA',          value: app.oaDate },
    { label: 'HR Screen',   value: app.hrScreenDate },
    { label: 'Interview',   value: app.interviewDate },
    { label: 'CJO',         value: app.cjoDate },
    { label: 'Class Date',  value: app.classDate }
  ].filter(d => d.value);

  return `
    <div class="card" style="margin-bottom:12px;border-left:4px solid ${st.color}">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-weight:700;font-size:17px;font-family:'Familjen Grotesk',sans-serif;color:var(--accent)">${esc(app.carrier)}</span>
            <span style="background:${st.color}18;color:${st.color};border:1.5px solid ${st.color}40;border-radius:2px;padding:2px 10px;font-size:11px;font-weight:700;font-family:'Familjen Grotesk',sans-serif">${st.icon} ${st.label}</span>
            ${app.classDate ? `<span style="background:var(--gold-light);color:var(--gold);border:1px solid var(--gold);border-radius:2px;padding:2px 8px;font-size:11px;font-weight:700">🗓️ Class: ${app.classDate}</span>` : ''}
          </div>
          <div style="font-size:12px;color:var(--muted);display:flex;gap:12px;flex-wrap:wrap">
            ${app.basePreference ? `<span>🏠 ${esc(app.basePreference)}</span>` : ''}
            ${app.equipmentPref  ? `<span>✈️ ${esc(app.equipmentPref)}</span>`  : ''}
            ${app.referralContact ? `<span>🤝 Via ${esc(app.referralContact)}</span>` : ''}
            ${app.projectedSeniority ? `<span>📊 Sen. #${esc(app.projectedSeniority)}</span>` : ''}
            ${app.classNumber ? `<span>📋 Class ${esc(app.classNumber)}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;margin-left:8px">
          <button class="btn btn-secondary btn-sm" onclick="toggleUI('editAirlineId','${app.id}')">✏</button>
          <button class="btn btn-danger btn-sm" onclick="removeAirlineApp('${app.id}')">✕</button>
        </div>
      </div>

      <!-- Pipeline progress -->
      ${!['no_offer','withdrew'].includes(app.status) ? `
      <div style="display:flex;margin:12px 0;position:relative">
        ${pipelineHtml}
      </div>` : ''}

      <!-- Key dates -->
      ${dates.length ? `
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        ${dates.map(d => `
          <div style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:4px 10px;font-size:11px">
            <span style="color:var(--muted)">${d.label}:</span>
            <span style="font-weight:600;color:var(--text);margin-left:4px">${d.value}</span>
          </div>`).join('')}
      </div>` : ''}

      ${app.notes ? `<div style="background:var(--paper);border-radius:2px;padding:8px;font-size:12px;color:var(--text);margin-bottom:10px;line-height:1.6">${esc(app.notes)}</div>` : ''}

      <!-- Quick status advance -->
      ${!['flying','no_offer','withdrew'].includes(app.status) ? `
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        <span style="font-size:11px;color:var(--muted);font-weight:600">ADVANCE TO:</span>
        ${AIRLINE_STATUSES
          .filter(s => s.id !== app.status && !['researching'].includes(s.id))
          .slice(0,5)
          .map(s => `
            <button onclick="quickAirlineStatus('${app.id}','${s.id}')"
              style="background:${s.color}12;color:${s.color};border:1px solid ${s.color}40;border-radius:2px;padding:2px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Familjen Grotesk',sans-serif">
              ${s.icon} ${s.label}
            </button>`).join('')}
      </div>` : ''}

      <!-- Note input -->
      <div style="display:flex;gap:6px">
        <input id="al-note-${app.id}" placeholder="Add a note — interview feedback, contact, next steps..." style="font-size:12px;padding:6px 10px;flex:1">
        <button class="btn btn-secondary btn-sm" onclick="addAirlineNote('${app.id}')">+ Note</button>
      </div>

      <!-- Activity log -->
      ${log.length ? `
      <div style="margin-top:10px">
        <button onclick="toggleUI('alLog_${app.id}',${!showLog})" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px">
          ${showLog?'▼':'▶'} Activity (${log.length})
        </button>
        ${showLog ? `
        <div style="margin-top:8px;border-left:2px solid var(--rule);padding-left:12px">
          ${log.map(e => `
            <div style="margin-bottom:6px;font-size:12px">
              <span style="color:var(--dim)">${new Date(e.date).toLocaleDateString()} ${new Date(e.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
              ${e.type==='status'
                ? `<span style="margin-left:6px">${e.from?`<span style="color:var(--muted)">${e.from}</span> → `:''}<span style="color:${AIRLINE_STATUS_MAP[e.to]?.color||'var(--text)'};font-weight:600">${e.to}</span></span>`
                : `<span style="color:var(--text);margin-left:6px">${esc(e.note)}</span>`}
            </div>`).join('')}
        </div>` : ''}
      </div>` : ''}
    </div>`;
}

// ── Add / Edit form ────────────────────────────────────────────────────

function renderAirlineAppForm(app) {
  const a   = app || {};
  const pre = app ? 'ea' : 'na';
  return `
    <div class="card" style="border:2px solid var(--accent);margin-bottom:16px">
      <h2>${app ? 'Edit Application' : '+ Add Airline Application'}</h2>

      <div class="grid2">
        <div class="field">
          <label class="field-label">Airline / Carrier *</label>
          <input id="${pre}-carrier" value="${esc(a.carrier||'')}" placeholder="United, Delta, FedEx, Southwest...">
        </div>
        <div class="field">
          <label class="field-label">Status</label>
          <select id="${pre}-status">
            ${AIRLINE_STATUSES.map(s => `<option value="${s.id}" ${(a.status||'researching')===s.id?'selected':''}>${s.icon} ${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Base / Domicile Preference</label>
          <input id="${pre}-base" value="${esc(a.basePreference||'')}" placeholder="ATL, DEN, ORD, SFO...">
          <div style="font-size:10px;color:var(--dim);margin-top:2px">Common: ${COMMON_BASES.slice(0,8).join(', ')}</div>
        </div>
        <div class="field">
          <label class="field-label">Equipment Preference</label>
          <input id="${pre}-equip" value="${esc(a.equipmentPref||'')}" placeholder="Narrow body, Wide body, Cargo, Any...">
        </div>
        <div class="field">
          <label class="field-label">Referral / Employee Contact</label>
          <input id="${pre}-referral" value="${esc(a.referralContact||'')}" placeholder="Name of employee who referred you">
        </div>
        <div class="field">
          <label class="field-label">Application Date</label>
          <input type="date" id="${pre}-appDate" value="${esc(a.applicationDate||'')}">
        </div>
      </div>

      <!-- Interview pipeline -->
      <div style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:14px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:12px">Interview Pipeline</div>
        <div class="grid2">
          <div class="field">
            <label class="field-label">OA / Written Test Date</label>
            <input type="date" id="${pre}-oaDate" value="${esc(a.oaDate||'')}">
          </div>
          <div class="field">
            <label class="field-label">OA Result</label>
            <select id="${pre}-oaResult">
              <option value="">Not taken yet</option>
              ${['Passed','Failed','Pending results'].map(r=>`<option ${a.oaResult===r?'selected':''}>${r}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label">HR Screen Date</label>
            <input type="date" id="${pre}-hrDate" value="${esc(a.hrScreenDate||'')}">
          </div>
          <div class="field">
            <label class="field-label">Interview Type</label>
            <select id="${pre}-ivType">
              <option value="">Not scheduled yet</option>
              ${['HR + SIM','HR Only','SIM Only','Panel','Technical','HR + Panel + SIM'].map(r=>`<option ${a.interviewType===r?'selected':''}>${r}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label">Interview Date</label>
            <input type="date" id="${pre}-ivDate" value="${esc(a.interviewDate||'')}">
          </div>
          <div class="field">
            <label class="field-label">Interview Result</label>
            <select id="${pre}-ivResult">
              <option value="">Pending</option>
              ${['CJO Received','No Offer','Reschedule','Pending','Withdrew'].map(r=>`<option ${a.interviewResult===r?'selected':''}>${r}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- CJO & class details -->
      <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:14px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;color:var(--gold);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:12px">CJO & Class Details</div>
        <div class="grid2">
          <div class="field">
            <label class="field-label">CJO Date</label>
            <input type="date" id="${pre}-cjoDate" value="${esc(a.cjoDate||'')}">
          </div>
          <div class="field">
            <label class="field-label">Class Date</label>
            <input type="date" id="${pre}-classDate" value="${esc(a.classDate||'')}">
          </div>
          <div class="field">
            <label class="field-label">Newhire Class Number</label>
            <input id="${pre}-classNum" value="${esc(a.classNumber||'')}" placeholder="e.g. UAL-2025-04">
          </div>
          <div class="field">
            <label class="field-label">Projected Seniority #</label>
            <input id="${pre}-seniority" value="${esc(a.projectedSeniority||'')}" placeholder="e.g. 14,832">
            <div style="font-size:10px;color:var(--dim);margin-top:2px">Lower number = better seniority</div>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="field-label">Notes</label>
        <textarea id="${pre}-notes" rows="3" placeholder="Recruiter feedback, interview tips, culture notes, next steps...">${esc(a.notes||'')}</textarea>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="${app ? `updateAirlineApp('${app.id}')` : 'saveAirlineApp()'}">
          ${app ? 'Update' : 'Save Application'}
        </button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('addAirlineApp',false);toggleUI('editAirlineId',null)">Cancel</button>
      </div>
    </div>`;
}

// ── CRUD functions ─────────────────────────────────────────────────────

function saveAirlineApp() {
  const pre    = 'na';
  const carrier = document.getElementById(pre+'-carrier')?.value?.trim();
  if (!carrier) { showToast('Enter an airline name', false); return; }
  const status  = document.getElementById(pre+'-status')?.value || 'researching';
  const now     = new Date().toISOString();
  const app = {
    id:              id(),
    carrier,
    status,
    basePreference:  document.getElementById(pre+'-base')?.value     || '',
    equipmentPref:   document.getElementById(pre+'-equip')?.value    || '',
    referralContact: document.getElementById(pre+'-referral')?.value || '',
    applicationDate: document.getElementById(pre+'-appDate')?.value  || '',
    oaDate:          document.getElementById(pre+'-oaDate')?.value   || '',
    oaResult:        document.getElementById(pre+'-oaResult')?.value || '',
    hrScreenDate:    document.getElementById(pre+'-hrDate')?.value   || '',
    interviewType:   document.getElementById(pre+'-ivType')?.value   || '',
    interviewDate:   document.getElementById(pre+'-ivDate')?.value   || '',
    interviewResult: document.getElementById(pre+'-ivResult')?.value || '',
    cjoDate:         document.getElementById(pre+'-cjoDate')?.value  || '',
    classDate:       document.getElementById(pre+'-classDate')?.value || '',
    classNumber:     document.getElementById(pre+'-classNum')?.value  || '',
    projectedSeniority: document.getElementById(pre+'-seniority')?.value || '',
    notes:           document.getElementById(pre+'-notes')?.value    || '',
    dateAdded:       now,
    activityLog:     [{ date: now, type: 'status', from: null, to: status, note: 'Added to tracker' }]
  };
  state.airlineApps = [...(state.airlineApps || []), app];
  try { localStorage.setItem('vc_airlineApps', JSON.stringify(state.airlineApps)); } catch(e) {}
  setState({ ui: { ...state.ui, addAirlineApp: false } });
  if (typeof trackAction === 'function') trackAction('job_added');
  showToast(`✈️ ${carrier} added to your pipeline`);
}

function updateAirlineApp(aid) {
  const pre    = 'ea';
  const carrier = document.getElementById(pre+'-carrier')?.value?.trim();
  if (!carrier) { showToast('Enter an airline name', false); return; }
  const existing = (state.airlineApps || []).find(a => a.id === aid);
  const newStatus = document.getElementById(pre+'-status')?.value;
  const now = new Date().toISOString();
  const log = [...(existing?.activityLog || [])];
  if (existing && newStatus !== existing.status) {
    log.push({ date: now, type: 'status', from: existing.status, to: newStatus, note: '' });
  }
  const updated = {
    ...existing, id: aid, carrier, status: newStatus,
    basePreference:  document.getElementById(pre+'-base')?.value     || existing?.basePreference     || '',
    equipmentPref:   document.getElementById(pre+'-equip')?.value    || existing?.equipmentPref      || '',
    referralContact: document.getElementById(pre+'-referral')?.value || existing?.referralContact    || '',
    applicationDate: document.getElementById(pre+'-appDate')?.value  || existing?.applicationDate    || '',
    oaDate:          document.getElementById(pre+'-oaDate')?.value   || existing?.oaDate             || '',
    oaResult:        document.getElementById(pre+'-oaResult')?.value || existing?.oaResult           || '',
    hrScreenDate:    document.getElementById(pre+'-hrDate')?.value   || existing?.hrScreenDate       || '',
    interviewType:   document.getElementById(pre+'-ivType')?.value   || existing?.interviewType      || '',
    interviewDate:   document.getElementById(pre+'-ivDate')?.value   || existing?.interviewDate      || '',
    interviewResult: document.getElementById(pre+'-ivResult')?.value || existing?.interviewResult    || '',
    cjoDate:         document.getElementById(pre+'-cjoDate')?.value  || existing?.cjoDate            || '',
    classDate:       document.getElementById(pre+'-classDate')?.value || existing?.classDate         || '',
    classNumber:     document.getElementById(pre+'-classNum')?.value  || existing?.classNumber       || '',
    projectedSeniority: document.getElementById(pre+'-seniority')?.value || existing?.projectedSeniority || '',
    notes:           document.getElementById(pre+'-notes')?.value    || existing?.notes              || '',
    activityLog:     log
  };
  state.airlineApps = (state.airlineApps || []).map(a => a.id === aid ? updated : a);
  try { localStorage.setItem('vc_airlineApps', JSON.stringify(state.airlineApps)); } catch(e) {}
  setState({ ui: { ...state.ui, editAirlineId: null } });
  showToast('✈️ Application updated');
}

function removeAirlineApp(aid) {
  if (!confirm('Remove this airline application?')) return;
  state.airlineApps = (state.airlineApps || []).filter(a => a.id !== aid);
  try { localStorage.setItem('vc_airlineApps', JSON.stringify(state.airlineApps)); } catch(e) {}
  setState({});
  showToast('Removed');
}

function quickAirlineStatus(aid, newStatus) {
  const existing = (state.airlineApps || []).find(a => a.id === aid);
  if (!existing || existing.status === newStatus) return;
  const now = new Date().toISOString();
  const log = [...(existing.activityLog || []), { date: now, type: 'status', from: existing.status, to: newStatus, note: '' }];
  state.airlineApps = (state.airlineApps || []).map(a => a.id === aid ? { ...a, status: newStatus, activityLog: log } : a);
  try { localStorage.setItem('vc_airlineApps', JSON.stringify(state.airlineApps)); } catch(e) {}
  setState({});
  const st = AIRLINE_STATUS_MAP[newStatus];
  showToast(`${st?.icon || ''} ${existing.carrier} → ${st?.label || newStatus}`);
}

function addAirlineNote(aid) {
  const input = document.getElementById(`al-note-${aid}`);
  const note  = input?.value?.trim();
  if (!note) return;
  const existing = (state.airlineApps || []).find(a => a.id === aid);
  if (!existing) return;
  const now = new Date().toISOString();
  const log = [...(existing.activityLog || []), { date: now, type: 'note', note }];
  state.airlineApps = (state.airlineApps || []).map(a => a.id === aid ? { ...a, activityLog: log } : a);
  try { localStorage.setItem('vc_airlineApps', JSON.stringify(state.airlineApps)); } catch(e) {}
  setState({});
  showToast('Note added ✓');
}

// ── Load persisted airline apps on startup ────────────────────────────
// Call once during app init alongside loadFlightHoursFromStorage()

function loadAirlineAppsFromStorage() {
  try {
    const stored = localStorage.getItem('vc_airlineApps');
    if (stored) state.airlineApps = JSON.parse(stored);
    else state.airlineApps = [];
  } catch(e) {
    state.airlineApps = [];
  }
}
