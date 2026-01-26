import React from "react";
import { motion, useScroll } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { featureCards } from "./data";
import { FeatureCard } from "./FeatureCard";
import { FeatureHeader } from "./FeatureHeader";

export const FeatureTabs = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  
  // Robust Media Query via react-responsive (Handles scaling/zoom better)
  const [mounted, setMounted] = React.useState(false);
  const isTallScreen = useMediaQuery({ minHeight: 800 });

  React.useEffect(() => {
    setMounted(true);
  }, []);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Update active tab based on scroll progress
  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value: number) => {
      // Using 0.25 per card to match FeatureCard timing
      const newIndex = Math.min(Math.floor((value + 0.01) / 0.25), 3);
      setActiveIndex(newIndex);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Handle tab click to scroll to specific section
  const handleTabClick = (index: number) => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Calculate accurate absolute position relative to document
    const rect = container.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const scrollDistance = container.offsetHeight - window.innerHeight;

    // Calculate target scroll position based on index * 0.25 (start of card activation)
    // We add a small buffer (+0.02) to ensure we land firmly inside the Hold Phase
    const targetScroll = absoluteTop + (index * 0.25 + 0.02) * scrollDistance;

    window.scrollTo({
      top: targetScroll + 2, // Slight buffer
      behavior: "smooth",
    });
  };

  return (
    <div ref={containerRef} className="relative h-[250vh]">
      {/* Section Header (Only visible on small and normal screens) */}
      {mounted && !isTallScreen && (
          <FeatureHeader />
      )}

      {/* Sticky Container */}
      <div className="sticky top-8">
      {/* Tab Buttons */}
        {mounted && isTallScreen && (
          <div className="pt-10">
            <FeatureHeader />
          </div>
        )}
        <div className="flex justify-center gap-5 mb-10">
          {featureCards.map((card, index) => (
            <motion.button
              key={card.id}
              onClick={() => handleTabClick(index)}
              className={`px-5 py-2 rounded-full text-xl font-semibold cursor-pointer ${
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

        {/* Cards Stack Container */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative h-[29rem]">
          {featureCards.map((card, index) => (
            <FeatureCard
              key={card.id}
              card={card}
              index={index}
              activeIndex={activeIndex}
              scrollYProgress={scrollYProgress}
              totalCards={featureCards.length}
              variant="tilted"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
