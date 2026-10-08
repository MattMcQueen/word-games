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
| Keyhop | Longest word from the start key, at least the day's minimum length. Each letter must be within the day's reach (2 or 3 keys, same key allowed) of the one before: strict adjacency allows only 34 words in the whole list |
| Swap Shop | Pairs count once (BAT ↔ BET is one find). Each day is a letter pair plus "any length" or a fixed length of 4–7, kept if it has 10–40 pairs (462 combinations qualify) |
| Threader | 3 or 4 letters taken from a real word; shortest answer needs 2–4 extra letters, has at most 8 equals, and at least 20 words contain the thread |
| Matryoshka | 2–3 letter seed cut from a real word; longest chain 5–7 words, at least 2 first steps; Undo keeps your longest chain |
| Clean Sweep | 15 letters from 3–4 random words; exact minimum by iterative-deepening search; kept if the minimum is 3–4 words with at most 40 best sweeps |
| Lockout | 8 banned, 1 required, at random; kept only if the longest word is 7–10 letters (random bans usually allow 12–16-letter words) |
| Gutenberg Gap | 28 public-domain novels → 2,240 sentences (`npm run build:sentences`), walked in a fixed shuffled order, one a day; gap word 5–10 letters, in the word list, not among the 600 commonest; sentences with blocked or dated offensive words (`data/gutenberg-exclude.txt`) dropped |
| Boards | Typed-word games share `src/ui/word-board.ts`; "best word counts" games add `src/ui/word-hunt.ts` (Price Tag, Threader; later Lockout, Keyhop) |
| Look | Matches the card games (card-games/packages/card-kit): slate colours, terracotta accent, Figtree and Young Serif, sticky header, hero + card pages |
| Pages | `/` lists the games; each game has `/<slug>/` and `/<slug>/how-to-play/`; `/about/` has privacy and credits |
| Theme | Follows the device until the sun/moon button is pressed; the choice is remembered (unlike the card games) |
| Support | Ko-fi "Support me" button, bottom-left; nothing is loaded from Ko-fi until it's opened. Phase 5's CSP must allow `frame-src https://ko-fi.com` |

## Phases

1. ✅ Scaffold, dictionary build script, shared modules and tests
2. ✅ Price Tag end to end (reference implementation), **waiting for feedback**
3. ✅ Threader, Swap Shop, Matryoshka, Clean Sweep, Keyhop, Lockout, Gutenberg Gap
4. ✅ Home page with today's status, How to play pages, About page with word-list and Gutenberg credits
5. ⬜ Azure Static Web Apps config, README

## Project layout

```
pages/                 HTML entry points (Vite root); pages/<slug>/index.html → /<slug>/
src/config.ts          site name, launch date, data URLs
src/core/              dictionary, rng, date, game interface, puzzle loader, storage, progress, share, validate
src/solvers/           letter helpers shared by solvers and generators
src/ui/                dom helper, page frame, header, theme toggle, Support me, How to play layout,
                       keyboard, word input, modal, results, archive, toast, game shell
src/pages/             home and About page scripts
src/assets/            fonts (with licences) and the Ko-fi logo, shared with the card games
src/games/<slug>/      spec.ts, generate.ts, solve.ts, logic.ts, scoring.ts, rules.ts, ui.ts,
                       main.ts, how-to-play.ts, tests
src/games/catalogue.ts names and taglines for navigation
src/games/registry.ts  all game logic, for the generator script
scripts/               build-dictionary.ts, build-gutenberg.ts, generate-puzzles.ts
data/                  hand-edited inputs (blocklist, Gutenberg book list and exclusions)
public/                static files served as-is: word list, sentence bank, puzzles, favicon, theme-init.js
tests/e2e/             Playwright specs
```

## Adding a game

1. `src/games/<slug>/spec.ts`: types, constants and difficulty bounds.
2. `generate.ts` and `solve.ts`: pure functions with no DOM or Node APIs. Then `logic.ts` combines them into a `GameLogic`.
3. `ui.ts`: a `GameModule` whose `mount()` draws the board; `main.ts` calls `startGame()`.
   `rules.ts` holds the How to play words; `how-to-play.ts` calls `renderHowToPlay()`.
4. `pages/<slug>/index.html` and `pages/<slug>/how-to-play/index.html` (copy Price Tag's).
5. Register it in `src/games/registry.ts` and `src/games/catalogue.ts`.
6. Unit tests for the solver and generator, plus a Playwright spec.
7. `npm run generate -- --game <slug>`, then `npm run check`.
