# Hacktoberfest Submission Checklist

> A comprehensive pre-flight verification checklist for the *Hacktoberfest Weekend Challenge: Build for a Friend* submission.

---

## 1. Human & Theme Requirements (Build for a Friend)
- [ ] Real friend or loved one identified (name or pseudonym in `docs/submission-inputs.md`)
- [ ] Friend's real open-source background and struggle described accurately
- [ ] Friend tested OpenMate against their target repository
- [ ] Exact feedback quote and constructive reactions documented in `docs/submission-inputs.md`
- [ ] All `[FRIEND INPUT REQUIRED]` placeholders in `docs/dev-submission.md` replaced with authentic human content

---

## 2. Live Application & Codebase
- [x] Live production URL verified ([https://openmate-zq7d.onrender.com](https://openmate-zq7d.onrender.com))
- [x] Production `/api/health` endpoint returns 200 OK with deployed Git revision
- [x] GitHub repository is public ([https://github.com/Ismailco/OpenMate](https://github.com/Ismailco/OpenMate))
- [x] Open-source MIT License present in repository (`LICENSE`) and linked in README
- [x] Production build passes with zero security vulnerabilities (`pnpm audit`)
- [x] Automated test suite passes (255 Vitest tests + 14 Playwright E2E scenarios)
- [x] Remote GitHub Actions CI gates green on `main`

---

## 3. Visual Evidence & Screenshots (No Secrets)
- [ ] Landing page screenshot (`openmate-01-landing.png`) captured and verified
- [ ] Contributor onboarding profile screenshot (`openmate-02-profile.png`) captured
- [ ] Primary recommendation dashboard screenshot (`openmate-03-recommendation.png`) captured
- [ ] Repository architecture & files screenshot (`openmate-04-architecture.png`) captured
- [ ] Ask OpenMate chat screenshot (`openmate-05-chat.png`) captured
- [ ] Sentry full analysis waterfall screenshot (`sentry-01-analysis-waterfall.png`) captured
- [ ] Sentry Gemma inference span detail screenshot (`sentry-02-gemma-span.png`) captured
- [ ] Sentry RAG indexing trace screenshot (`sentry-03-rag-indexing.png`) captured
- [ ] Sentry AI Conversations grouping screenshot (`sentry-04-ai-conversation.png`) captured
- [ ] Render live web service dashboard screenshot (`render-01-live-service.png`) captured
- [ ] Visual privacy check: confirmed NO API keys, secret headers, or raw tokens are visible in any screenshot

---

## 4. DEV Article Requirements & Partner Categories
- [x] Official challenge template headings used without alterations
- [x] Mandatory tags included: `devchallenge`, `weekendchallenge`, `hf26challenge`
- [x] Official prompt declaration link included
- [x] Working live demo link included
- [x] Working GitHub repository link included
- [x] Substantive "Why Does Open Innovation Matter?" section articulated
- [x] Only eligible partner categories claimed:
  - [x] Best Use of Render
  - [x] Best Use of Gemma
  - [x] Best Use of Backboard
  - [x] Best Use of Sentry Agent Tracing
- [x] Zero unearned or unsupported categories claimed (e.g. no Tinker, TabPFN, Mongo, etc.)
- [ ] Optional DevRelay session link or embed added (if preserved)
- [ ] Final proofreading, spelling, and preview check completed on DEV
- [ ] Article published before official deadline: **October 5, 2026, 6:59 AM UTC**
