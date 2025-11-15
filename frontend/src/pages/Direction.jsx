import HomeBG from '../assets/HomeBG.png';
import { Link } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { PiMusicNoteSimpleFill } from "react-icons/pi";
import { MdVideoLibrary } from "react-icons/md";

export default function Direction() {
    return (
        <div
            style={{ backgroundImage: `url(${HomeBG})` }}
            className="w-full h-screen bg-cover bg-center"
        >
            <div className="flex flex-col justify-center items-center gap-5 w-full h-full bg-black/50 backdrop-blur-[5px] p-4 sm:p-8">
                <h1 className='text-white text-4xl text-center sm:text-7xl font-bold'>
                    Welcome to FetchMate!
                </h1>
                <p className='text-white text-md text-center sm:text-4xl'>
                    What would you like to download today?
                </p>
                <Link to="/"
                className='flex justify-center items-center gap-2 text-white mb-5'>
                    <IoIosArrowBack />
                    Back to Home
                </Link>
                <div className='flex justify-center items-center w-full h-auto gap-2 sm:gap-5 '>
                    <div className='flex flex-col text-white justify-center items-center gap-2 w-45 h-50 bg-gradient-to-b from-[#341327d2] to-[#4f3127c9] border border-white rounded-xl'>
                        <PiMusicNoteSimpleFill className='text-6xl' />
                        <p className='text-lg'>Music</p>
                    </div>

                    <div className='flex flex-col text-white justify-center items-center gap-2 w-45 h-50 bg-gradient-to-b from-[#341327d2] to-[#4f3127c9] border border-white rounded-xl'>
                        <MdVideoLibrary className='text-6xl' />
                        <p className='text-lg'>Videos</p>
                    </div>
                </div>

                <Link to="/dashboard"
                className='flex justify-center items-center gap-2 text-white mt-5'>
                    Contiune
                    <IoIosArrowForward />
                </Link>
            </div>
        </div>
    );
}
