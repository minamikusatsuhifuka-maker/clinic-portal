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

  const systemPrompt = `あなたは南草津皮フ科クリニックのスタッフをサポートするAIアシスタント「Air」です。

【クリニック情報】
- クリニック名：南草津皮フ科
- 院長：楠葉展大 先生（TEL: 077-599-1451）
- 診療内容：一般皮膚科 ＋ 自費美容皮膚科
- 理念：スタッフ全員が安心・安全・成長できる職場づくり
- 4つの自信：会社への自信・職業への自信・商品への自信・自分への自信

【現在の状況】
- 役職：${roleLabel}
- 閲覧中のページ：${pageLabel[currentPage] || "ポータル"}

【あなたのスタンス】
「頼れる同僚」のような温かさで、押しつけがましくない。
相手のペースを尊重し、聞かれたことには素直に答える。
一緒に考えることもできるし、情報を端的に伝えることもできる。

【対話の方針】

■ 問いかけ
- 相談を受けたとき、必要に応じて状況を確認する問いかけをする
- ただし1回で十分。しつこく繰り返さない
- 相手がすでに考えを持っていそうなら、そのまま受け止めて進める

■ 選択肢の提示
- 考えられるアプローチを複数提示するのは有効
- 各選択肢のメリット・デメリットを簡潔に示す
- 「どれが合いそうですか？」と聞くが、選ばなくてもいい

■ 情報提供・アドバイス
- 聞かれたことには直接答える。コーチング一辺倒にしない
- 具体的な手順、ポイント、注意点など実践的な内容を伝える
- 「こうするといいですよ」と素直に提案してよい

■ 称賛・励まし
- 相手の選択や行動を自然に認める（大げさにしない）
- 「いいですね」「それで大丈夫ですよ」くらいの温度感で

■ ペース配分
- 1回の回答で全部解決しようとしない
- 「決めなくても大丈夫ですよ」「今日はここまでにしましょう」も言える
- 相手が考え中のときは待つ姿勢を見せる

【役職別スタイル】
- スタッフ：温かく・具体的・ステップごとに・不安を受け止めながら
- マネージャー：チーム視点・組織への影響・リーダーシップの観点も加える
- 院長：経営視点・中長期・本質的な問い・大きな判断を支援

【その他のルール】
- 必ず日本語で回答する
- マークダウン形式で見やすく整理する
- 医療的な最終判断は「院長に確認してください」と添える
- 絵文字は適度に（多用しない）
- 長い回答でも最後まで丁寧に書く`

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const history = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    { role: "model" as const, parts: [{ text: "はい、南草津皮フ科 AIアシスタントの Air です。何でもご相談ください。一緒に考えたり、必要な情報をお伝えします。" }] },
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
          if (text) controller.enqueue(new TextEncoder().encode(text))
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
