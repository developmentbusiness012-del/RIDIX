import { useState, useEffect, useMemo } from "react";
import { X, Loader2, Wallet, TrendingDown, TrendingUp, Percent } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatMontant } from "../constants";

export default function EmployeeKpiModal({ employee, companyId, deviseBase, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("company_id", companyId)
        .eq("created_by", employee.user_id)
        .order("date", { ascending: false });
      setTransactions(data || []);
      setLoading(false);
    })();
  }, [employee.user_id, companyId]);

  const kpis = useMemo(() => {
    const ca = transactions.filter((t) => t.sens === "recette").reduce((s, t) => s + Number(t.montant_base), 0);
    const dep = transactions.filter((t) => t.sens === "depense").reduce((s, t) => s + Number(t.montant_base), 0);
    const profit = ca - dep;
    const marge = ca > 0 ? (profit / ca) * 100 : 0;
    return { ca, dep, profit, marge };
  }, [transactions]);

  const displayName = employee.name || employee.email || "Employé";

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-end sm:items-center justify-center z-[300] p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 mb-1">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-mono">Chiffres de</p>
            <h3 className="font-serif text-lg text-slate-50">{displayName}</h3>
            {employee.email && employee.name && <p className="text-xs text-slate-500">{employee.email}</p>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-14 justify-center">
            <Loader2 className="animate-spin" size={16} /> Chargement…
          </div>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 mb-5">
              <MiniKpi label="Recettes" value={formatMontant(kpis.ca, deviseBase)} icon={Wallet} accent="border-l-emerald-400" />
              <MiniKpi label="Dépenses" value={formatMontant(kpis.dep, deviseBase)} icon={TrendingDown} accent="border-l-rose-400" />
              <MiniKpi label="Solde net" value={formatMontant(kpis.profit, deviseBase)} icon={TrendingUp} accent={kpis.profit >= 0 ? "border-l-amber-400" : "border-l-rose-500"} />
              <MiniKpi label="Marge" value={`${kpis.marge.toFixed(1)} %`} icon={Percent} accent="border-l-indigo-400" />
            </div>

            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{transactions.length} écriture{transactions.length > 1 ? "s" : ""} enregistrée{transactions.length > 1 ? "s" : ""}</p>
            <div className="bg-slate-800/40 border border-slate-800 rounded-md divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
              {transactions.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">Aucune écriture enregistrée par cet employé.</p>
              )}
              {transactions.slice(0, 30).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-slate-400">{t.date} · {t.libelle || t.categorie}</span>
                  <span className={`font-mono ${t.sens === "recette" ? "text-emerald-400" : "text-rose-400"}`}>
                    {t.sens === "recette" ? "+" : "-"}{formatMontant(t.montant_base, "")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniKpi({ label, value, icon: Icon, accent }) {
  return (
    <div className={`bg-slate-800/40 border-l-4 ${accent} border-t border-r border-b border-slate-800 rounded-md p-3`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon size={13} className="text-slate-600" />
      </div>
      <p className="font-mono text-sm text-slate-100">{value}</p>
    </div>
  );
}
