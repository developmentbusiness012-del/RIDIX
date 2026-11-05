import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { formatMontant } from "../constants";
import { exportAdminReportPdf, exportAdminReportExcel } from "../exportUtils";
import { EXPENSE_LABELS, SOURCE_LABELS, categoryLabel } from "../financeLabels";
import { Sheet as Modal, Kpi, Card, Chips, SectionHeader, inputCls, btnPrimary, btnGhost } from "./AdminUI";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import {
  Loader2, Plus, X, RefreshCw, Download, FileSpreadsheet, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, Users, Crown, Percent, Banknote, Trophy,
} from "lucide-react";

const DEVISE = "FCFA";

// ---------- Périodes ----------
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function periodRange(period) {
  const now = new Date();
  if (period === "month") return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  if (period === "last_month") return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)) };
  if (period === "quarter") return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to: ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  if (period === "year") return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: ymd(new Date(now.getFullYear(), 11, 31)) };
  return { from: null, to: null };
}
export const FINANCE_PERIODS = [
  { id: "month", label: "Ce mois" },
  { id: "last_month", label: "Mois dernier" },
  { id: "quarter", label: "3 mois" },
  { id: "year", label: "Cette année" },
  { id: "all", label: "Tout" },
];

const frDate = (d) => new Date(d).toLocaleDateString("fr-FR");
const monthShort = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return `${["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"][m - 1]} ${String(y).slice(2)}`;
};

export default function AdminFinances() {
  const [period, setPeriod] = useState("month");
  const [report, setReport] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // "cash" | "revenue" | "expense" | { entry }
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState("");

  const periodLabel = FINANCE_PERIODS.find((p) => p.id === period)?.label || "";

  const load = useCallback(async () => {
    setError("");
    const { from, to } = periodRange(period);
    const [rep, led] = await Promise.all([
      supabase.rpc("admin_business_report", { p_from: from, p_to: to }),
      supabase.rpc("admin_ledger_list", { p_from: from, p_to: to }),
    ]);
    if (rep.error || led.error) setError((rep.error || led.error).message);
    else { setReport(rep.data); setLedger(led.data || []); }
    setLoading(false);
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const c = report?.clients;
  const premiumOffered = c ? Math.max(0, Number(c.premium) - Number(c.premium_paying)) : 0;
  const conversion = c && Number(c.owners) > 0 ? (Number(c.premium) / Number(c.owners)) * 100 : 0;
  const margin = report && Number(report.revenue) > 0 ? (Number(report.net) / Number(report.revenue)) * 100 : null;
  const best = report?.best_offer;
  const subscriptionRevenue = useMemo(() => (report?.by_offer || []).reduce((s, o) => s + Number(o.revenue), 0), [report]);
  const subscriptionSales = useMemo(() => (report?.by_offer || []).reduce((s, o) => s + Number(o.sales), 0), [report]);
  const monthly = useMemo(() => (report?.monthly || []).map((m) => ({
    name: monthShort(m.month), Revenus: Number(m.revenue), Dépenses: Number(m.expenses), Résultat: Number(m.revenue) - Number(m.expenses),
  })), [report]);

  const shownLedger = ledger.filter((e) => filter === "all" || e.kind === filter);

  const removeEntry = async (e) => {
    if (!window.confirm(`Supprimer cette écriture de ${formatMontant(e.amount, DEVISE)} ?${e.source === "maketou" ? "\n\nIl s'agit d'un paiement Maketou : le Premium du client ne sera pas modifié." : ""}`)) return;
    const { error: err } = await supabase.rpc("admin_ledger_delete", { p_id: e.id });
    if (err) setError(err.message); else load();
  };

  const runExport = async (kind) => {
    setExporting(kind);
    try {
      if (kind === "pdf") await exportAdminReportPdf(report, ledger, periodLabel);
      else await exportAdminReportExcel(report, ledger, periodLabel);
    } catch (err) {
      setError(`Export impossible : ${err.message}`);
    }
    setExporting("");
  };

  return (
    <div className="space-y-4">
      <SectionHeader icon={Banknote} title="Finances de RIDIX" subtitle="Chiffre d'affaires, dépenses et rapport d'activité. Les paiements Maketou sont enregistrés automatiquement.">
        <button onClick={() => runExport("pdf")} disabled={!report || !!exporting} className={btnGhost}>
          {exporting === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Rapport PDF
        </button>
        <button onClick={() => runExport("xlsx")} disabled={!report || !!exporting} className={btnGhost}>
          {exporting === "xlsx" ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel
        </button>
      </SectionHeader>

      <div className="flex items-center gap-2">
        <Chips options={FINANCE_PERIODS} value={period} onChange={setPeriod} className="flex-1 min-w-0" />
        <button onClick={() => { setLoading(true); load(); }} className="hidden sm:block text-slate-500 hover:text-slate-300 p-2 shrink-0" aria-label="Actualiser"><RefreshCw size={15} /></button>
      </div>

      {error && <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded-md px-3 py-2">{error}</p>}

      {loading && !report ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
      ) : report && (
        <>
          {/* Indicateurs financiers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={TrendingUp} label="Chiffre d'affaires" value={formatMontant(report.revenue, DEVISE)} sub={periodLabel} tone="text-emerald-300" iconTone="text-emerald-400" />
            <Kpi icon={TrendingDown} label="Dépenses" value={formatMontant(report.expenses, DEVISE)} sub={periodLabel} tone="text-rose-300" iconTone="text-rose-400" />
            <Kpi icon={Wallet} label="Résultat net" value={formatMontant(report.net, DEVISE)} sub={margin != null ? `Marge ${margin.toFixed(0)} %` : "—"} tone={Number(report.net) >= 0 ? "text-amber-300" : "text-rose-300"} />
            <Kpi icon={Trophy} label="Offre la plus rentable" value={best ? best.label : "—"} sub={best ? `Net ${formatMontant(best.net, DEVISE)} · ${best.sales} vente(s)` : "Aucune vente sur la période"} />
          </div>

          {/* Indicateurs clients */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={Crown} label="Clients Premium" value={c.premium} sub={`${c.premium_paying} payant(s) · ${premiumOffered} offert(s)`} />
            <Kpi icon={Users} label="Clients Freemium" value={c.freemium} sub={`${c.owners} comptes · ${c.employees} employés`} />
            <Kpi icon={Percent} label="Taux de conversion" value={`${conversion.toFixed(0)} %`} sub="Premium / comptes" />
            <Kpi icon={Wallet} label="Panier moyen" value={subscriptionSales > 0 ? formatMontant(subscriptionRevenue / subscriptionSales, DEVISE) : "—"} sub={`${subscriptionSales} abonnement(s) vendu(s)`} />
          </div>

          {/* Évolution */}
          <Card title="Évolution sur 12 mois">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthly} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : v)} width={42} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", fontSize: 12 }} formatter={(v) => formatMontant(v, DEVISE)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Revenus" fill="#34d399" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Dépenses" fill="#fb7185" radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="Résultat" stroke="#fbbf24" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Offres */}
            <Card title="Rentabilité par offre">
              {report.by_offer.length === 0 ? (
                <p className="text-xs text-slate-500">Aucun abonnement vendu sur cette période.</p>
              ) : (
                <>
                  <ul className="sm:hidden space-y-2.5">
                    {report.by_offer.map((o, i) => (
                      <li key={`${o.label}-${i}`} className="border border-slate-800 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-100">{i === 0 && <Trophy size={12} className="inline mr-1 text-amber-400" />}{o.label}</p>
                          <p className="font-mono text-amber-300 text-sm tabular-nums">{formatMontant(o.net, "")}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{o.sales} vente(s) · CA {formatMontant(o.revenue, "")} · commissions {formatMontant(o.commission_cost, "")}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-800">
                          <th className="py-1.5 pr-2 font-medium">Offre</th>
                          <th className="py-1.5 px-2 font-medium text-right">Ventes</th>
                          <th className="py-1.5 px-2 font-medium text-right">CA</th>
                          <th className="py-1.5 px-2 font-medium text-right">Commissions</th>
                          <th className="py-1.5 pl-2 font-medium text-right">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.by_offer.map((o, i) => (
                          <tr key={`${o.label}-${i}`} className="border-b border-slate-800/60">
                            <td className="py-2 pr-2 text-slate-200">{i === 0 && <Trophy size={11} className="inline mr-1 text-amber-400" />}{o.label}<span className="block text-[10px] text-slate-500">ticket moyen {formatMontant(o.avg_ticket, "")}</span></td>
                            <td className="py-2 px-2 text-right tabular-nums text-slate-300">{o.sales}</td>
                            <td className="py-2 px-2 text-right tabular-nums text-slate-300">{formatMontant(o.revenue, "")}</td>
                            <td className="py-2 px-2 text-right tabular-nums text-slate-500">{formatMontant(o.commission_cost, "")}</td>
                            <td className="py-2 pl-2 text-right tabular-nums text-amber-300">{formatMontant(o.net, "")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2">Net = CA − commissions dues aux commerciaux sur les clients parrainés.</p>
                </>
              )}
            </Card>

            {/* Clients */}
            <Card title="Clients">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <Row label="Comptes propriétaires" value={c.owners} />
                <Row label="Premium (payants)" value={`${c.premium} (${c.premium_paying})`} />
                <Row label="Premium offerts (sans paiement)" value={premiumOffered} />
                <Row label="Freemium" value={c.freemium} />
                <Row label="Nouveaux inscrits (période)" value={c.new_owners_period} />
                <Row label="Nouveaux clients payants (période)" value={c.new_payers_period} />
                <Row label="Clients payants (depuis le début)" value={c.paying_clients_total} />
                <Row label="Actifs ces 30 derniers jours" value={c.active_30d} />
                <Row label="Premium expirant sous 30 jours" value={c.premium_expiring_30d} />
                <Row label="Employés (comptes liés)" value={c.employees} />
              </dl>
            </Card>

            {/* Sources de revenus */}
            <Card title="Chiffre d'affaires par source">
              {report.revenue_by_source.length === 0 ? (
                <p className="text-xs text-slate-500">Aucun revenu sur cette période.</p>
              ) : (
                <ShareList rows={report.revenue_by_source.map((s) => ({ label: SOURCE_LABELS[s.source] || s.source, total: Number(s.total), sub: `${s.entries} écriture(s)` }))} tone="bg-emerald-400" />
              )}
            </Card>

            {/* Dépenses */}
            <Card title="Dépenses par catégorie">
              {report.expense_by_category.length === 0 ? (
                <p className="text-xs text-slate-500">Aucune dépense sur cette période.</p>
              ) : (
                <ShareList rows={report.expense_by_category.map((s) => ({ label: categoryLabel(s.category), total: Number(s.total), sub: `${s.entries} écriture(s)` }))} tone="bg-rose-400" />
              )}
            </Card>

            {/* Acquisition */}
            <Card title="Acquisition commerciale">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <Row label="Commerciaux actifs" value={`${report.agents.active} / ${report.agents.count}`} />
                <Row label="Inscriptions parrainées" value={report.agents.referred_signups_period} />
                <Row label="CA via parrainage" value={formatMontant(report.agents.referred_revenue_period, DEVISE)} />
                <Row label="Part du CA abonnements" value={subscriptionRevenue > 0 ? `${((Number(report.agents.referred_revenue_period) / subscriptionRevenue) * 100).toFixed(0)} %` : "—"} />
                <Row label="Commissions versées" value={formatMontant(report.agents.commissions_paid_period, DEVISE)} />
                <Row label="CA acquisition directe" value={formatMontant(Math.max(0, subscriptionRevenue - Number(report.agents.referred_revenue_period)), DEVISE)} />
              </dl>
            </Card>
          </div>

          {/* Journal */}
          <Card title={`Journal des opérations (${shownLedger.length})`}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => setForm("cash")} className="col-span-3 sm:col-span-1 bg-amber-400 text-slate-950 font-medium hover:bg-amber-300 rounded-lg px-3 py-2.5 text-xs flex items-center justify-center gap-1.5"><Plus size={14} /> Abonnement encaissé</button>
              <button onClick={() => setForm("revenue")} className="border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 rounded-lg px-3 py-2.5 text-xs flex items-center justify-center gap-1.5"><Plus size={14} /> Revenu</button>
              <button onClick={() => setForm("expense")} className="border border-rose-500/50 text-rose-300 hover:bg-rose-500/10 rounded-lg px-3 py-2.5 text-xs flex items-center justify-center gap-1.5"><Plus size={14} /> Dépense</button>
            </div>
            <Chips value={filter} onChange={setFilter} className="mb-3" options={[{ id: "all", label: "Tout" }, { id: "revenue", label: "Revenus" }, { id: "expense", label: "Dépenses" }]} />
            {shownLedger.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Aucune opération sur cette période.</p>
            ) : (
              <>
                <ul className="sm:hidden -mx-1 divide-y divide-slate-800/70">
                  {shownLedger.map((e) => (
                    <li key={e.id} className="px-1 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-slate-100">{categoryLabel(e.category)}</p>
                          {e.client && <p className="text-xs text-slate-400 truncate">{e.client}</p>}
                          {e.description && <p className="text-[11px] text-slate-500 mt-0.5 break-words">{e.description}</p>}
                          {e.kind === "revenue" && Number(e.amount) === 0 && <p className="text-[11px] text-amber-400 mt-0.5">Montant à compléter (tarif inconnu)</p>}
                        </div>
                        <p className={`font-mono text-sm tabular-nums shrink-0 ${e.kind === "revenue" ? "text-emerald-300" : "text-rose-300"}`}>{e.kind === "revenue" ? "+" : "−"}{formatMontant(e.amount, "")}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[11px] text-slate-600">{frDate(e.occurred_on)} · {e.source === "maketou" ? "Auto" : e.source === "commission" ? "Parrainage" : "Manuel"}</p>
                        {e.is_payout ? (
                          <span className="text-[10px] text-slate-600">via Parrainage</span>
                        ) : (
                          <div className="flex gap-1">
                            <button onClick={() => setForm({ entry: e })} className="p-2 text-slate-400 active:text-slate-100" aria-label="Modifier"><Pencil size={14} /></button>
                            <button onClick={() => removeEntry(e)} className="p-2 text-slate-500 active:text-rose-400" aria-label="Supprimer"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-800">
                        <th className="py-1.5 pr-2 font-medium">Date</th>
                        <th className="py-1.5 px-2 font-medium">Opération</th>
                        <th className="py-1.5 px-2 font-medium">Source</th>
                        <th className="py-1.5 px-2 font-medium text-right">Montant</th>
                        <th className="py-1.5 pl-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {shownLedger.map((e) => (
                        <tr key={e.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="py-2 pr-2 text-slate-400 whitespace-nowrap">{frDate(e.occurred_on)}</td>
                          <td className="py-2 px-2">
                            <p className="text-slate-200">{categoryLabel(e.category)}{e.client ? <span className="text-slate-500"> · {e.client}</span> : null}</p>
                            {e.description && <p className="text-[11px] text-slate-500">{e.description}</p>}
                            {e.kind === "revenue" && Number(e.amount) === 0 && <p className="text-[11px] text-amber-400">Montant à compléter (tarif inconnu)</p>}
                          </td>
                          <td className="py-2 px-2 text-slate-500">{e.source === "maketou" ? "Auto" : e.source === "commission" ? "Parrainage" : "Manuel"}</td>
                          <td className={`py-2 px-2 text-right tabular-nums font-medium whitespace-nowrap ${e.kind === "revenue" ? "text-emerald-300" : "text-rose-300"}`}>{e.kind === "revenue" ? "+" : "−"}{formatMontant(e.amount, "")}</td>
                          <td className="py-2 pl-2 text-right whitespace-nowrap">
                            {e.is_payout ? (
                              <span className="text-[10px] text-slate-600">via Parrainage</span>
                            ) : (
                              <>
                                <button onClick={() => setForm({ entry: e })} className="p-1 text-slate-500 hover:text-slate-200" title="Modifier"><Pencil size={12} /></button>
                                <button onClick={() => removeEntry(e)} className="p-1 text-slate-600 hover:text-rose-400" title="Supprimer"><Trash2 size={12} /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <p className="text-[10px] text-slate-600 mt-3">Les commissions versées aux commerciaux (onglet Parrainage) s'ajoutent automatiquement aux dépenses.</p>
          </Card>
        </>
      )}

      {form === "cash" && <CashForm onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
      {(form === "revenue" || form === "expense") && <EntryForm kind={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
      {form?.entry && <EditForm entry={form.entry} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/60 pb-1.5 sm:border-0 sm:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-100 tabular-nums shrink-0">{value}</dd>
    </div>
  );
}

function ShareList({ rows, tone }) {
  const total = rows.reduce((s, r) => s + r.total, 0) || 1;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
            <span className="text-slate-300 min-w-0 truncate">{r.label}</span>
            <span className="tabular-nums text-slate-100 shrink-0">{formatMontant(r.total, DEVISE)} <span className="text-slate-500">({((r.total / total) * 100).toFixed(0)} %)</span></span>
          </div>
          <p className="text-[10px] text-slate-600 -mt-0.5 mb-1">{r.sub}</p>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${tone}`} style={{ width: `${(r.total / total) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

// ---------- Abonnement encaissé hors Maketou ----------
const CHANNELS = ["Espèces", "Orange Money", "MTN Mobile Money", "Virement bancaire", "Remis par un commercial"];

function CashForm({ onClose, onSaved }) {
  const [options, setOptions] = useState(null);
  const [userId, setUserId] = useState("");
  const [offer, setOffer] = useState("");
  const [customDays, setCustomDays] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(ymd(new Date()));
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [note, setNote] = useState("");
  const [activate, setActivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.rpc("admin_owner_options");
      if (err) { setError(err.message); return; }
      setOptions(data);
      if (data.prices[0]) { setOffer(String(data.prices[0].duration_days)); setAmount(String(data.prices[0].price)); }
    })();
  }, []);

  const chooseOffer = (value) => {
    setOffer(value);
    const p = options?.prices.find((x) => String(x.duration_days) === value);
    if (p) setAmount(String(p.price));
  };

  const days = offer === "custom" ? Number(customDays) : Number(offer);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!userId) { setError("Choisissez le client."); return; }
    if (!(days > 0)) { setError("Indiquez la durée de l'abonnement en jours."); return; }
    if (!(Number(amount) > 0)) { setError("Saisissez le montant encaissé."); return; }
    setSaving(true);
    const { error: err } = await supabase.rpc("admin_record_cash_subscription", {
      p_user_id: userId, p_duration_days: days, p_amount: Number(amount), p_date: date,
      p_note: [channel, note.trim()].filter(Boolean).join(" — "), p_activate: activate,
    });
    setSaving(false);
    if (err) setError(err.message); else onSaved();
  };

  return (
    <Modal title="Abonnement encaissé (hors Maketou)" onClose={onClose}>
      {!options ? (
        <div className="text-slate-500 text-sm flex items-center gap-2 py-4"><Loader2 size={14} className="animate-spin" /> Chargement…{error && <span className="text-rose-400">{error}</span>}</div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-slate-400">Paiement reçu directement (espèces, Mobile Money, via un commercial…). Il est ajouté au chiffre d'affaires et, si coché, le Premium est activé pour le client.</p>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Client</label>
            <select required value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
              <option value="">— Choisir —</option>
              {options.owners.map((o) => (
                <option key={o.user_id} value={o.user_id}>{(o.company || "Sans nom")} · {o.phone || "sans numéro"} · {o.plan === "premium" ? "Premium" : "Freemium"}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Offre</label>
              <select value={offer} onChange={(e) => chooseOffer(e.target.value)} className={inputCls}>
                {options.prices.map((p) => <option key={p.duration_days} value={p.duration_days}>{p.label} — {formatMontant(p.price, "")}</option>)}
                <option value="custom">Autre durée…</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Montant encaissé ({DEVISE})</label>
              <input type="number" min="1" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </div>
          </div>
          {offer === "custom" && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Durée (jours)</label>
              <input type="number" min="1" value={customDays} onChange={(e) => setCustomDays(e.target.value)} className={inputCls} placeholder="Ex : 90" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date d'encaissement</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Moyen</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputCls}>
                {CHANNELS.map((ch) => <option key={ch}>{ch}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Note (optionnel)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="Ex : remis par Marc, marché Mokolo" />
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} className="accent-amber-400 mt-0.5" />
            Activer le Premium pour ce client ({days > 0 ? `${days} jours` : "durée choisie"}, prolongé s'il l'est déjà)
          </label>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button type="submit" disabled={saving} className={`w-full ${btnPrimary}`}>
            {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer l'encaissement
          </button>
        </form>
      )}
    </Modal>
  );
}

// ---------- Autre revenu / dépense ----------
function EntryForm({ kind, onClose, onSaved }) {
  const isExpense = kind === "expense";
  const categories = Object.entries(EXPENSE_LABELS).filter(([k]) => k !== "commission");
  const [category, setCategory] = useState(isExpense ? "hebergement" : "autre_revenu");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(ymd(new Date()));
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!(Number(amount) > 0)) { setError("Saisissez un montant positif."); return; }
    setSaving(true);
    const { error: err } = await supabase.rpc("admin_ledger_add", { p_kind: kind, p_category: category, p_amount: Number(amount), p_date: date, p_description: description });
    setSaving(false);
    if (err) setError(err.message); else onSaved();
  };

  return (
    <Modal title={isExpense ? "Nouvelle dépense RIDIX" : "Nouveau revenu"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {isExpense ? (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Les commissions des commerciaux se saisissent dans l'onglet Parrainage (« Commissions versées ») : elles arrivent ici automatiquement.</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Pour un revenu qui n'est pas un abonnement (formation, prestation, partenariat…). Pour un abonnement payé en espèces, utilisez « Abonnement encaissé ».</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Montant ({DEVISE})</label>
            <input type="number" min="1" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder={isExpense ? "Ex : Abonnement Supabase Pro" : "Ex : Formation boutique Mokolo"} />
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button type="submit" disabled={saving} className={`w-full ${btnPrimary}`}>
          {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
        </button>
      </form>
    </Modal>
  );
}

// ---------- Correction d'une écriture ----------
function EditForm({ entry, onClose, onSaved }) {
  const [amount, setAmount] = useState(String(entry.amount));
  const [date, setDate] = useState(entry.occurred_on);
  const [description, setDescription] = useState(entry.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.rpc("admin_ledger_update", { p_id: entry.id, p_amount: Number(amount), p_date: date, p_description: description });
    setSaving(false);
    if (err) setError(err.message); else onSaved();
  };

  return (
    <Modal title="Modifier l'écriture" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-400">{categoryLabel(entry.category)}{entry.client ? ` · ${entry.client}` : ""} — {entry.kind === "revenue" ? "revenu" : "dépense"}</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Montant ({DEVISE})</label>
            <input type="number" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button type="submit" disabled={saving} className={`w-full ${btnPrimary}`}>
          {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
        </button>
      </form>
    </Modal>
  );
}
