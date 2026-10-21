import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";

// Plain, readable page for policy text that app stores and users need to find
// (Play links the privacy policy and account deletion URLs from the listing).
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-black">
      <Navbar />
      <article className="mx-auto w-full max-w-3xl px-5 pb-20 pt-32 text-[15px] leading-7 text-gray-200 [&_a]:text-pink-300 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:text-white [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">{title}</h1>
        <p className="text-sm text-gray-400">Last updated: {updated}</p>
        {children}
      </article>
      <Footer />
    </main>
  );
}
