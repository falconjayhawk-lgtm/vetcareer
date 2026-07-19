// ── State ─────────────────────────────────────────────────────────────
let state = {
  loggedIn: false,
  clerkUserId: '',
  view: 'dashboard',
  profile: { fullName:'', email:'', phone:'', location:'', linkedin:'', branch:'', rank:'', yearsOfService:'', mosRate:'', clearance:'', clearanceStatus:'', workPreference:'', willingToRelocate:'', targetLocations:'', targetIndustries:[], technicalSkills:[], softSkills:[], education:'', certifications:'', training:'', elevatorPitch:'' },
  assignments: [],
  civilianJobs: [],
  awards: [],
  achievements: [],
  stories: [],     // STAR+R behavioral interview story bank
  timeline: { separationDate: '', separationType: '', milestones: [] },
  vaClaim: { filingStatus:'', separationDate:'', conditions:[], examDate:'', ratingReceived:null },
  networkContacts: [],
  logbookChecklist: {},
  documents: [],
  jobs: [],
  apiKey: '',
  checklist: {},
  scoutFilters: { roleTypes:'', domains:'', geography:'', exclusions:'', companies:'', seniority:'', additionalContext:'' },
  sf86: { residences:[], employers:[], references:[], foreignContacts:[], foreignTravel:[], relatives:[], notes:'' },
  access: { plan:'free', proUntil:null, promoCode:null },
  ui: {}
};

function loadState() {
  try {
    const keys = ['profile','assignments','civilianJobs','awards','achievements','stories','timeline','vaClaim','networkContacts','logbookChecklist','documents','jobs','apiKey','checklist','scoutFilters','sf86','access'];
    keys.forEach(k => {
      const v = localStorage.getItem('vc_' + k);
      if (v) state[k] = JSON.parse(v);
    });
  } catch(e) {}
}

function saveKey(k) {
  try { localStorage.setItem('vc_' + k, JSON.stringify(state[k])); } catch(e) {}
}

function setState(updates, shouldRender=true) {
  Object.assign(state, updates);
  if (updates.profile !== undefined)      saveKey('profile');
  if (updates.assignments !== undefined)  saveKey('assignments');
  if (updates.civilianJobs !== undefined) saveKey('civilianJobs');
  if (updates.awards !== undefined)       saveKey('awards');
  if (updates.achievements !== undefined) saveKey('achievements');
  if (updates.stories !== undefined)      saveKey('stories');
  if (updates.timeline !== undefined)     saveKey('timeline');
  if (updates.vaClaim !== undefined)      saveKey('vaClaim');
  if (updates.networkContacts !== undefined)  saveKey('networkContacts');
  if (updates.logbookChecklist !== undefined) saveKey('logbookChecklist');
  if (updates.documents !== undefined)    saveKey('documents');
  if (updates.jobs !== undefined)         saveKey('jobs');
  if (updates.apiKey !== undefined)       saveKey('apiKey');
  if (updates.checklist !== undefined)    saveKey('checklist');
  if (updates.scoutFilters !== undefined) saveKey('scoutFilters');
  if (updates.sf86 !== undefined)         saveKey('sf86');
  if (updates.access !== undefined)       saveKey('access');
  if (shouldRender) render();
}
