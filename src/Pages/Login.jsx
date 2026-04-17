import { useNavigate } from "react-router-dom";
import { useState } from "react";
import img from "../assets/logo3.jpg"
import "../App.css"
import { supabase } from "../Data/Supabase";


export function Login() {
    const navigate = useNavigate();

    const [email, setMail] = useState("");
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState("")

    const handleLogin = async (e) => {
        e.preventDefault();

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        if (error) {
            alert(error.message)
            return
        }
        navigate("/")
        setFormError("")


    };

    return (
        <div className="main">
            <div className="login-container">

                {/* left */}
                <div className="left">

                    <img src={img} alt="" width="200px" />
                    <h2>Welcome Back!</h2>
                    <p>Access your learning portal to view courses and lessons.
                        Your journey to technical excellence continues here.
                    </p>
                </div>

                {/* right*/}
                <div className="right">
                    <h2>Login to Your Account</h2>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label style={{ textAlign: "left", paddingBottom: "5px" }}>Email Address*</label>
                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setMail(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label style={{ textAlign: "left", paddingBottom: "5px" }}>Password*</label>
                            <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <p className="error">{formError}</p>
                        </div>

                        <button type="submit">Login</button>

                    </form>
                </div>
            </div>
        </div>
    )
}