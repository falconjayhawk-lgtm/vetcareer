// ── resume-compare.js — Resume Version Comparison ─────────────────────
//
// Side-by-side comparison of two saved resume versions with word-level
// diff highlighting. Accessible from the Resume Builder saved versions
// panel when ≥2 versions exist for a job.
//
// State: state.ui.compareJobId, state.ui.compareV1, state.ui.compareV2
// ──────────────────────────────────────────────────────────────────────

function renderResumeCompare() {
  const jobId = state.ui.compareJobId;
  const job   = jobId ? state.jobs.find(j => j.id === jobId) : null;

  // If no job pre-selected, show picker
  if (!job) {
    const jobsWithVersions = state.jobs.filter(j => (j.resumeVersions||[]).length >= 2);
    return `
      <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent)">📊 Resume Version Comparison</h1>
      <p style="color:var(--muted);font-size:13px;margin:0 0 20px">Compare two saved resume versions side by side — see exactly what changed between drafts.</p>

      ${jobsWithVersions.length === 0 ? `
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:32px;margin-bottom:12px">📄</div>
        <div style="font-weight:700;font-size:15px;color:var(--accent);margin-bottom:8px">No jobs with multiple versions yet</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:16px">Generate and save at least two resume versions for a job to use this tool.</div>
        <button class="btn btn-primary" onclick="setState({view:'resume'})">Go to Resume Builder</button>
      </div>` : `
      <div class="card">
        <h2>Select a Job</h2>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${jobsWithVersions.map(j => `
            <div class="card" style="margin-bottom:0;cursor:pointer;border:2px solid var(--rule-dark)"
              onclick="toggleUI('compareJobId','${j.id}');toggleUI('compareV1','${j.resumeVersions[j.resumeVersions.length-1].id}');toggleUI('compareV2','${j.resumeVersions[j.resumeVersions.length-2].id}')">
              <div style="font-weight:700;font-size:14px;color:var(--accent)">${esc(j.title)}</div>
              <div style="font-size:12px;color:var(--muted)">${esc(j.company)} · ${j.resumeVersions.length} saved versions</div>
            </div>`).join('')}
        </div>
      </div>`}`;
  }

  const versions  = job.resumeVersions || [];
  const v1Id      = state.ui.compareV1 || versions[versions.length-1]?.id;
  const v2Id      = state.ui.compareV2 || versions[versions.length-2]?.id;
  const v1        = versions.find(v => v.id === v1Id);
  const v2        = versions.find(v => v.id === v2Id);
  const viewMode  = state.ui.compareViewMode || 'split'; // split | unified

  return `
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;flex-wrap:wrap">
      <button onclick="toggleUI('compareJobId',null)" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;padding:0">← Back</button>
      <span style="color:var(--rule-dark)">·</span>
      <h1 style="font-size:22px;font-weight:800;margin:0;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">📊 Resume Comparison</h1>
    </div>
    <div style="font-size:13px;color:var(--muted);margin:0 0 20px">
      <strong>${esc(job.title)}</strong> at <strong>${esc(job.company)}</strong> · ${versions.length} saved versions
    </div>

    <!-- Version selector -->
    <div class="card">
      <div style="display:flex;gap:16px;align-items:end;flex-wrap:wrap">
        <div class="field" style="margin:0;flex:1;min-width:200px">
          <label class="field-label" style="color:var(--red)">◀ Version A (older)</label>
          <select onchange="toggleUI('compareV1',this.value)" style="font-size:13px;border-color:var(--red)30">
            ${versions.map(v => `<option value="${v.id}" ${v.id===v1Id?'selected':''}>${esc(v.label||'Version')} — ${esc(v.fmt||'professional')} format${v.ats?.score?' · ATS '+v.ats.score:''}</option>`).join('')}
          </select>
        </div>
        <div style="font-size:20px;color:var(--muted);padding-bottom:8px">⟷</div>
        <div class="field" style="margin:0;flex:1;min-width:200px">
          <label class="field-label" style="color:var(--green)">▶ Version B (newer)</label>
          <select onchange="toggleUI('compareV2',this.value)" style="font-size:13px;border-color:var(--green)30">
            ${versions.map(v => `<option value="${v.id}" ${v.id===v2Id?'selected':''}>${esc(v.label||'Version')} — ${esc(v.fmt||'professional')} format${v.ats?.score?' · ATS '+v.ats.score:''}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:0;border-radius:2px;overflow:hidden;border:1.5px solid var(--rule-dark);flex-shrink:0">
          <button onclick="toggleUI('compareViewMode','split')" style="padding:8px 14px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;background:${viewMode==='split'?'var(--accent)':'white'};color:${viewMode==='split'?'white':'var(--muted)'}">Split</button>
          <button onclick="toggleUI('compareViewMode','unified')" style="padding:8px 14px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;background:${viewMode==='unified'?'var(--accent)':'white'};color:${viewMode==='unified'?'white':'var(--muted)'};border-left:1.5px solid var(--rule-dark)">Unified</button>
        </div>
      </div>
    </div>

    ${v1Id === v2Id ? `
    <div class="card" style="text-align:center;padding:24px;color:var(--muted)">
      Select two different versions to compare.
    </div>` : renderComparison(v1, v2, viewMode)}`;
}

// ── Comparison renderer ────────────────────────────────────────────────

function renderComparison(v1, v2, viewMode) {
  if (!v1 || !v2) return `<div class="card" style="color:var(--muted);text-align:center;padding:24px">One or both versions not found.</div>`;

  const text1 = v1.resume || v1.text || v1.content || '';
  const text2 = v2.resume || v2.text || v2.content || '';

  if (!text1 && !text2) return `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light)">
      <h2>Resume text not stored in these versions</h2>
      <p style="font-size:13px;color:var(--text)">
        These versions were saved before the comparison feature was added.
        Generate new versions going forward — they'll include the full text for comparison.
      </p>
    </div>`;

  // Metadata comparison
  const metaRow = (label, val1, val2, higher='neutral') => {
    const changed = val1 !== val2;
    const color = !changed ? 'var(--muted)' :
      higher === 'higher' ? (parseFloat(val2) > parseFloat(val1) ? 'var(--green)' : 'var(--red)') :
      'var(--gold)';
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--rule)">
        <div style="font-size:11px;font-weight:700;color:var(--muted);font-family:'Familjen Grotesk',sans-serif;text-transform:uppercase;letter-spacing:0.06em">${label}</div>
        <div style="display:flex;gap:24px;font-size:12px">
          <span style="color:var(--red)">${esc(val1||'—')}</span>
          <span style="color:var(--dim)">→</span>
          <span style="color:${color};font-weight:${changed?'700':'400'}">${esc(val2||'—')}${changed&&higher==='higher'&&parseFloat(val2)>parseFloat(val1)?' ↑':changed&&higher==='higher'?' ↓':''}</span>
        </div>
      </div>`;
  };

  const meta = `
    <div class="card" style="margin-bottom:16px">
      <h2>Version Metadata</h2>
      ${metaRow('Format',    v1.fmt||'professional', v2.fmt||'professional')}
      ${metaRow('ATS Score', v1.ats?.score ? v1.ats.score+'/100' : 'N/A', v2.ats?.score ? v2.ats.score+'/100' : 'N/A', 'higher')}
      ${metaRow('Label',     v1.label||'Version A',  v2.label||'Version B')}
      ${metaRow('Word Count',countWords(text1).toString(), countWords(text2).toString(), 'neutral')}
    </div>`;

  if (viewMode === 'split') {
    return meta + `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="background:var(--red);color:white;font-family:'Familjen Grotesk',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 12px;border-radius:2px 2px 0 0">
            ◀ Version A — ${esc(v1.label||'Older')}
          </div>
          <div style="background:white;border:1px solid var(--rule-dark);border-top:none;border-radius:0 0 2px 2px;padding:16px;font-family:Georgia,serif;font-size:11pt;line-height:1.7;white-space:pre-wrap;max-height:600px;overflow-y:auto;color:var(--text)">
            ${renderDiffText(text1, text2, 'removed')}
          </div>
        </div>
        <div>
          <div style="background:var(--green);color:white;font-family:'Familjen Grotesk',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 12px;border-radius:2px 2px 0 0">
            ▶ Version B — ${esc(v2.label||'Newer')}
          </div>
          <div style="background:white;border:1px solid var(--rule-dark);border-top:none;border-radius:0 0 2px 2px;padding:16px;font-family:Georgia,serif;font-size:11pt;line-height:1.7;white-space:pre-wrap;max-height:600px;overflow-y:auto;color:var(--text)">
            ${renderDiffText(text2, text1, 'added')}
          </div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--dim);margin-top:8px;text-align:center">
        <span style="background:#ffe0e0;padding:1px 6px;border-radius:2px;margin-right:8px">Red = only in Version A</span>
        <span style="background:#e0ffe0;padding:1px 6px;border-radius:2px">Green = only in Version B</span>
      </div>`;
  }

  // Unified diff view
  return meta + `
    <div class="card">
      <h2>Unified Diff</h2>
      <div style="font-family:'DM Mono',monospace;font-size:12px;line-height:1.7;white-space:pre-wrap;background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:16px;max-height:700px;overflow-y:auto">
        ${renderUnifiedDiff(text1, text2)}
      </div>
      <div style="font-size:11px;color:var(--dim);margin-top:8px">
        <span style="background:#ffe0e0;padding:1px 6px;border-radius:2px;margin-right:8px">− Removed from A</span>
        <span style="background:#e0ffe0;padding:1px 6px;border-radius:2px">+ Added in B</span>
      </div>
    </div>`;
}

// ── Word-level diff engine ─────────────────────────────────────────────

function diffWords(text1, text2) {
  const words1 = tokenize(text1);
  const words2 = tokenize(text2);
  const lcs    = computeLCS(words1, words2);
  return { words1, words2, lcs };
}

function tokenize(text) {
  // Split on word boundaries, preserving whitespace and punctuation as tokens
  return text.split(/(\s+|[.,!?;:()[\]{}"'—–-])/g).filter(t => t !== undefined);
}

function computeLCS(a, b) {
  // Standard LCS dynamic programming
  // For performance, cap at 2000 tokens each
  const A = a.slice(0, 2000);
  const B = b.slice(0, 2000);
  const m = A.length, n = B.length;
  const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (A[i-1] === B[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  // Backtrack
  const lcs = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (A[i-1] === B[j-1]) { lcs.unshift({a:i-1,b:j-1}); i--; j--; }
    else if (dp[i-1][j] > dp[i][j-1]) i--;
    else j--;
  }
  return lcs;
}

function renderDiffText(primary, other, mode) {
  // mode: 'removed' (show primary with removals highlighted) or 'added' (show primary with additions highlighted)
  const { words1, words2, lcs } = diffWords(primary, other);
  const words = mode === 'removed' ? words1 : words2;
  const lcsSet = new Set(lcs.map(p => mode === 'removed' ? p.a : p.b));

  let html = '';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const inLCS = lcsSet.has(i);
    if (!inLCS && word.trim()) {
      const color = mode === 'removed' ? '#dc2626' : '#16a34a';
      const bg    = mode === 'removed' ? '#ffe0e0' : '#e0ffe0';
      html += `<span style="background:${bg};color:${color};border-radius:2px;padding:0 1px">${escHtml(word)}</span>`;
    } else {
      html += escHtml(word);
    }
  }
  return html;
}

function renderUnifiedDiff(text1, text2) {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');

  // Line-level LCS for unified diff
  const lcs = computeLCS(lines1, lines2);
  const lcs1 = new Set(lcs.map(p => p.a));
  const lcs2 = new Set(lcs.map(p => p.b));

  let html = '';
  let i = 0, j = 0;
  let lcsIdx = 0;

  while (i < lines1.length || j < lines2.length) {
    if (lcsIdx < lcs.length && i === lcs[lcsIdx].a && j === lcs[lcsIdx].b) {
      html += `<span style="color:var(--muted)">  ${escHtml(lines1[i])}\n</span>`;
      i++; j++; lcsIdx++;
    } else {
      if (i < lines1.length && !lcs1.has(i)) {
        html += `<span style="background:#ffe0e0;color:#dc2626;display:block">− ${escHtml(lines1[i])}\n</span>`;
        i++;
      }
      if (j < lines2.length && !lcs2.has(j)) {
        html += `<span style="background:#e0ffe0;color:#16a34a;display:block">+ ${escHtml(lines2[j])}\n</span>`;
        j++;
      }
      if (i < lines1.length && lcs1.has(i) && j < lines2.length && lcs2.has(j)) {
        // Both in LCS but lcsIdx hasn't caught up — advance both
        i++; j++; lcsIdx++;
      }
    }
  }
  return html || '<span style="color:var(--muted)">No differences found.</span>';
}

function escHtml(str) {
  return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function countWords(text) {
  return (text||'').split(/\s+/).filter(Boolean).length;
}

// ── Entry point — called from Resume Builder's saved versions panel ───
// Adds a "Compare Versions" button when ≥2 versions exist

function openResumeCompare(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job || (job.resumeVersions||[]).length < 2) {
    showToast('Need at least 2 saved versions to compare', false); return;
  }
  const versions = job.resumeVersions;
  setState({
    view: 'resume-compare',
    ui: {
      ...state.ui,
      compareJobId: jobId,
      compareV1: versions[versions.length-2].id,
      compareV2: versions[versions.length-1].id,
      compareViewMode: 'split'
    }
  });
}
