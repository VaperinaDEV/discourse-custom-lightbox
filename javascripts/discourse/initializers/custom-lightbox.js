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

    // Variable to store the original theme color
    let originalThemeColor;

    // Function to handle class changes in the body element
    function handleBodyClassChanges(mutations) {
      mutations.forEach((mutation) => {
        if (mutation.target.classList.contains("mfp-zoom-out-cur")) {
          setupLightbox();
        } else if (!mutation.target.classList.contains("mfp-zoom-out-cur")) {
          restoreThemeColor();
        }
      });
    }

    // Function to set up the custom lightbox
    function setupLightbox() {
      // Change theme color to black
      const siteThemeColor = document.querySelector('meta[name="theme-color"]');
      if (siteThemeColor) {
        originalThemeColor = siteThemeColor.getAttribute("content");
        siteThemeColor.setAttribute("content", "#000000");
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

      // Append close button if not already present
      if (!document.querySelector(".close-lightbox-btn")) {
        const closeButton = createCloseButton();
        mfpContainer.append(closeButton);
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
      button.classList.add("plus-btn", "mfp-prevent-close");
      button.title = I18n.t(themePrefix("zoom_in_button_title"));
      button.innerHTML = iconHTML(settings.zoom_in_icon, {
        class: "mfp-prevent-close"
      });
      return button;
    }

    // Function to create the zoom-out button
    function createMinusButton() {
      const button = document.createElement("button");
      button.classList.add("minus-btn", "mfp-prevent-close");
      button.title = I18n.t(themePrefix("zoom_out_button_title"));
      button.innerHTML = iconHTML(settings.zoom_out_icon, {
        class: "mfp-prevent-close"
      });
      return button;
    }

    // Function to create the close button
    function createCloseButton() {
      const button = document.createElement("button");
      button.classList.add("close-lightbox-btn");
      button.title = I18n.t(themePrefix("close_button_title"));
      button.innerHTML = iconHTML(settings.close_icon);
      return button;
    }
  }
};
