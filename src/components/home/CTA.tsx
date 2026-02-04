"use client";

import React from "react";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <section className="w-full bg-[#010302] pt-8 md:pt-12 pb-14 md:pb-20 px-4 lg:px-8 -my-1">
      <div className="w-full max-w-[69rem] mx-auto">
        <div className="relative bg-[#8217C3] rounded-2xl md:rounded-xl py-6 md:py-9 px-6 md:px-12 overflow-hidden flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-16">
          {/* Text - top on mobile, left on desktop */}
          <div className="relative z-10 max-w-sm text-start order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
              Start showing up better
            </h2>
            <p className="text-white/80 text-sm md:text-base font-medium leading-normal">
              Remember the little things, say the right words, and turn
              intention into action - without trying harder.
            </p>
          </div>

          {/* Heart/arrow graphic - hidden on mobile */}
          <div className="hidden lg:block absolute lg:top-1/2 lg:left-3/5 lg:-translate-x-1/2 lg:-translate-y-1/2 [&_svg]:w-[85%] h-auto pointer-events-none z-0">
            <svg
              width="594"
              height="203"
              viewBox="0 0 594 203"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_1_119)">
                <motion.path
                  d="M4.92894 74.5563C35.2622 74.5649 54.6775 67.0253 98.0535 72.8467C145.557 81.6465 155.236 98.426 182.31 118.291C209.384 138.155 236.406 159.102 263.281 165.512C290.156 171.923 316.884 163.798 337.06 153.088C357.236 142.379 370.859 129.085 381.246 113.809C391.634 98.534 398.785 81.2777 397.84 67.4085C396.895 53.5394 387.854 43.0577 378.62 42.2257C369.387 41.3939 359.96 50.2121 353.413 57.4571C346.865 64.7021 343.197 70.3738 341.373 73.2598C339.55 76.1459 339.571 76.2459 339.584 76.2395C339.596 76.2332 339.6 76.1207 338.038 72.1492C336.476 68.1778 333.349 60.3475 329.017 54.0423C324.686 47.7369 319.149 42.9565 314.521 40.3754C309.894 37.7945 306.177 37.4128 301.465 38.8899C296.753 40.367 291.048 43.7025 287.34 50.2944C283.633 56.8863 281.924 66.7346 282.86 76.7282C283.797 86.7218 287.378 96.8607 294.496 108.298C301.615 119.736 312.271 132.472 324.37 142.898C336.47 153.324 350.014 161.439 363.36 167.157C376.706 172.875 389.853 176.195 404.974 178.035C420.095 179.876 437.19 180.236 452.915 179.482C468.64 178.727 482.996 176.858 498.977 170.487C514.957 164.115 532.564 153.243 550.17 142.37"
                  stroke="#FEFEFE"
                  strokeWidth="6.8727"
                  strokeMiterlimit="2.61313"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  viewport={{ once: true }}
                />
                <motion.path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M548.406 141.912C548.003 141.227 547.137 140.735 544.198 139.614C541.258 138.492 536.245 136.741 533.127 136.1C530.01 135.459 528.789 135.927 537.435 133.455C546.081 130.983 564.594 125.571 573.647 122.983C582.7 120.395 582.291 120.63 576.339 127.966C570.386 135.302 558.889 149.739 553.141 156.957C547.392 164.175 547.392 164.175 547.609 160.871C547.826 157.567 548.261 150.959 548.507 147.217C548.753 143.474 548.81 142.597 548.406 141.912Z"
                  stroke="#FEFEFE"
                  strokeWidth="6.8727"
                  strokeMiterlimit="2.61313"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeInOut", delay: 2 }}
                  viewport={{ once: true }}
                />
              </g>
              <defs>
                <clipPath id="clip0_1_119">
                  <rect width="581.984" height="150.978" fill="white" transform="translate(13.5429) rotate(5.14642)"/>
                </clipPath>
              </defs>
            </svg>
          </div>

          {/* Button - below text on mobile, right on desktop */}
          <div className="relative z-10 flex-shrink-0 order-2 w-full md:w-auto">
            <motion.button
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              variants={{
                initial: { scale: 1 },
                hover: { scale: 1.05 },
                tap: { scale: 0.95 }
              }}
              onClick={() => window.open("/join")}
              className="w-full md:w-auto bg-white text-black text-lg font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
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
                variants={{
                  initial: { x: 0 },
                  hover: { x: 5 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
