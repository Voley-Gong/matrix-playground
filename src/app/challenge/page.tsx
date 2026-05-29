'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Matrix, add, multiply, scalarMultiply, transpose, determinant,
  inverse, createMatrix, roundMatrix, dims
} from '@/lib/math';
import MatrixGrid from '@/components/MatrixGrid';
import { useProgress } from '@/lib/progress';
import Link from 'next/link';

type ChallengeType = 'add' | 'mult' | 'det' | 'transpose' | 'inverse';

interface Problem {
  type: ChallengeType;
  question: string;
  a: Matrix;
  b?: Matrix;
  answer: number | Matrix;
  userAnswer: string;
  check: (input: string) => boolean;
}

function randomMatrix(rows: number, cols: number, max = 5): Matrix {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * (2 * max + 1)) - max)
  );
}

function generateProblem(level: number): Problem {
  const types: ChallengeType[] = level < 3
    ? ['add', 'mult', 'det']
    : ['add', 'mult', 'det', 'transpose', 'inverse'];

  const type = types[Math.floor(Math.random() * types.length)];

  switch (type) {
    case 'add': {
      const a = randomMatrix(2, 2);
      const b = randomMatrix(2, 2);
      const answer = add(a, b);
      return {
        type: 'add',
        question: '计算 A + B 的结果，输入第 1 行第 1 列的值',
        a, b, answer,
        userAnswer: '',
        check: (input) => Math.abs(parseFloat(input) - answer[0][0]) < 0.01,
      };
    }
    case 'mult': {
      const a = randomMatrix(2, 2, 3);
      const b = randomMatrix(2, 2, 3);
      const answer = multiply(a, b);
      const targetRow = Math.floor(Math.random() * 2);
      const targetCol = Math.floor(Math.random() * 2);
      return {
        type: 'mult',
        question: `计算 A × B，输入 C[${targetRow}][${targetCol}] 的值`,
        a, b, answer,
        userAnswer: '',
        check: (input) => Math.abs(parseFloat(input) - answer[targetRow][targetCol]) < 0.01,
      };
    }
    case 'det': {
      const a = randomMatrix(2, 2, 4);
      const answer = determinant(a);
      return {
        type: 'det',
        question: '计算矩阵 A 的行列式',
        a, answer,
        userAnswer: '',
        check: (input) => Math.abs(parseFloat(input) - answer) < 0.01,
      };
    }
    case 'transpose': {
      const a = randomMatrix(2, 3);
      const answer = transpose(a);
      const targetRow = Math.floor(Math.random() * 3);
      const targetCol = Math.floor(Math.random() * 2);
      return {
        type: 'transpose',
        question: `计算 Aᵀ，输入结果矩阵第 ${targetRow + 1} 行第 ${targetCol + 1} 列的值`,
        a, answer,
        userAnswer: '',
        check: (input) => Math.abs(parseFloat(input) - answer[targetRow][targetCol]) < 0.01,
      };
    }
    case 'inverse': {
      // Generate invertible matrix
      let a: Matrix;
      do { a = randomMatrix(2, 2, 3); } while (Math.abs(determinant(a)) < 0.5);
      const answer = inverse(a);
      const targetRow = Math.floor(Math.random() * 2);
      const targetCol = Math.floor(Math.random() * 2);
      return {
        type: 'inverse',
        question: `计算 A⁻¹，输入结果矩阵第 ${targetRow + 1} 行第 ${targetCol + 1} 列的值（保留1位小数）`,
        a, answer,
        userAnswer: '',
        check: (input) => Math.abs(parseFloat(input) - Math.round(answer[targetRow][targetCol] * 10) / 10) < 0.05,
      };
    }
  }
}

export default function ChallengePage() {
  const { progress, setHighScore } = useProgress();
  const [mode, setMode] = useState<'menu' | 'speed' | 'puzzle' | 'boss'>('menu');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const startSpeed = () => {
    setMode('speed');
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setGameOver(false);
    nextProblem(0);
  };

  const nextProblem = useCallback((level: number) => {
    setProblem(generateProblem(Math.floor(level / 3)));
    setInput('');
  }, []);

  useEffect(() => {
    if (mode === 'speed' && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setGameOver(true);
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [mode, gameOver]);

  const submit = () => {
    if (!problem || gameOver) return;
    if (problem.check(input)) {
      const pts = 10 + streak * 2;
      setScore(s => s + pts);
      setStreak(s => s + 1);
      nextProblem(score);
    } else {
      setStreak(0);
      nextProblem(score);
    }
  };

  useEffect(() => {
    if (gameOver) {
      setHighScore(score);
    }
  }, [gameOver]);

  if (mode === 'menu') {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link href="/" className="text-text-dim text-sm hover:text-cyan transition-colors">← 返回</Link>
          <h1 className="font-display text-2xl sm:text-3xl text-cyan mt-4 mb-2">⚔️ 挑战竞技场</h1>
          <p className="text-text-muted font-body mb-6">测试你的矩阵运算技能！</p>

          {progress.challenge > 0 && (
            <div className="glass-panel p-4 mb-6 text-center">
              <span className="text-text-muted text-sm">最高分: </span>
              <span className="text-amber font-mono text-lg">{progress.challenge}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.button onClick={startSpeed}
              className="glass-panel p-6 text-center hover:border-cyan/30 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}>
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-display text-cyan text-sm">速度挑战</div>
              <div className="text-text-dim text-xs mt-1">60秒内答对尽可能多</div>
            </motion.button>

            <motion.button onClick={startSpeed}
              className="glass-panel p-6 text-center hover:border-amber/30 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}>
              <div className="text-3xl mb-2">🧩</div>
              <div className="font-display text-amber text-sm">谜题模式</div>
              <div className="text-text-dim text-xs mt-1">构造目标矩阵</div>
            </motion.button>

            <motion.button onClick={startSpeed}
              className="glass-panel p-6 text-center hover:border-error/30 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}>
              <div className="text-3xl mb-2">👹</div>
              <div className="font-display text-error text-sm">Boss 战</div>
              <div className="text-text-dim text-xs mt-1">综合大题</div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMode('menu')} className="text-text-dim text-sm hover:text-cyan transition-colors">← 退出</button>
        <div className="flex items-center gap-4">
          <span className="font-mono text-cyan">得分: {score}</span>
          {streak > 1 && <span className="text-amber text-sm">🔥 x{streak}</span>}
          <span className={`font-mono ${timeLeft <= 10 ? 'text-error' : 'text-text-muted'}`}>
            ⏱ {timeLeft}s
          </span>
        </div>
      </div>

      {gameOver ? (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="glass-panel p-8 text-center">
          <h2 className="font-display text-2xl text-amber mb-4">⏱ 时间到！</h2>
          <div className="text-4xl font-mono text-cyan mb-2">{score}</div>
          <div className="text-text-muted text-sm mb-4">分</div>
          {score >= progress.challenge && score > 0 && (
            <div className="text-success text-sm mb-4">🏆 新纪录！</div>
          )}
          <button onClick={startSpeed} className="px-6 py-2 bg-cyan-dim text-cyan rounded-lg text-sm font-body hover:bg-cyan/20 transition-colors">
            再来一次
          </button>
        </motion.div>
      ) : problem && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6">
          <div className="text-text-muted text-sm mb-4 font-body">{problem.question}</div>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <MatrixGrid matrix={problem.a} readonly size="md" label="A" />
            {problem.b && (
              <>
                <span className="text-xl text-text-muted font-mono">
                  {problem.type === 'add' ? '+' : '×'}
                </span>
                <MatrixGrid matrix={problem.b} readonly size="md" label="B" />
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-28 bg-surface border border-border-subtle rounded px-3 py-2 text-text-primary font-mono text-lg focus:outline-none focus:border-cyan/50"
              placeholder="答案"
              autoFocus
            />
            <button onClick={submit} className="px-6 py-2 bg-cyan-dim text-cyan rounded-lg text-sm font-body hover:bg-cyan/20 transition-colors">
              提交
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
