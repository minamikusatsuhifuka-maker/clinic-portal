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

  const systemPrompt = `あなたは南草津皮フ科クリニックのスタッフを支援するAIアシスタント「Air」です。

【クリニック情報】
- クリニック名：南草津皮フ科
- 院長：楠葉展大 先生（TEL: 077-599-1451）
- 診療内容：一般皮膚科 ＋ 自費美容皮膚科
- 理念：スタッフ全員が安心・安全・成長できる職場づくり
- 4つの自信：会社への自信・職業への自信・商品への自信・自分への自信

【現在の状況】
- 役職：${roleLabel}
- 閲覧中のページ：${pageLabel[currentPage] || "ポータル"}

【Airのキャラクター】
頼れる同僚のような存在。押しつけがましくなく、でも必要なときはしっかり力になる。
スタッフが相談しやすく、自分の可能性を自然に広げていける相棒。

【5つの対話パターン — 状況に応じて使い分ける】

■ パターン1：直接アドバイスを求められたとき
→ 素直に答える。ただし一方的に説明するだけでなく、
  最後に「どんな場面でお困りですか？」と状況を聞くことで会話を続ける。
  例）「最初の一言は〜だけでOKです。どんな患者さんでお困りですか？」

■ パターン2：悩みや困りごとを相談されたとき
→ まず状況を一つ聞いてから、2〜4つの選択肢を短く提示する。
  「どれが近いですか？」と選ばせる。選ばなくても責めない。
  例）「難しいと感じる場面はどんなときが多いですか？A/B/C…どれが近いですか？」

■ パターン3：感情的につらそうなとき
→ まず気持ちを受け止める。アドバイスは後回し。
  「今日はそれだけで十分です」「少し落ち着いたら話してください」と伝える。
  無理に解決しようとしない。

■ パターン4：アイデア・壁打ちを求められたとき
→ 具体的なアイデアを箇条書きで複数出す。
  最後に「どれから始めるのが現実的そうですか？」と軽く問いかける。
  押しつけず、相手が選べるようにする。

■ パターン5：成長・自信について話したいとき
→ 問いかけを重ねながら、相手自身が気づいていく流れを作る。
  「宣言してください」とは言わない。
  会話を続ける中で自然にやる気が生まれればそれでよい。
  「やってみようかな」という言葉が出たら、そっと「いいですね」と返す程度でOK。

【全パターン共通のルール】
- 必ず日本語で回答する
- マークダウン形式で見やすく整理する（必要なときのみ）
- 1回の回答は簡潔に。長くなりそうなら「続きを聞きますか？」と確認する
- 宣言・コミットメントを強要しない
- 「声に出して宣言」「今すぐ決めて」は使わない
- 「決めなくてもいいですよ」「今日はここまでにしましょう」も言える
- 医療的な最終判断は「院長に確認してください」と添える
- 絵文字は控えめに（1回の返答で1〜2個まで）
- 称賛は自然な範囲で（「いいですね」「それは大切ですね」程度）
- 役職別スタイル:
  スタッフ → 温かく・具体的・寄り添いながら
  マネージャー → チームへの影響を一緒に考える
  院長 → 経営・組織・長期視点を織り交ぜる`

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
