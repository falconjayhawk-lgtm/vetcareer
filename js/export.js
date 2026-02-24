// ── Export ────────────────────────────────────────────────────────────
// Exports resume as RTF — opens natively in Word, Pages, and Google Docs.
// No external library needed. Pure JavaScript.

function exportResumeToWord() {
  const resumeEl = document.getElementById('resume-text-output');
  const resumeText = resumeEl ? (resumeEl.innerText || resumeEl.textContent || '') : '';
  if (resumeText.trim().length < 50) {
    showToast('Generate a resume first', false);
    return;
  }

  showToast('Building Word document...', true);

  try {
    const rtf = buildRTF(resumeText);
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const name = ((state.profile && state.profile.fullName) || 'Resume').replace(/\s+/g, '_');
    saveAs(blob, name + '_Resume.rtf');
    showToast('✓ Resume downloaded — open in Word or Google Docs');
  } catch (err) {
    console.error('Export error:', err);
    showToast('Export failed: ' + err.message, false);
  }
}

function buildRTF(text) {
  const lines = text.split('\n');

  // RTF escape: convert special chars
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

  // Strip markdown formatting
  function clean(s) {
    return s
      .replace(/^===\s*/,'').replace(/\s*===\s*$/,'')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^#+\s*/,'')
      .trim();
  }

  const parts = [];
  // RTF header — Letter page, 0.9" margins, Calibri font
  parts.push(
    '{\\rtf1\\ansi\\deff0' +
    '{\\fonttbl{\\f0 Calibri;}{\\f1 Calibri;}}' +
    '{\\colortbl;\\red29\\green99\\blue219;\\red75\\blue99\\green107;\\red80\\green80\\blue80;}' +
    '\\paperw12240\\paperh15840' +
    '\\margl1080\\margr1080\\margt864\\margb864' +
    '\\f0\\fs20'
  );

  let headerDone = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      parts.push('\\par');
      continue;
    }

    const cl = clean(line);
    if (!cl) continue;

    // === SECTION HEADER ===
    if (line.startsWith('===')) {
      parts.push(
        '\\pard\\sb200\\sa80' +
        '\\brdrb\\brdrs\\brdrw10\\brdrcf1\\brsp20' +
        `\\f0\\fs20\\b\\cf1 ${esc(cl.toUpperCase())}` +
        '\\b0\\cf0\\par'
      );
    }
    // Name — first non-contact line
    else if (!headerDone && !cl.includes('@') && !cl.includes('|') && cl.length > 2 && cl.length < 70) {
      headerDone = true;
      parts.push(
        '\\pard\\qc\\sa60' +
        `\\f0\\fs32\\b ${esc(cl)}` +
        '\\b0\\par'
      );
    }
    // Contact info lines
    else if (cl.includes('@') || cl.includes('linkedin.com') || (cl.includes('|') && cl.length < 150)) {
      parts.push(
        '\\pard\\qc\\sa40' +
        `\\f0\\fs18\\cf3 ${esc(cl)}` +
        '\\cf0\\par'
      );
    }
    // Bullet points
    else if (/^[•\-·*]/.test(line)) {
      const bulletText = cl.replace(/^[•\-·*]\s*/, '');
      parts.push(
        '\\pard\\li360\\fi-180\\sa60' +
        `\\f0\\fs20 \\bullet  ${esc(bulletText)}` +
        '\\par'
      );
    }
    // Role/title lines with year ranges
    else if (/\d{4}/.test(cl) && /[|–\-—]/.test(cl)) {
      const segs = cl.split(/\s*\|\s*/);
      let out = '\\pard\\sb120\\sa40\\f0\\fs21 ';
      segs.forEach((seg, si) => {
        if (si === 0) out += `\\b ${esc(seg)}\\b0 `;
        else out += `\\cf3  |  \\cf0${esc(seg)} `;
      });
      parts.push(out + '\\par');
    }
    // Normal body text
    else {
      parts.push(`\\pard\\sa60\\f0\\fs20 ${esc(cl)}\\par`);
    }
  }

  parts.push('}');
  return parts.join('\n');
}

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
        .replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
        .replace(/[^\x00-\x7F]/g, c => `\\'${c.charCodeAt(0).toString(16).padStart(2,'0')}`);
      parts.push(`\\pard\\sa120 ${escaped}\\par`);
    });
    parts.push('}');
    const rtf = parts.join('\n');
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const name = (recipientName || 'Reference_Letter').replace(/\s+/g, '_');
    saveAs(blob, `Reference_Letter_${name}.rtf`);
    showToast('✓ Letter downloaded — open in Word or Google Docs');
  } catch(err) {
    showToast('Export failed: ' + err.message, false);
  }
}
