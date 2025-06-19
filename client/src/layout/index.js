import React from 'react'
import { IoChatbubbleEllipses } from "react-icons/io5";

const AuthLayouts = ({children}) => {
  return (
    <>
        <header className='flex justify-center items-center py-3 h-20 shadow-md bg-white'>
        <IoChatbubbleEllipses
                            size={50}
                        />
        </header>

        { children }
    </>
  )
}

export default AuthLayouts