import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(`以下のテキストを皮膚科・美容皮膚科の専門用語に合わせて誤字・誤認識を修正してください。
修正後のテキストのみ返答してください。
専門用語例：レーザー治療、ヒアルロン酸、ボトックス、ポテンツァ、フォトフェイシャル、ケミカルピーリング、水光注射、レセプト、インシデント
テキスト:
${text}`)
    return NextResponse.json({ ok: true, output: result.response.text() })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
