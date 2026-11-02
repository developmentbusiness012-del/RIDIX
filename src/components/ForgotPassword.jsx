import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, ArrowLeft, Eye, EyeOff, MailCheck, KeyRound, CheckCircle2, MessageCircle, Phone } from "lucide-react";

const SUPPORT_WHATSAPP = "https://wa.me/message/FYWJGBC3C22FH1";

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState("start"); // start | email | code | done
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  };

  const confirmNewPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "recovery" });
      if (otpError) throw otpError;
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setStep("done");
    } catch (err) {
      setError(err.message === "Token has expired or is invalid" ? "Code invalide ou expiré. Redemandez un code." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 font-sans py-10">
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-6">
          <ArrowLeft size={13} /> Retour à la connexion
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-serif text-2xl font-bold mx-auto mb-3">
            R
          </div>
          <h1 className="font-serif text-2xl text-slate-50">Mot de passe oublié</h1>
          <p className="text-xs text-slate-500 mt-1">
            {step === "start" && "Choisissez comment retrouver l'accès à votre compte."}
            {step === "email" && "Ancien compte : recevez un code par email pour réinitialiser votre mot de passe."}
            {step === "code" && "Entrez le code reçu et choisissez un nouveau mot de passe."}
            {step === "done" && "Votre mot de passe a été mis à jour."}
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-md p-6">
          {step === "start" && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-200 flex items-center gap-2 mb-1.5"><Phone size={15} className="text-amber-400" /> Compte connecté avec un numéro</p>
                <p className="text-xs text-slate-400 mb-3">
                  Écrivez-nous sur WhatsApp depuis le numéro de votre compte. Nous vous envoyons un mot de passe temporaire ;
                  vous pourrez ensuite le changer dans Paramètres.
                </p>
                <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium rounded-md py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
                  <MessageCircle size={15} /> Contacter le support sur WhatsApp
                </a>
              </div>
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-500 mb-2">Vous avez encore un ancien compte avec une adresse email ?</p>
                <button type="button" onClick={() => setStep("email")}
                  className="w-full border border-slate-700 hover:border-slate-500 text-slate-300 rounded-md py-2 text-sm flex items-center justify-center gap-2">
                  <MailCheck size={14} /> Recevoir un code par email
                </button>
              </div>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={sendCode} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Adresse email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
                  placeholder="toi@entreprise.com"
                />
              </div>
              {error && <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded-md px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-medium rounded-md py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <MailCheck size={14} />}
                Recevoir un code
              </button>
              <button type="button" onClick={() => setStep("start")} className="w-full text-[11px] text-slate-500 hover:text-slate-300 text-center">
                Retour aux options
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={confirmNewPassword} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Code reçu par email</label>
                <input
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tracking-widest text-center"
                  placeholder="123456"
                  maxLength={8}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 pr-10 text-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                    className="absolute right-0 top-0 h-full px-3 flex items-center text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded-md px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-medium rounded-md py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Valider le nouveau mot de passe
              </button>
              <button type="button" onClick={() => setStep("email")} className="w-full text-[11px] text-slate-500 hover:text-slate-300 text-center">
                Je n'ai pas reçu de code — recommencer
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center py-2">
              <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300 mb-5">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              <button onClick={onBack} className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium rounded-md py-2.5 text-sm">
                Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
