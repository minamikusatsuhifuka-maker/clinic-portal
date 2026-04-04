"use client"
import { useEffect } from "react"
import { useSettingsStore, FONTS } from "@/store/useSettingsStore"

export default function DarkModeApplier() {
  const { font, darkMode } = useSettingsStore()

  useEffect(() => {
    document.documentElement.style.setProperty("--app-font", FONTS[font].value)
  }, [font])

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.style.setProperty("--page-bg", "#111318")
      root.style.setProperty("--surface-bg", "#1e2230")
      root.style.setProperty("--subtle-bg", "#252836")
      root.style.setProperty("--text-primary", "#e8e4dc")
      root.style.setProperty("--text-secondary", "#9a9aaa")
      root.style.setProperty("--border-color", "rgba(255,255,255,0.1)")
      document.body.style.background = "#111318"
      document.body.style.color = "#e8e4dc"
    } else {
      root.style.setProperty("--page-bg", "#f8f6f2")
      root.style.setProperty("--surface-bg", "#ffffff")
      root.style.setProperty("--subtle-bg", "#f0ede8")
      root.style.setProperty("--text-primary", "#1e2230")
      root.style.setProperty("--text-secondary", "#6b7280")
      root.style.setProperty("--border-color", "rgba(26,30,46,0.1)")
      document.body.style.background = "#f8f6f2"
      document.body.style.color = "#1e2230"
    }
  }, [darkMode])

  return null
}
