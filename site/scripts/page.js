let flash,
  flashHolder;

const Page = {
  setUpFlash: function() {
    flashHolder = document.createElement('div');
    flashHolder.id = 'flash-message-holder';

    document.body.appendChild(flashHolder);

    flash = document.createElement('div');
    flash.classList.add('flash-message', 'hidden');
    flash.innerHTML = `<span id="icon-success" class="fa fa-check"></span>
      <span id="icon-notice" class="fa fa-exclamation-triangle"></span>
      <span id="icon-error" class="fa fa-times"></span>`;

    document.addEventListener('click', function(e) {
      if(!e.target.classList.contains('flash-message-close')) {
        return;
      }

    });
  },

  flashMessage: function(message, type = 'notice') {
    let newFlash = flash.cloneNode(true);
    
    newFlash.classList.add(type);

    newFlash.setAttribute('message', message);

    flashHolder.appendChild(newFlash);

    setTimeout(function(e) {
      newFlash.classList.remove('hidden');
      setTimeout(function(e) {
        newFlash.classList.add('hidden');
        setTimeout(function(e) {
          flashHolder.removeChild(newFlash);
        },500);
      }, 3000);
    },200);
  }
}