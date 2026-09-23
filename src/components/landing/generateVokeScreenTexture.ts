import * as THREE from "three";

/**
 * Generates a high-resolution 1920x1200 canvas texture representing
 * Voke's live website interface running on the MacBook screen.
 */
export function generateVokeScreenTexture(): THREE.CanvasTexture {
  const width = 1920;
  const height = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    // Fallback simple texture
    const fallback = new THREE.CanvasTexture(canvas);
    return fallback;
  }

  // 1. Deep Solid Dark Background
  ctx.fillStyle = "#06070a";
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient Center Radial Glow
  const radialGlow = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, 700);
  radialGlow.addColorStop(0, "rgba(56, 189, 248, 0.15)");
  radialGlow.addColorStop(0.4, "rgba(14, 116, 144, 0.07)");
  radialGlow.addColorStop(1, "rgba(6, 7, 10, 0)");
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. Precision Geometric Grid Lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  const gridSize = 48;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 4. Top Navigation Bar
  const navY = 32;
  const navHeight = 64;
  const navX = 80;
  const navWidth = width - 160;

  ctx.save();
  ctx.fillStyle = "rgba(12, 14, 22, 0.85)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(navX, navY, navWidth, navHeight, 32);
  ctx.fill();
  ctx.stroke();

  // Logo Icon
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.roundRect(navX + 24, navY + 16, 32, 32, 8);
  ctx.fill();

  // Logo V
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("V", navX + 32, navY + 40);

  // Logo Text
  ctx.font = "800 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Voke", navX + 68, navY + 40);

  // Nav Links
  ctx.font = "500 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "rgba(226, 232, 240, 0.8)";
  const navLinks = ["Features", "Job Matching", "How it Works", "Pricing"];
  let linkX = navX + 240;
  navLinks.forEach((link) => {
    ctx.fillText(link, linkX, navY + 38);
    linkX += 130;
  });

  // Nav Right Buttons
  // Sign in as College
  const collegeBtnX = navX + navWidth - 280;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.fillStyle = "rgba(56, 189, 248, 0.1)";
  ctx.beginPath();
  ctx.roundRect(collegeBtnX, navY + 14, 150, 36, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#38bdf8";
  ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Sign in as College", collegeBtnX + 16, navY + 37);

  // Get Started
  const startBtnX = navX + navWidth - 110;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(startBtnX, navY + 14, 90, 36, 18);
  ctx.fill();
  ctx.fillStyle = "#000000";
  ctx.font = "700 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Get Started", startBtnX + 10, navY + 37);
  ctx.restore();

  // 5. Main Hero Section inside Screen
  const heroCenterX = width / 2;

  // Subtitle Badge
  ctx.save();
  ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
  ctx.lineWidth = 1;
  const badgeWidth = 360;
  ctx.beginPath();
  ctx.roundRect(heroCenterX - badgeWidth / 2, 200, badgeWidth, 34, 17);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✨  VOKE AI · NEXT-GEN MOCK INTERVIEW STUDIO", heroCenterX, 222);

  // Big Headline: "Master Tech Rounds & Secure the Offer."
  ctx.font = "900 68px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Master Tech Rounds &", heroCenterX, 310);

  // Gradient text for "Secure the Offer."
  const titleGrad = ctx.createLinearGradient(heroCenterX - 260, 380, heroCenterX + 260, 380);
  titleGrad.addColorStop(0, "#7dd3fc");
  titleGrad.addColorStop(0.5, "#a5f3fc");
  titleGrad.addColorStop(1, "#ffffff");
  ctx.fillStyle = titleGrad;
  ctx.fillText("Secure the Offer.", heroCenterX, 390);

  // Subtitle
  ctx.font = "400 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "rgba(203, 213, 225, 0.85)";
  ctx.fillText("Practice realistic technical, coding, and behavioral AI mock interviews", heroCenterX, 450);
  ctx.fillText("with real-time biometric telemetry and instant feedback.", heroCenterX, 480);

  // CTAs inside screen
  const ctaWidth = 230;
  const ctaHeight = 54;
  const ctaY = 530;

  // Button 1: Start Preparing Free
  const ctaGrad = ctx.createLinearGradient(heroCenterX - ctaWidth - 10, ctaY, heroCenterX - 10, ctaY);
  ctaGrad.addColorStop(0, "#0284c7");
  ctaGrad.addColorStop(1, "#2563eb");
  ctx.fillStyle = ctaGrad;
  ctx.beginPath();
  ctx.roundRect(heroCenterX - ctaWidth - 12, ctaY, ctaWidth, ctaHeight, 27);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Start Preparing Free →", heroCenterX - ctaWidth / 2 - 12, ctaY + 34);

  // Button 2: Watch Demo
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(heroCenterX + 12, ctaY, 190, ctaHeight, 27);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("▶  Platform Demo", heroCenterX + 107, ctaY + 34);

  // 6. Floating UI Mockup Windows in lower half of screen
  // Card 1: Webcam Feed Simulator
  const card1X = 220;
  const card1Y = 660;
  const card1W = 460;
  const card1H = 260;
  ctx.fillStyle = "rgba(10, 12, 18, 0.9)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(card1X, card1Y, card1W, card1H, 20);
  ctx.fill();
  ctx.stroke();

  // Card 1 Top Bar
  ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
  ctx.beginPath();
  ctx.arc(card1X + 24, card1Y + 24, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "700 11px monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.textAlign = "left";
  ctx.fillText("WEBCAM TRACKING ACTIVE", card1X + 38, card1Y + 28);

  ctx.fillStyle = "rgba(52, 211, 153, 0.15)";
  ctx.strokeStyle = "rgba(52, 211, 153, 0.3)";
  ctx.beginPath();
  ctx.roundRect(card1X + card1W - 120, card1Y + 14, 100, 22, 11);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#34d399";
  ctx.font = "700 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("EYE CONTACT 95%", card1X + card1W - 70, card1Y + 29);

  // Face scanning mesh dots
  ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      ctx.beginPath();
      ctx.arc(card1X + 160 + c * 28, card1Y + 80 + r * 28, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Live Dialogue Speech Bubble
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.roundRect(card1X + 24, card1Y + 180, card1W - 48, 60, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("AI COACH:", card1X + 40, card1Y + 202);
  ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
  ctx.font = "400 12px monospace";
  ctx.fillText('"Explain how optimistic updates prevent write bottlenecks."', card1X + 40, card1Y + 224);

  // Card 2: Code Editor & Test Runner Mockup
  const card2X = width - 220 - 460;
  const card2Y = 660;
  const card2W = 460;
  const card2H = 260;
  ctx.fillStyle = "rgba(10, 12, 18, 0.9)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(card2X, card2Y, card2W, card2H, 20);
  ctx.fill();
  ctx.stroke();

  // Traffic lights
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(card2X + 24, card2Y + 24, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(card2X + 38, card2Y + 24, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#10b981";
  ctx.beginPath();
  ctx.arc(card2X + 52, card2Y + 24, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "600 11px monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillText("Solution.ts — Monaco Sandbox", card2X + 70, card2Y + 28);

  // Code lines
  ctx.font = "12px monospace";
  ctx.fillStyle = "#818cf8";
  ctx.fillText("function partitionHighThroughputWrites() {", card2X + 24, card2Y + 70);
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("  const shard = hashKey(userId) % CLUSTER_SIZE;", card2X + 24, card2Y + 98);
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("  return redisPool.writeQueue(shard);", card2X + 24, card2Y + 126);
  ctx.fillStyle = "#818cf8";
  ctx.fillText("}", card2X + 24, card2Y + 154);

  // Pass badge
  ctx.fillStyle = "rgba(52, 211, 153, 0.15)";
  ctx.strokeStyle = "rgba(52, 211, 153, 0.35)";
  ctx.beginPath();
  ctx.roundRect(card2X + 24, card2Y + 185, card2W - 48, 50, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#34d399";
  ctx.font = "700 12px monospace";
  ctx.fillText("✓ 14/14 TEST CASES PASSED · O(1) COMPLEXITY", card2X + 44, card2Y + 215);

  ctx.restore();

  // Create Three.js CanvasTexture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}
