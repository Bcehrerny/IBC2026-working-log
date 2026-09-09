/**
 * PROMPTERGO Booth Log — shared store
 * Paste this into Extensions → Apps Script inside your Google Sheet.
 *
 * BEFORE YOU DEPLOY: change TOKEN below to your own phrase. The same phrase
 * goes into the app on every phone. Anyone with the URL and the token can
 * read and write, so make it long and don't post it publicly.
 */

var TOKEN  = "prompt-ibc26-CHANGE-THIS";
var SHEET  = "Visitors";
var PREP   = "Prep";
var FOLDER = "Booth Log cards";

var PHEAD = ["id","Day","When","Task","Done","Done by","Added by","Deleted","Updated","Server time"];
var DAYLABEL = {
  pre: "Before the show", d1: "Day 1 \u00b7 Fri 11 Sep", d2: "Day 2 \u00b7 Sat 12 Sep",
  d3: "Day 3 \u00b7 Sun 13 Sep", d4: "Day 4 \u00b7 Mon 14 Sep", post: "After the show"
};

var HEAD = ["id","Date","Time","Name","Company","Country","Job title","Email","Phone",
  "Visitor type","Products","Asked about","Questions by product","Anything else asked",
  "Needs engineer","Question for engineer","Interest","Next step","Consent","Card photo",
  "Badge ID","Spoke with","Deleted","Updated","Server time"];

/* ---------- run this once, from the editor ---------- */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
  sh.clear();
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight("bold");
  sh.setFrozenRows(1);
  sh.getRange("B:C").setNumberFormat("@");   // keep dates as plain text
  sh.getRange("X:X").setNumberFormat("0");
  sh.setColumnWidth(4, 140); sh.setColumnWidth(5, 200);
  sh.setColumnWidth(13, 380); sh.setColumnWidth(15, 380);

  var q = ss.getSheetByName("Questions for engineer") || ss.insertSheet("Questions for engineer");
  q.clear();
  q.getRange("A1:F1")
   .setValues([["Date", "Company", "Name", "Country", "Product", "Question we could not answer"]])
   .setFontWeight("bold");
  q.getRange("A2").setFormula(
    '=IFERROR(FILTER({Visitors!B2:B,Visitors!E2:E,Visitors!D2:D,Visitors!F2:F,Visitors!K2:K,Visitors!P2:P},' +
    ' Visitors!O2:O="YES", Visitors!X2:X<>"YES"), "No open questions yet")');
  q.getRange("G1").setValue("Engineer's answer").setFontWeight("bold");
  q.getRange("H1").setValue("Replied to customer").setFontWeight("bold");
  q.setColumnWidth(6, 400); q.setColumnWidth(7, 400);
  q.setFrozenRows(1);

  var pr = ss.getSheetByName(PREP) || ss.insertSheet(PREP);
  pr.clear();
  pr.getRange(1, 1, 1, PHEAD.length).setValues([PHEAD]).setFontWeight("bold");
  pr.setFrozenRows(1);
  pr.setColumnWidth(4, 420);
  pr.getRange("J:J").setNumberFormat("0");

  var d = ss.getSheetByName("Dashboard") || ss.insertSheet("Dashboard");
  d.clear();
  d.getRange("A1").setValue("PROMPTERGO — IBC2026").setFontSize(16).setFontWeight("bold");
  d.getRange("A2").setFormula('="Updated "&TEXT(NOW(),"ddd d mmm HH:mm")');
  var rows = [
    ["Visitors so far",        '=COUNTIFS(Visitors!A2:A,"<>",Visitors!X2:X,"<>YES")'],
    ["Today",                  '=COUNTIFS(Visitors!B2:B,TEXT(TODAY(),"yyyy-mm-dd"),Visitors!X2:X,"<>YES")'],
    ["Hot leads",              '=COUNTIFS(Visitors!Q2:Q,"hot",Visitors!X2:X,"<>YES")'],
    ["Distributors / dealers", '=COUNTIFS(Visitors!J2:J,"*Distributor*",Visitors!X2:X,"<>YES")+COUNTIFS(Visitors!J2:J,"*Dealer*",Visitors!X2:X,"<>YES")'],
    ["Waiting on the engineer",'=COUNTIFS(Visitors!O2:O,"YES",Visitors!X2:X,"<>YES")'],
    ["Business cards captured",'=COUNTIFS(Visitors!T2:T,"<>",Visitors!X2:X,"<>YES")']
  ];
  for (var i = 0; i < rows.length; i++) {
    d.getRange(i + 4, 1).setValue(rows[i][0]);
    d.getRange(i + 4, 2).setFormula(rows[i][1]).setFontWeight("bold");
  }
  d.getRange("A11").setValue("Product interest").setFontWeight("bold");
  d.getRange("A12").setFormula(
    '=IFERROR(QUERY(Visitors!K2:K, "select Col1, count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label count(Col1) \'\'", 0), "—")');
  d.getRange("D11").setValue("Countries").setFontWeight("bold");
  d.getRange("D12").setFormula(
    '=IFERROR(QUERY(Visitors!F2:F, "select Col1, count(Col1) where Col1 is not null group by Col1 order by count(Col1) desc label count(Col1) \'\'", 0), "—")');
  d.setColumnWidth(1, 260); d.setColumnWidth(4, 200);

  ss.setActiveSheet(d);
  SpreadsheetApp.getUi().alert("Ready. Now use Deploy → New deployment → Web app.");
}

/**
 * Run this ONCE if your sheet was created with the earlier version of this
 * script. It adds the "Server time" header and back-fills the column so the
 * rows already in the sheet are visible to every phone. Your data is untouched.
 */
function upgrade() {
  var sh = sheet();
  sh.getRange(1, HEAD.length).setValue("Server time").setFontWeight("bold");
  var n = sh.getLastRow() - 1;
  if (n > 0) {
    var now  = Date.now();
    var have = sh.getRange(2, HEAD.length, n, 1).getValues();
    var out  = [];
    for (var i = 0; i < n; i++) out.push([Number(have[i][0]) || now]);
    sh.getRange(2, HEAD.length, n, 1).setValues(out);
  }
  SpreadsheetApp.getUi().alert("Upgraded " + n + " rows. Now redeploy: Deploy \u2192 Manage deployments \u2192 edit \u2192 New version.");
}

/* ---------- endpoints ---------- */
function doGet(e) {
  var p = e.parameter || {};
  if (p.token !== TOKEN) return out({ ok: false, error: "bad token" });
  if (p.action === "ping") return out({ ok: true, serverTime: Date.now() });

  var since = Number(p.since || 0);
  var vals  = sheet().getDataRange().getValues();
  var rows  = [];
  for (var i = 1; i < vals.length; i++) {
    if (!vals[i][0]) continue;
    // Cursor is the SERVER's write time, not the phone's clock. A record typed at
    // 10:00 on a phone with no signal and uploaded at 10:20 must still reach the
    // other phones, and phone clocks are never in step anyway.
    var t = Number(vals[i][HEAD.length-1] || vals[i][HEAD.length-2] || 0);
    if (t > since) rows.push(fromRow(vals[i]));
  }
  var pv = prepSheet().getDataRange().getValues();
  var ptasks = [];
  for (var j = 1; j < pv.length; j++) {
    if (!pv[j][0]) continue;
    var pt = Number(pv[j][PHEAD.length - 1] || pv[j][PHEAD.length - 2] || 0);
    if (pt > since) ptasks.push(prepFromRow(pv[j]));
  }
  return out({ ok: true, leads: rows, prep: ptasks, serverTime: Date.now() });
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return out({ ok: false, error: "bad body" }); }
  if (body.token !== TOKEN) return out({ ok: false, error: "bad token" });

  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) { return out({ ok: false, error: "busy" }); }

  try {
    var sh = sheet(), saved = [];
    var ids = {}, col = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues();
    for (var i = 1; i < col.length; i++) if (col[i][0]) ids[col[i][0]] = i + 1;

    (body.leads || []).forEach(function (L) {
      var cardUrl = L.cardUrl || "";
      if (L.photo && !cardUrl) { try { cardUrl = savePhoto(L.id, L.photo); } catch (err) {} }
      var row = toRow(L, cardUrl);
      row[HEAD.length-1] = Date.now();          // stamped here, by the server
      if (ids[L.id]) sh.getRange(ids[L.id], 1, 1, HEAD.length).setValues([row]);
      else sh.appendRow(row);
      saved.push({ id: L.id, cardUrl: cardUrl });
    });
    var savedPrep = [];
    if (body.prep && body.prep.length) {
      var psh = prepSheet(), pids = {};
      var pcol = psh.getRange(1, 1, Math.max(psh.getLastRow(), 1), 1).getValues();
      for (var k = 1; k < pcol.length; k++) if (pcol[k][0]) pids[pcol[k][0]] = k + 1;
      body.prep.forEach(function (t) {
        var prow = [t.id, t.day || "", DAYLABEL[t.day] || t.day || "", t.text || "",
                    t.done ? "YES" : "", t.doneBy || "", t.by || "",
                    t.deleted ? "YES" : "", Number(t.updated || Date.now()), Date.now()];
        if (pids[t.id]) psh.getRange(pids[t.id], 1, 1, PHEAD.length).setValues([prow]);
        else psh.appendRow(prow);
        savedPrep.push(t.id);
      });
    }
    return out({ ok: true, saved: saved, savedPrep: savedPrep, serverTime: Date.now() });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- helpers ---------- */
function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
                       .setMimeType(ContentService.MimeType.JSON);
}
function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.getRange(1,1,1,HEAD.length).setValues([HEAD]); sh.setFrozenRows(1); }
  return sh;
}
function prepSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PREP);
  if (!sh) {
    sh = ss.insertSheet(PREP);
    sh.getRange(1, 1, 1, PHEAD.length).setValues([PHEAD]);
    sh.setFrozenRows(1);
  }
  return sh;
}
function prepFromRow(r) {
  return {
    id: r[0], day: r[1], text: r[3],
    done: String(r[4]).toUpperCase() === "YES" ? 1 : 0,
    doneBy: r[5], by: r[6],
    deleted: String(r[7]).toUpperCase() === "YES" ? 1 : 0,
    created: Number(r[8] || 0), updated: Number(r[8] || 0)
  };
}
function folder() {
  var it = DriveApp.getFoldersByName(FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER);
}
function savePhoto(id, dataUrl) {
  var m = String(dataUrl).match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return "";
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], "card-" + id + ".jpg");
  return folder().createFile(blob).getUrl();
}
function notesText(L) {
  return (L.productNotes || []).map(function (n) {
    var bits = [n.product];
    if (n.topics && n.topics.length) bits.push(n.topics.join(", "));
    if (n.question) bits.push(n.question);
    return bits.join(" \u2014 ");
  }).join(" | ");
}
function parseNotes(v) {
  return String(v || "").split("|").map(function (chunk) {
    var parts = chunk.split("\u2014").map(function (x) { return x.trim(); });
    if (!parts[0]) return null;
    return { product: parts[0], topics: parts[1] ? split(parts[1]) : [], question: parts[2] || "" };
  }).filter(Boolean);
}
function join(v) { return Array.isArray(v) ? v.join(", ") : (v || ""); }
function split(v) { return String(v || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); }

function toRow(L, cardUrl) {
  return [L.id, L.day || "", L.time || timeOf(L.ts), L.name || "", L.company || "", L.country || "",
    L.role || "", L.email || "", L.phone || "", L.type || "", join(L.products), join(L.topics),
    notesText(L), L.questions || "", L.needEngineer ? "YES" : "", L.engQuestion || "",
    L.temp || "", L.next || "", L.consent === false ? "NO" : "yes", cardUrl, L.badgeId || "",
    L.staff || "", L.deleted ? "YES" : "", Number(L.updated || Date.now()), 0];
}
function fromRow(r) {
  return {
    id: r[0], day: r[1], ts: r[1] + "T" + (r[2] || "00:00") + ":00", name: r[3], company: r[4],
    country: r[5], role: r[6], email: r[7], phone: r[8], type: r[9], types: split(r[9]),
    products: split(r[10]), topics: split(r[11]), productNotes: parseNotes(r[12]),
    questions: r[13], needEngineer: String(r[14]).toUpperCase() === "YES",
    engQuestion: r[15], temp: r[16], next: r[17],
    consent: String(r[18]).toUpperCase() !== "NO", cardUrl: r[19], hasCard: !!r[19],
    badgeId: r[20], staff: r[21],
    deleted: String(r[22]).toUpperCase() === "YES" ? 1 : 0, updated: Number(r[23] || 0)
  };
}
function timeOf(ts) {
  if (!ts) return "";
  var d = new Date(ts);
  return isNaN(d) ? "" : Utilities.formatDate(d, Session.getScriptTimeZone(), "HH:mm");
}
