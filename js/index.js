/**
 * VetCareer API Proxy — Cloudflare Worker v3
 *
 * Standard Claude requests + web-search-enabled Scout requests
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY  — your Anthropic API key (sk-ant-...)
 *   CLERK_SECRET_KEY   — your Clerk secret key (sk_test_...)
 */

const ALLOWED_ORIGIN = 'https://vetcareerjobsearch.netlify.app';
const MAX_CALLS_PER_DAY = 50;
const MODEL = 'claude-haiku-4-5-20251001';
const SCOUT_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 6000;
const SCOUT_MAX_TOKENS = 8000;

export default {
  async fetch(request, env, ctx) {

    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    const url = new URL(request.url);

    // Route: standard AI request
    if (request.method === 'POST' && url.pathname === '/api/claude') {
      return handleClaude(request, env, ctx);
    }

    // Route: job scout with web search
    if (request.method === 'POST' && url.pathname === '/api/scout') {
      return handleScout(request, env, ctx);
    }

    // Route: analytics event
    if (request.method === 'POST' && url.pathname === '/api/analytics') {
      return handleAnalytics(request, env, ctx);
    }

    // Route: analytics dashboard (GET)
    if (request.method === 'GET' && url.pathname === '/api/analytics') {
      return handleAnalyticsDashboard(request, env);
    }

    return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
  }
};

// ── Standard Claude handler ────────────────────────────────────────────
async function handleClaude(request, env, ctx) {
  try {
    const userId = await authenticate(request, env);
    if (!userId) return corsResponse(JSON.stringify({ error: 'Unauthorized — invalid session' }), 401);

    const rateLimitKey = `ratelimit:${userId}:${todayKey()}`;
    const currentCount = parseInt(await env.AFTERACTION_KV.get(rateLimitKey) || '0');
    if (currentCount >= MAX_CALLS_PER_DAY) {
      return corsResponse(JSON.stringify({ error: `Daily limit reached (${MAX_CALLS_PER_DAY} AI requests/day). Resets at midnight UTC.` }), 429);
    }

    const body = await request.json();
    const { system, user, fileData, feature } = body;
    if (!user) return corsResponse(JSON.stringify({ error: 'Missing required field: user' }), 400);

    // Heavy features (LinkedIn, Interview, Resume, Reference Letter) need more output tokens
    const heavyFeatures = ['linkedin', 'interview', 'resume', 'refletter', 'salary'];
    const tokenLimit = heavyFeatures.includes(feature) ? 6000 : 3000;

    let messages;
    if (fileData) {
      // PDFs use 'document' type; images use 'image' type — Anthropic API requires this distinction
      const isPDF = fileData.mimeType === 'application/pdf';
      const contentBlock = isPDF
        ? { type: 'document', source: { type: 'base64', media_type: fileData.mimeType, data: fileData.base64 } }
        : { type: 'image', source: { type: 'base64', media_type: fileData.mimeType, data: fileData.base64 } };
      messages = [{ role: 'user', content: [
        contentBlock,
        { type: 'text', text: user }
      ]}];
    } else {
      messages = [{ role: 'user', content: user }];
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: tokenLimit, messages, ...(system ? { system } : {}) })
    });

    if (!anthropicRes.ok) {
      const errData = await anthropicRes.json();
      return corsResponse(JSON.stringify({ error: errData.error?.message || 'AI service error' }), anthropicRes.status);
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || '';

    ctx.waitUntil(env.AFTERACTION_KV.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 90000 }));

    return corsResponse(JSON.stringify({ text, callsToday: currentCount + 1, callsRemaining: MAX_CALLS_PER_DAY - (currentCount + 1) }), 200);

  } catch (err) {
    console.error('Claude handler error:', err);
    return corsResponse(JSON.stringify({ error: 'Internal server error: ' + err.message }), 500);
  }
}

// ── Job Scout handler — USAJobs API + Claude scoring ──────────────────
async function handleScout(request, env, ctx) {
  try {
    const userId = await authenticate(request, env);
    if (!userId) return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);

    const rateLimitKey = `scout:${userId}:${todayKey()}`;
    const currentCount = parseInt(await env.AFTERACTION_KV.get(rateLimitKey) || '0');
    if (currentCount >= 20) {
      return corsResponse(JSON.stringify({ error: 'Scout daily limit reached (20 searches/day). Resets at midnight UTC.' }), 429);
    }

    const body = await request.json();
    const { mode, keywords, location, clearance, seniority, veteranProfile } = body;

    // ── Step 1: Fetch real jobs from USAJobs API ──────────────────────
    const usajobsJobs = await fetchUSAJobs({ keywords, location, clearance, seniority }, env);

    if (usajobsJobs.length === 0) {
      ctx.waitUntil(env.AFTERACTION_KV.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 90000 }));
      return corsResponse(JSON.stringify({ jobs: [] }), 200);
    }

    // ── Step 2: Score jobs with Claude ────────────────────────────────
    const scoredJobs = await scoreJobsWithClaude(usajobsJobs, veteranProfile, env);

    ctx.waitUntil(env.AFTERACTION_KV.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 90000 }));
    return corsResponse(JSON.stringify({ jobs: scoredJobs, total: scoredJobs.length }), 200);

  } catch (err) {
    console.error('Scout handler error:', err);
    return corsResponse(JSON.stringify({ error: 'Scout error: ' + err.message }), 500);
  }
}

async function fetchUSAJobs({ keywords, location, clearance, seniority }, env) {
  // Map seniority to GS pay grade ranges
  const gradeMap = {
    'entry':     { low: 5,  high: 9  },
    'mid-senior':{ low: 11, high: 13 },
    'senior':    { low: 14, high: 15 },
    'executive': { low: 15, high: 15 },
  };
  const grades = gradeMap[seniority] || gradeMap['mid-senior'];

  const params = new URLSearchParams({
    Keyword: keywords || 'program manager',
    ResultsPerPage: '10',
    PayGradeLow: grades.low,
    PayGradeHigh: grades.high,
    WhoMayApply: 'public',
  });

  if (location && location.toLowerCase() !== 'remote') {
    params.set('LocationName', location);
  }
  if (location && location.toLowerCase() === 'remote') {
    params.set('RemoteIndicator', 'True');
  }

  const url = `https://data.usajobs.gov/api/search?${params}`;

  const res = await fetch(url, {
    headers: {
      'Host': 'data.usajobs.gov',
      'User-Agent': env.USAJOBS_EMAIL || 'vetcareerjobsearch@gmail.com',
      'Authorization-Key': env.USAJOBS_API_KEY || '',
    }
  });

  if (!res.ok) {
    console.error('USAJobs API error:', res.status, await res.text());
    throw new Error(`USAJobs API returned ${res.status}. Check API key configuration.`);
  }

  const data = await res.json();
  const items = data?.SearchResult?.SearchResultItems || [];

  return items.map(item => {
    const pos = item.MatchedObjectDescriptor;
    const salary = pos.PositionRemuneration?.[0];
    const salaryStr = salary 
      ? `$${Number(salary.MinimumRange).toLocaleString()} – $${Number(salary.MaximumRange).toLocaleString()} / yr`
      : '';

    // Extract GS grade
    const jobGrades = pos.JobGrade?.map(g => g.Code).join(', ') || '';
    const gsGrade = jobGrades ? `GS-${jobGrades}` : '';

    // Close date
    const closeDate = pos.ApplicationCloseDate 
      ? new Date(pos.ApplicationCloseDate).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})
      : '';

    // Veteran preference indicator
    const vetPref = (pos.UserArea?.Details?.LowGrade || '') !== '';

    // Short duty summary (first 300 chars)
    const duties = (pos.UserArea?.Details?.JobSummary || '').slice(0, 300);

    return {
      title: pos.PositionTitle,
      agency: pos.OrganizationName,
      location: pos.PositionLocationDisplay || (pos.PositionLocation?.[0]?.LocationName || ''),
      salary: salaryStr,
      gsGrade,
      closeDate,
      url: pos.PositionURI,
      source: 'USAJobs',
      duties,
      veteranPreference: !!(pos.UserArea?.Details?.WhoMayApply?.Code?.includes('VETO')),
      rawTitle: pos.PositionTitle,
      rawDuties: (pos.UserArea?.Details?.JobSummary || '').slice(0, 500),
    };
  });
}

async function scoreJobsWithClaude(jobs, veteranProfile, env) {
  if (!jobs.length) return [];

  const jobList = jobs.map((j, i) => 
    `${i+1}. ${j.title} | ${j.agency} | ${j.location} | ${j.gsGrade}\nSummary: ${j.rawDuties?.slice(0,200) || 'N/A'}`
  ).join('\n\n');

  const prompt = `You are a military-to-civilian career advisor. Score each job listing for this veteran.

VETERAN:
Branch: ${veteranProfile?.branch || 'Unknown'} | Rank: ${veteranProfile?.rank || 'Unknown'} | MOS: ${veteranProfile?.mosRate || 'Unknown'}
Target areas: ${veteranProfile?.targetIndustries || 'Not specified'}

JOBS TO SCORE:
${jobList}

Return ONLY this JSON array (no other text):
[{"index":1,"grade":8,"whyFits":"One specific sentence about fit based on military background"}]

grade = 1-10. Score based on how well military experience translates. Be generous — military leadership transfers broadly.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  let scores = [];
  if (res.ok) {
    const data = await res.json();
    const raw = data.content?.[0]?.text || '';
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const start = cleaned.indexOf('[');
      const end = cleaned.lastIndexOf(']');
      if (start >= 0 && end > start) {
        scores = JSON.parse(cleaned.slice(start, end + 1));
      }
    } catch(e) {
      console.warn('Score parse failed:', e.message);
    }
  }

  // Merge scores back into jobs
  return jobs.map((job, i) => {
    const score = scores.find(s => s.index === i + 1);
    return {
      ...job,
      grade: score?.grade || 6,
      whyFits: score?.whyFits || '',
    };
  }).sort((a, b) => b.grade - a.grade); // best matches first
}


// ── Shared helpers ─────────────────────────────────────────────────────

async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  return verifyClerkSession(token, env);
}

async function verifyClerkSession(token, env) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const sessionId = payload.sid;
    const userId = payload.sub;
    if (!sessionId || !userId) return null;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    const res = await fetch(`https://api.clerk.com/v1/sessions/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${env.CLERK_SECRET_KEY}` }
    });
    if (!res.ok) return null;
    const session = await res.json();
    if (session.status !== 'active') return null;
    return userId;
  } catch (err) {
    console.error('Auth error:', err);
    return null;
  }
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function corsResponse(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// ── Analytics handler ─────────────────────────────────────────────────
async function handleAnalytics(request, env, ctx) {
  try {
    const userId = await authenticate(request, env);
    if (!userId) return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);

    const { type, key, date } = await request.json();
    if (!type || !key || !date) return corsResponse(JSON.stringify({ ok: true }), 200);

    // Increment daily counter: analytics:view:resume:2026-02-25
    const dailyKey = `analytics:${type}:${key}:${date}`;
    // Increment total counter: analytics:total:view:resume
    const totalKey = `analytics:total:${type}:${key}`;

    // Fire and forget — don't make user wait
    ctx.waitUntil(Promise.all([
      env.AFTERACTION_KV.get(dailyKey).then(v =>
        env.AFTERACTION_KV.put(dailyKey, String((parseInt(v)||0)+1), { expirationTtl: 60*60*24*90 })
      ),
      env.AFTERACTION_KV.get(totalKey).then(v =>
        env.AFTERACTION_KV.put(totalKey, String((parseInt(v)||0)+1))
      )
    ]));

    return corsResponse(JSON.stringify({ ok: true }), 200);
  } catch(e) {
    return corsResponse(JSON.stringify({ ok: true }), 200); // always silent
  }
}

// ── Analytics dashboard (you viewing your own stats) ──────────────────
async function handleAnalyticsDashboard(request, env) {
  try {
    const userId = await authenticate(request, env);
    if (!userId) return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401);

    // Fetch all total counters
    const views = ['dashboard','documents','profile','experience','jobs','scout',
                   'resume','linkedin','interview','salary','network','refletter',
                   'sf86','gap','settings','faq'];
    const actions = ['resume_generate','linkedin_generate','interview_generate',
                     'salary_generate','network_generate','refletter_generate',
                     'scout_search','doc_upload','doc_paste','job_added',
                     'gap_analyze','feedback_sent'];

    const fetchCounters = async (type, keys) => {
      const results = {};
      await Promise.all(keys.map(async k => {
        const v = await env.AFTERACTION_KV.get(`analytics:total:${type}:${k}`);
        if (v && parseInt(v) > 0) results[k] = parseInt(v);
      }));
      return results;
    };

    const [viewCounts, actionCounts] = await Promise.all([
      fetchCounters('view', views),
      fetchCounters('action', actions)
    ]);

    return corsResponse(JSON.stringify({ views: viewCounts, actions: actionCounts }), 200);
  } catch(e) {
    return corsResponse(JSON.stringify({ error: e.message }), 500);
  }
}
