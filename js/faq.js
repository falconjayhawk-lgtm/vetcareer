// ── FAQ Page ───────────────────────────────────────────────────────────
function renderFAQ() {
  return `
    <h1 style="font-size:24px;font-weight:800;margin:0 0 4px">❓ Help & FAQ</h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">How Tactics 2 Talent works, what it does with your data, and answers to common questions</p>

    <!-- Privacy banner -->
    <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:18px 20px;margin-bottom:24px;display:flex;gap:14px;align-items:flex-start">
      <div style="font-size:28px;flex-shrink:0">🔒</div>
      <div>
        <div style="font-weight:800;color:#15803d;font-size:15px;margin-bottom:4px">Your data stays yours — here's exactly what we collect</div>
        <div style="font-size:13px;color:#166534;line-height:1.6">
          Tactics 2 Talent never stores your uploaded documents. When you upload a DD-214 or performance report, the file is sent to Claude for reading, structured data is extracted, and then the file is discarded. What we save is only the extracted text fields (duty titles, dates, accomplishments) — never the raw document. We do not sell or share your information. See our <a href="legal/privacy.html" target="_blank" style="color:#15803d;font-weight:700">Privacy Policy</a> for full details.
        </div>
      </div>
    </div>

    ${faqSection('🏗️ How the App Works', [
      {
        q: 'What is the recommended order to use Tactics 2 Talent?',
        a: `Start with <strong>Upload Docs</strong> — uploading your DD-214 and performance reports auto-fills most of your profile and experience in seconds. Then review <strong>Profile</strong> and <strong>Experience</strong> to fill any gaps. Once your data is solid, everything else (Resume, LinkedIn, Interview Prep, Job Scout, Salary Intel) draws from that foundation and gets dramatically better results.`
      },
      {
        q: 'How do the features depend on each other?',
        a: `Almost everything flows from your <strong>Profile + Experience</strong> data. Think of it as a pyramid:
        <div style="margin:10px 0 4px;padding:12px 16px;background:#f9fafb;border-radius:8px;font-size:13px;line-height:1.9">
          📋 <strong>Profile & Experience</strong> → the foundation everything reads from<br>
          📄 <strong>Resume Builder</strong> → reads your assignments and awards<br>
          💼 <strong>LinkedIn Generator</strong> → reads your full profile + experience<br>
          🎤 <strong>Interview Prep</strong> → reads a specific job from your tracker<br>
          💰 <strong>Salary Intel</strong> → reads your rank, branch, and target role<br>
          📊 <strong>Gap Analysis</strong> → compares your profile against a target job<br>
          📝 <strong>Reference Letter</strong> → reads your assignments and accomplishments<br>
          🔍 <strong>Job Scout</strong> → uses your target industries and clearance level
        </div>
        The more complete your Profile and Experience, the better every output will be.`
      },
      {
        q: 'What is the Job Tracker and why does it matter?',
        a: `The <strong>Job Tracker</strong> is where you save jobs you're interested in or have applied to. It's not just an organizational tool — it's the input for <strong>Interview Prep</strong> and <strong>Resume Builder (Tailored mode)</strong>. When you ask Claude to prepare you for an interview or tailor your resume, it reads the specific job description from your tracker and customizes the output for that exact role. Without a saved job, you get generic output. With a saved job, you get targeted preparation.`
      },
      {
        q: 'What is Gap Analysis?',
        a: `Gap Analysis compares your military experience against a specific civilian job posting and tells you: what you already have that matches, what's missing, and what skills or certifications would make you more competitive. It's designed to give you an honest picture before you apply, so you can address gaps proactively in your cover letter or prepare for likely interview questions.`
      }
    ])}

    ${faqSection('📤 Document Upload & Privacy', [
      {
        q: 'What happens to my documents when I upload them?',
        a: `Here is the exact sequence:
        <ol style="margin:10px 0 4px;padding-left:20px;font-size:13px;line-height:2">
          <li>Your file is read locally in your browser and converted to a format Claude can read</li>
          <li>The file is sent to Claude (via our secure Cloudflare API proxy) for analysis</li>
          <li>Claude extracts structured data — duty titles, dates, locations, accomplishments, awards</li>
          <li>That structured data is returned and saved to your Tactics 2 Talent profile</li>
          <li>The original file is <strong>never stored</strong> on Tactics 2 Talent's servers</li>
        </ol>
        What we store: the extracted text fields only (e.g., "Program Manager, 2019–2022, Ft. Bragg"). What we never store: your actual DD-214, performance report, or any other uploaded file.`
      },
      {
        q: 'Does Tactics 2 Talent see my Social Security Number or other PII from my DD-214?',
        a: `Claude reads your DD-214 to extract career information — duty title, dates, branch, rank, MOS, characterization of service, and awards. Claude is not instructed to extract or return Social Security Numbers, home addresses, or other personally identifiable information that isn't career-relevant. The extraction prompt specifically requests career fields only. However, because the raw document passes through Claude's API during processing, we recommend redacting your SSN from your DD-214 before uploading as a precaution. On a DD-214, the SSN typically appears in Box 3.`
      },
      {
        q: 'What about my security clearance information?',
        a: `If your DD-214 or performance reports mention clearance level, Claude will extract it and store it in your profile as a text field (e.g., "TS/SCI"). This is used to improve job search relevance in Job Scout and to inform Salary Intelligence. We do not verify clearance claims, and clearance information is never shared with employers or third parties without your direct action (e.g., you choosing to include it in a resume you send somewhere). You can choose to leave the clearance field blank if you prefer.`
      },
      {
        q: 'Can I redact my DD-214 before uploading?',
        a: `Yes, and we recommend it for sensitive fields. The career information Tactics 2 Talent needs from a DD-214 is primarily in blocks 11 (Primary MOS), 12 (Record of Service dates), 13 (Decorations/Awards), 24 (Characterization of Service), and 28 (Narrative Reason for Separation). Blocks 3 (SSN) and 5 (DOB) are not needed and can be redacted with a black marker or PDF editor before uploading.`
      },
      {
        q: 'What is the "paste document text" option?',
        a: `If you don't want to upload a file at all, you can copy and paste the text content of a document directly into the text box. Claude processes the pasted text exactly the same way — the only difference is nothing gets transmitted as a file. This is the most privacy-preserving option if you're concerned about document transmission.`
      }
    ])}

    ${faqSection('🤖 AI Features & Quality', [
      {
        q: 'How does the Resume Builder work?',
        a: `In <strong>Tailored mode</strong>, you select a job from your tracker, and Claude reads your full experience + that job's description and writes a resume specifically targeting that role — matching terminology, emphasizing relevant accomplishments, and translating military experience into language that matches civilian job requirements. In <strong>General mode</strong>, Claude writes a strong all-purpose resume highlighting your most transferable experience. Both modes respect your optional instructions (e.g., "keep it to one page" or "emphasize leadership over technical skills").`
      },
      {
        q: 'Why does the LinkedIn Generator ask about my style?',
        a: `LinkedIn profile tone varies significantly by industry. A defense contractor profile reads differently than a tech company profile. The style selector helps Claude match the voice and terminology appropriate for your target audience. If you're unsure, "Professional & Direct" is a safe default that works across most industries.`
      },
      {
        q: 'What is the daily AI request limit?',
        a: `Tactics 2 Talent limits AI requests to manage costs and ensure fair access. The current limits are <strong>50 standard AI requests per day</strong> (covers Resume, LinkedIn, Interview, Salary, etc.) and <strong>20 Job Scout searches per day</strong>. Limits reset at midnight UTC. If you hit a limit, you'll see a message and can resume the next day. These limits will be adjusted as the platform scales.`
      },
      {
        q: 'How accurate is the AI output? Should I edit it?',
        a: `Always review and edit. AI-generated resumes, LinkedIn content, and interview prep are strong starting points but are not perfect. Claude doesn't know nuances you haven't told it — if an accomplishment is especially important, make sure it's in your Experience data with metrics and context. The more detail you put in, the better the output. Treat every AI output as a first draft that you refine, not a final product.`
      },
      {
        q: 'What is SF-86 Prep and what are its limitations?',
        a: `SF-86 Prep helps you organize the information you'll need for a security clearance background investigation — employment history, foreign contacts, financial history, etc. It is <strong>informational guidance only</strong> and is not legal advice. The actual SF-86 form must be completed accurately and truthfully on NBIS/eQIP. If you have complex background factors (foreign contacts, financial issues, prior investigations), consult with a security clearance attorney before submitting.`
      }
    ])}

    ${faqSection('💳 Account & Billing', [
      {
        q: 'Is Tactics 2 Talent free?',
        a: `Tactics 2 Talent is currently in beta. Beta users get full access to all features during the beta period. Paid tiers will be introduced before public launch — beta users will be notified in advance and may receive preferential pricing. We are committed to keeping Tactics 2 Talent accessible to the veteran community.`
      },
      {
        q: 'How do I delete my account and data?',
        a: `Email <a href="mailto:privacy@afteraction.com" style="color:#2563eb">privacy@afteraction.com</a> with the subject line "Account Deletion Request" and your registered email address. We will delete your account and all associated data within 30 days and send confirmation. Note: AI-generated content you've downloaded (resumes, LinkedIn text, etc.) that is saved on your own device is not affected.`
      },
      {
        q: 'Who built Tactics 2 Talent and why?',
        a: `Tactics 2 Talent was built to address a real gap in job search tools — most applicant tracking systems and job boards penalize veterans for not having civilian keyword matches, even when their experience is directly applicable. Tactics 2 Talent is designed to understand military experience on its own terms and translate it into language civilian employers recognize. The platform is built and operated by Tactics 2 Talent LLC, a veteran-focused company.`
      }
    ])}

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 20px;margin-top:8px;display:flex;gap:14px;align-items:center">
      <div style="font-size:28px">💬</div>
      <div>
        <div style="font-weight:700;color:#1e40af;font-size:14px;margin-bottom:3px">Still have questions or found a bug?</div>
        <div style="font-size:13px;color:#3b82f6">Use the <strong>Feedback</strong> button in the bottom-right corner of the app, or email us at <a href="mailto:support@afteraction.com" style="color:#1d4ed8;font-weight:600">support@afteraction.com</a></div>
      </div>
    </div>
  `;
}

function faqSection(title, items) {
  return `
    <div class="card" style="margin-bottom:16px">
      <h2 style="font-size:15px;font-weight:800;margin:0 0 16px;color:#111827">${title}</h2>
      <div style="display:flex;flex-direction:column;gap:2px">
        ${items.map((item, i) => `
          <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
            <button onclick="faqToggle(this)" style="width:100%;text-align:left;padding:13px 16px;background:none;border:none;cursor:pointer;font-size:14px;font-weight:600;color:#111827;display:flex;justify-content:space-between;align-items:center;gap:12px">
              <span>${item.q}</span>
              <span style="font-size:16px;color:#9ca3af;flex-shrink:0;transition:transform 0.2s" class="faq-arrow">›</span>
            </button>
            <div class="faq-body" style="display:none;padding:0 16px 14px;font-size:13.5px;color:#374151;line-height:1.7;border-top:1px solid #f3f4f6">
              ${item.a}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function faqToggle(btn) {
  const body = btn.nextElementSibling;
  const arrow = btn.querySelector('.faq-arrow');
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
}
