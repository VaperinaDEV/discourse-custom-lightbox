import { iconHTML } from "discourse-common/lib/icon-library";

export default {
  name: "custom-lightbox",
  
  initialize() {
    // Create MutationObserver to watch for class changes in the body element
    const observer = new MutationObserver(handleBodyClassChanges);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });

    // Variables for touch handling
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let touchStartTime = 0;
    let touchCount = 0;
    const minSwipeDistance = 50; // minimum distance for swipe detection
    const maxSwipeTime = 300; // maximum time for swipe detection (ms)

    // Variable to store the original theme color
    let originalThemeColor;

    // Function to handle class changes in the body element
    function handleBodyClassChanges(mutations) {
      mutations.forEach((mutation) => {
        if (mutation.target.classList.contains("mfp-zoom-out-cur")) {
          setupLightbox();
        } else if (!mutation.target.classList.contains("mfp-zoom-out-cur")) {
          restoreThemeColor();
          // Remove keyboard event listener when lightbox is closed
          document.removeEventListener("keydown", handleKeyPress);
        }
      });
    }

    // Function to check if swipe gestures should be handled
    function shouldHandleSwipe() {
      const mfpWrap = document.querySelector(".mfp-wrap");
      const isZoomed = mfpWrap?.classList.contains("mfp-force-scrollbars");
      return !isZoomed && touchCount === 1;
    }

    // Function to handle touch start
    function handleTouchStart(event) {
      touchCount = event.touches.length;
      if (!shouldHandleSwipe()) {
        return;
      }

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchStartTime = Date.now();
    }

    // Function to handle touch end
    function handleTouchEnd(event) {
      if (!shouldHandleSwipe()) {
        return;
      }

      touchEndX = event.changedTouches[0].clientX;
      touchEndY = event.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      // Only handle swipe if it was done quickly enough
      if (touchEndTime - touchStartTime < maxSwipeTime) {
        handleSwipe();
      }

      touchCount = 0;
    }

    // Function to handle touch cancel
    function handleTouchCancel() {
      touchCount = 0;
    }

    // Function to handle swipe gestures
    function handleSwipe() {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Check if the swipe was primarily horizontal or vertical
      if (absX > absY && absX > minSwipeDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          // Swipe right - previous image
          document.querySelector(".mfp-arrow-left")?.click();
        } else {
          // Swipe left - next image
          document.querySelector(".mfp-arrow-right")?.click();
        }
      } else if (absY > absX && absY > minSwipeDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          // Swipe down - close lightbox
          document.querySelector(".mfp-close")?.click();
        }
      }
    }

    // Function to check if device supports native fullscreen
    function supportsNativeFullscreen() {
      const elem = document.documentElement;
      return (
        elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.mozRequestFullScreen ||
        elem.msRequestFullscreen
      );
    }

    // Function to request fullscreen with vendor prefix support
    function requestFullscreenWithFallback(element) {
      if (element.requestFullscreen) {
        return element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        return element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        return element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        return element.msRequestFullscreen();
      }
    }

    // Function to exit fullscreen with vendor prefix support
    function exitFullscreenWithFallback() {
      if (document.exitFullscreen) {
        return document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        return document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        return document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        return document.msExitFullscreen();
      }
    }

    // Function to update fullscreen button icon
    function updateFullscreenButtonIcon(isFullscreen) {
      const fullscreenButton = document.querySelector(".fullscreen-lightbox-btn");
      if (fullscreenButton) {
        fullscreenButton.innerHTML = iconHTML(
          isFullscreen ? "discourse-compress" : "discourse-expand",
          { class: "mfp-prevent-close" }
        );
      }
    }

    // Function to handle fullscreen toggle
    function toggleFullscreen() {
      const lightboxContainer = document.querySelector(".mfp-container");
      
      if (!supportsNativeFullscreen()) {
        console.log("Fullscreen API is not supported on this device");
        return;
      }

      if (!document.fullscreenElement && 
          !document.webkitFullscreenElement && 
          !document.mozFullScreenElement && 
          !document.msFullscreenElement) {
        requestFullscreenWithFallback(lightboxContainer).catch(err => {
          console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        exitFullscreenWithFallback();
      }
    }

    // Function to handle keyboard shortcuts
    function handleKeyPress(e) {
      // Toggle fullscreen on 'F' key press
      if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleFullscreen();
      }
    }

    // Function to set up the custom lightbox
    function setupLightbox() {
      // Change theme color to black
      const siteThemeColor = document.querySelector('meta[name="theme-color"]');
      if (siteThemeColor) {
        originalThemeColor = siteThemeColor.getAttribute("content");
        siteThemeColor.setAttribute("content", "#000000");
      }

      // Add keyboard event listener
      document.addEventListener("keydown", handleKeyPress);

      // Add fullscreen change listener with vendor prefix support
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

      // Add touch event listeners for swipe gestures
      const container = document.querySelector(".mfp-container");
      if (container) {
        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchend", handleTouchEnd, { passive: true });
        container.addEventListener("touchcancel", handleTouchCancel, { passive: true });
      }

      // Create a container for the zoom buttons
      const buttonsContainer = createButtonsContainer();
      const mfpWrap = document.querySelector(".mfp-wrap");
      const mfpContainer = document.querySelector(".mfp-container");

      // Function to update the image style based on zoom state
      function updateImageStyle(isZoomed) {
        const mfpImg = document.querySelector(".mfp-img");
        if (mfpImg) {  // Ensure the element exists
          if (isZoomed) {
            mfpImg.style.maxHeight = "none";
          } else {
            mfpImg.style.maxHeight = `${window.innerHeight}px`;
          }
        }
      }

      // Function to update the zoom buttons based on zoom state
      function updateZoomButton() {
        const isZoomed = mfpWrap.classList.contains("mfp-force-scrollbars");
        buttonsContainer.innerHTML = "";  // Clear existing buttons
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

      // Create a new MutationObserver for the mfp-wrap element
      const wrapObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            const isZoomed = mfpWrap.classList.contains("mfp-force-scrollbars");
            updateImageStyle(isZoomed);
            updateZoomButton();
          }
        });
      });

      // Start observing the mfp-wrap for class changes
      wrapObserver.observe(mfpWrap, {
        attributes: true,
        attributeFilter: ["class"]
      });

      // Append buttons container and set initial state if not already present
      if (!document.querySelector(".full-size-btn")) {
        mfpContainer.append(buttonsContainer);
        const isZoomed = mfpWrap.classList.contains("mfp-force-scrollbars");
        updateImageStyle(isZoomed);
        updateZoomButton();
      }

      // Create buttons top container for close and fullscreen buttons
      const controlButtonsTopContainer = document.createElement("div");
      controlButtonsTopContainer.classList.add("lightbox-control-buttons-top");

      // Create title toggle button container
      const titleToggleContainer = document.createElement("div");
      titleToggleContainer.classList.add("title-toggle-container", "mfp-prevent-close");

      // Add title toggle button if not already present
      if (!document.querySelector(".title-toggle-btn")) {
        const titleToggleButton = createTitleToggleButton();
        titleToggleContainer.appendChild(titleToggleButton);
        mfpContainer.appendChild(titleToggleContainer);
      }

      // Append close and fullscreen buttons if not already present
      if (!document.querySelector(".close-lightbox-btn")) {
        const closeButton = createCloseButton();
        const fullscreenButton = createFullscreenButton();
        controlButtonsTopContainer.append(fullscreenButton);
        controlButtonsTopContainer.append(closeButton);
        mfpContainer.append(controlButtonsTopContainer);
      }
    }

    // Function to restore the original theme color
    function restoreThemeColor() {
      const siteThemeColor = document.querySelector('meta[name="theme-color"]');
      if (siteThemeColor && originalThemeColor) {
        siteThemeColor.setAttribute("content", originalThemeColor);
      }
    }

    // Function to create the container for the zoom buttons
    function createButtonsContainer() {
      const container = document.createElement("div");
      container.classList.add("full-size-btn", "mfp-prevent-close");
      return container;
    }

    // Function to create the zoom-in button
    function createPlusButton() {
      const button = document.createElement("button");
      button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "plus-btn", "mfp-prevent-close");
      button.title = I18n.t(themePrefix("zoom_in_button_title"));
      button.innerHTML = iconHTML("magnifying-glass-plus", {
        class: "mfp-prevent-close"
      });
      return button;
    }

    // Function to create the zoom-out button
    function createMinusButton() {
      const button = document.createElement("button");
      button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "minus-btn", "mfp-prevent-close");
      button.title = I18n.t(themePrefix("zoom_out_button_title"));
      button.innerHTML = iconHTML("magnifying-glass-minus", {
        class: "mfp-prevent-close"
      });
      return button;
    }

    // Function to create the close button
    function createCloseButton() {
      const button = document.createElement("button");
      button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "close-lightbox-btn");
      button.title = I18n.t(themePrefix("close_button_title"));
      button.innerHTML = iconHTML("xmark");
      return button;
    }

    // Function to create the fullscreen button
    function createFullscreenButton() {
      const button = document.createElement("button");
      button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "fullscreen-lightbox-btn", "mfp-prevent-close");
      button.title = I18n.t(themePrefix("fullscreen_button_title"));
      button.innerHTML = iconHTML("discourse-expand", {
        class: "mfp-prevent-close"
      });
      
      button.addEventListener("click", () => {
        toggleFullscreen();
      });
      
      return button;
    }

    // Function to create the title toggle button
    function createTitleToggleButton() {
      const button = document.createElement("button");
      button.classList.add("btn", "btn-icon", "no-text", "btn-transparent", "title-toggle-btn", "mfp-prevent-close");
      button.title = I18n.t(themePrefix("toggle_title_button_title"));
      button.innerHTML = iconHTML("circle-info", {
        class: "mfp-prevent-close"
      });
      
      let isTitleVisible = true;
      const titleElement = document.querySelector(".mfp-title");
      
      button.addEventListener("click", () => {
        const title = document.querySelector(".mfp-title");
        if (title) {
          isTitleVisible = !isTitleVisible;
          title.style.visibility = isTitleVisible ? "hidden" : "visible";
        }
      });
      
      return button;
    }
  }
};
