const express = require('express')
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const axios = require('axios')
const FormData = require('form-data')
require('dotenv').config()

const app = express()
const port = 3000

// Directory where photos will be stored
const photosDirectory = path.join(__dirname, 'photos')
// Ensure the photos directory exists
fs.existsSync(photosDirectory) || fs.mkdirSync(photosDirectory)

// Middleware to parse JSON and urlencoded data with increased limit
app.use(bodyParser.json({ limit: '50mb' })) // Increase JSON body limit
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })) // Increase URL-encoded body limit

// Static middleware to serve static files from the public directory
app.use(express.static('public'))

// Handle index.html as the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'))
})

// Middleware to serve static files from photos directory
app.use('/photos', express.static(photosDirectory))

// List photos
app.get('/photos', (req, res) => {
  console.log('Listing photos')
  fs.readdir(photosDirectory, (err, files) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Error listing photos' })
    }
    res.json(files)
  })
})

// Save a photo
app.post('/photos', (req, res) => {
  const photoData = req.body.photo
  if (!photoData) {
    return res.status(400).json({ error: 'No photo data provided' })
  }

  // Extract base64 data
  const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '')
  const dataBuffer = Buffer.from(base64Data, 'base64')

  const filename = `photo-${Date.now()}.png`
  const filePath = path.join(photosDirectory, filename)

  // Write the file to the filesystem
  fs.writeFile(filePath, dataBuffer, async (err) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Error saving photo' })
    }
    res.json({
      message: `Photo saved: ${filename}`,
      path: `./photos/${filename}`,
    })

    try {
      // Upload the photo to the cloud
      const stats = fs.statSync(filePath)

      const data = {
        deviceAssetId: `${filename}-${stats.mtime}`,
        deviceId: 'nodejs',
        fileCreatedAt: new Date(stats.mtime),
        fileModifiedAt: new Date(stats.mtime),
        isFavorite: 'false',
      }

      const formData = new FormData()

      // Append the file
      formData.append('assetData', fs.createReadStream(filePath))

      // Append additional data fields as strings
      formData.append('deviceAssetId', data.deviceAssetId)
      formData.append('deviceId', data.deviceId)
      // Convert dates to ISO string format
      formData.append('fileCreatedAt', data.fileCreatedAt.toISOString())
      formData.append('fileModifiedAt', data.fileModifiedAt.toISOString())
      formData.append('isFavorite', data.isFavorite)

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.IMMICH_BASE_URL}/assets`,
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
          'x-api-key': process.env.IMMICH_API_KEY,
          ...formData.getHeaders(),
        },
        data: formData,
      }

      const response = await axios.request(config)
      // .then((response) => {
      //   console.log(JSON.stringify(response.data))
      // })
      // .catch((error) => {
      //   console.log(error)
      // })

      console.log(response.data)

      // Add the photo to an album
      const albumId = process.env.IMMICH_ALBUM_ID

      let pictureData = JSON.stringify({
        ids: [response.data.id],
      })

      let albumConfig = {
        method: 'put',
        maxBodyLength: Infinity,
        url: `${process.env.IMMICH_BASE_URL}/albums/${process.env.IMMICH_ALBUM_ID}/assets`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': process.env.IMMICH_API_KEY,
        },
        data: pictureData,
      }

      const albumResponse = await axios.request(albumConfig)

      console.log(albumResponse.data)
    } catch (error) {
      console.log(error)
    }
  })
})

// Delete a photo
app.delete('/photos/:filename', (req, res) => {
  const filePath = path.join(photosDirectory, req.params.filename)
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Error deleting photo' })
    }
    res.json({ message: 'Photo deleted' })
  })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
