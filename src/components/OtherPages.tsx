"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store/useAppStore"
import { ThumbsUp, Plus, X, ChevronRight } from "lucide-react"

/* ---- ヒヤリハット ---- */
export function NearMissPage() {
  const { nearMisses, addNearMiss, upvoteNearMiss } = useAppStore()
  const [open, setOpen] = useState(false)
  const [tag, setTag] = useState("")
  const [body, setBody] = useState("")

  const submit = () => {
    if (!body.trim()) return
    addNearMiss({ tag: tag || "その他", body, role: "スタッフ", anonymous: true })
    setTag(""); setBody(""); setOpen(false)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-xs text-violet-400">匿名で投稿できます。管理者のみ個人情報を確認できます。</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm">
          <Plus size={13} />新規投稿（匿名OK）
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-violet-200 shadow-sm mb-4 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-violet-50 flex items-center justify-between">
              <span className="font-semibold text-violet-800 text-sm">✏️ 気づきを投稿</span>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-400">
                <X size={13} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-violet-600 block mb-1.5">カテゴリ</label>
                <select value={tag} onChange={(e) => setTag(e.target.value)}
                  className="w-full border border-violet-200 rounded-xl px-3 py-2.5 text-sm text-violet-800 bg-violet-50/40 focus:outline-none focus:border-violet-400">
                  <option value="">選択してください</option>
                  {["薬剤","患者確認","転倒リスク","感染対策","設備・環境","コミュニケーション","その他"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-violet-600 block mb-1.5">内容</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
                  placeholder="何が起きたか、気づいたことを自由に書いてください。改善提案も歓迎します。"
                  className="w-full border border-violet-200 rounded-xl px-3 py-2.5 text-sm text-violet-800 bg-violet-50/40 focus:outline-none focus:border-violet-400 resize-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-violet-200 text-xs font-semibold text-violet-500 hover:bg-violet-50 transition-colors">キャンセル</button>
                <button onClick={submit} className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 shadow-sm">匿名で投稿する</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {nearMisses.map((nm, i) => (
          <motion.div key={nm.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm" style={{ borderLeftWidth: "4px", borderLeftColor: "#f59e0b" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{nm.tag}</span>
              <span className="text-[10px] text-violet-300">{nm.time}</span>
            </div>
            <p className="text-sm text-violet-800 leading-relaxed">{nm.body}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-violet-300">{nm.role} · 匿名</span>
              <button onClick={() => upvoteNearMiss(nm.id)} className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-700 transition-colors">
                <ThumbsUp size={12} />▲ {nm.upvotes}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ---- 役割マトリクス ---- */
const MATRIX: Record<string, { q1: string[]; q2: string[]; q3: string[]; q4: string[] }> = {
  nurse: {
    q1: ["急変患者対応", "インシデント第一報", "投薬ミスの即時報告"],
    q2: ["看護技術のスキルアップ", "患者との信頼関係構築", "後輩指導"],
    q3: ["電話・呼び出し対応", "備品補充依頼"],
    q4: ["定例ミーティング準備", "不要書類整理"],
  },
  receptionist: {
    q1: ["緊急患者の振り分け", "クレームの初期対応"],
    q2: ["接遇スキルの向上", "予約システム習熟", "患者情報管理"],
    q3: ["電話の取り次ぎ", "会計処理確認"],
    q4: ["不要書類整理", "形骸化した確認作業"],
  },
  doctor: {
    q1: ["急変患者への対応判断", "緊急処置の決定"],
    q2: ["診療品質の継続向上", "最新医学知識のアップデート", "スタッフ教育"],
    q3: ["軽症患者の診察", "診断書の作成"],
    q4: ["過剰な事務処理", "不要な会議"],
  },
  manager: {
    q1: ["リスク・インシデントの指揮", "急な人員不足対応"],
    q2: ["スタッフ育成・評価", "マニュアル整備", "4つの自信向上施策"],
    q3: ["定例承認業務", "問い合わせ対応"],
    q4: ["過剰な報告書作成", "形骸化した手続き"],
  },
}

export function MatrixPage() {
  const [role, setRole] = useState("nurse")
  const m = MATRIX[role]
  const cells = [
    { key: "q1", title: "重要かつ緊急", sub: "今すぐやる", cls: "bg-rose-50 border-rose-200 text-rose-700", dot: "text-rose-400", items: m.q1 },
    { key: "q2", title: "重要だが非緊急", sub: "計画してやる", cls: "bg-violet-50 border-violet-200 text-violet-700", dot: "text-violet-400", items: m.q2 },
    { key: "q3", title: "緊急だが非重要", sub: "委任できる", cls: "bg-amber-50 border-amber-200 text-amber-700", dot: "text-amber-400", items: m.q3 },
    { key: "q4", title: "非重要・非緊急", sub: "削減・排除", cls: "bg-slate-50 border-slate-200 text-slate-500", dot: "text-slate-400", items: m.q4 },
  ]
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex gap-2 mb-5 flex-wrap">
        {[{ id:"nurse",label:"看護師"},{ id:"receptionist",label:"受付"},{ id:"doctor",label:"医師"},{ id:"manager",label:"マネージャー"}].map((r) => (
          <button key={r.id} onClick={() => setRole(r.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${role === r.id ? "bg-violet-600 text-white border-violet-600 shadow-sm" : "bg-white text-violet-500 border-violet-200 hover:bg-violet-50"}`}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cells.map((c) => (
          <div key={c.key} className={`rounded-2xl p-4 border ${c.cls}`}>
            <div className="font-bold text-xs mb-0.5">{c.title}</div>
            <div className="text-[10px] opacity-60 mb-3">{c.sub}</div>
            <div className="space-y-1.5">
              {c.items.map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 text-[8px] flex-shrink-0 ${c.dot}`}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-violet-400 text-center mt-4">第2象限（重要×非緊急）への投資が組織の成長につながります 🌱</p>
    </div>
  )
}

/* ---- 4つの自信 ---- */
export function ConfidencePage() {
  const scores = [
    { label:"会社への自信", icon:"🏥", val:72, grad:"from-sky-400 to-blue-400", bg:"bg-sky-50", border:"border-sky-200", txt:"text-sky-700",
      actions:["月次の経営方針共有ミーティング","患者の声・感謝の手紙の共有","ミッション・ビジョンの明文化"] },
    { label:"職業への自信", icon:"🩺", val:85, grad:"from-emerald-400 to-teal-400", bg:"bg-emerald-50", border:"border-emerald-200", txt:"text-emerald-700",
      actions:["外部研修・学会参加のサポート","社内勉強会の定期開催","資格取得支援制度"] },
    { label:"商品への自信", icon:"⭐", val:68, grad:"from-amber-400 to-orange-400", bg:"bg-amber-50", border:"border-amber-200", txt:"text-amber-700",
      actions:["診療成果・患者満足度データの共有","自院の強みの言語化・共有","患者からの感謝メッセージの掲示"] },
    { label:"自分への自信", icon:"💪", val:58, grad:"from-rose-400 to-pink-400", bg:"bg-rose-50", border:"border-rose-200", txt:"text-rose-700",
      actions:["1on1面談の定期実施","スキルマップの作成と可視化","成果を称える表彰制度"] },
  ]
  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scores.map((s) => (
          <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl p-4`}>
            <div className="text-xl mb-2">{s.icon}</div>
            <div className={`text-[11px] font-semibold ${s.txt} mb-2 leading-tight`}>{s.label}</div>
            <div className={`text-3xl font-bold ${s.txt} leading-none`}>
              {s.val}<span className="text-sm font-normal opacity-60">点</span>
            </div>
            <div className="mt-2.5 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${s.val}%` }} transition={{ duration: 0.9, delay: 0.2 }}
                className={`h-full rounded-full bg-gradient-to-r ${s.grad}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scores.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-violet-50">
              <h4 className="font-semibold text-violet-800 text-sm">{s.icon} {s.label}向上施策</h4>
            </div>
            <div className="p-4 space-y-2">
              {s.actions.map((a) => (
                <div key={a} className="flex items-start gap-2 text-sm text-violet-700">
                  <span className={`text-[10px] mt-0.5 flex-shrink-0 ${s.txt}`}>▸</span>{a}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---- 業務マニュアル ---- */
export function ManualPage() {
  const items = [
    { icon:"🌅", title:"開院準備チェックリスト", desc:"開院前に確認すべき全項目", tag:"日次" },
    { icon:"🌙", title:"閉院後チェックリスト", desc:"施錠・消灯・記録の手順", tag:"日次" },
    { icon:"🤒", title:"患者急変時の対応手順", desc:"バイタル急変・意識消失時の初動", tag:"緊急" },
    { icon:"💊", title:"薬剤管理マニュアル", desc:"薬品庫管理・投与確認の手順", tag:"通常" },
    { icon:"🧹", title:"院内清掃・感染対策手順", desc:"清掃区分・消毒手順の詳細", tag:"通常" },
    { icon:"📞", title:"電話対応マニュアル", desc:"受付電話・クレーム対応の標準", tag:"通常" },
    { icon:"🩺", title:"診察補助マニュアル", desc:"診察室での補助業務フロー", tag:"通常" },
    { icon:"📝", title:"カルテ記載ガイドライン", desc:"記録の標準書式と記載ルール", tag:"通常" },
  ]
  const tagCls: Record<string,string> = {
    日次:"bg-emerald-100 text-emerald-700",
    緊急:"bg-rose-100 text-rose-700",
    通常:"bg-violet-100 text-violet-600",
  }
  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-end mb-4">
        <button className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 shadow-sm transition-opacity">
          <Plus size={13} />新規マニュアル作成
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((m, i) => (
          <motion.button key={m.title}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}
            whileHover={{ scale:1.01, y:-1 }} whileTap={{ scale:0.99 }}
            className="bg-white rounded-2xl border border-violet-100 shadow-sm p-4 text-left flex items-center gap-3 hover:border-violet-200 hover:shadow-md transition-all">
            <span className="text-2xl flex-shrink-0">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-violet-900 text-sm leading-tight">{m.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tagCls[m.tag]}`}>{m.tag}</span>
              </div>
              <div className="text-xs text-violet-400">{m.desc}</div>
            </div>
            <ChevronRight size={15} className="text-violet-300 flex-shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
