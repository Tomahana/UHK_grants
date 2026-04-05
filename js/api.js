/**
 * UHK Grant Manager – api.js
 * Volání Google Apps Script Web App
 */

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

  /** Pravidla a checklist povinných výstupů po Podpořeno/Kráceno (Connect). */
  async getConnectPostAward(competitionId, applicationId) {
    return this.get("getConnectPostAward", { competitionId, applicationId });
  },

  async saveConnectPostAward(competitionId, applicationId, checklist) {
    return this.post("saveConnectPostAward", { competitionId, applicationId, checklist });
  },

  /** Změna statusu přihlášky */
  async changeStatus(competitionId, applicationId, newStatus, note = "") {
    return this.post("changeStatus", { competitionId, applicationId, newStatus, note });
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
