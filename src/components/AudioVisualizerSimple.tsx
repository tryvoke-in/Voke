import React, { useEffect, useRef } from 'react';

interface AudioVisualizerSimpleProps {
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    volume: number;
}

export const AudioVisualizerSimple: React.FC<AudioVisualizerSimpleProps> = ({ isUserSpeaking, isAiSpeaking, volume }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size for high DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const baseRadius = 55;

        let phase = 0;

        const render = () => {
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Determine color and activity level
            let activeColor = '#6366f1'; // Indigo 500 (Idle vibrant)
            let outerColor = '#818cf8';
            let radiusMultiplier = 1;
            let pulseSpeed = 0.04;

            if (isUserSpeaking) {
                activeColor = '#2563eb'; // Blue 600 (User)
                outerColor = '#60a5fa';
                radiusMultiplier = 1 + Math.min(volume, 1) * 0.6;
                pulseSpeed = 0.2;
            } else if (isAiSpeaking) {
                activeColor = '#9333ea'; // Purple 600 (AI)
                outerColor = '#c084fc';
                radiusMultiplier = 1.25 + Math.sin(phase) * 0.15; // Auto pulse for AI
                pulseSpeed = 0.15;
            }

            phase += pulseSpeed;

            // Ambient background glow circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * radiusMultiplier * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = outerColor;
            ctx.globalAlpha = 0.12;
            ctx.fill();

            // Outer Glow ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * radiusMultiplier * 1.35, 0, Math.PI * 2);
            ctx.fillStyle = activeColor;
            ctx.globalAlpha = 0.25;
            ctx.fill();

            // Ripples (if active)
            if (isUserSpeaking || isAiSpeaking) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, baseRadius * radiusMultiplier * 2.1 + Math.sin(phase) * 12, 0, Math.PI * 2);
                ctx.strokeStyle = outerColor;
                ctx.lineWidth = 2.5;
                ctx.globalAlpha = 0.35;
                ctx.stroke();
            }

            // Draw Main Gradient Orb
            const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.1, centerX, centerY, baseRadius * radiusMultiplier);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.35, activeColor);
            gradient.addColorStop(1, outerColor);

            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * radiusMultiplier, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.95;
            ctx.fill();

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [isUserSpeaking, isAiSpeaking, volume]);

    return (
        <div className="w-full h-64 sm:h-72 flex items-center justify-center relative">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
};
