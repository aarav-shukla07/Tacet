import React from 'react';
import { motion } from 'framer-motion';

export const TypewriterEffectSmooth = ({ words, className, cursorClassName }) => {
  const wordsArray = words.map((word) => ({
    ...word,
    text: word.text.split(""),
  }));

  const renderWords = () => {
    return (
      <div>
        {wordsArray.map((word, idx) => (
          <div key={`word-${idx}`} className="inline-block">
            {word.text.map((char, index) => (
              <span
                key={`char-${index}`}
                className={`text-white ${word.className || ''}`}
              >
                {char}
              </span>
            ))}
            &nbsp; {/* space between words */}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`typewriter-container ${className || ''}`}>
      <motion.div
        className="overflow-hidden"
        initial={{ width: "0%" }}
        whileInView={{ width: "100%" }}
        transition={{
          duration: 2,
          ease: "linear",
          delay: 0.5,
        }}
      >
        <div
          className="typewriter-text"
          style={{ whiteSpace: "nowrap" }}
        >
          {renderWords()}
        </div>
      </motion.div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className={`blinking-cursor ${cursorClassName || ''}`}
      ></motion.span>
    </div>
  );
};