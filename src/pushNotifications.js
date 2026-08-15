import { supabase } from "./supabaseClient";

// Clé publique VAPID — sûre à exposer côté client (c'est sa fonction).
const VAPID_PUBLIC_KEY = "BCXRSAGIMa5l1iG0J-7fvAl-OPVDuIB_0TvbWbsyfuC_rDtQuMKQTU52TIAEu6vT2PAbzwx2erE_wM5nqYpkzCg";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

function getDeviceId() {
  let id = localStorage.getItem("ridix_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("ridix_device_id", id);
  }
  return id;
}

// Demande la permission puis enregistre l'abonnement push, pour un utilisateur
// connecté (userId fourni) ou un visiteur anonyme (userId = null).
export async function subscribeToPush(userId, context = "app") {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      device_id: getDeviceId(),
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth_key: json.keys.auth,
      context,
    },
    { onConflict: "endpoint" }
  );
  if (error) return { ok: false, reason: "save_failed" };
  return { ok: true };
}

export function getNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission; // 'default' | 'granted' | 'denied'
}
