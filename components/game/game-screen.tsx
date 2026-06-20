'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  GameSettings, GamePhase, Direction, Position, PowerUp, PowerUpType, ReplayFrame,
  GRID_SIZES, SPEED_MS, COLOR_HEX, BOT_COLORS, THEME_BG, POWERUP_COLORS,
  POWERUP_ICONS, POWERUP_DURATION_TICKS, generateObstacles, AbilityType
} from '@/lib/game-types'
import { getBotMove, CellState } from '@/lib/bot-ai'
import {
  playCountdownBeep, playGoBeep, playStepTick,
  playCrashSound, startHum, stopHum, playTensionRise,
  playPowerUp, playAbility, playZoneShrink
} from '@/lib/audio'
import { Clock, Grid3X3, Zap, Shield, Bomb, Snowflake, Ghost } from 'lucide-react'

interface BotState {
  pos: Position
  dir: Direction
  tiles: number
  alive: boolean
  frozen: number // ticks remaining frozen
  color: string
  cellId: CellState
}

interface ActiveEffect {
  type: PowerUpType
  remaining: number
}

interface GameScreenProps {
  settings: GameSettings
  phase: GamePhase
  onPhaseChange: (p: GamePhase) => void
  onGameEnd: (result: 'win' | 'loss', playerTiles: number, botTiles: number, durationMs: number, replayFrames: ReplayFrame[], powerUpsUsed: number) => void
}

export default function GameScreen({ settings, phase, onPhaseChange, onGameEnd }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<{
    grid: CellState[][]
    playerPos: Position
    playerDir: Direction
    nextPlayerDir: Direction
    playerTiles: number
    playerAlive: boolean
    bots: BotState[]
    gameOver: boolean
    startTime: number
    tickCount: number
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }>
    crashPos: Position | null
    powerUps: PowerUp[]
    activeEffects: ActiveEffect[]
    phaseWalkUsed: boolean
    abilityReady: boolean
    abilityUsed: boolean
    replayFrames: ReplayFrame[]
    powerUpsUsed: number
    shrinkLevel: number // how many layers have been shrunk
    shrinkTimer: number // ticks until next shrink
    crumblingTiles: Set<string> // tiles that will disappear after stepped on
    playerSpeed: number // 1 = normal, 2 = double
    ghostMode: boolean
  } | null>(null)
  const [countdown, setCountdown] = useState(3)
  const [playerTilesDisplay, setPlayerTilesDisplay] = useState(0)
  const [botTilesDisplay, setBotTilesDisplay] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [activeEffectDisplay, setActiveEffectDisplay] = useState<ActiveEffect[]>([])
  const [abilityReady, setAbilityReady] = useState(true)
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const renderRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const gridSize = GRID_SIZES[settings?.gridSize ?? 'medium'] ?? 25
  const speedMs = SPEED_MS[settings?.matchSpeed ?? 'normal'] ?? 160
  const playerColor = COLOR_HEX[settings?.playerColor ?? 'cyan'] ?? '#00ffff'
  const themeColors = THEME_BG[settings?.arenaTheme ?? 'dark-void'] ?? THEME_BG['dark-void']
  const botCount = Math.min(settings?.botCount ?? 1, 3)
  const ability = settings?.ability ?? 'none'
  const powerUpsEnabled = settings?.powerUpsEnabled !== false
  const dynamicEvents = settings?.dynamicEvents === true

  const initGame = useCallback(() => {
    const grid: CellState[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))
    const obstacles = generateObstacles(gridSize)
    for (const obs of obstacles) grid[obs.y][obs.x] = 3

    const center = Math.floor(gridSize / 2)
    const playerPos: Position = { x: 1, y: center }
    grid[playerPos.y][playerPos.x] = 1

    // Spawn bots at different positions
    const botSpawns: Position[] = [
      { x: gridSize - 2, y: center },
      { x: center, y: 1 },
      { x: center, y: gridSize - 2 },
    ]
    const bots: BotState[] = []
    const botCellIds: CellState[] = [2, 4, 5]
    for (let i = 0; i < botCount; i++) {
      const sp = botSpawns[i]
      if (grid[sp.y]?.[sp.x] !== undefined) grid[sp.y][sp.x] = botCellIds[i]
      bots.push({
        pos: { ...sp },
        dir: i === 0 ? 'left' : i === 1 ? 'down' : 'up',
        tiles: 1,
        alive: true,
        frozen: 0,
        color: BOT_COLORS[i] ?? '#ff3366',
        cellId: botCellIds[i],
      })
    }

    // Add some crumbling tiles for dynamic events
    const crumblingTiles = new Set<string>()
    if (dynamicEvents) {
      const numCrumbling = Math.floor(gridSize * gridSize * 0.03)
      for (let i = 0; i < numCrumbling; i++) {
        const rx = 3 + Math.floor(Math.random() * (gridSize - 6))
        const ry = 3 + Math.floor(Math.random() * (gridSize - 6))
        if (grid[ry]?.[rx] === 0) crumblingTiles.add(`${rx},${ry}`)
      }
    }

    gameRef.current = {
      grid,
      playerPos,
      playerDir: 'right',
      nextPlayerDir: 'right',
      playerTiles: 1,
      playerAlive: true,
      bots,
      gameOver: false,
      startTime: Date.now(),
      tickCount: 0,
      particles: [],
      crashPos: null,
      powerUps: [],
      activeEffects: [],
      phaseWalkUsed: false,
      abilityReady: ability !== 'none',
      abilityUsed: false,
      replayFrames: [],
      powerUpsUsed: 0,
      shrinkLevel: 0,
      shrinkTimer: dynamicEvents ? 80 : 99999,
      crumblingTiles,
      playerSpeed: 1,
      ghostMode: false,
    }
    setPlayerTilesDisplay(1)
    setBotTilesDisplay(1)
    setElapsed(0)
    setActiveEffectDisplay([])
    setAbilityReady(ability !== 'none')
  }, [gridSize, botCount, ability, powerUpsEnabled, dynamicEvents])

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return
    initGame()
    setCountdown(3)
    const steps = [
      { delay: 0, val: 3 },
      { delay: 1000, val: 2 },
      { delay: 2000, val: 1 },
      { delay: 3000, val: 0 },
    ]
    const timers = steps.map(s =>
      setTimeout(() => {
        setCountdown(s.val)
        if (s.val > 0) playCountdownBeep()
        if (s.val === 0) { playGoBeep(); onPhaseChange?.('playing') }
      }, s.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [phase, initGame, onPhaseChange])

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return
    const game = gameRef.current
    if (!game) return

    startHum()
    game.startTime = Date.now()

    timerRef.current = setInterval(() => {
      if (gameRef.current && !gameRef.current.gameOver) {
        setElapsed(Date.now() - (gameRef.current?.startTime ?? Date.now()))
      }
    }, 100)

    const tick = () => {
      const g = gameRef.current
      if (!g || g.gameOver) return
      g.tickCount++

      // Update active effects
      g.activeEffects = g.activeEffects.map(e => ({ ...e, remaining: e.remaining - 1 })).filter(e => e.remaining > 0)
      // Check for expired speed boost
      if (!g.activeEffects.find(e => e.type === 'speed')) g.playerSpeed = 1
      if (!g.activeEffects.find(e => e.type === 'ghost')) g.ghostMode = false
      // Update frozen bots
      for (const bot of g.bots) {
        if (bot.frozen > 0) bot.frozen--
      }
      setActiveEffectDisplay([...g.activeEffects])

      // Spawn power-ups periodically
      if (powerUpsEnabled && g.tickCount % 30 === 0 && g.powerUps.length < 3) {
        const types: PowerUpType[] = ['speed', 'phase', 'bomb', 'freeze', 'ghost']
        const type = types[Math.floor(Math.random() * types.length)]
        // Find empty cell
        for (let attempt = 0; attempt < 20; attempt++) {
          const rx = 2 + Math.floor(Math.random() * (gridSize - 4))
          const ry = 2 + Math.floor(Math.random() * (gridSize - 4))
          if (g.grid?.[ry]?.[rx] === 0) {
            g.powerUps.push({ type, pos: { x: rx, y: ry }, spawnTime: g.tickCount })
            break
          }
        }
      }

      // Dynamic events: shrinking zone
      if (dynamicEvents) {
        g.shrinkTimer--
        if (g.shrinkTimer <= 0 && g.shrinkLevel < Math.floor(gridSize / 4)) {
          g.shrinkLevel++
          g.shrinkTimer = 60
          playZoneShrink()
          // Fill border with obstacles
          const sl = g.shrinkLevel
          for (let i = sl - 1; i < gridSize - (sl - 1); i++) {
            if (g.grid[sl - 1]?.[i] === 0) g.grid[sl - 1][i] = 3
            if (g.grid[gridSize - sl]?.[i] === 0) g.grid[gridSize - sl][i] = 3
            if (g.grid[i]?.[sl - 1] === 0) g.grid[i][sl - 1] = 3
            if (g.grid[i]?.[gridSize - sl] === 0) g.grid[i][gridSize - sl] = 3
          }
        }
      }

      // Player move
      g.playerDir = g.nextPlayerDir
      const dx: Record<Direction, number> = { up: 0, down: 0, left: -1, right: 1 }
      const dy: Record<Direction, number> = { up: -1, down: 1, left: 0, right: 0 }

      const newPX = g.playerPos.x + (dx[g.playerDir] ?? 0)
      const newPY = g.playerPos.y + (dy[g.playerDir] ?? 0)

      // Check player collision
      let playerCrash = newPX < 0 || newPX >= gridSize || newPY < 0 || newPY >= gridSize || (g.grid?.[newPY]?.[newPX] ?? 1) !== 0

      // Phase walk: pass through one wall
      if (playerCrash && g.activeEffects.find(e => e.type === 'phase') && !g.phaseWalkUsed) {
        const cellVal = g.grid?.[newPY]?.[newPX]
        if (newPX >= 0 && newPX < gridSize && newPY >= 0 && newPY < gridSize && cellVal !== 3) {
          playerCrash = false
          g.phaseWalkUsed = true
        }
      }

      // Move bots
      const botMoves: { botIdx: number; nx: number; ny: number; crash: boolean }[] = []
      for (let bi = 0; bi < g.bots.length; bi++) {
        const bot = g.bots[bi]
        if (!bot.alive) { botMoves.push({ botIdx: bi, nx: bot.pos.x, ny: bot.pos.y, crash: false }); continue }
        const isFrozen = bot.frozen > 0
        const isGhost = g.ghostMode
        const newBotDir = getBotMove(bot.pos, bot.dir, isGhost ? { x: -1, y: -1 } : g.playerPos, gridSize, g.grid, settings?.difficulty ?? 'medium', settings?.botStyle ?? 'aggressive', isFrozen)
        bot.dir = newBotDir
        const nbx = bot.pos.x + (dx[bot.dir] ?? 0)
        const nby = bot.pos.y + (dy[bot.dir] ?? 0)
        const botCrash = nbx < 0 || nbx >= gridSize || nby < 0 || nby >= gridSize || (g.grid?.[nby]?.[nbx] ?? 1) !== 0
        botMoves.push({ botIdx: bi, nx: nbx, ny: nby, crash: botCrash })
      }

      // Head-on collisions between player and bots
      for (const bm of botMoves) {
        if (!g.bots[bm.botIdx].alive) continue
        if (newPX === bm.nx && newPY === bm.ny && !playerCrash && !bm.crash) {
          // Both collide head-on
          playerCrash = true
          bm.crash = true
        }
      }

      // Resolve crashes
      if (playerCrash) {
        g.gameOver = true
        g.crashPos = { x: g.playerPos.x, y: g.playerPos.y }
        spawnCrashParticles(g.playerPos.x, g.playerPos.y, playerColor)
        playCrashSound()
        stopHum()
        const dur = Date.now() - g.startTime
        setElapsed(dur)
        const totalBotTiles = g.bots.reduce((s, b) => s + b.tiles, 0)
        setTimeout(() => onGameEnd?.('loss', g.playerTiles, totalBotTiles, dur, g.replayFrames, g.powerUpsUsed), 1200)
        return
      }

      // Move player
      g.playerPos = { x: newPX, y: newPY }
      if (g.grid?.[newPY]) g.grid[newPY][newPX] = 1
      g.playerTiles++
      setPlayerTilesDisplay(g.playerTiles)
      playStepTick()

      // Handle crumbling tiles (player steps on crumbling)
      if (dynamicEvents) {
        const crumbKey = `${newPX},${newPY}`
        if (g.crumblingTiles.has(crumbKey)) {
          g.crumblingTiles.delete(crumbKey)
          // Tile will crumble behind player after a delay (just mark as crumbling effect)
          setTimeout(() => {
            const gg = gameRef.current
            if (gg && !gg.gameOver && gg.grid[newPY]?.[newPX] === 1) {
              // Only crumble if player isn't currently standing there
              if (gg.playerPos.x !== newPX || gg.playerPos.y !== newPY) {
                gg.grid[newPY][newPX] = 0
                gg.playerTiles = Math.max(0, gg.playerTiles - 1)
              }
            }
          }, speedMs * 5)
        }
      }

      // Check power-up pickup
      const pickedUp = g.powerUps.findIndex(p => p.pos.x === newPX && p.pos.y === newPY)
      if (pickedUp >= 0) {
        const pu = g.powerUps[pickedUp]
        g.powerUps.splice(pickedUp, 1)
        g.powerUpsUsed++
        playPowerUp()
        applyPowerUp(pu.type)
      }

      // Resolve bot moves
      let anyBotDied = false
      for (const bm of botMoves) {
        const bot = g.bots[bm.botIdx]
        if (!bot.alive) continue
        if (bm.crash) {
          bot.alive = false
          anyBotDied = true
          spawnCrashParticles(bot.pos.x, bot.pos.y, bot.color)
        } else {
          bot.pos = { x: bm.nx, y: bm.ny }
          if (g.grid?.[bm.ny]) g.grid[bm.ny][bm.nx] = bot.cellId
          bot.tiles++
        }
      }

      const totalBotTiles = g.bots.reduce((s, b) => s + b.tiles, 0)
      setBotTilesDisplay(totalBotTiles)

      // Check if all bots dead
      if (g.bots.every(b => !b.alive)) {
        g.gameOver = true
        playCrashSound()
        stopHum()
        const dur = Date.now() - g.startTime
        setElapsed(dur)
        setTimeout(() => onGameEnd?.('win', g.playerTiles, totalBotTiles, dur, g.replayFrames, g.powerUpsUsed), 1200)
        return
      }

      // Tension check
      const playerMoves = ['up', 'down', 'left', 'right'].filter(d => {
        const nx = g.playerPos.x + (dx[d as Direction] ?? 0)
        const ny = g.playerPos.y + (dy[d as Direction] ?? 0)
        return nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && (g.grid?.[ny]?.[nx] ?? 1) === 0
      })
      if (playerMoves.length <= 1 && Math.random() < 0.3) playTensionRise()

      // Record replay frame (every 2nd tick to save memory)
      if (g.tickCount % 2 === 0) {
        g.replayFrames.push({
          playerPositions: [{ ...g.playerPos }],
          botPositions: [g.bots.map(b => ({ ...b.pos }))],
          grid: g.grid.map(row => [...row]),
          tick: g.tickCount,
        })
        // Cap replay frames
        if (g.replayFrames.length > 500) g.replayFrames.shift()
      }
    }

    tickIntervalRef.current = setInterval(tick, speedMs)

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      stopHum()
    }
  }, [phase, gridSize, speedMs, playerColor, settings, onGameEnd, powerUpsEnabled, dynamicEvents, ability])

  function applyPowerUp(type: PowerUpType) {
    const g = gameRef.current
    if (!g) return
    g.activeEffects.push({ type, remaining: POWERUP_DURATION_TICKS })
    switch (type) {
      case 'speed': g.playerSpeed = 2; break
      case 'phase': g.phaseWalkUsed = false; break
      case 'freeze':
        for (const bot of g.bots) { if (bot.alive) bot.frozen = POWERUP_DURATION_TICKS }
        break
      case 'ghost': g.ghostMode = true; break
      case 'bomb':
        // Erase a 3x3 area of nearest bot's trail
        const nearestBot = g.bots.filter(b => b.alive).sort((a, b) =>
          (Math.abs(a.pos.x - g.playerPos.x) + Math.abs(a.pos.y - g.playerPos.y)) -
          (Math.abs(b.pos.x - g.playerPos.x) + Math.abs(b.pos.y - g.playerPos.y))
        )[0]
        if (nearestBot) {
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const tx = nearestBot.pos.x + dx
              const ty = nearestBot.pos.y + dy
              if (tx >= 0 && tx < gridSize && ty >= 0 && ty < gridSize) {
                const c = g.grid[ty]?.[tx]
                if (c === nearestBot.cellId && !(tx === nearestBot.pos.x && ty === nearestBot.pos.y)) {
                  g.grid[ty][tx] = 0
                  nearestBot.tiles = Math.max(1, nearestBot.tiles - 1)
                  spawnCrashParticles(tx, ty, nearestBot.color)
                }
              }
            }
          }
        }
        break
    }
  }

  // Use ability
  function useAbility() {
    const g = gameRef.current
    if (!g || g.gameOver || g.abilityUsed || !g.abilityReady || phase !== 'playing') return
    g.abilityUsed = true
    g.abilityReady = false
    setAbilityReady(false)
    playAbility()

    const dxMap: Record<Direction, number> = { up: 0, down: 0, left: -1, right: 1 }
    const dyMap: Record<Direction, number> = { up: -1, down: 1, left: 0, right: 0 }

    switch (ability) {
      case 'dash': {
        // Jump 3 tiles forward
        for (let i = 0; i < 3; i++) {
          const nx = g.playerPos.x + dxMap[g.playerDir]
          const ny = g.playerPos.y + dyMap[g.playerDir]
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && g.grid[ny]?.[nx] === 0) {
            g.playerPos = { x: nx, y: ny }
            g.grid[ny][nx] = 1
            g.playerTiles++
          } else break
        }
        setPlayerTilesDisplay(g.playerTiles)
        break
      }
      case 'wall': {
        // Place 3-tile wall perpendicular to direction
        const perpDx = dxMap[g.playerDir] === 0 ? 1 : 0
        const perpDy = dyMap[g.playerDir] === 0 ? 1 : 0
        for (let i = -1; i <= 1; i++) {
          const wx = g.playerPos.x + dxMap[g.playerDir] * 2 + perpDx * i
          const wy = g.playerPos.y + dyMap[g.playerDir] * 2 + perpDy * i
          if (wx >= 0 && wx < gridSize && wy >= 0 && wy < gridSize && g.grid[wy]?.[wx] === 0) {
            g.grid[wy][wx] = 1
            g.playerTiles++
          }
        }
        setPlayerTilesDisplay(g.playerTiles)
        break
      }
      case 'reverse': {
        // Force all bots to reverse direction
        const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }
        for (const bot of g.bots) {
          if (bot.alive) bot.dir = opposite[bot.dir]
        }
        break
      }
    }
  }

  const spawnCrashParticles = (gx: number, gy: number, color: string) => {
    const g = gameRef.current
    if (!g) return
    for (let i = 0; i < 25; i++) {
      const angle = (Math.PI * 2 * i) / 25
      const speed = 1 + Math.random() * 4
      g.particles.push({
        x: gx, y: gy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? color : '#ffffff', life: 60 + Math.random() * 30, size: 2 + Math.random() * 3,
      })
    }
  }

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const g = gameRef.current
      if (!g || g.gameOver || phase !== 'playing') return
      const key = e.key?.toLowerCase?.()
      const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }
      let dir: Direction | null = null
      if (key === 'arrowup' || key === 'w') dir = 'up'
      if (key === 'arrowdown' || key === 's') dir = 'down'
      if (key === 'arrowleft' || key === 'a') dir = 'left'
      if (key === 'arrowright' || key === 'd') dir = 'right'
      if (dir && dir !== opposite[g.playerDir]) { g.nextPlayerDir = dir; e.preventDefault() }
      // Space = use ability
      if (key === ' ' || key === 'space') { e.preventDefault(); useAbility() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, ability])

  // Touch controls
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches?.[0]
      if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }
    const handleTouchEnd = (e: TouchEvent) => {
      const g = gameRef.current
      if (!g || g.gameOver || phase !== 'playing' || !touchStartRef.current) return
      const touch = e.changedTouches?.[0]
      if (!touch) return
      const ddx = touch.clientX - touchStartRef.current.x
      const ddy = touch.clientY - touchStartRef.current.y
      const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }
      if (Math.abs(ddx) < 15 && Math.abs(ddy) < 15) return
      let dir: Direction
      if (Math.abs(ddx) > Math.abs(ddy)) { dir = ddx > 0 ? 'right' : 'left' }
      else { dir = ddy > 0 ? 'down' : 'up' }
      if (dir !== opposite[g.playerDir]) g.nextPlayerDir = dir
      touchStartRef.current = null
    }
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [phase])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    let time = 0

    const draw = () => {
      time += 0.02
      ctx.fillStyle = themeColors?.bg ?? '#050510'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const game = gameRef.current
      const maxDim = Math.min(canvas.width - 20, canvas.height - 80)
      const cellSize = Math.floor(maxDim / gridSize)
      const totalW = cellSize * gridSize
      const totalH = cellSize * gridSize
      const offsetX = Math.floor((canvas.width - totalW) / 2)
      const offsetY = Math.floor((canvas.height - totalH) / 2) + 20

      // Grid lines
      ctx.strokeStyle = themeColors?.grid ?? '#0a0a2e'
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.3 + Math.sin(time) * 0.1
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath(); ctx.moveTo(offsetX + i * cellSize, offsetY); ctx.lineTo(offsetX + i * cellSize, offsetY + totalH); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(offsetX, offsetY + i * cellSize); ctx.lineTo(offsetX + totalW, offsetY + i * cellSize); ctx.stroke()
      }
      ctx.globalAlpha = 1

      if (!game) { renderRef.current = requestAnimationFrame(draw); return }

      // Draw crumbling tile indicators
      if (dynamicEvents) {
        for (const key of game.crumblingTiles) {
          const [cxs, cys] = key.split(',')
          const cx = parseInt(cxs), cy = parseInt(cys)
          const px = offsetX + cx * cellSize
          const py = offsetY + cy * cellSize
          ctx.globalAlpha = 0.15 + Math.sin(time * 3 + cx + cy) * 0.1
          ctx.fillStyle = '#ffaa00'
          ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4)
        }
        ctx.globalAlpha = 1
      }

      // Draw cells
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const cell = game.grid?.[y]?.[x] ?? 0
          if (cell === 0) continue
          const cx = offsetX + x * cellSize
          const cy = offsetY + y * cellSize
          if (cell === 3) {
            ctx.fillStyle = themeColors?.accent ?? '#1a1a4e'
            ctx.globalAlpha = 0.7 + Math.sin(time * 0.5 + x * 0.3 + y * 0.2) * 0.1
            ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2)
            ctx.globalAlpha = 1; continue
          }
          const isPlayerCell = cell === 1
          let color = playerColor
          let isHead = false
          if (isPlayerCell) {
            isHead = x === game.playerPos?.x && y === game.playerPos?.y
          } else {
            const bot = game.bots.find(b => b.cellId === cell)
            if (bot) {
              color = bot.color
              isHead = x === bot.pos?.x && y === bot.pos?.y && bot.alive
            }
          }

          // Trail effects
          const trailEffect = settings?.trailEffect ?? 'solid'
          ctx.globalAlpha = isHead ? 1 : 0.6 + Math.sin(time + x * 0.5 + y * 0.3) * 0.15
          ctx.fillStyle = color

          if (isPlayerCell && !isHead) {
            switch (trailEffect) {
              case 'dotted':
                ctx.beginPath()
                ctx.arc(cx + cellSize / 2, cy + cellSize / 2, cellSize / 3, 0, Math.PI * 2)
                ctx.fill()
                break
              case 'rainbow': {
                const hue = (time * 50 + x * 15 + y * 15) % 360
                ctx.fillStyle = `hsl(${hue}, 100%, 60%)`
                ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2)
                break
              }
              case 'particle':
                ctx.fillRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4)
                ctx.globalAlpha = 0.3
                ctx.fillRect(cx, cy, cellSize, cellSize)
                break
              case 'electric': {
                ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2)
                ctx.strokeStyle = color
                ctx.lineWidth = 1
                ctx.globalAlpha = 0.4 + Math.sin(time * 5 + x * 2) * 0.3
                ctx.beginPath()
                ctx.moveTo(cx, cy + cellSize / 2)
                ctx.lineTo(cx + cellSize / 3, cy + Math.random() * cellSize)
                ctx.lineTo(cx + cellSize * 2 / 3, cy + Math.random() * cellSize)
                ctx.lineTo(cx + cellSize, cy + cellSize / 2)
                ctx.stroke()
                break
              }
              default: ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2)
            }
          } else {
            ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2)
          }

          if (isHead) {
            ctx.shadowBlur = 20; ctx.shadowColor = color
            ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2)
            ctx.shadowBlur = 0
            // Ghost mode visual
            if (isPlayerCell && game.ghostMode) {
              ctx.globalAlpha = 0.3 + Math.sin(time * 4) * 0.2
              ctx.fillStyle = '#ffffff'
              ctx.fillRect(cx, cy, cellSize, cellSize)
            }
          }
        }
      }
      ctx.globalAlpha = 1

      // Draw power-ups
      for (const pu of (game.powerUps ?? [])) {
        const px = offsetX + pu.pos.x * cellSize
        const py = offsetY + pu.pos.y * cellSize
        const puColor = POWERUP_COLORS[pu.type] ?? '#fff'
        const pulse = 0.7 + Math.sin(time * 4 + pu.pos.x) * 0.3
        ctx.globalAlpha = pulse
        ctx.fillStyle = puColor
        ctx.shadowBlur = 12; ctx.shadowColor = puColor
        ctx.beginPath()
        ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
        ctx.fillStyle = '#000'
        ctx.font = `${Math.max(8, cellSize - 6)}px sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(POWERUP_ICONS[pu.type] ?? '?', px + cellSize / 2, py + cellSize / 2 + 1)
      }

      // Draw shrink zone border
      if (dynamicEvents && game.shrinkLevel > 0) {
        ctx.strokeStyle = '#ff440066'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        const sl = game.shrinkLevel
        ctx.strokeRect(
          offsetX + sl * cellSize, offsetY + sl * cellSize,
          (gridSize - sl * 2) * cellSize, (gridSize - sl * 2) * cellSize
        )
        ctx.setLineDash([])
      }

      // Particles
      const aliveParticles: typeof game.particles = []
      for (const p of (game.particles ?? [])) {
        p.x += (p.vx ?? 0) * 0.5; p.y += (p.vy ?? 0) * 0.5; p.life--
        if (p.life <= 0) continue
        aliveParticles.push(p)
        const alpha = Math.max(0, (p.life ?? 0) / 90)
        const ppx = offsetX + p.x * cellSize + cellSize / 2
        const ppy = offsetY + p.y * cellSize + cellSize / 2
        ctx.globalAlpha = alpha; ctx.fillStyle = p.color ?? '#fff'
        ctx.shadowBlur = 8; ctx.shadowColor = p.color ?? '#fff'
        ctx.beginPath(); ctx.arc(ppx, ppy, p.size ?? 2, 0, Math.PI * 2); ctx.fill()
      }
      game.particles = aliveParticles
      ctx.globalAlpha = 1; ctx.shadowBlur = 0

      // Border
      ctx.strokeStyle = themeColors?.accent ?? '#1a1a4e'
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.5 + Math.sin(time * 2) * 0.2
      ctx.strokeRect(offsetX - 1, offsetY - 1, totalW + 2, totalH + 2)
      ctx.globalAlpha = 1

      renderRef.current = requestAnimationFrame(draw)
    }
    renderRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(renderRef.current); window.removeEventListener('resize', resize) }
  }, [gridSize, playerColor, themeColors, dynamicEvents, settings?.trailEffect])

  const elapsedSec = ((elapsed ?? 0) / 1000).toFixed(1)
  const totalBotTilesHUD = botTilesDisplay

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* HUD */}
      {phase === 'playing' && (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: playerColor }} />
            <span className="text-xs font-mono text-gray-300">YOU</span>
            <span className="text-sm font-bold font-mono" style={{ color: playerColor }}>
              <Grid3X3 className="w-3 h-3 inline mr-1" />{playerTilesDisplay}
            </span>
          </div>

          {/* Active effects */}
          <div className="flex items-center gap-1">
            {activeEffectDisplay.map((e, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: POWERUP_COLORS[e.type] + '33', color: POWERUP_COLORS[e.type] }}>
                {POWERUP_ICONS[e.type]}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs font-mono text-gray-500">
            <Clock className="w-3 h-3" />{elapsedSec}s
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono" style={{ color: BOT_COLORS[0] }}>
              {totalBotTilesHUD}<Grid3X3 className="w-3 h-3 inline ml-1" />
            </span>
            <span className="text-xs font-mono text-gray-300">BOT{botCount > 1 ? 'S' : ''}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: botCount }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: BOT_COLORS[i] }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ability button */}
      {phase === 'playing' && ability !== 'none' && (
        <button
          onClick={useAbility}
          disabled={!abilityReady}
          className={`absolute bottom-20 right-4 z-10 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all ${
            abilityReady ? 'opacity-100 scale-100' : 'opacity-30 scale-90'
          }`}
          style={{
            borderColor: abilityReady ? playerColor : '#444',
            backgroundColor: abilityReady ? playerColor + '22' : '#11111188',
            color: abilityReady ? playerColor : '#666'
          }}
        >
          {ability === 'dash' ? <Zap className="w-6 h-6" /> : ability === 'wall' ? <Shield className="w-6 h-6" /> : <Ghost className="w-6 h-6" />}
        </button>
      )}

      {/* Countdown Overlay */}
      {phase === 'countdown' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <div key={countdown} className="text-8xl font-bold font-display countdown-pop"
            style={{ color: countdown === 0 ? '#00ff66' : playerColor, textShadow: `0 0 30px ${countdown === 0 ? '#00ff66' : playerColor}` }}>
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}

      {/* Mobile D-pad */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 md:hidden">
        <div className="grid grid-cols-3 gap-1 w-36">
          <div />
          <DPadButton label="▲" onClick={() => setDir('up')} color={playerColor} />
          <div />
          <DPadButton label="◀" onClick={() => setDir('left')} color={playerColor} />
          <div className="w-12 h-12" />
          <DPadButton label="▶" onClick={() => setDir('right')} color={playerColor} />
          <div />
          <DPadButton label="▼" onClick={() => setDir('down')} color={playerColor} />
          <div />
        </div>
      </div>
    </div>
  )

  function setDir(dir: Direction) {
    const g = gameRef.current
    if (!g || g.gameOver || phase !== 'playing') return
    const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }
    if (dir !== opposite[g.playerDir]) g.nextPlayerDir = dir
  }
}

function DPadButton({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick}
      className="w-12 h-12 flex items-center justify-center rounded-lg bg-black/60 border border-gray-700 text-lg font-bold active:scale-90 transition-transform"
      style={{ color, borderColor: color + '40' }}>
      {label}
    </button>
  )
}
