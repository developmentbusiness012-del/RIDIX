import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, UserCheck, Crown, Gift, Building2, Receipt, ArrowLeft, Loader2, BarChart3, MessageCircle } from "lucide-react";
import { supabase } from "../supabaseClient";
import AdminMessaging from "./AdminMessaging";
import { InfoDialog } from "./Dialogs";

export default function AdminDashboard({ onBack }) {
  const [tab, setTab] = useState("stats");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [planUpdating, setPlanUpdating] = useState(null);
  const [planErrorMsg, setPlanErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_dashboard_stats");
      if (error) setError(error.message);
      else setStats(data);
      setLoading(false);
    })();
  }, []);

  const toggleUserPlan = async (userId, currentPlan) => {
    const nextPlan = currentPlan === "premium" ? "freemium" : "premium";
    setPlanUpdating(userId);
    const { error } = await supabase.rpc("admin_set_user_plan", { target_user_id: userId, new_plan: nextPlan });
    if (!error) {
      setStats((prev) => ({
        ...prev,
        premium: nextPlan === "premium" ? prev.premium + 1 : prev.premium - 1,
        freemium: nextPlan === "freemium" ? prev.freemium + 1 : prev.freemium - 1,
        users: prev.users.map((u) => (u.id === userId ? { ...u, plan: nextPlan } : u)),
      }));
    } else {
      setPlanErrorMsg(error.message);
    }
    setPlanUpdating(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={20} /> Chargement des statistiques…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 px-4">
        <p className="text-rose-400 text-sm">{error}</p>
        <button onClick={onBack} className="text-xs text-amber-300 underline">Retour au registre</button>
      </div>
    );
  }

  const chartData = (stats.signups_last_30_days || []).map((d) => ({
    date: d.date.slice(5),
    inscriptions: d.count,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-100 p-2 -ml-2">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-serif text-2xl text-slate-50">Espace Admin</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Vue d'ensemble de la plateforme</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("stats")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border ${tab === "stats" ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
              <BarChart3 size={13} /> Statistiques
            </button>
            <button onClick={() => setTab("messages")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border ${tab === "messages" ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
              <MessageCircle size={13} /> Messagerie
            </button>
          </div>
        </header>

        {tab === "messages" ? (
          <AdminMessaging />
        ) : (
        <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard label="Utilisateurs totaux" value={stats.total_users} icon={Users} accent="border-l-amber-400" />
          <StatCard label="Actifs (7 jours)" value={stats.active_7d} icon={UserCheck} accent="border-l-emerald-400" />
          <StatCard label="Propriétaires" value={stats.total_owners} icon={Building2} accent="border-l-indigo-400" />
          <StatCard label="Employés" value={stats.total_employees} icon={Users} accent="border-l-indigo-400" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Freemium" value={stats.freemium} icon={Gift} accent="border-l-slate-400" />
          <StatCard label="Premium" value={stats.premium} icon={Crown} accent="border-l-amber-400" />
          <StatCard label="Entreprises créées" value={stats.total_companies} icon={Building2} accent="border-l-emerald-400" />
          <StatCard label="Écritures enregistrées" value={stats.total_transactions} icon={Receipt} accent="border-l-rose-400" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="col-span-3 sm:col-span-1 bg-slate-900/60 border border-slate-800 rounded-md p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Actifs 24h</p>
            <p className="font-mono text-2xl text-slate-50">{stats.active_24h}</p>
          </div>
          <div className="col-span-3 sm:col-span-1 bg-slate-900/60 border border-slate-800 rounded-md p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Actifs 30j</p>
            <p className="font-mono text-2xl text-slate-50">{stats.active_30d}</p>
          </div>
          <div className="col-span-3 sm:col-span-1 bg-slate-900/60 border border-slate-800 rounded-md p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Taux conversion Premium</p>
            <p className="font-mono text-2xl text-amber-300">
              {stats.total_owners > 0 ? ((stats.premium / stats.total_owners) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 mb-6">
          <h3 className="font-serif text-sm text-slate-300 mb-3">Inscriptions — 30 derniers jours</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="inscriptions" stroke="#fbbf24" fill="url(#signupGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden mb-10">
          <h3 className="font-serif text-sm text-slate-300 px-4 pt-4 pb-2">Utilisateurs ({(stats.users || []).length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-y border-slate-800">
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-2 py-2 font-medium">Rôle</th>
                  <th className="px-2 py-2 font-medium">Offre</th>
                  <th className="px-2 py-2 font-medium">Entreprises</th>
                  <th className="px-2 py-2 font-medium">Inscrit le</th>
                  <th className="px-2 py-2 font-medium">Dernière connexion</th>
                  <th className="px-2 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(stats.users || []).map((u, i) => (
                  <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-slate-300">{u.email}</td>
                    <td className="px-2 py-2">
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${u.role === "owner" ? "text-indigo-300 border-indigo-400" : "text-slate-400 border-slate-600"}`}>
                        {u.role === "owner" ? "propriétaire" : "employé"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`text-xs ${u.plan === "premium" ? "text-amber-300" : "text-slate-400"}`}>{u.plan || "—"}</span>
                    </td>
                    <td className="px-2 py-2 text-slate-400 font-mono text-xs">{u.companies_count}</td>
                    <td className="px-2 py-2 text-slate-500 font-mono text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="px-2 py-2 text-slate-500 font-mono text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("fr-FR") : "Jamais"}</td>
                    <td className="px-2 py-2 text-right">
                      {u.role === "owner" ? (
                        <button
                          onClick={() => toggleUserPlan(u.id, u.plan)}
                          disabled={planUpdating === u.id}
                          className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md border ml-auto disabled:opacity-50 ${
                            u.plan === "premium"
                              ? "border-slate-700 text-slate-400 hover:border-rose-700 hover:text-rose-300"
                              : "border-amber-700/50 text-amber-300 hover:bg-amber-900/30"
                          }`}
                        >
                          {planUpdating === u.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : u.plan === "premium" ? (
                            <Gift size={11} />
                          ) : (
                            <Crown size={11} />
                          )}
                          {u.plan === "premium" ? "Repasser Freemium" : "Passer Premium"}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600">hérité du patron</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}
      </div>
      {planErrorMsg && (
        <InfoDialog title="Impossible de modifier le plan" message={planErrorMsg} danger onClose={() => setPlanErrorMsg(null)} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className={`bg-slate-900/60 border border-slate-800 border-l-4 ${accent} rounded-md p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
        <Icon size={15} className="text-slate-500" />
      </div>
      <p className="font-mono text-xl text-slate-50 tabular-nums">{value ?? 0}</p>
    </div>
  );
}
