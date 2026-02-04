"use client";

import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import CTA from "@/components/home/CTA";
import AboutHero from "@/components/about/AboutHero";
import { AboutHeroMobile } from "@/components/about/AboutHeroMobile";

export default function About() {
  return (
    <main className="flex min-h-dvh flex-col bg-black">
      <Navbar />
      <AboutHeroMobile />
      <AboutHero />
      <CTA />
      <Footer />
    </main>
  );
}
