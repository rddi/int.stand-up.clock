let emotesContainer;

const Emotes = {
  emoteOptions: {
    'like': {
      'tag': 'thumbs-up',
      'colour': 'green'
    }
  },
  setUpEmotes: function() {
    emotesContainer = document.getElementById('emotes-container');
  },
  spawnEmote: function(symbol, member, colour = '') {
    const position = (window.innerWidth - 60) * Math.random();
    const emoteDiv = document.createElement('div');

    console.log(position);

    emoteDiv.classList.add('emote', colour);
    emoteDiv.setAttribute('data-member', member);
    // emoteDiv.setAttribute('style', `left: ${position}px;`);
    emoteDiv.style.cssText = `left: ${position}px;`;
    emoteDiv.innerHTML = `<i class="fa fa-${symbol}"></i>`;

    emotesContainer.appendChild(emoteDiv);
  }
}