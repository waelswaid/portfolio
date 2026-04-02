export default function MessageInput({
  messageInput,
  onMessageChange,
  onSend,
  onFileClick,
  onCameraClick,
  onVoiceClick,
  fileInputRef,
  cameraInputRef,
  onFileChange,
  uploading,
  recording,
}) {
  return (
    <form onSubmit={onSend} className="px-3 py-3 border-t border-slate-700/50">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,video/mp4,application/pdf,audio/webm,audio/mp4"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Action buttons row - separate on mobile, inline on desktop */}
      <div className="flex gap-1.5 mb-2 md:hidden">
        <ActionButton onClick={onFileClick} disabled={uploading} label="Attach">
          {uploading ? <SpinnerIcon /> : <AttachIcon />}
        </ActionButton>
        <ActionButton onClick={onCameraClick} disabled={uploading} label="Camera">
          <CameraIcon />
        </ActionButton>
        <ActionButton
          onClick={onVoiceClick}
          disabled={uploading}
          label="Voice"
          className={recording ? 'bg-red-500/20 text-red-400' : ''}
        >
          <MicIcon />
        </ActionButton>
      </div>

      <div className="flex gap-2">
        {/* Desktop-only inline buttons */}
        <div className="hidden md:flex gap-1.5">
          <ActionButton onClick={onFileClick} disabled={uploading} label="Attach">
            {uploading ? <SpinnerIcon /> : <AttachIcon />}
          </ActionButton>
          <ActionButton onClick={onCameraClick} disabled={uploading} label="Camera">
            <CameraIcon />
          </ActionButton>
          <ActionButton
            onClick={onVoiceClick}
            disabled={uploading}
            label="Voice"
            className={recording ? 'bg-red-500/20 text-red-400' : ''}
          >
            <MicIcon />
          </ActionButton>
        </div>

        <input
          type="text"
          value={messageInput}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 min-w-0 px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
        >
          Send
        </button>
      </div>
    </form>
  )
}

function ActionButton({ onClick, disabled, label, className = '', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

function SpinnerIcon() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function AttachIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  )
}
