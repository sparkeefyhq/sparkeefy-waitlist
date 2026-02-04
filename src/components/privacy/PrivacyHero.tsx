"use client";

import React from "react";
import Image from "next/image";
import StarsBackground from "@/components/home/StarsBackground";
import { motion } from "framer-motion";

const PRIVACY_BG = "/img/about-hero-bg-1.png";

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
    title:"Security built in",
    description:
      " We use industry-standard protections to keep your data safe, both in transit and at rest.",
  },
  {
    title:"You’re always in control", 
    description:" You can view, update, or delete your information whenever you choose.",
  },
  {
    title:"No surprises",
    description:" We don’t quietly change how your data is handled behind your back.",
  },
];

const PrivacyHero = () => {
  const listRef = React.useRef<HTMLDivElement | null>(null);

  // Capture scroll inside the privacy list first, then fall back to page scroll at edges
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    const container = listRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const deltaY = event.deltaY;
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    // If we're not at the top/bottom, consume the wheel event and scroll the list only
    if ((deltaY < 0 && !isAtTop) || (deltaY > 0 && !isAtBottom)) {
      event.preventDefault();
      container.scrollTop += deltaY;
    }
    // Otherwise, let the event bubble so the page can scroll
  };

  return (
    <div
      className="w-full bg-[#010302] text-white relative min-h-dvh flex flex-col overflow-hidden px-6 lg:px-12"
      onWheel={handleWheel}
    >
      {/* Background - hero-bg-1 (magenta gradient) */}
      <div className="absolute inset-0 z-[1] pointer-events-none min-h-full">
        <div
          className="absolute inset-0 w-full h-full min-h-full bg-no-repeat"
          style={{
            backgroundImage: `url(${PRIVACY_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "left top",
          }}
        />
        {/* Smooth gradient overlay: blends image into dark base (like /about) */}
        <div
          className="absolute inset-0 w-full h-full min-h-full"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(1, 3, 2, 0.3) 40%, rgba(1, 3, 2, 0.85) 75%, #010302 100%)",
          }}
        />
      </div>

      <StarsBackground />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[70rem] mx-auto flex-grow flex flex-col justify-center min-h-[calc(100vh-80px)] pb-0 md:pb-16 pt-20 md:pt-28">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 w-full">
          {/* Left: Text */}
          <div className="lg:min-w-[40rem] flex flex-col gap-4 md:gap-6 items-start text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-3xl sm:text-5xl font-bold mb-3 leading-[1.15] bg-[linear-gradient(90deg,_#FFFFFF_0%,_#FFD9EC_30%,_#FFFFFF_50%,_#FFE8F4_80%,_#FFFFFF_100%)] bg-clip-text text-transparent [filter:drop-shadow(0_2px_10px_rgba(0,0,0,0.6))]"
            >
              Your Privacy, <br/>  Handled With Care
            </motion.h1>

            <div
              ref={listRef}
              className="w-full "
            >
              <ul className="flex flex-col gap-4 md:gap-5">
                {privacyPoints.map((point, i) => (
                  <motion.li
                    key={point.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.1 * (i + 1),
                      ease: "easeOut",
                    }}
                    className="flex gap-3 md:gap-4 items-start text-lg text-white"
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
                    <span className="leading-snug">
                      <strong className="text-white">{point.title}</strong>
                      {" - "}
                      {point.description}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Padlock image */}
          <div className="relative flex justify-center lg:justify-end items-center w-full lg:min-w-[320px] h-48 md:h-64 lg:h-72">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="relative w-full h-full drop-shadow-lg"
            >
              <Image
                src="/img/lock.png"
                alt=""
                fill
                className="object-contain object-center"
                priority
                aria-hidden
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyHero;
