let audioCtx: AudioContext | null = null

export function playClickSound() {
  audioCtx ??= new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const oscillator = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(600, audioCtx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.08)

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15)

  oscillator.connect(gain)
  gain.connect(audioCtx.destination)
  oscillator.start()
  oscillator.stop(audioCtx.currentTime + 0.15)
}
