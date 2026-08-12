import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";

// Remplace window.confirm() — fiable en PWA installée, contrairement au natif.
export function ConfirmDialog({ title, message, confirmLabel = "Confirmer", danger = false, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-[300] p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm p-5">
        <div className="flex items-start gap-3 mb-4">
          {danger && <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />}
          <div>
            <h3 className="font-serif text-base text-slate-50">{title}</h3>
            {message && <p className="text-sm text-slate-400 mt-1">{message}</p>}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={loading} className="text-sm px-3 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-60">
            Annuler
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className={`text-sm px-3 py-2 rounded-md font-medium disabled:opacity-60 flex items-center gap-1.5 ${danger ? "bg-rose-500 hover:bg-rose-400 text-white" : "bg-amber-400 hover:bg-amber-300 text-slate-950"}`}>
            {loading && <Loader2 size={13} className="animate-spin" />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Remplace window.prompt() — champ texte ou nombre dans une vraie fenêtre de l'app.
// Variante "confirmWord" : pour les actions irréversibles, exige de retaper un mot exact.
export function PromptDialog({ title, label, type = "text", defaultValue = "", placeholder = "", confirmLabel = "Valider", confirmWord = null, danger = false, onSubmit, onCancel }) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!value) return;
    if (confirmWord && value.trim().toUpperCase() !== confirmWord.toUpperCase()) return;
    if (!confirmWord && type === "number" && Number(value) <= 0) return;
    setLoading(true);
    await onSubmit(type === "number" ? Number(value) : value);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-[300] p-4">
      <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-base text-slate-50">{title}</h3>
          <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-200"><X size={16} /></button>
        </div>
        {label && <label className="block text-xs text-slate-400 mb-1">{label}</label>}
        <input
          type={type}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          min={type === "number" ? "0" : undefined}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className="text-sm px-3 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-60">
            Annuler
          </button>
          <button type="submit" disabled={loading || (confirmWord && value.trim().toUpperCase() !== confirmWord.toUpperCase())}
            className={`text-sm px-3 py-2 rounded-md font-medium disabled:opacity-40 flex items-center gap-1.5 ${danger ? "bg-rose-500 hover:bg-rose-400 text-white" : "bg-amber-400 hover:bg-amber-300 text-slate-950"}`}>
            {loading && <Loader2 size={13} className="animate-spin" />} {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

// Remplace window.alert() — message d'info/erreur en fenêtre, pas de bandeau natif silencieux.
export function InfoDialog({ title, message, danger = false, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-[300] p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm p-5">
        <div className="flex items-start gap-3 mb-4">
          {danger && <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />}
          <div>
            <h3 className="font-serif text-base text-slate-50">{title}</h3>
            {message && <p className="text-sm text-slate-400 mt-1">{message}</p>}
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="text-sm px-3 py-2 rounded-md font-medium bg-amber-400 hover:bg-amber-300 text-slate-950">
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}
