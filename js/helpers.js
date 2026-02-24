function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : ''; }
function id() { return Date.now() + Math.random().toString(36).slice(2); }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function statusBadge(status) {
  const cfg = { interested:'background:#e5e7eb;color:#374151', applied:'background:#dbeafe;color:#1d4ed8', interviewing:'background:#ede9fe;color:#6d28d9', offered:'background:#dcfce7;color:#15803d', rejected:'background:#fee2e2;color:#dc2626', withdrawn:'background:#fef9c3;color:#a16207' };
  return `<span class="badge" style="${cfg[status]||cfg.interested}">${status.charAt(0).toUpperCase()+status.slice(1)}</span>`;
}


// Robust JSON extractor — handles markdown fences, preamble text, and trailing commentary
function extractJSON(raw) {
  if (!raw) throw new Error('Empty response from AI');
  // Strip markdown code fences
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Try direct parse first
  try { return JSON.parse(cleaned); } catch(e) {}
  // Find the outermost { } block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch(e) {}
  }
  // Find outermost [ ] block
  const astart = cleaned.indexOf('[');
  const aend = cleaned.lastIndexOf(']');
  if (astart !== -1 && aend !== -1 && aend > astart) {
    try { return JSON.parse(cleaned.slice(astart, aend + 1)); } catch(e) {}
  }
  throw new Error('Could not parse AI response. Try again.');
}
