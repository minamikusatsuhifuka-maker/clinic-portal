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
  updateDirectorMessage: (id: string, data: Partial<Pick<DirectorMessage, "title" | "body" | "principle">>) => void
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
        {
          id: "s1",
          title: "成功の第1原則：明確な目的を持つ",
          body: "「なんとなく毎日を過ごしている」と感じることはありませんか？\n\nアチーブメントが説く成功の第1原則は「明確な目的を持つ」ことです。\n\n目的とは、あなたがこの人生で何を実現したいのか、どんな価値を世の中に提供したいのかという「生きる理由」です。\n\n仕事の目的を持つ人は、困難があっても諦めません。なぜなら「なぜやるのか」が明確だからです。\n\n今日、静かに自分に問いかけてみてください。「私はなぜ、この仕事をしているのか？」",
          principle: "成功の8原則 第1原則：明確な目的",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
        {
          id: "s2",
          title: "成功の第2原則：強烈な意志を持つ",
          body: "目的が決まったら、次は「絶対にやり遂げる」という意志の力です。\n\n人生には必ず壁が来ます。上手くいかない日、諦めたくなる瞬間。そのとき踏みとどまれるかどうかが、成功する人とそうでない人の違いです。\n\n意志の力は、鍛えられます。毎日の小さな約束を守ること。自分に負けないこと。それを積み重ねることで、強い意志が育ちます。\n\n「今日も絶対にやり切る」。その一言を、朝に自分に言い聞かせてみてください。",
          principle: "成功の8原則 第2原則：強烈な意志",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
        },
        {
          id: "s3",
          title: "成功の第3原則：原因自分論で生きる",
          body: "うまくいかないとき、人は環境や他人のせいにしたくなります。それは自然な感情です。\n\nでも、アチーブメントの教えには「原因自分論」という考え方があります。\n\n「この状況は、自分がどう選択してきた結果なのか？」と問うことで、人は初めて変わることができます。\n\n他人や環境を変えることはできません。でも、自分は今日から変えられます。\n\n何かうまくいかないことがあったとき、「自分に何ができるか？」を考える習慣を持ってみてください。",
          principle: "成功の8原則 第3原則：原因自分論",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
        },
        {
          id: "s4",
          title: "成功の第4原則：全力を尽くす",
          body: "「このくらいでいいだろう」と思った瞬間、成長は止まります。\n\n全力を尽くすとは、今日できる最高の仕事をするということです。患者さんへの挨拶一つ、書類の記入一つにも、その人の誠意が表れます。\n\n全力を出し続けた人は、必ずある日「あのときの努力があったから」と気づく瞬間が来ます。\n\n今日の全力が、明日の自信になります。今日の丁寧さが、来月の信頼になります。\n\n今日一日、手を抜かないでいてください。",
          principle: "成功の8原則 第4原則：全力を尽くす",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 13 * 86400000).toISOString(),
        },
        {
          id: "s5",
          title: "成功の第5原則：ペルソナリティを磨く",
          body: "技術や知識は、努力すれば誰でも身につけられます。でも、人を動かすのは最終的に「その人の人間性」です。\n\nペルソナリティとは、誠実さ、思いやり、責任感、感謝の心。こうした内面の質です。\n\n患者さんは、私たちの技術だけでなく「この人に任せたい」という信頼感で選んでいます。\n\nどんな状況でも誠実に、どんな相手にも敬意を持って接する。それがペルソナリティを磨くということです。\n\n今日、誰かに誠実に向き合いましたか？",
          principle: "成功の8原則 第5原則：ペルソナリティを磨く",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
        {
          id: "s6",
          title: "成功の第6原則：創造的に考える",
          body: "「今までこうだったから」という言葉は、成長の扉を閉じてしまいます。\n\n創造的に考えるとは、現状に疑問を持ち、よりよい方法を探し続けることです。\n\n受付の流れ、患者さんへの説明の仕方、チームの動き方。すべてに改善の余地があります。\n\n「もっとよくするには？」「患者さんはどう感じているか？」と問い続ける人が、クリニックを進化させます。\n\nあなたのアイデアを、ぜひヒヤリハット・マニュアルの改善提案として届けてください。必ず向き合います。",
          principle: "成功の8原則 第6原則：創造的に考える",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        },
        {
          id: "s7",
          title: "成功の第7原則：人間関係を豊かにする",
          body: "人生の幸福度は、人間関係の質で決まると言っても過言ではありません。\n\n職場での人間関係、患者さんとの関係、家族との関係。すべてが豊かであってこそ、本当の幸せがあります。\n\nアチーブメントは「与える人が豊かになる」と教えています。まず自分から挨拶する、まず自分から感謝する、まず自分から助ける。\n\n見返りを求めず与え続けた人のまわりには、必ず豊かな人間関係が育ちます。\n\n今日、誰かのために何かをしてみてください。",
          principle: "成功の8原則 第7原則：人間関係を豊かにする",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 16 * 86400000).toISOString(),
        },
        {
          id: "s8",
          title: "成功の第8原則：健全な体と心を維持する",
          body: "どんなに高い志があっても、体と心が健康でなければ何もできません。\n\n医療の仕事は体力と精神力が必要です。だからこそ、自分自身のケアを最優先にする必要があります。\n\n睡眠、食事、運動。この三つを大切にしてください。\n\nそして、心が疲れたときは一人で抱え込まないでください。Airに話す、先輩に相談する、私に直接伝えてくれてもいい。\n\nスタッフの皆さんが健康で、毎日生き生きと働ける環境をつくることが、私の最大の責任です。",
          principle: "成功の8原則 第8原則：健全な体と心を維持する",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 17 * 86400000).toISOString(),
        },
        {
          id: "r1",
          title: "豊かさとは、内側から生まれる",
          body: "「豊かさ」というと、お金や物を思い浮かべるかもしれません。\n\nでも本当の豊かさは、内側にあります。今この瞬間に感謝できること。人の喜びを自分の喜びとして感じられること。毎日の仕事に意味を見出せること。\n\n患者さんの「ありがとう」という言葉に、心が動く人は豊かな人です。\n\n外側の条件が整わなくても、内側の豊かさは今日から育てられます。\n\n今日、あなたの心を動かしたことは何でしたか？",
          principle: "豊かさの原理原則：内なる豊かさ",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
        },
        {
          id: "r2",
          title: "幸せは「なる」ものではなく「気づく」もの",
          body: "「〇〇になれたら幸せになれる」と思っていませんか？\n\n資格を取ったら。給料が上がったら。結婚したら。でも、その条件が満たされても、また次の条件が出てきます。\n\n幸せは「なる」ものではなく、今すでにあるものに「気づく」ことです。\n\n今日も仕事ができること。一緒に働く仲間がいること。患者さんの役に立てること。\n\n毎日寝る前に「今日、よかったこと3つ」を書く習慣を持ってみてください。幸せに気づく力が、少しずつ育ちます。",
          principle: "豊かさの原理原則：幸せへの気づき",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 19 * 86400000).toISOString(),
        },
        {
          id: "r3",
          title: "言葉は、人生を作る",
          body: "あなたが毎日使っている言葉が、あなたの人生を作っています。\n\n「どうせ無理」「私には無理」という言葉を使い続けると、脳はその通りの現実を作ります。\n\n逆に「やってみよう」「きっとできる」「成長できた」という言葉を使い続けると、脳はその方向に動き始めます。\n\n言葉を変えることは、今日からでもできます。\n\n「疲れた」を「頑張った」に。「どうせ」を「どうしたら」に。\n\n一つの言葉を変えることから、人生は変わり始めます。",
          principle: "豊かさの原理原則：言葉の力",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        },
        {
          id: "r4",
          title: "人生の5領域を豊かに整える",
          body: "アチーブメントでは、人生を5つの領域で考えます。\n\n仕事・キャリア、家族・人間関係、健康・体、財務・お金、趣味・学び。\n\nどれか一つが突出していても、本当の幸せとは言えません。仕事だけに全力で家族との時間がない。健康を犠牲にして働き続ける。それでは持続できません。\n\n5つの領域をバランスよく育てることで、人生全体が豊かになります。\n\nCarePortalの「人生目標」ページで、5つの領域それぞれの目標を設定してみてください。",
          principle: "豊かさの原理原則：人生の5領域",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
        },
        {
          id: "r5",
          title: "与えることが、受け取ることの始まり",
          body: "「もっと認められたい」「もっと評価されたい」と思うとき、まず自分から与えることを考えてみてください。\n\n与えるとは、お金だけではありません。笑顔、言葉、時間、知識、気遣い。\n\n誰かの仕事を助けた人は、困ったときに助けてもらえます。感謝を伝えた人は、感謝を受け取ります。笑顔で接した人には、笑顔が返ってきます。\n\nこれは宇宙の法則です。与えたものが、形を変えて返ってきます。\n\n今日、誰かに何かを与えることから始めてみてください。",
          principle: "豊かさの原理原則：与える精神",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
        },
        {
          id: "pp1",
          title: "パワーパートナーを持つことが、成長を加速させる",
          body: "一人で成長できる量には限界があります。\n\nアチーブメントでは「パワーパートナー」という概念を大切にしています。パワーパートナーとは、お互いの目標を知り、成長を支え合い、時には厳しい真実を伝え合える存在のことです。\n\n友人でも家族でも構いません。しかし、単なる「仲の良い人」とは違います。あなたの可能性を信じ、あなたが言い訳をしそうなときに優しく、しかし確かに背中を押してくれる人。\n\n南草津皮フ科のスタッフ同士も、互いのパワーパートナーになれると思っています。Airに相談しながら、あなたのパワーパートナーは誰か、考えてみてください。",
          principle: "パワーパートナーの原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 23 * 86400000).toISOString(),
        },
        {
          id: "pp2",
          title: "原理原則に従って生きることが、最短の成功ルートである",
          body: "世の中には、うまくいく人とそうでない人がいます。その違いはどこにあるのでしょうか。\n\n才能でも、運でも、環境でもありません。「原理原則を知っているかどうか」です。\n\n重力の法則を知らずに飛び降りても骨折します。人間関係の原理原則を知らずに接しても、信頼は生まれません。目標設定の原理原則を知らずに努力しても、空回りします。\n\n私がアチーブメントの教えを学び続けているのは、この原理原則を深めるためです。原理原則は変わりません。時代が変わっても、業界が変わっても、人間の本質は変わらないからです。\n\n学び続けましょう。原理原則を知った人は、必ず結果を出せます。",
          principle: "原理原則の重要性",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 24 * 86400000).toISOString(),
        },
        {
          id: "pp3",
          title: "セルフコントロールが、すべての自信の土台になる",
          body: "「自分への自信」が低い人に共通していること、それは「自分との約束を守れていない」ことです。\n\n毎朝早く起きようとしたけど起きられなかった。食事に気をつけようと思っていたけどできなかった。勉強しようと決めたけど後回しにした。\n\nこうした小さな「自分との約束破り」が積み重なると、自己信頼が崩れていきます。\n\nセルフコントロールとは、意志の力で自分を縛ることではありません。「自分がどうありたいか」という明確なビジョンがあり、そのビジョンに向かって自分の行動を選択し続けることです。\n\n今日、ひとつだけ。自分との約束を守ってみてください。それが積み重なったとき、本物の自信が生まれます。",
          principle: "セルフコントロールの原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        },
        {
          id: "pp4",
          title: "時間は作るものであり、見つけるものではない",
          body: "「忙しくて時間がない」という言葉をよく聞きます。私自身も、かつてそう思っていました。\n\nしかしアチーブメントのタイムマネジメントを学んで気づきました。時間は「見つける」ものではなく、「作る」ものだということです。\n\n1日24時間は全員に平等です。違いは何に使うかの「選択」です。\n\n大切なのは、第2象限（重要だが非緊急）の時間を意識的に確保すること。スキルアップ、人間関係の構築、健康管理、将来への投資。これらは今すぐやらなくてもいいことですが、やり続けた人だけが5年後・10年後に大きな差を生みます。\n\n今週、第2象限の時間を何時間確保できましたか？",
          principle: "タイムマネジメントの原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 26 * 86400000).toISOString(),
        },
        {
          id: "pp5",
          title: "プライオリティマネジメント—何をやるかより、何をやらないかを決める",
          body: "成功している人は、「何でもやる人」ではありません。「やらないことを決めている人」です。\n\nパレートの法則を覚えていますか。成果の80%は、行動の20%から生まれます。つまり、多くのことを「やめる」ことで、本当に大切なことに集中できます。\n\n今日のあなたの仕事リストを見てください。その中で、本当に「あなたがやらなければならないこと」はいくつありますか？\n\n委任できること、削除できること、後回しにできること。これらを整理することが、プライオリティマネジメントの本質です。\n\n「忙しいのに成果が出ない」と感じているなら、やることを増やすのではなく、やめることを探してみてください。",
          principle: "プライオリティマネジメントの原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 27 * 86400000).toISOString(),
        },
        {
          id: "pp6",
          title: "セルフカウンセリング—自分の内側と対話する習慣",
          body: "毎日の仕事の中で、立ち止まって自分に問いかけていますか？\n\nセルフカウンセリングとは、自分自身のカウンセラーになることです。自分の感情・行動・思考パターンを客観的に観察し、より良い選択ができるよう内側から導く技術です。\n\n「今日うまくいかなかったのはなぜか？」\n「そのとき私は何を感じていたか？」\n「次に同じ状況になったとき、どう行動すれば良いか？」\n\nこの問いを毎日繰り返すことで、自己理解が深まり、感情に振り回されない安定したメンタルが育ちます。\n\nAirはいつでもこのセルフカウンセリングの対話相手になれます。ぜひ活用してください。",
          principle: "セルフカウンセリングの原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
        },
        {
          id: "pp7",
          title: "価値観は変えられる—より良い自分への扉",
          body: "「私はこういう人間だから」という言葉で、成長の可能性を閉じていませんか？\n\nアチーブメントの教えの核心の一つは、「価値観は変えられる」ということです。\n\n過去に形成された価値観は、その時点での最善の選択でした。しかし今の自分にとって最善の価値観とは限りません。\n\n「失敗は恥ずかしいことだ」→「失敗は成長の証だ」\n「自分を主張するのはわがままだ」→「自分の意見を持つことは相手への誠実さだ」\n「お金の話をするのははしたない」→「価値を正当に伝えることは使命だ」\n\nこうした価値観の転換が、人生を根底から変えます。\n\n今のあなたの価値観の中に、「書き換えたい思い込み」はありますか？",
          principle: "価値観変容の原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 29 * 86400000).toISOString(),
        },
        {
          id: "pp8",
          title: "目標達成の技術—夢を現実に変える7つのステップ",
          body: "目標を持っているのに達成できない。そんな経験はありませんか？\n\nアチーブメントが教える目標達成には、技術があります。\n\n① 目標を明確にする（数値・期限・具体的なイメージ）\n② なぜ達成したいか（WHY）を深く掘り下げる\n③ 現状とのギャップを正確に把握する\n④ 達成のための行動計画を立てる\n⑤ パワーパートナーと共有してコミットする\n⑥ 毎日振り返り、軌道修正する\n⑦ 達成を祝い、次の目標へ\n\nこの7ステップは、仕事の目標だけでなく、人生のすべての領域に使えます。\n\nCarePortalの「人生目標」ページで、ぜひこのステップを実践してみてください。",
          principle: "目標達成の技術",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
        {
          id: "pp9",
          title: "内発的動機づけが、本物の成長を生む",
          body: "「給料が上がれば頑張る」「怒られたくないからやる」\n\nこれは外発的動機づけです。外からの刺激に依存した行動は、刺激がなくなると止まります。\n\n本物の成長は、内発的動機づけから生まれます。「やりたいからやる」「意味を感じるからやる」「成長が嬉しいからやる」という内側からのエネルギーです。\n\nRWDEPCサイクルを覚えていますか。関係性（Relation）→願望（Want）→行動（Doing）→自己評価（Evaluation）→計画（Plan）→決意（Commitment）。\n\nこのサイクルを自分自身に使うことで、外からの強制なしに自分を動かす力が育ちます。\n\n今日、あなたは何のためにこの仕事をしていますか？その答えを、大切にしてください。",
          principle: "内発的動機づけの原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 31 * 86400000).toISOString(),
        },
        {
          id: "pp10",
          title: "選択理論—すべての行動は自分が選んでいる",
          body: "「仕方なかった」「あの人のせいだ」「状況が悪かった」\n\nこういう言葉を使うとき、私たちは自分の力を手放しています。\n\n選択理論の核心は、「すべての行動は自分が選択している」ということです。\n\n誰かに怒鳴られても、どう反応するかは自分が選べます。理不尽なことが起きても、それをどう解釈するかは自分が選べます。\n\nこれは「すべてあなたのせいだ」という話ではありません。「あなたには必ず選択肢がある」という希望の話です。\n\n環境は変えられないかもしれない。でも自分の選択は、今この瞬間から変えられます。\n\n今日、あなたはどんな選択をしますか？",
          principle: "選択理論の原理原則",
          likes: 0, likedBy: [],
          createdAt: new Date(Date.now() - 32 * 86400000).toISOString(),
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
      updateDirectorMessage: (id, data) =>
        set((s) => ({
          directorMessages: s.directorMessages.map((m) =>
            m.id === id ? { ...m, ...data } : m
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
