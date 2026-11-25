# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Root Layout

File: `app/layout.tsx`

| Property | Class |
|---|---|
| Background | `bg-background` |
| Font | `font-sans` (Inter via next/font) |
| Layout | `min-h-full flex flex-col` |

### Navbar

File: `components/layout/Navbar.tsx`
Last updated: 2026-08-23

| Property | Class |
|---|---|
| Background — header | `bg-surface` |
| Border — bottom | `border-b border-border` |
| Height | `h-16` |
| Width | `w-full` |
| Z-index (mobile panel overlay) | `z-50` on header (relative) |
| Container | `max-w-[1440px] mx-auto px-6` |
| Brand tile | `h-10 w-10 rounded-[10px] bg-gradient-to-br from-accent to-accent-dark` + white 4-square SVG (`h-5 w-5`) |
| Brand wordmark | `text-xl font-bold text-text-primary` ("JobPilot") |
| Nav link — default | `flex items-center gap-1.5 text-sm font-medium text-text-dark` |
| Nav link — hover / active | `hover:text-accent transition-colors`; active = `text-accent` (color-only per ui-rules) |
| Nav link icons | inline SVG 16×16, `stroke="currentColor" strokeWidth={2}` (grid / magnifier / person) |
| Desktop cluster | right side: `hidden md:flex items-center gap-8` wrapping nav (`gap-9`) + auth control |
| CTA button — primary | `bg-accent text-accent-foreground text-sm font-medium px-4 py-2 rounded-md` |
| CTA button — hover | `hover:opacity-90 transition-opacity` |
| Hamburger button | `md:hidden flex h-10 w-10 items-center justify-center rounded-md text-text-dark hover:bg-surface-secondary`; toggles lines/X SVG; `aria-expanded` + `aria-label` |
| Mobile panel | `absolute inset-x-0 top-full md:hidden border-b border-border bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.06)]`; links stacked `py-3 flex items-center gap-2.5 rounded-md`, divider `border-t border-border`, CTA/sign-out below |

**Pattern notes:**
2026-08-23 rework (per developer request): brand block rebuilt to match `context/designs/dashboard.html` — purple gradient tile with 4-square mark + "JobPilot" wordmark replaces the old `next/image /logo.png`. Nav links gained 16px inline-SVG icons and sit right-aligned next to the auth control (design's space-between layout). Active state remains color-only (`text-accent`) — the design's 2px underline is still rejected per the feature-05/ui-rules lock.
Mobile: desktop cluster hidden (`hidden md:flex`); hamburger toggles an in-header absolute dropdown panel (not position:fixed) listing nav links + auth action; links close the panel on click via `onClick={() => setMenuOpen(false)}`. Active detection uses `usePathname()` (exact match or trailing-slash prefix).
Sign out button when authenticated: `text-sm font-medium text-text-secondary hover:text-error transition-colors`.
Since 2026-08-01 the user is passed in as a prop from the root layout (server-rendered via `createInsforgeServer().auth.getCurrentUser()`), not fetched with the browser client — the client SDK's `getCurrentUser()` can't restore a session cross-origin after a full page load. Navbar is `'use client'` (needs `posthog.identify` + sign-out handler) but holds no auth state; sign-out does `window.location.assign('/')` for a full reload.

### Footer

File: `components/layout/Footer.tsx`
Last updated: 2026-07-26

| Property | Class |
|---|---|
| Background | `bg-surface` |
| Border — top | `border-t border-border` |
| Spacing | `px-6 py-8` |
| Layout | `flex flex-col md:flex-row items-center justify-between gap-4` |
| Nav link — default | `text-xs text-text-muted` |
| Nav link — hover | `hover:text-text-primary transition-colors` |
| Copyright | `text-xs text-text-muted` |

**Pattern notes:**
Footer stacks vertically on mobile, row on desktop.
Auto margin top (`mt-auto`) to stick to bottom of page.

### Hero

File: `components/homepage/Hero.tsx`
Last updated: 2026-07-26

| Property | Class |
|---|---|
| Background — section | transparent (inherits `bg-background`) |
| Headline | `text-4xl md:text-5xl lg:text-6xl font-semibold text-text-primary leading-tight` |
| Subheadline | `text-base md:text-lg text-text-secondary` |
| CTA — primary | `bg-accent text-accent-foreground text-sm font-medium px-6 py-3 rounded-md` |
| CTA — secondary | `border border-border text-text-primary text-sm font-medium px-6 py-3 rounded-md` |
| Screenshot container | `rounded-2xl border border-border overflow-hidden shadow-lg` |

**Pattern notes:**
Headline max-width `max-w-3xl`, subheadline `max-w-xl`, both centered.
CTAs are `Link` components (client navigation), not `<button>`.
Screenshot below the text section with `pb-20` bottom padding.

### Features

File: `components/homepage/Features.tsx`
Last updated: 2026-07-26

| Property | Class |
|---|---|
| Background — section | `bg-surface` |
| Section heading | `text-base font-semibold text-accent` |
| Section title | `text-3xl md:text-4xl font-semibold text-text-primary` |
| Card — background | `bg-surface` |
| Card — border | `border border-border` |
| Card — radius | `rounded-2xl` |
| Card — padding | `p-6` |
| Card — layout | `flex flex-col items-start` |
| Icon container | `w-10 h-10 rounded-lg bg-accent-light` |
| Card title | `text-base font-semibold text-text-primary` |
| Card description | `text-sm text-text-secondary leading-relaxed` |
| Grid | `grid md:grid-cols-3 gap-6` |

**Pattern notes:**
Section heading in uppercase ("FEATURES") in accent color.
Section title below heading in dark text.
Cards are white (`bg-surface`) — no colored card backgrounds.
Icons use `lucide-react`-style inline SVG with `text-accent`.

### Testimonials

File: `components/homepage/Testimonials.tsx`
Last updated: 2026-07-26

| Property | Class |
|---|---|
| Background — section | `bg-background` |
| Section title | `text-3xl md:text-4xl font-semibold text-text-primary` |
| Card — background | `bg-surface` |
| Card — border | `border border-border` |
| Card — radius | `rounded-2xl` |
| Card — padding | `p-6` |
| Quote text | `text-sm text-text-primary leading-relaxed` |
| Name | `text-sm font-medium text-text-primary` |
| Role | `text-xs text-text-muted` |
| Avatar | `rounded-full`, 32x32 |
| Grid | `grid md:grid-cols-3 gap-6` |

**Pattern notes:**
Identical card structure to Features — same bg, border, radius, padding.
Cards use `flex-1` on quote text to push author info to bottom.
Avatars use imported static image with `next/image`.

### CTA Section

File: `components/homepage/CtaSection.tsx`
Last updated: 2026-07-26

| Property | Class |
|---|---|
| Background — section | `bg-surface` |
| Heading | `text-3xl md:text-4xl font-semibold text-text-primary` |
| Subheadline | `text-base text-text-secondary` |
| CTA — primary | `bg-accent text-accent-foreground text-sm font-medium px-6 py-3 rounded-md` |
| CTA — hover | `hover:opacity-90 transition-opacity` |
| Layout | `flex flex-col items-center text-center` |
| Spacing | `px-6 py-20` |

**Pattern notes:**
Full-width section, centered content.
Heading max-width `max-w-2xl`, subheadline `max-w-lg`.
Uses same CTA button class as Hero primary CTA.

---

### Dashboard Page Container

File: `app/dashboard/page.tsx`
Last updated: 2026-08-23 (Feature 14 — full UI)

| Property               | Class                                         |
| ---------------------- | --------------------------------------------- |
| Page container         | `max-w-[1440px] mx-auto px-6 py-8`           |
| Stack                  | `flex flex-col gap-5`                        |
| Mid-row grid           | `grid grid-cols-1 gap-5 lg:grid-cols-2`      |
| Bottom-row grid        | `grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]` |

**Pattern notes:**
Dynamic server component: auth redirect (`/login`) via `createInsforgeServer().auth.getCurrentUser()` (same as find-jobs). Composes StatsBar → [RecentActivity + CompanyResearchActivity] → [JobsFoundOverTime + MatchScoreDistribution]. No page heading — design goes straight to stat cards (old "Dashboard / Welcome" heading removed with Feature 14). Since Feature 15 the page queries `jobs` scoped `.eq('user_id')` once and computes all four stat values in JS; since Feature 16 it also queries `agent_runs` (completed, limit 8) in `Promise.all`; since Feature 17 three PostHog analytics getters from `lib/posthog-query.ts` join the same `Promise.all` and feed the charts real data (each getter degrades to a zero-filled series on any failure, so charts never break the render). `dashboard_visited` PostHog event preserved via `DashboardVisitTracker` client component (page itself is a server component now). Design source: `context/designs/dashboard.html`.

### DashboardVisitTracker

File: `components/dashboard/DashboardVisitTracker.tsx`
Last updated: 2026-08-23

| Property | Value |
|---|---|
| Component type | `'use client'` — fires `posthog.capture('dashboard_visited')` on mount |
| Render | `null` |

**Pattern notes:** Extracted from the old client-only dashboard page when it became a server component. Keeps the feature-03 event contract intact.

### StatsBar

File: `components/dashboard/StatsBar.tsx`
Last updated: 2026-08-23

| Property | Class |
|---|---|
| Grid | `grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4` |
| Card | standard card shell (`rounded-2xl border border-border bg-surface p-6` + standard shadow) |
| Stat label | `text-sm font-medium text-text-secondary` |
| Stat value | `mt-3.5 text-[30px] font-semibold leading-9 text-text-primary` |
| Sub row | `mt-3 flex items-center gap-2 text-xs font-normal text-text-muted` — rendered ONLY when trend or sub exists |
| Trend badge — positive | `rounded-sm bg-success-lightest px-2 py-0.5 text-xs font-medium text-success-darker` |
| Trend badge — negative | `rounded-sm bg-error/10 px-2 py-0.5 text-xs font-medium text-error` |

**Pattern notes:** Prop-driven (`stats: DashboardStat[]` exported from the file): `{ id, label, value, trend?, sub? }` — both optional. Since Feature 15 (developer request): the page computes real week-over-week deltas and passes them as `trend` (`+N%` / `-N%`, sign decides badge tone); when no prior-period baseline exists, BOTH `trend` and the "vs last week" `sub` are omitted so the footer row disappears entirely — never render a comparison caption without data. Negative-tone classes reuse the login error-banner pattern (`bg-error/10 text-error`) since no error-lightest token exists. Avg. Match Rate shows '—' until jobs exist; counts show '0'.

### RecentActivity

File: `components/dashboard/RecentActivity.tsx`
Last updated: 2026-08-23

| Property | Class |
|---|---|
| Card | standard card shell (`rounded-2xl border border-border bg-surface p-6` + standard shadow) |
| Heading row | `border-b border-border pb-5 text-base font-semibold text-text-primary` |
| Item | `flex gap-3.5 border-b border-border py-5 last:border-b-0` |
| Dot | `mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full` + color class by type |
| Item title | `text-sm font-medium text-text-primary` |
| Item time | `mt-1 text-xs font-normal text-text-muted` |
| List container | `h-[340px] overflow-y-auto pr-1` — fixed-height scroll area matching the `h-[340px]` chart plot beside it (added 2026-08-23, developer request) |
| Empty state | `py-12 text-center` — muted text "No recent activity yet." + secondary-styled Link to `/find-jobs` ("Find Jobs") |

**Pattern notes:** Prop-driven (`activities: DashboardActivity[]` from types/index.ts: `{ id, type, title, time }`). Dot color map: `job_found → bg-success-alt`, `company_researched → bg-info`, `resume_tailored → bg-accent` (ui-tokens Activity Dots semantics; the design's inconsistent dot colors normalized to type semantics). Plain dots (no outer ring) matching the delivered design. Empty state follows ui-rules (muted text + CTA for logical next action). Since Feature 16 the page feeds it real data — merged completed `agent_runs` ("Found N jobs for X") + researched jobs ("Researched Y"), sorted by raw timestamp desc. **2026-08-23 (developer request):** feed carries ONLY the last **3 days**; research entries key off `jobs.researched_at` (set when the dossier is saved — previously they surfaced at discovery-time `found_at`, so fresh research never appeared "recent"); cap 30 (`MAX_ACTIVITY_ITEMS`) and the list scrolls inside a fixed-height card. **Non-flex guarantee:** BOTH grid siblings pin their content height — the list is `h-[340px] overflow-y-auto` and the chart's wrapper is `relative h-[340px]` (ResponsiveContainer inside measures it) — so grid stretch can only add whitespace below the shorter card's content, never deform the chart or grow the list unbounded.

### CompanyResearchActivity

File: `components/dashboard/CompanyResearchActivity.tsx`
Last updated: 2026-08-23 (Feature 17 — recharts rebuild)

| Property | Class |
|---|---|
| Card | standard card shell (`rounded-2xl border border-border bg-surface p-6` + standard shadow) |
| Heading | `mb-5 text-base font-semibold text-text-primary` |
| Chart wrap | `relative h-[340px]` with `role="img"` + aria-label (overlay sits inside it) |
| Renderer | `'use client'`; `ResponsiveContainer` 100%×100% wrapping a recharts `BarChart` (replaces the fixed-viewBox SVG) |
| Gridlines | `<CartesianGrid vertical={false} strokeDasharray="3 4" className="stroke-border" />` |
| XAxis | `dataKey="day"` `interval={0}` `axisLine={false}` `tickLine={false}` `tickMargin={8}`, custom tick component (`fill-text-muted text-xs`, centered) |
| YAxis | `domain={[0, yMax]}`, ticks `[0,.25,.5,.75,1]·yMax` rounded, `width={28}`, custom end-anchored muted tick; yMax = max ≤12 ? 12 : ceil(max/4)·4 (unchanged scale logic) |
| Bars | `<Bar dataKey="count" radius={[6,6,0,0]} isAnimationActive={false} style={{ fill: 'var(--color-info)' }} />` |

**Pattern notes:** Client component (recharts). Prop-driven (`data: DashboardDayPoint[]` = `{ day, count }[]`, now real 7-day UTC weekday labels from `lib/posthog-query.ts`). Colors via inline `style={{ }}` only — CSS variables don't resolve in SVG presentation attributes (feature 14 lesson); Tailwind classes used for gridline stroke and tick fills where they cascade. Empty state: total 0 → muted overlay "No company research yet."

### JobsFoundOverTime

File: `components/dashboard/JobsFoundOverTime.tsx`
Last updated: 2026-08-23 (Feature 17 — recharts rebuild)

| Property | Class |
|---|---|
| Card | standard card shell (`rounded-2xl border border-border bg-surface p-6` + standard shadow) |
| Chart wrap | `relative h-[340px]` with `role="img"` + aria-label |
| Renderer | `'use client'`; `ResponsiveContainer` wrapping a recharts `AreaChart`, margin `{ top:12, right:8 }` |
| Gradient | `<defs><linearGradient id="jfo-area-fill">` stops via inline style: `var(--color-accent)` opacity 0.32→0 |
| Area | `type="monotone"` `strokeWidth={3}` `strokeLinecap="round"` `activeDot={false}` `isAnimationActive={false}` `style={{ stroke: 'var(--color-accent)' }}` `fill="url(#jfo-area-fill)"` |
| Gridlines | dashed horizontal-only `CartesianGrid className="stroke-border"` |
| XAxis | `interval={4}` (sparse ~every-5th label on the 30-day series), no axis/tick lines, custom muted centered tick |
| YAxis | fixed `domain [0,100]` ticks 0/25/50/75/100, `width={28}`, custom end-anchored muted tick |

**Pattern notes:** Client component (recharts). Prop-driven (`data: DashboardDayPoint[]`, real trailing-30-day UTC short-date labels from `lib/posthog-query.ts`). The old hand-rolled Catmull-Rom smoothing is replaced by recharts' monotone curve. Empty overlay "Run an agent to populate your chart." when total === 0.

### MatchScoreDistribution

File: `components/dashboard/MatchScoreDistribution.tsx`
Last updated: 2026-08-23 (Feature 17 — recharts rebuild)

| Property | Class |
|---|---|
| Card | standard card shell (`rounded-2xl border border-border bg-surface p-6` + standard shadow) |
| Chart wrap | `relative h-[340px]` with `role="img"` + aria-label |
| Renderer | `'use client'`; `ResponsiveContainer` wrapping a recharts `BarChart` |
| Gridlines | dashed horizontal-only `CartesianGrid className="stroke-border"` |
| XAxis | `dataKey="range"` all 5 labels (`interval={0}`), custom muted centered tick |
| YAxis | fixed `domain [0,100]` ticks 0/25/50/75/100, `allowDecimals={false}`, `width={28}`, custom muted tick |
| Bars | `<Bar dataKey="count" radius={[6,6,0,0]} isAnimationActive={false} style={{ fill: 'var(--color-success)' }} />` — note recharts v3 deprecates `Cell`; styling goes on `<Bar>` itself and spreads to every rect |

**Pattern notes:** Client component (recharts). Prop-driven (`data: DashboardRangePoint[]` = `{ range, count }[]`, real bucket counts from `lib/posthog-query.ts`). All-zero data keeps the axes frame plus overlay "No match data yet."

### TrackedLink

File: `components/ui/TrackedLink.tsx`
Last updated: 2026-07-29

| Property       | Value                                        |
| -------------- | -------------------------------------------- |
| Type           | `'use client'` — wraps `next/link` Link      |
| Props          | `eventName`, `eventProperties` + all Link props |
| Behavior       | Calls `posthog.capture(eventName, eventProperties)` on click |

**Pattern notes:**
Replaces `<Link>` wherever a click event should be tracked. Keeps the component server-compatible — the client boundary is only in the tracked wrapper, not the parent page. Event names used: `cta_clicked` (with `cta` property identifying location).

### Login Card

File: `app/login/page.tsx`
Last updated: 2026-08-01

| Property               | Class                                         |
| ---------------------- | --------------------------------------------- |
| Background — card      | `bg-surface`                                  |
| Border — card          | `border border-border`                        |
| Border radius — card   | `rounded-2xl`                                 |
| Padding — card         | `p-8`                                         |
| Logo mark             | `w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-sm` |
| Logo icon             | `w-6 h-6 text-accent-foreground` (briefcase, strokeWidth 1.8) |
| Heading                | `text-2xl font-semibold text-text-primary text-center` |
| Subtitle               | `text-sm text-text-secondary text-center mb-6` |
| Feature row           | `flex items-center gap-2.5 text-sm text-text-secondary` |
| Feature check circle  | `flex-shrink-0 w-4 h-4 rounded-full bg-success-lightest flex items-center justify-center` |
| Feature check icon    | `w-2.5 h-2.5 text-success-dark` (strokeWidth 3) |
| Feature list          | `mb-6 space-y-2.5` |
| Gap — button stack     | `flex-col gap-3`                              |
| Centering wrapper      | `min-h-[calc(100vh-4rem)] flex items-center justify-center px-4` |
| Width — card           | `w-full max-w-sm`                             |

**Pattern notes:**
Card matches existing card patterns (Features, Testimonials) — same `bg-surface`, `border border-border`, `rounded-2xl` but uses `p-8` (larger) instead of `p-6` for a more spacious form layout. Card is centered vertically and horizontally on the page. Page is split into `LoginPage` (default export, `Suspense` fallback `null` wrapper) + internal `LoginCard` client component — required because `/login` is statically prerendered and `useSearchParams` must live inside a Suspense boundary or the whole tree bails to client rendering. Welcoming treatment (added 2026-08-01): gradient logo mark on top, value-prop subtitle, and a 3-item checkmark feature list (AI-matched jobs, company research, tailored resume) above the OAuth buttons. Logo gradient uses theme tokens (`from-accent to-accent-dark`) — no hardcoded hex.

### OAuth Button

File: `app/login/page.tsx`
Last updated: 2026-07-31

| Property               | Class                                         |
| ---------------------- | --------------------------------------------- |
| Background             | `bg-surface`                                  |
| Border                 | `border border-border`                        |
| Border radius          | `rounded-md`                                  |
| Text                   | `text-sm font-medium text-text-primary`       |
| Padding                | `px-4 py-2.5`                                 |
| Hover                  | `hover:bg-surface-secondary`                  |
| Transition             | `transition-colors`                           |
| Disabled               | `disabled:opacity-50 disabled:cursor-not-allowed` |
| Icon size              | `w-5 h-5`                                     |
| Gap — icon + text      | `gap-3`                                       |
| Layout                 | `flex items-center justify-center w-full`     |

**Pattern notes:**
Both Google and GitHub OAuth buttons use identical classes. The secondary CTA pattern (`border border-border text-text-primary text-sm font-medium`) from Hero is reused here. Loading state shows a spinner (`w-5 h-5 border-2 border-text-muted border-t-accent rounded-full animate-spin`) that replaces the provider icon; the whole stack is disabled while a provider is loading. Button calls the `getOAuthUrl` server action (fires `oauth_sign_in_started` PostHog event) and redirects to the returned URL.

### Error Banner

File: `app/login/page.tsx`
Last updated: 2026-07-31

| Property               | Class                                         |
| ---------------------- | --------------------------------------------- |
| Background             | `bg-error/10`                                 |
| Border                 | `border border-error/20`                      |
| Border radius          | `rounded-md`                                  |
| Padding                | `p-3`                                         |
| Text                   | `text-sm text-error`                          |
| Margin bottom          | `mb-4`                                        |

**Pattern notes:**
Error banner appears above the OAuth buttons only when an error exists. Uses opacity variants of the error color for background and border. Error source is `callbackError` (from `?error=oauth_failed` read via `useSearchParams` after a failed OAuth exchange) OR `submitError` (thrown by the `getOAuthUrl` server action) — shown via `callbackError ?? submitError`. Derived from the query param during render, not in an effect (avoids the `react-hooks/set-state-in-effect` lint error).

## Design Tokens

## Design Tokens

All tokens defined in `app/globals.css` via `@theme`:
- Surface colors: `bg-background` (#f6f7fb), `bg-surface` (#fff), `bg-surface-secondary` (#f9fafb), `bg-surface-tertiary` (#f2f5f7), `bg-surface-muted` (#f4f5fb)
- Border colors: `border-border` (#e7eaf3), `border-border-light` (#e5e7eb), `border-border-muted` (#dfe1e7)
- Text colors: `text-text-primary` (#101828), `text-text-secondary` (#6a7282), `text-text-muted` (#99a1af), `text-text-dark` (#364153), and more
- Accent (purple): `bg-accent` (#7c5cfc), `text-accent-foreground`, `bg-accent-light` (#f3e8ff), `bg-accent-muted` (#faf5ff)
- Success (green): `bg-success` (#10b981), `bg-success-light` (#d0fae5), `bg-success-lightest` (#ecfdf5)
- Info (blue): `bg-info` (#61a8ff), `bg-info-light` (#dbeafe), `bg-info-lightest` (#eff6ff)
- Warning (orange): `bg-warning` (#ff8904)
- Error (red): `bg-error` (#ef4444)
- LinkedIn: `bg-linkedin` (#0a66c2), `bg-linkedin-light` (#dce6f1)
- Border radius: `rounded-sm` (4px), `rounded-md` (8px), `rounded-lg` (12px), `rounded-2xl` (16px), `rounded-full` (9999px)

### Job Details Page Container

File: `app/find-jobs/[id]/page.tsx`
Last updated: 2026-08-22

| Property | Class |
|---|---|
| Page container | `max-w-[1060px] mx-auto px-6 py-8` |
| Stack | `flex flex-col gap-5` |
| Back link | `inline-flex items-center gap-1 self-start text-sm font-medium text-text-secondary transition-colors hover:text-text-primary` |

**Pattern notes:**
Dynamic server component: awaits `params` (`Promise<{ id: string }>` per Next 16), auth redirect, job fetched from `jobs` scoped `.eq('id', id).eq('user_id', user.id)` with `.maybeSingle()` → `notFound()` when missing or not owned. Maps the row to the camelCase `JobDetail` type (`applyUrl = external_apply_url ?? source_url`, relative `formatFoundAt` from lib/utils). Composes JobInfo → MatchScore (two cards via fragment) → JobDescription → CompanyResearch → JobActions. Container width follows the delivered design spec (1060px), same precedent as profile keeping its 1200px.

### JobInfo

File: `components/job-details/JobInfo.tsx`
Last updated: 2026-08-22

| Property | Class |
|---|---|
| Header card | `rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]`, layout `flex flex-col gap-4 md:flex-row md:items-center md:justify-between` |
| Company tile | `h-14 w-14 shrink-0 rounded-xl bg-surface-muted text-text-secondary flex items-center justify-center` (building SVG) |
| Title | `text-2xl font-semibold text-text-primary` |
| Meta row | `mt-1.5 flex flex-wrap items-center gap-2 text-sm text-text-secondary` |
| Match pill — high | `bg-success-lightest text-success-dark rounded-full px-3 py-1 text-xs font-semibold` |
| Match pill — low | same but `bg-error/10 text-error`; mid: `bg-warning/10 text-warning` |
| View Job Post | secondary button pattern + external-link SVG, `<a target="_blank" rel="noopener noreferrer">`; disabled `<button type="button">` variant when no URL (`cursor-not-allowed opacity-50`, no hover) |
| Stat card | `flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-5` + standard shadow |
| Stat icon tile | `h-10 w-10 rounded-lg flex items-center justify-center` — salary `bg-success-lightest text-success`, location `bg-info-lightest text-info-medium`, job type `bg-accent-light text-accent`, date `bg-surface-muted text-text-secondary` |
| Stat value | `truncate text-[15px] font-bold text-text-primary` |
| Stat label | `mt-0.5 text-xs uppercase tracking-wider text-text-muted` |

**Pattern notes:**
Renders header card + stats grid (`grid grid-cols-2 gap-4 lg:grid-cols-4`) as a fragment so both are direct children of the page's `gap-5` stack. Score pill colors read `MATCH_HIGH`/`MATCH_LOW` from lib/utils — same bands as the table bars. Null salary/location render '—'. View Job Post always renders (developer decision 2026-08-22): enabled `<a>` when apply URL exists, disabled `<button>` otherwise — matches the Apply Now disabled treatment, so legacy null-URL rows stay visibly non-functional instead of hiding the control.

### MatchScore

File: `components/job-details/MatchScore.tsx`
Last updated: 2026-08-22

| Property | Class |
|---|---|
| Cards (×2) | standard card shell (`rounded-2xl border border-border bg-surface p-6` + shadow) rendered as a fragment |
| Eyebrow row | `mb-4 flex items-center gap-2.5` — badge `h-8 w-8 rounded-lg bg-success-lightest text-success`, label `text-xs font-bold uppercase tracking-wider text-text-muted` ("AI MATCH REASONING") |
| Reasoning text | `whitespace-pre-line text-[15px] leading-[1.7] text-text-primary` |
| Skills header | `text-xs font-bold uppercase tracking-wider text-text-muted mb-5` ("REQUIRED SKILLS VS YOUR PROFILE") |
| Group label | `text-sm text-text-secondary mb-2.5` |
| Skill pills row | `flex flex-wrap gap-2.5` (`mb-[22px]` after matched group) |
| Pill — matched | `inline-flex items-center gap-1.5 rounded-full bg-success-lightest px-3.5 py-1.5 text-sm font-medium text-success-foreground` + check SVG |
| Pill — missing | same geometry but `bg-accent-muted text-accent` + ✕ SVG |

**Pattern notes:**
Card A = Gemini match reason; Card B = matched vs missing skills. Missing skills use accent purple per ui-tokens Skills Badges table and the delivered design (build-plan's "red/orange" wording superseded by both). Empty arrays get muted fallback lines ("No matching skills identified." / "No gaps identified."); null reason renders "No match reasoning available."

### JobDescription

File: `components/job-details/JobDescription.tsx`
Last updated: 2026-08-22

| Property | Class |
|---|---|
| Component type | `'use client'` — owns `expanded` state |
| Card | standard card shell (`rounded-2xl border border-border bg-surface p-6` + shadow) |
| Section title | `h-8 w-8 rounded-lg bg-surface-muted text-text-secondary` document badge + `text-base font-semibold text-text-primary` |
| Body | `whitespace-pre-line text-[15px] leading-[1.7] text-text-primary` (+ `line-clamp-4` while collapsed) |
| Toggle button | `mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark transition-colors` + chevron SVG (`rotate-180` when expanded), `aria-expanded` set |

**Pattern notes:** Renders `about_role` (JobsPipe full description stored at discovery). Collapsed by default with a 4-line `line-clamp` preview; "Show more"/"Show less" toggles full text. Toggle renders only when content actually overflows the preview — description length > 280 chars OR more than 4 newline-separated lines (`PREVIEW_CHAR_LIMIT` / `PREVIEW_LINE_LIMIT` constants). Empty state: "No description was captured for this job." in `text-sm text-text-muted`.

### CompanyResearch

File: `components/job-details/CompanyResearch.tsx`
Last updated: 2026-08-23 (dossier sections wrapped in sub-cards)

| Property | Class |
|---|---|
| Component type | `'use client'` — owns `status` state machine (`idle \| loading \| error \| dossier`), POSTs `/api/agent/research` |
| Card | standard card shell (`rounded-2xl border border-border bg-surface p-6` + shadow) |
| Header row | `mb-5 flex flex-wrap items-center justify-between gap-4` |
| Section title | `h-8 w-8 rounded-lg bg-accent-light text-accent` building badge + `text-base font-semibold text-text-primary` |
| Research button (idle) | `inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed` + magnifier SVG |
| Loading button | same, disabled + spinner (`w-[18px] h-[18px] border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin`) + label "Researching…" |
| Empty state box | `rounded-xl border border-border bg-surface px-[30px] py-12 text-center` |
| Loading state | same box geometry; icon becomes the spinner (`mx-auto mb-[18px] h-[52px] w-[52px] border-[3px] border-border border-t-accent rounded-full animate-spin`), title "Researching {company}…", body "The agent is browsing public pages and building your dossier. This can take up to a minute." |
| Error banner | `mb-6 flex items-start justify-between gap-4 rounded-md bg-error/10 border border-error/20 px-[18px] py-3.5 text-sm text-error`, message + Retry button (`shrink-0 rounded-md border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 transition-colors`) |
| Dossier section card | every dossier field is its own sub-card: `rounded-xl border border-border bg-surface p-5` (white, no nested shadow — parent card keeps the shadow); shared const `DOSSIER_CARD` |
| Dossier stack | `flex flex-col gap-4` — two full-width paragraph cards (`About {company}`, `Why this role`) then the list grid |
| Dossier grid | `grid grid-cols-1 gap-4 md:grid-cols-2` — Tech Stack / Culture & Working Style / Your Edge / Gaps to Address / Smart Questions / Interview Prep cards |
| Dossier card label | `mb-2 text-xs font-bold uppercase tracking-wider text-text-muted` (mb-2.5 on list cards) |
| Dossier body text | paragraphs `text-[15px] leading-[1.7] text-text-primary`; lists use accent dot bullets (`mt-[7px] h-1.5 w-1.5 rounded-full bg-accent`) with `text-sm leading-relaxed` items |
| Sources row | `border-t border-border pt-4 text-xs leading-relaxed text-text-muted`, separator dots between sources |

**Pattern notes:** Feature 13 wired the flow: click → POST → optimistic loading UI → success renders the parsed dossier + `router.refresh()` (so a reload keeps it); failure shows the error banner with Retry. `initialDossier` prop (server-safeParsed from `jobs.company_research`) renders the dossier state directly on first paint for already-researched jobs — no re-fetch flash. Body copy interpolates the company name. All async states have aria-live-friendly roles; button disabled while loading.

### JobActions

File: `components/job-details/JobActions.tsx`
Last updated: 2026-08-22

| Property | Class |
|---|---|
| Apply CTA | `inline-flex w-full items-center justify-center rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground hover:bg-accent-dark transition-colors` |
| No URL state | `<button disabled>` + `disabled:opacity-50 disabled:cursor-not-allowed` |

**Pattern notes:** Label "Apply Now at {company}". With an apply URL it's a new-tab anchor (`rel="noopener noreferrer"`); without one it renders disabled (legacy rows have null URLs) instead of hiding the primary CTA.

### Find Jobs Page Container

File: `app/find-jobs/page.tsx`
Last updated: 2026-08-22

| Property | Class |
|---|---|
| Page container | `max-w-[1440px] mx-auto px-6 py-8` |
| Stack | `flex flex-col gap-6` |
| Results card shell | `bg-surface border border-border rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]` |

**Pattern notes:**
Dynamic server component: auth redirect (`/login`), jobs read from the `jobs` table scoped to the user ordered `found_at desc`, mapped to `JobListRow` (null salary → '—', relative `formatFoundAt`, plus raw ISO `foundAtRaw` for client-side sorting). Renders `<JobsBrowser jobs={rows} />` inside the results card — filter/sort/search/pagination state lives in the client. SearchControls owns its own card shell; the page owns the results card shell.

### JobsBrowser

File: `components/find-jobs/JobsBrowser.tsx`
Last updated: 2026-08-22

| Property | Class |
|---|---|
| Component type | `'use client'` — owns all list state |
| Root | plain `<div>` (lives inside the page's results card shell) |

**Pattern notes:**
State: `query`, `match` (`'all' \| 'high' \| 'low'`), `sort` (`'score' \| 'newest' \| 'oldest'`), `page`. Filtering is client-side over the server-fetched rows: text search matches company OR title case-insensitively; High = `matchScore >= MATCH_HIGH` (60), Low = `matchScore <= MATCH_LOW` (20), both from `lib/utils.ts`. Sorting: score desc / `foundAtRaw` desc / asc via `useMemo`. Pagination: 20 rows per page; any filter change resets page to 1 (`updateFilters` helper). Passes computed summary/pages/`onPageChange` to JobsPagination and a context-aware empty message to JobsTable (no-jobs vs no-filter-matches).

### SearchControls

File: `components/find-jobs/SearchControls.tsx`
Last updated: 2026-08-21

| Property | Class |
|---|---|
| Component type | `'use client'` — controlled inputs, POSTs `/api/agent/find` |
| Card | `bg-surface border border-border rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]` |
| Row grid | `grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-5 items-end` |
| Field label | `text-xs font-semibold uppercase tracking-wider text-text-secondary` |
| Input — with icon | `w-full h-12 pl-10 pr-4 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-surface-secondary disabled:cursor-not-allowed` |
| Input — no icon | same but `px-4` instead of `pl-10` |
| Search icon | `absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-text-muted pointer-events-none` |
| Find Jobs button | `h-12 px-6 inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:bg-accent-dark transition-colors whitespace-nowrap w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed` |
| Loading spinner | `w-[18px] h-[18px] border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin` + label "Searching…" |
| Success banner | `mt-5 flex items-center gap-2.5 rounded-md bg-success-lightest px-[18px] py-3.5 text-sm text-success-dark` |
| Empty banner | same geometry but `bg-surface-secondary text-text-secondary`, no icon |
| Error banner | same geometry but `bg-error/10 border border-error/20 text-error` |
| Banner icon | `shrink-0 text-success` (sparkle SVG) |

**Pattern notes:**
Job title input starts empty and is `required`; location optional. The success banner renders ONLY after a real search response with totalFound > 0 ("Found N jobs and saved M strong matches."); zero results shows the neutral empty message; failures show the error banner. Response parsed with zod. On success calls `router.refresh()` so the server-rendered table picks up new DB rows. All banners have `role="status"` / `role="alert"`.

### JobFilters

File: `components/find-jobs/JobFilters.tsx`
Last updated: 2026-08-22

| Property | Class |
|---|---|
| Component type | `'use client'` — fully controlled by JobsBrowser |
| Toolbar | `flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5` |
| Filter input wrap | `relative w-full md:max-w-[620px]` |
| Filter input | `w-full h-[46px] pl-10 pr-4 rounded-md border border-border bg-surface text-sm …` (same focus pattern as SearchControls) |
| Select | `appearance-none h-[46px] pl-4 pr-10 rounded-md border border-border bg-surface text-sm font-medium text-text-primary cursor-pointer hover:border-border-muted transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20` |
| Chevron | `absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none` |

**Pattern notes:**
Controlled props: `{ query, match, sort, onQueryChange, onMatchChange, onSortChange }` — no internal state. Native `<select>` styled to look like the design's chevron buttons (ProfileForm select pattern). Options: All/High/Low Match; Match Score/Newest/Oldest. Exports `MatchFilter` / `SortOption` union types consumed by JobsBrowser.

### JobsTable

File: `components/find-jobs/JobsTable.tsx`
Last updated: 2026-08-21

| Property | Class |
|---|---|
| Wrapper | `overflow-x-auto` |
| Header cell | `px-3 pb-3.5 text-left text-xs font-medium uppercase tracking-wider text-text-secondary border-b border-border-light` |
| Row | `border-b border-border-light last:border-b-0 hover:bg-surface-secondary transition-colors` |
| Body cell | `px-3 py-5 text-sm text-text-primary` (salary/source/date: `text-text-secondary whitespace-nowrap`) |
| Company cell | `flex items-center gap-3`, name `text-sm font-bold` |
| Logo tile | `flex items-center justify-center w-[34px] h-[34px] rounded-lg bg-surface-muted text-text-secondary shrink-0` (building SVG) |
| Match bar track | `relative inline-block w-[130px] h-1 rounded-full bg-border-light overflow-hidden` |
| Match bar fill | `absolute left-0 top-0 h-full rounded-full` + score color, width via inline style |
| Match value | `text-sm font-bold min-w-9` |

**Pattern notes:**
Props: `{ jobs: JobListRow[], emptyMessage? }` — empty message defaults to the no-jobs copy; JobsBrowser passes the "no jobs match your filters" variant when filtering empties a non-empty list. Six columns: Company, Role, Match Score, Salary Est., Source (added 2026-08-22 — `formatPostingSource()` label, '—' when unknown; raw slug stored in `jobs.posting_source`), Date Found; empty-state `<td>` uses `colSpan={6}`. Score colors (updated 2026-08-22, user override of the old mockup ranges): ≥60 `bg-success`, ≤20 `bg-error`, else `bg-warning` via `scoreBarColor()` using `MATCH_HIGH` / `MATCH_LOW` from `lib/utils.ts` — same thresholds as the High/Low filter so bar color always agrees with filter category. Empty state renders when `jobs.length === 0`: single `<td colSpan={6}>` row, `px-3 py-12 text-center text-sm text-text-muted`. Since 2026-08-22 the component is `'use client'`: rows navigate to `/find-jobs/[id]` via `router.push` on click (`cursor-pointer` on `<tr>`) — the feature 12 row-click wiring.

### JobsPagination

File: `components/find-jobs/JobsPagination.tsx`
Last updated: 2026-08-22

| Property | Class |
|---|---|
| Container | `flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 px-3 pt-5` |
| Summary | `m-0 text-sm text-text-secondary`, numbers `font-bold text-text-primary` |
| Controls | `flex items-center gap-2` |
| Page button | `inline-flex items-center justify-center min-w-[38px] h-[38px] px-3 rounded-md border border-border bg-surface text-sm font-medium text-text-primary hover:border-border-muted transition-colors` |
| Active page button | same but `border-accent bg-accent-muted text-accent font-bold` |
| Disabled button | adds `disabled:opacity-50 disabled:cursor-not-allowed` |
| Ellipsis | `px-1 text-sm text-text-muted` |

**Pattern notes:**
Prop-driven: `{ summaryFrom, summaryTo, total, pages, activePage, onPageChange? }`. Previous/Next/page buttons call `onPageChange` when provided; Previous disabled on first page, Next disabled on last page. Rendered only by JobsBrowser (client), so handlers always wired in practice.

### Profile Page Container

File: `app/profile/page.tsx`
Last updated: 2026-07-31

| Property | Class |
|---|---|
| Container | `max-w-[1200px] mx-auto px-6 md:px-8 py-8` |
| Stack | `flex flex-col gap-8` |

**Pattern notes:**
Profile page uses `max-w-[1200px]` per its design spec — narrower than the 1440px container used on other pages. All three profile cards share the same card base.

### Profile Card (base)

Used by: ProfileCompletionCard, ResumeUpload, ProfileForm
Last updated: 2026-07-31

| Property | Class |
|---|---|
| Background | `bg-surface` |
| Border | `border border-border` |
| Radius | `rounded-2xl` |
| Padding | `p-8` |
| Shadow | `shadow-[0_4px_12px_rgba(0,0,0,0.04)]` |

**Pattern notes:**
Same surface/border/radius as existing cards but with `p-8` (32px) and the soft card shadow from the profile design spec. Existing cards elsewhere (Features, Testimonials, Login) use `p-6` and no shadow.

### CompletionIndicator

File: `components/profile/CompletionIndicator.tsx`
Last updated: 2026-07-31

| Property | Value |
|---|---|
| Type | SVG circle ring, 72x72 |
| Track | `stroke: var(--color-border)`, 6px |
| Fill | `stroke: var(--color-error)` or `var(--color-success)` via `tone` prop, `strokeLinecap: round`, rotated -90° |
| Center label | `text-lg font-semibold text-text-primary` |

**Pattern notes:**
`strokeDashoffset = circumference * (1 - value/100)`. `tone` prop (`'error' | 'success'`, default `'error'`) selects the fill color — success green when the profile is complete. Accessible via `role="progressbar"` with `aria-valuenow`.

### ProfileCompletionCard

File: `components/profile/ProfileCompletionCard.tsx`
Last updated: 2026-07-31

| Property | Class |
|---|---|
| Icon container | `w-10 h-10 rounded-lg bg-error/10` (or `bg-success-light` when complete) |
| Icon | `w-5 h-5 text-error` (or `text-success` checkmark when complete) |
| Title | `text-base font-semibold text-text-primary` |
| Description | `text-sm text-text-secondary mt-1` |
| Missing badge | `px-2.5 py-1 bg-error/10 text-error text-xs font-medium rounded-full` |
| Layout | `flex flex-col md:flex-row md:items-center gap-6 md:gap-8` |

**Pattern notes:**
Props: `{ percentage: number; missingFields: string[] }` (server-rendered, data from the profile route). Complete state shows a success checkmark/ring and hides the missing badges; incomplete state keeps the error warning treatment. Missing badges are uppercase strings (NAME, PHONE, LOCATION, JOB TITLE, EXPERIENCE LEVEL, YEARS EXPERIENCE, SKILLS, WORK EXPERIENCE, EDUCATION, JOB TITLES).

### ResumeUpload

File: `components/profile/ResumeUpload.tsx`
Last updated: 2026-08-21

| Property | Class |
|---|---|
| Component type | `'use client'` — uploads to InsForge Storage via server action on select/drop |
| Props | `{ resumePdfUrl, onUploaded, onExtracted }` |
| Upload container | `border-2 border-dashed rounded-2xl bg-surface-secondary px-6 py-10` (accent highlight while dragging: `border-accent bg-accent-muted`) |
| Upload icon circle | `w-12 h-12 rounded-full bg-accent-light` |
| Upload icon | `w-6 h-6 text-accent` |
| Helper title | `text-sm font-medium text-text-primary mt-4` |
| Helper note | `text-xs text-text-muted mt-1` |
| Select Resume button | `px-4 py-2 border border-border rounded-md bg-surface text-sm font-medium text-text-primary hover:bg-surface-secondary` |
| Upload success | `border border-success-light bg-success-lightest rounded-2xl px-6 py-5` with `text-success` check + "resume.pdf uploaded" + View + Download + Extract & Fill + Replace |
| View Resume link | `<a href="/api/resume" target="_blank">` `px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-md hover:bg-accent-dark` |
| Download Resume link | `<a href="/api/resume?download=1">` `px-4 py-2 border border-border rounded-md bg-surface text-sm font-medium text-text-primary hover:bg-surface-secondary` with download SVG (`w-4 h-4`) |
| Extract & Fill button | `px-4 py-2 border border-accent/40 rounded-md bg-accent-light text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed` |
| Extract message | `text-xs text-text-secondary mt-3` |
| Upload error | `text-sm text-error mt-4` |
| Generate button | `px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-md hover:bg-accent-dark w-full sm:w-auto mt-6` — live (feature 08); shows "Generating…" + `disabled:opacity-50 disabled:cursor-not-allowed` while pending |

**Pattern notes:**
Uploads to `resumes/{userId}/resume.pdf` via the `uploadResume` server action (`actions/resume`) — validates PDF type + 10MB, deletes the old stored file first, uploads the new file, and updates `resume_pdf_url` in the `profiles` table immediately (no longer deferred to the profile Save button). States: idle → uploading ("Uploading resume…") → success ("resume.pdf uploaded" + Download + Extract & Fill + Replace) / error. Entire dropzone is clickable (`onClick` → hidden file input). Reports the returned URL to the parent via `onUploaded`.

Since 2026-08-06 the "Generate Resume from Profile" button is live (feature 08): it POSTs `/api/resume/generate`, shows "Generating…" while pending, and on success calls `onUploaded(body.data.url)` (so the shared resume URL + View refresh without a reload) with the success message "Resume generated from your profile." rendered below the button; failures render `body.error` inline. Both messages use `text-xs text-text-secondary mt-3`, matching the extract message.

Since 2026-08-21 generation also flips the card into the success state immediately (`state: 'success'` + new `resumeOrigin` state `'uploaded' | 'generated' | null` set by both paths) — previously generating without a prior upload left the idle dropzone visible with no View/Download until reload. Success title is origin-aware: "Resume generated from your profile" vs "resume.pdf uploaded".

Since 2026-08-03 the success state also has an "Extract & Fill Profile" button (accent-light bordered variant — tertiary action between the solid accent View and the neutral Replace). It POSTs `/api/resume/extract`, shows `Extracting…` while pending, and reports the parsed profile via the `onExtracted` prop; success/failure text renders inline below the buttons (`text-xs text-text-secondary`).

View opens `GET /api/resume` in a new tab — a dynamic route handler that streams the PDF from the private `resumes` bucket via the server client (auth cookie forwarded), returning it with `Content-Disposition: inline`. Needed because the stored `resumePdfUrl` points into a private bucket and is not directly openable. 401 when unauthenticated, 404 when no file uploaded.

Download opens `GET /api/resume?download=1` — same authenticated route, but responds with `Content-Disposition: attachment` so the browser saves `resume.pdf`. Both View and Download are authenticated server-side fetches; the client never hits the public storage URL directly. Both are visible only in the success state (i.e. only when a resume already exists, uploaded or generated).

### ProfileForm

File: `components/profile/ProfileForm.tsx`
Last updated: 2026-08-03

| Property | Class |
|---|---|
| Component type | `'use client'` — controlled form, saves via `saveProfile` server action |
| Props | `{ initialValues: ProfileFormData, resumePdfUrl: string, ref?: Ref<ProfileFormHandle> }` |
| Section title | `text-base font-semibold text-text-primary` |
| Section grid | `mt-6 grid grid-cols-1 md:grid-cols-2 gap-6` |
| Divider | `border-t border-border`, sections separated with `gap-10` |
| Field label | `block text-xs font-medium uppercase tracking-wide text-text-secondary mb-1.5` |
| Input / Select | `w-full h-[42px] px-3.5 border border-border rounded-md bg-surface text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent` |
| Select chevron | `absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none` |
| Textarea | `w-full min-h-[120px] px-3.5 py-3 border border-border rounded-md resize-y` + same focus/color classes |
| Checkbox | `w-4 h-4 accent-accent rounded` |
| Skill tag | `inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-light border border-accent/30 rounded-full text-xs font-medium text-accent` |
| Tag remove X | `w-3 h-3 text-accent/70 hover:text-error` |
| Add button | `h-[38px] px-4 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-accent hover:text-accent-foreground hover:border-accent` |
| Role sub-card | `border border-border rounded-lg p-6 flex flex-col gap-6` |
| Read-only email | `bg-surface-secondary text-text-muted cursor-not-allowed` |
| Disabled input | `disabled:bg-surface-secondary disabled:text-text-muted disabled:cursor-not-allowed` |
| Save message — success | `bg-success-lightest text-success-foreground border border-success-light` |
| Save message — error | `bg-error/10 text-error border border-error/20` |
| Save button | `w-full h-12 bg-accent text-accent-foreground text-sm font-medium rounded-md hover:bg-accent-dark` |

**Pattern notes:**
Five sections (Personal Information, Professional Information, Work Experience, Education, Job Preferences) separated by `border-t` dividers inside a single form card. Full-width fields use `md:col-span-2`. TagInput helper handles tag add (Enter/Add button) and remove (X); the chip list renders BELOW the input row (chips moved to the bottom, 2026-08-01) and uses accent purple styling. Work Experience roles are sub-cards; end date uses `type="month"` and is disabled when "Currently working here" is checked; Add Role disabled at 3 roles. Email is read-only (pre-filled from auth). Selects now all have a `Select ...` placeholder so an empty stored value renders a clean empty option (not a mismatched first option). Save button calls `saveProfile(payload)` (fields + `resumePdfUrl`), shows a success/error banner, and `Saving…` while pending. Initial state is seeded from the `initialValues` prop (pre-filled from DB on return visits).

Since 2026-08-03 the component accepts an imperative handle via `ref` (React 19 ref-as-prop, no `forwardRef`). `useImperativeHandle` exposes `applyExtracted(ExtractedProfile)` — overwrites each field only when the extracted value is non-empty; new skills/jobTitles/roles are appended (roles capped at 3). This lets the resume-extract action fill the form from the parent without lifting all state.

### ProfileView

File: `components/profile/ProfileView.tsx`
Last updated: 2026-08-03

| Property | Value |
|---|---|
| Component type | `'use client'` — client wrapper for the profile page |
| Props | `{ userId: string, initialValues: ProfileFormData }` |
| State | `resumePdfUrl` — owned here, passed to `ResumeUpload` (`onUploaded`) and `ProfileForm`; `formRef` (`useRef<ProfileFormHandle>`) |
| Render | Fragment composing `<ResumeUpload>` + `<ProfileForm ref={formRef}>` |

**Pattern notes:**
Lets the two cards share the uploaded resume URL without lifting state into the server page. Renders as a fragment so both cards remain direct flex children of the page container's `gap-8` stack. Since 2026-08-03 it also holds the `ProfileForm` ref and forwards extracted profile data from `ResumeUpload` (`onExtracted`) into the form via `formRef.current.applyExtracted` — the wiring for the AI extraction feature.

### ResumePDF

File: `components/resume/ResumePDF.tsx`
Last updated: 2026-08-06

| Property | Value |
|---|---|
| Component type | Server-only `@react-pdf/renderer` template — no `'use client'`, never imported by client components |
| Props | `{ content: ResumeContent }` |
| Render | `Document > Page (A4) > View/Text`: name (22px bold), accent title line, muted contact line (`phone • location • email • linkedin • portfolio`, joined with `  •  `), Professional Summary, Skills (joined with `  ·  `), Experience (per-role company bold + accent title left, dates right-aligned, bullet rows with accent `•`), Education (degree + field, school, graduation year) |
| Font | Helvetica throughout |
| Colors | Design-palette hex used directly (design tokens don't reach the PDF renderer): text `#101828`, body `#4A5565`, muted `#6A7282`, accent `#7C5CFC` |

**Pattern notes:**
Built for feature 08. Only the supported `@react-pdf` CSS properties are used (library-docs.md list). Section separation is pure spacing — no borders/backgrounds (unsupported). Empty sections (no summary, no skills, no experience, no education) are omitted entirely; date ranges render `— Present` for current roles and omit either side when unknown. Rendered to a Buffer via `renderToBuffer()` in `app/api/resume/generate/route.tsx`, uploaded to `resumes/{userId}/resume.pdf` (upsert), never written to disk.
