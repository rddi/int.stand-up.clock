let version = '1.12',
  meetingCodeInput,
  clientNameInput,
  joinModal,
  joinTitle,
  joinButton,
  currentSpeaker,
  mainDisplay,
  teamDisplay,
  buttonHolder,
  playButton,
  pauseButton,
  skipButton,
  stopButton,
  meetingSearch,
  wordChoiceButtonHolder,
  wordChoiceElement,
  emotesButtonContainer,
  noticeContainer,
  noticeContent
  memberList = {},
  searchTimeout = 10000
  lastEmote = 0,
  emoteThrottle = 5000;

  let emotesHolder;

function setUpForm() {
  joinModal = document.getElementById('join-modal');
  joinTitle = document.getElementById('join-title');
  meetingCodeInput = document.getElementById('meeting-code-input');
  clientNameInput = document.getElementById('client-name-input');
  joinButton = document.getElementById('join-button');

  wordChoiceElement = document.getElementById('word-choice');
  wordChoiceButtonHolder = document.getElementById('word-choice-button-holder');
  

  let queryParams = Page.getQueryParams();

  let memory = Memory.getObject('standup_client_settings');

  if (queryParams.hasOwnProperty('meeting')) {
    let code = queryParams.meeting.toUpperCase();
    meetingCodeInput.value = code;
    meetingCodeInput.parentElement.classList.add('hidden');
    joinTitle.innerHTML = `Join Meeting "${code}"`;
  } else if (memory != null && memory.hasOwnProperty('meetingCode')) {
    meetingCodeInput.value = memory.meetingCode;
    meetingCodeInput.addEventListener('paste', function(event) {
      const paste = (event.clipboardData || window.clipboardData).getData('text');

      if (paste.includes('meeting=')) {
        meetingCodeInput.value = paste.split('meeting=').pop();
      }
    });
  }

  if (memory != null && memory.hasOwnProperty('clientName')) {
    clientNameInput.value = memory.clientName;
  }

  clientNameInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.split(' ').join('');
  });

  joinButton.addEventListener('click', function(e) {
    let ready = true;
    if (['', null].includes(meetingCodeInput.value)) {
      Page.flashMessage('Please enter a meeting code', 'error');
      ready = false;
    }

    if (['', null].includes(clientNameInput.value)) {
      Page.flashMessage('Please enter your name', 'error');
      ready = false;
    }

    if(!ready) {
      return;
    }
    Comms.params.meetingCode = meetingCodeInput.value.toUpperCase();
    Comms.params.clientName = Utilities.sanitise(clientNameInput.value);

    Memory.setObject('standup_client_settings', Comms.params);

    Comms.MQTTConnect(Comms.params.meetingCode);
    joinModal.classList.add('hidden');
    setMainDisplay("Connecting", 4, 'Connection Status');
    setTimeout(function(e) {
      mainDisplay.classList.remove("hidden");
    },1000);
  });
}

function setUpDisplay() {
  mainDisplay = document.getElementById('main-display');
  teamDisplay = document.getElementById('team-display');
  noticeContainer = document.getElementById('notice-container');
  noticeContent = document.getElementById('notice');
}

function setUpButtons() {
  buttonHolder = document.getElementById('button-holder');
  playButton = document.getElementById('resume-button');
  pauseButton = document.getElementById('pause-button');
  skipButton = document.getElementById('skip-button');
  stopButton = document.getElementById('stop-button');

  document.addEventListener('click', function(e) {
    if (!e.target.parentElement.classList.contains('control-button')) {
      return;
    }

    let control = e.target.parentElement.getAttribute("action");

    Comms.sendEvent(control,
      'Master.ControlAction');
  });
}

function handleReciept(input) {
  let message = input._getPayloadString();

  console.log(input, message, typeof message);

  try{
    message = JSON.parse(message);

    console.log(message, typeof message);

    let type = message.type.split('.');
    if (type[0] !== 'Client') {
      return;
    }
    
    
    switch (type[1]) {
      case 'Ping':
        handlePing(message.body);
        break;
      case 'Message':
        if (!Comms.params.registered) {
          return;
        }
        console.log(message.body);
        break;
      case 'UpdateSpeaker':
        if (!Comms.params.registered) {
          return;
        }
        handleUpdateSpeaker(message.body);
        // Page.flashMessage(`UpdateSpeaker received: ${message.body}`, 'notice');
        break;
      case 'PepTalker':
        if (!Comms.params.registered) {
          return;
        }
        handlePepTalk(message.body);
        break;
      case 'MemberList':
        if (!Comms.params.registered) {
          return;
        }
        // Page.flashMessage(`MemberList received: ${message.body}`, 'notice');
        handleMemberList(message.body);
        break;
      case 'Deregister':
        if (!Comms.params.registered) {
          return;
        }
        if (message.body.deregister != Comms.params.uniqueCode) {
          return;
          
        }
        
        Comms.disconnect();
        
        Comms.params.registered = false;
        clearEmoteButtons();
        setMainDisplay("Disconnected", 0, 'Connection Status');
        Page.flashMessage('You have been removed from the meeting', 'notice');

        break;
      case 'TimerFinish':
        if (!Comms.params.registered) {
          return;
        }

        setMainDisplay("Finished", 1, `Meeting: ${Comms.params.meetingCode}`);

        buttonHolder.classList.remove('active');

        buildMemberElements(true);

        teamDisplay.classList.remove('active');

          
      
        Page.flashMessage('The timer has ended', 'notice');

        break;
      case 'CheckResponse':
        handleCheckResponse(message.body);
        break;
      case 'RegisterResponse':
        handleRegisterResponse(message.body);
        break;
      case 'RegisterResponseLate':
        handleRegisterResponseLate(message.body);
        break;
      case 'Notify':
        notice(`${message.body}s remaining`, 'red');
        break;
      default:
        console.log(`Could not handle message type: "${message.type}"`);
    }
  }
  catch (err) {
    console.log('FAIL!', err);
  }
  
}

function isSpeaker() {
  if (currentSpeaker == Comms.params.clientName) {
    return true;
  }
  return false;
}

function notice(message, colour) {
  if (!isSpeaker()) {
    return;
  }
  noticeContainer.classList.remove('red', 'green');
  noticeContent.innerHTML = message;
  noticeContainer.classList.add(colour, 'show');
  setTimeout(function() {
    clearNotice();
  }, 100);
}

function clearNotice() {
  noticeContainer.classList.remove('show');
}

function sendEmote(emoteTag) {
  if ((new Date().getTime() - lastEmote) >= emoteThrottle) {
    Comms.sendEvent(emoteTag, 'Master.Emote');
    lastEmote = new Date().getTime()
  }
}

function setUpEmoteButtons(suppliedEmotes) { 
  if (!suppliedEmotes) {
    return;
  }
  emotesHolder = document.getElementById('emotes-button-holder');
  emotesButtonContainer = document.getElementById('emotes-button-container');
  let buttons = '',
    i = 0,
    options = Object.keys(suppliedEmotes);

    // console.log(suppliedEmotes);
    // console.log(options);

  for (i = 0;i<options.length;i+=1) {
    buttons += `<div id="emote-${options[i]}" class="emote-button"><i class="fa fa-${suppliedEmotes[options[i]].tag}"></i></div>`;
  }

  emotesButtonContainer.innerHTML = buttons;

  document.addEventListener('click', function(e) {
    if (!e.target.classList.contains('emote-button') || (new Date().getTime() - lastEmote) < emoteThrottle) {
      return;
    }

    let emoteTag = e.target.id.split('-')[1];
    sendEmote(emoteTag)

    emotesHolder.classList.add('bounce');
    setTimeout (function() {
      emotesHolder.classList.remove('bounce');
    }, emoteThrottle);
  });
}

function clearEmoteButtons() {
  emotesButtonContainer.innerHTML = '';
}

function setMainDisplay(content, state = null, newLabel = null) {



  let html = `<span>${content}</span>`;
  if (mainDisplay.innerHTML == html && mainDisplay.getAttribute('label') == newLabel) {
    return;
  }

  mainDisplay.classList.add('change');

  if (newLabel != null && mainDisplay.getAttribute('label') != newLabel) {
    mainDisplay.classList.add('change-label');
  }

  setTimeout(function() {

    mainDisplay.innerHTML = html;

    if (state != null) {
      let states = [
        'red',
        'blue',
        'orange',
        'green',
        'yellow',
      ];

      mainDisplay.classList.remove(...states);

      mainDisplay.classList.add(states[state]);
    }

    if (newLabel) {
      mainDisplay.setAttribute('label', newLabel);
    }

    mainDisplay.classList.remove('change')
    mainDisplay.classList.add('reset');

    setTimeout(function() {
      mainDisplay.classList.remove('reset');
      mainDisplay.classList.remove('change-label');
    }, 10);
  }, 500);
}

function handleCheckResponse(response) {
  if (response.target != Comms.params.clientName) {
    return;
  }
  if (response.status == 'exists') {

    clearTimeout(meetingSearch);

    setMainDisplay("Registering", 1, `Meeting: ${Comms.params.meetingCode}`)

    Comms.sendEvent(
      Comms.params.uniqueCode,
      'Master.Register'
    );
  } else if (response.status == 'failure') {
    setMainDisplay("No Meeting Found", 0, `Meeting: Not Found`);
    Page.flashMessage(`Could not find meeting "${Comms.params.meetingCode}"`, 'error');
  }
}

function handleRegisterResponse(response) {
  if (response.target != Comms.params.clientName) {
    return;
  }
  console.log("reg response", response)
  if (response.status == 'success') {
    setMainDisplay("Registered", 1);
    // requestMeetingStatus();
    Page.flashMessage(`Registered in meeting "${Comms.params.meetingCode}" as "${Comms.params.clientName}"`, 'success');
    Comms.params.registered = true;
  } else if (response.status == 'failure') {
    setMainDisplay("Unable to register", 0);
    Page.flashMessage(`Could not register in meeting "${Comms.params.meetingCode}" as "${Comms.params.clientName}": ${response.error}`, 'error');
  }
}

function handleRegisterResponseLate(response) {
  if (response.target != Comms.params.clientName) {
    return;
  }
  setMainDisplay("Meeting in Progress", 1);
    Page.flashMessage(`Registered as a late comer in meeting "${Comms.params.meetingCode}" as "${Comms.params.clientName}"`, 'success');
    Comms.params.registered = true;
}

function handleUpdateSpeaker(speaker) {
  currentSpeaker = speaker;

  teamDisplay.classList.remove('active');
  buttonHolder.classList.remove('active');
  emotesHolder.classList.add('active');

  if (currentSpeaker == 'READY') {
    setMainDisplay('Ready', 1);  
    return;
  }

  let state = 2;

  if (isSpeaker()) {
    state = 3;
    teamDisplay.classList.add('active');
    buttonHolder.classList.add('active');
    emotesHolder.classList.remove('active');
  }

  setMainDisplay(currentSpeaker, state, 'Current Speaker');
}

function handlePing(ping) {
  Comms.sendEvent(ping.client, 'Master.Pong', ping.body);
}

function handlePepTalk(pepTalker){
  console.log(pepTalker);
  let state = 2;
  let wordChoice = true;

  if (pepTalker.pepper == Comms.params.clientName) {
    state = 3;
    wordChoice = false;
  }

  if (pepTalker.words == null) {
    wordChoice = false;
  }

  setMainDisplay(currentSpeaker, state, 'Pep Talker');

  if (!wordChoice) {
    return;
  }

  setWordChoice(pepTalker.words);
}

function handleMemberList(_memberList) {
  console.log(_memberList);
  memberList = _memberList.members;

  buildButtons(_memberList.buttons);

  buildMemberElements();

  if (Object.prototype.hasOwnProperty.call(_memberList, 'emotes')) {
    setUpEmoteButtons(_memberList.emotes)
  }
}

function setWordChoice(list) {
  let i = 0;

  let wordButtons = [];

  for(i = 0;i < list.length;i += 1) {
    wordButtons.push(`<div class="word-button" data-word="${list[i]}">${list[i]}</div>`);
  }

  wordChoiceButtonHolder.innerHTML = wordButtons.join('');

  let wordButtonElements = document.getElementsByClassName('word-button');

  for(i = 0;i < wordButtonElements.length;i += 1) {
    wordButtonElements[i].addEventListener('click', function(e) {
      let vote = e.target.getAttribute('data-word');
      Comms.sendEvent(vote, 'Master.WordVote');
      wordChoiceElement.classList.add('hidden');
      Page.flashMessage(`You have voted for "${vote}"`, 'success');
    });
  }

  wordChoiceElement.classList.remove('hidden');
}

function buildButtons(buttons) {
  let i;
  let doneCount = 0;

  for(i = 0;i < memberList.length;i += 1) {
    if (memberList[i].done) {
      doneCount += 1;
    }
  }

  let showStop = (doneCount == memberList.length - 1);

  if (showStop && !buttons.play) {
    stopButton.classList.remove('hidden');
  } else {
    stopButton.classList.add('hidden');
  }

  if (buttons.skip && !showStop && !buttons.play) {
    skipButton.classList.remove('hidden');
  } else {
    skipButton.classList.add('hidden');
  }

  if (buttons.pause) {
    pauseButton.classList.remove('hidden');
  } else {
    pauseButton.classList.add('hidden');
  }

  if (buttons.play) {
    playButton.classList.remove('hidden');
  } else {
    playButton.classList.add('hidden');
  }

}

function buildMemberElements(forceDone = false) {
  let elements = [];
  let i;

  for(i = 0;i < memberList.length;i += 1) {
    let classes = [];

    if (memberList[i].done || forceDone) {
      classes.push('done');
    }
    if (memberList[i].active) {
      classes.push('active');
    }
 
    if (memberList[i].name == Comms.params.clientName) {
      continue;
    }

    elements.push(`<div class="team-button ${classes.join(' ')}" data-name="${memberList[i].name}">${memberList[i].name}</div>`);
  }

  teamDisplay.innerHTML = elements.join('');
}

function setUpTeamInteractions() {
  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('team-button') || currentSpeaker != Comms.params.clientName || e.target.classList.contains('done') || e.target.classList.contains('active')) {
      return;
    }

    Comms.sendEvent(e.target.getAttribute('data-name'), 'Master.Nomination');
  });
}

function connectHandler() {
  setMainDisplay("Looking for meeting", 1, `Meeting: ${Comms.params.meetingCode}`)

  Comms.sendEvent(
    Comms.params.uniqueCode,
    'Master.Check'
  );

  meetingSearch = setTimeout(function() {
    setMainDisplay("No Meeting Found", 0, `Meeting: Not Found`)
    Page.flashMessage(`Could not find meeting "${Comms.params.meetingCode}"`, 'error');
    Comms.disconnect();
  }, searchTimeout);

  Page.flashMessage(`Opened channel "${Comms.params.meetingCode}"`, 'notice');
}

function getUniqueCode() {
  if (!Memory.exists('standup_client_uniquecode')) {
    Memory.set('standup_client_uniquecode', Page.generateCode(16));
  }

  Comms.params.uniqueCode = Memory.get('standup_client_uniquecode');
}

function attemptReconnect() {
  Comms.params = Memory.getObject('standup_client_settings');
    Page.flashMessage(`Attempting to reconnect to meeting "${Comms.params.meetingCode}"`, 'notice');
    
    Comms.MQTTConnect(Comms.params.meetingCode);
}

document.addEventListener("DOMContentLoaded", function () {
  Utilities.setVersion();
  getUniqueCode();
  setUpForm();
  setUpDisplay();
  setUpButtons();
  setUpTeamInteractions();

  Page.setUpFlash();
});

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden') {
    Page.flashMessage('Page inactive. Disconnecting...', 'notice');
    Comms.disconnect(); // Don't know if this is the correct way to handle this
  }
  if (document.visibilityState === 'visible' && !Comms.params.connected) {
    attemptReconnect();
  }
});
