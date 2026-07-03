# Rafael's Baby Shower — RSVP Site

A single-page RSVP website for Rafael's Baby Shower.

**Event:** Sunday, August 16, 2026 · 1:00 PM sharp
**Venue:** Maggiano's Little Italy, 3106 West End Ave, Nashville, TN 37203

## How it works

- `index.html` — the entire site (no build step). Hosted on GitHub Pages.
- `apps-script/Code.gs` — Google Apps Script attached to the
  **Baby_Shower_Tracker_Aug16_UPDATED** spreadsheet. Receives form submissions
  and appends them to an **RSVP Responses** tab, plus emails a notification.

Guests fill in name / phone / email, whether they're attending, each
attendee's name with an age group (**12+ Adult**, **5–12**, **Under 5**),
and optional notes. The page also offers **Get Directions**, **Add to
Google Calendar**, an **Apple/Outlook .ics** download, and a **baby
registry** button.

## One-time setup

1. Open the tracker spreadsheet → **Extensions → Apps Script**.
2. Paste in `apps-script/Code.gs`, save.
3. **Deploy → New deployment → Web app** — Execute as **Me**, access
   **Anyone** — authorize, and copy the Web App URL.
4. In `index.html`, set `CONFIG.SCRIPT_URL` to that URL and
   `CONFIG.REGISTRY_URL` to the registry link. Commit and push.

## Editing event details

Everything user-facing lives in `index.html`:
- `CONFIG` (top of the `<script>`) — Apps Script URL + registry URL.
- `EVENT` — calendar title, start/end (UTC), location, description.
- Hero/venue markup — date, time, address text.
