# UHK Grant Manager v2 – Přihlášení + Rozcestník

## Struktura projektu

```
uhk-app/
├── login.html              ← Přihlášení (e-mail + heslo)
├── css/
│   └── app.css             ← Styly celé aplikace
├── js/
│   ├── config.js           ← Konfigurace, konstanty, role
│   ├── auth.js             ← Přihlášení, session, ochrana stránek
│   ├── api.js              ← Volání Apps Script API
│   └── backend-v2.gs       ← Apps Script kód (vložit do Sheets)
└── pages/
    └── dashboard.html      ← Rozcestník po přihlášení
```

---

## Nastavení USERS listu v Google Sheets

Do listu **👥 USERS** přidej sloupec `password` (heslo v plaintextu):

| email | role | name | faculty | active | added_at | added_by | **password** |
|---|---|---|---|---|---|---|---|
| admin@uhk.cz | ADMIN | Ing. Veronika Hrůzová | OVTZ | TRUE | 2026-03-12 | system | **Admin2026!** |
| prorektor@uhk.cz | PROREKTOR | doc. Ing. Hana Tomášková | OVTZ | TRUE | 2026-03-12 | system | **Prorek2026!** |
| horak@uhk.cz | KOMISAR | prof. Ing. Tomáš Horák | PřF | TRUE | 2026-03-13 | admin@uhk.cz | **Komise2026!** |
| novak@uhk.cz | ZADATEL | Mgr. Jan Novák, Ph.D. | FIM | TRUE | 2026-03-20 | self | **Zadatel123!** |

> ⚠️ Sloupec `password` musí být **8. sloupec (H)**. Pokud je jinde, uprav index v `backend-v2.gs`.

---

## Nasazení Apps Script

1. Otevři Sheets → **Extensions → Apps Script**
2. Vlož obsah `js/backend-v2.gs`
3. Zkontroluj `GLOBAL_SPREADSHEET_ID` – musí být ID tvého Connect sheetu
4. **Deploy → New deployment → Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Zkopíruj URL a vlož do `js/config.js` jako `API_URL`

---

## Demo účty (bez API)

Aplikace funguje i offline s těmito demo účty:

| E-mail | Heslo | Role |
|---|---|---|
| admin@uhk.cz | Admin2026! | Správce |
| prorektor@uhk.cz | Prorek2026! | Prorektor |
| komise@uhk.cz | Komise2026! | Člen komise |
| tester@uhk.cz | Tester2026! | Tester |
| novak@uhk.cz | Zadatel2026! | Žadatel |
| readonly@uhk.cz | Readonly2026! | Jen čtení |

---

## GitHub Pages

```bash
git add .
git commit -m "v2: přihlášení + rozcestník"
git push origin main
```

Settings → Pages → Deploy from main → root
