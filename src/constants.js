import { Store, Package, Ship, Layers } from "lucide-react";

export const DEVISES = ["XAF", "EUR", "USD", "GBP", "CNY", "NGN"];

export const TYPES_OP = [
  { id: "local", label: "Local", icon: Store },
  { id: "import", label: "Import", icon: Package },
  { id: "export", label: "Export", icon: Ship },
  { id: "autre", label: "Autre", icon: Layers },
];

export const CATEGORIES_RECETTE = ["Vente locale", "Vente export", "Prestation de service", "Autre recette"];
export const CATEGORIES_DEPENSE = [
  "Achat marchandise",
  "Transport / Fret",
  "Douane & taxes import",
  "Logistique / Entrepôt",
  "Marketing",
  "Salaires",
  "Frais bancaires / change",
  "Autre dépense",
];

export const PROFILS = [
  { id: "local", label: "Commerçant local" },
  { id: "importateur", label: "Importateur" },
  { id: "exportateur", label: "Exportateur" },
  { id: "mixte", label: "Mixte (import & export)" },
];

export const PALETTE = { local: "#818cf8", import: "#fbbf24", export: "#34d399", autre: "#94a3b8" };

export const MOIS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export const PAYS_AFRIQUE = [
  "Afrique du Sud", "Algérie", "Angola", "Bénin", "Botswana", "Burkina Faso", "Burundi",
  "Cameroun", "Cap-Vert", "Comores", "Congo-Brazzaville", "Congo-Kinshasa (RDC)", "Côte d'Ivoire",
  "Djibouti", "Égypte", "Érythrée", "Eswatini", "Éthiopie", "Gabon", "Gambie", "Ghana", "Guinée",
  "Guinée-Bissau", "Guinée équatoriale", "Kenya", "Lesotho", "Liberia", "Libye", "Madagascar",
  "Malawi", "Mali", "Maroc", "Maurice", "Mauritanie", "Mozambique", "Namibie", "Niger", "Nigeria",
  "Ouganda", "Rwanda", "Sao Tomé-et-Principe", "Sénégal", "Seychelles", "Sierra Leone", "Somalie",
  "Soudan", "Soudan du Sud", "Tanzanie", "Tchad", "Togo", "Tunisie", "Zambie", "Zimbabwe", "Autre",
];

export const PLANS = [
  {
    id: "freemium",
    label: "Freemium",
    price: "0 FCFA",
    tagline: "Pour démarrer seul",
    features: [
      "Jusqu'à 2 entreprises",
      "1 seul utilisateur (vous)",
      "Recettes, dépenses, import CSV, exports Excel/PDF",
      "Tableau de bord (aujourd'hui, semaine, mois, année)",
    ],
  },
  {
    id: "premium",
    planKey: "2m",
    label: "Premium — 2 mois",
    price: "5 000 FCFA",
    period: "/ 2 mois",
    tagline: "Pour piloter et faire grandir votre commerce",
    features: [
      "Tout Freemium, sans limite d'entreprises",
      "Gestion des stocks avec alertes de rupture",
      "Suivi des crédits clients et dettes fournisseurs",
      "Score de santé financière et prévisions de trésorerie",
      "Dossier de financement PDF, prêt pour votre banque",
      "Employés illimités, connectés via le code entreprise",
    ],
  },
  {
    id: "premium_2y",
    planKey: "2y",
    label: "Premium — 2 ans",
    price: "50 000 FCFA",
    originalPrice: "60 000 FCFA",
    period: "/ 2 ans",
    promo: true,
    promoLabel: "🔥 Offre de lancement",
    tagline: "Le meilleur tarif pour un engagement long terme",
    features: [
      "Tout ce qui est inclus dans Premium 2 mois",
      "Le meilleur prix au mois sur la durée",
      "Pas de renouvellement à gérer pendant 2 ans",
    ],
  },
];

// Ce que les comptes employés NE peuvent PAS faire
export const EMPLOYEE_RESTRICTIONS = [
  "Créer, renommer ou supprimer une entreprise",
  "Modifier les paramètres de l'entreprise (nom, devise, profil, code entreprise)",
  "Supprimer une écriture existante",
  "Voir ou gérer la liste des employés",
  "Changer l'offre Freemium / Premium",
  "Accéder à une autre entreprise que celle assignée par le code",
];

// Ce que les comptes employés PEUVENT faire
export const EMPLOYEE_ALLOWED = [
  "Ajouter des écritures (recettes et dépenses)",
  "Importer des écritures en masse via CSV",
  "Gérer le stock (ajouter des produits, ajuster les quantités)",
  "Enregistrer des crédits clients et dettes fournisseurs",
  "Consulter le tableau de bord, les graphiques et les rapports",
  "Exporter les écritures en Excel ou PDF",
];

export function formatMontant(v, devise) {
  try {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(v || 0)) + " " + devise;
  } catch {
    return Math.round(v || 0) + " " + devise;
  }
}
