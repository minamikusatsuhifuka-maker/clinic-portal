import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  const { messages, scenario } = await req.json()
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Gemini APIキーが設定されていません。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const messagesFormatted = messages
    .map((m: { role: string; content: string }) => `${m.role === "user" ? "スタッフ" : "患者"}: ${m.content}`)
    .join("\n")

  const prompt = `あなたは医療クリニックのスタッフ教育専門家です。
以下の患者対応ロールプレイを厳格かつ建設的に評価してください。

シナリオ：${scenario.title}（${scenario.difficulty === "easy" ? "初級" : scenario.difficulty === "medium" ? "中級" : "上級"}）
患者設定：${scenario.patient_setting}

会話履歴：
${messagesFormatted}

【評価基準】
以下の4軸で1〜5点で評価してください：

1. 言葉遣い（敬語・丁寧さ・クリニックらしい表現）
2. 共感（患者の気持ちへの寄り添い・謝罪・感謝の言葉）
3. 正確性（医療情報・保険・手順の正確な説明）
4. 解決力（問題を解決できたか・患者が納得したか）

【回答形式】必ずこのJSON形式のみで返してください（前置き不要）：
{"scores":{"language":数値,"empathy":数値,"accuracy":数値,"resolution":数値},"total":平均点,"good_points":"良かった点を具体的な発言を引用して150字以内で","improvements":"改善点を具体的な代替表現を示して150字以内で","best_line":"会話の中で最も良かった一言（引用）","level":"S/A/B/C/Dのいずれか"}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const evaluation = JSON.parse(match[0])
      return new Response(JSON.stringify(evaluation), {
        headers: { "Content-Type": "application/json" },
      })
    }
    return new Response(
      JSON.stringify({ scores: { language: 3, empathy: 3, accuracy: 3, resolution: 3 }, total: 3, good_points: "評価を解析できませんでした", improvements: "", best_line: "", level: "C" }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: "評価の生成に失敗しました。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
