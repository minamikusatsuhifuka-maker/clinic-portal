"use client"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, Loader2, Sparkles, ChevronDown, ChevronUp, Send } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface OJTPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
  currentUserName: string
}

interface OJTItem {
  id: string; phase: number; role: string | null; category: string; content: string; order_index: number
}
interface OJTProgress {
  id: string; staff_id: string; item_id: string
  self_eval: "done" | "partial" | "not_yet" | null
  self_comment: string | null; manager_approved: boolean; manager_comment: string | null
}
interface PhaseApproval {
  staff_id: string; phase: number; approved_by: string | null; approved_at: string
}
interface Staff { id: string; name: string; role: string }

const PHASES = [
  { month: 3, label: "3ヶ月", color: "#3b82f6", emoji: "🌱" },
  { month: 6, label: "6ヶ月", color: "#22c55e", emoji: "🌿" },
  { month: 12, label: "12ヶ月", color: "#b8975a", emoji: "🌟" },
]

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

export default function OJTPage({ userRole, currentUserStaffId, currentUserName }: OJTPageProps) {
  const isManager = userRole === "admin" || userRole === "manager"
  const [phase, setPhase] = useState(3)
  const [items, setItems] = useState<OJTItem[]>([])
  const [progress, setProgress] = useState<OJTProgress[]>([])
  const [approvals, setApprovals] = useState<PhaseApproval[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState(currentUserStaffId)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [aiAdvice, setAiAdvice] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [managerView, setManagerView] = useState(false)

  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const [{ data: it }, { data: pr }, { data: ap }, { data: st }] = await Promise.all([
      supabase.from("ojt_items").select("*").order("order_index"),
      supabase.from("ojt_progress").select("*"),
      supabase.from("ojt_phase_approvals").select("*"),
      supabase.from("staff").select("id, name, role").order("name"),
    ])
    if (it) setItems(it)
    if (pr) setProgress(pr)
    if (ap) setApprovals(ap as PhaseApproval[])
    if (st) setStaffList(st)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const phaseItems = items.filter(i => i.phase === phase)
  const categories = [...new Set(phaseItems.map(i => i.category))]
  const staffProgress = progress.filter(p => p.staff_id === selectedStaff)
  const getProgress = (itemId: string) => staffProgress.find(p => p.item_id === itemId)
  const doneCount = phaseItems.filter(i => getProgress(i.id)?.self_eval === "done").length
  const totalCount = phaseItems.length
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const isPhaseApproved = approvals.some(a => a.staff_id === selectedStaff && a.phase === phase)

  const updateEval = async (itemId: string, eval_val: "done" | "partial" | "not_yet") => {
    if (!supabase) return
    const existing = getProgress(itemId)
    if (existing) {
      await supabase.from("ojt_progress").update({ self_eval: eval_val, updated_at: new Date().toISOString() }).eq("id", existing.id)
    } else {
      await supabase.from("ojt_progress").insert({ staff_id: selectedStaff, item_id: itemId, self_eval: eval_val })
    }
    await fetchData()
  }

  const updateComment = async (itemId: string, comment: string, isManager: boolean) => {
    if (!supabase) return
    const existing = getProgress(itemId)
    const field = isManager ? "manager_comment" : "self_comment"
    if (existing) {
      await supabase.from("ojt_progress").update({ [field]: comment, updated_at: new Date().toISOString() }).eq("id", existing.id)
    } else {
      await supabase.from("ojt_progress").insert({ staff_id: selectedStaff, item_id: itemId, [field]: comment })
    }
    await fetchData()
  }

  const approveItem = async (itemId: string) => {
    if (!supabase) return
    const existing = getProgress(itemId)
    if (existing) {
      await supabase.from("ojt_progress").update({ manager_approved: true }).eq("id", existing.id)
    }
    await fetchData()
  }

  const approvePhase = async () => {
    if (!supabase) return
    await supabase.from("ojt_phase_approvals").insert({ staff_id: selectedStaff, phase, approved_by: currentUserName })
    await fetchData()
  }

  const askAir = async () => {
    setAiLoading(true)
    const notDone = phaseItems.filter(i => getProgress(i.id)?.self_eval !== "done").map(i => i.content)
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `あなたは南草津皮フ科クリニックのスタッフ育成コーチです。\n以下の未達成OJT項目について、具体的な練習方法と心構えをアドバイスしてください。\nクリニックの理念（患者様第一・チームワーク・成長）を踏まえてください。\n未達成項目：\n${notDone.map((n, i) => `${i + 1}. ${n}`).join("\n")}` }],
          currentPage: "ojt", userRole,
        }),
      })
      setAiAdvice(await res.text())
    } catch { setAiAdvice("アドバイスの取得に失敗しました。") }
    setAiLoading(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* マネージャー切替 */}
      {isManager && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => { setManagerView(false); setSelectedStaff(currentUserStaffId) }} style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: !managerView ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)", color: !managerView ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            自分のOJT
          </button>
          <button onClick={() => setManagerView(true)} style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: managerView ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)", color: managerView ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            スタッフ管理
          </button>
        </div>
      )}

      {/* マネージャービュー：スタッフ選択 */}
      {isManager && managerView && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {staffList.map(s => {
              const sDoneCount = items.filter(i => i.phase === phase).filter(i => progress.find(p => p.staff_id === s.id && p.item_id === i.id)?.self_eval === "done").length
              const sPct = totalCount > 0 ? Math.round((sDoneCount / totalCount) * 100) : 0
              return (
                <button key={s.id} onClick={() => setSelectedStaff(s.id)} style={{ ...card, padding: "10px 14px", cursor: "pointer", border: selectedStaff === s.id ? "2px solid #b8975a" : "1px solid rgba(100,80,180,0.13)", minWidth: 120 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.role}</div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: "var(--subtle-bg)", overflow: "hidden" }}>
                    <motion.div animate={{ width: `${sPct}%` }} style={{ height: "100%", background: PHASES.find(p => p.month === phase)?.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 3 }}>{sPct}%</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* フェーズステッパー */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
        {PHASES.map((p, i) => (
          <div key={p.month} style={{ display: "flex", alignItems: "center" }}>
            <button onClick={() => setPhase(p.month)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 12, border: phase === p.month ? `2px solid ${p.color}` : "1px solid rgba(100,80,180,0.13)", background: phase === p.month ? `${p.color}15` : "var(--surface-bg)", cursor: "pointer", color: phase === p.month ? p.color : "var(--text-secondary)", fontSize: 13, fontWeight: phase === p.month ? 700 : 400 }}>
              {isPhaseApproved ? <CheckCircle2 size={16} style={{ color: "#22c55e" }} /> : <span>{p.emoji}</span>}
              {p.label}
            </button>
            {i < PHASES.length - 1 && <div style={{ width: 24, height: 2, background: "var(--subtle-bg)" }} />}
          </div>
        ))}
      </div>

      {/* 達成率 */}
      <div style={{ ...card, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>達成率</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: PHASES.find(p => p.month === phase)?.color }}>{pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "var(--subtle-bg)", overflow: "hidden" }}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} style={{ height: "100%", background: `linear-gradient(90deg, ${PHASES.find(p => p.month === phase)?.color}, ${PHASES.find(p => p.month === phase)?.color}88)`, borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{doneCount} / {totalCount} 項目完了</div>
      </div>

      {/* チェックリスト */}
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, padding: "4px 0", borderBottom: "1px solid var(--subtle-bg)" }}>{cat}</div>
          {phaseItems.filter(i => i.category === cat).map(item => {
            const prog = getProgress(item.id)
            const eval_val = prog?.self_eval || "not_yet"
            const isExpanded = expandedItem === item.id
            return (
              <motion.div key={item.id} layout style={{ ...card, padding: "12px 16px", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>{item.content}</div>
                    {prog?.manager_approved && <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>✓ 承認済み</span>}
                  </div>
                  {/* 自己評価ボタン（staffまたは自分のOJT表示時） */}
                  {(!managerView || !isManager) && (
                    <div style={{ display: "flex", gap: 4 }}>
                      {([["done", "✅", "#22c55e"], ["partial", "△", "#eab308"], ["not_yet", "まだ", "#9ca3af"]] as const).map(([val, label, color]) => (
                        <motion.button key={val} whileTap={{ scale: 0.9 }} onClick={() => updateEval(item.id, val)} style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${eval_val === val ? color : "transparent"}`, background: eval_val === val ? `${color}15` : "var(--subtle-bg)", fontSize: 11, fontWeight: eval_val === val ? 700 : 400, color: eval_val === val ? color : "var(--text-secondary)", cursor: "pointer" }}>
                          {label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                  {/* マネージャー承認ボタン */}
                  {isManager && managerView && !prog?.manager_approved && eval_val === "done" && (
                    <button onClick={() => approveItem(item.id)} style={{ padding: "4px 12px", borderRadius: 8, background: "#22c55e", color: "white", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}>承認</button>
                  )}
                  <button onClick={() => setExpandedItem(isExpanded ? null : item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 3 }}>{isManager && managerView ? "管理者コメント" : "コメント"}</label>
                      <textarea style={{ ...inp, resize: "none" }} rows={2} defaultValue={(isManager && managerView ? prog?.manager_comment : prog?.self_comment) || ""} onBlur={e => updateComment(item.id, e.target.value, isManager && managerView)} />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      ))}

      {/* フェーズ承認 */}
      {isManager && managerView && pct === 100 && !isPhaseApproved && (
        <button onClick={approvePhase} style={{ width: "100%", padding: 14, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", marginBottom: 16 }}>
          ✅ {PHASES.find(p => p.month === phase)?.label}フェーズを承認する
        </button>
      )}

      {/* Air相談 */}
      {!managerView && doneCount < totalCount && (
        <div style={{ ...card, padding: 16, marginTop: 8 }}>
          <button onClick={askAir} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
            Airに相談する（未達成項目のアドバイス）
          </button>
          {aiAdvice && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, padding: 14, borderRadius: 12, background: "linear-gradient(135deg,#f5f2fd,#fce4ec)", fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {aiAdvice}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
