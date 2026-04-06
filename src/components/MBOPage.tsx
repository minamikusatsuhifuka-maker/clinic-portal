"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, Plus, Target, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

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
interface ProgressLog { id: string; goal_id: string; progress: number; comment: string | null; logged_at: string }
interface Staff { id: string; name: string; role: string }

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

const PRIORITY = { high: { label: "High🔴", color: "#ef4444" }, medium: { label: "Medium🟡", color: "#eab308" }, low: { label: "Low🟢", color: "#22c55e" } }

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

export default function MBOPage({ userRole, currentUserStaffId, currentUserRole }: MBOPageProps) {
  const isManager = userRole === "admin" || userRole === "manager"
  const [goals, setGoals] = useState<Goal[]>([])
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", kpi: "", priority: "medium" as "high" | "medium" | "low", deadline: "" })
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{ title: string; description: string; kpi: string }[]>([])
  const [progressComment, setProgressComment] = useState<Record<string, string>>({})
  const [view, setView] = useState<"my" | "team">("my")

  const quarter = getQuarterKey()

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

  const myGoals = goals.filter(g => g.staff_id === currentUserStaffId && g.quarter === quarter).sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 }
    return pOrder[a.priority] - pOrder[b.priority]
  })
  const avgProgress = myGoals.length > 0 ? Math.round(myGoals.filter(g => g.status !== "dropped").reduce((s, g) => s + g.progress, 0) / myGoals.filter(g => g.status !== "dropped").length) : 0

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

  const updateProgress = async (goalId: string, progress: number) => {
    if (!supabase) return
    await supabase.from("mbo_goals").update({ progress }).eq("id", goalId)
    const comment = progressComment[goalId]
    if (comment) {
      await supabase.from("mbo_progress_logs").insert({ goal_id: goalId, progress, comment })
      setProgressComment(p => ({ ...p, [goalId]: "" }))
    }
    await fetchData()
  }

  const updateStatus = async (goalId: string, status: "active" | "done" | "dropped") => {
    if (!supabase) return
    await supabase.from("mbo_goals").update({ status }).eq("id", goalId)
    await fetchData()
  }

  const suggestGoals = async () => {
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `南草津皮フ科クリニックの${currentUserRole}スタッフの${getCurrentQuarter()}の目標を3つ提案してください。\nクリニックの理念・成功の8原則・リードマネジメントを参考に、\n具体的で達成可能な目標をJSON形式で返してください。\n[{"title": "...", "description": "...", "kpi": "..."}]\nJSON形式のみで返してください。前置きは不要です。` }],
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

  const addSuggestion = async (s: { title: string; description: string; kpi: string }) => {
    if (!supabase) return
    await supabase.from("mbo_goals").insert({
      staff_id: currentUserStaffId, quarter, title: s.title,
      description: s.description, kpi: s.kpi, priority: "medium",
    })
    setAiSuggestions(p => p.filter(x => x.title !== s.title))
    await fetchData()
  }

  const daysRemaining = (deadline: string | null) => {
    if (!deadline) return null
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

  // チーム達成率
  const teamData = staffList.map(s => {
    const sGoals = goals.filter(g => g.staff_id === s.id && g.quarter === quarter && g.status !== "dropped")
    const avg = sGoals.length > 0 ? Math.round(sGoals.reduce((sum, g) => sum + g.progress, 0) / sGoals.length) : 0
    return { name: s.name, progress: avg }
  }).filter(d => d.progress > 0)

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>🎯 {getCurrentQuarter()}</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView("my")} style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: view === "my" ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)", color: view === "my" ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>マイ目標</button>
          {isManager && (
            <button onClick={() => setView("team")} style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: view === "team" ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)", color: view === "team" ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>チーム</button>
          )}
        </div>
      </div>

      {view === "my" && (
        <>
          {/* ゲージ */}
          <div style={{ ...card, padding: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 120, height: 120 }}>
              <ResponsiveContainer>
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: avgProgress, fill: "#b8975a" }]} startAngle={180} endAngle={0}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "var(--subtle-bg)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#b8975a" }}>{avgProgress}%</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>総合達成率（{myGoals.filter(g => g.status !== "dropped").length}目標）</div>
            </div>
          </div>

          {/* 目標カード */}
          {myGoals.map(g => {
            const days = daysRemaining(g.deadline)
            return (
              <motion.div key={g.id} layout style={{ ...card, padding: 16, marginBottom: 10, opacity: g.status === "dropped" ? 0.5 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `${PRIORITY[g.priority].color}15`, color: PRIORITY[g.priority].color, fontWeight: 700 }}>{PRIORITY[g.priority].label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{g.title}</span>
                  {days !== null && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: days < 7 ? "#fef2f2" : "#f0fdf4", color: days < 7 ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
                      {days > 0 ? `残り${days}日` : "期限超過"}
                    </span>
                  )}
                  <select value={g.status} onChange={e => updateStatus(g.id, e.target.value as "active" | "done" | "dropped")} style={{ fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1px solid rgba(124,101,204,0.2)", background: "var(--subtle-bg)", color: "var(--text-secondary)" }}>
                    <option value="active">進行中</option>
                    <option value="done">完了</option>
                    <option value="dropped">中止</option>
                  </select>
                </div>
                {g.description && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{g.description}</div>}
                {g.kpi && <div style={{ fontSize: 11, color: "#b8975a", marginBottom: 8 }}>📏 KPI: {g.kpi}</div>}

                {/* 進捗スライダー */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <input type="range" min={0} max={100} step={5} value={g.progress} onChange={e => updateProgress(g.id, Number(e.target.value))} style={{ flex: 1, accentColor: "#b8975a" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#b8975a", minWidth: 40, textAlign: "right" }}>{g.progress}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--subtle-bg)", overflow: "hidden", marginBottom: 8 }}>
                  <motion.div animate={{ width: `${g.progress}%` }} style={{ height: "100%", background: "linear-gradient(90deg, #b8975a, #d4b87a)", borderRadius: 2 }} />
                </div>

                <input placeholder="進捗コメント" style={{ ...inp, fontSize: 12 }} value={progressComment[g.id] || ""} onChange={e => setProgressComment(p => ({ ...p, [g.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") updateProgress(g.id, g.progress) }} />
              </motion.div>
            )
          })}

          {/* 目標追加 */}
          {myGoals.length < 5 && (
            <>
              {!showForm ? (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "1px dashed rgba(124,101,204,0.3)", background: "transparent", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
                    <Plus size={14} /> 目標を追加
                  </button>
                  <button onClick={suggestGoals} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: aiLoading ? 0.7 : 1 }}>
                    {aiLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
                    Airに目標案を提案してもらう
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...card, padding: 16, marginTop: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input style={inp} placeholder="目標タイトル *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                    <textarea style={{ ...inp, resize: "none" }} rows={2} placeholder="詳細・背景" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    <input style={inp} placeholder="KPI（達成の判断基準）" value={form.kpi} onChange={e => setForm(p => ({ ...p, kpi: e.target.value }))} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <select style={{ ...inp, width: 120 }} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as "high" | "medium" | "low" }))}>
                        <option value="high">High🔴</option>
                        <option value="medium">Medium🟡</option>
                        <option value="low">Low🟢</option>
                      </select>
                      <input type="date" style={inp} value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={addGoal} disabled={saving || !form.title.trim()} style={{ flex: 1, padding: 10, borderRadius: 10, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>保存</button>
                      <button onClick={() => setShowForm(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(124,101,204,0.2)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>キャンセル</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI提案 */}
              {aiSuggestions.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {aiSuggestions.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ ...card, padding: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{s.description}</div>
                        <div style={{ fontSize: 11, color: "#b8975a", marginTop: 2 }}>KPI: {s.kpi}</div>
                      </div>
                      <button onClick={() => addSuggestion(s)} style={{ padding: "6px 12px", borderRadius: 8, background: "#b8975a", color: "white", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>採用</button>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* チームビュー */}
      {view === "team" && isManager && (
        <div style={{ ...card, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>スタッフ達成率一覧</h3>
          {teamData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,101,204,0.1)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(v) => [`${v}%`, "達成率"]} />
                <Bar dataKey="progress" fill="#b8975a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>目標データがありません</div>
          )}
        </div>
      )}
    </div>
  )
}
