// ── Achievements Library (Brag Book) ──────────────────────────────────
// A structured, searchable library of career wins that feeds every AI
// tool in the app — resume builder, interview prep, cover letters.
//
// Data shape per entry:
// {
//   id, title, situation, action, result, metric, timeframe,
//   tags[], civilianTranslation, source, dateAdded
// }
// ──────────────────────────────────────────────────────────────────────

const ACHIEVEMENT_TAGS = [
  { id: 'leadership',   label: 'Leadership',        icon: '👥' },
  { id: 'budget',       label: 'Budget / Resources', icon: '💰' },
  { id: 'technical',    label: 'Technical',          icon: '⚙️' },
  { id: 'operational',  label: 'Operational',        icon: '🎯' },
  { id: 'crisis',       label: 'Crisis / Pressure',  icon: '🚨' },
  { id: 'training',     label: 'Training / Mentoring',icon: '📚' },
  { id: 'innovation',   label: 'Innovation',         icon: '💡' },
  { id: 'collaboration',label: 'Collaboration',      icon: '🤝' },
  { id: 'safety',       label: 'Safety',             icon: '🛡️' },
  { id: 'international',label: 'International / Joint',icon: '🌍' }
];

const TAG_MAP = Object.fromEntries(ACHIEVEMENT_TAGS.map(t => [t.id, t]));

// ── Main render ────────────────────────────────────────────────────────

function renderAchievements() {
  const achTab = state.ui.achTab || 'bragbook';

  const stories    = state.stories || [];
  const achCount   = (state.achievements||[]).length;
  const storyCount = stories.length;

  const tabBar = `
    <div style="display:flex;gap:0;margin-bottom:20px;border-radius:2px;overflow:hidden;border:1.5px solid var(--rule-dark);width:fit-content">
      <button onclick="toggleUI('achTab','bragbook')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${achTab==='bragbook'?'var(--accent)':'white'};color:${achTab==='bragbook'?'white':'var(--muted)'};transition:all 0.15s">
        🏆 BRAG BOOK${achCount > 0 ? ` <span style="font-size:9px;background:rgba(184,134,11,0.3);color:var(--gold);padding:2px 6px;border-radius:2px;margin-left:4px;font-family:'Familjen Grotesk',sans-serif;font-weight:700">${achCount}</span>` : ''}
      </button>
      <button onclick="toggleUI('achTab','stories')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${achTab==='stories'?'var(--accent)':'white'};color:${achTab==='stories'?'white':'var(--muted)'};transition:all 0.15s;border-left:1.5px solid var(--rule-dark)">
        📖 STORY BANK${storyCount > 0 ? ` <span style="font-size:9px;background:rgba(184,134,11,0.3);color:var(--gold);padding:2px 6px;border-radius:2px;margin-left:4px;font-family:'Familjen Grotesk',sans-serif;font-weight:700">${storyCount}</span>` : ''}
      </button>
    </div>`;

  if (achTab === 'stories') {
    return `<h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 20px;color:var(--accent)">Achievements & Stories</h1>${tabBar}${typeof renderStoryBank === 'function' ? renderStoryBank() : '<p>Loading...</p>'}`;
  }

  const achievements = state.achievements || [];
  const addMode      = state.ui.addAchievement || false;
  const editId       = state.ui.editAchievementId || null;
  const filterTag    = state.ui.achievementFilter || 'all';
  const searchQuery  = state.ui.achievementSearch || '';

  // Filter
  let filtered = achievements;
  if (filterTag !== 'all') filtered = filtered.filter(a => (a.tags||[]).includes(filterTag));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a =>
      (a.title||'').toLowerCase().includes(q) ||
      (a.result||'').toLowerCase().includes(q) ||
      (a.metric||'').toLowerCase().includes(q) ||
      (a.civilianTranslation||'').toLowerCase().includes(q)
    );
  }

  // Tag frequency for filter bar
  const tagCounts = {};
  achievements.forEach(a => (a.tags||[]).forEach(t => { tagCounts[t] = (tagCounts[t]||0)+1; }));

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 20px;color:var(--accent);letter-spacing:0.02em">Achievements & Stories</h1>
    \${tabBar}
    <p style="color:var(--muted);font-size:13px;margin:0 0 20px">Your brag book — the specific wins that feed every resume, cover letter, and interview answer Claude writes. Build this before you need it.</p>

    <!-- Stats + Add button -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        ${[
          { label:'Total', value: achievements.length },
          { label:'With Metrics', value: achievements.filter(a=>a.metric).length },
          { label:'Translated', value: achievements.filter(a=>a.civilianTranslation).length }
        ].map(s => `
          <div style="text-align:center">
            <div style="font-size:26px;font-weight:800;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;line-height:1">${s.value}</div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em">${s.label}</div>
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px">
        ${achievements.length > 0 && !addMode ? `<button class="btn btn-secondary" onclick="extractAchievementsFromExperience()">🤖 Auto-Extract</button>` : ''}
        <button class="btn btn-primary" onclick="toggleUI('addAchievement',true);toggleUI('editAchievementId',null)">+ Add Achievement</button>
      </div>
    </div>

    <!-- Empty state banner -->
    ${achievements.length === 0 && !addMode ? `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light);margin-bottom:16px">
      <h2 style="margin-bottom:8px">Why build this before you need it</h2>
      <p style="font-size:13px;color:var(--text);line-height:1.7;margin:0 0 12px">
        Every veteran has 20 years of wins and blanks on them under interview pressure. This library fixes that.
        Add your best accomplishments here — Claude automatically pulls from them when generating your resume,
        cover letters, and interview answers. The more specific the entry, the better everything gets.
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="toggleUI('addAchievement',true)">+ Add Your First Achievement</button>
        ${state.assignments.length > 0 ? `<button class="btn btn-secondary" onclick="extractAchievementsFromExperience()">🤖 Auto-Extract from Experience</button>` : ''}
      </div>
    </div>` : ''}

    <!-- Add / Edit form -->
    ${addMode && !editId ? renderAchievementForm(null) : ''}

    <!-- Search + filter (only shown when there are entries) -->
    ${achievements.length > 0 ? `
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center">
      <input id="achievement-search" placeholder="Search achievements..."
        value="${esc(searchQuery)}"
        oninput="toggleUI('achievementSearch',this.value)"
        style="flex:1;min-width:180px;font-size:13px;padding:7px 12px">
      <select onchange="toggleUI('achievementFilter',this.value)" style="width:auto;font-size:13px;padding:7px 10px">
        <option value="all" ${filterTag==='all'?'selected':''}>All tags (${achievements.length})</option>
        ${ACHIEVEMENT_TAGS.filter(t => tagCounts[t.id]).map(t =>
          `<option value="${t.id}" ${filterTag===t.id?'selected':''}>${t.icon} ${t.label} (${tagCounts[t.id]||0})</option>`
        ).join('')}
      </select>
    </div>` : ''}

    <!-- Achievement cards -->
    ${filtered.length === 0 && achievements.length > 0 ? `
    <div class="card" style="text-align:center;padding:32px;color:var(--muted)">
      No achievements match your filter. <button onclick="toggleUI('achievementFilter','all');toggleUI('achievementSearch','')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-weight:700">Clear filters</button>
    </div>` : ''}

    ${filtered.map(a => editId === a.id ? renderAchievementForm(a) : renderAchievementCard(a)).join('')}`;
}

// ── Card ───────────────────────────────────────────────────────────────

function renderAchievementCard(a) {
  const tags = (a.tags || []).map(t => {
    const info = TAG_MAP[t];
    return info ? `<span style="background:var(--accent-light);color:var(--accent);border:1px solid #c0cfe0;border-radius:2px;padding:1px 8px;font-size:11px;font-weight:600;font-family:'Familjen Grotesk',sans-serif">${info.icon} ${info.label}</span>` : '';
  }).join('');

  return `
    <div class="card" style="margin-bottom:12px;border-left:4px solid var(--gold)">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;margin-bottom:10px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:15px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">${esc(a.title||'Untitled Achievement')}</div>
          ${a.metric ? `<div style="display:inline-block;background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:2px 10px;font-size:12px;font-weight:700;color:var(--gold);font-family:'Familjen Grotesk',sans-serif;margin-bottom:6px">📊 ${esc(a.metric)}</div>` : ''}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn btn-secondary btn-sm" onclick="toggleUI('editAchievementId','${a.id}')">✏</button>
          <button class="btn btn-danger btn-sm" onclick="removeAchievement('${a.id}')">✕</button>
        </div>
      </div>

      ${a.result ? `
      <div style="font-size:13px;color:var(--text);line-height:1.6;margin-bottom:8px">
        <strong style="color:var(--muted);font-size:11px;font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.06em">Result</strong><br>
        ${esc(a.result)}
      </div>` : ''}

      ${a.civilianTranslation ? `
      <div style="background:var(--paper);border-left:3px solid var(--gold);padding:8px 12px;font-size:13px;color:var(--text);line-height:1.6;margin-bottom:8px;font-style:italic">
        💼 ${esc(a.civilianTranslation)}
      </div>` : `
      <div style="background:var(--red-light);border-radius:2px;padding:6px 10px;font-size:12px;color:var(--red);margin-bottom:8px">
        ⚠️ No civilian translation yet — <button onclick="translateAchievement('${a.id}')" style="background:none;border:none;color:var(--accent);font-weight:700;cursor:pointer;padding:0;font-size:12px">Generate one →</button>
      </div>`}

      ${tags ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${tags}</div>` : ''}

      ${a.timeframe ? `<div style="font-size:11px;color:var(--dim);margin-top:6px">${esc(a.timeframe)}</div>` : ''}
    </div>`;
}

// ── Form ───────────────────────────────────────────────────────────────

function renderAchievementForm(a) {
  const isEdit = !!a;
  const pre    = isEdit ? 'ea' : 'na';
  const selTags = a?.tags || [];

  return `
    <div class="card" style="border:2px solid var(--accent);margin-bottom:16px">
      <h2>${isEdit ? 'Edit Achievement' : '+ Add Achievement'}</h2>

      <!-- AI paste-in helper (new entries only) -->
      ${!isEdit ? `
      <div style="background:var(--accent-light);border:1px solid #c0cfe0;border-radius:2px;padding:12px 14px;margin-bottom:16px">
        <div style="font-weight:700;font-size:12px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">🤖 Paste & Extract</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:8px">Paste a bullet from a performance report, award citation, or eval — Claude will structure it for you.</div>
        <div style="display:flex;gap:8px">
          <textarea id="ach-paste-input" rows="2" placeholder="e.g. Managed $2.3M equipment account with zero losses across 18-month deployment..." style="flex:1;font-size:13px"></textarea>
          <button class="btn btn-primary btn-sm" onclick="extractSingleAchievement()" style="align-self:flex-end;white-space:nowrap">Extract →</button>
        </div>
        ${state.ui.achExtractBusy ? `<div style="font-size:12px;color:var(--accent);margin-top:6px;display:flex;align-items:center;gap:6px"><div class="spinner"></div> Extracting...</div>` : ''}
      </div>` : ''}

      <div class="field">
        <label class="field-label">Title * — short, memorable label for this win</label>
        <input id="${pre}-ach-title" value="${esc(a?.title||'')}" placeholder="e.g. Zero-loss equipment accountability across 18-month deployment">
      </div>

      <div class="grid2">
        <div class="field">
          <label class="field-label">The Metric * — the number that makes it real</label>
          <input id="${pre}-ach-metric" value="${esc(a?.metric||'')}" placeholder="e.g. $2.3M, 142 personnel, 34% reduction, 0 losses">
          <div style="font-size:10px;color:var(--dim);margin-top:2px">If there's no metric, find one — team size, time saved, budget managed, error rate</div>
        </div>
        <div class="field">
          <label class="field-label">Timeframe</label>
          <input id="${pre}-ach-timeframe" value="${esc(a?.timeframe||'')}" placeholder="e.g. FY2022, 18-month deployment, during OEF 2019">
        </div>
      </div>

      <div class="field">
        <label class="field-label">Situation — what was happening, what was at stake</label>
        <textarea id="${pre}-ach-situation" rows="2" placeholder="e.g. Unit was tasked with a 90-day surge deployment with 30% fewer personnel than baseline...">${esc(a?.situation||'')}</textarea>
      </div>

      <div class="field">
        <label class="field-label">Action — specifically what YOU did (not the team, not what happened)</label>
        <textarea id="${pre}-ach-action" rows="2" placeholder="e.g. I redesigned the accountability process, cross-trained three NCOs, and implemented daily reconciliation...">${esc(a?.action||'')}</textarea>
      </div>

      <div class="field">
        <label class="field-label">Result * — the outcome, as specific as possible</label>
        <textarea id="${pre}-ach-result" rows="2" placeholder="e.g. Zero equipment losses across the entire deployment — first time the unit achieved that standard in 8 years">${esc(a?.result||'')}</textarea>
      </div>

      <div class="field">
        <label class="field-label">Civilian Translation — how a hiring manager at a tech company would understand this</label>
        <div style="display:flex;gap:8px;align-items:start">
          <textarea id="${pre}-ach-translation" rows="2" placeholder="e.g. Managed $2.3M asset portfolio with 100% accountability over 18 months — equivalent to zero inventory shrinkage across a full product lifecycle" style="flex:1">${esc(a?.civilianTranslation||'')}</textarea>
          ${isEdit ? `<button class="btn btn-secondary btn-sm" onclick="translateAchievement('${a.id}')" style="white-space:nowrap;align-self:flex-start">🤖 Generate</button>` : ''}
        </div>
      </div>

      <!-- Tags -->
      <div class="field">
        <label class="field-label">Tags — what does this achievement demonstrate?</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
          ${ACHIEVEMENT_TAGS.map(t => `
            <label style="display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid ${selTags.includes(t.id)?'var(--accent)':'var(--rule-dark)'};background:${selTags.includes(t.id)?'var(--gold-light)':'white'};border-radius:2px;cursor:pointer;font-size:12px;font-weight:600">
              <input type="checkbox" value="${t.id}" ${selTags.includes(t.id)?'checked':''}
                style="width:auto;accent-color:var(--accent)">
              ${t.icon} ${t.label}
            </label>`).join('')}
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-primary btn-sm" onclick="${isEdit ? `updateAchievement('${a.id}')` : 'saveAchievement()'}">
          ${isEdit ? 'Update' : 'Save Achievement'}
        </button>
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('addAchievement',false);toggleUI('editAchievementId',null)">Cancel</button>
      </div>
    </div>`;
}

// ── CRUD ───────────────────────────────────────────────────────────────

function saveAchievement() {
  const pre   = 'na';
  const title  = document.getElementById(pre+'-ach-title')?.value?.trim();
  const result = document.getElementById(pre+'-ach-result')?.value?.trim();
  if (!title) { showToast('Add a title for this achievement', false); return; }

  const tags = Array.from(document.querySelectorAll(`input[type=checkbox][value]`))
    .filter(el => el.checked && ACHIEVEMENT_TAGS.some(t => t.id === el.value))
    .map(el => el.value);

  const a = {
    id:                 id(),
    title,
    metric:             document.getElementById(pre+'-ach-metric')?.value?.trim()      || '',
    timeframe:          document.getElementById(pre+'-ach-timeframe')?.value?.trim()   || '',
    situation:          document.getElementById(pre+'-ach-situation')?.value?.trim()   || '',
    action:             document.getElementById(pre+'-ach-action')?.value?.trim()      || '',
    result:             result                                                          || '',
    civilianTranslation:document.getElementById(pre+'-ach-translation')?.value?.trim()|| '',
    tags,
    source:   'manual',
    dateAdded: new Date().toISOString()
  };

  setState({ achievements: [...(state.achievements||[]), a], ui: { ...state.ui, addAchievement: false } });
  showToast('🏆 Achievement saved');
}

function updateAchievement(aid) {
  const pre    = 'ea';
  const title  = document.getElementById(pre+'-ach-title')?.value?.trim();
  if (!title) { showToast('Title is required', false); return; }

  const tags = Array.from(document.querySelectorAll(`input[type=checkbox][value]`))
    .filter(el => el.checked && ACHIEVEMENT_TAGS.some(t => t.id === el.value))
    .map(el => el.value);

  const existing = (state.achievements||[]).find(a => a.id === aid);
  const updated = {
    ...existing, id: aid, title,
    metric:              document.getElementById(pre+'-ach-metric')?.value?.trim()       || existing?.metric             || '',
    timeframe:           document.getElementById(pre+'-ach-timeframe')?.value?.trim()    || existing?.timeframe          || '',
    situation:           document.getElementById(pre+'-ach-situation')?.value?.trim()    || existing?.situation          || '',
    action:              document.getElementById(pre+'-ach-action')?.value?.trim()       || existing?.action             || '',
    result:              document.getElementById(pre+'-ach-result')?.value?.trim()       || existing?.result             || '',
    civilianTranslation: document.getElementById(pre+'-ach-translation')?.value?.trim() || existing?.civilianTranslation|| '',
    tags
  };

  setState({ achievements: (state.achievements||[]).map(a => a.id === aid ? updated : a), ui: { ...state.ui, editAchievementId: null } });
  showToast('✓ Achievement updated');
}

function removeAchievement(aid) {
  if (!confirm('Remove this achievement?')) return;
  setState({ achievements: (state.achievements||[]).filter(a => a.id !== aid) });
  showToast('Removed');
}

// ── AI: Single entry extraction from pasted text ───────────────────────

async function extractSingleAchievement() {
  const input = document.getElementById('ach-paste-input')?.value?.trim();
  if (!input) { showToast('Paste something to extract from', false); return; }

  setState({ ui: { ...state.ui, achExtractBusy: true } });
  try {
    const raw = await callClaude(
      'You extract structured achievement data from military performance report bullets, award citations, or informal notes. Return valid JSON only.',
      `Extract a structured achievement from this text. Return ONLY this JSON (no markdown):
{
  "title":               "Short memorable title — what was accomplished, max 10 words",
  "metric":              "The key number — team size, budget, percentage, time, zero losses, etc.",
  "timeframe":           "When or how long — year, deployment name, fiscal year, etc.",
  "situation":           "Context — what was happening, what was at stake. 1-2 sentences.",
  "action":              "What the person specifically did. First person. 1-2 sentences.",
  "result":              "The outcome, as specific as possible. 1-2 sentences.",
  "civilianTranslation": "How a civilian hiring manager would understand this. Plain English. 1-2 sentences.",
  "tags":                ["array of relevant tag ids from: leadership, budget, technical, operational, crisis, training, innovation, collaboration, safety, international"]
}

TEXT TO EXTRACT:
${input}`
    );

    let data;
    try { data = JSON.parse(raw.replace(/```json|```/g,'').trim()); }
    catch(e) { throw new Error('Could not parse extraction. Try rephrasing or enter manually.'); }

    // Pre-fill the form fields
    const fields = ['title','metric','timeframe','situation','action','result'];
    fields.forEach(f => {
      const el = document.getElementById(`na-ach-${f}`);
      if (el && data[f]) el.value = data[f];
    });
    const transEl = document.getElementById('na-ach-translation');
    if (transEl && data.civilianTranslation) transEl.value = data.civilianTranslation;

    // Check the extracted tags
    if (data.tags?.length) {
      document.querySelectorAll('input[type=checkbox][value]').forEach(el => {
        if (ACHIEVEMENT_TAGS.some(t => t.id === el.value)) {
          el.checked = data.tags.includes(el.value);
          const label = el.closest('label');
          if (label) {
            label.style.border = el.checked ? '1.5px solid var(--accent)' : '1.5px solid var(--rule-dark)';
            label.style.background = el.checked ? 'var(--gold-light)' : 'white';
          }
        }
      });
    }

    setState({ ui: { ...state.ui, achExtractBusy: false } });
    showToast('✓ Extracted — review and save');
  } catch(err) {
    setState({ ui: { ...state.ui, achExtractBusy: false } });
    showToast('Error: ' + err.message, false);
  }
}

// ── AI: Bulk extract from all experience ──────────────────────────────

async function extractAchievementsFromExperience() {
  if (state.assignments.length === 0 && state.civilianJobs.length === 0) {
    showToast('Add some experience first', false); return;
  }

  showToast('🤖 Extracting achievements from your experience...', true);

  const expText = [
    ...state.assignments.map(a =>
      `MILITARY: ${a.dutyTitle} at ${a.base} (${a.startDate||'?'}–${a.endDate||'present'})\n${(a.accomplishments||'').slice(0,600)}`
    ),
    ...state.civilianJobs.map(j =>
      `CIVILIAN: ${j.title} at ${j.company}\n${(j.accomplishments||'').slice(0,400)}`
    )
  ].join('\n---\n');

  const existingTitles = (state.achievements||[]).map(a => a.title);

  try {
    const raw = await callClaude(
      'You extract structured, specific achievements from military and civilian work experience. Every achievement must have a metric. Return valid JSON only.',
      `Extract the 5-8 strongest achievements from this veteran's experience. Each must have a concrete number.

EXISTING ACHIEVEMENTS (do not duplicate):
${existingTitles.length ? existingTitles.join(', ') : 'None yet'}

EXPERIENCE:
${expText}

Return ONLY this JSON array (no markdown):
[
  {
    "title":               "Short memorable title, max 10 words",
    "metric":              "The key number — required, find one in every entry",
    "timeframe":           "When or how long",
    "situation":           "Context. 1 sentence.",
    "action":              "What they specifically did. First person. 1-2 sentences.",
    "result":              "The outcome. 1-2 sentences.",
    "civilianTranslation": "Plain English for a civilian hiring manager. 1-2 sentences.",
    "tags":                ["relevant tags from: leadership, budget, technical, operational, crisis, training, innovation, collaboration, safety, international"]
  }
]

Rules:
- If no metric is visible, estimate from context (team size, assets, budget, time saved)
- Prioritize achievements with leadership scope, budget responsibility, and measurable outcomes
- Do not duplicate existing achievements
- Return empty array if nothing meaningful can be extracted`
    );

    let extracted;
    try { extracted = JSON.parse(raw.replace(/```json|```/g,'').trim()); }
    catch(e) { throw new Error('Could not parse results. Try again.'); }

    if (!extracted?.length) {
      showToast('No new achievements found — your existing entries may already cover the highlights.'); return;
    }

    const newEntries = extracted.map(e => ({
      ...e,
      id:      id(),
      source:  'AI:extract',
      dateAdded: new Date().toISOString()
    }));

    setState({ achievements: [...(state.achievements||[]), ...newEntries] });
    showToast(`✓ Added ${newEntries.length} achievement${newEntries.length===1?'':'s'} — review and edit as needed`);
  } catch(err) {
    showToast('Error: ' + err.message, false);
  }
}

// ── AI: Translate a single achievement ───────────────────────────────

async function translateAchievement(aid) {
  const a = (state.achievements||[]).find(x => x.id === aid);
  if (!a) return;

  showToast('🤖 Generating civilian translation...', true);
  try {
    const result = await callClaude(
      'You write concise civilian translations of military achievements for resume and interview use. Plain English, specific, no jargon.',
      `Write a 1-2 sentence civilian translation of this military achievement for a hiring manager at a Fortune 500 company.

ACHIEVEMENT:
Title: ${a.title}
Metric: ${a.metric}
Result: ${a.result}
Situation: ${a.situation}
Action: ${a.action}

Rules:
- No military jargon
- Lead with the business impact
- Keep the metric
- Sound like a confident professional, not a resume template
- Under 40 words

Return only the translation. No preamble.`
    );

    const translation = result.trim();
    const updated = { ...a, civilianTranslation: translation };
    setState({ achievements: (state.achievements||[]).map(x => x.id === aid ? updated : x) });

    // Also update the textarea if it's currently visible in an edit form
    const el = document.getElementById('ea-ach-translation');
    if (el) el.value = translation;

    showToast('✓ Translation generated');
  } catch(err) {
    showToast('Error: ' + err.message, false);
  }
}

// ── Context builder — called by resume/interview generators ───────────

function buildAchievementsContext(maxEntries = 8) {
  const achievements = state.achievements || [];
  if (!achievements.length) return '';

  const top = [...achievements]
    .sort((a, b) => {
      // Prioritize: has metric + has civilian translation + has result
      const scoreA = (a.metric?2:0) + (a.civilianTranslation?1:0) + (a.result?1:0);
      const scoreB = (b.metric?2:0) + (b.civilianTranslation?1:0) + (b.result?1:0);
      return scoreB - scoreA;
    })
    .slice(0, maxEntries);

  return `\nKEY ACHIEVEMENTS (use these as source material for bullets and interview answers):\n` +
    top.map(a =>
      `• ${a.title}${a.metric ? ` [${a.metric}]` : ''}${a.civilianTranslation ? ` — ${a.civilianTranslation}` : a.result ? ` — ${a.result}` : ''}`
    ).join('\n');
}
