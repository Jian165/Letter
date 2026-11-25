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
- Default letter is Jhon Mark's exact dedication to KC: `Dear KC,`, the supplied body, `Love always,`, and `Jhon Mark`; message limit is `2400`; editable default photo/caption are empty.
- The sealed build now ships a bundled keepsake Polaroid photo at `public/images/keepsake.jpg`, supplied by the user; the original upload was actually JPEG data with a `.png` name and was renamed to `.jpg`.
- Wax seal and site icon both use the `JM` monogram.
- `RootLayout` uses an explicit `{ children: ReactNode }` type instead of `LayoutProps<"/">` because generated route types are unavailable before the first dev/build run.
- Hash decoding and drawer draft seeding are applied from mount/open effects through a zero-delay timer to satisfy React 19's `set-state-in-effect` lint rule while keeping browser reads in effects.
- `next/image` was disabled in `eslint.config.mjs` because photos can be arbitrary user URLs or preview-only data URLs and must degrade on error with plain `<img>`.
- `MotesCanvas` reads mote colors from CSS tokens instead of hardcoded design RGBA values; music UI adds no new colors and the music pill renders after Personalize rather than between the two core ghost actions.
- Sealed deployment is visitor-only immutability: `dev` stays editable, `main` deploys sealed, `lib/sealed-content.ts` is the sealed source of truth, hashes are ignored/cleared, and no editor/copy controls render.
- GitHub Pages uses a project-site base path from `actions/configure-pages`; `NEXT_PUBLIC_BASE_PATH` feeds `withBasePath()` for audio and bundled sealed image assets so `/audio/*.mp3` and `/images/keepsake.jpg` resolve under `/<repo>/`.
- Target repo is `https://github.com/Jian165/Letter.git`; expected Pages URL is `https://jian165.github.io/Letter/`.
- Sealed builds show a visible CC BY credit line below the open letter actions because the attribution drawer is hidden.
- Music volume fades clamp progress and target values, guard every `audio.volume` write with `[BackgroundMusic]` logging, and retarget an active fade when volume/mute changes; this prevents negative-volume `IndexSizeError`.
- The exact KC dedication letter supplied by the user is now stored verbatim in both `DEFAULT_LETTER` and `SEALED_LETTER`; `Dear KC,` is rendered from `recipient`, the body starts at `Hi, love.`, and the closing is `Love always,` + `Jhon Mark`.
- Sealed builds expose a session-only volume slider between the actions and the CC BY credit; it is a playback control, not a letter-editing control.
- Paper crease hairlines live inside the scrolling letter surface so they move with the text.
- Sealed letter photo is defined once in `SEALED_LETTER.photoUrl` with `withBasePath("/images/keepsake.jpg")`; no caption was added.
- The earlier owner-PIN lock plan was not implemented; sealed immutability comes from the static build, not browser storage.

## Problems solved

- `create-next-app` could not scaffold directly in `Message Letter` because of npm name restrictions; scaffolded in `/tmp/opencode/message-letter` and copied the generated files into the workspace.
- `python` was unavailable for the Tailwind docs sync; `python3` worked.
- Next 16 `LayoutProps<"/">` failed typecheck before generated route types existed; replaced with explicit `ReactNode`.
- React lint flagged direct `setState` in effects; moved hash/drawer seeding into zero-delay timers, computed the letter date during render, and keyed photo error state by active source.
- ESLint ref cleanup warning in `BackgroundMusic` was fixed by capturing `audioRef.current` inside the effect.
- Missing MP3s and missing default photo degrade gracefully: audio load failure shows one toast and broken photo hides the Polaroid.

## Current state

- All planned features, follow-up polish, sealed deployment mode, visible sealed CC BY credit, exact letter content, sealed volume slider, scrolling creases, guarded music fades, and the bundled sealed keepsake photo are implemented; typecheck, lint, sealed build, and static smoke tests pass.
- Static smoke test confirmed `/Letter/`, `/Letter/icon.svg`, and all three `/Letter/audio/*.mp3` routes return 200 with correct content types; built HTML has no editor controls.
- Initial commit `f0a632c` was pushed to `main` at `https://github.com/Jian165/Letter.git`; remote uses SSH because HTTPS credentials are unavailable.
- Workflow run #1 started from the push but failed because GitHub Pages is not enabled/configured to GitHub Actions; `actions/configure-pages@v5` cannot auto-enable with `GITHUB_TOKEN`.
- `AGENTS.md` exists with the generated Next.js agent rules; it requires reading relevant guides in `node_modules/next/dist/docs/` before Next-specific changes.
- Browser QA previously surfaced a negative-volume `IndexSizeError`; the fix is implemented and build-verified, but a fresh browser pass at mobile/desktop sizes is still needed to confirm playback, slider, and crease behavior.
- The editable default remains photo-free; the sealed deployed letter shows the bundled keepsake photo after unfolding.

## Next session starts with

- Run `/remember restore`, summarize, and get confirmation.
- Give the user the exact GitHub Pages steps: Settings → Pages → Build and deployment → Source: GitHub Actions → Save, then rerun the workflow.
- After deployment succeeds, confirm the live Pages URL `https://jian165.github.io/Letter/` and that audio/credit/icon routes work.
- Then perform manual browser QA at mobile/desktop widths: unfold/fold, sealed keepsake photo, sealed volume slider, scrolling crease, personalization on the editable build, copy link, reload from hash, local photo preview, reduced motion, and actual music playback with no console errors.
- If the photo changes, replace `public/images/keepsake.jpg`, keep the sealed `photoUrl` path, and redeploy; add a caption only if the user asks.

## Open questions

- Does the user want a Polaroid caption under the sealed keepsake photo, or should the photo remain uncaptioned?
- Should visual/interaction QA results be recorded in `context/progress-tracker.md` and `context/ui-registry.md` after manual testing?
