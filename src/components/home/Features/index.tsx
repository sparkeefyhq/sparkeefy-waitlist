"use client";

import React from "react";
import { useMediaQuery } from "react-responsive";
import { FeatureTabs } from "./FeatureTabs";
import { FeatureTabsMobile, type EffectVariant } from "./FeatureTabsMobile";

/**
 * Mobile animation effect variant. Choose from:
 * - "cards"     : Tinder-like stacked cards
 * - "coverflow" : 3D album cover flow  
 * - "flip"      : 3D page flip
 * - "cube"      : 3D cube rotation
 * - "creative"  : Custom slide + rotate animation
 */
const MOBILE_EFFECT: EffectVariant = "coverflow";

const Features = () => {
  const [mounted, setMounted] = React.useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show nothing during SSR/hydration to prevent mismatch
  if (!mounted) {
    return (
      <section id="features" className="relative w-full bg-white pt-0 pb-0 md:pt-34 md:pb-32 overflow-x-clip md:overflow-visible -mt-1">
        <div className="h-[300vh] md:h-[250vh]" />
      </section>
    );
  }

  return (
    <section id="features" className="relative w-full bg-white pt-0 pb-0 md:pt-34 md:pb-32 overflow-x-clip md:overflow-visible -mt-1">
      {isMobile ? <FeatureTabsMobile effect={MOBILE_EFFECT} /> : <FeatureTabs />}
    </section>
  );
};

export default Features;

