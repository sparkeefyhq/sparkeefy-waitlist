"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import StarsBackground from "./StarsBackground";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollY } = useScroll();
  const yText = useTransform(scrollY, [0, 300], [0, -150]);
  // Less aggressive opacity fade on mobile, original on desktop
  const opacityText = useTransform(
    scrollY, 
    [0, 150, 300], 
    isMobile ? [1, 0.90, 0.85] : [1, 0.8, 0.6]
  );

  return (
    <>
      <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-[#010302] text-white">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-[0] w-full h-full pointer-events-none">
          <Image
            src="https://res.cloudinary.com/dz05pi2zg/image/upload/v1769472081/hero-bg_oknqje.png"
            alt="Hero Background"
            fill
            className="object-cover scale-[140%] -translate-y-16 -translate-x-46 md:block hidden"
            priority
          />
          <Image
            src="https://res.cloudinary.com/djqi5un1w/image/upload/v1769585052/hero-bg-mobile_hbscxi.png"
            alt="Hero Background Mobile"
            fill
            className="object-cover scale-[160%] -translate-y-1/4 md:hidden"
            priority
          />
        </div>

        {/* Stars */}
        <StarsBackground />

        {/* Content */}
        <motion.div 
          className="relative z-10 flex flex-col items-center text-center max-w-4xl px-4 lg:px-8 lg:mt-10 select-none"
          style={{ y: yText, opacity: opacityText }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6 md:mb-10"
          >
            <h1 className="text-4xl md:text-[4rem] text-white font-bold leading-tight">
              <span className="block text-4xl md:text-[4.25rem] md:mr-6 md:-mb-1.5">
                <span className="font-retro font-normal tracking-normal text-[2.375rem] md:text-7xl bg-[linear-gradient(90deg,_#FFF_8.15%,_#FFEAF4_44.13%,_#FFF_56.51%,_#FFD9EC_98.42%)] bg-clip-text text-transparent w-fit pt-1 md:pt-3 pb-1">
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
            className="text-sm md:text-xl bg-[linear-gradient(90deg,_#C8A3C0_0%,_#E8B8E2_50%,_#FFCECE_100%)] bg-clip-text text-transparent w-fit font-semibold md:font-bold mb-8 md:mb-12 drop-shadow-md leading-relaxed md:leading-tight"
          >
            <span className="text-white/95">
              Show up more thoughtfully for the people
              <br className="md:hidden" />
              {" "}who matter most.
            </span>
            <br />
            <span className="block mt-2 md:mt-0">
              Sparkeefy helps you remember the little things,
              <br className="hidden md:block" />
              {" "}find the right words, and{" "}
              act at the right time, without
              {" "}overthinking.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative group w-full md:w-fit max-w-64 md:max-w-full"
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
                className="relative z-20 rounded-full px-6 md:min-w-48 w-full py-5 md:py-6 text-sm md:text-base font-medium bg-[linear-gradient(90deg,_rgba(60,_11,_36,_0.90)_0%,_rgba(0,_0,_0,_0.90)_100%)] backdrop-filter backdrop-blur-[19.299999237060547px] text-white transition-all duration-300 border-0"
              >
                Get Early Access
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Hero;
