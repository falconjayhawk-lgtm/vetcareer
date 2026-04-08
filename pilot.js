// ── pilot.js — Phase 1: Career Path + Aviation Flight Profile ─────────
// Handles:
//   1. Career path toggle (civilian / airline) — always visible in Profile
//   2. Aviation certificates & ratings
//   3. Military flight hours form
//   4. Civilian hours running log (add/edit/remove entries)
//   5. Combined hours auto-calculator (feeds airline resume)
//   6. Pilot content detection from document uploads
//
// Integration: call renderCareerPathCard() and renderAviationSection()
// inside renderProfile() in profile.js — see integration comments below.
// ──────────────────────────────────────────────────────────────────────

// ── State helpers ──────────────────────────────────────────────────────

function getCareerPaths() {
  return state.profile.careerPaths || ['civilian'];
}

function isAirlinePath() {
  return getCareerPaths().includes('airline');
}

function getFlightHours() {
  if (!state.flightHours) {
    state.flightHours = {
      military: {
        total: '', pic: '', sic: '', multiEngine: '',
        turbine: '', instrument: '', night: '', simulator: '',
        byAircraft: []
      },
      civilian: []
    };
  }
  return state.flightHours;
}

function getPilotCerts() {
  return state.profile.pilotCerts || {
    atp: false, commercial: false, cfi: false, cfii: false,
    typeRatings: '', faaClass: '', faaExpiry: '', fcc: false
  };
}

// ── Combined hours calculator ──────────────────────────────────────────

function calcCombinedHours() {
  const fh = getFlightHours();
  const m  = fh.military;
  const civ = fh.civilian || [];

  const n = (v) => parseFloat(v) || 0;

  // Civilian totals — derived from per-entry fields
  const civTotal    = civ.reduce((s, e) => s + n(e.hours), 0);
  const civPIC      = civ.reduce((s, e) => s + n(e.pic), 0);
  const civTurbine  = civ.filter(e => e.turbine).reduce((s, e) => s + n(e.hours), 0);
  const civME       = civ.filter(e => e.multiEngine).reduce((s, e) => s + n(e.hours), 0);
  const civInst     = civ.reduce((s, e) => s + n(e.instrument), 0);
  const civNight    = civ.reduce((s, e) => s + n(e.night), 0);

  return {
    total:       n(m.total)       + civTotal,
    pic:         n(m.pic)         + civPIC,
    sic:         n(m.sic)         + (civTotal - civPIC),
    turbine:     n(m.turbine)     + civTurbine,
    multiEngine: n(m.multiEngine) + civME,
    instrument:  n(m.instrument)  + civInst,
    night:       n(m.night)       + civNight,
    simulator:   n(m.simulator)   // sim hours don't combine with actual
  };
}

// ── Career path card ───────────────────────────────────────────────────
// Always rendered in Profile. Civilian is always on (can't be removed).
// Toggling Airline shows/hides the aviation section without a full re-render.

function renderCareerPathCard() {
  const paths  = getCareerPaths();
  const airline = paths.includes('airline');

  return `
    <div class="card" style="border:2px solid ${airline ? 'var(--accent)' : 'var(--rule-dark)'}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div>
          <h2 style="margin:0">🗺️ Career Paths</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">
            Activate a path to unlock the right tools. You can run both at the same time.
          </p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">

        <!-- Civilian — always on -->
        <div style="padding:14px;border:2px solid var(--accent);background:var(--gold-light);border-radius:2px;display:flex;gap:10px;align-items:flex-start">
          <div style="font-size:20px">💼</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px;font-family:'Familjen Grotesk',sans-serif;color:var(--accent)">Civilian Careers</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">Resume builder, LinkedIn, interview prep, job tracker</div>
            <div style="margin-top:8px;font-size:11px;font-weight:700;color:var(--green);letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif">✓ ACTIVE — ALWAYS ON</div>
          </div>
        </div>

        <!-- Airline — toggleable -->
        <div id="cp-airline-card"
          style="padding:14px;border:2px solid ${airline ? 'var(--accent)' : 'var(--rule-dark)'};background:${airline ? 'var(--gold-light)' : 'white'};border-radius:2px;cursor:pointer;display:flex;gap:10px;align-items:flex-start"
          onclick="toggleCareerPath('airline')">
          <div style="font-size:20px">✈️</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px;font-family:'Familjen Grotesk',sans-serif;color:var(--accent)">Airline / Aviation</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">Flight hours logbook, airline resume, aviation certifications</div>
            <div style="margin-top:8px;font-size:11px;font-weight:700;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;color:${airline ? 'var(--green)' : 'var(--muted)'}">
              ${airline ? '✓ ACTIVE — CLICK TO DISABLE' : '○ CLICK TO ACTIVATE'}
            </div>
          </div>
        </div>

      </div>
      ${airline ? `
      <div style="margin-top:12px;font-size:12px;color:var(--accent);background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:8px 12px">
        ✈️ Airline path active — your <strong>Flight Hours</strong> section and <strong>Aviation Profile</strong> are now visible below. Save your profile to preserve all changes.
      </div>` : `
      <div style="margin-top:12px;font-size:12px;color:var(--muted);padding:2px 0">
        💡 Not a military pilot? You can still activate the airline path — just fill in your civilian flight hours manually below.
      </div>`}
    </div>`;
}

// ── Toggle career path (no re-render — just DOM updates) ───────────────

function toggleCareerPath(path) {
  if (path === 'civilian') return; // civilian is always on

  const paths = [...getCareerPaths()];
  const idx   = paths.indexOf(path);
  if (idx >= 0) paths.splice(idx, 1);
  else paths.push(path);
  if (!paths.includes('civilian')) paths.unshift('civilian');

  state.profile = { ...state.profile, careerPaths: paths };
  try { localStorage.setItem('vc_profile', JSON.stringify(state.profile)); } catch(e) {}

  const isOn = paths.includes(path);

  // Update the career path card appearance without re-render
  const card = document.getElementById('cp-airline-card');
  if (card) {
    card.style.border  = isOn ? '2px solid var(--accent)' : '2px solid var(--rule-dark)';
    card.style.background = isOn ? 'var(--gold-light)' : 'white';
    card.querySelector('div:last-child').style.color = isOn ? 'var(--green)' : 'var(--muted)';
    card.querySelector('div:last-child').textContent  = isOn ? '✓ ACTIVE — CLICK TO DISABLE' : '○ CLICK TO ACTIVATE';
  }

  // Show or hide the aviation section
  const section = document.getElementById('aviation-section');
  if (section) section.style.display = isOn ? 'block' : 'none';

  // Update the card border
  const cardEl = card?.closest('.card');
  if (cardEl) cardEl.style.border = isOn ? '2px solid var(--accent)' : '2px solid var(--rule-dark)';

  showToast(isOn ? '✈️ Airline path activated' : 'Airline path disabled');
}

// ── Aviation section (shown when airline path is active) ───────────────

function renderAviationSection() {
  const certs   = getPilotCerts();
  const fh      = getFlightHours();
  const m       = fh.military;
  const civ     = fh.civilian || [];
  const combined = calcCombinedHours();
  const hasAnyHours = combined.total > 0;

  return `
    <div id="aviation-section" style="display:${isAirlinePath() ? 'block' : 'none'}">

      <!-- Combined hours summary — the master table for airline applications -->
      <div class="card" style="border-left:4px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <h2 style="margin:0">📊 Combined Flight Hours Summary</h2>
            <p style="font-size:12px;color:var(--muted);margin:4px 0 0">
              Auto-calculated from your military + civilian hours below. This table feeds your airline resume.
            </p>
          </div>
        </div>
        ${hasAnyHours ? `
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:var(--accent)">
                ${['Total','PIC','SIC','Turbine','Multi-Engine','Instrument','Night','Sim'].map(h =>
                  `<th style="padding:8px 12px;color:white;font-family:'Familjen Grotesk',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-align:center;white-space:nowrap">${h}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              <tr style="background:var(--gold-light)">
                ${[combined.total, combined.pic, combined.sic, combined.turbine, combined.multiEngine, combined.instrument, combined.night, combined.simulator].map(v =>
                  `<td style="padding:10px 12px;text-align:center;font-family:'Familjen Grotesk',sans-serif;font-size:15px;font-weight:700;color:var(--accent)">${v > 0 ? v.toLocaleString() : '—'}</td>`
                ).join('')}
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:10px;font-size:11px;color:var(--muted)">
          Military: ${parseFloat(m.total)||0} hrs &nbsp;+&nbsp; Civilian: ${civ.reduce((s,e) => s+(parseFloat(e.hours)||0), 0)} hrs &nbsp;=&nbsp; <strong>${combined.total.toLocaleString()} total</strong>
        </div>` : `
        <div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">
          Fill in your military and/or civilian hours below to see your combined summary.
        </div>`}
      </div>

      <!-- FAA Certificates & Ratings -->
      <div class="card">
        <h2>🪪 FAA Certificates & Ratings</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:16px">
          ${[
            { key:'atp',        label:'ATP Certificate' },
            { key:'commercial', label:'Commercial Pilot' },
            { key:'cfi',        label:'CFI' },
            { key:'cfii',       label:'CFII' },
            { key:'fcc',        label:'FCC Radio Permit' }
          ].map(cert => `
            <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1.5px solid ${certs[cert.key]?'var(--accent)':'var(--rule-dark)'};background:${certs[cert.key]?'var(--gold-light)':'white'};border-radius:2px;cursor:pointer;font-size:13px;font-weight:600">
              <input type="checkbox" id="pc-${cert.key}" ${certs[cert.key]?'checked':''}
                onchange="updatePilotCert('${cert.key}', this.checked)"
                style="width:auto;accent-color:var(--accent)">
              ${cert.label}
            </label>`).join('')}
        </div>
        <div class="grid2">
          <div class="field">
            <label class="field-label">Type Ratings (if any)</label>
            <input id="pc-typeRatings" value="${esc(certs.typeRatings||'')}"
              placeholder="B-737, A-320, EMB-145..."
              style="font-size:13px">
            <div style="font-size:11px;color:var(--dim);margin-top:3px">Military type qualifications count — translate to closest civilian equivalent if needed.</div>
          </div>
          <div class="field">
            <label class="field-label">FAA Medical Class</label>
            <select id="pc-faaClass" style="font-size:13px">
              <option value="">Select...</option>
              ${['1st Class','2nd Class','3rd Class','BasicMed','None / Expired'].map(c =>
                `<option ${certs.faaClass===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label">Medical Expiration Date</label>
            <input type="date" id="pc-faaExpiry" value="${esc(certs.faaExpiry||'')}" style="font-size:13px">
            ${certs.faaExpiry && new Date(certs.faaExpiry) < new Date() ?
              `<div style="font-size:11px;color:var(--red);font-weight:600;margin-top:3px">⚠️ Medical is expired</div>` :
              certs.faaExpiry && new Date(certs.faaExpiry) < new Date(Date.now() + 90*24*60*60*1000) ?
              `<div style="font-size:11px;color:var(--gold);font-weight:600;margin-top:3px">⏰ Medical expires within 90 days</div>` : ''}
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="savePilotCerts()" style="margin-top:8px">💾 Save Certificates</button>
      </div>

      <!-- Military flight hours -->
      <div class="card">
        <h2>🪖 Military Flight Hours</h2>
        <p style="font-size:13px;color:var(--muted);margin:-8px 0 16px">
          Enter your total military logbook hours. These come from your AFMS/ARMS records, flight records, or logbook summary. If you uploaded flight records, Claude may have pre-filled some of these.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:12px;margin-bottom:16px">
          ${[
            { key:'total',       label:'Total Time',    tip:'All logged flight time' },
            { key:'pic',         label:'PIC',           tip:'Pilot in Command time' },
            { key:'sic',         label:'SIC',           tip:'Second in Command time' },
            { key:'turbine',     label:'Turbine',       tip:'Turbine/jet powered aircraft' },
            { key:'multiEngine', label:'Multi-Engine',  tip:'Multi-engine aircraft' },
            { key:'instrument',  label:'Instrument',    tip:'Actual + simulated instrument' },
            { key:'night',       label:'Night',         tip:'Night flight time' },
            { key:'simulator',   label:'Simulator',     tip:'Sim hours — does not count toward most FAA mins' }
          ].map(f => `
            <div class="field" style="margin-bottom:0">
              <label class="field-label">${f.label}</label>
              <input type="number" id="mfh-${f.key}" value="${esc(m[f.key]||'')}"
                placeholder="0" min="0" step="0.1"
                oninput="updateMilitaryHours('${f.key}', this.value)"
                style="font-size:14px;font-weight:600">
              <div style="font-size:10px;color:var(--dim);margin-top:2px">${f.tip}</div>
            </div>`).join('')}
        </div>

        <!-- Aircraft by type -->
        <div style="border-top:1px solid var(--rule);padding-top:16px;margin-top:4px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <label class="field-label" style="margin:0">Hours by Aircraft Type</label>
            <button class="btn btn-secondary btn-sm" onclick="addMilAircraftEntry()">+ Add Aircraft</button>
          </div>
          <div id="mil-aircraft-list">
            ${renderMilAircraftList()}
          </div>
          <div style="font-size:11px;color:var(--dim);margin-top:4px">
            List each aircraft you've flown with hours and whether it qualifies as turbine/multi-engine.
          </div>
        </div>

        <button class="btn btn-secondary btn-sm" onclick="saveFlightHours()" style="margin-top:16px">💾 Save Military Hours</button>
      </div>

      <!-- Civilian hours log -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <h2 style="margin:0">🛩️ Civilian / GA Flight Hours</h2>
          <button class="btn btn-primary btn-sm" onclick="toggleUI('addCivFlight', true)">+ Add Entry</button>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:6px 0 16px">
          Add any flight time outside of military service — GA time, CFI work, corporate flying, contract gigs, or time you're actively building. Each entry updates the combined summary automatically.
        </p>

        ${state.ui.addCivFlight ? renderAddCivFlightForm() : ''}

        <div id="civ-flight-list">
          ${renderCivFlightList()}
        </div>
      </div>

    </div>`;
}

// ── Military aircraft list ────────────────────────────────────────────

function renderMilAircraftList() {
  const aircraft = getFlightHours().military.byAircraft || [];
  if (!aircraft.length) return `<div style="font-size:13px;color:var(--muted);padding:8px 0">No aircraft entries yet.</div>`;
  return aircraft.map((a, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--paper);border:1px solid var(--rule);border-radius:2px;margin-bottom:6px;flex-wrap:wrap">
      <div style="font-weight:600;font-size:13px;min-width:80px">${esc(a.type||'?')}</div>
      <div style="font-size:13px">${esc(a.hours||'0')} hrs</div>
      ${a.turbine    ? `<span class="tag tag-blue" style="font-size:10px;padding:1px 6px">Turbine</span>` : ''}
      ${a.multiEngine? `<span class="tag tag-purple" style="font-size:10px;padding:1px 6px">Multi</span>` : ''}
      <button class="btn btn-danger btn-sm" onclick="removeMilAircraftEntry(${i})" style="margin-left:auto;font-size:11px">✕</button>
    </div>`).join('');
}

function addMilAircraftEntry() {
  const type  = prompt('Aircraft type (e.g., B-52H, C-17, F-16C):');
  if (!type?.trim()) return;
  const hours = parseFloat(prompt('Total hours in this aircraft:') || '0');
  const turb  = confirm('Is this a turbine/jet aircraft?');
  const multi = confirm('Is this multi-engine?');

  const fh = getFlightHours();
  fh.military.byAircraft = [...(fh.military.byAircraft||[]), { type: type.trim(), hours, turbine: turb, multiEngine: multi }];
  state.flightHours = fh;
  try { localStorage.setItem('vc_flightHours', JSON.stringify(fh)); } catch(e) {}

  const el = document.getElementById('mil-aircraft-list');
  if (el) el.innerHTML = renderMilAircraftList();
  showToast(`${type.trim()} added`);
}

function removeMilAircraftEntry(idx) {
  const fh = getFlightHours();
  fh.military.byAircraft = (fh.military.byAircraft||[]).filter((_,i) => i !== idx);
  state.flightHours = fh;
  try { localStorage.setItem('vc_flightHours', JSON.stringify(fh)); } catch(e) {}
  const el = document.getElementById('mil-aircraft-list');
  if (el) el.innerHTML = renderMilAircraftList();
  refreshCombinedSummary();
}

function updateMilitaryHours(key, value) {
  const fh = getFlightHours();
  fh.military[key] = value;
  state.flightHours = fh;
  refreshCombinedSummary();
}

// ── Civilian flight log ───────────────────────────────────────────────

function renderAddCivFlightForm() {
  return `
    <div style="background:var(--gold-light);border:1.5px solid var(--gold);border-radius:2px;padding:16px;margin-bottom:16px">
      <div style="font-weight:700;font-size:12px;color:var(--accent);margin-bottom:14px;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.06em;text-transform:uppercase">Add Civilian Flight Entry</div>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Aircraft Type *</label>
          <input id="cfe-aircraft" placeholder="C-172, Citation XLS, B-737..." style="font-size:13px">
        </div>
        <div class="field">
          <label class="field-label">Total Hours *</label>
          <input type="number" id="cfe-hours" placeholder="0" min="0" step="0.1" style="font-size:13px">
        </div>
        <div class="field">
          <label class="field-label">PIC Hours</label>
          <input type="number" id="cfe-pic" placeholder="0" min="0" step="0.1" style="font-size:13px">
        </div>
        <div class="field">
          <label class="field-label">Instrument Hours</label>
          <input type="number" id="cfe-instrument" placeholder="0" min="0" step="0.1" style="font-size:13px">
        </div>
        <div class="field">
          <label class="field-label">Night Hours</label>
          <input type="number" id="cfe-night" placeholder="0" min="0" step="0.1" style="font-size:13px">
        </div>
        <div class="field">
          <label class="field-label">Date Range</label>
          <div style="display:flex;gap:6px;align-items:center">
            <input type="month" id="cfe-start" style="font-size:13px;flex:1" placeholder="From">
            <span style="color:var(--muted);font-size:12px">to</span>
            <input type="month" id="cfe-end" style="font-size:13px;flex:1" placeholder="Present">
          </div>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:10px">
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="cfe-turbine" style="width:auto;accent-color:var(--accent)"> Turbine / Jet
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="cfe-multi" style="width:auto;accent-color:var(--accent)"> Multi-Engine
        </label>
      </div>
      <div class="field">
        <label class="field-label">Notes (operator, context, etc.)</label>
        <input id="cfe-notes" placeholder="e.g., Part 135 charter, instructing, personal flying..." style="font-size:13px">
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-primary btn-sm" onclick="saveCivFlightEntry()">Save Entry</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('addCivFlight', false)">Cancel</button>
      </div>
    </div>`;
}

function renderCivFlightList() {
  const civ = getFlightHours().civilian || [];
  if (!civ.length) return `
    <div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;border:1.5px dashed var(--rule-dark);border-radius:2px">
      No civilian entries yet. Add any flight time from GA, instructing, contract flying, or active hour-building.
    </div>`;
  return civ.map(e => `
    <div style="padding:12px;border:1px solid var(--rule);border-radius:2px;margin-bottom:8px;background:white">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--accent)">${esc(e.aircraft)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">
            ${e.startDate||'?'} → ${e.endDate||'Present'}
            ${e.notes ? ` · ${esc(e.notes)}` : ''}
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeCivFlightEntry('${e.id}')" style="font-size:11px;flex-shrink:0">✕</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:10px;font-size:13px">
        ${[
          { label:'Total', value: e.hours },
          { label:'PIC',   value: e.pic||0 },
          { label:'Inst',  value: e.instrument||0 },
          { label:'Night', value: e.night||0 }
        ].map(f => `
          <div style="text-align:center">
            <div style="font-weight:700;font-size:15px;color:var(--text)">${parseFloat(f.value)||0}</div>
            <div style="font-size:10px;color:var(--muted);letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif">${f.label}</div>
          </div>`).join('')}
        <div style="display:flex;gap:6px;align-items:center;margin-left:4px">
          ${e.turbine     ? `<span class="tag tag-blue"   style="font-size:10px;padding:1px 6px">Turbine</span>`     : ''}
          ${e.multiEngine ? `<span class="tag tag-purple" style="font-size:10px;padding:1px 6px">Multi-Engine</span>` : ''}
        </div>
      </div>
    </div>`).join('');
}

function saveCivFlightEntry() {
  const aircraft = document.getElementById('cfe-aircraft')?.value?.trim();
  const hours    = parseFloat(document.getElementById('cfe-hours')?.value || '0');
  if (!aircraft) { showToast('Enter an aircraft type', false); return; }
  if (!hours)    { showToast('Enter at least 1 hour', false); return; }

  const entry = {
    id:          id(),
    aircraft,
    hours,
    pic:         parseFloat(document.getElementById('cfe-pic')?.value        || '0'),
    instrument:  parseFloat(document.getElementById('cfe-instrument')?.value || '0'),
    night:       parseFloat(document.getElementById('cfe-night')?.value      || '0'),
    turbine:     document.getElementById('cfe-turbine')?.checked || false,
    multiEngine: document.getElementById('cfe-multi')?.checked   || false,
    startDate:   document.getElementById('cfe-start')?.value || '',
    endDate:     document.getElementById('cfe-end')?.value   || '',
    notes:       document.getElementById('cfe-notes')?.value || ''
  };

  const fh = getFlightHours();
  fh.civilian = [...(fh.civilian||[]), entry];
  state.flightHours = fh;
  try { localStorage.setItem('vc_flightHours', JSON.stringify(fh)); } catch(e) {}

  setState({ ui: { ...state.ui, addCivFlight: false } });
  showToast(`✓ ${aircraft} entry added`);
}

function removeCivFlightEntry(eid) {
  if (!confirm('Remove this flight entry?')) return;
  const fh = getFlightHours();
  fh.civilian = (fh.civilian||[]).filter(e => e.id !== eid);
  state.flightHours = fh;
  try { localStorage.setItem('vc_flightHours', JSON.stringify(fh)); } catch(e) {}

  const el = document.getElementById('civ-flight-list');
  if (el) el.innerHTML = renderCivFlightList();
  refreshCombinedSummary();
  showToast('Entry removed');
}

// ── Live combined summary refresh (no full re-render) ─────────────────

function refreshCombinedSummary() {
  // Recalculate and update just the summary table cells if they exist
  const combined = calcCombinedHours();
  const keys = ['total','pic','sic','turbine','multiEngine','instrument','night','simulator'];
  const cells = document.querySelectorAll('#aviation-section table tbody td');
  if (cells.length === keys.length) {
    keys.forEach((k, i) => {
      cells[i].textContent = combined[k] > 0 ? combined[k].toLocaleString() : '—';
    });
  }
}

// ── Save functions ────────────────────────────────────────────────────

function saveFlightHours() {
  const fh  = getFlightHours();
  const keys = ['total','pic','sic','multiEngine','turbine','instrument','night','simulator'];
  keys.forEach(k => {
    const el = document.getElementById('mfh-' + k);
    if (el) fh.military[k] = el.value;
  });
  state.flightHours = fh;
  try { localStorage.setItem('vc_flightHours', JSON.stringify(fh)); } catch(e) {}
  refreshCombinedSummary();
  showToast('✓ Military hours saved');
}

function savePilotCerts() {
  const certs = {
    atp:         document.getElementById('pc-atp')?.checked         || false,
    commercial:  document.getElementById('pc-commercial')?.checked  || false,
    cfi:         document.getElementById('pc-cfi')?.checked         || false,
    cfii:        document.getElementById('pc-cfii')?.checked        || false,
    fcc:         document.getElementById('pc-fcc')?.checked         || false,
    typeRatings: document.getElementById('pc-typeRatings')?.value   || '',
    faaClass:    document.getElementById('pc-faaClass')?.value      || '',
    faaExpiry:   document.getElementById('pc-faaExpiry')?.value     || ''
  };
  state.profile = { ...state.profile, pilotCerts: certs };
  try { localStorage.setItem('vc_profile', JSON.stringify(state.profile)); } catch(e) {}
  showToast('✓ Certificates saved');
}

function updatePilotCert(key, value) {
  const certs = getPilotCerts();
  certs[key] = value;
  state.profile = { ...state.profile, pilotCerts: certs };
  // Update border color on the label
  const el = document.getElementById('pc-' + key)?.closest('label');
  if (el) {
    el.style.border     = value ? '1.5px solid var(--accent)' : '1.5px solid var(--rule-dark)';
    el.style.background = value ? 'var(--gold-light)' : 'white';
  }
}

// ── Pilot detection from document content ─────────────────────────────
// Called from documents.js after extraction to check for pilot data

const PILOT_KEYWORDS = [
  'flight hours', 'logbook', 'pilot in command', 'second in command',
  'pic hours', 'sic hours', 'type rating', 'instrument time',
  'turbine time', 'multi-engine', 'atp certificate', 'faa medical',
  'sorties flown', 'flying hours', 'combat hours', 'instructor pilot',
  'evaluator pilot', 'aircraft commander', 'b-52', 'b-1', 'b-2',
  'c-17', 'c-130', 'f-16', 'f-15', 'f-22', 'f-35', 'kc-135', 'kc-46',
  'e-3', 'e-8', 'u-2', 'rc-135', 'mc-130', 'cv-22', 'mh-60', 'uh-60',
  'ah-64', 'ch-47', 'p-8', 'p-3', 'e-2', 'fa-18', 'ea-18', 'v-22'
];

function detectPilotContent(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PILOT_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

function applyPilotExtraction(data) {
  // Called from documents.js applyExtraction() when pilot data is found
  if (!data.flightHours) return;

  const fh = getFlightHours();
  const mh = data.flightHours;

  // Only overwrite if extracted value is meaningful
  if (mh.total)       fh.military.total       = mh.total;
  if (mh.pic)         fh.military.pic         = mh.pic;
  if (mh.sic)         fh.military.sic         = mh.sic;
  if (mh.turbine)     fh.military.turbine     = mh.turbine;
  if (mh.multiEngine) fh.military.multiEngine = mh.multiEngine;
  if (mh.instrument)  fh.military.instrument  = mh.instrument;
  if (mh.night)       fh.military.night       = mh.night;
  if (mh.simulator)   fh.military.simulator   = mh.simulator;

  if (mh.byAircraft?.length) {
    fh.military.byAircraft = [...(fh.military.byAircraft||[]), ...mh.byAircraft];
  }

  state.flightHours = fh;
  try { localStorage.setItem('vc_flightHours', JSON.stringify(fh)); } catch(e) {}

  // Prompt to activate airline path if not already on
  if (!isAirlinePath()) {
    promptAirlinePathActivation();
  }
}

function promptAirlinePathActivation() {
  // Non-blocking banner shown after pilot document is processed
  // Inserts a temporary notice at the top of the documents result
  const resultEl = document.querySelector('.card h2');
  if (!resultEl) return;

  const banner = document.createElement('div');
  banner.style.cssText = `
    background: var(--gold-light); border: 1.5px solid var(--gold);
    border-radius: 2px; padding: 12px 16px; margin: 12px 0;
    font-size: 13px; color: var(--accent); display: flex;
    align-items: center; gap: 10px;
  `;
  banner.innerHTML = `
    <span style="font-size:20px">✈️</span>
    <div style="flex:1">
      <strong>Flight data detected in this document.</strong>
      Want to activate the Airline path to track flight hours and generate an airline-format resume?
    </div>
    <button class="btn btn-primary btn-sm" onclick="activateAirlinePathFromBanner(this)">Activate</button>
    <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">Dismiss</button>
  `;
  resultEl.parentElement?.insertBefore(banner, resultEl.nextSibling);
}

function activateAirlinePathFromBanner(btn) {
  const paths = [...getCareerPaths()];
  if (!paths.includes('airline')) paths.push('airline');
  state.profile = { ...state.profile, careerPaths: paths };
  try { localStorage.setItem('vc_profile', JSON.stringify(state.profile)); } catch(e) {}
  btn.closest('div[style]').innerHTML = `<span>✅ Airline path activated — visit your <strong>Profile</strong> to review flight hours.</span>`;
  showToast('✈️ Airline path activated');
}

// ── Load persisted flight hours on startup ────────────────────────────
// Call this once during app initialization (in index.html after state is set up)

function loadFlightHoursFromStorage() {
  try {
    const stored = localStorage.getItem('vc_flightHours');
    if (stored) state.flightHours = JSON.parse(stored);
  } catch(e) {
    console.warn('Could not load flight hours from storage:', e);
  }
}
