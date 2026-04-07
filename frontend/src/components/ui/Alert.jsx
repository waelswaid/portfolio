const styles = {
  error: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
}

export default function Alert({ type, children }) {
  if (!children) return null
  return (
    <div className={`mb-4 p-3 rounded-lg text-sm ${styles[type]}`}>
      {children}
    </div>
  )
}
