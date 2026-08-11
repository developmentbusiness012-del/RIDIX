import {
  Ship, Package, Store, Layers, Wallet, TrendingUp, FileSpreadsheet,
  UploadCloud, Users, MessageCircle, Building2, Check, ArrowRight, ShieldCheck,
  Boxes, HandCoins, Lock, Sparkles, FileText, Crown, Eye, WifiOff,
} from "lucide-react";
import { PLANS, EMPLOYEE_RESTRICTIONS, EMPLOYEE_ALLOWED, DEVISES } from "../constants";
import InstallAppSection from "./InstallAppSection";
import InstallFloatingCTA from "./InstallFloatingCTA";

const FEATURES = [
  {
    icon: Wallet,
    title: "Tableaux de bord financiers globaux",
    desc: "Chiffre d'affaires, dépenses, profit net et marge — au jour, à la semaine, au mois ou à l'année, en temps réel.",
  },
  {
    icon: Boxes,
    title: "Gestion des stocks",
    desc: "Suivez vos quantités produit par produit et recevez une alerte dès qu'un article approche de la rupture.",
    premium: true,
  },
  {
    icon: HandCoins,
    title: "Crédits & dettes",
    desc: "Ventes à crédit clients, dettes fournisseurs, paiements partiels — ne perdez plus jamais le fil d'une créance.",
    premium: true,
  },
  {
    icon: Sparkles,
    title: "Intelligence financière",
    desc: "Score de santé financière, détection d'anomalies et prévision de trésorerie — pour décider avant qu'il ne soit trop tard.",
    premium: true,
  },
  {
    icon: FileText,
    title: "Dossier de financement",
    desc: "Un document professionnel prêt à partager avec une banque ou un investisseur : historique, indicateurs de fiabilité, projections.",
    premium: true,
  },
  {
    icon: Layers,
    title: "Adapté à tous les profils",
    desc: "Commerçant local, importateur, exportateur ou mixte : chaque écriture est taguée par profil pour une vision claire de chaque activité.",
  },
  {
    icon: TrendingUp,
    title: "Multi-devises intégré",
    desc: `Saisissez vos opérations en ${DEVISES.join(", ")}… et suivez tout converti dans votre devise de référence.`,
  },
  {
    icon: UploadCloud,
    title: "Import CSV en masse",
    desc: "Importez vos écritures existantes en quelques secondes grâce à un modèle prêt à l'emploi.",
  },
  {
    icon: FileSpreadsheet,
    title: "Exports Excel & PDF",
    desc: "Générez des rapports professionnels pour votre comptable ou vos partenaires en un clic.",
  },
  {
    icon: Building2,
    title: "Plusieurs entreprises, un seul compte",
    desc: "Gérez jusqu'à 2 entreprises en Freemium, ou un nombre illimité en Premium.",
  },
  {
    icon: Users,
    title: "Équipe avec suivi individuel",
    desc: "Invitez vos employés via un code unique. Chacun ne voit que ses propres chiffres — vous, vous voyez la performance de chacun, nom par nom.",
    premium: true,
  },
  {
    icon: WifiOff,
    title: "Fonctionne hors connexion",
    desc: "Ouvrez l'app et enregistrez vos écritures même sans réseau — tout se synchronise automatiquement dès que la connexion revient.",
  },
  {
    icon: MessageCircle,
    title: "Messagerie intégrée",
    desc: "Échangez remarques et suggestions directement avec l'équipe, sans quitter l'application.",
  },
];

const STEPS = [
  { n: "01", title: "Créez votre compte", desc: "Indiquez le nom de votre entreprise. Aucune confirmation par email : l'accès est immédiat." },
  { n: "02", title: "Enregistrez vos écritures", desc: "Ventes, achats, import, export — saisie manuelle ou import CSV, en quelques secondes." },
  { n: "03", title: "Pilotez votre activité", desc: "Suivez votre CA, vos dépenses et votre marge en temps réel, exportez vos rapports quand vous en avez besoin." },
];

const LEDGER_ROWS = [
  { tag: "export", label: "Conteneur cacao — Rotterdam", amount: "+8 200 EUR" },
  { tag: "import", label: "Lot électroménager — Guangzhou", amount: "-15 000 USD" },
  { tag: "local", label: "Ventes boutique — semaine", amount: "+2 450 000 XAF" },
];

const TAG_STYLES = {
  export: "text-forest-bright",
  import: "text-gold-bright",
  local: "text-slate-400",
};

export default function Landing({ onEnter }) {
  return (
    <div id="top" className="min-h-screen bg-ink text-slate-100 font-sans">
      {/* ---------- Nav ---------- */}
      <header className="border-b border-white/10 sticky top-0 bg-ink/90 backdrop-blur z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
            <div className="w-8 h-8 rounded-md bg-gold text-ink flex items-center justify-center font-serif text-lg font-bold shrink-0">R</div>
            <span className="font-serif text-base sm:text-lg text-slate-50 tracking-tight whitespace-nowrap">RIDIX</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#fonctionnalites" className="hover:text-slate-100">Fonctionnalités</a>
            <a href="#equipe" className="hover:text-slate-100">Équipe</a>
            <a href="#offres" className="hover:text-slate-100">Offres</a>
            <a href="#comment" className="hover:text-slate-100">Comment ça marche</a>
            <a href="#app" className="hover:text-slate-100">Application</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button onClick={() => onEnter("signin")} className="text-xs sm:text-sm text-slate-300 hover:text-slate-50 px-2 sm:px-3 py-2 whitespace-nowrap">
              Connexion
            </button>
            <button onClick={() => onEnter("signup")} className="text-xs sm:text-sm bg-gold hover:bg-gold-bright text-ink font-semibold rounded-md px-3 sm:px-4 py-2 transition-colors whitespace-nowrap">
              Créer un compte
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest-bright border border-forest/40 bg-forest/10 rounded-full px-3 py-1">
            Commerçants · Importateurs · Exportateurs
          </span>
          <h1 className="font-serif font-semibold text-4xl sm:text-5xl text-slate-50 leading-[1.08] mt-5 mb-5">
            Votre grand livre, tenu au franc près — quel que soit votre commerce.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md">
            Un registre pensé pour le commerce local comme pour le négoce international : suivez votre chiffre d'affaires,
            vos dépenses et votre marge, gérez plusieurs devises et plusieurs entreprises, le tout depuis un seul tableau de bord.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onEnter("signup")} className="flex items-center gap-2 bg-gold hover:bg-gold-bright text-ink font-semibold rounded-md px-5 py-3 text-sm transition-colors">
              Créer mon compte gratuitement <ArrowRight size={16} />
            </button>
            <button onClick={() => onEnter("employee")} className="flex items-center gap-2 border border-white/15 hover:border-white/30 text-slate-300 rounded-md px-5 py-3 text-sm transition-colors">
              <Users size={15} /> Rejoindre en tant qu'employé
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-4 font-mono">Aucune carte bancaire requise · Accès immédiat, sans confirmation d'email.</p>
        </div>

        {/* Aperçu visuel type "grand livre" */}
        <div className="border border-white/10 rounded-xl bg-white/[0.03] overflow-hidden shadow-2xl shadow-black/40">
          <div className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <span>Maison de Négoce Douala</span>
            <span className="text-forest-bright flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-bright inline-block" /> en ligne
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4">
            <PreviewKpi label="Chiffre d'affaires" value="8 450 000 XAF" tone="forest" />
            <PreviewKpi label="Dépenses" value="5 120 000 XAF" tone="rose" />
            <PreviewKpi label="Profit net" value="3 330 000 XAF" tone="gold" />
            <PreviewKpi label="Marge" value="39,4 %" tone="indigo" />
          </div>
          <div className="px-4 pb-4 space-y-2">
            {LEDGER_ROWS.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs bg-white/[0.04] rounded-md px-3 py-2.5">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className={`uppercase font-mono text-[10px] ${TAG_STYLES[row.tag]}`}>{row.tag}</span>
                  {row.label}
                </span>
                <span className={`font-mono ${row.amount.startsWith("+") ? "text-forest-bright" : "text-rose-400"}`}>{row.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Fonctionnalités ---------- */}
      <section id="fonctionnalites" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/10">
        <div className="text-center mb-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-bright">Fonctionnalités</span>
          <h2 className="font-serif font-semibold text-3xl text-slate-50 mt-3 mb-3">Tout ce qu'il faut pour piloter votre activité</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Que vous vendiez au comptoir, importiez des conteneurs ou exportiez vos produits, le registre s'adapte à votre réalité.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className={`relative bg-white/[0.03] border rounded-lg p-5 transition-colors ${f.premium ? "border-gold/30 hover:border-gold/50" : "border-white/10 hover:border-gold/30"}`}>
              {f.premium && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] uppercase tracking-wide text-gold-bright bg-gold/10 border border-gold/30 rounded-full px-1.5 py-0.5">
                  <Lock size={9} /> Premium
                </span>
              )}
              <f.icon size={20} className="text-gold-bright mb-3" />
              <h3 className="font-serif text-sm text-slate-100 mb-1.5">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Bandeau incitatif Premium ---------- */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="border border-gold/25 bg-gradient-to-r from-gold/5 to-transparent rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-gold-bright bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5 mb-3">
              🔥 Offre de lancement
            </span>
            <h3 className="font-serif text-lg text-slate-50 mb-1">Stock, crédits & équipe illimitée dès 5 000 FCFA</h3>
            <p className="text-sm text-slate-400 max-w-md">Ne perdez plus une vente faute de stock, ni une créance client oubliée. Passez en Premium et pilotez tout votre commerce, pas seulement vos comptes.</p>
          </div>
          <button onClick={() => onEnter("signup")} className="shrink-0 bg-gold hover:bg-gold-bright text-ink font-semibold rounded-md px-5 py-2.5 text-sm transition-colors whitespace-nowrap">
            Essayer Premium
          </button>
        </div>
      </section>

      {/* ---------- Profils ---------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/10">
        <div className="text-center mb-10">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-bright">Avantages</span>
          <h2 className="font-serif font-semibold text-3xl text-slate-50 mt-3">Un seul outil, tous les profils de commerçants</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <ProfileCard icon={Store} title="Commerçant local" desc="Suivez vos ventes et dépenses courantes, sans complexité inutile." />
          <ProfileCard icon={Package} title="Importateur" desc="Suivez vos coûts d'achat, douane, transport et marges à l'unité près." />
          <ProfileCard icon={Ship} title="Exportateur" desc="Pilotez vos ventes à l'international en devises multiples, converties automatiquement." />
        </div>
      </section>

      {/* ---------- Comment ça marche ---------- */}
      <section id="comment" className="bg-white/[0.02] border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-bright">Comment ça marche</span>
            <h2 className="font-serif font-semibold text-3xl text-slate-50 mt-3">Opérationnel en trois étapes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-2 border-gold/40 pt-5">
                <span className="font-mono text-3xl text-gold-bright/50">{s.n}</span>
                <h3 className="font-serif text-lg text-slate-100 mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Système Responsable-Employé ---------- */}
      <section id="equipe" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/10">
        <div className="text-center mb-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-bright">Gestion d'équipe</span>
          <h2 className="font-serif font-semibold text-3xl text-slate-50 mt-3 mb-3">Une équipe, sans jamais perdre le contrôle</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Ajoutez vos vendeurs ou assistants en toute confiance : chacun saisit ses propres opérations,
            mais seul vous avez la vue d'ensemble — et le détail, employé par employé.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <div className="border border-gold/25 bg-gold/5 rounded-lg p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Crown size={18} className="text-gold-bright" />
              <h3 className="font-serif text-lg text-slate-50">Vous, le responsable</h3>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-slate-300"><Check size={15} className="text-gold-bright mt-0.5 shrink-0" /> Invitez chaque employé via un code entreprise unique</li>
              <li className="flex items-start gap-2 text-sm text-slate-300"><Check size={15} className="text-gold-bright mt-0.5 shrink-0" /> Consultez les chiffres globaux de toute l'entreprise</li>
              <li className="flex items-start gap-2 text-sm text-slate-300"><Check size={15} className="text-gold-bright mt-0.5 shrink-0" /> Cliquez sur le nom d'un employé pour voir <strong className="text-slate-100">ses propres ventes, dépenses et marge</strong></li>
              <li className="flex items-start gap-2 text-sm text-slate-300"><Check size={15} className="text-gold-bright mt-0.5 shrink-0" /> Retirez un accès à tout moment, en un clic</li>
            </ul>
          </div>

          <div className="border border-white/10 bg-white/[0.03] rounded-lg p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Users size={18} className="text-slate-400" />
              <h3 className="font-serif text-lg text-slate-50">Vos employés</h3>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-slate-300"><Check size={15} className="text-forest-bright mt-0.5 shrink-0" /> Enregistrent ventes, dépenses, stock et crédits au quotidien</li>
              <li className="flex items-start gap-2 text-sm text-slate-300"><Check size={15} className="text-forest-bright mt-0.5 shrink-0" /> Ne voient <strong className="text-slate-100">que leurs propres écritures</strong> — jamais les chiffres globaux</li>
              <li className="flex items-start gap-2 text-sm text-rose-300/80"><Lock size={13} className="mt-1 shrink-0" /> Ne peuvent ni supprimer d'écritures ni modifier les paramètres</li>
              <li className="flex items-start gap-2 text-sm text-rose-300/80"><Lock size={13} className="mt-1 shrink-0" /> Aucun accès à l'abonnement ni aux réglages de facturation</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3 border border-white/10 bg-white/[0.03] rounded-lg p-4">
          <div className="w-9 h-9 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Eye size={16} className="text-gold-bright" />
          </div>
          <p className="text-xs text-slate-400">
            <span className="text-slate-100 font-medium">Nouveau —</span> dans Paramètres, cliquez sur le nom de n'importe quel employé pour ouvrir sa fiche
            de performance individuelle : recettes, dépenses, solde net, marge et son historique d'écritures.
          </p>
        </div>
      </section>

      {/* ---------- Offres ---------- */}
      <section id="offres" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-b border-white/10">
        <div className="text-center mb-10">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-bright">Tarifs</span>
          <h2 className="font-serif font-semibold text-3xl text-slate-50 mt-3 mb-3">Une offre pour chaque étape de votre croissance</h2>
          <p className="text-slate-400 text-sm">Commencez gratuitement, passez à Premium quand votre équipe grandit.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {PLANS.map((p) => (
            <div key={p.id} className={`rounded-lg border p-6 flex flex-col ${p.planKey ? "border-gold bg-gold/5" : "border-white/10 bg-white/[0.03]"}`}>
              {p.promo && (
                <span className="inline-block w-fit text-[10px] font-semibold uppercase tracking-wide bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-full px-2 py-0.5 mb-2">
                  {p.promoLabel}
                </span>
              )}
              <div className="flex items-baseline justify-between mb-1 gap-2">
                <h3 className="font-serif font-semibold text-lg text-slate-50">{p.label}</h3>
                <span className="text-sm font-mono text-gold-bright text-right shrink-0">
                  {p.originalPrice && <span className="block text-[10px] text-slate-600 line-through">{p.originalPrice}</span>}
                  {p.price}{p.period && <span className="text-slate-500 text-xs"> {p.period}</span>}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">{p.tagline}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check size={15} className="text-forest-bright mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onEnter("signup")}
                className={`w-full rounded-md py-2.5 text-sm font-semibold transition-colors ${p.planKey ? "bg-gold hover:bg-gold-bright text-ink" : "bg-white/10 hover:bg-white/15 text-slate-100"}`}
              >
                Commencer avec {p.label}
              </button>
            </div>
          ))}
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5">
          <h4 className="font-serif text-sm text-slate-100 mb-3 flex items-center gap-2"><ShieldCheck size={15} className="text-gold-bright" /> Accès employé encadré (offre Premium)</h4>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-forest-bright mb-2">Un employé peut</p>
              <ul className="space-y-1">
                {EMPLOYEE_ALLOWED.map((t) => <li key={t} className="text-xs text-slate-400">• {t}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-rose-400 mb-2">Un employé ne peut pas</p>
              <ul className="space-y-1">
                {EMPLOYEE_RESTRICTIONS.map((t) => <li key={t} className="text-xs text-slate-500">• {t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <InstallAppSection />

      {/* ---------- CTA final ---------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="font-serif font-semibold text-3xl text-slate-50 mb-3">Prêt à voir clair dans vos finances ?</h2>
        <p className="text-slate-400 text-sm mb-6">Créez votre compte en moins d'une minute, sans engagement.</p>
        <button onClick={() => onEnter("signup")} className="inline-flex items-center gap-2 bg-gold hover:bg-gold-bright text-ink font-semibold rounded-md px-6 py-3 text-sm transition-colors">
          Créer mon compte gratuitement <ArrowRight size={16} />
        </button>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-600 font-mono">
        RIDIX — pensé pour les commerçants, importateurs et exportateurs.
      </footer>

      <InstallFloatingCTA />
    </div>
  );
}

function PreviewKpi({ label, value, tone }) {
  const colors = { forest: "border-l-forest-bright", rose: "border-l-rose-400", gold: "border-l-gold-bright", indigo: "border-l-indigo-400" };
  return (
    <div className={`bg-white/[0.04] border-l-4 ${colors[tone]} rounded-md p-3`}>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-mono">{label}</p>
      <p className="font-mono text-sm text-slate-100">{value}</p>
    </div>
  );
}

function ProfileCard({ icon: Icon, title, desc }) {
  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.03] text-center">
      <Icon size={22} className="text-gold-bright mx-auto mb-3" />
      <h3 className="font-serif text-base text-slate-100 mb-2">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
