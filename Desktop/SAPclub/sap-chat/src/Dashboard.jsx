import { useState, useEffect } from "react";
import { NotificationBell } from "./Notifications";
import { auth, db } from "./firebase";
import Learn from './Learn';
import { doc, setDoc, getDoc, collection, onSnapshot, getDocs } from "firebase/firestore";
import logo from "./assets/SAPclub_logo.png";
import Chat from "./Chat";
import AskDoubt from "./AskDoubt";
import ResolveDoubt from "./resolvedoubts";

const navItems = [
  { icon: "⊞", label: "Home" },
  { icon: "◈", label: "Chats" },
  { icon: "◎", label: "Doubts" },
  { icon: "📚", label: "Learn" },
  { icon: "◐", label: "SAP Global" },
];

const aiLinks = [
  { name: "Claude",     url: "https://claude.ai",        color: "#F59E0B" },
  { name: "ChatGPT",    url: "https://chatgpt.com",       color: "#10A37F" },
  { name: "Gemini",     url: "https://gemini.google.com", color: "#4285F4" },
  { name: "Perplexity", url: "https://perplexity.ai",     color: "#7B61FF" },
];

const sapModules = ["FI","MM","SD","CO","HR","PP","WM","PM"];
const EMOJIS = ["🧑‍💻","👨‍💼","👩‍💼","🦁","🐯","🦊","🐺","🐻","🐼","🦋","🌟","🔥","⚡","🎯","🚀","🎸","🎩","🧠","💡","🌈","🏆","💎","🛡️","⚔️","🌙","☀️","🍀","🎭","🤖","👾"];

/* ── RESPONSIVE HOOK ─────────────────────────────────── */
function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}

export default function Dashboard({ user, darkMode, setDarkMode }) {
  const [active, setActive]           = useState("Home");
  const [profile, setProfile]         = useState({ emoji:"🧑‍💻", name:"", sapId:"" });
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats]             = useState({ openDoubts:0, resolvedToday:0, activeMembers:0 });
  const { w } = useWindowSize();
  const uid = user.uid;

  const isMobile  = w < 768;
  const isTablet  = w >= 768 && w < 1100;
  const isDesktop = w >= 1100;

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) setSidebarOpen(false);
    if (isDesktop) setSidebarOpen(true);
  }, [isTablet, isDesktop]);

  useEffect(() => {
    document.body.classList.toggle("light", !darkMode);
  }, [darkMode]);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db,"users",uid));
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        const def = { emoji:"🧑‍💻", name:user.email.split("@")[0], sapId:"SS-"+uid.slice(0,6).toUpperCase() };
        await setDoc(doc(db,"users",uid), def);
        setProfile(def);
      }
    })();
  }, [uid]);

  useEffect(() => {
    const unsubDoubts = onSnapshot(collection(db,"doubts"), snap => {
      const all = snap.docs.map(d=>d.data());
      setStats(prev => ({ ...prev, openDoubts: all.filter(d=>!d.resolved).length, resolvedToday: all.filter(d=>d.resolved).length }));
    });
    const unsubUsers = onSnapshot(collection(db,"users"), snap => {
      setStats(prev => ({ ...prev, activeMembers: snap.size }));
    });
    return () => { unsubDoubts(); unsubUsers(); };
  }, []);

  const renderContent = () => {
    if (showProfile) return <ProfilePage user={user} profile={profile} setProfile={setProfile} goBack={()=>setShowProfile(false)} uid={uid} darkMode={darkMode} />;
    switch (active) {
      case "Home":       return <HomeContent setActive={setActive} darkMode={darkMode} stats={stats} uid={uid} isMobile={isMobile} />;
      case "Chats":      return <Chat darkMode={darkMode} />;
      case "Doubts":     return <DoubtsPage darkMode={darkMode} />;
      case "Learn":      return <Learn darkMode={darkMode} />;
      case "SAP Global": return <SapGlobal goBack={()=>setActive("Home")} darkMode={darkMode} />;
      default:           return <ComingSoon label={active} icon={navItems.find(n=>n.label===active)?.icon} goBack={()=>setActive("Home")} darkMode={darkMode} />;
    }
  };

  const dm = darkMode;
  const sideW = sidebarOpen ? "260px" : "68px";

  // ── MOBILE LAYOUT ──────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden",
        background: dm ? "linear-gradient(160deg,#040810 0%,#060B18 40%,#080E20 100%)" : "linear-gradient(160deg,#C8D8F8 0%,#E0EAFF 50%,#D4E3FF 100%)",
        fontFamily:"'Outfit',sans-serif",
      }}>
        {/* TOP HEADER */}
        <div style={{
          height:"56px", flexShrink:0,
          background: dm ? "rgba(4,8,18,0.92)" : "rgba(255,255,255,0.85)",
          borderBottom: dm ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,102,255,0.1)",
          backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 16px", zIndex:20,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <img src={logo} style={{ width:"28px", height:"28px", borderRadius:"50%", objectFit:"contain" }} />
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"15px", fontWeight:"800", color:dm?"#F0F6FF":"#0A1128" }}>SAPclub</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div onClick={()=>setDarkMode(!dm)} style={{ width:"34px", height:"34px", borderRadius:"10px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", background:dm?"rgba(255,255,255,0.05)":"rgba(0,102,255,0.08)", border:dm?"1px solid rgba(255,255,255,0.07)":"1px solid rgba(0,102,255,0.12)" }}>
              {dm?"☀️":"🌙"}
            </div>
            <NotificationBell darkMode={darkMode} />
            <div onClick={()=>{ setShowProfile(true); }} style={{ width:"34px", height:"34px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", cursor:"pointer" }}>
              {profile.emoji}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px", position:"relative", zIndex:1, paddingBottom:"80px" }}>
          {renderContent()}
        </div>

        {/* BOTTOM NAV */}
        <div style={{
          position:"fixed", bottom:0, left:0, right:0, height:"60px",
          background: dm ? "rgba(4,8,18,0.95)" : "rgba(255,255,255,0.95)",
          borderTop: dm ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,102,255,0.1)",
          backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          display:"flex", alignItems:"center", justifyContent:"space-around",
          zIndex:20, paddingBottom:"env(safe-area-inset-bottom)",
        }}>
          {navItems.map(item => {
            const isActive = active===item.label && !showProfile;
            return (
              <div key={item.label} onClick={()=>{ setActive(item.label); setShowProfile(false); }}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", cursor:"pointer", flex:1, padding:"6px 0" }}>
                <span style={{ fontSize:"18px", opacity: isActive ? 1 : 0.45, filter: isActive ? "none" : "grayscale(1)" }}>{item.icon}</span>
                <span style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.04em", color: isActive ? "#4D8EFF" : (dm?"#3A5070":"#8AAAC0") }}>{item.label.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DESKTOP / TABLET LAYOUT ────────────────────────────
  return (
    <div style={{
      display:"flex", height:"100vh", overflow:"hidden",
      background: dm ? "linear-gradient(160deg,#040810 0%,#060B18 40%,#080E20 100%)" : "linear-gradient(160deg,#C8D8F8 0%,#E0EAFF 50%,#D4E3FF 100%)",
      fontFamily:"'Outfit',sans-serif", position:"relative",
    }}>
      {/* Ambient orbs */}
      <div style={{ position:"fixed", top:"-20%", left:"-10%", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(0,102,255,0.12) 0%,transparent 65%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-20%", right:"-10%", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle,rgba(123,97,255,0.08) 0%,transparent 65%)", pointerEvents:"none", zIndex:0 }} />

      {/* SIDEBAR */}
      <div style={{
        width:sideW, minWidth:sideW,
        background: dm?"rgba(4,8,18,0.88)":"rgba(255,255,255,0.6)",
        borderRight: dm?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(0,102,255,0.1)",
        backdropFilter:"blur(32px)", WebkitBackdropFilter:"blur(32px)",
        display:"flex", flexDirection:"column", padding:"20px 0",
        transition:"width 0.3s cubic-bezier(.4,0,.2,1), min-width 0.3s cubic-bezier(.4,0,.2,1)",
        overflow:"hidden", flexShrink:0, zIndex:10,
        boxShadow: dm?"4px 0 40px rgba(0,0,0,0.5)":"4px 0 30px rgba(0,102,255,0.06)",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:sidebarOpen?"space-between":"center", padding:"0 14px", marginBottom:"28px" }}>
          {sidebarOpen ? (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <img src={logo} style={{ width:"34px", height:"34px", borderRadius:"50%", objectFit:"contain", boxShadow:"0 0 16px rgba(0,102,255,0.5)" }} />
                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"17px", fontWeight:"800", color:dm?"#F0F6FF":"#0A1128", letterSpacing:"-0.02em" }}>SAPclub</span>
              </div>
              <button onClick={()=>setSidebarOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:dm?"#3A5070":"#8AAAC0", fontSize:"18px", padding:"4px", borderRadius:"6px", transition:"color .2s" }}
                onMouseEnter={e=>e.currentTarget.style.color=dm?"#F0F6FF":"#0A1128"}
                onMouseLeave={e=>e.currentTarget.style.color=dm?"#3A5070":"#8AAAC0"}
              >☰</button>
            </>
          ) : (
            <img src={logo} onClick={()=>setSidebarOpen(true)} style={{ width:"34px", height:"34px", borderRadius:"50%", objectFit:"contain", cursor:"pointer", boxShadow:"0 0 16px rgba(0,102,255,0.5)" }} />
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1 }}>
          {sidebarOpen && <p className="section-label" style={{ paddingLeft:"20px", marginBottom:"10px" }}>NAVIGATE</p>}
          {navItems.map(item=>(
            <div key={item.label}
              className={`nav-item ${active===item.label&&!showProfile?"active":""}`}
              onClick={()=>{ setActive(item.label); setShowProfile(false); }}
              title={!sidebarOpen?item.label:""}
            >
              <span className="nav-icon" style={{ color:active===item.label&&!showProfile?"#60A5FF":"inherit" }}>{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* AI Resources */}
        {sidebarOpen && (
          <div style={{ borderTop:dm?"1px solid rgba(255,255,255,0.05)":"1px solid rgba(0,102,255,0.08)", padding:"16px 16px 0", marginTop:"12px" }}>
            <p className="section-label" style={{ marginBottom:"10px" }}>AI RESOURCES</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {aiLinks.map(ai=>(
                <a key={ai.name} href={ai.url} target="_blank" rel="noreferrer" style={{
                  display:"inline-flex", alignItems:"center", gap:"5px",
                  padding:"5px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:"600",
                  textDecoration:"none", transition:"all .2s",
                  background:dm?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.7)",
                  border:dm?"1px solid rgba(255,255,255,0.07)":"1px solid rgba(0,102,255,0.12)",
                  color:dm?"#7A95BE":"#4A6080", fontFamily:"'Outfit',sans-serif",
                }}
                  onMouseEnter={e=>{ e.currentTarget.style.color=dm?"#F0F6FF":"#0A1128"; e.currentTarget.style.transform="translateY(-1px)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.color=dm?"#7A95BE":"#4A6080"; e.currentTarget.style.transform="translateY(0)"; }}
                >
                  <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:ai.color, flexShrink:0 }} />
                  {ai.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* User strip */}
        <div style={{ borderTop:dm?"1px solid rgba(255,255,255,0.05)":"1px solid rgba(0,102,255,0.08)", padding:"14px 10px 0", marginTop:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:sidebarOpen?"10px":"0", justifyContent:sidebarOpen?"flex-start":"center", padding:"7px 8px", borderRadius:"12px", cursor:"pointer", transition:"background .2s", marginBottom:"10px" }}
            onClick={()=>setShowProfile(true)}
            onMouseEnter={e=>e.currentTarget.style.background=dm?"rgba(255,255,255,0.05)":"rgba(0,102,255,0.06)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <div className="avatar-ring" style={{ width:"34px", height:"34px", fontSize:"17px" }}>{profile.emoji}</div>
            {sidebarOpen && (
              <div style={{ overflow:"hidden" }}>
                <p style={{ fontSize:"13px", fontWeight:"700", color:dm?"#D0DCFF":"#0A1128", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile.name||user.email.split("@")[0]}</p>
                <p style={{ fontSize:"10px", color:dm?"#3A5070":"#8AAAC0", fontFamily:"'Space Grotesk',monospace" }}>{profile.sapId}</p>
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:"8px", padding:"0 4px" }}>
            <div onClick={()=>setDarkMode(!dm)} title={dm?"Light mode":"Dark mode"} style={{ width:"34px", height:"34px", borderRadius:"10px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", background:dm?"rgba(255,255,255,0.05)":"rgba(0,102,255,0.08)", border:dm?"1px solid rgba(255,255,255,0.07)":"1px solid rgba(0,102,255,0.12)", transition:"all .2s", flexShrink:0 }}
              onMouseEnter={e=>e.currentTarget.style.background=dm?"rgba(255,255,255,0.1)":"rgba(0,102,255,0.15)"}
              onMouseLeave={e=>e.currentTarget.style.background=dm?"rgba(255,255,255,0.05)":"rgba(0,102,255,0.08)"}
            >{dm?"☀️":"🌙"}</div>
            <NotificationBell darkMode={darkMode} />
            {sidebarOpen && (
              <button onClick={()=>auth.signOut()} style={{ flex:1, padding:"8px", background:"rgba(255,70,96,0.08)", color:"#FF7090", border:"1px solid rgba(255,70,96,0.15)", borderRadius:"10px", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", transition:"all .2s" }}
                onMouseEnter={e=>{ e.target.style.background="rgba(255,70,96,0.18)"; e.target.style.color="#FFB0C0"; }}
                onMouseLeave={e=>{ e.target.style.background="rgba(255,70,96,0.08)"; e.target.style.color="#FF7090"; }}
              >Sign Out</button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, overflowY:"auto", padding: isTablet ? "24px 20px" : "36px 40px", position:"relative", zIndex:1 }}>
        {renderContent()}
      </div>
    </div>
  );
}

/* ── HOME ─────────────────────────────────────────────── */
function HomeContent({ setActive, darkMode, stats, uid, isMobile }) {
  const [expertData, setExpertData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const h = new Date().getHours();
  const greeting = h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening";
  const dm = darkMode;
  const txt = (op=1) => ({ color: dm?`rgba(240,246,255,${op})`:`rgba(10,17,40,${op})` });

  useEffect(() => {
    getDoc(doc(db,"experts",uid)).then(s=>{ if(s.exists()) setExpertData(s.data()); });
    getDocs(collection(db,"experts")).then(snap => {
      const list = snap.docs.map(d=>d.data()).filter(e=>e.approved && e.credits>0);
      list.sort((a,b)=>(b.credits||0)-(a.credits||0));
      setLeaderboard(list.slice(0,5));
    });
  }, [uid]);

  const shareOnLinkedIn = () => {
    if (!expertData) return;
    const text = encodeURIComponent(`🎓 I've earned ${expertData.credits} credits on SAPclub as a verified SAP ${expertData.certModule} expert!\n\nJoin us at https://sapclub.vercel.app`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://sapclub.vercel.app&summary=${text}`, "_blank");
  };

  return (
    <div className="animate-in">
      {/* Greeting */}
      <div style={{ marginBottom: isMobile?"20px":"32px" }}>
        <p style={{ fontSize:"12px", ...txt(0.35), fontWeight:"600", letterSpacing:"0.08em", marginBottom:"8px", textTransform:"uppercase" }}>
          {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
        </p>
        <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize: isMobile?"26px":"36px", fontWeight:"800", ...txt(1), letterSpacing:"-0.03em", marginBottom:"6px", lineHeight:1.1 }}>
          {greeting} 👋
        </h1>
        <p style={{ ...txt(0.45), fontSize: isMobile?"13px":"15px" }}>Welcome to SAPclub — your SAP community hub.</p>
      </div>

      {/* Expert credits banner */}
      {expertData && (
        <div style={{ background: dm?"rgba(255,184,0,0.08)":"rgba(255,184,0,0.06)", border:"1px solid rgba(255,184,0,0.2)", borderRadius:"16px", padding:"16px 20px", marginBottom:"20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px", flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ fontSize:"28px" }}>⚡</div>
            <div>
              <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"20px", fontWeight:"800", color:"#FFB800" }}>{expertData.credits || 0} Credits</p>
              <p style={{ fontSize:"12px", color:dm?"#7A95BE":"#4A6080" }}>Verified {expertData.certModule} Expert · {expertData.certId}</p>
            </div>
          </div>
          <button onClick={shareOnLinkedIn} style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(10,102,194,0.15)", color:"#5BA4FF", border:"1px solid rgba(10,102,194,0.3)", borderRadius:"10px", padding:"9px 18px", cursor:"pointer", fontSize:"13px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", transition:"all .2s" }}>
            <span style={{ fontSize:"16px" }}>💼</span> Share on LinkedIn
          </button>
        </div>
      )}

      {/* Stats — 1 col on mobile, 3 on desktop */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(3,1fr)", gap:"12px", marginBottom:"16px" }}>
        {[
          { label:"Open Doubts",    value:stats.openDoubts,    color:"#4D8EFF", glow:"rgba(0,102,255,0.3)"  },
          { label:"Total Resolved", value:stats.resolvedToday, color:"#00E5A0", glow:"rgba(0,229,160,0.3)"  },
          { label:"Active Members", value:stats.activeMembers, color:"#FFB800", glow:"rgba(255,184,0,0.3)"  },
        ].map(s=>(
          <div key={s.label} className="glass" style={{ padding: isMobile?"14px 16px":"22px 24px" }}>
            <p className="section-label" style={{ marginBottom:"8px", fontSize:"9px" }}>{s.label}</p>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize: isMobile?"24px":"32px", fontWeight:"800", color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions + Leaderboard — stack on mobile */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
        <div className="glass" style={{ padding:"20px" }}>
          <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"14px", fontWeight:"700", ...txt(1), marginBottom:"14px" }}>Quick Actions</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {[
              { label:"Ask a Doubt",     nav:"Doubts",     color:"#4D8EFF", bg:"rgba(0,102,255,0.1)",    border:"rgba(0,102,255,0.2)",   icon:"◎" },
              { label:"Resolve a Doubt", nav:"Doubts",     color:"#00E5A0", bg:"rgba(0,229,160,0.08)",   border:"rgba(0,229,160,0.2)",   icon:"◉" },
              { label:"Open Chats",      nav:"Chats",      color:"#A78BFA", bg:"rgba(167,139,250,0.08)", border:"rgba(167,139,250,0.2)", icon:"◈" },
              { label:"Learn SAP",       nav:"Learn",      color:"#FB923C", bg:"rgba(251,146,60,0.08)",  border:"rgba(251,146,60,0.2)",  icon:"📚" },
            ].map(a=>(
              <button key={a.label} onClick={()=>setActive(a.nav)} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", borderRadius:"12px", background:a.bg, color:a.color, border:`1px solid ${a.border}`, cursor:"pointer", fontSize:"13px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", transition:"all .2s", textAlign:"left", width:"100%" }}>
                <span style={{ fontSize:"15px" }}>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding:"20px" }}>
          <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"14px", fontWeight:"700", ...txt(1), marginBottom:"14px" }}>⚡ Expert Leaderboard</p>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign:"center", padding:"20px 0", color:dm?"#3A5070":"#8AAAC0" }}>
              <p style={{ fontSize:"28px", marginBottom:"8px" }}>🏆</p>
              <p style={{ fontSize:"13px" }}>No experts yet — be the first!</p>
            </div>
          ) : (
            <div style={{ display:"grid", gap:"8px" }}>
              {leaderboard.map((expert, i) => (
                <div key={expert.uid||i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 12px", borderRadius:"10px", background:i===0?(dm?"rgba(255,184,0,0.08)":"rgba(255,184,0,0.05)"):(dm?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.5)"), border:`1px solid ${i===0?"rgba(255,184,0,0.2)":(dm?"rgba(255,255,255,0.06)":"rgba(0,102,255,0.08)")}` }}>
                  <span style={{ fontSize:"15px", width:"22px", textAlign:"center" }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}</span>
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <p style={{ fontSize:"13px", fontWeight:"700", ...txt(1), overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{expert.name}</p>
                    <p style={{ fontSize:"10px", color:dm?"#3A5070":"#8AAAC0" }}>{expert.certModule} Expert</p>
                  </div>
                  <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"13px", fontWeight:"800", color:"#FFB800" }}>⚡{expert.credits}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── DOUBTS PAGE ──────────────────────────────────────── */
function DoubtsPage({ darkMode }) {
  const [tab, setTab] = useState("ask");
  const dm = darkMode;
  const textPrimary = dm ? "#F0F6FF" : "#0A1128";
  const textSec     = dm ? "#7A95BE" : "#4A6080";
  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", animation:"fadeInUp .4s ease" }}>
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"28px", fontWeight:"800", color:textPrimary, letterSpacing:"-0.02em", marginBottom:"4px" }}>Doubts</h1>
        <p style={{ color:textSec, fontSize:"14px" }}>Ask questions or resolve them as a verified expert</p>
      </div>
      <div style={{ display:"flex", gap:"8px", marginBottom:"28px", flexWrap:"wrap" }}>
        {[
          { id:"ask",     label:"◎ Ask a Doubt" },
          { id:"resolve", label:"◉ Resolve a Doubt" },
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"9px 20px", borderRadius:"12px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", transition:"all .2s", background: tab===t.id?"#0066FF":(dm?"rgba(255,255,255,0.05)":"rgba(0,102,255,0.06)"), color: tab===t.id?"white":textSec, boxShadow: tab===t.id?"0 4px 14px rgba(0,102,255,0.4)":"none" }}>{t.label}</button>
        ))}
      </div>
      {tab === "ask"     && <AskDoubt darkMode={darkMode} />}
      {tab === "resolve" && <ResolveDoubt darkMode={darkMode} />}
    </div>
  );
}

/* ── SAP GLOBAL ───────────────────────────────────────── */
function SapGlobal({ goBack, darkMode }) {
  const dm = darkMode;
  const textPrimary = dm ? "#F0F6FF" : "#0A1128";
  const textSec     = dm ? "#6B82A8" : "#4A6080";
  return (
    <div className="animate-in">
      <button onClick={goBack} style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"none", border:"none", cursor:"pointer", color:dm?"#6B82A8":"#4A6080", fontSize:"13px", fontFamily:"'Outfit',sans-serif", marginBottom:"28px", transition:"color .2s" }}
        onMouseEnter={e=>e.currentTarget.style.color="#4D8EFF"}
        onMouseLeave={e=>e.currentTarget.style.color=dm?"#6B82A8":"#4A6080"}
      >← Back</button>
      <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"28px", fontWeight:"800", color:textPrimary, letterSpacing:"-0.02em", marginBottom:"6px" }}>SAP Global</h1>
      <p style={{ color:textSec, fontSize:"14px", marginBottom:"28px" }}>Latest news, updates and releases from SAP.</p>
      <div style={{ display:"grid", gap:"12px" }}>
        {[
          { title:"SAP Newsroom",     desc:"Official news, press releases and announcements.",      url:"https://news.sap.com",        color:"#4D8EFF" },
          { title:"SAP Community",    desc:"Questions, answers and discussions from SAP experts.",  url:"https://community.sap.com",   color:"#00E5A0" },
          { title:"SAP Learning Hub", desc:"Courses, certifications and learning paths.",           url:"https://learning.sap.com",    color:"#FFB800" },
          { title:"SAP Help Portal",  desc:"Official documentation and product guides.",            url:"https://help.sap.com",        color:"#A78BFA" },
        ].map(item=>(
          <div key={item.title} className="glass" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", padding:"16px 20px", transition:"all .2s", flexWrap:"wrap" }}
            onMouseEnter={e=>{ e.currentTarget.style.transform="translateX(4px)"; e.currentTarget.style.borderColor=`${item.color}30`; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="translateX(0)"; e.currentTarget.style.borderColor=""; }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:"14px", flex:1, minWidth:0 }}>
              <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:item.color, boxShadow:`0 0 10px ${item.color}`, flexShrink:0 }} />
              <div style={{ minWidth:0 }}>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:"700", fontSize:"14px", color:textPrimary }}>{item.title}</p>
                <p style={{ fontSize:"12px", color:textSec, marginTop:"2px" }}>{item.desc}</p>
              </div>
            </div>
            <a href={item.url} target="_blank" rel="noreferrer" style={{ padding:"7px 16px", borderRadius:"10px", background:`${item.color}18`, color:item.color, fontSize:"12px", fontWeight:"700", textDecoration:"none", whiteSpace:"nowrap", border:`1px solid ${item.color}30`, fontFamily:"'Outfit',sans-serif", transition:"all .2s", flexShrink:0 }}>Visit ↗</a>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── COMING SOON ──────────────────────────────────────── */
function ComingSoon({ label, icon, goBack, darkMode }) {
  const dm = darkMode;
  const textPrimary = dm ? "#F0F6FF" : "#0A1128";
  const textSec     = dm ? "#6B82A8" : "#4A6080";
  return (
    <div className="animate-in">
      <button onClick={goBack} style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"none", border:"none", cursor:"pointer", color:dm?"#6B82A8":"#4A6080", fontSize:"13px", fontFamily:"'Outfit',sans-serif", marginBottom:"28px", transition:"color .2s" }}>← Back</button>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center" }}>
        <div style={{ width:"88px", height:"88px", borderRadius:"28px", background:"rgba(0,102,255,0.1)", border:"1px solid rgba(0,102,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"40px", marginBottom:"28px" }}>{icon}</div>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"26px", fontWeight:"800", color:textPrimary, marginBottom:"10px" }}>{label}</h2>
        <p style={{ color:textSec, fontSize:"14px", maxWidth:"280px", lineHeight:"1.7" }}>This feature is coming soon.<br/>We're building something great! 🚧</p>
      </div>
    </div>
  );
}

/* ── PROFILE ──────────────────────────────────────────── */
function ProfilePage({ user, profile, setProfile, goBack, uid, darkMode }) {
  const [editing, setEditing]       = useState(false);
  const [tempEmoji, setTempEmoji]   = useState(profile.emoji);
  const [tempName, setTempName]     = useState(profile.name);
  const [saving, setSaving]         = useState(false);
  const [expertData, setExpertData] = useState(null);
  const dm = darkMode;
  const txt = (op=1) => ({ color: dm?`rgba(240,246,255,${op})`:`rgba(10,17,40,${op})` });

  useEffect(() => {
    getDoc(doc(db,"experts",uid)).then(s=>{ if(s.exists()) setExpertData(s.data()); });
  }, [uid]);

  const save = async () => {
    setSaving(true);
    const updated = { ...profile, emoji:tempEmoji, name:tempName };
    await setDoc(doc(db,"users",uid), updated);
    setProfile(updated);
    setSaving(false);
    setEditing(false);
  };

  const shareOnLinkedIn = () => {
    if (!expertData) return;
    const text = encodeURIComponent(`🎓 I've earned ${expertData.credits} credits on SAPclub as a verified SAP ${expertData.certModule} expert! Join us at https://sapclub.vercel.app`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://sapclub.vercel.app&summary=${text}`, "_blank");
  };

  return (
    <div className="animate-in">
      <button onClick={goBack} style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"none", border:"none", cursor:"pointer", color:dm?"#6B82A8":"#4A6080", fontSize:"13px", fontFamily:"'Outfit',sans-serif", marginBottom:"28px", transition:"color .2s" }}>← Back</button>
      <div style={{ maxWidth:"560px" }}>
        <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"28px", fontWeight:"800", ...txt(1), marginBottom:"28px", letterSpacing:"-0.02em" }}>My Profile</h1>

        <div className="glass" style={{ padding:"32px 24px", marginBottom:"16px", textAlign:"center" }}>
          <div className="avatar-ring" style={{ width:"80px", height:"80px", fontSize:"42px", margin:"0 auto 16px", boxShadow:"0 0 40px rgba(0,102,255,0.4)" }}>
            {editing?tempEmoji:profile.emoji}
          </div>
          {editing && (
            <>
              <p style={{ fontSize:"12px", color:"#6B82A8", marginBottom:"14px" }}>Choose your avatar</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", justifyContent:"center", marginBottom:"16px" }}>
                {EMOJIS.map(e=>(
                  <div key={e} onClick={()=>setTempEmoji(e)} style={{ fontSize:"22px", padding:"6px", borderRadius:"10px", cursor:"pointer", border:`2px solid ${tempEmoji===e?"#0066FF":"transparent"}`, background:tempEmoji===e?"rgba(0,102,255,0.15)":"transparent", transition:"all .15s" }}>{e}</div>
                ))}
              </div>
            </>
          )}
          <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"20px", fontWeight:"800", ...txt(1) }}>{profile.name||user.email.split("@")[0]}</p>
          <p style={{ fontSize:"13px", ...txt(0.4), marginTop:"4px" }}>{user.email}</p>
        </div>

        {expertData && (
          <div style={{ background:dm?"rgba(255,184,0,0.08)":"rgba(255,184,0,0.05)", border:"1px solid rgba(255,184,0,0.2)", borderRadius:"16px", padding:"16px 20px", marginBottom:"16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"22px" }}>🎓</span>
              <div>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"14px", fontWeight:"800", color:"#FFB800" }}>Verified SAP Expert</p>
                <p style={{ fontSize:"12px", color:dm?"#7A95BE":"#4A6080" }}>{expertData.certModule} · {expertData.certId} · <span style={{ color:"#FFB800", fontWeight:"700" }}>⚡{expertData.credits||0} credits</span></p>
              </div>
            </div>
            <button onClick={shareOnLinkedIn} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(10,102,194,0.15)", color:"#5BA4FF", border:"1px solid rgba(10,102,194,0.3)", borderRadius:"10px", padding:"8px 14px", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif" }}>💼 Share on LinkedIn</button>
          </div>
        )}

        <div className="glass" style={{ padding:"24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:"700", ...txt(1), fontSize:"15px" }}>Profile Info</p>
            {!editing && <button onClick={()=>setEditing(true)} style={{ background:"rgba(0,102,255,0.1)", color:"#4D8EFF", border:"1px solid rgba(0,102,255,0.2)", borderRadius:"8px", padding:"6px 14px", cursor:"pointer", fontSize:"12px", fontFamily:"'Outfit',sans-serif", fontWeight:"700" }}>Edit</button>}
          </div>
          <div style={{ display:"grid", gap:"18px" }}>
            {[
              { label:"Display Name", value:profile.name, editable:true },
              { label:"SAPclub ID",   value:profile.sapId, editable:false },
              { label:"Email",        value:user.email, editable:false },
            ].map(f=>(
              <div key={f.label}>
                <p className="section-label" style={{ marginBottom:"6px" }}>{f.label}</p>
                {editing&&f.editable ? (
                  <input value={tempName} onChange={e=>setTempName(e.target.value)} className="input-premium" style={{ background:dm?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.8)", color:dm?"#F0F6FF":"#0A1128" }} />
                ) : (
                  <p style={{ fontSize:"14px", fontWeight:"600", ...txt(0.85) }}>{f.value}</p>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <div style={{ display:"flex", gap:"10px", marginTop:"22px" }}>
              <button onClick={save} className="btn-primary">{saving?"Saving…":"Save Changes"}</button>
              <button onClick={()=>setEditing(false)} className="btn-ghost">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}