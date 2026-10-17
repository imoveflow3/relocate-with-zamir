/**
 * Relocate with Zamir: lead inbox.
 *
 * Lives inside a Google Sheet (Extensions → Apps Script). The website POSTs every
 * survey, meeting request, valuation and contact form here; each one becomes a row
 * on the "Leads" tab and an email to you. The admin page (admin.html) reads the rows
 * back with your admin key and can update a lead's Status and Notes.
 *
 * Setup: see apps-script/README.md. Two Script Properties are required:
 *   ADMIN_KEY     – the password you type on the admin page
 *   NOTIFY_EMAIL  – where new-lead emails go
 */

var HEADERS = [
  "Date", "Type", "Status", "Name", "Email", "Phone",
  "Looking to", "Price range", "Rent budget", "Bedrooms", "Areas", "Home to sell",
  "Photo they tapped", "Preferred day", "Preferred time", "Meet by",
  "Address", "Timeline", "Interested in", "Message", "Notes", "ID"
];
var STATUSES = ["New", "Contacted", "Meeting set", "Showing homes", "Under contract", "Closed", "Not a fit"];

function doGet() {
  return json_({ ok: true, service: "Relocate with Zamir leads" });
}

function doPost(e) {
  var data;
  try { data = JSON.parse((e && e.postData && e.postData.contents) || "{}"); }
  catch (err) { return json_({ ok: false, error: "Bad request" }); }

  if (data.action === "list" || data.action === "update") {
    if (!data.key || data.key !== prop_("ADMIN_KEY")) return json_({ ok: false, error: "Wrong admin key" });
    return data.action === "list" ? json_({ ok: true, statuses: STATUSES, leads: list_() })
                                  : json_(update_(data.id, data.status, data.notes));
  }
  if (data.botcheck) return json_({ ok: true }); // spam bot filled the hidden box
  return json_(add_(data));
}

function add_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_();
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var id = Utilities.getUuid().slice(0, 8);
    var row = headers.map(function (h) {
      if (h === "Date") return new Date();
      if (h === "ID") return id;
      if (h === "Status") return "New";
      return clean_(data[h]);
    });
    sh.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  var to = prop_("NOTIFY_EMAIL");
  if (to) {
    var lines = HEADERS.filter(function (h) { return data[h]; })
                       .map(function (h) { return h + ": " + clean_(data[h]); });
    MailApp.sendEmail({
      to: to,
      subject: String(data.subject || "New website lead").slice(0, 120),
      body: lines.join("\n") + "\n\nSee everyone on your admin page."
    });
  }
  return { ok: true };
}

function list_() {
  var sh = sheet_();
  var values = sh.getDataRange().getValues();
  var headers = values.shift();
  return values.filter(function (r) { return r.join("") !== ""; }).map(function (r) {
    var o = {};
    headers.forEach(function (h, i) {
      o[h] = r[i] instanceof Date ? r[i].toISOString() : r[i];
    });
    return o;
  }).reverse(); // newest first
}

function update_(id, status, notes) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_();
    var values = sh.getDataRange().getValues();
    var headers = values[0];
    var idCol = headers.indexOf("ID"), stCol = headers.indexOf("Status"), noCol = headers.indexOf("Notes");
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][idCol]) === String(id)) {
        if (status != null && STATUSES.indexOf(status) > -1) sh.getRange(i + 1, stCol + 1).setValue(status);
        if (notes != null) sh.getRange(i + 1, noCol + 1).setValue(clean_(notes, 2000));
        return { ok: true };
      }
    }
    return { ok: false, error: "Lead not found" };
  } finally {
    lock.releaseLock();
  }
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("Leads");
  if (!sh) {
    sh = ss.insertSheet("Leads");
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sh;
}

// Text only, trimmed, and never read as a spreadsheet formula.
function clean_(v, max) {
  if (v == null) return "";
  var s = String(v).trim().slice(0, max || 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function prop_(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
