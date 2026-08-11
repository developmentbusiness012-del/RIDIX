import { supabase } from "./supabaseClient";

async function callFunction(name) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("not_authenticated");
  const { data, error } = await supabase.functions.invoke(name, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw error;
  return data;
}

// Crée un panier Maketou pour la formule choisie ("2m" ou "2y") et redirige
// immédiatement l'utilisateur vers le paiement.
export async function startPremiumCheckout(planKey = "2m") {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("not_authenticated");
  const { data, error } = await supabase.functions.invoke("create-payment-cart", {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: { planKey },
  });
  if (error) throw error;
  if (!data?.redirectUrl) throw new Error("no_redirect_url");
  window.location.href = data.redirectUrl;
}

// Interroge le statut du dernier panier de l'utilisateur.
// Retourne { status: 'completed' | 'waiting_payment' | 'abandoned' | 'payment_failed' | 'none' }
export async function verifyPayment() {
  return callFunction("verify-payment");
}

// Sonde verify-payment toutes les `intervalMs` jusqu'à un statut final ou expiration.
export async function pollPayment({ intervalMs = 3000, maxAttempts = 20, onTick } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await verifyPayment();
    onTick?.(result, attempt);
    if (result.status && result.status !== "waiting_payment" && result.status !== "none") {
      return result;
    }
    if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { status: "timeout" };
}
