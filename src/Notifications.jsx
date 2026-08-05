import { useState, useEffect, useRef } from "react";
import { db, auth } from "./firebase";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => setCurrentUser(user));
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "notifications"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [currentUser]);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markRead: (id) => updateDoc(doc(db, "notifications", id), { read: true }),
    markAllRead: () => Promise.all(notifications.filter(n => !n.read).map(n => updateDoc(doc(db, "notifications", n.id), { read: true }))),
  };
}

export async function sendNotification(userId, type, message, link = "") {
  await addDoc(collection(db, "notifications"), { userId, type, message, link, read: false, createdAt: serverTimestamp() });
}

export function NotificationBell({ darkMode }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dm = darkMode;

  const colors = {
    textPrimary: dm ? "#F0F6FF" : "#0A1128",
    textMuted: dm ? "#3A5070" : "#8AAAC0",
    cardBg: dm ? "rgba(6,11,24,0.97)" : "rgba(255,255,255,0.97)",
    cardBorder: dm ? "rgba(255,255,255,0.08)" : "rgba(0,102,255,0.12)",
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => ({ answer: "💬", best: "⭐", resolved: "✅", credits: "⚡" }[type] || "🔔");

  const formatTime = (ts) => {
    if (!ts?.toDate) return "";
    const diff = Date.now() - ts.toDate().getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          width: "38px",
          height: "38px",
          borderRadius: "11px",
          background: dm ? "rgba(255,255,255,0.05)" : "rgba(0,102,255,0.08)",
          border: dm ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,102,255,0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "17px",
          transition: "all .2s",
          flexShrink: 0,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <div style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#FF4560,#FF6B80)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: "800",
            color: "white",
            boxShadow: "0 0 8px rgba(255,69,96,0.6)",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: "fixed",
          top: "60px",
          right: "20px",
          width: "340px",
          maxHeight: "420px",
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: "16px",
          backdropFilter: "blur(32px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          zIndex: 9999,
          overflow: "hidden",
        }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${colors.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: "700", color: colors.textPrimary, fontSize: "14px" }}>
              Notifications {unreadCount > 0 && <span style={{ color: "#FF7090" }}>({unreadCount})</span>}
            </p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#4D8EFF", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                Mark all
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", maxHeight: "340px" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: colors.textMuted }}>
                <p style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</p>
                <p style={{ fontSize: "13px" }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "14px 18px",
                    background: n.read ? "transparent" : (dm ? "rgba(0,102,255,0.06)" : "rgba(0,102,255,0.04)"),
                    borderLeft: `3px solid ${n.read ? "transparent" : "#0066FF"}`,
                    borderBottom: `1px solid ${colors.cardBorder}`,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: dm ? "rgba(255,255,255,0.06)" : "rgba(0,102,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", color: colors.textPrimary, lineHeight: "1.5", fontWeight: n.read ? "400" : "600" }}>{n.message}</p>
                    <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "3px" }}>{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0066FF", flexShrink: 0, marginTop: "4px" }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}