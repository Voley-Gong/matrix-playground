// Matrix Math Engine — all core operations

export type Matrix = number[][];

export function createMatrix(rows: number, cols: number, fill = 0): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

export function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

export function cloneMatrix(m: Matrix): Matrix {
  return m.map(row => [...row]);
}

export function dims(m: Matrix): [number, number] {
  return [m.length, m[0]?.length ?? 0];
}

export function add(a: Matrix, b: Matrix): Matrix {
  const [r, c] = dims(a);
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (_, j) => a[i][j] + b[i][j])
  );
}

export function subtract(a: Matrix, b: Matrix): Matrix {
  const [r, c] = dims(a);
  return Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (_, j) => a[i][j] - b[i][j])
  );
}

export function scalarMultiply(m: Matrix, s: number): Matrix {
  return m.map(row => row.map(v => v * s));
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  const [ar, ac] = dims(a);
  const [br, bc] = dims(b);
  if (ac !== br) throw new Error(`Dimension mismatch: ${ar}x${ac} * ${br}x${bc}`);
  const result = createMatrix(ar, bc);
  for (let i = 0; i < ar; i++) {
    for (let j = 0; j < bc; j++) {
      let sum = 0;
      for (let k = 0; k < ac; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export function transpose(m: Matrix): Matrix {
  const [r, c] = dims(m);
  return Array.from({ length: c }, (_, j) =>
    Array.from({ length: r }, (_, i) => m[i][j])
  );
}

export function determinant(m: Matrix): number {
  const [r, c] = dims(m);
  if (r !== c) throw new Error('Matrix must be square');
  if (r === 1) return m[0][0];
  if (r === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let det = 0;
  for (let j = 0; j < c; j++) {
    const minor = m.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
    det += (j % 2 === 0 ? 1 : -1) * m[0][j] * determinant(minor);
  }
  return det;
}

export function cofactor(m: Matrix, row: number, col: number): Matrix {
  return m
    .filter((_, i) => i !== row)
    .map(row => row.filter((_, j) => j !== col));
}

export function inverse(m: Matrix): Matrix {
  const [r, c] = dims(m);
  if (r !== c) throw new Error('Matrix must be square');
  if (r === 2) {
    const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    if (Math.abs(det) < 1e-10) throw new Error('Matrix is singular');
    return [
      [m[1][1] / det, -m[0][1] / det],
      [-m[1][0] / det, m[0][0] / det],
    ];
  }
  // Gauss-Jordan elimination
  const n = r;
  const aug = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-10) throw new Error('Matrix is singular');

    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  return aug.map(row => row.slice(n));
}

export function eigenvalues2x2(m: Matrix): { values: [number, number]; vectors: [number[], number[]] } {
  const a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1];
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;

  if (disc < 0) {
    // Complex eigenvalues — return real parts with a flag
    const realPart = trace / 2;
    const imagPart = Math.sqrt(-disc) / 2;
    return {
      values: [realPart, realPart],
      vectors: [[1, 0], [0, 1]],
    };
  }

  const sqrtDisc = Math.sqrt(disc);
  const l1 = (trace + sqrtDisc) / 2;
  const l2 = (trace - sqrtDisc) / 2;

  // Eigenvectors
  const v1 = getEigenvector(m, l1);
  const v2 = getEigenvector(m, l2);

  return { values: [l1, l2], vectors: [v1, v2] };
}

function getEigenvector(m: Matrix, lambda: number): number[] {
  const a = m[0][0] - lambda;
  const b = m[0][1];
  const c = m[1][0];
  const d = m[1][1] - lambda;

  if (Math.abs(b) > 1e-10) return [-b, a];
  if (Math.abs(c) > 1e-10) return [d, -c];
  if (Math.abs(a) > 1e-10) return [1, 0];
  return [0, 1];
}

export function transformPoint(m: Matrix, x: number, y: number): [number, number] {
  return [m[0][0] * x + m[0][1] * y, m[1][0] * x + m[1][1] * y];
}

export function roundMatrix(m: Matrix, dp = 2): Matrix {
  const f = Math.pow(10, dp);
  return m.map(row => row.map(v => Math.round(v * f) / f));
}

export function matricesEqual(a: Matrix, b: Matrix, tolerance = 0.01): boolean {
  if (a.length !== b.length || a[0].length !== b[0].length) return false;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[0].length; j++) {
      if (Math.abs(a[i][j] - b[i][j]) > tolerance) return false;
    }
  }
  return true;
}

// Multiplication step-by-step data
export interface MultStep {
  type: 'highlight' | 'multiply' | 'sum' | 'place';
  row: number;
  col: number;
  k: number;
  partialProducts?: number[];
  runningSum?: number;
  result?: number;
}

export function getMultSteps(a: Matrix, b: Matrix): MultStep[] {
  const [ar, ac] = dims(a);
  const [br, bc] = dims(b);
  const steps: MultStep[] = [];
  for (let i = 0; i < ar; i++) {
    for (let j = 0; j < bc; j++) {
      const prods: number[] = [];
      let sum = 0;
      for (let k = 0; k < ac; k++) {
        prods.push(a[i][k] * b[k][j]);
        sum += a[i][k] * b[k][j];
        steps.push({ type: 'multiply', row: i, col: j, k, partialProducts: [...prods], runningSum: sum });
      }
      steps.push({ type: 'sum', row: i, col: j, k: -1, partialProducts: prods, runningSum: sum, result: sum });
      steps.push({ type: 'place', row: i, col: j, k: -1, result: sum });
    }
  }
  return steps;
}

// Gaussian elimination steps for inverse
export interface GaussStep {
  type: 'pivot' | 'scale' | 'eliminate' | 'done';
  pivotRow: number;
  targetRow: number;
  col: number;
  factor?: number;
  matrix: Matrix;
  aug: Matrix;
}

export function getGaussSteps(m: Matrix): GaussStep[] {
  const n = m.length;
  const aug = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  const steps: GaussStep[] = [];

  for (let col = 0; col < n; col++) {
    // Pivot selection
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
      steps.push({
        type: 'pivot', pivotRow: maxRow, targetRow: col, col,
        matrix: aug.map(r => r.slice(0, n)),
        aug: aug.map(r => r.slice(n)),
      });
    }

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-10) continue;

    // Scale pivot row
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    steps.push({
      type: 'scale', pivotRow: col, targetRow: col, col, factor: pivot,
      matrix: aug.map(r => r.slice(0, n)),
      aug: aug.map(r => r.slice(n)),
    });

    // Eliminate
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
      steps.push({
        type: 'eliminate', pivotRow: col, targetRow: row, col, factor,
        matrix: aug.map(r => r.slice(0, n)),
        aug: aug.map(r => r.slice(n)),
      });
    }
  }

  steps.push({
    type: 'done', pivotRow: -1, targetRow: -1, col: -1,
    matrix: aug.map(r => r.slice(0, n)),
    aug: aug.map(r => r.slice(n)),
  });

  return steps;
}
