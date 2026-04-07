"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface GuidePageProps {
  userRole: "staff" | "manager" | "admin"
}

const SECTIONS = [
  {
    icon: "🏥", title: "CarePortalって何？", color: "#b8975a",
    content: `南草津皮フ科のスタッフ専用アプリです。仕事に必要なことが全部ここに集まっています。

・📋 業務マニュアルを見る
・✅ 今日やることを確認する
・🤖 AIに相談する
・📈 自分の成長を記録する

スマホでもパソコンでも使えます。`,
  },
  {
    icon: "🔑", title: "ログイン方法", color: "#3b82f6",
    content: `1. ブラウザで https://clinic-portal-tau.vercel.app を開く
2. 「スタッフとしてログイン」ボタンをクリック

※Googleアカウントでのログインも可能です`,
  },
  {
    icon: "⭐", title: "毎日使う機能 TOP5", color: "#eab308",
    content: `① ダッシュボード
毎朝出勤したらまずここを確認。今日のチェックリスト・リスク案件・院長メッセージが見られます。

② 業務マニュアル
「どうするんだっけ？」と迷ったらここ。

③ Air（AIアシスタント）
画面右下の🤖アイコンから何でも相談できます。

④ ヒヤリハット共有
ミスしそうになったことを匿名で報告。

⑤ 役職ガイド
自分の職種の業務範囲を確認できます。`,
  },
  {
    icon: "📈", title: "成長を記録する機能", color: "#22c55e",
    content: `・📋 OJTチェックリスト
3ヶ月/6ヶ月/12ヶ月フェーズで成長を確認

・🗺️ スキルマップ
自分のスキルをレーダーチャートで可視化

・🎯 個人目標MBO
四半期ごとに目標を設定してAirがサポート

・🚀 キャリアパス設計
3年後のゴールからAirがロードマップを作成

・💪 強み・成長診断
AIがあなたの強みと課題を分析`,
  },
  {
    icon: "🎓", title: "練習・学習の機能", color: "#a855f7",
    content: `・🎭 AIロールプレイ
Airが患者役になって接客練習ができます。
  - 初診受付（初級）
  - 会計への疑問（中級）
  - 待ち時間クレーム（上級）

・📝 知識確認テスト
マニュアルからAIが4択クイズを自動生成します。`,
  },
  {
    icon: "🤝", title: "チームと関わる機能", color: "#f472b6",
    content: `・📊 エンゲージメントサーベイ
毎月5問の匿名アンケート（1〜2分）

・🏆 MVP表彰
頑張ったスタッフを匿名で推薦・毎月1日に発表

・💬 気づきノート
学びや気づきをチームで共有`,
  },
  {
    icon: "❓", title: "困ったときは", color: "#ef4444",
    content: `1. まずAir（右下🤖）に相談
2. 次に業務マニュアルを確認
3. それでも解決しなければ先輩・マネージャーに相談`,
  },
]

const card: React.CSSProperties = {
  background: "var(--surface-bg)", borderRadius: 16,
  border: "1px solid rgba(100,80,180,0.13)",
  boxShadow: "0 1px 4px rgba(60,40,120,0.07)",
}

export default function GuidePage({ userRole }: GuidePageProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>📖 CarePortal 使い方ガイド</h2>
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>新人スタッフ向け・入職初日から使えます</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SECTIONS.map((s, i) => {
          const isOpen = openIdx === i
          return (
            <motion.div key={i} layout style={{ ...card, overflow: "hidden" }}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 18px", border: "none", background: "transparent",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{s.title}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
                  background: `${s.color}15`, color: s.color, flexShrink: 0,
                }}>
                  {i + 1}/{SECTIONS.length}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} style={{ color: "var(--text-secondary)" }} />
                </motion.div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      padding: "0 18px 16px 52px",
                      fontSize: 13, lineHeight: 1.8,
                      color: "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                    }}>
                      {s.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* フッターメッセージ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          marginTop: 24, padding: "20px 24px", borderRadius: 16,
          background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
          border: "1px solid rgba(184,151,90,0.3)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "#92400e", lineHeight: 1.7 }}>
          CarePortalはあなたの成長をサポートするツールです。
          <br />
          毎日少しずつ使って、自分のペースで成長していきましょう！🌸
        </div>
      </motion.div>
    </div>
  )
}
