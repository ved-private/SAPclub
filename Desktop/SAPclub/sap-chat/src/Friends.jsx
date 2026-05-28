import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection, getDocs, doc, getDoc, updateDoc,
  addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc
} from "firebase/firestore";
 
export default function Friends({ darkMode }) {
  const [tab, setTab]             = useState("friends"); // friends | find | requests
  const [friends, setFriends]     = useState([]);
  const [requests, setRequests]   = useState([]); // incoming
  const [allUsers, setAllUsers]   = useState([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [myFriendIds, setMyFriendIds] = useState([]);
  const [sentIds, setSentIds]     = useState([]);
  const currentUser = auth.currentUser;
 
  const dm = darkMode;
  const cardBg      = dm ? "rgba(10,17,40,0.7)"    : "rgba(255,255,255,0.65)";
  const cardBorder  = dm ? "rgba(255,255,255,0.08)" : "rgba(0,102,255,0.1)";
  const textPrimary = dm ? "#F0F6FF" : "#0A1128";
  const textSec     = dm ? "#7A95BE" : "#4A6080";
  const textMuted   = dm ? "#3A5070" : "#8AAAC0";
  const inputBg     = dm ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)";
 
  useEffect(() => {
    const load = async () => {
      // My friend IDs
      const mySnap = await getDoc(doc(db,"users",currentUser.uid));
      const ids = mySnap.exists() ? (mySnap.data().friends||[]) : [];
      setMyFriendIds(ids);
 
      // All users except me
      const usersSnap = await getDocs(collection(db,"users"));
      const all = usersSnap.docs
        .filter(d=>d.id!==currentUser.uid)
        .map(d=>({uid:d.id,...d.data()}));
      setAllUsers(all);
      setFriends(all.filter(u=>ids.includes(u.uid)));
      setLoading(false);
    };
    load();
 
    // Incoming requests — real time
    const q = query(collection(db,"friendRequests"), where("to","==",currentUser.uid), where("status","==","pending"));
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
 
    // Sent requests
    getDocs(query(collection(db,"friendRequests"), where("from","==",currentUser.uid), where("status","==","pending")))
      .then(snap => setSentIds(snap.docs.map(d=>d.data().to)));
 
    return () => unsub();
  }, []);
 
  const sendRequest = async (toUser) => {
    await addDoc(collection(db,"friendRequests"), {
      from: currentUser.uid,
      to:   toUser.uid,
      fromName: auth.currentUser.displayName || "Member",
      status: "pending",
      createdAt: serverTimestamp(),
    });
    setSentIds(prev=>[...prev, toUser.uid]);
  };
 
  const acceptRequest = async (req) => {
    // Add each other as friends
    await updateDoc(doc(db,"users",currentUser.uid), { friends: [...myFriendIds, req.from] });
    await getDoc(doc(db,"users",req.from)).then(async s => {
      const theirFriends = s.exists() ? (s.data().friends||[]) : [];
      await updateDoc(doc(db,"users",req.from), { friends: [...theirFriends, currentUser.uid] });
    });
    // Mark request accepted
    await updateDoc(doc(db,"friendRequests",req.id), { status:"accepted" });
    // Update local state
    const newFriend = allUsers.find(u=>u.uid===req.from);
    if (newFriend) setFriends(prev=>[...prev, newFriend]);
    setMyFriendIds(prev=>[...prev, req.from]);
    setRequests(prev=>prev.filter(r=>r.id!==req.id));
  };
 
  const declineRequest = async (req) => {
    await updateDoc(doc(db,"friendRequests",req.id), { status:"declined" });
    setRequests(prev=>prev.filter(r=>r.id!==req.id));
  };
 
  const removeFriend = async (friendUid) => {
    const newMine = myFriendIds.filter(id=>id!==friendUid);
    await updateDoc(doc(db,"users",currentUser.uid), { friends: newMine });
    await getDoc(doc(db,"users",friendUid)).then(async s => {
      if(s.exists()) {
        const theirs = (s.data().friends||[]).filter(id=>id!==currentUser.uid);
        await updateDoc(doc(db,"users",friendUid), { friends: theirs });
      }
    });
    setMyFriendIds(newMine);
    setFriends(prev=>prev.filter(u=>u.uid!==friendUid));
  };
 
  const q = search.toLowerCase();
  const filteredUsers = allUsers.filter(u =>
    !myFriendIds.includes(u.uid) &&
    (!q || (u.name||"").toLowerCase().includes(q) || (u.sapId||"").toLowerCase().includes(q))
  );
 
  const tabs = [
    { id:"friends",  label:"Friends",  count: friends.length },
    { id:"find",     label:"Find",     count: null },
    { id:"requests", label:"Requests", count: requests.length || null },
  ];
 
  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", animation:"fadeInUp .4s ease" }}>
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"28px", fontWeight:"800", color:textPrimary, letterSpacing:"-0.02em", marginBottom:"4px" }}>Connections</h1>
        <p style={{ color:textSec, fontSize:"14px" }}>Connect with SAP members to chat and collaborate</p>
      </div>
 
      {/* Tabs */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"24px" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"8px 18px", borderRadius:"10px", border:"none", cursor:"pointer",
            fontSize:"13px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", transition:"all .2s",
            background: tab===t.id?"#0066FF":(dm?"rgba(255,255,255,0.05)":"rgba(0,102,255,0.06)"),
            color: tab===t.id?"white":textSec,
            boxShadow: tab===t.id?"0 4px 14px rgba(0,102,255,0.4)":"none",
            position:"relative",
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ marginLeft:"6px", background: tab===t.id?"rgba(255,255,255,0.25)":"#FF4560", color:"white", fontSize:"10px", fontWeight:"800", padding:"1px 6px", borderRadius:"20px" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
 
      {/* FRIENDS LIST */}
      {tab==="friends" && (
        <div style={{ display:"grid", gap:"12px" }}>
          {friends.length===0 ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:textSec }}>
              <div style={{ fontSize:"48px", marginBottom:"16px" }}>👥</div>
              <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"18px", fontWeight:"700", color:textPrimary, marginBottom:"8px" }}>No connections yet</p>
              <p style={{ fontSize:"14px" }}>Go to "Find" tab to connect with members</p>
            </div>
          ) : friends.map(f=>(
            <div key={f.uid} style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:"16px", padding:"16px 20px", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", gap:"14px", transition:"all .2s" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                {f.emoji||"🧑‍💻"}
              </div>
              <div style={{ flex:1, overflow:"hidden" }}>
                <p style={{ fontSize:"14px", fontWeight:"700", color:textPrimary }}>{f.name||"Member"}</p>
                <p style={{ fontSize:"11px", color:textMuted, fontFamily:"'Space Grotesk',monospace" }}>{f.sapId}</p>
              </div>
              <button onClick={()=>removeFriend(f.uid)} style={{ background:"rgba(255,70,96,0.08)", color:"#FF7090", border:"1px solid rgba(255,70,96,0.15)", borderRadius:"8px", padding:"6px 12px", cursor:"pointer", fontSize:"11px", fontWeight:"700", fontFamily:"'Outfit',sans-serif" }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
 
      {/* FIND PEOPLE */}
      {tab==="find" && (
        <>
          <div style={{ position:"relative", marginBottom:"20px" }}>
            <span style={{ position:"absolute", left:"16px", top:"50%", transform:"translateY(-50%)", fontSize:"16px", color:textMuted }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or SAP ID..."
              style={{ width:"100%", padding:"13px 16px 13px 44px", background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:"14px", fontSize:"14px", color:textPrimary, outline:"none", fontFamily:"'Outfit',sans-serif", boxSizing:"border-box" }}
              onFocus={e=>{ e.target.style.borderColor="rgba(0,102,255,0.4)"; e.target.style.boxShadow="0 0 0 3px rgba(0,102,255,0.1)"; }}
              onBlur={e=>{ e.target.style.borderColor=cardBorder; e.target.style.boxShadow="none"; }}
            />
          </div>
          <div style={{ display:"grid", gap:"10px" }}>
            {filteredUsers.length===0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:textSec }}>
                <p style={{ fontSize:"32px", marginBottom:"12px" }}>🔍</p>
                <p style={{ fontSize:"14px" }}>No members found</p>
              </div>
            ) : filteredUsers.map(u=>(
              <div key={u.uid} style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:"14px", padding:"14px 18px", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>
                  {u.emoji||"🧑‍💻"}
                </div>
                <div style={{ flex:1, overflow:"hidden" }}>
                  <p style={{ fontSize:"14px", fontWeight:"700", color:textPrimary }}>{u.name||"Member"}</p>
                  <p style={{ fontSize:"11px", color:textMuted, fontFamily:"'Space Grotesk',monospace" }}>{u.sapId}</p>
                </div>
                {sentIds.includes(u.uid) ? (
                  <span style={{ fontSize:"12px", color:textMuted, fontWeight:"600" }}>Sent ✓</span>
                ) : (
                  <button onClick={()=>sendRequest(u)} style={{ background:"rgba(0,102,255,0.1)", color:"#4D8EFF", border:"1px solid rgba(0,102,255,0.2)", borderRadius:"8px", padding:"7px 14px", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", transition:"all .2s", whiteSpace:"nowrap" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(0,102,255,0.2)"}
                    onMouseLeave={e=>e.currentTarget.style.background="rgba(0,102,255,0.1)"}
                  >+ Connect</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
 
      {/* INCOMING REQUESTS */}
      {tab==="requests" && (
        <div style={{ display:"grid", gap:"12px" }}>
          {requests.length===0 ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:textSec }}>
              <div style={{ fontSize:"48px", marginBottom:"16px" }}>📭</div>
              <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"18px", fontWeight:"700", color:textPrimary, marginBottom:"8px" }}>No pending requests</p>
              <p style={{ fontSize:"14px" }}>When someone sends you a request, it'll appear here</p>
            </div>
          ) : requests.map(req=>{
            const sender = allUsers.find(u=>u.uid===req.from);
            return (
              <div key={req.id} style={{ background:cardBg, border:"1px solid rgba(0,102,255,0.2)", borderRadius:"16px", padding:"16px 20px", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                  {sender?.emoji||"🧑‍💻"}
                </div>
                <div style={{ flex:1, overflow:"hidden" }}>
                  <p style={{ fontSize:"14px", fontWeight:"700", color:textPrimary }}>{sender?.name||req.fromName||"Member"}</p>
                  <p style={{ fontSize:"11px", color:textMuted, fontFamily:"'Space Grotesk',monospace" }}>{sender?.sapId||""}</p>
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={()=>acceptRequest(req)} style={{ background:"rgba(0,229,160,0.1)", color:"#00E5A0", border:"1px solid rgba(0,229,160,0.2)", borderRadius:"8px", padding:"7px 14px", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif" }}>
                    Accept ✓
                  </button>
                  <button onClick={()=>declineRequest(req)} style={{ background:"rgba(255,70,96,0.08)", color:"#FF7090", border:"1px solid rgba(255,70,96,0.15)", borderRadius:"8px", padding:"7px 14px", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif" }}>
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}