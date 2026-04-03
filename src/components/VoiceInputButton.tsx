"use client"
import { useVoiceInput } from "@/hooks/useVoiceInput"
import { Mic, MicOff, Loader2 } from "lucide-react"

interface Props {
  onTranscript: (text: string) => void
  onSend?: (text: string) => void
  accentColor?: string
  size?: number
}

export default function VoiceInputButton({
  onTranscript,
  onSend,
  accentColor = "#a78bfa",
  size = 36,
}: Props) {
  const {
    isListening, isTranscribing, isCorrecting,
    speechSupported, interimText, toggleVoice, handleStopAndSend,
  } = useVoiceInput({ onTranscript, onSend })

  if (!speechSupported) return null

  const busy = isTranscribing || isCorrecting
  const label = isListening ? "停止・送信" : busy ? (isTranscribing ? "変換中..." : "補正中...") : "音声入力"

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <button
        onClick={isListening ? handleStopAndSend : toggleVoice}
        disabled={busy}
        title={label}
        style={{
          width: size, height: size, borderRadius: "50%", border: "none",
          cursor: busy ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isListening
            ? "#ef4444"
            : busy
            ? "#e5e7eb"
            : accentColor,
          boxShadow: isListening
            ? "0 0 0 4px rgba(239,68,68,0.25)"
            : `0 2px 8px ${accentColor}55`,
          transition: "all 0.2s",
          animation: isListening ? "pulse-ring 1.5s infinite" : "none",
        }}
      >
        {busy
          ? <Loader2 size={size * 0.44} style={{ color: "#9ca3af", animation: "spin 1s linear infinite" }} />
          : isListening
          ? <MicOff size={size * 0.44} style={{ color: "white" }} />
          : <Mic size={size * 0.44} style={{ color: "white" }} />
        }
      </button>

      {interimText && (
        <div style={{
          position: "absolute", bottom: "100%", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.75)", color: "white",
          fontSize: 11, padding: "4px 10px", borderRadius: 8,
          whiteSpace: "nowrap", maxWidth: 240, overflow: "hidden",
          textOverflow: "ellipsis", marginBottom: 4,
          pointerEvents: "none",
        }}>
          {interimText}
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
