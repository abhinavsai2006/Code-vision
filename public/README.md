# Public / Static Assets

This folder serves static assets used by the app (icons, static HTML, images).

- Keep images under descriptive subfolders (e.g., `images/`, `icons/`).
- Favicons and metadata belong in `public/` so the dev server serves them as-is.

When building (`npm run build`) assets are copied into the production bundle by Vite.
