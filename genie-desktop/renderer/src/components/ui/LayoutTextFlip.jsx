import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const LayoutTextFlip = ({
  text = "The Power of",
  words = ["Silence", "Privacy", "Focus"],
  duration = 3000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  return (
    <div className="layout-text-flip-container">
      {/* --- FIX START --- */}
      {/* Changed this from a motion.span to a regular span to prevent animation conflicts */}
      <span className="static-text">
        {text}
      </span>
      {/* --- FIX END --- */}

      <motion.div
        layout
        className="flipping-word-container"
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: -40, filter: "blur(10px)" }}
            animate={{ y: 0, filter: "blur(0px)" }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 12 }}
            className="flipping-word"
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};