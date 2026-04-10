// ── atp.js — ATP Minimums Calculator ──────────────────────────────────
//
// Reads directly from state.flightHours (built in pilot.js).
// No new data entry required — just calculates gaps and binding constraint.
//
// Pathways covered (14 CFR Part 61):
//   Standard ATP (§61.159):        1,500 total hours
//   R-ATP Military (§61.160(b)):     750 total hours (military pilot graduates)
//   R-ATP Degree 4-yr (§61.160(c)): 1,000 total hours
//   R-ATP Degree 2-yr (§61.160(c)): 1,250 total hours
// ──────────────────────────────────────────────────────────────────────

// ── Pathway definitions ────────────────────────────────────────────────

const ATP_PATHWAYS = {
  'military': {
    id:          'military',
    label:       'R-ATP — Military Pilot',
    shortLabel:  'Military R-ATP',
    icon:        '🪖',
    description: 'For graduates of military pilot training courses (14 CFR §61.160(b)). Qualifies you as First Officer at Part 121 airlines.',
    color:       'var(--accent)',
    bg:          'var(--accent-light)',
    requirements: {
      total:       { hours: 750,  label: 'Total Time',    tip: 'All logged flight time' },
      crossCountry:{ hours: 200,  label: 'Cross-Country', tip: 'Flights with landing point >50nm from departure' },
      night:       { hours: 100,  label: 'Night',         tip: 'Flight time between end of evening civil twilight and beginning of morning civil twilight' },
      instrument:  { hours: 75,   label: 'Instrument',    tip: 'Actual IMC or simulated instrument — max 25 hours in ATD/sim' },
      pic:         { hours: 250,  label: 'PIC',           tip: 'Pilot in Command flight time' }
    }
  },
  'degree4': {
    id:          'degree4',
    label:       'R-ATP — 4-Year Aviation Degree',
    shortLabel:  '4-Year R-ATP',
    icon:        '🎓',
    description: 'For graduates of a 4-year aviation degree program (14 CFR §61.160(c)). Qualifies you as First Officer at Part 121 airlines.',
    color:       '#7c3aed',
    bg:          '#f5f3ff',
    requirements: {
      total:       { hours: 1000, label: 'Total Time',    tip: 'All logged flight time' },
      crossCountry:{ hours: 500,  label: 'Cross-Country', tip: 'Flights with landing point >50nm from departure' },
      night:       { hours: 100,  label: 'Night',         tip: 'Night flight time' },
      instrument:  { hours: 75,   label: 'Instrument',    tip: 'Actual or simulated instrument time' },
      pic:         { hours: 250,  label: 'PIC',           tip: 'Pilot in Command flight time' }
    }
  },
  'degree2': {
    id:          'degree2',
    label:       'R-ATP — 2-Year Aviation Degree',
    shortLabel:  '2-Year R-ATP',
    icon:        '🎓',
    description: 'For graduates of a 2-year aviation degree program (14 CFR §61.160(c)). Qualifies you as First Officer at Part 121 airlines.',
    color:       '#0891b2',
    bg:          '#e0f7fa',
    requirements: {
      total:       { hours: 1250, label: 'Total Time',    tip: 'All logged flight time' },
      crossCountry:{ hours: 500,  label: 'Cross-Country', tip: 'Flights with landing point >50nm from departure' },
      night:       { hours: 100,  label: 'Night',         tip: 'Night flight time' },
      instrument:  { hours: 75,   label: 'Instrument',    tip: 'Actual or simulated instrument time' },
      pic:         { hours: 250,  label: 'PIC',           tip: 'Pilot in Command flight time' }
    }
  },
  'standard': {
    id:          'standard',
    label:       'Standard ATP (§61.159)',
    shortLabel:  'Standard ATP',
    icon:        '⭐',
    description: 'Full ATP certificate. Required to serve as PIC (Captain) at Part 121 airlines. All pilots eventually need this.',
    color:       'var(--green)',
    bg:          'var(--green-light)',
    requirements: {
      total:       { hours: 1500, label: 'Total Time',    tip: 'All logged flight time' },
      crossCountry:{ hours: 500,  label: 'Cross-Country', tip: 'Flights with landing point >50nm from departure' },
      night:       { hours: 100,  label: 'Night',         tip: 'Night flight time' },
      instrument:  { hours: 75,   label: 'Instrument',    tip: 'Actual or simulated instrument — max 25 hours in ATD' },
      pic:         { hours: 250,  label: 'PIC',           tip: 'Pilot in Command flight time' }
    }
  }
};

// ── Main render ────────────────────────────────────────────────────────

function renderATP() {
  const airlineOn = typeof isAirlinePath === 'function' && isAirlinePath();

  if (!airlineOn) {
    return `
      <h1 style="font-size:24px;font-weight:800;margin:0 0 16px">✈️ ATP Minimums Calculator</h1>
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:32px;margin-bottom:12px">✈️</div>
        <div style="font-weight:700;font-size:15px;color:var(--accent);margin-bottom:8px">Activate your Airline path first</div>
        <div style="font-size:13px;color:var(--muted);margin-bottom:16px">Go to Profile → Career Paths → activate ✈️ Airline / Aviation to unlock this tool.</div>
        <button class="btn btn-primary" onclick="setState({view:'profile'})">Go to Profile</button>
      </div>`;
  }

  const fh       = typeof getFlightHours === 'function' ? getFlightHours() : (state.flightHours || { military:{}, civilian:[] });
  const combined = typeof calcCombinedHours === 'function' ? calcCombinedHours() : {};
  const certs    = typeof getPilotCerts === 'function' ? getPilotCerts() : (state.profile.pilotCerts || {});

  // Get hours — prefer combined, fall back to military only
  const hours = {
    total:        combined.total        || parseFloat(fh.military?.total        || 0),
    crossCountry: combined.crossCountry || 0,  // not currently tracked separately — show 0 with note
    night:        combined.night        || parseFloat(fh.military?.night        || 0),
    instrument:   combined.instrument   || parseFloat(fh.military?.instrument   || 0),
    pic:          combined.pic          || parseFloat(fh.military?.pic          || 0)
  };

  const hasHours = hours.total > 0;

  // Active pathway selection
  const selectedPathway = state.ui.atpPathway || 'military';
  const pathway = ATP_PATHWAYS[selectedPathway];

  // Calculate gaps for selected pathway
  const gaps = calculateGaps(hours, pathway.requirements);
  const binding = findBindingConstraint(gaps);
  const allMet  = gaps.every(g => g.remaining <= 0);

  // Monthly rate for ETE estimate
  const hoursPerMonth = parseFloat(state.ui.atpMonthlyRate || '30');

  return `
    <h1 style="font-family:'Familjen Grotesk',sans-serif;font-size:22px;font-weight:700;margin:0 0 4px;color:var(--accent)">✈️ ATP Minimums Calculator</h1>
    <p style="color:var(--muted);font-size:13px;margin:0 0 20px">Track your progress toward FAA ATP certificate requirements. Your flight hours are loaded automatically from your pilot profile.</p>

    ${!hasHours ? `
    <div class="card" style="border-left:4px solid var(--gold);background:var(--gold-light)">
      <div style="font-weight:700;font-size:14px;color:var(--accent);margin-bottom:6px">No flight hours entered yet</div>
      <div style="font-size:13px;color:var(--text);margin-bottom:12px">Enter your flight hours in your Profile → Airline section to see your ATP progress.</div>
      <button class="btn btn-primary" onclick="setState({view:'profile'})">Enter Flight Hours →</button>
    </div>` : ''}

    <!-- Current hours snapshot -->
    ${hasHours ? `
    <div class="card" style="border-left:4px solid var(--gold)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <h2 style="margin:0">📊 Your Current Hours</h2>
        <button onclick="setState({view:'profile'})" style="background:none;border:none;color:var(--accent);font-size:12px;font-weight:700;cursor:pointer;font-family:'Familjen Grotesk',sans-serif">Update hours in Profile →</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px">
        ${[
          { label:'Total',    value: hours.total,        note: '' },
          { label:'PIC',      value: hours.pic,          note: '' },
          { label:'Night',    value: hours.night,        note: '' },
          { label:'Instrument',value: hours.instrument,  note: '' },
          { label:'X-Country',value: hours.crossCountry, note: hours.crossCountry === 0 ? 'Not tracked' : '' }
        ].map(h => `
          <div style="text-align:center;background:var(--paper);border-radius:2px;padding:10px;border:1px solid var(--rule)">
            <div style="font-size:22px;font-weight:800;color:var(--accent);font-family:'Familjen Grotesk',sans-serif;line-height:1">${h.value > 0 ? h.value.toLocaleString() : h.note || '0'}</div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:3px;font-family:'Familjen Grotesk',sans-serif">${h.label}</div>
          </div>`).join('')}
      </div>
      ${hours.crossCountry === 0 ? `
      <div style="margin-top:10px;font-size:11px;color:var(--gold);background:var(--gold-light);border-radius:2px;padding:6px 10px">
        ⚠️ Cross-country time isn't tracked in your logbook yet — enter it in Profile → Airline section to see accurate progress.
      </div>` : ''}
      ${certs.atp ? `<div style="margin-top:10px;font-size:12px;color:var(--green);font-weight:700">✅ ATP Certificate already held — you're qualified!</div>` : ''}
    </div>` : ''}

    <!-- Pathway selector -->
    <div class="card">
      <h2>Select Your ATP Pathway</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 14px">Choose the pathway that applies to your situation. Most military pilots use R-ATP Military.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
        ${Object.values(ATP_PATHWAYS).map(p => `
          <div onclick="toggleUI('atpPathway','${p.id}')"
            style="padding:12px;border:2px solid ${selectedPathway===p.id?p.color:'var(--rule-dark)'};background:${selectedPathway===p.id?p.bg:'white'};border-radius:2px;cursor:pointer;transition:all 0.15s">
            <div style="font-size:18px;margin-bottom:4px">${p.icon}</div>
            <div style="font-weight:700;font-size:12px;color:${p.color};font-family:'Familjen Grotesk',sans-serif">${p.shortLabel}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${Object.values(p.requirements)[0].hours.toLocaleString()} total hours</div>
          </div>`).join('')}
      </div>
      <div style="margin-top:12px;background:${pathway.bg};border:1px solid ${pathway.color}30;border-radius:2px;padding:10px 14px;font-size:13px;color:var(--text)">
        ${pathway.icon} <strong>${pathway.label}</strong> — ${pathway.description}
      </div>
    </div>

    <!-- Progress cards -->
    <div class="card" style="border-left:4px solid ${pathway.color}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <h2 style="margin:0">${pathway.shortLabel} — Progress</h2>
        ${allMet ? `<span style="background:var(--green-light);color:var(--green);border:1px solid #c8e6cd;border-radius:2px;padding:4px 12px;font-size:12px;font-weight:700;font-family:'Familjen Grotesk',sans-serif">✅ ALL MINIMUMS MET</span>` : ''}
      </div>

      ${allMet ? `
      <div style="background:var(--green-light);border:2px solid #c8e6cd;border-radius:2px;padding:20px;text-align:center;margin-bottom:16px">
        <div style="font-size:32px;margin-bottom:8px">🎉</div>
        <div style="font-weight:700;font-size:16px;color:var(--green);font-family:'Familjen Grotesk',sans-serif">You meet all ${pathway.shortLabel} minimums!</div>
        <div style="font-size:13px;color:var(--muted);margin-top:6px">You're eligible to apply for your ATP certificate and to apply to Part 121 airlines as a First Officer${selectedPathway==='standard'?' or Captain':''}.</div>
      </div>` : ''}

      <div style="display:flex;flex-direction:column;gap:12px">
        ${gaps.map(g => renderProgressBar(g, pathway.color, binding?.key === g.key)).join('')}
      </div>
    </div>

    <!-- Binding constraint callout -->
    ${!allMet && binding ? `
    <div class="card" style="background:var(--gold-light);border:2px solid var(--gold)">
      <h2>⏱️ Your Binding Constraint</h2>
      <div style="font-size:14px;color:var(--text);line-height:1.7">
        Even if you meet all other requirements, <strong>${binding.label}</strong> is your last hurdle —
        you still need <strong>${binding.remaining.toLocaleString()} more hours</strong> in this category.
        Focus your hour-building here.
      </div>
      ${binding.key === 'crossCountry' && hours.crossCountry === 0 ? `
      <div style="margin-top:10px;font-size:13px;color:var(--gold)">
        ⚠️ Cross-country hours aren't entered yet — update your logbook in Profile → Airline section to get an accurate picture.
      </div>` : ''}
    </div>` : ''}

    <!-- ETE calculator -->
    ${!allMet && hasHours ? `
    <div class="card">
      <h2>📅 Time-to-Minimums Estimate</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 14px">Based on your current hour-building pace. Adjust the monthly rate to match your situation.</p>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px">
        <label class="field-label" style="margin:0;white-space:nowrap">Hours per month:</label>
        <input type="number" id="atp-monthly-rate" value="${hoursPerMonth}" min="1" max="200" step="1"
          onchange="toggleUI('atpMonthlyRate',this.value)"
          style="width:80px;font-size:14px;font-weight:700;text-align:center">
        <div style="font-size:12px;color:var(--dim)">Military active duty: ~15-25/mo · Reserves/Guard: ~5-15/mo · Building toward civilian: ~50-100/mo</div>
      </div>
      ${renderETETable(gaps, hoursPerMonth, pathway.color)}
    </div>` : ''}

    <!-- Standard ATP progress (always show if R-ATP selected) -->
    ${selectedPathway !== 'standard' && hasHours ? `
    <div class="card" style="border-left:4px solid var(--green)">
      <h2>⭐ Standard ATP Progress (1,500 hrs)</h2>
      <p style="font-size:13px;color:var(--muted);margin:-8px 0 14px">R-ATP qualifies you as First Officer. Standard ATP is required to upgrade to Captain. Track both.</p>
      ${(() => {
        const stdGaps    = calculateGaps(hours, ATP_PATHWAYS['standard'].requirements);
        const stdBinding = findBindingConstraint(stdGaps);
        const stdAllMet  = stdGaps.every(g => g.remaining <= 0);
        return `
          ${stdAllMet ? `<div style="color:var(--green);font-weight:700;font-size:14px">✅ Standard ATP minimums also met — you can upgrade to Captain!</div>` : ''}
          <div style="display:flex;flex-direction:column;gap:10px">
            ${stdGaps.map(g => renderProgressBar(g, 'var(--green)', stdBinding?.key === g.key)).join('')}
          </div>`;
      })()}
    </div>` : ''}

    <!-- What R-ATP means -->
    <div class="card" style="background:var(--paper)">
      <h2>🏢 Which Airlines Accept R-ATP?</h2>
      <div style="font-size:13px;color:var(--text);line-height:1.8;margin-bottom:12px">
        All Part 121 U.S. airlines (majors, regionals, and cargo) are authorized to hire R-ATP holders as <strong>First Officers</strong>.
        R-ATP is a restricted certificate — it qualifies you for the right seat, not the left seat.
        To upgrade to Captain, you'll eventually need the full 1,500-hour Standard ATP.
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;font-size:12px">
        ${[
          { carrier:'Major Airlines',   detail:'Delta, United, American, Southwest, Alaska — all accept R-ATP for FO',         ok: true },
          { carrier:'Regional Airlines',detail:'SkyWest, Endeavor, Mesa, PSA, Envoy — primary R-ATP pipeline',                ok: true },
          { carrier:'Cargo (FedEx/UPS)',detail:'Generally require more experience but accept R-ATP; internal minimums often higher', ok: true },
          { carrier:'Captain Upgrade',  detail:'All Part 121 PICs must hold Standard ATP — 1,500 hours required',              ok: false }
        ].map(a => `
          <div style="padding:10px 12px;background:${a.ok?'var(--green-light)':'var(--gold-light)'};border:1px solid ${a.ok?'#c8e6cd':'var(--gold)'};border-radius:2px">
            <div style="font-weight:700;color:${a.ok?'var(--green)':'var(--gold)'};margin-bottom:3px;font-family:'Familjen Grotesk',sans-serif">${a.ok?'✓':'⚠'} ${a.carrier}</div>
            <div style="color:var(--text)">${a.detail}</div>
          </div>`).join('')}
      </div>
      <div style="margin-top:12px;font-size:11px;color:var(--dim)">
        Note: Individual airlines may publish hiring minimums above FAA ATP minimums. Always check the specific carrier's current hiring requirements on their website or ATP.com / Airline Pilot Central.
      </div>
    </div>`;
}

// ── Calculation helpers ────────────────────────────────────────────────

function calculateGaps(hours, requirements) {
  return Object.entries(requirements).map(([key, req]) => {
    const have      = parseFloat(hours[key] || 0);
    const need      = req.hours;
    const remaining = Math.max(0, need - have);
    const pct       = Math.min(100, Math.round((have / need) * 100));
    return { key, label: req.label, tip: req.tip, have, need, remaining, pct };
  });
}

function findBindingConstraint(gaps) {
  const incomplete = gaps.filter(g => g.remaining > 0);
  if (!incomplete.length) return null;
  // The binding constraint is the one that will take the longest to fill
  // Without knowing per-category build rate, use remaining hours as proxy
  return incomplete.reduce((max, g) => g.remaining > max.remaining ? g : max, incomplete[0]);
}

// ── Progress bar renderer ──────────────────────────────────────────────

function renderProgressBar(g, color, isBinding) {
  const done      = g.remaining <= 0;
  const barColor  = done ? 'var(--green)' : isBinding ? 'var(--red)' : color;
  const bgColor   = done ? 'var(--green-light)' : isBinding ? 'var(--red-light)' : 'var(--paper)';
  const border    = done ? '#c8e6cd' : isBinding ? '#fecaca' : 'var(--rule)';

  return `
    <div style="background:${bgColor};border:1px solid ${border};border-radius:2px;padding:12px 14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:4px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-weight:700;font-size:13px;color:var(--text)">${g.label}</span>
          ${isBinding && !done ? `<span style="background:var(--red);color:white;border-radius:2px;padding:1px 6px;font-size:10px;font-weight:700;font-family:'Familjen Grotesk',sans-serif">BINDING</span>` : ''}
          ${done ? `<span style="background:var(--green);color:white;border-radius:2px;padding:1px 6px;font-size:10px;font-weight:700;font-family:'Familjen Grotesk',sans-serif">✓ MET</span>` : ''}
        </div>
        <div style="font-size:12px;color:var(--muted);font-family:'Familjen Grotesk',sans-serif">
          <strong style="color:${done?'var(--green)':'var(--text)'}">${g.have.toLocaleString()}</strong>
          <span style="opacity:0.6"> / ${g.need.toLocaleString()} hrs</span>
          ${!done ? `<span style="color:${isBinding?'var(--red)':'var(--muted)'}"> · ${g.remaining.toLocaleString()} to go</span>` : ''}
        </div>
      </div>
      <div style="height:8px;background:var(--rule);border-radius:4px;overflow:hidden">
        <div style="height:8px;background:${barColor};border-radius:4px;width:${g.pct}%;transition:width 0.4s ease"></div>
      </div>
      <div style="font-size:10px;color:var(--dim);margin-top:4px">${g.tip}</div>
    </div>`;
}

// ── ETE table ─────────────────────────────────────────────────────────

function renderETETable(gaps, monthlyRate, color) {
  const rate = parseFloat(monthlyRate) || 30;
  if (rate <= 0) return '';

  const incomplete = gaps.filter(g => g.remaining > 0);
  if (!incomplete.length) return `<div style="color:var(--green);font-weight:700">All minimums already met!</div>`;

  // The binding constraint drives ETE
  const binding = findBindingConstraint(incomplete);
  const eteMonths = binding ? Math.ceil(binding.remaining / rate) : 0;
  const eteDate   = new Date();
  eteDate.setMonth(eteDate.getMonth() + eteMonths);
  const eteDateStr = eteDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return `
    <div style="background:var(--paper);border:1px solid var(--rule);border-radius:2px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:${color||'var(--accent)'}">
            <th style="padding:8px 12px;color:white;font-family:'Familjen Grotesk',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-align:left">Category</th>
            <th style="padding:8px 12px;color:white;font-family:'Familjen Grotesk',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-align:right">Need</th>
            <th style="padding:8px 12px;color:white;font-family:'Familjen Grotesk',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-align:right">Months</th>
            <th style="padding:8px 12px;color:white;font-family:'Familjen Grotesk',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-align:right">Est. Date</th>
          </tr>
        </thead>
        <tbody>
          ${gaps.map((g, idx) => {
            if (g.remaining <= 0) return `
              <tr style="background:var(--green-light)">
                <td style="padding:8px 12px;color:var(--green);font-weight:600">${g.label}</td>
                <td style="padding:8px 12px;text-align:right;color:var(--green)">✓ Met</td>
                <td style="padding:8px 12px;text-align:right;color:var(--green)">—</td>
                <td style="padding:8px 12px;text-align:right;color:var(--green)">Now</td>
              </tr>`;
            const months = Math.ceil(g.remaining / rate);
            const d      = new Date();
            d.setMonth(d.getMonth() + months);
            const isB    = binding?.key === g.key;
            return `
              <tr style="background:${isB?'var(--red-light)':idx%2===0?'white':'var(--paper)'}">
                <td style="padding:8px 12px;font-weight:${isB?'700':'400'};color:${isB?'var(--red)':'var(--text)'}">
                  ${g.label}${isB?' ← BINDING':''}
                </td>
                <td style="padding:8px 12px;text-align:right;color:var(--muted)">${g.remaining.toLocaleString()} hrs</td>
                <td style="padding:8px 12px;text-align:right;font-weight:${isB?'700':'400'};color:${isB?'var(--red)':'var(--text)'}">${months}</td>
                <td style="padding:8px 12px;text-align:right;font-weight:${isB?'700':'400'};color:${isB?'var(--red)':'var(--text)'}">
                  ${d.toLocaleDateString('en-US',{month:'short',year:'numeric'})}
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:10px;font-size:13px;color:var(--text)">
      At <strong>${rate} hours/month</strong>, your binding constraint (<strong>${binding?.label}</strong>) is met in approximately
      <strong style="color:${color||'var(--accent)'}">${eteMonths} month${eteMonths!==1?'s':''}</strong> — around <strong>${eteDateStr}</strong>.
    </div>
    <div style="font-size:11px;color:var(--dim);margin-top:4px">
      Note: Cross-country and instrument requirements may be met differently than total time — consult your CFII or DPE for your specific situation.
    </div>`;
}
