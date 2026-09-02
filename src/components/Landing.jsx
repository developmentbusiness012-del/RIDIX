import { motion } from "framer-motion";
import {
  Ship, Package, Store, Wallet, TrendingUp, LineChart, Landmark,
  UploadCloud, Users, MessageCircle, Building2, Check, ArrowRight, ShieldCheck,
  Boxes, HandCoins, Lock, Sparkles, FileText, Crown, Eye, WifiOff, Sprout, Gauge, Scale, FolderLock,
} from "lucide-react";
import { PLANS, EMPLOYEE_RESTRICTIONS, EMPLOYEE_ALLOWED, DEVISES } from "../constants";
import InstallAppSection from "./InstallAppSection";
import InstallFloatingCTA from "./InstallFloatingCTA";
import LegalDocsModal from "./LegalDocsModal";
import NotificationOptIn from "./NotificationOptIn";
import { GrowthIllustration } from "./LandingIllustrations";
import { Reveal, LiveCompanyCounter } from "./LandingMotion";
import { useState } from "react";

const FEATURES = [
  { icon: Gauge, title: "Santé financière en un coup d'œil", desc: "Score de préparation au financement et alertes automatiques : trésorerie, créances, marge, dettes.", premium: true },
  { icon: LineChart, title: "Compte de résultat & cash-flow", desc: "CA, marge brute, EBITDA, résultat net et cash-flow (historique + prévisionnel 3 scénarios) générés automatiquement.", premium: true },
  { icon: Landmark, title: "Capacité de remboursement (DSCR)", desc: "Un indicateur indicatif de votre capacité de service de la dette, pour préparer votre demande avant de la déposer.", premium: true },
  { icon: FileText, title: "Dossier de financement bancable", desc: "Ratios, endettement, projet à financer, ROI attendu : un PDF prêt à présenter à une banque ou une IMF.", premium: true },
  { icon: Wallet, title: "Tableaux de bord en temps réel", desc: "CA, dépenses, profit et marge — au jour, à la semaine, au mois ou à l'année." },
  { icon: Scale, title: "Bilan simplifié", desc: "Actifs, passifs et patrimoine net calculés automatiquement — dès l'offre gratuite." },
  { icon: FolderLock, title: "Data Room sécurisée", desc: "Centralisez vos documents légaux, fiscaux et financiers — dès l'offre gratuite." },
  { icon: Boxes, title: "Gestion des stocks", desc: "Suivez vos quantités et recevez une alerte dès qu'un article approche de la rupture.", premium: true },
  { icon: HandCoins, title: "Crédits & dettes", desc: "Ventes à crédit clients, dettes fournisseurs, paiements partiels — sous contrôle.", premium: true },
  { icon: TrendingUp, title: "Multi-devises natif", desc: `${DEVISES.join(", ")}… converties automatiquement dans votre devise de référence.` },
  { icon: UploadCloud, title: "Import CSV en masse", desc: "Importez vos écritures existantes en quelques secondes." },
  { icon: Users, title: "Équipe avec suivi individuel", desc: "Chaque employé ne voit que ses chiffres ; vous voyez tout, nom par nom.", premium: true },
  { icon: WifiOff, title: "Fonctionne hors connexion", desc: "Enregistrez vos écritures même sans réseau — ça se synchronise tout seul." },
];

const PIPELINE = [
  { icon: Wallet, title: "Vous saisissez", desc: "Ventes, achats, stock, crédits — en quelques secondes, avec ou sans connexion." },
  { icon: Gauge, title: "RIDIX analyse", desc: "Compte de résultat, bilan, cash-flow et score de santé financière recalculés en continu." },
  { icon: Landmark, title: "Vous évaluez votre solidité", desc: "Endettement global, DSCR indicatif, ratios : vous savez où vous en êtes avant de frapper à une porte." },
  { icon: FileText, title: "Vous vous présentez financé", desc: "Un dossier de financement complet, généré en un clic, prêt pour votre banque ou votre IMF." },
];

export default function Landing({ onEnter }) {
  const [showLegal, setShowLegal] = useState(null);

  return (
    <div id="top" className="min-h-screen bg-cream text-ink font-sans overflow-x-hidden">
      {/* ---------- Nav ---------- */}
      <header className="sticky top-0 z-30 bg-cream/80 backdrop-blur-md border-b border-ink/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-md bg-ink text-gold-bright flex items-center justify-center font-serif text-lg font-bold shrink-0">R</div>
            <span className="font-serif text-base sm:text-lg text-ink tracking-tight whitespace-nowrap">RIDIX</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-ink/60 font-medium">
            <a href="#fonctionnalites" className="hover:text-ink transition-colors">Fonctionnalités</a>
            <a href="#equipe" className="hover:text-ink transition-colors">Équipe</a>
            <a href="#offres" className="hover:text-ink transition-colors">Offres</a>
            <a href="#app" className="hover:text-ink transition-colors">Application</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button onClick={() => onEnter("signin")} className="text-xs sm:text-sm text-ink/70 hover:text-ink px-2 sm:px-3 py-2 font-medium whitespace-nowrap">
              Connexion
            </button>
            <button onClick={() => onEnter("signup")} className="text-xs sm:text-sm bg-ink hover:bg-ink/90 text-white font-semibold rounded-full px-4 sm:px-5 py-2.5 transition-all whitespace-nowrap shadow-lg shadow-ink/10 hover:shadow-xl hover:-translate-y-0.5">
              Créer un compte
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative pt-16 sm:pt-20 pb-24 overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-gold/25 blur-[100px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 -right-32 w-[480px] h-[480px] rounded-full bg-forest/20 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-forest bg-forest/10 border border-forest/20 rounded-full px-3 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-bright animate-pulse" />
              Fintech · Intelligence financière PME
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif font-semibold text-[2.6rem] sm:text-6xl text-ink leading-[1.05] mb-6 tracking-tight">
              Pilotez vos finances. <span className="relative inline-block text-forest">
                Devenez finançable.
                <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                  <path d="M0 6 Q50 0 100 5 T200 4" stroke="#D4A017" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-ink/60 text-lg leading-relaxed mb-8 max-w-md">
              RIDIX est la plateforme d'intelligence financière qui aide les PME africaines à piloter leur
              activité, évaluer leur santé financière en temps réel et préparer un dossier de financement
              bancable — sans comptable dédié.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-6">
              <button onClick={() => onEnter("signup")}
                className="group flex items-center gap-2 bg-gradient-to-r from-gold to-gold-bright text-ink font-bold rounded-full px-7 py-4 text-[15px] shadow-xl shadow-gold/30 hover:shadow-2xl hover:shadow-gold/40 hover:-translate-y-1 transition-all">
                Créer mon compte gratuit
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById("comment")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 text-ink/70 hover:text-ink font-medium rounded-full px-6 py-4 text-[15px] border border-ink/10 hover:border-ink/25 transition-colors">
                Voir comment ça marche
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.45 }}
              className="flex items-center gap-3 text-sm text-ink/50">
              <span className="font-mono">
                <LiveCompanyCounter className="font-semibold text-ink text-base" /> entreprises créées sur RIDIX
              </span>
              <span className="w-1 h-1 rounded-full bg-ink/20" />
              <span>Gratuit pour démarrer</span>
            </motion.div>
          </div>

          {/* ---------- Téléphone 3D ---------- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -25 }}
            animate={{ opacity: 1, scale: 1, rotateY: -12 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            style={{ perspective: 1200 }}
            className="relative flex justify-center lg:justify-end"
          >
            <motion.div
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: [-12, -8, -12], rotateX: [4, 6, 4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="w-64 h-[520px] rounded-[2.5rem] bg-ink border-[6px] border-ink shadow-2xl shadow-ink/30 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl z-20" />
                <div className="h-full bg-gradient-to-b from-ink to-[#1a2c47] p-4 pt-8">
                  <p className="font-mono text-[9px] text-gold-bright uppercase tracking-widest mb-1">Maison de Négoce Douala</p>
                  <p className="font-serif text-white text-lg mb-4">Bon retour 👋</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/10 rounded-lg p-2.5"><p className="text-[9px] text-white/50 font-mono uppercase">Recettes</p><p className="font-mono text-emerald-400 text-sm">+2 450 000</p></div>
                    <div className="bg-white/10 rounded-lg p-2.5"><p className="text-[9px] text-white/50 font-mono uppercase">Profit</p><p className="font-mono text-gold-bright text-sm">1 890 000</p></div>
                  </div>
                  <div className="bg-white/[0.07] rounded-lg p-3 space-y-2">
                    {["Vente locale", "Import textile", "Export cacao"].map((t, i) => (
                      <div key={t} className="flex items-center justify-between text-[11px]">
                        <span className="text-white/70">{t}</span>
                        <span className={i === 1 ? "text-rose-400 font-mono" : "text-emerald-400 font-mono"}>{i === 1 ? "-" : "+"}{(i + 2) * 350}k</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ transform: "translateZ(60px)" }}
                className="absolute -left-16 top-16 bg-white rounded-xl shadow-2xl shadow-ink/20 px-4 py-3 border border-ink/5"
              >
                <p className="text-[9px] text-ink/40 font-mono uppercase mb-0.5">Préparation au financement</p>
                <p className="font-serif text-2xl text-forest font-semibold">86<span className="text-xs text-ink/30">/100</span></p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                style={{ transform: "translateZ(80px)" }}
                className="absolute -right-10 bottom-24 bg-white rounded-xl shadow-2xl shadow-ink/20 px-4 py-3 border border-ink/5 flex items-center gap-2"
              >
                <Boxes size={16} className="text-gold" />
                <div>
                  <p className="text-[9px] text-ink/40 font-mono uppercase">Stock</p>
                  <p className="font-mono text-sm text-ink font-semibold">Synchronisé</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <Reveal>
        <div className="border-y border-ink/5 bg-white/60 py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap gap-x-10 gap-y-3 justify-center text-sm text-ink/50">
            <span className="flex items-center gap-2"><Gauge size={15} className="text-forest" /> Score de santé financière</span>
            <span className="flex items-center gap-2"><FileText size={15} className="text-forest" /> Dossier de financement inclus</span>
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-forest" /> Données sécurisées</span>
            <span className="flex items-center gap-2"><WifiOff size={15} className="text-forest" /> Fonctionne hors ligne</span>
          </div>
        </div>
      </Reveal>

      {/* ---------- Ancré dans le commerce africain ---------- */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Reveal>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest">Pensé ici, pour ici</span>
          <h2 className="font-serif font-semibold text-2xl sm:text-3xl text-ink mt-3 mb-4">
            Construit pour le commerce africain — pas adapté après coup.
          </h2>
          <p className="text-ink/60 text-[15px] leading-relaxed mb-4">
            Du marché de Douala aux comptoirs d'import-export, RIDIX parle la langue du commerce local dès le
            départ : FCFA en devise de référence, profils import/export natifs, une interface qui fonctionne même
            avec une connexion capricieuse.
          </p>
          <p className="text-ink/60 text-[15px] leading-relaxed">
            Et quand vient le moment de solliciter une banque ou une institution de microfinance locale, votre
            dossier parle déjà leur langage : ratios, cash-flow, capacité de remboursement.
          </p>
        </Reveal>
      </section>

      {/* ---------- Fonctionnalités ---------- */}
      <section id="fonctionnalites" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <Reveal className="text-center mb-14">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest">Fonctionnalités</span>
          <h2 className="font-serif font-semibold text-3xl sm:text-4xl text-ink mt-3 mb-3">De la gestion quotidienne à la préparation au financement</h2>
          <p className="text-ink/50 text-[15px] max-w-xl mx-auto">
            Que vous vendiez au comptoir, importiez des conteneurs ou exportiez vos produits, RIDIX pilote vos
            chiffres au quotidien — et les transforme en dossier bancable quand vous en avez besoin.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 0.06}>
              <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }}
                className="relative bg-white rounded-2xl p-5 h-full border border-ink/5 shadow-sm hover:shadow-xl hover:shadow-ink/5 transition-shadow">
                {f.premium && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 text-[9px] uppercase tracking-wide text-gold bg-gold/10 border border-gold/25 rounded-full px-1.5 py-0.5">
                    <Lock size={9} /> Premium
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-forest/10 flex items-center justify-center mb-4">
                  <f.icon size={18} className="text-forest" />
                </div>
                <h3 className="font-serif text-[15px] text-ink mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-ink/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Comment ça marche ---------- */}
      <section id="comment" className="relative bg-ink py-20 overflow-hidden">
        <motion.div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gold/10 blur-[100px]"
          animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-14">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-bright">Comment ça marche</span>
            <h2 className="font-serif font-semibold text-3xl sm:text-4xl text-white mt-3 mb-3">De vos écritures à votre dossier bancable</h2>
            <p className="text-white/50 text-[15px] max-w-xl mx-auto">RIDIX ne se contente pas d'enregistrer vos chiffres — il les transforme en preuve de solidité financière.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PIPELINE.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="border-t-2 border-gold/40 pt-6 h-full">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center mb-3">
                    <s.icon size={16} className="text-gold-bright" />
                  </div>
                  <span className="font-mono text-xs text-gold-bright/50">0{i + 1}</span>
                  <h3 className="font-serif text-lg text-white mt-1 mb-2">{s.title}</h3>
                  <p className="text-[13px] text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Profils ---------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <Reveal className="text-center mb-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest">Avantages</span>
          <h2 className="font-serif font-semibold text-3xl sm:text-4xl text-ink mt-3">Un seul outil, tous les profils</h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: Store, title: "Commerçant local", desc: "Suivez vos ventes et dépenses courantes, sans complexité inutile." },
            { icon: Package, title: "Importateur", desc: "Coûts d'achat, douane, transport et marges à l'unité près." },
            { icon: Ship, title: "Exportateur", desc: "Ventes à l'international en devises multiples, converties automatiquement." },
          ].map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <motion.div whileHover={{ y: -6 }} className="border border-ink/8 rounded-2xl p-7 bg-white text-center shadow-sm hover:shadow-xl transition-shadow h-full">
                <div className="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center mx-auto mb-4">
                  <p.icon size={22} className="text-forest" />
                </div>
                <h3 className="font-serif text-base text-ink mb-2">{p.title}</h3>
                <p className="text-[13px] text-ink/50 leading-relaxed">{p.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Système Responsable-Employé ---------- */}
      <section id="equipe" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <Reveal className="text-center mb-14">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest">Gestion d'équipe</span>
          <h2 className="font-serif font-semibold text-3xl sm:text-4xl text-ink mt-3 mb-3">Une équipe, sans jamais perdre le contrôle</h2>
          <p className="text-ink/50 text-[15px] max-w-xl mx-auto">
            Chacun saisit ses propres opérations, mais seul vous avez la vue d'ensemble — et le détail, employé par employé.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <Reveal>
            <div className="border-2 border-gold/40 bg-gradient-to-br from-gold/5 to-transparent rounded-2xl p-7 h-full">
              <div className="flex items-center gap-2.5 mb-4">
                <Crown size={18} className="text-gold" />
                <h3 className="font-serif text-lg text-ink">Vous, le responsable</h3>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm text-ink/70"><Check size={15} className="text-forest mt-0.5 shrink-0" /> Invitez chaque employé via un code unique</li>
                <li className="flex items-start gap-2 text-sm text-ink/70"><Check size={15} className="text-forest mt-0.5 shrink-0" /> Consultez les chiffres globaux de l'entreprise</li>
                <li className="flex items-start gap-2 text-sm text-ink/70"><Check size={15} className="text-forest mt-0.5 shrink-0" /> Cliquez sur un nom pour voir <strong className="text-ink">ses propres ventes et dépenses</strong></li>
                <li className="flex items-start gap-2 text-sm text-ink/70"><Check size={15} className="text-forest mt-0.5 shrink-0" /> Retirez un accès à tout moment</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="border border-ink/8 bg-white rounded-2xl p-7 h-full">
              <div className="flex items-center gap-2.5 mb-4">
                <Users size={18} className="text-ink/40" />
                <h3 className="font-serif text-lg text-ink">Vos employés</h3>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm text-ink/70"><Check size={15} className="text-forest mt-0.5 shrink-0" /> Enregistrent ventes, dépenses, stock et crédits</li>
                <li className="flex items-start gap-2 text-sm text-ink/70"><Check size={15} className="text-forest mt-0.5 shrink-0" /> Ne voient <strong className="text-ink">que leurs propres écritures</strong></li>
                <li className="flex items-start gap-2 text-sm text-rose-600/80"><Lock size={13} className="mt-1 shrink-0" /> Ne peuvent pas supprimer d'écritures</li>
                <li className="flex items-start gap-2 text-sm text-rose-600/80"><Lock size={13} className="mt-1 shrink-0" /> Aucun accès à la facturation</li>
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div className="flex items-center gap-3 border border-ink/8 bg-white rounded-2xl p-4">
            <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
              <Eye size={16} className="text-gold" />
            </div>
            <p className="text-xs text-ink/60">
              <span className="text-ink font-medium">Nouveau —</span> ouvrez la fiche de performance de n'importe quel employé :
              recettes, dépenses, solde net, marge et historique complet.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ---------- Offres ---------- */}
      <section id="offres" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <Reveal className="text-center mb-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest">Tarifs</span>
          <h2 className="font-serif font-semibold text-3xl sm:text-4xl text-ink mt-3 mb-3">Une offre pour chaque étape de votre croissance</h2>
          <p className="text-ink/50 text-[15px]">Ne perdez plus une vente faute de stock, ni un financement faute de dossier.</p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {PLANS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1}>
              <motion.div whileHover={{ y: -6 }}
                className={`rounded-2xl border p-7 flex flex-col h-full transition-shadow hover:shadow-xl ${p.planKey ? "border-2 border-gold bg-gradient-to-b from-gold/5 to-transparent shadow-lg shadow-gold/10" : "border-ink/8 bg-white"}`}>
                {p.promo && (
                  <span className="inline-block w-fit text-[10px] font-semibold uppercase tracking-wide bg-rose-100 text-rose-600 rounded-full px-2.5 py-1 mb-3">
                    {p.promoLabel}
                  </span>
                )}
                <div className="flex items-baseline justify-between mb-1 gap-2">
                  <h3 className="font-serif font-semibold text-lg text-ink">{p.label}</h3>
                  <span className="text-sm font-mono text-forest text-right shrink-0">
                    {p.originalPrice && <span className="block text-[10px] text-ink/30 line-through">{p.originalPrice}</span>}
                    {p.price}{p.period && <span className="text-ink/40 text-xs"> {p.period}</span>}
                  </span>
                </div>
                <p className="text-xs text-ink/50 mb-5">{p.tagline}</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink/70">
                      <Check size={15} className="text-forest mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => onEnter("signup")}
                  className={`w-full rounded-full py-3 text-sm font-semibold transition-all ${p.planKey ? "bg-gradient-to-r from-gold to-gold-bright text-ink shadow-lg shadow-gold/25 hover:shadow-xl hover:-translate-y-0.5" : "bg-ink/5 hover:bg-ink/10 text-ink"}`}>
                  Commencer avec {p.label}
                </button>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div className="bg-white border border-ink/8 rounded-2xl p-6">
            <h4 className="font-serif text-sm text-ink mb-3 flex items-center gap-2"><ShieldCheck size={15} className="text-gold" /> Accès employé encadré (offre Premium)</h4>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-forest mb-2">Un employé peut</p>
                <ul className="space-y-1">{EMPLOYEE_ALLOWED.map((t) => <li key={t} className="text-xs text-ink/50">• {t}</li>)}</ul>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-rose-500 mb-2">Un employé ne peut pas</p>
                <ul className="space-y-1">{EMPLOYEE_RESTRICTIONS.map((t) => <li key={t} className="text-xs text-ink/40">• {t}</li>)}</ul>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <InstallAppSection />

      {/* ---------- CTA final ---------- */}
      <section className="relative bg-ink py-24 overflow-hidden text-center">
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/10 blur-[130px]"
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 7, repeat: Infinity }} />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <Reveal>
            <GrowthIllustration className="w-44 h-auto mx-auto mb-6" />
            <h2 className="font-serif font-semibold text-3xl sm:text-4xl text-white mb-4">Prêt à devenir finançable ?</h2>
            <p className="text-white/50 text-[15px] mb-8">Rejoignez les <LiveCompanyCounter className="text-gold-bright font-semibold" /> entreprises qui pilotent déjà leurs finances et préparent leur financement sur RIDIX — gratuit, sans engagement, en moins d'une minute.</p>
            <button onClick={() => onEnter("signup")}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-bright text-ink font-bold rounded-full px-8 py-4 text-[15px] shadow-2xl shadow-gold/20 hover:-translate-y-1 transition-all">
              Créer mon compte gratuitement
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-ink/5 py-8 text-center text-xs text-ink/40 font-mono">
        <p className="mb-2">RIDIX — la plateforme d'intelligence financière des PME africaines.</p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setShowLegal("cgu")} className="hover:text-ink underline">Conditions d'utilisation</button>
          <button onClick={() => setShowLegal("confidentialite")} className="hover:text-ink underline">Confidentialité</button>
        </div>
      </footer>

      {showLegal && <LegalDocsModal initialTab={showLegal} onClose={() => setShowLegal(null)} />}

      <InstallFloatingCTA />
    </div>
  );
}
