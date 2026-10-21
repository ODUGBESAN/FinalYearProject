import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import logo from "../assets/logo3.jpg"
import { useAuth } from "../Auth/AuthContext"
import { supabase } from "../Data/Supabase"
import { FormattedNotes } from "../Components/FormattedNotes"
import "./StudentPortal.css"

function StudentPortal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile: student, signOut } = useAuth()
  const [lessons, setLessons] = useState([])
  const [loadError, setLoadError] = useState("")
  const [openedLesson, setOpenedLesson] = useState(null)
  useEffect(() => {
    supabase.from("lessons").select("id, title, notes, video_url, target_level, created_at, department_id, department:departments(name)").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error
        setLessons((data || []).map((lesson) => ({ ...lesson, video: lesson.video_url, date: new Date(lesson.created_at).toLocaleDateString() })))
      })
      .catch((error) => setLoadError(error.message || "Could not load your lessons."))
  }, [])
  useEffect(() => {
    if (location.pathname === "/student/past-lessons" && student.academic_level !== "200") {
      navigate("/student", { replace: true })
    }
  }, [location.pathname, navigate, student.academic_level])
  const leavePortal = async () => {
    if (!window.confirm("Are you sure you want to sign out?")) return
    await signOut()
    navigate("/login", { replace: true })
  }

  const hasPastLessons = student.academic_level === "200"
  const lessonView = location.pathname === "/student/past-lessons" ? "past" : "current"
  const currentLessons = lessons.filter((lesson) => !lesson.target_level || lesson.target_level === student.academic_level)
  const pastLessons = hasPastLessons ? lessons.filter((lesson) => lesson.target_level === "100") : []
  const visibleLessons = lessonView === "past" ? pastLessons : currentLessons

  return <main className="student-app">
    <header className="student-topbar"><img src={logo} alt="Masroor International Technical College"/><div className="student-top-actions"><span>{student.department} · {student.academic_level ? `${student.academic_level} Level` : "Level not set"}</span><div className="student-top-avatar">{student.full_name.split(" ").map((part)=>part[0]).join("").slice(0,2)}</div><button onClick={leavePortal}>Sign out</button></div></header>
    <section className="student-welcome"><div className="student-kicker">YOUR MITC LEARNING SPACE</div><h1>Welcome, {student.full_name.split(" ")[0]}.</h1><p>Here are the after-class lessons and notes shared with your department and level.</p><div className="student-department-badge">{student.department || "Department not assigned"} · {student.academic_level ? `${student.academic_level} Level` : "Level not set"}</div></section>
    <section className="student-lessons"><div className="student-section-heading"><div><span>KEEP LEARNING</span><h2>{lessonView === "past" ? "Past lessons" : "Your lessons"}</h2></div><small>{visibleLessons.length} {visibleLessons.length===1?"lesson":"lessons"} available</small></div>
      {hasPastLessons && <div className="student-lesson-tabs" aria-label="Lesson categories"><button type="button" aria-current={lessonView === "current" ? "page" : undefined} className={lessonView === "current" ? "active" : ""} onClick={() => navigate("/student")}>Current lessons <span>{currentLessons.length}</span></button><button type="button" aria-current={lessonView === "past" ? "page" : undefined} className={lessonView === "past" ? "active" : ""} onClick={() => navigate("/student/past-lessons")}>Past lessons <span>{pastLessons.length}</span></button></div>}
      {loadError ? <div className="student-empty"><p>{loadError}</p></div> : visibleLessons.length ? <div className="student-lesson-grid">{visibleLessons.map((lesson,index)=><article className="student-lesson" key={lesson.id}><div className={`student-lesson-icon student-icon-${index%3}`}>0{index+1}</div><div className="student-lesson-meta"><span>{lesson.department?.name}</span>{lesson.target_level ? <span className={`student-level-badge${lessonView === "past" ? " past" : ""}`}>{lesson.target_level} Level</span> : <span className="student-level-badge">All Levels</span>}<small>{lesson.date}</small></div><h3>{lesson.title}</h3><div className="student-notes student-notes-preview"><strong>Class notes</strong><p>Open this lesson to read the full notes and examples.</p><button type="button" className="student-read-button" onClick={() => setOpenedLesson(lesson)}>Read full lesson <span aria-hidden="true">→</span></button></div><a href={lesson.video} target="_blank" rel="noreferrer" className="student-watch"><span>▶</span> Watch lesson video <b>↗</b></a></article>)}</div> : <div className="student-empty"><div>✳</div><h3>{lessonView === "past" ? "No past lessons yet" : "No lessons yet"}</h3><p>{lessonView === "past" ? "Your previous level’s lessons will appear here when they’re available." : "Your instructor hasn’t shared a lesson with your department and level yet. Check back after class."}</p></div>}
      {openedLesson && <div className="student-lesson-backdrop" onClick={() => setOpenedLesson(null)}><article className="student-lesson-dialog" role="dialog" aria-modal="true" aria-labelledby="opened-lesson-title" onClick={(event) => event.stopPropagation()}><div className="student-lesson-dialog-heading"><div><span>LESSON NOTEBOOK</span><h2 id="opened-lesson-title">{openedLesson.title}</h2><p>{openedLesson.department?.name} · {openedLesson.target_level ? `${openedLesson.target_level} Level` : "All Levels"} · {openedLesson.date}</p></div><button type="button" aria-label="Close lesson" onClick={() => setOpenedLesson(null)}>×</button></div><div className="student-lesson-dialog-content"><FormattedNotes notes={openedLesson.notes}/></div><a href={openedLesson.video} target="_blank" rel="noreferrer" className="student-watch"><span>▶</span> Watch lesson video <b>↗</b></a></article></div>}
    </section>
    <footer className="student-footer">Masroor International Technical College <span>Learning that moves you forward.</span></footer>
  </main>
}

export { StudentPortal }
