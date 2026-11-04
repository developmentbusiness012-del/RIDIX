import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, Building2, Users, LogIn, ArrowLeft, Eye, EyeOff, Globe, Phone, Gift, CheckCircle2 } from "lucide-react";
import PhoneInput from "./PhoneInput";
import { normalizePhone, phoneToEmail, DIAL_CODES, DEFAULT_DIAL } from "../phoneAuth";
import ForgotPassword from "./ForgotPassword";
import LegalDocsModal from "./LegalDocsModal";
import { PAYS_AFRIQUE } from "../constants";

export default function Auth({ initialMode = "signin", onBack }) {
  const [mode, setMode] = useState(initialMode); // signin | signup | employee
  const [email, setEmail] = useState(""); // uniquement pour les anciens comptes créés avec un email
  const [legacyLogin, setLegacyLogin] = useState(false);
  const [emailHint, setEmailHint] = useState(false); // proposé après un échec de connexion par numéro
  const [dial, setDial] = useState(() => { try { return localStorage.getItem("ridix_dial") ?? DEFAULT_DIAL; } catch { return DEFAULT_DIAL; } });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Cameroun");
  const [companyCode, setCompanyCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // Code de parrainage donné par un commercial (facultatif) — prérempli par un lien « …/?ref=CODE »
  const [referral, setReferral] = useState(() => { try { return localStorage.getItem("ridix_ref") || ""; } catch { return ""; } });
  const [referralInfo, setReferralInfo] = useState({ status: "idle", name: "" }); // idle | checking | valid | invalid
  const referralCode = referral.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  useEffect(() => {
    if (mode !== "signup" || referralCode.length < 4) { setReferralInfo({ status: "idle", name: "" }); return; }
    setReferralInfo({ status: "checking", name: "" });
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data, error: err } = await supabase.rpc("check_referral_code", { p_code: referralCode });
      if (cancelled) return;
      if (err) setReferralInfo({ status: "idle", name: "" }); // réseau : on ne bloque pas la saisie
      else setReferralInfo(data ? { status: "valid", name: data } : { status: "invalid", name: "" });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [referralCode, mode]);
  const [showLegal, setShowLegal] = useState(null); // 'cgu' | 'confidentialite' | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode !== "signin" && !acceptedTerms) {
      setError("Vous devez accepter les Conditions Générales d'Utilisation et la Politique de confidentialité pour continuer.");
      return;
    }
    // Le numéro de téléphone est l'identifiant (sauf connexion d'un ancien compte par email).
    // Un email tapé dans le champ « numéro » est reconnu automatiquement (anciens comptes).
    const emailInPhoneField = mode === "signin" && !legacyLogin && phone.includes("@");
    const usingEmail = mode === "signin" && (legacyLogin || emailInPhoneField);
    const emailValue = (legacyLogin ? email : phone).trim();
    const key = usingEmail ? null : normalizePhone(phone, dial);
    if (!usingEmail && !key) {
      setError("Numéro de téléphone invalide. Vérifiez l'indicatif du pays et le numéro.");
      return;
    }
    // Un code saisi doit être valable : sinon le commercial perdrait sa commission sans que personne ne le voie.
    if (mode === "signup" && referralCode) {
      const { data: refName, error: refErr } = await supabase.rpc("check_referral_code", { p_code: referralCode });
      if (!refErr && !refName) {
        setError("Code de parrainage introuvable ou désactivé. Corrigez-le ou laissez le champ vide.");
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: phoneToEmail(key),
          password,
          options: { data: { account_type: "owner", company_name: companyName, country, phone: "+" + key, ...(referralCode ? { referral_code: referralCode } : {}) } },
        });
        if (error) throw error;
        try { localStorage.removeItem("ridix_ref"); } catch { /* ignoré */ }
      } else if (mode === "employee") {
        const { data, error } = await supabase.auth.signUp({
          email: phoneToEmail(key),
          password,
          options: { data: { account_type: "employee", full_name: employeeName, phone: "+" + key } },
        });
        if (error) throw error;
        if (data.session) {
          const { error: joinError } = await supabase.rpc("join_company_with_code", { p_code: companyCode, p_name: employeeName, p_phone: "+" + key });
          if (joinError) throw joinError;
        }
      } else {
        let { error } = await supabase.auth.signInWithPassword({ email: usingEmail ? emailValue : phoneToEmail(key), password });
        if (error && !usingEmail && error.message === "Invalid login credentials") {
          // Compte créé avant le passage à la connexion par numéro : on le retrouve grâce au numéro
          // enregistré à l'inscription, et il est basculé sur ce numéro pour les connexions suivantes.
          const { data: fnData, error: fnError } = await supabase.functions.invoke("phone-login", { body: { phone: key, password } });
          if (fnData?.session) {
            const { error: setErr } = await supabase.auth.setSession(fnData.session);
            if (setErr) throw setErr;
            error = null;
          } else if (fnError?.context?.status === 429) {
            throw new Error("Trop de tentatives. Réessayez dans quelques minutes.");
          }
        }
        if (error) throw error;
      }
      try { localStorage.setItem("ridix_dial", dial); } catch { /* ignoré */ }
    } catch (err) {
      const msg = err.message || "";
      if (msg === "Invalid login credentials") {
        setError(usingEmail ? "Email ou mot de passe incorrect." : "Numéro ou mot de passe incorrect.");
        if (!usingEmail && mode === "signin") setEmailHint(true);
      }
      else if (/already registered|already been registered|user_already_exists/i.test(msg)) setError("Ce numéro est déjà inscrit. Utilisez l'onglet « Connexion ».");
      else setError(msg);
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
          <h1 className="font-serif text-2xl text-slate-50">RIDIX</h1>
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

            {mode === "signup" && (
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Globe size={12} /> Pays</label>
                <select
                  required
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); if (DIAL_CODES[e.target.value]) setDial(DIAL_CODES[e.target.value]); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
                >
                  {PAYS_AFRIQUE.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            {mode === "employee" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Votre nom</label>
                <input
                  required
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
                  placeholder="Ex : Awa Ndjock"
                />
                <p className="text-[11px] text-slate-500 mt-1">C'est ce nom que votre employeur verra dans ses paramètres.</p>
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

            {mode === "signin" && legacyLogin ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Adresse email (ancien compte)</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
                  placeholder="toi@entreprise.com"
                />
                <p className="text-[11px] text-slate-500 mt-1">Connectez-vous une dernière fois avec votre email : nous vous demanderons ensuite votre numéro de téléphone.</p>
                <button type="button" onClick={() => { setLegacyLogin(false); setError(""); }} className="text-[11px] text-amber-400 hover:text-amber-300 mt-1">
                  Utiliser mon numéro de téléphone
                </button>
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Phone size={12} /> Numéro de téléphone</label>
                <PhoneInput dial={dial} onDialChange={setDial} value={phone} onChange={setPhone} />
                <p className="text-[11px] text-slate-500 mt-1">
                  {mode === "signin" ? "Le numéro utilisé lors de votre inscription." : "Ce numéro sera votre identifiant de connexion."}
                </p>
              </div>
            )}
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
                <div className="flex items-center justify-between mt-1.5 gap-3">
                  <button type="button" onClick={() => setShowForgot(true)} className="text-[11px] text-amber-400 hover:text-amber-300">
                    Mot de passe oublié ?
                  </button>
                  {!legacyLogin && (
                    <button type="button" onClick={() => { setLegacyLogin(true); setError(""); setEmailHint(false); }} className="text-[11px] text-amber-400 hover:text-amber-300 text-right underline underline-offset-2">
                      Compte créé avec un email ?
                    </button>
                  )}
                </div>
              )}
            </div>

            {mode === "signup" && (
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Gift size={12} /> Code de parrainage <span className="text-slate-600">(facultatif)</span></label>
                <input
                  value={referral}
                  onChange={(e) => setReferral(e.target.value.toUpperCase())}
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={20}
                  className={`w-full bg-slate-800 border rounded-md px-3 py-2 text-sm font-mono tracking-wider uppercase ${referralInfo.status === "valid" ? "border-emerald-500/60" : referralInfo.status === "invalid" ? "border-rose-500/60" : "border-slate-700"}`}
                  placeholder="Ex : MARC482"
                />
                {referralInfo.status === "checking" && <p className="text-[11px] text-slate-500 mt-1">Vérification…</p>}
                {referralInfo.status === "valid" && <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> Code valide — parrainé par {referralInfo.name}</p>}
                {referralInfo.status === "invalid" && <p className="text-[11px] text-rose-400 mt-1">Code introuvable. Vérifiez-le auprès de votre commercial.</p>}
                {referralInfo.status === "idle" && <p className="text-[11px] text-slate-500 mt-1">Donné par le commercial RIDIX qui vous a présenté l'application.</p>}
              </div>
            )}

            {mode !== "signin" && (
              <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 accent-amber-400 shrink-0"
                />
                <span>
                  J'ai lu et j'accepte les{" "}
                  <button type="button" onClick={() => setShowLegal("cgu")} className="text-amber-400 hover:text-amber-300 underline">
                    Conditions Générales d'Utilisation
                  </button>{" "}
                  et la{" "}
                  <button type="button" onClick={() => setShowLegal("confidentialite")} className="text-amber-400 hover:text-amber-300 underline">
                    Politique de confidentialité
                  </button>.
                </span>
              </label>
            )}

            {error && <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded-md px-3 py-2">{error}</p>}
            {emailHint && mode === "signin" && !legacyLogin && (
              <div className="text-xs text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-md px-3 py-2.5">
                <p className="mb-2">Votre compte a été créé avec une adresse email (avant le passage au numéro) ? Connectez-vous avec cet email : votre numéro vous sera demandé ensuite, une seule fois.</p>
                <button type="button" onClick={() => { setLegacyLogin(true); setEmailHint(false); setError(""); }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium rounded-md px-3 py-1.5 text-xs">
                  Me connecter avec mon email
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode !== "signin" && !acceptedTerms)}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-medium rounded-md py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === "signin" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Rejoindre l'entreprise"}
            </button>
          </form>
        </div>
        <p className="text-center text-[11px] text-slate-600 mt-4">
          Votre numéro de téléphone est votre identifiant. Aucune confirmation n'est requise : l'accès est immédiat après inscription.
        </p>
      </div>
      {showLegal && <LegalDocsModal initialTab={showLegal} onClose={() => setShowLegal(null)} />}
    </div>
  );
}
