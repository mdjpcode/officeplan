# Office Seating & Location Tracker

## Project structure

- `src/config.js` staff list, room capacities, start date.
- `src/App.jsx` SPA with date picker, occupancy dashboard, assignment flow.
- `src/api.js` GET/POST integration with Apps Script endpoint.
- `.github/workflows/deploy.yml` GitHub Pages deploy workflow.
- `apps-script.gs` Google Apps Script backend.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local`:
   ```bash
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/REPLACE_WITH_DEPLOYMENT_ID/exec
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```

## Google Sheets + Apps Script setup

1. Create a new Google Sheet (any name).
2. Open **Extensions → Apps Script**.
3. Replace the default script with the contents of `apps-script.gs`.
4. Click **Deploy → New deployment**.
5. Select **Web app**.
6. Execute as: **Me**.
7. Who has access: **Anyone**.
8. Deploy and copy the Web App URL.
9. Add the URL as:
   - local: `.env.local` (`VITE_APPS_SCRIPT_URL=...`)
   - GitHub: repo **Settings → Secrets and variables → Actions** create secret `VITE_APPS_SCRIPT_URL`.

## GitHub Pages setup

1. Push to `main`.
2. In GitHub repo: **Settings → Pages**.
3. Set source to **GitHub Actions**.
4. Workflow `.github/workflows/deploy.yml` will build and deploy automatically.

## Notes

- The app enforces weekday-only selection (Mon-Fri) and a minimum date of `2026-05-01`.
- Room capacities are enforced in the UI; full rooms disable assignment.
- `Remote` and `Client Site` are unlimited-capacity locations.
