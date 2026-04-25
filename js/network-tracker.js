// ── network-tracker.js — Networking Follow-up Tracker ─────────────────
//
// Tracks outreach contacts, email status, responses, and follow-up
// reminders. Complements the existing Networking Emails generator —
// that writes the emails, this tracks what happens after you send them.
//
// State: state.networkContacts = [{
//   id, name, title, company, email, linkedin,
//   relationship, category,
//   outreach: [{ id, type, date, subject, sent, response, responseDate, notes }],
//   status, priority, notes, lastActivity, addedAt
// }]
// ──────────────────────────────────────────────────────────────────────

const RELATIONSHIP_TYPES = [
  { id:'peer-veteran',  label:'Peer Veteran',       icon:'🪖', desc:'Transitioning or recently transitioned military peer' },
  { id:'alumni',        label:'Service Academy/ROTC Alumni', icon:'🎓', desc:'Fellow alumni from service academy or ROTC program' },
  { id:'recruiter',     label:'Recruiter',           icon:'💼', desc:'Corporate or agency recruiter' },
  { id:'hiring-manager',label:'Hiring Manager',      icon:'🎯', desc:'Decision maker at a target company' },
  { id:'warm-intro',    label:'Warm Introduction',   icon:'🤝', desc:'Introduction through a mutual connection' },
  { id:'cold-contact',  label:'Cold Outreach',       icon:'📨', desc:'Someone you reached out to without prior connection' },
  { id:'mentor',        label:'Mentor/Advisor',      icon:'⭐', desc:'Senior person providing career guidance' },
  { id:'industry',      label:'Industry Contact',    icon:'🏢', desc:'Subject matter expert in your target industry' }
];

const OUTREACH_TYPES = [
  { id:'email',    label:'Email',            icon:'✉️' },
  { id:'linkedin', label:'LinkedIn Message', icon:'💼' },
  { id:'phone',    label:'Phone Call',       icon:'📞' },
  { id:'coffee',   label:'Coffee/Meeting',   icon:'☕' },
  { id:'event',    label:'Event / Conference',icon:'🎪' },
  { id:'referral', label:'Referral',         icon:'🔗' }
];

const CONTACT_STATUSES = [
  { id:'active',     label:'Active',       color:'var(--green)', bg:'var(--green-light)' },
  { id:'follow-up',  label:'Follow-up Due',color:'var(--red)',   bg:'var(--red-light)' },
  { id:'responded',  label:'Responded',    color:'var(--accent)',bg:'var(--accent-light)' },
  { id:'meeting',    label:'Meeting Set',  color:'#7c3aed',      bg:'#f5f3ff' },
  { id:'stale',      label:'Gone Quiet',   color:'var(--muted)', bg:'var(--paper)' },
  { id:'converted',  label:'Converted',    color:'var(--gold)',  bg:'var(--gold-light)' }
];

// ── State helpers ──────────────────────────────────────────────────────

function getNetworkContacts() {
  return state.networkContacts || [];
}

function daysAgo(dateStr) {
  if (!dateStr) return null;
  return Math.round((new Date() - new Date(dateStr)) / (1000*60*60*24));
}

function getContactStatus(contact) {
  const outreach = contact.outreach || [];
  if (!outreach.length) return 'active';
  const lastOut = [...outreach].sort((a,b) => new Date(b.date) - new Date(a.date))[0];
  const days = daysAgo(lastOut.date);
  if (lastOut.response) return 'responded';
  if (contact.status === 'converted') return 'converted';
  if (contact.status === 'meeting') return 'meeting';
  if (days > 14 && !lastOut.response) return 'follow-up';
  if (days > 30) return 'stale';
  return 'active';
}

// ── Main render ────────────────────────────────────────────────────────

function renderNetworkTracker() {
  const contacts    = getNetworkContacts();
  const adding      = state.ui.ntAddContact   || false;
  const editId      = state.ui.ntEditId       || null;
  const expandId    = state.ui.ntExpandId     || null;
  const filterStatus= state.ui.ntFilterStatus || 'all';
  const searchQ     = state.ui.ntSearch       || '';

  // Compute follow-ups needed
  const followUps = contacts.filter(c => getContactStatus(c) === 'follow-up');

  // Filter
  let filtered = contacts;
  if (filterStatus !== 'all') {
    filtered = filtered.filter(c => getContactStatus(c) === filterStatus);
  }
  if (searchQ) {
    const q = searchQ.toLowerCase();
    filtered = filtered.filter(c =>
      (c.name||'').toLowerCase().includes(q) ||
      (c.company||'').toLowerCase().includes(q) ||
      (c.title||'').toLowerCase().includes(q)
    );
  }

  // Sort: follow-ups first, then by last activity
  filtered = [...filtered].sort((a,b) => {
    const statusA = getContactStatus(a);
    const statusB = getContactStatus(b);
    if (statusA === 'follow-up' && statusB !== 'follow-up') return -1;
    if (statusB === 'follow-up' && statusA !== 'follow-up') return 1;
    return new Date(b.lastActivity||b.addedAt||0) - new Date(a.lastActivity||a.addedAt||0);
  });

  // Stats
  const stats = [
    { label:'Total Contacts',   value: contacts.length },
    { label:'Follow-ups Due',   value: followUps.length, alert: followUps.length > 0 },
    { label:'Responded',        value: contacts.filter(c=>getContactStatus(c)==='responded').length },
    { label:'Meetings Set',     value: contacts.filter(c=>getContactStatus(c)==='meeting').length }
  ];

  return `
    <!-- Follow-up urgency banner -->
    ${followUps.length > 0 ? `
    <div class="card" style="border-left:4px solid var(--red);background:var(--red-light);margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="font-size:22px;flex-shrink:0">⏰</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;color:var(--red);font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">
            ${followUps.length} Contact${followUps.length>1?'s':''} Need${followUps.length===1?'s':''} Follow-up
          </div>
          <div style="font-size:13px;color:var(--text)">
            ${followUps.slice(0,3).map(c=>`<strong>${esc(c.name)}</strong> at ${esc(c.company)}`).join(' · ')}${followUps.length>3?` + ${followUps.length-3} more`:''}
          </div>
        </div>
        <button onclick="toggleUI('ntFilterStatus','follow-up')" class="btn btn-secondary btn-sm" style="border-color:var(--red);color:var(--red)">View All →</button>
      </div>
    </div>` : ''}

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:20px">
      ${stats.map(s => `
        <div class="card" style="margin-bottom:0;text-align:center;${s.alert?'border-color:var(--red)':''}">
          <div style="font-size:26px;font-weight:800;color:${s.alert?'var(--red)':'var(--accent)'};font-family:'Familjen Grotesk',sans-serif;line-height:1">${s.value}</div>
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:4px;font-family:'Familjen Grotesk',sans-serif">${s.label}</div>
        </div>`).join('')}
    </div>

    <!-- Controls -->
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px">
      <input id="nt-search" placeholder="Search contacts..."
        value="${esc(searchQ)}"
        oninput="toggleUI('ntSearch',this.value)"
        style="flex:1;min-width:160px;font-size:13px;padding:7px 12px">
      <select onchange="toggleUI('ntFilterStatus',this.value)" style="font-size:13px;padding:7px 10px;width:auto">
        <option value="all">All (${contacts.length})</option>
        ${[
          ['follow-up', 'Follow-up Due'],
          ['responded',  'Responded'],
          ['meeting',    'Meeting Set'],
          ['active',     'Active'],
          ['stale',      'Gone Quiet'],
          ['converted',  'Converted']
        ].map(([v,l])=>`<option value="${v}" ${filterStatus===v?'selected':''}>${l}</option>`).join('')}
      </select>
      <button class="btn btn-primary btn-sm" onclick="toggleUI('ntAddContact',true)">+ Add Contact</button>
    </div>

    <!-- Add form -->
    ${adding && !editId ? renderContactForm(null) : ''}

    <!-- Empty state -->
    ${contacts.length === 0 && !adding ? `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light)">
      <h2 style="margin-bottom:8px">Why track your networking?</h2>
      <p style="font-size:13px;color:var(--text);line-height:1.7;margin:0 0 12px">
        Most veterans send a few LinkedIn messages and then forget about them. The follow-up is where jobs happen.
        Studies consistently show that 70-80% of jobs are filled through networking — and most of those require 2-3 touchpoints,
        not just one message. This tracker makes sure nothing falls through the cracks.
      </p>
      <button class="btn btn-primary btn-sm" onclick="toggleUI('ntAddContact',true)">+ Add Your First Contact</button>
    </div>` : ''}

    <!-- Contact cards -->
    ${filtered.map(c => {
      if (editId === c.id) return renderContactForm(c);
      return renderContactCard(c, expandId === c.id);
    }).join('')}

    ${filtered.length === 0 && contacts.length > 0 ? `
    <div class="card" style="text-align:center;padding:28px;color:var(--muted)">
      No contacts match your filter.
      <button onclick="toggleUI('ntFilterStatus','all');toggleUI('ntSearch','')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-weight:700;margin-left:6px">Clear</button>
    </div>` : ''}`;
}

// ── Contact card ───────────────────────────────────────────────────────

function renderContactCard(c, expanded) {
  const status   = getContactStatus(c);
  const statusCfg= CONTACT_STATUSES.find(s=>s.id===status) || CONTACT_STATUSES[0];
  const rel      = RELATIONSHIP_TYPES.find(r=>r.id===c.relationship) || { icon:'🤝', label:'Contact' };
  const lastOut  = [...(c.outreach||[])].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const daysSince= lastOut ? daysAgo(lastOut.date) : null;
  const outCount = (c.outreach||[]).length;
  const hasResp  = (c.outreach||[]).some(o=>o.response);

  return `
    <div class="card" style="margin-bottom:10px;border-left:4px solid ${statusCfg.color}">
      <div style="display:flex;align-items:start;gap:10px">
        <div style="flex:1;min-width:0">
          <!-- Name + status -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-size:16px">${rel.icon}</span>
            <span style="font-weight:700;font-size:15px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${esc(c.name)}</span>
            <span style="background:${statusCfg.bg};color:${statusCfg.color};border-radius:2px;padding:1px 8px;font-size:10px;font-weight:700;font-family:'Familjen Grotesk',sans-serif">${statusCfg.label}</span>
            ${c.priority==='high'?`<span style="background:var(--red-light);color:var(--red);border-radius:2px;padding:1px 6px;font-size:10px;font-weight:700;font-family:'Familjen Grotesk',sans-serif">HIGH PRIORITY</span>`:''}
          </div>

          <!-- Title + company -->
          <div style="font-size:13px;color:var(--muted);margin-bottom:6px">
            ${c.title?`<strong style="color:var(--text)">${esc(c.title)}</strong>`:''}
            ${c.title&&c.company?' at ':''}
            ${c.company?`<span style="color:var(--accent)">${esc(c.company)}</span>`:''}
            <span style="color:var(--dim)"> · ${rel.label}</span>
          </div>

          <!-- Activity summary -->
          <div style="display:flex;gap:12px;font-size:11px;color:var(--muted);flex-wrap:wrap">
            ${outCount > 0 ? `<span>${outCount} outreach${outCount>1?'es':''}</span>` : '<span>No outreach logged</span>'}
            ${lastOut ? `<span>Last: ${new Date(lastOut.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>` : ''}
            ${daysSince!==null&&!lastOut?.response ? `<span style="color:${daysSince>14?'var(--red)':'var(--muted)'}">No response · ${daysSince}d ago</span>` : ''}
            ${hasResp ? `<span style="color:var(--green)">✓ Responded</span>` : ''}
          </div>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:5px;flex-shrink:0">
          <button class="btn btn-primary btn-sm" onclick="toggleUI('ntAddOutreach_${c.id}',true)" title="Log outreach">+ Log</button>
          <button onclick="toggleUI('ntExpandId',${expanded?'null':`'${c.id}'`})" class="btn btn-secondary btn-sm">${expanded?'▼':'▶'}</button>
          <button onclick="toggleUI('ntEditId','${c.id}');toggleUI('ntAddContact',false)" class="btn btn-secondary btn-sm">✏</button>
          <button onclick="removeContact('${c.id}')" class="btn btn-danger btn-sm">✕</button>
        </div>
      </div>

      <!-- Quick log outreach -->
      ${state.ui[`ntAddOutreach_${c.id}`] ? renderOutreachForm(c.id) : ''}

      <!-- Expanded: outreach history + notes -->
      ${expanded ? `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--rule)">

        <!-- Contact info -->
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;margin-bottom:12px">
          ${c.email?`<a href="mailto:${esc(c.email)}" style="color:var(--accent)">✉ ${esc(c.email)}</a>`:''}
          ${c.linkedin?`<a href="${esc(c.linkedin)}" target="_blank" style="color:var(--accent)">💼 LinkedIn</a>`:''}
        </div>

        <!-- Outreach log -->
        ${(c.outreach||[]).length > 0 ? `
        <div style="font-size:11px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Outreach History</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
          ${[...(c.outreach||[])].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((o,i) => {
            const otype = OUTREACH_TYPES.find(t=>t.id===o.type)||{icon:'✉️',label:'Email'};
            return `
              <div style="display:flex;gap:10px;align-items:start;background:var(--paper);border-radius:2px;padding:8px 10px">
                <span style="font-size:16px;flex-shrink:0">${otype.icon}</span>
                <div style="flex:1">
                  <div style="font-size:12px;font-weight:700;color:var(--text)">${otype.label} ${o.subject?'— '+esc(o.subject):''}</div>
                  <div style="font-size:11px;color:var(--muted)">${new Date(o.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                  ${o.response?`<div style="font-size:12px;color:var(--green);margin-top:4px;background:var(--green-light);border-radius:2px;padding:4px 8px">✓ Response: ${esc(o.response)}</div>`:''}
                  ${o.notes?`<div style="font-size:11px;color:var(--muted);margin-top:3px">${esc(o.notes)}</div>`:''}
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0">
                  ${!o.response?`<button onclick="logResponse('${c.id}','${o.id}')" class="btn btn-secondary btn-sm" style="font-size:10px;white-space:nowrap">+ Response</button>`:''}
                  <button onclick="removeOutreach('${c.id}','${o.id}')" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:12px">✕</button>
                </div>
              </div>`;
          }).join('')}
        </div>` : `<div style="font-size:13px;color:var(--dim);margin-bottom:12px">No outreach logged yet.</div>`}

        <!-- Notes -->
        ${c.notes?`
        <div style="background:var(--paper);border-radius:2px;padding:10px;font-size:13px;color:var(--text);line-height:1.65">
          <div style="font-size:10px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Notes</div>
          ${esc(c.notes)}
        </div>` : ''}

        <!-- Generate follow-up email -->
        <button class="btn btn-secondary btn-sm" style="margin-top:10px"
          onclick="generateFollowUpEmail('${c.id}')">
          🤖 Generate Follow-up Email
        </button>
      </div>` : ''}
    </div>`;
}

// ── Contact form ───────────────────────────────────────────────────────

function renderContactForm(c) {
  const isEdit = !!c;
  return `
    <div class="card" style="border:2px solid var(--accent);margin-bottom:16px">
      <h2>${isEdit?'Edit Contact':'+ Add Contact'}</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Name *</label>
          <input id="ntf-name" value="${esc(c?.name||'')}" placeholder="Full name">
        </div>
        <div class="field">
          <label class="field-label">Title</label>
          <input id="ntf-title" value="${esc(c?.title||'')}" placeholder="e.g., Director of Operations">
        </div>
        <div class="field">
          <label class="field-label">Company</label>
          <input id="ntf-company" value="${esc(c?.company||'')}" placeholder="e.g., Leidos, Anduril...">
        </div>
        <div class="field">
          <label class="field-label">Relationship</label>
          <select id="ntf-rel" style="font-size:13px">
            ${RELATIONSHIP_TYPES.map(r=>`<option value="${r.id}" ${c?.relationship===r.id?'selected':''}>${r.icon} ${r.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Email</label>
          <input id="ntf-email" type="email" value="${esc(c?.email||'')}" placeholder="name@company.com">
        </div>
        <div class="field">
          <label class="field-label">LinkedIn URL</label>
          <input id="ntf-linkedin" value="${esc(c?.linkedin||'')}" placeholder="https://linkedin.com/in/...">
        </div>
        <div class="field">
          <label class="field-label">Priority</label>
          <select id="ntf-priority" style="font-size:13px">
            <option value="normal" ${(c?.priority||'normal')==='normal'?'selected':''}>Normal</option>
            <option value="high"   ${c?.priority==='high'?'selected':''}>High</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Status</label>
          <select id="ntf-status" style="font-size:13px">
            ${CONTACT_STATUSES.map(s=>`<option value="${s.id}" ${c?.status===s.id?'selected':''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="grid-column:1/-1">
          <label class="field-label">Notes</label>
          <textarea id="ntf-notes" rows="2" placeholder="How you know them, context, talking points...">${esc(c?.notes||'')}</textarea>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="${isEdit?`updateContact('${c.id}')`:'saveContact()'}">
          ${isEdit?'Update':'Save Contact'}
        </button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('ntAddContact',false);toggleUI('ntEditId',null)">Cancel</button>
      </div>
    </div>`;
}

// ── Outreach form ──────────────────────────────────────────────────────

function renderOutreachForm(contactId) {
  return `
    <div style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:12px;margin-top:10px">
      <div style="font-size:11px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Log Outreach</div>
      <div class="grid2">
        <div class="field" style="margin-bottom:8px">
          <label class="field-label">Type</label>
          <select id="ntout-type-${contactId}" style="font-size:13px">
            ${OUTREACH_TYPES.map(t=>`<option value="${t.id}">${t.icon} ${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="margin-bottom:8px">
          <label class="field-label">Date</label>
          <input type="date" id="ntout-date-${contactId}" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="field" style="margin-bottom:8px">
          <label class="field-label">Subject / Topic</label>
          <input id="ntout-subject-${contactId}" placeholder="e.g., Introduction, Follow-up, Thank you">
        </div>
        <div class="field" style="margin-bottom:8px">
          <label class="field-label">Notes</label>
          <input id="ntout-notes-${contactId}" placeholder="Key points, what you discussed...">
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="saveOutreach('${contactId}')">Save Outreach</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('ntAddOutreach_${contactId}',false)">Cancel</button>
      </div>
    </div>`;
}

// ── CRUD ───────────────────────────────────────────────────────────────

function saveContact() {
  const name = document.getElementById('ntf-name')?.value?.trim();
  if (!name) { showToast('Name is required', false); return; }

  const contact = {
    id:           id(),
    name,
    title:        document.getElementById('ntf-title')?.value?.trim()   || '',
    company:      document.getElementById('ntf-company')?.value?.trim() || '',
    email:        document.getElementById('ntf-email')?.value?.trim()   || '',
    linkedin:     document.getElementById('ntf-linkedin')?.value?.trim()|| '',
    relationship: document.getElementById('ntf-rel')?.value             || 'peer-veteran',
    priority:     document.getElementById('ntf-priority')?.value        || 'normal',
    status:       document.getElementById('ntf-status')?.value          || 'active',
    notes:        document.getElementById('ntf-notes')?.value?.trim()   || '',
    outreach:     [],
    lastActivity: new Date().toISOString(),
    addedAt:      new Date().toISOString()
  };

  setState({
    networkContacts: [...(state.networkContacts||[]), contact],
    ui: { ...state.ui, ntAddContact: false }
  });
  showToast('✓ Contact added');
}

function updateContact(cid) {
  const name = document.getElementById('ntf-name')?.value?.trim();
  if (!name) { showToast('Name is required', false); return; }
  const existing = (state.networkContacts||[]).find(c=>c.id===cid)||{};
  const updated = {
    ...existing, id: cid, name,
    title:        document.getElementById('ntf-title')?.value?.trim()   || existing.title    || '',
    company:      document.getElementById('ntf-company')?.value?.trim() || existing.company  || '',
    email:        document.getElementById('ntf-email')?.value?.trim()   || existing.email    || '',
    linkedin:     document.getElementById('ntf-linkedin')?.value?.trim()|| existing.linkedin || '',
    relationship: document.getElementById('ntf-rel')?.value             || existing.relationship,
    priority:     document.getElementById('ntf-priority')?.value        || existing.priority,
    status:       document.getElementById('ntf-status')?.value          || existing.status,
    notes:        document.getElementById('ntf-notes')?.value?.trim()   || ''
  };
  setState({
    networkContacts: (state.networkContacts||[]).map(c=>c.id===cid?updated:c),
    ui: { ...state.ui, ntEditId: null }
  });
  showToast('✓ Updated');
}

function removeContact(cid) {
  if (!confirm('Remove this contact?')) return;
  setState({ networkContacts: (state.networkContacts||[]).filter(c=>c.id!==cid) });
  showToast('Removed');
}

function saveOutreach(contactId) {
  const type    = document.getElementById(`ntout-type-${contactId}`)?.value    || 'email';
  const date    = document.getElementById(`ntout-date-${contactId}`)?.value    || new Date().toISOString().split('T')[0];
  const subject = document.getElementById(`ntout-subject-${contactId}`)?.value?.trim() || '';
  const notes   = document.getElementById(`ntout-notes-${contactId}`)?.value?.trim()   || '';

  const outreach = { id: id(), type, date, subject, notes, sent: true, response: '', responseDate: null };

  const contacts = (state.networkContacts||[]).map(c => {
    if (c.id !== contactId) return c;
    return {
      ...c,
      outreach: [...(c.outreach||[]), outreach],
      lastActivity: new Date().toISOString()
    };
  });

  setState({
    networkContacts: contacts,
    ui: { ...state.ui, [`ntAddOutreach_${contactId}`]: false }
  });
  showToast('✓ Outreach logged');
}

function removeOutreach(contactId, outreachId) {
  const contacts = (state.networkContacts||[]).map(c => {
    if (c.id !== contactId) return c;
    return { ...c, outreach: (c.outreach||[]).filter(o=>o.id!==outreachId) };
  });
  setState({ networkContacts: contacts });
  showToast('Removed');
}

function logResponse(contactId, outreachId) {
  const response = prompt('Brief note on the response:');
  if (!response) return;
  const contacts = (state.networkContacts||[]).map(c => {
    if (c.id !== contactId) return c;
    return {
      ...c,
      status: 'responded',
      lastActivity: new Date().toISOString(),
      outreach: (c.outreach||[]).map(o =>
        o.id === outreachId ? { ...o, response, responseDate: new Date().toISOString() } : o
      )
    };
  });
  setState({ networkContacts: contacts });
  showToast('✓ Response logged');
}

// ── AI: Generate follow-up email ───────────────────────────────────────

async function generateFollowUpEmail(contactId) {
  const contact = (state.networkContacts||[]).find(c=>c.id===contactId);
  if (!contact) return;

  const lastOut = [...(contact.outreach||[])].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const p = state.profile;
  const daysSince = lastOut ? daysAgo(lastOut.date) : null;

  showToast('🤖 Writing follow-up email...', true);
  try {
    const email = await callClaude(
      `You write concise, professional follow-up emails for veterans networking in the civilian job market. The emails are warm, specific, and never sound like templates. Under 150 words. Include a subject line.`,
      `Write a follow-up email for this networking contact.

FROM: ${p.fullName||'[Name]'} — transitioning ${p.branch||'military'} veteran
TO: ${contact.name}${contact.title?' ('+contact.title+')':''}${contact.company?' at '+contact.company:''}
RELATIONSHIP: ${RELATIONSHIP_TYPES.find(r=>r.id===contact.relationship)?.label||'Contact'}
${lastOut?`LAST OUTREACH: ${new Date(lastOut.date).toLocaleDateString()} via ${lastOut.type} — "${lastOut.subject||'introduction'}"`:''} 
${daysSince?`DAYS SINCE LAST CONTACT: ${daysSince}`:''}
NOTES: ${contact.notes||'None'}

Write a follow-up email that:
- Opens with something specific (references the prior conversation or a relevant industry event/news)
- Has one clear, easy ask (15-minute call, advice on X, introduction to Y)
- Closes with a specific timeframe
- Sounds like a real person, not a template
- Is 100-150 words

Include:
Subject: [subject line]
[email body]`
    );

    setState({ ui: { ...state.ui, [`ntFollowUp_${contactId}`]: email, ntExpandId: contactId } });
    showToast('✓ Follow-up email ready — scroll to contact');
  } catch(err) {
    showToast('Error: ' + err.message, false);
  }
}
