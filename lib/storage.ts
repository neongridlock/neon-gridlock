// localStorage-based persistence for game stats and match history
// Replaces Prisma/DB for easy Vercel deployment

const STATS_KEY = 'neon_gridlock_stats'
const MATCHES_KEY = 'neon_gridlock_matches'
const MAX_MATCHES = 50

export interface StoredStats {
  totalWins: number
  totalLosses: number
  totalGames: number
  bestTime: number | null
  bestTiles: number | null
  currentStreak: number
  bestStreak: number
  totalTiles: number
  totalPlayTime: number
  campaignLevel: number
  dailyDate: string | null
  dailyWins: number
}

export interface StoredMatch {
  id: string
  result: string
  difficulty: string
  gridSize: string
  botStyle: string
  matchSpeed: string
  playerColor: string
  arenaTheme: string
  playerTiles: number
  botTiles: number
  durationMs: number
  botCount: number
  ability: string
  powerUpsUsed: number
  campaignLevel: number | null
  isDaily: boolean
  dailySeed: string | null
  createdAt: string
}

const DEFAULT_STATS: StoredStats = {
  totalWins: 0,
  totalLosses: 0,
  totalGames: 0,
  bestTime: null,
  bestTiles: null,
  currentStreak: 0,
  bestStreak: 0,
  totalTiles: 0,
  totalPlayTime: 0,
  campaignLevel: 0,
  dailyDate: null,
  dailyWins: 0,
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function getStats(): StoredStats {
  if (!isBrowser()) return { ...DEFAULT_STATS }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return { ...DEFAULT_STATS }
    return { ...DEFAULT_STATS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

export function getRecentMatches(): StoredMatch[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(MATCHES_KEY)
    if (!raw) return []
    return JSON.parse(raw) ?? []
  } catch {
    return []
  }
}

export function saveMatch(data: {
  result: string
  difficulty: string
  gridSize: string
  botStyle: string
  matchSpeed: string
  playerColor: string
  arenaTheme: string
  playerTiles: number
  botTiles: number
  durationMs: number
  botCount: number
  ability: string
  powerUpsUsed: number
  campaignLevel: number | null
  isDaily: boolean
  dailySeed: string | null
}): StoredStats {
  if (!isBrowser()) return { ...DEFAULT_STATS }

  const isWin = data.result === 'win'

  // Save match
  const match: StoredMatch = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ...data,
    createdAt: new Date().toISOString(),
  }
  const matches = getRecentMatches()
  matches.unshift(match)
  if (matches.length > MAX_MATCHES) matches.length = MAX_MATCHES
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches))

  // Update stats
  const current = getStats()
  const newStreak = isWin ? current.currentStreak + 1 : 0
  const newBestStreak = Math.max(current.bestStreak, newStreak)

  let newCampaignLevel = current.campaignLevel
  if (data.campaignLevel && data.campaignLevel > newCampaignLevel) {
    newCampaignLevel = data.campaignLevel
  }

  let dailyWins = current.dailyWins
  let dailyDate = current.dailyDate
  if (data.isDaily && isWin && data.dailySeed) {
    if (dailyDate !== data.dailySeed) {
      dailyWins++
      dailyDate = data.dailySeed
    }
  }

  let bestTime = current.bestTime
  let bestTiles = current.bestTiles
  if (isWin) {
    if (!bestTime || data.durationMs < bestTime) bestTime = data.durationMs
    if (!bestTiles || data.playerTiles > bestTiles) bestTiles = data.playerTiles
  }

  const updated: StoredStats = {
    totalWins: current.totalWins + (isWin ? 1 : 0),
    totalLosses: current.totalLosses + (isWin ? 0 : 1),
    totalGames: current.totalGames + 1,
    bestTime,
    bestTiles,
    currentStreak: newStreak,
    bestStreak: newBestStreak,
    totalTiles: current.totalTiles + data.playerTiles,
    totalPlayTime: current.totalPlayTime + data.durationMs,
    campaignLevel: newCampaignLevel,
    dailyDate,
    dailyWins,
  }

  localStorage.setItem(STATS_KEY, JSON.stringify(updated))
  return updated
}
