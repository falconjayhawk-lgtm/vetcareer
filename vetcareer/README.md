# VetCareer — Military-to-Civilian Career Transition Platform

A privacy-first, AI-powered career toolkit built for veterans. All data stays in your browser (localStorage) or your own Supabase instance. No backend, no data collection.

## Features

- 📋 Profile & experience builder with AI extraction from DD-214, evaluations, awards
- 💼 Job tracker with status history, activity log, AI job analysis
- 📄 Resume builder — tailored AI resumes + cover letters with Word export
- 💼 LinkedIn profile generator
- 🎤 Interview prep with coached answers
- 💰 Salary intelligence & negotiation coaching
- 📬 Networking email generator
- 📜 Reference letter generator with Word export
- 🔐 SF-86 prep assistant — organizes 10-year lookback data
- 🔍 Job Scout — AI job search advisor
- 📊 Gap analysis — skills coverage vs. target industries

## Deploying to Netlify

### Option A — Drag & Drop (Easiest)
1. Go to [netlify.com](https://netlify.com) and sign up / log in
2. Click **"Add new site" → "Deploy manually"**
3. Drag the entire `vetcareer/` folder onto the upload area
4. Done — Netlify gives you a URL like `https://your-site-name.netlify.app`

### Option B — GitHub (Recommended for updates)
1. Create a GitHub account if you don't have one
2. Create a new repository (e.g. `vetcareer`)
3. Upload all files in this folder to the repo
4. In Netlify: **"Add new site" → "Import from Git"** → connect your GitHub → select the repo
5. Leave all build settings blank, set **Publish directory** to `.`
6. Deploy — future pushes to GitHub automatically redeploy

### Custom Domain (Optional)
In Netlify site settings → **Domain management** → add your domain. Netlify handles SSL automatically.

## File Structure

```
vetcareer/
├── index.html          ← App shell (HTML + CSS, loads all JS)
├── netlify.toml        ← Netlify config
├── README.md
└── js/
    ├── state.js        ← App state, localStorage persistence
    ├── api.js          ← Claude API calls
    ├── helpers.js      ← Utility functions
    ├── render.js       ← Main render engine, routing
    ├── sync.js         ← Supabase sync + settings
    ├── dashboard.js    ← Dashboard view
    ├── profile.js      ← Profile view
    ├── experience.js   ← Experience / assignments view
    ├── documents.js    ← Document upload & AI extraction
    ├── jobs.js         ← Job tracker
    ├── resume.js       ← Resume builder
    ├── export.js       ← Word (.docx) export
    ├── scout.js        ← Job Scout
    ├── linkedin.js     ← LinkedIn generator
    ├── interview.js    ← Interview prep
    ├── salary.js       ← Salary intelligence
    ├── network.js      ← Networking emails
    ├── refletter.js    ← Reference letter generator
    ├── sf86.js         ← SF-86 prep assistant
    └── gap.js          ← Gap analysis
```

## Privacy

- No backend. No accounts on our servers. No analytics.
- All data stored in your browser's localStorage — it never leaves your device unless you configure Supabase sync.
- Claude API calls go directly from your browser to Anthropic's API using your own API key.
- Supabase sync is optional and uses your own Supabase project — you own the database.

## Version History

- **v0.6** — Job activity log, quick status buttons, dashboard checklist expansion, gap analysis sub-role fix
- **v0.5** — LinkedIn generator, interview prep, salary intel, networking emails, Supabase sync fixes
- **v0.4** — SF-86 prep, reference letter generator, Word export, Job Scout
- **v0.3** — Supabase cloud sync, document processing, multi-device support
- **v0.2** — Job tracker with AI analysis, resume builder, gap analysis
- **v0.1** — Profile, experience, dashboard
