'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Matrix, transpose, createMatrix, dims } from '@/lib/math';
import MatrixGrid from '@/components/MatrixGrid';
import { useProgress } from '@/lib/progress';
import Link from 'next/link';

// Flip Animation
function TransposeAnimation() {
  const [matrix, setMatrix] = useState<Matrix>([1, 2, 3].map(r => [1, 2, 3].map(c => r * c)));
  const [animating, setAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [rows, cols] = dims(matrix);

  const result = transpose(matrix);

  const doAnimate = () => {
    setAnimating(true);
    setShowResult(false);
    setTimeout(() => { setShowResult(true); setAnimating(false); }, 600);
  };

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">🔄 转置动画</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        矩阵转置就是沿主对角线翻转。行变列，列变行。
      </p>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative">
          <MatrixGrid
            matrix={matrix}
            onChange={setMatrix}
            size="md"
            label="A"
          />
        </div>
        <motion.button
          onClick={doAnimate}
          className="px-4 py-2 bg-cyan-dim text-cyan rounded-lg text-sm font-body hover:bg-cyan/20 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          T
        </motion.button>
        {showResult ? (
          <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.3 }}>
            <MatrixGrid matrix={result} readonly size="md" label="Aᵀ" />
          </motion.div>
        ) : (
          <div className="w-28 h-28 flex items-center justify-center text-text-dim text-3xl">?</div>
        )}
      </div>
      <div className="text-text-muted text-xs font-body">
        A 是 {rows}×{cols}，Aᵀ 是 {cols}×{rows}
      </div>
      {showResult && (
        <div className="mt-3 text-sm font-mono">
          {matrix.flatMap((row, r) =>
            row.map((val, c) => (
              <span key={`${r}-${c}`} className="inline-block mr-3">
                A[{r}][{c}]={val} → Aᵀ[{c}][{r}]={result[c][r]}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Transpose or Not Quiz
function TransposeQuiz() {
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const generateQ = () => {
    const r = Math.floor(Math.random() * 2) + 2;
    const c = Math.floor(Math.random() * 2) + 2;
    const m: Matrix = Array.from({ length: r }, () => Array.from({ length: c }, () => Math.floor(Math.random() * 9) + 1));
    const t = transpose(m);
    // 50% chance to show transpose, 50% random matrix
    const showTranspose = Math.random() > 0.5;
    const other: Matrix = showTranspose ? t : Array.from({ length: c }, () => Array.from({ length: r }, () => Math.floor(Math.random() * 9) + 1));
    return { original: m, candidate: other, isTranspose: showTranspose };
  };

  const [q, setQ] = useState(generateQ);

  const answer = (yes: boolean) => {
    const correct = yes === q.isTranspose;
    if (correct) setScore(s => s + 1);
    setTotal(t => t + 1);
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      setQ(generateQ());
      setFeedback(null);
    }, 800);
  };

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-amber mb-3">🎯 转置判断</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        右边的矩阵是左边矩阵的转置吗？
        <span className="ml-2 text-cyan font-mono">{score}/{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <MatrixGrid matrix={q.original} readonly size="md" label="A" />
        <MatrixGrid matrix={q.candidate} readonly size="md" label="B" />
      </div>
      <div className="flex gap-3">
        <button onClick={() => answer(true)} className="px-4 py-2 bg-success/10 text-success rounded-lg text-sm font-body hover:bg-success/20 transition-colors">
          ✓ 是转置
        </button>
        <button onClick={() => answer(false)} className="px-4 py-2 bg-error/10 text-error rounded-lg text-sm font-body hover:bg-error/20 transition-colors">
          ✗ 不是
        </button>
      </div>
      {feedback === 'correct' && <div className="text-success text-sm mt-2 font-body">✓ 正确！</div>}
      {feedback === 'wrong' && <div className="text-error text-sm mt-2 font-body">✗ 不对哦</div>}
    </div>
  );
}

export default function TransposePage() {
  const { progress, complete } = useProgress();
  const [tab, setTab] = useState(0);
  const tabs = ['转置动画', '判断游戏'];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-text-dim text-sm hover:text-cyan transition-colors">← 返回</Link>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-cyan mb-2">🔄 转置</h1>
        <p className="text-text-muted font-body mb-6">学习矩阵转置：沿主对角线翻转，行变列、列变行。</p>

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
            {tab === 0 && <TransposeAnimation />}
            {tab === 1 && <TransposeQuiz />}
          </motion.div>
        </AnimatePresence>

        {!progress.transpose && (
          <div className="mt-8 text-center">
            <button onClick={() => complete('transpose')} className="px-6 py-3 bg-cyan/10 text-cyan rounded-lg font-body text-sm hover:bg-cyan/20 transition-all border border-cyan/20">
              ✅ 完成此模块
            </button>
          </div>
        )}
        {progress.transpose && (
          <div className="mt-6 text-center text-success text-sm font-body">
            ✓ 模块已完成！
            <Link href="/learn/multiplication" className="ml-3 text-cyan hover:underline">下一课：矩阵乘法 →</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
