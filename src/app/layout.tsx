import { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: '矩阵游乐场 — Matrix Playground',
  description: '通过游戏和交互学习矩阵计算的原理',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="scanlines bg-grid min-h-screen">
        <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border-subtle">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-display text-cyan text-lg tracking-wider hover:text-cyan/80 transition-colors">
              矩阵游乐场
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/sandbox" className="text-sm text-text-muted hover:text-cyan transition-colors font-body">
                🎮 沙盒
              </Link>
              <Link href="/challenge" className="text-sm text-text-muted hover:text-cyan transition-colors font-body">
                ⚔️ 挑战
              </Link>
            </div>
          </div>
        </nav>
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
