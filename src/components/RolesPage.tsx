"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"

const card: React.CSSProperties = {
  background: "var(--surface-bg)", borderRadius: 16,
  border: "0.5px solid var(--border-color)",
  boxShadow: "0 1px 4px rgba(90,60,160,0.05)",
}

interface Role {
  id: string
  emoji: string
  title: string
  subtitle: string
  color: string
  bg: string
  darkColor: string
  coreWork: string[]
  expertConditions: string[]
  assistWork: { section: string; items: string[] }[]
  prohibited: string[]
  prohibitedNote: string
  philosophy: string
}

const ROLES: Role[] = [
  {
    id: "jimu",
    emoji: "🗂",
    title: "医療事務",
    subtitle: "クリニックの経営基盤を支える縁の下の力持ち",
    color: "#5f4ba8", bg: "#f5f2fd", darkColor: "#3a2f5a",
    coreWork: [
      "レセプト（診療報酬請求）の作成・点検・提出。査定・返戻ゼロを目指す精度",
      "保険確認・自費・混合診療の区別と適正な会計処理",
      "予約管理・患者情報の正確な入力とデータ管理",
      "電話・窓口対応における第一印象の質（クリニックの顔）",
      "診療明細の作成・領収書の発行・自費・保険の区分管理",
    ],
    expertConditions: [
      "診療報酬改定を自発的に学び、請求ミスを未然に防ぐ",
      "自費メニューの価格・内容を正確に説明できる",
      "患者の待ち時間・クレームを先読みして対応できる",
      "DX・電子カルテ・予約システムを使いこなし改善提案ができる",
      "個人情報保護・守秘義務を完璧に遵守できる",
    ],
    assistWork: [
      {
        section: "診察前の準備補助",
        items: [
          "問診票の配布・回収・電子入力（症状・既往歴・アレルギー・服薬情報の整理）",
          "保険証・医療券の確認と資格情報の入力（受給者資格の有効期限チェック）",
          "紹介状・検査データ・お薬手帳の受け取りと診察室への準備",
          "待合室の患者誘導・順番管理・診察室への呼び込み",
          "検査前の患者確認（氏名・生年月日の照合）と検査室への案内",
        ],
      },
      {
        section: "会計・処方補助",
        items: [
          "処方箋の印刷・内容確認（医師が記載した内容の転記・チェックリスト確認）",
          "院内処方がある場合の薬の準備補助（薬剤師・看護師の確認後に手渡し）",
          "処方内容・用法用量の文書による案内（口頭説明は看護師が行う）",
          "調剤薬局への処方箋送付・FAX対応",
        ],
      },
      {
        section: "電話・連絡補助",
        items: [
          "検査結果の「異常なし」の電話連絡（医師が内容を確認・指示した場合のみ）",
          "次回予約の案内・リマインダー連絡",
          "紹介先医療機関への予約・受診調整の連絡",
          "患者からの定型問い合わせへの対応（症状への医学的判断は不可）",
        ],
      },
      {
        section: "書類・記録補助",
        items: [
          "診断書・紹介状など文書の患者への手渡しと受領確認",
          "診療記録の整理・ファイリング・電子カルテへの補助入力（医師確認後）",
          "レセプト作成のための傷病名・診療行為の入力補助",
          "生活保護・公費受給者の書類管理と請求処理",
        ],
      },
    ],
    prohibited: [
      "症状への医学的アドバイス・「大丈夫ですよ」という安心させる発言",
      "薬の増減の判断・処方内容の変更対応",
      "検査結果の解釈・患者への検査値の説明",
      "採血・注射・処置への関与",
      "患者の創部・血液への直接接触",
    ],
    prohibitedNote: "「前にやったことがある」「先輩がやっていた」は理由にならない。迷ったら必ず看護師・医師に確認する。",
    philosophy: "患者が最初と最後に接するのが医療事務。「また来たい」と思わせる体験を作れるかどうかが、クリニックの継続率を決める。",
  },
  {
    id: "counselor",
    emoji: "💬",
    title: "カウンセラー",
    subtitle: "自費診療の売上と患者満足を両立させる専門家",
    color: "#993556", bg: "#fdf2f8", darkColor: "#4B1528",
    coreWork: [
      "美容施術の提案・説明・クロージング（押しつけない、でも諦めない）",
      "患者の悩み・ニーズ・予算・ライフスタイルのヒアリング",
      "施術前後のビフォーアフター管理と継続来院の促進",
      "メニュー・料金・リスクの正確でわかりやすい説明",
      "成約率・客単価・リピート率の自己管理と改善",
    ],
    expertConditions: [
      "全施術の適応・禁忌・副作用を医師レベルで理解している",
      "患者の「言葉にできない悩み」を引き出す傾聴力",
      "美容トレンド・競合クリニック・SNS動向を常にキャッチアップ",
      "成約率・客単価・リピート率を自己管理し改善できる",
      "医師・看護師と連携した患者体験の設計ができる",
    ],
    assistWork: [
      {
        section: "診察前カウンセリング補助",
        items: [
          "患者の主訴・悩み・希望を詳しくヒアリングし、医師への情報提供シートを作成",
          "施術歴・アレルギー・内服薬・既往歴を事前に聴取し診察を効率化",
          "写真撮影（ビフォー記録）・ダーモスコープ画像の補助撮影",
          "患者の肌タイプ・ライフスタイル・予算・来院頻度のヒアリング整理",
          "施術への不安・疑問を事前に引き出し、医師が的確に回答できる環境を整える",
        ],
      },
      {
        section: "施術説明・同意書補助",
        items: [
          "医師が決定した治療方針の補足説明（機序・流れ・回数・料金・ダウンタイム）",
          "インフォームドコンセント同意書の内容確認補助・疑問点の整理（署名は患者本人）",
          "施術シミュレーション資料・写真・動画を用いた視覚的な説明補助",
          "副作用・リスクの文書説明（「医師から詳しく聞いてください」の橋渡し）",
          "施術当日の注意事項（飲食制限・日焼け・スキンケア）の説明と確認",
        ],
      },
      {
        section: "施術当日の介助補助（看護師の指示のもと）",
        items: [
          "麻酔クリーム（リドカインクリーム）の塗布補助",
          "施術部位のマーキング補助（医師が確認・修正する前提）",
          "施術中の患者への声かけ・精神的サポート（不安軽減・体位の補助）",
          "施術後の冷却・圧迫補助（看護師の指示に従い実施）",
          "アフターケア物品（軟膏・テープ・日焼け止め）の準備と手渡し",
          "施術写真（アフター）の撮影・カルテへの登録補助",
        ],
      },
      {
        section: "アフターフォロー",
        items: [
          "施術後の経過確認電話・LINE連絡（副作用・異常がある場合は医師に即報告）",
          "次回施術の提案・予約・ホームケア製品の案内",
          "患者満足度の確認・口コミ・SNS投稿へのサポート",
          "長期的な治療計画の管理・次回来院タイミングの提案準備",
          "施術記録・写真のビフォーアフター管理と症例データベースへの登録補助",
        ],
      },
    ],
    prohibited: [
      "適応・禁忌の最終判断（施術できるかどうかの判断は医師のみ）",
      "副作用への医学的対応・処置",
      "注射・注入・レーザー照射・針を使う施術の実施",
      "医師を介さない治療変更の承諾・「できます」「大丈夫です」という断言",
      "患者の創部・血液への直接接触",
      "同意書の内容変更・施術範囲の独断での変更",
    ],
    prohibitedNote: "カウンセラーは「売る人」ではなく「患者の人生をより豊かにする提案者」。この意識の差が、信頼されるカウンセラーと嫌われるカウンセラーを分ける。",
    philosophy: "患者が「この人に相談してよかった」と思える体験を作ること。それが成約率とリピート率の両方を高める唯一の方法。",
  },
  {
    id: "clerk",
    emoji: "📋",
    title: "医療クラーク",
    subtitle: "医師の時間を最大化し、診療の質を上げる専門補助職",
    color: "#0F6E56", bg: "#e1f5ee", darkColor: "#04342C",
    coreWork: [
      "診察録（カルテ）の代行入力・文書作成の補助",
      "診断書・紹介状・処方箋などの書類作成補助",
      "検査結果の整理・患者呼び出し・診察室の準備",
      "医師・看護師・事務の情報ハブとしての連携調整",
      "診察中のリアルタイム入力で医師の事務負担をゼロに近づける",
    ],
    expertConditions: [
      "皮膚科・美容医療の医学知識をクラークレベルで習得（傷病名・薬剤・処置）",
      "医師が「次に何をしたいか」を先読みして準備できる",
      "電子カルテを高速・正確に操作できる",
      "守秘義務・個人情報保護への徹底した意識",
      "SOAPフォーマットを理解し、医師の口述を正確に入力できる",
    ],
    assistWork: [
      {
        section: "診察中の代行入力（メディカルクラーク業務）",
        items: [
          "医師の口述をリアルタイムで電子カルテに入力（SOAP形式：主訴・所見・評価・計画）",
          "処置内容・使用材料・手技の記録入力（医師が確認・承認するまでは下書き状態）",
          "検査オーダーの入力補助（医師の指示をシステムに反映）",
          "処方内容の入力補助（薬剤名・用量・用法・日数を医師の指示通りに入力）",
          "紹介状・診断書の下書き作成（医師が修正・署名して完成させる）",
          "患者の既往歴・アレルギー・前回処方の画面表示と医師への提示",
        ],
      },
      {
        section: "検査補助",
        items: [
          "皮膚生検・ダーモスコピー検査の器具準備（滅菌済み器具のセット・展開は看護師が行う）",
          "皮膚スタンプ・テープストリッピングなど非侵襲的検査の介助",
          "病理検体の容器準備・ラベル貼り・検査会社への搬送手配",
          "検査結果のファイリング・医師への提示準備（コメントなしで提示のみ）",
          "パッチテスト・プリックテストのシール貼り補助（実施は看護師・判定は医師）",
        ],
      },
      {
        section: "処置室・診察室の環境整備補助",
        items: [
          "処置台・診察台の準備（診療内容に合わせたセッティング）",
          "使用器具・消耗品の補充と滅菌物の在庫管理補助（開封は看護師が行う）",
          "美容施術機器の起動・パラメータ入力補助（設定は医師・看護師が承認）",
          "施術後の廃棄物処理補助・診察室のリセット",
          "滅菌有効期限の確認・期限切れ品の看護師への報告",
        ],
      },
      {
        section: "文書・情報管理",
        items: [
          "紹介状・返書・診断書・保険会社向け書類の下書き・印刷・封入",
          "他院からの画像・検査データの取り込みと整理",
          "学会・研究発表用資料の患者データ匿名化補助",
          "カンファレンス資料・症例まとめの補助作成",
        ],
      },
    ],
    prohibited: [
      "診断名の決定・処方の判断・検査結果の解釈",
      "患者への医学的説明（「正常です」「高いですね」も不可）",
      "侵襲的処置（注射・採血・切開）への直接関与",
      "滅菌済み器具の開封・清潔野への接触",
      "カルテの医師確認なしでの確定・署名",
      "血液・体液への直接接触",
    ],
    prohibitedNote: "カルテ入力は必ず「医師の確認・承認」が必要。入力した内容が医師の指示と異なる場合は即座に修正を依頼する。",
    philosophy: "医師が1日に診られる患者数は、クラークの質で変わる。医師の負担を1割減らせれば、クリニック全体の生産性が大きく向上する。",
  },
  {
    id: "nurse",
    emoji: "🩺",
    title: "看護師",
    subtitle: "医療安全と患者ケアの中核を担うプロフェッショナル",
    color: "#854F0B", bg: "#faeeda", darkColor: "#412402",
    coreWork: [
      "処置・注射・点滴・採血の安全な実施",
      "美容施術（レーザー・注入・機器操作）のアシスト・単独施術",
      "急変対応・インシデント発生時の初動",
      "患者への処置説明・アフターケア指導",
      "後輩・非資格者スタッフへの指導と業務範囲の管理",
    ],
    expertConditions: [
      "一般皮膚科の疾患（湿疹・アトピー・乾癬・皮膚腫瘍）の知識を深める",
      "美容施術の全機器を安全に操作でき、副作用を説明できる",
      "患者が「この看護師さんにやってもらいたい」と指名される接遇力",
      "後輩指導・マニュアル整備でチームの底上げをリードできる",
      "BLS・AED・急変対応を即座に実施できる",
    ],
    assistWork: [
      {
        section: "診療補助（医師の指示のもと実施）",
        items: [
          "採血・静脈注射・筋肉注射・皮下注射・点滴の実施",
          "処置（切開補助・縫合補助・ドレッシング交換）",
          "清潔操作を要する処置全般の実施（清潔野の管理を含む）",
          "医療用レーザー・エネルギー機器の照射（医師が指示・監督する場合）",
          "外用薬の塗布指導・処置後ケアの実施",
        ],
      },
      {
        section: "チーム管理・教育",
        items: [
          "非資格者スタッフの業務範囲の確認・指導・監督",
          "ヒヤリハットの収集・分析・改善提案",
          "新人スタッフへの清潔操作・感染対策の指導",
          "物品・薬剤の管理（期限・保管・廃棄）",
        ],
      },
    ],
    prohibited: [
      "医師の指示なしでの診断・処方・治療方針の変更",
      "医師の指示範囲を超えた処置の実施",
      "非資格者への医行為の「黙認」（責任者として指導義務がある）",
    ],
    prohibitedNote: "非資格者が医行為を行っているのを見て見ぬふりをすることは、看護師の責任問題となる。発見したら即座に指導・報告する。",
    philosophy: "皮膚科看護師のエキスパートは「技術」と「接遇」と「知識」の三つ揃いが必要。特に美容領域は、患者が投資する施術なので、安心感を与える力が信頼につながる。",
  },
  {
    id: "doctor",
    emoji: "👨‍⚕️",
    title: "医師",
    subtitle: "診療の質・クリニックの信頼・チームの方向性を決める",
    color: "#993C1D", bg: "#faece7", darkColor: "#4A1B0C",
    coreWork: [
      "皮膚疾患の診断・治療方針の決定・処方",
      "美容施術（注入・レーザー・手術）の安全な実施と合併症管理",
      "インフォームドコンセント（患者が理解・納得できる説明）",
      "スタッフへの医学教育・診療プロトコルの整備",
      "チームの業務範囲の最終管理者としての責任を果たす",
    ],
    expertConditions: [
      "皮膚科専門医資格の取得・維持（学会・論文・研修）",
      "美容医療の最新技術・デバイスを常にアップデートし安全に実施",
      "患者に「この先生でなければ」と思わせる専門性とコミュニケーション力",
      "経営感覚を持ち、自費診療の戦略的な展開に参画できる",
      "スタッフが安心して働ける環境を作るリーダーシップ",
    ],
    assistWork: [
      {
        section: "チームへの指示・監督責任",
        items: [
          "全スタッフへの業務指示（どの業務を誰が行うかの最終判断）",
          "非資格者が実施できる業務の範囲設定と文書化",
          "看護師・クラーク・カウンセラーへの具体的な指示の明確化",
          "インシデント・アクシデント発生時の最終対応責任",
          "新メニュー・新技術導入時の安全基準の設定",
        ],
      },
    ],
    prohibited: [
      "無資格者に医行為を指示・黙認すること（医師法違反・共同正犯となる）",
      "根拠のない診断・説明（インフォームドコンセント不備）",
      "適応外の施術の実施（保険診療の不正請求を含む）",
    ],
    prohibitedNote: "非資格者への医行為の指示・黙認は、医師自身の免許取り消しリスクがある。「前からやっていた」は免責にならない。",
    philosophy: "医師のエキスパートは「良い医療」だけでなく「良いチームを作る力」も必要。スタッフが安心して働ける環境を作ることで、患者へのケアの質も上がる。",
  },
]

const BLOOD_RULES = {
  prohibited: [
    "採血（静脈・動脈・毛細血管・指先穿刺・耳垂穿刺すべて）",
    "採血後の抜針・止血押さえ（止血確認は看護師が行う）",
    "血液の入った試験管・採血管の取り出し・蓋の開閉・遠心分離機への操作",
    "PRP・エクソソームなど血液由来製剤の調製・注入",
    "血液検査結果の解釈・患者への説明（「正常です」も不可）",
    "血液付着物・使用済み注射器・針の廃棄（感染性廃棄物容器への投入は看護師）",
    "針刺し事故発生時の医療的対応（処置・血液検査の指示は医師）",
  ],
  conditional: [
    "採血後の穿刺部への圧迫綿の保持（看護師の指示がある場合のみ）",
    "採血管のラベル貼り・氏名確認（看護師が採血した後の補助業務として）",
    "密閉済み採血管の検査会社への搬送・受け渡し（管を開けない・操作しない）",
    "血液付着のない使用済み器具の片付け補助（手袋着用・直接触れない）",
  ],
  allowed: [
    "採血前の患者確認（氏名・生年月日・アレルギーの照合）",
    "採血室・採血ベッドの準備（シーツ交換・環境整備）",
    "採血後の患者の安静確認・気分不良時の看護師への報告",
    "血液検査の結果票を封筒に入れて患者に手渡す（内容の説明なし）",
  ],
  needleStick: [
    "すぐに流水で傷口を洗い流す（絞り出しは不要）",
    "院長・看護師に即時報告（5分以内）",
    "使用済み針・器具には二度と触れない",
    "感染源患者の特定・血液検査・HIV曝露後予防投薬の判断はすべて医師が行う",
  ],
}

const CLEAN_RULES = {
  prohibited: [
    "滅菌済み器具・ガーゼ・ドレープのパッケージ開封（滅菌野への展開は看護師が行う）",
    "滅菌トレイ・清潔野への器具の配置（清潔野に触れること自体が不潔操作となる）",
    "手術・切開・生検時の清潔操作全般への参加（介助は資格者のみ）",
    "滅菌済み注射器・針のパッケージ開封・薬液の吸い上げ",
    "開封済み滅菌物の再滅菌判断（滅菌有効期限・パッケージ破損の判断は資格者）",
    "傷・創部への直接接触（ガーゼ交換・ドレッシング材の貼付・除去）",
    "縫合糸・縫合針の取り扱い",
  ],
  conditional: [
    "滅菌パッケージの外側を持って看護師に「渡す」補助（中身・内袋には触れない）",
    "処置後の不潔物（使用済みガーゼ等）の廃棄補助（手袋着用・看護師の指示のもと）",
    "処置台の消毒（処置終了後・アルコール消毒の拭き取り補助）",
  ],
  allowed: [
    "処置前の環境整備（清潔なシーツ・枕カバーの交換）",
    "滅菌物の在庫確認・補充依頼（開封はしない）",
    "滅菌有効期限の確認・期限切れ品の看護師への報告",
    "手指衛生の徹底（患者対応前後の手洗い・アルコール消毒）",
    "処置室・診察台の非清潔野（椅子・床・扉ノブ）の日常清掃",
    "個人防護具（手袋・マスク・エプロン）の着脱と廃棄",
  ],
  principles: [
    "清潔野に「不潔なもの」が一瞬でも触れたら、その清潔野全体が不潔になる",
    "「清潔かどうか迷ったら不潔」― 迷った瞬間に看護師に確認する",
    "手袋を着けていても、清潔野への接触は資格者以外は行わない",
    "処置室に入る際は、私語・不必要な動作を最小限にし、飛沫・埃を立てない",
  ],
}

type TabId = "roles" | "blood" | "clean"

function Section({ title, items, color, type }: {
  title: string; items: string[]; color: string;
  type: "prohibited" | "conditional" | "allowed" | "warning" | "default"
}) {
  const dotColor = type === "prohibited" ? "#ef4444" : type === "conditional" ? "#f59e0b" : type === "allowed" ? "#22c55e" : color
  const bg = type === "prohibited" ? "#fff0f0" : type === "conditional" ? "#fffbeb" : type === "allowed" ? "#edfbf4" : "#f8f6fc"
  const borderColor = type === "prohibited" ? "#fca5a5" : type === "conditional" ? "#fde68a" : type === "allowed" ? "#86efac" : "rgba(124,101,204,0.15)"
  const label = type === "prohibited" ? "🔴 絶対禁止" : type === "conditional" ? "🟠 条件付き可（指示・監視下のみ）" : type === "allowed" ? "🟢 行ってよい" : title

  return (
    <div style={{ background: bg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: dotColor, marginBottom: 8 }}>{label !== title ? label : title}</div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < items.length - 1 ? 6 : 0 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, marginTop: 8, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.7 }}>{item}</p>
        </div>
      ))}
    </div>
  )
}

function RoleCard({ role }: { role: Role }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ ...card, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "16px 20px", background: "transparent",
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left",
      }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: role.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{role.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{role.title}</div>
          <div style={{ fontSize: 12, color: role.color, marginTop: 2 }}>{role.subtitle}</div>
        </div>
        {open ? <ChevronUp size={18} style={{ color: "var(--text-secondary)", flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(124,101,204,0.1)" }}>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>

              {/* コア業務 */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>📌 コア業務</div>
                {role.coreWork.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: role.color, marginTop: 8, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.7 }}>{item}</p>
                  </div>
                ))}
              </div>

              {/* エキスパートの条件 */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>⭐ エキスパートの条件</div>
                {role.expertConditions.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", marginTop: 8, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.7 }}>{item}</p>
                  </div>
                ))}
              </div>

              {/* 診療補助業務 */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>🤝 診療補助業務（医師・看護師の指示のもと）</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {role.assistWork.map((section, si) => (
                    <div key={si} style={{ background: "var(--subtle-bg)", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: role.color, marginBottom: 8 }}>{section.section}</div>
                      {section.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < section.items.length - 1 ? 5 : 0 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: role.color, marginTop: 8, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: "var(--text-primary)", margin: 0, lineHeight: 1.7 }}>{item}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* やってはいけないこと */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>🚫 やってはいけないこと</div>
                <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 12, padding: "12px 14px" }}>
                  {role.prohibited.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < role.prohibited.length - 1 ? 6 : 0 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", marginTop: 8, flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: "#c0392b", margin: 0, lineHeight: 1.7 }}>{item}</p>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #fca5a5", fontSize: 12, color: "#b91c1c", lineHeight: 1.7 }}>
                    ⚠️ {role.prohibitedNote}
                  </div>
                </div>
              </div>

              {/* 哲学 */}
              <div style={{ background: role.bg, border: `1px solid ${role.color}33`, borderRadius: 12, padding: "12px 16px" }}>
                <p style={{ fontSize: 13, color: role.darkColor, margin: 0, lineHeight: 1.8, fontStyle: "italic" }}>「{role.philosophy}」</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function RolesPage() {
  const [tab, setTab] = useState<TabId>("roles")

  const tabs: { id: TabId; label: string; emoji: string }[] = [
    { id: "roles", label: "役職別ガイド", emoji: "👥" },
    { id: "blood", label: "血液・採血ガイドライン", emoji: "🩸" },
    { id: "clean", label: "清潔操作ガイドライン", emoji: "🧤" },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {/* 法的根拠バナー */}
      <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ fontSize: 18, flexShrink: 0 }}>⚖️</div>
        <div style={{ fontSize: 12, color: "#c0392b", lineHeight: 1.7 }}>
          <span style={{ fontWeight: 700 }}>法的根拠：</span>
          医師法第17条（医業は医師のみ）・保健師助産師看護師法第31条（診療補助は看護師のみ）。
          非資格者による医行為は3年以下の懲役または100万円以下の罰金。「慣習」「指示があった」は免責にならない。
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, fontSize: 12, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", border: "none",
              background: tab === t.id ? "linear-gradient(135deg,#a78bfa,#f472b6)" : "#fff",
              color: tab === t.id ? "white" : "#7a6e96",
              boxShadow: tab === t.id ? "0 2px 8px rgba(167,139,250,0.35)" : "0 1px 3px rgba(90,60,160,0.08)" }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* 役職別ガイド */}
      {tab === "roles" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>各職種をクリックして詳細を確認してください</div>
          {ROLES.map(role => <RoleCard key={role.id} role={role} />)}
        </div>
      )}

      {/* 血液ガイドライン */}
      {tab === "blood" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>🩸 血液・採血関連ガイドライン（非資格者向け）</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Section title="絶対禁止" items={BLOOD_RULES.prohibited} color="#ef4444" type="prohibited" />
              <Section title="条件付き" items={BLOOD_RULES.conditional} color="#f59e0b" type="conditional" />
              <Section title="行ってよい" items={BLOOD_RULES.allowed} color="#22c55e" type="allowed" />
            </div>
          </div>
          <div style={{ ...card, padding: 20, borderLeft: "4px solid #ef4444" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c0392b", marginBottom: 12 }}>🚨 針刺し事故が起きた場合（非資格者向け）</div>
            {BLOOD_RULES.needleStick.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <p style={{ fontSize: 13, color: "#c0392b", margin: 0, lineHeight: 1.7, fontWeight: i === 0 ? 600 : 400 }}>{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 清潔操作ガイドライン */}
      {tab === "clean" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>🧤 清潔操作ガイドライン（非資格者向け）</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Section title="絶対禁止" items={CLEAN_RULES.prohibited} color="#ef4444" type="prohibited" />
              <Section title="条件付き" items={CLEAN_RULES.conditional} color="#f59e0b" type="conditional" />
              <Section title="行ってよい" items={CLEAN_RULES.allowed} color="#22c55e" type="allowed" />
            </div>
          </div>
          <div style={{ ...card, padding: 20, borderLeft: "4px solid #1D9E75" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#085041", marginBottom: 12 }}>📌 清潔操作の基本原則（全スタッフが必ず理解すること）</div>
            {CLEAN_RULES.principles.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1D9E75", marginTop: 8, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "#085041", margin: 0, lineHeight: 1.7, fontWeight: 600 }}>{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
