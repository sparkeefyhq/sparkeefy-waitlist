"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import WaitlistLayout from "@/components/waitlist/WaitlistLayout";

const STORAGE_KEY = "sparkeefy-beta-access";

// Question 1 options
const primaryUseOptions = [
  { id: "partner", label: "My partner" },
  { id: "friend", label: "A close friend" },
  { id: "family", label: "A family member" },
  { id: "unsure", label: "I'm not sure yet" },
];

// Question 2
const question2 = {
  question: "Is there a moment you wish you'd handled a little better?",
  placeholder: "For example: forgetting a birthday, replying late, missing a moment.",
};

export default function BetaAccessPage() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.selectedOptions) setSelectedOptions(data.selectedOptions);
        if (data.textAnswer) setTextAnswer(data.textAnswer);
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selectedOptions, textAnswer })
    );
  }, [selectedOptions, textAnswer]);

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    // For now just go back to referral
    // Later this will submit to the backend
    window.location.href = "/join/referral";
  };

  const canSubmit = selectedOptions.length > 0;

  // Animated underline for "Questions"
  const animatedUnderline = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 134.146 7.003"
      fill="none"
      className="w-full h-full"
    >
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

  /* ===== Mobile content ===== */
  const mobileContent = (
    <div className="flex flex-col items-center w-full pt-4">
      {/* Header */}
      <div className="relative">
        <p className="font-retro text-[32px] text-white tracking-[-1.28px] text-center">
          <span>A couple of </span>
          <span className="text-[#ffcbe5]">Questions</span>
        </p>
        <div className="absolute right-0 -bottom-1 w-[100px] h-[5px]">
          {animatedUnderline}
        </div>
      </div>

      <div className="w-full mt-8">
        {/* Question 1 */}
        <p className="font-medium text-[16px] text-white tracking-[-0.64px]">
          Who would you primarily use Sparkeefy for?
        </p>
        <p className="text-[12px] text-white/40 mt-2">
          <span className="text-red-400/40">*</span>Select one or more options
        </p>

        {/* Options */}
        <div className="flex flex-col gap-3 mt-4">
          {primaryUseOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`h-[50px] rounded-full border transition-all text-[16px] font-semibold tracking-[-0.48px] ${
                selectedOptions.includes(option.id)
                  ? "bg-white/10 border-[#ff68b4] text-white"
                  : "bg-white/10 border-transparent text-white hover:border-white/30"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Question 2 */}
        <p className="font-medium text-[16px] text-white tracking-[-0.64px] mt-6">
          {question2.question}
        </p>

        {/* Text area */}
        <textarea
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder={question2.placeholder}
          className="w-full mt-4 h-[100px] bg-white/10 rounded-[16px] p-4 text-[14px] text-white placeholder:text-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-white/30"
        />
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`mt-8 flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[16px] transition-all ${
          canSubmit
            ? "bg-white text-black hover:bg-white/90"
            : "bg-white/30 text-white/50 cursor-not-allowed"
        }`}
      >
        <span>Submit</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  /* ===== Desktop content ===== */
  const desktopContent = (
    <div className="absolute inset-0 flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-[80px]">
        <div className="relative">
          <p className="font-retro text-[50px] text-white tracking-[-2px] text-center">
            <span>A couple of </span>
            <span className="text-[#ffcbe5]">Questions</span>
          </p>
          <div
            className="absolute pointer-events-none"
            style={{ right: 0, bottom: -4, width: 166, height: 8 }}
          >
            {animatedUnderline}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 px-[163px] pt-[50px]">
        {/* Question 1 */}
        <p className="font-medium text-[24px] text-white tracking-[-0.96px]">
          Who would you primarily use Sparkeefy for?
        </p>
        <p className="text-[18px] text-white/40 mt-2 tracking-[-0.36px]">
          <span className="text-red-400/40">*</span>Select one or more options
        </p>

        {/* Options row */}
        <div className="flex gap-4 mt-6 px-[15px]">
          {primaryUseOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`h-[60px] w-[250px] rounded-full border transition-all text-[20px] font-semibold tracking-[-0.6px] ${
                selectedOptions.includes(option.id)
                  ? "bg-white/10 border-[#ff68b4] text-white"
                  : "bg-white/10 border-transparent text-white hover:border-white/30"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Question 2 */}
        <p className="font-medium text-[24px] text-white tracking-[-0.96px] mt-[35px]">
          {question2.question}
        </p>

        {/* Text area */}
        <textarea
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder={question2.placeholder}
          className="w-[1054px] mt-6 h-[126px] bg-white/10 rounded-[24px] px-[38px] py-[20px] text-[16px] text-white placeholder:text-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-white/30"
        />
      </div>

      {/* Submit button - positioned at left: 1065px, top: 617px from Figma */}
      <div className="absolute left-[1065px] top-[617px]">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex items-center justify-center gap-[10px] h-[40px] w-[150px] rounded-full font-bold text-[20px] tracking-[-0.8px] transition-all ${
            canSubmit
              ? "bg-white text-black hover:bg-white/90"
              : "bg-white/30 text-white/50 cursor-not-allowed"
          }`}
        >
          <span>Submit</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <WaitlistLayout variant="beta-access" mobileChildren={mobileContent}>
      {desktopContent}
    </WaitlistLayout>
  );
}
