// Global variables
let uploadedPhotos = [];
let pageFlip = null;
let currentPage = 0;
let isFullscreen = false;
let settings = {
  darkMode: false,
  glassEffect: true,
  animations: true,
  flipSpeed: 1000,
  showShadows: true,
  autoSize: true,
};

// DOM elements
const photoInput = document.getElementById("photoInput");
const photoCount = document.getElementById("photoCount");
const clearPhotos = document.getElementById("clearPhotos");
const imagePreview = document.getElementById("imagePreview");
const bookContainer = document.getElementById("bookContainer");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

// New control elements
const settingsBtn = document.getElementById("settingsBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const themeBtn = document.getElementById("themeBtn");
const settingsPanel = document.getElementById("settingsPanel");
const fullscreenOverlay = document.getElementById("fullscreenOverlay");
const uploadSection = document.getElementById("uploadSection");
const previewSection = document.getElementById("previewSection");

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  loadDefaultPhotos();
  updateUIFromSettings();
});

// Event listeners
function initializeEventListeners() {
  // Original functionality
  photoInput.addEventListener("change", handlePhotoUpload);
  clearPhotos.addEventListener("click", clearAllPhotos);
  prevPageBtn.addEventListener("click", () => navigateToPage("prev"));
  nextPageBtn.addEventListener("click", () => navigateToPage("next"));

  // New control buttons
  settingsBtn.addEventListener("click", openSettings);
  fullscreenBtn.addEventListener("click", toggleFullscreen);
  themeBtn.addEventListener("click", toggleTheme);

  // Settings panel
  document.getElementById("closeSettings").addEventListener("click", closeSettings);
  document.getElementById("uploadPhotosBtn").addEventListener("click", openPhotoUpload);
  document.getElementById("clearAllBtn").addEventListener("click", clearAllFromSettings);

  // Settings controls
  document.getElementById("darkModeToggle").addEventListener("change", toggleDarkMode);
  document.getElementById("glassToggle").addEventListener("change", toggleGlassEffect);
  document.getElementById("animationsToggle").addEventListener("change", toggleAnimations);
  document.getElementById("flipSpeed").addEventListener("input", updateFlipSpeed);
  document.getElementById("shadowToggle").addEventListener("change", toggleShadows);
  document.getElementById("autoSizeToggle").addEventListener("change", toggleAutoSize);

  // Advanced settings
  document.getElementById("exportBtn").addEventListener("click", exportConfiguration);
  document.getElementById("resetBtn").addEventListener("click", resetToDefault);

  // Fullscreen controls
  document.getElementById("exitFullscreen").addEventListener("click", exitFullscreen);

  // Keyboard controls
  document.addEventListener("keydown", handleKeyboardControls);

  // Close panels on outside click
  settingsPanel.addEventListener("click", (e) => {
    if (e.target === settingsPanel) closeSettings();
  });

  fullscreenOverlay.addEventListener("click", (e) => {
    if (e.target === fullscreenOverlay) exitFullscreen();
  });

  // Drag and drop
  initializeDragAndDrop();
}

// Handle photo upload
function handlePhotoUpload(event) {
  const files = Array.from(event.target.files);

  if (files.length === 0) return;

  // Process each file
  files.forEach((file) => {
    if (file.type.startsWith("image/")) {
      processImageFile(file);
    }
  });
}

// Process individual image file
function processImageFile(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const imageData = {
      id: Date.now() + Math.random(),
      name: file.name,
      dataUrl: e.target.result,
      size: file.size,
      isDemo: false,
    };

    // Remove demo pages when adding real photos
    if (uploadedPhotos.length > 0 && uploadedPhotos[0].isDemo) {
      uploadedPhotos = [];
    }

    uploadedPhotos.push(imageData);
    updatePhotoCount();
    updateImagePreview();
    updateBookFlip();

    // Show clear button if photos exist
    if (uploadedPhotos.length > 0) {
      clearPhotos.style.display = "inline-block";
    }
  };

  reader.readAsDataURL(file);
}

// Update photo count display
function updatePhotoCount() {
  const realPhotos = uploadedPhotos.filter((photo) => !photo.isDemo);
  const demoPages = uploadedPhotos.filter((photo) => photo.isDemo);

  if (realPhotos.length > 0) {
    photoCount.textContent = `${realPhotos.length} photo${
      realPhotos.length !== 1 ? "s" : ""
    } selected`;
  } else if (demoPages.length > 0) {
    photoCount.textContent = `${demoPages.length} demo page${
      demoPages.length !== 1 ? "s" : ""
    } loaded`;
  } else {
    photoCount.textContent = "0 photos selected";
  }
}

// Update image preview gallery
function updateImagePreview() {
  // Only show preview if there are real photos (not demo pages)
  const realPhotos = uploadedPhotos.filter((photo) => !photo.isDemo);

  if (realPhotos.length === 0) {
    previewSection.style.display = "none";
    return;
  }

  previewSection.style.display = "block";
  imagePreview.innerHTML = "";

  realPhotos.forEach((photo, index) => {
    const previewItem = createPreviewItem(photo, index);
    imagePreview.appendChild(previewItem);
  });
}

// Create preview item
function createPreviewItem(photo, index) {
  const item = document.createElement("div");
  item.className = "preview-item";

  const img = document.createElement("img");
  img.src = photo.dataUrl;
  img.alt = photo.name;
  img.loading = "lazy";

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.innerHTML = "×";
  removeBtn.title = "Remove photo";
  removeBtn.onclick = () => removePhoto(index);

  item.appendChild(img);
  item.appendChild(removeBtn);

  return item;
}

// Remove photo from array
function removePhoto(index) {
  // Find the real photo index in the full array
  const realPhotos = uploadedPhotos.filter((photo) => !photo.isDemo);
  const photoToRemove = realPhotos[index];
  const realIndex = uploadedPhotos.findIndex((photo) => photo.id === photoToRemove.id);

  if (realIndex !== -1) {
    uploadedPhotos.splice(realIndex, 1);
  }

  updatePhotoCount();
  updateImagePreview();
  updateBookFlip();

  // Hide clear button if no real photos
  const remainingRealPhotos = uploadedPhotos.filter((photo) => !photo.isDemo);
  if (remainingRealPhotos.length === 0) {
    clearPhotos.style.display = "none";
    // Load demo pages if no real photos remain
    if (uploadedPhotos.length === 0) {
      loadDefaultPhotos();
    }
  }
}

// Clear all photos
function clearAllPhotos() {
  uploadedPhotos = [];
  photoInput.value = "";
  updatePhotoCount();
  updateImagePreview();
  loadDefaultPhotos(); // Load demo pages after clearing
  clearPhotos.style.display = "none";
  uploadSection.style.display = "none";
  previewSection.style.display = "none";
}

// Load default photos for demo
function loadDefaultPhotos() {
  // Create some default demo pages if no photos are loaded
  if (uploadedPhotos.length === 0) {
    createDemoPages();
  } else {
    showEmptyState();
  }
}

// Create demo pages
function createDemoPages() {
  const demoPages = [
    { color: "#FF6B6B", title: "Welcome", subtitle: "to Photo Book Flip" },
    { color: "#4ECDC4", title: "Interactive", subtitle: "Digital Experience" },
    { color: "#45B7D1", title: "Upload Photos", subtitle: "via Settings Panel" },
    { color: "#96CEB4", title: "Fullscreen Mode", subtitle: "Available" },
    { color: "#FFEAA7", title: "Touch Gestures", subtitle: "Supported" },
  ];

  uploadedPhotos = demoPages.map((page, index) => ({
    id: `demo-${index}`,
    name: `Demo Page ${index + 1}`,
    dataUrl: createDemoPageDataUrl(page),
    isDemo: true,
  }));

  updatePhotoCount();
  updateBookFlip();
}

// Create demo page data URL
function createDemoPageDataUrl(page) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 400;
  canvas.height = 600;

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, 600);
  gradient.addColorStop(0, page.color);
  gradient.addColorStop(1, adjustColor(page.color, -20));

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 600);

  // Add title
  ctx.fillStyle = "white";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText(page.title, 200, 250);

  // Add subtitle
  ctx.font = "24px Arial";
  ctx.fillText(page.subtitle, 200, 300);

  return canvas.toDataURL();
}

// Adjust color brightness
function adjustColor(color, amount) {
  const usePound = color[0] === "#";
  const col = usePound ? color.slice(1) : color;
  const num = parseInt(col, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;

  r = r > 255 ? 255 : r < 0 ? 0 : r;
  g = g > 255 ? 255 : g < 0 ? 0 : g;
  b = b > 255 ? 255 : b < 0 ? 0 : b;

  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, "0");
}

// Show empty state
function showEmptyState() {
  bookContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📖</div>
            <p>Your photo book will appear here once you upload some images.</p>
        </div>
    `;

  updateNavigationButtons();
}

// Update book flip
function updateBookFlip() {
  // Destroy existing book flip instance
  if (pageFlip) {
    pageFlip.destroy();
    pageFlip = null;
  }

  // Clear book container
  bookContainer.innerHTML = "";

  if (uploadedPhotos.length === 0) {
    showEmptyState();
    return;
  }

  // Create book flip instance
  createBookFlip();
}

// Create book flip instance
function createBookFlip() {
  createBookFlipInContainer(bookContainer);
}

// Create book flip in specific container
function createBookFlipInContainer(container) {
  // Create book wrapper
  const bookWrapper = document.createElement("div");
  bookWrapper.className = "book-wrapper";

  // Create pages container
  const pagesContainer = document.createElement("div");
  pagesContainer.className = "pages-container";
  bookWrapper.appendChild(pagesContainer);
  container.appendChild(bookWrapper);

  // Create page elements
  const pages = uploadedPhotos.map((photo, index) => {
    const pageElement = document.createElement("div");
    pageElement.className = "book-page";
    pageElement.dataset.density = "hard";

    const img = document.createElement("img");
    img.src = photo.dataUrl;
    img.alt = photo.name;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    pageElement.appendChild(img);
    pagesContainer.appendChild(pageElement);

    return pageElement;
  });

  // Initialize PageFlip with appropriate sizing for container
  const isFullscreenContainer = container.id === "fullscreenBook";

  try {
    pageFlip = new St.PageFlip(pagesContainer, {
      width: isFullscreenContainer ? 500 : 400,
      height: isFullscreenContainer ? 625 : 525,
      size: "stretch",
      minWidth: isFullscreenContainer ? 400 : 300,
      maxWidth: isFullscreenContainer ? 800 : 800,
      minHeight: isFullscreenContainer ? 500 : 400,
      maxHeight: isFullscreenContainer ? 900 : 1000,
      drawShadow: settings.showShadows,
      flippingTime: settings.flipSpeed,
      usePortrait: true,
      startZIndex: 0,
      autoSize: settings.autoSize,
      maxShadowOpacity: 0.5,
      showCover: false,
      mobileScrollSupport: true,
      swipeDistance: 30,
      clickEventForward: true,
      useMouseEvents: true,
      disableFlipByClick: false,
    });

    // Load pages from HTML elements
    pageFlip.loadFromHTML(pages);

    // Set up event listeners
    pageFlip.on("flip", (e) => {
      currentPage = e.data;
      updatePageInfo();
      updateNavigationButtons();
    });

    pageFlip.on("changeState", (e) => {
      console.log("Book state changed:", e.data);
    });

    pageFlip.on("init", (e) => {
      console.log("Book initialized:", e.data);
      currentPage = e.data.page;
      updatePageInfo();
      updateNavigationButtons();
    });

    // Initial state
    currentPage = 0;
    updatePageInfo();
    updateNavigationButtons();
  } catch (error) {
    console.error("Error creating PageFlip:", error);
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Error creating book flip. Please try refreshing the page.</p>
            </div>
        `;
  }
}

// Navigate to page
function navigateToPage(direction) {
  if (!pageFlip) return;

  if (direction === "prev") {
    pageFlip.flipPrev();
  } else if (direction === "next") {
    pageFlip.flipNext();
  }
}

// Update page info display
function updatePageInfo() {
  if (!pageFlip || uploadedPhotos.length === 0) {
    pageInfo.textContent = "";
    return;
  }

  const totalPages = pageFlip.getPageCount();
  const currentPageNum = currentPage + 1;
  pageInfo.textContent = `Page ${currentPageNum} of ${totalPages}`;
}

// Update navigation buttons
function updateNavigationButtons() {
  if (!pageFlip || uploadedPhotos.length === 0) {
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  }

  const totalPages = pageFlip.getPageCount();
  prevPageBtn.disabled = currentPage <= 0;
  nextPageBtn.disabled = currentPage >= totalPages - 1;
}

// Utility functions
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Handle window resize
window.addEventListener("resize", () => {
  if (pageFlip) {
    // Refresh book flip on resize
    setTimeout(() => {
      updateBookFlip();
    }, 100);
  }
});

// Handle drag and drop (bonus feature)
function initializeDragAndDrop() {
  const uploadSection = document.querySelector(".upload-section");

  uploadSection.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadSection.classList.add("drag-over");
  });

  uploadSection.addEventListener("dragleave", (e) => {
    e.preventDefault();
    uploadSection.classList.remove("drag-over");
  });

  uploadSection.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadSection.classList.remove("drag-over");

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        processImageFile(file);
      }
    });
  });
}

// Settings Panel Functions
function openSettings() {
  settingsPanel.classList.add("active");
  updateSettingsUI();
}

function closeSettings() {
  settingsPanel.classList.remove("active");
}

function updateSettingsUI() {
  document.getElementById("darkModeToggle").checked = settings.darkMode;
  document.getElementById("glassToggle").checked = settings.glassEffect;
  document.getElementById("animationsToggle").checked = settings.animations;
  document.getElementById("flipSpeed").value = settings.flipSpeed;
  document.getElementById("shadowToggle").checked = settings.showShadows;
  document.getElementById("autoSizeToggle").checked = settings.autoSize;

  // Update slider value display
  document.querySelector(".setting-value").textContent = settings.flipSpeed + "ms";
}

function openPhotoUpload() {
  uploadSection.style.display = "block";
  previewSection.style.display = "block";
  photoInput.click();
  closeSettings();
}

function clearAllFromSettings() {
  clearAllPhotos();
  closeSettings();
}

// Theme Functions
function toggleTheme() {
  settings.darkMode = !settings.darkMode;
  updateUIFromSettings();
}

function toggleDarkMode() {
  settings.darkMode = !settings.darkMode;
  updateUIFromSettings();
}

function toggleGlassEffect() {
  settings.glassEffect = !settings.glassEffect;
  updateUIFromSettings();
}

function toggleAnimations() {
  settings.animations = !settings.animations;
  updateUIFromSettings();
}

function updateFlipSpeed(e) {
  settings.flipSpeed = parseInt(e.target.value);
  document.querySelector(".setting-value").textContent = settings.flipSpeed + "ms";
  updateBookFlip(); // Recreate book with new settings
}

function toggleShadows() {
  settings.showShadows = !settings.showShadows;
  updateBookFlip(); // Recreate book with new settings
}

function toggleAutoSize() {
  settings.autoSize = !settings.autoSize;
  updateBookFlip(); // Recreate book with new settings
}

function updateUIFromSettings() {
  // Apply dark mode
  document.body.classList.toggle("dark-mode", settings.darkMode);

  // Apply glass effect
  document.body.classList.toggle("no-glass", !settings.glassEffect);

  // Apply animations
  document.body.classList.toggle("no-animations", !settings.animations);
}

// Fullscreen Functions
function toggleFullscreen() {
  if (isFullscreen) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
}

function enterFullscreen() {
  isFullscreen = true;
  fullscreenOverlay.classList.add("active");

  // Destroy current book instance
  if (pageFlip) {
    pageFlip.destroy();
    pageFlip = null;
  }

  // Clear fullscreen book container
  const fullscreenBook = document.getElementById("fullscreenBook");
  fullscreenBook.innerHTML = "";

  // Create new book in fullscreen container
  createBookFlipInContainer(fullscreenBook);

  // Hide main controls
  document.querySelector(".book-controls").style.display = "none";
}

function exitFullscreen() {
  isFullscreen = false;
  fullscreenOverlay.classList.remove("active");

  // Destroy fullscreen book instance
  if (pageFlip) {
    pageFlip.destroy();
    pageFlip = null;
  }

  // Clear fullscreen book container
  const fullscreenBook = document.getElementById("fullscreenBook");
  fullscreenBook.innerHTML = "";

  // Recreate book in main container
  updateBookFlip();

  // Show main controls
  document.querySelector(".book-controls").style.display = "flex";
}

// Keyboard Controls
function handleKeyboardControls(e) {
  if (settingsPanel.classList.contains("active")) return;

  switch (e.key) {
    case "ArrowLeft":
      navigateToPage("prev");
      break;
    case "ArrowRight":
      navigateToPage("next");
      break;
    case "Escape":
      if (isFullscreen) exitFullscreen();
      if (settingsPanel.classList.contains("active")) closeSettings();
      break;
    case "f":
    case "F":
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        toggleFullscreen();
      }
      break;
    case "s":
    case "S":
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        openSettings();
      }
      break;
    case "t":
    case "T":
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        toggleTheme();
      }
      break;
  }
}

// Export/Import Functions
function exportConfiguration() {
  const config = {
    settings: settings,
    photos: uploadedPhotos.filter((photo) => !photo.isDemo),
  };

  const dataStr = JSON.stringify(config, null, 2);
  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = "photo-book-config.json";

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  showNotification("Configuration exported successfully!");
}

function resetToDefault() {
  if (confirm("Are you sure you want to reset all settings to default?")) {
    settings = {
      darkMode: false,
      glassEffect: true,
      animations: true,
      flipSpeed: 1000,
      showShadows: true,
      autoSize: true,
    };

    updateUIFromSettings();
    updateSettingsUI();
    updateBookFlip();

    showNotification("Settings reset to default!");
  }
}

// Notification System
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.9);
        color: #333;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10002;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.3);
        transform: translateX(300px);
        transition: all 0.3s ease;
    `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(300px)";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Initialize drag and drop when DOM is ready
document.addEventListener("DOMContentLoaded", initializeDragAndDrop);

// Error handling
window.addEventListener("error", (e) => {
  console.error("Global error:", e.error);
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});
