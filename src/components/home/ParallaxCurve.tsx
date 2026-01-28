import React from "react";

const ParallaxCurve = () => {
  return (
    <div className="w-full relative h-16 md:h-36">
      {/* Mobile curve - gentler/flatter arc */}
      <svg
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block md:hidden"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="curveGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%">
              <animate
                attributeName="stop-color"
                values="#00C9D2;#F4B763;#FF66B2;#00C9D2"
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%">
              <animate
                attributeName="stop-color"
                values="#F4B763;#FF66B2;#00C9D2;#F4B763"
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%">
              <animate
                attributeName="stop-color"
                values="#FF66B2;#00C9D2;#F4B763;#FF66B2"
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
        {/* White fill below the curve to cover corners */}
        <path
          d="M0 10 Q720 70 1440 10 L1440 80 L0 80 Z"
          fill="white"
        />
        {/* Gradient stroke curve on top - gentler curve */}
        <path
          d="M0 10 Q720 70 1440 10"
          stroke="url(#curveGradientMobile)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Desktop curve - deeper arc */}
      <svg
        viewBox="0 0 1440 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full hidden md:block"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%">
              <animate
                attributeName="stop-color"
                values="#00C9D2;#F4B763;#FF66B2;#00C9D2"
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%">
              <animate
                attributeName="stop-color"
                values="#F4B763;#FF66B2;#00C9D2;#F4B763"
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%">
              <animate
                attributeName="stop-color"
                values="#FF66B2;#00C9D2;#F4B763;#FF66B2"
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
        {/* White fill below the curve to cover corners */}
        <path
          d="M0 10 Q720 160 1440 10 L1440 140 L0 140 Z"
          fill="white"
        />
        {/* Gradient stroke curve on top */}
        <path
          d="M0 10 Q720 160 1440 10"
          stroke="url(#curveGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export default ParallaxCurve;
