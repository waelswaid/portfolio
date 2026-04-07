export default function Card({ glow = true, danger = false, className = '', children }) {
  return (
    <div
      className={`bg-gray-800/60 backdrop-blur-xl rounded-2xl border p-8 ${
        danger ? 'border-red-500/20' : 'border-gray-700/50'
      } ${glow && !danger ? 'card-glow' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
