const mongoose=require('mongoose')
async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URI,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
        const connection=mongoose.connection
        connection.on('connected',()=>{
            console.log("connected to db")
        })
        connection.on('error',(error)=>{
            console.log("error",error)
        })
    }
    catch(error){
        console.log("something is wrong",error)
    }
}
module.exports=connectDB