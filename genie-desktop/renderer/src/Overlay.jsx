import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Overlay() {
  const [chat, setChat] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function takeScreenshotAndExplain() {
    setChat([]); 
    setIsLoading(true);
    setSessionId(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/explain-screen");

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      setChat([{ role: "assistant", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setChat([{ role: "assistant", text: accumulatedText }]);
      }
    } catch (err) {
      setChat([{ role: "assistant", text: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function sendMessage() {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setChat((c) => [...c, { role: "user", text: msg }]);
    setInput("");
    setIsLoading(true);

    try {
      const endpoint = sessionId ? "/chat-session" : "/ask-text";
      const payload = sessionId 
        ? { session_id: sessionId, message: msg }
        : { question: msg };

      const res = await axios.post(`http://127.0.0.1:8000${endpoint}`, payload);
      
      const reply = res.data.ai_reply || "Sorry, I couldn't get a response.";
      if (!sessionId) setSessionId(res.data.session_id);

      setChat((c) => [...c, { role: "assistant", text: reply }]);
    } catch (err) {
      setChat((c) => [...c, { role: "assistant", text: "Error: " + (err.response?.data?.detail || err.message) }]);
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="overlay">
      <div className="overlay-header">
        Tacet
        <button className="btn small" onClick={() => window.close()}>
          ✖
        </button>
      </div>

      <div className="chat-window">
        {chat.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {m.text}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      <div className="input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Tacet..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={isLoading}
        />
        <button onClick={sendMessage} className="btn green" disabled={isLoading}>
          Send
        </button>
        <button onClick={takeScreenshotAndExplain} className="btn teal" disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Explain Screen"}
        </button>
      </div>
    </div>
  );
}