"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import WaitlistLayout from "@/components/waitlist/WaitlistLayout";
import { submitSlackAccessAction, type FormActionState } from "@/app/actions";

// Question 1 options
const primaryUseOptions = [
  { id: "A", label: "My partner" },
  { id: "B", label: "A close friend" },
  { id: "C", label: "A family member" },
  { id: "D", label: "I'm not sure yet" },
];

// Question 2
const question2 = {
  question: "Is there a moment you wish you'd handled a little better?",
  placeholder: "For example: forgetting a birthday, replying late, missing a moment.",
};

function SubmitButton({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();
  const disabled = !canSubmit || pending;
  
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`flex items-center justify-center gap-2 md:gap-[10px] h-[40px] w-full md:w-[150px] rounded-full font-bold text-base md:text-[20px] tracking-[-0.4px] md:tracking-[-0.8px] transition-all ${
        disabled
          ? "bg-white/30 text-white/50 cursor-not-allowed"
          : "bg-white text-black hover:bg-white/90"
      }`}
    >
      <span>{pending ? "Submitting..." : "Submit"}</span>
      <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
    </button>
  );
}

function BetaAccessContent({ token }: { token: string | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");

  const [state, formAction] = useFormState<FormActionState>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- useFormState passes (prevState, formData) at runtime
    submitSlackAccessAction as any,
    null
  );

  // Redirect back to referral page on success
  useEffect(() => {
    if (state?.success) {
      const query = token ? `?token=${encodeURIComponent(token)}` : "";
      router.push(`/join/referral${query}`);
    }
  }, [state, token, router]);

  const toggleOption = (id: string) => {
    setSelected(id);
  };

  const canSubmit = selected !== null;

  // Animated underline
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

  const backHref = token ? `/join/referral?token=${encodeURIComponent(token)}` : "/join/referral";

  return (
    <WaitlistLayout variant="beta-access" backHref={backHref}>
      <form action={formAction} className="w-full max-w-4xl mx-auto px-4 md:px-0">
        {/* Hidden field for token */}
        {token && <input type="hidden" name="token" value={token} />}
        
        {/* Error display */}
        {state?.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {state.error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col items-center pt-8 md:pt-20 mb-8 md:mb-12">
          <div className="relative">
            <p className="font-retro text-[28px] md:text-[50px] text-white md:tracking-[-2px] text-center">
              <span>A couple of </span>
              <span className="text-[#ffcbe5]">Questions</span>
            </p>
            <div
              className="absolute pointer-events-none right-0 md:right-0 -bottom-1 md:-bottom-1 w-20 md:w-[166px] h-1 md:h-2"
            >
              {animatedUnderline}
            </div>
          </div>
        </div>

        {/* Question 1 */}
        <div className="mb-6 md:mb-8">
          <p className="font-medium text-sm md:text-2xl text-white tracking-[-0.56px] md:tracking-[-0.96px]">
            Who would you primarily use Sparkeefy for?
          </p>
          <p className="text-xs md:text-lg text-white/40 mt-1 md:mt-2 tracking-[-0.22px] md:tracking-[-0.36px]">
            <span className="text-red-400/40">*</span>Select one option
          </p>

          {/* Options - responsive grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-3 md:mt-6">
            {primaryUseOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleOption(option.id)}
                className={`h-[40px] md:h-[60px] rounded-full border transition-all text-[13px] md:text-[20px] font-semibold tracking-[-0.39px] md:tracking-[-0.6px] ${
                  selected === option.id
                    ? "bg-white/10 border-[#ff68b4] text-white"
                    : "bg-white/10 border-transparent text-white hover:border-white/30"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {/* Hidden input for form submission */}
          <input type="hidden" name="q1Answer" value={selected || ""} />
        </div>

        {/* Question 2 */}
        <div className="mb-6 md:mb-8">
          <p className="font-medium text-sm md:text-2xl text-white tracking-[-0.56px] md:tracking-[-0.96px]">
            {question2.question}
          </p>

          {/* Text area */}
          <textarea
            name="q2Answer"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder={question2.placeholder}
            className="w-full mt-2 md:mt-6 h-[80px] md:h-[126px] bg-white/10 rounded-[12px] md:rounded-[24px] p-3 md:px-[38px] md:py-[20px] text-[12px] md:text-[16px] text-white placeholder:text-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>

        {/* Submit button */}
        <div className="flex justify-center md:justify-end">
          <SubmitButton canSubmit={canSubmit} />
        </div>
      </form>
    </WaitlistLayout>
  );
}

export default async function BetaAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // Await searchParams (required in Next.js 15+)
  const params = await searchParams;
  const token = params.token || null;

  return (
    <Suspense
      fallback={
        <WaitlistLayout variant="beta-access" backHref="/join/referral">
          <div className="flex items-center justify-center min-h-[200px] text-white/60">
            Loading...
          </div>
        </WaitlistLayout>
      }
    >
      <BetaAccessContent token={token} />
    </Suspense>
  );
}
