"use client";

import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import CTA from "@/components/home/CTA";
import PrivacyHero from "@/components/privacy/PrivacyHero";
import PrivacyPolicySection from "@/components/privacy/PrivacyPolicySection";

export default function Privacy() {
  return (
    <main className="flex min-h-dvh flex-col bg-black">
      <Navbar />
      <PrivacyHero />
      <PrivacyPolicySection />
      <CTA />
      <Footer />
    </main>
  );
}
