import { PAYS_AFRIQUE } from "./constants";

// Connexion par numéro de téléphone.
// Le numéro est l'identifiant de connexion ; en interne il est transformé en un identifiant
// technique « <numéro>@phone.invalid » (domaine réservé : il ne peut ni recevoir ni envoyer de mail).
// Aucun email n'est demandé ni utilisé.
export const PHONE_DOMAIN = "phone.invalid";

export const DIAL_CODES = {
  "Afrique du Sud": "27", "Algérie": "213", "Angola": "244", "Bénin": "229", "Botswana": "267", "Burkina Faso": "226",
  "Burundi": "257", "Cameroun": "237", "Cap-Vert": "238", "Comores": "269", "Congo-Brazzaville": "242",
  "Congo-Kinshasa (RDC)": "243", "Côte d'Ivoire": "225", "Djibouti": "253", "Égypte": "20", "Érythrée": "291",
  "Eswatini": "268", "Éthiopie": "251", "Gabon": "241", "Gambie": "220", "Ghana": "233", "Guinée": "224",
  "Guinée-Bissau": "245", "Guinée équatoriale": "240", "Kenya": "254", "Lesotho": "266", "Liberia": "231",
  "Libye": "218", "Madagascar": "261", "Malawi": "265", "Mali": "223", "Maroc": "212", "Maurice": "230",
  "Mauritanie": "222", "Mozambique": "258", "Namibie": "264", "Niger": "227", "Nigeria": "234", "Ouganda": "256",
  "Rwanda": "250", "Sao Tomé-et-Principe": "239", "Sénégal": "221", "Seychelles": "248", "Sierra Leone": "232",
  "Somalie": "252", "Soudan": "249", "Soudan du Sud": "211", "Tanzanie": "255", "Tchad": "235", "Togo": "228",
  "Tunisie": "216", "Zambie": "260", "Zimbabwe": "263",
};

// Options du sélecteur d'indicatif : « +237 Cameroun », … (+ « Autre » : saisir le numéro avec son +indicatif).
export const DIAL_OPTIONS = [
  ...PAYS_AFRIQUE.filter((p) => DIAL_CODES[p]).map((p) => ({ dial: DIAL_CODES[p], label: `+${DIAL_CODES[p]} ${p}` })),
  { dial: "", label: "Autre pays (saisir +indicatif)" },
];
export const DEFAULT_DIAL = "237";

// Renvoie les chiffres du numéro au format international (sans « + »), ou null s'il est invalide.
//   « 6 90 00 00 00 » + indicatif 237  → 237690000000
//   « 0690000000 »    + indicatif 237  → 237690000000   (zéro de tête ignoré)
//   « +237 690 00 00 00 » ou « 00237… » → 237690000000   (indicatif déjà fourni)
export function normalizePhone(input, dial = "") {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const international = raw.startsWith("+") || raw.startsWith("00");
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("00")) digits = digits.slice(2);
  if (!international) {
    digits = digits.replace(/^0+/, "");
    if (dial && !(digits.startsWith(dial) && digits.length >= dial.length + 8)) digits = dial + digits;
  }
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export const phoneToEmail = (digits) => `${digits}@${PHONE_DOMAIN}`;
export const isPhoneEmail = (email) => typeof email === "string" && email.toLowerCase().endsWith("@" + PHONE_DOMAIN);

// Ce qu'on affiche à la place d'un email technique : « +237690000000 ».
export function displayContact(emailOrPhone) {
  if (!emailOrPhone) return emailOrPhone;
  return isPhoneEmail(emailOrPhone) ? "+" + emailOrPhone.split("@")[0] : emailOrPhone;
}
