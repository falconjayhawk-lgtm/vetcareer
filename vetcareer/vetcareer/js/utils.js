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

