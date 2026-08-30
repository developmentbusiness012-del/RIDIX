// Calcule une capacité financière indicative — jamais une décision de crédit.
// Méthode : flux net moyen mensuel (6 derniers mois) x 6, réduit par le poids de l'endettement actuel.
export function computeCapacity(transactions, dettesOuvertesTotal) {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recent = transactions.filter((t) => new Date(t.date) >= sixMonthsAgo);
  if (recent.length === 0) return { eligible: false, reason: "Pas encore assez d'historique (6 mois de données recommandés) pour une estimation fiable." };

  const monthsWithData = new Set(recent.map((t) => t.date.slice(0, 7))).size || 1;
  const netTotal = recent.reduce((s, t) => s + (t.sens === "recette" ? Number(t.montant_base) : -Number(t.montant_base)), 0);
  const avgMonthlyNet = netTotal / monthsWithData;

  if (avgMonthlyNet <= 0) {
    return { eligible: false, reason: "Votre flux net mensuel moyen est négatif ou nul sur la période récente — priorité à l'équilibre avant de préparer un financement.", avgMonthlyNet, monthsWithData };
  }

  const caTotal = recent.filter((t) => t.sens === "recette").reduce((s, t) => s + Number(t.montant_base), 0);
  const avgMonthlyCa = caTotal / monthsWithData;
  const debtRatio = avgMonthlyCa > 0 ? Math.min(dettesOuvertesTotal / (avgMonthlyCa * 6), 0.5) : 0;

  const brut = avgMonthlyNet * 6;
  const capacite = Math.max(0, brut * (1 - debtRatio));

  return { eligible: true, capacite, avgMonthlyNet, monthsWithData, debtRatio, brut };
}

// Score de préparation au financement (Étape 6) — distinct du Financial Score.
// Mesure la préparation du dossier, pas la santé financière brute. Boucle vivante :
// chaque critère est recalculé à partir des vraies données, donc agir sur une recommandation
// fait mécaniquement remonter le score au prochain calcul (pas de case à cocher artificielle).
export function computeReadiness({ healthScore, transactions, products, assets, liabilities, credits, financingRequests, debtRatio }) {
  const items = [];

  const santePts = Math.round((healthScore / 100) * 20);
  items.push({
    id: "sante",
    label: "Santé financière",
    points: santePts,
    max: 20,
    ok: santePts >= 16,
    problem: santePts < 16 ? `Votre score de santé financière (${healthScore}/100) tire la préparation vers le bas.` : null,
    recommendation: "Améliorez votre marge, résorbez vos ruptures de stock et relancez vos créances en retard.",
    tab: "intelligence",
    tabLabel: "Voir Intelligence",
  });

  const months = new Set(transactions.map((t) => t.date.slice(0, 7))).size;
  const histoPts = Math.min(20, Math.round((months / 6) * 20));
  items.push({
    id: "historique",
    label: "Historique de données",
    points: histoPts,
    max: 20,
    ok: months >= 6,
    problem: months < 6 ? `Seulement ${months} mois de données enregistrées — les prêteurs veulent généralement voir 6 mois d'historique minimum.` : null,
    recommendation: "Continuez à enregistrer vos recettes et dépenses chaque mois, sans interruption.",
    tab: "bord",
    tabLabel: "Ajouter des écritures",
  });

  const margeOk = products.some((p) => Number(p.cost_price) > 0);
  const bilanOk = assets.length > 0 || liabilities.length > 0;
  const echeancesOk = credits.filter((c) => c.type === "client").length === 0 || credits.filter((c) => c.type === "client").some((c) => c.date_echeance);
  const qualitePts = (margeOk ? 7 : 0) + (bilanOk ? 7 : 0) + (echeancesOk ? 6 : 0);
  const qualiteProblemes = [];
  if (!margeOk) qualiteProblemes.push("aucun prix de revient renseigné (marge réelle inconnue)");
  if (!bilanOk) qualiteProblemes.push("bilan vide (aucun actif ni passif renseigné)");
  if (!echeancesOk) qualiteProblemes.push("créances clients sans échéance de paiement");
  items.push({
    id: "qualite",
    label: "Qualité des données",
    points: qualitePts,
    max: 20,
    ok: qualitePts >= 20,
    problem: qualiteProblemes.length > 0 ? `Données incomplètes : ${qualiteProblemes.join(", ")}.` : null,
    recommendation: "Renseignez le prix de revient de vos produits, complétez votre Bilan, et ajoutez des échéances à vos créances.",
    tab: "stock",
    tabLabel: "Compléter les données",
  });

  const dettePts = Math.round(20 * (1 - Math.min(debtRatio * 2, 1)));
  items.push({
    id: "endettement",
    label: "Endettement maîtrisé",
    points: dettePts,
    max: 20,
    ok: dettePts >= 16,
    problem: dettePts < 16 ? "Votre endettement en cours pèse lourd par rapport à votre chiffre d'affaires — un prêteur regardera ce ratio de près." : null,
    recommendation: "Réduisez vos dettes fournisseurs en cours ou étalez vos échéances avant de solliciter un nouveau financement.",
    tab: "bilan",
    tabLabel: "Voir le Bilan",
  });

  const lastRequest = financingRequests[0];
  const projetPts = lastRequest ? (lastRequest.description ? 20 : 12) : 0;
  items.push({
    id: "projet",
    label: "Projet clarifié",
    points: projetPts,
    max: 20,
    ok: projetPts >= 20,
    problem: !lastRequest
      ? "Vous n'avez pas encore exprimé de besoin de financement précis."
      : !lastRequest.description
      ? "Votre besoin est exprimé mais sans description — un prêteur voudra comprendre le projet en détail."
      : null,
    recommendation: "Décrivez précisément votre projet (quoi, pourquoi, quand) dans une nouvelle demande.",
    tab: "financement",
    tabLabel: "Exprimer un besoin",
  });

  const score = items.reduce((s, i) => s + i.points, 0);
  return { score, items, problems: items.filter((i) => i.problem) };
}

export function readinessLabel(score) {
  if (score >= 80) return "Dossier prêt — vous pouvez aborder une institution financière en confiance.";
  if (score >= 60) return "Bien engagé — quelques points à renforcer avant de présenter votre dossier.";
  if (score >= 40) return "En construction — plusieurs éléments clés manquent encore.";
  return "Trop tôt pour se présenter — concentrez-vous d'abord sur les fondations.";
}
