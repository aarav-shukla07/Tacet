import React, { useEffect, useRef, useState, memo } from "react";
import { motion } from "framer-motion";

const Stars = () => {
  const randomMove = () => Math.random() * 4 - 2;
  const randomOpacity = () => Math.random();
  const random = () => Math.random();
  return (
    <div className="absolute inset-0">
      {[...Array(200)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: [0, randomOpacity(), 0],
            scale: [1, 1.2, 0],
          }}
          transition={{
            // --- FIX START ---
            // Reduced duration for a much faster twinkle effect
            duration: random() * 3 + 2, // Now animates between 2 and 5 seconds
            // --- FIX END ---
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            width: `2px`,
            height: `2px`,
            backgroundColor: "white",
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block"
        ></motion.span>
      ))}
    </div>
  );
};

export const MemoizedStars = memo(Stars);

export const TextRevealCard = ({ text, revealText, children, className }) => {
  const [widthPercentage, setWidthPercentage] = useState(0);
  const cardRef = useRef(null);
  const [left, setLeft] = useState(0);
  const [localWidth, setLocalWidth] = useState(0);
  const [isMouseOver, setIsMouseOver] = useState(false);

  useEffect(() => {
    if (cardRef.current) {
      const { left, width } = cardRef.current.getBoundingClientRect();
      setLeft(left);
      setLocalWidth(width);
    }
  }, []);

  function mouseMoveHandler(event) {
    event.preventDefault();
    if (cardRef.current) {
      const relativeX = event.clientX - left;
      setWidthPercentage((relativeX / localWidth) * 100);
    }
  }

  function mouseLeaveHandler() {
    setIsMouseOver(false);
    setWidthPercentage(0);
  }

  function mouseEnterHandler() {
    setIsMouseOver(true);
  }

  return (
    <div
      onMouseEnter={mouseEnterHandler}
      onMouseLeave={mouseLeaveHandler}
      onMouseMove={mouseMoveHandler}
      ref={cardRef}
      className={`text-reveal-card ${className || ''}`}
    >
      {children}
      <div className="reveal-content-container">
        <motion.div
          style={{ width: "100%" }}
          animate={{
            opacity: widthPercentage > 0 ? 1 : 0,
            clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`,
          }}
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
          className="reveal-text-container"
        >
          <p className="reveal-text">
            {revealText}
          </p>
        </motion.div>
        
        <div className="base-text-container">
          <p className="base-text">
            {text}
          </p>
          <MemoizedStars />
        </div>
      </div>
    </div>
  );
};

export const TextRevealCardTitle = ({ children, className }) => {
  return (
    <h2 className={`text-reveal-title ${className || ''}`}>
      {children}
    </h2>
  );
};

export const TextRevealCardDescription = ({ children, className }) => {
  return (
    <p className={`text-reveal-description ${className || ''}`}>
      {children}
    </p>
  );
};