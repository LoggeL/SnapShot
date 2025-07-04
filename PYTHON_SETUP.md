# Python FastAPI Setup Guide

## Quick Start

### 1. Install Dependencies

Using uv (recommended):
```bash
uv pip install -e .
```

Or using pip:
```bash
pip install -e .
```

### 2. Environment Configuration

Create a `.env` file in the project root with your Immich configuration:

```env
IMMICH_BASE_URL=https://your-immich-instance.com/api
IMMICH_API_KEY=your-immich-api-key-here
IMMICH_ALBUM_ID=your-album-uuid-here
```

**Note**: The application will run without Immich configuration, but cloud sync will be disabled.

### 3. Run the Server

Using the run script:
```bash
uv run run.py
```

Or directly:
```bash
uv run uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```

### 4. Access the Application

- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs
- **Photos API**: http://localhost:3000/photos

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Web interface |
| GET | `/photos` | List all photos |
| GET | `/photos/{filename}` | Get specific photo |
| POST | `/photos` | Save new photo |
| DELETE | `/photos/{filename}` | Delete photo |

## Features

### ✅ Implemented
- **FastAPI Framework**: Modern, fast, with automatic API docs
- **Async Support**: Non-blocking I/O for better performance
- **Photo Management**: Save, list, serve, and delete photos
- **Immich Integration**: Automatic upload and album assignment
- **Error Handling**: Comprehensive error responses
- **Static File Serving**: Serves the web interface from `public/` directory
- **Environment Configuration**: Secure credential management
- **Automatic Directory Creation**: Creates `photos/` directory if needed

### 🔧 Technical Details
- **Framework**: FastAPI with Uvicorn ASGI server
- **HTTP Client**: httpx for async Immich API calls
- **File Operations**: aiofiles for async file I/O
- **Image Processing**: Base64 encoding/decoding
- **Configuration**: python-dotenv for environment variables

## Development

### Installing Development Dependencies
```bash
uv pip install -e ".[dev]"
```

### Code Formatting
```bash
black .
isort .
```

### Running Tests
```bash
pytest
```

## Differences from Node.js Version

1. **Framework**: FastAPI instead of Express.js
2. **Language**: Python instead of JavaScript
3. **Async**: Uses Python's async/await syntax
4. **Dependencies**: Python packages instead of npm packages
5. **Package Manager**: uv instead of pnpm
6. **Auto Documentation**: Built-in OpenAPI/Swagger docs at `/docs`

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port in run.py or use:
   uv run uvicorn main:app --port 8000
   ```

2. **Missing Dependencies**
   ```bash
   uv pip install -e .
   ```

3. **Immich Upload Fails**
   - Check your `.env` configuration
   - Verify Immich API key and album ID
   - Check network connectivity to Immich instance

4. **Photos Directory Permission Issues**
   ```bash
   # Ensure write permissions
   chmod 755 photos/
   ```

## Production Deployment

For production, consider:
- Setting `reload=False` in the uvicorn configuration
- Using a production ASGI server like Gunicorn with Uvicorn workers
- Setting up proper logging
- Using environment variables for configuration
- Setting up reverse proxy (nginx) for static files 