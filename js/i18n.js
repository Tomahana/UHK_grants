/**
 * UHK Grant Manager – i18n (cs / en)
 * Volitelné: ?lang=en nebo ?lang=cs v URL (uloží se do localStorage).
 * Klíč: tečková notace, např. I18n.t("login.welcome")
 */
(function (global) {
  "use strict";

  var STORAGE = "uhk_lang";

  function deepGet(obj, path) {
    return path.split(".").reduce(function (o, k) {
      return o != null ? o[k] : undefined;
    }, obj);
  }

  var MESSAGES = {
    cs: {
      common: { signedIn: "Přihlášen:" },
      lang: { label: "Jazyk", switchCs: "CS", switchEn: "EN" },
      nav: {
        grantsHub: "Grantové soutěže",
        logout: "Odhlásit",
        switchRole: "⇄ Role",
        switchRoleTitle: "Přepnout roli",
        logoutTitle: "Odhlásit se",
        backHub: "← Rozcestník",
        backDashboard: "← Rozcestník",
      },
      meta: {
        login: "Přihlášení – UHK Grantové soutěže",
        dashboard: "Rozcestník – UHK Grantové soutěže",
        adminUsers: "Správa uživatelů – UHK Granty",
        adminComp: "Nastavení soutěží – UHK Granty",
        coordinator: "Správa přihlášek – UHK Granty",
        myProjects: "Moje projekty – UHK Granty",
        myConnect: "UHK Connect – Moje projekty",
        connectCloseout: "UHK Connect – část 2",
        applyConnect: "UHK Connect – Přihláška",
        applyRega: "UHK ReGa – Přihláška",
        applyPrestige: "UHK Prestige – Přihláška",
        reviewNavraty: "Hodnocení — OP JAK Návraty",
        reviewConnect: "Hodnocení – UHK Connect",
        connectCloseoutDoc: "Část 2 – závěr a vyúčtování – UHK Connect",
      },
      login: {
        brandLine1: "Interní systém pro správu",
        brandLine2: "výzkumných grantů",
        brandLine3: "Univerzity Hradec Králové",
        stepLogin: "Přihlášení",
        stepRole: "Výběr role",
        stepNew: "Nový účet",
        welcome: "Vítejte",
        sub: "Přihlaste se do systému UHK Grantové soutěže.",
        email: "E-mail",
        password: "Heslo",
        loginBtn: "Přihlásit se →",
        noAccess: "Nemáte přístup?",
        requestAccess: "Požádat o přístup",
        back: "← Zpět",
        backToLogin: "← Zpět na přihlášení",
        loggedAs: "Přihlášen jako",
        pickRoleTitle: "Vyberte roli",
        pickRoleSub: "Váš účet má přístup do více rolí.",
        newAccessTitle: "Nový přístup",
        newAccessSubHtml:
          "Vyplňte údaje. Účet se vytvoří okamžitě jako <strong>Žadatel / Řešitel</strong>.",
        regInfoHtml:
          "Účet bude mít roli <strong>Žadatel</strong>. Roli změní administrátor dle potřeby.",
        fullName: "Celé jméno",
        emailUhk: "E-mail (UHK)",
        passwordAgain: "Heslo znovu",
        pwdPlaceholder: "Minimálně 8 znaků",
        pwdRepeatPh: "Zopakujte heslo",
        createAccount: "Vytvořit účet →",
        successTitle: "Účet vytvořen!",
        successSubHtml:
          "Váš účet byl zaregistrován jako <strong>Žadatel / Řešitel</strong>.<br>Nyní se můžete přihlásit.",
        footerHelp: "Potíže s přihlášením? Kontaktujte administrátorku:",
        errEmail: "Zadejte e-mail.",
        errPassword: "Zadejte heslo.",
        errName: "Zadejte jméno.",
        errUhkEmail: "Musí být UHK adresa (@uhk.cz).",
        errPwdRules: "Min. 8 znaků, velké písmeno a číslo.",
        errPwdMatch: "Hesla se neshodují.",
        errConnection: "Chyba připojení. Zkuste to znovu.",
        errTimeout: "Server na odpověď příliš dlouho neodpověděl. Zkuste to znovu za chvíli.",
        errNoRoles:
          "Přihlášení proběhlo, ale server nevrátil žádnou roli. Obnovte stránku nebo kontaktujte správce.",
        errSessionStorage:
          "Prohlížeč blokuje úložiště relace (session). Povolte cookies/úložiště pro tuto stránku nebo vypněte režim anonymního prohlížení.",
        pwdHintBase: "Min. 8 znaků, 1 velké písmeno, 1 číslo",
        pwdWeak: "Příliš slabé",
        pwdWeak2: "Slabé",
        pwdOk: "Dobré",
        pwdStrong: "Silné ✓",
      },
      dashboard: {
        pickCompetition: "Vyberte soutěž, do které chcete vstoupit.",
        loading: "Načítám soutěže…",
        adminSection: "Administrace systému",
        adminUsers: "Správa uživatelů",
        adminUsersSub: "USERS · role · hesla",
        adminComp: "Nastavení soutěží",
        adminCompSub: "CONFIG · termíny · alokace",
        adminApps: "Správa přihlášek",
        adminAppsSub: "Přehled · stavy · mazání řádků",
        greetMorning: "Dobré ráno",
        greetAfternoon: "Dobré odpoledne",
        greetEvening: "Dobrý večer",
        emptyCompetitions: "Žádné aktivní soutěže",
        hidden: "SKRYTO",
        metaDeadline: "Uzávěrka",
        metaAllocation: "Alokace",
        metaApplications: "Přihlášky",
        budgetTitle: "Rozpočet výzvy",
        budgetAllocated: "Alokováno",
        budgetAssigned: "Přiděleno (prorektor)",
        budgetUsed: "Využito (žadatel)",
        budgetRemaining: "Zbývá z alokace",
        budgetFootConnect:
          "Přiděleno = schválené částky od prorektora. Využito (žadatel) = po uložení souhlasu s přidělením (část 1) u přihlášky – započítá se schválená podpora.",
        budgetFootOther:
          "Alokace z CONFIG této výzvy. Řádky přiděleno / využito (žadatel) v plné podobě sleduje aplikace u soutěže UHK Connect; u ostatních výzev doplňte čerpání v evidenci mimo tento přehled.",
        budgetLoadErr: "Přehled rozpočtu se nepodařilo načíst.",
        fundingLoading: "Načítám přehled rozpočtu…",
        modalTitle: "Přepnout roli",
        modalSub: "Přihlášen jako:",
        modalCancel: "Zrušit",
        roleCurrent: "Aktuální role",
        actionSubmit: "Podat přihlášku",
        actionMyApps: "Moje přihlášky",
        actionMyProjects: "Moje projekty",
        actionNoApply: "Soutěž nepřijímá přihlášky",
        actionReviewCommission: "Hodnocení komise",
        actionManageUsers: "Správa uživatelů",
        actionSettings: "Nastavení",
        actionManageApps: "Správa přihlášek",
        actionReview: "Hodnocení",
        actionApprove: "Schvalování",
        actionRate: "Hodnotit",
        actionOverview: "Přehled",
        actionReports: "Zprávy",
        actionEnter: "Vstoupit",
        competitionType: {
          UHK_CONNECT: "UHK Connect",
          UHK_REGA: "UHK ReGa",
          OP_JAK_NAVRATY: "OP JAK Návraty",
          UHK_PRESTIGE: "UHK Prestige",
          PRESTIGE_LARGE: "UHK Prestige – Velký projekt",
          NO_COST_ENTRY: "Horizon No-Cost Entry",
          prestige_large: "UHK Prestige – Velký projekt",
          no_cost_entry: "Horizon No-Cost Entry",
        },
      },
      auth: {
        accessDenied: "Přístup odepřen. Tato stránka vyžaduje roli: {{roles}}.",
        wrongCreds: "Nesprávné přihlašovací údaje.",
      },
      api: {
        fileReadError: "Soubor se nepodařilo načíst.",
        needLoginDownload: "Pro otevření PDF se přihlaste (session vypršela). Obnovte stránku a přihlaste se znovu.",
        downloadNetworkError:
          "Spojení při otevírání PDF selhalo (síť nebo blokovaný požadavek k serveru). Zkuste znovu; na firemní Wi‑Fi zkuste jiný prohlížeč nebo mobilní data. Pokud problém přetrvává, dejte vědět správci.",
      },
      roles: {
        ADMIN: { name: "Správce", desc: "Plný přístup – správa uživatelů a nastavení" },
        PROREKTOR: { name: "Prorektor", desc: "Nejvyšší schvalovací pravomoc" },
        KOMISAR: { name: "Člen komise", desc: "Hodnocení přihlášek" },
        TESTER: { name: "Tester", desc: "Vidí vše, nemůže měnit data" },
        ZADATEL: { name: "Žadatel", desc: "Podává přihlášky, sleduje stav žádostí" },
        RESITEL: { name: "Řešitel", desc: "Řeší schválený projekt, závěrečné zprávy" },
        READONLY: { name: "Jen čtení", desc: "Přehled bez možnosti změn" },
      },
      reviewNavraty: {
        topbarPage: "Hodnoticí komise",
        back: "← Zpět",
        logout: "Odhlásit",
      },
      coordinator: { signedInLabel: "Přihlášena:" },
      reviewConnect: {
        cnames: {
          uhk_connect_2026_v2: "UHK Connect – výzva č. 2",
          uhk_rega_2026_v1: "UHK ReGa – výzva č. 1",
          uhk_prestige_2026: "UHK Prestige 2026",
        },
        tabs: { h: "Hodnocení", p: "Výsledky", pr: "Prorektor" },
        listPanelH: "Přihlášky k hodnocení",
        loading: "Načítám…",
        listPanelApps: "Přihlášky",
        flowTitle: "Postup a lhůty (výzva Connect)",
        flowAdmin: "Administrátor – formální posouzení do 2 pracovních dnů, poté předání komisi (stav IN_REVIEW).",
        flowCommission: "Komise – hodnocení v tomto formuláři, lhůta <strong>5 pracovních dní</strong> od předání.",
        flowProrektor: "Prorektor – shrnující rozhodnutí (podpořit / zkrátit / zamítnout) do <strong>2 pracovních dnů</strong>.",
        flowEnd: "<strong>Ukončení aktivity</strong> nejpozději <strong>15.&nbsp;11.&nbsp;2026</strong>.",
        sepCritOverview: "Kritéria výzvy – přehled",
        critIntro: "Níže máte u každého kritéria plné znění a škálu 1–5. Odůvodnění pište do pole komentáře u kritéria.",
        sepCritEval: "Hodnocení po kritériích",
        sepComments: "Komentáře",
        lblCommentApplicant: "Komentář pro žadatele",
        hintApplicantSees: "Žadatel tento komentář uvidí",
        phCommentPub: "Celkové zhodnocení…",
        lblInternalNote: "Interní poznámka",
        phCommentInt: "Interní poznámka…",
        sepRecommendation: "Doporučení",
        recSupport: "Podpořit",
        recSupportSub: "Doporučuji financovat",
        recCut: "Krátit rozpočet",
        recCutSub: "Podpořit s nižší částkou",
        recReject: "Nepodpořit",
        recRejectSub: "Nedoporučuji financovat",
        btnCancel: "Zrušit",
        btnSaveReview: "Uložit hodnocení",
        btnSavingReview: "Ukládám…",
        resultsTitle: "Přehled hodnocení",
        resultsEmptyLoad: "Načtěte přihlášky.",
        prorektorDecisionTitle: "Rozhodnutí prorektora",
        prorektorDecisionSub: "Přehled hlasů komise a závěrečné stanovisko",
        prorektorEmptyLoad: "Načtěte přihlášky.",
        sidebarCompetition: "Soutěž",
        sidebarCompetitionHint: "5 kritérií · max. 25 bodů · škála u každého kritéria 1–5",
        sidebarBudgetTitle: "Rozpočet výzvy (Connect)",
        fundAllocTotal: "Alokováno celkem",
        fundAssignedAfterPr: "Přiděleno (po rozhodnutí prorektora)",
        fundUsedAfterConsent: "Využito (po souhlasu žadatele)",
        fundRemaining: "Zbývá z alokace",
        fundFootnote:
          "Přiděleno = součet schválených částek (u Podpořit obvykle žádost, u Krátit částka zadaná prorektorem). Využito = stejné projekty po uložení souhlasu žadatele v části 1 detailu přihlášky (závazná podpora se započítá jako čerpaná kapacita z pohledu žadatele).",
        sidebarScore: "Aktuální skóre",
        pointsOf25: "z 25 bodů",
        sidebarScoreHint: "Souhrn kritérií a zápis bodů je v hlavní oblasti po výběru přihlášky.",
        emptyApps: "Žádné přihlášky.",
        emptyAppsHint: "Koordinátorka musí přesunout přihlášky do IN_REVIEW.",
        listSubTpl: "{{apps}} přihlášek · {{revs}} hodnocení komise",
        badgeNew: "Nové",
        badgeDone: "Hodnoceno",
        badgeKomTpl: "{{n}}× komise",
        badgeNoKom: "Bez komise",
        detailApplicant: "Žadatel",
        detailFaculty: "Součást / katedra",
        detailApplicantType: "Typ žadatele",
        detailPhdYear: "Rok získání Ph.D.",
        detailJuniorPhdCheck: "Kontrola Junior / Ph.D. (interní)",
        detailActivityType: "Typ aktivity",
        detailPartner: "Partner",
        detailTerm: "Termín",
        detailBudget: "Rozpočet",
        detailResearchFocus: "Výzkumné zaměření",
        detailActivityGoal: "Cíl aktivity",
        detailCoopHistory: "Dosavadní kontakty",
        detailOutputDesc: "Popis výstupu",
        detailUhkBenefit: "Přínos pro UHK",
        detailOutputs5y: "Výstupy žadatele (5 let)",
        detailBudgetJust: "Odůvodnění rozpočtu",
        detailIrisCaseId: "IRIS UHK – referenční ID (UUID)",
        detailIrisChecklist: "IRIS UHK – souhrn (výsledek, Case / Intake ID, skóre)",
        critNotePh: "Komentář ke kritériu {{key}}…",
        toastRateCriteria: "Ohodnoťte kritéria: {{list}}",
        toastPickRec: "Vyberte doporučení.",
        toastReviewSaved: "Hodnocení uloženo – {{tot}}/25 bodů ✓",
        errPostVerify:
          "Odesláno, ale nepodařilo se ověřit uložení včas. Obnovte stránku tlačítkem ↺ a zkontrolujte záznam.",
        resTableProject: "Projekt",
        resTableFaculty: "Součást",
        resTableAvg: "Prům.",
        resTableCount: "Hod.",
        resTableRec: "Doporučení",
        resEmpty: "Zatím žádná hodnocení.",
        recLabelSupport: "✓ Podpořit",
        recLabelCut: "◐ Krátit",
        recLabelReject: "✕ Nepodpořit",
        recLabelCutLong: "◐ Krátit rozpočet",
        prKomEmpty: "Zatím žádné kompletní hodnocení komise (čeká se platné skóre 1–25 bodů).",
        prKomSep: "Hodnocení členů komise",
        prKomK15: "K1–K5:",
        prKomTotal: "Celkem:",
        prKomRec: "Doporučení:",
        prKomCommentLbl: "Komentář pro žadatele",
        prDecideSep: "Vaše rozhodnutí (prorektor)",
        prDecideIntro:
          "Vyberte závěr. U <strong>Krátit rozpočet</strong> vyplňte schválené částky <strong>u jednotlivých položek rozpočtu</strong> (součet ≤ plánovaného celku v přihlášce). U <strong>Podpořit</strong> se bere schválená podpora jako celkový rozpočet z přihlášky. Komentář uvidí žadatel u přihlášky.",
        prBtnSupport: "Podpořit",
        prBtnCut: "Krátit rozpočet",
        prBtnReject: "Nepodpořit",
        prAvgKom: "Prům. komise",
        prReviewsN: "hodnocení",
        prPlannedBudget: "Plánovaný rozpočet v přihlášce:",
        prCutPerLine:
          "U každé položky zadejte schválenou částku po krácení (0 až výše v žádosti). Žadatel uvidí stejné rozložení v části souhlasu.",
        prThLine: "Položka",
        prThRequested: "V žádosti (Kč)",
        prThApproved: "Schváleno (Kč)",
        prThSumApproved: "Součet schválených (Kč)",
        prCommentLabel: "Komentář k rozhodnutí",
        prCommentPh: "Závěrečné stanovisko…",
        prSaveDecision: "Uložit rozhodnutí",
        prSavedPrefix: "Již uloženo",
        prEmptyCards: "Žádné přihlášky.",
        prCutNoLines:
          "V přihlášce nejsou vyplněny dílčí položky rozpočtu – použijte úpravu přihlášky nebo kontaktujte správce.",
        toastPickDec: "Vyberte Podpořit / Krátit / Nepodpořit.",
        toastLineRange: "U položky „{{item}}“ zadejte částku 0 až {{max}} {{unit}}.",
        toastNoCutLines: "V přihlášce chybí dílčí položky rozpočtu – krácení po řádcích nelze uložit.",
        toastCutSumPositive: "U Krátit rozpočet musí být součet schválených položek větší než 0.",
        toastSumExceeds: "Součet schválených položek nesmí překročit celkový rozpočet v přihlášce.",
        toastNoAppBudget: "V přihlášce chybí platný celkový rozpočet.",
        toastDecSaved: "Rozhodnutí uloženo ✓",
        toastStatusSaved: "Stav uložen ✓",
        errSaveGeneric: "Chyba při ukládání.",
      },
      reviewConnectUi: { titlePrefix: "Hodnocení – " },
      applyRega: {
        bannerStrong: "Interní soutěž UHK ReGa",
        bannerText:
          "– podpora dopracování a znovupodání nezafinancovaných projektů GA ČR. Max. podpora 500 000 Kč · Doba řešení 7,5 měsíce (15. 4. – 30. 11. 2026)",
        bannerDeadline: "Uzávěrka: 1. 4. 2026 · 8:00",
        loadingForm: "Načítám formulář…",
        sidebarStatus: "Stav přihlášky",
        sidebarCompetition: "Soutěž",
        sidebarCompetitionVal: "UHK ReGa 2026",
        sidebarDeadline: "Uzávěrka",
        sidebarDeadlineVal: "1. 4. 2026",
        sidebarMax: "Max. podpora",
        sidebarMaxVal: "500 000 Kč",
        sidebarDuration: "Doba řešení",
        sidebarDurationVal: "7,5 měsíce",
        sidebarSaved: "Uloženo",
        sidebarSupport: "Požadovaná podpora",
        sidebarOfMax: "z max. 500 000 Kč",
        sidebarChecklist: "Kontrolní seznam",
        eligibilityTitle: "Podmínka způsobilosti",
        eligibilityText: "Přihláška musí obsahovat posudky z hodnocení. Bez posudků je formálně nezpůsobilá.",
        contactTitle: "Kontakt",
        stepProject: "Projekt",
        stepTeam: "Tým",
        stepRevision: "Dopracování",
        stepBudget: "Rozpočet",
        stepAttachments: "Přílohy",
        panelBasicTitle: "Základní informace o projektu",
        panelBasicSub: "Krok 1 z 5 · Identifikace původního projektu",
        panelTeamTitle: "Řešitelský tým",
        panelTeamSub: "Krok 2 z 5 · Složení týmu a partneři",
        panelRevisionTitle: "Plán dopracování",
        panelRevisionSub: "Krok 3 z 5 · Reakce na posudky, plánované úpravy",
        panelBudgetTitle: "Rozpočet interní podpory",
        panelBudgetSub: "Krok 4 z 5 · Způsobilé náklady dle přílohy č. 1 výzvy",
        panelAttachTitle: "Povinné přílohy",
        panelAttachSub: "Krok 5 z 5 · Nahrajte všechny povinné dokumenty",
        footerUnsaved: "Neuloženo",
        footerBack: "← Zpět",
        footerSaveDraft: "💾 Uložit rozdělaný",
        footerContinue: "Pokračovat →",
        footerSubmit: "Odeslat přihlášku →",
        footerSavedAt: "Uloženo {{time}}",
        toastDraftSaved: "Draft uložen ✓",
        toastSaveFailed: "Ukládání selhalo.",
        toastSaveFailedNetwork:
          "Spojení se serverem se nepodařilo (síť nebo blokování požadavku). Zkuste znovu; při velkém PDF uložte nejdřív text formuláře, pak nahrajte soubor.",
        validateRequiredAll: "Vyplňte prosím všechna povinná pole.",
        toastConfirmDeclaration: "Potvrďte prohlášení žadatele.",
        submitSending: "Odesílám…",
        submitSuccessTitle: "Přihláška odeslána!",
        submitSuccessP1: "Vaše přihláška do UHK ReGa 2026 byla úspěšně podána.",
        submitSuccessP2Html:
          "Výsledky hodnocení budou zveřejněny do 13. 4. 2026.<br>Kontakt: <a href=\"mailto:jana.kukakova@uhk.cz\" style=\"color:var(--purple);\">jana.kukakova@uhk.cz</a>",
        submitBackDash: "← Zpět na rozcestník",
        submitError: "Chyba při odesílání – zkuste znovu.",
        submitSuccessToast: "Přihláška úspěšně odeslána! ✓",
        draftLoadedToast: "Načten uložený draft.",
      },
      applyFlow: {
        selectPlaceholder: "— Vyberte —",
        fieldErrRequired: "Toto pole je povinné.",
        fieldErrFile: "Nahrajte prosím soubor.",
        filePick: "Klikněte pro výběr souboru",
        fileFormat: "Formát:",
        stepOf: "Krok {{n}} z {{total}}",
        footerDirty: "Neuloženo…",
        saveDraftTitle: "Uloží rozpracovanou přihlášku jako koncept (draft) na server.",
        prorektorHeading: "Stanovisko prorektora",
        recordedPrefix: "Zapsáno:",
        appRefPrefix: "Přihláška",
        appTitleFallback: "Vaše přihláška",
        appIdLabel: "ID přihlášky:",
        statusLabel: "Aktuální stav:",
        outcomeWaitRecorded: "Jakmile bude rozhodnutí prorektora zapsáno, zobrazí se zde i v postranním panelu po obnovení stránky.",
        outcomeAfterReview: "Po dokončení hodnocení a rozhodnutí prorektora se zde zobrazí závěr a komentář.",
        draftNotePrefix: "Máte také rozpracovaný",
        draftNoteStrong: "koncept (draft)",
        draftNoteContinue: "Pokračovat v konceptu →",
        myProjects: "← Moje projekty",
        hub: "Rozcestník",
        valActEndBeforeStart: "Konec aktivity musí být ve stejný den nebo po začátku.",
        valActStartMax: "Začátek aktivity musí být nejpozději {{date}} (dle výzvy).",
        valActEndMax: "Konec aktivity musí být nejpozději {{date}} (dle výzvy).",
        toastBudgetOverMax: "Celkový rozpočet překračuje povolené maximum.",
        toastBudgetJust: "Doplňte odůvodnění rozpočtu.",
        toastBudgetSumPositive: "Součet rozpočtu musí být větší než 0 Kč.",
        toastBudgetSumMax: "Součet rozpočtu překračuje maximum {{amount}} (rok 1).",
        irisChecklistItem: "IRIS UHK (ref. ID UUID + souhrn z IRIS)",
        irisRequiredToast: "Vyplňte referenční ID IRIS UHK (UUID z potvrzení) a souhrn z IRIS (povinná součást přihlášky).",
        submittedAttachmentsTitle: "Přílohy u podané přihlášky",
        submittedAttachmentsFootnote:
          "Jde o údaje uložené při podání. PDF nahrané z počítače je v tabulce soutěže (list APPLICATION_FILE_BLOBS), ne na sdíleném Disku — prázdná složka z dokumentace výzvy tedy neznamená, že příloha chybí. Otevřete „Otevřít PDF“ po přihlášení. Odkaz https:// na jiný web lze otevřít v novém okně.",
        submittedAttachmentsNone:
          "U příloh není v evidenci uložen název souboru ani odkaz (pole zůstalo prázdné nebo se data nepodařilo načíst).",
        submittedAttachmentOpenLink: "Otevřít odkaz",
        submittedAttachmentOpenPdf: "Otevřít PDF",
        submittedAttachmentDrivePreview: "Náhled na Disku",
        submittedAttachmentSheetDownload: "Stáhnout z aplikace",
        submittedAttachmentDriveStaleShort:
          "Údaj v přihlášce vypadá jako starý odkaz na Google Disk — ten už obvykle nefunguje. Nahrajte PDF znovu v aplikaci (koncept), nebo zkuste původní odkaz níže.",
        submittedAttachmentTryOriginalLink: "Zkusit původní odkaz",
        fileField_attach_invitation: "Doklad o spolupráci",
        fileField_attach_annex1: "Příloha 1",
        fileField_attach_annex2: "Příloha 2",
        fileField_attach_annex3: "Příloha 3",
        phdJuniorNoteMissingYear:
          "Typ Junior/early-career: doplňte rok získání Ph.D. Interně se ověří vůči roku uzávěrky přihlášek ({{deadlineYear}}) — max. 7 let po Ph.D.",
        phdJuniorNoteInvalidYear: "Zadejte platný rok získání Ph.D. (např. 2020).",
        phdJuniorNoteWithin:
          "Interní poznámka pro komisi / správce: od roku Ph.D. ({{phdYear}}) do uzávěrky přihlášek ({{deadlineYear}}) uplynulo {{years}} let — v limitu 7 let.",
        phdJuniorNoteOver:
          "Interní poznámka pro komisi / správce: od roku Ph.D. ({{phdYear}}) do uzávěrky přihlášek ({{deadlineYear}}) uplynulo {{years}} let (nad 7 let) — ověřte splnění kritéria junior/early-career.",
      },
      applyConnect: {
        loadingForm: "Načítám formulář…",
        sidebarStatus: "Stav přihlášky",
        sidebarCompetition: "Soutěž",
        sidebarCompetitionVal: "UHK Connect 2026",
        sidebarDeadlineApply: "Uzávěrka přihlášek",
        sidebarMaxSupport: "Max. podpora",
        sidebarMaxVal: "80 000 Kč",
        sidebarSaved: "Uloženo",
        autosaveNoteHtml:
          "Koncept se ukládá <strong>automaticky po 30 s</strong> nečinnosti; ručně použijte „Uložit draft“.",
        termsTitle: "Termíny výzvy",
        termsFootnote:
          "Údaje odpovídají zadání soutěže UHK Connect (výzva č. 2); pro závazné znění použijte oficiální dokument na webu UHK / pokyny OVTZ",
        budgetCardTitle: "Rozpočet",
        budgetOfMax: "z max. 80 000 Kč",
        checklistTitle: "Kontrolní seznam",
        helpTitle: "Potřebujete pomoc?",
        submitSuccessTitle: "Přihláška odeslána!",
        submitSuccessP:
          "Vaše přihláška do soutěže UHK Connect 2026 byla úspěšně podána.<br>O dalším postupu Vás informujeme e-mailem. Po rozhodnutí prorektora uvidíte závěr a komentář zde (Moje projekty) po opětovném otevření této stránky.",
        submitBackDash: "← Zpět na rozcestník",
        personnelBadge: "výjimečně",
        stepBasic: "Základní info",
        stepProfile: "Profil & aktivita",
        stepIris: "IRIS UHK",
        stepOutput: "Výstup",
        stepBudget: "Rozpočet",
        stepAttachments: "Přílohy",
        fileUploading: "Nahrávám PDF…",
        fileUploadOk:
          "Příloha je uložena do tabulky soutěže (záloha), protože upload na Disk se nepodařil. Otevřete ji tlačítkem „Otevřít PDF“ níže.",
        fileUploadOkDrive:
          "Příloha je uložena na Google Disk přes aplikaci (složka účtu webové aplikace). Otevřete ji tlačítkem „Otevřít PDF“ níže.",
        fileUploadDriveFallbackDetail:
          "Soubor je jen v tabulce (záloha). Disk: {{err}} — zkontrolujte sdílení složky s účtem Web App (Execute as) nebo oprávnění Disku.",
        fileUploadErr: "Nahrání přílohy se nepodařilo.",
        fileUploadBadResponse:
          "Server po nahrání nevrátil platný JSON (prázdná nebo HTML odpověď). Zkuste menší PDF, obnovte stránku nebo zkontrolujte nasazení Web Appu.",
        fileUploadHttpErr: "Server odpověděl chybou HTTP {{status}}. Zkuste znovu nebo kontaktujte správce.",
        fileUploadOldScriptHint:
          "Na Google pravděpodobně běží starší verze skriptu bez akce upload. Znovu nasaďte Web App z aktuálního kódu. Detail:",
        fileUploadFormNotStored:
          "Příloha je na Disku, ale nepodařilo se ji zapsat do přihlášky v tabulce. Obnovte stránku; pokud po obnovení chybí, znovu nasaďte Web App (aktuální skript zapisuje odkaz hned po nahrání).",
        fileUploadedDriveLabel: "PDF na Disku",
        fileUploadedDriveApiLabel: "PDF na Disku (nahráno aplikací)",
        fileUploadedAppStorageLabel: "PDF v tabulce (záloha)",
        filePdfOnly: "Povolen je pouze soubor ve formátu PDF.",
        fileTooBig: "Soubor je větší než 18 MB.",
        fileNeedDraftRetry:
          "Nejdřív se musí vytvořit koncept přihlášky. Zkuste soubor znovu za chvíli (po automatickém uložení) nebo klepněte na „Uložit draft“.",
        attachmentsStorageNote:
          "PDF z podacího formuláře se ukládá na Google Disk do složky nastavené pro webovou aplikaci (DriveApp). Volitelně lze v CONFIG zadat samostatné ID složky klíčem connect_application_attachments_folder_id; jinak se použije stejná složka jako u příloh části 2. Při výpadku Disku zůstane záloha v tabulce. Otevření je vždy přes „Otevřít PDF“ po přihlášení.",
      },
      applyPrestige: {
        loadingForm: "Načítám formulář…",
        sidebarStatus: "Stav přihlášky",
        sidebarCompetition: "Soutěž",
        sidebarCompetitionVal: "UHK Prestige",
        sidebarDeadlineApply: "Uzávěrka přihlášek",
        sidebarMaxY1: "Max. podpora (rok 1)",
        sidebarMaxVal: "1 000 000 Kč",
        sidebarSaved: "Uloženo",
        autosaveNoteHtml:
          "Koncept se ukládá <strong>automaticky po 30 s</strong> nečinnosti; ručně použijte „Uložit draft“.",
        termsTitle: "Termíny výzvy (1/2026)",
        termsFootnoteHtml:
          "Elektronické podání dle Vyhlášení výzvy č. 1/2026 UHK Prestige. Podvýzva <strong>Horizon No-Cost Entry</strong> (výzva 2/2026) bude v aplikaci doplněna – zatím viz samostatný dokument výzvy.",
        budgetCardTitle: "Rozpočet",
        budgetOfMax: "z max. 1 000 000 Kč (rok 1)",
        checklistTitle: "Kontrolní seznam",
        helpTitle: "Potřebujete pomoc?",
        submitSuccessTitle: "Přihláška odeslána!",
        submitSuccessP:
          "Vaše přihláška do soutěže <strong>UHK Prestige</strong> (Výzva 1/2026) byla úspěšně podána.<br>O dalším postupu Vás informujeme e-mailem. Stav přihlášky sledujte v přehledu <strong>Moje projekty</strong>.",
        submitBackDash: "← Zpět na rozcestník",
        stepIdent: "Identifikace",
        stepConcept: "Concept & excelence",
        stepStrategy: "Strategie & milníky",
        stepBudget: "Rozpočet",
        stepAttachments: "Přílohy",
      },
      postaward: {
        saveConsent: "Uložit souhlas",
        saveCompletion: "Uložit finální uzavření projektu",
        saveZzDraft: "Uložit koncept nyní",
        annex2Title: "Příloha 2 – závěrečná zpráva (struktura dle výzvy)",
        annex2Help:
          "Vyplňte podle znění výzvy / přílohy 2. Můžete použít jen tato pole, jen souvislý text níže, nebo obojí. Při <strong>finálním uzavření</strong> se text sloučí do jedné evidence (tabulka má omezenou velikost buňky). Soubory (Magion, výstupy) nahrávejte v sekci příloh níže.",
        annex2Summary: "Shrnutí / výsledek aktivity",
        annex2SummaryPh: "Stručně výsledek vůči cíli…",
        annex2Activity: "Popis průběhu realizace",
        annex2ActivityPh: "Průběh, milníky, případná omezení…",
        annex2Outputs: "Dosažené výstupy vůči plánu",
        annex2OutputsPh: "Co bylo dosaženo oproti plánovaným výstupům…",
        annex2Coop: "Spolupráce a partneři",
        annex2CoopPh: "Partneři, role, výsledky spolupráce…",
        annex2BudgetText: "Čerpání podpory a hospodárnost (slovní doplnění)",
        annex2BudgetTextPh: "Doplňte k tabulce skutečných částek výše…",
        annex2Dissem: "Diseminace / sdílení výsledků",
        annex2DissemPh: "Konference, publikace, interní přenos znalostí…",
        annex2Other: "Ostatní / doplnění dle výzvy",
        annex2OtherPh: "Cokoli dalšího požaduje příloha 2 nebo OVTZ…",
        annex2ReadonlyEmpty:
          "Strukturovaná pole přílohy 2 nebyla vyplněna odděleně; celý text může být v souvislé závěrečné zprávě níže.",
        zzDraftTitle: "Závěrečná zpráva – koncept",
        zzLabel: "Souvislý text závěrečné zprávy (doplnění k příloze 2)",
        zzDraftHelp:
          "Strukturovaná pole výše odpovídají příloze 2; níže můžete doplnit souvislý text. Koncept se ukládá automaticky (30 s) nebo tlačítkem. Při finálním uzavření musí být vyplněno <strong>celkem alespoň 80 znaků</strong> (součet polí + souvislý text).",
      },
      appStatuses: {
        DRAFT: { label: "Koncept" },
        SUBMITTED: { label: "Odesláno" },
        FORMAL_CHECK: { label: "Formální kontrola" },
        IN_REVIEW: { label: "V hodnocení" },
        CEKANI_NA_PRUBEZNOU_ZPRAVU: { label: "Čekání na průběžnou zprávu" },
        POSOUZENI_POKRACOVANI: { label: "Posouzení pokračování" },
        APPROVED: { label: "Schváleno" },
        REJECTED: { label: "Zamítnuto" },
        UKONCENO: { label: "Ukončeno" },
        WITHDRAWN: { label: "Staženo" },
      },
    },
    en: {
      common: { signedIn: "Signed in:" },
      lang: { label: "Language", switchCs: "CS", switchEn: "EN" },
      nav: {
        grantsHub: "Grant competitions",
        logout: "Log out",
        switchRole: "⇄ Role",
        switchRoleTitle: "Switch role",
        logoutTitle: "Log out",
        backHub: "← Hub",
        backDashboard: "← Hub",
      },
      meta: {
        login: "Sign in – UHK Grant competitions",
        dashboard: "Hub – UHK Grant competitions",
        adminUsers: "User management – UHK Grants",
        adminComp: "Competition settings – UHK Grants",
        coordinator: "Application management – UHK Grants",
        myProjects: "My projects – UHK Grants",
        myConnect: "UHK Connect – My projects",
        connectCloseout: "UHK Connect – Part 2",
        applyConnect: "UHK Connect – Application",
        applyRega: "UHK ReGa – Application",
        applyPrestige: "UHK Prestige – Application",
        reviewNavraty: "Review — OP JAK Návraty",
        reviewConnect: "Review – UHK Connect",
        connectCloseoutDoc: "Part 2 – close-out and accounting – UHK Connect",
      },
      login: {
        brandLine1: "Internal system for managing",
        brandLine2: "research grants",
        brandLine3: "University of Hradec Králové",
        stepLogin: "Sign in",
        stepRole: "Choose role",
        stepNew: "New account",
        welcome: "Welcome",
        sub: "Sign in to the UHK Grant competitions system.",
        email: "E-mail",
        password: "Password",
        loginBtn: "Sign in →",
        noAccess: "No access?",
        requestAccess: "Request access",
        back: "← Back",
        backToLogin: "← Back to sign in",
        loggedAs: "Signed in as",
        pickRoleTitle: "Choose a role",
        pickRoleSub: "Your account has more than one role.",
        newAccessTitle: "New access",
        newAccessSubHtml:
          "Fill in the details. The account is created immediately as <strong>Applicant / Grantee</strong>.",
        regInfoHtml:
          "The account will have the <strong>Applicant</strong> role. An administrator can change the role if needed.",
        fullName: "Full name",
        emailUhk: "E-mail (UHK)",
        passwordAgain: "Password again",
        pwdPlaceholder: "At least 8 characters",
        pwdRepeatPh: "Repeat password",
        createAccount: "Create account →",
        successTitle: "Account created!",
        successSubHtml:
          "Your account was registered as <strong>Applicant / Grantee</strong>.<br>You can sign in now.",
        footerHelp: "Sign-in issues? Contact the administrator:",
        errEmail: "Enter your e-mail.",
        errPassword: "Enter your password.",
        errName: "Enter your name.",
        errUhkEmail: "Must be a UHK address (@uhk.cz).",
        errPwdRules: "Min. 8 characters, one uppercase letter and one digit.",
        errPwdMatch: "Passwords do not match.",
        errConnection: "Connection error. Please try again.",
        errTimeout: "The server took too long to respond. Please try again in a moment.",
        errNoRoles:
          "Sign-in succeeded but the server returned no roles. Refresh the page or contact an administrator.",
        errSessionStorage:
          "The browser blocked session storage. Allow cookies/storage for this site or turn off private browsing.",
        pwdHintBase: "Min. 8 characters, 1 uppercase, 1 digit",
        pwdWeak: "Too weak",
        pwdWeak2: "Weak",
        pwdOk: "Good",
        pwdStrong: "Strong ✓",
      },
      dashboard: {
        pickCompetition: "Choose a competition to open.",
        loading: "Loading competitions…",
        adminSection: "System administration",
        adminUsers: "User management",
        adminUsersSub: "USERS · roles · passwords",
        adminComp: "Competition settings",
        adminCompSub: "CONFIG · deadlines · allocation",
        adminApps: "Application management",
        adminAppsSub: "Overview · statuses · row delete",
        greetMorning: "Good morning",
        greetAfternoon: "Good afternoon",
        greetEvening: "Good evening",
        emptyCompetitions: "No active competitions",
        hidden: "HIDDEN",
        metaDeadline: "Deadline",
        metaAllocation: "Allocation",
        metaApplications: "Applications",
        budgetTitle: "Competition budget",
        budgetAllocated: "Allocated",
        budgetAssigned: "Assigned (Vice-Rector)",
        budgetUsed: "Used (applicant)",
        budgetRemaining: "Remaining from allocation",
        budgetFootConnect:
          "Assigned = amounts approved by the Vice-Rector. Used (applicant) = after saving consent to assignment (Part 1) on the application — counts approved support.",
        budgetFootOther:
          "Allocation from this competition’s CONFIG. Full assigned/used tracking is available in the app for UHK Connect; for other calls, record drawdown elsewhere.",
        budgetLoadErr: "Could not load budget summary.",
        fundingLoading: "Loading budget summary…",
        modalTitle: "Switch role",
        modalSub: "Signed in as:",
        modalCancel: "Cancel",
        roleCurrent: "Current role",
        actionSubmit: "Submit application",
        actionMyApps: "My applications",
        actionMyProjects: "My projects",
        actionNoApply: "Competition is not accepting applications",
        actionReviewCommission: "Commission review",
        actionManageUsers: "User management",
        actionSettings: "Settings",
        actionManageApps: "Application management",
        actionReview: "Review",
        actionApprove: "Approval",
        actionRate: "Evaluate",
        actionOverview: "Overview",
        actionReports: "Reports",
        actionEnter: "Open",
        competitionType: {
          UHK_CONNECT: "UHK Connect",
          UHK_REGA: "UHK ReGa",
          OP_JAK_NAVRATY: "OP JAK Returns",
          UHK_PRESTIGE: "UHK Prestige",
          PRESTIGE_LARGE: "UHK Prestige – Large Project",
          NO_COST_ENTRY: "Horizon No-Cost Entry",
          prestige_large: "UHK Prestige – Large Project",
          no_cost_entry: "Horizon No-Cost Entry",
        },
        competitionCard: {
          uhk_navraty_2026: {
            name: "OP JAK Returns 2026",
            desc: "Evaluation of OP JAK Returns projects – UHK IGA commission.",
          },
          uhk_connect_2026_v2: {
            name: "UHK Connect – call no. 2",
            desc: "Short projects for networking, mobility, and building collaboration.",
          },
          uhk_rega_2026_v1: {
            name: "UHK ReGa – call no. 1",
            desc: "Support for revising and resubmitting unfunded GA ČR projects.",
          },
          uhk_prestige_2026: {
            name: "UHK Prestige – call 1/2026",
            desc: "Preparing a proposal for ERC or Horizon Europe; call allocation CZK 4M, up to CZK 1M per project in year 1.",
          },
        },
      },
      auth: {
        accessDenied: "Access denied. This page requires one of these roles: {{roles}}.",
        wrongCreds: "Invalid sign-in details.",
      },
      api: {
        fileReadError: "Could not read the file.",
        needLoginDownload: "Sign in again to open the PDF (session expired). Refresh the page and log in.",
        downloadNetworkError:
          "The connection failed while opening the PDF (network or blocked request). Try again; on a corporate network try another browser or mobile data. Contact an administrator if it keeps happening.",
      },
      roles: {
        ADMIN: { name: "Administrator", desc: "Full access – users and settings" },
        PROREKTOR: { name: "Vice-Rector for R&D", desc: "Highest approval authority" },
        KOMISAR: { name: "Panel member", desc: "Application evaluation" },
        TESTER: { name: "Tester", desc: "Read-only testing access" },
        ZADATEL: { name: "Applicant", desc: "Submits applications, tracks status" },
        RESITEL: { name: "Grantee", desc: "Runs approved project, final reports" },
        READONLY: { name: "Read-only", desc: "Overview without edits" },
      },
      reviewNavraty: {
        topbarPage: "Evaluation panel",
        back: "← Back",
        logout: "Log out",
      },
      coordinator: { signedInLabel: "Signed in:" },
      reviewConnect: {
        cnames: {
          uhk_connect_2026_v2: "UHK Connect – call no. 2",
          uhk_rega_2026_v1: "UHK ReGa – call no. 1",
          uhk_prestige_2026: "UHK Prestige 2026",
        },
        tabs: { h: "Review", p: "Results", pr: "Vice-Rector" },
        listPanelH: "Applications to review",
        loading: "Loading…",
        listPanelApps: "Applications",
        flowTitle: "Process and deadlines (Connect call)",
        flowAdmin: "Administrator – formal assessment within 2 working days, then handover to the panel (status IN_REVIEW).",
        flowCommission: "Panel – evaluation in this form, deadline <strong>5 working days</strong> from handover.",
        flowProrektor: "Vice-Rector – summary decision (support / cut / reject) within <strong>2 working days</strong>.",
        flowEnd: "<strong>Activity end</strong> no later than <strong>15&nbsp;Nov&nbsp;2026</strong>.",
        sepCritOverview: "Call criteria – overview",
        critIntro: "Below each criterion shows full wording and a 1–5 scale. Add rationale in the comment field for each criterion.",
        sepCritEval: "Criterion-by-criterion scoring",
        sepComments: "Comments",
        lblCommentApplicant: "Comment for the applicant",
        hintApplicantSees: "The applicant will see this comment",
        phCommentPub: "Overall assessment…",
        lblInternalNote: "Internal note",
        phCommentInt: "Internal note…",
        sepRecommendation: "Recommendation",
        recSupport: "Support",
        recSupportSub: "Recommend funding",
        recCut: "Cut budget",
        recCutSub: "Support at a lower amount",
        recReject: "Do not support",
        recRejectSub: "Do not recommend funding",
        btnCancel: "Cancel",
        btnSaveReview: "Save review",
        btnSavingReview: "Saving…",
        resultsTitle: "Review overview",
        resultsEmptyLoad: "Load applications.",
        prorektorDecisionTitle: "Vice-Rector decision",
        prorektorDecisionSub: "Panel votes and final stance",
        prorektorEmptyLoad: "Load applications.",
        sidebarCompetition: "Competition",
        sidebarCompetitionHint: "5 criteria · max. 25 points · scale 1–5 per criterion",
        sidebarBudgetTitle: "Call budget (Connect)",
        fundAllocTotal: "Total allocated",
        fundAssignedAfterPr: "Assigned (after Vice-Rector decision)",
        fundUsedAfterConsent: "Used (after applicant consent)",
        fundRemaining: "Remaining from allocation",
        fundFootnote:
          "Assigned = sum of approved amounts (Support: usually full request; Cut: amount set by Vice-Rector). Used = same projects after applicant saves consent in Part 1 (counts as drawn capacity).",
        sidebarScore: "Current score",
        pointsOf25: "of 25 points",
        sidebarScoreHint: "Criterion summary and scores appear in the main area after you select an application.",
        emptyApps: "No applications.",
        emptyAppsHint: "The coordinator must move applications to IN_REVIEW.",
        listSubTpl: "{{apps}} applications · {{revs}} panel reviews",
        badgeNew: "New",
        badgeDone: "Reviewed",
        badgeKomTpl: "{{n}}× panel",
        badgeNoKom: "No panel review",
        detailApplicant: "Applicant",
        detailFaculty: "Faculty / department",
        detailApplicantType: "Applicant type",
        detailPhdYear: "Ph.D. award year",
        detailJuniorPhdCheck: "Junior / Ph.D. check (internal)",
        detailActivityType: "Activity type",
        detailPartner: "Partner",
        detailTerm: "Dates",
        detailBudget: "Budget",
        detailResearchFocus: "Research focus",
        detailActivityGoal: "Activity goal",
        detailCoopHistory: "Existing contacts",
        detailOutputDesc: "Output description",
        detailUhkBenefit: "Benefit for UHK",
        detailOutputs5y: "Applicant outputs (5 years)",
        detailBudgetJust: "Budget justification",
        detailIrisCaseId: "IRIS UHK – reference ID (UUID)",
        detailIrisChecklist: "IRIS UHK – summary (outcome, Case / Intake ID, score)",
        critNotePh: "Comment on criterion {{key}}…",
        toastRateCriteria: "Score all criteria: {{list}}",
        toastPickRec: "Select a recommendation.",
        toastReviewSaved: "Review saved – {{tot}}/25 points ✓",
        errPostVerify:
          "Submitted, but save could not be verified in time. Refresh with ↺ and check the record.",
        resTableProject: "Project",
        resTableFaculty: "Faculty",
        resTableAvg: "Avg.",
        resTableCount: "Rev.",
        resTableRec: "Recommendation",
        resEmpty: "No reviews yet.",
        recLabelSupport: "✓ Support",
        recLabelCut: "◐ Cut",
        recLabelReject: "✕ Reject",
        recLabelCutLong: "◐ Cut budget",
        prKomEmpty: "No complete panel reviews yet (waiting for valid score 1–25).",
        prKomSep: "Panel member reviews",
        prKomK15: "K1–K5:",
        prKomTotal: "Total:",
        prKomRec: "Recommendation:",
        prKomCommentLbl: "Comment for applicant",
        prDecideSep: "Your decision (Vice-Rector)",
        prDecideIntro:
          "Choose the outcome. For <strong>Cut budget</strong>, enter approved amounts <strong>per budget line</strong> (sum ≤ planned total in the application). For <strong>Support</strong>, approved support equals the application total budget. The applicant will see the comment on the application.",
        prBtnSupport: "Support",
        prBtnCut: "Cut budget",
        prBtnReject: "Reject",
        prAvgKom: "Panel avg.",
        prReviewsN: "reviews",
        prPlannedBudget: "Planned budget in application:",
        prCutPerLine:
          "For each line enter the approved amount after the cut (0 up to requested). The applicant sees the same split in the consent step.",
        prThLine: "Line",
        prThRequested: "Requested (CZK)",
        prThApproved: "Approved (CZK)",
        prThSumApproved: "Sum approved (CZK)",
        prCommentLabel: "Comment on decision",
        prCommentPh: "Final statement…",
        prSaveDecision: "Save decision",
        prSavedPrefix: "Already saved",
        prEmptyCards: "No applications.",
        prCutNoLines:
          "No detailed budget lines in the application – edit the application or contact the administrator.",
        toastPickDec: "Choose Support / Cut / Reject.",
        toastLineRange: "For line \"{{item}}\", enter an amount from 0 to {{max}} {{unit}}.",
        toastNoCutLines: "Missing budget lines – line-by-line cut cannot be saved.",
        toastCutSumPositive: "For Cut budget, the sum of approved lines must be greater than 0.",
        toastSumExceeds: "The sum of approved lines must not exceed the application total budget.",
        toastNoAppBudget: "The application has no valid total budget.",
        toastDecSaved: "Decision saved ✓",
        toastStatusSaved: "Status saved ✓",
        errSaveGeneric: "Error while saving.",
      },
      reviewConnectUi: { titlePrefix: "Review – " },
      applyRega: {
        bannerStrong: "UHK ReGa internal call",
        bannerText:
          "– support for revising and resubmitting unfunded GA ČR projects. Max. support CZK 500,000 · Duration 7.5 months (15 Apr – 30 Nov 2026)",
        bannerDeadline: "Deadline: 1 Apr 2026 · 8:00",
        loadingForm: "Loading form…",
        sidebarStatus: "Application status",
        sidebarCompetition: "Competition",
        sidebarCompetitionVal: "UHK ReGa 2026",
        sidebarDeadline: "Deadline",
        sidebarDeadlineVal: "1 Apr 2026",
        sidebarMax: "Max. support",
        sidebarMaxVal: "CZK 500,000",
        sidebarDuration: "Duration",
        sidebarDurationVal: "7.5 months",
        sidebarSaved: "Saved",
        sidebarSupport: "Requested support",
        sidebarOfMax: "of max. CZK 500,000",
        sidebarChecklist: "Checklist",
        eligibilityTitle: "Eligibility requirement",
        eligibilityText: "The application must include review reports. Without reports it is formally ineligible.",
        contactTitle: "Contact",
        stepProject: "Project",
        stepTeam: "Team",
        stepRevision: "Revision plan",
        stepBudget: "Budget",
        stepAttachments: "Attachments",
        panelBasicTitle: "Basic project information",
        panelBasicSub: "Step 1 of 5 · Original project identification",
        panelTeamTitle: "Project team",
        panelTeamSub: "Step 2 of 5 · Team and partners",
        panelRevisionTitle: "Revision plan",
        panelRevisionSub: "Step 3 of 5 · Response to reviews, planned changes",
        panelBudgetTitle: "Internal support budget",
        panelBudgetSub: "Step 4 of 5 · Eligible costs per call annex no. 1",
        panelAttachTitle: "Mandatory attachments",
        panelAttachSub: "Step 5 of 5 · Upload all mandatory documents",
        footerUnsaved: "Not saved",
        footerBack: "← Back",
        footerSaveDraft: "💾 Save draft",
        footerContinue: "Continue →",
        footerSubmit: "Submit application →",
        footerSavedAt: "Saved {{time}}",
        toastDraftSaved: "Draft saved ✓",
        toastSaveFailed: "Save failed.",
        toastSaveFailedNetwork:
          "Could not reach the server (network or blocked request). Try again; for a large PDF save the form text first, then upload the file.",
        validateRequiredAll: "Please fill in all required fields.",
        toastConfirmDeclaration: "Please confirm the applicant declaration.",
        submitSending: "Submitting…",
        submitSuccessTitle: "Application submitted!",
        submitSuccessP1: "Your UHK ReGa 2026 application was submitted successfully.",
        submitSuccessP2Html:
          "Evaluation results will be published by 13 Apr 2026.<br>Contact: <a href=\"mailto:jana.kukakova@uhk.cz\" style=\"color:var(--purple);\">jana.kukakova@uhk.cz</a>",
        submitBackDash: "← Back to hub",
        submitError: "Submit error – please try again.",
        submitSuccessToast: "Application submitted successfully! ✓",
        draftLoadedToast: "Saved draft loaded.",
      },
      applyFlow: {
        selectPlaceholder: "— Select —",
        fieldErrRequired: "This field is required.",
        fieldErrFile: "Please upload a file.",
        filePick: "Click to choose a file",
        fileFormat: "Format:",
        stepOf: "Step {{n}} of {{total}}",
        footerDirty: "Not saved…",
        saveDraftTitle: "Saves your work-in-progress as a draft on the server.",
        prorektorHeading: "Vice-Rector’s decision",
        recordedPrefix: "Recorded:",
        appRefPrefix: "Application",
        appTitleFallback: "Your application",
        appIdLabel: "Application ID:",
        statusLabel: "Current status:",
        outcomeWaitRecorded: "Once the Vice-Rector’s decision is recorded, it will appear here and in the sidebar after you refresh the page.",
        outcomeAfterReview: "After evaluation and the Vice-Rector’s decision, the outcome and comment will appear here.",
        draftNotePrefix: "You also have a draft",
        draftNoteStrong: "work-in-progress",
        draftNoteContinue: "Continue draft →",
        myProjects: "← My projects",
        hub: "Hub",
        valActEndBeforeStart: "Activity end must be on or after the start date.",
        valActStartMax: "Activity start must be no later than {{date}} (per call).",
        valActEndMax: "Activity end must be no later than {{date}} (per call).",
        toastBudgetOverMax: "Total budget exceeds the allowed maximum.",
        toastBudgetJust: "Add budget justification.",
        toastBudgetSumPositive: "Budget total must be greater than 0 CZK.",
        toastBudgetSumMax: "Budget total exceeds the maximum of {{amount}} (year 1).",
        irisChecklistItem: "IRIS UHK (reference UUID + IRIS summary)",
        irisRequiredToast: "Enter the IRIS UHK reference ID (UUID from the confirmation) and the IRIS summary (required parts of the application).",
        submittedAttachmentsTitle: "Attachments on the submitted application",
        submittedAttachmentsFootnote:
          "This is what was stored at submission. PDFs uploaded from your computer live in the competition spreadsheet (APPLICATION_FILE_BLOBS), not in a shared Drive folder—an empty folder mentioned in the call text does not mean your attachment is missing. Use “Open PDF” while signed in. Other https:// links can be opened in a new tab.",
        submittedAttachmentsNone:
          "No file name or link is stored for attachments (the field was empty or data could not be loaded).",
        submittedAttachmentOpenLink: "Open link",
        submittedAttachmentOpenPdf: "Open PDF",
        submittedAttachmentDrivePreview: "Preview on Drive",
        submittedAttachmentSheetDownload: "Download from app",
        submittedAttachmentDriveStaleShort:
          "This looks like an old Google Drive link and usually no longer works. Re-upload the PDF in the app (draft), or try the original link below.",
        submittedAttachmentTryOriginalLink: "Try original link",
        fileField_attach_invitation: "Evidence of collaboration",
        fileField_attach_annex1: "Annex 1",
        fileField_attach_annex2: "Annex 2",
        fileField_attach_annex3: "Annex 3",
        phdJuniorNoteMissingYear:
          "Junior/early-career: enter your Ph.D. award year. For admin/commission review vs. the application deadline year ({{deadlineYear}}) — within 7 years after Ph.D.",
        phdJuniorNoteInvalidYear: "Enter a valid Ph.D. year (e.g. 2020).",
        phdJuniorNoteWithin:
          "Note for panel/admin: from Ph.D. year ({{phdYear}}) to the application deadline year ({{deadlineYear}}) is {{years}} years — within the 7-year limit.",
        phdJuniorNoteOver:
          "Note for panel/admin: from Ph.D. year ({{phdYear}}) to the application deadline year ({{deadlineYear}}) is {{years}} years (over 7) — please verify junior/early-career eligibility.",
      },
      applyConnect: {
        loadingForm: "Loading form…",
        sidebarStatus: "Application status",
        sidebarCompetition: "Competition",
        sidebarCompetitionVal: "UHK Connect 2026",
        sidebarDeadlineApply: "Application deadline",
        sidebarMaxSupport: "Max. support",
        sidebarMaxVal: "CZK 80,000",
        sidebarSaved: "Saved",
        autosaveNoteHtml:
          "Your draft <strong>saves automatically after 30 s</strong> of inactivity; use <strong>Save draft</strong> to save manually.",
        termsTitle: "Call timeline",
        termsFootnote:
          "Information matches the UHK Connect call (call no. 2); for binding text use the official UHK document / R&D office instructions.",
        budgetCardTitle: "Budget",
        budgetOfMax: "of max. CZK 80,000",
        checklistTitle: "Checklist",
        helpTitle: "Need help?",
        submitSuccessTitle: "Application submitted!",
        submitSuccessP:
          "Your UHK Connect 2026 application was submitted successfully.<br>You will be informed by e-mail about next steps. After the Vice-Rector’s decision, the outcome and comment appear here (My projects) when you open this page again.",
        submitBackDash: "← Back to hub",
        personnelBadge: "exceptional",
        stepBasic: "Basic info",
        stepProfile: "Profile & activity",
        stepIris: "IRIS UHK",
        stepOutput: "Output",
        stepBudget: "Budget",
        stepAttachments: "Attachments",
        fileUploading: "Uploading PDF…",
        fileUploadOk:
          "The file was saved in the competition spreadsheet (fallback) because the Drive upload failed. Open it with “Open PDF” below.",
        fileUploadOkDrive:
          "The file was saved on Google Drive via the app (web-app account folder). Open it with “Open PDF” below.",
        fileUploadDriveFallbackDetail:
          "The file was stored in the spreadsheet only (fallback). Drive: {{err}} — check folder sharing with the Web App account (Execute as) or Drive permissions.",
        fileUploadErr: "Attachment upload failed.",
        fileUploadBadResponse:
          "The server did not return valid JSON after upload (empty or HTML). Try a smaller PDF, refresh, or check the Web App deployment.",
        fileUploadHttpErr: "The server returned HTTP {{status}}. Try again or contact an administrator.",
        fileUploadOldScriptHint:
          "The deployed Apps Script may be missing the upload action. Redeploy the Web App from the current code. Detail:",
        fileUploadFormNotStored:
          "The file is on Drive but could not be written into the application row in the sheet. Refresh; if it is still missing, redeploy the Web App (current script writes the link right after upload).",
        fileUploadedDriveLabel: "PDF on Drive",
        fileUploadedDriveApiLabel: "PDF on Drive (uploaded by the app)",
        fileUploadedAppStorageLabel: "PDF in spreadsheet (fallback)",
        filePdfOnly: "Only PDF files are allowed.",
        fileTooBig: "The file is larger than 18 MB.",
        fileNeedDraftRetry:
          "A draft application ID is required first. Try the file again in a moment (after autosave) or click “Save draft”.",
        attachmentsStorageNote:
          "PDFs from the Connect application form are stored on Google Drive in the folder configured for the web app (DriveApp). Optionally set a separate folder ID in CONFIG as connect_application_attachments_folder_id; otherwise the same folder as Connect part 2 attachments is used. If Drive fails, a spreadsheet backup is kept. Opening is always via “Open PDF” while signed in.",
      },
      applyPrestige: {
        loadingForm: "Loading form…",
        sidebarStatus: "Application status",
        sidebarCompetition: "Competition",
        sidebarCompetitionVal: "UHK Prestige",
        sidebarDeadlineApply: "Application deadline",
        sidebarMaxY1: "Max. support (year 1)",
        sidebarMaxVal: "CZK 1,000,000",
        sidebarSaved: "Saved",
        autosaveNoteHtml:
          "Your draft <strong>saves automatically after 30 s</strong> of inactivity; use <strong>Save draft</strong> to save manually.",
        termsTitle: "Call timeline (1/2026)",
        termsFootnoteHtml:
          "Electronic submission per UHK Prestige call announcement 1/2026. The <strong>Horizon No-Cost Entry</strong> sub-call (call 2/2026) will be added to the app – see the separate call document for now.",
        budgetCardTitle: "Budget",
        budgetOfMax: "of max. CZK 1,000,000 (year 1)",
        checklistTitle: "Checklist",
        helpTitle: "Need help?",
        submitSuccessTitle: "Application submitted!",
        submitSuccessP:
          "Your application to <strong>UHK Prestige</strong> (Call 1/2026) was submitted successfully.<br>You will be informed by e-mail. Track status in <strong>My projects</strong>.",
        submitBackDash: "← Back to hub",
        stepIdent: "Identification",
        stepConcept: "Concept & excellence",
        stepStrategy: "Strategy & milestones",
        stepBudget: "Budget",
        stepAttachments: "Attachments",
      },
      rolesPatch: {
        ADMIN: { label: "Administrator", description: "Full access – users, applications, settings" },
        PROREKTOR: { label: "Vice-Rector for R&D", description: "Final approval authority" },
        KOMISAR: { label: "Panel member", description: "Evaluation and review access" },
        TESTER: { label: "Tester", description: "Sees everything, cannot change data" },
        ZADATEL: { label: "Applicant", description: "Submits applications, tracks requests" },
        RESITEL: { label: "Grantee", description: "Runs the supported project, submits reports" },
        READONLY: { label: "Read-only", description: "Overview without changes" },
      },
      compStatuses: {
        OPEN: { label: "Open", desc: "Applications accepted" },
        RUNNING: { label: "Running", desc: "Review / implementation" },
        CLOSED: { label: "Closed", desc: "Competition closed" },
        DRAFT: { label: "Draft", desc: "Being prepared" },
      },
      appStatuses: {
        DRAFT: { label: "Draft" },
        SUBMITTED: { label: "Submitted" },
        FORMAL_CHECK: { label: "Formal check" },
        IN_REVIEW: { label: "Under review" },
        CEKANI_NA_PRUBEZNOU_ZPRAVU: { label: "Waiting for interim report" },
        POSOUZENI_POKRACOVANI: { label: "Continuation assessment" },
        APPROVED: { label: "Approved" },
        REJECTED: { label: "Rejected" },
        UKONCENO: { label: "Closed" },
        WITHDRAWN: { label: "Withdrawn" },
      },
      postaward: {
        saveConsent: "Save consent",
        saveCompletion: "Save final project closeout",
        saveZzDraft: "Save draft now",
        annex2Title: "Annex 2 – final report (structure per call)",
        annex2Help:
          "Fill in per the call text / annex 2. You may use only these fields, only the continuous text below, or both. On <strong>final closeout</strong> the text is merged into one stored record (spreadsheet cell size is limited). Upload files (Magion, outputs) in the attachments section below.",
        annex2Summary: "Summary / activity outcome",
        annex2SummaryPh: "Brief outcome vs. objective…",
        annex2Activity: "Implementation narrative",
        annex2ActivityPh: "Progress, milestones, constraints…",
        annex2Outputs: "Achieved outputs vs. plan",
        annex2OutputsPh: "What was delivered compared to planned outputs…",
        annex2Coop: "Cooperation and partners",
        annex2CoopPh: "Partners, roles, collaboration results…",
        annex2BudgetText: "Use of support and economy (narrative)",
        annex2BudgetTextPh: "Add narrative to the actual-spend table above…",
        annex2Dissem: "Dissemination / sharing results",
        annex2DissemPh: "Conference, publications, internal knowledge transfer…",
        annex2Other: "Other / per-call additions",
        annex2OtherPh: "Anything else required by annex 2 or the R&D office…",
        annex2ReadonlyEmpty:
          "Annex 2 structured fields were not filled separately; the full text may be in the continuous final report below.",
        zzDraftTitle: "Final report – draft",
        zzLabel: "Continuous final report text (addition to annex 2)",
        zzDraftHelp:
          "Structured fields above follow annex 2; add continuous narrative below. Draft auto-saves (30 s) or via the button. Final closeout requires <strong>at least 80 characters in total</strong> (structured fields + continuous text).",
        part1Cut: "Part 1 – Consent to budget reduction",
        part1Alloc: "Part 1 – Consent to project allocation",
        agreeCut:
          "I agree to the approved budget reduction per the table above and to implementing the project within this scope.",
        agreeAlloc:
          "I agree to the project allocation and approved budget per the table above.",
        prorektorStance: "Vice-Rector’s decision",
        noComment: "No public comment text is recorded for this application.",
        acceptComment:
          "I acknowledge and agree with the Vice-Rector’s comment (above; if missing, I confirm I have taken note).",
        consentSaved: "Consent last saved:",
        promisedTitle: "Committed – excerpt from application and approved budget",
        projectTitle: "Project title:",
        activityGoal: "Goal / intent of activity:",
        plannedOutputs: "Planned outputs (from application):",
        budgetJustif: "Budget justification in application:",
        budgetReqAppr: "Budget: requested → approved (Vice-Rector)",
        realVsApproved: "Actual amounts vs approved budget",
        realHint:
          "For each line enter spent amount and optional note. Total should match approved support",
        varianceLabel: "Overall budget variance explanation",
        variancePh: "e.g. accommodation underspent because…",
        delivPanel: "Mandatory outputs – completion",
        delivHint: "Tick each item or give a short reason (min. 15 chars) if not met.",
        finalReportTitle: "Final report (in app + scope per call)",
        finalReportChk:
          "I confirm the in-app final report meets the call requirements and is ready / submitted as required.",
        outputCoop: "Cooperation output (article, sketch, MoU, minutes, plan… per call)",
        outputDone: "Output completed / submitted",
        activityProof: "Proof of activity (e.g. conference attendance)",
        otherConf: "Other confirmations per call",
        disCheck:
          "I confirm dissemination activity requirements / substitute evidence per R&D office instructions.",
        pkgCheck:
          "I confirm submission to the administrator (incl. attachments above): cooperation output, activity proof and related files per call – final report text is stored in this app.",
        ackCheck: "I have read the consequences of non-compliance below.",
        attachmentsTitle: "Attachments (Magion, mandatory outputs)",
        attachmentsHint:
          "List Magion export and files / links for mandatory outputs (not the FR text – that is in the app).",
        attachmentsPh: "e.g. Final_report_APP-123.pdf (link: …); Output_MoU.pdf …",
        notesPh: "Other notes for the administrator…",
        readonlyHint:
          "Preview for authorised roles; only the applicant named on the application can edit the checklist.",
        itemCol: "Item",
        requestedCzk: "In application (CZK)",
        approvedCzk: "Approved (CZK)",
        actualCzk: "Actual (CZK)",
        noteCol: "Note",
        uploadLabel: "Upload files (stored in the competition spreadsheet)",
        uploadHint:
          "Files are stored in the app (no Google Drive). Names are appended to the manifest below; download links appear in the list after upload (max. 18 MB per file). Optional legacy Drive listing: set CONFIG connect_postaward_legacy_drive_files = true.",
        part1HintConsent:
          "Complete soon after the Vice-Rector’s decision. This part is independent of final accounting in Part 2 (separate page).",
        part1HintCloseout:
          "Complete soon after the Vice-Rector’s decision. This part is independent of final accounting below.",
        prComment: "Vice-Rector’s comment:",
        prCommentAlso: "Vice-Rector’s comment (also in My projects):",
        mailLine:
          "Use attachments mainly for Magion export and mandatory outputs. Final report text is entered in the app above. E-mail:",
        mailMissing: "Set coordinator e-mail in CONFIG or contact R&D office.",
        zzFinalTitle: "Final report (part of final closeout)",
        zzClosedOn: "Final closeout date:",
        zzDraftTitle: "Final report – draft",
        zzDraftHelp:
          "Draft auto-saves like the application (30 s). You can leave and return. Use Save draft now for immediate save. The report is locked when you save final closeout below (min. 80 characters). Scope per call annex.",
        zzLabel: "Final report text",
        zzPh: "Write the final report progressively…",
        zzServerSaved: "Draft on server last:",
        zzServerNone: "Draft not yet on server – start writing or save manually.",
        errNoApi: "API missing – load api.js before connect-postaward-panel.js.",
      },
    },
  };

  var REVIEW_CONNECT_CRIT_CS = [
    { key: "K1", label: "Cíl aktivity a přínos pro UHK", short: "Smysl projektu, soulad s Connect (spolupráce / mobilita) a přínos pro UHK.", desc: "Je smysl aktivity srozumitelně vymezen? Odpovídá zaměření soutěže Connect (spolupráce se zahraniční institucí, mobilita, přenos znalostí)? Je přínos pro strategii VaV a rozvoj UHK věrohodně popsán?", labels: ["Nejasný", "Slabý", "Průměrný", "Dobrý", "Výborný"] },
    { key: "K2", label: "Kvalita a relevance partnerské spolupráce", short: "Výběr partnera, prokazatelnost spolupráce, typ aktivity dle výzvy.", desc: "Je partner vhodně zvolen a role obou stran jasná? Je spolupráce reálná (doporučeně doložené kontakty / dosavadní spolupráce)? Odpovídá typ aktivity (vědecká / edukační) zadání výzvy?", labels: ["Nevhodná", "Slabá", "Průměrná", "Dobrá", "Výborná"] },
    { key: "K3", label: "Rozpočet, hospodárnost a soulad s pravidly výzvy", short: "Přiměřenost nákladů, limit výzvy, odůvodnění položek.", desc: "Jsou náklady přiměřené rozsahu aktivity a v souladu s limitem výzvy? Jsou položky odůvodněné a účelné? Nejsou rizika přecenění nebo nejasných výdajů?", labels: ["Nepřiměřený", "Slabý", "Průměrný", "Dobrý", "Výborný"] },
    { key: "K4", label: "Odborný profil žadatele a předpoklady pro realizaci", short: "Kompetence řešitele, dosavadní výstupy, proveditelnost v termínu.", desc: "Má žadatel (tým) kompetence k realizaci? Jsou relevantní předchozí výstupy / zkušenosti? Je zřejmé, že aktivitu lze v plánovaném termínu zvládnout?", labels: ["Nevyhovující", "Slabý", "Průměrný", "Dobrý", "Výborný"] },
    { key: "K5", label: "Plánované výstupy, měřitelnost a udržitelnost", short: "Konkrétní výstupy, dopad na UHK, případná navazující spolupráce.", desc: "Jsou výstupy konkrétní a ověřitelné (publikace, mobilita, workshop, další)? Je popsán očekávaný dopad na VaV UHK nebo studenty? Je zvážena případná navazující spolupráce?", labels: ["Nejasné", "Slabé", "Průměrné", "Dobré", "Výborné"] },
  ];
  var REVIEW_CONNECT_CRIT_EN = [
    { key: "K1", label: "Activity objective and benefit for UHK", short: "Project rationale, fit with Connect (cooperation / mobility) and benefit for UHK.", desc: "Is the purpose clearly stated? Does it match Connect (cooperation with a foreign institution, mobility, knowledge transfer)? Is the benefit for UHK R&D strategy described credibly?", labels: ["Unclear", "Weak", "Fair", "Good", "Excellent"] },
    { key: "K2", label: "Quality and relevance of partner collaboration", short: "Partner choice, evidence of collaboration, activity type per call.", desc: "Is the partner appropriate and roles clear? Is collaboration realistic (preferably documented contacts / prior work)? Does the activity type match the call?", labels: ["Poor", "Weak", "Fair", "Good", "Excellent"] },
    { key: "K3", label: "Budget, economy and compliance with call rules", short: "Cost proportionality, call limit, justification of lines.", desc: "Are costs proportionate and within the call limit? Are items justified and purposeful? Any overpricing or unclear expenditure?", labels: ["Excessive", "Weak", "Fair", "Good", "Excellent"] },
    { key: "K4", label: "Applicant expertise and feasibility", short: "Team competence, prior outputs, feasibility by deadline.", desc: "Does the team have the skills? Relevant prior outputs? Is timely delivery credible?", labels: ["Insufficient", "Weak", "Fair", "Good", "Excellent"] },
    { key: "K5", label: "Planned outputs, measurability and sustainability", short: "Concrete outputs, UHK impact, potential follow-up.", desc: "Are outputs concrete and verifiable (publications, mobility, workshop, etc.)? Expected impact on UHK R&D or students? Follow-up collaboration considered?", labels: ["Vague", "Weak", "Fair", "Good", "Excellent"] },
  ];
  var CONNECT_BUDGET_LABEL_CS = {
    budget_travel: "Jízdné",
    budget_accommodation: "Ubytování",
    budget_meals: "Stravné",
    budget_local: "Místní doprava",
    budget_fee: "Poplatek (konference / workshop)",
    budget_publication: "Publikační náklady",
    budget_personnel: "Osobní náklady (DPP)",
  };
  var CONNECT_BUDGET_LABEL_EN = {
    budget_travel: "Travel",
    budget_accommodation: "Accommodation",
    budget_meals: "Meals",
    budget_local: "Local transport",
    budget_fee: "Fee (conference / workshop)",
    budget_publication: "Publication costs",
    budget_personnel: "Personnel costs (short-term)",
  };

  function safeLsGet(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeLsSet(key, val) {
    try {
      global.localStorage.setItem(key, val);
      return true;
    } catch (e) {
      return false;
    }
  }

  function getLang() {
    return safeLsGet(STORAGE) === "en" ? "en" : "cs";
  }

  function setLang(code) {
    if (code !== "cs" && code !== "en") return;
    if (!safeLsSet(STORAGE, code)) return;
    global.location.reload();
  }

  function t(path) {
    var lang = getLang();
    var v = deepGet(MESSAGES[lang], path);
    if (v !== undefined && v !== null) return v;
    v = deepGet(MESSAGES.cs, path);
    if (v !== undefined && v !== null) return v;
    return path;
  }

  function tReplace(path, vars) {
    var s = String(t(path));
    if (!vars) return s;
    Object.keys(vars).forEach(function (k) {
      s = s.split("{{" + k + "}}").join(String(vars[k]));
    });
    return s;
  }

  function applyFromUrl() {
    try {
      var p = new global.URLSearchParams(global.location.search);
      var q = p.get("lang");
      if (q === "en" || q === "cs") {
        safeLsSet(STORAGE, q);
        p.delete("lang");
        var u = new global.URL(global.location.href);
        u.search = p.toString() ? "?" + p.toString() : "";
        global.history.replaceState({}, "", u.toString());
      }
    } catch (e) {}
  }

  function patchConfigGlobals() {
    if (getLang() !== "en") return;
    var e = MESSAGES.en;
    if (typeof global.ROLES !== "undefined" && e.rolesPatch) {
      Object.keys(e.rolesPatch).forEach(function (k) {
        if (global.ROLES[k] && e.rolesPatch[k]) {
          if (e.rolesPatch[k].label) global.ROLES[k].label = e.rolesPatch[k].label;
          if (e.rolesPatch[k].description) global.ROLES[k].description = e.rolesPatch[k].description;
        }
      });
    }
    if (typeof global.COMP_STATUSES !== "undefined" && e.compStatuses) {
      Object.keys(e.compStatuses).forEach(function (k) {
        if (global.COMP_STATUSES[k] && e.compStatuses[k]) {
          Object.assign(global.COMP_STATUSES[k], e.compStatuses[k]);
        }
      });
    }
    if (typeof global.APP_STATUSES !== "undefined" && e.appStatuses) {
      Object.keys(e.appStatuses).forEach(function (k) {
        if (global.APP_STATUSES[k] && e.appStatuses[k]) {
          Object.assign(global.APP_STATUSES[k], e.appStatuses[k]);
        }
      });
    }
    global.formatDate = function (str) {
      if (!str) return "–";
      return new Date(str).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };
    global.formatCZK = function (n) {
      if (!n) return "–";
      return Number(n).toLocaleString("en-GB") + " CZK";
    };
  }

  function applyDom(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = t(key);
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (key) el.setAttribute("placeholder", t(key));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-title");
      if (key) el.setAttribute("title", t(key));
    });
    scope.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (key) el.innerHTML = t(key);
    });
    var titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) {
      var tk = titleEl.getAttribute("data-i18n");
      if (tk) document.title = t(tk);
    }
  }

  function bindLangSwitches(scope) {
    var root = scope || document;
    root.querySelectorAll("[data-lang-set]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang-set"));
      });
    });
  }

  function mountLangSwitch(host, position) {
    if (!host) return;
    if (host.querySelector(".uhk-lang-switch")) return;
    var wrap = document.createElement("span");
    wrap.className = "uhk-lang-switch";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", t("lang.label"));
    ["cs", "en"].forEach(function (code) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "uhk-lang-switch__btn" + (getLang() === code ? " uhk-lang-switch__btn--active" : "");
      b.setAttribute("data-lang-set", code);
      b.textContent = code.toUpperCase();
      b.setAttribute("aria-pressed", getLang() === code ? "true" : "false");
      wrap.appendChild(b);
    });
    if (position === "first") host.insertBefore(wrap, host.firstChild);
    else host.appendChild(wrap);
    bindLangSwitches(wrap);
  }

  function init() {
    applyFromUrl();
    document.documentElement.lang = getLang() === "en" ? "en" : "cs";
    patchConfigGlobals();
    applyDom();
    bindLangSwitches();
  }

  function roleLoginMeta(role) {
    var lang = getLang();
    var block = MESSAGES[lang].roles && MESSAGES[lang].roles[role];
    if (block) return { name: block.name, desc: block.desc };
    block = MESSAGES.cs.roles[role];
    return block ? { name: block.name, desc: block.desc } : { name: role, desc: "" };
  }

  function competitionDisplayName(id) {
    var k = "reviewConnect.cnames." + id;
    var v = t(k);
    return v === k ? id : v;
  }

  global.I18n = {
    STORAGE_KEY: STORAGE,
    getLang: getLang,
    setLang: setLang,
    t: t,
    tReplace: tReplace,
    init: init,
    applyDom: applyDom,
    mountLangSwitch: mountLangSwitch,
    bindLangSwitches: bindLangSwitches,
    patchConfigGlobals: patchConfigGlobals,
    roleLoginMeta: roleLoginMeta,
    getReviewConnectCrit: function () {
      return getLang() === "en" ? REVIEW_CONNECT_CRIT_EN : REVIEW_CONNECT_CRIT_CS;
    },
    connectBudgetLabel: function (key) {
      var m = getLang() === "en" ? CONNECT_BUDGET_LABEL_EN : CONNECT_BUDGET_LABEL_CS;
      return m[key] || key;
    },
    numLocale: function () {
      return getLang() === "en" ? "en-GB" : "cs-CZ";
    },
    fmtMoney: function (n) {
      return Number(n || 0).toLocaleString(getLang() === "en" ? "en-GB" : "cs-CZ") + (getLang() === "en" ? " CZK" : " Kč");
    },
    competitionDisplayName: competitionDisplayName,
    dashboardCompetitionTypeLabel: function (type) {
      var k = "dashboard.competitionType." + type;
      var v = t(k);
      return v === k ? String(type || "—") : v;
    },
    dashboardCompetitionName: function (comp) {
      if (!comp || !comp.id) return comp && comp.name ? comp.name : "";
      var k = "dashboard.competitionCard." + comp.id + ".name";
      var v = t(k);
      return v === k ? (comp.name || "") : v;
    },
    dashboardCompetitionDesc: function (comp) {
      if (!comp || !comp.id) return comp && comp.description ? comp.description : "";
      var k = "dashboard.competitionCard." + comp.id + ".desc";
      var v = t(k);
      return v === k ? (comp.description || "") : v;
    },
    /** Post-award panel: English only when lang=en; otherwise returns csFallback */
    pa: function (key, csFallback) {
      if (getLang() !== "en") return csFallback;
      var k = "postaward." + key;
      var x = t(k);
      return x === k ? csFallback : x;
    },
  };
})(typeof window !== "undefined" ? window : this);
