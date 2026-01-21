"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  // Rays with random-ish positions (same as Rays.tsx)
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
    <div
      className={cn(
        "transition-bg relative flex min-h-screen flex-col items-center justify-center bg-[#0a0008] text-white",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        {/* Rays - same style as Rays.tsx */}
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

        {/* Aurora glow layer */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                100deg,
                transparent 0%,
                rgba(219, 39, 119, 0.15) 10%,
                rgba(236, 72, 153, 0.25) 20%,
                rgba(244, 114, 182, 0.15) 30%,
                transparent 40%,
                rgba(190, 24, 93, 0.15) 50%,
                rgba(219, 39, 119, 0.25) 60%,
                rgba(236, 72, 153, 0.15) 70%,
                transparent 80%
              )
            `,
            backgroundSize: '400% 100%',
            animation: 'aurora 45s ease-in-out infinite',
            filter: 'blur(40px)',
          }}
        />

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100%] h-[70%] bg-gradient-to-t from-pink-600/40 via-pink-500/20 to-transparent blur-[100px]" />

        {/* TOP FADE */}
        <div className="absolute top-0 left-0 right-0 h-[120px] bg-gradient-to-b from-[#0a0008] via-[#0a0008]/70 to-transparent pointer-events-none z-10" />

        {/* BOTTOM FADE */}
        <div className="absolute bottom-0 left-0 right-0 h-[150px] bg-gradient-to-t from-[#0a0008] via-[#0a0008]/50 to-transparent pointer-events-none z-10" />
      </div>
      
      {/* Styles - copied from Rays.tsx */}
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
          animation: ray-sequence ease-in-out infinite;
          opacity: 0;
        }

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

        @keyframes aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      {children}
    </div>
  );
};
