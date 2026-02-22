// ── State ─────────────────────────────────────────────────────────────
let state = {
  loggedIn: false,
  view: 'dashboard',
  profile: { fullName:'', email:'', phone:'', location:'', linkedin:'', branch:'', rank:'', yearsOfService:'', mosRate:'', clearance:'', clearanceStatus:'', workPreference:'', willingToRelocate:'', targetLocations:'', targetIndustries:[], technicalSkills:[], softSkills:[], education:'', certifications:'', elevatorPitch:'' },
  assignments: [],
  civilianJobs: [],
  awards: [],
  documents: [],
  jobs: [],
  apiKey: '',
  checklist: {},
  scoutFilters: {
    roleTypes: '',
    domains: '',
    geography: '',
    exclusions: '',
    companies: '',
    seniority: '',
    additionalContext: ''
  },
  sf86: {
    residences: [],
    employers: [],
    references: [],
    foreignContacts: [],
    foreignTravel: [],
    relatives: [],
    notes: ''
  },
  supabase: { url: '', anonKey: '', userId: '', syncing: false, lastSync: null, syncError: '' },
  // UI state
  ui: {}
};

function loadState() {
  try {
    const keys = ['profile','assignments','civilianJobs','awards','documents','jobs','apiKey','checklist','scoutFilters','sf86','supabase'];
    keys.forEach(k => {
      const v = localStorage.getItem('vc_' + k);
      if (v) state[k] = JSON.parse(v);
    });
  } catch(e) {}
}

function saveKey(k) {
  try { localStorage.setItem('vc_' + k, JSON.stringify(state[k])); } catch(e) {}
}

function setState(updates) {
  Object.assign(state, updates);
  if (updates.profile !== undefined) { saveKey('profile'); scheduleSync(); }
  if (updates.assignments !== undefined) { saveKey('assignments'); scheduleSync(); }
  if (updates.civilianJobs !== undefined) { saveKey('civilianJobs'); scheduleSync(); }
  if (updates.awards !== undefined) { saveKey('awards'); scheduleSync(); }
  if (updates.documents !== undefined) { saveKey('documents'); scheduleSync(); }
  if (updates.jobs !== undefined) { saveKey('jobs'); scheduleSync(); }
  if (updates.apiKey !== undefined) saveKey('apiKey');
  if (updates.checklist !== undefined) { saveKey('checklist'); scheduleSync(); }
  if (updates.scoutFilters !== undefined) { saveKey('scoutFilters'); scheduleSync(); }
  if (updates.sf86 !== undefined) { saveKey('sf86'); scheduleSync(); }
  if (updates.supabase !== undefined) saveKey('supabase');
  render();
}

// Debounced sync — waits 2s after last change before syncing to avoid hammering Supabase
let syncTimer = null;
function scheduleSync() {
  if (!state.supabase?.url || !state.supabase?.anonKey || !state.supabase?.userId) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncToSupabase(false), 2000);
}

