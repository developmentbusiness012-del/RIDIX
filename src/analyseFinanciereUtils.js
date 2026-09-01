import { CATEGORIE_LIGNE, MOIS_FR } from "./constants";

const num = (v) => Number(v) || 0;

function monthsBack(n) {
  const now = new Date();
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return arr;
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MOIS_FR[m - 1]} ${y}`;
}

// ---------- Bloc 3 : Compte de résultat ----------
// Dérivé des transactions, classées via CATEGORIE_LIGNE (constants.js). Faute d'amortissements
// suivis dans RIDIX, l'EBITDA et le résultat d'exploitation sont ici identiques — précisé à l'affichage.
export function computeCompteResultat(transactions, { months = 12 } = {}) {
  const periode = new Set(monthsBack(months));
  const tx = transactions.filter((t) => periode.has(t.date.slice(0, 7)));

  const lignes = { ventes: 0, autres_revenus: 0, financements_recus: 0, cogs: 0, salaires: 0, loyer: 0, impots: 0, charges_financieres: 0, charges_exploitation: 0 };
  tx.forEach((t) => {
    const ligne = CATEGORIE_LIGNE[t.categorie] || (t.sens === "recette" ? "autres_revenus" : "charges_exploitation");
    lignes[ligne] = (lignes[ligne] || 0) + num(t.montant_base);
  });

  const ca = lignes.ventes + lignes.autres_revenus;
  const cogs = lignes.cogs;
  const margeBrute = ca - cogs;
  const margeBrutePct = ca > 0 ? (margeBrute / ca) * 100 : 0;
  const chargesExploitation = lignes.salaires + lignes.loyer + lignes.charges_exploitation;
  const ebitda = margeBrute - chargesExploitation;
  const resultatExploitation = ebitda; // pas d'amortissements suivis à ce jour
  const resultatNet = resultatExploitation - lignes.charges_financieres - lignes.impots;

  return {
    periodeLabel: `${months} derniers mois`,
    ca, cogs, margeBrute, margeBrutePct,
    charges: { salaires: lignes.salaires, loyer: lignes.loyer, autres: lignes.charges_exploitation, total: chargesExploitation },
    ebitda, resultatExploitation,
    chargesFinancieres: lignes.charges_financieres,
    impots: lignes.impots,
    resultatNet,
    margeNettePct: ca > 0 ? (resultatNet / ca) * 100 : 0,
  };
}

// ---------- Bloc 4 : Cash-flow historique ----------
// Entrées : ventes, autres revenus, financements reçus (date de création du passif).
// Sorties : achats, salaires, loyers, impôts, autres charges, remboursements de crédit (liability_payments datés).
export function computeCashFlowHistorique(transactions, liabilityPayments = [], liabilities = [], { months = 12 } = {}) {
  const keys = monthsBack(months);
  const buckets = {};
  keys.forEach((k) => {
    buckets[k] = {
      mois: k, label: monthLabel(k),
      ventes: 0, autresRevenus: 0, financementsRecus: 0,
      achats: 0, salaires: 0, loyers: 0, impots: 0, autresCharges: 0, remboursements: 0,
    };
  });

  transactions.forEach((t) => {
    const k = t.date.slice(0, 7);
    if (!buckets[k]) return;
    const ligne = CATEGORIE_LIGNE[t.categorie] || (t.sens === "recette" ? "autres_revenus" : "charges_exploitation");
    const v = num(t.montant_base);
    if (ligne === "ventes") buckets[k].ventes += v;
    else if (ligne === "autres_revenus") buckets[k].autresRevenus += v;
    else if (ligne === "financements_recus") buckets[k].financementsRecus += v; // rare : rentrée de fonds saisie manuellement en transaction
    else if (ligne === "cogs") buckets[k].achats += v;
    else if (ligne === "salaires") buckets[k].salaires += v;
    else if (ligne === "loyer") buckets[k].loyers += v;
    else if (ligne === "impots") buckets[k].impots += v;
    else buckets[k].autresCharges += v; // charges_exploitation + charges_financieres
  });

  liabilities.forEach((l) => {
    const k = (l.created_at || "").slice(0, 7);
    if (buckets[k]) buckets[k].financementsRecus += num(l.montant);
  });

  liabilityPayments.forEach((p) => {
    const k = p.date.slice(0, 7);
    if (buckets[k]) buckets[k].remboursements += num(p.montant);
  });

  let cumul = 0;
  return keys.map((k) => {
    const b = buckets[k];
    const entrees = b.ventes + b.autresRevenus + b.financementsRecus;
    const sorties = b.achats + b.salaires + b.loyers + b.impots + b.autresCharges + b.remboursements;
    const net = entrees - sorties;
    cumul += net;
    return { ...b, entrees, sorties, net, cumul };
  });
}

// ---------- Bloc 4 : Cash-flow prévisionnel (6/12 mois, 3 scénarios) ----------
// Base : flux net mensuel moyen (3 derniers mois avec activité), ajusté ± selon le scénario,
// puis diminué des mensualités de dettes déjà connues (engagements fermes).
export function computeCashFlowPrevisionnel(transactions, liabilities = [], { monthsAhead = 6 } = {}) {
  const monthlyNets = {};
  transactions.forEach((t) => {
    const k = t.date.slice(0, 7);
    monthlyNets[k] = (monthlyNets[k] || 0) + (t.sens === "recette" ? num(t.montant_base) : -num(t.montant_base));
  });
  const sortedMonths = Object.keys(monthlyNets).sort();
  const lastThree = sortedMonths.slice(-3).map((k) => monthlyNets[k]);
  if (lastThree.length < 2) return null;

  const avgNet = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;
  const mensualitesConnues = liabilities.filter((l) => l.statut === "actif" && l.mensualite).reduce((s, l) => s + num(l.mensualite), 0);

  const SCENARIOS = { prudent: 0.75, normal: 1, optimiste: 1.2 };
  const now = new Date();

  return Array.from({ length: monthsAhead }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const row = { mois: `${MOIS_FR[d.getMonth()]} ${d.getFullYear()}` };
    Object.entries(SCENARIOS).forEach(([nom, facteur]) => {
      row[nom] = Math.round(avgNet * facteur - mensualitesConnues);
    });
    return row;
  });
}

// ---------- Bloc 6 : Endettement global ----------
export function computeEndettementGlobal({ credits = [], liabilities = [], ca = 0, avgMonthlyNet = 0, capitauxPropres = 0 }) {
  const now = new Date();
  const dettesFournisseurs = credits.filter((c) => c.type === "fournisseur" && c.statut === "ouvert")
    .reduce((s, c) => s + (num(c.montant) - num(c.montant_paye)), 0);

  const liabilitesActives = liabilities.filter((l) => l.statut === "actif");
  const dettesFinancieres = liabilitesActives.reduce((s, l) => s + (num(l.montant) - num(l.montant_rembourse)), 0);
  const mensualitesTotal = liabilitesActives.reduce((s, l) => s + num(l.mensualite), 0);

  const isCourtTerme = (l) => l.date_echeance && (new Date(l.date_echeance) - now) <= 365 * 24 * 60 * 60 * 1000;
  const courtTerme = liabilitesActives.filter(isCourtTerme).reduce((s, l) => s + (num(l.montant) - num(l.montant_rembourse)), 0) + dettesFournisseurs;
  const longTerme = liabilitesActives.filter((l) => !isCourtTerme(l)).reduce((s, l) => s + (num(l.montant) - num(l.montant_rembourse)), 0);

  const totalDettes = dettesFournisseurs + dettesFinancieres;
  const debtToEquity = capitauxPropres > 0 ? totalDettes / capitauxPropres : null;
  const debtToRevenue = ca > 0 ? totalDettes / ca : null;
  const debtServiceRatio = avgMonthlyNet > 0 ? mensualitesTotal / avgMonthlyNet : null;

  const creanciers = liabilitesActives.map((l) => ({
    id: l.id,
    nom: l.name,
    category: l.category,
    montantInitial: num(l.montant),
    solde: num(l.montant) - num(l.montant_rembourse),
    mensualite: l.mensualite != null ? num(l.mensualite) : null,
    echeance: l.date_echeance,
    devise: l.devise,
    terme: isCourtTerme(l) ? "court" : "long",
  }));

  return { dettesFournisseurs, dettesFinancieres, mensualitesTotal, courtTerme, longTerme, totalDettes, debtToEquity, debtToRevenue, debtServiceRatio, creanciers };
}
