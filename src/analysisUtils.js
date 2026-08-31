import { MOIS_FR, TYPES_OP } from "./constants";

function formatMontant(v, devise) {
  const rounded = Math.round(v || 0);
  const withSpaces = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (rounded < 0 ? "-" : "") + withSpaces + (devise ? " " + devise : "");
}

export function scoreLabel(score) {
  if (score >= 80) return "Excellente santé financière.";
  if (score >= 60) return "Bonne santé, quelques points à surveiller.";
  if (score >= 40) return "Santé fragile — des actions correctives sont recommandées.";
  return "Situation à risque — une attention immédiate est nécessaire.";
}

// RIDIX Score (Étape 3) — santé financière sur 100.
export function computeAnalysis(transactions, products, credits, deviseBase) {
  const now = new Date();

  const recentTx = transactions.filter((t) => {
    const d = new Date(t.date);
    const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return diffMonths >= 0 && diffMonths < 3;
  });
  const ca = recentTx.filter((t) => t.sens === "recette").reduce((s, t) => s + Number(t.montant_base), 0);
  const dep = recentTx.filter((t) => t.sens === "depense").reduce((s, t) => s + Number(t.montant_base), 0);
  const marge = ca > 0 ? (ca - dep) / ca : 0;

  let margePts = 0;
  if (marge >= 0.2) margePts = 30; else if (marge >= 0.1) margePts = 20; else if (marge > 0) margePts = 10;

  const ruptures = products.filter((p) => Number(p.quantity) <= Number(p.alert_threshold)).length;
  const stockPts = products.length === 0 ? 15 : Math.round(20 * Math.max(0, 1 - ruptures / products.length));

  const clientCredits = credits.filter((c) => c.type === "client" && c.statut === "ouvert");
  const clientEnRetard = clientCredits.filter((c) => c.date_echeance && new Date(c.date_echeance) < now).length;
  const creancePts = clientCredits.length === 0 ? 20 : Math.round(20 * Math.max(0, 1 - clientEnRetard / clientCredits.length));

  const dettesOuvertes = credits.filter((c) => c.type === "fournisseur" && c.statut === "ouvert")
    .reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
  const ratioDettes = ca > 0 ? dettesOuvertes / ca : 0;
  let dettePts = 15;
  if (ratioDettes > 0.5) dettePts = 0; else if (ratioDettes > 0.25) dettePts = 8;

  const txCeMois = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const regularitePts = txCeMois > 0 ? 15 : 0;

  const score = Math.min(100, margePts + stockPts + creancePts + dettePts + regularitePts);

  const scoreBreakdown = [
    { label: "Marge", points: margePts, max: 30 },
    { label: "Stock", points: stockPts, max: 20 },
    { label: "Créances", points: creancePts, max: 20 },
    { label: "Dettes", points: dettePts, max: 15 },
    { label: "Régularité", points: regularitePts, max: 15 },
  ];

  const anomalies = [];
  const depenses = transactions.filter((t) => t.sens === "depense").map((t) => Number(t.montant_base));
  if (depenses.length >= 4) {
    const moyenne = depenses.reduce((a, b) => a + b, 0) / depenses.length;
    const variance = depenses.reduce((a, b) => a + (b - moyenne) ** 2, 0) / depenses.length;
    const seuil = moyenne + 2 * Math.sqrt(variance);
    transactions
      .filter((t) => t.sens === "depense" && seuil > 0 && Number(t.montant_base) > seuil)
      .slice(0, 3)
      .forEach((t) => {
        anomalies.push({ level: "high", text: `Dépense inhabituelle : ${t.libelle || t.categorie} — ${formatMontant(t.montant_base, deviseBase)} le ${t.date}` });
      });
  }
  if (ruptures > 0) anomalies.push({ level: "medium", text: `${ruptures} produit(s) en alerte de rupture de stock.` });
  if (clientEnRetard > 0) anomalies.push({ level: "high", text: `${clientEnRetard} créance(s) client en retard de paiement.` });

  const monthlyNets = {};
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7);
    monthlyNets[key] = (monthlyNets[key] || 0) + (t.sens === "recette" ? Number(t.montant_base) : -Number(t.montant_base));
  });
  const sortedMonths = Object.keys(monthlyNets).sort();
  const lastThree = sortedMonths.slice(-3).map((k) => monthlyNets[k]);
  let forecast = null;
  if (lastThree.length >= 2) {
    const avgNet = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;
    forecast = [1, 2, 3].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return { mois: `${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`, net: Math.round(avgNet) };
    });
  }

  const profitByType = {};
  transactions.forEach((t) => {
    profitByType[t.type_op] = (profitByType[t.type_op] || 0) + (t.sens === "recette" ? Number(t.montant_base) : -Number(t.montant_base));
  });
  const topProfitables = TYPES_OP.map((tp) => ({ label: tp.label, profit: profitByType[tp.id] || 0 }))
    .filter((x) => x.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3);

  return { score, scoreBreakdown, anomalies, forecast, topProfitables };
}
