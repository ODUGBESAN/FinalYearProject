import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Login } from "./Pages/Login"
import { AdminPortal } from "./Pages/AdminPortal"
import { StudentPortal } from "./Pages/StudentPortal"
import { AuthProvider, useAuth } from "./Auth/AuthContext"

function RoleRoute({ role, children }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="auth-loading">Checking your MITC account…</div>
  return profile?.role === role ? children : <Navigate to="/login" replace />
}

function App() {
  return (

    <>
      <AuthProvider>
      <BrowserRouter>

        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<RoleRoute role="admin"><AdminPortal /></RoleRoute>} />
          <Route path="/student" element={<RoleRoute role="student"><StudentPortal /></RoleRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </>
  )
}
export default App
