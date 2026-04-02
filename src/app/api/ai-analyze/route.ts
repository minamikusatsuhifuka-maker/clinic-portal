import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const { reports } = await req.json()
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({
        ok: false,
        analysis: "Gemini APIキーが未設定です。",
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const reportText = reports
      .map((r: { tag: string; body: string }) => `【${r.tag}】${r.body}`)
      .join("\n")

    const prompt = `以下はクリニックスタッフが報告したヒヤリハット事例です。
パターンを分析し、最優先で取り組むべき改善提案を3点、箇条書きで簡潔に示してください（各50文字以内）。

${reportText}`

    const result = await model.generateContent(prompt)
    const analysis = result.response.text()

    return NextResponse.json({ ok: true, analysis })
  } catch (e) {
    return NextResponse.json({ ok: false, analysis: "分析に失敗しました。" }, { status: 500 })
  }
}
