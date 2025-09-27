import React from 'react';
import { Spotlight } from './components/ui/Spotlight';
import { TypewriterEffectSmooth } from './components/ui/TypewriterEffect';
import { LayoutTextFlip } from './components/ui/LayoutTextFlip';
import { CometCard } from './components/ui/CometCard';

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
          <LayoutTextFlip
            text="The Power of"
            words={["Silence", "Privacy", "Focus"]}
          />
          <p className="section-paragraph">
            Stuck on a LeetCode or CodeChef problem during a live interview? Tacet is your secret advantage. With our Privacy Shield, you can get the solution on your screen in real-time, without the interviewer ever knowing. It's the ultimate tool for acing technical rounds, discreetly.

          </p>
        </section>

        <section className="page-section">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            {/* Wrap each feature in the new CometCard component */}
            <CometCard>
              <h3>Privacy Shield</h3>
              <p>Tacet's overlay is undetectable by screen-sharing software. To interviewers or professors, it's an empty space on your screen. To you, it's your private co-pilot for getting the right answer.</p>
            </CometCard>
            <CometCard>
              <h3>Instant Contextual Analysis</h3>
              <p>Don't just get answers, get the *right* answers. A single click captures the problem on your screen, providing instant, context-aware solutions when the pressure is on.</p>
            </CometCard>
            <CometCard>
              <h3>100% Offline & Secure</h3>
              <p>Your activity is your business. Tacet runs entirely on your machine, meaning no network requests, no data collection, and no traces. Your secret advantage stays secret.</p>
            </CometCard>
          </div>
        </section>


        <section className="page-section">
          <h2 className="section-title">How It Works</h2>
          {/* --- UPDATED THIS SECTION --- */}
          <div className="steps-container">
            <CometCard>
              <h3>Activate</h3>
              <p>Launch the Tacet overlay. It floats discreetly above your applications, always ready for your command.</p>
            </CometCard>
            <CometCard>
              <h3>Analyze</h3>
              <p>Click "Explain Screen" to have Tacet instantly and privately analyze the text content currently visible on your display.</p>
            </CometCard>
            <CometCard>
              <h3>Achieve</h3>
              <p>Receive code, explanations, or summaries streamed directly to your private overlay, empowering you to work smarter and faster.</p>
            </CometCard>
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