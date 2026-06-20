'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  GameSettings, DEFAULT_SETTINGS, GamePhase, GameResult, ReplayFrame,
  CampaignLevel, CAMPAIGN_LEVELS, getDailyChallenge, GRID_SIZES,
  COLOR_HEX, TRAIL_EFFECTS
} from '@/lib/game-types'
import { getStats, getRecentMatches, saveMatch, StoredStats, StoredMatch } from '@/lib/storage'
import HomeScreen from './home-screen'
import GameScreen from './game-screen'
import ResultScreen from './result-screen'
import CampaignScreen from './campaign-screen'
import StatsScreen from './stats-screen'
import ReplayViewer from './replay-viewer'

export default function GameApp() {
  const [phase, setPhase] = useState<GamePhase>('menu')
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [result, setResult] = useState<GameResult>(null)
  const [matchStats, setMatchStats] = useState({ playerTiles: 0, botTiles: 0, durationMs: 0 })
  const [stats, setStats] = useState<StoredStats | null>(null)
  const [recentMatches, setRecentMatches] = useState<StoredMatch[]>([])
  const [replayFrames, setReplayFrames] = useState<ReplayFrame[]>([])
  const [campaignLevel, setCampaignLevel] = useState<CampaignLevel | null>(null)
  const [newUnlock, setNewUnlock] = useState<string | null>(null)
  const [isDailyMatch, setIsDailyMatch] = useState(false)

  // Load stats from localStorage on mount
  const loadStats = useCallback(() => {
    setStats(getStats())
    setRecentMatches(getRecentMatches())
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const handleStart = useCallback((s: GameSettings) => {
    setSettings(s)
    setCampaignLevel(null)
    setIsDailyMatch(false)
    setPhase('countdown')
  }, [])

  const handleGameEnd = useCallback((res: 'win' | 'loss', playerTiles: number, botTiles: number, durationMs: number, frames: ReplayFrame[], powerUpsUsed: number) => {
    setResult(res)
    setMatchStats({ playerTiles, botTiles, durationMs })
    setReplayFrames(frames ?? [])
    setPhase('result')

    // Check for new trail unlock
    if (res === 'win') {
      const currentWins = (stats?.totalWins ?? 0) + 1
      const justUnlocked = TRAIL_EFFECTS.find(t => t.unlockWins === currentWins)
      setNewUnlock(justUnlocked ? `${justUnlocked.label} Trail` : null)
    } else {
      setNewUnlock(null)
    }

    // Check campaign objective
    let campaignCompleted = false
    if (campaignLevel) {
      const lvl = campaignLevel
      switch (lvl.objectiveType) {
        case 'win': campaignCompleted = res === 'win'; break
        case 'tiles': campaignCompleted = res === 'win' && playerTiles >= (lvl.objectiveValue ?? 0); break
        case 'speed': campaignCompleted = res === 'win' && durationMs <= (lvl.objectiveValue ?? 99999); break
        case 'survive': campaignCompleted = durationMs >= (lvl.objectiveValue ?? 0); break
      }
    }

    const daily = getDailyChallenge()

    // Save to localStorage
    const updatedStats = saveMatch({
      result: res,
      difficulty: settings?.difficulty ?? 'medium',
      gridSize: settings?.gridSize ?? 'medium',
      botStyle: settings?.botStyle ?? 'aggressive',
      matchSpeed: settings?.matchSpeed ?? 'normal',
      playerColor: settings?.playerColor ?? 'cyan',
      arenaTheme: settings?.arenaTheme ?? 'dark-void',
      playerTiles,
      botTiles,
      durationMs,
      botCount: settings?.botCount ?? 1,
      ability: settings?.ability ?? 'none',
      powerUpsUsed,
      campaignLevel: campaignCompleted ? (campaignLevel?.id ?? null) : null,
      isDaily: isDailyMatch,
      dailySeed: isDailyMatch ? daily.seed : null,
    })
    setStats(updatedStats)
    setRecentMatches(getRecentMatches())
  }, [settings, stats, campaignLevel, isDailyMatch])

  const handleReplay = useCallback(() => {
    setResult(null)
    setNewUnlock(null)
    setPhase('countdown')
  }, [])

  const handleChangeSettings = useCallback(() => {
    setResult(null)
    setCampaignLevel(null)
    setIsDailyMatch(false)
    setNewUnlock(null)
    setPhase('menu')
  }, [])

  const handleCampaignStart = useCallback((level: CampaignLevel) => {
    const lvlSettings: GameSettings = {
      ...DEFAULT_SETTINGS,
      ...level.settings,
      powerUpsEnabled: true,
      dynamicEvents: false,
      trailEffect: settings.trailEffect,
      playerColor: settings.playerColor,
    }
    setSettings(lvlSettings)
    setCampaignLevel(level)
    setIsDailyMatch(false)
    setPhase('countdown')
  }, [settings.trailEffect, settings.playerColor])

  const handleDailyStart = useCallback(() => {
    const daily = getDailyChallenge()
    setSettings({ ...daily.settings, trailEffect: settings.trailEffect, playerColor: settings.playerColor })
    setCampaignLevel(null)
    setIsDailyMatch(true)
    setPhase('countdown')
  }, [settings.trailEffect, settings.playerColor])

  const accentColor = COLOR_HEX[settings?.playerColor ?? 'cyan'] ?? '#00ffff'

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {phase === 'menu' && (
        <HomeScreen settings={settings} onSettingsChange={setSettings} onStart={handleStart}
          onCampaign={() => setPhase('campaign')} onStats={() => setPhase('stats')}
          onDaily={handleDailyStart} stats={stats} />
      )}
      {(phase === 'countdown' || phase === 'playing') && (
        <GameScreen settings={settings} phase={phase} onPhaseChange={setPhase} onGameEnd={handleGameEnd} />
      )}
      {phase === 'result' && result && (
        <ResultScreen result={result}
          playerTiles={matchStats?.playerTiles ?? 0} botTiles={matchStats?.botTiles ?? 0}
          durationMs={matchStats?.durationMs ?? 0} playerColor={settings?.playerColor ?? 'cyan'}
          onReplay={handleReplay} onChangeSettings={handleChangeSettings}
          onWatchReplay={replayFrames.length > 0 ? () => setPhase('replay') : undefined}
          streak={stats?.currentStreak ?? 0} bestStreak={stats?.bestStreak ?? 0}
          totalWins={stats?.totalWins ?? 0} newUnlock={newUnlock} />
      )}
      {phase === 'campaign' && (
        <CampaignScreen campaignLevel={stats?.campaignLevel ?? 0}
          onStartLevel={handleCampaignStart} onBack={() => setPhase('menu')} accentColor={accentColor} />
      )}
      {phase === 'stats' && (
        <StatsScreen stats={stats} recentMatches={recentMatches}
          onBack={() => setPhase('menu')} accentColor={accentColor} />
      )}
      {phase === 'replay' && (
        <ReplayViewer frames={replayFrames} gridSize={GRID_SIZES[settings?.gridSize ?? 'medium'] ?? 25}
          playerColor={settings?.playerColor ?? 'cyan'} arenaTheme={settings?.arenaTheme ?? 'dark-void'}
          botCount={settings?.botCount ?? 1} onBack={() => setPhase('result')} />
      )}
    </div>
  )
}
