import React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { featureCards } from "./data";

export interface FeatureCardProps {
  card: typeof featureCards[0];
  index: number;
  activeIndex?: number; // Optional to support existing calls without refactor
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  totalCards: number;
  variant?: "default" | "tilted";
}

export const FeatureCard = ({ card, index, activeIndex = 0, scrollYProgress, totalCards, variant = "default" }: FeatureCardProps) => {
  // Spring config for smooth, natural motion
  const springConfig = { stiffness: 120, damping: 20, mass: 0.5 };
  
  // Calculate specific timing for THIS card
  // Entry phase: ends at index * 0.24 (card becomes fully active)
  const activeStart = index * 0.24;
  
  // Calculate dynamic scale range
  const rangeInput = [activeStart - 0.1, activeStart];
  const rangeScale = [1, 1];
  
  // Stacking parameters
  const topOffset = index * 15; // Fixed downward offset for visibility
  const scaleStep = 0.05;

  // Add scale points for subsequent cards
  for (let i = 1; i <= totalCards - 1 - index; i++) {
    const nextCardStart = activeStart + (i * 0.24);
    rangeInput.push(nextCardStart);
    rangeScale.push(1 - (scaleStep * i));
  }

  // --- Rotation Logic for Tilted Variant ---
  // Using activeIndex for strict state control to ensure active card is ALWAYS straight.
  // - Active (index === activeIndex): 0 deg
  // - Covered (index < activeIndex): 6 deg (Clockwise - opposite of previous)
  // - Entering (index > activeIndex): 0 deg (or custom entry angle)
  const targetRotation = variant === "tilted" && index < activeIndex ? 6 : 0;

  // --- X Position Logic ---
  // Default: 0
  // Tilted: Enter from Right (100 -> 0)
  const xEntryValues = variant === "tilted" ? [100, 0] : [0, 0];
  const xRaw = useTransform(
    scrollYProgress,
    [activeStart - 0.1, activeStart],
    xEntryValues
  );
  const x = useSpring(xRaw, springConfig);

  // --- Y Position Logic ---
  // Default: Enter from Bottom (200 -> 0)
  // Tilted: Enter from Top (-100 -> 0)
  const yEntryValues = variant === "tilted" ? [-100, 0] : [200, 0];
  const yRaw = useTransform(
    scrollYProgress,
    [activeStart - 0.1, activeStart],
    yEntryValues
  );
  const y = useSpring(yRaw, springConfig);

  const scaleRaw = useTransform(scrollYProgress, rangeInput, rangeScale);
  const scale = useSpring(scaleRaw, springConfig);
  
  const opacityRaw = useTransform(
    scrollYProgress,
    [activeStart - 0.1, activeStart - 0.09],
    [0, 1]
  );
  const opacity = useSpring(opacityRaw, { stiffness: 300, damping: 20 });
  
  // Track hover state for button animation
  const [isHovered, setIsHovered] = React.useState(false);

  // Fix blocking issues: Set pointer-events to none when not fully visible
  const pointerEvents = useTransform(
    scrollYProgress,
    (val) => (val >= activeStart - 0.1 ? "auto" : "none")
  );

  return (
    <motion.div
      className={`absolute left-0 w-full h-full rounded-3xl p-8 md:px-24 md:py-20 ${card.gradient} shadow-2xl`}
      style={{
        x: index === 0 ? 0 : x,
        y: index === 0 ? 0 : y,
        top: topOffset, // Fixed offset ensures previous cards stay visible at top
        opacity: index === 0 ? 1 : opacity,
        // rotate is handled by animate prop below for state-based control
        scale: index === totalCards - 1 ? 1 : scale,
        zIndex: index + 1,
        pointerEvents: index === 0 ? "auto" : pointerEvents,
      }}
      animate={{
        rotate: targetRotation
      }}
      transition={{
        rotate: { duration: 0.4, ease: "easeInOut" } // Smooth rotation transition
      }}
    >

      {/* Sun Ray Overlay */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: "radial-gradient(300px circle at top left, rgba(255,255,255,0.15) 0%, transparent 100%)"
          }}
        />

      <div className="max-w-[38rem]">
        <h3 className="text-2xl md:text-5xl font-bold text-white mb-1">
          {card.title}
        </h3>
        <h3 
          className="text-2xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent)] to-white"
          style={{ 
            // Using CSS variable or direct style for dynamic color
            backgroundImage: `linear-gradient(to right, ${card.gradientStartColor}, #ffffff)`
          }}
        >
          {card.subtitle}
        </h3>
        <p className="text-white/70 text-lg md:text-2xl leading-tight mb-14 font-normal">
          {card.description}{" "}
          <span className="font-semibold">{card.highlight}</span>
        </p>
        <button
          className="group relative cursor-pointer inline-flex items-center justify-center overflow-hidden px-6 py-3 rounded-full text-black bg-white text-base font-medium hover:border-white/50 transition-all min-w-[140px]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="grid grid-cols-1 grid-rows-1 place-items-center">
            {/* Know More - Slides Up */}
            <motion.span
              className="col-start-1 row-start-1 flex items-center gap-2 whitespace-nowrap"
              animate={{ y: isHovered ? "-150%" : "0%" }}
              transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            >
              Know More
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6.11279 16.7836L10.9128 11.9836L6.11279 7.18359M12.8328 16.7836L17.6328 11.9836L12.8328 7.18359" stroke="currentColor" strokeWidth="1.44" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.span>
            
            {/* Get Started - Slides Up from Bottom */}
            <motion.span
              className="col-start-1 row-start-1 flex items-center gap-2 whitespace-nowrap"
              initial={{ y: "150%" }}
              animate={{ y: isHovered ? "0%" : "150%" }}
              transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            >
              Get Started
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6.11279 16.7836L10.9128 11.9836L6.11279 7.18359M12.8328 16.7836L17.6328 11.9836L12.8328 7.18359" stroke="currentColor" strokeWidth="1.44" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.span>
          </div>
        </button>
      </div>
    </motion.div>
  );
};
