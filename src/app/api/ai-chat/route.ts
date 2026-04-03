import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  const { messages, currentPage, userRole } = await req.json()
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return new Response(
      JSON.stringify({ error: "Gemini APIキーが設定されていません。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const roleLabel =
    userRole === "admin" ? "院長（管理者）" :
    userRole === "manager" ? "マネージャー" : "スタッフ"

  const pageLabel: Record<string, string> = {
    home: "ダッシュボード", risk: "リスク管理",
    manual: "業務マニュアル", matrix: "役割マトリクス",
    confidence: "4つの自信", nearmiss: "ヒヤリハット共有",
    admin: "管理者ダッシュボード", chat: "AIアシスタント",
  }

  const systemPrompt = `あなたは南草津皮フ科クリニックのスタッフをサポートする専任AIアシスタント「ケアちゃん」です。

【クリニック情報】
- クリニック名：南草津皮フ科
- 院長：楠葉展大 先生（TEL: 077-599-1451）
- 診療内容：一般皮膚科 ＋ 自費美容皮膚科
- 理念：スタッフ全員が安心・安全・成長できる職場づくり
- 4つの自信：会社への自信・職業への自信・商品への自信・自分への自信

【現在の状況】
- 役職：${roleLabel}
- 閲覧中のページ：${pageLabel[currentPage] || "ポータル"}

【あなたの役割】
1. 業務の流れを一緒に考える（壁打ち・相談相手）
2. リスク対応の手順確認と一緒に進めるサポート
3. 新人スタッフへのOJT（丁寧なステップ説明）
4. マニュアル・チェックリストの作成支援
5. 美容皮膚科のマーケティング・ブランディング相談
6. 患者対応・接遇の改善アドバイス
7. スタッフの4つの自信を高めるコーチング

【回答スタイル】
- 必ず日本語で回答する
- 新人スタッフには特に丁寧に、ステップごとに説明する
- 管理者・院長には経営・マーケティング・リーダーシップ視点も加える
- マークダウン形式で見やすく整理する（見出し・箇条書きを活用）
- 医療的な最終判断が必要な場合は「院長に確認してください」と添える
- 共感を示しながら、具体的で実践的なアドバイスをする
- 長い回答でも最後まで丁寧に書く（途中で省略しない）`

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const history = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    { role: "model" as const, parts: [{ text: "はい、南草津皮フ科専任AIアシスタントの「ケアちゃん」として、スタッフの皆さんをサポートします。何でもご相談ください！" }] },
    ...messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: (m.role === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: m.content }],
    })),
  ]

  const chat = model.startChat({ history })
  const lastMessage = messages[messages.length - 1]

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(lastMessage.content)
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            controller.enqueue(new TextEncoder().encode(text))
          }
        }
      } catch {
        controller.enqueue(new TextEncoder().encode("エラーが発生しました。もう一度お試しください。"))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  })
}
