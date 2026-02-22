function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : ''; }
function id() { return Date.now() + Math.random().toString(36).slice(2); }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function statusBadge(status) {
  const cfg = { interested:'background:#e5e7eb;color:#374151', applied:'background:#dbeafe;color:#1d4ed8', interviewing:'background:#ede9fe;color:#6d28d9', offered:'background:#dcfce7;color:#15803d', rejected:'background:#fee2e2;color:#dc2626', withdrawn:'background:#fef9c3;color:#a16207' };
  return `<span class="badge" style="${cfg[status]||cfg.interested}">${status.charAt(0).toUpperCase()+status.slice(1)}</span>`;
}

