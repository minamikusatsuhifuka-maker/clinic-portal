"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { X, Save, Trash2 } from "lucide-react"
import { useEditStore, type ManualItem } from "@/store/useEditStore"

interface Props {
  manual?: ManualItem
  onClose: () => void
  mode: "edit" | "create"
}

const ICONS = ["🌅","🌙","🤒","💊","🧹","📞","🩺","📝","📋","🔒","⚕️","🏥","💉","🩻","📊"]
const TAGS: ManualItem["tag"][] = ["日次", "緊急", "通常"]

export default function EditManualModal({ manual, onClose, mode }: Props) {
  const { updateManual, addManual, deleteManual } = useEditStore()
  const [form, setForm] = useState({
    icon: manual?.icon ?? "📋",
    title: manual?.title ?? "",
    desc: manual?.desc ?? "",
    tag: manual?.tag ?? "通常" as ManualItem["tag"],
    content: manual?.content ?? "",
  })
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = () => {
    if (!form.title.trim()) return
    if (mode === "edit" && manual) {
      updateManual(manual.id, form)
    } else {
      addManual(form)
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  const handleDelete = () => {
    if (manual) {
      deleteManual(manual.id)
      onClose()
    }
  }

  const tagCls: Record<string, string> = {
    日次: "bg-emerald-100 text-emerald-700 border-emerald-200",
    緊急: "bg-rose-100 text-rose-700 border-rose-200",
    通常: "bg-violet-100 text-violet-700 border-violet-200",
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-violet-100 flex items-center justify-between rounded-t-3xl z-10">
          <div className="font-bold text-violet-900 text-sm">
            {mode === "edit" ? "📝 マニュアルを編集" : "➕ 新規マニュアル作成"}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-400">
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* アイコン & タグ */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-violet-600 block mb-1.5">アイコン</label>
              <select value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                className="w-full border border-violet-200 rounded-xl px-3 py-2 text-sm bg-violet-50/40 focus:outline-none focus:border-violet-400">
                {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-violet-600 block mb-1.5">カテゴリ</label>
              <div className="flex gap-1.5">
                {TAGS.map((t) => (
                  <button key={t} onClick={() => setForm((p) => ({ ...p, tag: t }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.tag === t ? tagCls[t] : "bg-white border-violet-200 text-violet-400"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* タイトル */}
          <div>
            <label className="text-xs font-semibold text-violet-600 block mb-1.5">タイトル <span className="text-rose-400">*</span></label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="マニュアルのタイトル"
              className="w-full border border-violet-200 rounded-xl px-3 py-2.5 text-sm text-violet-800 bg-violet-50/40 focus:outline-none focus:border-violet-400" />
          </div>
          {/* 説明 */}
          <div>
            <label className="text-xs font-semibold text-violet-600 block mb-1.5">一行説明</label>
            <input value={form.desc} onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
              placeholder="このマニュアルの概要を一言で"
              className="w-full border border-violet-200 rounded-xl px-3 py-2.5 text-sm text-violet-800 bg-violet-50/40 focus:outline-none focus:border-violet-400" />
          </div>
          {/* 本文 */}
          <div>
            <label className="text-xs font-semibold text-violet-600 block mb-1.5">手順・内容</label>
            <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              rows={6} placeholder={"手順を番号付きで記載してください\n例：\n1. 最初にやること\n2. 次にやること"}
              className="w-full border border-violet-200 rounded-xl px-3 py-2.5 text-sm text-violet-800 bg-violet-50/40 focus:outline-none focus:border-violet-400 resize-none" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          {mode === "edit" && (
            confirmDelete ? (
              <button onClick={handleDelete}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm bg-rose-500 text-white hover:bg-rose-600 transition-colors">
                本当に削除する
              </button>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="py-3 px-4 rounded-2xl border border-rose-200 text-rose-400 hover:bg-rose-50 transition-colors">
                <Trash2 size={15} />
              </button>
            )
          )}
          <button onClick={save} disabled={!form.title.trim()}
            className={`flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
              saved ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90"
            }`}>
            {saved ? "✅ 保存しました！" : <><Save size={15} />{mode === "edit" ? "更新する" : "作成する"}</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
