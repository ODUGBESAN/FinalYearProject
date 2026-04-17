import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "../Data/Supabase"

export function CourseDetails() {
    const nav = useNavigate()
    const [courseDetail, setCourseDetail] = useState(null)
    const { id } = useParams()

    useEffect(() => {
        getCourseDetail()
    }, [id])

    const getCourseDetail = async () => {
        const { data } = await supabase.from("courses").select("*").eq("id", id).single()
        setCourseDetail(data)
    }

    return (
        <>
            <button className="back" onClick={() => nav("/courses")}>Back</button>
            <div className="course-detail">
                <div className="course-left">
                    <img src={courseDetail?.img} alt="" />
                    <h1>{courseDetail?.course_name}</h1>
                    {/* {courseList.lessons.map((item) => (
                        <Link to={`${item.id}`}>{item.title}</Link>
                    ))} */}
                </div>
                <div className="course-right">
                    q
                </div>
            </div>



        </>
    )
}

