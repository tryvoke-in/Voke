import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, MousePointer2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ElitePrepScreenPreview } from "./ElitePrepScreenPreview";

// Memoized wrapper to prevent re-renders during scroll
const MemoizedElitePrepScreenPreview = React.memo(ElitePrepScreenPreview);
import { generateElitePrepScreenTexture } from "./generateElitePrepScreenTexture";
import { WAITLIST_CONFIG } from "@/config/waitlist";
import { useNavigate } from "react-router-dom";

interface MacBookHero3DProps {
  onScrollToFeatures?: () => void;
  onHeaderVisibilityChange?: (visible: boolean) => void;
}

// Smooth hermite ease
const smoothstep = (t: number) => t * t * (3 - 2 * t);

// Rotating catchy punchlines for the initial hero interface
const CATCHY_LINES = [
  {
    headline: "Didn't crack your last interview?",
    subline: "Scroll down so it doesn't happen again"
  },
  {
    headline: "Froze on the live coding round?",
    subline: "Scroll down to master real-time problem solving"
  },
  {
    headline: "Ghosted after behavioral rounds?",
    subline: "Scroll down to calibrate your speech and body language"
  },
  {
    headline: "Struggling with system design?",
    subline: "Scroll down to grill your real architecture"
  },
  {
    headline: "Nervous before your dream offer?",
    subline: "Scroll down to practice with adaptive AI"
  }
];

export const MacBookHero3D: React.FC<MacBookHero3DProps> = React.memo(({
  onScrollToFeatures,
  onHeaderVisibilityChange
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ref-based scroll progress for high-performance animation (no React re-renders)
  const scrollProgressRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [catchyIndex, setCatchyIndex] = useState<number>(0);

  // Rotating catchy lines interval (cycles smoothly every 3.8 seconds when hero is at start view)
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollProgressRef.current < 0.05) {
        setCatchyIndex((prev) => (prev + 1) % CATCHY_LINES.length);
      }
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Smooth scroll tracking refs for Three.js
  const targetProgressRef = useRef<number>(0);
  const smoothProgressRef = useRef<number>(0);

  // Smooth scroll tracking ref for card pop animation (bypasses React)
  const smoothCardProgressRef = useRef<number>(0);

  // DOM refs for direct manipulation (completely avoids React re-renders on scroll)
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const catchyRef = useRef<HTMLDivElement>(null);
  const heroSignInRef = useRef<HTMLDivElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const leftAtmosphereRef = useRef<HTMLDivElement>(null);

  // Discrete state refs & state (only changes when crossing discrete thresholds)
  const isInteractiveRef = useRef<boolean>(false);
  const [isInteractiveActive, setIsInteractiveActive] = useState(false);
  const isSkipVisibleRef = useRef<boolean>(false);
  const [isSkipVisible, setIsSkipVisible] = useState(false);
  const lastHeaderVisibleRef = useRef<boolean | null>(false);

  // Container metrics cache to avoid layout thrashing
  const boundsRef = useRef({ top: 0, height: 0, scrollable: 0 });

  // Animation frame for card updates
  const cardAnimFrameRef = useRef<number>(0);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lidPivotRef = useRef<THREE.Group | null>(null);
  const laptopRootRef = useRef<THREE.Group | null>(null);
  const screenMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Animation frame ID
  const animFrameIdRef = useRef<number>(0);

  const handleAuthNavigation = () => {
    const isBypassed = localStorage.getItem("voke_waitlist_bypass") === "true";
    if (WAITLIST_CONFIG.enabled && !isBypassed) {
      navigate("/waitlist");
    } else {
      navigate("/auth");
    }
  };

  const handleDashboardNavigation = () => {
    navigate("/dashboard");
  };

  // Card & UI DOM update helper - directly manipulates styles with ZERO React re-renders
  const updateCardDOM = useCallback((sp: number) => {
    const isMobile = typeof window !== "undefined" ? window.innerWidth < 1024 : false;
    const startX = isMobile ? 0 : 18;
    const startY = isMobile ? -50 : -88;
    const startScale = isMobile ? 0.60 : 0.52;
    const startRotateX = 3;
    const startRotateY = isMobile ? 0 : -15;
    const startRotateZ = isMobile ? 0 : 1.5;
    const lerp = THREE.MathUtils.lerp;

    const rawPop = Math.min(Math.max((sp - 0.68) / 0.20, 0), 1);
    const popProgress = smoothstep(rawPop);

    if (cardRef.current) {
      const currentX = lerp(isMobile ? 0 : startX, 0, popProgress);
      const cardY = lerp(startY, 0, popProgress);
      const cardScale = lerp(startScale, 1.0, popProgress);
      const cardRotateX = lerp(startRotateX, 0, popProgress);
      const cardRotateY = lerp(startRotateY, 0, popProgress);
      const cardRotateZ = lerp(startRotateZ, 0, popProgress);
      const cardOpacity = rawPop <= 0.01 ? 0 : Math.min(rawPop / 0.10, 1.0);

      cardRef.current.style.opacity = String(cardOpacity);
      cardRef.current.style.transform = `translate3d(${currentX}vw, ${cardY}px, 0) scale(${cardScale}) rotateX(${cardRotateX}deg) rotateY(${cardRotateY}deg) rotateZ(${cardRotateZ}deg)`;
    }

    if (canvasWrapperRef.current) {
      canvasWrapperRef.current.style.opacity = String(Math.max(1 - rawPop * 2.5, 0));
    }
    if (auroraRef.current) {
      auroraRef.current.style.opacity = String(Math.max(1 - popProgress * 2.2, 0));
    }

    // Floor spotlight tracks with MacBook
    if (spotlightRef.current) {
      const spotlightProgress = Math.min(Math.max((sp - 0.30) / 0.25, 0), 1);
      const spotlightX = lerp(0, 32, spotlightProgress);
      spotlightRef.current.style.opacity = String(Math.max(1 - popProgress * 2.5, 0));
      spotlightRef.current.style.transform = `translate(${spotlightX}vw, 0)`;
    }

    // Catchy hook top text fade and translate - immediately disappears before lid begins lifting
    if (catchyRef.current) {
      if (sp < 0.05) {
        const p = sp / 0.05;
        const catchyOpacity = Math.max(1 - p, 0);
        catchyRef.current.style.display = "flex";
        catchyRef.current.style.opacity = String(catchyOpacity);
        catchyRef.current.style.transform = `translate(-50%, ${-p * 45}px)`;
        catchyRef.current.style.pointerEvents = sp < 0.01 ? "auto" : "none";
      } else {
        catchyRef.current.style.display = "none";
        catchyRef.current.style.opacity = "0";
        catchyRef.current.style.pointerEvents = "none";
      }
    }

    // Hero top-right Sign In button fade - synchronizes with initial hero view
    if (heroSignInRef.current) {
      if (sp < 0.05) {
        const p = sp / 0.05;
        const btnOpacity = Math.max(1 - p, 0);
        heroSignInRef.current.style.display = "block";
        heroSignInRef.current.style.opacity = String(btnOpacity);
        heroSignInRef.current.style.transform = `translateY(${-p * 20}px)`;
        heroSignInRef.current.style.pointerEvents = sp < 0.01 ? "auto" : "none";
      } else {
        heroSignInRef.current.style.display = "none";
        heroSignInRef.current.style.opacity = "0";
        heroSignInRef.current.style.pointerEvents = "none";
      }
    }

    // Left Column Text Opacity & Translation
    let leftTextOpacity = 0;
    if (sp >= 0.38 && sp <= 0.55) {
      leftTextOpacity = Math.min((sp - 0.38) / 0.17, 1.0);
    } else if (sp > 0.55 && sp <= 0.68) {
      leftTextOpacity = 1.0;
    } else if (sp > 0.68 && sp <= 0.80) {
      leftTextOpacity = Math.max(1.0 - (sp - 0.68) / 0.12, 0.0);
    }

    if (leftTextRef.current) {
      leftTextRef.current.style.opacity = String(leftTextOpacity);
      leftTextRef.current.style.pointerEvents = leftTextOpacity > 0.1 ? "auto" : "none";
      leftTextRef.current.style.transform = `translateY(${-Math.min((sp - 0.38) * 50, 30)}px)`;
    }

    if (leftAtmosphereRef.current) {
      leftAtmosphereRef.current.style.opacity = String(Math.max(leftTextOpacity * 0.7, 0));
    }
  }, []);

  // Pre-measure container metrics without layout thrashing during scroll
  const measureBounds = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const top = rect.top + scrollY;
    const height = containerRef.current.offsetHeight;
    const scrollable = Math.max(height - window.innerHeight, 1);
    boundsRef.current = { top, height, scrollable };
  }, []);

  // Viewport tracking ref to cull rendering when scrolled offscreen
  const isInViewportRef = useRef<boolean>(true);
  const isRenderingRef = useRef<boolean>(false);
  const requestRenderRef = useRef<() => void>(() => { });

  // High-performance rAF-throttled scroll listener with ZERO reflows
  useEffect(() => {
    let ticking = false;
    let lastClamped = -1;

    const processScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const { top, height, scrollable } = boundsRef.current;
      if (scrollable <= 0) return;

      // Early exit if scrolled completely past or before hero section
      if (scrollY > top + height + 100) {
        if (lastClamped === 1.0) return;
        lastClamped = 1.0;
        targetProgressRef.current = 1.0;
        scrollProgressRef.current = 1.0;
        updateCardDOM(1.0);
        return;
      }
      if (scrollY < top - 100) {
        if (lastClamped === 0.0) return;
        lastClamped = 0.0;
        targetProgressRef.current = 0.0;
        scrollProgressRef.current = 0.0;
        updateCardDOM(0.0);
        return;
      }

      lastClamped = -1;
      const currentScroll = scrollY - top;
      const progress = Math.min(Math.max(currentScroll / scrollable, 0), 1);

      // Update refs immediately (zero-cost, no re-render)
      targetProgressRef.current = progress;
      scrollProgressRef.current = progress;

      // Update card & UI DOM directly
      updateCardDOM(progress);
      if (isInViewportRef.current) {
        requestRenderRef.current();
      }

      // Discrete state transitions (only fires when crossing thresholds)
      const newInteractive = progress >= 0.86 && progress <= 0.99;
      if (newInteractive !== isInteractiveRef.current) {
        isInteractiveRef.current = newInteractive;
        setIsInteractiveActive(newInteractive);
      }

      const newSkipVisible = progress >= 0.50 && progress < 0.68 && !newInteractive;
      if (newSkipVisible !== isSkipVisibleRef.current) {
        isSkipVisibleRef.current = newSkipVisible;
        setIsSkipVisible(newSkipVisible);
      }

      const isHeaderVisible = (progress >= 0.38 && progress < 0.68) || progress >= 0.98;
      if (lastHeaderVisibleRef.current !== isHeaderVisible) {
        lastHeaderVisibleRef.current = isHeaderVisible;
        onHeaderVisibilityChange?.(isHeaderVisible);
      }

      // Speech synthesis cancellation
      if (progress > 0.98 || progress < 0.70) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          processScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleResize = () => {
      measureBounds();
      processScroll();
    };

    measureBounds();
    processScroll();

    // Re-measure after initial layout settles
    const timer = setTimeout(() => {
      measureBounds();
      processScroll();
    }, 400);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [measureBounds, updateCardDOM, onHeaderVisibilityChange]);

  // Viewport IntersectionObserver to pause WebGL rendering when hero is offscreen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isInViewportRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          requestRenderRef.current();
        }
      },
      { threshold: 0 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Immediately cancel speech synthesis whenever not in interactive view
  useEffect(() => {
    if (!isInteractiveActive) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isInteractiveActive]);

  // Three.js Scene Setup & Model Loading
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, 0.65, 4.6);
    camera.lookAt(0, -0.02, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch (err) {
      console.warn("WebGL initialization unavailable:", err);
      setLoadError("WebGL graphics accelerator unavailable in this browser environment.");
      return;
    }
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    renderer.setPixelRatio(Math.min(dpr, 1.5));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const frontSpot = new THREE.DirectionalLight(0xffffff, 2.2);
    frontSpot.position.set(4, 9, 6);
    scene.add(frontSpot);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(-6, 5, -5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.9);
    fillLight.position.set(6, -2, 3);
    scene.add(fillLight);

    // 5. Generate dynamic Elite Prep screen texture
    const elitePrepScreenTexture = generateElitePrepScreenTexture();

    // Root container for entire laptop
    const laptopRoot = new THREE.Group();
    scene.add(laptopRoot);
    laptopRootRef.current = laptopRoot;

    const isMobile = window.innerWidth < 1024;
    laptopRoot.scale.setScalar(isMobile ? 0.076 : 0.096);
    laptopRoot.position.set(0, isMobile ? -0.36 : -0.30, 0);
    laptopRoot.rotation.set(0.06, 0.0, 0);

    // 6. Load 3D Model with DracoLoader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/gltf/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      "/models/macbook-16.glb",
      (gltf) => {
        const modelScene = gltf.scene;

        const baseGroup = new THREE.Group();
        laptopRoot.add(baseGroup);

        const lidPivot = new THREE.Group();
        lidPivot.position.set(0, 0.72, -12.35);
        laptopRoot.add(lidPivot);
        lidPivotRef.current = lidPivot;

        const lidContainer = new THREE.Group();
        lidContainer.position.set(0, -0.72, 12.35);
        lidPivot.add(lidContainer);

        const meshes: any[] = [];
        modelScene.traverse((child: any) => {
          if (child.isMesh) {
            meshes.push(child);
          }
        });

        meshes.forEach((child: any) => {
          const geom = child.geometry;
          geom.computeBoundingBox();
          const box = geom.boundingBox;

          // Natural Apple anodized aluminum finishes
          if (child.material) {
            const matName = (child.material.name || "").toLowerCase();
            const meshName = (child.name || "").toLowerCase();

            if (matName.includes("aluminum") || matName.includes("body") || matName.includes("case") || meshName.includes("body") || meshName.includes("chassis")) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x8a9098,
                roughness: 0.32,
                metalness: 0.88
              });
            } else if (matName.includes("keyboard") || matName.includes("key")) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x151618,
                roughness: 0.72,
                metalness: 0.12
              });
            } else if (matName.includes("glass") || matName.includes("bezel")) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x050508,
                roughness: 0.6,
                metalness: 0.1
              });
            }
          }

          if (child.name === "Object_123") {
            const screenMat = new THREE.MeshBasicMaterial({
              map: elitePrepScreenTexture,
              toneMapped: false
            });
            child.material = screenMat;
            screenMaterialRef.current = screenMat;
          }

          if (!box) {
            baseGroup.add(child);
            return;
          }

          if (box.max.y <= -12.3) {
            child.position.set(0, 0, 0);
            lidContainer.add(child);
          } else if (box.min.y >= -12.35) {
            baseGroup.add(child);
          } else {
            const pos = geom.getAttribute("position");
            const index = geom.getIndex();

            if (index && pos) {
              const baseIndices: number[] = [];
              const lidIndices: number[] = [];

              for (let i = 0; i < index.count; i += 3) {
                const a = index.getX(i);
                const b = index.getX(i + 1);
                const c = index.getX(i + 2);

                const centroidY = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;

                if (centroidY < -12.35) {
                  lidIndices.push(a, b, c);
                } else {
                  baseIndices.push(a, b, c);
                }
              }

              if (baseIndices.length > 0) {
                const baseGeom = geom.clone();
                baseGeom.setIndex(baseIndices);
                const baseMesh = new THREE.Mesh(baseGeom, child.material);
                baseMesh.rotation.copy(child.rotation);
                baseGroup.add(baseMesh);
              }

              if (lidIndices.length > 0) {
                const lidGeom = geom.clone();
                lidGeom.setIndex(lidIndices);
                const lidMesh = new THREE.Mesh(lidGeom, child.material);
                lidMesh.rotation.copy(child.rotation);
                lidContainer.add(lidMesh);
              }
            } else {
              baseGroup.add(child);
            }
          }
        });

        // Start fully closed
        lidPivot.rotation.x = 1.93;

        setLoadError(null);
        setIsLoaded(true);
        requestRenderRef.current();
      },
      undefined,
      (error) => {
        console.error("Error loading 3D MacBook model:", error);
        setLoadError("Failed to load 3D model.");
      }
    );

    // Resize Handler
    const handleResize = () => {
      if (!canvas || !renderer || !camera) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      if (laptopRootRef.current) {
        const isMob = window.innerWidth < 1024;
        const initialScale = isMob ? 0.076 : 0.096;
        laptopRootRef.current.scale.setScalar(initialScale);
      }
      requestRenderRef.current();
    };

    window.addEventListener("resize", handleResize);

    // Animation / Render loop with spring-physics inertia (renders strictly on-demand)
    const animate = () => {
      if (!isInViewportRef.current) {
        isRenderingRef.current = false;
        return;
      }

      // Fast spring lerp towards target scroll position
      smoothProgressRef.current = THREE.MathUtils.lerp(
        smoothProgressRef.current,
        targetProgressRef.current,
        0.18
      );

      // Snap to exact target if difference is negligible
      if (Math.abs(smoothProgressRef.current - targetProgressRef.current) < 0.0001) {
        smoothProgressRef.current = targetProgressRef.current;
      }

      const sp = smoothProgressRef.current;
      const isMobile = window.innerWidth < 1024;

      if (lidPivotRef.current && laptopRootRef.current && cameraRef.current) {
        const lidPivot = lidPivotRef.current;
        const laptopRoot = laptopRootRef.current;
        const camera = cameraRef.current;

        // Phase A: 0.00 -> 0.30 (Lid Opens)
        const openP = Math.min(Math.max(sp / 0.30, 0), 1);
        const easedOpen = smoothstep(openP);
        lidPivot.rotation.x = THREE.MathUtils.lerp(1.93, 0.0, easedOpen);

        // Phase B: 0.30 -> 0.55 (Mac moves to the right side)
        const sideP = Math.min(Math.max((sp - 0.30) / 0.25, 0), 1);
        const easedSide = smoothstep(sideP);

        const centeredStartY = isMobile ? -0.36 : -0.30;
        const centeredOpenY = isMobile ? -0.56 : -0.52;
        const currentOpenY = THREE.MathUtils.lerp(centeredStartY, centeredOpenY, easedOpen);

        const sideX = isMobile ? 0 : 1.48;
        const sideY = isMobile ? -0.54 : -0.44;
        const sideRotY = isMobile ? -0.05 : -0.26;
        const sideScale = isMobile ? 0.065 : 0.085;

        laptopRoot.position.x = THREE.MathUtils.lerp(0, sideX, easedSide);
        laptopRoot.position.y = THREE.MathUtils.lerp(currentOpenY, sideY, easedSide);
        laptopRoot.rotation.y = THREE.MathUtils.lerp(0.0, sideRotY, easedSide);
        laptopRoot.rotation.x = THREE.MathUtils.lerp(0.06, 0.04, easedSide);

        const initialScale = isMobile ? 0.076 : 0.096;
        laptopRoot.scale.setScalar(THREE.MathUtils.lerp(initialScale, sideScale, easedSide));

        // Camera framing
        const camY = THREE.MathUtils.lerp(0.65, 0.72, Math.max(easedOpen, easedSide));
        const camZ = THREE.MathUtils.lerp(4.6, 5.3, Math.max(easedOpen, easedSide));
        const lookY = THREE.MathUtils.lerp(-0.02, 0.06, Math.max(easedOpen, easedSide));
        camera.position.set(0, camY, camZ);
        camera.lookAt(0, lookY, 0);

        // Pop Out Stage: 0.68 -> 0.88
        const rawPop = Math.min(Math.max((sp - 0.68) / 0.20, 0), 1);
        const easedPop = smoothstep(rawPop);
        laptopRoot.position.z = THREE.MathUtils.lerp(0, -0.35, easedPop);

        // Turn screen black during pop
        if (screenMaterialRef.current) {
          const blackFactor = Math.min(rawPop / 0.05, 1.0);
          const brightness = THREE.MathUtils.lerp(1.0, 0.0, blackFactor);
          screenMaterialRef.current.color.setRGB(brightness, brightness, brightness);
        }
      }

      // Synchronize catchy text visibility with smooth Three.js progress
      if (catchyRef.current) {
        if (sp < 0.05) {
          const p = sp / 0.05;
          const catchyOpacity = Math.max(1 - p, 0);
          catchyRef.current.style.display = "flex";
          catchyRef.current.style.opacity = String(catchyOpacity);
          catchyRef.current.style.transform = `translate(-50%, ${-p * 45}px)`;
          catchyRef.current.style.pointerEvents = sp < 0.01 ? "auto" : "none";
        } else {
          catchyRef.current.style.display = "none";
          catchyRef.current.style.opacity = "0";
          catchyRef.current.style.pointerEvents = "none";
        }
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }

      // Check if smoothProgress is still in motion towards target
      const isMoving = Math.abs(smoothProgressRef.current - targetProgressRef.current) > 0.00005;
      if (isMoving && isInViewportRef.current) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        isRenderingRef.current = false;
      }
    };

    requestRenderRef.current = () => {
      if (!isRenderingRef.current && isInViewportRef.current) {
        isRenderingRef.current = true;
        animFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    // Initial render
    requestRenderRef.current();

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
      scene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      if (screenMaterialRef.current?.map) {
        screenMaterialRef.current.map.dispose();
      }
      dracoLoader.dispose();
      renderer.dispose();
    };
  }, []);

  const isMobile = typeof window !== "undefined" ? window.innerWidth < 1024 : false;

  const handleSkipToInteractive = () => {
    const { top, height } = boundsRef.current;
    const targetY = (top || 0) + (height || window.innerHeight * 2.8) * 0.88;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[280vh] bg-[#05070c] select-none"
    >
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">

        {/* ATMOSPHERIC BACKGROUND SYSTEM */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* 1. Deep Midnight Studio Foundation */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,#0d1527_0%,#080d1a_45%,#05070c_100%)]" />

          {/* 2. Top Celestial Horizon Aurora */}
          <div
            ref={auroraRef}
            className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1400px] h-[580px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.14)_0%,rgba(16,185,129,0.09)_35%,rgba(15,23,42,0.4)_65%,transparent_80%)] blur-3xl"
          />

          {/* 3. Dynamic Studio Floor Spotlight beneath MacBook */}
          <div
            ref={spotlightRef}
            style={{
              transform: "translate(0vw, 0)"
            }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.12)_0%,rgba(15,23,42,0.3)_50%,transparent_75%)] blur-3xl pointer-events-none will-change-transform"
          />

          {/* 4. Soft Left Text Atmosphere */}
          <div
            ref={leftAtmosphereRef}
            style={{ opacity: 0 }}
            className="absolute top-1/3 left-8 md:left-20 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.07)_0%,transparent_70%)] blur-3xl transition-opacity duration-300 pointer-events-none"
          />

          {/* 5. Precision Engineering Cartesian Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_45%,#000_25%,transparent_85%)]" />

          {/* 6. Subtle Star Dust / Micro Sparkles */}
          <div className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,#000_30%,transparent_85%)]">
            <div className="absolute top-[18%] left-[22%] w-1 h-1 rounded-full bg-cyan-300 animate-ping opacity-60" />
            <div className="absolute top-[28%] right-[25%] w-1 h-1 rounded-full bg-emerald-300 animate-pulse opacity-70" />
            <div className="absolute bottom-[35%] left-[16%] w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
            <div className="absolute bottom-[28%] right-[18%] w-1 h-1 rounded-full bg-cyan-200 opacity-50" />
            <div className="absolute top-[45%] left-[48%] w-1 h-1 rounded-full bg-white/40" />
          </div>

          {/* 7. Subtle Glowing Horizon Edge at very top */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 via-emerald-400/20 to-transparent" />
        </div>

        {/* Top-Right Standalone Sign In Button on Initial Hero View */}
        <div
          ref={heroSignInRef}
          style={{
            opacity: 1,
            transform: "translateY(0px)",
            pointerEvents: "auto",
          }}
          className="absolute top-4 sm:top-5 right-4 sm:right-6 md:right-8 lg:right-12 z-30"
        >
          <Button
            onClick={handleAuthNavigation}
            className="bg-[#0F6B38] hover:bg-[#0B572D] text-white font-semibold text-xs px-3.5 sm:px-4 h-8.5 rounded-full border border-emerald-500/30 flex items-center gap-1 transition-all duration-300 hover:scale-105 shrink-0 shadow-md shadow-emerald-950/40"
          >
            <span className="whitespace-nowrap">Sign In</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          </Button>
        </div>

        {/* Initial Big White Catchy Hook (Centered on TOP of MacBook, rotates from time to time) */}
        <div
          ref={catchyRef}
          style={{
            opacity: 1,
            transform: "translate(-50%, 0px)",
            pointerEvents: "auto",
          }}
          onClick={() => {
            window.scrollTo({ top: window.innerHeight * 0.45, behavior: "smooth" });
          }}
          className="absolute top-12 sm:top-14 md:top-16 lg:top-20 left-1/2 z-20 w-full max-w-4xl px-4 flex flex-col items-center text-center select-none cursor-pointer group"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={catchyIndex}
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-col items-center w-full"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] leading-[1.12]">
                {CATCHY_LINES[catchyIndex].headline}
              </h2>
              <p className="mt-4 sm:mt-5 md:mt-6 text-sm sm:text-base md:text-lg font-medium flex items-center justify-center gap-2 drop-shadow-[0_2px_12px_rgba(52,211,153,0.3)] transition-colors">
                <span className="text-emerald-400 group-hover:text-emerald-300 font-semibold tracking-wide">
                  {CATCHY_LINES[catchyIndex].subline}
                </span>
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:text-emerald-300 group-hover:translate-y-1 transition-transform animate-bounce shrink-0" />
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* SIDE-BY-SIDE LEFT CONTENT */}
        <div
          ref={leftTextRef}
          style={{
            opacity: 0,
            pointerEvents: "none",
            transform: "translateY(0px)",
            willChange: "transform, opacity",
          }}
          className="absolute left-6 md:left-14 lg:left-24 top-44 md:top-56 lg:top-64 max-w-xl z-20 space-y-6 text-left"
        >
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.04] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
            Master Tech Rounds & <br />
            <span className="italic bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.35)]">
              Secure the Offer.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed drop-shadow-md">
            Practice face-to-face technical, DSA coding, and behavioral interviews with real-time biometric and voice feedback.
            Calibrate your skills in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <Button
              onClick={handleAuthNavigation}
              className="bg-[#0F6B38] hover:bg-[#0B572D] text-white text-xs font-semibold px-7 h-11 rounded-full shadow-lg shadow-emerald-950/40 border border-emerald-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              Start Preparing Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="border border-white/10 text-zinc-200 hover:text-white bg-white/5 hover:bg-emerald-500/10 text-xs px-6 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-105"
                >
                  <Play className="mr-2 w-3.5 h-3.5 fill-current text-white" />
                  Watch Demo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-black/90 border-white/10 backdrop-blur-xl">
                <div className="aspect-video w-full">
                  <iframe
                    className="w-full h-full"
                    src="https://drive.google.com/file/d/1YXFu8M0o0InAG7WJLkz8pjywuJdYTNit/preview"
                    title="Voke AI Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 3D WebGL Canvas Layer */}
        <div
          ref={canvasWrapperRef}
          style={{
            pointerEvents: isInteractiveActive ? "none" : "auto"
          }}
          className="absolute inset-0 w-full h-full flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-grab active:cursor-grabbing"
          />

          {/* Loading Spinner */}
          {!isLoaded && !loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#06070a]/90 backdrop-blur-md z-30">
              <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
              <p className="font-mono text-xs text-emerald-300 font-semibold tracking-wider">
                Booting Voke 3D Studio...
              </p>
            </div>
          )}

          {loadError && !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-rose-400 text-xs font-mono">
              {loadError}
            </div>
          )}
        </div>

        {/* Interactive Screen Stage (Directly emerges from the 3D MacBook display) */}
        <div
          style={{
            perspective: "1200px",
            perspectiveOrigin: "50% 50%",
            pointerEvents: isInteractiveActive ? "auto" : "none"
          }}
          className="absolute inset-0 p-4 sm:p-6 flex items-center justify-center z-30 pointer-events-none"
        >
          <div
            ref={cardRef}
            style={{
              opacity: 0,
              transform: "translate3d(0, 0, 0) scale(0.52)",
              transformOrigin: "center center",
              boxShadow: "0 25px 65px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.12)",
              pointerEvents: isInteractiveActive ? "auto" : "none",
              willChange: "transform, opacity",
              contain: "layout style paint"
            }}
            className="w-full max-w-[620px] h-[490px] max-h-[calc(100vh-4rem)] rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden bg-[#07080c] relative flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]"
          >
            <MemoizedElitePrepScreenPreview
              isInteractive={isInteractiveActive}
              onContinueInterview={handleDashboardNavigation}
              onExploreFeatures={onScrollToFeatures}
            />
          </div>
        </div>

        {/* Quick Skip Button (Bottom Right) - visible during hero view */}
        {isSkipVisible && (
          <button
            type="button"
            onClick={handleSkipToInteractive}
            className="absolute bottom-8 right-8 z-20 hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 border border-white/10 hover:border-emerald-500/40 text-xs text-zinc-300 hover:text-white backdrop-blur-xl shadow-lg transition-all duration-300 group font-mono"
          >
            <span>Skip to voice interview</span>
            <MousePointer2 className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

      </div>
    </section>
  );
});

export default MacBookHero3D;
