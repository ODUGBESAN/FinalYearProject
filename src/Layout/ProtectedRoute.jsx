import { useEffect, useState } from "react"
import { supabase } from "../Data/Supabase"
import { Navigate } from "react-router-dom"

export function ProtectedRoute({ children }) {

    const [user, setUser] = useState(null)

    useEffect(() => {
        getUser()
    }, [])

    const getUser = async () => {
        const { data } = await supabase.auth.getUser()
        setUser(data.user)
        if (!user) {
            return <Navigate to="/login" />
        }
    }



    return children

}
