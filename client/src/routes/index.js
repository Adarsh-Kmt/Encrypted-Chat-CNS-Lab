import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import RegisterPage from "../pages/RegisterPage";
import Checkemail from "../pages/Checkemail";
import Checkpassword from "../pages/Checkpassword";
import Home from "../pages/Home";
import MessagePage from "../components/MessagePage";
import AuthLayouts from "../layout";


const router = createBrowserRouter([
{
    path : "/",
    element : <App/>,
    children : [
        {
            path : "register",
            element : <AuthLayouts><RegisterPage/></AuthLayouts>
        },
        {
            path : 'email',
            element : <AuthLayouts><Checkemail/></AuthLayouts>
        },
        {
            path : 'password',
            element : <AuthLayouts><Checkpassword/></AuthLayouts>
        },
        {
            path : "",
            element : <Home/>,
            children : [
                {
                    path : ':userId',
                    element : <MessagePage/>
                }
            ]
        }
    ]
}
])

export default router