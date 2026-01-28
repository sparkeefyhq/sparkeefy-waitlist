'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Sparkle SVG component
const Sparkle = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 5 5" 
    fill="none"
    className={className}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M0.832967 3.32304C0.775841 3.29448 0.717828 3.26459 0.660419 3.23268C0.412671 3.09501 0.175733 2.91976 0.0664542 2.65257C0.0457335 2.60192 0.0298861 2.54905 0.0188624 2.49535C-0.0151023 2.32978 -0.00310684 2.15638 0.0541111 2.01622C0.12851 1.83403 0.279309 1.70805 0.466519 1.655C0.470009 1.65401 0.473521 1.65305 0.477039 1.65212C0.829462 1.55806 1.15913 1.72413 1.43507 1.96326C1.6259 2.12863 1.79106 2.32895 1.92031 2.50234C2.21287 2.89475 2.65132 3.61871 2.71156 3.72906C2.87546 4.00833 2.8684 4.01186 2.85428 3.80859C2.84019 3.6053 2.81906 3.19522 2.72565 2.86113C2.67834 2.6919 2.61248 2.54217 2.54664 2.3977C2.48251 2.257 2.41839 2.12125 2.37144 1.97734C2.1797 1.38963 2.26934 0.736222 2.7689 0.332245C2.92366 0.20715 3.09713 0.123629 3.26312 0.0701074C3.41327 0.0216942 3.5722 -0.0019644 3.73038 0.000127525C4.06312 0.00453907 4.3925 0.122989 4.62957 0.365012C4.95598 0.698247 5.07 1.19144 4.95839 1.64148C4.77804 2.36901 4.14274 3.04416 3.7072 3.63358C3.67725 3.67411 3.64788 3.71483 3.6192 3.75555C3.55895 3.84111 3.50174 3.92672 3.44861 4.01061C3.33953 4.18286 3.24768 4.34793 3.18207 4.49086C3.10204 4.66523 3.06106 4.80667 3.02637 4.89556C3.01218 4.93194 2.99903 4.95952 2.98471 4.97696C2.93536 5.03707 2.87193 4.97699 2.775 4.82675C2.65085 4.6358 2.55255 4.46 2.40548 4.29031C2.38676 4.2687 2.36723 4.24718 2.34675 4.22574C2.14587 4.01541 1.8745 3.83512 1.55201 3.66895C1.44806 3.61539 1.33878 3.56328 1.2294 3.5119C1.09416 3.44837 0.958746 3.38589 0.832967 3.32304Z" 
      fill="#FFF2F2"
    />
  </svg>
);

// Generate random sparkles - distributed evenly closer to content
const generateSparkles = (count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    // Stratified vertical positioning
    const verticalSlotSize = 70 / count; 
    const topBase = 20 + (i * verticalSlotSize);
    
    // Alternating Left/Right
    const isRightSide = i % 2 === 0;

    return {
      id: i,
      top: `${topBase + Math.random() * (verticalSlotSize * 0.8)}%`,
      
      // Zones closer to content (5-30% and 70-95%)
      left: isRightSide 
        ? `${70 + Math.random() * 25}%` 
        : `${5 + Math.random() * 25}%`,
        
      size: 4 + (i % 3) * 2.5, // Deterministic mix: 4px, 6.5px, 9px
      delay: Math.random() * 5,
      duration: Math.random() * 5 + 7, 
    };
  });
};

const StarsBackground = () => {
  const [sparkles, setSparkles] = useState<{ id: number; top: string; left: string; size: number; delay: number; duration: number }[]>([]);
  
  // Parallax scroll effect
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]); // Stars move slower than scroll

  useEffect(() => {
    // Increased count slightly since visual area is reduced
    setSparkles(generateSparkles(7)); 
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-[3]"
      style={{ y }}
    >
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            // Back glow effect
            filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))"
          }}
          animate={{
            // Duller max opacity (0.4)
            opacity: [0, 0.5, 0],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: sparkle.duration,
            repeat: Infinity,
            delay: sparkle.delay,
            ease: "easeInOut",
          }}
        >
          <Sparkle size={sparkle.size} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StarsBackground;

