// ── airline-pay.js — Airline Pay Comparison (#7) ─────────────────────
//
// Side-by-side pay scale comparison for major U.S. carriers.
// Data based on publicly available contract information from
// Airline Pilot Central (airlinepilotcentral.com) and FAPA.aero.
// Rates are approximate and change with contract negotiations —
// always verify at APC or the specific airline's pilot contract.
//
// ──────────────────────────────────────────────────────────────────────

// ── Pay data ──────────────────────────────────────────────────────────
// Hourly rates by year of service (FO and CA)
// Assumes ~1,000 credit hours/year for annual estimate
// Data approximate as of 2024-2025 contracts

const AIRLINE_PAY_DATA = [
  {
    id:       'delta',
    name:     'Delta Air Lines',
    icon:     '🔴',
    type:     'major',
    hub:      'ATL',
    fleet:    'A220, A321, A330, A350, B737, B757, B767, B777',
    contract: 'JCBA 2023',
    notes:    'Industry-leading contract. Strong profit sharing (average 15-20% additional annually).',
    fo: [84, 95, 108, 127, 143, 179, 197, 214, 220, 220, 220, 220],
    ca: [null, null, null, null, null, 248, 271, 289, 307, 317, 323, 331]
  },
  {
    id:       'united',
    name:     'United Airlines',
    icon:     '🔵',
    type:     'major',
    hub:      'ORD/EWR/IAH/DEN/SFO/LAX',
    fleet:    'A319, A320, B737, B757, B767, B777, B787',
    contract: 'JCBA 2023',
    notes:    'Large widebody fleet. Good international routes. Strong upgrade timeline.',
    fo: [84, 94, 107, 125, 141, 174, 191, 207, 213, 213, 213, 213],
    ca: [null, null, null, null, null, 242, 264, 281, 298, 308, 314, 322]
  },
  {
    id:       'american',
    name:     'American Airlines',
    icon:     '🦅',
    type:     'major',
    hub:      'DFW/CLT/PHL/MIA/ORD/PHX',
    fleet:    'A319, A320, A321, B737, B777, B787',
    contract: 'JCBA 2023',
    notes:    'Largest fleet by aircraft count. Lots of bases. New contract significantly improved rates.',
    fo: [84, 92, 105, 121, 137, 168, 185, 200, 206, 206, 206, 206],
    ca: [null, null, null, null, null, 236, 258, 275, 292, 300, 306, 313]
  },
  {
    id:       'southwest',
    name:     'Southwest Airlines',
    icon:     '💛',
    type:     'major',
    hub:      'DAL/HOU/MDW/BWI/PHX/LAS',
    fleet:    'B737 (all variants)',
    contract: 'Tentative Agreement 2024',
    notes:    'Single aircraft type. No international. Strong culture. Point-to-point model.',
    fo: [82, 91, 103, 121, 134, 158, 175, 190, 196, 196, 196, 196],
    ca: [null, null, null, null, null, 228, 248, 265, 281, 290, 296, 302]
  },
  {
    id:       'alaska',
    name:     'Alaska Airlines',
    icon:     '🏔️',
    type:     'major',
    hub:      'SEA/PDX/SFO/LAX/ANC',
    fleet:    'A320, A321, B737, E175',
    contract: 'JCBA 2023',
    notes:    'West Coast focused. Virgin America integration complete. Good QOL reputation.',
    fo: [79, 88, 100, 116, 131, 160, 176, 191, 197, 197, 197, 197],
    ca: [null, null, null, null, null, 224, 245, 261, 277, 286, 291, 298]
  },
  {
    id:       'fedex',
    name:     'FedEx Express',
    icon:     '📦',
    type:     'cargo',
    hub:      'MEM/IND/OAK/ANC',
    fleet:    'B767, B777, MD-11, ATR-42, ATR-72',
    contract: 'JCBA 2023',
    notes:    'Night flying required. No passengers. Excellent pay, benefits, and QOL. Retirement plan top-tier.',
    fo: [88, 98, 113, 132, 150, 182, 201, 218, 225, 225, 225, 225],
    ca: [null, null, null, null, null, 256, 280, 299, 318, 328, 334, 343]
  },
  {
    id:       'ups',
    name:     'UPS Airlines',
    icon:     '🟤',
    type:     'cargo',
    hub:      'SDF/ONT/PHL/DFW',
    fleet:    'A300, B747, B757, B767, MD-11',
    contract: 'JCBA 2023',
    notes:    'Competitive with FedEx. Large widebody operation. Good retirement and benefits.',
    fo: [86, 96, 110, 129, 147, 178, 196, 213, 220, 220, 220, 220],
    ca: [null, null, null, null, null, 250, 274, 292, 311, 320, 326, 335]
  },
  {
    id:       'skywest',
    name:     'SkyWest Airlines',
    icon:     '🌤️',
    type:     'regional',
    hub:      'SLC/ORD/DEN/LAX/SFO',
    fleet:    'CRJ200, CRJ700, CRJ900, E175',
    contract: 'Current agreement 2023',
    notes:    'Largest regional. Codeshares with Delta, United, American, Alaska. Good stepping stone.',
    fo: [55, 62, 72, 85, 96, 113, 124, 135, 139, 139, 139, 139],
    ca: [null, null, null, null, null, 159, 174, 186, 197, 204, 208, 212]
  }
];

const CREDIT_HOURS_PER_YEAR = 1000; // Standard airline credit hours per year for annual estimate

// ── Main render ────────────────────────────────────────────────────────

function renderAirlinePay() {
  const airlineOn    = typeof isAirlinePath === 'function' && isAirlinePath();
  const viewMode     = state.ui.payViewMode   || 'fo';       // fo | ca | both
  const filterType   = state.ui.payFilterType || 'all';      // all | major | cargo | regional
  const selectedYear    = parseInt(state.ui.payYear || '1');    // 1-12
  const longevityCredit = parseInt(state.ui.payCredit || '0');  // years of credit given by airline
  const effectiveYear   = Math.min(12, selectedYear + longevityCredit);
  const showAnnual   = state.ui.payShowAnnual !== false;     // hourly vs annual

  const filtered = filterType === 'all'
    ? AIRLINE_PAY_DATA
    : AIRLINE_PAY_DATA.filter(a => a.type === filterType);

  if (!airlineOn) {
    return `
      <h1 style="font-size:24px;font-weight:800;margin:0 0 16px">✈️ Airline Pay Comparison</h1>
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:32px;margin-bottom:12px">✈️</div>
        <div style="font-weight:700;font-size:15px;color:var(--accent);margin-bottom:8px">Activate your Airline path first</div>
        <button class="btn btn-primary" onclick="setState({view:'profile'})">Go to Profile</button>
      </div>`;
  }

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent)">✈️ Airline Pay Comparison</h1>
    <p style="color:var(--muted);font-size:13px;margin:0 0 4px">Side-by-side pay scale comparison for major U.S. carriers. Rates are approximate — verify at <a href="https://www.airlinepilotcentral.com" target="_blank" style="color:var(--accent)">airlinepilotcentral.com</a> before making decisions.</p>
    <div style="font-size:11px;color:var(--dim);margin:0 0 20px">Data based on 2023-2024 contracts. Assumes ~${CREDIT_HOURS_PER_YEAR.toLocaleString()} credit hours/year for annual estimates. Subject to change with contract negotiations.</div>

    <!-- Controls -->
    <div class="card">
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:end">

        <!-- FO / CA / Both -->
        <div class="field" style="margin:0">
          <label class="field-label">Show</label>
          <div style="display:flex;gap:0;border-radius:2px;overflow:hidden;border:1.5px solid var(--rule-dark)">
            ${[['fo','🪑 First Officer'],['ca','👨‍✈️ Captain'],['both','Both']].map(([v,l]) => `
              <button onclick="toggleUI('payViewMode','${v}')" style="padding:7px 14px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;background:${viewMode===v?'var(--accent)':'white'};color:${viewMode===v?'white':'var(--muted)'}${v!=='fo'?';border-left:1px solid var(--rule-dark)':''}">${l}</button>
            `).join('')}
          </div>
        </div>

        <!-- Year of service slider -->
        <div class="field" style="margin:0;flex:1;min-width:180px">
          <label class="field-label">Year of Service: <strong style="color:var(--accent)">Year ${selectedYear}</strong>${longevityCredit > 0 ? ` <span style="color:var(--green);font-size:10px">+ ${longevityCredit}yr credit → Effective Year ${effectiveYear}</span>` : ''}</label>
          <input type="range" min="1" max="12" value="${selectedYear}"
            oninput="toggleUI('payYear',this.value)"
            style="width:100%;accent-color:var(--accent)">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--dim);margin-top:2px"><span>Year 1</span><span>Year 12</span></div>
        </div>

        <!-- Hourly / Annual toggle -->
        <div class="field" style="margin:0">
          <label class="field-label">Display</label>
          <div style="display:flex;gap:0;border-radius:2px;overflow:hidden;border:1.5px solid var(--rule-dark)">
            <button onclick="toggleUI('payShowAnnual',false)" style="padding:7px 14px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;background:${!showAnnual?'var(--accent)':'white'};color:${!showAnnual?'white':'var(--muted)'}">$/hr</button>
            <button onclick="toggleUI('payShowAnnual',true)" style="padding:7px 14px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:'Familjen Grotesk',sans-serif;background:${showAnnual?'var(--accent)':'white'};color:${showAnnual?'white':'var(--muted)'};border-left:1px solid var(--rule-dark)">Annual est.</button>
          </div>
        </div>

        <!-- Longevity credit -->
        <div class="field" style="margin:0">
          <label class="field-label">Longevity Credit (yrs)</label>
          <div style="display:flex;align-items:center;gap:6px">
            <input type="number" min="0" max="11" value="${longevityCredit}"
              onchange="toggleUI('payCredit',Math.max(0,Math.min(11,parseInt(this.value)||0)))"
              style="width:64px;font-size:14px;font-weight:700;text-align:center;padding:7px 6px">
            <span style="font-size:11px;color:var(--dim)">years given<br>by airline</span>
          </div>
        </div>

        <!-- Filter type -->
        <div class="field" style="margin:0">
          <label class="field-label">Filter</label>
          <select onchange="toggleUI('payFilterType',this.value)" style="font-size:13px;padding:7px 10px">
            <option value="all"      ${filterType==='all'     ?'selected':''}>All Carriers</option>
            <option value="major"    ${filterType==='major'   ?'selected':''}>Majors Only</option>
            <option value="cargo"    ${filterType==='cargo'   ?'selected':''}>Cargo Only</option>
            <option value="regional" ${filterType==='regional'?'selected':''}>Regional Only</option>
          </select>
        </div>

      </div>
    </div>

    <!-- Pay comparison cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-bottom:16px">
      ${filtered.map(a => renderAirlinePayCard(a, viewMode, selectedYear, showAnnual, effectiveYear, longevityCredit)).join('')}
    </div>

    <!-- Full scale table -->
    <div class="card">
      <h2>📊 Full Pay Scale Table — ${viewMode === 'fo' ? 'First Officers' : viewMode === 'ca' ? 'Captains' : 'FO & Captain'}</h2>
      ${longevityCredit > 0 ? `<div style="background:var(--green-light);border:1px solid #c8e6cd;border-radius:2px;padding:7px 12px;font-size:12px;color:var(--green);margin-bottom:10px">✓ With <strong>${longevityCredit}-year longevity credit</strong>, a new hire starts at <strong>Year ${longevityCredit + 1} pay</strong>. The highlighted column shows your effective starting year.</div>` : ''}
      <p style="font-size:12px;color:var(--muted);margin:-8px 0 14px">All years of service · ${showAnnual ? `Estimated annual (${CREDIT_HOURS_PER_YEAR.toLocaleString()} credit hrs)` : 'Hourly rate'}</p>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px">
          <thead>
            <tr style="background:var(--accent)">
              <th style="padding:8px 10px;color:white;font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.06em;text-align:left;white-space:nowrap">Airline</th>
              ${Array.from({length:12},(_,i)=>`<th style="padding:8px 6px;color:white;font-family:'Familjen Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.04em;text-align:center">Yr ${i+1}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filtered.map((a, ai) => {
              const rows = [];
              if (viewMode === 'fo' || viewMode === 'both') {
                rows.push(`
                  <tr style="background:${ai%2===0?'white':'var(--paper)'}">
                    <td style="padding:8px 10px;font-weight:700;white-space:nowrap">${a.icon} ${a.name}${viewMode==='both'?' (FO)':''}</td>
                    ${a.fo.map((rate, rIdx) => {
                      const val = rate ? (showAnnual ? '$'+Math.round(rate*CREDIT_HOURS_PER_YEAR/1000)+'K' : '$'+rate) : '—';
                      const isStart = longevityCredit > 0 && rIdx === longevityCredit;
                      return `<td style="padding:6px;text-align:center;color:${isStart?'var(--gold)':'var(--accent)'};font-weight:${isStart?'800':'400'};background:${isStart?'var(--gold-light)':'transparent'}">${val}${isStart?' ★':''}</td>`;
                    }).join('')}
                  </tr>`);
              }
              if (viewMode === 'ca' || viewMode === 'both') {
                rows.push(`
                  <tr style="background:${viewMode==='both'?'var(--green-light)':ai%2===0?'white':'var(--paper)'}">
                    <td style="padding:8px 10px;font-weight:700;color:var(--green);white-space:nowrap">${a.icon} ${a.name}${viewMode==='both'?' (CA)':''}</td>
                    ${a.ca.map((rate, rIdx) => {
                      const val = rate ? (showAnnual ? '$'+Math.round(rate*CREDIT_HOURS_PER_YEAR/1000)+'K' : '$'+rate) : '—';
                      const isStart = longevityCredit > 0 && rIdx === longevityCredit;
                      return `<td style="padding:6px;text-align:center;color:${isStart?'var(--gold)':'var(--green)'};font-weight:${isStart?'800':rate?'600':'400'};background:${isStart?'var(--gold-light)':'transparent'}">${val}${isStart?' ★':''}</td>`;
                    }).join('')}
                  </tr>`);
              }
              return rows.join('');
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--dim)">
        "—" indicates year not yet reached in the contract scale (Captain upgrade typically occurs around Year 5-8 depending on base and equipment). Annual estimate = hourly rate × ${CREDIT_HOURS_PER_YEAR.toLocaleString()} credit hours. Does not include per diem, profit sharing, or bonuses.
      </div>
    </div>

    <!-- Total comp context -->
    <div class="card" style="background:var(--gold-light);border:1px solid var(--gold)">
      <h2>💰 Beyond the Hourly Rate</h2>
      <div style="font-size:13px;color:var(--text);line-height:1.8">
        The hourly rate is only part of total compensation. When comparing offers, factor in:
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:12px;font-size:12px">
        ${[
          { label:'Per Diem',        detail:'$2.00-2.50/hr on-the-road. 80hr/mo trip = $160-200/mo additional, tax-advantaged.' },
          { label:'Profit Sharing',  detail:'Delta and others regularly pay 10-20% of annual salary. In good years, adds $15-30K+.' },
          { label:'Signing Bonus',   detail:'Many carriers offer $10-50K signing bonuses. Usually spread over 3-5 years.' },
          { label:'Retirement',      detail:'Airlines typically offer 16-17% company contribution to 401K. FedEx/UPS often higher.' },
          { label:'Benefits',        detail:'Family health insurance, pass travel for entire family, life insurance.' },
          { label:'Schedule Quality',detail:'Cargo often has more QOL than passenger. Night flying preference matters.' }
        ].map(c => `
          <div style="background:white;border-radius:2px;padding:10px;border:1px solid var(--gold)30">
            <div style="font-weight:700;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;margin-bottom:3px">${c.label}</div>
            <div style="color:var(--text)">${c.detail}</div>
          </div>`).join('')}
      </div>
      <div style="margin-top:12px;font-size:11px;color:var(--muted)">
        Verify current rates at <a href="https://www.airlinepilotcentral.com" target="_blank" style="color:var(--accent)">airlinepilotcentral.com</a> and <a href="https://www.fapa.aero" target="_blank" style="color:var(--accent)">fapa.aero</a> before making career decisions.
      </div>
    </div>`;
}

// ── Pay card ───────────────────────────────────────────────────────────

function renderAirlinePayCard(a, viewMode, year, showAnnual, effectiveYear, credit) {
  credit = credit || 0;
  const yrIdx = (effectiveYear || year) - 1;
  const foRate = a.fo[yrIdx] || a.fo[a.fo.length-1];
  const caRate = a.ca[yrIdx];

  const fmt = (rate) => {
    if (!rate) return '—';
    if (showAnnual) return '$' + Math.round(rate * CREDIT_HOURS_PER_YEAR / 1000) + 'K/yr';
    return '$' + rate + '/hr';
  };

  const typeColors = { major:'var(--accent)', cargo:'var(--green)', regional:'#7c3aed' };
  const typeLabels = { major:'Major', cargo:'Cargo', regional:'Regional' };

  return `
    <div class="card" style="margin-bottom:0;border-left:4px solid ${typeColors[a.type]||'var(--accent)'}">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px">
        <div>
          <div style="font-size:20px;margin-bottom:2px">${a.icon}</div>
          <div style="font-weight:700;font-size:14px;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${a.name}</div>
          <div style="font-size:10px;font-weight:700;color:${typeColors[a.type]};font-family:'Familjen Grotesk',sans-serif;letter-spacing:0.06em;text-transform:uppercase">${typeLabels[a.type]}</div>
        </div>
      </div>

      <!-- Year N pay -->
      <div style="display:grid;grid-template-columns:${viewMode==='both'?'1fr 1fr':'1fr'};gap:8px;margin-bottom:12px">
        ${viewMode !== 'ca' ? `
        <div style="text-align:center;background:var(--accent-light);border-radius:2px;padding:10px">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-bottom:3px">FO · Yr ${year}</div>
          <div style="font-size:20px;font-weight:800;color:var(--accent);font-family:'Familjen Grotesk',sans-serif">${fmt(foRate)}</div>
        </div>` : ''}
        ${viewMode !== 'fo' ? `
        <div style="text-align:center;background:var(--green-light);border-radius:2px;padding:10px">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-family:'Familjen Grotesk',sans-serif;margin-bottom:3px">CA · Yr ${year}</div>
          <div style="font-size:20px;font-weight:800;color:var(--green);font-family:'Familjen Grotesk',sans-serif">${fmt(caRate)}</div>
        </div>` : ''}
      </div>

      ${credit > 0 ? `<div style="font-size:10px;color:var(--green);background:var(--green-light);border-radius:2px;padding:3px 8px;margin-bottom:10px;font-family:'Familjen Grotesk',sans-serif;font-weight:700">+${credit}yr credit · Effective Year ${effectiveYear}</div>` : ''}
      <!-- Quick facts -->
      <div style="font-size:11px;color:var(--muted);line-height:1.7">
        <div><strong style="color:var(--text)">Hubs:</strong> ${a.hub}</div>
        <div><strong style="color:var(--text)">Fleet:</strong> ${a.fleet}</div>
        <div style="margin-top:6px;color:var(--text);font-style:italic">${a.notes}</div>
      </div>
    </div>`;
}
