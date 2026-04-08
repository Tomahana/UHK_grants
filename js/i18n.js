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
      },
      auth: {
        accessDenied: "Přístup odepřen. Tato stránka vyžaduje roli: {{roles}}.",
        wrongCreds: "Nesprávné přihlašovací údaje.",
      },
      api: { fileReadError: "Soubor se nepodařilo načíst." },
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
      reviewConnectUi: { titlePrefix: "Hodnocení – " },
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
      },
      auth: {
        accessDenied: "Access denied. This page requires one of these roles: {{roles}}.",
        wrongCreds: "Invalid sign-in details.",
      },
      api: { fileReadError: "Could not read the file." },
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
      reviewConnectUi: { titlePrefix: "Review – " },
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
        APPROVED: { label: "Approved" },
        REJECTED: { label: "Rejected" },
        WITHDRAWN: { label: "Withdrawn" },
      },
      postaward: {
        saveConsent: "Save consent",
        saveCompletion: "Save final project closeout",
        saveZzDraft: "Save draft now",
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
        uploadLabel: "Upload files to shared Drive (competition folder)",
        uploadHint:
          "Files are stored in this Google Drive folder. File names and links are appended below (max. 18 MB per file).",
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

  function getLang() {
    return global.localStorage.getItem(STORAGE) === "en" ? "en" : "cs";
  }

  function setLang(code) {
    if (code !== "cs" && code !== "en") return;
    global.localStorage.setItem(STORAGE, code);
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
        global.localStorage.setItem(STORAGE, q);
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
    /** Post-award panel: English only when lang=en; otherwise returns csFallback */
    pa: function (key, csFallback) {
      if (getLang() !== "en") return csFallback;
      var k = "postaward." + key;
      var x = t(k);
      return x === k ? csFallback : x;
    },
  };
})(typeof window !== "undefined" ? window : this);
