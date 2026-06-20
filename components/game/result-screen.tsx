'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { COLOR_HEX, PlayerColor, BOT_COLORS, getRank, getNextRank, TRAIL_EFFECTS } from '@/lib/game-types'
import { playVictoryChime, playDefeatBuzz, playStreakSound } from '@/lib/audio'
import { Trophy, RotateCcw, Settings, Clock, Grid3X3, Skull, Star, Film, Sparkles } from 'lucide-react'

interface ResultScreenProps {
  result: 'win' | 'loss'
  playerTiles: number
  botTiles: number
  durationMs: number
  playerColor: PlayerColor
  onReplay: () => void
  onChangeSettings: () => void
  onWatchReplay?: () => void
  streak: number
  bestStreak: number
  totalWins: number
  newUnlock?: string | null
}

export default function ResultScreen({
  result, playerTiles, botTiles, durationMs, playerColor, onReplay, onChangeSettings,
  onWatchReplay, streak, bestStreak, totalWins, newUnlock
}: ResultScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)
  const accentColor = COLOR_HEX[playerColor ?? 'cyan'] ?? '#00ffff'
  const isWin = result === 'win'
  const rank = getRank(totalWins)

  useEffect(() => {
    setMounted(true)
    if (isWin) {
      playVictoryChime()
      if (streak >= 3) setTimeout(() => playStreakSound(), 500)
    } else {
      playDefeatBuzz()
    }
  }, [isWin, streak])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number; maxLife: number }[] = []
    const color = isWin ? accentColor : '#ff3333'
    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80
      const speed = 2 + Math.random() * 6
      particles.push({ x: canvas.width / 2, y: canvas.height / 2,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: i % 3 === 0 ? color : i % 3 === 1 ? '#ffffff' : (isWin ? '#ffff00' : '#ff6600'),
        life: 0, maxLife: 60 + Math.random() * 60 })
    }
    let animId: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.vx *= 0.99; p.life++
        const alpha = Math.max(0, 1 - p.life / p.maxLife)
        if (alpha <= 0) continue
        alive = true
        ctx.globalAlpha = alpha; ctx.fillStyle = p.color; ctx.shadowBlur = 10; ctx.shadowColor = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
      if (alive) animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [isWin, accentColor])

  const durationSec = ((durationMs ?? 0) / 1000).toFixed(1)
  if (!mounted) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto py-8 ${!isWin ? 'shake' : ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Result Title */}
        <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10 }} className="flex items-center gap-4">
          {isWin ? <Trophy className="w-10 h-10" style={{ color: accentColor }} /> : <Skull className="w-10 h-10 text-red-500" />}
          <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight neon-flicker"
            style={{ color: isWin ? accentColor : '#ff3333' }}>{isWin ? 'YOU WIN' : 'YOU LOSE'}</h1>
        </motion.div>

        {/* Streak */}
        {isWin && streak >= 2 && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40">
            <span className="text-lg">🔥</span>
            <span className="text-orange-400 font-bold font-mono text-sm">{streak} WIN STREAK!</span>
            {streak > bestStreak && <span className="text-[10px] text-orange-300 font-mono">NEW BEST!</span>}
          </motion.div>
        )}

        {/* Rank */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center gap-2 text-xs font-mono">
          <Star className="w-4 h-4" style={{ color: rank.color }} />
          <span style={{ color: rank.color }}>{rank.label}</span>
        </motion.div>

        {/* New Unlock */}
        {newUnlock && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 font-mono text-sm">Unlocked: {newUnlock}!</span>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mt-2">
          <StatBox label="Your Tiles" value={String(playerTiles ?? 0)} color={accentColor} icon={<Grid3X3 className="w-4 h-4" />} />
          <StatBox label="Bot Tiles" value={String(botTiles ?? 0)} color={BOT_COLORS[0]} icon={<Grid3X3 className="w-4 h-4" />} />
          <StatBox label="Duration" value={`${durationSec}s`} color="#888" icon={<Clock className="w-4 h-4" />} />
        </motion.div>

        {/* Buttons */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex gap-3 mt-4 flex-wrap justify-center">
          <button onClick={() => onReplay?.()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-display font-bold text-black text-base transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: accentColor }}>
            <RotateCcw className="w-5 h-5" />REPLAY
          </button>
          {onWatchReplay && (
            <button onClick={() => onWatchReplay?.()}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-display font-bold text-base transition-all hover:scale-105 active:scale-95 bg-purple-900/60 text-purple-300 border border-purple-700">
              <Film className="w-5 h-5" />REPLAY VIEWER
            </button>
          )}
          <button onClick={() => onChangeSettings?.()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-display font-bold text-gray-300 text-base bg-gray-800 border border-gray-600 transition-all hover:scale-105 hover:bg-gray-700 active:scale-95">
            <Settings className="w-5 h-5" />SETTINGS
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

function StatBox({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-black/60 border border-gray-800 rounded-lg px-5 py-2">
      <div className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider" style={{ color }}>{icon}{label}</div>
      <div className="text-2xl font-bold font-display" style={{ color }}>{value}</div>
    </div>
  )
}
