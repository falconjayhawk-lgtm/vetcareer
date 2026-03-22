// ── API Configuration ─────────────────────────────────────────────────
// All Claude API calls go through our Cloudflare Worker proxy.
// The Worker verifies the user's session, enforces rate limits,
// and forwards the request to Anthropic using our secret API key.
// Users never need their own API key.
const WORKER_URL = 'https://vetcareer-api.falconjayhawk.workers.dev';

// ── Claude API via Worker ─────────────────────────────────────────────
async function callClaude(system, user) {
  const token = await getClerkToken();
  const res = await fetch(`${WORKER_URL}/api/claude`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ system, user })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  const data = await res.json();
  return data.text;
}

// ── Claude with file (PDF/image) via Worker ───────────────────────────
async function callClaudeWithFile(system, user, base64Data, mimeType) {
  const token = await getClerkToken();
  const res = await fetch(`${WORKER_URL}/api/claude`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      system,
      user,
      fileData: { base64: base64Data, mimeType }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  const data = await res.json();
  return data.text;
}

// Gets the current Clerk session token to authenticate with the Worker
async function getClerkToken() {
  if (!clerkInstance) throw new Error('Not signed in');
  const token = await clerkInstance.session?.getToken();
  if (!token) throw new Error('No active session — please sign in again');
  return token;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Subscription API calls ────────────────────────────────────────────

async function getSubscription() {
  const token = await getClerkToken();
  const res = await fetch(`${WORKER_URL}/api/subscription`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return { tier: 'free', status: 'error' };
  return res.json();
}

async function createCheckout(priceId, email) {
  const token = await getClerkToken();
  const res = await fetch(`${WORKER_URL}/api/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ priceId, email })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Checkout failed. Please try again.');
  }
  return res.json();
}

async function openCustomerPortal() {
  const btn = document.getElementById('manage-billing-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Opening…'; }

  try {
    const token = await getClerkToken();
    const res = await fetch(`${WORKER_URL}/api/customer-portal`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Could not open billing portal.');
    }
    const { url } = await res.json();
    window.location.href = url;
  } catch (err) {
    alert(err.message);
    if (btn) { btn.disabled = false; btn.textContent = '💳 Manage Subscription'; }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────
const INDUSTRIES = [
  // Defense & Government
  { name: 'Defense Contracting', subTypes: ['Business Development', 'Program Management', 'Systems Engineering', 'Operations', 'Consulting', 'Capture Management', 'Proposal Writing', 'Other'] },
  { name: 'Government / Federal', subTypes: ['Program Management', 'Policy & Analysis', 'Contracting / Acquisition', 'Operations', 'Intelligence', 'Foreign Affairs / Diplomacy', 'Other'] },
  { name: 'Intelligence Community', subTypes: ['All-Source Analysis', 'HUMINT', 'SIGINT', 'Geospatial Intelligence', 'Counterintelligence', 'Program Management', 'Other'] },
  { name: 'Law Enforcement / Public Safety', subTypes: ['Criminal Investigation', 'Patrol / Field Operations', 'Administration', 'Training & Instruction', 'Corrections', 'Border & Customs', 'Other'] },
  { name: 'Emergency Management', subTypes: ['Disaster Response', 'FEMA / State Emergency Mgmt', 'Business Continuity', 'Fire Services', 'EMS / Paramedic', 'Crisis Communications', 'Other'] },
  // Technology
  { name: 'Information Technology', subTypes: ['Software Engineering', 'Systems Administration', 'Cloud / DevOps', 'Data / Analytics', 'IT Project Management', 'IT Support / Help Desk', 'Other'] },
  { name: 'Cybersecurity', subTypes: ['Security Operations (SOC)', 'Penetration Testing', 'Compliance & Governance (GRC)', 'Security Engineering', 'Incident Response', 'Threat Intelligence', 'Other'] },
  { name: 'Data Science / AI', subTypes: ['Data Engineering', 'Machine Learning', 'Business Intelligence', 'Data Analysis', 'AI/ML Operations', 'Other'] },
  // Business & Management
  { name: 'Project / Program Management', subTypes: ['IT Project Management', 'Construction PM', 'Agile / Scrum', 'Defense Program Management', 'Operations Program Mgmt', 'Other'] },
  { name: 'Operations Management', subTypes: ['General Operations', 'Process Improvement', 'Facilities Management', 'Quality Assurance', 'Lean / Six Sigma', 'Other'] },
  { name: 'Human Resources', subTypes: ['Talent Acquisition / Recruiting', 'HR Generalist', 'Training & Development', 'Compensation & Benefits', 'HR Leadership', 'Other'] },
  { name: 'Finance & Accounting', subTypes: ['Financial Analysis', 'Accounting', 'Budget Management', 'Risk Management', 'Auditing', 'Investment / Banking', 'Other'] },
  { name: 'Sales & Business Development', subTypes: ['Defense / Government Sales', 'B2B Enterprise Sales', 'Account Management', 'Business Development', 'Capture & Proposals', 'Other'] },
  { name: 'Consulting', subTypes: ['Management Consulting', 'IT Consulting', 'Defense / Government Consulting', 'Strategy', 'Change Management', 'Other'] },
  // Trades & Technical
  { name: 'Logistics & Supply Chain', subTypes: ['Supply Chain Management', 'Procurement / Acquisition', 'Distribution & Warehousing', 'Inventory Management', 'Transportation Management', 'Other'] },
  { name: 'Transportation', subTypes: ['Fleet Management', 'Commercial Trucking (CDL)', 'Aviation / Airline', 'Railroad / Transit', 'Safety & Compliance', 'Other'] },
  { name: 'Construction & Engineering', subTypes: ['Project Management', 'Civil / Structural Engineering', 'Estimating', 'Site Superintendent', 'Safety (OSHA)', 'Other'] },
  { name: 'Manufacturing', subTypes: ['Operations Management', 'Quality Assurance', 'Process / Industrial Engineering', 'Maintenance & Reliability', 'Production Supervision', 'Other'] },
  { name: 'Energy & Utilities', subTypes: ['Power Generation', 'Renewable Energy (Solar/Wind)', 'Oil & Gas', 'Nuclear', 'Utilities Operations', 'Safety & Environmental', 'Other'] },
  { name: 'Aviation & Aerospace', subTypes: ['Commercial Pilot', 'Aviation Maintenance (A&P)', 'Air Traffic Control', 'Unmanned Systems (UAS/Drone)', 'Aerospace Engineering', 'Flight Operations', 'Other'] },
  // Healthcare
  { name: 'Healthcare', subTypes: ['Clinical (Nursing / PA / NP)', 'Healthcare Administration', 'Emergency Medicine / Trauma', 'Medical Devices / Sales', 'Healthcare IT', 'Mental Health Services', 'Other'] },
  // Education & Training
  { name: 'Education & Training', subTypes: ['Instructional Design / eLearning', 'Corporate Training', 'K-12 Teaching', 'Higher Education', 'Curriculum Development', 'Coaching / Mentoring', 'Other'] },
  // Other
  { name: 'Real Estate', subTypes: ['Commercial Real Estate', 'Residential Sales', 'Property Management', 'Real Estate Development', 'Other'] },
  { name: 'Nonprofit / Social Services', subTypes: ['Program Management', 'Veterans Services', 'Community Outreach', 'Development / Fundraising', 'Other'] },
];
const SKILL_RECS = {
  'Defense Contracting':['Security Clearance','ITAR','FAR/DFARS','Program Management','Proposal Writing','CPSR'],
  'Government / Federal':['Security Clearance','Policy Writing','Government Contracting','FAR/DFARS','Budget Management'],
  'Intelligence Community':['TS/SCI Clearance','SIGINT','HUMINT','All-Source Analysis','Palantir','Geospatial Analysis'],
  'Law Enforcement / Public Safety':['Crisis Negotiation','Criminal Law','Community Policing','Use of Force','Investigations'],
  'Emergency Management':['ICS/NIMS','FEMA Training','Crisis Management','Incident Command','Mass Casualty Response'],
  'Information Technology':['AWS','Azure','Python','SQL','ITIL','Linux','Networking','Cloud Architecture'],
  'Cybersecurity':['Security+','CISSP','CISA','Network Security','SIEM','Splunk','Zero Trust','NIST Framework'],
  'Data Science / AI':['Python','SQL','Tableau','Power BI','Machine Learning','Statistics','R','TensorFlow'],
  'Project / Program Management':['PMP','Agile','Scrum','Risk Management','MS Project','PMBOK','SAFe'],
  'Operations Management':['Lean','Six Sigma','Process Improvement','KPI Management','ERP Systems','ISO 9001'],
  'Human Resources':['SHRM-CP','Talent Acquisition','HRIS Systems','Employee Relations','Compensation Analysis'],
  'Finance & Accounting':['Financial Analysis','Excel / Financial Modeling','Budget Management','CPA','CFA','SAP'],
  'Sales & Business Development':['CRM (Salesforce)','Contract Negotiation','Pipeline Management','Capture Management'],
  'Consulting':['Change Management','Strategic Planning','Stakeholder Management','Data Analysis','Presentation Skills'],
  'Logistics & Supply Chain':['SAP','Lean','Six Sigma','Inventory Management','ERP','APICS','Procurement'],
  'Transportation':['DOT Regulations','Fleet Management','CDL','Safety Management','Dispatch Operations'],
  'Construction & Engineering':['OSHA 30','Blueprint Reading','Cost Estimation','MS Project','AutoCAD','BIM'],
  'Manufacturing':['Lean Manufacturing','Six Sigma','ISO 9001','OSHA','Quality Management','ERP Systems'],
  'Energy & Utilities':['OSHA','NERC CIP','Safety Management','PMP','Environmental Compliance','NRC Regulations'],
  'Aviation & Aerospace':['FAA Certifications','ATP/CPL','A&P License','Part 107 (UAS)','Aviation Safety','FARs'],
  'Healthcare':['HIPAA','BLS/ACLS','Medical Terminology','EMR/EHR','FEMA Medical Training','RN/PA/NP License'],
  'Education & Training':['Curriculum Development','Instructional Design','ADDIE','LMS Platforms','Adult Learning Theory'],
  'Real Estate':['Real Estate License','CRE Analysis','Property Management','Lease Negotiation','Financial Modeling'],
  'Nonprofit / Social Services':['Grant Writing','Volunteer Management','Case Management','Community Outreach','Fundraising'],
};
