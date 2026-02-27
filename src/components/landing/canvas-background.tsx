'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  phase: number;
}

export function CanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      canvas.style.background = 'linear-gradient(180deg, #0D0A14 0%, #1A1425 50%, #0D0A14 100%)';
      return;
    }

    let W = 0;
    let H = 0;
    let animId = 0;
    const mouse = { x: -1000, y: -1000 };
    let scrollY = 0;

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    function onMouse(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function onScroll() {
      scrollY = window.scrollY;
    }
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Stars
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * 3000 - 500,
        y: Math.random() * 3000 - 500,
        r: Math.random() * 1.8 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.3
      });
    }

    // Gold dust particles
    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * 3000,
        y: Math.random() * 3000,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        r: Math.random() * 2.5 + 0.5,
        life: Math.random(),
        phase: Math.random() * Math.PI * 2
      });
    }

    function draw(time: number) {
      const t = time * 0.001;
      const scrollFactor = scrollY / (document.body.scrollHeight - H || 1);

      // Sky gradient
      const grad = ctx!.createLinearGradient(0, 0, 0, H);
      const hue1 = 260 + scrollFactor * 20;
      const hue2 = 280 - scrollFactor * 40;
      grad.addColorStop(0, `hsl(${hue1}, 45%, ${4 + scrollFactor * 3}%)`);
      grad.addColorStop(0.5, `hsl(${hue2}, 35%, ${8 + scrollFactor * 5}%)`);
      grad.addColorStop(1, `hsl(${240 + scrollFactor * 10}, 30%, ${5 + scrollFactor * 4}%)`);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);

      // Nebula glow
      const nebulaX = W * 0.65 + Math.sin(t * 0.2) * 60;
      const nebulaY = H * 0.35 + Math.cos(t * 0.15) * 40;
      const nebGrad = ctx!.createRadialGradient(nebulaX, nebulaY, 0, nebulaX, nebulaY, 350 + Math.sin(t * 0.3) * 50);
      nebGrad.addColorStop(0, `hsla(35, 70%, 50%, ${0.06 + scrollFactor * 0.03})`);
      nebGrad.addColorStop(0.5, `hsla(280, 40%, 40%, ${0.04 + scrollFactor * 0.02})`);
      nebGrad.addColorStop(1, 'transparent');
      ctx!.fillStyle = nebGrad;
      ctx!.fillRect(0, 0, W, H);

      // Second nebula
      const neb2X = W * 0.25 + Math.cos(t * 0.18) * 50;
      const neb2Y = H * 0.65 + Math.sin(t * 0.22) * 30;
      const neb2Grad = ctx!.createRadialGradient(neb2X, neb2Y, 0, neb2X, neb2Y, 280);
      neb2Grad.addColorStop(0, 'hsla(320, 50%, 45%, 0.04)');
      neb2Grad.addColorStop(1, 'transparent');
      ctx!.fillStyle = neb2Grad;
      ctx!.fillRect(0, 0, W, H);

      // Stars
      for (const s of stars) {
        const parallax = 0.05 * s.r;
        const sx = ((s.x - scrollY * parallax) % (W + 200) + W + 200) % (W + 200) - 100;
        const sy = ((s.y - scrollY * parallax * 0.5) % (H + 200) + H + 200) % (H + 200) - 100;
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        ctx!.beginPath();
        ctx!.arc(sx, sy, s.r * twinkle, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 248, 230, ${0.3 + twinkle * 0.6})`;
        ctx!.fill();

        if (s.r > 1.2) {
          ctx!.beginPath();
          ctx!.arc(sx, sy, s.r * 3, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(212, 168, 83, ${0.04 * twinkle})`;
          ctx!.fill();
        }
      }

      // Gold dust particles
      for (const p of particles) {
        p.x += p.vx + Math.sin(t + p.phase) * 0.2;
        p.y += p.vy;
        p.life -= 0.001;

        if (p.life <= 0 || p.y < -50) {
          p.x = Math.random() * W;
          p.y = H + 20;
          p.life = 1;
          p.vx = (Math.random() - 0.5) * 0.3;
          p.vy = -Math.random() * 0.5 - 0.15;
        }

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = ((150 - dist) / 150) * 0.8;
          p.vx += (dx / dist) * force * 0.05;
          p.vy += (dy / dist) * force * 0.05;
        }

        const alpha = p.life * (0.3 + 0.2 * Math.sin(t * 2 + p.phase));
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(212, 178, 100, ${alpha})`;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(212, 168, 83, ${alpha * 0.15})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />;
}
