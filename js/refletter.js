// ── Reference Letter Generator ────────────────────────────────────────
function renderRefLetter() {
  const busy = state.ui.refBusy || false;
  const result = state.ui.refResult || null;
  const error = state.ui.refError || '';
  const p = state.profile;
  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">📜 Reference Letter Generator</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Draft a professional reference letter a former CO, supervisor, or colleague can sign. Claude writes it from your actual accomplishments — they just review, personalize, and sign.</p>
    
    <div class="card">
      <h2>Configure the Letter</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Letter Writer (Who is signing it?)</label>
          <input id="ref-writer-name" placeholder="Col. James Harrison, USAF (Ret.)" value="${esc(state.ui.refWriterName||'')}">
        </div>
        <div class="field">
          <label class="field-label">Writer's Relationship to You</label>
          <select id="ref-writer-rel">
            <option value="direct-supervisor">Direct supervisor / Commanding Officer</option>
            <option value="senior-leader">Senior leader / Wing/Division Commander</option>
            <option value="peer">Peer / Fellow officer</option>
            <option value="subordinate">Former subordinate (character reference)</option>
            <option value="mentor">Mentor / Advisor</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Writer's Current Title/Position</label>
          <input id="ref-writer-title" placeholder="Retired USAF Colonel; VP Operations, Leidos" value="${esc(state.ui.refWriterTitle||'')}">
        </div>
        <div class="field">
          <label class="field-label">Target Job / Employer (optional)</label>
          <input id="ref-target" placeholder="Program Manager at Northrop Grumman — tailor the letter to this role" value="${esc(state.ui.refTarget||'')}">
        </div>
        <div class="field">
          <label class="field-label">Time Period You Worked Together</label>
          <input id="ref-period" placeholder="2018–2021, 86th Airlift Wing, Ramstein AB" value="${esc(state.ui.refPeriod||'')}">
        </div>
        <div class="field">
          <label class="field-label">Tone</label>
          <select id="ref-tone">
            <option value="formal">Formal — military/government style</option>
            <option value="professional">Professional — corporate style</option>
            <option value="warm">Warm — personal and enthusiastic</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label class="field-label">Specific accomplishments or qualities to highlight (optional)</label>
        <textarea id="ref-highlights" rows="3" placeholder="e.g., led the wing's COVID response, saved $2M through process improvements, exceptional under pressure...">${esc(state.ui.refHighlights||'')}</textarea>
      </div>
      <button class="btn btn-primary" onclick="generateRefLetter()" ${busy||!p.fullName?'disabled':''} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Writing letter...':'📜 Generate Reference Letter'}
      </button>
      ${!p.fullName?`<p style="font-size:13px;color:#f59e0b;margin-top:10px">⚠️ Complete your Profile first.</p>`:''}
      ${busy?`<div style="background:#eff6ff;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#1e40af;display:flex;align-items:center;gap:10px"><div class="spinner"></div> Writing your reference letter — this takes about 20 seconds...</div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>
    ${result?`
    <div class="card" style="border-left:4px solid #7c3aed">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">Reference Letter Draft</h2>
          <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Send this to ${esc(state.ui.refWriterName||'the letter writer')} — they should personalize it in their own voice and sign it</p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="copySection('ref-letter-output')">📋 Copy</button>
          <button class="btn btn-secondary btn-sm" onclick="exportLetterToWord(document.getElementById('ref-letter-output')?.innerText, '${esc(state.ui.refWriterName||'Letter')}')">📝 Export Word</button>
          <button class="btn btn-secondary btn-sm" onclick="toggleUI('refResult',null)">Clear</button>
        </div>
      </div>
      <div id="ref-letter-output" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;font-size:13px;line-height:1.9;white-space:pre-line;font-family:Georgia,serif">${esc(result.letter||'')}</div>
      ${result.writerNotes?`
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-top:14px">
        <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">📋 Notes for the Letter Writer</div>
        <div style="font-size:13px;color:#92400e;white-space:pre-line">${esc(result.writerNotes)}</div>
      </div>`:''}
    </div>`:''}`;
}

async function generateRefLetter() {
    const writerName = document.getElementById('ref-writer-name')?.value?.trim()||'';
  const writerRel = document.getElementById('ref-writer-rel')?.value||'direct-supervisor';
  const writerTitle = document.getElementById('ref-writer-title')?.value?.trim()||'';
  const target = document.getElementById('ref-target')?.value?.trim()||'';
  const period = document.getElementById('ref-period')?.value?.trim()||'';
  const tone = document.getElementById('ref-tone')?.value||'formal';
  const highlights = document.getElementById('ref-highlights')?.value?.trim()||'';
  toggleUI('refWriterName',writerName); toggleUI('refWriterTitle',writerTitle);
  toggleUI('refTarget',target); toggleUI('refPeriod',period); toggleUI('refHighlights',highlights);
  setState({ ui:{...state.ui, refBusy:true, refError:'', refResult:null} });
  const p = state.profile;
  const topExp = state.assignments.slice(0,3).map(a=>{
    const roleStr = (a.roles||[]).map(r=>`${r.title}: ${r.accomplishments||''}`).join('; ');
    return `${a.dutyTitle} | ${a.unit||''} | ${a.base||''} | ${a.startDate||''}-${a.endDate||'Present'}\n${a.accomplishments||''}\n${roleStr}`;
  }).join('\n---\n');
  const awards = state.awards.map(a=>a.name).join(', ');
  try {
    const raw = await callClaude(
      `You are a senior military officer and executive who writes reference letters for outstanding service members transitioning to civilian careers. Your letters are specific, credible, and compelling — they cite real accomplishments with numbers, paint a vivid picture of the person's character, and make a clear case for hiring them. You never write generic letters full of hollow praise. Every sentence earns its place.`,
      `Write a reference letter for this veteran. The letter should be written FROM the perspective of ${writerName||'the letter writer'} (${writerTitle||writerRel}).

VETERAN BEING RECOMMENDED:
Name: ${p.fullName} | Branch: ${p.branch} | Rank: ${p.rank} | Years: ${p.yearsOfService}
Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})

WRITER'S RELATIONSHIP: ${writerRel} — worked together ${period||'during service'}
TARGET ROLE/EMPLOYER: ${target||'civilian position (general)'}
TONE: ${tone}
SPECIAL HIGHLIGHTS: ${highlights||'None specified'}

VETERAN'S KEY EXPERIENCE:
${topExp||'Military service'}

AWARDS: ${awards||'None'}

LETTER REQUIREMENTS:
- Written in first person AS the letter writer (not about them)
- 3-4 paragraphs: (1) writer's relationship/context, (2) specific accomplishments with numbers, (3) character/leadership qualities with a real story, (4) strong close with direct recommendation
- NEVER use: "It is my pleasure to recommend", "without hesitation", "consummate professional", "exceeded expectations", "above and beyond" — these are hollow filler phrases
- Include at least 2 specific metrics or accomplishments
- The close should include writer's name, title, contact info placeholders
- ${tone==='formal'?'Use formal military/government correspondence style':'Use professional but warm corporate letter format'}

Return ONLY this JSON:
{
  "letter": "The complete letter text — plain text, use \\n for line breaks. Include date placeholder at top, proper salutation, all 4 paragraphs, and signature block with [Phone] and [Email] placeholders.",
  "writerNotes": "3-4 bullet points of guidance for the letter writer: what to personalize, what to verify for accuracy, whether to add their letterhead, how to send it (email vs physical)."
}`, 'refletter');
    let result;
    try { result = JSON.parse(raw.replace(/```json|```/g,'').trim()); } catch(e) { throw new Error('Could not parse result. Try again.'); }
    setState({ ui:{...state.ui, refBusy:false, refResult:result} });
    if (typeof trackAction==='function') trackAction('refletter_generate');
    showToast('✓ Reference letter generated!');
  } catch(err) {
    setState({ ui:{...state.ui, refBusy:false, refError:err.message} });
  }
}

