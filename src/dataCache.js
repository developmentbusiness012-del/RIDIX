// Cache mémoire partagé (durée de vie = session de l'onglet) pour l'approche
// « afficher tout de suite ce qu'on connaît, puis rafraîchir en arrière-plan ».
// Les onglets Stock / Crédits / Bilan / Documents l'utilisent pour s'ouvrir sans écran de chargement.
const mem = new Map();

export const memGet = (key) => mem.get(key);
export const memSet = (key, value) => {
  mem.set(key, value);
  return value;
};
export const memClear = () => mem.clear();
