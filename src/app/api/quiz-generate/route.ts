import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  const { source_type, source_content, count } = await req.json()
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Gemini APIキーが設定されていません。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const prompt = `以下のテキストから4択クイズを${count}問作成してください。
南草津皮フ科クリニックのスタッフが業務知識を確認するためのクイズです。
テキスト：${source_content}

以下のJSON形式のみで返してください（マークダウン・前置き不要）：
[{"question":"問題文","choices":["A","B","C","D"],"answer":"A","explanation":"解説（50字以内）"}]`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const questions = JSON.parse(match[0])
      return new Response(JSON.stringify({ questions }), {
        headers: { "Content-Type": "application/json" },
      })
    }
    return new Response(
      JSON.stringify({ error: "クイズの生成に失敗しました。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: "クイズの生成に失敗しました。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
