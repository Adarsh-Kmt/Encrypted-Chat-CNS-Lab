const UserModel=require("../models/UserModel")
const bcryptjs=require('bcryptjs')
async function regUser(req,res){
    try{
        const {name,email,password,profile_pic,publicKey}=req.body
        const checkEmail =await UserModel.findOne({email})//return all info
        if(checkEmail){
            return res.status(400).json({
                message:"user exists",
                error:true
            })
        }
        //hashing
        const salt=await bcryptjs.genSalt(10)
        const hash=await bcryptjs.hash(password,salt)

        const payload={
            name,
            email,
            profile_pic,
            password:hash,
            publicKey: publicKey || ""
        }
        const user =new UserModel(payload)
        const userSave=await user.save()
        return res.status(201).json({
            message:" user created",
            data:userSave,
            success:true
        })
    }catch(err){
        return res.status(500).json({
            message:err.message || err,
            error:true
        })
    }
}

module.exports=regUser