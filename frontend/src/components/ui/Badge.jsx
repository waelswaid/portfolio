const styles = {
  admin: 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20',
  user: 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  disabled: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
}

export default function Badge({ variant, children }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}
