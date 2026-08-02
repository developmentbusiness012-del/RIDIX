import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { startPremiumCheckout } from "../payments";
import { PLANS, EMPLOYEE_RESTRICTIONS, EMPLOYEE_ALLOWED } from "../constants";

export default function Pricing({ userId, onDone }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const choose = async (planId) => {
    setError(null);
    setLoading(planId);
    try {
      if (planId === "premium") {
        // On marque d'abord l'onboarding comme fait (en freemium) pour que l'utilisateur
        // retrouve son compte normalement s'il abandonne le paiement en cours de route.
        await supabase.from("account_settings").update({ onboarded: true }).eq("user_id", userId);
        await startPremiumCheckout(); // redirige vers Maketou, ne revient pas ici
        return;
      }
      await supabase.from("account_settings").update({ plan: planId, onboarded: true }).eq("user_id", userId);
      onDone(planId);
    } catch (e) {
      console.error(e);
      setError("Impossible de démarrer le paiement. Réessayez dans un instant.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-slate-50 mb-2">Choisissez votre offre</h1>
          <p className="text-slate-400 text-sm">Vous pourrez changer d'offre à tout moment depuis les paramètres.</p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 text-sm text-rose-300 bg-rose-400/10 border border-rose-400/30 rounded-md px-4 py-2 text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {PLANS.map((p) => (
            <div key={p.id} className={`rounded-lg border p-6 flex flex-col ${p.id === "premium" ? "border-amber-400 bg-amber-400/5" : "border-slate-800 bg-slate-900/60"}`}>
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-serif text-xl text-slate-50">{p.label}</h2>
                <span className="text-sm font-mono text-amber-300">{p.price}</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">{p.tagline}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check size={15} className="text-emerald-400 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(p.id)}
                disabled={loading !== null}
                className={`w-full rounded-md py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  p.id === "premium" ? "bg-amber-400 hover:bg-amber-300 text-slate-950" : "bg-slate-800 hover:bg-slate-700 text-slate-100"
                } disabled:opacity-60`}
              >
                {loading === p.id && <Loader2 size={14} className="animate-spin" />}
                {p.id === "premium" ? "Payer et passer en Premium" : `Choisir ${p.label}`}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
          <h3 className="font-serif text-base text-slate-100 mb-3">Détail des restrictions employé (offre Premium)</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-400 mb-2">Un employé peut</p>
              <ul className="space-y-1.5">
                {EMPLOYEE_ALLOWED.map((t) => <li key={t} className="text-sm text-slate-300">• {t}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-rose-400 mb-2">Un employé ne peut pas</p>
              <ul className="space-y-1.5">
                {EMPLOYEE_RESTRICTIONS.map((t) => <li key={t} className="text-sm text-slate-400">• {t}</li>)}
              </ul>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Les employés se connectent avec le code entreprise généré automatiquement, visible dans les paramètres de l'entreprise.
          </p>
        </div>
      </div>
    </div>
  );
}
