import React, { useEffect, useRef } from 'react';

interface AudioVisualizerSimpleProps {
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    volume: number;
    size?: 'sm' | 'md' | 'lg';
}

export const AudioVisualizerSimple: React.FC<AudioVisualizerSimpleProps> = ({
    isUserSpeaking,
    isAiSpeaking,
    volume,
    size = 'md'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const baseRadius = size === 'sm' ? 36 : size === 'lg' ? 68 : 52;
        let phase = 0;

        // Particle system for ambient depth
        const particleCount = 28;
        const particles = Array.from({ length: particleCount }, (_, i) => ({
            angle: (i / particleCount) * Math.PI * 2,
            distance: baseRadius * (1.1 + Math.random() * 0.9),
            speed: 0.008 + Math.random() * 0.012,
            size: 1.2 + Math.random() * 2,
            alpha: 0.2 + Math.random() * 0.5,
            orbitOffset: Math.random() * Math.PI * 2
        }));

        const render = () => {
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Palette definitions based on speaking state
            let primaryGlow = '#8b5cf6'; // Sky 500
            let secondaryGlow = '#6366f1'; // Indigo 500
            let innerCore = '#c4b5fd'; // Sky 300
            let radiusMultiplier = 1;
            let pulseSpeed = 0.03;

            if (isUserSpeaking) {
                // Electric Cyan / Blue for candidate speech
                primaryGlow = '#06b6d4'; // Cyan 500
                secondaryGlow = '#3b82f6'; // Blue 500
                innerCore = '#a5f3fc'; // Cyan 200
                const normalizedVol = Math.min(Math.max(volume * 1.6, 0.05), 1.2);
                radiusMultiplier = 1 + normalizedVol * 0.55;
                pulseSpeed = 0.12;
            } else if (isAiSpeaking) {
                // Vibrant Blue / Magenta for AI response
                primaryGlow = '#a855f7'; // Blue 500
                secondaryGlow = '#ec4899'; // Pink 500
                innerCore = '#f5d0fe'; // Blue 200
                radiusMultiplier = 1.15 + Math.sin(phase * 2.5) * 0.14;
                pulseSpeed = 0.08;
            }

            phase += pulseSpeed;

            // 1. Far Ambient Glow
            const ambientGrad = ctx.createRadialGradient(
                centerX, centerY, baseRadius * 0.2,
                centerX, centerY, baseRadius * radiusMultiplier * 2.4
            );
            ambientGrad.addColorStop(0, primaryGlow + '25');
            ambientGrad.addColorStop(0.5, secondaryGlow + '12');
            ambientGrad.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * radiusMultiplier * 2.4, 0, Math.PI * 2);
            ctx.fillStyle = ambientGrad;
            ctx.fill();

            // 2. Harmonic Soundwave Rings (Animated Bezier / Circular waves)
            const ringCount = isAiSpeaking || isUserSpeaking ? 4 : 2;
            for (let r = 1; r <= ringCount; r++) {
                const ringScale = 1 + (r * 0.28) * radiusMultiplier;
                const waveOffset = Math.sin(phase * (1 + r * 0.3) + r) * (isUserSpeaking ? 8 : 4);
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, (baseRadius * ringScale) + waveOffset, 0, Math.PI * 2);
                ctx.strokeStyle = r % 2 === 0 ? primaryGlow : secondaryGlow;
                ctx.lineWidth = Math.max(1, 2.2 - r * 0.4);
                ctx.globalAlpha = Math.max(0.08, 0.45 - r * 0.1);
                ctx.stroke();
            }

            // 3. Floating Micro-particles
            particles.forEach((p) => {
                p.angle += p.speed * (isAiSpeaking || isUserSpeaking ? 2.5 : 1);
                const currentDist = p.distance * radiusMultiplier + Math.sin(phase + p.orbitOffset) * 6;
                const px = centerX + Math.cos(p.angle) * currentDist;
                const py = centerY + Math.sin(p.angle) * currentDist;

                ctx.beginPath();
                ctx.arc(px, py, p.size, 0, Math.PI * 2);
                ctx.fillStyle = primaryGlow;
                ctx.globalAlpha = p.alpha * (isAiSpeaking || isUserSpeaking ? 0.9 : 0.4);
                ctx.fill();
            });

            // 4. Mid Inner Halo
            const midGrad = ctx.createRadialGradient(
                centerX, centerY, baseRadius * 0.4,
                centerX, centerY, baseRadius * radiusMultiplier * 1.3
            );
            midGrad.addColorStop(0, primaryGlow + '60');
            midGrad.addColorStop(0.7, secondaryGlow + '40');
            midGrad.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * radiusMultiplier * 1.3, 0, Math.PI * 2);
            ctx.fillStyle = midGrad;
            ctx.fill();

            // 5. Main Radiant Core Sphere
            const coreRadius = baseRadius * radiusMultiplier * 0.85;
            const coreGrad = ctx.createRadialGradient(
                centerX - coreRadius * 0.28, centerY - coreRadius * 0.28, coreRadius * 0.05,
                centerX, centerY, coreRadius
            );
            coreGrad.addColorStop(0, '#ffffff');
            coreGrad.addColorStop(0.25, innerCore);
            coreGrad.addColorStop(0.7, primaryGlow);
            coreGrad.addColorStop(1, secondaryGlow);

            ctx.beginPath();
            ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
            ctx.fillStyle = coreGrad;
            ctx.globalAlpha = 0.95;
            ctx.shadowColor = primaryGlow;
            ctx.shadowBlur = isAiSpeaking || isUserSpeaking ? 28 : 14;
            ctx.fill();

            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [isUserSpeaking, isAiSpeaking, volume, size]);

    const containerHeight = size === 'sm' ? 'h-44' : size === 'lg' ? 'h-72' : 'h-60';

    return (
        <div className={`w-full ${containerHeight} flex items-center justify-center relative select-none`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
};
