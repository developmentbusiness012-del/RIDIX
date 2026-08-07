import { useState } from "react";
import { Smartphone, Download, CheckCircle2 } from "lucide-react";
import { useInstallPrompt } from "../useInstallPrompt";
import InstallGuideModal from "./InstallGuideModal";

export default function InstallAppSection() {
  const { installed } = useInstallPrompt();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <section id="app" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/10">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-bright">Application mobile</span>
          <h2 className="font-serif font-semibold text-3xl text-slate-50 mt-3 mb-4">Emportez votre registre partout, comme une vraie app</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Installez Ridix Finance directement sur l'écran d'accueil de votre téléphone — Android ou iPhone.
            Pas de Play Store, pas d'App Store : une icône, un lancement en plein écran, et votre registre toujours à portée de main.
          </p>
          <ul className="space-y-2 mb-6">
            {["Icône sur l'écran d'accueil, comme une app installée", "Ouverture en plein écran, sans barre de navigateur", "Fonctionne même avec une connexion instable"].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 size={16} className="text-forest-bright mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>

          {installed ? (
            <div className="inline-flex items-center gap-2 text-sm text-forest-bright bg-forest/10 border border-forest/30 rounded-md px-4 py-2.5">
              <CheckCircle2 size={16} /> Application déjà installée sur cet appareil
            </div>
          ) : (
            <button onClick={() => setShowGuide(true)} className="inline-flex items-center gap-2 bg-gold hover:bg-gold-bright text-ink font-semibold rounded-md px-5 py-3 text-sm transition-colors">
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
        <p className="font-serif text-sm text-slate-100">Ridix Finance</p>
        <div className="w-full h-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <Smartphone size={22} className="text-gold-bright/60" />
        </div>
      </div>
    </div>
  );
}
