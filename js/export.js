// ── Export ─────────────────────────────────────────────────────────────
// Generates .docx files in the browser using JSZip + hand-crafted OOXML.
// Falls back to RTF if JSZip isn't loaded yet.

// ── Lazy-load JSZip ───────────────────────────────────────────────────
let jsZipLoaded = false;
function loadJSZip() {
  return new Promise((resolve, reject) => {
    if (typeof JSZip !== 'undefined') { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => { jsZipLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Could not load JSZip'));
    document.head.appendChild(script);
  });
}

// ── Resume parser ─────────────────────────────────────────────────────
// Handles both === markers and the AI's natural --- / CAPS HEADER format
function parseResumeText(text) {
  const lines = text.split('\n').map(l => l.trim());
  const result = { name: '', contact: [], sections: [] };
  let current = null, headerDone = false;
  let pendingSection = false; // true when we just saw a --- divider

  // Known section names the AI generates
  const sectionNames = /^(PROFESSIONAL SUMMARY|SUMMARY|CORE COMPETENCIES|COMPETENCIES|SKILLS|PROFESSIONAL EXPERIENCE|EXPERIENCE|WORK EXPERIENCE|EDUCATION|CERTIFICATIONS|CERTIFICATIONS & CLEARANCES|CLEARANCES|AWARDS|VOLUNTEER|PUBLICATIONS|PROJECTS)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) { pendingSection = false; continue; }

    // === style section header
    if (line.startsWith('===')) {
      const title = line.replace(/===/g, '').trim();
      current = { title, lines: [] };
      result.sections.push(current);
      headerDone = true;
      pendingSection = false;
      continue;
    }

    // --- divider: next non-empty line is a section title
    if (/^---+$/.test(line) || /^• --/.test(line)) {
      pendingSection = true;
      continue;
    }

    // Line after --- OR line that looks like a section title
    if (pendingSection || (!headerDone && sectionNames.test(line)) || (headerDone && sectionNames.test(line) && current && current.lines.length === 0)) {
      current = { title: line, lines: [] };
      result.sections.push(current);
      headerDone = true;
      pendingSection = false;
      continue;
    }

    pendingSection = false;

    if (!headerDone) {
      if (!result.name) result.name = line;
      else result.contact.push(line);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return result;
}

// ── Template definitions ──────────────────────────────────────────────
function getTemplate(fmt) {
  const T = {
    professional: { font:'Calibri', accent:'1E3A8A', text:'1F2937', gray:'6B7280', nameSize:36, bodySize:20, contactSize:18, center:true, sectionBorder:true },
    modern:       { font:'Calibri', accent:'0F766E', text:'0F172A', gray:'64748B', nameSize:38, bodySize:20, contactSize:18, center:false, sectionBorder:false },
    classic:      { font:'Times New Roman', accent:'000000', text:'000000', gray:'505050', nameSize:36, bodySize:20, contactSize:18, center:true, sectionBorder:true },
  };
  return T[fmt] || T.professional;
}

// ── OOXML helpers ─────────────────────────────────────────────────────
function xmlEsc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function rpr(opts) {
  // opts: { font, size, bold, color, allCaps }
  let s = '<w:rPr>';
  if (opts.font)    s += `<w:rFonts w:ascii="${opts.font}" w:hAnsi="${opts.font}"/>`;
  if (opts.size)    s += `<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`;
  if (opts.bold)    s += '<w:b/><w:bCs/>';
  if (opts.color)   s += `<w:color w:val="${opts.color}"/>`;
  if (opts.allCaps) s += '<w:caps/>';
  s += '</w:rPr>';
  return s;
}

function run(text, opts) {
  return `<w:r>${rpr(opts)}<w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r>`;
}

function para(runs, pprXml, spacingBefore, spacingAfter) {
  const sp = (spacingBefore||spacingAfter) ? `<w:spacing w:before="${spacingBefore||0}" w:after="${spacingAfter||0}"/>` : '';
  return `<w:p><w:pPr>${pprXml||''}${sp}</w:pPr>${runs}</w:p>`;
}

function buildDocXml(parsed, tmpl) {
  const T = tmpl;
  const center = T.center ? '<w:jc w:val="center"/>' : '';
  const borderBottom = (color) =>
    `<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="${color}"/></w:pBdr>`;

  let body = '';

  // Name
  body += para(
    run(parsed.name, { font:T.font, size:T.nameSize, bold:true, color:T.text }),
    center, 0, 60
  );

  // Contact lines
  for (const line of parsed.contact) {
    body += para(
      run(line, { font:T.font, size:T.contactSize, color:T.gray }),
      center, 0, 30
    );
  }

  // Divider after header
  body += `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="${T.accent}"/></w:pBdr><w:spacing w:before="80" w:after="160"/></w:pPr></w:p>`;

  // Sections
  for (const section of parsed.sections) {
    // Section heading
    const headBorder = T.sectionBorder ? `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="${T.accent}"/></w:pBdr>` : '';
    body += para(
      run(section.title, { font:T.font, size:T.bodySize, bold:true, color:T.accent, allCaps:true }),
      headBorder, 200, 80
    );

    // Pre-process: join lines starting with | to the previous line (e.g. education split across lines)
    const mergedLines = [];
    for (const line of section.lines) {
      if (!line) { mergedLines.push(line); continue; }
      if (line.startsWith('|') && mergedLines.length > 0) {
        const last = mergedLines[mergedLines.length - 1];
        if (last) { mergedLines[mergedLines.length - 1] = last + ' ' + line; continue; }
      }
      mergedLines.push(line);
    }

    for (const line of mergedLines) {
      if (!line) continue;

      // Bullet
      if (/^[•\-·*]/.test(line)) {
        const text = line.replace(/^[•\-·*]\s*/, '');
        body += `<w:p>
          <w:pPr>
            <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
            <w:spacing w:before="0" w:after="40"/>
          </w:pPr>
          ${run(text, { font:T.font, size:T.bodySize, color:T.text })}
        </w:p>`;
        continue;
      }

      // Role/title line with year — handle **bold** markdown in title
      if (/\d{4}/.test(line) && /[|–\-—]/.test(line)) {
        // Strip ** markdown from the whole line first
        const cleanLine = line.replace(/\*+([^*]+)\*+/g, '$1');
        const parts = cleanLine.split(/\s*\|\s*/);
        let runs = '';
        parts.forEach((part, idx) => {
          if (idx === 0) {
            runs += run(part.trim(), { font:T.font, size:T.bodySize, bold:true, color:T.text });
          } else {
            runs += run('  |  ' + part.trim(), { font:T.font, size:T.bodySize, color:T.gray });
          }
        });
        body += para(runs, '', 140, 40);
        continue;
      }

      // Normal text — strip any remaining ** markdown
      const cleanedLine = line.replace(/\*+([^*]+)\*+/g, '$1');
      body += para(
        run(cleanedLine, { font:T.font, size:T.bodySize, color:T.text }),
        '', 0, 40
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
${body}
<w:sectPr>
  <w:pgSz w:w="12240" w:h="15840"/>
  <w:pgMar w:top="864" w:right="1080" w:bottom="864" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
</w:sectPr>
</w:body>
</w:document>`;
}

function buildNumberingXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="&#x2022;"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="360" w:hanging="180"/></w:pPr>
      <w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1">
    <w:abstractNumId w:val="0"/>
  </w:num>
</w:numbering>`;
}

function buildStylesXml(tmpl) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="${tmpl.font}" w:hAnsi="${tmpl.font}"/>
        <w:sz w:val="${tmpl.bodySize}"/>
        <w:szCs w:val="${tmpl.bodySize}"/>
        <w:color w:val="${tmpl.text}"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;
}

// ── Build .docx as ZIP ────────────────────────────────────────────────
async function buildDocx(resumeText, fmt) {
  await loadJSZip();
  const tmpl = getTemplate(fmt);
  const parsed = parseResumeText(resumeText);

  const zip = new JSZip();

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`);

  zip.file('word/document.xml', buildDocXml(parsed, tmpl));
  zip.file('word/styles.xml', buildStylesXml(tmpl));
  zip.file('word/numbering.xml', buildNumberingXml());

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// ── Main resume export ────────────────────────────────────────────────
async function exportResumeToWord() {
  const resumeText = state.ui.resumeResult?.resume || '';
  if (resumeText.trim().length < 50) { showToast('Generate a resume first', false); return; }

  showToast('Building Word document...', true);
  try {
    const fmt = state.ui.resumeFmt || 'professional';
    const blob = await buildDocx(resumeText, fmt);
    const name = ((state.profile && state.profile.fullName) || 'Resume').replace(/\s+/g, '_');
    saveAs(blob, name + '_Resume.docx');
    showToast('✓ Resume downloaded as Word document');
  } catch (err) {
    console.error('DOCX export error:', err);
    showToast('Export failed — try the Print/PDF option instead', false);
  }
}

// ── Letter/Bio docx builder ───────────────────────────────────────────
async function buildLetterDocx(text, docTitle, applicantName) {
  await loadJSZip();
  const lines = text.split('\n');
  const accentColor = '1E3A8A';
  const textColor = '1F2937';
  const grayColor = '6B7280';

  let body = '';

  // Title header
  body += `<w:p>
    <w:pPr><w:spacing w:before="0" w:after="80"/></w:pPr>
    <w:r>
      <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="28"/><w:szCs w:val="28"/><w:b/><w:bCs/><w:color w:val="${accentColor}"/></w:rPr>
      <w:t>${xmlEsc(applicantName || docTitle)}</w:t>
    </w:r>
  </w:p>`;

  // Divider
  body += `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="${accentColor}"/></w:pBdr><w:spacing w:before="0" w:after="160"/></w:pPr></w:p>`;

  // Content lines — detect header block, body paragraphs, signature
  let inSignature = false;
  let inHeader = true; // first non-empty lines are header (date, recipient, re: line)
  let headerLineCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inHeader && headerLineCount > 0) inHeader = false; // blank line ends header block
      body += `<w:p><w:pPr><w:spacing w:before="0" w:after="60"/></w:pPr></w:p>`;
      continue;
    }

    // Strip markdown bold
    const clean = trimmed.replace(/\*+([^*]+)\*+/g, '$1');

    // Detect signature block
    if (/^(Sincerely|Best regards|Respectfully|Warm regards)/i.test(clean)) {
      inSignature = true;
    }

    if (inHeader && headerLineCount < 6) {
      // Header lines — smaller gray text
      const isReLabel = /^Re:/i.test(clean);
      body += `<w:p>
        <w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:sz w:val="${isReLabel ? '22' : '20'}"/><w:szCs w:val="${isReLabel ? '22' : '20'}"/>
            <w:b${isReLabel ? '/' : ' w:val="0"/'}><w:color w:val="${isReLabel ? textColor : grayColor}"/>
          </w:rPr>
          <w:t xml:space="preserve">${xmlEsc(clean)}</w:t>
        </w:r>
      </w:p>`;
      headerLineCount++;
    } else if (inSignature) {
      // Signature block
      body += `<w:p>
        <w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="${textColor}"/></w:rPr>
          <w:t xml:space="preserve">${xmlEsc(clean)}</w:t>
        </w:r>
      </w:p>`;
    } else {
      // Body paragraph
      body += `<w:p>
        <w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="${textColor}"/></w:rPr>
          <w:t xml:space="preserve">${xmlEsc(clean)}</w:t>
        </w:r>
      </w:p>`;
    }
  }

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
${body}
<w:sectPr>
  <w:pgSz w:w="12240" w:h="15840"/>
  <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
</w:sectPr>
</w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  zip.file('word/document.xml', docXml);
  zip.file('word/styles.xml', buildStylesXml({ font: 'Calibri', bodySize: 22, text: textColor }));

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// ── Letter export (legacy RTF - kept for reference letters) ───────────
async function exportLetterToWord(letterText, recipientName) {
  if (!letterText) { showToast('No letter to export', false); return; }
  showToast('Building document...', true);
  try {
    const lines = letterText.split('\n');
    const parts = [
      '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}' +
      '\\paperw12240\\paperh15840\\margl1440\\margr1440\\margt1440\\margb1440\\f0\\fs22'
    ];
    lines.forEach(line => {
      const esc = line.replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}')
        .replace(/[^\x00-\x7F]/g, c => `\\'${c.charCodeAt(0).toString(16).padStart(2,'0')}`);
      parts.push(`\\pard\\sa120 ${esc}\\par`);
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
