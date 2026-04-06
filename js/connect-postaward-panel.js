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
    const zzFinalized = String(c.final_report_final_saved_at || "").trim().length > 0;
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
    var zzSection = "";
    if (zzFinalized) {
      zzSection =
        '<div class="postaward-zz">' +
        '<h5 style="font-size:13px;font-weight:700;color:var(--navy);margin:0 0 8px;">Závěrečná zpráva (finalizováno)</h5>' +
        '<p class="postaward-mail" style="margin-bottom:12px;">Text byl v aplikaci uzavřen. Datum uložení: <strong>' +
        escapeHtml(String(c.final_report_final_saved_at || "—")) +
        "</strong></p>" +
        '<div class="postaward-zz-final-readonly" style="white-space:pre-wrap;padding:14px;border:1px solid var(--border);border-radius:var(--r);background:rgba(255,255,255,.95);font-size:13px;line-height:1.55;max-height:480px;overflow:auto;">' +
        escapeHtml(String(c.final_report_final || "")) +
        "</div>" +
        "</div>";
    } else {
      zzSection =
        '<div class="postaward-zz">' +
        '<h5 style="font-size:13px;font-weight:700;color:var(--navy);margin:0 0 8px;">Závěrečná zpráva – koncept</h5>' +
        '<p style="font-size:12px;color:var(--muted);margin:0 0 12px;line-height:1.45;">Pište průběžně; <strong>koncept se ukládá automaticky</strong> stejně jako u přihlášky (30 s od poslední úpravy). Kdykoli můžete odejít a <strong>vrátit se k rozpracovanému textu</strong>. Tlačítkem <strong>Uložit koncept nyní</strong> uložíte okamžitě. Až bude text hotový (alespoň 80 znaků, po souhlasu v části 1), <strong>finalizujte</strong> závěrečnou zprávu – tím ji uzavřete v evidenci soutěže. Rozsah dle přílohy výzvy (např. cca 3 strany).</p>' +
        '<label for="pa_zz_draft">Text závěrečné zprávy</label>' +
        '<textarea id="pa_zz_draft" placeholder="Průběžně pište závěrečnou zprávu…"' +
        (readOnly ? " disabled" : "") +
        ">" +
        zzDraft +
        "</textarea>" +
        (readOnly
          ? ""
          : '<div class="postaward-actions" style="margin-top:10px;">' +
            '<button type="button" class="btn btn-secondary" id="postawardSaveZzDraftManualBtn">Uložit koncept nyní</button>' +
            '<span class="postaward-mail" id="postawardZzDraftStatus" style="margin-left:10px;"></span>' +
            "</div>" +
            '<p class="postaward-mail" id="pa_zz_serverHint">' +
            (c.zz_draft_saved_at
              ? "Koncept na serveru naposledy: <strong>" + escapeHtml(c.zz_draft_saved_at) + "</strong>"
              : '<span style="opacity:.85">Koncept zatím nebyl uložen na server – začněte psát nebo uložte ručně.</span>') +
            "</p>" +
            '<div style="margin-top:20px;padding-top:16px;border-top:1px dashed #D4C4A8;">' +
            '<p style="font-size:12px;color:var(--navy-mid);margin:0 0 12px;line-height:1.45;">Finalizace uloží text jako závěrečnou zprávu projektu v soutěži. Poté doplňte rozpočet, výstupy a uložte <strong>finální potvrzení řešitele</strong> níže.</p>' +
            '<button type="button" class="btn btn-primary" id="postawardFinalizeZzBtn">Finalizovat závěrečnou zprávu</button>' +
            '<span class="postaward-mail" id="postawardFinalizeZzStatus" style="margin-left:10px;"></span>' +
            "</div>") +
        "</div>";
    }

    const mailLine = mailHref
      ? '<p class="postaward-mail">Do příloh zapisujte zejména export z Magionu a povinné výstupy (soubory / odkazy). Text závěrečné zprávy pište v aplikaci výše. Případně e-mail: <a href="' +
        mailHref +
        '">' +
        escapeHtml(mail) +
        "</a></p>"
      : "<p class=\"postaward-mail\">E-mail administrátorky doplníte v CONFIG listu (coordinator_email) nebo kontaktujte OVTZ.</p>";

    var folderHref = String(data.attachmentsDriveFolderUrl || "").trim();
    if (!/^https:\/\/drive\.google\.com\//.test(folderHref)) {
      folderHref = "https://drive.google.com/drive/folders/1oJ7qujZhIBygFYgiN5Im7fmpKbeADDDi";
    }
    const attachPicker = readOnly
      ? ""
      : '<div class="pa-attach-picker">' +
        '<label class="pa-attach-picker__lbl" for="pa_attach_files">Nahrát soubory na sdílený Disk (složka soutěže)</label>' +
        '<input type="file" id="pa_attach_files" multiple>' +
        '<p class="pa-attach-picker__hint">Soubory se uloží do <a href="' +
        folderHref +
        '" target="_blank" rel="noopener">této složky na Google Disku</a>. Do pole níže se dopíše název souboru a odkaz (max. 18 MB na soubor). Můžete také zapsat další položky ručně nebo doplnit poznámku.</p>' +
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
      zzSection +
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
        else if (section === "report_draft") msg = "Koncept závěrečné zprávy uložen.";
        else if (section === "report_final") msg = "Závěrečná zpráva je finalizována.";
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
    var zzFinalizedBind =
      data.checklist && String(data.checklist.final_report_final_saved_at || "").trim().length > 0;
    var zzAutosaveTimer = null;
    var zzDraftDirty = false;
    var zzSaveSilentInFlight = false;
    if (callbacks.registerZzCleanup) {
      callbacks.registerZzCleanup(function () {
        clearTimeout(zzAutosaveTimer);
        zzAutosaveTimer = null;
      });
    }
    var draftEl = document.getElementById("pa_zz_draft");
    if (!zzFinalizedBind && draftEl) {
      function scheduleZzAutosave() {
        zzDraftDirty = true;
        clearTimeout(zzAutosaveTimer);
        zzAutosaveTimer = setTimeout(function () {
          void saveZzDraftSilent();
        }, 30000);
      }
      draftEl.addEventListener("input", scheduleZzAutosave);
      draftEl.addEventListener("change", scheduleZzAutosave);

      async function saveZzDraftSilent() {
        if (!zzDraftDirty || zzSaveSilentInFlight) return;
        var el = document.getElementById("pa_zz_draft");
        if (!el) return;
        zzSaveSilentInFlight = true;
        var st = document.getElementById("postawardZzDraftStatus");
        var hint = document.getElementById("pa_zz_serverHint");
        if (st) st.textContent = "Ukládám koncept…";
        try {
          var res = await api().saveConnectPostAward(
            competitionId,
            applicationId,
            { final_report_draft: el.value },
            "report_draft"
          );
          if (res.error) throw new Error(res.error);
          zzDraftDirty = false;
          if (st) st.textContent = "";
          var at = res.checklist && res.checklist.zz_draft_saved_at ? res.checklist.zz_draft_saved_at : "";
          if (hint && at) {
            hint.innerHTML = "Koncept na serveru naposledy: <strong>" + escapeHtml(at) + "</strong>";
          } else if (hint) {
            hint.innerHTML = '<span style="opacity:.85">Koncept uložen.</span>';
          }
        } catch (e) {
          if (st) st.textContent = "";
          showToast(e.message || "Koncept se nepodařilo uložit", "err");
        } finally {
          zzSaveSilentInFlight = false;
        }
      }

      var btnMan = document.getElementById("postawardSaveZzDraftManualBtn");
      if (btnMan) {
        btnMan.addEventListener("click", function () {
          zzDraftDirty = true;
          void saveZzDraftSilent();
        });
      }

      var btnFin = document.getElementById("postawardFinalizeZzBtn");
      if (btnFin) {
        btnFin.addEventListener("click", function () {
          var elz = document.getElementById("pa_zz_draft");
          var txt = (elz && elz.value) || "";
          if (String(txt).trim().length < 80) {
            showToast("Doplňte text závěrečné zprávy (alespoň 80 znaků) před finalizací.", "err");
            return;
          }
          clearTimeout(zzAutosaveTimer);
          zzAutosaveTimer = null;
          zzDraftDirty = true;
          void (async function () {
            await saveZzDraftSilent();
            elz = document.getElementById("pa_zz_draft");
            txt = (elz && elz.value) || "";
            if (String(txt).trim().length < 80) {
              showToast("Text je příliš krátký pro finalizaci.", "err");
              return;
            }
            saveSection(
              "report_final",
              { final_report_final: txt, final_report_draft: txt },
              document.getElementById("postawardFinalizeZzStatus"),
              btnFin
            );
          })();
        });
      }
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
        var files = Array.prototype.slice.call(this.files);
        this.value = "";
        var client = api();
        if (typeof client.uploadConnectPostAwardAttachment !== "function") {
          showToast("Chybí upload v api.js – aktualizujte frontend.", "err");
          return;
        }
        var maxB = 18 * 1024 * 1024;
        (async function () {
          var ok = 0;
          showToast("Nahrávám " + files.length + " soubor(ů)…");
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.size > maxB) {
              showToast("Příliš velký soubor (max. 18 MB): " + file.name, "err");
              continue;
            }
            try {
              var res = await client.uploadConnectPostAwardAttachment(competitionId, applicationId, file);
              if (res && res.error) throw new Error(res.error);
              var line = (res && res.name ? res.name : file.name) + " → " + (res && res.url ? res.url : "");
              ta.value = ta.value.trim() ? ta.value.trim() + "\n" + line : line;
              ok++;
            } catch (err) {
              showToast(err.message || "Nahrání selhalo: " + file.name, "err");
            }
          }
          if (ok > 0) showToast("Nahráno souborů: " + ok + ". Nezapomeňte uložit finální potvrzení řešitele.");
        })();
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
      const mountState = { zzCleanup: null };
      const remount = async function () {
        if (mountState.zzCleanup) {
          try {
            mountState.zzCleanup();
          } catch (err) {}
          mountState.zzCleanup = null;
        }
        return mount(rootEl, competitionId, applicationId, mode, callbacks);
      };
      bindConnectPostAwardForm(data, applicationId, competitionId, {
        showToast: showToast,
        remount: remount,
        registerZzCleanup: function (fn) {
          mountState.zzCleanup = fn;
        },
      });
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
