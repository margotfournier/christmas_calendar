# After-Calendar — January 2026

This is a small React + Vite application that renders an interactive “after-calendar” for January 2026. Each day tile can be scratched off to reveal bespoke content (see `ScratchReveal`), weekend cells show a cozy window illustration with a sleeping animal, and snow/firworks effects are handled globally through the `Snowfall` overlay and `WinterIllustration` component so that the scene always feels cinematic.

## Emulating a specific today

While the calendar normally derives “today” from the system clock, you can override it in development by appending a `mockToday` (or legacy `today`) query parameter with any ISO-style date. For example, browse the dev server at `https://hymaia.github.io/ai_calendar_lbc/?mockToday=2026-01-15` and the interface will behave as if January 15 is the current day—only that card stays scratchable while the earlier tiles remain open. This is handy when previewing past or future months without manipulating the system clock.

## Build & preview

1. Install dependencies (only needed once or when you change `package.json`):

   ```bash
   npm install
   ```

2. Build the production bundle:

   ```bash
   npm run build
   ```

   This emits `dist/` with all assets wired to the `/ai_calendar/` base path defined in `vite.config.ts`.

3. Preview the production build locally:

   ```bash
   npm run preview
   ```

   Vite’s preview server respects the `base` setting, so you can verify the exact behavior that will ship to GitHub Pages.

## Updating GitHub Pages manually

A workflow pushes `dist/` to the `gh-pages` branch on every `main` push (`.github/workflows/gh-pages.yml`). If that workflow fails or you want to deploy manually:

1. Run the build again:

   ```bash
   npm run build
   ```

2. Push the current `dist/` into `gh-pages` using the `gh-pages` package shipped in `package.json`. If you need to copy files manually (when the workflow fails), run:

   ```bash
   npm run build
   git fetch origin gh-pages
   git checkout gh-pages
   rm -rf ./*
   cp -R dist/. .
   git add .
   git commit -m "deploy dist"
   git push origin gh-pages
   git checkout main
   ```

   That script publishes `dist/` to the `gh-pages` branch with the `/ai_calendar/` base intact.

3. Confirm the live site at `https://hymaia.github.io/ai_calendar/`.

If you still see stale content, run `git fetch origin gh-pages && git checkout gh-pages` to inspect the branch, then merge or fast-forward it to match the latest `dist/` before pushing again.

## Updating day tiles and URLs

Each tile is mapped from `public/days.yml`; edit that file whenever you want to change the title/URL shown for a specific date. The YAML is structured as:

```yaml
year: 2025
month: 12
days:
  - id: 2
    title: "Chat GPT features are available!"
    url: "https://example.com/your-link"
```
How to write `public/days.yml`:
- `id` must be the calendar day number, 
- `title` becomes the tile headline, and 
- `url` is optional—the existing scratch card components will automatically link to it. 

After editing, rebuild (`npm run build`) so the updated tiles ship with the new deploy.
