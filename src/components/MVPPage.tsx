"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
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

// 紙吹雪パーティクル
const ConfettiParticle = ({ delay, left }: { delay: number; left: string }) => (
  <motion.div
    initial={{ y: -20, opacity: 1, rotate: 0 }}
    animate={{ y: 400, opacity: 0, rotate: 360 }}
    transition={{ duration: 2.5 + Math.random(), delay, ease: "easeOut" }}
    style={{
      position: "absolute", top: 0, left,
      width: 8, height: 8, borderRadius: 2,
      background: ["#b8975a", "#d4b87a", "#f59e0b", "#ef4444", "#3b82f6", "#22c55e"][Math.floor(Math.random() * 6)],
      pointerEvents: "none",
    }}
  />
)

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
  const [showThankYou, setShowThankYou] = useState(false)

  // 管理
  const [selectedWinner, setSelectedWinner] = useState("")
  const [aiComment, setAiComment] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [winnerComment, setWinnerComment] = useState("")

  const fetchData = useCallback(async () => {
    const sb = supabase
    if (!sb) return
    setLoading(true)
    const [{ data: noms }, { data: aw }, { data: st }] = await Promise.all([
      sb.from("mvp_nominations").select("*").order("nominated_at", { ascending: false }),
      sb.from("mvp_awards").select("*").order("year_month", { ascending: false }),
      sb.from("staff").select("id, name, role").order("name"),
    ])
    if (noms) setNominations(noms)
    if (aw) setAwards(aw)
    if (st) setStaffList(st)
    const nominated = localStorage.getItem(`mvp_nominated_${ym}`)
    if (nominated) setHasNominated(true)
    setLoading(false)
  }, [ym])

  useEffect(() => { fetchData() }, [fetchData])

  const currentAward = awards.find(a => a.year_month === ym)
  const staffName = (id: string) => staffList.find(s => s.id === id)?.name || "不明"
  const staffRole = (id: string) => staffList.find(s => s.id === id)?.role || ""
  const monthNominations = nominations.filter(n => n.year_month === ym)
  const isBeforeDeadline = new Date().getDate() <= 25

  // 推薦集計（useMemo）
  const nominationCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    monthNominations.forEach(n => { counts[n.nominee_staff_id] = (counts[n.nominee_staff_id] || 0) + 1 })
    return counts
  }, [monthNominations])

  const nominate = async () => {
    const sb = supabase
    if (!sb || !nomineeId || reason.length < 50) return
    setSubmitting(true)
    await sb.from("mvp_nominations").insert({ year_month: ym, nominee_staff_id: nomineeId, reason })
    localStorage.setItem(`mvp_nominated_${ym}`, "true")
    setHasNominated(true)
    setShowThankYou(true)
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
          messages: [{ role: "user", content: `あなたは南草津皮フ科クリニックの院長です。\n今月のMVPスタッフへの心温まる表彰コメントを作成してください。\n推薦理由一覧：${reasons.join("\n")}\n【出力形式】200字以内で：具体的な行動への言及、クリニックの理念・チームへの貢献、今後への期待。絵文字を2〜3個使い温かみのある文章で。` }],
          currentPage: "mvp", userRole,
        }),
      })
      setAiComment(await res.text())
    } catch { setAiComment("コメント生成に失敗しました。") }
    setAiLoading(false)
  }

  const announceWinner = async () => {
    const sb = supabase
    if (!sb || !selectedWinner) return
    await sb.from("mvp_awards").insert({
      year_month: ym,
      winner_staff_id: selectedWinner,
      ai_comment: aiComment || null,
      announced_at: new Date().toISOString(),
    })
    // Chatwork通知（改善版フォーマット）
    try {
      const winnerName = staffName(selectedWinner)
      const winnerRole = staffRole(selectedWinner)
      const voteCount = nominationCounts[selectedWinner] || 0
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: [
            `[info][title]🏆 ${ym.replace("-", "年")}月 MVP発表 🏆[/title]`,
            `おめでとうございます！`,
            ``,
            `👑 ${winnerName}さん（${winnerRole}）`,
            `📊 推薦数：${voteCount}票`,
            ``,
            aiComment ? `💬 院長コメント：\n${aiComment}` : "",
            ``,
            `皆さんの日々の頑張りに感謝します！[/info]`,
          ].filter(Boolean).join("\n"),
        }),
      })
    } catch { /* 通知失敗は無視 */ }
    await fetchData()
  }

  const saveWinnerComment = async () => {
    const sb = supabase
    if (!sb || !currentAward) return
    await sb.from("mvp_awards").update({ winner_comment: winnerComment }).eq("id", currentAward.id)
    await fetchData()
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-secondary)" }} /></div>

  // 文字数バリデーション
  const reasonValid = reason.length >= 50 && reason.length <= 200
  const reasonColor = reason.length === 0 ? "var(--text-secondary)" : reason.length < 50 ? "#ef4444" : reason.length > 200 ? "#ef4444" : "#22c55e"

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* タブ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {([
          { id: "current" as const, label: "🏆 今月のMVP" },
          { id: "nominate" as const, label: "推薦する" },
          { id: "history" as const, label: "歴代MVP" },
          ...(isAdmin ? [{ id: "manage" as const, label: "推薦管理" }] : []),
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: tab === t.id ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "var(--subtle-bg)", color: tab === t.id ? "white" : "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 今月のMVP */}
      {tab === "current" && (
        currentAward ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ ...card, padding: 40, textAlign: "center", background: "linear-gradient(135deg, #fffbeb, #fef3c7)", position: "relative", overflow: "hidden" }}>
            {/* 紙吹雪背景 */}
            {Array.from({ length: 20 }).map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.15} left={`${Math.random() * 100}%`} />
            ))}

            {/* トロフィーアニメーション */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 5, -5, 0], scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              style={{ fontSize: 72, marginBottom: 16, position: "relative", zIndex: 1 }}
            >
              🏆
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#b8975a", marginBottom: 4 }}>{staffName(currentAward.winner_staff_id)}</div>
              <div style={{ fontSize: 12, color: "#92400e", marginBottom: 4 }}>{staffRole(currentAward.winner_staff_id)}</div>
              <div style={{ fontSize: 11, color: "#92400e", marginBottom: 20, opacity: 0.7 }}>{ym.replace("-", "年")}月 MVP</div>
            </motion.div>

            {currentAward.ai_comment && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.7, color: "#78350f", marginBottom: 16, textAlign: "left", position: "relative", zIndex: 1 }}>
                <Sparkles size={14} style={{ color: "#b8975a", marginRight: 6, verticalAlign: "middle" }} />
                {currentAward.ai_comment}
              </motion.div>
            )}
            {currentAward.winner_comment && (
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(184,151,90,0.1)", fontSize: 13, color: "var(--text-primary)", textAlign: "left", position: "relative", zIndex: 1 }}>
                💬 受賞コメント: {currentAward.winner_comment}
              </div>
            )}
            {currentAward.winner_staff_id === currentUserStaffId && !currentAward.winner_comment && (
              <div style={{ marginTop: 16, textAlign: "left", position: "relative", zIndex: 1 }}>
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
            <AnimatePresence>
              {showThankYou ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: "center", padding: 30 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.8 }}
                    style={{ fontSize: 56, marginBottom: 12 }}
                  >
                    🎉
                  </motion.div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#b8975a", marginBottom: 6 }}>ありがとうございます！</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>推薦が送信されました</div>
                </motion.div>
              ) : (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>今月はすでに推薦しました</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>ありがとうございます！</div>
                </div>
              )}
            </AnimatePresence>
          ) : (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>🌟 MVPを推薦する</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>推薦するスタッフ</label>
                {/* アバターカード選択 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                  {staffList.filter(s => s.id !== currentUserStaffId).map(s => (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNomineeId(s.id)}
                      style={{
                        padding: 12, borderRadius: 12, border: nomineeId === s.id ? "2px solid #b8975a" : "1px solid rgba(124,101,204,0.15)",
                        background: nomineeId === s.id ? "rgba(184,151,90,0.1)" : "var(--subtle-bg)",
                        cursor: "pointer", textAlign: "center",
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: nomineeId === s.id ? "linear-gradient(135deg,#b8975a,#d4b87a)" : "rgba(124,101,204,0.1)", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: nomineeId === s.id ? "white" : "var(--text-secondary)" }}>
                        {s.name.charAt(0)}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{s.role}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>推薦理由（50〜200字）</label>
                <textarea style={{ ...inp, resize: "none" }} rows={4} value={reason} onChange={e => { if (e.target.value.length <= 200) setReason(e.target.value) }} placeholder="このスタッフのどんなところが素晴らしいですか？" />
                {/* 文字数カウンター */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: reasonColor }}>
                    {reason.length < 50 ? `あと${50 - reason.length}字以上入力してください` : reason.length > 200 ? "200字を超えています" : "OK"}
                  </div>
                  <div style={{ fontSize: 10, color: reasonColor, fontWeight: 600 }}>
                    {reason.length} / 200字
                  </div>
                </div>
                {/* プログレスバー */}
                <div style={{ height: 3, borderRadius: 2, background: "var(--subtle-bg)", marginTop: 4, overflow: "hidden" }}>
                  <motion.div
                    animate={{ width: `${Math.min((reason.length / 200) * 100, 100)}%` }}
                    style={{ height: "100%", borderRadius: 2, background: reasonColor }}
                  />
                </div>
              </div>
              <button onClick={nominate} disabled={submitting || !nomineeId || !reasonValid} style={{ width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", opacity: submitting || !nomineeId || !reasonValid ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Send size={15} />
                {submitting ? "送信中..." : "推薦する"}
              </button>
            </>
          )}
        </div>
      )}

      {/* 歴代MVP */}
      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {awards.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#b8975a,#d4b87a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🏆</div>
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
                <input type="radio" name="winner" checked={selectedWinner === staffId} onChange={() => setSelectedWinner(staffId)} style={{ accentColor: "#b8975a" }} />
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(184,151,90,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#b8975a" }}>{staffName(staffId).charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{staffName(staffId)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 6 }}>{staffRole(staffId)}</span>
                </div>
                <span style={{ fontSize: 13, color: "#b8975a", fontWeight: 700 }}>{count}票</span>
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
              <button onClick={announceWinner} style={{ padding: "12px 20px", borderRadius: 12, background: "linear-gradient(135deg,#b8975a,#d4b87a)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Trophy size={16} />
                受賞者を確定してChatworkに通知
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
