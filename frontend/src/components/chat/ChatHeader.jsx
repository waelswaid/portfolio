export default function ChatHeader({ selectedUser, isOnline, onBack }) {
  return (
    <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
      <button
        onClick={onBack}
        className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
        isOnline
          ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
          : 'bg-slate-600'
      }`} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">{selectedUser.email}</p>
        <p className="text-[10px] text-slate-500">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  )
}
