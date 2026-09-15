import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

const WHATSAPP_CONTACT_URL = "https://wa.me/message/FYWJGBC3C22FH1?src=qr";

// Bouton flottant persistant (bas-droite) : toujours visible pendant le scroll, contrairement
// au CTA "service client" qui était enfoui tout en bas de la page. Décalé vers le haut sur mobile
// pour ne pas chevaucher la bannière d'installation (InstallFloatingCTA, elle-même en bas-centre).
export default function WhatsAppFloatingCTA() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2">
      {expanded && (
        <div className="hidden sm:flex items-center gap-2 bg-white border border-ink/10 rounded-full pl-4 pr-1.5 py-1.5 shadow-2xl shadow-ink/20 animate-in fade-in slide-in-from-right-2">
          <span className="text-xs text-ink/70 whitespace-nowrap">
            <span className="font-semibold text-ink">Accompagnement personnalisé</span> — parlons-en
          </span>
          <button onClick={() => setExpanded(false)} className="text-ink/30 hover:text-ink/60 p-1 shrink-0" title="Réduire">
            <X size={13} />
          </button>
        </div>
      )}
      <a
        href={WHATSAPP_CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Contacter le service client sur WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-2xl shadow-emerald-500/40 hover:scale-105 transition-all shrink-0"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
        <MessageCircle size={26} className="text-white relative" fill="currentColor" strokeWidth={0} />
      </a>
    </div>
  );
}
