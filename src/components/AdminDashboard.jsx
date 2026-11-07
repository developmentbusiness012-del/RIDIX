import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, UserCheck, Crown, Gift, Building2, Receipt, ArrowLeft, Loader2, MessageCircle, Globe2, Handshake, Banknote,
  LayoutDashboard, Search, Percent, TrendingUp, TrendingDown, Wallet, ChevronRight, KeyRound, RefreshCw,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { InfoDialog, ConfirmDialog } from "./Dialogs";
import { displayContact } from "../phoneAuth";
import { formatMontant } from "../constants";
import { BUSINESS_TYPES } from "../businessProfiles";
import { Kpi, Card, Chips, Badge, inputCls } from "./AdminUI";

// Les onglets lourds sont chargés à la demande : l'espace admin s'ouvre plus vite.
const AdminMessaging = lazy(() => import("./AdminMessaging"));
const AdminReferrals = lazy(() => import("./AdminReferrals"));
const AdminFinances = lazy(() => import("./AdminFinances"));

const TABS = [
  { id: "overview", label: "Aperçu", icon: LayoutDashboard },
  { id: "finances", label: "Finances", icon: Banknote },
  { id: "referrals", label: "Parrainage", icon: Handshake },
  { id: "users", label: "Clients", icon: Users },
  { id: "messages", label: "Messages", icon: MessageCircle },
];

const PLAN_DURATIONS = { premium_1m: 30, premium_2m: 60, premium_2y: 730, premium_unlimited: null };
const monthRange = () => {
  const n = new Date();
  const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: f(new Date(n.getFullYear(), n.getMonth(), 1)), to: f(new Date(n.getFullYear(), n.getMonth() + 1, 0)) };
};
const frDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

function TabFallback() {
  return <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-16"><Loader2 size={16} className="animate-spin" /> Chargement…</div>;
}

export default function AdminDashboard({ onBack }) {
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem("admin_tab") || "overview"; } catch { return "overview"; } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [fin, setFin] = useState(null); // synthèse financière du mois (Aperçu)
  const [unread, setUnread] = useState(0);
  const [planUpdating, setPlanUpdating] = useState(null);
  const [planErrorMsg, setPlanErrorMsg] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetResult, setResetResult] = useState(null);

  const goTab = useCallback((id) => {
    setTab(id);
    try { sessionStorage.setItem("admin_tab", id); } catch { /* ignoré */ }
    window.scrollTo({ top: 0 });
  }, []);

  const loadUnread = useCallback(async () => {
    const { data, error: err } = await supabase.rpc("admin_list_message_threads");
    if (!err) setUnread((data || []).reduce((s, t) => s + Number(t.unread_count || 0), 0));
  }, []);

  const loadAll = useCallback(async () => {
    const { from, to } = monthRange();
    const [s, f] = await Promise.all([
      supabase.rpc("admin_dashboard_stats"),
      supabase.rpc("admin_business_report", { p_from: from, p_to: to }),
    ]);
    if (s.error) setError(s.error.message); else setStats(s.data);
    if (!f.error) setFin(f.data);
    setLoading(false);
    loadUnread();
  }, [loadUnread]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Quand on quitte la messagerie, le compteur de messages non lus est rafraîchi.
  useEffect(() => { if (tab !== "messages") loadUnread(); }, [tab, loadUnread]);

  const setUserPlan = async (userId, choice) => {
    const isFreemium = choice === "freemium";
    const newPlan = isFreemium ? "freemium" : "premium";
    setPlanUpdating(userId);
    const { error: err } = await supabase.rpc("admin_set_user_plan", {
      target_user_id: userId, new_plan: newPlan, duration_days: isFreemium ? null : PLAN_DURATIONS[choice],
    });
    if (!err) {
      setStats((prev) => {
        const wasPremium = prev.users.find((u) => u.id === userId)?.plan === "premium";
        const delta = wasPremium === (newPlan === "premium") ? 0 : newPlan === "premium" ? 1 : -1;
        return { ...prev, premium: prev.premium + delta, freemium: prev.freemium - delta, users: prev.users.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u)) };
      });
    } else {
      setPlanErrorMsg(err.message);
    }
    setPlanUpdating(null);
  };

  // Les comptes connectés par numéro n'ont pas d'email : le mot de passe est réinitialisé par l'administrateur,
  // qui transmet le mot de passe temporaire à l'utilisateur (ex : par WhatsApp).
  const resetPassword = async () => {
    const user = resetTarget;
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error: err } = await supabase.functions.invoke("admin-reset-password", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { userId: user.id },
    });
    setResetTarget(null);
    if (err || !data?.password) setPlanErrorMsg("La réinitialisation du mot de passe a échoué. Réessayez.");
    else setResetResult({ user, password: data.password });
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={20} /> Chargement de l'espace admin…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 px-4">
        <p className="text-rose-400 text-sm text-center">{error}</p>
        <button onClick={onBack} className="text-xs text-amber-300 underline">Retour à l'application</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 font-sans">
      {/* En-tête fixe */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={onBack} aria-label="Retour à l'application" className="text-slate-400 hover:text-slate-100 active:bg-slate-800 p-2 -ml-2 rounded-lg shrink-0">
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="font-serif text-lg text-slate-50 leading-tight truncate">Espace administrateur</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">RIDIX · {TABS.find((t) => t.id === tab)?.label}</p>
              </div>
            </div>
            <button onClick={loadAll} aria-label="Actualiser" className="text-slate-500 hover:text-slate-200 active:bg-slate-800 p-2 rounded-lg shrink-0"><RefreshCw size={16} /></button>
          </div>
          {/* Onglets (ordinateur) */}
          <nav className="hidden md:flex gap-1 -mb-px" aria-label="Sections">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => goTab(t.id)}
                className={`flex items-center gap-2 text-sm px-4 py-3 border-b-2 transition-colors ${tab === t.id ? "border-amber-400 text-amber-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
                <t.icon size={15} /> {t.label}
                {t.id === "messages" && unread > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{unread}</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10">
        <Suspense fallback={<TabFallback />}>
          {tab === "overview" && <Overview stats={stats} fin={fin} onNavigate={goTab} />}
          {tab === "finances" && <AdminFinances />}
          {tab === "referrals" && <AdminReferrals />}
          {tab === "users" && <UsersPanel users={stats.users || []} planUpdating={planUpdating} onPlan={setUserPlan} onReset={setResetTarget} />}
          {tab === "messages" && <AdminMessaging />}
        </Suspense>
      </main>

      {/* Barre de navigation du bas (téléphone) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-950/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)]" aria-label="Sections">
        <div className="grid grid-cols-5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => goTab(t.id)} aria-current={tab === t.id ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 min-h-[58px] transition-colors ${tab === t.id ? "text-amber-300" : "text-slate-500 active:text-slate-300"}`}>
              <span className="relative">
                <t.icon size={21} strokeWidth={tab === t.id ? 2.3 : 1.8} />
                {t.id === "messages" && unread > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{unread}</span>
                )}
              </span>
              <span className="text-[10px] leading-none">{t.label}</span>
              {tab === t.id && <span className="absolute top-0 h-0.5 w-8 bg-amber-400 rounded-full" />}
            </button>
          ))}
        </div>
      </nav>

      {resetTarget && (
        <ConfirmDialog
          title="Réinitialiser le mot de passe ?"
          message={`Un mot de passe temporaire sera généré pour ${displayContact(resetTarget.email)}. L'ancien mot de passe ne fonctionnera plus.`}
          confirmLabel="Générer"
          onConfirm={resetPassword}
          onCancel={() => setResetTarget(null)}
        />
      )}
      {resetResult && (
        <InfoDialog
          title="Mot de passe temporaire"
          message={`${displayContact(resetResult.user.email)} → ${resetResult.password}  —  Transmettez-le à l'utilisateur (WhatsApp). Il pourra le changer dans Paramètres > Changer mon mot de passe. Il ne sera plus affiché après fermeture.`}
          onClose={() => setResetResult(null)}
        />
      )}
      {planErrorMsg && <InfoDialog title="Action impossible" message={planErrorMsg} danger onClose={() => setPlanErrorMsg(null)} />}
    </div>
  );
}

// ======================================================================================
//  Aperçu : l'essentiel d'un coup d'œil
// ======================================================================================
function Overview({ stats, fin, onNavigate }) {
  const [types, setTypes] = useState(null); // entreprises par type d'activité
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_business_type_counts");
      if (!error) setTypes(data);
    })();
  }, []);
  const conversion = stats.total_owners > 0 ? (stats.premium / stats.total_owners) * 100 : 0;
  const chartData = (stats.signups_last_30_days || []).map((d) => ({ date: d.date.slice(5), inscriptions: d.count }));
  const countries = stats.by_country || [];
  const maxCountry = Math.max(1, ...countries.map((c) => Number(c.count)));
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const net = fin ? Number(fin.net) : 0;

  return (
    <div className="space-y-4">
      {/* Synthèse financière du mois */}
      {fin && (
        <Card
          title={`Finances — ${monthName}`}
          icon={Banknote}
          right={<button onClick={() => onNavigate("finances")} className="text-xs text-amber-300 flex items-center gap-0.5 py-1 -my-1 pl-2">Détail <ChevronRight size={14} /></button>}
        >
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <MiniStat icon={TrendingUp} label="Chiffre d'affaires" value={formatMontant(fin.revenue, "")} tone="text-emerald-300" />
            <MiniStat icon={TrendingDown} label="Dépenses" value={formatMontant(fin.expenses, "")} tone="text-rose-300" />
            <MiniStat icon={Wallet} label="Résultat" value={formatMontant(fin.net, "")} tone={net >= 0 ? "text-amber-300" : "text-rose-300"} />
          </div>
          <p className="text-[10px] text-slate-600 mt-2.5">Montants en FCFA · {fin.best_offer ? `Offre la plus rentable : ${fin.best_offer.label}` : "Aucun abonnement vendu ce mois-ci"}</p>
        </Card>
      )}

      {/* Clients */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={Users} label="Utilisateurs" value={stats.total_users} sub={`${stats.total_owners} propriétaires · ${stats.total_employees} employés`} onClick={() => onNavigate("users")} />
        <Kpi icon={Crown} label="Premium" value={stats.premium} tone="text-amber-300" onClick={() => onNavigate("users")} />
        <Kpi icon={Gift} label="Freemium" value={stats.freemium} iconTone="text-slate-400" onClick={() => onNavigate("users")} />
        <Kpi icon={Percent} label="Conversion" value={`${conversion.toFixed(0)} %`} sub="Premium / propriétaires" tone="text-amber-300" />
        <Kpi icon={Building2} label="Entreprises" value={stats.total_companies} iconTone="text-emerald-400" />
        <Kpi icon={Receipt} label="Écritures" value={stats.total_transactions} iconTone="text-rose-400" />
      </div>

      {/* Activité */}
      <Card title="Utilisateurs actifs" icon={UserCheck}>
        <div className="grid grid-cols-3 divide-x divide-slate-800 text-center">
          {[["24 heures", stats.active_24h], ["7 jours", stats.active_7d], ["30 jours", stats.active_30d]].map(([label, v]) => (
            <div key={label} className="px-2">
              <p className="font-mono text-2xl text-slate-50 tabular-nums">{v ?? 0}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {types && (
        <Card title="Entreprises par type d'activité" icon={Building2}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["services", "detail", "gros"].map((id) => {
              const t = BUSINESS_TYPES[id];
              return (
                <div key={id} className="border border-slate-800 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1"><t.icon size={13} className="text-amber-400" /> <span className="truncate">{t.label}</span></div>
                  <p className="font-mono text-xl text-slate-50 tabular-nums">{types[id]}</p>
                </div>
              );
            })}
            <div className="border border-dashed border-slate-700 rounded-lg px-3 py-2.5">
              <div className="text-[11px] text-slate-500 mb-1">Non renseigné</div>
              <p className="font-mono text-xl text-slate-400 tabular-nums">{types.unset}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Inscriptions — 30 derniers jours">
          <div className="h-48 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} interval="preserveStartEnd" minTickGap={24} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} width={28} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="inscriptions" stroke="#fbbf24" fill="url(#signupGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Utilisateurs par pays" icon={Globe2}>
          {countries.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune donnée pour l'instant.</p>
          ) : (
            <ul className="space-y-2.5">
              {countries.map((c) => (
                <li key={c.country}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate">{c.country}</span>
                    <span className="font-mono text-amber-300 ml-2 shrink-0">{c.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-400/80" style={{ width: `${(Number(c.count) / maxCountry) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-2 gap-3">
        <ShortcutButton icon={Handshake} label="Parrainage" onClick={() => onNavigate("referrals")} />
        <ShortcutButton icon={MessageCircle} label="Messagerie" onClick={() => onNavigate("messages")} />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1"><Icon size={11} /> <span className="truncate">{label}</span></div>
      <p className={`font-mono text-[0.95rem] sm:text-lg tabular-nums leading-tight ${tone}`}>{value}</p>
    </div>
  );
}

function ShortcutButton({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between gap-2 bg-slate-900/60 border border-slate-800 hover:border-slate-700 active:bg-slate-800/70 rounded-xl px-3.5 py-3.5 text-left">
      <span className="flex items-center gap-2 text-sm text-slate-200 min-w-0"><Icon size={16} className="text-amber-400 shrink-0" /> <span className="truncate">{label}</span></span>
      <ChevronRight size={15} className="text-slate-600 shrink-0" />
    </button>
  );
}

// ======================================================================================
//  Clients : recherche, filtres, cartes (téléphone) / tableau (ordinateur)
// ======================================================================================
function UsersPanel({ users, planUpdating, onPlan, onReset }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const sorted = useMemo(() => [...users].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)), [users]);
  const counts = useMemo(() => ({
    all: users.length,
    premium: users.filter((u) => u.role === "owner" && u.plan === "premium").length,
    freemium: users.filter((u) => u.role === "owner" && u.plan !== "premium").length,
    employee: users.filter((u) => u.role !== "owner").length,
  }), [users]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[\s+]/g, "");
    return sorted.filter((u) => {
      if (filter === "premium" && !(u.role === "owner" && u.plan === "premium")) return false;
      if (filter === "freemium" && !(u.role === "owner" && u.plan !== "premium")) return false;
      if (filter === "employee" && u.role === "owner") return false;
      if (!q) return true;
      const hay = `${displayContact(u.email) || ""} ${u.phone || ""} ${u.country || ""}`.toLowerCase().replace(/[\s+]/g, "");
      return hay.includes(q);
    });
  }, [sorted, query, filter]);

  const identity = (u) => displayContact(u.email) || "—";
  const showPhone = (u) => u.phone && u.phone.replace(/\D/g, "") !== String(identity(u)).replace(/\D/g, "");

  const planSelect = (u, full) => (
    <div className={`relative ${full ? "w-full" : "inline-block"}`}>
      <select
        value=""
        onChange={(e) => e.target.value && onPlan(u.id, e.target.value)}
        disabled={planUpdating === u.id}
        aria-label="Modifier l'offre"
        className={`${full ? "w-full py-2.5 text-sm" : "text-[11px] py-1.5"} pl-3 pr-7 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-50 appearance-none cursor-pointer hover:border-amber-700/50`}
      >
        <option value="" disabled>{planUpdating === u.id ? "…" : "Modifier l'offre"}</option>
        <option value="freemium" disabled={u.plan === "freemium"}>Freemium</option>
        <option value="premium_1m">Premium — 1 mois</option>
        <option value="premium_2m">Premium — 2 mois</option>
        <option value="premium_2y">Premium — 2 ans</option>
        <option value="premium_unlimited">Premium — illimité (admin)</option>
      </select>
      {planUpdating === u.id
        ? <Loader2 size={12} className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        : <ChevronRight size={13} className="rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />}
    </div>
  );

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-serif text-lg text-slate-100 flex items-center gap-2"><Users size={18} className="text-amber-400" /> Clients</h2>
        <p className="text-xs text-slate-500 mt-0.5">Comptes, offres et accès des utilisateurs.</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (numéro, email, pays)" inputMode="search" className={`${inputCls} pl-9`} />
      </div>

      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { id: "all", label: "Tous", count: counts.all },
          { id: "premium", label: "Premium", count: counts.premium },
          { id: "freemium", label: "Freemium", count: counts.freemium },
          { id: "employee", label: "Employés", count: counts.employee },
        ]}
      />

      {shown.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-10 bg-slate-900/40 border border-slate-800 rounded-xl">Aucun utilisateur ne correspond.</p>
      ) : (
        <>
          {/* Téléphone : cartes */}
          <ul className="md:hidden space-y-2.5">
            {shown.map((u) => (
              <li key={u.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-100 font-medium break-all">{identity(u)}</p>
                    {showPhone(u) && <p className="text-xs text-slate-500 font-mono mt-0.5">{u.phone}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge tone={u.role === "owner" ? "indigo" : "slate"}>{u.role === "owner" ? "propriétaire" : "employé"}</Badge>
                    {u.role === "owner" && <Badge tone={u.plan === "premium" ? "amber" : "slate"}>{u.plan === "premium" ? "premium" : "freemium"}</Badge>}
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                  <div><dt className="text-slate-600">Pays</dt><dd className="text-slate-300 truncate">{u.country || "—"}</dd></div>
                  <div><dt className="text-slate-600">Inscrit le</dt><dd className="text-slate-300">{frDate(u.created_at)}</dd></div>
                  <div><dt className="text-slate-600">Connexion</dt><dd className="text-slate-300">{u.last_sign_in_at ? frDate(u.last_sign_in_at) : "Jamais"}</dd></div>
                </dl>
                <div className="flex gap-2 mt-3">
                  <div className="flex-1 min-w-0">
                    {u.role === "owner" ? planSelect(u, true) : <p className="text-[11px] text-slate-600 py-2.5">Offre héritée du patron</p>}
                  </div>
                  <button onClick={() => onReset(u)} className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-lg border border-slate-700 text-slate-300 active:bg-slate-800">
                    <KeyRound size={13} /> Mot de passe
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Ordinateur : tableau */}
          <div className="hidden md:block bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-800">
                    <th className="px-4 py-2.5 font-medium">Utilisateur</th>
                    <th className="px-2 py-2.5 font-medium">Rôle</th>
                    <th className="px-2 py-2.5 font-medium">Offre</th>
                    <th className="px-2 py-2.5 font-medium">Pays</th>
                    <th className="px-2 py-2.5 font-medium text-right">Entr.</th>
                    <th className="px-2 py-2.5 font-medium">Inscrit le</th>
                    <th className="px-2 py-2.5 font-medium">Dernière connexion</th>
                    <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                      <td className="px-4 py-2.5">
                        <p className="text-slate-200">{identity(u)}</p>
                        {showPhone(u) && <p className="text-[11px] text-slate-500 font-mono">{u.phone}</p>}
                      </td>
                      <td className="px-2 py-2.5"><Badge tone={u.role === "owner" ? "indigo" : "slate"}>{u.role === "owner" ? "propriétaire" : "employé"}</Badge></td>
                      <td className="px-2 py-2.5">{u.role === "owner" ? <Badge tone={u.plan === "premium" ? "amber" : "slate"}>{u.plan === "premium" ? "premium" : "freemium"}</Badge> : <span className="text-slate-600">—</span>}</td>
                      <td className="px-2 py-2.5 text-slate-400 text-xs">{u.country || "—"}</td>
                      <td className="px-2 py-2.5 text-slate-400 font-mono text-xs text-right">{u.companies_count}</td>
                      <td className="px-2 py-2.5 text-slate-500 font-mono text-xs">{frDate(u.created_at)}</td>
                      <td className="px-2 py-2.5 text-slate-500 font-mono text-xs">{u.last_sign_in_at ? frDate(u.last_sign_in_at) : "Jamais"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === "owner" ? planSelect(u, false) : <span className="text-[10px] text-slate-600">hérité du patron</span>}
                          <button onClick={() => onReset(u)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-amber-700/50 hover:text-amber-300" title="Générer un mot de passe temporaire">Mot de passe</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 text-center">{shown.length} utilisateur(s) affiché(s)</p>
        </>
      )}
    </div>
  );
}
