import { useState } from "react";
import { Download, X } from "lucide-react";
import { useInstallPrompt } from "../useInstallPrompt";
import InstallGuideModal from "./InstallGuideModal";

// CTA persistant : reste visible sur toutes les pages tant que l'app n'est pas
// installée sur l'appareil. Un "x" le masque juste pour la session en cours
// (il revient à la prochaine ouverture tant que l'app n'est toujours pas installée).
export default function InstallFloatingCTA() {
  const { installed } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (installed || dismissed) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm">
        <div className="flex items-center gap-3 bg-slate-900 border border-amber-400/30 rounded-full pl-4 pr-2 py-2 shadow-2xl shadow-black/40">
          <span className="text-xs text-slate-200 flex-1">
            <span className="font-medium">Installez l'app</span> — accès en un tap, même hors ligne.
          </span>
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-full px-3 py-2 shrink-0"
          >
            <Download size={13} /> Installer
          </button>
          <button onClick={() => setDismissed(true)} className="text-slate-600 hover:text-slate-300 p-1 shrink-0" title="Masquer pour cette session">
            <X size={14} />
          </button>
        </div>
      </div>

      {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} />}
    </>
  );
}
