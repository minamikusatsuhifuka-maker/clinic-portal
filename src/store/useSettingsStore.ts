import { create } from "zustand"
import { persist } from "zustand/middleware"

export type FontChoice = "system" | "noto" | "zen" | "murecho" | "biz"
export type FontSize = "small" | "medium" | "large" | "xlarge"

export const FONTS: Record<FontChoice, { label: string; value: string; description: string }> = {
  system:  { label: "システム標準", value: "-apple-system, 'Hiragino Sans', sans-serif", description: "OSのデフォルト" },
  noto:    { label: "Noto Sans JP", value: "'Noto Sans JP', sans-serif", description: "読みやすい標準書体" },
  zen:     { label: "Zen Kaku Gothic", value: "'Zen Kaku Gothic New', sans-serif", description: "スッキリした角ゴシック" },
  murecho: { label: "Murecho", value: "'Murecho', sans-serif", description: "やさしい丸みゴシック" },
  biz:     { label: "BIZ UDGothic", value: "'BIZ UDGothic', sans-serif", description: "疲れにくいUD書体" },
}

export const FONT_SIZES: Record<FontSize, { label: string; value: string; px: number }> = {
  small:  { label: "小", value: "13px", px: 13 },
  medium: { label: "中", value: "14px", px: 14 },
  large:  { label: "大", value: "16px", px: 16 },
  xlarge: { label: "特大", value: "18px", px: 18 },
}

interface SettingsState {
  font: FontChoice
  fontSize: FontSize
  darkMode: boolean
  setFont: (f: FontChoice) => void
  setFontSize: (s: FontSize) => void
  toggleDarkMode: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      font: "noto",
      fontSize: "medium",
      darkMode: false,
      setFont: (font) => set({ font }),
      setFontSize: (fontSize) => set({ fontSize }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    { name: "care-portal-settings" }
  )
)
