/**
 * UHK Grant Manager – api.js
 * Volání Google Apps Script Web App
 */

function fileToBase64_(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () =>
      reject(
        new Error(
          typeof I18n !== "undefined" && I18n.t ? I18n.t("api.fileReadError") : "Soubor se nepodařilo načíst."
        )
      );
    r.readAsDataURL(file);
  });
}

const API = {

  // ── GET požadavek ──────────────────────────────────────────
  async get(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.set("action", action);
    // Přidej auth token
    const session = Auth._getSession();
    if (session?.token) url.searchParams.set("token", session.token);
    // Přidej další parametry
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  },

  // ── POST požadavek ─────────────────────────────────────────
  async post(action, data = {}) {
    const session = Auth._getSession();
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        token: session?.token,
        ...data,
      }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  },

  // ── Konkrétní volání ───────────────────────────────────────

  /** Načti seznam soutěží z CONFIG listů */
  async getCompetitions() {
    return this.get("getCompetitions");
  },

  /** Ověř token (pro refresh session) */
  async verifyToken(token) {
    return this.get("verifyToken", { token });
  },

  /** Načti FORM_FIELDS pro soutěž */
  async getFormFields(competitionId) {
    return this.get("getFormFields", { competitionId });
  },

  /** Ulož přihlášku */
  async submitApplication(competitionId, fields, status = "SUBMITTED") {
    return this.post("submitApplication", { competitionId, fields, status });
  },

  /** Stav přihlášky */
  async getApplicationStatus(applicationId) {
    return this.get("getApplicationStatus", { applicationId });
  },

  /** Seznam přihlášek (admin/komisař/prorektor) */
  async getApplications(competitionId, filters = {}) {
    return this.get("getApplications", { competitionId, ...filters });
  },

  /** Přehled vlastních přihlášek Connect (drafty + finální, stav, výsledek prorektora). */
  async getConnectMyApplications(competitionId) {
    return this.get("getConnectMyApplications", { competitionId });
  },

  /** Connect: alokace, přiděleno po prorektorovi, potvrzeno žadatelem, zbývá (jen soutěž uhk_connect_2026_v2). */
  async getConnectFundingSummary(competitionId) {
    return this.get("getConnectFundingSummary", { competitionId });
  },

  /** Pravidla a checklist povinných výstupů po Podpořeno/Kráceno (Connect). */
  async getConnectPostAward(competitionId, applicationId) {
    return this.get("getConnectPostAward", { competitionId, applicationId });
  },

  /**
   * Nahraj přílohu části 2 Connect na sdílený Google Disk (viz CONNECT_POSTAWARD_ATTACHMENTS_FOLDER_ID v Apps Script).
   * Max. 18 MB na soubor; může jen řešitel u přihlášky u projektu Podpořeno/Kráceno.
   */
  /** ADMIN/TESTER: DOMAIN / odkazové sdílení u příloh dané přihlášky ve složce Connect (legacy soubory). */
  async repairConnectPostAwardAttachmentSharing(competitionId, applicationId) {
    return this.post("repairConnectPostAwardAttachmentSharing", { competitionId, applicationId });
  },

  async uploadConnectPostAwardAttachment(competitionId, applicationId, file) {
    const max = 18 * 1024 * 1024;
    if (!file || file.size > max) {
      return { error: "Soubor je příliš velký nebo chybí (max. 18 MB)." };
    }
    const fileBase64 = await fileToBase64_(file);
    return this.post("uploadConnectPostAwardAttachment", {
      competitionId,
      applicationId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileBase64,
    });
  },

  /** saveSection: "consent" | "completion" | undefined (uloží vše najednou, časové značky dle sekce). */
  async saveConnectPostAward(competitionId, applicationId, checklist, saveSection) {
    const session = Auth._getSession();
    let prevConsent = "";
    let prevCompletion = "";
    let prevZzDraft = "";
    let prevFinalAt = "";
    try {
      const before = await this.get("getConnectPostAward", { competitionId, applicationId });
      if (before && before.checklist) {
        prevConsent = String(before.checklist.consent_saved_at || "");
        prevCompletion = String(before.checklist.completion_saved_at || "");
        prevZzDraft = String(before.checklist.zz_draft_saved_at || "");
        prevFinalAt = String(before.checklist.final_report_final_saved_at || "");
      }
    } catch (e) {
      /* ignore */
    }
    const payload = {
      action: "saveConnectPostAward",
      token: session?.token,
      competitionId,
      applicationId,
      checklist,
    };
    if (saveSection) payload.saveSection = saveSection;
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
    });
    for (let i = 0; i < 7; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 400 : 550));
      try {
        const data = await this.get("getConnectPostAward", { competitionId, applicationId });
        if (data.error || !data.checklist) continue;
        const ch = data.checklist;
        if (saveSection === "consent") {
          const at = String(ch.consent_saved_at || "");
          if (
            at &&
            at !== prevConsent &&
            ch.accepts_prorektor_public_comment &&
            ch.agrees_solution_and_budget
          ) {
            return { success: true, checklist: ch };
          }
        } else if (saveSection === "completion") {
          const at = String(ch.completion_saved_at || "");
          if (at && at !== prevCompletion) return { success: true, checklist: ch };
        } else if (saveSection === "report_draft") {
          const at = String(ch.zz_draft_saved_at || "");
          if (at && at !== prevZzDraft) return { success: true, checklist: ch };
        } else if (saveSection === "report_final") {
          const at = String(ch.final_report_final_saved_at || "");
          if (at && at !== prevFinalAt) return { success: true, checklist: ch };
        } else {
          return { success: true, checklist: ch };
        }
      } catch (e) {
        /* ignore */
      }
    }
    return {
      error:
        "Odesláno, ale nepodařilo se ověřit uložení včas. Obnovte stránku a zkontrolujte stav.",
    };
  },

  /** Connect: export souhlasů, checklistu a příloh pro správce (JSON řádků). */
  async getConnectDeliverablesExport(competitionId) {
    return this.get("getConnectDeliverablesExport", { competitionId });
  },

  /** Změna statusu přihlášky */
  async changeStatus(competitionId, applicationId, newStatus, note = "") {
    return this.post("changeStatus", { competitionId, applicationId, newStatus, note });
  },

  /**
   * ADMIN/TESTER: trvale smazat přihlášku (SUBMITTED i DRAFT) + související řádky v REVIEWS.
   * Odesílá application/x-www-form-urlencoded (jednoduchý POST bez CORS preflightu).
   * Fallback: GET, pokud by POST selhal.
   */
  async adminDeleteApplication(competitionId, applicationId) {
    const session = Auth._getSession();
    const params = new URLSearchParams();
    params.set("action", "adminDeleteApplication");
    if (session?.token) params.set("token", session.token);
    params.set("competitionId", String(competitionId || ""));
    params.set("applicationId", String(applicationId || ""));
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    } catch (err) {
      return this.get("adminDeleteApplication", { competitionId, applicationId });
    }
  },

  /** Ulož hodnocení */
  async submitReview(competitionId, applicationId, scores, comments, recommendation) {
    return this.post("submitReview", {
      competitionId, applicationId, scores, comments, recommendation,
    });
  },

  /** Načti hodnocení přihlášky */
  async getReviews(competitionId, applicationId) {
    return this.get("getReviews", { competitionId, applicationId });
  },

  /**
   * Otevře PDF z Web Appu v novém tabu — bez fetch() (u script.google.com často „Failed to fetch“ kvůli CORS).
   * Vždy POST formulář (application/x-www-form-urlencoded): token a parametry v těle, ne v GET URL
   * (dlouhé URL se ořezávají / blokují; stejný mechanismus jako upload).
   */
  async openConnectBinaryDownload(action, fields) {
    const session = Auth._getSession();
    if (!session?.token) {
      const msg =
        typeof I18n !== "undefined" && I18n.t
          ? I18n.t("api.needLoginDownload")
          : "Pro stažení souboru se přihlaste.";
      throw new Error(msg);
    }
    const baseUrl = String(typeof API_URL !== "undefined" ? API_URL : "").trim();
    try {
      new URL(baseUrl);
    } catch (eUrl) {
      throw new Error(
        typeof I18n !== "undefined" && I18n.t ? I18n.t("api.downloadNetworkError") : "Neplatná adresa API."
      );
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = baseUrl;
    form.enctype = "application/x-www-form-urlencoded";
    form.target = "_blank";
    form.acceptCharset = "UTF-8";
    form.style.display = "none";
    const addField = (name, val) => {
      const inp = document.createElement("input");
      inp.type = "hidden";
      inp.name = name;
      inp.value = String(val);
      form.appendChild(inp);
    };
    addField("action", action);
    addField("token", session.token);
    Object.entries(fields || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v) !== "") addField(k, v);
    });
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
      try {
        form.remove();
      } catch (eR) {
        /* ignore */
      }
    }, 500);
  },
};

/** Dostupné i pro skripty v jiném lexikálním oboru (např. IIFE v connect-postaward-panel.js). */
if (typeof globalThis !== "undefined") {
  globalThis.API = API;
}

/** Delegace kliku na <a class="uhk-blob-dl" data-dl-action="…" …> (Connect PDF z tabulky). */
(function installUhkBlobDlDelegation_() {
  if (typeof document === "undefined") return;
  if (globalThis.__uhkBlobDlDelegationInstalled) return;
  globalThis.__uhkBlobDlDelegationInstalled = true;
  document.addEventListener(
    "click",
    function (ev) {
      var a = ev.target.closest && ev.target.closest("a.uhk-blob-dl");
      if (!a || !a.getAttribute) return;
      var action = a.getAttribute("data-dl-action");
      if (!action || typeof globalThis.API === "undefined" || !API.openConnectBinaryDownload) return;
      var cid = a.getAttribute("data-dl-competition-id");
      var appId = a.getAttribute("data-dl-application-id");
      if (!cid || !appId) return;
      ev.preventDefault();
      var fields = { competitionId: cid, applicationId: appId };
      if (action === "downloadConnectApplicationFile") {
        var fid = a.getAttribute("data-dl-field-id");
        if (!fid) return;
        fields.fieldId = fid;
      } else if (action === "downloadConnectPostAwardFile") {
        var bid = a.getAttribute("data-dl-blob-key");
        if (!bid) return;
        fields.blobKey = bid;
      } else return;
      API.openConnectBinaryDownload(action, fields).catch(function (err) {
        var msg = (err && err.message) || String(err);
        if (typeof alert !== "undefined") alert(msg);
      });
    },
    true
  );
})();
