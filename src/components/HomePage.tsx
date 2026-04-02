"use client"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Bell, ArrowRight } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"

const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

export default function HomePage() {
  const { setActivePage, nearMisses } = useAppStore()
  const dateStr = new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric", weekday: "short"
  })
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-5 max-w-5xl">
      {/* ヘッダー */}
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-violet-900">おはようございます 🌸</h1>
          <p className="text-sm text-violet-400 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Chatwork 連携中
        </div>
      </motion.div>

      {/* アラート */}
      <motion.div variants={item} className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
        <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-semibold text-rose-700">要確認：</span>
          <span className="text-rose-600">未対応のCRITICALリスク項目が 3 件あります</span>
        </div>
        <button
          onClick={() => setActivePage("risk")}
          className="flex items-center gap-1 bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-rose-600 transition-colors flex-shrink-0"
        >
          確認 <ArrowRight size={12} />
        </button>
      </motion.div>

      {/* 統計カード */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "未対応リスク", val: "3", unit: "件", emoji: "🚨", grad: "from-rose-400 to-pink-400", page: "risk" },
          { label: "本日のチェック", val: "4/7", unit: "完了", emoji: "✅", grad: "from-amber-400 to-orange-400", page: "manual" },
          { label: "今週のヒヤリハット", val: String(nearMisses.length), unit: "件", emoji: "💬", grad: "from-sky-400 to-blue-400", page: "nearmiss" },
          { label: "自信スコア平均", val: "71", unit: "点", emoji: "⭐", grad: "from-violet-400 to-purple-400", page: "confidence" },
        ].map((s) => (
          <motion.button
            key={s.label}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActivePage(s.page)}
            className="bg-white rounded-2xl p-4 border border-violet-100 shadow-sm text-left hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center text-xl mb-3 shadow-sm`}>{s.emoji}</div>
            <div className="text-[11px] text-violet-400 mb-1 leading-tight">{s.label}</div>
            <div className="text-2xl font-bold text-violet-900 leading-none">
              {s.val}<span className="text-sm font-normal text-violet-400 ml-1">{s.unit}</span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* 下段2カラム */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* チェックリスト */}
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-50 flex items-center justify-between">
            <h3 className="font-semibold text-violet-800 text-sm flex items-center gap-2">
              <CheckCircle2 size={15} className="text-violet-400" />本日のチェックリスト
            </h3>
            <span className="text-xs text-violet-400">4/7</span>
          </div>
          <div className="p-4 space-y-2.5">
            {["開院前 安全確認", "感染対策備品の補充確認", "患者情報の受け渡しチェック", "AED動作確認・記録"].map((t, i) => (
              <div key={t} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${i < 2 ? "bg-emerald-400 border-emerald-400" : "border-violet-200"}`}>
                  {i < 2 && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
                <span className={`text-sm ${i < 2 ? "line-through text-violet-300" : "text-violet-700"}`}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chatwork通知 */}
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-50">
            <h3 className="font-semibold text-violet-800 text-sm flex items-center gap-2">
              <Bell size={15} className="text-violet-400" />Chatwork 最近の通知
            </h3>
          </div>
          <div className="p-4 space-y-2.5">
            {[
              { emoji: "⚠️", title: "インシデント報告", body: "3階処置室でヒヤリハットが提出されました", time: "10分前", cls: "bg-amber-50 border-amber-200" },
              { emoji: "📋", title: "マニュアル更新", body: "感染対策マニュアル（ver.3.2）が更新されました", time: "2時間前", cls: "bg-sky-50 border-sky-200" },
              { emoji: "⭐", title: "自信スコア集計", body: "今月の4つの自信スコアが集計されました", time: "昨日", cls: "bg-violet-50 border-violet-200" },
            ].map((n) => (
              <div key={n.title} className={`rounded-xl p-3 border ${n.cls} flex gap-2.5`}>
                <span className="text-base flex-shrink-0">{n.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-700">{n.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">{n.body}</div>
                </div>
                <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">{n.time}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
