import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, Phone, LogOut } from "lucide-react";
import PhoneInput from "./PhoneInput";
import { normalizePhone, DEFAULT_DIAL } from "../phoneAuth";

// Écran affiché une seule fois aux anciens comptes (créés avec un email) : ils ajoutent leur numéro,
// qui devient désormais leur identifiant de connexion.
export default function PhoneGate({ onLinked }) {
  const [dial, setDial] = useState(() => { try { return localStorage.getItem("ridix_dial") ?? DEFAULT_DIAL; } catch { return DEFAULT_DIAL; } });
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const key = normalizePhone(phone, dial);
    if (!key) { setError("Numéro invalide. Vérifiez l'indicatif et le numéro."); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnError } = await supabase.functions.invoke("link-phone", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { phone: key },
      });
      if (fnError) {
        let code = "";
        try { code = (await fnError.context?.json?.())?.error || ""; } catch { /* ignoré */ }
        if (code === "phone_taken") throw new Error("Ce numéro est déjà utilisé par un autre compte.");
        throw new Error("Impossible d'enregistrer le numéro pour le moment. Réessayez.");
      }
      if (!data?.ok) throw new Error("Impossible d'enregistrer le numéro pour le moment. Réessayez.");
      try { localStorage.setItem("ridix_dial", dial); } catch { /* ignoré */ }
      await supabase.auth.refreshSession();
      await onLinked();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 font-sans py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-3"><Phone size={22} /></div>
          <h1 className="font-serif text-2xl text-slate-50">Votre numéro de téléphone</h1>
          <p className="text-sm text-slate-400 mt-2">
            RIDIX se connecte désormais avec votre numéro de téléphone, à la place de l'email.
            Ajoutez-le une seule fois : vos données et votre mot de passe ne changent pas.
          </p>
        </div>
        <form onSubmit={submit} className="bg-slate-900/60 border border-slate-800 rounded-md p-6 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Numéro de téléphone</label>
            <PhoneInput dial={dial} onDialChange={setDial} value={phone} onChange={setPhone} autoFocus />
            <p className="text-[11px] text-slate-500 mt-1.5">À la prochaine connexion, saisissez ce numéro avec votre mot de passe habituel.</p>
          </div>
          {error && <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded-md px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-medium rounded-md py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />} Enregistrer mon numéro
          </button>
          <button type="button" onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 pt-1">
            <LogOut size={12} /> Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
