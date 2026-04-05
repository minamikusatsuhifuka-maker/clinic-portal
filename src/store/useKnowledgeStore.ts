import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface KnowledgeDoc {
  id: string
  title: string
  content: string        // テキスト内容（PDFは変換後のテキスト）
  type: "text" | "md" | "pdf"
  category: "philosophy" | "teaching" | "manual" | "rule" | "other"
  enabled: boolean       // AIに読み込ませるかどうか
  createdAt: string
  updatedAt: string
}

export const CATEGORIES = {
  philosophy: { label: "クリニック理念・ビジョン", color: "#b8975a", bg: "#f7f1e8" },
  teaching:   { label: "大切にしている教え",       color: "#0f6e56", bg: "#e1f5ee" },
  manual:     { label: "業務ルール・マニュアル",    color: "#185fa5", bg: "#e6f1fb" },
  rule:       { label: "行動規範・スタンダード",     color: "#7c3aed", bg: "#f5f3ff" },
  other:      { label: "その他",                   color: "#6b7280", bg: "#f3f4f6" },
}

interface KnowledgeState {
  docs: KnowledgeDoc[]
  addDoc: (doc: Omit<KnowledgeDoc, "id" | "createdAt" | "updatedAt">) => void
  updateDoc: (id: string, data: Partial<KnowledgeDoc>) => void
  deleteDoc: (id: string) => void
  toggleDoc: (id: string) => void
  getActiveContext: () => string  // AIに渡すコンテキスト文字列
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      docs: [],
      addDoc: (doc) => set((s) => ({
        docs: [...s.docs, {
          ...doc,
          id: `doc-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
      })),
      updateDoc: (id, data) => set((s) => ({
        docs: s.docs.map((d) => d.id === id
          ? { ...d, ...data, updatedAt: new Date().toISOString() }
          : d
        ),
      })),
      deleteDoc: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),
      toggleDoc: (id) => set((s) => ({
        docs: s.docs.map((d) => d.id === id ? { ...d, enabled: !d.enabled } : d),
      })),
      getActiveContext: () => {
        const active = get().docs.filter((d) => d.enabled)
        if (!active.length) return ""
        return active.map((d) => (
          `【${CATEGORIES[d.category]?.label ?? d.category}】${d.title}\n${d.content}`
        )).join("\n\n---\n\n")
      },
    }),
    { name: "care-portal-knowledge" }
  )
)
