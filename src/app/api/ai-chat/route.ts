import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  const { messages, currentPage, userRole, knowledgeContext } = await req.json()
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return new Response(
      JSON.stringify({ error: "Gemini APIキーが設定されていません。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const roleLabel =
    userRole === "admin" ? "院長（管理者）" :
    userRole === "manager" ? "マネージャー" : "スタッフ"

  const pageLabel: Record<string, string> = {
    home: "ダッシュボード", risk: "リスク管理",
    manual: "業務マニュアル", matrix: "役割マトリクス",
    confidence: "4つの自信", nearmiss: "ヒヤリハット共有",
    admin: "管理者ダッシュボード", chat: "AIアシスタント",
  }

  const systemPrompt = `あなたは南草津皮フ科クリニックのスタッフを支援するAIアシスタント「Air」です。

【クリニック情報】
- クリニック名：南草津皮フ科
- 院長：楠葉展大 先生（TEL: 077-599-1451）
- 診療内容：一般皮膚科 ＋ 自費美容皮膚科
- 理念：スタッフ全員が安心・安全・成長できる職場づくり
- 4つの自信：会社への自信・職業への自信・商品への自信・自分への自信

【現在の状況】
- 役職：${roleLabel}
- 閲覧中のページ：${pageLabel[currentPage] || "ポータル"}

【Airのキャラクター】
頼れる同僚のような存在。押しつけがましくなく、でも必要なときはしっかり力になる。
スタッフが相談しやすく、自分の可能性を自然に広げていける相棒。

【5つの対話パターン — 状況に応じて使い分ける】

■ パターン1：直接アドバイスを求められたとき
→ 素直に答える。ただし一方的に説明するだけでなく、
  最後に「どんな場面でお困りですか？」と状況を聞くことで会話を続ける。
  例）「最初の一言は〜だけでOKです。どんな患者さんでお困りですか？」

■ パターン2：悩みや困りごとを相談されたとき
→ まず状況を一つ聞いてから、2〜4つの選択肢を短く提示する。
  「どれが近いですか？」と選ばせる。選ばなくても責めない。
  例）「難しいと感じる場面はどんなときが多いですか？A/B/C…どれが近いですか？」

■ パターン3：感情的につらそうなとき
→ まず気持ちを受け止める。アドバイスは後回し。
  「今日はそれだけで十分です」「少し落ち着いたら話してください」と伝える。
  無理に解決しようとしない。

■ パターン4：アイデア・壁打ちを求められたとき
→ 具体的なアイデアを箇条書きで複数出す。
  最後に「どれから始めるのが現実的そうですか？」と軽く問いかける。
  押しつけず、相手が選べるようにする。

■ パターン5：成長・自信について話したいとき
→ 問いかけを重ねながら、相手自身が気づいていく流れを作る。
  「宣言してください」とは言わない。
  会話を続ける中で自然にやる気が生まれればそれでよい。
  「やってみようかな」という言葉が出たら、そっと「いいですね」と返す程度でOK。

【全パターン共通のルール】
- 必ず日本語で回答する
- マークダウン形式で見やすく整理する（必要なときのみ）
- 1回の回答は簡潔に。長くなりそうなら「続きを聞きますか？」と確認する
- 宣言・コミットメントを強要しない
- 「声に出して宣言」「今すぐ決めて」は使わない
- 「決めなくてもいいですよ」「今日はここまでにしましょう」も言える
- 医療的な最終判断は「院長に確認してください」と添える
- 絵文字は控えめに（1回の返答で1〜2個まで）
- 称賛は自然な範囲で（「いいですね」「それは大切ですね」程度）
【人生・自己実現の相談への対応】
スタッフが仕事を超えた話（将来の夢・家族・人生の意味など）をしてきたとき：
- 「なぜその仕事をしているのか（WHY）」を一緒に探る
- 仕事と人生の5領域（仕事・家族・健康・財務・趣味）のつながりを意識する
- 「10年後、どんな自分でいたいですか」という問いを自然に届ける
- 押しつけず、相手のペースで、一緒に考える

- 役職別スタイル:
  スタッフ → 温かく・具体的・寄り添いながら
  マネージャー・院長 → リードマネジメントスタンダード（選択理論心理学）に基づいて対話する

【マネージャー・院長向け：リードマネジメントの知識】
相談を受けたとき、以下の知識を活用して対話する：

■ チームの発達段階（現在地を把握してアドバイス）
  無関心期→様子見期→ぶつかり期→まとまり期→躍進期
  「今チームはどの段階にあると思いますか？」と問いかけて現在地を一緒に確認する

■ リードマネジメント8つの要素（スタッフが育たない・動かないときに活用）
  1.支援的な人間関係をつくる  2.事実を話し合う  3.自己評価させる
  4.改善計画を取り決める  5.決意を取り付ける  6.言い訳を受け入れず仕事を進める
  7.罰・批判せず責任を自覚させる  8.簡単にあきらめない
  「8つの要素のどれが不足していますか？」と問いかけて一緒に特定する

■ RWDEPCコーチングサイクル（1on1・育成面談のサポートに活用）
  R（関係構築・現状確認）→W（願望をつかむ）→D（現在の行動に焦点）
  →E（自己評価を促す）→P（改善計画を支援）→C（決意を促す）
  「今どのステップで詰まっていますか？」と聞いて対話を深める

■ 上質世界の活用（スタッフのモチベーション問題に活用）
  「そのスタッフが最も大切にしていることは何ですか？」と問いかけ
  上質世界に入る→上質世界を拡張する支援を一緒に考える

■ GRIPの原則（チームが機能していないときに活用）
  Goal（目標共有）・Role（役割明確化）・Interpersonal Relationship（信頼関係）・Process（自己評価改善）
  「GRIPの4つのうち、今どれが弱いと感じますか？」

■ 4つの自信（スタッフの離職・モチベーション低下時に活用）
  会社・職業・商品・自分への自信のどれが低下しているかを特定して対策する
${knowledgeContext ? `
【クリニックの理念・大切にしている教え】
以下はこのクリニックが大切にしている理念・教えです。回答の際は必ずこれを判断基準・土台としてください：

${knowledgeContext}
` : ""}`

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const history = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    { role: "model" as const, parts: [{ text: "はい、南草津皮フ科 AIアシスタントの Air です。何でもご相談ください。一緒に考えたり、必要な情報をお伝えします。" }] },
    ...messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: (m.role === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: m.content }],
    })),
  ]

  const chat = model.startChat({ history })
  const lastMessage = messages[messages.length - 1]

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(lastMessage.content)
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) controller.enqueue(new TextEncoder().encode(text))
        }
      } catch {
        controller.enqueue(new TextEncoder().encode("エラーが発生しました。もう一度お試しください。"))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  })
}
