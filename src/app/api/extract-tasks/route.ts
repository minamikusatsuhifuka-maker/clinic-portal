import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(`以下の議事録からタスクを抽出してJSON形式のみで返答。他のテキスト不要。

{
  "tasks": [
    {
      "title": "タスク名",
      "assignee": "担当者名（不明なら空文字）",
      "due_date": "YYYY-MM-DD（不明ならnull）",
      "urgency": 1〜4の整数（1:低〜4:最高）,
      "importance": 1〜4の整数（1:低〜4:最高）,
      "category": "operations|medical|hr|finance",
      "role_level": "director|manager|leader|staff",
      "memo": "補足（あれば）"
    }
  ]
}

urgency/importanceの基準:
- 4: 今すぐ必要/組織の根幹に関わる
- 3: 今週中/重要
- 2: 今月中/やや重要
- 1: いつか/低優先

テキスト:
${text}`)
    const raw = result.response.text().trim()
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return NextResponse.json({ ok: true, tasks: [] })
    const parsed = JSON.parse(m[0])
    return NextResponse.json({ ok: true, tasks: parsed.tasks ?? [] })
  } catch (e) {
    return NextResponse.json({ error: String(e), tasks: [] }, { status: 500 })
  }
}
