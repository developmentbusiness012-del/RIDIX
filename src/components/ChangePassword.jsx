import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";

// Changement de mot de passe depuis les Paramètres (utile après une réinitialisation par le support).
export default function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (pwd.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (pwd !== confirm) { setError("Les deux mots de passe ne sont pas identiques."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setPwd(""); setConfirm("");
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 border border-slate-700 hover:border-amber-400/50 hover:bg-slate-800/50 rounded-md px-3 py-2.5 text-sm text-slate-200 transition-colors">
        <KeyRound size={16} className="text-amber-400" /> Changer mon mot de passe
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-slate-700 rounded-md p-3 space-y-2.5">
      <p className="text-sm text-slate-200 flex items-center gap-2"><KeyRound size={15} className="text-amber-400" /> Changer mon mot de passe</p>
      {done ? (
        <p className="text-xs text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={14} /> Mot de passe mis à jour.</p>
      ) : (
        <>
          <div className="relative">
            <input type={show ? "text" : "password"} required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Nouveau mot de passe"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 pr-10 text-sm" />
            <button type="button" tabIndex={-1} onClick={() => setShow((v) => !v)} className="absolute right-0 top-0 h-full px-3 text-slate-500 hover:text-slate-300">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <input type={show ? "text" : "password"} required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmer le mot de passe"
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm" />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-medium rounded-md py-2 text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 size={13} className="animate-spin" />} Enregistrer
            </button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }} className="px-3 text-sm text-slate-400 border border-slate-700 rounded-md">Annuler</button>
          </div>
        </>
      )}
    </form>
  );
}
