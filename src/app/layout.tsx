import type { Metadata, Viewport } from "next"
import FontApplier from "@/components/FontApplier"
import "./globals.css"

export const metadata: Metadata = {
  title: "南草津皮フ科 | スタッフポータル CarePortal",
  description: "南草津皮フ科のスタッフポータル。リスク管理・マニュアル・ヒヤリハット共有。",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body><FontApplier />{children}</body>
    </html>
  )
}
