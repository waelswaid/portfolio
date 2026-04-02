import { useState, useRef } from 'react'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf', 'audio/webm', 'audio/mp4']
const MAX_SIZE = 10 * 1024 * 1024

export default function useFileUpload(onUploaded, { canUpload } = {}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  async function upload(file) {
    if (canUpload && !canUpload()) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Unsupported file type.')
      return
    }
    if (file.size > MAX_SIZE) {
      alert('File must be under 10 MB.')
      return
    }

    const token = localStorage.getItem('access_token')
    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const res = await fetch('/server/upload/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      try {
        onUploaded(data.url)
      } catch {
        alert('File uploaded but failed to send. Please try again.')
        return
      }
    } catch {
      alert('File upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  async function uploadBlob(blob, filename) {
    if (canUpload && !canUpload()) return
    const token = localStorage.getItem('access_token')
    const formData = new FormData()
    formData.append('file', blob, filename)

    setUploading(true)
    try {
      const res = await fetch('/server/upload/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      try {
        onUploaded(data.url)
      } catch {
        alert('File uploaded but failed to send. Please try again.')
        return
      }
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return { uploading, fileInputRef, cameraInputRef, handleFileChange, uploadBlob }
}
