let meetingCodeInput,
  clientNameInput,
  joinModal,
  joinTitle,
  joinButton,
  currentSpeaker,
  speakerDisplay,
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
    Comms.params.meetingCode = meetingCodeInput.value;
    Comms.params.clientName = clientNameInput.value;

    Memory.setObject('standup_client_settings', Comms.params);

    Comms.MQTTConnect(Comms.params.meetingCode);
  });
}

function setUpDisplay() {
  speakerDisplay = document.getElementById('speaker-display');
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

function handleRegisterResponse(response) {
  if (response.target != Comms.params.clientName) {
    return;
  }
  if (response.status == 'success') {
    Page.flashMessage(`Registered in meeting "${Comms.params.meetingCode}" as "${Comms.params.clientName}"`, 'success');
    Comms.params.registered = true;
    joinModal.classList.add("hidden");
    setTimeout(function(e) {
      speakerDisplay.classList.remove("hidden");
    },1000);
  } else if (response.status == 'failure') {
    Page.flashMessage(`Could not register in meeting "${Comms.params.meetingCode}" as "${Comms.params.clientName}": ${response.error}`, 'error');
  }
}

function handleUpdateSpeaker(speaker) {
  currentSpeaker = speaker;

  speakerDisplay.innerHTML = currentSpeaker;
  speakerDisplay.classList.remove('waiting');

  speakerDisplay.classList.remove('green');

  teamDisplay.classList.remove('active');

  if (speaker == Comms.params.clientName) {
    speakerDisplay.classList.add('green');
    teamDisplay.classList.add('active');
  }
}

function handleMemberList(_memberList) {
  memberList = _memberList.members;

  buildMemberElements();
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

function connectHandler() {
  joinModal.classList.add("busy");

  Comms.sendEvent(
    Comms.params.uniqueCode,
    'Register'
  );

  Page.flashMessage(`Opened channel "${Comms.params.meetingCode}"`, 'notice');
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

