"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { joinWaitlistAction, type FormActionState } from "@/app/actions";
import { waitlistContent } from "@/lib/config/waitlist.config";
import { Input } from "@/components/ui/input";
import type { WaitlistJoinResponse } from "@/lib/types";

interface EmailFormProps {
  /** Called on successful join with the join response (includes magicLinkToken for token-in-URL flow). */
  onSubmit?: (data: { user: { magicLinkToken: string } }) => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 bg-white text-black w-[86px] md:w-[86px] h-[41px] px-4 md:px-0 md:mr-[6px] rounded-full text-base md:text-lg font-bold tracking-[-0.36px] hover:bg-gray-200 active:scale-95 transition-all duration-150 disabled:opacity-50"
    >
      {pending ? "Joining..." : waitlistContent.form.submitButton}
    </button>
  );
}

export default function EmailForm({ onSubmit }: EmailFormProps) {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") || undefined;
  
  const [state, formAction] = useFormState<FormActionState<WaitlistJoinResponse>>(
    joinWaitlistAction,
    null
  );

  // Handle successful submission
  useEffect(() => {
    if (state?.success && state.data && onSubmit) {
      onSubmit(state.data);
    }
  }, [state, onSubmit]);

  return (
    <form action={formAction} className="w-full">
      {/* Hidden field for referral code */}
      {referralCode && (
        <input type="hidden" name="referralCode" value={referralCode} />
      )}
      
      {/* Error display */}
      {state?.error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {state.error}
        </div>
      )}
      
      {/* Responsive layout: inline on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row md:relative items-center gap-4 md:gap-0 md:bg-white/10 md:rounded-full md:h-[53px] md:shadow-[0px_11px_15px_0px_rgba(0,0,0,0.22)]">
        <div className="w-full md:flex-1 bg-white/10 md:bg-transparent rounded-full h-[52px] md:h-full shadow-[0px_11px_15px_0px_rgba(0,0,0,0.22)] md:shadow-none">
          <Input
            type="email"
            name="email"
            placeholder={waitlistContent.form.emailPlaceholder}
            aria-label="Email address"
            className="w-full h-full bg-transparent text-white placeholder:text-white/50 outline-none text-base md:text-xl tracking-[-0.4px] px-6 md:pl-6 md:pr-2 font-bold border-none shadow-none focus-visible:ring-0 focus-visible:border-none rounded-full [-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgb(30,30,30)_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_rgb(30,30,30)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_rgb(30,30,30)_inset]"
          />
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}
