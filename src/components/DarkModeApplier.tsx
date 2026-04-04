"use client"
import { useEffect } from "react"
import { useSettingsStore } from "@/store/useSettingsStore"

export default function DarkModeApplier() {
  const { font, darkMode } = useSettingsStore()

  useEffect(() => {
    document.documentElement.style.setProperty("--app-font",
      font === "system" ? "-apple-system, 'Hiragino Sans', sans-serif" :
      font === "noto" ? "'Noto Sans JP', sans-serif" :
      font === "zen" ? "'Zen Kaku Gothic New', sans-serif" :
      font === "murecho" ? "'Murecho', sans-serif" :
      "'BIZ UDGothic', sans-serif"
    )
  }, [font])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
      document.body.style.background = "#111318"
      document.body.style.color = "#e8e6e0"
    } else {
      document.documentElement.classList.remove("dark")
      document.body.style.background = "#f8f6f2"
      document.body.style.color = "#1e2230"
    }
  }, [darkMode])

  return null
}
