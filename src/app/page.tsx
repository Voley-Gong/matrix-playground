'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MODULES, ModuleInfo, ModuleProgress, isUnlocked, useProgress } from '@/lib/progress';

function ConstellationMap({ progress }: { progress: ModuleProgress }) {
  const positions = [
    { x: 50, y: 80 },   // intro
    { x: 22, y: 45 },   // addition
    { x: 50, y: 20 },   // multiplication
    { x: 78, y: 45 },   // transpose
    { x: 30, y: 20 },   // determinant
    { x: 18, y: 10 },   // inverse
    { x: 42, y: 5 },    // eigen
  ];

  const connections: [number, number][] = [
    [0, 1], [1, 2], [0, 3], [2, 4], [4, 5], [4, 6],
  ];

  const completedCount = MODULES.filter(m => progress[m.id as keyof ModuleProgress] === true).length;
  const total = MODULES.length;
  const pct = Math.round((completedCount / total) * 100);

  return (
    <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: '1/1' }}>
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 90">
        {connections.map(([a, b], i) => {
          const pa = positions[a], pb = positions[b];
          const unlocked = isUnlocked(MODULES[b], progress);
          return (
            <line
              key={i}
              x1={pa.x} y1={pa.y}
              x2={pb.x} y2={pb.y}
              stroke={unlocked ? 'rgba(76, 204, 255, 0.3)' : 'rgba(76, 204, 255, 0.07)'}
              strokeWidth={unlocked ? 0.5 : 0.3}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {MODULES.map((mod, i) => {
        const pos = positions[i];
        const completed = progress[mod.id as keyof ModuleProgress] === true;
        const unlocked = isUnlocked(mod, progress);
        const locked = !unlocked && !completed;

        return (
          <Link key={mod.id} href={locked ? '#' : mod.path}>
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              whileHover={locked ? {} : { scale: 1.1 }}
            >
              <div className={`glass-panel p-3 sm:p-4 text-center transition-all duration-300 ${
                completed ? 'glow-cyan border-cyan/20' :
                unlocked ? 'border-cyan/10 hover:border-cyan/30' :
                'opacity-40'
              }`} style={{ minWidth: '90px' }}>
                <div className="text-2xl mb-1">{locked ? '🔒' : mod.icon}</div>
                <div className="font-body text-xs text-text-primary font-medium">{mod.nameZh}</div>
                <div className="text-text-dim text-[10px] mt-0.5">
                  {'⭐'.repeat(mod.difficulty)}
                </div>
                {completed && (
                  <div className="text-success text-[10px] mt-1">✓ 已完成</div>
                )}
              </div>
            </motion.div>
          </Link>
        );
      })}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-text-muted text-xs font-body">总进度</span>
          <span className="text-cyan text-xs font-mono">{pct}%</span>
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan to-amber rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { progress } = useProgress();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-3xl sm:text-5xl text-cyan tracking-widest mb-2">
          矩阵游乐场
        </h1>
        <p className="font-body text-text-muted text-sm sm:text-base">
          通过互动游戏和动画学习矩阵运算
        </p>
      </motion.div>

      <ConstellationMap progress={progress} />

      <div className="flex gap-4 mt-12">
        <Link href="/sandbox">
          <motion.div
            className="glass-panel px-6 py-3 hover:border-amber/30 transition-all cursor-pointer text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="font-body text-amber text-sm font-medium">🎮 沙盒模式</div>
            <div className="text-text-dim text-xs">自由探索</div>
          </motion.div>
        </Link>
        <Link href="/challenge">
          <motion.div
            className="glass-panel px-6 py-3 hover:border-cyan/30 transition-all cursor-pointer text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="font-body text-cyan text-sm font-medium">⚔️ 挑战竞技场</div>
            <div className="text-text-dim text-xs">测试你的技能</div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
