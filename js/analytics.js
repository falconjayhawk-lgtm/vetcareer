// ── AfterAction Analytics — lightweight feature usage tracking ─────────
// Tracks which features are used. No PII, no session data, just counters.
// Events fire on nav click and key actions. Data lives in Cloudflare KV.

const TRACKED_VIEWS = {
  dashboard:  'Dashboard',
  documents:  'Upload Docs',
  profile:    'Profile',
  experience: 'Experience',
  jobs:       'Job Tracker',
  scout:      'Job Scout',
  resume:     'Resume Builder',
  linkedin:   'LinkedIn Generator',
  interview:  'Interview Prep',
  salary:     'Salary Intel',
  network:    'Networking Emails',
  refletter:  'Reference Letter',
  sf86:       'SF-86 Prep',
  gap:        'Gap Analysis',
  settings:   'Settings',
  faq:        'Help & FAQ',
};

const TRACKED_ACTIONS = {
  resume_generate:    'Resume Generated',
  linkedin_generate:  'LinkedIn Generated',
  interview_generate: 'Interview Prep Generated',
  salary_generate:    'Salary Report Generated',
  network_generate:   'Networking Email Generated',
  refletter_generate: 'Reference Letter Generated',
  scout_search:       'Job Scout Search Run',
  doc_upload:         'Document Uploaded',
  doc_paste:          'Document Pasted',
  job_added:          'Job Added to Tracker',
  gap_analyze:        'Gap Analysis Run',
  feedback_sent:      'Feedback Submitted',
};

// Called on every view change — tracks navigation
function trackView(viewId) {
  if (!TRACKED_VIEWS[viewId]) return;
  _sendAnalyticEvent('view', viewId);
}

// Called on key feature completions
function trackAction(actionId) {
  if (!TRACKED_ACTIONS[actionId]) return;
  _sendAnalyticEvent('action', actionId);
}

async function _sendAnalyticEvent(type, key) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await fetch(`https://vetcareer-api.falconjayhawk.workers.dev/api/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getClerkToken()}`
      },
      body: JSON.stringify({ type, key, date: today })
    });
  } catch(e) {
    // Analytics failure is always silent — never interrupt the user
  }
}
