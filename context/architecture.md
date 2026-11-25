# Architecture

## Stack

| Layer            | Tool                                            | Purpose                                              |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Framework        | Next.js 16 (App Router)                         | Single-route full stack framework                    |
| UI runtime       | React 19                                        | Interactive envelope, drawer, and scene              |
| Language         | TypeScript strict                               | Throughout                                           |
| Styling          | Tailwind CSS v4 + `@theme` tokens                | All visual styling; no config file for colors        |
| Fonts            | `next/font/google`                              | Lora, Cormorant Garamond, Caveat                     |
| Animation        | CSS transitions/keyframes + React state machine | Unfold / fold, sunrise cross-fade, seal pulse        |
| Sound effects    | Web Audio API (native)                          | Paper rustle + sunrise chime                         |
| Music            | HTML `<audio>` + local MP3 loops                | Personalized ambient track, shared via hash          |
| Ambient particles| Canvas 2D (native)                              | Floating morning motes                               |
| Sharing          | URL hash (`#card=`) + Clipboard API             | Self-contained letters, no backend                   |
| Persistence      | URL hash only                                   | No DB, no auth, no storage, no analytics             |
| Deployment       | GitHub Pages + GitHub Actions                   | Static `out/` export from sealed `main` build        |

No third-party UI or animation libraries are approved for this project. Everything in the reference design is achievable with CSS transitions, Canvas, and Web Audio. Music uses a plain `<audio>` element — no media player libraries.

---

## Folder Structure

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml                 → Builds sealed `out/` and deploys to GitHub Pages
├── AGENTS.md                          → Skills and agent instructions (create before build)
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   ├── progress-tracker.md
│   └── designs/
│       └── basedesing.html            → Visual + interaction source of truth
├── app/
│   ├── layout.tsx                     → Fonts, metadata, globals.css
│   ├── page.tsx                       → Renders <LetterExperience />
│   └── globals.css                    → @theme tokens + ambient/animation CSS
├── components/
│   └── letter/
│       ├── LetterExperience.tsx       → Client orchestrator: state machine + state + hash
│       ├── SunriseScene.tsx           → Sky layer, horizon bloom, stars, sun orb
│       ├── MotesCanvas.tsx            → Canvas particle field + burst API
│       ├── OrigamiEnvelope.tsx        → Paper grain, creases, flaps, seal, label
│       ├── LetterPaper.tsx            → Date, salutation, Polaroid, body, signature
│       ├── LetterActions.tsx          → Fold back / Music / Personalize ghost links
│       ├── MusicPill.tsx              → Play/pause pill for the selected track
│       ├── BackgroundMusic.tsx        → Single <audio> element, gesture start, fade
│       ├── PersonalizationSheet.tsx   → Modal drawer + form + music presets
│       └── ToastPill.tsx              → Single transient status message
├── lib/
│   ├── letter-state.ts                → Default letter, types, constants, clamping
│   ├── share-link.ts                  → encodeStateToHash / decodeStateFromHash
│   ├── letter-sound.ts                → Web Audio rustle + chime
│   ├── music-tracks.ts                → Track allowlist + src map + defaults
│   ├── runtime-config.ts              → Sealed build flag
│   ├── sealed-content.ts              → Build-time sealed letter and music
│   ├── asset-path.ts                  → GitHub Pages base-path helper
│   └── utils.ts                       → Shared helpers (if any)
├── types/
│   └── index.ts                       → Shared TypeScript types
└── public/
    └── audio/
        ├── dawn.mp3                   → User-provided preset
        ├── rain.mp3                   → User-provided preset
        └── ember.mp3                  → User-provided preset
```

---

## System Boundaries

| Folder          | Owns                                                                                 |
| --------------- | ------------------------------------------------------------------------------------ |
| `app/`          | Layout, the single page, global tokens/CSS. No interactive logic in `page.tsx`.       |
| `components/`   | UI only. Components receive props/callbacks; no direct DOM queries across siblings.   |
| `lib/`          | Pure state helpers, serialization, sealed config, base-path helper. No React imports. |
| `types/`        | Shared types only.                                                                    |
| `public/audio/` | Static MP3 presets supplied by the user. No runtime uploads or generated files.       |
| `context/`      | Documentation and design references. Never imported by app code.                      |
| `.github/`      | Pages deployment workflow only; no application logic.                                 |

---

## State Machine

`LetterExperience` owns one phase at a time:

```
closed  →  opening  →  open  →  closing  →  closed
```

- `unfoldLetter()` only runs from `closed`; `foldLetterBack()` only runs from `open`.
- Opening: set `opening`, add `letter-unfolded` to `<body>`, hide the hint, play SFX, burst motes; after ~480 ms set `open`.
- Closing: set `closing`, remove `letter-unfolded`, play fold SFX; after ~520 ms restore the envelope role/aria; after ~960 ms set `closed` and show the hint again.
- Music follows the phase: fade in during `opening` only if `musicTrackId !== "none"`, fade out and pause during `closing`. The selection survives fold-back.
- All timers are stored and cleared on transition or unmount — never leave stale timers running.
- `body.letter-unfolded` is the single CSS switch for the sunrise scene; do not duplicate scene state in components.

---

## Data Flow

### Letter state → UI

```
LetterExperience state
         ↓ props
OrigamiEnvelope (closed label) + LetterPaper (open letter)
         ↓
render on every state change (no imperative DOM text writes)
```

### Personalization → state → link

```
User edits drawer fields (including music track)
         ↓ submit / copy
LetterExperience.setState(nextLetter)
         ↓
encodeStateToHash(nextLetter) → history.replaceState
         ↓
renderLetter via props → fold back → toast
```

### Shared link → state

```
window.location.hash (#card=...)
          ↓ on mount (useEffect)
decodeStateFromHash()
          ↓
letter state + musicTrackId → recipient mode flag → UI renders received letter
```

### Sealed build → UI

```
NEXT_PUBLIC_SEALED=true
          ↓
lib/sealed-content.ts → LetterExperience initial state
          ↓
LetterActions hides Personalize/Copy; PersonalizationSheet is not rendered
           ↓
sealed volume slider updates musicSettings.volume for the current session
           ↓
hash is cleared and ignored; fixed letter + music render for every visitor
```

### Sound / particles / music

```
unfoldLetter() → letter-sound.playPaperAndDawnSound(true)
               + motesRef.burst()
               + BackgroundMusic.start()  [only if track selected]
foldLetterBack() → letter-sound.playPaperAndDawnSound(false)
                 + BackgroundMusic.stop()
drawer track selection → LetterExperience.setMusicTrackId(id) → <audio>.src via allowlist → preview
```

Browser API failures (audio blocked, clipboard denied, malformed hash, missing MP3) degrade silently or to a visible toast — never crash the experience.

---

## Music Data Model

- `musicTrackId` is one of `"dawn" | "rain" | "ember" | "none"`, defined in `lib/music-tracks.ts`.
- Default is `"none"`: a fresh visit is silent. A shared link with a valid `t` key selects that track.
- `t` is omitted from the hash when the track is `"none"`; an invalid `t` decodes to `"none"` with a single `console.warn`.
- `src` is derived from the allowlist (`/audio/${id}.mp3`), never from raw user input.
- Root-relative audio paths are prefixed by `withBasePath()` so GitHub Pages project sites resolve them under `/<repo>/`.
- Volume and mute are local session state in `LetterExperience`; they are never encoded into the hash. Sealed builds expose the volume slider but not mute or any letter-editing control.
- One `<audio loop preload="none">` element only. No parallel players, no audio uploads, no external audio URLs.

---

## Reference Design Notes

`context/designs/basedesing.html` is a standalone prototype. Two issues in it must **not** be reproduced:

1. Event listeners are registered twice (around lines 1360 and 1453); the second `keydown` handler references an undefined `isUnfolded`. Implement each listener once, using the `letterPhase` state machine.
2. It uses Tailwind CDN arbitrary-value classes (e.g. `text-[#3D281E]/55`) and raw hex in CSS. In the app these become `@theme` tokens and token-derived utility classes (see `ui-tokens.md`).

Background music does not appear in the prototype. It is an approved extension that reuses the prototype's ghost-link and drawer patterns; geometry and colors remain token-driven.

The prototype's geometry, timing functions, z-index layering, colors, and copy are authoritative for everything it does define.

---

## Invariants

- One route (`/`). No routing, no backend, no persistence beyond the URL hash in editable builds.
- Sealed builds use `lib/sealed-content.ts`, ignore URL hashes, and never render editing or copying controls.
- `app/page.tsx` stays a Server Component; all interactivity lives in `LetterExperience` and its children.
- Components never query the DOM to find each other; use refs/props/callbacks.
- Only `LetterExperience` mutates letter state, phase, and music state; children emit events via callbacks.
- `body.letter-unfolded` is the only scene switch; scene layers read CSS state, not props.
- Every timer created for a transition or a volume fade is cleared on the next transition and on unmount.
- Every browser API (AudioContext, HTMLMediaElement.play, clipboard, history, canvas) is feature-detected and wrapped in try/catch.
- No hardcoded hex values or raw Tailwind palette classes in components — use CSS variables from `ui-tokens.md`.
- Default letter copy and limits (40 / 2400 / 40 / 500 / 45 chars) come from `lib/letter-state.ts`, never duplicated.
- Local photo uploads are preview-only; never claim they are included in a copied link.
- Music never autoplays before a user gesture; `play()` promise rejection is silent (or a single toast for a failed track load).
- SFX (Web Audio) and music (`<audio>`) are separate systems; muting one does not imply muting the other.
- Keyboard path: envelope is `role="button"` + `tabindex="0"` while closed; drawer has a close button and backdrop click; focus is not trapped but must be reachable.
- Respect `prefers-reduced-motion`: shorten/cut transitions when requested (documented in `ui-rules.md`, implemented in polish phase).
