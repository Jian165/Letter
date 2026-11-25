# Build Plan

## Core Principle

Build the full visible experience first, using the reference design's default letter as mock content. Verify the closed envelope, sunrise scene, unfolded letter and personalization drawer visually before wiring any state machine, audio, or share-link logic. Then connect behavior step by step. Every feature must be visible and testable before moving on. No invisible backend phases — there is no backend.

Background music is an approved extension beyond the reference prototype. It reuses the existing ghost-link and drawer patterns — no new visual language, no new dependencies.

---

## Phase 1 — Foundation

### 01 Scaffold, tokens and fonts

Build the Next.js 16 + TypeScript + Tailwind v4 shell.

**UI:**

- `app/layout.tsx` imports `Lora`, `Cormorant_Garamond`, `Caveat` via `next/font/google` and applies CSS variables to `<html>`.
- `app/globals.css` declares every design color/font/radius/motion token with `@theme` (see `ui-tokens.md`) and the ambient-layer CSS from the reference design (sky, bloom, stars, orb, paper grain, creases, flaps, seal, drawer, toast).
- `app/page.tsx` renders a placeholder stage with the default closed envelope markup so the foundation can be seen immediately.

**Logic:**

- None yet. No transitions, no handlers.

---

### 02 Sunrise scene

Build the ambient background as static layers.

**UI:**

- Pre-dawn gradient body background (`#12172E → #242142 → #4A2E4B`).
- Sunrise sky layer clipped away by default; will reveal bottom-up on `body.letter-unfolded`.
- Horizon bloom, eight faint stars, and a blurred sun orb below the bottom edge.
- `#motes-canvas` fixed, transparent, pointer-events-none.

**Logic:**

- None yet. Scene reacts to the body class only; that class is added in feature 04.

---

### 03 Closed envelope

Build the folded paper object and its invitation.

**UI:**

- Paper grain overlay, crease lines (hidden until open).
- Four origami flaps with the exact clip-paths, gradients, drop-shadows and transform origins from the design.
- Handwritten `for / {recipient}` label above the seal.
- Pulsing terracotta wax seal with sunrise SVG emblem.
- "Tap the seal to unfold" hint below the envelope.
- Hover lift / active press feedback.

**Logic:**

- None yet — clickable appearance only.

---

## Phase 2 — Interaction

### 04 Unfold / fold-back choreography + sound

**UI:**

- Envelope expands from `clamp(290px, 78vw, 480px) × clamp(190px, 50vw, 310px)` to `min(88vw, 660px) × min(78dvh, 760px)`.
- Flaps rotate open, seal shrinks and fades, sunrise sky reveals, stars fade, orb rises.
- Creases and ink appear after the flaps clear (~480 ms); footer ghost links fade in.
- Fold back reverses all of it: ink first, sheet collapse, flaps close in reverse order, seal returns, hint returns (~960 ms).

**Logic:**

- `LetterExperience` state machine (`closed | opening | open | closing`) with cleared timers.
- Click / Enter / Space on the envelope; `aria-expanded` and `role` updated correctly.
- Web Audio paper rustle (filtered noise burst) on both directions; F-major-9 chime on unfold only; silent graceful skip when blocked. This is SFX only — music arrives in feature 09.
- Mote burst from centre on unfold.

**PostHog events:** none — analytics are out of scope.

---

### 05 Letter paper + Polaroid

**UI:**

- Date + sunrise flourish row.
- Handwritten salutation, editorial body with preserved line breaks, handwritten terracotta signature.
- Taped Polaroid with 4:3 image and handwritten caption; hidden entirely when no photo.
- Scrollable inner paper area with 54ch measure and touch scrolling.
- Signature divider rule.

**Logic:**

- All text derived from letter state via props.
- Default letter from `lib/letter-state.ts` renders before any personalization.
- Broken image URLs hide the Polaroid instead of showing a broken image icon.

---

### 06 Footer ghost actions

**UI:**

- "Fold back" and "Personalize" (label becomes "Reply / Write one" in recipient mode) as pill ghost links with icons, centered below the letter, 42px min height.
- Leave a centered slot for the optional music pill added in feature 09.
- Hidden and non-interactive until the letter is open.

**Logic:**

- Fold back → `foldLetterBack()`.
- Personalize → open the drawer, seeded from state (or blanked in recipient mode).

---

## Phase 3 — Personalization & Sharing

### 07 Personalization drawer + form

**UI:**

- Bottom sheet on phones, centered 520px dialog from 640px; paper-cream surface, 22px corners, backdrop blur.
- Header: handwritten "Write a Sunrise Note" + "Creates a private link containing your letter." + close button.
- Fields: To (max 40), Your Message (max 2400, live `N / 2400` counter), From (max 40), photo URL with Upload and Clear buttons, Polaroid Caption (max 45).
- Footer: "Seal & Preview" (ink) + "Copy Share Link" (terracotta).
- Music section is added in feature 09, not here.

**Logic:**

- Local draft state in the sheet; commits only on submit/copy.
- Local photo file → `FileReader` data URL preview, clears the URL field; URL input clears the local preview.
- Clear button resets photo URL, file input, and preview.
- Backdrop click and close button dismiss without committing.
- Toast shown for local attach, photo clear, and preview-only caveat.

---

### 08 Share links and toasts

**Logic:**

- `encodeStateToHash` / `decodeStateFromHash` in `lib/share-link.ts`: UTF-8-safe base64, compact keys (`r/m/s/p/c/t`), defensive parse, length clamps, explicit-empty photo handling.
- `t` is omitted when the music track is `"none"`; an unknown `t` decodes to `"none"`.
- On mount: decode hash → letter state + recipient mode + music track → render.
- "Seal & Preview": commit state → write hash → re-render → fold back → toast.
- "Copy Share Link": commit state → write hash → copy current URL via hidden textarea + `navigator.clipboard` fallback → toast; warn when a local photo preview cannot be shared.
- Toast pill: single element, show/hide with a ~2.8 s timer.

---

### 09 Background music presets

**UI:**

- Drawer music section: Dawn / Rain / Ember / None segmented buttons, a volume slider and a mute toggle; selecting a track previews it immediately from that click gesture.
- `MusicPill` ghost pill beside the ghost links, visible only when a track other than "None" is selected; toggles play/pause with an inline speaker SVG.
- No new colors — reuse ghost-link, form-control and accent tokens.
- Uses local CC BY MP3s at `public/audio/dawn.mp3`, `rain.mp3`, `ember.mp3`. Handle missing files gracefully if they are ever removed.

**Logic:**

- `lib/music-tracks.ts`: allowlist of ids, display labels, and `/audio/${id}.mp3` src map; default `"none"`.
- `BackgroundMusic.tsx`: one `<audio loop preload="none">`; `play()` called directly inside the unfold gesture handler; volume faded over ~0.6 s with a tracked `requestAnimationFrame`; pause and fade out on fold-back; cleanup on unmount.
- `musicTrackId` lives in `LetterExperience` state; volume/mute are local session state and are never encoded.
- `play()` rejection stays silent; a failed MP3 load shows one toast ("Music unavailable — playing without sound") and leaves the letter intact.

**Verification:**

- Fresh visit is silent; choose a track → hash contains `t` → fresh tab → tap seal → music starts; fold back → music stops; "None" → no music.
- Mobile tap starts playback; no autoplay before a gesture; no errors in console from blocked audio.

---

## Phase 4 — Polish

### 10 Responsive, accessibility and verification

**UI:**

- Short-viewport (≤640px height) adjustments: smaller envelope, full-height open sheet, tighter ghost links.
- Safe-area insets for notches and home bars.
- `prefers-reduced-motion` shortens/cuts transitions and stops mote animation.
- No horizontal overflow at 320px, 390px, 768px, or 1440px.

**Logic:**

- Focus order and keyboard operation verified: unfold, fold back, open/close drawer, toggle music, copy link.
- All browser API failures degrade without unhandled errors.
- Final cleanup: no duplicate listeners (unlike the reference prototype), no floating timers.

**Verification:**

- `npx tsc --noEmit`, `npm run lint`, `npm run build` clean.
- Manual browser pass: closed → unfold → personalize (including music) → copy → fresh tab open → fold back, at mobile and desktop widths.

---

## Phase 5 — Sealed GitHub deployment

### 11 Sealed static build and Pages workflow

**UI:**

- Sealed build renders the fixed letter and music from `lib/sealed-content.ts`.
- `LetterActions` shows only Fold back and the optional music pill; Personalize is absent and the drawer is not rendered.
- A session-only volume slider appears below the actions when a track is selected; the CC BY credit stays visible below it.
- URL hashes are cleared and ignored in sealed mode.

**Logic:**

- `NEXT_PUBLIC_SEALED=true` selects sealed mode; `npm run build:sealed` produces the static export.
- `next.config.ts` sets `output: "export"` and Pages `basePath`; `withBasePath()` prefixes root-relative audio paths.
- `.github/workflows/deploy.yml` runs `npm ci`, builds sealed, uploads `out/`, and deploys to Pages from `main`.

**Verification:**

- Sealed local build has no Personalize or Copy controls and ignores `#card=` links.
- Audio and icon URLs resolve under the project-site base path.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build:sealed` pass.

---

## Feature Count

| Phase                     | Features |
| ------------------------- | -------- |
| Phase 1 — Foundation      | 3        |
| Phase 2 — Interaction     | 3        |
| Phase 3 — Personalization | 3        |
| Phase 4 — Polish          | 1        |
| Phase 5 — Deployment      | 1        |
| **Total**                 | **11**   |
