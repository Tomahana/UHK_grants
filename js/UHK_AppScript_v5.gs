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
 *
 *  Přílohy Connect (část 2): účet „Execute as“ webové aplikace musí mít právo
 *  přidávat soubory do složky CONNECT_POSTAWARD_ATTACHMENTS_FOLDER_ID (Google Disk).
 *
 *  Archiv PDF (podání / hodnocení+prorektor / uzavření Connect): v listu CONFIG klíč
 *  archive_drive_folder_id = ID složky na Disku pro danou soutěž (jinak u Connect fallback
 *  na CONNECT_POSTAWARD_ATTACHMENTS_FOLDER_ID). Po nasazení kódu s DocumentApp může být
 *  potřeba znovu autorizovat skript (rozsah Dokumenty Google + Disk).
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

/** Složka Google Disk pro přílohy Connect (část 2). Účet „Execute as“ webové aplikace musí mít v ní právo přidávat soubory. */
const CONNECT_POSTAWARD_ATTACHMENTS_FOLDER_ID = "1oJ7qujZhIBygFYgiN5Im7fmpKbeADDDi";

/**
 * Archiv PDF podání / hodnocení / uzavření do složky soutěže na Disku.
 * V listu CONFIG nastavte archive_drive_folder_id na ID cílové složky (Google Disk).
 * Pokud klíč chybí, u soutěže CONNECT se použije CONNECT_POSTAWARD_ATTACHMENTS_FOLDER_ID.
 * Školní e-mail žadatele je v dokumentech uveden jako stabilní identifikátor pro analytiku napříč roky.
 */
var UHK_ARCHIVE_MAX_PLAIN_CHARS = 95000;
var UHK_ARCHIVE_MAX_ZZ_IN_PDF = 14000;

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
      case "getConnectFundingSummary":
        return corsResponse(getConnectFundingSummary(p.competitionId, p.token));
      case "getConnectMyApplications":
        return corsResponse(getConnectMyApplications(p.competitionId, p.token));
      case "getConnectPostAward":
        return corsResponse(getConnectPostAward(p.competitionId, p.applicationId || p.app, p.token));
      case "getConnectDeliverablesExport":
        return corsResponse(getConnectDeliverablesExport(p.competitionId, p.token));
      case "getProjects":      return corsResponse(getProjects(p.competitionId, p.token));
      case "getUsers":         return corsResponse(getUsers(p.token));
      case "getUserRoles":     return corsResponse(getUserRoles(p.email, p.token));
      case "getNavratyReviews": return corsResponse(getNavratyAllReviews(p.competitionId, p.token));
      case "getDraft":
        return corsResponse(
          getDraft(p.competitionId, p.applicantEmail, p.token, p.applicationId || p.app || "")
        );
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
      case "saveConnectPostAward":
        return corsResponse(saveConnectPostAward(body));
      case "uploadConnectPostAwardAttachment":
        return corsResponse(uploadConnectPostAwardAttachment(body));
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
    /** Platnost přihlášení (server) – sladěno s auth.js (session). */
    var TOKEN_MAX_AGE_MS = 24 * 3600 * 1000;
    if (age > TOKEN_MAX_AGE_MS) return { valid: false, reason: "Token vypršel." };

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

/** Porovnání role z tokenu s povoleným seznamem (bez závislosti na velikosti písmen / mezerách). */
function authHasAnyRole_(auth, allowedRoles) {
  const want = {};
  (allowedRoles || []).forEach(function (x) {
    want[String(x).trim().toUpperCase()] = true;
  });
  return (auth.roles || []).some(function (r) {
    return want[String(r).trim().toUpperCase()];
  });
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

/** Částka z CONFIG (mezerami oddělené tisíce, NBSP, čárka jako desetinný oddělovač). */
function parseConfigNumberCzk_(val) {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isFinite(val) ? val : 0;
  var s = String(val)
    .replace(/\u00a0/g, "")
    .replace(/\s/g, "")
    .replace(/,/g, ".");
  var n = Number(s);
  return isFinite(n) ? n : 0;
}

/** Celková alokace výzvy z CONFIG – více možných klíčů + heuristika podle názvu řádku. */
function readTotalAllocationCzkFromCfg_(cfg) {
  if (!cfg || typeof cfg !== "object") return 0;
  var keys = [
    "total_allocation_czk",
    "total_allocation",
    "allocation_total_czk",
    "connect_total_allocation_czk",
    "celkova_alokace_czk",
    "celkova_alokace",
  ];
  var i, v, n;
  for (i = 0; i < keys.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(cfg, keys[i])) continue;
    v = cfg[keys[i]];
    if (v === undefined || v === null || v === "") continue;
    n = parseConfigNumberCzk_(v);
    if (n > 0) return n;
  }
  var k, lk;
  for (k in cfg) {
    if (!Object.prototype.hasOwnProperty.call(cfg, k)) continue;
    lk = String(k).toLowerCase().replace(/\s+/g, "_");
    if (lk.indexOf("alok") >= 0 && (lk.indexOf("celk") >= 0 || lk.indexOf("total") >= 0)) {
      n = parseConfigNumberCzk_(cfg[k]);
      if (n > 0) return n;
    }
  }
  return 0;
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
      if (appSheet) {
        var arows = sheetToObjects(appSheet).map(applicationsSheetRowNormalize_);
        appCount = arows.filter(function (r) {
          var id = String(r.application_id || "").trim();
          if (!id) return false;
          var st = String(r.status || "").toUpperCase().trim();
          return st !== "DRAFT";
        }).length;
      }

      var cfgType = cfg["competition_type"] || "UHK_CONNECT";
      if (
        appCount === 0 &&
        (cfgType === "OP_JAK_NAVRATY" || compId === "uhk_navraty_2026")
      ) {
        var ps = getProjectsSheet_(ss);
        if (ps) {
          var pdata = ps.getDataRange().getValues();
          if (pdata.length) {
            var hix = findProjectsHeaderRowIndex(pdata);
            var PCOL = mapColumns(pdata[hix]);
            for (var pi = hix + 1; pi < pdata.length; pi++) {
              var prow = pdata[pi];
              var pidx = findCol(PCOL, "project_id", "id");
              if (pidx < 0) continue;
              var pid = cellToString_(prow[pidx]);
              var pstCi = findCol(PCOL, "status");
              var pst =
                pstCi >= 0 ? cellToString_(prow[pstCi]) || "ACTIVE" : "ACTIVE";
              if (!pid) continue;
              if (String(pst).toUpperCase() === "INACTIVE") continue;
              appCount++;
            }
          }
        }
      }

      result.push({
        id:                compId,
        name:              cfg["competition_name"]      || compId,
        type:              cfg["competition_type"]      || "UHK_CONNECT",
        status:            cfg["status"]                || "DRAFT",
        description:       cfg["description"]           || "",
        deadline:          cfg["deadline_applications"] || "",
        allocation:        readTotalAllocationCzkFromCfg_(cfg),
        maxBudget:         parseConfigNumberCzk_(cfg["max_budget_czk"]),
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
    var out = applicationsSheetRowNormalize_(r);
    delete out.__subAtFromStatusCol;
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

/** Známé kódy stavu v listu APPLICATIONS. */
var CONNECT_WORKFLOW_STATUS_CODES_ = {
  DRAFT: true,
  SUBMITTED: true,
  FORMAL_CHECK: true,
  TO_REVIEW: true,
  IN_REVIEW: true,
  APPROVED: true,
  REJECTED: true,
  WITHDRAWN: true,
};

/** Buněka obsahuje datum (Sheets Date / výchozí řetězec z JS Date), ne text IN_REVIEW atd. */
function isLikelyGoogleDateOrMisplacedValue_(val) {
  if (val instanceof Date && !isNaN(val.getTime())) return true;
  var s = String(val).trim();
  if (!s) return false;
  if (/GMT[+-]\d{4}/.test(s)) return true;
  if (/^[A-Z]{3},\s+[A-Z]{3}\s+\d{1,2}\s+\d{4}/i.test(s)) return true;
  return false;
}

/**
 * Hodnota ze sloupce stav/status. Nejdřív „stav“ (častěji text), pak „status“;
 * přeskakuje buňky s datem (prohozený sloupec / formát Google Sheets).
 */
function readRawApplicationStatusCell_(row) {
  var preferred = ["stav", "Stav", "STAV", "status", "Status", "application_status", "stav_prihlasky"];
  var i, k, v;
  for (i = 0; i < preferred.length; i++) {
    k = preferred[i];
    if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
    v = row[k];
    if (v === undefined || v === null || v === "") continue;
    if (!isLikelyGoogleDateOrMisplacedValue_(v)) return v;
  }
  for (k in row) {
    if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
    var kn = String(k)
      .trim()
      .toLowerCase()
      .replace(/[áä]/g, "a");
    if (kn === "status" || kn === "stav") {
      v = row[k];
      if (v === undefined || v === null || v === "") continue;
      if (!isLikelyGoogleDateOrMisplacedValue_(v)) return v;
    }
  }
  for (k in row) {
    if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
    var kn2 = String(k)
      .trim()
      .toLowerCase()
      .replace(/[áä]/g, "a");
    if (kn2 === "status" || kn2 === "stav") {
      v = row[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
  }
  return null;
}

function rowHasTimestampLikeSubmitted_(row) {
  var preferred = ["submitted_at", "datum_podani", "Datum podání", "datum podani", "Datum podani"];
  var i, k, v;
  for (i = 0; i < preferred.length; i++) {
    k = preferred[i];
    if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
    v = row[k];
    if (v !== undefined && v !== null && v !== "") return true;
  }
  for (k in row) {
    if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
    var kn = String(k)
      .toLowerCase()
      .replace(/[áä]/g, "a")
      .replace(/\s+/g, "_");
    if (
      kn.indexOf("submitted") !== -1 ||
      kn === "datum_podani" ||
      kn.indexOf("podani") !== -1 ||
      kn.indexOf("odeslano") !== -1
    ) {
      v = row[k];
      if (v !== undefined && v !== null && v !== "") return true;
    }
  }
  return false;
}

/** První neprázdná hodnota sloupce data podání (různé názvy záhlaví). */
function readSubmittedAtCell_(row) {
  var preferred = ["submitted_at", "datum_podani", "Datum podání", "datum podani", "Datum podani"];
  var i, k, v;
  for (i = 0; i < preferred.length; i++) {
    k = preferred[i];
    if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
    v = row[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  for (k in row) {
    if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
    var kn = String(k)
      .toLowerCase()
      .replace(/[áä]/g, "a")
      .replace(/\s+/g, "_");
    if (
      kn.indexOf("submitted") !== -1 ||
      kn === "datum_podani" ||
      (kn.indexOf("datum") !== -1 && kn.indexOf("podani") !== -1)
    ) {
      v = row[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
  }
  return null;
}

/**
 * Textový kód workflow (DRAFT, SUBMITTED, …). Ošetří Date v „stav“ i prohozené sloupce.
 */
function normalizeApplicationWorkflowStatus_(row) {
  var raw = readRawApplicationStatusCell_(row);
  if (raw !== null && !isLikelyGoogleDateOrMisplacedValue_(raw)) {
    var u = String(raw)
      .trim()
      .toUpperCase();
    if (CONNECT_WORKFLOW_STATUS_CODES_[u]) return u;
  }
  if (rowHasTimestampLikeSubmitted_(row)) return "SUBMITTED";
  if (raw !== null && isLikelyGoogleDateOrMisplacedValue_(raw)) return "SUBMITTED";
  return "DRAFT";
}

/** Stav průběhu pro žadatele (Connect). */
function connectApplicantWorkflowLabel_(status, hasProrektorOutcome) {
  var st = String(status || "").toUpperCase();
  if (st === "DRAFT") return "Koncept – neodesláno";
  if (st === "SUBMITTED") return "Podáno";
  if (st === "FORMAL_CHECK") return "Formální kontrola";
  if (st === "TO_REVIEW") return "Po formální kontrole";
  if (st === "IN_REVIEW") return "V hodnocení komise";
  if (st === "APPROVED")
    return hasProrektorOutcome ? "Rozhodnutí zapsáno" : "Schváleno – doplní se stanovisko prorektora";
  if (st === "REJECTED")
    return hasProrektorOutcome ? "Rozhodnutí zapsáno" : "Zamítnuto";
  if (st === "WITHDRAWN") return "Staženo";
  return "—";
}

/** Výsledek pro žadatele (jen po zápisu prorektora). */
function connectApplicantResultLabel_(outcome) {
  if (!outcome || !outcome.decision) return "—";
  var d = String(outcome.decision).toUpperCase();
  if (d === "SUPPORT") return "Podpořeno";
  if (d === "CUT") return "Kráceno";
  if (d === "REJECT") return "Nepodpořeno";
  return "—";
}

/**
 * Jednotný řádek z listu APPLICATIONS: e-mail, form_data_json (včetně JSONu ve špatném sloupci),
 * normální status, volitelně datum z buňky stav (pro podání).
 */
function applicationsSheetRowNormalize_(r) {
  var em =
    r.applicant_email ||
    r.applicantEmail ||
    r["Applicant email"] ||
    r["E-mail žadatele"] ||
    r.email ||
    "";
  var out = {};
  for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) out[k] = r[k];
  out.applicant_email = String(em).trim();
  var fd = String(r.form_data_json || r.form_data || "").trim();
  if (!fd || fd === "{}") {
    var wrongCol = String(r.coordinator_email || r.project_title || "").trim();
    if (wrongCol.charAt(0) === "{") fd = wrongCol;
  }
  out.form_data_json = fd;
  var subAtFromStatusCol = null;
  ["status", "Status", "stav", "Stav", "STAV"].forEach(function (key) {
    if (!Object.prototype.hasOwnProperty.call(r, key)) return;
    var val = r[key];
    if (val !== undefined && val !== null && val !== "" && isLikelyGoogleDateOrMisplacedValue_(val))
      subAtFromStatusCol = val;
  });
  out.__subAtFromStatusCol = subAtFromStatusCol;
  out.status = normalizeApplicationWorkflowStatus_(out);
  return out;
}

/** Verze textů pravidel (změna = řešitel může znovu potvrdit seznámení). */
var CONNECT_POSTAWARD_RULES_VERSION = "2026-04-07";

/** Položky rozpočtu Connect (shodné s formulářem přihlášky). */
var CONNECT_BUDGET_LINE_KEYS = [
  "budget_travel",
  "budget_accommodation",
  "budget_meals",
  "budget_local",
  "budget_fee",
  "budget_publication",
  "budget_personnel",
];

var CONNECT_BUDGET_LINE_LABELS = {
  budget_travel: "Jízdné",
  budget_accommodation: "Ubytování",
  budget_meals: "Stravné",
  budget_local: "Místní doprava",
  budget_fee: "Poplatek (konference / workshop)",
  budget_publication: "Publikační náklady",
  budget_personnel: "Osobní náklady (DPP)",
};

/**
 * Klíče polí přihlášky Connect – pokud v JSON chybí nebo je prázdný, doplní se z pojmenovaných sloupců
 * na listu APPLICATIONS (ruční úpravy, import, starší zápis).
 */
var CONNECT_APPLICATION_FORM_MERGE_KEYS = [
  "project_title",
  "faculty",
  "department",
  "applicant_type",
  "phd_year",
  "research_focus",
  "recent_outputs",
  "activity_type",
  "activity_goal",
  "partner_institution",
  "partner_country",
  "partner_contact",
  "cooperation_history",
  "activity_start",
  "activity_end",
  "expected_output",
  "output_description",
  "output_impact",
  "budget_travel",
  "budget_accommodation",
  "budget_meals",
  "budget_local",
  "budget_fee",
  "budget_publication",
  "budget_personnel",
  "budget_total",
  "budget_justification",
  "attach_invitation",
  "declaration",
];

function connectFormFieldEmpty_(v) {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && String(v).trim() === "") return true;
  return false;
}

/** Doplní fd hodnotami ze stejnojmenných sloupců řádku (jen kde je ve fd mezera). */
function connectMergeApplicationRowIntoFormData_(row, fd) {
  if (!row || !fd || typeof fd !== "object") return fd;
  CONNECT_APPLICATION_FORM_MERGE_KEYS.forEach(function (k) {
    if (!Object.prototype.hasOwnProperty.call(row, k)) return;
    var cell = row[k];
    if (connectFormFieldEmpty_(cell)) return;
    if (connectFormFieldEmpty_(fd[k])) fd[k] = cell;
  });
  if (connectFormFieldEmpty_(fd.project_title) && row.project_title != null) {
    var pt = String(row.project_title).trim();
    if (pt && pt.charAt(0) !== "{") fd.project_title = pt;
  }
  if (connectFormFieldEmpty_(fd.output_description) && !connectFormFieldEmpty_(fd.expected_output))
    fd.output_description = String(fd.expected_output);
  if (
    connectFormFieldEmpty_(fd.output_description) &&
    row.expected_output != null &&
    !connectFormFieldEmpty_(row.expected_output)
  )
    fd.output_description = String(row.expected_output);
  return fd;
}

function connectSumBudgetLinesObj_(lines) {
  if (!lines || typeof lines !== "object") return 0;
  var s = 0;
  CONNECT_BUDGET_LINE_KEYS.forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(lines, k))
      s += Math.max(0, Math.round(Number(lines[k]) || 0));
  });
  return s;
}

function connectParseProrektorBudgetLinesJson_(r) {
  if (!r || r.prorektor_budget_lines_json == null || !String(r.prorektor_budget_lines_json).trim())
    return null;
  try {
    var o = JSON.parse(String(r.prorektor_budget_lines_json));
    return o && typeof o === "object" ? o : null;
  } catch (e) {
    return null;
  }
}

/** Schválené řádky: z JSON prorektora, jinak odvození z žádosti / poměrné krácení. */
function connectResolveOfficialBudgetLines_(outcome, fd) {
  var parsed =
    outcome && outcome.budget_lines && typeof outcome.budget_lines === "object"
      ? outcome.budget_lines
      : null;
  if (parsed && connectSumBudgetLinesObj_(parsed) > 0) return parsed;
  var dec = outcome && outcome.decision ? String(outcome.decision).toUpperCase() : "";
  var sup = outcome && outcome.supported_amount_czk ? Number(outcome.supported_amount_czk) : 0;
  if (dec === "SUPPORT") {
    var o = {};
    CONNECT_BUDGET_LINE_KEYS.forEach(function (k) {
      var n = Math.round(Number(fd[k]) || 0);
      if (n > 0) o[k] = n;
    });
    return o;
  }
  if (dec === "CUT" && sup > 0) return connectProportionalCutLinesFromForm_(fd, sup);
  var o2 = {};
  CONNECT_BUDGET_LINE_KEYS.forEach(function (k) {
    var n = Math.round(Number(fd[k]) || 0);
    if (n > 0) o2[k] = n;
  });
  return o2;
}

/** Poměrné rozdělení kráceného celku podle položek žádosti (záloha, pokud chybí detail od prorektora). */
function connectProportionalCutLinesFromForm_(fd, supportedTotal) {
  var requested = {};
  var reqSum = 0;
  CONNECT_BUDGET_LINE_KEYS.forEach(function (k) {
    var n = Math.max(0, Math.round(Number(fd[k]) || 0));
    if (n > 0) {
      requested[k] = n;
      reqSum += n;
    }
  });
  var target = Math.round(Number(supportedTotal) || 0);
  if (reqSum <= 0 || target <= 0) return {};
  var keys = Object.keys(requested);
  var o = {};
  var remaining = target;
  keys.forEach(function (k, i) {
    if (i === keys.length - 1) {
      o[k] = Math.max(0, Math.min(requested[k], remaining));
      return;
    }
    var v = Math.floor((requested[k] * target) / reqSum);
    v = Math.max(0, Math.min(v, requested[k], remaining));
    o[k] = v;
    remaining -= v;
  });
  return o;
}

/** Normalizace vstupu od prorektora: jen známé klíče, ≤ žádost, nezáporné. */
function connectNormalizeProrektorBudgetLines_(input, fd, isCut) {
  var out = {};
  CONNECT_BUDGET_LINE_KEYS.forEach(function (k) {
    var req = Math.max(0, Math.round(Number(fd[k]) || 0));
    if (req <= 0) return;
    if (isCut) {
      var v = input && Object.prototype.hasOwnProperty.call(input, k) ? Number(input[k]) : NaN;
      if (!isFinite(v)) v = 0;
      v = Math.round(Math.max(0, Math.min(v, req)));
      out[k] = v;
    } else {
      out[k] = req;
    }
  });
  return out;
}

function connectBudgetRowsForApi_(fd, officialLines) {
  var rows = [];
  var sumAppr = 0;
  CONNECT_BUDGET_LINE_KEYS.forEach(function (k) {
    var req = Math.max(0, Math.round(Number(fd[k]) || 0));
    var appr = officialLines && officialLines[k] != null ? Math.round(Number(officialLines[k]) || 0) : 0;
    if (req <= 0 && appr <= 0) return;
    sumAppr += appr;
    rows.push({
      key: k,
      label: CONNECT_BUDGET_LINE_LABELS[k] || k,
      requested: req,
      approved: appr,
    });
  });
  var reqT = Number(fd.budget_total) || 0;
  if (reqT > 0 || sumAppr > 0 || rows.length)
    rows.push({
      key: "budget_total",
      label: "Celkem",
      requested: reqT,
      approved: sumAppr > 0 ? sumAppr : reqT,
    });
  return rows;
}

/** Nejpozdější termín odevzdání dle výzvy (30. 11. 2026 konec dne, lokální TZ skriptu). */
function connectPostAwardHardCapDate_() {
  return new Date(2026, 10, 30, 23, 59, 59);
}

/** JSON z přihlášky (form_data_json + fallback buňky + sloupce stejné jako klíče formuláře). */
function connectParseFormDataObject_(row) {
  if (!row) return {};
  var raw = String(row.form_data_json || row.form_data || "").trim();
  if (!raw || raw === "{}") {
    var w = String(row.coordinator_email || row.project_title || "").trim();
    if (w.charAt(0) === "{") raw = w;
  }
  if (!raw || raw === "{}") {
    var n = String(row.note || "").trim();
    if (n.charAt(0) === "{") raw = n;
  }
  var fd = {};
  try {
    fd = JSON.parse(raw || "{}");
  } catch (e) {
    fd = {};
  }
  if (!fd || typeof fd !== "object") fd = {};
  connectMergeApplicationRowIntoFormData_(row, fd);
  return fd;
}

/** Datum ukončení aktivity z přihlášky (YYYY-MM-DD) nebo "". */
function connectActivityEndIsoFromRow_(row) {
  var fd = connectParseFormDataObject_(row);
  var v = fd.activity_end != null ? String(fd.activity_end).trim() : "";
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return "";
}

/** +30 kalendářních dnů od activity_end, omezeno shora datem 30. 11. 2026. */
function connectComputeReportDeadline_(activityEndIso) {
  var cap = connectPostAwardHardCapDate_();
  var capLabel = Utilities.formatDate(cap, Session.getScriptTimeZone(), "d. M. yyyy");
  if (!activityEndIso || !/^\d{4}-\d{2}-\d{2}$/.test(activityEndIso)) {
    return {
      hasActivityEnd: false,
      due: cap,
      dueLabel: capLabel,
      hardCapLabel: capLabel,
      explanation:
        "V přihlášce není platné datum ukončení aktivity – pro přesný výpočet „+30 dnů“ jej doplňte u koordinátorky. Do nejpozději " +
        capLabel +
        " musí být povinnosti splněny dle výzvy.",
    };
  }
  var p = activityEndIso.split("-");
  var y = Number(p[0]);
  var mo = Number(p[1]);
  var d = Number(p[2]);
  var start = new Date(y, mo - 1, d, 12, 0, 0);
  var plus30 = new Date(start.getTime());
  plus30.setDate(plus30.getDate() + 30);
  var due = plus30.getTime() <= cap.getTime() ? plus30 : cap;
  return {
    hasActivityEnd: true,
    activityEndLabel: Utilities.formatDate(start, Session.getScriptTimeZone(), "d. M. yyyy"),
    due: due,
    dueLabel: Utilities.formatDate(due, Session.getScriptTimeZone(), "d. M. yyyy"),
    hardCapLabel: capLabel,
    explanation:
      "Lhůta pro odevzdání závěrečné zprávy a doložení výstupů e-mailem administrátorce soutěže je kratší z: (a) 30 kalendářních dnů od ukončení podporované aktivity dle přihlášky, (b) nejpozději " +
      capLabel +
      " (dle výzvy).",
  };
}

function connectPostawardJsonColIndex_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < HEADER_ROW) return -1;
  var COL = mapColumns(data[HEADER_ROW - 1]);
  var c = findCol(COL, "connect_postaward_json", "postaward_json", "povinne_vystupy_json");
  return c;
}

/** Zajistí sloupec connect_postaward_json v záhlaví; vrátí 0-based index nebo -1. */
function ensureConnectPostawardColumn_(sheet) {
  var c = connectPostawardJsonColIndex_(sheet);
  if (c >= 0) return c;
  var last = sheet.getLastColumn();
  sheet.getRange(HEADER_ROW, last + 1).setValue("connect_postaward_json");
  return sheet.getLastColumn() - 1;
}

function readConnectPostawardChecklist_(row) {
  var raw = row.connect_postaward_json || row.postaward_json || row.povinne_vystupy_json || "";
  if (!raw || !String(raw).trim()) return {};
  try {
    var o = JSON.parse(String(raw));
    return o && typeof o === "object" ? o : {};
  } catch (e) {
    return {};
  }
}

function findApplicationsSheetRowNumber_(sheet, applicationId) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= HEADER_ROW) return -1;
  var COL = mapColumns(data[HEADER_ROW - 1]);
  var idCol = findCol(COL, "application_id", "id", "app_id");
  if (idCol < 0) return -1;
  var aid = String(applicationId || "").trim();
  for (var i = HEADER_ROW; i < data.length; i++) {
    if (String(data[i][idCol] || "").trim() === aid) return i + 1;
  }
  return -1;
}

function connectPostAwardPrivileged_(auth) {
  var rolesU = (auth.roles || []).map(function (x) {
    return String(x).trim().toUpperCase();
  });
  return rolesU.some(function (role) {
    return (
      ["ADMIN", "TESTER", "PROREKTOR", "KOMISAR", "KOMISAŘ", "READONLY"].indexOf(role) >= 0
    );
  });
}

/**
 * Přehled pravidel a checklistu po rozhodnutí Podpořeno / Kráceno (Connect).
 */
function getConnectPostAward(competitionId, applicationId, token) {
  if (!competitionId) throw new Error("chybí competitionId");
  var aid = String(applicationId || "").trim();
  if (!aid) throw new Error("chybí applicationId");

  var auth = requireAuth(token);
  var ss = getSpreadsheet(competitionId);
  var sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) throw new Error("List APPLICATIONS nenalezen.");

  var rows = sheetToObjects(sheet).map(applicationsSheetRowNormalize_);
  var row = rows.find(function (r) {
    return String(r.application_id || "").trim() === aid;
  });
  if (!row) throw new Error("Přihláška nenalezena.");

  var owner = String(row.applicant_email || "").toLowerCase().trim() === String(auth.email || "").toLowerCase().trim();
  var priv = connectPostAwardPrivileged_(auth);
  if (!owner && !priv) throw new Error("K této přihlášce nemáte přístup.");

  var outcome = findProrektorOutcomeForApp_(ss, aid);
  var dec = outcome && outcome.decision ? String(outcome.decision).toUpperCase() : "";
  if (dec !== "SUPPORT" && dec !== "CUT") {
    return {
      success: true,
      applicable: false,
      reason: "Povinné výstupy se vztahují jen na projekty s rozhodnutím Podpořeno nebo Kráceno.",
    };
  }

  var cfg = getConfigMap(ss);
  var coord =
    cfg["coordinator_email"] ||
    cfg["connect_coordinator_email"] ||
    cfg["admin_email"] ||
    ADMIN_EMAIL ||
    "";

  var actIso = connectActivityEndIsoFromRow_(row);
  var deadline = connectComputeReportDeadline_(actIso);
  var checklist = readConnectPostawardChecklist_(row);
  var fd = connectParseFormDataObject_(row);
  var budgetRequested = Number(fd.budget_total) || 0;
  var budgetOfficial = connectEffectiveSupportedCzk_(outcome, budgetRequested);
  var officialLines = connectResolveOfficialBudgetLines_(outcome, fd);
  var budgetRows = connectBudgetRowsForApi_(fd, officialLines);
  var promisedSummary = {
    project_title: String(fd.project_title || applicationRowTitle_(row) || "").slice(0, 500),
    activity_goal: String(fd.activity_goal || "").slice(0, 2000),
    output_description: String(fd.output_description || fd.expected_output || "").slice(0, 2000),
    budget_justification: String(fd.budget_justification || "").slice(0, 3000),
  };

  return {
    success: true,
    applicable: true,
    rulesVersion: CONNECT_POSTAWARD_RULES_VERSION,
    applicationId: aid,
    attachmentsDriveFolderUrl:
      "https://drive.google.com/drive/folders/" + CONNECT_POSTAWARD_ATTACHMENTS_FOLDER_ID,
    projectTitle: applicationRowTitle_(row),
    outcomeDecision: dec,
    outcomeLabel: dec === "SUPPORT" ? "Podpořeno" : "Kráceno",
    outcomeComment: outcome && outcome.comment ? String(outcome.comment) : "",
    budgetRequestedCzk: budgetRequested,
    budgetOfficialCzk: budgetOfficial,
    budgetRows: budgetRows,
    promisedSummary: promisedSummary,
    coordinatorEmail: String(coord).trim(),
    activityEndIso: actIso,
    deadlines: deadline,
    checklist: {
      dissemination_fulfilled: !!checklist.dissemination_fulfilled,
      package_emailed_declared: !!checklist.package_emailed_declared,
      consequences_acknowledged: !!checklist.consequences_acknowledged,
      accepts_prorektor_public_comment: !!checklist.accepts_prorektor_public_comment,
      agrees_solution_and_budget: !!checklist.agrees_solution_and_budget,
      attachments_manifest: String(checklist.attachments_manifest || "").slice(0, 4000),
      consent_saved_at: checklist.consent_saved_at || "",
      completion_saved_at: checklist.completion_saved_at || "",
      notes: String(checklist.notes || "").slice(0, 2000),
      savedAt: checklist.savedAt || "",
      savedRulesVersion: checklist.savedRulesVersion || "",
      deliverable_zprava_fulfilled: !!checklist.deliverable_zprava_fulfilled,
      deliverable_zprava_note: String(checklist.deliverable_zprava_note || "").slice(0, 3000),
      deliverable_vystup_fulfilled: !!checklist.deliverable_vystup_fulfilled,
      deliverable_vystup_note: String(checklist.deliverable_vystup_note || "").slice(0, 3000),
      deliverable_aktivita_fulfilled: !!checklist.deliverable_aktivita_fulfilled,
      deliverable_aktivita_note: String(checklist.deliverable_aktivita_note || "").slice(0, 3000),
      budget_actual_spent_czk: Number(checklist.budget_actual_spent_czk) || 0,
      budget_variance_explanation: String(checklist.budget_variance_explanation || "").slice(0, 2000),
      final_report_draft: String(checklist.final_report_draft || "").slice(0, 12000),
      final_report_final: String(checklist.final_report_final || "").slice(0, 12000),
      zz_draft_saved_at: checklist.zz_draft_saved_at || "",
      final_report_final_saved_at: checklist.final_report_final_saved_at || "",
      budget_actual_lines:
        checklist.budget_actual_lines && typeof checklist.budget_actual_lines === "object"
          ? checklist.budget_actual_lines
          : {},
      budget_line_notes:
        checklist.budget_line_notes && typeof checklist.budget_line_notes === "object"
          ? checklist.budget_line_notes
          : {},
    },
    canEdit: owner,
  };
}

/**
 * Uložení self-checklistu řešitele (jen vlastník řádku, jen SUPPORT/CUT).
 */
function saveConnectPostAward(body) {
  var auth = requireAuth(body.token);
  var competitionId = body.competitionId;
  var applicationId = String(body.applicationId || "").trim();
  if (!competitionId || !applicationId) throw new Error("chybí competitionId nebo applicationId");

  var ss = getSpreadsheet(competitionId);
  var sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) throw new Error("List APPLICATIONS nenalezen.");

  var rowNum = findApplicationsSheetRowNumber_(sheet, applicationId);
  if (rowNum < 0) throw new Error("Přihláška nenalezena.");

  var rows = sheetToObjects(sheet).map(applicationsSheetRowNormalize_);
  var row = rows.find(function (r) {
    return String(r.application_id || "").trim() === applicationId;
  });
  if (!row) throw new Error("Přihláška nenalezena.");

  var me = String(auth.email || "").toLowerCase().trim();
  if (String(row.applicant_email || "").toLowerCase().trim() !== me)
    throw new Error("Ukládat checklist může jen žadatel/řešitel uvedený u přihlášky.");

  var outcome = findProrektorOutcomeForApp_(ss, applicationId);
  var dec = outcome && outcome.decision ? String(outcome.decision).toUpperCase() : "";
  if (dec !== "SUPPORT" && dec !== "CUT") throw new Error("Checklist lze ukládat jen u podpořených nebo krácených projektů.");

  var prev = readConnectPostawardChecklist_(row);
  var c = body.checklist || {};
  var section = String(body.saveSection || "").toLowerCase();
  function pickBool_(obj, prevObj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key) ? !!obj[key] : !!prevObj[key];
  }
  function pickStr_(obj, prevObj, key, maxLen) {
    var cap = maxLen || 2000;
    return Object.prototype.hasOwnProperty.call(obj, key)
      ? String(obj[key] != null ? obj[key] : "").slice(0, cap)
      : String(prevObj[key] != null ? prevObj[key] : "").slice(0, cap);
  }
  function pickNumBudget_(obj, prevObj, key) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var n = Number(obj[key]);
      return isFinite(n) ? n : 0;
    }
    var p = Number(prevObj[key]);
    return isFinite(p) ? p : 0;
  }
  function pickBudgetActualLines_(obj, prevObj) {
    if (!Object.prototype.hasOwnProperty.call(obj, "budget_actual_lines")) {
      return prevObj.budget_actual_lines && typeof prevObj.budget_actual_lines === "object"
        ? prevObj.budget_actual_lines
        : {};
    }
    var raw = obj.budget_actual_lines;
    if (!raw || typeof raw !== "object") return {};
    var o = {};
    CONNECT_BUDGET_LINE_KEYS.forEach(function (k2) {
      if (!Object.prototype.hasOwnProperty.call(raw, k2)) return;
      o[k2] = Math.max(0, Math.round(Number(raw[k2]) || 0));
    });
    return o;
  }
  function pickLineNotes_(obj, prevObj) {
    if (!Object.prototype.hasOwnProperty.call(obj, "budget_line_notes")) {
      return prevObj.budget_line_notes && typeof prevObj.budget_line_notes === "object"
        ? prevObj.budget_line_notes
        : {};
    }
    var raw = obj.budget_line_notes;
    if (!raw || typeof raw !== "object") return {};
    var o = {};
    CONNECT_BUDGET_LINE_KEYS.forEach(function (k2) {
      if (!Object.prototype.hasOwnProperty.call(raw, k2)) return;
      o[k2] = String(raw[k2] != null ? raw[k2] : "").slice(0, 600);
    });
    return o;
  }
  var next = {
    dissemination_fulfilled: pickBool_(c, prev, "dissemination_fulfilled"),
    package_emailed_declared: pickBool_(c, prev, "package_emailed_declared"),
    consequences_acknowledged: pickBool_(c, prev, "consequences_acknowledged"),
    accepts_prorektor_public_comment: pickBool_(c, prev, "accepts_prorektor_public_comment"),
    agrees_solution_and_budget: pickBool_(c, prev, "agrees_solution_and_budget"),
    attachments_manifest: pickStr_(c, prev, "attachments_manifest", 4000),
    notes: pickStr_(c, prev, "notes", 2000),
    consent_saved_at: String(prev.consent_saved_at || ""),
    completion_saved_at: String(prev.completion_saved_at || ""),
    savedAt: fmtDate(new Date()),
    savedRulesVersion: CONNECT_POSTAWARD_RULES_VERSION,
    deliverable_zprava_fulfilled: pickBool_(c, prev, "deliverable_zprava_fulfilled"),
    deliverable_zprava_note: pickStr_(c, prev, "deliverable_zprava_note", 3000),
    deliverable_vystup_fulfilled: pickBool_(c, prev, "deliverable_vystup_fulfilled"),
    deliverable_vystup_note: pickStr_(c, prev, "deliverable_vystup_note", 3000),
    deliverable_aktivita_fulfilled: pickBool_(c, prev, "deliverable_aktivita_fulfilled"),
    deliverable_aktivita_note: pickStr_(c, prev, "deliverable_aktivita_note", 3000),
    budget_actual_spent_czk: pickNumBudget_(c, prev, "budget_actual_spent_czk"),
    budget_variance_explanation: pickStr_(c, prev, "budget_variance_explanation", 2000),
    budget_actual_lines: pickBudgetActualLines_(c, prev),
    budget_line_notes: pickLineNotes_(c, prev),
    final_report_draft: pickStr_(c, prev, "final_report_draft", 12000),
    final_report_final: pickStr_(c, prev, "final_report_final", 12000),
    zz_draft_saved_at: String(prev.zz_draft_saved_at || ""),
    final_report_final_saved_at: String(prev.final_report_final_saved_at || ""),
  };
  if (section === "consent") {
    if (!next.accepts_prorektor_public_comment || !next.agrees_solution_and_budget)
      throw new Error(
        "Pro uložení souhlasu zaškrtněte obě políčka: přijetí stanoviska/komentáře prorektora a souhlas s řešením a výší podpory."
      );
    next.consent_saved_at = fmtDate(new Date());
  } else if (section === "report_draft") {
    next.final_report_draft = pickStr_(c, prev, "final_report_draft", 12000);
    next.zz_draft_saved_at = fmtDate(new Date());
  } else if (section === "report_final") {
    if (!String(prev.consent_saved_at || "").trim())
      throw new Error("Nejdřív uložte souhlas v části 1.");
    next.final_report_final = pickStr_(c, prev, "final_report_final", 12000);
    if (String(next.final_report_final || "").trim().length < 80)
      throw new Error("Finální závěrečná zpráva v aplikaci: doplňte text (alespoň 80 znaků).");
    next.final_report_final_saved_at = fmtDate(new Date());
    next.final_report_draft = next.final_report_final;
  } else if (section === "completion") {
    if (!String(prev.consent_saved_at || "").trim())
      throw new Error("Nejdřív uložte souhlas v části 1 (stanovisko prorektora a schválená podpora).");
    if (String(prev.completion_saved_at || "").trim())
      throw new Error("Projekt je již finálně uzavřen v aplikaci. Pro změny kontaktujte administrátora soutěže.");
    var fdRow = connectParseFormDataObject_(row);
    var reqB = Number(fdRow.budget_total) || 0;
    var plannedAmt = connectEffectiveSupportedCzk_(outcome, reqB);
    if (plannedAmt <= 0)
      throw new Error("Chybí platná schválená částka od prorektora. Kontaktujte administrátora soutěže.");
    validateConnectDeliverableDecl_(
      next.deliverable_zprava_fulfilled,
      next.deliverable_zprava_note,
      "Závěrečná zpráva"
    );
    validateConnectDeliverableDecl_(
      next.deliverable_vystup_fulfilled,
      next.deliverable_vystup_note,
      "Výstup spolupráce"
    );
    validateConnectDeliverableDecl_(
      next.deliverable_aktivita_fulfilled,
      next.deliverable_aktivita_note,
      "Potvrzení aktivity"
    );
    var actLineSum = connectSumBudgetLinesObj_(next.budget_actual_lines);
    var actAmt = actLineSum > 0 ? actLineSum : Number(next.budget_actual_spent_czk) || 0;
    next.budget_actual_spent_czk = actAmt;
    if (actAmt < 0) throw new Error("Skutečně vyčerpaná částka nemůže být záporná.");
    if (Math.abs(actAmt - plannedAmt) > 0.5) {
      if (String(next.budget_variance_explanation || "").trim().length < 15)
        throw new Error(
          "Pokud se skutečně vyčerpaná částka liší od schválené podpory, doplňte zdůvodnění (alespoň 15 znaků)."
        );
    }
    if (!next.dissemination_fulfilled || !next.package_emailed_declared || !next.consequences_acknowledged)
      throw new Error(
        "Zaškrtněte potvrzení diseminační aktivity, odeslání podkladů administrátorce a seznámení s následky."
      );
    next.final_report_final = String(next.final_report_draft || "").slice(0, 12000);
    next.final_report_draft = next.final_report_final;
    if (String(next.final_report_final || "").trim().length < 80)
      throw new Error("Závěrečná zpráva v aplikaci: doplňte text (alespoň 80 znaků).");
    next.final_report_final_saved_at = fmtDate(new Date());
    next.completion_saved_at = fmtDate(new Date());
  }

  var col = ensureConnectPostawardColumn_(sheet);
  if (col < 0) throw new Error("Nelze založit sloupec connect_postaward_json.");

  sheet.getRange(rowNum, col + 1).setValue(JSON.stringify(next));
  try {
    writeAudit(ss, "CONNECT_POSTAWARD_SAVE", applicationId, "", JSON.stringify(next).slice(0, 500), me);
  } catch (aud) { /* ignore */ }

  if (section === "completion") {
    try {
      uhkTryArchiveConnectClosurePdf_(ss, competitionId, applicationId, next, row);
    } catch (archE) {
      console.error("uhkTryArchiveConnectClosurePdf_: " + archE.message);
    }
  }

  return { success: true, checklist: next };
}

function uhkGetArchiveFolder_(ss, competitionId) {
  var cfg = getConfigMap(ss);
  var raw = String(cfg["archive_drive_folder_id"] || cfg["archive_folder_id"] || "").trim();
  var folderId = raw;
  if (!folderId && String(competitionId || "").trim() === CONNECT_COMPETITION_ID)
    folderId = CONNECT_POSTAWARD_ATTACHMENTS_FOLDER_ID;
  if (!folderId) return null;
  try {
    return DriveApp.getFolderById(folderId);
  } catch (e) {
    console.error("uhkGetArchiveFolder_: " + e.message);
    return null;
  }
}

function uhkArchivePdfFileBase_(applicationId, stageTag) {
  var app = String(applicationId || "neznamo").replace(/[^a-zA-Z0-9._\-]/g, "_");
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
  return app + "_" + stamp + "_" + stageTag + ".pdf";
}

function uhkFormDataToPlain_(formData, maxLen) {
  var cap = maxLen != null ? maxLen : UHK_ARCHIVE_MAX_PLAIN_CHARS;
  try {
    var s = JSON.stringify(formData, null, 2);
    if (s.length > cap) s = s.slice(0, cap) + "\n\n[… text zkrácen …]";
    return s;
  } catch (e) {
    return String(formData).slice(0, cap);
  }
}

function uhkProrektorDecisionLabel_(dec) {
  var d = String(dec || "").toUpperCase();
  if (d === "SUPPORT" || d === "FUND") return "Podpora / financování (plná)";
  if (d === "CUT" || d === "FUND_REDUCED") return "Krácení rozpočtu / financování se snížením";
  if (d === "REJECT") return "Nepodpořeno / zamítnuto";
  return d || "—";
}

function uhkFindApplicationRowByAnyId_(ss, applicationOrProjectId) {
  var tid = String(applicationOrProjectId || "").trim();
  if (!tid) return null;
  var sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) return null;
  var rows = sheetToObjects(sheet).map(applicationsSheetRowNormalize_);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var a = String(r.application_id || r.applicationId || "").trim();
    var p = String(r.project_id || "").trim();
    if (a === tid || p === tid) return r;
  }
  return null;
}

function uhkCommissionReviewsPlain_(ss, applicationId) {
  var sheet = ss.getSheetByName(SHEETS.REVIEWS);
  if (!sheet) return "(List hodnocení nenalezen.)";
  var rows = sheetToObjects(sheet);
  var aid = String(applicationId || "").trim();
  var list = rows.filter(function (r) {
    var rid = connectReviewAppId_(r);
    if (rid !== aid) return false;
    if (String(r.comment_internal || "").trim() === "PROREKTOR_DECISION") return false;
    var st = Number(r.score_total);
    var rec = String(r.recommendation || "").trim();
    var pub = String(r.comment_public || "").trim();
    if (!(isFinite(st) && st > 0) && !rec && !pub) return false;
    return true;
  });
  if (!list.length)
    return "(Žádné samostatné záznamy hodnoticí komise – např. jen rozhodnutí prorektora, nebo hodnocení ještě nebylo zapsáno.)";
  list.sort(function (a, b) {
    var ta = parseSubmittedAt_(a.submitted_at) || new Date(0);
    var tb = parseSubmittedAt_(b.submitted_at) || new Date(0);
    return ta - tb;
  });
  var lines = [];
  list.forEach(function (r, idx) {
    lines.push("── Hodnotitel č. " + (idx + 1) + " ──");
    lines.push("Identifikace: " + String(r.reviewer_email || r.reviewerEmail || "").trim());
    lines.push("Datum zápisu: " + String(r.submitted_at || ""));
    lines.push("Součet bodů (Connect K1–K5): " + String(r.score_total != null ? r.score_total : "—"));
    lines.push("Doporučení / značka: " + String(r.recommendation || "—"));
    var pub = String(r.comment_public || "").trim();
    if (pub) lines.push("Veřejný komentář:\n" + pub);
    lines.push("");
  });
  return lines.join("\n");
}

function uhkBudgetLinesPlain_(linesObj) {
  if (!linesObj || typeof linesObj !== "object") return "—";
  var parts = [];
  CONNECT_BUDGET_LINE_KEYS.forEach(function (k) {
    if (!Object.prototype.hasOwnProperty.call(linesObj, k)) return;
    var n = Number(linesObj[k]);
    if (!isFinite(n) || n <= 0) return;
    var lab = CONNECT_BUDGET_LINE_LABELS[k] || k;
    parts.push(lab + ": " + n + " Kč");
  });
  return parts.length ? parts.join("\n") : "—";
}

/** Dočasný Google dokument → PDF blob; původní dokument přesune do koše. */
function uhkCreatePdfBlobFromPlainText_(title, plainBody) {
  var t = String(title || "Dokument").slice(0, 240);
  var body = String(plainBody || "");
  if (body.length > UHK_ARCHIVE_MAX_PLAIN_CHARS) body = body.slice(0, UHK_ARCHIVE_MAX_PLAIN_CHARS) + "\n\n[… zbytek textu zkrácen …]";
  var doc = DocumentApp.create("tmp_" + Utilities.getUuid().replace(/-/g, "").slice(0, 20));
  var bodyEl = doc.getBody();
  bodyEl.clear();
  bodyEl.appendParagraph(t).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  var pos = 0;
  var chunk = 7500;
  while (pos < body.length) {
    bodyEl.appendParagraph(body.slice(pos, pos + chunk));
    pos += chunk;
  }
  var fileId = doc.getId();
  var driveFile = DriveApp.getFileById(fileId);
  var pdfBlob = driveFile.getAs(MimeType.PDF);
  try {
    driveFile.setTrashed(true);
  } catch (trE) { /* ignore */ }
  return pdfBlob;
}

function uhkSavePdfToArchive_(folder, fileName, title, plainBody, ss, auditAction, auditId, extraAudit) {
  if (!folder) return null;
  var pdfBlob = uhkCreatePdfBlobFromPlainText_(title, plainBody);
  pdfBlob.setName(fileName);
  var created = folder.createFile(pdfBlob);
  try {
    writeAudit(ss, auditAction || "ARCHIVE_PDF", auditId || "", created.getId(), fileName, extraAudit || "");
  } catch (aud) { /* ignore */ }
  return created.getUrl();
}

function uhkTryArchiveFinalSubmissionPdf_(ss, competitionId, applicationId, formData, applicantEmail, applicantName, submittedAt) {
  var folder = uhkGetArchiveFolder_(ss, competitionId);
  if (!folder) return;
  var appRow = uhkFindApplicationRowByAnyId_(ss, applicationId);
  var em = String(applicantEmail || (appRow && appRow.applicant_email) || "").trim();
  var nm = String(applicantName || (appRow && appRow.applicant_name) || "").trim();
  var title = "Finální podání přihlášky – " + String(applicationId);
  var lines = [];
  lines.push("Soutěž (competitionId): " + String(competitionId));
  lines.push("ID přihlášky / projektu: " + String(applicationId));
  lines.push("Školní e-mail žadatele (stabilní identifikátor): " + em);
  lines.push("Jméno žadatele: " + nm);
  lines.push("Datum a čas podání: " + String(submittedAt || fmtDate(new Date())));
  lines.push("");
  lines.push("── Obsah formuláře (JSON) ──");
  lines.push(uhkFormDataToPlain_(formData || {}, UHK_ARCHIVE_MAX_PLAIN_CHARS));
  var fn = uhkArchivePdfFileBase_(applicationId, "1_finalni_podani");
  uhkSavePdfToArchive_(folder, fn, title, lines.join("\n"), ss, "ARCHIVE_FINAL_SUBMISSION", applicationId, em);
}

function uhkTryArchiveProrektorEvaluationPdf_(ss, competitionId, applicationId) {
  var folder = uhkGetArchiveFolder_(ss, competitionId);
  if (!folder) return;
  var appRow = uhkFindApplicationRowByAnyId_(ss, applicationId);
  var fd = appRow ? connectParseFormDataObject_(appRow) : {};
  var outcome = findProrektorOutcomeForApp_(ss, applicationId);
  var em = String((appRow && appRow.applicant_email) || "").trim();
  var title = "Hodnocení komise a vyjádření prorektora – " + String(applicationId);
  var lines = [];
  lines.push("Soutěž (competitionId): " + String(competitionId));
  lines.push("ID přihlášky / projektu: " + String(applicationId));
  lines.push("Školní e-mail žadatele: " + em);
  lines.push("Název projektu (z přihlášky): " + String(fd.project_title || (appRow && appRow.project_title) || "—"));
  lines.push("");
  lines.push("── Přehled hodnocení komise ──");
  lines.push(uhkCommissionReviewsPlain_(ss, applicationId));
  lines.push("");
  lines.push("── Rozhodnutí prorektora ──");
  if (!outcome) {
    lines.push("(Rozhodnutí prorektora v systému nenalezeno.)");
  } else {
    lines.push("Datum rozhodnutí: " + String(outcome.decidedAt || "—"));
    lines.push("Výsledek: " + uhkProrektorDecisionLabel_(outcome.decision) + " (" + String(outcome.decision) + ")");
    lines.push("Schválená / navrhovaná částka (Kč): " + String(outcome.supported_amount_czk != null ? outcome.supported_amount_czk : "—"));
    lines.push("Schválené položky rozpočtu:");
    lines.push(uhkBudgetLinesPlain_(outcome.budget_lines));
    lines.push("");
    lines.push("Stanovisko / komentář prorektora:");
    lines.push(String(outcome.comment || "—"));
  }
  var fn = uhkArchivePdfFileBase_(applicationId, "2_hodnoceni_prorektor");
  uhkSavePdfToArchive_(folder, fn, title, lines.join("\n"), ss, "ARCHIVE_PROREKTOR_EVAL", applicationId, em);
}

function uhkTryArchiveConnectClosurePdf_(ss, competitionId, applicationId, checklist, appRow) {
  var folder = uhkGetArchiveFolder_(ss, competitionId);
  if (!folder) return;
  var fd = appRow ? connectParseFormDataObject_(appRow) : {};
  var outcome = findProrektorOutcomeForApp_(ss, applicationId);
  var em = String((appRow && appRow.applicant_email) || "").trim();
  var title = "Závěrečné uzavření projektu (Connect) – " + String(applicationId);
  var zz = String(checklist.final_report_final || checklist.final_report_draft || "").trim();
  if (zz.length > UHK_ARCHIVE_MAX_ZZ_IN_PDF) zz = zz.slice(0, UHK_ARCHIVE_MAX_ZZ_IN_PDF) + "\n\n[… závěrečná zpráva v PDF zkrácena; plný text je v systému …]";
  var lines = [];
  lines.push("Soutěž (competitionId): " + String(competitionId));
  lines.push("ID přihlášky: " + String(applicationId));
  lines.push("Školní e-mail řešitele: " + em);
  lines.push("Název projektu: " + String(fd.project_title || (appRow && appRow.project_title) || "—"));
  lines.push("Datum finálního uzavření v aplikaci: " + String(checklist.completion_saved_at || "—"));
  lines.push("Souhlas části 1 uložen: " + String(checklist.consent_saved_at || "—"));
  lines.push("");
  lines.push("── Schválená podpora (prorektor) ──");
  if (outcome) {
    lines.push("Rozhodnutí: " + uhkProrektorDecisionLabel_(outcome.decision));
    lines.push("Částka (Kč): " + String(outcome.supported_amount_czk != null ? outcome.supported_amount_czk : "—"));
  } else lines.push("—");
  lines.push("");
  lines.push("── Skutečně vyčerpaná částka (řádky) ──");
  lines.push("Součet / celkem: " + String(checklist.budget_actual_spent_czk != null ? checklist.budget_actual_spent_czk : "—") + " Kč");
  lines.push(uhkBudgetLinesPlain_(checklist.budget_actual_lines));
  lines.push("Zdůvodnění odchylky rozpočtu: " + String(checklist.budget_variance_explanation || "—"));
  lines.push("");
  lines.push("── Povinné výstupy (prohlášení) ──");
  lines.push("Závěrečná zpráva splněna: " + (checklist.deliverable_zprava_fulfilled ? "ano" : "ne"));
  lines.push("Poznámka: " + String(checklist.deliverable_zprava_note || ""));
  lines.push("Výstup spolupráce: " + (checklist.deliverable_vystup_fulfilled ? "ano" : "ne") + " – " + String(checklist.deliverable_vystup_note || ""));
  lines.push("Potvrzení aktivity: " + (checklist.deliverable_aktivita_fulfilled ? "ano" : "ne") + " – " + String(checklist.deliverable_aktivita_note || ""));
  lines.push("Diseminace: " + (checklist.dissemination_fulfilled ? "ano" : "ne"));
  lines.push("Podklady administrátorce: " + (checklist.package_emailed_declared ? "ano" : "ne"));
  lines.push("Seznámení s následky: " + (checklist.consequences_acknowledged ? "ano" : "ne"));
  lines.push("");
  lines.push("── Přílohy (manifest) ──");
  lines.push(String(checklist.attachments_manifest || "—"));
  lines.push("");
  lines.push("── Poznámka řešitele ──");
  lines.push(String(checklist.notes || "—"));
  lines.push("");
  lines.push("── Text závěrečné zprávy (evidence v soutěži) ──");
  lines.push(zz || "—");
  var fn = uhkArchivePdfFileBase_(applicationId, "3_uzavreni_projektu");
  uhkSavePdfToArchive_(folder, fn, title, lines.join("\n"), ss, "ARCHIVE_CONNECT_CLOSURE", applicationId, em);
}

/**
 * Nahraje jeden soubor do sdílené složky na Disku (Connect – část 2).
 * body: token, competitionId, applicationId, fileName, mimeType, fileBase64 (čistý base64 nebo data URL)
 */
function uploadConnectPostAwardAttachment(body) {
  var auth = requireAuth(body.token);
  var competitionId = body.competitionId;
  var applicationId = String(body.applicationId || "").trim();
  var fileName = String(body.fileName || "soubor").trim();
  var mimeType = String(body.mimeType || "application/octet-stream").trim();
  var b64 = body.fileBase64;

  if (!competitionId || !applicationId) throw new Error("chybí competitionId nebo applicationId");
  if (!b64 || typeof b64 !== "string") throw new Error("chybí obsah souboru.");

  var ss = getSpreadsheet(competitionId);
  var sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) throw new Error("List APPLICATIONS nenalezen.");

  var rowNum = findApplicationsSheetRowNumber_(sheet, applicationId);
  if (rowNum < 0) throw new Error("Přihláška nenalezena.");

  var rows = sheetToObjects(sheet).map(applicationsSheetRowNormalize_);
  var row = rows.find(function (r) {
    return String(r.application_id || "").trim() === applicationId;
  });
  if (!row) throw new Error("Přihláška nenalezena.");

  var me = String(auth.email || "").toLowerCase().trim();
  if (String(row.applicant_email || "").toLowerCase().trim() !== me)
    throw new Error("Nahrávat přílohy může jen žadatel/řešitel uvedený u přihlášky.");

  var outcome = findProrektorOutcomeForApp_(ss, applicationId);
  var dec = outcome && outcome.decision ? String(outcome.decision).toUpperCase() : "";
  if (dec !== "SUPPORT" && dec !== "CUT")
    throw new Error("Přílohy lze nahrávat jen u podpořených nebo krácených projektů.");

  var maxBytes = 18 * 1024 * 1024;
  var rawB64 = String(b64).replace(/\s/g, "");
  var idx = rawB64.indexOf("base64,");
  if (idx >= 0) rawB64 = rawB64.slice(idx + 7);

  var bytes;
  try {
    bytes = Utilities.base64Decode(rawB64);
  } catch (e) {
    throw new Error("Neplatný formát souboru.");
  }
  if (!bytes || bytes.length < 1) throw new Error("Prázdný soubor.");
  if (bytes.length > maxBytes) throw new Error("Soubor je příliš velký (max. 18 MB).");

  var safe = fileName.replace(/[^a-zA-Z0-9._\-]/g, "_").replace(/_+/g, "_").slice(0, 120);
  if (!safe) safe = "soubor";
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
  var finalName = applicationId + "_" + stamp + "_" + safe;

  var folder;
  try {
    folder = DriveApp.getFolderById(CONNECT_POSTAWARD_ATTACHMENTS_FOLDER_ID);
  } catch (e) {
    throw new Error("Složka pro přílohy na Disku není dostupná. Kontaktujte administrátora.");
  }

  var blob = Utilities.newBlob(bytes, mimeType, finalName);
  var driveFile = folder.createFile(blob);
  driveFile.setName(finalName);

  try {
    writeAudit(ss, "CONNECT_POSTAWARD_UPLOAD", applicationId, driveFile.getId(), finalName, me);
  } catch (aud) {
    /* ignore */
  }

  return {
    success: true,
    name: driveFile.getName(),
    url: driveFile.getUrl(),
    id: driveFile.getId(),
  };
}

/**
 * Přehled přihlášek přihlášeného žadatele v Connect (drafty + podané) se stavem a výsledkem prorektora.
 */
function getConnectMyApplications(competitionId, token) {
  if (!competitionId) throw new Error("chybí competitionId");
  const auth = requireAuth(token);
  const me = String(auth.email || "").toLowerCase().trim();

  const ss = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) return { success: true, applications: [] };

  let rows = sheetToObjects(sheet).map(applicationsSheetRowNormalize_);
  rows = rows.filter(function (r) {
    return String(r.applicant_email || "").toLowerCase().trim() === me;
  });

  const list = rows.map(function (r) {
    var id = String(r.application_id || "").trim();
    var st = r.status;
    var isDraft = st === "DRAFT";
    var outcome = isDraft ? null : findProrektorOutcomeForApp_(ss, id);
    var hasPr = !!(outcome && outcome.decision);
    var prDec = outcome && outcome.decision ? String(outcome.decision).toUpperCase() : "";
    var fd = connectParseFormDataObject_(r);
    var budgetRequested = Number(fd.budget_total) || 0;
    var pa = isDraft ? {} : readConnectPostawardChecklist_(r);
    var needsApplicantDeclarations = !isDraft && (prDec === "SUPPORT" || prDec === "CUT");
    function triFromChecklist_(obj, key) {
      if (!needsApplicantDeclarations) return null;
      if (!obj || typeof obj !== "object") return null;
      if (!Object.prototype.hasOwnProperty.call(obj, key)) return null;
      return !!obj[key];
    }
    var prComment = outcome && outcome.comment ? String(outcome.comment).trim() : "";
    var subRaw = readSubmittedAtCell_(r) || r.__subAtFromStatusCol;
    var subParsed =
      parseSubmittedAt_(subRaw) ||
      parseSubmittedAt_(r.updated_at) ||
      parseSubmittedAt_(r.created_at);
    var listDate = isDraft
      ? parseSubmittedAt_(r.updated_at) || parseSubmittedAt_(r.created_at)
      : subParsed || parseSubmittedAt_(r.created_at) || parseSubmittedAt_(r.updated_at);
    return {
      application_id: id,
      status: st,
      project_title: applicationRowTitle_(r),
      version_kind: isDraft ? "DRAFT" : "FINAL",
      workflow_label: connectApplicantWorkflowLabel_(st, hasPr),
      result_label: connectApplicantResultLabel_(outcome),
      updated_at: r.updated_at || "",
      submitted_at: r.submitted_at || "",
      created_at: r.created_at || "",
      submitted_at_label: formatCsDateTime_(listDate),
      budget_requested_czk: budgetRequested,
      prorektor_comment_public: prComment,
      prorektor_comment_excerpt: prComment.length > 160 ? prComment.slice(0, 157) + "…" : prComment,
      accepts_prorektor_comment: triFromChecklist_(pa, "accepts_prorektor_public_comment"),
      agrees_solution_and_budget: triFromChecklist_(pa, "agrees_solution_and_budget"),
    };
  });

  list.sort(function (a, b) {
    if (a.version_kind !== b.version_kind) return a.version_kind === "DRAFT" ? -1 : 1;
    var sa =
      parseSubmittedAt_(a.submitted_at) ||
      parseSubmittedAt_(a.updated_at) ||
      parseSubmittedAt_(a.created_at) ||
      new Date(0);
    var sb =
      parseSubmittedAt_(b.submitted_at) ||
      parseSubmittedAt_(b.updated_at) ||
      parseSubmittedAt_(b.created_at) ||
      new Date(0);
    return (sb.getTime ? sb.getTime() : 0) - (sa.getTime ? sa.getTime() : 0);
  });

  return { success: true, applications: list, viewer_email: me, scope: "own_rows_only" };
}

function changeStatus(body) {
  const auth = requireAuth(body.token);
  if (!authHasAnyRole_(auth, ["ADMIN", "PROREKTOR", "KOMISAR", "KOMISAŘ", "TESTER"]))
    throw new Error("Nedostatečná oprávnění.");

  const ss    = getSpreadsheet(body.competitionId);
  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) throw new Error("List APPLICATIONS nenalezen.");

  const data    = sheet.getDataRange().getValues();
  const headers = data[HEADER_ROW - 1];
  const COL     = mapColumns(headers);
  const idCol   = findCol(COL, "application_id", "id", "app_id");
  if (idCol < 0) throw new Error("List APPLICATIONS: chybí sloupec application_id.");
  const wantId  = String(body.applicationId || "").trim();

  for (let i = HEADER_ROW; i < data.length; i++) {
    if (String(data[i][idCol] || "").trim() !== wantId) continue;
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
  if (!authHasAnyRole_(auth, ["ADMIN", "PROREKTOR", "KOMISAR", "KOMISAŘ", "TESTER", "READONLY"]))
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

/**
 * Rozpočet výzvy pro rozcestník: alokace z CONFIG u všech soutěží v SPREADSHEET_IDS.
 * Plný výpočet přiděleno / využito (žadatel) jen u UHK Connect (prorektor + souhlas v části 1).
 * Ostatní výzvy: alokace + zbývá = alokace (řádky přiděleno/využito 0, dokud nebude obdobná logika).
 */
function getConnectFundingSummary(competitionId, token) {
  const auth = requireAuth(token);
  if (!authHasAnyRole_(auth, ["ADMIN", "PROREKTOR", "KOMISAR", "KOMISAŘ", "TESTER", "READONLY"]))
    throw new Error("Nedostatečná oprávnění.");
  const comp = String(competitionId || "").trim();
  if (!SPREADSHEET_IDS[comp]) return { success: true, supported: false };

  const ss = getSpreadsheet(comp);
  const cfg = getConfigMap(ss);
  const allocation = readTotalAllocationCzkFromCfg_(cfg);

  if (comp !== CONNECT_COMPETITION_ID) {
    return {
      success: true,
      supported: true,
      detailLevel: "allocation_only",
      allocationCzk: allocation,
      assignedCzk: 0,
      acceptedCzk: 0,
      remainingCzk: Math.max(0, allocation),
      assignedCount: 0,
      acceptedCount: 0,
    };
  }

  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet) {
    return {
      success: true,
      supported: true,
      detailLevel: "connect",
      allocationCzk: allocation,
      assignedCzk: 0,
      acceptedCzk: 0,
      remainingCzk: Math.max(0, allocation),
      assignedCount: 0,
      acceptedCount: 0,
    };
  }

  const rows = sheetToObjects(sheet).map(applicationsSheetRowNormalize_);
  let assigned = 0;
  let accepted = 0;
  let assignedCount = 0;
  let acceptedCount = 0;

  rows.forEach(function (row) {
    const st = String(row.status || "").toUpperCase().trim();
    if (st !== "APPROVED") return;
    const id = String(row.application_id || "").trim();
    if (!id) return;
    const outcome = findProrektorOutcomeForApp_(ss, id);
    const dec = outcome && outcome.decision ? String(outcome.decision).toUpperCase() : "";
    if (dec !== "SUPPORT" && dec !== "CUT") return;
    const fd = connectParseFormDataObject_(row);
    const requested = Number(fd.budget_total) || 0;
    const eff = connectEffectiveSupportedCzk_(outcome, requested);
    if (eff <= 0) return;
    assigned += eff;
    assignedCount++;
    const pa = readConnectPostawardChecklist_(row);
    if (String(pa.consent_saved_at || "").trim()) {
      accepted += eff;
      acceptedCount++;
    }
  });

  return {
    success: true,
    supported: true,
    detailLevel: "connect",
    allocationCzk: allocation,
    assignedCzk: assigned,
    acceptedCzk: accepted,
    remainingCzk: Math.max(0, allocation - assigned),
    assignedCount: assignedCount,
    acceptedCount: acceptedCount,
  };
}

/**
 * Export pro správce: Connect – souhlas žadatele, potvrzení po projektu, přílohy (JSON; CSV skládá frontend).
 */
function getConnectDeliverablesExport(competitionId, token) {
  const auth = requireAuth(token);
  if (!authHasAnyRole_(auth, ["ADMIN", "PROREKTOR", "KOMISAR", "KOMISAŘ", "TESTER", "READONLY"]))
    throw new Error("Nedostatečná oprávnění.");
  const comp = String(competitionId || "").trim();
  if (comp !== CONNECT_COMPETITION_ID)
    return { success: true, supported: false };

  const ss = getSpreadsheet(comp);
  const sheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (!sheet)
    return { success: true, supported: true, generatedAt: fmtDate(new Date()), rows: [] };

  const rows = sheetToObjects(sheet).map(applicationsSheetRowNormalize_);
  const out = rows.map(function (r) {
    const id = String(r.application_id || "").trim();
    const pa = readConnectPostawardChecklist_(r);
    const outcome = findProrektorOutcomeForApp_(ss, id);
    const fd = connectParseFormDataObject_(r);
    var prComment = "";
    if (outcome && outcome.comment)
      prComment = String(outcome.comment)
        .replace(/\r\n/g, " ")
        .replace(/\n/g, " ")
        .trim();
    var offAmt = connectEffectiveSupportedCzk_(outcome, Number(fd.budget_total) || 0);
    return {
      application_id: id,
      applicant_email: String(r.applicant_email || "").trim(),
      applicant_name: String(r.applicant_name || "").trim(),
      status: String(r.status || "").trim(),
      project_title: applicationRowTitle_(r),
      budget_total_requested: Number(fd.budget_total) || 0,
      budget_official_czk: offAmt,
      prorektor_decision: outcome && outcome.decision ? String(outcome.decision).toUpperCase() : "",
      prorektor_comment: prComment.slice(0, 1500),
      accepts_prorektor_comment: !!pa.accepts_prorektor_public_comment,
      agrees_solution_and_budget: !!pa.agrees_solution_and_budget,
      consent_saved_at: String(pa.consent_saved_at || ""),
      dissemination_fulfilled: !!pa.dissemination_fulfilled,
      package_emailed_declared: !!pa.package_emailed_declared,
      consequences_acknowledged: !!pa.consequences_acknowledged,
      completion_saved_at: String(pa.completion_saved_at || ""),
      attachments_manifest: String(pa.attachments_manifest || "").slice(0, 4000),
      notes: String(pa.notes || "").slice(0, 2000),
      checklist_last_saved: String(pa.savedAt || ""),
      deliverable_zprava_fulfilled: !!pa.deliverable_zprava_fulfilled,
      deliverable_vystup_fulfilled: !!pa.deliverable_vystup_fulfilled,
      deliverable_aktivita_fulfilled: !!pa.deliverable_aktivita_fulfilled,
      budget_actual_spent_czk: Number(pa.budget_actual_spent_czk) || 0,
      budget_variance_explanation: String(pa.budget_variance_explanation || "").slice(0, 4000),
    };
  });

  return { success: true, supported: true, generatedAt: fmtDate(new Date()), rows: out };
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

/** Zajistí sloupec pro schválenou částku (Kč) u rozhodnutí prorektora (odděleně od komentáře K1 komise). */
function ensureConnectProrektorAmountColumn_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < HEADER_ROW) return;
  var hdrs = data[HEADER_ROW - 1];
  var COL = mapColumns(hdrs);
  if (findCol(COL, "prorektor_supported_czk", "supported_budget_czk") >= 0) return;
  sheet.getRange(HEADER_ROW, sheet.getLastColumn() + 1).setValue("prorektor_supported_czk");
}

function ensureConnectProrektorBudgetLinesColumn_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < HEADER_ROW) return;
  var hdrs = data[HEADER_ROW - 1];
  var COL = mapColumns(hdrs);
  if (findCol(COL, "prorektor_budget_lines_json", "prorektor_budget_json") >= 0) return;
  sheet.getRange(HEADER_ROW, sheet.getLastColumn() + 1).setValue("prorektor_budget_lines_json");
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
  putMany(map.prorektor_supported_czk, "prorektor_supported_czk", "supported_budget_czk");
  putMany(map.prorektor_budget_lines_json, "prorektor_budget_lines_json", "prorektor_budget_json");
  putMany(map.poradi, "poradi", "rank");
  putMany(map.conflict, "conflict", "stret_zajmu");
  sheet.appendRow(row);
}

/** Hodnocení komise – upsert řádku v ⭐ REVIEWS (formulář review-connect). */
function submitConnectReview(body) {
  const auth = requireAuth(body.token);
  if (!authHasAnyRole_(auth, ["ADMIN", "KOMISAR", "KOMISAŘ", "TESTER"]))
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

/** Finální rozhodnutí prorektora u Connect + změna stavu přihlášky. Schválená částka (Kč) v comment_k1 u řádku rozhodnutí. */
function saveConnectProrektorDecision(body) {
  const auth = requireAuth(body.token);
  if (!authHasAnyRole_(auth, ["ADMIN", "PROREKTOR", "TESTER"]))
    throw new Error("Rozhodnutí může ukládat pouze prorektor nebo správce.");
  const competitionId = body.competitionId;
  const appId = String(body.applicationId || "").trim();
  const decision = String(body.decision || "").toUpperCase();
  const note = String(body.comment || "").trim();
  if (!appId) throw new Error("chybí applicationId");
  if (["SUPPORT", "CUT", "REJECT"].indexOf(decision) < 0)
    throw new Error("Neplatné rozhodnutí (očekáváno SUPPORT, CUT nebo REJECT).");
  const ss = getSpreadsheet(competitionId);
  let budgetRequested = 0;
  var fdApp = {};
  const appSheet = ss.getSheetByName(SHEETS.APPLICATIONS);
  if (appSheet) {
    const arows = sheetToObjects(appSheet).map(applicationsSheetRowNormalize_);
    const arow = arows.find(function (r) {
      return String(r.application_id || "").trim() === appId;
    });
    if (arow) {
      fdApp = connectParseFormDataObject_(arow);
      budgetRequested = Number(fdApp.budget_total) || 0;
    }
  }
  var normalizedLines = {};
  var supported = 0;
  if (decision === "CUT") {
    normalizedLines = connectNormalizeProrektorBudgetLines_(body.budgetLines, fdApp, true);
    supported = connectSumBudgetLinesObj_(normalizedLines);
    if (supported <= 0)
      throw new Error("U krácení rozpočtu vyplňte schválené částky u jednotlivých položek (součet musí být větší než 0).");
    if (budgetRequested > 0 && supported > budgetRequested)
      throw new Error(
        "Součet schválených položek (" + supported + " Kč) nemůže překročit celkový rozpočet v přihlášce (" +
          budgetRequested +
          " Kč)."
      );
  } else if (decision === "SUPPORT") {
    normalizedLines = connectNormalizeProrektorBudgetLines_(body.budgetLines, fdApp, false);
    supported = connectSumBudgetLinesObj_(normalizedLines);
    if (supported <= 0) supported = budgetRequested;
    if (supported <= 0) throw new Error("V přihlášce chybí platný celkový rozpočet – schválenou částku nelze určit.");
  }
  const sheet = ss.getSheetByName(SHEETS.REVIEWS);
  if (!sheet) throw new Error("List REVIEWS nenalezen.");
  if (decision === "SUPPORT" || decision === "CUT") {
    ensureConnectProrektorAmountColumn_(sheet);
    ensureConnectProrektorBudgetLinesColumn_(sheet);
  }
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
    prorektor_supported_czk: decision === "REJECT" ? "" : Math.round(supported),
    prorektor_budget_lines_json: decision === "REJECT" ? "" : JSON.stringify(normalizedLines),
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
  try {
    uhkTryArchiveProrektorEvaluationPdf_(ss, competitionId, appId);
  } catch (archE) {
    console.error("uhkTryArchiveProrektorEvaluationPdf_ (Connect): " + archE.message);
  }
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
    APPROVED:     "Gratulujeme! Vaše přihláška byla schválena k financování. Stanovisko prorektora a komentář si můžete po přihlášení přečíst u přihlášky UHK Connect (Moje projekty).",
    REJECTED:     "Vaše přihláška nebyla v tomto kole podpořena. Zdůvodnění od prorektora najdete po přihlášení u přihlášky UHK Connect (Moje projekty).",
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
  putMany(map.connect_postaward_json, "connect_postaward_json", "postaward_json", "povinne_vystupy_json");

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
  if (typeof val === "number" && !isNaN(val) && val > 20000 && val < 80000) {
    var epoch = new Date(1899, 11, 30);
    var whole = Math.floor(val);
    var frac = val - whole;
    var d = new Date(epoch.getTime() + whole * 86400000 + frac * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
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
  try {
    var compNav = String(body.competitionId || "uhk_navraty_2026").trim();
    uhkTryArchiveProrektorEvaluationPdf_(ss, compNav, body.projectId);
  } catch (archE) {
    console.error("uhkTryArchiveProrektorEvaluationPdf_ (Návraty): " + archE.message);
  }
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

/** Název projektu z řádku APPLICATIONS. */
function applicationRowTitle_(row) {
  if (!row) return "";
  var pt = row.project_title != null ? String(row.project_title).trim() : "";
  if (pt && pt.charAt(0) !== "{") return pt;
  try {
    var fd = JSON.parse(String(row.form_data_json || "{}"));
    if (fd.project_title) return String(fd.project_title).trim();
  } catch (e) { /* ignore */ }
  try {
    var scan = String(row.coordinator_email || "").trim();
    if (scan.charAt(0) === "{") {
      var fd2 = JSON.parse(scan);
      if (fd2.project_title) return String(fd2.project_title).trim();
    }
  } catch (e2) { /* ignore */ }
  return String(row.application_id || "").trim();
}

/** U řádku PROREKTOR_DECISION: schválená částka (Kč) ve sloupci prorektor_supported_czk, případně legacy v comment_k1. */
function connectProrektorSupportedFromReviewRow_(r) {
  if (!r) return 0;
  var raw =
    r.prorektor_supported_czk != null && String(r.prorektor_supported_czk).trim() !== ""
      ? r.prorektor_supported_czk
      : r.comment_k1;
  var n = parseConfigNumberCzk_(raw);
  return n > 0 ? n : 0;
}

/**
 * Platná schválená podpora: součet řádků z JSON, jinak sloupec prorektor_supported_czk / žádost.
 */
function connectEffectiveSupportedCzk_(outcome, budgetRequested) {
  var req = Number(budgetRequested) || 0;
  if (req < 0) req = 0;
  if (!outcome || !outcome.decision) return 0;
  var dec = String(outcome.decision).toUpperCase();
  var bl = outcome.budget_lines;
  if (bl && typeof bl === "object") {
    var ls = connectSumBudgetLinesObj_(bl);
    if (ls > 0) return ls;
  }
  var fromRow = Number(outcome.supported_amount_czk) || 0;
  if (dec === "SUPPORT") return fromRow > 0 ? fromRow : req;
  if (dec === "CUT") return fromRow > 0 ? fromRow : 0;
  return 0;
}

function validateConnectDeliverableDecl_(fulfilled, note, label) {
  if (fulfilled) return;
  if (String(note || "").trim().length < 15)
    throw new Error('U „' + label + '“ potvrďte splnění, nebo vysvětlete, proč výstup splněn nebyl (min. 15 znaků).');
}

/** Poslední řádek prorektora (PROREKTOR_DECISION) pro přihlášku, nejnovější podle submitted_at. */
function findProrektorOutcomeForApp_(ss, applicationId) {
  const sheet = ss.getSheetByName(SHEETS.REVIEWS);
  if (!sheet) return null;
  const rows = sheetToObjects(sheet);
  const aid = String(applicationId || "").trim();
  const matches = rows.filter(function (r) {
    const id = String(r.application_id || r.project_id || "").trim();
    return id === aid && String(r.comment_internal || "").trim() === "PROREKTOR_DECISION";
  });
  if (!matches.length) return null;
  matches.sort(function (a, b) {
    const ta = parseSubmittedAt_(a.submitted_at) || new Date(0);
    const tb = parseSubmittedAt_(b.submitted_at) || new Date(0);
    return tb - ta;
  });
  const r = matches[0];
  const dec = String(r.recommendation || "").toUpperCase();
  let label = "—";
  if (dec === "SUPPORT") label = "Podpořit";
  else if (dec === "CUT") label = "Krátit rozpočet";
  else if (dec === "REJECT") label = "Nepodpořit";
  var bl = connectParseProrektorBudgetLinesJson_(r);
  return {
    decision: dec,
    decisionLabel: label,
    comment: String(r.comment_public || "").trim(),
    decidedAt: r.submitted_at ? String(r.submitted_at) : "",
    supported_amount_czk: connectProrektorSupportedFromReviewRow_(r),
    budget_lines: bl,
  };
}

function applicantNonDraftRows_(rows, applicantLower) {
  return rows.filter(function (r) {
    return String(r.applicant_email || "").toLowerCase().trim() === applicantLower &&
      String(r.status || "").toUpperCase() !== "DRAFT";
  });
}

function pickLatestApplicationRow_(list) {
  if (!list || !list.length) return null;
  function rowTime(r) {
    return (
      parseSubmittedAt_(readSubmittedAtCell_(r) || r.__subAtFromStatusCol || r.submitted_at) ||
      parseSubmittedAt_(r.updated_at) ||
      parseSubmittedAt_(r.created_at) ||
      new Date(0)
    );
  }
  return list.slice().sort(function (a, b) {
    return rowTime(b) - rowTime(a);
  })[0];
}

/**
 * Načte draft přihlášky pro žadatele + případně podanou přihlášku a výsledek prorektora.
 * Volitelně applicationId / app (GET): konkrétní podaná přihláška → draft se nevrátí (zobrazí se přehled podání),
 * i když existuje rozpracovaný koncept (hasOtherDraft).
 */
function getDraft(competitionId, applicantEmail, token, focusApplicationId) {
  const auth = requireAuth(token);
  const applicant = String(applicantEmail || "").toLowerCase().trim();
  if (!applicant || applicant !== auth.email)
    throw new Error("Draft lze načíst jen pro vlastní e-mail.");

  const ss    = getSpreadsheet(competitionId);
  const sheet = ss.getSheetByName("📥 APPLICATIONS");
  if (!sheet) return { success: true, draft: null, submittedApplication: null, prorektorOutcome: null };

  const rows = sheetToObjects(sheet).map(applicationsSheetRowNormalize_);
  const draft = rows.find(function (r) {
    return String(r.applicant_email || "").toLowerCase().trim() === applicant && r.status === "DRAFT";
  });

  const focusId = String(focusApplicationId || "").trim();
  if (focusId) {
    var focused = rows.find(function (r) {
      return (
        String(r.application_id || "").trim() === focusId &&
        String(r.applicant_email || "").toLowerCase().trim() === applicant
      );
    });
    if (focused && focused.status !== "DRAFT") {
      var outcomeF = findProrektorOutcomeForApp_(ss, focusId);
      return {
        success: true,
        draft: null,
        submittedApplication: {
          application_id: focusId,
          status: focused.status,
          project_title: applicationRowTitle_(focused),
          submitted_at: readSubmittedAtCell_(focused) || focused.submitted_at || "",
        },
        prorektorOutcome: outcomeF,
        hasOtherDraft: !!draft,
      };
    }
  }

  const nonDraft = rows.filter(function (r) {
    return String(r.applicant_email || "").toLowerCase().trim() === applicant && r.status !== "DRAFT";
  });
  const latestSub = pickLatestApplicationRow_(nonDraft);
  let prorektorOutcome = null;
  let submittedSummary = null;
  if (latestSub && latestSub.application_id) {
    prorektorOutcome = findProrektorOutcomeForApp_(ss, latestSub.application_id);
    submittedSummary = {
      application_id: latestSub.application_id,
      status: latestSub.status,
      project_title: applicationRowTitle_(latestSub),
    };
  }

  if (!draft) {
    return { success: true, draft: null, submittedApplication: submittedSummary, prorektorOutcome: prorektorOutcome };
  }

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
  return {
    success: true,
    draft: draft,
    submittedApplication: submittedSummary,
    prorektorOutcome: prorektorOutcome,
  };
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
  const idCol = findCol(COL, "application_id", "id", "app_id", "project_id");
  if (eCol < 0 || sCol < 0 || fCol < 0)
    throw new Error("List APPLICATIONS: chybí potřebná záhlaví (applicant_email, status, form_data_json).");

  for (let i = HEADER_ROW; i < data.length; i++) {
    const rowEmail  = String(data[i][eCol] || "").toLowerCase();
    const rowStatus = String(data[i][sCol] || "").toUpperCase();
    if (rowEmail === body.applicantEmail?.toLowerCase() && rowStatus === "DRAFT") {
      const appId = idCol >= 0 ? String(data[i][idCol] || "").trim() : String(data[i][0] || "").trim();
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
      const subAt = fmtDate(new Date());
      try {
        if (appId)
          uhkTryArchiveFinalSubmissionPdf_(
            ss,
            body.competitionId,
            appId,
            body.formData || {},
            body.applicantEmail,
            body.applicantName,
            subAt
          );
      } catch (archE) {
        console.error("uhkTryArchiveFinalSubmissionPdf_: " + archE.message);
      }
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
  try {
    uhkTryArchiveFinalSubmissionPdf_(
      ss,
      body.competitionId,
      newId,
      fd2,
      body.applicantEmail,
      body.applicantName,
      now
    );
  } catch (archE) {
    console.error("uhkTryArchiveFinalSubmissionPdf_: " + archE.message);
  }
  return { success: true };
}

/**
 * CONFIG jako mapa klíč→hodnota (stejná logika jako getCompetitions: absorbConfigRow po všech řádcích).
 * Dřívější varianta četla jen sloupce B/C od řádku HEADER_ROW → např. total_allocation_czk chybělo.
 */
function getConfigMap(ss) {
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheet) return {};
  const cfg = {};
  sheet.getDataRange().getValues().forEach(function (row) {
    absorbConfigRow(cfg, row);
  });
  return cfg;
}
