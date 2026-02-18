"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import StarsBackground from "@/components/home/StarsBackground";
import { motion, AnimatePresence } from "framer-motion";

const bgImages = [
  "/img/about-hero-bg-mobile-2.png",
  "/img/about-hero-bg-mobile-1.png",
  "/img/about-hero-bg-mobile-3.png",
  "/img/about-hero-bg-mobile-4.png",
];

const tabs = [
  { id: 0, color: "#FF0080" }, // Synchronized with Stay Thoughtful
  { id: 1, color: "#81F5FA" }, // Synchronized with Say it better
  { id: 2, color: "#955BF0" }, // Synchronized with Plan with ease
  { id: 3, color: "#FEBF67" }, // Synchronized with Gift thoughtfully
];

const content = [
  {
    id: 0,
    title: "Remember what matters,",
    subtitle: "effortlessly",
    accentColor: "#FF0080",
    gradientStartColor: "#FFB3D9",
    subheadline: "So the people you care about feel genuinely cared for.",
    list: [
      "Important dates, preferences, and moments <b class='text-white'>saved in one private place</b>",
      "Designed to work quietly in the background, with notifications <b class='text-white'>only when they matter.</b>",
      "Gentle reminders help meaningful moments from <b class='text-white'>slipping away.</b>",
    ],
    image: "/img/feature-card-img-1.png",
  },
  {
    id: 1,
    title: "Know what to say,",
    subtitle: "when it matters",
    accentColor: "#06B0B7",
    gradientStartColor: "#99F6E4",
    subheadline: "So conversations feel natural - even when words don't come easily.",
    list: [
      "<b class='text-white'>Gentle support</b> for messages and check-ins when you're unsure how to respond. <span class='text-[#81F5FA]'>You stay in control - nothing is sent without you choosing it</span>",
      "<b class='text-white'>Suggestions you can shape and send in your own words - especially in sensitive moments</b>",
      "<b class='text-white'>Communicate clearly</b> - without sounding scripted or forced",
    ],
    image: "/img/feature-card-img-2.png",
  },
  {
    id: 2,
    title: "Plan moments",
    subtitle: "without the stress",
    accentColor: "#955BF0",
    gradientStartColor: "#E9D5FF",
    subheadline: "So spending time together feels intentional, not last-minute.",
    list: [
      "<b class='text-white'>Ideas</b> for spending time together shaped around what you both enjoy.",
      "<b class='text-white'>Suggestions</b> that consider your mood, budget and their preferences.",
      "Helps you narrow things down and decide faster.",
    ],
    image: "/img/feature-card-img-3.png",
  },
  {
    id: 3,
    title: "Give gifts that",
    subtitle: "feel personal",
    accentColor: "#FEBF67",
    gradientStartColor: "#FDE68A",
    subheadline: "So gifting feels thoughtful - not stressful",
    list: [
      "Suggestions shaped around your shared moments and upcoming occasions",
      "<b class='text-white'>Gift ideas</b> that reflect their tastes, interests, and the little details",
      "<b class='text-white'>Helps you decide</b> with confidence, without second-guessing",
    ],
    image: "/img/feature-card-img-4.png",
  },
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

const imageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.95,
  }),
  center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.95,
  }),
};

const STORY_DURATION = 8000;

const SECTION_HASH_TO_INDEX: Record<string, number> = {
  "stay-thoughtful": 0,
  "say-it-better": 1,
  "plan-with-ease": 2,
  "gift-thoughtfully": 3,
};

export const AboutHeroMobile = () => {
  const [[activeTab, direction], setActiveTab] = useState([0, 0]);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const tabIndex = hash ? SECTION_HASH_TO_INDEX[hash] : undefined;
      if (tabIndex !== undefined && tabIndex !== activeTab) {
        setActiveTab([tabIndex, tabIndex > activeTab ? 1 : -1]);
        setProgress(0);
        startTimeRef.current = Date.now();
      }
      if (hash) window.scrollTo(0, 0);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);
  const [isPaused, setIsPaused] = useState(false);

  const changeTab = (newTab: number, forceDirection?: number) => {
    let finalTab = newTab;
    if (newTab >= content.length) finalTab = 0;
    if (newTab < 0) finalTab = content.length - 1;

    const newDirection = forceDirection ?? (finalTab > activeTab ? 1 : -1);
    setActiveTab([finalTab, newDirection]);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  const nextTab = () => changeTab(activeTab + 1, 1);
  const prevTab = () => changeTab(activeTab - 1, -1);

  useEffect(() => {
    if (isPaused) return;

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        nextTab();
      } else {
        timerRef.current = requestAnimationFrame(updateProgress) as any;
      }
    };

    timerRef.current = requestAnimationFrame(updateProgress) as any;
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current as any);
    };
  }, [activeTab, isPaused]);

  const tapStartPos = useRef(0);

  return (
    <div
      className="max-md:flex flex-col w-full bg-[#010302] text-white relative h-dvh justify-between overflow-hidden px-6 pt-16 select-none md:hidden"
      onPointerDown={() => setIsPaused(true)}
      onPointerUp={() => setIsPaused(false)}
      onPointerLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={bgImages[activeTab]}
              alt="Background"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <StarsBackground />

      {/* Progress bar - z-20 to stay below navbar menu */}
      <div className="absolute top-22 left-4 right-4 z-20 flex gap-2">
        {content.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-1 my-auto bg-white/20 rounded-full overflow-hidden ${index === activeTab ? "bg-white h-1.5" : ""}`}
          >
            <motion.div
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{
                width:
                  index === activeTab
                    ? `${progress}%`
                    : index < activeTab
                      ? "100%"
                      : "0%",
              }}
              transition={{ duration: index === activeTab ? 0 : 0.3 }}
            />
          </div>
        ))}
      </div>

      <div className="w-full mx-auto flex-grow flex flex-col justify-start z-10 pt-14 overflow-y-auto scrollbar-hide">
        <motion.div
          className="flex flex-col items-start gap-8 w-full h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(_, info) => {
            const threshold = 50;
            const velocityThreshold = 500;
            if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
              prevTab();
            } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
              nextTab();
            }
          }}
          onTapStart={(_, info) => {
            tapStartPos.current = info.point.x;
          }}
          onTap={(_, info) => {
            // If the user moved more than 10px, it was likely a swipe, not a tap
            const distance = Math.abs(info.point.x - tapStartPos.current);
            if (distance > 10) return;

            const screenWidth = window.innerWidth;
            // Use the start position to determine the intent of the tap
            if (tapStartPos.current < screenWidth / 3) {
              prevTab();
            } else {
              nextTab();
            }
          }}
        >
          <div className="w-full flex flex-col gap-4 items-start text-left relative min-h-[45dvh] z-20">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full absolute top-0"
              >
                <div className="pr-4">
                  <h1 className="text-2xl md:text-4xl font-bold mb-3 leading-tight text-white drop-shadow-lg">
                    {content[activeTab].title}
                    <br />
                    <span 
                      className="bg-clip-text text-transparent"
                      style={{ 
                        backgroundImage: `linear-gradient(90deg, ${content[activeTab].gradientStartColor} 0%, #FFFFFF 100%)`
                      }}
                    >
                      {content[activeTab].subtitle}
                    </span>
                  </h1>
                  <p className="text-base text-white/80 mb-4 font-medium max-w-lg">
                    {content[activeTab].subheadline}
                  </p>

                  <ul className="flex flex-col gap-3">
                    {content[activeTab].list.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-2.5 items-start text-base text-white"
                      >
                        <span className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-md">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M10 3L4.5 8.5L2 6"
                              stroke="black"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span
                          className="leading-snug"
                          dangerouslySetInnerHTML={{
                            __html: item,
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full flex justify-center items-center relative h-[35dvh] z-0 pointer-events-none">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative w-full h-full max-w-[280px]"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={content[activeTab].image}
                    alt="Illustration"
                    fill
                    className="object-contain"
                    priority
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
