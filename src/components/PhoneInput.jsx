import { DIAL_OPTIONS } from "../phoneAuth";

// Champ numéro de téléphone : sélecteur d'indicatif + numéro local.
export default function PhoneInput({ dial, onDialChange, value, onChange, autoFocus = false }) {
  return (
    <div className="flex gap-2">
      <select
        value={dial}
        onChange={(e) => onDialChange(e.target.value)}
        aria-label="Indicatif du pays"
        className="w-[8.5rem] shrink-0 bg-slate-800 border border-slate-700 rounded-md px-2 py-2 text-sm text-slate-200"
      >
        {DIAL_OPTIONS.map((o) => (
          <option key={o.label} value={o.dial}>{o.label}</option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm"
        placeholder={dial ? "6XX XX XX XX" : "+indicatif et numéro"}
      />
    </div>
  );
}
