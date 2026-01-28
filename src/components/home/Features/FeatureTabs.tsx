import React from "react";
import { motion, useScroll } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { featureCards } from "./data";
import { FeatureCard } from "./FeatureCard";
import { FeatureHeader } from "./FeatureHeader";
import { FeatureHeaderMbile } from "./FeaturesHeaderMobile";

export const FeatureTabs = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const isScrollingProgrammatically = React.useRef(false);

  // Robust Media Query via react-responsive (Handles scaling/zoom better)
  const [mounted, setMounted] = React.useState(false);
  const isTallScreen = useMediaQuery({ minHeight: 800 });
  const isMobile = useMediaQuery({ maxWidth: 768 });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll tabs container to show active tab on mobile
  React.useEffect(() => {
    // Skip auto-scroll if we're programmatically scrolling (from tab click)
    if (isScrollingProgrammatically.current) return;

    if (mounted && isMobile && tabRefs.current[activeIndex]) {
      // Small delay to debounce rapid changes
      const timeoutId = setTimeout(() => {
        tabRefs.current[activeIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [activeIndex, mounted, isMobile]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Update active tab based on scroll progress
  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value: number) => {
      // Skip if we're programmatically scrolling (from tab click)
      if (isScrollingProgrammatically.current) return;

      // Using 0.25 per card to match FeatureCard timing
      const newIndex = Math.min(Math.floor((value + 0.01) / 0.25), 3);
      setActiveIndex(newIndex);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Handle tab click to scroll to specific section
  const handleTabClick = (index: number) => {
    if (!containerRef.current) return;

    // Set flag to prevent scroll listener from interfering
    isScrollingProgrammatically.current = true;

    // Immediately update activeIndex for instant visual feedback
    setActiveIndex(index);

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

    // Reset flag after scroll animation completes
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 800);
  };

  return (
    <div ref={containerRef} className="relative h-[300vh] md:h-[250vh]">
      {/* Scroll Snap Anchors */}
      <div className="absolute inset-0 pointer-events-none">
        {featureCards.map((_, index) => (
          <div
            key={`snap-${index}`}
            className="absolute left-0 w-full h-1 snap-start"
            style={{
              top:
                mounted && isMobile
                  ? `calc((300vh - 100vh) * ${index * 0.25})`
                  : `calc((250vh - 100vh) * ${index * 0.25})`,
            }}
          />
        ))}
      </div>

      {/* Section Header - outside sticky for non-tall desktop screens */}
      {mounted && !isTallScreen && !isMobile && (
        <FeatureHeader activeColor={featureCards[activeIndex].accentColor} />
      )}

      {/* Sticky Container */}
      <div className="sticky top-6 md:top-8 px-4 bg-white">
        {/* Header inside sticky for mobile and tall screens */}
        {mounted && (isMobile || isTallScreen) && (
          <div className={isTallScreen ? "pt-4 md:pt-10" : ""}>
            {isMobile ? (
              <FeatureHeaderMbile activeColor={featureCards[activeIndex].accentColor} />
            ) : (
              <FeatureHeader
                activeColor={featureCards[activeIndex].accentColor}
              />
            )}
          </div>
        )}
        <div className="flex md:flex-wrap md:justify-center gap-2 md:gap-5 mb-6 md:mb-14 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide snap-x snap-mandatory">
          {featureCards.map((card, index) => (
            <motion.button
              key={card.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              onClick={() => handleTabClick(index)}
              className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-sm md:text-xl font-semibold cursor-pointer whitespace-nowrap flex-shrink-0 snap-center ${
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
        <div className="px-4 md:px-0">
          <div className="max-w-7xl mx-auto relative h-[27.375rem] md:h-[29rem]">
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
    </div>
  );
};
