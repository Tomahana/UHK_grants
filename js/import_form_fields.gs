/**
 * Spusť tuto funkci JEDNOU ručně v Apps Script editoru:
 * importConnectFormFields()
 * importRegaFormFields()
 */

function importConnectFormFields() {
  const ss    = SpreadsheetApp.openById("1maDTXF8xKCpSY0LfeNcRyLo1KtulgipEIwQaIGb3Su0");
  let sheet   = ss.getSheetByName("📝 FORM_FIELDS");
  if (!sheet) sheet = ss.insertSheet("📝 FORM_FIELDS");
  sheet.clearContents();

  const rows = [
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["field_id","field_label","field_type","required","order","placeholder","options","help_text"],
    ["section_basic","Základní informace","section_header","","1","","",""],
    ["project_title","Název projektu / aktivity","text","TRUE","2","Výstižný název mobility nebo síťovací aktivity","",""],
    ["faculty","Součást UHK","select","TRUE","3","","PřF;PdF;FF;FIM;FVZ;REKTORÁT",""],
    ["department","Katedra / pracoviště","text","TRUE","4","","",""],
    ["applicant_type","Typ žadatele","radio","TRUE","5","","Junior/early-career researcher (do 7 let od Ph.D.);Student doktorského studia",""],
    ["phd_year","Rok získání Ph.D.","number","FALSE","6","např. 2020","","Povinné pro akademické pracovníky"],
    ["section_activity","Popis aktivity","section_header","","7","","",""],
    ["activity_type","Typ aktivity","select","TRUE","8","","Mobilita (výjezd);Pracovní setkání;Konference;Workshop;Školení;Konzultace;Jiné",""],
    ["activity_goal","Cíl aktivity","textarea","TRUE","9","Popište konkrétní cíl a přínos aktivity","","Prokazatelné navázání či rozvoj spolupráce"],
    ["partner_institution","Partnerská instituce","text","TRUE","10","Název instituce / organizace","",""],
    ["partner_country","Země","text","TRUE","11","","",""],
    ["partner_contact","Kontaktní osoba u partnera","text","FALSE","12","Jméno a pozice","",""],
    ["activity_start","Plánovaný začátek aktivity","date","TRUE","13","","","Nejpozději 1. 11. 2026"],
    ["activity_end","Plánovaný konec aktivity","date","TRUE","14","","","Nejpozději 15. 11. 2026"],
    ["section_output","Výstup spolupráce","section_header","","15","","",""],
    ["expected_output","Očekávaný výstup","select","TRUE","16","","Rozpracovaný článek;Letter of Intent / MoU;Protokol z konzultace;Draft výzkumného designu;Plán navazující mobility;Projektová ideová skica;Jiné",""],
    ["output_description","Popis výstupu","textarea","TRUE","17","Konkrétně popište výstup spolupráce","",""],
    ["section_budget","Rozpočet","section_header","","18","","",""],
    ["budget_travel","Jízdné (Kč)","number","FALSE","19","","","Vlak, letadlo, auto dle interních předpisů"],
    ["budget_accommodation","Ubytování (Kč)","number","FALSE","20","","","Dle interních předpisů UHK"],
    ["budget_meals","Stravné (Kč)","number","FALSE","21","","","Dle kalkulačky stravného"],
    ["budget_local","Místní doprava (Kč)","number","FALSE","22","","",""],
    ["budget_fee","Poplatek za konferenci/workshop (Kč)","number","FALSE","23","","",""],
    ["budget_publication","Publikační náklady (Kč)","number","FALSE","24","","",""],
    ["budget_total","Celková požadovaná podpora (Kč)","number","TRUE","25","","","Max. 80 000 Kč"],
    ["budget_justification","Odůvodnění rozpočtu","textarea","TRUE","26","","","Vazba jednotlivých položek na projekt"],
    ["section_attachments","Přílohy","section_header","","27","","",""],
    ["attach_invitation","Doklad o spolupráci","file","TRUE","28","","pdf","Pozvání, LoI, potvrzení e-mailu nebo registrace"],
    ["attach_budget_template","Rozpočet dle šablony","file","TRUE","29","","pdf,xlsx","Příloha č. 1 výzvy"],
    ["declaration","Prohlášení žadatele","checkbox","TRUE","30","","","Souhlasím s podmínkami Soutěže UHK Connect a potvrzuji správnost údajů"],
  ];

  sheet.getRange(1, 1, rows.length, 8).setValues(rows);

  // Formátování záhlaví
  sheet.getRange(4, 1, 1, 8).setBackground("#1C2E5A").setFontColor("white").setFontWeight("bold");
  // Section headers zvýraznit
  const sectionRows = [5, 11, 19, 22, 31];
  sectionRows.forEach(r => {
    sheet.getRange(r, 1, 1, 8).setBackground("#E8EDF8").setFontWeight("bold");
  });
  sheet.setFrozenRows(4);
  sheet.autoResizeColumns(1, 8);

  SpreadsheetApp.getUi().alert("✅ FORM_FIELDS pro Connect importovány (" + (rows.length-4) + " polí)");
}

function importRegaFormFields() {
  const ss    = SpreadsheetApp.openById("1VU3c_gwxjbuZuNQ5_B1iqlbGzOgLwtUXUAI-E2dt6EA");
  let sheet   = ss.getSheetByName("📝 FORM_FIELDS");
  if (!sheet) sheet = ss.insertSheet("📝 FORM_FIELDS");
  sheet.clearContents();

  const rows = [
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["field_id","field_label","field_type","required","order","placeholder","options","help_text"],
    ["section_basic","Základní informace","section_header","","1","","",""],
    ["project_title","Název projektu","text","TRUE","2","Název původního projektu podaného do GA ČR","","Uveďte přesný název tak jak byl podán"],
    ["original_agency","Cílová externí soutěž","select","TRUE","3","","GA ČR;TAČR;MŠMT;Jiný","Primárně GA ČR"],
    ["original_call","Označení výzvy","text","TRUE","4","např. GA 25-XXXXX","","Číslo původní výzvy"],
    ["submission_date","Datum původního podání","date","TRUE","5","","",""],
    ["applicant_role","Role žadatele v projektu","radio","TRUE","6","","Hlavní řešitel (PI);Spoluřešitel",""],
    ["faculty","Součást UHK","select","TRUE","7","","PřF;PdF;FF;FIM;FVZ;REKTORÁT",""],
    ["department","Katedra / pracoviště","text","TRUE","8","","",""],
    ["section_team","Řešitelský tým","section_header","","9","","",""],
    ["team_members","Členové týmu","textarea","FALSE","10","Jméno, pracoviště, role v projektu","","Jeden člen na řádek"],
    ["section_project","O projektu","section_header","","11","","",""],
    ["project_abstract","Abstrakt projektu","textarea","TRUE","12","","","Max. 500 slov"],
    ["research_area","Vědní oblast","select","TRUE","13","","Přírodní vědy;Technické vědy;Lékařské vědy;Společenské vědy;Humanitní vědy","Dle klasifikace GA ČR"],
    ["section_revision","Plán dopracování","section_header","","14","","",""],
    ["revision_plan","Popis plánovaných úprav","textarea","TRUE","15","Stručný popis úprav v reakci na posudky (max. 1 strana)","","Reagujte konkrétně na připomínky posudků"],
    ["resubmission_call","Cílová výzva pro znovupodání","text","TRUE","16","např. GA ČR 2027","","První výzva umožňující opakované podání"],
    ["resubmission_date","Předpokládaný termín podání","date","TRUE","17","","",""],
    ["section_budget","Rozpočet","section_header","","18","","",""],
    ["budget_personnel_pi","A. Osobní náklady – řešitel (Kč)","number","TRUE","19","","","DPP/DPČ za vědeckou práci"],
    ["budget_personnel_admin","B. Osobní náklady – administrativa (Kč)","number","FALSE","20","","","Max. 5 000 Kč/měsíc"],
    ["budget_material","C. Materiální náklady (Kč)","number","FALSE","21","","","Literatura, kancelářský materiál"],
    ["budget_travel","D. Cestovní náklady (Kč)","number","FALSE","22","","","Služební cesty"],
    ["budget_other","E. Ostatní služby (Kč)","number","FALSE","23","","","APC, konference, korektura"],
    ["budget_total","Celková požadovaná podpora (Kč)","number","TRUE","24","","","Max. 500 000 Kč"],
    ["budget_justification","Odůvodnění rozpočtu","textarea","TRUE","25","","","Vazba jednotlivých položek na projekt"],
    ["section_attachments","Povinné přílohy","section_header","","26","","",""],
    ["attach_original","Původní návrh projektu","file","TRUE","27","","pdf","Původní verze podaná do GA ČR"],
    ["attach_reviews","Posudky z hodnocení","file","TRUE","28","","pdf","Všechny posudky + vyrozumění"],
    ["attach_budget","Vzor rozpočtu (příloha č. 2)","file","TRUE","29","","pdf,xlsx","Dle šablony výzvy"],
    ["declaration","Prohlášení žadatele","checkbox","TRUE","30","","","Souhlasím s podmínkami soutěže UHK ReGa a potvrzuji správnost údajů"],
  ];

  sheet.getRange(1, 1, rows.length, 8).setValues(rows);
  sheet.getRange(4, 1, 1, 8).setBackground("#1C2E5A").setFontColor("white").setFontWeight("bold");
  const sectionRows = [5, 13, 15, 18, 22, 30];
  sectionRows.forEach(r => {
    if (r <= rows.length) sheet.getRange(r, 1, 1, 8).setBackground("#E8EDF8").setFontWeight("bold");
  });
  sheet.setFrozenRows(4);
  sheet.autoResizeColumns(1, 8);

  SpreadsheetApp.getUi().alert("✅ FORM_FIELDS pro ReGa importovány (" + (rows.length-4) + " polí)");
}
