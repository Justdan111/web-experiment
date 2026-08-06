"use client";

import { useEffect, useRef } from "react";
import { registerBall, unregisterBall } from "./pointer";

/**
 * The lime particle sphere that stands in for the "O" of FORT.
 * Points are distributed with a Fibonacci lattice, spun on Y, tilted on X,
 * and pushed aside by the racket cursor.
 */
export default function ParticleBall({
  count = 4200,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = count;
    const pts = new Float32Array(N * 3);
    const GA = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = GA * i;
      pts[i * 3] = Math.cos(th) * r;
      pts[i * 3 + 1] = y;
      pts[i * 3 + 2] = Math.sin(th) * r;
    }

    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let rad = 0;

    const size = () => {
      const cw = canvas.offsetWidth || 290;
      const ch = canvas.offsetHeight || 290;
      w = cw;
      h = ch;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = cw / 2;
      cy = ch / 2;
      rad = Math.min(cw, ch) * 0.47;
    };
    size();

    let mx = -9999;
    let my = -9999;
    let visible = true;

    // pointer is shared: viewport coords in, canvas-local coords out
    const handle = registerBall((x: number | null, y: number | null) => {
      if (x === null || y === null) {
        mx = my = -9999;
        return;
      }
      const b = canvas.getBoundingClientRect();
      if (!b.width || !b.height) return;
      mx = ((x - b.left) * w) / b.width;
      my = ((y - b.top) * h) / b.height;
    });

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (visible = e.isIntersecting)),
      { rootMargin: "200px" },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    const cosT = Math.cos(-0.28);
    const sinT = Math.sin(-0.28);
    let raf = 0;
    let t0 = 0;

    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      if (!t0) t0 = ts;
      const a = (ts - t0) * 0.00016;
      ctx.clearRect(0, 0, w, h);

      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const dot = rad * 0.0125;
      ctx.fillStyle = "#CCFF00";

      for (let i = 0; i < N; i++) {
        const x = pts[i * 3];
        const y = pts[i * 3 + 1];
        const z = pts[i * 3 + 2];

        const x1 = x * ca - z * sa;
        const z1 = x * sa + z * ca;
        const y1 = y * cosT - z1 * sinT;
        const z2 = y * sinT + z1 * cosT;

        let px = cx + x1 * rad;
        let py = cy + y1 * rad;

        if (mx > -9000) {
          const dx = px - mx;
          const dy = py - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < 7000 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = (1 - d / 84) * 26;
            px += (dx / d) * push;
            py += (dy / d) * push;
          }
        }

        const depth = (z2 + 1) * 0.5;
        ctx.globalAlpha = 0.16 + depth * 0.84;
        const s = dot * (0.55 + depth * 0.75);
        ctx.fillRect(px, py, s, s);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      unregisterBall(handle);
    };
  }, [count]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
