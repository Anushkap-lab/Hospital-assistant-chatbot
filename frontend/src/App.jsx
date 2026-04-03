import { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:8000/chatbot";

export default function HospitalChatbot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello 👋\n\nWelcome to Mahatme Eye Hospital AI Assistant.\n\nI can help you with:\n• Booking appointments\n• Doctor availability\n• Eye-related symptoms guidance\n• Hospital timings & contact info\n\nHow may I assist you today?",
      time: getTime(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  function getTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");

    const userMessage = {
      role: "user",
      content: userText,
      time: getTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
        }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      const botReply = {
        role: "assistant",
        content: data.response || "Sorry, I couldn't process that.",
        time: getTime(),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Unable to connect to hospital server.\nPlease try again later or contact hospital directly.",
          time: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        🏥 Mahatme Eye Hospital AI Assistant
      </div>

      <div style={styles.chatArea}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageWrapper,
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...styles.message,
                background:
                  msg.role === "user"
                    ? "#0ea5e9"
                    : "#f1f5f9",
                color:
                  msg.role === "user"
                    ? "#fff"
                    : "#1e293b",
              }}
            >
              {msg.content}
              <div style={styles.time}>{msg.time}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={styles.typing}>Typing...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={styles.textarea}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={styles.button}
        >
          ➤
        </button>
      </div>

      <div style={styles.disclaimer}>
        ⚠️ This is an AI assistant. For emergencies, call the hospital directly.
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    fontFamily: "Segoe UI, sans-serif",
    background: "#e2e8f0",
  },
  header: {
    padding: "16px",
    background: "#0f172a",
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
  },
  messageWrapper: {
    display: "flex",
    marginBottom: "12px",
  },
  message: {
    maxWidth: "70%",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "14px",
    whiteSpace: "pre-wrap",
  },
  time: {
    fontSize: "10px",
    marginTop: "6px",
    opacity: 0.6,
    textAlign: "right",
  },
  typing: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "10px",
  },
  inputArea: {
    display: "flex",
    padding: "12px",
    background: "#fff",
    borderTop: "1px solid #ccc",
  },
  textarea: {
    flex: 1,
    resize: "none",
    borderRadius: "8px",
    border: "1px solid #ccc",
    padding: "10px",
    fontSize: "14px",
  },
  button: {
    marginLeft: "10px",
    padding: "0 16px",
    borderRadius: "8px",
    border: "none",
    background: "#0ea5e9",
    color: "#fff",
    cursor: "pointer",
  },
  disclaimer: {
    padding: "8px",
    fontSize: "11px",
    background: "#fef3c7",
    textAlign: "center",
  },
};
