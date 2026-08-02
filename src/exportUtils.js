import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMontant } from "./constants";

export function exportExcel(transactions, company) {
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

export function exportPdf(transactions, company, kpis) {
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
      Math.round(t.montant_base).toLocaleString("fr-FR"),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  doc.save(`rapport_${company.name.replace(/\s+/g, "_")}.pdf`);
}

// ---------- Pilier 3 : Dossier de financement (Premium) ----------
// Document professionnel destiné à être partagé avec une banque ou un investisseur :
// historique, indicateurs de fiabilité, score de santé, projection de trésorerie.
export function exportDossierFinancement(transactions, products, credits, company, analysis) {
  const doc = new jsPDF();
  const devise = company.devise_base;
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date();

  // ---------- Page de garde ----------
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("DOSSIER DE FINANCEMENT", 14, 20);
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
    [`Produits suivis en stock`, `${products.length}`],
    [`Dossiers de créances/dettes suivis`, `${credits.length}`],
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
  doc.text(`Document généré automatiquement le ${today.toLocaleDateString("fr-FR")} — Ridix Finance`, 14, 285);

  // ---------- Page 2 : Bilan d'activité ----------
  doc.addPage();
  sectionTitle(doc, "Bilan d'activité");

  const ca = transactions.filter((t) => t.sens === "recette").reduce((s, t) => s + Number(t.montant_base), 0);
  const dep = transactions.filter((t) => t.sens === "depense").reduce((s, t) => s + Number(t.montant_base), 0);
  const profit = ca - dep;
  const marge = ca > 0 ? (profit / ca) * 100 : 0;

  autoTable(doc, {
    startY: 30,
    body: [
      ["Chiffre d'affaires cumulé", formatMontant(ca, devise)],
      ["Dépenses cumulées", formatMontant(dep, devise)],
      ["Profit net cumulé", formatMontant(profit, devise)],
      ["Marge moyenne", `${marge.toFixed(1)} %`],
    ],
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: { 0: { textColor: [71, 85, 105] }, 1: { fontStyle: "bold", halign: "right" } },
  });

  // Évolution mensuelle
  const monthly = {};
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7);
    if (!monthly[key]) monthly[key] = { recette: 0, depense: 0 };
    monthly[key][t.sens === "recette" ? "recette" : "depense"] += Number(t.montant_base);
  });
  const months = Object.keys(monthly).sort().slice(-12);

  let curY = doc.lastAutoTable.finY + 12;
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("Évolution mensuelle (12 derniers mois avec activité)", 14, curY);

  autoTable(doc, {
    startY: curY + 4,
    head: [["Mois", "Recettes", "Dépenses", "Net"]],
    body: months.map((m) => {
      const { recette, depense } = monthly[m];
      return [m, formatMontant(recette, devise), formatMontant(depense, devise), formatMontant(recette - depense, devise)];
    }),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  if (analysis.forecast) {
    curY = doc.lastAutoTable.finY + 12;
    doc.setFont(undefined, "bold");
    doc.text("Projection de trésorerie", 14, curY);
    autoTable(doc, {
      startY: curY + 4,
      head: [["Mois projeté", "Net estimé"]],
      body: analysis.forecast.map((f) => [f.mois, formatMontant(f.net, devise)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });
  }

  // ---------- Page 3 : Stock, créances et dettes ----------
  doc.addPage();
  sectionTitle(doc, "Stock, créances & dettes");

  const valeurStock = products.reduce((s, p) => s + Number(p.quantity) * Number(p.unit_price), 0);
  const creancesOuvertes = credits.filter((c) => c.type === "client" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
  const dettesOuvertes = credits.filter((c) => c.type === "fournisseur" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);

  autoTable(doc, {
    startY: 30,
    body: [
      ["Valeur du stock actuel", formatMontant(valeurStock, devise)],
      ["Créances clients en cours", formatMontant(creancesOuvertes, devise)],
      ["Dettes fournisseurs en cours", formatMontant(dettesOuvertes, devise)],
      ["Actif net estimé (stock + créances − dettes)", formatMontant(valeurStock + creancesOuvertes - dettesOuvertes, devise)],
    ],
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: { 0: { textColor: [71, 85, 105] }, 1: { fontStyle: "bold", halign: "right" } },
  });

  if (analysis.topProfitables.length > 0) {
    curY = doc.lastAutoTable.finY + 12;
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
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
