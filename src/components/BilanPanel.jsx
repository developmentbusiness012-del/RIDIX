import { useState, useEffect, useMemo } from "react";
import { Scale, Plus, Trash2, X, Loader2, Landmark, Building } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatMontant, LIABILITY_CATEGORIES } from "../constants";
import { ConfirmDialog, PromptDialog } from "./Dialogs";

const ASSET_CATEGORIES = [
  { id: "equipement", label: "Équipement" },
  { id: "vehicule", label: "Véhicule" },
  { id: "immobilier", label: "Immobilier" },
  { id: "autre", label: "Autre" },
];

export default function BilanPanel({ companyId, plan, isOwner, deviseBase, transactions, onUpgrade, checkoutLoading }) {
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [products, setProducts] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("actifs"); // actifs | passifs

  useEffect(() => {
    if (!companyId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [{ data: a }, { data: l }, { data: p }, { data: c }] = await Promise.all([
        supabase.from("assets").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
        supabase.from("liabilities").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
        supabase.from("products").select("quantity, unit_price, cost_price").eq("company_id", companyId),
        supabase.from("credits").select("type, statut, montant, montant_paye").eq("company_id", companyId),
      ]);
      setAssets(a || []);
      setLiabilities(l || []);
      setProducts(p || []);
      setCredits(c || []);
      setLoading(false);
    })();
  }, [companyId]);

  const summary = useMemo(() => {
    const tresorerie = transactions.reduce((s, t) => s + (t.sens === "recette" ? Number(t.montant_base) : -Number(t.montant_base)), 0);
    const valeurStock = products.reduce((s, p) => s + Number(p.quantity) * Number(p.cost_price || p.unit_price || 0), 0);
    const creancesClients = credits.filter((c) => c.type === "client" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
    const immobilisations = assets.reduce((s, a) => s + Number(a.valeur), 0);
    const totalActifs = tresorerie + valeurStock + creancesClients + immobilisations;

    const dettesFournisseurs = credits.filter((c) => c.type === "fournisseur" && c.statut === "ouvert").reduce((s, c) => s + (Number(c.montant) - Number(c.montant_paye)), 0);
    const passifsFinanciers = liabilities.filter((l) => l.statut === "actif").reduce((s, l) => s + (Number(l.montant) - Number(l.montant_rembourse)), 0);
    const totalPassifs = dettesFournisseurs + passifsFinanciers;

    return { tresorerie, valeurStock, creancesClients, immobilisations, totalActifs, dettesFournisseurs, passifsFinanciers, totalPassifs, patrimoineNet: totalActifs - totalPassifs };
  }, [transactions, products, credits, assets, liabilities]);

  const addAsset = async (payload) => {
    const { data, error } = await supabase.from("assets").insert({ company_id: companyId, ...payload }).select().single();
    if (!error && data) setAssets((prev) => [data, ...prev]);
  };
  const addLiability = async (payload) => {
    const { data, error } = await supabase.from("liabilities").insert({ company_id: companyId, ...payload }).select().single();
    if (!error && data) setLiabilities((prev) => [data, ...prev]);
  };

  const [confirmDelete, setConfirmDelete] = useState(null); // { kind, id }
  const [paymentTarget, setPaymentTarget] = useState(null);

  const remove = async () => {
    if (!confirmDelete) return;
    const table = confirmDelete.kind === "asset" ? "assets" : "liabilities";
    const { error } = await supabase.from(table).delete().eq("id", confirmDelete.id);
    if (!error) {
      if (confirmDelete.kind === "asset") setAssets((prev) => prev.filter((a) => a.id !== confirmDelete.id));
      else setLiabilities((prev) => prev.filter((l) => l.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  };

  const recordReimbursement = async (liability, montant) => {
    const nextRembourse = Math.min(Number(liability.montant), Number(liability.montant_rembourse) + montant);
    const statut = nextRembourse >= Number(liability.montant) ? "solde" : "actif";
    const { error } = await supabase.from("liabilities").update({ montant_rembourse: nextRembourse, statut }).eq("id", liability.id);
    if (!error) {
      setLiabilities((prev) => prev.map((l) => (l.id === liability.id ? { ...l, montant_rembourse: nextRembourse, statut } : l)));
      // Historique daté du remboursement — alimente le cash-flow historique (Bloc 4).
      await supabase.from("liability_payments").insert({ company_id: companyId, liability_id: liability.id, montant });
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-slate-500 text-sm py-10 justify-center"><Loader2 className="animate-spin" size={16} /> Chargement du bilan…</div>;
  }

  const list = tab === "actifs" ? assets : liabilities;
  const categories = tab === "actifs" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-serif text-lg text-slate-50 flex items-center gap-2"><Scale size={18} className="text-amber-400" /> Bilan simplifié</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md px-3 py-2">
          <Plus size={15} /> {tab === "actifs" ? "Nouvel actif" : "Nouveau passif"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="border border-emerald-800/50 bg-emerald-950/20 rounded-md px-4 py-3">
          <p className="text-xs text-slate-400 mb-0.5">Total actifs</p>
          <p className="font-mono text-lg text-emerald-400">{formatMontant(summary.totalActifs, deviseBase)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Trésorerie + stock + créances + immobilisations</p>
        </div>
        <div className="border border-rose-800/50 bg-rose-950/20 rounded-md px-4 py-3">
          <p className="text-xs text-slate-400 mb-0.5">Total passifs</p>
          <p className="font-mono text-lg text-rose-400">{formatMontant(summary.totalPassifs, deviseBase)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Dettes fournisseurs + prêts</p>
        </div>
        <div className="border border-amber-800/50 bg-amber-950/20 rounded-md px-4 py-3">
          <p className="text-xs text-slate-400 mb-0.5">Patrimoine net</p>
          <p className={`font-mono text-lg ${summary.patrimoineNet >= 0 ? "text-amber-300" : "text-rose-400"}`}>{formatMontant(summary.patrimoineNet, deviseBase)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Actifs − passifs</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("actifs")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${tab === "actifs" ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
          <Building size={13} /> Actifs immobilisés
        </button>
        <button onClick={() => setTab("passifs")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${tab === "passifs" ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
          <Landmark size={13} /> Prêts & passifs financiers
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-y border-slate-800">
                <th className="px-4 py-2 font-medium">Libellé</th>
                <th className="px-2 py-2 font-medium">Catégorie</th>
                <th className="px-2 py-2 font-medium text-right">{tab === "actifs" ? "Valeur" : "Montant initial"}</th>
                {tab === "passifs" && <th className="px-2 py-2 font-medium text-right">Solde</th>}
                {tab === "passifs" && <th className="px-2 py-2 font-medium text-right">Mensualité</th>}
                <th className="px-2 py-2 font-medium">{tab === "actifs" ? "Acquis le" : "Échéance"}</th>
                {tab === "passifs" && <th className="px-2 py-2 font-medium">Terme</th>}
                <th className="px-2 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={tab === "actifs" ? 5 : 8} className="text-center text-slate-500 text-xs py-8">
                  {tab === "actifs" ? "Aucun actif immobilisé enregistré." : "Aucun prêt ou passif financier enregistré."}
                </td></tr>
              )}
              {tab === "actifs" && assets.map((a) => (
                <tr key={a.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="px-4 py-2 text-slate-200">{a.name}{a.note && <span className="block text-[11px] text-slate-500">{a.note}</span>}</td>
                  <td className="px-2 py-2 text-slate-400 text-xs">{ASSET_CATEGORIES.find((c) => c.id === a.category)?.label || a.category}</td>
                  <td className="px-2 py-2 text-right font-mono text-emerald-400">{formatMontant(a.valeur, a.devise)}</td>
                  <td className="px-2 py-2 text-slate-400 text-xs">{a.date_acquisition || "—"}</td>
                  <td className="px-2 py-2">
                    {isOwner && <button onClick={() => setConfirmDelete({ kind: "asset", id: a.id })} className="text-slate-600 hover:text-rose-400 p-1"><Trash2 size={13} /></button>}
                  </td>
                </tr>
              ))}
              {tab === "passifs" && liabilities.map((l) => {
                const reste = Number(l.montant) - Number(l.montant_rembourse);
                const courtTerme = l.date_echeance && (new Date(l.date_echeance) - new Date()) <= 365 * 24 * 60 * 60 * 1000;
                return (
                  <tr key={l.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-slate-200">{l.name}{l.note && <span className="block text-[11px] text-slate-500">{l.note}</span>}</td>
                    <td className="px-2 py-2 text-slate-400 text-xs">{LIABILITY_CATEGORIES.find((c) => c.id === l.category)?.label || l.category}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-300">{formatMontant(l.montant, l.devise)}</td>
                    <td className="px-2 py-2 text-right font-mono text-rose-400">{formatMontant(reste, l.devise)}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-400">{l.mensualite ? formatMontant(l.mensualite, l.devise) : "—"}</td>
                    <td className="px-2 py-2 text-slate-400 text-xs">{l.date_echeance || "—"}</td>
                    <td className="px-2 py-2">
                      {l.date_echeance ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${courtTerme ? "border-amber-700/50 text-amber-300" : "border-slate-700 text-slate-400"}`}>
                          {courtTerme ? "Court terme" : "Long terme"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {l.statut === "actif" && (
                          <button onClick={() => setPaymentTarget(l)}
                            className="text-[10px] text-amber-300 hover:text-amber-200 border border-amber-700/50 rounded px-1.5 py-0.5">
                            + remboursement
                          </button>
                        )}
                        {isOwner && <button onClick={() => setConfirmDelete({ kind: "liability", id: l.id })} className="text-slate-600 hover:text-rose-400 p-1"><Trash2 size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && tab === "actifs" && (
        <AssetForm deviseBase={deviseBase} onClose={() => setShowForm(false)} onSubmit={addAsset} />
      )}
      {showForm && tab === "passifs" && (
        <LiabilityForm deviseBase={deviseBase} onClose={() => setShowForm(false)} onSubmit={addLiability} />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.kind === "asset" ? "Supprimer cet actif ?" : "Supprimer ce passif ?"}
          message="Cette action est définitive."
          confirmLabel="Supprimer"
          danger
          onConfirm={remove}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {paymentTarget && (
        <PromptDialog
          title="Remboursement effectué"
          label={`Montant (reste ${formatMontant(Number(paymentTarget.montant) - Number(paymentTarget.montant_rembourse), paymentTarget.devise)})`}
          type="number"
          placeholder="0"
          confirmLabel="Enregistrer"
          onSubmit={async (montant) => { await recordReimbursement(paymentTarget, montant); setPaymentTarget(null); }}
          onCancel={() => setPaymentTarget(null)}
        />
      )}
    </div>
  );
}

function AssetForm({ deviseBase, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("equipement");
  const [valeur, setValeur] = useState("");
  const [dateAcquisition, setDateAcquisition] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !valeur || Number(valeur) < 0) return;
    setSaving(true);
    await onSubmit({
      name: name.trim(),
      category,
      valeur: Number(valeur),
      devise: deviseBase,
      date_acquisition: dateAcquisition || null,
      note: note.trim() || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-50">Nouvel actif immobilisé</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Libellé</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex : Camionnette Renault, Local Bonabéri…"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100">
                {ASSET_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Valeur ({deviseBase})</label>
              <input type="number" min="0" value={valeur} onChange={(e) => setValeur(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Date d'acquisition</label>
            <input type="date" value={dateAcquisition} onChange={(e) => setDateAcquisition(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
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

function LiabilityForm({ deviseBase, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("pret_bancaire");
  const [montant, setMontant] = useState("");
  const [mensualite, setMensualite] = useState("");
  const [tauxInteret, setTauxInteret] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !montant || Number(montant) <= 0) return;
    setSaving(true);
    await onSubmit({
      name: name.trim(),
      category,
      montant: Number(montant),
      mensualite: mensualite ? Number(mensualite) : null,
      devise: deviseBase,
      taux_interet: tauxInteret ? Number(tauxInteret) : null,
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
          <h3 className="font-serif text-lg text-slate-50">Nouveau prêt / passif financier</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Libellé</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex : Prêt Afriland First Bank, Avance associé…"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100">
                {LIABILITY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Montant ({deviseBase})</label>
              <input type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Mensualité ({deviseBase})</label>
              <input type="number" min="0" value={mensualite} onChange={(e) => setMensualite(e.target.value)} placeholder="Optionnel"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Taux d'intérêt % (optionnel)</label>
              <input type="number" min="0" step="0.1" value={tauxInteret} onChange={(e) => setTauxInteret(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Échéance finale</label>
            <input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
          </div>
          <p className="text-[11px] text-slate-600">La mensualité et l'échéance servent au calcul du DSCR indicatif et de votre endettement (onglet Analyse).</p>
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
