// ── Utilities ─────────────────────────────────────────────────────────
function toggleUI(key, value) {
  const newUI = { ...state.ui };
  if (value === undefined) newUI[key] = !newUI[key];
  else newUI[key] = value;
  setState({ ui: newUI });
}
function showToast(msg, success = true) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:20px;right:20px;background:${success ? '#1a3a6b' : '#8b1a1a'};color:white;padding:10px 20px;border-radius:2px;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;z-index:9999;box-shadow:4px 4px 0 rgba(0,0,0,0.2);border-left:3px solid ${success ? '#b8860b' : '#e8c0c0'}`;
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
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;margin:20px 0 8px;color:var(--accent)">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px;color:var(--accent)">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--rule-dark);margin:16px 0">')
    .replace(/^[*-] (.+)$/gm, '<li style="margin:4px 0">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => `<ul style="margin:8px 0 8px 20px;padding:0">${m}</ul>`)
    .replace(/(https?:\/\/[^\s&]+)/g, '<a href="$1" target="_blank" style="color:var(--accent);text-decoration:underline;word-break:break-all">$1</a>')
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p style="margin:0 0 8px">').replace(/$/, '</p>');
}
