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
        # ----------------------------------------------------
        # Convert YouTube Music URLs to standard YouTube URLs
        # ----------------------------------------------------
        if "music.youtube.com" in url.lower():
            url = url.replace("music.youtube.com", "www.youtube.com")

        # ----------------------------------------------------
        # Detect if the request is coming from YouTube Music
        # ----------------------------------------------------
        is_youtube_music = "www.youtube.com" in url.lower() and "music.youtube.com" in request.data.get("url", "").lower()

        # ----------------------------------------------------
        # CASE 1: CONVERT TO MP3 AND RETURN DOWNLOAD
        # ----------------------------------------------------
        if convert_mp3:
            tmp_dir = tempfile.mkdtemp()
            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": os.path.join(tmp_dir, "%(title)s.%(ext)s"),
                "quiet": True,
                "no_warnings": True,
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)

            filename = sanitize_filename(f"{info['title']}.mp3")
            mp3_file = os.path.join(tmp_dir, filename)

            if not os.path.exists(mp3_file):
                return Response({"error": "Failed to convert to MP3"}, status=500)

            return FileResponse(open(mp3_file, "rb"), as_attachment=True, filename=filename)

        # ----------------------------------------------------
        # CASE 2: FETCH METADATA ONLY
        # ----------------------------------------------------
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "noplaylist": True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        raw_formats = info.get("formats", []) or []

        # ----------------------------------------------------
        # SPECIAL CASE: YOUTUBE MUSIC → AUTO AUDIO ONLY
        # ----------------------------------------------------
        if is_youtube_music:
            audio_only = []

            for f in raw_formats:
                if f.get("acodec") != "none" and f.get("vcodec") == "none":
                    size = f.get("filesize") or f.get("filesize_approx")
                    bitrate = f.get("abr") or None
                    ext = f.get("ext") or "m4a"

                    if ext in ("mp4", "m4a"):
                        ext = "m4a"

                    audio_only.append({
                        "url": f.get("url"),
                        "ext": ext,
                        "type": "audio",
                        "bitrate": bitrate,
                        "size": size,
                        "resolution": None
                    })

            # sort by highest quality
            audio_only = sorted(audio_only, key=lambda x: -(x.get("bitrate") or 0))

            return Response({
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "uploader": info.get("uploader"),
                "format_label": "AUTO",
                "formats": audio_only[:3]
            })

        # ----------------------------------------------------
        # NORMAL YOUTUBE VIDEO + AUDIO
        # ----------------------------------------------------
        audio_candidates = []
        video_candidates = []

        for f in raw_formats:
            f_url = f.get("url")
            if not f_url:
                continue

            vcodec = f.get("vcodec") or "none"
            acodec = f.get("acodec") or "none"
            ext_raw = (f.get("ext") or "").lower()
            is_audio_only = (vcodec == "none") and (acodec != "none")
            is_progressive_video = (vcodec != "none") and (acodec != "none")

            size = f.get("filesize") or f.get("filesize_approx")
            bitrate = f.get("abr")
            height = f.get("height")

            ext = ext_raw
            if is_audio_only:
                if ext in ("mp4", "m4a"):
                    ext = "m4a"
            else:
                if "mp4" in ext_raw:
                    ext = "mp4"

            entry = {
                "url": f_url,
                "ext": ext,
                "type": "audio" if is_audio_only else "video",
                "resolution": f"{height}p" if height else None,
                "bitrate": int(bitrate) if bitrate else None,
                "size": int(size) if size else None,
            }

            if is_audio_only:
                audio_candidates.append(entry)
            elif is_progressive_video:
                video_candidates.append(entry)

        # -----------------------------
        # Deduplicate & Sort VIDEO
        # -----------------------------
        video_by_res = {}
        for v in video_candidates:
            key = v["resolution"] or "unknown"
            prev = video_by_res.get(key)
            if not prev or (v.get("size") or 0) > (prev.get("size") or 0):
                video_by_res[key] = v

        preferred_res_order = ["2160p", "1440p", "1080p", "720p", "480p", "360p", "240p", "144p"]

        videos_sorted = sorted(
            video_by_res.values(),
            key=lambda x: preferred_res_order.index(x["resolution"])
            if x["resolution"] in preferred_res_order else len(preferred_res_order)
        )

        # -----------------------------
        # Deduplicate & Sort AUDIO
        # -----------------------------
        audio_by_bitrate = {}
        for a in audio_candidates:
            key = a["bitrate"] or 0
            prev = audio_by_bitrate.get(key)
            if not prev or (a.get("size") or 0) > (prev.get("size") or 0):
                audio_by_bitrate[key] = a

        audios_sorted = sorted(audio_by_bitrate.values(), key=lambda x: -(x.get("bitrate") or 0))

        cleaned_formats = audios_sorted[:2] + videos_sorted[:5]

        # -----------------------------
        # SEND NORMAL VIDEO RESPONSE
        # -----------------------------
        return Response({
            "title": info.get("title"),
            "thumbnail": info.get("thumbnail"),
            "uploader": info.get("uploader"),
            "format_label": "MP4",
            "formats": cleaned_formats
        })

    except Exception as e:
        return Response({"error": str(e)}, status=400)
