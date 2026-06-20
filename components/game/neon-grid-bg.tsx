'use client'

import { useEffect, useRef } from 'react'
import { THEME_BG, ArenaTheme } from '@/lib/game-types'

export default function NeonGridBg({ theme = 'dark-void' }: { theme?: ArenaTheme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = THEME_BG[theme] ?? THEME_BG['dark-void']

    const draw = () => {
      time += 0.005
      ctx.fillStyle = colors.bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const spacing = 40
      const alpha = 0.08 + Math.sin(time) * 0.04

      ctx.strokeStyle = colors.grid
      ctx.lineWidth = 1
      ctx.globalAlpha = alpha

      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Glowing pulse lines
      ctx.globalAlpha = 0.15 + Math.sin(time * 2) * 0.1
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = 2
      const pulseY = ((time * 50) % canvas.height)
      ctx.beginPath()
      ctx.moveTo(0, pulseY)
      ctx.lineTo(canvas.width, pulseY)
      ctx.stroke()
      const pulseX = ((time * 30) % canvas.width)
      ctx.beginPath()
      ctx.moveTo(pulseX, 0)
      ctx.lineTo(pulseX, canvas.height)
      ctx.stroke()

      ctx.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [theme])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}
