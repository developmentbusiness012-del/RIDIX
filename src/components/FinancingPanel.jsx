import { useState } from "react";
import { Target, Plus, X, Loader2, ShieldAlert, TrendingUp, Boxes, Wrench, Building, Wallet, HelpCircle, ListChecks, ArrowRight, FileText } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatMontant } from "../constants";
import { exportDossierFinancement } from "../exportUtils";
import { PremiumTeaser } from "./StockPanel";
import { ScoreGauge } from "./IntelligencePanel";
import { readinessLabel } from "../financingUtils";

const NEED_TYPES = [
  { id: "fonds_roulement", label: "Fonds de roulement", icon: Wallet },
  { id: "stock", label: "Achat de stock", icon: Boxes },
  { id: "equipement", label: "Équipement", icon: Wrench },
  { id: "immobilier", label: "Immobilier", icon: Building },
  { id: "tresorerie", label: "Trésorerie ponctuelle", icon: TrendingUp },
  { id: "autre", label: "Autre", icon: HelpCircle },
];

// products/credits/assets/liabilities/requests/documents/analysis/readiness/capacity viennent de
// Dashboard.jsx (calculés une seule fois, partagés avec IntelligencePanel — voir la note là-bas).
export default function FinancingPanel({ companyId, plan, deviseBase, transactions, company, products = [], credits = [], assets = [], liabilities = [], requests = [], documents = [], analysis, readiness, capacity, dataLoading, onAddFinancingRequest, onUpgrade, checkoutLoading, onNavigate }) {
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateDossier = async () => {
    setGenerating(true);
    try {
      await exportDossierFinancement(transactions, products, credits, company, analysis, assets, liabilities, requests[0] || null, readiness, documents);
    } finally {
      setGenerating(false);
    }
  };

  const addRequest = async (payload) => {
    const { data, error } = await supabase.from("financing_requests").insert({
      company_id: companyId,
      capacite_indicative_calculee: capacity?.eligible ? capacity.capacite : null,
      ...payload,
    }).select().single();
    if (!error && data) onAddFinancingRequest?.(data);
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

  if (dataLoading || !readiness || !capacity) {
    return <div className="flex items-center gap-2 text-slate-500 text-sm py-10 justify-center"><Loader2 className="animate-spin" size={16} /> Chargement…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-serif text-lg text-slate-50 flex items-center gap-2"><Target size={18} className="text-amber-400" /> Préparer mon financement</h2>
        <div className="flex items-center gap-2">
          <button onClick={generateDossier} disabled={generating}
            className="flex items-center gap-1.5 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-sm rounded-md px-3 py-2 disabled:opacity-60">
            {generating ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Générer mon dossier
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md px-3 py-2">
            <Plus size={15} /> Exprimer un besoin
          </button>
        </div>
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
