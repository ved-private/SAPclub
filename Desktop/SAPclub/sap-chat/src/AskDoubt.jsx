import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, getDoc, updateDoc, arrayUnion
} from "firebase/firestore";
import { sendNotification } from "./Notifications";
 
const SAP_MODULES = ["All","FI","MM","SD","CO","HR","PP","WM","PM"];
const CREDITS_BEST = 25;
 
export default function AskDoubt({ darkMode }) {
  const [doubts, setDoubts]               = useState([]);
  const [title, setTitle]                 = useState("");
  const [description, setDescription]     = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [filterModule, setFilterModule]   = useState("All");
  const [showForm, setShowForm]           = useState(false);
  const [myProfile, setMyProfile]         = useState({});
  const [expandedId, setExpandedId]       = useState(null);
  const [activeTab, setActiveTab]         = useState("ask"); // ask | history
  const currentUser = auth.currentUser;
 
  const dm = darkMode;
  const cardBg      = dm ? "rgba(10,17,40,0.7)"    : "rgba(255,255,255,0.65)";
  const cardBorder  = dm ? "rgba(255,255,255,0.08)" : "rgba(0,102,255,0.1)";
  const textPrimary = dm ? "#F0F6FF" : "#0A1128";
  const textSec     = dm ? "#7A95BE" : "#4A6080";
  const textMuted   = dm ? "#3A5070" : "#8AAAC0";
  const inputBg     = dm ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)";
 
  useEffect(() => {
    getDoc(doc(db,"users",currentUser.uid)).then(s=>{ if(s.exists()) setMyProfile(s.data()); });
    const q = query(collection(db,"doubts"), orderBy("createdAt","desc"));
    return onSnapshot(q, snap => setDoubts(snap.docs.map(d=>({id:d.id,...d.data()}))));
  }, []);
 
  const postDoubt = async () => {
    if (!title.trim()||!description.trim()||!selectedModule) return;
    await addDoc(collection(db,"doubts"), {
      title: title.trim(), description: description.trim(),
      module: selectedModule,
      authorId: currentUser.uid,
      authorName: myProfile.name||currentUser.email,
      authorEmoji: myProfile.emoji||"🧑‍💻",
      resolved: false, answers: [],
      createdAt: serverTimestamp(),
    });
    setTitle(""); setDescription(""); setSelectedModule(""); setShowForm(false);
  };
 
  const markBestAnswer = async (doubt, answerId) => {
    const updated = doubt.answers.map(a => ({ ...a, isBest: a.id === answerId }));
    await updateDoc(doc(db,"doubts",doubt.id), { answers: updated, resolved: true });
    const best = doubt.answers.find(a => a.id === answerId);
    if (best?.authorId) {
      const expertSnap = await getDoc(doc(db,"experts",best.authorId));
      if (expertSnap.exists()) {
        const newCredits = (expertSnap.data().credits||0) + CREDITS_BEST;
        await updateDoc(doc(db,"experts",best.authorId), { credits: newCredits });
        await sendNotification(best.authorId, "best", `⭐ Your answer was marked Best Answer! +${CREDITS_BEST} credits earned.`);
        await sendNotification(currentUser.uid, "resolved", `✅ Your doubt "${doubt.title.slice(0,40)}..." has been resolved!`);
      }
    }
  };
 
  const markResolved = async (doubtId, doubtTitle) => {
    await updateDoc(doc(db,"doubts",doubtId), { resolved: true });
    await sendNotification(currentUser.uid, "resolved", `✅ Doubt "${doubtTitle.slice(0,40)}..." marked as resolved.`);
  };
 
  const filtered = filterModule==="All"
    ? doubts.filter(d => !d.resolved)
    : doubts.filter(d => !d.resolved && d.module===filterModule);
 
  const myHistory = doubts.filter(d => d.resolved && d.authorId === currentUser.uid);
 
  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", animation:"fadeInUp .4s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" }}>
        <div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"28px", fontWeight:"800", color:textPrimary, letterSpacing:"-0.02em", marginBottom:"4px" }}>Ask a Doubt</h1>
          <p style={{ color:textSec, fontSize:"14px" }}>Post your SAP questions — get answers from verified experts</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary" style={{ padding:"10px 20px", fontSize:"13px" }}>+ Ask Question</button>
      </div>
 
      {/* Tab switcher */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
        {[
          { id:"ask",     label:"◎ Open Doubts" },
          { id:"history", label:"🔒 My History" },
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            padding:"8px 18px", borderRadius:"10px", border:"none", cursor:"pointer",
            fontSize:"13px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", transition:"all .2s",
            background: activeTab===t.id ? "#0066FF" : (dm?"rgba(255,255,255,0.05)":"rgba(0,102,255,0.06)"),
            color: activeTab===t.id ? "white" : textSec,
            boxShadow: activeTab===t.id ? "0 4px 14px rgba(0,102,255,0.4)" : "none",
          }}>{t.label}</button>
        ))}
      </div>
 
      {/* Module Filter */}
      {activeTab==="ask" && (
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"20px" }}>
        {SAP_MODULES.map(m=>(
          <span key={m} onClick={()=>setFilterModule(m)} style={{
            padding:"6px 14px", borderRadius:"8px", fontSize:"11px", fontWeight:"800",
            cursor:"pointer", transition:"all .2s", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"0.06em",
            background: filterModule===m ? "#0066FF" : (dm?"rgba(0,102,255,0.08)":"rgba(0,102,255,0.06)"),
            color: filterModule===m ? "white" : "#4D8EFF",
            border:`1px solid ${filterModule===m?"#0066FF":"rgba(0,102,255,0.2)"}`,
            boxShadow: filterModule===m ? "0 0 16px rgba(0,102,255,0.4)" : "none",
          }}>{m}</span>
        ))}
      </div>
      )}
 
      {/* Form */}
      {activeTab==="ask" && showForm && (
        <div style={{ background:cardBg, border:"1px solid rgba(0,102,255,0.25)", borderRadius:"20px", padding:"24px", marginBottom:"24px", backdropFilter:"blur(24px)", boxShadow:"0 0 40px rgba(0,102,255,0.1)" }}>
          <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:"700", color:textPrimary, fontSize:"15px", marginBottom:"16px" }}>New Question</p>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Question title..." className="input-premium" style={{ marginBottom:"12px", background:inputBg, color:textPrimary }} />
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe your doubt in detail..." rows={4} className="input-premium" style={{ marginBottom:"16px", resize:"vertical", background:inputBg, color:textPrimary }} />
          <p style={{ fontSize:"11px", color:textMuted, fontWeight:"700", letterSpacing:"0.1em", marginBottom:"10px" }}>SELECT MODULE</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"20px" }}>
            {SAP_MODULES.filter(m=>m!=="All").map(m=>(
              <span key={m} onClick={()=>setSelectedModule(m)} style={{
                padding:"6px 14px", borderRadius:"8px", fontSize:"12px", fontWeight:"800",
                cursor:"pointer", transition:"all .15s", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"0.04em",
                background: selectedModule===m ? "#0066FF" : (dm?"rgba(0,102,255,0.08)":"rgba(0,102,255,0.06)"),
                color: selectedModule===m ? "white" : "#4D8EFF",
                border:`1px solid ${selectedModule===m?"#0066FF":"rgba(0,102,255,0.2)"}`,
                boxShadow: selectedModule===m ? "0 0 12px rgba(0,102,255,0.4)" : "none"
              }}>{m}</span>
            ))}
          </div>
          <div style={{ display:"flex", gap:"10px" }}>
            <button onClick={postDoubt} className="btn-primary">Post Question</button>
            <button onClick={()=>setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}
 
      {/* List */}
      {activeTab==="ask" && (
      <div style={{ display:"grid", gap:"14px" }}>
        {filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"80px 0", color:textSec }}>
            <div style={{ fontSize:"48px", marginBottom:"16px" }}>🤔</div>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"18px", fontWeight:"700", color:textPrimary, marginBottom:"8px" }}>No questions yet</p>
            <p style={{ fontSize:"14px" }}>Be the first to ask!</p>
          </div>
        )}
        {filtered.map(doubt=>(
          <div key={doubt.id} style={{ background:cardBg, border:`1px solid ${doubt.resolved?"rgba(0,229,160,0.25)":cardBorder}`, borderRadius:"20px", backdropFilter:"blur(24px)", boxShadow:doubt.resolved?"0 4px 24px rgba(0,229,160,0.08)":"0 4px 24px rgba(0,0,0,0.2)", overflow:"hidden", transition:"all .2s" }}>
            <div style={{ padding:"20px 24px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px", flexWrap:"wrap" }}>
                    <span style={{ background:"rgba(0,102,255,0.12)", color:"#4D8EFF", fontSize:"11px", fontWeight:"800", padding:"3px 10px", borderRadius:"6px", border:"1px solid rgba(0,102,255,0.2)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"0.06em" }}>{doubt.module}</span>
                    {doubt.resolved && <span style={{ background:"rgba(0,229,160,0.1)", color:"#00E5A0", fontSize:"11px", fontWeight:"700", padding:"3px 10px", borderRadius:"6px", border:"1px solid rgba(0,229,160,0.2)" }}>✓ RESOLVED</span>}
                    <span style={{ background:"rgba(255,255,255,0.04)", color:textMuted, fontSize:"11px", padding:"3px 10px", borderRadius:"6px", border:`1px solid ${cardBorder}` }}>{doubt.answers?.length||0} answer{doubt.answers?.length!==1?"s":""}</span>
                  </div>
                  <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"16px", fontWeight:"700", color:textPrimary, marginBottom:"8px", lineHeight:1.4 }}>{doubt.title}</h3>
                  <p style={{ color:textSec, fontSize:"14px", lineHeight:"1.6", marginBottom:"12px" }}>{doubt.description}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px" }}>{doubt.authorEmoji}</div>
                    <span style={{ fontSize:"12px", color:textMuted, fontWeight:"500" }}>{doubt.authorName}</span>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px", alignItems:"flex-end" }}>
                  {doubt.authorId===currentUser.uid && !doubt.resolved && (
                    <button onClick={()=>markResolved(doubt.id, doubt.title)} style={{ background:"rgba(0,229,160,0.1)", color:"#00E5A0", border:"1px solid rgba(0,229,160,0.2)", borderRadius:"10px", padding:"7px 14px", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap", transition:"all .2s" }}>Mark Resolved</button>
                  )}
                  <button onClick={()=>setExpandedId(expandedId===doubt.id?null:doubt.id)} style={{ background:"rgba(0,102,255,0.08)", color:"#4D8EFF", border:"1px solid rgba(0,102,255,0.2)", borderRadius:"10px", padding:"7px 14px", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap", transition:"all .2s" }}>
                    {expandedId===doubt.id?"Hide":"View Answers"}
                  </button>
                </div>
              </div>
            </div>
            {expandedId===doubt.id && (
              <div style={{ borderTop:`1px solid ${cardBorder}`, padding:"20px 24px", background:dm?"rgba(0,0,0,0.15)":"rgba(0,102,255,0.02)" }}>
                {(doubt.answers||[]).length>0 && (
                  <div style={{ marginBottom:"20px", display:"grid", gap:"12px" }}>
                    {doubt.answers.map(ans=>(
                      <div key={ans.id} style={{ background:ans.isBest?(dm?"rgba(0,229,160,0.08)":"rgba(0,229,160,0.05)"):(dm?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.7)"), border:`1px solid ${ans.isBest?"rgba(0,229,160,0.3)":cardBorder}`, borderRadius:"14px", padding:"14px 18px", boxShadow:ans.isBest?"0 0 20px rgba(0,229,160,0.1)":"none" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px", flexWrap:"wrap" }}>
                              <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px" }}>{ans.authorEmoji}</div>
                              <span style={{ fontSize:"12px", color:textMuted, fontWeight:"600" }}>{ans.authorName}</span>
                              {ans.expertCertModule && <span style={{ fontSize:"10px", color:"#4D8EFF", background:"rgba(0,102,255,0.1)", padding:"2px 6px", borderRadius:"4px", fontWeight:"700" }}>🎓 {ans.expertCertModule}</span>}
                              {ans.isBest && <span style={{ background:"rgba(0,229,160,0.15)", color:"#00E5A0", fontSize:"10px", fontWeight:"800", padding:"2px 8px", borderRadius:"4px", border:"1px solid rgba(0,229,160,0.3)" }}>⭐ BEST ANSWER</span>}
                            </div>
                            <p style={{ fontSize:"14px", color:textPrimary, lineHeight:"1.6" }}>{ans.text}</p>
                          </div>
                          {doubt.authorId===currentUser.uid && !ans.isBest && !doubt.resolved && (
                            <button onClick={()=>markBestAnswer(doubt,ans.id)} style={{ background:"rgba(255,184,0,0.08)", color:"#FFB800", border:"1px solid rgba(255,184,0,0.2)", borderRadius:"8px", padding:"5px 12px", cursor:"pointer", fontSize:"11px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap", transition:"all .2s", flexShrink:0 }}
                              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 0 12px rgba(255,184,0,0.3)"}
                              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
                            >⭐ Best +{CREDITS_BEST}⚡</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      )}
 
      {/* MY HISTORY — private resolved doubts for this user only */}
      {activeTab==="history" && (
        <div style={{ display:"grid", gap:"14px" }}>
          {myHistory.length===0 ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:textSec }}>
              <div style={{ fontSize:"48px", marginBottom:"16px" }}>📭</div>
              <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"18px", fontWeight:"700", color:textPrimary, marginBottom:"8px" }}>No resolved doubts yet</p>
              <p style={{ fontSize:"14px" }}>Your resolved doubts will appear here privately.</p>
            </div>
          ) : myHistory.map(doubt=>(
            <div key={doubt.id} style={{ background:cardBg, border:"1px solid rgba(0,229,160,0.2)", borderRadius:"20px", backdropFilter:"blur(24px)", boxShadow:"0 4px 24px rgba(0,229,160,0.06)", overflow:"hidden" }}>
              <div style={{ padding:"20px 24px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px", flexWrap:"wrap" }}>
                      <span style={{ background:"rgba(0,102,255,0.12)", color:"#4D8EFF", fontSize:"11px", fontWeight:"800", padding:"3px 10px", borderRadius:"6px", border:"1px solid rgba(0,102,255,0.2)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"0.06em" }}>{doubt.module}</span>
                      <span style={{ background:"rgba(0,229,160,0.1)", color:"#00E5A0", fontSize:"11px", fontWeight:"700", padding:"3px 10px", borderRadius:"6px", border:"1px solid rgba(0,229,160,0.2)" }}>✓ RESOLVED</span>
                      <span style={{ background:"rgba(255,255,255,0.04)", color:textMuted, fontSize:"11px", padding:"3px 10px", borderRadius:"6px", border:"1px solid rgba(0,102,255,0.1)" }}>{doubt.answers?.length||0} answer{doubt.answers?.length!==1?"s":""}</span>
                    </div>
                    <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"16px", fontWeight:"700", color:textPrimary, marginBottom:"8px", lineHeight:1.4 }}>{doubt.title}</h3>
                    <p style={{ color:textSec, fontSize:"14px", lineHeight:"1.6" }}>{doubt.description}</p>
                  </div>
                  <button onClick={()=>setExpandedId(expandedId===doubt.id?null:doubt.id)} style={{ background:"rgba(0,102,255,0.08)", color:"#4D8EFF", border:"1px solid rgba(0,102,255,0.2)", borderRadius:"10px", padding:"7px 14px", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap" }}>
                    {expandedId===doubt.id?"Hide":"View Answers"}
                  </button>
                </div>
              </div>
              {expandedId===doubt.id && (
                <div style={{ borderTop:"1px solid rgba(0,102,255,0.1)", padding:"20px 24px", background:dm?"rgba(0,0,0,0.15)":"rgba(0,102,255,0.02)" }}>
                  {(doubt.answers||[]).map(ans=>(
                    <div key={ans.id} style={{ background:ans.isBest?(dm?"rgba(0,229,160,0.08)":"rgba(0,229,160,0.05)"):(dm?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.7)"), border:"1px solid " + (ans.isBest?"rgba(0,229,160,0.3)":"rgba(0,102,255,0.1)"), borderRadius:"14px", padding:"14px 18px", marginBottom:"10px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px", flexWrap:"wrap" }}>
                        <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px" }}>{ans.authorEmoji}</div>
                        <span style={{ fontSize:"12px", color:textMuted, fontWeight:"600" }}>{ans.authorName}</span>
                        {ans.expertCertModule && <span style={{ fontSize:"10px", color:"#4D8EFF", background:"rgba(0,102,255,0.1)", padding:"2px 6px", borderRadius:"4px", fontWeight:"700" }}>🎓 {ans.expertCertModule}</span>}
                        {ans.isBest && <span style={{ background:"rgba(0,229,160,0.15)", color:"#00E5A0", fontSize:"10px", fontWeight:"800", padding:"2px 8px", borderRadius:"4px", border:"1px solid rgba(0,229,160,0.3)" }}>⭐ BEST ANSWER</span>}
                      </div>
                      <p style={{ fontSize:"14px", color:textPrimary, lineHeight:"1.6" }}>{ans.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}