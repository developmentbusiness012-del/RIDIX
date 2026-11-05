import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { formatMontant } from "../constants";
import { Sheet as Modal, Kpi, Card, Chips, SectionHeader, inputCls, btnPrimary, btnGhost } from "./AdminUI";
import {
  Loader2, Plus, Copy, Check, Link2, MessageCircle, Download, X, RefreshCw, UserPlus, Pencil, Trash2, Handshake, Users, TrendingUp, Wallet,
} from "lucide-react";

const DEVISE = "FCFA";

// ---------- Périodes ----------
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function periodRange(period) {
  const now = new Date();
  if (period === "month") return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  if (period === "last_month") return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)) };
  if (period === "quarter") return { from: ymd(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to: ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  return { from: null, to: null };
}
const PERIODS = [
  { id: "month", label: "Ce mois" },
  { id: "last_month", label: "Mois dernier" },
  { id: "quarter", label: "3 mois" },
  { id: "all", label: "Tout" },
];

const inviteLink = (code) => `${window.location.origin}/?ref=${code}`;
const shareText = (code) =>
  `Bonjour ! Je vous invite à essayer RIDIX, l'outil de gestion financière pour commerçants. Inscrivez-vous ici : ${inviteLink(code)} (code de parrainage : ${code})`;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

function CopyButton({ text, label, icon: Icon = Copy, className = "" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { if (await copyText(text)) { setDone(true); setTimeout(() => setDone(false), 1500); } }}
      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-2 sm:px-2 sm:py-1 rounded-md border border-slate-700 text-slate-300 hover:border-amber-500/60 hover:text-amber-300 active:bg-slate-800 ${className}`}
    >
      {done ? <Check size={11} className="text-emerald-400" /> : <Icon size={11} />} {done ? "Copié" : label}
    </button>
  );
}


export default function AdminReferrals() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | agent
  const [created, setCreated] = useState(null); // agent qui vient d'être créé / dont le code a changé
  const [detail, setDetail] = useState(null); // agent dont on affiche le détail
  const [showAssign, setShowAssign] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const { from, to } = periodRange(period);
    const { data: res, error: err } = await supabase.rpc("admin_referral_overview", { p_from: from, p_to: to });
    if (err) setError(err.message);
    else setData(res);
    setLoading(false);
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const agents = data?.agents || [];
  const totals = useMemo(() => agents.reduce((t, a) => ({
    active: t.active + (a.active ? 1 : 0),
    signups: t.signups + Number(a.signups_period),
    revenue: t.revenue + Number(a.revenue_period),
    commission: t.commission + Number(a.commission_period),
    balance: t.balance + Number(a.balance),
  }), { active: 0, signups: 0, revenue: 0, commission: 0, balance: 0 }), [agents]);

  const exportCsv = () => {
    const label = PERIODS.find((p) => p.id === period)?.label || "";
    const head = ["Commercial", "Code", "Téléphone", "Taux (%)", `Inscrits (${label})`, "Inscrits (total)", "Actifs", "Premium actifs", `CA parrainé (${label})`, `Commission (${label})`, "Commission totale", "Déjà payé", "Solde à payer"];
    const rows = agents.map((a) => [a.name, a.code, a.phone || "", a.commission_rate, a.signups_period, a.signups_total, a.actives_total, a.premium_now, a.revenue_period, a.commission_period, a.commission_total, a.paid_total, a.balance]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commerciaux_${ymd(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <SectionHeader icon={Handshake} title="Commerciaux & parrainage" subtitle="Un code par commercial, suivi des inscriptions parrainées et des commissions.">
        <button onClick={() => setEditing("new")} className={`col-span-2 sm:col-span-1 sm:order-3 ${btnPrimary} !py-2.5 !text-xs`}>
          <Plus size={14} /> Nouveau commercial
        </button>
        <button onClick={() => setShowAssign(true)} className={`sm:order-1 ${btnGhost}`}><UserPlus size={14} /> Rattacher un client</button>
        <button onClick={exportCsv} disabled={agents.length === 0} className={`sm:order-2 ${btnGhost}`}><Download size={14} /> Exporter (CSV)</button>
      </SectionHeader>

      <div className="flex items-center gap-2">
        <Chips options={PERIODS} value={period} onChange={setPeriod} className="flex-1 min-w-0" />
        <button onClick={() => { setLoading(true); load(); }} className="hidden sm:block text-slate-500 hover:text-slate-300 p-2 shrink-0" aria-label="Actualiser"><RefreshCw size={15} /></button>
      </div>

      {error && <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded-md px-3 py-2">{error}</p>}

      {loading && !data ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
      ) : data && (
        <>
          {/* Indicateurs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
            <Kpi icon={Handshake} label="Commerciaux actifs" value={`${totals.active} / ${agents.length}`} />
            <Kpi icon={Users} label="Inscrits parrainés" value={totals.signups} sub="sur la période" />
            <Kpi icon={TrendingUp} label="CA Premium parrainé" value={formatMontant(totals.revenue, DEVISE)} sub="sur la période" />
            <Kpi icon={Wallet} label="Commissions" value={formatMontant(totals.commission, DEVISE)} sub="sur la période" />
            <Kpi icon={Wallet} label="Solde à payer" value={formatMontant(totals.balance, DEVISE)} sub="cumul, tous commerciaux" tone="text-amber-300" />
          </div>

          {/* Commerciaux */}
          {agents.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-400">
              Aucun commercial pour le moment. Touchez « Nouveau commercial » pour générer son code de parrainage.
            </div>
          ) : (
            <>
              <ul className="md:hidden space-y-3">
                {agents.map((a) => (
                  <li key={a.id} className={`bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 ${a.active ? "" : "opacity-60"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-100 font-medium truncate">{a.name}</p>
                        <p className="text-[11px] text-slate-500">{a.phone || "—"} · commission {Number(a.commission_rate)} %{!a.active && " · désactivé"}</p>
                      </div>
                      <button onClick={() => setEditing(a)} className="p-2 -mr-1.5 -mt-1 text-slate-500 active:text-slate-200" aria-label="Modifier"><Pencil size={15} /></button>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2.5 bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2">
                      <span className="font-mono text-amber-300 tracking-widest text-lg">{a.code}</span>
                      <div className="flex gap-1.5">
                        <CopyButton text={a.code} label="Code" />
                        <CopyButton text={inviteLink(a.code)} label="Lien" icon={Link2} />
                      </div>
                    </div>
                    <dl className="grid grid-cols-4 gap-2 mt-3 text-center">
                      {[["Inscrits", `${a.signups_period}`, `/ ${a.signups_total}`], ["Actifs", a.actives_total], ["Premium", a.premium_now], ["Payants", a.paying_total]].map(([l, v, sub]) => (
                        <div key={l}><dt className="text-[10px] text-slate-500">{l}</dt><dd className="font-mono text-sm text-slate-100">{v}{sub && <span className="text-slate-600 text-[10px]"> {sub}</span>}</dd></div>
                      ))}
                    </dl>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
                      <div><p className="text-[10px] text-slate-500">Commission (période)</p><p className="font-mono text-sm text-slate-100 tabular-nums">{formatMontant(a.commission_period, DEVISE)}</p></div>
                      <div className="text-right"><p className="text-[10px] text-slate-500">Reste à payer</p><p className={`font-mono text-sm tabular-nums ${Number(a.balance) > 0 ? "text-amber-300" : "text-slate-400"}`}>{formatMontant(a.balance, DEVISE)}</p></div>
                    </div>
                    <button onClick={() => setDetail(a)} className="w-full mt-3 border border-slate-700 active:bg-slate-800 text-slate-200 rounded-lg py-2.5 text-xs">Voir le suivi & les versements</button>
                  </li>
                ))}
              </ul>

              <div className="hidden md:block bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-800">
                        <th className="px-3 py-2 font-medium">Commercial</th>
                        <th className="px-3 py-2 font-medium">Code</th>
                        <th className="px-3 py-2 font-medium text-right">Inscrits</th>
                        <th className="px-3 py-2 font-medium text-right">Actifs</th>
                        <th className="px-3 py-2 font-medium text-right">Premium</th>
                        <th className="px-3 py-2 font-medium text-right">CA période</th>
                        <th className="px-3 py-2 font-medium text-right">Commission</th>
                        <th className="px-3 py-2 font-medium text-right">Solde à payer</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((a) => (
                        <tr key={a.id} className={`border-b border-slate-800/60 hover:bg-slate-800/30 ${a.active ? "" : "opacity-50"}`}>
                          <td className="px-3 py-2.5">
                            <p className="text-slate-100">{a.name}{!a.active && <span className="ml-2 text-[10px] uppercase text-slate-500 border border-slate-700 rounded px-1">désactivé</span>}</p>
                            <p className="text-[11px] text-slate-500">{a.phone || "—"} · {Number(a.commission_rate)} %</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-mono text-amber-300 tracking-wider">{a.code}</p>
                            <div className="flex gap-1 mt-1">
                              <CopyButton text={a.code} label="Code" />
                              <CopyButton text={inviteLink(a.code)} label="Lien" icon={Link2} />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-200">{a.signups_period}<span className="text-slate-600"> / {a.signups_total}</span></td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{a.actives_total}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{a.premium_now}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{formatMontant(a.revenue_period, "")}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-100">{formatMontant(a.commission_period, "")}</td>
                          <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${Number(a.balance) > 0 ? "text-amber-300" : "text-slate-400"}`}>{formatMontant(a.balance, DEVISE)}</td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <button onClick={() => setDetail(a)} className="text-[11px] px-2.5 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500 mr-1.5">Suivi</button>
                            <button onClick={() => setEditing(a)} className="p-1.5 text-slate-500 hover:text-slate-200" title="Modifier"><Pencil size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="text-[11px] text-slate-500 space-y-1">
            <p>
              <strong className="text-slate-400">Calcul :</strong> commission = taux du commercial × paiements Premium des clients qu'il a parrainés
              ({(data.prices || []).map((p) => `${p.label} : ${formatMontant(p.price, DEVISE)}`).join(" · ") || "aucun tarif"}).
              « Inscrits » = inscriptions sur la période / total ; « Actifs » = clients ayant enregistré au moins une écriture ; « Premium » = clients actuellement en Premium.
            </p>
            {data.unreferred_owners > 0 && <p>{data.unreferred_owners} compte(s) propriétaire(s) n'ont aucun commercial rattaché (inscriptions sans code, ou antérieures à la campagne).</p>}
          </div>
        </>
      )}

      {editing && (
        <AgentForm
          agent={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(agent, isNew) => { setEditing(null); if (isNew) setCreated(agent); load(); }}
        />
      )}
      {created && <CodeCard agent={created} onClose={() => setCreated(null)} />}
      {detail && (
        <AgentDetail
          agent={agents.find((a) => a.id === detail.id) || detail}
          onClose={() => setDetail(null)}
          onChanged={load}
          onNewCode={(agent) => { setCreated(agent); load(); }}
        />
      )}
      {showAssign && <AssignDialog agents={agents.filter((a) => a.active)} onClose={() => setShowAssign(false)} onDone={() => { setShowAssign(false); load(); }} />}
    </div>
  );
}

// ---------- Création / modification ----------
function AgentForm({ agent, onClose, onSaved }) {
  const isNew = !agent;
  const [name, setName] = useState(agent?.name || "");
  const [phone, setPhone] = useState(agent?.phone || "");
  const [rate, setRate] = useState(agent ? Number(agent.commission_rate) : 10);
  const [notes, setNotes] = useState(agent?.notes || "");
  const [active, setActive] = useState(agent?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const r = Number(rate);
    if (!(r >= 0 && r <= 100)) { setError("Le taux de commission doit être compris entre 0 et 100 %."); return; }
    setSaving(true);
    const { data, error: err } = isNew
      ? await supabase.rpc("admin_create_sales_agent", { p_name: name, p_phone: phone, p_rate: r, p_notes: notes })
      : await supabase.rpc("admin_update_sales_agent", { p_id: agent.id, p_name: name, p_phone: phone, p_rate: r, p_notes: notes, p_active: active });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(data, isNew);
  };

  return (
    <Modal title={isNew ? "Nouveau commercial" : "Modifier le commercial"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nom du commercial</label>
          <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex : Marc Dupont" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Téléphone (optionnel)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+237 6XX XX XX XX" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Commission (%)</label>
            <input type="number" min="0" max="100" step="0.5" required value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Notes (zone, équipe…)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Ex : Marché Mokolo, Douala" />
        </div>
        {!isNew && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-amber-400" />
            Code actif (décocher pour refuser les nouvelles inscriptions avec ce code)
          </label>
        )}
        {isNew && <p className="text-[11px] text-slate-500">Un code simple et unique sera généré automatiquement (ex : MARC482).</p>}
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button type="submit" disabled={saving} className={`w-full ${btnPrimary}`}>
          {saving && <Loader2 size={14} className="animate-spin" />} {isNew ? "Générer le code" : "Enregistrer"}
        </button>
      </form>
    </Modal>
  );
}

// ---------- Carte du code (à transmettre au commercial) ----------
function CodeCard({ agent, onClose }) {
  const wa = `https://wa.me/?text=${encodeURIComponent(shareText(agent.code))}`;
  return (
    <Modal title="Code de parrainage" onClose={onClose}>
      <div className="text-center space-y-3">
        <p className="text-sm text-slate-400">Code de <span className="text-slate-100">{agent.name}</span></p>
        <p className="font-mono text-4xl tracking-[0.2em] text-amber-300 py-2">{agent.code}</p>
        <p className="text-[11px] text-slate-500 break-all">{inviteLink(agent.code)}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <CopyButton text={agent.code} label="Copier le code" className="!text-xs !px-3 !py-1.5" />
          <CopyButton text={inviteLink(agent.code)} label="Copier le lien" icon={Link2} className="!text-xs !px-3 !py-1.5" />
          <CopyButton text={shareText(agent.code)} label="Copier le message" className="!text-xs !px-3 !py-1.5" />
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400">
            <MessageCircle size={12} /> Envoyer par WhatsApp
          </a>
        </div>
        <p className="text-[11px] text-slate-500">Le lien ouvre directement l'inscription avec le code déjà rempli.</p>
      </div>
    </Modal>
  );
}

// ---------- Suivi d'un commercial ----------
function AgentDetail({ agent, onClose, onChanged, onNewCode }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState(ymd(new Date()));
  const [saving, setSaving] = useState(false);
  const [regen, setRegen] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.rpc("admin_agent_detail", { p_agent_id: agent.id });
    if (err) setError(err.message); else setDetail(data);
  }, [agent.id]);
  useEffect(() => { load(); }, [load]);

  const refresh = async () => { await load(); onChanged(); };

  const record = async (e) => {
    e.preventDefault();
    setError("");
    const v = Number(amount);
    if (!(v > 0)) { setError("Saisissez un montant positif."); return; }
    setSaving(true);
    const { error: err } = await supabase.rpc("admin_record_payout", { p_agent_id: agent.id, p_amount: v, p_note: note, p_paid_at: paidAt });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setAmount(""); setNote("");
    refresh();
  };

  const removePayout = async (id) => {
    const { error: err } = await supabase.rpc("admin_delete_payout", { p_id: id });
    if (err) setError(err.message); else refresh();
  };

  const regenerate = async () => {
    const { data, error: err } = await supabase.rpc("admin_regenerate_agent_code", { p_id: agent.id });
    setRegen(false);
    if (err) setError(err.message); else onNewCode(data);
  };

  const statusOf = (r) => (r.plan === "premium" ? ["Premium", "text-amber-300 border-amber-500/40"] : r.active ? ["Actif", "text-emerald-300 border-emerald-500/40"] : ["Inscrit", "text-slate-400 border-slate-700"]);

  return (
    <Modal title={`Suivi — ${agent.name}`} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-300 tracking-wider text-lg">{agent.code}</span>
            <CopyButton text={agent.code} label="Code" />
            <CopyButton text={inviteLink(agent.code)} label="Lien" icon={Link2} />
          </div>
          {regen ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">L'ancien code ne fonctionnera plus. Confirmer ?</span>
              <button onClick={regenerate} className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950">Oui</button>
              <button onClick={() => setRegen(false)} className="px-2.5 py-1 rounded-md border border-slate-700 text-slate-300">Non</button>
            </div>
          ) : (
            <button onClick={() => setRegen(true)} className="text-[11px] px-2.5 py-1.5 rounded-md border border-slate-700 text-slate-400 hover:border-slate-500">Générer un nouveau code</button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <Mini label="Inscrits (total)" value={agent.signups_total} />
          <Mini label="Clients payants" value={agent.paying_total} />
          <Mini label={`Commission totale (${Number(agent.commission_rate)} %)`} value={formatMontant(agent.commission_total, DEVISE)} />
          <Mini label="Reste à payer" value={formatMontant(agent.balance, DEVISE)} accent />
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        {/* Clients parrainés */}
        <div>
          <h4 className="text-sm text-slate-300 mb-2">Clients parrainés ({detail?.referrals?.length ?? "…"})</h4>
          {!detail ? (
            <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
          ) : detail.referrals.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun client parrainé pour le moment.</p>
          ) : (
            <>
              <ul className="sm:hidden space-y-2">
                {detail.referrals.map((r) => {
                  const [label, cls] = statusOf(r);
                  return (
                    <li key={r.user_id} className="border border-slate-800 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-slate-100 min-w-0 truncate">{r.company || "—"}{r.source === "admin" && <span className="ml-1.5 text-[9px] text-slate-500">(rattaché)</span>}</p>
                        <span className={`border rounded px-1.5 py-0.5 text-[10px] shrink-0 ${cls}`}>{label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{r.phone || "—"} · inscrit le {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Paiements : <span className="font-mono text-slate-200">{formatMontant(r.revenue, DEVISE)}</span></p>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden sm:block overflow-x-auto border border-slate-800 rounded-md">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-800">
                      <th className="px-3 py-2 font-medium">Entreprise</th>
                      <th className="px-3 py-2 font-medium">Téléphone</th>
                      <th className="px-3 py-2 font-medium">Inscrit le</th>
                      <th className="px-3 py-2 font-medium">Statut</th>
                      <th className="px-3 py-2 font-medium text-right">Paiements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.referrals.map((r) => {
                      const [label, cls] = statusOf(r);
                      return (
                        <tr key={r.user_id} className="border-b border-slate-800/60">
                          <td className="px-3 py-2 text-slate-200">{r.company || "—"}{r.source === "admin" && <span className="ml-1.5 text-[9px] text-slate-500">(rattaché)</span>}</td>
                          <td className="px-3 py-2 text-slate-400">{r.phone || "—"}</td>
                          <td className="px-3 py-2 text-slate-400">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="px-3 py-2"><span className={`border rounded px-1.5 py-0.5 text-[10px] ${cls}`}>{label}</span></td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-300">{formatMontant(r.revenue, "")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Versements */}
        <div>
          <h4 className="text-sm text-slate-300 mb-2">Commissions versées</h4>
          <form onSubmit={record} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1.4fr_auto] gap-2 mb-3">
            <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant (FCFA)" inputMode="numeric" className={inputCls} />
            <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inputCls} />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (ex : Orange Money, octobre)" className={`${inputCls} col-span-2 sm:col-span-1`} />
            <button type="submit" disabled={saving} className="col-span-2 sm:col-span-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-medium rounded-md px-4 py-2 text-sm flex items-center justify-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Enregistrer
            </button>
          </form>
          {detail?.payouts?.length > 0 ? (
            <ul className="border border-slate-800 rounded-md divide-y divide-slate-800/60">
              {detail.payouts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                  <span className="text-slate-400">{new Date(p.paid_at).toLocaleDateString("fr-FR")}{p.note ? ` — ${p.note}` : ""}</span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums text-slate-100">{formatMontant(p.amount, DEVISE)}</span>
                    <button onClick={() => removePayout(p.id)} className="text-slate-600 hover:text-rose-400" title="Supprimer ce versement"><Trash2 size={12} /></button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Aucun versement enregistré.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Mini({ label, value, accent = false }) {
  return (
    <div className="border border-slate-800 rounded-md px-3 py-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`font-mono tabular-nums ${accent ? "text-amber-300" : "text-slate-100"}`}>{value}</p>
    </div>
  );
}

// ---------- Rattacher un client existant à un commercial ----------
function AssignDialog({ agents, onClose, onDone }) {
  const [owners, setOwners] = useState(null);
  const [userId, setUserId] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.rpc("admin_unreferred_owners");
      if (err) setError(err.message); else setOwners(data);
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!userId || !agentId) return;
    setSaving(true);
    const { error: err } = await supabase.rpc("admin_assign_referral", { p_user_id: userId, p_agent_id: agentId });
    setSaving(false);
    if (err) setError(err.message); else onDone();
  };

  return (
    <Modal title="Rattacher un client à un commercial" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-400">Pour un client qui a oublié d'entrer le code à l'inscription : ses futurs paiements Premium compteront pour ce commercial.</p>
        {!owners ? (
          <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
        ) : (
          <>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Client (sans commercial)</label>
              <select required value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                <option value="">— Choisir —</option>
                {owners.map((o) => (
                  <option key={o.user_id} value={o.user_id}>
                    {(o.company || "Sans nom")} · {o.phone || "sans numéro"} · {new Date(o.created_at).toLocaleDateString("fr-FR")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Commercial</label>
              <select required value={agentId} onChange={(e) => setAgentId(e.target.value)} className={inputCls}>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
              </select>
            </div>
          </>
        )}
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button type="submit" disabled={saving || !userId || !agentId} className={`w-full ${btnPrimary}`}>
          {saving && <Loader2 size={14} className="animate-spin" />} Rattacher
        </button>
      </form>
    </Modal>
  );
}
