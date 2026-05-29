'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Matrix, determinant, transformPoint, roundMatrix } from '@/lib/math';
import MatrixGrid from '@/components/MatrixGrid';
import TransformCanvas from '@/components/TransformCanvas';
import { useProgress } from '@/lib/progress';
import Link from 'next/link';

// 2x2 Area Visualizer
function AreaVisualizer() {
  const [matrix, setMatrix] = useState<Matrix>([[2, 1], [0, 1]]);
  const det = determinant(matrix);

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">📊 行列式 = 面积变化</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        行列式的绝对值表示变换后面积与原面积的比值。正值保持方向，负值翻转，零表示坍缩。
      </p>
      <div className="flex flex-wrap items-start gap-6 mb-4">
        <div>
          <MatrixGrid matrix={matrix} onChange={setMatrix} size="lg" />
          <div className="mt-3 text-center">
            <div className="font-mono text-lg">
              det = <span className={`font-bold ${det > 0.001 ? 'text-success' : det < -0.001 ? 'text-error' : 'text-amber'}`}>
                {det.toFixed(2)}
              </span>
            </div>
            <div className="text-text-dim text-xs mt-1">
              {det > 0.001 ? '方向保持 ✓' : det < -0.001 ? '方向翻转 ↕' : '坍缩为线/点！'}
            </div>
          </div>
        </div>
        <TransformCanvas matrix={matrix} width={320} height={320} />
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setMatrix([[1, 0], [0, 1]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">
          单位矩阵 (det=1)
        </button>
        <button onClick={() => setMatrix([[2, 0], [0, 2]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">
          放大 (det=4)
        </button>
        <button onClick={() => setMatrix([[-1, 0], [0, 1]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">
          翻转 (det=-1)
        </button>
        <button onClick={() => setMatrix([[1, 2], [1, 2]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">
          坍缩 (det=0)
        </button>
        <button onClick={() => setMatrix([[2, 1], [1, 3]])} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">
          一般 (det=5)
        </button>
      </div>
    </div>
  );
}

// 3x3 Cofactor Expansion
function CofactorExpansion() {
  const [matrix, setMatrix] = useState<Matrix>([1, 2, 3].map(r => [1, 2, 3].map(c => r + c)));
  const [step, setStep] = useState(-1);
  const det = determinant(matrix);

  const steps = matrix[0].map((val, j) => {
    const minor = matrix.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
    const minorDet = determinant(minor);
    const sign = j % 2 === 0 ? 1 : -1;
    const term = sign * val * minorDet;
    return { col: j, val, sign, minor, minorDet, term };
  });

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">📐 3×3 代数余子式展开</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        沿第一行展开行列式：det(A) = Σ (-1)^(1+j) × a₁ⱼ × M₁ⱼ
      </p>
      <div className="mb-4">
        <MatrixGrid matrix={matrix} onChange={setMatrix} size="md" />
      </div>
      <div className="space-y-3 mb-4">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            className={`glass-panel p-3 cursor-pointer transition-all ${step === i ? 'border-cyan/30 glow-cyan' : ''}`}
            onClick={() => setStep(step === i ? -1 : i)}
            initial={false}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-text-muted text-xs">j={s.col}:</span>
              <span className="font-mono text-sm">
                <span className={s.sign > 0 ? 'text-success' : 'text-error'}>{s.sign > 0 ? '+' : '-'}</span>
                <span className="text-amber"> {Math.abs(s.val)} </span>
                <span className="text-text-muted">×</span>
                <span className="text-cyan"> det(M)={s.minorDet}</span>
                <span className="text-text-muted"> = </span>
                <span className="text-text-primary font-bold">{s.term}</span>
              </span>
            </div>
            <AnimatePresence>
              {step === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden">
                  <div className="text-text-muted text-xs mb-1">余子式 M₁{s.col}:</div>
                  <MatrixGrid matrix={s.minor} readonly size="sm" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <div className="text-center">
        <span className="font-mono text-lg">
          det = <span className="text-cyan font-bold">{det}</span>
        </span>
      </div>
    </div>
  );
}

// Determinant Game
function DeterminantGame() {
  const generate = () => {
    const target = Math.floor(Math.random() * 11) - 5;
    return { target, matrix: [[1, 0], [0, 1]] as Matrix };
  };

  const [game, setGame] = useState(generate);
  const [score, setScore] = useState(0);

  const det = determinant(game.matrix);

  const check = () => {
    if (Math.abs(det - game.target) < 0.01) {
      setScore(s => s + 1);
      setGame(generate());
    }
  };

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-amber mb-3">🎯 行列式挑战</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        调整矩阵，使行列式等于目标值！得分: <span className="text-cyan font-mono">{score}</span>
      </p>
      <div className="text-center mb-4">
        <span className="font-display text-2xl text-amber">目标: det = {game.target}</span>
      </div>
      <div className="flex flex-wrap items-center gap-6 mb-4 justify-center">
        <MatrixGrid matrix={game.matrix} onChange={m => setGame({ ...game, matrix: m })} size="lg" />
        <div className="text-center">
          <div className="text-text-muted text-sm mb-1">当前 det:</div>
          <div className={`font-mono text-3xl ${Math.abs(det - game.target) < 0.01 ? 'text-success' : 'text-text-primary'}`}>
            {det.toFixed(1)}
          </div>
        </div>
      </div>
      <div className="text-center">
        <button onClick={check} disabled={Math.abs(det - game.target) >= 0.01}
          className="px-6 py-2 bg-success/10 text-success rounded-lg text-sm font-body hover:bg-success/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          ✓ 匹配！
        </button>
      </div>
    </div>
  );
}

export default function DeterminantPage() {
  const { progress, complete } = useProgress();
  const [tab, setTab] = useState(0);
  const tabs = ['面积可视化', '3×3 展开', '行列式挑战'];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-text-dim text-sm hover:text-cyan transition-colors">← 返回</Link>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-cyan mb-2">📊 行列式</h1>
        <p className="text-text-muted font-body mb-6">
          行列式是一个将方阵映射到标量的函数，它衡量了线性变换对面积/体积的缩放效果。
        </p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-lg text-sm font-body transition-all ${tab === i ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'bg-surface text-text-muted'}`}>
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {tab === 0 && <AreaVisualizer />}
            {tab === 1 && <CofactorExpansion />}
            {tab === 2 && <DeterminantGame />}
          </motion.div>
        </AnimatePresence>

        {!progress.determinant && (
          <div className="mt-8 text-center">
            <button onClick={() => complete('determinant')} className="px-6 py-3 bg-cyan/10 text-cyan rounded-lg font-body text-sm hover:bg-cyan/20 transition-all border border-cyan/20">
              ✅ 完成此模块
            </button>
          </div>
        )}
        {progress.determinant && (
          <div className="mt-6 text-center text-success text-sm font-body">
            ✓ 模块已完成！
            <Link href="/learn/inverse" className="ml-3 text-cyan hover:underline">下一课：逆矩阵 →</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
