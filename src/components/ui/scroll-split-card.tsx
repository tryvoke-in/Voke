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
  const [isFlipped, setIsFlipped] = React.useState(false);

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

  // Once flip finishes (progress >= 0.70), switch from 3D GPU texture to native 2D DOM rendering for razor-sharp vector text
  React.useEffect(() => {
    return smoothProgress.on("change", (latest) => {
      const flipped = latest >= 0.70;
      setIsFlipped((prev) => (prev !== flipped ? flipped : prev));
    });
  }, [smoothProgress]);

  // Stage 1 (0 to 0.35): Separation
  const leftX = useTransform(smoothProgress, [0, 0.35, 0.72], [0, -42, -20]);
  const rightX = useTransform(smoothProgress, [0, 0.35, 0.72], [0, 42, 20]);
  const scale = useTransform(smoothProgress, [0, 0.35, 0.72], [1, 0.95, 1]);

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
      {/* Sticky Viewport Container - perspective removed when flipped so text is never blurred by 3D projection */}
      <div
        className={cn(
          "sticky top-0 flex h-screen w-full flex-col items-center justify-center pt-16 sm:pt-20 pb-4 sm:pb-6 px-4 sm:px-6 overflow-visible",
          !isFlipped && "[perspective:1400px]"
        )}
      >

        {/* Top Header - safely cleared below floating navbar */}
        {header && (
          <div className="relative z-30 w-full mb-4 sm:mb-6 text-center shrink-0">
            {header}
          </div>
        )}

        {/* 3 Split & Flip Cards Container */}
        <motion.div
          style={{
            scale: isFlipped ? 1 : scale,
            transformStyle: isFlipped ? "flat" : "preserve-3d"
          }}
          className={cn(
            "flex h-[530px] sm:h-[580px] lg:h-[610px] xl:h-[625px] w-full max-w-6xl lg:max-w-7xl relative",
            cardsContainerClassName
          )}
        >
          {/* Seamless dark underlay to prevent subpixel seam rendering before cards split */}
          <motion.div
            style={{
              opacity: isFlipped ? 0 : underlayOpacity,
            }}
            className="absolute inset-0 bg-[#05070c] rounded-[24px] sm:rounded-[28px] border border-emerald-500/30 pointer-events-none -z-10"
          />

          {cards.slice(0, 3).map((card, i) => (
            <motion.div
              key={i}
              className="relative h-full flex-1"
              style={{
                x: i === 0 ? leftX : i === 2 ? rightX : 0,
                rotateY: isFlipped ? 0 : rotateY,
                rotateZ: isFlipped ? 0 : (i === 0 ? rotateZLeft : i === 2 ? rotateZRight : 0),
                zIndex: i === 1 ? 10 : 5,
                transformStyle: isFlipped ? "flat" : "preserve-3d",
              }}
            >
              {/* Front Side: Split Image */}
              <motion.div
                className={cn(
                  "absolute -inset-x-[1px] inset-y-0 overflow-hidden pointer-events-none",
                  isFlipped ? "hidden" : "[backface-visibility:hidden]"
                )}
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

              {/* Back Side: Rich Content / Pricing Tier Card (Crystal Sharp Native 2D Vector Text) */}
              <motion.div
                className={cn(
                  "absolute inset-0 overflow-hidden flex flex-col pointer-events-auto select-text",
                  !isFlipped && "[backface-visibility:hidden]",
                  i === 1
                    ? "border-2 border-[#0F6B38] shadow-[0_24px_55px_rgba(15,107,56,0.18),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-[#0F6B38]/20 rounded-[24px] sm:rounded-[28px]"
                    : "border border-[#DCE7DF] shadow-[0_12px_32px_rgba(0,59,45,0.07)] rounded-[24px] sm:rounded-[28px]"
                )}
                style={{
                  backgroundColor: card.bgColor || "#ffffff",
                  color: card.textColor || "#003B2D",
                  transform: isFlipped ? "none" : "rotateY(180deg)",
                  zIndex: i === 1 ? 10 : 2,
                  borderRadius: i === 0 ? borderRadiusLeft : i === 2 ? borderRadiusRight : borderRadiusMiddle,
                  opacity: isFlipped ? 1 : backOpacity,
                  backfaceVisibility: isFlipped ? "visible" : "hidden",
                  WebkitBackfaceVisibility: isFlipped ? "visible" : "hidden",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                  textRendering: "optimizeLegibility",
                }}
              >
                {card.content ? (
                  card.content
                ) : (
                  <div className="flex flex-col justify-end p-8 h-full select-text">
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
