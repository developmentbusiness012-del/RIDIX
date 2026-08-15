import { useState, useEffect } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { subscribeToPush, isPushSupported, getNotificationPermission } from "../pushNotifications";

export default function NotificationOptIn({ userId = null, context = "app", variant = "light", label = "Me rappeler" }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | denied | unsupported
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  if (!isPushSupported()) return null;
  if (permission === "granted" && status !== "loading") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${variant === "dark" ? "text-emerald-400" : "text-forest-bright"}`}>
        <Check size={13} /> Rappels activés
      </span>
    );
  }

  const handleClick = async () => {
    setStatus("loading");
    const res = await subscribeToPush(userId, context);
    if (res.ok) setStatus("done");
    else if (res.reason === "denied") setStatus("denied");
    else setStatus("idle");
  };

  if (status === "denied" || permission === "denied") {
    return <p className="text-xs text-slate-500">Notifications bloquées — activez-les dans les réglages de votre navigateur.</p>;
  }

  const styles = variant === "dark"
    ? "border border-slate-700 hover:border-amber-400/50 text-slate-200"
    : "border border-white/15 hover:border-gold/50 text-slate-200";

  return (
    <button onClick={handleClick} disabled={status === "loading"}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${styles}`}>
      {status === "loading" ? <BellRing size={13} className="animate-pulse" /> : <Bell size={13} />}
      {label}
    </button>
  );
}
