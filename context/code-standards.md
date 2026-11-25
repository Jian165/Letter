# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

- **Think before implementing** — understand what is being built and why before writing code.
- **Read context files first** — never assume; verify against `project-overview.md`, `architecture.md`, and `context/designs/basedesing.html`.
- **Scope is sacred** — only build what the current feature requires.
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete.
- **Clean over clever** — simple readable code that a junior developer can understand beats clever abstractions.
- **One thing at a time** — complete one feature fully before touching the next.
- **Failures are expected** — browser APIs can be blocked; wrap them, degrade, never crash the page.

---

## TypeScript

- Strict mode enabled in `tsconfig.json` — no exceptions.
- Never use `any` — use `unknown` and narrow the type.
- Never use type assertions (`as SomeType`) unless absolutely necessary, with a comment explaining why.
- All function parameters and return types must be explicitly typed.
- Use `type` for object shapes and unions — `interface` only for extendable component props.
- All async functions must have proper error handling — never let promises float unhandled.
- Use `const` by default — `let` only when reassignment is necessary.

---

## Next.js 16 Conventions

- App Router only — no Pages Router.
- React 19 APIs throughout (ref-as-prop, no `forwardRef`).
- All components are Server Components by default.
- Add `"use client"` only when the component needs:
  - `useState` / `useReducer`
  - `useEffect`
  - browser APIs (AudioContext, HTMLMediaElement.play, canvas, clipboard, `window.location`)
  - event listeners
- Never add `"use client"` to `layout.tsx` or `page.tsx` unless absolutely required; keep the page as a thin server component rendering `LetterExperience`.
- No data fetching — this app has no backend.
- Static audio presets are served from `public/audio/`; never fetch them at runtime or from an external host.
- Always read Next.js documentation before implementing any Next.js-specific feature; API details may differ from training data.

---

## File and Folder Naming

- Folders: kebab-case — `letter`, `ui`
- Component files: PascalCase — `OrigamiEnvelope.tsx`, `MusicPill.tsx`
- Utility files: camelCase — `share-link.ts`, `letter-sound.ts`, `music-tracks.ts`
- Type files: camelCase — `index.ts`
- One component per file — never export multiple components from one file.
- Index files only in `components/ui/` — never barrel export from other folders.

---

## Component Structure

Every component follows this exact order:

```typescript
"use client"; // only if needed

// 1. External imports
import { useEffect, useRef, useState } from "react";

// 2. Internal imports
import { SunriseScene } from "@/components/letter/SunriseScene";

// 3. Type definitions
type Props = {
  phase: LetterPhase;
  onUnfold: () => void;
};

// 4. Component
export function OrigamiEnvelope({ phase, onUnfold }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports.
- Props type defined directly above the component — not in a separate types file unless shared.
- No inline styles except CSS variables (`style={{ stroke: "var(--color-terracotta)" }}`) and values that genuinely cannot be tokens (clip-paths, transform percentages, canvas coordinates).
- No comments explaining what code does — comments only for non-obvious *why* decisions.

---

## State and Effects

- Only `LetterExperience` owns letter state, phase, and music state; children receive props and callbacks.
- Every `setTimeout` used in the unfold/fold choreography is tracked and cleared on the next transition and on unmount.
- Every `requestAnimationFrame` used for a music volume fade is cancelled on unmount or when a new fade starts.
- `useEffect` that reads `window.location.hash` runs once on mount; no state updates derived from render.
- Canvas animation loop cancels its `requestAnimationFrame` on unmount.
- Media elements are paused on unmount; never leave a player running in the background.
- Never mutate the DOM imperatively to update text — render from state.

---

## Browser API Wrappers (`lib/`)

```typescript
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.warn("[share-link] clipboard API failed", error);
  }
  return legacyCopy(text);
}
```

- Every wrapper has try/catch and a typed return (`boolean` or `{ success, data?, error? }`).
- Console errors include a context prefix: `[letter-sound]`, `[BackgroundMusic]`, `[share-link]`, `[MotesCanvas]`.
- User-facing failures show a toast with human-readable text — never raw error messages.
- Feature-detect before use: `AudioContext`, `HTMLMediaElement.prototype.play`, `navigator.clipboard`, `document.execCommand`, `history.replaceState`, `canvas.getContext`.
- `media.play()` returns a promise — always handle it; never leave it unhandled.

---

## Error Handling

- Never use empty catch blocks — always log or handle.
- Malformed share hashes fall back to defaults silently (with a single `console.warn`).
- An unknown music track id decodes to `"none"` with a single `console.warn`.
- Audio blocked by autoplay policy → skip sound silently; never surface an error.
- A missing or failed MP3 → one toast ("Music unavailable — playing without sound"), then continue silently.
- Broken photo URL → hide the Polaroid, keep the letter readable.
- Clipboard denied → keep the hash in the address bar and show "Link ready in address bar!".

---

## Design Token Usage

- No hardcoded hex values in components — see `ui-tokens.md`.
- No raw Tailwind palette classes (`bg-purple-500`, `text-gray-600`) — use generated token classes.
- The reference HTML's arbitrary-value classes (`text-[#3D281E]/55`) must be converted to token classes or `style={{ color: "var(--color-ink-soft)" }}`.
- SVG gradient stops and stroke/fill colors use CSS variables via `style`, not SVG presentation attributes with hex strings.

---

## Music Feature Rules

- Track ids come only from the `MUSIC_TRACKS` allowlist in `lib/music-tracks.ts`: `dawn`, `rain`, `ember`, `none`.
- Never build an audio `src` from raw user input, a hash string, or a URL field.
- No audio uploads, no external audio URLs, no streaming services.
- Default track is `"none"`; a fresh visit makes no sound until a user gesture.
- `play()` is called directly inside the unfold tap handler (or the drawer preview click handler) so mobile browsers accept it as a user gesture.
- Volume and mute are local-only preferences; never write them to the hash.
- SFX and music stay separate: muting background music does not disable the paper rustle/chime, and blocked SFX must not block music.

---

## Import Aliases

Always use the `@/` alias — never relative imports that go up more than one level.

```typescript
// Correct
import { OrigamiEnvelope } from "@/components/letter/OrigamiEnvelope";
import { DEFAULT_LETTER } from "@/lib/letter-state";

// Never
import { OrigamiEnvelope } from "../../components/letter/OrigamiEnvelope";
```

---

## Environment Variables

This project requires none. Do not introduce secrets, API keys, or `.env.local` entries. If a future feature needs one, add it here first with its purpose and client/server scope.

---

## Dependencies

Never install a new package without a clear reason. Before installing anything check:

1. Does Next.js or React already provide this functionality?
2. Is there a simple native solution (CSS, Canvas, Web Audio, HTMLMediaElement)?
3. Is the package already listed below?

Approved dependencies:

- `next` — framework
- `react` / `react-dom` — UI runtime
- `tailwindcss` — styling (v4)
- `typescript` / `@types/*` — type checking
- `eslint` / `eslint-config-next` — linting

`lucide-react` is **not** approved — the design uses inline SVGs, which are cheaper and exactly match the reference.

Animation and media libraries (`three`, `gsap`, `framer-motion` / `motion`, media players) are **not** approved — native CSS transitions and `<audio>` are sufficient and phone-friendly.

Do not install any other packages without updating this list first.

---

## Verification Checklist

Before marking any feature complete:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Visual check against `context/designs/basedesing.html` at mobile and desktop widths
- Music check: fresh load silent → gesture starts chosen track → fold back stops it → `t` survives a fresh-tab reload
- Update `context/progress-tracker.md` and `context/ui-registry.md`
