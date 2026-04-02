"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store/useAppStore"
import { useNearMisses } from "@/hooks/useNearMisses"
import { useEditStore } from "@/store/useEditStore"
import { Users, FileText, MessageSquareHeart, TrendingUp, ChevronRight, X, Star, Check } from "lucide-react"

const card:React.CSSProperties={background:"#fff",borderRadius:16,border:"1px solid rgba(124,101,204,0.11)",boxShadow:"0 1px 4px rgba(90,60,160,0.05)"}
const LEVEL_S:Record<string,React.CSSProperties>={
  CRITICAL:{background:"#ef4444",color:"white",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999},
  HIGH:    {background:"#f59e0b",color:"white",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999},
  MEDIUM:  {background:"#60a5fa",color:"white",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999},
}

const STAFF = [
  {id:"1",name:"田中 花子",role:"看護師",  status:"active",  avatar:"田",checks:6,nearmiss:2,score:78},
  {id:"2",name:"山田 美咲",role:"受付",    status:"active",  avatar:"山",checks:7,nearmiss:1,score:85},
  {id:"3",name:"鈴木 さくら",role:"看護師",status:"active",  avatar:"鈴",checks:5,nearmiss:3,score:72},
  {id:"4",name:"佐藤 院長", role:"院長",   status:"active",  avatar:"佐",checks:7,nearmiss:0,score:91},
  {id:"5",name:"伊藤 マネージャー",role:"マネージャー",status:"active",avatar:"伊",checks:7,nearmiss:1,score:88},
  {id:"6",name:"高橋 看護師",role:"看護師",status:"inactive",avatar:"高",checks:2,nearmiss:0,score:65},
]

const RISK_SUMMARY = [
  {id:1,name:"地震・風水害等、災害の発生",level:"CRITICAL",lastChecked:"未対応"},
  {id:2,name:"人材流失・人材不足",level:"HIGH",lastChecked:"3日前"},
  {id:5,name:"情報漏えい",level:"CRITICAL",lastChecked:"未対応"},
  {id:6,name:"サイバー攻撃・ウイルス感染",level:"CRITICAL",lastChecked:"未対応"},
  {id:3,name:"法令順守違反",level:"HIGH",lastChecked:"1週間前"},
  {id:7,name:"過労死・長時間労働等労務問題",level:"HIGH",lastChecked:"2日前"},
]

const CONF_LABELS=["会社への自信","職業への自信","商品への自信","自分への自信"]
const CONF_VALS=[72,85,68,58]
const CONF_GRADS=["linear-gradient(90deg,#93c5fd,#60a5fa)","linear-gradient(90deg,#6ee7b7,#34d399)","linear-gradient(90deg,#fcd34d,#fb923c)","linear-gradient(90deg,#f9a8d4,#f472b6)"]

function StaffModal({staff,onClose}:{staff:typeof STAFF[0],onClose:()=>void}){
  const conf=[{l:"会社",v:staff.score-10},{l:"職業",v:staff.score+5},{l:"商品",v:staff.score-8},{l:"自分",v:staff.score-15}]
  return (
    <div style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <motion.div initial={{scale:0.94,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.94,opacity:0}}
        style={{background:"#fff",borderRadius:24,boxShadow:"0 8px 40px rgba(60,30,120,0.13)",width:"100%",maxWidth:400,overflow:"hidden"}}>
        <div style={{padding:"20px 22px",borderBottom:"1px solid rgba(124,101,204,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#c4b5fd,#f9a8d4)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:16,fontWeight:700}}>{staff.avatar}</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#3a2f5a"}}>{staff.name}</div>
              <div style={{fontSize:11,color:"#b0a8c8",marginTop:2}}>{staff.role}</div>
            </div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:"50%",background:"#f5f2fd",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#9b87e4"}}>
            <X size={14}/>
          </button>
        </div>
        <div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{l:"チェック完了",v:staff.checks,u:"件"},{l:"ヒヤリハット",v:staff.nearmiss,u:"件"},{l:"自信スコア",v:staff.score,u:"点"}].map(s=>(
              <div key={s.l} style={{background:"#f8f6fc",borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:10,color:"#b0a8c8",marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:22,fontWeight:700,color:"#3a2f5a"}}>{s.v}<span style={{fontSize:11,color:"#b0a8c8",marginLeft:2}}>{s.u}</span></div>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:"#3a2f5a",marginBottom:10}}>4つの自信スコア</div>
            {conf.map((c,i)=>(
              <div key={c.l} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{fontSize:11,color:"#7a6e96",width:56,flexShrink:0}}>{c.l}</div>
                <div style={{flex:1,height:6,background:"#f0ecfa",borderRadius:3,overflow:"hidden"}}>
                  <motion.div initial={{width:0}} animate={{width:`${c.v}%`}} transition={{duration:0.8,delay:i*0.1}}
                    style={{height:"100%",borderRadius:3,background:CONF_GRADS[i]}}/>
                </div>
                <div style={{fontSize:11,fontWeight:600,color:"#7a6e96",width:28,textAlign:"right"}}>{c.v}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:"#3a2f5a",marginBottom:8}}>マネージャーメモ</div>
            <textarea rows={3} placeholder="スタッフへのメモ・フォローアップ事項を記入..."
              style={{width:"100%",border:"1px solid rgba(124,101,204,0.18)",borderRadius:12,padding:"10px 12px",fontSize:12,color:"#3a2f5a",background:"#f8f6fc",resize:"none",outline:"none",fontFamily:"inherit"}}/>
          </div>
          <button style={{width:"100%",padding:"11px",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#f9a8d4)",color:"white",fontWeight:600,fontSize:13,border:"none",cursor:"pointer"}}>
            保存する
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminPage() {
  const { nearMisses: localNM } = useAppStore()
  const { nearMisses, resolveNearMiss, mode } = useNearMisses()
  const { manuals } = useEditStore()
  const [tab,setTab]=useState<"overview"|"staff"|"risk"|"nearmiss">("overview")
  const [selectedStaff,setSelectedStaff]=useState<typeof STAFF[0]|null>(null)

  const tabs=[
    {id:"overview",label:"概要",icon:"📊"},
    {id:"staff",   label:"スタッフ管理",icon:"👥"},
    {id:"risk",    label:"リスク状況",icon:"🛡️"},
    {id:"nearmiss",label:"ヒヤリハット管理",icon:"💬"},
  ] as const

  return (
    <div style={{padding:24,maxWidth:960}}>
      <div style={{background:"linear-gradient(135deg,#ede8fb,#fce4ec)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:16,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#a78bfa,#f472b6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👑</div>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:"#3a2f5a"}}>管理者ダッシュボード</div>
          <div style={{fontSize:11,color:"#7a6e96",marginTop:2}}>院長・マネージャー専用 — スタッフ管理・リスク状況・ヒヤリハット全件確認</div>
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:999,fontSize:12,fontWeight:tab===t.id?600:400,cursor:"pointer",border:tab===t.id?"none":"1px solid rgba(124,101,204,0.18)",background:tab===t.id?"linear-gradient(135deg,#7c65cc,#c084fc)":"#fff",color:tab===t.id?"white":"#7a6e96"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab==="overview" && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {label:"スタッフ総数",val:STAFF.length,unit:"名",emoji:"👥",color:"#7c65cc"},
              {label:"今週のヒヤリハット",val:nearMisses.length,unit:"件",emoji:"💬",color:"#f59e0b"},
              {label:"未対応リスク",val:3,unit:"件",emoji:"🚨",color:"#ef4444"},
              {label:"マニュアル数",val:manuals.length,unit:"件",emoji:"📋",color:"#22c55e"},
            ].map(s=>(
              <div key={s.label} style={{...card,padding:16}}>
                <div style={{fontSize:22,marginBottom:8}}>{s.emoji}</div>
                <div style={{fontSize:11,color:"#b0a8c8",marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:28,fontWeight:700,color:s.color}}>{s.val}<span style={{fontSize:12,color:"#b0a8c8",marginLeft:3}}>{s.unit}</span></div>
              </div>
            ))}
          </div>
          <div style={{...card,padding:20}}>
            <div style={{fontSize:13,fontWeight:600,color:"#3a2f5a",marginBottom:14}}>⭐ クリニック全体の自信スコア</div>
            {CONF_LABELS.map((l,i)=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{fontSize:12,color:"#7a6e96",width:96,flexShrink:0}}>{l}</div>
                <div style={{flex:1,height:8,background:"#f0ecfa",borderRadius:4,overflow:"hidden"}}>
                  <motion.div initial={{width:0}} animate={{width:`${CONF_VALS[i]}%`}} transition={{duration:0.9,delay:i*0.1}}
                    style={{height:"100%",borderRadius:4,background:CONF_GRADS[i]}}/>
                </div>
                <div style={{fontSize:12,fontWeight:600,color:"#3a2f5a",width:32,textAlign:"right"}}>{CONF_VALS[i]}</div>
              </div>
            ))}
          </div>
          <div style={{...card,padding:0,overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(124,101,204,0.09)"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#3a2f5a"}}>💬 最新ヒヤリハット（全スタッフ）</div>
            </div>
            {nearMisses.slice(0,3).map((nm,i)=>(
              <div key={nm.id} style={{padding:"12px 18px",borderBottom:i<2?"1px solid rgba(124,101,204,0.07)":"none",display:"flex",gap:12,alignItems:"flex-start"}}>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,background:"#fffbeb",border:"1px solid #fde68a",color:"#b45309",flexShrink:0,marginTop:2}}>{nm.tag}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:"#3a2f5a"}}>{nm.body}</div>
                  <div style={{fontSize:11,color:"#b0a8c8",marginTop:4}}>▲ {nm.upvotes} · {nm.role} · {nm.time}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab==="staff" && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{...card,padding:0,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(124,101,204,0.09)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#3a2f5a"}}>👥 スタッフ一覧</div>
            <div style={{fontSize:11,color:"#b0a8c8"}}>全 {STAFF.length} 名</div>
          </div>
          {STAFF.map((s,i)=>(
            <motion.button key={s.id} whileHover={{background:"#faf8ff"}} onClick={()=>setSelectedStaff(s)}
              style={{width:"100%",display:"flex",alignItems:"center",padding:"12px 18px",gap:14,borderBottom:i<STAFF.length-1?"1px solid rgba(124,101,204,0.07)":"none",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:s.status==="active"?"linear-gradient(135deg,#c4b5fd,#f9a8d4)":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",color:s.status==="active"?"white":"#9ca3af",fontSize:14,fontWeight:700,flexShrink:0}}>{s.avatar}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"#3a2f5a"}}>{s.name}</div>
                <div style={{fontSize:11,color:"#b0a8c8",marginTop:1}}>{s.role}</div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:700,color:"#3a2f5a"}}>{s.checks}</div>
                  <div style={{fontSize:9,color:"#b0a8c8"}}>チェック</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:700,color:s.nearmiss>0?"#f59e0b":"#22c55e"}}>{s.nearmiss}</div>
                  <div style={{fontSize:9,color:"#b0a8c8"}}>ヒヤリ</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:700,color:"#7c65cc"}}>{s.score}</div>
                  <div style={{fontSize:9,color:"#b0a8c8"}}>自信スコア</div>
                </div>
                <div style={{width:8,height:8,borderRadius:"50%",background:s.status==="active"?"#22c55e":"#d1d5db",flexShrink:0}}/>
              </div>
              <ChevronRight size={14} style={{color:"#c4bde0",flexShrink:0}}/>
            </motion.button>
          ))}
        </motion.div>
      )}

      {tab==="risk" && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{...card,padding:0,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(124,101,204,0.09)"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#3a2f5a"}}>🛡️ リスク対応状況</div>
          </div>
          {RISK_SUMMARY.map((r,i)=>(
            <div key={r.id} style={{padding:"13px 18px",borderBottom:i<RISK_SUMMARY.length-1?"1px solid rgba(124,101,204,0.07)":"none",display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:11,fontWeight:700,color:"#b0a8c8",width:24,fontFamily:"monospace",flexShrink:0}}>{String(r.id).padStart(2,"0")}</span>
              <div style={{flex:1,fontSize:13,color:"#3a2f5a"}}>{r.name}</div>
              <span style={LEVEL_S[r.level]}>{r.level}</span>
              <span style={{fontSize:11,color:r.lastChecked==="未対応"?"#ef4444":"#b0a8c8",fontWeight:r.lastChecked==="未対応"?700:400,flexShrink:0}}>{r.lastChecked}</span>
            </div>
          ))}
        </motion.div>
      )}

      {tab==="nearmiss" && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{...card,padding:"14px 18px",display:"flex",alignItems:"center",gap:10}}>
            <MessageSquareHeart size={16} style={{color:"#a78bfa"}}/>
            <div style={{fontSize:13,fontWeight:600,color:"#3a2f5a",flex:1}}>全ヒヤリハット（管理者は投稿者情報を確認できます）</div>
            <span style={{fontSize:11,color:"#b0a8c8"}}>{nearMisses.length} 件</span>
          </div>
          {nearMisses.map((nm,i)=>(
            <motion.div key={nm.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
              style={{...card,padding:16,borderLeft:"4px solid #fbbf24"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,background:"#fffbeb",border:"1px solid #fde68a",color:"#b45309"}}>{nm.tag}</span>
                <span style={{fontSize:10,color:"#b0a8c8"}}>{nm.time}</span>
              </div>
              <div style={{fontSize:13,color:"#3a2f5a",lineHeight:1.6,marginBottom:10}}>{nm.body}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid rgba(124,101,204,0.08)"}}>
                <div style={{fontSize:11,color:"#7a6e96"}}>
                  <span style={{background:"#f5f2fd",padding:"2px 8px",borderRadius:999,marginRight:6}}>{nm.role}</span>
                  <span style={{color:"#b0a8c8"}}>{nm.anonymous?"匿名投稿":"記名投稿"}</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={{fontSize:11,padding:"4px 10px",borderRadius:999,border:"1px solid rgba(124,101,204,0.2)",background:"#f5f2fd",color:"#7c65cc",cursor:"pointer"}}>対応済みにする</button>
                  <span style={{fontSize:11,color:"#f59e0b",fontWeight:600}}>▲ {nm.upvotes}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedStaff && <StaffModal staff={selectedStaff} onClose={()=>setSelectedStaff(null)}/>}
      </AnimatePresence>
    </div>
  )
}
