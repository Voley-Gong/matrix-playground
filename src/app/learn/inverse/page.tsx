'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Matrix, inverse, multiply, identity, getGaussSteps, GaussStep,
  cloneMatrix, roundMatrix, dims
} from '@/lib/math';
import MatrixGrid from '@/components/MatrixGrid';
import { useProgress } from '@/lib/progress';
import Link from 'next/link';

// Time Machine Demo
function TimeMachine() {
  const [matrix, setMatrix] = useState<Matrix>([[2, 1], [1, 1]]);
  const [phase, setPhase] = useState(0); // 0: A, 1: A×A⁻¹, 2: Identity

  const inv = (() => {
    try { return inverse(matrix); } catch { return null; }
  })();
  const product = inv ? multiply(matrix, inv) : null;

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">⏪ "时光机" — A × A⁻¹ = I</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        逆矩阵就是"撤销"变换。应用 A 再应用 A⁻¹，回到单位矩阵（什么都没变）。
      </p>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <MatrixGrid matrix={matrix} onChange={setMatrix} size="md" label="A" />
        {phase >= 1 && inv && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-2xl text-text-muted font-mono">×</span>
          </motion.div>
        )}
        {phase >= 1 && inv && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <MatrixGrid matrix={roundMatrix(inv)} readonly size="md" label="A⁻¹" />
          </motion.div>
        )}
        {phase >= 2 && product && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="text-2xl text-text-muted font-mono">=</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 1.2 }} animate={{ opacity: 1, scale: 1 }}>
              <MatrixGrid matrix={roundMatrix(product)} readonly size="md" label="I (近似)" />
            </motion.div>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setPhase(0)} className={`px-3 py-1.5 rounded text-xs font-body ${phase === 0 ? 'bg-cyan-dim text-cyan' : 'bg-surface text-text-muted'} transition-all`}>
          矩阵 A
        </button>
        <button onClick={() => setPhase(1)} disabled={!inv} className={`px-3 py-1.5 rounded text-xs font-body ${phase === 1 ? 'bg-cyan-dim text-cyan' : 'bg-surface text-text-muted'} transition-all disabled:opacity-30`}>
          A × A⁻¹
        </button>
        <button onClick={() => setPhase(2)} disabled={!inv} className={`px-3 py-1.5 rounded text-xs font-body ${phase === 2 ? 'bg-cyan-dim text-cyan' : 'bg-surface text-text-muted'} transition-all disabled:opacity-30`}>
          结果
        </button>
      </div>
      {!inv && <div className="text-error text-sm mt-2 font-body">此矩阵不可逆（行列式为 0）</div>}
    </div>
  );
}

// Gaussian Elimination Step-by-Step
function GaussianDemo() {
  const [matrix, setMatrix] = useState<Matrix>([[2, 1], [1, 1]]);
  const [stepIdx, setStepIdx] = useState(-1);

  let steps: GaussStep[] = [];
  try { steps = getGaussSteps(matrix); } catch {}

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">📐 高斯消元法</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        通过初等行变换将增广矩阵化为单位矩阵，右边即为逆矩阵。
      </p>
      <div className="mb-4">
        <div className="text-text-muted text-xs mb-1">输入矩阵：</div>
        <MatrixGrid matrix={matrix} onChange={m => { setMatrix(m); setStepIdx(-1); }} size="md" />
      </div>

      {steps.length > 0 && current && (
        <div className="mb-4">
          <div className="flex items-center gap-4 flex-wrap mb-3">
            <div>
              <div className="text-text-muted text-xs mb-1">左半 (→I)</div>
              <MatrixGrid matrix={current.matrix} readonly size="md" />
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">右半 (→A⁻¹)</div>
              <MatrixGrid matrix={current.aug} readonly size="md" />
            </div>
          </div>
          <div className="glass-panel p-2 text-center text-sm font-body">
            {current.type === 'pivot' && (
              <span>🔄 交换第 {current.targetRow + 1} 行和第 {current.pivotRow + 1} 行</span>
            )}
            {current.type === 'scale' && (
              <span>📏 第 {current.pivotRow + 1} 行 ÷ <span className="text-amber">{current.factor?.toFixed(2)}</span></span>
            )}
            {current.type === 'eliminate' && (
              <span>➖ 第 {current.targetRow + 1} 行 − <span className="text-amber">{current.factor?.toFixed(2)}</span> × 第 {current.pivotRow + 1} 行</span>
            )}
            {current.type === 'done' && (
              <span className="text-success">✓ 完成！右半即为逆矩阵</span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <button onClick={() => setStepIdx(-1)} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">重置</button>
        <button onClick={() => setStepIdx(s => Math.max(s - 1, 0))} disabled={stepIdx <= 0} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors disabled:opacity-30">◀</button>
        <button onClick={() => setStepIdx(s => Math.min(s + 1, steps.length - 1))} disabled={stepIdx >= steps.length - 1} className="px-4 py-1.5 bg-cyan-dim text-cyan text-xs rounded hover:bg-cyan/20 transition-colors disabled:opacity-30">下一步 ▶</button>
        <button onClick={() => setStepIdx(steps.length - 1)} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">全部</button>
      </div>
    </div>
  );
}

// Interactive Row Operations
function InteractiveGauss() {
  const generate = (): Matrix => {
    // Generate a simple invertible 2x2
    while (true) {
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      const c = Math.floor(Math.random() * 5) + 1;
      const d = Math.floor(Math.random() * 5) + 1;
      if (Math.abs(a * d - b * c) > 0.01) return [[a, b], [c, d]];
    }
  };

  const [target, setTarget] = useState(generate);
  const [aug, setAug] = useState<Matrix>(() => {
    const m = generate();
    return [m[0].concat([1, 0]), m[1].concat([0, 1])];
  });
  const [message, setMessage] = useState('');
  const [solved, setSolved] = useState(false);

  const reset = () => {
    const t = generate();
    setTarget(t);
    setAug([t[0].concat([1, 0]), t[1].concat([0, 1])]);
    setSolved(false);
    setMessage('');
  };

  const swapRows = () => {
    setAug([aug[1], aug[0]]);
    setMessage('交换了两行');
  };

  const scaleRow = (row: number, factor: number) => {
    const newAug = aug.map(r => [...r]);
    newAug[row] = newAug[row].map(v => v * factor);
    setAug(newAug);
    setMessage(`第 ${row + 1} 行 × ${factor}`);
  };

  const eliminate = (from: number, using: number) => {
    const newAug = aug.map(r => [...r]);
    const factor = newAug[from][using];
    for (let j = 0; j < newAug[0].length; j++) {
      newAug[from][j] -= factor * newAug[using][j];
    }
    setAug(roundMatrix(newAug, 4));
    setMessage(`第 ${from + 1} 行 − ${factor.toFixed(2)} × 第 ${using + 1} 行`);
  };

  // Check if left half is identity
  const leftHalf = aug.map(row => row.slice(0, 2));
  const isIdentity = JSON.stringify(roundMatrix(leftHalf, 2)) === JSON.stringify([[1, 0], [0, 1]]);

  useEffect(() => {
    if (isIdentity && !solved) setSolved(true);
  }, [isIdentity]);

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-amber mb-3">🎮 互动行操作</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        用行操作将增广矩阵左边化为单位矩阵。操作按钮会自动选择合适的系数。
      </p>
      <div className="mb-4">
        <div className="text-text-muted text-xs mb-1">增广矩阵 [A | I]：</div>
        <div className="flex items-center">
          <div className="text-cyan/30 text-2xl mr-0.5">[</div>
          <div>
            {aug.map((row, r) => (
              <div key={r} className="flex">
                {row.map((val, c) => (
                  <div key={c} className={`w-14 h-10 flex items-center justify-center font-mono text-sm ${
                    c < 2 ? 'bg-surface/50 text-text-primary' : 'bg-cyan-dim text-cyan'
                  } ${c === 1 ? 'border-r border-border-subtle' : ''}`}>
                    {Number.isInteger(val) ? val : val.toFixed(2)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="text-cyan/30 text-2xl ml-0.5">]</div>
        </div>
      </div>
      {message && <div className="text-text-muted text-xs mb-3 font-body">{message}</div>}
      <div className="flex gap-2 flex-wrap mb-3">
        <button onClick={swapRows} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          🔄 交换行
        </button>
        <button onClick={() => { const pivot = aug[0][0]; if (Math.abs(pivot) > 0.001) scaleRow(0, 1/pivot); }} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          R1 ÷ {aug[0][0].toFixed(1)}
        </button>
        <button onClick={() => eliminate(1, 0)} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          R2 − {aug[1][0].toFixed(1)} × R1
        </button>
        <button onClick={() => { const pivot = aug[1][1]; if (Math.abs(pivot) > 0.001) scaleRow(1, 1/pivot); }} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          R2 ÷ {aug[1][1].toFixed(1)}
        </button>
        <button onClick={() => eliminate(0, 1)} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          R1 − {aug[0][1].toFixed(1)} × R2
        </button>
        <button onClick={reset} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          新题
        </button>
      </div>
      {solved && (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-success text-sm font-body">
          ✓ 完美！逆矩阵已求得！
        </motion.div>
      )}
    </div>
  );
}

export default function InversePage() {
  const { progress, complete } = useProgress();
  const [tab, setTab] = useState(0);
  const tabs = ['时光机', '高斯消元', '互动操作'];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-text-dim text-sm hover:text-cyan transition-colors">← 返回</Link>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-cyan mb-2">⏪ 逆矩阵</h1>
        <p className="text-text-muted font-body mb-6">
          逆矩阵是矩阵的"撤销操作"：A × A⁻¹ = I。
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
            {tab === 0 && <TimeMachine />}
            {tab === 1 && <GaussianDemo />}
            {tab === 2 && <InteractiveGauss />}
          </motion.div>
        </AnimatePresence>

        {!progress.inverse && (
          <div className="mt-8 text-center">
            <button onClick={() => complete('inverse')} className="px-6 py-3 bg-cyan/10 text-cyan rounded-lg font-body text-sm hover:bg-cyan/20 transition-all border border-cyan/20">
              ✅ 完成此模块
            </button>
          </div>
        )}
        {progress.inverse && (
          <div className="mt-6 text-center text-success text-sm font-body">
            ✓ 模块已完成！
            <Link href="/learn/eigen" className="ml-3 text-cyan hover:underline">下一课：特征值 →</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
