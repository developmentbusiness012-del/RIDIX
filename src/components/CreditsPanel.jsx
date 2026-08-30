import { useState, useEffect, useMemo } from "react";
import { HandCoins, Plus, Trash2, X, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatMontant } from "../constants";
import { PremiumTeaser } from "./StockPanel";
import { ConfirmDialog, PromptDialog } from "./Dialogs";

export default function CreditsPanel({ companyId, plan, isOwner, canManage = true, deviseBase, onUpgrade, checkoutLoading }) {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("client"); // client = créances, fournisseur = dettes

  useEffect(() => {
    if (plan !== "premium" || !companyId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("credits").select("*").eq("company_id", companyId).order("date_echeance", { ascending: true, nullsFirst: false });
      setCredits(data || []);
      setLoading(false);
    })();
  }, [companyId, plan]);

  const list = useMemo(() => credits.filter((c) => c.type === tab), [credits, tab]);
  const totalOuvert = useMemo(
    () => list.filter((c) => c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0),
    [list]
  );

  const addCredit = async (payload) => {
    const { data, error } = await supabase.from("credits").insert({ company_id: companyId, type: tab, ...payload }).select().single();
    if (!error && data) setCredits((prev) => [...prev, data]);
  };

  const recordPayment = async (credit, montant) => {
    const nextPaye = Math.min(Number(credit.montant), Number(credit.montant_paye) + montant);
    const statut = nextPaye >= Number(credit.montant) ? "solde" : "ouvert";
    const { error } = await supabase.from("credits").update({ montant_paye: nextPaye, statut }).eq("id", credit.id);
    if (!error) setCredits((prev) => prev.map((c) => (c.id === credit.id ? { ...c, montant_paye: nextPaye, statut } : c)));
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null); // credit being paid

  const removeCredit = async (id) => {
    const { error } = await supabase.from("credits").delete().eq("id", id);
    if (!error) setCredits((prev) => prev.filter((c) => c.id !== id));
    setConfirmDeleteId(null);
  };

  if (plan !== "premium") {
    return (
      <PremiumTeaser
        icon={HandCoins}
        title="Crédits & dettes"
        pitch="Suivez qui vous doit de l'argent et ce que vous devez à vos fournisseurs — ne perdez plus jamais le fil d'une créance ou d'une échéance."
        benefits={[
          "Ventes à crédit clients avec échéances",
          "Dettes fournisseurs et paiements partiels",
          "Vue claire de ce qui reste à encaisser ou à régler",
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
        <h2 className="font-serif text-lg text-slate-50 flex items-center gap-2"><HandCoins size={18} className="text-amber-400" /> Crédits & dettes</h2>
        {canManage && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md px-3 py-2">
            <Plus size={15} /> Nouvelle fiche
          </button>
        )}
      </div>

      {!canManage && (
        <div className="mb-4 border border-slate-800 bg-slate-900/60 rounded-md px-4 py-2.5 flex items-center gap-2">
          <p className="text-xs text-slate-500">Votre rôle vous permet de consulter les crédits/dettes, pas de les modifier.</p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("client")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${tab === "client" ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
          <ArrowDownCircle size={13} /> Créances clients
        </button>
        <button onClick={() => setTab("fournisseur")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${tab === "fournisseur" ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
          <ArrowUpCircle size={13} /> Dettes fournisseurs
        </button>
      </div>

      <div className={`mb-5 border rounded-md px-4 py-3 ${tab === "client" ? "border-emerald-800/50 bg-emerald-950/20" : "border-rose-800/50 bg-rose-950/20"}`}>
        <p className="text-xs text-slate-400 mb-0.5">{tab === "client" ? "Total encore à encaisser" : "Total encore à régler"}</p>
        <p className={`font-mono text-lg ${tab === "client" ? "text-emerald-400" : "text-rose-400"}`}>{formatMontant(totalOuvert, deviseBase)}</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-y border-slate-800">
                <th className="px-4 py-2 font-medium">{tab === "client" ? "Client" : "Fournisseur"}</th>
                <th className="px-2 py-2 font-medium text-right">Montant</th>
                <th className="px-2 py-2 font-medium text-right">Payé</th>
                <th className="px-2 py-2 font-medium text-right">Reste</th>
                <th className="px-2 py-2 font-medium">Échéance</th>
                <th className="px-2 py-2 font-medium">Statut</th>
                <th className="px-2 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-500 text-xs py-8">Aucune fiche pour l'instant.</td></tr>
              )}
              {list.map((c) => {
                const reste = Number(c.montant) - Number(c.montant_paye);
                return (
                  <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-slate-200">{c.nom}{c.note && <span className="block text-[11px] text-slate-500">{c.note}</span>}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-300">{formatMontant(c.montant, c.devise)}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-500">{formatMontant(c.montant_paye, c.devise)}</td>
                    <td className="px-2 py-2 text-right font-mono text-amber-300">{formatMontant(reste, c.devise)}</td>
                    <td className="px-2 py-2 text-slate-400 text-xs">{c.date_echeance || "—"}</td>
                    <td className="px-2 py-2">
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${c.statut === "solde" ? "text-emerald-400 border-emerald-700" : "text-amber-300 border-amber-700"}`}>
                        {c.statut === "solde" ? "Soldé" : "Ouvert"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {c.statut === "ouvert" && canManage && (
                          <button onClick={() => setPaymentTarget(c)}
                            className="text-[10px] text-amber-300 hover:text-amber-200 border border-amber-700/50 rounded px-1.5 py-0.5">
                            + paiement
                          </button>
                        )}
                        {isOwner && <button onClick={() => setConfirmDeleteId(c.id)} className="text-slate-600 hover:text-rose-400 p-1"><Trash2 size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <CreditForm type={tab} deviseBase={deviseBase} onClose={() => setShowForm(false)} onSubmit={addCredit} />}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Supprimer cette fiche ?"
          message="Cette action est définitive."
          confirmLabel="Supprimer"
          danger
          onConfirm={() => removeCredit(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {paymentTarget && (
        <PromptDialog
          title={paymentTarget.type === "client" ? "Encaissement reçu" : "Paiement effectué"}
          label={`Montant (reste ${formatMontant(Number(paymentTarget.montant) - Number(paymentTarget.montant_paye), paymentTarget.devise)})`}
          type="number"
          placeholder="0"
          confirmLabel="Enregistrer"
          onSubmit={async (montant) => { await recordPayment(paymentTarget, montant); setPaymentTarget(null); }}
          onCancel={() => setPaymentTarget(null)}
        />
      )}
    </div>
  );
}

function CreditForm({ type, deviseBase, onClose, onSubmit }) {
  const [nom, setNom] = useState("");
  const [montant, setMontant] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!nom.trim() || !montant || Number(montant) <= 0) return;
    setSaving(true);
    await onSubmit({
      nom: nom.trim(),
      montant: Number(montant),
      devise: deviseBase,
      date_echeance: dateEcheance || null,
      note: note.trim() || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-50">
            {type === "client" ? "Nouvelle vente à crédit" : "Nouvelle dette fournisseur"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">{type === "client" ? "Nom du client" : "Nom du fournisseur"}</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Montant ({deviseBase})</label>
              <input type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Échéance</label>
              <input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Note (optionnel)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="w-full mt-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
        </button>
      </form>
    </div>
  );
}
