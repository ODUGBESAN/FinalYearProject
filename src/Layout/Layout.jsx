import { Outlet } from "react-router-dom";
import Navbar from "../Components/Navbar";

function Layout() {
    return (
        <>
            <main>
                <Navbar />

                <div style={{flex: 1, padding: "20px", overflowY: "scroll"}}> 
                    <Outlet />
                </div>

            </main>
        </>
    )
}

export default Layout