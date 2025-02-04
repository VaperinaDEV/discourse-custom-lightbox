import { apiInitializer } from "discourse/lib/api";
import { iconHTML } from "discourse-common/lib/icon-library";

export default apiInitializer("1.8.0", (api) => { 
  const capabilities = api.container.lookup("service:capabilities");

  // Create a MutationObserver to monitor changes to the body's class list.
  const observer = new MutationObserver(handleBodyClassChanges);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });

  // Variables for touch handling (swipe gestures)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let touchStartTime = 0;
  let touchCount = 0;
  const minSwipeDistance = 50;  // Minimum distance required for a swipe gesture
  const maxSwipeTime = 300;     // Maximum allowed time (ms) for a swipe gesture

  // Variable to store the original theme color (for restoring when the lightbox is closed)
  let originalThemeColor;

  // This function monitors changes in the body class list to detect when the lightbox opens/closes.
  function handleBodyClassChanges(mutations) {
    mutations.forEach((mutation) => {
      // When the lightbox opens, the body gets the "mfp-zoom-out-cur" class.
      if (mutation.target.classList.contains("mfp-zoom-out-cur")) {
        setupLightbox();
      } else if (!mutation.target.classList.contains("mfp-zoom-out-cur")) {
        // When the lightbox closes, restore the original theme color
        // and remove the keydown event listener.
        restoreThemeColor();
        document.removeEventListener("keydown", handleKeyPress);
      }
    });
  }

  // Determine if swipe handling should proceed (only when not zoomed and a single touch is detected)
  function shouldHandleSwipe() {
    const mfpWrap = document.querySelector(".mfp-wrap");
    const isZoomed = mfpWrap?.classList.contains("mfp-force-scrollbars");
    return !isZoomed && touchCount === 1;
  }

  // Touch start handler for swipe gestures
  function handleTouchStart(event) {
    touchCount = event.touches.length;
    if (!shouldHandleSwipe()) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchStartTime = Date.now();
  }

  // Touch end handler for swipe gestures
  function handleTouchEnd(event) {
    if (!shouldHandleSwipe()) return;
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    // If the swipe was fast enough, handle the swipe gesture.
    if (touchEndTime - touchStartTime < maxSwipeTime) {
      handleSwipe();
    }
    touchCount = 0;
  }

  // Touch cancel handler (resets the touch counter)
  function handleTouchCancel() {
    touchCount = 0;
  }

  // Process swipe gestures: horizontal swipes change images and vertical swipe (down) closes the lightbox.
  function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Handle horizontal swipe for image navigation.
    if (absX > absY && absX > minSwipeDistance) {
      if (deltaX > 0) {
        document.querySelector(".mfp-arrow-left")?.click();
      } else {
        document.querySelector(".mfp-arrow-right")?.click();
      }
    }
    // Handle vertical swipe (down) to close the lightbox.
    else if (absY > absX && absY > minSwipeDistance) {
      if (deltaY > 0) {
        document.querySelector(".mfp-close")?.click();
      }
    }
  }

  // Check for native fullscreen support.
  function supportsNativeFullscreen() {
    const elem = document.documentElement;
    return (
      elem.requestFullscreen ||
      elem.webkitRequestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.msRequestFullscreen
    );
  }

  // Request fullscreen with vendor prefix support.
  function requestFullscreenWithFallback(element) {
    if (element.requestFullscreen) return element.requestFullscreen();
    else if (element.webkitRequestFullscreen) return element.webkitRequestFullscreen();
    else if (element.mozRequestFullScreen) return element.mozRequestFullScreen();
    else if (element.msRequestFullscreen) return element.msRequestFullscreen();
  }

  // Exit fullscreen mode with vendor prefix support.
  function exitFullscreenWithFallback() {
    if (document.exitFullscreen) return document.exitFullscreen();
    else if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
    else if (document.msExitFullscreen) return document.msExitFullscreen();
  }

  // Update the fullscreen button icon based on whether fullscreen mode is active.
  function updateFullscreenButtonIcon(isFullscreen) {
    const fullscreenButton = document.querySelector(".fullscreen-lightbox-btn");
    if (fullscreenButton) {
      fullscreenButton.innerHTML = iconHTML(
        isFullscreen ? "discourse-compress" : "discourse-expand",
        { class: "mfp-prevent-close" }
      );
    }
  }

  // Toggle fullscreen mode for the lightbox container.
  function toggleFullscreen() {
    const lightboxContainer = document.querySelector(".mfp-container");
    if (!supportsNativeFullscreen()) {
      console.log("Fullscreen API is not supported on this device");
      return;
    }
    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement &&
      !document.msFullscreenElement
    ) {
      requestFullscreenWithFallback(lightboxContainer).catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      exitFullscreenWithFallback();
    }
  }

  // Handle keypress events ('F' to toggle fullscreen)
  function handleKeyPress(e) {
    if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      toggleFullscreen();
    }
  }

  // Toggle zoom on the image (mobile).
  function toggleZoom() {
    const mfpWrap = document.querySelector(".mfp-wrap");
    const mfpImg = document.querySelector(".mfp-img");
    if (mfpWrap && mfpImg) {
      const isZoomed = mfpWrap.classList.contains("mfp-force-scrollbars");
      if (isZoomed) {
        mfpWrap.classList.remove("mfp-force-scrollbars");
        mfpImg.style.maxHeight = `${window.innerHeight}px`;
        mfpImg.style.cursor = "zoom-in";
      } else {
        mfpWrap.classList.add("mfp-force-scrollbars");
        mfpImg.style.maxHeight = "none";
        mfpImg.style.cursor = "zoom-out";
      }
    }
  }

  // Setup the lightbox when it opens.
  function setupLightbox() {
    // Change the theme color to black when the lightbox opens.
    const siteThemeColor = document.querySelector('meta[name="theme-color"]');
    if (siteThemeColor) {
      originalThemeColor = siteThemeColor.getAttribute("content");
      siteThemeColor.setAttribute("content", "#000000");
    }

    // Add keydown listener for fullscreen toggling.
    document.addEventListener("keydown", handleKeyPress);

    // Add fullscreen change listeners to update the fullscreen button icon.
    document.addEventListener("fullscreenchange", () => {
      updateFullscreenButtonIcon(!!document.fullscreenElement);
    });
    document.addEventListener("webkitfullscreenchange", () => {
      updateFullscreenButtonIcon(!!document.webkitFullscreenElement);
    });
    document.addEventListener("mozfullscreenchange", () => {
      updateFullscreenButtonIcon(!!document.mozFullScreenElement);
    });
    document.addEventListener("MSFullscreenChange", () => {
      updateFullscreenButtonIcon(!!document.msFullscreenElement);
    });

    // Add touch event listeners for swipe gestures on the lightbox container.
    const container = document.querySelector(".mfp-container");
    if (container) {
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
      container.addEventListener("touchcancel", handleTouchCancel, { passive: true });
    }

    // Zoom buttons and fullscreen controls
    const buttonsContainer = createButtonsContainer();
    const mfpWrap = document.querySelector(".mfp-wrap");
    const mfpContainer = document.querySelector(".mfp-container");

    function updateImageStyle(isZoomed) {
      const mfpImg = document.querySelector(".mfp-img");
      if (mfpImg) {
        mfpImg.style.maxHeight = isZoomed ? "none" : `${window.innerHeight}px`;
      }
    }

    function updateZoomButton() {
      const isZoomed = mfpWrap.classList.contains("mfp-force-scrollbars");
      buttonsContainer.innerHTML = ""; // Clear existing buttons
      if (isZoomed) {
        const minusButton = createMinusButton();
        buttonsContainer.appendChild(minusButton);
        minusButton.addEventListener("click", () => {
          mfpWrap.classList.remove("mfp-force-scrollbars");
          updateImageStyle(false);
          updateZoomButton();
        });
      } else {
        const plusButton = createPlusButton();
        buttonsContainer.appendChild(plusButton);
        plusButton.addEventListener("click", () => {
          mfpWrap.classList.add("mfp-force-scrollbars");
          updateImageStyle(true);
          updateZoomButton();
        });
      }
    }

    // Observe changes in the lightbox wrapper's class to update zoom buttons accordingly.
    const wrapObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isZoomed = mfpWrap.classList.contains("mfp-force-scrollbars");
          updateImageStyle(isZoomed);
          updateZoomButton();
        }
      });
    });
    wrapObserver.observe(mfpWrap, {
      attributes: true,
      attributeFilter: ["class"]
    });

    if (!document.querySelector(".full-size-btn")) {
      mfpContainer.append(buttonsContainer);
      const isZoomed = mfpWrap.classList.contains("mfp-force-scrollbars");
      updateImageStyle(isZoomed);
      updateZoomButton();
    }

    // Create top container for close and fullscreen buttons.
    const controlButtonsTopContainer = document.createElement("div");
    controlButtonsTopContainer.classList.add("lightbox-control-buttons-top");

    // Create title toggle container and button.
    const titleToggleContainer = document.createElement("div");
    titleToggleContainer.classList.add("title-toggle-container", "mfp-prevent-close");
    if (!document.querySelector(".title-toggle-btn")) {
      const titleToggleButton = createTitleToggleButton();
      titleToggleContainer.appendChild(titleToggleButton);
      mfpContainer.appendChild(titleToggleContainer);
    }

    // Append close and fullscreen buttons if they are not already present.
    if (!document.querySelector(".close-lightbox-btn")) {
      const closeButton = createCloseButton();
      const fullscreenButton = createFullscreenButton();
      controlButtonsTopContainer.append(fullscreenButton);
      controlButtonsTopContainer.append(closeButton);
      mfpContainer.append(controlButtonsTopContainer);
    }
  }

  // Restore the original theme color when the lightbox is closed.
  function restoreThemeColor() {
    const siteThemeColor = document.querySelector('meta[name="theme-color"]');
    if (siteThemeColor && originalThemeColor) {
      siteThemeColor.setAttribute("content", originalThemeColor);
    }
  }

  // Functions to create buttons

  function createButtonsContainer() {
    const container = document.createElement("div");
    container.classList.add("full-size-btn", "mfp-prevent-close");
    return container;
  }

  function createPlusButton() {
    const button = document.createElement("button");
    button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "plus-btn", "mfp-prevent-close");
    button.title = I18n.t(themePrefix("zoom_in_button_title"));
    button.innerHTML = iconHTML("magnifying-glass-plus", { class: "mfp-prevent-close" });
    return button;
  }

  function createMinusButton() {
    const button = document.createElement("button");
    button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "minus-btn", "mfp-prevent-close");
    button.title = I18n.t(themePrefix("zoom_out_button_title"));
    button.innerHTML = iconHTML("magnifying-glass-minus", { class: "mfp-prevent-close" });
    return button;
  }

  function createCloseButton() {
    const button = document.createElement("button");
    button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "close-lightbox-btn");
    button.title = I18n.t(themePrefix("close_button_title"));
    button.innerHTML = iconHTML("xmark");
    return button;
  }

  function createFullscreenButton() {
    const button = document.createElement("button");
    button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "fullscreen-lightbox-btn", "mfp-prevent-close");
    button.title = I18n.t(themePrefix("fullscreen_button_title"));
    button.innerHTML = iconHTML("discourse-expand", { class: "mfp-prevent-close" });
    button.addEventListener("click", () => {
      toggleFullscreen();
    });
    return button;
  }

  function createTitleToggleButton() {
    const button = document.createElement("button");
    button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "title-toggle-btn", "mfp-prevent-close");
    button.title = I18n.t(themePrefix("toggle_title_button_title"));
    button.innerHTML = iconHTML("circle-info", { class: "mfp-prevent-close" });
    let isTitleVisible = true;
    button.addEventListener("click", () => {
      const title = document.querySelector(".mfp-title");
      if (title) {
        isTitleVisible = !isTitleVisible;
        title.style.visibility = isTitleVisible ? "hidden" : "visible";
      }
    });
    return button;
  }

  // Override the image click behavior on mobile
  if (capabilities.touch) {
    document.addEventListener(
      "click",
      function (e) {
        if (e.target.matches(".mfp-img")) {
          e.stopPropagation();
          e.preventDefault();
          toggleZoom();
        }
      },
      true
    );
  }
});
