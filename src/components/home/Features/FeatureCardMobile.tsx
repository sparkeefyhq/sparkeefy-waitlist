"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { 
  EffectCards, 
  EffectCoverflow, 
  EffectFlip, 
  EffectCube, 
  EffectCreative, 
  Pagination, 
  Autoplay 
} from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { featureCards } from "./data";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/effect-coverflow";
import "swiper/css/effect-flip";
import "swiper/css/effect-cube";
import "swiper/css/effect-creative";
import "swiper/css/pagination";

// Available effect variants
export type EffectVariant = "cards" | "coverflow" | "flip" | "cube" | "creative";

interface FeatureCardMobileProps {
  onSlideChange?: (index: number) => void;
  activeIndex?: number;
  /** 
   * Animation effect variant:
   * - cards: Tinder-like stacked cards
   * - coverflow: 3D album cover flow
   * - flip: 3D page flip
   * - cube: 3D cube rotation
   * - creative: Custom slide + rotate animation
   */
  effect?: EffectVariant;
}

// Effect-specific configurations
const getEffectConfig = (effect: EffectVariant) => {
  switch (effect) {
    case "cards":
      return {
        modules: [EffectCards, Pagination, Autoplay],
        effectProps: {
          cardsEffect: {
            slideShadows: false,
            perSlideOffset: 8,
            perSlideRotate: 2,
          },
        },
        slideStyle: undefined,
        centeredSlides: false,
        slidesPerView: 1 as const,
      };
    case "coverflow":
      return {
        modules: [EffectCoverflow, Pagination, Autoplay],
        effectProps: {
          coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2.5,
            slideShadows: false,
          },
        },
        slideStyle: { width: '85%', maxWidth: '360px' },
        centeredSlides: true,
        slidesPerView: "auto" as const,
      };
    case "flip":
      return {
        modules: [EffectFlip, Pagination, Autoplay],
        effectProps: {
          flipEffect: {
            slideShadows: false,
            limitRotation: true,
          },
        },
        slideStyle: undefined,
        centeredSlides: false,
        slidesPerView: 1 as const,
      };
    case "cube":
      return {
        modules: [EffectCube, Pagination, Autoplay],
        effectProps: {
          cubeEffect: {
            shadow: false,
            slideShadows: false,
            shadowOffset: 20,
            shadowScale: 0.94,
          },
        },
        slideStyle: undefined,
        centeredSlides: false,
        slidesPerView: 1 as const,
      };
    case "creative":
      return {
        modules: [EffectCreative, Pagination, Autoplay],
        effectProps: {
          creativeEffect: {
            prev: {
              shadow: false,
              translate: ["-120%", 0, -500],
              rotate: [0, 0, -15],
              opacity: 0,
            },
            next: {
              shadow: false,
              translate: ["120%", 0, -500],
              rotate: [0, 0, 15],
              opacity: 0,
            },
          },
        },
        slideStyle: undefined,
        centeredSlides: false,
        slidesPerView: 1 as const,
      };
  }
};

export const FeatureCardMobile = ({
  onSlideChange,
  activeIndex = 0,
  effect = "creative", // Default effect
}: FeatureCardMobileProps) => {
  const swiperRef = React.useRef<SwiperType | null>(null);


  const config = getEffectConfig(effect);

  // Sync external activeIndex to swiper
  React.useEffect(() => {
    if (swiperRef.current && swiperRef.current.activeIndex !== activeIndex) {
      swiperRef.current.slideTo(activeIndex);
    }
  }, [activeIndex]);

  const handleSlideChange = (swiper: SwiperType) => {
    onSlideChange?.(swiper.activeIndex);
  };

  return (
    <div className="w-full">
      <Swiper
        effect={effect}
        grabCursor={true}
        centeredSlides={config.centeredSlides}
        slidesPerView={config.slidesPerView}
        modules={config.modules}
        className="w-full h-[32rem]"
        {...config.effectProps}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        speed={500}
        autoplay={{
          delay: 5000,
          disableOnInteraction: true,
          pauseOnMouseEnter: true,
        }}
      >
        {featureCards.map((card, index) => (
          <SwiperSlide 
            key={card.id} 
            className="rounded-2xl overflow-hidden"
            style={config.slideStyle}
          >
            <div
              className={`w-full h-full rounded-2xl p-5 py-8 pb-6 ${card.gradient} shadow-2xl flex flex-col`}
            >
              {/* Sun Ray Overlay */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(200px circle at top left, rgba(255,255,255,0.15) 0%, transparent 100%)",
                }}
              />

              {/* Text content */}
              <div className="relative z-10 text-center">
                <h3 className="text-2xl font-bold text-white mb-1 leading-none">
                  {card.title}
                </h3>
                <h3
                  className="text-2xl font-bold mb-3 bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${card.gradientStartColor} 0%, #FFFFFF 55%)`,
                  }}
                >
                  {card.subtitle}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-4 font-normal px-2">
                  {card.description}{" "}
                  <span className="font-semibold">{card.highlight}</span>
                </p>
                <button
                  className="group relative cursor-pointer inline-flex items-center justify-center overflow-hidden px-4 py-2 rounded-full text-black bg-white text-sm font-medium transition-all min-w-[120px]"
                  onClick={() => window.open("/about")}
                >
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    Know More
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M6.11279 16.7836L10.9128 11.9836L6.11279 7.18359M12.8328 16.7836L17.6328 11.9836L12.8328 7.18359"
                        stroke="currentColor"
                        strokeWidth="1.44"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Feature illustration image */}
              {card.image && (
                <div className="flex-1 w-full flex items-end justify-center pointer-events-none mt-4 relative min-h-0">
                  <div className="relative h-full w-full">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-contain object-bottom"
                      sizes="80vw"
                      priority={index === 0}
                    />
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Pagination Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {featureCards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => swiperRef.current?.slideTo(index)}
            className="transition-all duration-300"
            aria-label={`Go to ${card.tab}`}
          >
            <div
              className={`rounded-full transition-all duration-300 ${
                activeIndex === index ? "w-6 h-2" : "w-2 h-2"
              }`}
              style={{
                backgroundColor:
                  activeIndex === index ? card.accentColor : "#D1D5DB",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
