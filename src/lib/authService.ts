import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { getFirebaseApp, isFirebaseConfigured } from "./firebase"

export type UserRole = "admin" | "manager" | "staff"

export interface AppUser {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  role: UserRole
}

// 管理者メールアドレス（院長）
const ADMIN_EMAILS: string[] = [
  // 楠葉院長のGmailアドレスをここに設定
  // 例: "kusuba@gmail.com"
]

// マネージャーメールアドレス（後日設定）
const MANAGER_EMAILS: string[] = []

export function getRoleFromEmail(email: string): UserRole {
  if (ADMIN_EMAILS.includes(email)) return "admin"
  if (MANAGER_EMAILS.includes(email)) return "manager"
  return "staff"
}

export function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? user.email ?? "スタッフ",
    photoURL: user.photoURL,
    role: getRoleFromEmail(user.email ?? ""),
  }
}

export const authService = {
  getAuth() {
    const app = getFirebaseApp()
    if (!app) return null
    return getAuth(app)
  },

  async signInWithGoogle(): Promise<AppUser | null> {
    const auth = this.getAuth()
    if (!auth) return null
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    try {
      const result = await signInWithPopup(auth, provider)
      return toAppUser(result.user)
    } catch (e) {
      console.error("Google sign-in failed:", e)
      return null
    }
  },

  async signOut(): Promise<void> {
    const auth = this.getAuth()
    if (!auth) return
    await signOut(auth)
  },

  onAuthStateChanged(callback: (user: AppUser | null) => void) {
    const auth = this.getAuth()
    if (!auth) {
      callback(null)
      return () => {}
    }
    return onAuthStateChanged(auth, (user) => {
      callback(user ? toAppUser(user) : null)
    })
  },
}
