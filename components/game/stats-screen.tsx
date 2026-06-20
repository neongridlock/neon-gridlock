'use client'

import { motion } from 'framer-motion'
import { getRank, getNextRank, RANK_THRESHOLDS, TRAIL_EFFECTS } from '@/lib/game-types'
import { ArrowLeft, Trophy, Clock, Grid3X3, Swords, Star, Flame, Target, BarChart3, TrendingUp } from 'lucide-react'

interface StatsScreenProps {
  stats: any
  recentMatches: any[]
  onBack: () => void
  accentColor: string
}

export default function StatsScreen({ stats, recentMatches, onBack, accentColor }: StatsScreenProps) {
  const totalWins = stats?.totalWins ?? 0
  const totalLosses = stats?.totalLosses ?? 0
  const totalGames = stats?.totalGames ?? 0
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0
  const rank = getRank(totalWins)
  const nextRank = getNextRank(totalWins)
  const bestStreak = stats?.bestStreak ?? 0
  const currentStreak = stats?.currentStreak ?? 0
  const totalTiles = stats?.totalTiles ?? 0
  const totalPlayTime = stats?.totalPlayTime ?? 0
  const bestTime = stats?.bestTime
  const bestTiles = stats?.bestTiles
  const dailyWins = stats?.dailyWins ?? 0
  const campaignLevel = stats?.campaignLevel ?? 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative w-full h-full flex flex-col items-center bg-black overflow-y-auto">
      <div className="w-full max-w-lg px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <h2 className="text-2xl font-bold font-display" style={{ color: accentColor }}>
            <BarChart3 className="w-5 h-5 inline mr-2" />STATS
          </h2>
        </div>

        {/* Rank Card */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 text-center">
          <Star className="w-10 h-10 mx-auto mb-2" style={{ color: rank.color }} />
          <div className="text-2xl font-bold font-display" style={{ color: rank.color }}>{rank.label}</div>
          {nextRank && (
            <div className="mt-2">
              <div className="text-xs text-gray-500 font-mono mb-1">{totalWins} / {nextRank.wins} wins to {nextRank.label}</div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, (totalWins / nextRank.wins) * 100)}%`,
                  backgroundColor: rank.color
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Trophy className="w-4 h-4" />} label="Win Rate" value={`${winRate}%`} sub={`${totalWins}W / ${totalLosses}L`} color={accentColor} />
          <StatCard icon={<Swords className="w-4 h-4" />} label="Total Games" value={String(totalGames)} color="#888" />
          <StatCard icon={<Flame className="w-4 h-4" />} label="Best Streak" value={String(bestStreak)} sub={currentStreak > 0 ? `Current: ${currentStreak}` : undefined} color="#ff8800" />
          <StatCard icon={<Grid3X3 className="w-4 h-4" />} label="Total Tiles" value={totalTiles > 1000 ? `${(totalTiles / 1000).toFixed(1)}K` : String(totalTiles)} color="#00ff66" />
          <StatCard icon={<Clock className="w-4 h-4" />} label="Time Played" value={formatTime(totalPlayTime)} color="#44aaff" />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Best Win" value={bestTime ? `${(bestTime / 1000).toFixed(1)}s` : '-'} sub={bestTiles ? `${bestTiles} tiles` : undefined} color="#ffaa00" />
          <StatCard icon={<Target className="w-4 h-4" />} label="Campaign" value={`Lv ${campaignLevel}`} sub={`${campaignLevel}/20`} color="#ff00ff" />
          <StatCard icon={<Trophy className="w-4 h-4" />} label="Daily Wins" value={String(dailyWins)} color="#ffaa00" />
        </div>

        {/* Win Rate Bar */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Win / Loss Distribution</div>
          <div className="flex h-6 rounded-full overflow-hidden bg-gray-800">
            {totalGames > 0 && (<>
              <div className="h-full flex items-center justify-center text-[10px] font-bold text-black font-mono transition-all"
                style={{ width: `${winRate}%`, backgroundColor: accentColor, minWidth: totalWins > 0 ? '20px' : '0' }}>
                {winRate > 10 ? `${winRate}%` : ''}
              </div>
              <div className="h-full flex items-center justify-center text-[10px] font-bold text-white font-mono transition-all"
                style={{ width: `${100 - winRate}%`, backgroundColor: '#ff3366', minWidth: totalLosses > 0 ? '20px' : '0' }}>
                {(100 - winRate) > 10 ? `${100 - winRate}%` : ''}
              </div>
            </>)}
          </div>
        </div>

        {/* Rank Ladder */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="text-xs font-mono text-gray-400 mb-3 uppercase tracking-wider">Rank Ladder</div>
          <div className="space-y-2">
            {RANK_THRESHOLDS.map(r => {
              const achieved = totalWins >= r.wins
              return (
                <div key={r.rank} className={`flex items-center gap-3 text-xs font-mono ${achieved ? '' : 'opacity-40'}`}>
                  <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: r.color }} />
                  <span style={{ color: r.color }}>{r.label}</span>
                  <span className="text-gray-600 flex-1">{r.wins} wins</span>
                  {achieved && <Check className="w-3.5 h-3.5 text-green-400" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Trail Unlocks */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="text-xs font-mono text-gray-400 mb-3 uppercase tracking-wider">Trail Effects</div>
          <div className="flex gap-2 flex-wrap">
            {TRAIL_EFFECTS.map(t => {
              const unlocked = totalWins >= t.unlockWins
              return (
                <div key={t.value} className={`px-3 py-1.5 rounded-md text-xs font-mono border ${unlocked ? 'border-green-800 bg-green-900/30 text-green-400' : 'border-gray-800 bg-gray-900 text-gray-600'}`}>
                  {unlocked ? '✓' : '🔒'} {t.label} ({t.unlockWins}W)
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Matches */}
        {(recentMatches?.length ?? 0) > 0 && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <div className="text-xs font-mono text-gray-400 mb-3 uppercase tracking-wider">Recent Matches</div>
            <div className="space-y-1.5">
              {recentMatches.map((m: any, i: number) => (
                <div key={m?.id ?? i} className="flex items-center gap-2 text-xs font-mono">
                  <span className={`w-10 font-bold ${m?.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                    {m?.result === 'win' ? 'WIN' : 'LOSS'}
                  </span>
                  <span className="text-gray-500">{m?.difficulty}</span>
                  <span className="text-gray-600">{m?.gridSize}</span>
                  <span className="text-gray-600 flex-1 text-right">{m?.playerTiles}t / {((m?.durationMs ?? 0) / 1000).toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs font-mono uppercase tracking-wider mb-1" style={{ color }}>{icon}{label}</div>
      <div className="text-xl font-bold font-display" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-gray-500 font-mono mt-0.5">{sub}</div>}
    </div>
  )
}

function Check({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
}

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ${sec % 60}s`
  const hr = Math.floor(min / 60)
  return `${hr}h ${min % 60}m`
}
