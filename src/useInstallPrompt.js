import { useState, useEffect, useCallback } from "react";

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setInstalled(!!isStandalone);

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt]);

  const platform = (() => {
    const ua = window.navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "ios";
    if (/android/i.test(ua)) return "android";
    if (/Mac OS X/.test(ua) && navigator.maxTouchPoints <= 1) return "mac";
    if (/Windows/.test(ua)) return "windows";
    return "other";
  })();

  const browser = (() => {
    const ua = window.navigator.userAgent || "";
    if (/Edg\//.test(ua)) return "edge";
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "chrome";
    if (/Firefox\//.test(ua)) return "firefox";
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "safari";
    return "other";
  })();

  // Les navigateurs intégrés (WhatsApp, Facebook, Instagram, Messenger) bloquent
  // l'installation d'une app web, quel que soit le bouton sur lequel on appuie.
  // C'est la cause la plus fréquente de "l'installation ne marche pas".
  const inAppBrowser = (() => {
    const ua = window.navigator.userAgent || "";
    if (/\bWhatsApp\b/i.test(ua)) return "whatsapp";
    if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
    if (/Instagram/i.test(ua)) return "instagram";
    if (/\bLine\//i.test(ua)) return "line";
    return null;
  })();

  return { canInstall: !!deferredPrompt, installed, promptInstall, platform, browser, inAppBrowser };
}
