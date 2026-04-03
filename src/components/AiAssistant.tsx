"use client"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, Sparkles, RotateCcw } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"

interface Message {
  role: "user" | "assistant"
  content: string
}

const QUICK_QUESTIONS = [
  "今日の業務で気をつけることは？",
  "新人スタッフへの接し方のコツを教えて",
  "ヒヤリハットを減らすには？",
  "美容カウンセリングのポイントは？",
  "患者さんへの声かけが上手くなるには？",
  "リピーター患者を増やすには？",
]

interface AiAssistantProps {
  userRole?: string
}

export default function AiAssistant({ userRole = "staff" }: AiAssistantProps) {
  const { activePage } = useAppStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "こんにちは！南草津皮フ科専任AIアシスタントの「ケアちゃん」です🌸\n\n業務のこと、リスク対応、患者さんへの対応など、何でもお気軽にご相談ください！",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  const send = async (text?: string) => {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput("")

    const newMessages: Message[] = [...messages, { role: "user", content }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          currentPage: activePage,
          userRole,
        }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }])
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "通信エラーが発生しました。もう一度お試しください。" }])
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setMessages([{
      role: "assistant",
      content: "会話をリセットしました🌸 新しいご相談をどうぞ！",
    }])
  }

  return (
    <>
      {/* フローティングボタン */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            style={{
              position: "fixed", bottom: 24, right: 24, zIndex: 40,
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg,#a78bfa,#f472b6)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(167,139,250,0.5)",
            }}>
            <Sparkles size={24} style={{ color: "white" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* チャットウィンドウ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              position: "fixed", bottom: 24, right: 24, zIndex: 40,
              width: 380, height: 560,
              background: "#fff",
              borderRadius: 24,
              boxShadow: "0 8px 48px rgba(90,60,160,0.18)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              border: "1px solid rgba(167,139,250,0.2)",
            }}>

            {/* ヘッダー */}
            <div style={{
              background: "linear-gradient(135deg,#a78bfa,#f472b6)",
              padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 10,
              flexShrink: 0,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>🌸</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>ケアちゃん</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>南草津皮フ科 AIアシスタント</div>
              </div>
              <button onClick={reset} title="会話をリセット"
                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <RotateCcw size={13} />
              </button>
              <button onClick={() => setOpen(false)}
                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <X size={13} />
              </button>
            </div>

            {/* メッセージ一覧 */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((m, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    flexDirection: m.role === "user" ? "row-reverse" : "row",
                    gap: 8, alignItems: "flex-end",
                  }}>
                  {m.role === "assistant" && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#a78bfa,#f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🌸</div>
                  )}
                  <div style={{
                    maxWidth: "78%",
                    padding: "10px 13px",
                    borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: m.role === "user"
                      ? "linear-gradient(135deg,#a78bfa,#f472b6)"
                      : "#f8f6fc",
                    color: m.role === "user" ? "white" : "#3a2f5a",
                    fontSize: 13, lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    border: m.role === "assistant" ? "1px solid rgba(167,139,250,0.15)" : "none",
                  }}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#a78bfa,#f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌸</div>
                  <div style={{ padding: "10px 14px", borderRadius: "18px 18px 18px 4px", background: "#f8f6fc", border: "1px solid rgba(167,139,250,0.15)", display: "flex", gap: 5, alignItems: "center" }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: `bounce 1s ${i*0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* クイック質問（初回のみ） */}
            {messages.length <= 1 && (
              <div style={{ padding: "0 12px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                  <button key={q} onClick={() => send(q)}
                    style={{ fontSize: 11, padding: "5px 10px", borderRadius: 999, border: "1px solid rgba(167,139,250,0.3)", background: "#f5f2fd", color: "#7c65cc", cursor: "pointer", whiteSpace: "nowrap" }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* 入力エリア */}
            <div style={{
              padding: "10px 12px",
              borderTop: "1px solid rgba(167,139,250,0.12)",
              display: "flex", gap: 8, alignItems: "flex-end",
              flexShrink: 0,
              background: "#fff",
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="何でも聞いてください... (Enterで送信)"
                rows={1}
                style={{
                  flex: 1, border: "1px solid rgba(167,139,250,0.25)",
                  borderRadius: 12, padding: "9px 12px",
                  fontSize: 13, color: "#3a2f5a",
                  background: "#f8f6fc", outline: "none",
                  resize: "none", fontFamily: "inherit",
                  lineHeight: 1.5, maxHeight: 80, overflowY: "auto",
                }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg,#a78bfa,#f472b6)"
                    : "#e5e7eb",
                  border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.2s",
                }}>
                {loading
                  ? <Loader2 size={16} style={{ color: "white", animation: "spin 1s linear infinite" }} />
                  : <Send size={15} style={{ color: input.trim() ? "white" : "#b0a8c8" }} />
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
