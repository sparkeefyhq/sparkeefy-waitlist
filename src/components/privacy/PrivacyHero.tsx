"use client";

import React, { useRef } from "react";
import Image from "next/image";
import StarsBackground from "@/components/home/StarsBackground";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

const PRIVACY_BG = "/img/about-hero-bg-2.png";

const privacyPoints = [
  {
    title: "Minimal data, by design",
    description:
      "We collect only what's necessary to create and improve your Sparkeefy experience - nothing extra.",
  },
  {
    title: "Your data is never sold",
    description:
      "We don't sell, rent, or trade your personal information with advertisers or third parties.",
  },
  {
    title: "Private stays private",
    description:
      "Your personal entries, reminders, and relationship details aren't read or monitored for ads.",
  },
  {
    title: "Security built in",
    description:
      " We use industry-standard protections to keep your data safe, both in transit and at rest.",
  },
  {
    title: "You’re always in control",
    description:
      " You can view, update, or delete your information whenever you choose.",
  },
  {
    title: "No surprises",
    description:
      " We don’t quietly change how your data is handled behind your back.",
  },
];

const PrivacyHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={containerRef} className="relative h-[300vh] w-full">
      <div className="sticky top-0 h-screen w-full flex flex-col bg-[#010302] text-white px-6 lg:px-12">
        {/* Background */}
        <div className="absolute inset-0 z-[1] pointer-events-none min-h-full">
          <div
            className="absolute inset-0 w-full h-full min-h-full bg-no-repeat"
            style={{
              backgroundImage: `url(${PRIVACY_BG})`,
              backgroundSize: "cover",
              backgroundPosition: "left top",
            }}
          />
          <div
            className="absolute inset-0 w-full h-full min-h-full"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(1, 3, 2, 0.3) 40%, rgba(1, 3, 2, 0.85) 75%, #010302 100%)",
            }}
          />
        </div>

        <StarsBackground />

        {/* Main Content Area */}
        <div className="relative z-10 w-full max-w-[70rem] mx-auto flex-grow flex flex-col justify-center h-full pt-16 pb-8 md:pt-24">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 w-full h-full relative">
            
            {/* Left Col: Fixed Heading + Scrolling Points */}
            <div className="lg:min-w-[42rem] flex flex-col items-start text-left h-full relative py-20">
              
              {/* Static Heading */}
              <h1 className="text-3xl sm:text-5xl font-bold leading-[1.15] bg-[linear-gradient(90deg,_#FFFFFF_0%,_#FFD9EC_30%,_#FFFFFF_50%,_#FFE8F4_80%,_#FFFFFF_100%)] bg-clip-text text-transparent [filter:drop-shadow(0_2px_10px_rgba(0,0,0,0.6))] z-20">
                Your Privacy, <br /> Handled With Care
              </h1>

              {/* Scrolling Points Container */}
              <div className="w-full relative h-[540px] overflow-hidden" 
                   style={{ 
                     maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
                     WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
                   }}>
                
                {/* Parallax List */}
                <motion.ul 
                  style={{ y: useTransform(smoothProgress, [0, 1], [0, -540]) }}
                  className="flex flex-col w-full"
                >
                  {privacyPoints.map((point, i) => (
                    <li
                      key={point.title}
                      className="flex gap-4 items-start group flex-shrink-0 pt-6"
                    >
                      <span className="mt-1 flex-shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-110 transition-transform duration-300">
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
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-white font-bold text-lg md:text-xl leading-tight">
                          {point.title}
                        </h3>
                        <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-[28rem]">
                          {point.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              </div>
            </div>

            {/* Right: Static Visual Illustration */}
            <div className="hidden lg:flex justify-end items-center min-w-[320px] h-full relative z-10">
              <div className="relative w-72 h-72 drop-shadow-2xl">
                 <div className="relative w-full h-full">
                  <Image
                    src="/img/lock.png"
                    alt="Privacy Security"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                
                {/* Subtle glow behind the lock */}
                <div className="absolute inset-0 bg-pink-500/10 blur-[100px] rounded-full -z-10" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyHero;
