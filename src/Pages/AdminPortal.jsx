import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo3.jpg"
import { useAuth } from "../Auth/AuthContext"
import { supabase } from "../Data/Supabase"
import "./AdminPortal.css"
import "./AdminPortal.extra.css"


function Icon({ name }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    students: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    departments: <><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></>,
    lessons: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h8"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
    play: <><path d="m8 5 12 7-12 7z"/></>,
    note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function AdminPortal() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [section, setSection] = useState("Overview")
  const [students, setStudents] = useState([])
  const [lessons, setLessons] = useState([])
  const [departmentList, setDepartmentList] = useState([])
  const [studentForm, setStudentForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [savingStudentDetails, setSavingStudentDetails] = useState(false)
  const [deletingStudentId, setDeletingStudentId] = useState("")
  const [showEditingStudentPassword, setShowEditingStudentPassword] = useState(false)
  const [showStudentPassword, setShowStudentPassword] = useState(false)
  const [changingStudentId, setChangingStudentId] = useState("")
  const [lessonForm, setLessonForm] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState("")
  const [departmentForm, setDepartmentForm] = useState(false)
  const [query, setQuery] = useState("")
  const [notice, setNotice] = useState("")
  const [student, setStudent] = useState({ name: "", email: "", password: "", department_id: "", academic_level: "100" })
  const [lesson, setLesson] = useState({ title: "", department_id: "", target_level: "", notes: "", video: "" })
  const [departmentName, setDepartmentName] = useState("")
  const [dataError, setDataError] = useState("")

  const loadPortalData = useCallback(async () => {
    const [studentResult, departmentResult, lessonResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, student_id, department_id, academic_level, created_at, department:departments(name)").eq("role", "student").order("created_at", { ascending: false }),
      supabase.from("departments").select("id, name").order("name"),
      supabase.from("lessons").select("id, title, notes, video_url, department_id, target_level, created_at, department:departments(name)").order("created_at", { ascending: false }),
    ])
    const firstError = studentResult.error || departmentResult.error || lessonResult.error
    if (firstError) throw firstError
    const mappedStudents = (studentResult.data || []).map((row) => ({ ...row, profileId: row.id, id: row.student_id || row.id, name: row.full_name, department: row.department?.name || "Unassigned", created: new Date(row.created_at).toLocaleDateString() }))
    const mappedLessons = (lessonResult.data || []).map((row) => ({ ...row, date: new Date(row.created_at).toLocaleDateString(), video: row.video_url, department: row.department?.name || "Unassigned" }))
    setStudents(mappedStudents)
    setDepartmentList(departmentResult.data || [])
    setLessons(mappedLessons)
    setStudent((current) => ({ ...current, department_id: current.department_id || departmentResult.data?.[0]?.id || "" }))
    setLesson((current) => ({ ...current, department_id: current.department_id || departmentResult.data?.[0]?.id || "" }))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPortalData().catch((error) => setDataError(error.message || "Could not load MITC data."))
    }, 0)
    return () => clearTimeout(timer)
  }, [loadPortalData])
  const filteredStudents = useMemo(() => students.filter((person) => `${person.name} ${person.email} ${person.department} ${person.id}`.toLowerCase().includes(query.toLowerCase())), [students, query])
  const filteredLessons = useMemo(() => lessons.filter((item) => `${item.title} ${item.department} ${item.target_level || "all levels"}`.toLowerCase().includes(query.toLowerCase())), [lessons, query])

  const changeStudentLevel = async (person, nextLevel) => {
    const action = person.academic_level === "100" ? "promote" : "assign"
    if (!window.confirm(`Are you sure you want to ${action} ${person.name} to ${nextLevel} Level?`)) return
    setChangingStudentId(person.profileId)
    const { error } = await supabase.from("profiles").update({ academic_level: nextLevel }).eq("id", person.profileId).eq("role", "student")
    setChangingStudentId("")
    if (error) {
      setNotice(error.message || "Could not update the student's level.")
    } else {
      setStudents((current) => current.map((studentRow) => studentRow.profileId === person.profileId ? { ...studentRow, academic_level: nextLevel } : studentRow))
      setNotice(`${person.name} is now in ${nextLevel} Level.`)
    }
    window.setTimeout(() => setNotice(""), 4500)
  }

  const deleteStudent = async (person) => {
    const confirmed = window.confirm(`Permanently delete ${person.name} (${person.email})? Their sign-in account and student profile will be removed. This cannot be undone.`)
    if (!confirmed) return

    setDeletingStudentId(person.profileId)
    const { data, error } = await supabase.functions.invoke("delete-student", {
      body: { student_id: person.profileId },
    })
    setDeletingStudentId("")
    if (error || data?.error) {
      setNotice(data?.error || error?.message || "Could not delete the student account.")
      window.setTimeout(() => setNotice(""), 5000)
      return
    }

    setStudents((current) => current.filter((studentRow) => studentRow.profileId !== person.profileId))
    setNotice(`${person.name}'s student account was deleted.`)
    window.setTimeout(() => setNotice(""), 4500)
  }

  const addStudent = async (event) => {
    event.preventDefault()
    const { data, error } = await supabase.functions.invoke("create-student", { body: { full_name: student.name, email: student.email, password: student.password, department_id: student.department_id, academic_level: student.academic_level } })
    if (error || data?.error) { setNotice(data?.error || error?.message || "Could not create student account."); window.setTimeout(() => setNotice(""), 5000); return }
    await loadPortalData()
    setStudent({ name: "", email: "", password: "", department_id: departmentList[0]?.id || "", academic_level: "100" })
    setStudentForm(false)
    setNotice("Student account created. They can now sign in with the email and password you set.")
    window.setTimeout(() => setNotice(""), 4000)
  }

  const openStudentEditor = (person) => {
    setShowEditingStudentPassword(false)
    setEditingStudent({
      profileId: person.profileId,
      name: person.name,
      email: person.email || "",
      password: "",
      department_id: person.department_id || "",
      academic_level: person.academic_level || "",
    })
  }

  const saveStudentDetails = async (event) => {
    event.preventDefault()
    if (!editingStudent?.profileId) return
    setSavingStudentDetails(true)
    const { data, error } = await supabase.functions.invoke("update-student", {
      body: {
        student_id: editingStudent.profileId,
        full_name: editingStudent.name.trim(),
        email: editingStudent.email.trim(),
        password: editingStudent.password || undefined,
        department_id: editingStudent.department_id || null,
        academic_level: editingStudent.academic_level || null,
      },
    })
    setSavingStudentDetails(false)
    if (error || data?.error) {
      setNotice(data?.error || error?.message || "Could not update the student's account.")
      window.setTimeout(() => setNotice(""), 5000)
      return
    }
    const updatedStudent = data.student
    const updatedDepartment = departmentList.find((item) => item.id === updatedStudent.department_id)?.name || "Unassigned"
    setStudents((current) => current.map((person) => person.profileId === updatedStudent.id ? {
      ...person,
      full_name: updatedStudent.full_name,
      name: updatedStudent.full_name,
      email: updatedStudent.email,
      department_id: updatedStudent.department_id,
      department: updatedDepartment,
      academic_level: updatedStudent.academic_level,
    } : person))
    setEditingStudent(null)
    setShowEditingStudentPassword(false)
    setNotice(updatedStudent.password_updated ? "Student details and password updated successfully." : "Student details updated. The existing password was kept.")
    window.setTimeout(() => setNotice(""), 5000)
  }

  const openLessonEditor = (item) => {
    setEditingLessonId(item.id)
    setLesson({ title: item.title, department_id: item.department_id, target_level: item.target_level || "", notes: item.notes, video: item.video })
    setLessonForm(true)
  }

  const startNewLesson = () => {
    setEditingLessonId("")
    setLesson({ title: "", department_id: departmentList[0]?.id || "", target_level: "", notes: "", video: "" })
    setLessonForm(true)
  }

  const addLesson = async (event) => {
    event.preventDefault()
    const lessonData = { title: lesson.title.trim(), notes: lesson.notes.trim(), video_url: lesson.video.trim(), department_id: lesson.department_id, target_level: lesson.target_level || null }
    const query = editingLessonId
      ? supabase.from("lessons").update(lessonData).eq("id", editingLessonId)
      : supabase.from("lessons").insert({ ...lessonData, created_by: profile.id })
    const { data, error } = await query.select("id, title, notes, video_url, department_id, target_level, created_at, department:departments(name)").single()
    if (error) { setNotice(error.message); window.setTimeout(() => setNotice(""), 5000); return }
    const mappedLesson = { ...data, date: new Date(data.created_at).toLocaleDateString(), video: data.video_url, department: data.department?.name || "" }
    if (editingLessonId) {
      setLessons((current) => current.map((item) => item.id === data.id ? mappedLesson : item))
    } else {
      setLessons((current) => [mappedLesson, ...current])
    }
    setLesson({ title: "", department_id: departmentList[0]?.id || "", target_level: "", notes: "", video: "" })
    setEditingLessonId("")
    setLessonForm(false)
    setNotice(editingLessonId ? "Lesson updated successfully." : "Lesson published for the selected department and level.")
    window.setTimeout(() => setNotice(""), 3500)
  }

  const addDepartment = async (event) => {
    event.preventDefault()
    const { data, error } = await supabase.from("departments").insert({ name: departmentName.trim() }).select("id, name").single()
    if (error) { setNotice(error.message); window.setTimeout(() => setNotice(""), 5000); return }
    setDepartmentList((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
    setDepartmentName("")
    setDepartmentForm(false)
    setNotice(`${data.name} department added.`)
    window.setTimeout(() => setNotice(""), 3500)
  }

  const title = section === "Students" ? "Students" : section === "Lessons" ? "Lessons & notes" : section === "Departments" ? "Departments" : "Overview"
  const leavePortal = async () => {
    if (!window.confirm("Are you sure you want to sign out?")) return
    await signOut()
    navigate("/login", { replace: true })
  }
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <a href="#overview" className="admin-brand"><img src={logo} alt="MITC" /></a>
        <div className="workspace-label">LEARNING PORTAL</div>
        <div className="side-links">
          {[ ["Overview", "overview"], ["Students", "students"], ["Departments", "departments"], ["Lessons", "lessons"] ].map(([label, icon]) => <button key={label} className={`side-link ${section === label ? "active" : ""}`} onClick={() => { setSection(label); setQuery("") }}><Icon name={icon}/><span>{label}</span>{label === "Students" && <small>{students.length}</small>}</button>)}
        </div>
        <div className="sidebar-bottom"><div className="preview-label"><span className="live-dot"/> Supabase connected</div><div className="admin-profile"><div className="avatar">{profile.full_name?.[0] || "A"}</div><div><strong>{profile.full_name}</strong><span>Administrator</span></div><button className="profile-menu" onClick={leavePortal}>Sign out</button></div></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar"><button className="mobile-menu" aria-label="Open menu"><Icon name="menu"/></button><div className="breadcrumb">MITC <span>/</span> <strong>{title}</strong></div><div className="topbar-right"><span className="topbar-date">Friday, October 16, 2026</span><div className="avatar small-avatar">{profile.full_name?.[0] || "A"}</div><button className="top-signout" onClick={leavePortal}>Sign out</button></div></header>
        <div className="admin-content">
          <div className="page-heading"><div><div className="welcome-label">MASROOR INTERNATIONAL TECHNICAL COLLEGE</div><h1>{section === "Overview" ? `Good morning, ${profile.full_name?.split(" ")[0] || "Admin"}` : title}<span className="heading-period">.</span></h1><p>{section === "Overview" ? "Here’s what’s happening across your learning portal." : section === "Students" ? "Create student accounts and assign each learner a department and level." : section === "Departments" ? "Manage the departments students and lessons are assigned to." : "Share after-class notes and video lessons with a department and level."}</p></div>
            {section === "Students" ? <button className="primary-button" onClick={() => setStudentForm(true)}><Icon name="plus"/> Add student</button> : section === "Lessons" ? <button className="primary-button" onClick={startNewLesson}><Icon name="plus"/> Add lesson</button> : section === "Departments" ? <button className="primary-button" onClick={() => setDepartmentForm(true)}><Icon name="plus"/> Add department</button> : <button className="primary-button" onClick={() => setStudentForm(true)}><Icon name="plus"/> Create student</button>}
          </div>

          {section === "Overview" && <>
            <div className="stats-grid"><article className="stat-card"><div className="stat-top"><span>Total students</span><span className="stat-icon blue"><Icon name="students"/></span></div><strong>{students.length.toString().padStart(2,"0")}</strong><small>Accounts in the portal</small></article><article className="stat-card"><div className="stat-top"><span>Departments</span><span className="stat-icon amber"><Icon name="departments"/></span></div><strong>{departmentList.length.toString().padStart(2,"0")}</strong><small>Active learning groups</small></article><article className="stat-card"><div className="stat-top"><span>Published lessons</span><span className="stat-icon green"><Icon name="lessons"/></span></div><strong>{lessons.length.toString().padStart(2,"0")}</strong><small>Notes & video resources</small></article><article className="stat-card welcome-stat"><div className="stat-top"><span>Portal status</span><span className="status-pill"><i/> Connected</span></div><strong className="stat-status">Ready to teach</strong><small>Supabase data is live</small></article></div>
            <div className="overview-grid"><section className="panel department-panel"><div className="panel-heading"><div><h2>Departments</h2><p>Student groups at MITC</p></div><button className="quiet-button" onClick={() => setSection("Departments")}>Manage departments <Icon name="arrow"/></button></div><div className="department-list">{departmentList.slice(0,6).map((item,index)=><div className="department-row" key={item.id}><div className={`dept-mark dept-${index%4}`}>{item.name.split(/\s+/).map((part)=>part[0]).join("").slice(0,2).toUpperCase()}</div><span>{item.name}</span><strong>{students.filter((person)=>person.department===item.name).length.toString().padStart(2,"0")} <small>students</small></strong></div>)}</div></section>
              <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recently shared</h2><p>Latest lessons for students</p></div><button className="icon-button" aria-label="View all lessons" onClick={()=>setSection("Lessons")}><Icon name="arrow"/></button></div><div className="mini-lessons">{lessons.slice(0,3).map((item)=><button className="mini-lesson" key={item.id} onClick={()=>setSection("Lessons")}><span className="mini-play"><Icon name="play"/></span><span className="mini-lesson-copy"><strong>{item.title}</strong><small>{item.department}</small></span><span className="mini-date">{item.date}</span></button>)}</div></section>
            </div>
            <section className="panel recent-students"><div className="panel-heading"><div><h2>Recently added students</h2><p>New learners in your portal</p></div><button className="quiet-button" onClick={()=>setSection("Students")}>Manage students <Icon name="arrow"/></button></div><StudentTable students={students.slice(0,4)} onChangeLevel={changeStudentLevel} changingStudentId={changingStudentId} onEditStudent={openStudentEditor} onDeleteStudent={deleteStudent} deletingStudentId={deletingStudentId}/></section>
          </>}

          {section === "Students" && <section className="panel directory-panel"><div className="directory-toolbar"><div className="search-box"><Icon name="search"/><input aria-label="Search students" placeholder="Search students..." value={query} onChange={(event)=>setQuery(event.target.value)}/></div><select aria-label="Filter students by department" onChange={(event)=>setQuery(event.target.value)}><option value="">All departments</option>{departmentList.map((item)=><option key={item.id}>{item.name}</option>)}</select><span className="result-count">{filteredStudents.length} students</span></div><StudentTable students={filteredStudents} onChangeLevel={changeStudentLevel} changingStudentId={changingStudentId} onEditStudent={openStudentEditor} onDeleteStudent={deleteStudent} deletingStudentId={deletingStudentId}/></section>}

          {section === "Departments" && <section className="department-directory">{departmentList.map((item,index)=><article className="department-directory-card" key={item.id}><div className={`dept-mark dept-${index%4}`}>{item.name.split(/\s+/).map((part)=>part[0]).join("").slice(0,2).toUpperCase()}</div><h2>{item.name}</h2><p>Student accounts assigned</p><strong>{students.filter((person)=>person.department===item.name).length.toString().padStart(2,"0")} <small>students</small></strong></article>)}</section>}

          {section === "Lessons" && <section className="lesson-library">{filteredLessons.map((item)=><article className="lesson-card" key={item.id}><div className="lesson-card-top"><span className="lesson-type"><Icon name="note"/> CLASS NOTES + VIDEO</span><div className="lesson-card-actions"><span className="lesson-date">{item.date}</span><button type="button" className="lesson-edit-button" onClick={() => openLessonEditor(item)}>Edit</button></div></div><h2>{item.title}</h2><span className="lesson-dept">{item.department} · {item.target_level ? `${item.target_level} Level` : "All Levels"}</span><p>{item.notes}</p><div className="lesson-card-footer"><a href={item.video} target="_blank" rel="noreferrer"><span className="play-dot"><Icon name="play"/></span> Watch lesson <Icon name="arrow"/></a><span>Shared with {item.target_level ? `${item.target_level} Level` : "all levels"}</span></div></article>)}{filteredLessons.length===0&&<div className="empty-state">No lessons match that search yet.</div>}</section>}
          {dataError && <div className="login-error">{dataError}</div>}
        </div>
      </main>

      {notice && <div className="toast"><span className="toast-check">✓</span>{notice}</div>}
      {editingStudent && <div className="modal-backdrop" onClick={()=>!savingStudentDetails&&setEditingStudent(null)}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="edit-student-title" onClick={(event)=>event.stopPropagation()}><div className="modal-heading"><div><span className="modal-kicker">STUDENT DIRECTORY</span><h2 id="edit-student-title">Edit student account</h2><p>Update this learner’s personal and sign-in details.</p></div><button className="modal-close" onClick={()=>setEditingStudent(null)} aria-label="Close" disabled={savingStudentDetails}>×</button></div><form onSubmit={saveStudentDetails}><label>Student name<input required autoFocus value={editingStudent.name} onChange={(event)=>setEditingStudent((current)=>({...current,name:event.target.value}))} placeholder="e.g. Amina Yusuf"/></label><label>Student email<input required type="email" value={editingStudent.email} onChange={(event)=>setEditingStudent((current)=>({...current,email:event.target.value}))} placeholder="student@mitc.edu"/></label><label>New password <span className="optional-label">(leave blank to keep current)</span><div className="admin-password-field"><input minLength="8" type={showEditingStudentPassword ? "text" : "password"} value={editingStudent.password} onChange={(event)=>setEditingStudent((current)=>({...current,password:event.target.value}))} placeholder="At least 8 characters" autoComplete="new-password"/><button type="button" onClick={()=>setShowEditingStudentPassword((visible)=>!visible)} aria-label={showEditingStudentPassword ? "Hide new password" : "Show new password"} aria-pressed={showEditingStudentPassword}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{showEditingStudentPassword ? <><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.2 9.5 7a11.8 11.8 0 0 1-3.1 4.5"/><path d="M6.2 6.2A12.2 12.2 0 0 0 2.5 12c1 2.8 4.5 7 9.5 7 1 0 1.9-.2 2.8-.5"/></> : <><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="3"/></>}</svg><span>{showEditingStudentPassword ? "Hide" : "Show"}</span></button></div></label><label>Department<select value={editingStudent.department_id} onChange={(event)=>setEditingStudent((current)=>({...current,department_id:event.target.value}))}><option value="">Unassigned</option>{departmentList.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Student level<select value={editingStudent.academic_level} onChange={(event)=>setEditingStudent((current)=>({...current,academic_level:event.target.value}))}><option value="">Not assigned</option><option value="100">100 Level</option><option value="200">200 Level</option></select></label><div className="modal-note">Passwords are stored securely by Supabase and cannot be viewed here. Enter a new password only when you need to reset it; use at least 8 characters.</div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setEditingStudent(null)} disabled={savingStudentDetails}>Cancel</button><button className="primary-button" type="submit" disabled={savingStudentDetails}>{savingStudentDetails ? "Saving..." : "Save student details"}</button></div></form></section></div>}
      {studentForm && <div className="modal-backdrop" onClick={()=>setStudentForm(false)}><section className="admin-modal" onClick={(event)=>event.stopPropagation()}><div className="modal-heading"><div><span className="modal-kicker">STUDENT DIRECTORY</span><h2>Create student account</h2><p>Add a learner and assign their department.</p></div><button className="modal-close" onClick={()=>setStudentForm(false)} aria-label="Close">×</button></div><form onSubmit={addStudent}><label>Student name<input required value={student.name} onChange={(event)=>setStudent({...student,name:event.target.value})} placeholder="e.g. Amina Yusuf"/></label><label>Student email<input required type="email" value={student.email} onChange={(event)=>setStudent({...student,email:event.target.value})} placeholder="student@mitc.edu"/></label><label>Temporary password<div className="admin-password-field"><input required minLength="8" type={showStudentPassword ? "text" : "password"} value={student.password} onChange={(event)=>setStudent({...student,password:event.target.value})} placeholder="At least 8 characters"/><button type="button" onClick={()=>setShowStudentPassword((visible)=>!visible)} aria-label={showStudentPassword ? "Hide password" : "Show password"} aria-pressed={showStudentPassword}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{showStudentPassword ? <><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.2 9.5 7a11.8 11.8 0 0 1-3.1 4.5"/><path d="M6.2 6.2A12.2 12.2 0 0 0 2.5 12c1 2.8 4.5 7 9.5 7 1 0 1.9-.2 2.8-.5"/></> : <><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="3"/></>}</svg><span>{showStudentPassword ? "Hide" : "Show"}</span></button></div></label><label>Department<select required value={student.department_id} onChange={(event)=>setStudent({...student,department_id:event.target.value})}>{departmentList.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Student level<select required value={student.academic_level} onChange={(event)=>setStudent({...student,academic_level:event.target.value})}><option value="100">100 Level</option><option value="200">200 Level</option></select></label><div className="modal-note">Supabase creates this student’s sign-in and saves their department assignment.</div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setStudentForm(false)}>Cancel</button><button className="primary-button" type="submit">Create account <span>↗</span></button></div></form></section></div>}
      {lessonForm && <div className="modal-backdrop" onClick={()=>setLessonForm(false)}><section className="admin-modal lesson-modal" onClick={(event)=>event.stopPropagation()}><div className="modal-heading"><div><span className="modal-kicker">AFTER-CLASS LEARNING</span><h2>{editingLessonId ? "Edit lesson" : "Share a lesson"}</h2><p>{editingLessonId ? "Update lesson notes, video, department, or level." : "Post notes and a video for a department."}</p></div><button className="modal-close" onClick={()=>setLessonForm(false)} aria-label="Close">×</button></div><form onSubmit={addLesson}><label>Lesson title<input required value={lesson.title} onChange={(event)=>setLesson({...lesson,title:event.target.value})} placeholder="e.g. Introduction to HTML"/></label><label>Department<select required value={lesson.department_id} onChange={(event)=>setLesson({...lesson,department_id:event.target.value})}>{departmentList.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>For level<select value={lesson.target_level} onChange={(event)=>setLesson({...lesson,target_level:event.target.value})}><option value="">All levels</option><option value="100">100 Level</option><option value="200">200 Level</option></select></label><label>Written notes<textarea required rows="5" value={lesson.notes} onChange={(event)=>setLesson({...lesson,notes:event.target.value})} placeholder="Write the key points students should review after class..."/></label><label>Video link<input required type="url" value={lesson.video} onChange={(event)=>setLesson({...lesson,video:event.target.value})} placeholder="https://youtube.com/..."/></label><div className="modal-note">This lesson will be saved in Supabase and shown to students in the selected department.</div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setLessonForm(false)}>Cancel</button><button className="primary-button" type="submit">{editingLessonId ? "Save changes" : "Publish lesson"} <span>↗</span></button></div></form></section></div>}
      {departmentForm && <div className="modal-backdrop" onClick={()=>setDepartmentForm(false)}><section className="admin-modal" onClick={(event)=>event.stopPropagation()}><div className="modal-heading"><div><span className="modal-kicker">GROWING MITC</span><h2>Add a department</h2><p>New departments become available for students and lessons.</p></div><button className="modal-close" onClick={()=>setDepartmentForm(false)} aria-label="Close">×</button></div><form onSubmit={addDepartment}><label>Department name<input required value={departmentName} onChange={(event)=>setDepartmentName(event.target.value)} placeholder="e.g. Automotive Engineering"/></label><div className="modal-note">Departments currently in use: {departmentList.length}. Existing students and lessons will keep their current assignments.</div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setDepartmentForm(false)}>Cancel</button><button className="primary-button" type="submit">Add department <span>↗</span></button></div></form></section></div>}
    </div>
  )
}

function StudentTable({ students, onChangeLevel, changingStudentId, onEditStudent, onDeleteStudent, deletingStudentId }) {
  return <div className="table-scroll"><table className="student-table"><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>DEPARTMENT</th><th>LEVEL / ACTION</th><th>ADDED</th></tr></thead><tbody>{students.map((person,index)=><tr key={`${person.id}-${index}`}><td><div className="student-cell"><span className={`student-avatar student-avatar-${index%4}`}>{person.name.split(" ").map((part)=>part[0]).join("").slice(0,2)}</span><span><strong>{person.name}</strong><small>{person.email}</small><span className="student-actions"><button type="button" className="student-name-edit" onClick={()=>onEditStudent(person)}>Edit details</button><button type="button" className="student-delete-button" onClick={()=>onDeleteStudent(person)} disabled={deletingStudentId === person.profileId}>{deletingStudentId === person.profileId ? "Deleting..." : "Delete"}</button></span></span></div></td><td className="student-id">{person.id}</td><td><span className="department-chip">{person.department}</span></td><td className="level-action-cell"><span>{person.academic_level ? `${person.academic_level} Level` : "Not set"}</span>{person.academic_level !== "200" && <button type="button" className="level-action-button" disabled={changingStudentId === person.profileId} onClick={() => onChangeLevel(person, person.academic_level === "100" ? "200" : "100")}>{changingStudentId === person.profileId ? "Updating..." : person.academic_level === "100" ? "Promote to 200" : "Assign 100"}</button>}</td><td className="added-cell">{person.created}</td></tr>)}</tbody></table>{students.length===0&&<div className="empty-state">No students found. Add a student to get started.</div>}</div>
}

export { AdminPortal }
