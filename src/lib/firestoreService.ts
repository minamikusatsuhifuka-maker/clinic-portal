import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, onSnapshot,
  type Unsubscribe,
} from "firebase/firestore"
import { getDb, isFirebaseConfigured } from "./firebase"

export interface NearMissDoc {
  id: string
  tag: string
  body: string
  role: string
  anonymous: boolean
  upvotes: number
  resolved: boolean
  createdAt: Date
}

export interface CheckDoc {
  riskId: number
  checks: boolean[]
  updatedAt: Date
}

export interface ManagerMemoDoc {
  staffId: string
  memo: string
  updatedAt: Date
}

/* ── ヒヤリハット ── */
export const nearMissService = {
  async getAll(): Promise<NearMissDoc[]> {
    const db = getDb()
    if (!db) return []
    const q = query(collection(db, "nearMisses"), orderBy("createdAt", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<NearMissDoc, "id" | "createdAt">),
      createdAt: d.data().createdAt?.toDate() ?? new Date(),
    }))
  },

  async add(data: Omit<NearMissDoc, "id" | "createdAt">): Promise<string> {
    const db = getDb()
    if (!db) throw new Error("Firestore not configured")
    const ref = await addDoc(collection(db, "nearMisses"), {
      ...data, createdAt: serverTimestamp(),
    })
    return ref.id
  },

  async upvote(id: string, current: number): Promise<void> {
    const db = getDb()
    if (!db) return
    await updateDoc(doc(db, "nearMisses", id), { upvotes: current + 1 })
  },

  async resolve(id: string): Promise<void> {
    const db = getDb()
    if (!db) return
    await updateDoc(doc(db, "nearMisses", id), { resolved: true })
  },

  subscribe(callback: (items: NearMissDoc[]) => void): Unsubscribe | null {
    const db = getDb()
    if (!db) return null
    const q = query(collection(db, "nearMisses"), orderBy("createdAt", "desc"))
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<NearMissDoc, "id" | "createdAt">),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
      }))
      callback(items)
    })
  },
}

/* ── チェックリスト ── */
export const checklistService = {
  async save(riskId: number, checks: boolean[]): Promise<void> {
    const db = getDb()
    if (!db) return
    const ref = doc(db, "checklists", String(riskId))
    await updateDoc(ref, { riskId, checks, updatedAt: serverTimestamp() }).catch(async () => {
      await addDoc(collection(db, "checklists"), { riskId, checks, updatedAt: serverTimestamp() })
    })
  },
}

/* ── マネージャーメモ ── */
export const memoService = {
  async save(staffId: string, memo: string): Promise<void> {
    const db = getDb()
    if (!db) return
    const ref = doc(db, "managerMemos", staffId)
    await updateDoc(ref, { staffId, memo, updatedAt: serverTimestamp() }).catch(async () => {
      await addDoc(collection(db, "managerMemos"), { staffId, memo, updatedAt: serverTimestamp() })
    })
  },

  async get(staffId: string): Promise<string> {
    const db = getDb()
    if (!db) return ""
    const ref = doc(db, "managerMemos", staffId)
    const { getDoc } = await import("firebase/firestore")
    const snap = await getDoc(ref)
    return snap.exists() ? (snap.data().memo as string) : ""
  },
}
