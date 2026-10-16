import { useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo3.jpg"
import { useAuth } from "../Auth/AuthContext"
import { isSupabaseConfigured } from "../Data/Supabase"
import "./Login.css"
import "./Login.extra.css"

function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [working, setWorking] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    setError("")
    setWorking(true)
    try {
      const profile = await signIn(email, password)
      navigate(profile.role === "admin" ? "/admin" : "/student", { replace: true })
    } catch (loginError) {
      setError(loginError.message || "Could not sign in. Check your email and password.")
    } finally {
      setWorking(false)
    }
  }

  return <main className="mitc-login">
    <section className="login-welcome">
      <img src={logo} alt="Masroor International Technical College" />
      <div className="welcome-message"><span>MITC LEARNING PORTAL</span><h1>Learning that<br/>moves you <em>forward.</em></h1><p>Sign in with the account created for you by your school administrator.</p></div>
      <div className="welcome-bottom"><span>MASROOR INTERNATIONAL TECHNICAL COLLEGE</span><span>STUDY · PRACTICE · GROW</span></div>
      <div className="login-orbit orbit-one"/><div className="login-orbit orbit-two"/>
    </section>
    <section className="login-panel"><div className="login-box"><div className="login-kicker">WELCOME TO MITC</div><h2>Sign in to your account</h2><p className="login-subtitle">Enter the email and password provided by your administrator.</p>
      <form onSubmit={handleLogin}>
        <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event)=>{setEmail(event.target.value);setError("")}} placeholder="you@mitc.edu" required/></label>
        <label>Password<div className="login-password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event)=>{setPassword(event.target.value);setError("")}} placeholder="Enter your password" required/><button type="button" className="password-visibility" onClick={()=>setShowPassword((visible)=>!visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{showPassword ? <><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.2 9.5 7a11.8 11.8 0 0 1-3.1 4.5"/><path d="M6.2 6.2A12.2 12.2 0 0 0 2.5 12c1 2.8 4.5 7 9.5 7 1 0 1.9-.2 2.8-.5"/></> : <><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="3"/></>}</svg></button></div></label>
        {error&&<div className="login-error" role="alert">{error}</div>}
        <button className="login-submit" type="submit" disabled={working}>{working ? "Signing in…" : "Sign in"} <span>→</span></button>
      </form>
      {!isSupabaseConfigured ? <div className="login-error setup-message">Supabase isn’t connected yet. Add your new project URL and publishable key in <code>.env.local</code>, then run the database setup.</div> : <div className="login-footnote">Your student or administrator account must first be created in the MITC portal.</div>}
    </div></section>
  </main>
}

export { Login }
