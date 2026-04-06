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

  const prompt = `以下の患者対応ロールプレイを4軸（言葉遣い・共感・正確性・解決力）で1〜5点評価し、
良かった点と改善点を各100字以内で答えてください。
JSON形式で返してください：{"scores": {"language": N, "empathy": N, "accuracy": N, "resolution": N}, "good_points": "...", "improvements": "..."}
JSON形式のみで返してください。前置きや説明は不要です。

シナリオ: ${scenario.title}（${scenario.category}）
患者設定: ${scenario.patient_setting}

会話履歴：
${messages.map((m: { role: string; content: string }) => `${m.role === "user" ? "スタッフ" : "患者"}: ${m.content}`).join("\n")}`

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
      JSON.stringify({ scores: { language: 3, empathy: 3, accuracy: 3, resolution: 3 }, good_points: "評価を解析できませんでした", improvements: "" }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: "評価の生成に失敗しました。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
