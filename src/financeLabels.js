// Libellés du journal financier de RIDIX (partagés par l'écran Finances et les rapports téléchargeables)
export const EXPENSE_LABELS = {
  commission: "Commissions commerciaux",
  hebergement: "Hébergement & infrastructure",
  marketing: "Marketing & publicité",
  salaires: "Salaires & équipe",
  outils: "Logiciels & outils",
  telecom: "Télécom & internet",
  deplacements: "Déplacements terrain",
  frais_paiement: "Frais de paiement (Maketou)",
  juridique: "Juridique & comptabilité",
  autre_depense: "Autres dépenses",
};
export const REVENUE_LABELS = { abonnement: "Abonnements", autre_revenu: "Autres revenus" };
export const SOURCE_LABELS = {
  maketou: "Maketou (automatique)",
  cash: "Encaissement manuel",
  manual: "Saisie manuelle",
  commission: "Commission versée",
};
export const categoryLabel = (c) => EXPENSE_LABELS[c] || REVENUE_LABELS[c] || c;
