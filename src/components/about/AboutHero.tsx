"use client";
import React, { useState } from "react";
import Image from "next/image";
import StarsBackground from "@/components/home/StarsBackground";
import { motion, AnimatePresence } from "framer-motion";

const bgImages = [
  "/img/about-hero-bg-1.png",
  "/img/about-hero-bg-2.png", 
  "/img/about-hero-bg-3.png", 
  "/img/about-hero-bg-4.png", 
];

const tabs = [
  {
    id: 0,
    title: (
      <>
        Remember what
        <br /> matters,
        <strong>{" "}effortlessly</strong>
      </>
    ),
    color: "#00C4CC", // Cyan
  },
  {
    id: 1,
    title: (
      <>
        Know what to say,
        <br /> when it matters
      </>
    ),
    color: "#DE0371", // Pink
  },
  {
    id: 2,
    title: (
      <>
        Dates that don&apos;t
        <br /> feel generic
      </>
    ),
    color: "#955BF0", // Purple
  },
  {
    id: 3,
    title: (
      <>
        Give gifts that
        <br /> feel personal
      </>
    ),
    color: "#F7C96B", // Orange
  },
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
  enter: (direction: number) => {
    return {
      y: direction >= 0 ? "100%" : "-100%",
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    y: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      y: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    };
  },
};

const imageVariants = {
  enter: (direction: number) => {
    return {
      y: direction >= 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.95,
    };
  },
  center: {
    zIndex: 1,
    y: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      y: direction < 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.95,
    };
  },
};

const AboutHero = () => {
  const [[activeTab, direction], setActiveTab] = useState([0, 0]);

  const changeTab = (newTab: number) => {
    if (newTab === activeTab) return;
    const newDirection = newTab > activeTab ? 1 : -1;
    setActiveTab([newTab, newDirection]);
  };

  return (
    <div className="w-full bg-[#010302] text-white relative h-screen flex flex-col justify-between overflow-hidden px-6 lg:px-12">
      {/* Background Images with Crossfade */}
      <div 
        className="absolute top-[48%] -left-[29%] right-0 h-full -translate-y-1/2 z-0 pointer-events-none"
        
      >
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
               className="object-contain" 
               priority
             />
           </motion.div>
        </AnimatePresence>
        
        {/* Gradient Overlay for Readability */}
        {/* <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" /> */}
      </div>

      {/* Stars Overlay */}
      <StarsBackground />

      {/* Main Content Area - Centered vertically in the available space */}
      <div className="w-full max-w-[70rem] mx-auto flex-grow flex flex-col justify-center z-10 h-full ">
        {/* Adjusted padding/height to account for navbar and tabs */}
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-16 w-full h-full">
          {/* Left Side: Text */}
          <div className="lg:min-w-[40rem] flex flex-col gap-6 items-start text-left justify-center overflow-hidden h-full max-h-[60vh] relative">
            {/* Note: overflow-hidden on container helps mask the entering/exiting elements if they go out of bounds */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full absolute inset-0 flex flex-col justify-center"
              >
                <div>
                  <h1 className="text-5xl font-bold mb-3 leading-[1.15] text-white">
                    {content[activeTab].headline}
                  </h1>
                  <p className="text-xl lg:text-2xl text-white/70 mb-5 font-normal leading-relaxed">
                    {content[activeTab].subheadline}
                  </p>

                  <ul className="flex flex-col gap-5">
                    {content[activeTab].list.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-4 items-start text-lg text-white"
                      >
                        <span className="mt-1 flex-shrink-0 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm [&_svg]:size-3">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
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
                            __html: item.replace(
                              /(saved in one private place|only when they matter)/g,
                              '<b class="text-white">$1</b>',
                            ),
                          }}
                        ></span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Side: Illustration */}
          <div className="flex justify-center lg:justify-end items-center relative h-[40vh] lg:h-[60vh] w-full overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="relative w-full h-full max-w-[500px] max-h-[500px] inset-0 mx-auto lg:mr-0"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 5,
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
        </div>
      </div>

      {/* Tabs Navigation - Anchored to bottom */}
      <div className="w-full max-w-[70rem] mx-auto z-20 bg-black/50 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row w-full gap-3.5">
          {tabs.map((tab, index) => {
            const isActive = activeTab === index;
            return (
              <motion.div
                key={tab.id}
                onClick={() => changeTab(index)}
                className="relative flex-1 cursor-pointer h-24 lg:h-[7.375rem] group overflow-hidden transition-all duration-300"
                initial="idle"
                animate={isActive ? "active" : "idle"}
                whileHover="active"
              >
                {/* Border Top Line (Colored) - Always visible initially */}
                <div
                  className="absolute top-0 left-0 w-full h-1 z-20"
                  style={{ backgroundColor: tab.color }}
                />

                {/* Animated Background Fill */}
                <motion.div
                  className="absolute top-0 left-0 w-full bg-current z-0"
                  variants={{
                    idle: { height: "0%" },
                    active: { height: "100%" }
                  }}
                  style={{ backgroundColor: tab.color }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                />

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 text-center">
                  <span
                    className={`text-xl lg:text-2xl leading-tight transition-colors duration-300 font-medium  ${isActive ? "text-black" : "text-white group-hover:text-black"}`}
                  >
                    {tab.title}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AboutHero;
