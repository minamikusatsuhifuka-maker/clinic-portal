"use client"
import { useEffect, useState, useCallback } from "react"
import { nearMissService, type NearMissDoc } from "@/lib/firestoreService"
import { isFirebaseConfigured } from "@/lib/firebase"
import { useAppStore } from "@/store/useAppStore"

function toRelative(date: Date): string {
  const diff = Date.now() - date.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "たった今"
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  return `${Math.floor(h / 24)}日前`
}

export function useNearMisses() {
  const { nearMisses: localNM, addNearMiss: addLocal, upvoteNearMiss: upvoteLocal } = useAppStore()
  const [firestoreNM, setFirestoreNM] = useState<NearMissDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [mode] = useState<"firestore" | "local">(() =>
    isFirebaseConfigured() ? "firestore" : "local"
  )

  useEffect(() => {
    if (mode !== "firestore") return
    setLoading(true)
    const unsub = nearMissService.subscribe((items) => {
      setFirestoreNM(items)
      setLoading(false)
    })
    return () => { unsub?.() }
  }, [mode])

  const nearMisses = mode === "firestore"
    ? firestoreNM.map((nm) => ({
        id: nm.id,
        tag: nm.tag,
        body: nm.body,
        role: nm.role,
        anonymous: nm.anonymous,
        upvotes: nm.upvotes,
        time: toRelative(nm.createdAt),
        resolved: nm.resolved,
      }))
    : localNM

  const addNearMiss = useCallback(async (data: {
    tag: string; body: string; role: string; anonymous: boolean
  }) => {
    if (mode === "firestore") {
      await nearMissService.add({ ...data, upvotes: 0, resolved: false })
    } else {
      addLocal(data)
    }
  }, [mode, addLocal])

  const upvoteNearMiss = useCallback(async (id: string) => {
    if (mode === "firestore") {
      const current = firestoreNM.find((n) => n.id === id)?.upvotes ?? 0
      await nearMissService.upvote(id, current)
    } else {
      upvoteLocal(id)
    }
  }, [mode, firestoreNM, upvoteLocal])

  const resolveNearMiss = useCallback(async (id: string) => {
    if (mode === "firestore") {
      await nearMissService.resolve(id)
    }
  }, [mode])

  return { nearMisses, addNearMiss, upvoteNearMiss, resolveNearMiss, loading, mode }
}
