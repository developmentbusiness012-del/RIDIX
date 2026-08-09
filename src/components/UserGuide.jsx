import { useState } from "react";
import {
  ArrowLeft, ChevronDown, Wallet, Boxes, HandCoins, Sparkles, Smartphone,
  Users, Settings, MessageCircle, CreditCard, WifiOff, FileText, Building2,
} from "lucide-react";

const SECTIONS = [
  {
    id: "demarrage",
    icon: Building2,
    title: "Démarrer avec Ridix",
    items: [
      {
        q: "Comment créer mon compte ?",
        a: "Sur l'écran d'accueil, choisissez « Créer une entreprise », indiquez le nom de votre entreprise, votre pays, votre email et un mot de passe. Aucune confirmation par email n'est nécessaire — vous accédez directement à votre tableau de bord.",
      },
      {
        q: "Comment un employé rejoint-il mon entreprise ?",
        a: "Depuis Paramètres, copiez le « code entreprise ». Votre employé choisit « Rejoindre en tant qu'employé » sur l'écran d'accueil, colle ce code, et accède à votre entreprise avec des droits limités (il ne peut pas supprimer d'écritures ni changer les paramètres).",
      },
      {
        q: "Puis-je gérer plusieurs entreprises ?",
        a: "Oui. Cliquez sur le nom de votre entreprise en haut du tableau de bord pour voir la liste et en ajouter une nouvelle. La Freemium est limitée à 2 entreprises, le Premium n'a pas de limite.",
      },
    ],
  },
  {
    id: "bord",
    icon: Wallet,
    title: "Tableau de bord & écritures",
    items: [
      {
        q: "Comment enregistrer une vente ou une dépense ?",
        a: "Cliquez sur « + Écriture ». Choisissez Recette (argent qui entre) ou Dépense (argent qui sort), le profil (local/import/export), une catégorie, le montant et la devise. Si vous êtes Premium et suivez votre stock, vous pouvez aussi lier l'écriture à un produit.",
      },
      {
        q: "Que montrent les chiffres en haut (CA, dépenses, profit, marge) ?",
        a: "Ce sont vos totaux pour la période sélectionnée. Utilisez les boutons Aujourd'hui / Semaine / Ce mois / Trimestre / Année / Tout pour changer la période affichée.",
      },
      {
        q: "Je suis employé, pourquoi je ne vois pas les mêmes chiffres que le patron ?",
        a: "C'est normal et voulu : un compte employé ne voit que ses propres écritures, jamais les chiffres globaux de l'entreprise.",
      },
      {
        q: "Comment exporter mes écritures ?",
        a: "Les boutons Excel et PDF en haut du tableau exportent les écritures actuellement affichées (selon vos filtres). Le bouton Importer permet d'ajouter en masse des écritures depuis un fichier CSV.",
      },
    ],
  },
  {
    id: "stock",
    icon: Boxes,
    title: "Stock (Premium)",
    items: [
      {
        q: "Comment ajouter un produit ?",
        a: "Dans l'onglet Stock, cliquez sur « Produit », indiquez son nom, la quantité de départ, l'unité et le seuil qui déclenche une alerte de rupture.",
      },
      {
        q: "Le stock se met-il à jour automatiquement ?",
        a: "Oui. Quand vous ajoutez une écriture liée à un produit : une Recette (vente) diminue le stock, une Dépense (réapprovisionnement) l'augmente — sans double saisie.",
      },
      {
        q: "Comment corriger une quantité manuellement ?",
        a: "Utilisez les boutons +/- à côté du produit, pour une casse ou un inventaire physique par exemple — cela ne crée pas d'écriture financière.",
      },
    ],
  },
  {
    id: "credits",
    icon: HandCoins,
    title: "Crédits & dettes (Premium)",
    items: [
      {
        q: "Quelle différence entre « Créances clients » et « Dettes fournisseurs » ?",
        a: "Créances clients = ce qu'on vous doit (vente à crédit). Dettes fournisseurs = ce que vous devez. Basculez entre les deux avec les onglets en haut du module.",
      },
      {
        q: "Comment enregistrer un paiement partiel ?",
        a: "Cliquez sur « + paiement » à côté de la fiche concernée, indiquez le montant reçu ou payé. La fiche passe automatiquement à « Soldé » une fois le montant total atteint.",
      },
    ],
  },
  {
    id: "intelligence",
    icon: Sparkles,
    title: "Intelligence financière (Premium)",
    items: [
      {
        q: "C'est quoi le score de santé financière ?",
        a: "Une note sur 100 calculée à partir de votre marge, votre stock, vos créances en retard et la régularité de votre activité. Plus il est haut, plus votre situation est saine.",
      },
      {
        q: "Que sont les « anomalies » détectées ?",
        a: "L'app repère automatiquement les dépenses inhabituelles, les produits en rupture et les créances clients en retard de paiement.",
      },
      {
        q: "Comment obtenir le dossier de financement ?",
        a: "Cliquez sur « Dossier de financement (PDF) » en haut de l'onglet Intelligence. Vous obtenez un document professionnel prêt à montrer à une banque ou un investisseur.",
      },
    ],
  },
  {
    id: "abonnement",
    icon: CreditCard,
    title: "Abonnement Premium",
    items: [
      {
        q: "Comment passer en Premium ?",
        a: "Dans Paramètres ou via les écrans « Premium » verrouillés, cliquez sur le bouton de passage en Premium — vous êtes redirigé vers le paiement, puis ramené automatiquement dans l'app une fois le paiement confirmé.",
      },
      {
        q: "L'abonnement se renouvelle-t-il tout seul ?",
        a: "Non, il dure 30 jours. Un bandeau vous prévient 5 jours avant l'échéance, avec un bouton pour renouveler en un clic. Passé le délai, vous repassez automatiquement en Freemium.",
      },
    ],
  },
  {
    id: "app",
    icon: Smartphone,
    title: "Installer l'application",
    items: [
      {
        q: "Comment installer Ridix sur mon téléphone ?",
        a: "Cliquez sur le bandeau « Installez l'app » ou allez dans l'onglet App. Un guide adapté à votre appareil (Android, iPhone, ordinateur) s'affiche avec les étapes exactes.",
      },
    ],
  },
  {
    id: "hors-ligne",
    icon: WifiOff,
    title: "Mode hors-ligne",
    items: [
      {
        q: "Puis-je utiliser l'app sans connexion internet ?",
        a: "Oui, une fois installée. Vous pouvez ouvrir l'app et enregistrer des écritures même sans réseau — elles s'affichent avec un point orange (« en attente ») et se synchronisent automatiquement dès que la connexion revient.",
      },
    ],
  },
  {
    id: "equipe",
    icon: Users,
    title: "Équipe & sécurité",
    items: [
      {
        q: "Qu'est-ce qu'un employé peut / ne peut pas faire ?",
        a: "Un employé peut ajouter des écritures, gérer le stock, enregistrer des crédits et importer un CSV. Il ne peut pas supprimer d'écritures, changer les paramètres de l'entreprise, ni voir les chiffres globaux — seulement les siens.",
      },
      {
        q: "J'ai oublié mon mot de passe, comment faire ?",
        a: "Sur l'écran de connexion, cliquez sur « Mot de passe oublié ? ». Vous recevez un code par email, que vous entrez avec votre nouveau mot de passe.",
      },
    ],
  },
  {
    id: "support",
    icon: MessageCircle,
    title: "Support",
    items: [
      {
        q: "Comment contacter le support ?",
        a: "Cliquez sur l'icône de message en haut du tableau de bord pour échanger directement avec l'équipe Ridix, sans quitter l'application.",
      },
    ],
  },
];

export default function UserGuide({ onClose }) {
  const [openId, setOpenId] = useState(SECTIONS[0].id);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[250] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 mb-6">
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-serif text-xl font-bold">R</div>
          <h1 className="font-serif text-2xl text-slate-50">Guide d'utilisation</h1>
        </div>
        <p className="text-sm text-slate-400 mb-8">Toutes les fonctionnalités de Ridix, expliquées simplement.</p>

        <div className="space-y-3 mb-10">
          {SECTIONS.map((section) => {
            const isOpen = openId === section.id;
            return (
              <div key={section.id} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                <button
                  onClick={() => setOpenId(isOpen ? null : section.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="flex items-center gap-2.5 font-serif text-slate-100">
                    <section.icon size={16} className="text-amber-400 shrink-0" /> {section.title}
                  </span>
                  <ChevronDown size={16} className={`text-slate-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-3">
                    {section.items.map((item) => (
                      <div key={item.q}>
                        <p className="text-sm text-slate-200 font-medium mb-1">{item.q}</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium rounded-md py-2.5 text-sm mb-6">
          Retour à l'application
        </button>
      </div>
    </div>
  );
}
