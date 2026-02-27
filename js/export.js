// ── Export ─────────────────────────────────────────────────────────────
// Downloads resume as RTF — opens natively in Word, Pages, Google Docs.

function exportResumeToWord() {
  const resumeEl = document.getElementById('resume-text-output');
  const resumeText = resumeEl ? (resumeEl.innerText || resumeEl.textContent || '') : '';
  if (resumeText.trim().length < 50) { showToast('Generate a resume first', false); return; }
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
  const BLUE = '\\red30\\green58\\blue138';   // #1E3A8A
  const GRAY = '\\red107\\green114\\blue128'; // #6B7280
  const DARK = '\\red31\\green41\\blue55';    // #1F2937

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
    return s.replace(/^===\s*/,'').replace(/\s*===\s*$/,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/^#+\s*/,'').trim();
  }

  const parts = [];
  parts.push(
    '{\\rtf1\\ansi\\deff0' +
    `{\\fonttbl{\\f0 Calibri;}}` +
    `{\\colortbl;${BLUE};${GRAY};${DARK};}` +
    '\\paperw12240\\paperh15840' +
    '\\margl1080\\margr1080\\margt864\\margb864' +
    '\\f0\\fs20\\cf3'
  );

  let headerDone = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { parts.push('\\par'); continue; }
    const cl = clean(line);
    if (!cl) continue;

    // Section header
    if (line.startsWith('===')) {
      parts.push(
        '\\pard\\sb200\\sa80' +
        '\\brdrb\\brdrs\\brdrw10\\brdrcf1\\brsp20' +
        `\\f0\\fs18\\b\\cf1\\caps ${esc(cl)}` +
        '\\caps0\\b0\\cf3\\par'
      );
    }
    // Name — first line before any section
    else if (!headerDone && !cl.includes('@') && !cl.includes('|') && cl.length > 2 && cl.length < 70) {
      headerDone = true;
      parts.push(
        '\\pard\\qc\\sa60' +
        `\\f0\\fs32\\b\\cf3 ${esc(cl)}` +
        '\\b0\\par'
      );
    }
    // Contact info
    else if (cl.includes('@') || cl.includes('linkedin') || (cl.includes('|') && cl.length < 150)) {
      parts.push(
        '\\pard\\qc\\sa40' +
        `\\f0\\fs18\\cf2 ${esc(cl)}` +
        '\\cf3\\par'
      );
    }
    // Bullet points
    else if (/^[•\-·*]/.test(line)) {
      const bulletText = cl.replace(/^[•\-·*]\s*/, '');
      parts.push(
        '\\pard\\li360\\fi-180\\sa50' +
        `\\f0\\fs20\\cf3 \\bullet  ${esc(bulletText)}` +
        '\\par'
      );
    }
    // Role/title lines with year ranges
    else if (/\d{4}/.test(cl) && /[|–\-—]/.test(cl)) {
      const segs = cl.split(/\s*\|\s*/);
      let out = '\\pard\\sb140\\sa40\\f0\\fs20 ';
      segs.forEach((seg, si) => {
        if (si === 0) out += `\\b\\cf3 ${esc(seg)}\\b0 `;
        else if (/\d{4}/.test(seg) && si === segs.length - 1) out += `\\cf2  |  ${esc(seg)}\\cf3 `;
        else out += `\\cf2  |  \\cf3${esc(seg)} `;
      });
      parts.push(out + '\\par');
    }
    // Normal body text
    else {
      parts.push(`\\pard\\sa50\\f0\\fs20\\cf3 ${esc(cl)}\\par`);
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
