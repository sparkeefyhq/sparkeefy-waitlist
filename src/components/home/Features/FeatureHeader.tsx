import React from "react";
import { motion } from "framer-motion";
import { AnimatedHeartPetals } from "./AnimatedHeartPetals";

export const FeatureHeader = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center relative mb-14">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-6xl md:text-[4.25rem] font-bold text-gray-900 tracking-[-0.01em]"
      >
        Where{" "}
        <span className="font-retro text-[#FF148A] font-normal tracking-normal">Caring</span>
        {" "}gets{" "}
        <span className="relative inline-block">
          easier
          {/* Animated underline */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="243" 
            height="21" 
            viewBox="0 0 243 21" 
            fill="none"
            className="absolute -bottom-5 left-4 w-[105%] h-auto"
            style={{ transform: "translateX(-5%)" }}
          >
            <motion.path 
              d="M2.52212 9.64571C32.4837 6.47626 121.879 0.710449 239.767 3.00323" 
              stroke="#FF148A" 
              strokeWidth="5" 
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
            />
            <motion.path 
              d="M48.2422 18.4496C64.0104 16.5154 111.103 13.0279 173.325 14.5523" 
              stroke="#FF148A" 
              strokeWidth="5" 
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
              viewport={{ once: true }}
            />
          </svg>
        </span>
      </motion.h2>
      
      {/* Animated heart petals */}
      <AnimatedHeartPetals />
    </div>
  );
};
