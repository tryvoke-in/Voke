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
}

export const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = '',
  itemDistance = 60,
  itemScale = 0.03,
  itemStackDistance = 22,
  stackPosition = '18%',
  scaleEndPosition = '8%',
  baseScale = 0.88,
  rotationAmount = 0.5,
  blurAmount = 0,
  useWindowScroll = true,
  onStackComplete
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const wrapperRefs = useRef<HTMLElement[]>([]);
  const cardRefs = useRef<HTMLElement[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const lastTransformsRef = useRef<Map<number, { translateY: number; scale: number; rotation: number; blur: number }>>(new Map());
  const isUpdatingRef = useRef(false);

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return typeof value === 'number' ? value : parseFloat(value);
  }, []);

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY || document.documentElement.scrollTop,
        containerHeight: window.innerHeight
      };
    } else {
      const scroller = scrollerRef.current;
      return {
        scrollTop: scroller ? scroller.scrollTop : 0,
        containerHeight: scroller ? scroller.clientHeight : 500
      };
    }
  }, [useWindowScroll]);

  const getElementOffset = useCallback(
    (element: HTMLElement) => {
      if (useWindowScroll) {
        const rect = element.getBoundingClientRect();
        return rect.top + (window.scrollY || document.documentElement.scrollTop);
      } else {
        return element.offsetTop;
      }
    },
    [useWindowScroll]
  );

  const updateCardTransforms = useCallback(() => {
    if (!cardRefs.current.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const { scrollTop, containerHeight } = getScrollData();
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);

    const endElement = endRef.current;
    const endElementTop = endElement ? getElementOffset(endElement) : 0;
    const totalCards = cardRefs.current.length;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const wrapper = wrapperRefs.current[i] || card;
      const cardTop = getElementOffset(wrapper);

      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinStart = cardTop - stackPositionPx - itemStackDistance * i;
      const pinEnd = endElementTop - stackPositionPx - itemStackDistance * totalCards - 40;

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = baseScale + i * itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? (i % 2 === 0 ? 1 : -1) * (i * 0.4 + 0.4) * rotationAmount * scaleProgress : 0;

      let blur = 0;
      if (blurAmount) {
        let topCardIndex = 0;
        for (let j = 0; j < totalCards; j++) {
          const jWrapper = wrapperRefs.current[j] || cardRefs.current[j];
          if (jWrapper) {
            const jCardTop = getElementOffset(jWrapper);
            const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j;
            if (scrollTop >= jTriggerStart) {
              topCardIndex = j;
            }
          }
        }

        if (i < topCardIndex) {
          const depthInStack = topCardIndex - i;
          blur = Math.max(0, depthInStack * blurAmount);
        }
      }

      let translateY = 0;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i;
      }

      const newTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
        Math.abs(lastTransform.blur - newTransform.blur) > 0.1;

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
        const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : '';

        card.style.transform = transform;
        if (card.style.filter !== filter) {
          card.style.filter = filter;
        }

        lastTransformsRef.current.set(i, newTransform);
      }

      if (i === totalCards - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    onStackComplete,
    calculateProgress,
    parsePercentage,
    getScrollData,
    getElementOffset
  ]);

  useIsomorphicLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const wrappers = Array.from(scroller.querySelectorAll<HTMLElement>('.scroll-stack-card-wrapper'));
    const cards = Array.from(scroller.querySelectorAll<HTMLElement>('.scroll-stack-card'));

    wrapperRefs.current = wrappers;
    cardRefs.current = cards;
    const transformsCache = lastTransformsRef.current;

    wrappers.forEach((wrapper, i) => {
      if (i < wrappers.length - 1) {
        wrapper.style.marginBottom = `${itemDistance}px`;
      }
    });

    cards.forEach((card, i) => {
      card.style.zIndex = `${i + 1}`;
      card.style.willChange = 'transform';
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

    if (useWindowScroll) {
      window.addEventListener('scroll', onScrollTick, { passive: true });
      window.addEventListener('resize', onScrollTick, { passive: true });
    } else {
      scroller.addEventListener('scroll', onScrollTick, { passive: true });
      window.addEventListener('resize', onScrollTick, { passive: true });
    }

    // Initial positioning
    updateCardTransforms();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (useWindowScroll) {
        window.removeEventListener('scroll', onScrollTick);
        window.removeEventListener('resize', onScrollTick);
      } else {
        scroller.removeEventListener('scroll', onScrollTick);
        window.removeEventListener('resize', onScrollTick);
      }
      stackCompletedRef.current = false;
      wrapperRefs.current = [];
      cardRefs.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemDistance,
    useWindowScroll,
    updateCardTransforms
  ]);

  // Wrap each child in a stable layout wrapper
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
        {/* Spacer so the last card finishes pinning before releasing */}
        <div className="scroll-stack-end" ref={endRef} />
      </div>
    </div>
  );
};

export default ScrollStack;
