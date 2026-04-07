export default function Input({ id, label, disabled, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-lg transition-colors ${
          disabled
            ? 'bg-gray-900/30 border border-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gray-900/50 border border-gray-700/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50'
        } ${className}`}
        {...props}
      />
    </div>
  )
}
