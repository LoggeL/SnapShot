// Get elements
const video = document.getElementById('video')
const captureButton = document.getElementById('capture')
const photosContainer = document.getElementById('photos')
const timerElement = document.getElementById('timer')
const imagePreview = document.getElementById('image-preview')
const cameraSwitchButton = document.getElementById('camera-switch')

captureButton.disabled = true

// Camera management
let currentStream = null
let availableCameras = []
let currentCameraIndex = 0

// Gallery management
let galleryActivityTimer
let isGalleryExpanded = false

// Update photo count function (needs to be declared early)
function updatePhotoCount() {
  const photoCount = photosContainer.children.length
  const galleryCount = document.querySelector('.gallery-count')
  if (galleryCount) {
    galleryCount.textContent = photoCount
  }
}

// Initialize camera system
async function initializeCameras() {
  try {
    // Get list of available cameras
    const devices = await navigator.mediaDevices.enumerateDevices()
    availableCameras = devices.filter(device => device.kind === 'videoinput')
    
    console.log(`Found ${availableCameras.length} camera(s)`)
    
    // Update camera switch button visibility
    if (availableCameras.length > 1) {
      cameraSwitchButton.style.display = 'flex'
      cameraSwitchButton.title = `Switch Camera (${availableCameras.length} available)`
    } else {
      cameraSwitchButton.style.display = 'none'
    }
    
    // Start with the first camera
    await switchToCamera(0)
    
  } catch (err) {
    console.error('Error initializing cameras:', err)
    captureButton.innerHTML = '❌ Camera Access Denied'
  }
}

// Switch to a specific camera
async function switchToCamera(cameraIndex) {
  try {
    // Stop current stream if it exists
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop())
    }
    
    // Get constraints for the selected camera
    const constraints = {
      video: {
        deviceId: availableCameras[cameraIndex]?.deviceId || undefined,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    }
    
    // Get new stream
    currentStream = await navigator.mediaDevices.getUserMedia(constraints)
    video.srcObject = currentStream
    
    video.onloadedmetadata = () => {
      video.play()
      captureButton.disabled = false
      captureButton.innerHTML = '📸 Capture Photo'
    }
    
    currentCameraIndex = cameraIndex
    
  } catch (err) {
    console.error('Error switching camera:', err)
    captureButton.innerHTML = '❌ Camera Error'
  }
}

// Initialize cameras on page load
initializeCameras()

// Camera switch button event handler
cameraSwitchButton.addEventListener('click', () => {
  if (availableCameras.length > 1) {
    const nextCameraIndex = (currentCameraIndex + 1) % availableCameras.length
    switchToCamera(nextCameraIndex)
  }
})



// Capture photo with timer
let captureTimer
captureButton.addEventListener('click', () => {
  // Disable button while taking photo
  captureButton.disabled = true
  captureButton.innerHTML = '⏳ Taking Photo...'

  // Clear previous timer
  clearTimeout(captureTimer)

  const countdownDuration = parseFloat(
    document.getElementById('timer-value').innerText
  )

  if (countdownDuration > 0) {
    let countdown = Math.ceil(countdownDuration)
    timerElement.style.display = 'block'
    timerElement.innerText = countdown

    const countdownInterval = setInterval(() => {
      countdown--
      if (countdown > 0) {
        timerElement.innerText = countdown
      } else {
        clearInterval(countdownInterval)
        timerElement.style.display = 'none'
        takePhoto()
      }
    }, 1000)
  } else {
    takePhoto()
  }
})

function takePhoto() {
  // if the video is not ready, return
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    captureButton.disabled = false
    captureButton.innerHTML = '📸 Capture Photo'
    return
  }

  // Start flash effect immediately
  const flashOverlay = document.getElementById('flashOverlay')
  flashOverlay.classList.add('active')

  // Capture photo during flash (200ms into flash effect)
  setTimeout(() => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')

    // Apply filter to canvas context
    const filter = document.querySelector('.filter.active')
    if (filter && filter.getAttribute('data-filter') !== 'none') {
      context.filter = filter.getAttribute('data-filter')
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Post image to server
    fetch('/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photo: canvas.toDataURL('image/png'),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Photo saved:', data)
        
        // Create photo element with buttons
        createPhotoElement(data.path.replace('./photos/', '/photos/'))
        updatePhotoCount()
        
        // Re-enable capture button
        captureButton.disabled = false
        captureButton.innerHTML = '📸 Capture Photo'
      })
      .catch((error) => {
        console.error('Error saving photo:', error)
        captureButton.disabled = false
        captureButton.innerHTML = '📸 Capture Photo'
      })
  }, 200) // Capture photo 200ms into the flash

  // End flash effect after 400ms total
  setTimeout(() => {
    flashOverlay.classList.remove('active')
  }, 400)
}

// Create photo element with download/delete buttons
function createPhotoElement(imagePath) {
  const photoContainer = document.createElement('div')
  photoContainer.classList.add('photo')
  
  const img = document.createElement('img')
  img.src = imagePath
  img.alt = 'Captured photo'
  photoContainer.appendChild(img)

  // Create buttons container
  const buttonsContainer = document.createElement('div')
  buttonsContainer.classList.add('buttons')

  // Download button
  const downloadBtn = document.createElement('button')
  downloadBtn.innerHTML = `<img src="download.svg" alt="Download" />`
  downloadBtn.title = 'Download Photo'
  downloadBtn.onclick = (e) => {
    e.stopPropagation()
    downloadPhoto(imagePath)
  }

  // Delete button
  const deleteBtn = document.createElement('button')
  deleteBtn.innerHTML = `<img src="delete.svg" alt="Delete" />`
  deleteBtn.title = 'Delete Photo'
  deleteBtn.onclick = (e) => {
    e.stopPropagation()
    deletePhoto(imagePath, photoContainer)
  }

  buttonsContainer.appendChild(downloadBtn)
  buttonsContainer.appendChild(deleteBtn)
  photoContainer.appendChild(buttonsContainer)

  // Photo preview on click
  photoContainer.addEventListener('click', () => {
    showPhotoPreview(imagePath)
  })

  // Add photo to gallery (at the beginning)
  photosContainer.insertBefore(photoContainer, photosContainer.firstChild)
  
  // Maintain maximum of 10 photos in gallery
  const photos = photosContainer.children
  if (photos.length > 10) {
    // Remove the oldest photo (last in the DOM)
    photosContainer.removeChild(photos[photos.length - 1])
  }
}

// Download photo function
function downloadPhoto(imagePath) {
  const link = document.createElement('a')
  link.href = imagePath
  link.download = imagePath.split('/').pop()
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Delete photo function
function deletePhoto(imagePath, photoElement) {
  if (confirm('Are you sure you want to delete this photo?')) {
    const filename = imagePath.split('/').pop()
    
    fetch(`/photos/${filename}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (response.ok) {
        photoElement.remove()
        updatePhotoCount()
        console.log('Photo deleted successfully')
      } else {
        console.error('Failed to delete photo')
      }
    })
    .catch(error => {
      console.error('Error deleting photo:', error)
    })
  }
}

// Show photo preview
function showPhotoPreview(imagePath) {
  video.style.display = 'none'
  imagePreview.style.display = 'block'
  imagePreview.src = imagePath
  
  // Hide preview after 10 seconds or on click
  const hidePreview = () => {
    video.style.display = 'block'
    imagePreview.style.display = 'none'
    imagePreview.removeEventListener('click', hidePreview)
  }
  
  setTimeout(hidePreview, 10000)
  imagePreview.addEventListener('click', hidePreview)
}

// Initialize the gallery
fetch('/photos')
  .then((res) => res.json())
  .then((data) => {
    // Only show the last 10 photos
    const recentPhotos = data.slice(0, 10)
    recentPhotos.forEach((filename) => {
      createPhotoElement(`/photos/${filename}`)
    })
    updatePhotoCount()
  })
  .catch((error) => {
    console.error('Error loading photos:', error)
  })

// Take photo with spacebar
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !captureButton.disabled) {
    e.preventDefault()
    captureButton.click()
  }
})

// Timer Slider functionality
document.addEventListener('DOMContentLoaded', function () {
  const sliderContainer = document.querySelector('.timer-slider__container')
  const sliderBar = document.querySelector('.timer-slider__bar')
  const sliderThumb = document.querySelector('.timer-slider__thumb')
  const sliderValue = document.getElementById('timer-value')
  const maxTime = 5
  const minTime = 1

  let isDragging = false

  // Function to update the slider value
  const updateSlider = (clientX) => {
    const rect = sliderContainer.getBoundingClientRect()
    let newLeft = clientX - rect.left
    
    // Clamp to container bounds
    newLeft = Math.max(0, Math.min(newLeft, rect.width))
    
    const percentage = newLeft / rect.width
    sliderBar.style.width = `${percentage * 100}%`
    sliderThumb.style.left = `${newLeft}px`

    const time = minTime + (maxTime - minTime) * percentage
    sliderValue.innerText = time.toFixed(1)
  }

  // Mouse events for slider
  sliderThumb.addEventListener('mousedown', (e) => {
    isDragging = true
    e.preventDefault()
  })

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      updateSlider(e.clientX)
    }
  })

  document.addEventListener('mouseup', () => {
    isDragging = false
  })

  sliderContainer.addEventListener('click', (e) => {
    if (!isDragging) {
      updateSlider(e.clientX)
    }
  })

  // Touch events for mobile
  sliderThumb.addEventListener('touchstart', (e) => {
    isDragging = true
    e.preventDefault()
  })

  document.addEventListener('touchmove', (e) => {
    if (isDragging) {
      const touch = e.touches[0]
      updateSlider(touch.clientX)
      e.preventDefault()
    }
  })

  document.addEventListener('touchend', () => {
    isDragging = false
  })

  // Initialize slider to 3 seconds (default)
  const defaultTime = 3
  const defaultPercentage = (defaultTime - minTime) / (maxTime - minTime)
  const rect = sliderContainer.getBoundingClientRect()
  const defaultPosition = rect.left + (rect.width * defaultPercentage)
  updateSlider(defaultPosition)
})

// Filter functionality
document.addEventListener('DOMContentLoaded', function () {
  const videoElement = document.getElementById('video')
  const filters = document.querySelectorAll('.filter')

  filters.forEach((filter) => {
    filter.addEventListener('click', function () {
      const filterValue = this.getAttribute('data-filter')
      
      // Apply filter to video
      if (filterValue === 'none') {
        videoElement.style.filter = ''
      } else {
        videoElement.style.filter = filterValue
      }

      // Remove active class from all filters
      filters.forEach((f) => f.classList.remove('active'))
      // Add active class to the clicked filter
      this.classList.add('active')
    })
  })
})

// Clear all photos functionality
document.getElementById('clear').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete all photos? This cannot be undone.')) {
    // Clear the photos container
    photosContainer.innerHTML = ''
    
    // Optionally, you could also delete from server by calling DELETE on each photo
    console.log('All photos cleared from display')
  }
})

// Handle window resize for responsive layout
window.addEventListener('resize', () => {
  // Recalculate slider position if needed
  const sliderContainer = document.querySelector('.timer-slider__container')
  const sliderThumb = document.querySelector('.timer-slider__thumb')
  
  if (sliderContainer && sliderThumb) {
    const currentValue = parseFloat(document.getElementById('timer-value').innerText)
    const percentage = (currentValue - 1) / (5 - 1) // Convert 1-5 range to 0-1 percentage
    const rect = sliderContainer.getBoundingClientRect()
    sliderThumb.style.left = `${rect.width * percentage}px`
  }
})

// Gallery collapse/expand functionality
const galleryPanel = document.querySelector('.gallery-panel')
const galleryToggle = document.getElementById('gallery-toggle')
const mainElement = document.querySelector('main')

// Expand gallery
function expandGallery() {
  galleryPanel.classList.remove('collapsed')
  mainElement.classList.add('gallery-expanded')
  isGalleryExpanded = true
  resetActivityTimer()
}

// Collapse gallery
function collapseGallery() {
  galleryPanel.classList.add('collapsed')
  mainElement.classList.remove('gallery-expanded')
  isGalleryExpanded = false
  clearTimeout(galleryActivityTimer)
}

// Reset activity timer
function resetActivityTimer() {
  clearTimeout(galleryActivityTimer)
  
  if (isGalleryExpanded) {
    galleryActivityTimer = setTimeout(() => {
      collapseGallery()
    }, 60000) // 60 seconds
  }
}

// Toggle gallery
function toggleGallery() {
  if (isGalleryExpanded) {
    collapseGallery()
  } else {
    expandGallery()
  }
}

// Gallery toggle button event
if (galleryToggle) {
  galleryToggle.addEventListener('click', toggleGallery)
}

// Activity detection for auto-retract
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

activityEvents.forEach(event => {
  document.addEventListener(event, () => {
    if (isGalleryExpanded) {
      resetActivityTimer()
    }
  }, true)
})

// Update count when clear button is used
document.getElementById('clear').addEventListener('click', () => {
  setTimeout(updatePhotoCount, 100) // Small delay to ensure DOM is updated
})

// QR Code Generation
async function generateQRCode() {
  const qrContainer = document.getElementById('qr-code-container')
  
  try {
    // Fetch album URL from backend
    const response = await fetch('/album-url')
    
    if (!response.ok) {
      throw new Error('Failed to fetch album URL')
    }
    
    const data = await response.json()
    const albumUrl = data.album_url
    
    // Clear previous QR code
    qrContainer.innerHTML = ''
    
    // Generate QR code
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, albumUrl, {
      width: 100,
      height: 100,
      margin: 1,
      color: {
        dark: '#58a6ff',
        light: '#0d1117'
      }
    })
    
    qrContainer.appendChild(canvas)
    
    console.log('QR code generated for album:', albumUrl)
    
  } catch (error) {
    console.error('Error generating QR code:', error)
    
    // Show error message
    qrContainer.innerHTML = `
      <div style="
        width: 100px; 
        height: 100px; 
        background: #21262d; 
        border: 2px solid #f85149;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #f85149;
        text-align: center;
        padding: 8px;
        box-sizing: border-box;
      ">
        QR Code<br>Unavailable
      </div>
    `
  }
}

// Generate QR code when page loads
document.addEventListener('DOMContentLoaded', generateQRCode)
