import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
export async function POST(req: NextRequest) {
  try {
    const { text, title } = await req.json()
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(`あなたは南草津皮フ科クリニックの議事録作成AIです。
以下の書き起こしテキストから正式な議事録を作成してください。

# ${title || "議事録"}
日時: ${new Date().toLocaleString("ja-JP")}

## 参加者
（書き起こしから判断）

## 議題・報告事項
（箇条書きで整理）

## 決定事項
（箇条書き）

## タスク・アクションアイテム
（担当者・期限を含めて箇条書き）

## 次回予定
（あれば）

【書き起こし】
${text}`)
    return NextResponse.json({ ok: true, output: result.response.text() })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
