"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { waitlistContent, successContent } from "@/lib/config/waitlist.config";
import { getStatsByToken } from "@/app/actions";
import ReferralDisplay from "@/components/waitlist/ReferralDisplay";
import WaitlistLayout from "@/components/waitlist/WaitlistLayout";
import type { UserStatsResponse } from "@/lib/types";

const WAIT_SECONDS = 2.5;
const FADE_DURATION = 0.2;

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [readyToTransition, setReadyToTransition] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    if (!token || token.length !== 64) {
      router.replace("/join");
      return;
    }

    let active = true;
    const loadStats = async () => {
      const nextStats = await getStatsByToken(token);
      if (!active) return;

      if (!nextStats) {
        router.replace("/join");
        return;
      }

      setStats(nextStats);
    };

    void loadStats();
    return () => {
      active = false;
    };
  }, [router, token]);

  useEffect(() => {
    const waitTimer = setTimeout(() => {
      setReadyToTransition(true);
    }, WAIT_SECONDS * 1000);

    return () => clearTimeout(waitTimer);
  }, []);

  useEffect(() => {
    if (!readyToTransition || !stats || showReferral) return;

    setIsExiting(true);
    const transitionTimer = setTimeout(() => {
      setShowReferral(true);
      if (typeof window !== "undefined" && token) {
        window.history.replaceState({}, "", `/join/referral?token=${encodeURIComponent(token)}`);
      }
    }, FADE_DURATION * 1000);

    return () => clearTimeout(transitionTimer);
  }, [readyToTransition, showReferral, stats, token]);

  if (showReferral && stats && token) {
    return <ReferralDisplay stats={stats} token={token} />;
  }

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
        <Image src="/logo-heart.svg" alt="" width={21} height={21} className="shrink-0" />
        <p className="text-[16px] text-[rgba(255,255,255,0.85)] tracking-[0.16px] leading-normal whitespace-nowrap font-medium">
          <span className="font-retro font-normal">{waitlistContent.badge.brandRetro}</span>
          <span>{waitlistContent.badge.suffix}</span>
        </p>
      </div>

      {/* Main content — centered in card */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center not-italic"
        style={{ top: "calc(50% + 20px)", width: 606, height: 450 }}
      >
        {/* Congratulations — Figma: 80px Retro Vintage, top -26px */}
        <p
          className="absolute left-1/2 -translate-x-1/2 font-retro text-[80px] text-[#ffcce5] tracking-[-1.6px] leading-normal whitespace-nowrap"
          style={{ top: -26 }}
        >
          {successContent.congratulations}
        </p>

        {/* You're In. — Figma: 80px Heavy Italic, top 82px */}
        <p
          className="absolute left-1/2 -translate-x-1/2 text-[80px] font-black italic bg-gradient-to-r from-[#ffe9f4] to-[#ffcfe7] bg-clip-text leading-normal tracking-[-1.6px] whitespace-nowrap"
          style={{ WebkitTextFillColor: "transparent", top: 82 }}
        >
          {successContent.youreIn}
        </p>

        {/* Early Access Confirmed. — Figma: 70px Bold, w 830px */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 177, width: 830 }}
        >
          <p className="font-bold text-white text-[70px] tracking-[-1.4px] text-center leading-normal whitespace-nowrap">
            {successContent.confirmed}
          </p>

          {/* Animated underline under "Confirmed." — right portion of text */}
          <div
            className="absolute pointer-events-none"
            style={{ left: 451, bottom: -4, width: 316.795, height: 14.904, transform: "rotate(1.25deg) skewX(-0.81deg)" }}
          >
            {animatedUnderline}
          </div>
        </div>

        {/* Description — Figma: 20px, w 748px */}
        <p
          className="absolute left-1/2 -translate-x-1/2 text-[20px] text-[rgba(255,255,255,0.8)] leading-normal text-center"
          style={{ top: 298, width: 748 }}
        >
          <span>{successContent.description.text}</span>
          <span className="font-retro">{successContent.description.brandRetro}</span>
          <span>{successContent.description.suffix}</span>
          <br />
          <span className="font-bold">{successContent.description.boldText}</span>
        </p>
      </div>
    </>
  );

  /* ===== Mobile card content ===== */
  const mobileContent = (
    <>
      {/* Badge */}
      <div className="inline-flex items-center justify-center gap-[5px] bg-white/10 rounded-full h-[39px] px-5">
        <Image src="/logo-heart.svg" alt="" width={21} height={21} className="shrink-0" />
        <p className="text-sm text-white/85 tracking-[0.16px] leading-normal whitespace-nowrap">
          <span className="font-retro">{waitlistContent.badge.brandRetro}</span>
          <span className="font-medium">{waitlistContent.badge.suffix}</span>
        </p>
      </div>

      {/* Success content */}
      <div className="flex flex-col items-center mt-6 md:mt-5 gap-0 md:gap-4">
        {/* Congratulations */}
        <p className="font-retro text-[40px] text-[#ffcce5] tracking-[-0.8px] leading-tight md:leading-normal">
          {successContent.congratulations}
        </p>

        {/* You're In. */}
        <p
          className="text-[40px] font-black italic bg-gradient-to-r from-[#ffe9f4] to-[#ffcfe7] bg-clip-text leading-tight md:leading-normal tracking-[-0.8px]"
          style={{ WebkitTextFillColor: "transparent" }}
        >
          {successContent.youreIn}
        </p>

        {/* Early Access Confirmed. */}
        <div className="relative text-center whitespace-nowrap">
          <p className="text-[28px] font-bold text-white tracking-[-0.56px] leading-normal">
            {successContent.confirmed}
          </p>
          {/* Animated underline under "Confirmed." */}
          <div className="absolute pointer-events-none right-0 bottom-[-2px] w-[52%] h-auto">
            {animatedUnderline}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-white/80 leading-normal mt-5 md:mt-2">
          <span>{successContent.description.text}</span>
          <span className="font-retro">{successContent.description.brandRetro}</span>
          <span>{successContent.description.suffix}</span>
          <br />
          <span className="font-bold">{successContent.description.boldText}</span>
        </p>
      </div>
    </>
  );

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: FADE_DURATION, ease: "easeInOut" }}
    >
      <WaitlistLayout variant="success" mobileChildren={mobileContent}>
        {desktopContent}
      </WaitlistLayout>
    </motion.div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <WaitlistLayout variant="success">
          <div className="flex items-center justify-center min-h-[200px] text-white/60">
            Loading...
          </div>
        </WaitlistLayout>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
