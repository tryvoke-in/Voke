import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import './AccordionGallery.css';

export interface AccordionGalleryItem {
  image: string;
  label: string;
  badge?: string;
  tag?: string;
  description?: string;
  link?: string;
  ctaText?: string;
  alt?: string;
  accentColor?: string;
}

export interface AccordionGalleryProps {
  items?: AccordionGalleryItem[];
  defaultIndex?: number;
  accentColor?: string;
  overlayColor?: string;
  textColor?: string;
  height?: number;
  gap?: number;
  radius?: number;
  expandRatio?: number;
  orientation?: 'horizontal' | 'vertical';
  duration?: number;
  ease?: string;
  parallax?: number;
  tilt?: number;
  trigger?: 'hover' | 'click';
  showLabels?: boolean;
  grayscale?: boolean;
  className?: string;
  onItemClick?: (item: AccordionGalleryItem, index: number) => void;
}

const DEFAULT_ITEMS: AccordionGalleryItem[] = [
  {
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=700&auto=format&fit=crop',
    label: 'AI Video & Voice Interviews',
    badge: 'Live Simulation',
    description: 'Realistic face-to-face AI mock interview rounds with real-time speech cadence, audio analysis, and live video feedback.',
    link: '/voice-assistant',
    ctaText: 'Start Interview'
  },
  {
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=700&auto=format&fit=crop',
    label: 'Elite DSA & Monaco Code IDE',
    badge: 'Live Compiler',
    description: 'Multi-language coding sandbox with automated test case validation, complexity analysis, and algorithmic breakdowns.',
    link: '/dsa-sheet',
    ctaText: 'Explore Problems'
  },
  {
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=700&auto=format&fit=crop',
    label: 'ATS Resume Intelligence',
    badge: 'Smart Parsing',
    description: 'In-depth ATS score analysis, skill extraction, project experience deep-dives, and bullet-point rewrites.',
    link: '/resume-builder',
    ctaText: 'Analyze Resume'
  },
  {
    image: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?q=80&w=700&auto=format&fit=crop',
    label: 'GitHub Architecture Grilling',
    badge: 'Repo Integration',
    description: 'Automated GitHub repository import, scanning commit architecture, and testing your actual implementation logic.',
    link: '/interview/new',
    ctaText: 'Connect GitHub'
  },
  {
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=700&auto=format&fit=crop',
    label: 'Cognitive Body Language & Biometrics',
    badge: 'Performance Radar',
    description: 'Track eye contact stability, speech pacing, posture cues, filler words, and vocal modulation in real time.',
    link: '/progress-analytics',
    ctaText: 'View Metrics'
  },
  {
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=700&auto=format&fit=crop',
    label: 'Campus Placement Drives',
    badge: 'Enterprise Suite',
    description: 'Dedicated campus placement suite for universities with auto-domain enrollment, batch drives, and readiness dashboards.',
    link: '/college/auth',
    ctaText: 'Explore Campus Tier'
  }
];

export const AccordionGallery: React.FC<AccordionGalleryProps> = ({
  items = DEFAULT_ITEMS,
  defaultIndex = 0,
  accentColor = '#38bdf8',
  overlayColor = '#060010',
  textColor = '#ffffff',
  height = 490,
  gap = 12,
  radius = 20,
  expandRatio = 0.48,
  orientation = 'horizontal',
  duration = 0.5,
  ease = 'power2.out',
  parallax = 0.45,
  tilt = 5,
  trigger = 'hover',
  showLabels = true,
  grayscale = true,
  className = '',
  onItemClick
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaSizeRef = useRef(360);
  const isFirstRender = useRef(true);

  const vertical = orientation === 'vertical';
  const count = items.length;
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), count - 1));

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const applyLayout = useCallback(
    (animate: boolean) => {
      const panels = panelRefs.current;
      if (!panels.length) return;

      const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
      const mediaSize = mediaSizeRef.current;
      const dur = animate && !prefersReduced ? duration : 0;

      panels.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === active;
        const media = mediaRefs.current[i];
        const label = labelRefs.current[i];

        // 3D rotation calculation
        const rot = isActive ? 0 : i < active ? tilt : -tilt;
        const rotProp = vertical ? { rotateX: -rot } : { rotateY: rot };

        // Animate panel flex-grow and 3D rotation with overwrite for instantaneous response
        gsap.to(panel, {
          flexGrow: isActive ? grow : 1,
          ...rotProp,
          duration: dur,
          ease,
          overwrite: 'auto'
        });

        // Parallax media shift (pure hardware-accelerated transform)
        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i));
          const shift = drift * parallax * mediaSize * 0.05;

          gsap.to(media, {
            xPercent: -50,
            yPercent: -50,
            x: vertical ? 0 : isActive ? 0 : shift,
            y: vertical ? (isActive ? 0 : shift) : 0,
            duration: dur,
            ease,
            overwrite: 'auto'
          });
        }

        // Active label container animation
        if (showLabels && label) {
          if (isActive) {
            gsap.to(label, {
              opacity: 1,
              x: 0,
              y: 0,
              duration: dur * 0.85,
              delay: animate ? 0.04 : 0,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          } else {
            gsap.to(label, {
              opacity: 0,
              x: -10,
              y: 0,
              duration: dur * 0.4,
              ease: 'power1.in',
              overwrite: 'auto'
            });
          }
        }
      });
    },
    [
      active,
      count,
      expandRatio,
      duration,
      ease,
      vertical,
      tilt,
      parallax,
      showLabels,
      prefersReduced
    ]
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = vertical ? rect.height : rect.width;
      const usable = Math.max(total - gap * (count - 1), 120);
      const size = Math.max(160, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.25);
      mediaSizeRef.current = size;
      el.style.setProperty('--ag-media-size', `${size}px`);
      applyLayout(!isFirstRender.current);
    };

    measure();

    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 60);
    });

    ro.observe(el);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      ro.disconnect();
    };
  }, [applyLayout, gap, count, expandRatio, vertical]);

  useEffect(() => {
    applyLayout(!isFirstRender.current);
    isFirstRender.current = false;
  }, [applyLayout]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      // Clean up gsap tweens
      panelRefs.current.forEach(p => p && gsap.killTweensOf(p));
      mediaRefs.current.forEach(m => m && gsap.killTweensOf(m));
      labelRefs.current.forEach(l => l && gsap.killTweensOf(l));
    };
  }, []);

  // Smooth hover debouncer to prevent rapid fighting when cursor sweeps through
  const handleEnter = (i: number) => {
    if (trigger !== 'hover' || i === active) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActive(i);
    }, 40);
  };

  const handleLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleClick = (i: number, e: React.MouseEvent, item: AccordionGalleryItem) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (i !== active) {
      e.preventDefault();
      setActive(i);
    } else if (onItemClick) {
      onItemClick(item, i);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i + 1) % count);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i - 1 + count) % count);
    }
  };

  return (
    <div className="accordion-gallery-wrapper">
      <div
        ref={rootRef}
        className={`accordion-gallery${vertical ? ' accordion-gallery--vertical' : ''}${grayscale ? ' accordion-gallery--grayscale' : ''}${className ? ` ${className}` : ''}`}
        style={{
          '--ag-accent': accentColor,
          '--ag-overlay': overlayColor,
          '--ag-text': textColor,
          '--ag-gap': `${gap}px`,
          '--ag-radius': `${radius}px`,
          height: vertical ? `${Math.round(height * 1.5)}px` : `${height}px`
        } as React.CSSProperties}
        role="list"
        aria-label="Voke Features Accordion Gallery"
        onMouseLeave={handleLeave}
      >
        {items.map((item, i) => {
          const isActive = i === active;
          const Tag = item.link ? 'a' : 'div';
          const itemAccent = item.accentColor || accentColor;

          return (
            <Tag
              key={i}
              ref={el => { panelRefs.current[i] = el; }}
              className={`ag-panel${isActive ? ' ag-panel--active' : ''}`}
              style={{
                borderRadius: `${radius}px`,
                '--item-accent': itemAccent
              } as React.CSSProperties}
              href={item.link || undefined}
              onClick={e => handleClick(i, e, item)}
              onMouseEnter={() => handleEnter(i)}
              onFocus={() => setActive(i)}
              onKeyDown={e => handleKeyDown(i, e)}
              role="listitem"
              tabIndex={0}
              aria-current={isActive ? 'true' : undefined}
              aria-label={item.label}
            >
              <span className="ag-panel__frame">
                <span
                  className="ag-panel__media"
                  ref={el => { mediaRefs.current[i] = el; }}
                >
                  <img
                    src={item.image}
                    alt={item.alt || item.label || ''}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                </span>
                <span className="ag-panel__overlay" aria-hidden="true" />
                <span className="ag-panel__shine" aria-hidden="true" />
              </span>

              {/* Inactive collapsed vertical label pill */}
              <span className="ag-panel__collapsed-label" aria-hidden="true">
                <span className="ag-panel__collapsed-dot" />
                <span className="ag-panel__collapsed-text">{item.label}</span>
              </span>

              {/* Active expanded details container */}
              {showLabels && (
                <div
                  className="ag-panel__label"
                  ref={el => { labelRefs.current[i] = el; }}
                  aria-hidden="true"
                >
                  {item.badge && (
                    <span className="ag-panel__badge">
                      <span className="ag-panel__badge-dot" />
                      {item.badge}
                    </span>
                  )}

                  <div className="ag-panel__header-row">
                    <span className="ag-panel__bar" />
                    <span className="ag-panel__text">{item.label}</span>
                  </div>

                  {item.description && (
                    <div className="ag-panel__desc">
                      <p className="ag-panel__desc-text">{item.description}</p>
                      {item.ctaText && (
                        <span className="ag-panel__cta-btn">
                          {item.ctaText}
                          <svg
                            className="ag-panel__cta-icon"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Tag>
          );
        })}
      </div>

      {/* Interactive navigation pills for quick selection */}
      <div className="ag-nav-indicators" aria-label="Feature navigation pills">
        {items.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className={`ag-nav-pill${idx === active ? ' ag-nav-pill--active' : ''}`}
            onClick={() => setActive(idx)}
            aria-label={`Select ${item.label}`}
          >
            <span className="ag-nav-pill__num">{String(idx + 1).padStart(2, '0')}</span>
            <span className="ag-nav-pill__title">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AccordionGallery;
