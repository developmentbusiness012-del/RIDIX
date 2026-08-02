import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import Landing from "./components/Landing";
import Auth from "./components/Auth";
import Pricing from "./components/Pricing";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { pollPayment } from "./payments";

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

  const resolveProfile = useCallback(async (userId) => {
    setResolving(true);
    // Tentative propriétaire
    const { data: ownerSettings } = await supabase.from("account_settings").select("*").eq("user_id", userId).maybeSingle();
    if (ownerSettings) {
      setProfile({ role: "owner", plan: ownerSettings.plan, onboarded: ownerSettings.onboarded, isAdmin: ownerSettings.is_admin, premiumExpiresAt: ownerSettings.premium_expires_at });
      setResolving(false);
      return;
    }
    // Tentative employé
    const { data: membership } = await supabase.from("company_members").select("*, companies(*)").eq("user_id", userId).maybeSingle();
    if (membership) {
      const { data: ownerPlan } = await supabase.from("account_settings").select("plan").eq("user_id", membership.companies.owner_id).maybeSingle();
      setProfile({ role: "employe", plan: ownerPlan?.plan || "premium", onboarded: true });
      setResolving(false);
      return;
    }
    // Compte tout juste créé, le trigger n'a pas encore fini (rare) : on retente une fois
    setTimeout(() => resolveProfile(userId), 900);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) resolveProfile(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) resolveProfile(s.user.id);
      else setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, [resolveProfile]);

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
    return <AdminDashboard onBack={() => setAdminView(false)} />;
  }
  return (
    <>
      <Dashboard session={session} role={profile.role} plan={profile.plan} premiumExpiresAt={profile.premiumExpiresAt} isAdmin={profile.isAdmin} onOpenAdmin={() => setAdminView(true)} />
      {paymentOverlay}
    </>
  );
}
