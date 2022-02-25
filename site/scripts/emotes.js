let emotesContainer;
const emoteTime = 4000;

const Emotes = {
  emoteOptions: {
    'like': {
      'tag': 'thumbs-up',
      'colour': 'green'
    },
    'dislike': {
      'tag': 'thumbs-down',
      'colour': 'red'
    },
    'laugh': {
      'tag': 'face-laugh',
      'colour': 'yellow'
    }
  },
  setUpEmotes: function() {
    emotesContainer = document.getElementById('emotes-container');
  },
  spawnEmote: function(symbol, member, colour = '') {
    const position = (window.innerWidth - 60) * Math.random();
    const emoteDiv = document.createElement('div');
    const identifier = Page.generateCode(10);

    console.log(position);

    emoteDiv.classList.add('emote', colour);
    emoteDiv.setAttribute('data-member', member);
    emoteDiv.setAttribute('id', `emote-${identifier}`)
    emoteDiv.style.cssText = `left: ${position}px;`;
    emoteDiv.style.animationDuration = `${emoteTime}ms`;
    emoteDiv.innerHTML = `<i class="fa fa-${symbol}"></i>`;

    emotesContainer.appendChild(emoteDiv);

    setTimeout(function() {
      const emote = document.getElementById(`emote-${identifier}`);
      emote.remove();
    }, emoteTime)
  }
}