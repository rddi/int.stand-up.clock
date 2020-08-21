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

    // document.addEventListener('click', function(e) {
    //   if(!e.target.classList.contains('flash-message-close')) {
    //     return;
    //   }

    // });
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
  },

  getQueryParams: function() {
    let url = window.location.href.split('?');

    if(url.length == 1) {
      return {};
    }

    let paramArray = url[1].split('&');

    let paramObject = {};

    for(i = 0;i < paramArray.length;i += 1) {
      let temp = paramArray[i].split('=');
      paramObject[temp[0]] = temp[1];
    }

    return paramObject;
  },

  generateCode: function(length, capsOnly = false) {
    let output = '',
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    i;

    if (!capsOnly) {
      characters = characters + 'abcdefghijklmnopqrstuvwxyz';
    }
  
    for(i = 0;i < length;i += 1) {
      output = output + (characters.charAt(Math.floor(Math.random() * characters.length)))
    }
  
    return output;
  }
}