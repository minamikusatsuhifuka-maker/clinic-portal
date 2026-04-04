import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get("audio") as File
    if (!audio) return NextResponse.json({ error: "音声ファイルがありません" }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY が設定されていません" }, { status: 500 })

    // Whisper API に送信
    const whisperForm = new FormData()
    whisperForm.append("file", audio, audio.name || "audio.webm")
    whisperForm.append("model", "whisper-1")
    whisperForm.append("language", "ja")
    whisperForm.append("prompt", "南草津皮フ科 皮膚科 美容皮膚科 レーザー ヒアルロン酸 ボトックス ポテンツァ フォトフェイシャル ケミカルピーリング 水光注射 レセプト インシデント ヒヤリハット")

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, text: data.text ?? "" })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
