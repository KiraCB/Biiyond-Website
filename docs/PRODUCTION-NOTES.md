# Production notes: biiyond.com

28 September 2026 · built against the *Leafcut + Biiyond Web Art Direction Brief v2* (0.3), *Biiyond.com Build Brief v3* and the approved copy prototype (claude.ai artifact f477cbf3).

## 1. Direction

**"One line, carried through"** (Brief v3 §3), taken literally and put on film.

The Biiyond mark is a line that runs flat, rises once and runs on. Seen as a picture, that shape is a horizon with a single peak. Biiyond is made in Nepal. So the home page is a single continuous shot in which the line *becomes* a Himalayan ridge, catches first light, and then continues as the horizon above the clouds. The logo is the film's storyboard.

After the film, the line keeps working and nothing else is added (Brief v3 §9):

- the loop is the separator in every marquee;
- it is the oversized watermark behind the dark statement sections and the contact page;
- it grows into the company tree;
- it is the clay scroll spine on the left edge and the mark in the green page-transition wipe;
- the wordmark bleeds off the footer;
- every still on the inner pages also carries one horizontal line of light: a lokta-paper thread, the valley ridgeline, terrace edges, and a road's light-trail that draws the mark exactly.

The site stays true to Brief 0.3 §8: Biiyond is *"minimal, cinematic and editorial… fewer sections and fewer words than Leafcut"*, and *"should not look like Leafcut with a different logo."* The interaction budget is spent once, on the film, and the rest is quiet editorial typography.

## 2. Visual story

| Scene | Visual story | Website copy |
| --- | --- | --- |
| 01 — Opening | Darkness. A single thin line of pale light is drawn across the frame in CSS, then the footage fades up beneath it. The line holds still. | **We build the kind of company we *wanted* to work at.** · Biiyond Production Pvt. Ltd. · Scroll |
| T1 — The line becomes the mountain | Right of centre, the line swells into one rounded summit and settles flat again, the shape of the mark. The Himalayan range resolves out of the dark below; the line becomes rim light on the ridge. | No copy — let the motion lead. |
| 02 — First light | Locked-off camera. Dawn touches only the summit in clay-orange (the brand's signal colour) and spreads down the snow. Mist moves in the valleys. | [01] Where we are · **Made in Nepal.** · two paragraphs (lockdown origin; "Nepal is not a discount") |
| T2 — The rise | The camera cranes up; clouds rise and swallow the valleys. | No copy — let the motion lead. |
| 03 — The line continues | Above a sea of clouds, the horizon has become one warm line of dawn, edge to edge. The summit is small at right. Line → peak → line. | [02] The whole idea · **Almost everything good is made by a small group of people who cared more than they had to.** · two paragraphs → then the marquee, the company tree and the careers invitation. |

**How it connects:** it's one continuous take in three generated clips. Each clip starts from the *actual last frame* of the one before, extracted and re-uploaded as its start frame. The copy is real HTML over the canvas, and it fades and rises in on its beat and out before the next motion beat, so no text ever covers the transformation. Text sits in the dark lower-left third, which every frame keeps clear.

### Scroll pacing

Pacing is measured in viewport heights (vh) of pinned scroll. The pinned travel totals 7.6 vh, which is counted separately from the 100 svh stage.

| Beat | Scroll (vh) | Frames | Motion |
| --- | --- | --- | --- |
| Opening hold | 0.00–0.70 (0.70) | A 0 | still-frame hold; headline readable |
| Line stirs | 0.70–1.00 (0.30) | A 0→12% | headline leaves (0.85–1.15) |
| **Line → ridge** | 1.00–2.45 (**1.45**) | A 12→62% | the key moment gets the most scroll |
| Range settles | 2.45–2.95 (0.50) | A 62→100% | faster through the settle |
| First light | 2.95–5.00 (2.05) | B 0→100% | "Made in Nepal" visible 3.2–4.75 |
| The rise | 5.00–6.75 (1.75) | C 0→100% | motion only |
| Horizon hold | 6.75–7.60 (0.85) | C end | closing copy from 6.15; stays as the stage releases |

These are starting values, and they were checked with real scrolling in Chromium (§6). Tune them in `content/site.json → home.film.beats`.

## 3. Asset provenance

All imagery was generated in **Higgsfield** (project *"Biiyond Website — Cinematic Scroll Story"*, `a2ca359a-882f-4241-92a2-a3ff244b1098`). No people, offices, stock or logos appear in any generated asset (Brief v3 §9).

| Asset | Model | Job / media ID | Notes |
| --- | --- | --- | --- |
| Key 02 — ridge (master composition) | GPT Image 2.5 | `7990aeaa-5376-4d8d-82b2-8570a5e7ce1c` | Chosen from 2 candidates: its ridgeline reproduces the mark's rise-and-settle |
| Key 01 — the line | GPT Image 2.5 (edit of Key 02) | `1a5697e2-9d9d-48c0-ae52-f27cd230dc30` | line at the ridge's exact height |
| Key 03 — first light | GPT Image 2.5 (edit of Key 02) | `c15a2130-c19b-4a3e-b41a-471d74dfa5da` | composition locked |
| Key 04 — above the clouds | GPT Image 2.5 (ref. Key 02) | `07dc3fad-aeae-425b-8085-98a449a9b95d` | |
| Clip A — line → ridge, 10 s | Kling 3.0 Pro, start Key 01 / end Key 02 | `912716a1-b831-47df-b093-894860d9baac` | |
| Clip B — first light, 10 s | Kling 3.0 Pro, start = **A's last frame** (`20263b7a-…`) / end Key 03 | `6aa0f82a-f37c-46c6-84c1-f5d3cd21a7e5` | seam A→B: mean Δ 2/255 |
| Clip C — above the clouds, 10 s | Kling 3.0 Pro, start = **B's last frame** (`7ce01a9a-…`) / end Key 04 | `095e5fe2-d022-424c-b601-768a60e2e4a4` | seam B→C: mean Δ 2/255 |
| Thinking header — lokta thread | GPT Image 2.5 | `caff86df-2b40-415f-a627-350a751983df` | |
| Careers header — valley at night | GPT Image 2.5 | `0dcbc49b-803b-4c36-8a62-033084df55d7` | |
| Investors header — terraces | GPT Image 2.5 | `8718584a-9071-49f5-9763-a10728e020a2` | "built over generations" = assets, not income |
| Thinking strip — road light-trail | GPT Image 2.5 | `04ac0738-191a-4a4d-8f4b-e96ae1ca51d7` | the mark, drawn by light |
| Vipassana (held) — still lake | GPT Image 2.5 | `7e8543df-0507-4a02-a862-54fb837514c2` | ready for when the section is switched on |

**Credits used:** 64 (610 → 546).

**Brand marks:** the wordmark, loop symbol and the two Leafcut leaves were extracted unchanged from the approved prototype. They are raster masters and have not been redrawn.

**Fonts:** Archivo and Montserrat (both OFL), self-hosted from Google Fonts' woff2 files.

### Key prompts (abridged; full text lives in the Higgsfield project)

- **Key 02:** *"Pre-dawn blue hour in the Nepal Himalaya… ridgeline runs nearly flat… rises smoothly into ONE single rounded, dome-like snow summit slightly right of centre… falls back to a flat ridgeline… a thin, crisp rim of pale cool light traces exactly along the whole ridgeline like a single glowing drawn line. The left third of the frame is very dark… deep green-black, slate, cool bone-white highlights… No text, no people…"*
- **Clip A:** *"One continuous shot, no cuts. Locked-off camera… A single thin horizontal line of pale light glows in total darkness. Slowly, right of centre, the line gently lifts and swells into one smooth rounded summit, then settles flat again on both sides, like a drawn line becoming a mountain…"*
- **Clip B:** *"…Dawn arrives: first sunlight touches only the very top of the summit, a warm clay-orange glow that slowly spreads down the snow…"*
- **Clip C:** *"…Slow, smooth crane shot… rises… until it is high above a vast calm sea of clouds… The long flat horizon of the cloud sea becomes one thin continuous line of warm dawn light from edge to edge…"*
- A Higgsfield preset ("IN THE DARK") was suggested and declined, because the literal keyframe control mattered more.

## 4. Grade and measurements

- **Grade:** Kling drifted teal mid-clip A (measured sky rgb(0,21,21)). One grade is applied to every frame in `tools/extract_frames.py` (`colorbalance … eq=saturation=0.8`), bringing the sky to rgb(4,20,13) against the brand void #04140A = rgb(4,20,10).
- **Line position:** the line in frame 0 sits at 38.3% of frame height. The CSS intro line is placed there by the engine's own cover-fit maths, so the drawn line lands on the filmed one at any viewport size.
- **Sequence:** 382 frames. A has 141 frames sampled at 14 fps, B has 110 at 11 fps, C has 131 at 13 fps. The landscape set is 1600×900 WebP q72, 3.9 MB total (4–16 KB per frame). The portrait set is a 640×960 crop centred on the summit, 2.0 MB total.
- **Seams:** the mean absolute pixel difference between A's last frame and B's first, and between B's last and C's first, is 2/255 at both joins.
- **Masters:** the original MP4s (1924×1076, 24 fps) and full-resolution PNG stills are in `media-src/`.

## 5. Decisions and assumptions

- **Copy is the prototype's, word for word**, as confirmed by the CEO. There are only two additions, both small chapter labels over the film: "[01] Where we are" and "[02] The whole idea".
- **Order change on home:** in the prototype, *Almost everything good…* came before *Made in Nepal*. It now follows it, because dawn is the origin story and the horizon is the idea it leads to. No copy changed.
- **Careers email:** the prototype uses **careers@biiyond.com**, but the 26 Aug build-status note says *"hr@biiyond.com is the careers address"*. I kept the prototype's address. **Confirm which is right** (`site.emails.careers`).
- **Academy "Opening 2026"** is bracketed as to-be-confirmed, since it is now late September 2026.
- **Leafcut links** are held as "Soon" until both domains resolve (Brief v3 blocker).
- **No stack change:** the build is static HTML with no framework, a choice made on purpose. The engine is a single dependency-free file, so it can be dropped into a Next.js component later if the team wants.
- **Artlist:** it was available, and deliberately not used on this site. The only thing Artlist could add here is more footage or music, and Brief 0.3 asks Biiyond to be *simpler and more distilled*, with the interaction budget leaning toward Leafcut. It is a good candidate for an **opt-in** ambient sound bed for the film, and for Leafcut's AI Studio showreels.

## 6. What was verified, and what wasn't

**Verified in headless Chromium 141** (`npm run check`, at desktop 1440×900 and mobile 390×844 @2×):

- The film scrubs **forward and in reverse** to within ±1 frame of the timeline at eight scroll positions.
- Chapter copy is fully readable on its beat, and no copy sits over the motion-only beats.
- "Skip the film" works.
- The mobile menu opens, is focusable, and closes with Escape.
- There is no horizontal overflow on any page, and zero console errors.
- The reduced-motion fallback renders all three chapters as stills.
- The build fails on any broken local reference or missing frame.

**Not verified:**

- Real devices (iOS Safari's address-bar resize, low-end Android memory, trackpad inertia) and real-network load times.
- Screen-reader passes.

These should be done on real hardware before launch. Headless screenshots show the composition, not how smooth it feels.

## 7. Open items before launch

These are Brief v3 blockers and items from this build:

1. **Tagline-free wordmark and loop symbol as SVG.** Rasters are used as masks for now, and they soften on very large screens (especially the footer wordmark).
2. **Confirm the careers address:** careers@ or hr@.
3. **Confirm Leafcut Academy status**, currently "[Opening 2026]".
4. **Confirm the registered office address and phone** against the OCR certificate.
5. **Flip `external.*.live`** once leafcut.studio and leafcut.academy resolve.
6. **Real Nepal footage (recommended).** The generated Himalaya is a strong stand-in, but Biiyond is a video company that says "Made in Nepal". A 10-second locked-off dawn shot of a real single peak (Machhapuchhre or Ama Dablam), shot by the team, would be more honest and harder to copy. The story, timing and engine stay exactly the same: re-run `npm run frames`.
7. **Investors page claims** ("no debt", "next twelve months are funded") come straight from the prototype copy. Make sure they are still accurate on launch day.
8. Test on real devices (§6).
