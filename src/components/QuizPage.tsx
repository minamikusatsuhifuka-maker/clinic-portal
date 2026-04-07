"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, BookOpen, RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAppStore } from "@/store/useAppStore"

interface QuizPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
  onNavigate: (page: string) => void
}

interface QuizQuestion {
  question: string
  choices: string[]
  answer: string
  explanation: string
}

const card: React.CSSProperties = {
  background: "var(--surface-bg)", borderRadius: 16,
  border: "1px solid rgba(100,80,180,0.13)",
  boxShadow: "0 1px 4px rgba(60,40,120,0.07)",
}

const SOURCES = [
  { id: "manual", label: "📖 業務マニュアル", table: "manuals" },
  { id: "knowledge", label: "📚 知識ベース", table: "knowledge" },
  { id: "risk", label: "⚠️ リスク管理", table: "risks" },
  { id: "roles", label: "📋 役職ガイド", table: null },
]

const ROLE_GUIDE_TEXT = `南草津皮フ科クリニックの役職ガイド：
受付：患者様の受付・会計・電話対応・予約管理
看護師：処置補助・患者説明・衛生管理・点滴管理
医療事務：レセプト・カルテ管理・保険請求・書類作成
クラーク：院内案内・検査補助・患者呼出・在庫管理
リーダー：チーム統率・新人育成・業務改善提案
マネージャー：スタッフ面談・シフト管理・理念浸透`

// ランク判定
const getRank = (pct: number): { rank: string; emoji: string; color: string; label: string } => {
  if (pct >= 90) return { rank: "S", emoji: "👑", color: "#b8975a", label: "素晴らしい！完璧に近いです" }
  if (pct >= 70) return { rank: "A", emoji: "🎉", color: "#22c55e", label: "よくできました！" }
  if (pct >= 50) return { rank: "B", emoji: "👍", color: "#3b82f6", label: "まずまずです" }
  if (pct >= 30) return { rank: "C", emoji: "📖", color: "#f59e0b", label: "もう少し頑張りましょう" }
  return { rank: "D", emoji: "📚", color: "#ef4444", label: "マニュアルを復習しましょう" }
}

export default function QuizPage({ userRole, currentUserStaffId, onNavigate }: QuizPageProps) {
  const [screen, setScreen] = useState<"setup" | "quiz" | "result">("setup")
  const [source, setSource] = useState("manual")
  const [count, setCount] = useState(5)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [generating, setGenerating] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [sourceLabel, setSourceLabel] = useState("")
  const [showWrongList, setShowWrongList] = useState(false)
  const { setActivePage } = useAppStore()

  const generateQuiz = async () => {
    setGenerating(true)
    let content = ""
    const srcInfo = SOURCES.find(s => s.id === source)
    setSourceLabel(srcInfo?.label || "")

    try {
      if (source === "roles") {
        content = ROLE_GUIDE_TEXT
      } else {
        const sb = supabase
        if (sb && srcInfo?.table) {
          if (source === "manual") {
            const { data } = await sb.from("manuals").select("title, content").limit(5)
            content = data?.map(d => `${d.title}: ${d.content}`).join("\n") || "業務マニュアルデータなし"
          } else if (source === "knowledge") {
            const { data } = await sb.from("knowledge_base").select("title, content").limit(5)
            if (!data || data.length === 0) {
              content = "クリニック知識ベース：患者対応の基本、感染対策、クレーム対応、電話応対マナー"
            } else {
              content = data.map(d => `${d.title}: ${d.content}`).join("\n")
            }
          } else if (source === "risk") {
            content = "リスク管理：針刺し事故防止、薬品管理、個人情報保護、災害時対応、転倒防止、感染症対策、アレルギー対応、医療廃棄物処理"
          }
        }
      }

      if (!content) content = "南草津皮フ科クリニックの基本業務知識：受付対応、患者案内、電話応対、会計処理、感染対策"

      const res = await fetch("/api/quiz-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: source, source_content: content, count }),
      })
      const data = await res.json()
      if (data.questions) {
        setQuestions(data.questions)
        setAnswers(new Array(data.questions.length).fill(null))
        setCurrentQ(0)
        setShowAnswer(false)
        setScreen("quiz")
      }
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const selectAnswer = (choice: string) => {
    if (showAnswer) return
    const newAnswers = [...answers]
    newAnswers[currentQ] = choice
    setAnswers(newAnswers)
    setShowAnswer(true)

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1)
        setShowAnswer(false)
      } else {
        saveResult(newAnswers)
        setScreen("result")
      }
    }, 2500)
  }

  const skipQuestion = () => {
    const newAnswers = [...answers]
    newAnswers[currentQ] = null
    setAnswers(newAnswers)
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      saveResult(newAnswers)
      setScreen("result")
    }
  }

  const saveResult = async (finalAnswers: (string | null)[]) => {
    const sb = supabase
    if (!sb) return
    const score = questions.filter((q, i) => finalAnswers[i] === q.answer).length
    await sb.from("quiz_sessions").insert({
      staff_id: currentUserStaffId,
      source_type: source,
      source_label: sourceLabel,
      questions: questions,
      answers: finalAnswers,
      score,
      completed_at: new Date().toISOString(),
    })
  }

  const correctCount = questions.filter((q, i) => answers[i] === q.answer).length
  const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
  const wrongQuestions = questions.map((q, i) => ({ ...q, index: i })).filter((q, i) => answers[i] !== q.answer)

  // 設定画面
  if (screen === "setup") {
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>📝 知識確認ミニテスト</h2>

        <div style={{ ...card, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>出題ソース</div>
            {SOURCES.map(s => (
              <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", cursor: "pointer" }}>
                <input type="radio" name="source" checked={source === s.id} onChange={() => setSource(s.id)} style={{ accentColor: "#b8975a" }} />
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{s.label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>出題数</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[5, 10, 20].map(n => (
                <button key={n} onClick={() => setCount(n)} style={{ padding: "8px 20px", borderRadius: 10, border: count === n ? "2px solid #b8975a" : "1px solid rgba(124,101,204,0.2)", background: count === n ? "#b8975a15" : "transparent", color: count === n ? "#b8975a" : "var(--text-secondary)", fontSize: 13, fontWeight: count === n ? 700 : 400, cursor: "pointer" }}>
                  {n}問
                </button>
              ))}
            </div>
          </div>

          <button onClick={generateQuiz} disabled={generating} style={{ width: "100%", padding: 14, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", opacity: generating ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {generating ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> AIがクイズを生成中...</> : "🧠 AIがクイズを生成する"}
          </button>
        </div>
      </div>
    )
  }

  // クイズ画面
  if (screen === "quiz" && questions[currentQ]) {
    const q = questions[currentQ]
    const isCorrect = answers[currentQ] === q.answer
    const isWrong = showAnswer && !isCorrect
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        {/* 進捗バー（アニメーション付き） */}
        <div style={{ height: 8, borderRadius: 4, background: "var(--subtle-bg)", marginBottom: 16, overflow: "hidden" }}>
          <motion.div
            initial={{ width: `${(currentQ / questions.length) * 100}%` }}
            animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ height: "100%", background: "linear-gradient(90deg, #b8975a, #d4b87a)", borderRadius: 4 }}
          />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 16, textAlign: "right" }}>
          {currentQ + 1} / {questions.length}
        </div>

        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={isWrong ? { opacity: 1, x: [0, -8, 8, -4, 4, 0] } : { opacity: 1, x: 0 }}
          transition={isWrong ? { duration: 0.5 } : { duration: 0.3 }}
          style={{ ...card, padding: 24, background: showAnswer ? (isCorrect ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)") : "var(--surface-bg)" }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20, lineHeight: 1.6 }}>{q.question}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.choices.map((choice, ci) => {
              const letter = String.fromCharCode(65 + ci)
              const isSelected = answers[currentQ] === letter
              const isRight = letter === q.answer
              let bg = "var(--subtle-bg)"
              let border = "1px solid rgba(124,101,204,0.15)"
              let color = "var(--text-primary)"
              if (showAnswer) {
                if (isRight) { bg = "#dcfce7"; border = "2px solid #22c55e"; color = "#166534" }
                else if (isSelected && !isRight) { bg = "#fef2f2"; border = "2px solid #ef4444"; color = "#991b1b" }
              }

              return (
                <motion.button
                  key={ci}
                  whileTap={{ scale: 0.97 }}
                  animate={showAnswer && isRight ? { scale: [1, 1.02, 1] } : {}}
                  onClick={() => selectAnswer(letter)}
                  disabled={showAnswer}
                  style={{ width: "100%", textAlign: "left", padding: "12px 16px", borderRadius: 12, background: bg, border, color, fontSize: 13, cursor: showAnswer ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}
                >
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: isSelected ? "#b8975a" : "var(--surface-bg)", color: isSelected ? "white" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, border: "1px solid rgba(124,101,204,0.15)" }}>
                    {letter}
                  </span>
                  {choice}
                  {showAnswer && isRight && <CheckCircle2 size={16} style={{ marginLeft: "auto", color: "#22c55e" }} />}
                  {showAnswer && isSelected && !isRight && <XCircle size={16} style={{ marginLeft: "auto", color: "#ef4444" }} />}
                </motion.button>
              )
            })}
          </div>

          {/* 解説カード（スライドイン） */}
          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 16, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3 }}
                style={{ marginTop: 14, padding: 14, borderRadius: 12, background: isCorrect ? "#f0fdf4" : "#fef2f2", border: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}`, fontSize: 12, lineHeight: 1.7, color: isCorrect ? "#166534" : "#991b1b" }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{isCorrect ? "✅ 正解！" : `❌ 不正解 — 正解は ${q.answer}`}</div>
                <div>{q.explanation}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showAnswer && (
            <button onClick={skipQuestion} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(124,101,204,0.2)", background: "transparent", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
              わからない（スキップ）
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  // 結果画面
  if (screen === "result") {
    const rankInfo = getRank(pct)
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...card, padding: 32, textAlign: "center", marginBottom: 16 }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.8 }}
            style={{ fontSize: 64, marginBottom: 8 }}
          >
            {rankInfo.emoji}
          </motion.div>
          {/* ランクバッジ */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            style={{
              display: "inline-block", width: 56, height: 56, lineHeight: "56px",
              borderRadius: "50%", fontSize: 28, fontWeight: 900,
              background: `linear-gradient(135deg, ${rankInfo.color}, ${rankInfo.color}99)`,
              color: "white", marginBottom: 8,
              boxShadow: `0 4px 12px ${rankInfo.color}40`,
            }}
          >
            {rankInfo.rank}
          </motion.div>
          <div style={{ fontSize: 36, fontWeight: 800, color: rankInfo.color }}>{pct}%</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>{correctCount} / {questions.length} 問正解</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: rankInfo.color, marginTop: 8 }}>{rankInfo.label}</div>
        </motion.div>

        {/* 間違えた問題（折りたたみ） */}
        {wrongQuestions.length > 0 && (
          <div style={{ ...card, padding: 16, marginBottom: 16 }}>
            <button
              onClick={() => setShowWrongList(!showWrongList)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>❌ 間違えた問題（{wrongQuestions.length}問）</span>
              {showWrongList ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
            </button>
            <AnimatePresence>
              {showWrongList && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  {wrongQuestions.map((q) => (
                    <div key={q.index} style={{ padding: "10px 0", borderBottom: "1px solid var(--subtle-bg)" }}>
                      <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 4 }}>
                        Q{q.index + 1}. {q.question}
                      </div>
                      <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 2 }}>
                        あなたの回答: {answers[q.index] || "スキップ"} → 正解: {q.answer}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "4px 8px", borderRadius: 6, background: "var(--subtle-bg)", marginTop: 4 }}>
                        💡 {q.explanation}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 正解した問題 */}
        {correctCount > 0 && (
          <div style={{ ...card, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>✅ 正解した問題（{correctCount}問）</div>
            {questions.filter((q, i) => answers[i] === q.answer).map((q, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--subtle-bg)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {q.question}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setScreen("setup"); setQuestions([]); setAnswers([]); setShowWrongList(false) }} style={{ flex: 1, padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <RotateCcw size={14} /> 別のテストへ
          </button>
          <button onClick={() => onNavigate("manual")} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(124,101,204,0.2)", background: "var(--surface-bg)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <BookOpen size={14} /> マニュアルを読む
          </button>
        </div>
      </div>
    )
  }

  return null
}
