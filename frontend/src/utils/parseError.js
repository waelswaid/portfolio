export default function parseError(data, fallback) {
  if (typeof data?.detail === 'string') return data.detail
  return fallback
}
