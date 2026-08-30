import { useState, useEffect, useMemo } from "react";
import { Sparkles, AlertTriangle, Loader2, Trophy, Activity, FileText } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatMontant, MOIS_FR, TYPES_OP } from "../constants";
import { exportDossierFinancement } from "../exportUtils";
import { PremiumTeaser } from "./StockPanel";

export default function IntelligencePanel({ companyId, plan, deviseBase, transactions, company, onUpgrade, checkoutLoading }) {
  const [products, setProducts] = useState([]);
  const [credits, setCredits] = useState([]);
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plan !== "premium" || !companyId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: cred }, { data: ast }, { data: liab }] = await Promise.all([
        supabase.from("products").select("*").eq("company_id", companyId),
        supabase.from("credits").select("*").eq("company_id", companyId),
        supabase.from("assets").select("*").eq("company_id", companyId),
        supabase.from("liabilities").select("*").eq("company_id", companyId),
      ]);
      setProducts(prods || []);
      setCredits(cred || []);
      setAssets(ast || []);
      setLiabilities(liab || []);
      setLoading(false);
    })();
  }, [companyId, plan]);

  const analysis = useMemo(() => computeAnalysis(transactions, products, credits, deviseBase), [transactions, products, credits, deviseBase]);

  if (plan !== "premium") {
    return (
      <PremiumTeaser
        icon={Sparkles}
        title="Intelligence financière"
        pitch="Un score de santé financière, la détection automatique d'anomalies et une prévision de trésorerie — pour décider avant qu'il ne soit trop tard."
        benefits={[
          "Score de santé financière sur 100",
          "Détection des dépenses inhabituelles",
          "Prévision de trésorerie sur 3 mois",
          "Vos catégories les plus rentables",
        ]}
        onUpgrade={onUpgrade}
        loading={checkoutLoading}
      />
    );
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-slate-500 text-sm py-10 justify-center"><Loader2 className="animate-spin" size={16} /> Analyse en cours…</div>;
  }

  const { score, scoreBreakdown, anomalies, forecast, topProfitables } = analysis;

  return (
    <div className="space-y-5 mb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-500 max-w-md">Ces indicateurs alimentent aussi votre dossier de financement, prêt à partager avec une banque ou un investisseur.</p>
        <button
          onClick={() => exportDossierFinancement(transactions, products, credits, company, analysis, assets, liabilities)}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-white text-slate-900 font-medium text-sm rounded-md px-3 py-2 shrink-0"
        >
          <FileText size={15} /> Dossier de financement (PDF)
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-md p-6 flex flex-col sm:flex-row items-center gap-6">
        <ScoreGauge score={score} />
        <div className="flex-1 w-full">
          <h3 className="font-serif text-lg text-slate-50 mb-1">Score de santé financière</h3>
          <p className="text-sm text-slate-400 mb-3">{scoreLabel(score)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {scoreBreakdown.map((s) => (
              <div key={s.label} className="text-xs">
                <p className="text-slate-500">{s.label}</p>
                <p className="font-mono text-slate-200">{s.points}/{s.max}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-md p-5">
        <h3 className="font-serif text-base text-slate-50 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-400" /> Alertes & anomalies</h3>
        {anomalies.length === 0 ? (
          <p className="text-xs text-slate-500">Rien à signaler pour l'instant — continuez comme ça.</p>
        ) : (
          <div className="space-y-2">
            {anomalies.map((a, i) => (
              <div key={i} className={`text-xs rounded-md px-3 py-2 border ${a.level === "high" ? "border-rose-800/50 bg-rose-950/20 text-rose-200" : "border-amber-800/50 bg-amber-950/20 text-amber-200"}`}>
                {a.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-5">
          <h3 className="font-serif text-base text-slate-50 mb-3 flex items-center gap-2"><Activity size={16} className="text-amber-400" /> Prévision de trésorerie</h3>
          {forecast ? (
            <>
              <p className="text-xs text-slate-400 mb-2">Projection basée sur votre moyenne récente</p>
              <div className="space-y-1.5">
                {forecast.map((f) => (
                  <div key={f.mois} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{f.mois}</span>
                    <span className={`font-mono ${f.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{f.net >= 0 ? "+" : ""}{formatMontant(f.net, deviseBase)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">Pas encore assez d'historique pour prévoir — ajoutez des écritures sur au moins 2 mois différents.</p>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-5">
          <h3 className="font-serif text-base text-slate-50 mb-3 flex items-center gap-2"><Trophy size={16} className="text-amber-400" /> Les plus rentables</h3>
          {topProfitables.length === 0 ? (
            <p className="text-xs text-slate-500">Pas encore assez de données.</p>
          ) : (
            <div className="space-y-2">
              {topProfitables.map((t, i) => (
                <div key={t.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{i + 1}. {t.label}</span>
                  <span className="font-mono text-emerald-400">+{formatMontant(t.profit, deviseBase)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreGauge({ score }) {
  const color = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-2xl text-slate-50">{score}</span>
        <span className="text-[10px] text-slate-500">/100</span>
      </div>
    </div>
  );
}

function scoreLabel(score) {
  if (score >= 80) return "Excellente santé financière.";
  if (score >= 60) return "Bonne santé, quelques points à surveiller.";
  if (score >= 40) return "Santé fragile — des actions correctives sont recommandées.";
  return "Situation à risque — une attention immédiate est nécessaire.";
}

export function computeAnalysis(transactions, products, credits, deviseBase) {
  const now = new Date();

  const recentTx = transactions.filter((t) => {
    const d = new Date(t.date);
    const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return diffMonths >= 0 && diffMonths < 3;
  });
  const ca = recentTx.filter((t) => t.sens === "recette").reduce((s, t) => s + Number(t.montant_base), 0);
  const dep = recentTx.filter((t) => t.sens === "depense").reduce((s, t) => s + Number(t.montant_base), 0);
  const marge = ca > 0 ? (ca - dep) / ca : 0;

  let margePts = 0;
  if (marge >= 0.2) margePts = 30; else if (marge >= 0.1) margePts = 20; else if (marge > 0) margePts = 10;

  const ruptures = products.filter((p) => Number(p.quantity) <= Number(p.alert_threshold)).length;
  const stockPts = products.length === 0 ? 15 : Math.round(20 * Math.max(0, 1 - ruptures / products.length));

  const clientCredits = credits.filter((c) => c.type === "client" && c.statut === "ouvert");
  const clientEnRetard = clientCredits.filter((c) => c.date_echeance && new Date(c.date_echeance) < now).length;
  const creancePts = clientCredits.length === 0 ? 20 : Math.round(20 * Math.max(0, 1 - clientEnRetard / clientCredits.length));

  const dettesOuvertes = credits.filter((c) => c.type === "fournisseur" && c.statut === "ouvert")
    .reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
  const ratioDettes = ca > 0 ? dettesOuvertes / ca : 0;
  let dettePts = 15;
  if (ratioDettes > 0.5) dettePts = 0; else if (ratioDettes > 0.25) dettePts = 8;

  const txCeMois = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const regularitePts = txCeMois > 0 ? 15 : 0;

  const score = Math.min(100, margePts + stockPts + creancePts + dettePts + regularitePts);

  const scoreBreakdown = [
    { label: "Marge", points: margePts, max: 30 },
    { label: "Stock", points: stockPts, max: 20 },
    { label: "Créances", points: creancePts, max: 20 },
    { label: "Dettes", points: dettePts, max: 15 },
    { label: "Régularité", points: regularitePts, max: 15 },
  ];

  const anomalies = [];
  const depenses = transactions.filter((t) => t.sens === "depense").map((t) => Number(t.montant_base));
  if (depenses.length >= 4) {
    const moyenne = depenses.reduce((a, b) => a + b, 0) / depenses.length;
    const variance = depenses.reduce((a, b) => a + (b - moyenne) ** 2, 0) / depenses.length;
    const seuil = moyenne + 2 * Math.sqrt(variance);
    transactions
      .filter((t) => t.sens === "depense" && seuil > 0 && Number(t.montant_base) > seuil)
      .slice(0, 3)
      .forEach((t) => {
        anomalies.push({ level: "high", text: `Dépense inhabituelle : ${t.libelle || t.categorie} — ${formatMontant(t.montant_base, deviseBase)} le ${t.date}` });
      });
  }
  if (ruptures > 0) anomalies.push({ level: "medium", text: `${ruptures} produit(s) en alerte de rupture de stock.` });
  if (clientEnRetard > 0) anomalies.push({ level: "high", text: `${clientEnRetard} créance(s) client en retard de paiement.` });

  const monthlyNets = {};
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7);
    monthlyNets[key] = (monthlyNets[key] || 0) + (t.sens === "recette" ? Number(t.montant_base) : -Number(t.montant_base));
  });
  const sortedMonths = Object.keys(monthlyNets).sort();
  const lastThree = sortedMonths.slice(-3).map((k) => monthlyNets[k]);
  let forecast = null;
  if (lastThree.length >= 2) {
    const avgNet = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;
    forecast = [1, 2, 3].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return { mois: `${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`, net: Math.round(avgNet) };
    });
  }

  const profitByType = {};
  transactions.forEach((t) => {
    profitByType[t.type_op] = (profitByType[t.type_op] || 0) + (t.sens === "recette" ? Number(t.montant_base) : -Number(t.montant_base));
  });
  const topProfitables = TYPES_OP.map((tp) => ({ label: tp.label, profit: profitByType[tp.id] || 0 }))
    .filter((x) => x.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3);

  return { score, scoreBreakdown, anomalies, forecast, topProfitables };
}
