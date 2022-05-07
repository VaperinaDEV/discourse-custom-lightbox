import { iconHTML } from "discourse-common/lib/icon-library";

export default {
  name: "custom-lightbox",
  initialize() {
    $("body").on("click", function() {
      
      // Create zoom buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.classList.add(
        "full-size-btn",
        "mfp-prevent-close"
      );
      
      // Create icons 
      let zoomInIcon = iconHTML(settings.zoom_in_icon, {
        class: "mfp-prevent-close"
      });
      
      let zoomOutIcon = iconHTML(settings.zoom_out_icon, {
        class: "mfp-prevent-close"
      });
      
      let closeIcon = iconHTML(settings.close_icon);
      
      // Create Plus Button
      const plusButton = document.createElement('button');
      plusButton.classList.add(
        "plus-btn",
        "mfp-prevent-close"
      );
      plusButton.title = I18n.t(themePrefix("zoom_in_button_title"));
      plusButton.innerHTML = zoomInIcon;
      buttonsContainer.append(plusButton);
        
      // Create Minus Button
      const minusButton = document.createElement('button');
      minusButton.classList.add(
        "minus-btn",
        "mfp-prevent-close"
      );
      minusButton.title = I18n.t(themePrefix("zoom_out_button_title"));
      minusButton.innerHTML = zoomOutIcon;
      buttonsContainer.append(minusButton);
      
      // Create Close Button
      const closeButton = document.createElement('button');
      closeButton.classList.add(
        "close-btn"
      );
      closeButton.title = I18n.t(themePrefix("close_button_title"));
      closeButton.innerHTML = closeIcon;

      // Add buttons function
      const mfpWrap = $(".mfp-wrap");
      const mfpContainer = $(".mfp-container");
      if ($(".full-size-btn").length <= 0){
        mfpContainer.append(buttonsContainer);
        $(".full-size-btn").click(function() {
          mfpWrap.toggleClass("mfp-full-size-scrollbars");
        });
      }
      if ($(".close-btn").length <= 0) {
        mfpContainer.append(closeButton);
      }      
      
      // Prevent image click zoom in desktop. Only can zoom with the zoom button.
      const mfpImg = $(".mfp-img");
      $(document).on("click", ".mfp-img", function() {
        mfpImg.css("max-height", $(window).height());
      });
      
      // If the image zoomed in, than click the image or the arrows will zoom out.
      const mfpImgAndArrow = $(".mfp-img, .mfp-arrow");
      mfpImgAndArrow.click(function() {
        if (mfpWrap.hasClass("mfp-full-size-scrollbars")) {
          mfpWrap.removeClass("mfp-full-size-scrollbars");
        }
      });
    });
  }
};
