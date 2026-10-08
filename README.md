# Word Games

Original, single-player daily word games, played entirely in the browser: https://words.matt-rarely-writes.co.uk

There's no backend, database, login or advertising, and no cookies. Progress and stats live in the player's own
browser. Visits are counted with Cloudflare Web Analytics, which identifies no one, as on the card games. The site
is funded by a Ko-fi "Support me" button.

| Game | Folder | The puzzle |
|---|---|---|
| Price Tag | [`src/games/price-tag`](src/games/price-tag) | Letters have prices; find the longest word within budget |
| Threader | [`src/games/threader`](src/games/threader) | Shortest word containing 3–4 letters in order |
| Swap Shop | [`src/games/swap-shop`](src/games/swap-shop) | Two letters swap; find the words that survive |
| Matryoshka | [`src/games/matryoshka`](src/games/matryoshka) | Grow a chain of words, one letter at a time |
| Clean Sweep | [`src/games/clean-sweep`](src/games/clean-sweep) | Use all 15 letters in as few words as possible |
| Keyhop | [`src/games/keyhop`](src/games/keyhop) | Hop across the keyboard to spell the longest word |
| Lockout | [`src/games/lockout`](src/games/lockout) | Eight letters banned, one required; longest word |
| Gutenberg Gap | [`src/games/gutenberg-gap`](src/games/gutenberg-gap) | Guess the missing word in a line from a classic novel |

[`PLAN.md`](PLAN.md) records the design decisions (difficulty bounds, rule interpretations) and how to add a game.

## How it works

- **One dictionary.** `public/data/words.txt` is SCOWL's British English list at size 50: lowercase a–z words of
  3+ letters, minus `data/blocklist.txt`. If it's not in the list, it's not a word, in every game.
- **Puzzles made in advance.** `public/puzzles/<game>/<yyyy-mm>.json` holds every day's puzzle and its solved
  optimum, about three years ahead. Each game's generator keeps only puzzles inside its difficulty bounds.
- **Never runs out.** For a date beyond the files, the browser runs the same generator itself. It's seeded by game
  and date, so it makes exactly the puzzle the script would have made.
- **Local days.** The day rolls over at the player's midnight, and every past day is in the archive.

Plain TypeScript and CSS, built with Vite, no framework and no runtime dependencies. The shared code is in
`src/core` (dictionary, seeded random numbers, dates, the game interface, puzzle loading, storage, stats, share
text), `src/solvers` and `src/ui` (page frame, keyboard, word board, results, archive). The look matches the card
games (`card-games/packages/card-kit`): the same colours, fonts, header, light/dark button and Support me button.

## Commands

```
npm install
npm run dev          # http://localhost:5173
npm run check        # everything below, as CI runs it
npm run typecheck    # tsc, strict
npm run lint         # Biome (npm run format fixes what it can)
npm test             # unit tests (Vitest), with coverage for fallow
npm run fallow       # dead code, duplication and code health
npm run build        # production build in dist/
npm run test:e2e     # Playwright: Chromium, Android-sized Chromium and iPhone WebKit
```

The browser tests run against the production build, served with the live site's security headers, so anything
the Content-Security-Policy would block fails locally too. To set up once: `npx playwright install chromium webkit`.

## Regenerating data

Everything generated is committed, so these are only needed to change it. Run them in this order, because each
step uses the one before.

1. **Dictionary.** Edit `data/blocklist.txt` if you like, then `npm run build:dictionary`. It downloads the pinned
   SCOWL release once, into `.cache/`.
2. **Gutenberg sentences.** Edit `data/gutenberg-sources.json` (the books) or `data/gutenberg-exclude.txt` (extra
   words that rule a sentence out), then `npm run build:sentences`. The books are downloaded once from Project
   Gutenberg into `.cache/gutenberg/`.
3. **Puzzles.** `npm run generate` fills every game from the launch date to three years from today. It only adds
   dates that are missing, so it's safe to run any time. Run it about once a year to keep three years ahead; the
   in-browser fallback covers any gap meanwhile.
   - `npm run generate -- --game keyhop` does one game.
   - `npm run generate -- --to 2031-12-31` sets the end date.
   - `npm run generate -- --force` rebuilds dates that already exist. After a dictionary change it will alter past
     puzzles that people may have played, so use it with care.

Then run `npm run check` and commit.

## Settings

`src/config.ts` holds the site name, the launch date (puzzle #1 and the start of the archive), the live address and
the Cloudflare Web Analytics token. Changing `LAUNCH_DATE` renumbers every puzzle.

## Hosting

The site is the Azure Static Web App `swa-word-games` (Free plan) in the `rg-matt-rarely-writes` resource group.
Its address, words.matt-rarely-writes.co.uk, is a CNAME record at Porkbun.

GitHub Actions (`.github/workflows/site.yml`) runs `npm run check` on every pull request and push. On a push to
`main` it also builds the site and uploads `dist/`, which includes the headers, caching and 404 page set in
`public/staticwebapp.config.json`. Deploying uses the app's deploy token, kept as the repository secret
`AZURE_STATIC_WEB_APPS_API_TOKEN`; without it the deploy step only says so. To get the token again:
`az staticwebapp secrets list --name swa-word-games --query properties.apiKey -o tsv`.

The security policy allows only the site itself, Cloudflare's analytics beacon and Ko-fi's donation form (loaded
only when someone presses Support me).

## Credits

- Word list: SCOWL (Spell Checker Oriented Word Lists) by Kevin Atkinson, http://wordlist.aspell.net/
- Sentences: public-domain novels from Project Gutenberg, https://www.gutenberg.org/ (the list is in
  `data/gutenberg-sources.json` and on the site's About page)
- Fonts: Figtree, Young Serif and DM Sans, under the SIL Open Font License (see `src/assets/fonts/README.md`)

## Licence

MIT, see `LICENSE`. The word list, texts and fonts keep their own licences, above.
