# biiyond.com

The parent-company site for **Biiyond Production Pvt. Ltd.**: five pages and a scroll-scrubbed film.
It has no framework and no runtime dependencies. The build writes plain static HTML that deploys to any host (Vercel, Netlify, Cloudflare Pages, S3).

```
npm run build        # → dist/   (content/site.json + src/ + public/)
npm run dev          # build, then serve dist/ at http://localhost:4321
npm run check        # real-browser checks (needs: npm i -D playwright && npx playwright install chromium)
npm run frames       # re-extract the film's image sequence from media-src/film/*.mp4
```

Node 18+ is required. `npm run frames` also needs Python 3 and ffmpeg with libwebp (or `pip install imageio-ffmpeg`).

## Editing copy

**All copy lives in [`content/site.json`](content/site.json).** Edit it and run `npm run build`. No code changes are needed.

- `<em>…</em>` marks the lime emphasis word, as in the hero's "wanted".
- Text in `[square brackets]` must be confirmed before launch. The build lists every one, and a `npm run build:preview` build underlines them in clay.
- `site.external.*.live`: set to `true` once leafcut.studio and leafcut.academy resolve. Until then those links render as "Soon" and are not clickable.
- `thinking.vipassana.show` is **held at `false` on purpose**. Don't publish it until the policy has been announced inside the company.

## The film (home page)

A pinned canvas scrubs 382 frames with native scroll. There's no scroll-jacking, and it works forward and backward.

- **Pacing** is `home.film.beats` in `content/site.json`. Each beat maps a range of scroll distance (in viewport heights) to part of a clip. A beat with `"t": [x, x]` is a still-frame hold. Beats must be contiguous and end at `travel`; the build refuses anything else.
- **Copy timing** is `home.film.chapters[].in/out`, on the same viewport-height timeline.
- The engine is [`src/js/film.js`](src/js/film.js). It fetches the requested frame first, then its neighbours, then a coarse pass over the whole film. It keeps at most 18 decoded bitmaps and closes evicted ones. It shows the nearest frame while one loads, retries failed frames twice, and switches to a 2:3 portrait-cropped set on tall screens.
- **Fallbacks:** reduced motion, Save-Data/2G, or no canvas support renders the same chapters as still posters with all copy intact. The markup works without JavaScript.
- "Skip the film" jumps straight to the content.

To replace the footage, drop new clips into `media-src/film/` with the same names and run `npm run frames`. Then re-check `beats`, `lineY` and `FOCUS` in `tools/extract_frames.py`.

## Layout

```
content/site.json       every word on the site + film timing
src/pages.mjs           page templates (plain template literals)
src/style-tile.mjs      the style tile, built from the live CSS → /style-tile/
src/css/site.css        design tokens (Build Brief v3) + all styles
src/js/site.js          nav, menu, reveals, page wipe
src/js/film.js          the scroll film
public/                 copied as-is: fonts (self-hosted), brand marks, stills, film frames
media-src/              masters: original clips, full-res stills, brand files — not deployed
tools/extract_frames.py clip → graded, numbered WebP sequence + manifest
scripts/                build, serve, check
docs/PRODUCTION-NOTES.md  direction, story, prompts, job IDs, measurements, open items
```

## Deploying

Build, then publish `dist/`. On Vercel, set the build command to `npm run build` and the output directory to `dist`. Clean URLs (`/thinking/`) work on any static host that serves `index.html` for folders.

**Before launch**, see *Open items* in [`docs/PRODUCTION-NOTES.md`](docs/PRODUCTION-NOTES.md).
