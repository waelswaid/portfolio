import { useState, useRef } from 'react'

export default function useVoiceRecorder(onRecorded) {
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef(null)

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType })
        const ext = mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm'
        onRecorded(blob, `voice-${Date.now()}.${ext}`)
      }

      mediaRecorder.start()
      setRecording(true)
    } catch {
      alert('Microphone access denied.')
    }
  }

  return { recording, toggleRecording }
}
