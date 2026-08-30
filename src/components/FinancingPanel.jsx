import { useState, useEffect, useMemo } from "react";
import { Target, Plus, X, Loader2, ShieldAlert, TrendingUp, Boxes, Wrench, Building, Wallet, HelpCircle, ListChecks, ArrowRight } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatMontant } from "../constants";
import { PremiumTeaser } from "./StockPanel";
import { computeAnalysis, ScoreGauge } from "./IntelligencePanel";

const NEED_TYPES = [
  { id: "fonds_roulement", label: "Fonds de roulement", icon: Wallet },
  { id: "stock", label: "Achat de stock", icon: Boxes },
  { id: "equipement", label: "Équipement", icon: Wrench },
  { id: "immobilier", label: "Immobilier", icon: Building },
  { id: "tresorerie", label: "Trésorerie ponctuelle", icon: TrendingUp },
  { id: "autre", label: "Autre", icon: HelpCircle },
];

// Calcule une capacité financière indicative — jamais une décision de crédit.
// Méthode : flux net moyen mensuel (6 derniers mois) x 6, réduit par le poids de l'endettement actuel.
function computeCapacity(transactions, dettesOuvertesTotal) {
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
function computeReadiness({ healthScore, transactions, products, assets, liabilities, credits, financingRequests, debtRatio }) {
  const items = [];

  // 1. Santé financière (reflète le RIDIX Score)
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

  // 2. Historique de données
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

  // 3. Qualité des données structurelles
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

  // 4. Endettement maîtrisé
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

  // 5. Projet de financement clarifié
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

function readinessLabel(score) {
  if (score >= 80) return "Dossier prêt — vous pouvez aborder une institution financière en confiance.";
  if (score >= 60) return "Bien engagé — quelques points à renforcer avant de présenter votre dossier.";
  if (score >= 40) return "En construction — plusieurs éléments clés manquent encore.";
  return "Trop tôt pour se présenter — concentrez-vous d'abord sur les fondations.";
}

export default function FinancingPanel({ companyId, plan, deviseBase, transactions, onUpgrade, checkoutLoading, onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [credits, setCredits] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [products, setProducts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (plan !== "premium" || !companyId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [{ data: reqs }, { data: cred }, { data: liab }, { data: prods }, { data: ast }] = await Promise.all([
        supabase.from("financing_requests").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
        supabase.from("credits").select("*").eq("company_id", companyId),
        supabase.from("liabilities").select("*").eq("company_id", companyId),
        supabase.from("products").select("*").eq("company_id", companyId),
        supabase.from("assets").select("*").eq("company_id", companyId),
      ]);
      setRequests(reqs || []);
      setCredits(cred || []);
      setLiabilities(liab || []);
      setProducts(prods || []);
      setAssets(ast || []);
      setLoading(false);
    })();
  }, [companyId, plan]);

  const dettesOuvertesTotal = useMemo(() => {
    const dettesCommerciales = (credits || []).filter((c) => c.type === "fournisseur" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
    const passifsFinanciers = (liabilities || []).filter((l) => l.statut === "actif").reduce((s, l) => s + (Number(l.montant) - Number(l.montant_rembourse)), 0);
    return dettesCommerciales + passifsFinanciers;
  }, [credits, liabilities]);

  const capacity = useMemo(() => computeCapacity(transactions, dettesOuvertesTotal), [transactions, dettesOuvertesTotal]);

  const analysis = useMemo(() => computeAnalysis(transactions, products, credits, deviseBase), [transactions, products, credits, deviseBase]);
  const readiness = useMemo(
    () => computeReadiness({ healthScore: analysis.score, transactions, products, assets, liabilities, credits, financingRequests: requests, debtRatio: capacity.debtRatio ?? 0 }),
    [analysis.score, transactions, products, assets, liabilities, credits, requests, capacity.debtRatio]
  );

  const addRequest = async (payload) => {
    const { data, error } = await supabase.from("financing_requests").insert({
      company_id: companyId,
      capacite_indicative_calculee: capacity.eligible ? capacity.capacite : null,
      ...payload,
    }).select().single();
    if (!error && data) setRequests((prev) => [data, ...prev]);
  };

  if (plan !== "premium") {
    return (
      <PremiumTeaser
        icon={Target}
        title="Préparer mon financement"
        pitch="Exprimez votre besoin (fonds de roulement, stock, équipement…) et obtenez une capacité financière indicative basée sur vos vraies données — pour arriver préparé devant votre banque."
        benefits={[
          "Capacité financière indicative calculée automatiquement",
          "Historique de vos besoins de financement exprimés",
          "Base du futur dossier de financement complet",
        ]}
        onUpgrade={onUpgrade}
        loading={checkoutLoading}
      />
    );
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-slate-500 text-sm py-10 justify-center"><Loader2 className="animate-spin" size={16} /> Chargement…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-serif text-lg text-slate-50 flex items-center gap-2"><Target size={18} className="text-amber-400" /> Préparer mon financement</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md px-3 py-2">
          <Plus size={15} /> Exprimer un besoin
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-md p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
        <ScoreGauge score={readiness.score} />
        <div className="flex-1 w-full">
          <h3 className="font-serif text-lg text-slate-50 mb-1">Score de préparation au financement</h3>
          <p className="text-sm text-slate-400 mb-3">{readinessLabel(readiness.score)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {readiness.items.map((i) => (
              <div key={i.id} className="text-xs">
                <p className="text-slate-500">{i.label}</p>
                <p className={`font-mono ${i.ok ? "text-emerald-400" : "text-slate-200"}`}>{i.points}/{i.max}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {readiness.problems.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-5 mb-6">
          <h3 className="font-serif text-base text-slate-50 mb-3 flex items-center gap-2"><ListChecks size={16} className="text-amber-400" /> Problèmes & recommandations</h3>
          <div className="space-y-3">
            {readiness.problems.map((p) => (
              <div key={p.id} className="border border-amber-800/40 bg-amber-950/10 rounded-md px-3 py-2.5">
                <p className="text-xs text-amber-200 mb-1">{p.problem}</p>
                <p className="text-xs text-slate-400 mb-2">{p.recommendation}</p>
                {onNavigate && (
                  <button onClick={() => onNavigate(p.tab)} className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1">
                    {p.tabLabel} <ArrowRight size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-600 mt-3">Chaque action mise à jour recalcule automatiquement le score à votre prochaine visite — pas de case à cocher, juste vos vraies données.</p>
        </div>
      )}

      <div className="mb-3 border border-slate-700 bg-slate-900/80 rounded-md px-4 py-3 flex items-start gap-2.5">
        <ShieldAlert size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Ceci n'est pas une décision de crédit.</strong> RIDIX affiche une capacité <em>indicative</em>,
          calculée à partir de vos données historiques, pour vous aider à préparer votre dossier — la décision finale appartient toujours à l'institution financière.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-md p-5 mb-6">
        <h3 className="font-serif text-base text-slate-50 mb-3">Capacité financière indicative</h3>
        {!capacity.eligible ? (
          <p className="text-sm text-amber-200 bg-amber-950/20 border border-amber-800/40 rounded-md px-3 py-2.5">{capacity.reason}</p>
        ) : (
          <>
            <p className="font-mono text-3xl text-emerald-400 mb-3">{formatMontant(capacity.capacite, deviseBase)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-slate-500">Flux net mensuel moyen</p>
                <p className="font-mono text-slate-300">{formatMontant(capacity.avgMonthlyNet, deviseBase)}</p>
              </div>
              <div>
                <p className="text-slate-500">Sur</p>
                <p className="font-mono text-slate-300">{capacity.monthsWithData} mois de données</p>
              </div>
              <div>
                <p className="text-slate-500">Ajustement endettement</p>
                <p className="font-mono text-slate-300">−{(capacity.debtRatio * 100).toFixed(0)} %</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-3">Méthode : flux net mensuel moyen (6 derniers mois) × 6, réduit selon le poids de vos dettes en cours (fournisseurs + prêts).</p>
          </>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden mb-10">
        <p className="text-xs text-slate-400 uppercase tracking-wide px-4 pt-3 pb-1">Besoins exprimés ({requests.length})</p>
        {requests.length === 0 ? (
          <p className="text-center text-slate-500 text-xs py-8">Aucun besoin exprimé pour l'instant.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {requests.map((r) => {
              const type = NEED_TYPES.find((t) => t.id === r.type_besoin);
              const Icon = type?.icon || HelpCircle;
              return (
                <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={14} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-slate-200">{type?.label || r.type_besoin}</p>
                      <p className="font-mono text-sm text-slate-100 shrink-0">{formatMontant(r.montant_souhaite, r.devise)}</p>
                    </div>
                    {r.description && <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>}
                    <p className="text-[11px] text-slate-600 mt-1">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      {r.capacite_indicative_calculee != null && (
                        <> · capacité indicative au moment de la demande : {formatMontant(r.capacite_indicative_calculee, r.devise)}</>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <RequestForm deviseBase={deviseBase} onClose={() => setShowForm(false)} onSubmit={addRequest} />}
    </div>
  );
}

function RequestForm({ deviseBase, onClose, onSubmit }) {
  const [typeBesoin, setTypeBesoin] = useState("fonds_roulement");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) return;
    setSaving(true);
    await onSubmit({
      type_besoin: typeBesoin,
      montant_souhaite: Number(montant),
      devise: deviseBase,
      description: description.trim() || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-50">Exprimer un besoin de financement</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Type de besoin</label>
            <select value={typeBesoin} onChange={(e) => setTypeBesoin(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100">
              {NEED_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Montant souhaité ({deviseBase})</label>
            <input type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)} required autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Description (optionnel)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Ex : Achat de marchandise pour la période de fêtes…"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 resize-none" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="w-full mt-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
        </button>
      </form>
    </div>
  );
}
