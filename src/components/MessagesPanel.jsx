import { useState, useEffect, useRef } from "react";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function MessagesPanel({ session, onClose, onRead }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setLoading(false);
      await supabase
        .from("messages")
        .update({ read_by_user: true })
        .eq("user_id", session.user.id)
        .eq("sender", "admin")
        .eq("read_by_user", false);
      onRead?.();
    })();
  }, [session.user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ user_id: session.user.id, sender: "user", body: body.trim() })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setBody("");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg h-[80vh] sm:h-[600px] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-amber-300" />
            <h3 className="font-serif text-lg text-slate-50">Messagerie</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500 gap-2">
              <Loader2 size={16} className="animate-spin" /> Chargement…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <MessageCircle size={28} className="text-slate-700" />
              <p className="text-sm text-slate-500">Aucun message pour l'instant.</p>
              <p className="text-xs text-slate-600">Envoyez une remarque ou une suggestion à l'équipe.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.sender === "user" ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-200"
                }`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${m.sender === "user" ? "text-slate-950/60" : "text-slate-500"}`}>
                    {m.sender === "admin" ? "Équipe" : "Vous"} · {new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex items-end gap-2 px-5 py-4 border-t border-slate-800">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
            placeholder="Une remarque, une suggestion…"
            rows={2}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm resize-none"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-md p-2.5 shrink-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
