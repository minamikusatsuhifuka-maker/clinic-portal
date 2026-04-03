import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File
    const mode = formData.get("mode") as string ?? "transcribe"

    if (!audioFile) {
      return NextResponse.json({ error: "音声ファイルがありません" }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "Gemini APIキーが設定されていません" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const audioBytes = await audioFile.arrayBuffer()
    const audioBase64 = Buffer.from(audioBytes).toString("base64")
    const mimeType = (audioFile.type || "audio/webm") as "audio/webm" | "audio/mp4" | "audio/wav"

    if (mode === "correct") {
      const text = formData.get("text") as string
      const prompt = `以下の音声認識テキストを南草津皮フ科向けに補正してください。
固有名詞（施術名・薬品名・医療用語）を正しく修正し、文脈に合った表現にしてください。
皮膚科・美容皮膚科の専門用語（レーザー治療、ヒアルロン酸、ボトックス、ポテンツァ、
フォトフェイシャル、ケミカルピーリング、水光注射、イオン導入など）を正確に。
補正後のテキストのみ返答してください。

テキスト: ${text}`
      const result = await model.generateContent(prompt)
      return NextResponse.json({ text: result.response.text().trim() })
    }

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      },
      {
        text: `この音声を日本語でテキストに変換してください。
南草津皮フ科（一般皮膚科・自費美容皮膚科）に関する会話が多いため、以下の用語を正確に書き起こしてください。
・皮膚科用語: 湿疹、アトピー、蕁麻疹、ニキビ、乾癬、白斑
・美容施術: レーザー治療、ヒアルロン酸、ボトックス、ポテンツァ、フォトフェイシャル、ケミカルピーリング、水光注射
・業務用語: インシデント、ヒヤリハット、カルテ、レセプト、処方箋
テキストのみ返答してください。`,
      },
    ])

    const transcribed = result.response.text().trim()
    return NextResponse.json({ text: transcribed })
  } catch (e) {
    console.error("Speech-to-text error:", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
