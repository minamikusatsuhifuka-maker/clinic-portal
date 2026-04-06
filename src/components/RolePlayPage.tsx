"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Send, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts"

interface RolePlayPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
}

interface Scenario {
  id: string; category: string; difficulty: "easy" | "medium" | "hard"
  title: string; patient_setting: string; opening_line: string; system_prompt: string
}
interface ChatMessage { role: "user" | "assistant"; content: string }
interface Evaluation {
  scores: { language: number; empathy: number; accuracy: number; resolution: number }
  good_points: string; improvements: string
}
interface Session {
  id: string; staff_id: string; scenario_id: string
  messages: ChatMessage[]; evaluation: Evaluation | null; completed_at: string | null
}

const card: React.CSSProperties = {
  background: "var(--surface-bg)", borderRadius: 16,
  border: "1px solid rgba(100,80,180,0.13)",
  boxShadow: "0 1px 4px rgba(60,40,120,0.07)",
}

const DIFFICULTY = { easy: { label: "初級🟢", color: "#22c55e" }, medium: { label: "中級🟡", color: "#eab308" }, hard: { label: "上級🔴", color: "#ef4444" } }
const CATEGORIES = ["初診受付", "会計説明", "クレーム対応"]

export default function RolePlayPage({ userRole, currentUserStaffId }: RolePlayPageProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<"select" | "play" | "result">("select")
  const [catFilter, setCatFilter] = useState("")

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

  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const [{ data: sc }, { data: se }] = await Promise.all([
      supabase.from("roleplay_scenarios").select("*").eq("is_active", true),
      supabase.from("roleplay_sessions").select("*").eq("staff_id", currentUserStaffId),
    ])
    if (sc) setScenarios(sc)
    if (se) setSessions(se as Session[])
    setLoading(false)
  }, [currentUserStaffId])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const startScenario = async (scenario: Scenario) => {
    setActiveScenario(scenario)
    const opening: ChatMessage = { role: "assistant", content: scenario.opening_line }
    setMessages([opening])
    setScreen("play")
    setEvaluation(null)
    // セッション作成
    if (supabase) {
      const { data } = await supabase.from("roleplay_sessions").insert({
        staff_id: currentUserStaffId,
        scenario_id: scenario.id,
        messages: [opening],
      }).select("id").single()
      if (data) setSessionId(data.id)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeScenario || sending) return
    const userMsg: ChatMessage = { role: "user", content: input.trim() }
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
      const data = await res.json()
      const assistantMsg: ChatMessage = { role: "assistant", content: data.response || data.error }
      const updated = [...newMessages, assistantMsg]
      setMessages(updated)

      // セッション更新
      if (supabase && sessionId) {
        await supabase.from("roleplay_sessions").update({ messages: updated }).eq("id", sessionId)
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "通信エラーが発生しました。" }])
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
      // セッション更新
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
    const best = completed.reduce((max, s) => {
      const avg = s.evaluation ? (s.evaluation.scores.language + s.evaluation.scores.empathy + s.evaluation.scores.accuracy + s.evaluation.scores.resolution) / 4 : 0
      return avg > max ? avg : max
    }, 0)
    return Math.round(best * 10) / 10
  }

  const userTurns = messages.filter(m => m.role === "user").length

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

  // シナリオ選択
  if (screen === "select") {
    const filtered = catFilter ? scenarios.filter(s => s.category === catFilter) : scenarios
    return (
      <div style={{ padding: 24, maxWidth: 800 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>🎭 AIロールプレイ — シナリオ選択</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setCatFilter("")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: !catFilter ? "#b8975a" : "var(--subtle-bg)", color: !catFilter ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>すべて</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: catFilter === c ? "#b8975a" : "var(--subtle-bg)", color: catFilter === c ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{c}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {filtered.map(s => {
            const best = getBestScore(s.id)
            return (
              <motion.div key={s.id} whileHover={{ y: -2 }} style={{ ...card, padding: 18, cursor: "pointer" }} onClick={() => startScenario(s)}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `${DIFFICULTY[s.difficulty].color}15`, color: DIFFICULTY[s.difficulty].color, fontWeight: 700 }}>{DIFFICULTY[s.difficulty].label}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "var(--subtle-bg)", color: "var(--text-secondary)" }}>{s.category}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 8 }}>{s.patient_setting}</div>
                {best !== null && (
                  <div style={{ fontSize: 11, color: "#b8975a", fontWeight: 600 }}>⭐ ベスト: {best}/5.0</div>
                )}
                <button style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 8, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={() => { setScreen("select"); setMessages([]) }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><ArrowLeft size={18} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>🎭 {activeScenario.title}</div>
          </div>
          <button onClick={() => setShowSetting(!showSetting)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 11 }}>
            患者設定 {showSetting ? <ChevronUp size={12} style={{ verticalAlign: "middle" }} /> : <ChevronDown size={12} style={{ verticalAlign: "middle" }} />}
          </button>
        </div>

        {showSetting && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} style={{ ...card, padding: 12, marginBottom: 12, fontSize: 12, color: "var(--text-secondary)", overflow: "hidden" }}>
            👤 {activeScenario.patient_setting}
          </motion.div>
        )}

        {/* チャットエリア */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "10px 0" }}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "75%", padding: "10px 14px", borderRadius: 14,
                background: m.role === "user" ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)",
                color: m.role === "user" ? "white" : "var(--text-primary)",
                fontSize: 13, lineHeight: 1.6,
                borderBottomRightRadius: m.role === "user" ? 4 : 14,
                borderBottomLeftRadius: m.role === "assistant" ? 4 : 14,
              }}>
                {m.role === "assistant" && <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 3 }}>👤 患者</div>}
                {m.content}
              </div>
            </motion.div>
          ))}
          {sending && (
            <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>患者が返答中...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 入力エリア */}
        <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid var(--subtle-bg)" }}>
          <input style={{ flex: 1, border: "1px solid rgba(124,101,204,0.2)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "var(--text-primary)", background: "var(--subtle-bg)", outline: "none", fontFamily: "inherit" }} placeholder="返答を入力..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }} />
          <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: sending ? 0.6 : 1 }}>
            <Send size={16} style={{ color: "white" }} />
          </button>
        </div>

        {userTurns >= 3 && (
          <button onClick={evaluate} disabled={evaluating} style={{ marginTop: 10, width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", opacity: evaluating ? 0.7 : 1 }}>
            {evaluating ? "評価中..." : "✅ 終了して評価を受ける"}
          </button>
        )}
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
    const avg = Math.round(((evaluation.scores.language + evaluation.scores.empathy + evaluation.scores.accuracy + evaluation.scores.resolution) / 4) * 10) / 10

    return (
      <div style={{ padding: 24, maxWidth: 700 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>📊 ロールプレイ評価 — {activeScenario.title}</h2>

        <div style={{ ...card, padding: 24, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#b8975a" }}>{avg}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>総合スコア / 5.0</div>
        </div>

        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(124,101,204,0.15)" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar dataKey="score" stroke="#b8975a" fill="#b8975a" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ ...card, padding: 16, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>✅ 良かった点</div>
            <div style={{ fontSize: 13, color: "#15803d", lineHeight: 1.6 }}>{evaluation.good_points}</div>
          </div>
          <div style={{ ...card, padding: 16, background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>💡 改善点</div>
            <div style={{ fontSize: 13, color: "#b45309", lineHeight: 1.6 }}>{evaluation.improvements}</div>
          </div>
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
