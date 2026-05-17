# Custom Reversi

A browser-based customizable Reversi prototype with:

- 2 to 4 players
- 4x4, 6x6, 8x8, 12x12, and 16x16 boards
- Classic, reverse, and score-based win modes
- Local CPU opponents
- Local room prototype for online play experiments
- Rule sharing through URL parameters
- Japanese, English, French, Spanish, German, Korean, and Chinese UI text

## Run Locally

Use the bundled Node.js runtime or any recent Node.js install:

```sh
node scripts/static-server.js
```

Then open:

```txt
http://127.0.0.1:4173
```

## Test

```sh
node tests/reversi-core.test.js
```

## Deploy

This project is a static site. It can be deployed directly to GitHub Pages, Cloudflare Pages, Netlify, or any static hosting provider.

For GitHub Pages, push this folder to a repository with the default branch named `main`. The included `.github/workflows/pages.yml` workflow deploys the site automatically.
