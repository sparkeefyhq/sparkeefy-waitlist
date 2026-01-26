import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import CTA from "@/components/home/CTA";
import AboutHero from "@/components/about/AboutHero";

export default function About() {
  return (
    <main className="flex min-h-screen flex-col bg-black">
      <Navbar />
      <AboutHero />
      <CTA />
      <Footer />
    </main>
  );
}
