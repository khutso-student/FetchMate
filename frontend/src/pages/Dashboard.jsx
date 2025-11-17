import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

import HomeBG from "../assets/HomeBG.png";
import Logo from "../assets/Logo.svg";
import Icon from "../assets/Icon.svg";

import { IoIosArrowBack } from "react-icons/io";
import { FaRegUserCircle } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";

import api from "../services/api"; // import your Axios instance

export default function Dashboard() {
  const [model, setModel] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [errorMessage, setErrorMessage] = useState(""); // NEW: inline error

  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/direction");
  };

const fetchLink = async (convertMp3 = false) => {
  if (!url.trim()) return;

  setLoading(true);
  setMeta(null);
  setSelectedFormat(null);
  setErrorMessage("");

  try {
    const res = await api.post(
      "/downloader/fetch/",
      { url, convert_mp3: convertMp3 },
      { responseType: "blob" } // ✅ important for file downloads
    );

    // Check if response is a file (Blob)
    const contentType = res.headers["content-type"];
    if (contentType && (contentType.includes("audio") || contentType.includes("application/zip"))) {
      const filename = convertMp3 ? "audio.mp3" : "playlist.zip";
      const blob = new Blob([res.data], { type: contentType });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      // If JSON metadata returned
      const text = await res.data.text?.(); // sometimes blob has text content
      const data = text ? JSON.parse(text) : res.data;
      if (data?.formats) {
        setMeta(data);
        if (data.formats.length > 0) setSelectedFormat(data.formats[0]);
      } else {
        throw new Error("Unexpected response from server");
      }
    }
  } catch (err) {
    console.error(err);

    let serverMessage = "";
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        serverMessage = text;
      } catch {}
    } else {
      serverMessage = err.response?.data?.error;
    }

    if (serverMessage?.includes("cookies") || serverMessage?.includes("login")) {
      setErrorMessage(
        "⚠️ This content requires login. Please ensure a valid cookies.txt is in the backend root."
      );
    } else {
      setErrorMessage(serverMessage || err.message || "Network error.");
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div
      style={{ backgroundImage: `url(${HomeBG})` }}
      className="w-full min-h-screen bg-cover bg-center"
    >
      <div className="flex flex-col items-center gap-5 w-full min-h-screen bg-black/50 backdrop-blur-[5px] p-2 sm:p-8">

        {/* NAVBAR */}
        <div className="relative flex justify-between items-center w-full h-15 bg-[#ffffff25] p-3 rounded-xl">
          <Link to="/"><img src={Logo} alt="Logo" className="w-30 sm:w-40" /></Link>

          <div className="flex items-center gap-4">
            <Link to="/direction" className="flex items-center gap-1 text-white">
              <IoIosArrowBack /> Back
            </Link>

            <button
              onClick={() => setModel(!model)}
              className="flex justify-center items-center text-white bg-gradient-to-b 
              from-[#341327d2] to-[#4f3127c9] border border-white w-11 h-11 rounded-full hover:opacity-80"
            >
              <FaRegUserCircle className="text-xl" />
            </button>

            <AnimatePresence>
              {model && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="absolute right-0 top-16 w-full sm:w-64 bg-gradient-to-b 
                  from-[#341327] to-[#4f3127f3] border border-white rounded-2xl shadow-2xl py-6 px-4 text-white z-50"
                >
                  <div className="flex flex-col items-center gap-2 border-b border-white pb-3">
                    <FaRegUserCircle className="text-4xl" />
                    <p className="text-base font-semibold">{user?.username}</p>
                    <p className="text-sm text-gray-300">{user?.email}</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full mt-4 py-2 
                    bg-gradient-to-b from-[#341327d2] to-[#4f3127c9] 
                    border border-white hover:text-[#ffd5e6] rounded-lg"
                  >
                    <FiLogOut /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* INPUT */}
        <div className="flex flex-col sm:flex-row w-full sm:w-140 h-auto bg-[#341327] border border-white rounded-md p-1 gap-1">
          <input
            type="text"
            placeholder="Paste link here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-3 bg-white rounded-md"
          />
          <button
            onClick={() => fetchLink(false)}
            className="text-white text-sm bg-gradient-to-b from-[#341327] w-full sm:w-30 h-12
            to-[#4f3127e8] border border-white px-5 rounded-md"
          >
            {loading ? "Loading..." : "Fetch"}
          </button>

          {meta?.format_label === "AUTO" && (
            <button
              onClick={() => fetchLink(true)}
              className="text-white text-sm bg-green-600 border border-white  rounded-md  w-full sm:w-30 h-12"
            >
              Download MP3
            </button>
          )}
        </div>

        {/* INLINE ERROR MESSAGE */}
        {errorMessage && (
          <p className="text-red-400 text-sm mt-1">{errorMessage}</p>
        )}

        {/* BRAND UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full sm:w-140 mt-6 p-5 bg-gradient-to-br 
          from-[#341327e6] to-[#4f3127e3] border border-white rounded-2xl 
          shadow-xl text-white backdrop-blur-md"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <img src={Icon} alt="icon" className="w-16 drop-shadow-xl" />
            <h2 className="text-2xl font-bold tracking-wide drop-shadow-md">
              <span className="text-pink-300">FetchMate</span> Downloader
            </h2>
            <p className="text-sm opacity-90 leading-relaxed">
              Your all-in-one media downloader. Paste any song, video or YouTube Music link —
              FetchMate will instantly analyze and give you the fastest download options.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 w-full">
              <div className="p-3 bg-white/10 border border-white rounded-xl flex flex-col items-center">
                <span className="text-lg font-bold text-pink-200">Music</span>
                <p className="text-xs opacity-80">Auto-detect MP3 & M4A</p>
              </div>
              <div className="p-3 bg-white/10 border border-white rounded-xl flex flex-col items-center">
                <span className="text-lg font-bold text-pink-200">Video</span>
                <p className="text-xs opacity-80">Smart HD & FHD Options</p>
              </div>
              <div className="p-3 bg-white/10 border border-white rounded-xl flex flex-col items-center">
                <span className="text-lg font-bold text-pink-200">Fast</span>
                <p className="text-xs opacity-80">Fastest Fetching Engine</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SHOW META */}
        {meta && !loading && (
          <motion.div className="w-full sm:w-140 mt-5 p-4 bg-[#ffffff10] border border-white rounded-xl text-white">
            <h3 className="font-bold text-lg">{meta.title}</h3>
            {meta.thumbnail && (
              <img
                src={meta.thumbnail}
                alt="thumbnail"
                className="rounded-md w-full my-3"
                referrerPolicy="no-referrer"
              />
            )}
            <p className="text-sm opacity-80">Uploader: {meta.uploader}</p>
            <p className="mt-2 text-lg font-bold">Format: {meta.format_label}</p>

            <div className="mt-3">
              <p className="mb-1 font-semibold">Select Format:</p>
              <div className="flex flex-wrap gap-2">
                {meta.formats.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFormat(f)}
                    className={`px-3 py-1 rounded-md border ${
                      selectedFormat?.url === f.url
                        ? "bg-green-600 border-green-400"
                        : "bg-[#341327d2] border-white"
                    }`}
                  >
                    {meta.format_label === "AUTO"
                      ? "AUTO • Audio"
                      : `${f.ext.toUpperCase()} • ${f.resolution || "Video"}`}
                  </button>
                ))}
              </div>
            </div>

          {selectedFormat && (
            <button
              onClick={async () => {
                if (!selectedFormat.url) return;

                try {
                  setLoading(true);
                  const res = await api.get(selectedFormat.url, { responseType: "blob" });
                  const blob = new Blob([res.data], { type: res.headers["content-type"] });
                  const a = document.createElement("a");

                  // Generate filename
                  let filename = selectedFormat.ext ? `${meta.title}.${selectedFormat.ext}` : "download";
                  filename = filename.replace(/[\\/*?:"<>|]/g, ""); // sanitize

                  a.href = URL.createObjectURL(blob);
                  a.download = filename;
                  a.click();
                  URL.revokeObjectURL(a.href);
                } catch (err) {
                  console.error(err);
                  setErrorMessage("Failed to download file.");
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-3 inline-block px-4 py-2 bg-gradient-to-b 
              from-[#341327d2] to-[#4f3127c9] border border-white rounded-md"
            >
              Download
            </button>
          )}

          </motion.div>
        )}

        {/* FOOTER BRAND CARD */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full sm:w-140 mt-5 mb-10 p-5 bg-black/40 
          border border-white rounded-2xl shadow-inner text-center text-white"
        >
          <h3 className="text-xl font-bold">Why FetchMate?</h3>
          <p className="text-sm opacity-90 mt-2">
            FetchMate is designed for creators, music lovers, students,
            and anyone who wants fast, clean, and high-quality downloads.
          </p>

          <div className="flex justify-center mt-4 gap-3">
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white text-xs">
              No Ads
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white text-xs">
              Secure Downloads
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white text-xs">
              One-Click Fetch
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
