'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Matrix, createMatrix, add, scalarMultiply, roundMatrix, dims } from '@/lib/math';
import MatrixGrid from '@/components/MatrixGrid';
import { useProgress } from '@/lib/progress';
import Link from 'next/link';

// Animated Addition
function AnimatedAddition() {
  const [a, setA] = useState<Matrix>([[1, 2], [3, 4]]);
  const [b, setB] = useState<Matrix>([[5, 6], [7, 8]]);
  const [step, setStep] = useState(-1);
  const [autoPlay, setAutoPlay] = useState(false);

  const result = add(a, b);
  const [rows, cols] = dims(a);

  const totalCells = rows * cols;
  const currentCell = step >= 0 ? step : -1;

  const advance = () => {
    setStep(s => s < totalCells - 1 ? s + 1 : s);
  };

  const reset = () => setStep(-1);

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">➕ 矩阵加法动画</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        矩阵加法就是对应位置的元素相加。点击"下一步"观看逐格动画。
      </p>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <MatrixGrid
            matrix={a}
            onChange={setA}
            highlightRow={currentCell >= 0 ? Math.floor(currentCell / cols) : undefined}
            highlightCol={currentCell >= 0 ? currentCell % cols : undefined}
            size="md"
            label="A"
          />
        </div>
        <span className="text-2xl text-text-muted font-mono">+</span>
        <div>
          <MatrixGrid
            matrix={b}
            onChange={setB}
            highlightRow={currentCell >= 0 ? Math.floor(currentCell / cols) : undefined}
            highlightCol={currentCell >= 0 ? currentCell % cols : undefined}
            size="md"
            label="B"
          />
        </div>
        <span className="text-2xl text-text-muted font-mono">=</span>
        <div>
          <MatrixGrid
            matrix={step >= totalCells - 1 ? result : (() => {
              const m = createMatrix(rows, cols);
              for (let i = 0; i < totalCells; i++) {
                const r = Math.floor(i / cols), c = i % cols;
                if (i <= currentCell) m[r][c] = a[r][c] + b[r][c];
              }
              return m;
            })()}
            readonly
            highlightCell={currentCell >= 0 ? [Math.floor(currentCell / cols), currentCell % cols] : undefined}
            size="md"
            label="A + B"
          />
        </div>
      </div>
      {currentCell >= 0 && currentCell < totalCells && (
        <div className="text-center text-amber font-mono text-sm mb-3">
          A[{Math.floor(currentCell / cols)}][{currentCell % cols}] + B[{Math.floor(currentCell / cols)}][{currentCell % cols}] = {a[Math.floor(currentCell / cols)][currentCell % cols]} + {b[Math.floor(currentCell / cols)][currentCell % cols]} = {a[Math.floor(currentCell / cols)][currentCell % cols] + b[Math.floor(currentCell / cols)][currentCell % cols]}
        </div>
      )}
      <div className="flex gap-2 justify-center">
        <button onClick={reset} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">重置</button>
        <button onClick={advance} disabled={step >= totalCells - 1} className="px-4 py-1.5 bg-cyan-dim text-cyan text-xs rounded hover:bg-cyan/20 transition-colors disabled:opacity-30">
          下一步 →
        </button>
        <button onClick={() => { setStep(totalCells - 1); }} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">
          全部显示
        </button>
      </div>
    </div>
  );
}

// Scalar Multiplication
function ScalarDemo() {
  const [matrix, setMatrix] = useState<Matrix>([[1, 2], [3, 4]]);
  const [scalar, setScalar] = useState(2);

  const result = scalarMultiply(matrix, scalar);

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">✖️ 数乘演示</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        用滑块调整标量值，观察矩阵每个元素如何同时缩放。
      </p>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="text-amber font-mono text-3xl">{scalar}</div>
        <span className="text-2xl text-text-muted font-mono">×</span>
        <MatrixGrid matrix={matrix} onChange={setMatrix} size="md" label="A" />
        <span className="text-2xl text-text-muted font-mono">=</span>
        <MatrixGrid matrix={roundMatrix(result)} readonly size="md" label={`${scalar}A`} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-text-dim text-sm font-mono">0</span>
        <input
          type="range" min={-5} max={5} step={0.1}
          value={scalar}
          onChange={e => setScalar(parseFloat(e.target.value))}
          className="flex-1 accent-cyan"
        />
        <span className="text-text-dim text-sm font-mono">5</span>
      </div>
    </div>
  );
}

// Match the Result Game
function MatchGame() {
  const generate = (): { a: Matrix, b: Matrix, c: Matrix, hidden: [number, number] } => {
    const a = Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => Math.floor(Math.random() * 9) + 1));
    const b = Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => Math.floor(Math.random() * 9) + 1));
    const c = add(a, b);
    const hidden: [number, number] = [Math.floor(Math.random() * 2), Math.floor(Math.random() * 2)];
    return { a, b, c, hidden };
  };

  const [puzzle, setPuzzle] = useState(generate);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);

  const check = () => {
    const correct = puzzle.a[puzzle.hidden[0]][puzzle.hidden[1]] + puzzle.b[puzzle.hidden[0]][puzzle.hidden[1]];
    const userVal = parseFloat(answer);
    if (Math.abs(userVal - correct) < 0.01) {
      setFeedback('correct');
      setScore(s => s + 1);
      setTimeout(() => {
        setPuzzle(generate());
        setAnswer('');
        setFeedback(null);
      }, 1000);
    } else {
      setFeedback('wrong');
    }
  };

  const cDisplay = puzzle.c.map(row => [...row]);
  const correctAnswer = puzzle.a[puzzle.hidden[0]][puzzle.hidden[1]] + puzzle.b[puzzle.hidden[0]][puzzle.hidden[1]];

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-amber mb-3">🎯 匹配结果游戏</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        找出缺失的元素值！得分: <span className="text-cyan font-mono">{score}</span>
      </p>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <MatrixGrid matrix={puzzle.a} readonly size="sm" label="A" />
        <span className="text-xl text-text-muted font-mono">+</span>
        <MatrixGrid matrix={puzzle.b} readonly size="sm" label="B" />
        <span className="text-xl text-text-muted font-mono">=</span>
        <div className="relative">
          <MatrixGrid
            matrix={cDisplay}
            readonly
            size="sm"
            highlightCell={puzzle.hidden}
            label="C = A + B"
            cellColor={(r, c) => r === puzzle.hidden[0] && c === puzzle.hidden[1] ? 'bg-amber-dim' : undefined}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-text-muted text-sm">C[{puzzle.hidden[0]}][{puzzle.hidden[1]}] =</span>
        <input
          type="number"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          className="w-20 bg-surface border border-border-subtle rounded px-2 py-1 text-text-primary font-mono text-center focus:outline-none focus:border-cyan/50"
          placeholder="?"
        />
        <button onClick={check} className="px-4 py-1.5 bg-cyan-dim text-cyan text-sm rounded hover:bg-cyan/20 transition-colors font-body">
          检查
        </button>
      </div>
      {feedback === 'correct' && <div className="text-success text-sm mt-2 font-body">✓ 正确！</div>}
      {feedback === 'wrong' && <div className="text-error text-sm mt-2 font-body">✗ 再试一次</div>}
    </div>
  );
}

export default function AdditionPage() {
  const { progress, complete } = useProgress();
  const [tab, setTab] = useState(0);
  const tabs = ['加法动画', '数乘演示', '匹配游戏'];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-text-dim text-sm hover:text-cyan transition-colors">← 返回</Link>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-cyan mb-2">➕ 加法与数乘</h1>
        <p className="text-text-muted font-body mb-6">学习矩阵加法和标量乘法的基本操作。</p>

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
            {tab === 0 && <AnimatedAddition />}
            {tab === 1 && <ScalarDemo />}
            {tab === 2 && <MatchGame />}
          </motion.div>
        </AnimatePresence>

        {!progress.addition && (
          <div className="mt-8 text-center">
            <button onClick={() => complete('addition')} className="px-6 py-3 bg-cyan/10 text-cyan rounded-lg font-body text-sm hover:bg-cyan/20 transition-all border border-cyan/20">
              ✅ 完成此模块
            </button>
          </div>
        )}
        {progress.addition && (
          <div className="mt-6 text-center text-success text-sm font-body">
            ✓ 模块已完成！
            <Link href="/learn/multiplication" className="ml-3 text-cyan hover:underline">下一课：矩阵乘法 →</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
