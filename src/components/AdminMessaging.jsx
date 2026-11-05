import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, Plus, ArrowLeft, Search } from "lucide-react";
import { supabase } from "../supabaseClient";
import { displayContact } from "../phoneAuth";
import { Sheet, inputCls } from "./AdminUI";

// Messagerie : sur téléphone, on affiche la liste des conversations OU la conversation ouverte
// (avec un bouton retour) ; sur ordinateur, les deux côte à côte.
export default function AdminMessaging() {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [owners, setOwners] = useState([]);
  const [ownerQuery, setOwnerQuery] = useState("");
  const bottomRef = useRef(null);

  const loadThreads = async () => {
    const { data, error } = await supabase.rpc("admin_list_message_threads");
    if (!error) setThreads(data || []);
    setLoadingThreads(false);
  };

  useEffect(() => { loadThreads(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages, loadingThread]);

  const openThread = async (userId) => {
    setActiveUserId(userId);
    setLoadingThread(true);
    const { data, error } = await supabase.rpc("admin_get_thread", { target_user_id: userId });
    if (!error) setMessages(data || []);
    setLoadingThread(false);
    loadThreads(); // rafraîchit les pastilles « non lus »
  };

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !activeUserId) return;
    setSending(true);
    const { data, error } = await supabase.rpc("admin_send_message", { target_user_id: activeUserId, message_body: body.trim() });
    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setBody("");
      loadThreads();
    }
    setSending(false);
  };

  const openNewThread = async () => {
    const { data, error } = await supabase.rpc("admin_list_owners");
    if (!error) setOwners(data || []);
    setOwnerQuery("");
    setShowNewThread(true);
  };

  const activeThread = threads.find((t) => t.user_id === activeUserId);
  const activeOwner = owners.find((o) => o.user_id === activeUserId);
  const activeName = displayContact(activeThread?.email || activeOwner?.email) || "Conversation";
  const shownOwners = owners.filter((o) => displayContact(o.email).toLowerCase().replace(/[\s+]/g, "").includes(ownerQuery.toLowerCase().replace(/[\s+]/g, "")));

  return (
    <div className="space-y-3">
      <div className={activeUserId ? "hidden md:block" : ""}>
        <h2 className="font-serif text-lg text-slate-100 flex items-center gap-2"><MessageCircle size={18} className="text-amber-400" /> Messagerie</h2>
        <p className="text-xs text-slate-500 mt-0.5">Échangez directement avec vos clients.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 h-[calc(100dvh-14.5rem)] md:h-[600px] min-h-[380px]">
        {/* Liste des conversations */}
        <div className={`md:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl flex-col overflow-hidden min-h-0 ${activeUserId ? "hidden md:flex" : "flex"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
            <h3 className="font-serif text-sm text-slate-300">Conversations</h3>
            <button onClick={openNewThread} className="flex items-center gap-1 text-xs text-amber-300 border border-amber-500/40 rounded-lg px-2.5 py-1.5 active:bg-amber-400/10" aria-label="Nouveau message">
              <Plus size={14} /> Nouveau
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loadingThreads ? (
              <div className="flex items-center justify-center h-full text-slate-500 gap-2 text-sm"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
            ) : threads.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10 px-6">Aucune conversation pour l'instant. Touchez « Nouveau » pour écrire à un utilisateur.</p>
            ) : (
              threads.map((t) => (
                <button
                  key={t.user_id}
                  onClick={() => openThread(t.user_id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-slate-800/60 active:bg-slate-800/60 hover:bg-slate-800/40 ${activeUserId === t.user_id ? "bg-slate-800/60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-sm truncate ${t.unread_count > 0 ? "text-slate-50 font-medium" : "text-slate-200"}`}>{displayContact(t.email)}</span>
                    {t.unread_count > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">{t.unread_count}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{t.last_sender === "admin" ? "Vous : " : ""}{t.last_message}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation ouverte */}
        <div className={`md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl flex-col overflow-hidden min-h-0 ${activeUserId ? "flex" : "hidden md:flex"}`}>
          {!activeUserId ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <MessageCircle size={28} className="text-slate-700" />
              <p className="text-sm text-slate-500">Sélectionnez une conversation</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 px-2 py-2.5 border-b border-slate-800 shrink-0">
                <button onClick={() => setActiveUserId(null)} className="md:hidden p-2 text-slate-400 active:bg-slate-800 rounded-lg" aria-label="Retour aux conversations"><ArrowLeft size={18} /></button>
                <p className="text-sm text-slate-100 truncate px-2 md:px-2">{activeName}</p>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-3 min-h-0">
                {loadingThread ? (
                  <div className="flex items-center justify-center h-full text-slate-500 gap-2 text-sm"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">Aucun message. Écrivez le premier.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.sender === "admin" ? "bg-amber-400 text-slate-950 rounded-br-md" : "bg-slate-800 text-slate-200 rounded-bl-md"}`}>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`text-[10px] mt-1 ${m.sender === "admin" ? "text-slate-950/60" : "text-slate-500"}`}>
                          {new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="flex items-end gap-2 px-3 sm:px-4 py-3 border-t border-slate-800 shrink-0">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) { e.preventDefault(); send(e); } }}
                  placeholder="Écrire un message…"
                  rows={2}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-base sm:text-sm resize-none focus:outline-none focus:border-amber-500/70"
                />
                <button type="submit" disabled={sending || !body.trim()} aria-label="Envoyer" className="bg-amber-400 active:bg-amber-300 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-xl p-3 shrink-0">
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showNewThread && (
        <Sheet title="Écrire à un utilisateur" onClose={() => setShowNewThread(false)}>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={ownerQuery} onChange={(e) => setOwnerQuery(e.target.value)} placeholder="Rechercher un numéro…" inputMode="search" className={`${inputCls} pl-9`} />
          </div>
          <div className="space-y-1">
            {shownOwners.length === 0 && <p className="text-xs text-slate-500 text-center py-6">Aucun utilisateur trouvé.</p>}
            {shownOwners.map((o) => (
              <button
                key={o.user_id}
                onClick={() => { setShowNewThread(false); openThread(o.user_id); }}
                className="w-full text-left px-3 py-3 rounded-lg text-sm text-slate-200 active:bg-slate-800 hover:bg-slate-800 break-all"
              >
                {displayContact(o.email)}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
