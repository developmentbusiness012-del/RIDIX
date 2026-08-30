import { useState, useEffect, useMemo } from "react";
import { Boxes, Plus, Trash2, AlertTriangle, X, Lock, Loader2, Minus, History, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { supabase } from "../supabaseClient";
import { formatMontant } from "../constants";
import { ConfirmDialog } from "./Dialogs";

export default function StockPanel({ companyId, plan, isOwner, deviseBase, onUpgrade, checkoutLoading }) {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (plan !== "premium" || !companyId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: moves }] = await Promise.all([
        supabase.from("products").select("*").eq("company_id", companyId).order("name"),
        supabase
          .from("transactions")
          .select("id, date, sens, quantity, montant_base, product_id, products(name, unit)")
          .eq("company_id", companyId)
          .not("product_id", "is", null)
          .order("date", { ascending: false })
          .limit(8),
      ]);
      setProducts(prods || []);
      setMovements(moves || []);
      setLoading(false);
    })();
  }, [companyId, plan]);

  const lowStock = useMemo(() => products.filter((p) => Number(p.quantity) <= Number(p.alert_threshold)), [products]);

  const addProduct = async (payload) => {
    const { data, error } = await supabase.from("products").insert({ company_id: companyId, ...payload }).select().single();
    if (!error && data) setProducts((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const adjustQuantity = async (product, delta) => {
    const next = Math.max(0, Number(product.quantity) + delta);
    const { error } = await supabase.from("products").update({ quantity: next }).eq("id", product.id);
    if (!error) setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, quantity: next } : p)));
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const removeProduct = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) setProducts((prev) => prev.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
  };

  if (plan !== "premium") {
    return (
      <PremiumTeaser
        icon={Boxes}
        title="Gestion des stocks"
        pitch="Suivez vos quantités en temps réel et recevez une alerte dès qu'un produit approche de la rupture — fini les ventes ratées faute de stock."
        benefits={[
          "Quantités et valeur de stock par produit",
          "Alertes automatiques de rupture",
          "Ajustements rapides à chaque vente ou réassort",
        ]}
        onUpgrade={onUpgrade}
        loading={checkoutLoading}
      />
    );
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-slate-500 text-sm py-10 justify-center"><Loader2 className="animate-spin" size={16} /> Chargement du stock…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-slate-50 flex items-center gap-2"><Boxes size={18} className="text-amber-400" /> Stock ({products.length})</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md px-3 py-2">
          <Plus size={15} /> Produit
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-5 border border-rose-800/50 bg-rose-950/30 rounded-md px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-rose-300 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-200">
            <span className="font-semibold">{lowStock.length} produit{lowStock.length > 1 ? "s" : ""} en alerte de rupture</span> — {lowStock.map((p) => p.name).join(", ")}.
          </p>
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-md overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-y border-slate-800">
                <th className="px-4 py-2 font-medium">Produit</th>
                <th className="px-2 py-2 font-medium text-right">Quantité</th>
                <th className="px-2 py-2 font-medium text-right">Seuil alerte</th>
                <th className="px-2 py-2 font-medium text-right">Prix revient</th>
                <th className="px-2 py-2 font-medium text-right">Prix vente</th>
                <th className="px-2 py-2 font-medium text-right">Marge</th>
                <th className="px-2 py-2 font-medium text-right">Valeur stock</th>
                <th className="px-2 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={8} className="text-center text-slate-500 text-xs py-8">Aucun produit enregistré — ajoutez-en un pour commencer le suivi de stock.</td></tr>
              )}
              {products.map((p) => {
                const low = Number(p.quantity) <= Number(p.alert_threshold);
                const margeUnitaire = Number(p.unit_price) - Number(p.cost_price || 0);
                const margePct = Number(p.unit_price) > 0 ? (margeUnitaire / Number(p.unit_price)) * 100 : null;
                return (
                  <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-slate-200">
                      {p.name}
                      {low && <AlertTriangle size={12} className="inline-block ml-1.5 text-rose-400 mb-0.5" />}
                    </td>
                    <td className={`px-2 py-2 text-right font-mono ${low ? "text-rose-400" : "text-slate-300"}`}>{p.quantity} {p.unit}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-500">{p.alert_threshold} {p.unit}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-500">{formatMontant(p.cost_price || 0, p.devise)}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-400">{formatMontant(p.unit_price, p.devise)}</td>
                    <td className={`px-2 py-2 text-right font-mono ${margePct === null ? "text-slate-600" : margePct >= 20 ? "text-emerald-400" : margePct >= 0 ? "text-amber-300" : "text-rose-400"}`}>
                      {margePct === null ? "—" : `${margePct.toFixed(0)} %`}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-400">{formatMontant(p.quantity * p.unit_price, p.devise)}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => adjustQuantity(p, -1)} className="text-slate-500 hover:text-rose-400 p-1"><Minus size={13} /></button>
                        <button onClick={() => adjustQuantity(p, 1)} className="text-slate-500 hover:text-emerald-400 p-1"><Plus size={13} /></button>
                        {isOwner && <button onClick={() => setConfirmDeleteId(p.id)} className="text-slate-600 hover:text-rose-400 p-1"><Trash2 size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {movements.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5"><History size={13} /> Mouvements récents (liés aux écritures)</h3>
          <div className="bg-slate-900/60 border border-slate-800 rounded-md divide-y divide-slate-800/60">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  {m.sens === "recette" ? <ArrowDownCircle size={13} className="text-rose-400" /> : <ArrowUpCircle size={13} className="text-emerald-400" />}
                  {m.products?.name || "Produit supprimé"}
                  <span className="text-slate-600 font-mono">{m.date}</span>
                </span>
                <span className={`font-mono ${m.sens === "recette" ? "text-rose-400" : "text-emerald-400"}`}>
                  {m.sens === "recette" ? "-" : "+"}{m.quantity} {m.products?.unit || ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && <ProductForm deviseBase={deviseBase} onClose={() => setShowForm(false)} onSubmit={addProduct} />}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Supprimer ce produit ?"
          message="Cette action est définitive."
          confirmLabel="Supprimer"
          danger
          onConfirm={() => removeProduct(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

function ProductForm({ deviseBase, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("unité");
  const [quantity, setQuantity] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("5");
  const [costPrice, setCostPrice] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit({
      name: name.trim(),
      unit,
      quantity: Number(quantity) || 0,
      alert_threshold: Number(alertThreshold) || 0,
      cost_price: Number(costPrice) || 0,
      unit_price: Number(unitPrice) || 0,
      devise: deviseBase,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-50">Ajouter un produit</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Nom du produit</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Quantité initiale</label>
              <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Unité</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="unité, sac, carton…"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Seuil d'alerte</label>
              <input type="number" min="0" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Prix de vente ({deviseBase})</label>
              <input type="number" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Prix de revient ({deviseBase}) — coût d'achat ou de production</label>
            <input type="number" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100" />
            <p className="text-[11px] text-slate-500 mt-1">Sert à calculer votre vraie marge — laissez à 0 si vous ne le connaissez pas encore.</p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="w-full mt-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-medium text-sm rounded-md py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 size={14} className="animate-spin" />} Ajouter au stock
        </button>
      </form>
    </div>
  );
}

export function PremiumTeaser({ icon: Icon, title, pitch, benefits, onUpgrade, loading }) {
  return (
    <div className="border border-amber-400/20 bg-gradient-to-b from-amber-400/5 to-transparent rounded-lg p-8 text-center max-w-lg mx-auto mt-6 mb-10">
      <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-4">
        <Icon size={22} className="text-amber-400" />
      </div>
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5 mb-3">
        <Lock size={10} /> Fonctionnalité Premium
      </span>
      <h3 className="font-serif text-xl text-slate-50 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-5">{pitch}</p>
      <ul className="text-left space-y-1.5 mb-6 max-w-xs mx-auto">
        {benefits.map((b) => (
          <li key={b} className="text-xs text-slate-300 flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">✓</span> {b}
          </li>
        ))}
      </ul>
      <button onClick={() => onUpgrade("premium")} disabled={loading}
        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm rounded-md px-5 py-2.5 disabled:opacity-60 flex items-center gap-2 mx-auto">
        {loading && <Loader2 size={14} className="animate-spin" />} Débloquer avec Premium — dès 5 000 FCFA
      </button>
    </div>
  );
}
