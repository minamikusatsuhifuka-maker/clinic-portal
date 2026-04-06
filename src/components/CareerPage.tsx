"use client"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Loader2, Sparkles, CheckCircle2, Circle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface CareerPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
  currentUserRole: string
}

interface CareerPath {
  id: string; staff_id: string; goal_text: string; roadmap: unknown; last_updated: string
}
interface Milestone {
  id: string; career_path_id: string; period: string; title: string
  description: string | null; is_completed: boolean; completed_at: string | null
}

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

const PERIOD_META: Record<string, { emoji: string; color: string; label: string }> = {
  "3m": { emoji: "🌱", color: "#22c55e", label: "3ヶ月" },
  "6m": { emoji: "🌿", color: "#3b82f6", label: "6ヶ月" },
  "1y": { emoji: "🌳", color: "#a855f7", label: "1年" },
  "3y": { emoji: "🌟", color: "#b8975a", label: "3年" },
}

export default function CareerPage({ userRole, currentUserStaffId, currentUserRole }: CareerPageProps) {
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [goalText, setGoalText] = useState("")
  const [generating, setGenerating] = useState(false)
  const [focusAdvice, setFocusAdvice] = useState("")
  const [focusLoading, setFocusLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data: cp } = await supabase.from("career_paths").select("*").eq("staff_id", currentUserStaffId).single()
    if (cp) {
      setCareerPath(cp)
      setGoalText(cp.goal_text)
      const { data: ms } = await supabase.from("career_milestones").select("*").eq("career_path_id", cp.id).order("id")
      if (ms) setMilestones(ms)
    }
    setLoading(false)
  }, [currentUserStaffId])

  useEffect(() => { fetchData() }, [fetchData])

  const generateRoadmap = async () => {
    if (!supabase || !goalText.trim()) return
    setGenerating(true)
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `南草津皮フ科クリニックの${currentUserRole}スタッフが以下のゴールを設定しました。\n現在のスキル・OJT状況を踏まえ、3ヶ月・6ヶ月・1年・3年の\nマイルストーンを含むロードマップをJSON形式で生成してください。\nクリニックの理念・成功の8原則・リードマネジメントを参照してください。\nゴール：${goalText}\n\nJSON形式のみで返してください（前置き不要）：\n{"milestones":[{"period":"3m","title":"マイルストーン名","description":"具体的な内容"},{"period":"6m","title":"...","description":"..."},{"period":"1y","title":"...","description":"..."},{"period":"3y","title":"...","description":"..."}]}` }],
          currentPage: "career", userRole,
        }),
      })
      const text = await res.text()
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const roadmap = JSON.parse(match[0])

        if (careerPath) {
          // 更新
          await supabase.from("career_milestones").delete().eq("career_path_id", careerPath.id)
          await supabase.from("career_paths").update({ goal_text: goalText, roadmap, last_updated: new Date().toISOString() }).eq("id", careerPath.id)
          for (const m of roadmap.milestones) {
            await supabase.from("career_milestones").insert({ career_path_id: careerPath.id, period: m.period, title: m.title, description: m.description })
          }
        } else {
          // 新規作成
          const { data: newPath } = await supabase.from("career_paths").insert({ staff_id: currentUserStaffId, goal_text: goalText, roadmap }).select("id").single()
          if (newPath) {
            for (const m of roadmap.milestones) {
              await supabase.from("career_milestones").insert({ career_path_id: newPath.id, period: m.period, title: m.title, description: m.description })
            }
          }
        }
        await fetchData()
      }
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const toggleMilestone = async (m: Milestone) => {
    if (!supabase) return
    await supabase.from("career_milestones").update({
      is_completed: !m.is_completed,
      completed_at: !m.is_completed ? new Date().toISOString() : null,
    }).eq("id", m.id)
    await fetchData()
  }

  const getFocusAdvice = async () => {
    if (!careerPath) return
    setFocusLoading(true)
    const nextMilestone = milestones.find(m => !m.is_completed)
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `スタッフのキャリアゴールと現在の未達成マイルストーンを確認し、\n今月フォーカスすべきことを3点、具体的なアクションとして提案してください（各50字以内）。\nゴール：${careerPath.goal_text}\n次のマイルストーン：${nextMilestone ? `${nextMilestone.title} - ${nextMilestone.description}` : "なし"}` }],
          currentPage: "career", userRole,
        }),
      })
      setFocusAdvice(await res.text())
    } catch { setFocusAdvice("アドバイスの取得に失敗しました。") }
    setFocusLoading(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>🚀 キャリアパス設計</h2>

      {/* ゴール設定 */}
      <div style={{ ...card, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          🎯 3年後にどんなスタッフ・どんな人生でありたいか
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
          例：チームのリーダーとして新人を育てながら、患者様に信頼される存在になりたい
        </p>
        <textarea style={{ ...inp, resize: "none" }} rows={4} placeholder="あなたのキャリアゴールを自由に書いてください..." value={goalText} onChange={e => setGoalText(e.target.value)} />
        <button onClick={generateRoadmap} disabled={generating || !goalText.trim()} style={{ marginTop: 12, width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", opacity: generating ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {generating ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> ロードマップ生成中...</> : <><Sparkles size={14} /> {careerPath ? "Airにロードマップを再生成してもらう" : "Airにロードマップを作ってもらう"}</>}
        </button>
      </div>

      {/* ロードマップ */}
      {milestones.length > 0 && (
        <div style={{ position: "relative", paddingLeft: 24, marginBottom: 20 }}>
          {/* タイムラインの線 */}
          <div style={{ position: "absolute", left: 11, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #22c55e, #3b82f6, #a855f7, #b8975a)" }} />

          {milestones.map((m, i) => {
            const meta = PERIOD_META[m.period] || { emoji: "📌", color: "#6b7280", label: m.period }
            return (
              <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} style={{ position: "relative", marginBottom: 16, paddingLeft: 24 }}>
                {/* ドット */}
                <div style={{ position: "absolute", left: -5, top: 12, width: 14, height: 14, borderRadius: "50%", background: m.is_completed ? meta.color : "var(--surface-bg)", border: `3px solid ${meta.color}`, zIndex: 1 }} />

                <div style={{ ...card, padding: 16, opacity: m.is_completed ? 0.7 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{meta.emoji}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `${meta.color}15`, color: meta.color, fontWeight: 700 }}>{meta.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{m.title}</span>
                    <button onClick={() => toggleMilestone(m)} style={{ background: "none", border: "none", cursor: "pointer", color: m.is_completed ? "#22c55e" : "var(--text-secondary)" }}>
                      {m.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                  </div>
                  {m.description && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, textDecoration: m.is_completed ? "line-through" : "none" }}>
                      {m.description}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* 月次フォーカス */}
      {careerPath && milestones.length > 0 && (
        <div style={{ ...card, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>📅 今月のフォーカスポイント</h3>
          <button onClick={getFocusAdvice} disabled={focusLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: focusLoading ? 0.7 : 1 }}>
            {focusLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
            Airに今月のフォーカスを提案してもらう
          </button>
          {focusAdvice && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, padding: 14, borderRadius: 12, background: "linear-gradient(135deg,#f5f2fd,#fce4ec)", fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {focusAdvice}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
