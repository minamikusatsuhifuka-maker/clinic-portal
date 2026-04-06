"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, User } from "lucide-react"
import { useInsightStore } from "@/store/useInsightStore"
import { useAchievementStore } from "@/store/useAchievementStore"
import { useKnowledgeStore } from "@/store/useKnowledgeStore"

const card: React.CSSProperties = {
  background: "var(--surface-bg, #fff)",
  borderRadius: 16,
  border: "0.5px solid var(--border-color, rgba(26,30,46,0.1))",
}

interface DiagnosisResult {
  summary: string
  strengths: { title: string; description: string; evidence: string }[]
  challenges: { title: string; description: string; suggestion: string }[]
  recommendations: { theme: string; reason: string; action: string }[]
  message: string
  score: { growth: number; contribution: number; selfawareness: number; teamwork: number }
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary, #6b7280)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "var(--subtle-bg, #edeae4)", borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 3 }}
        />
      </div>
    </div>
  )
}

export default function DiagnosisPage({ user }: { user: { name: string; role: string } }) {
  const { insights } = useInsightStore()
  const { gratitudeCards } = useAchievementStore()
  const { getActiveContext } = useKnowledgeStore()

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [status, setStatus] = useState("")
  const [expandedSection, setExpandedSection] = useState<string | null>("strengths")
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // 蓄積データを収集
  const collectData = () => {
    const parts: string[] = []

    // 気づきノート
    const myInsights = insights.filter(i => i.authorName === user.name || i.isShared)
    if (myInsights.length > 0) {
      parts.push(`【気づきノート（${myInsights.length}件）】`)
      myInsights.slice(0, 10).forEach(i => {
        parts.push(`・学び:「${i.learning}」/ 実践:「${i.practice}」/ 結果:「${i.result || "未記録"}」`)
      })
    }

    // もらった感謝カード
    const receivedCards = gratitudeCards.filter(c => c.toName === user.name)
    if (receivedCards.length > 0) {
      parts.push(`\n【受け取った感謝カード（${receivedCards.length}件）】`)
      receivedCards.slice(0, 5).forEach(c => {
        parts.push(`・「${c.message}」（${c.fromName}より）`)
      })
    }

    // 送った感謝カード
    const sentCards = gratitudeCards.filter(c => c.fromName === user.name)
    if (sentCards.length > 0) {
      parts.push(`\n【送った感謝カード（${sentCards.length}件）】`)
      parts.push(`${sentCards.length}件の感謝を仲間に送っています`)
    }

    if (parts.length === 0) {
      parts.push("データがまだ蓄積されていません。気づきノートやコーチング記録を使い始めると、より精度の高い診断ができます。")
    }

    return parts.join("\n")
  }

  const runDiagnosis = async () => {
    setLoading(true)
    setStatus("データを収集してAIが分析中...")
    try {
      const data = collectData()
      const knowledgeContext = getActiveContext()

      const res = await fetch("/api/staff-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user.name,
          userRole: user.role,
          data,
          knowledgeContext,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setResult(json.diagnosis)
      setLastUpdated(new Date().toLocaleString("ja-JP"))
      setStatus("")
    } catch (e) {
      setStatus(`エラー: ${e}`)
    } finally {
      setLoading(false)
    }
  }

  const dataCount = insights.filter(i => i.authorName === user.name || i.isShared).length +
    gratitudeCards.filter(c => c.toName === user.name || c.fromName === user.name).length

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>

      {/* ヘッダー */}
      <div style={{ ...card, padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f7f1e8", border: "1.5px solid #b8975a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            <User size={22} color="#b8975a" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary, #1e2230)" }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary, #6b7280)", marginTop: 2 }}>{user.role} · 蓄積データ {dataCount}件</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary, #6b7280)", lineHeight: 1.7, marginBottom: 14 }}>
          気づきノート・感謝カードなどの蓄積データをAIが分析し、
          あなたの強み・成長課題・推奨学習テーマをレポートします。
        </div>
        {dataCount === 0 && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff8ec", border: "0.5px solid #fde68a", fontSize: 12, color: "#b45309", marginBottom: 14 }}>
            💡 気づきノートや感謝カードを記入すると、より精度の高い診断ができます
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={runDiagnosis}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, background: "#1e2230", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <><RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} />分析中...</>
              : <><Sparkles size={15} />AIで強み・成長課題を診断する</>}
          </button>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "var(--text-secondary, #6b7280)" }}>最終診断: {lastUpdated}</span>
          )}
        </div>
        {status && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#0f6e56", padding: "7px 12px", background: "#e1f5ee", borderRadius: 8 }}>
            {status}
          </div>
        )}
      </div>

      {/* 診断結果 */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* スコア */}
            <div style={{ ...card, padding: "20px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #1e2230)", marginBottom: 16 }}>📊 成長スコア</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                <ScoreBar label="成長意欲" value={result.score.growth} color="#0f6e56" />
                <ScoreBar label="チーム貢献" value={result.score.contribution} color="#b8975a" />
                <ScoreBar label="自己認識" value={result.score.selfawareness} color="#5f4ba8" />
                <ScoreBar label="チームワーク" value={result.score.teamwork} color="#993556" />
              </div>
            </div>

            {/* サマリー */}
            <div style={{ ...card, padding: "20px 24px", borderLeft: "3px solid #b8975a" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#b8975a", marginBottom: 10 }}>✨ 総合所見</div>
              <p style={{ fontSize: 14, color: "var(--text-primary, #1e2230)", lineHeight: 1.85, margin: 0 }}>{result.summary}</p>
            </div>

            {/* 強み・成長課題・推奨学習テーマ */}
            {[
              { key: "strengths", label: "💪 あなたの強み", color: "#0f6e56", bg: "#e1f5ee" },
              { key: "challenges", label: "🌱 成長の機会", color: "#5f4ba8", bg: "#f5f2fd" },
              { key: "recommendations", label: "📚 推奨学習テーマ", color: "#b8975a", bg: "#f7f1e8" },
            ].map(({ key, label, color, bg }) => (
              <div key={key} style={{ ...card, overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                  style={{ width: "100%", padding: "14px 20px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #1e2230)" }}>{label}</span>
                  {expandedSection === key ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
                </button>
                <AnimatePresence>
                  {expandedSection === key && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ padding: "0 20px 18px", display: "flex", flexDirection: "column", gap: 12, borderTop: "0.5px solid var(--border-color, rgba(26,30,46,0.08))" }}>
                        {key === "strengths" && result.strengths.map((s, i) => (
                          <div key={i} style={{ background: bg, borderRadius: 12, padding: "14px 16px", marginTop: i === 0 ? 14 : 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 6 }}>{s.title}</div>
                            <p style={{ fontSize: 13, color: "var(--text-primary, #1e2230)", lineHeight: 1.75, margin: "0 0 6px" }}>{s.description}</p>
                            <div style={{ fontSize: 11, color, opacity: 0.8 }}>根拠: {s.evidence}</div>
                          </div>
                        ))}
                        {key === "challenges" && result.challenges.map((c, i) => (
                          <div key={i} style={{ background: bg, borderRadius: 12, padding: "14px 16px", marginTop: i === 0 ? 14 : 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 6 }}>{c.title}</div>
                            <p style={{ fontSize: 13, color: "var(--text-primary, #1e2230)", lineHeight: 1.75, margin: "0 0 8px" }}>{c.description}</p>
                            <div style={{ fontSize: 12, color, background: "#fff", borderRadius: 8, padding: "8px 12px", border: `0.5px solid ${color}33` }}>
                              💡 アクション: {c.suggestion}
                            </div>
                          </div>
                        ))}
                        {key === "recommendations" && result.recommendations.map((r, i) => (
                          <div key={i} style={{ background: bg, borderRadius: 12, padding: "14px 16px", marginTop: i === 0 ? 14 : 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 6 }}>📖 {r.theme}</div>
                            <p style={{ fontSize: 13, color: "var(--text-primary, #1e2230)", lineHeight: 1.75, margin: "0 0 8px" }}>{r.reason}</p>
                            <div style={{ fontSize: 12, color, background: "#fff", borderRadius: 8, padding: "8px 12px", border: `0.5px solid ${color}33` }}>
                              今週のアクション: {r.action}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* 院長メッセージ */}
            <div style={{ ...card, padding: "20px 24px", background: "#f7f1e8", border: "0.5px solid #e8d5a0" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#b8975a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👑</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#b8975a", marginBottom: 6 }}>楠葉院長より</div>
                  <p style={{ fontSize: 14, color: "#1e2230", lineHeight: 1.9, margin: 0, fontStyle: "italic" }}>{result.message}</p>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
