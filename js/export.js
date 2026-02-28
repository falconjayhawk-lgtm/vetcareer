// ── Export ─────────────────────────────────────────────────────────────
// Downloads resume as RTF — opens natively in Word, Pages, Google Docs.
// Supports three templates: professional, modern, classic

function exportResumeToWord() {
  const resumeEl = document.getElementById('resume-text-output');
  const resumeText = resumeEl ? (resumeEl.innerText || resumeEl.textContent || '') : '';
  if (resumeText.trim().length < 50) { showToast('Generate a resume first', false); return; }

  const fmt = state.ui.resumeFmt || 'professional';
  showToast('Building Word document...', true);
  try {
    const rtf = buildRTF(resumeText, fmt);
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const name = ((state.profile && state.profile.fullName) || 'Resume').replace(/\s+/g, '_');
    saveAs(blob, name + '_Resume.rtf');
    showToast('✓ Resume downloaded — open in Word or Google Docs');
  } catch (err) {
    console.error('Export error:', err);
    showToast('Export failed: ' + err.message, false);
  }
}

// ── Template definitions ───────────────────────────────────────────────
function getTemplate(fmt) {
  const templates = {
    professional: {
      font: 'Calibri',
      headerSize: 36,       // 18pt name
      bodySize: 20,         // 10pt body
      contactSize: 18,      // 9pt contact
      sectionSize: 18,      // 9pt section headers
      accentColor: { r:30, g:58, b:138 },    // navy #1E3A8A
      textColor:   { r:31, g:41, b:55 },     // dark #1F2937
      grayColor:   { r:107, g:114, b:128 },  // gray #6B7280
      sectionStyle: 'underline',  // blue underline
      nameCenter: true,
    },
    modern: {
      font: 'Calibri',
      headerSize: 38,
      bodySize: 20,
      contactSize: 18,
      sectionSize: 18,
      accentColor: { r:15, g:118, b:110 },   // teal #0F766E
      textColor:   { r:15, g:23, b:42 },     // near-black
      grayColor:   { r:100, g:116, b:139 },  // slate
      sectionStyle: 'bold-color',
      nameCenter: false,
    },
    classic: {
      font: 'Times New Roman',
      headerSize: 36,
      bodySize: 20,
      contactSize: 18,
      sectionSize: 20,
      accentColor: { r:0, g:0, b:0 },        // black
      textColor:   { r:0, g:0, b:0 },
      grayColor:   { r:80, g:80, b:80 },
      sectionStyle: 'underline-black',
      nameCenter: true,
    }
  };
  return templates[fmt] || templates.professional;
}

function buildRTF(text, fmt) {
  const tmpl = getTemplate(fmt);
  const lines = text.split('\n');

  function esc(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/[^\x00-\x7F]/g, c => {
        const code = c.charCodeAt(0);
        return code > 255 ? `\\u${code}?` : `\\'${code.toString(16).padStart(2,'0')}`;
      });
  }

  function clean(s) {
    return s.replace(/^===\s*/,'').replace(/\s*===\s*$/,'')
            .replace(/\*\*([^*]+)\*\*/g,'$1').replace(/^#+\s*/,'').trim();
  }

  const { r:ar, g:ag, b:ab } = tmpl.accentColor;
  const { r:tr, g:tg, b:tb } = tmpl.textColor;
  const { r:gr, g:gg, b:gb } = tmpl.grayColor;

  const parts = [];
  parts.push(
    '{\\rtf1\\ansi\\deff0' +
    `{\\fonttbl{\\f0 ${tmpl.font};}}` +
    `{\\colortbl;\\red${ar}\\green${ag}\\blue${ab};\\red${gr}\\green${gg}\\blue${gb};\\red${tr}\\green${tg}\\blue${tb};}` +
    '\\paperw12240\\paperh15840' +
    '\\margl1080\\margr1080\\margt864\\margb864' +
    `\\f0\\fs${tmpl.bodySize}\\cf3`
  );

  let headerDone = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { parts.push('\\par'); continue; }
    const cl = clean(line);
    if (!cl) continue;

    // Section header
    if (line.startsWith('===')) {
      if (tmpl.sectionStyle === 'underline') {
        parts.push(
          `\\pard\\sb200\\sa80` +
          `\\brdrb\\brdrs\\brdrw8\\brdrcf1\\brsp20` +
          `\\f0\\fs${tmpl.sectionSize}\\b\\cf1\\caps ${esc(cl)}` +
          `\\caps0\\b0\\cf3\\par`
        );
      } else if (tmpl.sectionStyle === 'bold-color') {
        parts.push(
          `\\pard\\sb200\\sa80` +
          `\\f0\\fs${tmpl.sectionSize}\\b\\cf1\\caps ${esc(cl)}` +
          `\\caps0\\b0\\cf3\\par`
        );
      } else { // classic underline-black
        parts.push(
          `\\pard\\sb200\\sa80` +
          `\\brdrb\\brdrs\\brdrw6\\brdrcf3\\brsp20` +
          `\\f0\\fs${tmpl.sectionSize}\\b\\cf3\\caps ${esc(cl)}` +
          `\\caps0\\b0\\par`
        );
      }
    }
    // Name
    else if (!headerDone && !cl.includes('@') && !cl.includes('|') && cl.length > 2 && cl.length < 70) {
      headerDone = true;
      const align = tmpl.nameCenter ? '\\qc' : '\\ql';
      parts.push(
        `\\pard${align}\\sa60` +
        `\\f0\\fs${tmpl.headerSize}\\b\\cf3 ${esc(cl)}` +
        `\\b0\\par`
      );
    }
    // Contact info
    else if (cl.includes('@') || cl.includes('linkedin') || (cl.includes('|') && cl.length < 150)) {
      const align = tmpl.nameCenter ? '\\qc' : '\\ql';
      parts.push(
        `\\pard${align}\\sa40` +
        `\\f0\\fs${tmpl.contactSize}\\cf2 ${esc(cl)}` +
        `\\cf3\\par`
      );
    }
    // Bullet
    else if (/^[•\-·*]/.test(line)) {
      const bulletText = cl.replace(/^[•\-·*]\s*/, '');
      parts.push(
        `\\pard\\li360\\fi-180\\sa50` +
        `\\f0\\fs${tmpl.bodySize}\\cf3 \\bullet  ${esc(bulletText)}` +
        `\\par`
      );
    }
    // Role/title line with year
    else if (/\d{4}/.test(cl) && /[|–\-—]/.test(cl)) {
      const segs = cl.split(/\s*\|\s*/);
      let out = `\\pard\\sb140\\sa40\\f0\\fs${tmpl.bodySize} `;
      segs.forEach((seg, si) => {
        if (si === 0) out += `\\b\\cf3 ${esc(seg)}\\b0 `;
        else if (/\d{4}/.test(seg) && si === segs.length - 1) out += `\\cf2  |  ${esc(seg)}\\cf3 `;
        else out += `\\cf2  |  \\cf3${esc(seg)} `;
      });
      parts.push(out + '\\par');
    }
    // Normal text
    else {
      parts.push(`\\pard\\sa50\\f0\\fs${tmpl.bodySize}\\cf3 ${esc(cl)}\\par`);
    }
  }

  parts.push('}');
  return parts.join('\n');
}

// ── Letter export ──────────────────────────────────────────────────────
async function exportLetterToWord(letterText, recipientName) {
  if (!letterText) { showToast('No letter to export', false); return; }
  showToast('Building document...', true);
  try {
    const lines = letterText.split('\n');
    const parts = [
      '{\\rtf1\\ansi\\deff0' +
      '{\\fonttbl{\\f0 Calibri;}}' +
      '\\paperw12240\\paperh15840\\margl1440\\margr1440\\margt1440\\margb1440' +
      '\\f0\\fs22'
    ];
    lines.forEach(line => {
      const escaped = line
        .replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}')
        .replace(/[^\x00-\x7F]/g, c => `\\'${c.charCodeAt(0).toString(16).padStart(2,'0')}`);
      parts.push(`\\pard\\sa120 ${escaped}\\par`);
    });
    parts.push('}');
    const blob = new Blob([parts.join('\n')], { type: 'application/rtf' });
    const name = (recipientName || 'Reference_Letter').replace(/\s+/g, '_');
    saveAs(blob, `Reference_Letter_${name}.rtf`);
    showToast('✓ Letter downloaded — open in Word or Google Docs');
  } catch(err) {
    showToast('Export failed: ' + err.message, false);
  }
}
