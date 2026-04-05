import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType, filename } = await req.json()
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 })
    }
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const result = await model.generateContent([
      {
        inlineData: { data: base64, mimeType: mimeType ?? "application/pdf" }
      },
      { text: `このファイル（${filename}）のテキスト内容を全て抽出してください。フォーマットを保持しつつ、読みやすいテキストとして出力してください。余計な説明は不要です。` }
    ])
    return NextResponse.json({ ok: true, text: result.response.text() })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
