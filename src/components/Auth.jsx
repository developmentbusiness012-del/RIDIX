import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, Building2, Users, LogIn, ArrowLeft, Eye, EyeOff } from "lucide-react";
import ForgotPassword from "./ForgotPassword";

export default function Auth({ initialMode = "signin", onBack }) {
  const [mode, setMode] = useState(initialMode); // signin | signup | employee
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { account_type: "owner", company_name: companyName } },
        });
        if (error) throw error;
      } else if (mode === "employee") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { account_type: "employee" } },
        });
        if (error) throw error;
        if (data.session) {
          const { error: joinError } = await supabase.rpc("join_company_with_code", { p_code: companyCode });
          if (joinError) throw joinError;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Identifiants incorrects." : err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "signin", label: "Connexion", icon: LogIn },
    { id: "signup", label: "Créer une entreprise", icon: Building2 },
    { id: "employee", label: "Rejoindre en tant qu'employé", icon: Users },
  ];

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 font-sans py-10">
      <div className="w-full max-w-sm">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-6">
            <ArrowLeft size={13} /> Retour à l'accueil
          </button>
        )}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-serif text-2xl font-bold mx-auto mb-3">
            R
          </div>
          <h1 className="font-serif text-2xl text-slate-50">RIDIX FINANCE</h1>
          <p className="text-xs text-slate-500 uppercase tracking-[0.2em] mt-1">Commerçants · Importateurs · Exportateurs</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-6">
          <div className="grid grid-cols-1 gap-1.5 mb-5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setMode(t.id); setError(""); }}
                className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm border ${mode === t.id ? "bg-amber-400/10 border-amber-400 text-amber-300" : "border-slate-700 text-slate-400"}`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom de l'entreprise</label>
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
                  placeholder="Ex : Maison de Négoce Douala"
                />
              </div>
            )}

            {mode === "employee" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Code entreprise</label>
                <input
                  required
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tracking-widest"
                  placeholder="EX : 4F82A1C9"
                  maxLength={8}
                />
                <p className="text-[11px] text-slate-500 mt-1">Ce code vous a été transmis par le propriétaire de l'entreprise.</p>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Adresse email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
                placeholder="toi@entreprise.com"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 pr-10 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-0 top-0 h-full px-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {mode === "signin" && (
                <button type="button" onClick={() => setShowForgot(true)} className="text-[11px] text-amber-400 hover:text-amber-300 mt-1.5">
                  Mot de passe oublié ?
                </button>
              )}
            </div>

            {error && <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded-md px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-medium rounded-md py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === "signin" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Rejoindre l'entreprise"}
            </button>
          </form>
        </div>
        <p className="text-center text-[11px] text-slate-600 mt-4">
          Aucune confirmation par email n'est requise : l'accès est immédiat après inscription.
        </p>
      </div>
    </div>
  );
}
