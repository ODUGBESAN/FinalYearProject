import { useEffect, useState } from "react"
import { supabase } from "../Data/Supabase"

function Dashboard() {
    const [user, setUser] = useState(null)

    useEffect(() => {
        hete()
    }, [])

    const hete = async () => {
        const { data: email } = await supabase.auth.getUser()
        const userno = email.user.email.split("@")[0]
        const { data } = await supabase.from("myusers").select("*").eq("user_id", userno)
        setUser(data[0])
    }

    return (
        <>
            {user?.role == "learner" && <h1>Learner Dashboard</h1>}
            {user?.role == "tutor" && <h1>Tutor Dashboard</h1>}
        </>
    )
}

export default Dashboard