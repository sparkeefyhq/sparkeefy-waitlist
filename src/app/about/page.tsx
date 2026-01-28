"use client";

import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import CTA from "@/components/home/CTA";
import AboutHero from "@/components/about/AboutHero";
import { useMediaQuery } from "react-responsive";
import { AboutHeroMobile } from "@/components/about/AboutHeroMobile";

export default function About() {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <main className="flex min-h-screen flex-col bg-black">
      <Navbar />
      {isMobile ? <AboutHeroMobile /> : <AboutHero />}
      <CTA />
      <Footer />
    </main>
  );
}
