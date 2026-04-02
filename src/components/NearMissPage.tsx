"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, ThumbsUp, Loader2, Sparkles } from "lucide-react"
import { useNearMisses } from "@/hooks/useNearMisses"
import { isFirebaseConfigured } from "@/lib/firebase"

export default function NearMissPage() {
  const { nearMisses, addNearMiss, upvoteNearMiss, loading, mode } = useNearMisses()
  const [open, setOpen] = useState(false)
  const [tag, setTag] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [aiResult, setAiResult] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const submit = async () => {
    if (!body.trim()) return
    setSubmitting(true)
    await addNearMiss({ tag: tag || "その他", body, role: "スタッフ", anonymous: true })
    setTag(""); setBody(""); setOpen(false); setSubmitting(false)
  }

  const analyze = async () => {
    setAiLoading(true); setAiResult("")
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports: nearMisses.map(n => ({ tag: n.tag, body: n.body })) }),
      })
      const data = await res.json()
      setAiResult(data.analysis || "分析に失敗しました。")
    } catch { setAiResult("通信エラーが発生しました。") }
    finally { setAiLoading(false) }
  }

  const card: React.CSSProperties = { background:"#fff", borderRadius:16, border:"1px solid rgba(124,101,204,0.11)", boxShadow:"0 1px 4px rgba(90,60,160,0.05)" }

  return (
    <div style={{ padding:24, maxWidth:720 }}>
      {/* ヘッダー */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <p style={{ fontSize:12, color:"#b0a8c8" }}>匿名で投稿できます。管理者のみ個人情報を確認できます。</p>
          {mode === "firestore" && (
            <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:999, background:"#edfbf4", border:"1px solid #86efac", color:"#166534" }}>🔥 Firestore同期中</span>
          )}
        </div>
        <motion.button whileTap={{ scale:0.97 }} onClick={() => setOpen(!open)}
          style={{ display:"flex", alignItems:"center", gap:7, background:"linear-gradient(135deg,#a78bfa,#f472b6)", color:"white", fontSize:12, fontWeight:600, padding:"9px 16px", borderRadius:12, border:"none", cursor:"pointer", boxShadow:"0 2px 8px rgba(167,139,250,0.3)" }}>
          <Plus size={13} />新規投稿（匿名OK）
        </motion.button>
      </div>

      {/* Gemini AI分析 */}
      <div style={{ ...card, padding:16, marginBottom:14, background:"linear-gradient(135deg,#f5f2fd,#fce4ec)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#a78bfa,#f472b6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Sparkles size={16} style={{ color:"white" }} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#3a2f5a" }}>Gemini AI パターン分析</div>
              <div style={{ fontSize:11, color:"#7a6e96" }}>蓄積された事例から改善提案を生成</div>
            </div>
          </div>
          <button onClick={analyze} disabled={aiLoading || nearMisses.length === 0}
            style={{ display:"flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#7c65cc,#c084fc)", color:"white", fontSize:11, fontWeight:600, padding:"8px 14px", borderRadius:10, border:"none", cursor:"pointer", opacity:aiLoading||nearMisses.length===0?0.6:1 }}>
            {aiLoading ? <Loader2 size={12} style={{ animation:"spin 1s linear infinite" }} /> : "✨"} 分析する
          </button>
        </div>
        {aiResult && (
          <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
            style={{ background:"rgba(255,255,255,0.8)", borderRadius:12, padding:12, marginTop:12, fontSize:12, color:"#3a2f5a", lineHeight:1.7, whiteSpace:"pre-wrap", border:"1px solid rgba(124,101,204,0.15)" }}>
            {aiResult}
          </motion.div>
        )}
      </div>

      {/* 投稿フォーム */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
            style={{ ...card, marginBottom:14, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(124,101,204,0.09)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#3a2f5a" }}>✏️ 気づきを投稿</span>
              <button onClick={() => setOpen(false)} style={{ width:28, height:28, borderRadius:"50%", background:"#f5f2fd", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#9b87e4" }}>
                <X size={13} />
              </button>
            </div>
            <div style={{ padding:18, display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:6 }}>カテゴリ</label>
                <select value={tag} onChange={e => setTag(e.target.value)}
                  style={{ width:"100%", border:"1px solid rgba(124,101,204,0.2)", borderRadius:10, padding:"9px 12px", fontSize:13, color:"#3a2f5a", background:"#f8f6fc", outline:"none", fontFamily:"inherit" }}>
                  <option value="">選択してください</option>
                  {["薬剤","患者確認","転倒リスク","感染対策","設備・環境","コミュニケーション","その他"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:6 }}>内容</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
                  placeholder="何が起きたか、気づいたことを自由に書いてください。改善提案も歓迎します。"
                  style={{ width:"100%", border:"1px solid rgba(124,101,204,0.2)", borderRadius:10, padding:"9px 12px", fontSize:13, color:"#3a2f5a", background:"#f8f6fc", outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6 }} />
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button onClick={() => setOpen(false)}
                  style={{ padding:"8px 16px", borderRadius:10, border:"1px solid rgba(124,101,204,0.2)", background:"transparent", color:"#7a6e96", fontSize:12, cursor:"pointer" }}>
                  キャンセル
                </button>
                <button onClick={submit} disabled={!body.trim() || submitting}
                  style={{ padding:"8px 16px", borderRadius:10, background:"linear-gradient(135deg,#a78bfa,#f472b6)", color:"white", fontSize:12, fontWeight:600, border:"none", cursor:"pointer", opacity:!body.trim()||submitting?0.6:1, display:"flex", alignItems:"center", gap:6 }}>
                  {submitting ? <Loader2 size={12} /> : null}匿名で投稿する
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 読み込み中 */}
      {loading && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40, gap:8, color:"#b0a8c8" }}>
          <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} />
          <span style={{ fontSize:13 }}>データを読み込んでいます...</span>
        </div>
      )}

      {/* 投稿一覧 */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {nearMisses.map((nm, i) => (
          <motion.div key={nm.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
            style={{ ...card, padding:16, borderLeft:"4px solid #fbbf24" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"#fffbeb", border:"1px solid #fde68a", color:"#b45309" }}>{nm.tag}</span>
              <span style={{ fontSize:10, color:"#b0a8c8" }}>{nm.time}</span>
            </div>
            <p style={{ fontSize:13, color:"#3a2f5a", lineHeight:1.6 }}>{nm.body}</p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10, paddingTop:8, borderTop:"1px solid rgba(124,101,204,0.07)" }}>
              <span style={{ fontSize:11, color:"#b0a8c8" }}>{nm.role} · 匿名</span>
              <button onClick={() => upvoteNearMiss(nm.id)}
                style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:"#f59e0b", background:"transparent", border:"none", cursor:"pointer" }}>
                <ThumbsUp size={12} />▲ {nm.upvotes}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
