/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  decay: number;
  color: string;
  type: 'heart' | 'star';
  angle?: number;
  scale?: number;
  wobble?: number;
  wobbleSpeed?: number;
}

export default function FloatingHeartsAndStars() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles: Particle[] = [];
    let bgStars: { x: number; y: number; size: number; opacity: number; speed: number }[] = [];

    // Initialize 60 background twinkling stars
    for (let i = 0; i < 60; i++) {
      bgStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
      });
    }

    const drawHeart = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
      opacity: number
    ) => {
      context.save();
      context.translate(x, y);
      context.beginPath();
      // Simple Heart mathematical path or standard cubic beziers
      const topCurveHeight = size * 0.3;
      context.moveTo(0, topCurveHeight);
      // Left side curve
      context.bezierCurveTo(-size / 2, -size / 2, -size, topCurveHeight, 0, size);
      // Right side curve
      context.bezierCurveTo(size, topCurveHeight, size / 2, -size / 2, 0, topCurveHeight);
      context.closePath();
      context.fillStyle = color;
      context.globalAlpha = opacity;
      context.fill();
      context.restore();
    };

    // Spawn a standard floating heart starting from the bottom of the screen
    const spawnHeart = () => {
      const colors = [
        'rgba(240, 113, 120, ', // rose red
        'rgba(242, 132, 130, ', // blush pink
        'rgba(224, 122, 95, ',  // warm rust
        'rgba(242, 204, 143, ', // yellow gold
        'rgba(181, 131, 141, ', // dusty rose
      ];
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * width,
        y: height + 30,
        size: Math.random() * 12 + 8,
        speedY: -(Math.random() * 1.2 + 0.8),
        speedX: 0,
        opacity: Math.random() * 0.4 + 0.5,
        decay: Math.random() * 0.003 + 0.001,
        color: baseColor,
        type: 'heart',
        wobble: Math.random() * 100,
        wobbleSpeed: Math.random() * 0.03 + 0.01,
      });
    };

    // Spawn hearts on anywhere click
    const handleGlobalClick = (e: MouseEvent) => {
      const colors = [
        'rgba(240, 113, 120, ',
        'rgba(242, 132, 130, ',
        'rgba(242, 204, 143, ',
      ];
      // Spawn 6 small hearts bursting out from the click coordinate
      for (let i = 0; i < 6; i++) {
        const baseColor = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 8 + 6,
          speedY: Math.sin(angle) * speed,
          speedX: Math.cos(angle) * speed,
          opacity: 1,
          decay: Math.random() * 0.015 + 0.01,
          color: baseColor,
          type: 'heart',
          wobble: Math.random() * 100,
          wobbleSpeed: 0.05,
        });
      }
    };

    window.addEventListener('click', handleGlobalClick);

    // Initial heart spawn
    let lastSpawn = 0;

    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw static background twinkling stars
      bgStars.forEach((star) => {
        star.opacity += star.speed;
        if (star.opacity > 1 || star.opacity < 0) {
          star.speed = -star.speed;
        }
        ctx.fillStyle = `rgba(244, 241, 222, ${Math.max(0.1, star.opacity)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Periodic spawn hearts
      if (time - lastSpawn > 1200) {
        spawnHeart();
        lastSpawn = time;
      }

      // 3. Update & render rose particles
      particles = particles.filter((p) => {
        p.opacity -= p.decay;
        if (p.opacity <= 0) return false;

        // Apply movement
        if (p.type === 'heart') {
          if (p.wobble !== undefined && p.wobbleSpeed !== undefined) {
            p.wobble += p.wobbleSpeed;
            p.x += Math.sin(p.wobble) * 0.4 + p.speedX;
          } else {
            p.x += p.speedX;
          }
          p.y += p.speedY;
          // Slowly decrease horizontal drift speed
          p.speedX *= 0.98;

          drawHeart(ctx, p.x, p.y, p.size, `${p.color}${p.opacity})`, p.opacity);
        }
        return p.y > -50 && p.x > -50 && p.x < width + 50;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // Re-initialize stars to populate new screen layout
      bgStars = [];
      for (let i = 0; i < 60; i++) {
        bgStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random(),
          speed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="floating-hearts-canvas"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'plus-lighter' }}
    />
  );
}
