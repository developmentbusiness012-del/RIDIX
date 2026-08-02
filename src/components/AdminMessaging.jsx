import { useState, useEffect } from "react";
import { Send, Loader2, MessageCircle, Plus, X } from "lucide-react";
import { supabase } from "../supabaseClient";

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

  const loadThreads = async () => {
    setLoadingThreads(true);
    const { data, error } = await supabase.rpc("admin_list_message_threads");
    if (!error) setThreads(data || []);
    setLoadingThreads(false);
  };

  useEffect(() => { loadThreads(); }, []);

  const openThread = async (userId) => {
    setActiveUserId(userId);
    setLoadingThread(true);
    const { data, error } = await supabase.rpc("admin_get_thread", { target_user_id: userId });
    if (!error) setMessages(data || []);
    setLoadingThread(false);
    loadThreads(); // refresh unread badges
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
    setShowNewThread(true);
  };

  const activeThread = threads.find((t) => t.user_id === activeUserId);

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[600px]">
      {/* Liste des fils */}
      <div className="md:col-span-1 bg-slate-900/60 border border-slate-800 rounded-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="font-serif text-sm text-slate-300">Conversations</h3>
          <button onClick={openNewThread} className="text-slate-400 hover:text-amber-300" title="Nouveau message">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="flex items-center justify-center h-full text-slate-500 gap-2 text-sm">
              <Loader2 size={14} className="animate-spin" /> Chargement…
            </div>
          ) : threads.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 px-4">Aucune conversation pour l'instant. Cliquez sur + pour écrire à un utilisateur.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.user_id}
                onClick={() => openThread(t.user_id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/40 ${activeUserId === t.user_id ? "bg-slate-800/60" : ""}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm text-slate-200 truncate">{t.email}</span>
                  {t.unread_count > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1 shrink-0">
                      {t.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {t.last_sender === "admin" ? "Vous : " : ""}{t.last_message}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Fil actif */}
      <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-md flex flex-col overflow-hidden">
        {!activeUserId ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <MessageCircle size={28} className="text-slate-700" />
            <p className="text-sm text-slate-500">Sélectionnez une conversation</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-sm text-slate-200">{activeThread?.email}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingThread ? (
                <div className="flex items-center justify-center h-full text-slate-500 gap-2 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Chargement…
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.sender === "admin" ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-200"}`}>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`text-[10px] mt-1 ${m.sender === "admin" ? "text-slate-950/60" : "text-slate-500"}`}>
                        {new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={send} className="flex items-end gap-2 px-4 py-3 border-t border-slate-800">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
                placeholder="Répondre…"
                rows={2}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm resize-none"
              />
              <button type="submit" disabled={sending || !body.trim()} className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-md p-2.5 shrink-0">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        )}
      </div>

      {showNewThread && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm p-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-slate-50">Écrire à un utilisateur</h3>
              <button onClick={() => setShowNewThread(false)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
            </div>
            <div className="space-y-1">
              {owners.map((o) => (
                <button
                  key={o.user_id}
                  onClick={() => { setShowNewThread(false); openThread(o.user_id); }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800"
                >
                  {o.email}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
