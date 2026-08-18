import { useEffect, useRef } from 'react';

interface ParticleConstellationProps {
  audioLevel: number;
  frequencyData: number[];
  colorTheme?: 'cyan' | 'emerald' | 'amber';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
}

export function ParticleConstellation({
  audioLevel,
  frequencyData,
  colorTheme = 'cyan',
}: ParticleConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const numParticles = 45;
    const particles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2 + 1,
        baseAlpha: Math.random() * 0.4 + 0.2,
      });
    }

    const getColor = (alpha: number) => {
      if (colorTheme === 'emerald') return `rgba(16, 185, 129, ${alpha})`;
      if (colorTheme === 'amber') return `rgba(245, 158, 11, ${alpha})`;
      return `rgba(6, 182, 212, ${alpha})`;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const boost = 1 + audioLevel * 2.5;

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 120 + audioLevel * 60;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.25 * boost;
            ctx.beginPath();
            ctx.strokeStyle = getColor(alpha);
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * boost;
        p.y += p.vy * boost;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentSize = p.size * (1 + audioLevel * 1.2);
        const alpha = Math.min(1, p.baseAlpha * boost);

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = getColor(alpha);
        ctx.shadowBlur = 8 + audioLevel * 15;
        ctx.shadowColor = getColor(0.8);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [audioLevel, colorTheme, frequencyData]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70"
    />
  );
}

