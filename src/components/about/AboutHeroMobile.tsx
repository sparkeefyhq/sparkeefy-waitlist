"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import StarsBackground from "@/components/home/StarsBackground";
import { motion, AnimatePresence } from "framer-motion";

const bgImages = [
  "/img/about-hero-bg-mobile-1.png",
  "/img/about-hero-bg-2.png", 
  "/img/about-hero-bg-3.png", 
  "/img/about-hero-bg-4.png", 
];

const tabs = [
  { id: 0, color: "#00C4CC" },
  { id: 1, color: "#DE0371" },
  { id: 2, color: "#955BF0" },
  { id: 3, color: "#F7C96B" },
];

const content = [
  {
    id: 0,
    headline: "Remember what matters, effortlessly",
    subheadline: "So the people you care about feel genuinely cared for.",
    list: [
      "Important dates, preferences, and moments saved in one private place",
      "Designed to work quietly in the background, with notifications only when they matter.",
      "Gentle reminders help meaningful moments from slipping away.",
    ],
    image: "/img/about-1.png",
  },
  {
    id: 1,
    headline: "Know what to say, when it matters",
    subheadline: "Helping you find the right words.",
    list: [
      "Suggestions for messages that sound like you.",
      "Support for difficult conversations.",
      "Never miss a chance to reach out.",
    ],
    image: "/img/about-2.png",
  },
  {
    id: 2,
    headline: "Dates that don't feel generic",
    subheadline: "Plan moments that are truly special.",
    list: [
      "Tailored date ideas based on shared interests.",
      "Planning tools that take the stress out.",
      "Memories that last a lifetime.",
    ],
    image: "/img/about-3.png",
  },
  {
    id: 3,
    headline: "Give gifts that feel personal",
    subheadline: "Thoughtful gifting made simple.",
    list: [
      "Gift ideas inspired by past conversations.",
      "Reminders for key gifting occasions.",
      "Track what you've given to avoid repeats.",
    ],
    image: "/img/about-4.png",
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

export const AboutHeroMobile = () => {
  const [[activeTab, direction], setActiveTab] = useState([0, 0]);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
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

  return (
    <div 
      className="w-full bg-[#010302] text-white relative h-screen flex flex-col justify-between overflow-hidden px-6 pt-16 select-none touch-none md:hidden"
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

      <div className="absolute top-24 left-4 right-4 z-[60] flex gap-2">
        {content.map((_, index) => (
          <div key={index} className={`flex-1 h-1 my-auto bg-white/20 rounded-full overflow-hidden ${index === activeTab ? "bg-white h-1.5" : ""}`}>
            <motion.div 
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{ 
                width: index === activeTab ? `${progress}%` : (index < activeTab ? "100%" : "0%") 
              }}
              transition={{ duration: index === activeTab ? 0 : 0.3 }}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 z-50 flex">
        <div className="w-1/3 h-full" onClick={prevTab} />
        <div className="w-2/3 h-full" onClick={nextTab} />
      </div>

      <div className="w-full mx-auto flex-grow flex flex-col justify-start z-10 pt-16 overflow-y-auto scrollbar-hide">
        <motion.div 
          className="flex flex-col items-start gap-8 w-full h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 50) prevTab();
            else if (info.offset.x < -50) nextTab();
          }}
        >
          <div className="w-full flex flex-col gap-4 items-start text-left relative min-h-[45vh]">
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
                  <h1 className="text-4xl font-bold mb-4 leading-tight text-white drop-shadow-lg">
                  
                 {content[activeTab].headline}
                  </h1>
                  <p className="text-lg text-white/80 mb-6 font-medium leading-relaxed max-w-lg">
                    {content[activeTab].subheadline}
                  </p>

                  <ul className="flex flex-col gap-5">
                    {content[activeTab].list.map((item, i) => (
                      <li key={i} className="flex gap-4 items-start text-base text-white">
                        <span className="mt-0.5 flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                            <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span
                          className="leading-snug pt-0.5"
                          dangerouslySetInnerHTML={{
                            __html: item.replace(
                              /(saved in one private place|only when they matter|sinking in|slowing down|slipping away)/g,
                              '<b class="text-white font-bold">$1</b>',
                            ),
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full flex justify-center items-center relative h-[35vh]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative w-full h-full max-w-[320px]"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-full h-full"
                >
                  <Image src={content[activeTab].image} alt="Illustration" fill className="object-contain" priority />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
