'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Matrix, eigenvalues2x2, transformPoint, multiply, createMatrix,
  roundMatrix, determinant
} from '@/lib/math';
import MatrixGrid from '@/components/MatrixGrid';
import { useProgress } from '@/lib/progress';
import Link from 'next/link';

// Rubber Sheet Visualizer
function RubberSheet() {
  const [matrix, setMatrix] = useState<Matrix>([[2, 1], [1, 3]]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 400;

  const eig = eigenvalues2x2(matrix);
  const det = determinant(matrix);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const scale = 40;

    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, size, size);

    const toScreen = (x: number, y: number): [number, number] => [
      cx + x * scale,
      cy - y * scale,
    ];

    // Original grid dots
    ctx.fillStyle = 'rgba(76, 204, 255, 0.1)';
    for (let x = -4; x <= 4; x++) {
      for (let y = -4; y <= 4; y++) {
        const [sx, sy] = toScreen(x, y);
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Transformed grid dots
    ctx.fillStyle = 'rgba(255, 184, 77, 0.25)';
    for (let x = -4; x <= 4; x++) {
      for (let y = -4; y <= 4; y++) {
        const [tx, ty] = transformPoint(matrix, x, y);
        const [sx, sy] = toScreen(tx, ty);
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Axes
    ctx.strokeStyle = 'rgba(76, 204, 255, 0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(size, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, size); ctx.stroke();

    // Eigenvector lines
    eig.vectors.forEach((vec, idx) => {
      const len = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
      if (len < 0.001) return;
      const nx = vec[0] / len * 5;
      const ny = vec[1] / len * 5;

      ctx.strokeStyle = idx === 0 ? '#4dff91' : '#ff4d6a';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      const [sx, sy] = toScreen(-nx, -ny);
      const [ex, ey] = toScreen(nx, ny);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);

      // Transformed eigenvector (should be same direction, scaled)
      const [tx, ty] = transformPoint(matrix, vec[0], vec[1]);
      const tLen = Math.sqrt(tx * tx + ty * ty);
      if (tLen > 0.001) {
        const tnx = tx / tLen * 5;
        const tny = ty / tLen * 5;
        ctx.strokeStyle = idx === 0 ? 'rgba(77, 255, 145, 0.3)' : 'rgba(255, 77, 106, 0.3)';
        ctx.lineWidth = 3;
        const [tsx, tsy] = toScreen(-tnx, -tny);
        const [tex, tey] = toScreen(tnx, tny);
        ctx.beginPath();
        ctx.moveTo(tsx, tsy);
        ctx.lineTo(tex, tey);
        ctx.stroke();
      }

      // Labels
      ctx.fillStyle = idx === 0 ? '#4dff91' : '#ff4d6a';
      ctx.font = '11px "Space Grotesk"';
      const [lx, ly] = toScreen(nx * 1.1, ny * 1.1);
      ctx.fillText(`λ=${eig.values[idx].toFixed(2)}`, lx, ly);
    });

    // Origin
    ctx.fillStyle = '#e8f0ff';
    const [ox, oy] = toScreen(0, 0);
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [matrix, size]);

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">🔮 橡皮筋变换</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        调整矩阵，观察网格点的变换。虚线是特征向量方向——它们在变换后方向不变，只是拉伸。
        <span className="text-success">绿色</span> = λ₁={eig.values[0].toFixed(2)}，<span className="text-error">红色</span> = λ₂={eig.values[1].toFixed(2)}
      </p>
      <div className="flex flex-wrap items-start gap-6">
        <div>
          <MatrixGrid matrix={matrix} onChange={setMatrix} size="lg" />
          <div className="mt-2 text-xs font-mono text-text-muted">
            det = {det.toFixed(2)} | λ₁×λ₂ = {(eig.values[0] * eig.values[1]).toFixed(2)}
          </div>
        </div>
        <canvas ref={canvasRef} style={{ width: size, height: size }} className="rounded-lg border border-border-subtle" />
      </div>
      <div className="flex gap-2 mt-4 flex-wrap">
        <button onClick={() => setMatrix([[2, 0], [0, 3]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">纯缩放</button>
        <button onClick={() => setMatrix([[0, -1], [1, 0]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">旋转</button>
        <button onClick={() => setMatrix([[3, 1], [0, 2]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">上三角</button>
        <button onClick={() => setMatrix([[1, 1], [1, 1]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">奇异</button>
        <button onClick={() => setMatrix([[2, 1], [1, 3]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">一般</button>
      </div>
    </div>
  );
}

// Calculation walkthrough
function EigenCalc() {
  const [matrix, setMatrix] = useState<Matrix>([[2, 1], [1, 3]]);
  const eig = eigenvalues2x2(matrix);
  const a = matrix[0][0], b = matrix[0][1], c = matrix[1][0], d = matrix[1][1];
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">📐 特征值计算步骤</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        对于 2×2 矩阵，特征值满足 λ² − tr(A)λ + det(A) = 0
      </p>
      <div className="mb-4">
        <MatrixGrid matrix={matrix} onChange={setMatrix} size="md" />
      </div>
      <div className="space-y-3 font-mono text-sm">
        <div className="glass-panel p-3">
          <span className="text-text-muted">迹 (trace) = a + d = </span>
          <span className="text-amber">{a} + {d} = {trace}</span>
        </div>
        <div className="glass-panel p-3">
          <span className="text-text-muted">行列式 (det) = ad − bc = </span>
          <span className="text-amber">{a}×{d} − {b}×{c} = {det}</span>
        </div>
        <div className="glass-panel p-3">
          <span className="text-text-muted">判别式 = trace² − 4·det = </span>
          <span className="text-amber">{trace}² − 4×{det} = {disc.toFixed(2)}</span>
        </div>
        <div className="glass-panel p-3">
          <span className="text-text-muted">λ = (trace ± √disc) / 2</span>
        </div>
        <div className="glass-panel p-3 border-success/20">
          <span className="text-success">λ₁ = </span>
          <span className="text-text-primary font-bold">{eig.values[0].toFixed(4)}</span>
          <span className="text-text-dim mx-3">|</span>
          <span className="text-error">λ₂ = </span>
          <span className="text-text-primary font-bold">{eig.values[1].toFixed(4)}</span>
        </div>
        <div className="glass-panel p-3">
          <div className="text-text-muted text-xs mb-1">特征向量：</div>
          <div className="text-success">v₁ = [{eig.vectors[0].map(v => v.toFixed(3)).join(', ')}]</div>
          <div className="text-error">v₂ = [{eig.vectors[1].map(v => v.toFixed(3)).join(', ')}]</div>
        </div>
      </div>
    </div>
  );
}

export default function EigenPage() {
  const { progress, complete } = useProgress();
  const [tab, setTab] = useState(0);
  const tabs = ['橡皮筋变换', '计算步骤'];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-text-dim text-sm hover:text-cyan transition-colors">← 返回</Link>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-cyan mb-2">🔮 特征值与特征向量</h1>
        <p className="text-text-muted font-body mb-6">
          特征向量是变换中方向不变的向量，特征值是其拉伸倍数。Av = λv
        </p>

        <div className="flex gap-2 mb-6">
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-lg text-sm font-body transition-all ${tab === i ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'bg-surface text-text-muted'}`}>
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {tab === 0 && <RubberSheet />}
            {tab === 1 && <EigenCalc />}
          </motion.div>
        </AnimatePresence>

        {!progress.eigen && (
          <div className="mt-8 text-center">
            <button onClick={() => complete('eigen')} className="px-6 py-3 bg-cyan/10 text-cyan rounded-lg font-body text-sm hover:bg-cyan/20 transition-all border border-cyan/20">
              ✅ 完成此模块
            </button>
          </div>
        )}
        {progress.eigen && (
          <div className="mt-6 text-center text-success text-sm font-body">
            ✓ 模块已完成！
            <Link href="/challenge" className="ml-3 text-cyan hover:underline">去挑战竞技场 →</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
