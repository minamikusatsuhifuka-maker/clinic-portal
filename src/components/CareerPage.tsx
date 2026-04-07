"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, CheckCircle2, Circle, Target } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAppStore } from "@/store/useAppStore"

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

// インスピレーション例
const INSPIRATION_EXAMPLES = [
  { icon: "👩‍⚕️", title: "チームリーダーとして新人育成", desc: "新入社員の教育担当として、チームを引っ張れる存在に" },
  { icon: "🏥", title: "患者対応のスペシャリスト", desc: "患者様から「あなたに診てもらいたい」と言われる存在に" },
  { icon: "📋", title: "業務改善のプロフェッショナル", desc: "クリニックの業務フローを効率化し、チーム全体を底上げ" },
  { icon: "🌟", title: "マネージャーへの昇進", desc: "スタッフの面談・シフト管理ができるマネージャーを目指す" },
]

export default function CareerPage({ userRole, currentUserStaffId, currentUserRole }: CareerPageProps) {
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [goalText, setGoalText] = useState("")
  const [generating, setGenerating] = useState(false)
  const [focusAdvice, setFocusAdvice] = useState("")
  const [focusLoading, setFocusLoading] = useState(false)
  const { setActivePage } = useAppStore()

  const fetchData = useCallback(async () => {
    const sb = supabase
    if (!sb) return
    setLoading(true)
    const { data: cp } = await sb.from("career_paths").select("*").eq("staff_id", currentUserStaffId).single()
    if (cp) {
      setCareerPath(cp)
      setGoalText(cp.goal_text)
      const { data: ms } = await sb.from("career_milestones").select("*").eq("career_path_id", cp.id).order("id")
      if (ms) setMilestones(ms)
    }
    setLoading(false)
  }, [currentUserStaffId])

  useEffect(() => { fetchData() }, [fetchData])

  const generateRoadmap = async () => {
    const sb = supabase
    if (!sb || !goalText.trim()) return
    setGenerating(true)
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `あなたは南草津皮フ科クリニックのキャリアコンサルタントです。\n${currentUserRole}スタッフが以下のキャリアゴールを設定しました。\n現在のスキル・OJT状況を踏まえ、実践的なロードマップを作成してください。\n\n【考慮事項】\n・クリニックの理念（成長・チームワーク・患者様第一）\n・成功の8原則・リードマネジメント\n・現場でのOJT（先輩からの指導・実務経験）\n・段階的なスキルアップ（まず基礎→応用→指導側へ）\n\nゴール：${goalText}\n\n各期間で「何ができるようになるか」「どんな行動をとるか」を具体的に記述してください。\nJSON形式のみで返してください（前置き不要）：\n{"milestones":[{"period":"3m","title":"マイルストーン名","description":"具体的な内容（60字以内）"},{"period":"6m","title":"...","description":"..."},{"period":"1y","title":"...","description":"..."},{"period":"3y","title":"...","description":"..."}]}` }],
          currentPage: "career", userRole,
        }),
      })
      const text = await res.text()
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const roadmap = JSON.parse(match[0])

        if (careerPath) {
          await sb.from("career_milestones").delete().eq("career_path_id", careerPath.id)
          await sb.from("career_paths").update({ goal_text: goalText, roadmap, last_updated: new Date().toISOString() }).eq("id", careerPath.id)
          for (const m of roadmap.milestones) {
            await sb.from("career_milestones").insert({ career_path_id: careerPath.id, period: m.period, title: m.title, description: m.description })
          }
        } else {
          const { data: newPath } = await sb.from("career_paths").insert({ staff_id: currentUserStaffId, goal_text: goalText, roadmap }).select("id").single()
          if (newPath) {
            for (const m of roadmap.milestones) {
              await sb.from("career_milestones").insert({ career_path_id: newPath.id, period: m.period, title: m.title, description: m.description })
            }
          }
        }
        await fetchData()
      }
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const toggleMilestone = async (m: Milestone) => {
    const sb = supabase
    if (!sb) return
    await sb.from("career_milestones").update({
      is_completed: !m.is_completed,
      completed_at: !m.is_completed ? new Date().toISOString() : null,
    }).eq("id", m.id)
    await fetchData()
  }

  const getFocusAdvice = async () => {
    if (!careerPath) return
    setFocusLoading(true)
    const nextMilestone = milestones.find(m => !m.is_completed)
    const completedCount = milestones.filter(m => m.is_completed).length
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `あなたは南草津皮フ科クリニックのキャリアコンサルタントです。\nスタッフのキャリアゴールと進捗を確認し、今月フォーカスすべきことを3点、\n具体的なアクションとして提案してください（各50字以内）。\n\nゴール：${careerPath.goal_text}\n進捗：${completedCount}/${milestones.length}マイルストーン達成\n次のマイルストーン：${nextMilestone ? `${nextMilestone.title} - ${nextMilestone.description}` : "全て達成済み"}\n役職：${currentUserRole}` }],
          currentPage: "career", userRole,
        }),
      })
      setFocusAdvice(await res.text())
    } catch { setFocusAdvice("アドバイスの取得に失敗しました。") }
    setFocusLoading(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

  const completedCount = milestones.filter(m => m.is_completed).length
  const charCount = goalText.length

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>🚀 キャリアパス設計</h2>

      {/* ゴール設定 */}
      <div style={{ ...card, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          🎯 3年後にどんなスタッフ・どんな人生でありたいか
        </h3>

        {/* インスピレーション例（クリック可能カード） */}
        {!careerPath && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>例を参考にしてみましょう：</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {INSPIRATION_EXAMPLES.map((ex, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setGoalText(ex.desc)}
                  style={{
                    ...card, padding: 12, cursor: "pointer", textAlign: "left",
                    border: goalText === ex.desc ? "2px solid #b8975a" : "1px solid rgba(100,80,180,0.13)",
                    background: goalText === ex.desc ? "rgba(184,151,90,0.05)" : "var(--surface-bg)",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{ex.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{ex.title}</div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.4 }}>{ex.desc}</div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <textarea style={{ ...inp, resize: "none" }} rows={5} placeholder="あなたのキャリアゴールを自由に書いてください..." value={goalText} onChange={e => setGoalText(e.target.value)} />
        {/* 文字数カウンター */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: charCount > 0 ? "var(--text-secondary)" : "transparent" }}>{charCount}字</span>
        </div>
        <button onClick={generateRoadmap} disabled={generating || !goalText.trim()} style={{ marginTop: 8, width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", opacity: generating ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {generating ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> ロードマップ生成中...</> : <><Sparkles size={14} /> {careerPath ? "Airにロードマップを再生成してもらう" : "Airにロードマップを作ってもらう"}</>}
        </button>
      </div>

      {/* ロードマップ（タイムライン） */}
      {milestones.length > 0 && (
        <div style={{ position: "relative", paddingLeft: 28, marginBottom: 20 }}>
          {/* タイムラインの線 */}
          <div style={{ position: "absolute", left: 13, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #22c55e, #3b82f6, #a855f7, #b8975a)" }} />

          {/* 進捗サマリー */}
          <div style={{ marginBottom: 16, paddingLeft: 20, fontSize: 12, color: "var(--text-secondary)" }}>
            達成状況：{completedCount} / {milestones.length} マイルストーン
          </div>

          {milestones.map((m, i) => {
            const meta = PERIOD_META[m.period] || { emoji: "📌", color: "#6b7280", label: m.period }
            return (
              <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} style={{ position: "relative", marginBottom: 16, paddingLeft: 24 }}>
                {/* タイムラインドット */}
                <div style={{ position: "absolute", left: -7, top: 14, width: 18, height: 18, borderRadius: "50%", background: m.is_completed ? meta.color : "var(--surface-bg)", border: `3px solid ${meta.color}`, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {m.is_completed && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: "white", fontSize: 10, lineHeight: 1 }}>✓</motion.div>
                  )}
                </div>

                <div style={{
                  ...card, padding: 16,
                  borderLeft: m.is_completed ? `3px solid ${meta.color}` : "3px solid transparent",
                  opacity: m.is_completed ? 0.8 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `${meta.color}15`, color: meta.color, fontWeight: 700 }}>{meta.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{m.title}</span>
                    <button onClick={() => toggleMilestone(m)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      {m.is_completed ? (
                        <CheckCircle2 size={22} style={{ color: "#b8975a" }} />
                      ) : (
                        <Circle size={22} style={{ color: "var(--text-secondary)" }} />
                      )}
                    </button>
                  </div>
                  {m.description && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, textDecoration: m.is_completed ? "line-through" : "none" }}>
                      {m.description}
                    </div>
                  )}
                  {/* MBO目標設定ボタン */}
                  {!m.is_completed && (
                    <button
                      onClick={() => setActivePage("mbo")}
                      style={{
                        marginTop: 8, padding: "5px 12px", borderRadius: 8,
                        border: "1px solid #b8975a", background: "transparent",
                        color: "#b8975a", fontSize: 11, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      <Target size={12} /> MBO目標を設定する
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* 月次フォーカス */}
      {careerPath && milestones.length > 0 && (
        <div style={{ ...card, padding: 20, border: "2px solid rgba(184,151,90,0.3)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#b8975a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            📅 今月のフォーカスポイント
          </h3>
          <button onClick={getFocusAdvice} disabled={focusLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: focusLoading ? 0.7 : 1 }}>
            {focusLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
            Airに今月のフォーカスを提案してもらう
          </button>
          {focusAdvice && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 12, padding: 14, borderRadius: 12, background: "linear-gradient(135deg, rgba(184,151,90,0.08), rgba(212,184,122,0.08))", border: "1px solid rgba(184,151,90,0.15)", fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {focusAdvice}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
