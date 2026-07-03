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

/** Health check — visiting the web app URL in a browser shows this. */
function doGet() {
  return ContentService.createTextOutput(
    "Baby Nabhan's Baby Shower RSVP endpoint is live. 💙"
  );
}
