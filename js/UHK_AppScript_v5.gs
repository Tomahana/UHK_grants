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

// ── Spreadsheet IDs ─────────────────────────────────────────
const GLOBAL_SPREADSHEET_ID = "1maDTXF8xKCpSY0LfeNcRyLo1KtulgipEIwQaIGb3Su0"; // Connect
const USERS_SPREADSHEET_ID  = "17bf7fHOu-tdza7UXzahwWyIAwwuk0BcpC39KGiG-64g"; // Globální USERS

const SPREADSHEET_IDS = {
  "uhk_connect_2026_v2": "1maDTXF8xKCpSY0LfeNcRyLo1KtulgipEIwQaIGb3Su0",
  "uhk_navraty_2026":    "1E8hRFVkVt3WuhGcSrhz9E0P9Pvz7udoT1IGMnNH8ADc",
  "uhk_rega_2026_v1":    "1VU3c_gwxjbuZuNQ5_B1iqlbGzOgLwtUXUAI-E2dt6EA",
  "uhk_prestige_2026":   "1qmx2gFETaYJVdZmhkGUvdGdukARlQZXnepVPYJSuemk",
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
  ROLES        : "🎭 ROLES",
};

// Záhlaví je na řádku 4, data od řádku 5
const HEADER_ROW = 4;

// Admin e-mail pro notifikace
const ADMIN_EMAIL = "hana.tomaskova@uhk.cz";

/** ID soutěže Connect (měsíční workflow + notifikace komise) */
const CONNECT_COMPETITION_ID = "uhk_connect_2026_v2";


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
      case "login":            return corsResponse(handleLoginGlobal(p.email, p.password));
      case "verifyToken":      return corsResponse(verifyToken(p.token));
      case "getCompetitions":  return corsResponse(getCompetitions(p.token));
      case "getCompetitionConfig":
        return corsResponse(getCompetitionConfigAction(p.competitionId, p.token));
      case "getFormFields":    return corsResponse(getFormFields(p.competitionId, p.token));
      case "getApplications":  return corsResponse(getApplications(p.competitionId, p.token, p));
      case "getApplicationStatus": return corsResponse(getApplicationStatus(p.applicationId, p.token));
      case "getReviews":       return corsResponse(getReviews(p.competitionId, p.applicationId, p.token));
      case "getConnectReviews":
        return corsResponse(getConnectReviews(p.competitionId, p.token));
      case "getProjects":      return corsResponse(getProjects(p.competitionId, p.token));
      case "getUsers":         return corsResponse(getUsers(p.token));
      case "getUserRoles":     return corsResponse(getUserRoles(p.email, p.token));
      case "getNavratyReviews": return corsResponse(getNavratyAllReviews(p.competitionId, p.token));
      case "getDraft":         return corsResponse(getDraft(p.competitionId, p.applicantEmail, p.token));
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
      case "changeStatus":
      case "updateApplicationStatus":
        return corsResponse(changeStatus(body));
      case "submitReview":     return corsResponse(submitReview(body));
      case "submitNavratyReview": return corsResponse(submitNavratyReview(body));
      case "createUser":       return corsResponse(createUser(body));
      case "updateUser":       return corsResponse(updateUser(body));
      case "updateConfig":     return corsResponse(updateConfig(body));
      case "saveProrekorDecision": return corsResponse(saveProrekorDecision(body));
      case "submitConnectReview": return corsResponse(submitConnectReview(body));
      case "saveConnectProrektorDecision":
        return corsResponse(saveConnectProrektorDecision(body));
      case "saveDraft":        return corsResponse(saveDraft(body));
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

    return {
      valid: true,
      email: parts[0],
      roles: parts[1].split(",").map(function (x) { return String(x).trim(); }).filter(Boolean),
    };
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

/**
 * Zapíše jeden řádek listu CONFIG do mapy cfg.
 * Standard: sloupec B = klíč, C = hodnota.
 * Fallback: pokud je B prázdné a A vypadá jako technický klíč (např. dashboard_visible), pak A = klíč, B = hodnota.
 */
function absorbConfigRow(cfg, row) {
  const a = String(row[0] !== undefined && row[0] !== null ? row[0] : "").trim();
  const b = String(row[1] !== undefined && row[1] !== null ? row[1] : "").trim();
  if (b) {
    cfg[b] = row[2];
    return;
  }
  if (a && /^[a-z][a-z0-9_]*$/i.test(a)) cfg[a] = row[1];
}

/** Viditelnost na rozcestníku: prázdná / chybějící hodnota = viditelné. FALSE / 0 / NE = skryté pro ne-adminy. */
function configDashboardVisible(cfg) {
  const v = cfg["dashboard_visible"];
  if (v === undefined || v === null || v === "") return true;
  if (v === false) return false;
  if (v === true) return true;
  const s = String(v).trim().toUpperCase();
  if (s === "FALSE" || s === "0" || s === "NE") return false;
  return true;
}

/** Celý CONFIG list jako objekt (pro administraci soutěží). */
function getCompetitionConfigAction(competitionId, token) {
  requireAuth(token);
  if (!competitionId) throw new Error("chybí competitionId");
  const ss    = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheet) throw new Error("CONFIG list nenalezen pro: " + competitionId);
  const cfg = {};
  sheet.getDataRange().getValues().forEach(row => absorbConfigRow(cfg, row));
  return { success: true, competitionId: competitionId, config: cfg };
}

function getCompetitions(token) {
  requireAuth(token);
  const result = [];
  Object.entries(SPREADSHEET_IDS).forEach(([compId, ssId]) => {
    try {
      const ss    = SpreadsheetApp.openById(ssId);
      const sheet = ss.getSheetByName(SHEETS.CONFIG);
      // Pokud CONFIG neexistuje, přidej základní kartu
      if (!sheet) {
        if (compId === "uhk_navraty_2026") {
          result.push({
            id: compId, name: "OP JAK Návraty – IGA komise",
            type: "OP_JAK_NAVRATY", status: "RUNNING",
            description: "Hodnocení projektů IGA komise.",
            deadline: "2026-06-30", allocation: 40156893,
            maxBudget: 0, applicationsCount: 0,
            dashboardVisible: true,
          });
        }
        return;
      }

      const cfg = {};
      sheet.getDataRange().getValues().forEach(row => absorbConfigRow(cfg, row));

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
        dashboardVisible:  configDashboardVisible(cfg),
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
  if (!sheet) return { applications: [] };
  let rows = sheetToObjects(sheet);

  // Sjednoť e-mail a status (Sheets / JSON někdy vrací jiné klíče nebo mezery)
  rows = rows.map(function (r) {
    var em =
      r.applicant_email ||
      r.applicantEmail ||
      r["Applicant email"] ||
      r["E-mail žadatele"] ||
      r.email ||
      "";
    var st = String(r.status != null ? r.status : "").trim().toUpperCase();
    var out = {};
    for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) out[k] = r[k];
    out.applicant_email = String(em).trim();
    out.status = st;
    var fd = String(r.form_data_json || r.form_data || "").trim();
    if (!fd || fd === "{}") {
      var wrongCol = String(r.coordinator_email || r.project_title || "").trim();
      if (wrongCol.charAt(0) === "{") fd = wrongCol;
    }
    out.form_data_json = fd;
    return out;
  });

  // Kdo nevidí celý seznam soutěže → jen vlastní řádky (Moje přihlášky)
  var rolesU = (auth.roles || []).map(function (x) { return String(x).trim().toUpperCase(); });
  var privileged = rolesU.some(function (role) {
    return ["ADMIN", "PROREKTOR", "KOMISAR", "KOMISAŘ", "TESTER", "READONLY"].indexOf(role) >= 0;
  });
  if (!privileged) {
    var me = String(auth.email || "").toLowerCase().trim();
    rows = rows.filter(function (r) {
      return String(r.applicant_email || "").toLowerCase().trim() === me;
    });
  }

  if (filters && filters.statusFilter)
    rows = rows.filter(function (r) {
      return String(r.status || "").trim() === String(filters.statusFilter).trim();
    });
  return { applications: rows };
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
    const comp = String(body.competitionId || "").trim();
    const ns = String(body.newStatus || "").toUpperCase();
    const os = String(oldStatus || "").toUpperCase();
    if (comp === CONNECT_COMPETITION_ID && ns === "IN_REVIEW" && os !== "IN_REVIEW")
      notifyConnectCommissionInReview_(body.applicationId, projectT);
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

/** Normalizace ID přihlášky z řádku REVIEWS (project_id / application_id). */
function connectReviewAppId_(r) {
  return String(r.project_id || r.application_id || r.applicationId || "").trim();
}

/** Všechna hodnocení Connect z ⭐ REVIEWS (frontend: getConnectReviews). */
function getConnectReviews(competitionId, token) {
  const auth = requireAuth(token);
  if (!auth.roles.some(r => ["ADMIN", "PROREKTOR", "KOMISAR", "TESTER", "READONLY"].includes(r)))
    throw new Error("Nedostatečná oprávnění.");
  const sheet = getSpreadsheet(competitionId).getSheetByName(SHEETS.REVIEWS);
  if (!sheet) return { success: true, reviews: [] };
  const rows = sheetToObjects(sheet);
  const reviews = rows.map(function (r) {
    const o = {};
    for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) o[k] = r[k];
    o.project_id = connectReviewAppId_(r);
    return o;
  });
  return { success: true, reviews: reviews };
}

function deleteConnectReviewsByReviewer_(sheet, applicationId, reviewerEmail) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= HEADER_ROW) return;
  const COL = mapColumns(data[HEADER_ROW - 1]);
  const aid = findCol(COL, "application_id", "project_id", "app_id");
  const rem = findCol(COL, "reviewer_email", "reviewer", "email", "hodnotitel");
  const intn = findCol(COL, "comment_internal", "internal", "interni");
  if (aid < 0 || rem < 0) return;
  const em = String(reviewerEmail || "").toLowerCase().trim();
  const aidv = String(applicationId || "").trim();
  for (let i = data.length - 1; i >= HEADER_ROW; i--) {
    const rowId = String(data[i][aid] || "").trim();
    const rowEm = String(data[i][rem] || "").toLowerCase().trim();
    const internal = intn >= 0 ? String(data[i][intn] || "").trim() : "";
    if (rowId === aidv && rowEm === em && internal !== "PROREKTOR_DECISION")
      sheet.deleteRow(i + 1);
  }
}

function deleteProrektorConnectDecisionsForApp_(sheet, applicationId) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= HEADER_ROW) return;
  const COL = mapColumns(data[HEADER_ROW - 1]);
  const aid = findCol(COL, "application_id", "project_id", "app_id");
  const intn = findCol(COL, "comment_internal", "internal", "interni");
  if (aid < 0 || intn < 0) return;
  const aidv = String(applicationId || "").trim();
  for (let i = data.length - 1; i >= HEADER_ROW; i--) {
    const rowId = String(data[i][aid] || "").trim();
    const internal = String(data[i][intn] || "").trim();
    if (rowId === aidv && internal === "PROREKTOR_DECISION")
      sheet.deleteRow(i + 1);
  }
}

function appendReviewsRowFromMap_(sheet, map) {
  const data = sheet.getDataRange().getValues();
  const hdrs = data[HEADER_ROW - 1];
  const width = Math.max(hdrs.length, 1);
  const row = new Array(width).fill("");
  const COL = mapColumns(hdrs);
  const putMany = function (val) {
    const names = Array.prototype.slice.call(arguments, 1);
    if (val === undefined || val === null) return;
    const c = findCol.apply(null, [COL].concat(names));
    if (c >= 0 && c < width) row[c] = val;
  };
  putMany(map.review_id, "review_id", "id", "reviewId");
  putMany(map.application_id, "application_id", "project_id", "app_id");
  putMany(map.reviewer_email, "reviewer_email", "reviewer", "email", "hodnotitel");
  putMany(map.reviewer_name, "reviewer_name", "name", "hodnotitel_jmeno", "jmeno");
  putMany(map.submitted_at, "submitted_at", "datum", "created_at");
  putMany(map.score_clarity, "score_clarity", "clarity", "k1");
  putMany(map.score_quality, "score_quality", "quality", "k2");
  putMany(map.score_budget, "score_budget", "budget", "k3");
  putMany(map.score_profile, "score_profile", "profile", "k4");
  putMany(map.score_outputs, "score_outputs", "outputs", "k5");
  putMany(map.score_total, "score_total", "total", "celkem");
  putMany(map.recommendation, "recommendation", "doporuceni", "verdict");
  putMany(map.comment_public, "comment_public", "komentar_verejny", "public_comment");
  putMany(map.comment_internal, "comment_internal", "internal", "interni");
  putMany(map.comment_k1, "comment_k1", "k1_comment");
  putMany(map.comment_k2, "comment_k2", "k2_comment");
  putMany(map.comment_k3, "comment_k3", "k3_comment");
  putMany(map.comment_k4, "comment_k4", "k4_comment");
  putMany(map.comment_k5, "comment_k5", "k5_comment");
  putMany(map.poradi, "poradi", "rank");
  putMany(map.conflict, "conflict", "stret_zajmu");
  sheet.appendRow(row);
}

/** Hodnocení komise – upsert řádku v ⭐ REVIEWS (formulář review-connect). */
function submitConnectReview(body) {
  const auth = requireAuth(body.token);
  if (!auth.roles.some(r => ["ADMIN", "KOMISAR", "KOMISAŘ", "TESTER"].includes(r)))
    throw new Error("Hodnocení komise mohou ukládat jen členové komise nebo správce.");
  const competitionId = body.competitionId;
  const projectId = String(body.projectId || "").trim();
  if (!projectId) throw new Error("chybí projectId");
  const ss = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName(SHEETS.REVIEWS);
  if (!sheet) throw new Error("List REVIEWS nenalezen.");
  deleteConnectReviewsByReviewer_(sheet, projectId, auth.email);
  const tot = Number(body.score_total) ||
    (Number(body.score_clarity) || 0) + (Number(body.score_quality) || 0) +
    (Number(body.score_budget) || 0) + (Number(body.score_profile) || 0) + (Number(body.score_outputs) || 0);
  const map = {
    review_id: Utilities.getUuid(),
    application_id: projectId,
    reviewer_email: auth.email,
    reviewer_name: body.reviewerName || auth.email,
    submitted_at: fmtDate(new Date()),
    score_clarity: Number(body.score_clarity) || 0,
    score_quality: Number(body.score_quality) || 0,
    score_budget: Number(body.score_budget) || 0,
    score_profile: Number(body.score_profile) || 0,
    score_outputs: Number(body.score_outputs) || 0,
    score_total: tot,
    recommendation: body.recommendation || "",
    comment_public: body.comment_public || "",
    comment_internal: body.comment_internal || "",
    comment_k1: body.comment_k1 || "",
    comment_k2: body.comment_k2 || "",
    comment_k3: body.comment_k3 || "",
    comment_k4: body.comment_k4 || "",
    comment_k5: body.comment_k5 || "",
  };
  appendReviewsRowFromMap_(sheet, map);
  writeAudit(ss, "CONNECT_REVIEW", projectId, "", body.recommendation || "",
    auth.email + ", " + tot + "/25");
  return { success: true, total: tot };
}

/** Finální rozhodnutí prorektora u Connect + změna stavu přihlášky. */
function saveConnectProrektorDecision(body) {
  const auth = requireAuth(body.token);
  if (!auth.roles.some(r => ["ADMIN", "PROREKTOR"].includes(r)))
    throw new Error("Rozhodnutí může ukládat pouze prorektor nebo správce.");
  const competitionId = body.competitionId;
  const appId = String(body.applicationId || "").trim();
  const decision = String(body.decision || "").toUpperCase();
  const note = String(body.comment || "").trim();
  if (!appId) throw new Error("chybí applicationId");
  if (["SUPPORT", "CUT", "REJECT"].indexOf(decision) < 0)
    throw new Error("Neplatné rozhodnutí (očekáváno SUPPORT, CUT nebo REJECT).");
  const ss = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName(SHEETS.REVIEWS);
  if (!sheet) throw new Error("List REVIEWS nenalezen.");
  deleteProrektorConnectDecisionsForApp_(sheet, appId);
  appendReviewsRowFromMap_(sheet, {
    review_id: Utilities.getUuid(),
    application_id: appId,
    reviewer_email: auth.email,
    submitted_at: fmtDate(new Date()),
    score_clarity: 0,
    score_quality: 0,
    score_budget: 0,
    score_profile: 0,
    score_outputs: 0,
    score_total: 0,
    recommendation: decision,
    comment_public: note,
    comment_internal: "PROREKTOR_DECISION",
  });
  const newStatus = decision === "REJECT" ? "REJECTED" : "APPROVED";
  const statusNote = decision === "CUT"
    ? "Rozhodnutí prorektora: krátit rozpočet. " + note
    : (decision === "REJECT" ? note : (decision === "SUPPORT" ? note : note));
  changeStatus({
    token: body.token,
    competitionId: competitionId,
    applicationId: appId,
    newStatus: newStatus,
    note: statusNote || undefined,
  });
  writeAudit(ss, "CONNECT_PROREKTOR", appId, "", decision, auth.email);
  return { success: true, newStatus: newStatus };
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
    .addItem("📅 Měsíční souhrn Connect (ručně)", "sendConnectMonthlyAdminNotification")
    .addSeparator()
    .addItem("⚙️ Instalovat triggery", "installTriggers")
    .addToUi();
}

/** Denně: report hodnocení + 16. den v měsíci měsíční souhrn přihlášek pro administrátory Connect. */
function runDailyConnectTasks() {
  try {
    sendReviewReport();
  } catch (err) {
    console.error("runDailyConnectTasks sendReviewReport:", err.message);
  }
  try {
    sendConnectMonthlyAdminNotificationIfDue();
  } catch (err) {
    console.error("runDailyConnectTasks monthly:", err.message);
  }
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  const ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  ScriptApp.newTrigger("onEditHandler").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("runDailyConnectTasks").timeBased().atHour(8).everyDays(1).create();
  const msg =
    "✅ Triggery nainstalovány.\n\n" +
    "• onEditHandler (stav v APPLICATIONS)\n" +
    "• Každý den 8:00 – report hodnocení + 16. den měsíce měsíční souhrn Connect pro administrátory";
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    // Samostatný projekt (ne vázaný na tabulku), spuštění z editoru „Run“, nebo kontext bez UI
    console.log(msg);
  }
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
    const nv = String(e.value || "").toUpperCase();
    const ov = String(e.oldValue || "").toUpperCase();
    if (nv === "IN_REVIEW" && ov !== "IN_REVIEW")
      notifyConnectCommissionInReview_(appId, projectT);
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

/**
 * Přidá řádek do 📥 APPLICATIONS podle skutečných názvů sloupců v záhlaví (ř. HEADER_ROW).
 * Důležité: nepoužívat appendRow s fixním pořadím 10 hodnot, pokud tabulka má další sloupce
 * (project_title, coordinator_email, …) – JSON by se zapsal špatně.
 */
function appendApplicationsRowFromMap(sheet, map) {
  const data  = sheet.getDataRange().getValues();
  const hdrs  = data[HEADER_ROW - 1];
  const width = Math.max(hdrs.length, 1);
  const row   = new Array(width).fill("");
  const COL   = mapColumns(hdrs);

  /** val, pak alternativní názvy sloupců */
  const putMany = function (val) {
    var nameList = Array.prototype.slice.call(arguments, 1);
    if (val === undefined || val === null) return;
    var c = findCol.apply(null, [COL].concat(nameList));
    if (c >= 0 && c < width) row[c] = val;
  };

  putMany(map.application_id, "application_id", "id", "app_id");
  putMany(map.competition_id, "competition_id");
  putMany(map.applicant_email, "applicant_email", "email_zadatele", "email");
  putMany(map.applicant_name, "applicant_name", "name", "jmeno", "cele_jmeno");
  putMany(map.status, "status", "stav");
  putMany(map.created_at, "created_at", "vytvoreno");
  putMany(map.updated_at, "updated_at", "upraveno");
  putMany(map.form_data_json, "form_data_json", "form_data", "data_json", "json_data", "formdata", "prihlaska_json");
  putMany(map.submitted_at, "submitted_at", "datum_podani");
  putMany(map.note, "note", "notes", "poznamka", "internal_notes");
  putMany(map.project_title, "project_title", "nazev_projektu", "project", "nazev");

  sheet.appendRow(row);
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

/** Parsuje submitted_at z listu (řetězec yyyy-MM-dd HH:mm:ss nebo Date z Sheets). */
function parseSubmittedAt_(val) {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const s = String(val).trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const d = new Date(
      Number(m[1]), Number(m[2]) - 1, Number(m[3]),
      m[4] ? Number(m[4]) : 0, m[5] ? Number(m[5]) : 0, m[6] ? Number(m[6]) : 0
    );
    return isNaN(d.getTime()) ? null : d;
  }
  const tryD = new Date(s);
  return isNaN(tryD.getTime()) ? null : tryD;
}

/**
 * Kolo příjmu pro měsíční souhrn: od 16. předchozího měsíce 00:00 do 15. běžného měsíce 23:59:59.
 * Voláno v den 16. (souhrn právě uzavřeného kola).
 */
function getConnectIntakeWindowEndOnSixteenth_(referenceDate) {
  const d = referenceDate instanceof Date ? new Date(referenceDate.getTime()) : new Date(referenceDate);
  const y = d.getFullYear();
  const m = d.getMonth(); // 0–11, den 16. → m je měsíc „uzávěrky“ kola
  const end = new Date(y, m, 15, 23, 59, 59);
  const start = new Date(y, m - 1, 16, 0, 0, 0);
  return { start: start, end: end };
}

function formatCsDateTime_(date) {
  if (!date) return "–";
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "d. M. yyyy HH:mm");
}

/** E-maily ADMINů pro Connect z globálního listu ROLES (+ volitelně CONFIG connect_admin_notify_emails). */
function getConnectAdminNotifyEmails_(ssConnect) {
  const emails = {};
  const add = function (e) {
    const x = String(e || "").toLowerCase().trim();
    if (x && x.indexOf("@") > 0) emails[x] = true;
  };
  add(ADMIN_EMAIL);
  try {
    const cfg = getConfigMap(ssConnect);
    if (cfg.connect_admin_notify_emails)
      String(cfg.connect_admin_notify_emails).split(/[;,]/).forEach(function (p) { add(p); });
  } catch (e) { /* ignore */ }
  try {
    const ssUsers = SpreadsheetApp.openById(USERS_SPREADSHEET_ID);
    const rs = ssUsers.getSheetByName("🎭 ROLES");
    if (rs) {
      sheetToObjects(rs).forEach(function (r) {
        if (String(r.competition_id || "").trim() !== CONNECT_COMPETITION_ID) return;
        if (String(r.role || "").toUpperCase().trim() !== "ADMIN") return;
        add(r.email);
      });
    }
  } catch (e) { /* ignore */ }
  return Object.keys(emails);
}

/** E-maily komisařů Connect (KOMISAR / KOMISAŘ). */
function getConnectKomisarEmails_() {
  const emails = {};
  try {
    const ssUsers = SpreadsheetApp.openById(USERS_SPREADSHEET_ID);
    const rs = ssUsers.getSheetByName("🎭 ROLES");
    if (!rs) return [];
    sheetToObjects(rs).forEach(function (r) {
      if (String(r.competition_id || "").trim() !== CONNECT_COMPETITION_ID) return;
      const role = String(r.role || "").toUpperCase().trim();
      if (role !== "KOMISAR" && role !== "KOMISAŘ") return;
      const e = String(r.email || "").toLowerCase().trim();
      if (e && e.indexOf("@") > 0) emails[e] = true;
    });
  } catch (e) { /* ignore */ }
  return Object.keys(emails);
}

/**
 * Měsíční souhrn pro administrátory Connect: přihlášky s datem podání v intervalu kola 16.–15.
 */
function sendConnectMonthlyAdminNotification() {
  const ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  const win = getConnectIntakeWindowEndOnSixteenth_(new Date());
  const apps = sheetToObjects(ss.getSheetByName(SHEETS.APPLICATIONS));
  const inWindow = [];
  apps.forEach(function (a) {
    const st = String(a.status || "").toUpperCase().trim();
    if (st === "DRAFT") return;
    const sub = parseSubmittedAt_(a.submitted_at || a.datum_podani);
    if (!sub || sub < win.start || sub > win.end) return;
    inWindow.push(a);
  });

  const to = getConnectAdminNotifyEmails_(ss);
  if (!to.length) {
    console.warn("sendConnectMonthlyAdminNotification: žádní příjemci");
    return;
  }

  const lines = inWindow.map(function (a, i) {
    return (i + 1) + ". " + String(a.application_id || "–") + " | " +
      String(a.project_title || "–").slice(0, 80) + " | stav: " + String(a.status || "–") +
      " | žadatel: " + String(a.applicant_name || a.applicant_email || "–");
  });

  const body =
    "Dobrý den,\n\n" +
    "toto je automatický souhrn soutěže UHK Connect za uzavřené kolo příjmu žádostí:\n" +
    "od " + formatCsDateTime_(win.start) + " do " + formatCsDateTime_(win.end) + ".\n\n" +
    "Počet záznamů s datem podání v tomto intervalu (bez konceptů): " + inWindow.length + "\n\n" +
    (lines.length ? lines.join("\n") + "\n\n" : "(V intervalu nebyly nalezeny žádné podané přihlášky.)\n\n") +
    "── Postup dle výzvy / OVTZ ──\n" +
    "• Formální posouzení (příprava na předání komisi): administrátor má k dispozici 2 pracovní dny.\n" +
    "• Poté označte v systému / v tabulce projekty připravené na posouzení komisí (stav IN_REVIEW).\n" +
    "• Komise obdrží e-mailovou výzvu k hodnocení; na hodnocení jednotlivých přihlášek je stanovena lhůta 5 pracovních dní.\n" +
    "• Prorektor následně učiní shrnující rozhodnutí (podpořit / zkrátit rozpočet / zamítnout) do 2 pracovních dnů.\n" +
    "• Ukončení realizace podporovaných aktivit nejpozději do 15. 11. 2026 (dle výzvy UHK Connect).\n\n" +
    "Hodnoticí formulář pro komisi: webový portál → Hodnocení – UHK Connect (review-connect).\n\n" +
    "Dotazy: " + ADMIN_EMAIL + "\n\n" +
    "— UHK Grant Manager (automaticky)";

  GmailApp.sendEmail(
    to.join(","),
    "[UHK Connect] Měsíční souhrn přihlášek – kolo " +
      Utilities.formatDate(win.start, Session.getScriptTimeZone(), "d. M.") +
      " – " +
      Utilities.formatDate(win.end, Session.getScriptTimeZone(), "d. M. yyyy"),
    body,
    { name: "UHK Grant Manager", replyTo: ADMIN_EMAIL }
  );
  writeAudit(ss, "CONNECT_MONTHLY_SUMMARY", "—", "", String(inWindow.length),
    "Odesláno: " + to.join(", "));
}

/** Spustí měsíční souhrn pouze v den 16. v měsíci (voláno z denního triggeru). */
function sendConnectMonthlyAdminNotificationIfDue() {
  const d = new Date();
  if (d.getDate() !== 16) return;
  sendConnectMonthlyAdminNotification();
}

/** E-mail komisi po předání přihlášky do IN_REVIEW. */
function notifyConnectCommissionInReview_(applicationId, projectTitle) {
  const recipients = getConnectKomisarEmails_();
  if (!recipients.length) {
    console.warn("notifyConnectCommissionInReview_: žádní komisaři v ROLES pro Connect");
    return;
  }
  const subj = "[UHK Connect] Nová přihláška k hodnocení – " + applicationId;
  const body =
    "Dobrý den,\n\n" +
    "byla Vám předána přihláška k hodnocení v soutěži UHK Connect.\n\n" +
    "ID: " + applicationId + "\n" +
    "Název projektu: " + (projectTitle || "–") + "\n\n" +
    "Na hodnocení v hodnoticím formuláři máte 5 pracovních dní od předání.\n" +
    "Po vyhodnocení komisí následuje rozhodnutí prorektora (podpořit / zkrátit / zamítnout) do 2 pracovních dnů.\n\n" +
    "Přihlaste se do portálu: sekce Hodnocení – UHK Connect.\n\n" +
    "Dotazy ke koordinaci: " + ADMIN_EMAIL + "\n\n" +
    "— UHK Grant Manager";
  try {
    GmailApp.sendEmail(
      recipients.join(","),
      subj,
      body,
      { name: "UHK Grant Manager", replyTo: ADMIN_EMAIL }
    );
  } catch (err) {
    console.error("notifyConnectCommissionInReview_:", err.message);
  }
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

/** Najde řádek záhlaví v listu PROJECTS (často 1. řádek; skript jinak používá HEADER_ROW = 4). */
function findProjectsHeaderRowIndex(data) {
  const maxScan = Math.min(30, data.length);
  for (let r = 0; r < maxScan; r++) {
    const row = data[r];
    if (!row || !row.length) continue;
    const first = String(row[0] || "").trim().toLowerCase();
    if (first === "project_id" || first === "id") return r;
  }
  return HEADER_ROW - 1;
}

function getProjectsSheet_(ss) {
  const candidates = ["📝 PROJECTS", "PROJECTS", "Projects", "projects", "PROJEKTY", "Projekty"];
  for (let i = 0; i < candidates.length; i++) {
    const sh = ss.getSheetByName(candidates[i]);
    if (sh) return sh;
  }
  return null;
}

/** Hodnota buňky jako text (čísla z Sheets, datumy). */
function cellToString_(val) {
  if (val === null || val === undefined) return "";
  if (val instanceof Date)
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return String(val).trim();
}

function getProjects(competitionId, token) {
  const auth = requireAuth(token);
  if (!auth.roles.some(r => ["ADMIN", "KOMISAR", "PROREKTOR", "TESTER", "READONLY"].includes(r)))
    throw new Error("Nedostatečná oprávnění pro seznam projektů Návraty.");

  const ss    = getSpreadsheet(competitionId);
  const sheet = getProjectsSheet_(ss);
  if (!sheet) return { success: false, message: "List PROJECTS nenalezen (zkuste název 📝 PROJECTS nebo PROJECTS)." };
  const data    = sheet.getDataRange().getValues();
  if (!data.length) return { success: true, projects: [] };

  const hdrIdx  = findProjectsHeaderRowIndex(data);
  const headers = data[hdrIdx];
  const COL     = mapColumns(headers);
  const projects = [];
  for (let i = hdrIdx + 1; i < data.length; i++) {
    const row    = data[i];
    const id     = cellToString_(row[findCol(COL, "project_id", "id")]);
    const status = cellToString_(row[findCol(COL, "status")]) || "ACTIVE";
    if (!id) continue;
    if (String(status).toUpperCase() === "INACTIVE") continue;
    projects.push({
      project_id  : id,
      project_name: cellToString_(row[findCol(COL, "project_name", "name", "nazev")]),
      resitel     : cellToString_(row[findCol(COL, "resitel", "řešitel", "solver")]),
      email       : cellToString_(row[findCol(COL, "email", "e_mail", "e-mail", "resitel_email")]),
      soucast     : cellToString_(row[findCol(COL, "soucast", "součást", "faculty")]),
      rozpocet    : cellToString_(row[findCol(COL, "rozpocet", "rozpočet", "budget")]),
      vedni_oblast: cellToString_(row[findCol(COL, "vedni_oblast", "vědní_oblast", "vedna_oblast", "scientific_field")]),
      anotace     : cellToString_(row[findCol(COL, "anotace", "annotation", "abstract")]),
      vystupy     : cellToString_(row[findCol(COL, "vystupy", "výstupy", "outputs", "expected_outputs")]),
      team        : cellToString_(row[findCol(COL, "team", "tým", "resitelsky_tym", "řešitelský_tým")]),
      status,
    });
  }
  return { success: true, projects };
}
function submitNavratyReview(body) {
  const auth = requireAuth(body.token);
  if (!auth.roles.some(r => ["ADMIN", "KOMISAR", "PROREKTOR", "TESTER"].includes(r)))
    throw new Error("Nedostatečná oprávnění pro hodnocení Návraty.");
  const reviewerEmail = auth.email;

  const competitionId = body.competitionId || "uhk_navraty_2026";
  const ss    = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName("⭐ REVIEWS");
  if (!sheet) throw new Error("List '⭐ REVIEWS' nenalezen v Návraty Sheets.");

  // Smaž existující hodnocení stejného hodnotitele pro stejný projekt
  const allData = sheet.getDataRange().getValues();
  const headers = allData[HEADER_ROW - 1];
  const COL     = mapColumns(headers);
  const pidColIdx = findCol(COL, "project_id");
  const revColIdx = findCol(COL, "reviewer_email");

  if (pidColIdx >= 0 && revColIdx >= 0) {
    for (let i = allData.length - 1; i >= HEADER_ROW; i--) {
      const rowPid = String(allData[i][pidColIdx] || "").trim();
      const rowRev = String(allData[i][revColIdx] || "").toLowerCase().trim();
      if (rowPid === body.projectId && rowRev === reviewerEmail.toLowerCase()) {
        sheet.deleteRow(i + 1);
      }
    }
  }

  // Vypočítej skóre
  const s     = body.scores || {};
  const total = ["clarity","quality","budget","profile","outputs"]
    .reduce((sum, k) => sum + (Number(s[k]) || 0), 0);

  // Zapis nové hodnocení – pořadí musí odpovídat záhlaví v REVIEWS listu
  sheet.appendRow([
    Utilities.getUuid(),                        // review_id
    body.projectId || "",                       // project_id
    reviewerEmail,                              // reviewer_email
    fmtDate(new Date()),                        // submitted_at
    Number(s.clarity)  || 0,                   // score_clarity  (K1)
    Number(s.quality)  || 0,                   // score_quality  (K2)
    Number(s.budget)   || 0,                   // score_budget   (K3)
    Number(s.profile)  || 0,                   // score_profile  (K4)
    Number(s.outputs)  || 0,                   // score_outputs  (K5)
    total,                                      // score_total
    body.poradi        || "",                  // poradi
    body.recommendation|| "",                  // recommendation
    (body.comments || {}).public   || "",      // comment_public
    (body.comments || {}).internal || "",      // comment_internal
  ]);

  writeAudit(ss, "NAVRATY_REVIEW", body.projectId || "",
    "", body.recommendation, reviewerEmail + ", " + total + "/25 bodů");

  return { success: true, total, projectId: body.projectId, reviewer: reviewerEmail };
}
function getNavratyReviews(competitionId, projectId, token) {
  requireAuth(token);
  const ss   = getSpreadsheet(competitionId);
  const rows = sheetToObjects(ss.getSheetByName("⭐ REVIEWS"));
  if (projectId) return rows.filter(r => r.project_id === projectId);
  return rows;
}
function getNavratyAllReviews(competitionId, token) {
  const auth = requireAuth(token);
  if (!auth.roles.some(r => ["ADMIN", "KOMISAR", "PROREKTOR", "TESTER", "READONLY"].includes(r)))
    throw new Error("Nedostatečná oprávnění pro přehled hodnocení.");

  const ss   = getSpreadsheet(competitionId);
  const rows = sheetToObjects(ss.getSheetByName("⭐ REVIEWS"));
  return rows;
}

// ============================================================
// SPRÁVA UŽIVATELŮ (globální USERS Sheets)
// ============================================================

function getUsersSheet() {
  return SpreadsheetApp.openById(USERS_SPREADSHEET_ID);
}

/** Načte všechny uživatele + jejich role */
function getUsers(token) {
  requireAuth(token);
  const ss      = getUsersSheet();
  const users   = sheetToObjects(ss.getSheetByName(SHEETS.USERS));
  const roles   = sheetToObjects(ss.getSheetByName(SHEETS.ROLES) || ss.getSheetByName("🎭 ROLES"));

  // Přidej zkratky názvů soutěží
  const compNames = {
    "uhk_connect_2026_v2": "Connect",
    "uhk_navraty_2026":    "Návraty",
    "uhk_rega_2026_v1":    "ReGa",
  };

  const result = users.map(u => {
    const userRoles = roles
      .filter(r => String(r.email||"").toLowerCase() === String(u.email||"").toLowerCase())
      .map(r => ({
        competition_id:    r.competition_id,
        competition_short: compNames[r.competition_id] || r.competition_id,
        role:              r.role,
      }));
    return { ...u, roles: userRoles };
  });

  return { success: true, users: result };
}

/** Načte role konkrétního uživatele */
function getUserRoles(email, token) {
  const ss    = getUsersSheet();
  const roles = sheetToObjects(ss.getSheetByName("🎭 ROLES"));
  const userRoles = roles.filter(r =>
    String(r.email||"").toLowerCase() === String(email||"").toLowerCase()
  );
  return { success: true, roles: userRoles };
}

/** Vytvoří nového uživatele + jeho role */
function createUser(body) {
  requireAuth(body.token);
  const ss         = getUsersSheet();
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  const rolesSheet = ss.getSheetByName("🎭 ROLES");
  if (!usersSheet) throw new Error("List USERS nenalezen.");

  const email = String(body.email||"").toLowerCase().trim();

  // Kontrola duplicity
  const existing = sheetToObjects(usersSheet);
  if (existing.some(u => String(u.email||"").toLowerCase() === email))
    return { success: false, message: "Uživatel s tímto e-mailem již existuje." };

  // Přidej uživatele
  usersSheet.appendRow([
    email,
    body.password || "",
    body.name     || "",
    body.active   || "TRUE",
    fmtDate(new Date()),
    body.note     || "",
  ]);

  // Přidej role
  if (rolesSheet && body.roles && body.roles.length) {
    body.roles.forEach(r => {
      rolesSheet.appendRow([email, r.competition_id, r.role]);
    });
  }

  writeAudit(ss, "USER_CREATED", email, "", body.name, "Vytvořil: " + Session.getActiveUser().getEmail());
  return { success: true, email };
}

/** Aktualizuje existujícího uživatele */
function updateUser(body) {
  requireAuth(body.token);
  const ss         = getUsersSheet();
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  const rolesSheet = ss.getSheetByName("🎭 ROLES");
  if (!usersSheet) throw new Error("List USERS nenalezen.");

  const email = String(body.originalEmail || body.email||"").toLowerCase().trim();
  const data  = usersSheet.getDataRange().getValues();
  const hdrs  = data[HEADER_ROW - 1];
  const COL   = mapColumns(hdrs);
  const eCol  = findCol(COL, "email");

  // Najdi řádek uživatele
  for (let i = HEADER_ROW; i < data.length; i++) {
    if (String(data[i][eCol]||"").toLowerCase().trim() !== email) continue;
    const r = i + 1;
    const set = (names, val) => {
      const c = findCol(COL, ...names);
      if (c >= 0) usersSheet.getRange(r, c+1).setValue(val);
    };
    set(["jméno","jmeno","name"], body.name || data[i][findCol(COL,"jméno","jmeno","name")]);
    if (body.password) set(["password_hash","password"], body.password);
    set(["active"], body.active || "TRUE");
    break;
  }

  // Přepiš role – smaž staré, přidej nové
  if (rolesSheet && body.roles) {
    const rolesData = rolesSheet.getDataRange().getValues();
    for (let i = rolesData.length - 1; i >= HEADER_ROW; i--) {
      if (String(rolesData[i][0]||"").toLowerCase() === email) {
        rolesSheet.deleteRow(i + 1);
      }
    }
    body.roles.forEach(r => {
      rolesSheet.appendRow([email, r.competition_id, r.role]);
    });
  }

  writeAudit(ss, "USER_UPDATED", email, "", body.name, "Upravil: " + Session.getActiveUser().getEmail());
  return { success: true };
}

// ============================================================
// AKTUALIZACE KONFIGURACE SOUTĚŽE
// ============================================================

/** Uloží změny do CONFIG listu příslušné soutěže */
function updateConfig(body) {
  requireAuth(body.token);
  const ss    = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheet) throw new Error("CONFIG list nenalezen pro: " + body.competitionId);

  const data    = sheet.getDataRange().getValues();
  const updates = body.updates || {};

  // Pro každý klíč v updates najdi řádek a aktualizuj hodnotu
  Object.entries(updates).forEach(([key, value]) => {
    let found = false;
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][1]||"").trim() === key) {
        sheet.getRange(i + 1, 3).setValue(value);
        found = true;
        break;
      }
    }
    // Pokud klíč neexistuje, přidej nový řádek
    if (!found && value !== "") {
      sheet.appendRow(["", key, value, ""]);
    }
  });

  writeAudit(ss, "CONFIG_UPDATED", body.competitionId, "",
    Object.keys(updates).join(", "), Session.getActiveUser().getEmail());
  return { success: true };
}

// ============================================================
// AKTUALIZOVANÝ LOGIN – globální USERS + ROLES
// ============================================================

/** Přepíše handleLogin aby používal globální USERS Sheets */
function handleLoginGlobal(email, password) {
  if (!email || !password)
    return { success: false, message: "Zadejte e-mail a heslo." };

  const emailNorm = String(email).toLowerCase().trim();

  // 1. Ověř heslo v globálním USERS Sheets
  let ss;
  try {
    ss = SpreadsheetApp.openById(USERS_SPREADSHEET_ID);
  } catch (e) {
    // Fallback na původní USERS v GLOBAL_SPREADSHEET_ID
    return handleLogin(email, password);
  }

  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (!usersSheet) return handleLogin(email, password); // fallback

  const usersData = usersSheet.getDataRange().getValues();
  const uHdrs     = usersData[HEADER_ROW - 1];
  const UCOL      = mapColumns(uHdrs);

  const eCol = findCol(UCOL, "email");
  const pCol = findCol(UCOL, "password_hash","password","heslo");
  const nCol = findCol(UCOL, "jméno","jmeno","name");
  const aCol = findCol(UCOL, "active","aktivní");

  let foundUser = null;
  for (let i = HEADER_ROW; i < usersData.length; i++) {
    const rowEmail = String(usersData[i][eCol]||"").toLowerCase().trim();
    if (rowEmail !== emailNorm) continue;

    const rowPwd    = String(usersData[i][pCol]||"").trim();
    const rowActive = usersData[i][aCol];
    const rowName   = nCol >= 0 ? String(usersData[i][nCol]||"").trim() : "";

    if (rowPwd !== String(password).trim())
      return { success: false, message: "Nesprávné heslo." };
    if (rowActive === false || String(rowActive).toUpperCase() === "FALSE")
      return { success: false, message: "Účet je deaktivován." };

    foundUser = { email: emailNorm, name: rowName };
    break;
  }

  if (!foundUser)
    return { success: false, message: "Uživatel nebyl nalezen. Zkuste se registrovat." };

  // 2. Načti role z ROLES listu
  const rolesSheet = ss.getSheetByName("🎭 ROLES");
  const rolesData  = rolesSheet ? sheetToObjects(rolesSheet) : [];
  const userRoles  = rolesData
    .filter(r => String(r.email||"").toLowerCase() === emailNorm)
    .map(r => ({ competition_id: r.competition_id, role: String(r.role||"").toUpperCase() }));

  // Pokud nemá žádnou roli → ZADATEL ve všech soutěžích
  const roles = userRoles.length
    ? [...new Set(userRoles.map(r => r.role))]
    : ["ZADATEL"];

  const token = generateToken(emailNorm, roles.join(","));
  writeAudit(ss, "LOGIN_GLOBAL", emailNorm, "", roles.join(","), foundUser.name);

  return {
    success: true, token,
    email:   emailNorm,
    name:    foundUser.name,
    roles,
    rolesByCompetition: userRoles,
  };
}

// ============================================================
// ROZHODNUTÍ PROREKTORA
// ============================================================

function saveProrekorDecision(body) {
  const auth = requireAuth(body.token);
  if (!auth.roles.some(r => ["ADMIN", "PROREKTOR"].includes(r)))
    throw new Error("Rozhodnutí může ukládat pouze prorektor nebo správce.");

  const ss    = getSpreadsheet(body.competitionId || "uhk_navraty_2026");
  const sheet = ss.getSheetByName("⭐ REVIEWS");
  if (!sheet) throw new Error("List REVIEWS nenalezen.");

  const reviewerEmail = auth.email;

  // Smaž existující rozhodnutí prorektora pro tento projekt
  const data    = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1];
  const COL     = mapColumns(headers);
  const pidCol  = findCol(COL, "project_id");
  const intCol  = findCol(COL, "comment_internal");

  for (let i = data.length - 1; i >= HEADER_ROW; i--) {
    const rowPid = String(data[i][pidCol] || "").trim();
    const internal = intCol >= 0 ? String(data[i][intCol] || "").trim() : "";
    if (rowPid === body.projectId && internal === "PROREKTOR_DECISION") {
      sheet.deleteRow(i + 1);
    }
  }

  // Zapis nové rozhodnutí (score = 0, jen recommendation + comment)
  sheet.appendRow([
    Utilities.getUuid(),
    body.projectId    || "",
    reviewerEmail,
    fmtDate(new Date()),
    0, 0, 0, 0, 0,          // K1–K5 = 0 (prorektor neskóruje)
    0,                       // score_total = 0
    "",                      // poradi
    body.decision     || "", // recommendation: FUND / FUND_REDUCED / REJECT
    body.note         || "", // comment_public
    "PROREKTOR_DECISION",    // comment_internal – interní označení
  ]);

  writeAudit(ss, "PROREKTOR_DECISION", body.projectId, "",
    body.decision, reviewerEmail);
  return { success: true };
}

// ============================================================
// PŘIHLÁŠKY – DRAFT A SUBMIT
// ============================================================

/** Uloží nebo aktualizuje draft přihlášky */
function saveDraft(body) {
  const auth = requireAuth(body.token);
  const applicant = String(body.applicantEmail || "").toLowerCase().trim();
  if (!applicant || applicant !== auth.email)
    throw new Error("Draft lze ukládat jen pod vlastním přihlášeným e-mailem.");

  const ss    = getSpreadsheet(body.competitionId);
  let sheet   = ss.getSheetByName("📥 APPLICATIONS");
  if (!sheet) {
    sheet = ss.insertSheet("📥 APPLICATIONS");
    sheet.appendRow(["","","","","","","","","",""]);
    sheet.appendRow(["","","","","","","","","",""]);
    sheet.appendRow(["","","","","","","","","",""]);
    sheet.appendRow(["application_id","competition_id","applicant_email","applicant_name",
      "status","created_at","updated_at","form_data_json","submitted_at","note"]);
  }

  const data   = sheet.getDataRange().getValues();
  const hdrs   = data[HEADER_ROW - 1];
  const COL    = mapColumns(hdrs);
  const eCol   = findCol(COL, "applicant_email", "email_zadatele", "email");
  const sCol   = findCol(COL, "status", "stav");
  const fCol   = findCol(COL, "form_data_json", "form_data", "data_json", "json_data", "formdata", "prihlaska_json");
  const uCol   = findCol(COL, "updated_at", "upraveno");
  if (eCol < 0 || sCol < 0 || fCol < 0)
    throw new Error("List APPLICATIONS: chybí sloupce applicant_email, status nebo form_data_json (záhlaví na řádku " + HEADER_ROW + ").");

  // Hledej existující draft
  for (let i = HEADER_ROW; i < data.length; i++) {
    const rowEmail  = String(data[i][eCol] || "").toLowerCase();
    const rowStatus = String(data[i][sCol] || "").toUpperCase();
    if (rowEmail === body.applicantEmail?.toLowerCase() && rowStatus === "DRAFT") {
      // Aktualizuj existující řádek
      sheet.getRange(i + 1, fCol + 1).setValue(JSON.stringify(body.formData || {}));
      sheet.getRange(i + 1, uCol + 1).setValue(fmtDate(new Date()));
      return { success: true, draftId: data[i][0] };
    }
  }

  // Vytvoř nový draft
  const newId = "APP-" + Utilities.formatDate(new Date(), "Europe/Prague", "yyMMdd") + "-" +
    Utilities.getUuid().substring(0, 5).toUpperCase();
  var fd = body.formData || {};
  appendApplicationsRowFromMap(sheet, {
    application_id: newId,
    competition_id: body.competitionId,
    applicant_email: body.applicantEmail || "",
    applicant_name: body.applicantName || "",
    status: "DRAFT",
    created_at: fmtDate(new Date()),
    updated_at: fmtDate(new Date()),
    form_data_json: JSON.stringify(fd),
    submitted_at: "",
    note: "",
    project_title: fd.project_title ? String(fd.project_title) : "",
  });
  return { success: true, draftId: newId };
}

/** Načte draft přihlášky pro žadatele */
function getDraft(competitionId, applicantEmail, token) {
  const auth = requireAuth(token);
  const applicant = String(applicantEmail || "").toLowerCase().trim();
  if (!applicant || applicant !== auth.email)
    throw new Error("Draft lze načíst jen pro vlastní e-mail.");

  const ss    = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName("📥 APPLICATIONS");
  if (!sheet) return { success: true, draft: null };

  const rows = sheetToObjects(sheet);
  const draft = rows.find(r =>
    String(r.applicant_email || "").toLowerCase() === String(applicantEmail || "").toLowerCase() &&
    String(r.status || "").toUpperCase() === "DRAFT"
  );
  if (!draft) return { success: true, draft: null };

  // JSON dat formuláře (správně ve form_data_json; fallback kvůli starým řádkům zapsaným do špatného sloupce)
  var rawJson = String(draft.form_data_json || draft.form_data || "").trim();
  if (!rawJson || rawJson === "{}") {
    ["coordinator_email", "project_title", "project", "note", "internal_notes"].forEach(function (k) {
      if (rawJson && rawJson !== "{}") return;
      var v = String(draft[k] || "").trim();
      if (v.charAt(0) === "{") rawJson = v;
    });
  }
  try {
    draft.formData = JSON.parse(rawJson || "{}");
  } catch (e) {
    draft.formData = {};
  }
  // Frontend očekává draft.id (v listu je application_id)
  draft.id = draft.application_id || draft.id;
  return { success: true, draft };
}

/** Finálně podá přihlášku (DRAFT → SUBMITTED) – Connect / ReGa (JSON ve form_data_json) */
function submitApplication(body) {
  const auth = requireAuth(body.token);
  const applicant = String(body.applicantEmail || "").toLowerCase().trim();
  if (!applicant || applicant !== auth.email)
    throw new Error("Přihlášku můžete odeslat jen za svůj účet.");

  const ss    = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName("📥 APPLICATIONS");
  if (!sheet) throw new Error("APPLICATIONS list nenalezen.");

  const data  = sheet.getDataRange().getValues();
  const hdrs  = data[HEADER_ROW - 1];
  const COL   = mapColumns(hdrs);
  const eCol  = findCol(COL, "applicant_email", "email_zadatele", "email");
  const sCol  = findCol(COL, "status", "stav");
  const fCol  = findCol(COL, "form_data_json", "form_data", "data_json", "json_data", "formdata", "prihlaska_json");
  const subCol= findCol(COL, "submitted_at", "datum_podani");
  if (eCol < 0 || sCol < 0 || fCol < 0)
    throw new Error("List APPLICATIONS: chybí potřebná záhlaví (applicant_email, status, form_data_json).");

  for (let i = HEADER_ROW; i < data.length; i++) {
    const rowEmail  = String(data[i][eCol] || "").toLowerCase();
    const rowStatus = String(data[i][sCol] || "").toUpperCase();
    if (rowEmail === body.applicantEmail?.toLowerCase() && rowStatus === "DRAFT") {
      sheet.getRange(i + 1, sCol + 1).setValue("SUBMITTED");
      sheet.getRange(i + 1, fCol + 1).setValue(JSON.stringify(body.formData || {}));
      sheet.getRange(i + 1, subCol + 1).setValue(fmtDate(new Date()));
      writeAudit(ss, "APPLICATION_SUBMITTED", data[i][0], "DRAFT", "SUBMITTED", body.applicantEmail);

      // Odešli email koordinátorce
      try {
        const cfg = getConfigMap(ss);
        const coordEmail = cfg["coordinator_email"] || cfg["admin_email"];
        if (coordEmail) {
          GmailApp.sendEmail(coordEmail,
            "[UHK Granty] Nová přihláška: " + (body.formData?.project_title || data[i][0]),
            "Byla podána nová přihláška do soutěže " + body.competitionId + ".\n\n" +
            "Žadatel: " + body.applicantName + " (" + body.applicantEmail + ")\n" +
            "Projekt: " + (body.formData?.project_title || "—") + "\n\n" +
            "Přihlaste se do systému pro zobrazení detailu."
          );
        }
      } catch(e) { console.error("Email error:", e.message); }
      return { success: true };
    }
  }

  // Pokud neexistuje draft, vytvoř a rovnou SUBMITTED
  const newId = "APP-" + Utilities.formatDate(new Date(), "Europe/Prague", "yyMMdd") + "-" +
    Utilities.getUuid().substring(0, 5).toUpperCase();
  const now = fmtDate(new Date());
  var fd2 = body.formData || {};
  appendApplicationsRowFromMap(sheet, {
    application_id: newId,
    competition_id: body.competitionId,
    applicant_email: body.applicantEmail || "",
    applicant_name: body.applicantName || "",
    status: "SUBMITTED",
    created_at: now,
    updated_at: now,
    form_data_json: JSON.stringify(fd2),
    submitted_at: now,
    note: "",
    project_title: fd2.project_title ? String(fd2.project_title) : "",
  });
  return { success: true };
}

/** Helper: načte CONFIG jako mapu klíč→hodnota */
function getConfigMap(ss) {
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const map  = {};
  for (let i = HEADER_ROW; i < data.length; i++) {
    const key = String(data[i][1] || "").trim();
    const val = String(data[i][2] || "").trim();
    if (key) map[key] = val;
  }
  return map;
}
