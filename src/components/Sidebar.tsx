"use client"
import { motion } from "framer-motion"
import { useAppStore } from "@/store/useAppStore"
import { Shield, BookOpen, Grid3X3, Star, MessageCircleHeart, LayoutDashboard, Settings, Bell, ExternalLink, ShieldCheck } from "lucide-react"

const NAV = [
  { id:"home",       icon:LayoutDashboard,   label:"ダッシュボード",   badge:null, alert:false },
  { id:"risk",       icon:Shield,            label:"リスク管理",       badge:3,    alert:true  },
  { id:"manual",     icon:BookOpen,          label:"業務マニュアル",   badge:null, alert:false },
  { id:"matrix",     icon:Grid3X3,           label:"役割マトリクス",   badge:null, alert:false },
  { id:"confidence", icon:Star,              label:"4つの自信",        badge:null, alert:false },
  { id:"nearmiss",   icon:MessageCircleHeart,label:"ヒヤリハット共有", badge:6,    alert:false },
  { id:"admin",      icon:ShieldCheck,       label:"管理者画面",       badge:null, alert:false },
]
const LINKS=[
  {label:"Googleカレンダー",href:"https://calendar.google.com",emoji:"📅"},
  {label:"Googleドライブ",href:"https://drive.google.com",emoji:"📁"},
  {label:"Chatwork",href:"https://www.chatwork.com",emoji:"💬"},
]

const base:React.CSSProperties={width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:10,marginBottom:2,fontSize:13,cursor:"pointer",border:"1px solid transparent",background:"transparent"}

export default function Sidebar() {
  const { activePage, setActivePage } = useAppStore()
  return (
    <aside style={{width:220,minWidth:220,background:"#fff",borderRight:"1px solid rgba(124,101,204,0.11)",height:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"20px 18px 16px",borderBottom:"1px solid rgba(124,101,204,0.09)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#c4b5fd,#f9a8d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏥</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#3a2f5a",letterSpacing:"-0.02em"}}>CarePortal</div>
            <div style={{fontSize:10,color:"#b0a8c8",marginTop:1}}>クリニックポータル</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"10px",overflowY:"auto"}}>
        <div style={{fontSize:9,fontWeight:700,color:"#c4bde0",padding:"6px 8px 4px",letterSpacing:"0.1em"}}>MENU</div>
        {NAV.map(n=>{
          const Icon=n.icon; const active=activePage===n.id
          return (
            <motion.button key={n.id} whileHover={{x:1}} whileTap={{scale:0.98}} onClick={()=>setActivePage(n.id)}
              style={{...base,background:active?"#ede8fb":"transparent",border:active?"1px solid rgba(124,101,204,0.18)":"1px solid transparent",color:active?"#5f4ba8":"#7a6e96",fontWeight:active?600:400}}>
              <Icon size={15} style={{color:active?"#7c65cc":"#b0a8c8",flexShrink:0}}/>
              <span style={{flex:1,textAlign:"left"}}>{n.label}</span>
              {n.badge&&<span style={{fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10,background:n.alert?"#fef2f2":"#edfbf4",color:n.alert?"#c0392b":"#166534",border:`1px solid ${n.alert?"#fca5a5":"#86efac"}`}}>{n.badge}</span>}
            </motion.button>
          )
        })}
        <div style={{fontSize:9,fontWeight:700,color:"#c4bde0",padding:"12px 8px 4px",letterSpacing:"0.1em"}}>外部リンク</div>
        {LINKS.map(l=>(
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
            style={{...base,textDecoration:"none",color:"#7a6e96"}}
            onMouseEnter={e=>(e.currentTarget.style.background="#f5f2fd")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <span style={{fontSize:15}}>{l.emoji}</span><span style={{flex:1}}>{l.label}</span><ExternalLink size={10} style={{color:"#c4bde0"}}/>
          </a>
        ))}
        <div style={{fontSize:9,fontWeight:700,color:"#c4bde0",padding:"12px 8px 4px",letterSpacing:"0.1em"}}>設定</div>
        {[{icon:Settings,label:"システム設定"},{icon:Bell,label:"通知設定"}].map(s=>{
          const Icon=s.icon
          return <button key={s.label} style={{...base,color:"#7a6e96"}} onMouseEnter={e=>(e.currentTarget.style.background="#f5f2fd")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}><Icon size={14} style={{color:"#c4bde0"}}/>{s.label}</button>
        })}
      </nav>
      <div style={{padding:"14px 16px",borderTop:"1px solid rgba(124,101,204,0.09)",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#c4b5fd,#f9a8d4)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12,fontWeight:700}}>田</div>
        <div><div style={{fontSize:12,fontWeight:600,color:"#3a2f5a"}}>田中 看護師</div><div style={{fontSize:10,color:"#b0a8c8",marginTop:1}}>一般スタッフ</div></div>
      </div>
    </aside>
  )
}
