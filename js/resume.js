// ── Resume Builder ────────────────────────────────────────────────────
function renderResume() {
  const jobs = state.jobs;
  const selJob = state.ui.resumeJob || '';
  const fmt = state.ui.resumeFmt || 'professional';
  const mode = state.ui.resumeMode || 'targeted';
  const job = jobs.find(j=>j.id===selJob);
  const busy = state.ui.resumeBusy || false;
  const status = state.ui.resumeStatus || '';
  const result = state.ui.resumeResult || null;
  const error = state.ui.resumeError || '';

  const jobOptions = jobs.map(j=>`<option value="${j.id}" ${selJob===j.id?'selected':''}>${esc(j.title)} — ${esc(j.company)}</option>`).join('');
  const canGenTargeted = !busy && !!selJob;
  const canGenGeneric  = !busy && !!!!state.profile?.fullName;
  const showModal = state.ui.resumeModal && result;

  // Format definitions — ATS flag drives warning display
  const formats = [
    {
      id: 'professional',
      l: 'Professional',
      d: 'Arial · Clean headers · Corporate',
      ats: true,
      badge: '✓ ATS Safe'
    },
    {
      id: 'federal',
      l: 'Federal / Gov',
      d: 'Georgia serif · Zero color · GS/Defense',
      ats: true,
      badge: '✓ ATS Safe'
    },
    {
      id: 'executive',
      l: 'Executive',
      d: 'Two-column · Navy accent · Visual',
      ats: false,
      badge: '⚠️ Not ATS Safe'
    }
  ];

  const fmtCards = (formats) => formats.map(f=>`
    <div onclick="toggleUI('resumeFmt','${f.id}')" style="padding:10px;border:2px solid ${fmt===f.id?'var(--accent)':'var(--rule)'};background:${fmt===f.id?'var(--gold-light)':'white'};border-radius:2px;cursor:pointer;position:relative">
      <div style="font-weight:700;font-size:13px;font-family:'Familjen Grotesk',sans-serif;color:var(--accent)">${f.l}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">${f.d}</div>
      <div style="margin-top:5px;display:inline-block;font-size:10px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;padding:2px 6px;border-radius:2px;background:${f.ats?'#e8f5e9':'#fff3e0'};color:${f.ats?'#2e7d32':'#e65100'}">${f.badge}</div>
    </div>`).join('');

  return `
    ${showModal ? `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px" onclick="toggleUI('resumeModal',false)">
      <div style="background:white;border-radius:2px;padding:28px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);border-top:4px solid var(--gold)" onclick="event.stopPropagation()">
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:42px;margin-bottom:8px">🎉</div>
          <div style="font-size:18px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;color:var(--accent);letter-spacing:0.02em;margin-bottom:4px">YOUR RESUME IS READY</div>
          <div style="font-size:13px;color:var(--muted)">Scroll down to view, download, or print. What's next?</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button onclick="exportResumeToWord();toggleUI('resumeModal',false)" style="padding:12px;border:none;background:var(--accent);color:white;border-radius:2px;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;cursor:pointer;text-align:left">
            📝 DOWNLOAD AS WORD DOCUMENT
          </button>
          <button onclick="printResume();toggleUI('resumeModal',false)" style="padding:12px;border:1.5px solid var(--rule-dark);background:white;color:var(--text);border-radius:2px;font-size:13px;font-weight:600;cursor:pointer;text-align:left">
            🖨 Print / Save as PDF
          </button>
          ${!result.isGeneric ? `<button onclick="setState({view:'interview'});toggleUI('resumeModal',false)" style="padding:12px;border:1.5px solid var(--rule-dark);background:white;color:var(--text);border-radius:2px;font-size:13px;font-weight:600;cursor:pointer;text-align:left">
            🎤 Prep for the Interview
          </button>` : ''}
          <button onclick="toggleUI('resumeModal',false)" style="padding:8px;border:none;background:none;color:var(--muted);font-size:12px;cursor:pointer">
            Keep reviewing my resume
          </button>
        </div>
      </div>
    </div>` : ''}

    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent);letter-spacing:0.02em">Resume Builder</h1>
    <p style="color:var(--muted);font-size:13px;margin:0 0 20px">AI-powered resume writing — Claude reads your actual experience and writes a real resume</p>

    <div style="display:flex;gap:0;margin-bottom:20px;border-radius:2px;overflow:hidden;border:1.5px solid var(--rule-dark);width:fit-content">
      <button onclick="toggleUI('resumeMode','targeted')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${mode==='targeted'?'var(--accent)':'white'};color:${mode==='targeted'?'white':'var(--muted)'};transition:all 0.15s">🎯 TAILORED TO A JOB</button>
      <button onclick="toggleUI('resumeMode','generic')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${mode==='generic'?'var(--accent)':'white'};color:${mode==='generic'?'white':'var(--muted)'};transition:all 0.15s;border-left:1.5px solid var(--rule-dark)">📋 GENERAL RESUME</button>
    </div>

    <div class="card">
      <h2>${mode==='targeted'?'Configure & Generate Tailored Resume':'Generate General-Purpose Resume'}</h2>

      ${mode==='targeted'?`
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 16px">Select a job from your tracker — Claude will tailor your resume and cover letter specifically for it.</p>
      <div class="grid2">
        <div class="field"><label class="field-label">Target Job</label>
          <select id="resume-job" onchange="toggleUI('resumeJob',this.value)"><option value="">Select a job...</option>${jobOptions}</select>
        </div>
        <div class="field"><label class="field-label">Resume Format</label>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">${fmtCards(formats)}</div>
        </div>
      </div>
      ${job?`<div style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:10px;font-size:13px;margin-bottom:14px"><strong>${esc(job.title)}</strong> at <span style="color:var(--accent)">${esc(job.company)}</span>${job.location?' — '+esc(job.location):''}${job.salaryRange?` <span style="color:var(--green);font-weight:600">· ${esc(job.salaryRange)}</span>`:''}</div>`:''}

      ${job && (job.resumeVersions||[]).length > 0 ? `
      <div style="background:var(--green-light);border:1.5px solid #c8e6cd;border-radius:2px;padding:14px;margin-bottom:16px">
        <div style="font-weight:700;font-size:12px;color:var(--green);margin-bottom:10px;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.06em;text-transform:uppercase">📁 Saved Versions (${job.resumeVersions.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${[...job.resumeVersions].reverse().map((v,i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;background:white;border:1px solid #c8e6cd;border-radius:2px;padding:8px 12px">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--text)">Version ${job.resumeVersions.length - i}</div>
                <div style="font-size:11px;color:var(--muted)">${esc(v.label)} · ${esc(v.fmt||'professional')} format${v.ats?` · ATS ${v.ats.score||'?'}/100`:''}</div>
              </div>
              <div style="display:flex;gap:6px">
                <button class="btn btn-secondary btn-sm" onclick="loadResumeVersion('${esc(job.id)}','${esc(v.id)}')" style="font-size:11px">Load</button>
                <button class="btn btn-danger btn-sm" onclick="deleteResumeVersion('${esc(job.id)}','${esc(v.id)}')" style="font-size:11px">✕</button>
              </div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <div class="field" style="margin-bottom:16px">
        <label class="field-label">Company Tone</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div onclick="toggleUI('resumeTone','startup')" style="padding:10px;border:2px solid ${(state.ui.resumeTone||'startup')==='startup'?'var(--accent)':'var(--rule)'};background:${(state.ui.resumeTone||'startup')==='startup'?'var(--gold-light)':'white'};border-radius:2px;cursor:pointer">
            <div style="font-weight:700;font-size:13px;font-family:'Familjen Grotesk',sans-serif">🚀 Startup / Growth</div>
            <div style="font-size:11px;color:var(--muted)">Scrappy, builder, wore-many-hats. For tech companies, startups, and innovation-focused orgs.</div>
          </div>
          <div onclick="toggleUI('resumeTone','prime')" style="padding:10px;border:2px solid ${(state.ui.resumeTone||'startup')==='prime'?'var(--accent)':'var(--rule)'};background:${(state.ui.resumeTone||'startup')==='prime'?'var(--gold-light)':'white'};border-radius:2px;cursor:pointer">
            <div style="font-weight:700;font-size:13px;font-family:'Familjen Grotesk',sans-serif">🏛️ Prime Contractor / Gov</div>
            <div style="font-size:11px;color:var(--muted)">Structured, process-driven, compliant. For defense primes, federal agencies, and large enterprises.</div>
          </div>
        </div>
      </div>

      <div class="field" style="margin-bottom:16px">
        <label class="field-label">Optional: Special instructions for this resume</label>
        <textarea id="resume-instructions" rows="3" placeholder="e.g., Consolidate all active duty into one section called 'Military Experience'&#10;Emphasize leadership over technical skills&#10;Keep it to one page&#10;Lead with my security clearance" style="font-size:13px" onchange="toggleUI('resumeInstructions',this.value)">${esc(state.ui.resumeInstructions||'')}</textarea>
        <div style="font-size:11px;color:var(--dim);margin-top:3px">Tell Claude how you want this specific resume structured or weighted — it will follow your lead.</div>
      </div>
      <button class="btn btn-primary" onclick="generateResume()" ${canGenTargeted?'':'disabled'} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Building...':'🚀 Generate Resume & Cover Letter'}
      </button>
      ${!state.jobs.length&&!busy?`<p style="font-size:13px;color:var(--gold);margin-top:10px">💡 No jobs in your tracker yet — <button onclick="setState({view:'jobs'})" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:13px;font-weight:600;padding:0">add one</button>, or use the General Resume tab instead.</p>`:''}
      `:`
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 16px">Generates a strong all-purpose resume you can hand out at career fairs, networking events, or any job posting. Also creates a short professional bio you can use on LinkedIn or email.</p>
      <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:12px;font-size:13px;color:var(--accent);margin-bottom:16px">
        💡 This resume highlights your strongest experience across all industries. Use it when you don't have a specific job posting yet.
      </div>
      <div class="grid2" style="margin-bottom:14px">
        <div class="field"><label class="field-label">Resume Format</label>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">${fmtCards(formats)}</div>
        </div>
        <div class="field"><label class="field-label">Optional: Any specific focus areas?</label>
          <input id="generic-focus" placeholder="e.g., leadership roles, project management, defense sector..." value="${esc(state.ui.genericFocus||'')}">
          <div style="font-size:11px;color:var(--dim);margin-top:4px">Leave blank for a broad general resume</div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="generateGenericResume()" ${canGenGeneric?'':'disabled'} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Building...':'📋 Generate General Resume & Bio'}
      </button>
      ${!state.profile?.fullName&&!busy?`<p style="font-size:13px;color:var(--gold);margin-top:10px">⚠️ Complete your profile first — <button onclick="setState({view:'profile'})" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:13px;font-weight:600;padding:0">go to Profile</button>.</p>`:''}
      `}

      ${busy?`<div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:16px;margin-top:12px">
        <div style="font-weight:700;color:var(--accent);font-size:13px;margin-bottom:12px;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em">🤖 CLAUDE IS BUILDING YOUR RESUME...</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:${['✉️','🔍','✂️'].some(s=>status.startsWith(s))?'var(--green)':'var(--accent)'};color:white">
            ${['✉️','🔍','✂️'].some(s=>status.startsWith(s))?'✓':'1'}
          </div>
          <div style="font-size:13px;color:${['✉️','🔍','✂️'].some(s=>status.startsWith(s))?'var(--green)':status.startsWith('✍️')?'var(--accent)':'var(--dim)'};font-weight:${status.startsWith('✍️')?'600':'400'}">
            Analyzing experience &amp; job requirements${status.startsWith('✍️')?' ...':''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:${['🔍','✉️'].some(s=>status.startsWith(s))?'var(--green)':status.startsWith('✍️')||status.startsWith('✂️')?'var(--accent)':'var(--rule-dark)'};color:${status.startsWith('✍️')||['🔍','✉️','✂️'].some(s=>status.startsWith(s))?'white':'var(--muted)'}">
            ${['🔍','✉️'].some(s=>status.startsWith(s))?'✓':'2'}
          </div>
          <div style="font-size:13px;color:${['🔍','✉️'].some(s=>status.startsWith(s))?'var(--green)':status.startsWith('✍️')||status.startsWith('✂️')?'var(--accent)':'var(--dim)'};font-weight:${status.startsWith('✍️')||status.startsWith('✂️')?'600':'400'}">
            Writing your tailored resume${status.startsWith('✍️')||status.startsWith('✂️')?' ...':''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:${['🔍','✉️'].some(s=>status.startsWith(s))?'var(--accent)':'var(--rule-dark)'};color:${['🔍','✉️'].some(s=>status.startsWith(s))?'white':'var(--muted)'}">3</div>
          <div style="font-size:13px;color:${['🔍','✉️'].some(s=>status.startsWith(s))?'var(--accent)':'var(--dim)'};font-weight:${['🔍','✉️'].some(s=>status.startsWith(s))?'600':'400'}">
            Scoring fit &amp; writing cover letter${['🔍','✉️'].some(s=>status.startsWith(s))?' ...':''}
          </div>
        </div>
        <div style="font-size:11px;color:var(--gold)">Takes 20–40 seconds — Claude reads your actual experience</div>
      </div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:2px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>
    ${result?renderResumeResult(result,fmt):''}`;
}

function renderResumeResult(result, fmt) {
  const sc = result.ats?.score;
  const scoreGrad = sc>=85?'linear-gradient(135deg,#2e7d32,#1b5e20)':sc>=70?'linear-gradient(135deg,#1a3a6b,#0d2444)':sc>=55?'linear-gradient(135deg,#b8860b,#8b6508)':'linear-gradient(135deg,#8b1a1a,#5c1010)';
  const scoreBg = sc>=85?'var(--green-light)':sc>=70?'var(--gold-light)':sc>=55?'#fffbeb':'#fef2f2';
  const scoreBorder = sc>=85?'#c8e6cd':sc>=70?'var(--gold)':sc>=55?'#fde68a':'#fecaca';
  const scoreLabel = sc>=85?'Strong Match — Apply with confidence':sc>=70?'Good Match — Address gaps in cover letter':sc>=55?'Moderate Fit — Emphasize transferable skills':'Stretch Role — Lead with cover letter';
  const isGeneric = result.isGeneric || false;
  const isExecutive = fmt === 'executive';
  const fmtLabel = {professional:'Professional',federal:'Federal / Gov',executive:'Executive'}[fmt] || 'Professional';

  return `
    ${!isGeneric && result.ats ? `
    <div class="card" style="background:${scoreBg};border:2px solid ${scoreBorder}">
      <h2 style="margin-bottom:12px">🎯 Resume Fit Analysis</h2>
      <div style="display:flex;gap:20px;align-items:center;margin-bottom:16px">
        <div class="score-circle" style="background:${scoreGrad};flex-shrink:0">
          <span style="font-size:28px;font-weight:800">${sc}</span>
          <span style="font-size:11px;opacity:0.9">Grade: ${result.ats.grade}</span>
        </div>
        <div>
          <div style="font-weight:700;font-size:16px;margin-bottom:4px;font-family:'Familjen Grotesk',sans-serif">${scoreLabel}</div>
          <div style="font-size:14px;color:var(--text);line-height:1.5">${esc(result.ats.summary||'')}</div>
          ${result.ats.clearance_value ? `<div style="margin-top:8px;background:#ede9fe;border:1px solid #c4b5fd;border-radius:2px;padding:6px 10px;font-size:12px;color:#6d28d9;font-weight:600">🔐 ${esc(result.ats.clearance_value)}</div>` : ''}
        </div>
      </div>
    </div>

    ${(result.ats.transferable_strengths||[]).length ? `
    <div class="card" style="border-left:4px solid var(--accent)">
      <h2 style="margin-bottom:4px">🪖 → 💼 Your Military Experience Translates</h2>
      <p style="font-size:13px;color:var(--muted);margin:0 0 12px">Here's how your military background maps to what this employer needs — even if the words look different on paper.</p>
      ${(result.ats.transferable_strengths||[]).map(s=>`
        <div style="display:flex;gap:10px;align-items:start;padding:10px;background:var(--gold-light);border-left:3px solid var(--gold);margin-bottom:8px">
          <span style="font-size:16px;flex-shrink:0">✓</span>
          <span style="font-size:14px;color:var(--accent);line-height:1.5">${esc(s)}</span>
        </div>`).join('')}
    </div>` : ''}

    ${result.ats.coaching_tip ? `
    <div class="card" style="background:#fffbeb;border:1px solid #fde68a">
      <h2 style="margin-bottom:6px">💡 Top Coaching Tip</h2>
      <p style="font-size:14px;color:#92400e;margin:0;line-height:1.6">${esc(result.ats.coaching_tip)}</p>
    </div>` : ''}

    <div class="card">
      <h2 style="margin-bottom:12px">📋 Detailed Breakdown</h2>
      <div class="grid2">
        <div>
          ${(result.ats.strengths||[]).length?`
          <div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif">✅ Resume Strengths</div>
          ${(result.ats.strengths||[]).map(s=>`<div style="font-size:13px;color:#1b5e20;padding:6px 8px;background:var(--green-light);border-radius:2px;margin-bottom:6px">• ${esc(s)}</div>`).join('')}`:''}
        </div>
        <div>
          ${(result.ats.gaps||[]).length?`
          <div style="font-size:11px;font-weight:700;color:var(--gold);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif">⚠️ Areas to Strengthen</div>
          ${(result.ats.gaps||[]).map(g=>`<div style="font-size:13px;color:#92400e;padding:6px 8px;background:#fffbeb;border-radius:2px;margin-bottom:6px">• ${esc(g)}</div>`).join('')}`:''}
        </div>
      </div>
      ${(result.ats.keywords_missing||[]).length?`
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--rule)">
        <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif">🔑 Keywords to Add (ATS Screening)</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Weave these in naturally — they help get past automated screening.</div>
        <div>${(result.ats.keywords_missing||[]).map(k=>`<span class="tag tag-orange">${esc(k)}</span>`).join('')}</div>
      </div>`:''}
    </div>` : ''}

    <!-- Resume output -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">📄 ${isGeneric?'General Resume':'Resume'} — ${fmtLabel} Format</h2>
          ${isExecutive ? `<div style="margin-top:4px;font-size:11px;font-weight:700;color:#e65100;background:#fff3e0;padding:3px 8px;border-radius:2px;display:inline-block">⚠️ VISUAL FORMAT — May not pass ATS screening. Use for networking, referrals, and direct applications.</div>` : `<div style="margin-top:4px;font-size:11px;font-weight:700;color:#2e7d32;background:var(--green-light);padding:3px 8px;border-radius:2px;display:inline-block">✓ ATS SAFE — Passes automated screening systems</div>`}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${state.ui.resumeEditing ? `
            <button class="btn btn-secondary btn-sm" onclick="cancelResumeEdit()" style="color:var(--muted)">✕ Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="saveResumeEdit()" style="background:var(--green)">✅ Done Editing</button>
          ` : `
            <button class="btn btn-secondary btn-sm" onclick="startResumeEdit()">✏️ Edit</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('resumeRewriteOpen',!state.ui.resumeRewriteOpen)">🔄 Rewrite Section</button>
            <button class="btn btn-secondary btn-sm" onclick="copyResumeToClipboard()">📋 Copy Text</button>
            <button class="btn btn-secondary btn-sm" onclick="exportResumeToWord()">📥 Download .docx</button>
            <button class="btn btn-primary btn-sm" onclick="printResume()">🖨 Print / Save PDF</button>
            ${state.ui.resumeJob ? `<button class="btn btn-secondary btn-sm" onclick="saveCurrentResumeVersion()" style="background:var(--green-light);border-color:#c8e6cd;color:var(--green)">💾 Save Version</button>` : ""}
          `}
        </div>
      </div>
      ${state.ui.resumeEditing ? `
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:2px;padding:8px 12px;font-size:12px;color:#92400e;margin-bottom:10px">
          ✏️ <strong>Editing mode</strong> — click anywhere in the resume to make changes. Hit <strong>Done Editing</strong> when finished.
        </div>
      ` : state.ui.resumeRewriteOpen ? `
        <div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:14px;margin-bottom:14px">
          <div style="font-weight:700;color:var(--green);font-size:12px;margin-bottom:10px;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.06em;text-transform:uppercase">🔄 Rewrite a Section</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div class="field">
              <label class="field-label">Which section?</label>
              <select id="rewrite-section" style="font-size:13px">
                <option value="">Select a section...</option>
                <option value="PROFESSIONAL SUMMARY">Professional Summary</option>
                <option value="CORE COMPETENCIES">Core Competencies</option>
                ${(result.resume.match(/=== ([^=]+) ===/g)||[])
                  .map(s=>s.replace(/===/g,'').trim())
                  .filter(s=>s!=='PROFESSIONAL SUMMARY'&&s!=='CORE COMPETENCIES'&&s!=='EDUCATION'&&s!=='CERTIFICATIONS')
                  .map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}
                <option value="EDUCATION">Education</option>
                <option value="CERTIFICATIONS">Certifications</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Instructions (optional)</label>
              <input id="rewrite-instruction" placeholder="e.g. make it more concise, emphasize leadership..." style="font-size:13px">
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-primary btn-sm" onclick="rewriteSection()" style="background:var(--green)">
              ${state.ui.rewriteBusy?'<div class="spinner"></div> Rewriting...':'🔄 Rewrite It'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="toggleUI('resumeRewriteOpen',false)">Cancel</button>
            ${state.ui.rewriteError?`<span style="font-size:12px;color:#dc2626">${esc(state.ui.rewriteError)}</span>`:''}
          </div>
        </div>
      ` : `
        <p style="font-size:12px;color:var(--muted);margin:0 0 12px">Print / Save PDF → choose <strong>Save as PDF</strong> in the print dialog · Or click <strong>Edit</strong> to make changes first</p>
      `}
      <div class="resume-preview" id="resume-text-output"
        contenteditable="${state.ui.resumeEditing ? 'true' : 'false'}"
        style="font-family:${fmt==='federal'?'Georgia,serif':'Arial,sans-serif'};${fmt==='executive'?'border-left:4px solid #1a3a6b;padding-left:16px':''};${state.ui.resumeEditing?'outline:2px solid var(--accent);border-radius:2px;padding:12px;min-height:200px;':''}"
        data-resume-content="${esc(result.resume)}">
        ${state.ui.resumeEditing ? '' : esc(result.resume)}
      </div>
    </div>

    ${result.bio ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">🙋 Professional Bio</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">Use on LinkedIn "About" section, email intros, or anywhere you need a quick summary.</p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="copyBioToClipboard()">📋 Copy for LinkedIn</button>
          <button class="btn btn-primary btn-sm" onclick="downloadBio()">📥 Download .docx</button>
        </div>
      </div>
      <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:8px 12px;font-size:12px;color:var(--accent);margin-bottom:10px">
        💡 <strong>LinkedIn tip:</strong> Paste this into your LinkedIn "About" section. Then add 3–5 bullet points listing your key skills and clearance level.
      </div>
      <div class="resume-preview" id="bio-text">${esc(result.bio)}</div>
    </div>` : ''}

    ${result.coverLetter ? `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 style="margin:0">✉️ Cover Letter</h2>
        <button class="btn btn-primary btn-sm" onclick="downloadCover()">📥 Download .docx</button>
      </div>
      <div class="resume-preview" id="cover-text">${esc(result.coverLetter)}</div>
    </div>` : ''}`;
}

// ── Print / PDF — three distinct visual layouts ───────────────────────
function printResume() {
  const text = state.ui.resumeResult?.resume || document.getElementById('resume-text-output')?.innerText || '';
  const fmt = state.ui.resumeFmt || 'professional';
  const name = state.profile.fullName || 'Resume';
  const w = window.open('', '_blank');

  // Parse resume text into structured sections
  const lines = text.split('\n');
  const contactLines = [];
  const sections = [];
  let currentSection = null;
  let inContact = true;

  for (const line of lines) {
    const sectionMatch = line.match(/^={2,}\s*(.+?)\s*={2,}$/);
    if (sectionMatch) {
      inContact = false;
      if (currentSection) sections.push(currentSection);
      currentSection = { title: sectionMatch[1].trim(), lines: [] };
    } else if (inContact && line.trim()) {
      contactLines.push(line.trim());
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }
  if (currentSection) sections.push(currentSection);

  const contactName = contactLines[0] || name;
  const contactRest = contactLines.slice(1).join(' · ');

  // Convert section lines to HTML bullets/paragraphs
  const sectionToHtml = (lines, fmt) => {
    return lines.map(l => {
      const trimmed = l.trim();
      if (!trimmed) return '';
      // Role header: **Title** | Org | Location | Years
      if (trimmed.startsWith('**') && trimmed.includes('|')) {
        const parts = trimmed.replace(/\*\*/g, '').split('|').map(p => p.trim());
        return `<div class="role-header"><span class="role-title">${parts[0]}</span>${parts.slice(1).map(p=>`<span class="role-meta">${p}</span>`).join('')}</div>`;
      }
      // Bullet point
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('·')) {
        return `<div class="bullet">${trimmed.replace(/^[•\-·]\s*/,'')}</div>`;
      }
      // Regular line
      return `<p class="prose">${trimmed}</p>`;
    }).filter(Boolean).join('');
  };

  const sectionsHtml = sections.map(s => `
    <div class="section">
      <div class="section-title">${s.title}</div>
      <div class="section-body">${sectionToHtml(s.lines, fmt)}</div>
    </div>`).join('');

  // ── PROFESSIONAL: Clean Arial, navy section rules, corporate ──
  const professionalStyles = `
    @page { margin: 0.7in; size: letter; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; line-height: 1.5; margin: 0; }
    .contact-name { font-size: 18pt; font-weight: 700; color: #1a3a6b; letter-spacing: 0.02em; margin-bottom: 3pt; }
    .contact-rest { font-size: 9.5pt; color: #444; margin-bottom: 14pt; }
    .section { margin-bottom: 12pt; }
    .section-title { font-size: 10pt; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1.5pt solid #1a3a6b; padding-bottom: 2pt; margin-bottom: 6pt; }
    .role-header { margin: 6pt 0 3pt; }
    .role-title { font-weight: 700; font-size: 10.5pt; }
    .role-meta { font-size: 9.5pt; color: #444; margin-left: 6pt; }
    .role-meta::before { content: "· "; color: #b8860b; }
    .bullet { padding-left: 12pt; text-indent: -12pt; margin: 2pt 0; font-size: 10pt; }
    .bullet::before { content: "▪ "; color: #1a3a6b; }
    .prose { margin: 3pt 0; font-size: 10pt; }
    @media print { body { margin: 0; } }`;

  // ── FEDERAL: Georgia serif, zero color, GS/defense conservative ──
  const federalStyles = `
    @page { margin: 1in; size: letter; }
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; color: #000; line-height: 1.6; margin: 0; }
    .contact-name { font-size: 14pt; font-weight: 700; text-align: center; margin-bottom: 2pt; text-transform: uppercase; letter-spacing: 0.05em; }
    .contact-rest { font-size: 10pt; color: #000; text-align: center; margin-bottom: 14pt; }
    .section { margin-bottom: 12pt; }
    .section-title { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1pt solid #000; border-top: 1pt solid #000; padding: 2pt 0; margin-bottom: 6pt; text-align: center; }
    .role-header { margin: 6pt 0 3pt; }
    .role-title { font-weight: 700; font-size: 11pt; }
    .role-meta { font-size: 10pt; color: #222; margin-left: 6pt; }
    .role-meta::before { content: " | "; }
    .bullet { padding-left: 14pt; text-indent: -14pt; margin: 3pt 0; font-size: 10.5pt; }
    .bullet::before { content: "• "; }
    .prose { margin: 3pt 0; font-size: 10.5pt; }
    @media print { body { margin: 0; } }`;

  // ── EXECUTIVE: Two-column header, navy left bar, gold accent rule ──
  const executiveStyles = `
    @page { margin: 0; size: letter; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #111; line-height: 1.5; margin: 0; padding: 0; }
    .header-block { background: #1a3a6b; color: white; padding: 28pt 36pt 20pt; display: flex; justify-content: space-between; align-items: flex-end; }
    .contact-name { font-size: 22pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: white; margin: 0 0 4pt; }
    .header-gold-rule { height: 2pt; background: #b8860b; margin: 0 0 8pt; }
    .contact-rest { font-size: 9pt; color: #c8d4e8; letter-spacing: 0.02em; }
    .body-content { padding: 20pt 36pt; }
    .section { margin-bottom: 12pt; }
    .section-title { font-size: 9pt; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.12em; border-bottom: 2pt solid #b8860b; padding-bottom: 2pt; margin-bottom: 6pt; }
    .role-header { margin: 6pt 0 3pt; display: flex; flex-wrap: wrap; gap: 4pt; }
    .role-title { font-weight: 700; font-size: 10.5pt; color: #1a3a6b; }
    .role-meta { font-size: 9.5pt; color: #555; }
    .role-meta::before { content: "· "; color: #b8860b; font-weight: 700; }
    .bullet { padding-left: 12pt; text-indent: -12pt; margin: 2pt 0; font-size: 9.5pt; color: #222; }
    .bullet::before { content: "▸ "; color: #b8860b; font-weight: 700; }
    .prose { margin: 3pt 0; font-size: 10pt; }
    @media print { body { margin: 0; } }`;

  const styles = fmt === 'federal' ? federalStyles : fmt === 'executive' ? executiveStyles : professionalStyles;

  const headerHtml = fmt === 'executive' ? `
    <div class="header-block">
      <div>
        <div class="contact-name">${contactName.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>
        <div class="header-gold-rule"></div>
        <div class="contact-rest">${contactRest.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>
      </div>
    </div>
    <div class="body-content">` : `
    <div class="contact-name">${contactName.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>
    <div class="contact-rest">${contactRest.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>`;

  const bodyClose = fmt === 'executive' ? '</div>' : '';

  const atsWarning = fmt === 'executive' ? `
    <div style="background:#fff3e0;border:1pt solid #ff9800;padding:6pt 10pt;margin-bottom:14pt;font-size:8.5pt;color:#e65100;font-weight:bold">
      ⚠ VISUAL FORMAT: This resume is optimized for human readers, not automated ATS screening systems. Use for networking, referrals, and direct applications only.
    </div>` : '';

  w.document.write(`<!DOCTYPE html>
<html><head>
<title>${contactName} — Resume</title>
<style>${styles}</style>
</head><body>
${headerHtml}
${atsWarning}
${sectionsHtml}
${bodyClose}
</body></html>`);

  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
}

// ── Section rewriter ─────────────────────────────────────────────────
async function rewriteSection() {
  const sectionName = document.getElementById('rewrite-section')?.value;
  const instruction = document.getElementById('rewrite-instruction')?.value?.trim() || '';
  if (!sectionName) { showToast('Please select a section', false); return; }

  const resume = state.ui.resumeResult?.resume || '';
  if (!resume) { showToast('No resume found', false); return; }

  const sectionRegex = new RegExp(`(=== ${sectionName} ===)([\\s\\S]*?)(?====|$)`, 'i');
  const match = resume.match(sectionRegex);
  const plainRegex = new RegExp(`(^${sectionName}$)([\\s\\S]*?)(?=^[A-Z ]{4,}$|$)`, 'im');
  const plainMatch = !match ? resume.match(plainRegex) : null;
  const sectionContent = match ? match[0] : plainMatch ? plainMatch[0] : '';

  if (!sectionContent) {
    setState({ ui: { ...state.ui, rewriteError: `Could not find "${sectionName}" section in your resume` } });
    return;
  }

  setState({ ui: { ...state.ui, rewriteBusy: true, rewriteError: '' } });

  try {
    const job = state.jobs?.find(j => j.id === state.ui.resumeJob);
    const jobContext = job ? `Target job: ${job.title} at ${job.company}. Job description: ${job.description || 'not provided'}.` : '';

    const prompt = `You are rewriting ONE section of a veteran's resume.

FULL RESUME FOR CONTEXT:
${resume}

SECTION TO REWRITE: === ${sectionName} ===
${sectionContent}

${jobContext}
${instruction ? `SPECIFIC INSTRUCTION: ${instruction}` : ''}

RULES:
- Rewrite ONLY the "${sectionName}" section
- Keep the exact same === ${sectionName} === header format
- Match the style and tone of the rest of the resume
- Keep bullets under 15 words with at least one metric each
- Return ONLY the rewritten section, nothing else, no commentary`;

    const rewritten = await callClaude(
      'You are an expert resume writer specializing in military-to-civilian transitions. Return only the rewritten section, no preamble.',
      prompt,
      'resume'
    );

    let newResume;
    if (match) {
      newResume = resume.replace(sectionRegex, rewritten.trim());
    } else if (plainMatch) {
      newResume = resume.replace(plainRegex, rewritten.trim());
    } else {
      newResume = resume + '\n\n' + rewritten.trim();
    }

    setState({ ui: {
      ...state.ui,
      rewriteBusy: false,
      resumeRewriteOpen: false,
      rewriteError: '',
      resumeResult: { ...state.ui.resumeResult, resume: newResume }
    }});
    showToast(`✅ ${sectionName} rewritten successfully`);

  } catch(err) {
    setState({ ui: { ...state.ui, rewriteBusy: false, rewriteError: 'Error: ' + err.message } });
  }
}

// ── Inline resume editor ──────────────────────────────────────────────
function startResumeEdit() {
  const resumeText = state.ui.resumeResult?.resume || '';
  setState({ ui: { ...state.ui, resumeEditing: true, resumeEditOriginal: resumeText } });
  setTimeout(() => {
    const el = document.getElementById('resume-text-output');
    if (el) {
      el.innerText = resumeText;
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 50);
}

function saveResumeEdit() {
  const el = document.getElementById('resume-text-output');
  if (!el) return;
  const edited = el.innerText || el.textContent || '';
  if (edited.trim().length < 50) { showToast('Resume seems too short — check your edits', false); return; }
  setState({ ui: {
    ...state.ui,
    resumeEditing: false,
    resumeEditOriginal: null,
    resumeResult: { ...state.ui.resumeResult, resume: edited }
  }});
  showToast('✅ Changes saved — ready to download');
}

function cancelResumeEdit() {
  const original = state.ui.resumeEditOriginal;
  setState({ ui: {
    ...state.ui,
    resumeEditing: false,
    resumeEditOriginal: null,
    resumeResult: original ? { ...state.ui.resumeResult, resume: original } : state.ui.resumeResult
  }});
}


async function generateResume() {
  const selJob = state.ui.resumeJob;
  if (!selJob) { alert('Select a job first'); return; }
  if (!state.profile?.fullName) { alert('Complete your profile first (add your name in Profile)'); return; }
  const job = state.jobs.find(j=>j.id===selJob);

  const instrEl = document.getElementById('resume-instructions');
  if (instrEl) toggleUI('resumeInstructions', instrEl.value);

  const setStatus = (s) => setState({ ui:{...state.ui, resumeBusy:true, resumeStatus:s, resumeError:'', resumeResult:null} });
  const context = buildResumeContext(job);

  try {
    setStatus('✍️ Writing tailored resume...');
    const p = { ...state.profile };
    ['fullName','email','phone','location','linkedin'].forEach(f => {
      const el = document.getElementById('p-'+f); if(el && el.value) p[f] = el.value;
    });

    const normalizeVetName = (raw) => {
      if (!raw) return '[Name]';
      const commaMatch = raw.match(/^([^,]+),\s*(.+)$/);
      if (commaMatch) {
        const last = commaMatch[1].trim();
        const rest = commaMatch[2].trim().split(/\s+/);
        const first = rest[0];
        const name = `${first} ${last}`;
        return name.replace(/\b\w/g, c => c.toUpperCase()).replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      }
      if (raw === raw.toUpperCase()) {
        return raw.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      }
      return raw;
    };
    const displayName = normalizeVetName(p.fullName);

    const contactBlock = [
      displayName,
      [p.phone, p.email].filter(Boolean).join(' | '),
      p.linkedin ? p.linkedin.replace(/^https?:\/\//,'') : '',
      p.location || ''
    ].filter(Boolean).join('\n');

    const userInstructions = state.ui.resumeInstructions?.trim() || '';
    const resumeTone = state.ui.resumeTone || 'startup';
    const toneLabel = resumeTone === 'prime' ? 'Prime Contractor / Government' : 'Startup / Growth Company';
    const wantNoAwards = /no.*(award|medal|decoration|recognition)/i.test(userInstructions || '');

    const resumeSystemPrompt = `You are an expert military-to-civilian resume translator. A civilian hiring manager reads this resume — they have zero military context. Your job is translating every military title, unit, and term into the corporate equivalent a Fortune 500 recruiter would immediately recognize. Secondary job: keep it to 2 pages.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE SETTING — APPLY THIS TO EVERY WORD CHOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target Company Type: ${toneLabel}

${resumeTone === 'startup' ? `STARTUP / GROWTH TONE:
- Emphasize building from scratch, wearing many hats, doing more with less
- Use words like: built, launched, pioneered, scaled, drove, created, shipped
- Show bias for action, speed, and impact over process and compliance
- Highlight versatility — times you operated outside your lane
- Frame leadership as influence and outcomes, not authority and rank
- The reader is a founder, VP, or team lead who values resourcefulness` : `PRIME CONTRACTOR / GOVERNMENT TONE:
- Emphasize process rigor, compliance, structured execution, and program management
- Use words like: directed, managed, executed, coordinated, ensured, delivered, maintained
- Show discipline in scope, schedule, and cost management
- Highlight certifications, clearances, and regulatory experience prominently
- Frame leadership as authority, accountability, and organizational structure
- The reader is a program manager, contracts officer, or senior director who values dependability`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #1 — RANK-TO-TITLE MAPPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use the ROLE the person held (not just their rank) to determine the civilian title.
Always consider what level of organization they led and what their function was.

COMMAND ROLES (the person ran the organization):
  Flight/Company Commander     → Program Manager
  Squadron/Battalion Commander → Division Manager
  Group/Brigade Commander      → COO
  Deputy Group/Brigade Cmdr    → VP (Vice President)
  Wing/Division Commander      → CEO
  Above Wing                   → President / Senior Executive

DEPUTY / SECOND-IN-COMMAND ROLES:
  Director of Operations (DO) at Squadron/Battalion level → Deputy Division Manager
  Executive Officer (XO) at Squadron/Battalion level      → Chief of Staff
  Executive Officer (XO) at Group/Brigade level           → Senior Operations Manager

STAFF / FUNCTIONAL ROLES (translate by function):
  Chief of Stan/Eval              → Senior Quality Assurance Manager
  Operations Officer (Navy)       → Senior Operations Manager
  Chief Enlisted Manager / Command Chief → Senior Operations Manager & Administrator
  Flight Commander                → Program Manager
  Intelligence Officer (S2/J2)   → Intelligence Director / Senior Intelligence Analyst
  Logistics Officer (S4/J4)      → Director of Logistics / Supply Chain Manager
  Personnel Officer (S1/J1)      → HR Director
  Plans Officer / Planner        → Strategic Planning Manager
  Communications Officer (S6/J6) → IT Director / Technology Manager
  Finance Officer (S8/J8)        → CFO / Finance Director
  Surgeon / Medical Officer       → Medical Director
  JAG Officer                    → General Counsel
  PAO / Public Affairs Officer   → Communications Director / PR Manager

INSTRUCTOR / ADVISOR ROLES:
  Weapons Instructor              → Senior Tactics Instructor & Advisor
  Instructor Pilot / IP           → Senior Flight Instructor
  Technical Advisor               → Senior Technical Advisor / Subject Matter Expert

CELL / SHOP / BRANCH CHIEFS (translate the function, drop the military label):
  "Chief, [Any] Plans Cell"       → "Director, [Function] Planning"
  "Chief, Current Operations"     → "Director of Operations"
  "Chief, [Any] Division"         → "Division Director"
  "NCOIC / OIC of [shop]"         → "Manager, [function]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #2 — UNIT SIZE = ORG SIZE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Flight / Company (~20-100 people)       = Team
  Squadron / Battalion (~200-600 people)  = Division
  Group / Brigade (~1,000-4,000 people)   = Vertical (business vertical)
  Wing / Division (~5,000-15,000 people)  = Company
  Corps / MAJCOM and above                = Enterprise / Corporation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #3 — ORGANIZATION NAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Strip ALL unit numbers. Keep branch + functional description only.
Rule: Civilians care about BRANCH and FUNCTION. Never show unit numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #4 — BULLET POINT LANGUAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY JARGON → CIVILIAN DICTIONARY (translate every occurrence):
- "sorties" → "missions" or "flight operations"
- "air tasking order / ATO" → "operational planning cycle"
- "joint fires" → "coordinated joint operations"
- "combat crews" → "flight crews"
- "graduated [N] students" → "certified [N] professionals"
- "training events" → "training programs"
- "major commands / MAJCOM" → "major commands" or "enterprise commands"
- "ISR" → "intelligence, surveillance & reconnaissance"
- "OPORD / CONOP / TASKORD" → "operational plan"
- "FOB / AOR / FARP" → omit or use "operational theater"
- "OIC / NCOIC" → "program director" or "department manager"
- "NCO / SNCO / E-7 through E-9" → "senior manager" or "team lead"
- "Task Force" → "cross-functional team"
- "expeditionary" → "deployed" or "forward-deployed"
- "clearance / TS/SCI" → keep as-is (valued in civilian market)
- "AOC / Air Operations Center" → keep as-is
- "C2 / command and control" → keep "C2" as acronym

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSLATION RULE #5 — SUMMARY & COMPETENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: Lead with the civilian VALUE PROPOSITION, not rank or branch.
Competencies: Use business language. No military program names.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY: "WHAT SETS ME APART" SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every resume MUST include a "What Sets Me Apart" section.
- 3-4 sentences maximum. Narrative prose, NOT bullets.
- Must reference something specific to THIS company or THIS role.
- Must name at least one concrete differentiator (clearance, rare experience, specific skill combination).
- NEVER use: "passionate", "results-driven", "team player", "hard worker".
- This section appears AFTER Core Competencies, BEFORE Professional Experience.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TWO-PAGE RULES (absolute)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Max 20 bullets total. Count them.
- Max 15 words per bullet.
- Summary: 2-3 sentences.
- Core Competencies: one comma-separated line.
- NO awards or medals section.
- Combine or omit roles pre-2010.
- Return ONLY the resume. No preamble or commentary.

USER INSTRUCTIONS (follow exactly): ${userInstructions || 'None'}

FINAL CHECK: Every bullet has a strong opening verb and one metric. Zero unexplained military acronyms.`;

    const identityFrame = state.profile.identityFrame?.trim() || '';

    const resumeUserPrompt = `Write a tailored 2-page resume for this veteran.

${context}
${identityFrame ? `VETERAN IDENTITY FRAME — anchor the summary and differentiator to this: ${identityFrame}` : ''}

TONE: ${toneLabel} — apply this to every word choice.

START with this contact block verbatim:
${contactBlock}

SECTIONS — use EXACTLY === SECTION NAME === format for all headers, no dashes:

=== PROFESSIONAL SUMMARY ===
2-3 sentences. Lead with civilian value proposition. NOT rank or branch opener.

=== CORE COMPETENCIES ===
Single comma-separated line. Business language only.

=== WHAT SETS ME APART ===
3-4 sentences of narrative prose — NO bullets. Make a hiring manager stop scrolling.
MANDATORY — do not skip this section.

=== PROFESSIONAL EXPERIENCE ===
Per role: **Title** | Org | Location | Years
Then max 3 bullets, each under 15 words with one metric.

=== EDUCATION ===
=== CERTIFICATIONS ===

FINAL CHECK: Count your bullets. If more than 20, delete the weakest ones.`;

    const resume = await callClaude(resumeSystemPrompt, resumeUserPrompt);

    const bulletCount = (resume.match(/^[•\-·]/gm) || []).length;
    let finalResume = resume;
    if (bulletCount > 25) {
      setStatus('✂️ Trimming to 2 pages...');
      finalResume = await callClaude(
        'You are a resume editor. Your only job is to trim this resume to fit on 2 pages. Keep the same === section structure and contact block. Cut bullets ruthlessly — 3 per role max, 15 words per bullet max. Do NOT add anything. Return ONLY the trimmed resume, no commentary.',
        `Trim this resume to 2 pages (max 22 bullets total). Remove older roles if needed. Keep most recent 10 years. Return ONLY the resume:\n\n${resume}`
      );
    }
    const resumeToUse = finalResume;

    setStatus('✉️ Writing cover letter...');
    const coverLetter = await callClaude(
      `You are a career coach who writes cover letters that actually get read. Three-section structure, every time. Confident, specific, human. No clichés.

COVER LETTER DOCTRINE — THREE SECTIONS:

SECTION 1 — WHY THIS ROLE:
Show you understand what this company is actually trying to accomplish.
Lead with your biggest relevant strength in sentence 1. Never open with "I am applying for..."
1 paragraph, 3-4 sentences.

SECTION 2 — WHY ME:
Three concrete differentiators — specific, numbered, verifiable.
1-2 paragraphs.

SECTION 3 — WHY THIS COMPANY:
Reference something specific about the company. Close with confidence.
1 paragraph.

TONE: ${toneLabel}

HARD RULES:
- Never use: "passionate", "I believe I would be a great fit", "Please find attached", "Thank you for your consideration", "results-driven", "team player"
- Under 400 words total
- Plain text paragraphs only`,

      `Write a tailored cover letter using the WHY THIS ROLE / WHY ME / WHY THIS COMPANY framework.

Return it in this EXACT format:

[TODAY'S DATE]

Hiring Manager
${job?.company || 'Hiring Team'}
${job?.location || ''}

Re: ${job?.title || 'Open Position'}

[SECTION 1 — WHY THIS ROLE]

[SECTION 2 — WHY ME]

[SECTION 3 — WHY THIS COMPANY]

Sincerely,

${displayName}
${p.phone || ''}
${p.email || ''}
${p.linkedin ? p.linkedin.replace(/^https?:\/\//, '') : ''}

---

VETERAN BACKGROUND:
${context}
${identityFrame ? 'IDENTITY FRAME: ' + identityFrame : ''}

Output the complete letter exactly as formatted above. Use today's date. No commentary.`
    );

    setStatus('🔍 Analyzing fit & transferable skills...');
    const atsRaw = await callClaude(
      `You are a senior hiring manager and veteran career specialist who deeply understands military-to-civilian transitions. You evaluate resumes with full awareness that military experience translates powerfully to civilian roles — even when the exact civilian keywords aren't present.

CRITICAL SCORING PHILOSOPHY:
- Score based on DEMONSTRATED CAPABILITY, not keyword matching alone
- Security clearances are a SIGNIFICANT positive differentiator — always call this out
- Do NOT penalize for lack of corporate buzzwords if the underlying competency is clearly demonstrated
- NEVER score a veteran below 55 purely because of keyword gaps`,

      `You are evaluating a MILITARY VETERAN's resume for a civilian job. Score generously for transferable skills, not just keyword matches.

RESUME:
${resume}

TARGET JOB: ${job.title} at ${job.company}
Job Notes/Requirements: ${job.notes || 'Not provided'}

VETERAN BACKGROUND:
Branch: ${state.profile.branch||'N/A'} | Rank: ${state.profile.rank||'N/A'} | Years: ${state.profile.yearsOfService||'N/A'}
Clearance: ${state.profile.clearance||'None'} (${state.profile.clearanceStatus||'N/A'})

Return ONLY this JSON (no markdown, no extra text):
{
  "score": <0-100>,
  "grade": "A/B/C/D/F",
  "summary": "One plain-English sentence on overall fit",
  "transferable_strengths": ["3-5 specific military-to-civilian translations"],
  "strengths": ["3-4 resume strengths as written"],
  "gaps": ["2-4 genuine gaps or areas to strengthen"],
  "keywords_missing": ["5-8 keywords from the job posting not in the resume"],
  "keywords_found": ["5-8 important keywords present"],
  "clearance_value": "Brief note on clearance value for this role, or empty string",
  "coaching_tip": "One specific, actionable tip to improve this application"
}`
    );

    let ats = { score:75, grade:'B', summary:'Good transferable match.', transferable_strengths:[], strengths:[], gaps:[], keywords_missing:[], keywords_found:[], clearance_value:'', coaching_tip:'' };
    try { ats = JSON.parse(atsRaw.replace(/```json|```/g,'').trim()); } catch(e) {}

    if (typeof trackAction==='function') trackAction('resume_generate');

    const jobId = state.ui.resumeJob;
    if (jobId) {
      const version = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        label: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}),
        resume: resumeToUse,
        coverLetter,
        ats,
        fmt: state.ui.resumeFmt || 'professional'
      };
      const updatedJobs = state.jobs.map(j => j.id === jobId
        ? { ...j, resumeVersions: [...(j.resumeVersions||[]), version] }
        : j
      );
      setState({ jobs: updatedJobs, ui:{...state.ui, resumeBusy:false, resumeStatus:'', resumeResult:{resume:resumeToUse,coverLetter,ats}, resumeModal:true} });
    } else {
      setState({ ui:{...state.ui, resumeBusy:false, resumeStatus:'', resumeResult:{resume:resumeToUse,coverLetter,ats}, resumeModal:true} });
    }
  } catch(err) {
    setState({ ui:{...state.ui, resumeBusy:false, resumeStatus:'', resumeError:'Error: '+err.message+'.'} });
  }
}

async function generateGenericResume() {
  if (!state.profile?.fullName) { alert('Complete your profile first (at least your name and branch)'); return; }
  
  const focus = document.getElementById('generic-focus')?.value?.trim() || '';
  toggleUI('genericFocus', focus);

  const setStatus = (s) => setState({ ui:{...state.ui, resumeBusy:true, resumeStatus:s, resumeError:'', resumeResult:null} });

  const p = state.profile;
  const exp = [...state.assignments.map(a => {
    let t = `MILITARY: ${a.dutyTitle}${a.rank?' ('+a.rank+')':''} | ${a.unit||''} | ${a.base||''} | ${a.startDate||'?'}-${a.endDate||'Present'}\nAccomplishments:\n${a.accomplishments||'None'}`;
    if ((a.roles||[]).length>0) { t += '\nAdditional roles: ' + a.roles.map(r=>`${r.title}${r.rank?' ('+r.rank+')':''}${r.accomplishments?': '+r.accomplishments.slice(0,100):''}`).join(' | '); }
    return t;
  }), ...state.civilianJobs.map(j=>`CIVILIAN: ${j.title} at ${j.company} | ${j.startDate||'?'}-${j.endDate||'Present'}\nAccomplishments:\n${j.accomplishments||'None'}`)].join('\n---\n');
  const awards = state.awards.map(a=>`${a.name}${a.civilianTranslation?' — '+a.civilianTranslation:''}`).join('\n');

  const context = `VETERAN PROFILE:
Name: ${p.fullName} | Phone: ${p.phone||'N/A'} | Email: ${p.email||'N/A'} | LinkedIn: ${p.linkedin||'N/A'} | Location: ${p.location||'N/A'}
Branch: ${p.branch} | Rank: ${p.rank} | Years of Service: ${p.yearsOfService}
MOS/Rate: ${p.mosRate||'N/A'} | Security Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Work Preference: ${p.workPreference||'N/A'} | Willing to Relocate: ${p.willingToRelocate||'N/A'}
Technical Skills: ${(p.technicalSkills||[]).join(', ')||'None'}
Leadership/Soft Skills: ${(p.softSkills||[]).join(', ')||'None'}
Education: ${p.education||'N/A'}
Certifications: ${p.certifications||'N/A'}
Training & Methodologies: ${p.training||'N/A'}
Professional Summary: ${p.elevatorPitch||'Not written'}
Target Industries: ${(p.targetIndustries||[]).map(i=>typeof i==='object'?(i.subType?i.name+' ('+i.subType+')':i.name):i).join(', ')||'Not specified'}

EXPERIENCE:
${exp||'None'}

AWARDS & DECORATIONS:
${awards||'None'}

${focus?`FOCUS AREAS REQUESTED BY VETERAN: ${focus}`:'NO SPECIFIC FOCUS — write a broad, versatile general resume'}`;

  const systemPrompt = `You are a former military officer turned senior resume writer. You've written hundreds of resumes for veterans and you know exactly what makes hiring managers stop scrolling. Your resumes sound like a real person wrote them — not a bot, not a template, not an HR form.

FORBIDDEN WORDS AND PHRASES (never use any of these):
"results-driven" / "results-oriented" / "proven track record" / "dynamic" / "synergistic" / "leveraged" / "passionate about" / "detail-oriented" / "hard-working" / "go-getter" / "strategic thinker" / "thought leader" / "innovative" / "spearheaded" / "orchestrated" / "facilitated" / "championed" / "executed" (use "ran"/"delivered") / "stakeholders" (use "partners"/"decision-makers") / "deliverables" (use "results"/"outputs") / "utilize" (use "use") / "impactful" / "value-add" / "bandwidth" / "robust" / "scalable" / "mission-critical" / "best practices"

BULLET POINTS: Every one needs a number. Vary length and structure. Use at least 6 different opening verbs. Translate ALL military jargon.
PROFESSIONAL SUMMARY: First person. Start with accomplishment or context, not "I am a...". 2-3 sentences max.
CONTACT BLOCK: Copy verbatim — do not add, remove, or reformat anything.
OUTPUT: Resume content only — no preamble, no "Here is your resume:", no commentary.`;

  try {
    setStatus('✍️ Writing your general resume...');
    ['fullName','email','phone','location','linkedin'].forEach(f => {
      const el = document.getElementById('p-'+f); if(el && el.value) p[f] = el.value;
    });
    const normalizeVetName = (raw) => {
      if (!raw) return '[Name]';
      const commaMatch = raw.match(/^([^,]+),\s*(.+)$/);
      if (commaMatch) {
        const last = commaMatch[1].trim();
        const rest = commaMatch[2].trim().split(/\s+/);
        const first = rest[0];
        const name = `${first} ${last}`;
        return name.replace(/\b\w/g, c => c.toUpperCase()).replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      }
      if (raw === raw.toUpperCase()) {
        return raw.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      }
      return raw;
    };
    const displayName = normalizeVetName(p.fullName);

    const contactBlock = [
      displayName,
      [p.phone, p.email].filter(Boolean).join(' | '),
      p.linkedin ? p.linkedin.replace(/^https?:\/\//,'') : '',
      p.location || ''
    ].filter(Boolean).join('\n');

    const resume = await callClaude(
      systemPrompt,
      `Write a strong, versatile general-purpose resume for this veteran.

${context}

Use this EXACT contact block at the very top:
${contactBlock}

SECTIONS — use EXACTLY this format: === SECTION NAME ===

1. === PROFESSIONAL SUMMARY === (2 sentences MAX)
2. === CORE COMPETENCIES === (single comma-separated line, 14-18 skills)
3. === PROFESSIONAL EXPERIENCE === (reverse chronological)
4. NO awards section.
5. === EDUCATION ===
6. === CERTIFICATIONS ===

EXPERIENCE FORMAT per role:
**Job Title** | Organization | Location | Start–End Year
• Bullet (max 15 words)
• Bullet (max 15 words)
• Bullet (max 15 words — 3 bullets max per role)

TWO-PAGE HARD LIMIT: 18–22 bullets total. Prioritize last 10–12 years. Omit any role before 2005 unless exceptional.`
    );

    setStatus('🙋 Writing your professional bio...');
    const bio = await callClaude(
      'You write crisp, confident professional bios for veterans transitioning to civilian careers. Bios should sound human, specific, and compelling — like a LinkedIn "About" section written by someone who knows their own value.',
      `Write a 3-paragraph professional bio for this veteran.

${context}

Paragraph 1 (3-4 sentences): Who they are, years of service, branch, and their career-defining achievement.
Paragraph 2 (3-4 sentences): Skills and experiences that make them uniquely valuable to civilian employers.
Paragraph 3 (2-3 sentences): What they're looking for next and what they bring to the table.

Rules:
- First person ("I" voice)
- No military jargon
- No clichés
- Plain text paragraphs only`
    );

    setState({ ui:{...state.ui, resumeBusy:false, resumeStatus:'', resumeResult:{resume, bio, isGeneric:true}, resumeModal:true} });
  } catch(err) {
    setState({ ui:{...state.ui, resumeBusy:false, resumeStatus:'', resumeError:'Error: '+err.message+'.'} });
  }
}

async function downloadBio() {
  const text = state.ui.resumeResult?.bio || document.getElementById('bio-text')?.innerText || '';
  if (!text) { showToast('No bio to download', false); return; }
  showToast('Building document...', true);
  try {
    await loadJSZip();
    const name = (state.profile?.fullName || 'Bio').replace(/\s+/g, '_');
    const blob = await buildLetterDocx(text, 'Professional Bio');
    saveAs(blob, `Professional_Bio_${name}.docx`);
    showToast('✓ Bio downloaded as Word document');
  } catch(err) {
    showToast('Export failed — try copying the text instead', false);
  }
}

function buildResumeContext(job) {
  const p = state.profile;
  const cap = (t, max) => !t ? '' : t.length > max ? t.slice(0, max) + '...' : t;

  const assignmentText = state.assignments.map(a => {
    let text = `MILITARY: ${a.dutyTitle}${a.rank?' ('+a.rank+')':''} | ${a.unit||''} | ${a.startDate||'?'}-${a.endDate||'Present'}`;
    if (a.accomplishments) text += `\n${cap(a.accomplishments, 500)}`;
    if ((a.roles||[]).length > 0) {
      a.roles.slice(0,2).forEach(r => {
        text += `\n  Role: ${r.title}`;
        if (r.accomplishments) text += ` — ${cap(r.accomplishments, 150)}`;
      });
    }
    return text;
  }).join('\n---\n');

  const civText = state.civilianJobs.map(j =>
    `CIVILIAN: ${j.title} at ${j.company} | ${j.startDate||'?'}-${j.endDate||'Present'}\n${cap(j.accomplishments, 500)}`
  ).join('\n---\n');

  const awards = state.awards.map(a => a.name).join(', ');
  const docs = state.documents.map(d=>`[${d.type}] ${d.name}:\n${(d.content||'').slice(0,300)}`).join('\n---\n');

  return `VETERAN CONTACT INFO (copy exactly into resume header):
Full Name: ${p.fullName||'[Name not set]'}
Phone: ${p.phone||'[Phone not set]'}
Email: ${p.email||'[Email not set]'}
LinkedIn: ${p.linkedin||''}
City/State: ${p.location||'[Location not set]'}

VETERAN BACKGROUND:
Branch: ${p.branch||'N/A'} | Rank: ${p.rank||'N/A'} | Years of Service: ${p.yearsOfService||'N/A'}
MOS/Rate: ${p.mosRate||'N/A'} | Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Work Preference: ${p.workPreference||'N/A'} | Willing to Relocate: ${p.willingToRelocate||'N/A'}
Technical Skills: ${(p.technicalSkills||[]).join(', ')||'None'}
Leadership/Soft Skills: ${(p.softSkills||[]).join(', ')||'None'}
Education: ${p.education||'N/A'}
Certifications: ${p.certifications||'N/A'}
Training & Methodologies: ${p.training||'N/A'}
Professional Summary: ${p.elevatorPitch||'Not written'}
Target Industries: ${(p.targetIndustries||[]).map(i=>typeof i==='object'?(i.subType?i.name+' ('+i.subType+')':i.name):i).join(', ')||'Not specified'}

EXPERIENCE:
${assignmentText||'None'}
${civText?'\n---\n'+civText:''}

AWARDS:
${awards||'None'}

PERFORMANCE DOCUMENTS:
${docs||'None'}

TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location||'N/A'}
Salary: ${job.salaryRange||'N/A'}
Job Notes / Requirements: ${job.notes||'None'}`;
}

function copyResumeToClipboard() {
  const text = state.ui.resumeResult?.resume || document.getElementById('resume-text-output')?.innerText || '';
  navigator.clipboard.writeText(text).then(() => showToast('✓ Resume copied! Paste into Word or Google Docs')).catch(()=>{
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✓ Resume copied!');
  });
}

function copyBioToClipboard() {
  const text = document.getElementById('bio-text')?.innerText || '';
  navigator.clipboard.writeText(text).then(() => showToast('✓ Bio copied — paste into LinkedIn "About" section!')).catch(()=>{
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('✓ Bio copied!');
  });
}

async function downloadCover() {
  const text = state.ui.resumeResult?.coverLetter || document.getElementById('cover-text')?.innerText || '';
  if (!text) { showToast('No cover letter to download', false); return; }
  showToast('Building document...', true);
  try {
    await loadJSZip();
    const name = (state.profile?.fullName || 'Cover_Letter').replace(/\s+/g, '_');
    const blob = await buildLetterDocx(text, 'Cover Letter', state.profile?.fullName || '');
    saveAs(blob, `Cover_Letter_${name}.docx`);
    showToast('✓ Cover letter downloaded as Word document');
  } catch(err) {
    showToast('Export failed — try copying the text instead', false);
  }
}

// ── Resume versioning ──────────────────────────────────────────────────
function loadResumeVersion(jobId, versionId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;
  const version = (job.resumeVersions||[]).find(v => v.id === versionId);
  if (!version) return;

  setState({ ui: {
    ...state.ui,
    resumeJob: jobId,
    resumeFmt: version.fmt || 'professional',
    resumeResult: { resume: version.resume, coverLetter: version.coverLetter, ats: version.ats },
    resumeModal: false,
    resumeMode: 'targeted'
  }});
  showToast(`✅ Version loaded — ${version.label}`);
}

function deleteResumeVersion(jobId, versionId) {
  if (!confirm('Delete this saved resume version?')) return;
  const updatedJobs = state.jobs.map(j => j.id === jobId
    ? { ...j, resumeVersions: (j.resumeVersions||[]).filter(v => v.id !== versionId) }
    : j
  );
  setState({ jobs: updatedJobs });
  showToast('Version deleted');
}

function saveCurrentResumeVersion() {
  const jobId = state.ui.resumeJob;
  const result = state.ui.resumeResult;
  if (!jobId || !result?.resume) { showToast('No resume to save', false); return; }
  const version = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    label: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}),
    resume: result.resume,
    coverLetter: result.coverLetter || '',
    ats: result.ats || null,
    fmt: state.ui.resumeFmt || 'professional'
  };
  const updatedJobs = state.jobs.map(j => j.id === jobId
    ? { ...j, resumeVersions: [...(j.resumeVersions||[]), version] }
    : j
  );
  setState({ jobs: updatedJobs });
  showToast(`✅ Version saved`);
}
