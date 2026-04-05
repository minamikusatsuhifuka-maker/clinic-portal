import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const { context, prompt, format } = await req.json()
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 })
    }
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const systemPrompt = `あなたは南草津皮フ科クリニックのAIアシスタントです。
以下のクリニックの理念・教え・資料を完全に理解した上で回答してください。

【クリニックの理念・大切にしている教え】
${context}

---
${prompt}

${format === "json" ? "必ずJSON形式のみで返答してください。説明文・マークダウン記法・コードブロックは不要です。" : ""}`

    const result = await model.generateContent(systemPrompt)
    const text = result.response.text().trim()

    if (format === "json") {
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
      try {
        const parsed = JSON.parse(match?.[0] ?? text)
        return NextResponse.json({ ok: true, data: parsed })
      } catch {
        return NextResponse.json({ ok: true, data: text })
      }
    }
    return NextResponse.json({ ok: true, data: text })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
