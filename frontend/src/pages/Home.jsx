import React, { useState } from 'react';
import Signup from '../component/Signup';
import Login from '../component/Login';

import HomeBG from '../assets/HomeBG.png';
import Logo from '../assets/Logo.svg';
import Icon from '../assets/Icon.svg';

export default function Home() {

    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);

    const openLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
    };

    const openSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };


    return(
        <div className="w-full h-screen bg-cover bg-center bg-fixed "
         style={{ backgroundImage: `url(${HomeBG})` }}>
            <div className="flex flex-col items-center gap-4 w-full h-full bg-[#000000b2] p-2 sm:p-8">
                <div className='flex justify-between items-center  w-full h-20 p-2'>
                    <a href="">
                        <img src={Logo} alt="Logo" className='w-30 sm:w-50' />
                    </a>

                    <div className='flex justify-center items-center gap-4 w-auto h-auto'>
                        <Login model={showLogin} setModel={setShowLogin} switchToSignup={openSignup} />
                        <Signup model={showSignup} setModel={setShowSignup} switchToLogin={openLogin} />
                    </div>
                </div>

                <div className='flex flex-col justify-center gap-5 w-full h-full  p-2'>
                    <div className='flex justify-center  items-center gap-4 w-40 sm:w-50 h-14 bg-gradient-to-b from-[#341327d2] to-[#4f3127c9] backdrop:1 border border-[#fff] p-4 rounded-md'>
                        <img src={Icon} alt="Icon" className='w-8 sm:w-10 animate-spin'/>
                        <p className='text-white text-sm sm:text-md font-semibold'>
                            Latest v1.0
                        </p>
                    </div>
                    <h1 className='text-white text-2xl sm:text-6xl font-bold w-auto sm:w-170'>
                        <span className='font-light'>
                            FetchMate
                            </span>
                            <span> </span>
                             – Your Ultimate Link Downloader
                    </h1>
                    <p className='text-white text-md sm:text-xl'>
                        Download music and videos effortlessly from any link, in just a few clicks.
                    </p>
                    
                </div>

            </div>
        </div>
    )
}