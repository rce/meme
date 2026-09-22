# Meme Machine

A small browser meme generator, served from GitHub Pages. Pick one of the built-in formats
or drop in your own picture, type the words, download a PNG. Everything runs client-side —
no image ever leaves the browser.

## Formats

Two kinds of format are supported:

- **Captions** — Impact text over the picture, at the top and/or the bottom.
- **Panels** — fixed text boxes for multi-panel formats like Drake, where the words go in
  the blank half of the image.

Both are hardcoded `(picture, format)` pairs in [`templates/`](./templates/). Uploaded
pictures use the caption layout, switchable between top-and-bottom, top only and bottom only.

Adding a format is one image file plus one JSON object — see
[`templates/README.md`](./templates/README.md).

## Development

```sh
pnpm install
pnpm dev        # http://localhost:5173/meme/
pnpm typecheck  # tsc -b
pnpm build      # typecheck, then -> dist/
pnpm preview    # serve dist/ locally
```

TypeScript throughout; `src/types.ts` holds the template and layout shapes.

## Deployment

Pushing to `main` builds the app and publishes it via
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). It needs Pages switched to
the Actions source once:

> Settings ▸ Pages ▸ Build and deployment ▸ Source: **GitHub Actions**

The site then lives at `https://<user>.github.io/<repo>/`.

Asset URLs need that `/<repo>/` prefix, which the workflow passes as `BASE_PATH`.
[`vite.config.js`](./vite.config.js) defaults to `/meme/` for local builds; set
`BASE_PATH=/` if you ever move this to a user site or a custom domain.

## Notes

- The meme face is Impact where it exists and [Anton](https://fonts.google.com/specimen/Anton)
  from Google Fonts elsewhere — Impact is missing on most Linux machines. If the font fails
  to load the app falls back to a condensed system sans.
- Text is wrapped and shrunk to fit its box, so a template's boxes only need to be roughly
  right, and long captions never overflow.
- Uploads larger than 2000px on the long side are downscaled before rendering.
