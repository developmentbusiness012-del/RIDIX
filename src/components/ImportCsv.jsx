import { useState } from "react";
import Papa from "papaparse";
import { X, UploadCloud, Loader2 } from "lucide-react";

const TEMPLATE_HEADERS = ["date", "sens", "type_op", "categorie", "libelle", "montant", "devise", "taux"];
const VALID_SENS = ["recette", "depense"];
const VALID_TYPEOP = ["local", "import", "export", "autre"];

function downloadTemplate() {
  const example = [
    TEMPLATE_HEADERS.join(","),
    "2026-07-01,recette,local,Vente locale,Ventes boutique,250000,XAF,1",
    "2026-07-03,depense,import,Achat marchandise,Lot Guangzhou,15000,USD,610",
  ].join("\n");
  const blob = new Blob([example], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele_import_ecritures.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportCsv({ deviseBase, onClose, onImport }) {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const handleFile = (file) => {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const problems = [];
        const parsed = result.data.map((r, i) => {
          const line = i + 2;
          const sens = (r.sens || "").trim().toLowerCase();
          const typeOp = (r.type_op || "").trim().toLowerCase();
          const montant = Number(r.montant);
          const devise = (r.devise || deviseBase).trim().toUpperCase();
          const taux = devise === deviseBase ? 1 : Number(r.taux || 1);

          if (!r.date) problems.push(`Ligne ${line} : date manquante`);
          if (!VALID_SENS.includes(sens)) problems.push(`Ligne ${line} : sens invalide ("${r.sens}"), attendu recette/depense`);
          if (!VALID_TYPEOP.includes(typeOp)) problems.push(`Ligne ${line} : type_op invalide ("${r.type_op}"), attendu local/import/export/autre`);
          if (!montant || montant <= 0) problems.push(`Ligne ${line} : montant invalide`);

          return {
            date: r.date,
            sens,
            type_op: typeOp,
            categorie: r.categorie || "Autre",
            libelle: r.libelle || "",
            montant,
            devise,
            taux,
            montant_base: montant * taux,
          };
        });
        setErrors(problems);
        setRows(parsed);
      },
    });
  };

  const confirmImport = async () => {
    setImporting(true);
    await onImport(rows.filter((r) => VALID_SENS.includes(r.sens) && VALID_TYPEOP.includes(r.type_op) && r.montant > 0));
    setImporting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-50">Import CSV en masse</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Colonnes attendues : <code className="text-amber-300">date, sens, type_op, categorie, libelle, montant, devise, taux</code>.
          Les montants en devise de base ({deviseBase}) n'ont pas besoin de taux.
        </p>
        <button onClick={downloadTemplate} className="text-xs text-amber-300 underline mb-4">Télécharger un modèle CSV</button>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-700 rounded-md py-8 cursor-pointer hover:border-amber-400 transition-colors mb-4">
          <UploadCloud size={22} className="text-slate-500" />
          <span className="text-sm text-slate-400">{fileName || "Choisir un fichier .csv"}</span>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
        </label>

        {rows.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-2">{rows.length} ligne(s) détectée(s){errors.length > 0 && `, ${errors.length} erreur(s)`}</p>
            {errors.length > 0 && (
              <div className="bg-rose-400/10 border border-rose-400/30 rounded-md p-2 max-h-32 overflow-y-auto mb-2">
                {errors.map((e, i) => <p key={i} className="text-[11px] text-rose-300">{e}</p>)}
              </div>
            )}
          </div>
        )}

        <button
          onClick={confirmImport}
          disabled={rows.length === 0 || importing}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-medium rounded-md py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
        >
          {importing && <Loader2 size={14} className="animate-spin" />}
          Importer {rows.length > 0 ? `${rows.filter((r) => VALID_SENS.includes(r.sens) && VALID_TYPEOP.includes(r.type_op) && r.montant > 0).length} écriture(s) valide(s)` : ""}
        </button>
      </div>
    </div>
  );
}
