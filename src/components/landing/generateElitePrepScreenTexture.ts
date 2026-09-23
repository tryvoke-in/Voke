import * as THREE from "three";

/**
 * Generates a razor-sharp 2560x1600 canvas texture representing
 * the exact Voke interview interface with the glowing 3D voice orb,
 * clean typography, highlighted skip button, and capsule typing bar.
 * Applied directly to Object_123 on the 3D MacBook model display.
 */
export function generateElitePrepScreenTexture(): THREE.CanvasTexture {
  const logicalWidth = 2560;
  const logicalHeight = 1600;
  // Scaled to 1280x800 for optimal memory footprint (4MB vs 16.4MB VRAM) on low/high end PCs
  const scale = 0.5;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(logicalWidth * scale);
  canvas.height = Math.round(logicalHeight * scale);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.scale(scale, scale);
  const width = logicalWidth;
  const height = logicalHeight;

  // Helper for rounded rectangles (with fallback)
  function drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    if (context.roundRect) {
      context.roundRect(x, y, w, h, r);
    } else {
      context.moveTo(x + r, y);
      context.lineTo(x + w - r, y);
      context.arcTo(x + w, y, x + w, y + r, r);
      context.lineTo(x + w, y + h - r);
      context.arcTo(x + w, y + h, x + w - r, y + h, r);
      context.lineTo(x + r, y + h);
      context.arcTo(x, y + h, x, y + h - r, r);
      context.lineTo(x, y + r);
      context.arcTo(x, y, x + r, y, r);
    }
  }

  // 1. Deep Space Solid Background (#06070a)
  ctx.fillStyle = "#06070a";
  ctx.fillRect(0, 0, width, height);

  // Subtle Center Radial Glow
  const bgGlow = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    950
  );
  bgGlow.addColorStop(0, "rgba(255, 255, 255, 0.025)");
  bgGlow.addColorStop(0.7, "transparent");
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BAR (Y: 80px)
  const topBarY = 80;

  // Left side: Question progress dots
  // Dot 1: Active capsule pill (pure white with glow)
  ctx.save();
  ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  drawRoundedRect(ctx, 90, topBarY + 14, 76, 16, 8);
  ctx.fill();
  ctx.restore();

  // Dot 2: Inactive zinc circle
  ctx.fillStyle = "#52525b";
  ctx.beginPath();
  ctx.arc(195, topBarY + 22, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Dot 3: Inactive dark zinc circle
  ctx.fillStyle = "#3f3f46";
  ctx.beginPath();
  ctx.arc(225, topBarY + 22, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Right side: Highlighted Skip Button (Pill badge matching interface)
  const skipBtnW = 160;
  const skipBtnH = 54;
  const skipBtnX = width - 90 - skipBtnW;
  const skipBtnY = topBarY - 5;

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, skipBtnX, skipBtnY, skipBtnW, skipBtnH, 27);
  ctx.fill();
  ctx.stroke();

  // Skip text & arrow
  ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("Skip", skipBtnX + 64, skipBtnY + 36);

  // Arrow Right
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(skipBtnX + 98, skipBtnY + 27);
  ctx.lineTo(skipBtnX + 112, skipBtnY + 27);
  ctx.lineTo(skipBtnX + 106, skipBtnY + 21);
  ctx.moveTo(skipBtnX + 112, skipBtnY + 27);
  ctx.lineTo(skipBtnX + 106, skipBtnY + 33);
  ctx.stroke();
  ctx.restore();

  // Top Bar Bottom Border Divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, topBarY + 75);
  ctx.lineTo(width - 90, topBarY + 75);
  ctx.stroke();

  // 3. CENTERED QUESTION TYPOGRAPHY (Instrument Serif)
  ctx.save();
  ctx.font = "400 52px 'Instrument Serif', 'Playfair Display', Georgia, 'Times New Roman', serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 12;

  const questionLine1 = '"Hello and welcome to Voke! Could you tell us your name, and what tech';
  const questionLine2 = 'role or dream company you\'re preparing for?"';

  ctx.fillText(questionLine1, width / 2, 275);
  ctx.fillText(questionLine2, width / 2, 345);
  ctx.restore();

  // 4. CENTERED 3D OPAL / SILVER VOICE SPHERE
  const centerX = width / 2;
  const centerY = 740;
  const radius = 210;

  // Outer ambient pulsing glow halo
  const haloGrad = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.95,
    centerX,
    centerY,
    radius * 1.85
  );
  haloGrad.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  haloGrad.addColorStop(0.4, "rgba(203, 213, 225, 0.07)");
  haloGrad.addColorStop(1, "transparent");

  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.85, 0, Math.PI * 2);
  ctx.fill();

  // 3D Spherical Shading Gradient (White to silver/slate)
  const sphereGrad = ctx.createRadialGradient(
    centerX - radius * 0.32,
    centerY - radius * 0.32,
    0,
    centerX,
    centerY,
    radius
  );
  sphereGrad.addColorStop(0.00, "#ffffff");
  sphereGrad.addColorStop(0.22, "#f1f5f9");
  sphereGrad.addColorStop(0.52, "#cbd5e1");
  sphereGrad.addColorStop(0.80, "#64748b");
  sphereGrad.addColorStop(1.00, "#334155");

  ctx.save();
  ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
  ctx.shadowBlur = 45;
  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Inset Rim Shading for true 3D curvature volume
  const innerShadowGrad = ctx.createRadialGradient(
    centerX + radius * 0.25,
    centerY + radius * 0.30,
    radius * 0.3,
    centerX,
    centerY,
    radius
  );
  innerShadowGrad.addColorStop(0, "transparent");
  innerShadowGrad.addColorStop(0.82, "rgba(0, 0, 0, 0.32)");
  innerShadowGrad.addColorStop(1.00, "rgba(0, 0, 0, 0.68)");

  ctx.fillStyle = innerShadowGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Specular Gloss Highlight at top-left
  ctx.save();
  ctx.translate(centerX - radius * 0.28, centerY - radius * 0.44);
  ctx.rotate(-0.25);
  const glossGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 70);
  glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  glossGrad.addColorStop(0.45, "rgba(255, 255, 255, 0.45)");
  glossGrad.addColorStop(1, "transparent");

  ctx.fillStyle = glossGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 68, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. STATUS PILL BENEATH SPHERE ("Tap orb to replay question aloud")
  const statusPillW = 500;
  const statusPillH = 56;
  const statusPillX = width / 2 - statusPillW / 2;
  const statusPillY = 1025;

  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundedRect(ctx, statusPillX, statusPillY, statusPillW, statusPillH, 28);
  ctx.fill();
  ctx.stroke();

  // Speaker Volume Icon inside status pill
  const iconX = statusPillX + 50;
  const iconY = statusPillY + 28;
  ctx.strokeStyle = "#a1a1aa";
  ctx.fillStyle = "#a1a1aa";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Speaker cone
  ctx.beginPath();
  ctx.moveTo(iconX - 10, iconY - 5);
  ctx.lineTo(iconX - 5, iconY - 5);
  ctx.lineTo(iconX + 3, iconY - 11);
  ctx.lineTo(iconX + 3, iconY + 11);
  ctx.lineTo(iconX - 5, iconY + 5);
  ctx.lineTo(iconX - 10, iconY + 5);
  ctx.closePath();
  ctx.fill();

  // Sound waves
  ctx.beginPath();
  ctx.arc(iconX + 6, iconY, 8, -0.28 * Math.PI, 0.28 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(iconX + 8, iconY, 14, -0.32 * Math.PI, 0.32 * Math.PI);
  ctx.stroke();

  // Status Text
  ctx.font = "500 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "left";
  ctx.fillText("Tap orb to replay question aloud", iconX + 30, iconY + 8);

  // 6. BOTTOM CAPSULE TYPING BAR (Rounded-full, compact)
  const barW = 1200;
  const barH = 92;
  const barX = width / 2 - barW / 2;
  const barY = 1220;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 15;
  ctx.fillStyle = "#0a0c14";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, barX, barY, barW, barH, 46);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Mic Button Circle
  const micBtnX = barX + 54;
  const micBtnY = barY + 46;
  const micBtnR = 29;

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(micBtnX, micBtnY, micBtnR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw Microphone Icon
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  drawRoundedRect(ctx, micBtnX - 5, micBtnY - 11, 10, 16, 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(micBtnX, micBtnY - 2, 9, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(micBtnX, micBtnY + 7);
  ctx.lineTo(micBtnX, micBtnY + 12);
  ctx.stroke();

  // Audio Speaker Toggle Circle
  const speakerBtnX = barX + 124;
  const speakerBtnY = barY + 46;
  const speakerBtnR = 29;

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(speakerBtnX, speakerBtnY, speakerBtnR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw Speaker Icon
  ctx.fillStyle = "#d4d4d8";
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(speakerBtnX - 9, speakerBtnY - 4);
  ctx.lineTo(speakerBtnX - 5, speakerBtnY - 4);
  ctx.lineTo(speakerBtnX + 2, speakerBtnY - 9);
  ctx.lineTo(speakerBtnX + 2, speakerBtnY + 9);
  ctx.lineTo(speakerBtnX - 5, speakerBtnY + 4);
  ctx.lineTo(speakerBtnX - 9, speakerBtnY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(speakerBtnX + 4, speakerBtnY, 7, -0.3 * Math.PI, 0.3 * Math.PI);
  ctx.stroke();

  // Placeholder Text
  ctx.font = "400 25px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#71717a";
  ctx.textAlign = "left";
  ctx.fillText("Type your answer or speak with mic...", barX + 175, barY + 54);

  // Next -> Button Pill
  const nextBtnW = 150;
  const nextBtnH = 62;
  const nextBtnX = barX + barW - nextBtnW - 16;
  const nextBtnY = barY + 15;

  ctx.save();
  ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  drawRoundedRect(ctx, nextBtnX, nextBtnY, nextBtnW, nextBtnH, 31);
  ctx.fill();
  ctx.restore();

  // "Next ->" Text on button
  ctx.font = "700 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText("Next", nextBtnX + 58, nextBtnY + 40);

  // Arrow Right on button
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(nextBtnX + 90, nextBtnY + 31);
  ctx.lineTo(nextBtnX + 106, nextBtnY + 31);
  ctx.lineTo(nextBtnX + 100, nextBtnY + 25);
  ctx.moveTo(nextBtnX + 106, nextBtnY + 31);
  ctx.lineTo(nextBtnX + 100, nextBtnY + 37);
  ctx.stroke();

  // 7. BOTTOM QUICK SKIP TRIGGER ("Skip interview & explore features ↓")
  ctx.font = "500 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "center";
  const skipText = "Skip interview & explore features ↓";
  const skipTextY = 1380;
  ctx.fillText(skipText, width / 2, skipTextY);

  // Subtle underline under skip text
  const textWidth = ctx.measureText(skipText).width;
  ctx.strokeStyle = "rgba(161, 161, 170, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - textWidth / 2, skipTextY + 8);
  ctx.lineTo(width / 2 + textWidth / 2, skipTextY + 8);
  ctx.stroke();

  // Create High-Res Three.js CanvasTexture with mipmapping & 16x anisotropy
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  return texture;
}

export default generateElitePrepScreenTexture;
