import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const { messages, currentPage, userRole } = await req.json()
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ ok: false, answer: "Gemini APIキーが設定されていません。" })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const roleLabel =
      userRole === "admin" ? "院長（管理者）" :
      userRole === "manager" ? "マネージャー" : "スタッフ"

    const pageLabel: Record<string, string> = {
      home: "ダッシュボード",
      risk: "リスク管理",
      manual: "業務マニュアル",
      matrix: "役割マトリクス",
      confidence: "4つの自信",
      nearmiss: "ヒヤリハット共有",
      admin: "管理者ダッシュボード",
    }

    const systemPrompt = `あなたは南草津皮フ科クリニックのスタッフをサポートする専任AIアシスタント「ケアちゃん」です。

【クリニック情報】
- クリニック名：南草津皮フ科
- 院長：楠葉展大 先生
- 診療内容：一般皮膚科 + 自費美容皮膚科
- 理念：スタッフ全員が安心・安全・成長できる職場づくり

【現在の状況】
- 話しかけているスタッフの役職：${roleLabel}
- 現在見ているページ：${pageLabel[currentPage] || currentPage}

【あなたの役割】
1. 業務の流れを一緒に考える（壁打ち・相談）
2. リスク対応の手順を確認しながら一緒に進める
3. 新人スタッフへのOJTサポート（質問に丁寧に答える）
4. マニュアル・チェックリストの作成支援
5. 美容皮膚科のマーケティング・ブランディング相談
6. 4つの自信（会社・職業・商品・自分）を高めるアドバイス

【回答ルール】
- 必ず日本語で答える
- 新人スタッフには特に丁寧に、ステップごとに説明する
- 管理者・院長には経営・マーケティング視点も加える
- 回答は300文字以内で簡潔に（長くなる場合は「続きを聞きますか？」と確認）
- 医療的な判断が必要な場合は必ず「院長に確認してください」と添える
- 語尾は「〜ですよ」「〜しましょう」など親しみやすい表現で
- 絵文字を適度に使って読みやすくする`

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "はい、南草津皮フ科専任AIアシスタントの「ケアちゃん」です🌸 どんなことでもお気軽にご相談ください！" }] },
        ...messages.slice(0, -1).map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
      ],
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    const answer = result.response.text()

    return NextResponse.json({ ok: true, answer })
  } catch (e) {
    console.error("AI chat error:", e)
    return NextResponse.json({ ok: false, answer: "エラーが発生しました。もう一度お試しください。" }, { status: 500 })
  }
}
