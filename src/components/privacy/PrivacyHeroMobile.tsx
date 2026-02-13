"use client";

import React from "react";
import Image from "next/image";
import StarsBackground from "@/components/home/StarsBackground";
import { motion } from "framer-motion";

const PRIVACY_BG = "/img/about-hero-bg-2.png";

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
    title: "Security built in",
    description:
      " We use industry-standard protections to keep your data safe, both in transit and at rest.",
  },
  {
    title: "You’re always in control",
    description:
      " You can view, update, or delete your information whenever you choose.",
  },
  {
    title: "No surprises",
    description:
      " We don’t quietly change how your data is handled behind your back.",
  },
];

const PrivacyHeroMobile = () => {
  return (
    <div className="relative min-h-screen w-full bg-[#010302] text-white overflow-hidden pb-12">
      {/* Background */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div
          className="absolute inset-0 w-full h-full bg-no-repeat"
          style={{
            backgroundImage: `url(${PRIVACY_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(1, 3, 2, 0.4) 30%, rgba(1, 3, 2, 0.9) 70%, #010302 100%)",
          }}
        />
      </div>

      <StarsBackground />

      {/* Content */}
      <div className="relative z-10 w-full px-6 pt-24 flex flex-col items-start">
        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold text-start mb-8">
          <span className="text-white">Your Privacy,</span> <br />
          <span
            className="bg-[linear-gradient(90deg,_#FFC7E3_0%,_#E5C2D3_50%,_#D8B5C6_100%)] bg-clip-text text-transparent"
            style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.6))" }}
          >
            Handled With Care
          </span>
        </h1>

        {/* Illustration */}
        <div className="relative h-56 mb-10 drop-shadow-2xl w-full">
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full relative"
          >
            <Image
              src="/img/lock.png"
              alt="Privacy Security"
              fill
              className="object-contain"
              priority
            />
            {/* Subtle glow behind the lock */}
            <div className="absolute inset-0 bg-[#FF0080]/20 blur-[60px] rounded-full -z-10" />
          </motion.div>
        </div>

        {/* Points List */}
        <ul className="flex flex-col w-full gap-8 max-w-md">
          {privacyPoints.map((point) => (
            <li key={point.title} className="flex gap-4 items-start">
              <span className="mt-1 flex-shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md shadow-pink-500/20">
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
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-bold text-lg leading-tight">
                  {point.title}
                </h3>
                <p className="text-white/75 text-sm leading-relaxed">
                  {point.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PrivacyHeroMobile;
