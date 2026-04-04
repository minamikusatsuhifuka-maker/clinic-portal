"use client"
import { useEffect } from "react"
import { useSettingsStore, FONTS } from "@/store/useSettingsStore"

export default function FontApplier() {
  const { font } = useSettingsStore()
  useEffect(() => {
    document.documentElement.style.setProperty("--app-font", FONTS[font].value)
  }, [font])
  return null
}
