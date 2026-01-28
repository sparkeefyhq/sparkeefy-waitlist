import React from "react";
import { motion } from "framer-motion";
import { AnimatedHeartPetalsMobile } from "./AnimatedHeartPetalsMobile";

export const FeatureHeaderMbile = ({
  activeColor = "#FF148A",
}: {
  activeColor?: string;
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center relative mb-8 md:mb-14 select-none">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-[2.125rem] md:text-[4.25rem] font-bold text-gray-900 tracking-[-0.01em] leading-tight"
      >
        Where{" "}
        <span className="relative inline-block">
          <motion.span
            className="font-retro font-normal tracking-normal bg-clip-text text-transparent inline-block py-0 md:py-4 -my-2 relative z-0"
            style={{
              backgroundImage: `linear-gradient(20deg, ${activeColor} 50%, #111827 50%)`,
              backgroundSize: "250% 100%",
            }}
            initial={{ backgroundPosition: "100% 0" }}
            whileInView={{ backgroundPosition: "0% 0" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            viewport={{ once: true }}
          >
            Caring
          </motion.span>

          {/* Mobile heart petals - positioned near "Caring" text */}
          <AnimatedHeartPetalsMobile color={activeColor} />
        </span>
        <br className="md:hidden" /> gets{" "}
        <span className="relative inline-block leading-none md:leading-tight">
          easier
          {/* Animated underline */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="243"
            height="21"
            viewBox="0 0 243 21"
            fill="none"
            className="absolute -bottom-3 md:-bottom-5 left-2 md:left-4 w-[105%] h-auto"
            style={{ transform: "translateX(-5%)" }}
          >
            <motion.path
              d="M2.52212 9.64571C32.4837 6.47626 121.879 0.710449 239.767 3.00323"
              stroke={activeColor}
              strokeWidth="5"
              strokeLinecap="round"
              style={{ transition: "stroke 0.5s ease" }}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
            />
            <motion.path
              d="M48.2422 18.4496C64.0104 16.5154 111.103 13.0279 173.325 14.5523"
              stroke={activeColor}
              strokeWidth="5"
              strokeLinecap="round"
              style={{ transition: "stroke 0.5s ease" }}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
              viewport={{ once: true }}
            />
          </svg>
        </span>
      </motion.h2>
    </div>
  );
};
