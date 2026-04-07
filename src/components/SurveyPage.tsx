"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, Star, MessageSquare } from "lucide-react"
import { supabase } from "@/lib/supabase"
import dynamic from "next/dynamic"

const LineChart = dynamic(() => import("recharts").then(m => ({ default: m.LineChart })), { ssr: false })
const Line = dynamic(() => import("recharts").then(m => ({ default: m.Line })), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => ({ default: m.XAxis })), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => ({ default: m.YAxis })), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then(m => ({ default: m.CartesianGrid })), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(m => ({ default: m.Tooltip })), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })), { ssr: false })
const BarChart = dynamic(() => import("recharts").then(m => ({ default: m.BarChart })), { ssr: false })
const Bar = dynamic(() => import("recharts").then(m => ({ default: m.Bar })), { ssr: false })

interface SurveyPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
}

interface Question { id: string; content: string; order_index: number; is_active: boolean }
interface Response { id: string; year_month: string; question_id: string; score: number; comment: string | null }

const card: React.CSSProperties = {
  background: "var(--surface-bg)", borderRadius: 16,
  border: "1px solid rgba(100,80,180,0.13)",
  boxShadow: "0 1px 4px rgba(60,40,120,0.07)",
}

const SCORE_LABELS: Record<number, string> = {
  1: "とても不満",
  2: "不満",
  3: "普通",
  4: "満足",
  5: "とても満足",
}

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// スパークルアニメーション
const SparkleEffect = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1.5, 0], opacity: [1, 0.8, 0] }}
        transition={{ duration: 0.6, delay: i * 0.05 }}
        style={{
          position: "absolute",
          width: 6, height: 6, borderRadius: "50%",
          background: "#b8975a",
          top: `${20 + Math.random() * 60}%`,
          left: `${20 + Math.random() * 60}%`,
          pointerEvents: "none",
        }}
      />
    ))}
  </>
)

export default function SurveyPage({ userRole, currentUserStaffId }: SurveyPageProps) {
  const isManager = userRole === "admin" || userRole === "manager"
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [answered, setAnswered] = useState(false)
  const [answers, setAnswers] = useState<Record<string, { score: number; comment: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [totalStaff, setTotalStaff] = useState(0)
  const [respondentCount, setRespondentCount] = useState(0)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [sparkleQ, setSparkleQ] = useState<string | null>(null)
  const ym = currentYearMonth()

  const fetchData = useCallback(async () => {
    const sb = supabase
    if (!sb) return
    setLoading(true)
    const [{ data: qs }, { data: rs }, { data: resp }, { data: staff }] = await Promise.all([
      sb.from("survey_questions").select("*").eq("is_active", true).order("order_index"),
      sb.from("survey_responses").select("*"),
      sb.from("survey_respondents").select("*").eq("year_month", ym).eq("staff_id", currentUserStaffId),
      sb.from("staff").select("id"),
    ])
    if (qs) setQuestions(qs)
    if (rs) setResponses(rs)
    if (resp && resp.length > 0) setAnswered(true)
    if (staff) setTotalStaff(staff.length)

    const { count } = await sb.from("survey_respondents").select("*", { count: "exact", head: true }).eq("year_month", ym)
    setRespondentCount(count || 0)

    setLoading(false)
  }, [ym, currentUserStaffId])

  useEffect(() => { fetchData() }, [fetchData])

  const submitSurvey = async () => {
    const sb = supabase
    if (!sb) return
    setSubmitting(true)
    const inserts = questions.map(q => ({
      year_month: ym,
      question_id: q.id,
      score: answers[q.id]?.score || 3,
      comment: answers[q.id]?.comment || null,
    }))
    await sb.from("survey_responses").insert(inserts)
    await sb.from("survey_respondents").insert({ year_month: ym, staff_id: currentUserStaffId })
    setSubmitted(true)
    setSubmitting(false)
    await fetchData()
  }

  // 月別平均データ（useMemo）
  const monthlyChartData = useMemo(() => {
    const months = [...new Set(responses.map(r => r.year_month))].sort().slice(-6)
    return months.map(m => {
      const monthResponses = responses.filter(r => r.year_month === m)
      const avg = monthResponses.length > 0 ? (monthResponses.reduce((s, r) => s + r.score, 0) / monthResponses.length) : 0
      return { month: m.slice(5) + "月", avg: Math.round(avg * 10) / 10 }
    })
  }, [responses])

  // 設問別平均（今月）
  const questionAvgs = useMemo(() => questions.map(q => {
    const qResponses = responses.filter(r => r.year_month === ym && r.question_id === q.id)
    const avg = qResponses.length > 0 ? (qResponses.reduce((s, r) => s + r.score, 0) / qResponses.length) : 0
    return { name: q.content.slice(0, 10) + "…", avg: Math.round(avg * 10) / 10, full: q.content }
  }), [questions, responses, ym])

  // 今月のコメント
  const monthComments = useMemo(() =>
    responses.filter(r => r.year_month === ym && r.comment).map(r => r.comment!),
    [responses, ym]
  )

  // 前月比の計算
  const prevMonthAvg = useMemo(() => {
    if (monthlyChartData.length < 2) return null
    return monthlyChartData[monthlyChartData.length - 2]?.avg ?? null
  }, [monthlyChartData])

  const currentMonthAvg = useMemo(() => {
    if (monthlyChartData.length < 1) return null
    return monthlyChartData[monthlyChartData.length - 1]?.avg ?? null
  }, [monthlyChartData])

  const analyzeWithAir = async () => {
    setAiLoading(true)
    try {
      const monthCompare = prevMonthAvg !== null && currentMonthAvg !== null
        ? `\n前月平均: ${prevMonthAvg}, 今月平均: ${currentMonthAvg}（${currentMonthAvg > prevMonthAvg ? "上昇" : currentMonthAvg < prevMonthAvg ? "下降" : "横ばい"}）`
        : ""
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `あなたは南草津皮フ科クリニックの組織開発アドバイザーです。\n今月のエンゲージメントスコア（設問別平均）を分析し、チームの状態・注目すべき点・マネージャーへの具体的なアドバイスを300字以内でコメントしてください。${monthCompare}\n設問別データ：${JSON.stringify(questionAvgs)}\nフリーコメント：${monthComments.join("／")}` }],
          currentPage: "survey", userRole,
        }),
      })
      setAiAnalysis(await res.text())
    } catch { setAiAnalysis("分析に失敗しました。") }
    setAiLoading(false)
  }

  const handleStarClick = (qId: string, score: number) => {
    setAnswers(p => ({ ...p, [qId]: { ...p[qId], score, comment: p[qId]?.comment || "" } }))
    setSparkleQ(qId)
    setTimeout(() => setSparkleQ(null), 600)
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* スタッフビュー：回答 */}
      {!isManager && (
        <>
          {(answered || submitted) ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...card, padding: 40, textAlign: "center", marginBottom: 20, position: "relative", overflow: "hidden" }}>
              {/* 紙吹雪 */}
              {submitted && Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -10, opacity: 1 }}
                  animate={{ y: 300, opacity: 0, x: (Math.random() - 0.5) * 100 }}
                  transition={{ duration: 2, delay: i * 0.1 }}
                  style={{
                    position: "absolute", top: 0, left: `${10 + i * 7}%`,
                    width: 6, height: 6, borderRadius: 1,
                    background: ["#b8975a", "#f472b6", "#22c55e", "#3b82f6"][i % 4],
                    pointerEvents: "none",
                  }}
                />
              ))}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                style={{ fontSize: 56, marginBottom: 12 }}
              >
                🌸
              </motion.div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#b8975a" }}>ありがとうございました🌸</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>回答は匿名で集計されます</div>
            </motion.div>
          ) : (
            <div style={{ ...card, padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>📊 {ym.replace("-", "年")}月 エンゲージメントサーベイ</h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20 }}>匿名で回答されます。正直にお答えください。</p>
              {questions.map((q, qi) => (
                <div key={q.id} style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: "var(--subtle-bg)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>Q{qi + 1}. {q.content}</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4, position: "relative" }}>
                    {sparkleQ === q.id && <SparkleEffect />}
                    {[1, 2, 3, 4, 5].map(n => (
                      <motion.button
                        key={n}
                        whileTap={{ scale: 0.85 }}
                        animate={(answers[q.id]?.score || 0) >= n ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleStarClick(q.id, n)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                      >
                        <Star size={28} fill={(answers[q.id]?.score || 0) >= n ? "#b8975a" : "none"} stroke={(answers[q.id]?.score || 0) >= n ? "#b8975a" : "#d1d5db"} style={{ transition: "all 0.15s" }} />
                      </motion.button>
                    ))}
                  </div>
                  {/* スコアラベル */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-secondary)", padding: "0 4px", marginBottom: 8 }}>
                    <span>1:とても不満</span>
                    <span>3:普通</span>
                    <span>5:とても満足</span>
                  </div>
                  {answers[q.id]?.score && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 11, color: "#b8975a", fontWeight: 600, marginBottom: 6 }}>
                      {SCORE_LABELS[answers[q.id].score]}
                    </motion.div>
                  )}
                  <input placeholder="コメント（任意）" style={{ width: "100%", border: "1px solid rgba(124,101,204,0.15)", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "var(--text-primary)", background: "var(--surface-bg)", outline: "none", fontFamily: "inherit" }} value={answers[q.id]?.comment || ""} onChange={e => setAnswers(p => ({ ...p, [q.id]: { ...p[q.id], score: p[q.id]?.score || 3, comment: e.target.value } }))} />
                </div>
              ))}
              <button onClick={submitSurvey} disabled={submitting || questions.some(q => !answers[q.id]?.score)} style={{ width: "100%", padding: 14, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "送信中..." : "📨 送信する"}
              </button>
            </div>
          )}
        </>
      )}

      {/* マネージャービュー */}
      {isManager && (
        <>
          {/* 回答率 */}
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>今月の回答率</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{ym.replace("-", "年")}月</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#b8975a" }}>
                {totalStaff > 0 ? Math.round((respondentCount / totalStaff) * 100) : 0}%
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{respondentCount} / {totalStaff} 名回答</div>
            {/* 前月比 */}
            {prevMonthAvg !== null && currentMonthAvg !== null && (
              <div style={{ fontSize: 11, marginTop: 6, color: currentMonthAvg >= prevMonthAvg ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                {currentMonthAvg >= prevMonthAvg ? "▲" : "▼"} 前月比 {Math.abs(currentMonthAvg - prevMonthAvg).toFixed(1)}pt {currentMonthAvg >= prevMonthAvg ? "上昇" : "下降"}
              </div>
            )}
          </div>

          {/* 設問別平均 */}
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>設問別スコア（今月）</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={questionAvgs}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,101,204,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}`, "平均"]} />
                <Bar dataKey="avg" fill="#b8975a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 月別トレンド */}
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>月別トレンド（過去6ヶ月）</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,101,204,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}`, "平均スコア"]} />
                <Line type="monotone" dataKey="avg" stroke="#b8975a" strokeWidth={2} dot={{ fill: "#b8975a", r: 4 }} activeDot={{ r: 6, fill: "#d4b87a" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* フリーコメント */}
          {monthComments.length > 0 && (
            <div style={{ ...card, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                <MessageSquare size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                フリーコメント（匿名）
              </h3>
              {monthComments.map((c, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "var(--subtle-bg)", marginBottom: 6, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>
                  {c}
                </div>
              ))}
            </div>
          )}

          {/* AI分析 */}
          <button onClick={analyzeWithAir} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
            Airに今月の傾向をコメントしてもらう
          </button>
          {aiAnalysis && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, ...card, padding: 16, fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {aiAnalysis}
            </motion.div>
          )}
        </>
      )}

      {/* 全員：月別トレンド */}
      {!isManager && (answered || submitted) && (
        <div style={{ ...card, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>チーム全体の月別平均スコア</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,101,204,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}`, "平均スコア"]} />
              <Line type="monotone" dataKey="avg" stroke="#b8975a" strokeWidth={2} dot={{ fill: "#b8975a", r: 4 }} activeDot={{ r: 6, fill: "#d4b87a" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
