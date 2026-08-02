// Permet d'enregistrer des écritures hors connexion : elles sont stockées localement
// puis synchronisées automatiquement avec Supabase dès que la connexion revient.

const QUEUE_KEY = "ridix_pending_tx_v1";
const CACHE_PREFIX = "ridix_cache_v1_";

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getPending(companyId) {
  const queue = readQueue();
  return queue[companyId] || [];
}

export function addPending(companyId, tx) {
  const queue = readQueue();
  const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = { ...tx, id: localId, company_id: companyId, _pending: true, _localId: localId };
  queue[companyId] = [...(queue[companyId] || []), entry];
  writeQueue(queue);
  return entry;
}

export function removePending(companyId, localId) {
  const queue = readQueue();
  queue[companyId] = (queue[companyId] || []).filter((t) => t._localId !== localId);
  writeQueue(queue);
}

export function pendingCountAll() {
  const queue = readQueue();
  return Object.values(queue).reduce((sum, arr) => sum + arr.length, 0);
}

// Tente d'envoyer chaque écriture en attente pour une entreprise donnée.
// Retourne { syncedLocalIds, syncedRows } pour que l'appelant mette à jour son état local.
export async function syncPendingForCompany(companyId, supabase) {
  const pending = getPending(companyId);
  if (pending.length === 0) return { syncedLocalIds: [], syncedRows: [] };

  const syncedLocalIds = [];
  const syncedRows = [];

  for (const entry of pending) {
    const { _pending, _localId, id, ...payload } = entry;
    try {
      const { data, error } = await supabase.from("transactions").insert(payload).select().single();
      if (!error && data) {
        removePending(companyId, _localId);
        syncedLocalIds.push(_localId);
        syncedRows.push(data);
      }
    } catch {
      // Toujours hors ligne ou erreur réseau : on la laisse en attente, on réessaiera plus tard.
      break;
    }
  }
  return { syncedLocalIds, syncedRows };
}

// ---------- Cache de lecture (pour afficher des données même hors ligne) ----------
export function cacheSet(key, value) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* stockage plein ou indisponible : tant pis, pas critique */
  }
}

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
