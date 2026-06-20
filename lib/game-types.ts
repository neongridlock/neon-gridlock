export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane'
export type GridSizeOption = 'small' | 'medium' | 'large'
export type BotStyle = 'aggressive' | 'defensive' | 'unpredictable'
export type MatchSpeed = 'slow' | 'normal' | 'fast'
export type PlayerColor = 'cyan' | 'pink' | 'green' | 'orange' | 'white'
export type ArenaTheme = 'dark-void' | 'cyber-city' | 'deep-space' | 'acid-rave'
export type Direction = 'up' | 'down' | 'left' | 'right'
export type GamePhase = 'menu' | 'countdown' | 'playing' | 'result' | 'campaign' | 'stats' | 'replay' | 'daily'
export type GameResult = 'win' | 'loss' | null
export type PowerUpType = 'speed' | 'phase' | 'bomb' | 'freeze' | 'ghost'
export type AbilityType = 'dash' | 'wall' | 'reverse' | 'none'
export type TrailEffect = 'solid' | 'dotted' | 'rainbow' | 'particle' | 'electric'
export type Rank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'neon-god'

export interface GameSettings {
  difficulty: Difficulty
  gridSize: GridSizeOption
  botStyle: BotStyle
  matchSpeed: MatchSpeed
  playerColor: PlayerColor
  arenaTheme: ArenaTheme
  ability: AbilityType
  botCount: number
  trailEffect: TrailEffect
  powerUpsEnabled: boolean
  dynamicEvents: boolean
}

export interface Position {
  x: number
  y: number
}

export interface PowerUp {
  type: PowerUpType
  pos: Position
  spawnTime: number
}

export interface ReplayFrame {
  playerPositions: Position[]
  botPositions: Position[][]
  grid: number[][]
  tick: number
}

export interface CampaignLevel {
  id: number
  name: string
  description: string
  settings: Partial<GameSettings>
  objective: string
  objectiveType: 'win' | 'survive' | 'tiles' | 'speed'
  objectiveValue?: number // seconds for survive, tile count for tiles, ms for speed
}

export const GRID_SIZES: Record<GridSizeOption, number> = {
  small: 20,
  medium: 25,
  large: 30,
}

export const SPEED_MS: Record<MatchSpeed, number> = {
  slow: 250,
  normal: 160,
  fast: 90,
}

export const COLOR_HEX: Record<PlayerColor, string> = {
  cyan: '#00ffff',
  pink: '#ff00ff',
  green: '#00ff66',
  orange: '#ff8800',
  white: '#ffffff',
}

export const BOT_COLOR = '#ff3366'
export const BOT_COLORS = ['#ff3366', '#ff6600', '#aa00ff']

export const THEME_BG: Record<ArenaTheme, { bg: string; grid: string; accent: string }> = {
  'dark-void': { bg: '#050510', grid: '#0a0a2e', accent: '#1a1a4e' },
  'cyber-city': { bg: '#0a0a14', grid: '#141428', accent: '#1e1e3c' },
  'deep-space': { bg: '#020210', grid: '#060620', accent: '#0a0a30' },
  'acid-rave': { bg: '#0a0510', grid: '#140a20', accent: '#1e0f30' },
}

export const POWERUP_COLORS: Record<PowerUpType, string> = {
  speed: '#ffff00',
  phase: '#00ffaa',
  bomb: '#ff4400',
  freeze: '#44aaff',
  ghost: '#aa88ff',
}

export const POWERUP_ICONS: Record<PowerUpType, string> = {
  speed: '⚡',
  phase: '🛡',
  bomb: '💣',
  freeze: '🧊',
  ghost: '👻',
}

export const POWERUP_DURATION_TICKS = 20 // how many ticks a power-up effect lasts

export const RANK_THRESHOLDS: { rank: Rank; wins: number; color: string; label: string }[] = [
  { rank: 'bronze', wins: 0, color: '#cd7f32', label: 'Bronze' },
  { rank: 'silver', wins: 5, color: '#c0c0c0', label: 'Silver' },
  { rank: 'gold', wins: 15, color: '#ffd700', label: 'Gold' },
  { rank: 'platinum', wins: 30, color: '#e5e4e2', label: 'Platinum' },
  { rank: 'diamond', wins: 60, color: '#b9f2ff', label: 'Diamond' },
  { rank: 'neon-god', wins: 100, color: '#ff00ff', label: 'Neon God' },
]

export function getRank(totalWins: number): typeof RANK_THRESHOLDS[0] {
  let current = RANK_THRESHOLDS[0]
  for (const r of RANK_THRESHOLDS) {
    if (totalWins >= r.wins) current = r
  }
  return current
}

export function getNextRank(totalWins: number): typeof RANK_THRESHOLDS[0] | null {
  for (const r of RANK_THRESHOLDS) {
    if (totalWins < r.wins) return r
  }
  return null
}

export const TRAIL_EFFECTS: { value: TrailEffect; label: string; unlockWins: number }[] = [
  { value: 'solid', label: 'Solid', unlockWins: 0 },
  { value: 'dotted', label: 'Dotted', unlockWins: 5 },
  { value: 'rainbow', label: 'Rainbow', unlockWins: 15 },
  { value: 'particle', label: 'Particle', unlockWins: 30 },
  { value: 'electric', label: 'Electric', unlockWins: 50 },
]

export const CAMPAIGN_LEVELS: CampaignLevel[] = [
  { id: 1, name: 'First Steps', description: 'Win your first match', settings: { difficulty: 'easy', gridSize: 'small', botCount: 1 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 2, name: 'Paint Master', description: 'Claim 80+ tiles in a win', settings: { difficulty: 'easy', gridSize: 'small', botCount: 1 }, objective: 'Win with 80+ tiles', objectiveType: 'tiles', objectiveValue: 80 },
  { id: 3, name: 'Speed Demon', description: 'Win in under 15 seconds', settings: { difficulty: 'easy', gridSize: 'small', matchSpeed: 'fast', botCount: 1 }, objective: 'Win in <15s', objectiveType: 'speed', objectiveValue: 15000 },
  { id: 4, name: 'Medium Heat', description: 'Beat a medium bot', settings: { difficulty: 'medium', gridSize: 'small', botCount: 1 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 5, name: 'Defensive Wall', description: 'Beat a defensive bot', settings: { difficulty: 'medium', gridSize: 'small', botStyle: 'defensive', botCount: 1 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 6, name: 'Wider Arena', description: 'Win on a 25×25 grid', settings: { difficulty: 'medium', gridSize: 'medium', botCount: 1 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 7, name: 'Survive the Chaos', description: 'Survive 30 seconds vs unpredictable bot', settings: { difficulty: 'medium', botStyle: 'unpredictable', gridSize: 'medium', botCount: 1 }, objective: 'Survive 30s', objectiveType: 'survive', objectiveValue: 30000 },
  { id: 8, name: 'Double Trouble', description: 'Beat 2 bots at once', settings: { difficulty: 'easy', gridSize: 'medium', botCount: 2 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 9, name: 'Hard Mode', description: 'Beat a hard bot', settings: { difficulty: 'hard', gridSize: 'medium', botCount: 1 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 10, name: 'Tile Domination', description: 'Claim 150+ tiles', settings: { difficulty: 'medium', gridSize: 'medium', botCount: 1 }, objective: 'Win with 150+ tiles', objectiveType: 'tiles', objectiveValue: 150 },
  { id: 11, name: 'Grand Arena', description: 'Win on the 30×30 grid', settings: { difficulty: 'medium', gridSize: 'large', botCount: 1 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 12, name: 'Speed Run', description: 'Win fast match in under 10s', settings: { difficulty: 'medium', gridSize: 'small', matchSpeed: 'fast', botCount: 1 }, objective: 'Win in <10s', objectiveType: 'speed', objectiveValue: 10000 },
  { id: 13, name: 'Outnumbered', description: 'Beat 3 bots at once', settings: { difficulty: 'easy', gridSize: 'large', botCount: 3 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 14, name: 'Aggressive Hunter', description: 'Beat a hard aggressive bot', settings: { difficulty: 'hard', gridSize: 'medium', botStyle: 'aggressive', botCount: 1 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 15, name: 'Marathon', description: 'Survive 60 seconds vs hard bot', settings: { difficulty: 'hard', gridSize: 'large', botCount: 1 }, objective: 'Survive 60s', objectiveType: 'survive', objectiveValue: 60000 },
  { id: 16, name: 'Cyber Gauntlet', description: 'Beat 2 hard bots', settings: { difficulty: 'hard', gridSize: 'large', botCount: 2, arenaTheme: 'cyber-city' }, objective: 'Win the match', objectiveType: 'win' },
  { id: 17, name: 'Insane Intro', description: 'Beat an insane bot', settings: { difficulty: 'insane', gridSize: 'medium', botCount: 1 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 18, name: 'Acid Trial', description: 'Win with 200+ tiles on insane', settings: { difficulty: 'insane', gridSize: 'large', botCount: 1, arenaTheme: 'acid-rave' }, objective: 'Win with 200+ tiles', objectiveType: 'tiles', objectiveValue: 200 },
  { id: 19, name: 'Triple Insanity', description: 'Beat 3 insane bots', settings: { difficulty: 'insane', gridSize: 'large', botCount: 3 }, objective: 'Win the match', objectiveType: 'win' },
  { id: 20, name: 'Neon God', description: 'Beat 3 insane bots in under 30s', settings: { difficulty: 'insane', gridSize: 'large', botCount: 3, matchSpeed: 'fast' }, objective: 'Win in <30s', objectiveType: 'speed', objectiveValue: 30000 },
]

// Generate daily challenge settings from date seed
export function getDailyChallenge(): { settings: GameSettings; seed: string; description: string } {
  const now = new Date()
  const seed = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  // Simple hash from seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  hash = Math.abs(hash)

  const difficulties: Difficulty[] = ['medium', 'hard', 'insane']
  const grids: GridSizeOption[] = ['small', 'medium', 'large']
  const bots: BotStyle[] = ['aggressive', 'defensive', 'unpredictable']
  const speeds: MatchSpeed[] = ['normal', 'fast']
  const themes: ArenaTheme[] = ['dark-void', 'cyber-city', 'deep-space', 'acid-rave']

  const settings: GameSettings = {
    difficulty: difficulties[hash % difficulties.length],
    gridSize: grids[(hash >> 3) % grids.length],
    botStyle: bots[(hash >> 6) % bots.length],
    matchSpeed: speeds[(hash >> 9) % speeds.length],
    playerColor: 'cyan',
    arenaTheme: themes[(hash >> 12) % themes.length],
    ability: 'none',
    botCount: 1 + ((hash >> 15) % 2),
    trailEffect: 'solid',
    powerUpsEnabled: true,
    dynamicEvents: true,
  }

  const desc = `${settings.difficulty.toUpperCase()} | ${GRID_SIZES[settings.gridSize]}×${GRID_SIZES[settings.gridSize]} | ${settings.botCount} bot${settings.botCount > 1 ? 's' : ''} | ${settings.botStyle}`
  return { settings, seed, description: desc }
}

// Generate center obstacle pattern based on grid size
export function generateObstacles(gridSize: number): Position[] {
  const obstacles: Position[] = []
  const center = Math.floor(gridSize / 2)

  if (gridSize <= 20) {
    for (let i = -2; i <= 2; i++) {
      obstacles.push({ x: center + i, y: center })
      obstacles.push({ x: center, y: center + i })
    }
    const off = 5
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        obstacles.push({ x: center - off + dx, y: center - off + dy })
        obstacles.push({ x: center + off - 1 + dx, y: center - off + dy })
        obstacles.push({ x: center - off + dx, y: center + off - 1 + dy })
        obstacles.push({ x: center + off - 1 + dx, y: center + off - 1 + dy })
      }
    }
  } else if (gridSize <= 25) {
    for (let i = -3; i <= 3; i++) {
      const w = 3 - Math.abs(i)
      for (let j = -w; j <= w; j++) {
        obstacles.push({ x: center + j, y: center + i })
      }
    }
    const arm = 6
    for (let i = 0; i < 4; i++) {
      obstacles.push({ x: center - arm, y: center - arm + i })
      obstacles.push({ x: center + arm, y: center - arm + i })
      obstacles.push({ x: center - arm, y: center + arm - i })
      obstacles.push({ x: center + arm, y: center + arm - i })
    }
    for (let i = 0; i < 3; i++) {
      obstacles.push({ x: center - arm + i, y: center - arm })
      obstacles.push({ x: center + arm - i, y: center - arm })
      obstacles.push({ x: center - arm + i, y: center + arm })
      obstacles.push({ x: center + arm - i, y: center + arm })
    }
  } else {
    const r = 4
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const dist = Math.sqrt(x * x + y * y)
        if (dist >= r - 0.5 && dist <= r + 0.5) {
          obstacles.push({ x: center + x, y: center + y })
        }
      }
    }
    for (let i = r + 1; i <= r + 3; i++) {
      obstacles.push({ x: center + i, y: center })
      obstacles.push({ x: center - i, y: center })
      obstacles.push({ x: center, y: center + i })
      obstacles.push({ x: center, y: center - i })
    }
    const pillarOff = 8
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
          obstacles.push({ x: center + sx * pillarOff + dx * sx, y: center + sy * pillarOff + dy * sy })
        }
      }
    }
  }

  return obstacles.filter(p =>
    p.x >= 0 && p.x < gridSize && p.y >= 0 && p.y < gridSize &&
    !(p.x <= 3 && Math.abs(p.y - center) <= 1) &&
    !(p.x >= gridSize - 4 && Math.abs(p.y - center) <= 1)
  )
}

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  gridSize: 'medium',
  botStyle: 'aggressive',
  matchSpeed: 'normal',
  playerColor: 'cyan',
  arenaTheme: 'dark-void',
  ability: 'none',
  botCount: 1,
  trailEffect: 'solid',
  powerUpsEnabled: true,
  dynamicEvents: false,
}
