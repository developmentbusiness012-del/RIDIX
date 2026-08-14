import { PartyPopper, Boxes, HandCoins, Sparkles, FileText, BookOpen, ArrowRight } from "lucide-react";

export default function WelcomeModal({ role, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-950/85 flex items-end sm:items-center justify-center z-[350] p-0 sm:p-4">
      <div className="bg-slate-900 border border-amber-400/20 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        <div className="bg-gradient-to-b from-amber-400/10 to-transparent px-6 pt-8 pb-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-4">
            <PartyPopper size={26} />
          </div>
          <h2 className="font-serif text-2xl text-slate-50 mb-2">Bienvenue chez RIDIX !</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Vous venez de faire <strong className="text-amber-300">le bon choix</strong> pour votre commerce.
            Fini le cahier qu'on égare, les calculs qui ne tombent jamais juste — vous avez maintenant un vrai
            registre financier dans votre poche.
          </p>
        </div>

        <div className="px-6 py-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Ce qui vous attend</p>
          <div className="space-y-2.5 mb-5">
            <Perk icon={Boxes} text="Un stock qui se met à jour tout seul à chaque vente" />
            <Perk icon={HandCoins} text="Vos créances et dettes, enfin sous contrôle" />
            <Perk icon={Sparkles} text="Un score de santé financière pour piloter sereinement" />
            <Perk icon={FileText} text="Un dossier prêt à montrer à votre banque, en un clic" />
          </div>

          {role !== "employe" && (
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Ces fonctionnalités font partie de l'offre <strong className="text-amber-300">Premium</strong> — vous
              pouvez commencer gratuitement dès maintenant avec le registre de base, et passer en Premium quand vous
              serez prêt à aller plus loin.
            </p>
          )}

          <div className="flex items-start gap-2.5 bg-slate-800/60 border border-slate-700 rounded-md px-3 py-3 mb-6">
            <BookOpen size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              <strong className="text-slate-200">NB :</strong> un guide d'utilisation complet est disponible à tout
              moment dans <strong className="text-slate-200">Paramètres → Guide d'utilisation</strong> si vous avez
              une question.
            </p>
          </div>

          <button onClick={onClose} className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-md py-3 text-sm transition-colors">
            C'est parti <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Perk({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-slate-300">
      <div className="w-7 h-7 rounded-md bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-amber-400" />
      </div>
      {text}
    </div>
  );
}
