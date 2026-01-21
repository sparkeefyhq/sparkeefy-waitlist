import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navbar - Fixed/Sticky behaviors handled internally */}
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative w-full">
        <Hero />
      </section>

      {/* Features Section */}
      <Features />
    </main>
  );
}
