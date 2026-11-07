import { Briefcase, ShoppingBag, Warehouse, Zap, Receipt, HandCoins, Boxes, Truck, Wallet, Clock, AlertTriangle, PackageX, Banknote } from "lucide-react";
import { CATEGORIE_LIGNE, CATEGORIES_RECETTE, CATEGORIES_DEPENSE, formatMontant } from "./constants";

// =====================================================================================
//  Profils d'activité : prestation de services · vente au détail · vente en gros
//  Chaque entreprise a un type d'activité (companies.business_type). Il adapte tout RIDIX :
//  vocabulaire, catégories d'écritures, onglets, indicateurs et alertes de l'accueil,
//  actions rapides, graphiques. Sans type choisi, RIDIX garde son comportement générique.
// =====================================================================================

const COMMON_DEPENSES_TAIL = ["Salaires", "Loyer", "Marketing", "Impôts & taxes", "Frais bancaires / change", "Autre dépense"];

export const BUSINESS_TYPES = {
  services: {
    id: "services",
    label: "Prestation de services",
    short: "Services",
    icon: Briefcase,
    tagline: "Vous vendez votre savoir-faire, votre temps ou une intervention.",
    examples: "Coiffure, couture, plomberie, consulting, transport, réparation, formation…",
    entryPlaceholder: "Ex : Coupe + brushing — Mme Nkono",
    welcome: "Facturez vos prestations, suivez vos factures à encaisser et gardez vos charges sous contrôle.",
    // vocabulaire
    newEntryLabel: "Nouvelle prestation",
    incomeLabel: "Prestation",
    revenueKpi: "Prestations facturées",
    expenseHint: "Charges de l'activité",
    emptyHint: "Enregistrez votre première prestation pour voir votre activité apparaître ici.",
    // catégories d'écritures
    categoriesRecette: ["Prestation de service", "Consultation / Conseil", "Abonnement / Contrat récurrent", "Acompte client", "Financement reçu", "Autre recette"],
    categoriesDepense: ["Sous-traitance", "Salaires", "Loyer", "Déplacements & transport", "Matériel & logiciels", "Marketing", "Impôts & taxes", "Frais bancaires / change", "Autre dépense"],
    // organisation
    showStock: false,
    showOpType: false,
    tabs: { order: ["bord", "credits", "bilan", "analyse", "dataroom", "intelligence", "app"], labels: { credits: "Factures & créances" } },
    recetteChart: "categorie",
    quickActions: [
      { id: "prestation", label: "Nouvelle prestation", icon: Zap, entry: { sens: "recette", categorie: "Prestation de service" }, tone: "emerald" },
      { id: "encaisser", label: "Facture à encaisser", icon: Receipt, tab: "credits", tone: "amber" },
      { id: "depense", label: "Dépense", icon: Wallet, entry: { sens: "depense", categorie: "Déplacements & transport" }, tone: "rose" },
    ],
  },
  detail: {
    id: "detail",
    label: "Vente au détail",
    short: "Détail",
    icon: ShoppingBag,
    tagline: "Vous vendez directement aux consommateurs, au comptoir ou en ligne.",
    examples: "Boutique, quincaillerie, pharmacie, alimentation, vêtements, téléphonie…",
    entryPlaceholder: "Ex : 3 sacs de riz — client comptoir",
    welcome: "Enregistrez vos ventes de la journée, surveillez votre stock et votre caisse au quotidien.",
    newEntryLabel: "Nouvelle vente",
    incomeLabel: "Vente",
    revenueKpi: "Ventes",
    expenseHint: "Achats et charges du magasin",
    emptyHint: "Enregistrez votre première vente pour suivre votre caisse jour après jour.",
    categoriesRecette: ["Vente comptoir", "Vente en ligne / réseaux sociaux", "Vente à crédit", "Financement reçu", "Autre recette"],
    categoriesDepense: ["Achat marchandise", "Transport / Fret", "Loyer", "Salaires", "Électricité, eau & internet", "Emballage & fournitures", "Marketing", "Impôts & taxes", "Frais bancaires / change", "Autre dépense"],
    showStock: true,
    showOpType: false,
    defaultPeriod: "jour",
    tabs: { order: ["bord", "stock", "credits", "bilan", "analyse", "dataroom", "intelligence", "app"], labels: { stock: "Stock & produits", credits: "Crédits clients" } },
    recetteChart: "categorie",
    quickActions: [
      { id: "vente", label: "Vente rapide", icon: Zap, entry: { sens: "recette", categorie: "Vente comptoir" }, tone: "emerald" },
      { id: "reappro", label: "Réapprovisionner", icon: Boxes, tab: "stock", tone: "amber" },
      { id: "depense", label: "Dépense", icon: Wallet, entry: { sens: "depense", categorie: "Achat marchandise" }, tone: "rose" },
    ],
  },
  gros: {
    id: "gros",
    label: "Vente en gros",
    short: "Gros",
    icon: Warehouse,
    tagline: "Vous vendez en grandes quantités à des revendeurs, entreprises ou institutions.",
    examples: "Grossiste, distribution, import-export, centrale d'achat, négoce…",
    entryPlaceholder: "Ex : 50 cartons d'huile — Ets Batoum",
    welcome: "Pilotez vos commandes, vos créances clients, vos dettes fournisseurs et votre stock en volume.",
    newEntryLabel: "Nouvelle vente en gros",
    incomeLabel: "Vente en gros",
    revenueKpi: "Ventes en gros",
    expenseHint: "Achats fournisseurs et logistique",
    emptyHint: "Enregistrez votre première commande ou vente en gros pour lancer votre suivi.",
    categoriesRecette: ["Vente en gros", "Vente à crédit (revendeur)", "Vente export", "Acompte client", "Financement reçu", "Autre recette"],
    categoriesDepense: ["Achat marchandise", "Transport / Fret", "Douane & taxes import", "Logistique / Entrepôt", "Salaires", "Loyer", "Marketing", "Impôts & taxes", "Frais bancaires / change", "Autre dépense"],
    showStock: true,
    showOpType: true,
    tabs: { order: ["bord", "credits", "stock", "bilan", "analyse", "dataroom", "intelligence", "app"], labels: { stock: "Stock en volume", credits: "Clients & fournisseurs" } },
    recetteChart: "type_op",
    quickActions: [
      { id: "vente", label: "Vente en gros", icon: Zap, entry: { sens: "recette", categorie: "Vente en gros" }, tone: "emerald" },
      { id: "achat", label: "Achat fournisseur", icon: Truck, entry: { sens: "depense", categorie: "Achat marchandise" }, tone: "rose" },
      { id: "encaisser", label: "Encaisser un client", icon: HandCoins, tab: "credits", tone: "amber" },
    ],
  },
};

// Comportement d'origine, pour une entreprise dont le type n'est pas encore choisi
export const GENERIC_PROFILE = {
  id: null,
  label: null,
  short: null,
  icon: null,
  newEntryLabel: "Écriture",
  incomeLabel: "Recette",
  revenueKpi: "Chiffre d'affaires",
  emptyHint: "Le registre est vide pour cette sélection — ajoutez ou importez une écriture pour commencer.",
  categoriesRecette: CATEGORIES_RECETTE,
  categoriesDepense: CATEGORIES_DEPENSE,
  showStock: true,
  showOpType: true,
  tabs: { order: ["bord", "stock", "credits", "bilan", "analyse", "dataroom", "intelligence", "app"], labels: {} },
  recetteChart: "type_op",
  quickActions: [],
};

export const BUSINESS_TYPE_LIST = [BUSINESS_TYPES.services, BUSINESS_TYPES.detail, BUSINESS_TYPES.gros];
export const getBusinessProfile = (type) => BUSINESS_TYPES[type] || GENERIC_PROFILE;
export const businessTypeLabel = (type) => BUSINESS_TYPES[type]?.label || null;

// =====================================================================================
//  Indicateurs métier de l'accueil + alertes
// =====================================================================================
const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const num = (v) => Number(v) || 0;

function receivables(credits, type) {
  const today = localDay();
  const open = (credits || []).filter((c) => c.type === type && c.statut === "ouvert");
  const rest = (c) => Math.max(0, num(c.montant) - num(c.montant_paye));
  const total = open.reduce((s, c) => s + rest(c), 0);
  const overdue = open.filter((c) => c.date_echeance && c.date_echeance < today);
  return {
    count: open.length,
    total,
    overdueCount: overdue.length,
    overdueTotal: overdue.reduce((s, c) => s + rest(c), 0),
    soon: open.filter((c) => c.date_echeance && c.date_echeance >= today && c.date_echeance <= localDay(new Date(Date.now() + 7 * 86400000))),
  };
}

function stockFigures(products) {
  const list = products || [];
  return {
    value: list.reduce((s, p) => s + num(p.quantity) * num(p.cost_price), 0),
    low: list.filter((p) => num(p.quantity) <= num(p.alert_threshold)),
    count: list.length,
  };
}

// Charges fixes mensuelles moyennes (salaires + loyer) sur les 90 derniers jours
function monthlyFixedCharges(transactions) {
  const from = localDay(new Date(Date.now() - 90 * 86400000));
  const sum = (transactions || [])
    .filter((t) => t.sens === "depense" && t.date >= from && ["salaires", "loyer"].includes(CATEGORIE_LIGNE[t.categorie]))
    .reduce((s, t) => s + num(t.montant_base), 0);
  return sum / 3;
}

// ctx : { filtered, transactions, biz: {products, credits}, devise, premium, kpis: {ca, dep} }
export function computeProfileKpis(typeId, ctx) {
  const { filtered, transactions, biz, devise, premium, kpis } = ctx;
  const locked = !premium;
  const recettes = filtered.filter((t) => t.sens === "recette");
  const avgTicket = recettes.length > 0 ? kpis.ca / recettes.length : 0;
  const rec = receivables(biz?.credits, "client");
  const sup = receivables(biz?.credits, "fournisseur");
  const stock = stockFigures(biz?.products);
  const today = localDay();
  const salesToday = (transactions || []).filter((t) => t.sens === "recette" && t.date === today);
  const salesTodayTotal = salesToday.reduce((s, t) => s + num(t.montant_base), 0);
  const cogs = filtered.filter((t) => t.sens === "depense" && CATEGORIE_LIGNE[t.categorie] === "cogs").reduce((s, t) => s + num(t.montant_base), 0);
  const grossMargin = kpis.ca > 0 ? ((kpis.ca - cogs) / kpis.ca) * 100 : 0;

  if (typeId === "services") {
    return [
      { id: "avg", label: "Prix moyen d'une prestation", value: formatMontant(avgTicket, devise), sub: `${recettes.length} prestation(s) sur la période`, icon: Briefcase, accent: "border-l-indigo-400" },
      { id: "fixed", label: "Charges fixes / mois", value: formatMontant(monthlyFixedCharges(transactions), devise), sub: "Salaires + loyer, moyenne 3 mois", icon: Clock, accent: "border-l-slate-500" },
      { id: "toCollect", label: "Factures à encaisser", value: locked ? "Premium" : formatMontant(rec.total, devise), sub: locked ? "Suivi des créances clients" : `${rec.count} facture(s) ouverte(s)`, icon: Receipt, accent: "border-l-amber-400", locked, tab: "credits" },
      { id: "late", label: "Factures en retard", value: locked ? "Premium" : `${rec.overdueCount}`, sub: locked ? "Relances automatiques à repérer" : rec.overdueCount ? `${formatMontant(rec.overdueTotal, devise)} à relancer` : "Aucun retard", icon: AlertTriangle, accent: rec.overdueCount ? "border-l-rose-500" : "border-l-emerald-400", locked, tab: "credits" },
    ];
  }
  if (typeId === "detail") {
    return [
      { id: "today", label: "Ventes aujourd'hui", value: formatMontant(salesTodayTotal, devise), sub: `${salesToday.length} vente(s) enregistrée(s)`, icon: Zap, accent: "border-l-emerald-400" },
      { id: "basket", label: "Panier moyen", value: formatMontant(avgTicket, devise), sub: `${recettes.length} vente(s) sur la période`, icon: ShoppingBag, accent: "border-l-indigo-400" },
      { id: "stockValue", label: "Valeur du stock", value: locked ? "Premium" : formatMontant(stock.value, devise), sub: locked ? "Suivi du stock et des ruptures" : `${stock.count} produit(s) en rayon`, icon: Boxes, accent: "border-l-amber-400", locked, tab: "stock" },
      { id: "restock", label: "À réapprovisionner", value: locked ? "Premium" : `${stock.low.length}`, sub: locked ? "Alertes de rupture" : stock.low.length ? "Produits sous le seuil d'alerte" : "Stock suffisant", icon: PackageX, accent: stock.low.length ? "border-l-rose-500" : "border-l-emerald-400", locked, tab: "stock" },
    ];
  }
  if (typeId === "gros") {
    return [
      { id: "recv", label: "Créances clients", value: locked ? "Premium" : formatMontant(rec.total, devise), sub: locked ? "Suivi des clients à crédit" : rec.overdueCount ? `${rec.overdueCount} en retard · ${formatMontant(rec.overdueTotal, devise)}` : `${rec.count} client(s) à encaisser`, icon: HandCoins, accent: rec.overdueCount ? "border-l-rose-500" : "border-l-amber-400", locked, tab: "credits" },
      { id: "debts", label: "Dettes fournisseurs", value: locked ? "Premium" : formatMontant(sup.total, devise), sub: locked ? "Échéances fournisseurs" : `${sup.count} fournisseur(s) à payer`, icon: Truck, accent: "border-l-slate-500", locked, tab: "credits" },
      { id: "stockValue", label: "Valeur du stock", value: locked ? "Premium" : formatMontant(stock.value, devise), sub: locked ? "Stock en volume" : `${stock.count} référence(s)`, icon: Boxes, accent: "border-l-indigo-400", locked, tab: "stock" },
      { id: "gross", label: "Marge brute", value: `${grossMargin.toFixed(1)} %`, sub: "(Ventes − achats) / ventes", icon: Banknote, accent: "border-l-emerald-400" },
    ];
  }
  return [];
}

// Points d'attention : [{ id, tone: 'rose' | 'amber', text, tab }]
export function computeProfileAlerts(typeId, ctx) {
  const { transactions, biz, devise, premium } = ctx;
  const out = [];
  if (!typeId) return out;
  const rec = receivables(biz?.credits, "client");
  const sup = receivables(biz?.credits, "fournisseur");
  const stock = stockFigures(biz?.products);

  if (premium && (typeId === "services" || typeId === "gros") && rec.overdueCount > 0) {
    out.push({ id: "overdue", tone: "rose", text: `${rec.overdueCount} ${typeId === "services" ? "facture(s)" : "créance(s) client"} en retard — ${formatMontant(rec.overdueTotal, devise)} à relancer.`, tab: "credits" });
  }
  if (premium && typeId === "gros" && sup.soon.length > 0) {
    out.push({ id: "supplier", tone: "amber", text: `${sup.soon.length} paiement(s) fournisseur à effectuer dans les 7 jours.`, tab: "credits" });
  }
  if (premium && (typeId === "detail" || typeId === "gros") && stock.low.length > 0) {
    const names = stock.low.slice(0, 3).map((p) => p.name).join(", ");
    out.push({ id: "lowstock", tone: "amber", text: `${stock.low.length} produit(s) sous le seuil d'alerte : ${names}${stock.low.length > 3 ? "…" : ""}.`, tab: "stock" });
  }
  if (typeId === "services") {
    const fixed = monthlyFixedCharges(transactions);
    const from = localDay(new Date(Date.now() - 30 * 86400000));
    const ca30 = (transactions || []).filter((t) => t.sens === "recette" && t.date >= from).reduce((s, t) => s + num(t.montant_base), 0);
    if (fixed > 0 && ca30 < fixed) {
      out.push({ id: "fixed", tone: "amber", text: `Vos prestations des 30 derniers jours (${formatMontant(ca30, devise)}) ne couvrent pas encore vos charges fixes mensuelles (${formatMontant(fixed, devise)}).`, tab: "bord" });
    }
  }
  return out;
}

