import { useState } from "react";
import { Smartphone, Download, CheckCircle2 } from "lucide-react";
import { useInstallPrompt } from "../useInstallPrompt";
import InstallGuideModal from "./InstallGuideModal";

export default function InstallAppSection() {
  const { installed } = useInstallPrompt();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <section id="app" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-ink/5">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest">Application mobile</span>
          <h2 className="font-serif font-semibold text-3xl text-ink mt-3 mb-4">Emportez votre registre partout, comme une vraie app</h2>
          <p className="text-ink/60 text-[15px] leading-relaxed mb-6">
            Installez RIDIX directement sur l'écran d'accueil de votre téléphone — Android ou iPhone.
            Pas de Play Store, pas d'App Store : une icône, un lancement en plein écran, et votre registre toujours à portée de main.
          </p>
          <ul className="space-y-2 mb-6">
            {["Icône sur l'écran d'accueil, comme une app installée", "Ouverture en plein écran, sans barre de navigateur", "Fonctionne même avec une connexion instable"].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink/70">
                <CheckCircle2 size={16} className="text-forest mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>

          {installed ? (
            <div className="inline-flex items-center gap-2 text-sm text-forest bg-forest/10 border border-forest/25 rounded-full px-4 py-2.5">
              <CheckCircle2 size={16} /> Application déjà installée sur cet appareil
            </div>
          ) : (
            <button onClick={() => setShowGuide(true)} className="inline-flex items-center gap-2 bg-gradient-to-r from-gold to-gold-bright text-ink font-semibold rounded-full px-6 py-3.5 text-sm shadow-lg shadow-gold/25 hover:-translate-y-0.5 transition-all">
              <Download size={16} /> Installer l'application
            </button>
          )}
        </div>

        <div className="flex justify-center">
          <PhoneMockup />
        </div>
      </div>
      {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} />}
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="w-56 h-[440px] rounded-[2.5rem] border-8 border-slate-800 bg-ink relative overflow-hidden shadow-2xl shadow-black/50">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-xl z-10" />
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center font-serif text-3xl font-bold text-ink">R</div>
        <p className="font-serif text-sm text-slate-100">Ridix</p>
        <div className="w-full h-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <Smartphone size={22} className="text-gold-bright/60" />
        </div>
      </div>
    </div>
  );
}
