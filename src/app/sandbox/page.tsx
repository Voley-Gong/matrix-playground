'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Matrix, createMatrix, add, multiply, scalarMultiply, transpose,
  determinant, inverse, eigenvalues2x2, roundMatrix, identity, dims
} from '@/lib/math';
import MatrixGrid from '@/components/MatrixGrid';
import TransformCanvas from '@/components/TransformCanvas';
import Link from 'next/link';

export default function SandboxPage() {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [matrixA, setMatrixA] = useState<Matrix>([[1, 2], [3, 4]]);
  const [matrixB, setMatrixB] = useState<Matrix>([[5, 6], [7, 8]]);
  const [scalar, setScalar] = useState(2);
  const [result, setResult] = useState<Matrix | null>(null);
  const [resultLabel, setResultLabel] = useState('');
  const [detResult, setDetResult] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const resizeMatrix = (newRows: number, newCols: number, current: Matrix): Matrix => {
    const m = createMatrix(newRows, newCols);
    for (let i = 0; i < Math.min(newRows, current.length); i++) {
      for (let j = 0; j < Math.min(newCols, current[0]?.length ?? 0); j++) {
        m[i][j] = current[i]?.[j] ?? 0;
      }
    }
    return m;
  };

  const doOp = (op: string) => {
    setDetResult(null);
    try {
      switch (op) {
        case 'add':
          setResult(roundMatrix(add(matrixA, matrixB)));
          setResultLabel('A + B');
          break;
        case 'sub': {
          const bNeg = scalarMultiply(matrixB, -1);
          setResult(roundMatrix(add(matrixA, bNeg)));
          setResultLabel('A − B');
          break;
        }
        case 'mult':
          setResult(roundMatrix(multiply(matrixA, matrixB)));
          setResultLabel('A × B');
          break;
        case 'scalar':
          setResult(roundMatrix(scalarMultiply(matrixA, scalar)));
          setResultLabel(`${scalar} × A`);
          break;
        case 'transposeA':
          setResult(roundMatrix(transpose(matrixA)));
          setResultLabel('Aᵀ');
          break;
        case 'transposeB':
          setResult(roundMatrix(transpose(matrixB)));
          setResultLabel('Bᵀ');
          break;
        case 'detA':
          setDetResult(determinant(matrixA));
          setResult(null);
          setResultLabel('det(A)');
          break;
        case 'detB':
          setDetResult(determinant(matrixB));
          setResult(null);
          setResultLabel('det(B)');
          break;
        case 'invA':
          setResult(roundMatrix(inverse(matrixA), 4));
          setResultLabel('A⁻¹');
          break;
        case 'invB':
          setResult(roundMatrix(inverse(matrixB), 4));
          setResultLabel('B⁻¹');
          break;
        case 'identity':
          setResult(identity(Math.max(rows, cols)));
          setResultLabel('I');
          break;
      }
    } catch (e: any) {
      setResult([[NaN]]);
      setResultLabel(`Error: ${e.message}`);
    }
  };

  const copyMatrix = (m: Matrix, label: string) => {
    const text = `${label} = [${m.map(row => `[${row.join(', ')}]`).join(', ')}]`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isSquare = (m: Matrix) => dims(m)[0] === dims(m)[1];
  const is2x2 = (m: Matrix) => { const [r, c] = dims(m); return r === 2 && c === 2; };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link href="/" className="text-text-dim text-sm hover:text-cyan transition-colors">← 返回</Link>
        <h1 className="font-display text-2xl sm:text-3xl text-cyan mt-4 mb-2">🎮 沙盒模式</h1>
        <p className="text-text-muted font-body mb-6">自由编辑矩阵，执行任意操作，实时观察 2D 变换。</p>

        {/* Dimension controls */}
        <div className="glass-panel p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm">A 大小:</span>
              <select value={rows} onChange={e => { const r = parseInt(e.target.value); setRows(r); setMatrixA(resizeMatrix(r, cols, matrixA)); }}
                className="bg-surface border border-border-subtle rounded px-2 py-1 text-text-primary text-sm font-mono">
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-text-muted">×</span>
              <select value={cols} onChange={e => { const c = parseInt(e.target.value); setCols(c); setMatrixA(resizeMatrix(rows, c, matrixA)); }}
                className="bg-surface border border-border-subtle rounded px-2 py-1 text-text-primary text-sm font-mono">
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button onClick={() => { setMatrixA(resizeMatrix(rows, cols, matrixA)); setMatrixB(resizeMatrix(rows, cols, matrixB)); }}
              className="px-3 py-1 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors">
              调整大小
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Matrix A */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-cyan text-sm">矩阵 A</span>
              <button onClick={() => copyMatrix(matrixA, 'A')} className="text-text-dim text-xs hover:text-cyan transition-colors">
                {copied ? '✓ 已复制' : '📋 复制'}
              </button>
            </div>
            <MatrixGrid matrix={matrixA} onChange={setMatrixA} size="md" />
          </div>

          {/* Matrix B */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-amber text-sm">矩阵 B</span>
              <button onClick={() => setMatrixB(resizeMatrix(dims(matrixB)[0], dims(matrixB)[1], matrixB))} className="text-text-dim text-xs hover:text-cyan transition-colors">
                📋 复制
              </button>
            </div>
            <MatrixGrid matrix={matrixB} onChange={setMatrixB} size="md" />
          </div>
        </div>

        {/* Operations */}
        <div className="glass-panel p-4 mb-6">
          <h3 className="font-display text-sm text-cyan mb-3">操作</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => doOp('add')} className="px-3 py-1.5 bg-cyan-dim text-cyan text-xs rounded hover:bg-cyan/20 transition-colors font-body">A + B</button>
            <button onClick={() => doOp('sub')} className="px-3 py-1.5 bg-cyan-dim text-cyan text-xs rounded hover:bg-cyan/20 transition-colors font-body">A − B</button>
            <button onClick={() => doOp('mult')} className="px-3 py-1.5 bg-cyan-dim text-cyan text-xs rounded hover:bg-cyan/20 transition-colors font-body">A × B</button>
            <button onClick={() => doOp('transposeA')} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">Aᵀ</button>
            <button onClick={() => doOp('transposeB')} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">Bᵀ</button>
            <button onClick={() => doOp('detA')} disabled={!isSquare(matrixA)} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body disabled:opacity-30">det(A)</button>
            <button onClick={() => doOp('detB')} disabled={!isSquare(matrixB)} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body disabled:opacity-30">det(B)</button>
            <button onClick={() => doOp('invA')} disabled={!isSquare(matrixA)} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body disabled:opacity-30">A⁻¹</button>
            <button onClick={() => doOp('invB')} disabled={!isSquare(matrixB)} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body disabled:opacity-30">B⁻¹</button>
            <button onClick={() => doOp('identity')} className="px-3 py-1.5 bg-surface text-text-muted text-xs rounded hover:text-cyan transition-colors font-body">I</button>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-text-muted text-xs">数乘:</span>
            <input type="number" value={scalar} onChange={e => setScalar(parseFloat(e.target.value) || 0)}
              className="w-16 bg-surface border border-border-subtle rounded px-2 py-1 text-text-primary font-mono text-sm focus:outline-none" />
            <button onClick={() => doOp('scalar')} className="px-3 py-1.5 bg-cyan-dim text-cyan text-xs rounded hover:bg-cyan/20 transition-colors font-body">
              {scalar} × A
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-success text-sm">{resultLabel}</span>
              <button onClick={() => copyMatrix(result, resultLabel)} className="text-text-dim text-xs hover:text-cyan transition-colors">📋 复制</button>
            </div>
            <MatrixGrid matrix={result} readonly size="md" />
          </motion.div>
        )}

        {detResult !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 mb-6 text-center">
            <span className="font-display text-sm text-text-muted">{resultLabel} = </span>
            <span className="font-mono text-2xl text-cyan">{detResult.toFixed(4)}</span>
          </motion.div>
        )}

        {/* 2D Transform Canvas (only for 2x2 matrix A) */}
        {is2x2(matrixA) && (
          <div className="glass-panel p-4">
            <h3 className="font-display text-sm text-cyan mb-3">2D 变换预览 (矩阵 A)</h3>
            <div className="flex justify-center">
              <TransformCanvas matrix={matrixA} width={400} height={400} showEigenvectors eigenVectors={
                (() => { try { const e = eigenvalues2x2(matrixA); return e.vectors; } catch { return undefined; } })()
              } eigenValues={
                (() => { try { return eigenvalues2x2(matrixA).values; } catch { return undefined; } })()
              } />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
