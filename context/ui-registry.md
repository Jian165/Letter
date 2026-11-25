# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match the recorded patterns exactly before inventing new ones.

**Status:** implemented 2026-11-26. Entries below were derived from `context/designs/basedesing.html` and updated as each component landed.

**Music note:** background music is an approved extension beyond the prototype. `MusicPill`, `BackgroundMusic` and the drawer's music section reuse existing ghost-link/form tokens — no new visual language.

---

## How to Use

Before building any component:

1. Check if a similar component exists here.
2. If yes — match its recorded geometry, tokens and classes.
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then update this file.

After building any component — update its entry with the file path, exact classes and any deviations from the design (with reason).

---

## Components

### Root Layout

File: `app/layout.tsx` — Built 2026-11-26

| Property       | Class / Value                                                     |
| -------------- | ----------------------------------------------------------------- |
| `<html>`       | font variable classes: `${lora.variable} ${cormorant.variable} ${caveat.variable}` |
| Body font      | `font-body` (Lora)                                                |
| Body background| pre-dawn gradient via named CSS class in `globals.css`            |
| Overflow       | `overflow-hidden`, `h-dvh`, `min-h-dvh`, `flex` centered          |

**Pattern notes:** Server component. Metadata title "Morning Dedication Letter". Imports `globals.css`. No `"use client"`.

### Page

File: `app/page.tsx` — Built 2026-11-26

| Property | Class / Value                         |
| -------- | ------------------------------------- |
| Render   | `<LetterExperience />` only           |

**Pattern notes:** Thin server component; no logic, no data fetching, no client directive.

### App Icon

File: `app/icon.svg` — Built 2026-11-26

| Property | Value |
|---|---|
| Format | SVG favicon auto-wired by Next.js App Router |
| Mark | irregular terracotta wax seal with cream `JM` monogram |

**Pattern notes:** Static SVG; no client component and no manual `metadata.icons` entry needed.

### LetterExperience

File: `components/letter/LetterExperience.tsx` — Built 2026-11-26

| Property | Value |
|---|---|
| Component type | `'use client'` — owns phase, letter state, music state, hash decode, timers, sealed mode |
| Phase type | `'closed' \| 'opening' \| 'open' \| 'closing'` |
| Render | `<SunriseScene />`, `<MotesCanvas ref={...} />`, `<BackgroundMusic />`, `<main class="stage">` with `<OrigamiEnvelope />`, hint, `<LetterActions />`, conditional `<PersonalizationSheet />`, `<ToastPill />` |
| Body class | toggles `letter-unfolded` on `<body>` |

**Pattern notes:** Only component that mutates letter state, phase, or music state. All timers tracked in a ref and cleared on transition/unmount. Children receive props + callbacks. No imperative text DOM writes. Music start/stop is called from the same unfold/fold handlers. Sealed mode skips hash decode and does not render the drawer.

### Stage

File: `components/letter/LetterExperience.tsx` (root `<main>`) — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Element | `main.stage` (named CSS class in `globals.css`) |
| Width / height | `width: 100%; max-width: 760px; height: 100dvh` |
| Layout | `flex flex-col items-center justify-center`, `perspective: 1800px` |
| Padding | `max(1rem, env(safe-area-inset-top)) clamp(1rem, 4vw, 2rem) max(1rem, env(safe-area-inset-bottom))` |
| Z-index | `10` |

### SunriseScene

File: `components/letter/SunriseScene.tsx` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Render | four `aria-hidden` divs: `.sunrise-sky-layer`, `.horizon-bloom`, `.predawn-stars`, `.sunrise-orb` |
| Z-index | sky 0, bloom/stars/orb 1 |
| Sky background | linear-gradient through `sunrise-top / upper / mid / bottom` tokens |
| Sky reveal | feathered mask + opacity 0 → 1 and translateY(12% → 0) on `body.letter-unfolded`, `2.4s var(--ease-out-soft)` |
| Bloom | `height: 55vh`, radial ellipse at `50% 100%`, opacity 0 → 1 + translateY(35% → 0) |
| Stars | eight radial-gradient dots, opacity `0.78` → `0` on unfold |
| Orb | `width: clamp(320px, 88vw, 680px)`, `bottom: -24vw`, blur 20px, scale `0.75 → 1.16`, opacity `0.14 → 1` |

**Pattern notes:** Pure CSS reaction to `body.letter-unfolded`; no props, no state. Short-viewport overrides in `globals.css` (`bottom: -34vw`, scale `1.08`, translateY `-32%`).

### MotesCanvas

File: `components/letter/MotesCanvas.tsx` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Element | `<canvas id="motes-canvas" aria-hidden="true">` |
| Position | `fixed inset-0 w-full h-full pointer-events-none`, z-index 2 |
| Particle count | `min(24, floor(innerWidth / 24))` ambient + 16 burst |
| Colors | computed from `--color-star`, `--color-sunrise-mid`, and `--color-terracotta` on mount |
| Imperative handle | `{ burst: () => void }` via `useImperativeHandle` (React 19 ref-as-prop) |

**Pattern notes:** One `requestAnimationFrame` loop, cancelled on unmount; resize listener removed on unmount. Static/skipped under `prefers-reduced-motion`.

### BackgroundMusic

File: `components/letter/BackgroundMusic.tsx` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Element | single `<audio loop preload="none">`, no visible UI |
| Props | imperative `musicRef` with `start/stop/preview`, plus `volume`, `muted`, `onPlayStateChange`, `onError` |
| Source | `/audio/${trackId}.mp3` from `MUSIC_TRACKS` allowlist; no `src` when `trackId === "none"` |
| Start | `play()` called directly in the parent unfold handler; promise handled, rejection silent |
| Fade | volume ramped 0 → `volume` over `var(--duration-music-fade)` (~0.6 s) using a tracked `requestAnimationFrame` |
| Stop | fade to 0 then `pause()` on fold-back/unmount; cancel pending frame |
| Failure | `error` event → one toast "Music unavailable — playing without sound"; no visible error UI |

**Pattern notes:** `'use client'`. No third-party media player. Volume/mute come from props; this component never writes state. Audio files are local CC BY MP3s by Kevin MacLeod in `public/audio/`, credited in the personalization drawer.

### OrigamiEnvelope

File: `components/letter/OrigamiEnvelope.tsx` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Root | `article.origami-letter`, `role="button"`, `tabindex="0"`, `aria-label="Tap to unfold letter"` while closed |
| Background | `bg-paper-cream`, radius `10px 12px 9px 11px` closed / `6px 8px 7px 6px` open |
| Closed size | `clamp(290px, 78vw, 480px) × clamp(190px, 50vw, 310px)`, `max-height: calc(100dvh - 115px)` |
| Open size | `min(88vw, 660px) × min(78dvh, 760px)`, `max-height: calc(100dvh - 96px)` |
| Transform style | `transform-style: preserve-3d` |
| Shadow | closed/open definitions in `ui-tokens.md` → named CSS classes |
| Hover (closed only) | `translateY(-4px) rotate(-0.5deg)`; active `translateY(0) scale(0.985)` |
| Paper grain | absolute inset-0, `opacity: 0.52`, `mix-blend-mode: multiply`, SVG noise data-URI, z-index inherited |
| Creases | two 1px horizontal rules at 31% / bottom 29%, opacity 0 → 1 when open |
| Flaps layer | absolute inset-0, z-index 6, `pointer-events: none`, hidden (opacity + visibility) when open |
| Flap shapes | `.fold-left` polygon `0 0, 52% 50%, 0 100%`; `.fold-right` `100% 0, 48% 50%, 100% 100%`; `.fold-bottom` `0 100%, 50% 44%, 100% 100%`; `.fold-top` height 58%, `0 0, 100% 0, 50% 100%` |
| Flap transforms | open: top `rotateX(176deg)`, bottom `rotateX(-172deg)`, sides `rotateY(±170deg)`; close reverses stagger |
| Closed label | `.closed-cover-label` absolute bottom 11%, width 84%, centered; "for" in `text-ink-quiet`, name `font-handwriting text-ink-sepia` `clamp(1.7rem, 4.2vw, 2.4rem)` |
| Wax seal | `clamp(60px, 11vw, 80px)`, irregular radius, terracotta radial gradient, handwritten `JM` monogram in `text-seal-foreground`, z-index 10 |
| Seal pulse | `.seal-glow` ring, `warmPulse 2.6s infinite ease-out`; hidden when opening/open/closing |

**Pattern notes:** Phase classes drive all visual states: `is-opening`, `is-open`, `is-closing`. Exactly one click/keydown listener pair (the reference design's duplicated block is a defect). Ink content lives in `LetterPaper` as a child so it is clipped by the expanding sheet.

### LetterPaper

File: `components/letter/LetterPaper.tsx` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Root | `.letter-ink-content` absolute-ish inner surface, z-index 4, `height: 100%`, `overflow-y: auto`, `overscroll-behavior: contain` |
| Padding | `clamp(24px, 4.5vw, 48px) clamp(24px, 5vw, 56px)` |
| Reveal | opacity 0 + translateY(8px) → 1/0 when `.is-open`, `0.55s ease 0.22s` |
| Inner measure | `.letter-ink-inner` `max-width: 54ch`, centered |
| Header | date `text-ink-quiet text-xs sm:text-sm italic`, sunrise SVG `text-terracotta/75`, `mb-5` |
| Salutation | `font-handwriting text-ink-sepia`, `clamp(1.75rem, 3.6vw, 2.5rem)`, `mb-4` |
| Polaroid | `.polaroid-keepsake` width `clamp(195px, 42vw, 270px)`, `rotate(-1.5deg)`, `bg-paper-white`, tape strip above, 4:3 `object-cover object-top`, caption `font-handwriting` |
| Body | `font-editorial text-ink-sepia/90`, `clamp(1.06rem, 2.1vw, 1.28rem)`, `line-height: 1.75`, `whitespace-pre-line` |
| Signature | `mt-8 pt-4 border-t border-ink-hairline`, "Love Always," in `text-ink-quiet`, name `font-handwriting text-terracotta` `clamp(1.6rem, 3.2vw, 2.2rem)` |

**Pattern notes:** All content from props. Newlines preserved. Salutation is `Dear {recipient},`; default closing is `Love Always,` above the sender signature. Polaroid and caption hide together when no photo or image error. Date is formatted during render from `toLocaleDateString`; photo error state is keyed by active source instead of reset in an effect.

### TapHint

File: `components/letter/LetterExperience.tsx` (inline `<p>`) — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Element | `<p id="tap-hint">` `mt-5 text-xs sm:text-sm italic tracking-wider text-ink-hint` |
| Text | "Tap the seal to unfold" |
| Behavior | opacity 0 on unfold (inline style or class), restored on fold-back |

### LetterActions

File: `components/letter/LetterActions.tsx` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Root | `<nav aria-label="Letter actions">` `.subtle-footer-actions`, `.visible` when open |
| Layout | `flex items-center justify-center gap-3`, `margin-top: clamp(0.75rem, 2vh, 1.15rem)` |
| Reveal | opacity 0 + translateY(6px) → 1/0, `0.5s ease 0.35s` |
| Ghost link | `.ghost-link` — `font-body`, `clamp(0.82rem, 1.6vw, 0.92rem)`, `text-ink-soft`, translucent paper background + backdrop blur, `border border-ink-edge`, `min-height: 42px`, pill radius, inline-flex gap `0.45rem` |
| Hover/active | `text-ink-sepia`, background `rgba(250,243,232,0.92)`, `scale(0.98)` |
| Divider | bullet in `text-ink-sepia/20 text-xs` |
| Labels | "Fold back" / "Personalize" or "Reply / Write one" in shared-recipient mode; sealed mode omits Personalize |
| Music slot | renders a bullet + `<MusicPill />` after the edit action only when `trackId !== "none"` |

**Pattern notes:** Icons are small inline SVGs (envelope, pencil) from the reference; music uses a new small speaker SVG in the same 14–16px size range. All buttons `type="button"`; hidden/non-interactive until open. Sealed mode adds a centered `.sealed-music-credit` line below the actions when the letter is open and a track is selected.

### MusicPill

File: `components/letter/MusicPill.tsx` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Element | `<button type="button">` using the exact `.ghost-link` class from `LetterActions` |
| Label | "Play music" / "Pause music" with inline speaker SVG and sound-wave variant |
| Props | `playing: boolean`, `onToggle: () => void` |
| States | `aria-pressed={playing}`, `aria-label={playing ? "Pause music" : "Play music"}` |
| Visibility | only rendered when `trackId !== "none"` and the letter is open |

**Pattern notes:** No new colors or geometry. Reuses ghost-link hover/active behavior. Toggling calls the parent, never touches the `<audio>` element directly.

### PersonalizationSheet

File: `components/letter/PersonalizationSheet.tsx` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Backdrop | `.editor-backdrop` fixed inset-0 z-50, `background: rgba(61,40,30,0.35)`, `backdrop-filter: blur(5px)`, flex end-aligned (center ≥640px), opacity/pointer-events toggled by `.active` |
| Sheet | `.editor-sheet` width 100%, `max-width: 520px`, `max-height: 90dvh`, `overflow-y: auto`, `bg-paper-cream`, top corners 22px (all corners ≥640px), `padding: 1.5rem` (≥640px `1.85rem 2rem`), border `1px solid var(--color-paper-edge)` |
| Entrance | translateY(100%) → 0 on phone; translateY(18px) scale(.97) → 0/1 on desktop; `0.38s var(--ease-out-soft)` |
| Header | `flex items-center justify-between pb-3 border-b border-ink-hairline`; heading `font-handwriting text-3xl text-ink-sepia`; subtitle `text-xs text-ink-soft`; close button `p-2 rounded-full text-ink-soft hover:text-ink-sepia hover:bg-ink-sepia/5` |
| Form | `mt-4 space-y-4` |
| Labels | `block text-xs italic text-ink-soft mb-1` |
| Input / textarea | `w-full px-3.5 py-2.5 rounded-xl border border-ink-edge bg-white/75 text-ink-sepia text-sm focus:outline-none focus:border-terracotta`; textarea `leading-relaxed resize-none`, 8 rows |
| Counter | `text-xs text-ink-faint`, "0 / 2400" |
| Compact controls | photo URL row: flex gap-2, `rounded-xl border border-ink-edge bg-white/75`, Upload/Clear secondary buttons with same border/bg |
| Music section | `border-t border-ink-hairline pt-4`; label "Background music"; segmented buttons Dawn / Rain / Ember / None using `.music-option`; selected track shows a small CC BY credit line; volume slider `accent-terracotta`; mute checkbox with `text-ink-soft` label |
| Music option | `.music-option` — `rounded-xl border border-ink-edge bg-white/75 px-3 py-2 text-sm text-ink-soft`; selected: `border-terracotta bg-terracotta/10 text-terracotta`; hover `border-terracotta/50` |
| Submit | `flex-1 py-3 px-4 rounded-xl bg-ink-button hover:bg-ink-button-hover text-paper-cream text-sm font-medium` |
| Copy link | `py-3 px-4 rounded-xl bg-terracotta hover:bg-terracotta-hover text-paper-cream text-sm font-medium` + chain SVG |
| Footer row | `pt-2 flex flex-col sm:flex-row gap-2.5` |

**Pattern notes:** `'use client'`. Local draft state only; commits on submit/copy. `maxLength` on all fields. Backdrop click and close button dismiss without commit. In shared-recipient mode fields start blank and label reads "Reply / Write one" on the trigger. Selecting a music option previews immediately via a callback to the parent (click is a user gesture); dismissing without committing restores the previous track.

### SealedMusicCredit

File: `components/letter/LetterExperience.tsx` + `app/globals.css` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Element | `<p className="sealed-music-credit">` below `.subtle-footer-actions` in sealed mode |
| Visibility | rendered only when sealed + phase `open` + selected track has credit |
| Text — primary | `color: var(--color-ink-faint)`, `font-size: 0.7rem`, `line-height: 1.5` |
| Text — link | same ink-faint color, `text-decoration: underline`, `text-decoration-color: var(--color-ink-edge)`, `text-underline-offset: 2px` |
| Hover | link color changes to `var(--color-terracotta)` |
| Spacing | `text-align: center`, `max-width: min(90vw, 34rem)`; no border, background, radius, or shadow |
| Copy | `Music: [track title] by [artist] · CC BY 4.0`; both links open in a new tab with `rel="noreferrer"` |

**Pattern notes:** Keeps CC BY attribution visible in sealed builds without exposing the personalization drawer. Uses existing ink/paper tokens and terracotta hover only; no new palette values.

### ToastPill

File: `components/letter/ToastPill.tsx` — Built 2026-11-26

| Property | Class / Value |
|---|---|
| Element | `<div id="toast" role="status" aria-live="polite">` `.toast-pill` |
| Position | `fixed bottom: max(1.4rem, env(safe-area-inset-bottom)) left-1/2 z-60`, `translateX(-50%) translateY(150%)` → `translateY(0)` with `.show` |
| Colors | `bg-ink-button text-paper-cream` |
| Shape | pill, `padding: 0.65rem 1.25rem`, `font-size: 0.84rem`, `white-space: nowrap` |
| Shadow | `0 10px 25px rgba(61,40,30,0.28)` |
| Timing | show ~2.8s then hide |

**Pattern notes:** Single toast element reused for link copied, local photo attached, photo removed, preview-only caveat, and music load failure.

### Implementation deviations

- `LetterExperience` reads the hash in a mount effect and applies decoded state in a zero-delay timer to satisfy React 19's `set-state-in-effect` lint rule.
- `PersonalizationSheet` seeds its draft in a zero-delay timer when opened, for the same lint rule; the parent's `localPreview` is passed back in so preview-only uploads survive reopening.
- `Link copied to clipboard` toast text is seeded in state but hidden until shown; only one toast element exists.
- `next/image` is disabled in ESLint because arbitrary user photo URLs and local data URLs must render with a simple `<img>` and hide on error.
- `RootLayout` uses `{ children: ReactNode }` instead of `LayoutProps<"/">` because generated route types are absent before the first dev/build run.

---

## Design Tokens

Defined in `app/globals.css` via `@theme` — full list in `ui-tokens.md`. Summary:

- Ink: `ink-sepia`, `ink-soft`, `ink-faint`, `ink-quiet`, `ink-hairline`, `ink-edge`, `ink-hint`
- Paper: `paper-cream`, `paper-white`, `paper-fold-light/mid/deep`, `paper-edge`
- Accents: `terracotta`, `terracotta-deep/mid/bright/hover`, `amber-gold`, `ink-button`
- Sky: `predawn-top/mid/bottom`, `sunrise-top/upper/mid/bottom`
- Fonts: `font-body`, `font-editorial`, `font-handwriting`
- Motion: `ease-out-soft`, `ease-fold`, `ease-close`, `duration-flap/sheet/sky/toast/music-fade`

No `tailwind.config.ts` for colors. No hardcoded hex in components. Music UI adds no new colors.
