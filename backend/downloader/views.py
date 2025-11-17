import os
import tempfile
import yt_dlp
import re
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import FileResponse
from zipfile import ZipFile
import shutil

logger = logging.getLogger(__name__)

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def fetch_link(request):
    url = request.data.get("url")
    convert_mp3 = request.data.get("convert_mp3", False)

    if not url:
        return Response({"error": "URL is required"}, status=400)

    tmp_dir = tempfile.mkdtemp()

    try:
        # Convert YouTube Music → YouTube
        original_url = url
        if "music.youtube.com" in url.lower():
            url = url.replace("music.youtube.com", "www.youtube.com")

        is_youtube_music = "music.youtube.com" in original_url.lower()

        # yt-dlp options
        ydl_opts = {
            "format": "bestaudio/best" if convert_mp3 else "best",
            "outtmpl": os.path.join(tmp_dir, "%(title)s.%(ext)s"),
            "quiet": True,
            "no_warnings": True,
            "noplaylist": False,
        }

        # MP3 conversion
        if convert_mp3:
            ydl_opts["postprocessors"] = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }]

        # Include cookies.txt if exists
        backend_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../"))
        cookies_path = os.path.join(backend_root, "cookies.txt")
        if os.path.exists(cookies_path):
            ydl_opts["cookiefile"] = cookies_path

        # Extract info
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=convert_mp3)

        # Playlist handling
        if "entries" in info:
            if convert_mp3:
                zip_path = os.path.join(tmp_dir, "playlist.zip")
                with ZipFile(zip_path, "w") as zipf:
                    for entry in info["entries"]:
                        filename = sanitize_filename(f"{entry['title']}.mp3")
                        file_path = os.path.join(tmp_dir, filename)
                        if os.path.exists(file_path):
                            zipf.write(file_path, arcname=filename)
                return FileResponse(open(zip_path, "rb"), as_attachment=True, filename="playlist.zip")
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

        # Single video/audio
        if convert_mp3:
            filename = sanitize_filename(f"{info['title']}.mp3")
            mp3_file = os.path.join(tmp_dir, filename)
            if not os.path.exists(mp3_file):
                return Response({"error": "Failed to convert to MP3"}, status=500)
            return FileResponse(open(mp3_file, "rb"), as_attachment=True, filename=filename)

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

    except yt_dlp.utils.DownloadError as e:
        logger.warning("YT-DLP download error: %s", e)
        return Response({"error": "Failed to download the video/audio"}, status=400)
    except Exception as e:
        logger.error("Unexpected error in fetch_link: %s", e)
        return Response({"error": "Failed to process the link"}, status=400)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
