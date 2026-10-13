# Qavyx — Interactive Hero Experience
## Technical Design Document

**Status:** Blueprint for implementation · **Owner:** Frontend Motion · **Stack:** Next.js 15 · TypeScript · Tailwind · GSAP 3.13 · Lenis

---

## Context

Qavyx is a software development and digital product agency. The landing page needs a hero that does more than display a logo — the visitor should feel they *assembled* the brand. The experience runs as three engines: a pointer-driven intro that builds the logo, a scroll-driven expansion that turns the logo's rounded rectangle into a full design frame, and a horizontal services carousel inside that frame which ends by shrinking into the navbar logo.

This document exists so a frontend developer can build that without inventing anything. Every number here is a decision, not a suggestion. Where a value is arbitrary but must be *consistent*, it is fixed here and referenced everywhere else.

**Motion rule that governs the whole build:** every animation communicates one of — *discovery, confirmation, construction, navigation, transition*. If a movement can't be named as one of those in a sentence, cut it. Clarity over spectacle. In practice this means the hero has exactly one idle loop (the breathing dot), no parallax, no decorative particles, and no entrance animations that exist to stagger prettily.

---

## 1. Project Overview

### Goals

| Goal | Measure |
|---|---|
| Visitor completes the intro and reaches the carousel | ≥ 70% of desktop sessions reach `services` beat |
| Experience feels authored, not templated | Qualitative; the single-node construction is the signature |
| Never blocks content | H1 in DOM and readable at first paint; intro skippable at any moment |
| Production performance | LCP ≤ 1.8s, INP ≤ 200ms, CLS ≤ 0.05, sustained 60fps on M1 / 45fps floor on mid Android |
| Bundle discipline | Initial route JS ≤ 165 KB gzip; hero motion layer lazy after first paint |

### Non-goals

- No WebGL, no `<canvas>`, no Three.js, no Framer Motion. DOM + SVG only.
- No physics simulation, no cursor trails, no particle field.
- Not a full site — this document covers the hero and the services section only. Everything below the hero is normal document flow.

### Three engines

| Engine | Driver | Budget | Ends when |
|---|---|---|---|
| 1 — Intro | Time + pointer events, scroll locked | ~5.2s if user engages promptly | Logo complete, hold finished → `lenis.start()` |
| 2 — Expansion | Scroll, scrubbed | 80vh of pinned scroll | Frame reaches 70% viewport |
| 3 — Services | Scroll, scrubbed | 360vh carousel + 60vh exit | Frame shrinks into navbar, hero unpins |

Total pinned scroll: **500vh** (`end: "+=500%"`).

### Stack

| Package | Version | Why |
|---|---|---|
| `next` | `15.x` | App Router, `next/font`, metadata API |
| `react` / `react-dom` | `19.x` | Required by Next 15 |
| `typescript` | `5.6+` | `strict: true` |
| `tailwindcss` | `3.4.x` | Utility layout + tokens via CSS custom properties. Not used for anything GSAP animates. |
| `gsap` | `3.13+` | All plugins free as of 3.13 — no Club license needed |
| `@gsap/react` | `2.x` | `useGSAP()` — correct cleanup under React 19 StrictMode |
| `lenis` | `1.1.x` | Smooth scroll. Chosen over ScrollSmoother: smaller, no wrapper/content DOM requirement, no `scrollerProxy` needed. |
| `zustand` | `5.x` | Beat state, ~1.2 KB, subscribe-without-render for transient values |
| `vitest`, `@testing-library/react`, `@playwright/test` | current | See §17 |

### Support matrix

Chrome/Edge 111+, Firefox 121+, Safari 16.4+ (`svh`/`dvh`, `:has()`, container queries). Below that: reduced-motion static fallback (§13), which is also the no-JS output.

### Document conventions

- **Beat IDs** are kebab-case: `dot-in`, `frame-expand`. They are the timeline label names, the `data-beat` attribute values, and the state machine states. One vocabulary everywhere.
- **Timeline labels** are the beat ID; end markers add `:end` → `"logo-build:end"`.
- **ScrollTrigger IDs** are prefixed `st-` → `st-hero-pin`.
- **CSS custom properties** are prefixed `--qx-`.

---

## 2. Creative Direction

Pure black, one green, no second accent. The hero is an instrument panel, not a poster: the green is a *signal*, and it only appears where something is live or has been acted upon. Everything else is achromatic. This is the discipline that keeps the page from reading as a template — the restraint is the design.

### Color tokens

| Token | Hex | Use | Contrast on `--qx-black` |
|---|---|---|---|
| `--qx-black` | `#000000` | Page base. Literal black, not near-black. | — |
| `--qx-ink` | `#0A0C0B` | Frame interior fill, service panels | 1.06:1 (surface only) |
| `--qx-green` | `#22E584` | The dot, the cursor, active state, focus ring | 12.4:1 ✅ AAA |
| `--qx-green-dim` | `#0E5F39` | Inactive frame stroke, guide lines | 3.1:1 (non-text only) |
| `--qx-white` | `#F2F5F3` | Headings, wordmark | 18.6:1 ✅ AAA |
| `--qx-grey` | `#8A928D` | Body copy, captions, counters | 7.4:1 ✅ AAA |
| `--qx-line` | `#1E2320` | Hairlines, dividers, inactive UI | 1.4:1 (non-text only) |

`--qx-green` at `#22E584` is deliberately warmer and less acidic than the `#00FF88`-family default, and darker than Tailwind `emerald-400`. It sits at 12.4:1 on black so it can carry text and focus rings without a second variant.

### Typography

| Role | Face | Source | Weights | Use |
|---|---|---|---|---|
| Display | **Satoshi** | Fontshare (free commercial), self-hosted | 500, 700 | Wordmark, service titles |
| Body | **Inter** | `next/font/google` | 400, 500 | Descriptions, UI |
| Mono | **JetBrains Mono** | `next/font/google` | 400 | Counters, service index, dev overlay |

Scale (px): `12 · 14 · 16 · 20 · 26 · 34 · 48 · 72 · 112`. Line-height 1.15 for display, 1.55 for body. Display tracking `-0.02em`; mono tracking `0.06em`.

All three load via `next/font` with `display: 'swap'` and `preload: true`. **The wordmark font must be loaded before `logo-build` starts** — see §12 for the gate. Font swap mid-construction would resize the wordmark and break the geometry.

### Surface

| Element | Technique | Animated? |
|---|---|---|
| Grain | Static 128×128 tiled PNG, `opacity: 0.035`, `mix-blend-mode: overlay` | **No.** Static. Animated grain is decoration. |
| Vignette | Single CSS `radial-gradient` on a fixed overlay div | No |
| Green glow | CSS `filter: drop-shadow(0 0 12px rgb(34 229 132 / 0.45))` on the cursor node only | Only via opacity during `dot-in` |
| Frame stroke | SVG `stroke-width: 1.5`, `--qx-line` at rest, `--qx-green-dim` when active | Color only |
| Corner radius | `rx` on the frame rect, animated as an attribute (§7) | Yes — part of the expansion |

No `feGaussianBlur`. The one glow is a CSS `drop-shadow` on a single small element, which is cheap; an SVG filter region over the full-viewport stage is not.

### Motion character

Three eases, registered once as `CustomEase` (§8):

| Ease | Curve | Feel | Used for |
|---|---|---|---|
| `qx.out` | `cubic-bezier(0.16, 1, 0.30, 1)` | Fast departure, long settle | Most entrances, the travel path, frame expansion |
| `qx.inOut` | `cubic-bezier(0.65, 0, 0.35, 1)` | Symmetric, mechanical | Morph, frame exit, carousel steps |
| `qx.snap` | `cubic-bezier(0.30, 0, 0.10, 1)` | Immediate, no overshoot | Click confirmation, button flash |

No elastic, no back, no bounce anywhere. Overshoot reads as personality-for-its-own-sake here and fights the "precision instrument" thesis.

Duration doctrine: **confirmation ≤ 120ms** (must feel instant), **transition 300–600ms**, **construction 600–1000ms** (the user should watch it happen).

### Copy

- **H1 (the wordmark):** `QAVYX` — the h1 text content is `Qavyx`, visually rendered as the letterforms.
- **Subhead (appears at `logo-build:end`):** *Software and product engineering for teams that ship.*
- **Scroll affordance:** `Scroll` + a 1px 24px green rule, appearing at `logo-build:end`.
- **Service CTA label:** `See the work` → links to `/work#<service-slug>`.

---

## 3. User Experience Flow

```
ENGINE 1 — time + pointer, scroll LOCKED          ENGINE 2 — scroll      ENGINE 3 — scroll
├────────┬────────┬─────────┬──────────┬─────────┼───────────┬──────────┼─────────────────┬────────┤
 boot     dot-in   pointer-  cursor-    click      logo-build  frame-     services          frame-
 200ms    600ms    wake      morph      90ms       2280ms      scale/     360vh             exit
                   120ms     520ms                             expand                       60vh
                                                                80vh
 └─────────────── ~5.2s wall clock ──────────────────────────┘ └──────── 500vh pinned ─────────────┘
                                                    lenis.start() ↑
```

Each beat below uses the same structure. **Intent** is the motion rule from the Context section.

### 3.1 `boot` — Initial load

- **Intent:** none — nothing moves.
- **Trigger:** Route paint.
- **Visuals:** Pure `--qx-black`. Grain and vignette present. Nothing else visible. The H1 and all service copy are in the DOM at `opacity: 0` — present for assistive tech and crawlers from the first frame.
- **Duration:** 200ms hold, or until fonts + the logo SVG are ready, whichever is longer. Hard cap 1200ms then proceed regardless.
- **Input gating:** `lenis.stop()` called on mount. Keyboard focus available; a visually-hidden skip button is the first tab stop.
- **State:** `beat = 'boot'`.
- **Interruptions:** Reduced motion → jump straight to the completed-logo state (§13). Tab hidden → `gsap.ticker` continues but the master timeline is `paused()` until `visibilitychange` fires visible.
- **Exit:** Assets ready and 200ms elapsed.

### 3.2 `dot-in` — Dot appears

- **Intent:** **Discovery** — establishes that something is alive and worth approaching.
- **Trigger:** `boot` completes.
- **Visuals:** A single `--qx-green` dot, radius 6px, at exact viewport center, scaling `0 → 1` with the glow fading in alongside. Then a breathing loop.
- **Duration:** 600ms entrance, `qx.out`. Breathe loop: `scale 1 → 1.12 → 1`, 2400ms, `sine.inOut`, `repeat: -1`, `yoyo: true`.
- **Breathing amplitude justification:** 12% scale over 2.4s is at the threshold of perceptible. It signals liveness (discovery) without becoming a pulse animation. Anything larger — or adding an opacity pulse on top — becomes decoration and must not be added.
- **Input gating:** Scroll still locked. First `pointermove` is armed.
- **State:** `beat = 'dot-in'`.
- **Interruptions:** User scrolls → wheel/touch is captured while Lenis is stopped; the first scroll gesture **skips the intro** (§3.6 skip path). Tab away → loop pauses, resumes on return at the same scale.
- **Exit:** First `pointermove` with movement > 4px, **or** 6000ms elapsed with no pointer (auto-advance straight to `logo-build`, skipping the cursor phase — see 3.6).

### 3.3 `pointer-wake` — First mouse movement

- **Intent:** **Confirmation** — the system acknowledges the user exists.
- **Trigger:** First `pointermove` where `pointerType === 'mouse'` and total movement > 4px.
- **Visuals:** The breathing loop stops mid-cycle and eases back to `scale: 1`. The native cursor is hidden (`cursor: none` on `<html>`). The dot begins following the pointer with a lag.
- **Duration:** 120ms to settle the loop, `qx.snap`. The follow lag is a `quickTo` with `duration: 0.35`, `qx.out` — continuous, not a beat.
- **Input gating:** Scroll still locked.
- **State:** `beat = 'pointer-wake'`, `pointerActive = true` (transient).
- **Interruptions:** Touch pointer → this beat never fires; see §14. Reduced motion → no follow lag, dot tracks 1:1 with no smoothing, or the intro is skipped entirely.
- **Exit:** Immediately chains into `cursor-morph` (they are one continuous 640ms sequence; they are separate beats only because the state machine needs the boundary).

### 3.4 `cursor-morph` — Dot becomes the mouse icon

- **Intent:** **Transition** — the dot reveals what it actually is, and hands the user an instrument.
- **Trigger:** `pointer-wake` settles.
- **Visuals:** The dot path morphs into the mouse-icon outline from the Qavyx logo — a 28×40 rounded capsule with a scroll wheel and a separately addressable left button. The glow tightens as the shape resolves. This morphed icon **is** the cursor from now on.
- **Duration:** 520ms, `qx.inOut`, via MorphSVGPlugin.
- **Input gating:** Scroll locked. Pointer follow continues throughout the morph.
- **State:** `beat = 'cursor-morph'`.
- **Interruptions:** Click during the morph → the morph is fast-forwarded (`tl.progress(1)`) and the click is honoured, not swallowed. Resize → the cursor node is in viewport pixel space (§4/§11), so no recompute is needed.
- **Exit:** Morph completes.

### 3.5 `click` — Left button affordance and click

- **Intent:** **Discovery** (the button fill signals the affordance), then **Confirmation** (the flash acknowledges the press).
- **Trigger:** `cursor-morph` completes.
- **Visuals:** The left-button sub-path fills to `--qx-green` at `opacity: 0.4` over 400ms and then **holds static**. It does not pulse or loop — one fade is enough to say "clickable"; a repeating pulse would be decoration. On `pointerdown` the fill jumps to `opacity: 1` for 90ms, then the travel begins.
- **Duration:** 400ms fade-in (`qx.out`); 90ms flash (`qx.snap`).
- **Input gating:** Scroll locked. `pointerdown` anywhere in the viewport is accepted — the whole hero is the target, not the icon.
- **State:** `beat = 'click'`.
- **Interruptions:** No click within 5000ms → auto-advance to `logo-build` from the current pointer position. Keyboard `Enter`/`Space` on the focused hero region → same as click.
- **Exit:** `pointerdown`, timeout, or keyboard activation.

### 3.6 `logo-build` — Travel and construction

- **Intent:** **Construction** — the user's click assembles the brand. This is the payoff beat and the only place a long duration is justified.
- **Trigger:** Click committed.
- **Visuals, in order:**
  1. **Travel (720ms, `qx.out`)** — the mouse icon leaves the pointer and moves along a MotionPath to its exact anchor inside the logo's bottom-right. `autoRotate: false` — the icon stays upright; rotating it would be flourish. The pointer-follow `quickTo` is killed the moment travel starts so the icon can't be dragged off course.
  2. **Rect draw (900ms, `qx.out`)** — the rounded rectangle draws from the mouse anchor point, both directions at once, via DrawSVGPlugin `0% 0%` → `0% 100%` with the path's start point placed at the anchor. The frame is drawn *by* the cursor that just arrived — that's the construction reading.
  3. **Letters (660ms total)** — `QAVYX` reveals left to right: 5 characters, each 300ms with a 90ms stagger, `qx.out`, clip-reveal from below plus `y: 0.4em → 0`. No per-letter rotation or scale.
  4. **Hold (600ms)** — nothing moves. The subhead and scroll affordance fade in at 300ms into the hold, 400ms, `qx.out`.
- **Duration:** 720 + 900 + 660 + 600 = **2880ms**, minus 180ms of deliberate overlap between travel-end and rect-draw-start = **2700ms**.
- **Input gating:** Scroll unlocks (`lenis.start()`) at the *start* of the hold, not the end — so a user who is ready to move on isn't held hostage for 600ms.
- **State:** `beat = 'logo-build'` → `'ready'`, `introComplete = true` persisted to `sessionStorage`.
- **Interruptions — the skip path:** Any scroll gesture, `Escape`, or the skip button at any point in Engine 1 calls `skipIntro()`: the master intro timeline seeks to its end (`.progress(1)`), the pointer-follow is killed, the native cursor is restored, `lenis.start()` is called, and state jumps to `ready`. The user lands on the completed logo with no visual discontinuity. This path must work from every beat.
- **Exit:** Hold completes, or skip.

### 3.7 `frame-scale` — Scroll transition

- **Intent:** **Transition** — scroll begins to convert the logo into a workspace.
- **Trigger:** `st-hero-pin` progress > 0.
- **Scroll distance:** 0 → 0.06 of pin progress (~30vh).
- **Visuals:** The wordmark and subhead fade out (`opacity 1 → 0`, `y: 0 → -16px`) and the mouse icon fades out of the logo. The frame rect's stroke shifts `--qx-line` → `--qx-green-dim`. The rect itself has not moved yet.
- **Easing:** Linear — this segment is scrubbed and must track the scroll 1:1. Applying an ease to a scrubbed segment makes it feel laggy, not smooth.
- **Input gating:** None. Full scroll control.
- **State:** `beat = 'frame-scale'`.
- **Interruptions:** Scroll up reverses it exactly — the segment is a pure scrub with no side effects. Resize → `invalidateOnRefresh` recomputes the geometry (§9).
- **Exit:** Progress 0.06.

### 3.8 `frame-expand` — The rectangle becomes the design frame

- **Intent:** **Construction** — the logo's container is revealed to be the workspace.
- **Trigger:** Pin progress 0.06.
- **Scroll distance:** 0.06 → 0.16 (~50vh).
- **Visuals:** The **same** `<rect>` element animates its `x`, `y`, `width`, `height` and `rx` attributes from the logo geometry to `70vw × 70vh` centered, `rx: 20`. Because these are attributes and not a transform, the 1.5px stroke stays exactly 1.5px and the corners stay exactly 20px — a `scale` transform would thicken the stroke by ~4× and distort the radius. The interior fills to `--qx-ink`. The first service panel fades in at 0.13.
- **Easing:** Linear (scrubbed).
- **Input gating:** None.
- **State:** `beat = 'frame-expand'`.
- **Interruptions:** Reverses cleanly. On resize mid-beat, the tween's end values are recomputed via `invalidateOnRefresh: true`.
- **Exit:** Progress 0.16. The frame is now fixed for the rest of the pin.

### 3.9 `services` — Horizontal carousel

- **Intent:** **Navigation** — vertical scroll moves the user through content laid out horizontally.
- **Trigger:** Pin progress 0.16.
- **Scroll distance:** 0.16 → 0.88 (**360vh**), 4 transitions of 90vh between 5 services.
- **Services (fixed — these are the content contract):**

  | # | Title | Description | Slug |
  |---|---|---|---|
  | 1 | Product Engineering | Web and mobile applications built to ship and to scale. | `product-engineering` |
  | 2 | Platform & Cloud | Infrastructure, APIs and data pipelines that stay up. | `platform-cloud` |
  | 3 | Product Design | Interface, interaction and the design systems underneath. | `product-design` |
  | 4 | AI Integration | Language models wired into real product workflows. | `ai-integration` |
  | 5 | Team Augmentation | Senior engineers embedded directly in your team. | `team-augmentation` |

- **Panel layout:** Each panel is the full inner width of the frame. Left column (55%): mono index `01 / 05`, display title (48px), body description (20px, max 42ch), CTA link. Right column (45%): the supporting visual, a static SVG diagram per service.
- **Mapping:** the track translates `x` from `0` to `-(trackWidth - frameInnerWidth)` linearly across the segment. `activeIndex = Math.round(segmentProgress * 4)`.
- **Panel transitions:** the **only** per-panel animation is opacity — inactive panels sit at `opacity: 0.25`, the active panel at `1`, cross-fading over the middle 40% of each step. No per-element stagger on entry. The horizontal movement already communicates navigation; adding staggered title/description/CTA entrances would be motion that says nothing the translation doesn't already say.
- **Active indicator:** mono counter `03 / 05` bottom-left of the frame, plus a 5-segment progress rule bottom-right where the active segment is `--qx-green`.
- **Snap:** `snap: { snapTo: 1/4, duration: {min: 0.15, max: 0.4}, delay: 0.05, ease: 'qx.inOut' }` on the pin trigger, scoped to the carousel range.
- **Drag/swipe:** Desktop no. Touch yes — see §14.
- **Keyboard:** the CTA of each panel is a tab stop. Tabbing to a CTA scrolls the window to that panel's scroll position (`lenis.scrollTo`) rather than letting the browser scroll the translated track into view (§13). `←`/`→` when the carousel region has focus move one panel; `Home`/`End` jump to first/last.
- **Interruptions:** A fast flick can cross several panels — that's fine and expected; snap resolves it. Scroll up steps back. Resize recomputes `trackWidth` on refresh.
- **Exit:** Progress 0.88.

### 3.10 `frame-exit` — Frame becomes the navbar logo

- **Intent:** **Transition** — the workspace collapses back into the brand mark and hands scroll back to the page.
- **Trigger:** Pin progress 0.88.
- **Scroll distance:** 0.88 → 1.0 (**60vh**).
- **Visuals:** Panels fade to 0 (0.88–0.92). Then the same rect animates its attributes down to the navbar logo box — top-left, 132×50, `rx: 12` — while the wordmark fades back in at navbar scale inside it. The navbar itself exists in the DOM from the start with `opacity: 0` and `pointer-events: none`; at 0.97 it becomes opaque and interactive, and the animated rect fades out as the real navbar logo fades in, cross-faded over the final 3% so there is no popping.
- **Easing:** Linear (scrubbed).
- **State:** `beat = 'frame-exit'` → `'done'`.
- **Exit:** Pin ends, `pinSpacing` releases, normal document scroll continues. The navbar becomes `position: sticky`.

---

## 4. Information Architecture

### Document outline

```
<body>
  <a class="skip">Skip to content</a>          ← first tab stop
  <header id="qx-nav">                          ← opacity 0 until frame-exit
    <a href="/">Qavyx</a>  <nav>…</nav>
  </header>
  <main id="content">
    <section id="qx-hero" aria-label="Qavyx">    ← the pinned section
      <h1>Qavyx</h1>                             ← real text, present at first paint
      <p>Software and product engineering…</p>
      <svg id="qx-stage" aria-hidden="true">…</svg>   ← all geometry, decorative
      <section aria-label="Services">
        <ol>                                     ← 5 <li>, real content
          <li><h2>Product Engineering</h2><p>…</p><a>See the work</a></li>
          …
        </ol>
      </section>
    </section>
    … rest of page …
  </main>
```

**The rule:** every word a user needs is real DOM text outside the SVG. The `#qx-stage` SVG contains only geometry — the dot/cursor node, the frame rect, guides — and is `aria-hidden="true"`. The wordmark is the `<h1>`, styled as the logo letterforms, not an SVG path. This is why SplitText works on it, why it's crawlable, and why a JS-disabled visitor gets a readable page.

### Content model

```ts
type ServiceSlug =
  | 'product-engineering' | 'platform-cloud' | 'product-design'
  | 'ai-integration' | 'team-augmentation';

interface Service {
  slug: ServiceSlug;
  index: number;            // 1-based, rendered as "01"
  title: string;
  description: string;      // ≤ 140 chars
  ctaLabel: string;
  ctaHref: string;
  visual: ServiceVisual;
}

interface ServiceVisual {
  component: 'diagram-stack' | 'diagram-graph' | 'diagram-grid'
           | 'diagram-flow' | 'diagram-team';
  alt: string;              // '' when purely decorative
}

interface HeroCopy {
  wordmark: string;         // 'Qavyx'
  subhead: string;
  scrollLabel: string;
}
```

Content lives in `content/services.ts` as a typed `const` array. No CMS: five items that change a few times a year do not justify a fetch, and a static array means the panels are server-rendered and crawlable.

### Routing and SEO

Single route `/`. CTAs link to `/work#<slug>`. A deep link to `/#services` scrolls past the hero: on mount, if `location.hash` is present, skip the intro immediately and `ScrollTrigger.refresh()` before scrolling.

`app/page.tsx` exports `metadata` with title, description, `openGraph`, and `twitter` card. A JSON-LD `Organization` block plus five `Service` entries is injected as a `<script type="application/ld+json">` in the layout.

**No-JS / crawler output:** black page, white wordmark, subhead, and the five services as a plain vertical list with working CTA links. This is the same DOM the reduced-motion path renders (§13) — one fallback, not two.

---

## 5. Component Architecture

```
app/page.tsx                          [server]
└── HeroSection                       [client] — orchestrator, owns the master timelines
    ├── HeroCopy                      [server-renderable] h1 + subhead + scroll label
    ├── HeroStage                     [client] the single <svg>, imperative
    │   ├── CursorNode                dot → mouse icon; NEVER unmounts
    │   ├── FrameRect                 the one <rect>; NEVER unmounts
    │   └── StageGuides               static crosshair marks, opacity-only
    ├── ServicesCarousel              [client]
    │   ├── ServiceTrack              the translated container
    │   │   └── ServicePanel × 5      [server-renderable content]
    │   └── CarouselIndicator         counter + progress rule
    ├── SkipIntroButton               [client] visually hidden until focused
    └── DevOverlay                    [client] dev only, tree-shaken in prod
NavBar                                [client] opacity driven by frame-exit
```

| Component | Boundary | Style | Never re-renders on |
|---|---|---|---|
| `HeroSection` | client | Orchestrator | pointer move, scroll |
| `HeroStage` | client | Imperative — GSAP owns everything inside | anything except viewport resize |
| `CursorNode` | client | Imperative | everything — it is written to by `quickTo` only |
| `FrameRect` | client | Imperative | everything |
| `ServicesCarousel` | client | Declarative shell, imperative track | pointer move, scroll progress |
| `ServicePanel` | server content, client wrapper | Declarative | scroll progress (opacity is a GSAP-set style) |
| `CarouselIndicator` | client | Declarative | scroll progress — reads `activeIndex` only, which changes 4 times total |
| `NavBar` | client | Imperative opacity | scroll progress |

### Props contracts

```ts
interface HeroSectionProps { services: readonly Service[]; copy: HeroCopy }
interface HeroStageProps { onReady: (refs: StageRefs) => void }
interface StageRefs {
  svg: SVGSVGElement; cursor: SVGPathElement;
  cursorButton: SVGPathElement; frame: SVGRectElement;
}
interface ServicesCarouselProps { services: readonly Service[]; onReady: (refs: CarouselRefs) => void }
interface CarouselRefs { track: HTMLDivElement; panels: HTMLElement[] }
interface ServicePanelProps { service: Service; isFirst: boolean }
```

### Hooks

| Hook | Signature | Responsibility |
|---|---|---|
| `useLenis` | `(enabled: boolean) => Lenis \| null` | Creates the Lenis instance, wires it to `gsap.ticker` and `ScrollTrigger.update`, destroys on unmount |
| `useBeatMachine` | `() => { beat: Beat; send: (e: BeatEvent) => void }` | Selector over the Zustand store |
| `usePointerFollow` | `(target: SVGElement \| null, enabled: boolean) => void` | Attaches the passive `pointermove` listener and the `quickTo` setters; never causes a render |
| `useReducedMotion` | `() => boolean` | `matchMedia` with SSR-safe default `false`, subscribes to changes |
| `useDeviceTier` | `() => 'high' \| 'low'` | `deviceMemory`/`hardwareConcurrency` probe, computed once |
| `useHeroTimeline` | `(refs, opts) => void` | Builds the master timelines inside `useGSAP`; the only place GSAP is constructed |

Each is a hook rather than a component because none renders anything — they attach behaviour to refs. Making any of them a component would force a render boundary where we specifically need none.

### Ref strategy

Children call `onReady(refs)` in their own `useGSAP` on mount. `HeroSection` collects them into a single `stageRefs` ref object and builds timelines once all are present. No prop-drilling of refs, no `forwardRef` chains, and the orchestrator holds the only GSAP context.

### Ownership rule

| Property | Owner | Note |
|---|---|---|
| `transform`, `opacity` on stage elements | GSAP | React must never set these inline |
| SVG `x/y/width/height/rx/d` | GSAP | via `attr:` |
| `className` | React | GSAP never touches classes |
| Text content, DOM structure | React | GSAP never inserts or removes nodes except SplitText |
| Scroll position | Lenis | Nothing else calls `window.scrollTo` |

Conflict case: SplitText *does* mutate the DOM inside the `<h1>`. Resolution — split once after fonts load, keep the original text in `aria-label` on the h1, and call `.revert()` in the `useGSAP` cleanup before React can unmount it.

### React 19 / StrictMode

All GSAP construction happens inside `useGSAP(() => {...}, { scope, dependencies })` from `@gsap/react`. It wraps `gsap.context()` and reverts on cleanup, so StrictMode's double-invoke creates and immediately reverts the first context. Any event listener added inside must be added via `contextSafe`. **No `gsap.to()` may be called outside a `useGSAP` scope or a `contextSafe` callback** — that is the single rule that prevents the double-animation and orphaned-tween bugs.

`CursorNode` and `FrameRect` must never unmount for the life of the hero. That forbids conditionally rendering them per beat, and forbids keying them on anything. Beat changes toggle their attributes, never their existence.

No component renders an HTML `<canvas>`.

---

## 6. Folder Structure

```
qavyx/
├── app/
│   ├── layout.tsx                 root layout, fonts, JSON-LD
│   ├── page.tsx                   [server] loads content, renders HeroSection
│   ├── globals.css                Tailwind directives + :root tokens
│   └── opengraph-image.tsx
├── components/
│   ├── hero/
│   │   ├── HeroSection.tsx        orchestrator (client)
│   │   ├── HeroCopy.tsx           h1, subhead, scroll label
│   │   ├── HeroStage.tsx          the single <svg id="qx-stage">
│   │   ├── CursorNode.tsx         the morphing dot/mouse path
│   │   ├── FrameRect.tsx          the one <rect id="qx-frame">
│   │   ├── StageGuides.tsx        static registration marks
│   │   └── SkipIntroButton.tsx
│   ├── services/
│   │   ├── ServicesCarousel.tsx
│   │   ├── ServiceTrack.tsx
│   │   ├── ServicePanel.tsx
│   │   ├── CarouselIndicator.tsx
│   │   └── visuals/               5 static SVG diagram components
│   ├── nav/NavBar.tsx
│   └── dev/DevOverlay.tsx         dev-only beat/progress readout
├── motion/
│   ├── gsap.ts                    ⚠ plugin registration singleton
│   ├── eases.ts                   qx.out / qx.inOut / qx.snap
│   ├── lenis.ts                   Lenis factory + ticker wiring
│   ├── geometry.ts                computeLogoGeometry / computeFrameGeometry
│   └── timelines/
│       ├── introTimeline.ts       beats boot → logo-build
│       ├── expandTimeline.ts      frame-scale + frame-expand
│       ├── carouselTimeline.ts    services
│       └── exitTimeline.ts        frame-exit
├── hooks/                         useLenis, usePointerFollow, useBeatMachine,
│                                  useReducedMotion, useDeviceTier, useHeroTimeline
├── state/heroStore.ts             Zustand store + beat machine
├── content/services.ts            the 5 services, typed const
├── types/                         hero.ts, motion.ts
├── lib/                           cn.ts, env.ts
├── styles/tokens.css              --qx-* custom properties
├── public/                        grain.png, fonts/Satoshi-*.woff2
└── tests/                         unit/, e2e/, visual/
```

### Layer rules

```
app ──> components ──> hooks ──> state ──> types
                │                  │
                └──> motion ───────┘
                       │
                       └──> types
content ──> types        (content imports nothing else)
```

| Layer | May import | Must not import |
|---|---|---|
| `components/` | hooks, state, motion, content, types, lib | `gsap` directly |
| `motion/` | `gsap`, `lenis`, types | any component, any hook |
| `hooks/` | motion, state, types | components |
| `state/` | types | everything else |
| `content/` | types | everything else |

Enforced with `eslint-plugin-import`'s `no-restricted-paths` in `.eslintrc`, with one zone per rule above. The point is that no component ever calls `gsap.to()` directly — timelines are built in `motion/timelines/` and consumed through `useHeroTimeline`. This is what makes the animation testable in isolation (§17).

**`motion/gsap.ts` is a singleton.** It calls `gsap.registerPlugin(...)` and `CustomEase.create(...)` at module scope and exports `gsap`. Every other module imports `gsap` *from this file*, never from the package. Registering twice re-creates the CustomEase definitions and can invalidate timelines that already reference them by name. One import path, enforced by an ESLint `no-restricted-imports` rule on the raw `gsap` specifier outside `motion/`.

Path aliases in `tsconfig.json`: `@/components/*`, `@/motion/*`, `@/hooks/*`, `@/state/*`, `@/content/*`, `@/types/*`.

Barrels only in `types/` and `content/`. No barrel in `motion/` or `components/` — they defeat tree-shaking of the dynamically imported motion layer.

---

## 7. Animation Timeline

### Engine 1 — time axis (ms)

```
0     200        800                    1420  1820 1910   2630        3530      4190   4790
│ boot │ dot-in   │ …breathe loop…      │morph│fade │flash│ travel     │ draw    │letters│hold│
│      │ scale0→1 │ 1↔1.12 @2400 yoyo   │ 520 │ 400 │ 90  │ 720        │ 900     │ 660   │600 │
                   ↑ pointer-wake (120ms, whenever it fires)
                                                     └─180ms overlap─┘
                                        lenis.start() ────────────────────────────────┘
```

The loop segment is indefinite — it holds until the pointer wakes it. The numbers above assume a user who moves the mouse immediately; the wall-clock total from first paint to `ready` is ~5.2s in that case, and ~2.9s if the user was already moving the mouse on load.

### Engines 2–3 — scroll axis (pin progress, total 500vh)

```
0.00   0.06        0.16                                              0.88      1.00
│ scale │  expand   │  services  ①──②──③──④──⑤                        │  exit    │
│ 30vh  │   50vh    │                    360vh                        │   60vh   │
        └ rect attrs animate ┘  └ track x: 0 → -(trackW - innerW) ────┘
```

### Keyframe table

| # | Beat | Element | Property | From | To | Start | Dur | Ease | Intent |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `dot-in` | `#qx-cursor` | `scale` | 0 | 1 | 0 | 600ms | `qx.out` | Discovery |
| 2 | `dot-in` | `#qx-cursor` | `opacity` | 0 | 1 | 0 | 300ms | `qx.out` | Discovery |
| 3 | `dot-in` | `#qx-cursor` | `scale` | 1 | 1.12 | 600ms | 2400ms ⟲ | `sine.inOut` | Discovery |
| 4 | `pointer-wake` | `#qx-cursor` | `scale` | current | 1 | on event | 120ms | `qx.snap` | Confirmation |
| 5 | `cursor-morph` | `#qx-cursor` | `morphSVG` | dot path | `#qx-mouse-body` | 0 | 520ms | `qx.inOut` | Transition |
| 6 | `cursor-morph` | `#qx-cursor` | `--glow-blur` | 12px | 6px | 0 | 520ms | `qx.inOut` | Transition |
| 7 | `click` | `#qx-mouse-lmb` | `opacity` | 0 | 0.4 | 0 | 400ms | `qx.out` | Discovery |
| 8 | `click` | `#qx-mouse-lmb` | `opacity` | 0.4 | 1 | on down | 90ms | `qx.snap` | Confirmation |
| 9 | `logo-build` | `#qx-cursor` | `motionPath` | pointer pos | logo anchor | 0 | 720ms | `qx.out` | Construction |
| 10 | `logo-build` | `#qx-frame` | `drawSVG` | `0% 0%` | `0% 100%` | 540ms | 900ms | `qx.out` | Construction |
| 11 | `logo-build` | `.qx-char` × 5 | `yPercent` | 110 | 0 | 1440ms | 300ms, stagger 90ms | `qx.out` | Construction |
| 12 | `logo-build` | `.qx-char` × 5 | `opacity` | 0 | 1 | 1440ms | 200ms, stagger 90ms | `qx.out` | Construction |
| 13 | `logo-build` | `.qx-subhead` | `opacity`, `y` | 0, 12 | 1, 0 | 2400ms | 400ms | `qx.out` | Discovery |
| 14 | `frame-scale` | `.qx-wordmark` | `opacity`, `y` | 1, 0 | 0, −16 | p 0.00 | p 0.06 | linear | Transition |
| 15 | `frame-scale` | `#qx-cursor` | `opacity` | 1 | 0 | p 0.00 | p 0.04 | linear | Transition |
| 16 | `frame-scale` | `#qx-frame` | `stroke` | `--qx-line` | `--qx-green-dim` | p 0.02 | p 0.06 | linear | Transition |
| 17 | `frame-expand` | `#qx-frame` | `attr: x,y,width,height,rx` | logo box | 70% box | p 0.06 | p 0.16 | linear | Construction |
| 18 | `frame-expand` | `#qx-frame` | `attr: fill` | none | `--qx-ink` | p 0.10 | p 0.14 | linear | Construction |
| 19 | `frame-expand` | `.qx-panel[0]` | `opacity` | 0 | 1 | p 0.13 | p 0.16 | linear | Discovery |
| 20 | `services` | `#qx-track` | `x` | 0 | `-(trackW − innerW)` | p 0.16 | p 0.88 | linear | Navigation |
| 21 | `services` | `.qx-panel` | `opacity` | 0.25 | 1 | per step | 40% of step | `qx.inOut` | Navigation |
| 22 | `services` | `.qx-indicator-seg` | `background` | `--qx-line` | `--qx-green` | per step | 120ms | `qx.snap` | Confirmation |
| 23 | `frame-exit` | `.qx-panel` | `opacity` | 1 | 0 | p 0.88 | p 0.92 | linear | Transition |
| 24 | `frame-exit` | `#qx-frame` | `attr: x,y,width,height,rx` | 70% box | navbar box | p 0.92 | p 0.99 | linear | Transition |
| 25 | `frame-exit` | `.qx-wordmark` | `opacity` | 0 | 1 | p 0.94 | p 0.98 | linear | Transition |
| 26 | `frame-exit` | `#qx-nav` | `opacity` | 0 | 1 | p 0.97 | p 1.00 | linear | Transition |
| 27 | `frame-exit` | `#qx-stage` | `opacity` | 1 | 0 | p 0.97 | p 1.00 | linear | Transition |

Rows 1–13 are **played** (time-based) and interruptible via `skipIntro()`. Rows 14–27 are **scrubbed** and inherently reversible. Row 3 is the only loop in the entire experience.

Scrubbed rows are all linear on purpose: an ease inside a scrubbed tween makes the element lag behind the scroll pointer, which reads as unresponsive rather than smooth. Smoothing belongs in the `scrub` value and in Lenis, not in the tween.

### Stagger detail

Wordmark: 5 characters, `stagger: 0.09`, `from: 'start'`, no grid. Total span 1440 → 2100ms. Deliberately left-to-right because the mark reads left-to-right — `from: 'random'` or `'center'` would be arbitrary.

### Reduced motion

| Beat | Reduced-motion behaviour |
|---|---|
| `boot` → `logo-build` | **Entire intro skipped.** Completed logo renders immediately, no morph, no travel, no draw. `lenis.stop()` is never called. |
| `frame-scale` / `frame-expand` | Frame renders at its 70% size immediately. No scale, no attribute animation. |
| `services` | **No pin, no horizontal scroll.** The 5 panels render as a vertical stacked list in normal document flow, full opacity. |
| `frame-exit` | Navbar is `sticky` and visible from the start. No transition. |
| Cursor | Native cursor never hidden. `CursorNode` is not rendered. |

The intent survives even though the motion doesn't: construction becomes "already built", navigation becomes "scroll the list". This path shares its DOM with the no-JS output, so it is exercised constantly rather than rotting.

---

## 8. GSAP Timeline Architecture

### Hierarchy

```
introMaster (paused, time-based)          expandMaster (scrubbed by st-hero-pin)
├─ label "boot"                           ├─ label "frame-scale"     @ 0.00
├─ tlDotIn()          @ "boot:end"        ├─ tlFrameScale()          @ 0.00
├─ label "dot-in:end"                     ├─ label "frame-expand"    @ 0.06
├─ tlPointerWake()    (inserted on event) ├─ tlFrameExpand()         @ 0.06
├─ tlCursorMorph()    @ "pointer-wake:end"├─ label "services"        @ 0.16
├─ tlClickInvite()    @ "cursor-morph:end"├─ tlCarousel()            @ 0.16
├─ label "click"      (waits for event)   ├─ label "frame-exit"      @ 0.88
├─ tlLogoBuild()      @ "click:end"       └─ tlFrameExit()           @ 0.88
└─ label "ready"
```

Two masters, not one. Engine 1 is time-based and gated on user events; Engines 2–3 are scrubbed by scroll. Trying to run both from one timeline means either the scrub fights the playhead or the intro can't pause for input. The handoff is a single line at the end of `introMaster`: `onComplete` sets `beat = 'ready'` and calls `lenis.start()`. `expandMaster` is created up front but its ScrollTrigger simply has nothing to scrub until scroll is unlocked.

### Labels

| Label | Guarantees | Sought by |
|---|---|---|
| `boot:end` | Fonts loaded, stage measured | — |
| `dot-in:end` | Dot at scale 1, breathe loop running | `pointer-wake` insertion point |
| `pointer-wake:end` | Loop killed, scale exactly 1 | `cursor-morph` |
| `cursor-morph:end` | Cursor path is the mouse shape | `click` affordance |
| `click:end` | Flash complete, pointer follow killed | `logo-build` |
| `ready` | Logo complete, scroll unlocked | `skipIntro()` seeks here |

### Factory contract

```ts
type BeatTimeline = (refs: StageRefs, cfg: MotionConfig) => gsap.core.Timeline;

interface MotionConfig {
  reducedMotion: boolean;
  tier: 'high' | 'low';
  geometry: LogoGeometry;   // recomputed on resize
}
```

Every beat is a factory returning a **paused** timeline that touches only the refs it is given. This is why they're testable — a Vitest test can call `tlCursorMorph(mockRefs, cfg)`, seek to `progress(0.5)`, and assert the DOM attribute, with no React and no scroll.

Composition uses labels rather than numeric offsets wherever a beat's duration might change: `introMaster.add(tlLogoBuild(refs, cfg), 'click:end')`. The one place a numeric offset is used is the deliberate 180ms overlap between travel and draw: `tlLogoBuild` handles that internally with `'-=0.18'`.

### Pointer follow

The cursor is driven by two `quickTo` setters created once:

```ts
const xTo = gsap.quickTo('#qx-cursor', 'x', { duration: 0.35, ease: 'qx.out' });
const yTo = gsap.quickTo('#qx-cursor', 'y', { duration: 0.35, ease: 'qx.out' });
```

The `pointermove` handler calls `xTo(e.clientX)` / `yTo(e.clientY)` and nothing else — no state write, no render. Calling `gsap.to()` per event would allocate a new tween on every one of ~120 events/second and each would fight the previous for the same property. `quickTo` reuses one tween and just re-targets it. The 0.35s duration is what produces the lag; the raw pointer position is never used directly.

`xTo`/`yTo` are killed at the start of `logo-build` so the MotionPath owns the cursor's position from then on.

### Plugin specifics

- **MorphSVG** — `morphSVG: { shape: '#qx-mouse-body', shapeIndex: 3, type: 'rotational' }`. The dot is authored as a path with the same segment count as the mouse body (§11); `shapeIndex` is tuned by hand once using `MorphSVGPlugin.convertToPath` output and then hard-coded. Do not leave it on `'auto'` — the auto choice is stable but not necessarily the visually shortest, and this morph is on screen for half a second.
- **DrawSVG** — the frame rect must be a `<path>`, not a `<rect>`, for DrawSVG to work on it. **This is the one place the frame is not a `<rect>`.** Resolution: `#qx-frame` is a `<path>` with rounded-corner arc commands throughout, and the "attribute animation" in §7 rows 17/24 animates its `d` via a `computeFramePath(box)` helper that regenerates the path string, driven by a proxy object GSAP tweens. Same element, same crisp stroke, and DrawSVG works.
- **MotionPath** — `{ path: travelPath, align: travelPath, alignOrigin: [0.5, 0.5], autoRotate: false }`. The path is regenerated from `computeTravelPath(from, to)` at click time, so it always starts at the cursor's actual position.
- **SplitText** — `new SplitText('.qx-wordmark', { type: 'chars', charsClass: 'qx-char' })`, run **after** `document.fonts.ready`. `revert()` in the `useGSAP` cleanup. The `<h1>` keeps `aria-label="Qavyx"` so the split spans never reach a screen reader as five separate letters.

### Cleanup and resize

Everything is built inside one `useGSAP(() => {...}, { scope: heroRef, dependencies: [reducedMotion] })`. On cleanup GSAP reverts every tween and removes the inline styles it added. The `reducedMotion` dependency means toggling the OS setting rebuilds the entire hero from scratch — correct, and rare enough that the cost doesn't matter.

Resize: `expandMaster`'s ScrollTrigger uses `invalidateOnRefresh: true`, so on refresh the tweens re-read their start/end values from `computeLogoGeometry(vw, vh)` and `computeFrameGeometry(vw, vh)`. Nothing is hard-coded in pixels inside a tween.

Interruption: `skipIntro()` calls `introMaster.progress(1)`, which fires all `onComplete`s in order and leaves every element in its final state. It does not call `kill()` — killing mid-flight leaves whatever inline styles happened to be applied at that instant.

---

## 9. ScrollTrigger Architecture

### Lenis wiring

Lenis scrolls the **window**, not a wrapper element. That means **`ScrollTrigger.scrollerProxy` is not needed** — ScrollTrigger reads `window.scrollY` and Lenis writes to it. `scrollerProxy` is only required when the scroller is a non-window element. Getting this wrong is the most common Lenis+ScrollTrigger integration bug.

The wiring, in `motion/lenis.ts`:

```
lenis = new Lenis({ autoRaf: false, lerp: 0.1, wheelMultiplier: 1,
                    touchMultiplier: 1.6, smoothWheel: true, syncTouch: false })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

- `autoRaf: false` — Lenis must not run its own rAF loop. One loop, owned by `gsap.ticker`.
- `gsap.ticker` passes seconds; `lenis.raf` expects milliseconds.
- `lagSmoothing(0)` — GSAP's lag smoothing skips time forward after a long frame, which desynchronises the scrub from Lenis's own interpolation and produces a visible jump. Off.
- `lerp: 0.1` rather than `duration` — lerp mode is frame-rate independent and behaves better with scrubbed timelines.
- `syncTouch: false` — on touch, native scrolling is left alone. Smoothing touch scroll on iOS fights the platform and breaks momentum.

**Why Lenis over ScrollSmoother**, given 3.13 makes both free: Lenis needs no wrapper/content DOM structure, which matters because our pinned section is a direct child of `<main>`; it is ~3 KB against ScrollSmoother's ~30 KB; and `position: fixed` elements behave normally under Lenis whereas ScrollSmoother's transform-based content wrapper breaks them.

**Scroll lock during Engine 1:** `lenis.stop()` only. Not `overflow: hidden` — that removes the scrollbar and shifts layout, and it blocks keyboard scrolling for users who never see the animation. `lenis.stop()` leaves the document scrollable by assistive tech and by the skip path. Any wheel or touch gesture while stopped is detected by a passive listener and triggers `skipIntro()`.

### ScrollTrigger instances

| id | trigger | start | end | scrub | pin | anticipatePin | invalidateOnRefresh | Drives |
|---|---|---|---|---|---|---|---|---|
| `st-hero-pin` | `#qx-hero` | `top top` | `+=500%` | `1` | `true` | `1` | `true` | `expandMaster` (all of Engines 2–3) |
| `st-nav-sticky` | `#qx-hero` | `bottom top+=64` | — | — | `false` | — | — | Toggles `.is-stuck` on the navbar |

Only one pinned trigger. Everything in Engines 2 and 3 is a segment of one timeline scrubbed by `st-hero-pin`, which is why the beat boundaries in §7 are progress values rather than separate triggers. Multiple pinned triggers on the same section is the standard way to produce pin-jump bugs; one trigger cannot conflict with itself.

`refreshPriority` is left at the default `0` because there is exactly one pinned trigger. If a second pinned section is added later, `st-hero-pin` must get `refreshPriority: 1` so it refreshes first.

### Scroll budget

```
pinDistance = 500vh
  = expansion (80vh)
  + carousel ((SERVICES - 1) × 90vh = 360vh)
  + exit (60vh)
```

Written as `end: "+=500%"` — percent of the trigger's height, and the hero is `100vh`, so 500% = 500vh. If the service count changes, this string and the progress boundaries in §7 must change together; `motion/geometry.ts` exports the constants so the change is one edit.

`scrub: 1` — a one-second catch-up. `scrub: true` (instant) makes the frame expansion feel jittery because it inherits the raw wheel delta; values above ~1.5 make the carousel feel disconnected from the wheel, which stops reading as navigation.

### Snap

```ts
snap: {
  snapTo: (value) => {
    if (value < 0.16 || value > 0.88) return value;   // don't snap outside the carousel
    const local = (value - 0.16) / 0.72;
    return 0.16 + Math.round(local * 4) / 4 * 0.72;
  },
  duration: { min: 0.15, max: 0.4 },
  delay: 0.05,
  ease: 'qx.inOut',
}
```

Snapping only inside the carousel range: snapping the expansion would make the frame jump to a size the user didn't ask for.

### Refresh lifecycle

| Event | Action |
|---|---|
| `resize` (width change, or height change > 120px) | Debounce 150ms → `ScrollTrigger.refresh()` |
| `resize` (height change ≤ 120px) | **Ignore.** This is the mobile URL bar. Refreshing here causes a visible jump on every scroll direction change. |
| `orientationchange` | `ScrollTrigger.refresh()` after a 300ms delay (iOS reports stale dimensions immediately after) |
| `document.fonts.ready` | `ScrollTrigger.refresh()` — the wordmark's measured size changes |
| Service visual images decoded | `ScrollTrigger.refresh()` once, after `Promise.all(imgs.map(i => i.decode()))` |
| App Router navigation away | `useGSAP` cleanup reverts the context; additionally `ScrollTrigger.getAll().forEach(t => t.kill())` and `lenis.destroy()` in the effect cleanup |

`ScrollTrigger.normalizeScroll()` is **not** used. It is designed to take over native scrolling on touch, which conflicts directly with Lenis. Use one or the other.

### Debugging

`DevOverlay` (dev-only, `process.env.NODE_ENV !== 'production'`) renders a fixed panel showing: current beat, `st-hero-pin` progress to 3dp, active service index, Lenis velocity, and current fps. `markers: true` is enabled via a `?markers` query param rather than a code edit.

**Diagnosing a pin jump:** it is almost always (a) a refresh firing on a URL-bar resize, (b) `invalidateOnRefresh` missing so a tween holds a stale pixel value, or (c) an image loading after refresh and changing document height. Check in that order.

### Pitfalls specific to this design

| Pitfall | Mitigation |
|---|---|
| `lenis.stop()` during Engine 1 makes ScrollTrigger think the page can't scroll, so `st-hero-pin` computes a zero-height pin | Create `st-hero-pin` with the hero already at full height; `lenis.stop()` doesn't change document height, so this is safe — but do **not** set `overflow: hidden`, which would |
| Pinning applies `transform` to the pin-spacer; a `position: fixed` child inside a transformed ancestor becomes containing-block-relative | The cursor node lives in `#qx-stage`, which is `position: fixed` and a **sibling** of the pinned content, not a child |
| Fast flick skips the snap | `snap.delay: 0.05` waits for scroll to settle; this is correct behaviour, not a bug |
| `end: "+=500%"` recalculates on refresh and shifts everything below the hero | Expected. `pinSpacing: true` reserves the space; the shift only occurs on genuine resize |
| Safari 16 reports `100vh` including the URL bar | Hero is sized `100svh`, and `end` is percent-based so it follows |

---

## 10. State Management

**Zustand.** The store is read by three components and written by GSAP callbacks outside React's render cycle — Zustand's `subscribe` lets a GSAP `onUpdate` write without triggering a render, and `useStore(selector)` gives components a narrow subscription. `useReducer` + context would re-render every consumer on every beat change and offers no non-reactive write path. XState is the right shape for this state machine but adds ~15 KB for ten states with linear transitions.

### The reactive/transient split — the rule that keeps this at 60fps

| State | Kind | Where | Changes per second |
|---|---|---|---|
| `beat` | **Reactive** | Zustand | ~10 times total |
| `reducedMotion` | **Reactive** | Zustand | ~never |
| `tier` | **Reactive** | Zustand, computed once | never |
| `activeService` | **Reactive** | Zustand | 4 times total |
| `introComplete` | **Reactive** | Zustand + `sessionStorage` | once |
| `pointer.x`, `pointer.y` | **Transient** | `useRef` inside `usePointerFollow` | ~120 |
| `pointer.velocity` | **Transient** | ref | ~120 |
| `scrollProgress` | **Transient** | read from `st-hero-pin.progress` | ~60 |
| `morphProgress` | **Transient** | owned by the tween | ~60 |
| `hoverTarget` | **Transient** | ref | on hover |

Anything in the transient half **must never** be put in Zustand or `useState`. Pointer position in React state would re-render `HeroSection` and its whole subtree 120 times a second.

```ts
type Beat = 'boot' | 'dot-in' | 'pointer-wake' | 'cursor-morph' | 'click'
          | 'logo-build' | 'ready' | 'frame-scale' | 'frame-expand'
          | 'services' | 'frame-exit' | 'done';

type BeatEvent = 'ASSETS_READY' | 'POINTER_MOVE' | 'MORPH_DONE' | 'CLICK'
               | 'TIMEOUT' | 'BUILD_DONE' | 'SCROLL_START' | 'SKIP' | 'PIN_END';

interface HeroStore {
  beat: Beat;
  reducedMotion: boolean;
  tier: 'high' | 'low';
  activeService: number;        // 0-4
  introComplete: boolean;
  send: (event: BeatEvent) => void;
  setActiveService: (i: number) => void;
}
```

### Transitions

| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| `boot` | `ASSETS_READY` | `!reducedMotion` | `dot-in` | play `tlDotIn` |
| `boot` | `ASSETS_READY` | `reducedMotion` | `ready` | render final logo |
| `dot-in` | `POINTER_MOVE` | mouse pointer | `pointer-wake` | kill breathe loop |
| `dot-in` | `TIMEOUT` (6000ms) | — | `logo-build` | skip cursor phase |
| `pointer-wake` | — | auto | `cursor-morph` | play morph |
| `cursor-morph` | `MORPH_DONE` | — | `click` | show button affordance |
| `click` | `CLICK` | — | `logo-build` | flash, then travel |
| `click` | `TIMEOUT` (5000ms) | — | `logo-build` | travel from current pos |
| any Engine-1 | `SKIP` / `SCROLL_START` | — | `ready` | `introMaster.progress(1)`, `lenis.start()` |
| `logo-build` | `BUILD_DONE` | — | `ready` | `lenis.start()`, persist `introComplete` |
| `ready` | scroll progress > 0 | — | `frame-scale` | — |
| `frame-scale` → `frame-expand` → `services` → `frame-exit` | progress thresholds | — | — | driven by `st-hero-pin.onUpdate` |
| `frame-exit` | `PIN_END` | — | `done` | navbar sticky |

Beats 7–10 are derived from scroll progress in a single `onUpdate` that writes `beat` only when the value actually changes — 4 writes across 500vh, not 60 per second.

### GSAP ↔ state

GSAP **reads** state at build time via the `MotionConfig` passed to each factory. GSAP **writes** state only in `onComplete`/`onUpdate` callbacks, and only for the reactive fields. There is no path where a state change triggers a render that rebuilds a timeline mid-flight — the only dependency in `useGSAP` is `reducedMotion`.

### Persistence and hydration

`introComplete` is stored in `sessionStorage`. On a return visit within the session the intro is skipped to `ready`. Not `localStorage` — a returning visitor next week should see the hero again.

`reducedMotion`, `tier` and `introComplete` all derive from browser-only APIs. All three initialise to their SSR-safe defaults (`false`, `'high'`, `false`) and are set in a `useEffect` on mount. The hero renders its `boot` state on the server and the client agrees, so there is no hydration mismatch; the reduced-motion branch is taken one frame later, which is invisible because `boot` is a black screen anyway.

---

## 11. SVG Asset Structure

### The coordinate contract

There is **one** SVG: `#qx-stage`, `position: fixed`, full viewport, with `viewBox="0 0 {vw} {vh}"` updated on resize.

> **1 SVG user unit = 1 CSS pixel.**

That single decision removes every coordinate conversion in the project. `e.clientX` can be written straight to the cursor's `x` with no transform. The frame's geometry is computed in pixels. There is no nested viewBox, no `transform` on a wrapper `<g>`, and no scale factor to reconcile — because a scale factor is exactly what would make the frame's stroke and corner radius wrong during the expansion.

The wordmark is **not** in the SVG. It is the HTML `<h1>`, positioned absolutely over the stage. This is why SplitText works, why the text is accessible and crawlable, and why fonts render with normal hinting.

### Geometry functions (`motion/geometry.ts`)

```ts
interface Box { x: number; y: number; w: number; h: number; rx: number }
interface LogoGeometry {
  frame: Box;             // the rounded rect at logo scale
  wordmarkFontSize: number;
  wordmarkOrigin: { x: number; y: number };
  mouseAnchor: { cx: number; cy: number; w: number; h: number };
}

declare function computeLogoGeometry(vw: number, vh: number): LogoGeometry;
declare function computeFrameGeometry(vw: number, vh: number): Box;
declare function computeNavGeometry(vw: number): Box;
declare function computeFramePath(box: Box): string;      // rounded-rect path 'd'
declare function computeTravelPath(from: Pt, to: Pt): string;
```

| Value | Formula |
|---|---|
| `logoW` | `clamp(300, vw * 0.34, 520)` |
| `logoH` | `logoW * 0.375` |
| `logo.rx` | `logoH * 0.234` |
| `logo.x/y` | centered: `(vw - logoW)/2`, `(vh - logoH)/2` |
| `wordmarkFontSize` | `logoW * 0.145` |
| `mouseAnchor.cx/cy` | `logo.x + logoW * 0.855`, `logo.y + logoH * 0.62` |
| `mouseAnchor.w/h` | `logoW * 0.058`, `mouseW * 1.43` |
| frame (70%) | `x: vw*0.15, y: vh*0.15, w: vw*0.70, h: vh*0.70, rx: 20` |
| navbar box | `x: 24, y: 14, w: 132, h: 50, rx: 12` |

At `vw = 1440`: `logoW = 490`, `logoH = 184`, `rx = 43`, wordmark 71px, mouse 28×40 centered at `(+419, +114)` from the logo origin.

### Elements

| id | Element | Purpose | Nodes | Animated by |
|---|---|---|---|---|
| `#qx-frame` | `<path>` | The rounded rectangle → design frame → navbar logo. **Never unmounts.** | 9 | DrawSVG (build), `d` tween (expand/exit) |
| `#qx-cursor` | `<path>` | Dot → mouse icon → travels to anchor. **Never unmounts.** | 8 | MorphSVG, MotionPath, quickTo |
| `#qx-mouse-body` | `<path>` (hidden) | Morph target only, `display: none` | 8 | — |
| `#qx-mouse-lmb` | `<path>` | Left button; opacity only | 5 | opacity tween |
| `#qx-mouse-wheel` | `<rect>` | Scroll wheel detail; static | 1 | — |
| `#qx-guides` | `<g>` | 4 static corner registration marks | 8 | opacity only |

Total stage node count: **~40**. There is no particle field or grid to budget for, which is a direct consequence of the motion rule.

`#qx-frame` is a `<path>`, not a `<rect>`, because DrawSVG requires a path/line/polyline and cannot draw a `<rect>`. `computeFramePath` generates the rounded-rect `d` string from a `Box`, so the expansion tweens a proxy object `{x, y, w, h, rx}` and writes `d` in `onUpdate`. Same element throughout, stroke stays exactly 1.5px at every size.

### Morph authoring rules

The dot and the mouse body must have **identical segment counts and the same winding direction**, or MorphSVG will interpolate through a shape that looks like a crumpled bag.

Checklist for whoever authors the SVG:

1. Draw the mouse body as a rounded capsule: 4 arcs + 4 lines = 8 segments.
2. Draw the dot as a circle, then run it through `MorphSVGPlugin.convertToPath()` — a circle converts to 4 arcs. **Add 4 zero-length line segments** so it also has 8, distributed to match the mouse body's corners.
3. Both paths clockwise, both starting at the 12 o'clock position.
4. **Bake out all `transform` attributes** in the authoring tool. MorphSVG interpolates path data and ignores transforms, so a transformed path will jump to its untransformed position on the first frame.
5. Export with absolute commands.
6. Tune `shapeIndex` once by stepping `0…7` in the browser and pick the one with no visible rotation. Hard-code it (currently `3`).

DrawSVG rules for `#qx-frame`: one continuous path, no sub-paths, start point placed at the mouse anchor so the draw appears to originate from the cursor. `stroke-linecap: round`, `stroke-linejoin: round`. DrawSVG works by setting `stroke-dasharray` and `stroke-dashoffset`, which means the path must have a stroke and no `pathLength` override.

### Delivery and SVGO

Inline React components (`components/hero/*.tsx`) that return raw SVG elements — not a sprite, not an external file. Every path needs a stable id addressable by GSAP, and both sprites and `<img>` put the DOM out of reach.

`svgo.config.js` must disable:

| Plugin | Why |
|---|---|
| `cleanupIds` | Renames or strips the ids GSAP targets |
| `mergePaths` | Merges the left button into the body; both must stay addressable |
| `convertShapeToPath` (for `#qx-frame`) | Keep the hand-authored path structure |
| `removeViewBox` | The stage viewBox is load-bearing |
| `convertPathData` `{ applyTransforms: false }` off | We *want* transforms applied — but verify segment counts after, since this plugin can also change command types and break the morph pairing |

Run SVGO once at authoring time and commit the result. Do not put it in the build pipeline — a silent optimisation change would break the morph with no test failure.

### Accessibility markup

`#qx-stage` carries `aria-hidden="true"` and `focusable="false"`. It contains no text and no information. Every service visual is `<svg role="img" aria-label="…">` when it conveys meaning, `aria-hidden="true"` when purely illustrative — the five diagram visuals are illustrative and are hidden, because their content is already stated in the panel description.

ID collisions: every id is prefixed `qx-`. If a service visual ever needs a gradient or clipPath, it must namespace it as `qx-svc-{slug}-{name}` — duplicate SVG ids on a page resolve to the first match, which produces a bug that only appears when two visuals are on screen simultaneously.

### Filter budget

One `drop-shadow` on `#qx-cursor` only, via CSS. No `<filter>` elements. An SVG filter's region is computed over its bounding box; on a full-viewport stage that is a full-viewport offscreen buffer re-rasterised every frame, which is the single most expensive thing you can do in an SVG-only hero. A CSS `drop-shadow` on a 40px element is not.

---

## 12. Performance Strategy

### Frame budget

60fps = 16.7ms. Target allocation: **≤ 6ms** for GSAP updates + style recalc + paint, leaving headroom for Lenis, the browser's own work, and a dropped frame's worth of slack. On the low tier the target is 45fps (22ms), reached by cutting work, not by lowering the frame cap.

### What is and isn't cheap here

| Operation | Cost | Where used | Mitigation |
|---|---|---|---|
| `transform` / `opacity` on a DOM element | Compositor, free | Track translation, panel opacity | — |
| SVG `transform` via GSAP `x`/`y` | Not composited — SVG transforms repaint | Cursor follow | The cursor is 28×40px; the repaint region is tiny |
| SVG `d` attribute tween | Repaint of the path's bbox | Frame expansion, exit | One stroked path, no fill during expansion. ~2ms at full viewport |
| `stroke-dashoffset` (DrawSVG) | Repaint of the path bbox | Rect draw | 900ms, once, at logo size — not full viewport |
| SVG `<filter>` | Full-region offscreen buffer per frame | **Not used** | Banned (§11) |
| CSS `drop-shadow` on a small element | Cheap | Cursor glow | — |
| `width`/`height` on a DOM element | Layout | **Not used** — that's why the frame is SVG | — |

The frame expansion is the most expensive moment in the experience: a full-viewport stroked path repainting each frame while five panels fade in. Measured budget for this segment is 8ms/frame; if it exceeds that on the low tier, the panels drop to `opacity: 1` immediately rather than cross-fading.

### Layer policy

`will-change: transform` on `#qx-track` only, and **only while `beat === 'services'`** — added by GSAP at segment start, removed at segment end. A permanently promoted full-width track holds a large texture in GPU memory for the entire session. Nothing else is promoted; the stage repaints are small enough that promoting them costs more than it saves.

### One loop

`gsap.ticker` is the only rAF in the application. Lenis is driven from it (`autoRaf: false`). No component may call `requestAnimationFrame` — enforced by an ESLint `no-restricted-globals` rule outside `motion/`.

`ResizeObserver` is used once, on `#qx-hero`, debounced 150ms, and ignores height-only changes ≤ 120px (§9).

### Pointer handling

`pointermove` listener is `{ passive: true }` on `window`. No `getCoalescedEvents` — we want the *latest* position, not the intermediate ones, and `quickTo` already smooths. No throttling: the handler is two `quickTo` calls, cheaper than the throttle check.

### Bundle

| Chunk | Contents | Target |
|---|---|---|
| Initial route JS | React, Next runtime, page shell, content, `NavBar` | ≤ 165 KB gzip |
| `hero-motion` (dynamic) | `gsap` core + ScrollTrigger + MorphSVG + DrawSVG + MotionPath + SplitText + CustomEase, `lenis`, all timelines | ~62 KB gzip |

`HeroSection` is imported with `next/dynamic({ ssr: false })`. Its content — the h1, subhead, and all five panels — is rendered by the **server component** `page.tsx` and passed in as children, so the text is in the initial HTML even though the motion layer loads after. The dynamic import starts immediately after hydration.

GSAP plugins are imported individually from `gsap/ScrollTrigger` etc., never `gsap/all`, which pulls everything.

### Fonts

`next/font` for Inter and JetBrains Mono; `next/font/local` for Satoshi. All `display: 'swap'`, `preload: true`, with `adjustFontFallback` on so the fallback metrics match and there is no reflow.

**The intro gate:** `logo-build` must not start until `document.fonts.ready` resolves, because the wordmark's measured width feeds `computeLogoGeometry`. `boot` waits on `Promise.race([document.fonts.ready, timeout(1200)])`. If the timeout wins, the intro proceeds with fallback metrics and a `ScrollTrigger.refresh()` fires when fonts eventually land.

### Core Web Vitals

| Metric | Target | Protected by |
|---|---|---|
| LCP | ≤ 1.8s | LCP element is the `<h1>`, server-rendered, no image. Fonts preloaded. |
| CLS | ≤ 0.05 | Hero is `100svh` with fixed dimensions; `pinSpacing: true` reserves pin space; `adjustFontFallback` prevents font reflow. A pinned hero is a CLS risk specifically at the pin/unpin boundary — verify with the Layout Shift Regions overlay. |
| INP | ≤ 200ms | The click handler does one thing: `send('CLICK')`. All animation work is on the ticker. |
| TBT | ≤ 150ms | Motion layer is dynamically imported after hydration. |

### Measurement

Profile with the Performance panel, recording: page load through `ready`, then a full scroll through the pin. Check the Frames track for anything over 16.7ms, and the Layers panel for unexpected promotions.

CI gates (fail the build): Lighthouse CI performance ≥ 90, LCP ≤ 1.8s, CLS ≤ 0.05, initial JS ≤ 165 KB.

| Device | Expected |
|---|---|
| MacBook Pro M1, Chrome | 60fps throughout |
| Windows laptop, integrated GPU, Chrome | 60fps, occasional dip during frame expansion |
| iPhone 13, Safari | 60fps; touch path (§14) |
| Pixel 6a, Chrome | 50–60fps |
| Moto G Power (low tier), Chrome | 45fps floor, reduced feature set |

---

## 13. Accessibility

### Reduced motion

`prefers-reduced-motion: reduce` is a full design mode, not a switch. See the §7 table for the per-beat result. In summary: no intro, logo present immediately, frame at 70% immediately, **no pin and no horizontal scroll** — the services become a normal vertical list. The native cursor is never hidden.

This path renders the same DOM as the no-JS output, so it can't silently rot.

### The scroll-hijack problem

Converting 500vh of vertical scroll into a pinned horizontal carousel is the biggest accessibility risk in this design. It is honestly a hijack. The mitigations:

1. **Never trapped.** Scrolling always makes progress; there is no state where scroll input does nothing. The pin has a definite end.
2. **Keyboard equivalence.** Every service is reachable by Tab without scrolling at all.
3. **Reduced motion removes it entirely** — the pin is not created.
4. **A visible "Skip to services" control** in the hero jumps past the pin via `lenis.scrollTo('#services-end')`.
5. **Escape** during Engine 1 skips the intro; during the carousel it releases focus to the page.

Tested by: keyboard-only traversal in Playwright, reduced-motion emulation, and a manual pass with VoiceOver.

### Keyboard

Focus order: skip link → skip-intro button (Engine 1 only) → h1 region → service 1 CTA → … → service 5 CTA → navbar → page content.

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Next/previous focusable. Tabbing to a service CTA calls `lenis.scrollTo()` to that panel's scroll position. |
| `←` / `→` | With the carousel region focused: previous/next service |
| `Home` / `End` | First/last service |
| `Enter` / `Space` | Activate the focused control; during `click` beat, commits the click |
| `Escape` | Skip intro / release carousel focus |

**The focus-scroll trap:** when a browser focuses an element inside a horizontally translated track, it calls `scrollIntoView` on the nearest scroll container and can scroll the *page* to compensate, fighting the pin. Prevention: the track's parent is `overflow: hidden`, and every CTA's `focus` handler calls `preventScroll: true` on `focus()` and then drives `lenis.scrollTo()` to the correct pin progress itself. The app decides where the scroll goes, never the browser.

Focus ring: `2px solid --qx-green` with a `2px` offset — 12.4:1 against black, well past the 3:1 required by 1.4.11.

### Screen readers

The accessible tree is the DOM in §4: an `<h1>`, a paragraph, and an ordered list of five services with headings, descriptions and links. The entire `#qx-stage` SVG is `aria-hidden`. A screen reader user gets the full content, in order, with no animation vocabulary at all.

No live region for the carousel. The panels are all in the DOM and reachable by Tab; announcing "service 3 of 5" on every scroll step would be constant noise for a user who isn't scrolling visually.

The `<h1>` has `aria-label="Qavyx"` so that SplitText's per-character spans are never read as five letters.

### The custom cursor

Hiding the native cursor is a real risk — a user with a motor impairment or low vision may rely on the OS cursor, and our replacement lags by 350ms. The native cursor is restored whenever:

- `prefers-reduced-motion: reduce` is set (never hidden in the first place)
- The intro is skipped
- `beat` reaches `ready`
- The pointer leaves the viewport
- Any key is pressed

So the cursor is only replaced during the ~2 seconds of Engine 1 where it is the subject of the interaction.

### Contrast

| Text | Token on `--qx-black` | Ratio | Verdict |
|---|---|---|---|
| Wordmark, service titles | `--qx-white` | 18.6:1 | AAA |
| Descriptions, counters | `--qx-grey` | 7.4:1 | AAA |
| Active state, CTA, focus ring | `--qx-green` | 12.4:1 | AAA |
| Frame stroke (non-text) | `--qx-green-dim` | 3.1:1 | Passes 1.4.11 |

On `--qx-ink` panels the ratios drop by ~6% — all still pass AA comfortably.

### Vestibular safety

The largest scale change is the frame expansion: `490px → 1008px` width, ~2.05×, over 50vh of user-controlled scroll. It is scrubbed, so the user controls its speed and can stop it — which is materially safer than an autoplaying zoom. There is no rotation anywhere, no parallax, and no motion at all in the periphery of the viewport during the expansion. Combined with the reduced-motion path removing it entirely, this satisfies 2.3.3.

### Targets

All CTAs are ≥ 44×44px including padding. The carousel indicator segments are decorative, not controls.

### WCAG 2.2 AA risk register

| SC | Name | Risk here | Mitigation | Test |
|---|---|---|---|---|
| 2.2.2 | Pause, Stop, Hide | The breathing dot is an auto-updating loop | It stops permanently on first pointer move and is absent under reduced motion; it carries no information | Manual |
| 2.3.3 | Animation from Interactions (AAA, targeted) | The frame expansion | Reduced-motion removes it | Emulation |
| 2.1.1 | Keyboard | Carousel could be mouse/scroll only | Full keyboard nav above | Playwright |
| 2.1.2 | No Keyboard Trap | Pinned section could trap focus | Focus order continues past the hero; Escape releases | Playwright |
| 2.4.3 | Focus Order | Horizontal track vs DOM order | DOM order matches visual order left-to-right | Manual |
| 2.4.7 | Focus Visible | Focus inside a translated track can be off-screen | `lenis.scrollTo` on focus brings the panel into view | Playwright |
| 2.4.11 | Focus Not Obscured (Minimum) | The pinned frame could cover a focused element | Frame is `pointer-events: none` and focusable content sits above it | Manual |
| 1.4.3 | Contrast (Minimum) | Green on black | 12.4:1 | axe |
| 1.4.11 | Non-text Contrast | Frame stroke, indicator | `--qx-green-dim` 3.1:1 | axe |
| 1.3.1 | Info and Relationships | Content could live only in the SVG | All content is real DOM text | axe |
| 3.2.5 | Change on Request (AAA) | Scroll triggers large context changes | Reduced-motion and skip controls | Manual |

`axe-core` runs in CI at three points: `boot`, `ready`, and mid-carousel (§17).

---

## 14. Mobile Responsiveness

### Breakpoints

| Token | Min width | Hero behaviour |
|---|---|---|
| `sm` | 640px | Phone — Engine 1 replaced, carousel native swipe |
| `md` | 768px | Tablet portrait — Engine 1 replaced, pinned carousel retained |
| `lg` | 1024px | Full experience |
| `xl` | 1280px | Full experience, logo at max 520px |

The real switch is not width but pointer capability: `@media (hover: hover) and (pointer: fine)`. A 1024px touchscreen laptop reports both — for those, `any-pointer: fine` decides, and the full pointer experience runs.

### Engine 1 on touch

Beats `pointer-wake`, `cursor-morph` and `click` are pointer-dependent and cannot survive literally. The replacements keep the same intent:

| Beat | Desktop | Touch replacement | Intent preserved |
|---|---|---|---|
| `dot-in` | Dot appears, breathes | Identical | Discovery |
| `pointer-wake` | First mouse move | **Skipped.** After 1200ms the dot morphs on its own. | — |
| `cursor-morph` | Dot → mouse icon following pointer | Dot morphs into the mouse icon **in place at viewport center**, no following | Transition |
| `click` | Left button highlights, user clicks | The icon pulses once (single 400ms scale to 1.08 and back) and the label **"Tap to build"** fades in below. Any tap commits. | Discovery + Confirmation |
| `logo-build` | Travel from pointer position | Travel from viewport center to the anchor. Same path shape, shorter. | Construction |

No-tap timeout on touch is 4000ms (shorter than desktop's 5000ms — a touch user has no cursor to explore with and will read the intro as stuck sooner).

### Per-beat responsive summary

| Beat | ≥1024px | 768–1023px | <768px |
|---|---|---|---|
| `boot` | As spec | Same | Same |
| `dot-in` | As spec | Same | Same |
| `pointer-wake` | Yes | Skipped | Skipped |
| `cursor-morph` | Follows pointer | In place | In place |
| `click` | Button affordance | Tap prompt | Tap prompt |
| `logo-build` | 2700ms | 2700ms | 2200ms (travel 480ms, letters 60ms stagger) |
| `frame-scale` | As spec | Same | Same |
| `frame-expand` | 70vw × 70vh | 84vw × 70vh | 92vw × 62vh |
| `services` | Pinned horizontal, 360vh | Pinned horizontal, 360vh | **Not pinned** — native horizontal swipe |
| `frame-exit` | As spec | Same | Frame fades rather than shrinking to navbar |

### Engine 2 in portrait

A 70vw × 70vh frame in portrait is nearly square and cramps the two-column panel layout. Below 768px the frame is 92vw × 62vh and the panel becomes a single column: index, title, description, CTA, with the visual dropped entirely (the description already carries the information).

### Engine 3 on touch

Below 768px the pin is not created. The track becomes a native `scroll-snap` container:

```css
overflow-x: auto;
scroll-snap-type: x mandatory;
overscroll-behavior-x: contain;   /* stops swipe chaining to browser back */
```

Each panel is `scroll-snap-align: center`. This is the decision that avoids fighting the platform: a JS-driven horizontal drag inside a vertical page scroll produces gesture ambiguity that no threshold tuning fully solves, and native snap gives correct momentum, correct rubber-banding and correct accessibility for free.

Between 768 and 1023px the pin is retained (there is enough height for it to read) and `Observer` is **not** used — vertical scroll drives it exactly as on desktop.

`activeService` on touch comes from an `IntersectionObserver` on the panels at `threshold: 0.6`, not from scroll math.

### Viewport units

Hero height is `100svh`, never `100vh`. `dvh` would make the hero resize continuously as the URL bar moves, forcing a ScrollTrigger refresh mid-scroll.

Resize policy (§9): width change or height change > 120px → debounced refresh. Height change ≤ 120px → ignored, because that is the URL bar.

`orientationchange` → 300ms delay → `ScrollTrigger.refresh()`. iOS reports stale viewport dimensions if you read them immediately.

### Device tier

```ts
const tier = (navigator.deviceMemory ?? 4) < 4
          || (navigator.hardwareConcurrency ?? 8) < 4
          ? 'low' : 'high';
```

Computed once on mount. `deviceMemory` is Chromium-only; the `?? 4` default means Safari always reads as high tier, which is acceptable since Safari devices in our matrix are capable.

Low tier loses: the cursor glow `drop-shadow`, the grain overlay, and the panel cross-fade (panels switch at `opacity: 1` instantly). It keeps every beat — the experience is not truncated, only its finish is.

### SVG scaling

The stage viewBox always equals the viewport, so `preserveAspectRatio` never matters and is left at the default. Everything responsive happens in `computeLogoGeometry`, which takes `vw`/`vh` and returns pixel values. There are no art-directed viewBoxes and no media queries in the SVG.

Touch targets: CTAs are 48px tall on touch (up from 44px), with 16px between adjacent controls.

---

## 15. Development Milestones

| M | Goal | Deliverable | Exit criteria | Days |
|---|---|---|---|---|
| M0 | Scaffold | Next 15 + TS strict + Tailwind + tokens + fonts | `pnpm build` clean; tokens render; three fonts load with no CLS | 1 |
| M1 | Motion foundation | `motion/gsap.ts`, `eases.ts`, `lenis.ts`, `geometry.ts` | Lenis scrolls smoothly; a throwaway ScrollTrigger logs progress 0→1; only one rAF in the Performance profile | 1.5 |
| M2 | **Vertical slice** | Unstyled black page: dot → morph → travel → rect draws → pin → track translates → unpins | The whole spine works end-to-end with no styling. This is the milestone that de-risks the project. | 3 |
| M3 | Logo geometry | Final SVG paths, `computeLogoGeometry`, morph pairs verified | Morph is clean at every `shapeIndex` step; geometry correct at 360/768/1024/1440/1920px | 2 |
| M4 | Engine 1 complete | All intro beats, state machine, skip path, timeouts | Every entry in the §10 transition table demonstrably fires; skip works from all 6 Engine-1 beats | 3 |
| M5 | Engines 2–3 | Expansion, carousel, snap, indicator, navbar handoff | Full scroll through with no pin jump at any breakpoint | 3 |
| M6 | Reduced motion + touch | Both alternate paths | Reduced-motion path renders identical DOM to no-JS; touch path complete on a real iPhone and a real Android | 2 |
| M7 | Content + polish | Real copy, 5 service visuals, final type and spacing | Design review passed | 2 |
| M8 | Accessibility | Keyboard, focus management, axe, screen reader pass | Zero axe violations; full VoiceOver traversal; §13 table all mitigated | 2 |
| M9 | Performance | Budgets, lazy loading, tier degradation | All §12 CI gates green on the full device matrix | 2 |
| M10 | Tests + hardening | Unit, integration, E2E, visual | Suite green three consecutive runs | 2 |

**Total ≈ 23.5 working days.**

### Build order rationale

- **M2 before anything looks good.** The vertical slice proves the coordinate system, the Lenis/ScrollTrigger wiring and the single-node principle all hold together. If the frame expansion or the pin has a fundamental problem, it surfaces on day 6 rather than day 18.
- **M3 before M4.** Building intro animation against provisional logo geometry means rebuilding it. The morph pairing and the anchor position must be final first.
- **M6 before M7, not last.** The reduced-motion path shares DOM with the no-JS output; building it early means it's exercised by every subsequent manual test instead of being written in a rush at the end and immediately drifting.

Deferred post-launch: analytics on beat completion rates, a second service-visual treatment, and prefers-contrast support.

---

## 16. Risks & Edge Cases

| Risk | L | I | Early warning | Mitigation | Fallback |
|---|---|---|---|---|---|
| **Morph point-count mismatch** — dot→mouse interpolates through a crumpled shape | H | M | Visible at first morph attempt | §11 authoring checklist; verify segment counts in a unit test that parses both `d` strings | Cross-fade the two shapes over 200ms instead of morphing |
| **Logo geometry changes after Engine 1 is built** | M | H | Design asks for a wordmark tweak in week 3 | All geometry derives from `computeLogoGeometry`; nothing is hard-coded in a timeline | Re-run M3 only |
| **Lenis + pin bugs on iOS Safari** | M | H | Pin jumps or the frame drifts on scroll direction change | `syncTouch: false`, `100svh`, height-change resize filter | Disable the pin below 768px — already the plan (§14) |
| **Scroll lock traps the user** | L | H | User reports the page won't scroll | `lenis.stop()` only (never `overflow: hidden`); any wheel/touch triggers `skipIntro()`; 6s and 5s timeouts auto-advance | Remove the lock; let the intro play over a scrollable page |
| **Hydration mismatch** from pointer/matchMedia | M | M | React hydration warning in console | All browser-derived state initialises to SSR-safe defaults and is set in `useEffect` | — |
| **ScrollTrigger leaks on navigation** | M | M | Memory grows across route changes; stale triggers fire | `useGSAP` scope revert + explicit `ScrollTrigger.getAll().kill()` + `lenis.destroy()` in cleanup | — |
| **Scroll feel differs across input devices** | H | M | Trackpad feels fine, wheel feels steppy | `scrub: 1` smooths discrete wheel deltas; Lenis `lerp: 0.1` | Raise scrub to 1.5 for wheel specifically — detectable via `deltaMode` |
| **Cursor lags or fights the native cursor** | M | M | Two cursors visible, or the custom one feels sluggish | `cursor: none` on `<html>`; 0.35s `quickTo`; restored on every exit condition in §13 | Reduce follow duration to 0.2s |
| **SplitText destroys the accessible wordmark** | M | H | Screen reader reads "Q A V Y X" | `aria-label` on the h1; `revert()` in cleanup | Use a clip-reveal on a single text node instead of per-char |
| **Font load shifts wordmark mid-construction** | M | H | Wordmark visibly resizes during letter reveal | `logo-build` gated on `document.fonts.ready`; `adjustFontFallback` | Proceed with fallback metrics + refresh |
| **500vh feels too long; users bounce** | M | M | Analytics: high exit rate mid-pin | Budget is already tight (5 screens for 5 services); snap keeps it purposeful | Cut to 4 services or 70vh per transition |
| **Hero unusable to keyboard/SR users** | L | H | Manual audit | §13 in full; axe in CI | — |

**The hardest one is the iOS Safari pin.** Lenis, a pinned section, `position: fixed` children and Safari's viewport resize behaviour interact in ways that are genuinely difficult to reason about statically. This is why M2 tests the pin on a real device before any polish exists, and why the sub-768px path removes the pin entirely rather than trying to make it work everywhere.

### Edge cases

| Case | Expected behaviour |
|---|---|
| Tab backgrounded on load | `visibilitychange` pauses `introMaster`. On return it resumes from where it paused — not from the start. |
| Reload mid-carousel with scroll restoration | Browser restores scroll position. On mount: `history.scrollRestoration = 'manual'`, skip the intro, `ScrollTrigger.refresh()`, then restore the position. The user lands mid-carousel with the frame correctly expanded. |
| Deep link to `#services` or below | Intro skipped immediately, refresh, then `lenis.scrollTo` the target. |
| Trackpad momentum | Handled by `scrub: 1` and `snap.delay: 0.05`. Momentum that crosses several panels lands on the nearest and snaps. |
| Resize desktop → mobile mid-experience | Debounced refresh recomputes geometry. Crossing the 768px boundary rebuilds the carousel (pinned ↔ native-swipe) via the `useGSAP` dependency on a breakpoint value. |
| Touchscreen laptop | `any-pointer: fine` matches → full pointer experience. Touch also works, since the carousel accepts both. |
| Very short viewport (< 480px tall) | Frame drops to 88vh; the panel's two-column layout collapses to one column regardless of width. |
| JS disabled | Server-rendered black page, white wordmark, subhead, five services as a vertical list, working CTA links. Identical to the reduced-motion DOM. |
| Very fast flick across several beats | Scrubbed timelines are position-based, so intermediate states are simply skipped. No beat has a side effect that must run — that is why beats 7–10 write state on change only. |

---

## 17. Testing Strategy

Animation is mostly not unit-testable, and pretending otherwise produces a suite that is slow, flaky and proves nothing. What *is* testable: the state machine, the geometry math, the timeline structure, and the DOM at fixed timeline positions. That's where the effort goes.

### The key technique

**Never wait on real time.** GSAP timelines are seekable, so every animation test builds the timeline, calls `.progress(x)`, and asserts synchronously. A test that does `await sleep(520)` and then checks the morph is a test that will fail on CI under load.

```ts
// the shape of every animation test
const tl = tlCursorMorph(mockRefs, cfg);
tl.progress(0.5);
expect(mockRefs.cursor.getAttribute('d')).not.toEqual(DOT_PATH);
```

### Layers

| Layer | Tool | Count | What |
|---|---|---|---|
| Unit | Vitest | ~45 | Geometry functions, beat machine transitions, scroll→index mapping, `computeFramePath` output, morph segment-count parity |
| Integration | Vitest + jsdom + real GSAP | ~15 | Each beat factory: build, seek to 0 / 0.5 / 1, assert DOM |
| E2E | Playwright | 8 journeys | Real browser, real scroll |
| Visual | Playwright screenshots | 9 snapshots | Deterministic frames |
| A11y | axe-core via Playwright | 3 states | `boot`, `ready`, mid-carousel |
| Perf | Lighthouse CI | 1 run | Budget gates |

### Unit targets

| Target | Assertion |
|---|---|
| `computeLogoGeometry` | At 1440×900 returns `logoW: 490`, centered; at 360 clamps to 300 |
| `computeFramePath` | Output parses as a valid path with 9 segments |
| Morph parity | `#qx-cursor` and `#qx-mouse-body` have identical segment counts and winding |
| Beat machine | Every row of the §10 transition table, including guards |
| Scroll→index | `progress 0.16 → 0`, `0.52 → 2`, `0.88 → 4` |
| Snap function | Snaps inside `[0.16, 0.88]`, passes through outside it |

### E2E journeys

| Journey | Key assertion |
|---|---|
| Complete intro with mouse | `data-beat="ready"` within 8s; wordmark visible |
| Skip by scrolling during `dot-in` | `data-beat="ready"` within 500ms of the wheel event |
| Skip via Escape | Same |
| No pointer at all | Auto-advances to `ready` within 9s |
| Traverse all 5 services | Indicator reads `05 / 05`; all five titles have been visible |
| Exit to normal scroll | Hero unpins; navbar visible and interactive; page scrolls past |
| Keyboard-only | Tab reaches all 5 CTAs; each brings its panel into view; no trap |
| Reduced motion | No pin created; services render as a vertical list; native cursor present |
| Touch (Pixel 5 emulation) | Tap prompt appears; tap builds the logo; carousel swipes horizontally |

### Visual regression

Determinism first: a `?test=1` param that calls `gsap.ticker.sleep()`, disables the grain overlay, and exposes `window.__qxSeek(progress)` on the master timelines. Every snapshot is taken at a fixed seek position, never after a delay.

Snapshot points: `dot-in` @1.0, `cursor-morph` @0.5, `cursor-morph` @1.0, `logo-build` @0.4 (mid-draw), `logo-build` @1.0, `frame-expand` @0.5, `frame-expand` @1.0, `services` @ each of 5 indices, `frame-exit` @1.0.

Tolerance: 0.2% pixel difference, to absorb font rasterisation differences. Anything larger is a real change.

### A11y and perf

`axe-core` at three states, zero violations required. Manual matrix: VoiceOver/Safari, NVDA/Firefox, keyboard-only in all three browsers — run at M8 and before each release, not in CI.

Lighthouse CI budgets as in §12. Bundle size gated by `size-limit` on the two chunks.

### CI policy

| Trigger | Runs |
|---|---|
| Every PR | Unit + integration + a11y + size-limit (~90s) |
| PR to `main` | Above + E2E on Chromium + Lighthouse |
| Nightly | Full E2E on Chromium/Firefox/WebKit + visual regression |
| Pre-release | Everything + manual device and screen-reader matrix |

**Flake policy:** an animation test that fails intermittently is deleted or rewritten as a seek-based test — never retried. A retry on an animation test hides a real race condition. If a test needs a retry to pass, it is testing the wrong thing.

### Manual QA script

1. Full intro with mouse, at 1440px. Logo constructs; no jank.
2. Reload; scroll immediately. Intro skips cleanly to the completed logo.
3. Reload; touch nothing for 15s. Auto-advances.
4. Scroll through the entire pin slowly, then again with fast flicks. No pin jump.
5. Scroll back up through the whole pin. Everything reverses.
6. Resize from 1440 to 375 mid-carousel. Recovers.
7. Enable reduced motion in OS settings; reload. Vertical list, no pin.
8. Keyboard only, no mouse, start to finish.
9. Real iPhone and real Android, portrait and landscape.
10. Throttle to Slow 4G + 4× CPU. Intro still completes.

---

## 18. File-by-File Build Order

Work top to bottom. Each file lists what it exports, what it depends on, and how to know it works before moving on.

### Stage 0 — Setup (M0)

| # | File | Purpose | Verify |
|---|---|---|---|
| 1 | `package.json` | Deps from §1 | `pnpm install` clean |
| 2 | `tsconfig.json` | `strict: true`, path aliases | `tsc --noEmit` passes |
| 3 | `tailwind.config.ts` | Map `--qx-*` into the theme | A `text-qx-green` utility resolves |
| 4 | `.eslintrc.cjs` | Layer boundaries, `no-restricted-imports` on raw `gsap` | Importing `gsap` in a component errors |
| 5 | `app/layout.tsx` | Fonts, JSON-LD, `<html lang>` | Three fonts in the Network tab, no FOUT |

### Stage 1 — Tokens (M0)

| # | File | Exports | Verify |
|---|---|---|---|
| 6 | `styles/tokens.css` | All `--qx-*` custom properties | DevTools shows them on `:root` |
| 7 | `app/globals.css` | Tailwind directives, base reset, black body | Page renders pure black |

### Stage 2 — Motion foundation (M1)

| # | File | Exports | Deps | Verify |
|---|---|---|---|---|
| 8 | `motion/gsap.ts` | `gsap` (registered singleton) | — | `console.log(gsap.version)` ≥ 3.13; plugins registered once |
| 9 | `motion/eases.ts` | Registers `qx.out`, `qx.inOut`, `qx.snap` | 8 | `gsap.parseEase('qx.out')` returns a function |
| 10 | `motion/lenis.ts` | `createLenis(): Lenis` | 8 | Scroll a tall test page — smooth, and only one rAF in the profile |
| 11 | `motion/geometry.ts` | `computeLogoGeometry`, `computeFrameGeometry`, `computeNavGeometry`, `computeFramePath`, `computeTravelPath`, scroll constants | — | Unit tests from §17 pass |
| 12 | `hooks/useLenis.ts` | `useLenis(enabled)` | 8, 10 | Lenis destroys on unmount; no listener leak |

### Stage 3 — Types and content (M1)

| # | File | Exports | Verify |
|---|---|---|---|
| 13 | `types/hero.ts` | `Beat`, `BeatEvent`, `Box`, `LogoGeometry`, `StageRefs` | `tsc` passes |
| 14 | `types/motion.ts` | `MotionConfig`, `BeatTimeline` | `tsc` passes |
| 15 | `content/services.ts` | `SERVICES: readonly Service[]` (5 items) | Length is 5; slugs unique |

### Stage 4 — State (M2)

| # | File | Exports | Deps | Verify |
|---|---|---|---|---|
| 16 | `state/heroStore.ts` | `useHeroStore`, transition reducer | 13 | Every §10 transition unit-tested |
| 17 | `hooks/useBeatMachine.ts` | `useBeatMachine()` | 16 | `data-beat` on `#qx-hero` updates |
| 18 | `hooks/useReducedMotion.ts` | `useReducedMotion()` | — | Toggling the OS setting flips it live |
| 19 | `hooks/useDeviceTier.ts` | `useDeviceTier()` | — | Returns `'high'` on desktop |

### Stage 5 — SVG (M2 skeleton, M3 final)

| # | File | Exports | Deps | Verify |
|---|---|---|---|---|
| 20 | `components/hero/HeroStage.tsx` | `HeroStage` | 11 | `viewBox` matches viewport; updates on resize |
| 21 | `components/hero/CursorNode.tsx` | `CursorNode` | — | Dot renders centered at r=6 |
| 22 | `components/hero/FrameRect.tsx` | `FrameRect` (a `<path>`) | 11 | Rounded rect renders at logo geometry |
| 23 | `components/hero/StageGuides.tsx` | `StageGuides` | — | 4 corner marks, static |

### Stage 6 — Engine 1 (M2 spine, M4 complete)

| # | File | Exports | Deps | Verify |
|---|---|---|---|---|
| 24 | `hooks/usePointerFollow.ts` | `usePointerFollow(target, enabled)` | 8 | Dot follows with lag; React DevTools shows **zero** renders while moving |
| 25 | `motion/timelines/introTimeline.ts` | `tlDotIn`, `tlPointerWake`, `tlCursorMorph`, `tlClickInvite`, `tlLogoBuild`, `buildIntroMaster` | 8,9,11 | Seek each to 0/0.5/1 — DOM matches §7 |
| 26 | `components/hero/HeroCopy.tsx` | `HeroCopy` | 15 | h1 in DOM at first paint, `opacity: 0` |
| 27 | `components/hero/SkipIntroButton.tsx` | `SkipIntroButton` | 17 | Visible on focus; skips from every beat |
| 28 | `hooks/useHeroTimeline.ts` | `useHeroTimeline(refs, opts)` | 25 | StrictMode double-mount produces one timeline, not two |

### Stage 7 — Handoff and pin (M2)

| # | File | Exports | Deps | Verify |
|---|---|---|---|---|
| 29 | `components/hero/HeroSection.tsx` | `HeroSection` | 20–28 | Intro completes → `lenis.start()` → page scrolls |
| 30 | `motion/timelines/expandTimeline.ts` | `buildExpandMaster`, `tlFrameScale`, `tlFrameExpand` | 8,11 | `st-hero-pin` with `markers` — pin holds 500vh, no jump |

### Stage 8 — Engine 2 (M5)

| # | File | Exports | Verify |
|---|---|---|---|
| 31 | (extend 30) `tlFrameExpand` | — | Frame reaches exactly 70vw×70vh; stroke still 1.5px |

### Stage 9 — Engine 3 (M5)

| # | File | Exports | Deps | Verify |
|---|---|---|---|---|
| 32 | `components/services/ServicePanel.tsx` | `ServicePanel` | 15 | Renders one panel at full frame width |
| 33 | `components/services/ServiceTrack.tsx` | `ServiceTrack` | 32 | 5 panels laid out horizontally |
| 34 | `components/services/CarouselIndicator.tsx` | `CarouselIndicator` | 16 | Reads `01 / 05`; updates 4 times total |
| 35 | `components/services/ServicesCarousel.tsx` | `ServicesCarousel` | 32–34 | Track translates across the segment |
| 36 | `motion/timelines/carouselTimeline.ts` | `tlCarousel` | 11 | Snap lands on each of 5 positions |
| 37 | `components/services/visuals/*.tsx` | 5 static diagram components | — | Render, `aria-hidden` |

### Stage 10 — Exit (M5)

| # | File | Exports | Deps | Verify |
|---|---|---|---|---|
| 38 | `components/nav/NavBar.tsx` | `NavBar` | — | Hidden until p 0.97, then sticky and clickable |
| 39 | `motion/timelines/exitTimeline.ts` | `tlFrameExit` | 11 | Frame lands exactly on the navbar logo box; no pop at the cross-fade |

### Stage 11 — Reduced motion, touch, responsive (M6)

| # | Work | Verify |
|---|---|---|
| 40 | Reduced-motion branch in `useHeroTimeline` | No pin created; vertical list; native cursor |
| 41 | Touch branch in `introTimeline` | Tap prompt; tap builds |
| 42 | Native swipe carousel < 768px | Snaps; no chaining to browser back |
| 43 | Resize/orientation policy in `HeroSection` | URL-bar resize ignored; real resize refreshes |

### Stage 12–14 — A11y, perf, tests (M8–M10)

| # | Work | Verify |
|---|---|---|
| 44 | Focus management, `preventScroll`, skip link, keyboard handlers | §13 keyboard table passes |
| 45 | `next/dynamic` on `HeroSection`, `size-limit` config | Initial JS ≤ 165 KB |
| 46 | `components/dev/DevOverlay.tsx` | Shows beat/progress/fps; absent in prod build |
| 47 | `tests/unit/*`, `tests/e2e/*`, `tests/visual/*` | Suite green 3 runs in a row |

### Parallelisation

```
Dev A:  Stage 0 → 1 → 2 → 4 → 6 → 7 → 8 → 10 → 12 → 13
Dev B:              ↘ Stage 3 → 5 → 9 → 11 → 14
                       (needs #11 geometry and #13 types from Dev A)
```

Dev B can start Stage 3 as soon as `types/hero.ts` exists, and Stage 9 is fully independent of Engine 1 once `geometry.ts` lands.

### The vertical slice

**Stop after file #30 and check the whole spine end to end**, with zero styling — no fonts, no grain, no colors beyond a green stroke on black. You should be able to: move the mouse, watch the dot morph and follow, click, watch it travel and draw a rectangle, then scroll and watch that same rectangle expand to 70% and the track translate across.

If that works, everything after it is content and polish. If the frame's stroke thickens during the expansion, or the pin jumps, or the cursor drifts off the travel path — those are coordinate-system problems, and they are far cheaper to fix here than after the design is applied.

---

## Verification

**Per-stage:** the Verify column above is the gate for each file. Don't move on without it.

**Full experience:**
1. `pnpm dev`, open at 1440×900. Complete the intro with the mouse; scroll through all 500vh; confirm the navbar handoff.
2. `?markers` — confirm exactly one pinned ScrollTrigger, pin distance 500vh, start `top top`.
3. `?test=1` then `window.__qxSeek(0.5)` — verify each snapshot point in §17.
4. Performance panel: record load→`ready`, then a full scroll. No frame over 16.7ms outside the expansion; nothing over 22ms.
5. DevTools → Rendering → emulate `prefers-reduced-motion: reduce`. Confirm no pin and a vertical list.
6. Disable JS. Confirm the same DOM as step 5.
7. `pnpm test && pnpm test:e2e && pnpm lhci`.
8. Real iPhone and real Android, both orientations.
9. VoiceOver from the top of the page through the navbar.
