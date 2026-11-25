# Memory — Morning Dedication Letter implementation

Last updated: 2026-11-26

## What was built

- Scaffolded the project in `/home/mark/Documents/Message Letter` with Next.js 16.4.6, React 19.3.0, TypeScript strict, Tailwind CSS 4.3.3, ESLint, `@/*` imports, and generated `AGENTS.md`.
- Created/replaced `app/layout.tsx` (Lora, Cormorant Garamond, Caveat via `next/font/google`; metadata), `app/page.tsx` (thin server component), `app/icon.svg` (JM wax-seal favicon), and `app/globals.css` (all design tokens plus the full sunrise/paper/drawer/toast CSS).
- Implemented components in `components/letter/`: `LetterExperience.tsx`, `SunriseScene.tsx`, `MotesCanvas.tsx`, `OrigamiEnvelope.tsx`, `LetterPaper.tsx`, `LetterActions.tsx`, `MusicPill.tsx`, `BackgroundMusic.tsx`, `PersonalizationSheet.tsx`, `ToastPill.tsx`.
- Implemented utilities in `lib/`: `letter-state.ts`, `share-link.ts`, `letter-sound.ts`, `music-tracks.ts`, plus shared types in `types/index.ts`.
- Full experience now works: closed envelope/JM wax seal, smooth sunrise crossfade, unfold/fold choreography, Canvas motes, Web Audio paper/chime SFX, letter/Polaroid, ghost actions, personalization drawer, local photo preview, copyable `#card=` link, and background music presets with fades.
- Added local CC BY MP3s at `public/audio/dawn.mp3`, `rain.mp3`, and `ember.mp3`, sourced from Incompetech (Kevin MacLeod), with drawer attribution.
- Added a sealed static deployment mode: `lib/sealed-content.ts`, `lib/runtime-config.ts`, `lib/asset-path.ts`, sealed-aware `LetterExperience`/`LetterActions`/`BackgroundMusic`, static export config, and `.github/workflows/deploy.yml` for GitHub Pages.
- Updated `context/progress-tracker.md` (all 10 features complete) and `context/ui-registry.md` (all components marked built with implementation notes).
- Verified with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and a production server smoke test returning HTTP 200 with the expected title/default letter HTML.

## Decisions made

- Kept the locked architecture: single `/` route, no backend/DB/auth/analytics/PDF, URL hash as the only persistence mechanism.
- Hash payload uses `r/m/s/p/c/t`; `p` is always present, `c`/`t` are optional, `none` is omitted, unknown `t` decodes to `none`, and volume/mute are session-only.
- Background music uses one `<audio loop preload="none">` with allowlisted sources `dawn`, `rain`, `ember`, plus `none`; play/stop are driven imperatively from user gestures; Web Audio remains reserved for SFX.
- Music presets are local CC BY 4.0 tracks by Kevin MacLeod: "There is Romance", "What Is Love", and "Touching Moments Four - Melody"; the drawer credits the selected track.
- Sunrise uses a feathered mask/opacity/translate crossfade instead of a hard clip-path reveal, with `--duration-sky: 2.4s`.
- Default letter is Jomar's dedication to KC: `Dear KC,`, the supplied body, `Love Always,`, and `Jomar`; message limit is `2400`; default photo/caption are empty.
- Wax seal and site icon both use the `JM` monogram.
- `RootLayout` uses an explicit `{ children: ReactNode }` type instead of `LayoutProps<"/">` because generated route types are unavailable before the first dev/build run.
- Hash decoding and drawer draft seeding are applied from mount/open effects through a zero-delay timer to satisfy React 19's `set-state-in-effect` lint rule while keeping browser reads in effects.
- `next/image` was disabled in `eslint.config.mjs` because photos can be arbitrary user URLs or preview-only data URLs and must degrade on error with plain `<img>`.
- `MotesCanvas` reads mote colors from CSS tokens instead of hardcoded design RGBA values; music UI adds no new colors and the music pill renders after Personalize rather than between the two core ghost actions.
- Sealed deployment is visitor-only immutability: `dev` stays editable, `main` deploys sealed, `lib/sealed-content.ts` is the sealed source of truth, hashes are ignored/cleared, and no editor/copy controls render.
- GitHub Pages uses a project-site base path from `actions/configure-pages`; `NEXT_PUBLIC_BASE_PATH` feeds `withBasePath()` for audio assets so `/audio/*.mp3` resolves under `/<repo>/`.
- Target repo is `https://github.com/Jian165/Letter.git`; expected Pages URL is `https://jian165.github.io/Letter/`.
- Sealed builds show a visible CC BY credit line below the open letter actions because the attribution drawer is hidden.
- The earlier owner-PIN lock plan was not implemented; sealed immutability comes from the static build, not browser storage.

## Problems solved

- `create-next-app` could not scaffold directly in `Message Letter` because of npm name restrictions; scaffolded in `/tmp/opencode/message-letter` and copied the generated files into the workspace.
- `python` was unavailable for the Tailwind docs sync; `python3` worked.
- Next 16 `LayoutProps<"/">` failed typecheck before generated route types existed; replaced with explicit `ReactNode`.
- React lint flagged direct `setState` in effects; moved hash/drawer seeding into zero-delay timers, computed the letter date during render, and keyed photo error state by active source.
- ESLint ref cleanup warning in `BackgroundMusic` was fixed by capturing `audioRef.current` inside the effect.
- Missing MP3s and missing default photo degrade gracefully: audio load failure shows one toast and broken photo hides the Polaroid.

## Current state

- All planned features, follow-up polish, and the sealed deployment mode are implemented; typecheck, lint, build, and production smoke test pass.
- Smoke test confirmed `/`, `/icon.svg`, and all three `/audio/*.mp3` routes return 200, with correct `image/svg+xml` and `audio/mpeg` content types.
- `AGENTS.md` exists with the generated Next.js agent rules; it requires reading relevant guides in `node_modules/next/dist/docs/` before Next-specific changes.
- No manual browser/visual QA has been performed yet at mobile and desktop sizes, and interactive music playback has not been verified in a browser.
- No default Polaroid photo is bundled; the first visit intentionally shows no photo.

## Next session starts with

- Run `/remember restore`, summarize, and get confirmation.
- Verify sealed mode with `npm run build:sealed` and a static server at a simulated `/<repo>/` base path; confirm no editor controls and working audio icon paths.
- Create the GitHub repo, set Pages source to GitHub Actions, push `dev`/`main`, and confirm the live Pages URL.
- Then perform manual browser QA at mobile/desktop widths: unfold/fold, personalization on the editable build, copy link, reload from hash, local photo preview, reduced motion, and actual music playback.
- Optionally add a default Polaroid photo only if the user wants one; the current default is intentionally photo-free.

## Open questions

- Does the user want the default Polaroid photo included, or should the first visit remain photo-free?
- Should visual/interaction QA results be recorded in `context/progress-tracker.md` and `context/ui-registry.md` after manual testing?
