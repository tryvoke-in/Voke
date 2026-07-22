import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    volume: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isUserSpeaking, isAiSpeaking, volume }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const stateRef = useRef({
        phase: 0,
        currentRadius: 0,
        smoothVolume: 0
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Set canvas size for high DPI with proper dimensions
        const updateCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            return rect;
        };

        let rect = updateCanvasSize();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const baseRadius = Math.min(rect.width, rect.height) * 0.32;

        // Initialize state
        if (stateRef.current.currentRadius === 0) {
            stateRef.current.currentRadius = baseRadius;
        }

        const drawCircle = (x: number, y: number, radius: number, fillStyle: string | CanvasGradient, alpha: number = 1) => {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fillStyle = fillStyle;
            ctx.fill();
            ctx.restore();
        };

        const drawRing = (x: number, y: number, radius: number, strokeStyle: string, lineWidth: number, alpha: number = 1) => {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            ctx.restore();
        };

        const render = () => {
            const state = stateRef.current;

            // Clear with full transparency
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Enable anti-aliasing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Determine state and colors
            const isActive = isUserSpeaking || isAiSpeaking;

            // Color palette
            const colors = {
                idle: { primary: '#6366f1', secondary: '#8b5cf6', glow: 'rgba(99, 102, 241, 0.25)' },
                user: { primary: '#22c55e', secondary: '#4ade80', glow: 'rgba(34, 197, 94, 0.35)' },
                ai: { primary: '#a855f7', secondary: '#c084fc', glow: 'rgba(168, 85, 247, 0.35)' }
            };

            const palette = isUserSpeaking ? colors.user : isAiSpeaking ? colors.ai : colors.idle;

            // Smooth volume interpolation
            state.smoothVolume += (volume - state.smoothVolume) * 0.2;

            // Calculate target radius based on state
            let targetRadius: number;
            if (isUserSpeaking) {
                targetRadius = baseRadius * (1 + Math.min(state.smoothVolume, 1) * 0.35);
            } else if (isAiSpeaking) {
                targetRadius = baseRadius * (1.05 + Math.sin(state.phase * 2) * 0.08);
            } else {
                targetRadius = baseRadius;
            }

            // Smoother interpolation (ease-out effect)
            state.currentRadius += (targetRadius - state.currentRadius) * 0.12;
            state.phase += isActive ? 0.06 : 0.025;

            const currentRadius = state.currentRadius;

            // Layer 1: Outer glow (contained within canvas)
            const glowRadius = currentRadius * 1.5;
            const glowGradient = ctx.createRadialGradient(centerX, centerY, currentRadius * 0.3, centerX, centerY, glowRadius);
            glowGradient.addColorStop(0, palette.glow);
            glowGradient.addColorStop(0.5, palette.glow.replace('0.25', '0.1').replace('0.35', '0.15'));
            glowGradient.addColorStop(1, 'transparent');
            drawCircle(centerX, centerY, glowRadius, glowGradient, 1);

            // Layer 2: Breathing ring (idle) or ripples (active)
            if (isActive) {
                // Ripple rings
                for (let i = 0; i < 2; i++) {
                    const rippleProgress = ((state.phase * 0.5 + i * 0.5) % 1);
                    const rippleRadius = currentRadius + rippleProgress * currentRadius * 0.8;
                    const rippleAlpha = 0.4 * (1 - rippleProgress);
                    drawRing(centerX, centerY, rippleRadius, palette.primary, 1.5, rippleAlpha);
                }
            } else {
                // Subtle breathing ring
                const breatheRadius = currentRadius * 1.15 + Math.sin(state.phase * 2) * 2;
                drawRing(centerX, centerY, breatheRadius, palette.primary, 1, 0.15 + Math.sin(state.phase * 2) * 0.05);
            }

            // Layer 3: Main orb with smooth gradient
            const mainGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, currentRadius
            );
            mainGradient.addColorStop(0, palette.secondary);
            mainGradient.addColorStop(0.6, palette.primary);
            mainGradient.addColorStop(1, palette.primary);
            drawCircle(centerX, centerY, currentRadius, mainGradient, 0.95);

            // Layer 4: Inner highlight (top-left glossy effect)
            const highlightX = centerX - currentRadius * 0.3;
            const highlightY = centerY - currentRadius * 0.3;
            const highlightGradient = ctx.createRadialGradient(
                highlightX, highlightY, 0,
                highlightX, highlightY, currentRadius * 0.6
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
            highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            highlightGradient.addColorStop(1, 'transparent');
            drawCircle(centerX, centerY, currentRadius, highlightGradient, 1);

            // Layer 5: Subtle inner shadow at bottom
            const shadowGradient = ctx.createRadialGradient(
                centerX, centerY + currentRadius * 0.2, currentRadius * 0.3,
                centerX, centerY, currentRadius
            );
            shadowGradient.addColorStop(0, 'transparent');
            shadowGradient.addColorStop(0.7, 'transparent');
            shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
            drawCircle(centerX, centerY, currentRadius, shadowGradient, 1);

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [isUserSpeaking, isAiSpeaking, volume]);

    return (
        <div className="w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ imageRendering: 'auto' }}
            />
        </div>
    );
};
