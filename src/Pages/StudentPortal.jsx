import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo3.jpg"
import { useAuth } from "../Auth/AuthContext"
import { supabase } from "../Data/Supabase"
import "./StudentPortal.css"

function StudentPortal() {
  const navigate = useNavigate()
  const { profile: student, signOut } = useAuth()
  const [lessons, setLessons] = useState([])
  const [loadError, setLoadError] = useState("")
  useEffect(() => {
    supabase.from("lessons").select("id, title, notes, video_url, target_level, created_at, department:departments(name)").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error
        setLessons((data || []).map((lesson) => ({ ...lesson, video: lesson.video_url, date: new Date(lesson.created_at).toLocaleDateString() })))
      })
      .catch((error) => setLoadError(error.message || "Could not load your lessons."))
  }, [])
  const leavePortal = async () => { await signOut(); navigate("/login", { replace: true }) }

  return <main className="student-app">
    <header className="student-topbar"><img src={logo} alt="Masroor International Technical College"/><div className="student-top-actions"><span>{student.department} · {student.academic_level ? `${student.academic_level} Level` : "Level not set"}</span><div className="student-top-avatar">{student.full_name.split(" ").map((part)=>part[0]).join("").slice(0,2)}</div><button onClick={leavePortal}>Sign out</button></div></header>
    <section className="student-welcome"><div className="student-kicker">YOUR MITC LEARNING SPACE</div><h1>Welcome, {student.full_name.split(" ")[0]}.</h1><p>Here are the after-class lessons and notes shared with your department and level.</p><div className="student-department-badge">{student.department || "Department not assigned"} · {student.academic_level ? `${student.academic_level} Level` : "Level not set"}</div></section>
    <section className="student-lessons"><div className="student-section-heading"><div><span>KEEP LEARNING</span><h2>Your lessons</h2></div><small>{lessons.length} {lessons.length===1?"lesson":"lessons"} available</small></div>
      {loadError ? <div className="student-empty"><p>{loadError}</p></div> : lessons.length ? <div className="student-lesson-grid">{lessons.map((lesson,index)=><article className="student-lesson" key={lesson.id}><div className={`student-lesson-icon student-icon-${index%3}`}>0{index+1}</div><div className="student-lesson-meta"><span>{lesson.department?.name} · {lesson.target_level ? `${lesson.target_level} Level` : "All Levels"}</span><small>{lesson.date}</small></div><h3>{lesson.title}</h3><div className="student-notes"><strong>Class notes</strong><p>{lesson.notes}</p></div><a href={lesson.video} target="_blank" rel="noreferrer" className="student-watch"><span>▶</span> Watch lesson video <b>↗</b></a></article>)}</div> : <div className="student-empty"><div>✳</div><h3>No lessons yet</h3><p>Your instructor hasn’t shared a lesson with your department and level yet. Check back after class.</p></div>}
    </section>
    <footer className="student-footer">Masroor International Technical College <span>Learning that moves you forward.</span></footer>
  </main>
}

export { StudentPortal }
