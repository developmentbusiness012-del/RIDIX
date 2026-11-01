import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { supabase } from "./supabaseClient";
import Landing from "./components/Landing";
import Auth from "./components/Auth";
import Pricing from "./components/Pricing";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { pollPayment, verifyPayment } from "./payments";
import { cacheGet, cacheSet, cacheClearAll } from "./offlineQueue";
import { memClear } from "./dataCache";

const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const loadDashboard = () => import("./components/Dashboard");
const Dashboard = lazy(loadDashboard);
// Si une session existe déjà sur cet appareil, on télécharge le Dashboard EN PARALLÈLE de la
// vérification de session au lieu d'attendre qu'elle soit terminée (suppression d'une cascade réseau).
try { if (localStorage.getItem("ridix-auth")) loadDashboard(); } catch { /* ignoré */ }

function PaymentReturnOverlay({ onResolved }) {
  const [state, setState] = useState("checking"); // checking | completed | failed | timeout

  useEffect(() => {
    let cancelled = false;
    pollPayment({
      intervalMs: 3000,
      maxAttempts: 20, // ~1 minute, largement suffisant pour Mobile Money
      onTick: (result) => {
        if (cancelled) return;
        if (result.status === "completed") setState("completed");
        else if (result.status === "abandoned" || result.status === "payment_failed") setState("failed");
      },
    }).then((result) => {
      if (cancelled) return;
      if (result.status === "completed") {
        setState("completed");
        onResolved("premium");
      } else if (result.status === "timeout" || result.status === "none") {
        setState("timeout");
      } else {
        setState("failed");
      }
    });
    return () => { cancelled = true; };
  }, [onResolved]);

  const close = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("paiement");
    window.history.replaceState({}, "", url.toString());
    if (state !== "completed") onResolved(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[100] px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full text-center">
        {state === "checking" && (
          <>
            <Loader2 className="animate-spin mx-auto mb-3 text-amber-400" size={28} />
            <h3 className="font-serif text-lg text-slate-50 mb-1">Vérification du paiement…</h3>
            <p className="text-sm text-slate-400">Ça peut prendre quelques instants, merci de patienter.</p>
          </>
        )}
        {state === "completed" && (
          <>
            <CheckCircle2 className="mx-auto mb-3 text-emerald-400" size={28} />
            <h3 className="font-serif text-lg text-slate-50 mb-1">Paiement confirmé</h3>
            <p className="text-sm text-slate-400 mb-4">Votre compte est maintenant en Premium.</p>
            <button onClick={close} className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-md py-2 text-sm font-medium">Continuer</button>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle className="mx-auto mb-3 text-rose-400" size={28} />
            <h3 className="font-serif text-lg text-slate-50 mb-1">Paiement non abouti</h3>
            <p className="text-sm text-slate-400 mb-4">Le paiement a été annulé ou a échoué. Vous pouvez réessayer depuis les paramètres.</p>
            <button onClick={close} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md py-2 text-sm font-medium">Fermer</button>
          </>
        )}
        {state === "timeout" && (
          <>
            <Clock className="mx-auto mb-3 text-amber-400" size={28} />
            <h3 className="font-serif text-lg text-slate-50 mb-1">Ça prend plus de temps que prévu</h3>
            <p className="text-sm text-slate-400 mb-4">Si vous avez bien payé, votre compte passera en Premium automatiquement d'ici peu. Vous pouvez fermer et revérifier depuis les paramètres.</p>
            <button onClick={close} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md py-2 text-sm font-medium">Fermer</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // { role, plan, onboarded, isAdmin }
  const [resolving, setResolving] = useState(false);
  const [adminView, setAdminView] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [showPaymentReturn, setShowPaymentReturn] = useState(
    () => new URLSearchParams(window.location.search).get("paiement") === "verification"
  );

  const profileRef = useRef(null);
  const resolvedUserRef = useRef(null);
  const inflightRef = useRef(null);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const doResolve = useCallback(async (userId) => {
    // Démarrage instantané : on affiche tout de suite le dernier profil connu pendant qu'on le revérifie
    // en arrière-plan. L'écran « Préparation » n'apparaît que pour un tout premier lancement.
    const cachedProfile = cacheGet(`profile_${userId}`);
    if (cachedProfile && !cachedProfile.offlineNoCache) {
      setProfile((prev) => prev || cachedProfile);
    } else if (!profileRef.current) {
      setResolving(true);
    }
    try {
      // Les deux recherches (propriétaire / employé) partent en même temps au lieu d'être enchaînées.
      const [ownerRes, memberRes] = await Promise.all([
        supabase.from("account_settings").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("company_members").select("*, companies(*)").eq("user_id", userId).maybeSingle(),
      ]);
      if (ownerRes.error) throw ownerRes.error;
      const ownerSettings = ownerRes.data;
      if (ownerSettings) {
        const p = { role: "owner", plan: ownerSettings.plan, onboarded: ownerSettings.onboarded, isAdmin: ownerSettings.is_admin, premiumExpiresAt: ownerSettings.premium_expires_at };
        cacheSet(`profile_${userId}`, p);
        resolvedUserRef.current = userId;
        setProfile(p);
        setResolving(false);
        return;
      }
      if (memberRes.error) throw memberRes.error;
      const membership = memberRes.data;
      if (membership) {
        const { data: ownerPlan } = await supabase.from("account_settings").select("plan").eq("user_id", membership.companies.owner_id).maybeSingle();
        const p = { role: membership.role || "employe", plan: ownerPlan?.plan || "premium", onboarded: true };
        cacheSet(`profile_${userId}`, p);
        resolvedUserRef.current = userId;
        setProfile(p);
        setResolving(false);
        return;
      }
      // Compte tout juste créé, le trigger n'a pas encore fini (rare) : on retente une fois
      setTimeout(() => doResolve(userId), 900);
    } catch {
      // Hors ligne ou erreur réseau : on retombe sur le dernier profil connu plutôt
      // que de rester bloqué indéfiniment sur l'écran de chargement.
      const cached = cacheGet(`profile_${userId}`);
      if (cached) {
        setProfile(cached);
      } else {
        setProfile({ role: "owner", plan: "freemium", onboarded: true, offlineNoCache: true });
      }
      setResolving(false);
    }
  }, []);

  // Évite les résolutions en double (getSession + INITIAL_SESSION + SIGNED_IN au démarrage).
  const resolveProfile = useCallback((userId) => {
    if (inflightRef.current?.userId === userId) return inflightRef.current.promise;
    const promise = doResolve(userId).finally(() => {
      if (inflightRef.current?.promise === promise) inflightRef.current = null;
    });
    inflightRef.current = { userId, promise };
    return promise;
  }, [doResolve]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      // Une erreur ici est généralement due à une coupure réseau au moment de la
      // validation du jeton — pas à une vraie déconnexion. On ne vide pas la session
      // dans ce cas ; supabase-js réessaiera de rafraîchir le jeton tout seul.
      if (!error) setSession(data.session);
      setLoading(false);
      if (data.session) resolveProfile(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setProfile(null);
        resolvedUserRef.current = null;
        cacheClearAll();
        memClear();
        return;
      }
      if (s) {
        setSession(s);
        // Rafraîchissement de jeton / retour sur l'onglet : le profil est déjà à jour, inutile de tout relire.
        if (profileRef.current && resolvedUserRef.current === s.user.id && event !== "USER_UPDATED") return;
        resolveProfile(s.user.id);
      }
      // Les autres événements (ex. échec ponctuel de rafraîchissement hors-ligne)
      // n'effacent volontairement pas la session déjà chargée.
    });
    return () => listener.subscription.unsubscribe();
  }, [resolveProfile]);


  // Rattrapage : si l'utilisateur a payé puis fermé le navigateur avant le retour sur l'app,
  // un panier reste "en attente". On le fait vérifier une fois au démarrage.
  useEffect(() => {
    if (!session || !profile || profile.role !== "owner" || profile.plan === "premium" || showPaymentReturn) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from("payment_carts").select("id").eq("status", "waiting_payment").limit(1);
        if (!data || data.length === 0) return;
        const res = await verifyPayment();
        if (!cancelled && res?.status === "completed") resolveProfile(session.user.id);
      } catch {
        /* silencieux : sera retenté au prochain démarrage */
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id, profile?.role, profile?.plan, showPaymentReturn, resolveProfile]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Chargement…</div>;
  }
  if (!session) {
    if (!showAuth) {
      return <Landing onEnter={(mode) => { setAuthMode(mode); setShowAuth(true); }} />;
    }
    return <Auth initialMode={authMode} onBack={() => setShowAuth(false)} />;
  }
  if (resolving || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={18} /> Préparation de votre espace…
      </div>
    );
  }
  if (profile.offlineNoCache) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center px-6">
        <div>
          <p className="text-slate-200 font-serif text-lg mb-2">Connexion requise</p>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Ouvrez RIDIX une première fois avec une connexion internet pour charger vos données — vous pourrez ensuite l'utiliser hors ligne normalement.
          </p>
        </div>
      </div>
    );
  }
  const paymentOverlay = showPaymentReturn && (
    <PaymentReturnOverlay
      onResolved={(plan) => {
        setShowPaymentReturn(false);
        if (plan) resolveProfile(session.user.id);
      }}
    />
  );

  if (profile.role === "owner" && !profile.onboarded) {
    return (
      <>
        <Pricing userId={session.user.id} onDone={(plan) => setProfile((p) => ({ ...p, plan, onboarded: true }))} />
        {paymentOverlay}
      </>
    );
  }
  if (adminView && profile.isAdmin) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" size={18} /></div>}>
        <AdminDashboard onBack={() => setAdminView(false)} />
      </Suspense>
    );
  }
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" size={18} /></div>}>
        <Dashboard session={session} role={profile.role} plan={profile.plan} premiumExpiresAt={profile.premiumExpiresAt} isAdmin={profile.isAdmin} onOpenAdmin={() => setAdminView(true)} />
      </Suspense>
      {paymentOverlay}
    </>
  );
}
