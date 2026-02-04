"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Image from "next/image";
import { waitlistContent } from "@/lib/config/waitlist.config";
import EmailForm from "./EmailForm";
import SocialIcons from "./SocialIcons";

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WaitlistModal({ open, onOpenChange }: WaitlistModalProps) {
  const handleEmailSubmit = (email: string) => {
    console.log("Email submitted:", email);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content wrapper */}
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="sr-only">
            {waitlistContent.form.title}
          </DialogPrimitive.Title>

          {/* Background gradient blurs from Figma */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -left-[33%] top-[22%] w-[78%] h-[105%] rotate-[30deg]">
              <img alt="" src="/bg/gradient-tl.svg" className="size-full" />
            </div>
            <div className="absolute left-[51%] top-[33%] w-[73%] h-[96%] -scale-y-100 rotate-[150deg]">
              <img alt="" src="/bg/gradient-tr.svg" className="size-full" />
            </div>
            <div className="absolute -left-[11%] top-[64%] w-[120%] h-[51%] -scale-y-100 rotate-180">
              <img alt="" src="/bg/gradient-bottom.svg" className="size-full" />
            </div>
            <div className="absolute -left-[6%] top-[22%] w-[110%] h-[59%]">
              <img alt="" src="/bg/ellipse-glow.svg" className="size-full" />
            </div>
          </div>

          {/* Glassmorphic card */}
          <div className="relative max-w-[1380px] w-[94vw] md:w-[72vw] bg-[rgba(0,0,0,0.45)] backdrop-blur-xl rounded-3xl md:rounded-[48px] shadow-[0px_12px_63.8px_0px_rgba(0,0,0,0.56)] overflow-clip py-10 md:py-[70px] px-5 md:px-20">
            {/* Close button */}
            <DialogPrimitive.Close className="absolute right-5 top-5 md:right-8 md:top-8 text-white/70 hover:text-white transition-opacity z-10">
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            {/* Content */}
            <div className="relative flex flex-col items-center text-center">
              {/* Badge */}
              <div className="inline-flex items-center justify-center gap-[5px] bg-white/10 rounded-[66.875px] h-[39px] px-5">
                <Image src="/logo-heart.svg" alt="" width={21} height={21} className="shrink-0" />
                <p className="text-base text-white/85 tracking-[0.16px] leading-normal">
                  <span className="font-retro">{waitlistContent.badge.brandRetro}</span>
                  <span className="font-bold text-white">{waitlistContent.badge.brandBold}</span>
                  <span className="font-medium">{waitlistContent.badge.suffix}</span>
                </p>
              </div>

              {/* Heading + Subheading + Underline */}
              <div className="flex flex-col items-center max-w-[605px] mt-8 md:mt-10">
                <div className="relative">
                  <h1 className="text-4xl md:text-[68px] font-bold text-white leading-tight tracking-[-1.36px]">
                    {waitlistContent.heading.prefix}
                    <em className="font-retro not-italic text-[#ffcce5]">
                      {waitlistContent.heading.highlight}
                    </em>
                    {waitlistContent.heading.suffix}
                  </h1>
                  {/* Decorative underline */}
                  <img
                    alt=""
                    src="/bg/underline-swirl.svg"
                    className="hidden md:block absolute bottom-[-4px] left-1/2 -translate-x-[40%] w-[333px] h-[16px]"
                  />
                </div>

                <p className="text-sm md:text-xl text-white/80 mt-8 md:mt-10">
                  {waitlistContent.subheading.text}
                  <span className="font-bold">{waitlistContent.subheading.boldText}</span>
                </p>
              </div>

              {/* Form Section */}
              <div className="flex flex-col items-center w-full max-w-[605px] mt-8 md:mt-10">
                <div className="flex flex-col gap-2 items-center">
                  <h2 className="text-xl md:text-[30px] font-bold bg-gradient-to-r from-white to-[#e0e0e0] bg-clip-text text-transparent">
                    {waitlistContent.form.title}
                  </h2>
                  <p className="text-sm md:text-xl text-white/80">
                    {waitlistContent.form.description}
                  </p>
                </div>

                <div className="w-full mt-[21px]">
                  <EmailForm onSubmit={handleEmailSubmit} />
                </div>
              </div>

              {/* Social Icons */}
              <div className="mt-8 md:mt-10">
                <SocialIcons />
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
