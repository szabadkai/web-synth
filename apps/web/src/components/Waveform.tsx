import React, { useEffect, useRef, useState } from 'react';
import type { AudioEngine } from '../audio/engine';

type Props = {
  engine: AudioEngine;
  width?: number;
  height?: number;
  color?: string;
  background?: string;
};

export default function Waveform({
  engine,
  width,
  height = 120,
  color = '#09f',
  background = '#111',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Uint8Array | null>(null);
  const [cw, setCw] = useState<number>(width ?? 600);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    // measure parent width when width is not provided
    let ro: ResizeObserver | null = null;
    if (!width) {
      const parent = canvas.parentElement as HTMLElement | null;
      const next = parent?.clientWidth ?? 600;
      if (next !== cw) setCw(next);
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const nextW = Math.floor(entry.contentRect.width);
          if (nextW && nextW !== cw) setCw(nextW);
        }
      });
      if (parent) ro.observe(parent);
    }

    const dpr = window.devicePixelRatio || 1;
    const wInit = width ?? cw;
    canvas.width = Math.floor(wInit * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${wInit}px`;
    canvas.style.height = `${height}px`;
    ctx2d.setTransform(1, 0, 0, 1, 0, 0);
    ctx2d.scale(dpr, dpr);

    const draw = () => {
      const analyser = engine.getAnalyser();
      // clear
      const wDraw = width ?? cw;
      ctx2d.fillStyle = background;
      ctx2d.fillRect(0, 0, wDraw, height);

      if (!analyser) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const bins = analyser.frequencyBinCount;
      if (!bufferRef.current || bufferRef.current.length !== bins) {
        bufferRef.current = new Uint8Array(bins);
      }
      const data = bufferRef.current;
      analyser.getByteTimeDomainData(data);

      // Compute simple RMS amplitude to reflect envelope level
      let sumSq = 0;
      for (let i = 0; i < bins; i++) {
        const dv = (data[i] - 128) / 128; // roughly -1..1
        sumSq += dv * dv;
      }
      const rms = Math.sqrt(sumSq / bins); // 0..~1

      // Draw envelope bar (centered), height proportional to RMS
      const envH = Math.max(2, Math.min(height, height * rms));
      const envY = (height - envH) / 2;
      ctx2d.save();
      ctx2d.globalAlpha = 0.18;
      ctx2d.fillStyle = color;
      ctx2d.fillRect(0, envY, wDraw, envH);
      ctx2d.globalAlpha = 0.35;
      ctx2d.fillRect(0, envY, wDraw, 1);
      ctx2d.fillRect(0, envY + envH - 1, wDraw, 1);
      ctx2d.restore();

      // Find a stable cycle via zero-crossing
      // 1) find first upward zero-crossing
      let start = 0;
      for (let i = 1; i < bins; i++) {
        if (data[i - 1] < 128 && data[i] >= 128) {
          start = i;
          break;
        }
      }
      // 2) find next upward zero-crossing to define one period
      let end = start + 1;
      for (let i = start + 1; i < bins; i++) {
        if (data[i - 1] < 128 && data[i] >= 128) {
          end = i;
          break;
        }
      }
      if (end <= start) end = Math.min(start + Math.floor(bins / 4), bins - 1); // fallback
      const period = Math.max(1, end - start);

      ctx2d.strokeStyle = color;
      ctx2d.lineWidth = 2;
      ctx2d.beginPath();
      for (let i = 0; i < wDraw; i++) {
        // sample the single cycle and stretch to canvas width
        const idx = start + Math.floor((i / wDraw) * period);
        const v = data[Math.min(idx, bins - 1)] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx2d.moveTo(0, y);
        else ctx2d.lineTo(i, y);
      }
      ctx2d.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ro) ro.disconnect();
    };
  }, [engine, width, cw, height, color, background]);

  return (
    <div className="panel wave-panel" aria-label="Waveform Visualizer">
      <canvas ref={canvasRef} />
    </div>
  );
}
