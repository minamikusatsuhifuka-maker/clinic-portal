"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Loader2, Sparkles, ChevronDown, ChevronUp, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAppStore } from "@/store/useAppStore"

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
  { month: 3, label: "3ヶ月", emoji: "🌱" },
  { month: 6, label: "6ヶ月", emoji: "🌿" },
  { month: 12, label: "12ヶ月", emoji: "🌟" },
]

const EVAL_OPTIONS = [
  { val: "done" as const, label: "✅", color: "#22c55e" },
  { val: "partial" as const, label: "△", color: "#eab308" },
  { val: "not_yet" as const, label: "まだ", color: "#9ca3af" },
]

const GOLD = "#b8975a"
const GOLD_GRADIENT = "linear-gradient(135deg,#b8975a,#d4b87a)"

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
  const setActivePage = useAppStore(s => s.setActivePage)

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
  // カテゴリーアコーディオンの開閉状態（デフォルト全閉）
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

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

  const phaseItems = useMemo(() => items.filter(i => i.phase === phase), [items, phase])
  const categories = useMemo(() => [...new Set(phaseItems.map(i => i.category))], [phaseItems])
  const staffProgress = useMemo(() => progress.filter(p => p.staff_id === selectedStaff), [progress, selectedStaff])

  const getProgress = useCallback((itemId: string) => staffProgress.find(p => p.item_id === itemId), [staffProgress])

  const totalCount = phaseItems.length
  const doneCount = useMemo(() => phaseItems.filter(i => getProgress(i.id)?.self_eval === "done").length, [phaseItems, getProgress])
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // フェーズごとの承認状態チェック
  const getPhaseApproved = useCallback((ph: number) => approvals.some(a => a.staff_id === selectedStaff && a.phase === ph), [approvals, selectedStaff])
  const isPhaseApproved = getPhaseApproved(phase)

  // フェーズごとの達成率計算
  const getPhaseRate = useCallback((ph: number, staffId?: string) => {
    const sid = staffId || selectedStaff
    const pItems = items.filter(i => i.phase === ph)
    if (pItems.length === 0) return 0
    const done = pItems.filter(i => progress.find(p => p.staff_id === sid && p.item_id === i.id)?.self_eval === "done").length
    return Math.round((done / pItems.length) * 100)
  }, [items, progress, selectedStaff])

  // カテゴリーごとの達成率
  const getCategoryRate = useCallback((cat: string) => {
    const catItems = phaseItems.filter(i => i.category === cat)
    if (catItems.length === 0) return 0
    const done = catItems.filter(i => getProgress(i.id)?.self_eval === "done").length
    return Math.round((done / catItems.length) * 100)
  }, [phaseItems, getProgress])

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // 楽観的UI更新：self_evalの変更
  const updateEval = async (itemId: string, eval_val: "done" | "partial" | "not_yet") => {
    if (!supabase) return
    const existing = getProgress(itemId)

    // 楽観的にローカルstateを先に更新
    if (existing) {
      setProgress(prev => prev.map(p => p.id === existing.id ? { ...p, self_eval: eval_val } : p))
    } else {
      const optimistic: OJTProgress = {
        id: `temp_${Date.now()}`,
        staff_id: selectedStaff,
        item_id: itemId,
        self_eval: eval_val,
        self_comment: null,
        manager_approved: false,
        manager_comment: null,
      }
      setProgress(prev => [...prev, optimistic])
    }

    // Supabaseに反映
    try {
      if (existing) {
        await supabase.from("ojt_progress").update({ self_eval: eval_val, updated_at: new Date().toISOString() }).eq("id", existing.id)
      } else {
        await supabase.from("ojt_progress").insert({ staff_id: selectedStaff, item_id: itemId, self_eval: eval_val })
      }
      // サーバーから最新を取得して同期
      const { data } = await supabase.from("ojt_progress").select("*")
      if (data) setProgress(data)
    } catch {
      // 失敗時はサーバーから再取得
      await fetchData()
    }
  }

  const updateComment = async (itemId: string, comment: string, mgr: boolean) => {
    if (!supabase) return
    const existing = getProgress(itemId)
    const field = mgr ? "manager_comment" : "self_comment"
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
    const staffName = selectedStaff === currentUserStaffId
      ? currentUserName
      : staffList.find(s => s.id === selectedStaff)?.name || "スタッフ"
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `あなたは南草津皮フ科クリニックのスタッフ育成コーチ「Air」です。
${staffName}さんのOJT未達成項目について、具体的な練習方法をアドバイスしてください。

現在のフェーズ：${phase}ヶ月
達成率：${pct}%
未達成項目：
${notDone.map((n, i) => `${i + 1}. ${n}`).join("\n")}

【アドバイス形式】
①今週すぐできる練習（具体的に1つ）
②意識すべき心構え（クリニックの理念を踏まえて）
③マネージャーへの相談タイミング
各50字以内で答えてください。` }],
          currentPage: "ojt", userRole,
        }),
      })
      setAiAdvice(await res.text())
    } catch { setAiAdvice("アドバイスの取得に失敗しました。") }
    setAiLoading(false)
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} />
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* マネージャー切替 */}
      {isManager && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => { setManagerView(false); setSelectedStaff(currentUserStaffId) }} style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: !managerView ? GOLD_GRADIENT : "var(--subtle-bg)", color: !managerView ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            自分のOJT
          </button>
          <button onClick={() => setManagerView(true)} style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: managerView ? GOLD_GRADIENT : "var(--subtle-bg)", color: managerView ? "white" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            スタッフ管理
          </button>
        </div>
      )}

      {/* マネージャービュー：スタッフカード */}
      {isManager && managerView && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {staffList.map(s => {
              const sPct = getPhaseRate(phase, s.id)
              const currentPhaseLabel = PHASES.find(p => p.month === phase)?.label || ""
              return (
                <motion.button
                  key={s.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedStaff(s.id)}
                  style={{
                    ...card,
                    padding: "12px 16px",
                    cursor: "pointer",
                    border: selectedStaff === s.id ? `2px solid ${GOLD}` : "1px solid rgba(100,80,180,0.13)",
                    minWidth: 130,
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>{s.role}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                    {currentPhaseLabel}フェーズ
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--subtle-bg)", overflow: "hidden" }}>
                    <motion.div
                      animate={{ width: `${sPct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{ height: "100%", background: GOLD_GRADIENT, borderRadius: 3 }}
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginTop: 4 }}>{sPct}%</div>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* フェーズステッパー */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
        {PHASES.map((p, i) => {
          const approved = getPhaseApproved(p.month)
          const isCurrent = phase === p.month
          const rate = getPhaseRate(p.month)
          return (
            <div key={p.month} style={{ display: "flex", alignItems: "center" }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase(p.month)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "10px 18px", borderRadius: 12,
                  border: isCurrent ? `2px solid ${GOLD}` : "1px solid rgba(100,80,180,0.13)",
                  background: isCurrent ? `${GOLD}15` : "var(--surface-bg)",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {approved
                    ? <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
                    : <span>{p.emoji}</span>
                  }
                  <span style={{
                    fontSize: 13,
                    fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent ? GOLD : "var(--text-secondary)",
                  }}>
                    {p.label}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: isCurrent ? GOLD : "var(--text-secondary)", fontWeight: 600 }}>
                  {rate}%
                </span>
              </motion.button>
              {i < PHASES.length - 1 && (
                <div style={{
                  width: 24, height: 2,
                  background: approved ? "#22c55e" : "var(--subtle-bg)",
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* 達成率カード */}
      <div style={{ ...card, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>達成率</span>
          <motion.span
            key={pct}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ fontSize: 20, fontWeight: 700, color: GOLD }}
          >
            {pct}%
          </motion.span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "var(--subtle-bg)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${GOLD}, ${GOLD}88)`,
              borderRadius: 4,
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
          {doneCount} / {totalCount} 項目完了
          {isPhaseApproved && <span style={{ marginLeft: 8, color: "#22c55e", fontWeight: 600 }}>✅ 承認済み</span>}
        </div>
      </div>

      {/* カテゴリー別アコーディオン */}
      {categories.map(cat => {
        const isOpen = openCategories.has(cat)
        const catRate = getCategoryRate(cat)
        const catItems = phaseItems.filter(i => i.category === cat)
        return (
          <div key={cat} style={{ marginBottom: 12 }}>
            {/* カテゴリーヘッダー */}
            <button
              onClick={() => toggleCategory(cat)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 10,
                border: "1px solid rgba(100,80,180,0.1)",
                background: "var(--surface-bg)", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isOpen ? <ChevronUp size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{cat}</span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>({catItems.length})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 60, height: 4, borderRadius: 2, background: "var(--subtle-bg)", overflow: "hidden" }}>
                  <div style={{ width: `${catRate}%`, height: "100%", background: GOLD, borderRadius: 2, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: catRate === 100 ? "#22c55e" : GOLD }}>{catRate}%</span>
              </div>
            </button>

            {/* カテゴリー内の項目 */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ paddingTop: 6 }}>
                    {catItems.map(item => {
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
                            {/* 自己評価ボタン */}
                            {(!managerView || !isManager) && (
                              <div style={{ display: "flex", gap: 4 }}>
                                {EVAL_OPTIONS.map(({ val, label, color }) => (
                                  <motion.button
                                    key={val}
                                    whileTap={{ scale: 0.85, rotate: val === "done" ? 10 : 0 }}
                                    animate={eval_val === val ? { scale: [1, 1.15, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                    onClick={() => updateEval(item.id, val)}
                                    style={{
                                      padding: "4px 10px", borderRadius: 8,
                                      border: `1.5px solid ${eval_val === val ? color : "transparent"}`,
                                      background: eval_val === val ? `${color}18` : "var(--subtle-bg)",
                                      fontSize: 11, fontWeight: eval_val === val ? 700 : 400,
                                      color: eval_val === val ? color : "var(--text-secondary)",
                                      cursor: "pointer",
                                    }}
                                  >
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
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: "hidden", marginTop: 10 }}
                              >
                                <div>
                                  <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 3 }}>
                                    {isManager && managerView ? "管理者コメント" : "コメント"}
                                  </label>
                                  <textarea
                                    style={{ ...inp, resize: "none" }}
                                    rows={2}
                                    defaultValue={(isManager && managerView ? prog?.manager_comment : prog?.self_comment) || ""}
                                    onBlur={e => updateComment(item.id, e.target.value, isManager && managerView)}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {/* フェーズ承認 */}
      {isManager && managerView && pct === 100 && !isPhaseApproved && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={approvePhase}
          style={{ width: "100%", padding: 14, borderRadius: 12, background: GOLD_GRADIENT, color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", marginBottom: 16 }}
        >
          ✅ {PHASES.find(p => p.month === phase)?.label}フェーズを承認する
        </motion.button>
      )}

      {/* スキルマップリンク */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setActivePage("skillmap")}
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 12,
          border: `1.5px solid ${GOLD}`,
          background: `${GOLD}0a`,
          color: GOLD, fontSize: 13, fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6, marginBottom: 16,
        }}
      >
        <MapPin size={14} />
        スキルマップで成長を確認する
      </motion.button>

      {/* Air相談 */}
      {!managerView && doneCount < totalCount && (
        <div style={{ ...card, padding: 16, marginTop: 8 }}>
          <button onClick={askAir} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
            Airに相談する（未達成項目のアドバイス）
          </button>
          {aiAdvice && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 12, padding: 14, borderRadius: 12, background: "linear-gradient(135deg,#f5f2fd,#fce4ec)", fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {aiAdvice}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
