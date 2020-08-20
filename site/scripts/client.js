let meetingCodeInput,
  clientNameInput,
  joinModal,
  joinButton,
  speakerDisplay,
  teamDisplay,
  memberList = {};

function setUpForm() {
  joinModal = document.getElementById('join-modal');
  meetingCodeInput = document.getElementById('meeting-code-input');
  clientNameInput = document.getElementById('client-name-input');
  joinButton = document.getElementById('join-button');

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
        console.log(message.body);
        break;
      case 'UpdateSpeaker':
        console.log(message);
        console.log(message.body);
        handleUpdateSpeaker(message.body);
        break;
      case 'MemberList':
        handleMemberList(message.body);
        break;
      default:
        console.log(`Could not handle message type: "${message.type}"`);
    }
  }
  catch (err) {
    console.log('FAIL!', error);
  }
  
}

function handleUpdateSpeaker(speaker) {

  speakerDisplay.innerHTML = speaker;

  speakerDisplay.classList.remove('green');

  teamDisplay.classList.remove('active');

  console.log(Comms.params.clientName, speaker, speaker == Comms.params.clientName);
  if (speaker == Comms.params.clientName) {
    // Give control
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
    console.log(memberList[i]);
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
    if (!e.target.classList.contains('team-member')) {
      return;
    }

    Comms.sendEvent(e.target.getAttribute('data-name'), 'Nomination');
  });
}

function connectHandler() {
  joinModal.classList.add("hidden");

  Comms.sendEvent(
    '',
    'Register'
  );

  Page.flashMessage(`Successfully connected to meeting "${Comms.params.meetingCode}"`, 'success');
}

document.addEventListener("DOMContentLoaded", function () {
  setUpForm();
  setUpDisplay();
  setUpTeamInteractions();

  Page.setUpFlash();
});

