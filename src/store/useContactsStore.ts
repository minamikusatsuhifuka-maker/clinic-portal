import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ContactCategory =
  | "医療関係" | "行政・官公庁" | "法律・法務" | "金融・保険"
  | "業者・サプライヤー" | "IT・システム" | "緊急・救急" | "その他"

export interface Contact {
  id: string
  name: string
  company: string
  department: string
  role: string
  phone: string
  phone2: string
  email: string
  address: string
  category: ContactCategory
  whenToContact: string
  notes: string
  isFavorite: boolean
  createdAt: string
}

interface ContactsState {
  contacts: Contact[]
  addContact: (c: Omit<Contact, "id" | "createdAt" | "isFavorite">) => string
  updateContact: (id: string, data: Partial<Contact>) => void
  deleteContact: (id: string) => void
  toggleFavorite: (id: string) => void
  checkDuplicate: (name: string, phone: string) => Contact | null
}

const DEFAULT_CONTACTS: Contact[] = [
  { id: "d1", name: "楠葉展大", company: "南草津皮フ科", department: "", role: "院長", phone: "077-599-1451", phone2: "", email: "minamikusatsuhifuka@gmail.com", address: "", category: "医療関係", whenToContact: "緊急時・重要事項の報告・医療的判断が必要なとき", notes: "", isFavorite: true, createdAt: new Date().toISOString() },
  { id: "d2", name: "", company: "消防・救急", department: "", role: "", phone: "119", phone2: "", email: "", address: "", category: "緊急・救急", whenToContact: "患者急変・火災・救急が必要なとき", notes: "迷ったらすぐ119", isFavorite: true, createdAt: new Date().toISOString() },
  { id: "d3", name: "", company: "警察", department: "", role: "", phone: "110", phone2: "", email: "", address: "", category: "緊急・救急", whenToContact: "不審者・事件・事故・不正アクセス発覚時", notes: "", isFavorite: true, createdAt: new Date().toISOString() },
]

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: DEFAULT_CONTACTS,
      addContact: (c) => {
        const id = Date.now().toString()
        set((s) => ({
          contacts: [{ ...c, id, isFavorite: false, createdAt: new Date().toISOString() }, ...s.contacts],
        }))
        return id
      },
      updateContact: (id, data) =>
        set((s) => ({ contacts: s.contacts.map((c) => c.id === id ? { ...c, ...data } : c) })),
      deleteContact: (id) =>
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      toggleFavorite: (id) =>
        set((s) => ({ contacts: s.contacts.map((c) => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c) })),
      checkDuplicate: (name, phone) => {
        const { contacts } = get()
        return contacts.find((c) =>
          (name && c.name && c.name.replace(/\s/g, "") === name.replace(/\s/g, "")) ||
          (phone && c.phone && c.phone.replace(/[-\s()]/g, "") === phone.replace(/[-\s()]/g, ""))
        ) ?? null
      },
    }),
    { name: "care-portal-contacts" }
  )
)
