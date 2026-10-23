import os
import sys
import json
import glob
import asyncio
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

# Local modules
from ffmpeg_engine import FFmpegSlideshowEngine

app = FastAPI(title="Slideshow Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

# Multi-user data storage in %APPDATA%/ChronoStudio
appdata_env = os.environ.get("APPDATA")
if appdata_env:
    APP_DATA_DIR = Path(appdata_env) / "ChronoStudio"
else:
    APP_DATA_DIR = Path.home() / ".chronostudio"

APP_DATA_DIR.mkdir(parents=True, exist_ok=True)

# User credentials live in their user profile directory
TOKEN_FILE = APP_DATA_DIR / "token.json"

# Client secrets can be read from APP_DATA_DIR (custom) or default packaged with backend
CLIENT_SECRETS_FILE = APP_DATA_DIR / "client_secrets.json"
if not CLIENT_SECRETS_FILE.exists():
    CLIENT_SECRETS_FILE = BASE_DIR / "client_secrets.json"

static_audio_dir = BASE_DIR / "static" / "audio"
static_audio_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
]

job_state = {
    "status": "idle", # "idle", "processing", "completed", "error"
    "current_step": "Ready",
    "step_index": 0,
    "progress": 0.0,
    "total_items": 0,
    "processed_items": 0,
    "generated_videos": [],
    "logs": [
        "System backend loaded.",
        "Ready to ingest folder & publish."
    ]
}

active_websockets: List[WebSocket] = []

async def broadcast_state():
    for ws in active_websockets:
        try:
            await ws.send_json(job_state)
        except Exception:
            pass

def log_event(message: str, step: str = "", step_index: int = None, progress: float = None):
    if step:
        job_state["current_step"] = step
    if step_index is not None:
        job_state["step_index"] = step_index
    if progress is not None:
        job_state["progress"] = progress
    job_state["logs"].append(message)
    print(f"[{job_state['current_step']}] {message}")

# Active background pipeline task reference
current_pipeline_task = None
current_output_dir = None

@app.post("/api/reset-state")
async def reset_state():
    """
    Emergency stop:
    1. Cancels any active rendering / uploading pipeline immediately
    2. Kills any running ffmpeg subprocesses
    3. Deletes partial/in-production video files from the output directory
    4. Resets job state to clean idle
    """
    global current_pipeline_task, current_output_dir
    
    # 1. Cancel running python task
    if current_pipeline_task and not current_pipeline_task.done():
        current_pipeline_task.cancel()
        current_pipeline_task = None

    # 2. Kill any running ffmpeg child processes on Windows
    try:
        import subprocess
        subprocess.run("taskkill /f /im ffmpeg.exe", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

    # 3. Clean up in-production video files from output directory
    deleted_count = 0
    if current_output_dir and os.path.exists(current_output_dir):
        try:
            for f in os.listdir(current_output_dir):
                if f.endswith(".mp4") or f.endswith(".part"):
                    file_path = os.path.join(current_output_dir, f)
                    try:
                        os.remove(file_path)
                        deleted_count += 1
                    except Exception:
                        pass
        except Exception:
            pass

    # 4. Reset state object
    job_state["status"] = "idle"
    job_state["current_step"] = "Ready"
    job_state["step_index"] = 0
    job_state["progress"] = 0.0
    job_state["logs"] = [f"Pipeline stopped completely. {deleted_count} in-production video(s) deleted. Ready."]
    await broadcast_state()
    return {"status": "reset", "deleted_files": deleted_count, "job_state": job_state}

@app.get("/api/status")
async def get_status():
    return job_state

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        await websocket.send_json(job_state)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_websockets:
            active_websockets.remove(websocket)

@app.get("/api/youtube/status")
async def get_youtube_status():
    if not TOKEN_FILE.exists():
        return {"connected": False, "channel_title": "Not Connected"}
    
    try:
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, "w") as token:
                token.write(creds.to_json())
        
        youtube = build("youtube", "v3", credentials=creds)
        response = youtube.channels().list(mine=True, part="snippet,statistics").execute()
        
        if response.get("items"):
            item = response["items"][0]
            return {
                "connected": True,
                "channel_title": item["snippet"]["title"],
                "channel_avatar": item["snippet"]["thumbnails"]["default"]["url"],
                "subscriber_count": item["statistics"].get("subscriberCount", "Hidden")
            }
    except Exception as e:
        print(f"OAuth validation error: {e}")
        return {"connected": False, "channel_title": "Session Expired", "error": str(e)}

    return {"connected": False, "channel_title": "Not Connected"}

@app.post("/api/youtube/disconnect")
async def disconnect_youtube():
    """
    Disconnects the current YouTube channel by removing token.json from %APPDATA%.
    Allows the user (or another user on the same machine) to connect a fresh channel.
    """
    global active_flow
    active_flow = None
    if TOKEN_FILE.exists():
        try:
            TOKEN_FILE.unlink()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to remove token: {e}")
    return {"status": "disconnected", "connected": False}

# Global flow storage for OAuth redirect
active_flow = None

@app.get("/api/youtube/auth")
async def start_youtube_auth():
    """
    Directly redirects the user's browser to Google's official OAuth consent page.
    """
    global active_flow
    if not CLIENT_SECRETS_FILE.exists():
        return HTMLResponse(content="""
        <div style="font-family:sans-serif; background:#08080a; color:#fff; padding:40px; border-radius:12px; max-width:600px; margin:50px auto; border:1px solid #dc2626;">
            <h2 style="color:#ef4444;">YouTube Client Secret Required</h2>
            <p>Please place client_secrets.json in backend directory.</p>
        </div>
        """, status_code=400)

    try:
        active_flow = InstalledAppFlow.from_client_secrets_file(
            str(CLIENT_SECRETS_FILE), 
            SCOPES,
            redirect_uri='http://localhost:8000/api/youtube/callback'
        )
        auth_url, _ = active_flow.authorization_url(prompt='consent', access_type='offline')
        return RedirectResponse(auth_url)
    except Exception as e:
        return HTMLResponse(content=f"<div style='color:red;'>Error starting OAuth: {e}</div>", status_code=500)

@app.get("/api/youtube/callback")
async def youtube_oauth_callback(code: str):
    """
    Handles Google's return redirect with the auth code, writes token.json, and confirms.
    """
    global active_flow
    try:
        if not active_flow:
            active_flow = InstalledAppFlow.from_client_secrets_file(
                str(CLIENT_SECRETS_FILE), 
                SCOPES,
                redirect_uri='http://localhost:8000/api/youtube/callback'
            )
        active_flow.fetch_token(code=code)
        creds = active_flow.credentials
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

        return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head><title>YouTube Connected</title></head>
        <body style="font-family:sans-serif; background:#08080a; color:#fff; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
            <div style="background:#14141a; padding:40px 60px; border-radius:16px; border:1px solid rgba(239,68,68,0.3); text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.6);">
                <div style="width:60px; height:60px; background:#10b981; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:28px;">✓</div>
                <h2 style="margin:0 0 10px; color:#f8fafc;">YouTube Connected!</h2>
                <p style="color:#94a3b8; margin-bottom:24px;">Your channel is authorized. You can close this tab and return to ChronoStudio.</p>
                <button onclick="window.close()" style="background:#dc2626; color:#fff; border:none; padding:10px 24px; border-radius:8px; font-weight:bold; cursor:pointer;">Close Tab</button>
            </div>
            <script>setTimeout(() => window.close(), 3000);</script>
        </body>
        </html>
        """)
    except Exception as e:
        return HTMLResponse(content=f"<div style='color:red;'>Failed to complete authorization: {e}</div>", status_code=500)

@app.post("/api/scan-folder")
async def scan_folder(payload: dict):
    folder_path = payload.get("folder_path")
    if not folder_path or not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="Invalid folder directory.")
    
    image_exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
    video_exts = {'.mp4', '.mov', '.avi', '.mkv', '.webm'}
    
    images = []
    videos = []

    # Fast non-blocking directory enumeration
    for f in os.listdir(folder_path):
        full_p = os.path.join(folder_path, f)
        ext = os.path.splitext(f.lower())[1]
        if ext in image_exts:
            images.append(full_p)
        elif ext in video_exts:
            videos.append(full_p)
    
    return {
        "valid": True,
        "folder": folder_path,
        "image_count": len(images),
        "video_count": len(videos),
        "total_media": len(images) + len(videos)
    }

class PipelineRequest(BaseModel):
    input_folder: str
    output_folder: str
    target_minutes: int = 5 # 3 to 10 min, or 0 for unlimited (all media in 1 video)
    aspect_ratio: str = "16:9"
    music_track: Optional[str] = "calm_ambient_1"
    custom_music_path: Optional[str] = None
    title_template: str = "Aesthetic Moments Vol. {index}"
    privacy_status: str = "private"
    auto_upload: bool = True

@app.post("/api/start-pipeline")
async def start_pipeline(req: PipelineRequest):
    global current_pipeline_task, current_output_dir
    
    # Concurrency Lock: Prevent duplicate concurrent pipeline executions
    if current_pipeline_task and not current_pipeline_task.done():
        raise HTTPException(status_code=409, detail="A pipeline is already running. Please wait or click Reset.")
    
    current_output_dir = req.output_folder or str(Path("C:/Software/SlideshowOutput"))
    current_pipeline_task = asyncio.create_task(run_full_pipeline(req))
    return {"status": "started"}

async def run_full_pipeline(req: PipelineRequest):
    job_state["status"] = "processing"
    
    # 1. Media Scan
    log_event("Scanning source directory...", step="Media Scan", step_index=0, progress=10)
    await broadcast_state()
    
    engine = FFmpegSlideshowEngine(aspect_ratio=req.aspect_ratio)
    media_files = engine.get_media_files(req.input_folder)
    
    if not media_files:
        log_event(f"Error: No media found in {req.input_folder}", step="Error", progress=0)
        job_state["status"] = "error"
        await broadcast_state()
        return

    total_media = len(media_files)
    
    # Calculate chunk size based on target minutes (or unlimited = all in 1 video)
    if req.target_minutes == 0:
        chunks = [media_files]
        total_seconds = total_media * 3
        log_event(f"Unlimited mode: Generating 1 single MP4 video of {total_seconds} seconds ({total_media} items * 3s).", step="3s Slicing", step_index=1, progress=25)
    else:
        target_seconds = req.target_minutes * 60
        items_per_video = max(1, round(target_seconds / 3.0))
        chunks = [media_files[i:i + items_per_video] for i in range(0, total_media, items_per_video)]
        log_event(f"Chunking {total_media} items into {len(chunks)} videos (~{req.target_minutes} min each).", step="3s Slicing", step_index=1, progress=25)
    
    out_dir = Path(req.output_folder)
    out_dir.mkdir(parents=True, exist_ok=True)
    await broadcast_state()

    try:
        # Step 2 & 3: Audio & Chunk Encoding
        generated_videos = []
        for idx, chunk in enumerate(chunks):
            video_index = idx + 1
            video_title = req.title_template.replace("{index}", str(video_index))
            out_filename = f"slideshow_part_{video_index:03d}.mp4"
            out_filepath = str(out_dir / out_filename)
            
            chunk_seconds = len(chunk) * 3
            log_event(f"Rendering Video {video_index}/{len(chunks)} ({chunk_seconds}s long, {len(chunk)} slides)...", step="FFmpeg Encode", step_index=4, progress=40 + int((idx / len(chunks)) * 35))
            await broadcast_state()
            
            # Audio selection: custom track, preset, or silent/no audio
            if req.music_track == "no_audio":
                audio_file = None
            elif req.custom_music_path and os.path.exists(req.custom_music_path):
                audio_file = req.custom_music_path
            else:
                preset_filename = f"{req.music_track}.mp3"
                preset_path = BASE_DIR / "static" / "audio" / preset_filename
                audio_file = str(preset_path) if preset_path.exists() else None
            
            loop = asyncio.get_event_loop()
            
            # Sub-progress callback for every slide generated
            def on_slide_progress(current_slide, total_slides):
                slide_pct = int((current_slide / total_slides) * 35)
                base_pct = 40 + int((idx / len(chunks)) * 35)
                job_state["progress"] = min(75, base_pct + slide_pct)
                job_state["current_step"] = f"FFmpeg Encode ({current_slide}/{total_slides} slides)"
                job_state["logs"].append(f"[Video {video_index}] Processed slide {current_slide}/{total_slides}...")
                asyncio.run_coroutine_threadsafe(broadcast_state(), loop)

            await loop.run_in_executor(None, engine.create_slideshow_chunk, chunk, out_filepath, audio_file, 3.0, on_slide_progress)
            
            generated_videos.append({
                "path": out_filepath,
                "title": video_title
            })
    except Exception as e:
        log_event(f"Error during video generation: {str(e)}", step="Error", progress=0)
        job_state["status"] = "error"
        await broadcast_state()
        return
    
    # Step 4: YouTube Upload Queue
    if req.auto_upload and TOKEN_FILE.exists():
        total_vids = len(generated_videos)
        log_event(f"Queueing {total_vids} video(s) for sequential YouTube upload...", step="YouTube Upload", step_index=5, progress=80)
        await broadcast_state()
        
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, "w") as token:
                token.write(creds.to_json())

        youtube = build("youtube", "v3", credentials=creds)
        
        for idx, vid in enumerate(generated_videos):
            # Check for cancellation before each video upload in queue
            if asyncio.current_task() and asyncio.current_task().cancelled():
                return
            queue_num = idx + 1
            log_event(f"[Queue {queue_num}/{total_vids}] Starting upload of '{vid['title']}' ({req.privacy_status})...", step="YouTube Upload", step_index=5, progress=80 + int((idx / total_vids) * 18))
            await broadcast_state()
            
            body = {
                'snippet': {
                    'title': vid['title'],
                    'description': f'Generated automatically by ChronoStudio.\nPart {queue_num} of {total_vids}.\n3-second dynamic visual slideshow.',
                    'tags': ['Slideshow', 'Shorts', 'Aesthetic']
                },
                'status': {
                    'privacyStatus': req.privacy_status
                }
            }
            # 4MB chunks for resilient resumable uploads
            media = MediaFileUpload(vid['path'], mimetype='video/mp4', chunksize=4*1024*1024, resumable=True)
            request = youtube.videos().insert(part=','.join(body.keys()), body=body, media_body=media)
            
            response = None
            while response is None:
                loop = asyncio.get_event_loop()
                status, response = await loop.run_in_executor(None, request.next_chunk)
                if status:
                    pct = int(status.progress() * 100)
                    log_event(f"[Queue {queue_num}/{total_vids}] Uploading '{vid['title']}': {pct}%", step="YouTube Upload")
                    await broadcast_state()

            video_id = response.get('id')
            log_event(f"[Queue {queue_num}/{total_vids}] Upload complete! Live at: https://youtu.be/{video_id}", step="YouTube Upload")
            await broadcast_state()

    log_event("Batch pipeline finished successfully!", step="Completed", step_index=5, progress=100)
    job_state["status"] = "completed"
    await broadcast_state()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
