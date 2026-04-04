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
      // --- スキルアップ ---
      "看護技術・知識の継続的スキルアップ",
      "美容施術の知識・技術習得",
      "美容カウンセリングスキルの向上",
      "資格取得・外部研修への積極参加",
      // --- 人材育成 ---
      "後輩・新人スタッフのOJT指導",
      "新人向け業務手順の口頭・実技指導",
      "スタッフ間の技術・知識の共有会開催",
      "新人の不安を受け止めるメンター活動",
      // --- マニュアル作成 ---
      "担当業務の手順書・チェックリスト作成",
      "ヒヤリハット事例をもとにした改訂提案",
      "急変対応フローの定期的な見直し・更新",
      "美容処置マニュアルの整備・更新",
      // --- 患者・クリニック発展 ---
      "患者との信頼関係構築・継続的なケア",
      "リピーター患者との関係性構築",
      "SNS映えする院内環境づくりへの提案",
      "患者満足度向上のための工夫・提案",
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
      // --- スキルアップ ---
      "接遇・コミュニケーションスキルの向上",
      "予約・受付システムの深い習熟",
      "美容カウンセリングの基礎知識習得",
      "自費メニューの内容を正確に説明できる",
      // --- 人材育成 ---
      "新人受付スタッフへの窓口対応指導",
      "電話・来院対応のロールプレイング実施",
      "接遇マナーの院内勉強会への参加・企画",
      "クレーム対応事例の共有と後輩へのフィードバック",
      // --- マニュアル作成 ---
      "電話対応・受付フローのマニュアル整備",
      "よくある質問（FAQ）リストの作成・更新",
      "自費メニュー説明トークスクリプトの作成",
      "クレーム対応マニュアルの作成・改訂",
      // --- 患者・クリニック発展 ---
      "初診患者への丁寧なブランド体験の提供",
      "リピーター患者への特別な声かけ・関係構築",
      "SNS・口コミサイトの閲覧と院内共有",
      "美容皮膚科のトレンド情報の把握と共有",
      "患者情報管理の精度向上",
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
      // --- スキルアップ ---
      "診療品質・技術の継続的向上",
      "最新医学・美容医療知識の習得",
      "学会・美容医療研究会への参加と発表",
      "自費診療ブランドの専門性強化",
      // --- 人材育成 ---
      "スタッフへの医学的教育・勉強会開催",
      "看護師・受付への美容知識レクチャー",
      "新人スタッフへの診察補助指導",
      "スタッフの医療安全意識の育成",
      "次世代リーダー候補の見極めと育成",
      // --- マニュアル作成 ---
      "診療プロトコル・治療フローの整備",
      "美容施術マニュアルの作成・更新",
      "副作用・緊急時対応マニュアルの整備",
      "インフォームドコンセント資料の改善",
      "ビフォーアフター症例の蓄積・管理",
      // --- クリニック発展 ---
      "新メニュー・新技術の開発・導入検討",
      "患者との長期的な信頼関係構築",
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
      // --- 人材育成 ---
      "スタッフの個別育成計画（キャリアパス）の策定",
      "定期的な1on1面談の実施と記録",
      "スタッフの強み・弱みの把握と適材適所の配置",
      "新人オンボーディングプログラムの設計・運用",
      "スタッフ表彰・承認制度の企画・運用",
      "外部研修・資格取得の支援制度整備",
      "心理的安全性の高い職場文化の醸成",
      "4つの自信スコア向上施策の立案・実行",
      // --- マニュアル作成 ---
      "全業務マニュアルの体系的整備・更新管理",
      "職種別チェックリストの作成・定期見直し",
      "緊急対応・BCP（事業継続）マニュアルの整備",
      "新人研修カリキュラムの作成・改善",
      "業務効率化のための標準手順書（SOP）作成",
      // --- クリニック運営・発展 ---
      "KPI設定とモニタリング体制の構築",
      "患者満足度調査の設計・分析・改善",
      "採用戦略・求人・面接の企画・実施",
      "美容皮膚科マーケティング戦略の立案",
      "SNS運用方針・投稿ガイドラインの策定",
      "口コミ・レビュー管理と改善策の実施",
      "自費メニューの価格設定・改定の提案",
      "患者ロイヤルティ向上施策の企画",
      "スタッフのブランドアンバサダー育成",
      "多職種間の連携強化・チームビルディング",
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
      // --- 人材育成 ---
      "次世代リーダー・幹部候補の育成",
      "マネージャーへのコーチング・メンタリング",
      "医師・スタッフの専門性向上支援",
      "組織全体の学習文化・成長文化の醸成",
      "採用ブランディングと優秀人材の獲得戦略",
      "スタッフの4つの自信を高める仕組みづくり",
      // --- マニュアル・仕組み ---
      "クリニック全体の理念・行動指針の明文化",
      "組織図・役割分担・権限委譲の明確化",
      "医療安全・リスク管理体制の整備",
      "BCP（事業継続計画）の策定・見直し",
      "評価制度・給与体系の設計・改善",
      // --- クリニック運営・発展 ---
      "中長期経営戦略・ビジョンの策定",
      "美容皮膚科ブランドの確立・差別化戦略",
      "自費診療メニューのポートフォリオ最適化",
      "デジタルマーケティング戦略の方向性決定",
      "SNS・MEO・広告戦略の承認・監督",
      "VIP患者・リピーター向け特別施策の決定",
      "提携クリニック・エステとの連携検討",
      "設備投資・DX推進の計画立案",
      "財務管理・収益構造の最適化",
      "地域社会への貢献・ブランド信頼の向上",
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
      // --- 人材育成 ---
      "院長・幹部へのリーダーシップ教育",
      "法人全体の人事戦略・後継者育成計画",
      "理事・幹部の経営リテラシー向上支援",
      "法人の組織文化・理念の継承と発展",
      // --- マニュアル・ガバナンス ---
      "法人全体のガバナンス・コンプライアンス体制整備",
      "理事会・評議員会の運営規程の整備",
      "グループ全体のリスク管理・内部統制の構築",
      "各拠点の標準化・ベストプラクティスの横展開",
      // --- クリニック運営・発展 ---
      "法人全体のビジョン・使命の明確化と発信",
      "美容医療ブランドの法人全体戦略",
      "複数拠点・多角経営の戦略立案",
      "医療・美容・ウェルネスの連携モデル構築",
      "法人のブランド・社会的信頼の向上",
      "地域社会への貢献・CSRの推進",
      "長期的な財務健全性の維持",
      "M&A・新規事業の戦略的検討",
      "行政・医師会・業界団体との関係強化",
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
    { key: "q1", quadrantLabel: "第1象限", title: "重要かつ緊急", sub: "今すぐやる", cls: "bg-rose-50 border-rose-200 text-rose-700", dot: "text-rose-400", items: m.q1 },
    { key: "q2", quadrantLabel: "第2象限", title: "重要だが非緊急", sub: "計画してやる", cls: "bg-violet-50 border-violet-200 text-violet-700", dot: "text-violet-400", items: m.q2 },
    { key: "q3", quadrantLabel: "第3象限", title: "緊急だが非重要", sub: "委任できる", cls: "bg-amber-50 border-amber-200 text-amber-700", dot: "text-amber-400", items: m.q3 },
    { key: "q4", quadrantLabel: "第4象限", title: "非重要・非緊急", sub: "削減・排除", cls: "bg-slate-50 border-slate-200 text-slate-500", dot: "text-slate-400", items: m.q4 },
  ]
  return (
    <div style={{ padding: 24 }}>
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { id:"nurse",       label:"看護師"    },
          { id:"receptionist",label:"マルチタスク" },
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
            <div className="text-[10px] font-bold opacity-70 mb-0.5" style={{ letterSpacing: "0.06em" }}>{c.quadrantLabel}</div>
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
const STAFF_ACTIONS: { category: string; color: string; bg: string; actions: string[] }[] = [
  {
    category: "会社への自信を育む行動",
    color: "#5f4ba8", bg: "#f5f2fd",
    actions: [
      "クリニックのミッション・ビジョンを自分の言葉で説明できるようになる",
      "院長メッセージを毎週読み、自分の仕事との接点を考える",
      "「南草津皮フ科で働いていることが誇らしい」と感じられる瞬間を日記に記録する",
      "患者さんから「ありがとう」と言われた言葉を書き留める習慣をつくる",
      "クリニックの強み・他院との違いを3つ言えるようになる",
      "新しいスタッフや患者さんに、クリニックの良さを自然に伝えられるようにする",
    ],
  },
  {
    category: "職業への自信を育む行動",
    color: "#0f6e56", bg: "#e1f5ee",
    actions: [
      "担当する処置・施術の手順を完全に理解し、自信を持って実施できるようになる",
      "自分の職種に関連する資格取得・研修参加を年1回以上行う",
      "「この仕事をしていて良かった」と思えた瞬間を月1回振り返る",
      "先輩から技術を学ぶだけでなく、後輩に教えることで自分の理解を深める",
      "患者さんから指名・感謝された経験を自分の強みとして認識する",
      "5年後の自分のキャリアイメージを具体的に描いてみる",
      "今の仕事が社会にどんな価値を与えているか、言語化してみる",
    ],
  },
  {
    category: "商品への自信を育む行動",
    color: "#854f0b", bg: "#faeeda",
    actions: [
      "自分が担当する施術・サービスの仕組みと効果を、患者さんに説明できるレベルで理解する",
      "美容皮膚科の最新トレンドを月1回チェックし、院内で共有する",
      "自費メニューの料金・内容・他院との違いを正確に説明できるようにする",
      "「この施術を受けて本当に良かった」という患者さんの言葉を大切にする",
      "自分自身が施術を体験することで、患者さんの気持ちをより深く理解する",
      "施術後の患者さんの変化（表情・自信）を観察し、仕事の意義を感じる",
    ],
  },
  {
    category: "自分への自信を育む行動",
    color: "#993556", bg: "#fdf2f8",
    actions: [
      "毎日寝る前に「今日うまくできたこと」を1つ書き出す（小さなことでよい）",
      "失敗したときは「どうすれば良くなるか」を考え、自分を責めすぎない",
      "「私にはできない」という言葉を「どうすればできるか」に置き換える習慣をつける",
      "自分の強みを3つ書き出し、定期的に見直す",
      "Airに悩みを相談し、自分の考えを言語化する習慣をつくる",
      "コーチング記録でコミットメントを設定し、小さな約束を守り続ける",
      "感謝カードを送ること・受け取ることで、自己肯定感を育てる",
      "「他人と比べる」ではなく「昨日の自分と比べる」視点を持つ",
      "身体の健康（睡眠・食事・運動）が自信の土台であることを意識する",
    ],
  },
]

const MANAGER_ACTIONS: { category: string; color: string; bg: string; actions: string[] }[] = [
  {
    category: "会社への自信を高める組織施策",
    color: "#5f4ba8", bg: "#f5f2fd",
    actions: [
      "チームの発達段階（無関心期→様子見期→ぶつかり期→まとまり期→躍進期）を把握し、現在地に応じたアプローチをとる",
      "GRIPの原則（Goal・Role・Interpersonal Relationship・Process）でチームの土台を整える",
      "クリニックのビジョン・ミッションを自分の言葉でスタッフに伝え、仕事のゴールを共有する",
      "アチーブメントピラミッドを活用し、チーム全体の方向性を一致させる",
      "心理的安全性の高い職場をつくり、スタッフが意見を言いやすい環境を整える",
      "院内表彰・承認制度を設け、貢献したスタッフを具体的に称える文化をつくる",
      "月1回以上チーム全体でビジョンを振り返るミーティングを設ける",
    ],
  },
  {
    category: "職業への自信を高める人材育成施策（リードマネジメント8要素）",
    color: "#0f6e56", bg: "#e1f5ee",
    actions: [
      "【要素1】支援的な人間関係をつくる：まず相手の上質世界（価値観・欲求）を理解し、信頼関係を構築する",
      "【要素2】事実を話し合う：憶測や感情論ではなく、数字・行動・事実をもとに対話する",
      "【要素3】スタッフに自分の仕事を自己評価させる：「あなた自身はどう思いますか？」と問いかける習慣をつける",
      "【要素4】改善計画を一緒に取り決める：上から指示するのではなく、本人が決めた計画を支援する",
      "【要素5】しっかりした決意を取り付ける：「いつまでに・何を・どのように」を明確にしてコミットを引き出す",
      "【要素6】言い訳を受け入れず、仕事の話を建設的に進める：「では次にどうするか」に焦点を当てる",
      "【要素7】罰・批判せず責任を自覚させる：行動の結果を本人に気づかせ、自律的な責任感を育てる",
      "【要素8】簡単にスタッフのことをあきらめない：成長を信じ、粘り強く支援し続ける",
    ],
  },
  {
    category: "商品への自信を高める施策（選択理論×上質世界の活用）",
    color: "#854f0b", bg: "#faeeda",
    actions: [
      "スタッフの上質世界（最も大切にしている価値観・欲求）を把握し、仕事への意味づけを支援する",
      "上質世界に入る：スタッフが大切にしていることと、クリニックの商品・サービスを結びつける",
      "上質世界を拡張する：美容皮膚科の施術体験・勉強会・成功事例の共有で良質な情報と体験を提供する",
      "「4つの自信」（会社・職業・商品・自分）のどれが低下しているかを1on1で把握し、個別に対策する",
      "自費メニューの価値を心から信じられるよう、スタッフ自身が施術を体験する機会を設ける",
      "ビフォーアフター症例・患者さんの声を定期的に共有し、商品への誇りを育てる",
    ],
  },
  {
    category: "自分への自信を高める施策（RWDEPCコーチングサイクル）",
    color: "#993556", bg: "#fdf2f8",
    actions: [
      "【R：関係性の構築】月1回以上の1on1を実施し、仕事の現状・悩み・目標を丁寧に聞く",
      "【W：願望をつかむ】「あなたはどうなりたいですか？」「理想の状態はどんなイメージですか？」と問いかける",
      "【D：現在の行動に焦点】「今、何をしていますか？」と現状の行動を具体的に確認する",
      "【E：自己評価を促す】「その行動は、あなたの目標に近づいていますか？」と自己評価を引き出す",
      "【P：改善計画を支援】スタッフ自身が考えた改善計画を一緒に具体化する",
      "【C：決意を促す】「いつから始めますか？」と行動へのコミットメントを引き出す",
      "スタッフのはずみ車を回す：チャレンジ領域・キャリア領域に目標を設定し、成長を可視化する",
      "育成デザインを持つ：①育てたい人材像→②必要な能力→③タイムラインに落とし込む→④期待を伝え支援する",
    ],
  },
  {
    category: "タイムマネジメント・リスクマネジメント施策",
    color: "#1d4ed8", bg: "#eff6ff",
    actions: [
      "パレートの法則（80:20）を意識し、成果の80%を生む20%の優先事項に集中する",
      "第2象限（重要だが非緊急）の業務（人材育成・関係構築・戦略立案）に意識的に時間を配分する",
      "チームのプライオリティマネジメントを指導し、緊急度・重要度でタスクを分類する習慣をつける",
      "日本の上場企業が着目するリスク（災害・人材流出・情報漏えい・サイバー攻撃）に対してBCPを整備する",
      "週次・月次でリスクの現状確認とスタッフへの周知を行う",
      "1日の振り返り習慣（今日学んだこと・明日から実行すること）をチームに根づかせる",
    ],
  },
]

export function ConfidencePage({ userRole = "staff" }: { userRole?: string }) {
  const isManager = userRole === "admin" || userRole === "manager"
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
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, overflowX: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, width: "100%" }}>
        {scores.map((s) => (
          <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl`} style={{ minWidth: 0, overflow: "visible", padding: "16px 16px 12px 16px" }}>
            <div style={{ fontSize: 28, marginBottom: 8, lineHeight: 1 }}>{s.icon}</div>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        {scores.map((s) => (
          <div key={s.label} style={{ background: "var(--surface-bg)", borderRadius: 14, border: "0.5px solid var(--border-color)", overflow: "visible" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "0.5px solid var(--border-color)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{s.label}向上施策</span>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              {s.actions.map((a) => (
                <div key={a} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>
                  <span style={{ fontSize: 10, marginTop: 4, flexShrink: 0, color: "var(--text-secondary)" }}>▸</span>{a}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* 役職別セクション */}
      {isManager ? (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#4a4060", padding:"10px 14px", background:"var(--subtle-bg)", borderRadius:12, border:"1px solid rgba(124,101,204,0.2)" }}>
            👑 管理者・マネージャー専用：4つの自信を組織に根づかせる施策
          </div>
          {MANAGER_ACTIONS.map((section, si) => (
            <div key={si} style={{ background:"var(--surface-bg)", borderRadius:14, border:"1px solid rgba(124,101,204,0.12)", overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", background:section.bg, borderBottom:`1px solid ${section.color}22` }}>
                <div style={{ fontSize:12, fontWeight:600, color:section.color }}>{section.category}</div>
              </div>
              <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:6 }}>
                {section.actions.map((action, ai) => (
                  <div key={ai} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:section.color, marginTop:8, flexShrink:0 }} />
                    <p style={{ fontSize:13, color:"var(--text-primary)", margin:0, lineHeight:1.75 }}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#4a4060", padding:"10px 14px", background:"var(--subtle-bg)", borderRadius:12, border:"1px solid rgba(124,101,204,0.2)" }}>
            🌱 スタッフ向け：4つの自信を育む毎日の行動と考え方
          </div>
          {STAFF_ACTIONS.map((section, si) => (
            <div key={si} style={{ background:"var(--surface-bg)", borderRadius:14, border:"1px solid rgba(124,101,204,0.12)", overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", background:section.bg, borderBottom:`1px solid ${section.color}22` }}>
                <div style={{ fontSize:12, fontWeight:600, color:section.color }}>{section.category}</div>
              </div>
              <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:6 }}>
                {section.actions.map((action, ai) => (
                  <div key={ai} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:section.color, marginTop:8, flexShrink:0 }} />
                    <p style={{ fontSize:13, color:"var(--text-primary)", margin:0, lineHeight:1.75 }}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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
