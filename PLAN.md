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
| Hinge | Replaced Keyhop (too few words fitted its keyboard rule, and out-of-reach letters vanished as you typed). Five pairs a day, CAR … ROL → PET; each pair has exactly one answer in the whole word list; clues, hinges and both joined words are everyday words (SCOWL 35, `public/data/common.txt`), never plurals or other inflections; hinge words come from a fixed shuffled order, eight a day, so they don't repeat for months |
| Swap Shop | Pairs count once (BAT ↔ BET is one find). Each day is a letter pair plus "any length" or a fixed length of 4–7, kept if it has 10–40 pairs (462 combinations qualify) |
| Threader | 3 or 4 letters taken from a real word; shortest answer needs 2–4 extra letters, has at most 8 equals, and at least 20 words contain the thread |
| Matryoshka | 2–3 letter seed cut from a real word; longest chain 5–7 words, at least 2 first steps; Undo keeps your longest chain |
| Clean Sweep | 15 letters from 3–4 random words; exact minimum by iterative-deepening search; kept if the minimum is 3–4 words with at most 40 best sweeps |
| Lockout | 8 banned, 1 required, at random; kept only if the longest word is 7–10 letters (random bans usually allow 12–16-letter words) |
| Lost for Words | Was "Gutenberg Gap" (renamed so a game with affiliate links doesn't use Project Gutenberg's trademark; old URLs redirect). After each puzzle, an Amazon UK link to buy the book (tag in `src/config.ts`) with the Associates disclosure. 28 public-domain novels → 2,240 sentences (`npm run build:sentences`), walked in a fixed shuffled order, one a day; gap word 5–10 letters, in the word list, not among the 600 commonest; sentences with blocked or dated offensive words (`data/gutenberg-exclude.txt`) dropped |
| Shelf Scramble | One book a day from `src/games/shelf-scramble/books.json` (440 well-known titles, letters and spaces only), walked in a fixed shuffled order; each word's letters are jumbled, never left as they were, and words of one or two letters are given. Hints: show the author, or reveal a letter. The title is the answer whether or not its words are in the word list. Ends with an Amazon UK link to the book |
| Halves | Twelve halves (3–6 letters each) of six everyday compounds from the Hinge split index; kept only if there's exactly one way to pair every half, so a decoy word (two halves that make a real word) is a mistake. No STAB + BED = STABBED, NOBLE + MEN or DRAGON + FLIES (doubled-letter endings and plurals are left out). Picking is by tapping, not typing; mistakes counted, the same wrong pair only once; the last two halves join on their own |
| Retitled | 378 famous titles reworded by hand (`src/games/retitled/titles.json`: reworded, title, author), all from Shelf Scramble's shelf, walked in a fixed shuffled order; if Shelf Scramble has the same book that day, Retitled takes the one half the list away. Boxes show each real word's length; words the reworded title keeps (THE, AND…) are given. Shares its word-by-word rules and board with Shelf Scramble (`src/games/title-words.ts`, `src/games/title-board.ts`). Titles of serious real-life or Holocaust books were left out rather than played with |
| Cipher | A substitution cipher (every letter swapped, never for itself) of a line from the 28 Gutenberg novels; 1,680 lines (60 a book, 45–85 letters, at least 14 different letters, no word over 12 characters so it fits a phone) in `public/data/cipher-lines.json`, never a Lost for Words sentence. No word box: choose a code letter, type its letter; no wrong-letter feedback until every letter is placed. Hints give a letter away; score = letters cracked without a hint |
| Boards | Typed-word games share `src/ui/word-board.ts`; "best word counts" games add `src/ui/word-hunt.ts` (Price Tag, Threader, Lockout) |
| Results | The best answers link to Wiktionary (`lookUp()` in `src/ui/results.ts`); "Next up" offers the next of today's games not yet finished; a perfect game gets a short shower of letter tiles (none if the player prefers reduced motion) |
| Home | "Share today's scores" copies one spoiler-free message for every game finished today; a site-wide streak (days in a row with any puzzle finished on the day, `site:streak`) shows from two days |
| Link previews | Every page gets its real title, a canonical link and Open Graph tags at build time (`vite.config.ts`), with `public/og-image.png`; `public/manifest.webmanifest` and the icons make it installable; `sitemap.xml` is written at build. `npm run build:images` redraws the picture and icons |
| Targets | Every game shows its target up front (e.g. "Target: 7 letters"), so players know how close they are |
| Swap Shop families | Inflected pairs (BATS ↔ BETS) fold into their family (BAT ↔ BET); the counter counts families |
| Look | Matches the card games (card-games/packages/card-kit): slate colours, terracotta accent, Figtree and Young Serif, sticky header, hero + card pages |
| Pages | `/` lists the games; each game has `/<slug>/` and `/<slug>/how-to-play/`; `/about/` has privacy and credits |
| Theme | Follows the device until the sun/moon button is pressed; the choice is remembered (unlike the card games) |
| Support | Ko-fi "Support me" button, bottom-left; nothing is loaded from Ko-fi until it's opened |
| Hosting | Azure Static Web App `swa-word-games` (Free) at words.matt-rarely-writes.co.uk; GitHub Actions checks and deploys; Cloudflare Web Analytics on the live address only |

## Phases

1. ✅ Scaffold, dictionary build script, shared modules and tests
2. ✅ Price Tag end to end (reference implementation)
3. ✅ Threader, Swap Shop, Matryoshka, Clean Sweep, Lockout, Lost for Words, Hinge (Keyhop retired), Shelf Scramble, Halves, Retitled, Cipher
4. ✅ Home page with today's status, How to play pages, About page with word-list and Gutenberg credits
5. ✅ Azure Static Web Apps config, GitHub Actions, README

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
src/games/title-*.ts   word-by-word title guessing, shared by Shelf Scramble and Retitled
src/games/catalogue.ts names and taglines for navigation
src/games/registry.ts  all game logic, for the generator script
scripts/               build-dictionary.ts, build-gutenberg.ts, generate-puzzles.ts
data/                  hand-edited inputs (blocklist, the Lost for Words book list and exclusions)
public/                static files served as-is: word list, sentence and line banks, puzzles, favicon, theme-init.js
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
