"use client";

import React from "react";
import { motion } from "framer-motion";
import StarsBackground from "./StarsBackground";
import Rays from "./Rays";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <>
      <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0008] text-white">
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0008] via-pink-950/30 to-[#0a0008] z-[1] pointer-events-none" />

        {/* Rays Animation */}
        <Rays className="z-[2]" />

        {/* Stars */}
        <StarsBackground />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-4 lg:px-8 lg:-mt-7">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-10"
          >
            <h1 className="text-6xl md:text-[4rem] text-white font-bold">
              <p className="text-6xl md:text-[4.25rem]  md:mr-6 md:-mb-1.5">
                <span className="font-retro font-normal tracking-normal text-6xl md:text-7xl bg-[linear-gradient(90deg,_#FFF_8.15%,_#FFEAF4_44.13%,_#FFF_56.51%,_#FFD9EC_98.42%)] bg-clip-text pt-1 text-transparent w-fit">
                  Caring
                </span>{" "}
                <span className="bg-[linear-gradient(90deg,_#FFA7EF_0%,_#FFAEEF_50%,_#FBD7EA_100%)] bg-clip-text text-transparent w-fit">
                  shouldn&apos;t
                </span>
              </p>
              feel this hard
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl bg-[linear-gradient(90deg,_#C8A3C0_0%,_#E8B8E2_50%,_#FFCECE_100%)] bg-clip-text text-transparent w-fit font-bold mb-12 drop-shadow-md leading-tight"
          >
            <span className="text-white/95">
              Show up more thoughtfully for the people who matter most.
            </span>
            <br className="hidden md:block" />
            Sparkeefy helps you remember the little things,
            <br className="hidden md:block" />
            find the right words, and act at the right time, without overthinking.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative group"
          >
            {/* Glow effect behind button - visible on hover */}
            <div className="absolute inset-[-4px] bg-[#FF4AA5] rounded-full blur-[20px] opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

            {/* Button with rotating border animation */}
            <div className="relative rounded-full overflow-hidden p-[2px] group-hover:scale-105 transition-all duration-300">
              {/* Rotating gradient using Framer Motion */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-[800px] h-[800px]"
                style={{
                  background:
                    "conic-gradient(from 180deg at 50% 50%, #120020 0deg, #F9007D 53.3deg, #EE499C 90.5deg, #FFF 126.2deg, #120020 178.8deg, #120020 360deg)",
                  x: "-50%",
                  y: "-50%",
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              {/* Button */}
              <Button
                size="lg"
                className="relative rounded-full px-6 md:min-w-48 w-full py-6 text-base font-medium bg-[linear-gradient(90deg,_rgba(60,_11,_36,_0.90)_0%,_rgba(0,_0,_0,_0.90)_100%)] backdrop-filter backdrop-blur-[19.299999237060547px] text-white transition-all duration-300 border-0"
              >
                Get Early Access
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Grid Section Below Hero */}
      <div className="relative w-full bg-[#0a0008] pb-56">
        {/* Grid content */}
        <div className="relative z-[5] w-full max-w-[70rem] mx-auto px-4 lg:px-8 -mt-16">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-6"
          >
            {/* Row 1 */}
            <div className="h-[18rem] rounded-[17.844px] bg-[linear-gradient(180deg,_rgba(255,_255,_255,_0.15)_0%,_rgba(129,_245,_250,_0.15)_100%)] [box-shadow:0_4px_4px_0_rgba(0,_0,_0,_0.25)]" />
            <div className="h-[18rem] rounded-[17.844px] bg-[linear-gradient(180deg,_rgba(255,_255,_255,_0.15)_0%,_rgba(129,_245,_250,_0.15)_100%)] [box-shadow:0_4px_4px_0_rgba(0,_0,_0,_0.25)]" />
            <div className="h-[18rem] rounded-[17.844px] bg-[#FF4AA5]" />
            {/* Row 2 */}
            <div className="h-[20rem] rounded-2xl bg-black border-8 border-[#FF0080]" />
            <div className="col-span-2 h-[20rem] rounded-2xl bg-[#252025] border border-pink-900/30" />
          </motion.div>
        </div>

        {/* Gradient Curved Bottom - Animated - sits at the edge before white section */}
        <div className="absolute bottom-0 left-0 right-0 h-36 z-20">
          <svg
            viewBox="0 0 1440 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%">
                  <animate
                    attributeName="stop-color"
                    values="#05B2B9;#F4B763;#FF0080;#05B2B9"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="50%">
                  <animate
                    attributeName="stop-color"
                    values="#F4B763;#FF0080;#05B2B9;#F4B763"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%">
                  <animate
                    attributeName="stop-color"
                    values="#FF0080;#05B2B9;#F4B763;#FF0080"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>
            </defs>
            {/* White fill below the curve to cover corners */}
            <path
              d="M0 10 Q720 160 1440 10 L1440 140 L0 140 Z"
              fill="white"
            />
            {/* Gradient stroke curve on top */}
            <path
              d="M0 10 Q720 160 1440 10"
              stroke="url(#curveGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </>
  );
};

export default Hero;
