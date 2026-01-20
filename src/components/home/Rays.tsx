'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RaysProps {
  className?: string;
}

const Rays = ({ className }: RaysProps) => {
  // Fewer rays with random-ish positions (not evenly spaced)
  const rays = [
    { id: 1, top: '5%', delay: 0, duration: 6, width: 'thick' },
    { id: 2, top: '18%', delay: 2, duration: 5, width: 'medium' },
    { id: 3, top: '35%', delay: 4, duration: 7, width: 'thick' },
    { id: 4, top: '48%', delay: 1, duration: 5.5, width: 'thin' },
    { id: 5, top: '65%', delay: 3.5, duration: 6.5, width: 'medium' },
    { id: 6, top: '82%', delay: 5, duration: 5, width: 'thick' },
    { id: 7, top: '95%', delay: 2.5, duration: 6, width: 'thin' },
  ];

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Rays with staggered fade in/out animation */}
      <div className="rays-container">
        {rays.map((ray) => (
          <div 
            key={ray.id} 
            className={`ray ray-${ray.width}`}
            style={{
              top: ray.top,
              animationDelay: `${ray.delay}s`,
              animationDuration: `${ray.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Background glow at bottom center */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100%] h-[70%] bg-gradient-to-t from-pink-600/40 via-pink-500/20 to-transparent blur-[100px]" />

      {/* TOP FADE */}
      <div className="absolute top-0 left-0 right-0 h-[120px] bg-gradient-to-b from-[#0a0008] via-[#0a0008]/70 to-transparent pointer-events-none z-10" />

      {/* BOTTOM FADE */}
      <div className="absolute bottom-0 left-0 right-0 h-[150px] bg-gradient-to-t from-[#0a0008] via-[#0a0008]/50 to-transparent pointer-events-none z-10" />

      <style jsx>{`
        .rays-container {
          position: absolute;
          inset: 0;
          transform: rotate(35deg);
          transform-origin: center center;
        }

        .ray {
          position: absolute;
          left: -100%;
          width: 300%;
          /* Gradient: bright on left, fades to right */
          background: linear-gradient(
            90deg,
            rgba(236, 72, 153, 0.7) 0%,
            rgba(236, 72, 153, 0.6) 15%,
            rgba(236, 72, 153, 0.5) 30%,
            rgba(236, 72, 153, 0.35) 45%,
            rgba(236, 72, 153, 0.2) 60%,
            rgba(236, 72, 153, 0.1) 75%,
            rgba(236, 72, 153, 0.03) 90%,
            transparent 100%
          );
          /* Sequential fade in/out - one appears then disappears */
          animation: ray-sequence ease-in-out infinite;
          opacity: 0;
        }

        /* Different thicknesses */
        .ray-thin {
          height: 20px;
          filter: blur(15px);
        }

        .ray-medium {
          height: 40px;
          filter: blur(25px);
        }

        .ray-thick {
          height: 60px;
          filter: blur(35px);
        }

        /* Sequential animation - ray fades in, stays, fades out */
        @keyframes ray-sequence {
          0% { 
            opacity: 0;
            transform: scaleY(0.5);
          }
          15% { 
            opacity: 1;
            transform: scaleY(1);
          }
          35% { 
            opacity: 1;
            transform: scaleY(1.5);
          }
          50% { 
            opacity: 0.8;
            transform: scaleY(1.2);
          }
          70% { 
            opacity: 0.3;
            transform: scaleY(0.8);
          }
          100% { 
            opacity: 0;
            transform: scaleY(0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default Rays;
