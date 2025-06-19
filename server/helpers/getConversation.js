const { ConversationModel } = require("../models/ConversationModel")

const getConversation = async(currentUserId)=>{
    if(currentUserId){
        const currentUserConversation = await ConversationModel.find({
            "$or" : [
                { sender : currentUserId },
                { receiver : currentUserId},
            ],
        }).sort({  updatedAt : -1 }).populate('messages').populate({path:'sender',select:'-password'}).populate({path:'receiver',select:'-password'})
        const conversation = currentUserConversation.map((conv)=>{
            console.log('conv?.messages,',conv?.messages,)
            const countUnseenMsg = conv?.messages?.reduce((preve,curr) => {
                const msgByUserId = curr?.msgByUserId?.toString()
                console.log('msgByUserId',curr);
                if(msgByUserId !== currentUserId){
                    return  preve + (curr?.seen ? 0 : 1)
                }else{
                    return preve
                }
             
            },0)
            
            return{
                _id : conv?._id,
                sender : conv?.sender,
                receiver : conv?.receiver,
                unseenMsg : countUnseenMsg,
                lastMsg : conv?.messages?.[conv?.messages?.length - 1]
            }
        })

        return conversation
    }else{
        return []
    }
}

module.exports = getConversation