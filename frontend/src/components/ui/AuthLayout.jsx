export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 card-glow animate-fade-in-up">
        <h1 className={`text-2xl font-bold text-gray-100 text-center ${subtitle ? 'mb-2' : 'mb-8'}`}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-400 text-center mb-8">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  )
}
