import { Link } from "react-router-dom"

function CourseCard({ item }) {
    return (
        <>
            <Link to={`/course/${item.id}`} className="course-card">
                <div className="course-img-bg">
                    <img src={item.img} alt="" />
                </div>
                <div className="course-content"> 
                    <h1>{item.course_name}</h1>
                    <h1>{ }</h1>
                </div>

            </Link>
        </>
    )
}

export default CourseCard