const express=require('express')
const cors=require('cors')
require('dotenv').config()
const connectDB=require('./config/connectDB')
const router=require('./routes')
const cookiesParser=require('cookie-parser')
const{app, server}=require('./socket/index')

// const app=express()

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

// Handle preflight OPTIONS requests for all routes
app.options('*', cors())

app.use(express.json())
app.use(cookiesParser())  



const PORT=8080

app.get('/',(request,response)=>{
    response.json({
        message : "Server running at " + PORT
    })
})

//api endpoints
app.use('/api',router)


connectDB().then(()=>{
    server.listen(PORT,()=>{
        console.log("server running at"+PORT)
    })
})
