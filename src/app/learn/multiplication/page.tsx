'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Matrix, createMatrix, multiply, getMultSteps, MultStep,
  dims, roundMatrix
} from '@/lib/math';
import MatrixGrid from '@/components/MatrixGrid';
import { useProgress } from '@/lib/progress';
import Link from 'next/link';

type SizePreset = '2x2' | '2x3x3x2' | '3x3';

const PRESETS: Record<SizePreset, { a: Matrix; b: Matrix }> = {
  '2x2': {
    a: [[1, 2], [3, 4]],
    b: [[5, 6], [7, 8]],
  },
  '2x3x3x2': {
    a: [[1, 2, 3], [4, 5, 6]],
    b: [[7, 8], [9, 10], [11, 12]],
  },
  '3x3': {
    a: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
    b: [[9, 8, 7], [6, 5, 4], [3, 2, 1]],
  },
};

// Step-by-step animation
function StepByStepDemo() {
  const [sizePreset, setSizePreset] = useState<SizePreset>('2x2');
  const [a, setA] = useState(PRESETS['2x2'].a);
  const [b, setB] = useState(PRESETS['2x2'].b);
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<NodeJS.Timeout>();

  const steps = getMultSteps(a, b);
  const result = multiply(a, b);
  const [ar, ac] = dims(a);
  const [br, bc] = dims(b);
  const currentStep = stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : null;

  // Build partial result matrix
  const partialResult = createMatrix(ar, bc, NaN);
  // Find all "place" steps up to current
  for (let i = 0; i <= stepIndex && i < steps.length; i++) {
    if (steps[i].type === 'place') {
      partialResult[steps[i].row][steps[i].col] = steps[i].result!;
    }
  }

  const changePreset = (p: SizePreset) => {
    setSizePreset(p);
    setA(PRESETS[p].a);
    setB(PRESETS[p].b);
    setStepIndex(-1);
    setPlaying(false);
  };

  const next = () => setStepIndex(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStepIndex(s => Math.max(s - 1, 0));
  const reset = () => { setStepIndex(-1); setPlaying(false); };

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setStepIndex(s => {
          if (s >= steps.length - 1) { setPlaying(false); return s; }
          return s + 1;
        });
      }, 800 / speed);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, speed, steps.length]);

  // Row/col being computed
  const currentRow = currentStep?.row ?? -1;
  const currentCol = currentStep?.col ?? -1;
  const currentK = currentStep?.k ?? -1;

  return (
    <div className="glass-panel p-4 sm:p-6">
      <h3 className="font-display text-lg text-cyan mb-3">✖️ 矩阵乘法逐步动画</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        观看矩阵乘法的每一步计算过程：行 × 列 → 点积。
      </p>

      {/* Size selector */}
      <div className="flex gap-2 mb-4">
        {(['2x2', '2x3x3x2', '3x3'] as SizePreset[]).map(p => (
          <button key={p} onClick={() => changePreset(p)}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${sizePreset === p ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'bg-surface text-text-muted'}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Matrices display */}
      <div className="overflow-x-auto mb-4">
        <div className="inline-flex flex-col items-center gap-4 min-w-fit">
          {/* A on left, B on top */}
          <div className="flex items-start gap-4 flex-wrap justify-center">
            <div>
              <div className="text-text-muted text-xs mb-1 text-center">矩阵 A ({ar}×{ac})</div>
              <MatrixGrid
                matrix={a} readonly size="md"
                highlightRow={currentStep ? currentRow : undefined}
                cellColor={(r, c) => {
                  if (!currentStep || currentStep.type === 'place') return undefined;
                  if (r === currentRow && currentK >= 0 && c <= currentK) return 'bg-success/20';
                  if (r === currentRow) return 'bg-cyan-dim';
                  return undefined;
                }}
              />
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1 text-center">矩阵 B ({br}×{bc})</div>
              <MatrixGrid
                matrix={b} readonly size="md"
                highlightCol={currentStep ? currentCol : undefined}
                cellColor={(r, c) => {
                  if (!currentStep || currentStep.type === 'place') return undefined;
                  if (c === currentCol && currentK >= 0 && r <= currentK) return 'bg-success/20';
                  if (c === currentCol) return 'bg-cyan-dim';
                  return undefined;
                }}
              />
            </div>
          </div>

          {/* Calculation detail */}
          {currentStep && currentStep.type !== 'place' && (
            <div className="glass-panel p-3 text-center">
              <div className="text-text-muted text-xs mb-1">
                计算 C[{currentRow}][{currentCol}]
              </div>
              {currentStep.type === 'multiply' && (
                <div className="font-mono text-sm">
                  <span className="text-success">A[{currentRow}][{currentK}] × B[{currentK}][{currentCol}]</span>
                  {' = '}
                  <span className="text-amber">{a[currentRow][currentK]} × {b[currentK][currentCol]}</span>
                  {' = '}
                  <span className="text-text-primary font-semibold">{a[currentRow][currentK] * b[currentK][currentCol]}</span>
                </div>
              )}
              {currentStep.type === 'sum' && (
                <div className="font-mono text-sm">
                  <span className="text-text-muted">Sum = </span>
                  <span className="text-amber">
                    {currentStep.partialProducts?.join(' + ')}
                  </span>
                  {' = '}
                  <span className="text-cyan font-bold">{currentStep.runningSum}</span>
                </div>
              )}
            </div>
          )}
          {currentStep?.type === 'place' && (
            <motion.div
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel p-3 text-center"
            >
              <span className="font-mono text-sm">
                C[{currentRow}][{currentCol}] = <span className="text-cyan font-bold text-lg">{currentStep.result}</span>
              </span>
            </motion.div>
          )}

          {/* Result matrix */}
          <div>
            <div className="text-text-muted text-xs mb-1 text-center">结果 C ({ar}×{bc})</div>
            <MatrixGrid
              matrix={partialResult.map(row => row.map(v => (isNaN(v) ? null as any : v)))}
              readonly
              size="md"
              highlightCell={currentStep ? [currentRow, currentCol] : undefined}
              cellColor={(r, c) => {
                if (!isNaN(partialResult[r]?.[c])) return 'bg-amber-dim';
                return undefined;
              }}
              label="C = A × B"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 justify-center flex-wrap">
        <button onClick={reset} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">⏮ 重置</button>
        <button onClick={prev} disabled={stepIndex <= 0} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors disabled:opacity-30">◀ 上一步</button>
        <button onClick={() => setPlaying(!playing)} className="px-4 py-1.5 bg-cyan-dim text-cyan text-xs rounded hover:bg-cyan/20 transition-colors">
          {playing ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button onClick={next} disabled={stepIndex >= steps.length - 1} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors disabled:opacity-30">下一步 ▶</button>
        <div className="flex items-center gap-1">
          <span className="text-text-dim text-xs">速度:</span>
          <input type="range" min={0.5} max={3} step={0.5} value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            className="w-16 accent-cyan"
          />
          <span className="text-text-dim text-xs font-mono">{speed}x</span>
        </div>
      </div>
    </div>
  );
}

// Fill-in-the-blank mode
function FillBlankMode() {
  const generate = () => {
    const a: Matrix = Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => Math.floor(Math.random() * 5) + 1));
    const b: Matrix = Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => Math.floor(Math.random() * 5) + 1));
    const c = multiply(a, b);
    // Hide 2-3 cells
    const hiddenSet = new Set<string>();
    while (hiddenSet.size < 3) {
      hiddenSet.add(`${Math.floor(Math.random() * 2)},${Math.floor(Math.random() * 2)}`);
    }
    const hidden = Array.from(hiddenSet).map(s => s.split(',').map(Number) as [number, number]);
    return { a, b, c, hidden };
  };

  const [puzzle, setPuzzle] = useState(generate);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const checkAll = () => {
    let correct = true;
    for (const [r, c] of puzzle.hidden) {
      const val = parseFloat(userAnswers[`${r},${c}`] || '');
      if (Math.abs(val - puzzle.c[r][c]) > 0.01) correct = false;
    }
    if (correct) {
      setScore(s => s + 1);
      setTimeout(() => {
        setPuzzle(generate());
        setUserAnswers({});
        setShowResult(false);
      }, 1200);
    }
    setShowResult(true);
  };

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-amber mb-3">📝 填空练习</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        计算空缺位置的值。得分: <span className="text-cyan font-mono">{score}</span>
      </p>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <MatrixGrid matrix={puzzle.a} readonly size="md" label="A" />
        <span className="text-2xl text-text-muted font-mono">×</span>
        <MatrixGrid matrix={puzzle.b} readonly size="md" label="B" />
        <span className="text-2xl text-text-muted font-mono">=</span>
        <div>
          <div className="text-text-muted text-xs mb-1 text-center">C = A × B</div>
          <div className="inline-flex flex-col border border-cyan/20 rounded-lg overflow-hidden">
            <div className="text-cyan/30 text-2xl px-1 flex items-start justify-center">[</div>
            {puzzle.c.map((row, r) => (
              <div key={r} className="flex">
                {row.map((val, c) => {
                  const isHidden = puzzle.hidden.some(([hr, hc]) => hr === r && hc === c);
                  const key = `${r},${c}`;
                  const userVal = userAnswers[key];
                  const isCorrect = !isHidden || (showResult && Math.abs(parseFloat(userVal || '') - val) < 0.01);
                  const isWrong = isHidden && showResult && !isCorrect;
                  return (
                    <div key={c} className={`w-12 h-12 flex items-center justify-center font-mono text-sm ${
                      isHidden ? 'bg-amber-dim' : 'bg-surface/50'
                    } ${isWrong ? 'ring-1 ring-error' : ''} ${isHidden && showResult && isCorrect ? 'ring-1 ring-success' : ''}`}>
                      {isHidden ? (
                        <input
                          type="number"
                          value={userVal || ''}
                          onChange={e => setUserAnswers({ ...userAnswers, [key]: e.target.value })}
                          className="w-10 bg-transparent text-center text-amber font-mono focus:outline-none"
                          placeholder="?"
                        />
                      ) : (
                        <span className="text-text-primary">{val}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="text-cyan/30 text-2xl px-1 flex items-end justify-center">]</div>
          </div>
        </div>
      </div>
      <button onClick={checkAll} className="px-4 py-2 bg-cyan-dim text-cyan text-sm rounded hover:bg-cyan/20 transition-colors font-body">
        检查答案
      </button>
      {showResult && (
        <div className={`text-sm mt-2 font-body ${Object.entries(userAnswers).every(([k, v]) => {
          const [r, c] = k.split(',').map(Number);
          return Math.abs(parseFloat(v || '') - puzzle.c[r][c]) < 0.01;
        }) ? 'text-success' : 'text-error'}`}>
          {Object.entries(userAnswers).every(([k, v]) => {
            const [r, c] = k.split(',').map(Number);
            return Math.abs(parseFloat(v || '') - puzzle.c[r][c]) < 0.01;
          }) ? '✓ 全部正确！' : '✗ 有些答案不对，再试试'}
        </div>
      )}
    </div>
  );
}

// Dimension mismatch highlighter
function DimensionChecker() {
  const [a, setA] = useState<Matrix>([[1, 2, 3], [4, 5, 6]]);
  const [b, setB] = useState<Matrix>([[7, 8], [9, 10]]);
  const [showError, setShowError] = useState(false);

  const [ar, ac] = dims(a);
  const [br, bc] = dims(b);
  const canMultiply = ac === br;

  return (
    <div className="glass-panel p-6">
      <h3 className="font-display text-lg text-cyan mb-3">📏 维度检查器</h3>
      <p className="text-text-muted text-sm mb-4 font-body">
        调整矩阵尺寸来理解：只有当 A 的列数等于 B 的行数时，乘法才有效。
      </p>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <MatrixGrid matrix={a} onChange={setA} size="md" />
          <div className="text-center text-xs font-mono mt-1">
            <span className="text-cyan">{ar} 行</span> × <span className="text-amber">{ac} 列</span>
          </div>
        </div>
        <span className="text-2xl text-text-muted font-mono">×</span>
        <div>
          <MatrixGrid matrix={b} onChange={setB} size="md" />
          <div className="text-center text-xs font-mono mt-1">
            <span className="text-cyan">{br} 行</span> × <span className="text-amber">{bc} 列</span>
          </div>
        </div>
        <span className="text-2xl text-text-muted font-mono">=</span>
        <div>
          {canMultiply ? (
            <>
              <MatrixGrid matrix={multiply(a, b)} readonly size="md" />
              <div className="text-center text-xs font-mono mt-1 text-success">✓ 可乘</div>
            </>
          ) : (
            <div className="glass-panel p-4 text-center border-error/30">
              <div className="text-error font-body text-sm">✗ 无法相乘</div>
              <div className="text-text-muted text-xs mt-1">
                A 有 <span className="text-amber">{ac}</span> 列，但 B 有 <span className="text-cyan">{br}</span> 行
              </div>
              <div className="text-text-dim text-xs mt-0.5">
                {ac} ≠ {br}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setA([[1, 2], [3, 4]]); setB([[5, 6], [7, 8]]); }} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          2×2 × 2×2
        </button>
        <button onClick={() => { setA([[1, 2, 3], [4, 5, 6]]); setB([[7, 8], [9, 10], [11, 12]]); }} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          2×3 × 3×2
        </button>
        <button onClick={() => { setA([[1, 2], [3, 4]]); setB([[5, 6, 7], [8, 9, 10]]); }} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          2×2 × 2×3
        </button>
        <button onClick={() => { setA([[1, 2, 3]]); setB([[4], [5], [6]]); }} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">
          1×3 × 3×1
        </button>
      </div>
    </div>
  );
}

export default function MultiplicationPage() {
  const { progress, complete } = useProgress();
  const [tab, setTab] = useState(0);
  const tabs = ['逐步动画 ⭐', '填空练习', '维度检查'];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-text-dim text-sm hover:text-cyan transition-colors">← 返回</Link>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-cyan mb-2">✖️ 矩阵乘法</h1>
        <p className="text-text-muted font-body mb-6">
          这是最重要的模块！矩阵乘法不是简单的逐元素相乘，而是行与列的点积运算。
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
            {tab === 0 && <StepByStepDemo />}
            {tab === 1 && <FillBlankMode />}
            {tab === 2 && <DimensionChecker />}
          </motion.div>
        </AnimatePresence>

        {!progress.multiplication && (
          <div className="mt-8 text-center">
            <button onClick={() => complete('multiplication')} className="px-6 py-3 bg-cyan/10 text-cyan rounded-lg font-body text-sm hover:bg-cyan/20 transition-all border border-cyan/20">
              ✅ 完成此模块
            </button>
          </div>
        )}
        {progress.multiplication && (
          <div className="mt-6 text-center text-success text-sm font-body">
            ✓ 模块已完成！
            <Link href="/learn/determinant" className="ml-3 text-cyan hover:underline">下一课：行列式 →</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
