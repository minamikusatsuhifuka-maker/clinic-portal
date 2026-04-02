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

      <NearMissAiAnalysis reports={nearMisses} />
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
    q1: [
      "急変患者への即時対応",
      "インシデント・ヒヤリハット第一報",
      "投薬ミスの即時報告と対応",
      "転倒・転落発生時の初動",
      "感染症疑い患者の隔離対応",
      "急変時のAED・BLS実施",
    ],
    q2: [
      "看護技術・知識のスキルアップ",
      "患者・家族との信頼関係構築",
      "後輩・新人スタッフの指導育成",
      "ヒヤリハット事例の振り返り",
      "資格取得・外部研修への参加",
      "業務改善提案の検討と提出",
      "患者満足度向上のための工夫",
    ],
    q3: [
      "電話・ナースコール対応",
      "備品・医薬品の補充依頼",
      "他部門への連絡・調整",
      "検査結果の受け渡し",
      "軽微な書類・記録の転記",
    ],
    q4: [
      "形骸化した定例ミーティング",
      "すでに把握済みの重複確認",
      "不要な書類の整理・ファイリング",
      "過剰なダブルチェック作業",
    ],
  },
  receptionist: {
    q1: [
      "緊急患者の迅速な振り分け",
      "クレーム・苦情の初期対応",
      "予約システム障害時の手動対応",
      "窓口混雑時の誘導・整理",
      "患者急変発生時の院内連絡",
      "個人情報漏洩リスク発生時の初動",
    ],
    q2: [
      "接遇・コミュニケーションスキル向上",
      "予約・受付システムの深い習熟",
      "患者情報管理の精度向上",
      "多職種との連携強化",
      "クレーム事例の共有と再発防止",
      "業務マニュアルの改善提案",
      "電話対応スクリプトの整備",
    ],
    q3: [
      "日常的な電話の取り次ぎ",
      "会計処理・レセプト補助",
      "FAX・郵便の処理",
      "待合室の案内・誘導",
      "診察券・書類の準備",
    ],
    q4: [
      "不要な書類の整理",
      "形骸化した窓口手続き",
      "過度な確認作業の繰り返し",
      "必要性の低い申し送り事項",
    ],
  },
  doctor: {
    q1: [
      "急変・重篤患者への即時対応判断",
      "緊急手術・処置の決定と実施",
      "インシデント発生時の医療判断",
      "感染症発生時の診断・指示",
      "患者急変時の家族への説明",
      "重大な副作用発生時の対処",
    ],
    q2: [
      "診療品質・技術の継続的向上",
      "最新医学知識・ガイドラインの習得",
      "スタッフへの医学的教育・指導",
      "診療プロトコルの見直し・整備",
      "患者との長期的な信頼関係構築",
      "学会・研究会への参加と発表",
      "地域医療連携の深化",
      "BCP・リスク管理体制の整備",
    ],
    q3: [
      "軽症・定型疾患の診察",
      "診断書・証明書の作成",
      "定期処方・処方更新",
      "検査オーダーの確認",
      "紹介状・返書の作成",
    ],
    q4: [
      "過剰な事務的書類作成",
      "不要な会議への参加",
      "重複した記録・入力作業",
      "効果の薄い形式的な回診",
    ],
  },
  manager: {
    q1: [
      "リスク・インシデント発生時の指揮",
      "急な人員不足への即時対応",
      "重大クレームの収束・対応",
      "スタッフ間トラブルの緊急調整",
      "外部機関（行政・監査）への対応",
      "緊急の診療体制変更の判断",
    ],
    q2: [
      "スタッフの育成・評価・面談",
      "組織文化・心理的安全性の醸成",
      "業務マニュアル・フローの整備",
      "4つの自信スコア向上施策の立案",
      "採用・オンボーディング体制整備",
      "多職種間の連携強化",
      "KPI設定とモニタリング体制",
      "ヒヤリハット文化の定着推進",
      "スタッフのキャリアパス設計",
    ],
    q3: [
      "定例承認・確認業務",
      "備品発注の承認",
      "軽微な問い合わせへの回答",
      "シフト調整の最終確認",
    ],
    q4: [
      "過剰な報告書の作成",
      "形骸化した手続き・会議",
      "すでに委任できる細かな判断",
      "不要なデータ収集・集計",
    ],
  },
  director: {
    q1: [
      "医療事故・重大インシデントの最終判断",
      "行政・保健所対応の指揮",
      "経営危機・資金繰り問題の即時対処",
      "重大クレーム・訴訟リスクへの対応",
      "感染症アウトブレイク時の診療体制判断",
      "キーパーソン急離職時の緊急対応",
    ],
    q2: [
      "中長期経営戦略・ビジョンの策定",
      "医療の質・患者安全体制の強化",
      "スタッフの働き方改革・待遇改善",
      "地域医療・他院との連携深化",
      "4つの自信を高める組織文化づくり",
      "新規サービス・診療科の検討",
      "設備投資・DX推進の計画立案",
      "人材採用ブランディングの強化",
      "収益構造の最適化と安定化",
    ],
    q3: [
      "定例の経営会議・スタッフ会議",
      "書類への署名・捺印",
      "軽微な対外的な挨拶・調整",
      "慣例的な行事・イベントの参加",
    ],
    q4: [
      "過剰な現場への細かい介入",
      "委任すべき日常業務の直接処理",
      "形骸化した報告書・会議",
      "効果の薄い業界行事への参加",
    ],
  },
  chairman: {
    q1: [
      "法人経営危機・倒産リスクへの対処",
      "重大な法令違反・行政処分への対応",
      "医療法人の重要な法的判断",
      "金融機関・投資家との緊急交渉",
      "重大な医療訴訟の最終対応方針",
      "拠点閉鎖・事業再編の緊急判断",
    ],
    q2: [
      "法人全体のビジョン・使命の明確化",
      "複数拠点・多角経営の戦略立案",
      "理事会・評議員会の運営と合意形成",
      "ガバナンス・コンプライアンス体制整備",
      "法人のブランド・社会的信頼の向上",
      "次世代リーダー・後継者の育成",
      "医療・介護・福祉の連携モデル構築",
      "地域社会への貢献・CSRの推進",
      "長期的な財務健全性の維持",
      "M&A・新規事業の戦略的検討",
    ],
    q3: [
      "法人の公式な対外的行事への出席",
      "定例の理事会・会議への参加",
      "慣例的な行政・医師会との交流",
      "書類への最終署名・押印",
    ],
    q4: [
      "個別施設の細かい運営への介入",
      "委任すべき現場業務の直接処理",
      "効果の薄い形式的な視察・会合",
      "過剰な報告書・書類の作成",
    ],
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
        {[
          { id:"nurse",       label:"看護師"    },
          { id:"receptionist",label:"受付"      },
          { id:"doctor",      label:"医師"      },
          { id:"manager",     label:"マネージャー" },
          { id:"director",    label:"院長"      },
          { id:"chairman",    label:"理事長"    },
        ].map((r) => (
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

/* ---- ヒヤリハットAI分析ボタン（NearMissPageから呼ぶ用） ---- */
function NearMissAiAnalysis({ reports }: { reports: Array<{ tag: string; body: string }> }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")

  const analyze = async () => {
    setLoading(true)
    setResult("")
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports }),
      })
      const data = await res.json()
      setResult(data.analysis || "分析に失敗しました。")
    } catch {
      setResult("通信エラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-2xl p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
            <span className="text-white text-sm">✨</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-violet-800">Gemini AI パターン分析</div>
            <div className="text-xs text-violet-400">蓄積された事例から改善提案を生成</div>
          </div>
        </div>
        <button onClick={analyze} disabled={loading || reports.length === 0}
          className="bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5">
          {loading ? "分析中..." : "✨ 分析する"}
        </button>
      </div>
      {result && (
        <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
          className="bg-white/80 rounded-xl p-3 text-xs text-violet-800 leading-relaxed border border-violet-100 whitespace-pre-wrap">
          {result}
        </motion.div>
      )}
    </div>
  )
}
