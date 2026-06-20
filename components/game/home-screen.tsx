'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GameSettings, DEFAULT_SETTINGS, COLOR_HEX, PlayerColor, Difficulty,
  GridSizeOption, BotStyle, MatchSpeed, ArenaTheme, AbilityType, TrailEffect,
  TRAIL_EFFECTS, getRank, getNextRank
} from '@/lib/game-types'
import NeonGridBg from './neon-grid-bg'
import { Play, Settings, Trophy, Zap, Shield, Shuffle, ChevronDown, ChevronUp,
  Grid3X3, Gauge, Palette, Monitor, Swords, Ghost, Users, Sparkles, Star,
  Calendar, BarChart3, Target } from 'lucide-react'

interface HomeScreenProps {
  settings: GameSettings
  onSettingsChange: (s: GameSettings) => void
  onStart: (s: GameSettings) => void
  onCampaign: () => void
  onStats: () => void
  onDaily: () => void
  stats: any
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'insane', label: 'Insane' },
]

const GRID_OPTIONS: { value: GridSizeOption; label: string; size: string }[] = [
  { value: 'small', label: 'Small', size: '20×20' },
  { value: 'medium', label: 'Medium', size: '25×25' },
  { value: 'large', label: 'Large', size: '30×30' },
]

const BOT_STYLES: { value: BotStyle; label: string }[] = [
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'defensive', label: 'Defensive' },
  { value: 'unpredictable', label: 'Unpredictable' },
]

const SPEEDS: { value: MatchSpeed; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
]

const ABILITIES: { value: AbilityType; label: string; icon: any; desc: string }[] = [
  { value: 'none', label: 'None', icon: null, desc: 'No ability' },
  { value: 'dash', label: 'Dash', icon: Zap, desc: 'Jump 3 tiles forward' },
  { value: 'wall', label: 'Wall Drop', icon: Shield, desc: 'Place a 3-tile wall' },
  { value: 'reverse', label: 'Reverse', icon: Ghost, desc: 'Reverse bot direction' },
]

const COLORS: PlayerColor[] = ['cyan', 'pink', 'green', 'orange', 'white']
const THEMES: { value: ArenaTheme; label: string }[] = [
  { value: 'dark-void', label: 'Dark Void' },
  { value: 'cyber-city', label: 'Cyber City' },
  { value: 'deep-space', label: 'Deep Space' },
  { value: 'acid-rave', label: 'Acid Rave' },
]

export default function HomeScreen({ settings, onSettingsChange, onStart, onCampaign, onStats, onDaily, stats }: HomeScreenProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const accentColor = COLOR_HEX[settings?.playerColor ?? 'cyan'] ?? '#00ffff'
  const totalWins = stats?.totalWins ?? 0
  const rank = getRank(totalWins)
  const nextRank = getNextRank(totalWins)
  const streak = stats?.currentStreak ?? 0
  const bestStreak = stats?.bestStreak ?? 0

  const update = (key: keyof GameSettings, value: any) => {
    onSettingsChange?.({ ...(settings ?? DEFAULT_SETTINGS), [key]: value })
  }

  if (!mounted) return <div className="w-screen h-screen bg-black" />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative w-full h-full flex flex-col items-center overflow-y-auto">
      <NeonGridBg theme={settings?.arenaTheme ?? 'dark-void'} />

      <div className="relative z-10 flex flex-col items-center gap-4 max-w-lg w-full px-4 py-8 min-h-full">
        {/* Title */}
        <motion.h1 initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold font-display tracking-tight text-center neon-flicker select-none"
          style={{ color: accentColor }}>NEON GRIDLOCK</motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-sm text-gray-400 text-center font-mono tracking-widest">
          Paint the grid. Block the bot. Don&apos;t get trapped.
        </motion.p>

        {/* Rank & Stats Bar */}
        {stats && (stats?.totalGames ?? 0) > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center gap-3 text-xs font-mono bg-black/50 rounded-lg px-4 py-2 border border-gray-800">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" style={{ color: rank.color }} />
              <span className="font-bold" style={{ color: rank.color }}>{rank.label}</span>
            </div>
            <span className="text-gray-600">|</span>
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3" style={{ color: accentColor }} />
              <span style={{ color: accentColor }}>{totalWins}W</span>
              <span className="text-gray-500">/ {stats?.totalLosses ?? 0}L</span>
            </div>
            {streak > 0 && (<>
              <span className="text-gray-600">|</span>
              <span className="text-orange-400">🔥 {streak}</span>
            </>)}
            {nextRank && (
              <span className="text-gray-400 text-[10px]">Next: {nextRank.label} ({nextRank.wins - totalWins} wins)</span>
            )}
          </motion.div>
        )}

        {/* Start Button */}
        <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, type: 'spring' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onStart?.(settings)}
          className="relative mt-2 px-12 py-4 rounded-lg font-display text-xl font-bold tracking-wider text-black pulse-glow transition-all"
          style={{ backgroundColor: accentColor, color: '#000' }}>
          <div className="flex items-center gap-3"><Play className="w-6 h-6" fill="currentColor" />START</div>
        </motion.button>

        {/* Mode Buttons */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="flex gap-3 flex-wrap justify-center">
          <ModeButton icon={<Target className="w-4 h-4" />} label="Campaign" onClick={onCampaign} color={accentColor} badge={stats?.campaignLevel ? `Lv ${stats.campaignLevel}` : undefined} />
          <ModeButton icon={<Calendar className="w-4 h-4" />} label="Daily" onClick={onDaily} color="#ffaa00" />
          <ModeButton icon={<BarChart3 className="w-4 h-4" />} label="Stats" onClick={onStats} color="#44aaff" />
        </motion.div>

        {/* Settings Toggle */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-gray-400 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />SETTINGS
          {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </motion.button>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="w-full overflow-hidden pb-8">
              <div className="bg-black/80 backdrop-blur-md border border-gray-800 rounded-xl p-5 space-y-4">
                <SettingRow label="Difficulty" icon={<Gauge className="w-4 h-4" />} accent={accentColor}>
                  <div className="flex gap-2 flex-wrap">{DIFFICULTIES.map(d => (
                    <OptionBtn key={d.value} selected={settings?.difficulty === d.value} label={d.label}
                      onClick={() => update('difficulty', d.value)} accent={accentColor} />
                  ))}</div>
                </SettingRow>

                <SettingRow label="Grid Size" icon={<Grid3X3 className="w-4 h-4" />} accent={accentColor}>
                  <div className="flex gap-2">{GRID_OPTIONS.map(g => (
                    <OptionBtn key={g.value} selected={settings?.gridSize === g.value} label={g.size}
                      onClick={() => update('gridSize', g.value)} accent={accentColor} />
                  ))}</div>
                </SettingRow>

                <SettingRow label="Bot Style" icon={<Swords className="w-4 h-4" />} accent={accentColor}>
                  <div className="flex gap-2 flex-wrap">{BOT_STYLES.map(b => (
                    <OptionBtn key={b.value} selected={settings?.botStyle === b.value} label={b.label}
                      onClick={() => update('botStyle', b.value)} accent={accentColor} />
                  ))}</div>
                </SettingRow>

                <SettingRow label="Bot Count" icon={<Users className="w-4 h-4" />} accent={accentColor}>
                  <div className="flex gap-2">{[1, 2, 3].map(n => (
                    <OptionBtn key={n} selected={settings?.botCount === n} label={`${n} Bot${n > 1 ? 's' : ''}`}
                      onClick={() => update('botCount', n)} accent={accentColor} />
                  ))}</div>
                </SettingRow>

                <SettingRow label="Match Speed" icon={<Gauge className="w-4 h-4" />} accent={accentColor}>
                  <div className="flex gap-2">{SPEEDS.map(s => (
                    <OptionBtn key={s.value} selected={settings?.matchSpeed === s.value} label={s.label}
                      onClick={() => update('matchSpeed', s.value)} accent={accentColor} />
                  ))}</div>
                </SettingRow>

                <SettingRow label="Ability" icon={<Zap className="w-4 h-4" />} accent={accentColor}>
                  <div className="flex gap-2 flex-wrap">{ABILITIES.map(a => (
                    <OptionBtn key={a.value} selected={settings?.ability === a.value} label={a.label}
                      onClick={() => update('ability', a.value)} accent={accentColor}
                      subtitle={a.desc} />
                  ))}</div>
                </SettingRow>

                <SettingRow label="Trail Effect" icon={<Sparkles className="w-4 h-4" />} accent={accentColor}>
                  <div className="flex gap-2 flex-wrap">{TRAIL_EFFECTS.map(t => {
                    const unlocked = totalWins >= t.unlockWins
                    return (
                      <OptionBtn key={t.value} selected={settings?.trailEffect === t.value}
                        label={unlocked ? t.label : `🔒 ${t.unlockWins}W`}
                        onClick={() => unlocked && update('trailEffect', t.value)} accent={accentColor}
                        disabled={!unlocked} />
                    )
                  })}</div>
                </SettingRow>

                <SettingRow label="Player Color" icon={<Palette className="w-4 h-4" />} accent={accentColor}>
                  <div className="flex gap-3">{COLORS.map(c => (
                    <button key={c} onClick={() => update('playerColor', c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${settings?.playerColor === c ? 'scale-125 border-white' : 'border-gray-600 hover:scale-110'}`}
                      style={{ backgroundColor: COLOR_HEX[c] ?? '#fff' }} title={c} />
                  ))}</div>
                </SettingRow>

                <SettingRow label="Arena Theme" icon={<Monitor className="w-4 h-4" />} accent={accentColor}>
                  <div className="flex gap-2 flex-wrap">{THEMES.map(t => (
                    <OptionBtn key={t.value} selected={settings?.arenaTheme === t.value} label={t.label}
                      onClick={() => update('arenaTheme', t.value)} accent={accentColor} />
                  ))}</div>
                </SettingRow>

                {/* Toggles */}
                <div className="flex gap-4 flex-wrap">
                  <ToggleSwitch label="Power-Ups" checked={settings?.powerUpsEnabled !== false}
                    onChange={(v) => update('powerUpsEnabled', v)} accent={accentColor} />
                  <ToggleSwitch label="Dynamic Events" checked={settings?.dynamicEvents === true}
                    onChange={(v) => update('dynamicEvents', v)} accent={accentColor} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function ModeButton({ icon, label, onClick, color, badge }: { icon: React.ReactNode; label: string; onClick: () => void; color: string; badge?: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono border transition-all hover:scale-105 active:scale-95"
      style={{ borderColor: color + '44', color, backgroundColor: color + '11' }}>
      {icon}{label}
      {badge && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: color + '22' }}>{badge}</span>}
    </button>
  )
}

function OptionBtn({ selected, label, onClick, accent, subtitle, disabled }: {
  selected: boolean; label: string; onClick: () => void; accent: string; subtitle?: string; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${
        selected ? 'text-black font-bold' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-700'
      }`}
      style={selected ? { backgroundColor: accent } : {}}>
      {label}
    </button>
  )
}

function SettingRow({ label, icon, accent, children }: { label: string; icon: React.ReactNode; accent: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider" style={{ color: accent }}>{icon}{label}</div>
      {children}
    </div>
  )
}

function ToggleSwitch({ label, checked, onChange, accent }: { label: string; checked: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2 text-xs font-mono">
      <div className={`w-8 h-4 rounded-full relative transition-colors ${checked ? '' : 'bg-gray-700'}`}
        style={checked ? { backgroundColor: accent } : {}}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
      </div>
      <span className={checked ? 'text-white' : 'text-gray-500'}>{label}</span>
    </button>
  )
}
