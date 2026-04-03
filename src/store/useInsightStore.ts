import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Insight {
  id: string
  authorName: string
  authorRole: string
  source: string
  learning: string
  practice: string
  result: string
  isShared: boolean
  likes: number
  likedBy: string[]
  managerComment: string
  createdAt: string
}

interface InsightState {
  insights: Insight[]
  addInsight: (i: Omit<Insight, "id" | "createdAt" | "likes" | "likedBy">) => void
  updateInsight: (id: string, data: Partial<Insight>) => void
  deleteInsight: (id: string) => void
  likeInsight: (id: string, userName: string) => void
}

export const useInsightStore = create<InsightState>()(
  persist(
    (set) => ({
      insights: [
        {
          id: "demo1",
          authorName: "田中 花子",
          authorRole: "看護師",
          source: "アチーブメント社 研修",
          learning: "目標は「明確・測定可能・期限付き」で設定することで、脳が達成に向けて動き出す。",
          practice: "今月から美容カウンセリングの目標件数を数値で決めて記録する。",
          result: "",
          isShared: true,
          likes: 3,
          likedBy: ["山田", "鈴木"],
          managerComment: "",
          createdAt: new Date().toISOString(),
        },
      ],
      addInsight: (i) => set((s) => ({
        insights: [{ ...i, id: Date.now().toString(), createdAt: new Date().toISOString(), likes: 0, likedBy: [] }, ...s.insights],
      })),
      updateInsight: (id, data) => set((s) => ({
        insights: s.insights.map((i) => i.id === id ? { ...i, ...data } : i),
      })),
      deleteInsight: (id) => set((s) => ({ insights: s.insights.filter((i) => i.id !== id) })),
      likeInsight: (id, userName) => set((s) => ({
        insights: s.insights.map((i) =>
          i.id === id
            ? i.likedBy.includes(userName)
              ? { ...i, likes: i.likes - 1, likedBy: i.likedBy.filter((u) => u !== userName) }
              : { ...i, likes: i.likes + 1, likedBy: [...i.likedBy, userName] }
            : i
        ),
      })),
    }),
    { name: "care-portal-insights" }
  )
)
