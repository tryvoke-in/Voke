"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export interface ScrollSplitCardItem {
  title?: string;
  description?: string;
  bgColor?: string;
  textColor?: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

export interface ScrollSplitCardProps {
  className?: string;
  cardsContainerClassName?: string;
  imageSrc?: string;
  frontContent?: React.ReactNode;
  cards: ScrollSplitCardItem[];
  containerRef?: React.RefObject<HTMLElement | null>;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ScrollSplitCard({
  className,
  cardsContainerClassName,
  imageSrc,
  frontContent,
  cards,
  containerRef: externalContainerRef,
  header,
  footer,
}: ScrollSplitCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    container: externalContainerRef,
    offset: ["start start", "end end"],
  });

  // Butter-smooth physics spring to eliminate all scroll/trackpad jitter
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.5,
    restDelta: 0.001,
  });

  // Stage 1 (0 to 0.35): Separation
  const leftX = useTransform(smoothProgress, [0, 0.35, 0.72], [0, -42, -20]);
  const rightX = useTransform(smoothProgress, [0, 0.35, 0.72], [0, 42, 20]);
  const scale = useTransform(smoothProgress, [0, 0.35, 0.72], [1, 0.94, 0.98]);

  // Stage 2 (0.32 to 0.72): 3D Flip 180°
  const rotateY = useTransform(smoothProgress, [0.32, 0.72], [0, 180]);
  // Tilts during the flip, returns to exactly 0 when finished so revealed cards are upright
  const rotateZLeft = useTransform(smoothProgress, [0.32, 0.52, 0.72], [0, 4, 0]);
  const rotateZRight = useTransform(smoothProgress, [0.32, 0.52, 0.72], [0, -4, 0]);

  // Dynamic borders/radii so it looks like ONE flat image initially
  const borderRadiusLeft = useTransform(smoothProgress, [0, 0.25], ["24px 0px 0px 24px", "28px 28px 28px 28px"]);
  const borderRadiusMiddle = useTransform(smoothProgress, [0, 0.25], ["0px 0px 0px 0px", "28px 28px 28px 28px"]);
  const borderRadiusRight = useTransform(smoothProgress, [0, 0.25], ["0px 24px 24px 0px", "28px 28px 28px 28px"]);
  const shadowOpacity = useTransform(smoothProgress, [0, 0.25], [0, 0.35]);

  // Prevent subpixel hairline gaps & backface bleeding before scroll
  const underlayOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);
  const backOpacity = useTransform(smoothProgress, [0.18, 0.32], [0, 1]);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-[220vh] w-full", className)}
    >
      {/* Sticky Viewport Container with navbar clearance */}
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center pt-16 sm:pt-20 pb-4 sm:pb-6 px-4 sm:px-6 overflow-visible [perspective:1400px]">

        {/* Top Header - safely cleared below floating navbar */}
        {header && (
          <div className="relative z-30 w-full mb-4 sm:mb-6 text-center shrink-0">
            {header}
          </div>
        )}

        {/* 3 Split & Flip Cards Container */}
        <motion.div
          style={{ scale, transformStyle: "preserve-3d" }}
          className={cn(
            "flex h-[520px] sm:h-[570px] lg:h-[610px] xl:h-[640px] w-full max-w-6xl lg:max-w-7xl relative",
            cardsContainerClassName
          )}
        >
          {/* Seamless dark underlay to prevent subpixel seam rendering before cards split */}
          <motion.div
            style={{
              opacity: underlayOpacity,
            }}
            className="absolute inset-0 bg-[#05070c] rounded-[24px] sm:rounded-[28px] border border-emerald-500/30 pointer-events-none -z-10"
          />

          {cards.slice(0, 3).map((card, i) => (
            <motion.div
              key={i}
              className="relative h-full flex-1 will-change-transform"
              style={{
                x: i === 0 ? leftX : i === 2 ? rightX : 0,
                rotateY,
                rotateZ: i === 0 ? rotateZLeft : i === 2 ? rotateZRight : 0,
                zIndex: i === 1 ? 10 : 5,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Front Side: Split Image */}
              <motion.div
                className="absolute -inset-x-[1px] inset-y-0 overflow-hidden [backface-visibility:hidden] pointer-events-none will-change-transform"
                style={{
                  zIndex: 2,
                  borderRadius: i === 0 ? borderRadiusLeft : i === 2 ? borderRadiusRight : borderRadiusMiddle,
                  transform: "translateZ(2px)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div
                  className="absolute inset-0 h-full w-[300%]"
                  style={{
                    left: `${-100 * i}%`,
                    backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {frontContent}
                </div>
                {/* GPU-accelerated shadow overlay instead of expensive CSS string template */}
                <motion.div
                  className="absolute inset-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45),inset_0_-24px_48px_rgba(0,0,0,0.35)] pointer-events-none rounded-[inherit]"
                  style={{ opacity: shadowOpacity }}
                />
              </motion.div>

              {/* Back Side: Rich Content / Pricing Tier Card */}
              <motion.div
                className={cn(
                  "absolute inset-0 overflow-hidden flex flex-col [backface-visibility:hidden] will-change-transform pointer-events-auto",
                  i === 1
                    ? "border-2 border-[#0F6B38] shadow-[0_20px_45px_rgba(0,59,45,0.12)] rounded-[24px] sm:rounded-[28px]"
                    : "border border-[#DCE7DF] shadow-[0_12px_32px_rgba(0,59,45,0.07)] rounded-[24px] sm:rounded-[28px]"
                )}
                style={{
                  backgroundColor: card.bgColor || "#ffffff",
                  color: card.textColor || "#003B2D",
                  transform: "rotateY(180deg) translateZ(1px)",
                  zIndex: i === 1 ? 10 : 2,
                  borderRadius: i === 0 ? borderRadiusLeft : i === 2 ? borderRadiusRight : borderRadiusMiddle,
                  opacity: backOpacity,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                {card.content ? (
                  card.content
                ) : (
                  <div className="flex flex-col justify-end p-8 h-full">
                    <div className="relative z-10 mb-auto">{card.icon}</div>
                    <h3 className="relative z-10 mb-4 text-2xl font-medium leading-tight">
                      {card.title}
                    </h3>
                    <p className="relative z-10 text-sm opacity-80">{card.description}</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Optional Ending Footer */}
        {footer && (
          <div className="w-full mt-3 text-center pointer-events-auto z-20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
