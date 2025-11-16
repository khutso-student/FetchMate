import os
import tempfile
import yt_dlp
import re
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import FileResponse
from zipfile import ZipFile
import shutil

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def fetch_link(request):
    url = request.data.get("url")
    convert_mp3 = request.data.get("convert_mp3", False)

    if not url:
        return Response({"error": "URL is required"}, status=400)

    tmp_dir = tempfile.mkdtemp()  # temporary folder for all downloads

    try:
        # --------------------------
        # Convert YouTube Music → YouTube
        # --------------------------
        if "music.youtube.com" in url.lower():
            url = url.replace("music.youtube.com", "www.youtube.com")

        is_youtube_music = "www.youtube.com" in url.lower() and "music.youtube.com" in request.data.get("url", "")

        # --------------------------
        # yt-dlp options
        # --------------------------
        ydl_opts = {
            "format": "bestaudio/best" if convert_mp3 else "best",
            "outtmpl": os.path.join(tmp_dir, "%(title)s.%(ext)s"),
            "quiet": True,
            "no_warnings": True,
        }

        ydl_opts["noplaylist"] = False  # allow playlists

        # --------------------------
        # Cookies support
        # --------------------------
        cookies_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cookies.txt")
        if os.path.exists(cookies_path):
            ydl_opts["cookiefile"] = cookies_path
        else:
            if "youtube.com" in url.lower() or "music.youtube.com" in url.lower():
                return Response({
                    "error": "Protected YouTube content requires cookies. Place cookies.txt in backend root."
                }, status=400)

        # --------------------------
        # MP3 conversion
        # --------------------------
        if convert_mp3:
            ydl_opts["postprocessors"] = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }]

        # --------------------------
        # Extract info
        # --------------------------
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=convert_mp3)

        # --------------------------
        # Playlist MP3 handling
        # --------------------------
        if "entries" in info:  # playlist
            if convert_mp3:
                zip_path = os.path.join(tmp_dir, "playlist.zip")
                with ZipFile(zip_path, "w") as zipf:
                    for entry in info["entries"]:
                        filename = sanitize_filename(f"{entry['title']}.mp3")
                        file_path = os.path.join(tmp_dir, filename)
                        if os.path.exists(file_path):
                            zipf.write(file_path, arcname=filename)
                response = FileResponse(open(zip_path, "rb"), as_attachment=True, filename="playlist.zip")
                return response
            else:
                tracks = []
                for entry in info["entries"]:
                    tracks.append({
                        "title": entry.get("title"),
                        "uploader": entry.get("uploader"),
                        "thumbnail": entry.get("thumbnail"),
                        "formats": entry.get("formats", [])
                    })
                return Response({
                    "playlist_title": info.get("title"),
                    "uploader": info.get("uploader"),
                    "tracks": tracks
                })

        # --------------------------
        # Single video/audio
        # --------------------------
        if convert_mp3:
            filename = sanitize_filename(f"{info['title']}.mp3")
            mp3_file = os.path.join(tmp_dir, filename)
            if not os.path.exists(mp3_file):
                return Response({"error": "Failed to convert to MP3"}, status=500)
            response = FileResponse(open(mp3_file, "rb"), as_attachment=True, filename=filename)
            return response

        raw_formats = info.get("formats", []) or []

        if is_youtube_music:
            audio_only = [
                {
                    "url": f.get("url"),
                    "ext": "m4a",
                    "type": "audio",
                    "bitrate": f.get("abr"),
                    "size": f.get("filesize") or f.get("filesize_approx"),
                    "resolution": None,
                } for f in raw_formats if f.get("acodec") != "none" and f.get("vcodec") == "none"
            ]
            audio_only = sorted(audio_only, key=lambda x: -(x.get("bitrate") or 0))
            return Response({
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "uploader": info.get("uploader"),
                "format_label": "AUTO",
                "formats": audio_only[:3]
            })

        audio_candidates = [
            {
                "url": f.get("url"),
                "ext": f.get("ext"),
                "type": "audio",
                "bitrate": f.get("abr"),
                "size": f.get("filesize") or f.get("filesize_approx"),
                "resolution": None,
            } for f in raw_formats if f.get("vcodec") == "none" and f.get("acodec") != "none"
        ]

        video_candidates = [
            {
                "url": f.get("url"),
                "ext": f.get("ext"),
                "type": "video",
                "resolution": f"{f.get('height')}p" if f.get("height") else None,
                "size": f.get("filesize") or f.get("filesize_approx"),
                "bitrate": f.get("abr"),
            } for f in raw_formats if f.get("vcodec") != "none" and f.get("acodec") != "none"
        ]

        return Response({
            "title": info.get("title"),
            "thumbnail": info.get("thumbnail"),
            "uploader": info.get("uploader"),
            "formats": audio_candidates[:2] + video_candidates[:5]
        })

    except Exception as e:
        return Response({"error": str(e)}, status=400)

    finally:
        # --------------------------
        # Cleanup temporary folder
        # --------------------------
        shutil.rmtree(tmp_dir, ignore_errors=True)
