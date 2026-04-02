import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { riskName, level } = await req.json()
    const token = process.env.CHATWORK_API_TOKEN
    const roomId = process.env.CHATWORK_ROOM_ID
    if (!token || !roomId || token === "dummy_setup_later") {
      return NextResponse.json({ ok: false, mock: true, message: "Chatwork未設定（デモモード）" })
    }
    const body = `[info][title]🚨 リスク発生通知 [${level}][/title]【${riskName}】が発生しました。\nCarePortalで初動対応フローを確認してください。\n⏰ ${new Date().toLocaleString("ja-JP")}[/info]`
    const res = await fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "X-ChatWorkToken": token, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ body }),
    })
    return NextResponse.json({ ok: res.ok })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
