"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { PRIVACY_POLICY_MD } from "@/content/privacyPolicy";
import { parsePolicy, PolicyBlocks, policyProse } from "@/lib/legal/policy";

const policy = parsePolicy(PRIVACY_POLICY_MD);

// The full Keefie policy under the /privacy hero: sticky contents on desktop,
// sections fading in as they scroll into view, and a thin reading-progress bar.
const PrivacyPolicySection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(policy.sections[0]?.id);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const barOpacity = useTransform(scrollYProgress, [0, 0.01, 0.99, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    policy.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "0px 0px -10% 0px" },
        transition: { duration: 0.5, ease: "easeOut" as const },
      };

  return (
    <section
      id="policy"
      ref={sectionRef}
      className="relative w-full bg-[#010302] px-6 pb-16 pt-16 text-white lg:px-12 lg:pt-24"
    >
      <motion.div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-[linear-gradient(90deg,_#FF4FA3_0%,_#FFC7E3_100%)]"
        style={{ scaleX: progress, opacity: barOpacity }}
      />

      <div className="mx-auto w-full max-w-[70rem]">
        <motion.header {...reveal} className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-pink-300/80">The full policy</p>
          <h2 className="mt-3 text-3xl font-bold leading-[1.15] sm:text-5xl">
            <span className="text-white">Keefie</span>{" "}
            <span className="bg-[linear-gradient(90deg,_#FFC7E3_0%,_#E5C2D3_50%,_#D8B5C6_100%)] bg-clip-text text-transparent">
              {policy.title}
            </span>
          </h2>
          {(policy.effective || policy.updated) && (
            <p className="mt-4 text-sm text-white/50">
              {policy.effective && <>Effective {policy.effective}</>}
              {policy.effective && policy.updated && <span className="mx-2">·</span>}
              {policy.updated && <>Last updated {policy.updated}</>}
            </p>
          )}
          <div className={`mt-4 ${policyProse}`}>
            <PolicyBlocks blocks={policy.intro} />
          </div>
        </motion.header>

        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
          {/* Contents: sticky list on desktop, collapsible on mobile */}
          <nav aria-label="Privacy policy sections" className="lg:sticky lg:top-28 lg:self-start">
            <details className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:hidden">
              <summary className="cursor-pointer list-none text-sm font-semibold text-white">
                Jump to a section <span className="ml-1 inline-block transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <ol className="mt-3 space-y-2 text-sm text-white/60">
                {policy.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="hover:text-pink-200">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <ol className="hidden max-h-[calc(100vh-9rem)] space-y-0.5 overflow-y-auto border-l border-white/10 pr-2 text-[13px] [scrollbar-width:none] lg:block">
              {policy.sections.map((s) => {
                const active = s.id === activeId;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-current={active ? "location" : undefined}
                      className={`-ml-px block border-l py-1 pl-4 leading-snug transition-colors ${
                        active
                          ? "border-pink-300 text-white"
                          : "border-transparent text-white/45 hover:text-white/80"
                      }`}
                    >
                      {s.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="min-w-0 max-w-3xl">
            {policy.sections.map((s) => (
              <motion.article
                key={s.id}
                id={s.id}
                {...reveal}
                className="scroll-mt-28 border-t border-white/10 py-8 first:border-t-0 first:pt-0"
              >
                <h3 className="text-xl font-bold leading-tight text-white md:text-2xl">{s.title}</h3>
                <div className={policyProse}>
                  <PolicyBlocks blocks={s.blocks} />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicySection;
