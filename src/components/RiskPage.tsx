"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RISKS, type Risk } from "@/data/risks"
import { useAppStore } from "@/store/useAppStore"
import { X, Send, ChevronRight, Phone } from "lucide-react"
import AiAdviceBox from "@/components/AiAdviceBox"

const LEVEL_CLS: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-700 border border-rose-200",
  HIGH: "bg-amber-100 text-amber-700 border border-amber-200",
  MEDIUM: "bg-sky-100 text-sky-700 border border-sky-200",
}
const ICON_BG: Record<string, string> = {
  rose: "bg-rose-100", amber: "bg-amber-100",
  sky: "bg-sky-100", purple: "bg-violet-100", teal: "bg-teal-100",
}

function RiskModal({ risk, onClose }: { risk: Risk; onClose: () => void }) {
  const { checkedItems, toggleCheck } = useAppStore()
  const [notified, setNotified] = useState(false)
  const checks = checkedItems[risk.id] ?? Array(risk.checklist.length).fill(false)
  const done = checks.filter(Boolean).length

  const sendChatwork = async () => {
    setNotified(true)
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskName: risk.name, level: risk.level }),
      })
    } catch { /* 開発中はスキップ */ }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto"
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 py-5 border-b border-violet-100 flex items-start justify-between rounded-t-3xl z-10">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0 mt-0.5">{risk.icon}</span>
            <div className="min-w-0">
              <div className="font-bold text-violet-900 text-sm leading-snug">{risk.name}</div>
              <span className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${LEVEL_CLS[risk.level]}`}>{risk.level}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-400 transition-colors flex-shrink-0 ml-2">
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Chatwork通知ボタン */}
          {!notified ? (
            <button onClick={sendChatwork}
              className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
              <Send size={15} />Chatworkで全スタッフに初動通知を送る
            </button>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">✅</span>
              <div>
                <div className="text-sm font-semibold text-emerald-700">Chatwork 通知送信済み</div>
                <div className="text-xs text-emerald-600 mt-1 leading-relaxed">【{risk.name}】が発生しました。初動対応フローを確認してください。</div>
              </div>
            </div>
          )}

          {/* 対応フロー */}
          <div>
            <h4 className="font-bold text-violet-800 text-sm mb-3">📌 初動対応フロー</h4>
            <div className="space-y-3">
              {risk.flow.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">{i + 1}</div>
                  <div>
                    <div className="text-sm font-semibold text-violet-800">{step.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 緊急連絡先 */}
          <div>
            <h4 className="font-bold text-violet-800 text-sm mb-3">📞 緊急連絡先</h4>
            <div className="space-y-2">
              {risk.contacts.map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-violet-50 rounded-xl p-3">
                  <span className="text-lg flex-shrink-0">{c.icon}</span>
                  <div className="flex-1 text-xs font-semibold text-violet-800">{c.name}</div>
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 bg-white border border-violet-200 text-violet-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors flex-shrink-0">
                    <Phone size={11} />{c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <AiAdviceBox riskName={risk.name} level={risk.level} />

          {/* チェックリスト */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-violet-800 text-sm">☑ 初動チェックリスト</h4>
              <span className="text-sm font-bold text-emerald-600">{done}/{risk.checklist.length}</span>
            </div>
            <div className="space-y-1">
              {risk.checklist.map((item, i) => (
                <button key={i} onClick={() => toggleCheck(risk.id, i, risk.checklist.length)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-50 transition-colors text-left">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checks[i] ? "bg-emerald-400 border-emerald-400" : "border-violet-200"}`}>
                    {checks[i] && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <span className={`text-sm leading-snug ${checks[i] ? "line-through text-violet-300" : "text-violet-700"}`}>{item}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function RiskPage() {
  const [selected, setSelected] = useState<Risk | null>(null)
  const [filter, setFilter] = useState("ALL")
  const filtered = filter === "ALL" ? RISKS : RISKS.filter((r) => r.level === filter)
  return (
    <div className="p-6 max-w-4xl">
      <div className="flex gap-2 mb-5 flex-wrap">
        {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === f ? "bg-violet-600 text-white border-violet-600 shadow-sm" : "bg-white text-violet-500 border-violet-200 hover:bg-violet-50"}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-hidden">
        {filtered.map((r, idx) => (
          <motion.button key={r.id}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
            onClick={() => setSelected(r)}
            className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-violet-50/50 transition-colors ${idx < filtered.length - 1 ? "border-b border-violet-50" : ""}`}
          >
            <span className="text-xs font-bold text-violet-300 w-6 font-mono flex-shrink-0">{String(r.id).padStart(2, "0")}</span>
            <div className={`w-10 h-10 rounded-xl ${ICON_BG[r.color]} flex items-center justify-center text-xl flex-shrink-0`}>{r.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-violet-900 text-sm leading-snug">{r.name}</div>
              <div className="text-xs text-violet-400 mt-0.5">{r.flow[0]?.title}</div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${LEVEL_CLS[r.level]}`}>{r.level}</span>
            <ChevronRight size={15} className="text-violet-300 flex-shrink-0" />
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {selected && <RiskModal risk={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
