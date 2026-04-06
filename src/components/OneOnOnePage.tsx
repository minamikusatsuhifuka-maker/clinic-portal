"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ChevronDown, ChevronUp, Loader2, Sparkles, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface OneOnOnePageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserName: string
  currentUserStaffId?: string
}

interface OneOnOne {
  id: string
  staff_id: string
  conducted_by: string
  conducted_at: string
  result: string | null
  why: string | null
  discovery: string | null
  emotion: string | null
  plan: string | null
  commitment: string | null
  ai_summary: string | null
  shared_with_staff: boolean
  created_at: string
  staff?: { id: string; name: string }
}

interface Staff {
  id: string
  name: string
  role: string
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

const RWDEPC = [
  { key: "result", label: "R（Result）", sub: "今月の成果・結果", color: "#ef4444" },
  { key: "why", label: "W（Why）", sub: "そうなった理由・背景", color: "#3b82f6" },
  { key: "discovery", label: "D（Discovery）", sub: "気づき・学び", color: "#22c55e" },
  { key: "emotion", label: "E（Emotion）", sub: "今の感情・モチベーション", color: "#eab308" },
  { key: "plan", label: "P（Plan）", sub: "次のアクション計画", color: "#a855f7" },
  { key: "commitment", label: "C（Commitment）", sub: "いつまでに何をするか", color: "#b8975a" },
] as const

export default function OneOnOnePage({ userRole, currentUserName, currentUserStaffId }: OneOnOnePageProps) {
  const isManager = userRole === "admin" || userRole === "manager"
  const [tab, setTab] = useState<"list" | "new">("list")
  const [records, setRecords] = useState<OneOnOne[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [filterStaff, setFilterStaff] = useState("")

  // フォーム
  const [form, setForm] = useState({
    staff_id: "", conducted_at: new Date().toISOString().slice(0, 10),
    conducted_by: currentUserName,
    result: "", why: "", discovery: "", emotion: "", plan: "", commitment: "",
    shared_with_staff: false,
  })
  const [aiSummary, setAiSummary] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const [{ data: staff }, { data: recs }] = await Promise.all([
      supabase.from("staff").select("id, name, role").order("name"),
      supabase.from("one_on_ones").select("*, staff:staff_id(id, name)").order("conducted_at", { ascending: false }),
    ])
    if (staff) setStaffList(staff)
    if (recs) setRecords(recs as OneOnOne[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredRecords = records.filter(r => {
    if (!isManager) {
      return r.staff_id === currentUserStaffId && r.shared_with_staff
    }
    if (filterStaff) {
      const s = r.staff as { id: string; name: string } | undefined
      return s?.id === filterStaff
    }
    return true
  })

  const generateSummary = async () => {
    setAiLoading(true)
    try {
      const prompt = `以下の1on1面談記録をRWDEPCフレームワークに沿って200字以内でサマリーしてください。
スタッフへの励ましと次のアクションを含めてください。
R（成果）: ${form.result}
W（理由）: ${form.why}
D（気づき）: ${form.discovery}
E（感情）: ${form.emotion}
P（計画）: ${form.plan}
C（コミット）: ${form.commitment}`
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          currentPage: "oneonone", userRole,
        }),
      })
      const text = await res.text()
      setAiSummary(text)
    } catch { setAiSummary("サマリー生成に失敗しました。") }
    setAiLoading(false)
  }

  const saveRecord = async () => {
    if (!supabase || !form.staff_id) return
    setSaving(true)
    await supabase.from("one_on_ones").insert({
      staff_id: form.staff_id,
      conducted_by: form.conducted_by,
      conducted_at: form.conducted_at,
      result: form.result || null, why: form.why || null,
      discovery: form.discovery || null, emotion: form.emotion || null,
      plan: form.plan || null, commitment: form.commitment || null,
      ai_summary: aiSummary || null,
      shared_with_staff: form.shared_with_staff,
    })
    setForm({ staff_id: "", conducted_at: new Date().toISOString().slice(0, 10), conducted_by: currentUserName, result: "", why: "", discovery: "", emotion: "", plan: "", commitment: "", shared_with_staff: false })
    setAiSummary("")
    setTab("list")
    await fetchData()
    setSaving(false)
  }

  const staffName = (r: OneOnOne) => {
    const s = r.staff as { id: string; name: string } | undefined
    return s?.name || "不明"
  }

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* タブ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab("list")} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: tab === "list" ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)", color: tab === "list" ? "white" : "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          面談記録一覧
        </button>
        {isManager && (
          <button onClick={() => setTab("new")} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: tab === "new" ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)", color: tab === "new" ? "white" : "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />新規記録作成
          </button>
        )}
      </div>

      {/* 新規作成フォーム */}
      {tab === "new" && isManager && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>🤝 新規1on1記録</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>スタッフ *</label>
              <select style={inp} value={form.staff_id} onChange={e => setForm(p => ({ ...p, staff_id: e.target.value }))}>
                <option value="">選択してください</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>面談日</label>
              <input type="date" style={inp} value={form.conducted_at} onChange={e => setForm(p => ({ ...p, conducted_at: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>面談者</label>
              <input style={inp} value={form.conducted_by} onChange={e => setForm(p => ({ ...p, conducted_by: e.target.value }))} />
            </div>
          </div>

          {RWDEPC.map(r => (
            <div key={r.key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                {r.label} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-secondary)" }}>— {r.sub}</span>
              </label>
              <textarea style={{ ...inp, resize: "none" }} rows={2} value={form[r.key as keyof typeof form] as string} onChange={e => setForm(p => ({ ...p, [r.key]: e.target.value }))} />
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-primary)", cursor: "pointer" }}>
              <input type="checkbox" checked={form.shared_with_staff} onChange={e => setForm(p => ({ ...p, shared_with_staff: e.target.checked }))} />
              スタッフと共有する
            </label>
            <button onClick={generateSummary} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: aiLoading ? 0.7 : 1 }}>
              {aiLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
              Airにサマリーを生成させる
            </button>
          </div>

          {aiSummary && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "linear-gradient(135deg,#f5f2fd,#fef3c7)", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", border: "1px solid rgba(184,151,90,0.3)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#b8975a", marginBottom: 6 }}>💡 AIサマリー</div>
              {aiSummary}
            </motion.div>
          )}

          <button onClick={saveRecord} disabled={saving || !form.staff_id} style={{ width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", opacity: saving || !form.staff_id ? 0.6 : 1 }}>
            {saving ? "保存中..." : "💾 面談記録を保存"}
          </button>
        </motion.div>
      )}

      {/* 一覧 */}
      {tab === "list" && (
        <>
          {isManager && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Filter size={14} style={{ color: "var(--text-secondary)" }} />
              <select style={{ ...inp, width: 200 }} value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
                <option value="">全スタッフ</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📝</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>面談記録がありません</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <AnimatePresence>
                {filteredRecords.map(r => {
                  const isOpen = openId === r.id
                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, overflow: "hidden" }}>
                      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setOpenId(isOpen ? null : r.id)}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{staffName(r)}</span>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>by {r.conducted_by}</span>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "#f0ede8", color: "#b8975a", fontWeight: 600 }}>
                              {new Date(r.conducted_at).toLocaleDateString("ja-JP")}
                            </span>
                          </div>
                          {r.ai_summary && (
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isOpen ? "normal" : "nowrap", maxWidth: isOpen ? "none" : 500 }}>
                              💡 {r.ai_summary}
                            </div>
                          )}
                        </div>
                        {isOpen ? <ChevronUp size={16} style={{ color: "var(--text-secondary)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-secondary)" }} />}
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                            <div style={{ padding: "0 18px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              {RWDEPC.map(item => {
                                const val = r[item.key as keyof OneOnOne] as string | null
                                if (!val) return null
                                return (
                                  <div key={item.key} style={{ padding: 10, borderRadius: 10, background: "var(--subtle-bg)", border: `1px solid ${item.color}22` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, display: "inline-block" }} />
                                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6 }}>{val}</div>
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  )
}
