import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface LifeGoal {
  id: string
  area: "work" | "family" | "health" | "finance" | "hobby"
  timeframe: "1year" | "3year" | "10year"
  goal: string
  why: string
  action: string
  progress: number
  createdAt: string
}

export interface GratitudeCard {
  id: string
  fromName: string
  fromRole: string
  toName: string
  toRole: string
  message: string
  likes: number
  likedBy: string[]
  createdAt: string
}

export interface DirectorMessage {
  id: string
  title: string
  body: string
  principle: string
  likes: number
  likedBy: string[]
  createdAt: string
}

interface AchievementState {
  lifeGoals: LifeGoal[]
  gratitudeCards: GratitudeCard[]
  directorMessages: DirectorMessage[]
  addLifeGoal: (g: Omit<LifeGoal, "id" | "createdAt">) => void
  updateLifeGoal: (id: string, data: Partial<LifeGoal>) => void
  deleteLifeGoal: (id: string) => void
  addGratitudeCard: (c: Omit<GratitudeCard, "id" | "createdAt" | "likes" | "likedBy">) => void
  likeGratitudeCard: (id: string, userName: string) => void
  addDirectorMessage: (m: Omit<DirectorMessage, "id" | "createdAt" | "likes" | "likedBy">) => void
  likeDirectorMessage: (id: string, userName: string) => void
  deleteDirectorMessage: (id: string) => void
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set) => ({
      lifeGoals: [],
      gratitudeCards: [],
      directorMessages: [
        {
          id: "msg1",
          title: "なぜ私たちはこの仕事をするのか",
          body: "患者さんの笑顔を見るたびに、私たちの仕事の意味を感じます。\n\n皮膚の悩みは、外見だけでなく心にも影響します。その悩みを解決することで、患者さんの人生が少し豊かになる。その積み重ねが、私たちクリニックの存在意義です。\n\nスタッフの皆さん一人ひとりが、その大切な仕事の担い手です。",
          principle: "仕事の意義・PURPOSE",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
        },
        {
          id: "msg2",
          title: "目標は「なりたい自分」から逆算する",
          body: "アチーブメントの教えの中で、私が最も大切にしているのが「目標設定の原理原則」です。\n\n目標は「何をするか」ではなく「どんな自分でありたいか」から始まります。\n\n10年後、あなたはどんな医療人になっていたいですか？どんな生活を送っていたいですか？\n\nその答えが、今日の仕事の意味を教えてくれます。ぜひAirと一緒に、自分の目標を言葉にしてみてください。",
          principle: "目標設定の原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        },
        {
          id: "msg3",
          title: "感謝は言葉にして、初めて伝わる",
          body: "「ありがとう」という言葉を、今日何回言いましたか？\n\n感謝の気持ちは、心の中にあるだけでは相手には届きません。言葉にして、相手の目を見て伝えて、初めて本物の感謝になります。\n\nアチーブメントでは「承認」を人間関係の土台と教えています。チームの力は、こうした小さな積み重ねで育まれます。\n\n今日、誰かに「ありがとう」を伝えてみてください。",
          principle: "感謝・承認の原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
        {
          id: "msg4",
          title: "自分への自信が、患者さんへの安心につながる",
          body: "患者さんは、私たちの「自信」を感じ取っています。\n\n声のトーン、表情、立ち居振る舞い。すべてが「この人は信頼できる」というメッセージになります。\n\n4つの自信のうち、「自分への自信」が最も難しく、最も大切です。自分を信じられる人だけが、本当に患者さんを安心させることができます。\n\n自信は生まれつきではありません。毎日の小さな成長の積み重ねで育てるものです。",
          principle: "自己実現の原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        },
        {
          id: "msg5",
          title: "人間関係の土台は「相手を理解しようとする姿勢」",
          body: "チームがうまくいかないとき、たいていの原因は「相手を理解しようとしていない」ことにあります。\n\n自分の意見を伝える前に、まず相手の話を最後まで聞く。判断する前に、相手の立場に立って考える。\n\nこれがアチーブメントが教える人間関係の基本です。\n\n看護師も、受付も、医師も、一人ひとりが違う価値観を持っています。その違いを活かすチームが、最強のチームです。",
          principle: "人間関係の原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          id: "msg6",
          title: "商品への自信―私たちが提供できる価値を誇りに思ってほしい",
          body: "南草津皮フ科では、一般皮膚科と自費美容皮膚科、どちらも本物の医療を提供しています。\n\n美容医療は「贅沢」ではありません。自分の見た目に自信を持つことは、その人の人生を豊かにします。私たちはそのお手伝いをしています。\n\nスタッフの皆さんには、私たちが提供するサービスを心から誇りに思い、自信を持って患者さんにお伝えしてほしいのです。\n\nあなたの自信が、患者さんの決断を支えます。",
          principle: "商品への自信・価値提供",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
        {
          id: "msg7",
          title: "ヒヤリハットは「宝」である",
          body: "ヒヤリハットを報告してくれることは、クリニック全体への贈り物です。\n\n問題が小さいうちに気づき、みんなで共有することで、大きな事故を防ぐことができます。\n\n「こんな小さなこと…」と思わずに、気づいたことは何でも報告してください。報告した人を責めることは絶対にありません。\n\n失敗から学び、より良いクリニックを一緒に作っていきましょう。それがチームの成長です。",
          principle: "成長・学習の原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: "msg8",
          title: "時間は唯一、全員に平等に与えられた資源",
          body: "お金は増やせます。知識は増やせます。でも時間だけは、誰にも平等に1日24時間しか与えられていません。\n\nアチーブメントの時間管理の教えで最も大切なのは「何に時間を使うかは、何を大切にするかの表れである」ということです。\n\n第2象限（重要だが非緊急）の仕事に時間を使えているか、ぜひ振り返ってみてください。\n\n今日の時間の使い方が、1年後の自分を作ります。",
          principle: "時間管理の原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: "msg9",
          title: "リーダーシップは役職ではなく、姿勢である",
          body: "「私はリーダーではないから関係ない」と思っていませんか？\n\nアチーブメントでは、リーダーシップは役職に与えられるものではなく、誰もが発揮できる「姿勢」だと教えています。\n\n新人スタッフでも、自分の担当業務でプロとして振る舞い、後輩に手を差し伸べ、チームの空気を明るくする。それがリーダーシップです。\n\n南草津皮フ科のスタッフ全員に、リーダーとしての誇りを持ってほしいと思っています。",
          principle: "リーダーシップの原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
        {
          id: "msg10",
          title: "会社への自信―このクリニックを誇りに思ってほしい",
          body: "南草津皮フ科は、患者さんのために真剣に向き合うクリニックです。\n\n私は、スタッフの皆さんに「ここで働いていることが誇らしい」と思ってほしい。友人に「どこで働いているの？」と聞かれたとき、胸を張って答えてほしい。\n\nそのためにも、私自身がより良いクリニックを作り続ける責任があります。\n\n皆さんと一緒に、地域で一番信頼されるクリニックを目指していきます。これからもよろしくお願いします。",
          principle: "会社への自信・組織への誇り",
          likes: 0, likedBy: [],
          createdAt: new Date().toISOString(),
        },
      ],
      addLifeGoal: (g) => set((s) => ({
        lifeGoals: [{ ...g, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...s.lifeGoals],
      })),
      updateLifeGoal: (id, data) => set((s) => ({
        lifeGoals: s.lifeGoals.map((g) => g.id === id ? { ...g, ...data } : g),
      })),
      deleteLifeGoal: (id) => set((s) => ({ lifeGoals: s.lifeGoals.filter((g) => g.id !== id) })),
      addGratitudeCard: (c) => set((s) => ({
        gratitudeCards: [{ ...c, id: Date.now().toString(), createdAt: new Date().toISOString(), likes: 0, likedBy: [] }, ...s.gratitudeCards],
      })),
      likeGratitudeCard: (id, userName) => set((s) => ({
        gratitudeCards: s.gratitudeCards.map((c) =>
          c.id === id
            ? c.likedBy.includes(userName)
              ? { ...c, likes: c.likes - 1, likedBy: c.likedBy.filter((u) => u !== userName) }
              : { ...c, likes: c.likes + 1, likedBy: [...c.likedBy, userName] }
            : c
        ),
      })),
      addDirectorMessage: (m) => set((s) => ({
        directorMessages: [{ ...m, id: Date.now().toString(), createdAt: new Date().toISOString(), likes: 0, likedBy: [] }, ...s.directorMessages],
      })),
      likeDirectorMessage: (id, userName) => set((s) => ({
        directorMessages: s.directorMessages.map((m) =>
          m.id === id
            ? m.likedBy.includes(userName)
              ? { ...m, likes: m.likes - 1, likedBy: m.likedBy.filter((u) => u !== userName) }
              : { ...m, likes: m.likes + 1, likedBy: [...m.likedBy, userName] }
            : m
        ),
      })),
      deleteDirectorMessage: (id) => set((s) => ({ directorMessages: s.directorMessages.filter((m) => m.id !== id) })),
    }),
    { name: "care-portal-achievement" }
  )
)
