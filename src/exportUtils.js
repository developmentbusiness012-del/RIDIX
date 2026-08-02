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
