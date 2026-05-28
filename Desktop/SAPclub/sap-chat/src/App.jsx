import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./Login";
import Dashboard from "./Dashboard";
 
export default function App() {
  const [user, setUser]         = useState(null);
  const [checked, setChecked]   = useState(false);
  const [darkMode, setDarkMode] = useState(false);
 
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      // Only allow verified emails OR Google sign-in (always verified)
      if (currentUser && (currentUser.emailVerified || currentUser.providerData?.[0]?.providerId === "google.com")) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setChecked(true);
    });
    return () => unsub();
  }, []);
 
  if (!checked) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060B18", color:"#4D8EFF", fontFamily:"'Outfit',sans-serif", fontSize:"14px" }}>
      Loading...
    </div>
  );
 
  if (!user) return <Login />;
  return <Dashboard user={user} darkMode={darkMode} setDarkMode={setDarkMode} />;
}