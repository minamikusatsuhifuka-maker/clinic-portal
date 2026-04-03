import { create } from "zustand"
import { persist } from "zustand/middleware"
import { RISKS } from "@/data/risks"

export interface ContactItem {
  icon: string
  name: string
  phone: string
}

export interface ManualItem {
  id: string
  icon: string
  title: string
  desc: string
  tag: "日次" | "緊急" | "通常"
  content: string
}

export interface EditableRiskContact {
  riskId: number
  contacts: ContactItem[]
}

export interface EditableFlowStep {
  title: string
  desc: string
}

interface EditStore {
  riskContacts: EditableRiskContact[]
  manuals: ManualItem[]
  riskVisibility: Record<number, boolean>
  riskFlows: Record<number, EditableFlowStep[]>
  updateRiskContacts: (riskId: number, contacts: ContactItem[]) => void
  updateManual: (id: string, data: Partial<ManualItem>) => void
  addManual: (item: Omit<ManualItem, "id">) => void
  deleteManual: (id: string) => void
  toggleRiskVisibility: (riskId: number) => void
  setAllRiskVisibility: (visible: boolean) => void
  updateRiskFlow: (riskId: number, steps: EditableFlowStep[]) => void
  resetRiskFlow: (riskId: number) => void
}

const DEFAULT_CONTACTS: EditableRiskContact[] = RISKS.map((r) => ({
  riskId: r.id,
  contacts: r.contacts,
}))

const DEFAULT_MANUALS: ManualItem[] = [
  { id: "1", icon: "🌅", title: "開院準備チェックリスト", desc: "開院前に確認すべき全項目", tag: "日次", content: "1. 玄関・駐車場の解錠確認\n2. 院内照明・空調の起動\n3. 医療機器の動作確認\n4. 受付システムの起動\n5. 感染対策備品の補充確認" },
  { id: "2", icon: "🌙", title: "閉院後チェックリスト", desc: "施錠・消灯・記録の手順", tag: "日次", content: "1. 最終患者の確認・見送り\n2. 医療廃棄物の適切な処理\n3. 医療機器の電源オフ\n4. 窓・ドアの施錠確認\n5. セキュリティシステムの起動" },
  { id: "3", icon: "🤒", title: "患者急変時の対応手順", desc: "バイタル急変・意識消失時の初動", tag: "緊急", content: "1. 患者の意識・呼吸・脈拍を確認\n2. 医師への即時報告\n3. 必要に応じ119番通報\n4. AEDを準備（必要時）\n5. 院長・マネージャーへの報告" },
  { id: "4", icon: "💊", title: "薬剤管理マニュアル", desc: "薬品庫管理・投与確認の手順", tag: "通常", content: "1. 薬品庫の施錠管理\n2. 投与前の薬名・用量の二重確認\n3. 期限切れ薬品の定期チェック\n4. 麻薬・向精神薬の厳格な管理\n5. 使用記録の正確な記入" },
  { id: "5", icon: "🧹", title: "院内清掃・感染対策手順", desc: "清掃区分・消毒手順の詳細", tag: "通常", content: "1. 清掃区域の区分（清潔・不潔）を徹底\n2. 消毒液の適切な濃度での調製\n3. 高頻度接触面の重点消毒\n4. 使用済み器材の適切な処理\n5. 清掃記録の記入" },
  { id: "6", icon: "📞", title: "電話対応マニュアル", desc: "受付電話・クレーム対応の標準", tag: "通常", content: "1. 3コール以内に応答\n2. 「はい、〇〇クリニックです」と明るく応答\n3. 要件を復唱して確認\n4. クレームは誠実に傾聴し、上長に引き継ぐ\n5. 折り返し時は必ず時間を確認" },
  { id: "7", icon: "🩺", title: "診察補助マニュアル", desc: "診察室での補助業務フロー", tag: "通常", content: "1. 患者入室前の診察室準備\n2. バイタルサイン測定と記録\n3. 医師の指示による補助\n4. 患者への丁寧な説明補助\n5. 使用器材の片付け・消毒" },
  { id: "8", icon: "📝", title: "カルテ記載ガイドライン", desc: "記録の標準書式と記載ルール", tag: "通常", content: "1. 記載は事実のみ・主観を入れない\n2. 略語は院内統一ルールに従う\n3. 修正は二重線+訂正印、修正液不可\n4. 時刻は24時間表記で正確に\n5. 記載後は必ず署名・押印" },
]

export const useEditStore = create<EditStore>()(
  persist(
    (set) => ({
      riskContacts: DEFAULT_CONTACTS,
      riskVisibility: Object.fromEntries(RISKS.map((r) => [r.id, true])),
      riskFlows: {},
      manuals: DEFAULT_MANUALS,
      updateRiskContacts: (riskId, contacts) =>
        set((state) => ({
          riskContacts: state.riskContacts.map((rc) =>
            rc.riskId === riskId ? { ...rc, contacts } : rc
          ),
        })),
      updateManual: (id, data) =>
        set((state) => ({
          manuals: state.manuals.map((m) => (m.id === id ? { ...m, ...data } : m)),
        })),
      addManual: (item) =>
        set((state) => ({
          manuals: [...state.manuals, { ...item, id: Date.now().toString() }],
        })),
      deleteManual: (id) =>
        set((state) => ({
          manuals: state.manuals.filter((m) => m.id !== id),
        })),
      updateRiskFlow: (riskId, steps) =>
        set((state) => ({
          riskFlows: { ...state.riskFlows, [riskId]: steps },
        })),
      resetRiskFlow: (riskId) =>
        set((state) => {
          const newFlows = { ...state.riskFlows }
          delete newFlows[riskId]
          return { riskFlows: newFlows }
        }),
      toggleRiskVisibility: (riskId) =>
        set((state) => ({
          riskVisibility: {
            ...state.riskVisibility,
            [riskId]: !state.riskVisibility[riskId],
          },
        })),
      setAllRiskVisibility: (visible) =>
        set((state) => ({
          riskVisibility: Object.fromEntries(
            Object.keys(state.riskVisibility).map((id) => [id, visible])
          ),
        })),
    }),
    { name: "care-portal-edit-store" }
  )
)
