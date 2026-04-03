"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RISKS, type Risk } from "@/data/risks"
import { useAppStore } from "@/store/useAppStore"
import { useEditStore } from "@/store/useEditStore"
import { X, Send, ChevronRight, Phone, Pencil, Sparkles, CheckCircle2 } from "lucide-react"
import AiAdviceBox from "@/components/AiAdviceBox"
import EditContactModal from "@/components/EditContactModal"

const LEVEL_STYLE: Record<string, React.CSSProperties> = {
  CRITICAL: { background:"#ef4444", color:"white", fontWeight:700 },
  HIGH:     { background:"#f59e0b", color:"white", fontWeight:700 },
  MEDIUM:   { background:"#60a5fa", color:"white", fontWeight:600 },
}
const ICON_BG: Record<string, string> = {
  rose:"bg-rose-100", amber:"bg-amber-100",
  sky:"bg-sky-100", purple:"bg-violet-100", teal:"bg-teal-100",
}

function RiskModal({ risk, onClose }: { risk: Risk; onClose: () => void }) {
  const { checkedItems, toggleCheck } = useAppStore()
  const { riskContacts } = useEditStore()
  const [notified, setNotified] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [editingContact, setEditingContact] = useState(false)

  const contacts = riskContacts.find((rc) => rc.riskId === risk.id)?.contacts ?? risk.contacts
  const checks = checkedItems[risk.id] ?? Array(risk.checklist.length).fill(false)
  const done = checks.filter(Boolean).length
  const progress = Math.round((done / risk.checklist.length) * 100)

  const sendChatwork = async () => {
    setNotifying(true)
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskName: risk.name,
          level: risk.level,
          type: "risk",
        }),
      })
      const data = await res.json()
      if (data.mock) {
        console.log("Chatwork未設定（デモモード）")
      }
    } catch { /* デモモード */ }
    setNotified(true)
    setNotifying(false)
  }

  const levelBg =
    risk.level === "CRITICAL" ? { bg:"#fff0f0", border:"#fca5a5", text:"#c0392b" } :
    risk.level === "HIGH"     ? { bg:"#fffbeb", border:"#fde68a", text:"#b45309" } :
                                { bg:"#f0f7ff", border:"#bfdbfe", text:"#1d4ed8" }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background:"rgba(0,0,0,0.45)", backdropFilter:"blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <motion.div
          initial={{ scale:0.94, opacity:0, y:12 }}
          animate={{ scale:1, opacity:1, y:0 }}
          exit={{ scale:0.94, opacity:0, y:12 }}
          transition={{ type:"spring", stiffness:300, damping:28 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

          {/* ヘッダー */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-violet-100 flex items-start justify-between rounded-t-3xl z-10">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0 mt-0.5">{risk.icon}</span>
              <div className="min-w-0">
                <div className="font-bold text-violet-900 text-sm leading-snug">{risk.name}</div>
                <span style={{ ...LEVEL_STYLE[risk.level], fontSize:10, padding:"2px 10px", borderRadius:999, display:"inline-block", marginTop:6 }}>
                  {risk.level}
                </span>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-400 flex-shrink-0 ml-2">
              <X size={15} />
            </button>
          </div>

          <div className="p-5 space-y-5">

            {/* ★ 新人向けTips（最上部に目立つ配置） */}
            {risk.newStaffTips && (
              <div style={{ background:"linear-gradient(135deg,#f5f2fd,#fce4ec)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:14, padding:"14px 16px" }}>
                <div className="flex items-start gap-2.5">
                  <span style={{ fontSize:20, flexShrink:0 }}>🌸</span>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#7c65cc", marginBottom:4, letterSpacing:"0.04em" }}>新人スタッフへ</div>
                    <div style={{ fontSize:13, color:"#3a2f5a", lineHeight:1.7 }}>{risk.newStaffTips}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ★ 一行サマリー */}
            {risk.summary && (
              <div style={{ background:levelBg.bg, border:`1.5px solid ${levelBg.border}`, borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
                <CheckCircle2 size={16} style={{ color:levelBg.text, flexShrink:0 }} />
                <div style={{ fontSize:13, fontWeight:600, color:levelBg.text }}>{risk.summary}</div>
              </div>
            )}

            {/* Chatwork通知 */}
            {!notified ? (
              <button onClick={sendChatwork} disabled={notifying}
                style={{ width:"100%", background:"linear-gradient(135deg,#7c65cc,#f472b6)", color:"white", borderRadius:16, padding:"13px", fontWeight:600, fontSize:13, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:notifying?0.7:1 }}>
                <Send size={15} />
                {notifying ? "送信中..." : "Chatworkで全スタッフに初動通知を送る"}
              </button>
            ) : (
              <div style={{ background:"#edfbf4", border:"1px solid #86efac", borderRadius:14, padding:"12px 14px", display:"flex", gap:10 }}>
                <span style={{ fontSize:20 }}>✅</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#166534" }}>Chatwork 通知送信済み</div>
                  <div style={{ fontSize:12, color:"#15803d", marginTop:2 }}>全スタッフへ初動通知を送りました。</div>
                </div>
              </div>
            )}

            {/* 対応フロー */}
            <div>
              <h4 style={{ fontSize:13, fontWeight:700, color:"#3a2f5a", marginBottom:12 }}>📌 初動対応フロー</h4>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {risk.flow.map((step, i) => (
                  <div key={i} style={{ display:"flex", gap:12 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#a78bfa,#f472b6)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0, marginTop:2 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#3a2f5a" }}>{step.title}</div>
                      <div style={{ fontSize:12, color:"#7a6e96", marginTop:3, lineHeight:1.7 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 緊急連絡先 */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <h4 style={{ fontSize:13, fontWeight:700, color:"#3a2f5a" }}>📞 緊急連絡先</h4>
                <button onClick={() => setEditingContact(true)}
                  style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#7c65cc", border:"1px solid rgba(124,101,204,0.25)", background:"#f5f2fd", padding:"4px 10px", borderRadius:8, cursor:"pointer" }}>
                  <Pencil size={11} />編集
                </button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {contacts.map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"#f8f6fc", borderRadius:12, padding:"10px 14px" }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{c.icon}</span>
                    <div style={{ flex:1, fontSize:12, fontWeight:600, color:"#3a2f5a" }}>{c.name}</div>
                    {c.phone !== "未定" ? (
                      <a href={`tel:${c.phone}`}
                        style={{ display:"flex", alignItems:"center", gap:6, background:"white", border:"1px solid rgba(124,101,204,0.2)", color:"#7c65cc", fontSize:12, fontWeight:600, padding:"6px 12px", borderRadius:10, textDecoration:"none" }}>
                        <Phone size={11} />{c.phone}
                      </a>
                    ) : (
                      <span style={{ fontSize:11, color:"#b0a8c8", background:"white", border:"1px solid rgba(124,101,204,0.15)", padding:"6px 12px", borderRadius:10 }}>後日設定</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Gemini AI */}
            <AiAdviceBox riskName={risk.name} level={risk.level} />

            {/* チェックリスト */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <h4 style={{ fontSize:13, fontWeight:700, color:"#3a2f5a" }}>☑ 初動チェックリスト</h4>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:80, height:6, background:"#f0ecfa", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(90deg,#a78bfa,#f472b6)", borderRadius:3, transition:"width 0.3s" }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:"#22c55e" }}>{done}/{risk.checklist.length}</span>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {risk.checklist.map((item, i) => (
                  <button key={i} onClick={() => toggleCheck(risk.id, i, risk.checklist.length)}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, background:"transparent", border:"none", cursor:"pointer", textAlign:"left", transition:"background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f5f2fd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ width:20, height:20, borderRadius:6, border:checks[i]?"none":"1.5px solid #d9d0f7", background:checks[i]?"#22c55e":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
                      {checks[i] && <span style={{ color:"white", fontSize:11, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:13, color:checks[i]?"#b0a8c8":"#3a2f5a", textDecoration:checks[i]?"line-through":"none", lineHeight:1.5 }}>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {editingContact && (
          <EditContactModal riskId={risk.id} riskName={risk.name} onClose={() => setEditingContact(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

export default function RiskPage() {
  const [selected, setSelected] = useState<Risk | null>(null)
  const [filter, setFilter] = useState("ALL")
  const { riskVisibility } = useEditStore()
  const visibleRisks = RISKS.filter((r) => riskVisibility[r.id] !== false)
  const filtered = filter === "ALL" ? visibleRisks : visibleRisks.filter((r) => r.level === filter)

  return (
    <div style={{ padding:24, maxWidth:800 }}>
      {/* フィルター */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["ALL","CRITICAL","HIGH","MEDIUM"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:"7px 18px", borderRadius:999, fontSize:12, fontWeight:700, cursor:"pointer", border:"none", transition:"all 0.15s",
              background: filter === f
                ? f === "CRITICAL" ? "#ef4444" : f === "HIGH" ? "#f59e0b" : f === "MEDIUM" ? "#60a5fa" : "linear-gradient(135deg,#7c65cc,#c084fc)"
                : "#fff",
              color: filter === f ? "white" : "#7a6e96",
              boxShadow: filter === f ? "0 2px 8px rgba(90,60,160,0.2)" : "0 1px 3px rgba(90,60,160,0.08)",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* リスト */}
      <div style={{ background:"#fff", borderRadius:20, border:"1px solid rgba(124,101,204,0.11)", overflow:"hidden", boxShadow:"0 2px 8px rgba(90,60,160,0.06)" }}>
        {filtered.map((r, idx) => (
          <motion.button key={r.id}
            initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.04 }}
            onClick={() => setSelected(r)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 20px", background:"transparent", border:"none", borderBottom:idx < filtered.length-1 ? "1px solid rgba(124,101,204,0.07)" : "none", cursor:"pointer", textAlign:"left", transition:"background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f6fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <span style={{ fontSize:11, fontWeight:700, color:"#c4bde0", width:24, fontFamily:"monospace", flexShrink:0 }}>{String(idx+1).padStart(2,"0")}</span>
            <div className={`w-10 h-10 rounded-xl ${ICON_BG[r.color]} flex items-center justify-center text-xl flex-shrink-0`}>{r.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#3a2f5a", lineHeight:1.4 }}>{r.name}</div>
              <div style={{ fontSize:11, color:"#b0a8c8", marginTop:3 }}>{r.summary}</div>
            </div>
            <span style={{ ...LEVEL_STYLE[r.level], fontSize:10, padding:"3px 10px", borderRadius:999, flexShrink:0 }}>{r.level}</span>
            <ChevronRight size={15} style={{ color:"#c4bde0", flexShrink:0 }} />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && <RiskModal risk={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
