# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 5 — Dashboard
**Last completed:** 17 Analytics Charts — PostHog Data
**Next:** Build plan complete — awaiting developer direction

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [x] 07 AI Profile Extraction from Resume
- [x] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [x] 10 JobsPipe Job Discovery
- [x] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [x] 12 Job Details Page — Full UI
- [x] 13 Company Research Agent (single-run happy-path E2E pending Gemini daily-quota reset — all stages verified individually)

### Phase 5 — Dashboard

- [x] 14 Dashboard Page — Full UI
- [x] 15 Stats Bar — Real Data
- [x] 16 Recent Activity — Real Data
- [x] 17 Analytics Charts — PostHog Data (live data verified against raw event counts)

---

## Decisions Made During Build

### 17 Analytics Charts — PostHog Data (2026-08-23)

- **Transport decision (probed live):** `posthog-node@5.46.1` has NO `.query()` method, and the ingest project token is rejected by the REST Query API with 403. Dashboard analytics therefore go through `POST {NEXT_PUBLIC_POSTHOG_HOST}/api/projects/{POSTHOG_PROJECT_ID}/query/` with a **personal API key** (`Authorization: Bearer …`). Env var is named `POSTHOG_API_KEY` (developer's naming) — it must hold the **`phx_…` personal key**, NOT the `phc_…` project token (developer initially pasted the ingest key; caught by hash-comparing values).
- Created `lib/posthog-query.ts` — three exported getters (`getJobsFoundByDay`, `getCompanyResearchByDay`, `getMatchScoreRanges`) sharing one private `runHogQL` transport: 10s `AbortSignal.timeout`, zod-validated `{ status, results }` envelope, cells coerced via `toCount`. Every getter catches its own errors → `console.warn` + zero-filled series so charts can never break the dashboard render.
- **Injection safety:** user ids are validated against a UUID regex BEFORE string interpolation into HogQL; non-UUID ids short-circuit to zeros without any network call.
- Query shapes: jobs/research = `formatDateTime(toStartOfDay(timestamp), '%Y-%m-%d')` grouped counts over trailing 30/7 UTC days, zero-filled in JS against the key list (UTC labels via `toLocaleDateString(..., { timeZone: 'UTC' })` — module-scope helpers keep the react-hooks purity lint happy). Match scores = one aggregate row of five `countIf(toFloatOrNull(properties.matchScore) >= lo AND < hi)` buckets; scores <50 fall in no bucket by design; ≥90 counts in 90-100.
- `app/dashboard/page.tsx`: three getters join the existing DB queries inside the same `Promise.all`; `WEEK_DAYS`/`SCORE_RANGES` constants moved out of the page into the query module. Page stays a server component passing plain arrays.
- Rebuilt all three chart components as `'use client'` on recharts 3.10.1 (`AreaChart` monotone + accent gradient / two `BarChart`s), preserving card chrome, `h-[340px]` plot frame, `role="img"` aria-labels, muted-text empty overlays (`total === 0` still works because getters return zeros), fixed Y ticks (0–100) for jobs/scores, dynamic `yMax` for research. Colors ONLY via inline `style={{ stroke|fill: 'var(--color-…)' }}` + gradient stops — CSS variables don't resolve in SVG presentation attributes (feature 14 lesson); Tailwind classes used only where they cascade normally (`stroke-border` gridlines, `fill-text-muted` ticks).
- recharts v3 API notes: `Cell` is deprecated (removed in 4.0) — bar styling goes on `<Bar>` directly (props spread to rendered rects via `svgPropertiesNoEvents`); custom axis ticks are typed components matching `XAxisTickContentProps`/`YAxisTickContentProps` shape (`{ x, y, payload.value }`); sparse x-labels via `interval={4}` on the 30-day axis.
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` clean; unauthenticated `/dashboard` → 307 `/login`; degradation path unit-exercised via tsx (30-point series, 5 ordered buckets, 7 weekday labels, non-UUID id returns zeros, warnings logged). **Live data verified** after the developer added the personal key: jobs chart total 36 = raw `job_found` count, score buckets match (only 2 events ≥50 — test data scores mostly 5–45, which fall in no bucket by design), research chart correctly excludes another user's event via `distinct_id` scoping. The zero-fill policy caught one real bug during live verification: this PostHog deployment omits `status` from query responses — schema relaxed to optional.

### 16 Recent Activity — Real Data (2026-08-23)

- Merged feed built in `app/dashboard/page.tsx` from TWO capped queries run in `Promise.all`: `agent_runs` (`id, job_title_searched, jobs_found, started_at`, `.eq('status','completed')`, ordered `started_at desc`, limit 8) + the EXISTING jobs query extended with `id, company` (no second jobs round-trip). Both sides pre-sorted + capped at 8, so merge → sort by raw timestamp desc → slice(0,8) is globally correct.
- Formats per spec: completed run → "Found {jobs_found} jobs for {job_title_searched}"; researched job (`company_research IS NOT NULL`) → "Researched {company}". Time-ago reuses `formatFoundAt` from lib/utils. Dot colors already type-mapped in RecentActivity (`job_found`→success green, `company_researched`→info blue) — matches spec's color coding.
- **agent_runs has NO created_at** — spec's "sort by created_at" maps to `started_at` (always present via default now()). Runs with null title/timestamp are skipped via flatMap guards (also satisfies SDK's nullable-typed columns without assertions). `jobs_found ?? 0` — a completed search with 0 hits renders "Found 0 jobs for X" honestly per spec.
- `MAX_ACTIVITY_ITEMS = 8` (spec range 5–10; design card shows ~4–6 entries). **Revised to 5 same day (developer report via /review):** with 8 items the RecentActivity card towered over the FIXED-height chart beside it (`h-[340px]` plot in CompanyResearchActivity) — grid stretch made the right side look broken. 5 matches the design's exact entry count and balances row heights.
- `resume_tailored` stays in the DashboardActivityType union but has no producer yet — no resume-tailoring feature exists; nothing emits it.
- Verified: tsc/lint/build clean; unauthenticated `/dashboard` → 307 `/login`; live SQL preview confirms expected feed (7 completed runs incl. two "Found 10 jobs" Java searches + 2 researched companies merged by recency). In-browser render check pending login credentials.

### 15 Stats Bar — Real Data (2026-08-23)

- All four stats computed in `app/dashboard/page.tsx` from ONE query — `jobs` select of only `match_score, company_research, found_at` scoped `.eq('user_id')`, then JS aggregation (find-jobs page idiom). No PostgREST aggregate/count round-trips; per-user job volume makes this trivially cheap.
- Semantics per spec: Total = row count; Avg. Match Rate = mean of non-null `match_score` rounded to int, `'—'` when no scored jobs (mirrors SQL AVG null exclusion); Companies Researched = count where `company_research IS NOT NULL`; Jobs This Week = `found_at >= now() - 7d`. DB error → `?? []` renders zeros gracefully.
- **Trend badges still not rendered** (revisited per feature-14 note): the four metrics are cumulative or period counts with no clean week-over-week baseline defined in the spec, so `sub` labels stay as design copy ("vs last week" etc.) and the optional `trend` prop stays unused. Revisit only if a developer asks for WoW deltas.
- **Trend badges now REAL (developer follow-up same day):** "hide the vs last week if there is no data, add data if there is data to compare" — supersedes the "never rendered" note above. `DashboardStat.sub` is now optional and the whole footer row hides when neither trend nor sub exists. Page computes WoW deltas: Total Jobs Found = new-this-week ÷ prior total (hidden when prior total is 0); Avg. Match Rate = avg score of this week's jobs vs pre-existing jobs, relative % (hidden when either side is empty or baseline is 0). Positive → success badge (`+N%`), negative → error badge via `bg-error/10 text-error` (no error-lightest token; login-banner pattern). "Companies Researched"/"Jobs This Week" subs are not comparisons — unchanged. With the current seeded data (all 37 jobs <7 days old) BOTH comparisons correctly render hidden.
- react-hooks/purity lint blocks `Date.now()` lexically inside component bodies even in server components — moved into module-scope helper `weekAgoFrom()` (same pattern as `formatFoundAt`). Note for future date math in RSC pages.
- Verified: expected live values via SQL (37 total / 30% avg / 2 researched / 37 this week on seeded data); unauthenticated `/dashboard` → 307 `/login`; tsc/lint/build clean. In-browser check of real values pending login credentials (carried over).

### Navbar rework — design layout + mobile hamburger (2026-08-23)

- **Developer-reported issues via /review:** (1) nav links vanish on mobile (`hidden md:flex` with no hamburger) — navigation was unreachable below `md`; (2) navbar should copy the layout of `context/designs/dashboard.html`.
- **Brand block rebuilt to the design:** purple gradient tile (`h-10 w-10 rounded-[10px] bg-gradient-to-br from-accent to-accent-dark`, login-page logo precedent) with the design's white 4-square SVG + "JobPilot" wordmark (`text-xl font-bold`). The old `next/image /logo.png` is gone from the Navbar.
- **Nav links match the design:** each link now has a 16px inline-SVG icon (`stroke="currentColor" strokeWidth={2}` — grid / magnifier / person, copied from dashboard.html) and sits right-aligned in a cluster next to the auth control (design's two-child space-between layout), instead of floating centered.
- **Active state stays color-only** (`text-accent` via `usePathname()`, exact-or-trailing-slash match). The design's 2px underline remains rejected per feature-05/ui-rules lock — "copy the layout" was scoped to structure/icons, and the underline contradicts ui-rules' explicit no-underline rule.
- **Mobile hamburger added:** `md:hidden` button (lines/X toggle, `aria-expanded`/`aria-label`) opening an absolute dropdown panel under the header (`top-full inset-x-0 md:hidden`, NOT position:fixed) with stacked nav links + auth action; links close the panel on click. Header gained `relative z-50` so the panel overlays page content.
- Verified in-browser via agent-browser on public `/login`: 390px → hamburger present, desktop links hidden, panel opens/closes with correct ARIA state; 1440px → iconed nav + CTA, hamburger hidden. `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean. ui-registry Navbar entry rewritten.

### 14 Dashboard Page — Full UI (2026-08-23)

- **Built empty-state only, per explicit developer instruction** ("remove the preloaded data just build the ui") — supersedes build-plan's "with mock data" wording. No MOCK arrays exist: stats render `0` / `—`, activity renders the empty state, all three charts receive zero-count points and show their muted overlay messages. Features 15–17 pass real data through the same prop contracts.
- Components in `components/dashboard/`: `StatsBar`, `RecentActivity`, `CompanyResearchActivity` (bar), `JobsFoundOverTime` (area line), `MatchScoreDistribution` (bar) + `DashboardVisitTracker`. Architecture.md's single `AnalyticsCharts.tsx` sketch was split — code-standards' one-component-per-file rule wins; charts live on different grid rows so a fragment component couldn't compose them anyway.
- **Charts are hand-rolled server-side SVG**, exact design geometry preserved (viewBoxes 560/760/500×300, `preserveAspectRatio="none"`, dashed gridlines, rx=6 bars). Deliberately NOT recharts: it is not installed and not on code-standards' approved-dependency list — feature 17 must either keep these components (recommended: they're already prop-driven and token-colored) or add recharts to the approved list first.
- Design fidelity mapping (design → tokens): purple #6c5ce7→accent, blue #5b9bf5→info, green #22c58a→success, borders→border, muted text→text-muted/text-secondary. Stat value 34px/700 in design → 30px/600 per ui-tokens Typography lock; card h3 18px/700 → text-base font-semibold per Section heading lock (same normalization as features 05/09). Trend badges (+12%/+3%) are supported via optional `trend` prop but never rendered yet — no week-over-week trend source exists in features 15–17's specs; revisit when wiring.
- Activity dot colors normalized to type semantics (`job_found`→success-alt, `company_researched`→info, `resume_tailored`→accent) — the design itself was inconsistent (purple AND green for "Found N jobs").
- Page converted from client-only placeholder to dynamic server component with auth redirect (find-jobs pattern); old "Dashboard / Welcome to JobPilot…" heading removed — the design has no page title, content starts at the stat row. `dashboard_visited` event preserved via `DashboardVisitTracker` ('use client', capture on mount).
- Line chart smoothing: Catmull-Rom→cubic-bézier helper inside JobsFoundOverTime (design shows smooth curves); area closes to baseline y=268; gradient stops use inline `style={{ stopColor: 'var(--color-accent)' }}` because CSS vars don't resolve in SVG presentation attributes.
- Incomplete-profile banner (listed in feature 14's build-plan spec but ABSENT from dashboard.html): intentionally not built pending developer decision — conflicts with "exactly as shown".
- Verified: `npx tsc --noEmit`, `npm run lint`, `npm run build` clean; `/dashboard` registered dynamic; unauthenticated GET → 307 `/login`. Visual check pending login credentials (carried over from last session).

### AI Provider Migration — Gemini → OpenCode Zen (2026-08-23)

- **All app AI now runs through OpenCode Zen** (`https://opencode.ai/zen/v1`, OpenAI-compatible Chat Completions) with ONE free-tier model everywhere: `nemotron-3-ultra-free` (`APP_MODEL` in `lib/ai.ts`). Chosen by live probe of all 8 free models — the only one honoring both `response_format: json_object` AND strict `json_schema` with clean output (laguna/x-preview ignore json_schema, hy3 sloppy, mimo hard-429s, nemotron-lightning leaks reasoning prose, deepseek-free upstream-down that day).
- **New shared module `lib/ai.ts`** — `getZenClient()` + `generateJson({ label, systemPrompt, userPrompt, temperature, maxTokens }) → { content, truncated }`. Owns the 503/429 retry loop (3 attempts, linear backoff) previously duplicated in all four agent files. `truncated: true` ⇔ `finish_reason === "length"`.
- **Agent files migrated:** matcher / extractor / resume-generator / research now import from `lib/ai.ts`; their parse-salvage + repair-retry + zod layers unchanged. Per-task params preserved exactly (0.3 scoring/extraction, 0.4 synthesis, 0.7 resume; 4096/4096/1000/800→1600 caps).
- **Stagehand model config** (`lib/stagehand.ts`): `modelName: "openai/nemotron-3-ultra-free"` + top-level `apiKey`, `baseURL`, and `openaiEndpointFormat: "chat"` (REQUIRED — Zen serves only Chat Completions; Stagehand otherwise defaults to the Responses API). Verified against Stagehand 3.7.2 dist types: custom baseURL routing exists in v3; the version pin + `disableAPI: true` decision is untouched.
- **Env:** `OPENCODE_API_KEY` replaces `GEMINI_API_KEY` (renamed in `.env.local`; old key commented out there). `.env.example` updated. `openai@7.5.0` added as explicit dependency (Stagehand keeps its own nested v4).
- **Free-tier caveats documented in library-docs.md:** expect occasional 429s (generateJson retries), models appear/disappear without notice — re-probe `/v1/models` + candidate matrix before swapping APP_MODEL.
- Verified: `npx tsc --noEmit` clean after every file; live smoke test through the real openai SDK path returned valid JSON (`json_object`, finish stop); full lint/build check below.

### Research synthesis truncation fix (2026-08-23)

- **Live failure after the Zen migration:** every Research Company run died with "Could not interpret the research result" (~104 s of doomed calls). Log cascade: truncated at cap → salvage found no JSON object → repair truncated too. **Root cause proven by live probe:** a full dossier costs ~1315 completion tokens on nemotron-3-ultra-free; the inherited Gemini-era caps (800 → 1600) truncate EVERY attempt, and the flat 9-field schema has exactly ONE `}` (the final brace) — so any truncation leaves nothing for the `{…}` salvage slice to find ("No JSON object found"). Probe: at 800 tokens `finish_reason=length` mid-object; at 4096 `finish_reason=stop`, all 9 keys parse clean.
- **Fix in `agent/research.ts` (`synthesizeDossier`):** base cap 800 → **4096** (proven matcher/resume budget), escalation + repair retries doubled to **8192**; the escalation retry now checks `.truncated` on its OWN result (previously ignored) and, when still truncated, skips parsing entirely and goes straight to the repair call instead of feeding known-garbage to the salvage path.
- Docs synced: library-docs.md synthesis row (800→1600 ⇒ 4096→8192) + wire-call example updated with the live-proof note.
- Verified: `npx tsc --noEmit`, `npm run lint`, `npm run build` clean; live two-cap probe confirms old cap truncates / new cap completes. Full browser-to-dossier E2E re-run still pending (carried over).

### Recent Activity rework (2026-08-23, developer requests)

- **"Not updating" root cause:** the feed keyed research entries off `found_at` (discovery time), so a company researched TODAY surfaced at its discovery-time position (or got cut by the 5-item cap) — fresh research never looked recent. Fix: new nullable `jobs.researched_at timestamptz` column, set in the same UPDATE as the dossier (`agent/research.ts`); legacy rows backfilled to `found_at`; feed now sorts/filters research entries on it.
- **24-hour window:** feed carries only items from the last 24 h (`dayAgoFrom()` module-scope helper per the lint-purity pattern; both sources filtered before merge/sort). Older entries drop out naturally; empty state shows when nothing happened today.
- **Scrollbar:** list is now a fixed-height scroll area (`h-[340px] overflow-y-auto pr-1`, matching the neighboring chart plot) and `MAX_ACTIVITY_ITEMS` raised 5 → 20 — replaces the hard cap that existed only to protect grid-row heights.
- Docs synced: architecture.md jobs schema (+researched_at), ui-registry RecentActivity entry.
- Verified: tsc / lint / build clean; SQL confirms 4/4 researched rows stamped; feed semantics verified against live timestamps (newest items ~3h old, inside window).
- **Follow-up same day (developer request):** activity window widened 24 h → **3 days** (`ACTIVITY_WINDOW_MS`); `MAX_ACTIVITY_ITEMS` 20 → 30. Non-flex guarantee verified in markup: the list (`h-[340px] overflow-y-auto`) and the CompanyResearchActivity SVG wrapper (`relative h-[340px]`) both pin content height, so grid stretch adds only whitespace — with `preserveAspectRatio="none"` the chart physically cannot deform, and long lists scroll instead of growing the card.

### Dossier sections carded (2026-08-23)

- **Developer request:** each part of the company research dossier gets its own card-like enclosure. `CompanyResearch.tsx`: every dossier field now renders inside a sub-card (`rounded-xl border border-border bg-surface p-5`, shared `DOSSIER_CARD` const) — white surface, no nested shadow (parent card keeps the shadow), following the profile role sub-card precedent. Layout: two full-width paragraph cards (`About {company}`, `Why this role`) above a `grid grid-cols-1 gap-4 md:grid-cols-2` of list cards; stack tightened `gap-5` → `gap-4`. Sources row unchanged as the card footer.
- Verified: `npx tsc --noEmit`, `npm run lint`, `npm run build` clean. ui-registry CompanyResearch entry updated.

### 13 Company Research Agent (2026-08-22)

- **Flow:** "Research Company" button on the details page → `POST /api/agent/research` → Browserbase session + Stagehand browse (homepage extract → up to 3 sub-pages) → Gemini synthesis into a 9-field dossier (`companyDossierSchema` in types/index.ts) → persisted to `jobs.company_research`, rendered by `CompanyResearch.tsx` (client component, idle/loading/error/dossier states, `router.refresh()` on success).
- **Stagehand pinned to 3.7.2 with `disableAPI: true`** — two verified external blockers documented in library-docs.md: v4 stalls 60s waiting for a runtime handshake Browserbase's preloaded extension doesn't serve yet; v3's hosted Stagehand API rejects this project with HTTP 400, so `disableAPI: true` drives CDP directly and calls Gemini from the client. Do not bump versions until both are fixed upstream AND re-proven.
- **Homepage derivation chain** (`lib/company-url.ts`): stored `company_domain` → posting-URL hostname when not a board host (`KNOWN_BOARD_HOSTS` exported from lib/posting-source.ts) → redirect-follow fetch (5s timeout) → slugified name guess. Live-verified: linkedin posting URL correctly rejected → `https://www.iqvia.com` via name-guess.
- **Graceful degradation:** browsing failures (init/extract) never fail the request — synthesis runs on job description alone; empty homepage fields = wrong site detected, skip sub-page stage. Sub-page picks prefer about/engineering/blog/product over careers, max 3, same-host only.
- **DB:** `jobs.company_domain text` added (persisted by jobspipe for future runs); research logs use `agent_logs` with nullable `run_id` + `job_id`.
- **E2E status (staged verification):** connect/browse/homepage-extract proven live; synthesis+dossier render proven in an earlier run (~40s, persisted, sources rendered); error path ("Company research failed." + Retry banner) proven live; session cleanup proven (0 orphaned sessions — `api_timeout: 120` + REQUEST_RELEASE + `stagehand.close()`). **Single-run happy path re-pending after the Zen migration (2026-08-23):** synthesis now runs on nemotron-3-ultra-free via lib/ai.ts — needs one live browser-to-dossier run to re-prove the full chain on the new model.
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` clean after the v3 downgrade.

### 12c View Job Post always rendered (2026-08-22)

- **Developer request:** a button in the details header to open the main job posting. The control already existed but was hidden entirely when no URL was stored — and all pre-fix rows have null URLs, so it never appeared on legacy data. Developer chose: **always render, disabled when no URL** (same treatment as Apply Now). `JobInfo.tsx`: enabled `<a target="_blank">` when `applyUrl` exists; otherwise `<button type="button" disabled>` with `cursor-not-allowed opacity-50` and no hover. Placement unchanged (top-right of header card).
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` clean. ui-registry JobInfo entry updated.

### 12b Job Description preview + review findings (2026-08-22)

- **Developer request:** Job Description no longer renders full text unconditionally. `JobDescription.tsx` is now `'use client'` — collapsed 4-line `line-clamp` preview by default, "Show more"/"Show less" toggle (accent text button + rotating chevron, `aria-expanded`). Toggle only renders when the content would actually clamp: length > 280 chars OR > 4 newline lines (`PREVIEW_CHAR_LIMIT` / `PREVIEW_LINE_LIMIT`). Short descriptions show in full with no control.
- **/review run on feature 12 (same day):** Layers 1–2 PASS. Open findings reported, not yet fixed — awaiting developer decision: (1) **Important** JobsTable row-click is mouse-only (`<tr onClick>`, no tabIndex/Enter/link semantics) — keyboard users cannot open job details; (2) minor: details page ignores DB `error` → transient failure renders generic 404 (same as list page pattern); (3) minor: relative "Date Found" frozen at render.
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` clean.

### 12 Job Details Page — Full UI (2026-08-22)

- Built per architecture.md's component plan: `JobInfo`, `MatchScore`, `JobDescription`, `CompanyResearch`, `JobActions` in `components/job-details/` (all server components — no state in this feature) + `app/find-jobs/[id]/page.tsx` dynamic server page. Design source: `context/designs/job-details.html`; its sample content (Insight Global etc.) treated as placeholder data only.
- Page: awaits `params` (`Promise<{ id: string }>` — verified against node_modules Next 16 docs), auth redirect, job fetch scoped `.eq('id', id).eq('user_id', user.id)` + `.maybeSingle()` → `notFound()` when missing/not owned. Maps row to new camelCase `JobDetail` type in types/index.ts; `applyUrl = external_apply_url ?? source_url`.
- **Design fidelity decisions:** container keeps the design's narrow width `max-w-[1060px]` (same precedent as profile keeping 1200px); match pill/stat icons/skills pills follow the design's color roles mapped onto project tokens. Match pill uses `MATCH_HIGH`/`MATCH_LOW` bands (green/red/orange) so header pill always agrees with table bars. **Missing-skill pills are accent purple** (ui-tokens Skills Badges table + delivered design) — build-plan's "red/orange badges" wording is superseded.
- **No-URL handling (legacy rows have null URLs):** View Job Post hidden when no applyUrl; Apply Now renders disabled rather than disappearing. Null salary/location/type → '—'; null reason/description → muted empty-state lines per ui-rules.
- `formatFoundAt` moved from find-jobs/page.tsx into `lib/utils.ts` (shared by list + details). JobsTable converted to `'use client'` with row-click `router.push(/find-jobs/${id})` — the navigation deferred from feature 11. CompanyResearch button intentionally inert until feature 13.
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` all clean; `/find-jobs/[id]` registered dynamic; unauthenticated `/find-jobs/abc123` → 307 `/login`. **Manual browser E2E pending** — needs logged-in user with saved jobs.

### Posting source captured (2026-08-22)

- **Why:** JobsPipe already returns `source` (board slug, e.g. `greenhouse`/`linkedin`), `url`, and `source_url` — our zod schema was silently stripping them. DB `jobs.source` means discovery channel ('search'|'url') and must NOT be overloaded (architecture.md), so a new nullable `posting_source text` column was added via `ALTER TABLE`.
- **`lib/posting-source.ts`:** `resolvePostingSource(job)` — API `source` slug first; else hostname of `final_url`/`url`/`source_url` matched against ~20 known board hosts (linkedin/greenhouse/lever/workday/ashby/indeed/…); else bare hostname (www stripped); else null. `formatPostingSource()` renders the UI label ('greenhouse' → 'Greenhouse', null → '—'). Verified with 10-case tsx script.
- **Save path:** `toJobRecord` stores `posting_source`; `source_url`/`external_apply_url` now fall back through final_url → url → source_url. `DiscoverJobsResult.savedMatchScores: number[]` replaced by `savedJobs: Array<{ score, postingSource }>` (route.ts only consumer) so the PostHog `job_found` event reports real `postingSource` instead of hardcoded 'search' for the source property (event keeps `source: 'search'` = discovery channel).
- **UI:** JobsTable gained a Source column (Salary Est. ↔ Date Found), label or '—'; empty-state colSpan 5→6. Page selects `posting_source`.
- **Backfill impossible:** all pre-existing rows have null URLs (live API omitted them) — they show '—' until re-searched. Sandbox API returns null sources too; live data populates them. Verified tsc/lint/build clean.

### Match score thresholds re-tuned (2026-08-22, user request)

- New display/filter bands: ≥60% high match (green `bg-success`), ≤20% low match (red `bg-error`), 21–59% stays orange (`bg-warning`). Replaces the old mockup ranges (≥90 green / 80–89 blue / <80 orange) in `JobsTable.scoreBarColor()`.
- Constants `MATCH_HIGH = 60` / `MATCH_LOW = 20` added to `lib/utils.ts` alongside (untouched) `MATCH_THRESHOLD = 70` — bar color and High/Low filter category always agree since both read these. Note: `MATCH_THRESHOLD` still governs agent-side save behavior (`agent/jobspipe.ts`), deliberately unchanged.
- ui-rules.md Match Score Bar section updated to the new ranges. Verified tsc + lint clean.

### 11 Filter + Sort + Pagination wired (2026-08-22)

- **Bug:** JobFilters search input and both dropdowns were inert — server-rendered with no state/handlers; pagination hardcoded to `pages={[1]}`.
- **Architecture:** page stays a Server Component (fetches all user jobs once, maps to `JobListRow` now including raw ISO `foundAtRaw` for real date sorting — the displayed relative string can't be sorted). New client component `JobsBrowser` owns `query/match/sort/page` state and renders JobFilters (now fully controlled) + JobsTable + JobsPagination.
- **Filter semantics per build-plan feature 11:** text search matches company OR title case-insensitively; High Match = `matchScore >= MATCH_THRESHOLD` from `lib/utils.ts` (never hardcode 70); Low = below. Sort: score desc / newest `foundAtRaw` desc / oldest asc. Pagination: 20/page (`PAGE_SIZE` in JobsBrowser), summary recomputed over filtered set, any filter change resets to page 1.
- JobsPagination gained optional `onPageChange` (disabled Previous on first page / Next on last); JobsTable gained optional `emptyMessage` so "no filters match" is distinct from the no-jobs-yet empty state.
- Verified: `tsc --noEmit` + `npm run lint` clean. **Manual browser test pending** — needs a logged-in user with saved jobs.

### 10 Matcher truncation bugfix (2026-08-21, live E2E)

- **Bug:** first live search — every job silently skipped, banner said "Found 10 jobs and saved 0 strong matches" over an empty table. Logs: `response truncated at max output tokens` → `No JSON object found in model output` on every job (plus transient Gemini 429s that the retry loop absorbed correctly).
- **Root cause:** `maxOutputTokens: 300` in the matcher. gemini-2.5-flash is a thinking model — thinking tokens count against maxOutputTokens, so the JSON died mid-object before emission. Same failure mode the extractor hit at 800 (bumped to 4096 on 2026-08-06); library-docs' "scoring: 300" guidance predated that lesson.
- **Fix in `agent/matcher.ts`:** `maxOutputTokens: 4096` + `thinkingConfig: { thinkingBudget: 0 }` (SDK v2.15 supports it; scoring is constrained classification — no reasoning needed). Kills truncation AND cuts per-job latency from ~8s to ~1s.
- **UX guard for the all-skipped case:** route response now includes `savedCount`; SearchControls shows a distinct error-styled banner ("Found N jobs but none could be scored right now. Please try again shortly.") when totalFound > 0 but savedCount === 0 — no more silent empty table behind a green-ish success message.
- library-docs.md max-output-tokens table corrected + thinkingBudget rule added. Verified tsc/lint/build clean.

### 10 JobsPipe Job Discovery (2026-08-21)

- **Provider pivot executed:** Adzuna → JobsPipe per `context/feature-10-plan.md`. Context files updated first (library-docs JobsPipe section, code-standards env table + agent example, architecture stack/folders/data-flow/discovery pattern/invariants, build-plan feature 10). The `category=it-jobs` invariant is retired — `job_title_or` alone constrains results.
- **Sandbox verified live (2026-08-21):** `POST /v1/sandbox/jobs/search` returns the `{ metadata, data }` envelope with fields `job_title`, `company`, `company_domain`, `location`, `remote`, `min/max_annual_salary_usd`, `date_posted`, `final_url`, `technology_slugs`. Sandbox ignores filters and always returns the same 2 samples (static mock, no body validation) — shape/integration testing only. Live-only fields (`description`, `salary_string`, `employment_statuses`) are typed optional and mapped defensively.
- Created `lib/utils.ts` (`MATCH_THRESHOLD = 70`) — previously referenced by context files but did not exist.
- Created `lib/jobspipe.ts` — POST client with Bearer auth from `JOBSPIPE_API_KEY`; strict documented-filters-only body (`job_title_or`, optional `job_location_or` + `remote: true` when input contains "remote", `limit: 10`, `include_total_results: true`); zod-validates the response envelope (no type assertions on API data); single 429 back-off retry (1.5s) then throws with status + body detail; sandbox fallback when key missing in non-production, production throws.
- Created `agent/matcher.ts` — `scoreJob(job, profile)` mirrors extractor/resume-generator patterns: gemini-2.5-flash, temp 0.3, `responseMimeType: application/json`, maxOutputTokens 300, JSON salvage + one repair retry + transient 503/429 backoff loop, zod schema (`matchScore` coerced int 0-100, matchReason, matchedSkills, missingSkills capped at 10 by prompt). Candidate text = JSON of title/level/years/skills/industries/work_experience/education/job_titles_seeking; job text = title/company/location/statuses/description trimmed to 6000 chars.
- Created `agent/jobspipe.ts` — `discoverJobs(jobTitle, location, profile)`: creates `agent_runs` row (`running`) → searchJobs → per-job score loop → inserts scored jobs only (`source: 'search'`, mapped salary/job_type/found_at per plan decisions; unscored jobs skipped with a warning row in `agent_logs`) → run updated to `completed`/`failed`. Returns `{ success, totalFound (discovered count), strongMatches (saved ≥ threshold), savedMatchScores }`. `runData.id as string` assertion needed — SDK types select() columns nullable even for non-null pk (why-comment in code).
- Created `app/api/agent/find/route.ts` — force-dynamic; auth 401 → zod body 400 ("Job title is required.") → profile check 400 with friendly message when no skills AND no current_title → fires `job_search_started` → discoverJobs → fires `job_found` per saved job score (posthog-node, shutdown fire-and-forget with error log; analytics failures never break the search) → `{ success: true, data: { totalFound, strongMatches } }`.
- **Scope addition by developer request (2026-08-21):** mock data removed and real DB reads pulled forward from feature 11 (basic listing only — filter/sort/pagination wiring still inert). `app/find-jobs/page.tsx` is now a dynamic server component: auth redirect, jobs scoped `.eq('user_id')` ordered `found_at desc`, mapped to `JobListRow` (salary null → '—', relative `formatFoundAt`). Pagination renders real totals (single page until feature 11) and is hidden entirely when there are no rows. `JobsTable` gained an empty-state row (`colSpan={5}`, muted text). MOCK_JOBS array deleted.
- **SearchControls is now live ('use client'):** controlled inputs (job title starts empty), form submit → POST `/api/agent/find`, "Searching…" spinner button state, `router.refresh()` on success. **The green banner is no longer static** — it renders only after a real response: success + totalFound > 0 shows "Found N jobs and saved M strong matches."; totalFound === 0 shows a neutral surface-secondary message; failures show an error banner (`bg-error/10 border-error/20 text-error`, login pattern). Response parsed with zod (no assertions). Inputs disabled while loading.
- Env var renamed in `.env.local`: `JOB_PIPE_API_KEY` → `JOBSPIPE_API_KEY` (value untouched) to match code-standards.
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` all clean; unauthenticated `POST /api/agent/find` → 401 `{ success: false }`; `/find-jobs` unauthenticated → 307 `/login`; sandbox curl confirms request/response shape. **Live E2E pending** — needs logged-in user with profile + `JOBSPIPE_API_KEY` + `GEMINI_API_KEY`.

### 09 Find Jobs Page — Full UI (2026-08-21)

- Built 4 server components (no `'use client'` — mock phase has no state): `SearchControls`, `JobFilters`, `JobsTable`, `JobsPagination` in `components/find-jobs/` + `app/find-jobs/page.tsx`. Page composes them with a module-level `MOCK_JOBS` array (6 rows copied from the design: Vercel 94, Stripe 88, Linear 96, Notion 72, OpenAI 91, Figma 85).
- Added shared `JobListRow` type to `types/index.ts` (`id, company, title, matchScore, salary, foundAt`) — feature 11 will map DB rows to this shape.
- Design fidelity decisions: page container uses the project-standard `max-w-[1440px] mx-auto px-6 py-8` + `gap-6` stack (ui-rules layout lock) instead of the design's 1360px/48px; shared Navbar reused as-is (design's underlined active nav item rejected per feature-05 precedent); card shell uses the ui-rules card spec (`rounded-2xl border-border bg-surface` + standard shadow).
- **Match-score bar colors follow the DESIGN's mapping, not ui-rules'**: ≥90 → `bg-success`, 80–89 → `bg-info`, <80 → `bg-warning` (`scoreBarColor` helper in JobsTable). ui-rules' ranges (80–100 green / 60–79 blue / <60 orange) would render 88% and 85% green, visibly contradicting the approved mockup. Bar is 4px `bg-border-light` track per ui-rules.
- Filter/sort controls are native `<select>` elements styled like the design's chevron buttons (`appearance-none` + absolute chevron SVG) with real options (All/High/Low Match; Match Score/Newest/Oldest) — inert until feature 11 wires state. Table columns match the design exactly: Company, Role, Match Score, Salary Est., Date Found — the build-plan's SOURCE badge column was intentionally omitted (design shows 5 columns; add it when wiring real data if still wanted).
- Pagination is prop-driven (`summaryFrom/To, total, pages[], activePage`) with `0` as an ellipsis sentinel; Previous/Next render but do nothing yet.
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` all clean; `/find-jobs` registered as dynamic route.

### 02 Auth

- Used `@insforge/sdk/ssr` module for Next.js integration:
  - `createBrowserClient()` — client-side auth state (Navbar user check)
  - `createAuthActions()` — Server Actions (OAuth URL generation, code exchange, sign out)
  - `createServerClient()` — server-side data access with cookie forwarding
  - `updateSession()` — proxy/middleware for route protection and token refresh
- Named file `proxy.ts` instead of `middleware.ts` (Next.js 16 deprecated `middleware` in favor of `proxy`)
- OAuth flow (REVISED 2026-07-31 — server-side exchange):
  - Server Action `getOAuthUrl` generates the OAuth URL and stores the returned PKCE `codeVerifier` in an httpOnly cookie (`insforge_pkce_verifier`, 10 min)
  - `redirectTo` points at `/api/auth/callback` (not `/dashboard`)
  - Callback Route Handler `app/api/auth/callback/route.ts` exchanges `insforge_code` + verifier server-side via `createAuthActions().exchangeOAuthCode()`, which persists the `insforge_access_token` / `insforge_refresh_token` cookies, then redirects to `/dashboard`
  - The browser client does NOT auto-exchange OAuth callbacks — the SDK docs explicitly state SSR browser clients must exchange on the server. The original flow (redirect to `/dashboard` + client auto-detect) never established a session: the PKCE verifier was generated in the server action and discarded, so browser exchange failed and protected routes redirected back to `/login`
- `proxy.ts` imports `updateSession` from `@insforge/sdk/ssr/middleware` (docs recommend the middleware subpath over the full `ssr` bundle)
- Environment variables stored in `.env.local`: `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`, `INSFORGE_API_KEY`

### 04 Database Schema

- Created 4 tables via InsForge MCP: `profiles`, `agent_runs`, `jobs`, `agent_logs`
- `profiles.id` stores the auth.users UUID — no auto-generation, set explicitly at insert
- All other tables use `gen_random_uuid()` for primary keys
- RLS policies on every table using `auth.uid()` pattern — filtered by `id` for profiles, `user_id` for all others
- Indexes on `user_id` and `run_id` foreign key columns
- `updated_at` handled at app level (not DB triggers)
- Created `resumes` storage bucket — private, authenticated access only
- `INSFORGE_API_KEY` added to code-standards.md env vars table

### Sign-out bugfix (2026-08-01)

- **Bug:** sign-out appeared to do nothing — the browser client's module-level `TokenManager` caches `{ accessToken, user }` in memory (`@insforge/sdk` `ssr.mjs`), and `getCurrentUser()` in browser mode returns that stale session before checking cookies. The server-action `signOut()` clears the httpOnly cookies, but `router.push('/')` is a soft navigation that does not recreate the singleton, so the Navbar's pathname effect re-ran `getCurrentUser()` and re-logged the user in (stale access token stayed usable for client-side calls too).
- **Fix:** `handleSignOut` now uses `window.location.assign('/')` (full page load) instead of `router.push('/')`, recreating the browser client with no in-memory session and cleared cookies. Removed the now-unused `useRouter` import. Verified `tsc --noEmit` and `npm run lint` clean.

### Resume download bugfix + auth error hardening (2026-08-21)

- **Bug:** no View/Download buttons after "Generate Resume from Profile" when no resume had been uploaded first. `ResumeUpload`'s `state` is initialized once from the initial `resumePdfUrl` prop; `generateFromProfile()` called `onUploaded(url)` but never set local state to `'success'`, so the UI stayed on the idle dropzone until a full page reload. The PDF itself was generated and stored correctly (`/api/resume` served it fine).
- **Fix:** `generateFromProfile()` now sets `state: 'success'` + tracks a new `resumeOrigin` state (`'uploaded' | 'generated' | null`) set by both paths; success card title reads "Resume generated from your profile" vs "resume.pdf uploaded". Verified `tsc --noEmit` + `npm run lint` clean.
- **Also (auth hardening):** `getOAuthUrl` server action no longer throws raw backend errors (violated "never throw from Server Actions") — returns `{ success, url?, error? }` with try/catch + `[actions/auth]` logging; login page shows "Sign in is temporarily unavailable." instead of a 500 digest page during backend outages (InsForge instance `4gb2mzzj` was down with 503 "No backend services available"; restored via dashboard).

### Auth refresh route (2026-08-01)

- **Bug:** login state never showed in the UI after OAuth, and there was no visible sign-out button. Root cause: the app was missing `app/api/auth/refresh/route.ts`, which the SDK's SSR setup requires (README:393-398). `createBrowserClient` POSTs to same-origin `/api/auth/refresh` on module load / 401s (`refreshFromRoute()`), and `getCurrentUser()`'s browser-mode refresh path uses the same endpoint — it 404'd, so the in-memory session (user) was never restored after a full page load and the Navbar always rendered "Start for free".
- **Fix:** added `app/api/auth/refresh/route.ts` exporting `POST` from `createRefreshAuthRouter({ baseUrl, anonKey })`. Verified: with no session the route returns `401 { error: "AUTH_UNAUTHORIZED", message: "Refresh token cookie is missing" }` (was 404). `tsc --noEmit` + `npm run lint` clean.
- **Also:** added `NEXT_PUBLIC_APP_URL=http://localhost:3000` to `.env.local` — `getOAuthUrl` previously fell back to a hardcoded `http://localhost:3000`, so a non-3000 dev port would break OAuth `redirect_uri` (must also match the URI registered in the InsForge dashboard).
- **Follow-up (still "Start for free"):** the refresh route alone did not fix the Navbar. The SDK's browser `Auth.refreshSession()` (used by `getCurrentUser()`) resolves `/api/auth/refresh` against the backend `baseUrl` and POSTs cross-origin to the InsForge backend — it never hits the app's `/api/auth/refresh` route, and the httpOnly refresh cookie (app domain) isn't sent cross-origin, so the client can never restore the user after a full load.
- **Fix (server-rendered Navbar user):** `app/layout.tsx` (server component) now calls `createInsforgeServer().auth.getCurrentUser()` and passes `user` to `<Navbar user={...} />`. Navbar dropped its browser-client `useEffect` + `getCurrentUser()` + `usePathname` and renders from the prop (still `posthog.identify` on mount, still `window.location.assign('/')` on sign-out). Since the proxy's `updateSession` refreshes the access-token cookie before render and the profile page already used the same server-side call successfully, the Navbar now reflects real auth state. `/api/auth/refresh` route kept — it's still required for the browser client's storage/DB token refresh (`refreshFromRoute`). Verified: `/` renders "Start for free" unauthenticated; `tsc --noEmit`, `npm run lint`, `npm run build` all clean.

### Profile UI polish + Login redesign (2026-08-01)

- `TagInput` (`components/profile/ProfileForm.tsx`): moved the tag/chip list BELOW the input row (was above). Chips now use accent tokens — `bg-accent-light border border-accent/30 text-accent` with `text-accent/70 hover:text-error` remove button (was neutral `bg-surface-secondary border-border text-text-primary`). Applies to Skills, Industries, Job Titles Seeking, Preferred Locations.
- Login card (`app/login/page.tsx`): added a centered gradient logo mark (`w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-dark`, briefcase icon in `text-accent-foreground`), updated subtitle ("Your AI copilot for finding and landing your next role"), and a checkmark feature list (3 items: AI-matched jobs, company research, tailored resume) using `bg-success-lightest` circle + `text-success-dark` check. Kept error banner + OAuth buttons. Uses existing design tokens only (no hardcoded hex).
- Verified: `tsc --noEmit` + `npm run lint` clean; `/login` renders the new features server-side (curl confirmed).

### 03 PostHog Initialization

- Replaced `instrumentation-client.ts` with `lib/posthog-client.ts` — uses `posthog-js/react` PostHogProvider pattern
- Created `lib/posthog-server.ts` — server-side PostHog client with `flushAt: 1` and `flushInterval: 0`
- Created `PostHogPageView` component in `lib/posthog-client.ts` — auto-captures `$pageview` on every route change
- Wired `PostHogProvider` into `app/layout.tsx` — wraps entire app
- Created `components/ui/TrackedLink.tsx` — reusable client component for tracking link clicks
- Events tracked:
  - `$pageview` — automatic on every route change
  - `cta_clicked` — Hero CTAs ("Get Started", "Find Your First Match") and CTA section ("Get Started Free")
  - `dashboard_visited` — when user lands on `/dashboard`
  - `oauth_sign_in_started` — existing, on OAuth button click (login page)
  - `user_signed_out` — existing, on sign out (Navbar)
- Environment vars: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`

### 05 Profile Page — Full UI

- Built 4 components: `ProfileCompletionCard`, `CompletionIndicator`, `ResumeUpload`, `ProfileForm` + `app/profile/page.tsx`
- Page container `max-w-[1200px]` (profile design spec) — differs from 1440px used on other pages
- Cards use `shadow-[0_4px_12px_rgba(0,0,0,0.04)]` per design spec — existing cards elsewhere have no shadow
- Missing-field badges (`PHONE`, `LOCATION`, `EDUCATION`) use `bg-error/10 text-error`; progress ring uses `--color-error` per design (danger = incomplete profile)
- Form is client-side with mock state — no DB writes yet (Feature 06)
- Email field is `readOnly` — pre-filled from auth, not editable
- Education section left empty to match the completion banner's missing-field badges
- Tag inputs (Skills, Industries, Job Titles Seeking, Preferred Locations) use a shared `TagInput` helper — Enter key or Add button appends, X removes
- Work Experience renders role sub-cards with `type="month"` date inputs; End Date disabled when "Currently working here" checked; Add Role capped at 3
- Form inputs: `h-[42px] px-3.5 border border-border rounded-md focus:ring-2 focus:ring-accent/20 focus:border-accent`
- Labels: uppercase, `text-xs font-medium tracking-wide text-text-secondary` (matches table-header convention)
- Checkbox uses `accent-accent` (native accent-color) for purple checked state
- Save button: `w-full h-12 bg-accent hover:bg-accent-dark rounded-md` — no save logic yet
- Did NOT modify shared Navbar — design spec showed purple underline on active nav, but `ui-rules.md` locks color-only active state; left as-is
- Icons are inline SVGs (lucide-react not installed)

### 06 Profile Save Logic (2026-08-01)

- Created `types/index.ts` — `ProfileFormData` (form payload, camelCase), `WorkExperienceRole`, `EducationInfo`, `ProfileRow` (DB row, snake_case)
- Created `lib/profile-completion.ts` — `computeProfileCompletion()` returns `{ percentage, missingFields, isComplete }` from 10 required fields (NAME, PHONE, LOCATION, JOB TITLE, EXPERIENCE LEVEL, YEARS EXPERIENCE, SKILLS, WORK EXPERIENCE, EDUCATION, JOB TITLES); education counts as filled only when both degree AND institution are present. Plus `yearsExperienceBucketToInt` / `intToYearsExperienceBucket` maps ('< 1 year'→0, '1 - 2 years'→2, '3 - 5 years'→4, '5 - 10 years'→7, '10+ years'→12). No new DB columns — completion is computed, only `is_complete` is stored.
- Created `actions/profile.ts` `saveProfile(input)` — server action, upsert into `profiles` (select+maybeSingle → insert on first save with `id = auth uid`, else update scoped `.eq('id', userId)`). Email always from auth user (`user.email`), never the form. Normalizes empty strings → null, maps years bucket → int, stores `work_experience`/`education` as snake_case JSON. Sets `updated_at` at app level. Fires `profile_completed` server-side (posthog, `{ userId }`, `shutdown()`) only on false→true transition. `revalidatePath('/profile')`. Never throws — returns `{ success, error }`.
- `app/profile/page.tsx` is now a dynamic server component — `getCurrentUser()` (redirect `/login` if none), fetches the `profiles` row (`maybeSingle`), builds `initialValues` (pre-fill), computes completion, renders `ProfileCompletionCard` (server) + `ProfileView` (client).
- Created `components/profile/ProfileView.tsx` (client) — owns `resumePdfUrl` state shared between `ResumeUpload` and `ProfileForm`; renders both as a fragment so they stay direct children of the page's `gap-8` stack.
- `ResumeUpload.tsx` is now a client component — uploads immediately on select/drop to `resumes/{userId}/resume.pdf` via the browser client (`insforge.storage.from('resumes').upload`, fixed key = PUT overwrite). Validates PDF type + 10MB. States: idle / uploading / success ("resume.pdf uploaded" + Replace) / error. Whole dropzone clickable. "Generate Resume from Profile" stays inert (feature 08).
- `ProfileForm.tsx` — seeded from `initialValues` prop, wired Save button to `saveProfile` with `Saving…` state and success/error banner. Added `Select ...` placeholders to all selects so an empty stored value renders a clean empty option (previously an empty value silently displayed the first option).
- `ProfileCompletionCard.tsx` + `CompletionIndicator.tsx` — now data-driven (`{ percentage, missingFields }` props); `CompletionIndicator` gained a `tone` prop (`error` | `success`) so the ring turns green at 100%.
- `profile_completed` PostHog event now wired (was defined in code-standards but never fired).
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` all clean; `/profile` unauthenticated → 307 `/login`; completion + years-mapping logic unit-tested via node.
- **Open assumption (verify in a logged-in browser):** client-side storage upload to the private `resumes` bucket relies on the non-httpOnly access-token cookie (same mechanism the Navbar uses). If upload auth fails, fallback = add `POST /api/resume/upload` route using the server client and call it from `ResumeUpload`.

### Resume view (2026-08-03)

- Added a View button to `ResumeUpload`'s success state — the bucket is private so the stored `resumePdfUrl` was not directly openable, and there was no way to see the uploaded resume.
- Created `app/api/resume/route.ts` — dynamic GET handler using `createInsforgeServer()` to `download('{userId}/resume.pdf')` and stream the PDF with `Content-Disposition: inline`. User id comes from the server-side session (not a client param). 401 unauthenticated, 404 no file.
- View opens `/api/resume` in a new tab (`<a target="_blank" rel="noopener noreferrer">`, accent button styling).
- Verified: `tsc --noEmit` + `npm run lint` clean.

### 07 AI Profile Extraction from Resume (2026-08-03)

- Installed deps: `@google/genai` (v2.15.0), `pdf-parse` (v2.4.5), `zod`.
- Created `types/index.ts` additions — `ExtractedProfile` (the AI-parsed profile: fullName, phone, location, currentTitle, yearsExperience, degree, fieldOfStudy, institution, graduationYear, skills, jobTitles, experience) and `ProfileFormHandle` (`{ applyExtracted(data) }` for imperative form fill).
- Created `agent/extractor.ts` — `extractProfileFromText(text)` returns `{ success, data?, error? }`. Uses Gemini `gemini-2.5-flash` (temp 0.3, `responseMimeType: application/json`, max_output_tokens 800, `config.systemInstruction` + `contents`). A big system prompt fixes the allowed values for `yearsExperience` (bucket labels) and `degree` (5 options) and caps to 20 skills / 3 roles. Model output is validated with a zod schema; years/degree are re-validated against the allowed lists and blanked if out-of-whack. `GEMINI_API_KEY` read server-side. Follows code-standards agent contract (`{ success, data?, error? }` + try/catch).
- Created `app/api/resume/extract/route.ts` — `POST`, `force-dynamic`. Auth via `createInsforgeServer().auth.getCurrentUser()` (401), downloads `{userId}/resume.pdf` (404 if missing), parses text with `PDFParse` (class-based v2 API: `new PDFParse({ data: buffer })` → `getText()` → `destroy()`), returns 400 on read failure or <20 chars (likely image-based PDF), calls the extractor, returns `{ success: true, data }`. Whole handler wrapped in try/catch (405/500).
- `ProfileForm.tsx` — now accepts `ref` (React 19 ref-as-prop, no `forwardRef`). `useImperativeHandle(ref, () => ({ applyExtracted }))`; `applyExtracted` overwrites each field only when the extracted value is non-empty (`orExisting`), appends new skills/jobTitles/roles (roles capped at `MAX_ROLES`=3).
- `ProfileView.tsx` — owns `formRef = useRef<ProfileFormHandle>`; passes `onExtracted` (calls `formRef.current.applyExtracted`) to `ResumeUpload` and `ref={formRef}` to `ProfileForm`.
- `ResumeUpload.tsx` — new `onExtracted` prop + "Extract & Fill Profile" button in the success state. POSTs `/api/resume/extract`, shows inline message on success/failure, `Extracting…` disabled state while pending. Reuses accent token styling.
- Installed `zod` as a direct dependency (was only a transitive dep but the extractor imports it).
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` all clean; `/api/resume/extract` registered dynamic. **Manual browser test pending** — this needs a logged-in user with an uploaded resume + `GEMINI_API_KEY` to confirm end-to-end extraction.

### 07 Extract crash fix (2026-08-06)

- **Bug:** `[agent/extractor] SyntaxError: Unterminated string in JSON` crashed `extractProfileFromText` — `responseMimeType: 'application/json'` does not guarantee valid output; a truncated/malformed model response hit `JSON.parse` and failed the whole extraction with a generic 500.
- **Fix in `agent/extractor.ts`:**
  - Split generation into `generateProfileJson()` returning `{ content, finishReason }` from `response.candidates[0].finishReason`.
  - Log a warning when `finishReason === MAX_TOKENS` (truncation), bumped `maxOutputTokens` 800 → 4096.
  - Added `parseJsonContent()` — direct parse, then salvage: strip markdown fences / isolate the outermost `{…}` object before failing.
  - On malformed JSON, retry ONCE with a `REPAIR_SYSTEM_PROMPT` (same resume text, "return only one complete valid JSON object"), then give up with the existing user-safe error. No more swallowed stack traces.
- Type assertions on the `YEARS_BUCKETS`/`DEGREES` `.includes` checks now carry the required why-comment (code-standards.md:25).
- Verified: `tsc --noEmit` + `npm run lint` clean. Still needs a live `GEMINI_API_KEY` browser test to confirm E2E.

### 07 Extract transient-error retry (2026-08-06)

- **Bug:** live test hit `[ApiError] 503 UNAVAILABLE` from Gemini ("model is currently experiencing high demand") — a transient capacity spike failed the whole extraction with a generic 500.
- **Fix in `agent/extractor.ts`:** `generateProfileJson` now retries up to 3 attempts with backoff (`attempt * 1500ms`) when the error is an `ApiError` with status `503` or `429` (transient capacity/rate-limit). Non-transient errors still throw immediately; after exhausting attempts the last error is rethrown into the existing catch. Uses `instanceof ApiError` (typed `status` property) — no type assertions.
- Verified: `tsc --noEmit` + `npm run lint` clean. Still needs a live `GEMINI_API_KEY` browser test to confirm E2E.

### 08 Resume PDF Generation from Profile (2026-08-06)

- Installed `@react-pdf/renderer` (v4.5.1) — was approved in code-standards but not yet in `package.json`.
- Created `types/index.ts` additions — `ResumeContent` (generated resume payload), `ResumeExperience`, `ResumeEducation`.
- Created `agent/resume-generator.ts` — `generateResumeContent(profile): Promise<{ success, data?, error? }>`. Guards: returns `{ success: false }` with a user-safe message if no `full_name` or no work roles. Gemini `gemini-2.5-flash` (temp 0.7, `responseMimeType: application/json`, `maxOutputTokens: 1000`) generates ONLY `title`, `summary`, `skills`, `experience[].bullets`; all other resume fields (name, contact, education, role companies/dates) are copied verbatim from the profile — never invented. Mirrors the extractor's proven patterns: JSON salvage (`parseJsonContent` fence-strip / outermost `{…}`), one repair retry, transient 503/429 retry loop (3 attempts, `attempt * 1500ms` backoff), zod validation, `[agent/resume-generator]` log prefix.
- Created `components/resume/ResumePDF.tsx` — server-only `@react-pdf` template, no `"use client"`. A4, Helvetica, only the supported CSS props (library-docs.md). Design-palette hex used directly (tokens don't reach the PDF renderer): text `#101828`, body `#4A5565`, muted `#6A7282`, accent `#7C5CFC`. Sections: header (name / accent title / muted contact), summary, skills (joined with `·`), experience (role header with dates right-aligned, accent bullet rows, `— Present` for current roles), education. Empty sections omitted.
- Created `app/api/resume/generate/route.tsx` — `dynamic = 'force-dynamic'`, `POST`, try/catch. Auth via `createInsforgeServer().auth.getCurrentUser()` (401). Fetch `profiles` row (404 if absent). Call `generateResumeContent`; `{ success: false }` → user-safe 400. `renderToBuffer(<ResumePDF .../>)` via module-level `renderResumePdf()` helper — **JSX cannot be lexically inside try/catch** (react-hooks/error-boundaries lint rule). Blob wrap required: `new Blob([new Uint8Array(buffer)], { type: 'application/pdf' })` — the SDK `upload(path, file)` reads `file.type`/`file.size`, and Node `Buffer` isn't a valid `BlobPart` in TS. Upload to `{user.id}/resume.pdf` (PUT overwrite = upsert). `resume_pdf_url` stored from `data.url` with `getPublicUrl(...).data.publicUrl` fallback. Update `profiles` scoped `.eq('id', userId)` + `updated_at`. `revalidatePath('/profile')`. Returns `{ success: true, data: { url } }`.
- `ResumeUpload.tsx` — "Generate Resume from Profile" is now live: `generating` state ("Generating…" + disabled), POSTs `/api/resume/generate`, on success calls `onUploaded(body.data.url)` (shared resume URL + View refresh without reload) + "Resume generated from your profile." message, on failure renders `body.error` inline.
- Verified: `tsc --noEmit`, `npm run lint`, `npm run build` all clean; `/api/resume/generate` POST unauthenticated → `401 { success: false }` (curl). **Manual browser test pending** — needs a logged-in user with a complete profile + `GEMINI_API_KEY` to confirm end-to-end generation (PDF renders, upload overwrites, DB `resume_pdf_url` updated).

### 08b Resume Management — Download, delete-on-replace, DB sync (2026-08-07)

- **Download button** added to `ResumeUpload.tsx` success state — secondary-styled link (`border border-border bg-surface text-text-primary hover:bg-surface-secondary`) with a download SVG, `href="/api/resume?download=1"`. It is rendered only inside the success card, so it is visible only when a resume exists (uploaded or generated).
- `app/api/resume/route.ts` GET now accepts a `download` query param — same authenticated server-side `download('{userId}/resume.pdf')`, but sets `Content-Disposition: attachment` instead of `inline` so the browser saves the file. Both Download and the existing View go through this auth route; the public storage URL is never used for serving. (Requirement: "authenticated request, not a direct public URL".)
- **Delete-old-resume-on-replace:** uploads and generates now `remove('{userId}/resume.pdf')` before writing the new file.
  - `actions/resume.ts` `uploadResume()` — new server action: validates PDF type + 10MB, removes the old object, uploads the new file, updates `resume_pdf_url` + `updated_at` in `profiles`, `revalidatePath('/profile')`. Returns `{ success, data: { url } | error }`.
  - `app/api/resume/generate/route.tsx` — added `remove` before the upload (it already updated the DB).
- **`resume_pdf_url` now synced on every upload/generation.** Previously an upload only set client state and was persisted on the next Save Profile; upload now persists `resume_pdf_url` in `profiles` immediately via the server action. Generation was already updating it.
- `ResumeUpload.tsx` no longer imports the browser storage client — uploads go through the `uploadResume` server action. Dropped the now-unused `userId` prop from `ResumeUpload` / `ProfileView` / `app/profile/page.tsx` (server action derives the user from the session).
- Uses design tokens only (border-border / bg-surface secondary pattern). Verified `tsc --noEmit` + `npm run lint` clean.

### 08b Client-side constant import fix (2026-08-07)

- **Bug:** production build failed with an ECMAScript error at the `export const MAX_RESUME_SIZE_MB` line in `actions/resume.ts`, traced to a **Client Component Browser** import. Root cause: `ResumeUpload.tsx` (client, `use client`) imported `MAX_RESUME_SIZE_MB` directly from `actions/resume.ts`, a `'use server'` module. Every export of a server-action file becomes a server action, so importing that module into the client dragged the whole server module (incl. `createInsforgeServer`, `next/headers`) into the client bundle.
- **Fix:** moved `MAX_RESUME_SIZE_MB` into a new shared client-safe module `lib/constants.ts`. Both `actions/resume.ts` and `ResumeUpload.tsx` now import it from there. The client no longer touches any server-only code.
- **Pattern to reuse:** client components may import server **actions** from `'use server'` files, but must never import plain data/constants from them — share values via `lib/constants.ts` (or a client-safe module) instead.
- Verified: `npm run build` clean (compile + TS + all routes generated).

### 07 E2E verified (2026-08-06)

- **Confirmed working in a live browser:** "Extract & Fill Profile" now completes end-to-end — authenticated user with uploaded resume → Gemini parses → form fields populated and editable before save. The JSON salvage/repair path, transient 503 retry, and the original `JSON.parse` crash fix all held up under a real resume. Feature 07 is fully verified, no longer pending a browser test.

### Homepage CTA auth state (2026-07-31)

- `app/page.tsx` is now a dynamic server component — calls `createInsforgeServer().auth.getCurrentUser()` and passes `isAuthenticated` to `Hero` and `CtaSection`
- `Hero`: logged out → Get Started → `/login`; logged in → "Go to Dashboard" → `/dashboard`, secondary CTA → `/find-jobs`
- `CtaSection`: logged out → "Get Started Free" → `/login`; logged in → "Go to Dashboard" → `/dashboard`
- `login/page.tsx` shows an error banner when redirected with `?error=oauth_failed` (reads via `useSearchParams` inside a `Suspense` boundary — required for the statically prerendered `/login` route)
- Verified with curl: `/profile` unauthenticated → 307 `/login`; with access-token cookie → 200; `/api/auth/callback` without params → 307 `/login?error=oauth_failed`

---

## Notes

_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._
