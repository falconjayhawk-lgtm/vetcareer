// ── Profile ───────────────────────────────────────────────────────────
function renderProfile() {
  const p = state.profile;
  const selectedIndustries = p.targetIndustries || [];
  
  const indChecks = INDUSTRIES.map(industry => {
    const selected = selectedIndustries.find(s => 
      (typeof s === 'string' && s === industry.name) || 
      (typeof s === 'object' && s.name === industry.name)
    );
    const isChecked = !!selected;
    const currentSubType = (typeof selected === 'object') ? selected.subType : null;

    return `
      <div style="margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid ${isChecked?'#3b82f6':'#e5e7eb'};border-radius:8px;cursor:pointer;font-size:13px;background:${isChecked?'#eff6ff':'white'}">
          <input type="checkbox" ${isChecked?'checked':''} onchange="toggleIndustry('${industry.name}')" style="width:auto;accent-color:#2563eb"> ${industry.name}
        </label>
        ${isChecked ? `
          <div style="margin-left:32px;margin-top:4px">
            <select onchange="setIndustrySubType('${industry.name}', this.value)" style="width:100%;padding:6px 10px;font-size:12px;border:1px solid #d1d5db;border-radius:6px">
              <option value="">What specific area?</option>
              ${industry.subTypes.map(st => `<option value="${st}" ${currentSubType===st?'selected':''}>${st}</option>`).join('')}
            </select>
          </div>` : ''}
      </div>`;
  }).join('');
  
  const techTags = (p.technicalSkills||[]).map((s,i)=>`<span class="tag tag-blue">${esc(s)} <button onclick="removeSkill('tech',${i})" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;font-size:14px;line-height:1">×</button></span>`).join('');
  const softTags = (p.softSkills||[]).map((s,i)=>`<span class="tag tag-purple">${esc(s)} <button onclick="removeSkill('soft',${i})" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;font-size:14px;line-height:1">×</button></span>`).join('');
  const awardList = state.awards.map(a=>`
    <div style="display:flex;align-items:start;gap:10px;padding:10px;background:#fffbeb;border-radius:8px;margin-bottom:8px">
      <span style="font-size:20px">🏅</span>
      <div style="flex:1">
        <div style="font-weight:600;font-size:14px">${esc(a.name)}${a.date?` <span style="font-weight:400;color:#9ca3af;font-size:12px">· ${fmtDate(a.date)}</span>`:''}</div>
        ${a.civilianTranslation?`<div style="font-size:12px;color:#6b7280;font-style:italic;margin-top:2px">${esc(a.civilianTranslation)}</div>`:''}
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeAward('${a.id}')">✕</button>
    </div>`).join('');

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 20px">Your Profile</h1>
    <div class="card">
      <h2>Personal Information</h2>
      <div class="grid2">
        <div class="field"><label class="field-label">Full Name</label><input id="p-fullName" value="${esc(p.fullName)}" placeholder="First Last"></div>
        <div class="field"><label class="field-label">Email</label><input type="email" id="p-email" value="${esc(p.email)}"></div>
        <div class="field"><label class="field-label">Phone</label><input id="p-phone" value="${esc(p.phone)}"></div>
        <div class="field"><label class="field-label">City, State</label><input id="p-location" value="${esc(p.location)}" placeholder="San Diego, CA"></div>
        <div class="field"><label class="field-label">LinkedIn URL</label><input id="p-linkedin" value="${esc(p.linkedin||'')}" placeholder="linkedin.com/in/yourname"></div>
      </div>
    </div>
    <div class="card">
      <h2>Military Background</h2>
      <div class="grid2">
        <div class="field"><label class="field-label">Branch *</label>
          <select id="p-branch"><option value="">Select...</option>${['Army','Navy','Air Force','Marine Corps','Coast Guard','Space Force'].map(b=>`<option ${p.branch===b?'selected':''}>${b}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">Final Rank</label><input id="p-rank" value="${esc(p.rank)}" placeholder="E-7, O-4..."></div>
        <div class="field"><label class="field-label">Years of Service</label><input type="number" id="p-yearsOfService" value="${esc(p.yearsOfService)}"></div>
        <div class="field"><label class="field-label">MOS / Rate / AFSC</label><input id="p-mosRate" value="${esc(p.mosRate)}" placeholder="11B, IS, 3D1X2..."></div>
      </div>
    </div>
    <div class="card">
      <h2>Security Clearance</h2>
      <div class="grid2">
        <div class="field"><label class="field-label">Clearance Level</label>
          <select id="p-clearance"><option value="">Select...</option>${['None','Confidential','Secret','Top Secret','TS/SCI'].map(c=>`<option ${p.clearance===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">Status</label>
          <select id="p-clearanceStatus"><option value="">Select...</option>${['Active','Eligible - Needs Update','Expired','Never Had'].map(c=>`<option ${p.clearanceStatus===c?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
    </div>
    <div class="card">
      <h2>Work Preferences</h2>
      <div class="grid2">
        <div class="field"><label class="field-label">Work Type</label>
          <select id="p-workPreference"><option value="">Select...</option>${['Remote','Hybrid','On-Site','Flexible'].map(c=>`<option ${p.workPreference===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">Willing to Relocate?</label>
          <select id="p-willingToRelocate"><option value="">Select...</option>${['Yes - Anywhere','Yes - Specific Locations','No','Depends on Role'].map(c=>`<option ${p.willingToRelocate===c?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label class="field-label">Target Locations (if relocating)</label><input id="p-targetLocations" value="${esc(p.targetLocations)}" placeholder="Washington DC, Tampa FL..."></div>
    </div>
    <div class="card">
      <h2>Target Industries</h2>
      <div class="grid2" id="industry-checks">${indChecks}</div>
    </div>
    <div class="card">
      <h2>Education & Certifications</h2>
      <div class="field"><label class="field-label">Education</label><textarea id="p-education" rows="3" placeholder="B.S. Criminal Justice, University of Maryland, 2018">${esc(p.education)}</textarea></div>
      <div class="field"><label class="field-label">Certifications</label><textarea id="p-certifications" rows="2" placeholder="PMP (2022), Security+ (2021)...">${esc(p.certifications)}</textarea></div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 style="margin:0">Skills Inventory</h2>
        ${(state.assignments.length > 0 || state.civilianJobs.length > 0) ? `<button class="btn btn-secondary btn-sm" onclick="extractSkillsFromExperience()">🤖 Auto-Extract from Experience</button>` : ''}
      </div>
      ${(state.assignments.length > 0 || state.civilianJobs.length > 0) ? `<p style="font-size:12px;color:#6b7280;margin:-8px 0 12px">Claude can read your assignments and jobs to automatically pull out technical and leadership skills you've demonstrated.</p>` : ''}
      <div class="grid2">
        <div>
          <label class="field-label">Technical Skills</label>
          <div style="display:flex;gap:6px;margin-bottom:8px"><input id="new-tech-skill" placeholder="Python, AutoCAD..." onkeydown="if(event.key==='Enter'){addSkill('tech');event.preventDefault()}"><button class="btn btn-secondary btn-sm" onclick="addSkill('tech')">+ Add</button></div>
          <div>${techTags||'<span style="color:#9ca3af;font-size:13px">None added yet</span>'}</div>
        </div>
        <div>
          <label class="field-label">Leadership / Soft Skills</label>
          <div style="display:flex;gap:6px;margin-bottom:8px"><input id="new-soft-skill" placeholder="Team Leadership..." onkeydown="if(event.key==='Enter'){addSkill('soft');event.preventDefault()}"><button class="btn btn-secondary btn-sm" onclick="addSkill('soft')">+ Add</button></div>
          <div>${softTags||'<span style="color:#9ca3af;font-size:13px">None added yet</span>'}</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 style="margin:0">Professional Summary (Elevator Pitch)</h2>
        ${state.assignments.length > 0 ? `<button class="btn btn-primary btn-sm" onclick="generateElevatorPitch()">🤖 AI Generate</button>` : ''}
      </div>
      <p style="font-size:13px;color:#6b7280;margin:-8px 0 12px">This is your baseline. AI will tailor it for each specific job during resume generation.</p>
      <div class="field"><label class="field-label">30-second summary for resume header & cover letters</label>
        <textarea id="p-elevatorPitch" rows="4" placeholder="Results-driven operations leader with 12 years directing teams of 50+, managing $5M budgets, and delivering mission-critical outcomes. Seeking to bring proven leadership to a civilian management role.">${esc(p.elevatorPitch)}</textarea></div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <button class="btn btn-primary" style="padding:12px 24px" onclick="saveProfile()">💾 Save Profile</button>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="margin:0">Awards & Decorations</h2>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('addAward')">+ Add Award</button>
      </div>
      ${state.ui.addAward?`
        <div style="padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:16px">
          <div class="grid2">
            <div class="field"><label class="field-label">Award Name *</label><input id="award-name" placeholder="Army Commendation Medal"></div>
            <div class="field"><label class="field-label">Date</label><input type="date" id="award-date"></div>
          </div>
          <div class="field"><label class="field-label">Civilian Translation</label>
            <textarea id="award-trans" rows="2" placeholder="Recognized for saving $200K through process redesign that improved efficiency 35%"></textarea></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" onclick="saveAward()">Save Award</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('addAward')">Cancel</button>
          </div>
        </div>`:'' }
      ${awardList||'<p style="color:#9ca3af;font-size:14px">No awards yet. Military decorations translate powerfully to civilian achievement recognition.</p>'}
    </div>`;
}

function saveProfile() {
  const fields = ['fullName','email','phone','location','linkedin','branch','rank','yearsOfService','mosRate','clearance','clearanceStatus','workPreference','willingToRelocate','targetLocations','education','certifications','elevatorPitch'];
  const updated = { ...state.profile };
  fields.forEach(f => {
    const el = document.getElementById('p-' + f);
    if (el) updated[f] = el.value;
  });
  setState({ profile: updated });
  showToast('Profile saved ✓');
}

async function generateElevatorPitch() {
    if (state.assignments.length === 0) { showToast('Add some assignments first', false); return; }
  
  showToast('🤖 Generating your professional summary...', true);
  
  try {
    const p = state.profile;
    const topAssignments = [...state.assignments]
      .sort((a,b) => new Date(b.startDate||0) - new Date(a.startDate||0))
      .slice(0, 4)
      .map(a => `${a.dutyTitle} at ${a.base}: ${(a.accomplishments||'').slice(0, 150)}`)
      .join(' | ');
    
    const targetIndustries = (p.targetIndustries||[])
      .map(i => typeof i === 'object' ? (i.subType ? `${i.name} (${i.subType})` : i.name) : i)
      .join(', ') || 'Not specified';
    
    const prompt = `Write a compelling 3-sentence professional summary for this veteran. This will appear at the top of a resume.

VETERAN DATA:
- ${p.branch || 'Military'} veteran, ${p.rank || 'N/A'} rank, ${p.yearsOfService || 'N/A'} years of service
- MOS/Rate: ${p.mosRate || 'N/A'}
- Clearance: ${p.clearance || 'None'} (${p.clearanceStatus || 'N/A'})
- Target industries: ${targetIndustries}
- Technical skills: ${(p.technicalSkills||[]).join(', ') || 'None'}

RECENT EXPERIENCE:
${topAssignments || 'None'}

AWARDS: ${state.awards.length > 0 ? state.awards.map(a => a.name).join(', ') : 'None'}

WRITING RULES — follow every one:
- Write exactly 3 sentences
- Sentence 1: Who they are and how much experience (use years, rank if helpful in civilian context)
- Sentence 2: A specific accomplishment with a real number — team size, budget, percentage, outcome
- Sentence 3: What unique value they bring to their target field
- ZERO military jargon — translate everything to plain business language
- NO generic filler phrases: "results-driven", "proven track record", "dynamic", "passionate", "leverage", "synergy", "strategic thinker"
- Vary sentence length — don't make all three sentences the same structure
- Sound like a real human wrote it, not a resume template
- Be specific and concrete — vague summaries get skipped
- Plain text only, no bullet points or headers`;



    const result = await callClaude(
      'You are a senior career coach who specializes in military-to-civilian transitions. You write professional summaries that sound like a real, confident human wrote them — not a resume template. You never use buzzwords or filler phrases. Every sentence earns its place with specificity and clarity.',
      prompt
    );
    
    const el = document.getElementById('p-elevatorPitch');
    if (el) {
      el.value = result.trim();
      showToast('Summary generated! Review and edit as needed.');
    }
  } catch(err) {
    showToast('Error: ' + err.message, false);
  }
}

async function extractSkillsFromExperience() {
    if (state.assignments.length === 0 && state.civilianJobs.length === 0) { 
    showToast('Add some assignments or jobs first', false); 
    return; 
  }
  
  showToast('🤖 Extracting skills from your experience...', true);
  
  try {
    const experienceText = [
      ...state.assignments.map(a => `${a.dutyTitle || 'Assignment'}: ${a.description || ''} ${a.accomplishments || ''}`),
      ...state.civilianJobs.map(j => `${j.title || 'Job'} at ${j.company || ''}: ${j.description || ''} ${j.accomplishments || ''}`)
    ].join('\n---\n');

    const currentTech = state.profile.technicalSkills || [];
    const currentSoft = state.profile.softSkills || [];

    const prompt = `Analyze this veteran's work experience and extract skills they've demonstrated.

EXPERIENCE:
${experienceText}

ALREADY LISTED:
Technical: ${currentTech.join(', ') || 'None'}
Leadership/Soft: ${currentSoft.join(', ') || 'None'}

Return ONLY this JSON (no markdown, no extra text):
{
  "technicalSkills": ["list of NEW technical skills not already listed - tools, systems, certifications, technical abilities"],
  "softSkills": ["list of NEW leadership/soft skills not already listed - communication, leadership, management, problem-solving abilities"]
}

Rules:
- Only include skills that are clearly demonstrated in the experience
- Don't duplicate skills already listed
- Be specific (e.g., "Project Management" not just "Management", "Python" not just "Coding")
- Limit to 8-10 NEW skills per category
- If no new skills found, return empty arrays`;

    const result = await callClaude(
      'You are a career coach analyzing work experience to identify demonstrated skills. Be specific and accurate. Only extract skills that are clearly shown in the experience. Return valid JSON only.',
      prompt
    );

    let extracted;
    try {
      extracted = JSON.parse(result.replace(/```json|```/g, '').trim());
    } catch(e) {
      throw new Error('Could not parse skill extraction results');
    }

    const newTech = extracted.technicalSkills || [];
    const newSoft = extracted.softSkills || [];
    
    if (newTech.length === 0 && newSoft.length === 0) {
      showToast('No new skills found — your profile already covers what Claude could extract.');
      return;
    }

    const mergedTech = [...currentTech, ...newTech];
    const mergedSoft = [...currentSoft, ...newSoft];

    setState({ 
      profile: { 
        ...state.profile, 
        technicalSkills: mergedTech,
        softSkills: mergedSoft
      } 
    });
    
    const total = newTech.length + newSoft.length;
    showToast(`✓ Added ${total} skill${total===1?'':'s'}: ${newTech.length} technical, ${newSoft.length} leadership`);
  } catch(err) {
    showToast('Error: ' + err.message, false);
  }
}

function toggleIndustry(industryName) {
  // Save any currently open profile form fields first to avoid wiping them on re-render
  const fields = ['fullName','email','phone','location','linkedin','branch','rank','yearsOfService','mosRate','clearance','clearanceStatus','workPreference','willingToRelocate','targetLocations','education','certifications','elevatorPitch'];
  
  // Check if this industry is already selected (could be string or object)
  const existingIdx = inds.findIndex(i => 
    (typeof i === 'string' && i === industryName) || 
    (typeof i === 'object' && i.name === industryName)
  );
  
  let updated;
  if (existingIdx !== -1) {
    // Remove it
    updated = inds.filter((_, idx) => idx !== existingIdx);
  } else {
    // Add it as an object with no subType yet
    updated = [...inds, { name: industryName, subType: '' }];
  }
  
  state.profile = { ...state.profile, targetIndustries: updated };
  try { localStorage.setItem('vc_profile', JSON.stringify(state.profile)); } catch(e) {}
  
  // Only re-render the industry section, not the whole page
  const container = document.getElementById('industry-checks');
  if (container) {
    const selectedIndustries = state.profile.targetIndustries || [];
    container.innerHTML = INDUSTRIES.map(industry => {
      const selected = selectedIndustries.find(s => 
        (typeof s === 'string' && s === industry.name) || 
        (typeof s === 'object' && s.name === industry.name)
      );
      const isChecked = !!selected;
      const currentSubType = (typeof selected === 'object') ? selected.subType : null;
      return `
        <div style="margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid ${isChecked?'#3b82f6':'#e5e7eb'};border-radius:8px;cursor:pointer;font-size:13px;background:${isChecked?'#eff6ff':'white'}">
            <input type="checkbox" ${isChecked?'checked':''} onchange="toggleIndustry('${industry.name}')" style="width:auto;accent-color:#2563eb"> ${industry.name}
          </label>
          ${isChecked ? `
            <div style="margin-left:32px;margin-top:4px">
              <select onchange="setIndustrySubType('${industry.name}', this.value)" style="width:100%;padding:6px 10px;font-size:12px;border:1px solid #d1d5db;border-radius:6px">
                <option value="">What specific area?</option>
                ${industry.subTypes.map(st => `<option value="${st}" ${currentSubType===st?'selected':''}>${st}</option>`).join('')}
              </select>
            </div>` : ''}
        </div>`;
    }).join('');
  }
}

function setIndustrySubType(industryName, subType) {
  const inds = state.profile.targetIndustries || [];
  const updated = inds.map(i => {
    if (typeof i === 'string' && i === industryName) {
      return { name: industryName, subType };
    }
    if (typeof i === 'object' && i.name === industryName) {
      return { ...i, subType };
    }
    return i;
  });
  
  state.profile = { ...state.profile, targetIndustries: updated };
  try { localStorage.setItem('vc_profile', JSON.stringify(state.profile)); } catch(e) {}
  // No need to re-render — the dropdown value updates in place
}

function addSkill(type) {
  const el = document.getElementById('new-'+type+'-skill');
  const val = el?.value?.trim();
  if (!val) return;
  const key = type === 'tech' ? 'technicalSkills' : 'softSkills';
  setState({ profile: { ...state.profile, [key]: [...(state.profile[key]||[]), val] } });
}

function removeSkill(type, idx) {
  const key = type === 'tech' ? 'technicalSkills' : 'softSkills';
  const arr = (state.profile[key]||[]).filter((_,i)=>i!==idx);
  setState({ profile: { ...state.profile, [key]: arr } });
}

function saveAward() {
  const name = document.getElementById('award-name')?.value?.trim();
  if (!name) return;
  const award = { id:id(), name, date: document.getElementById('award-date')?.value, civilianTranslation: document.getElementById('award-trans')?.value };
  setState({ awards: [...state.awards, award], ui: { ...state.ui, addAward: false } });
}

function removeAward(aid) { setState({ awards: state.awards.filter(a=>a.id!==aid) }); }

