// ── SF-86 Prep Assistant ──────────────────────────────────────────────
function renderSF86() {
  const sf = state.sf86 || {};
  const activeTab = state.ui.sf86Tab || 'overview';
  const tabs = [
    {id:'overview', label:'📋 Overview'},
    {id:'residences', label:`🏠 Residences (${(sf.residences||[]).length})`},
    {id:'employers', label:`💼 Employment (${(sf.employers||[]).length})`},
    {id:'references', label:`👤 References (${(sf.references||[]).length})`},
    {id:'foreign', label:`🌍 Foreign (${(sf.foreignContacts||[]).length + (sf.foreignTravel||[]).length})`},
    {id:'relatives', label:`👨‍👩‍👧 Relatives (${(sf.relatives||[]).length})`},
    {id:'notes', label:'📝 Notes'},
  ];
  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">🔐 SF-86 Prep Assistant</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px">Organize everything you need to complete your SF-86 (Questionnaire for National Security Positions). This tool helps you gather and track the required information — you'll still submit the actual form through e-QIP or DISS.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#dc2626">
      ⚠️ <strong>Security Notice:</strong> Do not enter classified information here. This tool stores data locally and in your Supabase instance only — it is not connected to any government system.
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px">
      ${tabs.map(t=>`<button onclick="toggleUI('sf86Tab','${t.id}')" style="padding:6px 12px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:${activeTab===t.id?'700':'500'};background:${activeTab===t.id?'#1d4ed8':'#f3f4f6'};color:${activeTab===t.id?'white':'#374151'}">${t.label}</button>`).join('')}
    </div>

    ${activeTab==='overview'?renderSF86Overview(sf):''}
    ${activeTab==='residences'?renderSF86Residences(sf):''}
    ${activeTab==='employers'?renderSF86Employers(sf):''}
    ${activeTab==='references'?renderSF86References(sf):''}
    ${activeTab==='foreign'?renderSF86Foreign(sf):''}
    ${activeTab==='relatives'?renderSF86Relatives(sf):''}
    ${activeTab==='notes'?renderSF86Notes(sf):''}
  `;
}

function renderSF86Overview(sf) {
  const sections = [
    {label:'Residences', count:(sf.residences||[]).length, required:'All addresses for past 10 years', tab:'residences', color:'#2563eb'},
    {label:'Employment', count:(sf.employers||[]).length, required:'All employers for past 10 years (military service counts)', tab:'employers', color:'#7c3aed'},
    {label:'References', count:(sf.references||[]).length, required:'3 people who know you well — not relatives', tab:'references', color:'#16a34a'},
    {label:'Foreign Contacts/Travel', count:(sf.foreignContacts||[]).length+(sf.foreignTravel||[]).length, required:'Foreign nationals you have close ties with + all foreign travel', tab:'foreign', color:'#d97706'},
    {label:'Relatives', count:(sf.relatives||[]).length, required:'All immediate family and relatives living abroad', tab:'relatives', color:'#dc2626'},
  ];
  return `
    <div class="card">
      <h2>What SF-86 Requires</h2>
      <p style="font-size:13px;color:#6b7280;margin:0 0 16px;line-height:1.6">The SF-86 covers the past 7–10 years of your life in detail. The key to completing it without stress is gathering everything in advance. Use the tabs above to track each section. Click any section to start entering data.</p>
      ${sections.map(s=>`
        <div onclick="toggleUI('sf86Tab','${s.tab}')" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid #e5e7eb;border-left:4px solid ${s.color};border-radius:8px;margin-bottom:8px;cursor:pointer;background:${s.count>0?'#f9fafb':'white'}" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='${s.count>0?'#f9fafb':'white'}'">
          <div>
            <div style="font-weight:700;font-size:14px;color:#111">${s.label}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px">${s.required}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:12px">
            <div style="font-size:22px;font-weight:800;color:${s.color}">${s.count}</div>
            <div style="font-size:11px;color:#9ca3af">entered</div>
          </div>
        </div>`).join('')}
    </div>
    <div class="card" style="background:#eff6ff;border:1px solid #bfdbfe">
      <h2 style="color:#1e40af">💡 SF-86 Tips for Veterans</h2>
      <div style="font-size:13px;color:#1e3a8a;line-height:1.8">
        <div style="margin-bottom:8px">• <strong>Military assignments count as employment</strong> — enter each PCS as a separate employer entry with the installation address</div>
        <div style="margin-bottom:8px">• <strong>Be thorough on foreign travel</strong> — include all trips, even personal vacation, for the past 10 years. Official travel on orders is fine but still needs to be listed</div>
        <div style="margin-bottom:8px">• <strong>Gaps are red flags</strong> — the form must account for every month. Unemployment, school, and PCS transition time all count</div>
        <div style="margin-bottom:8px">• <strong>References must be able to vouch for you</strong> — pick people who actually know your character and will respond promptly to investigators</div>
        <div style="margin-bottom:8px">• <strong>Disclose — don't guess</strong> — investigators find out anyway. A disclosed issue is almost always less harmful than a discovered one</div>
        <div>• <strong>Dates matter</strong> — get exact start/end dates. Your service record and SF-50s are your best source for employment dates</div>
      </div>
    </div>`;
}

function renderSF86Residences(sf) {
  const adding = state.ui.sf86AddRes || false;
  const editIdx = state.ui.sf86EditRes;
  const residences = sf.residences || [];
  const r = editIdx !== undefined ? (residences[editIdx] || {}) : {};
  const formHtml = (adding || editIdx !== undefined) ? (
    '<div class="card" style="border-left:4px solid #2563eb">' +
    '<h2>' + (editIdx !== undefined ? 'Edit' : 'Add') + ' Residence</h2>' +
    '<div class="grid2">' +
    '<div class="field"><label class="field-label">Street Address</label><input id="sf86-res-addr" value="' + esc(r.address||'') + '"></div>' +
    '<div class="field"><label class="field-label">City</label><input id="sf86-res-city" value="' + esc(r.city||'') + '"></div>' +
    '<div class="field"><label class="field-label">State</label><input id="sf86-res-state" value="' + esc(r.state||'') + '"></div>' +
    '<div class="field"><label class="field-label">ZIP</label><input id="sf86-res-zip" value="' + esc(r.zip||'') + '"></div>' +
    '<div class="field"><label class="field-label">Country</label><input id="sf86-res-country" value="' + esc(r.country||'USA') + '"></div>' +
    '<div class="field"><label class="field-label">Date From</label><input type="month" id="sf86-res-from" value="' + esc(r.from||'') + '"></div>' +
    '<div class="field"><label class="field-label">Date To</label><input type="month" id="sf86-res-to" value="' + esc(r.to||'') + '"></div>' +
    '<div class="field"><label class="field-label">Still Live Here?</label><select id="sf86-res-current">' +
      '<option value="no"' + (r.current==='no'?' selected':'') + '>No</option>' +
      '<option value="yes"' + (r.current==='yes'||editIdx===undefined?' selected':'') + '>Yes</option>' +
    '</select></div>' +
    '<div class="field"><label class="field-label">Landlord / Owner Name</label><input id="sf86-res-landlord" placeholder="Or Owned" value="' + esc(r.landlord||'') + '"></div>' +
    '<div class="field"><label class="field-label">Landlord Phone</label><input id="sf86-res-phone" value="' + esc(r.phone||'') + '"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-primary btn-sm" onclick="saveSF86Residence(' + (editIdx !== undefined ? editIdx : 'null') + ')">' + (editIdx !== undefined ? 'Update' : 'Save') + '</button>' +
    '<button class="btn btn-secondary btn-sm" onclick="toggleUI(\'sf86AddRes\',false);toggleUI(\'sf86EditRes\',undefined)">Cancel</button>' +
    '</div></div>'
  ) : '';
  return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
    '<div><h2 style="margin:0">🏠 Residences</h2>' +
    '<p style="font-size:12px;color:#6b7280;margin:4px 0 0">All places you have lived for the past 10 years. Include barracks and temporary housing. Requires start/end dates, full address, and landlord name.</p></div>' +
    '<button class="btn btn-primary btn-sm" onclick="toggleUI(\'sf86AddRes\',true)">+ Add</button>' +
    '</div></div>' +
    formHtml +
    (residences.length === 0 ? '<div class="card" style="text-align:center;padding:30px;color:#9ca3af">No residences entered yet. Click "+ Add" to start.</div>' : '') +
    residences.map((res,i) => editIdx === i ? '' : renderSF86ResCard(res,i)).join('');
}

function renderSF86Employers(sf) {
  const adding = state.ui.sf86AddEmp || false;
  const editIdx = state.ui.sf86EditEmp;
  const employers = sf.employers || [];
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div><h2 style="margin:0">💼 Employment History</h2>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0">All employment for 10 years including military assignments (each PCS = new entry), self-employment, and any gaps explained. Supervisor name and contact are required.</p></div>
        <button class="btn btn-primary btn-sm" onclick="toggleUI('sf86AddEmp',true)">+ Add</button>
      </div>
    </div>
    ${adding||editIdx!==undefined?`
    <div class="card" style="border-left:4px solid #7c3aed">
      <h2>${editIdx!==undefined?'Edit':'Add'} Employment</h2>
      <div class="grid2">
        <div class="field"><label class="field-label">Employer / Unit Name</label><input id="sf86-emp-name" placeholder="86th Airlift Wing, Ramstein AB" value="${esc(editIdx!==undefined?employers[editIdx]?.name||'':'')}"></div>
        <div class="field"><label class="field-label">Your Title / Position</label><input id="sf86-emp-title" placeholder="Squadron Commander" value="${esc(editIdx!==undefined?employers[editIdx]?.title||'':'')}"></div>
        <div class="field"><label class="field-label">Employer Street Address</label><input id="sf86-emp-addr" value="${esc(editIdx!==undefined?employers[editIdx]?.address||'':'')}"></div>
        <div class="field"><label class="field-label">City</label><input id="sf86-emp-city" value="${esc(editIdx!==undefined?employers[editIdx]?.city||'':'')}"></div>
        <div class="field"><label class="field-label">State / Country</label><input id="sf86-emp-state" value="${esc(editIdx!==undefined?employers[editIdx]?.state||'':'')}"></div>
        <div class="field"><label class="field-label">ZIP</label><input id="sf86-emp-zip" value="${esc(editIdx!==undefined?employers[editIdx]?.zip||'':'')}"></div>
        <div class="field"><label class="field-label">Date From</label><input type="month" id="sf86-emp-from" value="${esc(editIdx!==undefined?employers[editIdx]?.from||'':'')}"></div>
        <div class="field"><label class="field-label">Date To</label><input type="month" id="sf86-emp-to" value="${esc(editIdx!==undefined?employers[editIdx]?.to||'':'')}"></div>
        <div class="field"><label class="field-label">Still Employed Here?</label><select id="sf86-emp-current"><option value="no">No</option><option value="yes" ${editIdx!==undefined&&employers[editIdx]?.current==='yes'?'selected':''}>Yes</option></select></div>
        <div class="field"><label class="field-label">Type</label><select id="sf86-emp-type">
          ${['Military','Civilian Federal','Private Sector','Self-Employed','Contractor','Unemployment/Gap'].map(t=>`<option ${editIdx!==undefined&&employers[editIdx]?.type===t?'selected':''}>${t}</option>`).join('')}
        </select></div>
        <div class="field"><label class="field-label">Supervisor Name</label><input id="sf86-emp-sup-name" value="${esc(editIdx!==undefined?employers[editIdx]?.supervisorName||'':'')}"></div>
        <div class="field"><label class="field-label">Supervisor Phone</label><input id="sf86-emp-sup-phone" value="${esc(editIdx!==undefined?employers[editIdx]?.supervisorPhone||'':'')}"></div>
      </div>
      <div class="field"><label class="field-label">Reason for Leaving (or explain gap)</label><input id="sf86-emp-reason" placeholder="PCS orders, retirement, voluntary separation..." value="${esc(editIdx!==undefined?employers[editIdx]?.reasonLeft||'':'')}"></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="saveSF86Employer(${editIdx!==undefined?editIdx:'null'})">${editIdx!==undefined?'Update':'Save'}</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('sf86AddEmp',false);toggleUI('sf86EditEmp',undefined)">Cancel</button>
      </div>
    </div>`:''}
    ${employers.length===0?'<div class="card" style="text-align:center;padding:30px;color:#9ca3af">No employment entered yet.</div>':''}
    ${employers.map((e,i)=>editIdx===i?'':renderSF86EmpCard(e,i)).join('')}`;
}

function renderSF86ResCard(r,i) {
  var addr = esc(r.address||'') + (r.city?', '+esc(r.city):'') + (r.state?', '+esc(r.state):'') + (r.zip?' '+esc(r.zip):'');
  var dates = esc(r.from||'?') + ' → ' + (r.current==='yes'?'Present':esc(r.to||'?')) + (r.landlord?' · Landlord: '+esc(r.landlord):'');
  return '<div class="card" style="margin-bottom:8px;border-left:4px solid #2563eb"><div style="display:flex;justify-content:space-between;align-items:start"><div>' +
    '<div style="font-weight:700">' + addr + '</div>' +
    '<div style="font-size:12px;color:#6b7280;margin-top:2px">' + dates + '</div></div>' +
    '<div style="display:flex;gap:6px">' +
    '<button class="btn btn-secondary btn-sm" onclick="toggleUI(\'sf86EditRes\',' + i + ');toggleUI(\'sf86AddRes\',false)">✏</button>' +
    '<button class="btn btn-danger btn-sm" onclick="removeSF86Item(\'residences\',' + i + ')">✕</button>' +
    '</div></div></div>';
}

function renderSF86EmpCard(e,i) {
  var dates = esc(e.from||'?') + ' → ' + (e.current==='yes'?'Present':esc(e.to||'?')) + (e.supervisorName?' · Supervisor: '+esc(e.supervisorName):'');
  return '<div class="card" style="margin-bottom:8px;border-left:4px solid #7c3aed"><div style="display:flex;justify-content:space-between;align-items:start"><div>' +
    '<div style="font-weight:700">' + esc(e.name||'') + ' <span style="font-size:11px;background:#ede9fe;color:#6d28d9;padding:1px 6px;border-radius:999px">' + esc(e.type||'') + '</span></div>' +
    '<div style="font-size:13px;color:#374151">' + esc(e.title||'') + '</div>' +
    '<div style="font-size:12px;color:#6b7280;margin-top:2px">' + dates + '</div></div>' +
    '<div style="display:flex;gap:6px">' +
    '<button class="btn btn-secondary btn-sm" onclick="toggleUI(\'sf86EditEmp\',' + i + ');toggleUI(\'sf86AddEmp\',false)">✏</button>' +
    '<button class="btn btn-danger btn-sm" onclick="removeSF86Item(\'employers\',' + i + ')">✕</button>' +
    '</div></div></div>';
}

function renderSF86RelCard(r,i) {
  return '<div class="card" style="margin-bottom:8px;border-left:4px solid #dc2626"><div style="display:flex;justify-content:space-between;align-items:start"><div>' +
    '<div style="font-weight:700">' + esc(r.name||'') + ' <span style="font-size:11px;background:#fee2e2;color:#dc2626;padding:1px 6px;border-radius:999px">' + esc(r.type||'') + '</span></div>' +
    '<div style="font-size:12px;color:#6b7280">Born: ' + esc(r.birthCountry||'?') + ' · Resides: ' + esc(r.country||'?') + ' · US Citizen: ' + esc(r.citizen||'?') + '</div>' +
    (r.contact?'<div style="font-size:12px;color:#6b7280">'+esc(r.contact)+'</div>':'') +
    '</div><button class="btn btn-danger btn-sm" onclick="removeSF86Item(\'relatives\',' + i + ')">✕</button></div></div>';
}

function renderSF86References(sf) {
  const adding = state.ui.sf86AddRef || false;
  const editIdx = state.ui.sf86EditRef;
  const refs = sf.references || [];
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div><h2 style="margin:0">👤 References</h2>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0">3 people who know you well, are not relatives, and can verify your background. Pick people who will respond promptly to investigator contact.</p></div>
        <button class="btn btn-primary btn-sm" onclick="toggleUI('sf86AddRef',true)">+ Add</button>
      </div>
    </div>
    ${adding||editIdx!==undefined?`
    <div class="card" style="border-left:4px solid #16a34a">
      <h2>${editIdx!==undefined?'Edit':'Add'} Reference</h2>
      <div class="grid2">
        <div class="field"><label class="field-label">Full Name</label><input id="sf86-ref-name" value="${esc(editIdx!==undefined?refs[editIdx]?.name||'':'')}"></div>
        <div class="field"><label class="field-label">Relationship</label><input id="sf86-ref-rel" placeholder="Former supervisor, colleague, mentor..." value="${esc(editIdx!==undefined?refs[editIdx]?.relationship||'':'')}"></div>
        <div class="field"><label class="field-label">Phone</label><input id="sf86-ref-phone" value="${esc(editIdx!==undefined?refs[editIdx]?.phone||'':'')}"></div>
        <div class="field"><label class="field-label">Email</label><input id="sf86-ref-email" value="${esc(editIdx!==undefined?refs[editIdx]?.email||'':'')}"></div>
        <div class="field"><label class="field-label">City / State</label><input id="sf86-ref-location" placeholder="Arlington, VA" value="${esc(editIdx!==undefined?refs[editIdx]?.location||'':'')}"></div>
        <div class="field"><label class="field-label">How Long Known</label><input id="sf86-ref-known" placeholder="12 years" value="${esc(editIdx!==undefined?refs[editIdx]?.knownYears||'':'')}"></div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="saveSF86Reference(${editIdx!==undefined?editIdx:'null'})">${editIdx!==undefined?'Update':'Save'}</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('sf86AddRef',false);toggleUI('sf86EditRef',undefined)">Cancel</button>
      </div>
    </div>`:''}
    ${refs.length===0?'<div class="card" style="text-align:center;padding:30px;color:#9ca3af">No references entered yet.</div>':''}
    ${refs.map((r,i)=>editIdx===i?'':renderSF86RefCard(r,i)).join('')}`;
}

function renderSF86RefCard(r,i) {
  return '<div class="card" style="margin-bottom:8px;border-left:4px solid #16a34a">' +
    '<div style="display:flex;justify-content:space-between;align-items:start"><div>' +
    '<div style="font-weight:700">' + esc(r.name||'') + '</div>' +
    '<div style="font-size:12px;color:#6b7280">' + esc(r.relationship||'') + ' · ' + esc(r.location||'') + ' · Known ' + esc(r.knownYears||'?') + ' years</div>' +
    '<div style="font-size:12px;color:#6b7280">' + esc(r.phone||'') + (r.email?' · '+esc(r.email):'') + '</div></div>' +
    '<div style="display:flex;gap:6px">' +
    '<button class="btn btn-secondary btn-sm" onclick="toggleUI(\'sf86EditRef\',' + i + ');toggleUI(\'sf86AddRef\',false)">✏</button>' +
    '<button class="btn btn-danger btn-sm" onclick="removeSF86Item(\'references\',' + i + ')">✕</button>' +
    '</div></div></div>';
}

function renderSF86Foreign(sf) {
  const addingContact = state.ui.sf86AddFContact || false;
  const addingTravel = state.ui.sf86AddFTravel || false;
  const contacts = sf.foreignContacts || [];
  const travel = sf.foreignTravel || [];
  return `
    <div class="card">
      <h2>🌍 Foreign Contacts & Travel</h2>
      <p style="font-size:13px;color:#6b7280;margin:0 0 12px;line-height:1.6">Report foreign nationals you have close or continuing contact with, AND all foreign travel for the past 10 years (including vacations). Official travel on military orders must still be listed.</p>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('sf86AddFContact',true);toggleUI('sf86AddFTravel',false)">+ Foreign Contact</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('sf86AddFTravel',true);toggleUI('sf86AddFContact',false)">+ Foreign Travel</button>
      </div>
    </div>
    ${addingContact?`
    <div class="card" style="border-left:4px solid #d97706">
      <h2>Add Foreign Contact</h2>
      <div class="grid2">
        <div class="field"><label class="field-label">Name</label><input id="sf86-fc-name"></div>
        <div class="field"><label class="field-label">Country of Citizenship</label><input id="sf86-fc-country"></div>
        <div class="field"><label class="field-label">Relationship</label><input id="sf86-fc-rel" placeholder="Friend, business contact, former colleague..."></div>
        <div class="field"><label class="field-label">Frequency of Contact</label><input id="sf86-fc-freq" placeholder="Monthly calls, annual visits..."></div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="saveSF86ForeignContact()">Save</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('sf86AddFContact',false)">Cancel</button>
      </div>
    </div>`:''}
    ${addingTravel?`
    <div class="card" style="border-left:4px solid #d97706">
      <h2>Add Foreign Travel</h2>
      <div class="grid2">
        <div class="field"><label class="field-label">Country Visited</label><input id="sf86-ft-country"></div>
        <div class="field"><label class="field-label">Purpose</label><select id="sf86-ft-purpose">
          ${['Official Military Orders','TDY/TAD','Personal Vacation','Business','Family Visit','Other'].map(t=>`<option>${t}</option>`).join('')}
        </select></div>
        <div class="field"><label class="field-label">Date From</label><input type="month" id="sf86-ft-from"></div>
        <div class="field"><label class="field-label">Date To</label><input type="month" id="sf86-ft-to"></div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="saveSF86ForeignTravel()">Save</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('sf86AddFTravel',false)">Cancel</button>
      </div>
    </div>`:''}
    ${contacts.length>0?renderFContactList(contacts):''}
    ${travel.length>0?renderFTravelList(travel):''}
    ${contacts.length===0&&travel.length===0?'<div class="card" style="text-align:center;padding:30px;color:#9ca3af">No foreign contacts or travel entered yet.</div>':''}`;
}

function renderFContactList(contacts) {
  return '<div class="card"><h2 style="font-size:14px;margin-bottom:10px">Foreign Contacts (' + contacts.length + ')</h2>' +
    contacts.map(function(c,i) { return '<div style="display:flex;justify-content:space-between;padding:8px;border:1px solid #fde68a;border-radius:6px;margin-bottom:6px;background:#fffbeb">' +
      '<div><div style="font-weight:600">' + esc(c.name||'') + ' — ' + esc(c.country||'') + '</div><div style="font-size:12px;color:#6b7280">' + esc(c.relationship||'') + ' · ' + esc(c.frequency||'') + '</div></div>' +
      '<button class="btn btn-danger btn-sm" onclick="removeSF86Item(' + "'foreignContacts'" + ',' + i + ')">✕</button></div>';
    }).join('') + '</div>';
}

function renderFTravelList(travel) {
  return '<div class="card"><h2 style="font-size:14px;margin-bottom:10px">Foreign Travel (' + travel.length + ')</h2>' +
    travel.map(function(trip,i) { return '<div style="display:flex;justify-content:space-between;padding:8px;border:1px solid #fde68a;border-radius:6px;margin-bottom:6px;background:#fffbeb">' +
      '<div><div style="font-weight:600">' + esc(trip.country||'') + ' <span style="font-size:11px;background:#fde68a;padding:1px 6px;border-radius:999px">' + esc(trip.purpose||'') + '</span></div>' +
      '<div style="font-size:12px;color:#6b7280">' + esc(trip.from||'?') + ' → ' + esc(trip.to||'?') + '</div></div>' +
      '<button class="btn btn-danger btn-sm" onclick="removeSF86Item(' + "'foreignTravel'" + ',' + i + ')">✕</button></div>';
    }).join('') + '</div>';
}

function renderSF86Relatives(sf) {
  const adding = state.ui.sf86AddRel || false;
  const relatives = sf.relatives || [];
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div><h2 style="margin:0">👨‍👩‍👧 Relatives</h2>
        <p style="font-size:12px;color:#6b7280;margin:4px 0 0">All immediate family and close relatives, especially any living outside the US or who are foreign nationals. Parents, siblings, spouse, children, in-laws.</p></div>
        <button class="btn btn-primary btn-sm" onclick="toggleUI('sf86AddRel',true)">+ Add</button>
      </div>
    </div>
    ${adding?`
    <div class="card" style="border-left:4px solid #dc2626">
      <h2>Add Relative</h2>
      <div class="grid2">
        <div class="field"><label class="field-label">Full Name</label><input id="sf86-rel-name"></div>
        <div class="field"><label class="field-label">Relationship</label><select id="sf86-rel-type">
          ${['Spouse/Partner','Parent','Sibling','Child','In-Law','Grandparent','Other'].map(t=>`<option>${t}</option>`).join('')}
        </select></div>
        <div class="field"><label class="field-label">Country of Birth</label><input id="sf86-rel-birthcountry" placeholder="USA"></div>
        <div class="field"><label class="field-label">Current Country of Residence</label><input id="sf86-rel-country" placeholder="USA"></div>
        <div class="field"><label class="field-label">US Citizen?</label><select id="sf86-rel-citizen"><option value="yes">Yes</option><option value="no">No</option><option value="unknown">Unknown</option></select></div>
        <div class="field"><label class="field-label">Contact Info (city/phone)</label><input id="sf86-rel-contact" placeholder="Dallas, TX · 555-1234"></div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="saveSF86Relative()">Save</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('sf86AddRel',false)">Cancel</button>
      </div>
    </div>`:''}
    ${relatives.length===0?'<div class="card" style="text-align:center;padding:30px;color:#9ca3af">No relatives entered yet.</div>':''}
    ${relatives.map((r,i)=>renderSF86RelCard(r,i)).join('')}`;
}

function renderSF86Notes(sf) {
  return `
    <div class="card">
      <h2>📝 Notes & Sensitive Items</h2>
      <p style="font-size:13px;color:#6b7280;margin:0 0 12px;line-height:1.6">Use this section to track anything you're unsure about — financial issues, past legal matters, mental health treatment, drug use disclosures. The adjudicative guidelines are more forgiving than most veterans think, especially with voluntary disclosure. Notes here are only visible to you.</p>
      <div class="field">
        <label class="field-label">Private notes (not submitted anywhere)</label>
        <textarea id="sf86-notes-input" rows="10" placeholder="Things to research before submitting: exact dates for old addresses, landlord names, foreign travel details, any items you're unsure about disclosing...">${esc(sf.notes||'')}</textarea>
      </div>
      <button class="btn btn-primary" onclick="saveSF86Notes()">Save Notes</button>
    </div>
    <div class="card" style="background:#f0fdf4;border:1px solid #86efac">
      <h2 style="color:#166534">✅ Adjudicative Guidelines — What's Actually Disqualifying</h2>
      <p style="font-size:13px;color:#166534;line-height:1.8">Most veterans worry too much about disclosures. These are the actual standards:</p>
      <div style="font-size:13px;color:#166534;line-height:1.9">
        <div>• <strong>Financial issues:</strong> Mitigated by demonstrated recovery, circumstances outside your control (medical, divorce), and proactive steps to resolve debts</div>
        <div>• <strong>Mental health:</strong> Seeking treatment is viewed positively — it shows self-awareness. PTSD and combat-related treatment rarely affect clearances</div>
        <div>• <strong>Drug use:</strong> Past use (especially marijuana) is mitigated by time elapsed and no current use. Be honest about frequency and recency</div>
        <div>• <strong>Legal issues:</strong> Minor criminal history is mitigated by time, rehabilitation, and circumstances. DUI from years ago with no pattern rarely disqualifies</div>
        <div>• <strong>Foreign contacts:</strong> Having foreign friends/family is normal — the issue is concealment, not contact itself</div>
        <div>• <strong>Always:</strong> Concealment of any issue is far more damaging than the issue itself. Investigators find out.</div>
      </div>
    </div>`;
}

// SF-86 CRUD functions
function saveSF86Residence(editIdx) {
  const r = {
    address: document.getElementById('sf86-res-addr')?.value?.trim()||'',
    city: document.getElementById('sf86-res-city')?.value?.trim()||'',
    state: document.getElementById('sf86-res-state')?.value?.trim()||'',
    zip: document.getElementById('sf86-res-zip')?.value?.trim()||'',
    country: document.getElementById('sf86-res-country')?.value?.trim()||'USA',
    from: document.getElementById('sf86-res-from')?.value||'',
    to: document.getElementById('sf86-res-to')?.value||'',
    current: document.getElementById('sf86-res-current')?.value||'no',
    landlord: document.getElementById('sf86-res-landlord')?.value?.trim()||'',
    phone: document.getElementById('sf86-res-phone')?.value?.trim()||'',
  };
  const residences = [...(state.sf86?.residences||[])];
  if (editIdx !== null && editIdx !== undefined) residences[editIdx] = r;
  else residences.push(r);
  setState({ sf86: {...state.sf86, residences} });
  toggleUI('sf86AddRes', false); toggleUI('sf86EditRes', undefined);
  showToast('Residence saved ✓');
}

function saveSF86Employer(editIdx) {
  const e = {
    name: document.getElementById('sf86-emp-name')?.value?.trim()||'',
    title: document.getElementById('sf86-emp-title')?.value?.trim()||'',
    address: document.getElementById('sf86-emp-addr')?.value?.trim()||'',
    city: document.getElementById('sf86-emp-city')?.value?.trim()||'',
    state: document.getElementById('sf86-emp-state')?.value?.trim()||'',
    zip: document.getElementById('sf86-emp-zip')?.value?.trim()||'',
    from: document.getElementById('sf86-emp-from')?.value||'',
    to: document.getElementById('sf86-emp-to')?.value||'',
    current: document.getElementById('sf86-emp-current')?.value||'no',
    type: document.getElementById('sf86-emp-type')?.value||'',
    supervisorName: document.getElementById('sf86-emp-sup-name')?.value?.trim()||'',
    supervisorPhone: document.getElementById('sf86-emp-sup-phone')?.value?.trim()||'',
    reasonLeft: document.getElementById('sf86-emp-reason')?.value?.trim()||'',
  };
  const employers = [...(state.sf86?.employers||[])];
  if (editIdx !== null && editIdx !== undefined) employers[editIdx] = e;
  else employers.push(e);
  setState({ sf86: {...state.sf86, employers} });
  toggleUI('sf86AddEmp', false); toggleUI('sf86EditEmp', undefined);
  showToast('Employment saved ✓');
}

function saveSF86Reference(editIdx) {
  const r = {
    name: document.getElementById('sf86-ref-name')?.value?.trim()||'',
    relationship: document.getElementById('sf86-ref-rel')?.value?.trim()||'',
    phone: document.getElementById('sf86-ref-phone')?.value?.trim()||'',
    email: document.getElementById('sf86-ref-email')?.value?.trim()||'',
    location: document.getElementById('sf86-ref-location')?.value?.trim()||'',
    knownYears: document.getElementById('sf86-ref-known')?.value?.trim()||'',
  };
  const references = [...(state.sf86?.references||[])];
  if (editIdx !== null && editIdx !== undefined) references[editIdx] = r;
  else references.push(r);
  setState({ sf86: {...state.sf86, references} });
  toggleUI('sf86AddRef', false); toggleUI('sf86EditRef', undefined);
  showToast('Reference saved ✓');
}

function saveSF86ForeignContact() {
  const c = {
    name: document.getElementById('sf86-fc-name')?.value?.trim()||'',
    country: document.getElementById('sf86-fc-country')?.value?.trim()||'',
    relationship: document.getElementById('sf86-fc-rel')?.value?.trim()||'',
    frequency: document.getElementById('sf86-fc-freq')?.value?.trim()||'',
  };
  const foreignContacts = [...(state.sf86?.foreignContacts||[]), c];
  setState({ sf86: {...state.sf86, foreignContacts} });
  toggleUI('sf86AddFContact', false);
  showToast('Foreign contact saved ✓');
}

function saveSF86ForeignTravel() {
  const t = {
    country: document.getElementById('sf86-ft-country')?.value?.trim()||'',
    purpose: document.getElementById('sf86-ft-purpose')?.value||'',
    from: document.getElementById('sf86-ft-from')?.value||'',
    to: document.getElementById('sf86-ft-to')?.value||'',
  };
  const foreignTravel = [...(state.sf86?.foreignTravel||[]), t];
  setState({ sf86: {...state.sf86, foreignTravel} });
  toggleUI('sf86AddFTravel', false);
  showToast('Foreign travel saved ✓');
}

function saveSF86Relative() {
  const r = {
    name: document.getElementById('sf86-rel-name')?.value?.trim()||'',
    type: document.getElementById('sf86-rel-type')?.value||'',
    birthCountry: document.getElementById('sf86-rel-birthcountry')?.value?.trim()||'',
    country: document.getElementById('sf86-rel-country')?.value?.trim()||'',
    citizen: document.getElementById('sf86-rel-citizen')?.value||'yes',
    contact: document.getElementById('sf86-rel-contact')?.value?.trim()||'',
  };
  const relatives = [...(state.sf86?.relatives||[]), r];
  setState({ sf86: {...state.sf86, relatives} });
  toggleUI('sf86AddRel', false);
  showToast('Relative saved ✓');
}

function saveSF86Notes() {
  const notes = document.getElementById('sf86-notes-input')?.value||'';
  setState({ sf86: {...state.sf86, notes} });
  showToast('Notes saved ✓');
}

function removeSF86Item(section, idx) {
  if (!confirm('Remove this entry?')) return;
  const arr = [...(state.sf86?.[section]||[])];
  arr.splice(idx, 1);
  setState({ sf86: {...state.sf86, [section]: arr} });
}

