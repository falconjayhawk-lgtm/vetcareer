// ── Experience ────────────────────────────────────────────────────────
function renderExperience() {
  const assignList = [...state.assignments].sort((a,b)=>new Date(b.startDate||0)-new Date(a.startDate||0)).map(a=>`
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span style="font-weight:700;font-size:15px">${esc(a.dutyTitle)}</span>
              ${a.rank?`<span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:2px 9px;font-size:11px;font-weight:600">${esc(a.rank)}</span>`:''}
            </div>
            <div style="color:#2563eb;font-size:13px;font-weight:500">${a.unit?esc(a.unit)+' — ':''}${esc(a.base)}</div>
            <div style="color:#9ca3af;font-size:12px">${fmtDate(a.startDate)} – ${a.endDate?fmtDate(a.endDate):'Present'}${a.location?' · '+esc(a.location):''}</div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="btn btn-secondary btn-sm" onclick="addRoleToAssignment('${a.id}')">+ Role</button>
            <button class="btn btn-secondary btn-sm" onclick="editAssignment('${a.id}')">✏ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="removeAssignment('${a.id}')">✕</button>
          </div>
        </div>
        ${a.description?`<p style="font-size:13px;color:#4b5563;margin:8px 0 4px">${esc(a.description)}</p>`:''}
        ${a.accomplishments?`<div style="background:#f0fdf4;border-radius:6px;padding:8px;font-size:12px;color:#166534;margin-top:6px;white-space:pre-line">${esc(a.accomplishments)}</div>`:''}

        ${/* Additional roles within this assignment */(a.roles||[]).length>0?`
        <div style="margin-top:10px;border-top:1px solid #e5e7eb;padding-top:10px">
          <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Additional Roles at This Assignment</div>
          ${(a.roles||[]).map((r,ri)=>`
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:6px">
              ${state.ui.editRoleKey===a.id+'-'+ri?`
                <div class="grid2" style="margin-bottom:8px">
                  <div class="field"><label class="field-label">Role / Duty Title</label><input id="er-title-${a.id}-${ri}" value="${esc(r.title||'')}"></div>
                  <div class="field"><label class="field-label">Rank (if different)</label><input id="er-rank-${a.id}-${ri}" value="${esc(r.rank||'')}"></div>
                  <div class="field"><label class="field-label">Start Date</label><input type="date" id="er-start-${a.id}-${ri}" value="${r.startDate||''}"></div>
                  <div class="field"><label class="field-label">End Date</label><input type="date" id="er-end-${a.id}-${ri}" value="${r.endDate||''}"></div>
                </div>
                <div class="field"><label class="field-label">Accomplishments</label><textarea id="er-acc-${a.id}-${ri}" rows="3">${esc(r.accomplishments||'')}</textarea></div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-primary btn-sm" onclick="saveRole('${a.id}',${ri})">💾 Save</button>
                  <button class="btn btn-secondary btn-sm" onclick="toggleUI('editRoleKey',null)">Cancel</button>
                </div>
              `:`
                <div style="display:flex;justify-content:space-between;align-items:start">
                  <div>
                    <div style="font-weight:600;font-size:13px">${esc(r.title||'Unnamed Role')}${r.rank?` <span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:1px 7px;font-size:11px">${esc(r.rank)}</span>`:''}</div>
                    ${r.startDate||r.endDate?`<div style="font-size:11px;color:#9ca3af">${fmtDate(r.startDate)} – ${r.endDate?fmtDate(r.endDate):'Present'}</div>`:''}
                    ${r.accomplishments?`<div style="font-size:12px;color:#166534;margin-top:4px;white-space:pre-line">${esc(r.accomplishments)}</div>`:''}
                  </div>
                  <div style="display:flex;gap:4px;flex-shrink:0">
                    <button class="btn btn-secondary btn-sm" onclick="toggleUI('editRoleKey','${a.id}-${ri}')">✏</button>
                    <button class="btn btn-danger btn-sm" onclick="removeRole('${a.id}',${ri})">✕</button>
                  </div>
                </div>
              `}
            </div>`).join('')}
        </div>`:''}

        ${state.ui.addRoleToId===a.id?`
        <div style="margin-top:10px;border-top:1px solid #bfdbfe;padding-top:10px;background:#f0f9ff;border-radius:0 0 8px 8px;margin:-14px;padding:12px;margin-top:10px">
          <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:8px">+ Add Role to This Assignment</div>
          <div class="grid2">
            <div class="field"><label class="field-label">Role / Duty Title *</label><input id="nr-title" placeholder="Company Commander, S3 OIC, Task Force CDR"></div>
            <div class="field"><label class="field-label">Rank (if different from above)</label><input id="nr-rank" placeholder="Leave blank if same"></div>
            <div class="field"><label class="field-label">Start Date</label><input type="date" id="nr-start"></div>
            <div class="field"><label class="field-label">End Date</label><input type="date" id="nr-end"></div>
          </div>
          <div class="field"><label class="field-label">Accomplishments in this role</label>
            <textarea id="nr-acc" rows="3" placeholder="• Commanded 120-person company during NTC rotation&#10;• Achieved 98% equipment readiness rate"></textarea></div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-primary btn-sm" onclick="addRole('${a.id}')">Save Role</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('addRoleToId',null)">Cancel</button>
          </div>
        </div>`:''}
      </div>
    </div>`).join('');

  const civList = [...state.civilianJobs].sort((a,b)=>new Date(b.startDate||0)-new Date(a.startDate||0)).map(j=>{
    if (state.ui.editCivJobId === j.id) {
      return `
        <div style="padding:16px;background:#faf5ff;border:2px solid #a78bfa;border-radius:8px;margin-bottom:10px">
          <div style="font-weight:700;color:#6d28d9;margin-bottom:12px">✏ Edit: ${esc(j.title)} at ${esc(j.company)}</div>
          <div class="grid2">
            <div class="field"><label class="field-label">Company *</label><input id="ec-company" value="${esc(j.company)}"></div>
            <div class="field"><label class="field-label">Job Title *</label><input id="ec-title" value="${esc(j.title)}"></div>
            <div class="field"><label class="field-label">Location</label><input id="ec-location" value="${esc(j.location||'')}"></div>
            <div></div>
            <div class="field"><label class="field-label">Start Date</label><input type="date" id="ec-startDate" value="${j.startDate||''}"></div>
            <div class="field"><label class="field-label">End Date (blank = current)</label><input type="date" id="ec-endDate" value="${j.endDate||''}"></div>
          </div>
          <div class="field"><label class="field-label">Role Description</label><textarea id="ec-description" rows="2">${esc(j.description||'')}</textarea></div>
          <div class="field"><label class="field-label">Key Accomplishments</label>
            <textarea id="ec-accomplishments" rows="4" placeholder="• Increased team output by 25%&#10;• Managed $500K project on time and under budget">${esc(j.accomplishments||'')}</textarea></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" onclick="updateCivJob('${j.id}')">💾 Save Changes</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('editCivJobId',null)">Cancel</button>
          </div>
        </div>`;
    }
    return `
      <div style="background:white;border:1px solid ${j.possibleOverlap ? '#fbbf24' : '#e5e7eb'};border-radius:8px;padding:14px;margin-bottom:10px">
        ${j.possibleOverlap ? `
        <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:6px;padding:8px 12px;margin-bottom:10px;font-size:13px;display:flex;justify-content:space-between;align-items:center">
          <span>⚠️ <strong>Possible duplicate</strong> — dates overlap with a military assignment. Is this a separate civilian role?</span>
          <div style="display:flex;gap:6px;flex-shrink:0;margin-left:12px">
            <button class="btn btn-sm" style="background:#d1fae5;color:#065f46;font-size:12px" onclick="clearOverlapFlag('${j.id}')">✓ Keep it</button>
            <button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;font-size:12px" onclick="removeCivJob('${j.id}')">✕ Remove</button>
          </div>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <div style="font-weight:700;font-size:15px">${esc(j.title)}</div>
            <div style="color:#7c3aed;font-size:13px;font-weight:500">${esc(j.company)}${j.location?' — '+esc(j.location):''}</div>
            <div style="color:#9ca3af;font-size:12px">${fmtDate(j.startDate)} – ${j.endDate?fmtDate(j.endDate):'Present'}</div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('editCivJobId','${j.id}')">✏ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="removeCivJob('${j.id}')">✕</button>
          </div>
        </div>
        ${j.description?`<p style="font-size:13px;color:#4b5563;margin:8px 0 4px">${esc(j.description)}</p>`:''}
        ${j.accomplishments?`<div style="background:#faf5ff;border-radius:6px;padding:8px;font-size:12px;margin-top:6px;white-space:pre-line">${esc(j.accomplishments)}</div>`:''}
      </div>`;
  }).join('');

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 20px">Experience</h1>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h2 style="margin:0">🎖 Military Assignment Timeline</h2>
        <button class="btn btn-primary btn-sm" onclick="toggleUI('addAssignment')">+ Add Assignment</button>
      </div>
      <p style="font-size:12px;color:#6b7280;margin:0 0 12px">List assignments in reverse order — most recent first</p>
      ${state.ui.addAssignment?`
        <div style="padding:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:16px">
          <div class="grid2">
            <div class="field"><label class="field-label">Installation / Base *</label><input id="a-base" placeholder="Fort Bragg, NC"></div>
            <div class="field"><label class="field-label">Unit</label><input id="a-unit" placeholder="1st BCT, 82nd ABN DIV"></div>
            <div class="field"><label class="field-label">Duty Title *</label><input id="a-dutyTitle" placeholder="Platoon Sergeant, S3 Operations Officer"></div>
            <div class="field"><label class="field-label">Rank During This Assignment</label><input id="a-rank" placeholder="SSG, CPT, MAJ..."></div>
            <div class="field"><label class="field-label">Location</label><input id="a-location" placeholder="Fayetteville, NC"></div>
            <div></div>
            <div class="field"><label class="field-label">Start Date</label><input type="date" id="a-startDate"></div>
            <div class="field"><label class="field-label">End Date (blank = current)</label><input type="date" id="a-endDate"></div>
          </div>
          <div class="field"><label class="field-label">Role Description</label><textarea id="a-description" rows="2" placeholder="Describe role in plain language"></textarea></div>
          <div class="field"><label class="field-label">Key Accomplishments (use bullet points with numbers!)</label>
            <textarea id="a-accomplishments" rows="4" placeholder="• Led team of 24 soldiers to 100% readiness&#10;• Reduced maintenance backlog by 40% in 90 days&#10;• Managed $2.3M in equipment with zero losses"></textarea></div>
          <div id="assignment-form-actions" style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm save-btn" onclick="saveAssignment()">Save Assignment</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('addAssignment');toggleUI('editAssignmentId',null)">Cancel</button>
          </div>
        </div>`:'' }
      ${state.assignments.length===0&&!state.ui.addAssignment?'<p style="color:#9ca3af;font-size:14px;text-align:center;padding:20px">No assignments yet. This is the core of your resume!</p>':''}
      <div style="position:relative">${state.assignments.length>0?'<div class="timeline-line"></div>':''} ${assignList}</div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h2 style="margin:0">💼 Civilian Work Experience</h2>
        <button class="btn btn-primary btn-sm" onclick="toggleUI('addCivJob')">+ Add Job</button>
      </div>
      ${state.civilianJobs.some(j=>j.possibleOverlap) ? `
      <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;display:flex;justify-content:space-between;align-items:center">
        <span>⚠️ <strong>${state.civilianJobs.filter(j=>j.possibleOverlap).length} entry(s)</strong> may duplicate your military assignments. Review below.</span>
        <button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;font-size:12px" onclick="removeMilitaryDuplicates()">Remove All Duplicates</button>
      </div>` : ''}
      ${state.ui.addCivJob?`
        <div style="padding:16px;background:#faf5ff;border:1px solid #ddd6fe;border-radius:8px;margin-bottom:16px">
          <div class="grid2">
            <div class="field"><label class="field-label">Company *</label><input id="c-company" placeholder="Company Name"></div>
            <div class="field"><label class="field-label">Job Title *</label><input id="c-title" placeholder="Your Title"></div>
            <div class="field"><label class="field-label">Location</label><input id="c-location" placeholder="City, State or Remote"></div>
            <div></div>
            <div class="field"><label class="field-label">Start Date</label><input type="date" id="c-startDate"></div>
            <div class="field"><label class="field-label">End Date (blank = current)</label><input type="date" id="c-endDate"></div>
          </div>
          <div class="field"><label class="field-label">Role Description</label><textarea id="c-description" rows="2"></textarea></div>
          <div class="field"><label class="field-label">Key Accomplishments</label>
            <textarea id="c-accomplishments" rows="4" placeholder="• Increased team output by 25%&#10;• Managed $500K project on time and under budget"></textarea></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" onclick="saveCivJob()">Save Job</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('addCivJob')">Cancel</button>
          </div>
        </div>`:'' }
      ${state.civilianJobs.length===0&&!state.ui.addCivJob?'<p style="color:#9ca3af;font-size:14px;text-align:center;padding:20px">No civilian jobs yet.</p>':''}
      ${civList}
    </div>`;
}

function saveAssignment() {
  const base = document.getElementById('a-base')?.value?.trim();
  const duty = document.getElementById('a-dutyTitle')?.value?.trim();
  if (!base||!duty) { alert('Base and Duty Title required'); return; }
  const a = { id:id(), base, unit:document.getElementById('a-unit')?.value, dutyTitle:duty, rank:document.getElementById('a-rank')?.value, location:document.getElementById('a-location')?.value, startDate:document.getElementById('a-startDate')?.value, endDate:document.getElementById('a-endDate')?.value, description:document.getElementById('a-description')?.value, accomplishments:document.getElementById('a-accomplishments')?.value };
  setState({ assignments:[...state.assignments,a], ui:{...state.ui,addAssignment:false} });
}

function removeAssignment(aid) { setState({ assignments: state.assignments.filter(a=>a.id!==aid) }); }

function editAssignment(aid) {
  // Open the add form pre-filled with this assignment's data
  const a = state.assignments.find(x => x.id === aid);
  if (!a) return;
  setState({ ui: { ...state.ui, addAssignment: true, editAssignmentId: aid } });
  // Pre-fill after render
  setTimeout(() => {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('a-base', a.base); set('a-unit', a.unit); set('a-dutyTitle', a.dutyTitle);
    set('a-rank', a.rank); set('a-location', a.location);
    set('a-startDate', a.startDate); set('a-endDate', a.endDate);
    set('a-description', a.description); set('a-accomplishments', a.accomplishments);
    // Swap Save button to Update
    const saveBtn = document.querySelector('#assignment-form-actions .save-btn');
    if (saveBtn) { saveBtn.textContent = 'Update Assignment'; saveBtn.onclick = () => updateAssignment(aid); }
  }, 50);
}

function updateAssignment(aid) {
  const base = document.getElementById('a-base')?.value?.trim();
  const duty = document.getElementById('a-dutyTitle')?.value?.trim();
  if (!base||!duty) { alert('Base and Duty Title required'); return; }
  const updated = { id:aid, base, unit:document.getElementById('a-unit')?.value, dutyTitle:duty, rank:document.getElementById('a-rank')?.value, location:document.getElementById('a-location')?.value, startDate:document.getElementById('a-startDate')?.value, endDate:document.getElementById('a-endDate')?.value, description:document.getElementById('a-description')?.value, accomplishments:document.getElementById('a-accomplishments')?.value };
  // Preserve any existing roles
  const existing = state.assignments.find(a=>a.id===aid);
  if (existing?.roles) updated.roles = existing.roles;
  setState({ assignments: state.assignments.map(a => a.id === aid ? updated : a), ui: { ...state.ui, addAssignment: false, editAssignmentId: null } });
  showToast('Assignment updated! ✓');
}

function addRoleToAssignment(aid) {
  toggleUI('addRoleToId', state.ui.addRoleToId === aid ? null : aid);
}

function addRole(aid) {
  const title = document.getElementById('nr-title')?.value?.trim();
  if (!title) { showToast('Role title required', false); return; }
  const role = {
    title,
    rank: document.getElementById('nr-rank')?.value?.trim() || '',
    startDate: document.getElementById('nr-start')?.value || '',
    endDate: document.getElementById('nr-end')?.value || '',
    accomplishments: document.getElementById('nr-acc')?.value?.trim() || '',
  };
  const updated = state.assignments.map(a => {
    if (a.id !== aid) return a;
    return { ...a, roles: [...(a.roles||[]), role] };
  });
  setState({ assignments: updated, ui: { ...state.ui, addRoleToId: null } });
  showToast('Role added! ✓');
}

function saveRole(aid, ri) {
  const title = document.getElementById(`er-title-${aid}-${ri}`)?.value?.trim();
  if (!title) { showToast('Role title required', false); return; }
  const role = {
    title,
    rank: document.getElementById(`er-rank-${aid}-${ri}`)?.value?.trim() || '',
    startDate: document.getElementById(`er-start-${aid}-${ri}`)?.value || '',
    endDate: document.getElementById(`er-end-${aid}-${ri}`)?.value || '',
    accomplishments: document.getElementById(`er-acc-${aid}-${ri}`)?.value?.trim() || '',
  };
  const updated = state.assignments.map(a => {
    if (a.id !== aid) return a;
    const roles = [...(a.roles||[])];
    roles[ri] = role;
    return { ...a, roles };
  });
  setState({ assignments: updated, ui: { ...state.ui, editRoleKey: null } });
  showToast('Role updated! ✓');
}

function removeRole(aid, ri) {
  const updated = state.assignments.map(a => {
    if (a.id !== aid) return a;
    const roles = (a.roles||[]).filter((_,i)=>i!==ri);
    return { ...a, roles };
  });
  setState({ assignments: updated });
}

function saveCivJob() {
  const company = document.getElementById('c-company')?.value?.trim();
  const title = document.getElementById('c-title')?.value?.trim();
  if (!company||!title) { alert('Company and Title required'); return; }
  const j = { id:id(), company, title, location:document.getElementById('c-location')?.value, startDate:document.getElementById('c-startDate')?.value, endDate:document.getElementById('c-endDate')?.value, description:document.getElementById('c-description')?.value, accomplishments:document.getElementById('c-accomplishments')?.value };
  setState({ civilianJobs:[...state.civilianJobs,j], ui:{...state.ui,addCivJob:false} });
}

function removeCivJob(jid) { setState({ civilianJobs: state.civilianJobs.filter(j=>j.id!==jid) }); }

// Dismiss the overlap warning — user confirmed this is a legitimate separate role
function clearOverlapFlag(jid) {
  setState({ civilianJobs: state.civilianJobs.map(j => j.id === jid ? { ...j, possibleOverlap: false } : j) });
}

// Remove all flagged duplicates at once
function removeMilitaryDuplicates() {
  if (confirm('Remove all entries flagged as possible military duplicates?')) {
    setState({ civilianJobs: state.civilianJobs.filter(j => !j.possibleOverlap) });
  }
}

function updateCivJob(jid) {
  const company = document.getElementById('ec-company')?.value?.trim();
  const title = document.getElementById('ec-title')?.value?.trim();
  if (!company||!title) { alert('Company and Title required'); return; }
  const updated = { id:jid, company, title, location:document.getElementById('ec-location')?.value, startDate:document.getElementById('ec-startDate')?.value, endDate:document.getElementById('ec-endDate')?.value, description:document.getElementById('ec-description')?.value, accomplishments:document.getElementById('ec-accomplishments')?.value };
  setState({ civilianJobs: state.civilianJobs.map(j => j.id === jid ? updated : j), ui: { ...state.ui, editCivJobId: null } });
  showToast('Civilian job updated! ✓');
}

