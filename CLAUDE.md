# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RSVP site for Rafael's Baby Shower (Sunday, August 16, 2026, 1:00 PM, Maggiano's Little Italy, Nashville). Two deployable pieces that live in one repo but deploy to different places:

- `index.html` — the entire site: markup, styles, and JS in one file, no build step, no dependencies. Deployed via **GitHub Pages**: pushing to `main` of `Pnabhan/rafaels-baby-shower` publishes to **https://pnabhan.github.io/rafaels-baby-shower/** (takes ~1 minute; verify with a curl for the changed content).
- `apps-script/Code.gs` — the form backend. It is **not** deployed from this repo: it is pasted into the Google Apps Script editor attached to the **Baby_Shower_Tracker_Aug16_UPDATED** Google Sheet (owned by peternabhan1@gmail.com) and deployed there as a Web App (Execute as Me / access Anyone). Editing `Code.gs` here does nothing until it's re-pasted and re-deployed in the Apps Script editor.

## Development

There is no build, lint, or test tooling. To preview locally, open `index.html` in a browser (or `python -m http.server`). Form submission uses `fetch(..., { mode: "no-cors" })` to the Apps Script URL, so the response is opaque by design — success can only be verified by checking that a row appears in the sheet's **RSVP Responses** tab.

## Where things are configured

All event/user-facing content lives in `index.html`:

- `CONFIG` (top of the `<script>` block) — `SCRIPT_URL` (Apps Script Web App URL) and `REGISTRY_URL` (baby registry). If `SCRIPT_URL` is empty the form shows a not-configured error instead of submitting; if `REGISTRY_URL` is empty the registry button hides itself.
- `EVENT` — calendar event fields used to build both the Google Calendar link and the generated `.ics` download. Times are UTC (event is 1:00–4:00 PM CDT = 18:00–21:00 UTC).
- Hero/venue markup — the human-readable date, time, and address strings are duplicated in the HTML; keep them in sync with `EVENT` when changing event details.

## Data flow

Form → POST (URL-encoded) → Apps Script `doPost` → appends a row to the **RSVP Responses** tab (creating it with headers if missing) → email notification to the hosts. Age groups are three buckets matching the tracker's columns: **12+ Adult**, **Kids 5–12**, **Under 5**. The Guest Tracker tab is intentionally never written to directly — reconciliation from RSVP Responses into the tracker is manual/assisted.
