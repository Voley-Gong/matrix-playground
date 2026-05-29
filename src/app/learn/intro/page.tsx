'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Matrix, createMatrix, transformPoint } from '@/lib/math';
import MatrixGrid from '@/components/MatrixGrid';
import TransformCanvas from '@/components/TransformCanvas';
import { useProgress } from '@/lib/progress';
import { useEffect } from 'react';
import Link from 'next/link';

// Sub-module 1: Pixel Art Pad
function PixelArtPad() {
  const [grid, setGrid] = useState<Matrix>(createMatrix(5, 5, 0));
  const [paintValue, setPaintValue] = useState(1);

  const toggleCell = (r: number, c: number) => {
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = newGrid[r][c] === paintValue ? 0 : paintValue;
    setGrid(newGrid);
  };

  const colorMap: Record<number, string> = {
    0: 'bg-surface/50',
    1: 'bg-cyan/60',
    2: 'bg-amber/60',
    3: 'bg-success/60',
    4: 'bg-error/60',
  };

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">🎨 像素画板</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        矩阵就是一个数字方格！点击格子来涂色。每个格子里存放一个数字，这就构成了一个矩阵。
      </p>
      <div className="flex flex-wrap items-start gap-6">
        <div>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4].map(v => (
              <button
                key={v}
                onClick={() => setPaintValue(v)}
                className={`w-8 h-8 rounded ${colorMap[v]} ${paintValue === v ? 'ring-2 ring-text-primary' : ''} transition-all`}
              />
            ))}
          </div>
          <div className="inline-block border border-border-subtle rounded-lg overflow-hidden">
            {grid.map((row, r) => (
              <div key={r} className="flex">
                {row.map((val, c) => (
                  <motion.div
                    key={c}
                    className={`w-12 h-12 cursor-pointer border border-border-subtle ${colorMap[val] || 'bg-surface/50'} flex items-center justify-center font-mono text-xs`}
                    onClick={() => toggleCell(r, c)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {val > 0 ? val : ''}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-text-muted text-xs mb-2">对应的矩阵：</div>
          <MatrixGrid matrix={grid} readonly size="sm" />
        </div>
      </div>
    </div>
  );
}

// Sub-module 2: Shape Encoder
function ShapeEncoder() {
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [shape, setShape] = useState<'triangle' | 'square'>('triangle');

  const presets: Record<string, [number, number][]> = {
    triangle: [[0, 0], [3, 0], [1, 2]],
    square: [[0, 0], [2, 0], [2, 2], [0, 2]],
  };

  const loadShape = (s: 'triangle' | 'square') => {
    setShape(s);
    setVertices(presets[s]);
  };

  useEffect(() => { loadShape('triangle'); }, []);

  const matrix: Matrix = vertices.length > 0
    ? [vertices.map(v => v[0]), vertices.map(v => v[1])]
    : createMatrix(2, 3, 0);

  const canvasSize = 280;

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">📐 形状编码器</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        用矩阵存储图形顶点坐标。第一行是 x 坐标，第二行是 y 坐标。
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => loadShape('triangle')} className={`px-3 py-1.5 rounded text-xs font-body ${shape === 'triangle' ? 'bg-cyan-dim text-cyan' : 'bg-surface text-text-muted'} transition-all`}>
          三角形
        </button>
        <button onClick={() => loadShape('square')} className={`px-3 py-1.5 rounded text-xs font-body ${shape === 'square' ? 'bg-cyan-dim text-cyan' : 'bg-surface text-text-muted'} transition-all`}>
          正方形
        </button>
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <canvas
          width={canvasSize}
          height={canvasSize}
          className="rounded-lg border border-border-subtle"
          ref={el => {
            if (!el || vertices.length === 0) return;
            const ctx = el.getContext('2d');
            if (!ctx) return;
            ctx.fillStyle = '#070b14';
            ctx.fillRect(0, 0, canvasSize, canvasSize);
            const scale = 60;
            const cx = canvasSize / 2, cy = canvasSize / 2;

            // Grid
            ctx.strokeStyle = 'rgba(76, 204, 255, 0.06)';
            for (let x = 0; x < canvasSize; x += scale) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasSize); ctx.stroke(); }
            for (let y = 0; y < canvasSize; y += scale) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasSize, y); ctx.stroke(); }

            // Axes
            ctx.strokeStyle = 'rgba(76, 204, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvasSize, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvasSize); ctx.stroke();

            // Shape
            ctx.fillStyle = 'rgba(76, 204, 255, 0.15)';
            ctx.strokeStyle = '#4ccfff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            vertices.forEach(([x, y], i) => {
              const sx = cx + x * scale, sy = cy - y * scale;
              i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Vertices
            vertices.forEach(([x, y], i) => {
              const sx = cx + x * scale, sy = cy - y * scale;
              ctx.fillStyle = '#ffb84d';
              ctx.beginPath();
              ctx.arc(sx, sy, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#e8f0ff';
              ctx.font = '11px "Space Grotesk"';
              ctx.fillText(`(${x},${y})`, sx + 8, sy - 8);
            });
          }}
        />
        <div>
          <div className="text-text-muted text-xs mb-2">顶点坐标矩阵：</div>
          <MatrixGrid matrix={matrix} readonly size="sm" />
        </div>
      </div>
    </div>
  );
}

// Sub-module 3: Drag-to-Transform
function TransformDemo() {
  const [matrix, setMatrix] = useState<Matrix>([[1, 0], [0, 1]]);

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">🔄 变换实验</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        调整 2×2 矩阵的值，观察单位正方形如何被变换成平行四边形！
      </p>
      <div className="flex flex-wrap items-start gap-6">
        <MatrixGrid matrix={matrix} onChange={setMatrix} size="lg" />
        <TransformCanvas matrix={matrix} width={320} height={320} />
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => setMatrix([[1, 0], [0, 1]])} className="px-3 py-1.5 rounded bg-surface text-text-muted text-xs font-body hover:text-cyan transition-colors">
          重置（单位矩阵）
        </button>
        <button onClick={() => setMatrix([[-1, 0], [0, 1]])} className="px-3 py-1.5 rounded bg-surface text-text-muted text-xs font-body hover:text-cyan transition-colors">
          水平翻转
        </button>
        <button onClick={() => setMatrix([[0, -1], [1, 0]])} className="px-3 py-1.5 rounded bg-surface text-text-muted text-xs font-body hover:text-cyan transition-colors">
          旋转90°
        </button>
        <button onClick={() => setMatrix([[2, 0], [0, 0.5]])} className="px-3 py-1.5 rounded bg-surface text-text-muted text-xs font-body hover:text-cyan transition-colors">
          缩放
        </button>
        <button onClick={() => setMatrix([[1, 1], [0, 1]])} className="px-3 py-1.5 rounded bg-surface text-text-muted text-xs font-body hover:text-cyan transition-colors">
          剪切
        </button>
      </div>
    </div>
  );
}

export default function IntroPage() {
  const { progress, complete } = useProgress();
  const [tab, setTab] = useState(0);
  const tabs = ['像素画板', '形状编码器', '变换实验'];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-text-dim text-sm hover:text-cyan transition-colors">← 返回</Link>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-cyan mb-2">📐 矩阵是什么？</h1>
        <p className="text-text-muted font-body mb-6">
          矩阵就是一个按照矩形排列的数字表格。它不仅用来存储数据，还能描述空间变换。
        </p>

        {/* Tab buttons */}
        <div className="flex gap-2 mb-6">
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-lg text-sm font-body transition-all ${
                tab === i ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'bg-surface text-text-muted hover:text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 0 && <PixelArtPad />}
            {tab === 1 && <ShapeEncoder />}
            {tab === 2 && <TransformDemo />}
          </motion.div>
        </AnimatePresence>

        {/* Complete button */}
        {!progress.intro && (
          <div className="mt-8 text-center">
            <button
              onClick={() => complete('intro')}
              className="px-6 py-3 bg-cyan/10 text-cyan rounded-lg font-body text-sm hover:bg-cyan/20 transition-all border border-cyan/20"
            >
              ✅ 完成此模块
            </button>
          </div>
        )}
        {progress.intro && (
          <div className="mt-6 text-center text-success text-sm font-body">
            ✓ 模块已完成！
            <Link href="/learn/addition" className="ml-3 text-cyan hover:underline">下一课：加法与数乘 →</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
