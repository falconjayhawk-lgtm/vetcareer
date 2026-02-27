// ── Export ─────────────────────────────────────────────────────────────
// Generates real .docx files using the docx library (loaded via docx.min.js).

// ── Resume Parser ──────────────────────────────────────────────────────
function parseResumeText(text) {
  const lines = text.split('\n').map(l => l.trim());
  const result = { name: '', contact: [], sections: [] };
  let currentSection = null;
  let headerDone = false;

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('===')) {
      const title = line.replace(/===/g, '').trim();
      currentSection = { title, lines: [] };
      result.sections.push(currentSection);
      headerDone = true;
      continue;
    }
    if (!headerDone) {
      if (!result.name) result.name = line;
      else result.contact.push(line);
      continue;
    }
    if (currentSection) currentSection.lines.push(line);
  }
  return result;
}

// ── Build DOCX ─────────────────────────────────────────────────────────
function buildResumeDocx(parsed) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat, BorderStyle } = docx;
  const BLUE = '1E3A8A', DARK = '1F2937', GRAY = '6B7280';
  const children = [];

  // Name
  if (parsed.name) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: parsed.name, bold: true, size: 36, color: DARK, font: 'Calibri' })]
    }));
  }

  // Contact lines
  parsed.contact.forEach(line => {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: line, size: 18, color: GRAY, font: 'Calibri' })]
    }));
  });

  // Header divider
  children.push(new Paragraph({
    spacing: { before: 80, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE } },
    children: []
  }));

  // Sections
  parsed.sections.forEach(section => {
    children.push(new Paragraph({
      spacing: { before: 200, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE } },
      children: [new TextRun({ text: section.title, bold: true, size: 20, color: BLUE, font: 'Calibri', allCaps: true })]
    }));

    section.lines.forEach(line => {
      if (!line) return;

      // Bullet point
      if (/^[•\-·*]/.test(line)) {
        const text = line.replace(/^[•\-·*]\s*/, '');
        children.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { after: 40 },
          children: [new TextRun({ text, size: 20, color: DARK, font: 'Calibri' })]
        }));
        return;
      }

      // Role/title line with year and separator
      if (/\d{4}/.test(line) && /[|–\-—]/.test(line)) {
        const parts = line.split(/\s*\|\s*/);
        const runs = [];
        parts.forEach((part, idx) => {
          if (idx > 0) runs.push(new TextRun({ text: '  |  ', size: 20, color: GRAY, font: 'Calibri' }));
          const isDate = /\d{4}/.test(part) && idx === parts.length - 1;
          runs.push(new TextRun({ text: part, bold: idx === 0, size: 20, color: isDate ? GRAY : DARK, font: 'Calibri' }));
        });
        children.push(new Paragraph({ spacing: { before: 140, after: 40 }, children: runs }));
        return;
      }

      // Normal paragraph
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: line, size: 20, color: DARK, font: 'Calibri' })]
      }));
    });
  });

  return new Document({
    numbering: {
      config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 180 } }, run: { font: 'Calibri', size: 20 } } }] }]
    },
    styles: { default: { document: { run: { font: 'Calibri', size: 20, color: DARK } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 864, right: 1080, bottom: 864, left: 1080 } } }, children }]
  });
}

// ── Main resume export ─────────────────────────────────────────────────
async function exportResumeToWord() {
  const resumeEl = document.getElementById('resume-text-output');
  const resumeText = resumeEl ? (resumeEl.innerText || resumeEl.textContent || '') : '';

  if (resumeText.trim().length < 50) { showToast('Generate a resume first', false); return; }
  if (typeof docx === 'undefined') { showToast('Export library loading — try again in a moment', false); return; }

  showToast('Building Word document...', true);
  try {
    const parsed = parseResumeText(resumeText);
    const doc = buildResumeDocx(parsed);
    const buffer = await docx.Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const name = ((state.profile && state.profile.fullName) || 'Resume').replace(/\s+/g, '_');
    saveAs(blob, name + '_Resume.docx');
    showToast('✓ Resume downloaded as Word document');
  } catch (err) {
    console.error('DOCX export error:', err);
    showToast('Export failed: ' + err.message, false);
  }
}

// ── Letter export ──────────────────────────────────────────────────────
async function exportLetterToWord(letterText, recipientName) {
  if (!letterText) { showToast('No letter to export', false); return; }
  if (typeof docx === 'undefined') { showToast('Export library loading — try again in a moment', false); return; }

  showToast('Building document...', true);
  try {
    const { Document, Packer, Paragraph, TextRun } = docx;
    const DARK = '1F2937';
    const children = letterText.split('\n').map(line =>
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: line || ' ', size: 22, color: DARK, font: 'Calibri' })] })
    );
    const doc = new Document({
      styles: { default: { document: { run: { font: 'Calibri', size: 22, color: DARK } } } },
      sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }]
    });
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const name = (recipientName || 'Reference_Letter').replace(/\s+/g, '_');
    saveAs(blob, `Reference_Letter_${name}.docx`);
    showToast('✓ Letter downloaded as Word document');
  } catch (err) {
    console.error('Letter export error:', err);
    showToast('Export failed: ' + err.message, false);
  }
}
