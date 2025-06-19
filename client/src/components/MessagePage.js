import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import Avatar from './Avatar'
import { HiDotsVertical } from "react-icons/hi";
import { FaAngleLeft } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { FaImage } from "react-icons/fa6";
import { FaVideo } from "react-icons/fa6";
import uploadFile from '../helpers/uploadFile';
import { IoClose } from "react-icons/io5";
import Loading from './Loading';
import backgroundImage from '../assets/wallpaper.jpeg'
import { IoMdSend } from "react-icons/io";
import moment from 'moment'
import { generateAESKey, encryptWithAESKey, exportAESKey, encryptAESKeyWithRSA } from '../helpers/hybridCrypto';
import JSEncrypt from 'jsencrypt';

// Helper to import AES key from base64
async function importAESKeyFromBase64(base64) {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

// Helper to decrypt with AES key
async function decryptWithAESKey(aesKey, ciphertextBase64, ivBase64) {
  const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

const MessagePage = () => {
  const params = useParams()
  const socketConnection = useSelector(state => state?.user?.socketConnection)
  const user = useSelector(state => state?.user)
  const [dataUser,setDataUser] = useState({
    name : "",
    email : "",
    profile_pic : "",
    online : false,
    _id : ""
  })
  const [openImageVideoUpload,setOpenImageVideoUpload] = useState(false)
  const [message,setMessage] = useState({
    text : "",
    imageUrl : "",
    videoUrl : ""
  })
  const [loading,setLoading] = useState(false)
  const [allMessage,setAllMessage] = useState([])
  const [pendingMessages, setPendingMessages] = useState([]); // New state for pending messages
  const currentMessage = useRef(null)

  useEffect(()=>{
      if(currentMessage.current){
          currentMessage.current.scrollIntoView({behavior : 'smooth', block : 'end'})
      }
  },[allMessage])

  const handleUploadImageVideoOpen = ()=>{
    setOpenImageVideoUpload(prev =>!prev)
  }

  const handleUploadImage = async(e)=>{
    const file = e.target.files[0]

    setLoading(true)
    const uploadPhoto = await uploadFile(file)
    setLoading(false)
    setOpenImageVideoUpload(false)

    setMessage(prev => {
      return{
        ...prev,
        imageUrl : uploadPhoto.url
      }
    })
  }
  const handleClearUploadImage = ()=>{
    setMessage(prev => {
      return{
        ...prev,
        imageUrl : ""
      }
    })
  }

  const handleUploadVideo = async(e)=>{
    const file = e.target.files[0]

    setLoading(true)
    const uploadPhoto = await uploadFile(file)
    setLoading(false)
    setOpenImageVideoUpload(false)

    setMessage(prev => {
      return{
        ...prev,
        videoUrl : uploadPhoto.url
      }
    })
  }
  const handleClearUploadVideo = ()=>{
    setMessage(prev => {
      return{
        ...prev,
        videoUrl : ""
      }
    })
  }

  useEffect(() => {
    if (socketConnection) {
      socketConnection.emit('message-page', params.userId);
      socketConnection.emit('seen', params.userId);
      socketConnection.on('message-user', (data) => {
        setDataUser(data);
      });
      socketConnection.on('message', async (data) => {
        const privateKey = localStorage.getItem('privateKey');
        const userId = user._id;
        const decryptRSA = new JSEncrypt();
        decryptRSA.setPrivateKey(privateKey);
        // Decrypt each message
        const decryptedMessages = await Promise.all(data.map(async (msg) => {
          let decryptedText = msg.text;
          // Hybrid encryption logic
          if (msg.encryptedMessage && msg.encryptedKeys && msg.iv) {
            const encryptedAESKey = msg.encryptedKeys[userId];
            if (encryptedAESKey) {
              // Decrypt AES key with user's private key
              const aesKeyBase64 = decryptRSA.decrypt(encryptedAESKey);
              if (aesKeyBase64) {
                try {
                  const aesKey = await importAESKeyFromBase64(aesKeyBase64);
                  decryptedText = await decryptWithAESKey(aesKey, msg.encryptedMessage, msg.iv);
                } catch (err) {
                  decryptedText = '[Decryption failed]';
                }
              } else {
                decryptedText = '[Key decryption failed]';
              }
            } else {
              decryptedText = '[No key for user]';
            }
          } else if (msg.text && privateKey) {
            // fallback for legacy messages
            const temp = decryptRSA.decrypt(msg.text);
            if (temp) decryptedText = temp;
          }
          return { ...msg, text: decryptedText };
        }));
        setAllMessage(decryptedMessages);
      });
    }
    // eslint-disable-next-line
  }, [socketConnection, params?.userId, user])

  const handleOnChange = (e)=>{
    const { name, value} = e.target

    setMessage(prev => {
      return{
        ...prev,
        text: value
      }
    })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (message.text || message.imageUrl || message.videoUrl) {
      if (socketConnection) {
        // 1. Generate AES key
        const aesKey = await generateAESKey();
        // 2. Encrypt message with AES key
        const { ciphertext, iv } = await encryptWithAESKey(aesKey, message.text);
        // 3. Export AES key as base64
        const aesKeyBase64 = await exportAESKey(aesKey);
        // 4. Encrypt AES key with sender's and receiver's public keys
        const senderPublicKey = localStorage.getItem('publicKey');
        const receiverPublicKey = dataUser.publicKey;
        const encryptedKeySender = encryptAESKeyWithRSA(senderPublicKey, aesKeyBase64);
        const encryptedKeyReceiver = encryptAESKeyWithRSA(receiverPublicKey, aesKeyBase64);
        // 5. Prepare encryptedKeys map
        const encryptedKeys = {
          [user._id]: encryptedKeySender,
          [dataUser._id]: encryptedKeyReceiver
        };
        // 6. Emit encrypted message and keys to server
        socketConnection.emit('new message', {
          sender: user?._id,
          receiver: params.userId,
          encryptedMessage: ciphertext,
          iv: iv,
          encryptedKeys: encryptedKeys,
          imageUrl: message.imageUrl,
          videoUrl: message.videoUrl,
          msgByUserId: user?._id.toString()
        });
        setMessage({
          text: "",
          imageUrl: "",
          videoUrl: ""
        });
      }
    }
  }


  return (
    <div style={{ backgroundImage : `url(${backgroundImage})`}} className='bg-no-repeat bg-cover'>
          <header className='sticky top-0 h-16 bg-white flex justify-between items-center px-4'>
              <div className='flex items-center gap-4'>
                  <Link to={"/"} className='lg:hidden'>
                      <FaAngleLeft size={25}/>
                  </Link>
                  <div>
                      <Avatar
                        width={50}
                        height={50}
                        imageUrl={dataUser?.profile_pic}
                        name={dataUser?.name}
                        userId={dataUser?._id}
                      />
                  </div>
                  <div>
                     <h3 className='font-semibold text-lg my-0 text-ellipsis line-clamp-1'>{dataUser?.name}</h3>
                     <p className='-my-2 text-sm'>
                      {
                        dataUser.online ? <span className='text-primary'>Online</span> : <span className='text-slate-400'>offline</span>
                      }
                     </p>
                  </div>
              </div>

              <div >
                    <button className='cursor-pointer hover:text-primary'>
                      <HiDotsVertical/>
                    </button>
              </div>
          </header>

          {/***show all message */}
          <section className='h-[calc(100vh-128px)] overflow-x-hidden overflow-y-scroll scrollbar relative bg-slate-200 bg-opacity-50'>
                  
                
                  
                  
                  <div className='flex flex-col gap-2 py-2 mx-2' ref={currentMessage}>
                    {
                      allMessage.map((msg,index)=>{
                        return(
                          <div className={` p-1 py-1 rounded w-fit max-w-[280px] md:max-w-sm lg:max-w-md ${user._id === msg?.msgByUserId ? "ml-auto bg-teal-100" : "bg-white"}`}>
                            <div className='w-full relative'>
                              {
                                msg?.imageUrl && (
                                  <img 
                                    src={msg.imageUrl}
                                    className='w-full h-full object-scale-down'
                                  />
                                )
                              }
                              {
                                msg?.videoUrl && (
                                  <video
                                    src={msg.videoUrl}
                                    className='w-full h-full object-scale-down'
                                    controls
                                  />
                                )
                              }
                            </div>
                            <p className='px-2'>{msg.text}</p>
                            <p className='text-xs ml-auto w-fit'>{moment(msg.createdAt).format('hh:mm')}</p>
                          </div>
                        )
                      })
                    }
                  </div>


                  {/**Image display */}
                  {
                    message.imageUrl && (
                      <div className='w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden'>
                        <div className='w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600' onClick={handleClearUploadImage}>
                            <IoClose size={30}/>
                        </div>
                        <div className='bg-white p-3'>
                            <img
                              src={message.imageUrl}
                              alt='uploadImage'
                              className='aspect-square w-full h-full max-w-sm m-2 object-scale-down'
                            />
                        </div>
                      </div>
                    )
                  }

                  {/**video display */}
                  {
                    message.videoUrl && (
                      <div className='w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden'>
                        <div className='w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600' onClick={handleClearUploadVideo}>
                            <IoClose size={30}/>
                        </div>
                        <div className='bg-white p-3'>
                            <video 
                              src={message.videoUrl} 
                              className='aspect-square w-full h-full max-w-sm m-2 object-scale-down'
                              controls
                              muted
                              autoPlay
                            />
                        </div>
                      </div>
                    )
                  }

                  {
                    loading && (
                      <div className='w-full h-full flex sticky bottom-0 justify-center items-center'>
                        <Loading/>
                      </div>
                    )
                  }
          </section>
          {/**send message */}
          <section className='h-16 bg-white flex items-center px-4'>
              <div className='relative '>
                  <button onClick={handleUploadImageVideoOpen} className='flex justify-center items-center w-11 h-11 rounded-full hover:bg-black hover:text-white'>
                    <FaPlus size={20}/>
                  </button>

                  {/**video and image */}
                  {
                    openImageVideoUpload && (
                      <div className='bg-white shadow rounded absolute bottom-14 w-36 p-2'>
                      <form>
                          <label htmlFor='uploadImage' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'>
                              <div className='text-primary'>
                                  <FaImage size={18}/>
                              </div>
                              <p>Image</p>
                          </label>
                          <label htmlFor='uploadVideo' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'>
                              <div className='text-purple-500'>
                                  <FaVideo size={18}/>
                              </div>
                              <p>Video</p>
                          </label>

                          <input 
                            type='file'
                            id='uploadImage'
                            onChange={handleUploadImage}
                            className='hidden'
                          />

                          <input 
                            type='file'
                            id='uploadVideo'
                            onChange={handleUploadVideo}
                            className='hidden'
                          />
                      </form>
                      </div>
                    )
                  }
                  
              </div>

              {/**input box */}
              <form className='h-full w-full flex gap-2' onSubmit={handleSendMessage}>
                  <input
                    type='text'
                    placeholder='Type here..'
                    id='name'
                    className='py-1 px-4 outline-none w-full h-full'
                    value={message.text}
                    onChange={handleOnChange}
                  />
                  <button className='text-primary hover:text-secondary'>
                      <IoMdSend size={28}/>
                  </button>
              </form>
              
          </section>
    </div>
  )
}
export default MessagePage