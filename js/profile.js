// ── Profile ───────────────────────────────────────────────────────────
function renderProfile() {
  // Auto-fix military name format on first render if needed
  const raw = state.profile.fullName || '';
  if (raw.includes(',') && !state.ui.nameNormalized) {
    setState({ ui: { ...state.ui, nameNormalized: true } }, false);
    setTimeout(normalizeProfileName, 100);
  }
  const p = state.profile;
  const selectedIndustries = p.targetIndustries || [];
  
  const indChecks = buildIndustryHTML(selectedIndustries);
  
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

  // Check for common data quality issues to warn about
  const p2 = state.profile;
  const issues = [];
  if (p2.fullName && p2.fullName === p2.fullName.toUpperCase()) issues.push('Name appears to be ALL CAPS');
  if (p2.fullName && p2.fullName.includes(',')) issues.push('Name may be in Last, First order');
  if (p2.rank && p2.rank === p2.rank.toUpperCase() && p2.rank.length > 3) issues.push('Rank appears to be ALL CAPS');
  if (!p2.fullName) issues.push('Name is missing');
  if (!p2.branch) issues.push('Branch of service is missing');
  if (!p2.rank) issues.push('Rank is missing');
  if (!p2.yearsOfService) issues.push('Years of service is missing');

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 16px">Your Profile</h1>

    <!-- Data quality banner -->
    <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:12px;padding:16px 18px;margin-bottom:20px">
      <div style="display:flex;align-items:start;gap:12px">
        <span style="font-size:22px;flex-shrink:0">⚠️</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:15px;color:#92400e;margin-bottom:4px">Review your profile before generating anything</div>
          <div style="font-size:13px;color:#78350f;line-height:1.6">
            Claude uses exactly what's here to write your resume, cover letter, LinkedIn profile, and interview answers.
            <strong>Garbage in, garbage out</strong> — take 2 minutes to verify everything looks right before you generate.
          </div>
          ${issues.length > 0 ? `
          <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">
            ${issues.map(i => `<span style="background:#fef3c7;border:1px solid #f59e0b;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600;color:#92400e">⚠ ${esc(i)}</span>`).join('')}
          </div>` : `
          <div style="margin-top:8px;font-size:12px;color:#15803d;font-weight:600">✅ No obvious issues detected — still worth a quick read-through</div>
          `}
          <div style="margin-top:12px;font-size:12px;color:#78350f">
            <strong>Common things to check:</strong> Name capitalization · Name order (First Last, not LAST FIRST) · Dates formatted consistently · Rank spelled out fully · Location is a city, not a base name
          </div>
        </div>
      </div>
    </div>

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
      <div class="field"><label class="field-label">Training, Methodologies & Professional Development</label>
        <textarea id="p-training" rows="3" placeholder="e.g. Sandler Sales Methodology (practiced 5+ years), Agile/Scrum, Six Sigma Green Belt training, Harvard Leadership Program...">${esc(p.training||'')}</textarea>
        <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">Add formal training, sales methodologies, leadership programs — anything not captured in certifications. This feeds directly into resume and gap analysis.</p>
      </div>
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

      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #f3f4f6">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <label class="field-label" style="margin:0">🧭 Identity Frame</label>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:#6b7280">Used in every resume, cover letter, and interview answer</span>
            ${state.assignments.length > 0 ? `<button class="btn btn-primary btn-sm" onclick="generateIdentityFrame()">🤖 AI Generate</button>` : ''}
          </div>
        </div>
        <p style="font-size:12px;color:#6b7280;margin:0 0 8px">One sentence that anchors your entire narrative. What unique combination of experience makes you different from every other candidate? Be specific.</p>
        <textarea id="p-identityFrame" rows="2"
          placeholder='e.g. "Operational strategist who understands how warfighters think, how program offices buy, how requirements evolve, and where friction lives."'
          style="font-size:13px">${esc(p.identityFrame||'')}</textarea>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px">This phrase appears verbatim in your "What Sets Me Apart" resume section and anchors your cover letter narrative.</div>
      </div>
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

function normalizeProfileName() {
  // Fix military-format names (LAST, FIRST MIDDLE) stored in profile
  const raw = state.profile.fullName || '';
  const commaMatch = raw.match(/^([^,]+),\s*(.+)$/);
  if (commaMatch) {
    const last = commaMatch[1].trim();
    const first = commaMatch[2].trim().split(/\s+/)[0];
    const normalized = `${first} ${last}`.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    setState({ profile: { ...state.profile, fullName: normalized } }, false);
    const el = document.getElementById('p-fullName');
    if (el) el.value = normalized;
    showToast('Name reformatted to First Last');
  }
}

function saveProfile() {
  const fields = ['fullName','email','phone','location','linkedin','branch','rank','yearsOfService','mosRate','clearance','clearanceStatus','workPreference','willingToRelocate','targetLocations','education','certifications','training','elevatorPitch','identityFrame'];
  const updated = { ...state.profile };
  fields.forEach(f => {
    const el = document.getElementById('p-' + f);
    if (el) updated[f] = el.value;
  });
  // Save directly to state + localStorage WITHOUT triggering full re-render
  // (re-render would collapse the industry multi-select dropdowns)
  state.profile = updated;
  try { localStorage.setItem('vc_profile', JSON.stringify(state.profile)); } catch(e) {}
  scheduleSync();
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
      .map(i => typeof i === 'object' ? (i.subTypes && i.subTypes.length ? `${i.name} (${i.subTypes.join(', ')})` : i.subType ? `${i.name} (${i.subType})` : i.name) : i)
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

async function generateIdentityFrame() {
  if (state.assignments.length === 0) { showToast('Add some assignments first', false); return; }

  showToast('🤖 Crafting your identity frame...', true);

  try {
    const p = state.profile;
    const topAssignments = [...state.assignments]
      .sort((a,b) => new Date(b.startDate||0) - new Date(a.startDate||0))
      .slice(0, 5)
      .map(a => `${a.dutyTitle||''} at ${a.base||''}: ${(a.accomplishments||'').slice(0,200)}`)
      .join('\n');

    const targetIndustries = (p.targetIndustries||[])
      .map(i => typeof i === 'object' ? i.name : i)
      .join(', ') || 'Not specified';

    const prompt = `Write a single identity frame sentence for this veteran. This sentence anchors every resume, cover letter, and interview answer they will ever use.

VETERAN DATA:
Branch: ${p.branch||'Unknown'} | Rank: ${p.rank||'Unknown'} | Years: ${p.yearsOfService||'Unknown'}
MOS/Rate: ${p.mosRate||'Unknown'}
Clearance: ${p.clearance||'None'}
Technical Skills: ${(p.technicalSkills||[]).join(', ')||'None'}
Target Industries: ${targetIndustries}

TOP EXPERIENCE:
${topAssignments}

RULES — every one is non-negotiable:
- Exactly ONE sentence. No more.
- Must name the specific intersection of capabilities that makes this person unique — not generic strengths
- Must be written in third-person positioning style (like "Operational strategist who..." or "Technology leader who...")
- Must reference at least two distinct domains this person bridges (e.g., operations + technology, military + business development, intelligence + product)
- Must be something a hiring manager would read and think "I haven't seen that combination before"
- NO buzzwords: "passionate", "results-driven", "proven track record", "dynamic", "leverages", "synergizes"
- NO rank-first framing: do not open with "Retired [Rank]" or "20-year veteran"
- Sound like it was written by a sharp career strategist, not a resume template
- Under 35 words

Return ONLY the sentence. Nothing else.`;

    const result = await callClaude(
      'You are a senior executive career strategist who specializes in positioning high-performing military veterans for civilian leadership roles. You write identity frames that make hiring managers stop and say "I need to meet this person." You never write generic positioning statements.',
      prompt
    );

    const frame = result.trim().replace(/^["']|["']$/g, '');
    const el = document.getElementById('p-identityFrame');
    if (el) {
      el.value = frame;
      showToast('✅ Identity frame generated — edit to make it yours.');
    }
    setState({ profile: { ...state.profile, identityFrame: frame } }, false);
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
  const inds = state.profile.targetIndustries || [];
  
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
  
  refreshIndustryUI();
}

// Called when user changes the multi-select dropdown for sub-types
function setIndustrySubTypes(industryName, selectEl) {
  const selected = Array.from(selectEl.selectedOptions).map(o => o.value);
  const inds = state.profile.targetIndustries || [];
  const updated = inds.map(i => {
    const entry = typeof i === 'string' ? { name: i, subTypes: [] } : { ...i };
    if (entry.name !== industryName) return entry;
    delete entry.subType; // migrate old format
    entry.subTypes = selected;
    return entry;
  });
  state.profile = { ...state.profile, targetIndustries: updated };
  try { localStorage.setItem('vc_profile', JSON.stringify(state.profile)); } catch(e) {}
}

// Called when user selects a sub-type from dropdown before selecting parent
// Auto-selects the parent industry
function selectIndustryFromChild(industryName, subType) {
  const inds = state.profile.targetIndustries || [];
  const alreadySelected = inds.some(i =>
    (typeof i === 'string' && i === industryName) ||
    (typeof i === 'object' && i.name === industryName)
  );
  let updated;
  if (!alreadySelected) {
    updated = [...inds, { name: industryName, subTypes: [subType] }];
  } else {
    updated = inds.map(i => {
      const entry = typeof i === 'string' ? { name: i, subTypes: [] } : { ...i };
      if (entry.name !== industryName) return entry;
      if (!entry.subTypes) entry.subTypes = [];
      if (!entry.subTypes.includes(subType)) entry.subTypes = [...entry.subTypes, subType];
      return entry;
    });
  }
  state.profile = { ...state.profile, targetIndustries: updated };
  try { localStorage.setItem('vc_profile', JSON.stringify(state.profile)); } catch(e) {}
  refreshIndustryUI();
}

// Single source of truth for industry HTML — used by renderProfile and refreshIndustryUI
function buildIndustryHTML(selectedIndustries) {
  return INDUSTRIES.map(industry => {
    const selected = selectedIndustries.find(s =>
      (typeof s === 'string' && s === industry.name) ||
      (typeof s === 'object' && s.name === industry.name)
    );
    const isChecked = !!selected;
    const currentSubTypes = (typeof selected === 'object' && selected.subTypes) ? selected.subTypes :
                            (typeof selected === 'object' && selected.subType) ? [selected.subType] : [];
    const rowHeight = Math.min(industry.subTypes.length, 5) * 22 + 10;
    return `
      <div style="margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid ${isChecked?'#3b82f6':'#e5e7eb'};border-radius:8px;cursor:pointer;font-size:13px;background:${isChecked?'#eff6ff':'white'}">
          <input type="checkbox" ${isChecked?'checked':''} onchange="toggleIndustry('${industry.name}')" style="width:auto;accent-color:#2563eb"> ${industry.name}
        </label>
        ${isChecked ? `
          <div style="margin-left:32px;margin-top:4px">
            <select multiple onchange="setIndustrySubTypes('${industry.name}', this)"
              style="width:100%;padding:4px;font-size:12px;border:1px solid #d1d5db;border-radius:6px;height:${rowHeight}px">
              ${industry.subTypes.map(st => `<option value="${st}" ${currentSubTypes.includes(st)?'selected':''}>${st}</option>`).join('')}
            </select>
            <p style="font-size:11px;color:#9ca3af;margin:3px 0 0">Hold Cmd (Mac) or Ctrl to select multiple. Leave all unselected = include all areas.</p>
          </div>` : ''}
      </div>`;
  }).join('');
}

function refreshIndustryUI() {
  const container = document.getElementById('industry-checks');
  if (!container) return;
  container.innerHTML = buildIndustryHTML(state.profile.targetIndustries || []);
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

