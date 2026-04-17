import { Link, Navigate, useNavigate } from "react-router-dom"
import logo from "../assets/logo3.jpg"
import { supabase } from "../Data/Supabase"
import { useEffect, useState } from "react"

function Navbar() {
    const nav = useNavigate()
    const [user, setUser] = useState(null)

    useEffect(() => {
        getUserRole()
    }, [])

    const getUserRole = async () => {
        const { data: email } = await supabase.auth.getUser()
        const userno = email.user.email.split("@")[0]
        const { data } = await supabase.from("myusers").select("*").eq("user_id", userno)
        setUser(data[0])
    }

    const logout = async () => {
        let confirm = window.confirm("Are you sure you want to logout")
        if (!confirm) {
            return
        }
        await supabase.auth.signOut()
        nav("/login")
        //return <Navigate to="/login"/>
    }
    return (
        <>
            <div className="navbar">
                <img src={logo} alt="" />

                <nav>
                    <Link to="/" className="nav-item">Dashboard</Link>
                    {user?.role == "learner" &&
                        <Link to="/courses" className="nav-item">My Courses</Link>
                    }
                    {user?.role == "tutor" &&
                        <>
                            <Link to="/add-learner" className="nav-item">Add Learner</Link>
                            <Link to="/add-course" className="nav-item">Add Course</Link>
                        </>
                    }
                </nav>

                <div className="nav-down">
                    <Link to="/settings" className="nav-item">Settings</Link>
                    <button onClick={logout} className="nav-item">Logout</button>
                </div>

            </div>
        </>
    )
}

export default Navbar