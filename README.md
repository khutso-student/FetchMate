# 🚀 FetchMate — Smart Media Downloader for Music & Videos
### *Paste. Fetch. Download — Instantly.*

FetchMate is a modern, high-performance media downloader that allows users to paste any supported URL and download **music or videos** with ease. It supports platforms like **YouTube, YouTube Music, TikTok, Instagram**, and more.

Built using a clean & scalable **React + Django REST** architecture, FetchMate showcases real-world full-stack engineering, API integration, authentication, and production deployment.

---

## 🎯 Features

### 🔐 User Authentication
- Secure **Signup/Login**
- JWT-based auth (access & refresh tokens)
- Role-based access ready

### 🧠 Smart Link Fetching
- Auto-detects website/platform from pasted URL
- Fetches metadata: title, thumbnail, uploader, formats
- Compatible with:
  - YouTube
  - YouTube Music
  - TikTok
  - Instagram
  - Public Facebook links
  - More platforms supported via `yt-dlp`

### 🎵 Audio Download
- Convert YouTube videos to **MP3**
- Extract high-quality audio
- For playlists → auto ZIP packaging

### 🎥 Video Download
- Download videos in available resolutions (360p → 4K)
- Clean file streaming directly from backend

### 🎨 Beautiful UI (React + Tailwind)
- Modern, responsive design
- Smooth animations with Framer Motion
- Simple navigation: **Music** | **Videos**

### ⚙️ Backend (Django REST)
- Production-ready API logic
- Secure error-handling for unsupported or restricted content
- Cookie-based YouTube authentication supported

---

## 🛠️ Tech Stack

### **Frontend**
- React (Vite)
- Tailwind CSS
- Axios
- React Router
- Framer Motion

### **Backend**
- Django REST Framework
- yt-dlp (media extraction)
- Python 3.11+
- JWT Authentication

### **Deployment**
- **Frontend:** Vercel  
- **Backend:** Render  

---

## 🔗 Live Demo

Frontend: _https://fetch-mate-dusky.vercel.app/_ 

