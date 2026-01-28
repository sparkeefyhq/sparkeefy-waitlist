"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "Is Sparkeefy only for romantic relationships?",
    answer: (
      <>
        No. Sparkeefy works for anyone you care about-partners, friends, and
        family.
        <br /> Anywhere remembering and showing up matters, Sparkeefy fits.
      </>
    ),
  },
  {
    question: "Is my data safe?",
    answer: (
      <>
        Yes. Your data is private by default and never shared.
        <br /> Sparkeefy is built to support your relationships-not monitor or
        monetize them.
      </>
    ),
  },
  {
    question: "How does Sparkeefy actually work?",
    answer: (
      <>
        Sparkeefy helps you keep track of important moments and preferences-so
        you don&apos;t have to rely on memory alone. When helpful, it offers
        gentle suggestions for replies or plans. You&apos;re always in control.
      </>
    ),
  },
  {
    question: "How does early access work?",
    answer: (
      <>
        Join the waitlist to get early access as we roll out features in stages.
        <br /> Early users get priority access, special perks, and a chance to
        help shape Sparkeefy.
      </>
    ),
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative w-full bg-[#010302] select-none py-1 md:py-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-12 max-w-[69rem] mx-auto">
          {/* Left Side - Title */}
          <div className="text-center md:text-start mb-6 md:mb-0">
            <h2 className="text-4xl md:text-[2.375rem] font-semibold md:font-bold text-white leading-tight relative inline-block">
              <span className="text-[#BDF7F9]">F</span>requently <br />
              <span className="text-[#BDF7F9]">A</span>sked <br />
              <span className="text-[#BDF7F9]">Q</span>uestions
              {/* Underline/Sparkle SVG - User provided */}
              <svg
                className="absolute md:-bottom-19  w-[100%] h-auto pointer-events-none"
                viewBox="0 0 245 103"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_256_948)">
                  <motion.path
                    d="M1.74219 18.0559C34.8022 17.0118 225.59 14.5756 240.967 18.0559C260.188 22.4063 52.7875 28.3795 42.4082 31.5117C34.1047 34.0175 211.414 34.8157 221.408 35.5117C231.404 36.2078 138.371 39.5672 139.908 63.5117"
                    stroke="url(#paint0_linear_256_948)"
                    strokeWidth="2.88005"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_256_948"
                    x1="6.06382"
                    y1="10.9466"
                    x2="108.938"
                    y2="78.0013"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#81F5FA" />
                    <stop offset="1" stopColor="#BEF3F5" />
                  </linearGradient>
                  <clipPath id="clip0_256_948">
                    <rect width="245" height="103" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </h2>
          </div>
          {/* Right Side - Accordion */}
          <div className="lg:w-[48rem] flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[rgba(26,25,25,0.60)] rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/20 transition-all duration-300"
                onClick={() => toggleFAQ(index)}
              >
                <div className="p-5 md:p-6 py-5 flex justify-between items-center bg-[rgba(26,25,25,0.60)] z-10 relative">
                  <h3 className="text-xl md:text-[1.375rem] font-medium md:font-semibold text-white pr-4">
                    {faq.question}
                  </h3>
                  {/* Icon Wrapper */}
                  <div className="flex-shrink-0 [&_svg]:!size-5">
                    <motion.div
                      animate={{ rotate: openIndex === index ? -45 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M11.5701 1.44629L11.5701 21.7007M21.7007 11.5701L1.44629 11.5701"
                          stroke="white"
                          strokeWidth="2.89348"
                          strokeLinecap="round"
                        />
                      </svg>
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-4 md:px-6 pb-6 text-white/80 text-base md:text-lg leading-tight bg-[rgba(26,25,25,0.60)]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
