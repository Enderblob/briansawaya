# Brian Sawaya: portfolio site

One-page portfolio. Plain HTML, CSS, and vanilla JS. No build step, no dependencies.

**Everything the site says lives in `content.json`.** `index.html`, `styles.css`, and `main.js` only render it.
To update the site, edit `content.json` and drop images into `assets/`. You should rarely need to touch anything else.

Page order: Hero (name, one-liner, headshot, buttons) → Quick facts → Featured Projects (large cards) → Experience (compact timeline) → More Projects (small cards) → Skills.
A robotic heart assembles as the reader scrolls and beats at the bottom of the page.

## File tree

```
portfolio/
├── index.html                  page skeleton + the heart's inline SVG (no content, except <title> and meta description)
├── styles.css                  all styling; colors are variables at the top
├── main.js                     fetches content.json and renders the page
├── heart.js                    scroll-driven heart animation
├── content.json                ALL content: profile, links, about, timeline, skills
├── README.md                   this file
├── .nojekyll                   tells GitHub Pages to serve files as-is
└── assets/
    ├── resume.pdf              the resume every "Resume" button downloads
    ├── headshot.jpg            (add this) portrait photo for the hero
    ├── fonts/                  self-hosted Inter (body) and Fraunces (headings)
    └── projects/<slug>/        one folder per timeline entry: hero.jpg plus gallery photos
```

## Rules for anyone (human or AI agent) editing this site

1. Never add a GPA. Never mention De Anza, in any field.
2. Graduation date is May 2028.
3. `sanisure` (under NDA): Brian chose on 2026-11-09 to show the SaniSure name and logo. Keep the bullets exactly as they are and never add project photos or technical details. Logo only.
4. `samtec` and `jhta`: no images until Brian says they are cleared.
5. Only use facts from `Documents\Resumes\resume_bank.md`. Do not invent numbers.
6. Say what was built, not a quality. No "precision engineering" style wording.
7. Keep every entry scannable in about 3 seconds: bold title, one short impact line with a number, at most 3 tags and 3 bullets. The site cuts off a fourth tag or bullet and clamps the impact line to 2 lines.
8. `content.json` must stay valid JSON: double quotes, no trailing commas, no comments.
   Check it with `python -m json.tool content.json`.

## Preview locally

The page loads `content.json` with `fetch`, which browsers block on `file://`. Run a local server:

```
cd portfolio
python -m http.server 8000
```

Then open http://localhost:8000.

## Images

Every entry has one **hero image** (shown at 16:9, cropped to fit) and an optional **gallery** that appears when the entry is expanded.

- Put files in `assets/projects/<slug>/`. The hero is `hero.jpg`; name gallery photos `01.jpg`, `02.jpg`, ...
- Export heroes at about 1600 × 900 px (16:9), JPG or WebP, under 300 KB.
- **Until a file exists, the site shows a clean gray placeholder.** Every entry below already points at its `hero.jpg`, so dropping the file in is all it takes. No JSON edit.
  (While a photo is missing, the browser console logs one "404 not found" line for it. That is expected and goes away once the file is added.)
- An entry with `"image": ""` has no photo slot and always shows the placeholder.

### Image slots still empty

| Slot | Drop the photo here |
| --- | --- |
| Smart Insole (featured) | Shows a system diagram (`hero.svg`) for now. To use a photo, add `assets/projects/smart-insole/hero.jpg` and set `"image": "hero.jpg"` |

Remove a row from the table above when you fill its slot.

### Slots already filled

| Entry | Files |
| --- | --- |
| AutoLab | `hero.jpg` + gallery `01`–`05.jpg` |
| Linear Array Detector | `hero.jpg` + gallery `01`–`03.jpg` |
| Stanford research (OCT adapter) | `logo.svg` (Stanford wordmark) + gallery `00`–`05.jpg` |
| BioMyo | `hero.jpg` |
| Samtec, Boeing, DxD HealthTech (Stanford Biodesign logo) | `logo.png`, shown whole with `"imageFit": "contain"` |
| JHTA | `logo.svg`: simple drawing of the International Space Station |
| Headshot | `assets/headshot.jpg` (from Downloads) |
| Combat Robotics Club | `hero.jpg` + gallery `01`–`02.jpg` (Drive and Downloads) |
| NASA L'SPACE | `logo.svg` (NASA logo) + gallery `01.jpg`: Team ENHANCE concept-of-operations graphic |
| Bottle Opener | `hero.jpg`: team photo from Brian's LinkedIn post (April 19, 2025) |
| Posture Correction Wearable | `hero.jpg`: circuit photo from the T-PREP pitch deck (Canva) + gallery `01.jpg`: Best Presentation award |

Jobs that have no project photo use a logo. To swap a logo for a real photo, add `hero.jpg`, set `"image": "hero.jpg"`, and delete the `imageFit` line.
Samtec and JHTA stay logo-only until their project photos are cleared. The SaniSure project shows the company logo only and never gets project photos. The three ESB client projects (`linear-array-detector`, `sanisure`, `nexus-labs`) each name their client in `org`.

## content.json schema

Keys that start with `_` (like `_notes`) are notes for editors. The site ignores them.

| Key | What it holds |
| --- | --- |
| `profile.name` | Name in the nav and the hero heading |
| `profile.pitch` | The one-liner under the name. Says what Brian builds |
| `profile.facts[]` | Quick-facts row under the hero (school, grad date, what he is seeking). A Resume button is added at the end automatically |
| `links.email` | Plain address, no `mailto:` |
| `links.linkedin`, `links.github` | Full URLs. An empty string hides that link everywhere |
| `links.resume` | Path to the PDF (`assets/resume.pdf`) |
| `links.resumeFilename` | The file name visitors get when they download it |
| `about.headshot` | `{ "src", "alt" }`. Shown as a 4:5 portrait in the hero |
| `about.bio[]` | Optional short paragraphs under the one-liner. Keep it to one sentence |
| `timeline[]` | Jobs and projects (see below) |
| `skills[]` | `{ "group", "items": [] }` categories in the Skills section |

### Timeline entry

| Field | Required | Notes |
| --- | --- | --- |
| `slug` | yes | Unique, lowercase-with-dashes. It is the entry's link (`/#slug`) and its image folder name |
| `type` | yes | `"job"` goes in the Experience timeline. `"project"` goes in a project card |
| `featured` | no | Projects only. `true` puts it in Featured Projects as a large card (use 3 or 4). Featured cards appear in the order they have in this file, so put the strongest first |
| `title` | yes | Role or project name |
| `org` | no | Company, lab, club, or team |
| `dates` | yes | `{ "start": "YYYY-MM", "end": "YYYY-MM" }`. Use `"end": "present"` for ongoing work. Optional `"label"` overrides the displayed text (e.g. `"2025"`) while `start` and `end` still control sorting |
| `impact` | yes | One short line with a number. Aim for under 90 characters; the site shows 2 lines at most |
| `bullets[]` | no | Up to 3, shown only when expanded |
| `tags[]` | no | Up to 3 |
| `image` | no | Hero image. A bare file name (`"hero.jpg"`) means `assets/projects/<slug>/hero.jpg`; a value with a slash is used as written. `""` = no photo slot |
| `imageFit` | no | `"contain"` shows the whole image on white instead of cropping it to 16:9. Use it for logos |
| `imageAlt` | no | Description of the hero image for screen readers. Defaults to the title |
| `gallery[]` | no | Extra photos shown when expanded. File names (`"01.jpg"`) or `{ "src", "alt" }` objects. Files that do not exist yet are skipped |
| `video` | no | A YouTube or Vimeo URL, or a path to an `.mp4`. Or `{ "url", "title" }` |
| `links[]` | no | `{ "label", "url" }` |

**Order:** Experience and More Projects sort newest first automatically (ongoing work on top, then by end date, then start date). Featured Projects keep file order.

### Add a project: copy-paste template

1. Make the folder `assets/projects/my-new-project/` and put `hero.jpg` (and any gallery photos) in it.
2. Paste this object anywhere inside the `"timeline": [ ... ]` array in `content.json`, and fill it in:

```json
{
  "slug": "my-new-project",
  "type": "project",
  "featured": false,
  "title": "Project Name",
  "org": "Team, club, or company",
  "dates": { "start": "2027-01", "end": "present" },
  "impact": "One short line with a number: what it is and how well it works.",
  "bullets": [
    "What you designed or built",
    "How you tested it and the result",
    "What you owned on the team"
  ],
  "tags": ["Robotics", "CAD", "Electronics"],
  "image": "hero.jpg",
  "gallery": ["01.jpg", "02.jpg"],
  "video": "",
  "links": [
    { "label": "Write-up", "url": "https://example.com" }
  ]
}
```

3. Mind the commas: every object in the array is followed by a comma except the last one.
4. Preview locally, then commit and push.

For a job, use `"type": "job"` and leave out `featured`.

## Swap the resume

1. Export the new resume as a PDF (one page, no GPA).
2. Save it over `assets/resume.pdf`. Keep that exact name and every Resume button picks it up.
3. Commit and push.

To change the downloaded file name, edit `links.resumeFilename` in `content.json`.

## The robotic heart

- The drawing is inline SVG at the bottom of `index.html`. Each part is a `<g class="hp">` with its timing on it:
  `data-s` / `data-e` = the scroll progress (0 to 1) where the part starts and finishes arriving,
  `data-dx` / `data-dy` / `data-rot` = the offset and rotation it flies in from,
  `data-cx` / `data-cy` = the point it rotates around. Change those numbers to re-time or re-aim a part.
- `heart.js` turns scroll position into part positions. At 98% scroll it adds the class `complete`.
- The beat (about 70 bpm), orange glow, ECG line, and spinning gears are CSS animations at the bottom of `styles.css`, switched on by `.heart.complete`.
- On screens 1240 px and wider it is a side panel next to the page column. Below that it is a 64 px badge in the bottom-right corner that does not block taps.
- Visitors with "reduce motion" turned on see the finished heart, with no flying parts and no beating.
- To remove it: delete the `<div class="heart">` block and the `heart.js` script tag from `index.html`.

## Change the look

Colors, radius, and fonts are CSS variables at the top of `styles.css` (`--bg`, `--ink`, `--accent`, ...).
`--accent` is the bright orange for dots and fills. `--accent-ink` is the darker orange for link text, so it stays readable.

The page title and the description that shows in Google and link previews are in the `<head>` of `index.html`. Those are the only pieces of content outside `content.json`.

## Deploy to GitHub Pages (from the repo root)

One-time setup:

1. Create a new **public** repository on GitHub.
   - Name it `<your-username>.github.io` to get the short URL `https://<your-username>.github.io/`.
   - Any other name works too and is served at `https://<your-username>.github.io/<repo-name>/`. All paths in this site are relative, so both work.
2. From this folder:

   ```
   git init -b main
   git add .
   git commit -m "Portfolio site"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Build and deployment**. Set **Source** to "Deploy from a branch", **Branch** to `main`, folder `/ (root)`, and save.
4. Wait about a minute, then open the URL shown at the top of the Pages settings.

After that, every push to `main` redeploys the site:

```
git add .
git commit -m "Add new project"
git push
```

Optional custom domain: Settings → Pages → Custom domain, then follow GitHub's DNS instructions. GitHub adds a `CNAME` file to the repo for you.
