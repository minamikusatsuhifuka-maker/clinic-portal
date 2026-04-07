"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Send, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import dynamic from "next/dynamic"

const RadarChart = dynamic(() => import("recharts").then(m => ({ default: m.RadarChart })), { ssr: false })
const PolarGrid = dynamic(() => import("recharts").then(m => ({ default: m.PolarGrid })), { ssr: false })
const PolarAngleAxis = dynamic(() => import("recharts").then(m => ({ default: m.PolarAngleAxis })), { ssr: false })
const PolarRadiusAxis = dynamic(() => import("recharts").then(m => ({ default: m.PolarRadiusAxis })), { ssr: false })
const Radar = dynamic(() => import("recharts").then(m => ({ default: m.Radar })), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })), { ssr: false })

interface RolePlayPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
}

interface Scenario {
  id: string; category: string; difficulty: "easy" | "medium" | "hard"
  title: string; patient_setting: string; opening_line: string; system_prompt: string
}
interface ChatMessage { role: "user" | "assistant"; content: string; time?: string }
interface Evaluation {
  scores: { language: number; empathy: number; accuracy: number; resolution: number }
  total?: number; good_points: string; improvements: string; best_line?: string; level?: string
}
interface Session {
  id: string; scenario_id: string; evaluation: Evaluation | null; completed_at: string | null
}

const card: React.CSSProperties = {
  background: "var(--surface-bg)", borderRadius: 16,
  border: "1px solid rgba(100,80,180,0.13)",
  boxShadow: "0 1px 4px rgba(60,40,120,0.07)",
}

const DIFFICULTY = { easy: { label: "初級🟢", color: "#22c55e" }, medium: { label: "中級🟡", color: "#eab308" }, hard: { label: "上級🔴", color: "#ef4444" } }
const CAT_ICON: Record<string, string> = { "初診受付": "🏥", "会計説明": "💴", "クレーム対応": "⚡", "電話応対": "📞", "処置説明": "💉" }
const CATEGORIES = ["初診受付", "会計説明", "クレーム対応", "電話応対", "処置説明"]
const LEVEL_COLOR: Record<string, string> = { S: "#b8975a", A: "#22c55e", B: "#3b82f6", C: "#eab308", D: "#ef4444" }

const now = () => new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })

// タイピングインジケーター
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 16px", alignItems: "center" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>👤</div>
      <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "#fef9ee", display: "flex", gap: 4 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#b8975a" }} />
        ))}
      </div>
    </div>
  )
}

export default function RolePlayPage({ userRole, currentUserStaffId }: RolePlayPageProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<"select" | "play" | "result">("select")
  const [catFilter, setCatFilter] = useState("")
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // ロールプレイ中
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showSetting, setShowSetting] = useState(true)

  // 評価
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [scoreAnimated, setScoreAnimated] = useState(0)

  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const [{ data: sc }, { data: se }] = await Promise.all([
      supabase.from("roleplay_scenarios").select("*").eq("is_active", true),
      supabase.from("roleplay_sessions").select("id, scenario_id, evaluation, completed_at").eq("staff_id", currentUserStaffId).order("created_at", { ascending: false }).limit(20),
    ])
    if (sc) setScenarios(sc)
    if (se) setSessions(se as Session[])
    setLoading(false)
  }, [currentUserStaffId])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, sending])

  // スコアカウントアップアニメーション
  useEffect(() => {
    if (screen !== "result" || !evaluation) return
    const target = evaluation.total || ((evaluation.scores.language + evaluation.scores.empathy + evaluation.scores.accuracy + evaluation.scores.resolution) / 4)
    let current = 0
    const interval = setInterval(() => {
      current += 0.1
      if (current >= target) { setScoreAnimated(Math.round(target * 10) / 10); clearInterval(interval) }
      else setScoreAnimated(Math.round(current * 10) / 10)
    }, 30)
    return () => clearInterval(interval)
  }, [screen, evaluation])

  const startScenario = async (scenario: Scenario) => {
    setActiveScenario(scenario)
    const opening: ChatMessage = { role: "assistant", content: scenario.opening_line, time: now() }
    setMessages([opening])
    setScreen("play")
    setEvaluation(null)
    if (supabase) {
      const { data } = await supabase.from("roleplay_sessions").insert({
        staff_id: currentUserStaffId, scenario_id: scenario.id, messages: [opening],
      }).select("id").single()
      if (data) setSessionId(data.id)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeScenario || sending) return
    const userMsg: ChatMessage = { role: "user", content: input.trim(), time: now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/roleplay-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role === "user" ? "user" : "model", content: m.content })),
          system_prompt: activeScenario.system_prompt,
        }),
      })
      // ストリーミング読み取り
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += decoder.decode(value, { stream: true })
          setMessages([...newMessages, { role: "assistant", content: fullText, time: now() }])
        }
      }
      const final: ChatMessage[] = [...newMessages, { role: "assistant", content: fullText || "…", time: now() }]
      setMessages(final)
      if (supabase && sessionId) {
        await supabase.from("roleplay_sessions").update({ messages: final }).eq("id", sessionId)
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "すみません、聞き取れませんでした…", time: now() }])
    }
    setSending(false)
  }

  const evaluate = async () => {
    if (!activeScenario) return
    setEvaluating(true)
    try {
      const res = await fetch("/api/roleplay-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, scenario: activeScenario }),
      })
      const data = await res.json()
      setEvaluation(data)
      if (supabase && sessionId) {
        await supabase.from("roleplay_sessions").update({ evaluation: data, completed_at: new Date().toISOString() }).eq("id", sessionId)
      }
      setScreen("result")
    } catch { /* ignore */ }
    setEvaluating(false)
  }

  const getBestScore = (scenarioId: string) => {
    const completed = sessions.filter(s => s.scenario_id === scenarioId && s.evaluation)
    if (completed.length === 0) return null
    return completed.reduce((max, s) => {
      const e = s.evaluation!
      const avg = e.total || (e.scores.language + e.scores.empathy + e.scores.accuracy + e.scores.resolution) / 4
      return avg > max ? avg : max
    }, 0)
  }

  const userTurns = messages.filter(m => m.role === "user").length

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

  // シナリオ選択
  if (screen === "select") {
    const filtered = catFilter ? scenarios.filter(s => s.category === catFilter) : scenarios
    const activeCats = [...new Set(scenarios.map(s => s.category))]
    return (
      <div style={{ padding: 24, maxWidth: 800 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>🎭 AIロールプレイ — シナリオ選択</h2>
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setCatFilter("")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: !catFilter ? "#b8975a" : "var(--subtle-bg)", color: !catFilter ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>すべて</button>
          {activeCats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: catFilter === c ? "#b8975a" : "var(--subtle-bg)", color: catFilter === c ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {CAT_ICON[c] || "📋"} {c}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {filtered.map(s => {
            const best = getBestScore(s.id)
            const isExpanded = expandedCard === s.id
            return (
              <motion.div key={s.id} whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }} style={{ ...card, padding: 18, cursor: "pointer", position: "relative" }}>
                {/* ベストスコア */}
                {best !== null && (
                  <div style={{ position: "absolute", top: 10, right: 12, fontSize: 11, fontWeight: 700, color: "#b8975a", background: "#fef3c7", padding: "2px 8px", borderRadius: 8 }}>
                    ⭐ {Math.round(best * 10) / 10}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{CAT_ICON[s.category] || "📋"}</span>
                  <div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `${DIFFICULTY[s.difficulty].color}15`, color: DIFFICULTY[s.difficulty].color, fontWeight: 700 }}>{DIFFICULTY[s.difficulty].label}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "var(--subtle-bg)", color: "var(--text-secondary)", marginLeft: 4 }}>{s.category}</span>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</div>

                {/* 患者設定（折りたたみ） */}
                <button onClick={(e) => { e.stopPropagation(); setExpandedCard(isExpanded ? null : s.id) }} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 8 }}>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} 患者設定
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 8, padding: "6px 8px", borderRadius: 8, background: "var(--subtle-bg)" }}>👤 {s.patient_setting}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={() => startScenario(s)} style={{ width: "100%", padding: "8px 0", borderRadius: 8, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  練習開始
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  // ロールプレイ画面
  if (screen === "play" && activeScenario) {
    return (
      <div style={{ padding: 24, maxWidth: 700, display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button onClick={() => { setScreen("select"); setMessages([]) }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><ArrowLeft size={18} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{CAT_ICON[activeScenario.category] || "🎭"} {activeScenario.title}</div>
            <div style={{ fontSize: 10, color: DIFFICULTY[activeScenario.difficulty].color, fontWeight: 600 }}>{DIFFICULTY[activeScenario.difficulty].label}</div>
          </div>
        </div>

        {/* 患者設定バー */}
        <div style={{ ...card, padding: "8px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setShowSetting(!showSetting)}>
          <span style={{ fontSize: 14 }}>👤</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>{showSetting ? activeScenario.patient_setting : "患者設定を表示..."}</span>
          {showSetting ? <ChevronUp size={12} style={{ color: "var(--text-secondary)" }} /> : <ChevronDown size={12} style={{ color: "var(--text-secondary)" }} />}
        </div>

        {/* チャットエリア */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, padding: "10px 0" }}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 6, alignItems: "flex-end" }}>
              {m.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>👤</div>
              )}
              <div>
                <div style={{
                  maxWidth: 320, padding: "10px 14px",
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "#fef9ee",
                  color: m.role === "user" ? "white" : "var(--text-primary)",
                  fontSize: 13, lineHeight: 1.6,
                  border: m.role === "assistant" ? "1px solid rgba(184,151,90,0.2)" : "none",
                }}>
                  {m.content}
                </div>
                {m.time && <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 2, textAlign: m.role === "user" ? "right" : "left", padding: "0 4px" }}>{m.time}</div>}
              </div>
              {m.role === "user" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#b8975a,#d4b87a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", fontWeight: 700, flexShrink: 0 }}>🧑</div>
              )}
            </motion.div>
          ))}
          {sending && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* 入力エリア */}
        <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid var(--subtle-bg)" }}>
          <textarea style={{ flex: 1, border: "1px solid rgba(124,101,204,0.2)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "var(--text-primary)", background: "var(--subtle-bg)", outline: "none", fontFamily: "inherit", resize: "none", minHeight: 42, maxHeight: 100 }} rows={1} placeholder="返答を入力...（Enter送信 / Shift+Enter改行）" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }} />
          <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: sending || !input.trim() ? 0.5 : 1, flexShrink: 0 }}>
            <Send size={16} style={{ color: "white" }} />
          </button>
        </div>

        <button onClick={evaluate} disabled={evaluating || userTurns < 3} style={{ marginTop: 10, width: "100%", padding: 12, borderRadius: 12, background: userTurns >= 3 ? "linear-gradient(135deg,#a78bfa,#f472b6)" : "var(--subtle-bg)", color: userTurns >= 3 ? "white" : "var(--text-secondary)", fontSize: 13, fontWeight: 700, border: "none", cursor: userTurns >= 3 ? "pointer" : "default", opacity: evaluating ? 0.7 : 1 }}>
          {evaluating ? "評価中..." : userTurns < 3 ? `✅ 終了して評価（あと${3 - userTurns}往復）` : "✅ 終了して評価を受ける"}
        </button>
      </div>
    )
  }

  // 評価画面
  if (screen === "result" && evaluation && activeScenario) {
    const radarData = [
      { axis: "言葉遣い", score: evaluation.scores.language * 20 },
      { axis: "共感", score: evaluation.scores.empathy * 20 },
      { axis: "正確性", score: evaluation.scores.accuracy * 20 },
      { axis: "解決力", score: evaluation.scores.resolution * 20 },
    ]
    const levelColor = LEVEL_COLOR[evaluation.level || "C"] || "#6b7280"

    return (
      <div style={{ padding: 24, maxWidth: 700 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>📊 ロールプレイ評価 — {activeScenario.title}</h2>

        {/* 総合スコア */}
        <div style={{ ...card, padding: 32, textAlign: "center", marginBottom: 16, position: "relative" }}>
          {evaluation.level && (
            <div style={{ position: "absolute", top: 16, right: 20, fontSize: 28, fontWeight: 900, color: levelColor }}>
              {evaluation.level}
            </div>
          )}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} style={{ fontSize: 56, fontWeight: 900, color: "#b8975a" }}>
            {scoreAnimated}
          </motion.div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>総合スコア / 5.0</div>
        </div>

        {/* レーダーチャート */}
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(124,101,204,0.15)" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar dataKey="score" stroke="#b8975a" fill="#b8975a" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* ベストライン */}
        {evaluation.best_line && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, padding: 14, marginBottom: 12, background: "linear-gradient(135deg, #fffbeb, #fef3c7)", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>✨ ベスト発言</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#78350f", lineHeight: 1.6 }}>「{evaluation.best_line}」</div>
          </motion.div>
        )}

        {/* 良かった点・改善点 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ ...card, padding: 16, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>✅ 良かった点</div>
            <div style={{ fontSize: 12, color: "#15803d", lineHeight: 1.7 }}>{evaluation.good_points}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ ...card, padding: 16, background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>💡 改善点</div>
            <div style={{ fontSize: 12, color: "#b45309", lineHeight: 1.7 }}>{evaluation.improvements}</div>
          </motion.div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => startScenario(activeScenario)} style={{ flex: 1, padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>🔄 もう一度練習する</button>
          <button onClick={() => { setScreen("select"); setMessages([]); setEvaluation(null) }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(124,101,204,0.2)", background: "var(--surface-bg)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📋 シナリオ選択に戻る</button>
        </div>
      </div>
    )
  }

  return null
}
