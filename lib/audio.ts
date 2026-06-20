// Web Audio API sound system for NEON GRIDLOCK
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtx?.state === 'suspended') {
      audioCtx?.resume?.()
    }
    return audioCtx
  } catch {
    return null
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol: number = 0.15) {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

export function playCountdownBeep() { playTone(600, 0.2, 'square', 0.1) }
export function playGoBeep() { playTone(900, 0.3, 'square', 0.15); setTimeout(() => playTone(1200, 0.2, 'square', 0.12), 100) }
export function playStepTick() { playTone(1800, 0.04, 'square', 0.03) }

export function playCrashSound() {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  } catch {}
}

export function playVictoryChime() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.4, 'sine', 0.12), i * 120))
}

export function playDefeatBuzz() {
  playTone(120, 0.5, 'sawtooth', 0.15)
  setTimeout(() => playTone(80, 0.4, 'sawtooth', 0.1), 200)
}

export function playTensionRise() {
  playTone(300, 0.8, 'sawtooth', 0.04)
  setTimeout(() => playTone(400, 0.6, 'sawtooth', 0.05), 200)
}

export function playPowerUp() {
  playTone(800, 0.15, 'sine', 0.12)
  setTimeout(() => playTone(1200, 0.15, 'sine', 0.12), 80)
  setTimeout(() => playTone(1600, 0.2, 'sine', 0.1), 160)
}

export function playAbility() {
  playTone(400, 0.1, 'square', 0.1)
  setTimeout(() => playTone(800, 0.15, 'square', 0.12), 50)
}

export function playZoneShrink() {
  playTone(200, 0.3, 'sawtooth', 0.05)
}

export function playStreakSound() {
  [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'sine', 0.08), i * 60))
}

let humOsc: OscillatorNode | null = null
let humGain: GainNode | null = null

export function startHum() {
  const ctx = getCtx()
  if (!ctx || humOsc) return
  try {
    humOsc = ctx.createOscillator()
    humGain = ctx.createGain()
    humOsc.type = 'sine'
    humOsc.frequency.setValueAtTime(60, ctx.currentTime)
    humGain.gain.setValueAtTime(0.02, ctx.currentTime)
    humOsc.connect(humGain)
    humGain.connect(ctx.destination)
    humOsc.start()
  } catch {}
}

export function stopHum() {
  try {
    humOsc?.stop?.()
    humOsc?.disconnect?.()
    humGain?.disconnect?.()
  } catch {}
  humOsc = null
  humGain = null
}
