'use client';

import { CSSProperties, useState, useRef, useEffect } from 'react';
import { Matrix, dims } from '@/lib/math';

interface MatrixGridProps {
  matrix: Matrix;
  onChange?: (m: Matrix) => void;
  readonly?: boolean;
  highlightRow?: number | null;
  highlightCol?: number | null;
  highlightCell?: [number, number] | null;
  highlightCells?: [number, number][];
  cellColor?: (r: number, c: number) => string | undefined;
  size?: 'sm' | 'md' | 'lg';
  brackets?: boolean;
  label?: string;
  className?: string;
  showBracketLabels?: boolean;
  rowLabel?: string;
  colLabel?: string;
}

export default function MatrixGrid({
  matrix,
  onChange,
  readonly = false,
  highlightRow = null,
  highlightCol = null,
  highlightCell = null,
  highlightCells,
  cellColor,
  size = 'md',
  brackets = true,
  label,
  className = '',
  rowLabel,
  colLabel,
}: MatrixGridProps) {
  const [rows, cols] = dims(matrix);
  const cellSize = size === 'sm' ? 'w-10 h-10 text-sm' : size === 'lg' ? 'w-16 h-16 text-lg' : 'w-12 h-12 text-base';
  const inputSize = size === 'sm' ? 'w-8 text-sm' : size === 'lg' ? 'w-14 text-lg' : 'w-10 text-base';

  const isHighlighted = (r: number, c: number) => {
    if (highlightCell && highlightCell[0] === r && highlightCell[1] === c) return true;
    if (highlightCells?.some(([hr, hc]) => hr === r && hc === c)) return true;
    if (highlightRow === r) return true;
    if (highlightCol === c) return true;
    return false;
  };

  const handleChange = (r: number, c: number, val: string) => {
    if (!onChange) return;
    const num = val === '' || val === '-' ? 0 : parseFloat(val);
    if (isNaN(num)) return;
    const newM = matrix.map(row => [...row]);
    newM[r][c] = num;
    onChange(newM);
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {label && <div className="text-text-muted text-xs font-body mb-1 text-center">{label}</div>}
      <div className="flex items-center">
        {brackets && (
          <div className="text-cyan/40 text-4xl font-light select-none mr-0.5 flex items-center" style={{ height: `${rows * (size === 'sm' ? 40 : size === 'lg' ? 64 : 48)}px` }}>
            [
          </div>
        )}
        <div className="flex flex-col">
          {matrix.map((row, r) => (
            <div key={r} className="flex">
              {row.map((val, c) => {
                const hl = isHighlighted(r, c);
                const customColor = cellColor?.(r, c);
                return (
                  <div
                    key={c}
                    className={`${cellSize} flex items-center justify-center matrix-cell font-mono ${
                      hl ? 'bg-cyan-dim ring-1 ring-cyan/30' : 'bg-surface/50'
                    } ${customColor || ''}`}
                    style={{ borderRadius: 4 }}
                  >
                    {readonly ? (
                      <span className={`${hl ? 'text-cyan font-semibold' : 'text-text-primary'}`}>
                        {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={val}
                        onChange={e => handleChange(r, c, e.target.value)}
                        className={`${inputSize} bg-transparent text-center text-text-primary font-mono focus:outline-none focus:text-cyan`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {brackets && (
          <div className="text-cyan/40 text-4xl font-light select-none ml-0.5 flex items-center" style={{ height: `${rows * (size === 'sm' ? 40 : size === 'lg' ? 64 : 48)}px` }}>
            ]
          </div>
        )}
      </div>
      {rowLabel && <div className="text-text-dim text-xs font-body mt-0.5">{rowLabel}</div>}
    </div>
  );
}
