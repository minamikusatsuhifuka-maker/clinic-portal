"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, Plus, ChevronRight, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import dynamic from "next/dynamic"

// SSR-safe dynamic imports for recharts
const ResponsiveContainer = dynamic(
  () => import("recharts").then(m => m.ResponsiveContainer),
  { ssr: false }
)
const RadialBarChart = dynamic(
  () => import("recharts").then(m => m.RadialBarChart),
  { ssr: false }
)
const RadialBar = dynamic(
  () => import("recharts").then(m => m.RadialBar),
  { ssr: false }
)
const BarChart = dynamic(
  () => import("recharts").then(m => m.BarChart),
  { ssr: false }
)
const Bar = dynamic(
  () => import("recharts").then(m => m.Bar),
  { ssr: false }
)
const XAxis = dynamic(
  () => import("recharts").then(m => m.XAxis),
  { ssr: false }
)
const YAxis = dynamic(
  () => import("recharts").then(m => m.YAxis),
  { ssr: false }
)
const CartesianGrid = dynamic(
  () => import("recharts").then(m => m.CartesianGrid),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import("recharts").then(m => m.Tooltip),
  { ssr: false }
)

interface MBOPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
  currentUserRole: string
}

interface Goal {
  id: string; staff_id: string; quarter: string; title: string; description: string | null
  kpi: string | null; priority: "high" | "medium" | "low"; deadline: string | null
  progress: number; status: "active" | "done" | "dropped"; reflection: string | null; created_at: string
}

interface ProgressLog {
  id: string; goal_id: string; progress: number; comment: string | null; logged_at: string
}

interface Staff {
  id: string; name: string; role: string
}

interface AISuggestion {
  title: string
  description: string
  kpi: string
  priority?: "high" | "medium" | "low"
}

// --- スタイル定数 ---
const card: React.CSSProperties = {
  background: "var(--surface-bg)", borderRadius: 16,
  border: "1px solid rgba(100,80,180,0.13)",
  boxShadow: "0 1px 4px rgba(60,40,120,0.07)",
}
const inp: React.CSSProperties = {
  width: "100%", border: "1px solid rgba(124,101,204,0.2)",
  borderRadius: 10, padding: "9px 12px", fontSize: 13,
  color: "var(--text-primary)", background: "var(--subtle-bg)",
  outline: "none", fontFamily: "inherit",
}

const PRIORITY = {
  high: { label: "High 🔴", color: "#ef4444", bg: "#fef2f2" },
  medium: { label: "Medium 🟡", color: "#eab308", bg: "#fefce8" },
  low: { label: "Low 🟢", color: "#22c55e", bg: "#f0fdf4" },
} as const

const GOLD = "#b8975a"
const GOLD_LIGHT = "#d4b87a"

const getCurrentQuarter = () => {
  const d = new Date()
  const q = Math.ceil((d.getMonth() + 1) / 3)
  return `${d.getFullYear()}年 Q${q}（${(q - 1) * 3 + 1}〜${q * 3}月）`
}

const getQuarterKey = () => {
  const d = new Date()
  const q = Math.ceil((d.getMonth() + 1) / 3)
  return `${d.getFullYear()}-Q${q}`
}

// --- Confetti コンポーネント ---
function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random(),
      color: ["#b8975a", "#d4b87a", "#ef4444", "#22c55e", "#eab308", "#a78bfa"][i % 6],
      size: 4 + Math.random() * 6,
    })), [])

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, scale: 0.5, rotate: 360 + Math.random() * 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute", width: p.size, height: p.size,
            borderRadius: p.size > 7 ? "50%" : 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  )
}

// --- カスタムゴールドスライダー ---
function GoldSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const handlePointerEvent = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const stepped = Math.round(ratio * 20) * 5
    onChange(stepped)
  }, [onChange])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: PointerEvent) => handlePointerEvent(e)
    const onUp = () => setDragging(false)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [dragging, handlePointerEvent])

  return (
    <div
      ref={trackRef}
      style={{ position: "relative", height: 24, cursor: "pointer", touchAction: "none" }}
      onPointerDown={(e) => { setDragging(true); handlePointerEvent(e) }}
    >
      {/* トラック背景 */}
      <div style={{
        position: "absolute", top: 9, left: 0, right: 0, height: 6,
        borderRadius: 3, background: "var(--subtle-bg)",
      }} />
      {/* 進捗バー */}
      <motion.div
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "absolute", top: 9, left: 0, height: 6,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
        }}
      />
      {/* つまみ */}
      <motion.div
        animate={{ left: `${value}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "absolute", top: 4, width: 16, height: 16,
          borderRadius: "50%", background: "white",
          border: `3px solid ${GOLD}`,
          boxShadow: `0 2px 6px rgba(184,151,90,0.35)`,
          transform: "translateX(-50%)",
        }}
      />
    </div>
  )
}

// --- メインコンポーネント ---
export default function MBOPage({ userRole, currentUserStaffId, currentUserRole }: MBOPageProps) {
  const isManager = userRole === "admin" || userRole === "manager"
  const [goals, setGoals] = useState<Goal[]>([])
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "", description: "", kpi: "",
    priority: "medium" as "high" | "medium" | "low",
    deadline: "",
  })
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [progressComment, setProgressComment] = useState<Record<string, string>>({})
  const [view, setView] = useState<"my" | "team">("my")
  const [confettiGoalId, setConfettiGoalId] = useState<string | null>(null)

  const quarter = getQuarterKey()

  // --- データ取得 ---
  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const [{ data: g }, { data: l }, { data: s }] = await Promise.all([
      supabase.from("mbo_goals").select("*").order("created_at", { ascending: false }),
      supabase.from("mbo_progress_logs").select("*").order("logged_at", { ascending: false }),
      supabase.from("staff").select("id, name, role").order("name"),
    ])
    if (g) setGoals(g)
    if (l) setLogs(l)
    if (s) setStaffList(s)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // --- 派生データ ---
  const myGoals = useMemo(() =>
    goals
      .filter(g => g.staff_id === currentUserStaffId && g.quarter === quarter)
      .sort((a, b) => {
        const pOrder = { high: 0, medium: 1, low: 2 }
        return pOrder[a.priority] - pOrder[b.priority]
      }),
    [goals, currentUserStaffId, quarter]
  )

  const activeGoals = useMemo(() => myGoals.filter(g => g.status !== "dropped"), [myGoals])
  const avgProgress = useMemo(() =>
    activeGoals.length > 0
      ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)
      : 0,
    [activeGoals]
  )

  const teamData = useMemo(() =>
    staffList.map(s => {
      const sGoals = goals.filter(g => g.staff_id === s.id && g.quarter === quarter && g.status !== "dropped")
      const avg = sGoals.length > 0 ? Math.round(sGoals.reduce((sum, g) => sum + g.progress, 0) / sGoals.length) : 0
      return { name: s.name, progress: avg }
    }).filter(d => d.progress > 0),
    [staffList, goals, quarter]
  )

  // --- 目標追加 ---
  const addGoal = async () => {
    if (!supabase || !form.title.trim()) return
    setSaving(true)
    await supabase.from("mbo_goals").insert({
      staff_id: currentUserStaffId, quarter, title: form.title,
      description: form.description || null, kpi: form.kpi || null,
      priority: form.priority, deadline: form.deadline || null,
    })
    setForm({ title: "", description: "", kpi: "", priority: "medium", deadline: "" })
    setShowForm(false)
    await fetchData()
    setSaving(false)
  }

  // --- 進捗更新（Optimistic UI） ---
  const updateProgress = useCallback(async (goalId: string, progress: number) => {
    if (!supabase) return

    // Optimistic update: 即座にUIを更新
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress } : g))

    // 100%到達で紙吹雪
    if (progress === 100) {
      setConfettiGoalId(goalId)
      setTimeout(() => setConfettiGoalId(null), 3000)
    }

    try {
      await supabase.from("mbo_goals").update({ progress }).eq("id", goalId)
      const comment = progressComment[goalId]
      if (comment) {
        await supabase.from("mbo_progress_logs").insert({ goal_id: goalId, progress, comment })
        setProgressComment(p => ({ ...p, [goalId]: "" }))
      }
    } catch {
      // ロールバック: サーバーエラー時は再取得
      await fetchData()
    }
  }, [progressComment, fetchData])

  // --- ステータス更新 ---
  const updateStatus = async (goalId: string, status: "active" | "done" | "dropped") => {
    if (!supabase) return
    // Optimistic
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status } : g))
    try {
      await supabase.from("mbo_goals").update({ status }).eq("id", goalId)
    } catch {
      await fetchData()
    }
  }

  // --- AI目標提案 ---
  const suggestGoals = async () => {
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `あなたは南草津皮フ科クリニックのスタッフ育成コーチです。
${currentUserRole}スタッフの${getCurrentQuarter()}の目標を3つ提案してください。

クリニックの理念・成功の8原則・リードマネジメントを参考に。

【出力形式】必ずこのJSONのみで返してください：
[{"title":"目標タイトル（20字以内）","description":"具体的な内容（50字以内）","kpi":"達成の判断基準（30字以内）","priority":"high/medium/low"}]`
          }],
          currentPage: "mbo", userRole,
        }),
      })
      const text = await res.text()
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        setAiSuggestions(JSON.parse(match[0]))
      }
    } catch { /* ignore */ }
    setAiLoading(false)
  }

  const addSuggestion = async (s: AISuggestion) => {
    if (!supabase) return
    await supabase.from("mbo_goals").insert({
      staff_id: currentUserStaffId, quarter, title: s.title,
      description: s.description, kpi: s.kpi,
      priority: s.priority || "medium",
    })
    setAiSuggestions(p => p.filter(x => x.title !== s.title))
    await fetchData()
  }

  // --- 期限計算 ---
  const daysRemaining = (deadline: string | null) => {
    if (!deadline) return null
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const deadlineLabel = (days: number | null) => {
    if (days === null) return null
    if (days < 0) return { text: `${Math.abs(days)}日超過`, color: "#ef4444", bg: "#fef2f2" }
    if (days === 0) return { text: "本日期限", color: "#ef4444", bg: "#fef2f2" }
    if (days <= 7) return { text: `あと${days}日`, color: "#f97316", bg: "#fff7ed" }
    return { text: `あと${days}日`, color: "#22c55e", bg: "#f0fdf4" }
  }

  // --- ローディング ---
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} />
      </div>
    )
  }

  // RadialBarChart用データ
  const radialData = [{ value: avgProgress, fill: GOLD }]

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* 紙吹雪 */}
      <Confetti active={confettiGoalId !== null} />

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          🎯 {getCurrentQuarter()}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          {(["my", ...(isManager ? ["team"] : [])] as const).map(v => {
            const label = v === "my" ? "マイ目標" : "チーム"
            const active = view === v
            return (
              <button
                key={v}
                onClick={() => setView(v as "my" | "team")}
                style={{
                  padding: "7px 14px", borderRadius: 10, border: "none",
                  background: active ? `linear-gradient(135deg,${GOLD},${GOLD_LIGHT})` : "var(--subtle-bg)",
                  color: active ? "white" : "var(--text-secondary)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {view === "my" && (
        <>
          {/* 達成率ゲージ */}
          <div style={{ ...card, padding: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 130, height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="65%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={210}
                  endAngle={-30}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={12}
                    background={{ fill: "var(--subtle-bg)" }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: GOLD, lineHeight: 1.1 }}>
                {avgProgress}<span style={{ fontSize: 18 }}>%</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                総合達成率（{activeGoals.length}目標）
              </div>
              {avgProgress === 100 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ fontSize: 11, color: GOLD, fontWeight: 700, marginTop: 4 }}
                >
                  🏆 全目標達成！
                </motion.div>
              )}
            </div>
          </div>

          {/* 目標カード一覧 */}
          <AnimatePresence mode="popLayout">
            {myGoals.map(g => {
              const days = daysRemaining(g.deadline)
              const dl = deadlineLabel(days)
              const pri = PRIORITY[g.priority]
              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: g.status === "dropped" ? 0.5 : 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  style={{ ...card, padding: 16, marginBottom: 10 }}
                >
                  {/* 上部: 優先度 + タイトル + 期限 + ステータス */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    {/* 優先度バッジ（大きめ） */}
                    <span style={{
                      fontSize: 12, padding: "4px 12px", borderRadius: 999,
                      background: pri.bg, color: pri.color,
                      fontWeight: 700, letterSpacing: 0.3,
                      border: `1px solid ${pri.color}30`,
                    }}>
                      {pri.label}
                    </span>
                    {/* タイトル */}
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>
                      {g.title}
                    </span>
                    {/* 期限カウントダウン */}
                    {dl && (
                      <span style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 999,
                        background: dl.bg, color: dl.color, fontWeight: 700,
                      }}>
                        {dl.text}
                      </span>
                    )}
                    {/* ステータスセレクト */}
                    <select
                      value={g.status}
                      onChange={e => updateStatus(g.id, e.target.value as "active" | "done" | "dropped")}
                      style={{
                        fontSize: 11, padding: "3px 6px", borderRadius: 6,
                        border: "1px solid rgba(124,101,204,0.2)",
                        background: "var(--subtle-bg)", color: "var(--text-secondary)",
                      }}
                    >
                      <option value="active">進行中</option>
                      <option value="done">完了</option>
                      <option value="dropped">中止</option>
                    </select>
                  </div>

                  {g.description && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
                      {g.description}
                    </div>
                  )}
                  {g.kpi && (
                    <div style={{ fontSize: 11, color: GOLD, marginBottom: 8 }}>
                      📏 KPI: {g.kpi}
                    </div>
                  )}

                  {/* カスタムゴールド進捗スライダー */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <GoldSlider
                        value={g.progress}
                        onChange={(v) => updateProgress(g.id, v)}
                      />
                    </div>
                    <motion.span
                      key={g.progress}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      style={{
                        fontSize: 14, fontWeight: 800, color: GOLD,
                        minWidth: 44, textAlign: "right",
                      }}
                    >
                      {g.progress}%
                    </motion.span>
                  </div>

                  {/* 進捗バー */}
                  <div style={{ height: 5, borderRadius: 3, background: "var(--subtle-bg)", overflow: "hidden", marginBottom: 8 }}>
                    <motion.div
                      animate={{ width: `${g.progress}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{
                        height: "100%",
                        background: g.progress === 100
                          ? `linear-gradient(90deg, ${GOLD}, #fbbf24, ${GOLD_LIGHT})`
                          : `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                        borderRadius: 3,
                      }}
                    />
                  </div>

                  {/* 100%到達メッセージ */}
                  {g.progress === 100 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 6, textAlign: "center" }}
                    >
                      🎉 目標達成おめでとうございます！
                    </motion.div>
                  )}

                  {/* 進捗コメント */}
                  <input
                    placeholder="進捗コメント"
                    style={{ ...inp, fontSize: 12 }}
                    value={progressComment[g.id] || ""}
                    onChange={e => setProgressComment(p => ({ ...p, [g.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") updateProgress(g.id, g.progress) }}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* 目標追加エリア */}
          {myGoals.length < 5 && (
            <>
              {/* 追加/AI提案ボタン */}
              {!showForm && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "10px 16px", borderRadius: 10,
                      border: "1px dashed rgba(124,101,204,0.3)",
                      background: "transparent", color: "var(--text-secondary)",
                      fontSize: 12, cursor: "pointer",
                    }}
                  >
                    <Plus size={14} /> 目標を追加
                  </button>
                  <button
                    onClick={suggestGoals}
                    disabled={aiLoading}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "10px 16px", borderRadius: 10, border: "none",
                      background: "linear-gradient(135deg,#a78bfa,#f472b6)",
                      color: "white", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", opacity: aiLoading ? 0.7 : 1,
                    }}
                  >
                    {aiLoading
                      ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                      : <Sparkles size={13} />
                    }
                    AIに目標案を提案してもらう
                  </button>
                </div>
              )}

              {/* スライドイン追加フォーム */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ ...card, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                          新しい目標
                        </span>
                        <button
                          onClick={() => setShowForm(false)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 2 }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <input
                          style={inp}
                          placeholder="目標タイトル *"
                          value={form.title}
                          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        />
                        <textarea
                          style={{ ...inp, resize: "none" }}
                          rows={2}
                          placeholder="詳細・背景"
                          value={form.description}
                          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        />
                        <input
                          style={inp}
                          placeholder="KPI（達成の判断基準）"
                          value={form.kpi}
                          onChange={e => setForm(p => ({ ...p, kpi: e.target.value }))}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <select
                            style={{ ...inp, width: 140 }}
                            value={form.priority}
                            onChange={e => setForm(p => ({ ...p, priority: e.target.value as "high" | "medium" | "low" }))}
                          >
                            <option value="high">High 🔴</option>
                            <option value="medium">Medium 🟡</option>
                            <option value="low">Low 🟢</option>
                          </select>
                          <input
                            type="date"
                            style={inp}
                            value={form.deadline}
                            onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={addGoal}
                            disabled={saving || !form.title.trim()}
                            style={{
                              flex: 1, padding: 10, borderRadius: 10,
                              background: `linear-gradient(135deg,${GOLD},${GOLD_LIGHT})`,
                              color: "white", fontSize: 13, fontWeight: 600,
                              border: "none", cursor: "pointer",
                              opacity: saving || !form.title.trim() ? 0.6 : 1,
                            }}
                          >
                            {saving ? "保存中..." : "保存"}
                          </button>
                          <button
                            onClick={() => setShowForm(false)}
                            style={{
                              padding: "10px 16px", borderRadius: 10,
                              border: "1px solid rgba(124,101,204,0.2)",
                              background: "transparent", color: "var(--text-secondary)",
                              fontSize: 13, cursor: "pointer",
                            }}
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI提案カード */}
              <AnimatePresence>
                {aiSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {aiSuggestions.map((s, i) => (
                      <motion.div
                        key={`${s.title}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ ...card, padding: 14, display: "flex", alignItems: "flex-start", gap: 10 }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                              {s.title}
                            </span>
                            {s.priority && (
                              <span style={{
                                fontSize: 10, padding: "2px 6px", borderRadius: 999,
                                background: PRIORITY[s.priority]?.bg || PRIORITY.medium.bg,
                                color: PRIORITY[s.priority]?.color || PRIORITY.medium.color,
                                fontWeight: 600,
                              }}>
                                {PRIORITY[s.priority]?.label || PRIORITY.medium.label}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                            {s.description}
                          </div>
                          <div style={{ fontSize: 11, color: GOLD, marginTop: 2 }}>
                            KPI: {s.kpi}
                          </div>
                        </div>
                        <button
                          onClick={() => addSuggestion(s)}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "6px 14px", borderRadius: 8,
                            background: GOLD, color: "white",
                            fontSize: 11, fontWeight: 600, border: "none",
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          採用 <ChevronRight size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </>
      )}

      {/* チームビュー */}
      {view === "team" && isManager && (
        <div style={{ ...card, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            スタッフ達成率一覧
          </h3>
          {teamData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,101,204,0.1)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(v) => [`${v}%`, "達成率"]} />
                <Bar dataKey="progress" fill={GOLD} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
              目標データがありません
            </div>
          )}
        </div>
      )}
    </div>
  )
}
