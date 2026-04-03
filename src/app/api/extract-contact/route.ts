import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 })

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf"

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      {
        text: `この画像またはファイルから連絡先情報を抽出してください。
名刺・連絡先リスト・メモ・スクリーンショットなど何でも対応してください。

以下のJSON形式のみで返答してください。他のテキストは含めないでください：

{
  "contacts": [
    {
      "name": "氏名（フルネーム）",
      "company": "会社名・組織名",
      "department": "部署名（あれば）",
      "role": "役職・肩書き（あれば）",
      "phone": "電話番号（複数ある場合は最初の1つ）",
      "phone2": "電話番号2（あれば）",
      "email": "メールアドレス（あれば）",
      "address": "住所（あれば）",
      "category": "以下から最も適切なもの1つ: 医療関係/行政・官公庁/法律・法務/金融・保険/業者・サプライヤー/IT・システム/緊急・救急/その他",
      "whenToContact": "どんなときに連絡するか（画像の文脈から推測、なければ空文字）",
      "notes": "その他メモ（あれば）"
    }
  ]
}

連絡先が複数ある場合はcontacts配列に全て含めてください。
情報が読み取れない項目は空文字にしてください。`,
      },
    ])

    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: "連絡先を読み取れませんでした" }, { status: 400 })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ ok: true, contacts: parsed.contacts ?? [] })
  } catch (e) {
    console.error("Extract contact error:", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
