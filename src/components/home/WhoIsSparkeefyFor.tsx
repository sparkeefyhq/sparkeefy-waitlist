"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const WhoIsSparkeefyFor = () => {
  return (
    <section className="relative w-full bg-[#010302] pt-8 pb-28 mt-32">
      {/* Top Curve - Sitting above the section to overlap previous white section */}
      <div className="absolute top-0 left-0 right-0 h-56 -translate-y-[95%] z-10 w-full overflow-hidden">
        <svg
          viewBox="0 0 1440 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="curveGradientTop"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%">
                <animate
                  attributeName="stop-color"
                  values="#00C9D2;#F4B763;#FF66B2;#00C9D2"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%">
                <animate
                  attributeName="stop-color"
                  values="#F4B763;#FF66B2;#00C9D2;#F4B763"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%">
                <animate
                  attributeName="stop-color"
                  values="#FF66B2;#00C9D2;#F4B763;#FF66B2"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>

          {/* Dark Hill Fill - Matches section background - Extended to prevent side gaps */}
          <path
            d="M-100 210 Q720 10 1540 210 L1540 220 L-100 220 Z"
            fill="#010302"
          />

          {/* Gradient Stroke on the Curve - Extended path */}
          <path
            d="M-100 210 Q720 10 1540 210"
            stroke="url(#curveGradientTop)"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-20">
        <div className="flex flex-col items-center justify-center text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20, backgroundPosition: "100% 0" }}
            whileInView={{ opacity: 1, y: 0, backgroundPosition: "0% 0" }}
            transition={{ 
              opacity: { duration: 0.6, ease: "easeOut" },
              y: { duration: 0.6, ease: "easeOut" },
              backgroundPosition: { duration: 2.0, ease: "easeInOut", delay: 0.2 } 
            }}
            viewport={{ once: true }}
            className="text-[2rem] font-bold leading-none tracking-tight bg-clip-text text-transparent"
             style={{ 
              backgroundImage: "linear-gradient(91deg, #FFF 4%, #FDE 25%, #FFF 48%, #FFFFFF 50%, #FFFFFF 100%)",
              backgroundSize: "200% 100%",
            }}
          >
            Every <span className="italic font-bold text-white">story</span> starts with a{" "}
            <span className="font-retro font-normal tracking-normal text-white">
              Spark
            </span>
          </motion.h2>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
            className="relative inline-block"
          >
            <p className="text-[2rem] font-medium text-white">
              Some sparks are{" "}
              <span className="relative inline-block">
                <span className="relative inline-block">
                  {/* Base Layer: White Text */}
                  <span className="text-white font-bold">never meant to fade.</span>
                  
                  {/* Overlay Layer: Smooth Gradient Fade In */}
                  <motion.span 
                    className="absolute top-0 left-0 w-full font-bold bg-clip-text text-transparent bg-[linear-gradient(90deg,_#FFC5E2_0%,_#FF43A2_100%)]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                    viewport={{ once: true }}
                    aria-hidden="true"
                  >
                    never meant to fade.
                  </motion.span>
                </span>

                {/* Animated Underlines */}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[100%] h-[20px] pointer-events-none">
                  {/* Line 1 - Top - Longer */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 372 9"
                    fill="none"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-auto"
                  >
                    <motion.path
                      d="M0.868862 7.80734C47.9294 5.40314 187.858 0.648734 371.089 0.864559"
                      stroke="#FF7EBF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        duration: 1,
                        ease: "easeInOut",
                        delay: 0.4,
                      }}
                      viewport={{ once: true }}
                    />
                  </svg>
                  {/* Line 2 - Bottom - Shorter and offset */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 272 7"
                    fill="none"
                    className="absolute top-1.5 left-[56%] -translate-x-1/2 w-[74%] h-auto"
                  >
                    <motion.path
                      d="M0.868938 5.88077C35.1808 4.15575 137.199 0.736689 270.776 0.860844"
                      stroke="#FF7EBF"
                      strokeOpacity="0.66"
                      strokeWidth="2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        duration: 1,
                        ease: "easeInOut",
                        delay: 0.6,
                      }}
                      viewport={{ once: true }}
                    />
                  </svg>
                </span>
              </span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section - Cards */}
      <div className="mt-20">
        <div className="text-center mb-7">
          <h2 className="text-[2.5rem] font-bold text-white mb-1.5">
            Who is Sparkeefy for?
          </h2>
          <p className="text-white/70 text-2xl font-medium">
            For the <span className="font-semibold">people</span> you care about
            and the relationships that matter most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[69rem] mx-auto">
          {/* Couples Card */}
          <motion.div 
            whileHover={{ y: -10, backgroundColor: "#222", boxShadow: "0 15px 40px -5px rgba(255, 255, 255, 0.15)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-[#1A1919] rounded-3xl px-6 py-8"
          >
            <div className="mb-3">
             <Image
                src="/img/couples.png"
                alt="Couples"
                width={100}
                height={100}
              />
            </div>
            <h3 className="text-[1.625rem] font-bold text-white mb-2">Couples</h3>
            <p className="text-lg text-[#D1D1D1] leading-snug font-normal -tracking-[0.01em]">
              For partners who want to stay thoughtful, connected, and
              intentional -{" "}
              <span className="font-bold">
                without turning care into effort.
              </span>
            </p>
          </motion.div>

          {/* Friends Card */}
          <motion.div 
            whileHover={{ y: -10, backgroundColor: "#222", boxShadow: "0 15px 40px -5px rgba(255, 255, 255, 0.15)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-[#1A1919] rounded-3xl px-6 py-8"
          >
            <div className="mb-3">
              <Image
                src="/img/friends.png"
                alt="Friends"
                width={100}
                height={100}
              />
            </div>
            <h3 className="text-[1.625rem] font-bold text-white mb-2">Friends</h3>
            <p className="text-lg text-[#D1D1D1] leading-snug font-normal -tracking-[0.01em]">
              For close friendships where remembering the little things and
              showing up still matters -{" "}
              <span className="font-bold">
                even when life gets busy.
              </span>
            </p>
          </motion.div>

          {/* Family Members Card */}
          <motion.div 
            whileHover={{ y: -10, backgroundColor: "#222", boxShadow: "0 15px 40px -5px rgba(255, 255, 255, 0.15)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-[#1A1919] rounded-3xl px-6 py-8"
          >
            <div className="mb-3">
             <Image
                src="/img/family-members.png"
                alt="Family Members"
                width={100}
                height={100}
              />
            </div>
            <h3 className="text-[1.625rem] font-bold text-white mb-2">
              Family Members
            </h3>
            <p className="text-lg text-[#D1D1D1] leading-snug font-normal -tracking-[0.01em]">
              For family relationships where important moments and thoughtful
              gestures help you stay close -{" "}
              <span className="font-semibold">
                no matter the distance.
              </span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhoIsSparkeefyFor;
