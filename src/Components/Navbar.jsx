import { Link } from "react-router-dom"
import logo from "../assets/logo3.jpg"

function Navbar() {
    return (
        <>
            <div className="navbar">
                <img src={logo} alt="" />

                <nav>
                    <Link to="/dashboard" className="nav-item">Dashboard</Link>
                    <Link to="/courses" className="nav-item">Courses</Link>
                </nav>

                <div className="nav-down">
                    <Link to="/" className="nav-item">Home</Link>
                    <Link to="/login" className="nav-item">Sign in</Link>
                </div>

            </div>
        </>
    )
}

export default Navbar
