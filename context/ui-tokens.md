# UI Tokens

Design tokens for the Morning Dedication Letter. All colors, fonts, radii and timings are extracted from `context/designs/basedesing.html`. Use these exact values throughout the codebase — never hardcode colors or use raw Tailwind palette classes in components.

Background music is an extension beyond the prototype; its UI reuses the tokens below and adds no new colors.

---

## How to Use

This project uses **Tailwind CSS v4**. All tokens are defined with `@theme` in `app/globals.css`. There is no `tailwind.config.ts` for colors.

```tsx
// Correct — generated utility classes
className="bg-paper-cream text-ink-sepia font-handwriting"

// Also correct — CSS variable directly (SVG, gradients, canvas)
style={{ stroke: "var(--color-terracotta)" }}

// Never — hardcoded hex
className="bg-[#FAF3E8] text-[#3D281E]"

// Never — raw Tailwind palette
className="bg-amber-500 text-stone-700"
```

Tailwind v4 generates utilities from every `--color-*` token:
`--color-paper-cream` → `bg-paper-cream`, `text-paper-cream`, `border-paper-cream`.

Opacity modifiers work on token colors (`text-ink-sepia/55`) but prefer an explicit alpha token when the design repeats a specific alpha value.

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

@theme {
  /* Fonts — injected by next/font/google in app/layout.tsx */
  --font-body: var(--font-lora), Georgia, serif;
  --font-editorial: var(--font-cormorant-garamond), Georgia, serif;
  --font-handwriting: var(--font-caveat), cursive;

  /* Ink */
  --color-ink-sepia: #3d281e;
  --color-ink-soft: rgba(61, 40, 30, 0.72);
  --color-ink-faint: rgba(61, 40, 30, 0.48);
  --color-ink-quiet: rgba(61, 40, 30, 0.55);
  --color-ink-hairline: rgba(61, 40, 30, 0.1);
  --color-ink-edge: rgba(61, 40, 30, 0.14);
  --color-ink-hint: rgba(250, 243, 232, 0.75);

  /* Paper */
  --color-paper-cream: #faf3e8;
  --color-paper-white: #fffdf9;
  --color-paper-fold-light: #f6ecdc;
  --color-paper-fold-mid: #efe1cc;
  --color-paper-fold-deep: #e5d3b8;
  --color-paper-flap-top: #fbf5eb;
  --color-paper-flap-bottom: #ead9c0;
  --color-paper-edge: rgba(145, 98, 64, 0.2);
  --color-paper-edge-soft: rgba(145, 98, 64, 0.14);
  --color-paper-inset: rgba(218, 188, 148, 0.38);
  --color-paper-inset-open: rgba(216, 183, 140, 0.36);

  /* Accents */
  --color-terracotta: #c85a32;
  --color-terracotta-deep: #9b3b1a;
  --color-terracotta-mid: #c4532b;
  --color-terracotta-bright: #e27a48;
  --color-terracotta-hover: #b34d28;
  --color-amber-gold: #e08e45;
  --color-ink-button: #3d281e;
  --color-ink-button-hover: #523629;
  --color-seal-foreground: #fff4e4;
  --color-seal-ring: rgba(255, 236, 209, 0.38);
  --color-seal-inset-light: rgba(255, 228, 196, 0.45);
  --color-seal-inset-dark: rgba(74, 24, 8, 0.45);

  /* Pre-dawn sky */
  --color-predawn-top: #12172e;
  --color-predawn-mid: #242142;
  --color-predawn-bottom: #4a2e4b;

  /* Sunrise sky */
  --color-sunrise-top: #98a6d4;
  --color-sunrise-upper: #df8b7a;
  --color-sunrise-mid: #f6bd78;
  --color-sunrise-bottom: #fdf2dc;
  --color-bloom-inner: rgba(255, 232, 178, 0.72);
  --color-bloom-mid: rgba(246, 176, 108, 0.34);
  --color-star: rgba(255, 248, 232, 0.85);
  --color-orb-core: rgba(255, 252, 240, 0.96);
  --color-orb-mid: rgba(246, 189, 120, 0.68);
  --color-orb-edge: rgba(223, 139, 122, 0.26);

  /* Radius */
  --radius-sm: 2px;
  --radius-md: 3px;
  --radius-lg: 10px;
  --radius-pill: 9999px;
  --radius-sheet: 22px;

  /* Motion */
  --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-fold: cubic-bezier(0.32, 0.94, 0.6, 1);
  --ease-close: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-flap: 0.46s;
  --duration-sheet: 0.38s;
  --duration-sky: 2.4s;
  --duration-toast: 0.35s;
  --duration-music-fade: 0.6s;
}
```

Font variables are produced by `next/font/google` and applied to `<html>` in `app/layout.tsx`; `@theme` maps them to `font-body`, `font-editorial`, and `font-handwriting`.

---

## Color Usage Guide

| Element                       | Token                                        |
| ----------------------------- | -------------------------------------------- |
| Page background (pre-dawn)    | `linear-gradient(180deg, var(--color-predawn-top), var(--color-predawn-mid) 45%, var(--color-predawn-bottom))` |
| Sunrise sky (revealed)        | `var(--color-sunrise-top)` → `upper` → `mid` → `bottom` |
| Envelope / letter paper       | `bg-paper-cream`                             |
| Polaroid frame                | `bg-paper-white`                             |
| Fold gradients                | `paper-fold-light` → `fold-mid` → `fold-deep` |
| Wax seal                      | `terracotta-bright` → `terracotta-mid` → `terracotta-deep` |
| Primary letter text           | `text-ink-sepia` / `text-ink-sepia/90`        |
| Secondary letter text         | `text-ink-quiet` / `text-ink-soft`            |
| Signature and accents         | `text-terracotta`                            |
| Closed hint                   | `text-ink-hint`                              |
| Overlay backdrop              | `rgba(61, 40, 30, 0.35)` via named CSS class |
| Toast                         | `bg-ink-button text-paper-cream`             |
| Music pill                    | same as ghost link: `text-ink-soft`, translucent paper background |
| Selected music option         | `border-terracotta bg-terracotta/10 text-terracotta` |

---

## Typography

| Element             | Family token      | Size (design)                   | Weight | Line height | Color token        |
| ------------------- | ----------------- | ------------------------------- | ------ | ----------- | ------------------ |
| Envelope recipient  | `font-handwriting`| `clamp(1.7rem, 4.2vw, 2.4rem)`  | 600    | 1.1         | `text-ink-sepia`   |
| Envelope "for"      | `font-body`       | `11px / 12px`                   | 400    | —           | `text-ink-quiet`   |
| Letter date         | `font-body`       | `12px / 14px`                   | 400    | —           | `text-ink-quiet`   |
| Salutation          | `font-handwriting`| `clamp(1.75rem, 3.6vw, 2.5rem)` | 600    | 1.15        | `text-ink-sepia`   |
| Letter body         | `font-editorial`  | `clamp(1.06rem, 2.1vw, 1.28rem)`| 400    | 1.75        | `text-ink-sepia/90`|
| Signature           | `font-handwriting`| `clamp(1.6rem, 3.2vw, 2.2rem)`  | 600    | 1.15        | `text-terracotta`  |
| Polaroid caption    | `font-handwriting`| `16px / 18px`                   | 400    | 1           | `text-ink-soft`    |
| Ghost links         | `font-body`       | `clamp(0.82rem, 1.6vw, 0.92rem)`| 400    | —           | `text-ink-soft`    |
| Music pill          | `font-body`       | same as ghost links            | 400    | —           | `text-ink-soft`    |
| Drawer heading      | `font-handwriting`| `30px`                          | 600    | —           | `text-ink-sepia`   |
| Form labels         | `font-body`       | `12px`, italic                  | 400    | —           | `text-ink-soft`    |
| Form inputs         | `font-body`       | `14px`                          | 400    | relaxed     | `text-ink-sepia`   |
| Music option button | `font-body`       | `14px`                          | 400    | —           | `text-ink-soft`    |
| Toast               | `font-body`       | `0.84rem`                       | 400    | —           | `text-paper-cream` |

---

## Geometry

| Element              | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Stage                | `max-width: 760px`, `height: 100dvh`, `perspective: 1800px`            |
| Closed envelope      | `clamp(290px, 78vw, 480px) × clamp(190px, 50vw, 310px)`; short viewports `clamp(270px, 52vw, 390px) × clamp(172px, 34vw, 245px)` |
| Open letter          | `min(88vw, 660px) × min(78dvh, 760px)`; short viewports `min(86vw, 660px) × calc(100dvh - 82px)` |
| Envelope border-radius | `10px 12px 9px 11px` closed, `6px 8px 7px 6px` open                 |
| Polaroid             | `clamp(195px, 42vw, 270px)` wide, `rotate(-1.5deg)`, 4:3 image        |
| Letter measure       | `max-width: 54ch`, padding `clamp(24px, 4.5vw, 48px) clamp(24px, 5vw, 56px)` |
| Wax seal             | `clamp(60px, 11vw, 80px)` square, irregular border-radius             |
| Ghost link           | `min-height: 42px` (36px short viewport), pill radius, `0.55rem 1.05rem` padding |
| Music pill           | identical to ghost link; inline speaker SVG `14–16px`                 |
| Music option button  | `rounded-xl`, `padding: 0.5rem 0.75rem`, `font-size: 14px`            |
| Volume slider        | full-width, `accent-color: var(--color-terracotta)`                   |
| Drawer sheet         | `max-width: 520px`, `max-height: 90dvh`, `22px` radius, `1.5rem` padding (`1.85rem 2rem` ≥640px) |
| Toast                | bottom `max(1.4rem, env(safe-area-inset-bottom))`, pill radius         |

---

## Z-index Layers

| Layer              | z-index |
| ------------------ | ------- |
| Sunrise sky        | 0       |
| Bloom / stars / orb| 1       |
| Motes canvas       | 2       |
| Letter ink         | 4       |
| Origami flaps      | 6       |
| Closed label       | 8       |
| Seal glow          | 9       |
| Wax seal           | 10      |
| Stage              | 10      |
| Drawer backdrop    | 50      |
| Toast              | 60      |

Stage and wax seal both use 10 — the stage context contains the seal, so this is intentional. The music pill renders inside the stage and needs no new layer.

---

## Motion

| Transition             | Duration / easing                                      |
| ---------------------- | ------------------------------------------------------- |
| Envelope width/height  | `0.65s / 0.72s` `var(--ease-out-soft)`                  |
| Flaps (open)           | `0.44–0.46s var(--ease-fold)` with 0.04–0.14s stagger   |
| Flaps (close)          | `0.4–0.45s var(--ease-close)`, sides → bottom → top     |
| Seal break            | `0.28s ease`, 0.35s delay (open); `0.28s` (close)       |
| Sky crossfade         | `2.4s var(--ease-out-soft)`                             |
| Stars fade            | `1.1s ease 0.25s` (open), `0.8s ease` (close)           |
| Ink reveal            | `0.55s ease 0.22s`                                      |
| Footer actions        | `0.5s ease 0.35s`                                       |
| Drawer sheet          | `0.38s var(--ease-out-soft)`                           |
| Toast                 | `0.35s var(--ease-out-soft)`                           |
| Seal glow pulse       | `2.6s infinite ease-out` (`warmPulse`)                   |
| Music volume fade     | `0.6s` (`--duration-music-fade`), linear rAF ramp      |

Choreography timers: expand at ~480 ms after open begins; restore closed role at ~520 ms and phase at ~960 ms after close begins. Music fade runs from the unfold/fold handlers, not from a CSS class.

---

## Component Tokens

### Envelope shadow (closed)

```css
box-shadow:
  0 26px 52px -12px rgba(10, 12, 28, 0.58),
  0 8px 20px -4px rgba(15, 16, 36, 0.35),
  inset 0 0 0 1px var(--color-paper-edge),
  inset 0 0 30px var(--color-paper-inset);
```

### Letter shadow (open)

```css
box-shadow:
  0 28px 60px -16px rgba(94, 48, 22, 0.24),
  0 8px 22px -6px rgba(94, 48, 22, 0.12),
  inset 0 0 0 1px var(--color-paper-edge),
  inset 0 0 48px var(--color-paper-inset-open);
```

### Paper grain

SVG `feTurbulence` / `feDiffuseLighting` data-URI from the design, `opacity: 0.52`, `mix-blend-mode: multiply`, `background-size: 200px 200px`. Keep verbatim in `globals.css`.

### Form controls (drawer)

```
background: rgba(255, 255, 255, 0.75)
border: 1px solid var(--color-ink-edge)
radius: 12px
padding: 0.625rem 0.875rem (inputs) / 0.5rem 0.875rem (compact)
text: 14px var(--color-ink-sepia)
focus: outline none, border-color var(--color-terracotta)
```

### Buttons

| Button          | Background                    | Text              | Radius |
| --------------- | ----------------------------- | ----------------- | ------ |
| Seal & Preview  | `bg-ink-button` hover `bg-ink-button-hover` | `text-paper-cream` | `rounded-xl` |
| Copy Share Link | `bg-terracotta` hover `bg-terracotta-hover` | `text-paper-cream` | `rounded-xl` |
| Ghost link      | `rgba(250,243,232,0.62)` + backdrop blur | `text-ink-soft` | `rounded-pill` |
| Music pill      | same as ghost link            | `text-ink-soft`   | `rounded-pill` |
| Music option    | `bg-white/75 border-ink-edge`; selected `border-terracotta bg-terracotta/10` | `text-ink-soft`; selected `text-terracotta` | `rounded-xl` |

---

## Invariants

- Never use hex values directly in components — use CSS variables or generated token classes.
- Never use raw Tailwind palette classes — the only purples/warms are the tokens above.
- `terracotta` is the single accent; `amber-gold` is a supporting sky/orb tone only.
- All font families come from `next/font/google` variables, never system fallbacks as the primary font.
- SVG gradients and canvas fills use `var(--color-*)` where possible; canvas colors can read computed CSS values once on mount.
- Motion timings are tokens or named CSS classes — never magic numbers duplicated in components.
- Music UI adds no new color tokens; it reuses ghost-link/form/accent tokens only.
