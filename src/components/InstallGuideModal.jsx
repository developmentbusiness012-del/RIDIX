import { useState } from "react";
import { X, Download, Share, PlusSquare, MoreVertical, Monitor, Smartphone, Apple, CheckCircle2 } from "lucide-react";
import { useInstallPrompt } from "../useInstallPrompt";

const PLATFORM_TABS = [
  { id: "android", label: "Android", icon: Smartphone },
  { id: "ios", label: "iPhone", icon: Apple },
  { id: "desktop", label: "Ordinateur", icon: Monitor },
];

export default function InstallGuideModal({ onClose }) {
  const { canInstall, installed, promptInstall, platform, browser } = useInstallPrompt();
  const detectedTab = platform === "ios" ? "ios" : platform === "android" ? "android" : "desktop";
  const [tab, setTab] = useState(detectedTab);

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-end sm:items-center justify-center z-[200] p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-serif text-lg font-bold">R</div>
            <h3 className="font-serif text-lg text-slate-50">Installer l'application</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>

        {installed ? (
          <div className="text-center py-14 px-6">
            <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-slate-300">Ridix Finance est déjà installée sur cet appareil.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-1 px-5 mt-4 border-b border-slate-800">
              {PLATFORM_TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2.5 border-b-2 -mb-px ${tab === t.id ? "border-amber-400 text-slate-50" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                  <t.icon size={13} /> {t.label}
                  {t.id === detectedTab && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === "android" && (
                <AndroidGuide canInstall={canInstall} promptInstall={promptInstall} isCurrentDevice={detectedTab === "android"} />
              )}
              {tab === "ios" && <IosGuide isCurrentDevice={detectedTab === "ios"} />}
              {tab === "desktop" && (
                <DesktopGuide canInstall={canInstall} promptInstall={promptInstall} browser={browser} isCurrentDevice={detectedTab === "desktop"} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-300">
      <span className="w-5 h-5 rounded-full bg-amber-400/15 text-amber-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">{n}</span>
      <span>{children}</span>
    </li>
  );
}

function AndroidGuide({ canInstall, promptInstall, isCurrentDevice }) {
  if (isCurrentDevice && canInstall) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-400 mb-5">Votre appareil peut installer l'application directement.</p>
        <button onClick={promptInstall} className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-md px-5 py-3 text-sm">
          <Download size={16} /> Installer maintenant
        </button>
      </div>
    );
  }
  return (
    <>
      <p className="text-xs text-slate-500 mb-3">Depuis Chrome sur Android :</p>
      <ol className="space-y-3">
        <Step n="1">Ouvrez <span className="text-slate-100 font-medium">ridixfinance.com</span> dans Chrome.</Step>
        <Step n="2">Appuyez sur le menu <MoreVertical size={13} className="inline mx-1 text-amber-400" /> en haut à droite.</Step>
        <Step n="3">Choisissez <span className="text-slate-100 font-medium">"Installer l'application"</span> ou "Ajouter à l'écran d'accueil".</Step>
      </ol>
      {!isCurrentDevice && <p className="text-[11px] text-slate-600 mt-4">Ouvrez ce lien directement depuis le téléphone Android concerné pour voir le bouton d'installation direct.</p>}
    </>
  );
}

function IosGuide() {
  return (
    <>
      <p className="text-xs text-slate-500 mb-3">Depuis Safari sur iPhone/iPad (obligatoire — Chrome ne permet pas l'installation sur iOS) :</p>
      <ol className="space-y-3">
        <Step n="1">Ouvrez <span className="text-slate-100 font-medium">ridixfinance.com</span> dans Safari.</Step>
        <Step n="2">Appuyez sur <Share size={13} className="inline mx-1 text-amber-400" /> Partager, en bas de l'écran.</Step>
        <Step n="3">Faites défiler et choisissez <PlusSquare size={13} className="inline mx-1 text-amber-400" /> "Sur l'écran d'accueil".</Step>
        <Step n="4">Appuyez sur "Ajouter" en haut à droite.</Step>
      </ol>
    </>
  );
}

function DesktopGuide({ canInstall, promptInstall, browser, isCurrentDevice }) {
  if (isCurrentDevice && canInstall) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-400 mb-5">Votre navigateur peut installer l'application directement.</p>
        <button onClick={promptInstall} className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-md px-5 py-3 text-sm">
          <Download size={16} /> Installer maintenant
        </button>
      </div>
    );
  }
  if (browser === "firefox") {
    return (
      <p className="text-xs text-slate-400 leading-relaxed">
        Firefox ne permet pas d'installer d'application web pour le moment. Ouvrez <span className="text-slate-100 font-medium">ridixfinance.com</span> avec <span className="text-slate-100 font-medium">Chrome</span> ou <span className="text-slate-100 font-medium">Edge</span> pour pouvoir l'installer.
      </p>
    );
  }
  return (
    <>
      <p className="text-xs text-slate-500 mb-3">Depuis Chrome ou Edge sur ordinateur :</p>
      <ol className="space-y-3">
        <Step n="1">Ouvrez <span className="text-slate-100 font-medium">ridixfinance.com</span>.</Step>
        <Step n="2">Repérez l'icône d'installation <Monitor size={13} className="inline mx-1 text-amber-400" /> dans la barre d'adresse (à droite), ou le menu ⋮.</Step>
        <Step n="3">Cliquez sur "Installer Ridix Finance".</Step>
      </ol>
    </>
  );
}
