// ── Export to Word ────────────────────────────────────────────────────
async function exportResumeToWord() {
  const resumeText = document.getElementById('resume-text-output')?.innerText;
  if (!resumeText) { showToast('Generate a resume first', false); return; }
  showToast('Building Word document...', true);
  try {
    const { Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat, BorderStyle } = docx;
    const p = state.profile;
    const lines = resumeText.split('\n');
    const children = [];

    // Parse resume text into structured paragraphs
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) { children.push(new Paragraph({ spacing: { after: 60 } })); continue; }

      // Name line (first non-empty line)
      if (i === 0 || (i < 5 && line === (p.fullName||'').toUpperCase())) {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: line, bold: true, size: 32, font: 'Arial' })]
        }));
      }
      // Contact line (has | separators or @ symbol)
      else if (line.includes('|') || (line.includes('@') && line.length < 120)) {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [new TextRun({ text: line, size: 18, font: 'Arial', color: '444444' })]
        }));
      }
      // Section headers (ALL CAPS short lines)
      else if (line === line.toUpperCase() && line.length < 50 && line.length > 2 && !line.match(/^\d/)) {
        children.push(new Paragraph({
          spacing: { before: 180, after: 60 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1d4ed8', space: 1 } },
          children: [new TextRun({ text: line, bold: true, size: 22, font: 'Arial', color: '1d4ed8' })]
        }));
      }
      // Bullet points
      else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('·')) {
        children.push(new Paragraph({
          numbering: { reference: 'resume-bullets', level: 0 },
          spacing: { after: 40 },
          children: [new TextRun({ text: line.replace(/^[•\-·]\s*/, ''), size: 20, font: 'Arial' })]
        }));
      }
      // Job title lines (bold — contain dates or location indicators)
      else if (line.match(/\d{4}/) || line.match(/Present/) || line.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)) {
        const parts = line.split(/(\s{2,}|\t)/);
        children.push(new Paragraph({
          spacing: { after: 40 },
          children: parts.map((p, pi) => new TextRun({
            text: p,
            bold: pi === 0,
            size: 20,
            font: 'Arial',
            color: pi === 0 ? '111827' : '6b7280'
          }))
        }));
      }
      // Normal text
      else {
        children.push(new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: line, size: 20, font: 'Arial' })]
        }));
      }
    }

    const doc = new Document({
      numbering: {
        config: [{
          reference: 'resume-bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 180 } } } }]
        }]
      },
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
          }
        },
        children
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const name = (p.fullName || 'Resume').replace(/\s+/g, '_');
    saveAs(blob, `${name}_Resume.docx`);
    showToast('✓ Word document downloaded!');
  } catch(err) {
    console.error('Word export error:', err);
    showToast('Export failed: ' + err.message, false);
  }
}

async function exportLetterToWord(letterText, recipientName) {
  if (!letterText) { showToast('Generate a letter first', false); return; }
  showToast('Building Word document...', true);
  try {
    const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;
    const p = state.profile;
    const lines = letterText.split('\n');
    const children = lines.map(line => new Paragraph({
      spacing: { after: line.trim() ? 120 : 60 },
      children: [new TextRun({ text: line, size: 22, font: 'Arial' })]
    }));
    const doc = new Document({
      sections: [{
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children
      }]
    });
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const name = (recipientName || 'Reference_Letter').replace(/\s+/g, '_');
    saveAs(blob, `Reference_Letter_${name}.docx`);
    showToast('✓ Word document downloaded!');
  } catch(err) {
    showToast('Export failed: ' + err.message, false);
  }
}

