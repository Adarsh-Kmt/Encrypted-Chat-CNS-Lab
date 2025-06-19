const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken")
const UserModel = require("../models/UserModel")

async function updUser(request,response){
    try {
        const token = request.cookies.token || ""
        if(!token)
        {
            return response.status(401).json({
                message :"Unauthorized access",
                error : true
            })
        }

        const user = await getUserDetailsFromToken(token)

        const { name, profile_pic } = request.body
        console.log(name);
        if(!name)
        {
            return response.status(400).json({
                message : "Name and profile pic required",
                error : true
            })
        }
        console.log(user._id);
        const updateUser = await UserModel.updateOne({ _id : user._id },{
            name,
            profile_pic
        })

        const userInfomation = await UserModel.findById(user._id)

        return response.json({
            message : "user update successfully",
            data : userInfomation,
            success : true
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true
        })
    }
}

module.exports = updUser