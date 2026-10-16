import { useNavigate, useParams } from "react-router-dom"
import { courses } from "../Data/Courses"

export function CourseDetails() {
    const nav = useNavigate()
    const { id } = useParams()
    const courseDetail = courses.find((course) => String(course.id) === id)

    return (
        <>
            <button className="back" onClick={() => nav("/courses")}>Back</button>
            <div className="course-detail">
                <div className="course-left">
                    <img src={courseDetail?.thumbnail} alt="" />
                    <h1>{courseDetail?.title ?? "Course not found"}</h1>
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

