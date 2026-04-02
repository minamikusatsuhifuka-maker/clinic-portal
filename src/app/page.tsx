"use client"
import { useAppStore } from "@/store/useAppStore"
import Sidebar from "@/components/Sidebar"
import HomePage from "@/components/HomePage"
import RiskPage from "@/components/RiskPage"
import ManualPage from "@/components/ManualPage"
import AdminPage from "@/components/AdminPage"
import { NearMissPage, MatrixPage, ConfidencePage } from "@/components/OtherPages"
import { AnimatePresence, motion } from "framer-motion"

const TITLES:Record<string,string>={
  home:"ダッシュボード", risk:"リスク管理（10項目）", manual:"業務マニュアル",
  matrix:"役割マトリクス", confidence:"4つの自信", nearmiss:"ヒヤリハット・事例共有",
  admin:"管理者ダッシュボード",
}

export default function App() {
  const { activePage }=useAppStore()
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#f8f6fc"}}>
      <Sidebar/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{height:52,background:"#fff",borderBottom:"1px solid rgba(124,101,204,0.1)",display:"flex",alignItems:"center",padding:"0 24px",gap:12,flexShrink:0,boxShadow:"0 1px 3px rgba(90,60,160,0.04)"}}>
          <h2 style={{fontSize:15,fontWeight:700,color:"#3a2f5a",flex:1}}>{TITLES[activePage]}</h2>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"#edfbf4",border:"1px solid #86efac",padding:"5px 12px",borderRadius:999,fontSize:11,fontWeight:600,color:"#166534"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>Chatwork 連携中
          </div>
          <div style={{background:"#f5f2fd",border:"1px solid rgba(124,101,204,0.15)",padding:"5px 12px",borderRadius:999,fontSize:11,color:"#9b87e4"}}>
            {new Date().toLocaleDateString("ja-JP",{month:"long",day:"numeric",weekday:"short"})}
          </div>
        </header>
        <main style={{flex:1,overflowY:"auto"}}>
          <AnimatePresence mode="wait">
            <motion.div key={activePage} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:0.16}}>
              {activePage==="home"       && <HomePage/>}
              {activePage==="risk"       && <RiskPage/>}
              {activePage==="manual"     && <ManualPage/>}
              {activePage==="matrix"     && <MatrixPage/>}
              {activePage==="confidence" && <ConfidencePage/>}
              {activePage==="nearmiss"   && <NearMissPage/>}
              {activePage==="admin"      && <AdminPage/>}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
