import { useState, useEffect, useRef } from "react";
import { db, auth } from "./firebase";
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, doc, getDoc,
  getDocs, updateDoc, where
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

export default function Chat({ darkMode }) {
  const [tab, setTab]                   = useState("direct"); // direct | groups | connect
  const [friends, setFriends]           = useState([]);
  const [allUsers, setAllUsers]         = useState([]);
  const [pendingIn, setPendingIn]       = useState([]);   // incoming requests
  const [sentIds, setSentIds]           = useState([]);   // UIDs I've sent to
  const [myFriendIds, setMyFriendIds]   = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(SAP_ROOMS[0]);
  const [messages, setMessages]         = useState([]);
  const [newMsg, setNewMsg]             = useState("");
  const [myProfile, setMyProfile]       = useState({});
  const [search, setSearch]             = useState("");
  const [showSidebar, setShowSidebar]   = useState(true);
  const [connectSearch, setConnectSearch] = useState("");
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;
  const isMobile = window.innerWidth < 768;

  const dm = darkMode;
  const sidebarBg     = dm ? "rgba(4,8,18,0.7)"     : "rgba(255,255,255,0.55)";
  const mainBg        = dm ? "rgba(6,11,24,0.5)"     : "rgba(240,244,255,0.5)";
  const cardBorder    = dm ? "rgba(255,255,255,0.07)": "rgba(0,102,255,0.1)";
  const textPrimary   = dm ? "#F0F6FF" : "#0A1128";
  const textSecondary = dm ? "#7A95BE" : "#4A6080";
  const textMuted     = dm ? "#3A5070" : "#8AAAC0";
  const inputBg       = dm ? "rgba(255,255,255,0.05)": "rgba(255,255,255,0.8)";
  const hoverBg       = dm ? "rgba(255,255,255,0.04)": "rgba(0,102,255,0.04)";

  // ── Load profile + friends ─────────────────────────────
  useEffect(() => {
    const load = async () => {
      const mySnap = await getDoc(doc(db, "users", currentUser.uid));
      if (mySnap.exists()) {
        setMyProfile(mySnap.data());
        const ids = mySnap.data().friends || [];
        setMyFriendIds(ids);
        const usersSnap = await getDocs(collection(db, "users"));
        const all = usersSnap.docs
          .filter(d => d.id !== currentUser.uid)
          .map(d => ({ uid: d.id, ...d.data() }));
        setAllUsers(all);
        setFriends(all.filter(u => ids.includes(u.uid)));
      }
    };
    load();

    // Incoming friend requests — real time
    const q = query(
      collection(db, "friendRequests"),
      where("to", "==", currentUser.uid),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, snap => {
      setPendingIn(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Sent requests
    getDocs(query(
      collection(db, "friendRequests"),
      where("from", "==", currentUser.uid),
      where("status", "==", "pending")
    )).then(snap => setSentIds(snap.docs.map(d => d.data().to)));

    return () => unsub();
  }, []);

  // ── Messages ───────────────────────────────────────────
  useEffect(() => {
    if (tab !== "direct" || !selectedUser) return;
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedUser, tab]);

  useEffect(() => {
    if (tab !== "groups") return;
    const q = query(collection(db, "rooms", selectedRoom.id, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedRoom, tab]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Send message ───────────────────────────────────────
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
    } else if (tab === "groups") {
      await addDoc(collection(db, "rooms", selectedRoom.id, "messages"), payload);
    }
    setNewMsg("");
  };

  // ── Friend actions ─────────────────────────────────────
  const sendRequest = async (toUser) => {
    await addDoc(collection(db, "friendRequests"), {
      from: currentUser.uid,
      to: toUser.uid,
      fromName: myProfile.name || "Member",
      status: "pending",
      createdAt: serverTimestamp(),
    });
    setSentIds(prev => [...prev, toUser.uid]);
  };

  const acceptRequest = async (req) => {
    const newMine = [...myFriendIds, req.from];
    await updateDoc(doc(db, "users", currentUser.uid), { friends: newMine });
    const theirSnap = await getDoc(doc(db, "users", req.from));
    if (theirSnap.exists()) {
      const theirFriends = theirSnap.data().friends || [];
      await updateDoc(doc(db, "users", req.from), { friends: [...theirFriends, currentUser.uid] });
    }
    await updateDoc(doc(db, "friendRequests", req.id), { status: "accepted" });
    const newFriend = allUsers.find(u => u.uid === req.from);
    if (newFriend) setFriends(prev => [...prev, newFriend]);
    setMyFriendIds(newMine);
    setPendingIn(prev => prev.filter(r => r.id !== req.id));
  };

  const declineRequest = async (req) => {
    await updateDoc(doc(db, "friendRequests", req.id), { status: "declined" });
    setPendingIn(prev => prev.filter(r => r.id !== req.id));
  };

  const removeFriend = async (friendUid) => {
    const newMine = myFriendIds.filter(id => id !== friendUid);
    await updateDoc(doc(db, "users", currentUser.uid), { friends: newMine });
    const theirSnap = await getDoc(doc(db, "users", friendUid));
    if (theirSnap.exists()) {
      const theirs = (theirSnap.data().friends || []).filter(id => id !== currentUser.uid);
      await updateDoc(doc(db, "users", friendUid), { friends: theirs });
    }
    setMyFriendIds(newMine);
    setFriends(prev => prev.filter(u => u.uid !== friendUid));
    if (selectedUser?.uid === friendUid) setSelectedUser(null);
  };

  const formatTime = ts => {
    if (!ts?.toDate) return "";
    return ts.toDate().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const filteredFriends = friends.filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.sapId || "").toLowerCase().includes(search.toLowerCase())
  );

  const nonFriends = allUsers.filter(u =>
    !myFriendIds.includes(u.uid) &&
    (!connectSearch ||
      (u.name || "").toLowerCase().includes(connectSearch.toLowerCase()) ||
      (u.sapId || "").toLowerCase().includes(connectSearch.toLowerCase()))
  );

  const chatReady = tab === "groups" || (tab === "direct" && selectedUser);
  const chatTitle = tab === "groups"
    ? `${selectedRoom.icon} ${selectedRoom.name}`
    : (selectedUser?.name || selectedUser?.email || "");
  const chatSubtitle = tab === "groups" ? selectedRoom.desc : selectedUser?.sapId;
  const mobileSidebarVisible = isMobile ? (!chatReady || showSidebar || tab === "connect") : true;

  // ── TAB LABELS ─────────────────────────────────────────
  const tabs = [
    { id: "direct",  label: "💬 Direct" },
    { id: "groups",  label: "👥 Groups" },
    { id: "connect", label: `🔗${pendingIn.length > 0 ? ` ${pendingIn.length}` : ""}` },
  ];

  return (
    <div style={{
      display: "flex",
      height: isMobile ? "calc(100vh - 136px)" : "calc(100vh - 72px)",
      borderRadius: "20px", overflow: "hidden",
      border: `1px solid ${cardBorder}`,
      boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    }}>

      {/* ── LEFT SIDEBAR ── */}
      {mobileSidebarVisible && (
        <div style={{
          width: isMobile ? "100%" : "280px",
          minWidth: isMobile ? "100%" : "280px",
          background: sidebarBg, borderRight: `1px solid ${cardBorder}`,
          display: "flex", flexDirection: "column", backdropFilter: "blur(24px)",
        }}>

          {/* Tabs */}
          <div style={{ display: "flex", padding: "14px 12px 0", gap: "6px" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: t.id === "connect" ? "0 0 auto" : 1,
                padding: t.id === "connect" ? "8px 12px" : "8px",
                borderRadius: "10px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: "700", fontFamily: "'Outfit',sans-serif",
                transition: "all .2s",
                background: tab === t.id ? "#0066FF" : (dm ? "rgba(255,255,255,0.04)" : "rgba(0,102,255,0.06)"),
                color: tab === t.id ? "white" : textSecondary,
                boxShadow: tab === t.id ? "0 4px 14px rgba(0,102,255,0.4)" : "none",
                position: "relative",
              }}>{t.label}</button>
            ))}
          </div>

          {/* ── DIRECT TAB ── */}
          {tab === "direct" && (
            <>
              <div style={{ padding: "10px 12px" }}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search friends..."
                  style={{ width: "100%", padding: "8px 12px", background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", fontSize: "13px", color: textPrimary, outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
                {filteredFriends.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: textMuted, fontSize: "13px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>👥</div>
                    <p style={{ marginBottom: "6px" }}>No connections yet</p>
                    <p style={{ fontSize: "11px" }}>Go to 🔗 tab to connect</p>
                  </div>
                ) : filteredFriends.map(u => (
                  <div key={u.uid} onClick={() => { setSelectedUser(u); if (isMobile) setShowSidebar(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "11px 10px", borderRadius: "12px", cursor: "pointer",
                      background: selectedUser?.uid === u.uid ? (dm ? "rgba(0,102,255,0.15)" : "rgba(0,102,255,0.08)") : "transparent",
                      borderLeft: `3px solid ${selectedUser?.uid === u.uid ? "#0066FF" : "transparent"}`,
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => { if (selectedUser?.uid !== u.uid) e.currentTarget.style.background = hoverBg; }}
                    onMouseLeave={e => { if (selectedUser?.uid !== u.uid) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg,#0066FF,#7B61FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px", flexShrink: 0 }}>
                      {u.emoji || "🧑‍💻"}
                    </div>
                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "Member"}</p>
                      <p style={{ fontSize: "11px", color: textMuted, fontFamily: "'Space Grotesk',monospace" }}>{u.sapId || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── GROUPS TAB ── */}
          {tab === "groups" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
              {SAP_ROOMS.map(room => (
                <div key={room.id} onClick={() => { setSelectedRoom(room); if (isMobile) setShowSidebar(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "11px 10px", borderRadius: "12px", cursor: "pointer",
                    background: selectedRoom.id === room.id ? (dm ? "rgba(0,102,255,0.15)" : "rgba(0,102,255,0.08)") : "transparent",
                    borderLeft: `3px solid ${selectedRoom.id === room.id ? "#0066FF" : "transparent"}`,
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { if (selectedRoom.id !== room.id) e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={e => { if (selectedRoom.id !== room.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: selectedRoom.id === room.id ? "rgba(0,102,255,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0, border: `1px solid ${selectedRoom.id === room.id ? "rgba(0,102,255,0.3)" : cardBorder}` }}>
                    {room.icon}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: textPrimary }}>{room.name}</p>
                    <p style={{ fontSize: "11px", color: textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CONNECT TAB ── */}
          {tab === "connect" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Incoming requests */}
              {pendingIn.length > 0 && (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: "700", color: textMuted, letterSpacing: "0.1em", marginBottom: "8px" }}>
                    REQUESTS ({pendingIn.length})
                  </p>
                  {pendingIn.map(req => {
                    const sender = allUsers.find(u => u.uid === req.from);
                    return (
                      <div key={req.id} style={{ background: dm ? "rgba(0,102,255,0.08)" : "rgba(0,102,255,0.05)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: "14px", padding: "12px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#0066FF,#7B61FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                            {sender?.emoji || "🧑‍💻"}
                          </div>
                          <div style={{ overflow: "hidden" }}>
                            <p style={{ fontSize: "13px", fontWeight: "700", color: textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sender?.name || req.fromName || "Member"}</p>
                            <p style={{ fontSize: "10px", color: textMuted, fontFamily: "'Space Grotesk',monospace" }}>{sender?.sapId || ""}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => acceptRequest(req)} style={{ flex: 1, padding: "7px", background: "rgba(0,229,160,0.1)", color: "#00E5A0", border: "1px solid rgba(0,229,160,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'Outfit',sans-serif" }}>
                            ✓ Accept
                          </button>
                          <button onClick={() => declineRequest(req)} style={{ flex: 1, padding: "7px", background: "rgba(255,70,96,0.08)", color: "#FF7090", border: "1px solid rgba(255,70,96,0.2)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700", fontFamily: "'Outfit',sans-serif" }}>
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* My connections */}
              {friends.length > 0 && (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: "700", color: textMuted, letterSpacing: "0.1em", marginBottom: "8px" }}>
                    MY CONNECTIONS ({friends.length})
                  </p>
                  {friends.map(f => (
                    <div key={f.uid} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "12px", marginBottom: "4px", background: dm ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)", border: `1px solid ${cardBorder}` }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#0066FF,#7B61FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                        {f.emoji || "🧑‍💻"}
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <p style={{ fontSize: "12px", fontWeight: "700", color: textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || "Member"}</p>
                      </div>
                      <button onClick={() => removeFriend(f.uid)} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: "14px", padding: "2px 4px" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Find people */}
              <div>
                <p style={{ fontSize: "10px", fontWeight: "700", color: textMuted, letterSpacing: "0.1em", marginBottom: "8px" }}>
                  FIND PEOPLE
                </p>
                <input value={connectSearch} onChange={e => setConnectSearch(e.target.value)}
                  placeholder="Search by name or SAP ID..."
                  style={{ width: "100%", padding: "8px 12px", background: inputBg, border: `1px solid ${cardBorder}`, borderRadius: "10px", fontSize: "12px", color: textPrimary, outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box", marginBottom: "8px" }}
                />
                {nonFriends.map(u => (
                  <div key={u.uid} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "12px", marginBottom: "4px", background: dm ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)", border: `1px solid ${cardBorder}` }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#0066FF,#7B61FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                      {u.emoji || "🧑‍💻"}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "Member"}</p>
                      <p style={{ fontSize: "10px", color: textMuted, fontFamily: "'Space Grotesk',monospace" }}>{u.sapId || ""}</p>
                    </div>
                    {sentIds.includes(u.uid) ? (
                      <span style={{ fontSize: "10px", color: textMuted, fontWeight: "700" }}>Sent ✓</span>
                    ) : (
                      <button onClick={() => sendRequest(u)} style={{ background: "rgba(0,102,255,0.1)", color: "#4D8EFF", border: "1px solid rgba(0,102,255,0.2)", borderRadius: "7px", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: "700", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>
                        + Add
                      </button>
                    )}
                  </div>
                ))}
                {nonFriends.length === 0 && connectSearch && (
                  <p style={{ textAlign: "center", color: textMuted, fontSize: "12px", padding: "16px 0" }}>No members found</p>
                )}
              </div>
            </div>
          )}

          {/* Profile strip */}
          {tab !== "connect" && (
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${cardBorder}`, display: "flex", alignItems: "center", gap: "10px", background: dm ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,#0066FF,#7B61FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>
                {myProfile.emoji || "🧑‍💻"}
              </div>
              <p style={{ fontSize: "12px", fontWeight: "600", color: textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{myProfile.name || "You"}</p>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00E5A0", boxShadow: "0 0 6px rgba(0,229,160,0.6)", flexShrink: 0 }} />
            </div>
          )}
        </div>
      )}

      {/* ── MAIN CHAT AREA ── */}
      {tab !== "connect" && (!isMobile || !mobileSidebarVisible) && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: mainBg, backdropFilter: "blur(16px)" }}>
          {!chatReady ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "rgba(0,102,255,0.1)", border: "1px solid rgba(0,102,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>💬</div>
              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "18px", fontWeight: "700", color: textPrimary }}>Select a conversation</p>
              <p style={{ fontSize: "13px", color: textSecondary, textAlign: "center", maxWidth: "220px", lineHeight: "1.6" }}>
                {tab === "direct" ? "Choose a friend to start chatting" : "Select a room to join"}
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${cardBorder}`, background: dm ? "rgba(4,8,18,0.5)" : "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: "12px" }}>
                {isMobile && (
                  <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", cursor: "pointer", color: textSecondary, fontSize: "20px", padding: "0 4px 0 0", lineHeight: 1 }}>←</button>
                )}
                <div style={{ width: "38px", height: "38px", borderRadius: tab === "direct" ? "50%" : "12px", background: tab === "direct" ? "linear-gradient(135deg,#0066FF,#7B61FF)" : "rgba(0,102,255,0.15)", border: tab === "direct" ? "none" : "1px solid rgba(0,102,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px" }}>
                  {tab === "direct" ? (selectedUser?.emoji || "🧑‍💻") : selectedRoom.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: "700", color: textPrimary, fontSize: "15px" }}>{chatTitle}</p>
                  <p style={{ fontSize: "11px", color: textMuted, marginTop: "1px" }}>{chatSubtitle}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: "8px", padding: "4px 10px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00E5A0", boxShadow: "0 0 6px rgba(0,229,160,0.6)" }} />
                  <span style={{ fontSize: "11px", color: "#00E5A0", fontWeight: "700" }}>{tab === "groups" ? "Live" : "Active"}</span>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: textMuted, fontSize: "13px" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>👋</div>
                    Start the conversation!
                  </div>
                )}
                {messages.map(msg => {
                  const isMe = msg.senderId === currentUser.uid;
                  return (
                    <div key={msg.id} style={{ display: "flex", alignItems: "flex-end", gap: "8px", justifyContent: isMe ? "flex-end" : "flex-start", animation: "fadeInUp .25s ease" }}>
                      {!isMe && (
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#0066FF,#7B61FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>
                          {msg.senderEmoji || "🧑‍💻"}
                        </div>
                      )}
                      <div style={{ maxWidth: "65%" }}>
                        {!isMe && tab === "groups" && (
                          <p style={{ fontSize: "11px", color: textMuted, marginBottom: "4px", fontWeight: "600" }}>{msg.senderName}</p>
                        )}
                        <div style={{ padding: "11px 16px", fontSize: "14px", lineHeight: "1.55", wordBreak: "break-word", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isMe ? "linear-gradient(135deg,#0066FF,#0047CC)" : (dm ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.8)"), color: isMe ? "white" : textPrimary, border: isMe ? "none" : `1px solid ${cardBorder}`, boxShadow: isMe ? "0 4px 16px rgba(0,102,255,0.35)" : "0 2px 8px rgba(0,0,0,0.1)" }}>
                          {msg.text}
                        </div>
                        <p style={{ fontSize: "10px", color: textMuted, marginTop: "4px", textAlign: isMe ? "right" : "left" }}>{formatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "14px 20px 18px", borderTop: `1px solid ${cardBorder}`, background: dm ? "rgba(4,8,18,0.4)" : "rgba(255,255,255,0.4)", backdropFilter: "blur(10px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: dm ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)", border: `1px solid ${dm ? "rgba(255,255,255,0.08)" : "rgba(0,102,255,0.12)"}`, borderRadius: "14px", padding: "8px 8px 8px 16px" }}>
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder={tab === "groups" ? `Message #${selectedRoom.name}...` : `Message ${selectedUser?.name || "member"}...`}
                    style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "14px", color: textPrimary, fontFamily: "'Outfit',sans-serif", caretColor: "#0066FF" }}
                  />
                  <button onClick={sendMessage} style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg,#0066FF,#0047CC)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", boxShadow: "0 4px 12px rgba(0,102,255,0.4)", flexShrink: 0 }}>➤</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}