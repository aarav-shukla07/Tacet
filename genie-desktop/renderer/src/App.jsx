import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export default function App() {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const overlayRef = useRef(null);
  const posRef = useRef({ x: 80, y: 80 });

  // Listen for electron toggle
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onToggle) {
      window.electronAPI.onToggle(() => setOverlayOpen(o => !o));
    }
  }, []);

  // Keep overlay position
  useEffect(() => {
    const el = overlayRef.current;
    if (el) {
      el.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }
  }, [overlayRef.current]);

  // Make overlay draggable
  function startDrag(e) {
    const el = overlayRef.current;
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = posRef.current.x;
    const initY = posRef.current.y;

    function onMove(ev) {
      posRef.current.x = initX + (ev.clientX - startX);
      posRef.current.y = initY + (ev.clientY - startY);
      el.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // Capture + OCR + AI explain
  async function takeScreenshotAndExplain() {
    setChat([]);
    try {
      const res = await axios.get('http://127.0.0.1:8000/explain-screen', { timeout: 60000 });
      const data = res.data;
      setSessionId(data.session_id);
      const ai = data.ai_analysis || { solution_or_explanation: 'No analysis', type: 'general' };
      setChat([{ role: 'assistant', text: ai.solution_or_explanation, type: ai.type }]);
      setOverlayOpen(true);
    } catch (err) {
      setChat([{ role: 'assistant', text: 'Error: ' + (err.response?.data?.error || err.message), type: 'general' }]);
      setOverlayOpen(true);
    }
  }

  // Send user message
  async function sendMessage() {
    if (!input.trim()) return;

    const msg = input.trim();
    setChat(c => [...c, { role: 'user', text: msg }]);
    setInput('');

    try {
      let res;

      if (!sessionId) {
        // If no session yet, start with /ask-text
        res = await axios.post('http://127.0.0.1:8000/ask-text', { question: msg }, { timeout: 0 });
        setSessionId(res.data.session_id);
        const reply = res.data.ai_reply || "No reply";
        setChat(c => [...c, { role: 'assistant', text: reply }]);
      } else {
        // Continue in chat session
        res = await axios.post('http://127.0.0.1:8000/chat-session', { session_id: sessionId, message: msg }, { timeout: 0 });
        const reply = res.data.ai_reply || "No reply";
        setChat(c => [...c, { role: 'assistant', text: reply }]);
      }

    } catch (err) {
      setChat(c => [...c, { role: 'assistant', text: 'Error: ' + (err.response?.data?.detail || err.message) }]);
    }
  }

  return (
    <div className="app-root">
      <div className="card">
        <h1>✨ Genie — Your Local AI Assistant</h1>
        <p className="muted">Ask Genie anything or capture your screen to get instant solutions and explanations.</p>

        <div className="controls">
          <button onClick={() => setOverlayOpen(true)} className="btn primary">Ask Genie</button>
          <button onClick={takeScreenshotAndExplain} className="btn teal">Capture & Explain</button>
        </div>

        <div className="recent">
          <h3>Recent</h3>
          <div className="muted">No history yet. Use Ask Genie to begin.</div>
        </div>
      </div>

      {overlayOpen && (
        <div
          ref={overlayRef}
          className="overlay"
          onMouseDown={(e) => { if (e.target === overlayRef.current) startDrag(e); }}
        >
          <div className="overlay-header">
            <div className="title">Genie</div>
            <div className="actions">
              <button onClick={() => setOverlayOpen(false)} className="btn small">Close</button>
            </div>
          </div>

          <div className="chat-window">
            {chat.map((m, i) => (
              <div key={i} className={`bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="input-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Genie..."
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} className="btn green">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
