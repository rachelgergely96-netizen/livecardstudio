'use client';

import { useEffect, useRef } from 'react';

type DemoType = 'celestial' | 'garden' | 'ocean' | 'aurora';

const PALETTES: Record<DemoType, { bg: string; primary: string; secondary: string }> = {
  celestial: { bg: '#0D0A14', primary: 'rgba(212,168,83,', secondary: 'rgba(240,212,138,' },
  garden: { bg: '#0A140D', primary: 'rgba(123,196,127,', secondary: 'rgba(180,230,160,' },
  ocean: { bg: '#0A0D14', primary: 'rgba(91,141,239,', secondary: 'rgba(120,200,255,' },
  aurora: { bg: '#100A14', primary: 'rgba(192,132,252,', secondary: 'rgba(240,130,200,' }
};

export function DemoCanvas({ type }: { type: DemoType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      canvas.style.background = PALETTES[type].bg;
      return;
    }

    const W = (canvas.width = 400);
    const H = (canvas.height = 250);
    let animId = 0;
    const palette = PALETTES[type];

    function onMouse(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * W;
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height) * H;
    }
    function onLeave() {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    }

    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('mouseleave', onLeave);

    function draw(time: number) {
      const t = time * 0.001;
      ctx!.fillStyle = palette.bg;
      ctx!.fillRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Floating particles
      for (let i = 0; i < 60; i++) {
        const phase = i * 1.618;
        let x = ((Math.sin(t * 0.3 + phase) * 0.5 + 0.5) * W * 1.2 - W * 0.1 + i * 7) % W;
        let y = ((Math.cos(t * 0.2 + phase * 0.7) * 0.5 + 0.5) * H * 1.2 - H * 0.1 + i * 4) % H;

        // Mouse repel
        const dx = x - mx;
        const dy = y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          const force = (100 - dist) / 100;
          x += (dx / dist) * force * 30;
          y += (dy / dist) * force * 30;
        }

        const size = 1.5 + Math.sin(t + phase) * 1;
        const alpha = 0.2 + Math.sin(t * 1.5 + phase) * 0.15;

        ctx!.beginPath();
        ctx!.arc(x, y, size, 0, Math.PI * 2);
        ctx!.fillStyle = `${i % 3 === 0 ? palette.secondary : palette.primary}${alpha})`;
        ctx!.fill();

        // Glow
        if (size > 2) {
          ctx!.beginPath();
          ctx!.arc(x, y, size * 4, 0, Math.PI * 2);
          ctx!.fillStyle = `${palette.primary}${alpha * 0.1})`;
          ctx!.fill();
        }
      }

      // Mouse glow
      if (mx > 0 && my > 0) {
        const glow = ctx!.createRadialGradient(mx, my, 0, mx, my, 80);
        glow.addColorStop(0, `${palette.primary}0.12)`);
        glow.addColorStop(1, 'transparent');
        ctx!.fillStyle = glow;
        ctx!.fillRect(0, 0, W, H);
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      canvas!.removeEventListener('mousemove', onMouse);
      canvas!.removeEventListener('mouseleave', onLeave);
    };
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={250}
      className="w-full cursor-crosshair"
    />
  );
}
