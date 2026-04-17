import { useEffect, useState } from "react"
import CourseCard from "../Components/CourseCard"
import { supabase } from "../Data/Supabase"

export function Courses() {
    const [courses, setCourses] = useState([])

    useEffect(() => {
        getCourses()
    }, [])

    const getCourses = async () => {
        const { data } = await supabase.from("courses").select("*").eq("dept", "webdesign")
        setCourses(data)
    }

    return (
        <>
            <h1>My Courses</h1>
            <br />
            <div className="course-grid">
                {courses.map((item) => (
                    <CourseCard item={item} key={item.id}/>
                ))}
            </div>

        </>
    )
}
