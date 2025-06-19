const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"provide name"]
    },
    email:{
        type:String,
        required:[true,"provide email"],
        unique:true
    },
    password:{
        type:String,
        required:[true,"provide password"]
    },
    profile_pic:{
        type:String,
        default:""
    },
    publicKey: {
        type: String,
        required: false, // Not required for legacy users, but should be set for new users
        default: ""
    }
},{
    timestamps:true
})

const UserModel=mongoose.model('User',userSchema)
module.exports=UserModel
