import { computeCompteResultat, computeCashFlowHistorique, computeCashFlowPrevisionnel, computeEndettementGlobal } from "./analyseFinanciereUtils";
import { computeDSCR } from "./financingUtils";
import { liabilityCategoryLabel } from "./constants";

// jsPDF utilise par défaut une police (Helvetica) qui ne sait pas afficher l'espace fine
// insécable utilisée par Intl.NumberFormat("fr-FR") comme séparateur de milliers — elle se
// transforme visuellement en "/". On utilise donc un espace normal, uniquement pour le PDF.
function formatMontant(v, devise) {
  const rounded = Math.round(v || 0);
  const withSpaces = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (rounded < 0 ? "-" : "") + withSpaces + (devise ? " " + devise : "");
}

// Les librairies d'export (xlsx, jsPDF) sont assez lourdes : on ne les charge
// qu'au moment où l'utilisateur clique réellement sur un bouton d'export,
// plutôt que de les inclure dans le chargement initial de l'application.
export async function exportExcel(transactions, company) {
  const XLSX = await import("xlsx");
  const rows = transactions.map((t) => ({
    Date: t.date,
    Sens: t.sens === "recette" ? "Recette" : "Dépense",
    Profil: t.type_op,
    Catégorie: t.categorie,
    Libellé: t.libelle,
    Montant: t.montant,
    Devise: t.devise,
    Taux: t.taux,
    [`Contre-valeur (${company.devise_base})`]: t.montant_base,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Écritures");
  XLSX.writeFile(wb, `ecritures_${company.name.replace(/\s+/g, "_")}.xlsx`);
}

export async function exportPdf(transactions, company, kpis) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(company.name, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Rapport financier — devise de base : ${company.devise_base}`, 14, 25);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);

  doc.setFontSize(11);
  doc.setTextColor(20);
  const kpiLines = [
    `Chiffre d'affaires : ${formatMontant(kpis.ca, company.devise_base)}`,
    `Dépenses : ${formatMontant(kpis.dep, company.devise_base)}`,
    `Profit net : ${formatMontant(kpis.profit, company.devise_base)}`,
    `Marge : ${kpis.marge.toFixed(1)} %`,
  ];
  kpiLines.forEach((line, i) => doc.text(line, 14, 42 + i * 6));

  autoTable(doc, {
    startY: 42 + kpiLines.length * 6 + 6,
    head: [["Date", "Profil", "Catégorie", "Libellé", "Montant", `Contre-val. (${company.devise_base})`]],
    body: transactions.map((t) => [
      t.date,
      t.type_op,
      t.categorie,
      t.libelle || "—",
      `${t.sens === "recette" ? "+" : "-"}${t.montant} ${t.devise}`,
      formatMontant(t.montant_base, ""),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  doc.save(`rapport_${company.name.replace(/\s+/g, "_")}.pdf`);
}

// ---------- Pilier 3 : Dossier de financement (Premium) ----------
// Document professionnel destiné à être partagé avec une banque ou un investisseur :
// historique, indicateurs de fiabilité, score de santé, projection de trésorerie.
export async function exportDossierFinancement(transactions, products, credits, company, analysis, assets = [], liabilities = [], financingRequest = null, readiness = null, documents = [], requestItems = [], liabilityPayments = [], capacity = null) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  const devise = company.devise_base;
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date();

  // ---------- Bloc 3-6 : mêmes calculs que l'onglet Analyse, réutilisés tels quels ----------
  const compteResultat = computeCompteResultat(transactions, { months: 12 });
  const cashFlowHisto = computeCashFlowHistorique(transactions, liabilityPayments, liabilities, { months: 12 });
  const cashFlowPrevisionnel = computeCashFlowPrevisionnel(transactions, liabilities, { monthsAhead: 6 });
  const avgMonthlyNet = capacity?.avgMonthlyNet ?? (cashFlowHisto.length >= 3
    ? cashFlowHisto.slice(-3).reduce((s, m) => s + m.net, 0) / 3
    : null);
  const tresorerieBase = transactions.reduce((s, t) => s + (t.sens === "recette" ? Number(t.montant_base) : -Number(t.montant_base)), 0);
  const valeurStockBase = products.reduce((s, p) => s + Number(p.quantity) * Number(p.cost_price || p.unit_price || 0), 0);
  const creancesBase = credits.filter((c) => c.type === "client" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
  const immobilisationsBase = assets.reduce((s, a) => s + Number(a.valeur), 0);
  const totalActifsBase = tresorerieBase + valeurStockBase + creancesBase + immobilisationsBase;
  const dettesFournisseursBase = credits.filter((c) => c.type === "fournisseur" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
  const dettesFinancieresBase = liabilities.filter((l) => l.statut === "actif").reduce((s, l) => s + (Number(l.montant) - Number(l.montant_rembourse)), 0);
  const capitauxPropresBase = totalActifsBase - (dettesFournisseursBase + dettesFinancieresBase);
  const endettement = computeEndettementGlobal({ credits, liabilities, ca: compteResultat.ca, avgMonthlyNet: avgMonthlyNet || 0, capitauxPropres: capitauxPropresBase });
  const dscr = (financingRequest && avgMonthlyNet)
    ? computeDSCR({ avgMonthlyNet, liabilities, montantSouhaite: financingRequest.montant_souhaite, dureeMois: financingRequest.duree_mois })
    : null;
  const utilisationItems = financingRequest ? requestItems.filter((i) => i.financing_request_id === financingRequest.id) : [];
  const margeEstimee = financingRequest?.ca_attendu != null ? Number(financingRequest.ca_attendu) - Number(financingRequest.montant_souhaite) : null;
  const roiPct = margeEstimee != null && Number(financingRequest?.montant_souhaite) > 0 ? (margeEstimee / Number(financingRequest.montant_souhaite)) * 100 : null;

  // ---------- Page de garde ----------
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("RIDIX FINANCING PACK", 14, 20);
  doc.setFontSize(22);
  doc.text(company.name, 14, 34);
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`Profil d'activité : ${company.profil || "—"}  ·  Devise de référence : ${devise}`, 14, 44);

  const anciennete = company.created_at
    ? Math.max(0, Math.round((today - new Date(company.created_at)) / (1000 * 60 * 60 * 24 * 30)))
    : null;

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  let y = 75;
  doc.setFont(undefined, "bold");
  doc.text("Indicateurs de fiabilité", 14, y);
  doc.setFont(undefined, "normal");
  y += 8;
  const indicateurs = [
    [`Ancienneté du compte`, anciennete !== null ? `${anciennete} mois de suivi` : "—"],
    [`Nombre d'écritures enregistrées`, `${transactions.length}`],
    [`Score de santé financière`, `${analysis.score} / 100`],
    ...(readiness ? [[`Score de préparation au financement`, `${readiness.score} / 100`]] : []),
    [`Produits suivis en stock`, `${products.length}`],
    [`Dossiers de créances/dettes suivis`, `${credits.length}`],
    ...(documents.length > 0 ? [[`Documents disponibles (Data Room)`, `${documents.length}`]] : []),
  ];
  autoTable(doc, {
    startY: y,
    body: indicateurs,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: { 0: { textColor: [71, 85, 105] }, 1: { fontStyle: "bold", halign: "right" } },
  });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Document généré automatiquement le ${today.toLocaleDateString("fr-FR")} — Ridix`, 14, 285);

  // ---------- Page : Besoin de financement & préparation ----------
  let curY;
  if (financingRequest || readiness) {
    doc.addPage();
    sectionTitle(doc, "Besoin de financement & préparation");
    curY = 30;

    if (financingRequest) {
      const NEED_LABELS = { fonds_roulement: "Fonds de roulement", stock: "Achat de stock", equipement: "Équipement", immobilier: "Immobilier", tresorerie: "Trésorerie ponctuelle", autre: "Autre" };
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text("Besoin exprimé", 14, curY);
      autoTable(doc, {
        startY: curY + 4,
        body: [
          ["Type de besoin", NEED_LABELS[financingRequest.type_besoin] || financingRequest.type_besoin],
          ["Montant souhaité", formatMontant(financingRequest.montant_souhaite, financingRequest.devise)],
          ["Description", financingRequest.description || "—"],
          ["Exprimé le", new Date(financingRequest.created_at).toLocaleDateString("fr-FR")],
        ],
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 1.5 },
        columnStyles: { 0: { textColor: [71, 85, 105], cellWidth: 50 }, 1: { fontStyle: "bold" } },
      });
      curY = doc.lastAutoTable.finalY + 12;

      if (utilisationItems.length > 0) {
        doc.setFont(undefined, "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text("Utilisation du financement", 14, curY);
        autoTable(doc, {
          startY: curY + 4,
          head: [["Poste", "Montant"]],
          body: [
            ...utilisationItems.map((i) => [i.libelle, formatMontant(i.montant, financingRequest.devise)]),
            ["Total ventilé", formatMontant(utilisationItems.reduce((s, i) => s + Number(i.montant), 0), financingRequest.devise)],
          ],
          styles: { fontSize: 9 },
          headStyles: { fillColor: [30, 41, 59] },
          didParseCell: (data) => { if (data.row.index === utilisationItems.length) data.cell.styles.fontStyle = "bold"; },
        });
        curY = doc.lastAutoTable.finalY + 12;
      }

      if (financingRequest.ca_attendu != null || financingRequest.delai_rotation_jours != null) {
        doc.setFont(undefined, "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text("ROI attendu du projet", 14, curY);
        const roiRows = [];
        if (financingRequest.ca_attendu != null) roiRows.push(["CA attendu grâce au financement", formatMontant(financingRequest.ca_attendu, financingRequest.devise)]);
        if (margeEstimee != null) roiRows.push(["Marge estimée", formatMontant(margeEstimee, financingRequest.devise)]);
        if (roiPct != null) roiRows.push(["ROI attendu", `${roiPct.toFixed(0)} %`]);
        if (financingRequest.delai_rotation_jours != null) roiRows.push(["Délai de rotation estimé", `${financingRequest.delai_rotation_jours} jours`]);
        autoTable(doc, {
          startY: curY + 4,
          body: roiRows,
          theme: "plain",
          styles: { fontSize: 10, cellPadding: 1.5 },
          columnStyles: { 0: { textColor: [71, 85, 105] }, 1: { fontStyle: "bold", halign: "right" } },
        });
        curY = doc.lastAutoTable.finalY + 12;
      }
    }

    doc.setFontSize(8);
    doc.setTextColor(180, 130, 30);
    doc.text("Rappel : la capacité et le score affichés dans ce dossier sont indicatifs et ne constituent en aucun cas une décision de crédit.", 14, curY);
    curY += 8;

    if (readiness) {
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(`Score de préparation au financement : ${readiness.score} / 100`, 14, curY);
      autoTable(doc, {
        startY: curY + 4,
        head: [["Critère", "Points"]],
        body: readiness.items.map((i) => [i.label, `${i.points} / ${i.max}`]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
      });
      curY = doc.lastAutoTable.finalY + 10;

      if (readiness.problems.length > 0) {
        doc.setFont(undefined, "bold");
        doc.setFontSize(10);
        doc.setTextColor(20, 20, 20);
        doc.text("Points à renforcer", 14, curY);
        curY += 5;
        doc.setFont(undefined, "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        readiness.problems.forEach((p) => {
          const lines = doc.splitTextToSize(`• ${p.recommendation}`, pageWidth - 28);
          doc.text(lines, 14, curY);
          curY += lines.length * 4.5 + 2;
        });
      }
    }

    if (dscr) {
      curY += 4;
      if (curY > 250) { doc.addPage(); curY = 20; }
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(`Capacité de remboursement — DSCR indicatif : ${dscr.dscr.toFixed(2)}x`, 14, curY);
      autoTable(doc, {
        startY: curY + 4,
        body: [
          ["Flux de trésorerie disponible", `${formatMontant(dscr.avgMonthlyNet, devise)} / mois`],
          ["Charges financières existantes", `${formatMontant(dscr.chargesFinancieresExistantes, devise)} / mois`],
          ["Capacité indicative de service de la dette", `${formatMontant(dscr.capaciteServiceDette, devise)} / mois`],
          ["Mensualité nouvelle estimée (linéaire)", `${formatMontant(dscr.mensualiteNouvelle, devise)} / mois`],
        ],
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 1.5 },
        columnStyles: { 0: { textColor: [71, 85, 105] }, 1: { fontStyle: "bold", halign: "right" } },
      });
      curY = doc.lastAutoTable.finalY + 5;
      doc.setFont(undefined, "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const dscrLines = doc.splitTextToSize(dscr.appreciation, pageWidth - 28);
      doc.text(dscrLines, 14, curY);
      curY += dscrLines.length * 4.5 + 4;
      doc.setFontSize(8);
      doc.setTextColor(180, 130, 30);
      doc.text("Ceci n'est pas une décision de crédit — le DSCR est un indicateur d'analyse indicatif.", 14, curY);
    }
  }

  // ---------- Page : Documents disponibles (Data Room) ----------
  if (documents.length > 0) {
    doc.addPage();
    sectionTitle(doc, "Documents disponibles (Data Room)");
    const CAT_LABELS = { legal: "Juridique", fiscal: "Fiscal", etats_financiers: "États financiers", releves_bancaires: "Relevés bancaires", factures: "Factures", contrats: "Contrats", garanties: "Garanties", autre: "Autre" };
    autoTable(doc, {
      startY: 30,
      head: [["Document", "Catégorie", "Ajouté le"]],
      body: documents.map((d) => [d.name, CAT_LABELS[d.category] || d.category, new Date(d.created_at).toLocaleDateString("fr-FR")]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Ces documents sont conservés dans votre Data Room RIDIX et peuvent être transmis séparément à l'institution financière.", 14, doc.lastAutoTable.finalY + 10);
  }

  // ---------- Page 2 : Compte de résultat (Bloc 3) ----------
  doc.addPage();
  sectionTitle(doc, "Compte de résultat (12 derniers mois)");

  const ca = compteResultat.ca;

  autoTable(doc, {
    startY: 30,
    body: [
      ["Chiffre d'affaires", formatMontant(compteResultat.ca, devise)],
      ["Coût des marchandises vendues (COGS)", formatMontant(-compteResultat.cogs, devise)],
      ["Marge brute", `${formatMontant(compteResultat.margeBrute, devise)}  (${compteResultat.margeBrutePct.toFixed(1)} %)`],
      ["  — dont salaires", formatMontant(-compteResultat.charges.salaires, devise)],
      ["  — dont loyer", formatMontant(-compteResultat.charges.loyer, devise)],
      ["  — dont autres charges d'exploitation", formatMontant(-compteResultat.charges.autres, devise)],
      ["EBITDA (avant charges financières & impôts)", formatMontant(compteResultat.ebitda, devise)],
      ["Résultat d'exploitation", formatMontant(compteResultat.resultatExploitation, devise)],
      ["Charges financières", formatMontant(-compteResultat.chargesFinancieres, devise)],
      ["Impôts & taxes", formatMontant(-compteResultat.impots, devise)],
      ["Résultat net", `${formatMontant(compteResultat.resultatNet, devise)}  (${compteResultat.margeNettePct.toFixed(1)} %)`],
    ],
    theme: "plain",
    styles: { fontSize: 9.5, cellPadding: 1.8 },
    columnStyles: { 0: { textColor: [71, 85, 105] }, 1: { fontStyle: "bold", halign: "right" } },
    didParseCell: (data) => {
      if ([2, 6, 10].includes(data.row.index)) { data.cell.styles.fontStyle = "bold"; data.cell.styles.fillColor = [241, 245, 249]; }
    },
  });
  curY = doc.lastAutoTable.finalY + 5;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("EBITDA = Résultat d'exploitation ici, faute d'amortissements suivis dans RIDIX.", 14, curY);
  curY += 10;

  // ---------- Cash-flow historique (Bloc 4) ----------
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("Cash-flow historique (12 derniers mois)", 14, curY);
  autoTable(doc, {
    startY: curY + 4,
    head: [["Mois", "Entrées", "Sorties", "Net", "Cumul"]],
    body: cashFlowHisto.map((m) => [m.label, formatMontant(m.entrees, devise), formatMontant(m.sorties, devise), formatMontant(m.net, devise), formatMontant(m.cumul, devise)]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  });
  curY = doc.lastAutoTable.finalY + 5;
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Entrées = ventes + autres revenus + financements reçus. Sorties = achats, salaires, loyers, impôts, autres charges, remboursements de crédit.", 14, curY);
  curY += 10;

  // ---------- Cash-flow prévisionnel (Bloc 4) ----------
  if (cashFlowPrevisionnel) {
    if (curY > 220) { doc.addPage(); curY = 20; }
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Cash-flow prévisionnel (6 prochains mois, 3 scénarios)", 14, curY);
    autoTable(doc, {
      startY: curY + 4,
      head: [["Mois projeté", "Prudent", "Normal", "Optimiste"]],
      body: cashFlowPrevisionnel.map((r) => [r.mois, formatMontant(r.prudent, devise), formatMontant(r.normal, devise), formatMontant(r.optimiste, devise)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
    curY = doc.lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Flux net mensuel moyen (3 derniers mois) × 0,75 / 1 / 1,2, diminué des mensualités de dettes déjà connues.", 14, curY);
  }

  // ---------- Page 3 : Stock, créances et dettes ----------
  doc.addPage();
  sectionTitle(doc, "Stock, créances & dettes");

  const valeurStock = products.reduce((s, p) => s + Number(p.quantity) * Number(p.cost_price || p.unit_price || 0), 0);
  const creancesOuvertes = credits.filter((c) => c.type === "client" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
  const dettesOuvertes = credits.filter((c) => c.type === "fournisseur" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);

  autoTable(doc, {
    startY: 30,
    body: [
      ["Valeur du stock actuel (au prix de revient)", formatMontant(valeurStock, devise)],
      ["Créances clients en cours", formatMontant(creancesOuvertes, devise)],
      ["Dettes fournisseurs en cours", formatMontant(dettesOuvertes, devise)],
      ["Actif net estimé (stock + créances - dettes)", formatMontant(valeurStock + creancesOuvertes - dettesOuvertes, devise)],
    ],
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: { 0: { textColor: [71, 85, 105] }, 1: { fontStyle: "bold", halign: "right" } },
  });

  // Marge réelle par produit (basée sur le prix de revient renseigné)
  const produitsAvecMarge = products.filter((p) => Number(p.cost_price) > 0 && Number(p.unit_price) > 0);
  if (produitsAvecMarge.length > 0) {
    curY = doc.lastAutoTable.finalY + 12;
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Marge réelle par produit", 14, curY);
    autoTable(doc, {
      startY: curY + 4,
      head: [["Produit", "Prix revient", "Prix vente", "Marge"]],
      body: produitsAvecMarge.map((p) => {
        const m = Number(p.unit_price) > 0 ? ((Number(p.unit_price) - Number(p.cost_price)) / Number(p.unit_price)) * 100 : 0;
        return [p.name, formatMontant(p.cost_price, p.devise), formatMontant(p.unit_price, p.devise), `${m.toFixed(0)} %`];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
  }

  // ---------- Bilan & Endettement global (Bloc 6) ----------
  {
    doc.addPage();
    sectionTitle(doc, "Bilan & endettement global");

    autoTable(doc, {
      startY: 30,
      body: [
        ["Trésorerie nette (cumul recettes - dépenses)", formatMontant(tresorerieBase, devise)],
        ["Stock (prix de revient)", formatMontant(valeurStockBase, devise)],
        ["Créances clients", formatMontant(creancesBase, devise)],
        ["Immobilisations (équipement, véhicules, immobilier)", formatMontant(immobilisationsBase, devise)],
        ["Total actifs", formatMontant(totalActifsBase, devise)],
        ["Capitaux propres (résiduels)", formatMontant(capitauxPropresBase, devise)],
        ["Dettes fournisseurs", formatMontant(dettesFournisseursBase, devise)],
        ["Dettes financières", formatMontant(dettesFinancieresBase, devise)],
        ["Total passifs", formatMontant(capitauxPropresBase + dettesFournisseursBase + dettesFinancieresBase, devise)],
      ],
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { textColor: [71, 85, 105] }, 1: { fontStyle: "bold", halign: "right" } },
      didParseCell: (data) => {
        if ([4, 8].includes(data.row.index)) { data.cell.styles.fontStyle = "bold"; data.cell.styles.fillColor = [241, 245, 249]; }
      },
    });
    curY = doc.lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Les capitaux propres sont ici un résidu comptable (actif − dettes), faute d'un suivi séparé des apports associés.", 14, curY);
    curY += 10;

    if (assets.length > 0) {
      if (curY > 240) { doc.addPage(); curY = 20; }
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text("Détail des immobilisations", 14, curY);
      autoTable(doc, {
        startY: curY + 4,
        head: [["Libellé", "Catégorie", "Valeur"]],
        body: assets.map((a) => [a.name, a.category, formatMontant(a.valeur, a.devise)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
      });
      curY = doc.lastAutoTable.finalY + 12;
    }

    if (endettement.creanciers.length > 0) {
      if (curY > 230) { doc.addPage(); curY = 20; }
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text("Détail des créanciers (dettes financières actives)", 14, curY);
      autoTable(doc, {
        startY: curY + 4,
        head: [["Créancier", "Type", "Montant initial", "Solde", "Mensualité", "Échéance", "Terme"]],
        body: endettement.creanciers.map((c) => [
          c.nom, liabilityCategoryLabel(c.category), formatMontant(c.montantInitial, c.devise), formatMontant(c.solde, c.devise),
          c.mensualite ? formatMontant(c.mensualite, c.devise) : "—", c.echeance || "—", c.terme === "court" ? "Court terme" : "Long terme",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] },
      });
      curY = doc.lastAutoTable.finalY + 12;
    }

    if (curY > 230) { doc.addPage(); curY = 20; }
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Ratios d'endettement", 14, curY);
    autoTable(doc, {
      startY: curY + 4,
      body: [
        ["Debt-to-Equity", endettement.debtToEquity != null ? `${endettement.debtToEquity.toFixed(2)}x` : "—"],
        ["Debt-to-Revenue", endettement.debtToRevenue != null ? `${(endettement.debtToRevenue * 100).toFixed(0)} %` : "—"],
        ["Debt Service Ratio", endettement.debtServiceRatio != null ? `${(endettement.debtServiceRatio * 100).toFixed(0)} %` : "—"],
        ["Endettement court terme", formatMontant(endettement.courtTerme, devise)],
        ["Endettement long terme", formatMontant(endettement.longTerme, devise)],
      ],
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 1.8 },
      columnStyles: { 0: { textColor: [71, 85, 105] }, 1: { fontStyle: "bold", halign: "right" } },
    });
  }

  if (analysis.topProfitables.length > 0) {
    curY = doc.lastAutoTable.finalY + 12;
    if (curY > 250) { doc.addPage(); curY = 20; }
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Activités les plus rentables", 14, curY);
    autoTable(doc, {
      startY: curY + 4,
      head: [["Profil", "Profit"]],
      body: analysis.topProfitables.map((t) => [t.label, formatMontant(t.profit, devise)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`${company.name} — Dossier de financement — page ${i}/${pageCount}`, 14, 292);
  }

  doc.save(`dossier_financement_${company.name.replace(/\s+/g, "_")}.pdf`);
}

function sectionTitle(doc, title) {
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(15);
  doc.setFont(undefined, "bold");
  doc.text(title, 14, 18);
  doc.setFont(undefined, "normal");
}
