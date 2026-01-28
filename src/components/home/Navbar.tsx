"use client";

import React, { useState } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const { scrollY } = useScroll();
  const y = useMotionValue(0);
  const smoothY = useSpring(y, { stiffness: 220, damping: 30 });
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;

    // Glass effect logic
    if (latest > 50 && !isScrolled) setIsScrolled(true);
    if (latest <= 50 && isScrolled) setIsScrolled(false);

    // Smart Navbar Logic (State-Drive)

    // 1. Force show at the very top
    if (latest < 10) {
      y.set(0);
      return;
    }

    // 2. Scrolling Down -> Hide fully (-100)
    if (diff > 0) {
      y.set(-100);
    }
    // 3. Scrolling Up -> Show fully (0)
    else if (diff < 0) {
      y.set(0);
    }
  });

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Privacy", href: "/privacy" },
  ];

  return (
    <motion.header
      style={{ y: smoothY }}
      className={`
          fixed top-0 left-0 right-0 z-50 
          w-full
          transition-colors duration-300
          ${
            isScrolled
              ? "bg-black/40 backdrop-blur-md shadow-lg"
              : "bg-transparent"
          }
        `}
    >
      <nav
        className={`px-4 lg:px-8 transition-all duration-300 ${!isScrolled ? "pt-4 md:pt-[2.375rem] pb-4" : "py-4"}`}
      >
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="group select-none">
            <motion.span
              initial="initial"
              animate="visible"
              whileHover="hover"
              className="flex items-center gap-2"
            >
              <motion.div
                variants={{
                  initial: { scale: 0, opacity: 0 },
                  visible: {
                    scale: 1,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                    },
                  },
                  hover: {
                    scale: [1, 1.1, 1],
                    opacity: [1, 1, 1],
                    transition: {
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  },
                }}
                className="relative w-8 h-8"
              >
                <Image
                  src="/logo-heart.svg"
                  alt="Sparkeefy Heart"
                  fill
                  className="object-contain"
                />
              </motion.div>
              <div className="relative h-10 w-28">
                <Image
                  src="/logo-text.svg"
                  alt="Sparkeefy Text"
                  fill
                  className="object-contain"
                />
              </div>
            </motion.span>
          </Link>

          {/* Desktop Links - Centered */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`
                      relative text-base font-medium transition-colors duration-200 select-none
                      ${isActive ? "text-white" : "text-white/80 hover:text-white"}
                    `}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-nav-pill"
                      className="absolute -inset-[1.5px] rounded-full bg-gradient-to-r from-[#FF0080] via-[#FF52A9] to-[#FF0080] bg-[length:200%_100%] animate-border-spin z-0"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    >
                      <span className="absolute inset-[1.5px] rounded-full bg-[#010302]" />
                    </motion.span>
                  )}
                  <span className="relative z-10 block px-5 py-0.5">
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              size="sm"
              className={`rounded-full bg-[#FF4AA5] hover:bg-pink-500 font-semibold text-sm px-4 py-1 shadow-lg shadow-pink-500/25 transition-all hover:shadow-pink-500/40 select-none
                ${!isScrolled ? "text-black" : "text-white"}
              `}
            >
              Get Early Access
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden text-white">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="!text-white hover:bg-white/10 [&_svg]:!size-6"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="3"
                      y="6"
                      width="18"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="7"
                      y="11"
                      width="14"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="11"
                      y="16"
                      width="10"
                      height="2"
                      rx="1"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="top"
                className="bg-black/40 border-b border-white/10 backdrop-blur-xl text-white rounded-b-[2rem]"
              >
                <SheetTitle className="hidden">Menu</SheetTitle>
                <div className="flex flex-col items-center justify-center gap-5 mt-14 pb-6">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`
                            relative text-xl font-medium transition-all duration-200
                            ${isActive ? "text-white" : "text-white/80 hover:text-white"}
                          `}
                      >
                        {isActive ? (
                          <span className="block p-[1.5px] rounded-full bg-gradient-to-r from-[#FF0080] via-[#FF52A9] to-[#FF0080] bg-[length:200%_100%] animate-border-spin">
                            <span className="block px-6 py-1 rounded-full bg-[#010302]">
                              {link.name}
                            </span>
                          </span>
                        ) : (
                          <span className="block px-6 py-1">{link.name}</span>
                        )}
                      </Link>
                    );
                  })}

                  {/* Animated Button */}
                  <div className="relative w-full max-w-xs group mt-2">
                    <div className="absolute inset-[-4px] bg-[#FF4AA5] rounded-full blur-[20px] opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                    <div className="relative rounded-full overflow-hidden p-[2px] group-hover:scale-105 transition-all duration-300">
                      <motion.div
                        className="absolute top-1/2 left-1/2 w-[500px] h-[500px]"
                        style={{
                          background:
                            "conic-gradient(from 180deg at 50% 50%, #120020 0deg, #F9007D 53.3deg, #EE499C 90.5deg, #FFF 126.2deg, #120020 178.8deg, #120020 360deg)",
                          x: "-50%",
                          y: "-50%",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <Button
                        size="lg"
                        className="relative w-full rounded-full bg-[linear-gradient(90deg,_rgba(60,_11,_36,_0.90)_0%,_rgba(0,_0,_0,_0.90)_100%)] backdrop-blur-lg text-base text-white font-medium"
                      >
                        Get Early Access
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </motion.header>
  );
};

export default Navbar;
