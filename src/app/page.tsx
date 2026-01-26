import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import ParallaxCurve from "@/components/home/ParallaxCurve";

import WhoIsSparkeefyFor from "@/components/home/WhoIsSparkeefyFor";
import FAQ from "@/components/home/FAQ";
import CTA from "@/components/home/CTA";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      
      {/* Sticky Hero */}
      <section className="sticky top-0 h-screen z-0 w-full">
        <Hero />
      </section>

      {/* Scrolling Content with Parallax Curve on top */}
      <div className="relative z-10 w-full">
        <ParallaxCurve />
        <div className="bg-white w-full">
          <Features />
          <WhoIsSparkeefyFor />
          <FAQ />
          <CTA />
          <Footer />
        </div>
      </div>
    </main>
  );
}
