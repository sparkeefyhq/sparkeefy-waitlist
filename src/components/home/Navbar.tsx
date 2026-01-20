"use client";

import React, { useState } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
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
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const currentScrollY = latest;
    const scrollDelta = currentScrollY - lastScrollY;

    // Show glass effect only when scrolled past hero section
    setIsScrolled(currentScrollY > 50);

    // Less sensitive scroll detection - require 50px scroll before triggering
    if (Math.abs(scrollDelta) < 50) return;

    // Smart Navbar Logic - Hide when scrolling down, Show when scrolling up
    if (scrollDelta > 0 && currentScrollY > 150) {
      // Scrolling Down significantly
      setIsVisible(false);
    } else if (scrollDelta < 0) {
      // Scrolling Up significantly
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  });

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Privacy", href: "/privacy" },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`
          fixed top-0 left-0 right-0 z-50 
          w-full
          transition-all duration-300
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
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/logo.svg"
                alt="Sparkeefy Logo"
                width={160}
                height={50}
                className="group-hover:drop-shadow-xl transition-all md:block hidden"
              />
              <Image
                src="/logo.svg"
                alt="Sparkeefy Logo"
                width={140}
                height={40}
                className="block md:hidden"
              />
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
                      relative text-base font-medium transition-all duration-200
                      ${isActive ? "text-white" : "text-white/80 hover:text-white"}
                    `}
                  >
                    {isActive ? (
                      // Animated gradient border wrapper
                      <span className="block p-[1.5px] rounded-full bg-gradient-to-r from-[#FF0080] via-[#FF52A9] to-[#FF0080] bg-[length:200%_100%] animate-border-spin">
                        <span className="block px-5 py-0.5 rounded-full bg-[#0a0008]">
                          {link.name}
                        </span>
                      </span>
                    ) : (
                      <span className="block px-5 py-0.5">
                        {link.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Button
                size="sm"
                className="rounded-full bg-[#FF4AA5] hover:bg-pink-500 text-black font-semibold text-base px-4 py-2 shadow-lg shadow-pink-500/25 transition-all hover:shadow-pink-500/40"
              >
                Join Waitlist
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden text-white">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="text-white hover:bg-white/10 [&_svg]:!size-6"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="6" width="18" height="2" rx="1" fill="currentColor"/>
                      <rect x="7" y="11" width="14" height="2" rx="1" fill="currentColor"/>
                      <rect x="11" y="16" width="10" height="2" rx="1" fill="currentColor"/>
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
                              <span className="block px-6 py-1 rounded-full bg-[#0a0008]">
                                {link.name}
                              </span>
                            </span>
                          ) : (
                            <span className="block px-6 py-1">
                              {link.name}
                            </span>
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
                            background: "conic-gradient(from 180deg at 50% 50%, #120020 0deg, #F9007D 53.3deg, #EE499C 90.5deg, #FFF 126.2deg, #120020 178.8deg, #120020 360deg)",
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
                          Join Waitlist
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
    </AnimatePresence>
  );
};

export default Navbar;
