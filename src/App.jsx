import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Login } from "./Pages/Login"
import { Courses } from "./Pages/Courses"
import { CourseDetails } from "./Pages/CourseDetails"
import { Lesson } from "./Pages/Lesson"
import Dashboard from "./Pages/Dashboard"
import Navbar from "./Components/Navbar"
import Layout from "./Layout/Layout"
import { ProtectedRoute } from "./Layout/ProtectedRoute"


function App() {
  return (

    <>
      <BrowserRouter>

        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:id" element={<CourseDetails />} />
            <Route path="/course/:id/:lessonid" element={<Lesson />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  )
}
export default App