import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const { riskName, level, question } = await req.json()
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({
        ok: false,
        answer: "Gemini APIキーが設定されていません。.env.localにNEXT_PUBLIC_GEMINI_API_KEYを設定してください。",
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `あなたはクリニック・医療機関のリスクマネジメント専門のアドバイザーです。
以下のリスクに関する質問に、実践的で分かりやすい日本語でアドバイスしてください。
回答は300文字以内で簡潔にまとめてください。

リスク項目: ${riskName}
リスクレベル: ${level}
質問: ${question || "このリスクへの初動対応で最も重要なことを教えてください。"}`

    const result = await model.generateContent(prompt)
    const answer = result.response.text()

    return NextResponse.json({ ok: true, answer })
  } catch (e) {
    console.error("Gemini API error:", e)
    return NextResponse.json({ ok: false, answer: "AI回答の取得に失敗しました。" }, { status: 500 })
  }
}
