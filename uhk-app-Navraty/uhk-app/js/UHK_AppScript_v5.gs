/**
 * ============================================================
 *  UHK Grant Manager – KOMPLETNÍ Apps Script
 *  Verze: 4.0 FINAL | Duben 2026
 *
 *  POSTUP NASAZENÍ:
 *  1. Zkopíruj CELÝ tento soubor do Apps Script (Kód.gs)
 *  2. Ulož Ctrl+S
 *  3. Spusť funkci: debugUsers  → ověří připojení k Sheets
 *  4. Deploy → New deployment → Web App
 *     Execute as: Me | Who has access: Anyone
 *  5. Zkopíruj URL → vlož do js/config.js
 * ============================================================
 */


// ============================================================
// !! UPRAV TOTO !!
// ============================================================

// ID tvého Google Sheets souboru
// Najdeš ho v URL: docs.google.com/spreadsheets/d/ >>ID<< /edit
const GLOBAL_SPREADSHEET_ID = "1y8oLsZUISdRU3b8gFVbfS9a2LDTgHoPxP4TFeq6OObs";

// Soutěže → Spreadsheet ID
// Pokud máš zatím jen UHK Connect, druhý řádek nech zakomentovaný
const SPREADSHEET_IDS = {
  "uhk_connect_2026_v2": "1y8oLsZUISdRU3b8gFVbfS9a2LDTgHoPxP4TFeq6OObs",
  "uhk_navraty_2026":    "1K98HjYXw1oX7Ulngm65IwmI2QPR3rgJ6zfVFAT-5sXA",
  // "uhk_rega_2026_v1": "DOPLNIT_AZ_BUDES_MIT_DRUHY_SPREADSHEET",
};

// Tajný klíč pro tokeny – změň na vlastní řetězec
const TOKEN_SECRET = "UHK_GRANT_HT_2026_TAJNY_KLIC";

// Přesné názvy záložek v Sheets (včetně emoji)
const SHEETS = {
  USERS        : "👥 USERS",
  CONFIG       : "📋 CONFIG",
  FORM_FIELDS  : "📝 FORM_FIELDS",
  APPLICATIONS : "📥 APPLICATIONS",
  REVIEWS      : "⭐ REVIEWS",
  AUDIT        : "🔍 AUDIT_LOG",
};

// Záhlaví je na řádku 4, data od řádku 5
const HEADER_ROW = 4;

// Admin e-mail pro notifikace
const ADMIN_EMAIL = "hana.tomaskova@uhk.cz";


// ============================================================
// CORS – každá odpověď musí mít správný MIME type
// ============================================================
function corsResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


// ============================================================
// GET ROUTER
// ============================================================
function doGet(e) {
  const p = e.parameter || {};
  try {
    switch (p.action) {
      case "login":            return corsResponse(handleLogin(p.email, p.password));
      case "verifyToken":      return corsResponse(verifyToken(p.token));
      case "getCompetitions":  return corsResponse(getCompetitions(p.token));
      case "getFormFields":    return corsResponse(getFormFields(p.competitionId, p.token));
      case "getApplications":  return corsResponse(getApplications(p.competitionId, p.token, p));
      case "getApplicationStatus": return corsResponse(getApplicationStatus(p.applicationId, p.token));
      case "getReviews":       return corsResponse(getReviews(p.competitionId, p.applicationId, p.token));
      case "getProjects":      return corsResponse(getProjects(p.competitionId, p.token));
      case "getNavratyReviews": return corsResponse(getNavratyAllReviews(p.competitionId, p.token));
      case "ping":             return corsResponse({ success: true, message: "API běží ✓" });
      default:                 return corsResponse({ error: "Neznámá akce: " + (p.action || "chybí") });
    }
  } catch (err) {
    console.error("[GET error]", err.message);
    return corsResponse({ error: err.message });
  }
}


// ============================================================
// POST ROUTER
// ============================================================
function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents || "{}");
  } catch {
    return corsResponse({ error: "Neplatný JSON." });
  }
  try {
    switch (body.action) {
      case "register":         return corsResponse(registerUser(body));
      case "submitApplication":return corsResponse(submitApplication(body));
      case "changeStatus":     return corsResponse(changeStatus(body));
      case "submitReview":     return corsResponse(submitReview(body));
      case "submitNavratyReview": return corsResponse(submitNavratyReview(body));
      default:                 return corsResponse({ error: "Neznámá POST akce: " + body.action });
    }
  } catch (err) {
    console.error("[POST error]", body.action, err.message);
    return corsResponse({ error: err.message });
  }
}


// ============================================================
// DIAGNOSTIKA – spusť ručně pro ověření nastavení
// ============================================================
function debugUsers() {
  const ui = SpreadsheetApp.getUi();

  // 1. Zkontroluj Spreadsheet
  let ss;
  try {
    ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  } catch (e) {
    ui.alert("❌ Spreadsheet nenalezen!\n\nID: " + GLOBAL_SPREADSHEET_ID +
             "\n\nChyba: " + e.message);
    return;
  }

  // 2. Zkontroluj list USERS
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) {
    const dostupne = ss.getSheets().map(s => '"' + s.getName() + '"').join("\n");
    ui.alert("❌ List USERS nenalezen!\n\n" +
             "Hledám: " + SHEETS.USERS + "\n\n" +
             "Dostupné listy:\n" + dostupne);
    return;
  }

  // 3. Zobraz záhlaví
  const data    = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1];
  let msg = "✅ Spreadsheet a list USERS nalezeny.\n\n";
  msg += "Záhlaví (řádek " + HEADER_ROW + "):\n";
  headers.forEach((h, i) => {
    msg += "  " + String.fromCharCode(65 + i) + ": \"" + h + "\"\n";
  });
  msg += "\nPočet uživatelů: " + (data.length - HEADER_ROW);

  // 4. Zkontroluj klíčové sloupce
  const COL = mapColumns(headers);
  const pwdCol = findCol(COL, "password_hash", "password", "heslo");
  msg += "\n\nDetekce sloupce s heslem: ";
  msg += pwdCol >= 0
    ? "✅ nalezen ve sloupci " + String.fromCharCode(65 + pwdCol)
    : "❌ NENALEZEN – přejmenuj záhlaví na 'password_hash'";

  ui.alert(msg);
}

function checkSetup() {
  const ss      = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  const missing = Object.values(SHEETS).filter(name => !ss.getSheetByName(name));
  if (missing.length === 0) {
    SpreadsheetApp.getUi().alert("✅ Vše v pořádku!\n\nVšechny listy jsou správně nastaveny.");
  } else {
    SpreadsheetApp.getUi().alert(
      "⚠️ Chybějící listy:\n\n" + missing.join("\n") +
      "\n\nVytvoř tyto záložky v Google Sheets (název musí být přesný včetně emoji)."
    );
  }
}


// ============================================================
// PŘIHLÁŠENÍ
// Vrací: { success, token, email, name, roles: ["ADMIN",...] }
// ============================================================
function handleLogin(email, password) {
  if (!email || !password)
    return { success: false, message: "Zadejte e-mail a heslo." };

  // Otevři Spreadsheet
  let ss;
  try {
    ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  } catch (e) {
    return { success: false, message: "Nelze se připojit ke Sheets: " + e.message };
  }

  // Otevři list USERS
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) {
    const dostupne = ss.getSheets().map(s => s.getName()).join(", ");
    return {
      success: false,
      message: "List '" + SHEETS.USERS + "' nenalezen.\nDostupné listy: " + dostupne
    };
  }

  const data    = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1];
  const COL     = mapColumns(headers);

  // Najdi indexy sloupců
  const emailCol = findCol(COL, "email");
  const pwdCol   = findCol(COL, "password_hash", "password", "heslo", "pwd");
  const roleCol  = findCol(COL, "role");
  const nameCol  = findCol(COL, "jméno", "jmeno", "name", "celé_jméno");
  const actCol   = findCol(COL, "active", "aktivní", "aktivni");

  // Diagnostika chybějících sloupců
  if (emailCol < 0)
    return { success: false, message: "Chybí sloupec 'email' v listu USERS." };
  if (pwdCol < 0) {
    const nazvy = headers.map((h, i) =>
      String.fromCharCode(65+i) + '="' + h + '"').join(", ");
    return {
      success: false,
      message: "Chybí sloupec s heslem.\nNalezené sloupce: " + nazvy +
               "\nPřejmenuj záhlaví sloupce s hesly na: password_hash"
    };
  }
  if (roleCol < 0)
    return { success: false, message: "Chybí sloupec 'role' v listu USERS." };

  const emailNorm = String(email).toLowerCase().trim();
  const matchingRows = [];
  let passwordChecked = false;

  // Projdi všechny řádky od řádku 5
  for (let i = HEADER_ROW; i < data.length; i++) {
    const row      = data[i];
    const rowEmail = String(row[emailCol] || "").toLowerCase().trim();
    if (!rowEmail || rowEmail !== emailNorm) continue;

    const rowPwd    = String(row[pwdCol]  || "").trim();
    const rowRole   = String(row[roleCol] || "").trim().toUpperCase();
    const rowName   = nameCol >= 0 ? String(row[nameCol] || "").trim() : "";
    const rowActive = actCol  >= 0 ? row[actCol] : true;

    // Ověř heslo u prvního nalezeného řádku
    if (!passwordChecked) {
      passwordChecked = true;
      if (rowPwd !== String(password).trim())
        return { success: false, message: "Nesprávné heslo." };
    }

    // Ověř aktivaci
    if (rowActive === false || String(rowActive).toUpperCase() === "FALSE")
      return { success: false, message: "Účet je deaktivován. Kontaktujte administrátora." };

    if (rowRole) matchingRows.push({ role: rowRole, name: rowName });
  }

  if (!passwordChecked)
    return { success: false, message: "Uživatel '" + emailNorm + "' nebyl nalezen." };
  if (matchingRows.length === 0)
    return { success: false, message: "Uživatel nemá přiřazenu žádnou roli." };

  const roles = matchingRows.map(r => r.role);
  const name  = matchingRows[0].name || emailNorm;
  const token = generateToken(emailNorm, roles.join(","));

  writeAudit(ss, "LOGIN", emailNorm, "", roles.join(","), roles.length + " role(í)");

  return { success: true, token, email: emailNorm, name, roles };
}


// ============================================================
// REGISTRACE – nový uživatel jako ZADATEL, active: TRUE
// ============================================================
function registerUser(body) {
  const name     = String(body.name     || "").trim();
  const email    = String(body.email    || "").toLowerCase().trim();
  const password = String(body.password || "").trim();

  if (!name || !email || !password)
    return { success: false, message: "Vyplňte všechna pole." };
  if (!email.endsWith("@uhk.cz"))
    return { success: false, message: "E-mail musí být UHK adresa (@uhk.cz)." };
  if (password.length < 8)
    return { success: false, message: "Heslo musí mít alespoň 8 znaků." };
  if (!/[A-Z]/.test(password))
    return { success: false, message: "Heslo musí obsahovat velké písmeno." };
  if (!/[0-9]/.test(password))
    return { success: false, message: "Heslo musí obsahovat číslo." };

  const ss    = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet) return { success: false, message: "List USERS nenalezen." };

  const data    = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1];
  const COL     = mapColumns(headers);
  const emailCol = findCol(COL, "email");

  // Zkontroluj duplicitu
  for (let i = HEADER_ROW; i < data.length; i++) {
    if (String(data[i][emailCol] || "").toLowerCase().trim() === email)
      return { success: false, message: "Tento e-mail je již registrován. Přihlaste se." };
  }

  // Sestav nový řádek podle záhlaví
  const newRow = new Array(headers.length).fill("");
  const setCol = (names, val) => {
    const idx = findCol(COL, ...names);
    if (idx >= 0) newRow[idx] = val;
  };

  setCol(["email"],                          email);
  setCol(["password_hash", "password"],      password);
  setCol(["role"],                           "ZADATEL");
  setCol(["active"],                         "TRUE");
  setCol(["jméno", "jmeno", "name"],         name);
  setCol(["added_at"],                       fmtDate(new Date()));
  setCol(["added_by"],                       "self-registration");
  setCol(["note"],                           "Registrace přes web");

  sheet.appendRow(newRow);
  writeAudit(ss, "USER_REGISTERED", email, "", "ZADATEL", name);

  return { success: true, message: "Účet vytvořen. Nyní se přihlaste." };
}


// ============================================================
// TOKEN
// ============================================================
function generateToken(email, roles) {
  const ts  = Date.now().toString();
  const raw = email + "|" + roles + "|" + ts;
  return Utilities.base64Encode(raw + "|" + checksum(raw));
}

function verifyToken(token) {
  if (!token) return { valid: false, reason: "Chybí token." };
  try {
    const decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    const parts   = decoded.split("|");
    if (parts.length < 4) return { valid: false, reason: "Neplatný formát." };

    const sum   = parts[parts.length - 1];
    const raw   = parts.slice(0, -1).join("|");
    if (checksum(raw) !== sum) return { valid: false, reason: "Neplatný podpis." };

    const age = Date.now() - Number(parts[2]);
    if (age > 8 * 3600 * 1000) return { valid: false, reason: "Token vypršel." };

    return { valid: true, email: parts[0], roles: parts[1].split(",") };
  } catch {
    return { valid: false, reason: "Chyba dekódování." };
  }
}

function checksum(raw) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw + TOKEN_SECRET)
    .slice(0, 8).map(b => (b & 0xff).toString(16).padStart(2, "0")).join("");
}

function requireAuth(token) {
  const v = verifyToken(token);
  if (!v.valid) throw new Error("Nepřihlášen: " + v.reason);
  return v;
}


// ============================================================
// SOUTĚŽE
// ============================================================
function getCompetitions(token) {
  requireAuth(token);
  const result = [];
  Object.entries(SPREADSHEET_IDS).forEach(([compId, ssId]) => {
    try {
      const ss    = SpreadsheetApp.openById(ssId);
      const sheet = ss.getSheetByName(SHEETS.CONFIG);
      if (!sheet) return;

      const cfg = {};
      sheet.getDataRange().getValues().forEach(row => {
        if (row[1]) cfg[String(row[1]).trim()] = row[2];
      });

      let appCount = 0;
      const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
      if (appSheet) appCount = Math.max(0, appSheet.getLastRow() - HEADER_ROW);

      result.push({
        id:                compId,
        name:              cfg["competition_name"]      || compId,
        type:              cfg["competition_type"]      || "UHK_CONNECT",
        status:            cfg["status"]                || "DRAFT",
        description:       cfg["description"]           || "",
        deadline:          cfg["deadline_applications"] || "",
        allocation:        Number(cfg["total_allocation_czk"]) || 0,
        maxBudget:         Number(cfg["max_budget_czk"])       || 0,
        applicationsCount: appCount,
      });
    } catch (err) {
      console.error("getCompetitions:" + compId, err.message);
    }
  });
  return result;
}


// ============================================================
// FORM FIELDS
// ============================================================
function getFormFields(competitionId, token) {
  requireAuth(token);
  const ss    = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName(SHEETS.FORM_FIELDS);
  if (!sheet) return { success: false, message: "List FORM_FIELDS nenalezen." };

  const fields = sheetToObjects(sheet)
    .filter(r => String(r.active).toUpperCase() === "TRUE")
    .map(r => ({
      field_id        : r.field_id,
      section         : r.section,
      section_order   : Number(r.section_order) || 0,
      field_order     : Number(r.field_order)   || 0,
      label_cs        : r.label_cs,
      type            : r.type,
      required        : String(r.required).toUpperCase() === "TRUE",
      active          : true,
      placeholder     : r.placeholder       || "",
      help_text       : r.help_text         || "",
      options         : r.options           || "",
      max_length      : r.max_length        || "",
      depends_on_field: r.depends_on_field  || "",
      depends_on_value: r.depends_on_value  || "",
      internal_only   : String(r.internal_only).toUpperCase() === "TRUE",
    }));

  return { success: true, fields };
}


// ============================================================
// PŘIHLÁŠKY
// ============================================================
function getApplicationStatus(applicationId, token) {
  requireAuth(token);
  for (const [compId, ssId] of Object.entries(SPREADSHEET_IDS)) {
    try {
      const rows  = sheetToObjects(SpreadsheetApp.openById(ssId)
        .getSheetByName(SHEETS.APPLICATIONS));
      const found = rows.find(r => r.application_id === applicationId);
      if (found) return { success: true, application: found, competition: compId };
    } catch (e) {}
  }
  return { success: false, message: "Přihláška nenalezena." };
}

function getApplications(competitionId, token, filters) {
  const auth  = requireAuth(token);
  const sheet = getSpreadsheet(competitionId).getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) return [];
  let rows = sheetToObjects(sheet);
  // Žadatel vidí jen své přihlášky
  if (auth.roles.join(",") === "ZADATEL")
    rows = rows.filter(r => r.applicant_email === auth.email);
  if (filters && filters.statusFilter)
    rows = rows.filter(r => r.status === filters.statusFilter);
  return rows;
}

function submitApplication(body) {
  const auth  = requireAuth(body.token);
  const ss    = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) throw new Error("List APPLICATIONS nenalezen.");

  const now   = new Date();
  const appId = generateAppId();
  sheet.appendRow([
    appId,
    body.competitionId,
    body.fields.applicant_email || auth.email,
    fmtDate(now), fmtDate(now),
    body.status || "SUBMITTED",
    "", "", "", "",
    ...Object.values(body.fields || {}),
  ]);
  writeAudit(ss, "APPLICATION_SUBMIT", appId, "", body.status, auth.email);
  return { success: true, applicationId: appId };
}

function changeStatus(body) {
  const auth = requireAuth(body.token);
  if (!auth.roles.some(r => ["ADMIN","PROREKTOR","KOMISAR"].includes(r)))
    throw new Error("Nedostatečná oprávnění.");

  const ss    = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) throw new Error("List APPLICATIONS nenalezen.");

  const data    = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1];
  const COL     = mapColumns(headers);

  for (let i = HEADER_ROW; i < data.length; i++) {
    if (data[i][findCol(COL, "application_id")] !== body.applicationId) continue;
    const r = i + 1;
    const setCell = (names, val) => {
      const c = findCol(COL, ...names);
      if (c >= 0) sheet.getRange(r, c + 1).setValue(val);
    };
    const oldStatus = data[i][findCol(COL, "status")];
    setCell(["status"],           body.newStatus);
    setCell(["status_changed_by"],auth.email);
    setCell(["status_changed_at"],fmtDate(new Date()));
    setCell(["updated_at"],       fmtDate(new Date()));
    if (body.note) setCell(["internal_notes"], body.note);
    writeAudit(ss, "STATUS_CHANGE", body.applicationId, oldStatus, body.newStatus, body.note || "");
    // E-mail žadateli
    const emailAddr = data[i][findCol(COL, "applicant_email")];
    const projectT  = data[i][findCol(COL, "project_title")] || "";
    if (emailAddr) sendStatusEmail(emailAddr, body.applicationId, body.newStatus, projectT);
    return { success: true, oldStatus, newStatus: body.newStatus };
  }
  throw new Error("Přihláška nenalezena: " + body.applicationId);
}


// ============================================================
// HODNOCENÍ
// ============================================================
function submitReview(body) {
  const auth = requireAuth(body.token);
  if (!auth.roles.some(r => ["ADMIN","KOMISAR","PROREKTOR"].includes(r)))
    throw new Error("Nedostatečná oprávnění pro hodnocení.");

  const ss    = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName(SHEETS.REVIEWS);
  if (!sheet) throw new Error("List REVIEWS nenalezen.");

  const s     = body.scores || {};
  const total = ["clarity","quality","budget","profile","outputs"]
    .reduce((sum, k) => sum + (Number(s[k]) || 0), 0);

  sheet.appendRow([
    Utilities.getUuid(), body.applicationId, auth.email, fmtDate(new Date()),
    s.clarity || 0, s.quality || 0, s.budget || 0, s.profile || 0, s.outputs || 0, total,
    (body.comments || {}).public || "", (body.comments || {}).internal || "",
    body.recommendation || "", s.conflict ? "TRUE" : "FALSE",
  ]);
  writeAudit(ss, "REVIEW_SUBMITTED", body.applicationId, "", body.recommendation,
    auth.email + ", " + total + "/25 bodů");
  return { success: true, total };
}

function getReviews(competitionId, applicationId, token) {
  const auth = requireAuth(token);
  if (!auth.roles.some(r => ["ADMIN","PROREKTOR","KOMISAR","TESTER","READONLY"].includes(r)))
    throw new Error("Nedostatečná oprávnění.");
  const rows = sheetToObjects(getSpreadsheet(competitionId).getSheetByName(SHEETS.REVIEWS));
  return rows.filter(r => r.application_id === applicationId);
}


// ============================================================
// E-MAILY
// ============================================================
function sendStatusEmail(toEmail, appId, status, projectTitle) {
  const subjects = {
    SUBMITTED:    "[UHK Connect] Přihláška přijata – " + appId,
    FORMAL_CHECK: "[UHK Connect] Formální kontrola – " + appId,
    IN_REVIEW:    "[UHK Connect] Předáno hodnoticímu panelu – " + appId,
    APPROVED:     "[UHK Connect] 🎉 Přihláška schválena – " + appId,
    REJECTED:     "[UHK Connect] Výsledek hodnocení – " + appId,
    WITHDRAWN:    "[UHK Connect] Přihláška stažena – " + appId,
  };
  const texts = {
    SUBMITTED:    "Vaše přihláška byla úspěšně přijata a čeká na formální kontrolu.",
    FORMAL_CHECK: "Probíhá formální kontrola Vaší přihlášky.",
    IN_REVIEW:    "Vaše přihláška byla předána hodnoticímu panelu.",
    APPROVED:     "Gratulujeme! Vaše přihláška byla schválena k financování.",
    REJECTED:     "Vaše přihláška nebyla v tomto kole podpořena. Komentář panelu Vám zašleme e-mailem.",
    WITHDRAWN:    "Vaše přihláška byla stažena ze soutěže.",
  };
  if (!subjects[status]) return;
  try {
    GmailApp.sendEmail(toEmail, subjects[status],
      "Vážená/ý žadateli,\n\n" + texts[status] +
      "\n\nID přihlášky: " + appId +
      "\nProjekt: " + (projectTitle || "–") +
      "\n\nDotazy: " + ADMIN_EMAIL +
      "\n\nS pozdravem,\nOddělení vědy a transferu znalostí\nUniverzita Hradec Králové",
      { name: "UHK – Grantové soutěže", replyTo: ADMIN_EMAIL }
    );
  } catch (err) {
    console.error("sendStatusEmail:", err.message);
  }
}

function sendReviewReport() {
  try {
    const ss       = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
    const reviews  = sheetToObjects(ss.getSheetByName(SHEETS.REVIEWS));
    const apps     = sheetToObjects(ss.getSheetByName(SHEETS.APPLICATIONS));
    if (!reviews.length) return;

    const appMap = {};
    apps.forEach(a => { appMap[a.application_id] = a; });

    const grouped = {};
    reviews.forEach(r => {
      if (!grouped[r.application_id]) grouped[r.application_id] = [];
      grouped[r.application_id].push(r);
    });

    let report = "UHK Connect – Report hodnocení\n" + fmtDate(new Date()) + "\n" +
      "=".repeat(50) + "\n\n";

    Object.entries(grouped)
      .map(([id, revs]) => ({
        id, revs,
        avg: revs.reduce((s, r) => s + Number(r.score_total || 0), 0) / revs.length
      }))
      .sort((a, b) => b.avg - a.avg)
      .forEach(({ id, revs, avg }, idx) => {
        const app = appMap[id] || {};
        report += "#" + (idx+1) + " " + id + " | " + (app.project_title||"–") + "\n";
        report += "   Žadatel: " + (app.applicant_name||"–") + "\n";
        report += "   Skóre: " + avg.toFixed(1) + "/25 | " + revs.length + " hodnocení\n";
        revs.forEach(r => {
          report += "   ↳ " + r.reviewer_email + ": " + r.score_total +
            " bodů, " + r.recommendation + "\n";
        });
        report += "\n";
      });

    GmailApp.sendEmail(ADMIN_EMAIL, "[UHK Connect] Report hodnocení – " + fmtDate(new Date()),
      report, { name: "UHK Grant Manager" });
  } catch (err) {
    console.error("sendReviewReport:", err.message);
  }
}


// ============================================================
// TRIGGERY A MENU
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎓 UHK Grant Manager")
    .addItem("🔍 Diagnostika USERS", "debugUsers")
    .addItem("✅ Zkontrolovat listy", "checkSetup")
    .addSeparator()
    .addItem("📊 Odeslat report hodnocení", "sendReviewReport")
    .addSeparator()
    .addItem("⚙️ Instalovat triggery", "installTriggers")
    .addToUi();
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  const ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  ScriptApp.newTrigger("onEditHandler").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("sendReviewReport").timeBased().atHour(8).everyDays(1).create();
  SpreadsheetApp.getUi().alert("✅ Triggery nainstalovány.\n\nonEditHandler + denní report v 8:00");
}

function onEditHandler(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const row   = e.range.getRow();
  const col   = e.range.getColumn();
  if (row <= HEADER_ROW) return;
  if (sheet.getName() !== SHEETS.APPLICATIONS) return;
  if (col !== 6) return; // sloupec F = status

  try {
    const ss    = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
    const appId = sheet.getRange(row, 1).getValue();
    writeAudit(ss, "STATUS_CHANGE_SHEET", appId, e.oldValue || "", e.value || "",
      "Změněno přímo v Sheets");
    const emailAddr  = sheet.getRange(row, 3).getValue();
    const projectT   = sheet.getRange(row, 11).getValue();
    if (emailAddr && e.value) sendStatusEmail(emailAddr, appId, e.value, projectT);
  } catch (err) {
    console.error("onEditHandler:", err.message);
  }
}


// ============================================================
// POMOCNÉ FUNKCE
// ============================================================
function getSpreadsheet(competitionId) {
  const id = SPREADSHEET_IDS[competitionId];
  if (!id) throw new Error("Neznámé competition_id: " + competitionId);
  return SpreadsheetApp.openById(id);
}

// Převede list na pole objektů { záhlaví: hodnota }
function sheetToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= HEADER_ROW) return [];
  const headers = data[HEADER_ROW - 1];
  return data.slice(HEADER_ROW)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[String(h).trim()] = row[i]; });
      return obj;
    })
    .filter(o => Object.values(o).some(v => v !== "" && v !== null));
}

// Namapuje záhlaví na indexy (case-insensitive, bez diakritiky)
function mapColumns(headers) {
  const COL = {};
  headers.forEach((h, i) => {
    const key = String(h).trim().toLowerCase()
      .replace(/[áä]/g,"a").replace(/[čç]/g,"c").replace(/[ďd]/g,"d")
      .replace(/[éě]/g,"e").replace(/[íï]/g,"i").replace(/[ňn]/g,"n")
      .replace(/[óö]/g,"o").replace(/[řr]/g,"r").replace(/[šs]/g,"s")
      .replace(/[ťt]/g,"t").replace(/[úůü]/g,"u").replace(/[ýy]/g,"y")
      .replace(/[žz]/g,"z").replace(/\s+/g,"_");
    COL[key] = i;
    COL[String(h).trim().toLowerCase()] = i; // také původní název
  });
  return COL;
}

// Najde index sloupce – zkouší více možných názvů
function findCol(COL, ...names) {
  for (const n of names) {
    if (COL[n] !== undefined) return COL[n];
    // Zkus i bez diakritiky
    const stripped = String(n).toLowerCase()
      .replace(/[áä]/g,"a").replace(/[čç]/g,"c")
      .replace(/[éě]/g,"e").replace(/[íï]/g,"i")
      .replace(/[óö]/g,"o").replace(/[úůü]/g,"u")
      .replace(/[ýy]/g,"y").replace(/[žz]/g,"z")
      .replace(/[šs]/g,"s").replace(/[řr]/g,"r");
    if (COL[stripped] !== undefined) return COL[stripped];
  }
  return -1;
}

// Generuje ID přihlášky
function generateAppId() {
  const d = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMdd");
  return "APP-" + d + "-" + Math.random().toString(36).slice(2,7).toUpperCase();
}

// Formátuje datum
function fmtDate(date) {
  return Utilities.formatDate(
    date instanceof Date ? date : new Date(date),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd HH:mm:ss"
  );
}

// Zápis do AUDIT_LOG
function writeAudit(ss, action, targetId, oldVal, newVal, note) {
  try {
    const sheet = ss.getSheetByName(SHEETS.AUDIT);
    if (!sheet) return;
    sheet.appendRow([
      fmtDate(new Date()),
      Session.getActiveUser().getEmail() || "webapp",
      action, targetId || "", oldVal || "", newVal || "", note || "",
    ]);
  } catch (e) { /* audit není kritický */ }
}
function getProjects(competitionId, token) {
  requireAuth(token);
  const ss    = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName("📝 PROJECTS");
  if (!sheet) return { success: false, message: "List '📝 PROJECTS' nenalezen." };
  const data    = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1];
  const COL     = mapColumns(headers);
  const projects = [];
  for (let i = HEADER_ROW; i < data.length; i++) {
    const row    = data[i];
    const id     = String(row[findCol(COL,"project_id","id")]   || "").trim();
    const status = String(row[findCol(COL,"status")]            || "ACTIVE").trim();
    if (!id) continue;
    if (status === "INACTIVE") continue;
    projects.push({
      project_id  : id,
      project_name: String(row[findCol(COL,"project_name","name","nazev")] || "").trim(),
      resitel     : String(row[findCol(COL,"resitel","řešitel","solver")]   || "").trim(),
      soucast     : String(row[findCol(COL,"soucast","součást","faculty")]  || "").trim(),
      rozpocet    : String(row[findCol(COL,"rozpocet","rozpočet","budget")] || "").trim(),
      status,
    });
  }
  return { success: true, projects };
}
function submitNavratyReview(body) {
  const auth = requireAuth(body.token);
  if (!auth.roles.some(r => ["ADMIN","KOMISAR","PROREKTOR"].includes(r)))
    throw new Error("Nedostatečná oprávnění pro hodnocení.");
  const ss    = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName("⭐ REVIEWS");
  if (!sheet) throw new Error("List '⭐ REVIEWS' nenalezen.");
  const s     = body.scores || {};
  const total = ["clarity","quality","budget","profile","outputs"]
    .reduce((sum, k) => sum + (Number(s[k]) || 0), 0);
  sheet.appendRow([
    Utilities.getUuid(),            // review_id
    body.projectId,                 // project_id
    auth.email,                     // reviewer_email
    fmtDate(new Date()),            // submitted_at
    s.clarity  || 0,               // score_clarity  (K1)
    s.quality  || 0,               // score_quality  (K2)
    s.budget   || 0,               // score_budget   (K3)
    s.profile  || 0,               // score_profile  (K4)
    s.outputs  || 0,               // score_outputs  (K5)
    total,                          // score_total
    body.poradi || "",              // poradi
    body.recommendation || "",      // recommendation
    (body.comments || {}).public   || "", // comment_public
    (body.comments || {}).internal || "", // comment_internal
  ]);
  writeAudit(ss, "NAVRATY_REVIEW", body.projectId, "",
    body.recommendation, auth.email + ", " + total + "/25 bodů");
  return { success: true, total, projectId: body.projectId };
}
function getNavratyReviews(competitionId, projectId, token) {
  requireAuth(token);
  const ss   = getSpreadsheet(competitionId);
  const rows = sheetToObjects(ss.getSheetByName("⭐ REVIEWS"));
  if (projectId) return rows.filter(r => r.project_id === projectId);
  return rows;
}
function getNavratyAllReviews(competitionId, token) {
  requireAuth(token);
  const ss   = getSpreadsheet(competitionId);
  const rows = sheetToObjects(ss.getSheetByName("⭐ REVIEWS"));
  return rows;
}
