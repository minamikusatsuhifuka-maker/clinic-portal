"use client"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronDown, ChevronUp, Upload, FileText, ToggleLeft, ToggleRight, Edit3, Check } from "lucide-react"
import { useKnowledgeStore, CATEGORIES, type KnowledgeDoc } from "@/store/useKnowledgeStore"

const card: React.CSSProperties = {
  background: "var(--surface-bg, #fff)",
  borderRadius: 14,
  border: "0.5px solid var(--border-color, rgba(26,30,46,0.1))",
}

export default function KnowledgePage() {
  const { docs, addDoc, updateDoc, deleteDoc, toggleDoc } = useKnowledgeStore()
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: "", content: "", category: "philosophy" as KnowledgeDoc["category"] })
  const [form, setForm] = useState({
    title: "", content: "", category: "philosophy" as KnowledgeDoc["category"], type: "text" as KnowledgeDoc["type"]
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // 単一ファイル → フォーム表示
  const handleSingleFile = async (file: File) => {
    setLoading(true)
    setStatus("ファイルを読み込んでいます...")
    try {
      const content = await file.text()
      const type: KnowledgeDoc["type"] =
        file.name.endsWith(".md") ? "md" : "text"
      const title = file.name.replace(/\.[^.]+$/, "")
      setForm(f => ({ ...f, title, content, type }))
      setShowForm(true)
      setStatus("")
    } catch (e) {
      setStatus(`読み込みエラー: ${e}`)
    } finally {
      setLoading(false)
    }
  }

  // 複数ファイル一括アップロード
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (!fileArray.length) return

    if (fileArray.length === 1) {
      await handleSingleFile(fileArray[0])
      return
    }

    setLoading(true)
    setStatus(`${fileArray.length}件のファイルを読み込んでいます...`)
    let saved = 0
    for (const file of fileArray) {
      try {
        const content = await file.text()
        const title = file.name.replace(/\.[^.]+$/, "")
        const type: KnowledgeDoc["type"] = file.name.endsWith(".md") ? "md" : "text"
        addDoc({ title, content, type, category: "philosophy", enabled: true })
        saved++
      } catch (e) {
        console.error(`${file.name} の読み込みに失敗:`, e)
      }
    }
    setLoading(false)
    setStatus(`${saved}件保存しました。Airが参照できる状態になっています。`)
    setTimeout(() => setStatus(""), 4000)
  }

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return
    addDoc({ ...form, enabled: true })
    setForm({ title: "", content: "", category: "philosophy", type: "text" })
    setShowForm(false)
    setStatus("保存しました")
    setTimeout(() => setStatus(""), 2000)
  }

  const startEdit = (doc: KnowledgeDoc) => {
    setEditingId(doc.id)
    setEditForm({ title: doc.title, content: doc.content, category: doc.category })
  }

  const saveEdit = () => {
    if (!editingId) return
    updateDoc(editingId, editForm)
    setEditingId(null)
    setStatus("更新しました")
    setTimeout(() => setStatus(""), 2000)
  }

  const activeCount = docs.filter(d => d.enabled).length

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #6b7280)", marginTop: 4, lineHeight: 1.6 }}>
            アップロードした資料はAir（AIアシスタント）の判断基準・回答の土台として反映されます
          </div>
          {activeCount > 0 && (
            <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "#e1f5ee", border: "0.5px solid #9fe1cb" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f6e56" }} />
              <span style={{ fontSize: 12, color: "#0f6e56", fontWeight: 500 }}>{activeCount}件の資料をAirが参照中</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "0.5px solid rgba(26,30,46,0.15)", background: "var(--surface-bg,#fff)", color: "var(--text-primary,#1e2230)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            <Upload size={14} />ファイルを読み込む
          </button>
          <button onClick={() => setShowForm(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "#1e2230", color: "#fff", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}>
            <Plus size={14} />テキストで追加
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".txt,.md" multiple style={{ display: "none" }}
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files) }} />

      {/* ドラッグ&ドロップゾーン */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files) }}
        style={{
          marginBottom: 16,
          padding: 24,
          borderRadius: 12,
          border: isDragging ? "1.5px dashed #b8975a" : "1.5px dashed rgba(26,30,46,0.2)",
          background: isDragging ? "#f7f1e8" : "transparent",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.15s",
        }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: isDragging ? "#b8975a" : "var(--text-primary,#1e2230)", marginBottom: 4 }}>
          📂 ここにファイルをドロップ（複数可）
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary,#6b7280)" }}>
          .txt / .md ファイル対応 · 複数ファイルは一括保存
        </div>
      </div>

      {/* ステータス */}
      {status && (
        <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 10, background: "#f0f9f4", fontSize: 12, color: "#0f6e56" }}>
          {status}
        </div>
      )}
      {loading && (
        <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 10, background: "#f7f1e8", fontSize: 12, color: "#b8975a" }}>
          ファイルを読み込んでいます...
        </div>
      )}

      {/* 追加フォーム */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ ...card, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary,#1e2230)", marginBottom: 14 }}>
              新しい資料を追加
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="タイトル（例：南草津皮フ科 クリニック理念）"
                style={{ border: "0.5px solid rgba(26,30,46,0.15)", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", background: "var(--subtle-bg,#edeae4)", fontFamily: "inherit", color: "var(--text-primary,#1e2230)" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as KnowledgeDoc["category"] }))}
                  style={{ flex: 1, border: "0.5px solid rgba(26,30,46,0.15)", borderRadius: 10, padding: "9px 12px", fontSize: 12, outline: "none", background: "var(--subtle-bg,#edeae4)", color: "var(--text-primary,#1e2230)" }}>
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={"理念・教え・ルールなどのテキストを貼り付けてください。\n※ PDFの内容はテキストとしてここに貼り付けてください\n\n例：\n私たちは患者さんの笑顔のために存在します...\n\nアチーブメントの教えを土台に..."}
                rows={10}
                style={{ border: "0.5px solid rgba(26,30,46,0.15)", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", background: "var(--subtle-bg,#edeae4)", resize: "vertical", fontFamily: "inherit", lineHeight: 1.75, color: "var(--text-primary,#1e2230)" }} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "0.5px solid rgba(26,30,46,0.15)", background: "transparent", color: "var(--text-secondary,#6b7280)", fontSize: 12, cursor: "pointer" }}>
                  キャンセル
                </button>
                <button onClick={handleSubmit} disabled={!form.title.trim() || !form.content.trim()}
                  style={{ padding: "8px 16px", borderRadius: 10, background: "#1e2230", color: "#fff", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", opacity: !form.title.trim() || !form.content.trim() ? 0.5 : 1 }}>
                  保存する
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* カテゴリ別に資料一覧 */}
      {docs.length === 0 ? (
        <div style={{ ...card, padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary,#1e2230)", marginBottom: 6 }}>まだ資料が登録されていません</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary,#6b7280)", lineHeight: 1.7 }}>
            クリニックの理念・院長の教え・アチーブメントの資料などを<br />アップロードすると、Airの回答に反映されます
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {docs.map((doc) => {
            const cat = CATEGORIES[doc.category]
            const isExpanded = expandedId === doc.id
            const isEditing = editingId === doc.id
            return (
              <div key={doc.id} style={{ ...card, overflow: "hidden" }}>
                {/* ヘッダー行 */}
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  {/* ON/OFFトグル */}
                  <button onClick={() => toggleDoc(doc.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, color: doc.enabled ? "#0f6e56" : "#9ca3af" }}>
                    {doc.enabled
                      ? <ToggleRight size={24} />
                      : <ToggleLeft size={24} />}
                  </button>
                  {/* カテゴリバッジ */}
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: cat.bg, color: cat.color, flexShrink: 0 }}>
                    {cat.label}
                  </span>
                  {/* タイトル */}
                  <button onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                    style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <FileText size={14} style={{ color: "var(--text-secondary,#6b7280)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary,#1e2230)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.title}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary,#6b7280)", flexShrink: 0 }}>
                      {doc.content.length.toLocaleString()}文字
                    </span>
                  </button>
                  {/* 操作ボタン */}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => startEdit(doc)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: "0.5px solid rgba(26,30,46,0.12)", background: "var(--subtle-bg,#edeae4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b8975a" }}>
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => { if (confirm(`「${doc.title}」を削除しますか？`)) deleteDoc(doc.id) }}
                      style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                      <Trash2 size={12} />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: "0.5px solid rgba(26,30,46,0.12)", background: "var(--subtle-bg,#edeae4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary,#6b7280)" }}>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* 展開：編集モード */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden", borderTop: "0.5px solid rgba(26,30,46,0.07)" }}>
                      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                        <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          style={{ border: "0.5px solid rgba(26,30,46,0.15)", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", background: "var(--subtle-bg,#edeae4)", fontFamily: "inherit", color: "var(--text-primary,#1e2230)" }} />
                        <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value as KnowledgeDoc["category"] }))}
                          style={{ border: "0.5px solid rgba(26,30,46,0.15)", borderRadius: 10, padding: "8px 12px", fontSize: 12, outline: "none", background: "var(--subtle-bg,#edeae4)", color: "var(--text-primary,#1e2230)" }}>
                          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                          rows={8} style={{ border: "0.5px solid rgba(26,30,46,0.15)", borderRadius: 10, padding: "8px 12px", fontSize: 12, outline: "none", background: "var(--subtle-bg,#edeae4)", resize: "vertical", fontFamily: "inherit", lineHeight: 1.75, color: "var(--text-primary,#1e2230)" }} />
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button onClick={() => setEditingId(null)}
                            style={{ padding: "7px 14px", borderRadius: 10, border: "0.5px solid rgba(26,30,46,0.15)", background: "transparent", color: "var(--text-secondary,#6b7280)", fontSize: 12, cursor: "pointer" }}>
                            キャンセル
                          </button>
                          <button onClick={saveEdit}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10, background: "#1e2230", color: "#fff", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}>
                            <Check size={12} />保存
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 展開：コンテンツプレビュー */}
                <AnimatePresence>
                  {isExpanded && !isEditing && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden", borderTop: "0.5px solid rgba(26,30,46,0.07)" }}>
                      <div style={{ padding: "14px 16px" }}>
                        <pre style={{ fontSize: 12, color: "var(--text-primary,#1e2230)", lineHeight: 1.85, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", margin: 0, background: "var(--subtle-bg,#edeae4)", padding: "12px 14px", borderRadius: 10, maxHeight: 320, overflowY: "auto" }}>
                          {doc.content}
                        </pre>
                        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-secondary,#6b7280)" }}>
                          登録日: {new Date(doc.createdAt).toLocaleDateString("ja-JP")}
                          {doc.updatedAt !== doc.createdAt && ` · 更新: ${new Date(doc.updatedAt).toLocaleDateString("ja-JP")}`}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
