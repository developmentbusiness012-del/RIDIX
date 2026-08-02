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

export const PLANS = [
  {
    id: "freemium",
    label: "Freemium",
    price: "0 FCFA",
    tagline: "Pour démarrer seul",
    features: [
      "Jusqu'à 2 entreprises",
      "1 seul utilisateur (vous)",
      "Contrôle complet : écritures, import CSV, exports Excel/PDF",
      "Tableaux de bord et graphiques illimités",
    ],
  },
  {
    id: "premium",
    label: "Premium",
    price: "2 500 FCFA",
    period: "/ mois",
    promo: true,
    promoLabel: "🔥 Offre de lancement",
    tagline: "Pour gérer une équipe",
    features: [
      "Entreprises illimitées",
      "Employés illimités, connectés via le code entreprise",
      "Tout Freemium, plus la gestion d'équipe",
      "Restrictions employé configurables (voir détail)",
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
