"use client";

import { useState } from "react";
import { waitlistContent } from "@/lib/config/waitlist.config";
import { Input } from "@/components/ui/input";

interface EmailFormProps {
  onSubmit?: (email: string) => void;
}

export default function EmailForm({ onSubmit }: EmailFormProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && onSubmit) {
      onSubmit(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Desktop: inline layout */}
      <div className="hidden md:flex relative items-center bg-white/10 rounded-full h-[53px] shadow-[0px_11px_15px_0px_rgba(0,0,0,0.22)]">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={waitlistContent.form.emailPlaceholder}
          required
          className="flex-1 bg-transparent text-white placeholder:text-white/50 outline-none text-xl tracking-[-0.4px] pl-6 pr-2 font-bold border-none shadow-none focus-visible:ring-0 focus-visible:border-none h-full rounded-full autofill:bg-transparent autofill:text-white [-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgb(30,30,30)_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_rgb(30,30,30)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_rgb(30,30,30)_inset]"
        />
        <button
          type="submit"
          className="shrink-0 bg-white text-black w-[86px] h-[41px] rounded-full text-lg font-bold tracking-[-0.36px] mr-[6px] hover:bg-gray-200 active:scale-95 transition-all duration-150"
        >
          {waitlistContent.form.submitButton}
        </button>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex md:hidden flex-col items-center gap-4">
        <div className="w-full bg-white/10 rounded-full h-[52px] shadow-[0px_11px_15px_0px_rgba(0,0,0,0.22)]">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={waitlistContent.form.emailPlaceholder}
            required
            className="w-full h-full bg-transparent text-white placeholder:text-white/50 outline-none text-base tracking-[-0.4px] px-6 font-bold border-none shadow-none focus-visible:ring-0 focus-visible:border-none rounded-full [-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0px_1000px_rgb(30,30,30)_inset] [&:-webkit-autofill:hover]:[-webkit-box-shadow:0_0_0px_1000px_rgb(30,30,30)_inset] [&:-webkit-autofill:focus]:[-webkit-box-shadow:0_0_0px_1000px_rgb(30,30,30)_inset]"
          />
        </div>
        <button
          type="submit"
          className="bg-white text-black px-10 h-[41px] rounded-full text-lg font-bold tracking-[-0.36px] hover:bg-gray-200 active:scale-95 transition-all duration-150"
        >
          {waitlistContent.form.submitButton}
        </button>
      </div>
    </form>
  );
}
