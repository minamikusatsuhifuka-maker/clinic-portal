"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAchievementStore, type LifeGoal } from "@/store/useAchievementStore"
import { Plus, X, Heart, Trash2, Edit3, Check, ChevronDown, ChevronUp } from "lucide-react"

const card: React.CSSProperties = {
  background: "#fff", borderRadius: 16,
  border: "1px solid rgba(124,101,204,0.11)",
  boxShadow: "0 1px 4px rgba(90,60,160,0.05)",
}

const AREAS = {
  work:    { label: "仕事・キャリア", emoji: "💼", color: "#7c65cc", bg: "#f5f2fd" },
  family:  { label: "家族・人間関係", emoji: "❤️", color: "#f472b6", bg: "#fdf2f8" },
  health:  { label: "健康・体",       emoji: "🌿", color: "#22c55e", bg: "#edfbf4" },
  finance: { label: "財務・お金",     emoji: "⭐", color: "#f59e0b", bg: "#fffbeb" },
  hobby:   { label: "趣味・学び",     emoji: "🎨", color: "#60a5fa", bg: "#f0f7ff" },
}
const TIMEFRAMES = {
  "1year":  "1年後",
  "3year":  "3年後",
  "10year": "10年後",
}
const PRINCIPLES = [
  "目標設定の原理原則",
  "人間関係の原理原則",
  "自己実現の原理原則",
  "時間管理の原理原則",
  "感謝・承認の原理原則",
  "リーダーシップの原理原則",
]
const ROLES = ["看護師", "マルチタスク", "医師", "マネージャー", "院長"]
const inp: React.CSSProperties = {
  width: "100%", border: "1px solid rgba(124,101,204,0.2)", borderRadius: 10,
  padding: "9px 12px", fontSize: 13, color: "#3a2f5a", background: "#f8f6fc",
  outline: "none", fontFamily: "inherit",
}

function LifeGoalForm({ onClose }: { onClose: () => void }) {
  const { addLifeGoal } = useAchievementStore()
  const [form, setForm] = useState({
    area: "work" as LifeGoal["area"],
    timeframe: "1year" as LifeGoal["timeframe"],
    goal: "", why: "", action: "", progress: 0,
  })
  const save = () => {
    if (!form.goal.trim()) return
    addLifeGoal(form)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ ...card, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(124,101,204,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#3a2f5a" }}>🎯 人生目標を設定する</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", background: "#f5f2fd", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9b87e4" }}><X size={14} /></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 6 }}>人生の領域</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(Object.entries(AREAS) as [LifeGoal["area"], typeof AREAS[keyof typeof AREAS]][]).map(([key, a]) => (
                <button key={key} onClick={() => setForm(p => ({ ...p, area: key }))}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${form.area === key ? a.color : "rgba(124,101,204,0.15)"}`, background: form.area === key ? a.bg : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                  <span style={{ fontSize: 16 }}>{a.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: form.area === key ? 700 : 400, color: form.area === key ? a.color : "#7a6e96" }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 6 }}>期間</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(Object.entries(TIMEFRAMES) as [LifeGoal["timeframe"], string][]).map(([key, label]) => (
                <button key={key} onClick={() => setForm(p => ({ ...p, timeframe: key }))}
                  style={{ flex: 1, padding: "8px", borderRadius: 10, border: `1.5px solid ${form.timeframe === key ? "#7c65cc" : "rgba(124,101,204,0.15)"}`, background: form.timeframe === key ? "#f5f2fd" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: form.timeframe === key ? 700 : 400, color: form.timeframe === key ? "#5f4ba8" : "#7a6e96" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 5 }}>目標（具体的・測定可能・期限付きで）</label>
            <textarea style={{ ...inp, resize: "none" }} rows={2} value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="例：3年後に美容皮膚科の専門資格を取得し、カウンセリング担当として活躍する" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 5 }}>なぜこの目標を達成したいのか（WHY）</label>
            <textarea style={{ ...inp, resize: "none" }} rows={2} value={form.why} onChange={e => setForm(p => ({ ...p, why: e.target.value }))} placeholder="例：患者さんに自信を持ってアドバイスできる存在になりたいから。" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 5 }}>そのために今できること（最初の一歩）</label>
            <input style={inp} value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))} placeholder="例：今週中に資格の情報を調べる" />
          </div>
          <button onClick={save} style={{ width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
            🎯 目標を設定する
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function GratitudeForm({ onClose, myName }: { onClose: () => void; myName: string }) {
  const { addGratitudeCard } = useAchievementStore()
  const [form, setForm] = useState({ fromName: myName, fromRole: "看護師", toName: "", toRole: "看護師", message: "" })
  const save = () => {
    if (!form.toName.trim() || !form.message.trim()) return
    addGratitudeCard(form)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ ...card, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(124,101,204,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#3a2f5a" }}>💌 感謝カードを贈る</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", background: "#f5f2fd", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9b87e4" }}><X size={14} /></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 5 }}>贈る相手の名前</label><input style={inp} value={form.toName} onChange={e => setForm(p => ({ ...p, toName: e.target.value }))} placeholder="田中 花子" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 5 }}>職種</label><select style={inp} value={form.toRole} onChange={e => setForm(p => ({ ...p, toRole: e.target.value }))}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 5 }}>感謝のメッセージ</label>
            <textarea style={{ ...inp, resize: "none" }} rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="いつも助けてくれてありがとう。先日〇〇のとき、一緒に対応してくれたおかげで安心できました。" />
          </div>
          <button onClick={save} style={{ width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#f472b6,#fb923c)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
            💌 感謝カードを送る
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function DirectorMessageForm({ onClose }: { onClose: () => void }) {
  const { addDirectorMessage } = useAchievementStore()
  const [form, setForm] = useState({ title: "", body: "", principle: PRINCIPLES[0] })
  const save = () => {
    if (!form.title.trim() || !form.body.trim()) return
    addDirectorMessage(form)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ ...card, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(124,101,204,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#3a2f5a" }}>✍️ 院長メッセージを投稿</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "50%", background: "#f5f2fd", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9b87e4" }}><X size={14} /></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 5 }}>タイトル</label><input style={inp} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="今週の言葉" /></div>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 5 }}>関連する原理原則</label>
            <select style={inp} value={form.principle} onChange={e => setForm(p => ({ ...p, principle: e.target.value }))}>
              {PRINCIPLES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 5 }}>メッセージ</label><textarea style={{ ...inp, resize: "none" }} rows={6} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="スタッフへの想い・気づき・学びを自由に..." /></div>
          <button onClick={save} style={{ width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
            ✍️ 投稿する
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AchievementPage({ userRole = "staff", userName = "スタッフ" }: { userRole?: string; userName?: string }) {
  const { lifeGoals, gratitudeCards, directorMessages, updateLifeGoal, deleteLifeGoal, likeGratitudeCard, likeDirectorMessage, deleteDirectorMessage, updateDirectorMessage } = useAchievementStore()
  const [tab, setTab] = useState<"director" | "goals" | "gratitude">("director")
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null)
  const [editMsgForm, setEditMsgForm] = useState({ title: '', body: '', principle: '' })
  const [showGratitudeForm, setShowGratitudeForm] = useState(false)
  const [showDirectorForm, setShowDirectorForm] = useState(false)
  const isAdmin = userRole === "admin" || userRole === "manager"

  const tabs = [
    { id: "director", label: "院長メッセージ", emoji: "✍️" },
    { id: "goals",    label: "人生目標",       emoji: "🎯" },
    { id: "gratitude",label: "感謝・承認",      emoji: "💌" },
  ] as const

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, fontSize: 12, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", border: "none",
              background: tab === t.id ? "linear-gradient(135deg,#a78bfa,#f472b6)" : "#fff",
              color: tab === t.id ? "white" : "#7a6e96",
              boxShadow: tab === t.id ? "0 2px 8px rgba(167,139,250,0.35)" : "0 1px 3px rgba(90,60,160,0.08)" }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {tab === "director" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isAdmin && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowDirectorForm(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "white", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>
                <Plus size={14} />メッセージを投稿
              </button>
            </div>
          )}
          {directorMessages.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ ...card, padding: 20, borderLeft: "4px solid #f59e0b" }}>
              {editingMsgId === m.id ? (
                /* 編集モード */
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#3a2f5a", marginBottom: 4 }}>✏️ メッセージを編集</div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 4 }}>タイトル</label>
                    <input value={editMsgForm.title} onChange={e => setEditMsgForm(p => ({ ...p, title: e.target.value }))}
                      style={{ width: "100%", border: "1px solid rgba(124,101,204,0.2)", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#3a2f5a", background: "#f8f6fc", outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 4 }}>原理原則</label>
                    <select value={editMsgForm.principle} onChange={e => setEditMsgForm(p => ({ ...p, principle: e.target.value }))}
                      style={{ width: "100%", border: "1px solid rgba(124,101,204,0.2)", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#3a2f5a", background: "#f8f6fc", outline: "none", fontFamily: "inherit" }}>
                      {PRINCIPLES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#7a6e96", display: "block", marginBottom: 4 }}>メッセージ本文</label>
                    <textarea value={editMsgForm.body} onChange={e => setEditMsgForm(p => ({ ...p, body: e.target.value }))}
                      rows={8} style={{ width: "100%", border: "1px solid rgba(124,101,204,0.2)", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#3a2f5a", background: "#f8f6fc", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.7 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => setEditingMsgId(null)}
                      style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(124,101,204,0.2)", background: "transparent", color: "#7a6e96", fontSize: 12, cursor: "pointer" }}>
                      キャンセル
                    </button>
                    <button onClick={() => { updateDirectorMessage(m.id, editMsgForm); setEditingMsgId(null) }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "white", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>
                      <Check size={13} /> 保存する
                    </button>
                  </div>
                </div>
              ) : (
                /* 表示モード */
                <>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👑</div>
                    <button onClick={() => setExpandedMsgId(expandedMsgId === m.id ? null : m.id)}
                      style={{ flex: 1, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#2d2640", marginBottom: 4 }}>{m.title}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "#fef9ef", border: "1px solid #e8d5a0", color: "#8a6a20" }}>{m.principle}</span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>楠葉院長 · {new Date(m.createdAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}</span>
                        {expandedMsgId === m.id
                          ? <ChevronUp size={14} style={{ color: "#9ca3af", marginLeft: "auto" }} />
                          : <ChevronDown size={14} style={{ color: "#9ca3af", marginLeft: "auto" }} />}
                      </div>
                    </button>
                    {isAdmin && (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => { setEditMsgForm({ title: m.title, body: m.body, principle: m.principle }); setEditingMsgId(m.id) }}
                          style={{ width: 28, height: 28, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b45309" }}>
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => { if (confirm(`「${m.title}」を削除しますか？`)) deleteDirectorMessage(m.id) }}
                          style={{ width: 28, height: 28, borderRadius: 8, background: "#fef2f2", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  {/* アコーディオン展開 */}
                  {expandedMsgId === m.id && (
                    <div>
                      <p style={{ fontSize: 14, color: "#3a2f5a", lineHeight: 1.95, whiteSpace: "pre-wrap", marginBottom: 14 }}>{m.body}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <button onClick={() => likeDirectorMessage(m.id, userName)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, border: `1px solid ${m.likedBy.includes(userName) ? "#c084fc" : "rgba(124,101,204,0.2)"}`, background: m.likedBy.includes(userName) ? "#f5f2fd" : "transparent", color: m.likedBy.includes(userName) ? "#7c65cc" : "#9ca3af", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                          <Heart size={13} fill={m.likedBy.includes(userName) ? "#7c65cc" : "none"} /> {m.likes > 0 ? m.likes : ""} いいね
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {tab === "goals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setShowGoalForm(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12, background: "linear-gradient(135deg,#a78bfa,#f472b6)", color: "white", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(167,139,250,0.35)" }}>
              <Plus size={14} />人生目標を設定
            </button>
          </div>
          {(Object.entries(AREAS) as [LifeGoal["area"], typeof AREAS[keyof typeof AREAS]][]).map(([areaKey, area]) => {
            const areaGoals = lifeGoals.filter(g => g.area === areaKey)
            if (areaGoals.length === 0) return null
            return (
              <div key={areaKey} style={{ ...card, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>{area.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: area.color }}>{area.label}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {areaGoals.map(g => (
                    <div key={g.id} style={{ background: area.bg, borderRadius: 12, padding: "12px 14px", border: `1px solid ${area.color}33` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.7)", color: area.color, flexShrink: 0 }}>{TIMEFRAMES[g.timeframe]}</span>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#3a2f5a", flex: 1, margin: 0, lineHeight: 1.5 }}>{g.goal}</p>
                        <button onClick={() => deleteLifeGoal(g.id)} style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(255,255,255,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0a8c8", flexShrink: 0 }}><Trash2 size={11} /></button>
                      </div>
                      {g.why && <p style={{ fontSize: 12, color: "#7a6e96", margin: "0 0 8px", lineHeight: 1.6 }}>WHY: {g.why}</p>}
                      {g.action && <p style={{ fontSize: 12, color: "#7a6e96", margin: "0 0 10px", lineHeight: 1.6 }}>最初の一歩: {g.action}</p>}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.6)", borderRadius: 3, overflow: "hidden" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${g.progress}%` }} transition={{ duration: 0.8 }}
                            style={{ height: "100%", background: area.color, borderRadius: 3 }} />
                        </div>
                        <input type="range" min={0} max={100} step={5} value={g.progress} onChange={e => updateLifeGoal(g.id, { progress: Number(e.target.value) })}
                          style={{ width: 70, accentColor: area.color }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: area.color, minWidth: 32 }}>{g.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {lifeGoals.length === 0 && (
            <div style={{ ...card, padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#7a6e96", marginBottom: 6 }}>人生目標がまだ設定されていません</div>
              <div style={{ fontSize: 12, color: "#b0a8c8", lineHeight: 1.7 }}>仕事・家族・健康・財務・趣味の5領域で<br />1年後・3年後・10年後の目標を設定しましょう</div>
            </div>
          )}
        </div>
      )}

      {tab === "gratitude" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: "#b0a8c8" }}>今月 {gratitudeCards.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length} 枚の感謝カードが贈られました</div>
            <button onClick={() => setShowGratitudeForm(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12, background: "linear-gradient(135deg,#f472b6,#fb923c)", color: "white", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(244,114,182,0.35)" }}>
              <Plus size={14} />感謝カードを贈る
            </button>
          </div>
          {gratitudeCards.length === 0 ? (
            <div style={{ ...card, padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💌</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#7a6e96", marginBottom: 6 }}>まだ感謝カードがありません</div>
              <div style={{ fontSize: 12, color: "#b0a8c8" }}>チームメンバーへの感謝を言葉にして届けましょう</div>
            </div>
          ) : gratitudeCards.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ ...card, padding: 18, borderLeft: "4px solid #f472b6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#f9a8d4,#f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💌</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#3a2f5a" }}>
                    <span style={{ color: "#f472b6" }}>{c.toName}</span>
                    <span style={{ color: "#b0a8c8", fontSize: 11 }}> さん（{c.toRole}）へ</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#b0a8c8", marginTop: 2 }}>{c.fromName} · {new Date(c.createdAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}</div>
                </div>
                <button onClick={() => likeGratitudeCard(c.id, userName)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, border: `1px solid ${c.likedBy.includes(userName) ? "#f472b6" : "rgba(124,101,204,0.2)"}`, background: c.likedBy.includes(userName) ? "#fdf2f8" : "transparent", color: c.likedBy.includes(userName) ? "#f472b6" : "#b0a8c8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  <Heart size={12} fill={c.likedBy.includes(userName) ? "#f472b6" : "none"} /> {c.likes > 0 ? c.likes : ""}
                </button>
              </div>
              <p style={{ fontSize: 13, color: "#3a2f5a", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>{c.message}</p>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showGoalForm && <LifeGoalForm onClose={() => setShowGoalForm(false)} />}
        {showGratitudeForm && <GratitudeForm onClose={() => setShowGratitudeForm(false)} myName={userName} />}
        {showDirectorForm && <DirectorMessageForm onClose={() => setShowDirectorForm(false)} />}
      </AnimatePresence>
    </div>
  )
}
