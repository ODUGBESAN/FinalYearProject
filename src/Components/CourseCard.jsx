import { Link } from "react-router-dom"

function CourseCard({ item }) {
    return (
        <>
            <Link to={`/course/${item.id}`} className="course-card">
                <div className="course-img-bg">
                    <img src={item.thumbnail} alt="" />
                </div>
                <div className="course-content"> 
                    <h1>{item.title}</h1>
                    <p>{item.tutor}</p>
                </div>

            </Link>
        </>
    )
}

export default CourseCard
