// ── LinkedIn Profile Generator ────────────────────────────────────────
function renderLinkedIn() {
  const busy = state.ui.linkedinBusy||false;
  const result = state.ui.linkedinResult||null;
  const error = state.ui.linkedinError||'';
  const p = state.profile;
  const hasProfile = !!(p.fullName && p.branch);
  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">💼 LinkedIn Profile Generator</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Generate a complete, optimized LinkedIn profile — headline, about section, and experience bullets — based on your actual background.</p>
    
    <div class="card">
      <h2>🎯 Configure Your LinkedIn Profile</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Target Audience / Industry</label>
          <input id="li-audience" placeholder="Defense contractors, tech companies, federal agencies..." value="${esc(state.ui.liAudience||'')}">
          <div style="font-size:11px;color:#9ca3af;margin-top:3px">Who are you trying to reach with this profile?</div>
        </div>
        <div class="field">
          <label class="field-label">Tone</label>
          <select id="li-tone">
            <option value="professional">Professional & Direct</option>
            <option value="approachable">Approachable & Conversational</option>
            <option value="technical">Technical & Credentialed</option>
            <option value="executive">Executive / Senior Leader</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Clearance Visibility</label>
          <select id="li-clearance">
            <option value="prominent">Feature prominently — it's a differentiator</option>
            <option value="mention">Mention naturally in context</option>
            <option value="omit">Omit — targeting non-cleared roles</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Optional: Anything specific to emphasize?</label>
          <input id="li-emphasis" placeholder="Leadership, technical expertise, specific programs..." value="${esc(state.ui.liEmphasis||'')}">
        </div>
      </div>
      <button class="btn btn-primary" onclick="generateLinkedIn()" ${busy||!hasProfile?'disabled':''} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Generating...':'💼 Generate LinkedIn Profile'}
      </button>
      ${!hasProfile?`<p style="font-size:13px;color:#f59e0b;margin-top:10px">⚠️ Complete your Profile first (name and branch at minimum).</p>`:''}
      ${busy?`<div style="background:#eff6ff;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#1e40af;display:flex;align-items:center;gap:10px"><div class="spinner"></div> Writing your LinkedIn profile — takes about 20 seconds...</div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>
    ${result?`
    <div class="card" style="border-left:4px solid #0077b5">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div><h2 style="margin:0">Your LinkedIn Profile</h2><p style="font-size:12px;color:#6b7280;margin:4px 0 0">Copy each section and paste directly into LinkedIn</p></div>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('linkedinResult',null)">Clear</button>
      </div>

      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:12px;font-weight:700;color:#0077b5;text-transform:uppercase;letter-spacing:0.5px">📌 Headline (220 chars max)</div>
          <button class="btn btn-secondary btn-sm" onclick="copySection('li-headline')">📋 Copy</button>
        </div>
        <div id="li-headline" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;font-size:14px;font-weight:600;color:#0c4a6e">${esc(result.headline||'')}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px">Paste this into: LinkedIn Profile → Edit intro → Headline</div>
      </div>

      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:12px;font-weight:700;color:#0077b5;text-transform:uppercase;letter-spacing:0.5px">📝 About Section</div>
          <button class="btn btn-secondary btn-sm" onclick="copySection('li-about')">📋 Copy</button>
        </div>
        <div id="li-about" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;font-size:13px;line-height:1.7;white-space:pre-line">${esc(result.about||'')}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px">Paste this into: LinkedIn Profile → Edit → About section</div>
      </div>

      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:12px;font-weight:700;color:#0077b5;text-transform:uppercase;letter-spacing:0.5px">💼 Experience Bullets</div>
          <button class="btn btn-secondary btn-sm" onclick="copySection('li-experience')">📋 Copy All</button>
        </div>
        <div id="li-experience" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;font-size:13px;line-height:1.8;white-space:pre-line">${esc(result.experience||'')}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px">Add these to each position in LinkedIn's Experience section</div>
      </div>

      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:12px;font-weight:700;color:#0077b5;text-transform:uppercase;letter-spacing:0.5px">🏆 Featured Skills (top 10)</div>
          <button class="btn btn-secondary btn-sm" onclick="copySection('li-skills')">📋 Copy</button>
        </div>
        <div id="li-skills" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;font-size:13px">${esc(result.skills||'')}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px">Add these via: LinkedIn Profile → Skills → Add a skill</div>
      </div>

      ${result.tips?`
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px">
        <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px">💡 LinkedIn Optimization Tips</div>
        <div style="font-size:13px;color:#92400e;white-space:pre-line">${esc(result.tips)}</div>
      </div>`:''}
    </div>`:''}`;
}

async function generateLinkedIn() {
    const audience = document.getElementById('li-audience')?.value?.trim()||'';
  const tone = document.getElementById('li-tone')?.value||'professional';
  const clearanceVis = document.getElementById('li-clearance')?.value||'prominent';
  const emphasis = document.getElementById('li-emphasis')?.value?.trim()||'';
  toggleUI('liAudience', audience); toggleUI('liEmphasis', emphasis);
  setState({ ui:{...state.ui, linkedinBusy:true, linkedinError:'', linkedinResult:null} });
  const p = state.profile;
  const exp = state.assignments.slice(0,5).map(a=>{
    let t=`${a.dutyTitle}${a.rank?' ('+a.rank+')':''} | ${a.unit||''} | ${a.base||''} | ${a.startDate||'?'}-${a.endDate||'Present'}\n${a.accomplishments||''}`;
    if((a.roles||[]).length) t+='\nAdditional roles: '+a.roles.map(r=>r.title).join(', ');
    return t;
  }).join('\n---\n');
  const awards = state.awards.map(a=>`${a.name}${a.civilianTranslation?' ('+a.civilianTranslation+')':''}`).join(', ');
  try {
    const raw = await callClaude(
      `You are a LinkedIn profile expert who specializes in military-to-civilian career transitions. You write profiles that get recruiters to reach out — specific, confident, human, and keyword-rich without being spammy. You understand that a great LinkedIn profile reads like a conversation, not a resume.

MILITARY-TO-CIVILIAN TRANSLATION — apply to every field:

TITLES: Translate using corporate equivalents based on role scope:
- Flight/Company Commander → Program Manager
- Squadron/Battalion Commander → Division Manager  
- Group/Brigade Commander → COO
- Wing/Division Commander → CEO
- Director of Operations (squadron level) → Deputy Division Manager
- Executive Officer (XO) → Chief of Staff
- Weapons Instructor → Senior Tactics Instructor & Advisor
- Chief, [Any Cell/Shop] → Director, [Function]
- Commander (small unit) → Director or Department Head

UNIT SCALE: Translate organizational size to business equivalents:
- Flight/Company → Team
- Squadron/Battalion → Division
- Group/Brigade → Business Vertical
- Wing/Division → Company
- MAJCOM and above → Enterprise

JARGON: Replace every military term with civilian equivalent:
- "sorties" → "missions" or "flight operations"
- "air tasking orders" → "operational planning cycles"
- "joint fires" → "multinational operations"
- "graduated [N] students" → "certified [N] professionals"
- "training events" → "training programs"
- "combat crews" → "flight crews" or "operational teams"
- "OPORD/CONOP" → "operational plan"
- "AOR/FOB" → omit or "operational theater"
- "NCO/SNCO" → "senior manager" or "team lead"
- "expeditionary" → "deployed"
- "MAJCOM" → "major command"
- Keep: C2, TS/SCI clearance, AOC (defense industry knows these)

Strip all unit numbers from org names ("479th Squadron" → "U.S. Air Force").
Lead the About section with the civilian value proposition, not rank.`,
      `Generate a complete, optimized LinkedIn profile for this veteran. Tone: ${tone}. Clearance visibility: ${clearanceVis}. Target audience: ${audience||'defense and civilian hiring managers'}. ${emphasis?'Emphasize: '+emphasis:''}

VETERAN BACKGROUND:
Name: ${p.fullName} | Branch: ${p.branch} | Rank: ${p.rank} | Years: ${p.yearsOfService}
MOS/Rate: ${p.mosRate||'N/A'} | Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Location: ${p.location||'N/A'} | LinkedIn: ${p.linkedin||'N/A'}
Skills: ${[...(p.technicalSkills||[]),(p.softSkills||[])].join(', ')||'N/A'}
Education: ${p.education||'N/A'} | Certs: ${p.certifications||'N/A'}
Target Industries: ${(p.targetIndustries||[]).map(i=>typeof i==='object'?i.name:i).join(', ')||'N/A'}

EXPERIENCE:
${exp||'None'}

AWARDS: ${awards||'None'}

Return ONLY this JSON (no markdown):
{
  "headline": "A powerful 200-character headline — not just job title, but value proposition. Include clearance if visibility is prominent. Example: 'Retired USAF Colonel | TS/SCI | JADC2 & C2ISR | BD & Capture | Warfighting Technology'",
  "about": "A 3-4 paragraph About section. Para 1: Hook — who they are, years of service, defining career moment. Para 2: Core expertise and what makes them different. Para 3: What they're looking for / how they help organizations. Optional Para 4: A line about life outside work if it humanizes them. Write in first person. Sound like a real person, not HR copy.",
  "experience": "For each assignment, write a 3-4 bullet LinkedIn experience description. Format:\\n\\n[DUTY TITLE] | [UNIT] | [DATES]\\n• Bullet with number\\n• Bullet with number\\n• Bullet with number\\n\\nTranslate all military jargon. Every bullet needs a metric.",
  "skills": "List 10 specific LinkedIn skills to add, comma-separated. Mix technical and leadership. Include clearance level as a skill if applicable.",
  "tips": "3-4 specific LinkedIn optimization tips for this veteran — profile photo advice, connection strategy, who to follow, hashtags to use, etc."
}`
    );
    let result;
    try { result = JSON.parse(raw.replace(/```json|```/g,'').trim()); } catch(e) { throw new Error('Could not parse result. Try again.'); }
    setState({ ui:{...state.ui, linkedinBusy:false, linkedinResult:result} });
    showToast('✓ LinkedIn profile generated!');
  } catch(err) {
    setState({ ui:{...state.ui, linkedinBusy:false, linkedinError:err.message} });
  }
}

function copySection(id) {
  const text = document.getElementById(id)?.innerText||'';
  navigator.clipboard.writeText(text).then(()=>showToast('✓ Copied to clipboard!')).catch(()=>{
    const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('✓ Copied!');
  });
}

