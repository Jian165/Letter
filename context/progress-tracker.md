# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 6 — Sealed GitHub deployment complete
**Last completed:** 12 Sealed static GitHub Pages deployment
**Next:** None — all planned features implemented

---

## Progress

### Phase 1 — Foundation

- [x] 01 Scaffold, tokens and fonts
- [x] 02 Sunrise scene
- [x] 03 Closed envelope

### Phase 2 — Interaction

- [x] 04 Unfold / fold-back choreography + sound
- [x] 05 Letter paper + Polaroid
- [x] 06 Footer ghost actions

### Phase 3 — Personalization & Sharing

- [x] 07 Personalization drawer + form
- [x] 08 Share links and toasts
- [x] 09 Background music presets

### Phase 4 — Polish

- [x] 10 Responsive, accessibility and verification

### Phase 5 — Follow-up polish

- [x] 11 Sourced music, seamless sunrise, JM identity and site icon

### Phase 6 — Deployment

- [x] 12 Sealed static GitHub Pages deployment

---

## Decisions Made During Setup

### Project context creation (2026-11-26)

- The nine context files were recreated from `context-sample/` (a JobPilot context pack) and rewritten for this project: a single-page "Morning Dedication Letter" experience based on `context/designs/basedesing.html`.
- Stack retained from the sample where it still applies: Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, `@/` imports, named component exports, one component per file, no comments except non-obvious "why".
- Dropped from the sample: InsForge (auth/DB/storage), JobsPipe, Browserbase/Stagehand, OpenCode Zen, PostHog, PDF generation, multiple routes, server actions. None are needed for a self-contained letter link.
- The design's hash-based sharing (`#card=...`) is the only persistence mechanism. Local photo uploads are preview-only; only photo URLs can be shared.
- The reference HTML has duplicated event listeners (second `keydown` handler references undefined `isUnfolded`) and raw hex / Tailwind CDN arbitrary values. Do not copy those defects: listeners registered once, colors converted to `@theme` tokens.
- No app code exists yet — only `context/` (docs + `designs/basedesing.html`) and `.agents/skills/`. No `AGENTS.md`, `package.json`, or lockfile at setup time.

### Music extension decision (2026-11-26)

- Animation approach confirmed: native CSS transitions/keyframes only. No Three.js, GSAP, or Framer Motion/Motion — the design is 2D paper craft already expressible in CSS, and this keeps the bundle light on phones.
- Background music is an extension beyond the reference prototype; it reuses the existing ghost-link and drawer patterns.
- Three local presets plus "None": `public/audio/dawn.mp3`, `rain.mp3`, `ember.mp3`. They are CC BY MP3s by Kevin MacLeod with attribution in the personalization drawer.
- The chosen track id is shared via optional hash key `t` (`dawn | rain | ember | none`); `"none"` is omitted from the hash and is the default for new visitors. Invalid ids decode to `"none"`.
- Volume and mute are local session preferences only — never encoded in the hash.
- Music starts on the unfold tap (satisfies mobile autoplay rules) and fades out on fold-back. A "Music" play/pause pill appears beside the ghost links only when a track is selected.
- Music uses one `<audio>` element; Web Audio remains reserved for paper rustle/chime SFX. No audio uploads, external URLs, or media libraries.
- Build plan renumbered: music is feature 09; responsive/a11y polish is now 10 (was 09). Total features: 10.

### Follow-up decisions (2026-11-26)

- Sunrise uses a feathered mask/opacity/translate crossfade instead of a hard `clip-path` reveal; `--duration-sky` is `2.4s`.
- Default letter content is the user's KC wedding dedication, with `Dear KC,`, the custom body, `Love Always,`, and `Jomar`.
- Message limit raised from `450` to `2400`; default photo and caption are empty.
- Wax seal and site icon use the `JM` monogram so the letter reads as personally sent by Jomar.

### Sealed deployment decisions (2026-11-26)

- One GitHub repo: editable work stays on `dev`; sealed production deploys from `main`.
- The sealed site uses `lib/sealed-content.ts` as its build-time source of truth and ignores `#card=` hashes.
- Sealed visitors get the fixed letter and one fixed music track; Personalize and Copy controls are not rendered. Fold back and music play/pause remain available.
- GitHub Pages uses a project-site URL (`https://<username>.github.io/<repo>/`) with `basePath` supplied by `actions/configure-pages`.
- `withBasePath()` prefixes root-relative audio paths for Pages; full `https://` URLs stay unchanged.
- The earlier owner-PIN idea is not part of the sealed deployment; immutability comes from the static build, not client-side storage.

---

## Notes

- 2026-11-26: Full app implemented on Next.js 16.4.6 / React 19.3.0 / Tailwind 4.3.3. `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass.
- 2026-11-26: Hash share payload uses `r/m/s/p/c/t`; `p` is always present, `c`/`t` optional, and volume/mute stay local.
- 2026-11-26: Background music uses one `<audio loop preload="none">` with allowlisted sources in `public/audio/`; CC BY MP3s are now present, and a failed load still shows one toast.
- 2026-11-26: `next/image` rule disabled in `eslint.config.mjs` because photos can be arbitrary user URLs or preview-only data URLs and must degrade on error.
- 2026-11-26: Hash decode and drawer seeding are applied from effects in a zero-delay timer to satisfy React 19's `set-state-in-effect` lint rule while keeping browser reads in effects.
- 2026-11-26: `LayoutProps<"/">` was unavailable before `.next/dev/types` generation, so `RootLayout` uses an explicit `{ children: ReactNode }` type.
- 2026-11-26: Music presets are local MP3s sourced from Incompetech under CC BY 4.0; attribution is shown in the drawer for the selected track.
- 2026-11-26: The sunrise crossfade, JM seal, `app/icon.svg`, and the new default letter are implemented; typecheck, lint, build, and production smoke test pass.
- 2026-11-26: Sealed static export uses `output: "export"` plus `build:sealed`; `.github/workflows/deploy.yml` deploys `out/` from `main` to GitHub Pages with project base path.
- 2026-11-26: Target repo is `Jian165/Letter`; expected Pages URL is `https://jian165.github.io/Letter/`. Sealed mode shows a visible CC BY credit line because the drawer is hidden.
