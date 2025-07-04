# Photo Management API Documentation

## Overview

This is a RESTful photo management API that provides functionality for capturing, storing, listing, and deleting photos. The application also integrates with Immich (a self-hosted photo management service) for cloud backup and album organization.

## Architecture

- **Type**: HTTP REST API
- **Default Port**: 3000
- **Protocol**: HTTP
- **Data Format**: JSON, Multipart Form Data, Base64 encoded images

## Configuration

The application requires the following environment variables:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `IMMICH_BASE_URL` | Base URL of your Immich instance | Yes | `https://photos.example.com/api` |
| `IMMICH_API_KEY` | API key for Immich authentication | Yes | `your-immich-api-key` |
| `IMMICH_ALBUM_ID` | Target album ID in Immich for uploads | Yes | `album-uuid-here` |

## File Structure

```
/
├── photos/                 # Local photo storage directory
├── public/                 # Static web files
│   └── index.html         # Main web interface
├── index.js               # Main application file
└── .env                   # Environment configuration
```

## API Endpoints

### 1. Web Interface

**Endpoint**: `GET /`

**Description**: Serves the main web interface for the photo management application.

**Response**: HTML page

**Status Codes**:
- `200`: Success - returns HTML interface

---

### 2. List Photos

**Endpoint**: `GET /photos`

**Description**: Retrieves a list of all stored photos in the local directory.

**Request**: No body required

**Response**:
```json
[
  "photo-1640995200000.png",
  "photo-1640995260000.png",
  "photo-1640995320000.png"
]
```

**Status Codes**:
- `200`: Success - returns array of filenames
- `500`: Server error - failed to read photo directory

---

### 3. Access Photo Files

**Endpoint**: `GET /photos/{filename}`

**Description**: Serves individual photo files as static content.

**Parameters**:
- `filename` (path): The name of the photo file

**Response**: Binary image data

**Status Codes**:
- `200`: Success - returns image file
- `404`: Photo not found

---

### 4. Save Photo

**Endpoint**: `POST /photos`

**Description**: Saves a base64-encoded photo locally and uploads it to Immich cloud storage with album assignment.

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA..."
}
```

**Request Fields**:
- `photo` (string, required): Base64-encoded image data with data URI prefix

**Response**:
```json
{
  "message": "Photo saved: photo-1640995200000.png",
  "path": "./photos/photo-1640995200000.png"
}
```

**Workflow**:
1. Validates base64 photo data
2. Generates timestamped filename
3. Saves file to local `photos/` directory
4. Uploads to Immich cloud storage
5. Adds photo to specified Immich album

**Status Codes**:
- `200`: Success - photo saved and uploaded
- `400`: Bad request - no photo data provided
- `500`: Server error - failed to save or upload photo

---

### 5. Delete Photo

**Endpoint**: `DELETE /photos/{filename}`

**Description**: Deletes a photo from local storage.

**Parameters**:
- `filename` (path): The name of the photo file to delete

**Response**:
```json
{
  "message": "Photo deleted"
}
```

**Status Codes**:
- `200`: Success - photo deleted
- `500`: Server error - failed to delete photo

**Note**: This endpoint only deletes from local storage, not from Immich cloud storage.

---

### 6. Get Album URL

**Endpoint**: `GET /album-url`

**Description**: Retrieves the Immich album URL for QR code generation.

**Request**: No body required

**Response**:
```json
{
  "album_url": "https://photos.example.com/albums/album-uuid-here"
}
```

**Status Codes**:
- `200`: Success - returns album URL
- `503`: Service unavailable - Immich configuration incomplete

**Note**: The album URL is constructed from the `IMMICH_BASE_URL` and `IMMICH_ALBUM_ID` environment variables.

---

## Data Formats

### Photo Naming Convention
Photos are automatically named using the pattern: `photo-{timestamp}.png`
- `timestamp`: Unix timestamp in milliseconds

### Base64 Image Format
Images should be provided as data URIs with the following format:
```
data:image/{type};base64,{base64-encoded-data}
```

Supported image types:
- PNG
- JPEG
- GIF
- WebP

## Immich Integration

The application automatically performs the following Immich operations when saving photos:

### Asset Upload
- **Endpoint**: `POST {IMMICH_BASE_URL}/assets`
- **Method**: Multipart form upload
- **Fields**:
  - `assetData`: Binary image file
  - `deviceAssetId`: Unique identifier (filename + modification time)
  - `deviceId`: Static identifier (`"nodejs"`)
  - `fileCreatedAt`: ISO timestamp
  - `fileModifiedAt`: ISO timestamp
  - `isFavorite`: Boolean (`"false"`)

### Album Assignment
- **Endpoint**: `PUT {IMMICH_BASE_URL}/albums/{IMMICH_ALBUM_ID}/assets`
- **Method**: JSON payload
- **Body**: Array of asset IDs to add to album

## Error Handling

All endpoints return JSON error responses in the following format:
```json
{
  "error": "Error description"
}
```

Common error scenarios:
- Missing or invalid photo data
- File system errors (permissions, disk space)
- Immich API failures (network, authentication)
- Invalid album or asset IDs

## Security Considerations

- **File Size Limits**: Request body limited to 50MB
- **Authentication**: Immich integration requires valid API key
- **File Validation**: Only processes valid base64 image data
- **Path Security**: Filenames are generated server-side to prevent path traversal

## Dependencies

The application requires:
- HTTP server capability
- File system access
- Environment variable support
- HTTP client for external API calls
- Multipart form data handling
- Base64 encoding/decoding

## Usage Examples

### Save a Photo (curl)
```bash
curl -X POST http://localhost:3000/photos \
  -H "Content-Type: application/json" \
  -d '{"photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."}'
```

### List Photos (curl)
```bash
curl http://localhost:3000/photos
```

### Delete Photo (curl)
```bash
curl -X DELETE http://localhost:3000/photos/photo-1640995200000.png
```

### Access Photo (browser)
```
http://localhost:3000/photos/photo-1640995200000.png
``` 