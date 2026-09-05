import { useState, useEffect } from "react";
import { X, Package, Loader2, Plus, Wallet } from "lucide-react";
import { supabase } from "../supabaseClient";
import { DEVISES, TYPES_OP, CATEGORIES_RECETTE, CATEGORIES_DEPENSE, CASH_ACCOUNT_TYPES, formatMontant } from "../constants";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TransactionForm({ deviseBase, plan, companyId, cashAccounts = [], onAddCashAccount, onClose, onSubmit }) {
  const [sens, setSens] = useState("recette");
  const [typeOp, setTypeOp] = useState("local");
  const [categorie, setCategorie] = useState(CATEGORIES_RECETTE[0]);
  const [libelle, setLibelle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [montant, setMontant] = useState("");
  const [txDevise, setTxDevise] = useState(deviseBase);
  const [taux, setTaux] = useState(1);
  const [accountId, setAccountId] = useState("");
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("caisse");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [productQty, setProductQty] = useState("");

  useEffect(() => {
    if (plan !== "premium" || !companyId) return;
    (async () => {
      const { data } = await supabase.from("products").select("id, name, quantity, unit").eq("company_id", companyId).order("name");
      setProducts(data || []);
    })();
  }, [plan, companyId]);

  useEffect(() => {
    if (!accountId && cashAccounts.length > 0) setAccountId(cashAccounts[0].id);
  }, [cashAccounts, accountId]);

  const categories = sens === "recette" ? CATEGORIES_RECETTE : CATEGORIES_DEPENSE;
  const montantBase = (Number(montant) || 0) * (txDevise === deviseBase ? 1 : Number(taux) || 0);
  const selectedProduct = products.find((p) => p.id === productId);

  const createAccount = async () => {
    if (!newAccountName.trim()) return;
    setSavingAccount(true);
    setAccountError("");
    const { data, error } = await onAddCashAccount({ name: newAccountName.trim(), type: newAccountType, devise: deviseBase, solde_initial: 0 });
    setSavingAccount(false);
    if (data) {
      setAccountId(data.id);
      setShowNewAccount(false);
      setNewAccountName("");
    } else if (error) {
      setAccountError("Vous n'avez pas les droits pour créer un compte. Demandez à votre gestionnaire.");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) return;
    setSaving(true);
    await onSubmit({
      date,
      sens,
      type_op: typeOp,
      categorie,
      libelle,
      montant: Number(montant),
      devise: txDevise,
      taux: txDevise === deviseBase ? 1 : Number(taux) || 0,
      montant_base: montantBase,
      product_id: productId || null,
      quantity: productId && productQty ? Number(productQty) : null,
      account_id: accountId || null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-50">Nouvelle écriture</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button type="button" onClick={() => { setSens("recette"); setCategorie(CATEGORIES_RECETTE[0]); }}
            className={`py-2 rounded-md text-sm border ${sens === "recette" ? "bg-emerald-400/10 border-emerald-400 text-emerald-300" : "border-slate-700 text-slate-400"}`}>
            Recette
          </button>
          <button type="button" onClick={() => { setSens("depense"); setCategorie(CATEGORIES_DEPENSE[0]); }}
            className={`py-2 rounded-md text-sm border ${sens === "depense" ? "bg-rose-400/10 border-rose-400 text-rose-300" : "border-slate-700 text-slate-400"}`}>
            Dépense
          </button>
        </div>

        <label className="block text-xs text-slate-400 mb-1">Profil de l'opération</label>
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {TYPES_OP.map((t) => (
            <button key={t.id} type="button" onClick={() => setTypeOp(t.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-md border text-[11px] ${typeOp === t.id ? "border-amber-400 text-amber-300 bg-amber-400/10" : "border-slate-700 text-slate-400"}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm mb-3">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>

        <label className="block text-xs text-slate-400 mb-1">Libellé</label>
        <input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ex : Conteneur cacao — client Rotterdam"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm mb-3" />

        <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Wallet size={12} /> Compte concerné</label>
        {!showNewAccount ? (
          <div className="flex gap-2 mb-3">
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm">
              {cashAccounts.length === 0 && <option value="">Aucun compte — créez-en un</option>}
              {cashAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button type="button" onClick={() => setShowNewAccount(true)} title="Nouveau compte"
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md border border-slate-700 text-amber-300 hover:border-amber-400">
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <div className="mb-3 border border-slate-800 rounded-md p-3 bg-slate-800/30 space-y-2">
            <input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="Ex : Orange Money, UBA, Caisse boutique…" autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm" />
            <select value={newAccountType} onChange={(e) => setNewAccountType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm">
              {CASH_ACCOUNT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={createAccount} disabled={savingAccount || !newAccountName.trim()}
                className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-medium rounded-md py-2 flex items-center justify-center gap-1.5">
                {savingAccount && <Loader2 size={12} className="animate-spin" />} Créer ce compte
              </button>
              <button type="button" onClick={() => setShowNewAccount(false)} className="text-xs text-slate-400 px-3">Annuler</button>
            </div>
            {accountError && <p className="text-[11px] text-rose-400">{accountError}</p>}
          </div>
        )}

        {plan === "premium" && products.length > 0 && (
          <div className="mb-3 border border-slate-800 rounded-md p-3 bg-slate-800/30">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5"><Package size={12} /> Produit du stock concerné (optionnel)</label>
            <select value={productId} onChange={(e) => { setProductId(e.target.value); setProductQty(""); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm mb-2">
              <option value="">— Aucun —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit} en stock)</option>)}
            </select>
            {productId && (
              <>
                <input type="number" min="0" step="any" value={productQty} onChange={(e) => setProductQty(e.target.value)}
                  placeholder={`Quantité (${sens === "recette" ? "sortie de stock" : "entrée de stock"})`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono" />
                <p className="text-[10px] text-slate-500 mt-1.5">
                  {sens === "recette"
                    ? `Le stock de "${selectedProduct?.name}" sera automatiquement réduit de cette quantité.`
                    : `Le stock de "${selectedProduct?.name}" sera automatiquement augmenté de cette quantité (réapprovisionnement).`}
                </p>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Montant</label>
            <input type="number" min="0" step="any" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="0"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Devise</label>
            <select value={txDevise} onChange={(e) => setTxDevise(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm">
              {DEVISES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Taux vers {deviseBase} {txDevise === deviseBase && <span className="text-slate-600">(auto)</span>}
            </label>
            <input type="number" min="0" step="any" disabled={txDevise === deviseBase}
              value={txDevise === deviseBase ? 1 : taux} onChange={(e) => setTaux(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono disabled:opacity-50" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/60 rounded-md px-3 py-2 mb-4">
          <span>Contre-valeur</span>
          <span className="font-mono text-slate-200">{formatMontant(montantBase, deviseBase)}</span>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-medium rounded-md py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />} {saving ? "Enregistrement…" : "Enregistrer l'écriture"}
        </button>
      </form>
    </div>
  );
}
