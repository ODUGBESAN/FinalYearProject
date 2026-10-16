import { Link } from "react-router-dom"

function Dashboard() {
    return (
        <section>
            <h1>Welcome to your learning portal</h1>
            <p>Course access and student accounts will be connected in a future backend phase.</p>
            <Link to="/courses">Explore courses</Link>
        </section>
    )
}

export default Dashboard
