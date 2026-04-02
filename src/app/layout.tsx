import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CarePortal | クリニックスタッフポータル",
  description: "安心・安全・成長のためのクリニック専用スタッフポータル",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
