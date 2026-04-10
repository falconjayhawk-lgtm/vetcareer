// ── milcomp.js — Military Compensation Translator (#11) ───────────────
//
// Calculates total military compensation in civilian equivalent terms.
// Uses approximate 2024-2025 pay table data. Users should verify
// against the current DFAS pay table at dfas.mil.
//
// ──────────────────────────────────────────────────────────────────────

// ── 2024 Base Pay Table (monthly, approximate) ─────────────────────────
// [grade][years_of_service_bracket] — brackets: <2, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20+

const BASE_PAY_TABLE = {
  // Officers
  'O-1':  [3637,  3739,  3739,  3856,  3984,  3984,  3984,  3984,  4006,  4006,  4006,  4006],
  'O-2':  [4186,  4768,  4882,  5050,  5221,  5289,  5289,  5289,  5289,  5289,  5289,  5289],
  'O-3':  [4836,  5480,  5912,  6384,  6776,  6980,  7079,  7248,  7248,  7248,  7248,  7248],
  'O-4':  [5516,  6384,  6839,  7298,  7595,  7839,  8203,  8547,  8736,  8798,  8798,  8798],
  'O-5':  [6399,  7207,  7683,  8006,  8291,  8695,  9023,  9270,  9575,  9908, 10147, 10374],
  'O-6':  [7668,  8428,  8984,  9041,  9378,  9800, 10183, 10549, 10887, 11403, 12003, 12375],
  'O-7':  [9668, 10183, 10428, 10784, 11043, 11403, 11648, 11944, 12375, 12826, 13045, 13045],
  'O-8':  [11630, 12022, 12375, 12567, 12899, 13208, 13503, 13767, 14154, 14601, 14601, 14601],
  // Warrant Officers
  'W-1':  [3213,  3507,  3619,  3733,  3846,  3988,  4129,  4271,  4413,  4557,  4698,  4698],
  'W-2':  [3713,  4063,  4179,  4296,  4411,  4582,  4751,  4920,  5087,  5257,  5427,  5427],
  'W-3':  [4225,  4547,  4727,  4904,  5082,  5262,  5441,  5620,  5800,  5979,  6161,  6161],
  'W-4':  [4592,  5010,  5191,  5375,  5554,  5737,  5916,  6098,  6279,  6461,  6641,  6641],
  'W-5':  [0,     0,     0,     0,     0,     0,     6434,  6692,  6902,  7148,  7395,  7644],
  // Enlisted
  'E-1':  [1917,  1917,  1917,  1917,  1917,  1917,  1917,  1917,  1917,  1917,  1917,  1917],
  'E-2':  [2149,  2149,  2149,  2149,  2149,  2149,  2149,  2149,  2149,  2149,  2149,  2149],
  'E-3':  [2259,  2397,  2459,  2459,  2459,  2459,  2459,  2459,  2459,  2459,  2459,  2459],
  'E-4':  [2503,  2634,  2748,  2853,  2913,  2913,  2913,  2913,  2913,  2913,  2913,  2913],
  'E-5':  [2610,  2759,  2883,  2999,  3108,  3258,  3318,  3318,  3318,  3318,  3318,  3318],
  'E-6':  [2849,  3135,  3251,  3370,  3482,  3627,  3739,  3840,  3908,  3908,  3908,  3908],
  'E-7':  [3294,  3591,  3735,  3849,  3962,  4100,  4213,  4354,  4437,  4564,  4697,  4788],
  'E-8':  [4739,  4924,  5073,  5220,  5368,  5516,  5663,  5812,  5960,  6108,  6256,  6405],
  'E-9':  [5789,  5934,  6082,  6231,  6380,  6527,  6678,  6826,  6975,  7124,  7272,  7422]
};

// Years of service brackets for table lookup
const YOS_BRACKETS = [0, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20];

// BAH area categories (approximate monthly values with dependents, 2024)
const BAH_AREAS = {
  'Very High (NYC, DC, SF, HI)':   { E5: 3100, E7: 3400, E9: 3600, O3: 3800, O5: 4200, O6: 4500 },
  'High (San Diego, Boston, LA)':  { E5: 2600, E7: 2900, E9: 3100, O3: 3200, O5: 3700, O6: 3900 },
  'Medium (Denver, Seattle, ATL)': { E5: 2100, E7: 2300, E9: 2500, O3: 2600, O5: 3000, O6: 3200 },
  'Standard (most CONUS)':         { E5: 1700, E7: 1900, E9: 2100, O3: 2100, O5: 2500, O6: 2700 },
  'Low (rural, OCONUS w/ OHA)':    { E5: 1400, E7: 1600, E9: 1800, O3: 1700, O5: 2100, O6: 2300 }
};

// BAS monthly (2024)
const BAS = { officer: 311, enlisted: 452 };

// Standard values for benefits translation
const CIVILIAN_HEALTH_VALUE    = 18000; // annual — what employer-paid family health costs civilian employers
const SGLI_ANNUAL              = 276;   // $400K coverage
const DENTAL_VISION_ANNUAL     = 1800;  // dental+vision
const RETIREMENT_PERCENT       = 0.025; // 2.5% per year of service for legacy, 2.0% for BRS

// Pay grades for dropdown
const PAY_GRADES = {
  'Officers':       ['O-1','O-2','O-3','O-4','O-5','O-6','O-7','O-8'],
  'Warrant Officers':['W-1','W-2','W-3','W-4','W-5'],
  'Enlisted':       ['E-1','E-2','E-3','E-4','E-5','E-6','E-7','E-8','E-9']
};

// ── Main render ────────────────────────────────────────────────────────

function renderMilComp() {
  const cfg    = state.ui.milCompCfg || {};
  const result = state.ui.milCompResult || null;

  // Pre-fill from profile if available
  const p = state.profile;
  const defaultGrade = cfg.grade || p.rank || '';
  const defaultYos   = cfg.yos   || p.yearsOfService || '';

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent)">🪖 Military Compensation Translator</h1>
    <p style="color:var(--muted);font-size:13px;margin:0 0 20px">What is your military pay package actually worth in civilian terms? Know your number before you evaluate any offer.</p>

    <!-- Why this matters -->
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light);margin-bottom:16px">
      <div style="display:flex;align-items:start;gap:12px">
        <span style="font-size:22px;flex-shrink:0">💡</span>
        <div style="font-size:13px;color:var(--text);line-height:1.7">
          Veterans consistently undervalue their compensation because they compare civilian base salary to military base pay.
          That's wrong. Your military package includes tax-free allowances, free healthcare, retirement, and more.
          An O-5 at 18 years in a high-cost area can have a <strong>total compensation equivalent of $180,000+</strong> — but a $130K civilian offer looks like a raise on paper.
          Know the real number first.
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Your Military Package</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Pay Grade *</label>
          <select id="mc-grade" style="font-size:13px">
            <option value="">Select...</option>
            ${Object.entries(PAY_GRADES).map(([group, grades]) => `
              <optgroup label="${group}">
                ${grades.map(g => `<option value="${g}" ${defaultGrade===g?'selected':''}>${g}</option>`).join('')}
              </optgroup>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Years of Service *</label>
          <input type="number" id="mc-yos" value="${esc(defaultYos)}" min="0" max="40" placeholder="e.g., 18">
        </div>
        <div class="field">
          <label class="field-label">BAH Area / Location</label>
          <select id="mc-bah-area" style="font-size:13px">
            ${Object.keys(BAH_AREAS).map(area => `<option value="${area}" ${cfg.bahArea===area?'selected':''}>${area}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Dependent Status</label>
          <select id="mc-dep" style="font-size:13px">
            <option value="with" ${(cfg.dep||'with')==='with'?'selected':''}>With Dependents</option>
            <option value="without" ${cfg.dep==='without'?'selected':''}>Without Dependents</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Retirement System</label>
          <select id="mc-ret" style="font-size:13px">
            <option value="legacy" ${(cfg.ret||'legacy')==='legacy'?'selected':''}>Legacy / High-3 (joined before 2018)</option>
            <option value="brs"    ${cfg.ret==='brs'   ?'selected':''}>Blended Retirement System (BRS)</option>
            <option value="none"   ${cfg.ret==='none'  ?'selected':''}>Not yet vested (under 20 years)</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Special / Incentive Pay (monthly)</label>
          <input type="number" id="mc-special" value="${esc(cfg.special||'')}" min="0" placeholder="e.g., 250 for flight pay, 0 if none">
          <div style="font-size:10px;color:var(--dim);margin-top:2px">Flight pay, hazard pay, sub pay, jump pay, etc.</div>
        </div>
      </div>

      <!-- Optional: civilian offer to compare -->
      <div style="border-top:1px solid var(--rule);padding-top:14px;margin-top:4px">
        <div style="font-size:11px;font-weight:700;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:12px">Optional: Compare to a civilian offer</div>
        <div class="grid2">
          <div class="field" style="margin-bottom:0">
            <label class="field-label">Civilian Base Salary</label>
            <input id="mc-civ-base" value="${esc(cfg.civBase||'')}" placeholder="e.g., 130000 or $130,000">
          </div>
          <div class="field" style="margin-bottom:0">
            <label class="field-label">Civilian Employer Benefits</label>
            <select id="mc-civ-health" style="font-size:13px">
              <option value="full"    ${(cfg.civHealth||'full')==='full'  ?'selected':''}>Employer pays 80%+ of family healthcare</option>
              <option value="partial" ${cfg.civHealth==='partial'?'selected':''}>Employer pays ~50% of healthcare</option>
              <option value="minimal" ${cfg.civHealth==='minimal'?'selected':''}>Minimal coverage / HDHPs</option>
              <option value="none"    ${cfg.civHealth==='none'   ?'selected':''}>No employer healthcare</option>
            </select>
          </div>
        </div>
      </div>

      <button class="btn btn-primary" onclick="calculateMilComp()" style="margin-top:16px;padding:12px 24px">
        💰 Calculate My Compensation Equivalent
      </button>
    </div>

    ${result ? renderMilCompResult(result) : ''}`;
}

// ── Calculator ─────────────────────────────────────────────────────────

function calculateMilComp() {
  const grade   = document.getElementById('mc-grade')?.value;
  const yos     = parseInt(document.getElementById('mc-yos')?.value || '0');
  const bahArea = document.getElementById('mc-bah-area')?.value    || 'Standard (most CONUS)';
  const dep     = document.getElementById('mc-dep')?.value         || 'with';
  const ret     = document.getElementById('mc-ret')?.value         || 'legacy';
  const special = parseFloat(document.getElementById('mc-special')?.value || '0');
  const civBase = document.getElementById('mc-civ-base')?.value?.replace(/[^0-9.]/g,'') || '';
  const civHealth = document.getElementById('mc-civ-health')?.value || 'full';

  if (!grade) { showToast('Select a pay grade', false); return; }
  if (!yos)   { showToast('Enter years of service', false); return; }

  // Save config
  const cfg = { grade, yos, bahArea, dep, ret, special, civBase, civHealth };
  setState({ ui: { ...state.ui, milCompCfg: cfg } }, false);

  // ── Base pay ───────────────────────────────────────────────────────
  const payRow   = BASE_PAY_TABLE[grade];
  if (!payRow) { showToast('Pay grade not found', false); return; }
  const yosBracketIdx = YOS_BRACKETS.findLastIndex(y => yos >= y);
  const basePay  = payRow[Math.min(yosBracketIdx, payRow.length-1)] || payRow[payRow.length-1];
  const baseAnnual = basePay * 12;

  // ── BAH ───────────────────────────────────────────────────────────
  // Determine BAH key from grade
  const bahKey = grade.startsWith('O') ? (
    ['O-1','O-2'].includes(grade) ? 'O3' :
    ['O-3','O-4'].includes(grade) ? 'O3' :
    grade === 'O-5' ? 'O5' : 'O6'
  ) : grade.startsWith('W') ? 'O3' : (
    ['E-1','E-2','E-3','E-4'].includes(grade) ? 'E5' :
    ['E-5','E-6'].includes(grade) ? 'E5' :
    grade === 'E-7' ? 'E7' : 'E9'
  );
  const bahMonthly = dep === 'with'
    ? (BAH_AREAS[bahArea]?.[bahKey] || 2100)
    : Math.round((BAH_AREAS[bahArea]?.[bahKey] || 2100) * 0.82);
  const bahAnnual = bahMonthly * 12;

  // ── BAS ───────────────────────────────────────────────────────────
  const isEnlisted = grade.startsWith('E');
  const basMonthly = isEnlisted ? BAS.enlisted : BAS.officer;
  const basAnnual  = basMonthly * 12;

  // ── Special pay ───────────────────────────────────────────────────
  const specialAnnual = special * 12;

  // ── Tax advantage ─────────────────────────────────────────────────
  // BAH and BAS are tax-free — add the tax savings
  const estimatedTaxRate = 0.22;
  const taxSavings = (bahAnnual + basAnnual) * estimatedTaxRate;

  // ── Healthcare ────────────────────────────────────────────────────
  const healthcareValue = CIVILIAN_HEALTH_VALUE; // what a civilian employer pays for equivalent coverage

  // ── Retirement ────────────────────────────────────────────────────
  let retirementValue = 0;
  let retirementNote  = '';
  if (ret === 'legacy' && yos >= 20) {
    const pct = Math.min(yos * 0.025, 0.75);
    const annualPension = baseAnnual * pct;
    // NPV approximation: pension * 20-year multiplier
    retirementValue = annualPension * 20;
    retirementNote  = `Legacy pension: ${Math.round(pct*100)}% of High-3 = ~$${Math.round(annualPension/1000)}K/yr · NPV ~$${Math.round(retirementValue/1000)}K`;
  } else if (ret === 'brs' && yos >= 20) {
    const pct = Math.min(yos * 0.020, 0.60);
    const annualPension = baseAnnual * pct;
    retirementValue = annualPension * 20;
    retirementNote  = `BRS pension: ${Math.round(pct*100)}% of High-3 = ~$${Math.round(annualPension/1000)}K/yr · NPV ~$${Math.round(retirementValue/1000)}K`;
  } else if (yos < 20) {
    // Accruing value — estimate annual equivalent contribution
    retirementValue = ret === 'brs' ? baseAnnual * 0.05 : 0; // BRS TSP match ongoing
    retirementNote  = ret === 'brs'
      ? `BRS TSP match (~5% of base) = ~$${Math.round(retirementValue/1000)}K/yr accruing`
      : 'No vested retirement yet — under 20 years';
  }

  // ── Total civilian equivalent ──────────────────────────────────────
  const totalAnnualCash   = baseAnnual + bahAnnual + basAnnual + specialAnnual;
  const totalBenefits     = healthcareValue + DENTAL_VISION_ANNUAL + SGLI_ANNUAL + taxSavings;
  const annualRetValue    = yos >= 20 ? (retirementValue / 20) : retirementValue;
  const totalCivEquiv     = totalAnnualCash + totalBenefits + annualRetValue;

  // ── Civilian offer comparison ─────────────────────────────────────
  let civComparison = null;
  if (civBase) {
    const civBaseSalary = parseFloat(civBase);
    const civHealthVal  = civHealth === 'full' ? 0 : civHealth === 'partial' ? 9000 : civHealth === 'minimal' ? 14000 : 18000;
    const civRetMatch   = civBaseSalary * 0.04; // typical 4% 401K match
    const civTotal      = civBaseSalary + civHealthVal + civRetMatch;
    const delta         = civTotal - totalCivEquiv;
    civComparison = { civBaseSalary, civHealthVal, civRetMatch, civTotal, delta };
  }

  // ── Build result object ───────────────────────────────────────────
  const result = {
    grade, yos, bahArea, dep,
    basePay, baseAnnual, bahMonthly, bahAnnual, basAnnual,
    specialAnnual, taxSavings, healthcareValue,
    retirementValue: annualRetValue, retirementNote,
    totalAnnualCash, totalBenefits, totalCivEquiv,
    civComparison
  };

  setState({ ui: { ...state.ui, milCompResult: result } });
  showToast('✓ Compensation calculated');
}

// ── Result renderer ────────────────────────────────────────────────────

function renderMilCompResult(r) {
  const fmt = (n) => '$' + Math.round(n).toLocaleString();

  return `
    <!-- Total equivalent -->
    <div class="card" style="background:var(--accent);color:white">
      <div style="text-align:center;padding:8px 0">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.65;font-family:'Familjen Grotesk',sans-serif;margin-bottom:6px">${r.grade} · ${r.yos} Years of Service · ${r.bahArea}</div>
        <div style="font-size:11px;opacity:0.6;margin-bottom:4px">Estimated Total Civilian Compensation Equivalent</div>
        <div style="font-size:52px;font-weight:800;font-family:'Familjen Grotesk',sans-serif;line-height:1;color:var(--gold)">${fmt(r.totalCivEquiv)}</div>
        <div style="font-size:12px;opacity:0.65;margin-top:6px">per year</div>
      </div>
    </div>

    <!-- Breakdown -->
    <div class="card">
      <h2>💰 Full Compensation Breakdown</h2>
      <div style="display:flex;flex-direction:column;gap:0">
        ${[
          { label:'Base Pay (taxable)',                value: r.baseAnnual,        note: `$${Math.round(r.basePay).toLocaleString()}/mo · your W-2 income`,                  color:'var(--accent)' },
          { label:'BAH (tax-free)',                    value: r.bahAnnual,         note: `$${Math.round(r.bahMonthly).toLocaleString()}/mo · ${r.dep==='with'?'with':'without'} dependents · ${r.bahArea}`, color:'var(--accent)' },
          { label:'BAS (tax-free)',                    value: r.basAnnual,         note: `$${r.basAnnual/12}/mo food allowance`,                                             color:'var(--accent)' },
          ...(r.specialAnnual > 0 ? [{ label:'Special/Incentive Pay', value: r.specialAnnual, note: `$${r.specialAnnual/12}/mo entered`,                                   color:'var(--accent)' }] : []),
          { label:'Tax savings on allowances',         value: r.taxSavings,        note: 'BAH + BAS are not taxed — a civilian would need more gross pay to net the same', color:'#7c3aed' },
          { label:'Healthcare (family coverage)',       value: r.healthcareValue,   note: 'What a civilian employer pays for equivalent family coverage',                    color:'var(--green)' },
          { label:'Dental + Vision',                   value: DENTAL_VISION_ANNUAL, note: 'Included in TRICARE coverage',                                                   color:'var(--green)' },
          { label:'SGLI Life Insurance',               value: SGLI_ANNUAL,         note: '$400K coverage at heavily subsidized rate',                                       color:'var(--green)' },
          { label:'Retirement (annual equivalent)',     value: r.retirementValue,   note: r.retirementNote,                                                                  color:'var(--gold)' }
        ].map((item, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--rule);flex-wrap:wrap;gap:4px">
            <div>
              <div style="font-weight:600;font-size:13px;color:var(--text)">${item.label}</div>
              <div style="font-size:11px;color:var(--dim)">${item.note}</div>
            </div>
            <div style="font-size:16px;font-weight:800;color:${item.color};font-family:'Familjen Grotesk',sans-serif;white-space:nowrap">${fmt(item.value)}</div>
          </div>`).join('')}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;flex-wrap:wrap;gap:4px">
          <div style="font-weight:700;font-size:15px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">TOTAL CIVILIAN EQUIVALENT</div>
          <div style="font-size:22px;font-weight:800;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${fmt(r.totalCivEquiv)}</div>
        </div>
      </div>
    </div>

    <!-- Civilian offer comparison -->
    ${r.civComparison ? (() => {
      const c   = r.civComparison;
      const up  = c.delta >= 0;
      const pct = Math.abs(Math.round((c.delta / r.totalCivEquiv) * 100));
      return `
      <div class="card" style="border:2px solid ${up?'var(--green)':'var(--red)'};background:${up?'var(--green-light)':'var(--red-light)'}">
        <h2 style="color:${up?'var(--green)':'var(--red)'}">
          ${up ? '✅ That offer beats your military comp' : '⚠️ That offer is below your military comp'}
        </h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div style="text-align:center;background:white;border-radius:2px;padding:12px">
            <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">Your Military Equiv.</div>
            <div style="font-size:22px;font-weight:800;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${fmt(r.totalCivEquiv)}</div>
          </div>
          <div style="text-align:center;background:white;border-radius:2px;padding:12px">
            <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">Civilian Offer Total</div>
            <div style="font-size:22px;font-weight:800;color:${up?'var(--green)':'var(--red)'};font-family:'Familjen Grotesk',sans-serif">${fmt(c.civTotal)}</div>
          </div>
        </div>
        <div style="font-size:14px;font-weight:700;color:${up?'var(--green)':'var(--red)'}">
          ${up ? `+${fmt(c.delta)} above your military equivalent (+${pct}%)` : `${fmt(c.delta)} below your military equivalent (-${pct}%)`}
        </div>
        ${!up ? `<div style="font-size:13px;color:var(--text);margin-top:8px;line-height:1.7">
          To match your military compensation equivalent, you need a base salary of approximately <strong>${fmt(r.totalCivEquiv - c.civHealthVal - c.civRetMatch)}</strong> — or use this gap as your negotiation anchor.
          <button onclick="setState({view:'salary',ui:{...state.ui,salTab:'negotiate'}})" class="btn btn-secondary btn-sm" style="margin-top:8px;display:block">📋 Open Offer Negotiation →</button>
        </div>` : `<div style="font-size:13px;color:var(--green);margin-top:8px">
          This is a genuine improvement over your military total compensation. Factor in cost of living changes, retirement differences, and career growth potential before deciding.
        </div>`}
      </div>`;
    })() : ''}

    <!-- Disclaimer -->
    <div style="font-size:11px;color:var(--dim);padding:8px 0">
      ⚠️ These estimates are based on approximate 2024-2025 pay tables and average values. Actual compensation varies. Verify base pay at <a href="https://www.dfas.mil/militarymembers/payentitlements/military-pay-charts" target="_blank" style="color:var(--accent)">DFAS.mil</a>. BAH rates vary by ZIP code — verify at <a href="https://www.defensetravel.dod.mil/site/bahCalc.cfm" target="_blank" style="color:var(--accent)">defensetravel.dod.mil</a>. Consult a financial advisor for major decisions.
    </div>`;
}
