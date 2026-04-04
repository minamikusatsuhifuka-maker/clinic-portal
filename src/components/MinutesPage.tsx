"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic, Square, Play, Pause, Plus, Trash2,
  ChevronDown, ChevronUp, Loader2, RefreshCw,
  Sparkles, CheckSquare, Users, FileText
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const card: React.CSSProperties = {
  background: "var(--surface-bg)", borderRadius: 16,
  border: "1px solid rgba(100,80,180,0.13)",
  boxShadow: "0 1px 4px rgba(60,40,120,0.07)",
}

const ROLE_COLORS: Record<string, { label: string; bg: string; border: string; text: string }> = {
  director: { label: "👑 院長",         bg: "#fff0f0", border: "#ff6b6b", text: "#c0392b" },
  manager:  { label: "📊 マネージャー", bg: "#f0f8ff", border: "#4a90d9", text: "#2c5f8a" },
  leader:   { label: "👤 リーダー",     bg: "#f0fff4", border: "#27ae60", text: "#1a6b3c" },
  staff:    { label: "🏥 スタッフ",     bg: "#fffbf0", border: "#f39c12", text: "#7d5a00" },
}

const TASK_CATS = [
  { id: "operations", label: "業務運営" },
  { id: "medical",    label: "医療・診療" },
  { id: "hr",         label: "人事・採用" },
  { id: "finance",    label: "経理・財務" },
]

const toJST = (s: string | null) => {
  if (!s) return ""
  const d = new Date(s)
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${j.getUTCFullYear()}/${String(j.getUTCMonth()+1).padStart(2,"0")}/${String(j.getUTCDate()).padStart(2,"0")}`
}

interface Minute { id: string; created_at: string; title: string | null; input_text: string | null; output_text: string | null }
interface Task   { id: string; created_at: string; minute_id: string | null; title: string; assignee: string; due_date: string | null; urgency: number; importance: number; category: string; role_level: string; done: boolean; memo: string }
interface Staff  { id: string; name: string; role: string; department: string }

type TabId   = "minutes" | "tasks" | "staff"
type ViewId  = "matrix" | "list" | "timeline"

const quad = (u: number, i: number) =>
  u >= 3 && i >= 3 ? "q1" : u < 3 && i >= 3 ? "q2" : u >= 3 && i < 3 ? "q3" : "q4"

const QUAD = {
  q1: { label: "第1象限", sub: "重要かつ緊急",    color: "#c0392b", bg: "#fff0f0", border: "#fca5a5" },
  q2: { label: "第2象限", sub: "重要だが非緊急",  color: "#4e429a", bg: "#f5f2fd", border: "#c4b5fd" },
  q3: { label: "第3象限", sub: "緊急だが非重要",  color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  q4: { label: "第4象限", sub: "非重要・非緊急",  color: "var(--text-secondary)", bg: "#f9fafb", border: "#e5e7eb" },
}

export default function MinutesPage({ userRole = "staff" }: { userRole?: string }) {
  const [tab, setTab]         = useState<TabId>("minutes")
  const [view, setView]       = useState<ViewId>("matrix")
  const [status, setStatus]   = useState("")

  /* ── 議事録 state ── */
  const [minutes, setMinutes] = useState<Minute[]>([])
  const [recSt, setRecSt]     = useState<"inactive" | "recording" | "paused">("inactive")
  const [inp, setInp]         = useState("")
  const [out, setOut]         = useState("")
  const [title, setTitle]     = useState("")
  const [minLd, setMinLd]     = useState(false)
  const [typoLd, setTypoLd]   = useState(false)
  const [openId, setOpenId]   = useState<string | null>(null)
  const [sel, setSel]         = useState<string[]>([])
  const [mergeLd, setMergeLd] = useState(false)
  const [manInp, setManInp]   = useState("")
  const [manTitle, setManTitle] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [lvl, setLvl]         = useState(0)
  const [interim, setInterim] = useState("")

  /* ── タスク state ── */
  const [tasks, setTasks]       = useState<Task[]>([])
  const [taskLd, setTaskLd]     = useState(false)
  const [selRoles, setSelRoles] = useState(["director","manager","leader","staff"])
  const [newTitle, setNewTitle] = useState("")
  const [newRole, setNewRole]   = useState("staff")
  const [newCat, setNewCat]     = useState("operations")

  /* ── スタッフ state ── */
  const [staff, setStaff]         = useState<Staff[]>([])
  const [staffName, setStaffName] = useState("")
  const [staffRole, setStaffRole] = useState("staff")

  /* ── Refs ── */
  const mrRef       = useRef<MediaRecorder | null>(null)
  const srRef       = useRef<any>(null)
  const msRef       = useRef<MediaStream | null>(null)
  const acRef       = useRef<AudioContext | null>(null)
  const anRef       = useRef<AnalyserNode | null>(null)
  const laRef       = useRef<number | null>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRecRef    = useRef(false)
  const whisperRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunkBuf    = useRef<Blob[]>([])

  /* ── データ読み込み ── */
  const loadMinutes = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from("minutes").select("*").order("created_at", { ascending: false }).limit(50)
    setMinutes(data ?? [])
  }, [])

  const loadTasks = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })
    setTasks(data ?? [])
  }, [])

  const loadStaff = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from("staff").select("*").order("created_at")
    setStaff(data ?? [])
  }, [])

  useEffect(() => { loadMinutes(); loadTasks(); loadStaff() }, [loadMinutes, loadTasks, loadStaff])

  /* ── 音声レベル ── */
  const startLvl = (stream: MediaStream) => {
    const ctx = new AudioContext()
    const src = ctx.createMediaStreamSource(stream)
    const an  = ctx.createAnalyser()
    an.fftSize = 256; an.smoothingTimeConstant = 0.7
    src.connect(an)
    acRef.current = ctx; anRef.current = an
    const buf = new Uint8Array(an.frequencyBinCount)
    const tick = () => {
      if (!anRef.current) return
      anRef.current.getByteFrequencyData(buf)
      let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i]
      setLvl(Math.min(100, Math.round((s / buf.length / 128) * 100)))
      laRef.current = requestAnimationFrame(tick)
    }
    laRef.current = requestAnimationFrame(tick)
  }
  const stopLvl = () => {
    if (laRef.current) cancelAnimationFrame(laRef.current)
    if (acRef.current) try { acRef.current.close() } catch {}
    acRef.current = null; anRef.current = null; setLvl(0)
  }

  /* ── Whisperに10秒ごとに送信 ── */
  const sendToWhisper = async () => {
    if (chunkBuf.current.length === 0) return
    const chunks = [...chunkBuf.current]
    chunkBuf.current = []
    const mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm"
    const blob = new Blob(chunks, { type: mimeType })
    if (blob.size < 1000) return
    try {
      const form = new FormData()
      form.append("audio", blob, `chunk.${mimeType === "audio/mp4" ? "mp4" : "webm"}`)
      const res = await fetch("/api/transcribe", { method: "POST", body: form })
      const data = await res.json()
      if (data.ok && data.text?.trim()) {
        setInp(p => p + data.text.trim() + "\n")
        setInterim("")
      }
    } catch (e) {
      console.error("Whisper error:", e)
    }
  }

  /* ── 録音 ── */
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      msRef.current = stream
      startLvl(stream)
      isRecRef.current = true
      chunkBuf.current = []

      // MediaRecorder（10秒ごとにWhisperへ送信）
      const mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm"
      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunkBuf.current.push(e.data)
      }
      mr.start(1000)
      mrRef.current = mr

      // 10秒ごとにWhisperへ送信
      whisperRef.current = setInterval(sendToWhisper, 10000)

      // Web Speech API（暫定リアルタイム表示用）
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SR) {
        const startSR = () => {
          if (!isRecRef.current) return
          const sr = new SR()
          sr.lang = "ja-JP"; sr.continuous = true; sr.interimResults = true
          sr.onresult = (e: any) => {
            let inter = ""
            for (let i = e.resultIndex; i < e.results.length; i++) {
              if (!e.results[i].isFinal) inter += e.results[i][0].transcript
            }
            setInterim(inter)
          }
          sr.onerror = (e: any) => { if (e.error !== "no-speech") console.error("SR:", e.error) }
          sr.onend = () => { if (isRecRef.current) try { startSR() } catch {} }
          sr.start(); srRef.current = sr
        }
        startSR()
      }

      setRecSt("recording")
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
      setStatus("録音中（Whisper書き起こし：10秒ごと）")
    } catch {
      setStatus("マイクの使用が許可されていません")
    }
  }

  const stopRec = () => {
    isRecRef.current = false
    srRef.current?.stop(); srRef.current = null
    mrRef.current?.stop(); mrRef.current = null
    msRef.current?.getTracks().forEach(t => t.stop()); msRef.current = null
    stopLvl()
    if (timerRef.current) clearInterval(timerRef.current)
    if (whisperRef.current) clearInterval(whisperRef.current)
    sendToWhisper()
    setRecSt("inactive"); setInterim(""); setStatus("")
  }

  const pauseRec = () => {
    isRecRef.current = false
    srRef.current?.stop(); srRef.current = null
    mrRef.current?.pause()
    if (timerRef.current) clearInterval(timerRef.current)
    if (whisperRef.current) clearInterval(whisperRef.current)
    sendToWhisper()
    setRecSt("paused"); setStatus("一時停止中")
  }

  const resumeRec = () => {
    isRecRef.current = true
    chunkBuf.current = []
    mrRef.current?.resume()
    whisperRef.current = setInterval(sendToWhisper, 10000)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      const startSR = () => {
        if (!isRecRef.current) return
        const sr = new SR()
        sr.lang = "ja-JP"; sr.continuous = true; sr.interimResults = true
        sr.onresult = (e: any) => {
          let inter = ""
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (!e.results[i].isFinal) inter += e.results[i][0].transcript
          }
          setInterim(inter)
        }
        sr.onerror = (e: any) => { if (e.error !== "no-speech") console.error("SR:", e.error) }
        sr.onend = () => { if (isRecRef.current) try { startSR() } catch {} }
        sr.start(); srRef.current = sr
      }
      startSR()
    }
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    setRecSt("recording"); setStatus("録音中（Whisper書き起こし：10秒ごと）")
  }

  /* ── 議事録生成 ── */
  const genMinutes = async (text: string, t?: string) => {
    if (!text.trim()) { setStatus("テキストがありません"); return }
    setMinLd(true); setStatus("AI議事録を生成中...")
    try {
      const res  = await fetch("/api/minutes-summarize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title: t || title || "議事録" }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setOut(data.output)
      if (supabase) {
        await supabase.from("minutes").insert({
          title: t || title || `議事録 ${new Date().toLocaleDateString("ja-JP")}`,
          input_text: text, output_text: data.output,
        })
        await loadMinutes()
      }
      setStatus("議事録を保存しました ✅")
    } catch (e) { setStatus(`エラー: ${e}`) }
    finally { setMinLd(false) }
  }

  /* ── 誤字修正 ── */
  const fixTypos = async () => {
    if (!inp.trim()) return
    setTypoLd(true)
    const res  = await fetch("/api/minutes-typos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: inp }),
    })
    const data = await res.json()
    if (data.ok) setInp(data.output)
    setTypoLd(false)
  }

  /* ── タスク抽出 ── */
  const extractTasks = async (text: string, minId?: string) => {
    setTaskLd(true); setStatus("タスクを抽出中...")
    try {
      const res  = await fetch("/api/extract-tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!data.tasks?.length) { setStatus("タスクが見つかりませんでした"); return }
      if (supabase) {
        for (const t of data.tasks) {
          await supabase.from("tasks").insert({ ...t, minute_id: minId || null })
        }
        await loadTasks()
      } else {
        setTasks(p => [...data.tasks.map((t: Omit<Task,"id"|"done"|"created_at">) => ({ ...t, id: `l-${Date.now()}`, done: false, created_at: new Date().toISOString() })), ...p])
      }
      setStatus(`${data.tasks.length}件のタスクを抽出しました ✅`)
      setTab("tasks")
    } catch (e) { setStatus(`エラー: ${e}`) }
    finally { setTaskLd(false) }
  }

  /* ── タスク操作 ── */
  const toggleTask = async (id: string, done: boolean) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, done } : t))
    if (supabase) await supabase.from("tasks").update({ done }).eq("id", id)
  }
  const delTask = async (id: string) => {
    setTasks(p => p.filter(t => t.id !== id))
    if (supabase) await supabase.from("tasks").delete().eq("id", id)
  }
  const addTask = async () => {
    if (!newTitle.trim()) return
    const task = { minute_id: null, title: newTitle, assignee: "", due_date: null, urgency: 2, importance: 2, category: newCat, role_level: newRole, done: false, memo: "" }
    if (supabase) {
      const { data } = await supabase.from("tasks").insert(task).select().single()
      if (data) setTasks(p => [data, ...p])
    } else {
      setTasks(p => [{ ...task, id: `l-${Date.now()}`, created_at: new Date().toISOString() }, ...p])
    }
    setNewTitle(""); setStatus("タスクを追加しました")
  }

  /* ── スタッフ操作 ── */
  const addStaff = async () => {
    if (!staffName.trim()) return
    const s = { name: staffName, role: staffRole, department: "" }
    if (supabase) {
      const { data } = await supabase.from("staff").insert(s).select().single()
      if (data) setStaff(p => [...p, data])
    } else {
      setStaff(p => [...p, { ...s, id: `l-${Date.now()}` }])
    }
    setStaffName("")
  }
  const delStaff = async (id: string) => {
    setStaff(p => p.filter(s => s.id !== id))
    if (supabase) await supabase.from("staff").delete().eq("id", id)
  }

  const filteredTasks = tasks.filter(t => selRoles.includes(t.role_level))
  const elStr = `${String(Math.floor(elapsed/60)).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}`

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      {/* タブ */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {([["minutes","📝 議事録"],["tasks","✅ タスク管理"],["staff","👥 スタッフ"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "8px 18px", borderRadius: 999, fontSize: 12, fontWeight: tab === id ? 700 : 400,
              cursor: "pointer", border: "none",
              background: tab === id ? "linear-gradient(135deg,#6b5cb8,#a78bfa)" : "#fff",
              color: tab === id ? "white" : "#6b6080",
              boxShadow: tab === id ? "0 2px 8px rgba(107,92,184,0.35)" : "0 1px 3px rgba(60,40,120,0.08)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ステータス */}
      <AnimatePresence>
        {status && (
          <motion.div initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
            style={{ marginBottom: 14, padding: "9px 14px", borderRadius: 10, background: "var(--subtle-bg)", fontSize: 12, color: "#4e429a" }}>
            {status}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ 議事録タブ ══════════════ */}
      {tab === "minutes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 録音コントロール */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#2d2640", marginBottom: 14 }}>🎙 音声録音・書き起こし</div>

            {/* 音声レベルバー */}
            {recSt === "recording" && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 8, background: "#e8e4f5", borderRadius: 4, overflow: "hidden" }}>
                  <motion.div animate={{ width: `${lvl}%` }} transition={{ duration: 0.1 }}
                    style={{ height: "100%", background: "linear-gradient(90deg,#6b5cb8,#a78bfa)", borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 11, color: "#8a82a8", marginTop: 4 }}>🔴 録音中 {elStr}</div>
              </div>
            )}
            {recSt === "paused" && (
              <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 12 }}>⏸ 一時停止中 {elStr}</div>
            )}

            {/* 録音ボタン */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {recSt === "inactive" && (
                <button onClick={startRec}
                  style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 20px",borderRadius:12,background:"#ef4444",color:"white",fontSize:13,fontWeight:600,border:"none",cursor:"pointer" }}>
                  <Mic size={16} />録音開始
                </button>
              )}
              {recSt === "recording" && (<>
                <button onClick={pauseRec}
                  style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:12,background:"#f59e0b",color:"white",fontSize:13,fontWeight:600,border:"none",cursor:"pointer" }}>
                  <Pause size={16} />一時停止
                </button>
                <button onClick={stopRec}
                  style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:12,background:"#6b7280",color:"white",fontSize:13,fontWeight:600,border:"none",cursor:"pointer" }}>
                  <Square size={16} />停止
                </button>
              </>)}
              {recSt === "paused" && (<>
                <button onClick={resumeRec}
                  style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:12,background:"#22c55e",color:"white",fontSize:13,fontWeight:600,border:"none",cursor:"pointer" }}>
                  <Play size={16} />再開
                </button>
                <button onClick={stopRec}
                  style={{ display:"flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:12,background:"#6b7280",color:"white",fontSize:13,fontWeight:600,border:"none",cursor:"pointer" }}>
                  <Square size={16} />停止
                </button>
              </>)}
            </div>

            {/* タイトル */}
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="議事録タイトル（例：4月スタッフ会議）"
              style={{ width:"100%",border:"1px solid rgba(100,80,180,0.2)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#1e1a2e",background:"var(--subtle-bg)",outline:"none",marginBottom:10,fontFamily:"inherit" }} />

            {/* 書き起こしテキスト */}
            <div style={{ position: "relative" }}>
              <textarea value={inp} onChange={e => setInp(e.target.value)} rows={7}
                placeholder="録音すると自動で書き起こされます。直接入力・貼り付けもできます。"
                style={{ width:"100%",border:"1px solid rgba(100,80,180,0.2)",borderRadius:10,padding:"10px 12px",fontSize:13,color:"#1e1a2e",background:"#fafafe",outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.75 }} />
              {interim && (
                <div style={{ position:"absolute",bottom:10,left:12,right:12,fontSize:12,color:"#8a82a8",fontStyle:"italic",pointerEvents:"none" }}>
                  {interim}
                </div>
              )}
            </div>

            {/* アクション */}
            <div style={{ display:"flex",gap:8,marginTop:10,flexWrap:"wrap" }}>
              <button onClick={fixTypos} disabled={typoLd || !inp.trim()}
                style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid rgba(100,80,180,0.2)",background:"var(--subtle-bg)",color:"#4e429a",fontSize:12,cursor:"pointer",opacity:typoLd||!inp.trim()?0.5:1 }}>
                {typoLd ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}} /> : <RefreshCw size={13} />}
                誤字修正
              </button>
              <button onClick={() => genMinutes(inp)} disabled={minLd || !inp.trim()}
                style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,background:"linear-gradient(135deg,#6b5cb8,#a78bfa)",color:"white",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",opacity:minLd||!inp.trim()?0.6:1 }}>
                {minLd ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}} /> : <Sparkles size={13} />}
                AI議事録生成
              </button>
              <button onClick={() => extractTasks(inp)} disabled={taskLd || !inp.trim()}
                style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid rgba(34,197,94,0.3)",background:"#edfbf4",color:"#166534",fontSize:12,cursor:"pointer",opacity:taskLd||!inp.trim()?0.5:1 }}>
                {taskLd ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}} /> : <CheckSquare size={13} />}
                タスク抽出
              </button>
              <button onClick={() => { setInp(""); setOut(""); setTitle("") }}
                style={{ padding:"8px 12px",borderRadius:10,border:"1px solid rgba(100,80,180,0.15)",background:"transparent",color:"#8a82a8",fontSize:12,cursor:"pointer" }}>
                クリア
              </button>
            </div>
          </div>

          {/* 生成された議事録 */}
          {out && (
            <div style={{ ...card, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#2d2640", marginBottom: 12 }}>📄 生成された議事録</div>
              <pre style={{ fontSize: 13, color: "#1e1a2e", lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", margin: 0 }}>{out}</pre>
              <button onClick={() => extractTasks(out)} disabled={taskLd} style={{ marginTop: 14, display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid rgba(34,197,94,0.3)",background:"#edfbf4",color:"#166534",fontSize:12,cursor:"pointer" }}>
                <CheckSquare size={13} />この議事録からタスクを抽出
              </button>
            </div>
          )}

          {/* 手動テキスト入力 */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2d2640", marginBottom: 12 }}>✏️ テキストから議事録を作成</div>
            <input value={manTitle} onChange={e => setManTitle(e.target.value)} placeholder="タイトル"
              style={{ width:"100%",border:"1px solid rgba(100,80,180,0.2)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#1e1a2e",background:"var(--subtle-bg)",outline:"none",marginBottom:8,fontFamily:"inherit" }} />
            <textarea value={manInp} onChange={e => setManInp(e.target.value)} rows={5}
              placeholder="会議メモ・議事メモを貼り付けてください"
              style={{ width:"100%",border:"1px solid rgba(100,80,180,0.2)",borderRadius:10,padding:"10px 12px",fontSize:13,color:"#1e1a2e",background:"#fafafe",outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.75 }} />
            <div style={{ display:"flex",gap:8,marginTop:8 }}>
              <button onClick={() => { genMinutes(manInp, manTitle); setManInp(""); setManTitle("") }}
                disabled={minLd || !manInp.trim()}
                style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,background:"linear-gradient(135deg,#6b5cb8,#a78bfa)",color:"white",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",opacity:minLd||!manInp.trim()?0.6:1 }}>
                <Sparkles size={13} />AI議事録を生成
              </button>
              <button onClick={() => extractTasks(manInp)} disabled={taskLd || !manInp.trim()}
                style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid rgba(34,197,94,0.3)",background:"#edfbf4",color:"#166534",fontSize:12,cursor:"pointer",opacity:taskLd||!manInp.trim()?0.5:1 }}>
                <CheckSquare size={13} />タスク抽出のみ
              </button>
            </div>
          </div>

          {/* 議事録履歴 */}
          {minutes.length > 0 && (
            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div style={{ padding:"14px 18px",borderBottom:"1px solid rgba(100,80,180,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ fontSize:13,fontWeight:600,color:"#2d2640" }}>📚 議事録履歴（{minutes.length}件）</div>
                {sel.length >= 2 && (
                  <button onClick={async () => {
                    setMergeLd(true)
                    const texts = minutes.filter(m => sel.includes(m.id)).map(m => m.output_text || m.input_text || "").join("\n\n---\n\n")
                    await genMinutes(texts, "統合議事録")
                    setSel([]); setMergeLd(false)
                  }} disabled={mergeLd}
                    style={{ fontSize:11,padding:"5px 12px",borderRadius:8,border:"1px solid rgba(100,80,180,0.3)",background:"var(--subtle-bg)",color:"#4e429a",cursor:"pointer" }}>
                    {mergeLd ? <Loader2 size={11} style={{animation:"spin 1s linear infinite"}} /> : `${sel.length}件を統合`}
                  </button>
                )}
              </div>
              {minutes.map((m, i) => (
                <div key={m.id} style={{ borderBottom: i < minutes.length-1 ? "1px solid rgba(100,80,180,0.07)" : "none" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 18px" }}>
                    <input type="checkbox" checked={sel.includes(m.id)}
                      onChange={e => setSel(p => e.target.checked ? [...p, m.id] : p.filter(id => id !== m.id))} />
                    <button onClick={() => setOpenId(openId === m.id ? null : m.id)}
                      style={{ flex:1,background:"transparent",border:"none",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,fontWeight:600,color:"#2d2640" }}>{m.title || "無題の議事録"}</div>
                        <div style={{ fontSize:11,color:"#8a82a8" }}>{new Date(m.created_at).toLocaleString("ja-JP")}</div>
                      </div>
                      {openId === m.id ? <ChevronUp size={14} style={{color:"#8a82a8"}} /> : <ChevronDown size={14} style={{color:"#8a82a8"}} />}
                    </button>
                    <button onClick={() => extractTasks(m.output_text || m.input_text || "", m.id)}
                      style={{ fontSize:11,padding:"4px 10px",borderRadius:8,border:"1px solid rgba(34,197,94,0.3)",background:"#edfbf4",color:"#166534",cursor:"pointer",flexShrink:0 }}>
                      タスク抽出
                    </button>
                    <button onClick={async () => { if (supabase) { await supabase.from("minutes").delete().eq("id", m.id); loadMinutes() } }}
                      style={{ width:28,height:28,borderRadius:8,background:"#fef2f2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#f87171",flexShrink:0 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {openId === m.id && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
                        <div style={{ padding:"0 18px 16px" }}>
                          <pre style={{ fontSize:12,color:"#2d2640",lineHeight:1.85,whiteSpace:"pre-wrap",background:"var(--subtle-bg)",padding:14,borderRadius:12,fontFamily:"inherit",margin:0 }}>
                            {m.output_text || m.input_text}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ タスク管理タブ ══════════════ */}
      {tab === "tasks" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {/* 表示切替・役職フィルター */}
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
            {(["matrix","list","timeline"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ fontSize:12,padding:"6px 14px",borderRadius:999,border:`1px solid ${view===v?"rgba(107,92,184,0.4)":"rgba(100,80,180,0.15)"}`,background:view===v?"#f5f2fd":"#fff",color:view===v?"#4e429a":"#6b6080",cursor:"pointer",fontWeight:view===v?600:400 }}>
                {v==="matrix"?"🔲 四象限":v==="list"?"📋 リスト":"📅 タイムライン"}
              </button>
            ))}
            <div style={{ marginLeft:"auto",display:"flex",gap:5,flexWrap:"wrap" }}>
              {Object.entries(ROLE_COLORS).map(([role, rc]) => (
                <button key={role} onClick={() => setSelRoles(p => p.includes(role) ? p.filter(r=>r!==role) : [...p,role])}
                  style={{ fontSize:11,padding:"4px 10px",borderRadius:999,border:`1px solid ${rc.border}`,background:selRoles.includes(role)?rc.bg:"#fff",color:rc.text,cursor:"pointer",fontWeight:selRoles.includes(role)?600:400,transition:"all 0.15s" }}>
                  {rc.label}
                </button>
              ))}
            </div>
          </div>

          {/* タスク追加 */}
          <div style={{ ...card,padding:14,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()}
              placeholder="タスクを追加... (Enterで追加)"
              style={{ flex:1,minWidth:180,border:"1px solid rgba(100,80,180,0.2)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#1e1a2e",background:"var(--subtle-bg)",outline:"none",fontFamily:"inherit" }} />
            <select value={newRole} onChange={e => setNewRole(e.target.value)}
              style={{ border:"1px solid rgba(100,80,180,0.2)",borderRadius:10,padding:"8px 10px",fontSize:12,color:"#1e1a2e",background:"var(--subtle-bg)",outline:"none" }}>
              {Object.entries(ROLE_COLORS).map(([r,rc]) => <option key={r} value={r}>{rc.label}</option>)}
            </select>
            <select value={newCat} onChange={e => setNewCat(e.target.value)}
              style={{ border:"1px solid rgba(100,80,180,0.2)",borderRadius:10,padding:"8px 10px",fontSize:12,color:"#1e1a2e",background:"var(--subtle-bg)",outline:"none" }}>
              {TASK_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={addTask}
              style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,background:"linear-gradient(135deg,#6b5cb8,#a78bfa)",color:"white",fontSize:12,fontWeight:600,border:"none",cursor:"pointer" }}>
              <Plus size={14} />追加
            </button>
          </div>

          {/* 四象限マトリクス */}
          {view === "matrix" && (
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {(["q1","q2","q3","q4"] as const).map(q => {
                const qd    = QUAD[q]
                const qTasks = filteredTasks.filter(t => quad(t.urgency, t.importance) === q && !t.done)
                const done   = filteredTasks.filter(t => quad(t.urgency, t.importance) === q && t.done)
                return (
                  <div key={q} style={{ background:qd.bg,borderRadius:14,padding:14,border:`1px solid ${qd.border}` }}>
                    <div style={{ fontSize:10,fontWeight:700,color:qd.color,marginBottom:2 }}>{qd.label}</div>
                    <div style={{ fontSize:13,fontWeight:600,color:qd.color,marginBottom:10 }}>{qd.sub}</div>
                    <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                      {qTasks.length === 0 && done.length === 0 ? (
                        <div style={{ fontSize:12,color:"#9ca3af",textAlign:"center",padding:"12px 0" }}>タスクなし</div>
                      ) : qTasks.map(t => {
                        const rc = ROLE_COLORS[t.role_level] || ROLE_COLORS.staff
                        return (
                          <div key={t.id} style={{ background:"rgba(255,255,255,0.85)",borderRadius:10,padding:"9px 11px",border:`1px solid ${qd.border}44` }}>
                            <div style={{ display:"flex",alignItems:"flex-start",gap:8 }}>
                              <input type="checkbox" checked={t.done} onChange={e => toggleTask(t.id, e.target.checked)} style={{ marginTop:3,flexShrink:0 }} />
                              <div style={{ flex:1,minWidth:0 }}>
                                <div style={{ fontSize:12,fontWeight:600,color:"#1e1a2e",lineHeight:1.5 }}>{t.title}</div>
                                <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginTop:4 }}>
                                  <span style={{ fontSize:10,padding:"1px 6px",borderRadius:999,background:rc.bg,color:rc.text,border:`1px solid ${rc.border}` }}>{rc.label}</span>
                                  {t.due_date && <span style={{ fontSize:10,color:"#8a82a8" }}>{toJST(t.due_date)}</span>}
                                  {t.assignee && <span style={{ fontSize:10,color:"#8a82a8" }}>@{t.assignee}</span>}
                                </div>
                              </div>
                              <button onClick={() => delTask(t.id)} style={{ width:22,height:22,borderRadius:6,background:"#fef2f2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#f87171",flexShrink:0 }}>
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {done.length > 0 && (
                        <div style={{ fontSize:11,color:"#9ca3af",marginTop:4,paddingTop:6,borderTop:`1px dashed ${qd.border}` }}>
                          完了済み {done.length}件
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* リスト表示 */}
          {view === "list" && (
            <div style={{ ...card,padding:0,overflow:"hidden" }}>
              {filteredTasks.length === 0 ? (
                <div style={{ padding:40,textAlign:"center",fontSize:13,color:"#8a82a8" }}>タスクがありません</div>
              ) : filteredTasks.map((t,i) => {
                const rc = ROLE_COLORS[t.role_level] || ROLE_COLORS.staff
                const qd = QUAD[quad(t.urgency, t.importance)]
                return (
                  <div key={t.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<filteredTasks.length-1?"1px solid rgba(100,80,180,0.07)":"none",opacity:t.done?0.5:1 }}>
                    <input type="checkbox" checked={t.done} onChange={e => toggleTask(t.id, e.target.checked)} />
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:"#1e1a2e",textDecoration:t.done?"line-through":"none",lineHeight:1.5 }}>{t.title}</div>
                      <div style={{ display:"flex",gap:5,marginTop:4,flexWrap:"wrap" }}>
                        <span style={{ fontSize:10,padding:"1px 6px",borderRadius:999,background:rc.bg,border:`1px solid ${rc.border}`,color:rc.text }}>{rc.label}</span>
                        <span style={{ fontSize:10,padding:"1px 6px",borderRadius:999,background:qd.bg,color:qd.color }}>{qd.label}</span>
                        <span style={{ fontSize:10,padding:"1px 6px",borderRadius:999,background:"var(--subtle-bg)",color:"#4e429a" }}>{TASK_CATS.find(c=>c.id===t.category)?.label}</span>
                        {t.due_date && <span style={{ fontSize:10,color:"#8a82a8" }}>期限: {toJST(t.due_date)}</span>}
                        {t.assignee && <span style={{ fontSize:10,color:"#8a82a8" }}>担当: {t.assignee}</span>}
                      </div>
                    </div>
                    <button onClick={() => delTask(t.id)} style={{ width:26,height:26,borderRadius:8,background:"#fef2f2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#f87171",flexShrink:0 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* タイムライン表示 */}
          {view === "timeline" && (
            <div style={{ ...card,padding:18 }}>
              <div style={{ fontSize:13,fontWeight:600,color:"#2d2640",marginBottom:14 }}>📅 期限別タイムライン</div>
              {(() => {
                const withDate = filteredTasks.filter(t=>t.due_date&&!t.done).sort((a,b)=>(a.due_date||"")>(b.due_date||"")?1:-1)
                const noDue    = filteredTasks.filter(t=>!t.due_date&&!t.done)
                if (!withDate.length && !noDue.length) return <div style={{ textAlign:"center",color:"#8a82a8",fontSize:13,padding:20 }}>期限付きタスクがありません</div>
                let lastDate = ""
                return (
                  <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                    {withDate.map(t => {
                      const rc = ROLE_COLORS[t.role_level] || ROLE_COLORS.staff
                      const showDate = t.due_date !== lastDate
                      if (showDate) lastDate = t.due_date || ""
                      return (
                        <div key={t.id}>
                          {showDate && <div style={{ fontSize:12,fontWeight:700,color:"#4e429a",padding:"10px 0 5px" }}>{toJST(t.due_date)}</div>}
                          <div style={{ display:"flex",gap:10,alignItems:"center",padding:"8px 12px",background:"var(--subtle-bg)",borderRadius:10,marginBottom:3 }}>
                            <input type="checkbox" checked={t.done} onChange={e => toggleTask(t.id, e.target.checked)} />
                            <div style={{ fontSize:13,color:"#1e1a2e",flex:1,lineHeight:1.5 }}>{t.title}</div>
                            <span style={{ fontSize:10,padding:"1px 6px",borderRadius:999,background:rc.bg,border:`1px solid ${rc.border}`,color:rc.text,flexShrink:0 }}>{rc.label}</span>
                            <button onClick={() => delTask(t.id)} style={{ width:22,height:22,borderRadius:6,background:"#fef2f2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#f87171",flexShrink:0 }}>
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {noDue.length > 0 && (
                      <>
                        <div style={{ fontSize:12,fontWeight:700,color:"#8a82a8",padding:"10px 0 5px" }}>期限なし</div>
                        {noDue.map(t => {
                          const rc = ROLE_COLORS[t.role_level] || ROLE_COLORS.staff
                          return (
                            <div key={t.id} style={{ display:"flex",gap:10,alignItems:"center",padding:"8px 12px",background:"var(--subtle-bg)",borderRadius:10,marginBottom:3 }}>
                              <input type="checkbox" checked={t.done} onChange={e => toggleTask(t.id, e.target.checked)} />
                              <div style={{ fontSize:13,color:"#1e1a2e",flex:1 }}>{t.title}</div>
                              <span style={{ fontSize:10,padding:"1px 6px",borderRadius:999,background:rc.bg,border:`1px solid ${rc.border}`,color:rc.text,flexShrink:0 }}>{rc.label}</span>
                              <button onClick={() => delTask(t.id)} style={{ width:22,height:22,borderRadius:6,background:"#fef2f2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#f87171",flexShrink:0 }}>
                                <Trash2 size={10} />
                              </button>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ スタッフタブ ══════════════ */}
      {tab === "staff" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ ...card,padding:16,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
            <input value={staffName} onChange={e => setStaffName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addStaff()}
              placeholder="スタッフ名（Enterで追加）"
              style={{ flex:1,minWidth:140,border:"1px solid rgba(100,80,180,0.2)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#1e1a2e",background:"var(--subtle-bg)",outline:"none",fontFamily:"inherit" }} />
            <select value={staffRole} onChange={e => setStaffRole(e.target.value)}
              style={{ border:"1px solid rgba(100,80,180,0.2)",borderRadius:10,padding:"8px 10px",fontSize:12,color:"#1e1a2e",background:"var(--subtle-bg)",outline:"none" }}>
              {Object.entries(ROLE_COLORS).map(([r,rc]) => <option key={r} value={r}>{rc.label}</option>)}
            </select>
            <button onClick={addStaff}
              style={{ padding:"8px 16px",borderRadius:10,background:"linear-gradient(135deg,#6b5cb8,#a78bfa)",color:"white",fontSize:12,fontWeight:600,border:"none",cursor:"pointer" }}>
              追加
            </button>
          </div>
          <div style={{ ...card,padding:0,overflow:"hidden" }}>
            {staff.length === 0 ? (
              <div style={{ padding:40,textAlign:"center",fontSize:13,color:"#8a82a8" }}>スタッフが登録されていません<br/><span style={{fontSize:11}}>タスクの担当者候補として登録できます</span></div>
            ) : staff.map((s,i) => {
              const rc = ROLE_COLORS[s.role] || ROLE_COLORS.staff
              return (
                <div key={s.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<staff.length-1?"1px solid rgba(100,80,180,0.07)":"none" }}>
                  <div style={{ width:38,height:38,borderRadius:"50%",background:rc.bg,border:`1.5px solid ${rc.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:rc.text,flexShrink:0 }}>
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:"#1e1a2e" }}>{s.name}</div>
                    <span style={{ fontSize:11,padding:"1px 8px",borderRadius:999,background:rc.bg,border:`1px solid ${rc.border}`,color:rc.text }}>{rc.label}</span>
                  </div>
                  <button onClick={() => delStaff(s.id)} style={{ width:28,height:28,borderRadius:8,background:"#fef2f2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#f87171" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
