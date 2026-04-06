"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, BookOpen, RotateCcw } from "lucide-react"
import { supabase } from "@/lib/supabase"

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

  const generateQuiz = async () => {
    setGenerating(true)
    let content = ""
    const srcInfo = SOURCES.find(s => s.id === source)
    setSourceLabel(srcInfo?.label || "")

    try {
      if (source === "roles") {
        content = ROLE_GUIDE_TEXT
      } else if (supabase && srcInfo?.table) {
        if (source === "manual") {
          const { data } = await supabase.from("manuals").select("title, content").limit(5)
          content = data?.map(d => `${d.title}: ${d.content}`).join("\n") || "業務マニュアルデータなし"
        } else if (source === "knowledge") {
          const { data } = await supabase.from("knowledge_base").select("title, content").limit(5)
          if (!data || data.length === 0) {
            // Zustandストアからのフォールバック
            content = "クリニック知識ベース：患者対応の基本、感染対策、クレーム対応、電話応対マナー"
          } else {
            content = data.map(d => `${d.title}: ${d.content}`).join("\n")
          }
        } else if (source === "risk") {
          content = "リスク管理：針刺し事故防止、薬品管理、個人情報保護、災害時対応、転倒防止、感染症対策、アレルギー対応、医療廃棄物処理"
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

    // 自動で次へ or 結果
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1)
        setShowAnswer(false)
      } else {
        saveResult(newAnswers)
        setScreen("result")
      }
    }, 2000)
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
    if (!supabase) return
    const score = questions.filter((q, i) => finalAnswers[i] === q.answer).length
    await supabase.from("quiz_sessions").insert({
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
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        {/* 進捗バー */}
        <div style={{ height: 6, borderRadius: 3, background: "var(--subtle-bg)", marginBottom: 16, overflow: "hidden" }}>
          <motion.div animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} style={{ height: "100%", background: "linear-gradient(90deg, #b8975a, #d4b87a)", borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 16, textAlign: "right" }}>
          {currentQ + 1} / {questions.length}
        </div>

        <div style={{ ...card, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20, lineHeight: 1.6 }}>{q.question}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.choices.map((choice, ci) => {
              const letter = String.fromCharCode(65 + ci) // A, B, C, D
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
                <motion.button key={ci} whileTap={{ scale: 0.97 }} onClick={() => selectAnswer(letter)} disabled={showAnswer} style={{ width: "100%", textAlign: "left", padding: "12px 16px", borderRadius: 12, background: bg, border, color, fontSize: 13, cursor: showAnswer ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}>
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

          {showAnswer && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 14, padding: 12, borderRadius: 10, background: isCorrect ? "#f0fdf4" : "#fef2f2", fontSize: 12, lineHeight: 1.6, color: isCorrect ? "#166534" : "#991b1b" }}>
              {isCorrect ? "✅ 正解！" : "❌ 不正解..."} {q.explanation}
            </motion.div>
          )}

          {!showAnswer && (
            <button onClick={skipQuestion} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(124,101,204,0.2)", background: "transparent", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
              わからない（スキップ）
            </button>
          )}
        </div>
      </div>
    )
  }

  // 結果画面
  if (screen === "result") {
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        <div style={{ ...card, padding: 32, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>{pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "📚"}</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: pct >= 80 ? "#22c55e" : pct >= 60 ? "#b8975a" : "#ef4444" }}>{pct}%</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>{correctCount} / {questions.length} 問正解</div>
        </div>

        {/* 問題ごとの結果 */}
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>復習</div>
          {questions.map((q, i) => {
            const correct = answers[i] === q.answer
            return (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--subtle-bg)", display: "flex", gap: 8 }}>
                <span>{correct ? "✅" : "❌"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5 }}>{q.question}</div>
                  {!correct && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>正解: {q.answer} — {q.explanation}</div>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setScreen("setup"); setQuestions([]); setAnswers([]) }} style={{ flex: 1, padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
            <RotateCcw size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> 別のテストへ
          </button>
          <button onClick={() => onNavigate("manual")} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(124,101,204,0.2)", background: "var(--surface-bg)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <BookOpen size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> マニュアルを読む
          </button>
        </div>
      </div>
    )
  }

  return null
}
