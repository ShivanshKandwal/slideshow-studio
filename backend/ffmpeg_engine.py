import os
import sys
import glob
import json
import time
import shutil
import tempfile
import subprocess
from pathlib import Path
from typing import List, Optional, Dict, Any

class FFmpegSlideshowEngine:
    """
    High-performance video generation pipeline:
    - 3-second pacing for every photo and video clip
    - Standardized aspect ratio (9:16 Shorts or 16:9 Landscape)
    - Blurred background letterboxing to fit different dimensions cleanly
    - Looped background calm audio track with volume ducking
    - Hardware-accelerated (NVENC) or high-efficiency libx264 MP4 export
    """

    @staticmethod
    def get_ffmpeg_binary() -> str:
        # Check bundled bin folder first
        bundled_dir = Path(__file__).resolve().parent / "bin"
        bundled_ffmpeg = bundled_dir / "ffmpeg.exe"
        if bundled_ffmpeg.exists():
            return str(bundled_ffmpeg)
        
        # When frozen with PyInstaller
        if getattr(sys, 'frozen', False):
            base_path = Path(sys._MEIPASS) if hasattr(sys, '_MEIPASS') else Path(sys.executable).parent
            candidate = base_path / "bin" / "ffmpeg.exe"
            if candidate.exists():
                return str(candidate)
        
        return "ffmpeg"

    def __init__(self, aspect_ratio: str = "9:16"):
        self.aspect_ratio = aspect_ratio
        self.ffmpeg_bin = self.get_ffmpeg_binary()
        if aspect_ratio == "9:16":
            self.width, self.height = 1080, 1920
        else:
            self.width, self.height = 1920, 1080

        # On Windows, suppress flashing console windows spawned by subprocess
        self.startupinfo = None
        self.creationflags = 0
        if os.name == 'nt':
            self.startupinfo = subprocess.STARTUPINFO()
            self.startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            self.startupinfo.wShowWindow = 0 # SW_HIDE
            self.creationflags = subprocess.CREATE_NO_WINDOW

    def _run_ffmpeg(self, cmd: List[str]):
        """Runs an FFmpeg command with window creation suppressed on Windows."""
        return subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            startupinfo=self.startupinfo,
            creationflags=self.creationflags
        )

    def get_media_files(self, folder_path: str) -> List[str]:
        valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.mp4', '.mov', '.avi', '.mkv', '.webm'}
        p = Path(folder_path)
        if not p.is_dir():
            return []
        files = [str(f) for f in p.iterdir() if f.suffix.lower() in valid_exts]
        # Sort naturally or by modification time
        files.sort()
        return files

    def create_slideshow_chunk(
        self,
        media_list: List[str],
        output_path: str,
        audio_path: Optional[str] = None,
        duration_per_item: float = 3.0,
        progress_callback=None,
        transition_effect: str = "dynamic_mix"
    ) -> bool:
        """
        Creates a completed MP4 slideshow from a list of media items.
        """
        temp_dir = tempfile.mkdtemp(prefix="slideshow_")
        segment_files = []

        try:
            total = len(media_list)
            for idx, item in enumerate(media_list):
                ext = Path(item).suffix.lower()
                is_video = ext in {'.mp4', '.mov', '.avi', '.mkv', '.webm'}
                seg_out = os.path.join(temp_dir, f"seg_{idx:04d}.mp4")

                if is_video:
                    self._process_video_clip(item, seg_out, duration_per_item)
                else:
                    self._process_image_slide(item, seg_out, duration_per_item, idx, transition_effect)

                if os.path.exists(seg_out) and os.path.getsize(seg_out) > 0:
                    segment_files.append(seg_out)

                if progress_callback:
                    progress_callback(idx + 1, total)

            if not segment_files:
                raise ValueError("No valid media segments could be generated.")

            # Concat list file
            concat_list_path = os.path.join(temp_dir, "concat.txt")
            with open(concat_list_path, "w", encoding="utf-8") as f:
                for seg in segment_files:
                    clean_path = seg.replace("\\", "/")
                    f.write(f"file '{clean_path}'\n")

            # Intermediate silent video
            silent_mp4 = os.path.join(temp_dir, "combined_silent.mp4")
            concat_cmd = [
                self.ffmpeg_bin, "-y", "-f", "concat", "-safe", "0",
                "-i", concat_list_path,
                "-c", "copy",
                silent_mp4
            ]
            self._run_ffmpeg(concat_cmd)

            total_duration = len(segment_files) * duration_per_item

            # Mux with calm background audio if provided and not explicitly set to None
            if audio_path and os.path.exists(audio_path):
                mux_cmd = [
                    self.ffmpeg_bin, "-y",
                    "-i", silent_mp4,
                    "-stream_loop", "-1", "-i", audio_path,
                    "-t", str(total_duration),
                    "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "192k",
                    "-af", f"afade=t=in:st=0:d=1,afade=t=out:st={max(0, total_duration-2.0)}:d=2.0",
                    output_path
                ]
            else:
                # No audio / silent video
                mux_cmd = [self.ffmpeg_bin, "-y", "-i", silent_mp4, "-c", "copy", output_path]

            self._run_ffmpeg(mux_cmd)
            return True

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _process_image_slide(
        self,
        img_path: str,
        out_path: str,
        duration: float,
        slide_index: int = 0,
        transition_effect: str = "dynamic_mix"
    ):
        """
        Creates a 3-second video segment from a static image with smart blurred padding
        and customizable Ken Burns motion effects (zoom in, zoom out, dynamic mix, fade, or static).
        """
        w, h = self.width, self.height
        fps = 30
        frames = int(duration * fps)

        # Determine motion zoom expression
        # zoom_in: slowly zoom from 1.0 to 1.15
        # zoom_out: slowly zoom from 1.15 to 1.0
        # dynamic_mix: alternates zoom_in, zoom_out, and pan across slides
        mode = transition_effect
        if mode == "dynamic_mix":
            choices = ["zoom_in", "zoom_out", "pan_right", "pan_left"]
            mode = choices[slide_index % len(choices)]

        if mode == "zoom_in":
            # Scale up to 1.14x, smoothly centered
            zoom_expr = f"min(zoom+0.0015,1.15)"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"
        elif mode == "zoom_out":
            # Scale down from 1.15x to 1.0
            zoom_expr = f"if(eq(on,1),1.15,max(1.0,zoom-0.0015))"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"
        elif mode == "pan_right":
            # Gentle horizontal drift to right
            zoom_expr = "1.08"
            x_expr = f"(on/{frames})*(iw-iw/zoom)"
            y_expr = "ih/2-(ih/zoom/2)"
        elif mode == "pan_left":
            # Gentle horizontal drift to left
            zoom_expr = "1.08"
            x_expr = f"(1-on/{frames})*(iw-iw/zoom)"
            y_expr = "ih/2-(ih/zoom/2)"
        else: # static or fade
            zoom_expr = "1.0"
            x_expr = "0"
            y_expr = "0"

        # Apply zoompan to foreground image before overlaying on blurred background
        # zoompan creates motion at constant 30fps for the slide duration
        if mode in ["zoom_in", "zoom_out", "pan_right", "pan_left"]:
            filter_str = (
                f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=20:10[bg];"
                f"[0:v]scale={w}:{h}:force_original_aspect_ratio=decrease,"
                f"zoompan=z='{zoom_expr}':x='{x_expr}':y='{y_expr}':d={frames}:s={w}x{h}:fps={fps}[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]"
            )
        else:
            filter_str = (
                f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=20:10[bg];"
                f"[0:v]scale={w}:{h}:force_original_aspect_ratio=decrease[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]"
            )

        cmd = [
            self.ffmpeg_bin, "-y",
            "-loop", "1",
            "-t", str(duration),
            "-i", img_path,
            "-filter_complex", filter_str,
            "-map", "[v]",
            "-c:v", "libx264",
            "-t", str(duration),
            "-pix_fmt", "yuv420p",
            "-r", str(fps),
            out_path
        ]
        self._run_ffmpeg(cmd)

    def _process_video_clip(self, video_path: str, out_path: str, duration: float):
        """
        Trims first 3 seconds of video with smart aspect ratio scaling and 30fps normalization.
        """
        w, h = self.width, self.height
        filter_str = (
            f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=20:10[bg];"
            f"[0:v]scale={w}:{h}:force_original_aspect_ratio=decrease[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]"
        )

        cmd = [
            self.ffmpeg_bin, "-y",
            "-ss", "0",
            "-t", str(duration),
            "-i", video_path,
            "-filter_complex", filter_str,
            "-map", "[v]",
            "-c:v", "libx264",
            "-t", str(duration),
            "-pix_fmt", "yuv420p",
            "-r", "30",
            "-an",
            out_path
        ]
        self._run_ffmpeg(cmd)
