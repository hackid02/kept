# Kept — design system

> A notary's desk at night. Quiet, exact, expensive. The receipt is the hero object; everything else recedes.

## Feel

Premium · minimal · futuristic · simple. Premium comes from restraint (one accent, hairlines, weight ≤ 500), not from glow. Futuristic comes from precision (mono metadata, exact motion), not from gradients. The product speaks like a receipt: short declaratives, nouns for labels, no exclamation marks.

## Tokens

### Color (true neutrals — no blue-tinted greys)

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#0A0A0B` | page |
| `--surface` | `#111113` | cards, chat window |
| `--surface-2` | `#17171A` | nested surfaces, inputs, bubbles |
| `--surface-3` | `#1F1F23` | hover fills, secondary buttons |
| `--hairline` | `rgba(255,255,255,.08)` | every border |
| `--hairline-strong` | `rgba(255,255,255,.14)` | focused/selected edges |
| `--ink` | `#F2F2F0` | primary text (never pure white) |
| `--ink-2` | `#A3A3A0` | secondary text |
| `--ink-3` | `#6B6B68` | tertiary text, labels |
| `--accent` | `#7FD8BE` | **one job**: the verdict/primary action and the receipt mark |
| `--accent-ink` | `#06231B` | text on accent |
| `--amber` | `#D9A441` | ACTIVE / pending only |
| `--rose` | `#D96C6C` | BLOCKED / UPHELD-against-company only |
| `--user` | `#2F6BFF` | the customer's bubble — the only blue on the page |

Status colours appear only on badges and the 1px receipt edge. Never on text blocks, never as backgrounds larger than a pill.

### Type

| Role | Face | Size / weight / tracking |
|---|---|---|
| Display | Newsreader (serif, opsz) | 44–56px · 400 · −0.02em · lh 1.05 |
| Promise text (on receipts) | Newsreader italic | 22–28px · 400 · −0.01em · lh 1.25 |
| Heading | Inter | 20–24px · 500 · −0.015em |
| Body | Inter | 15px · 400 · lh 1.55 |
| UI / labels | Inter | 13px · 500 · 0 ; labels 11px · 500 · +0.08em uppercase |
| Data (ids, hashes, amounts, dates) | JetBrains Mono | 12–13px · 400 · tabular-nums |

Weight ceiling is 500. `text-wrap: balance` on headings, `pretty` on body. `font-feature-settings: "cv11","ss01","tnum"` on Inter.

### Space & shape

4px base. Ladder: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 96.
Section gap 72. Card padding 24. Element gap 8/12.
Radii: **4** (badges) · **8** (buttons, inputs) · **14** (cards) · **9999** (pills). Concentric: outer = inner + padding.
Borders do structure; shadows do nothing (except a soft 0 1px 0 white/4% inner highlight on raised surfaces).
Max width 1120.

### Motion

```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
press 120ms · hover 160ms · enter 240ms · state-swap 200ms
```

Rules: never `ease-in`; never `transition: all`; never from `scale(0)`; buttons `scale(.97)` on `:active`; exits softer than enters; no animation on chat send / typing / nav (high-frequency). Motion is never the only cue — every animated change has a static one (label, colour, icon).

The three moments that earn motion:
1. **Receipt issued** — card rises 8px, blur 6→0, 240ms; the mark draws its check.
2. **Draft struck** — a rose rule wipes through the blocked draft left→right (clip-path, 320ms), then the BLOCKED row settles in below.
3. **Verdict resolves** — status text swaps with blur; the payout amount pops in with tabular digits.

Waiting states ("validators ruling…") use a shimmering status line that swaps steps, never a spinner alone.

## Responsive

One layout, three densities. Nothing is hidden on small screens — it is re-stacked. Breakpoints are Tailwind's: `sm` 640, `md` 768, `lg` 1024.

| | phone (<640) | tablet (640–1023) | desktop (≥1024) |
|---|---|---|---|
| Primary nav | fixed bottom bar, 5 tabs, 56px, safe-area padded; "How it works" → "How" | top nav from `md` | top nav |
| Demo | chat, then receipt rail, then feed/board, stacked | same, wider | chat left · sticky rail right |
| In-chat "Receipt issued" row | scrolls to the rail (chat state kept) | same | opens `/r/[id]` |
| Chat height | `100dvh − 300px`, min 420 | max 640 | 640 |
| Receipt row | pill + amount on line 1, promise clamped to 2 lines | one line, truncated | one line |
| Board | one card per company | table | table |
| `/r/[id]` | verdict / claim panel **first**, receipt second | same | receipt left · panel right |
| Display type | h1 34px · page titles 30px | 44 / 34 | 54 / 34 |
| Page padding | 16px | 32px | 32px |
| Bottom padding | 112px (bar clearance) | — | 96px |

Rules: inputs are 16px on touch so iOS never zooms the page; tap targets ≥ 44px; grid children get `min-w-0` so `truncate` actually truncates; horizontal scroll strips (prompt chips) are masked at the edge and never widen their container; `viewport-fit=cover` with `env(safe-area-inset-bottom)` on the bar. Verified at 390×844 (iPhone), 768×1024 (iPad) and 1440×900 — `document.documentElement.scrollWidth` must equal the viewport width on every route.

## Themes

Two themes, one set of hues. Dark is the default ("the notary's desk at night"); light is the same desk by day — ivory paper, not pure white, so the mint/amber/rose still read as ink rather than neon. Every colour is a CSS variable (`rgb(var(--ink) / <alpha>)`), so components carry no theme knowledge and Tailwind opacity modifiers keep working.

| token | dark | light | note |
|---|---|---|---|
| canvas | `#0A0A0B` | `#F6F6F3` | page |
| surface / 2 / 3 | `#111113` `#17171A` `#1F1F23` | `#FFFFFF` `#F7F7F5` `#EEEEEB` | cards → inputs → raised |
| hairline / strong | white 8% / 14% | black 9% / 18% | borders, never shadows |
| ink / 2 / 3 | `#F2F2F0` `#A3A3A0` `#7D7D79` | `#161615` `#5A5A57` `#6F6F6B` | ink-3 ≥ 4.5:1 on surface in both |
| accent | `#7FD8BE` (ink `#06231B`) | `#146E51` (ink white) | 11.2:1 / 5.7:1 |
| amber · rose | `#D9A441` · `#D96C6C` | `#8A5F0A` · `#B83A3A` | ≥ 5.2:1 on light |
| user (chat) | `#2F6BFF` | `#2458E6` | only blue on the page |

Rules: the theme is decided before first paint by a 4-line inline script (stored choice → OS preference → dark); the toggle in the nav shows the *current* state (moon in dark, sun in light) and its label says what it will do; the choice persists in `localStorage` and the app follows OS changes until the user picks. `color-scheme` is set per theme so native controls match. `theme-color` follows. Print forces the light palette and hides chrome — a receipt is a document.

## Essentials (the layer nobody screenshots)

404 (`not-found.tsx`) and error boundaries (`error.tsx`, `global-error.tsx` inline-styled) in the brand voice; missing receipt ids are real 404 statuses. Favicon + apple icon + manifest generated from the mark. Open Graph / Twitter cards for the site and **per receipt** (promise in serif, status edge, value · due · from). Per-route titles, canonical, `robots.txt`, `sitemap.xml` with every receipt. Security headers: CSP (self only, no third-party origins at all), HSTS, `frame-ancestors 'none'`, nosniff, Referrer-Policy, Permissions-Policy. `/privacy` in plain English (what's public on-chain, the one cookie, no tracking, testnet). Skip link first in tab order; `Enter` submits chat; focus rings on every control; `prefers-reduced-motion` honoured; axe WCAG 2.1 AA clean on every route in both themes. Deliberately absent: analytics, cookie banner (nothing to consent to), third-party scripts.

## Copy

- Declarative, present tense, ≤ 12 words per line where possible.
- Labels are nouns: *Promise · Value · Due · Envelope · Anchored · Bond at risk*.
- Verdicts are single words: *Kept · Blocked · Upheld · Dismissed*.
- Never: seamless, empower, unlock, revolutionary, leverage, "!" .
- The product never says "AI-powered". It says who decided: *"Ruled by 3 validators."*

## Flow

One page holds the loop. Left: the chat. Right: the receipt rail — the latest receipt for *this visitor* is pinned; the claim lives on it. Below: the board, live. Secondary routes (`/r/[id]`, `/board`, `/console`, `/how`) exist for sharing and depth, not for understanding.

States to design, every component: default · hover · focus-visible · active · loading · empty · error · disabled.
