"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, RotateCcw, Sparkles, X, ChevronDown } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  role: "user" | "assistant"
  content: string
  streaming?: boolean
}

const QUICK = [
  "業務の流れを一緒に整理したい",
  "新人スタッフへの指導方法を教えて",
  "美容カウンセリングのポイントは？",
  "リピーター患者を増やすには？",
  "ヒヤリハットを減らすには？",
  "スタッフのモチベーションを上げるには？",
  "患者さんへの声かけが上手くなるには？",
  "自費メニューの説明が苦手です",
]

const INITIAL: Message = {
  role: "assistant",
  content: `# こんにちは！ケアちゃんです 🌸

南草津皮フ科専任AIアシスタントです。業務のこと、患者対応、リスク管理、美容皮膚科のマーケティングまで、何でもお気軽にご相談ください。

**こんなことができます：**
- 📋 業務の流れを一緒に考える（壁打ち）
- 🛡️ リスク対応の手順確認
- 👩‍⚕️ 新人スタッフへのOJTサポート
- 💄 美容皮膚科のブランディング相談
- 💬 患者対応・接遇の改善アドバイス

下のボタンから質問するか、自由に話しかけてください！`,
}

interface Props { userRole?: string }

export default function AiAssistant({ userRole = "staff" }: Props) {
  const { activePage } = useAppStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
  }, [])

  useEffect(() => {
    if (!loading) return
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollBtn(dist > 100)
    }
    el.addEventListener("scroll", handler)
    return () => el.removeEventListener("scroll", handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
        scrollToBottom(false)
      }, 400)
    }
  }, [open, scrollToBottom])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"
  }

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput("")
    if (inputRef.current) inputRef.current.style.height = "auto"

    const newMessages: Message[] = [...messages, { role: "user", content }]
    setMessages([...newMessages, { role: "assistant", content: "", streaming: true }])
    setLoading(true)
    scrollToBottom()

    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, currentPage: activePage, userRole }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error("Network error")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: accumulated, streaming: true }
          return updated
        })
      }

      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: "assistant", content: accumulated, streaming: false }
        return updated
      })
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: "assistant", content: "エラーが発生しました。もう一度お試しください。", streaming: false }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    abortRef.current?.abort()
    setMessages([INITIAL])
    setLoading(false)
  }

  return (
    <>
      {/* フローティングボタン */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            style={{
              position: "fixed", bottom: 28, right: 28, zIndex: 40,
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg,#a78bfa,#f472b6)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 24px rgba(167,139,250,0.55)",
            }}>
            <Sparkles size={22} style={{ color: "white" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* フルスクリーンチャット */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 50,
              background: "#f8f6fc",
              display: "flex", flexDirection: "column",
            }}>

            {/* ヘッダー */}
            <div style={{
              background: "#fff",
              borderBottom: "1px solid rgba(167,139,250,0.15)",
              padding: "0 24px",
              height: 56,
              display: "flex", alignItems: "center", gap: 14,
              flexShrink: 0,
              boxShadow: "0 1px 4px rgba(90,60,160,0.06)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg,#a78bfa,#f472b6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>🌸</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#3a2f5a" }}>ケアちゃん</div>
                <div style={{ fontSize: 11, color: "#b0a8c8" }}>南草津皮フ科 AIアシスタント · Gemini 2.0 Flash</div>
              </div>
              <button onClick={reset} title="会話をリセット"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(124,101,204,0.2)", background: "#f5f2fd", color: "#7c65cc", fontSize: 12, cursor: "pointer" }}>
                <RotateCcw size={13} />新しい会話
              </button>
              <button onClick={() => setOpen(false)}
                style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(124,101,204,0.15)", background: "#f5f2fd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c65cc" }}>
                <X size={16} />
              </button>
            </div>

            {/* メッセージエリア */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
              <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 24 }}>
                {messages.map((m, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: "flex", gap: 14, flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>

                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: m.role === "assistant"
                        ? "linear-gradient(135deg,#a78bfa,#f472b6)"
                        : "linear-gradient(135deg,#c4b5fd,#818cf8)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, marginTop: 2,
                    }}>
                      {m.role === "assistant" ? "🌸" : "👤"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#b0a8c8", marginBottom: 6 }}>
                        {m.role === "assistant" ? "ケアちゃん" : "あなた"}
                      </div>
                      {m.role === "user" ? (
                        <div style={{
                          display: "inline-block",
                          background: "linear-gradient(135deg,#a78bfa,#818cf8)",
                          color: "white", padding: "12px 16px",
                          borderRadius: "18px 18px 4px 18px",
                          fontSize: 14, lineHeight: 1.7,
                          whiteSpace: "pre-wrap", maxWidth: "85%",
                        }}>
                          {m.content}
                        </div>
                      ) : (
                        <div style={{
                          background: "#fff",
                          border: "1px solid rgba(167,139,250,0.15)",
                          borderRadius: "4px 18px 18px 18px",
                          padding: "16px 20px",
                          fontSize: 14, lineHeight: 1.85,
                          color: "#3a2f5a",
                          boxShadow: "0 1px 4px rgba(90,60,160,0.06)",
                        }}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({children}) => <h1 style={{ fontSize: 18, fontWeight: 700, color: "#3a2f5a", marginBottom: 10, marginTop: 4 }}>{children}</h1>,
                              h2: ({children}) => <h2 style={{ fontSize: 15, fontWeight: 700, color: "#5f4ba8", marginBottom: 8, marginTop: 16 }}>{children}</h2>,
                              h3: ({children}) => <h3 style={{ fontSize: 14, fontWeight: 600, color: "#7c65cc", marginBottom: 6, marginTop: 12 }}>{children}</h3>,
                              p: ({children}) => <p style={{ marginBottom: 10, lineHeight: 1.85 }}>{children}</p>,
                              ul: ({children}) => <ul style={{ paddingLeft: 20, marginBottom: 10 }}>{children}</ul>,
                              ol: ({children}) => <ol style={{ paddingLeft: 20, marginBottom: 10 }}>{children}</ol>,
                              li: ({children}) => <li style={{ marginBottom: 4, lineHeight: 1.7 }}>{children}</li>,
                              strong: ({children}) => <strong style={{ fontWeight: 700, color: "#3a2f5a" }}>{children}</strong>,
                              code: ({children}) => <code style={{ background: "#f5f2fd", padding: "2px 6px", borderRadius: 4, fontSize: 12, fontFamily: "monospace", color: "#7c65cc" }}>{children}</code>,
                              blockquote: ({children}) => <blockquote style={{ borderLeft: "3px solid #a78bfa", paddingLeft: 12, margin: "10px 0", color: "#7a6e96", fontStyle: "italic" }}>{children}</blockquote>,
                              hr: () => <hr style={{ border: "none", borderTop: "1px solid rgba(167,139,250,0.2)", margin: "12px 0" }} />,
                            }}>
                            {m.content}
                          </ReactMarkdown>
                          {m.streaming && (
                            <span style={{ display: "inline-block", width: 8, height: 16, background: "#a78bfa", borderRadius: 2, marginLeft: 2, animation: "blink 1s infinite" }} />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {loading && messages[messages.length - 1]?.content === "" && (
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#a78bfa,#f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🌸</div>
                    <div style={{ background: "#fff", border: "1px solid rgba(167,139,250,0.15)", borderRadius: "4px 18px 18px 18px", padding: "14px 20px", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", animation: `bounce 1.2s ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* スクロールダウンボタン */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  onClick={() => scrollToBottom()}
                  style={{ position: "absolute", bottom: 120, right: 32, width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "1px solid rgba(167,139,250,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(90,60,160,0.12)", color: "#7c65cc", zIndex: 10 }}>
                  <ChevronDown size={18} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* クイック質問 */}
            {messages.length <= 1 && (
              <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 12px", width: "100%" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {QUICK.map((q) => (
                    <button key={q} onClick={() => send(q)}
                      style={{ fontSize: 12, padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(167,139,250,0.3)", background: "#fff", color: "#7c65cc", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#f5f2fd"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.6)" }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 入力エリア */}
            <div style={{
              background: "#fff",
              borderTop: "1px solid rgba(167,139,250,0.12)",
              padding: "16px 24px",
              flexShrink: 0,
            }}>
              <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 1, border: "1.5px solid rgba(167,139,250,0.35)", borderRadius: 16, padding: "12px 16px", background: "#faf8ff", display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    placeholder="何でも相談してください... （Shift+Enterで改行）"
                    style={{
                      flex: 1, border: "none", background: "transparent",
                      fontSize: 14, color: "#3a2f5a", outline: "none",
                      resize: "none", fontFamily: "inherit",
                      lineHeight: 1.6, minHeight: 24, maxHeight: 160,
                      overflow: "auto",
                    }}
                    rows={1}
                  />
                </div>
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  style={{
                    width: 44, height: 44, borderRadius: 12, border: "none",
                    background: input.trim() && !loading
                      ? "linear-gradient(135deg,#a78bfa,#f472b6)"
                      : "#e9e4f8",
                    cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all 0.2s",
                    boxShadow: input.trim() && !loading ? "0 2px 12px rgba(167,139,250,0.4)" : "none",
                  }}>
                  {loading
                    ? <Loader2 size={18} style={{ color: "#a78bfa", animation: "spin 1s linear infinite" }} />
                    : <Send size={17} style={{ color: input.trim() ? "white" : "#c4bde0", transform: "translateX(1px)" }} />
                  }
                </button>
              </div>
              <div style={{ maxWidth: 760, margin: "8px auto 0", textAlign: "center", fontSize: 11, color: "#c4bde0" }}>
                Gemini 2.0 Flash · 医療的な最終判断は必ず院長に確認してください
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-5px);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </>
  )
}
