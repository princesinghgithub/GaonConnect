import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import api from "../services/api";

/**
 * Customer support chat — floating widget.
 *
 * Dashboard pe jo AI agent hai wo admin ke liye hai: usme operations, marketing
 * aur driver-relations modes hain jo customer ko bilkul nahi milne chahiye.
 * Isliye ye alag endpoint (/agent/support) use karta hai jahan prompt server pe
 * fix hai — client mode chun hi nahi sakta.
 *
 * Sirf logged-in user ko dikhta hai. Har message Gemini pe paisa kharch karta
 * hai, isliye ise logged-out visitors ke liye khola nahi — unke liye WhatsApp
 * float pehle se maujood hai.
 */

// Gaon ka user lamba type nahi karta — jo sawal sabse zyada poochhe jaate hain
// wo ek tap pe hain.
const QUICK = [
  "Booking kaise karun?",
  "Kiraya kaise banta hai?",
  "Promo code kaise lagayein?",
  "Ride cancel kaise karun?",
  "Driver kaise banun?",
];

const GREETING =
  "नमस्ते! 🙏 मैं GaonConnect का सहायक हूँ।\n\nबुकिंग, किराया, प्रोमो कोड या ड्राइवर बनने के बारे में कुछ भी पूछिए।";

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", text: GREETING }]);

  const listRef = useRef(null);

  // Logged out user ko mat dikhao — endpoint login ke peeche hai, aur logged-out
  // visitor ke liye WhatsApp float already hai.
  const loggedIn = typeof window !== "undefined" && !!localStorage.getItem("token");

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  if (!loggedIn) return null;

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", text: msg }, { role: "bot", text: "", typing: true }]);

    try {
      const { data } = await api.post("/agent/support", { message: msg });
      const reply = data?.reply || "Mujhe samajh nahi aaya. Help se support ko message kar dijiye.";
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { role: "bot", text: reply } : m)));
    } catch (err) {
      // Rate limit ka jawab alag hai — "kuch toot gaya" bolna galat hoga.
      const status = err?.response?.status;
      const text =
        status === 429
          ? "Bahut zyada sawaal ho gaye. Thodi der baad try karein."
          : err?.response?.data?.message ||
            "Chat abhi kaam nahi kar raha. WhatsApp pe message kar dijiye.";
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { role: "bot", text } : m)));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Launcher — WhatsApp float ke upar baithta hai, uski jagah nahi leta */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Support chat kholein"
          className="fixed right-4 bottom-24 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-saffron text-white shadow-lg transition hover:scale-105 active:scale-95"
          style={{ backgroundColor: "#F5A623" }}
        >
          <MessageCircle size={26} />
        </button>
      )}

      {open && (
        <div className="fixed right-4 bottom-24 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: "#F5A623" }}
          >
            <div>
              <div className="text-sm font-bold">GaonConnect सहायक</div>
              <div className="text-[11px] opacity-90">आमतौर पर तुरंत जवाब</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Chat band karein" className="p-1">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="h-80 space-y-3 overflow-y-auto bg-gray-50 px-3 py-3 dark:bg-gray-950">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "rounded-br-sm text-white"
                      : "rounded-bl-sm bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                  }`}
                  style={m.role === "user" ? { backgroundColor: "#F5A623" } : undefined}
                >
                  {m.typing ? (
                    <span className="inline-flex gap-1 py-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:240ms]" />
                    </span>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick questions — sirf shuruaat mein, baad mein jagah ghere baithte hain */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-100 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition hover:bg-orange-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="अपना सवाल लिखिए..."
              maxLength={500}
              className="flex-1 rounded-full bg-gray-100 px-3 py-2 text-sm outline-none dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || sending}
              aria-label="Bhejein"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-40"
              style={{ backgroundColor: "#F5A623" }}
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
