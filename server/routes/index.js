const express=require('express')
const regUser=require('../controller/regUser')
const chMail=require('../controller/chMail')
const chPass=require('../controller/chPass')
const userDetails=require('../controller/userDetails')
const logout=require('../controller/logout')
const updUser=require('../controller/updUser')
const searchUser=require('../controller/searchUser')

const router=express.Router()

router.post('/register',regUser)
router.post('/email',chMail)
router.post('/password',chPass)
router.get('/userdetails',userDetails)
router.get('/logout',logout)
router.post('/updateuser',updUser)
router.post('/searchuser',searchUser)

module.exports=router 