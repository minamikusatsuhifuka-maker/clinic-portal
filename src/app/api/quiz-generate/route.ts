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

  const prompt = `あなたは南草津皮フ科クリニックのスタッフ教育担当です。
以下のテキストから、スタッフの業務知識を確認する4択クイズを${count}問作成してください。
テキスト：${source_content}
【ルール】実践的な問題、紛らわしすぎない選択肢、解説は「なぜ正解か」を具体的に。難易度は基本問題6割・応用問題4割のバランスで。
【出力形式】JSONのみ（マークダウン・前置き不要）：
[{"question":"問題文","choices":["A","B","C","D"],"answer":"A","explanation":"解説（60字以内）"}]`

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
