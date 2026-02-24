// ── Export to Word ────────────────────────────────────────────────────
// Uses docx.js library loaded from unpkg CDN (window.docx)

async function waitForDocx(maxWaitMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (window.docx && window.docx.Document && window.docx.Packer) return true;
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

async function exportResumeToWord() {
  const resumeEl = document.getElementById('resume-text-output');
  const resumeText = resumeEl ? (resumeEl.innerText || resumeEl.textContent || '') : '';
  if (resumeText.trim().length < 50) { showToast('Generate a resume first', false); return; }

  showToast('Preparing Word export...', true);
  const ready = await waitForDocx();
  if (!ready) {
    showToast('Word library failed to load. Try refreshing the page.', false);
    return;
  }

  try {
    const D = window.docx;
    const p = state.profile;
    const lines = resumeText.split('\n');
    const children = [];

    function stripMd(t) {
      return t
        .replace(/^===\s*/,'').replace(/\s*===\s*$/,'')
        .replace(/\*\*([^*]+)\*\*/g,'$1')
        .replace(/^#+\s*/,'')
        .trim();
    }

    let headerDone = false;

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trim();
      if (!line) { children.push(new D.Paragraph({ spacing: { after: 80 } })); continue; }
      const clean = stripMd(line);
      if (!clean) continue;

      // === SECTION HEADERS ===
      if (line.startsWith('===')) {
        children.push(new D.Paragraph({
          spacing: { before: 240, after: 80 },
          border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: '1d4ed8', space: 2 } },
          children: [new D.TextRun({ text: clean.toUpperCase(), bold: true, size: 22, font: 'Calibri', color: '1d4ed8' })]
        }));
      }
      // Name — first non-empty non-contact line
      else if (!headerDone && !clean.includes('@') && !clean.includes('|') && clean.length > 2 && clean.length < 70) {
        headerDone = true;
        children.push(new D.Paragraph({
          alignment: D.AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new D.TextRun({ text: clean, bold: true, size: 34, font: 'Calibri' })]
        }));
      }
      // Contact lines
      else if (clean.includes('@') || clean.includes('linkedin.com') || (clean.includes('|') && clean.length < 150)) {
        children.push(new D.Paragraph({
          alignment: D.AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new D.TextRun({ text: clean, size: 18, font: 'Calibri', color: '555555' })]
        }));
      }
      // Bullet points
      else if (/^[•\-·*]/.test(line)) {
        children.push(new D.Paragraph({
          spacing: { before: 0, after: 60 },
          indent: { left: 360, hanging: 180 },
          children: [new D.TextRun({ text: '• ' + clean.replace(/^[•\-·*]\s*/,''), size: 20, font: 'Calibri' })]
        }));
      }
      // Role/job title lines (contain year range)
      else if (/\d{4}/.test(clean) && /[|–\-—]/.test(clean)) {
        const parts = clean.split(/\s*\|\s*/);
        const runs = [];
        parts.forEach((part, pi) => {
          if (pi > 0) runs.push(new D.TextRun({ text: '  |  ', size: 19, font: 'Calibri', color: 'aaaaaa' }));
          runs.push(new D.TextRun({ text: part.replace(/\*\*/g,''), bold: pi === 0, size: pi === 0 ? 21 : 19, font: 'Calibri', color: pi === 0 ? '111827' : '4b5563' }));
        });
        children.push(new D.Paragraph({ spacing: { before: 160, after: 40 }, children: runs }));
      }
      // Everything else — body text
      else {
        // Handle inline **bold**
        const segs = clean.split(/(\*\*[^*]+\*\*)/);
        const runs = segs.map(seg =>
          seg.startsWith('**') && seg.endsWith('**')
            ? new D.TextRun({ text: seg.slice(2,-2), bold: true, size: 20, font: 'Calibri' })
            : new D.TextRun({ text: seg, size: 20, font: 'Calibri' })
        );
        children.push(new D.Paragraph({ spacing: { after: 60 }, children: runs }));
      }
    }

    const doc = new D.Document({
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 864, right: 1080, bottom: 864, left: 1080 }
          }
        },
        children
      }]
    });

    const buffer = await D.Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const name = ((state.profile?.fullName) || 'Resume').replace(/\s+/g,'_');
    saveAs(blob, `${name}_Resume.docx`);
    showToast('✓ Word document downloaded!');
  } catch(err) {
    console.error('Word export error:', err);
    showToast('Export failed: ' + err.message, false);
  }
}

async function exportLetterToWord(letterText, recipientName) {
  if (!letterText) { showToast('No letter to export', false); return; }
  showToast('Preparing Word export...', true);
  const ready = await waitForDocx();
  if (!ready) { showToast('Word library failed to load. Try refreshing the page.', false); return; }
  try {
    const D = window.docx;
    const lines = letterText.split('\n');
    const children = lines.map(line => new D.Paragraph({
      spacing: { after: line.trim() ? 120 : 60 },
      children: [new D.TextRun({ text: line, size: 22, font: 'Calibri' })]
    }));
    const doc = new D.Document({
      sections: [{
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children
      }]
    });
    const buffer = await D.Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const name = (recipientName || 'Reference_Letter').replace(/\s+/g,'_');
    saveAs(blob, `Reference_Letter_${name}.docx`);
    showToast('✓ Word document downloaded!');
  } catch(err) {
    showToast('Export failed: ' + err.message, false);
  }
}
