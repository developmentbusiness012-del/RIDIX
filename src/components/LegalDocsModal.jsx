import { useState } from "react";
import { X, FileText, ShieldCheck } from "lucide-react";

const LAST_UPDATE = "11 août 2026";

export default function LegalDocsModal({ initialTab = "cgu", onClose }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-end sm:items-center justify-center z-[400] p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 sticky top-0 bg-slate-900 pb-3 border-b border-slate-800 z-10">
          <div className="flex gap-1">
            <button onClick={() => setTab("cgu")}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-md ${tab === "cgu" ? "bg-slate-800 text-slate-50" : "text-slate-500 hover:text-slate-300"}`}>
              <FileText size={14} /> CGU
            </button>
            <button onClick={() => setTab("confidentialite")}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-md ${tab === "confidentialite" ? "bg-slate-800 text-slate-50" : "text-slate-500 hover:text-slate-300"}`}>
              <ShieldCheck size={14} /> Confidentialité
            </button>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="p-5 text-sm text-slate-300 leading-relaxed space-y-4">
          {tab === "cgu" ? <CguContent /> : <PrivacyContent />}
        </div>
      </div>
    </div>
  );
}

function H({ children }) {
  return <h3 className="font-serif text-base text-slate-50 mt-5 mb-1.5 first:mt-0">{children}</h3>;
}
function P({ children }) {
  return <p className="text-xs text-slate-400 leading-relaxed">{children}</p>;
}
function Ul({ children }) {
  return <ul className="text-xs text-slate-400 leading-relaxed space-y-1 list-disc pl-4">{children}</ul>;
}

function CguContent() {
  return (
    <>
      <p className="text-[11px] text-slate-500">Dernière mise à jour : {LAST_UPDATE}</p>

      <H>1. Objet</H>
      <P>Les présentes Conditions Générales d'Utilisation (« CGU ») encadrent l'accès et l'utilisation de l'application RIDIX, éditée par Mpot Batoum Maurel Moïse, ci-après « l'Éditeur ». En créant un compte, vous acceptez sans réserve les présentes CGU.</P>

      <H>2. Description du service</H>
      <P>RIDIX est une application de gestion financière destinée aux commerçants, importateurs et exportateurs. Elle permet notamment l'enregistrement de recettes et dépenses, la gestion de stock, le suivi de créances et dettes, la génération de rapports financiers, et un abonnement Premium payant donnant accès à des fonctionnalités avancées.</P>

      <H>3. Création de compte</H>
      <Ul>
        <li>Vous devez fournir une adresse email valide et exacte.</li>
        <li>Vous êtes responsable de la confidentialité de votre mot de passe et de toute activité effectuée depuis votre compte.</li>
        <li>Un compte « propriétaire » peut inviter des « employés » via un code entreprise unique ; le propriétaire reste seul responsable de la gestion des accès de son entreprise.</li>
      </Ul>

      <H>4. Abonnement Premium</H>
      <Ul>
        <li>L'abonnement Premium est proposé sous forme de formules à durée déterminée (actuellement 2 mois ou 2 ans), payables via la plateforme tierce Maketou.</li>
        <li>L'abonnement n'est pas reconduit automatiquement. À l'échéance, le compte repasse automatiquement en offre Freemium si aucun renouvellement n'est effectué.</li>
        <li>Les paiements sont traités par Maketou ; l'Éditeur n'a pas accès à vos données de paiement (numéro de carte, Mobile Money, etc.).</li>
        <li>Sauf erreur technique avérée, les paiements effectués ne sont pas remboursables.</li>
      </Ul>

      <H>5. Utilisation autorisée</H>
      <P>Vous vous engagez à utiliser RIDIX conformément à la loi, à ne pas tenter d'en contourner les mesures de sécurité, et à ne pas l'utiliser à des fins frauduleuses. L'Éditeur se réserve le droit de suspendre tout compte utilisé en violation des présentes CGU.</P>

      <H>6. Vos données financières</H>
      <P>Les données que vous enregistrez (écritures, stock, créances, dettes) vous appartiennent. L'Éditeur ne les utilise pas à des fins commerciales autres que la fourniture du service, et ne les revend à aucun tiers. Voir la Politique de confidentialité pour le détail.</P>

      <H>7. Disponibilité du service</H>
      <P>L'Éditeur s'efforce d'assurer un accès continu au service, sans garantie de disponibilité absolue. Le service peut être interrompu pour maintenance, ou en cas de force majeure ou de défaillance d'un prestataire technique tiers (hébergement, paiement).</P>

      <H>8. Limitation de responsabilité</H>
      <P>RIDIX est un outil d'aide à la gestion et ne remplace pas un conseil comptable, fiscal ou juridique professionnel. L'Éditeur ne saurait être tenu responsable des décisions prises sur la base des informations générées par l'application (score de santé financière, prévisions, dossier de financement), qui sont fournies à titre indicatif.</P>

      <H>9. Résiliation</H>
      <P>Vous pouvez cesser d'utiliser RIDIX à tout moment. Vous pouvez demander la suppression de votre compte et de vos données en contactant l'Éditeur (voir Politique de confidentialité).</P>

      <H>10. Modification des CGU</H>
      <P>Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs seront informés de toute modification substantielle.</P>

      <H>11. Droit applicable</H>
      <P>Les présentes CGU sont soumises au droit camerounais. Tout litige relève de la compétence des juridictions camerounaises.</P>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p className="text-[11px] text-slate-500">Dernière mise à jour : {LAST_UPDATE}</p>

      <H>1. Qui sommes-nous</H>
      <P>RIDIX est édité par Mpot Batoum Maurel Moïse, basé à Douala, Cameroun. Pour toute question relative à vos données personnelles, contactez-nous via la messagerie intégrée à l'application.</P>

      <H>2. Quelles données nous collectons</H>
      <Ul>
        <li><strong className="text-slate-300">Données de compte</strong> : email, mot de passe (chiffré, jamais lisible par nous), nom (pour les employés), pays.</li>
        <li><strong className="text-slate-300">Données d'entreprise</strong> : nom de l'entreprise, profil d'activité, devise.</li>
        <li><strong className="text-slate-300">Données financières</strong> : écritures (recettes/dépenses), stock, créances et dettes que vous saisissez vous-même.</li>
        <li><strong className="text-slate-300">Données techniques</strong> : date de connexion, appareil utilisé (pour la sécurité et le support).</li>
        <li>Nous ne collectons <strong className="text-slate-300">jamais</strong> vos identifiants de paiement (carte, Mobile Money) — ceux-ci sont traités uniquement par notre prestataire de paiement, Maketou.</li>
      </Ul>

      <H>3. Pourquoi nous les utilisons</H>
      <Ul>
        <li>Fournir et sécuriser le service (authentification, sauvegarde de vos données).</li>
        <li>Calculer les indicateurs financiers que vous consultez (score, prévisions, rapports).</li>
        <li>Gérer votre abonnement et vos paiements.</li>
        <li>Vous répondre via la messagerie de support.</li>
        <li>Établir des statistiques globales anonymisées (ex. répartition par pays), pour piloter le développement du produit.</li>
      </Ul>

      <H>4. Avec qui nous les partageons</H>
      <P>Nous ne vendons jamais vos données. Elles sont partagées uniquement avec les prestataires techniques nécessaires au fonctionnement du service :</P>
      <Ul>
        <li><strong className="text-slate-300">Supabase</strong> (hébergement de la base de données et authentification, serveurs situés en Union européenne).</li>
        <li><strong className="text-slate-300">Vercel</strong> (hébergement de l'application web).</li>
        <li><strong className="text-slate-300">Maketou</strong> (traitement des paiements — reçoit votre nom et email, jamais vos données financières internes).</li>
      </Ul>
      <P>Vos données financières internes (écritures, stock, créances) ne sont jamais transmises à Maketou ni à aucun tiers publicitaire.</P>

      <H>5. Combien de temps nous les gardons</H>
      <P>Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données personnelles sont supprimées sous 30 jours, sauf obligation légale de conservation plus longue (ex. données comptables).</P>

      <H>6. Vos droits</H>
      <P>Conformément à la loi camerounaise n° 2024/017 relative à la protection des données à caractère personnel, vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition sur vos données. Pour exercer ces droits, contactez-nous via la messagerie intégrée à l'application ; nous répondrons dans un délai raisonnable.</P>

      <H>7. Sécurité</H>
      <P>Vos données sont protégées par des règles d'accès strictes : chaque utilisateur n'accède qu'à ses propres données ou à celles de son entreprise, selon son rôle. Les mots de passe sont chiffrés et jamais stockés en clair.</P>

      <H>8. Notification en cas de faille</H>
      <P>En cas de violation de données susceptible d'engendrer un risque pour vos droits, nous nous engageons à vous en informer ainsi que l'autorité compétente dans les meilleurs délais, conformément à la réglementation en vigueur.</P>

      <H>9. Modification de cette politique</H>
      <P>Cette politique peut être mise à jour. La date de dernière modification est indiquée en haut de ce document.</P>
    </>
  );
}
