import { computeCompteResultat, computeCashFlowHistorique, computeCashFlowPrevisionnel, computeEndettementGlobal } from "./analyseFinanciereUtils";
import { computeDSCR } from "./financingUtils";
import { computeTreasury, computeMonthlyTreasury, treasuryByType } from "./treasuryUtils";
import { liabilityCategoryLabel, cashAccountTypeLabel } from "./constants";
import { SOURCE_LABELS, categoryLabel } from "./financeLabels";

// ======================================================================================
//  Rapports téléchargeables RIDIX
//  1. exportPdf      — Rapport financier de la période (PDF)
//  2. exportExcel    — Classeur Excel multi-feuilles (Synthèse, Trésorerie, Écritures, Par catégorie)
//  3. exportDossierFinancement — Dossier de financement (PDF, Premium) avec sommaire
//  La trésorerie vient toujours de treasuryUtils.js : mêmes chiffres que « Où est votre argent ».
// ======================================================================================

const num = (v) => Number(v) || 0;
const slug = (s) => String(s || "entreprise").replace(/\s+/g, "_");
const frDate = (d = new Date()) => new Date(d).toLocaleDateString("fr-FR");

// jsPDF utilise par défaut une police (Helvetica) qui ne sait pas afficher l'espace fine
// insécable utilisée par Intl.NumberFormat("fr-FR") comme séparateur de milliers — elle se
// transforme visuellement en "/". On utilise donc un espace normal, uniquement pour le PDF.
function formatMontant(v, devise) {
  const rounded = Math.round(v || 0);
  const withSpaces = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (rounded < 0 ? "-" : "") + withSpaces + (devise ? " " + devise : "");
}
const signed = (v, devise) => (v > 0 ? "+" : "") + formatMontant(v, devise);

const C = {
  text: [20, 20, 20],
  muted: [71, 85, 105],
  faint: [148, 163, 184],
  head: [30, 41, 59],
  band: [241, 245, 249],
  warn: [180, 130, 30],
  dark: [15, 23, 42],
  light: [203, 213, 225],
};

// Les librairies d'export (xlsx, jsPDF) sont assez lourdes : on ne les charge
// qu'au moment où l'utilisateur clique réellement sur un bouton d'export,
// plutôt que de les inclure dans le chargement initial de l'application.
async function loadPdf() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  return { jsPDF, autoTable };
}

// ---------- Outils de mise en page PDF (curseur vertical + sauts de page automatiques) ----------
function makeFlow(doc, autoTable) {
  const width = doc.internal.pageSize.getWidth();
  const flow = {
    y: 20,
    width,
    sections: [],
    ensure(h) {
      if (flow.y + h > 278) { doc.addPage(); flow.y = 20; }
    },
    // Titre de section numéroté ; nouvelle page si moins de 70 mm restent.
    section(title, { forceNewPage = false } = {}) {
      if (forceNewPage || flow.y > 208) { doc.addPage(); flow.y = 20; }
      else flow.y += 4;
      const n = flow.sections.length + 1;
      flow.sections.push({ n, title, page: doc.internal.getNumberOfPages() });
      doc.setFont(undefined, "bold");
      doc.setFontSize(15);
      doc.setTextColor(...C.text);
      doc.text(`${n}. ${title}`, 14, flow.y + 4);
      doc.setDrawColor(...C.band);
      doc.setLineWidth(0.6);
      doc.line(14, flow.y + 7, width - 14, flow.y + 7);
      doc.setFont(undefined, "normal");
      flow.y += 15;
    },
    h2(text) {
      flow.ensure(24);
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.setTextColor(...C.text);
      doc.text(text, 14, flow.y);
      doc.setFont(undefined, "normal");
      flow.y += 3;
    },
    table(opts) {
      flow.ensure(24);
      autoTable(doc, {
        startY: flow.y, margin: { left: 14, right: 14 }, styles: { fontSize: 9 }, headStyles: { fillColor: C.head }, ...opts,
        // L'en-tête d'une colonne de montants est aligné comme ses valeurs (à droite).
        didParseCell: (d) => {
          if (d.section === "head") {
            const cs = opts.columnStyles?.[d.column.index];
            if (cs?.halign) d.cell.styles.halign = cs.halign;
          }
          if (opts.didParseCell) opts.didParseCell(d);
        },
      });
      flow.y = doc.lastAutoTable.finalY + 8;
    },
    // Tableau « libellé / valeur » ; lignes en gras (et grisées) via bold: [indices]
    kv(rows, { bold = [], fontSize = 10 } = {}) {
      flow.table({
        body: rows,
        theme: "plain",
        styles: { fontSize, cellPadding: 1.8 },
        columnStyles: { 0: { textColor: C.muted }, 1: { fontStyle: "bold", halign: "right" } },
        didParseCell: (d) => {
          if (bold.includes(d.row.index)) { d.cell.styles.fontStyle = "bold"; d.cell.styles.fillColor = C.band; }
        },
      });
    },
    note(text, { color = C.faint } = {}) {
      const lines = doc.splitTextToSize(text, width - 28);
      flow.ensure(lines.length * 4 + 4);
      doc.setFont(undefined, "normal");
      doc.setFontSize(8);
      doc.setTextColor(...color);
      doc.text(lines, 14, flow.y);
      flow.y += lines.length * 4 + 4;
    },
    para(text) {
      const lines = doc.splitTextToSize(text, width - 28);
      flow.ensure(lines.length * 4.5 + 3);
      doc.setFont(undefined, "normal");
      doc.setFontSize(9);
      doc.setTextColor(...C.muted);
      doc.text(lines, 14, flow.y);
      flow.y += lines.length * 4.5 + 3;
    },
  };
  return flow;
}

// Tableau « Où est votre argent » : identique à l'application (comptes, non affecté, total).
function treasuryTable(flow, treasury, devise) {
  const body = treasury.accounts.map((a) => [a.name, cashAccountTypeLabel(a.type), formatMontant(a.soldeInitial, ""), formatMontant(a.entrees, ""), formatMontant(-a.sorties, ""), formatMontant(a.solde, devise)]);
  if (treasury.nonAffecte.mouvements > 0) {
    const n = treasury.nonAffecte;
    body.push(["Non affecté à un compte", "—", "—", formatMontant(n.entrees, ""), formatMontant(-n.sorties, ""), formatMontant(n.solde, devise)]);
  }
  body.push(["TRÉSORERIE TOTALE", "", formatMontant(treasury.soldeInitialTotal, ""), formatMontant(treasury.totalEntrees, ""), formatMontant(-treasury.totalSorties, ""), formatMontant(treasury.total, devise)]);
  const last = body.length - 1;
  flow.table({
    head: [["Compte", "Type", "Ouverture", "Entrées", "Sorties", "Solde actuel"]],
    body,
    styles: { fontSize: 8.5 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right", fontStyle: "bold" } },
    didParseCell: (d) => {
      if (d.section === "body" && d.row.index === last) { d.cell.styles.fontStyle = "bold"; d.cell.styles.fillColor = C.band; }
    },
  });
}

function pageFooters(doc, label, fromPage = 1) {
  const count = doc.internal.getNumberOfPages();
  for (let i = fromPage; i <= count; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...C.faint);
    doc.text(`${label} — page ${i}/${count}`, 14, 292);
  }
}

// ---------- Regroupements communs (rapport PDF + classeur Excel) ----------
function summarize(transactions) {
  const ca = transactions.filter((t) => t.sens === "recette").reduce((s, t) => s + num(t.montant_base), 0);
  const dep = transactions.filter((t) => t.sens === "depense").reduce((s, t) => s + num(t.montant_base), 0);
  const profit = ca - dep;
  return { ca, dep, profit, marge: ca > 0 ? (profit / ca) * 100 : 0 };
}

function byCategory(transactions, sens) {
  const map = {};
  transactions.filter((t) => t.sens === sens).forEach((t) => {
    const k = t.categorie || "Sans catégorie";
    map[k] = (map[k] || 0) + num(t.montant_base);
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([categorie, montant]) => ({ categorie, montant, part: total > 0 ? (montant / total) * 100 : 0 }));
}

function contextOf(transactions, opts = {}) {
  const { cashAccounts = [], allTransactions = transactions, periodLabel = "Toutes les écritures", typeLabel = null } = opts;
  const treasury = computeTreasury(allTransactions, cashAccounts);
  const accountName = Object.fromEntries(cashAccounts.map((a) => [a.id, a.name]));
  return { cashAccounts, allTransactions, periodLabel, typeLabel, treasury, accountName };
}

// ======================================================================================
//  1. RAPPORT FINANCIER (PDF) — période filtrée dans l'application
// ======================================================================================
export async function exportPdf(transactions, company, kpis, opts = {}) {
  const { jsPDF, autoTable } = await loadPdf();
  const ctx = contextOf(transactions, opts);
  const devise = company.devise_base;
  const doc = new jsPDF();
  const flow = makeFlow(doc, autoTable);
  const s = summarize(transactions);

  // En-tête
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, flow.width, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("RAPPORT FINANCIER", 14, 14);
  doc.setFontSize(19);
  doc.text(company.name, 14, 26);
  doc.setFontSize(9);
  doc.setTextColor(...C.light);
  doc.text(`Période : ${ctx.periodLabel}${ctx.typeLabel ? `  ·  Profil : ${ctx.typeLabel}` : ""}  ·  Devise : ${devise}  ·  Généré le ${frDate()}`, 14, 35);
  flow.y = 52;

  // 1. Synthèse
  flow.section("Synthèse");
  flow.kv([
    ["Chiffre d'affaires (recettes de la période)", formatMontant(s.ca, devise)],
    ["Dépenses de la période", formatMontant(-s.dep, devise)],
    ["Résultat de la période", formatMontant(s.profit, devise)],
    ["Marge", `${s.marge.toFixed(1)} %`],
    ["Trésorerie totale à ce jour (tous comptes)", formatMontant(ctx.treasury.total, devise)],
  ], { bold: [2, 4] });
  flow.note("Les 4 premières lignes concernent la période sélectionnée ; la trésorerie totale est un solde à ce jour, indépendant de la période.");

  // 2. Où est votre argent
  flow.section("Où est votre argent");
  if (ctx.treasury.accounts.length === 0) {
    flow.para("Aucun compte de trésorerie n'est enregistré. Ajoutez votre banque, votre mobile money ou votre caisse dans RIDIX pour suivre où se trouve votre argent.");
    flow.kv([["Trésorerie totale (soldes d'ouverture + recettes - dépenses)", formatMontant(ctx.treasury.total, devise)]], { bold: [0] });
  } else {
    treasuryTable(flow, ctx.treasury, devise);
    const types = treasuryByType(ctx.treasury);
    if (types.length > 1) {
      flow.h2("Répartition par type de compte");
      flow.table({
        head: [["Type", "Solde", "Part"]],
        body: types.map((t) => [t.label, formatMontant(t.solde, devise), t.part != null ? `${t.part.toFixed(0)} %` : "—"]),
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
      });
    }
    flow.note("Solde actuel = solde d'ouverture + entrées - sorties, sur toutes les écritures. Ces montants sont identiques à ceux du bloc « Où est votre argent » de l'application.");
  }

  // 3. Répartition par catégorie
  const recettes = byCategory(transactions, "recette");
  const depenses = byCategory(transactions, "depense");
  if (recettes.length > 0 || depenses.length > 0) {
    flow.section("Répartition par catégorie");
    if (recettes.length > 0) {
      flow.h2("Recettes");
      flow.table({ head: [["Catégorie", "Montant", "Part"]], body: recettes.map((r) => [r.categorie, formatMontant(r.montant, devise), `${r.part.toFixed(0)} %`]), columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } } });
    }
    if (depenses.length > 0) {
      flow.h2("Dépenses");
      flow.table({ head: [["Catégorie", "Montant", "Part"]], body: depenses.map((r) => [r.categorie, formatMontant(r.montant, devise), `${r.part.toFixed(0)} %`]), columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } } });
    }
  }

  // 4. Détail des écritures
  flow.section("Détail des écritures", { forceNewPage: true });
  if (transactions.length === 0) {
    flow.para("Aucune écriture sur cette période.");
  } else {
    const nameOf = (t) => (t.account_id && ctx.accountName[t.account_id]) || "Non affecté";
    flow.table({
      head: [["Date", "Compte", "Profil", "Catégorie", "Libellé", "Montant", `Contre-val. (${devise})`]],
      body: [
        ...transactions.map((t) => [t.date, nameOf(t), t.type_op, t.categorie, t.libelle || "—", `${t.sens === "recette" ? "+" : "-"}${t.montant} ${t.devise}`, signed(t.sens === "recette" ? num(t.montant_base) : -num(t.montant_base), "")]),
        ["", "", "", "", "Total recettes", "", formatMontant(s.ca, "")],
        ["", "", "", "", "Total dépenses", "", formatMontant(-s.dep, "")],
        ["", "", "", "", "Résultat de la période", "", signed(s.profit, "")],
      ],
      styles: { fontSize: 7.5 },
      columnStyles: { 5: { halign: "right" }, 6: { halign: "right" } },
      didParseCell: (d) => {
        if (d.section === "body" && d.row.index >= transactions.length) { d.cell.styles.fontStyle = "bold"; d.cell.styles.fillColor = C.band; }
      },
    });
  }

  pageFooters(doc, `${company.name} — Rapport financier`);
  doc.save(`rapport_${slug(company.name)}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ======================================================================================
//  2. CLASSEUR EXCEL — Synthèse · Trésorerie · Écritures · Par catégorie
// ======================================================================================
export async function exportExcel(transactions, company, opts = {}) {
  const XLSX = await import("xlsx");
  const ctx = contextOf(transactions, opts);
  const devise = company.devise_base;
  const s = summarize(transactions);
  const t = ctx.treasury;
  const wb = XLSX.utils.book_new();

  const addSheet = (name, aoa, cols) => {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = cols.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  // Feuille 1 — Synthèse
  addSheet("Synthèse", [
    [company.name],
    ["Rapport financier"],
    ["Période", ctx.periodLabel + (ctx.typeLabel ? ` — profil ${ctx.typeLabel}` : "")],
    ["Devise de référence", devise],
    ["Généré le", frDate()],
    [],
    ["INDICATEURS DE LA PÉRIODE"],
    ["Recettes", Math.round(s.ca)],
    ["Dépenses", Math.round(s.dep)],
    ["Résultat", Math.round(s.profit)],
    ["Marge (%)", Number(s.marge.toFixed(1))],
    [],
    ["TRÉSORERIE À CE JOUR (identique à « Où est votre argent »)"],
    ["Trésorerie totale", Math.round(t.total)],
    ["Soldes d'ouverture des comptes", Math.round(t.soldeInitialTotal)],
    ["Nombre de comptes", t.accounts.length],
    [],
    ["CONTENU DU CLASSEUR"],
    ["Trésorerie", "Solde de chaque compte, écritures non affectées et total"],
    ["Écritures", "Détail des écritures de la période, avec le compte concerné"],
    ["Par catégorie", "Recettes et dépenses regroupées par catégorie"],
  ], [34, 52]);

  // Feuille 2 — Trésorerie
  const treso = [["Compte", "Type", "Solde d'ouverture", "Entrées", "Sorties", "Solde actuel"]];
  t.accounts.forEach((a) => treso.push([a.name, cashAccountTypeLabel(a.type), Math.round(a.soldeInitial), Math.round(a.entrees), -Math.round(a.sorties), Math.round(a.solde)]));
  if (t.nonAffecte.mouvements > 0) treso.push(["Non affecté à un compte", "—", 0, Math.round(t.nonAffecte.entrees), -Math.round(t.nonAffecte.sorties), Math.round(t.nonAffecte.solde)]);
  treso.push(["TRÉSORERIE TOTALE", "", Math.round(t.soldeInitialTotal), Math.round(t.totalEntrees), -Math.round(t.totalSorties), Math.round(t.total)]);
  treso.push([]);
  treso.push([`Montants en ${devise}. Solde actuel = solde d'ouverture + entrées - sorties (toutes écritures, pas seulement la période).`]);
  addSheet("Trésorerie", treso, [28, 20, 18, 16, 16, 18]);

  // Feuille 3 — Écritures
  const ecritures = [["Date", "Compte", "Sens", "Profil", "Catégorie", "Libellé", "Montant", "Devise", "Taux", `Contre-valeur (${devise})`]];
  transactions.forEach((x) => ecritures.push([
    x.date,
    (x.account_id && ctx.accountName[x.account_id]) || "Non affecté",
    x.sens === "recette" ? "Recette" : "Dépense",
    x.type_op, x.categorie, x.libelle || "",
    num(x.montant), x.devise, num(x.taux), num(x.montant_base),
  ]));
  addSheet("Écritures", ecritures, [12, 22, 10, 10, 22, 30, 14, 8, 8, 20]);

  // Feuille 4 — Par catégorie
  const cat = [["Sens", "Catégorie", `Montant (${devise})`, "Part (%)"]];
  byCategory(transactions, "recette").forEach((r) => cat.push(["Recette", r.categorie, Math.round(r.montant), Number(r.part.toFixed(1))]));
  byCategory(transactions, "depense").forEach((r) => cat.push(["Dépense", r.categorie, Math.round(r.montant), Number(r.part.toFixed(1))]));
  addSheet("Par catégorie", cat, [10, 28, 18, 10]);

  XLSX.writeFile(wb, `classeur_${slug(company.name)}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ======================================================================================
//  3. DOSSIER DE FINANCEMENT (PDF, Premium)
//  Document destiné à une banque ou un investisseur. Structure :
//   Couverture (chiffres clés + fiabilité) → Sommaire → 1 Besoin de financement
//   → 2 Trésorerie (où est l'argent) → 3 Compte de résultat → 4 Flux de trésorerie
//   → 5 Bilan & patrimoine → 6 Endettement & capacité → 7 Préparation → 8 Documents
// ======================================================================================
export async function exportDossierFinancement(transactions, products, credits, company, analysis, assets = [], liabilities = [], financingRequest = null, readiness = null, documents = [], requestItems = [], liabilityPayments = [], capacity = null, cashAccounts = []) {
  const { jsPDF, autoTable } = await loadPdf();
  const doc = new jsPDF();
  const devise = company.devise_base;
  const flow = makeFlow(doc, autoTable);
  const today = new Date();

  // ---------- Calculs (mêmes que l'onglet Analyse, réutilisés tels quels) ----------
  const treasury = computeTreasury(transactions, cashAccounts);
  const monthlyTreasury = computeMonthlyTreasury(transactions, cashAccounts, 12);
  const compteResultat = computeCompteResultat(transactions, { months: 12 });
  const cashFlowHisto = computeCashFlowHistorique(transactions, liabilityPayments, liabilities, { months: 12 });
  const cashFlowPrevisionnel = computeCashFlowPrevisionnel(transactions, liabilities, { monthsAhead: 6 });
  const avgMonthlyNet = capacity?.avgMonthlyNet ?? (cashFlowHisto.length >= 3 ? cashFlowHisto.slice(-3).reduce((s, m) => s + m.net, 0) / 3 : null);

  const valeurStock = products.reduce((s, p) => s + num(p.quantity) * num(p.cost_price || p.unit_price), 0);
  const creancesOuvertes = credits.filter((c) => c.type === "client" && c.statut === "ouvert").reduce((s, c) => s + (num(c.montant) - num(c.montant_paye)), 0);
  const dettesFournisseurs = credits.filter((c) => c.type === "fournisseur" && c.statut === "ouvert").reduce((s, c) => s + (num(c.montant) - num(c.montant_paye)), 0);
  const dettesFinancieres = liabilities.filter((l) => l.statut === "actif").reduce((s, l) => s + (num(l.montant) - num(l.montant_rembourse)), 0);
  const immobilisations = assets.reduce((s, a) => s + num(a.valeur), 0);
  const totalActifs = treasury.total + valeurStock + creancesOuvertes + immobilisations;
  const capitauxPropres = totalActifs - (dettesFournisseurs + dettesFinancieres);
  const endettement = computeEndettementGlobal({ credits, liabilities, ca: compteResultat.ca, avgMonthlyNet: avgMonthlyNet || 0, capitauxPropres });
  const dscr = (financingRequest && avgMonthlyNet)
    ? computeDSCR({ avgMonthlyNet, liabilities, montantSouhaite: financingRequest.montant_souhaite, dureeMois: financingRequest.duree_mois })
    : null;
  const utilisationItems = financingRequest ? requestItems.filter((i) => i.financing_request_id === financingRequest.id) : [];
  const margeEstimee = financingRequest?.ca_attendu != null ? num(financingRequest.ca_attendu) - num(financingRequest.montant_souhaite) : null;
  const roiPct = margeEstimee != null && num(financingRequest?.montant_souhaite) > 0 ? (margeEstimee / num(financingRequest.montant_souhaite)) * 100 : null;
  const anciennete = company.created_at ? Math.max(0, Math.round((today - new Date(company.created_at)) / (1000 * 60 * 60 * 24 * 30))) : null;

  // ---------- Couverture : identité + chiffres clés + fiabilité ----------
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, flow.width, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("RIDIX FINANCING PACK", 14, 20);
  doc.setFontSize(22);
  doc.text(company.name, 14, 34);
  doc.setFontSize(10);
  doc.setTextColor(...C.light);
  doc.text(`Profil d'activité : ${company.profil || "—"}  ·  Devise de référence : ${devise}`, 14, 44);
  doc.text(`Dossier généré le ${frDate(today)}`, 14, 51);

  let y = 74;
  doc.setTextColor(...C.text);
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.text("Chiffres clés", 14, y);
  doc.setFont(undefined, "normal");
  autoTable(doc, {
    startY: y + 3,
    body: [
      ["Trésorerie totale à ce jour", formatMontant(treasury.total, devise)],
      ["Chiffre d'affaires (12 derniers mois)", formatMontant(compteResultat.ca, devise)],
      ["Résultat net (12 derniers mois)", formatMontant(compteResultat.resultatNet, devise)],
      ["Score de santé financière", `${analysis.score} / 100`],
      ...(readiness ? [["Score de préparation au financement", `${readiness.score} / 100`]] : []),
    ],
    theme: "plain",
    styles: { fontSize: 10.5, cellPadding: 1.8 },
    columnStyles: { 0: { textColor: C.muted }, 1: { fontStyle: "bold", halign: "right" } },
  });

  y = doc.lastAutoTable.finalY + 12;
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.text("Indicateurs de fiabilité", 14, y);
  doc.setFont(undefined, "normal");
  autoTable(doc, {
    startY: y + 3,
    body: [
      ["Ancienneté du compte", anciennete !== null ? `${anciennete} mois de suivi` : "—"],
      ["Nombre d'écritures enregistrées", `${transactions.length}`],
      ["Comptes de trésorerie suivis", `${treasury.accounts.length}`],
      ["Produits suivis en stock", `${products.length}`],
      ["Dossiers de créances/dettes suivis", `${credits.length}`],
      ...(documents.length > 0 ? [["Documents disponibles (Data Room)", `${documents.length}`]] : []),
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: { 0: { textColor: C.muted }, 1: { fontStyle: "bold", halign: "right" } },
  });

  // Page 2 réservée au sommaire (remplie à la fin, quand les numéros de page sont connus)
  doc.addPage();
  flow.y = 999; // force une nouvelle page pour la section 1

  // ---------- 1. Besoin de financement ----------
  if (financingRequest) {
    const NEED_LABELS = { fonds_roulement: "Fonds de roulement", stock: "Achat de stock", equipement: "Équipement", immobilier: "Immobilier", tresorerie: "Trésorerie ponctuelle", autre: "Autre" };
    flow.section("Besoin de financement");
    flow.h2("Besoin exprimé");
    flow.kv([
      ["Type de besoin", NEED_LABELS[financingRequest.type_besoin] || financingRequest.type_besoin],
      ["Montant souhaité", formatMontant(financingRequest.montant_souhaite, financingRequest.devise)],
      ["Description", financingRequest.description || "—"],
      ["Exprimé le", frDate(financingRequest.created_at)],
    ]);
    if (utilisationItems.length > 0) {
      flow.h2("Utilisation du financement");
      flow.table({
        head: [["Poste", "Montant"]],
        body: [
          ...utilisationItems.map((i) => [i.libelle, formatMontant(i.montant, financingRequest.devise)]),
          ["Total ventilé", formatMontant(utilisationItems.reduce((s, i) => s + num(i.montant), 0), financingRequest.devise)],
        ],
        columnStyles: { 1: { halign: "right" } },
        didParseCell: (d) => { if (d.section === "body" && d.row.index === utilisationItems.length) { d.cell.styles.fontStyle = "bold"; d.cell.styles.fillColor = C.band; } },
      });
    }
    if (financingRequest.ca_attendu != null || financingRequest.delai_rotation_jours != null) {
      flow.h2("ROI attendu du projet");
      const roiRows = [];
      if (financingRequest.ca_attendu != null) roiRows.push(["CA attendu grâce au financement", formatMontant(financingRequest.ca_attendu, financingRequest.devise)]);
      if (margeEstimee != null) roiRows.push(["Marge estimée", formatMontant(margeEstimee, financingRequest.devise)]);
      if (roiPct != null) roiRows.push(["ROI attendu", `${roiPct.toFixed(0)} %`]);
      if (financingRequest.delai_rotation_jours != null) roiRows.push(["Délai de rotation estimé", `${financingRequest.delai_rotation_jours} jours`]);
      flow.kv(roiRows);
    }
  }

  // ---------- 2. Trésorerie — où est l'argent ----------
  flow.section("Trésorerie — où est l'argent");
  flow.kv([
    ["Trésorerie totale à ce jour", formatMontant(treasury.total, devise)],
    ["Dont soldes d'ouverture des comptes", formatMontant(treasury.soldeInitialTotal, devise)],
    ["Entrées cumulées (recettes)", formatMontant(treasury.totalEntrees, devise)],
    ["Sorties cumulées (dépenses)", formatMontant(-treasury.totalSorties, devise)],
  ], { bold: [0] });

  if (treasury.accounts.length > 0) {
    flow.h2("Répartition par compte");
    treasuryTable(flow, treasury, devise);
    const types = treasuryByType(treasury);
    if (types.length > 1) {
      flow.h2("Répartition par type de compte");
      flow.table({
        head: [["Type", "Solde", "Part"]],
        body: types.map((t) => [t.label, formatMontant(t.solde, devise), t.part != null ? `${t.part.toFixed(0)} %` : "—"]),
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
      });
    }
  } else {
    flow.para("Aucun compte de trésorerie détaillé n'est enregistré : la trésorerie correspond au cumul des recettes moins les dépenses.");
  }

  flow.h2("Évolution mensuelle de la trésorerie (12 derniers mois)");
  flow.table({
    head: [["Mois", "Entrées", "Sorties", "Net", "Trésorerie fin de mois"]],
    body: monthlyTreasury.rows.map((m) => [m.label, formatMontant(m.entrees, ""), formatMontant(-m.sorties, ""), signed(m.net, ""), formatMontant(m.soldeFin, devise)]),
    styles: { fontSize: 8.5 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } },
  });
  flow.note(`Solde de départ de la période : ${formatMontant(monthlyTreasury.soldeOuverture, devise)} (soldes d'ouverture + écritures antérieures). La trésorerie de fin de mois du mois courant est identique au solde total du bloc « Où est votre argent ».${monthlyTreasury.futureNet !== 0 ? ` Écritures datées dans le futur non incluses dans le tableau : ${signed(monthlyTreasury.futureNet, devise)}.` : ""}`);

  // ---------- 3. Compte de résultat ----------
  flow.section("Compte de résultat (12 derniers mois)");
  flow.kv([
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
  ], { bold: [2, 6, 10], fontSize: 9.5 });
  flow.note("EBITDA = Résultat d'exploitation ici, faute d'amortissements suivis dans RIDIX.");
  if (analysis.topProfitables.length > 0) {
    flow.h2("Activités les plus rentables");
    flow.table({ head: [["Profil", "Profit"]], body: analysis.topProfitables.map((t) => [t.label, formatMontant(t.profit, devise)]), columnStyles: { 1: { halign: "right" } } });
  }

  // ---------- 4. Flux de trésorerie ----------
  flow.section("Flux de trésorerie");
  flow.h2("Cash-flow historique (12 derniers mois)");
  flow.table({
    head: [["Mois", "Entrées", "Sorties", "Net", "Cumul"]],
    body: cashFlowHisto.map((m) => [m.label, formatMontant(m.entrees, devise), formatMontant(m.sorties, devise), formatMontant(m.net, devise), formatMontant(m.cumul, devise)]),
    styles: { fontSize: 8 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
  });
  flow.note("Entrées = ventes + autres revenus + financements reçus. Sorties = achats, salaires, loyers, impôts, autres charges, remboursements de crédit. Analyse par nature de flux, distincte de l'évolution des soldes de la section Trésorerie.");

  if (cashFlowPrevisionnel) {
    flow.h2("Cash-flow prévisionnel (6 prochains mois, 3 scénarios)");
    flow.table({
      head: [["Mois projeté", "Prudent", "Normal", "Optimiste"]],
      body: cashFlowPrevisionnel.map((r) => [r.mois, formatMontant(r.prudent, devise), formatMontant(r.normal, devise), formatMontant(r.optimiste, devise)]),
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
    flow.note("Flux net mensuel moyen (3 derniers mois) × 0,75 / 1 / 1,2, diminué des mensualités de dettes déjà connues.");

    // Trésorerie projetée : part de la trésorerie réelle d'aujourd'hui (synchronisée avec « Où est votre argent »)
    const run = { prudent: treasury.total, normal: treasury.total, optimiste: treasury.total };
    flow.h2("Trésorerie projetée (à partir de la trésorerie actuelle)");
    flow.table({
      head: [["", "Prudent", "Normal", "Optimiste"]],
      body: [
        ["Aujourd'hui", formatMontant(treasury.total, devise), formatMontant(treasury.total, devise), formatMontant(treasury.total, devise)],
        ...cashFlowPrevisionnel.map((r) => {
          run.prudent += r.prudent; run.normal += r.normal; run.optimiste += r.optimiste;
          return [r.mois, formatMontant(run.prudent, devise), formatMontant(run.normal, devise), formatMontant(run.optimiste, devise)];
        }),
      ],
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
      didParseCell: (d) => { if (d.section === "body" && d.row.index === 0) { d.cell.styles.fontStyle = "bold"; d.cell.styles.fillColor = C.band; } },
    });
    flow.note("Projection indicative : trésorerie actuelle + flux prévisionnels cumulés de chaque scénario. Elle ne constitue pas une garantie.");
  }

  // ---------- 5. Bilan & patrimoine ----------
  flow.section("Bilan & patrimoine");
  flow.kv([
    ["Trésorerie (tous comptes, voir section Trésorerie)", formatMontant(treasury.total, devise)],
    ["Stock (prix de revient)", formatMontant(valeurStock, devise)],
    ["Créances clients", formatMontant(creancesOuvertes, devise)],
    ["Immobilisations (équipement, véhicules, immobilier)", formatMontant(immobilisations, devise)],
    ["Total actifs", formatMontant(totalActifs, devise)],
    ["Capitaux propres (résiduels)", formatMontant(capitauxPropres, devise)],
    ["Dettes fournisseurs", formatMontant(dettesFournisseurs, devise)],
    ["Dettes financières", formatMontant(dettesFinancieres, devise)],
    ["Total passifs", formatMontant(capitauxPropres + dettesFournisseurs + dettesFinancieres, devise)],
  ], { bold: [4, 8] });
  flow.note("Les capitaux propres sont ici un résidu comptable (actif - dettes), faute d'un suivi séparé des apports associés.");

  flow.h2("Stock, créances & dettes");
  flow.kv([
    ["Valeur du stock actuel (au prix de revient)", formatMontant(valeurStock, devise)],
    ["Créances clients en cours", formatMontant(creancesOuvertes, devise)],
    ["Dettes fournisseurs en cours", formatMontant(dettesFournisseurs, devise)],
    ["Actif net estimé (stock + créances - dettes)", formatMontant(valeurStock + creancesOuvertes - dettesFournisseurs, devise)],
  ], { bold: [3] });

  const produitsAvecMarge = products.filter((p) => num(p.cost_price) > 0 && num(p.unit_price) > 0);
  if (produitsAvecMarge.length > 0) {
    flow.h2("Marge réelle par produit");
    flow.table({
      head: [["Produit", "Prix revient", "Prix vente", "Marge"]],
      body: produitsAvecMarge.map((p) => [p.name, formatMontant(p.cost_price, p.devise), formatMontant(p.unit_price, p.devise), `${(((num(p.unit_price) - num(p.cost_price)) / num(p.unit_price)) * 100).toFixed(0)} %`]),
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
  }
  if (assets.length > 0) {
    flow.h2("Détail des immobilisations");
    flow.table({ head: [["Libellé", "Catégorie", "Valeur"]], body: assets.map((a) => [a.name, a.category, formatMontant(a.valeur, a.devise)]), columnStyles: { 2: { halign: "right" } } });
  }

  // ---------- 6. Endettement & capacité de remboursement ----------
  flow.section("Endettement & capacité de remboursement");
  flow.h2("Ratios d'endettement");
  flow.kv([
    ["Debt-to-Equity", endettement.debtToEquity != null ? `${endettement.debtToEquity.toFixed(2)}x` : "—"],
    ["Debt-to-Revenue", endettement.debtToRevenue != null ? `${(endettement.debtToRevenue * 100).toFixed(0)} %` : "—"],
    ["Debt Service Ratio", endettement.debtServiceRatio != null ? `${(endettement.debtServiceRatio * 100).toFixed(0)} %` : "—"],
    ["Endettement court terme", formatMontant(endettement.courtTerme, devise)],
    ["Endettement long terme", formatMontant(endettement.longTerme, devise)],
  ], { fontSize: 10 });

  if (endettement.creanciers.length > 0) {
    flow.h2("Détail des créanciers (dettes financières actives)");
    flow.table({
      head: [["Créancier", "Type", "Montant initial", "Solde", "Mensualité", "Échéance", "Terme"]],
      body: endettement.creanciers.map((c) => [
        c.nom, liabilityCategoryLabel(c.category), formatMontant(c.montantInitial, c.devise), formatMontant(c.solde, c.devise),
        c.mensualite ? formatMontant(c.mensualite, c.devise) : "—", c.echeance || "—", c.terme === "court" ? "Court terme" : "Long terme",
      ]),
      styles: { fontSize: 8 },
    });
  }

  if (dscr) {
    flow.h2(`Capacité de remboursement — DSCR indicatif : ${dscr.dscr.toFixed(2)}x`);
    flow.kv([
      ["Flux de trésorerie disponible", `${formatMontant(dscr.avgMonthlyNet, devise)} / mois`],
      ["Charges financières existantes", `${formatMontant(dscr.chargesFinancieresExistantes, devise)} / mois`],
      ["Capacité indicative de service de la dette", `${formatMontant(dscr.capaciteServiceDette, devise)} / mois`],
      ["Mensualité nouvelle estimée (linéaire)", `${formatMontant(dscr.mensualiteNouvelle, devise)} / mois`],
    ]);
    flow.para(dscr.appreciation);
    flow.note("Ceci n'est pas une décision de crédit — le DSCR est un indicateur d'analyse indicatif.", { color: C.warn });
  }

  // ---------- 7. Préparation au financement ----------
  if (readiness) {
    flow.section("Préparation au financement");
    flow.h2(`Score de préparation : ${readiness.score} / 100`);
    flow.table({ head: [["Critère", "Points"]], body: readiness.items.map((i) => [i.label, `${i.points} / ${i.max}`]), columnStyles: { 1: { halign: "right" } } });
    if (readiness.problems.length > 0) {
      flow.h2("Points à renforcer");
      readiness.problems.forEach((p) => flow.para(`• ${p.recommendation}`));
    }
    flow.note("Rappel : la capacité et le score affichés dans ce dossier sont indicatifs et ne constituent en aucun cas une décision de crédit.", { color: C.warn });
  }

  // ---------- 8. Documents (Data Room) ----------
  if (documents.length > 0) {
    const CAT_LABELS = { legal: "Juridique", fiscal: "Fiscal", etats_financiers: "États financiers", releves_bancaires: "Relevés bancaires", factures: "Factures", contrats: "Contrats", garanties: "Garanties", autre: "Autre" };
    flow.section("Documents disponibles (Data Room)");
    flow.table({ head: [["Document", "Catégorie", "Ajouté le"]], body: documents.map((d) => [d.name, CAT_LABELS[d.category] || d.category, frDate(d.created_at)]) });
    flow.note("Ces documents sont conservés dans votre Data Room RIDIX et peuvent être transmis séparément à l'institution financière.");
  }

  // ---------- Sommaire (page 2) ----------
  doc.setPage(2);
  doc.setTextColor(...C.text);
  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  doc.text("Sommaire", 14, 24);
  doc.setFont(undefined, "normal");
  doc.setFontSize(11);
  let ty = 40;
  flow.sections.forEach((s) => {
    doc.setTextColor(...C.text);
    doc.text(`${s.n}.  ${s.title}`, 14, ty);
    doc.setTextColor(...C.muted);
    doc.text(String(s.page), flow.width - 14, ty, { align: "right" });
    doc.setDrawColor(...C.band);
    doc.setLineWidth(0.3);
    doc.line(14, ty + 2.5, flow.width - 14, ty + 2.5);
    ty += 11;
  });
  doc.setFontSize(8.5);
  doc.setTextColor(...C.faint);
  const intro = doc.splitTextToSize("Ce dossier est généré automatiquement par RIDIX à partir des écritures, comptes de trésorerie, stocks, crédits et dettes enregistrés. Les montants de trésorerie sont identiques à ceux du bloc « Où est votre argent » de l'application. Les indicateurs sont fournis à titre d'analyse et ne constituent pas une décision de crédit.", flow.width - 28);
  doc.text(intro, 14, ty + 8);

  pageFooters(doc, `${company.name} — Dossier de financement`, 2);
  doc.save(`dossier_financement_${slug(company.name)}.pdf`);
}


// ======================================================================================
//  4. RAPPORT D'ACTIVITÉ RIDIX (administrateur) : finances, clients, offres, acquisition, journal
// ======================================================================================
const monthLabel = (ym) => {
  const [y, m] = String(ym).split("-").map(Number);
  return `${["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"][m - 1]} ${y}`;
};

function reportFigures(report) {
  const c = report.clients;
  const premium = num(c.premium);
  const owners = num(c.owners);
  const paying = num(c.premium_paying);
  const subRevenue = (report.by_offer || []).reduce((s, o) => s + num(o.revenue), 0);
  const subSales = (report.by_offer || []).reduce((s, o) => s + num(o.sales), 0);
  const refRevenue = num(report.agents.referred_revenue_period);
  return {
    premium, owners, paying,
    offered: Math.max(0, premium - paying),
    conversion: owners > 0 ? (premium / owners) * 100 : 0,
    margin: num(report.revenue) > 0 ? (num(report.net) / num(report.revenue)) * 100 : null,
    subRevenue, subSales,
    avgTicket: subSales > 0 ? subRevenue / subSales : 0,
    refRevenue,
    refShare: subRevenue > 0 ? (refRevenue / subRevenue) * 100 : null,
    directRevenue: Math.max(0, subRevenue - refRevenue),
  };
}

export async function exportAdminReportPdf(report, ledger = [], periodLabel = "Tout") {
  const { jsPDF, autoTable } = await loadPdf();
  const doc = new jsPDF();
  const flow = makeFlow(doc, autoTable);
  const D = "FCFA";
  const f = reportFigures(report);
  const c = report.clients;

  doc.setFillColor(...C.dark);
  doc.rect(0, 0, flow.width, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("RAPPORT D'ACTIVITÉ", 14, 14);
  doc.setFontSize(20);
  doc.text("RIDIX", 14, 26);
  doc.setFontSize(9);
  doc.setTextColor(...C.light);
  doc.text(`Période : ${periodLabel}  ·  Devise : ${D}  ·  Généré le ${frDate()}`, 14, 35);
  flow.y = 52;

  // 1. Synthèse financière
  flow.section("Synthèse financière");
  flow.kv([
    ["Chiffre d'affaires", formatMontant(report.revenue, D)],
    ["Dépenses", formatMontant(-num(report.expenses), D)],
    ["Résultat net", formatMontant(report.net, D)],
    ["Marge nette", f.margin != null ? `${f.margin.toFixed(1)} %` : "—"],
    ["Abonnements vendus", `${f.subSales}`],
    ["Panier moyen d'un abonnement", f.subSales > 0 ? formatMontant(f.avgTicket, D) : "—"],
  ], { bold: [2] });

  // 2. Clients
  flow.section("Clients");
  flow.kv([
    ["Comptes propriétaires", `${c.owners}`],
    ["Clients Premium", `${c.premium}  (${c.premium_paying} payants, ${f.offered} offerts)`],
    ["Clients Freemium", `${c.freemium}`],
    ["Taux de conversion (Freemium vers Premium)", `${f.conversion.toFixed(1)} %`],
    ["Nouveaux inscrits (période)", `${c.new_owners_period}`],
    ["Nouveaux clients payants (période)", `${c.new_payers_period}`],
    ["Clients payants depuis le début", `${c.paying_clients_total}`],
    ["Comptes actifs ces 30 derniers jours", `${c.active_30d}`],
    ["Premium arrivant à échéance sous 30 jours", `${c.premium_expiring_30d}`],
    ["Employés (comptes liés)", `${c.employees}`],
  ]);

  // 3. Offres
  flow.section("Offres & rentabilité");
  if ((report.by_offer || []).length === 0) {
    flow.para("Aucun abonnement vendu sur cette période.");
  } else {
    flow.table({
      head: [["Offre", "Ventes", "Ticket moyen", "Chiffre d'affaires", "Commissions", "Net"]],
      body: report.by_offer.map((o) => [o.label, `${o.sales}`, formatMontant(o.avg_ticket, ""), formatMontant(o.revenue, ""), formatMontant(o.commission_cost, ""), formatMontant(o.net, "")]),
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right", fontStyle: "bold" } },
    });
    const best = report.best_offer;
    if (best) flow.para(`Offre la plus rentable : ${best.label} — ${formatMontant(best.net, D)} net (${best.sales} vente(s)).`);
    flow.note("Net = chiffre d'affaires moins les commissions dues aux commerciaux sur les clients qu'ils ont parrainés.");
  }

  // 4. Revenus et dépenses
  flow.section("Revenus & dépenses");
  flow.h2("Chiffre d'affaires par source");
  if ((report.revenue_by_source || []).length === 0) flow.para("Aucun revenu sur cette période.");
  else flow.table({ head: [["Source", "Écritures", "Montant"]], body: report.revenue_by_source.map((r) => [SOURCE_LABELS[r.source] || r.source, `${r.entries}`, formatMontant(r.total, D)]), columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } } });
  flow.h2("Dépenses par catégorie");
  if ((report.expense_by_category || []).length === 0) flow.para("Aucune dépense sur cette période.");
  else {
    const totalExp = report.expense_by_category.reduce((s, r) => s + num(r.total), 0) || 1;
    flow.table({
      head: [["Catégorie", "Écritures", "Montant", "Part"]],
      body: report.expense_by_category.map((r) => [categoryLabel(r.category), `${r.entries}`, formatMontant(r.total, D), `${((num(r.total) / totalExp) * 100).toFixed(0)} %`]),
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
  }

  // 5. Évolution mensuelle
  flow.section("Évolution mensuelle (12 mois)");
  flow.table({
    head: [["Mois", "Revenus", "Dépenses", "Résultat"]],
    body: (report.monthly || []).map((m) => [monthLabel(m.month), formatMontant(m.revenue, ""), formatMontant(-num(m.expenses), ""), signed(num(m.revenue) - num(m.expenses), "")]),
    styles: { fontSize: 8.5 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" } },
  });

  // 6. Acquisition commerciale
  flow.section("Acquisition commerciale");
  flow.kv([
    ["Commerciaux actifs", `${report.agents.active} / ${report.agents.count}`],
    ["Inscriptions parrainées (période)", `${report.agents.referred_signups_period}`],
    ["Chiffre d'affaires via parrainage", formatMontant(f.refRevenue, D)],
    ["Part du CA abonnements", f.refShare != null ? `${f.refShare.toFixed(0)} %` : "—"],
    ["Chiffre d'affaires acquisition directe", formatMontant(f.directRevenue, D)],
    ["Commissions versées (période)", formatMontant(-num(report.agents.commissions_paid_period), D)],
  ]);

  // 7. Journal
  flow.section("Journal des opérations", { forceNewPage: true });
  if (ledger.length === 0) flow.para("Aucune opération sur cette période.");
  else {
    flow.table({
      head: [["Date", "Opération", "Détail", "Source", "Montant"]],
      body: ledger.map((e) => [
        frDate(e.occurred_on), categoryLabel(e.category) + (e.client ? ` · ${e.client}` : ""), e.description || "—",
        e.source === "maketou" ? "Auto" : e.source === "commission" ? "Parrainage" : "Manuel",
        `${e.kind === "revenue" ? "+" : "-"}${formatMontant(e.amount, "")}`,
      ]),
      styles: { fontSize: 7.5 },
      columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
      didParseCell: (d) => {
        if (d.section === "body" && d.column.index === 4) d.cell.styles.textColor = String(d.cell.raw).startsWith("+") ? [22, 101, 52] : [190, 18, 60];
      },
    });
  }

  pageFooters(doc, "RIDIX — Rapport d'activité");
  doc.save(`rapport_ridix_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportAdminReportExcel(report, ledger = [], periodLabel = "Tout") {
  const XLSX = await import("xlsx");
  const f = reportFigures(report);
  const c = report.clients;
  const wb = XLSX.utils.book_new();
  const add = (name, aoa, cols) => {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = cols.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  add("Synthèse", [
    ["RIDIX — Rapport d'activité"],
    ["Période", periodLabel],
    ["Généré le", frDate()],
    [],
    ["FINANCES (FCFA)"],
    ["Chiffre d'affaires", Math.round(num(report.revenue))],
    ["Dépenses", Math.round(num(report.expenses))],
    ["Résultat net", Math.round(num(report.net))],
    ["Marge nette (%)", f.margin != null ? Number(f.margin.toFixed(1)) : ""],
    ["Abonnements vendus", f.subSales],
    ["Panier moyen", Math.round(f.avgTicket)],
    ["Offre la plus rentable", report.best_offer ? report.best_offer.label : ""],
    [],
    ["CLIENTS"],
    ["Comptes propriétaires", num(c.owners)],
    ["Premium", num(c.premium)],
    ["  dont payants", num(c.premium_paying)],
    ["  dont offerts", f.offered],
    ["Freemium", num(c.freemium)],
    ["Taux de conversion (%)", Number(f.conversion.toFixed(1))],
    ["Nouveaux inscrits (période)", num(c.new_owners_period)],
    ["Nouveaux clients payants (période)", num(c.new_payers_period)],
    ["Actifs sur 30 jours", num(c.active_30d)],
    ["Premium expirant sous 30 jours", num(c.premium_expiring_30d)],
    [],
    ["ACQUISITION COMMERCIALE"],
    ["Commerciaux actifs", num(report.agents.active)],
    ["Inscriptions parrainées", num(report.agents.referred_signups_period)],
    ["CA via parrainage", Math.round(f.refRevenue)],
    ["CA acquisition directe", Math.round(f.directRevenue)],
    ["Commissions versées", Math.round(num(report.agents.commissions_paid_period))],
  ], [38, 30]);

  add("Offres", [["Offre", "Ventes", "Ticket moyen", "CA", "Commissions", "Net"],
    ...(report.by_offer || []).map((o) => [o.label, num(o.sales), num(o.avg_ticket), num(o.revenue), num(o.commission_cost), num(o.net)])], [28, 10, 14, 14, 14, 14]);

  add("Dépenses", [["Catégorie", "Écritures", "Montant (FCFA)"],
    ...(report.expense_by_category || []).map((r) => [categoryLabel(r.category), num(r.entries), num(r.total)])], [32, 10, 16]);

  add("Mensuel", [["Mois", "Revenus", "Dépenses", "Résultat"],
    ...(report.monthly || []).map((m) => [monthLabel(m.month), num(m.revenue), num(m.expenses), num(m.revenue) - num(m.expenses)])], [20, 14, 14, 14]);

  add("Journal", [["Date", "Type", "Catégorie", "Client", "Détail", "Source", "Montant (FCFA)"],
    ...ledger.map((e) => [e.occurred_on, e.kind === "revenue" ? "Revenu" : "Dépense", categoryLabel(e.category), e.client || "", e.description || "",
      e.source === "maketou" ? "Auto (Maketou)" : e.source === "commission" ? "Parrainage" : "Manuel", (e.kind === "revenue" ? 1 : -1) * num(e.amount)])],
    [12, 10, 28, 24, 40, 16, 16]);

  XLSX.writeFile(wb, `rapport_ridix_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
