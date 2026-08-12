import { useState } from "react";
import {
  X, Download, Share, PlusSquare, MoreVertical, Monitor, Smartphone, Apple,
  CheckCircle2, Copy, Check, AlertTriangle, ExternalLink,
} from "lucide-react";
import { useInstallPrompt } from "../useInstallPrompt";

const APP_URL = "https://ridixx-finance.vercel.app/";

export default function InstallGuideModal({ onClose }) {
  const { canInstall, installed, promptInstall, platform, browser, inAppBrowser } = useInstallPrompt();
  const [showOther, setShowOther] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(APP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-end sm:items-center justify-center z-[200] p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-serif text-lg font-bold">R</div>
            <h3 className="font-serif text-lg text-slate-50">Installer l'application</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="px-5 pb-6">
          {installed ? (
            <div className="text-center py-10">
              <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300">RIDIX est déjà installée sur cet appareil.</p>
            </div>
          ) : inAppBrowser ? (
            <InAppBrowserWarning name={inAppBrowser} onCopy={copyLink} copied={copied} />
          ) : !showOther ? (
            <AutoGuide platform={platform} browser={browser} canInstall={canInstall} promptInstall={promptInstall} onNotMe={() => setShowOther(true)} />
          ) : (
            <AllOptions platform={platform} />
          )}
        </div>
      </div>
    </div>
  );
}

function InAppBrowserWarning({ name, onCopy, copied }) {
  const labels = { whatsapp: "WhatsApp", facebook: "Facebook", instagram: "Instagram", line: "Line" };
  return (
    <div>
      <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 mb-4">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200">
          Vous êtes dans <strong>{labels[name] || "une app"}</strong>, qui ne permet pas d'installer une application.
          Ouvrez ce lien dans votre navigateur (Chrome ou Safari) pour installer RIDIX.
        </p>
      </div>
      <p className="text-xs text-slate-500 mb-3">Deux façons de faire :</p>
      <ol className="space-y-3 mb-5">
        <li className="flex items-start gap-2.5 text-sm text-slate-300">
          <span className="w-5 h-5 rounded-full bg-amber-400/15 text-amber-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">1</span>
          Appuyez sur les <strong>trois points ⋮</strong> (ou le menu) en haut de l'écran
        </li>
        <li className="flex items-start gap-2.5 text-sm text-slate-300">
          <span className="w-5 h-5 rounded-full bg-amber-400/15 text-amber-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">2</span>
          Choisissez <strong>« Ouvrir dans le navigateur »</strong>
        </li>
      </ol>
      <p className="text-xs text-slate-500 mb-2">Ou copiez le lien et collez-le dans Chrome/Safari :</p>
      <button onClick={onCopy} className="w-full flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 rounded-md py-2.5 text-sm text-slate-200">
        {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
        {copied ? "Lien copié !" : "Copier le lien de RIDIX"}
      </button>
    </div>
  );
}

function AutoGuide({ platform, browser, canInstall, promptInstall, onNotMe }) {
  return (
    <div>
      {platform === "ios" ? (
        <IosSteps />
      ) : canInstall ? (
        <div className="text-center py-4">
          <Smartphone size={28} className="text-amber-400 mx-auto mb-4" />
          <p className="text-sm text-slate-400 mb-5">Un seul bouton suffit sur votre appareil.</p>
          <button onClick={promptInstall} className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-md px-6 py-3 text-sm">
            <Download size={16} /> Installer maintenant
          </button>
        </div>
      ) : platform === "android" ? (
        <AndroidSteps />
      ) : browser === "firefox" ? (
        <p className="text-sm text-slate-400 leading-relaxed">
          Firefox ne permet pas encore d'installer RIDIX. Ouvrez <strong className="text-slate-200">ridixx-finance.vercel.app</strong> avec <strong className="text-slate-200">Chrome</strong> ou <strong className="text-slate-200">Edge</strong> pour l'installer.
        </p>
      ) : (
        <DesktopSteps />
      )}

      <button onClick={onNotMe} className="w-full text-center text-xs text-slate-500 hover:text-slate-300 mt-5 flex items-center justify-center gap-1">
        Ce n'est pas votre appareil ? <ExternalLink size={11} />
      </button>
    </div>
  );
}

function AllOptions({ platform }) {
  const [tab, setTab] = useState(platform === "ios" ? "ios" : "android");
  return (
    <div>
      <div className="flex gap-1 mb-4 border-b border-slate-800">
        {[
          { id: "android", label: "Android", icon: Smartphone },
          { id: "ios", label: "iPhone", icon: Apple },
          { id: "desktop", label: "Ordinateur", icon: Monitor },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2.5 border-b-2 -mb-px ${tab === t.id ? "border-amber-400 text-slate-50" : "border-transparent text-slate-500"}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "android" && <AndroidSteps />}
      {tab === "ios" && <IosSteps />}
      {tab === "desktop" && <DesktopSteps />}
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

function AndroidSteps() {
  return (
    <>
      <p className="text-xs text-slate-500 mb-3">Depuis Chrome sur Android :</p>
      <ol className="space-y-3">
        <Step n="1">Appuyez sur le menu <MoreVertical size={13} className="inline mx-1 text-amber-400" /> en haut à droite</Step>
        <Step n="2">Choisissez <strong>« Installer l'application »</strong></Step>
      </ol>
    </>
  );
}

function IosSteps() {
  return (
    <>
      <p className="text-xs text-slate-500 mb-3">Depuis Safari sur iPhone/iPad :</p>
      <ol className="space-y-3">
        <Step n="1">Appuyez sur <Share size={13} className="inline mx-1 text-amber-400" /> Partager, en bas de l'écran</Step>
        <Step n="2">Choisissez <PlusSquare size={13} className="inline mx-1 text-amber-400" /> <strong>« Sur l'écran d'accueil »</strong></Step>
        <Step n="3">Appuyez sur <strong>« Ajouter »</strong></Step>
      </ol>
    </>
  );
}

function DesktopSteps() {
  return (
    <>
      <p className="text-xs text-slate-500 mb-3">Depuis Chrome ou Edge :</p>
      <ol className="space-y-3">
        <Step n="1">Repérez l'icône d'installation <Monitor size={13} className="inline mx-1 text-amber-400" /> dans la barre d'adresse</Step>
        <Step n="2">Cliquez sur <strong>« Installer »</strong></Step>
      </ol>
    </>
  );
}
