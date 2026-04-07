const variants = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 focus:ring-blue-500/50',
  danger:
    'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20 focus:ring-red-500/50',
  secondary:
    'bg-gray-700/50 text-gray-300 hover:bg-gray-700 focus:ring-gray-500/50',
  ghost:
    'bg-transparent text-red-400 border border-red-500/30 hover:bg-red-500/10 focus:ring-red-500/50',
  emerald:
    'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 focus:ring-emerald-500/50',
  purple:
    'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 focus:ring-purple-500/50',
}

export default function Button({
  variant = 'primary',
  full = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`${full ? 'w-full' : ''} px-6 py-2.5 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
