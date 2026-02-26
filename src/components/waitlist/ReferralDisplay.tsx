"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { getStatsByToken } from "@/app/actions";
import { referralContent } from "@/lib/config/waitlist.config";
import { buildReferralSharePayload, type ReferralShareService } from "@/lib/utils/links";
import WaitlistLayout from "@/components/waitlist/WaitlistLayout";
import type { UserStatsResponse } from "@/lib/types";

const PLACEHOLDER_URL = referralContent.rightSection.placeholderUrl;

// Reusable Components
function SparkleIcon() {
  return <img src="/img/sparkle-star.svg" alt="" width={16} height={14} className="-scale-y-100" />;
}

function CopyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M4 14V5C4 3.89543 4.89543 3 6 3H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SocialButton({
  children,
  onClick,
  ariaLabel,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex items-center justify-center w-9 h-9 md:w-12 md:h-12 bg-black rounded-full hover:bg-black/80 transition-colors ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

interface ReferralDisplayProps {
  stats: UserStatsResponse;
  token: string;
}

export default function ReferralDisplay({ stats: initialStats, token }: ReferralDisplayProps) {
  const [stats, setStats] = useState<UserStatsResponse>(initialStats);
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const slowIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const referralPath = stats.user.referralLink ?? PLACEHOLDER_URL;
  const referralUrl = typeof window !== "undefined" ? `${window.location.origin}${referralPath}` : referralPath;
  const currentInvites = stats.referralStats.actualReferralCount;
  const displayInvites = Math.min(currentInvites, 10);

  // Refetch stats: every 5s for the first 10 minutes, then every minute
  useEffect(() => {
    const refetch = async () => {
      const next = await getStatsByToken(token);
      if (next) setStats(next);
    };

    const fastInterval = setInterval(refetch, 5 * 1000); // 5 seconds
    const switchToSlow = setTimeout(() => {
      clearInterval(fastInterval);
      slowIntervalRef.current = setInterval(refetch, 60 * 1000); // 1 minute
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearInterval(fastInterval);
      clearTimeout(switchToSlow);
      if (slowIntervalRef.current) {
        clearInterval(slowIntervalRef.current);
        slowIntervalRef.current = null;
      }
    };
  }, [token]);

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopup]);

  useEffect(() => {
    if (!shareFeedback) return;
    const timeout = setTimeout(() => setShareFeedback(null), 2400);
    return () => clearTimeout(timeout);
  }, [shareFeedback]);

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback to execCommand for older mobile browsers.
      }
    }

    if (typeof document === "undefined") return false;

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const copiedWithFallback = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copiedWithFallback;
  };

  const handleCopy = async () => {
    const copiedToClipboard = await copyTextToClipboard(referralUrl);
    if (!copiedToClipboard) return;

    setCopied(true);
    setShareFeedback("Referral link copied.");
    setTimeout(() => setCopied(false), 2000);
    setShowPopup(true);
  };

  const isMobileDevice = () => {
    if (typeof navigator === "undefined") return false;
    const touchDevice = typeof window !== "undefined" && "ontouchstart" in window;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || touchDevice;
  };

  const tryNativeShare = async (title: string, text: string, url: string): Promise<boolean> => {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return false;
    }

    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  };

  const openShareUrl = (url: string) => {
    if (typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const serviceLabelMap: Record<ReferralShareService, string> = {
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    snapchat: "Snapchat",
    linkedin: "LinkedIn",
    x: "X",
  };

  const handleShare = async (service: ReferralShareService) => {
    const payload = buildReferralSharePayload(referralUrl);
    const label = serviceLabelMap[service];
    const serviceUrl = payload.links[service];
    const shouldPreferNative = payload.nativeSharePreferredServices.includes(service);
    const mobile = isMobileDevice();

    if (mobile && shouldPreferNative) {
      const shared = await tryNativeShare("Sparkeefy referral", payload.message, payload.url);
      if (shared) {
        setShowPopup(true);
        return;
      }
    }

    if (serviceUrl) {
      openShareUrl(serviceUrl);
      setShowPopup(true);
      return;
    }

    const fallbackToNative = await tryNativeShare("Sparkeefy referral", payload.message, payload.url);
    if (fallbackToNative) {
      setShowPopup(true);
      return;
    }

    const copiedToClipboard = await copyTextToClipboard(payload.url);
    if (copiedToClipboard) {
      setCopied(true);
      setShowPopup(true);
      setShareFeedback(`Link copied. Paste it in ${label}.`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const animatedUnderline = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 134.146 7.003" fill="none" className="w-full h-full">
      <motion.path
        d="M1 3.5C20 2 60 1 133 3.5"
        stroke="#FFCCE5"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      />
      <motion.path
        d="M15 5.5C35 4.5 75 4 120 5.5"
        stroke="#FFCCE5"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
      />
    </svg>
  );

  // Beta Access Banner
  const betaBanner = (
    <div
      ref={popupRef}
      className="bg-[rgba(0,0,0,0.6)] md:bg-[rgba(0,0,0,0.45)] backdrop-blur-xl rounded-[22px] md:rounded-[48px] shadow-[0px_5.54px_29.453px_0px_rgba(0,0,0,0.56)] md:shadow-[0px_12px_63.8px_0px_rgba(0,0,0,0.56)] px-5 md:px-12 py-4 md:py-0 md:h-[173px] flex flex-col md:flex-row items-center md:justify-between gap-3 md:gap-0 text-center md:text-left"
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-base md:text-2xl text-white">Private Beta Access</h3>
        <p className="text-xs md:text-base text-white/60 max-w-[600px] leading-relaxed">
          We&apos;re onboarding a small group of beta testers to refine Sparkeefy. Feedback from this group will directly influence how the product evolves.
        </p>
      </div>
      <Link
        href={token ? `/join/beta-access?token=${encodeURIComponent(token)}` : "/join/beta-access"}
        className="px-5 md:px-8 py-2.5 md:py-4 bg-white text-black font-medium text-sm md:text-base rounded-full hover:bg-white/90 transition-colors whitespace-nowrap"
      >
        Request Access
      </Link>
    </div>
  );

  return (
    <WaitlistLayout
      variant="referral"
      banner={betaBanner}
      showBanner={showPopup}
    >
      <div className="w-full max-w-[1116px] mx-auto px-4 md:px-0 py-8 md:py-0">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <p className="font-retro text-[30px] md:text-[65px] text-[#ffcce5] tracking-[0.5px] md:tracking-[2px] leading-tight md:leading-normal text-center">
            {referralContent.congratulations}
          </p>
          <div className="relative mt-1">
            <p className="font-bold text-xs md:text-[30px] text-white tracking-[-0.22px] md:tracking-[-0.6px] text-center">
              <span className="text-[#ffcbe5]">{referralContent.subtitle.highlight}</span>
              <span>{referralContent.subtitle.text}</span>
            </p>
            <div className="hidden md:block absolute pointer-events-none right-0 -bottom-1 w-[134px] h-[7px]">
              {animatedUnderline}
            </div>
          </div>
        </div>

        {/* Content: Single column on mobile, two columns on desktop */}
        <div className="flex flex-col md:flex-row md:gap-[110px]">
          {/* Left section - Benefits */}
          <div className="flex-1 mb-6 md:mb-0">
            <p className="font-bold text-base md:text-[32px] text-white leading-normal">
              <span>{referralContent.leftSection.heading.text}</span>
              <span className="font-retro font-normal">{referralContent.leftSection.heading.brandRetro}</span>
            </p>

            <p className="hidden md:block text-base text-white/80 leading-normal mt-8">
              {referralContent.leftSection.description}
            </p>

            {/* Rewards table */}
            <div className="flex gap-3 md:gap-[17px] mt-5 md:mt-8">
              {/* Invites column */}
              <div className="flex flex-col gap-2 md:gap-[13.5px] font-bold text-[15px] md:text-[27px] text-white">
                {referralContent.leftSection.rewards.map((reward, idx) => (
                  <p
                    key={idx}
                    className={reward.isGold ? "bg-gradient-to-r from-[#ffd292] to-[#d39032] bg-clip-text" : ""}
                    style={reward.isGold ? { WebkitTextFillColor: "transparent" } : {}}
                  >
                    {reward.invites}
                  </p>
                ))}
              </div>

              {/* Rewards column */}
              <div className="flex flex-col gap-[7px] md:gap-[12.6px] text-white/70">
                {referralContent.leftSection.rewards.map((reward, idx) => (
                  <div key={idx} className="flex gap-1 md:gap-[4px] items-center text-[15px] md:text-[27px]">
                    {reward.isGold ? (
                      <p
                        className="font-semibold bg-gradient-to-r from-[#ffd292] to-[#d39032] bg-clip-text"
                        style={{ WebkitTextFillColor: "transparent" }}
                      >
                        {reward.reward}
                      </p>
                    ) : (
                      <>
                        <p className="font-semibold">{reward.reward}</p>
                        <p className="font-retro text-[12px] md:text-[22px]">{reward.rewardBrand}</p>
                        <p className="font-semibold text-[13px] md:text-[23px]">{reward.rewardSuffix}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Founder note */}
            <div className="hidden md:flex gap-[9px] items-center mt-6">
              <SparkleIcon />
              <p
                className="text-xs bg-gradient-to-r from-[#ffd292] to-[#d39032] bg-clip-text leading-normal"
                style={{ WebkitTextFillColor: "transparent" }}
              >
                <span>{referralContent.leftSection.founderNote.prefix}</span>
                <span className="font-medium underline">{referralContent.leftSection.founderNote.underlined}</span>
                <span>{referralContent.leftSection.founderNote.suffix}</span>
              </p>
            </div>
          </div>

          {/* Divider (mobile only) */}
          <div className="w-full h-px bg-white/20 my-3 md:hidden" />

          {/* Right section - Invite & Earn */}
          <div className="flex-1">
            <p className="font-bold text-base md:text-[32px] text-white tracking-[-0.32px] md:tracking-[-0.64px]">
              {referralContent.rightSection.heading}
            </p>

            <p className="text-sm md:text-base text-white/80 leading-normal mt-2 md:mt-5">
              <span>{referralContent.rightSection.subtitle.text}</span>
              <span className="font-bold">{referralContent.rightSection.subtitle.bold}</span>
            </p>

            {/* URL + Copy button */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center mt-3 md:mt-5">
              <div className="relative flex-1 w-full md:max-w-[304px] min-h-[35px] md:h-[35px] border-2 border-white/50 rounded-md overflow-hidden flex items-center px-3 py-2">
                <p className="text-xs md:text-base text-[#ffcbe5] tracking-[-0.32px] truncate">
                  {referralUrl}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1 md:gap-[5px] bg-white h-[31px] md:h-[35px] px-3 md:px-[13px] rounded-md hover:bg-white/90 transition-colors text-black"
              >
                {copied ? <Check className="w-4 h-4 md:w-[22px] md:h-[22px]" /> : <CopyIcon />}
                <span className="font-medium text-xs md:text-sm tracking-[-0.25px] md:tracking-[-0.28px]">
                  {copied ? "Copied" : referralContent.rightSection.copyButton}
                </span>
              </button>
            </div>

            {/* Or divider */}
            <div className="flex items-center gap-4 md:gap-6 my-2 md:my-4">
              <div className="flex-1 h-px bg-white/30 md:max-w-[171px]" />
              <p className="text-xs md:text-sm text-white/40 tracking-[-0.22px] md:tracking-[-0.28px]">or</p>
              <div className="flex-1 h-px bg-white/30 md:max-w-[171px]" />
            </div>

            {/* Share text */}
            <p className="text-xs md:text-base text-white/80 md:text-white/80">Share your invite link via</p>

            {/* Social icons */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-[13px] items-center mt-2 md:mt-4">
              <SocialButton onClick={() => void handleShare("instagram")} ariaLabel="Share via Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-6 md:h-6">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
                  <circle cx="18" cy="6" r="1.5" fill="white"/>
                </svg>
              </SocialButton>
              <SocialButton onClick={() => void handleShare("whatsapp")} ariaLabel="Share via WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="md:w-6 md:h-6">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </SocialButton>
              {/* Desktop-only icons */}
              <SocialButton onClick={() => void handleShare("snapchat")} ariaLabel="Share via Snapchat">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-.809-.329-1.224-.72-1.227-1.153-.007-.359.283-.705.746-.854.149-.074.329-.09.508-.09.121 0 .3.029.465.104.36.18.72.3 1.019.3.211 0 .328-.045.402-.089-.009-.18-.019-.359-.034-.539l-.002-.061c-.104-1.627-.225-3.654.304-4.848C7.85 1.07 11.2.794 12.2.794l.006-.001z"/>
                </svg>
              </SocialButton>
              <SocialButton onClick={() => void handleShare("linkedin")} ariaLabel="Share via LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="md:w-5 md:h-5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </SocialButton>
              <SocialButton onClick={() => void handleShare("x")} ariaLabel="Share via X">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="md:w-5 md:h-5">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </SocialButton>
            </div>
            {shareFeedback ? (
              <p className="text-[11px] md:text-sm text-white/70 mt-2">{shareFeedback}</p>
            ) : null}

            {/* Progress bar — same proportions on mobile and desktop (milestones at 85/418, 207/418, 352/418) */}
            <div className="mt-4 md:mt-8">
              {/* Bar container */}
              <div className="relative w-full md:w-[418px] h-[18px] md:h-[33px] border-[1.5px] md:border-[2.8px] border-white rounded-full">
                {/* Fill - animated */}
                <motion.div
                  className="absolute left-[3px] md:left-[5px] top-1/2 -translate-y-1/2 h-[12px] md:h-[23px] rounded-full bg-gradient-to-r from-white to-[#ff0080]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((displayInvites / 10) * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ maxWidth: "calc(100% - 6px)" }}
                />
              </div>

              {/* Milestones — proportional positions: 85/418 ≈ 20.33%, 207/418 ≈ 49.52%, 352/418 ≈ 84.21% */}
              <div className="relative w-full md:w-[418px] mt-1.5 md:mt-2 h-[60px]">
                {/* 3 invites */}
                <div
                  className="flex flex-col items-center absolute top-0 -translate-x-1/2 md:left-[85px]"
                  style={{ left: "20.33%" }}
                >
                  <div className={`w-[9px] h-[9px] rounded-full transition-colors duration-300 ${displayInvites >= 3 ? "bg-white" : "bg-white/50"}`} />
                  <p className={`text-[9px] md:text-[17px] mt-1 transition-colors duration-300 ${displayInvites >= 3 ? "text-white" : "text-white/50"}`}>
                    3 invites
                  </p>
                </div>

                {/* 6 invites */}
                <div
                  className="flex flex-col items-center absolute top-0 -translate-x-1/2 md:left-[207px]"
                  style={{ left: "49.52%" }}
                >
                  <div className={`w-[9px] h-[9px] rounded-full transition-colors duration-300 ${displayInvites >= 6 ? "bg-white" : "bg-white/50"}`} />
                  <p className={`text-[9px] md:text-[17px] mt-1 transition-colors duration-300 ${displayInvites >= 6 ? "text-white" : "text-white/50"}`}>
                    6 invites
                  </p>
                </div>

                {/* 10 invites */}
                <div
                  className="flex flex-col items-center absolute top-0 -translate-x-1/2 md:left-[352px]"
                  style={{ left: "84.21%" }}
                >
                  <div className={`w-[9px] h-[9px] rounded-full transition-colors duration-300 ${displayInvites >= 10 ? "bg-[#ffd292]" : "bg-[#ffd292]/50"}`} />
                  <p
                    className="font-bold text-[9px] md:text-[17px] mt-1 bg-gradient-to-r from-[#ffd292] to-[#d39032] bg-clip-text"
                    style={{ WebkitTextFillColor: "transparent" }}
                  >
                    10 invites
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WaitlistLayout>
  );
}
