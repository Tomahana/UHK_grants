/**
 * ============================================================
 *  UHK Grant Manager – Apps Script Backend (FINÁLNÍ VERZE)
 *  Verze: 3.0 | 2026
 *
 *  NASAZENÍ:
 *  1. Vlož celý tento soubor do Apps Script editoru
 *  2. Deploy → New deployment → Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  3. Zkopíruj URL a vlož do js/config.js jako API_URL
 * ============================================================
 */

// ============================================================
// KONFIGURACE – uprav před nasazením
// ============================================================

// ID tvého Google Sheets souboru
// (z URL: docs.google.com/spreadsheets/d/ >>> ID <<< /edit)
const GLOBAL_SPREADSHEET_ID = "1gglqq0IRVP1GETHRWEKRQOHywHBQO8MOrNK8-vrNrdI";

// Mapování soutěží na Spreadsheet ID
// Pokud máš jen jeden soubor pro obě, dej stejné ID
const SPREADSHEET_IDS = {
  "uhk_connect_2026_v2": "1gglqq0IRVP1GETHRWEKRQOHywHBQO8MOrNK8-vrNrdI",
  // "uhk_rega_2026_v1": "DOPLNIT_AZ_BUDE_DRUHY_SPREADSHEET",
};

// Přesné názvy listů – musí odpovídat záložkám v Sheets
const SHEETS = {
  USERS        : "👥 USERS",
  CONFIG       : "📋 CONFIG",
  FORM_FIELDS  : "📝 FORM_FIELDS",
  APPLICATIONS : "📥 APPLICATIONS",
  REVIEWS      : "⭐ REVIEWS",
  AUDIT        : "🔍 AUDIT_LOG",
};

// Záhlaví je na řádku 4, data začínají od řádku 5
const HEADER_ROW = 4;

// Tajný klíč pro podepisování tokenů – změň na vlastní řetězec
const TOKEN_SECRET = "UHK_GRANT_SECRET_2026_HT";


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
      case "login":
        return corsResponse(handleLogin(p.email, p.password));
      case "verifyToken":
        return corsResponse(verifyToken(p.token));
      case "getCompetitions":
        return corsResponse(getCompetitions(p.token));
      case "getFormFields":
        return corsResponse(getFormFields(p.competitionId, p.token));
      case "getApplicationStatus":
        return corsResponse(getApplicationStatus(p.applicationId, p.token));
      case "getApplications":
        return corsResponse(getApplications(p.competitionId, p.token, p));
      case "getReviews":
        return corsResponse(getReviews(p.competitionId, p.applicationId, p.token));
      case "ping":
        return corsResponse({ success: true, message: "UHK Grant Manager API běží." });
      default:
        return corsResponse({ error: "Neznámá akce: " + (p.action || "–") });
    }
  } catch (err) {
    logError("doGet", err);
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
    return corsResponse({ error: "Neplatný JSON v těle požadavku." });
  }
  try {
    switch (body.action) {
      case "register":
        return corsResponse(registerUser(body));
      case "submitApplication":
        return corsResponse(submitApplication(body));
      case "changeStatus":
        return corsResponse(changeStatus(body));
      case "submitReview":
        return corsResponse(submitReview(body));
      default:
        return corsResponse({ error: "Neznámá POST akce: " + (body.action || "–") });
    }
  } catch (err) {
    logError("doPost:" + body.action, err);
    return corsResponse({ error: err.message });
  }
}


// ============================================================
// PŘIHLÁŠENÍ
// Vrací: { success, token, email, name, roles: ["ADMIN",...] }
// ============================================================
function handleLogin(email, password) {
  if (!email || !password)
    return { success: false, message: "Zadejte e-mail a heslo." };

  const ss    = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet)
    return { success: false, message: "List USERS nebyl nalezen. Zkontroluj název záložky." };

  const data    = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1]; // řádek 4 = index 3

  // Dynamicky namapuj sloupce podle názvu záhlaví
  const COL = {};
  headers.forEach((h, i) => {
    if (h) COL[String(h).trim().toLowerCase()] = i;
  });

  // Najdi indexy potřebných sloupců
  const emailCol = COL["email"]         ?? 0;
  const pwdCol   = COL["password_hash"] ?? COL["password"] ?? -1;
  const roleCol  = COL["role"]          ?? -1;
  const nameCol  = COL["jméno"]         ?? COL["name"]  ?? COL["jmeno"] ?? -1;
  const actCol   = COL["active"]        ?? -1;

  if (pwdCol < 0)
    return { success: false, message: "Chybí sloupec 'password_hash' v listu USERS." };
  if (roleCol < 0)
    return { success: false, message: "Chybí sloupec 'role' v listu USERS." };

  const emailNorm = email.toLowerCase().trim();

  // Najdi VŠECHNY řádky kde sedí e-mail
  const matchingRows = [];
  for (let i = HEADER_ROW; i < data.length; i++) {
    const row      = data[i];
    const rowEmail = String(row[emailCol] || "").toLowerCase().trim();
    if (!rowEmail || rowEmail !== emailNorm) continue;

    const rowPwd    = String(row[pwdCol]  || "").trim();
    const rowActive = row[actCol];
    const rowRole   = String(row[roleCol] || "").trim();
    const rowName   = nameCol >= 0 ? String(row[nameCol] || "").trim() : "";

    // Zkontroluj heslo (kontrolujeme u prvního nalezeného řádku)
    if (matchingRows.length === 0 && rowPwd !== password)
      return { success: false, message: "Nesprávné heslo." };

    // Zkontroluj aktivaci
    if (rowActive === false || String(rowActive).toUpperCase() === "FALSE")
      return { success: false, message: "Účet je deaktivován. Kontaktujte administrátora." };

    if (rowRole) matchingRows.push({ role: rowRole, name: rowName });
  }

  if (matchingRows.length === 0)
    return { success: false, message: "Uživatel s tímto e-mailem nebyl nalezen." };

  // Sestav výsledek
  const roles = matchingRows.map(r => r.role);
  const name  = matchingRows[0].name || emailNorm;
  const token = generateToken(emailNorm, roles.join(","));

  writeAudit(ss, "LOGIN", emailNorm, "", roles.join(","),
    "Přihlášení, " + roles.length + " role(í)");

  return { success: true, token, email: emailNorm, name, roles };
}


// ============================================================
// REGISTRACE NOVÉHO UŽIVATELE
// Role: vždy ZADATEL, active: TRUE, okamžitě aktivní
// ============================================================
function registerUser(body) {
  const { name, email, password } = body;

  // Validace
  if (!name || !email || !password)
    return { success: false, message: "Vyplňte všechna pole." };
  if (!email.toLowerCase().endsWith("@uhk.cz"))
    return { success: false, message: "E-mail musí být UHK adresa (@uhk.cz)." };
  if (password.length < 8)
    return { success: false, message: "Heslo musí mít alespoň 8 znaků." };
  if (!/[A-Z]/.test(password))
    return { success: false, message: "Heslo musí obsahovat alespoň jedno velké písmeno." };
  if (!/[0-9]/.test(password))
    return { success: false, message: "Heslo musí obsahovat alespoň jedno číslo." };

  const ss    = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet)
    return { success: false, message: "List USERS nebyl nalezen." };

  const data    = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1];

  const COL = {};
  headers.forEach((h, i) => { if (h) COL[String(h).trim().toLowerCase()] = i; });

  const emailNorm = email.toLowerCase().trim();
  const emailCol  = COL["email"] ?? 0;

  // Zkontroluj duplicitu
  for (let i = HEADER_ROW; i < data.length; i++) {
    const existing = String(data[i][emailCol] || "").toLowerCase().trim();
    if (existing === emailNorm)
      return { success: false, message: "Tento e-mail je již registrován. Přihlaste se." };
  }

  // Připrav nový řádek – vyplní jen sloupce které existují v záhlaví
  const newRow = new Array(headers.length).fill("");
  const set = (colNames, val) => {
    for (const col of colNames) {
      if (COL[col] !== undefined) { newRow[COL[col]] = val; break; }
    }
  };

  set(["email"],                         emailNorm);
  set(["password_hash", "password"],     password);
  set(["role"],                          "ZADATEL");
  set(["active"],                        "TRUE");
  set(["jméno", "name", "jmeno"],        name.trim());
  set(["added_at"],                      formatDate(new Date()));
  set(["added_by"],                      "self-registration");
  set(["note"],                          "Registrován přes webový formulář");

  sheet.appendRow(newRow);
  writeAudit(ss, "USER_REGISTERED", emailNorm, "", "ZADATEL", name.trim());

  return { success: true, message: "Účet byl vytvořen. Nyní se můžete přihlásit." };
}


// ============================================================
// TOKEN – generování a ověření
// Formát (base64): email|roles|timestamp|checksum
// ============================================================
function generateToken(email, roles) {
  const ts  = Date.now().toString();
  const raw = email + "|" + roles + "|" + ts;
  const sum = computeChecksum(raw);
  return Utilities.base64Encode(raw + "|" + sum);
}

function verifyToken(token) {
  if (!token) return { valid: false, reason: "Chybí token." };
  try {
    const decoded = Utilities.newBlob(
      Utilities.base64Decode(token)
    ).getDataAsString();
    const parts = decoded.split("|");
    if (parts.length < 4) return { valid: false, reason: "Neplatný formát tokenu." };

    const checksum   = parts[parts.length - 1];
    const rest       = parts.slice(0, -1);
    const raw        = rest.join("|");
    const email      = rest[0];
    const rolesStr   = rest[1];
    const timestamp  = rest[2];

    if (computeChecksum(raw) !== checksum)
      return { valid: false, reason: "Neplatný podpis tokenu." };

    // Max stáří 8 hodin
    if (Date.now() - Number(timestamp) > 8 * 60 * 60 * 1000)
      return { valid: false, reason: "Token vypršel. Přihlaste se znovu." };

    return { valid: true, email, roles: rolesStr.split(",") };
  } catch (err) {
    return { valid: false, reason: "Chyba dekódování tokenu." };
  }
}

function computeChecksum(raw) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    raw + TOKEN_SECRET
  ).slice(0, 8)
   .map(b => (b & 0xff).toString(16).padStart(2, "0"))
   .join("");
}

// Ověř token a vrať { email, role } nebo vyhoď chybu
function requireAuth(token, allowedRoles) {
  const v = verifyToken(token);
  if (!v.valid) throw new Error("Nepřihlášen: " + v.reason);
  // Pokud je předána konkrétní role v tokenu (z frontend session)
  // allowedRoles je volitelný seznam povolených rolí
  return v;
}


// ============================================================
// SOUTĚŽE – načte seznam z CONFIG listů
// ============================================================
function getCompetitions(token) {
  requireAuth(token);
  const result = [];

  Object.entries(SPREADSHEET_IDS).forEach(([compId, ssId]) => {
    try {
      const ss    = SpreadsheetApp.openById(ssId);
      const sheet = ss.getSheetByName(SHEETS.CONFIG);
      if (!sheet) return;

      // CONFIG má záhlaví key/value v sloupcích B/C od řádku 5
      const data  = sheet.getDataRange().getValues();
      const cfg   = {};
      data.forEach(row => {
        if (row[1]) cfg[String(row[1]).trim()] = row[2];
      });

      // Počet přihlášek
      let appCount = 0;
      const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
      if (appSheet) {
        appCount = Math.max(0, appSheet.getLastRow() - HEADER_ROW);
      }

      result.push({
        id:                compId,
        name:              cfg["competition_name"]        || compId,
        type:              cfg["competition_type"]        || "UHK_CONNECT",
        status:            cfg["status"]                  || "DRAFT",
        description:       cfg["description"]             || "",
        deadline:          cfg["deadline_applications"]   || "",
        allocation:        Number(cfg["total_allocation_czk"]) || 0,
        maxBudget:         Number(cfg["max_budget_czk"])        || 0,
        applicationsCount: appCount,
      });
    } catch (err) {
      logError("getCompetitions:" + compId, err);
    }
  });

  return result;
}


// ============================================================
// FORM FIELDS – definice formuláře přihlášky
// ============================================================
function getFormFields(competitionId, token) {
  requireAuth(token);
  const ss    = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName(SHEETS.FORM_FIELDS);
  if (!sheet) return { success: false, message: "List FORM_FIELDS nenalezen." };

  const rows   = sheetToObjects(sheet);
  const fields = rows
    .filter(r => r.active === true || String(r.active).toUpperCase() === "TRUE")
    .map(r => ({
      field_id        : r.field_id,
      section         : r.section,
      section_order   : Number(r.section_order)  || 0,
      field_order     : Number(r.field_order)    || 0,
      label_cs        : r.label_cs,
      type            : r.type,
      required        : r.required === true || String(r.required).toUpperCase() === "TRUE",
      active          : true,
      placeholder     : r.placeholder  || "",
      help_text       : r.help_text    || "",
      options         : r.options      || "",
      max_length      : r.max_length   || "",
      depends_on_field: r.depends_on_field || "",
      depends_on_value: r.depends_on_value || "",
      internal_only   : r.internal_only === true || String(r.internal_only).toUpperCase() === "TRUE",
    }));

  return { success: true, competitionId, fields };
}


// ============================================================
// PŘIHLÁŠKY
// ============================================================

// Načte stav přihlášky podle ID
function getApplicationStatus(applicationId, token) {
  requireAuth(token);
  for (const [compId, ssId] of Object.entries(SPREADSHEET_IDS)) {
    try {
      const ss   = SpreadsheetApp.openById(ssId);
      const rows = sheetToObjects(ss.getSheetByName(SHEETS.APPLICATIONS));
      const found = rows.find(r => r.application_id === applicationId);
      if (found) return { success: true, application: found, competition: compId };
    } catch (e) {}
  }
  return { success: false, message: "Přihláška nenalezena." };
}

// Seznam přihlášek (admin/komisař vidí vše, žadatel jen své)
function getApplications(competitionId, token, filters) {
  const auth = requireAuth(token);
  const ss   = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) return [];

  let rows = sheetToObjects(sheet);

  // Žadatel vidí jen své
  if (auth.roles && auth.roles.includes("ZADATEL") && auth.roles.length === 1) {
    rows = rows.filter(r => r.applicant_email === auth.email);
  }
  // Filtr statusu
  if (filters && filters.statusFilter) {
    rows = rows.filter(r => r.status === filters.statusFilter);
  }

  return rows;
}

// Uložení přihlášky
function submitApplication(body) {
  const auth = requireAuth(body.token);
  const ss   = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) throw new Error("List APPLICATIONS nenalezen.");

  const now   = new Date();
  const appId = generateAppId();

  // Systémové sloupce + data formuláře
  const fieldValues = Object.values(body.fields || {});
  sheet.appendRow([
    appId,                                      // application_id
    body.competitionId,                         // competition_id
    body.fields.applicant_email || auth.email,  // applicant_email
    formatDate(now),                            // submitted_at
    formatDate(now),                            // updated_at
    body.status || "SUBMITTED",                 // status
    "", "", "", "",                             // status_changed_by/at, budget, notes
    ...fieldValues,                             // pole formuláře
  ]);

  writeAudit(ss, "APPLICATION_SUBMIT", appId, "", body.status, auth.email);
  return { success: true, applicationId: appId };
}

// Změna statusu přihlášky
function changeStatus(body) {
  const auth = requireAuth(body.token);

  // Kontrola oprávnění
  const allowed = ["ADMIN", "PROREKTOR", "KOMISAR", "TESTER"];
  const userRoles = auth.roles || [];
  if (!userRoles.some(r => allowed.includes(r)))
    throw new Error("Nedostatečná oprávnění pro změnu statusu.");

  const ss    = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) throw new Error("List APPLICATIONS nenalezen.");

  const data = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1];
  const COL = {};
  headers.forEach((h, i) => { if (h) COL[String(h).trim()] = i; });

  for (let i = HEADER_ROW; i < data.length; i++) {
    if (data[i][COL["application_id"] ?? 0] !== body.applicationId) continue;

    const oldStatus = data[i][COL["status"] ?? 5];
    const rowNum    = i + 1;

    sheet.getRange(rowNum, (COL["status"]           ?? 5)  + 1).setValue(body.newStatus);
    sheet.getRange(rowNum, (COL["status_changed_by"] ?? 6) + 1).setValue(auth.email);
    sheet.getRange(rowNum, (COL["status_changed_at"] ?? 7) + 1).setValue(formatDate(new Date()));
    sheet.getRange(rowNum, (COL["updated_at"]        ?? 4) + 1).setValue(formatDate(new Date()));
    if (body.note && COL["internal_notes"] !== undefined) {
      sheet.getRange(rowNum, COL["internal_notes"] + 1).setValue(body.note);
    }

    writeAudit(ss, "STATUS_CHANGE", body.applicationId,
      oldStatus, body.newStatus, body.note || "");
    return { success: true, oldStatus, newStatus: body.newStatus };
  }

  throw new Error("Přihláška nenalezena: " + body.applicationId);
}


// ============================================================
// HODNOCENÍ
// ============================================================

// Uložení hodnocení komisaře
function submitReview(body) {
  const auth = requireAuth(body.token);
  const allowed = ["ADMIN", "KOMISAR", "PROREKTOR"];
  if (!auth.roles.some(r => allowed.includes(r)))
    throw new Error("Nedostatečná oprávnění pro hodnocení.");

  const ss    = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName(SHEETS.REVIEWS);
  if (!sheet) throw new Error("List REVIEWS nenalezen.");

  const scores = body.scores || {};
  const total  = ["clarity","quality","budget","profile","outputs"]
    .reduce((s, k) => s + (Number(scores[k]) || 0), 0);

  sheet.appendRow([
    Utilities.getUuid(),
    body.applicationId,
    auth.email,
    formatDate(new Date()),
    scores.clarity  || 0,
    scores.quality  || 0,
    scores.budget   || 0,
    scores.profile  || 0,
    scores.outputs  || 0,
    total,
    (body.comments || {}).public   || "",
    (body.comments || {}).internal || "",
    body.recommendation || "",
    scores.conflict ? "TRUE" : "FALSE",
  ]);

  writeAudit(ss, "REVIEW_SUBMITTED", body.applicationId,
    "", body.recommendation, `${auth.email}, ${total}/25 bodů`);
  return { success: true, total };
}

// Načtení hodnocení pro přihlášku
function getReviews(competitionId, applicationId, token) {
  const auth = requireAuth(token);
  const allowed = ["ADMIN", "PROREKTOR", "KOMISAR", "TESTER", "READONLY"];
  if (!auth.roles.some(r => allowed.includes(r)))
    throw new Error("Nedostatečná oprávnění.");

  const ss   = getSpreadsheet(competitionId);
  const rows = sheetToObjects(ss.getSheetByName(SHEETS.REVIEWS));
  return rows.filter(r => r.application_id === applicationId);
}


// ============================================================
// POMOCNÉ FUNKCE
// ============================================================

// Vrátí Spreadsheet podle competition_id
function getSpreadsheet(competitionId) {
  const id = SPREADSHEET_IDS[competitionId];
  if (!id) throw new Error("Neznámé competition_id: " + competitionId);
  return SpreadsheetApp.openById(id);
}

// Převede list na pole objektů (záhlaví = klíče)
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
    .filter(o => Object.values(o).some(v => v !== "" && v !== null && v !== undefined));
}

// Generuje ID přihlášky
function generateAppId() {
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMdd");
  const rand  = Math.random().toString(36).slice(2, 7).toUpperCase();
  return "APP-" + date + "-" + rand;
}

// Formátuje datum
function formatDate(date) {
  return Utilities.formatDate(
    date instanceof Date ? date : new Date(date),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd HH:mm:ss"
  );
}

// Zapíše do AUDIT_LOG
function writeAudit(ss, action, targetId, oldVal, newVal, note) {
  try {
    const sheet = ss.getSheetByName(SHEETS.AUDIT);
    if (!sheet) return;
    sheet.appendRow([
      formatDate(new Date()),
      Session.getActiveUser().getEmail() || "webapp",
      action,
      targetId  || "",
      oldVal    || "",
      newVal    || "",
      note      || "",
    ]);
  } catch (e) {
    // Audit není kritický – neblokuje hlavní operaci
  }
}

// Loguje chyby do konzole Apps Script
function logError(context, err) {
  console.error("[UHK Grant] " + context + ": " + err.message);
}


// ============================================================
// MENU V SHEETS – spusť po otevření souboru
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎓 UHK Grant Manager")
    .addItem("✅ Ověřit nastavení", "checkSetup")
    .addItem("📊 Spustit report hodnocení", "sendReviewReport")
    .addSeparator()
    .addItem("⚙️ Instalovat triggery", "installTriggers")
    .addToUi();
}

// Zkontroluje, zda jsou všechny listy správně nastaveny
function checkSetup() {
  const ss      = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  const missing = [];
  Object.values(SHEETS).forEach(name => {
    if (!ss.getSheetByName(name)) missing.push(name);
  });

  if (missing.length === 0) {
    SpreadsheetApp.getUi().alert(
      "✅ Vše v pořádku!\n\n" +
      "Všechny listy jsou správně nastaveny.\n" +
      "Spreadsheet ID: " + GLOBAL_SPREADSHEET_ID
    );
  } else {
    SpreadsheetApp.getUi().alert(
      "⚠️ Chybějící listy:\n\n" +
      missing.join("\n") +
      "\n\nVytvoř tyto listy v Google Sheets " +
      "a ujisti se, že název záložky přesně odpovídá (včetně emoji)."
    );
  }
}

// Instalace triggerů
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  const ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  ScriptApp.newTrigger("onEditHandler").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("sendReviewReport").timeBased().atHour(8).everyDays(1).create();
  SpreadsheetApp.getUi().alert("✅ Triggery nainstalovány.");
}

// Trigger při editaci – zápis do AUDIT_LOG při změně statusu
function onEditHandler(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const row   = e.range.getRow();
  const col   = e.range.getColumn();
  if (row <= HEADER_ROW) return;
  if (sheet.getName() !== SHEETS.APPLICATIONS) return;

  // Sloupec 6 = status
  if (col === 6 && e.value !== e.oldValue) {
    const ss    = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
    const appId = sheet.getRange(row, 1).getValue();
    writeAudit(ss, "STATUS_CHANGE_SHEET", appId, e.oldValue || "", e.value || "",
      "Změněno přímo v Sheets");

    // Pošli e-mail žadateli pokud máme jeho adresu
    const emailCell = sheet.getRange(row, 3).getValue();
    if (emailCell && e.value) {
      sendStatusEmail(emailCell, appId, e.value,
        sheet.getRange(row, 11).getValue()); // sloupec K = project_title
    }
  }
}

// Odešle e-mail žadateli při změně statusu
function sendStatusEmail(toEmail, appId, newStatus, projectTitle) {
  const subjects = {
    SUBMITTED:    "[UHK Connect] Přihláška přijata – " + appId,
    FORMAL_CHECK: "[UHK Connect] Formální kontrola – " + appId,
    IN_REVIEW:    "[UHK Connect] Předáno k hodnocení – " + appId,
    APPROVED:     "[UHK Connect] 🎉 Přihláška schválena – " + appId,
    REJECTED:     "[UHK Connect] Výsledek hodnocení – " + appId,
    WITHDRAWN:    "[UHK Connect] Přihláška stažena – " + appId,
  };
  const subject = subjects[newStatus];
  if (!subject) return;

  const statusTexts = {
    SUBMITTED:    "Vaše přihláška byla úspěšně přijata a čeká na formální kontrolu.",
    FORMAL_CHECK: "Probíhá formální kontrola Vaší přihlášky.",
    IN_REVIEW:    "Vaše přihláška byla předána hodnoticímu panelu.",
    APPROVED:     "Gratulujeme! Vaše přihláška byla schválena k financování.",
    REJECTED:     "Vaše přihláška nebyla v tomto kole podpořena. Komentář hodnoticího panelu Vám bude zaslán administrátorkou.",
    WITHDRAWN:    "Vaše přihláška byla stažena ze soutěže.",
  };

  const body =
    "Vážená/ý žadateli,\n\n" +
    statusTexts[newStatus] + "\n\n" +
    "ID přihlášky: " + appId + "\n" +
    "Projekt: " + (projectTitle || "–") + "\n\n" +
    "V případě dotazů kontaktujte administrátorku:\n" +
    "hana.tomaskova@uhk.cz\n\n" +
    "S pozdravem,\n" +
    "Oddělení vědy a transferu znalostí\n" +
    "Univerzita Hradec Králové";

  try {
    GmailApp.sendEmail(toEmail, subject, body, {
      name: "UHK – Grantové soutěže",
      replyTo: "hana.tomaskova@uhk.cz",
    });
  } catch (err) {
    logError("sendStatusEmail", err);
  }
}

// Denní souhrnný report hodnocení
function sendReviewReport() {
  const ss       = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  const revSheet = ss.getSheetByName(SHEETS.REVIEWS);
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!revSheet || !appSheet) return;

  const reviews = sheetToObjects(revSheet);
  const apps    = sheetToObjects(appSheet);
  if (!reviews.length) return;

  // Seskup hodnocení podle přihlášky
  const grouped = {};
  reviews.forEach(r => {
    const id = r.application_id;
    if (!grouped[id]) grouped[id] = [];
    grouped[id].push(r);
  });

  // Mapa přihlášek
  const appMap = {};
  apps.forEach(a => { appMap[a.application_id] = a; });

  const now = formatDate(new Date());
  let report = "UHK Connect – Souhrnný report hodnocení\n";
  report += "Vygenerováno: " + now + "\n";
  report += "=".repeat(50) + "\n\n";

  // Seřaď podle průměrného skóre
  const ranked = Object.entries(grouped)
    .map(([id, revs]) => {
      const avg = revs.reduce((s, r) => s + (Number(r.score_total) || 0), 0) / revs.length;
      return { id, revs, avg };
    })
    .sort((a, b) => b.avg - a.avg);

  ranked.forEach(({ id, revs, avg }, idx) => {
    const app = appMap[id] || {};
    report += "#" + (idx + 1) + " " + id + "\n";
    report += "   Projekt: " + (app.project_title || "–") + "\n";
    report += "   Žadatel: " + (app.applicant_name || "–") + "\n";
    report += "   Průměrné skóre: " + avg.toFixed(1) + " / 25\n";
    report += "   Hodnocení: " + revs.length + "×\n";
    revs.forEach(r => {
      report += "   ↳ " + r.reviewer_email + ": " + r.score_total +
        " bodů, " + r.recommendation + "\n";
    });
    report += "\n";
  });

  try {
    GmailApp.sendEmail(
      "hana.tomaskova@uhk.cz",
      "[UHK Connect] Report hodnocení – " + now,
      report,
      { name: "UHK Grant Manager" }
    );
  } catch (err) {
    logError("sendReviewReport", err);
  }
}
