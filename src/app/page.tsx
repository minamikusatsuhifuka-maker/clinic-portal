"use client"
import { useAppStore } from "@/store/useAppStore"
import Sidebar from "@/components/Sidebar"
import HomePage from "@/components/HomePage"
import RiskPage from "@/components/RiskPage"
import { NearMissPage, MatrixPage, ConfidencePage } from "@/components/OtherPages"
import ManualPage from "@/components/ManualPage"
import { AnimatePresence, motion } from "framer-motion"

const TITLES: Record<string,string> = {
  home:"ダッシュボード",
  risk:"リスク管理（10項目）",
  manual:"業務マニュアル",
  matrix:"役割マトリクス",
  confidence:"4つの自信",
  nearmiss:"ヒヤリハット・事例共有",
}

export default function App() {
  const { activePage } = useAppStore()
  return (
    <div className="flex h-screen overflow-hidden bg-violet-50/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* トップバー */}
        <header className="h-14 bg-white border-b border-violet-100 flex items-center px-6 gap-3 flex-shrink-0 shadow-sm">
          <h2 className="text-base font-bold text-violet-900 flex-1">{TITLES[activePage]}</h2>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Chatwork 連携中
          </div>
          <div className="bg-violet-50 text-violet-500 border border-violet-200 px-3 py-1.5 rounded-full text-xs hidden sm:block">
            {new Date().toLocaleDateString("ja-JP",{month:"long",day:"numeric",weekday:"short"})}
          </div>
        </header>
        {/* コンテンツ */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activePage}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.18 }}>
              {activePage==="home"       && <HomePage />}
              {activePage==="risk"       && <RiskPage />}
              {activePage==="manual"     && <ManualPage />}
              {activePage==="matrix"     && <MatrixPage />}
              {activePage==="confidence" && <ConfidencePage />}
              {activePage==="nearmiss"   && <NearMissPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
