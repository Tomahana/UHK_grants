/**
 * UHK Connect – sdílený panel po schválení (část 1 souhlas / část 2 závěr).
 * Režimy: "consent" (jen část 1 + odkaz na část 2), "closeout" (jen část 2).
 */
(function (global) {
  "use strict";

  /** api.js nastaví globalThis.API; záložně lexikální API ze stejné stránky. */
  function api() {
    var g =
      (typeof globalThis !== "undefined" && globalThis.API) ||
      (typeof window !== "undefined" && window.API);
    if (g && typeof g.getConnectPostAward === "function") return g;
    if (typeof API !== "undefined" && API && typeof API.getConnectPostAward === "function") return API;
    throw new Error("Chybí API – načtěte api.js před connect-postaward-panel.js.");
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildConnectPostAwardPanel(data, mode, ctx) {
    const d = data.deadlines || {};
    const c = data.checklist || {};
    const mail = String(data.coordinatorEmail || "").trim();
    const subj = encodeURIComponent("UHK Connect – závěrečná zpráva a výstupy (" + (data.applicationId || "") + ")");
    const signer = String((ctx && ctx.applicantLine) || "").trim();
    const mailBody = encodeURIComponent(
      "Dobrý den,\n\nv příloze / níže posílám podklady k přihlášce " +
        (data.applicationId || "") +
        " (povinné výstupy dle výzvy UHK Connect).\n\n…\n\n" +
        signer
    );
    const mailHref = mail ? "mailto:" + mail + "?subject=" + subj + "&body=" + mailBody : "";
    const dis = c.dissemination_fulfilled ? " checked" : "";
    const pkg = c.package_emailed_declared ? " checked" : "";
    const ack = c.consequences_acknowledged ? " checked" : "";
    const accCom = c.accepts_prorektor_public_comment ? " checked" : "";
    const agrBud = c.agrees_solution_and_budget ? " checked" : "";
    const notes = escapeHtml(c.notes || "");
    const att = escapeHtml(c.attachments_manifest || "");
    const readOnly = !data.canEdit;
    const offB = Number(data.budgetOfficialCzk) || 0;
    const part1Title =
      data.outcomeDecision === "CUT"
        ? "Část 1 – Souhlas s krácením rozpočtu projektu"
        : "Část 1 – Souhlas s přidělením projektu";
    const agreeBudgetLabel =
      data.outcomeDecision === "CUT"
        ? "Souhlasím se schváleným krácením rozpočtu podle položek v tabulce výše a s řešením projektu v tomto rozsahu."
        : "Souhlasím s přidělením projektu a se schváleným rozpočtem podle položek v tabulce výše.";
    const br = data.budgetRows || [];
    const brDetail = br.filter(function (x) {
      return x.key !== "budget_total";
    });
    const brTotal = br.find(function (x) {
      return x.key === "budget_total";
    });
    const budgetTable1Rows =
      brDetail.length > 0
        ? brDetail
            .map(function (r) {
              return (
                "<tr><td>" +
                escapeHtml(r.label) +
                '</td><td style="text-align:right;font-family:\'DM Mono\',monospace">' +
                Number(r.requested || 0).toLocaleString("cs-CZ") +
                '</td><td style="text-align:right;font-family:\'DM Mono\',monospace;font-weight:600">' +
                Number(r.approved || 0).toLocaleString("cs-CZ") +
                "</td></tr>"
              );
            })
            .join("")
        : "";
    const budgetTable1Total = brTotal
      ? "<tr class=\"pa-budget-tot\"><td><strong>" +
        escapeHtml(brTotal.label) +
        "</strong></td><td style=\"text-align:right;font-family:'DM Mono',monospace\"><strong>" +
        Number(brTotal.requested || 0).toLocaleString("cs-CZ") +
        "</strong></td><td style=\"text-align:right;font-family:'DM Mono',monospace\"><strong>" +
        Number(brTotal.approved || 0).toLocaleString("cs-CZ") +
        "</strong></td></tr>"
      : "";
    const budgetTable1 =
      '<table class="pa-budget-tbl"><thead><tr><th>Položka</th><th style="text-align:right">V žádosti (Kč)</th><th style="text-align:right">Schváleno (Kč)</th></tr></thead><tbody>' +
      budgetTable1Rows +
      budgetTable1Total +
      '</tbody></table><p style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.45;">Tabulka odpovídá rozpočtu v přihlášce a schválení prorektora po položkách. Po uložení souhlasu jde o závazný rozpočet pro část 2.</p>';
    const ps = data.promisedSummary || {};
    const blA = c.budget_actual_lines && typeof c.budget_actual_lines === "object" ? c.budget_actual_lines : {};
    const blN = c.budget_line_notes && typeof c.budget_line_notes === "object" ? c.budget_line_notes : {};
    const realBudgetRows =
      brDetail.length > 0
        ? brDetail
            .map(function (r) {
              const av = blA[r.key] != null && blA[r.key] !== "" ? blA[r.key] : "";
              const nt = escapeHtml(String(blN[r.key] != null ? blN[r.key] : ""));
              return (
                "<tr><td>" +
                escapeHtml(r.label) +
                '</td><td style="text-align:right;font-family:\'DM Mono\',monospace">' +
                Number(r.approved || 0).toLocaleString("cs-CZ") +
                '</td><td><input type="number" min="0" step="1" class="pa-act-inp" id="pa_act_' +
                r.key +
                '" value="' +
                (av !== "" ? escapeHtml(String(av)) : "") +
                '"' +
                (readOnly ? " disabled" : "") +
                '></td><td><textarea class="pa-note-inp" id="pa_note_' +
                r.key +
                '" placeholder="Odchylka / komentář k položce…"' +
                (readOnly ? " disabled" : "") +
                ">" +
                nt +
                "</textarea></td></tr>"
              );
            })
            .join("")
        : "";
    const zzDraft = escapeHtml(c.final_report_draft || "");
    const zzFinal = escapeHtml(c.final_report_final || "");
    const dzf = c.deliverable_zprava_fulfilled ? " checked" : "";
    const dvf = c.deliverable_vystup_fulfilled ? " checked" : "";
    const daf = c.deliverable_aktivita_fulfilled ? " checked" : "";
    const dzn = escapeHtml(c.deliverable_zprava_note || "");
    const dvn = escapeHtml(c.deliverable_vystup_note || "");
    const dan = escapeHtml(c.deliverable_aktivita_note || "");
    const bVar = escapeHtml(c.budget_variance_explanation || "");
    const roNote = readOnly
      ? '<p class="postaward-readonly">Náhled pro oprávněné role; checklist ukládá pouze řešitel uvedený u přihlášky.</p>'
      : "";
    const consentActions = readOnly
      ? ""
      : '<div class="postaward-actions">' +
        '<button type="button" class="btn btn-primary" id="postawardSaveConsentBtn">Uložit souhlas</button>' +
        '<span class="postaward-mail" id="postawardConsentStatus"></span>' +
        "</div>";
    const completionActions = readOnly
      ? ""
      : '<div class="postaward-actions">' +
        '<button type="button" class="btn btn-primary" id="postawardSaveCompletionBtn">Uložit finální potvrzení řešitele</button>' +
        '<span class="postaward-mail" id="postawardCompletionStatus"></span>' +
        "</div>";
    const zzDraftActions = readOnly
      ? ""
      : '<div class="postaward-actions">' +
        '<button type="button" class="btn btn-secondary" id="postawardSaveZzDraftBtn">Uložit koncept ZZ</button>' +
        '<span class="postaward-mail" id="postawardZzDraftStatus"></span>' +
        "</div>";
    const zzFinalActions = readOnly
      ? ""
      : '<div class="postaward-actions">' +
        '<button type="button" class="btn btn-primary" id="postawardSaveZzFinalBtn">Uložit finální ZZ</button>' +
        '<span class="postaward-mail" id="postawardZzFinalStatus"></span>' +
        "</div>";
    const mailLine = mailHref
      ? '<p class="postaward-mail">Do příloh zapisujte zejména export z Magionu a povinné výstupy (soubory / odkazy). Text závěrečné zprávy pište v aplikaci výše. Případně e-mail: <a href="' +
        mailHref +
        '">' +
        escapeHtml(mail) +
        "</a></p>"
      : "<p class=\"postaward-mail\">E-mail administrátorky doplníte v CONFIG listu (coordinator_email) nebo kontaktujte OVTZ.</p>";

    const attachPicker = readOnly
      ? ""
      : '<div class="pa-attach-picker">' +
        '<label class="pa-attach-picker__lbl" for="pa_attach_files">Vybrat soubory z počítače (názvy se dopíší do seznamu)</label>' +
        '<input type="file" id="pa_attach_files" multiple>' +
        '<p class="pa-attach-picker__hint">Soubory se do Google tabulky <strong>nahrávají jen přes váš Disk / e-mail</strong>. Zde přidáte do pole níže jen názvy a velikosti; poté nahrajte soubory na úložiště a doplňte odkazy.</p>' +
        "</div>";

    const part1Hint =
      mode === "consent"
        ? '<p class="postaward-block-hint" style="margin-bottom:12px;">Vyplňte <strong>brzy po rozhodnutí prorektora</strong>. Tato část je nezávislá na závěrečném vyúčtování v <strong>části 2</strong> (samostatná stránka).</p>'
        : '<p class="postaward-block-hint" style="margin-bottom:12px;">Vyplňte <strong>brzy po rozhodnutí prorektora</strong>. Tato část je nezávislá na závěrečném vyúčtování níže.</p>';

    const prCommentLabel =
      mode === "consent"
        ? "<strong>Komentář prorektora (také v Moje projekty):</strong><br>"
        : "<strong>Komentář prorektora:</strong><br>";

    const part1Block =
      '<div class="postaward-part postaward-part--1">' +
      "<h4 class=\"postaward-part-title\">" +
      part1Title +
      "</h4>" +
      part1Hint +
      budgetTable1 +
      '<div class="postaward-block postaward-block--consent" style="margin-top:0;">' +
      '<div class="postaward-block-title">Stanovisko prorektora</div>' +
      (data.outcomeComment
        ? '<p class="postaward-expl" style="background:white;padding:10px 12px;border-radius:var(--r);border:1px solid var(--border);color:var(--navy);margin-bottom:10px;">' +
          prCommentLabel +
          escapeHtml(String(data.outcomeComment)) +
          "</p>"
        : '<p class="postaward-expl" style="margin-bottom:10px;">U této přihlášky není ve veřejném poli uveden textový komentář prorektora.</p>') +
      '<label class="postaward-task">' +
      '<input type="checkbox" id="pa_accept_comment"' +
      accCom +
      (readOnly ? " disabled" : "") +
      ">" +
      "<span>Beru na vědomí a souhlasím s komentářem prorektora (uvedeným výše; pokud komentář chybí, potvrzuji, že jsem s tím seznámen/a).</span>" +
      "</label>" +
      '<label class="postaward-task">' +
      '<input type="checkbox" id="pa_agree_budget"' +
      agrBud +
      (readOnly ? " disabled" : "") +
      ">" +
      "<span>" +
      agreeBudgetLabel +
      "</span>" +
      "</label>" +
      (c.consent_saved_at
        ? '<p class="postaward-mail" style="margin-top:10px;">Souhlas naposledy uložen: <strong>' +
          escapeHtml(c.consent_saved_at) +
          "</strong></p>"
        : "") +
      consentActions +
      "</div>" +
      "</div>";

    const part2Inner =
      '<p class="postaward-deadline">Lhůta pro dokončení povinností (vč. předání podkladů administrátorce): <span>' +
      escapeHtml(d.dueLabel || "—") +
      "</span></p>" +
      (d.activityEndLabel
        ? '<p class="postaward-expl">Plánované ukončení aktivity v přihlášce: <strong>' +
          escapeHtml(d.activityEndLabel) +
          "</strong>. Konečný termín dle výzvy: <strong>" +
          escapeHtml(d.hardCapLabel || "") +
          "</strong>.</p>"
        : "") +
      (d.explanation ? '<p class="postaward-expl">' + escapeHtml(d.explanation) + "</p>" : "") +
      '<div class="postaward-promised">' +
      '<h5 style="font-size:13px;font-weight:700;color:var(--navy);margin:0 0 10px;">Slíbeno – výtažek z žádosti a schválený rozpočet</h5>' +
      '<p style="font-size:13px;line-height:1.5;margin:6px 0;"><strong>Název projektu:</strong> ' +
      escapeHtml(ps.project_title || data.projectTitle || "—") +
      "</p>" +
      '<p style="font-size:13px;line-height:1.5;margin:6px 0;"><strong>Cíl / záměr aktivity:</strong><br>' +
      escapeHtml(ps.activity_goal || "—") +
      "</p>" +
      '<p style="font-size:13px;line-height:1.5;margin:6px 0;"><strong>Plánované výstupy (z přihlášky):</strong><br>' +
      escapeHtml(ps.output_description || "—") +
      "</p>" +
      '<p style="font-size:13px;line-height:1.5;margin:6px 0;"><strong>Odůvodnění rozpočtu v žádosti:</strong><br>' +
      escapeHtml(ps.budget_justification || "—") +
      "</p>" +
      '<h5 style="font-size:12px;margin:14px 0 8px;color:var(--navy-mid);">Rozpočet: žádost → schváleno (prorektor)</h5>' +
      budgetTable1 +
      "</div>" +
      '<div class="postaward-zz">' +
      '<h5 style="font-size:13px;font-weight:700;color:var(--navy);margin:0 0 8px;">Závěrečná zpráva – text v aplikaci</h5>' +
      '<p style="font-size:12px;color:var(--muted);margin:0 0 12px;line-height:1.45;">Nejdřív můžete ukládat <strong>koncept</strong>, poté po doplnění obsahu uložte <strong>finální znění</strong> (po souhlasu v části 1). Doporučení k rozsahu má příloha výzvy (např. cca 3 strany).</p>' +
      '<label for="pa_zz_draft">Koncept závěrečné zprávy (draft)</label>' +
      '<textarea id="pa_zz_draft" placeholder="Pracovní verze…"' +
      (readOnly ? " disabled" : "") +
      ">" +
      zzDraft +
      "</textarea>" +
      zzDraftActions +
      (c.zz_draft_saved_at
        ? '<p class="postaward-mail">Koncept naposledy uložen: <strong>' + escapeHtml(c.zz_draft_saved_at) + "</strong></p>"
        : "") +
      '<label for="pa_zz_final">Finální závěrečná zpráva</label>' +
      '<textarea id="pa_zz_final" placeholder="Finální text pro uzavření projektu v soutěži…"' +
      (readOnly ? " disabled" : "") +
      ">" +
      zzFinal +
      "</textarea>" +
      zzFinalActions +
      (c.final_report_final_saved_at
        ? '<p class="postaward-mail">Finální ZZ naposledy uložena: <strong>' +
          escapeHtml(c.final_report_final_saved_at) +
          "</strong></p>"
        : "") +
      "</div>" +
      '<p style="font-size:12px;font-weight:600;color:var(--navy);margin:20px 0 8px;">Reálný stav oproti schválenému rozpočtu</p>' +
      '<p style="font-size:11px;color:var(--muted);margin:0 0 10px;line-height:1.45;">U každé položky uveďte skutečně vyčerpanou částku a případně poznámku. Součet by měl odpovídat schválené podpoře <strong>' +
      offB.toLocaleString("cs-CZ") +
      " Kč</strong>; při odchylce doplňte celkové zdůvodnění níže.</p>" +
      '<table class="pa-budget-tbl pa-budget-tbl--real"><thead><tr><th>Položka</th><th style="text-align:right">Schváleno (Kč)</th><th>Skutečně (Kč)</th><th>Poznámka</th></tr></thead><tbody>' +
      realBudgetRows +
      "</tbody></table>" +
      '<label class="postaward-task" style="display:block;margin-top:14px;margin-bottom:6px;"><span style="font-weight:600;">Celkové zdůvodnění odchylky rozpočtu</span> <span style="color:var(--muted);font-weight:400;">(povinné, pokud se součet skutečných částek liší od schválené podpory)</span></label>' +
      '<textarea class="postaward-notes" id="pa_budget_variance" placeholder="např. neučerpáno u ubytování z důvodu…"' +
      (readOnly ? " disabled" : "") +
      ">" +
      bVar +
      "</textarea>" +
      '<div class="postaward-info" style="margin-top:22px;">' +
      "<p><strong>Diseminační aktivita (panelová diskuze)</strong></p>" +
      '<p style="font-size:12px;color:var(--muted);">Young Scientists Conference / PhD Summit nebo náhradní doložení dle OVTZ.</p>' +
      "<p><strong>Další povinné výstupy</strong> (lhůta a rozsah dle výzvy; stav potvrzujete níže)</p>" +
      "</div>" +
      mailLine +
      '<p style="font-size:12px;font-weight:600;color:var(--navy);margin:16px 0 8px;">Povinné výstupy – stav plnění</p>' +
      '<p style="font-size:11px;color:var(--muted);margin:0 0 10px;line-height:1.45;">U každého bodu zaškrtněte splnění, nebo uveďte krátké vysvětlení (min. 15 znaků), proč výstup splněn nebyl.</p>' +
      '<div class="postaward-deliv">' +
      '<div class="postaward-deliv-title">Závěrečná zpráva (text výše v aplikaci + rozsah dle výzvy)</div>' +
      '<label class="postaward-task"><input type="checkbox" id="pa_del_zpr"' +
      dzf +
      (readOnly ? " disabled" : "") +
      "><span>Potvrzuji, že závěrečná zpráva v aplikaci odpovídá požadavkům výzvy a je připravena / odevzdána v potřebné podobě.</span></label>" +
      '<textarea class="postaward-notes" id="pa_del_zpr_note" placeholder="Pokud nesplněno: důvod, náhradní postup, termín…"' +
      (readOnly ? " disabled" : "") +
      ">" +
      dzn +
      "</textarea>" +
      "</div>" +
      '<div class="postaward-deliv">' +
      '<div class="postaward-deliv-title">Výstup spolupráce (článek, skica, MoU, protokol, plán… dle výzvy)</div>' +
      '<label class="postaward-task"><input type="checkbox" id="pa_del_vys"' +
      dvf +
      (readOnly ? " disabled" : "") +
      "><span>Výstup splněn / odevzdán</span></label>" +
      '<textarea class="postaward-notes" id="pa_del_vys_note" placeholder="Pokud nesplněno: vysvětlete…"' +
      (readOnly ? " disabled" : "") +
      ">" +
      dvn +
      "</textarea>" +
      "</div>" +
      '<div class="postaward-deliv">' +
      '<div class="postaward-deliv-title">Potvrzení o uskutečněné aktivitě (např. účast na konferenci)</div>' +
      '<label class="postaward-task"><input type="checkbox" id="pa_del_akt"' +
      daf +
      (readOnly ? " disabled" : "") +
      "><span>Výstup splněn / odevzdán</span></label>" +
      '<textarea class="postaward-notes" id="pa_del_akt_note" placeholder="Pokud nesplněno: vysvětlete…"' +
      (readOnly ? " disabled" : "") +
      ">" +
      dan +
      "</textarea>" +
      "</div>" +
      '<p style="font-size:12px;font-weight:600;color:var(--navy);margin:20px 0 8px;">Další potvrzení dle výzvy</p>' +
      '<label class="postaward-task">' +
      '<input type="checkbox" id="pa_dis"' +
      dis +
      (readOnly ? " disabled" : "") +
      ">" +
      "<span>Potvrzuji splnění / řízení náhradního doložení u <strong>diseminační aktivity</strong> dle pokynů OVTZ (včetně případné náhrady dle bodu 1b).</span>" +
      "</label>" +
      '<label class="postaward-task">' +
      '<input type="checkbox" id="pa_pkg"' +
      pkg +
      (readOnly ? " disabled" : "") +
      ">" +
      "<span>Potvrzuji předání / odeslání podkladů administrátorce (vč. příloh výše): výstup spolupráce, potvrzení aktivity a související soubory dle výzvy – závěrečná zpráva je evidována jako text v této aplikaci.</span>" +
      "</label>" +
      '<label class="postaward-task">' +
      '<input type="checkbox" id="pa_ack"' +
      ack +
      (readOnly ? " disabled" : "") +
      ">" +
      "<span>Seznámil(a) jsem se s následky nedodržení podmínek uvedenými níže.</span>" +
      "</label>" +
      '<p style="margin-top:14px;font-size:12px;font-weight:600;color:var(--navy);">Přílohy (Magion, povinné výstupy)</p>' +
      '<p style="font-size:12px;color:var(--muted);margin:4px 0 8px;line-height:1.45;">Sem uvádějte zejména <strong>export z Magionu</strong> a soubory / odkazy k <strong>povinným výstupům</strong> (neplní funkci textu ZZ – ten je v aplikaci). Názvy souborů, odkazy na úložiště nebo poznámku k e-mailové zásilce.</p>' +
      attachPicker +
      '<textarea class="postaward-notes" id="pa_attachments" placeholder="např. Závěrečná_zpráva_APP-123.pdf (odkaz: …); Výstup_MoU.pdf …"' +
      (readOnly ? " disabled" : "") +
      ">" +
      att +
      "</textarea>" +
      '<p style="margin-top:12px;font-size:12px;color:var(--muted);">Další poznámka pro vás / OVTZ (nepovinné):</p>' +
      '<textarea class="postaward-notes" id="pa_notes" placeholder="např. datum odeslání, doplňující informace…"' +
      (readOnly ? " disabled" : "") +
      ">" +
      notes +
      "</textarea>" +
      (c.completion_saved_at
        ? '<p class="postaward-mail" style="margin-top:10px;">Potvrzení řešitele naposledy uloženo: <strong>' +
          escapeHtml(c.completion_saved_at) +
          "</strong></p>"
        : "") +
      completionActions;

    const consBlock =
      '<div class="postaward-cons">' +
      "<strong>Následky nedodržení (dle výzvy)</strong>" +
      "<ol>" +
      "<li>Pokud nebyla zrealizována aktivita, nebyl doložen výstup spolupráce nebo nebyla odevzdána závěrečná zpráva v požadované kvalitě, může prorektorka pro VVTZ na základě doporučení hodnoticího panelu rozhodnout o: (a) vyhodnocení projektu jako neúspěšného pro účely soutěže UHK Connect, (b) omezení účasti řešitele v <strong>dvou následujících výzvách</strong> UHK Connect.</li>" +
      "<li>O neúspěšnosti projektu budou informováni děkan, vedoucí pracoviště, popř. garant DSP a školitel.</li>" +
      "</ol>" +
      "</div>";

    const savedAtLine = c.savedAt
      ? '<p class="postaward-mail" style="margin-top:12px;">Poslední změna záznamu v systému: <strong>' +
        escapeHtml(c.savedAt) +
        "</strong></p>"
      : "";

    const closeHref = (ctx && ctx.closeoutHref) || "#";
    const detailHref = (ctx && ctx.detailHref) || "#";
    const myConnectHref = (ctx && ctx.myConnectHref) || "#";

    if (mode === "consent") {
      return (
        '<div class="postaward-wrap">' +
        "<h3>Po schválení přihlášky</h3>" +
        '<p class="postaward-sub">Platí pro stanovisko <strong>' +
        escapeHtml(data.outcomeLabel || "") +
        "</strong>. Vyplňte nejdřív <strong>část 1 (souhlas)</strong> zde. " +
        "<strong>Závěrečná zpráva, výstupy a vyúčtování</strong> vyplníte na " +
        '<a href="' +
        escapeHtml(closeHref) +
        '">samostatné stránce</a> – přehledněji a s více místem pro tabulky.</p>' +
        roNote +
        part1Block +
        '<div class="postaward-part postaward-part--nav2" style="text-align:left;">' +
        '<h4 class="postaward-part-title" style="font-size:14px;">Část 2 – závěrečná zpráva, výstupy a vyúčtování</h4>' +
        '<p class="postaward-block-hint" style="margin-bottom:14px;">Otevřete samostatnou stránku se závěrečnou zprávou, skutečným rozpočtem a seznamem příloh.</p>' +
        '<a href="' +
        escapeHtml(closeHref) +
        '" class="btn btn-primary">Otevřít část 2 →</a>' +
        "</div>" +
        "</div>"
      );
    }

    if (mode === "closeout") {
      return (
        '<div class="postaward-wrap">' +
        "<h3>Část 2 – závěrečná zpráva, výstupy a vyúčtování</h3>" +
        '<p class="postaward-sub">Projekt: <strong>' +
        escapeHtml(ps.project_title || data.projectTitle || "—") +
        '</strong> · ID <span style="font-family:\'DM Mono\',monospace">' +
        escapeHtml(data.applicationId || "—") +
        '</span>. <a href="' +
        escapeHtml(detailHref) +
        '">← Část 1 – souhlas a detail podání</a> · <a href="' +
        escapeHtml(myConnectHref) +
        '">Moje projekty</a></p>' +
        roNote +
        '<div class="postaward-part postaward-part--2">' +
        part2Inner +
        "</div>" +
        savedAtLine +
        consBlock +
        "</div>"
      );
    }

    return "<p class=\"postaward-mail\">Neznámý režim panelu.</p>";
  }

  function bindConnectPostAwardForm(data, applicationId, competitionId, callbacks) {
    if (!data.canEdit) return;
    const showToast = callbacks.showToast;
    const remount = callbacks.remount;
    const btnC = document.getElementById("postawardSaveConsentBtn");
    const btnF = document.getElementById("postawardSaveCompletionBtn");
    const btnZd = document.getElementById("postawardSaveZzDraftBtn");
    const btnZf = document.getElementById("postawardSaveZzFinalBtn");

    function collectBudgetActualFromDom() {
      const lines = {};
      const notes = {};
      (data.budgetRows || [])
        .filter(function (x) {
          return x.key !== "budget_total";
        })
        .forEach(function (r) {
          const act = document.getElementById("pa_act_" + r.key);
          const nt = document.getElementById("pa_note_" + r.key);
          if (act && act.value !== "") {
            const n = Number(act.value);
            if (isFinite(n) && n >= 0) lines[r.key] = Math.round(n);
          }
          if (nt && nt.value.trim()) notes[r.key] = nt.value.trim();
        });
      return { budget_actual_lines: lines, budget_line_notes: notes };
    }

    async function saveSection(section, checklist, statusEl, btnEl) {
      if (!btnEl) return;
      btnEl.disabled = true;
      if (statusEl) statusEl.textContent = "Ukládám…";
      try {
        const res = await api().saveConnectPostAward(competitionId, applicationId, checklist, section);
        if (res.error) throw new Error(res.error);
        if (statusEl) statusEl.textContent = "Uloženo ✓";
        var msg = "Uloženo.";
        if (section === "consent") msg = "Souhlas uložen.";
        else if (section === "completion") msg = "Finální potvrzení uloženo.";
        else if (section === "report_draft") msg = "Koncept ZZ uložen.";
        else if (section === "report_final") msg = "Finální ZZ uložena.";
        showToast(msg);
        await remount();
      } catch (e) {
        if (statusEl) statusEl.textContent = "";
        showToast(e.message || "Uložení selhalo", "err");
      } finally {
        btnEl.disabled = false;
      }
    }

    if (btnC) {
      btnC.addEventListener("click", function () {
        saveSection(
          "consent",
          {
            accepts_prorektor_public_comment: !!document.getElementById("pa_accept_comment")?.checked,
            agrees_solution_and_budget: !!document.getElementById("pa_agree_budget")?.checked,
          },
          document.getElementById("postawardConsentStatus"),
          btnC
        );
      });
    }
    if (btnZd) {
      btnZd.addEventListener("click", function () {
        saveSection(
          "report_draft",
          { final_report_draft: document.getElementById("pa_zz_draft")?.value || "" },
          document.getElementById("postawardZzDraftStatus"),
          btnZd
        );
      });
    }
    if (btnZf) {
      btnZf.addEventListener("click", function () {
        saveSection(
          "report_final",
          { final_report_final: document.getElementById("pa_zz_final")?.value || "" },
          document.getElementById("postawardZzFinalStatus"),
          btnZf
        );
      });
    }
    if (btnF) {
      btnF.addEventListener("click", function () {
        var collected = collectBudgetActualFromDom();
        saveSection(
          "completion",
          {
            deliverable_zprava_fulfilled: !!document.getElementById("pa_del_zpr")?.checked,
            deliverable_zprava_note: document.getElementById("pa_del_zpr_note")?.value || "",
            deliverable_vystup_fulfilled: !!document.getElementById("pa_del_vys")?.checked,
            deliverable_vystup_note: document.getElementById("pa_del_vys_note")?.value || "",
            deliverable_aktivita_fulfilled: !!document.getElementById("pa_del_akt")?.checked,
            deliverable_aktivita_note: document.getElementById("pa_del_akt_note")?.value || "",
            budget_actual_lines: collected.budget_actual_lines,
            budget_line_notes: collected.budget_line_notes,
            budget_variance_explanation: document.getElementById("pa_budget_variance")?.value || "",
            dissemination_fulfilled: !!document.getElementById("pa_dis")?.checked,
            package_emailed_declared: !!document.getElementById("pa_pkg")?.checked,
            consequences_acknowledged: !!document.getElementById("pa_ack")?.checked,
            attachments_manifest: document.getElementById("pa_attachments")?.value || "",
            notes: document.getElementById("pa_notes")?.value || "",
          },
          document.getElementById("postawardCompletionStatus"),
          btnF
        );
      });
    }

    var paFiles = document.getElementById("pa_attach_files");
    if (paFiles) {
      paFiles.addEventListener("change", function () {
        var ta = document.getElementById("pa_attachments");
        if (!ta || !this.files || !this.files.length) return;
        var lines = Array.prototype.map
          .call(this.files, function (f) {
            return f.name + " (" + Math.round(f.size / 1024) + " kB)";
          })
          .join("\n");
        ta.value = ta.value.trim() ? ta.value.trim() + "\n" + lines : lines;
        this.value = "";
      });
    }
  }

  async function mount(rootEl, competitionId, applicationId, mode, callbacks) {
    const showToast = callbacks.showToast;
    const applicantLine = callbacks.applicantLine || "";
    if (!rootEl || !applicationId || !competitionId) return;
    rootEl.style.display = "block";
    rootEl.innerHTML = '<p style="font-size:13px;color:var(--muted);padding:12px;">Načítám data…</p>';
    try {
      const data = await api().getConnectPostAward(competitionId, applicationId);
      if (data.error) throw new Error(data.error);
      if (!data.applicable) {
        rootEl.innerHTML = "";
        rootEl.style.display = "none";
        return;
      }
      const ctx = {
        closeoutHref: "connect-closeout.html?c=" + encodeURIComponent(competitionId) + "&app=" + encodeURIComponent(applicationId),
        detailHref: "apply-connect.html?c=" + encodeURIComponent(competitionId) + "&app=" + encodeURIComponent(applicationId),
        myConnectHref: "my-connect.html?c=" + encodeURIComponent(competitionId),
        applicantLine: applicantLine,
      };
      rootEl.innerHTML = buildConnectPostAwardPanel(data, mode, ctx);
      const remount = function () {
        return mount(rootEl, competitionId, applicationId, mode, callbacks);
      };
      bindConnectPostAwardForm(data, applicationId, competitionId, { showToast: showToast, remount: remount });
    } catch (e) {
      rootEl.innerHTML = '<p style="font-size:13px;color:#991B1B;">' + escapeHtml(e.message) + "</p>";
    }
  }

  global.ConnectPostAwardPanel = {
    mount: mount,
    buildConnectPostAwardPanel: buildConnectPostAwardPanel,
    bindConnectPostAwardForm: bindConnectPostAwardForm,
  };
})(typeof window !== "undefined" ? window : globalThis);
