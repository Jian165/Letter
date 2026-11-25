# UI Rules

Concise rules for building the Morning Dedication Letter UI. `context/designs/basedesing.html` is the source of truth for visual decisions — these rules cover the patterns and constraints that keep the implementation consistent without repeating every design value.

---

## Fonts

Three roles, loaded with `next/font/google` in the root layout:

```
Lora                → body / UI text (--font-body)
Cormorant Garamond  → letter body copy (--font-editorial)
Caveat              → salutation, signature, recipient name, drawer heading (--font-handwriting)
```

- Apply all three CSS variables to `<html>`; map them into `@theme` so `font-body`, `font-editorial`, `font-handwriting` utilities exist.
- Never use system fonts as the primary font for any of these roles.
- Never load fonts with `<link>` tags (the standalone reference HTML does; the app must not).

---

## Layout

- Full-viewport, centered stage: `max-width: 760px`, `height: 100dvh`, `perspective: 1800px`.
- No navbar, header, footer, sidebar, or page chrome.
- Body is `overflow: hidden`, flex-centered; only the letter's inner content scrolls.
- Safe-area insets (`env(safe-area-inset-*)`) on stage and toast padding.
- Short viewports (≤640px height) use the design's compact geometry — never let the envelope or open sheet overflow.
- No horizontal scrolling at any width from 320px upward.

---

## Color

- Every color comes from `@theme` tokens in `globals.css` (see `ui-tokens.md`).
- Never hardcode hex values in components; never use raw Tailwind palette classes.
- The reference HTML's arbitrary classes (`text-[#3D281E]/55`) must become token classes (`text-ink-quiet`) or CSS variables.
- SVG presentation attributes cannot resolve CSS variables — set colors with `style={{ stroke: "var(--color-...)" }}` or in named CSS rules.
- The envelope and letter paper are always paper-cream; color lives in the sky, seals, and accents, never on the paper surface.
- Crease hairlines belong to the scrolling letter surface so they move with the text; the paper grain overlay stays on the envelope.

---

## Motion

- The scene is driven by one body class: `letter-unfolded`. Add it on unfold, remove it on fold; do not duplicate scene state in props.
- Flap order: open = top/bottom/sides, close = sides → bottom → top. Never reverse only some flaps.
- Sky dissolves bottom-up on unfold as a feathered opacity/translate crossfade and retracts on fold. No visible clip edge or instant popping.
- Keep the design's durations and easings from `ui-tokens.md`; do not "speed things up" casually.
- All timers and frame loops (including music fades) must be cleared on the next transition and on unmount.
- Respect `prefers-reduced-motion`: shorten/cut transitions and stop the mote loop.
- Animate only `transform`, `opacity`, `width`, `height`, and `box-shadow` as the design does — no layout thrashing from JS.
- No Three.js, GSAP, Framer Motion/Motion, or other animation libraries — native CSS transitions are the approved approach for phone-friendly animation.

---

## Envelope & Letter

- Closed: handwritten recipient label + wax seal. Open: full letter. Never show both label and letter text at once.
- Flaps are decorative (`aria-hidden="true"`) and must be invisible and non-interactive when open so they never overlap text.
- Creases appear only after the sheet is open.
- The letter body preserves newlines (`whitespace-pre-line`); text is plain, not HTML.
- The Polaroid is hidden entirely when there is no photo or the image fails to load; the caption hides with it.
- The signature divider and "Love always," line are part of the letter, not the envelope.

---

## Controls

- Closed envelope: `role="button"`, `tabindex="0"`, `aria-label="Tap to unfold letter"`. On open, remove `role` and set `aria-expanded="true"`; restore on close.
- Enter and Space on the closed envelope trigger unfold (prevent default for Space).
- Ghost links: pill-shaped, ≥42px tall (36px on short viewports), muted ink, visible only while open.
- Music pill uses the same ghost-link pattern; `aria-pressed` reflects play state, and the label toggles between "Play music" / "Pause music".
- Drawer: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, a close button with `aria-label="Close"`, and backdrop-click dismissal.
- Inputs: token border, terracotta focus border, visible labels, character limits via `maxLength` plus a live counter for the message.
- Music track buttons are real `<button type="button">` elements with an accessible selected state (`aria-pressed`); the volume slider has a visible label.
- Buttons with a single action: `button type="button"` unless it submits the form.
- Toast: `role="status"`, `aria-live="polite"`; one element at a time.
- Sealed builds do not render Personalize or Copy controls; Fold back and the optional music pill keep their normal ghost-link treatment.

---

## Music

- Music is an extension beyond the reference design; reuse ghost-link and drawer tokens, never add a second visual system.
- Four options only: Dawn, Rain, Ember, None. Default is None; a fresh visit is silent.
- No autoplay. `play()` must be called directly from the unfold tap or a drawer preview click so mobile browsers accept the gesture.
- Music fades in over ~0.6 s on unfold and fades out/pauses on fold-back; the selected track survives fold-back.
- Volume and mute are local session controls only; never encode them in the hash.
- No audio uploads, no external audio URLs, no streaming providers, no media-player libraries.
- Bundled MP3s are local CC BY tracks by Kevin MacLeod; keep visible attribution in the drawer when a music track is selected.
- Sealed builds use one fixed track from `lib/sealed-content.ts`; the picker is absent, but a session-only volume slider and a small credit line stay visible below the open letter actions.
- SFX (paper rustle/chime) and background music are separate: muting one does not mute the other.
- Failed `play()` is silent; a failed MP3 load shows one toast and leaves the letter readable.

---

## Layering

Use the z-index table in `ui-tokens.md`. Ambient layers (sky, bloom, stars, orb, motes) are `aria-hidden` and `pointer-events: none`. `position: fixed` is allowed only for those full-screen ambient layers, the drawer backdrop, and the toast — not for page chrome.

---

## Empty / Failure States

- Broken photo URL → hide the Polaroid, keep the letter readable.
- Empty recipient/message/sender on submit → fall back to the default letter text, never render blank.
- Invalid share hash → default letter, no error screen.
- Unknown music track id in hash → None, no error screen.
- Clipboard blocked → hash stays in the address bar; toast says "Link ready in address bar!".
- Audio blocked → SFX skipped silently; music stays silent and never surfaces an error.
- Missing/failed MP3 → one toast: "Music unavailable — playing without sound".
- Local photo preview cannot be shared → say so in a toast after copying.

---

## Do Nots

- No card grids, dashboards, navbars, or product-style UI.
- No gradients on the paper surface (gradients belong to sky, folds, seal, orb only).
- No third-party icon library — use inline SVGs copied from the reference design; the music pill uses a simple inline speaker SVG.
- No raw hex, no raw Tailwind palette classes, no `<link>` font tags.
- No duplicated event listeners (the reference HTML has a broken duplicate block — do not copy it).
- No comments explaining what code does; comments only for non-obvious "why".
- No audio upload control, no arbitrary audio URL field, no external audio CDN.
