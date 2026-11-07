import { useState } from "react";
import { Loader2, X, Check } from "lucide-react";
import { BUSINESS_TYPE_LIST } from "../businessProfiles";

// Choix du type d'activité : 3 grandes cartes (téléphone : empilées).
export default function BusinessTypePicker({ value, onChange, compact = false }) {
  return (
    <div className="grid gap-2.5" role="radiogroup" aria-label="Type d'activité">
      {BUSINESS_TYPE_LIST.map((t) => {
        const selected = value === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t.id)}
            className={`text-left flex items-start gap-3 rounded-xl border px-3.5 ${compact ? "py-2.5" : "py-3.5"} transition-colors ${
              selected ? "border-amber-400 bg-amber-400/10" : "border-slate-700 hover:border-slate-500 active:bg-slate-800/60"
            }`}
          >
            <span className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${selected ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-300"}`}>
              <Icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-100">{t.label}</span>
                {selected && <Check size={15} className="text-amber-300 shrink-0" />}
              </span>
              <span className="block text-xs text-slate-400 mt-0.5">{t.tagline}</span>
              {!compact && <span className="block text-[11px] text-slate-500 mt-1">{t.examples}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Écran affiché au propriétaire dont l'entreprise n'a pas encore de type d'activité.
export function BusinessTypeSetup({ companyName, onSave, onLater }) {
  const [type, setType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!type) return;
    setSaving(true);
    setError("");
    const err = await onSave(type);
    if (err) { setError("Impossible d'enregistrer pour le moment. Réessayez."); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-slate-950 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-400 mb-2">{companyName}</p>
            <h1 className="font-serif text-2xl text-slate-50">Quel est le type de votre activité ?</h1>
            <p className="text-sm text-slate-400 mt-2">RIDIX adapte votre tableau de bord, vos catégories, vos indicateurs et vos alertes à votre métier. Vous pourrez le modifier dans les paramètres.</p>
          </div>
          <BusinessTypePicker value={type} onChange={setType} />
          {error && <p className="text-xs text-rose-400 mt-3">{error}</p>}
          <button
            onClick={save}
            disabled={!type || saving}
            className="w-full mt-5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-medium rounded-lg py-3 text-sm flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={15} className="animate-spin" />} Adapter RIDIX à mon activité
          </button>
          {onLater && (
            <button onClick={onLater} className="w-full mt-2 text-xs text-slate-500 hover:text-slate-300 py-2">Plus tard</button>
          )}
        </div>
      </div>
    </div>
  );
}

// Création d'une entreprise supplémentaire : nom + type d'activité
export function NewCompanyDialog({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !type) return;
    setLoading(true);
    await onSubmit(name.trim(), type);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-[300] sm:p-4" onClick={onCancel}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-xl w-full max-w-md p-5 max-h-[92dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-base text-slate-50">Nouvelle entreprise</h3>
          <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-200 p-1"><X size={16} /></button>
        </div>
        <label className="block text-xs text-slate-400 mb-1">Nom de l'entreprise</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Boutique Mokolo"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-base sm:text-sm mb-4"
        />
        <label className="block text-xs text-slate-400 mb-2">Type d'activité</label>
        <BusinessTypePicker value={type} onChange={setType} compact />
        <button
          type="submit"
          disabled={!name.trim() || !type || loading}
          className="w-full mt-5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-medium rounded-lg py-3 text-sm flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={15} className="animate-spin" />} Créer l'entreprise
        </button>
      </form>
    </div>
  );
}
