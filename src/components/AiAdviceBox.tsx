"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react"

interface Props {
  riskName: string
  level: string
}

export default function AiAdviceBox({ riskName, level }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState("")
  const [question, setQuestion] = useState("")

  const ask = async () => {
    if (loading) return
    setLoading(true)
    setAnswer("")
    try {
      const res = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskName, level, question }),
      })
      const data = await res.json()
      setAnswer(data.answer || "回答を取得できませんでした。")
    } catch {
      setAnswer("通信エラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => { setOpen(!open); if (!open && !answer) ask() }}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-violet-800">Gemini AI アドバイス</div>
          <div className="text-xs text-violet-400">このリスクへの対応について AI に相談する</div>
        </div>
        {open ? <ChevronUp size={16} className="text-violet-400" /> : <ChevronDown size={16} className="text-violet-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-violet-100">
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()}
                  placeholder="質問を入力（例：スタッフへの周知方法は？）"
                  className="flex-1 border border-violet-200 rounded-xl px-3 py-2 text-xs text-violet-800 bg-white/80 focus:outline-none focus:border-violet-400 placeholder-violet-300"
                />
                <button
                  onClick={ask}
                  disabled={loading}
                  className="bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex-shrink-0"
                >
                  {loading ? <Loader2 size={13} className="animate-spin" /> : "質問"}
                </button>
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-violet-400 text-xs py-2">
                  <Loader2 size={13} className="animate-spin" />
                  <span>Gemini が考えています...</span>
                </div>
              )}

              {answer && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 rounded-xl p-3 text-xs text-violet-800 leading-relaxed border border-violet-100"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={11} className="text-violet-400" />
                    <span className="text-[10px] font-semibold text-violet-500">Gemini 2.0 Flash の回答</span>
                  </div>
                  {answer}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
