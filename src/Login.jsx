import { useState } from "react";
import { auth, db } from "./firebase";
import {
  GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
 
const styleEl = document.createElement("style");
styleEl.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
 
  .login-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #070C1A 0%, #0A1024 40%, #0D1535 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Outfit', sans-serif;
    position: relative; overflow: hidden;
  }
  .login-root::before {
    content: ''; position: absolute; top: -200px; left: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(0,102,255,0.12) 0%, transparent 60%);
    pointer-events: none;
  }
  .login-root::after {
    content: ''; position: absolute; bottom: -200px; right: -200px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  .login-card {
    width: 420px; max-width: 90vw;
    background: rgba(13,21,53,0.7);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px; padding: 44px 40px;
    backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
    position: relative; z-index: 1;
    animation: cardIn 0.5s ease;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .login-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 30px; font-weight: 800; color: #F0F4FF;
    letter-spacing: -0.03em; margin-bottom: 4px; text-align: center;
  }
  .login-sub { font-size: 13px; color: #6B82A8; text-align: center; margin-bottom: 28px; }
  .field-label {
    font-size: 11px; font-weight: 700; color: #6B82A8;
    letter-spacing: 0.1em; text-transform: uppercase;
    display: block; margin-bottom: 8px;
  }
  .field-wrap { margin-bottom: 14px; }
  .login-input {
    width: 100%; padding: 12px 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; font-size: 14px; color: #F0F4FF;
    outline: none; font-family: 'Outfit', sans-serif;
    transition: all 0.2s; box-sizing: border-box;
  }
  .login-input::placeholder { color: #3D5577; }
  .login-input:focus {
    border-color: rgba(0,102,255,0.5);
    background: rgba(0,102,255,0.05);
    box-shadow: 0 0 0 3px rgba(0,102,255,0.1);
  }
  .sap-input {
    font-family: 'Space Grotesk', monospace;
    letter-spacing: 3px; font-size: 15px;
  }
  .login-btn {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #0066FF, #0047CC);
    color: white; border: none; border-radius: 12px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    font-family: 'Outfit', sans-serif;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(0,102,255,0.4);
    letter-spacing: 0.02em; margin-top: 4px;
  }
  .login-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,102,255,0.5); }
  .login-btn:active { transform: translateY(0); }
  .login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .google-btn {
    width: 100%; padding: 13px;
    background: rgba(255,255,255,0.06);
    color: #E0E8FF; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: 'Outfit', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: all 0.2s; margin-top: 10px;
  }
  .google-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.18); }
  .divider-row {
    display: flex; align-items: center; gap: 12px;
    margin: 18px 0; color: #3A5070; font-size: 12px;
  }
  .divider-row::before, .divider-row::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(255,255,255,0.06);
  }
  .valid-msg { font-size: 11px; margin-top: 5px; font-weight: 600; }
  .error-msg {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px; padding: 10px 14px; font-size: 13px;
    color: #FCA5A5; margin-bottom: 12px; text-align: center; line-height: 1.5;
  }
  .info-msg {
    background: rgba(0,102,255,0.08); border: 1px solid rgba(0,102,255,0.2);
    border-radius: 8px; padding: 12px 14px; font-size: 13px;
    color: #7AB0FF; margin-bottom: 12px; text-align: center; line-height: 1.6;
  }
  .toggle-link {
    text-align: center; margin-top: 18px; font-size: 13px;
    color: #6B82A8; cursor: pointer; transition: color 0.2s;
  }
  .toggle-link span { color: #4D8EFF; font-weight: 600; }
  .toggle-link:hover span { color: #7AB0FF; }
`;
 
if (!document.head.querySelector("#login-premium-styles")) {
  styleEl.id = "login-premium-styles";
  document.head.appendChild(styleEl);
}
 
const googleProvider = new GoogleAuthProvider();
 
const saveUserToFirestore = async (user, sapId) => {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name:      user.displayName || user.email.split("@")[0],
      email:     user.email,
      sapId:     sapId.toUpperCase(),
      emoji:     "🧑‍💻",
      photoURL:  user.photoURL || "",
      createdAt: new Date().toISOString(),
      friends:   [],
    });
  } else {
    await setDoc(ref, { sapId: sapId.toUpperCase() }, { merge: true });
  }
};
 
export default function Login() {
  const [sapId, setSapId]       = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep]         = useState("sap");   // sap → auth
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
 
  const validateSapId = (id) => /^[CPS]\d{10}$/.test(id);
 
  const handleSapNext = () => {
    if (!validateSapId(sapId)) { setError("Invalid SAP ID — C/P/S followed by 10 digits."); return; }
    setError(""); setStep("auth");
  };
 
  // ── Google OAuth ──────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(result.user, sapId);
    } catch (err) {
      setError(err.message.replace("Firebase: ","").replace(/\(auth.*\)\.?/,""));
    }
    setLoading(false);
  };
 
  // ── Email / Password ──────────────────────────────────
  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) { setError("Please fill all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError(""); setInfo("");
    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await saveUserToFirestore(cred.user, sapId);
        // Sign out until verified
        await auth.signOut();
        setInfo("✅ Account created! Check your email and verify your address, then sign in.");
        setIsSignup(false); setPassword("");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await auth.signOut();
          setError("Email not verified. Check your inbox and click the verification link.");
          await sendEmailVerification(cred.user); // resend just in case
        } else {
          await saveUserToFirestore(cred.user, sapId);
          // App.jsx onAuthStateChanged handles redirect
        }
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ","").replace(/\(auth.*\)\.?/,""));
    }
    setLoading(false);
  };

  // ── Forgot password ───────────────────────────────────
  const handleResetPassword = async () => {
    if (!resetEmail.trim()) { setError("Enter your email first."); return; }
    setLoading(true); setError(""); setInfo("");
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setInfo("✅ Password reset link sent! Check your inbox.");
      setShowReset(false);
    } catch (err) {
      setError(err.message.replace("Firebase: ","").replace(/\(auth.*\)\.?/,""));
    }
    setLoading(false);
  };

  // ── Step 1: SAP ID ────────────────────────────────────
  if (step === "sap") {
    return (
      <div className="login-root">
        <div className="login-card">
          <div className="login-title">SAPclub</div>
          <p className="login-sub">Enter your SAP ID to get started</p>
 
          <label className="field-label">SAP ID</label>
          <input
            className="login-input sap-input"
            placeholder="P1234567890"
            value={sapId}
            onChange={e => { setSapId(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSapNext()}
            maxLength={11} autoFocus
          />
          {sapId && !validateSapId(sapId) && <p className="valid-msg" style={{ color:"#F87171" }}>✗ C/P/S + 10 digits required</p>}
          {sapId && validateSapId(sapId)  && <p className="valid-msg" style={{ color:"#4ADE80" }}>✓ Valid SAP ID</p>}
 
          {error && <div className="error-msg" style={{ marginTop:"12px" }}>{error}</div>}
 
          <button className="login-btn" style={{ marginTop:"20px" }} onClick={handleSapNext}>
            Continue →
          </button>
        </div>
      </div>
    );
  }
 
  // ── Step 2: Auth ──────────────────────────────────────
  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-title">SAPclub</div>
        <p className="login-sub">{isSignup ? "Create your account" : "Sign in to continue"}</p>
 
        {/* SAP ID chip */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:"20px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(0,102,255,0.1)", border:"1px solid rgba(0,102,255,0.2)", borderRadius:"10px", padding:"7px 14px" }}>
            <span style={{ fontFamily:"'Space Grotesk',monospace", fontSize:"13px", fontWeight:"700", color:"#4D8EFF", letterSpacing:"2px" }}>{sapId}</span>
            <button onClick={()=>{ setStep("sap"); setError(""); setInfo(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#3A5070", fontSize:"14px", lineHeight:1 }}>✕</button>
          </div>
        </div>
 
        {info  && <div className="info-msg">{info}</div>}
        {error && <div className="error-msg">{error}</div>}
 
        {/* Email fields */}
        <div className="field-wrap">
          <label className="field-label">Email</label>
          <input className="login-input" placeholder="you@gmail.com / you@college.edu" value={email}
            onChange={e=>{ setEmail(e.target.value); setError(""); }}
            onKeyDown={e=>e.key==="Enter"&&handleEmailAuth()}
          />
        </div>
        <div className="field-wrap">
          <label className="field-label">Password</label>
          <div style={{ position:"relative" }}>
            <input className="login-input" placeholder="••••••••" type={showPassword?"text":"password"} value={password}
              onChange={e=>{ setPassword(e.target.value); setError(""); }}
              onKeyDown={e=>e.key==="Enter"&&handleEmailAuth()}
              style={{ paddingRight:"42px" }}
            />
            <button type="button" onClick={()=>setShowPassword(v=>!v)}
              style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"15px", color:"#6B82A8", padding:"4px", lineHeight:1 }}
              tabIndex={-1}
              aria-label={showPassword?"Hide password":"Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {!isSignup && !showReset && (
          <p style={{ textAlign:"right", fontSize:"12px", color:"#4D8EFF", cursor:"pointer", marginTop:"-6px", marginBottom:"14px", fontWeight:"600" }}
            onClick={()=>{ setShowReset(true); setResetEmail(email); setError(""); setInfo(""); }}
          >Forgot password?</p>
        )}

        {showReset && (
          <div style={{ background:"rgba(0,102,255,0.06)", border:"1px solid rgba(0,102,255,0.15)", borderRadius:"12px", padding:"14px", marginBottom:"14px" }}>
            <label className="field-label">Reset password for</label>
            <input className="login-input" placeholder="you@gmail.com" value={resetEmail}
              onChange={e=>setResetEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleResetPassword()}
              style={{ marginBottom:"10px" }}
            />
            <div style={{ display:"flex", gap:"8px" }}>
              <button className="login-btn" style={{ marginTop:0, boxShadow:"none" }} onClick={handleResetPassword} disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <button className="google-btn" style={{ marginTop:0, width:"auto", padding:"13px 18px" }} onClick={()=>{ setShowReset(false); setError(""); }}>Cancel</button>
            </div>
          </div>
        )}

        <button className="login-btn" onClick={handleEmailAuth} disabled={loading}>
          {loading ? "Please wait..." : isSignup ? "Create Account →" : "Sign In →"}
        </button>
 
        <div className="divider-row">or</div>
 
        {/* Google */}
        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="17" height="17" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>
 
        <p className="toggle-link" onClick={()=>{ setIsSignup(!isSignup); setError(""); setInfo(""); }}>
          {isSignup ? "Already have an account? " : "New to SAPclub? "}
          <span>{isSignup ? "Sign In" : "Create Account"}</span>
        </p>
 
        {!isSignup && (
          <p style={{ textAlign:"center", marginTop:"10px", fontSize:"11px", color:"#3A5070", lineHeight:"1.6" }}>
            New accounts need email verification before access.
          </p>
        )}
      </div>
    </div>
  );
}