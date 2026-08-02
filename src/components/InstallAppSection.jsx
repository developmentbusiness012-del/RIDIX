import { Smartphone, Download, Share, PlusSquare, CheckCircle2, Apple } from "lucide-react";
import { useInstallPrompt } from "../useInstallPrompt";

export default function InstallAppSection() {
  const { canInstall, installed, promptInstall, platform } = useInstallPrompt();

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
          ) : platform === "ios" ? (
            <IosInstructions />
          ) : canInstall ? (
            <button onClick={promptInstall} className="inline-flex items-center gap-2 bg-gold hover:bg-gold-bright text-ink font-semibold rounded-md px-5 py-3 text-sm transition-colors">
              <Download size={16} /> Installer l'application
            </button>
          ) : (
            <p className="text-xs text-slate-500 bg-white/[0.03] border border-white/10 rounded-md px-4 py-3 max-w-sm">
              Ouvrez ce site depuis votre téléphone (Chrome sur Android ou Safari sur iPhone) pour l'installer.
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

function IosInstructions() {
  return (
    <div className="border border-white/10 bg-white/[0.03] rounded-lg p-4 max-w-sm">
      <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5"><Apple size={13} /> Sur iPhone / iPad (via Safari) :</p>
      <ol className="space-y-2 text-xs text-slate-300">
        <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gold/15 text-gold-bright flex items-center justify-center font-mono text-[10px] shrink-0">1</span>Appuyez sur <Share size={13} className="inline mx-1 text-gold-bright" /> Partager, en bas de l'écran</li>
        <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gold/15 text-gold-bright flex items-center justify-center font-mono text-[10px] shrink-0">2</span>Faites défiler et choisissez <PlusSquare size={13} className="inline mx-1 text-gold-bright" /> "Sur l'écran d'accueil"</li>
        <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gold/15 text-gold-bright flex items-center justify-center font-mono text-[10px] shrink-0">3</span>Appuyez sur "Ajouter"</li>
      </ol>
    </div>
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
