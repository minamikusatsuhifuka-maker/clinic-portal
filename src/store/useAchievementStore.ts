import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface LifeGoal {
  id: string
  area: "work" | "family" | "health" | "finance" | "hobby"
  timeframe: "1year" | "3year" | "10year"
  goal: string
  why: string
  action: string
  progress: number
  createdAt: string
}

export interface GratitudeCard {
  id: string
  fromName: string
  fromRole: string
  toName: string
  toRole: string
  message: string
  likes: number
  likedBy: string[]
  createdAt: string
}

export interface DirectorMessage {
  id: string
  title: string
  body: string
  principle: string
  likes: number
  likedBy: string[]
  createdAt: string
}

interface AchievementState {
  lifeGoals: LifeGoal[]
  gratitudeCards: GratitudeCard[]
  directorMessages: DirectorMessage[]
  addLifeGoal: (g: Omit<LifeGoal, "id" | "createdAt">) => void
  updateLifeGoal: (id: string, data: Partial<LifeGoal>) => void
  deleteLifeGoal: (id: string) => void
  addGratitudeCard: (c: Omit<GratitudeCard, "id" | "createdAt" | "likes" | "likedBy">) => void
  likeGratitudeCard: (id: string, userName: string) => void
  addDirectorMessage: (m: Omit<DirectorMessage, "id" | "createdAt" | "likes" | "likedBy">) => void
  likeDirectorMessage: (id: string, userName: string) => void
  deleteDirectorMessage: (id: string) => void
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set) => ({
      lifeGoals: [],
      gratitudeCards: [],
      directorMessages: [
        {
          id: "demo1",
          title: "なぜ私たちはこの仕事をするのか",
          body: "患者さんの笑顔を見るたびに、私たちの仕事の意味を感じます。\n\n皮膚の悩みは、外見だけでなく心にも影響します。その悩みを解決することで、患者さんの人生が少し豊かになる。その積み重ねが、私たちクリニックの存在意義です。\n\nスタッフの皆さん一人ひとりが、その大切な仕事の担い手です。",
          principle: "仕事の意義・PURPOSE",
          likes: 0,
          likedBy: [],
          createdAt: new Date().toISOString(),
        },
      ],
      addLifeGoal: (g) => set((s) => ({
        lifeGoals: [{ ...g, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...s.lifeGoals],
      })),
      updateLifeGoal: (id, data) => set((s) => ({
        lifeGoals: s.lifeGoals.map((g) => g.id === id ? { ...g, ...data } : g),
      })),
      deleteLifeGoal: (id) => set((s) => ({ lifeGoals: s.lifeGoals.filter((g) => g.id !== id) })),
      addGratitudeCard: (c) => set((s) => ({
        gratitudeCards: [{ ...c, id: Date.now().toString(), createdAt: new Date().toISOString(), likes: 0, likedBy: [] }, ...s.gratitudeCards],
      })),
      likeGratitudeCard: (id, userName) => set((s) => ({
        gratitudeCards: s.gratitudeCards.map((c) =>
          c.id === id
            ? c.likedBy.includes(userName)
              ? { ...c, likes: c.likes - 1, likedBy: c.likedBy.filter((u) => u !== userName) }
              : { ...c, likes: c.likes + 1, likedBy: [...c.likedBy, userName] }
            : c
        ),
      })),
      addDirectorMessage: (m) => set((s) => ({
        directorMessages: [{ ...m, id: Date.now().toString(), createdAt: new Date().toISOString(), likes: 0, likedBy: [] }, ...s.directorMessages],
      })),
      likeDirectorMessage: (id, userName) => set((s) => ({
        directorMessages: s.directorMessages.map((m) =>
          m.id === id
            ? m.likedBy.includes(userName)
              ? { ...m, likes: m.likes - 1, likedBy: m.likedBy.filter((u) => u !== userName) }
              : { ...m, likes: m.likes + 1, likedBy: [...m.likedBy, userName] }
            : m
        ),
      })),
      deleteDirectorMessage: (id) => set((s) => ({ directorMessages: s.directorMessages.filter((m) => m.id !== id) })),
    }),
    { name: "care-portal-achievement" }
  )
)
