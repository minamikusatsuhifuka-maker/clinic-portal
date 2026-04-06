import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const { userName, userRole, data, knowledgeContext } = await req.json()
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `あなたは南草津皮フ科クリニックの人材育成コンサルタントAIです。
選択理論心理学・リードマネジメント・アチーブメントの原理原則に基づいて
スタッフの成長を支援します。

${knowledgeContext ? `【クリニックの理念・大切にしている教え】\n${knowledgeContext}\n\n` : ""}

【診断対象スタッフ】
名前: ${userName}
役職: ${userRole}

【蓄積データ】
${data}

上記のデータを分析して、以下のJSON形式で診断レポートを生成してください。
他のテキストは一切含めず、JSONのみを返答してください。

{
  "summary": "スタッフ全体の印象・特徴を2〜3文で（温かく・具体的に）",
  "strengths": [
    {
      "title": "強みのタイトル",
      "description": "具体的なエピソード・行動を根拠に説明（2〜3文）",
      "evidence": "根拠となったデータの要素"
    }
  ],
  "challenges": [
    {
      "title": "成長課題のタイトル",
      "description": "課題の具体的な内容と背景（責めずに・成長の機会として表現）",
      "suggestion": "具体的な改善アクション（1つ）"
    }
  ],
  "recommendations": [
    {
      "theme": "推奨学習テーマ",
      "reason": "なぜこのテーマが今の自分に必要か",
      "action": "今週からできる具体的なアクション"
    }
  ],
  "message": "院長から一言（アチーブメントの教えを踏まえた励ましのメッセージ・3〜4文）",
  "score": {
    "growth": 1〜100の整数,
    "contribution": 1〜100の整数,
    "selfawareness": 1〜100の整数,
    "teamwork": 1〜100の整数
  }
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: "解析失敗" }, { status: 500 })
    const diagnosis = JSON.parse(match[0])
    return NextResponse.json({ ok: true, diagnosis })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
