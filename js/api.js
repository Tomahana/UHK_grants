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
    r.onerror = () => reject(new Error("Soubor se nepodařilo načíst."));
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
   * Používá GET (ne POST), aby prohlížeč neposílal CORS preflight – JSON POST na Apps Script často končí „Failed to fetch“.
   */
  async adminDeleteApplication(competitionId, applicationId) {
    return this.get("adminDeleteApplication", { competitionId, applicationId });
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
};

/** Dostupné i pro skripty v jiném lexikálním oboru (např. IIFE v connect-postaward-panel.js). */
if (typeof globalThis !== "undefined") {
  globalThis.API = API;
}
