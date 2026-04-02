import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { riskName, level, message, type } = await req.json()
    const token = process.env.CHATWORK_API_TOKEN
    const roomId = process.env.CHATWORK_ROOM_ID

    if (!token || !roomId ||
        token === "your_chatwork_token_here" ||
        roomId === "your_room_id_here") {
      return NextResponse.json({
        ok: false,
        mock: true,
        message: "Chatwork未設定（デモモード）",
      })
    }

    let body = ""

    if (type === "risk") {
      body = [
        "[info][title]",
        `🚨 【${level}】リスク発生通知`,
        "[/title]",
        `■ 項目：${riskName}`,
        `■ 日時：${new Date().toLocaleString("ja-JP")}`,
        "",
        `${message || "初動対応フローを確認し、チェックリストに従って行動してください。"}`,
        "",
        "▶ CarePortal で確認: https://clinic-portal-tau.vercel.app",
        "[/info]",
      ].join("\n")
    } else if (type === "nearmiss") {
      body = [
        "[info][title]",
        "💬 ヒヤリハット・新規報告",
        "[/title]",
        `■ カテゴリ：${riskName}`,
        `■ 日時：${new Date().toLocaleString("ja-JP")}`,
        "",
        `${message || "新しいヒヤリハットが報告されました。内容を確認してください。"}`,
        "",
        "▶ CarePortal で確認: https://clinic-portal-tau.vercel.app",
        "[/info]",
      ].join("\n")
    } else if (type === "checklist_reminder") {
      body = [
        "[info][title]",
        "✅ 本日のチェックリスト リマインダー",
        "[/title]",
        `${new Date().toLocaleDateString("ja-JP", { month:"long", day:"numeric", weekday:"short" })}`,
        "",
        "本日のチェックリストを確認してください。",
        "未完了項目がある場合はCarePortalから完了報告をお願いします。",
        "",
        "▶ CarePortal: https://clinic-portal-tau.vercel.app",
        "[/info]",
      ].join("\n")
    } else {
      body = [
        "[info][title]",
        `📢 ${riskName || "CarePortal 通知"}`,
        "[/title]",
        `${message || ""}`,
        "",
        `${new Date().toLocaleString("ja-JP")}`,
        "[/info]",
      ].join("\n")
    }

    const res = await fetch(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages`,
      {
        method: "POST",
        headers: {
          "X-ChatWorkToken": token,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ body }),
      }
    )

    const data = await res.json()
    return NextResponse.json({ ok: res.ok, data })
  } catch (e) {
    console.error("Chatwork error:", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
