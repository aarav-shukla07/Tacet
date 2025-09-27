import React from 'react';
import { Spotlight } from './components/ui/Spotlight';
import { TypewriterEffectSmooth } from './components/ui/TypewriterEffect';

export default function App() {
  // Define the words for the typewriter effect
  const words = [
    { text: "AI-powered" },
    { text: "insight," },
    { text: "hidden" },
    { text: "in" },
    {
      text: "plain",
      className: "text-blue-500", // This will be styled in CSS
    },
    {
      text: "sight.",
      className: "text-blue-500",
    },
  ];
  
  return (
    <div className="main-container">
      <div className="content-wrapper">
        <header className="hero-section">
          {/* New div for the background glow effect */}
          <Spotlight
            className="hero-spotlight"
            fill="white"
          />
          <h1 className="hero-title">
            TACET
          </h1>

          {/* <TypewriterEffectSmooth words={words} />
           */}
        </header>

        <div className="typewriter-wrapper">
          <TypewriterEffectSmooth words={words} />
        </div>
        <div className='cta-wrapper'>
          <button
            className="button-54"
            role="button"
            onClick={() => window.electronAPI.openOverlay()}
          >
            Activate Tacet
          </button>
        </div>

        <section className="page-section animated-section">
          <h2 className="section-title">The Power of Silence</h2>
          <p className="section-paragraph">
            In today's collaborative world, privacy is paramount. Tacet (from Latin 'it is silent') was built for professionals who need AI assistance without broadcasting their work. Whether you're in a code review, a client presentation, or an online class, Tacet works for you and only you. It provides the answers you need, right on your screen, without ever showing up on anyone else's.
          </p>
        </section>

        <section className="page-section">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Privacy Shield</h3>
              <p>This is Tacet's signature feature. The overlay is undetectable by screen-sharing and recording software like Zoom, Google Meet, and Teams. To others, it's an empty space on your screen; to you, it's a powerful AI tool.</p>
            </div>
            <div className="feature-card">
              <h3>Instant Contextual Analysis</h3>
              <p>Stop the tedious cycle of copying and pasting. With a single click, Tacet reads the content on your screen and provides solutions, explanations, or summaries in real-time. It's the ultimate productivity boost for developers, writers, and researchers.</p>
            </div>
            <div className="feature-card">
              <h3>100% Offline & Secure</h3>
              <p>Your data never leaves your machine. Tacet leverages the power of Ollama to run large language models entirely locally. This means no data collection, no privacy concerns, and functionality even without an internet connection.</p>
            </div>
          </div>
        </section>

        <section className="page-section">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <h3>Activate</h3>
              <p>Launch the Tacet overlay. It floats discreetly above your applications, always ready for your command.</p>
            </div>
            <div className="step">
              <h3>Analyze</h3>
              <p>Click "Explain Screen" to have Tacet instantly and privately analyze the text content currently visible on your display.</p>
            </div>
            <div className="step">
              <h3>Achieve</h3>
              <p>Receive code, explanations, or summaries streamed directly to your private overlay, empowering you to work smarter and faster.</p>
            </div>
          </div>
        </section>

        {/* New footer element */}
        <footer className="app-footer">
          <p>Made by Aarav Shukla!!</p>
        </footer>
      </div>
    </div>
  );
}