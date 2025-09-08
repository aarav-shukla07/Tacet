import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Overlay() {
  const [chat, setChat] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");

  async function takeScreenshotAndExplain() {
    setChat([]);
    try {
      const res = await axios.get("http://127.0.0.1:8000/explain-screen", { timeout: 0 });
      const data = res.data;
      setSessionId(data.session_id);
      const ai = data.ai_analysis || { solution_or_explanation: "No analysis", type: "general" };
      setChat([{ role: "assistant", text: ai.solution_or_explanation, type: ai.type }]);
    } catch (err) {
      setChat([{ role: "assistant", text: "Error: " + (err.response?.data?.error || err.message) }]);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const msg = input.trim();
    setChat((c) => [...c, { role: "user", text: msg }]);
    setInput("");

    try {
      let res;
      if (!sessionId) {
        res = await axios.post("http://127.0.0.1:8000/ask-text", { question: msg }, { timeout: 0 });
        const reply = res.data.ai_reply || res.data.answer || "No reply";
        setChat((c) => [...c, { role: "assistant", text: reply }]);
      } else {
        res = await axios.post(
          "http://127.0.0.1:8000/chat-session",
          { session_id: sessionId, message: msg },
          { timeout: 0 }
        );
        const reply = res.data.ai_reply || res.data.answer || "No reply";
        setChat((c) => [...c, { role: "assistant", text: reply }]);
      }
    } catch (err) {
      setChat((c) => [...c, { role: "assistant", text: "Error: " + (err.response?.data?.detail || err.message) }]);
    }
  }

  return (
    <div className="overlay">
      <div className="overlay-header">
        🧞 Genie
        <button className="btn small" onClick={() => window.close()}>
          ✖
        </button>
      </div>

      <div className="chat-window">
        {chat.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.text}
              </ReactMarkdown>
            ) : (
              m.text
            )}
          </div>
        ))}
      </div>

      <div className="input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Genie..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="btn green">
          Send
        </button>
        <button onClick={takeScreenshotAndExplain} className="btn teal">
          Explain Screen
        </button>
      </div>
    </div>
  );
}
