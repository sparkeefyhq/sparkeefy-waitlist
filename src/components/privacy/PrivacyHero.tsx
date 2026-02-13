"use client";

import React from "react";
import { useMediaQuery } from "react-responsive";
import PrivacyHeroDesktop from "./PrivacyHeroDesktop";
import PrivacyHeroMobile from "./PrivacyHeroMobile";

const PrivacyHero = () => {
  const [mounted, setMounted] = React.useState(false);
  const isMobile = useMediaQuery({ maxWidth: 1024 }); // Threshold for desktop parallax

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by rendering a placeholder or matching layout
  if (!mounted) {
    return (
      <div className="relative min-h-screen w-full bg-[#010302]" />
    );
  }

  return isMobile ? <PrivacyHeroMobile /> : <PrivacyHeroDesktop />;
};

export default PrivacyHero;
