# SnapShot - Photo Management Application

## Overview

SnapShot is a comprehensive photo management application that combines a web-based camera interface with cloud storage integration. It provides real-time photo capture, local storage, and automatic synchronization with Immich (a self-hosted photo management service).

## Features

### Web Interface
- **Real-time Camera Access**: Live video feed from device camera
- **Timer-based Capture**: Configurable delay timer (0-10 seconds)
- **Image Filters**: Real-time filter effects (Grayscale, Sepia, Invert)
- **Gallery View**: Grid display of captured photos

- **Mobile Responsive**: QR code for easy mobile gallery access

### Backend API
- **Photo Storage**: Local file system storage with timestamped naming
- **Cloud Integration**: Automatic upload to Immich server
- **Album Management**: Automatic assignment to designated Immich albums
- **RESTful API**: Complete CRUD operations for photo management

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │───▶│   Backend API   │───▶│  Immich Cloud   │
│                 │    │                 │    │                 │
│ • Camera Feed   │    │ • File Storage  │    │ • Asset Upload  │
│ • Filters       │    │ • API Endpoints │    │ • Album Mgmt    │
│ • Gallery       │    │ • Cloud Sync    │    │ • Backup        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## System Requirements

### Runtime Environment
- HTTP server capability
- File system read/write access
- Camera/video device access (for web interface)
- Network connectivity (for cloud sync)

### Dependencies
- Express.js framework (or equivalent HTTP server)
- File system operations
- HTTP client for external API calls
- Base64 encoding/decoding
- Multipart form data handling
- Environment variable support

## Installation & Setup

### 1. Environment Configuration

Create a `.env` file with the following variables:

```env
IMMICH_BASE_URL=https://your-immich-instance.com/api
IMMICH_API_KEY=your-immich-api-key
IMMICH_ALBUM_ID=your-target-album-id
```

### 2. Directory Structure

The application expects the following structure:

```
project-root/
├── photos/                 # Auto-created photo storage
├── public/                 # Web interface files
│   ├── index.html         # Main interface
│   ├── styles.css         # Styling
│   ├── script.js          # Frontend logic
│   ├── SnapShotLogo.png   # Application logo
│   └── qr-code.svg        # Gallery QR code
├── index.js               # Main server file
├── package.json           # Dependencies
└── .env                   # Environment variables
```

### 3. Dependencies Installation

The application requires the following packages:
- `express` - Web server framework
- `fs` - File system operations (built-in)
- `path` - Path utilities (built-in)
- `body-parser` - Request parsing
- `axios` - HTTP client
- `form-data` - Multipart form handling
- `dotenv` - Environment variables

### 4. Starting the Application

1. Install dependencies
2. Configure environment variables
3. Start the server (default port: 3000)
4. Access the web interface at `http://localhost:3000`

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Quick API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Web interface |
| GET | `/photos` | List all photos |
| GET | `/photos/{filename}` | Access specific photo |
| POST | `/photos` | Save new photo |
| DELETE | `/photos/{filename}` | Delete photo |

## Web Interface Features

### Camera Controls
- **Video Feed**: Real-time camera preview
- **Capture Button**: Manual photo capture
- **Timer**: Configurable delay (0-10 seconds)
- **Filters**: Real-time CSS filter effects

### Photo Management
- **Gallery Grid**: Thumbnail view of all photos
- **Download**: Individual photo download
- **Delete**: Remove photos from storage
- **Clear All**: Batch photo removal

### Mobile Support
- **Responsive Design**: Adapts to mobile screens
- **QR Code**: Quick access to gallery
- **Touch Controls**: Mobile-optimized interface

## Integration Details

### Immich Cloud Storage

The application automatically integrates with Immich for:

1. **Asset Upload**: Photos are uploaded as assets
2. **Metadata**: Includes device ID, timestamps, and file info
3. **Album Assignment**: Automatic addition to specified album
4. **Backup**: Redundant cloud storage for safety



## Security & Privacy

### Data Protection
- **Local Storage**: Photos stored locally first
- **Secure Upload**: API key-based authentication
- **Path Security**: Server-generated filenames prevent traversal
- **Size Limits**: 50MB request body limit

### Privacy Features
- **Local Processing**: All image processing runs locally
- **No External Tracking**: Self-hosted solution
- **User Control**: Complete data ownership

## Configuration Options

### Timer Settings
- Range: 0-10 seconds
- Real-time preview updates
- Visual countdown display

### Filter Options
- None (default)
- Grayscale
- Sepia
- Invert

### File Management
- Automatic timestamped naming
- PNG format output
- Local backup before cloud upload

## Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Check browser permissions
   - Ensure HTTPS for remote access
   - Verify camera device availability

2. **Upload Failures**
   - Verify Immich API credentials
   - Check network connectivity
   - Confirm album ID exists

3. **Storage Issues**
   - Ensure write permissions on photos directory
   - Check available disk space
   - Verify file system access

### Error Responses

All API errors return JSON format:
```json
{
  "error": "Error description"
}
```

### Debug Mode

Check server logs for detailed error information and upload status.

## Browser Compatibility

### Supported Browsers
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Required Features
- WebRTC/getUserMedia
- ES6 JavaScript
- CSS Grid
- Fetch API

## Performance Considerations

### Optimization Features
- Efficient video stream handling
- Optimized image compression
- Asynchronous cloud uploads
- Local storage caching

### Resource Usage
- Memory: ~50MB base + video stream
- Network: Upload bandwidth dependent
- Storage: Local photos + cache

## Contributing

### Development Setup
1. Clone repository
2. Install dependencies
3. Configure test environment
4. Run development server

### Code Structure
- Frontend: Vanilla JavaScript/CSS
- Backend: Node.js/Express
- Integration: RESTful API design

## License

[Specify your license here]

## Support

For issues, questions, or contributions:
- Check existing documentation
- Review API reference
- Test with minimal configuration
- Report bugs with detailed information 