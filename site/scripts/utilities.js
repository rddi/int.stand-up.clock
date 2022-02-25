const Utilities = {
  sanitise: function(input) {
    console.log("SANITISING!",input)
    return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  },
  resizeTextToFit: function (element, maxWidth, minFontSize) {
    // clear all previously applied modifications:
    element.style.width = '';
    element.style.textOverflow = '';
    element.style.overflow = '';
    element.style.fontSize = '';

    // Ensure we are dealing with the actual size
    element.style.display = 'inline';

    const startFontSize = parseInt(window.getComputedStyle(element, null).getPropertyValue('font-size'),10)
    let currentFontSize = startFontSize;
    const startWidth = element.offsetWidth;
    
    while(element.offsetWidth > maxWidth) {
      if (currentFontSize === minFontSize) {
        element.style.width = maxWidth;
        element.style.textOverflow = 'ellipsis';
        element.style.overflow = 'hidden';
        break;
      }
      currentFontSize = parseInt(window.getComputedStyle(element, null).getPropertyValue('font-size'),10);
      element.style.fontSize = currentFontSize - 1;

      if (element.offsetWidth === startWidth) {
        element.style.fontSize = '';
        break;
      }
    }

    // Reset the display so we don't mess up the layout
    element.style.display = '';
  }
};

