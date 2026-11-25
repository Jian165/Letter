# Project Overview

## About the Project

"Morning Dedication Letter" (workspace: Message Letter) is a single-page, deeply personal web experience. A visitor arrives at a folded paper envelope floating in a pre-dawn sky. Tapping the wax seal unfolds the envelope into a full handwritten letter while the sky cross-fades into sunrise. The visitor can personalize the letter — recipient, message, signature, keepsake photo, caption and background music — and copy a private link that carries the letter in the URL itself.

No account, database, or backend is required. The letter and the chosen music track travel inside the link.

A sealed static build can also be deployed from `main`: it reads the fixed letter from `lib/sealed-content.ts`, ignores URL hashes, and hides editing controls so visitors cannot personalize the deployed site.

**Visual source of truth:** `context/designs/basedesing.html` (and `context/designs/` generally). Every visual and motion decision must be verified against that file before implementing. Background music is an extension beyond the prototype — reuse the prototype's existing ghost-link and drawer patterns, do not invent new visual language.

---

## The Problem It Solves

A text message is easy to send and easy to forget. This project turns a short dedication into a small ritual: a physical-feeling envelope, a moment of unfolding, a sunrise, a letter written in handwriting, and an optional ambient soundtrack. It gives the sender a beautiful, zero-setup way to make someone's morning feel intentional — and gives the recipient a link that opens straight into the gesture.

---

## Page Map

```
/   → the entire experience (envelope → letter → personalization → share)
```

There is only one route. All states are in-page states, not separate pages.

---

## Navigation

No navbar, no sidebar, no page chrome. The persistent controls are the ghost links that appear below the unfolded letter:

```
Fold back    •    [Music]    •    Personalize
```

The music pill appears only when a track is selected. The closed envelope itself is the primary call to action ("Tap the seal to unfold").

---

## Core User Flow

### Arrival (closed state)

- Pre-dawn gradient sky, faint stars, a dim sun below the horizon, drifting dust motes.
- A folded origami envelope with a handwritten recipient name and a pulsing terracotta wax seal.
- Prompt below the envelope: "Tap the seal to unfold".
- No music starts on load. The default track is "None".

### Unfold

- Tap or press Enter/Space on the envelope.
- Seal shrinks and fades; four origami flaps rotate open in sequence (top/bottom/sides on open, reverse on close).
- Sky layer rises bottom-up from pre-dawn to sunrise; horizon bloom and sun orb rise; stars fade out.
- Paper rustle + warm chime play via Web Audio (gracefully skipped when audio is blocked).
- If the link has a music track selected, it fades in on this same gesture; "None" stays silent.
- A short burst of motes spawns from the centre.
- Envelope expands into a full paper sheet; crease lines and the letter fade in.

### Letter (open state)

- Date + sunrise flourish.
- Handwritten salutation ("Dear {recipient},").
- Optional taped Polaroid with caption.
- Body copy in editorial serif, preserving line breaks.
- Handwritten signature in terracotta.
- "Fold back", optional "Music" play/pause pill, and "Personalize" ghost links appear below the letter.

### Personalize

- A drawer opens: bottom sheet on phones, centered dialog from 640px up.
- Fields: To (40 chars), Your Message (2400 chars, live counter), From (40 chars), optional photo URL or local upload, Polaroid caption (45 chars).
- Background music section: Dawn / Rain / Ember / None, plus a volume slider and mute control. Selecting a track previews it immediately from the click gesture.
- "Seal & Preview" applies all changes, writes the new hash, re-renders the letter, folds it back, and shows a toast.
- "Copy Share Link" applies the same changes and copies the current URL.

### Shared link

- On load, `#card=...` is decoded (base64 of UTF-8 JSON) and replaces the default letter.
- A received letter's Personalize button reads "Reply / Write one" and clears the fields instead of echoing the received text.
- Local photo uploads are preview-only; only a photo URL can be encoded into the share link. This limitation is disclosed in a toast.
- The chosen music track travels with the link. Volume and mute are visitor-local preferences and are not shared.

### Fold back

- Sky returns to pre-dawn (top-down sunset), ink and Polaroid fade, sheet collapses, flaps close in reverse order, seal reattaches, hint returns.
- Music fades out and pauses; the selected track is remembered for the next unfold.

### Sealed site

- `NEXT_PUBLIC_SEALED=true` selects the sealed build from `lib/sealed-content.ts`.
- URL hashes are ignored and cleared; the fixed letter, photo, caption, and music track render for every visitor.
- Only "Fold back" and the optional music pill appear below the letter; Personalize and Copy controls are not rendered.
- A small CC BY credit line remains visible below the actions so the bundled music attribution survives without the drawer.
- GitHub Actions deploys the static `out/` export from `main` to `https://jian165.github.io/Letter/`.

---

## Data Architecture

### Letter state

- One in-memory state object: `{ recipient, message, sender, photoUrl, caption, musicTrackId }`.
- Defaults live in `lib/letter-state.ts`; the source design's defaults are the canonical copy. Music defaults to `"none"`.
- Sealed builds initialize from `SEALED_LETTER` and `SEALED_MUSIC` in `lib/sealed-content.ts` and never decode the share hash.
- State is the single source of truth for the envelope label, the unfolded letter, and the music selection.
- Persisted only in the URL hash; no server-side writes. Volume/mute stay in memory for the session.

### Share-link data

- Compact JSON keys (`r`, `m`, `s`, `p`, `c`, `t`) keep links short.
- `t` is the optional music track id: `"dawn" | "rain" | "ember" | "none"`. It is omitted when the track is `"none"`.
- Encoding: `JSON.stringify` → `TextEncoder` → `btoa` → `#card=`.
- Decoding is defensive: malformed hashes fall back to defaults; all fields are length-clamped; an unknown `t` falls back to `"none"`.
- A missing `p` key means "use the default photo"; an explicit empty `p` means "no photo".
- Music files are local static assets in `public/audio/`; no external audio URLs and no audio uploads.

---

## Features In Scope

- Animated pre-dawn → sunrise sky with stars, horizon bloom, sun orb and floating motes
- Folded origami envelope with wax seal and handwritten recipient
- Unfold / fold-back choreography with Web Audio paper rustle and chime
- Full paper letter with date, salutation, body, signature and optional taped Polaroid
- Personalization drawer (bottom sheet / centered dialog) with character limits, photo upload and music presets
- Three locally hosted ambient music presets plus "None", shared via hash key `t`, with local volume/mute controls
- Self-contained share links via URL hash, plus copy-to-clipboard with fallback
- Sealed static GitHub Pages build with fixed build-time content and no visitor personalization
- Toasts, keyboard support, reduced-motion consideration and responsive layouts

---

## Features Out of Scope

- Accounts, authentication, database, or any backend service
- Server-side storage of letters, photos, or audio
- Analytics / event tracking (no PostHog in this project)
- Cover letters, resumes, jobs, dashboards, or any product UI beyond the letter
- Scheduled delivery, email/SMS, or notifications
- Multiple letters, history, or saved drafts
- Printing / PDF export
- Rich text editing in the letter body (plain text with line breaks only)
- AI generation of letter content
- User-uploaded music, arbitrary audio URLs, or streaming services
- Third-party animation libraries (Three.js, GSAP, Framer Motion)

---

## Success Criteria

- Opening `/` on a phone or desktop shows the folded envelope in the pre-dawn sky with no layout overflow and no music until the user acts.
- Tapping the seal produces the full unfold sequence with no visual popping and no overlap of flaps over text.
- The letter displays exactly the personalized fields, with line breaks preserved.
- Choosing a music track writes `t` into the hash and reopens in a fresh browser with that track selected; folding back pauses it.
- Music starts only on the unfold tap; "None" stays silent; blocked/autoplay-rejected audio never shows an error.
- "Seal & Preview" and "Copy Share Link" both produce a URL that reopens the same letter in a fresh browser.
- Received links show "Reply / Write one".
- Keyboard users can unfold, fold back, personalize, close the drawer, toggle music, and copy a link.
- No hardcoded hex colors or raw Tailwind palette classes in components; design colors come from `@theme` tokens in `globals.css`.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass.
