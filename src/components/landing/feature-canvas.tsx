'use client';

import { useEffect, useRef } from 'react';

type FeatureType = 'waves' | 'particles' | 'spiral';

export function FeatureCanvas({ type }: { type: FeatureType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return;

    const W = (canvas.width = 320);
    const H = (canvas.height = 220);
    let animId = 0;

    function draw(time: number) {
      const t = time * 0.001;
      ctx!.clearRect(0, 0, W, H);

      if (type === 'waves') {
        for (let row = 0; row < 5; row++) {
          ctx!.beginPath();
          const y0 = 60 + row * 30;
          for (let x = 0; x <= W; x += 4) {
            const y = y0 + Math.sin(x * 0.02 + t * (1 + row * 0.3) + row) * (12 + row * 3);
            if (x === 0) { ctx!.moveTo(x, y); } else { ctx!.lineTo(x, y); }
          }
          ctx!.strokeStyle = `rgba(212, 168, 83, ${0.15 + row * 0.08})`;
          ctx!.lineWidth = 1.5;
          ctx!.stroke();
        }
      } else if (type === 'particles') {
        for (let i = 0; i < 40; i++) {
          const angle = (i / 40) * Math.PI * 2 + t * 0.3;
          const r = 50 + Math.sin(t * 0.5 + i) * 20 + i * 1.2;
          const x = W / 2 + Math.cos(angle) * r;
          const y = H / 2 + Math.sin(angle) * r * 0.6;
          const size = 2 + Math.sin(t + i * 0.5) * 1.5;
          ctx!.beginPath();
          ctx!.arc(x, y, size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(212, 168, 83, ${0.3 + Math.sin(t + i) * 0.2})`;
          ctx!.fill();
        }
      } else {
        // spiral
        ctx!.beginPath();
        for (let i = 0; i < 300; i++) {
          const angle = i * 0.08 + t * 0.5;
          const r = i * 0.35;
          const x = W / 2 + Math.cos(angle) * r;
          const y = H / 2 + Math.sin(angle) * r * 0.7;
          if (i === 0) { ctx!.moveTo(x, y); } else { ctx!.lineTo(x, y); }
        }
        ctx!.strokeStyle = 'rgba(212, 168, 83, 0.25)';
        ctx!.lineWidth = 1;
        ctx!.stroke();

        // dots along spiral
        for (let i = 0; i < 300; i += 15) {
          const angle = i * 0.08 + t * 0.5;
          const r = i * 0.35;
          const x = W / 2 + Math.cos(angle) * r;
          const y = H / 2 + Math.sin(angle) * r * 0.7;
          ctx!.beginPath();
          ctx!.arc(x, y, 2, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(240, 212, 138, ${0.4 + Math.sin(t * 2 + i * 0.1) * 0.3})`;
          ctx!.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={220}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
    />
  );
}
