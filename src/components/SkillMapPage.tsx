"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { Loader2, Sparkles, Star, Plus, Trash2, Download, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAppStore } from "@/store/useAppStore"
import dynamic from "next/dynamic"

const RadarChart = dynamic(() => import("recharts").then(m => ({ default: m.RadarChart })), { ssr: false })
const PolarGrid = dynamic(() => import("recharts").then(m => ({ default: m.PolarGrid })), { ssr: false })
const PolarAngleAxis = dynamic(() => import("recharts").then(m => ({ default: m.PolarAngleAxis })), { ssr: false })
const PolarRadiusAxis = dynamic(() => import("recharts").then(m => ({ default: m.PolarRadiusAxis })), { ssr: false })
const Radar = dynamic(() => import("recharts").then(m => ({ default: m.Radar })), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })), { ssr: false })

interface SkillMapPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
  currentUserRole: string
}

interface SkillCategory { id: string; role: string; name: string; description: string | null; order_index: number }
interface SkillScore { id: string; staff_id: string; category_id: string; score: number; scored_by: string | null; note: string | null; scored_at: string }
interface Staff { id: string; name: string; role: string }
interface OJTProgress { item_id: string; self_eval: string | null }
interface MBOGoal { id: string; title: string; progress: number; status: string }

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

const SCORE_COLORS = ["", "#d1d5db", "#93c5fd", "#60a5fa", "#22c55e", "#b8975a"]

// スケルトンカード
function SkeletonCard() {
  return (
    <div style={{ ...card, padding: 16, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 14, borderRadius: 4, background: "var(--subtle-bg)", animation: "pulse 1.5s infinite" }} />
        <div style={{ width: 90, height: 14, borderRadius: 4, background: "var(--subtle-bg)", animation: "pulse 1.5s infinite" }} />
      </div>
    </div>
  )
}

export default function SkillMapPage({ userRole, currentUserStaffId, currentUserRole }: SkillMapPageProps) {
  const isManager = userRole === "admin" || userRole === "manager"
  const isAdmin = userRole === "admin"
  const { setActivePage } = useAppStore()
  const [tab, setTab] = useState<"my" | "team" | "manage">("my")
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [scores, setScores] = useState<SkillScore[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState(currentUserRole)
  const [editModal, setEditModal] = useState<{ staffId: string; catId: string; staffName?: string; catName?: string } | null>(null)
  const [editScore, setEditScore] = useState(3)
  const [editNote, setEditNote] = useState("")
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillRole, setNewSkillRole] = useState("受付")
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [hoveredCol, setHoveredCol] = useState<string | null>(null)

  // OJT/MBO連動
  const [ojtProgress, setOjtProgress] = useState<OJTProgress[]>([])
  const [ojtTotal, setOjtTotal] = useState(0)
  const [mboGoals, setMboGoals] = useState<MBOGoal[]>([])

  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const currentQuarter = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`
    const [{ data: cats }, { data: sc }, { data: st }, { data: ojt }, { data: ojtItems }, { data: mbo }] = await Promise.all([
      supabase.from("skill_categories").select("*").order("order_index"),
      supabase.from("skill_scores").select("*"),
      supabase.from("staff").select("id, name, role").order("name"),
      supabase.from("ojt_progress").select("item_id, self_eval").eq("staff_id", currentUserStaffId),
      supabase.from("ojt_items").select("id"),
      supabase.from("mbo_goals").select("id, title, progress, status").eq("staff_id", currentUserStaffId).eq("quarter", currentQuarter).eq("status", "active").limit(3),
    ])
    if (cats) setCategories(cats)
    if (sc) setScores(sc)
    if (st) setStaffList(st)
    if (ojt) setOjtProgress(ojt)
    if (ojtItems) setOjtTotal(ojtItems.length)
    if (mbo) setMboGoals(mbo)
    setLoading(false)
  }, [currentUserStaffId])

  useEffect(() => { fetchData() }, [fetchData])

  const myCategories = categories.filter(c => c.role === currentUserRole)
  const filteredCategories = categories.filter(c => c.role === roleFilter)
  const getScore = (staffId: string, catId: string) => scores.find(s => s.staff_id === staffId && s.category_id === catId)?.score || 0
  const getNote = (staffId: string, catId: string) => scores.find(s => s.staff_id === staffId && s.category_id === catId)?.note || ""
  const roles = [...new Set(categories.map(c => c.role))]

  const radarData = myCategories.map(c => ({
    name: c.name,
    score: (getScore(currentUserStaffId, c.id) / 5) * 100,
  }))

  // 楽観的更新でスコア保存
  const saveScore = async () => {
    if (!supabase || !editModal) return
    const { staffId, catId } = editModal
    // 楽観的更新
    setScores(prev => {
      const idx = prev.findIndex(s => s.staff_id === staffId && s.category_id === catId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], score: editScore, note: editNote, scored_at: new Date().toISOString() }
        return updated
      }
      return [...prev, { id: `temp-${Date.now()}`, staff_id: staffId, category_id: catId, score: editScore, scored_by: null, note: editNote, scored_at: new Date().toISOString() }]
    })
    setEditModal(null)
    // DB保存
    const existing = scores.find(s => s.staff_id === staffId && s.category_id === catId)
    if (existing) {
      await supabase.from("skill_scores").update({ score: editScore, note: editNote, scored_at: new Date().toISOString() }).eq("id", existing.id)
    } else {
      await supabase.from("skill_scores").insert({ staff_id: staffId, category_id: catId, score: editScore, note: editNote })
    }
    // 最新データで同期
    const { data } = await supabase.from("skill_scores").select("*")
    if (data) setScores(data)
  }

  // 改善されたAIプロンプト
  const analyzeSkills = async () => {
    setAiLoading(true)
    const skillData = myCategories.map(c => ({ name: c.name, score: getScore(currentUserStaffId, c.id) }))
    const scored = skillData.filter(s => s.score > 0)
    const unscored = skillData.filter(s => s.score === 0).map(s => s.name)
    const formattedScores = scored.map(s => `${s.name}: ${s.score}/5`).join("\n")
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `あなたは南草津皮フ科クリニックの人材育成コーチ「Air」です。\n以下のスタッフ情報とスキルスコアを分析し、具体的で実践的なフィードバックをしてください。\n\nスタッフ情報：\n- 役職：${currentUserRole}\n- 評価日：${new Date().toLocaleDateString("ja-JP")}\n\nスキルスコア（1〜5段階）：\n${formattedScores}\n${unscored.length > 0 ? `※スコアなしの項目：${unscored.join("、")}` : ""}\n\nクリニックの理念・成功の8原則・リードマネジメントの観点から、\n以下の3点を各60字以内で具体的に回答してください：\n\n①【強み】最もスコアが高い項目とその活かし方\n②【課題】最もスコアが低い項目と今週できる具体的な練習方法1つ\n③【アドバイス】${currentUserRole}として次のステージに進むために今月フォーカスすべきこと\n\n回答は必ず①②③の形式で、絵文字を1つずつ使って読みやすく書いてください。` }],
          currentPage: "skillmap", userRole,
        }),
      })
      setAiAnalysis(await res.text())
    } catch { setAiAnalysis("分析に失敗しました。") }
    setAiLoading(false)
  }

  const exportCSV = () => {
    const header = ["スタッフ名", ...filteredCategories.map(c => c.name)].join(",")
    const rows = staffList.filter(s => s.role === roleFilter).map(s =>
      [s.name, ...filteredCategories.map(c => getScore(s.id, c.id))].join(",")
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `skillmap_${roleFilter}.csv`; a.click()
  }

  const addCategory = async () => {
    if (!supabase || !newSkillName.trim()) return
    const maxOrder = filteredCategories.reduce((m, c) => Math.max(m, c.order_index), 0)
    await supabase.from("skill_categories").insert({ role: newSkillRole, name: newSkillName, order_index: maxOrder + 1 })
    setNewSkillName("")
    await fetchData()
  }

  const deleteCategory = async (id: string) => {
    if (!supabase) return
    await supabase.from("skill_scores").delete().eq("category_id", id)
    await supabase.from("skill_categories").delete().eq("id", id)
    await fetchData()
  }

  const reorderCategories = async (newOrder: SkillCategory[]) => {
    if (!supabase) return
    const filtered = newOrder.filter(c => c.role === newSkillRole)
    setCategories(prev => {
      const others = prev.filter(c => c.role !== newSkillRole)
      return [...others, ...filtered]
    })
    for (let i = 0; i < filtered.length; i++) {
      await supabase.from("skill_categories").update({ order_index: i }).eq("id", filtered[i].id)
    }
  }

  // OJT達成率
  const ojtDoneCount = ojtProgress.filter(p => p.self_eval === "done").length
  const ojtPct = ojtTotal > 0 ? Math.round((ojtDoneCount / ojtTotal) * 100) : 0

  // チーム平均スコア
  const teamAvg = () => {
    const teamStaff = staffList.filter(s => s.role === roleFilter)
    if (teamStaff.length === 0 || filteredCategories.length === 0) return 0
    let total = 0, count = 0
    teamStaff.forEach(s => filteredCategories.forEach(c => {
      const sc = getScore(s.id, c.id)
      if (sc > 0) { total += sc; count++ }
    }))
    return count > 0 ? Math.round((total / count) * 10) / 10 : 0
  }

  // スケルトンローディング
  if (loading) return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[1, 2].map(i => <div key={i} style={{ width: 120, height: 36, borderRadius: 10, background: "var(--subtle-bg)", animation: "pulse 1.5s infinite" }} />)}
      </div>
      <div style={{ ...card, padding: 20, marginBottom: 16, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} />
      </div>
      {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* タブ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["my", ...(isManager ? ["team"] : []), ...(isAdmin ? ["manage"] : [])].map(t => (
          <button key={t} onClick={() => setTab(t as "my" | "team" | "manage")} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: tab === t ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)", color: tab === t ? "white" : "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t === "my" ? "🗺️ マイスキル" : t === "team" ? "👥 チーム一覧" : "⚙️ スキル項目管理"}
          </button>
        ))}
      </div>

      {/* マイスキル */}
      {tab === "my" && (
        <>
          {/* レーダーチャート（拡大） */}
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>📊 スキルレーダー（{currentUserRole}）</h3>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(124,101,204,0.15)" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="スコア" dataKey="score" stroke="#b8975a" fill="url(#goldGradient)" fillOpacity={0.3} strokeWidth={2} />
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4b87a" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#b8975a" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>スキルデータがありません</div>
            )}
          </div>

          {/* スキル項目一覧（星＋前回比＋未評価バッジ） */}
          <div style={{ ...card, padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>スキル項目</h3>
            {myCategories.map((c, i) => {
              const score = getScore(currentUserStaffId, c.id)
              const isUnscored = score === 0
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.02 }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 4, borderRadius: 10, background: isUnscored ? "rgba(156,163,175,0.06)" : "transparent", border: "1px solid transparent", cursor: "default" }}>
                  <span style={{ fontSize: 13, color: isUnscored ? "var(--text-secondary)" : "var(--text-primary)", flex: 1 }}>{c.name}</span>
                  {isUnscored ? (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "#f3f4f6", color: "#9ca3af", fontWeight: 600 }}>未評価</span>
                  ) : (
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={16} fill={n <= score ? "#b8975a" : "none"} stroke={n <= score ? "#b8975a" : "#d1d5db"} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Air分析 */}
          <button onClick={analyzeSkills} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: aiLoading ? 0.7 : 1, marginBottom: 16 }}>
            {aiLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
            Airに強み・課題を分析してもらう
          </button>
          {aiAnalysis && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...card, padding: 16, fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap", marginBottom: 16 }}>
              {aiAnalysis}
            </motion.div>
          )}

          {/* OJT連動 */}
          <div style={{ ...card, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>📋 OJT進捗との連動</h4>
              <button onClick={() => setActivePage("ojt")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#b8975a", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                OJTを確認する <ExternalLink size={11} />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--subtle-bg)", overflow: "hidden" }}>
                <motion.div animate={{ width: `${ojtPct}%` }} style={{ height: "100%", background: "linear-gradient(90deg, #22c55e, #86efac)", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", minWidth: 40 }}>{ojtPct}%</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{ojtDoneCount}/{ojtTotal} 項目達成</div>
          </div>

          {/* MBO連動 */}
          {mboGoals.length > 0 && (
            <div style={{ ...card, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>🎯 今期のMBO目標</h4>
                <button onClick={() => setActivePage("mbo")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#b8975a", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  MBOを開く <ExternalLink size={11} />
                </button>
              </div>
              {mboGoals.map(g => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--subtle-bg)" }}>
                  <span style={{ fontSize: 12, color: "var(--text-primary)", flex: 1 }}>{g.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#b8975a" }}>{g.progress}%</span>
                </div>
              ))}
            </div>
          )}

          {/* 低スコアのMBO提案 */}
          {myCategories.filter(c => { const s = getScore(currentUserStaffId, c.id); return s > 0 && s <= 3 }).length > 0 && (
            <div style={{ ...card, padding: 14, background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 8 }}>💡 スコア3以下のスキルをMBO目標に追加しませんか？</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {myCategories.filter(c => { const s = getScore(currentUserStaffId, c.id); return s > 0 && s <= 3 }).map(c => (
                  <button key={c.id} onClick={() => setActivePage("mbo")} style={{ padding: "4px 12px", borderRadius: 8, background: "#b8975a", color: "white", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}>
                    {c.name} → MBOに追加
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* チーム一覧 */}
      {tab === "team" && isManager && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <select style={{ ...inp, width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, background: "#b8975a15", color: "#b8975a", fontWeight: 700 }}>
              チーム平均: {teamAvg()}/5.0
            </span>
            <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(124,101,204,0.2)", background: "var(--surface-bg)", fontSize: 12, color: "var(--text-secondary)", cursor: "pointer", marginLeft: "auto" }}>
              <Download size={13} /> CSVエクスポート
            </button>
          </div>
          <div style={{ ...card, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--subtle-bg)" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, position: "sticky", left: 0, background: "var(--surface-bg)", zIndex: 1 }}>スタッフ</th>
                  {filteredCategories.map(c => (
                    <th key={c.id} onMouseEnter={() => setHoveredCol(c.id)} onMouseLeave={() => setHoveredCol(null)} style={{ padding: "10px 8px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, minWidth: 70, background: hoveredCol === c.id ? "rgba(184,151,90,0.08)" : "transparent", transition: "background 0.15s" }}>{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffList.filter(s => s.role === roleFilter).map((s, si) => (
                  <motion.tr key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: si * 0.03 }} onMouseEnter={() => setHoveredRow(s.id)} onMouseLeave={() => setHoveredRow(null)} style={{ borderBottom: "1px solid var(--subtle-bg)", background: hoveredRow === s.id ? "rgba(184,151,90,0.04)" : "transparent", transition: "background 0.15s" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text-primary)", position: "sticky", left: 0, background: hoveredRow === s.id ? "rgba(184,151,90,0.04)" : "var(--surface-bg)", zIndex: 1 }}>{s.name}</td>
                    {filteredCategories.map(c => {
                      const score = getScore(s.id, c.id)
                      const isHl = hoveredCol === c.id || hoveredRow === s.id
                      return (
                        <td key={c.id} onClick={() => { setEditModal({ staffId: s.id, catId: c.id, staffName: s.name, catName: c.name }); setEditScore(score || 3); setEditNote(getNote(s.id, c.id)) }} style={{ padding: "8px", textAlign: "center", cursor: "pointer", background: isHl ? "rgba(184,151,90,0.08)" : score ? `${SCORE_COLORS[score]}20` : "transparent", fontWeight: score ? 700 : 400, color: score ? SCORE_COLORS[score] : "var(--text-secondary)", transition: "background 0.15s" }}>
                          {score || "－"}
                        </td>
                      )
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* スコア編集モーダル（コメント欄追加） */}
          <AnimatePresence>
            {editModal && (
              <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setEditModal(null)}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ ...card, padding: 24, width: 340 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>スコアを入力</h4>
                  {editModal.staffName && editModal.catName && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>{editModal.staffName} — {editModal.catName}</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <motion.button key={n} whileTap={{ scale: 0.9 }} onClick={() => setEditScore(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Star size={28} fill={n <= editScore ? "#b8975a" : "none"} stroke={n <= editScore ? "#b8975a" : "#d1d5db"} />
                      </motion.button>
                    ))}
                  </div>
                  <textarea style={{ ...inp, resize: "none", marginBottom: 12 }} rows={2} placeholder="コメント（任意）" value={editNote} onChange={e => setEditNote(e.target.value)} />
                  <button onClick={saveScore} style={{ width: "100%", padding: 10, borderRadius: 10, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>保存</button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* スキル項目管理（並び替え対応） */}
      {tab === "manage" && isAdmin && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <select style={{ ...inp, width: 120 }} value={newSkillRole} onChange={e => setNewSkillRole(e.target.value)}>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input style={{ ...inp, flex: 1 }} placeholder="新しいスキル項目名" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addCategory() }} />
            <button onClick={addCategory} style={{ padding: "8px 16px", borderRadius: 10, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>
              <Plus size={14} />
            </button>
          </div>
          {roles.map(role => {
            const roleCats = categories.filter(c => c.role === role)
            return (
              <div key={role} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{role}</div>
                <Reorder.Group axis="y" values={roleCats} onReorder={(newOrder) => {
                  setCategories(prev => {
                    const others = prev.filter(c => c.role !== role)
                    return [...others, ...newOrder]
                  })
                  // DB更新
                  const sb = supabase
                  if (sb) {
                    newOrder.forEach(async (c, i) => {
                      await sb.from("skill_categories").update({ order_index: i }).eq("id", c.id)
                    })
                  }
                }} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {roleCats.map(c => (
                    <Reorder.Item key={c.id} value={c} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 4, borderRadius: 8, background: "var(--surface-bg)", border: "1px solid var(--subtle-bg)", cursor: "grab" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>⠿</span>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>{c.name}</span>
                      <button onClick={() => deleteCategory(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}><Trash2 size={14} /></button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
