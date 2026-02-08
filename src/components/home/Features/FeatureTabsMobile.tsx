"use client";

import React from "react";
import { motion } from "framer-motion";
import { featureCards } from "./data";
import { FeatureCardMobile, type EffectVariant } from "./FeatureCardMobile";
import { FeatureHeaderMbile } from "./FeaturesHeaderMobile";

export type { EffectVariant };

interface FeatureTabsMobileProps {
  /** 
   * Animation effect variant:
   * - cards: Tinder-like stacked cards
   * - coverflow: 3D album cover flow
   * - flip: 3D page flip
   * - cube: 3D cube rotation
   * - creative: Custom slide + rotate animation (default)
   */
  effect?: EffectVariant;
}

export const FeatureTabsMobile = ({ effect = "creative" }: FeatureTabsMobileProps) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-scroll tabs container to show active tab
  React.useEffect(() => {
    if (tabRefs.current[activeIndex]) {
      tabRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeIndex]);

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-4 mb-4">
        <FeatureHeaderMbile activeColor={featureCards[activeIndex].accentColor} />
      </div>

      {/* Tab Pills */}
      <div className="flex gap-2 px-4 mb-6 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {featureCards.map((card, index) => (
          <motion.button
            key={card.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            onClick={() => handleTabClick(index)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap flex-shrink-0 snap-center ${
              activeIndex === index
                ? "text-white"
                : "bg-white text-gray-900 border-2 border-gray-900"
            }`}
            style={{
              backgroundColor:
                activeIndex === index ? card.accentColor : undefined,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {card.tab}
          </motion.button>
        ))}
      </div>

      {/* Swiper Cards */}
      <FeatureCardMobile
        activeIndex={activeIndex}
        onSlideChange={setActiveIndex}
        effect={effect}
      />
    </div>
  );
};

