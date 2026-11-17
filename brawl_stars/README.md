# Brawl Stars trophy grid

One page that shows how far every brawler of player `#2QPU0PV9C` is on the trophy ladder:
one row per brawler, one column per 100 trophies. Built for pushing all brawlers evenly.

- Filled cells are completed steps, the current step is partly filled.
- The white tick marks the highest trophies a brawler has reached, when it has dropped.
- The dashed line is the median across all brawlers.

Trophies only: nothing about ranked is fetched, stored or shown.

## How it works

The browser never talks to the Brawl Stars API. A Node script fetches the data, trims it
and writes `public/data/player.json`; the React app only reads that static file.

- Player and brawler list: official Brawl Stars API through the
  [RoyaleAPI proxy](https://docs.royaleapi.com/proxy.html) (`bsproxy.royaleapi.dev`).
- Brawler portraits: Brawlify CDN, by brawler id.

## API key

1. Create a key at <https://developer.brawlstars.com>.
2. Whitelist the RoyaleAPI proxy IP for it: `45.79.218.79` (check the proxy docs in case
   it has changed).
3. Copy `.env.example` to `.env` and put the key there:

   ```
   BRAWL_API_KEY=your-key
   ```

`.env` is ignored by git. Never put the key in `.env.example` or anywhere else that is
committed.

## Commands

```
npm install
npm run fetch      # create/refresh public/data/player.json (needs BRAWL_API_KEY)
npm run dev
npm run test
npm run lint
npm run build
```

If a fetch fails, the script exits with an error and keeps the existing data file.

`public/data/` is not committed. Run `npm run fetch` once before `npm run dev`.

## Hosting

`.github/workflows/brawl-stars.yml` (at the repo root) runs every hour and on demand
(Actions → Brawl Stars → Run workflow), and on every push that touches `brawl_stars/`. Each
run fetches fresh data and deploys it with the app to GitHub Pages at
`marcel-noehre.de/side-quests/brawl-stars/` (short link `marcel-noehre.de/bs`, a redirect
kept in the portfolio repo under `public/bs/`). The data is never committed; if a fetch
fails, the run fails and the live site keeps its previous version.

One-time setup: add the repository secret `BRAWL_API_KEY` and set Settings → Pages →
Source to "GitHub Actions".

To get newer data than the last hourly run, start the workflow by hand and reload the page
once it has deployed.
