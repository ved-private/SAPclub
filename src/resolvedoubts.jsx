import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection, query, orderBy, onSnapshot,
  serverTimestamp, doc, getDoc, updateDoc, setDoc, addDoc, arrayUnion
} from "firebase/firestore";
import { sendNotification } from "./Notifications";
 
const SAP_MODULES = ["FI","MM","SD","CO","HR","PP","WM","PM"];
const CREDITS_PER_ANSWER = 10;
const CREDITS_PER_BEST   = 25;
 
export default function ResolveDoubt({ darkMode }) {
  const [status, setStatus]         = useState("loading");
  const [expertData, setExpertData] = useState(null);
  const [doubts, setDoubts]         = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [answerText, setAnswerText] = useState({});
  const [myProfile, setMyProfile]   = useState({});
  const [filterModule, setFilterModule] = useState("All");
  const [certId, setCertId]         = useState("");
  const [certModule, setCertModule] = useState("");
  const [linkedIn, setLinkedIn]     = useState("");
  const [applying, setApplying]     = useState(false);
  const [applyError, setApplyError] = useState("");
  const currentUser = auth.currentUser;
 
  const dm = darkMode;
  const cardBg      = dm ? "rgba(10,17,40,0.7)"    : "rgba(255,255,255,0.65)";
  const cardBorder  = dm ? "rgba(255,255,255,0.08)" : "rgba(0,102,255,0.1)";
  const textPrimary = dm ? "#F0F6FF" : "#0A1128";
  const textSec     = dm ? "#7A95BE" : "#4A6080";
  const textMuted   = dm ? "#3A5070" : "#8AAAC0";
  const inputBg     = dm ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)";
 
  useEffect(() => {
    (async () => {
      const [profileSnap, expertSnap] = await Promise.all([
        getDoc(doc(db,"users",currentUser.uid)),
        getDoc(doc(db,"experts",currentUser.uid)),
      ]);
      if (profileSnap.exists()) setMyProfile(profileSnap.data());
      if (expertSnap.exists()) {
        const d = expertSnap.data();
        setExpertData(d);
        setStatus(d.approved ? "expert" : "pending");
      } else {
        setStatus("not_expert");
      }
    })();
 
    const q = query(collection(db,"doubts"), orderBy("createdAt","desc"));
    return onSnapshot(q, snap => setDoubts(snap.docs.map(d=>({id:d.id,...d.data()}))));
  }, []);
 
  const applyAsExpert = async () => {
    if (!certId.trim()||!certModule) { setApplyError("Fill all required fields."); return; }
    if (!/^[A-Z0-9_-]{5,25}$/.test(certId.toUpperCase())) { setApplyError("Invalid cert ID format — use alphanumeric chars."); return; }
    setApplying(true);
    try {
      const data = {
        uid: currentUser.uid,
        name: myProfile.name||currentUser.email,
        email: currentUser.email,
        emoji: myProfile.emoji||"🧑‍💻",
        certId: certId.toUpperCase(),
        certModule,
        linkedIn: linkedIn.trim(),
        approved: true,
        appliedAt: new Date().toISOString(),
        credits: 0,
        answersGiven: 0,
        bestAnswers: 0,
      };
      await setDoc(doc(db,"experts",currentUser.uid), data);
      setExpertData(data);
      setStatus("expert");
      await sendNotification(currentUser.uid,"credits",`🎓 Welcome! You're now a verified SAP ${certModule} Expert on SAPclub!`);
    } catch(e) { setApplyError("Error submitting. Try again."); }
    setApplying(false);
  };
 
  const postAnswer = async (doubt) => {
    const text = answerText[doubt.id]?.trim();
    if (!text) return;
    const answer = {
      id: Date.now().toString(),
      text,
      authorId: currentUser.uid,
      authorName: myProfile.name||currentUser.email,
      authorEmoji: myProfile.emoji||"🧑‍💻",
      isBest: false,
      createdAt: new Date().toISOString(),
      expertCertModule: expertData?.certModule||"",
    };
    const newCredits = (expertData?.credits||0) + CREDITS_PER_ANSWER;
    const newAnswers = (expertData?.answersGiven||0) + 1;
    await Promise.all([
      updateDoc(doc(db,"doubts",doubt.id), { answers: arrayUnion(answer) }),
      updateDoc(doc(db,"experts",currentUser.uid), { credits: newCredits, answersGiven: newAnswers }),
      sendNotification(doubt.authorId,"answer",`💬 ${myProfile.name||"An expert"} answered your doubt: "${doubt.title.slice(0,40)}..."`),
      sendNotification(currentUser.uid,"credits",`⚡ +${CREDITS_PER_ANSWER} credits for answering a doubt!`),
    ]);
    setExpertData(prev=>({...prev, credits:newCredits, answersGiven:newAnswers}));
    setAnswerText(prev=>({...prev,[doubt.id]:""}));
  };
 
  const filtered = doubts.filter(d => {
    if (d.resolved) return false;
    if (filterModule!=="All" && d.module!==filterModule) return false;
    return true;
  });
 
  // ── LOADING ──
  if (status==="loading") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", fontFamily:"'Outfit',sans-serif" }}>
      <div style={{ textAlign:"center", color:textSec }}>
        <div style={{ fontSize:"36px", marginBottom:"12px", animation:"pulseGlow 2s infinite" }}>⏳</div>
        <p>Loading...</p>
      </div>
    </div>
  );
 
  // ── NOT EXPERT ──
  if (status==="not_expert") return (
    <div style={{ fontFamily:"'Outfit',sans-serif", animation:"fadeInUp .4s ease" }}>
      <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"28px", fontWeight:"800", color:textPrimary, letterSpacing:"-0.02em", marginBottom:"6px" }}>Resolve a Doubt</h1>
      <p style={{ color:textSec, fontSize:"14px", marginBottom:"32px" }}>Only verified SAP experts can answer doubts. Submit your certification to get started.</p>
 
      <div style={{ maxWidth:"520px" }}>
        <div style={{ background:cardBg, border:"1px solid rgba(0,102,255,0.25)", borderRadius:"20px", padding:"28px", backdropFilter:"blur(24px)", boxShadow:"0 0 40px rgba(0,102,255,0.1)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"24px", paddingBottom:"20px", borderBottom:`1px solid ${cardBorder}` }}>
            <div style={{ width:"52px", height:"52px", borderRadius:"16px", background:"rgba(0,102,255,0.12)", border:"1px solid rgba(0,102,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", boxShadow:"0 0 24px rgba(0,102,255,0.2)" }}>🎓</div>
            <div>
              <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"17px", fontWeight:"700", color:textPrimary }}>Become a Verified Expert</p>
              <p style={{ fontSize:"12px", color:textSec, marginTop:"3px" }}>Earn credits. Help the SAP community.</p>
            </div>
          </div>
 
          {/* Benefits */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"24px" }}>
            {[
              { icon:"⚡", label:`+${CREDITS_PER_ANSWER} credits`, sub:"per answer" },
              { icon:"⭐", label:`+${CREDITS_PER_BEST} credits`, sub:"for best answer" },
              { icon:"💼", label:"LinkedIn badge", sub:"share your expertise" },
              { icon:"🏆", label:"Leaderboard", sub:"top experts featured" },
            ].map(b=>(
              <div key={b.label} style={{ background:dm?"rgba(255,255,255,0.03)":"rgba(0,102,255,0.04)", border:`1px solid ${cardBorder}`, borderRadius:"12px", padding:"12px 14px" }}>
                <p style={{ fontSize:"18px", marginBottom:"4px" }}>{b.icon}</p>
                <p style={{ fontSize:"13px", fontWeight:"700", color:textPrimary }}>{b.label}</p>
                <p style={{ fontSize:"11px", color:textMuted }}>{b.sub}</p>
              </div>
            ))}
          </div>
 
          <div style={{ display:"grid", gap:"14px" }}>
            <div>
              <p style={{ fontSize:"11px", color:textMuted, fontWeight:"700", letterSpacing:"0.1em", marginBottom:"6px" }}>SAP CERTIFICATION ID *</p>
              <input value={certId} onChange={e=>{setCertId(e.target.value.toUpperCase()); setApplyError("");}}
                placeholder="e.g. C_HRHPC_2311 or C_S4FTR_2021"
                className="input-premium"
                style={{ background:inputBg, color:textPrimary, fontFamily:"'Space Grotesk',monospace", letterSpacing:"1px" }}
              />
              <p style={{ fontSize:"11px", color:textMuted, marginTop:"4px" }}>Your official SAP certification number from SAP Learning Hub</p>
            </div>
            <div>
              <p style={{ fontSize:"11px", color:textMuted, fontWeight:"700", letterSpacing:"0.1em", marginBottom:"8px" }}>PRIMARY MODULE *</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {SAP_MODULES.map(m=>(
                  <span key={m} onClick={()=>setCertModule(m)} style={{
                    padding:"6px 14px", borderRadius:"8px", fontSize:"12px", fontWeight:"800",
                    cursor:"pointer", transition:"all .15s", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"0.04em",
                    background: certModule===m?"#0066FF":(dm?"rgba(0,102,255,0.08)":"rgba(0,102,255,0.06)"),
                    color: certModule===m?"white":"#4D8EFF",
                    border:`1px solid ${certModule===m?"#0066FF":"rgba(0,102,255,0.2)"}`,
                    boxShadow: certModule===m?"0 0 12px rgba(0,102,255,0.4)":"none"
                  }}>{m}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize:"11px", color:textMuted, fontWeight:"700", letterSpacing:"0.1em", marginBottom:"6px" }}>LINKEDIN PROFILE (optional)</p>
              <input value={linkedIn} onChange={e=>setLinkedIn(e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                className="input-premium"
                style={{ background:inputBg, color:textPrimary }}
              />
            </div>
          </div>
 
          {applyError && (
            <div style={{ background:"rgba(255,70,96,0.1)", border:"1px solid rgba(255,70,96,0.2)", borderRadius:"10px", padding:"10px 14px", marginTop:"14px" }}>
              <p style={{ fontSize:"13px", color:"#FF7090" }}>{applyError}</p>
            </div>
          )}
 
          <button onClick={applyAsExpert} className="btn-primary" style={{ marginTop:"20px", width:"100%", padding:"13px" }} disabled={applying}>
            {applying ? "Submitting..." : "Verify & Become an Expert →"}
          </button>
          <p style={{ fontSize:"11px", color:textMuted, textAlign:"center", marginTop:"10px", lineHeight:"1.6" }}>
            Your credentials will be verified. Start earning credits immediately.
          </p>
        </div>
      </div>
    </div>
  );
 
  // ── PENDING ──
  if (status==="pending") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", fontFamily:"'Outfit',sans-serif", textAlign:"center" }}>
      <div style={{ fontSize:"56px", marginBottom:"20px" }}>⏳</div>
      <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"22px", fontWeight:"800", color:textPrimary, marginBottom:"8px" }}>Verification Pending</h2>
      <p style={{ color:textSec, fontSize:"14px", maxWidth:"300px", lineHeight:"1.7" }}>Your application is under review. You'll be notified once approved.</p>
    </div>
  );
 
  // ── EXPERT VIEW ──
  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", animation:"fadeInUp .4s ease" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
        <div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"28px", fontWeight:"800", color:textPrimary, letterSpacing:"-0.02em", marginBottom:"4px" }}>Resolve a Doubt</h1>
          <p style={{ color:textSec, fontSize:"14px" }}>Help the community — earn credits for every answer</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", background:dm?"rgba(0,102,255,0.1)":"rgba(0,102,255,0.06)", border:"1px solid rgba(0,102,255,0.2)", borderRadius:"12px", padding:"8px 14px" }}>
            <span style={{ fontSize:"16px" }}>🎓</span>
            <div>
              <p style={{ fontSize:"11px", color:textMuted, fontWeight:"700", letterSpacing:"0.06em" }}>VERIFIED EXPERT</p>
              <p style={{ fontSize:"12px", color:"#4D8EFF", fontWeight:"700" }}>{expertData?.certModule} · {expertData?.certId}</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,184,0,0.1)", border:"1px solid rgba(255,184,0,0.2)", borderRadius:"10px", padding:"6px 12px" }}>
              <span style={{ fontSize:"13px" }}>⚡</span>
              <p style={{ fontSize:"13px", color:"#FFB800", fontWeight:"800", fontFamily:"'Space Grotesk',sans-serif" }}>{expertData?.credits||0} Credits</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(0,229,160,0.1)", border:"1px solid rgba(0,229,160,0.2)", borderRadius:"10px", padding:"6px 12px" }}>
              <span style={{ fontSize:"13px" }}>💬</span>
              <p style={{ fontSize:"13px", color:"#00E5A0", fontWeight:"800", fontFamily:"'Space Grotesk',sans-serif" }}>{expertData?.answersGiven||0} Answers</p>
            </div>
          </div>
        </div>
      </div>
 
      {/* Info bar */}
      <div style={{ background:dm?"rgba(0,102,255,0.06)":"rgba(0,102,255,0.04)", border:"1px solid rgba(0,102,255,0.12)", borderRadius:"12px", padding:"12px 18px", marginBottom:"20px", display:"flex", gap:"28px", flexWrap:"wrap", alignItems:"center" }}>
        {[
          { label:"Answer a doubt", value:`+${CREDITS_PER_ANSWER}⚡`, icon:"💬" },
          { label:"Best Answer", value:`+${CREDITS_PER_BEST}⚡`, icon:"⭐" },
          { label:"Open doubts", value:String(filtered.length), icon:"📋" },
        ].map(i=>(
          <div key={i.label} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"14px" }}>{i.icon}</span>
            <div>
              <p style={{ fontSize:"10px", color:textMuted, fontWeight:"700", letterSpacing:"0.06em" }}>{i.label.toUpperCase()}</p>
              <p style={{ fontSize:"13px", color:textPrimary, fontWeight:"700" }}>{i.value}</p>
            </div>
          </div>
        ))}
      </div>
 
      {/* Module Filter */}
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"20px" }}>
        {["All",...SAP_MODULES].map(m=>(
          <span key={m} onClick={()=>setFilterModule(m)} style={{
            padding:"6px 14px", borderRadius:"8px", fontSize:"11px", fontWeight:"800",
            cursor:"pointer", transition:"all .2s", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"0.06em",
            background: filterModule===m?"#0066FF":(dm?"rgba(0,102,255,0.08)":"rgba(0,102,255,0.06)"),
            color: filterModule===m?"white":"#4D8EFF",
            border:`1px solid ${filterModule===m?"#0066FF":"rgba(0,102,255,0.2)"}`,
            boxShadow: filterModule===m?"0 0 16px rgba(0,102,255,0.4)":"none",
          }}>{m}</span>
        ))}
      </div>
 
      {/* Doubts */}
      <div style={{ display:"grid", gap:"14px" }}>
        {filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"80px 0", color:textSec }}>
            <div style={{ fontSize:"48px", marginBottom:"16px" }}>🎉</div>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"18px", fontWeight:"700", color:textPrimary, marginBottom:"8px" }}>All caught up!</p>
            <p style={{ fontSize:"14px" }}>No open doubts right now. Check back soon!</p>
          </div>
        )}
        {filtered.map(doubt=>(
          <div key={doubt.id} style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:"20px", backdropFilter:"blur(24px)", boxShadow:"0 4px 24px rgba(0,0,0,0.2)", overflow:"hidden", transition:"border-color .2s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(0,102,255,0.2)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor=cardBorder}
          >
            <div style={{ padding:"20px 24px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px", flexWrap:"wrap" }}>
                    <span style={{ background:"rgba(0,102,255,0.12)", color:"#4D8EFF", fontSize:"11px", fontWeight:"800", padding:"3px 10px", borderRadius:"6px", border:"1px solid rgba(0,102,255,0.2)", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"0.06em" }}>{doubt.module}</span>
                    <span style={{ background:"rgba(255,255,255,0.04)", color:textMuted, fontSize:"11px", padding:"3px 10px", borderRadius:"6px", border:`1px solid ${cardBorder}` }}>{doubt.answers?.length||0} answer{doubt.answers?.length!==1?"s":""}</span>
                  </div>
                  <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"16px", fontWeight:"700", color:textPrimary, marginBottom:"8px", lineHeight:1.4 }}>{doubt.title}</h3>
                  <p style={{ color:textSec, fontSize:"14px", lineHeight:"1.6", marginBottom:"12px" }}>{doubt.description}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px" }}>{doubt.authorEmoji}</div>
                    <span style={{ fontSize:"12px", color:textMuted, fontWeight:"500" }}>{doubt.authorName}</span>
                  </div>
                </div>
                <button onClick={()=>setExpandedId(expandedId===doubt.id?null:doubt.id)} style={{
                  background: expandedId===doubt.id?"rgba(0,102,255,0.2)":"rgba(0,102,255,0.08)",
                  color:"#4D8EFF", border:"1px solid rgba(0,102,255,0.2)", borderRadius:"10px",
                  padding:"8px 16px", cursor:"pointer", fontSize:"12px", fontWeight:"700",
                  fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap", transition:"all .2s"
                }}>
                  {expandedId===doubt.id ? "Close" : `Answer +${CREDITS_PER_ANSWER}⚡`}
                </button>
              </div>
            </div>
 
            {expandedId===doubt.id && (
              <div style={{ borderTop:`1px solid ${cardBorder}`, padding:"20px 24px", background:dm?"rgba(0,0,0,0.15)":"rgba(0,102,255,0.02)" }}>
                {(doubt.answers||[]).length>0 && (
                  <div style={{ marginBottom:"16px", display:"grid", gap:"10px" }}>
                    {doubt.answers.map(ans=>(
                      <div key={ans.id} style={{ background:ans.isBest?(dm?"rgba(0,229,160,0.08)":"rgba(0,229,160,0.05)"):(dm?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.7)"), border:`1px solid ${ans.isBest?"rgba(0,229,160,0.3)":cardBorder}`, borderRadius:"12px", padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px", flexWrap:"wrap" }}>
                          <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px" }}>{ans.authorEmoji}</div>
                          <span style={{ fontSize:"12px", color:textMuted, fontWeight:"600" }}>{ans.authorName}</span>
                          {ans.expertCertModule && <span style={{ fontSize:"10px", color:"#4D8EFF", background:"rgba(0,102,255,0.1)", padding:"2px 6px", borderRadius:"4px", fontWeight:"700" }}>🎓 {ans.expertCertModule}</span>}
                          {ans.isBest && <span style={{ fontSize:"10px", color:"#00E5A0", background:"rgba(0,229,160,0.1)", padding:"2px 8px", borderRadius:"4px", fontWeight:"800", border:"1px solid rgba(0,229,160,0.2)" }}>⭐ BEST</span>}
                        </div>
                        <p style={{ fontSize:"14px", color:textPrimary, lineHeight:"1.6" }}>{ans.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display:"flex", gap:"10px" }}>
                  <input
                    value={answerText[doubt.id]||""}
                    onChange={e=>setAnswerText(prev=>({...prev,[doubt.id]:e.target.value}))}
                    onKeyDown={e=>e.key==="Enter"&&postAnswer(doubt)}
                    placeholder="Write your expert answer..."
                    className="input-premium"
                    style={{ flex:1, background:inputBg, color:textPrimary, padding:"10px 14px" }}
                  />
                  <button onClick={()=>postAnswer(doubt)} className="btn-primary" style={{ padding:"10px 20px", fontSize:"13px", whiteSpace:"nowrap" }}>
                    Post +{CREDITS_PER_ANSWER}⚡
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}