// ── Salary Intel & Offer Negotiation ─────────────────────────────────
function renderSalary() {
  const salTab = state.ui.salTab || 'intel';

  const tabBar = `
    <div style="display:flex;gap:0;margin-bottom:20px;border-radius:2px;overflow:hidden;border:1.5px solid var(--rule-dark);width:fit-content">
      <button onclick="toggleUI('salTab','intel')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${salTab==='intel'?'var(--accent)':'white'};color:${salTab==='intel'?'white':'var(--muted)'};transition:all 0.15s">💰 SALARY INTEL</button>
      <button onclick="toggleUI('salTab','negotiate')" style="padding:10px 22px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;background:${salTab==='negotiate'?'var(--accent)':'white'};color:${salTab==='negotiate'?'white':'var(--muted)'};transition:all 0.15s;border-left:1.5px solid var(--rule-dark)">📋 OFFER NEGOTIATION</button>
    </div>`;

  if (salTab === 'negotiate') {
    return `
      <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">💰 Salary Intelligence</h1>
      <p style="color:var(--muted);font-size:14px;margin:0 0 20px">Know your number. Know your worth. Don't leave money on the table.</p>
      ${tabBar}
      ${renderOfferNegotiation()}`;
  }

  // ── Salary Intel tab (existing, unchanged) ────────────────────────
  const jobs = state.jobs;
  const selJob = state.ui.salaryJob||'';
  const busy = state.ui.salaryBusy||false;
  const result = state.ui.salaryResult||null;
  const error = state.ui.salaryError||'';
  const jobOptions = jobs.map(j=>`<option value="${j.id}" ${selJob===j.id?'selected':''}>${esc(j.title)} — ${esc(j.company)}</option>`).join('');

  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">💰 Salary Intelligence</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Know your number before you walk in. Get market-calibrated salary ranges, negotiation anchors, and veteran-specific leverage points for any target role.</p>
    ${tabBar}
    <div class="card">
      <h2>Configure Salary Research</h2>
      <div class="grid2">
        <div class="field">
          <label class="field-label">Target Job (from tracker)</label>
          <select id="sal-job" onchange="toggleUI('salaryJob',this.value)">
            <option value="">Select a job...</option>${jobOptions}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Or enter role manually</label>
          <input id="sal-role" placeholder="e.g., Business Development Director — Defense" value="${esc(state.ui.salaryRole||'')}">
        </div>
        <div class="field">
          <label class="field-label">Location / Market</label>
          <input id="sal-location" placeholder="Washington DC metro, Remote, San Diego..." value="${esc(state.ui.salaryLocation||state.profile.location||'')}">
        </div>
        <div class="field">
          <label class="field-label">Company Type</label>
          <select id="sal-company-type" onchange="toggleUI('salaryCompanyType',this.value)">
            <option value="large-defense" ${(state.ui.salaryCompanyType||'large-defense')==='large-defense'?'selected':''}>Large Defense Contractor (Leidos, SAIC, Northrop)</option>
            <option value="mid-defense" ${(state.ui.salaryCompanyType||'')==='mid-defense'?'selected':''}>Mid-size Defense / GovCon</option>
            <option value="startup-defense" ${(state.ui.salaryCompanyType||'')==='startup-defense'?'selected':''}>Defense Tech Startup (Anduril, Shield AI, Palantir)</option>
            <option value="federal" ${(state.ui.salaryCompanyType||'')==='federal'?'selected':''}>Federal Government (GS/SES)</option>
            <option value="commercial" ${(state.ui.salaryCompanyType||'')==='commercial'?'selected':''}>Commercial Tech / Private Sector</option>
            <option value="consulting" ${(state.ui.salaryCompanyType||'')==='consulting'?'selected':''}>Consulting Firm</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Current / Most Recent Compensation</label>
          <input id="sal-current" placeholder="Military pay + BAH, or last salary — helps anchor the negotiation" value="${esc(state.ui.salaryCurrent||'')}">
        </div>
        <div class="field">
          <label class="field-label">Your biggest negotiation worry</label>
          <input id="sal-worry" placeholder="e.g., don't know if clearance premium applies, first civilian job..." value="${esc(state.ui.salaryWorry||'')}">
        </div>
      </div>
      <button class="btn btn-primary" onclick="generateSalaryIntel()" ${busy?'disabled':''} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Researching...':'💰 Get Salary Intelligence'}
      </button>
      ${busy?`<div style="background:#eff6ff;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#1e40af;display:flex;align-items:center;gap:10px"><div class="spinner"></div> Analyzing market data and your negotiation position...</div>`:''}
      ${error?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#dc2626">${esc(error)}</div>`:''}
    </div>
    ${result?renderSalaryResult(result):''}`;
}

// ── Salary intel result renderer ───────────────────────────────────────

function renderSalaryResult(result) {
  return `
    <div class="card" style="border-left:4px solid #16a34a">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">💰 Salary Intelligence Report</h2>
          <p style="font-size:12px;color:#6b7280;margin:4px 0 0">Based on Claude's knowledge of market rates — verify with Glassdoor, Levels.fyi, or similar for current data</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="toggleUI('salTab','negotiate')" style="background:var(--gold-light);border-color:var(--gold);color:var(--gold)">📋 Got an offer? Negotiate it →</button>
          <button class="btn btn-secondary btn-sm" onclick="toggleUI('salaryResult',null)">Clear</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        ${[['Floor',result.floor,'#6b7280'],['Target',result.target,'#16a34a'],['Ceiling',result.ceiling,'#2563eb']].map(([l,v,c])=>`
        <div style="text-align:center;background:#f9fafb;border-radius:2px;padding:14px;border:2px solid ${c}20">
          <div style="font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${l}</div>
          <div style="font-size:20px;font-weight:800;color:${c}">${esc(v||'N/A')}</div>
        </div>`).join('')}
      </div>

      <div style="font-size:14px;color:#374151;line-height:1.7;margin-bottom:16px">${esc(result.marketContext||'')}</div>

      ${result.veteranPremiums?`
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:2px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;font-family:'Familjen Grotesk',sans-serif">🎖 Your Veteran Leverage Points</div>
        <div style="font-size:13px;color:#1e3a8a;white-space:pre-line">${esc(result.veteranPremiums)}</div>
      </div>`:''}

      ${result.negotiationScript?`
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:2px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;font-family:'Familjen Grotesk',sans-serif">💬 What to Say When They Ask</div>
        <div style="font-size:13px;color:#166534;white-space:pre-line;font-style:italic">${esc(result.negotiationScript)}</div>
      </div>`:''}

      ${result.totalComp?`
      <div style="background:#faf5ff;border:1px solid #ddd6fe;border-radius:2px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#6d28d9;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;font-family:'Familjen Grotesk',sans-serif">📦 Total Compensation to Negotiate</div>
        <div style="font-size:13px;color:#6d28d9;white-space:pre-line">${esc(result.totalComp)}</div>
      </div>`:''}

      ${result.redFlags?`
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:2px;padding:14px">
        <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;font-family:'Familjen Grotesk',sans-serif">⚠️ Watch Out For</div>
        <div style="font-size:13px;color:#92400e;white-space:pre-line">${esc(result.redFlags)}</div>
      </div>`:''}
    </div>`;
}

// ── Offer Negotiation tab ─────────────────────────────────────────────

function renderOfferNegotiation() {
  const busy   = state.ui.offerBusy   || false;
  const result = state.ui.offerResult || null;
  const error  = state.ui.offerError  || '';
  const offer  = state.ui.offerInputs || {};

  return `
    <!-- Military comp translator banner -->
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light);margin-bottom:0">
      <div style="display:flex;align-items:start;gap:12px">
        <span style="font-size:22px;flex-shrink:0">🪖</span>
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;margin-bottom:4px">Most veterans undervalue themselves at offer time</div>
          <div style="font-size:13px;color:var(--text);line-height:1.6">
            Your military compensation includes base pay, BAH, BAS, SGLI, free healthcare, retirement multiplier, and special pays.
            An O-5 in a high-cost area can be worth <strong>$180K+ in total civilian equivalent</strong> — but most offers come in well below that.
            Enter your offer below and Claude will tell you exactly where it stands and what to say.
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Enter Your Offer Details</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 16px">Fill in what they offered. Leave blank what you don't know yet — Claude will flag what to ask about.</p>

      <!-- Role context -->
      <div class="grid2">
        <div class="field">
          <label class="field-label">Job Title *</label>
          <input id="off-title" value="${esc(offer.title||'')}" placeholder="e.g., Program Manager, Director of Operations">
        </div>
        <div class="field">
          <label class="field-label">Company *</label>
          <input id="off-company" value="${esc(offer.company||'')}" placeholder="e.g., Leidos, Anduril, CACI">
        </div>
        <div class="field">
          <label class="field-label">Location</label>
          <input id="off-location" value="${esc(offer.location||state.profile.location||'')}" placeholder="City, State or Remote">
        </div>
        <div class="field">
          <label class="field-label">Company Type</label>
          <select id="off-company-type">
            <option value="large-defense">Large Defense Contractor</option>
            <option value="mid-defense">Mid-size Defense / GovCon</option>
            <option value="startup-defense">Defense Tech Startup</option>
            <option value="federal">Federal Government</option>
            <option value="commercial">Commercial / Private Sector</option>
            <option value="consulting">Consulting</option>
          </select>
        </div>
      </div>

      <!-- The offer numbers -->
      <div style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:16px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:14px">💼 What They Offered</div>
        <div class="grid2">
          <div class="field">
            <label class="field-label">Base Salary *</label>
            <input id="off-base" value="${esc(offer.base||'')}" placeholder="e.g., $115,000">
          </div>
          <div class="field">
            <label class="field-label">Signing Bonus</label>
            <input id="off-signing" value="${esc(offer.signing||'')}" placeholder="e.g., $10,000 or 'none offered'">
          </div>
          <div class="field">
            <label class="field-label">Annual Bonus / Target</label>
            <input id="off-bonus" value="${esc(offer.bonus||'')}" placeholder="e.g., 10% target, $8,000, or 'not mentioned'">
          </div>
          <div class="field">
            <label class="field-label">Equity / RSUs</label>
            <input id="off-equity" value="${esc(offer.equity||'')}" placeholder="e.g., $50K RSUs over 4 years, or 'none'">
          </div>
          <div class="field">
            <label class="field-label">PTO / Leave</label>
            <input id="off-pto" value="${esc(offer.pto||'')}" placeholder="e.g., 15 days, unlimited, or 'not specified'">
          </div>
          <div class="field">
            <label class="field-label">Start Date</label>
            <input type="date" id="off-start" value="${esc(offer.start||'')}">
          </div>
          <div class="field">
            <label class="field-label">Healthcare</label>
            <input id="off-health" value="${esc(offer.health||'')}" placeholder="e.g., employer pays 80%, TRICARE eligible...">
          </div>
          <div class="field">
            <label class="field-label">Remote / Telework</label>
            <select id="off-remote">
              <option value="">Not specified</option>
              ${['Fully Remote','Hybrid (2-3 days)','Hybrid (4-5 days)','On-site Required'].map(o=>`<option ${offer.remote===o?'selected':''}>${o}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field" style="margin-bottom:0">
          <label class="field-label">Other Benefits / Perks mentioned</label>
          <input id="off-other" value="${esc(offer.other||'')}" placeholder="e.g., 401K match 5%, relocation package, tuition reimbursement, clearance maintenance pay...">
        </div>
      </div>

      <!-- Your military comp for translation -->
      <div style="background:var(--accent-light);border:1px solid #c0cfe0;border-radius:2px;padding:16px;margin-bottom:16px">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;font-family:'Familjen Grotesk',sans-serif;margin-bottom:14px">🪖 Your Military Compensation (for translation)</div>
        <p style="font-size:12px;color:var(--muted);margin:-8px 0 12px">Claude uses this to calculate what your military package is actually worth in civilian terms — and anchor your counter accordingly.</p>
        <div class="grid2">
          <div class="field">
            <label class="field-label">Base Pay (monthly)</label>
            <input id="off-mil-base" value="${esc(offer.milBase||'')}" placeholder="e.g., $7,800/mo">
          </div>
          <div class="field">
            <label class="field-label">BAH (monthly)</label>
            <input id="off-mil-bah" value="${esc(offer.milBah||'')}" placeholder="e.g., $2,400/mo">
          </div>
          <div class="field">
            <label class="field-label">BAS (monthly)</label>
            <input id="off-mil-bas" value="${esc(offer.milBas||'')}" placeholder="e.g., $460/mo">
          </div>
          <div class="field">
            <label class="field-label">Special Pay (monthly, if any)</label>
            <input id="off-mil-special" value="${esc(offer.milSpecial||'')}" placeholder="e.g., flight pay $250/mo, hazard pay...">
          </div>
          <div class="field">
            <label class="field-label">Years of Service</label>
            <input id="off-mil-years" value="${esc(offer.milYears||state.profile.yearsOfService||'')}" placeholder="e.g., 20">
          </div>
          <div class="field">
            <label class="field-label">Retirement Status</label>
            <select id="off-mil-retirement">
              <option value="">Select...</option>
              ${['Receiving retirement pay','Will receive retirement pay','Not eligible yet','Reserve retirement'].map(o=>`<option ${offer.milRetirement===o?'selected':''}>${o}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Context -->
      <div class="grid2">
        <div class="field">
          <label class="field-label">How excited are you about this role?</label>
          <select id="off-excitement">
            <option value="very">Very — this is my top choice</option>
            <option value="moderate">Moderate — it's good but not perfect</option>
            <option value="low">Low — mainly using it as leverage</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Do you have competing offers?</label>
          <select id="off-competing">
            <option value="no">No other offers</option>
            <option value="yes-higher">Yes — competing offer is higher</option>
            <option value="yes-lower">Yes — competing offer is lower</option>
            <option value="yes-unknown">Yes — still evaluating</option>
          </select>
        </div>
        <div class="field" style="grid-column:1/-1">
          <label class="field-label">Anything specific you want to negotiate or are worried about?</label>
          <input id="off-concern" value="${esc(offer.concern||'')}" placeholder="e.g., start date is too soon, base seems low, want more PTO, need relocation help...">
        </div>
      </div>

      <button class="btn btn-primary" onclick="generateOfferAnalysis()" ${busy?'disabled':''} style="padding:12px 24px">
        ${busy?'<div class="spinner"></div> Analyzing offer...':'📋 Analyze Offer & Generate Counter'}
      </button>
      ${busy?`
      <div style="background:var(--gold-light);border:1px solid var(--gold);border-radius:2px;padding:14px;margin-top:12px;font-size:13px;color:var(--accent);display:flex;align-items:center;gap:10px">
        <div class="spinner"></div>
        Translating your military comp, benchmarking the offer, and writing your counter script — takes 20-30 seconds
      </div>` : ''}
      ${error?`<div style="background:var(--red-light);border:1px solid #e8c0c0;border-radius:2px;padding:12px;margin-top:12px;font-size:13px;color:var(--red)">${esc(error)}</div>`:''}
    </div>

    ${result ? renderOfferResult(result) : ''}`;
}

// ── Offer result renderer ─────────────────────────────────────────────

function renderOfferResult(r) {
  const verdictColor = r.verdict === 'strong' ? 'var(--green)' : r.verdict === 'fair' ? 'var(--gold)' : 'var(--red)';
  const verdictBg    = r.verdict === 'strong' ? 'var(--green-light)' : r.verdict === 'fair' ? 'var(--gold-light)' : 'var(--red-light)';
  const verdictLabel = r.verdict === 'strong' ? '✅ Strong Offer' : r.verdict === 'fair' ? '⚠️ Fair — Room to Negotiate' : '🚩 Below Market — Counter Hard';

  return `
    <!-- Verdict -->
    <div class="card" style="background:${verdictBg};border:2px solid ${verdictColor}">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;flex-wrap:wrap">
        <div style="font-size:32px;font-weight:800;color:${verdictColor};font-family:'Familjen Grotesk',sans-serif">${esc(r.offerBase||'?')}</div>
        <div>
          <div style="font-weight:700;font-size:16px;color:${verdictColor};font-family:'Familjen Grotesk',sans-serif">${verdictLabel}</div>
          <div style="font-size:13px;color:var(--text);margin-top:2px">${esc(r.verdictSummary||'')}</div>
        </div>
      </div>
      ${r.totalCompEstimate ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:8px">
        ${[
          { label:'Offer Total Comp', value: r.totalCompEstimate, color: verdictColor },
          { label:'Market Midpoint',  value: r.marketMidpoint,   color: 'var(--accent)' },
          { label:'Your Counter Ask', value: r.counterAsk,       color: 'var(--green)' }
        ].map(s => `
          <div style="background:white;border-radius:2px;padding:10px;text-align:center;border:1px solid ${s.color}30">
            <div style="font-size:16px;font-weight:800;color:${s.color};font-family:'Familjen Grotesk',sans-serif">${esc(s.value||'—')}</div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px">${s.label}</div>
          </div>`).join('')}
      </div>` : ''}
    </div>

    <!-- Military comp translation -->
    ${r.militaryCompTranslation ? `
    <div class="card" style="border-left:4px solid var(--gold)">
      <h2>🪖 Your Military Comp — Translated</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 12px">What your military package was actually worth in civilian terms. Use this as your internal anchor.</p>
      <div style="font-size:13px;color:var(--text);line-height:1.8;white-space:pre-line">${esc(r.militaryCompTranslation)}</div>
    </div>` : ''}

    <!-- Negotiable levers -->
    ${r.levers?.length ? `
    <div class="card">
      <h2>🎚️ Negotiation Levers — What to Push On</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 14px">Ranked by how negotiable each item typically is at this type of employer. Green = high success rate, yellow = worth asking, red = usually fixed.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${r.levers.map(l => {
          const lc = l.negotiability === 'high' ? 'var(--green)' : l.negotiability === 'medium' ? 'var(--gold)' : 'var(--red)';
          const lb = l.negotiability === 'high' ? 'var(--green-light)' : l.negotiability === 'medium' ? 'var(--gold-light)' : 'var(--red-light)';
          return `
          <div style="display:flex;align-items:start;gap:12px;padding:12px;border:1px solid var(--rule);border-radius:2px;background:white">
            <div style="width:10px;height:10px;border-radius:50%;background:${lc};flex-shrink:0;margin-top:4px"></div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:13px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${esc(l.lever)}</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">${esc(l.rationale)}</div>
              ${l.script ? `<div style="font-size:12px;color:var(--green);background:var(--green-light);border-radius:2px;padding:6px 8px;margin-top:6px;font-style:italic">"${esc(l.script)}"</div>` : ''}
            </div>
            <div style="font-size:10px;font-weight:700;color:${lc};background:${lb};padding:2px 8px;border-radius:2px;white-space:nowrap;font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.04em;flex-shrink:0">${l.negotiability?.toUpperCase()}</div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- Counter email -->
    ${r.counterEmail ? `
    <div class="card" style="border-left:4px solid var(--green)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="margin:0">✉️ Your Counter Offer Email</h2>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0">Copy, personalize the brackets, and send. Don't overthink it.</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="copyCounterEmail()">📋 Copy Email</button>
      </div>
      <div id="counter-email-text" style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;padding:16px;font-size:13px;color:var(--text);line-height:1.8;white-space:pre-line;font-family:'Lora',serif">${esc(r.counterEmail)}</div>
    </div>` : ''}

    <!-- Verbal script -->
    ${r.verbalScript ? `
    <div class="card" style="background:var(--green-light);border:1px solid #c8e6cd">
      <h2>📞 If They Call Instead</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 12px">Word-for-word script for a phone counter. Say this, then stop talking.</p>
      <div style="font-size:13px;color:var(--green);line-height:1.8;white-space:pre-line;font-style:italic">${esc(r.verbalScript)}</div>
    </div>` : ''}

    <!-- Walk-away guidance -->
    ${r.walkAway ? `
    <div class="card" style="background:var(--red-light);border:1px solid #e8c0c0">
      <h2 style="color:var(--red)">🚪 Know Your Walk-Away Number</h2>
      <div style="font-size:13px;color:var(--red);line-height:1.7;white-space:pre-line">${esc(r.walkAway)}</div>
    </div>` : ''}`;
}

// ── Offer analysis generator ───────────────────────────────────────────

async function generateOfferAnalysis() {
  // Read all DOM values first
  const inputs = {
    title:         document.getElementById('off-title')?.value?.trim()       || '',
    company:       document.getElementById('off-company')?.value?.trim()     || '',
    location:      document.getElementById('off-location')?.value?.trim()    || '',
    companyType:   document.getElementById('off-company-type')?.value        || 'large-defense',
    base:          document.getElementById('off-base')?.value?.trim()        || '',
    signing:       document.getElementById('off-signing')?.value?.trim()     || '',
    bonus:         document.getElementById('off-bonus')?.value?.trim()       || '',
    equity:        document.getElementById('off-equity')?.value?.trim()      || '',
    pto:           document.getElementById('off-pto')?.value?.trim()         || '',
    start:         document.getElementById('off-start')?.value               || '',
    health:        document.getElementById('off-health')?.value?.trim()      || '',
    remote:        document.getElementById('off-remote')?.value              || '',
    other:         document.getElementById('off-other')?.value?.trim()       || '',
    milBase:       document.getElementById('off-mil-base')?.value?.trim()    || '',
    milBah:        document.getElementById('off-mil-bah')?.value?.trim()     || '',
    milBas:        document.getElementById('off-mil-bas')?.value?.trim()     || '',
    milSpecial:    document.getElementById('off-mil-special')?.value?.trim() || '',
    milYears:      document.getElementById('off-mil-years')?.value?.trim()   || '',
    milRetirement: document.getElementById('off-mil-retirement')?.value      || '',
    excitement:    document.getElementById('off-excitement')?.value          || 'very',
    competing:     document.getElementById('off-competing')?.value           || 'no',
    concern:       document.getElementById('off-concern')?.value?.trim()     || ''
  };

  if (!inputs.title || !inputs.base) {
    showToast('Enter the job title and base salary at minimum', false); return;
  }

  const p = state.profile;

  setState({ ui: { ...state.ui, offerBusy: true, offerError: '', offerResult: null, offerInputs: inputs } });

  try {
    const raw = await callClaude(
      `You are a compensation expert and veteran career coach who has helped hundreds of transitioning military officers and senior enlisted negotiate their first civilian offers. You are direct, specific, and use real dollar amounts — not ranges or vague advice.

Your job is to:
1. Calculate what their military compensation is actually worth in civilian terms
2. Benchmark the offer against market data for the role and location
3. Identify every lever they can negotiate, ranked by success probability
4. Write a professional counter email they can send as-is with minor personalization
5. Write a verbal script for phone conversations

You never say "it depends" without then giving a specific answer. Every recommendation has a dollar figure attached.`,

      `Analyze this job offer for a transitioning military veteran and generate a complete negotiation package.

VETERAN:
Branch: ${p.branch||'Military'} | Rank: ${p.rank||'N/A'} | Years: ${p.yearsOfService||inputs.milYears||'N/A'}
MOS/Rate: ${p.mosRate||'N/A'} | Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
Location: ${inputs.location||p.location||'Not specified'}

MILITARY COMPENSATION:
Base Pay: ${inputs.milBase||'Not provided'}/mo
BAH: ${inputs.milBah||'Not provided'}/mo
BAS: ${inputs.milBas||'Not provided'}/mo
Special Pay: ${inputs.milSpecial||'None'}
Years of Service: ${inputs.milYears||p.yearsOfService||'Unknown'}
Retirement: ${inputs.milRetirement||'Not specified'}

THE OFFER:
Role: ${inputs.title} at ${inputs.company}
Company Type: ${inputs.companyType}
Location: ${inputs.location} | Remote: ${inputs.remote||'Not specified'}
Base Salary: ${inputs.base}
Signing Bonus: ${inputs.signing||'Not offered'}
Annual Bonus: ${inputs.bonus||'Not mentioned'}
Equity/RSUs: ${inputs.equity||'None'}
PTO: ${inputs.pto||'Not specified'}
Healthcare: ${inputs.health||'Not specified'}
Other Benefits: ${inputs.other||'None mentioned'}
Start Date: ${inputs.start||'Not specified'}

CONTEXT:
Excitement Level: ${inputs.excitement}
Competing Offers: ${inputs.competing}
Veteran's Concern: ${inputs.concern||'None specified'}

Return ONLY this JSON (no markdown, no extra text):
{
  "verdict": "strong|fair|weak",
  "offerBase": "the base salary as offered e.g. $115,000",
  "verdictSummary": "One direct sentence on where this offer stands — be specific",
  "totalCompEstimate": "estimated total annual comp including base+bonus+equity amortized e.g. $128,000",
  "marketMidpoint": "market midpoint for this role/location/company type e.g. $135,000",
  "counterAsk": "the specific number or package to counter with e.g. $130,000 base",
  "militaryCompTranslation": "Line-by-line breakdown of what their military package is worth in civilian equivalent terms. Include: base pay annualized, BAH tax advantage, BAS, healthcare value ($15-25K/yr civilian equivalent), retirement value if applicable, special pays. End with a TOTAL CIVILIAN EQUIVALENT number. Be specific with dollar amounts.",
  "levers": [
    {
      "lever": "Base Salary",
      "negotiability": "high|medium|low",
      "rationale": "Why this is or isn't negotiable at this company type. One sentence.",
      "script": "One sentence to say when asking for this specific thing — or null if not worth asking"
    }
  ],
  "counterEmail": "Complete professional email. Start with 'Dear [Hiring Manager Name],' — include: gratitude for offer, enthusiasm for role, specific counter ask with dollar amount, rationale tied to market data and experience, flexible close. Use [BRACKETS] for anything they need to fill in. End with their name and contact info placeholders. 150-200 words.",
  "verbalScript": "Word-for-word phone script. 3-4 sentences. Confident, warm, specific. End with silence — tell them to stop after the last sentence.",
  "walkAway": "Specific walk-away guidance: what is the minimum acceptable package given their military comp equivalent and market data? Give a dollar figure and the 1-2 conditions that would change it."
}`
    );

    let result;
    try {
      result = typeof extractJSON === 'function'
        ? extractJSON(raw)
        : JSON.parse(raw.replace(/```json|```/g,'').trim());
    } catch(e) { throw new Error('Could not parse analysis. Try again.'); }

    setState({ ui: { ...state.ui, offerBusy: false, offerResult: result } });
    if (typeof trackAction === 'function') trackAction('offer_analyze');
    showToast('✓ Offer analysis ready — scroll down for your counter email');
  } catch(err) {
    setState({ ui: { ...state.ui, offerBusy: false, offerError: err.message } });
  }
}

// ── Copy counter email ─────────────────────────────────────────────────

function copyCounterEmail() {
  const text = document.getElementById('counter-email-text')?.innerText || '';
  navigator.clipboard.writeText(text)
    .then(() => showToast('✓ Counter email copied — paste into your email client'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('✓ Copied!');
    });
}

// ── Salary intel generator (existing, unchanged) ───────────────────────

async function generateSalaryIntel() {
  const selJob      = state.ui.salaryJob;
  const manualRole  = document.getElementById('sal-role')?.value?.trim()         || '';
  const location    = document.getElementById('sal-location')?.value?.trim()      || '';
  const companyType = document.getElementById('sal-company-type')?.value          || state.ui.salaryCompanyType || 'large-defense';
  const current     = document.getElementById('sal-current')?.value?.trim()       || '';
  const worry       = document.getElementById('sal-worry')?.value?.trim()         || '';

  const job = selJob ? state.jobs.find(j=>j.id===selJob) : null;
  const roleDescription = job
    ? `${job.title} at ${job.company} (${job.location||location||'location unknown'})`
    : manualRole;
  if (!roleDescription) { showToast('Select a job or enter a role', false); return; }

  setState({ ui:{...state.ui,
    salaryRole: manualRole, salaryLocation: location,
    salaryCurrent: current, salaryWorry: worry,
    salaryCompanyType: companyType,
    salaryBusy: true, salaryError: '', salaryResult: null
  }});

  const p = state.profile;
  try {
    const raw = await callClaude(
      `You are a compensation expert and career coach who specializes in helping military veterans negotiate their first or next civilian salary. You understand the defense contracting market, GS pay scales, defense-tech startup comp structures, and how to translate military experience into salary leverage. You give direct, specific advice — not platitudes.`,
      `Provide salary intelligence and negotiation coaching for this veteran.

ROLE: ${roleDescription}
COMPANY TYPE: ${companyType}
MARKET: ${location||'Not specified'}
VETERAN: ${p.branch} | ${p.rank} | ${p.yearsOfService} years | Clearance: ${p.clearance||'None'} (${p.clearanceStatus||'N/A'})
CURRENT/RECENT COMP: ${current||'Not provided'}
NEGOTIATION CONCERN: ${worry||'None specified'}
SKILLS: ${[...(p.technicalSkills||[]),(p.softSkills||[])].slice(0,8).join(', ')||'N/A'}

Return ONLY this JSON (no markdown):
{
  "floor": "Minimum acceptable — e.g. $95,000",
  "target": "What to ask for — e.g. $125,000",
  "ceiling": "Stretch number for strong negotiators — e.g. $145,000",
  "marketContext": "2-3 sentences explaining why these numbers are right for this role/market/company type. Be specific about what drives comp in this sector.",
  "veteranPremiums": "Bullet list of the veteran's specific leverage points — clearance value in dollar terms if applicable, leadership experience premium, any in-demand skills. Be specific with numbers where possible.",
  "negotiationScript": "Word-for-word script for when they ask 'What are your salary expectations?' — confident, specific, leaves room to negotiate. 3-4 sentences.",
  "totalComp": "Beyond base: what else to negotiate — signing bonus, equity/RSUs if startup, annual bonus target, clearance maintenance pay, remote flexibility, PTO, professional development budget. List as bullets.",
  "redFlags": "2-3 specific things to watch out for in this type of offer — common lowball tactics, benefits traps, title inflation, etc."
}`, 'salary');

    let result;
    try { result = extractJSON(raw); } catch(e) { throw new Error('Could not parse salary data. Try again.'); }
    setState({ ui:{...state.ui, salaryBusy:false, salaryResult:result} });
    if (typeof trackAction==='function') trackAction('salary_generate');
    showToast('✓ Salary intelligence ready!');
  } catch(err) {
    setState({ ui:{...state.ui, salaryBusy:false, salaryError:err.message} });
  }
}
