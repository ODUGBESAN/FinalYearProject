import CourseCard from "../Components/CourseCard"
import { courses } from "../Data/Courses"

export function Courses() {
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
