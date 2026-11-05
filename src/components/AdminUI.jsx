import { X } from "lucide-react";

// Composants communs de l'espace administrateur : pensés d'abord pour le téléphone
// (zones tactiles ≥ 44 px, textes ≥ 16 px dans les champs pour éviter le zoom iOS, tiroirs en bas d'écran).

// Champs de formulaire : 16 px sur mobile (pas de zoom automatique sur iPhone), 14 px sur ordinateur.
export const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-base sm:text-sm sm:py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/70";

export const btnPrimary = "bg-amber-400 hover:bg-amber-300 active:bg-amber-300 disabled:opacity-60 text-slate-950 font-medium rounded-lg px-4 py-3 sm:py-2.5 text-sm flex items-center justify-center gap-2 transition-colors";
export const btnGhost = "border border-slate-700 hover:border-slate-500 active:bg-slate-800 text-slate-300 rounded-lg px-3 py-2.5 sm:py-2 text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40";

// Fenêtre : tiroir qui monte du bas sur téléphone, fenêtre centrée sur ordinateur.
export function Sheet({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-slate-900 border-t sm:border border-slate-700 w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-md"} rounded-t-2xl sm:rounded-xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-slate-800 shrink-0">
          <div className="min-w-0">
            <div className="sm:hidden mx-auto w-10 h-1 rounded-full bg-slate-700 mb-2.5" />
            <h3 className="font-serif text-slate-100 truncate">{title}</h3>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-100 p-2 -mr-2 shrink-0"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

// Indicateur clé
export function Kpi({ icon: Icon, label, value, sub, tone = "text-slate-50", iconTone = "text-amber-400", onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`bg-slate-900/70 border border-slate-800 rounded-xl px-3.5 py-3 min-w-0 text-left flex flex-col items-stretch justify-start ${onClick ? "active:bg-slate-800/70 hover:border-slate-700 transition-colors" : ""}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5">
        {Icon && <Icon size={13} className={iconTone} />}
        <span className="truncate">{label}</span>
      </div>
      <p className={`font-mono text-[1.15rem] sm:text-xl leading-tight tabular-nums break-words ${tone}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{sub}</p>}
    </Tag>
  );
}

// Bloc avec titre
export function Card({ title, icon: Icon, right, children, className = "", flush = false }) {
  return (
    <section className={`bg-slate-900/60 border border-slate-800 rounded-xl ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm text-slate-200 font-serif flex items-center gap-1.5 min-w-0">
            {Icon && <Icon size={14} className="text-amber-400 shrink-0" />}
            <span className="truncate">{title}</span>
          </h3>
          {right}
        </div>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

// Sélecteur à puces, défilable horizontalement sur petit écran
export function Chips({ options, value, onChange, className = "" }) {
  return (
    <div className={`flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`shrink-0 whitespace-nowrap text-xs px-3.5 py-2 sm:py-1.5 rounded-full border transition-colors ${
            value === o.id ? "bg-slate-100 text-slate-900 border-slate-100 font-medium" : "border-slate-700 text-slate-400 hover:border-slate-500 active:bg-slate-800"
          }`}
        >
          {o.label}{o.count != null && <span className={`ml-1.5 ${value === o.id ? "text-slate-500" : "text-slate-600"}`}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

// En-tête de section : titre + actions (les actions passent sous le titre sur téléphone)
export function SectionHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-serif text-lg text-slate-100 flex items-center gap-2">{Icon && <Icon size={18} className="text-amber-400 shrink-0" />} {title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="grid grid-cols-2 sm:flex gap-2">{children}</div>}
    </div>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "text-slate-300 border-slate-600",
    amber: "text-amber-300 border-amber-500/50 bg-amber-400/5",
    indigo: "text-indigo-300 border-indigo-400/60 bg-indigo-400/5",
    emerald: "text-emerald-300 border-emerald-500/50 bg-emerald-400/5",
    rose: "text-rose-300 border-rose-500/50 bg-rose-400/5",
  };
  return <span className={`inline-block text-[10px] uppercase tracking-wide font-mono px-2 py-0.5 rounded-full border ${tones[tone]}`}>{children}</span>;
}

// Ligne « libellé / valeur »
export function DefList({ rows, cols = 2 }) {
  return (
    <dl className={`grid ${cols === 2 ? "grid-cols-2" : "grid-cols-1"} gap-x-4 gap-y-2.5 text-xs`}>
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-slate-500">{label}</dt>
          <dd className="text-right text-slate-100 tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
