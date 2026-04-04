"use client"
import { useEffect } from "react"
import { useSettingsStore } from "@/store/useSettingsStore"

export default function DarkModeApplier() {
  const { darkMode } = useSettingsStore()
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])
  return null
}
