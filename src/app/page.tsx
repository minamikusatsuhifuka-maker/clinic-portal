"use client"
import { isFirebaseConfigured } from "@/lib/firebase"
import { authService } from "@/lib/authService"
import { useState, useEffect } from "react"
import { useAppStore } from "@/store/useAppStore"
import { useEditStore } from "@/store/useEditStore"
import { RISKS } from "@/data/risks"
import Sidebar from "@/components/Sidebar"
import HomePage from "@/components/HomePage"
import RiskPage from "@/components/RiskPage"
import ManualPage from "@/components/ManualPage"
import AdminPage from "@/components/AdminPage"
import NearMissPage from "@/components/NearMissPage"
import { MatrixPage, ConfidencePage } from "@/components/OtherPages"
import AchievementPage from "@/components/AchievementPage"
import InsightPage from "@/components/InsightPage"
import ContactsPage from "@/components/ContactsPage"
import RolesPage from "@/components/RolesPage"
import MinutesPage from "@/components/MinutesPage"
import AiAssistant from "@/components/AiAssistant"
import { AnimatePresence, motion } from "framer-motion"

export type UserRole = "staff" | "manager" | "admin"
export interface AppUser {
  name: string
  role: UserRole
  avatar: string
  photoURL?: string | null
  email?: string
}

function getTitles(visibleCount: number): Record<string, string> {
  return {
    home: "ダッシュボード",
    risk: `リスク管理（${visibleCount}項目）`,
    manual: "業務マニュアル",
    matrix: "役割マトリクス",
    confidence: "4つの自信",
    nearmiss: "ヒヤリハット・事例共有",
    achievement: "人生目標・感謝・院長メッセージ",
    insight: "気づきノート（学び・実践・共有）",
    contacts: "緊急連絡先",
    roles: "役職ガイド・診療補助・清潔操作",
    minutes: "議事録・タスク管理",
    admin: "管理者ダッシュボード",
  }
}

/* ───── ログイン画面 ───── */
function LoginScreen({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState("")
  const firebaseReady = isFirebaseConfigured()

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setGoogleError("")
    try {
      const user = await authService.signInWithGoogle()
      if (user) {
        onLogin({
          name: user.displayName,
          role: user.role,
          avatar: user.displayName.charAt(0),
          photoURL: user.photoURL,
          email: user.email,
        })
      } else {
        setGoogleError("ログインに失敗しました。もう一度お試しください。")
      }
    } catch {
      setGoogleError("エラーが発生しました。")
    }
    setGoogleLoading(false)
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--page-bg)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--surface-bg)", borderRadius: 28,
        boxShadow: "0 8px 48px rgba(90,60,160,0.12)",
        padding: "44px 40px", width: "100%", maxWidth: 400, textAlign: "center",
      }}>
        {/* ロゴ */}
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: "linear-gradient(135deg,#b8975a,#d4b87a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 34, margin: "0 auto 20px",
          boxShadow: "0 4px 20px rgba(167,139,250,0.4)",
        }}>🏥</div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#3a2f5a", marginBottom: 6, letterSpacing: "-0.02em" }}>
          CarePortal
        </h1>
        <p style={{ fontSize: 13, color: "#b0a8c8", marginBottom: 36, lineHeight: 1.6 }}>
          南草津皮フ科 スタッフポータルへようこそ
        </p>

        {/* Googleログイン（Firebase設定済み時） */}
        {firebaseReady && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 10, padding: "13px 20px",
                borderRadius: 14, border: "1px solid rgba(124,101,204,0.22)",
                background: "var(--surface-bg)", fontSize: 14, fontWeight: 600,
                color: "rgba(245,242,237,0.65)", cursor: "pointer", marginBottom: 8,
                boxShadow: "0 2px 8px rgba(90,60,160,0.07)",
                opacity: googleLoading ? 0.7 : 1,
              }}>
              {googleLoading ? (
                <span style={{ fontSize: 16 }}>⏳</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.5-4z"/>
                </svg>
              )}
              {googleLoading ? "ログイン中..." : "Googleアカウントでログイン"}
            </button>
            {googleError && (
              <p style={{ fontSize: 12, color: "#ef4444", textAlign: "center", marginTop: 6 }}>
                {googleError}
              </p>
            )}
          </div>
        )}

        {/* 区切り */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(124,101,204,0.1)" }} />
          <span style={{ fontSize: 11, color: "#c4bde0" }}>{firebaseReady ? "またはデモモードで体験" : "デモモードで体験する"}</span>
          <div style={{ flex: 1, height: 1, background: "rgba(124,101,204,0.1)" }} />
        </div>

        {/* デモログインボタン */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => onLogin({ name: "田中 花子", role: "staff", avatar: "田" })}
            style={{
              padding: "14px", borderRadius: 16,
              border: "1px solid rgba(124,101,204,0.2)",
              background: "#f5f2fd", color: "#5f4ba8",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
            <span style={{ fontSize: 20 }}>👩‍⚕️</span>
            <span>スタッフとしてログイン</span>
          </button>

          <button
            onClick={() => onLogin({ name: "山田 マネージャー", role: "manager", avatar: "山" })}
            style={{
              padding: "14px", borderRadius: 16,
              border: "1px solid rgba(251,191,36,0.4)",
              background: "#fffbeb", color: "#b45309",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span>マネージャーとしてログイン</span>
          </button>

          <button
            onClick={() => onLogin({ name: "佐藤 院長", role: "admin", avatar: "佐" })}
            style={{
              padding: "14px", borderRadius: 16,
              border: "1px solid rgba(167,139,250,0.35)",
              background: "linear-gradient(135deg,#ede8fb,#fce4ec)", color: "#3a2f5a",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
            <span style={{ fontSize: 20 }}>👑</span>
            <span>管理者としてログイン</span>
          </button>
        </div>

        <p style={{
          fontSize: 11, color: "#c4bde0", marginTop: 24, lineHeight: 1.7,
          background: "#f8f6fc", padding: "10px 14px", borderRadius: 10,
        }}>
          ※ デモモードで動作中です。本番運用時は<br />Firebase認証を設定してください。
        </p>
      </div>
    </div>
  )
}

/* ───── メインアプリ ───── */
function MainApp({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const { activePage } = useAppStore()
  const { riskVisibility } = useEditStore()
  const visibleCount = RISKS.filter((r) => riskVisibility[r.id] !== false).length
  const TITLES = getTitles(visibleCount)
  const isAdminOrManager = user.role === "admin" || user.role === "manager"

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--page-bg)" }}>
      <SidebarWithUser user={user} onLogout={onLogout} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* トップバー */}
        <header style={{
          height: 52, background: "var(--surface-bg)",
          borderBottom: "0.5px solid var(--border-color)",
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 10, flexShrink: 0,
          boxShadow: "none",
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>
            {TITLES[activePage]}
          </h2>
          {user.role === "admin" && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "var(--subtle-bg)", border: "0.5px solid var(--border-color)", color: "#b8975a" }}>
              👑 管理者
            </span>
          )}
          {user.role === "manager" && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309" }}>
              📋 マネージャー
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#edfbf4", border: "1px solid #86efac", padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#166534" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            稼働中
          </div>
          <div style={{ background: "#f5f2fd", border: "1px solid rgba(124,101,204,0.15)", padding: "5px 12px", borderRadius: 999, fontSize: 11, color: "#9b87e4" }}>
            {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
          </div>
        </header>

        {/* コンテンツ */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div key={activePage}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
              {activePage === "home"       && <HomePage />}
              {activePage === "risk"       && <RiskPage userRole={user.role} />}
              {activePage === "manual"     && <ManualPage />}
              {activePage === "matrix"     && <MatrixPage />}
              {activePage === "confidence" && <ConfidencePage userRole={user.role} />}
              {activePage === "nearmiss"   && <NearMissPage />}
              {activePage === "achievement" && <AchievementPage userRole={user.role} userName={user.name} />}
              {activePage === "insight"     && <InsightPage userRole={user.role} userName={user.name} />}
              {activePage === "contacts"   && <ContactsPage />}
              {activePage === "roles"      && <RolesPage />}
              {activePage === "minutes"    && <MinutesPage userRole={user.role} />}
              {activePage === "admin"      && (
                isAdminOrManager ? <AdminPage /> : (
                  <div style={{ padding: 60, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(245,242,237,0.55)" }}>
                      管理者・マネージャーのみアクセスできます
                    </div>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <AiAssistant userRole={user.role} />
    </div>
  )
}

/* ───── ユーザー情報付きサイドバー ───── */
import { useSettingsStore, FONTS } from "@/store/useSettingsStore"
import type { FontChoice } from "@/store/useSettingsStore"
import { Shield, BookOpen, Grid3X3, Star, MessageCircleHeart, LayoutDashboard, Settings, Bell, ExternalLink, ShieldCheck, LogOut, Trophy, Lightbulb, Phone, Users, FileText, Moon, Sun } from "lucide-react"

const NAV = [
  { id: "home",       icon: LayoutDashboard,    label: "ダッシュボード",   badge: null, alert: false },
  { id: "risk",       icon: Shield,             label: "リスク管理",       badge: null, alert: true  },
  { id: "manual",     icon: BookOpen,           label: "業務マニュアル",   badge: null, alert: false },
  { id: "matrix",     icon: Grid3X3,            label: "役割マトリクス",   badge: null, alert: false },
  { id: "confidence", icon: Star,               label: "4つの自信",        badge: null, alert: false },
  { id: "nearmiss",    icon: MessageCircleHeart, label: "ヒヤリハット共有", badge: 6,    alert: false },
  { id: "achievement", icon: Trophy,             label: "人生・感謝・院長", badge: null, alert: false },
  { id: "insight",     icon: Lightbulb,          label: "気づきノート",     badge: null, alert: false },
  { id: "contacts",    icon: Phone,              label: "緊急連絡先",       badge: null, alert: false },
  { id: "roles",       icon: Users,              label: "役職ガイド",       badge: null, alert: false },
  { id: "minutes",     icon: FileText,           label: "📝 議事録・タスク", badge: null, alert: false },
  { id: "admin",       icon: ShieldCheck,        label: "管理者画面",       badge: null, alert: false },
]
const LINKS = [
  { label: "Googleカレンダー", href: "https://calendar.google.com", emoji: "📅" },
  { label: "Googleドライブ",   href: "https://drive.google.com",    emoji: "📁" },
  { label: "Chatwork",         href: "https://www.chatwork.com",    emoji: "💬" },
]

function SidebarWithUser({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const { activePage, setActivePage } = useAppStore()
  const { font, darkMode } = useSettingsStore()
  const { riskVisibility } = useEditStore()
  const riskBadge = RISKS.filter((r) => riskVisibility[r.id] !== false).length
  const base: React.CSSProperties = {
    width: "100%", display: "flex", alignItems: "center", gap: 9,
    padding: "9px 10px", borderRadius: 10, marginBottom: 2,
    fontSize: 13, cursor: "pointer", border: "1px solid transparent", background: "transparent",
  }
  return (
    <aside style={{ width: 220, minWidth: 220, background: "#1e2230", borderRight: "none", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#b8975a,#d4b87a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏥</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f8f6f2" }}>CarePortal</div>
            <div style={{ fontSize: 10, color: "rgba(245,242,237,0.5)", marginTop: 1 }}>南草津皮フ科</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(245,242,237,0.35)", padding: "6px 8px 4px", letterSpacing: "0.1em" }}>MENU</div>
        {NAV.map(n => {
          const Icon = n.icon
          const active = activePage === n.id
          if (n.id === "admin" && user.role === "staff") return null
          return (
            <button key={n.id} onClick={() => setActivePage(n.id)}
              style={{ ...base, background: active ? "#ede8fb" : "transparent", border: active ? "1px solid rgba(124,101,204,0.18)" : "1px solid transparent", color: active ? "#5f4ba8" : "#7a6e96", fontWeight: active ? 600 : 400 }}>
              <Icon size={15} style={{ color: active ? "#7c65cc" : "#b0a8c8", flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
              {(n.badge || n.id === "risk") && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: n.alert ? "#fef2f2" : "#edfbf4", color: n.alert ? "#c0392b" : "#166534", border: `1px solid ${n.alert ? "#fca5a5" : "#86efac"}` }}>
                  {n.id === "risk" ? riskBadge : n.badge}
                </span>
              )}
            </button>
          )
        })}
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(245,242,237,0.35)", padding: "12px 8px 4px", letterSpacing: "0.1em" }}>外部リンク</div>
        {LINKS.map(l => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
            style={{ ...base, textDecoration: "none", color: "rgba(245,242,237,0.55)" }}>
            <span style={{ fontSize: 15 }}>{l.emoji}</span>
            <span style={{ flex: 1 }}>{l.label}</span>
            <ExternalLink size={10} style={{ color: "rgba(245,242,237,0.4)" }} />
          </a>
        ))}
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(245,242,237,0.35)", padding: "12px 8px 4px", letterSpacing: "0.1em" }}>設定</div>
        <div style={{ padding: "6px 8px 8px" }}>
          <div style={{ fontSize: 10, color: "rgba(245,242,237,0.4)", marginBottom: 6 }}>フォント</div>
          {(Object.entries(FONTS) as [FontChoice, typeof FONTS[FontChoice]][]).map(([key, f]) => (
            <button key={key}
              onClick={() => useSettingsStore.getState().setFont(key)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 8, border: "none", background: font === key ? "rgba(184,151,90,0.2)" : "transparent", color: font === key ? "#f8f6f2" : "rgba(245,242,237,0.5)", fontSize: 12, fontWeight: font === key ? 600 : 400, cursor: "pointer", marginBottom: 2, fontFamily: f.value }}>
              <span>{f.label}</span>
              {font === key && <span style={{ fontSize: 10, color: "#b8975a" }}>✓</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: "6px 8px 4px" }}>
          <button onClick={() => useSettingsStore.getState().toggleDarkMode()}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 8, border: "none", background: darkMode ? "rgba(184,151,90,0.2)" : "transparent", color: "rgba(245,242,237,0.55)", fontSize: 12, cursor: "pointer" }}>
            {darkMode ? <Sun size={13} style={{ color: "#b8975a" }} /> : <Moon size={13} style={{ color: "rgba(245,242,237,0.4)" }} />}
            <span>{darkMode ? "ライトモード" : "ダークモード"}</span>
          </button>
        </div>
      </nav>
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        {user.photoURL ? (
          <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#b8975a,#d4b87a)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            {user.avatar}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f8f6f2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
          <div style={{ fontSize: 10, color: "rgba(245,242,237,0.45)", marginTop: 1 }}>
            {user.role === "admin" ? "👑 管理者" : user.role === "manager" ? "📋 マネージャー" : "一般スタッフ"}
          </div>
        </div>
        <button onClick={onLogout} title="ログアウト"
          style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(245,242,237,0.4)", flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,242,237,0.4)")}>
          <LogOut size={12} />
        </button>
      </div>
    </aside>
  )
}

/* ───── ルート ───── */
export default function App() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  if (!user) return <LoginScreen onLogin={setUser} />
  return <MainApp user={user} onLogout={() => setUser(null)} />
}
