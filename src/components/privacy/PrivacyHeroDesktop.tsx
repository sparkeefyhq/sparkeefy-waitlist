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

const PrivacyHeroDesktop = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen lg:h-[300vh] w-full"
    >
      <div className="lg:sticky top-0 lg:h-screen w-full flex flex-col bg-[#010302] text-white px-6 lg:px-12 py-20 lg:py-0">
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
        <div className="relative z-10 w-full max-w-[70rem] mx-auto flex-grow flex flex-col justify-center h-full pt-2 pb-8 md:pt-20">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 w-full h-full relative">
            {/* Left Col: Fixed Heading + Scrolling Points */}
            <div className="w-full lg:min-w-[42rem] flex flex-col items-start text-left h-full relative lg:py-20">
              {/* Static Heading */}
              <h1 className="text-3xl sm:text-5xl font-bold leading-[1.15] z-20 mb-0">
                <span className="text-white">Your Privacy,</span> <br />
                <span
                  className="bg-[linear-gradient(90deg,_#FFC7E3_0%,_#E5C2D3_50%,_#D8B5C6_100%)] bg-clip-text text-transparent"
                  style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.6))" }}
                >
                  Handled With Care
                </span>
              </h1>

              {/* Scrolling Points Container */}
              <div
                className="w-full relative lg:h-[540px] lg:overflow-hidden"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
                }}
              >
                {/* Parallax List */}
                <motion.ul
                  style={{
                    y: useTransform(smoothProgress, [0, 1], [0, -440]),
                  }}
                  className="flex flex-col w-full"
                >
                  {privacyPoints.map((point, i) => (
                    <li
                      key={point.title}
                      className="flex gap-4 items-start group flex-shrink-0 pt-6 first:pt-8"
                    >
                      <span className="mt-1 flex-shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md shadow-pink-500/20 transition-transform duration-300">
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
                      <div className="flex flex-col gap-1">
                        <h3 className="text-white font-bold text-lg md:text-xl leading-tight">
                          {point.title}
                        </h3>
                        <p className="text-white/75 text-sm md:text-base leading-relaxed max-w-[28rem]">
                          {point.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="flex lg:justify-end items-center min-h-[320px] h-full relative z-10 lg:mt-20">
              <motion.div
                animate={{
                  y: [-10, 10],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                className="relative w-72 h-72 drop-shadow-2xl"
              >
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
                <div className="absolute inset-0 bg-[#FF0080]/30 blur-[100px] rounded-full -z-10" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyHeroDesktop;
