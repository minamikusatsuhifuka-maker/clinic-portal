"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Trash2, Save, Phone } from "lucide-react"
import { useEditStore, type ContactItem } from "@/store/useEditStore"

interface Props {
  riskId: number
  riskName: string
  onClose: () => void
}

const ICONS = ["🏥","👮","🚒","⚖️","🏛️","📋","🤝","💻","🩺","📦","📈"]

export default function EditContactModal({ riskId, riskName, onClose }: Props) {
  const { riskContacts, updateRiskContacts } = useEditStore()
  const current = riskContacts.find((rc) => rc.riskId === riskId)?.contacts ?? []
  const [contacts, setContacts] = useState<ContactItem[]>(
    current.map((c) => ({ ...c }))
  )
  const [saved, setSaved] = useState(false)

  const update = (i: number, field: keyof ContactItem, val: string) => {
    setContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  }
  const add = () => setContacts((p) => [...p, { icon: "🏥", name: "", phone: "" }])
  const remove = (i: number) => setContacts((p) => p.filter((_, idx) => idx !== i))
  const save = () => {
    updateRiskContacts(riskId, contacts)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-violet-100 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <div className="font-bold text-violet-900 text-sm">📞 緊急連絡先を編集</div>
            <div className="text-xs text-violet-400 mt-0.5">{riskName}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-violet-50 hover:bg-violet-100 flex items-center justify-center text-violet-400">
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {contacts.map((c, i) => (
            <div key={i} className="bg-violet-50/60 rounded-2xl p-4 space-y-2.5 border border-violet-100">
              <div className="flex items-center gap-2">
                <select value={c.icon} onChange={(e) => update(i, "icon", e.target.value)}
                  className="w-12 border border-violet-200 rounded-lg px-1 py-1.5 text-base bg-white focus:outline-none focus:border-violet-400 text-center">
                  {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <input value={c.name} onChange={(e) => update(i, "name", e.target.value)}
                  placeholder="名前・部署名"
                  className="flex-1 border border-violet-200 rounded-lg px-3 py-1.5 text-sm text-violet-800 bg-white focus:outline-none focus:border-violet-400" />
                <button onClick={() => remove(i)} className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-400 flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-violet-400 flex-shrink-0 ml-1" />
                <input value={c.phone} onChange={(e) => update(i, "phone", e.target.value)}
                  placeholder="電話番号（例: 090-XXXX-XXXX）"
                  className="flex-1 border border-violet-200 rounded-lg px-3 py-1.5 text-sm text-violet-800 bg-white focus:outline-none focus:border-violet-400 font-mono" />
              </div>
            </div>
          ))}
          <button onClick={add}
            className="w-full py-2.5 border-2 border-dashed border-violet-200 rounded-2xl text-violet-400 hover:border-violet-400 hover:text-violet-600 transition-colors text-sm flex items-center justify-center gap-2">
            <Plus size={14} />連絡先を追加
          </button>
        </div>
        <div className="px-5 pb-5">
          <button onClick={save}
            className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              saved ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90"
            }`}>
            {saved ? "✅ 保存しました！" : <><Save size={15} />保存する</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
