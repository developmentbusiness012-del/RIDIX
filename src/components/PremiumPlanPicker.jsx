import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { PLANS } from "../constants";
import { startPremiumCheckout } from "../payments";

const PREMIUM_PLANS = PLANS.filter((p) => p.planKey);

export default function PremiumPlanPicker({ onClose }) {
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState(null);

  const choose = async (planKey) => {
    setError(null);
    setLoadingKey(planKey);
    try {
      await startPremiumCheckout(planKey); // redirige vers Maketou, ne revient pas ici
    } catch (e) {
      console.error(e);
      setError("Impossible de démarrer le paiement. Réessayez dans un instant.");
      setLoadingKey(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-end sm:items-center justify-center z-[300] p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-50">Choisissez votre formule</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-rose-300 bg-rose-400/10 border border-rose-400/30 rounded-md px-3 py-2">{error}</div>
        )}

        <div className="space-y-3">
          {PREMIUM_PLANS.map((p) => (
            <button
              key={p.planKey}
              onClick={() => choose(p.planKey)}
              disabled={loadingKey !== null}
              className={`w-full text-left rounded-lg border p-4 transition-colors disabled:opacity-60 ${p.promo ? "border-amber-400 bg-amber-400/5 hover:bg-amber-400/10" : "border-slate-700 hover:border-slate-500"}`}
            >
              {p.promo && (
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wide bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-full px-2 py-0.5 mb-2">
                  {p.promoLabel}
                </span>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif text-base text-slate-50">{p.label}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {loadingKey === p.planKey && <Loader2 size={14} className="animate-spin text-amber-400" />}
                  {p.originalPrice && <span className="text-xs text-slate-600 line-through">{p.originalPrice}</span>}
                  <span className="font-mono text-amber-300">{p.price}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{p.tagline}</p>
              <ul className="space-y-1">
                {p.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-slate-400">
                    <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
