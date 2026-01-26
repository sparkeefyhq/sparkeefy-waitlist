"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import StarsBackground from "./StarsBackground";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <>
      <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-[#010302] text-white">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-[0] w-full h-full pointer-events-none">
          <Image
            src="/img/hero-bg.png"
            alt="Hero Background"
            fill
            className="object-cover scale-[140%] -translate-y-16 -translate-x-46"
            priority
          />
        </div>

        {/* Stars */}
        <StarsBackground />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-4 lg:px-8  select-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-10"
          >
            <h1 className="text-6xl md:text-[4rem] text-white font-bold">
              <span className="block text-6xl md:text-[4.25rem]  md:mr-6 md:-mb-1.5">
                <span className="font-retro font-normal tracking-normal text-6xl md:text-7xl bg-[linear-gradient(90deg,_#FFF_8.15%,_#FFEAF4_44.13%,_#FFF_56.51%,_#FFD9EC_98.42%)] bg-clip-text pt-1 text-transparent w-fit">
                  Caring
                </span>{" "}
                <span className="bg-[linear-gradient(90deg,_#FFA7EF_0%,_#FFAEEF_50%,_#FBD7EA_100%)] bg-clip-text text-transparent w-fit">
                  shouldn&apos;t
                </span>
              </span>
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
            <div className="absolute inset-[-4px] bg-[#FF4AA5] rounded-full blur-[20px] opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none" />

            {/* Button with rotating border animation */}
            <div className="relative rounded-full overflow-hidden p-[2px] group-hover:scale-105 transition-all duration-300">
              {/* Rotating gradient using Framer Motion */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-[800px] h-[800px] pointer-events-none"
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
                className="relative z-20 rounded-full px-6 md:min-w-48 w-full py-6 text-base font-medium bg-[linear-gradient(90deg,_rgba(60,_11,_36,_0.90)_0%,_rgba(0,_0,_0,_0.90)_100%)] backdrop-filter backdrop-blur-[19.299999237060547px] text-white transition-all duration-300 border-0"
              >
                Get Early Access
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Hero;
