import { useParams } from "react-router-dom"
import { courses } from "../Data/Courses"
import { useState } from "react"


export function Lesson() {
    const { id, lessonid } = useParams()
    const [courseLesson] = useState(courses.find((item) => item.id == id))
    const [right] = useState(courseLesson.lessons.find((item) => item.id == lessonid))
    return (
        <>
            <iframe
                width="100%"
                height="500"
                src={`https://www.youtube.com/embed/${right?.videosrc}`}
                title={right?.title}
                frameBorder="0"
                allowFullScreen
            ></iframe>

            {id}
            <h1>{lessonid}</h1>

        </>
    )
}
