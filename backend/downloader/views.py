import os
import tempfile
import yt_dlp
import re
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import FileResponse

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def fetch_link(request):
    url = request.data.get("url")
    convert_mp3 = request.data.get("convert_mp3", False)

    if not url:
        return Response({"error": "URL is required"}, status=400)

    try:
        # --------------------------
        # Convert YouTube Music → YouTube
        # --------------------------
        if "music.youtube.com" in url.lower():
            url = url.replace("music.youtube.com", "www.youtube.com")

        is_youtube_music = "www.youtube.com" in url.lower() and "music.youtube.com" in request.data.get("url", "")

        tmp_dir = tempfile.mkdtemp()

        # --------------------------
        # yt-dlp options
        # --------------------------
        ydl_opts = {
            "format": "bestaudio/best" if convert_mp3 else "best",
            "outtmpl": os.path.join(tmp_dir, "%(title)s.%(ext)s"),
            "quiet": True,
            "no_warnings": True,
        }

        # Playlists support for YT Music
        ydl_opts["noplaylist"] = False if "playlist" in url.lower() else True

        # --------------------------
        # Cookies support
        # --------------------------
        cookies_file = os.environ.get("YTDLP_COOKIES")
        if cookies_file:
            ydl_opts["cookiefile"] = cookies_file
        else:
            if "youtube.com" in url.lower() or "music.youtube.com" in url.lower():
                # Only warn if a protected URL is likely
                return Response({
                    "error": "Protected YouTube content requires cookies. Upload cookies in Render and set YTDLP_COOKIES."
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

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=convert_mp3)

        # --------------------------
        # MP3 file response
        # --------------------------
        if convert_mp3:
            filename = sanitize_filename(f"{info['title']}.mp3")
            mp3_file = os.path.join(tmp_dir, filename)
            if not os.path.exists(mp3_file):
                return Response({"error": "Failed to convert to MP3"}, status=500)
            return FileResponse(open(mp3_file, "rb"), as_attachment=True, filename=filename)

        # --------------------------
        # Metadata only
        # --------------------------
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
                }
                for f in raw_formats if f.get("acodec") != "none" and f.get("vcodec") == "none"
            ]
            audio_only = sorted(audio_only, key=lambda x: -(x.get("bitrate") or 0))
            return Response({
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "uploader": info.get("uploader"),
                "format_label": "AUTO",
                "formats": audio_only[:3]
            })

        # Normal video + audio
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
