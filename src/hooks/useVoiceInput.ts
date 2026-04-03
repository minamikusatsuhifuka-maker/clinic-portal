"use client"
import { useState, useRef, useEffect, useCallback } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void
  onSend?: (text: string) => void
  apiEndpoint?: string
  maxDuration?: number
}

export function useVoiceInput({
  onTranscript,
  onSend,
  apiEndpoint = "/api/speech-to-text",
  maxDuration = 60000,
}: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isCorrecting, setIsCorrecting] = useState(false)
  const [interimText, setInterimText] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const hasMedia = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia
    setSpeechSupported(hasMedia)
  }, [])

  const stopRecording = useCallback(async (shouldSend = false) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    setIsListening(false)
    setInterimText("")

    await new Promise<void>((resolve) => {
      const onStop = async () => {
        const chunks = chunksRef.current
        chunksRef.current = []
        if (chunks.length === 0) { resolve(); return }

        const mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm"
        const blob = new Blob(chunks, { type: mimeType })
        setIsTranscribing(true)

        try {
          const form = new FormData()
          form.append("audio", blob, `recording.${mimeType === "audio/mp4" ? "mp4" : "webm"}`)
          form.append("mode", "transcribe")
          const res = await fetch(apiEndpoint, { method: "POST", body: form })
          const data = await res.json()
          let text = data.text ?? ""

          if (text) {
            setIsTranscribing(false)
            setIsCorrecting(true)
            const form2 = new FormData()
            form2.append("audio", blob, "dummy")
            form2.append("mode", "correct")
            form2.append("text", text)
            const res2 = await fetch(apiEndpoint, { method: "POST", body: form2 })
            const data2 = await res2.json()
            text = data2.text ?? text
          }

          onTranscript(text)
          if (shouldSend && onSend && text) onSend(text)
        } catch (e) {
          console.error("Transcription error:", e)
        } finally {
          setIsTranscribing(false)
          setIsCorrecting(false)
        }
        resolve()
      }

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.addEventListener("stop", onStop, { once: true })
      } else {
        resolve()
      }
    })
  }, [apiEndpoint, onTranscript, onSend])

  const startRecording = useCallback(async () => {
    if (!speechSupported) return
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm"
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(1000)
      setIsListening(true)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = "ja-JP"
        recognition.continuous = true
        recognition.interimResults = true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (e: any) => {
          let interim = ""
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (!e.results[i].isFinal) interim += e.results[i][0].transcript
          }
          setInterimText(interim)
        }
        recognition.start()
        recognitionRef.current = recognition
      }

      timerRef.current = setTimeout(() => stopRecording(false), maxDuration)
    } catch (e) {
      console.error("Microphone error:", e)
      setIsListening(false)
    }
  }, [speechSupported, maxDuration, stopRecording])

  const toggleVoice = useCallback(() => {
    if (isListening) stopRecording(false)
    else startRecording()
  }, [isListening, startRecording, stopRecording])

  const handleStopAndSend = useCallback(() => {
    stopRecording(true)
  }, [stopRecording])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return {
    isListening,
    isTranscribing,
    isCorrecting,
    speechSupported,
    interimText,
    toggleVoice,
    handleStopAndSend,
  }
}
