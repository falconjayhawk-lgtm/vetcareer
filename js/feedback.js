// ── Feedback Widget ────────────────────────────────────────────────────
// Floating button + modal, no backend required

function initFeedback() {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #fb-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 1000;
      background: linear-gradient(135deg, #2563eb, #4338ca);
      color: white; border: none; border-radius: 999px;
      padding: 10px 18px; font-size: 13px; font-weight: 700;
      cursor: pointer; box-shadow: 0 4px 16px rgba(37,99,235,0.4);
      display: flex; align-items: center; gap: 7px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    #fb-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.5); }
    #fb-overlay {
      display: none; position: fixed; inset: 0; z-index: 1001;
      background: rgba(0,0,0,0.45); align-items: center; justify-content: center;
    }
    #fb-overlay.open { display: flex; }
    #fb-modal {
      background: white; border-radius: 16px; padding: 28px;
      width: 420px; max-width: calc(100vw - 32px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: fbSlideIn 0.2s ease;
    }
    @keyframes fbSlideIn { from { transform: translateY(12px); opacity:0; } to { transform: translateY(0); opacity:1; } }
    #fb-modal h3 { font-size: 17px; font-weight: 800; margin: 0 0 4px; color: #111827; }
    #fb-modal p.sub { font-size: 13px; color: #6b7280; margin: 0 0 18px; }
    .fb-cats { display: flex; gap: 7px; margin-bottom: 14px; flex-wrap: wrap; }
    .fb-cat {
      padding: 6px 14px; border-radius: 999px; border: 1.5px solid #e5e7eb;
      font-size: 12px; font-weight: 600; cursor: pointer; background: white;
      color: #6b7280; transition: all 0.15s;
    }
    .fb-cat.active { background: #eff6ff; border-color: #2563eb; color: #1d4ed8; }
    #fb-text {
      width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px;
      padding: 10px 12px; font-size: 13px; font-family: inherit;
      resize: vertical; min-height: 100px; outline: none;
      transition: border 0.15s;
    }
    #fb-text:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .fb-actions { display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end; }
    #fb-success { display:none; text-align:center; padding: 16px 0 4px; }
    #fb-success .check { font-size: 36px; margin-bottom: 8px; }
    #fb-success p { color: #16a34a; font-weight: 700; font-size: 15px; margin: 0 0 4px; }
    #fb-success small { color: #6b7280; font-size: 13px; }
  `;
  document.head.appendChild(style);

  // Inject button
  const btn = document.createElement('button');
  btn.id = 'fb-btn';
  btn.innerHTML = '💬 Feedback';
  btn.onclick = openFeedback;
  document.body.appendChild(btn);

  // Inject modal
  const overlay = document.createElement('div');
  overlay.id = 'fb-overlay';
  overlay.innerHTML = `
    <div id="fb-modal">
      <div id="fb-form-view">
        <h3>Send Feedback</h3>
        <p class="sub">Help us improve VetCareer — every note goes directly to the team.</p>
        <div class="fb-cats">
          <button class="fb-cat active" data-cat="Bug Report" onclick="fbSetCat(this)">🐛 Bug Report</button>
          <button class="fb-cat" data-cat="Feature Request" onclick="fbSetCat(this)">💡 Feature Request</button>
          <button class="fb-cat" data-cat="General Feedback" onclick="fbSetCat(this)">💬 General</button>
          <button class="fb-cat" data-cat="Question" onclick="fbSetCat(this)">❓ Question</button>
        </div>
        <textarea id="fb-text" placeholder="Tell us what's on your mind — what's working, what's broken, what would make this more useful for your transition..."></textarea>
        <div class="fb-actions">
          <button class="btn btn-secondary" onclick="closeFeedback()">Cancel</button>
          <button class="btn btn-primary" onclick="submitFeedback()">Send Feedback</button>
        </div>
      </div>
      <div id="fb-success">
        <div class="check">✅</div>
        <p>Feedback sent — thank you!</p>
        <small>We read every submission and use them to prioritize improvements.</small>
        <div style="margin-top:16px">
          <button class="btn btn-secondary" onclick="closeFeedback()">Close</button>
        </div>
      </div>
    </div>
  `;
  overlay.onclick = (e) => { if (e.target === overlay) closeFeedback(); };
  document.body.appendChild(overlay);
}

let _fbCat = 'Bug Report';

function fbSetCat(el) {
  document.querySelectorAll('.fb-cat').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  _fbCat = el.dataset.cat;
}

function openFeedback() {
  document.getElementById('fb-overlay').classList.add('open');
  document.getElementById('fb-form-view').style.display = 'block';
  document.getElementById('fb-success').style.display = 'none';
  document.getElementById('fb-text').value = '';
  setTimeout(() => document.getElementById('fb-text').focus(), 100);
}

function closeFeedback() {
  document.getElementById('fb-overlay').classList.remove('open');
}

function submitFeedback() {
  const text = document.getElementById('fb-text').value.trim();
  if (!text) { document.getElementById('fb-text').focus(); return; }

  // Get basic context (no PII — just feature being used and category)
  const context = {
    category: _fbCat,
    currentView: state?.view || 'unknown',
    timestamp: new Date().toISOString(),
    message: text
  };

  // Primary: mailto (opens email client pre-filled)
  const subject = encodeURIComponent(`VetCareer Feedback: ${_fbCat}`);
  const body = encodeURIComponent(
    `Category: ${context.category}\nPage: ${context.currentView}\nTime: ${context.timestamp}\n\n${text}`
  );
  const mailtoLink = `mailto:falconjayhawk@gmail.com?subject=${subject}&body=${body}`;

  // Also copy to clipboard as backup
  navigator.clipboard?.writeText(
    `VetCareer Feedback\nCategory: ${context.category}\nPage: ${context.currentView}\n\n${text}`
  ).catch(() => {});

  // Open mailto
  window.location.href = mailtoLink;

  // Show success
  document.getElementById('fb-form-view').style.display = 'none';
  document.getElementById('fb-success').style.display = 'block';
}
