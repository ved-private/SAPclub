import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection, getDocs, doc, getDoc, updateDoc,
  onSnapshot, setDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp
} from "firebase/firestore";

async function sendNotificationHelper(userId, type, message) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId, type, message, read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) { console.error("Notif error:", e); }
}

// NOTE: Uses the single "friendships/{uid}" collection — the same source of
// truth as Chat's Add Friend flow — so a request sent from either screen
// shows up correctly everywhere. (Previously this file used a separate
// users.friends + friendRequests system that could get out of sync with Chat.)
export default function Friends({ darkMode }) {
  const [tab, setTab]             = useState("friends"); // friends | find | requests
  const [friends, setFriends]     = useState([]);
  const [requests, setRequests]   = useState([]); // incoming, hydrated with profile data
  const [allUsers, setAllUsers]   = useState([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [myData, setMyData]       = useState({ friends:[], pendingIn:[], pendingOut:[] });
  const [myProfile, setMyProfile] = useState({});
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
      const pSnap = await getDoc(doc(db,"users",currentUser.uid));
      if (pSnap.exists()) setMyProfile(pSnap.data());

      const fSnap = await getDoc(doc(db,"friendships",currentUser.uid));
      if (fSnap.exists()) {
        setMyData(fSnap.data());
      } else {
        await setDoc(doc(db,"friendships",currentUser.uid), { friends:[], pendingIn:[], pendingOut:[] });
      }

      const usersSnap = await getDocs(collection(db,"users"));
      setAllUsers(usersSnap.docs.filter(d=>d.id!==currentUser.uid).map(d=>({uid:d.id,...d.data()})));
      setLoading(false);
    };
    load();

    const unsub = onSnapshot(doc(db,"friendships",currentUser.uid), snap => {
      if (snap.exists()) setMyData(snap.data());
    });
    return () => unsub();
  }, []);

  // Hydrate friends list whenever friend uids change
  useEffect(() => {
    if (!myData.friends?.length) { setFriends([]); return; }
    (async () => {
      const snaps = await Promise.all(myData.friends.map(uid=>getDoc(doc(db,"users",uid))));
      setFriends(snaps.filter(s=>s.exists()).map(s=>({uid:s.id,...s.data()})));
    })();
  }, [myData.friends]);

  // Hydrate incoming requests whenever pendingIn changes
  useEffect(() => {
    if (!myData.pendingIn?.length) { setRequests([]); return; }
    (async () => {
      const snaps = await Promise.all(myData.pendingIn.map(uid=>getDoc(doc(db,"users",uid))));
      setRequests(snaps.filter(s=>s.exists()).map(s=>({uid:s.id,...s.data()})));
    })();
  }, [myData.pendingIn]);

  const sendRequest = async (toUser) => {
    if (myData.friends?.includes(toUser.uid) || myData.pendingOut?.includes(toUser.uid)) return;
    await updateDoc(doc(db,"friendships",currentUser.uid), { pendingOut: arrayUnion(toUser.uid) });
    const theirSnap = await getDoc(doc(db,"friendships",toUser.uid));
    if (theirSnap.exists()) {
      await updateDoc(doc(db,"friendships",toUser.uid), { pendingIn: arrayUnion(currentUser.uid) });
    } else {
      await setDoc(doc(db,"friendships",toUser.uid), { friends:[], pendingIn:[currentUser.uid], pendingOut:[] });
    }
    await sendNotificationHelper(toUser.uid, "answer", `👋 ${myProfile.name || "Someone"} sent you a friend request!`);
  };

  const acceptRequest = async (req) => {
    await Promise.all([
      updateDoc(doc(db,"friendships",currentUser.uid), { friends:arrayUnion(req.uid), pendingIn:arrayRemove(req.uid) }),
      updateDoc(doc(db,"friendships",req.uid), { friends:arrayUnion(currentUser.uid), pendingOut:arrayRemove(currentUser.uid) }),
    ]);
    await sendNotificationHelper(req.uid, "answer", `✅ ${myProfile.name || "Someone"} accepted your friend request!`);
  };

  const declineRequest = async (req) => {
    await Promise.all([
      updateDoc(doc(db,"friendships",currentUser.uid), { pendingIn:arrayRemove(req.uid) }),
      updateDoc(doc(db,"friendships",req.uid), { pendingOut:arrayRemove(currentUser.uid) }),
    ]);
  };

  const removeFriend = async (friendUid) => {
    await Promise.all([
      updateDoc(doc(db,"friendships",currentUser.uid), { friends:arrayRemove(friendUid) }),
      updateDoc(doc(db,"friendships",friendUid), { friends:arrayRemove(currentUser.uid) }).catch(()=>{}),
    ]);
  };

  const q = search.toLowerCase().replace(/^@/,"");
  const myFriendIds = myData.friends || [];
  const sentIds = myData.pendingOut || [];
  const filteredUsers = allUsers.filter(u =>
    !myFriendIds.includes(u.uid) &&
    (!q ||
      (u.name||"").toLowerCase().includes(q) ||
      (u.username||"").toLowerCase().includes(q) ||
      (u.sapId||"").toLowerCase().includes(q))
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
                <p style={{ fontSize:"11px", color:textMuted, fontFamily:"'Space Grotesk',monospace" }}>{f.username?`@${f.username}`:f.sapId}</p>
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
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, @username, or SAP ID..."
              style={{ width:"100%", padding:"13px 16px 13px 44px", background:inputBg, border:`1px solid ${cardBorder}`, borderRadius:"14px", fontSize:"14px", color:textPrimary, outline:"none", fontFamily:"'Outfit',sans-serif", boxSizing:"border-box" }}
              onFocus={e=>{ e.target.style.borderColor="rgba(0,102,255,0.4)"; e.target.style.boxShadow="0 0 0 3px rgba(0,102,255,0.1)"; }}
              onBlur={e=>{ e.target.style.borderColor=cardBorder; e.target.style.boxShadow="none"; }}
            />
          </div>
          <div style={{ display:"grid", gap:"10px" }}>
            {filteredUsers.length===0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:textSec }}>
                <p style={{ fontSize:"32px", marginBottom:"12px" }}>🔍</p>
                <p style={{ fontSize:"14px" }}>{search ? "No members found" : "Start typing a name, @username, or SAP ID"}</p>
              </div>
            ) : filteredUsers.map(u=>(
              <div key={u.uid} style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:"14px", padding:"14px 18px", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>
                  {u.emoji||"🧑‍💻"}
                </div>
                <div style={{ flex:1, overflow:"hidden" }}>
                  <p style={{ fontSize:"14px", fontWeight:"700", color:textPrimary }}>{u.name||"Member"}</p>
                  <p style={{ fontSize:"11px", color:textMuted, fontFamily:"'Space Grotesk',monospace" }}>{u.username?`@${u.username}`:u.sapId}</p>
                </div>
                {myFriendIds.includes(u.uid) ? (
                  <span style={{ fontSize:"12px", color:"#00E5A0", fontWeight:"600" }}>Friends ✓</span>
                ) : sentIds.includes(u.uid) ? (
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
          ) : requests.map(req=>(
            <div key={req.uid} style={{ background:cardBg, border:"1px solid rgba(0,102,255,0.2)", borderRadius:"16px", padding:"16px 20px", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", gap:"14px" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg,#0066FF,#7B61FF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                {req.emoji||"🧑‍💻"}
              </div>
              <div style={{ flex:1, overflow:"hidden" }}>
                <p style={{ fontSize:"14px", fontWeight:"700", color:textPrimary }}>{req.name||"Member"}</p>
                <p style={{ fontSize:"11px", color:textMuted, fontFamily:"'Space Grotesk',monospace" }}>{req.username?`@${req.username}`:req.sapId||""}</p>
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
          ))}
        </div>
      )}
    </div>
  );
}