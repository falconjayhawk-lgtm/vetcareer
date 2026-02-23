// ── Utilities ─────────────────────────────────────────────────────────
function toggleUI(key, value) {
  const newUI = { ...state.ui };
  if (value === undefined) newUI[key] = !newUI[key];
  else newUI[key] = value;
  setState({ ui: newUI });
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1d4ed8;color:white;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2)';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function bindEvents() {
  // Enter key on login
  const loginInput = document.getElementById('login-email');
  if (loginInput) loginInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
}

// ── Mobile Nav ───────────────────────────────────────────────────────────
function openNav() {
  document.querySelector('.sidebar').classList.add('open');
  document.getElementById('nav-overlay').classList.add('show');
}
function closeNav() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('nav-overlay').classList.remove('show');
}

// ── Init ──────────────────────────────────────────────────────────────
loadState();
render();


// ── Markdown to HTML renderer (for Scout results) ─────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  return text
    // Escape HTML first to prevent XSS, but we'll re-add our own tags
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // H2 headers: ## text
    .replace(/^## (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;margin:20px 0 8px;color:#1e3a5f">$1</h3>')
    // H3 headers: ### text
    .replace(/^### (.+)$/gm, '<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px;color:#1e3a5f">$1</h4>')
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Horizontal rule: ---
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">')
    // Bullet points: * text or - text
    .replace(/^[*-] (.+)$/gm, '<li style="margin:4px 0">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => `<ul style="margin:8px 0 8px 20px;padding:0">${m}</ul>`)
    // URLs: make them clickable
    .replace(/(https?:\/\/[^\s&]+)/g, '<a href="$1" target="_blank" style="color:#2563eb;text-decoration:underline;word-break:break-all">$1</a>')
    // Line breaks: double newline = paragraph break
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    // Single newlines
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^/, '<p style="margin:0 0 8px">').replace(/$/, '</p>');
}
