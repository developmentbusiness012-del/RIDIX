import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { CASH_ACCOUNT_TYPES } from "../constants";

export default function CashAccountForm({ deviseBase, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("caisse");
  const [soldeInitial, setSoldeInitial] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const { error: err } = await onSubmit({ name: name.trim(), type, devise: deviseBase, solde_initial: Number(soldeInitial) || 0 });
    setSaving(false);
    if (err) setError("Vous n'avez pas les droits pour créer un compte. Demandez à votre gestionnaire.");
    else onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-sm p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-50">Nouveau compte</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Nom du compte</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Orange Money, UBA, Caisse boutique…" autoFocus required
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100">
              {CASH_ACCOUNT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Solde actuel ({deviseBase})</label>
            <input type="number" step="any" value={soldeInitial} onChange={(e) => setSoldeInitial(e.target.value)} placeholder="0"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 font-mono" />
            <p className="text-[11px] text-slate-600 mt-1">Ce que ce compte contient déjà aujourd'hui. Les futures écritures s'ajouteront à partir de là.</p>
          </div>
        </div>
        {error && <p className="text-[11px] text-rose-400 mt-3">{error}</p>}
        <button type="submit" disabled={saving} className="w-full mt-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 size={14} className="animate-spin" />} Créer le compte
        </button>
      </form>
    </div>
  );
}
