import React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { featureCards } from "./data";
import { useMediaQuery } from "react-responsive";

export interface FeatureCardProps {
  card: typeof featureCards[0];
  index: number;
  activeIndex?: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  totalCards: number;
  variant?: "default" | "tilted";
}

export const FeatureCard = ({ card, index, activeIndex = 0, scrollYProgress, totalCards, variant = "default" }: FeatureCardProps) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  // Config
  const step = 0.25;
  const holdDuration = 0.15;
  const isLast = index === totalCards - 1;
  const baseTilt = isMobile ? 4 : 5; // Uniform Clockwise Tilt

  // Timeline Points
  // enterStart: When prev card finishes holding (starts exiting)
  const enterStart = (index - 1) * step + holdDuration; 
  const activeStart = index * step; 
  const activeEnd = activeStart + holdDuration;
  // Exit MUST finish exactly when next card starts (at activeStart + step) to prevent overlap at snap point
  const exitEnd = activeStart + step; 

  // 1. Rotation: Tilted -> Straight (Hold) -> Tilted Exit
  const rotateRaw = useTransform(
    scrollYProgress,
    isLast ? [enterStart, activeStart] : [enterStart, activeStart, activeEnd, exitEnd],
    isLast ? [baseTilt, 0]             : [baseTilt, 0, 0, 15]
  );

  // 2. Scale: Always 1 (Disabled scaling)
  const scaleRaw = useTransform(
    scrollYProgress,
    [enterStart, activeStart],
    [1, 1]
  );

  // 3. Opacity: Exit Fade Only (Stacked cards are full opacity)
  const opacityRaw = useTransform(
    scrollYProgress,
    isLast 
      ? [activeStart, activeStart + 0.01] // Always 1
      : [activeEnd, activeEnd + 0.07, exitEnd], // Stay opaque for 70% of flight, then quick fade
    isLast 
      ? [1, 1] 
      : [1, 1, 0] 
  );

  // 4. Exit Transforms (Peel Off after Hold)
  const xExitRaw = useTransform(scrollYProgress, [activeEnd, exitEnd], [0, 900]);
  const yExitRaw = useTransform(scrollYProgress, [activeEnd, exitEnd], [0, -300]);

  // Spring Smoothing
  const springConfig = { stiffness: 120, damping: 20, mass: 0.5 };
  const x = useSpring(xExitRaw, springConfig);
  const y = useSpring(yExitRaw, springConfig);
  const rotate = useSpring(rotateRaw, springConfig);
  const opacity = useSpring(opacityRaw, springConfig);
  const scale = useSpring(scaleRaw, springConfig);

  // Track hover state for button animation
  const [isHovered, setIsHovered] = React.useState(false);

  // Pointer Events: Auto only when Active (Straight)
  const pointerEvents = useTransform(
    scrollYProgress,
    (val) => (val >= activeStart - 0.05 && val < activeEnd + 0.05 ? "auto" : "none")
  );

  return (
    <motion.div
      className={`absolute left-0 w-full h-full rounded-2xl md:rounded-3xl p-5 py-10 md:p-8 md:px-24 md:py-20 ${card.gradient} shadow-2xl origin-bottom`}
      style={{
        x: variant === "tilted" && !isLast ? x : 0,
        y: variant === "tilted" && !isLast ? y : 0,
        rotate: variant === "tilted" ? rotate : 0,
        opacity: variant === "tilted" ? opacity : 1,
        scale: variant === "tilted" ? scale : 1,
        zIndex: totalCards - index,
        top: index * 1,
        pointerEvents: index === 0 ? "auto" : pointerEvents,
      }}
    >
      {/* Sun Ray Overlay */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: "radial-gradient(300px circle at top left, rgba(255,255,255,0.15) 0%, transparent 100%)"
          }}
        />

      <div className="max-w-[38rem] md:text-left text-center">
        <h3 className="text-2xl md:text-5xl font-bold text-white mb-1 leading-none">
          {card.title}
        </h3>
        <h3 
          className="text-2xl md:text-5xl font-bold mb-3 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent)] to-white md:py-0.5"
          style={{ 
            // Using CSS variable or direct style for dynamic color
            backgroundImage: `linear-gradient(90deg, ${card.gradientStartColor} 0%, #FFFFFF 55%)`
          }}
        >
          {card.subtitle}
        </h3>
        <p className="text-white/70 text-sm md:text-2xl leading-relaxed md:leading-tight mb-5 md:mb-14 font-normal">
          {card.description}{" "}
          <span className="font-semibold">{card.highlight}</span>
        </p>
        <button
          className="group relative cursor-pointer inline-flex items-center justify-center overflow-hidden px-4 md:px-6 py-2 md:py-3 rounded-full text-black bg-white text-sm md:text-base font-medium hover:border-white/50 transition-all min-w-[120px] md:min-w-[140px]"
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
