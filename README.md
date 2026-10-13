# QAVYX — qavyx.com

Marketing site for QAVYX, built as a scroll-driven motion experience: a
pointer-built logo, a frame that expands out of it, a horizontal services
carousel inside that frame, and a scrubbed launch film.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 3 ·
GSAP 3.13 · Lenis · Zustand · OGL

## Getting started

Node 22 and pnpm 11 — the versions CI uses.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Scripts

| Command                                        | What it does                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                                     | Dev server. Also enables the `/lab` routes.                      |
| `pnpm build` · `pnpm start`                    | Production build, then serve it.                                 |
| `pnpm typecheck` · `pnpm lint` · `pnpm format` | `tsc --noEmit`, ESLint, Prettier.                                |
| `pnpm test:unit`                               | Unit tests (Vitest). What CI runs.                               |
| `pnpm test:e2e`                                | End-to-end tests (Playwright, port 3111).                        |
| `pnpm size`                                    | Bundle budget — initial route JS for `/`, capped at 165 KB gzip. |
| `pnpm verify`                                  | `typecheck && lint && build && size`.                            |

⚠️ **One `.next`, one owner.** `pnpm build`, `pnpm test:e2e` and a running
`pnpm dev` all write the same `.next/` directory, and Playwright starts its own
dev server on port 3111. Running any of them while `pnpm dev` is up on port 3000
corrupts the running server with `ENOENT` errors that look like code bugs and are
not. **Stop the dev server first.**

## Layout

| Path                                | Contents                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [app/(site)/](app/)                 | The public routes, one file per page.                                                                   |
| [app/(lab)/](app/)                  | Motion harnesses (`page.lab.tsx`). Dev only — absent from production builds. The e2e suite drives them. |
| [components/](components/)          | UI, grouped by area.                                                                                    |
| [content/](content/)                | All copy, as typed data. Nothing user-visible is hardcoded in a component.                              |
| [motion/](motion/)                  | GSAP/Lenis plumbing and the timelines. Pure maths is exported so tests can assert it without a browser. |
| [hooks/](hooks/) · [state/](state/) | React glue and the Zustand hero store.                                                                  |
| [lib/](lib/)                        | Framework-free helpers (SEO, contrast, validation, boot scripts).                                       |
| [styles/](styles/)                  | Component-scoped CSS, plus [tokens.css](styles/tokens.css) — the palette.                               |
| [assets/](assets/)                  | Client source artwork. Not served.                                                                      |
| [public/](public/)                  | Everything served to visitors.                                                                          |
| [tests/](tests/)                    | `unit/` (Vitest) and `e2e/` (Playwright).                                                               |

## Documentation

- **[docs/BUILD-PLAN.md](docs/BUILD-PLAN.md)** — the technical design document.
  Every motion number and acceptance criterion. Source comments call it
  `BUILD-PLAN`.
- **[docs/CONTENT-HANDOFF.md](docs/CONTENT-HANDOFF.md)** — the client's content
  document, and the `SOURCE` every `content/` module names. **It is read by the
  test suite:** six test files assert the site's copy matches it
  character-for-character, so editing a sentence in it changes what "correct"
  means.

Beyond those, **the comments are the documentation.** Files carry long headers
explaining what was measured and why a value is the value it is. Read the header
before changing a number in it.

## Two things that look broken and aren't

**The visual snapshots are macOS-only.** `tests/e2e/phase3-logo.spec.ts-snapshots/`
holds baselines named `…-chrome-darwin.png`; on Linux or Windows Playwright looks
for `-linux` / `-win32`, finds nothing, and fails as a missing snapshot.
Regenerate once on your platform with
`pnpm exec playwright test tests/e2e/phase3-logo.spec.ts --update-snapshots`, and
look at the PNGs before committing them.

**One e2e test is flaky** — `phase7-carousel`'s "the indicator counts 01..06"
fails roughly one run in four. It waits on wall-clock time where it should seek
the timeline; retries are deliberately `0` so the flake stays visible rather than
being papered over.
