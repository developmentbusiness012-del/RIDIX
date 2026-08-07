import { useState } from "react";
import { CheckCircle2, Download, Smartphone } from "lucide-react";
import { useInstallPrompt } from "../useInstallPrompt";
import InstallGuideModal from "./InstallGuideModal";

export default function InstallAppTab() {
  const { installed } = useInstallPrompt();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="max-w-lg mx-auto text-center py-10 mb-10">
      <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-5">
        <Smartphone size={26} className="text-amber-400" />
      </div>
      <h2 className="font-serif text-xl text-slate-50 mb-2">Installer l'application</h2>
      <p className="text-sm text-slate-400 mb-6">
        Ajoutez Ridix Finance sur votre écran d'accueil pour l'ouvrir en un geste, comme une vraie application — sans passer par le navigateur.
      </p>

      {installed ? (
        <div className="inline-flex items-center gap-2 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800/50 rounded-md px-4 py-2.5">
          <CheckCircle2 size={16} /> Application déjà installée sur cet appareil
        </div>
      ) : (
        <button onClick={() => setShowGuide(true)} className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-md px-5 py-3 text-sm transition-colors">
          <Download size={16} /> Voir le guide d'installation
        </button>
      )}

      {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
