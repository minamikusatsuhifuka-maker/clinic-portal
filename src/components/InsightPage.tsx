"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useInsightStore } from "@/store/useInsightStore"
import { Plus, X, Heart, Trash2, Globe, Lock } from "lucide-react"

const card: React.CSSProperties = { background:"#fff", borderRadius:16, border:"1px solid rgba(124,101,204,0.11)", boxShadow:"0 1px 4px rgba(90,60,160,0.05)" }
const inp: React.CSSProperties = { width:"100%", border:"1px solid rgba(124,101,204,0.2)", borderRadius:10, padding:"9px 12px", fontSize:13, color:"#3a2f5a", background:"#f8f6fc", outline:"none", fontFamily:"inherit" }
const SOURCES = ["アチーブメント社 研修","院内勉強会","書籍・本","患者さんとの会話","先輩・同僚から","セミナー・外部研修","日常業務の気づき","その他"]
const ROLES = ["看護師","マルチタスク","医師","マネージャー","院長"]

function InsightForm({ onClose, myName, myRole }: { onClose: () => void; myName: string; myRole: string }) {
  const { addInsight } = useInsightStore()
  const [form, setForm] = useState({ authorName:myName, authorRole:myRole, source:SOURCES[0], learning:"", practice:"", result:"", isShared:true, managerComment:"" })
  const save = () => { if (!form.learning.trim()) return; addInsight(form); onClose() }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)" }} onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <motion.div initial={{ scale:0.94, opacity:0 }} animate={{ scale:1, opacity:1 }} style={{ ...card, width:"100%", maxWidth:500, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ padding:"18px 20px", borderBottom:"1px solid rgba(124,101,204,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#3a2f5a" }}>💡 気づきを記録する</div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", background:"#f5f2fd", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#9b87e4" }}><X size={14}/></button>
        </div>
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:5 }}>名前</label><input style={inp} value={form.authorName} onChange={e => setForm(p => ({ ...p, authorName:e.target.value }))}/></div>
            <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:5 }}>職種</label><select style={inp} value={form.authorRole} onChange={e => setForm(p => ({ ...p, authorRole:e.target.value }))}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
          </div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:5 }}>学びのきっかけ</label><select style={inp} value={form.source} onChange={e => setForm(p => ({ ...p, source:e.target.value }))}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:5 }}>何を学んだか・気づいたか <span style={{ color:"#f472b6" }}>*</span></label><textarea style={{ ...inp, resize:"none" }} rows={3} value={form.learning} onChange={e => setForm(p => ({ ...p, learning:e.target.value }))} placeholder="例：感謝を言葉にして伝えることで、相手との信頼関係が深まることを学んだ。"/></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:5 }}>どう実践するか（具体的な行動）</label><textarea style={{ ...inp, resize:"none" }} rows={2} value={form.practice} onChange={e => setForm(p => ({ ...p, practice:e.target.value }))} placeholder="例：今日から毎日1人のスタッフに、具体的な感謝の言葉を伝える。"/></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:5 }}>実践した結果（後で記入してもOK）</label><textarea style={{ ...inp, resize:"none" }} rows={2} value={form.result} onChange={e => setForm(p => ({ ...p, result:e.target.value }))} placeholder="例：チームの雰囲気が明るくなってきた気がする。"/></div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => setForm(p => ({ ...p, isShared:!p.isShared }))} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:999, border:`1px solid ${form.isShared?"rgba(124,101,204,0.3)":"rgba(124,101,204,0.15)"}`, background:form.isShared?"#f5f2fd":"transparent", color:form.isShared?"#7c65cc":"#b0a8c8", cursor:"pointer", fontSize:12, fontWeight:form.isShared?600:400 }}>
              {form.isShared ? <Globe size={12}/> : <Lock size={12}/>} {form.isShared?"チームに共有する":"自分だけ（非公開）"}
            </button>
            <span style={{ fontSize:11, color:"#b0a8c8" }}>共有するとチームの学びになります</span>
          </div>
          <button onClick={save} style={{ width:"100%", padding:12, borderRadius:12, background:"linear-gradient(135deg,#818cf8,#a78bfa)", color:"white", fontSize:13, fontWeight:700, border:"none", cursor:"pointer" }}>💡 気づきを記録する</button>
        </div>
      </motion.div>
    </div>
  )
}

export default function InsightPage({ userRole="staff", userName="スタッフ" }: { userRole?: string; userName?: string }) {
  const { insights, updateInsight, deleteInsight, likeInsight } = useInsightStore()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<"all"|"shared"|"mine">("all")
  const isManager = userRole==="admin"||userRole==="manager"
  const userRole2 = userRole==="admin"?"院長":userRole==="manager"?"マネージャー":"スタッフ"
  const filtered = insights.filter(i => { if (filter==="shared") return i.isShared; if (filter==="mine") return i.authorName===userName; return i.isShared||i.authorName===userName })

  return (
    <div style={{ padding:24, maxWidth:800 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6 }}>
          {([["all","すべて"],["shared","チーム共有"],["mine","自分の記録"]] as const).map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ fontSize:11, padding:"5px 12px", borderRadius:999, border:"1px solid rgba(124,101,204,0.2)", background:filter===val?"#7c65cc":"#fff", color:filter===val?"white":"#7a6e96", cursor:"pointer", fontWeight:filter===val?700:400 }}>{label}</button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:12, background:"linear-gradient(135deg,#818cf8,#a78bfa)", color:"white", fontSize:12, fontWeight:600, border:"none", cursor:"pointer", boxShadow:"0 2px 8px rgba(129,140,248,0.35)" }}><Plus size={14}/>気づきを記録する</button>
      </div>

      {filtered.length===0 ? (
        <div style={{ ...card, padding:48, textAlign:"center" }}><div style={{ fontSize:36, marginBottom:12 }}>💡</div><div style={{ fontSize:14, fontWeight:600, color:"#7a6e96", marginBottom:6 }}>気づきがまだ記録されていません</div><div style={{ fontSize:12, color:"#b0a8c8", lineHeight:1.7 }}>研修・日常業務・書籍から得た気づきを記録して<br/>学びを行動に変え、チームで共有しましょう</div></div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.map((item,i) => (
            <motion.div key={item.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }} style={{ ...card, padding:18, borderLeft:"4px solid #818cf8" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#818cf8,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>💡</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:"#3a2f5a" }}>{item.authorName}</span>
                    <span style={{ fontSize:11, color:"#b0a8c8" }}>{item.authorRole}</span>
                    <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:999, background:"#f0f7ff", border:"1px solid #bfdbfe", color:"#1d4ed8" }}>{item.source}</span>
                    {item.isShared ? <span style={{ fontSize:10, color:"#22c55e", display:"flex", alignItems:"center", gap:3 }}><Globe size={10}/>共有中</span> : <span style={{ fontSize:10, color:"#b0a8c8", display:"flex", alignItems:"center", gap:3 }}><Lock size={10}/>非公開</span>}
                  </div>
                  <div style={{ fontSize:11, color:"#b0a8c8" }}>{new Date(item.createdAt).toLocaleDateString("ja-JP",{ month:"long", day:"numeric" })}</div>
                </div>
                {(item.authorName===userName||isManager) && <button onClick={() => deleteInsight(item.id)} style={{ width:26, height:26, borderRadius:8, background:"#fef2f2", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#f87171", flexShrink:0 }}><Trash2 size={12}/></button>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                <div style={{ background:"#f5f2fd", borderRadius:10, padding:"10px 12px" }}><div style={{ fontSize:11, fontWeight:700, color:"#7c65cc", marginBottom:4 }}>📖 学んだこと・気づき</div><p style={{ fontSize:13, color:"#3a2f5a", margin:0, lineHeight:1.7 }}>{item.learning}</p></div>
                {item.practice && <div style={{ background:"#edfbf4", borderRadius:10, padding:"10px 12px" }}><div style={{ fontSize:11, fontWeight:700, color:"#166534", marginBottom:4 }}>🚀 実践すること</div><p style={{ fontSize:13, color:"#3a2f5a", margin:0, lineHeight:1.7 }}>{item.practice}</p></div>}
                {item.result ? (
                  <div style={{ background:"#f0f7ff", borderRadius:10, padding:"10px 12px" }}><div style={{ fontSize:11, fontWeight:700, color:"#1d4ed8", marginBottom:4 }}>✨ 実践した結果</div><p style={{ fontSize:13, color:"#3a2f5a", margin:0, lineHeight:1.7 }}>{item.result}</p></div>
                ) : item.authorName===userName ? (
                  <textarea rows={1} placeholder="実践した結果を記録しましょう..." defaultValue={item.result} onBlur={e => { if (e.target.value!==item.result) updateInsight(item.id,{ result:e.target.value }) }} style={{ width:"100%", border:"1px dashed rgba(124,101,204,0.3)", borderRadius:10, padding:"8px 12px", fontSize:12, color:"#3a2f5a", background:"#fafafa", resize:"none", outline:"none", fontFamily:"inherit" }}/>
                ) : null}
              </div>
              {isManager && <div style={{ marginBottom:10 }}><textarea rows={1} placeholder="マネージャーコメント・フィードバック..." defaultValue={item.managerComment} onBlur={e => { if (e.target.value!==item.managerComment) updateInsight(item.id,{ managerComment:e.target.value }) }} style={{ width:"100%", border:"1px solid rgba(167,139,250,0.2)", borderRadius:10, padding:"8px 12px", fontSize:12, color:"#3a2f5a", background:"#f5f2fd", resize:"none", outline:"none", fontFamily:"inherit" }}/></div>}
              {!isManager && item.managerComment && <div style={{ background:"#f5f2fd", borderRadius:10, padding:"8px 12px", marginBottom:10 }}><div style={{ fontSize:11, fontWeight:700, color:"#7c65cc", marginBottom:3 }}>👑 マネージャーより</div><p style={{ fontSize:12, color:"#3a2f5a", margin:0, lineHeight:1.6 }}>{item.managerComment}</p></div>}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end" }}>
                <button onClick={() => likeInsight(item.id, userName)} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:999, border:`1px solid ${item.likedBy.includes(userName)?"#818cf8":"rgba(124,101,204,0.2)"}`, background:item.likedBy.includes(userName)?"#eef2ff":"transparent", color:item.likedBy.includes(userName)?"#818cf8":"#b0a8c8", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  <Heart size={12} fill={item.likedBy.includes(userName)?"#818cf8":"none"}/> {item.likes>0?item.likes:""} 参考になった
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && <InsightForm onClose={() => setShowForm(false)} myName={userName} myRole={userRole2}/>}
      </AnimatePresence>
    </div>
  )
}
