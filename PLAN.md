# Word Games: plan and decisions

A static site of original, single-player daily word games. No backend, database,
accounts or ads. It's hosted on Azure Static Web Apps.

## Decisions

| Topic | Decision |
| --- | --- |
| Stack | Vanilla TypeScript + Vite (multi-page), no runtime dependencies |
| Quality tools | `tsc` (strict), Biome (lint + format), Vitest (unit + coverage), Fallow (dead code, duplication, health), Playwright + axe (end-to-end and accessibility) |
| Dictionary | SCOWL 2020.12.07, British English (-ise), size 50, lowercase a–z, 3+ letters; ~61k words |
| Blocklist | `data/blocklist.txt`, exact words only, applied when the dictionary is built |
| Puzzle files | `public/puzzles/<game>/<yyyy-mm>.json`, one file per game per month, 3 years ahead |
| Fallback | Missing date → same seeded generator runs in the browser |
| Day rollover | Player's local midnight; puzzle #1 is `LAUNCH_DATE` in `src/config.ts` |
| Finishing | Unlimited guesses; ends on reaching the optimum or pressing Finish |
| Streaks | Count only daily puzzles finished on the day; archive plays don't count |
| Site name | "Word Games" (`SITE_NAME` in `src/config.ts`) |
| Keyhop | Goal is the longest valid word from the start key (target length is a minimum) |
| Swap Shop | Pairs count once (BAT ↔ BET is one find) |

## Phases

1. ✅ Scaffold, dictionary build script, shared modules and tests
2. ✅ Price Tag end to end (reference implementation), **waiting for feedback**
3. ⬜ Threader, Swap Shop, Matryoshka, Clean Sweep, Keyhop, Lockout, Gutenberg Gap
4. ⬜ Home page with today's status, help page, about page with credits
5. ⬜ Azure Static Web Apps config, README

## Project layout

```
pages/                 HTML entry points (Vite root); pages/<slug>/index.html → /<slug>/
src/config.ts          site name, launch date, data URLs
src/core/              dictionary, rng, date, game interface, puzzle loader, storage, progress, share, validate
src/solvers/           letter helpers shared by solvers and generators
src/ui/                dom helper, header, keyboard, word input, modal, results, archive, toast, game shell
src/games/<slug>/      spec.ts, generate.ts, solve.ts, logic.ts, scoring.ts, ui.ts, main.ts, tests
src/games/catalogue.ts names and taglines for navigation
src/games/registry.ts  all game logic, for the generator script
scripts/               build-dictionary.ts, generate-puzzles.ts
data/                  hand-edited inputs (blocklist)
public/                static files served as-is: word list, puzzles, favicon, theme-init.js
tests/e2e/             Playwright specs
```

## Adding a game

1. `src/games/<slug>/spec.ts`: types, constants and difficulty bounds.
2. `generate.ts` and `solve.ts`: pure functions with no DOM or Node APIs. Then `logic.ts` combines them into a `GameLogic`.
3. `ui.ts`: a `GameModule` whose `mount()` draws the board; `main.ts` calls `startGame()`.
4. `pages/<slug>/index.html` (copy an existing one).
5. Register it in `src/games/registry.ts` and `src/games/catalogue.ts`.
6. Unit tests for the solver and generator, plus a Playwright spec.
7. `npm run generate -- --game <slug>`, then `npm run check`.
