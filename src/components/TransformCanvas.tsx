'use client';

import { useRef, useEffect } from 'react';
import { Matrix, transformPoint } from '@/lib/math';

interface TransformCanvasProps {
  matrix: Matrix;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showUnitSquare?: boolean;
  showTransformed?: boolean;
  showEigenvectors?: boolean;
  eigenVectors?: number[][];
  eigenValues?: number[];
  animated?: boolean;
  className?: string;
}

export default function TransformCanvas({
  matrix,
  width = 400,
  height = 400,
  showGrid = true,
  showUnitSquare = true,
  showTransformed = true,
  showEigenvectors = false,
  eigenVectors,
  eigenValues,
  className = '',
}: TransformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const scale = width / 8;

    // Clear
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, width, height);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(76, 204, 255, 0.06)';
      ctx.lineWidth = 0.5;
      for (let x = cx % scale; x < width; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = cy % scale; y < height; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(76, 204, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
    }

    const toScreen = (x: number, y: number): [number, number] => [
      cx + x * scale,
      cy - y * scale,
    ];

    // Unit square
    if (showUnitSquare) {
      const unitSquare = [[0, 0], [1, 0], [1, 1], [0, 1]];
      ctx.fillStyle = 'rgba(76, 204, 255, 0.08)';
      ctx.strokeStyle = 'rgba(76, 204, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      unitSquare.forEach(([x, y], i) => {
        const [sx, sy] = toScreen(x, y);
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Transformed shape
    if (showTransformed && matrix.length >= 2 && matrix[0].length >= 2) {
      const unitSquare = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const transformed = unitSquare.map(([x, y]) => transformPoint(matrix, x, y));

      ctx.fillStyle = 'rgba(255, 184, 77, 0.12)';
      ctx.strokeStyle = 'rgba(255, 184, 77, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      transformed.forEach(([x, y], i) => {
        const [sx, sy] = toScreen(x, y);
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Basis vectors
      const [e1x, e1y] = transformPoint(matrix, 1, 0);
      const [e2x, e2y] = transformPoint(matrix, 0, 1);

      // e1 arrow
      ctx.strokeStyle = '#4dff91';
      ctx.lineWidth = 2;
      const [s1x, s1y] = toScreen(0, 0);
      const [t1x, t1y] = toScreen(e1x, e1y);
      ctx.beginPath();
      ctx.moveTo(s1x, s1y);
      ctx.lineTo(t1x, t1y);
      ctx.stroke();

      // e2 arrow
      ctx.strokeStyle = '#ff4d6a';
      const [t2x, t2y] = toScreen(e2x, e2y);
      ctx.beginPath();
      ctx.moveTo(s1x, s1y);
      ctx.lineTo(t2x, t2y);
      ctx.stroke();
    }

    // Eigenvectors
    if (showEigenvectors && eigenVectors) {
      eigenVectors.forEach((vec, idx) => {
        const len = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
        if (len < 0.001) return;
        const nx = vec[0] / len * 4;
        const ny = vec[1] / len * 4;
        ctx.strokeStyle = idx === 0 ? '#4dff91' : '#ff4d6a';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const [sx, sy] = toScreen(-nx, -ny);
        const [ex, ey] = toScreen(nx, ny);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        if (eigenValues) {
          ctx.fillStyle = idx === 0 ? '#4dff91' : '#ff4d6a';
          ctx.font = '12px "Space Grotesk"';
          ctx.fillText(`λ=${eigenValues[idx].toFixed(2)}`, ex + 5, ey - 5);
        }
      });
    }

    // Origin dot
    const [ox, oy] = toScreen(0, 0);
    ctx.fillStyle = '#e8f0ff';
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
    ctx.fill();

  }, [matrix, width, height, showGrid, showUnitSquare, showTransformed, showEigenvectors, eigenVectors, eigenValues]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`rounded-lg border border-border-subtle ${className}`}
    />
  );
}
