"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ChevronRight, Pencil, X } from "lucide-react"
import { useEditStore, type ManualItem } from "@/store/useEditStore"
import EditManualModal from "@/components/EditManualModal"

const TAG_CLS: Record<string, string> = {
  日次: "bg-emerald-100 text-emerald-700",
  緊急: "bg-rose-100 text-rose-700",
  通常: "bg-violet-100 text-violet-600",
}

function ManualDetailModal({ manual, onClose, onEdit }: { manual: ManualItem; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-4xl flex-shrink-0">{manual.icon}</span>
            <div>
              <h2 className="font-bold text-[#1e2230] text-xl leading-snug">{manual.title}</h2>
              <span className={`inline-block mt-1 text-xs font-bold px-3 py-1 rounded-full ${TAG_CLS[manual.tag]}`}>{manual.tag}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-violet-500 hover:text-violet-700 border border-violet-200 hover:border-violet-400 px-2.5 py-1.5 rounded-lg transition-colors bg-violet-50">
              <Pencil size={11} />編集
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-400">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-7 space-y-4">
          <p className="text-sm text-gray-500 leading-relaxed">{manual.desc}</p>
          <div className="border-t border-gray-100" />
          <div className="bg-violet-50 rounded-2xl p-6">
            <pre className="text-sm text-violet-800 whitespace-pre-wrap leading-relaxed font-sans break-words">{manual.content}</pre>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function ManualPage() {
  const { manuals } = useEditStore()
  const [selected, setSelected] = useState<ManualItem | null>(null)
  const [editing, setEditing] = useState<ManualItem | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 shadow-sm transition-opacity">
          <Plus size={13} />新規マニュアル作成
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {manuals.map((m, i) => (
          <motion.button key={m.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
            onClick={() => setSelected(m)}
            className="bg-white rounded-2xl border border-violet-100 shadow-sm p-4 pl-5 text-left flex items-center gap-3.5 overflow-visible hover:border-violet-200 hover:shadow-md transition-all">
            <span className="text-2xl flex-shrink-0">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-violet-900 text-sm leading-tight">{m.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_CLS[m.tag]}`}>{m.tag}</span>
              </div>
              <div className="text-xs text-violet-400">{m.desc}</div>
            </div>
            <ChevronRight size={15} className="text-violet-300 flex-shrink-0" />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && !editing && (
          <ManualDetailModal
            manual={selected}
            onClose={() => setSelected(null)}
            onEdit={() => { setEditing(selected); setSelected(null) }}
          />
        )}
        {editing && (
          <EditManualModal mode="edit" manual={editing} onClose={() => setEditing(null)} />
        )}
        {creating && (
          <EditManualModal mode="create" onClose={() => setCreating(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
