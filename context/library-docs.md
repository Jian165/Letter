# Library Docs

Project-specific usage patterns for every technology in this project. This file only covers how *we* use each library — rules and constraints specific to this project. Read the relevant section before implementing anything that touches it.

---

## Before Using Any Library

1. Check `AGENTS.md` at the project root for installed skills.
2. Check for an MCP server for that library; use it before falling back to general knowledge.
3. Read this file for project rules that override general knowledge.
4. Only then use general documentation/training knowledge.

Order of authority: `MCP server → Skills via AGENTS.md → This file → General knowledge`.

Never rely on general training knowledge alone for framework APIs — they change frequently.

---

## Next.js 16 (App Router)

### Route shape

```typescript
// app/layout.tsx — server component
import type { Metadata } from "next";
import { Caveat, Cormorant_Garamond, Lora } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morning Dedication Letter",
  description: "A letter folded into a sunrise.",
};

// apply variable classes to <html>
```

```typescript
// app/page.tsx — server component, no logic
import { LetterExperience } from "@/components/letter/LetterExperience";

export default function Home() {
  return <LetterExperience />;
}
```

**Rules:**

- One route only (`/`). No dynamic routes, no API routes, no middleware.
- All interactivity lives in client components under `components/letter/`.
- Never add `"use client"` to `layout.tsx` or `page.tsx`.
- Dynamic browser reads (`window.location.hash`) happen in `useEffect`, never during render.
- `next.config.ts` uses `output: "export"` and `basePath` from `PAGES_BASE_PATH`; GitHub Pages deploys the generated `out/` folder.
- Audio presets are static files in `public/audio/`; reference them by absolute path from the allowlist, then pass them through `withBasePath()` for Pages.
- `NEXT_PUBLIC_SEALED=true` builds the sealed visitor-facing site; local `npm run dev` stays editable.
- Read Next.js docs before using any API that might differ from older versions (params, metadata, font loading).

---

## React 19

### Ref-as-prop

```typescript
type Props = {
  motesRef?: Ref<MotesHandle>;
};

export function MotesCanvas({ motesRef }: Props) {
  useImperativeHandle(motesRef, () => ({ burst: spawnBurst }));
  // ...
}
```

**Rules:**

- No `forwardRef` — React 19 passes `ref` as a normal prop.
- Children expose imperative handles only for the mote burst; all letter and music updates go through props.
- `useEffect` cleanup is mandatory for timers, animation frames, audio nodes, and media elements.
- Event handlers in children call parent callbacks; children never own letter state.

---

## Tailwind CSS v4

### Tokens

All design values live in `@theme` in `app/globals.css` (see `ui-tokens.md`). No `tailwind.config.ts` for colors.

```css
@import "tailwindcss";

@theme {
  --color-paper-cream: #faf3e8;
  --font-handwriting: var(--font-caveat), cursive;
}
```

```tsx
// Correct
className="bg-paper-cream text-ink-sepia font-handwriting"

// Also correct — CSS variable in SVG styles
style={{ stroke: "var(--color-terracotta)" }}

// Never
className="bg-[#FAF3E8] text-[#3D281E]"
className="bg-amber-500"
```

**Rules:**

- `--color-*` tokens generate `bg-*`, `text-*`, `border-*` utilities automatically.
- Font tokens from `next/font` are exposed as CSS variables and mapped into `@theme`.
- Complex per-element geometry (clip-paths, gradients, 3D transforms, keyframes) lives in `globals.css`, not inline.
- Tailwind is used for layout/typography utilities where it cascades normally; bespoke scene/animated pieces use named CSS classes.
- Music pill and picker reuse existing tokens; do not add a second accent system.
- Verify any v4 utility against the Tailwind 4 docs skill before using an unfamiliar variant.

---

## Fonts (`next/font/google`)

| Family              | Variable             | Role                                  |
| ------------------- | -------------------- | ------------------------------------- |
| `Lora`              | `--font-lora`        | Body / UI text                        |
| `Cormorant_Garamond`| `--font-editorial`   | Letter body copy                      |
| `Caveat`            | `--font-handwriting` | Salutation, signature, recipient name |

```typescript
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});
```

- Apply all font variable classes to `<html>`; map them into `@theme` so utilities like `font-handwriting` exist.
- Never fall back to a system font for the handwriting or editorial roles.
- Never load fonts via `<link>` tags — the reference HTML does that only because it is a standalone prototype.

---

## Web Audio API (`lib/letter-sound.ts`)

```typescript
export function playPaperAndDawnSound(unfolding: boolean): void {
  try {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;
    // one shared AudioContext, resume() when suspended
    // filtered noise burst (paper) — always
    // F-major-9 sine notes — unfold only
  } catch (error) {
    console.warn("[letter-sound] audio unavailable", error);
  }
}
```

- One lazily created shared `AudioContext`; call `resume()` if suspended.
- Rustle: pink-noise buffer (~0.38 s) → bandpass (1400 Hz unfold / 1050 Hz fold) → gain envelope 0.001 → 0.22 → 0.001.
- Chime: sine notes `[349.23, 440, 523.25, 659.25, 783.99]`, staggered 0.11 s, ~1.65 s decay, unfold only.
- Never throw on blocked audio; autoplay restrictions are expected on first interaction.
- SFX are synthesized only — no audio files and no external libraries for SFX. Background music uses `<audio>` below.

---

## HTML Audio (`components/letter/BackgroundMusic.tsx`)

```typescript
type MusicTrackId = "dawn" | "rain" | "ember" | "none";

const MUSIC_TRACKS: Record<Exclude<MusicTrackId, "none">, string> = {
  dawn: "/audio/dawn.mp3",
  rain: "/audio/rain.mp3",
  ember: "/audio/ember.mp3",
};
```

**Rules:**

- One `<audio loop preload="none">` element, owned by `BackgroundMusic`. No parallel players.
- `src` is derived from the allowlist in `lib/music-tracks.ts`; never use raw input from the hash or URL field.
- Root-relative `src` values pass through `withBasePath()` so GitHub Pages project URLs work.
- Default is `"none"` — no `src` is set and no networking happens until a user gesture.
- Call `play()` directly inside the unfold handler (or the drawer preview click handler) so mobile browsers treat it as a user gesture; handle the returned promise.
- Fade volume over ~0.6 s with a tracked `requestAnimationFrame`; cancel the frame on unmount or when a new fade starts.
- On fold-back, fade out then `pause()`; keep the selected track for the next unfold.
- If `play()` rejects or the MP3 fails to load, stay silent; show a single toast only for a failed load.
- Mute/volume are local session state, never encoded into the hash.
- Audio files are local CC BY static assets: `public/audio/dawn.mp3`, `rain.mp3`, `ember.mp3`.

---

## Canvas 2D (`components/letter/MotesCanvas.tsx`)

- Fixed, full-viewport, `pointer-events: none`, `aria-hidden="true"`.
- Resize canvas on `window.resize` using `window.innerWidth/innerHeight`.
- Ambient motes: up to 24, slow upward drift with horizontal wrap; three warm color options from the design.
- Burst: 16 extra short-lived motes from viewport centre on unfold (`life: 140` frames).
- Single `requestAnimationFrame` loop; cancel on unmount.
- Do not animate when `prefers-reduced-motion` is set — draw a static field once or skip entirely.

---

## URL Hash Sharing (`lib/share-link.ts`)

```typescript
const payload = {
  r: state.recipient,
  m: state.message,
  s: state.sender,
  p: state.photoUrl.trim(),
  ...(state.caption.trim() ? { c: state.caption.trim() } : {}),
  ...(state.musicTrackId !== "none" ? { t: state.musicTrackId } : {}),
};
return "#card=" + btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))));
```

- UTF-8 safe: `TextEncoder` → binary string → `btoa`; reverse with `atob` → `Uint8Array` → `TextDecoder`.
- `p` is always present (empty string = no photo); `c` and `t` are optional (absent = default caption / no music).
- Decode defensively: missing/invalid hash → `null`; clamp `r`/`s` to 40, `m` to 2400, `p` to 500, `c` to 45.
- `t` must be one of `dawn | rain | ember | none`; any other value is ignored and becomes `"none"`.
- Non-string values are ignored, not coerced.
- Write with `history.replaceState(null, "", hash)` — never `location.hash =` (adds history entries).
- Clipboard: try `navigator.clipboard.writeText`, fall back to a hidden readonly textarea + `document.execCommand("copy")`.
- Local file uploads create a data URL for preview only; they are never encoded into links. Show the caveat toast.
- Volume and mute are never encoded — only the track id travels.

---

## Browser Support Notes

- Use `100dvh` with `100vh` fallback in CSS where practical (short mobile viewports).
- `env(safe-area-inset-*)` for padding on notched devices.
- `aspect-ratio`, `clip-path`, `backdrop-filter`, and 3D transforms are all used in the design — keep `-webkit-` prefixes where the reference has them.
- Mobile browsers require `play()` to be called synchronously from a user gesture — the unfold tap qualifies; a `useEffect` after a state change does not.
- `preload="none"` avoids downloading music for visitors who never unfold the letter.
- No polyfills; modern browsers only.
