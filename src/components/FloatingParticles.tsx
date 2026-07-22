import { useEffect, useRef } from "react";
import gsap from "gsap";

export const FloatingParticles = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const particleCount = 20;
    const particles: HTMLDivElement[] = [];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "absolute rounded-full bg-violet-500/20 blur-xl";
      
      // Random size between 20px and 100px
      const size = Math.random() * 80 + 20;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random initial position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      containerRef.current.appendChild(particle);
      particles.push(particle);

      // Animate
      gsap.to(particle, {
        x: "random(-100, 100)",
        y: "random(-100, 100)",
        duration: "random(3, 8)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        opacity: "random(0.1, 0.4)",
        scale: "random(0.8, 1.2)",
      });
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    />
  );
};
