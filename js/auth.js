/**
 * UHK Grant Manager – auth.js v2
 * Přihlášení s výběrem role, registrace, session, ochrana stránek
 */

const Auth = {

  SESSION_KEY: "uhk_grant_session",

  /**
   * Relativní prefix ke kořeni šablony (kde je login.html).
   * Stránky v podsložce pages/ musí používat ../ — počítání jen podle počtu lomítek
   * pro /pages/… dává prázdný řetězec a špatně vede na pages/login.html.
   */
  _pathPrefixToSiteRoot() {
    const p = String(window.location.pathname || "").replace(/\\/g, "/");
    if (/\/pages\/[^/]+$/i.test(p)) return "../";
    const parts = p.split("/").filter(Boolean);
    if (parts.length <= 1) return "";
    return "../".repeat(parts.length - 1);
  },

  // ── Přihlášení ─────────────────────────────────────────────
  // Vrací: { success, token, name, roles: ["ADMIN","PROREKTOR",...] }
  async login(email, password) {
    try {
      const url = new URL(API_URL);
      url.searchParams.set("action", "login");
      url.searchParams.set("email", email.toLowerCase().trim());
      url.searchParams.set("password", password);
      const ctrl = new AbortController();
      const tid = setTimeout(function () {
        ctrl.abort();
      }, 32000);
      let res;
      try {
        res = await fetch(url.toString(), { signal: ctrl.signal });
      } finally {
        clearTimeout(tid);
      }
      const data = await res.json();
      if (data.success) return data;
      return {
        success: false,
        message:
          data.message ||
          (typeof I18n !== "undefined" && I18n.t
            ? I18n.t("auth.wrongCreds")
            : "Nesprávné přihlašovací údaje."),
      };
    } catch (e) {
      if (e && (e.name === "AbortError" || e.name === "TimeoutError")) {
        return {
          success: false,
          message:
            typeof I18n !== "undefined" && I18n.t
              ? I18n.t("login.errTimeout")
              : "Časový limit vypršel.",
        };
      }
      return this._demoLogin(email, password);
    }
  },

  // ── Demo login (fallback bez API) ──────────────────────────
  _demoLogin(email, password) {
    // Simuluje situaci kdy jeden e-mail má více rolí
    const DEMO = [
      { email:"hana.tomaskova@uhk.cz", password:"HT_UHK_2026", name:"doc. Ing. Hana Tomášková, Ph.D.", roles:["ADMIN","PROREKTOR","KOMISAR","TESTER"] },
      { email:"novak@uhk.cz",          password:"Novak123!",    name:"Mgr. Jan Novák, Ph.D.",           roles:["ZADATEL"] },
      { email:"resitel@uhk.cz",        password:"Res2026!",     name:"Ing. Petra Dvořáčková, Ph.D.",    roles:["RESITEL"] },
      { email:"komise@uhk.cz",         password:"Kom2026!",     name:"prof. Ing. Tomáš Horák, Ph.D.",  roles:["KOMISAR"] },
      { email:"readonly@uhk.cz",       password:"Read2026!",    name:"Mgr. Radek Čtenář",              roles:["READONLY"] },
    ];
    const found = DEMO.find(
      u => u.email === email.toLowerCase() && u.password === password
    );
    if (!found)
      return {
        success: false,
        message:
          typeof I18n !== "undefined" && I18n.t ? I18n.t("auth.wrongCreds") : "Nesprávné přihlašovací údaje.",
      };
    return {
      success: true,
      token:   "demo_" + Date.now(),
      email:   found.email,
      name:    found.name,
      roles:   found.roles,
    };
  },

  // ── Uloží session po výběru role ───────────────────────────
  setSession(token, email, name, role, allRoles = null) {
    try {
      const existing = this._getSession();
      const roles = allRoles || existing?.allRoles || [role];
      const session = { token, email, name, role, allRoles: roles, loginAt: Date.now() };
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      return true;
    } catch {
      return false;
    }
  },

  // ── Registrace nového uživatele ────────────────────────────
  // Role: vždy ZADATEL, active: TRUE
  async register(name, email, password) {
    try {
      // application/x-www-form-urlencoded = „jednoduchý“ POST bez CORS preflightu
      // (JSON POST z jiné domény než script.google.com typicky selže na OPTIONS).
      const params = new URLSearchParams();
      params.set("action", "register");
      params.set("name", name);
      params.set("email", email.toLowerCase().trim());
      params.set("password", password);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      if (!res.ok) {
        return {
          success: false,
          message:
            typeof I18n !== "undefined" && I18n.t
              ? I18n.t("login.errConnection")
              : "Server odpověděl chybou. Zkuste to znovu.",
        };
      }
      return await res.json();
    } catch {
      return {
        success: false,
        message:
          typeof I18n !== "undefined" && I18n.t
            ? I18n.t("login.errConnection")
            : "Nepodařilo se spojit se serverem. Zkuste to znovu.",
      };
    }
  },

  // ── Je přihlášen? ──────────────────────────────────────────
  isLoggedIn() {
    const s = this._getSession();
    if (!s) return false;
    /** Sladěno s platností tokenu na serveru (UHK_AppScript_v5 verifyToken). */
    if (Date.now() - s.loginAt > 24 * 60 * 60 * 1000) {
      this.logout(false); return false;
    }
    return true;
  },

  // ── Aktuální uživatel ──────────────────────────────────────
  getUser() { return this._getSession(); },

  /** Množina všech rolí účtu (zvolená při přihlášení + ostatní z tokenu). */
  _roleSet() {
    const s = this._getSession();
    if (!s) return new Set();
    return new Set([s.role, ...(s.allRoles || [])].filter(Boolean));
  },

  /** Má uživatel alespoň jednu z rolí? (Správce vidí admin sekci i po zvolení jiné „masky“.) */
  hasAnyRole(roles) {
    if (!roles || !roles.length) return false;
    const set = this._roleSet();
    return roles.some((r) => set.has(r));
  },

  // ── Ochrana stránky ────────────────────────────────────────
  requireLogin(allowedRoles = null) {
    if (!this.isLoggedIn()) {
      try {
        sessionStorage.setItem("uhk_redirect", window.location.href);
      } catch {
        /* ignoruj – např. blokované úložiště */
      }
      const prefix = this._pathPrefixToSiteRoot();
      window.location.href = prefix + "login.html";
      return null;
    }
    const user = this.getUser();
    const set = this._roleSet();
    // ADMIN a TESTER mají přístup všude (i když při přihlášení zvolili např. Žadatel)
    if (set.has("ADMIN") || set.has("TESTER")) return user;
    // Kontrola konkrétní role pokud je požadována
    if (allowedRoles && !allowedRoles.some((r) => set.has(r))) {
      const sep =
        typeof I18n !== "undefined" && I18n.getLang && I18n.getLang() === "en" ? ", " : " nebo ";
      const msg =
        typeof I18n !== "undefined" && I18n.tReplace
          ? I18n.tReplace("auth.accessDenied", { roles: allowedRoles.join(sep) })
          : `Přístup odepřen. Tato stránka vyžaduje roli: ${allowedRoles.join(" nebo ")}.`;
      alert(msg);
      history.back();
      return null;
    }
    return user;
  },

  // ── Odhlášení ──────────────────────────────────────────────
  logout(redirect = true) {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch {
      /* ignoruj */
    }
    if (redirect) {
      const prefix = this._pathPrefixToSiteRoot();
      window.location.href = prefix + "login.html";
    }
  },

  // ── Interní ────────────────────────────────────────────────
  _getSession() {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (raw == null || raw === "") return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
