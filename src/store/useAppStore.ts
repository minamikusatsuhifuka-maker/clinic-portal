import { create } from "zustand"

interface NearMiss {
  id: string
  tag: string
  body: string
  role: string
  time: string
  upvotes: number
  anonymous: boolean
}

interface AppState {
  activePage: string
  setActivePage: (page: string) => void
  checkedItems: Record<number, boolean[]>
  toggleCheck: (riskId: number, index: number, total: number) => void
  nearMisses: NearMiss[]
  addNearMiss: (nm: Omit<NearMiss, "id" | "time" | "upvotes">) => void
  upvoteNearMiss: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: "home",
  setActivePage: (page) => set({ activePage: page }),
  checkedItems: {},
  toggleCheck: (riskId, index, total) =>
    set((state) => {
      const current = state.checkedItems[riskId] ?? Array(total).fill(false)
      const updated = [...current]
      updated[index] = !updated[index]
      return { checkedItems: { ...state.checkedItems, [riskId]: updated } }
    }),
  nearMisses: [
    { id: "1", tag: "薬剤", body: "似た名前の薬を一瞬間違えそうになった。棚の配置見直しが必要。", role: "看護師", time: "3時間前", upvotes: 4, anonymous: true },
    { id: "2", tag: "患者確認", body: "診察室の呼び出しで別患者が入室しかけた。声かけのルール化が必要。", role: "受付", time: "昨日", upvotes: 7, anonymous: true },
    { id: "3", tag: "転倒リスク", body: "廊下の濡れた床に気づいたが表示がなかった。サインの常備を提案したい。", role: "看護師", time: "3日前", upvotes: 12, anonymous: true },
  ],
  addNearMiss: (nm) =>
    set((state) => ({
      nearMisses: [{ ...nm, id: Date.now().toString(), time: "たった今", upvotes: 0 }, ...state.nearMisses],
    })),
  upvoteNearMiss: (id) =>
    set((state) => ({
      nearMisses: state.nearMisses.map((nm) => nm.id === id ? { ...nm, upvotes: nm.upvotes + 1 } : nm),
    })),
}))
