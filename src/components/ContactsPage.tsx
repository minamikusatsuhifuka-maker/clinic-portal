"use client"
import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useContactsStore, type Contact, type ContactCategory } from "@/store/useContactsStore"
import { Search, Plus, X, Phone, Mail, MapPin, Star, Trash2, Upload, AlertTriangle, Check, Edit3, FileImage, Loader2 } from "lucide-react"

const card: React.CSSProperties = { background:"#fff", borderRadius:16, border:"1px solid rgba(124,101,204,0.11)", boxShadow:"0 1px 4px rgba(90,60,160,0.05)" }
const inp: React.CSSProperties = { width:"100%", border:"1px solid rgba(124,101,204,0.2)", borderRadius:10, padding:"9px 12px", fontSize:13, color:"#3a2f5a", background:"#f8f6fc", outline:"none", fontFamily:"inherit" }
const CATEGORIES: ContactCategory[] = ["緊急・救急","医療関係","行政・官公庁","法律・法務","金融・保険","業者・サプライヤー","IT・システム","その他"]
const CAT_COLOR: Record<ContactCategory, { color: string; bg: string }> = {
  "緊急・救急":     { color:"#c0392b", bg:"#fff0f0" },
  "医療関係":       { color:"#5f4ba8", bg:"#f5f2fd" },
  "行政・官公庁":   { color:"#1d4ed8", bg:"#f0f7ff" },
  "法律・法務":     { color:"#b45309", bg:"#fffbeb" },
  "金融・保険":     { color:"#166534", bg:"#edfbf4" },
  "業者・サプライヤー": { color:"#0f6e56", bg:"#e1f5ee" },
  "IT・システム":   { color:"#1d4ed8", bg:"#eff6ff" },
  "その他":         { color:"#7a6e96", bg:"#f8f6fc" },
}

function DuplicateAlert({ existing, incoming, onOverride, onCancel }: { existing: Contact; incoming: Partial<Contact>; onOverride: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} style={{ ...card, width:"100%", maxWidth:420, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:"#fff0f0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><AlertTriangle size={22} style={{ color:"#ef4444" }}/></div>
          <div><div style={{ fontSize:15, fontWeight:700, color:"#3a2f5a" }}>重複の可能性があります</div><div style={{ fontSize:12, color:"#b0a8c8", marginTop:2 }}>類似した連絡先がすでに登録されています</div></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          <div style={{ background:"#f8f6fc", borderRadius:12, padding:12 }}><div style={{ fontSize:11, fontWeight:700, color:"#b0a8c8", marginBottom:6 }}>既存の連絡先</div><div style={{ fontSize:13, fontWeight:600, color:"#3a2f5a" }}>{existing.name||existing.company}</div><div style={{ fontSize:12, color:"#7a6e96" }}>{existing.phone}</div></div>
          <div style={{ background:"#fff0f0", borderRadius:12, padding:12, border:"1px solid #fca5a5" }}><div style={{ fontSize:11, fontWeight:700, color:"#f87171", marginBottom:6 }}>新しい連絡先</div><div style={{ fontSize:13, fontWeight:600, color:"#3a2f5a" }}>{incoming.name||incoming.company}</div><div style={{ fontSize:12, color:"#7a6e96" }}>{incoming.phone}</div></div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"10px", borderRadius:12, border:"1px solid rgba(124,101,204,0.2)", background:"#fff", color:"#7a6e96", fontSize:13, fontWeight:600, cursor:"pointer" }}>登録しない</button>
          <button onClick={onOverride} style={{ flex:1, padding:"10px", borderRadius:12, border:"none", background:"#ef4444", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>それでも登録する</button>
        </div>
      </motion.div>
    </div>
  )
}

function ContactForm({ initial, onSave, onClose }: { initial?: Partial<Contact>; onSave: (c: Omit<Contact, "id"|"createdAt"|"isFavorite">) => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Contact, "id"|"createdAt"|"isFavorite">>({ name:"", company:"", department:"", role:"", phone:"", phone2:"", email:"", address:"", category:"その他", whenToContact:"", notes:"", ...initial })
  const s = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)" }} onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <motion.div initial={{ scale:0.94, opacity:0 }} animate={{ scale:1, opacity:1 }} style={{ ...card, width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(124,101,204,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"#fff", zIndex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#3a2f5a" }}>{initial?.name ? "連絡先を編集" : "連絡先を追加"}</div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", background:"#f5f2fd", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#9b87e4" }}><X size={14}/></button>
        </div>
        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>氏名</label><input style={inp} value={form.name} onChange={e => s("name",e.target.value)} placeholder="楠葉 展大"/></div>
            <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>会社・組織名</label><input style={inp} value={form.company} onChange={e => s("company",e.target.value)} placeholder="南草津皮フ科"/></div>
            <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>部署</label><input style={inp} value={form.department} onChange={e => s("department",e.target.value)} placeholder="診療部"/></div>
            <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>役職</label><input style={inp} value={form.role} onChange={e => s("role",e.target.value)} placeholder="院長"/></div>
            <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>電話番号 <span style={{ color:"#f472b6" }}>*</span></label><input style={inp} value={form.phone} onChange={e => s("phone",e.target.value)} placeholder="077-599-1451"/></div>
            <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>電話番号2</label><input style={inp} value={form.phone2} onChange={e => s("phone2",e.target.value)} placeholder="090-XXXX-XXXX"/></div>
          </div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>メールアドレス</label><input style={inp} value={form.email} onChange={e => s("email",e.target.value)} placeholder="info@example.com"/></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>住所</label><input style={inp} value={form.address} onChange={e => s("address",e.target.value)} placeholder="滋賀県草津市..."/></div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:6 }}>カテゴリ</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {CATEGORIES.map(cat => { const cc=CAT_COLOR[cat]; return (<button key={cat} onClick={() => s("category",cat)} style={{ fontSize:11, padding:"5px 12px", borderRadius:999, border:`1.5px solid ${form.category===cat?cc.color:"rgba(124,101,204,0.15)"}`, background:form.category===cat?cc.bg:"#fff", color:form.category===cat?cc.color:"#7a6e96", cursor:"pointer", fontWeight:form.category===cat?700:400 }}>{cat}</button>) })}
            </div>
          </div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>どんなときに連絡するか</label><textarea style={{ ...inp, resize:"none" }} rows={2} value={form.whenToContact} onChange={e => s("whenToContact",e.target.value)} placeholder="例：医療事故発生時・法的問題が発生したとき"/></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:"#7a6e96", display:"block", marginBottom:4 }}>メモ</label><textarea style={{ ...inp, resize:"none" }} rows={2} value={form.notes} onChange={e => s("notes",e.target.value)} placeholder="担当者名・対応時間・注意事項など"/></div>
          <button onClick={() => onSave(form)} style={{ width:"100%", padding:12, borderRadius:12, background:"linear-gradient(135deg,#a78bfa,#f472b6)", color:"white", fontSize:13, fontWeight:700, border:"none", cursor:"pointer" }}>保存する</button>
        </div>
      </motion.div>
    </div>
  )
}

function UploadZone({ onExtracted }: { onExtracted: (contacts: Partial<Contact>[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const process = useCallback(async (file: File) => {
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","application/pdf"]
    if (!allowed.includes(file.type)) { setMessage("対応ファイル: JPG・PNG・WebP・GIF・PDF"); return }
    setLoading(true); setMessage("AIが連絡先を読み取っています...")
    try {
      const form = new FormData(); form.append("file", file)
      const res = await fetch("/api/extract-contact", { method:"POST", body:form })
      const data = await res.json()
      if (!data.ok||!data.contacts?.length) { setMessage("連絡先を読み取れませんでした。別の画像をお試しください。"); return }
      onExtracted(data.contacts)
      setMessage(`✅ ${data.contacts.length}件の連絡先を読み取りました！`)
    } catch { setMessage("エラーが発生しました。もう一度お試しください。") } finally { setLoading(false) }
  }, [onExtracted])
  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); const file=e.dataTransfer.files[0]; if (file) process(file) }, [process])
  return (
    <div>
      <div onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()}
        style={{ border:`2px dashed ${dragging?"#a78bfa":"rgba(124,101,204,0.3)"}`, borderRadius:16, padding:32, textAlign:"center", cursor:"pointer", background:dragging?"#f5f2fd":"#fafafe", transition:"all 0.2s" }}>
        <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display:"none" }} onChange={e => { const f=e.target.files?.[0]; if (f) process(f); e.target.value="" }}/>
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}><Loader2 size={32} style={{ color:"#a78bfa", animation:"spin 1s linear infinite" }}/><div style={{ fontSize:13, color:"#7c65cc", fontWeight:600 }}>AIが読み取り中...</div></div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#ede8fb,#fce4ec)", display:"flex", alignItems:"center", justifyContent:"center" }}><FileImage size={26} style={{ color:"#a78bfa" }}/></div>
            <div style={{ fontSize:14, fontWeight:600, color:"#3a2f5a" }}>名刺・連絡先をドロップ</div>
            <div style={{ fontSize:12, color:"#b0a8c8", lineHeight:1.6 }}>またはクリックしてファイルを選択<br/>JPG・PNG・PDF対応 / 携帯で撮影した写真もOK</div>
            <div style={{ fontSize:11, color:"#a78bfa", fontWeight:600 }}>Gemini AIが自動で連絡先を読み取ります</div>
          </div>
        )}
      </div>
      {message && <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} style={{ marginTop:10, padding:"10px 14px", borderRadius:10, background:message.startsWith("✅")?"#edfbf4":"#fff0f0", border:`1px solid ${message.startsWith("✅")?"#86efac":"#fca5a5"}`, fontSize:13, color:message.startsWith("✅")?"#166534":"#c0392b", display:"flex", alignItems:"center", gap:8 }}>{message.startsWith("✅")?<Check size={15}/>:<AlertTriangle size={15}/>}{message}</motion.div>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ContactRow({ contact, onEdit, onDelete, onToggleFav, isLast }: { contact: Contact; onEdit: () => void; onDelete: () => void; onToggleFav: () => void; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const cc = CAT_COLOR[contact.category]
  const initial = (contact.name||contact.company||"?").charAt(0)
  const hasDetails = contact.whenToContact||contact.email||contact.address||contact.notes
  return (
    <div style={{ borderBottom:isLast?"none":"1px solid rgba(124,101,204,0.07)" }}>
      <div
        onClick={() => hasDetails && setExpanded(!expanded)}
        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", cursor:hasDetails?"pointer":"default", transition:"background 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.background="#fafafe")}
        onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:cc.bg, border:`1.5px solid ${cc.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:cc.color, flexShrink:0 }}>{initial}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#3a2f5a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{contact.name||contact.company}</span>
            {contact.role && <span style={{ fontSize:11, color:"#7a6e96", flexShrink:0 }}>{contact.role}</span>}
          </div>
          {contact.name && contact.company && <div style={{ fontSize:11, color:"#b0a8c8", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{contact.company}{contact.department?` · ${contact.department}`:""}</div>}
        </div>
        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, background:cc.bg, color:cc.color, flexShrink:0, whiteSpace:"nowrap" }}>{contact.category}</span>
        {contact.phone && <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:"#5f4ba8", textDecoration:"none", flexShrink:0, padding:"4px 10px", borderRadius:8, background:"#f5f2fd" }}><Phone size={12} style={{ color:"#a78bfa" }}/>{contact.phone}</a>}
        <div style={{ display:"flex", gap:3, flexShrink:0 }} onClick={e => e.stopPropagation()}>
          <button onClick={onToggleFav} style={{ width:26, height:26, borderRadius:6, background:contact.isFavorite?"#fffbeb":"transparent", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Star size={12} fill={contact.isFavorite?"#f59e0b":"none"} style={{ color:contact.isFavorite?"#f59e0b":"#c4bde0" }}/></button>
          <button onClick={onEdit} style={{ width:26, height:26, borderRadius:6, background:"transparent", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#b0a8c8" }}><Edit3 size={11}/></button>
          <button onClick={onDelete} style={{ width:26, height:26, borderRadius:6, background:"transparent", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#d4d0e0" }}><Trash2 size={11}/></button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && hasDetails && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:"hidden" }}>
            <div style={{ padding:"0 16px 12px 64px", display:"flex", flexDirection:"column", gap:5 }}>
              {contact.whenToContact && <div style={{ fontSize:12, color:"#7a6e96", display:"flex", gap:6 }}><span style={{ color:"#a78bfa", fontWeight:600, flexShrink:0 }}>連絡タイミング:</span>{contact.whenToContact}</div>}
              {contact.phone2 && <div style={{ fontSize:12, color:"#7a6e96", display:"flex", alignItems:"center", gap:5 }}><Phone size={11} style={{ color:"#b0a8c8" }}/>電話2: {contact.phone2}</div>}
              {contact.email && <a href={`mailto:${contact.email}`} style={{ fontSize:12, color:"#60a5fa", textDecoration:"none", display:"flex", alignItems:"center", gap:5 }}><Mail size={11} style={{ color:"#93c5fd" }}/>{contact.email}</a>}
              {contact.address && <div style={{ fontSize:12, color:"#7a6e96", display:"flex", alignItems:"center", gap:5 }}><MapPin size={11} style={{ color:"#b0a8c8" }}/>{contact.address}</div>}
              {contact.notes && <div style={{ fontSize:12, color:"#b0a8c8", fontStyle:"italic" }}>{contact.notes}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContact, toggleFavorite, checkDuplicate } = useContactsStore()
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState<ContactCategory|"すべて">("すべて")
  const [showUpload, setShowUpload] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Contact|null>(null)
  const [pendingContacts, setPendingContacts] = useState<Partial<Contact>[]>([])
  const [pendingIndex, setPendingIndex] = useState(0)
  const [duplicateInfo, setDuplicateInfo] = useState<{ existing: Contact; incoming: Partial<Contact> }|null>(null)
  const [successCount, setSuccessCount] = useState(0)

  const filtered = contacts.filter(c => {
    const matchCat = catFilter==="すべて"||c.category===catFilter
    const q = search.toLowerCase()
    const matchSearch = !q||[c.name,c.company,c.phone,c.role,c.department,c.whenToContact].some(v => v?.toLowerCase().includes(q))
    return matchCat && matchSearch
  })
  const favs = filtered.filter(c => c.isFavorite)
  const others = filtered.filter(c => !c.isFavorite)

  const processPending = (list: Partial<Contact>[], idx: number) => {
    if (idx >= list.length) { setPendingContacts([]); setPendingIndex(0); return }
    const incoming = list[idx]
    const dup = checkDuplicate(incoming.name??"", incoming.phone??"")
    if (dup) { setDuplicateInfo({ existing:dup, incoming }); setPendingContacts(list); setPendingIndex(idx) }
    else { addContact({ name:"", company:"", department:"", role:"", phone:"", phone2:"", email:"", address:"", category:"その他", whenToContact:"", notes:"", ...incoming } as Omit<Contact, "id"|"createdAt"|"isFavorite">); setSuccessCount(p => p+1); processPending(list, idx+1) }
  }
  const onExtracted = (extracted: Partial<Contact>[]) => { setSuccessCount(0); processPending(extracted, 0) }

  return (
    <div style={{ padding:24, maxWidth:860 }}>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200, position:"relative" }}>
          <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#b0a8c8" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="名前・会社・電話番号で検索..." style={{ ...inp, paddingLeft:36 }}/>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:12, background:showUpload?"#ede8fb":"#f5f2fd", border:"1px solid rgba(124,101,204,0.25)", color:"#7c65cc", fontSize:12, fontWeight:600, cursor:"pointer" }}><Upload size={14}/>AI自動読み取り</button>
        <button onClick={() => { setEditTarget(null); setShowForm(true) }} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:12, background:"linear-gradient(135deg,#a78bfa,#f472b6)", color:"white", fontSize:12, fontWeight:600, border:"none", cursor:"pointer", boxShadow:"0 2px 8px rgba(167,139,250,0.35)" }}><Plus size={14}/>手動で追加</button>
      </div>
      <AnimatePresence>{showUpload && <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} style={{ marginBottom:16, overflow:"hidden" }}><UploadZone onExtracted={onExtracted}/></motion.div>}</AnimatePresence>
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {(["すべて",...CATEGORIES] as const).map(cat => { const cc=cat!=="すべて"?CAT_COLOR[cat]:null; return (<button key={cat} onClick={() => setCatFilter(cat)} style={{ fontSize:11, padding:"5px 12px", borderRadius:999, border:`1px solid ${catFilter===cat?(cc?.color??"#7c65cc"):"rgba(124,101,204,0.18)"}`, background:catFilter===cat?(cc?.bg??"#f5f2fd"):"#fff", color:catFilter===cat?(cc?.color??"#5f4ba8"):"#7a6e96", cursor:"pointer", fontWeight:catFilter===cat?700:400 }}>{cat}</button>) })}
      </div>
      {filtered.length>0 && (
        <div style={{ ...card, padding:0, overflow:"hidden" }}>
          {favs.length>0 && (
            <>
              <div style={{ padding:"10px 16px", background:"#fffbeb", borderBottom:"1px solid #fde68a", display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:"#b45309" }}><Star size={12} fill="#f59e0b"/> よく使う連絡先</div>
              {favs.map((c,i) => <ContactRow key={c.id} contact={c} isLast={i===favs.length-1 && others.length===0} onEdit={() => { setEditTarget(c); setShowForm(true) }} onDelete={() => { if (confirm(`「${c.name||c.company}」を削除しますか？`)) deleteContact(c.id) }} onToggleFav={() => toggleFavorite(c.id)}/>)}
            </>
          )}
          {others.length>0 && (
            <>
              {favs.length>0 && <div style={{ padding:"10px 16px", background:"#f8f6fc", borderTop:"1px solid rgba(124,101,204,0.07)", borderBottom:"1px solid rgba(124,101,204,0.07)", fontSize:12, fontWeight:700, color:"#b0a8c8" }}>その他の連絡先</div>}
              {others.map((c,i) => <ContactRow key={c.id} contact={c} isLast={i===others.length-1} onEdit={() => { setEditTarget(c); setShowForm(true) }} onDelete={() => { if (confirm(`「${c.name||c.company}」を削除しますか？`)) deleteContact(c.id) }} onToggleFav={() => toggleFavorite(c.id)}/>)}
            </>
          )}
        </div>
      )}
      {filtered.length===0 && <div style={{ ...card, padding:48, textAlign:"center" }}><div style={{ fontSize:36, marginBottom:12 }}>📞</div><div style={{ fontSize:14, fontWeight:600, color:"#7a6e96", marginBottom:6 }}>連絡先が見つかりません</div><div style={{ fontSize:12, color:"#b0a8c8" }}>「AI自動読み取り」で名刺の写真をアップロードするか、手動で追加してください</div></div>}
      <AnimatePresence>{duplicateInfo && <DuplicateAlert existing={duplicateInfo.existing} incoming={duplicateInfo.incoming} onOverride={() => { addContact({ name:"", company:"", department:"", role:"", phone:"", phone2:"", email:"", address:"", category:"その他", whenToContact:"", notes:"", ...duplicateInfo.incoming } as Omit<Contact, "id"|"createdAt"|"isFavorite">); setSuccessCount(p => p+1); setDuplicateInfo(null); processPending(pendingContacts, pendingIndex+1) }} onCancel={() => { setDuplicateInfo(null); processPending(pendingContacts, pendingIndex+1) }}/>}</AnimatePresence>
      <AnimatePresence>{showForm && <ContactForm initial={editTarget??undefined} onSave={data => { if (editTarget) updateContact(editTarget.id, data); else addContact(data); setShowForm(false); setEditTarget(null) }} onClose={() => { setShowForm(false); setEditTarget(null) }}/>}</AnimatePresence>
    </div>
  )
}
