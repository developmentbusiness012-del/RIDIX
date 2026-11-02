import { MOIS_FR, cashAccountTypeLabel } from "./constants";

// Source de vérité unique de la trésorerie, partagée par le bloc « Où est votre argent »,
// l'onglet Bilan, l'onglet Analyse et tous les rapports téléchargeables : un même chiffre partout.
//
//   Solde d'un compte  = solde d'ouverture + recettes rattachées − dépenses rattachées
//   Non affecté        = écritures sans compte (ou rattachées à un compte archivé)
//   Trésorerie totale  = somme des soldes des comptes + solde « non affecté »
//                      = soldes d'ouverture + toutes les recettes − toutes les dépenses

const num = (v) => Number(v) || 0;

export function computeTreasury(transactions = [], cashAccounts = []) {
  const byId = new Map();
  const accounts = cashAccounts.map((a) => {
    const row = { ...a, soldeInitial: num(a.solde_initial), entrees: 0, sorties: 0, solde: 0, mouvements: 0 };
    byId.set(a.id, row);
    return row;
  });
  const nonAffecte = { entrees: 0, sorties: 0, solde: 0, mouvements: 0 };
  let totalEntrees = 0;
  let totalSorties = 0;

  for (const t of transactions) {
    const v = num(t.montant_base);
    const isIn = t.sens === "recette";
    if (isIn) totalEntrees += v; else totalSorties += v;
    const target = (t.account_id && byId.get(t.account_id)) || nonAffecte;
    if (isIn) target.entrees += v; else target.sorties += v;
    target.mouvements += 1;
  }

  accounts.forEach((a) => { a.solde = a.soldeInitial + a.entrees - a.sorties; });
  nonAffecte.solde = nonAffecte.entrees - nonAffecte.sorties;

  const soldeInitialTotal = accounts.reduce((s, a) => s + a.soldeInitial, 0);
  const totalComptes = accounts.reduce((s, a) => s + a.solde, 0);

  return {
    accounts,
    nonAffecte,
    soldeInitialTotal,
    totalEntrees,
    totalSorties,
    net: totalEntrees - totalSorties,
    totalComptes,
    total: totalComptes + nonAffecte.solde,
  };
}

// Répartition par type de compte (banque, mobile money, caisse…) avec la part de chaque type.
export function treasuryByType(treasury) {
  const groups = {};
  treasury.accounts.forEach((a) => {
    const label = cashAccountTypeLabel(a.type);
    groups[label] = (groups[label] || 0) + a.solde;
  });
  if (treasury.nonAffecte.mouvements > 0) groups["Non affecté"] = (groups["Non affecté"] || 0) + treasury.nonAffecte.solde;
  // Part calculée sur les soldes positifs uniquement (un solde négatif n'a pas de « part » lisible).
  const totalPositif = Object.values(groups).reduce((s, v) => s + Math.max(0, v), 0);
  return Object.entries(groups).map(([label, solde]) => ({ label, solde, part: solde > 0 && totalPositif > 0 ? (solde / totalPositif) * 100 : null }));
}

function monthKeys(n) {
  const now = new Date();
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

// Évolution mensuelle de la trésorerie : le solde de fin de mois part des soldes d'ouverture, donc
// le dernier mois rejoint exactement la trésorerie totale affichée dans l'application.
export function computeMonthlyTreasury(transactions = [], cashAccounts = [], months = 12) {
  const keys = monthKeys(months);
  const opening = cashAccounts.reduce((s, a) => s + num(a.solde_initial), 0);
  const perMonth = {};
  let before = 0;
  let after = 0;
  for (const t of transactions) {
    const k = String(t.date || "").slice(0, 7);
    const v = t.sens === "recette" ? num(t.montant_base) : -num(t.montant_base);
    if (k < keys[0]) before += v;
    else if (k > keys[keys.length - 1]) after += v;
    else {
      const b = (perMonth[k] = perMonth[k] || { entrees: 0, sorties: 0 });
      if (v >= 0) b.entrees += v; else b.sorties += -v;
    }
  }
  let running = opening + before;
  const rows = keys.map((k) => {
    const b = perMonth[k] || { entrees: 0, sorties: 0 };
    running += b.entrees - b.sorties;
    const [y, m] = k.split("-").map(Number);
    return { key: k, label: `${MOIS_FR[m - 1]} ${y}`, entrees: b.entrees, sorties: b.sorties, net: b.entrees - b.sorties, soldeFin: running };
  });
  return { rows, soldeOuverture: opening + before, futureNet: after };
}
