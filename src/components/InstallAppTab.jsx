import { Download, Share, PlusSquare, CheckCircle2, Apple, Smartphone } from "lucide-react";
import { useInstallPrompt } from "../useInstallPrompt";

export default function InstallAppTab() {
  const { canInstall, installed, promptInstall, platform } = useInstallPrompt();

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
      ) : platform === "ios" ? (
        <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-5 text-left max-w-sm mx-auto">
          <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5"><Apple size={13} /> Sur iPhone / iPad (via Safari) :</p>
          <ol className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-amber-400/15 text-amber-400 flex items-center justify-center font-mono text-[10px] shrink-0">1</span>Appuyez sur <Share size={13} className="inline mx-1 text-amber-400" /> Partager, en bas de l'écran</li>
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-amber-400/15 text-amber-400 flex items-center justify-center font-mono text-[10px] shrink-0">2</span>Choisissez <PlusSquare size={13} className="inline mx-1 text-amber-400" /> "Sur l'écran d'accueil"</li>
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-amber-400/15 text-amber-400 flex items-center justify-center font-mono text-[10px] shrink-0">3</span>Appuyez sur "Ajouter"</li>
          </ol>
        </div>
      ) : canInstall ? (
        <button onClick={promptInstall} className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-md px-5 py-3 text-sm transition-colors">
          <Download size={16} /> Installer l'application
        </button>
      ) : (
        <p className="text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-md px-4 py-3 max-w-sm mx-auto">
          Ouvrez cette page depuis Chrome (Android) ou Safari (iPhone) pour pouvoir l'installer. Sur ordinateur, votre navigateur peut aussi proposer l'installation depuis sa barre d'adresse.
        </p>
      )}
    </div>
  );
}
