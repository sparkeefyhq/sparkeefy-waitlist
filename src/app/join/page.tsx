"use client";

import { Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { waitlistContent } from "@/lib/config/waitlist.config";
import EmailForm from "@/components/waitlist/EmailForm";
import WaitlistLayout from "@/components/waitlist/WaitlistLayout";

export default function JoinPage() {

  const animatedUnderline = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 334.94 15.5194"
      fill="none"
    >
      <motion.path
        d="M1.07769 4.48688C43.5217 2.77952 169.5 0.686176 333.863 5.97152"
        stroke="#FFCCE5"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      />
      <motion.path
        d="M66.9908 11.8718C97.9341 10.6617 189.778 9.19436 309.602 13.0061"
        stroke="#FFCCE5"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
      />
    </svg>
  );

  /* ===== Desktop card content ===== */
  const desktopContent = (
    <>
      {/* Badge */}
      <div
        className="absolute left-1/2 -translate-x-1/2 inline-flex items-center justify-center gap-[5px] bg-[rgba(255,255,255,0.1)] rounded-[66.875px] overflow-clip"
        style={{ top: 70, width: 254, height: 39 }}
      >
        <Image src="/logo-heart.png" alt="" width={21} height={21} className="shrink-0" />
        <p className="text-[16px] text-[rgba(255,255,255,0.85)] tracking-[0.16px] leading-normal whitespace-nowrap font-medium">
          <span className="font-retro font-normal">{waitlistContent.badge.brandRetro}</span>
          <span>{waitlistContent.badge.suffix}</span>
        </p>
      </div>

      {/* Main content */}
      <div
        className="absolute flex flex-col gap-[40px] items-center text-center"
        style={{ left: 388, top: 149, width: 605 }}
      >
        {/* Heading group */}
        <div className="flex flex-col gap-[26px] items-center w-full">
          {/* Heading */}
          <div className="relative w-full">
            <p className="font-bold text-white text-[68px] tracking-[-1.36px] text-center leading-[1.15] w-full whitespace-pre-wrap">
              <span>{waitlistContent.heading.prefix}</span>
              <span className="font-retro font-normal tracking-normal text-[#ffcce5]">
                {waitlistContent.heading.highlight}
              </span>
              <span>{waitlistContent.heading.suffix}</span>
            </p>

            {/* Animated underline */}
            <div
              className="absolute pointer-events-none"
              style={{ left: 136.15, bottom: -14, width: 332.86, height: 15.52 }}
            >
              {animatedUnderline}
            </div>
          </div>

          {/* Subheading */}
          <p className="text-[20px] text-[rgba(255,255,255,0.8)] leading-normal text-center w-full">
            <span>{waitlistContent.subheading.text}</span>
            <span className="font-bold">{waitlistContent.subheading.boldText}</span>
          </p>
        </div>

        {/* Form section */}
        <div className="flex flex-col gap-[21px] items-center w-full">
          <div className="flex flex-col gap-[8px] items-center text-center">
            <p
              className="font-bold text-[30px] bg-gradient-to-r from-white to-[#e0e0e0] bg-clip-text leading-normal"
              style={{ WebkitTextFillColor: "transparent", width: 362 }}
            >
              {waitlistContent.form.title}
            </p>
            <p className="text-[20px] text-[rgba(255,255,255,0.8)] leading-normal text-center whitespace-nowrap">
              {waitlistContent.form.description}
            </p>
          </div>
          <div className="w-full">
            <Suspense fallback={<div className="h-[52px] rounded-full bg-white/10 animate-pulse" />}>
              <EmailForm />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );

  /* ===== Mobile card content ===== */
  const mobileContent = (
    <>
      {/* Badge */}
      <div className="inline-flex items-center justify-center gap-[5px] bg-white/10 rounded-full h-[39px] px-5">
        <Image src="/logo-heart.png" alt="" width={21} height={21} className="shrink-0" />
        <p className="text-sm text-white/85 tracking-[0.16px] leading-normal whitespace-nowrap">
          <span className="font-retro">{waitlistContent.badge.brandRetro}</span>
          <span className="font-medium">{waitlistContent.badge.suffix}</span>
        </p>
      </div>

      {/* Heading + Subheading */}
      <div className="flex flex-col items-center mt-5 gap-6">
        <div className="relative text-center">
          <h1 className="text-[28px] font-bold text-white leading-normal tracking-[-0.56px]">
            {waitlistContent.heading.prefix}
            <span className="font-retro font-normal tracking-normal text-[#ffcce5]">
              {waitlistContent.heading.highlight}
            </span>
            {waitlistContent.heading.suffix}
          </h1>
          {/* Animated underline */}
          <div className="absolute pointer-events-none left-1/2 -translate-x-1/2 -bottom-2 w-[50%] h-auto">
            {animatedUnderline}
          </div>
        </div>
        <p className="text-sm text-white/80 leading-normal">
          {waitlistContent.subheading.text}
          <span className="font-bold">{waitlistContent.subheading.boldText}</span>
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col items-center w-full mt-6 gap-4">
        <div className="flex flex-col gap-2 items-center text-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-[#e0e0e0] bg-clip-text text-transparent leading-normal">
            {waitlistContent.form.title}
          </h2>
          <p className="text-sm text-white/80 leading-normal">
            {waitlistContent.form.description}
          </p>
        </div>
        <div className="w-full">
          <Suspense fallback={<div className="h-[52px] rounded-full bg-white/10 animate-pulse" />}>
            <EmailForm />
          </Suspense>
        </div>
      </div>
    </>
  );

  return (
    <WaitlistLayout variant="join" mobileChildren={mobileContent}>
      {desktopContent}
    </WaitlistLayout>
  );
}
