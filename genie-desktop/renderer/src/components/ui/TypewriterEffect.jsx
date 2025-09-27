import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

// Variants define the animation states
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // This makes each word appear one after the other
    },
  },
  // The 'exit' variant is no longer needed
};

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 20, // Words will emerge by moving up 20px
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 100,
    },
  },
};

export const TypewriterEffectSmooth = ({ words, className }) => {
  const controls = useAnimation();

  // This hook now only runs the "visible" animation once.
  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  // We calculate how long the line animation should take to match the word reveal
  const lineAnimationDuration = words.length * 0.1 + 0.4;

  return (
    <motion.div
      className={`typewriter-container ${className || ''}`}
      variants={containerVariants}
      initial="hidden"
      animate={controls} // The animation will stop once it reaches the "visible" state
    >
      {/* The container for the emerging words */}
      <div className="words-wrapper">
        {words.map((word, idx) => (
          <motion.span
            key={idx}
            variants={wordVariants}
            className={`word ${word.className || ''}`}
          >
            {word.text}
          </motion.span>
        ))}
      </div>
      
      {/* The line that draws itself underneath the words */}
      <motion.div
        className="reveal-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: lineAnimationDuration, ease: "easeOut" }}
      />
    </motion.div>
  );
};