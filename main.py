import os
import base64
import time
import json
from pathlib import Path
from typing import List
import asyncio

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
import aiofiles
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="SnapShot Photo Management API", version="1.0.0")

# Configuration from environment variables
IMMICH_BASE_URL = os.getenv("IMMICH_BASE_URL")
IMMICH_API_KEY = os.getenv("IMMICH_API_KEY")
IMMICH_ALBUM_ID = os.getenv("IMMICH_ALBUM_ID")

# Validate required environment variables
if not all([IMMICH_BASE_URL, IMMICH_API_KEY, IMMICH_ALBUM_ID]):
    print("Warning: Immich configuration incomplete. Cloud sync will be disabled.")
    print("Required: IMMICH_BASE_URL, IMMICH_API_KEY, IMMICH_ALBUM_ID")

# Ensure photos directory exists
PHOTOS_DIR = Path("photos")
PHOTOS_DIR.mkdir(exist_ok=True)

# Mount static files (public directory)
PUBLIC_DIR = Path("public")
if PUBLIC_DIR.exists():
    app.mount("/static", StaticFiles(directory="public"), name="static")

class PhotoData(BaseModel):
    photo: str

@app.get("/", response_class=HTMLResponse)
async def get_web_interface():
    """Serve the main web interface"""
    index_path = PUBLIC_DIR / "index.html"
    if index_path.exists():
        async with aiofiles.open(index_path, 'r', encoding='utf-8') as f:
            content = await f.read()
        return HTMLResponse(content=content)
    else:
        return HTMLResponse(content="""
        <html>
            <head><title>SnapShot</title></head>
            <body>
                <h1>SnapShot Photo Management API</h1>
                <p>Web interface not found. Place your web files in the 'public' directory.</p>
                <p>API Documentation: <a href="/docs">/docs</a></p>
            </body>
        </html>
        """)

# API endpoints - these must come before the catch-all route
@app.get("/photos")
async def list_photos() -> List[str]:
    """List all photos in the photos directory"""
    try:
        photos = []
        if PHOTOS_DIR.exists():
            for file_path in PHOTOS_DIR.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
                    photos.append(file_path.name)
        photos.sort(reverse=True)  # Most recent first
        return photos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read photo directory: {str(e)}")

@app.get("/photos/{filename}")
async def get_photo(filename: str):
    """Serve individual photo files"""
    file_path = PHOTOS_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return FileResponse(
        path=file_path,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"}
    )

@app.post("/photos")
async def save_photo(photo_data: PhotoData):
    """Save a base64-encoded photo and upload to Immich"""
    if not photo_data.photo:
        raise HTTPException(status_code=400, detail="No photo data provided")
    
    try:
        # Parse base64 data
        if not photo_data.photo.startswith('data:image/'):
            raise HTTPException(status_code=400, detail="Invalid image data format")
        
        # Extract base64 data
        header, base64_data = photo_data.photo.split(',', 1)
        image_bytes = base64.b64decode(base64_data)
        
        # Generate timestamped filename
        timestamp = int(time.time() * 1000)
        filename = f"photo-{timestamp}.png"
        file_path = PHOTOS_DIR / filename
        
        # Save file locally
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(image_bytes)
        
        # Upload to Immich if configured
        if all([IMMICH_BASE_URL, IMMICH_API_KEY, IMMICH_ALBUM_ID]):
            try:
                await upload_to_immich(file_path, filename)
            except Exception as e:
                print(f"Warning: Failed to upload to Immich: {str(e)}")
                # Continue anyway - local save was successful
        
        return {
            "message": f"Photo saved: {filename}",
            "path": f"./photos/{filename}"
        }
    
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save photo: {str(e)}")

@app.delete("/photos/{filename}")
async def delete_photo(filename: str):
    """Delete a photo from local storage"""
    file_path = PHOTOS_DIR / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Photo not found")
    
    try:
        file_path.unlink()
        return {"message": "Photo deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete photo: {str(e)}")

@app.get("/album-url")
async def get_album_url():
    """Get the Immich album URL for QR code generation"""
    if not all([IMMICH_BASE_URL, IMMICH_ALBUM_ID]):
        raise HTTPException(status_code=503, detail="Immich album URL not configured")
    
    # Remove /api suffix from base URL if present, then construct album URL
    base_url = str(IMMICH_BASE_URL).rstrip('/api').rstrip('/')
    album_url = f"{base_url}/albums/{IMMICH_ALBUM_ID}"
    
    return {"album_url": album_url}

# Static file routes for direct access (frontend expects these at root level)
@app.get("/styles.css")
async def get_styles():
    """Serve the CSS file"""
    return FileResponse(PUBLIC_DIR / "styles.css", media_type="text/css")

@app.get("/script.js")
async def get_script():
    """Serve the JavaScript file"""
    return FileResponse(PUBLIC_DIR / "script.js", media_type="text/javascript")

# Catch-all route for static files - MUST come last
@app.get("/{filename}")
async def get_static_file(filename: str):
    """Serve static files from public directory"""
    # List of allowed static file extensions
    allowed_extensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.gif']
    
    file_path = PUBLIC_DIR / filename
    if file_path.exists() and file_path.suffix.lower() in allowed_extensions:
        # Determine media type based on file extension
        media_type = "image/png"
        if filename.endswith('.svg'):
            media_type = "image/svg+xml"
        elif filename.endswith('.jpg') or filename.endswith('.jpeg'):
            media_type = "image/jpeg"
        elif filename.endswith('.webp'):
            media_type = "image/webp"
        elif filename.endswith('.gif'):
            media_type = "image/gif"
        elif filename.endswith('.ico'):
            media_type = "image/x-icon"
        
        return FileResponse(file_path, media_type=media_type)
    else:
        raise HTTPException(status_code=404, detail="File not found")

async def upload_to_immich(file_path: Path, filename: str):
    """Upload photo to Immich and add to album"""
    if not IMMICH_API_KEY:
        raise ValueError("IMMICH_API_KEY not configured")
    
    headers = {
        "x-api-key": IMMICH_API_KEY
    }
    
    # Get file stats for metadata
    stat = file_path.stat()
    created_at = time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime(stat.st_ctime))
    modified_at = time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime(stat.st_mtime))
    
    async with httpx.AsyncClient() as client:
        # Upload asset
        with open(file_path, 'rb') as f:
            files = {
                'assetData': (filename, f, 'image/png')
            }
            data = {
                'deviceAssetId': f"{filename}-{int(stat.st_mtime)}",
                'deviceId': 'python-snapshot',
                'fileCreatedAt': created_at,
                'fileModifiedAt': modified_at,
                'isFavorite': 'false'
            }
            
            response = await client.post(
                f"{IMMICH_BASE_URL}/assets",
                headers=headers,
                files=files,
                data=data,
                timeout=30.0
            )
            response.raise_for_status()
            
            asset_data = response.json()
            asset_id = asset_data.get('id')
            
            if asset_id:
                # Add to album
                album_response = await client.put(
                    f"{IMMICH_BASE_URL}/albums/{IMMICH_ALBUM_ID}/assets",
                    headers={**headers, "Content-Type": "application/json"},
                    json={"ids": [asset_id]},
                    timeout=10.0
                )
                album_response.raise_for_status()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to return JSON error responses"""
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000) 