import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { LineChart as LineChartIcon, Loader2, ShieldAlert, ArrowRight, TrendingUp, TrendingDown, Landmark } from "lucide-react";
import { formatMontant, liabilityCategoryLabel } from "../constants";
import { PremiumTeaser } from "./StockPanel";
import { computeCompteResultat, computeCashFlowHistorique, computeCashFlowPrevisionnel, computeEndettementGlobal } from "../analyseFinanciereUtils";
import { computeDSCR } from "../financingUtils";

export default function AnalysisPanel({ companyId, plan, deviseBase, transactions, company, products = [], credits = [], assets = [], liabilities = [], liabilityPayments = [], requests = [], capacity, dataLoading, onUpgrade, checkoutLoading, onNavigate }) {
  const [periodeCR, setPeriodeCR] = useState(12);
  const [horizonCF, setHorizonCF] = useState(6);

  const compteResultat = useMemo(() => computeCompteResultat(transactions, { months: periodeCR }), [transactions, periodeCR]);

  const bilan = useMemo(() => {
    const tresorerie = transactions.reduce((s, t) => s + (t.sens === "recette" ? Number(t.montant_base) : -Number(t.montant_base)), 0);
    const valeurStock = products.reduce((s, p) => s + Number(p.quantity) * Number(p.cost_price || p.unit_price || 0), 0);
    const creancesClients = credits.filter((c) => c.type === "client" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
    const immobilisations = assets.reduce((s, a) => s + Number(a.valeur), 0);
    const totalActifs = tresorerie + valeurStock + creancesClients + immobilisations;
    const dettesFournisseurs = credits.filter((c) => c.type === "fournisseur" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
    const dettesFinancieres = liabilities.filter((l) => l.statut === "actif").reduce((s, l) => s + (Number(l.montant) - Number(l.montant_rembourse)), 0);
    const totalPassifsDettes = dettesFournisseurs + dettesFinancieres;
    const capitauxPropres = totalActifs - totalPassifsDettes;
    return { tresorerie, valeurStock, creancesClients, immobilisations, totalActifs, dettesFournisseurs, dettesFinancieres, totalPassifsDettes, capitauxPropres };
  }, [transactions, products, credits, assets, liabilities]);

  const cashFlowHisto = useMemo(() => computeCashFlowHistorique(transactions, liabilityPayments, liabilities, { months: 12 }), [transactions, liabilityPayments, liabilities]);
  const cashFlowPrevisionnel = useMemo(() => computeCashFlowPrevisionnel(transactions, liabilities, { monthsAhead: horizonCF }), [transactions, liabilities, horizonCF]);

  const endettement = useMemo(
    () => computeEndettementGlobal({ credits, liabilities, ca: compteResultat.ca, avgMonthlyNet: capacity?.avgMonthlyNet ?? 0, capitauxPropres: bilan.capitauxPropres }),
    [credits, liabilities, compteResultat.ca, capacity?.avgMonthlyNet, bilan.capitauxPropres]
  );

  const derniereRequete = requests[0] || null;
  const dscr = useMemo(() => {
    if (!derniereRequete || !capacity?.eligible) return null;
    return computeDSCR({ avgMonthlyNet: capacity.avgMonthlyNet, liabilities, montantSouhaite: derniereRequete.montant_souhaite, dureeMois: derniereRequete.duree_mois });
  }, [derniereRequete, capacity, liabilities]);

  if (plan !== "premium") {
    return (
      <PremiumTeaser
        icon={LineChartIcon}
        title="Analyse financière avancée"
        pitch="Compte de résultat, cash-flow historique et prévisionnel, capacité de remboursement (DSCR) et endettement global — le niveau de détail qu'un analyste crédit attend."
        benefits={[
          "Compte de résultat : marge brute, EBITDA, résultat net",
          "Cash-flow historique (12 mois) et prévisionnel (6-12 mois, 3 scénarios)",
          "DSCR indicatif et vue complète de votre endettement",
        ]}
        onUpgrade={onUpgrade}
        loading={checkoutLoading}
      />
    );
  }

  if (dataLoading) {
    return <div className="flex items-center gap-2 text-slate-500 text-sm py-10 justify-center"><Loader2 className="animate-spin" size={16} /> Chargement de l'analyse…</div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-serif text-lg text-slate-50 flex items-center gap-2"><LineChartIcon size={18} className="text-amber-400" /> Analyse financière</h2>
        {onNavigate && (
          <button onClick={() => onNavigate("intelligence")} className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200">
            Générer mon dossier de financement <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* ---------- Bloc 3 : Compte de résultat ---------- */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-serif text-base text-slate-50">Compte de résultat</h3>
          <div className="flex gap-1">
            {[3, 6, 12].map((m) => (
              <button key={m} onClick={() => setPeriodeCR(m)}
                className={`text-xs px-2.5 py-1 rounded-full border ${periodeCR === m ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
                {m} mois
              </button>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <Row label="Chiffre d'affaires" value={compteResultat.ca} devise={deviseBase} />
              <Row label="Coût des marchandises vendues (COGS)" value={-compteResultat.cogs} devise={deviseBase} negative />
              <Row label="Marge brute" value={compteResultat.margeBrute} devise={deviseBase} bold extra={`${compteResultat.margeBrutePct.toFixed(1)} %`} />
              <Row label="— dont salaires" value={-compteResultat.charges.salaires} devise={deviseBase} sub negative />
              <Row label="— dont loyer" value={-compteResultat.charges.loyer} devise={deviseBase} sub negative />
              <Row label="— dont autres charges d'exploitation" value={-compteResultat.charges.autres} devise={deviseBase} sub negative />
              <Row label="EBITDA (avant charges financières & impôts)" value={compteResultat.ebitda} devise={deviseBase} bold />
              <Row label="Résultat d'exploitation" value={compteResultat.resultatExploitation} devise={deviseBase} />
              <Row label="Charges financières" value={-compteResultat.chargesFinancieres} devise={deviseBase} negative />
              <Row label="Impôts & taxes" value={-compteResultat.impots} devise={deviseBase} negative />
              <Row label="Résultat net" value={compteResultat.resultatNet} devise={deviseBase} bold highlight extra={`${compteResultat.margeNettePct.toFixed(1)} %`} />
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-600 mt-2">EBITDA = Résultat d'exploitation ici, car RIDIX ne suit pas encore d'amortissements (aucun actif immobilisé n'est amorti automatiquement).</p>
      </section>

      {/* ---------- Bilan résumé ---------- */}
      <section>
        <h3 className="font-serif text-base text-slate-50 mb-3">Bilan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden">
            <p className="text-xs text-slate-400 uppercase tracking-wide px-4 pt-3 pb-1">Actif</p>
            <table className="w-full text-sm"><tbody>
              <Row label="Immobilisations" value={bilan.immobilisations} devise={deviseBase} />
              <Row label="Stocks" value={bilan.valeurStock} devise={deviseBase} />
              <Row label="Créances clients" value={bilan.creancesClients} devise={deviseBase} />
              <Row label="Trésorerie" value={bilan.tresorerie} devise={deviseBase} />
              <Row label="Total actif" value={bilan.totalActifs} devise={deviseBase} bold highlight />
            </tbody></table>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden">
            <p className="text-xs text-slate-400 uppercase tracking-wide px-4 pt-3 pb-1">Passif</p>
            <table className="w-full text-sm"><tbody>
              <Row label="Capitaux propres (résiduels)" value={bilan.capitauxPropres} devise={deviseBase} />
              <Row label="Dettes fournisseurs" value={bilan.dettesFournisseurs} devise={deviseBase} />
              <Row label="Dettes financières" value={bilan.dettesFinancieres} devise={deviseBase} />
              <Row label="Total passif" value={bilan.capitauxPropres + bilan.totalPassifsDettes} devise={deviseBase} bold highlight />
            </tbody></table>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 mt-2">Les capitaux propres sont ici un résidu comptable (actif − dettes), faute d'un suivi séparé des apports associés. Détail des immobilisations et passifs financiers dans l'onglet Bilan.</p>
      </section>

      {/* ---------- Bloc 4 : Cash-flow historique ---------- */}
      <section>
        <h3 className="font-serif text-base text-slate-50 mb-3">Cash-flow historique (12 derniers mois)</h3>
        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 mb-3" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowHisto}>
              <defs>
                <linearGradient id="cfNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }} formatter={(v) => formatMontant(v, deviseBase)} />
              <Area type="monotone" dataKey="cumul" name="Trésorerie cumulée" stroke="#34d399" fill="url(#cfNet)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-y border-slate-800">
                <th className="px-3 py-2 font-medium">Mois</th>
                <th className="px-2 py-2 font-medium text-right text-emerald-400">Entrées</th>
                <th className="px-2 py-2 font-medium text-right text-rose-400">Sorties</th>
                <th className="px-2 py-2 font-medium text-right">Net</th>
                <th className="px-2 py-2 font-medium text-right">Cumul</th>
              </tr>
            </thead>
            <tbody>
              {cashFlowHisto.map((m) => (
                <tr key={m.mois} className="border-b border-slate-800/60">
                  <td className="px-3 py-1.5 text-slate-300">{m.label}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-emerald-400">{formatMontant(m.entrees, deviseBase)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-rose-400">{formatMontant(m.sorties, deviseBase)}</td>
                  <td className={`px-2 py-1.5 text-right font-mono ${m.net >= 0 ? "text-slate-200" : "text-rose-400"}`}>{formatMontant(m.net, deviseBase)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-slate-400">{formatMontant(m.cumul, deviseBase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-600 mt-2">Entrées = ventes + autres revenus + financements reçus. Sorties = achats, salaires, loyers, impôts, autres charges, remboursements de crédit.</p>
      </section>

      {/* ---------- Bloc 4 : Cash-flow prévisionnel ---------- */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-serif text-base text-slate-50">Cash-flow prévisionnel</h3>
          <div className="flex gap-1">
            {[6, 12].map((m) => (
              <button key={m} onClick={() => setHorizonCF(m)}
                className={`text-xs px-2.5 py-1 rounded-full border ${horizonCF === m ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
                {m} mois
              </button>
            ))}
          </div>
        </div>
        {!cashFlowPrevisionnel ? (
          <p className="text-sm text-amber-200 bg-amber-950/20 border border-amber-800/40 rounded-md px-3 py-2.5">Pas encore assez d'historique (2 mois minimum) pour une projection.</p>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-y border-slate-800">
                  <th className="px-3 py-2 font-medium">Mois projeté</th>
                  <th className="px-2 py-2 font-medium text-right text-amber-300">Prudent</th>
                  <th className="px-2 py-2 font-medium text-right text-slate-200">Normal</th>
                  <th className="px-2 py-2 font-medium text-right text-emerald-400">Optimiste</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowPrevisionnel.map((r) => (
                  <tr key={r.mois} className="border-b border-slate-800/60">
                    <td className="px-3 py-1.5 text-slate-300">{r.mois}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-amber-300">{formatMontant(r.prudent, deviseBase)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-slate-200">{formatMontant(r.normal, deviseBase)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-emerald-400">{formatMontant(r.optimiste, deviseBase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-slate-600 mt-2">Méthode : flux net mensuel moyen (3 derniers mois) × 0,75 / 1 / 1,2 selon le scénario, diminué des mensualités de dettes déjà connues.</p>
      </section>

      {/* ---------- Bloc 5 : Capacité de remboursement (DSCR) ---------- */}
      <section>
        <h3 className="font-serif text-base text-slate-50 mb-3">Capacité de remboursement</h3>
        <div className="mb-3 border border-slate-700 bg-slate-900/80 rounded-md px-4 py-3 flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Ceci n'est pas une décision de crédit.</strong> Le DSCR affiché est un indicateur d'analyse indicatif, pas un score d'éligibilité.
          </p>
        </div>
        {!derniereRequete ? (
          <p className="text-sm text-slate-400 bg-slate-900/60 border border-slate-800 rounded-md px-3 py-2.5">
            Exprimez un besoin de financement (montant + durée) dans l'onglet Intelligence → Préparer mon financement pour voir votre DSCR indicatif ici.
          </p>
        ) : !dscr ? (
          <p className="text-sm text-amber-200 bg-amber-950/20 border border-amber-800/40 rounded-md px-3 py-2.5">
            DSCR non calculable pour l'instant — il manque soit une durée de remboursement envisagée sur votre dernière demande, soit assez d'historique de flux de trésorerie.
          </p>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden">
            <table className="w-full text-sm"><tbody>
              <Row label="Besoin" value={derniereRequete.montant_souhaite} devise={deviseBase} />
              <Row label="Durée envisagée" value={null} extra={`${derniereRequete.duree_mois} mois`} />
              <Row label="Flux de trésorerie disponible" value={dscr.avgMonthlyNet} devise={deviseBase} extra="/ mois" />
              <Row label="Charges financières existantes" value={-dscr.chargesFinancieresExistantes} devise={deviseBase} negative extra="/ mois" />
              <Row label="Capacité indicative de service de la dette" value={dscr.capaciteServiceDette} devise={deviseBase} bold extra="/ mois" />
              <Row label="Mensualité nouvelle estimée (linéaire)" value={dscr.mensualiteNouvelle} devise={deviseBase} extra="/ mois" />
              <tr className="border-t border-slate-700">
                <td className="px-4 py-3 text-slate-200 font-medium">DSCR indicatif</td>
                <td colSpan={2} className="px-2 py-3 text-right font-mono text-lg text-amber-300">{dscr.dscr.toFixed(2)}x</td>
              </tr>
            </tbody></table>
            <p className="text-xs text-slate-400 px-4 pb-4">{dscr.appreciation}</p>
          </div>
        )}
      </section>

      {/* ---------- Bloc 6 : Endettement global ---------- */}
      <section>
        <h3 className="font-serif text-base text-slate-50 mb-3 flex items-center gap-2"><Landmark size={16} className="text-amber-400" /> Endettement global</h3>
        <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-y border-slate-800">
                <th className="px-3 py-2 font-medium">Créancier</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium text-right">Montant initial</th>
                <th className="px-2 py-2 font-medium text-right">Solde</th>
                <th className="px-2 py-2 font-medium text-right">Mensualité</th>
                <th className="px-2 py-2 font-medium">Échéance</th>
                <th className="px-2 py-2 font-medium">Terme</th>
              </tr>
            </thead>
            <tbody>
              {endettement.creanciers.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-500 text-xs py-6">Aucune dette financière active enregistrée.</td></tr>
              )}
              {endettement.creanciers.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/60">
                  <td className="px-3 py-1.5 text-slate-200">{c.nom}</td>
                  <td className="px-2 py-1.5 text-slate-400">{liabilityCategoryLabel(c.category)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-slate-300">{formatMontant(c.montantInitial, c.devise)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-rose-400">{formatMontant(c.solde, c.devise)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-slate-400">{c.mensualite ? formatMontant(c.mensualite, c.devise) : "—"}</td>
                  <td className="px-2 py-1.5 text-slate-400">{c.echeance || "—"}</td>
                  <td className="px-2 py-1.5 text-slate-400">{c.terme === "court" ? "Court terme" : "Long terme"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Debt-to-Equity" value={endettement.debtToEquity != null ? `${endettement.debtToEquity.toFixed(2)}x` : "—"} />
          <Stat label="Debt-to-Revenue" value={endettement.debtToRevenue != null ? `${(endettement.debtToRevenue * 100).toFixed(0)} %` : "—"} />
          <Stat label="Debt Service Ratio" value={endettement.debtServiceRatio != null ? `${(endettement.debtServiceRatio * 100).toFixed(0)} %` : "—"} />
          <Stat label="Court terme / Long terme" value={`${formatMontant(endettement.courtTerme, deviseBase)} / ${formatMontant(endettement.longTerme, deviseBase)}`} small />
        </div>
        <p className="text-[11px] text-slate-600 mt-3">Debt-to-Equity = dettes totales / capitaux propres. Debt-to-Revenue = dettes totales / CA de la période. Debt Service Ratio = mensualités totales / flux net mensuel moyen.</p>
      </section>
    </div>
  );
}

function Row({ label, value, devise, bold, negative, highlight, sub, extra }) {
  return (
    <tr className={`border-b border-slate-800/60 last:border-0 ${highlight ? "bg-slate-800/40" : ""}`}>
      <td className={`px-4 py-2 ${sub ? "pl-8 text-slate-500 text-xs" : "text-slate-300"} ${bold ? "font-medium text-slate-100" : ""}`}>{label}</td>
      <td className={`px-2 py-2 text-right font-mono ${bold ? "text-slate-50" : negative ? "text-rose-400" : "text-slate-300"}`}>
        {value != null ? formatMontant(value, devise) : ""}
      </td>
      {extra && <td className="px-2 py-2 text-right text-xs text-slate-500 w-20">{extra}</td>}
    </tr>
  );
}

function Stat({ label, value, small }) {
  return (
    <div className="border border-slate-800 bg-slate-900/60 rounded-md px-3 py-2.5">
      <p className="text-[11px] text-slate-500 mb-0.5">{label}</p>
      <p className={`font-mono text-slate-100 ${small ? "text-xs" : "text-base"}`}>{value}</p>
    </div>
  );
}
