import { useState, useEffect, useRef } from "react";
import { FolderLock, Upload, Trash2, Download, Loader2, FileText, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { ConfirmDialog } from "./Dialogs";

const CATEGORIES = [
  { id: "legal", label: "Juridique" },
  { id: "fiscal", label: "Fiscal" },
  { id: "etats_financiers", label: "États financiers" },
  { id: "releves_bancaires", label: "Relevés bancaires" },
  { id: "factures", label: "Factures" },
  { id: "contrats", label: "Contrats" },
  { id: "garanties", label: "Garanties" },
  { id: "autre", label: "Autre" },
];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function sanitizeName(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export default function DataRoomPanel({ companyId, plan, isOwner, onUpgrade, checkoutLoading }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous");
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("legal");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!companyId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("documents").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      setDocuments(data || []);
      setLoading(false);
    })();
  }, [companyId]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const storagePath = `${companyId}/${uploadCategory}/${crypto.randomUUID()}-${sanitizeName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("data-room").upload(storagePath, file);
      if (uploadError) throw uploadError;
      const { data: session } = await supabase.auth.getUser();
      const { data, error: insertError } = await supabase.from("documents").insert({
        company_id: companyId,
        category: uploadCategory,
        name: file.name,
        storage_path: storagePath,
        size_bytes: file.size,
        mime_type: file.type || null,
        uploaded_by: session?.user?.id || null,
      }).select().single();
      if (insertError) throw insertError;
      setDocuments((prev) => [data, ...prev]);
    } catch (err) {
      setError(err.message === "The resource already exists" ? "Un fichier avec ce nom existe déjà." : "Échec de l'envoi — vérifiez le format (PDF, image, Word, Excel) et la taille (max 20 Mo).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const download = async (doc) => {
    const { data, error: signError } = await supabase.storage.from("data-room").createSignedUrl(doc.storage_path, 60);
    if (!signError && data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async () => {
    if (!confirmDelete) return;
    await supabase.storage.from("data-room").remove([confirmDelete.storage_path]);
    const { error: delError } = await supabase.from("documents").delete().eq("id", confirmDelete.id);
    if (!delError) setDocuments((prev) => prev.filter((d) => d.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-slate-500 text-sm py-10 justify-center"><Loader2 className="animate-spin" size={16} /> Chargement…</div>;
  }

  const visible = filter === "tous" ? documents : documents.filter((d) => d.category === filter);
  const counts = CATEGORIES.reduce((acc, c) => ({ ...acc, [c.id]: documents.filter((d) => d.category === c.id).length }), {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-serif text-lg text-slate-50 flex items-center gap-2"><FolderLock size={18} className="text-amber-400" /> Data Room ({documents.length})</h2>
        <div className="flex items-center gap-2">
          <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-md px-2 py-2 text-xs text-slate-300">
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md px-3 py-2 disabled:opacity-60">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Ajouter un document
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" />
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-rose-800/50 bg-rose-950/20 rounded-md px-3 py-2 flex items-center justify-between gap-2">
          <p className="text-xs text-rose-300">{error}</p>
          <button onClick={() => setError("")} className="text-rose-400"><X size={14} /></button>
        </div>
      )}

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilter("tous")}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === "tous" ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
          Tous ({documents.length})
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setFilter(c.id)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === c.id ? "bg-slate-100 text-slate-900 border-slate-100" : "border-slate-700 text-slate-400"}`}>
            {c.label} ({counts[c.id] || 0})
          </button>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden mb-10">
        {visible.length === 0 ? (
          <p className="text-center text-slate-500 text-xs py-8">Aucun document dans cette catégorie.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {visible.map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{d.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {CATEGORIES.find((c) => c.id === d.category)?.label} · {formatSize(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => download(d)} className="text-slate-500 hover:text-amber-300 p-1.5"><Download size={15} /></button>
                  {isOwner && <button onClick={() => setConfirmDelete(d)} className="text-slate-500 hover:text-rose-400 p-1.5"><Trash2 size={15} /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer ce document ?"
          message={`« ${confirmDelete.name} » sera définitivement supprimé.`}
          confirmLabel="Supprimer"
          danger
          onConfirm={remove}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
