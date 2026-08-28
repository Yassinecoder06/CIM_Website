# CIM — Club INSAT Maintenance

Premium, responsive engineering-club website built with Vite, React, and TypeScript.

## Run locally

```bash
npm install
npm run dev
```

Use `npm run build`, `npm run lint`, and `npm test` before deployment. The build is a client-side app: configure your static host to rewrite unknown paths to `index.html` so a direct visit to `/join` works.

## Add content and assets

- **Activities and verified events:** [`src/data/content.ts`](src/data/content.ts)
- **Bureau members:** add real profiles to the `team` array in [`src/data/content.ts`](src/data/content.ts). Put portrait files under `public/assets/team/` and use paths such as `/assets/team/name.jpg`.
- **Event imagery and galleries:** put files under `public/assets/events/`, then add `image` and optional `gallery` paths to the relevant event. Entries without images intentionally use a technical archive fallback.
- **Club memories gallery:** the original club photos stay untouched in `cim_photos/`. Optimized display copies are in `public/assets/memories/`, and their accessible descriptions/order are in [`src/data/memories.ts`](src/data/memories.ts).
- **Club logo:** `public/assets/cim-logo-source.jpeg` is a display copy of the supplied artwork; the original root JPEG is untouched. Replace the display copy when a transparent/vector official mark is available.
- **Engineering story visuals:** the cinematic, CIM-branded bike is a direct application asset at `public/assets/cim-bike/Scroll Bike.glb`. Its editable frame and wheel decal sources are `public/assets/cim-bike/cim-bike-frame-brand.png` and `public/assets/cim-bike/cim-bike-wheel-brand.png`. The supplied static motorcycle image remains as the no-WebGL/reduced-motion fallback.
- **Social links:** set `VITE_FACEBOOK_URL` and `VITE_LINKEDIN_URL`. The footer hides both until valid values are supplied.

## Edit the 3D scroll story

The story is loaded directly by the app as a viewport-pinned 3D scene. Its ViewBox focus rectangle and six chapter elements use `data-timeline-marker` values to drive the authored timeline. Do not remove, reorder, or duplicate these markers: their DOM order controls the six animation moments, including the final reassembly.

- Edit CIM chapter copy and its timeline markers in [`src/components/cim-story/storyScene.ts`](src/components/cim-story/storyScene.ts).
- The scene bridge is [`src/components/cim-story/CimBikeScene.tsx`](src/components/cim-story/CimBikeScene.tsx). It loads the direct asset at `/assets/cim-bike/Scroll%20Bike.glb`.
- Replace that GLB with a compatible exported asset when changing the 3D animation. Keep the six timeline markers in the same order so the scroll story remains synchronized.
- The CIM decal source files above are retained with the app for future visual updates. Run `npm run dev` to see content and asset changes immediately.

The 3D runtime is loaded only when the story mounts. The page first buffers the self-contained bike GLB in browser memory and shows a CIM loading screen until the renderer emits its completed-load event. Visitors with reduced-motion enabled, or without WebGL, receive the static motorcycle fallback.

## Registration → Google Sheets

The Join page uses a native form POST to an Apps Script web app inside a hidden iframe. This avoids exposing any Google credential and still lets the website display its own technical confirmation after Apps Script replies with `postMessage`.

1. Create a Google Sheet owned by CIM; its responses can be exported as Excel at any time.
2. In that Sheet, open **Extensions → Apps Script**, replace the starter file with [`apps-script/Code.gs`](apps-script/Code.gs), and set:
   - `CONFIG.spreadsheetId` to the ID from the Sheet URL.
   - `CONFIG.allowedReturnOrigins` to the public website origin(s), such as `https://cim-insat.tn`. For local testing, add `http://localhost:5173`.
3. Deploy **New deployment → Web app**. Execute as yourself/CIM’s service owner and permit access for anyone. Copy the `/exec` URL—do not use the test `/dev` URL in production.
4. Copy `.env.example` to `.env.local`; set `VITE_REGISTRATION_ENDPOINT` to that `/exec` URL and set `VITE_REGISTRATION_ALLOWED_ORIGINS` to the Apps Script origins already shown in the example. Never commit `.env.local`.
5. Submit one test response. A `CIM Registrations` sheet tab with headers is created automatically. Check its row, try an invalid email, and submit the same address twice to verify validation/rate limiting.

The handler validates all required fields again on the server, rejects non-allowed return origins, ignores filled honeypots, and only sends the result to the configured site origin. It does not use or expose service-account credentials.

## Deployment notes

- Upload the `dist/` directory after `npm run build`.
- Add an SPA fallback/rewrite (`/* → /index.html`) on Netlify, Vercel, Cloudflare Pages, or equivalent.
- Before publishing the real endpoint, remove `http://localhost:5173` from the Apps Script allow-list if it is no longer needed.
