import React from "react";

export default function App() {
  return (
    <div className="app-root">
      <div className="card">
        <h1>✨ Genie — Your Local AI Assistant</h1>
        <p className="muted">
          Click below to summon Genie. The overlay will appear and stay on top
          of all your apps.
        </p>

        <button
          onClick={() => window.electronAPI.openOverlay()}
          className="btn primary"
        >
          Ask Genie
        </button>
      </div>
    </div>
  );
}
