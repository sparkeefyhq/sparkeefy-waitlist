"use client";

import React from "react";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <section className="w-full bg-[#010302] py-20 px-4 lg:px-8">
      <div className="w-full max-w-[69rem] mx-auto">
        <div className="relative  bg-[#8217C3] rounded-xl py-9 px-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
          {/* Left Side - Text */}
          <div className="relative z-10 max-w-sm">
            <h2 className="text-4xl font-bold text-white mb-2 leading-tight">
              Start showing up better
            </h2>
            <p className="text-white/80 text-base font-medium leading-normal">
              Remember the little things, say the right words, and turn
              intention into action - without trying harder.
            </p>
          </div>

          <div className="absolute top-1/2 left-3/5 -translate-x-1/2 -translate-y-1/2 [&_svg]:w-[80%] h-auto pointer-events-none z-0">
            <svg
              width="430"
              height="106"
              viewBox="0 0 430 106"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M2.5 103.5C31.5945 79.8522 165.748 53.4643 213.014 53.4643C226.259 53.4643 280.365 53.8634 280.365 71.0642C280.365 79.3025 269.005 77.8386 263.013 75.2602C251.218 70.1847 242.428 65.3065 234.189 56.3782C221.473 42.5969 207.493 20.3546 226.159 6.02611C234.215 -0.157789 249.629 3.35967 257.134 7.89101C264.492 12.3337 269.388 18.0351 274.915 23.8591C279.408 28.5927 278.202 28.1123 281.655 22.8102C286.098 1.11415 314.299 -8.40971 322.668 20.9452C325.338 32.6109 311.965 48.6448 307.566 59.3699C305.914 63.3986 303.353 70.4018 299.823 73.5897C295.979 77.0606 293.897 71.5258 295.234 68.5778C298.556 61.2487 303.042 58.0878 312.729 58.0878C321.489 58.0878 402.051 59.5839 402.604 67.6841C402.911 72.1782 391.953 70.385 393.832 66.9905C395.29 64.3569 402.604 44.6573 402.604 47.5451C402.604 48.5626 428.68 67.9939 427.458 68.5778C423.111 70.6566 402.392 80.8075 397.731 82.0705"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                viewport={{ once: true }}
              />
            </svg>
          </div>

          {/* Right Side - Button */}
          <div className="relative z-10 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-black text-lg font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              Get Early Access
              <motion.svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </motion.svg>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
