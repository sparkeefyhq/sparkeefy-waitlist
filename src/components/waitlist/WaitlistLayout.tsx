"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

const DESIGN_W = 1920;
const DESIGN_H = 1080;

interface WaitlistLayoutProps {
  children: React.ReactNode;
  mobileChildren?: React.ReactNode;
  variant?: "join" | "success";
}

export default function WaitlistLayout({
  children,
  mobileChildren,
  variant = "join",
}: WaitlistLayoutProps) {
  const router = useRouter();
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      setScale(
        Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isSuccess = variant === "success";

  return (
    <div className="relative h-svh w-full bg-[rgb(13,13,13)] overflow-hidden">
      {/* ===== MOBILE LAYOUT (< md) ===== */}
      <div className="md:hidden relative min-h-svh w-full flex items-center justify-center px-5 py-8">
        {/* Mobile background gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top overlay — green for join, pink for success */}
          <div
            className="absolute left-1/2 opacity-60"
            style={{ top: "-60vh", width: "355vw", height: "173vh", transform: "translateX(-50%) rotate(8deg)" }}
          >
            <img alt="" src={isSuccess ? "/bg/gradient-pink-overlay.svg" : "/bg/gradient-green-overlay.svg"} className="size-full" />
          </div>
          {/* Top-left teal glow */}
          <div className="absolute -left-[115vw] top-[35vh] w-[188vw] h-[65vh] rotate-[30deg] opacity-80">
            <img alt="" src="/bg/gradient-tl.svg" className="size-full" />
          </div>
          {/* Right glow */}
          <div className="absolute left-[30vw] top-[35vh] w-[255vw] h-[86vh] -scale-y-100 rotate-[150deg] opacity-80">
            <img alt="" src="/bg/gradient-tr.svg" className="size-full" />
          </div>
          {/* Bottom colorful glow */}
          <div className="absolute -left-[90vw] top-[75vh] w-[291vw] h-[41vh] -scale-y-100 rotate-180 opacity-80">
            <img alt="" src="/bg/gradient-bottom.svg" className="size-full" />
          </div>
          {/* Dark ellipse */}
          <div className="absolute -left-[28vw] top-[45vh] w-[168vw] h-[20vh]">
            <img alt="" src="/bg/ellipse-glow.svg" className="size-full" />
          </div>
        </div>

        <div className="relative w-full bg-[rgba(0,0,0,0.45)] backdrop-blur-xl rounded-[22px] shadow-[0px_5.54px_29.453px_0px_rgba(0,0,0,0.56)] overflow-clip">
          <button
            onClick={() => router.back()}
            className="absolute right-4 top-4 text-white/70 hover:text-white transition-opacity z-10"
          >
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="flex flex-col items-center text-center px-6 pt-8 pb-12">
            {mobileChildren}
          </div>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT (≥ md) ===== */}
      <div
        className="hidden md:block absolute left-1/2 top-1/2"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `translate(-50%, -50%) scale(${scale ?? 0.75})`,
          transformOrigin: "center center",
          opacity: scale !== null ? 1 : 0,
          transition: "opacity 0.1s ease-out",
        }}
      >
        {/* Background gradients — exact Figma pixel positions on 1920×1080 canvas */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top overlay — green for join, pink for success */}
          {isSuccess ? (
            <div
              className="absolute -translate-x-1/2 flex items-center justify-center"
              style={{
                left: "calc(50% - 68.83px)",
                top: -1837.31,
                width: 3981.276,
                height: 3950.917,
              }}
            >
              <div className="flex-none rotate-[39.96deg] relative" style={{ width: 2937.528, height: 2693.145 }}>
                <div className="absolute" style={{ inset: "0 -1.92%" }}>
                  <img alt="" src="/bg/gradient-pink-overlay.svg" className="block max-w-none size-full" />
                </div>
              </div>
            </div>
          ) : (
            <div
              className="absolute"
              style={{
                left: "calc(50% - 103.35px)",
                top: -1799,
                width: 3939.305,
                height: 3909.151,
                transform: "translateX(-50%) rotate(39.96deg)",
              }}
            >
              <img alt="" src="/bg/gradient-green-overlay.svg" className="size-full" />
            </div>
          )}

          {/* Top-left teal/blue glow */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: -636, top: 242, width: 1498.443, height: 1143.277 }}
          >
            <div className="flex-none rotate-[30deg] relative" style={{ width: 1452.102, height: 481.771 }}>
              <div className="absolute" style={{ inset: "-28.63% -9.5% -58.31% -9.5%" }}>
                <img alt="" src="/bg/gradient-tl.svg" className="block max-w-none size-full" />
              </div>
            </div>
          </div>

          {/* Right glow */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: 988.23, top: 355.06, width: 1404.376, height: 1046.451 }}
          >
            <div className="flex-none -scale-y-100 rotate-[150deg] relative" style={{ width: 1386, height: 408.13 }}>
              <div className="absolute" style={{ inset: "-38.82% -9.95% -68.98% -9.95%" }}>
                <img alt="" src="/bg/gradient-tr.svg" className="block max-w-none size-full" />
              </div>
            </div>
          </div>

          {/* Bottom colorful glow — same for both variants */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: -210, top: 690.2, width: 2300, height: 552.803 }}
          >
            <div className="flex-none -scale-y-100 rotate-180 relative" style={{ width: 2300, height: 552.803 }}>
              <div className="absolute" style={{ inset: "-21.3% -10.49% -43.66% -10.49%" }}>
                <img alt="" src="/bg/gradient-bottom.svg" className="block max-w-none size-full" />
              </div>
            </div>
          </div>

          {/* Dark ellipse glow */}
          <div
            className="absolute"
            style={{ left: -117, top: 239, width: 2113, height: 644 }}
          >
            <div className="absolute" style={{ inset: "-32.72% -9.97%" }}>
              <img alt="" src="/bg/ellipse-glow.svg" className="block max-w-none size-full" />
            </div>
          </div>
        </div>

        {/* Glassmorphic card */}
        <div
          className="absolute bg-[rgba(0,0,0,0.45)] backdrop-blur-xl rounded-[48px] shadow-[0px_12px_63.8px_0px_rgba(0,0,0,0.56)] overflow-clip"
          style={{ left: 270, top: 145, width: 1380, height: 787 }}
        >
          {/* Close button */}
          <button
            onClick={() => router.back()}
            className="absolute rounded-full p-0.5 md:p-1.5 hover:bg-white/20 right-8 top-8 text-white/70 hover:text-white transition-all z-10 cursor-pointer"
          >
            <X className="size-5 md:size-6" />
            <span className="sr-only">Close</span>
          </button>

          {children}
        </div>
      </div>
    </div>
  );
}
