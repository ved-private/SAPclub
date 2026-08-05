import { useState, useEffect, useRef } from "react";
import { db, auth } from "./firebase";
import {
  collection, addDoc, query, orderBy, where,
  onSnapshot, serverTimestamp, doc, getDoc,
  updateDoc, arrayUnion, arrayRemove, getDocs, setDoc
} from "firebase/firestore";
 
const SAP_ROOMS = [
  { id:"general",       name:"General",       icon:"💬", desc:"General SAP discussion" },
  { id:"fi",            name:"FI",            icon:"💰", desc:"Financial Accounting" },
  { id:"mm",            name:"MM",            icon:"📦", desc:"Materials Management" },
  { id:"sd",            name:"SD",            icon:"🛒", desc:"Sales & Distribution" },
  { id:"co",            name:"CO",            icon:"📊", desc:"Controlling" },
  { id:"hr",            name:"HR",            icon:"👥", desc:"Human Resources" },
  { id:"announcements", name:"Announcements", icon:"📢", desc:"Official updates" },
];
 
async function sendNotificationHelper(userId, type, message) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId, type, message, read: false,
      createdAt: serverTimestamp(),
    });
  } catch(e) { console.error("Notif error:", e); }
}
 
export default function Chat({ darkMode }) {
  const [tab, setTab]                     = useState("direct");
  const [friends, setFriends]             = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allUsers, setAllUsers]           = useState([]);
  const [selectedUser, setSelectedUser]   = useState(null);
  const [selectedRoom, setSelectedRoom]   = useState(SAP_ROOMS[0]);
  const [messages, setMessages]           = useState([]);
  const [newMsg, setNewMsg]               = useState("");
  const [myProfile, setMyProfile]         = useState({});
  const [myData, setMyData]               = useState({ friends:[], pendingIn:[], pendingOut:[] });
  const [search, setSearch]               = useState("");
  const [addSearch, setAddSearch]         = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [customGroups, setCustomGroups]   = useState([]);
  const [showNewGroup, setShowNewGroup]   = useState(false);
  const [newGroupName, setNewGroupName]   = useState("");
  const [groupPicks, setGroupPicks]       = useState([]);
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;
 
  const dm = darkMode ?? !document.body.classList.contains("light");
  const sidebarBg  = dm ? "rgba(4,8,18,0.8)"      : "rgba(255,255,255,0.6)";
  const mainBg     = dm ? "rgba(6,11,24,0.5)"      : "rgba(240,244,255,0.4)";
  const cardBorder = dm ? "rgba(255,255,255,0.07)" : "rgba(0,102,255,0.1)";
  const textPrimary   = dm ? "#F0F6FF" : "#0A1128";
  const textSec       = dm ? "#7A95BE" : "#4A6080";
  const textMuted     = dm ? "#3A5070" : "#8AAAC0";
  const inputBg    = dm ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)";
  const itemHover  = dm ? "rgba(255,255,255,0.04)" : "rgba(0,102,255,0.04)";
 
  useEffect(() => {
    const loadMe = async () => {
      const pSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (pSnap.exists()) setMyProfile(pSnap.data());
 
      const fSnap = await getDoc(doc(db, "friendships", currentUser.uid));
      if (fSnap.exists()) {
        setMyData(fSnap.data());
      } else {
        await setDoc(doc(db, "friendships", currentUser.uid), { friends:[], pendingIn:[], pendingOut:[] });
      }
    };
    loadMe();
 
    const unsub = onSnapshot(doc(db, "friendships", currentUser.uid), snap => {
      if (snap.exists()) setMyData(snap.data());
    });
 
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setAllUsers(snap.docs.filter(d => d.id !== currentUser.uid).map(d => ({ uid:d.id, ...d.data() })));
    };
    loadUsers();
 
    return () => unsub();
  }, []);

  // Custom groups created from the friends list
  useEffect(() => {
    const gq = query(collection(db, "customGroups"), where("members", "array-contains", currentUser.uid));
    const unsubG = onSnapshot(gq, snap => {
      setCustomGroups(snap.docs.map(d => ({
        id: d.id, icon: "👥", isCustom: true, ...d.data(),
        desc: `${(d.data().members||[]).length} members`,
      })));
    });
    return () => unsubG();
  }, []);

  const createGroup = async () => {
    const name = newGroupName.trim();
    if (!name || groupPicks.length === 0) return;
    const ref = await addDoc(collection(db, "customGroups"), {
      name,
      members: [...groupPicks, currentUser.uid],
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    setShowNewGroup(false);
    setNewGroupName("");
    setGroupPicks([]);
    setTab("group");
    setSelectedRoom({ id: ref.id, name, icon: "👥", isCustom: true, desc: `${groupPicks.length + 1} members` });
  };

  useEffect(() => {
    if (!myData.friends?.length) { setFriends([]); return; }
    const loadFriends = async () => {
      const snaps = await Promise.all(myData.friends.map(uid => getDoc(doc(db, "users", uid))));
      setFriends(snaps.filter(s => s.exists()).map(s => ({ uid:s.id, ...s.data() })));
    };
    loadFriends();
  }, [myData.friends]);
 
  useEffect(() => {
    if (!myData.pendingIn?.length) { setPendingRequests([]); return; }
    const loadPending = async () => {
      const snaps = await Promise.all(myData.pendingIn.map(uid => getDoc(doc(db, "users", uid))));
      setPendingRequests(snaps.filter(s => s.exists()).map(s => ({ uid:s.id, ...s.data() })));
    };
    loadPending();
  }, [myData.pendingIn]);
 
  useEffect(() => {
    if (tab === "direct") {
      if (!selectedUser) return;
      const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
      const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
      return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id:d.id, ...d.data() }))));
    } else {
      const q = query(collection(db, "rooms", selectedRoom.id, "messages"), orderBy("createdAt", "asc"));
      return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id:d.id, ...d.data() }))));
    }
  }, [selectedUser, tab, selectedRoom]);
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);
 
  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    const payload = {
      text: newMsg.trim(),
      senderId: currentUser.uid,
      senderName: myProfile.name || currentUser.email,
      senderEmoji: myProfile.emoji || "🧑‍💻",
      createdAt: serverTimestamp(),
    };
    if (tab === "direct" && selectedUser) {
      const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
      await addDoc(collection(db, "chats", chatId, "messages"), payload);
    } else if (tab === "group") {
      await addDoc(collection(db, "rooms", selectedRoom.id, "messages"), payload);
    }
    setNewMsg("");
  };
 
  const sendFriendRequest = async (targetUid) => {
    if (myData.friends?.includes(targetUid) || myData.pendingOut?.includes(targetUid)) return;
    await updateDoc(doc(db, "friendships", currentUser.uid), { pendingOut: arrayUnion(targetUid) });
    const theirSnap = await getDoc(doc(db, "friendships", targetUid));
    if (theirSnap.exists()) {
      await updateDoc(doc(db, "friendships", targetUid), { pendingIn: arrayUnion(currentUser.uid) });
    } else {
      await setDoc(doc(db, "friendships", targetUid), { friends:[], pendingIn:[currentUser.uid], pendingOut:[] });
    }
    await sendNotificationHelper(targetUid, "answer", `👋 ${myProfile.name || "Someone"} sent you a friend request!`);
  };
 
  const acceptRequest = async (senderUid) => {
    await Promise.all([
      updateDoc(doc(db, "friendships", currentUser.uid), { friends:arrayUnion(senderUid), pendingIn:arrayRemove(senderUid) }),
      updateDoc(doc(db, "friendships", senderUid), { friends:arrayUnion(currentUser.uid), pendingOut:arrayRemove(currentUser.uid) }),
    ]);
    await sendNotificationHelper(senderUid, "answer", `✅ ${myProfile.name || "Someone"} accepted your friend request!`);
  };
 
  const declineRequest = async (senderUid) => {
    await Promise.all([
      updateDoc(doc(db, "friendships", currentUser.uid), { pendingIn:arrayRemove(senderUid) }),
      updateDoc(doc(db, "friendships", senderUid), { pendingOut:arrayRemove(currentUser.uid) }),
    ]);
  };
 
  const formatTime = ts => {
    if (!ts?.toDate) return "";
    return ts.toDate().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
  };
 
  const filteredFriends = friends.filter(u =>
    (u.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (u.username||"").toLowerCase().includes(search.toLowerCase()) ||
    (u.sapId||"").toLowerCase().includes(search.toLowerCase())
  );
 
  const addSearchResults = allUsers.filter(u => {
    const q = addSearch.toLowerCase().replace(/^@/,"");
    if (!q) return false;
    return (u.name||"").toLowerCase().includes(q) ||
      (u.username||"").toLowerCase().includes(q) ||
      (u.sapId||"").toLowerCase().includes(q) ||
      (u.email||"").toLowerCase().includes(q);
  });
 
  const chatReady = tab === "group" || (tab === "direct" && selectedUser);
  const chatTitle = tab === "group"
    ? `${selectedRoom.icon} ${selectedRoom.name}`
    : (selectedUser?.name || selectedUser?.email || "");
  const chatSubtitle = tab === "group" ? selectedRoom.desc : (selectedUser?.username ? `@${selectedUser.username}` : selectedUser?.sapId);
 
  return (
    <div style={{ display:"flex", height:"calc(100vh - 72px)", borderRadius:"20px", overflow:"hidden", border:`1px solid ${cardBorder}`, boxShadow:"0 20px 60px rgba(0,0,0,0.4)", fontFamily:"'Outfit',sans-serif" }}>
 
      {/* SIDEBAR */}
      <div style={{ width:"290px", minWidth:"290px", background:sidebarBg, borderRight:`1px solid ${cardBorder}`, display:"flex", flexDirection:"column", backdropFilter:"blur(24px)" }}>
 
        {/* Tabs */}
        <div style={{ display:"flex", padding:"14px 14px 0", gap:"6px" }}>
          {[{id:"direct",label:"💬 Direct"},{id:"group",label:"👥 Groups"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"8px", borderRadius:"10px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", transition:"all .2s", background:tab===t.id?"#0066FF":(dm?"rgba(255,255,255,0.04)":"rgba(0,102,255,0.06)"), color:tab===t.id?"white":textSec, boxShadow:tab===t.id?"0 4px 14px rgba(0,102,255,0.4)":"none" }}>{t.label}</button>
          ))}
        </div>
 
        {tab==="direct" && (
          <>
            <div style={{ padding:"10px 14px 6px" }}>
              <div style={{ display:"flex", gap:"6px" }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search friends..."
                  style={{ flex:1, padding:"8px 12px", background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:"10px", fontSize:"13px", color:textPrimary, outline:"none", fontFamily:"'Outfit',sans-serif", boxSizing:"border-box" }} />
                <button onClick={()=>setShowAddFriend(!showAddFriend)} style={{ width:"36px", height:"36px", borderRadius:"10px", background:showAddFriend?"#0066FF":"rgba(0,102,255,0.1)", border:"1px solid rgba(0,102,255,0.2)", cursor:"pointer", fontSize:"16px", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s", flexShrink:0 }}>➕</button>
              </div>
            </div>
 
            {showAddFriend && (
              <div style={{ margin:"0 14px 8px", background:dm?"rgba(0,102,255,0.08)":"rgba(0,102,255,0.04)", border:"1px solid rgba(0,102,255,0.2)", borderRadius:"12px", padding:"12px", maxHeight:"220px", overflowY:"auto" }}>
                <p style={{ fontSize:"11px", color:textMuted, fontWeight:"700", letterSpacing:"0.08em", marginBottom:"8px" }}>ADD FRIEND</p>
                <input value={addSearch} onChange={e=>setAddSearch(e.target.value)} placeholder="Search by name, @username, or SAP ID..."
                  style={{ width:"100%", padding:"7px 10px", background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:"8px", fontSize:"12px", color:textPrimary, outline:"none", fontFamily:"'Outfit',sans-serif", boxSizing:"border-box", marginBottom:"8px" }} />
                {addSearchResults.length===0 && addSearch && <p style={{ fontSize:"12px", color:textMuted, textAlign:"center", padding:"8px 0" }}>No users found</p>}
                {addSearchResults.map(u => {
                  const isFriend = myData.friends?.includes(u.uid);
                  const isPending = myData.pendingOut?.includes(u.uid);
                  return (
                    <div key={u.uid} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 0", borderBottom:`1px solid ${cardBorder}` }}>
                      <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0 }}>{u.emoji||"🧑‍💻"}</div>
                      <div style={{ flex:1, overflow:"hidden" }}>
                        <p style={{ fontSize:"12px", fontWeight:"600", color:textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name||"Member"}</p>
                        <p style={{ fontSize:"10px", color:textMuted }}>{u.username?`@${u.username}`:u.sapId}</p>
                      </div>
                      <button onClick={()=>sendFriendRequest(u.uid)} disabled={isFriend||isPending} style={{ padding:"4px 10px", borderRadius:"6px", border:"none", cursor:isFriend||isPending?"default":"pointer", fontSize:"11px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", background:isFriend?"rgba(0,229,160,0.15)":isPending?"rgba(255,184,0,0.15)":"rgba(0,102,255,0.15)", color:isFriend?"#00E5A0":isPending?"#FFB800":"#4D8EFF" }}>
                        {isFriend?"✓ Friend":isPending?"Sent":"Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
 
            {pendingRequests.length>0 && (
              <div style={{ margin:"0 14px 8px", background:"rgba(255,184,0,0.06)", border:"1px solid rgba(255,184,0,0.2)", borderRadius:"12px", padding:"10px 12px" }}>
                <p style={{ fontSize:"11px", color:"#FFB800", fontWeight:"700", letterSpacing:"0.08em", marginBottom:"8px" }}>FRIEND REQUESTS ({pendingRequests.length})</p>
                {pendingRequests.map(u=>(
                  <div key={u.uid} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
                    <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0 }}>{u.emoji||"🧑‍💻"}</div>
                    <p style={{ fontSize:"12px", fontWeight:"600", color:textPrimary, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name||"Member"}</p>
                    <button onClick={()=>acceptRequest(u.uid)} style={{ padding:"4px 8px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:"700", background:"rgba(0,229,160,0.15)", color:"#00E5A0" }}>✓</button>
                    <button onClick={()=>declineRequest(u.uid)} style={{ padding:"4px 8px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:"700", background:"rgba(255,70,96,0.15)", color:"#FF7090" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab==="group" && (
          <div style={{ padding:"10px 14px 6px" }}>
            <button onClick={()=>{ setShowNewGroup(!showNewGroup); setGroupPicks([]); setNewGroupName(""); }}
              style={{ width:"100%", padding:"9px", borderRadius:"10px", border:"1px solid rgba(0,102,255,0.2)", cursor:"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", background:showNewGroup?"#0066FF":"rgba(0,102,255,0.1)", color:showNewGroup?"white":"#4D8EFF", transition:"all .2s" }}
            >{showNewGroup ? "✕ Cancel" : "➕ New Group"}</button>

            {showNewGroup && (
              <div style={{ marginTop:"8px", background:dm?"rgba(0,102,255,0.08)":"rgba(0,102,255,0.04)", border:"1px solid rgba(0,102,255,0.2)", borderRadius:"12px", padding:"12px", maxHeight:"260px", overflowY:"auto" }}>
                <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} placeholder="Group name..."
                  style={{ width:"100%", padding:"7px 10px", background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:"8px", fontSize:"12px", color:textPrimary, outline:"none", fontFamily:"'Outfit',sans-serif", boxSizing:"border-box", marginBottom:"10px" }} />
                <p style={{ fontSize:"11px", color:textMuted, fontWeight:"700", letterSpacing:"0.08em", marginBottom:"8px" }}>PICK FRIENDS ({groupPicks.length})</p>
                {friends.length===0 && <p style={{ fontSize:"12px", color:textMuted, textAlign:"center", padding:"8px 0" }}>Add friends first to make a group</p>}
                {friends.map(f=>{
                  const picked = groupPicks.includes(f.uid);
                  return (
                    <div key={f.uid} onClick={()=>setGroupPicks(prev=>picked?prev.filter(id=>id!==f.uid):[...prev,f.uid])}
                      style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 4px", borderRadius:"8px", cursor:"pointer", background:picked?"rgba(0,102,255,0.12)":"transparent" }}
                    >
                      <div style={{ width:"16px", height:"16px", borderRadius:"4px", border:`2px solid ${picked?"#0066FF":"#3A5070"}`, background:picked?"#0066FF":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", color:"white", flexShrink:0 }}>{picked?"✓":""}</div>
                      <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", flexShrink:0 }}>{f.emoji||"🧑‍💻"}</div>
                      <p style={{ fontSize:"12px", fontWeight:"600", color:textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name||"Member"}</p>
                    </div>
                  );
                })}
                <button onClick={createGroup} disabled={!newGroupName.trim()||groupPicks.length===0}
                  style={{ width:"100%", marginTop:"10px", padding:"8px", borderRadius:"8px", border:"none", cursor:(!newGroupName.trim()||groupPicks.length===0)?"default":"pointer", fontSize:"12px", fontWeight:"700", fontFamily:"'Outfit',sans-serif", background:"linear-gradient(135deg,#0066FF,#0047CC)", color:"white", opacity:(!newGroupName.trim()||groupPicks.length===0)?0.5:1 }}
                >Create Group</button>
              </div>
            )}
          </div>
        )}

        <div style={{ flex:1, overflowY:"auto", padding:"6px 8px" }}>
          {tab==="direct" ? (
            filteredFriends.length===0 ? (
              <div style={{ padding:"24px 16px", textAlign:"center", color:textMuted, fontSize:"13px" }}>
                <div style={{ fontSize:"28px", marginBottom:"8px" }}>👥</div>
                <p style={{ fontWeight:"600", marginBottom:"4px", color:textSec }}>No friends yet</p>
                <p style={{ fontSize:"12px" }}>Use ➕ to add friends</p>
              </div>
            ) : filteredFriends.map(u=>(
              <div key={u.uid} onClick={()=>setSelectedUser(u)} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 10px", borderRadius:"12px", cursor:"pointer", background:selectedUser?.uid===u.uid?(dm?"rgba(0,102,255,0.15)":"rgba(0,102,255,0.08)"):"transparent", borderLeft:`3px solid ${selectedUser?.uid===u.uid?"#0066FF":"transparent"}`, transition:"all .15s" }}
                onMouseEnter={e=>{ if(selectedUser?.uid!==u.uid) e.currentTarget.style.background=itemHover; }}
                onMouseLeave={e=>{ if(selectedUser?.uid!==u.uid) e.currentTarget.style.background="transparent"; }}
              >
                <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"19px", flexShrink:0, boxShadow:"0 0 10px rgba(0,102,255,0.3)" }}>{u.emoji||"🧑‍💻"}</div>
                <div style={{ overflow:"hidden" }}>
                  <p style={{ fontSize:"14px", fontWeight:"600", color:textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name||"Member"}</p>
                  <p style={{ fontSize:"11px", color:textMuted, fontFamily:"'Space Grotesk',monospace" }}>{u.username?`@${u.username}`:(u.sapId||"")}</p>
                </div>
              </div>
            ))
          ) : (
            <>
            {customGroups.length>0 && (
              <p style={{ fontSize:"10px", color:textMuted, fontWeight:"700", letterSpacing:"0.08em", padding:"6px 10px" }}>YOUR GROUPS</p>
            )}
            {customGroups.map(room=>(
              <div key={room.id} onClick={()=>setSelectedRoom(room)} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 10px", borderRadius:"12px", cursor:"pointer", background:selectedRoom.id===room.id?(dm?"rgba(0,102,255,0.15)":"rgba(0,102,255,0.08)"):"transparent", borderLeft:`3px solid ${selectedRoom.id===room.id?"#0066FF":"transparent"}`, transition:"all .15s" }}
                onMouseEnter={e=>{ if(selectedRoom.id!==room.id) e.currentTarget.style.background=itemHover; }}
                onMouseLeave={e=>{ if(selectedRoom.id!==room.id) e.currentTarget.style.background="transparent"; }}
              >
                <div style={{ width:"38px", height:"38px", borderRadius:"12px", background:selectedRoom.id===room.id?"rgba(0,102,255,0.2)":"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0, border:`1px solid ${selectedRoom.id===room.id?"rgba(0,102,255,0.3)":cardBorder}` }}>{room.icon}</div>
                <div style={{ overflow:"hidden" }}>
                  <p style={{ fontSize:"14px", fontWeight:"600", color:textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{room.name}</p>
                  <p style={{ fontSize:"11px", color:textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{room.desc}</p>
                </div>
              </div>
            ))}
            {customGroups.length>0 && (
              <p style={{ fontSize:"10px", color:textMuted, fontWeight:"700", letterSpacing:"0.08em", padding:"12px 10px 6px" }}>SAP ROOMS</p>
            )}
            {SAP_ROOMS.map(room=>(
              <div key={room.id} onClick={()=>setSelectedRoom(room)} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 10px", borderRadius:"12px", cursor:"pointer", background:selectedRoom.id===room.id?(dm?"rgba(0,102,255,0.15)":"rgba(0,102,255,0.08)"):"transparent", borderLeft:`3px solid ${selectedRoom.id===room.id?"#0066FF":"transparent"}`, transition:"all .15s" }}
                onMouseEnter={e=>{ if(selectedRoom.id!==room.id) e.currentTarget.style.background=itemHover; }}
                onMouseLeave={e=>{ if(selectedRoom.id!==room.id) e.currentTarget.style.background="transparent"; }}
              >
                <div style={{ width:"38px", height:"38px", borderRadius:"12px", background:selectedRoom.id===room.id?"rgba(0,102,255,0.2)":"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0, border:`1px solid ${selectedRoom.id===room.id?"rgba(0,102,255,0.3)":cardBorder}` }}>{room.icon}</div>
                <div style={{ overflow:"hidden" }}>
                  <p style={{ fontSize:"14px", fontWeight:"600", color:textPrimary }}>{room.name}</p>
                  <p style={{ fontSize:"11px", color:textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{room.desc}</p>
                </div>
              </div>
            ))}
            </>
          )}
        </div>
 
        <div style={{ padding:"10px 14px", borderTop:`1px solid ${cardBorder}`, display:"flex", alignItems:"center", gap:"10px", background:dm?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.3)" }}>
          <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0 }}>{myProfile.emoji||"🧑‍💻"}</div>
          <p style={{ fontSize:"12px", fontWeight:"600", color:textPrimary, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{myProfile.name||"You"}</p>
          <div style={{ display:"flex", alignItems:"center", gap:"4px", background:"rgba(0,229,160,0.1)", border:"1px solid rgba(0,229,160,0.2)", borderRadius:"6px", padding:"3px 8px" }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#00E5A0", boxShadow:"0 0 6px rgba(0,229,160,0.6)" }} />
            <span style={{ fontSize:"10px", color:"#00E5A0", fontWeight:"700" }}>Online</span>
          </div>
        </div>
      </div>
 
      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", background:mainBg, backdropFilter:"blur(16px)" }}>
        {!chatReady ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px" }}>
            <div style={{ width:"80px", height:"80px", borderRadius:"24px", background:"rgba(0,102,255,0.1)", border:"1px solid rgba(0,102,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"36px", boxShadow:"0 0 40px rgba(0,102,255,0.15)" }}>💬</div>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"18px", fontWeight:"700", color:textPrimary }}>
              {tab==="direct" ? "Select a friend to chat" : "Select a room"}
            </p>
            <p style={{ fontSize:"13px", color:textSec, textAlign:"center", maxWidth:"220px", lineHeight:"1.6" }}>
              {tab==="direct" ? "Add friends using ➕ and start chatting privately" : "Join a SAP module room to discuss"}
            </p>
          </div>
        ) : (
          <>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${cardBorder}`, background:dm?"rgba(4,8,18,0.5)":"rgba(255,255,255,0.5)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", gap:"12px" }}>
              {tab==="direct" ? (
                <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>{selectedUser?.emoji||"🧑‍💻"}</div>
              ) : (
                <div style={{ width:"36px", height:"36px", borderRadius:"12px", background:"rgba(0,102,255,0.15)", border:"1px solid rgba(0,102,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>{selectedRoom.icon}</div>
              )}
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:"700", color:textPrimary, fontSize:"15px" }}>{chatTitle}</p>
                <p style={{ fontSize:"11px", color:textMuted, marginTop:"1px" }}>{chatSubtitle}</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(0,229,160,0.1)", border:"1px solid rgba(0,229,160,0.2)", borderRadius:"8px", padding:"4px 10px" }}>
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#00E5A0", boxShadow:"0 0 6px rgba(0,229,160,0.6)" }} />
                <span style={{ fontSize:"11px", color:"#00E5A0", fontWeight:"700" }}>{tab==="group"?"Live":"Active"}</span>
              </div>
            </div>
 
            <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
              {messages.length===0 && (
                <div style={{ textAlign:"center", padding:"40px 0", color:textMuted, fontSize:"13px" }}>
                  <div style={{ fontSize:"24px", marginBottom:"8px" }}>👋</div>
                  {tab==="direct" ? `Start chatting with ${selectedUser?.name||"your friend"}!` : "Be the first to message here!"}
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === currentUser.uid;
                return (
                  <div key={msg.id} style={{ display:"flex", alignItems:"flex-end", gap:"8px", justifyContent:isMe?"flex-end":"flex-start", animation:"fadeInUp .25s ease" }}>
                    {!isMe && (
                      <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", flexShrink:0 }}>{msg.senderEmoji||"🧑‍💻"}</div>
                    )}
                    <div style={{ maxWidth:"65%" }}>
                      {!isMe && tab==="group" && <p style={{ fontSize:"11px", color:textMuted, marginBottom:"3px", fontWeight:"600" }}>{msg.senderName}</p>}
                      <div style={{ padding:"11px 15px", fontSize:"14px", lineHeight:"1.55", wordBreak:"break-word", borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px", background:isMe?"linear-gradient(135deg,#0066FF,#0047CC)":(dm?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.85)"), color:isMe?"white":textPrimary, border:isMe?"none":`1px solid ${cardBorder}`, boxShadow:isMe?"0 4px 16px rgba(0,102,255,0.35)":"0 2px 8px rgba(0,0,0,0.08)" }}>
                        {msg.text}
                      </div>
                      <p style={{ fontSize:"10px", color:textMuted, marginTop:"3px", textAlign:isMe?"right":"left" }}>{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
 
            <div style={{ padding:"12px 18px 16px", borderTop:`1px solid ${cardBorder}`, background:dm?"rgba(4,8,18,0.4)":"rgba(255,255,255,0.4)", backdropFilter:"blur(10px)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", background:dm?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.75)", border:`1px solid ${dm?"rgba(255,255,255,0.08)":"rgba(0,102,255,0.12)"}`, borderRadius:"14px", padding:"8px 8px 8px 16px", boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
                <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()}
                  placeholder={tab==="group" ? `Message #${selectedRoom.name}...` : `Message ${selectedUser?.name||"friend"}...`}
                  style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:"14px", color:textPrimary, fontFamily:"'Outfit',sans-serif", caretColor:"#0066FF" }}
                />
                <button onClick={sendMessage} style={{ width:"38px", height:"38px", borderRadius:"10px", background:"linear-gradient(135deg,#0066FF,#0047CC)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", transition:"all .2s", boxShadow:"0 4px 12px rgba(0,102,255,0.4)", flexShrink:0 }}
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.06)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                >➤</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}