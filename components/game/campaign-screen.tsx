'use client'

import { motion } from 'framer-motion'
import { CAMPAIGN_LEVELS, CampaignLevel, GRID_SIZES, COLOR_HEX, DEFAULT_SETTINGS, GameSettings } from '@/lib/game-types'
import { ArrowLeft, Lock, Check, Play, Target } from 'lucide-react'

interface CampaignScreenProps {
  campaignLevel: number // highest completed
  onStartLevel: (level: CampaignLevel) => void
  onBack: () => void
  accentColor: string
}

export default function CampaignScreen({ campaignLevel, onStartLevel, onBack, accentColor }: CampaignScreenProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative w-full h-full flex flex-col items-center bg-black overflow-y-auto">
      <div className="w-full max-w-lg px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h2 className="text-2xl font-bold font-display" style={{ color: accentColor }}>
              <Target className="w-5 h-5 inline mr-2" />CAMPAIGN
            </h2>
            <p className="text-xs text-gray-500 font-mono">Complete challenges to prove your mastery</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-mono text-gray-500 mb-1">
            <span>Progress</span>
            <span>{campaignLevel} / {CAMPAIGN_LEVELS.length}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${(campaignLevel / CAMPAIGN_LEVELS.length) * 100}%`,
              backgroundColor: accentColor
            }} />
          </div>
        </div>

        {/* Levels */}
        <div className="space-y-2">
          {CAMPAIGN_LEVELS.map((level, idx) => {
            const completed = idx < campaignLevel
            const unlocked = idx <= campaignLevel
            const isCurrent = idx === campaignLevel

            return (
              <motion.div key={level.id}
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  completed ? 'border-gray-700 bg-gray-900/50' :
                  isCurrent ? 'border-opacity-60 bg-opacity-10' :
                  'border-gray-800 bg-gray-900/30 opacity-50'
                }`}
                style={isCurrent ? { borderColor: accentColor + '66', backgroundColor: accentColor + '0a' } : {}}>

                {/* Level number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${
                  completed ? 'bg-green-900/50 text-green-400' :
                  isCurrent ? 'text-black' : 'bg-gray-800 text-gray-600'
                }`}
                  style={isCurrent ? { backgroundColor: accentColor } : {}}>
                  {completed ? <Check className="w-4 h-4" /> : unlocked ? level.id : <Lock className="w-3 h-3" />}
                </div>

                {/* Level info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold font-display" style={{ color: isCurrent ? accentColor : completed ? '#aaa' : '#555' }}>
                    {level.name}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate">{level.description}</div>
                  <div className="text-[10px] text-gray-600 font-mono mt-0.5">{level.objective}</div>
                </div>

                {/* Play button */}
                {unlocked && !completed && (
                  <button onClick={() => onStartLevel(level)}
                    className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
                    style={{ backgroundColor: accentColor, color: '#000' }}>
                    <Play className="w-4 h-4" fill="currentColor" />
                  </button>
                )}
                {unlocked && completed && (
                  <button onClick={() => onStartLevel(level)}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all hover:scale-110 active:scale-95">
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
