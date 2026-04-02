function FileContent({ url, isMine }) {
  const fullUrl = url.startsWith('http') ? url : `/${url}`
  const ext = url.split('.').pop().toLowerCase()

  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    return (
      <img
        src={fullUrl}
        alt="shared image"
        className="max-w-full rounded-lg cursor-pointer"
        onClick={() => window.open(fullUrl, '_blank')}
      />
    )
  }
  if (ext === 'mp4') {
    return <video src={fullUrl} controls className="max-w-full rounded-lg" />
  }
  if (['webm', 'ogg', 'm4a'].includes(ext)) {
    return <audio src={fullUrl} controls className="max-w-full" />
  }
  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline ${isMine ? 'text-blue-200' : 'text-blue-400'}`}
    >
      {url.split('/').pop()}
    </a>
  )
}

export default function MessageBubble({ message }) {
  const isFile = message.type === 'file_upload'

  return (
    <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`${isFile ? 'max-w-sm p-1.5' : 'max-w-xs px-4 py-2.5'} text-sm leading-relaxed ${
          message.isMine
            ? 'bg-blue-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-blue-500/10'
            : 'bg-slate-700/80 text-slate-200 rounded-2xl rounded-bl-md'
        }`}
      >
        {isFile ? <FileContent url={message.message} isMine={message.isMine} /> : message.message}
      </div>
    </div>
  )
}
