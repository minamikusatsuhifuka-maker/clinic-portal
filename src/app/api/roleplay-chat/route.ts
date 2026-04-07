import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  const { messages, system_prompt } = await req.json()
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Gemini APIキーが設定されていません。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const enhancedPrompt = `${system_prompt}

【演技の指針】
- スタッフの対応が丁寧で共感的なら、徐々に態度が和らぎます
- スタッフの対応が事務的・冷たいなら、不満が増します
- 医療的に不正確な説明をされたら疑問を呈します
- 自然な口語で話してください（敬語・タメ口を患者像に合わせる）
- 1回の発言は1〜2文、50文字以内にしてください
- 患者として一貫したキャラクターを維持してください
- 絶対に「患者役をしています」などと明かさないでください`

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const history = [
    { role: "user" as const, parts: [{ text: enhancedPrompt }] },
    { role: "model" as const, parts: [{ text: "わかりました。患者役を演じます。" }] },
    ...messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: (m.role === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: m.content }],
    })),
  ]

  const chat = model.startChat({ history })
  const lastMessage = messages[messages.length - 1]

  // ストリーミングレスポンス
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(lastMessage.content)
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) controller.enqueue(new TextEncoder().encode(text))
        }
      } catch {
        controller.enqueue(new TextEncoder().encode("すみません、ちょっと聞き取れなかったのですが…"))
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
