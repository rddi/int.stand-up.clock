let meetingCodeInput,
  clientNameInput,
  joinModal,
  joinTitle,
  joinButton,
  currentSpeaker,
  mainDisplay,
  teamDisplay,
  memberList = {};

function setUpForm() {
  joinModal = document.getElementById('join-modal');
  joinTitle = document.getElementById('join-title');
  meetingCodeInput = document.getElementById('meeting-code-input');
  clientNameInput = document.getElementById('client-name-input');
  joinButton = document.getElementById('join-button');

  let queryParams = Page.getQueryParams();

  let memory = Memory.getObject('standup_client_settings');

  if (queryParams.hasOwnProperty('meeting')) {
    let code = queryParams.meeting.toUpperCase();
    meetingCodeInput.value = code;
    meetingCodeInput.parentElement.classList.add('hidden');
    joinTitle.innerHTML = `Join Meeting "${code}"`;
  } else if (memory != null && memory.hasOwnProperty('meetingCode')) {
    meetingCodeInput.value = memory.meetingCode;
  }

  if (memory != null && memory.hasOwnProperty('clientName')) {
    clientNameInput.value = memory.clientName;
  }



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
    Comms.params.clientName = clientNameInput.value;

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
}

function handleReciept(input) {
  console.log(input, input._getPayloadString());

  let message = input._getPayloadString();

  try{
    message = JSON.parse(message);
    
    switch (message.type) {
      case 'Message':
        if (!Comms.params.registered) {
          return;
        }
        console.log(message.body);
        break;
      case 'MeetingInfo':
          handleMeetingInfo(message.body);
          break;
      case 'UpdateSpeaker':
        if (!Comms.params.registered) {
          return;
        }
        handleUpdateSpeaker(message.body);
        break;
      case 'MemberList':
        if (!Comms.params.registered) {
          return;
        }
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
        setMainDisplay("Disconnected", 0, 'Connection Status');
        Page.flashMessage('You have been removed from the meeting', 'notice');

        break;
        case 'TimerFinish':
          if (!Comms.params.registered) {
            return;
          }
  
          setMainDisplay("Finished", 1, `Meeting: ${Comms.params.meetingCode}`);
        
          Page.flashMessage('The timer has ended', 'notice');
  
          break;
      case 'RegisterResponse':
        handleRegisterResponse(message.body);
        break;
      default:
        console.log(`Could not handle message type: "${message.type}"`);
    }
  }
  catch (err) {
    console.log('FAIL!', error);
  }
  
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

    if (state) {
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

function handleRegisterResponse(response) {
  if (response.target != Comms.params.clientName) {
    return;
  }
  if (response.status == 'success') {
    setMainDisplay("Registered", 1);
    Page.flashMessage(`Registered in meeting "${Comms.params.meetingCode}" as "${Comms.params.clientName}"`, 'success');
    Comms.params.registered = true;
  } else if (response.status == 'failure') {
    Page.flashMessage(`Could not register in meeting "${Comms.params.meetingCode}" as "${Comms.params.clientName}": ${response.error}`, 'error');
  }
}

function handleUpdateSpeaker(speaker) {
  currentSpeaker = speaker;

  teamDisplay.classList.remove('active');

  console.log(currentSpeaker);

  if (currentSpeaker == 'READY') {
    setMainDisplay('Ready', 1);  
    return;
  }

  let state = 2;

  if (speaker == Comms.params.clientName) {
    state = 3;
    teamDisplay.classList.add('active');
  }

  setMainDisplay(currentSpeaker, state, 'Current Speaker');
}

function handleMemberList(_memberList) {
  memberList = _memberList.members;

  buildMemberElements();
}

function handleMeetingInfo(state) {
  if(state == 'exists') {
    Page.flashMessage('Meeting Found','success');

    Comms.params.meetingExists = true;

    sendRegistration();
  }
}

function buildMemberElements() {
  console.log("buildMemberElements");
  console.log(memberList);
  let elements = [];
  let i;
  for(i = 0;i < memberList.length;i += 1) {
    if (memberList[i].name == Comms.params.clientName) {
      continue;
    }
    let classes = [];

    if (memberList[i].done) {
      classes.push('done');
    }
    if (memberList[i].active) {
      classes.push('active');
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

    Comms.sendEvent(e.target.getAttribute('data-name'), 'Nomination');
  });
}
function sendRegistration() {
  setMainDisplay("Registering", 1, `Meeting: ${Comms.params.meetingCode}`)

  Comms.sendEvent(
    Comms.params.uniqueCode,
    'Register'
  );
}

function connectHandler() {

  setMainDisplay("Finding Meeting", 2, 'Connection Status');

  Page.flashMessage(`Opened channel`, 'notice');
}

function getUniqueCode() {
  if (!Memory.exists('standup_client_uniquecode')) {
    Memory.set('standup_client_uniquecode', Page.generateCode(16));
  }

  Comms.params.uniqueCode = Memory.get('standup_client_uniquecode');
}

document.addEventListener("DOMContentLoaded", function () {
  getUniqueCode();
  setUpForm();
  setUpDisplay();
  setUpTeamInteractions();

  Page.setUpFlash();
});

