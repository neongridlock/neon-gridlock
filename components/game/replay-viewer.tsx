'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ReplayFrame, THEME_BG, COLOR_HEX, PlayerColor, ArenaTheme, BOT_COLORS } from '@/lib/game-types'
import { ArrowLeft, Play, Pause, SkipForward, SkipBack } from 'lucide-react'

interface ReplayViewerProps {
  frames: ReplayFrame[]
  gridSize: number
  playerColor: PlayerColor
  arenaTheme: ArenaTheme
  botCount: number
  onBack: () => void
}

export default function ReplayViewer({ frames, gridSize, playerColor, arenaTheme, botCount, onBack }: ReplayViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(2)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const color = COLOR_HEX[playerColor] ?? '#00ffff'
  const theme = THEME_BG[arenaTheme] ?? THEME_BG['dark-void']

  useEffect(() => {
    if (!playing) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setCurrentFrame(f => {
        if (f >= (frames?.length ?? 1) - 1) { setPlaying(false); return f }
        return f + 1
      })
    }, 100 / speed)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, speed, frames?.length])

  // Render frame
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !frames?.length) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1)
    canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1)
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)
    const w = canvas.clientWidth, h = canvas.clientHeight

    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h)
    const frame = frames[currentFrame]
    if (!frame) return

    const maxDim = Math.min(w - 20, h - 40)
    const cellSize = Math.floor(maxDim / gridSize)
    const totalW = cellSize * gridSize, totalH = cellSize * gridSize
    const offsetX = Math.floor((w - totalW) / 2), offsetY = Math.floor((h - totalH) / 2)

    // Grid
    ctx.strokeStyle = theme.grid; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.3
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath(); ctx.moveTo(offsetX + i * cellSize, offsetY); ctx.lineTo(offsetX + i * cellSize, offsetY + totalH); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(offsetX, offsetY + i * cellSize); ctx.lineTo(offsetX + totalW, offsetY + i * cellSize); ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Cells
    const grid = frame.grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid?.[y]?.[x] ?? 0
        if (cell === 0) continue
        const cx = offsetX + x * cellSize, cy = offsetY + y * cellSize
        if (cell === 3) {
          ctx.fillStyle = theme.accent; ctx.globalAlpha = 0.7
          ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2)
          ctx.globalAlpha = 1; continue
        }
        const isPlayer = cell === 1
        ctx.fillStyle = isPlayer ? color : (BOT_COLORS[(cell as number) - 2] ?? BOT_COLORS[0])
        ctx.globalAlpha = 0.7
        ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2)
      }
    }
    ctx.globalAlpha = 1

    // Heads
    if (frame.playerPositions?.[0]) {
      const pp = frame.playerPositions[0]
      ctx.fillStyle = color; ctx.shadowBlur = 15; ctx.shadowColor = color
      ctx.fillRect(offsetX + pp.x * cellSize, offsetY + pp.y * cellSize, cellSize, cellSize)
      ctx.shadowBlur = 0
    }
    if (frame.botPositions?.[0]) {
      frame.botPositions[0].forEach((bp, i) => {
        ctx.fillStyle = BOT_COLORS[i] ?? BOT_COLORS[0]; ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle
        ctx.fillRect(offsetX + bp.x * cellSize, offsetY + bp.y * cellSize, cellSize, cellSize)
        ctx.shadowBlur = 0
      })
    }

    // Border
    ctx.strokeStyle = theme.accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.5
    ctx.strokeRect(offsetX - 1, offsetY - 1, totalW + 2, totalH + 2)
    ctx.globalAlpha = 1
  }, [currentFrame, frames, gridSize, color, theme])

  const total = frames?.length ?? 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80 border-b border-gray-800">
        <button onClick={onBack} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
          <ArrowLeft className="w-4 h-4 text-gray-300" />
        </button>
        <span className="text-sm font-display font-bold" style={{ color }}>REPLAY VIEWER</span>
        <span className="text-xs text-gray-500 font-mono ml-auto">Frame {currentFrame + 1} / {total}</span>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 px-4 py-3 bg-black/80 border-t border-gray-800">
        <button onClick={() => setCurrentFrame(Math.max(0, currentFrame - 10))} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
          <SkipBack className="w-4 h-4 text-gray-300" />
        </button>
        <button onClick={() => setPlaying(!playing)}
          className="p-2.5 rounded-full" style={{ backgroundColor: color, color: '#000' }}>
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" fill="currentColor" />}
        </button>
        <button onClick={() => setCurrentFrame(Math.min(total - 1, currentFrame + 10))} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
          <SkipForward className="w-4 h-4 text-gray-300" />
        </button>

        {/* Scrubber */}
        <input type="range" min={0} max={Math.max(0, total - 1)} value={currentFrame}
          onChange={e => setCurrentFrame(parseInt(e.target.value))}
          className="flex-1 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: color }} />

        {/* Speed */}
        <div className="flex gap-1">
          {[1, 2, 4].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-[10px] font-mono rounded ${speed === s ? 'text-black font-bold' : 'bg-gray-800 text-gray-400'}`}
              style={speed === s ? { backgroundColor: color } : {}}>
              {s}x
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
