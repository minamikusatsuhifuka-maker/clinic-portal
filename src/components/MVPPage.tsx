"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, Trophy, Send } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface MVPPageProps {
  userRole: "staff" | "manager" | "admin"
  currentUserStaffId: string
  currentUserName: string
}

interface Nomination { id: string; year_month: string; nominee_staff_id: string; reason: string; nominated_at: string }
interface Award { id: string; year_month: string; winner_staff_id: string; ai_comment: string | null; winner_comment: string | null; announced_at: string | null }
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

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function MVPPage({ userRole, currentUserStaffId, currentUserName }: MVPPageProps) {
  const isAdmin = userRole === "admin"
  const [tab, setTab] = useState<"current" | "nominate" | "history" | "manage">("current")
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const ym = currentYearMonth()

  // 推薦フォーム
  const [nomineeId, setNomineeId] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [hasNominated, setHasNominated] = useState(false)

  // 管理
  const [selectedWinner, setSelectedWinner] = useState("")
  const [aiComment, setAiComment] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [winnerComment, setWinnerComment] = useState("")

  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const [{ data: noms }, { data: aw }, { data: st }] = await Promise.all([
      supabase.from("mvp_nominations").select("*").order("nominated_at", { ascending: false }),
      supabase.from("mvp_awards").select("*").order("year_month", { ascending: false }),
      supabase.from("staff").select("id, name, role").order("name"),
    ])
    if (noms) setNominations(noms)
    if (aw) setAwards(aw)
    if (st) setStaffList(st)
    // localStorage重複チェック
    const nominated = localStorage.getItem(`mvp_nominated_${ym}`)
    if (nominated) setHasNominated(true)
    setLoading(false)
  }, [ym])

  useEffect(() => { fetchData() }, [fetchData])

  const currentAward = awards.find(a => a.year_month === ym)
  const staffName = (id: string) => staffList.find(s => s.id === id)?.name || "不明"
  const monthNominations = nominations.filter(n => n.year_month === ym)
  const isBeforeDeadline = new Date().getDate() <= 25

  const nominate = async () => {
    if (!supabase || !nomineeId || reason.length < 50) return
    setSubmitting(true)
    await supabase.from("mvp_nominations").insert({ year_month: ym, nominee_staff_id: nomineeId, reason })
    localStorage.setItem(`mvp_nominated_${ym}`, "true")
    setHasNominated(true)
    setNomineeId(""); setReason("")
    await fetchData()
    setSubmitting(false)
  }

  const generateAiComment = async () => {
    setAiLoading(true)
    const reasons = monthNominations.filter(n => n.nominee_staff_id === selectedWinner).map(n => n.reason)
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `以下の推薦理由をまとめて、MVP受賞者への心温まるお祝いコメントを200字で生成してください。\nクリニックの理念（成長・チームワーク・患者様第一）を反映してください。\n推薦理由一覧：\n${reasons.join("\n")}` }],
          currentPage: "mvp", userRole,
        }),
      })
      setAiComment(await res.text())
    } catch { setAiComment("コメント生成に失敗しました。") }
    setAiLoading(false)
  }

  const announceWinner = async () => {
    if (!supabase || !selectedWinner) return
    await supabase.from("mvp_awards").insert({
      year_month: ym,
      winner_staff_id: selectedWinner,
      ai_comment: aiComment || null,
      announced_at: new Date().toISOString(),
    })
    // Chatwork通知
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `🏆 今月のMVPは${staffName(selectedWinner)}さんです！\n${aiComment}` }),
      })
    } catch { /* 通知失敗は無視 */ }
    await fetchData()
  }

  const saveWinnerComment = async () => {
    if (!supabase || !currentAward) return
    await supabase.from("mvp_awards").update({ winner_comment: winnerComment }).eq("id", currentAward.id)
    await fetchData()
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

  // 推薦集計
  const nominationCounts: Record<string, number> = {}
  monthNominations.forEach(n => { nominationCounts[n.nominee_staff_id] = (nominationCounts[n.nominee_staff_id] || 0) + 1 })

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* タブ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "current", label: "🏆 今月のMVP" },
          { id: "nominate", label: "推薦する" },
          { id: "history", label: "歴代MVP" },
          ...(isAdmin ? [{ id: "manage", label: "推薦管理" }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: tab === t.id ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)", color: tab === t.id ? "white" : "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 今月のMVP */}
      {tab === "current" && (
        currentAward ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ ...card, padding: 40, textAlign: "center", background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}>
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 64, marginBottom: 12 }}>🏆</motion.div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#b8975a", marginBottom: 8 }}>{staffName(currentAward.winner_staff_id)}</div>
            <div style={{ fontSize: 11, color: "#92400e", marginBottom: 16 }}>{ym.replace("-", "年")}月 MVP</div>
            {currentAward.ai_comment && (
              <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.7, color: "#78350f", marginBottom: 16, textAlign: "left" }}>
                ✨ {currentAward.ai_comment}
              </div>
            )}
            {currentAward.winner_comment && (
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(184,151,90,0.1)", fontSize: 13, color: "var(--text-primary)", textAlign: "left" }}>
                💬 受賞コメント: {currentAward.winner_comment}
              </div>
            )}
            {currentAward.winner_staff_id === currentUserStaffId && !currentAward.winner_comment && (
              <div style={{ marginTop: 16, textAlign: "left" }}>
                <textarea style={{ ...inp, resize: "none" }} rows={2} placeholder="受賞コメントを入力してください" value={winnerComment} onChange={e => setWinnerComment(e.target.value)} />
                <button onClick={saveWinnerComment} style={{ marginTop: 8, padding: "8px 16px", borderRadius: 10, background: "#b8975a", color: "white", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>コメントを投稿</button>
              </div>
            )}
          </motion.div>
        ) : (
          <div style={{ ...card, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>今月のMVPは月末に発表されます</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>現在 {Object.keys(nominationCounts).length} 名が推薦されています</div>
          </div>
        )
      )}

      {/* 推薦する */}
      {tab === "nominate" && (
        <div style={{ ...card, padding: 24 }}>
          {!isBeforeDeadline ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>推薦期間は25日までです</div>
            </div>
          ) : hasNominated ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>今月はすでに推薦しました</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>ありがとうございます！</div>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>🌟 MVPを推薦する</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>推薦するスタッフ</label>
                <select style={inp} value={nomineeId} onChange={e => setNomineeId(e.target.value)}>
                  <option value="">選択してください</option>
                  {staffList.filter(s => s.id !== currentUserStaffId).map(s => <option key={s.id} value={s.id}>{s.name}（{s.role}）</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>推薦理由（50〜200字）</label>
                <textarea style={{ ...inp, resize: "none" }} rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="このスタッフのどんなところが素晴らしいですか？" />
                <div style={{ fontSize: 10, color: reason.length < 50 ? "#ef4444" : "var(--text-secondary)", marginTop: 3 }}>{reason.length}/200字</div>
              </div>
              <button onClick={nominate} disabled={submitting || !nomineeId || reason.length < 50 || reason.length > 200} style={{ width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", opacity: submitting || !nomineeId || reason.length < 50 ? 0.6 : 1 }}>
                {submitting ? "送信中..." : "🌟 推薦する"}
              </button>
            </>
          )}
        </div>
      )}

      {/* 歴代MVP */}
      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {awards.map(a => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 32 }}>🏆</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{staffName(a.winner_staff_id)}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "#fef3c7", color: "#92400e", fontWeight: 600 }}>{a.year_month.replace("-", "年")}月</span>
                </div>
                {a.ai_comment && <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{a.ai_comment}</div>}
                {a.winner_comment && <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 4 }}>💬 {a.winner_comment}</div>}
              </div>
            </motion.div>
          ))}
          {awards.length === 0 && (
            <div style={{ ...card, padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>まだ歴代MVPはありません</div>
          )}
        </div>
      )}

      {/* 推薦管理（adminのみ） */}
      {tab === "manage" && isAdmin && (
        <>
          <div style={{ ...card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>今月の推薦状況</h3>
            {Object.entries(nominationCounts).sort((a, b) => b[1] - a[1]).map(([staffId, count]) => (
              <div key={staffId} style={{ padding: "10px 0", borderBottom: "1px solid var(--subtle-bg)", display: "flex", alignItems: "center", gap: 10 }}>
                <input type="radio" name="winner" checked={selectedWinner === staffId} onChange={() => setSelectedWinner(staffId)} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{staffName(staffId)}</span>
                <span style={{ fontSize: 12, color: "#b8975a", fontWeight: 700 }}>{count}票</span>
              </div>
            ))}
            {monthNominations.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>推薦理由一覧：</div>
                {monthNominations.filter(n => !selectedWinner || n.nominee_staff_id === selectedWinner).map(n => (
                  <div key={n.id} style={{ padding: "6px 10px", marginBottom: 4, borderRadius: 8, background: "var(--subtle-bg)", fontSize: 12, color: "var(--text-primary)" }}>
                    → {staffName(n.nominee_staff_id)}: {n.reason}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedWinner && !currentAward && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={generateAiComment} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: aiLoading ? 0.7 : 1 }}>
                {aiLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
                AIが受賞コメントを生成
              </button>
              {aiComment && (
                <div style={{ ...card, padding: 14, fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)" }}>{aiComment}</div>
              )}
              <button onClick={announceWinner} style={{ padding: "12px 20px", borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
                <Trophy size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                受賞者を確定してChatworkに通知
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
