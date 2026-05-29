'use client';

import { useState, useEffect } from 'react';

export interface ModuleProgress {
  intro: boolean;
  addition: boolean;
  multiplication: boolean;
  transpose: boolean;
  determinant: boolean;
  inverse: boolean;
  eigen: boolean;
  challenge: number;
}

const DEFAULT_PROGRESS: ModuleProgress = {
  intro: false,
  addition: false,
  multiplication: false,
  transpose: false,
  determinant: false,
  inverse: false,
  eigen: false,
  challenge: 0,
};

export function useProgress() {
  const [progress, setProgress] = useState<ModuleProgress>(DEFAULT_PROGRESS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('matrix-progress');
      if (saved) setProgress(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (p: ModuleProgress) => {
    setProgress(p);
    try { localStorage.setItem('matrix-progress', JSON.stringify(p)); } catch {}
  };

  const complete = (mod: keyof ModuleProgress) => {
    if (mod === 'challenge') return;
    save({ ...progress, [mod]: true });
  };

  const setHighScore = (score: number) => {
    if (score > progress.challenge) save({ ...progress, challenge: score });
  };

  return { progress, complete, setHighScore };
}

export interface ModuleInfo {
  id: string;
  name: string;
  nameZh: string;
  path: string;
  difficulty: 1 | 2 | 3;
  icon: string;
  deps: string[];
}

export const MODULES: ModuleInfo[] = [
  { id: 'intro', name: 'What is a Matrix?', nameZh: '矩阵是什么', path: '/learn/intro', difficulty: 1, icon: '📐', deps: [] },
  { id: 'addition', name: 'Addition & Scalar', nameZh: '加法与数乘', path: '/learn/addition', difficulty: 1, icon: '➕', deps: ['intro'] },
  { id: 'multiplication', name: 'Multiplication', nameZh: '矩阵乘法', path: '/learn/multiplication', difficulty: 2, icon: '✖️', deps: ['addition'] },
  { id: 'transpose', name: 'Transpose', nameZh: '转置', path: '/learn/transpose', difficulty: 1, icon: '🔄', deps: ['intro'] },
  { id: 'determinant', name: 'Determinant', nameZh: '行列式', path: '/learn/determinant', difficulty: 2, icon: '📊', deps: ['multiplication'] },
  { id: 'inverse', name: 'Inverse', nameZh: '逆矩阵', path: '/learn/inverse', difficulty: 3, icon: '⏪', deps: ['determinant'] },
  { id: 'eigen', name: 'Eigenvalues', nameZh: '特征值与特征向量', path: '/learn/eigen', difficulty: 3, icon: '🔮', deps: ['determinant'] },
];

export function isUnlocked(mod: ModuleInfo, progress: ModuleProgress): boolean {
  return mod.deps.every(dep => progress[dep as keyof ModuleProgress] === true);
}
