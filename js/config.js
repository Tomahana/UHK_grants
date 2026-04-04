/**
 * UHK Grant Manager – config.js
 * Globální konfigurace, konstanty, role, stavy soutěží
 */

// ── Apps Script Web App URL ────────────────────────────────────
// Po nasazení Web App v Apps Script sem vlož URL:
// Apps Script Web App – Gmail účet uhk.granty@gmail.com
const API_URL = "https://script.google.com/macros/s/AKfycbyqwthk3rMxMSDQkaKCnwef5GsPBu4C40810zOhZUHEARhVbYb-vqbUMzlY5LfsQkNU/exec";

// ── Role a jejich vlastnosti ───────────────────────────────────
const ROLES = {
  ADMIN: {
    label:       "Správce",
    description: "Plný přístup – správa uživatelů, přihlášek, nastavení",
    color:       "#1C2E5A",
    bg:          "#E8EDF8",
  },
  PROREKTOR: {
    label:       "Prorektor",
    description: "Nejvyšší schvalovací pravomoc – finální rozhodnutí",
    color:       "#5B21B6",
    bg:          "#EDE9FE",
  },
  KOMISAR: {
    label:       "Člen komise",
    description: "Hodnocení přihlášek, přístup k hodnoticímu panelu",
    color:       "#1E6B45",
    bg:          "#E6F4EE",
  },
  TESTER: {
    label:       "Tester",
    description: "Vidí vše, nemůže měnit data – pro testování systému",
    color:       "#B45309",
    bg:          "#FEF3C7",
  },
  ZADATEL: {
    label:       "Žadatel",
    description: "Podává přihlášky, sleduje stav svých žádostí",
    color:       "#1D4ED8",
    bg:          "#DBEAFE",
  },
  RESITEL: {
    label:       "Řešitel",
    description: "Aktivní řešitel podpořeného projektu – podává zprávy",
    color:       "#0369A1",
    bg:          "#E0F2FE",
  },
  READONLY: {
    label:       "Jen čtení",
    description: "Přehled bez možnosti změn",
    color:       "#6B7280",
    bg:          "#F3F4F6",
  },
};

// ── Stavy soutěží ──────────────────────────────────────────────
const COMP_STATUSES = {
  OPEN: {
    label: "Otevřena",
    icon:  "●",
    desc:  "Přijímají se přihlášky",
  },
  RUNNING: {
    label: "Probíhá",
    icon:  "◐",
    desc:  "Hodnocení / realizace",
  },
  CLOSED: {
    label: "Ukončena",
    icon:  "○",
    desc:  "Soutěž je uzavřena",
  },
  DRAFT: {
    label: "Příprava",
    icon:  "◌",
    desc:  "Soutěž se připravuje",
  },
};

// ── Stavy přihlášek ────────────────────────────────────────────
const APP_STATUSES = {
  DRAFT:        { label: "Koncept",           color: "#6B7280", bg: "#F3F4F6" },
  SUBMITTED:    { label: "Podáno",            color: "#1D4ED8", bg: "#DBEAFE" },
  FORMAL_CHECK: { label: "Formální kontrola", color: "#5B21B6", bg: "#EDE9FE" },
  IN_REVIEW:    { label: "V hodnocení",       color: "#B45309", bg: "#FEF3C7" },
  APPROVED:     { label: "Schváleno",         color: "#1E6B45", bg: "#E6F4EE" },
  REJECTED:     { label: "Zamítnuto",         color: "#991B1B", bg: "#FEF2F2" },
  WITHDRAWN:    { label: "Staženo",           color: "#6B7280", bg: "#F3F4F6" },
};

// ── Soutěže (fallback pokud API nedostupné) ───────────────────
const FALLBACK_COMPETITIONS = [
  {
    id:          "uhk_navraty_2026",
    name:        "OP JAK Návraty 2026",
    type:        "OP_JAK_NAVRATY",
    status:      "RUNNING",
    description: "Hodnocení projektů OP JAK Návraty – IGA komise UHK.",
    deadline:    "2026-06-30",
    allocation:  40156893,
    maxBudget:   0,
    applicationsCount: 7,
  },
  {
    id:          "uhk_connect_2026_v2",
    name:        "UHK Connect – výzva č. 2",
    type:        "UHK_CONNECT",
    status:      "OPEN",
    description: "Krátké projekty pro síťování, mobilitu a navázání spolupráce.",
    deadline:    "2026-10-14",
    allocation:  800000,
    maxBudget:   80000,
  },
  {
    id:          "uhk_rega_2026_v1",
    name:        "UHK ReGa – výzva č. 1",
    type:        "UHK_REGA",
    status:      "OPEN",
    description: "Podpora dopracování a znovupodání nezafinancovaných projektů GA ČR.",
    deadline:    "2026-04-01",
    allocation:  2000000,
    maxBudget:   500000,
  },
  {
    id:          "uhk_prestige_2026",
    name:        "UHK Prestige 2026",
    type:        "UHK_PRESTIGE",
    status:      "DRAFT",
    description: "Prestižní granty Univerzity Hradec Králové – připravuje se.",
    deadline:    "",
    allocation:  0,
    maxBudget:   0,
  },
];

// ── Utility funkce ─────────────────────────────────────────────
function formatDate(str) {
  if (!str) return "–";
  return new Date(str).toLocaleDateString("cs-CZ", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatCZK(n) {
  if (!n) return "–";
  return Number(n).toLocaleString("cs-CZ") + " Kč";
}

function isDeadlineNear(dateStr, days = 14) {
  if (!dateStr) return false;
  const diff = (new Date(dateStr) - new Date()) / 86400000;
  return diff >= 0 && diff <= days;
}

function statusPill(status, type = "app") {
  const map = type === "app" ? APP_STATUSES : COMP_STATUSES;
  const s   = map[status] || { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return `<span style="
    display:inline-block;
    padding:3px 10px;
    border-radius:12px;
    font-size:11px;
    font-weight:700;
    letter-spacing:.3px;
    color:${s.color};
    background:${s.bg};
  ">${s.label}</span>`;
}

// ── Spreadsheet IDs (informativní – používají se jen v Apps Script) ─
// Všechny Sheets jsou pod Gmail účtem: uhk.granty@gmail.com
// Connect:  1maDTXF8xKCpSY0LfeNcRyLo1KtulgipEIwQaIGb3Su0
// Návraty:  1VU3c_gwxjbuZuNQ5_B1iqlbGzOgLwtUXUAI-E2dt6EA
// ReGa:     1E8hRFVkVt3WuhGcSrhz9E0P9Pvz7udoT1IGMnNH8ADc
// Prestige: 1qmx2gFETaYJVdZmhkGUvdGdukARlQZXnepVPYJSuemk
// Users:    17bf7fHOu-tdza7UXzahwWyIAwwuk0BcpC39KGiG-64g
