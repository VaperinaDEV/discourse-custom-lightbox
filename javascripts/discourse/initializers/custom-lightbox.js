import { iconHTML } from "discourse-common/lib/icon-library";

export default {
  name: "custom-lightbox",
  initialize() {
    $("body").on("click keyup", function(e) {

      // Custom Buttons
      const buttonsContainer = document.createElement('div');
      buttonsContainer.classList.add(
        "full-size-btn",
        "mfp-prevent-close"
      );
        
      let zoomInIcon = iconHTML(settings.zoom_in_icon, {
        class: "mfp-prevent-close" 
      });
      
      let zoomOutIcon = iconHTML(settings.zoom_out_icon, {
        class: "mfp-prevent-close"
      });
        
      // Make Plus Button
      const plusButton = document.createElement('button');
      plusButton.classList.add(
        "plus-btn",
        "mfp-prevent-close"
      );
      plusButton.title = I18n.t(themePrefix("zoom_in_button_title"));
      plusButton.innerHTML = zoomInIcon;
      buttonsContainer.append(plusButton);
        
      // Make Minus Button
      const minusButton = document.createElement('button');
      minusButton.classList.add(
        "minus-btn",
        "mfp-prevent-close"
      );
      minusButton.title = I18n.t(themePrefix("zoom_out_button_title"));
      minusButton.innerHTML = zoomOutIcon;
      buttonsContainer.append(minusButton);

      // Download button
      let downloadIcon = iconHTML(settings.download_icon, {
        class: "mfp-prevent-close"
      });
      const sourceLink = $(".mfp-container .image-source-link");
      const downloadLink = $('.mfp-title a.image-source-link[href*="short-url"]');
      const appendedLink = $('.mfp-container a.image-source-link[href*="short-url"]');

      // Prevent close lightbox by clicking download button 
      sourceLink.addClass("mfp-prevent-close");
      // Add title to download button
      sourceLink.title = I18n.t("lightbox.download");

      // Remove the last download button when change image in gallery
      if (
        appendedLink.length > 1 ||
        appendedLink.length > 1 &&
        e.keyCode == 37 ||
        appendedLink.length > 1 &&
        e.keyCode == 39
      ) {
        appendedLink.last().remove();
      }
        
      const mfpContainer = $(".mfp-container");
      // Move download button to mfp-container so it will always a fixed position
      mfpContainer.append(downloadLink);

      // Remove download text and only use icon
      sourceLink.html(downloadIcon);
        
      const mfpClose = $(".mfp-close");
      // Move close button to mfp-container so it will always a fixed position
      mfpContainer.append(mfpClose);

      const mfpWrap = $(".mfp-wrap");
      // Add zoom button function
      if ($(".full-size-btn").length <= 0){
        mfpContainer.append(buttonsContainer);
        $(".full-size-btn").click(function() {
          mfpWrap.toggleClass("mfp-full-size-scrollbars");
        });
      }
        
      const mfpImg = $(".mfp-img");
      // Prevent image click zoom in desktop. Only can zoom with the zoom button.
      $(document).on("click", ".mfp-img", function() {
        mfpImg.css("max-height", $(window).height());
      });
                
      const mfpImgAndArrow = $(".mfp-img, .mfp-arrow");       
      // If the image zoomed in, than click the image or the arrows will zoom out.
      mfpImgAndArrow.click(function() {
        if (mfpWrap.hasClass("mfp-full-size-scrollbars")) {
          mfpWrap.removeClass("mfp-full-size-scrollbars");
        }
      });
    });
  }
};
