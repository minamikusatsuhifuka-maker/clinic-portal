import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyDwo_cE551XZT2hmKGG4a3Q2M-bKgajL-0",
  authDomain:        "mkhifuka-5c481.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "mkhifuka-5c481",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "mkhifuka-5c481.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "267777603085",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:267777603085:web:6539b3d23100946c9ec744",
}

export const isFirebaseConfigured = (): boolean => true

let app: FirebaseApp | null = null
let db: Firestore | null = null

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  }
  return app
}

export const getDb = (): Firestore | null => {
  if (!db) {
    const firebaseApp = getFirebaseApp()
    if (firebaseApp) db = getFirestore(firebaseApp)
  }
  return db
}
