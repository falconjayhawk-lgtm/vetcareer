// ── stories.js — STAR+R Behavioral Story Bank ─────────────────────────
//
// The bridge between the achievements library (raw wins) and interview
// prep (question-specific coached answers). Each story is a practiced,
// rehearsed answer to a specific behavioral interview question type.
//
// STAR+R format: Situation, Task, Action, Result, Reflection
// The +R is the civilian differentiator — it shows growth and self-awareness.
//
// Data shape:
// {
//   id, title, category, question,
//   situation, task, action, result, reflection,
//   civilianFrame, linkedAchievementId,
//   confidence (1-5), practiceCount, lastPracticed,
//   source ('manual'|'AI:generate'), dateAdded
// }
// ──────────────────────────────────────────────────────────────────────

const STORY_CATEGORIES = [
  {
    id:       'leadership',
    label:    'Leadership Under Pressure',
    icon:     '👥',
    question: 'Tell me about a time you led a team through a difficult or high-stakes situation.',
    tip:      'Lead with the stakes and your personal role. Civilian interviewers want to know how YOU led, not how the mission succeeded.'
  },
  {
    id:       'ambiguity',
    label:    'Decision with Incomplete Info',
    icon:     '🎯',
    question: 'Describe a time you had to make an important decision without all the information you needed.',
    tip:      'The military thrives in ambiguity — this is a genuine strength. Frame the decision-making process, not just the outcome.'
  },
  {
    id:       'conflict',
    label:    'Conflict Resolution',
    icon:     '🤝',
    question: 'Tell me about a time you had a significant conflict with a colleague or peer and how you resolved it.',
    tip:      'Civilian culture handles conflict very differently from the military. Show you can navigate disagreement without rank or authority.'
  },
  {
    id:       'failure',
    label:    'Failure / Lesson Learned',
    icon:     '📚',
    question: 'Tell me about a time you failed or made a significant mistake. What did you learn?',
    tip:      'This is the most important story to practice. Veterans are trained to move past failure quickly — civilians want to see you sit with it and learn from it.'
  },
  {
    id:       'change',
    label:    'Adapting to Change',
    icon:     '🔄',
    question: 'Describe a time you had to adapt to a major unexpected change. How did you handle it?',
    tip:      'PCS moves, new commands, policy changes — you have dozens of examples. Pick one with a clear before/after.'
  },
  {
    id:       'influence',
    label:    'Influence Without Authority',
    icon:     '💡',
    question: 'Give me an example of when you had to influence someone over whom you had no direct authority to get something done.',
    tip:      'This is critical for civilian roles. Show coalition-building, relationship leverage, and persuasion — not rank.'
  },
  {
    id:       'accomplishment',
    label:    'Greatest Accomplishment',
    icon:     '🏆',
    question: 'What is your greatest professional accomplishment and why?',
    tip:      'This should be your single best story — metric-driven, high stakes, and with a clear civilian translation. Prepare this one perfectly.'
  },
  {
    id:       'bad-news',
    label:    'Delivering Bad News',
    icon:     '📢',
    question: 'Tell me about a time you had to deliver difficult or unwelcome news to someone.',
    tip:      'Civilian leaders are expected to deliver tough messages with empathy. Show the process, not just the outcome.'
  },
  {
    id:       'above-beyond',
    label:    'Above and Beyond',
    icon:     '⭐',
    question: 'Tell me about a time you went significantly above and beyond what was expected of you.',
    tip:      '"Above and beyond" in military service is often just Tuesday. Pick something that shows initiative outside your lane.'
  },
  {
    id:       'priorities',
    label:    'Competing Priorities',
    icon:     '⚡',
    question: 'Describe a time you had multiple competing priorities and limited time. How did you manage it?',
    tip:      'Show your framework for triage and decision-making. Civilian managers need to trust you can self-direct under pressure.'
  },
  {
    id:       'resources',
    label:    'Limited Resources',
    icon:     '🔧',
    question: 'Tell me about a time you had to accomplish a goal with fewer resources than you needed.',
    tip:      'Military budget constraints and undermanned units are a perfect analog to the civilian startup experience. Own this one.'
  },
  {
    id:       'transition',
    label:    'Why Civilian Now?',
    icon:     '🪖',
    question: 'Why are you leaving the military? What draws you to this type of role?',
    tip:      'The most important framing question. The answer cannot be "20 years" or "wanted a change." It must be a pull — what you are moving toward, not what you are leaving.'
  }
];

const CATEGORY_MAP = Object.fromEntries(STORY_CATEGORIES.map(c => [c.id, c]));

const CONFIDENCE_LABELS = {
  1: { label: 'Not ready',     color: 'var(--red)',   bg: 'var(--red-light)' },
  2: { label: 'Needs work',    color: '#e65100',      bg: '#fff3e0' },
  3: { label: 'Getting there', color: 'var(--gold)',  bg: 'var(--gold-light)' },
  4: { label: 'Solid',         color: 'var(--green)', bg: 'var(--green-light)' },
  5: { label: 'Interview ready', color: 'var(--green)', bg: 'var(--green-light)' }
};

// ── Story bank tab render ──────────────────────────────────────────────

function renderStoryBank() {
  const stories    = state.stories || [];
  const addMode    = state.ui.addStory   || false;
  const editId     = state.ui.editStoryId || null;
  const practiceId = state.ui.practiceStoryId || null;
  const filterCat  = state.ui.storyFilter || 'all';

  // Coverage map — which categories have stories
  const covered = new Set(stories.map(s => s.category));
  const coveragePct = Math.round((covered.size / STORY_CATEGORIES.length) * 100);

  // Filter
  const filtered = filterCat === 'all'
    ? stories
    : stories.filter(s => s.category === filterCat);

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent)">📖 Story Bank</h1>
    <p style="color:var(--muted);font-size:13px;margin:0 0 20px">Practiced STAR+R answers to the 12 behavioral questions that cover 90% of civilian interviews. Build these before you need them.</p>

    <!-- Coverage map -->
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">Coverage Map</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">${covered.size} of ${STORY_CATEGORIES.length} question types covered · ${coveragePct}%</p>
        </div>
        <div style="display:flex;gap:8px">
          ${stories.length > 0 ? `<button class="btn btn-secondary btn-sm" onclick="generateAllStories()">🤖 Generate Missing</button>` : ''}
          ${(state.achievements||[]).length > 0 && !addMode
            ? `<button class="btn btn-secondary btn-sm" onclick="generateStoriesFromAchievements()">🤖 Generate from Achievements</button>`
            : ''}
          <button class="btn btn-primary btn-sm" onclick="toggleUI('addStory',true)">+ Add Story</button>
        </div>
      </div>
      <div style="height:6px;background:var(--rule);border-radius:4px;overflow:hidden;margin-bottom:14px">
        <div style="height:6px;background:${coveragePct===100?'var(--green)':'var(--gold)'};border-radius:4px;width:${coveragePct}%;transition:width 0.4s"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px">
        ${STORY_CATEGORIES.map(cat => {
          const catStories = stories.filter(s => s.category === cat.id);
          const hasCoverage = catStories.length > 0;
          const bestConf = catStories.length ? Math.max(...catStories.map(s => s.confidence||1)) : 0;
          const conf = CONFIDENCE_LABELS[bestConf] || {};
          return `
          <div onclick="toggleUI('storyFilter','${cat.id}')"
            style="padding:8px 10px;border:1.5px solid ${hasCoverage?conf.color||'var(--green)':'var(--rule-dark)'};background:${hasCoverage?conf.bg||'var(--green-light)':'white'};border-radius:2px;cursor:pointer;transition:all 0.15s">
            <div style="font-size:16px;margin-bottom:3px">${cat.icon}</div>
            <div style="font-size:11px;font-weight:700;color:${hasCoverage?conf.color||'var(--green)':'var(--muted)'};font-family:'Familjen Grotesk',sans-serif;line-height:1.3">${cat.label}</div>
            <div style="font-size:10px;color:${hasCoverage?conf.color:'var(--dim)'};margin-top:3px">
              ${hasCoverage ? `${catStories.length} stor${catStories.length>1?'ies':'y'} · ${conf.label||''}` : '⚠ No story yet'}
            </div>
          </div>`;
        }).join('')}
      </div>
      ${coveragePct < 100 ? `
      <div style="margin-top:12px;font-size:12px;color:var(--muted)">
        Missing: ${STORY_CATEGORIES.filter(c=>!covered.has(c.id)).map(c=>c.label).join(' · ')}
      </div>` : `
      <div style="margin-top:12px;text-align:center;padding:8px;background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;font-size:12px;font-weight:700;color:var(--green);font-family:'Familjen Grotesk',sans-serif">
        🎉 ALL 12 QUESTION TYPES COVERED — YOU'RE INTERVIEW READY
      </div>`}
    </div>

    ${stories.length === 0 && !addMode ? `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light)">
      <h2 style="margin-bottom:8px">Why STAR+R instead of STAR?</h2>
      <p style="font-size:13px;color:var(--text);line-height:1.7;margin:0 0 12px">
        The Reflection step is what most veterans skip — and what civilian interviewers weigh most heavily.
        "What did you learn?" signals self-awareness and growth mindset. The military trains people to move past
        events quickly. Civilians want to see you sit with them. Adding the +R to your answers is often the difference
        between a good interview and a great one.
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${(state.achievements||[]).length > 0 ? `<button class="btn btn-primary" onclick="generateStoriesFromAchievements()">🤖 Generate Stories from My Achievements</button>` : ''}
        <button class="btn ${(state.achievements||[]).length>0?'btn-secondary':'btn-primary'}" onclick="toggleUI('addStory',true)">+ Write My First Story</button>
      </div>
    </div>` : ''}

    <!-- Add / edit form -->
    ${addMode && !editId ? renderStoryForm(null) : ''}
    ${editId ? renderStoryForm(stories.find(s=>s.id===editId)||null) : ''}

    <!-- Practice mode -->
    ${practiceId ? renderPracticeMode(stories.find(s=>s.id===practiceId)) : ''}

    <!-- Filter bar -->
    ${stories.length > 0 ? `
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
      <button onclick="toggleUI('storyFilter','all')" style="padding:4px 12px;border-radius:2px;border:1.5px solid ${filterCat==='all'?'var(--accent)':'var(--rule-dark)'};background:${filterCat==='all'?'var(--accent)':'white'};color:${filterCat==='all'?'white':'var(--muted)'};font-size:12px;font-weight:700;cursor:pointer;font-family:'Familjen Grotesk',sans-serif">All (${stories.length})</button>
      ${STORY_CATEGORIES.filter(c=>stories.some(s=>s.category===c.id)).map(cat=>`
        <button onclick="toggleUI('storyFilter','${cat.id}')" style="padding:4px 12px;border-radius:2px;border:1.5px solid ${filterCat===cat.id?'var(--accent)':'var(--rule-dark)'};background:${filterCat===cat.id?'var(--accent)':'white'};color:${filterCat===cat.id?'white':'var(--muted)'};font-size:12px;font-weight:700;cursor:pointer;font-family:'Familjen Grotesk',sans-serif">
          ${cat.icon} ${cat.label}
        </button>`).join('')}
    </div>` : ''}

    <!-- Story cards -->
    ${filtered.filter(s=>s.id!==editId).map(s =>
      practiceId === s.id ? '' : renderStoryCard(s)
    ).join('')}`;
}

// ── Story card ─────────────────────────────────────────────────────────

function renderStoryCard(s) {
  const cat  = CATEGORY_MAP[s.category] || {};
  const conf = CONFIDENCE_LABELS[s.confidence||1] || CONFIDENCE_LABELS[1];
  const linkedAch = s.linkedAchievementId
    ? (state.achievements||[]).find(a=>a.id===s.linkedAchievementId)
    : null;

  return `
    <div class="card" style="margin-bottom:12px;border-left:4px solid ${conf.color}">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;margin-bottom:10px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-size:18px">${cat.icon||'📖'}</span>
            <span style="font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${conf.color};background:${conf.bg};padding:2px 8px;border-radius:2px">${conf.label}</span>
            <span style="font-size:10px;color:var(--dim);font-family:'Familjen Grotesk',sans-serif">${cat.label}</span>
          </div>
          <div style="font-weight:700;font-size:15px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${esc(s.title||'Untitled Story')}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;font-style:italic">"${esc(s.question||cat.question||'')}"</div>
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0">
          <button class="btn btn-primary btn-sm" onclick="toggleUI('practiceStoryId','${s.id}')" title="Practice this story">▶ Practice</button>
          <button class="btn btn-secondary btn-sm" onclick="toggleUI('editStoryId','${s.id}');toggleUI('addStory',false)" title="Edit">✏</button>
          <button class="btn btn-danger btn-sm" onclick="removeStory('${s.id}')" title="Delete">✕</button>
        </div>
      </div>

      <!-- STAR+R preview -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:10px">
        ${[
          { label:'S — Situation', value: s.situation, color:'var(--accent)' },
          { label:'T — Task',      value: s.task,      color:'#7c3aed' },
          { label:'A — Action',    value: s.action,    color:'var(--gold)' },
          { label:'R — Result',    value: s.result,    color:'var(--green)' },
          { label:'+R — Reflection', value: s.reflection, color:'var(--red)' }
        ].map(part => `
          <div style="background:var(--paper);border-radius:2px;padding:8px;border-left:3px solid ${part.color}">
            <div style="font-size:9px;font-weight:700;color:${part.color};font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:3px">${part.label}</div>
            <div style="font-size:11px;color:${part.value?'var(--text)':'var(--dim)'};line-height:1.5">
              ${part.value ? esc(part.value.slice(0,80))+(part.value.length>80?'...':'') : '⚠ Not written yet'}
            </div>
          </div>`).join('')}
      </div>

      <!-- Confidence + practice tracker -->
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:11px;color:var(--muted);font-family:'Familjen Grotesk',sans-serif">Confidence:</span>
          ${[1,2,3,4,5].map(n => `
            <button onclick="setStoryConfidence('${s.id}',${n})"
              style="width:22px;height:22px;border-radius:50%;border:2px solid ${n<=(s.confidence||1)?conf.color:'var(--rule-dark)'};background:${n<=(s.confidence||1)?conf.color:'white'};cursor:pointer;font-size:10px;color:white;display:flex;align-items:center;justify-content:center">
              ${n<=(s.confidence||1)?'★':''}
            </button>`).join('')}
        </div>
        ${s.practiceCount > 0 ? `
          <div style="font-size:11px;color:var(--muted)">Practiced ${s.practiceCount}× ${s.lastPracticed?'· Last: '+new Date(s.lastPracticed).toLocaleDateString():''}</div>
        ` : `<div style="font-size:11px;color:var(--dim)">Not practiced yet</div>`}
        ${linkedAch ? `<div style="font-size:11px;color:var(--accent)">🏆 Linked: ${esc(linkedAch.title?.slice(0,30)||'')}</div>` : ''}
      </div>

      ${s.civilianFrame ? `
      <div style="margin-top:8px;background:var(--paper);border-left:3px solid var(--gold);padding:7px 10px;font-size:12px;color:var(--text);font-style:italic">
        💼 ${esc(s.civilianFrame)}
      </div>` : ''}
    </div>`;
}

// ── Practice mode ──────────────────────────────────────────────────────

function renderPracticeMode(s) {
  if (!s) return '';
  const cat      = CATEGORY_MAP[s.category] || {};
  const revealed = state.ui.practiceRevealed || false;

  return `
    <div class="card" style="border:2px solid var(--accent);margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em">Practice Mode</div>
          <div style="font-weight:700;font-size:15px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${esc(s.title)}</div>
        </div>
        <button onclick="toggleUI('practiceStoryId',null);toggleUI('practiceRevealed',false)" class="btn btn-secondary btn-sm">✕ Exit Practice</button>
      </div>

      <!-- The question -->
      <div style="background:var(--navy);color:white;border-radius:2px;padding:20px;text-align:center;margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);font-family:'Familjen Grotesk',sans-serif;margin-bottom:10px">${cat.icon||'🎤'} ${cat.label}</div>
        <div style="font-size:18px;font-style:italic;line-height:1.5">"${esc(s.question||cat.question||'')}"</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:10px">${esc(cat.tip||'')}</div>
      </div>

      ${!revealed ? `
      <div style="text-align:center;margin-bottom:16px">
        <p style="font-size:14px;color:var(--muted);margin-bottom:16px">Say your answer out loud first. Then reveal the coached version to compare.</p>
        <button class="btn btn-primary" onclick="revealStoryAnswer('${s.id}')">Reveal My Coached Answer</button>
      </div>` : `

      <!-- STAR+R answer revealed -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
        ${[
          { key:'situation',  label:'S — Situation',    color:'var(--accent)', desc:'Set the scene in 1-2 sentences.' },
          { key:'task',       label:'T — Task',         color:'#7c3aed',       desc:'What did YOU need to accomplish specifically?' },
          { key:'action',     label:'A — Action',       color:'var(--gold)',   desc:'What YOU did — specific, first person, no "we."' },
          { key:'result',     label:'R — Result',       color:'var(--green)',  desc:'Outcome with metric. What changed?' },
          { key:'reflection', label:'+R — Reflection',  color:'var(--red)',    desc:'What did you learn? What would you do differently?' }
        ].map(part => `
          <div style="border-left:4px solid ${part.color};padding:12px 14px;background:${part.key==='reflection'?'var(--red-light)':'var(--paper)'}">
            <div style="font-size:10px;font-weight:700;color:${part.color};font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">${part.label}</div>
            <div style="font-size:13px;color:var(--text);line-height:1.75">${s[part.key] ? esc(s[part.key]) : `<span style="color:var(--dim);font-style:italic">Not written yet — edit this story to add it</span>`}</div>
            <div style="font-size:10px;color:var(--dim);margin-top:4px;font-style:italic">${part.desc}</div>
          </div>`).join('')}
      </div>

      ${s.civilianFrame ? `
      <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:12px;margin-bottom:16px">
        <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">💼 Civilian Framing</div>
        <div style="font-size:13px;color:var(--text)">${esc(s.civilianFrame)}</div>
      </div>` : ''}

      <!-- How did it go? -->
      <div style="background:var(--accent-light);border:1px solid #c0cfe0;border-radius:2px;padding:12px;margin-bottom:0">
        <div style="font-size:12px;font-weight:700;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;margin-bottom:10px">How did your live answer compare?</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${[
            { conf:5, label:'Nailed it' },
            { conf:4, label:'Pretty solid' },
            { conf:3, label:'Getting there' },
            { conf:2, label:'Needs work' },
            { conf:1, label:'Rough — edit and retry' }
          ].map(b => `
            <button onclick="logPractice('${s.id}',${b.conf})"
              class="btn btn-secondary btn-sm">
              ${b.label}
            </button>`).join('')}
        </div>
      </div>`}
    </div>`;
}

// ── Story form ─────────────────────────────────────────────────────────

function renderStoryForm(s) {
  const isEdit = !!s;
  const achievements = state.achievements || [];

  return `
    <div class="card" style="border:2px solid var(--accent);margin-bottom:16px">
      <h2>${isEdit ? 'Edit Story' : '+ Add Story'}</h2>

      <div class="grid2">
        <div class="field">
          <label class="field-label">Story Title *</label>
          <input id="sf-title" value="${esc(s?.title||'')}" placeholder="e.g., Leading the undermanned deployment surge">
        </div>
        <div class="field">
          <label class="field-label">Question Category *</label>
          <select id="sf-category" style="font-size:13px">
            <option value="">Select...</option>
            ${STORY_CATEGORIES.map(cat => `
              <option value="${cat.id}" ${s?.category===cat.id?'selected':''}>${cat.icon} ${cat.label}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Question preview -->
      <div id="sf-question-preview" style="background:var(--accent-light);border:1px solid #c0cfe0;border-radius:2px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:var(--accent);font-style:italic;display:${s?.category?'block':'none'}">
        ${s?.category ? `"${esc(CATEGORY_MAP[s.category]?.question||'')}"` : ''}
      </div>

      <!-- Link to achievement (optional) -->
      ${achievements.length > 0 ? `
      <div class="field">
        <label class="field-label">Link to Achievement (optional)</label>
        <select id="sf-achievement" style="font-size:13px">
          <option value="">No linked achievement</option>
          ${achievements.map(a => `<option value="${a.id}" ${s?.linkedAchievementId===a.id?'selected':''}>${esc(a.title)}</option>`).join('')}
        </select>
        <div style="font-size:10px;color:var(--dim);margin-top:2px">Linking pulls the metric and context automatically</div>
      </div>` : ''}

      <!-- STAR+R fields -->
      ${[
        { key:'situation',  label:'S — Situation *',     placeholder:'Set the scene in 2-3 sentences. What was happening? What was at stake?', rows:2, color:'var(--accent)' },
        { key:'task',       label:'T — Task *',           placeholder:'What specifically did YOU need to accomplish? What was your responsibility?', rows:2, color:'#7c3aed' },
        { key:'action',     label:'A — Action *',         placeholder:'What did YOU do? First person. Specific steps. No "we." 3-4 sentences.', rows:3, color:'var(--gold)' },
        { key:'result',     label:'R — Result *',         placeholder:'What was the outcome? Lead with the metric.', rows:2, color:'var(--green)' },
        { key:'reflection', label:'+R — Reflection *',    placeholder:'What did you learn from this experience? What would you do differently? This is what separates your answers from every other candidate\'s.', rows:2, color:'var(--red)' }
      ].map(f => `
        <div class="field">
          <label class="field-label" style="color:${f.color}">${f.label}</label>
          <textarea id="sf-${f.key}" rows="${f.rows}" placeholder="${f.placeholder}" style="border-color:${f.color}30">${esc(s?.[f.key]||'')}</textarea>
        </div>`).join('')}

      <div class="field">
        <label class="field-label">💼 Civilian Framing</label>
        <textarea id="sf-civilian" rows="2" placeholder="How would you describe this situation to someone who has never worked in the military? No jargon — plain business language.">${esc(s?.civilianFrame||'')}</textarea>
      </div>

      <div class="field">
        <label class="field-label">Confidence Level</label>
        <select id="sf-confidence" style="font-size:13px">
          ${[1,2,3,4,5].map(n=>`<option value="${n}" ${(s?.confidence||1)===n?'selected':''}>${n} — ${CONFIDENCE_LABELS[n].label}</option>`).join('')}
        </select>
      </div>

      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-primary btn-sm" onclick="${isEdit?`updateStory('${s.id}')`:'saveStory()'}">
          ${isEdit?'Update Story':'Save Story'}
        </button>
        ${!isEdit && (state.achievements||[]).length > 0 ? `
        <button class="btn btn-secondary btn-sm" onclick="generateSingleStory()">🤖 Generate with AI</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="toggleUI('addStory',false);toggleUI('editStoryId',null)">Cancel</button>
      </div>
    </div>

    <script>
      // Show question preview when category changes
      document.getElementById('sf-category')?.addEventListener('change', function() {
        const cat = window.CATEGORY_MAP?.[this.value];
        const prev = document.getElementById('sf-question-preview');
        if (prev && cat) {
          prev.style.display = 'block';
          prev.textContent = '"' + cat.question + '"';
        } else if (prev) {
          prev.style.display = 'none';
        }
      });
    <\/script>`;
}

// ── CRUD ───────────────────────────────────────────────────────────────

function saveStory() {
  const title    = document.getElementById('sf-title')?.value?.trim();
  const category = document.getElementById('sf-category')?.value;
  if (!title)    { showToast('Add a story title', false); return; }
  if (!category) { showToast('Select a question category', false); return; }

  const achId = document.getElementById('sf-achievement')?.value || '';
  const linkedAch = achId ? (state.achievements||[]).find(a=>a.id===achId) : null;

  const story = {
    id:                  id(),
    title,
    category,
    question:            CATEGORY_MAP[category]?.question || '',
    situation:           document.getElementById('sf-situation')?.value?.trim() || '',
    task:                document.getElementById('sf-task')?.value?.trim()      || '',
    action:              document.getElementById('sf-action')?.value?.trim()    || '',
    result:              document.getElementById('sf-result')?.value?.trim()    || '',
    reflection:          document.getElementById('sf-reflection')?.value?.trim()|| '',
    civilianFrame:       document.getElementById('sf-civilian')?.value?.trim()  || '',
    linkedAchievementId: achId || '',
    confidence:          parseInt(document.getElementById('sf-confidence')?.value||'1'),
    practiceCount:       0,
    lastPracticed:       null,
    source:              'manual',
    dateAdded:           new Date().toISOString()
  };

  setState({ stories: [...(state.stories||[]), story], ui: { ...state.ui, addStory: false } });
  showToast('📖 Story saved');
}

function updateStory(sid) {
  const title    = document.getElementById('sf-title')?.value?.trim();
  const category = document.getElementById('sf-category')?.value;
  if (!title)    { showToast('Title required', false); return; }
  if (!category) { showToast('Select a category', false); return; }

  const existing = (state.stories||[]).find(s=>s.id===sid) || {};
  const achId    = document.getElementById('sf-achievement')?.value || existing.linkedAchievementId || '';

  const updated = {
    ...existing, id: sid, title, category,
    question:            CATEGORY_MAP[category]?.question || existing.question || '',
    situation:           document.getElementById('sf-situation')?.value?.trim()  || existing.situation   || '',
    task:                document.getElementById('sf-task')?.value?.trim()       || existing.task        || '',
    action:              document.getElementById('sf-action')?.value?.trim()     || existing.action      || '',
    result:              document.getElementById('sf-result')?.value?.trim()     || existing.result      || '',
    reflection:          document.getElementById('sf-reflection')?.value?.trim() || existing.reflection  || '',
    civilianFrame:       document.getElementById('sf-civilian')?.value?.trim()   || existing.civilianFrame || '',
    linkedAchievementId: achId,
    confidence:          parseInt(document.getElementById('sf-confidence')?.value||String(existing.confidence||1))
  };

  setState({
    stories: (state.stories||[]).map(s=>s.id===sid?updated:s),
    ui: { ...state.ui, editStoryId: null }
  });
  showToast('✓ Story updated');
}

function removeStory(sid) {
  if (!confirm('Delete this story?')) return;
  setState({ stories: (state.stories||[]).filter(s=>s.id!==sid) });
  showToast('Removed');
}

function setStoryConfidence(sid, conf) {
  setState({
    stories: (state.stories||[]).map(s=>s.id===sid?{...s,confidence:conf}:s)
  });
}

function revealStoryAnswer(sid) {
  toggleUI('practiceRevealed', true);
}

function logPractice(sid, conf) {
  const stories = (state.stories||[]).map(s => s.id===sid ? {
    ...s,
    confidence:    conf,
    practiceCount: (s.practiceCount||0) + 1,
    lastPracticed: new Date().toISOString()
  } : s);
  setState({ stories, ui: { ...state.ui, practiceStoryId: null, practiceRevealed: false } });
  showToast(conf >= 4 ? '🎉 Great practice session!' : '✓ Logged — keep practicing');
}

// ── AI: Generate stories from achievements ─────────────────────────────

async function generateStoriesFromAchievements() {
  const achievements = state.achievements || [];
  if (!achievements.length) { showToast('Add achievements first', false); return; }

  const existingCategories = new Set((state.stories||[]).map(s=>s.category));
  const missingCategories  = STORY_CATEGORIES.filter(c=>!existingCategories.has(c.id));

  if (!missingCategories.length) {
    showToast('All 12 question types are already covered!'); return;
  }

  showToast('🤖 Generating stories from your achievements...', true);
  const p = state.profile;

  const achContext = achievements.slice(0,8).map(a =>
    `• ${a.title}${a.metric?` [${a.metric}]`:''}: ${a.situation||''} ${a.action||''} ${a.result||''} ${a.civilianTranslation||''}`
  ).join('\n');

  try {
    const raw = await callClaude(
      `You write STAR+R behavioral interview stories for transitioning military veterans. STAR+R = Situation, Task, Action, Result, Reflection. The Reflection (+R) is critical — it shows self-awareness and growth mindset that civilian interviewers value highly. Every story must be specific, first-person, and include at least one metric.`,
      `Generate STAR+R interview stories for this veteran using their achievements as source material.

VETERAN:
Branch: ${p.branch||'Military'} | Rank: ${p.rank||'N/A'} | Years: ${p.yearsOfService||'N/A'}
MOS/Rate: ${p.mosRate||'N/A'}

ACHIEVEMENTS LIBRARY:
${achContext}

GENERATE STORIES FOR THESE MISSING QUESTION TYPES:
${missingCategories.slice(0,6).map(c=>`- ${c.id}: "${c.question}"`).join('\n')}

RULES:
- Each story MUST use specific details from the achievements library — no generic answers
- Every story must have a metric in the Result section
- The Reflection must be 2-3 sentences — what they learned, what they'd do differently
- The civilian framing must be jargon-free
- Action must be first-person ("I did X") not "we" or "the team"
- Draw from the most relevant achievement for each question type

Return ONLY this JSON array (no markdown):
[
  {
    "category":      "exact category id from the list above",
    "title":         "Short memorable story title — 5-8 words",
    "situation":     "2-3 sentences. Scene-setting. What was happening and what was at stake.",
    "task":          "1-2 sentences. What YOU specifically needed to accomplish.",
    "action":        "3-4 sentences. What YOU did. First person. Specific steps. No 'we.'",
    "result":        "1-2 sentences. The outcome. Include the metric.",
    "reflection":    "2-3 sentences. What you learned. What you'd do differently. How you grew.",
    "civilianFrame": "1 sentence. How to describe the context to someone with no military background."
  }
]`
    );

    let generated;
    try {
      generated = typeof extractJSON === 'function'
        ? extractJSON(raw)
        : JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) { throw new Error('Could not parse results. Try again.'); }

    const newStories = generated.map(s => ({
      ...s,
      id:                  id(),
      question:            CATEGORY_MAP[s.category]?.question || '',
      linkedAchievementId: '',
      confidence:          2,
      practiceCount:       0,
      lastPracticed:       null,
      source:              'AI:generate',
      dateAdded:           new Date().toISOString()
    }));

    setState({ stories: [...(state.stories||[]), ...newStories] });
    showToast(`✓ Generated ${newStories.length} stories — practice and refine them`);
  } catch(err) {
    showToast('Error: ' + err.message, false);
  }
}

async function generateAllStories() {
  const existing = new Set((state.stories||[]).map(s=>s.category));
  const missing  = STORY_CATEGORIES.filter(c=>!existing.has(c.id));
  if (!missing.length) { showToast('All 12 types covered!'); return; }
  await generateStoriesFromAchievements();
}

async function generateSingleStory() {
  const title    = document.getElementById('sf-title')?.value?.trim()    || '';
  const category = document.getElementById('sf-category')?.value         || '';
  const achId    = document.getElementById('sf-achievement')?.value      || '';
  if (!category) { showToast('Select a category first', false); return; }

  const cat = CATEGORY_MAP[category];
  const linkedAch = achId ? (state.achievements||[]).find(a=>a.id===achId) : null;
  const p = state.profile;

  showToast('🤖 Generating story...', true);
  try {
    const raw = await callClaude(
      'You write specific, metric-driven STAR+R behavioral interview stories for transitioning military veterans. Return JSON only.',
      `Generate a STAR+R interview story for this veteran.

VETERAN: ${p.branch||'Military'} | ${p.rank||'N/A'} | ${p.yearsOfService||'N/A'} years | ${p.mosRate||'N/A'}

QUESTION TYPE: ${cat.label}
QUESTION: "${cat.question}"
${linkedAch ? `SOURCE ACHIEVEMENT: ${linkedAch.title} [${linkedAch.metric||''}] — ${linkedAch.result||''}` : ''}
${title ? `STORY TITLE HINT: ${title}` : ''}

Return ONLY this JSON:
{
  "title":         "Story title, 5-8 words",
  "situation":     "2-3 sentences. Scene-setting.",
  "task":          "1-2 sentences. What YOU needed to accomplish.",
  "action":        "3-4 sentences. First person. Specific steps.",
  "result":        "1-2 sentences. Include a metric.",
  "reflection":    "2-3 sentences. What you learned. What you'd do differently.",
  "civilianFrame": "1 sentence. Jargon-free context."
}`
    );

    let data;
    try {
      data = typeof extractJSON === 'function'
        ? extractJSON(raw)
        : JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) { throw new Error('Parse error. Try again.'); }

    // Pre-fill form
    const fields = ['title','situation','task','action','result','reflection'];
    fields.forEach(f => {
      const el = document.getElementById(`sf-${f}`);
      if (el && data[f]) el.value = data[f];
    });
    const civ = document.getElementById('sf-civilian');
    if (civ && data.civilianFrame) civ.value = data.civilianFrame;

    showToast('✓ Generated — review and save');
  } catch(err) {
    showToast('Error: ' + err.message, false);
  }
}

// ── Context builder — called by interview prep ─────────────────────────

function buildStoriesContext(maxStories = 6) {
  const stories = state.stories || [];
  if (!stories.length) return '';

  // Prioritize high-confidence, practiced stories
  const top = [...stories]
    .sort((a,b) => {
      const scoreA = (a.confidence||1)*2 + (a.practiceCount||0)*0.5;
      const scoreB = (b.confidence||1)*2 + (b.practiceCount||0)*0.5;
      return scoreB - scoreA;
    })
    .slice(0, maxStories);

  return `\nPRACTICED INTERVIEW STORIES (draw from these for behavioral answers):\n` +
    top.map(s => {
      const cat = CATEGORY_MAP[s.category];
      return `• [${cat?.label||s.category}] ${s.title}: ${s.result||''}${s.reflection?' | Reflection: '+s.reflection.slice(0,80)+'...':''}`;
    }).join('\n');
}
