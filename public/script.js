// Get elements
const video = document.getElementById('video')
const captureButton = document.getElementById('capture')
const photosContainer = document.getElementById('photos')
const timerElement = document.getElementById('timer')
const imagePreview = document.getElementById('image-preview')

captureButton.disabled = true

// Access the device camera and stream to video element
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream
    video.onloadedmetadata = () => {
      video.play()
      captureButton.disabled = false
    }
  })
  .catch((err) => {
    console.error('Error accessing the camera: ' + err)
  })

// Capture photo with timer
let captureTimer
captureButton.addEventListener('click', () => {
  // Disable button while taking photo
  captureButton.disabled = true

  // Clear previous timer
  clearTimeout(captureTimer)

  const countdownDuration = parseFloat(
    document.getElementById('timer-value').innerText
  )
  const startTime = Date.now()
  const endTime = startTime + countdownDuration * 1000

  function animateTimer() {
    const currentTime = Date.now()
    const elapsedTime = currentTime - startTime
    const remainingTime = Math.max(endTime - currentTime, 0)
    const widthPercentage = (remainingTime / (countdownDuration * 1000)) * 100

    timerElement.style.width = `${100 - widthPercentage}%`

    if (remainingTime > 0) {
      requestAnimationFrame(animateTimer)
    } else {
      takePhoto()
      timerElement.style.width = '100%'
      timerElement.style.display = 'none'
      captureButton.disabled = false
    }
  }

  timerElement.style.display = 'block'
  requestAnimationFrame(animateTimer)

  captureTimer = setTimeout(() => {
    // This timeout is now just a fallback in case the animation frame doesn't finish
    timerElement.style.width = '100%'
    timerElement.style.display = 'none'
  }, countdownDuration * 1000)
})

function takePhoto() {
  // if the video is not ready, return
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  // Apply filter
  const filter = document.querySelector('.filter.active')
  if (filter) {
    context.filter = filter.getAttribute('data-filter')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
  }

  // Flash effect
  const flashOverlay = document.getElementById('flashOverlay')
  flashOverlay.style.opacity = 1
  setTimeout(() => {
    flashOverlay.style.opacity = 0
  }, 300)

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
      console.log(data)

      // Create photo element
      const photoContainer = document.createElement('div')
      photoContainer.classList.add('photo')
      const img = document.createElement('img')
      img.src = data.path
      photoContainer.appendChild(img)

      // Preview photo on hover
      photoContainer.addEventListener('mouseover', () => {
        photoContainer.style.outline = '2px solid red'
        video.style.display = 'none'
        imagePreview.style.display = 'block'
        imagePreview.style.backgroundImage = `url(${img.src})`
      })

      photoContainer.addEventListener('mouseout', () => {
        photoContainer.style.outline = 'none'
        video.style.display = 'block'
        imagePreview.style.display = 'none'
        imagePreview.style.backgroundImage = 'none'
      })

      // Add photo to gallery
      photosContainer.prepend(photoContainer)
    })
}

// Initalize the gallery
fetch('/photos')
  .then((res) => res.json())
  .then((data) => {
    data.forEach((filename) => {
      // Create photo element
      const photoContainer = document.createElement('div')
      photoContainer.classList.add('photo')
      const img = document.createElement('img')
      img.src = `/photos/${filename}`
      photoContainer.appendChild(img)

      // Preview photo on hover
      photoContainer.addEventListener('mouseover', () => {
        photoContainer.style.outline = '2px solid red'
        video.style.display = 'none'
        imagePreview.style.display = 'block'
        imagePreview.style.backgroundImage = `url(${img.src})`
      })

      photoContainer.addEventListener('mouseout', () => {
        photoContainer.style.outline = 'none'
        video.style.display = 'block'
        imagePreview.style.display = 'none'
        imagePreview.style.backgroundImage = 'none'
      })

      // Add photo to gallery
      photosContainer.prepend(photoContainer)
    })
  })

// Take photo with spacebar
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    takePhoto()
  }
})

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
    const { left, width } = sliderContainer.getBoundingClientRect()
    let newLeft = clientX - left
    if (newLeft < 0) {
      newLeft = 0
    } else if (newLeft > width) {
      newLeft = width
    }
    const percentage = newLeft / width
    sliderBar.style.width = `${percentage * 100}%`
    sliderThumb.style.left = `${newLeft - sliderThumb.offsetWidth / 2}px`

    const time = minTime + (maxTime - minTime) * percentage
    sliderValue.innerText = time.toFixed(1)
  }

  sliderThumb.addEventListener('mousedown', function () {
    isDragging = true
  })

  document.addEventListener('mousemove', function (e) {
    if (isDragging) {
      updateSlider(e.clientX)
    }
  })

  document.addEventListener('mouseup', function () {
    isDragging = false
  })

  sliderContainer.addEventListener('click', function (e) {
    updateSlider(e.clientX)
  })

  // Set the slider to 50% on load
  updateSlider(
    sliderContainer.getBoundingClientRect().left +
      sliderContainer.offsetWidth / 2
  )
})

// Filters
document.addEventListener('DOMContentLoaded', function () {
  const videoElement = document.getElementById('video')
  const filters = document.querySelectorAll('.filter')

  filters.forEach((filter) => {
    // Add SnapShotLogo to the filter
    const snapShotLogo = document.createElement('img')
    snapShotLogo.src = 'SnapShotLogo.png'
    snapShotLogo.classList.add('snapshot-logo')
    snapShotLogo.style.filter = filter.getAttribute('data-filter')
    filter.appendChild(snapShotLogo)

    filter.addEventListener('click', function () {
      const filterValue = this.getAttribute('data-filter')
      videoElement.style.filter = filterValue

      // Remove active class from all filters
      filters.forEach((f) => f.classList.remove('active'))
      // Add active class to the clicked filter
      this.classList.add('active')
    })
  })
})

// scroll horizontally on #photos with the scroll wheel
const photos = document.getElementById('photos')

photos.addEventListener('wheel', function (e) {
  e.preventDefault()
  photos.scrollLeft += e.deltaY
})
