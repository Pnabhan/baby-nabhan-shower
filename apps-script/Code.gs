/**
 * Baby Nabhan's Baby Shower — RSVP receiver
 *
 * Attach this script to the "Baby_Shower_Tracker_Aug16_UPDATED" spreadsheet
 * (Extensions → Apps Script), then deploy as a Web App:
 *   Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Each RSVP from the website is appended as a row in the
 * "RSVP Responses" tab (created automatically on first submission).
 */

var SHEET_NAME = "RSVP Responses";
var NOTIFY_EMAIL = "peternabhan1@gmail.com"; // set to "" to disable email alerts

var EVENT = {
  title: "Baby Boy Nabhan's Shower",
  startUTC: "20260816T180000Z", // 1:00 PM CDT
  endUTC: "20260816T210000Z",   // 4:00 PM CDT
  location: "Maggiano's Little Italy, 3106 West End Ave, Nashville, TN 37203",
  registry: "https://my.babylist.com/odetteandpeter",
  siteUrl: "https://pnabhan.github.io/baby-nabhan-shower/",
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // serialize concurrent submissions

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Timestamp", "Name", "Phone", "Email", "Attending",
        "Adults (12+)", "Kids 5–12", "Kids Under 5", "Total",
        "Attendees (name + age group)", "Notes",
      ]);
      sheet.setFrozenRows(1);
      sheet.getRange("A1:K1").setFontWeight("bold");
    }

    var p = e.parameter;
    sheet.appendRow([
      new Date(),
      p.name || "",
      "'" + (p.phone || ""), // leading apostrophe keeps phone formatting
      p.email || "",
      p.attending || "",
      Number(p.adults || 0),
      Number(p.kids5to12 || 0),
      Number(p.under5 || 0),
      Number(p.total || 0),
      p.attendees || "",
      p.notes || "",
    ]);

    // Confirmation email + calendar invite to the guest (only when attending)
    if (p.email && p.attending === "Yes") {
      try {
        sendGuestConfirmation(p);
      } catch (guestMailErr) {
        // Guest email failure must never block the RSVP from being recorded.
      }
    }

    if (NOTIFY_EMAIL) {
      try {
        MailApp.sendEmail(
          NOTIFY_EMAIL,
          "RSVP: " + (p.name || "Someone") + " — " + (p.attending || "?") +
            (p.total ? " (" + p.total + " attending)" : ""),
          "Name: " + (p.name || "") + "\n" +
            "Phone: " + (p.phone || "") + "\n" +
            "Email: " + (p.email || "") + "\n" +
            "Attending: " + (p.attending || "") + "\n" +
            "Adults (12+): " + (p.adults || 0) + "\n" +
            "Kids 5–12: " + (p.kids5to12 || 0) + "\n" +
            "Kids Under 5: " + (p.under5 || 0) + "\n" +
            "Total: " + (p.total || 0) + "\n" +
            "Attendees: " + (p.attendees || "") + "\n" +
            "Notes: " + (p.notes || "")
        );
      } catch (mailErr) {
        // Email failure must never block the RSVP from being recorded.
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/** Confirmation email with attached calendar invite, sent to the guest. */
function sendGuestConfirmation(p) {
  var ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Baby Nabhan Shower//RSVP//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    "UID:baby-nabhan-shower-20260816@rsvp",
    "DTSTAMP:" + Utilities.formatDate(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'"),
    "DTSTART:" + EVENT.startUTC,
    "DTEND:" + EVENT.endUTC,
    "SUMMARY:" + EVENT.title,
    "LOCATION:" + EVENT.location.replace(/,/g, "\\,"),
    "DESCRIPTION:Join Peter Nabhan & Odette Abou Ghanem! Starts at 1:00 PM sharp." +
      "\\n\\nBaby registry: " + EVENT.registry,
    "ORGANIZER;CN=Peter Nabhan:mailto:" + NOTIFY_EMAIL,
    "ATTENDEE;CN=" + (p.name || "Guest") + ";RSVP=FALSE:mailto:" + p.email,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:" + EVENT.title + " is tomorrow — 1:00 PM sharp!",
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  MailApp.sendEmail({
    to: p.email,
    subject: "You're confirmed — " + EVENT.title + " 💙",
    htmlBody:
      "<div style='font-family:Georgia,serif;max-width:560px;margin:auto;" +
      "background:#faf5eb;padding:32px;border:2px solid #c6a04a;border-radius:12px;color:#1e2a3e;'>" +
      "<p style='letter-spacing:3px;color:#c6a04a;text-align:center;font-size:13px;'>RSVP CONFIRMED</p>" +
      "<h2 style='text-align:center;margin:8px 0 20px;'>" + EVENT.title + "</h2>" +
      "<p>Hi " + (p.name || "there") + ",</p>" +
      "<p>Thank you for your RSVP — we can't wait to celebrate with you! 🎉</p>" +
      "<p><strong>🗓 Sunday, August 16, 2026 · 1:00 PM sharp</strong><br>" +
      "📍 " + EVENT.location + "</p>" +
      "<p>Your party (" + (p.total || "?") + "): " + (p.attendees || "") + "</p>" +
      "<p>The attached calendar invite adds the event to your calendar with a built-in reminder.</p>" +
      "<p>🎁 Baby registry: <a href='" + EVENT.registry + "'>" + EVENT.registry + "</a><br>" +
      "✏️ Need to change your RSVP? Just submit the form again: " +
      "<a href='" + EVENT.siteUrl + "'>" + EVENT.siteUrl + "</a></p>" +
      "<p style='margin-top:24px;'>With love,<br>Peter & Odette 💙</p>" +
      "</div>",
    attachments: [Utilities.newBlob(ics, "text/calendar", "Baby-Nabhan-Shower.ics")],
    name: "Peter & Odette",
  });
}

/** Health check — visiting the web app URL in a browser shows this. */
function doGet() {
  return ContentService.createTextOutput(
    "Baby Nabhan's Baby Shower RSVP endpoint is live. 💙"
  );
}
