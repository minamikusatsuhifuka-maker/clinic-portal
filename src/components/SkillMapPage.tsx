"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, Star, Plus, Trash2, Download } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts"

interface SkillMapPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
  currentUserRole: string
}

interface SkillCategory { id: string; role: string; name: string; description: string | null; order_index: number }
interface SkillScore { id: string; staff_id: string; category_id: string; score: number; scored_by: string | null; note: string | null; scored_at: string }
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

const SCORE_COLORS = ["", "#d1d5db", "#93c5fd", "#60a5fa", "#22c55e", "#b8975a"]

export default function SkillMapPage({ userRole, currentUserStaffId, currentUserRole }: SkillMapPageProps) {
  const isManager = userRole === "admin" || userRole === "manager"
  const isAdmin = userRole === "admin"
  const [tab, setTab] = useState<"my" | "team" | "manage">("my")
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [scores, setScores] = useState<SkillScore[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState(currentUserRole)
  const [editModal, setEditModal] = useState<{ staffId: string; catId: string } | null>(null)
  const [editScore, setEditScore] = useState(3)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillRole, setNewSkillRole] = useState("受付")

  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const [{ data: cats }, { data: sc }, { data: st }] = await Promise.all([
      supabase.from("skill_categories").select("*").order("order_index"),
      supabase.from("skill_scores").select("*"),
      supabase.from("staff").select("id, name, role").order("name"),
    ])
    if (cats) setCategories(cats)
    if (sc) setScores(sc)
    if (st) setStaffList(st)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const myCategories = categories.filter(c => c.role === currentUserRole)
  const filteredCategories = categories.filter(c => c.role === roleFilter)
  const getScore = (staffId: string, catId: string) => scores.find(s => s.staff_id === staffId && s.category_id === catId)?.score || 0
  const roles = [...new Set(categories.map(c => c.role))]

  const radarData = myCategories.map(c => ({
    name: c.name,
    score: (getScore(currentUserStaffId, c.id) / 5) * 100,
  }))

  const saveScore = async () => {
    if (!supabase || !editModal) return
    const existing = scores.find(s => s.staff_id === editModal.staffId && s.category_id === editModal.catId)
    if (existing) {
      await supabase.from("skill_scores").update({ score: editScore, scored_at: new Date().toISOString() }).eq("id", existing.id)
    } else {
      await supabase.from("skill_scores").insert({ staff_id: editModal.staffId, category_id: editModal.catId, score: editScore })
    }
    setEditModal(null)
    await fetchData()
  }

  const analyzeSkills = async () => {
    setAiLoading(true)
    const skillData = myCategories.map(c => ({ name: c.name, score: getScore(currentUserStaffId, c.id) }))
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `スタッフの役職と各スキルスコアを分析して、\n①強みポイント②成長課題③今週取り組むべきアクション\nを各50字以内で提案してください。\n役職：${currentUserRole}\nスキルスコア：${JSON.stringify(skillData)}\n知識ベース（リードマネジメント・成功の8原則）も参照してください。` }],
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

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

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
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>📊 スキルレーダー（{currentUserRole}）</h3>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(124,101,204,0.15)" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="スコア" dataKey="score" stroke="#b8975a" fill="#b8975a" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>スキルデータがありません</div>
            )}
          </div>

          <div style={{ ...card, padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>スキル項目</h3>
            {myCategories.map(c => {
              const score = getScore(currentUserStaffId, c.id)
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--subtle-bg)" }}>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", flex: 1 }}>{c.name}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={16} fill={n <= score ? "#b8975a" : "none"} stroke={n <= score ? "#b8975a" : "#d1d5db"} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={analyzeSkills} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
            Airに強み・課題を分析してもらう
          </button>
          {aiAnalysis && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, ...card, padding: 16, fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {aiAnalysis}
            </motion.div>
          )}
        </>
      )}

      {/* チーム一覧 */}
      {tab === "team" && isManager && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <select style={{ ...inp, width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(124,101,204,0.2)", background: "var(--surface-bg)", fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
              <Download size={13} /> CSVエクスポート
            </button>
          </div>
          <div style={{ ...card, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--subtle-bg)" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, position: "sticky", left: 0, background: "var(--surface-bg)" }}>スタッフ</th>
                  {filteredCategories.map(c => (
                    <th key={c.id} style={{ padding: "10px 8px", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, minWidth: 70 }}>{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffList.filter(s => s.role === roleFilter).map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--subtle-bg)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text-primary)", position: "sticky", left: 0, background: "var(--surface-bg)" }}>{s.name}</td>
                    {filteredCategories.map(c => {
                      const score = getScore(s.id, c.id)
                      return (
                        <td key={c.id} onClick={() => { setEditModal({ staffId: s.id, catId: c.id }); setEditScore(score || 3) }} style={{ padding: "8px", textAlign: "center", cursor: "pointer", background: score ? `${SCORE_COLORS[score]}20` : "transparent", fontWeight: score ? 700 : 400, color: score ? SCORE_COLORS[score] : "var(--text-secondary)" }}>
                          {score || "-"}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* スコア編集モーダル */}
          <AnimatePresence>
            {editModal && (
              <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setEditModal(null)}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ ...card, padding: 24, width: 300 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>スコアを入力</h4>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <motion.button key={n} whileTap={{ scale: 0.9 }} onClick={() => setEditScore(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Star size={28} fill={n <= editScore ? "#b8975a" : "none"} stroke={n <= editScore ? "#b8975a" : "#d1d5db"} />
                      </motion.button>
                    ))}
                  </div>
                  <button onClick={saveScore} style={{ width: "100%", padding: 10, borderRadius: 10, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>保存</button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* スキル項目管理 */}
      {tab === "manage" && isAdmin && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <select style={{ ...inp, width: 120 }} value={newSkillRole} onChange={e => setNewSkillRole(e.target.value)}>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input style={{ ...inp, flex: 1 }} placeholder="新しいスキル項目名" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} />
            <button onClick={addCategory} style={{ padding: "8px 16px", borderRadius: 10, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>
              <Plus size={14} />
            </button>
          </div>
          {roles.map(role => (
            <div key={role} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{role}</div>
              {categories.filter(c => c.role === role).map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--subtle-bg)" }}>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>{c.name}</span>
                  <button onClick={() => deleteCategory(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
