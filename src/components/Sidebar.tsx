"use client"
import { motion } from "framer-motion"
import { useAppStore } from "@/store/useAppStore"
import {
  Shield, BookOpen, Grid3X3, Star,
  MessageCircleHeart, LayoutDashboard,
  Settings, Bell, ExternalLink, ChevronRight
} from "lucide-react"

const NAV = [
  { id: "home", icon: LayoutDashboard, label: "ダッシュボード", badge: null, green: false },
  { id: "risk", icon: Shield, label: "リスク管理", badge: 3, green: false },
  { id: "manual", icon: BookOpen, label: "業務マニュアル", badge: null, green: false },
  { id: "matrix", icon: Grid3X3, label: "役割マトリクス", badge: null, green: false },
  { id: "confidence", icon: Star, label: "4つの自信", badge: null, green: false },
  { id: "nearmiss", icon: MessageCircleHeart, label: "ヒヤリハット共有", badge: 6, green: true },
]

const LINKS = [
  { label: "Googleカレンダー", href: "https://calendar.google.com", emoji: "📅" },
  { label: "Googleドライブ", href: "https://drive.google.com", emoji: "📁" },
  { label: "Chatwork", href: "https://www.chatwork.com", emoji: "💬" },
]

export default function Sidebar() {
  const { activePage, setActivePage } = useAppStore()
  return (
    <aside className="w-56 min-w-[224px] h-screen bg-white border-r border-purple-100 flex flex-col">
      {/* ロゴ */}
      <div className="px-5 py-5 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-lg shadow-sm">🏥</div>
          <div>
            <div className="font-bold text-sm text-violet-800 tracking-tight leading-tight">CarePortal</div>
            <div className="text-[10px] text-violet-400 mt-0.5">クリニックポータル</div>
          </div>
        </div>
      </div>

      {/* ナビ */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        <p className="text-[10px] font-bold text-violet-300 px-2 py-1.5 tracking-widest">MENU</p>
        {NAV.map((n) => {
          const Icon = n.icon
          const active = activePage === n.id
          return (
            <motion.button
              key={n.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActivePage(n.id)}
              className={[
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors",
                active
                  ? "bg-violet-50 text-violet-700 font-semibold border border-violet-100"
                  : "text-slate-500 hover:bg-violet-50/60 hover:text-violet-600",
              ].join(" ")}
            >
              <Icon size={15} className={active ? "text-violet-500" : "text-slate-400"} />
              <span className="flex-1 leading-none">{n.label}</span>
              {n.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${n.green ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                  {n.badge}
                </span>
              )}
            </motion.button>
          )
        })}

        <p className="text-[10px] font-bold text-violet-300 px-2 pt-4 pb-1.5 tracking-widest">外部リンク</p>
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-violet-50/60 hover:text-violet-600 transition-colors"
          >
            <span className="text-base">{l.emoji}</span>
            <span className="flex-1">{l.label}</span>
            <ExternalLink size={11} className="text-slate-300" />
          </a>
        ))}

        <p className="text-[10px] font-bold text-violet-300 px-2 pt-4 pb-1.5 tracking-widest">設定</p>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-violet-50/60 transition-colors">
          <Settings size={15} className="text-slate-400" /><span>システム設定</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-violet-50/60 transition-colors">
          <Bell size={15} className="text-slate-400" /><span>Chatwork通知設定</span>
        </button>
      </nav>

      {/* ユーザー */}
      <div className="px-4 py-4 border-t border-purple-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-300 to-pink-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">田</div>
          <div>
            <div className="text-xs font-semibold text-slate-700 leading-tight">田中 看護師</div>
            <div className="text-[10px] text-violet-400 mt-0.5">一般スタッフ</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
