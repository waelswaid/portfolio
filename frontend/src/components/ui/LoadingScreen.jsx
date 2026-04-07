export function LoadingDots() {
  return (
    <div className="relative w-10 h-10">
      <div
        className="absolute inset-0 rounded-full border-2 border-cyan-500/20"
        style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
      />
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400"
        style={{ animation: 'spin-arc 1s linear infinite' }}
      />
    </div>
  )
}

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <LoadingDots />
    </div>
  )
}
