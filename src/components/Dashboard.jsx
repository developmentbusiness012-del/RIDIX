import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Plus, Trash2, Wallet, TrendingUp, TrendingDown, Percent, Loader2,
  LogOut, UploadCloud, FileSpreadsheet, FileText, ChevronDown, Building2,
  Settings, Copy, Check, ShieldAlert, ShieldCheck, X, Users, MessageCircle,
  Boxes, HandCoins, Lock, Sparkles, Smartphone, BookOpen, Crown, CreditCard,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { TYPES_OP, PROFILS, DEVISES, PALETTE, MOIS_FR, formatMontant, EMPLOYEE_RESTRICTIONS, EMPLOYEE_ALLOWED, PLANS } from "../constants";
import TransactionForm from "./TransactionForm";
import ImportCsv from "./ImportCsv";
import MessagesPanel from "./MessagesPanel";
import StockPanel from "./StockPanel";
import CreditsPanel from "./CreditsPanel";
import IntelligencePanel from "./IntelligencePanel";
import InstallAppTab from "./InstallAppTab";
import InstallFloatingCTA from "./InstallFloatingCTA";
import UserGuide from "./UserGuide";
import EmployeeKpiModal from "./EmployeeKpiModal";
import PremiumPlanPicker from "./PremiumPlanPicker";
import { ConfirmDialog, PromptDialog, InfoDialog } from "./Dialogs";
import { exportExcel, exportPdf } from "../exportUtils";
import { startPremiumCheckout } from "../payments";
import { getPending, addPending, removePending, syncPendingForCompany, cacheGet, cacheSet } from "../offlineQueue";

const monthKey = (d) => d.slice(0, 7);

export default function Dashboard({ session, role, plan: initialPlan, premiumExpiresAt, isAdmin, onOpenAdmin }) {
  const isOwner = role === "owner";
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filterPeriode, setFilterPeriode] = useState("mois");
  const [filterType, setFilterType] = useState("tous");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [plan, setPlan] = useState(initialPlan);
  const [employees, setEmployees] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("bord");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  const daysLeft = premiumExpiresAt ? Math.ceil((new Date(premiumExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = plan === "premium" && daysLeft !== null && daysLeft <= 5 && daysLeft >= 0;
  const isExpired = daysLeft !== null && daysLeft < 0 && (plan === "premium" || plan === "freemium");

  const company = companies.find((c) => c.id === activeId);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("sender", "admin")
        .eq("read_by_user", false);
      setUnreadCount(count || 0);
    })();
  }, [session.user.id]);

  const pendingCount = transactions.filter((t) => t._pending).length;

  const syncNow = useCallback(async () => {
    if (!activeId || !navigator.onLine) return;
    setSyncing(true);
    const { syncedLocalIds, syncedRows } = await syncPendingForCompany(activeId, supabase);
    if (syncedLocalIds.length > 0) {
      setTransactions((prev) => [
        ...syncedRows,
        ...prev.filter((t) => !(t._pending && syncedLocalIds.includes(t._localId))),
      ]);
    }
    setSyncing(false);
  }, [activeId]);

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); syncNow(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [syncNow]);

  useEffect(() => {
    if (activeId && navigator.onLine) syncNow();
  }, [activeId, syncNow]);

  // ---------- Chargement initial ----------
  useEffect(() => {
    (async () => {
      try {
        const { data: comps, error } = await supabase.from("companies").select("*").order("created_at");
        if (!error && comps) {
          setCompanies(comps);
          setActiveId(comps[0]?.id ?? null);
          cacheSet("companies", comps);
        } else {
          throw error || new Error("empty");
        }
      } catch {
        // Hors ligne ou erreur réseau : on retombe sur la dernière liste connue.
        const cached = cacheGet("companies");
        if (cached) {
          setCompanies(cached);
          setActiveId(cached[0]?.id ?? null);
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!isOwner || !activeId) { setEmployees([]); return; }
    (async () => {
      const { data } = await supabase.from("company_members").select("*").eq("company_id", activeId).order("created_at");
      setEmployees(data || []);
    })();
  }, [activeId, isOwner, showSettings]);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("company_id", activeId)
          .order("date", { ascending: false });
        if (error) throw error;
        cacheSet(`tx_${activeId}`, data || []);
        setTransactions([...getPending(activeId), ...(data || [])]);
      } catch {
        const cached = cacheGet(`tx_${activeId}`) || [];
        setTransactions([...getPending(activeId), ...cached]);
      }
    })();
  }, [activeId]);

  const refreshTransactions = useCallback(async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("company_id", activeId)
      .order("date", { ascending: false });
    cacheSet(`tx_${activeId}`, data || []);
    setTransactions([...getPending(activeId), ...(data || [])]);
  }, [activeId]);

  const updateCompany = async (patch) => {
    setSaveState("saving");
    const { data, error } = await supabase.from("companies").update(patch).eq("id", activeId).select().single();
    if (!error && data) {
      setCompanies((prev) => prev.map((c) => (c.id === activeId ? data : c)));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    }
  };

  const [dialog, setDialog] = useState(null); // { type: 'createCompany'|'limitInfo'|'removeEmployee', payload }

  const createCompany = () => {
    if (plan === "freemium" && companies.length >= 2) {
      setDialog({ type: "limitInfo" });
      setShowCompanyMenu(false);
      return;
    }
    setDialog({ type: "createCompany" });
  };

  const submitNewCompany = async (name) => {
    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const { data, error } = await supabase
      .from("companies")
      .insert({ owner_id: session.user.id, name, profil: "mixte", devise_base: "XAF", code })
      .select()
      .single();
    if (!error && data) {
      setCompanies((prev) => [...prev, data]);
      setActiveId(data.id);
      setShowCompanyMenu(false);
      setDialog(null);
    } else {
      console.error("createCompany failed", error);
      setDialog({ type: "creationError", payload: error?.message });
    }
  };

  const [planActionError, setPlanActionError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const changePlan = async (nextPlan) => {
    setPlanActionError(null);
    if (nextPlan === "premium") {
      setDialog({ type: "premiumPicker" });
      return;
    }
    const { error } = await supabase.from("account_settings").update({ plan: nextPlan }).eq("user_id", session.user.id);
    if (!error) setPlan(nextPlan);
  };

  const removeEmployee = (id) => setDialog({ type: "removeEmployee", payload: id });

  const deleteAccount = () => setDialog({ type: "deleteAccount" });

  const confirmDeleteAccount = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${currentSession.access_token}` },
    });
    if (error) {
      setDialog({ type: "creationError", payload: "Impossible de supprimer le compte. Réessayez ou contactez le support." });
      return;
    }
    await supabase.auth.signOut();
  };

  const confirmRemoveEmployee = async () => {
    const id = dialog.payload;
    const { error } = await supabase.from("company_members").delete().eq("id", id);
    if (!error) setEmployees((prev) => prev.filter((e) => e.id !== id));
    setDialog(null);
  };

  const addTransaction = async (tx) => {
    if (!navigator.onLine) {
      const entry = addPending(activeId, tx);
      setTransactions((prev) => [entry, ...prev]);
      setShowForm(false);
      return;
    }
    try {
      const { data, error } = await supabase.from("transactions").insert({ ...tx, company_id: activeId }).select().single();
      if (!error && data) {
        setTransactions((prev) => [data, ...prev]);
        setShowForm(false);
      }
    } catch {
      // Le réseau a coupé au moment de l'envoi : on ne perd pas l'écriture, on la met en attente.
      const entry = addPending(activeId, tx);
      setTransactions((prev) => [entry, ...prev]);
      setShowForm(false);
    }
  };

  const importTransactions = async (rows) => {
    const payload = rows.map((r) => ({ ...r, company_id: activeId }));
    const { error } = await supabase.from("transactions").insert(payload);
    if (!error) {
      await refreshTransactions();
      setShowImport(false);
    }
  };

  const removeTransaction = async (t) => {
    if (t._pending) {
      removePending(activeId, t._localId);
      setTransactions((prev) => prev.filter((x) => x.id !== t.id));
      return;
    }
    const { error } = await supabase.from("transactions").delete().eq("id", t.id);
    if (!error) setTransactions((prev) => prev.filter((x) => x.id !== t.id));
  };

  // ---------- Filtrage ----------
  const filtered = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayIdx = (now.getDay() + 6) % 7; // lundi = 0
    startOfWeek.setDate(now.getDate() - dayIdx);
    startOfWeek.setHours(0, 0, 0, 0);
    return transactions.filter((t) => {
      if (filterType !== "tous" && t.type_op !== filterType) return false;
      if (filterPeriode === "tout") return true;
      const d = new Date(t.date);
      if (filterPeriode === "jour") return d.toDateString() === now.toDateString();
      if (filterPeriode === "semaine") return d >= startOfWeek;
      if (filterPeriode === "mois") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (filterPeriode === "trimestre") {
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        return diffMonths >= 0 && diffMonths < 3;
      }
      if (filterPeriode === "annee") return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, filterPeriode, filterType]);

  const kpis = useMemo(() => {
    const ca = filtered.filter((t) => t.sens === "recette").reduce((s, t) => s + Number(t.montant_base), 0);
    const dep = filtered.filter((t) => t.sens === "depense").reduce((s, t) => s + Number(t.montant_base), 0);
    const profit = ca - dep;
    const marge = ca > 0 ? (profit / ca) * 100 : 0;
    return { ca, dep, profit, marge };
  }, [filtered]);

  const evolution = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const k = monthKey(t.date);
      if (!map[k]) map[k] = { key: k, ca: 0, dep: 0 };
      if (t.sens === "recette") map[k].ca += Number(t.montant_base);
      else map[k].dep += Number(t.montant_base);
    });
    return Object.values(map)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
      .map((m) => ({ ...m, mois: MOIS_FR[Number(m.key.slice(5, 7)) - 1], profit: m.ca - m.dep }));
  }, [transactions]);

  const repartitionDepenses = useMemo(() => {
    const map = {};
    filtered.filter((t) => t.sens === "depense").forEach((t) => {
      map[t.categorie] = (map[t.categorie] || 0) + Number(t.montant_base);
    });
    return Object.entries(map).map(([categorie, montant]) => ({ categorie, montant })).sort((a, b) => b.montant - a.montant);
  }, [filtered]);

  const repartitionType = useMemo(() => {
    const map = { local: 0, import: 0, export: 0, autre: 0 };
    filtered.forEach((t) => { map[t.type_op] += Number(t.montant_base); });
    return TYPES_OP.map((t) => ({ name: t.label, id: t.id, value: map[t.id] })).filter((x) => x.value > 0);
  }, [filtered]);

  if (loading || !company) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={20} /> Chargement du registre…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* ---------- En-tête ---------- */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 relative">
            <div className="w-11 h-11 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-serif text-xl font-bold shrink-0">
              {company.name.trim().charAt(0).toUpperCase() || "M"}
            </div>
            <div>
              {isOwner ? (
                <button onClick={() => setShowCompanyMenu((v) => !v)} className="flex items-center gap-1.5 font-serif text-xl font-semibold text-slate-50">
                  {company.name} <ChevronDown size={16} className="text-slate-500" />
                </button>
              ) : (
                <span className="font-serif text-xl font-semibold text-slate-50">{company.name}</span>
              )}
              <p className="text-xs text-slate-400 tracking-wide uppercase">
                {saveState === "saving" ? "enregistrement…" : isOwner ? "registre financier" : "registre financier · compte employé"}
              </p>
            </div>

            {isOwner && showCompanyMenu && (
              <div className="absolute top-14 left-0 w-64 bg-slate-900 border border-slate-800 rounded-md shadow-xl z-20 p-2">
                {companies.map((c) => (
                  <button key={c.id} onClick={() => { setActiveId(c.id); setShowCompanyMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${c.id === activeId ? "bg-amber-400/10 text-amber-300" : "text-slate-300 hover:bg-slate-800"}`}>
                    <Building2 size={14} /> {c.name}
                  </button>
                ))}
                <button onClick={createCompany} className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800 mt-1 pt-2">
                  <Plus size={14} /> Nouvelle entreprise
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {!isOwner && (
              <span className="text-xs bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-slate-400">
                {PROFILS.find((p) => p.id === company.profil)?.label} · {company.devise_base}
              </span>
            )}
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md px-3 py-2 transition-colors">
              <Plus size={16} /> Écriture
            </button>
            {isOwner && (
              <button onClick={() => setShowSettings(true)} className="text-slate-500 hover:text-slate-200 p-2" title="Paramètres">
                <Settings size={16} />
              </button>
            )}
            {isAdmin && (
              <button onClick={onOpenAdmin} className="text-slate-500 hover:text-amber-300 p-2" title="Espace Admin">
                <ShieldCheck size={16} />
              </button>
            )}
            <button onClick={() => setShowMessages(true)} className="relative text-slate-500 hover:text-slate-200 p-2" title="Messagerie">
              <MessageCircle size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-slate-200 p-2" title="Se déconnecter">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* ---------- Navigation onglets ---------- */}
        <div className="flex gap-1 mb-6 border-b border-slate-800 overflow-x-auto">
          {[
            { id: "bord", label: "Tableau de bord", icon: null, locked: false },
            { id: "stock", label: "Stock", icon: Boxes, locked: plan !== "premium" },
            { id: "credits", label: "Crédits", icon: HandCoins, locked: plan !== "premium" },
            ...(isOwner ? [{ id: "intelligence", label: "Intelligence", icon: Sparkles, locked: plan !== "premium" }] : []),
            { id: "app", label: "App", icon: Smartphone, locked: false },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 text-sm px-2.5 sm:px-3 py-2.5 border-b-2 -mb-px whitespace-nowrap transition-colors ${activeTab === tab.id ? "border-amber-400 text-slate-50" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              {tab.icon && <tab.icon size={14} />}
              {tab.label}
              {tab.locked && <Lock size={11} className="text-amber-400/70" />}
            </button>
          ))}
        </div>

        {(!isOnline || pendingCount > 0) && (
          <div className={`mb-6 border rounded-md px-4 py-3 flex items-center justify-between gap-3 flex-wrap ${!isOnline ? "border-slate-700 bg-slate-800/40" : "border-amber-800/50 bg-amber-950/30"}`}>
            <p className={`text-xs flex items-center gap-2 ${!isOnline ? "text-slate-300" : "text-amber-200"}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${!isOnline ? "bg-slate-500" : syncing ? "bg-amber-400 animate-pulse" : "bg-amber-400"}`} />
              {!isOnline
                ? "Hors ligne — vous pouvez continuer à enregistrer des écritures, elles seront envoyées automatiquement au retour de la connexion."
                : syncing
                ? "Synchronisation des écritures en attente…"
                : `${pendingCount} écriture${pendingCount > 1 ? "s" : ""} en attente de synchronisation.`}
            </p>
            {isOnline && pendingCount > 0 && !syncing && (
              <button onClick={syncNow} className="shrink-0 text-xs px-3 py-1.5 rounded-md border border-amber-700/50 text-amber-300 hover:bg-amber-900/30">
                Synchroniser maintenant
              </button>
            )}
          </div>
        )}

        {isOwner && (isExpiringSoon || isExpired) && (
          <div className={`mb-6 border rounded-md px-4 py-3 flex items-center justify-between gap-3 flex-wrap ${isExpired ? "border-rose-800/50 bg-rose-950/30" : "border-amber-800/50 bg-amber-950/30"}`}>
            <p className={`text-xs ${isExpired ? "text-rose-200" : "text-amber-200"}`}>
              {isExpired
                ? "Votre abonnement Premium a expiré — vous êtes repassé en Freemium. Renouvelez pour retrouver le Stock, les Crédits & dettes et l'Intelligence financière."
                : `Votre abonnement Premium expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""} — pensez à le renouveler pour ne pas perdre l'accès.`}
            </p>
            <button onClick={() => changePlan("premium")} disabled={checkoutLoading}
              className="shrink-0 flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-xs rounded-md px-3 py-2 disabled:opacity-60">
              {checkoutLoading && <Loader2 size={12} className="animate-spin" />} Renouveler maintenant
            </button>
          </div>
        )}

        {activeTab === "bord" && (
        <>
        {/* ---------- Bandeau restrictions employé ---------- */}
        {!isOwner && (
          <div className="mb-6 border border-indigo-800/50 bg-indigo-950/30 rounded-md px-4 py-3 flex items-start gap-2">
            <ShieldAlert size={16} className="text-indigo-300 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-200">
              Compte employé : vous pouvez ajouter des écritures, gérer le stock, enregistrer des crédits et importer un CSV.
              Le tableau de bord et les écritures affichées ne concernent que <strong>vos propres saisies</strong> — pas les chiffres globaux de l'entreprise.
              Vous ne pouvez pas supprimer d'écritures ni modifier les paramètres de l'entreprise.
            </p>
          </div>
        )}

        {/* ---------- Bandeau manifeste ---------- */}
        {transactions.length > 0 && (
          <div className="mb-6 border border-slate-800 rounded-md bg-slate-900/60 overflow-hidden">
            <div className="px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800">Manifeste — dernières écritures</div>
            <div className="flex gap-3 overflow-x-auto px-4 py-3">
              {transactions.slice(0, 8).map((t) => (
                <div key={t.id} className="shrink-0 border border-dashed rounded-md px-3 py-1.5 text-xs flex items-center gap-2" style={{ borderColor: PALETTE[t.type_op] }}>
                  <span className="font-mono uppercase tracking-wide" style={{ color: PALETTE[t.type_op] }}>{t.type_op}</span>
                  <span className="text-slate-400">{t.date}</span>
                  <span className={t.sens === "recette" ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                    {t.sens === "recette" ? "+" : "−"}{formatMontant(t.montant, t.devise)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- Filtres ---------- */}
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {[["jour", "Aujourd'hui"], ["semaine", "Semaine"], ["mois", "Ce mois"], ["trimestre", "Trimestre"], ["annee", "Année"], ["tout", "Tout"]].map(([id, label]) => (
              <button key={id} onClick={() => setFilterPeriode(id)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${filterPeriode === id ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setFilterType("tous")}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${filterType === "tous" ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
              Tous profils
            </button>
            {TYPES_OP.map((t) => (
              <button key={t.id} onClick={() => setFilterType(t.id)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${filterType === t.id ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                <t.icon size={12} /> {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={() => setShowImport(true)} title="Importer CSV" className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500">
              <UploadCloud size={13} /> <span className="hidden sm:inline">Importer</span>
            </button>
            <button onClick={() => exportExcel(filtered, company)} title="Exporter en Excel" className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500">
              <FileSpreadsheet size={13} /> <span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={() => exportPdf(filtered, company, kpis)} title="Exporter en PDF" className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:border-slate-500">
              <FileText size={13} /> <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* ---------- KPI ---------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label={isOwner ? "Chiffre d'affaires" : "Vos recettes"} value={formatMontant(kpis.ca, company.devise_base)} icon={Wallet} accent="border-l-emerald-400" />
          <KpiCard label={isOwner ? "Dépenses" : "Vos dépenses"} value={formatMontant(kpis.dep, company.devise_base)} icon={TrendingDown} accent="border-l-rose-400" />
          <KpiCard label={isOwner ? "Profit net" : "Votre solde net"} value={formatMontant(kpis.profit, company.devise_base)} icon={TrendingUp} accent={kpis.profit >= 0 ? "border-l-amber-400" : "border-l-rose-500"} />
          <KpiCard label="Marge" value={`${kpis.marge.toFixed(1)} %`} icon={Percent} accent="border-l-indigo-400" />
        </div>

        {/* ---------- Graphiques ---------- */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-md p-4">
            <h3 className="font-serif text-sm text-slate-300 mb-3">Évolution mensuelle</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={evolution}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mois" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} formatter={(v, name) => [formatMontant(v, company.devise_base), name]} />
                <Area type="monotone" dataKey="ca" name="CA" stroke="#34d399" fill="url(#caGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="dep" name="Dépenses" stroke="#fb7185" fill="url(#depGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4">
            <h3 className="font-serif text-sm text-slate-300 mb-3">Répartition par profil</h3>
            {repartitionType.length === 0 ? (
              <p className="text-xs text-slate-500 mt-8 text-center">Aucune donnée sur la période</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={repartitionType} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {repartitionType.map((entry) => <Cell key={entry.id} fill={PALETTE[entry.id]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatMontant(v, company.devise_base)} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-4 mb-6">
          <h3 className="font-serif text-sm text-slate-300 mb-3">Dépenses par catégorie</h3>
          {repartitionDepenses.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">Aucune dépense sur la période</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={repartitionDepenses} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="categorie" stroke="#94a3b8" fontSize={11} width={150} />
                <Tooltip formatter={(v) => formatMontant(v, company.devise_base)} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="montant" fill="#fbbf24" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ---------- Table ---------- */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden mb-10">
          <h3 className="font-serif text-sm text-slate-300 px-4 pt-4 pb-2">Écritures ({filtered.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-y border-slate-800">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Profil</th>
                  <th className="px-2 py-2 font-medium">Catégorie</th>
                  <th className="px-2 py-2 font-medium">Libellé</th>
                  <th className="px-2 py-2 font-medium text-right">Montant</th>
                  <th className="px-2 py-2 font-medium text-right">Contre-valeur</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-500 text-xs py-8">
                    Le registre est vide pour cette sélection — ajoutez ou importez une écriture pour commencer.
                  </td></tr>
                )}
                {filtered.map((t) => (
                  <tr key={t.id} className={`border-b border-slate-800/60 hover:bg-slate-800/30 ${t._pending ? "bg-amber-950/10" : ""}`}>
                    <td className="px-4 py-2 font-mono text-xs text-slate-400">
                      {t.date}
                      {t._pending && (
                        <span title="En attente de synchronisation" className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-400 align-middle" />
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border" style={{ color: PALETTE[t.type_op], borderColor: PALETTE[t.type_op] }}>
                        {t.type_op}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-300">{t.categorie}</td>
                    <td className="px-2 py-2 text-slate-400">{t.libelle || "—"}</td>
                    <td className={`px-2 py-2 text-right font-mono ${t.sens === "recette" ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.sens === "recette" ? "+" : "−"}{formatMontant(t.montant, t.devise)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-400 text-xs">{formatMontant(t.montant_base, company.devise_base)}</td>
                    <td className="px-2 py-2 text-right">
                      {isOwner && (
                        <button onClick={() => removeTransaction(t)} className="text-slate-600 hover:text-rose-400">
                          <Trash2 size={14} />
                        </button>
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

        {activeTab === "stock" && (
          <StockPanel companyId={activeId} plan={plan} isOwner={isOwner} deviseBase={company.devise_base} onUpgrade={changePlan} checkoutLoading={checkoutLoading} />
        )}

        {activeTab === "credits" && (
          <CreditsPanel companyId={activeId} plan={plan} isOwner={isOwner} deviseBase={company.devise_base} onUpgrade={changePlan} checkoutLoading={checkoutLoading} />
        )}

        {activeTab === "intelligence" && isOwner && (
          <IntelligencePanel companyId={activeId} plan={plan} deviseBase={company.devise_base} transactions={transactions} company={company} onUpgrade={changePlan} checkoutLoading={checkoutLoading} />
        )}

        {activeTab === "app" && <InstallAppTab />}
      </div>

      {showForm && <TransactionForm deviseBase={company.devise_base} plan={plan} companyId={activeId} onClose={() => setShowForm(false)} onSubmit={addTransaction} />}
      {showImport && <ImportCsv deviseBase={company.devise_base} onClose={() => setShowImport(false)} onImport={importTransactions} />}
      {showSettings && (
        <SettingsPanel
          company={company}
          plan={plan}
          premiumExpiresAt={premiumExpiresAt}
          checkoutLoading={checkoutLoading}
          planActionError={planActionError}
          employees={employees}
          onChangePlan={changePlan}
          onRemoveEmployee={removeEmployee}
          onUpdateCompany={updateCompany}
          onDeleteAccount={deleteAccount}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showMessages && (
        <MessagesPanel session={session} onClose={() => setShowMessages(false)} onRead={() => setUnreadCount(0)} />
      )}
      <InstallFloatingCTA />

      {dialog?.type === "createCompany" && (
        <PromptDialog
          title="Nouvelle entreprise"
          label="Nom de l'entreprise"
          defaultValue="Nouvelle entreprise"
          confirmLabel="Créer"
          onSubmit={submitNewCompany}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.type === "deleteAccount" && (
        <PromptDialog
          title="Supprimer définitivement mon compte"
          label='Cette action est irréversible : toutes vos données, entreprises et écritures seront supprimées. Tapez "SUPPRIMER" pour confirmer.'
          confirmWord="SUPPRIMER"
          confirmLabel="Supprimer mon compte"
          danger
          placeholder="SUPPRIMER"
          onSubmit={confirmDeleteAccount}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.type === "premiumPicker" && (
        <PremiumPlanPicker onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "creationError" && (
        <InfoDialog
          title="Impossible de créer l'entreprise"
          message={dialog.payload || "Une erreur inattendue est survenue. Réessayez dans un instant."}
          danger
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "limitInfo" && (
        <InfoDialog
          title="Limite Freemium atteinte"
          message="L'offre Freemium est limitée à 2 entreprises. Passez en Premium pour en créer davantage."
          danger
          onClose={() => { setDialog(null); setShowSettings(true); }}
        />
      )}
      {dialog?.type === "removeEmployee" && (
        <ConfirmDialog
          title="Retirer cet employé ?"
          message="Il perdra l'accès à cette entreprise immédiatement."
          confirmLabel="Retirer"
          danger
          onConfirm={confirmRemoveEmployee}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function SettingsPanel({ company, plan, premiumExpiresAt, employees, onChangePlan, onRemoveEmployee, onUpdateCompany, onDeleteAccount, onClose, planActionError }) {
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [tab, setTab] = useState("general");

  const copyCode = async () => {
    await navigator.clipboard.writeText(company.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const TABS = [
    { id: "general", label: "Général", icon: Building2 },
    { id: "abonnement", label: "Abonnement", icon: CreditCard },
    { id: "equipe", label: "Équipe", icon: Users },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 mb-3">
          <h3 className="font-serif text-lg text-slate-50">Paramètres</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="flex gap-1 px-5 border-b border-slate-800">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-sm px-2.5 py-2.5 border-b-2 -mb-px transition-colors ${tab === t.id ? "border-amber-400 text-slate-50" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              <t.icon size={14} /> {t.label}
              {t.id === "equipe" && employees.length > 0 && <span className="text-[10px] font-mono text-slate-500">({employees.length})</span>}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "general" && (
            <div className="space-y-5">
              <button onClick={() => setShowGuide(true)}
                className="w-full flex items-center gap-2.5 border border-slate-700 hover:border-amber-400/50 hover:bg-slate-800/50 rounded-md px-3 py-2.5 text-sm text-slate-200 transition-colors">
                <BookOpen size={16} className="text-amber-400" /> Guide d'utilisation
              </button>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Entreprise</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Profil</label>
                    <select value={company.profil} onChange={(e) => onUpdateCompany({ profil: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-sm rounded-md px-3 py-2 text-slate-200">
                      {PROFILS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Devise de base</label>
                    <select value={company.devise_base} onChange={(e) => onUpdateCompany({ devise_base: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-sm rounded-md px-3 py-2 text-slate-200">
                      {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-rose-400/80 uppercase tracking-wide mb-2 font-mono">Zone dangereuse</p>
                <button onClick={onDeleteAccount}
                  className="w-full flex items-center justify-center gap-2 border border-rose-900/50 hover:bg-rose-950/30 rounded-md px-3 py-2.5 text-sm text-rose-400 transition-colors">
                  <Trash2 size={14} /> Supprimer mon compte et mes données
                </button>
                <p className="text-[10px] text-slate-600 mt-1.5">
                  Action définitive et irréversible. Supprime votre compte, vos entreprises et toutes vos données associées.
                </p>
              </div>
            </div>
          )}

          {tab === "abonnement" && (
            <div className="space-y-4">
              <div className={`rounded-lg border p-4 ${plan === "premium" ? "border-amber-400/40 bg-amber-400/5" : "border-slate-700 bg-slate-800/40"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif text-base text-slate-50 flex items-center gap-2">
                    {plan === "premium" && <Crown size={15} className="text-amber-400" />}
                    {plan === "premium" ? "Premium actif" : "Freemium"}
                  </span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${plan === "premium" ? "text-amber-300 border-amber-700" : "text-slate-400 border-slate-600"}`}>
                    {plan === "premium" ? "actif" : "gratuit"}
                  </span>
                </div>
                {plan === "premium" && premiumExpiresAt ? (
                  <p className="text-xs text-slate-400">
                    Actif jusqu'au <span className="text-slate-200">{new Date(premiumExpiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </p>
                ) : plan === "premium" ? (
                  <p className="text-xs text-slate-400">Accès Premium accordé, sans échéance.</p>
                ) : (
                  <p className="text-xs text-slate-400">Stock, crédits, intelligence financière et équipe sont réservés à l'offre Premium.</p>
                )}
              </div>

              {planActionError && <p className="text-[11px] text-rose-400">{planActionError}</p>}

              <button onClick={() => onChangePlan("premium")}
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium rounded-md py-2.5 text-sm flex items-center justify-center gap-2">
                <Crown size={14} /> {plan === "premium" ? "Renouveler maintenant" : "Passer en Premium"}
              </button>

              {plan === "premium" && (
                <button onClick={() => onChangePlan("freemium")}
                  className="w-full text-[11px] text-slate-500 hover:text-slate-300 text-center underline">
                  Repasser en Freemium
                </button>
              )}

              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">Formules disponibles</p>
                <div className="space-y-1.5">
                  {PLANS.filter((p) => p.planKey).map((p) => (
                    <div key={p.planKey} className="flex items-center justify-between text-xs bg-slate-800/40 rounded-md px-3 py-2">
                      <span className="text-slate-300">{p.label}</span>
                      <span className="font-mono text-amber-300">{p.price}{p.originalPrice && <span className="text-slate-600 line-through ml-1.5">{p.originalPrice}</span>}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "equipe" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Code entreprise</p>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-md px-3 py-2">
                  <span className="font-mono text-amber-300 tracking-widest flex-1">{company.code}</span>
                  <button onClick={copyCode} className="text-slate-400 hover:text-slate-200">
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Communiquez ce code à vos employés pour qu'ils rejoignent l'entreprise (offre Premium requise).
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Employés ({employees.length})</p>
                {plan !== "premium" ? (
                  <p className="text-xs text-slate-500 bg-slate-800/60 rounded-md px-3 py-2">Passez en Premium pour inviter des employés.</p>
                ) : employees.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-800/60 rounded-md px-3 py-2">Aucun employé n'a encore rejoint cette entreprise.</p>
                ) : (
                  <div className="space-y-1.5">
                    {employees.map((e) => (
                      <div key={e.id} className="flex items-center justify-between bg-slate-800/60 rounded-md px-3 py-2 text-sm">
                        <button onClick={() => setViewingEmployee(e)} className="text-slate-300 hover:text-amber-300 text-left truncate flex-1">
                          {e.name || e.email || "Employé"}
                        </button>
                        <button onClick={() => onRemoveEmployee(e.id)} className="text-slate-500 hover:text-rose-400 shrink-0 ml-2">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">Restrictions employé</p>
                <ul className="space-y-1">
                  {EMPLOYEE_RESTRICTIONS.map((r) => <li key={r} className="text-[11px] text-slate-500">• {r}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      {showGuide && <UserGuide onClose={() => setShowGuide(false)} />}
      {viewingEmployee && (
        <EmployeeKpiModal
          employee={viewingEmployee}
          companyId={company.id}
          deviseBase={company.devise_base}
          onClose={() => setViewingEmployee(null)}
        />
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent }) {
  return (
    <div className={`bg-slate-900/60 border border-slate-800 border-l-4 ${accent} rounded-md p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
        <Icon size={15} className="text-slate-500" />
      </div>
      <p className="font-mono text-lg sm:text-xl text-slate-50 tabular-nums truncate">{value}</p>
    </div>
  );
}
