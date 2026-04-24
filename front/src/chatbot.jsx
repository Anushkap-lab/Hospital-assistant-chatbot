import { useState, useRef, useEffect } from "react";
import BookingComponent from "./BookingComponent";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const USER_ID = "guest_" + Math.random().toString(36).slice(2, 8);

const EyeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const TypingDots = () => (
  <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 7, height: 7, borderRadius: "50%",
        background: "#0ea5e9",
        display: "inline-block",
        animation: "bounce 1.2s infinite",
        animationDelay: `${i * 0.2}s`
      }} />
    ))}
  </div>
);

export default function MahatmeChatbot() {
  const [open, setOpen] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👁️ Hello! I'm the Mahatme Eye Hospital assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setPulse(false);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const normalizedQuestion = q.toLowerCase();
    const wantsBooking =
      normalizedQuestion.includes("book appointment") ||
      normalizedQuestion.includes("appointment booking") ||
      normalizedQuestion.includes("book an appointment") ||
      normalizedQuestion.includes("appointment");

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);

    if (wantsBooking) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: "Opening the appointment booking form for you.",
        },
      ]);
      setShowBooking(true);
      return;
    }

    setLoading(true);
    

    try {
      const res = await fetch(`${API_BASE}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID, question: q }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I couldn't connect to the server. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };


  const quickQuestions = [
    "Working hours?",
    "Book appointment",
    "LASIK surgery info",
    "Insurance accepted?",
  ];

  const handleQuickQuestion = (question) => {
    if (question === "Book appointment") {
      setMessages(prev => [
        ...prev,
        { role: "user", text: question },
        {
          role: "assistant",
          text: "Opening the appointment booking form for you.",
        },
      ]);
      setShowBooking(true);
      return;
    }

    setInput(question);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');

        .meh-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 60%, #38bdf8 100%);
          box-shadow: 0 4px 24px rgba(2,132,199,0.45), 0 1.5px 6px rgba(0,0,0,0.13);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 9999;
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
        }
        .meh-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 32px rgba(2,132,199,0.55);
        }
        .meh-fab:active { transform: scale(0.96); }
        .meh-pulse::after {
          content: '';
          position: absolute;
          width: 62px; height: 62px;
          border-radius: 50%;
          background: rgba(14,165,233,0.35);
          animation: ripple 1.8s infinite;
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.7); opacity: 0; }
        }

        .meh-window {
          position: fixed;
          bottom: 104px;
          right: 28px;
          width: 370px;
          max-height: 560px;
          border-radius: 22px;
          background: #f0f9ff;
          box-shadow: 0 12px 48px rgba(2,132,199,0.18), 0 2px 12px rgba(0,0,0,0.10);
          display: flex;
          flex-direction: column;
          z-index: 9998;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          transform-origin: bottom right;
          animation: slideUp 0.28s cubic-bezier(.34,1.56,.64,1);
          border: 1.5px solid rgba(14,165,233,0.15);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: scale(0.85) translateY(24px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .meh-header {
          background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
          padding: 16px 18px 14px;
          color: white;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .meh-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.4);
        }
        .meh-header-info { flex: 1; }
        .meh-header-name {
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.01em;
          line-height: 1.2;
        }
        .meh-header-sub {
          font-size: 11.5px;
          opacity: 0.85;
          margin-top: 2px;
          display: flex; align-items: center; gap: 5px;
        }
        .meh-online-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #86efac; display: inline-block;
          box-shadow: 0 0 6px #4ade80;
        }
        .meh-close-btn {
          background: rgba(255,255,255,0.18);
          border: none; border-radius: 50%;
          width: 30px; height: 30px;
          cursor: pointer; color: white;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .meh-close-btn:hover { background: rgba(255,255,255,0.3); }

        .meh-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scroll-behavior: smooth;
          min-height: 0;
          max-height: 340px;
        }
        .meh-messages::-webkit-scrollbar { width: 4px; }
        .meh-messages::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 4px; }

        .meh-bubble-row {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        .meh-bubble-row.user { flex-direction: row-reverse; }

        .meh-bubble-icon {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #0284c7, #38bdf8);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          color: white;
        }

        .meh-bubble {
          max-width: 78%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 13.5px;
          line-height: 1.5;
          word-break: break-word;
        }
        .meh-bubble.assistant {
          background: white;
          color: #0c4a6e;
          border-bottom-left-radius: 5px;
          box-shadow: 0 1px 4px rgba(2,132,199,0.10);
        }
        .meh-bubble.user {
          background: linear-gradient(135deg, #0284c7, #0ea5e9);
          color: white;
          border-bottom-right-radius: 5px;
          box-shadow: 0 2px 8px rgba(2,132,199,0.25);
        }

        .meh-quick {
          padding: 8px 14px 10px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          flex-shrink: 0;
          border-top: 1px solid rgba(14,165,233,0.1);
        }
        .meh-quick-btn {
          background: white;
          border: 1.5px solid #bae6fd;
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 12px;
          color: #0284c7;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .meh-quick-btn:hover {
          background: #e0f2fe;
          border-color: #0ea5e9;
            }
   

        .meh-input-row {
          padding: 10px 14px 14px;
          display: flex;
          gap: 8px;
          align-items: flex-end;
          background: white;
          border-top: 1px solid rgba(14,165,233,0.12);
          flex-shrink: 0;
        }
        .meh-input {
          flex: 1;
          border: 1.5px solid #bae6fd;
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          resize: none;
          min-height: 40px;
          max-height: 90px;
          color: #0c4a6e;
          background: #f0f9ff;
          transition: border-color 0.15s;
          line-height: 1.45;
        }
        .meh-input::placeholder { color: #7dd3fc; }
        .meh-input:focus { border-color: #0ea5e9; background: white; }

        .meh-send {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0284c7, #0ea5e9);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: white;
          flex-shrink: 0;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 2px 8px rgba(2,132,199,0.3);
        }
        .meh-send:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 4px 16px rgba(2,132,199,0.45);
        }
        .meh-send:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }

        .meh-badge {
          position: absolute;
          top: -3px; right: -3px;
          width: 18px; height: 18px;
          background: #f97316;
          border-radius: 50%;
          border: 2.5px solid white;
          font-size: 10px;
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          color: white;
          display: flex; align-items: center; justify-content: center;
        }

        @media (max-width: 420px) {
          .meh-window {
            right: 10px;
            width: calc(100vw - 20px);
            bottom: 90px;
          }
          .meh-fab { right: 16px; bottom: 20px; }
        }
      `}</style>

      <button
        className={`meh-fab${pulse ? " meh-pulse" : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open Eye Hospital Chat"
        style={{ 
              position: "fixed", 
              bottom: "20px",      
              right: "20px",       
              zIndex: 9999         
        }}
      >
        {open ? <CloseIcon /> : <EyeIcon />}
        {!open && pulse && <span className="meh-badge">1</span>}
      </button>

      {open && (
        <div className="meh-window" role="dialog" aria-label="Mahatme Eye Hospital Chat">
          <div className="meh-header">
            <div className="meh-avatar">👁️</div>
            <div className="meh-header-info">
              <div className="meh-header-name">Mahatme Eye Hospital</div>
              <div className="meh-header-sub">
                <span className="meh-online-dot" />
                Assistant · Always here to help
              </div>
            </div>
            <button className="meh-close-btn" onClick={() => setOpen(false)} aria-label="Close chat">
              <CloseIcon />
            </button>
          </div>

          <div className="meh-messages">
          
            {messages.map((m, i) => (
              <div key={i} className={`meh-bubble-row ${m.role}`}>
                {m.role === "assistant" && (
                  <div className="meh-bubble-icon">👁️</div>
                )}
                <div className={`meh-bubble ${m.role}`}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="meh-bubble-row assistant">
                <div className="meh-bubble-icon">👁️</div>
                <div className="meh-bubble assistant"><TypingDots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="meh-quick">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  className="meh-quick-btn"
                  onClick={() => handleQuickQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}


          <div className="meh-input-row">
            <textarea
              ref={inputRef}
              className="meh-input"
              placeholder="Ask about services, appointments…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button
              className="meh-send"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {showBooking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 74, 110, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              borderRadius: "20px",
              background: "white",
              boxShadow: "0 20px 60px rgba(2,132,199,0.2)",
              padding: "20px",
            }}
          >
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                borderTop: "1px solid #eee",
              }}
            >
              <BookingComponent
                apiBase={API_BASE}
                onClose={() => setShowBooking(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
