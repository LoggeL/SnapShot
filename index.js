const express = require('express')
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')

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
  fs.writeFile(filePath, dataBuffer, (err) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Error saving photo' })
    }
    res.json({
      message: `Photo saved: ${filename}`,
      path: `./photos/${filename}`,
    })
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
