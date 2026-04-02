"use client"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Bell, ArrowRight } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"

const cont={hidden:{},show:{transition:{staggerChildren:0.07}}}
const item={hidden:{opacity:0,y:10},show:{opacity:1,y:0}}
const card:React.CSSProperties={background:"#fff",borderRadius:16,border:"1px solid rgba(124,101,204,0.11)",boxShadow:"0 1px 4px rgba(90,60,160,0.05)",padding:16}

export default function HomePage() {
  const { setActivePage, nearMisses } = useAppStore()
  const dateStr=new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"})
  return (
    <motion.div variants={cont} initial="hidden" animate="show" style={{padding:24,maxWidth:900,display:"flex",flexDirection:"column",gap:14}}>
      <motion.div variants={item} style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:"#3a2f5a"}}>おはようございます 🌸</h1>
          <p style={{fontSize:12,color:"#b0a8c8",marginTop:3}}>{dateStr}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"#edfbf4",border:"1px solid #86efac",padding:"6px 14px",borderRadius:999,fontSize:11,fontWeight:600,color:"#166634"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>Chatwork 連携中
        </div>
      </motion.div>

      <motion.div variants={item} style={{background:"#fff0f0",border:"1.5px solid #f87171",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
        <AlertTriangle size={18} style={{color:"#ef4444",flexShrink:0}}/>
        <div style={{flex:1,fontSize:13}}>
          <span style={{fontWeight:700,color:"#c0392b"}}>要確認：</span>
          <span style={{color:"#b91c1c"}}>未対応のCRITICALリスク項目が 3 件あります</span>
        </div>
        <button onClick={()=>setActivePage("risk")} style={{display:"flex",alignItems:"center",gap:5,background:"#ef4444",color:"white",fontSize:11,fontWeight:700,padding:"6px 14px",borderRadius:10,border:"none",cursor:"pointer",flexShrink:0}}>
          確認 <ArrowRight size={11}/>
        </button>
      </motion.div>

      <motion.div variants={item} style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          {label:"未対応リスク",val:"3",unit:"件",emoji:"🚨",grad:"linear-gradient(135deg,#fca5a5,#fb7185)",page:"risk"},
          {label:"本日のチェック",val:"4/7",unit:"完了",emoji:"✅",grad:"linear-gradient(135deg,#fcd34d,#fb923c)",page:"manual"},
          {label:"今週のヒヤリハット",val:String(nearMisses.length),unit:"件",emoji:"💬",grad:"linear-gradient(135deg,#93c5fd,#818cf8)",page:"nearmiss"},
          {label:"自信スコア平均",val:"71",unit:"点",emoji:"⭐",grad:"linear-gradient(135deg,#c4b5fd,#a78bfa)",page:"confidence"},
        ].map(s=>(
          <motion.button key={s.label} whileHover={{scale:1.02,y:-2}} whileTap={{scale:0.98}} onClick={()=>setActivePage(s.page)} style={{...card,textAlign:"left",cursor:"pointer",border:"1px solid rgba(124,101,204,0.11)"}}>
            <div style={{width:38,height:38,borderRadius:10,background:s.grad,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>{s.emoji}</div>
            <div style={{fontSize:11,color:"#b0a8c8",marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:"#3a2f5a",lineHeight:1}}>{s.val}<span style={{fontSize:12,fontWeight:400,color:"#b0a8c8",marginLeft:4}}>{s.unit}</span></div>
          </motion.button>
        ))}
      </motion.div>

      <motion.div variants={item} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={card}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,paddingBottom:10,borderBottom:"1px solid rgba(124,101,204,0.08)"}}>
            <CheckCircle2 size={14} style={{color:"#a78bfa"}}/><span style={{fontSize:13,fontWeight:600,color:"#3a2f5a",flex:1}}>本日のチェックリスト</span><span style={{fontSize:11,color:"#b0a8c8"}}>4/7</span>
          </div>
          {["開院前 安全確認","感染対策備品の補充確認","患者情報の受け渡しチェック","AED動作確認・記録"].map((t,i)=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<3?"1px solid rgba(124,101,204,0.06)":"none"}}>
              <div style={{width:16,height:16,borderRadius:5,border:i<2?"none":"1.5px solid #d9d0f7",background:i<2?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {i<2&&<span style={{color:"white",fontSize:10,fontWeight:700}}>✓</span>}
              </div>
              <span style={{fontSize:13,color:i<2?"#b0a8c8":"#3a2f5a",textDecoration:i<2?"line-through":"none"}}>{t}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,paddingBottom:10,borderBottom:"1px solid rgba(124,101,204,0.08)"}}>
            <Bell size={14} style={{color:"#a78bfa"}}/><span style={{fontSize:13,fontWeight:600,color:"#3a2f5a"}}>Chatwork 最近の通知</span>
          </div>
          {[
            {emoji:"⚠️",title:"インシデント報告",body:"3階処置室でヒヤリハットが提出されました",time:"10分前",bg:"#fffbeb",border:"#fde68a"},
            {emoji:"📋",title:"マニュアル更新",body:"感染対策マニュアル（ver.3.2）が更新されました",time:"2時間前",bg:"#f0f7ff",border:"#bfdbfe"},
            {emoji:"⭐",title:"自信スコア集計",body:"今月の4つの自信スコアが集計されました",time:"昨日",bg:"#f5f2fd",border:"#d9d0f7"},
          ].map(n=>(
            <div key={n.title} style={{background:n.bg,border:`1px solid ${n.border}`,borderRadius:10,padding:"9px 12px",marginBottom:7,display:"flex",gap:10}}>
              <span style={{fontSize:15,flexShrink:0}}>{n.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:"#3a2f5a"}}>{n.title}</div>
                <div style={{fontSize:11,color:"#7a6e96",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.body}</div>
              </div>
              <span style={{fontSize:10,color:"#b0a8c8",flexShrink:0}}>{n.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
