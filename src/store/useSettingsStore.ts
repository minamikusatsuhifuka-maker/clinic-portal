import { create } from "zustand"
import { persist } from "zustand/middleware"

export type FontChoice = "system" | "noto" | "zen" | "murecho" | "biz"

export const FONTS: Record<FontChoice, { label: string; value: string; description: string }> = {
  system:  { label: "システム標準", value: "-apple-system, 'Hiragino Sans', sans-serif", description: "OSのデフォルト" },
  noto:    { label: "Noto Sans JP", value: "'Noto Sans JP', sans-serif", description: "読みやすい標準書体" },
  zen:     { label: "Zen Kaku Gothic", value: "'Zen Kaku Gothic New', sans-serif", description: "スッキリした角ゴシック" },
  murecho: { label: "Murecho", value: "'Murecho', sans-serif", description: "やさしい丸みゴシック" },
  biz:     { label: "BIZ UDGothic", value: "'BIZ UDGothic', sans-serif", description: "疲れにくいUD書体" },
}

interface SettingsState {
  font: FontChoice
  darkMode: boolean
  setFont: (f: FontChoice) => void
  toggleDarkMode: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      font: "noto",
      darkMode: false,
      setFont: (font) => set({ font }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    { name: "care-portal-settings" }
  )
)
