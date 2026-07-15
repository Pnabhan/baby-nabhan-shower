# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RSVP site for **Baby Boy Nabhan's Shower** (Sunday, August 16, 2026, 1:00–4:00 PM CT, Maggiano's Little Italy, Nashville). The baby's actual name is a surprise until the event — it must never appear in anything guest-visible: page text, URLs, repo name, `.ics` internals, email copy, or the OG image. Two deployable pieces live in one repo but deploy to different places:

- `index.html` — the entire site: markup, styles, and JS in one file, no build step, no dependencies. Deployed via **GitHub Pages**: pushing to `main` of `Pnabhan/baby-nabhan-shower` publishes to **https://pnabhan.github.io/baby-nabhan-shower/** (takes ~1 minute; verify with a curl for the changed content). Pushing works via the GitHub CLI credential helper (`gh` is installed and authenticated as Pnabhan since 2026-07-14; credential lives in Windows Credential Manager).
- `apps-script/Code.gs` — the form backend, project name "Baby Shower RSVP Receiver". It is **not** deployed from this repo: it lives in the Google Apps Script editor attached to the old **Baby_Shower_Tracker_Aug16_UPDATED** Google Sheet (owned by peternabhan1@gmail.com), deployed as a Web App (Execute as Me / access Anyone). Since 2026-07-14 all writes go to **Baby_Shower_Tracker_MASTER** (`MASTER_SPREADSHEET_ID` in Code.gs, via `openById`) — the old sheet is an archive; the script merely lives there. Editing `Code.gs` here does nothing until it's synced into the editor and re-deployed: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (this keeps the same `/exec` URL that `index.html` points at — never create a brand-new deployment or the URL changes). The script requires the **Calendar advanced service** (Services + → Google Calendar API, identifier `Calendar`); any change that adds OAuth scopes makes the next run/deploy prompt Peter to re-authorize.

## Development

There is no build, lint, or test tooling. Local preview: `.claude/launch.json` defines the **rsvp-site** server (`python -m http.server 8642`). Form submission uses `fetch(..., { mode: "no-cors" })` to the Apps Script URL, so the browser response is opaque by design.

To test the backend directly: POST url-encoded fields to the `/exec` URL with curl, then GET the `Location` header it 302s to — the body is `{"ok":true}` on success. Any test submission should use a name starting with `TEST` so it's easy to purge; note a "Yes" test with a real email will email that person and send them a calendar invite.

`og-image.png` is the 1200×630 link-preview card referenced by the OG meta tags; it was generated with Python/Pillow (Georgia fonts, cream/navy/gold to match the site). Regenerate it if event details change, and keep title/date/venue text large — messaging apps render it at half size.

## Where things are configured

All event/user-facing content lives in `index.html`:

- `CONFIG` (top of the `<script>` block) — `SCRIPT_URL` (Apps Script Web App URL) and `REGISTRY_URL` (baby registry). If `SCRIPT_URL` is empty the form shows a not-configured error instead of submitting; if `REGISTRY_URL` is empty the registry button hides itself.
- `EVENT` — calendar event fields used to build both the Google Calendar link and the generated `.ics` download. Times are UTC (event is 1:00–4:00 PM CDT = 18:00–21:00 UTC).
- Hero/venue markup — the human-readable date, time, and address strings are duplicated in the HTML; keep them in sync with `EVENT` when changing event details.

## Data flow

Form → POST (URL-encoded) → Apps Script `doPost` →

1. appends a row to the **RSVP Responses** tab of **Baby_Shower_Tracker_MASTER** (creating it with headers if missing);
2. if attending = "Yes" with an email: adds the guest as an attendee on the guest-facing Google Calendar event (`CALENDAR_EVENT_ID` in Code.gs, on Peter's calendar) with `sendUpdates: "all"` — Google then emails them a **native invitation with Yes/Maybe/No buttons** — and sends a styled confirmation email from "Peter & Odette" with the registry link;
3. emails a notification to `NOTIFY_EMAIL`.

Each step is wrapped so a failure never blocks the sheet append. Age groups are three buckets matching the tracker's columns: **12+ Adult**, **Kids 5–12**, **Under 5**.

Two calendar events exist on Peter's calendar for the same afternoon — the guest-facing one (guest list hidden, clean description) and his private "Baby Shower @ Maggiano's" planning event containing venue-contact/budget notes. Never attach guests to the planning event.

The Guest Tracker tab is intentionally never written to by `doPost` — reconciliation from RSVP Responses into the tracker (phone → col D, RSVP Status → I, Attending → J, Follow-up? → P, Notes → Q) is assisted: flag partial headcounts and name ambiguities rather than guessing.
