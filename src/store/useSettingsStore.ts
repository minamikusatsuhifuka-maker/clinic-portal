import { create } from "zustand"
import { persist } from "zustand/middleware"

export type FontChoice = "system" | "noto" | "zen" | "murecho" | "biz"

export const FONTS: Record<FontChoice, { label: string; value: string; description: string }> = {
  system:  { label: "システム標準", value: "-apple-system, 'Hiragino Sans', 'Yu Gothic UI', sans-serif", description: "OSのデフォルト。軽快で馴染みやすい" },
  noto:    { label: "Noto Sans JP", value: "'Noto Sans JP', sans-serif", description: "Googleフォント。均整が取れた読みやすい書体" },
  zen:     { label: "Zen Kaku Gothic", value: "'Zen Kaku Gothic New', sans-serif", description: "スッキリとした角ゴシック。画面映えする" },
  murecho: { label: "Murecho", value: "'Murecho', sans-serif", description: "温かみのある丸みゴシック。やさしい印象" },
  biz:     { label: "BIZ UDGothic", value: "'BIZ UDGothic', sans-serif", description: "UD書体。疲れにくく読みやすい業務用フォント" },
}

interface SettingsState {
  font: FontChoice
  setFont: (f: FontChoice) => void
  darkMode: boolean
  toggleDarkMode: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      font: "system",
      setFont: (font) => set({ font }),
      darkMode: false,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    { name: "care-portal-settings" }
  )
)
