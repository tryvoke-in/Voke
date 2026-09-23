import React, { useLayoutEffect, useEffect, useRef, useCallback } from 'react';
import './ScrollStack.css';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface ScrollStackItemProps {
  children: React.ReactNode;
  itemClassName?: string;
  style?: React.CSSProperties;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({
  children,
  itemClassName = '',
  style
}) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()} style={style}>
    {children}
  </div>
);

export interface ScrollStackProps {
  children: React.ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
  onActiveIndexChange?: (index: number) => void;
}

export const ScrollStack: React.FC<ScrollStackProps> = React.memo(({
  children,
  className = '',
  itemDistance = 80,
  itemScale = 0.03,
  itemStackDistance = 22,
  stackPosition = '18%',
  baseScale = 0.88,
  rotationAmount = 0.5,
  useWindowScroll = true,
  onStackComplete,
  onActiveIndexChange
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wrapperRefs = useRef<HTMLElement[]>([]);
  const cardRefs = useRef<HTMLElement[]>([]);
  const currentActiveIndexRef = useRef<number>(0);
  const stackCompletedRef = useRef<boolean>(false);

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return typeof value === 'number' ? value : parseFloat(value);
  }, []);

  const updateCardTransforms = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !cardRefs.current.length || !wrapperRefs.current.length) return;

    const containerHeight = window.innerHeight;
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const totalCards = cardRefs.current.length;

    const scrollerRect = scroller.getBoundingClientRect();

    // Skip if totally off-screen
    if (scrollerRect.bottom < -200 || scrollerRect.top > containerHeight + 200) {
      return;
    }

    const endRect = endRef.current?.getBoundingClientRect();
    const releaseTop = endRect ? endRect.top : scrollerRect.bottom;

    let activeIdx = 0;

    for (let i = 0; i < totalCards; i++) {
      const wrapper = wrapperRefs.current[i];
      const card = cardRefs.current[i];
      if (!wrapper || !card) continue;

      const wrapperRect = wrapper.getBoundingClientRect();
      const naturalTop = wrapperRect.top;
      const targetPinTop = stackPositionPx + itemStackDistance * i;

      // Pinned condition
      if (naturalTop <= targetPinTop && releaseTop > targetPinTop + 80) {
        const translateY = targetPinTop - naturalTop;
        const targetScale = baseScale + i * itemScale;
        const rot = rotationAmount ? (i % 2 === 0 ? 0.4 : -0.4) * (i + 1) * rotationAmount : 0;

        card.style.transform = `translate3d(0, ${Math.round(translateY * 10) / 10}px, 0) scale(${targetScale}) rotate(${rot}deg)`;
        activeIdx = i;
      } else if (releaseTop <= targetPinTop + 80) {
        // Releasing smoothly past end of stack
        const translateY = releaseTop - 80 - naturalTop;
        const targetScale = baseScale + i * itemScale;
        const rot = rotationAmount ? (i % 2 === 0 ? 0.4 : -0.4) * (i + 1) * rotationAmount : 0;

        card.style.transform = `translate3d(0, ${Math.round(translateY * 10) / 10}px, 0) scale(${targetScale}) rotate(${rot}deg)`;
        activeIdx = Math.max(activeIdx, i);
      } else {
        // Natural resting position before reaching the stack
        card.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
      }
    }

    if (currentActiveIndexRef.current !== activeIdx) {
      currentActiveIndexRef.current = activeIdx;
      onActiveIndexChange?.(activeIdx);
    }

    // Check completion trigger
    if (activeIdx === totalCards - 1 && !stackCompletedRef.current) {
      stackCompletedRef.current = true;
      onStackComplete?.();
    }
  }, [
    stackPosition,
    itemStackDistance,
    baseScale,
    itemScale,
    rotationAmount,
    onActiveIndexChange,
    onStackComplete,
    parsePercentage
  ]);

  useIsomorphicLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const wrappers = Array.from(scroller.querySelectorAll<HTMLElement>('.scroll-stack-card-wrapper'));
    const cards = Array.from(scroller.querySelectorAll<HTMLElement>('.scroll-stack-card'));

    wrapperRefs.current = wrappers;
    cardRefs.current = cards;

    wrappers.forEach((wrapper, i) => {
      if (i < wrappers.length - 1) {
        wrapper.style.marginBottom = `${itemDistance}px`;
      }
      wrapper.style.zIndex = `${i + 1}`;
    });

    cards.forEach((card, i) => {
      card.style.zIndex = `${i + 1}`;
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transform = 'translate3d(0, 0, 0)';
    });

    const onScrollTick = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateCardTransforms);
    };

    const onResize = () => {
      onScrollTick();
    };

    if (useWindowScroll) {
      window.addEventListener('scroll', onScrollTick, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
    } else {
      scroller.addEventListener('scroll', onScrollTick, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
    }

    // Initial position trigger
    updateCardTransforms();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (useWindowScroll) {
        window.removeEventListener('scroll', onScrollTick);
        window.removeEventListener('resize', onResize);
      } else {
        scroller.removeEventListener('scroll', onScrollTick);
        window.removeEventListener('resize', onResize);
      }
      stackCompletedRef.current = false;
      wrapperRefs.current = [];
      cardRefs.current = [];
    };
  }, [itemDistance, useWindowScroll, updateCardTransforms]);

  const childArray = React.Children.toArray(children);

  return (
    <div
      className={`scroll-stack-scroller${useWindowScroll ? ' scroll-stack-scroller--window' : ''} ${className}`.trim()}
      ref={scrollerRef}
    >
      <div className="scroll-stack-inner">
        {childArray.map((child, index) => (
          <div
            key={index}
            className="scroll-stack-card-wrapper"
            style={{ zIndex: index + 1 }}
          >
            {child}
          </div>
        ))}
        {/* Spacer so cards have runway to stack before releasing */}
        <div className="scroll-stack-end" ref={endRef} />
      </div>
    </div>
  );
});

export default ScrollStack;
