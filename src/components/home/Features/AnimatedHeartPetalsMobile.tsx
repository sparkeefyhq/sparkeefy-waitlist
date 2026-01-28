import React from "react";
import { AnimatedHeartPetals } from "./AnimatedHeartPetals";

// Mobile-specific wrapper for heart petals animation with scaling and positioning
export const AnimatedHeartPetalsMobile = ({ color = "#FF148A" }: { color?: string }) => (
  <div className="absolute right-1 -top-2 md:hidden scale-[0.30] origin-bottom-left">
    <AnimatedHeartPetals color={color} />
  </div>
);
