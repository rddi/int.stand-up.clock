let timer,
  subtimer,
  collapser,
  selectAll,
  deselectAll,
  edit,
  endScreen,
  setButton,
  settings,
  nameWheel,
  nameWheelFinished = false,
  form,
  time = 0,
  team = 0,
  ready = false,
  pause,
  end,
  reset,
  next,
  pep,
  pepDisplay,
  muteInput,
  updateSpeed = 100,
  teamRemaining = 0,
  wheelRot = 0,
  sounds = [],
  teamModal,
  teamModalList,
  teamModalInput,
  saveModal,
  loadModal,
  pepModal,
  loadList,
  saveInput,
  localTeamMembers = [],
  teamname = 'default',
  teamInput,
  title,
  options = {
    mute: false,
    pausable: false,
    collectTime: true,
    pp: false,
    emote: false,
  },
  optionInputs,
  timeSlider,
  durationDisplay,
  saveButton,
  saveSettingsButton,
  loadButton,
  // useRegister = false,
  register = {},
  registrationOpen = false,
  // registerTitle,
  registerDisplay,
  openRegistrationButton,
  closeRegistrationButton,
  tabs,
  finishSent = false,
  meetingCodeDisplay,
  qrCodeModal,
  qrCode,
  restrictedNames = ['READY'],
  wordOptions = {},
  wordVotes = 0,
  voteCount;

function setCollapser() {
  collapser = document.getElementsByClassName("collapser")[0];
  title = document.getElementById("title");
}

function openSaveModal() {
  saveModal.classList.remove('hidden');
}

function openLoadModal() {
  let loads = Memory.partial('save-');

  let list = [];

  for (let index in loads) {
    let name = decodeURI(index.slice(5));

    list.push(`<div class="load-option"><i class="fa fa-minus remove-save remove" id="remove-${index}"></i><div class='load-selection selection-button' data-loadname="${index}">${name}</div></div>`);
  }

  loadList.innerHTML = list.join('');

  loadModal.classList.remove('hidden');
}

function setSetButton() {
  setButton = document.getElementById("set-button");
  saveButton = document.getElementById("save-button");
  loadButton = document.getElementById("load-button");

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('set-check')) {
      checkSetButton();
    }
  });

  saveButton.addEventListener('click', function (e) {
    if (e.target.classList.contains('disabled')) {
      return;
    }
    openSaveModal();
  });

  loadButton.addEventListener('click', function (e) {
    if (e.target.classList.contains('disabled')) {
      return;
    }
    openLoadModal();
  });

  checkSetButton();
}

function checkSetButton() {
  const checked = document.querySelectorAll('input:checked');
  let i = 0;
  let memSet = false;

  if (options.useRegister) {
    if (Object.keys(register).length > 0) {
      memSet = true;
    }
  } else {
    for (i = 0; i < checked.length; i += 1) {
      if (checked[i].id.match(/member-/g)) {
        memSet = true;
      }
    }
  }

  if (memSet) {
    setButton.classList.remove('disabled');
    saveButton.classList.remove('disabled');
    return;
  }

  setButton.classList.add('disabled');
  saveButton.classList.add('disabled');

  if (Object.keys(Memory.partial('save-')).length) {
    loadButton.classList.remove('disabled');
  } else {
    loadButton.classList.add('disabled');
  }
}

function toggleTray(close = false) {
  if (!collapser.classList.contains("closed") || close) {
    collapser.classList.add("closed");
    settings.classList.remove("close");
  } else {
    collapser.classList.remove("closed");
    settings.classList.add("close");
  }
}

function setCollapseButton() {
  settings = document.getElementById("settings-button");
  settings.addEventListener("click", function (e) {
    e.preventDefault();
    toggleTray(timer.start != null);
  });
}

function setEndScreen() {
  endScreen = document.getElementById('end-screen');
}

function setSpeaker() {
  nameWheel = document.getElementById('name-wheel');
  nameWheelStyle = document.getElementById('name-wheel-style');
}

function mintosentence(time) {
  let quantifier = 'minute';

  if (stringtoms(time) < 60000) {
    time = time.split(':')[1];
    quantifier = 'second';
  }

  time = time.replace(/^0/, '');

  return time + " " + quantifier;
}

function showEndScreen() {
  let endTime = mintosentence(timer.getElapsedTimer());
  let avgTime = mintosentence(mstomin(timer.getElapsedMilliseconds() / team.length));
  document.getElementById('end-time').innerHTML = endTime;
  document.getElementById('avg-time').innerHTML = `${avgTime}s`;
  endScreen.classList.remove("hidden");
}

function setSelectionButtons() {
  selectAll = document.getElementById("select-all");
  deselectAll = document.getElementById("deselect-all");
  edit = document.getElementById("edit-team");

  selectAll.addEventListener("click", function (e) {
    const allMembers = document.getElementsByClassName("team-member");
    let i = 0;

    for (i = 0; i < allMembers.length; i += 1) {
      allMembers[i].checked = true;
    }
  });

  deselectAll.addEventListener("click", function (e) {
    const allMembers = document.getElementsByClassName("team-member");
    let i = 0;

    for (i = 0; i < allMembers.length; i += 1) {
      allMembers[i].checked = false;
    }
  });

  edit.addEventListener("click", function (e) {
    openTeamModal();
  });
}

function openTeamModal() {
  teamInput.value = teamname;
  teamModal.classList.remove('hidden');
}

function closeTeamModal() {
  setTeamName(teamInput.value);
  // teamModal.classList.add('hidden');
}

function closeSaveModal() {
  // saveModal.classList.add('hidden');
  checkSetButton();
}

function closeLoadModal() {
  // loadModal.classList.add('hidden');
  checkSetButton();
}

function updateDurationDisplay(_value = null) {
  value = timeSlider.value;

  let perperson = `in total`;
  if (options.pp) {
    perperson = `per person`;
  }
  durationDisplay.innerHTML = `<span>${value}m</span> ${perperson}`;
}

function setRegisterOpen(_open = true) {
  let wasOpen = false;
  if (registrationOpen) {
    wasOpen = true;
  }
  registrationOpen = _open;

  if (!_open) {
    openRegistrationButton.classList.remove("hidden");
    closeRegistrationButton.classList.add("hidden");
    registerDisplay.classList.remove("open");
    if (wasOpen) {
      Page.flashMessage('Registration closed', 'notice');
    }
  } else {
    openRegistrationButton.classList.add("hidden");
    closeRegistrationButton.classList.remove("hidden");
    registerDisplay.classList.add("open");
    if (Comms.isConnected()) {
      Page.flashMessage('Registration open', 'success');
    }
  }
}

function setUpForm() {
  form = document.getElementById("input-form");
  muteInput = document.getElementById("mute-input");

  teamInput = document.getElementById('meeting-name-input');

  timeSlider = document.getElementById('time-slider');
  durationDisplay = document.getElementById('duration-display');

  openRegistrationButton = document.getElementById('open-registration');
  closeRegistrationButton = document.getElementById('close-registration');

  registerDisplay = document.getElementById('register-display');
  meetingCodeDisplay = document.getElementById('meeting-code');
  qrMeetingCodeDisplay = document.getElementById('qr-meeting-code');

  qrCodeModal = document.getElementById('qr-code-modal');
  qrCode = document.getElementById('qr-code');

  tabs = document.getElementsByClassName('tab');

  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('deregister')) {
      return;
    }

    const removee = e.target.id.split('deregister-')[1];

    sendDeregister(removee);
  });

  document.addEventListener('click', function (e) {
    let clientURL = `${window.location.href}client?meeting=${Comms.params.meetingCode}`;
    if (e.target.classList.contains('copy-code')) {

      var clipboard = document.createElement("textarea");
      clipboard.value = clientURL;

      // Avoid scrolling to bottom
      clipboard.style.top = "0";
      clipboard.style.left = "0";
      clipboard.style.position = "fixed";

      document.body.appendChild(clipboard);
      clipboard.focus();
      clipboard.select();

      document.execCommand('copy');

      document.body.removeChild(clipboard);

      Page.flashMessage(`Client URL: ${clientURL} has been copied to the clipboard`, 'success');
    } else if (e.target.classList.contains('qr-code-button')) {
      qrCode.setAttribute('src', `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${clientURL}`);
      qrCodeModal.classList.remove('hidden');
    }

  });

  openRegistrationButton.addEventListener('click', function (e) {
    if (Comms.params.meetingCode == null) {
      // Set meeting code
      Comms.params.meetingCode = Page.generateCode(4, true, true);

      // registerDisplay.classList.add('lozenge');

      // Add to code to page with clipboard button
      meetingCodeDisplay.innerHTML = 'Connecting...';

      Comms.MQTTConnect(Comms.params.meetingCode);
    }

    setRegisterOpen(true);
  });

  closeRegistrationButton.addEventListener('click', function (e) {
    setRegisterOpen(false);
  });

  timeSlider.addEventListener('input', function (e) {
    updateDurationDisplay(e.target.value);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (setButton.classList.contains('disabled')) {
      return;
    }
    const results = document.querySelectorAll('input:checked');
    let formData = {
      duration: timeSlider.value
    };

    for (let i = 0; i < results.length; i++) {
      formData[results[i].getAttribute('name')] = results[i].value;
    }

    team = [];

    const activeList = document.getElementsByClassName('active-team-list');
    activeList[0].innerHTML = '';
    activeList[1].innerHTML = '';

    let first = true;
    let flipflop = false;

    if (options.useRegister) {
      for (let member in register) {
        team.push(member);
      }
    } else {
      Object.keys(formData).forEach(function (item) {
        let breakdown = item.split("-");

        if (breakdown.shift() === "team") {
          team.push(breakdown.join("-"));
        }
      });
    }

    for (i = 0; i < team.length; i += 1) {
      target = 0;
      if (flipflop) {
        target = 1;
      }
      flipflop = !flipflop;

      let extraClass = '';

      if (first) {
        extraClass = 'active';
        first = false;
      }

      const teamButton = `<div id="team-button-${team[i]}" class="team-button ${extraClass}">${team[i]}</div>`;

      activeList[target].innerHTML = activeList[target].innerHTML + teamButton;
    }

    setUpTeamButtons();

    teamRemaining = team.length;

    let duration = formData['duration'];

    if (options.pp) {
      duration = duration * team.length;
    }

    if (options.pausable) {
      subtimer.element.classList.add('pause');
    }

    if (options.skipable) {
      subtimer.element.classList.add('skip');
    }

    if (options.pepTalk) {
      subtimer.element.classList.add('pep');
    }

    timer.setTimer(duration);
    subtimer.setTimer(duration / team.length);
    toggleTray(true);
    updateClients();
    setRegisterOpen(false);
  });
}

function stringtoms(string) {
  const time = string.split(':');
  let min = parseInt(time[0], 10);
  min += parseInt(time[1], 10) / 60;

  return mintoms(min)
}

function mintoms(min) {
  return min * 60 * 1000;
}

function mstomin(ms) {
  let minutes = Math.floor(ms / 1000 / 60);
  let paddingM = (minutes < 10) ? "0" : "";
  let seconds = Math.floor((ms / 1000) % 60);
  let paddingS = (seconds < 10) ? "0" : "";

  return `${paddingM}${minutes}:${paddingS}${seconds}`;
}

function mstodec(ms) {
  return (ms / 1000) / 60;
}

function playSound(name) {
  if (options.mute) {
    return;
  }
  if (sounds.hasOwnProperty(name)) {
    sounds[name].play();
  }
}

function stopSound(name) {
  if (sounds.hasOwnProperty(name)) {
    sounds[name].stop();
  }
}

function setUpSounds() {
  sounds['beep'] = new Sound('sounds/beep.mp3');
  sounds['next'] = new Sound('sounds/end.mp3');
  sounds['spin'] = new Sound('sounds/spin.mp3');
  sounds['found'] = new Sound('sounds/found.mp3');
  sounds['tada'] = new Sound('sounds/tada.mp3');
}

function setUpTimers() {
  timer = new Timer('timer', true);
  subtimer = new Timer('sub-timer');

  pause = document.getElementById("pause-button");
  end = document.getElementById("end-button");
  reset = document.getElementById("reset-button");
  next = document.getElementById("next-button");
  pep = document.getElementById("pep-button");
  pepDisplay = document.getElementById("pep-display");
  teamCount = document.getElementById("team-remaining");
  voteCount = document.getElementById("vote-count");

  pause.addEventListener("click", function (e) {
    let symbols = pause.getElementsByClassName('fa');
    let i = 0;
    if (timer.isPaused() || timer.isReady()) {
      if (timer.isPaused()) {
        timer.resumeTimer();
        subtimer.resumeTimer();
      } else {
        timer.startTimer();
        subtimer.startTimer();
        playSound('next');
      }
      for (i = 0; i < symbols.length; i += 1) {
        symbols[i].classList.remove('fa-play');
        symbols[i].classList.add('fa-pause');
      }
      pause.classList.remove('paused');
      nameWheelPause(false);
    } else {
      timer.pauseTimer();
      subtimer.pauseTimer();
      for (i = 0; i < symbols.length; i += 1) {
        symbols[i].classList.remove('fa-pause');
        symbols[i].classList.add('fa-play');
      }
      pause.classList.add('paused');
      nameWheelPause(true);
    }
    sendSpeaker();
    sendMemberList();
  });

  end.addEventListener("click", function (e) {
    timer.stopTimer();
    subtimer.stopTimer();
    sendMemberList();
  });

  next.addEventListener("click", function (e) {
    randomSelectMember();
    subtimerRebuild();
  });

  reset.addEventListener("click", function (e) {
    timer.resetTimer();
    subtimer.resetTimer();
  });

  pep.addEventListener("click", function (e) {
    randomisePepTalker();
  });

  document.addEventListener("click", function(e) {
    if (e.target.id != 'close-vote-button') {
      return;
    }
    getVoteResults();
  });
}

function randomisePepTalker() {
  pep.classList.add('spinning');
  pepDisplay.classList.remove('green');
  voteCount.classList.remove('green');
  voteCount.innerHTML = '';
  pepModal.classList.remove('hidden', 'green');
  spinPep(100);
}

function subtimerRebuild() {
  if (teamRemaining > 1) {
    playSound('next');
    teamRemaining--;
    if (!options.collectTime) {
      timer.full = timer.full - (subtimer.full - subtimer.current);
    }
    subtimer.setTimer(mstodec((timer.full - timer.current) / teamRemaining));
    subtimer.startTimer();
  }
}

function nameWheelPause(toPause) {
  if (toPause) {
    let transform = window.getComputedStyle(nameWheel).getPropertyValue('transform');
    nameWheel.style.transform = transform;
    return;
  }
  nameWheel.style.transform = `translate(-50%, -50%) rotate3d(0, 0, 1, ${wheelRot - 120}deg)`;
  nameWheel.style.transitionDuration = `${(Math.floor((subtimer.full - subtimer.current) / 1000))}s`;
}

function newSpeaker() {
  const currentSpeaker = document.querySelector('.team-button.active').innerHTML;

  nameWheel.innerHTML = '';

  let name = currentSpeaker.split('');

  const regex = '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])';

  let i = 0;

  let matched = [...currentSpeaker.matchAll(regex)];

  for(i = matched.length - 1;i >= 0;i -= 1) {
    let index = matched[i].index;
    name[index] = matched[i][0];
    name.splice(index+1,1);
  }

  

  let nameElement = '';
  let type = 'even';

  let offset = name.length / 2; //3.5

  if (name.length % 2 != 0) { //true
    type = 'odd';
    offset -= 0.5; //3  
  }

  offset = 0 - offset; //-3


  for (i = 0; i < name.length; i += 1) {
    nameElement += `<div class="letter" id="${type}${offset}">${name[i]}</div>`;
    offset += 1;
  }

  nameWheel.innerHTML = nameElement;
  updateClients();
}

function randomSelectMember() {
  const members = document.getElementsByClassName('team-button');
  let i = 0;
  let remaining = [];

  for (i = 0; i < members.length; i += 1) {
    if (members[i].classList.contains('done')) {
      continue;
    }

    if (members[i].classList.contains('active')) {
      recordTime(members[i]);
      members[i].classList.add('done');
      members[i].classList.remove('active');
      continue;
    }

    remaining.push(members[i]);
  }

  if (remaining.length < 1) {
    return;
  }

  const selection = Math.ceil(Math.random() * remaining.length) - 1;

  remaining[selection].classList.add('active');
}

function randomSelectPep() {
  const members = document.getElementsByClassName('team-button');

  const selection = Math.ceil(Math.random() * members.length) - 1;

  const highlighted = document.getElementsByClassName('highlight');

  if (highlighted.length > 0) {
    highlighted[0].classList.remove('highlight');
  }

  pepDisplay.innerHTML = members[selection].innerHTML;

  members[selection].classList.add("highlight");
}

function randomiseArray(input) {
  let output = input;

  let currentIndex = output.length;

  while (currentIndex !== 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temp = output[currentIndex];
    output[currentIndex] = output[randomIndex];
    output[randomIndex] = temp;
  }

  return output;
}

function sentenceCase(input) {
  let output = input[0].toUpperCase() + input.slice(1);
  
  return output;
}

function spinPep(time, stop = false) {
  randomSelectPep();

  if (stop) {
    // pepDisplay.classList.add('green');
    pepModal.classList.add('green');
    pep.classList.remove('spinning');
    playSound('found');

    let pepTalker = {
      pepper: pepDisplay.innerHTML
    }


    if (options.wordVote) {
      showVotes(0);

      let result = getRandomWords(3);

      wordOptions = {};
      wordVotes = 0;

      for(i=0;i<result.length;i+=1) {
        wordOptions[sentenceCase(result[i])] = 0;
      }

      pepTalker.words = Object.keys(wordOptions);
    }

    Comms.sendEvent(pepTalker, 'Client.PepTalker');
  } else {
    playSound('spin');
    setTimeout(function (e) {
      spinPep(time + (time * 0.1), time > 500);
    }, time);
  }
}
function setUpTeamMembers(maintainOrder = false) {
  let randomOrder = randomiseArray(TeamMembers.getList());
  let i = 0;

  if (maintainOrder && localTeamMembers != []) {
    for (i = localTeamMembers.length - 1; i >= 0; i -= 1) {
      if (!randomOrder.includes(localTeamMembers[i])) {
        localTeamMembers.splice(i, 1);
      }
    }

    for (i = 0; i < randomOrder.length; i += 1) {
      if (!localTeamMembers.includes(randomOrder[i])) {
        localTeamMembers.push(randomOrder[i]);
      }
    }

    randomOrder = localTeamMembers;
  } else {
    localTeamMembers = randomOrder;
  }

  let memberList = [];
  let editList = [];

  for (i = 0; i < randomOrder.length; i += 1) {
    memberList.push(`<input id="member-${i}" type="checkbox" class="team-member set-check" name="team-${randomOrder[i]}" />
    <label for="member-${i}">${randomOrder[i]}</label>`);
    editList.push(`<div class="edit-team-member"><i class="fa fa-minus remove-member remove" id="remove-${randomOrder[i]}"></i>${randomOrder[i]}</div>`);
  }

  let hide = '';

  if (memberList.length === 0) {
    memberList.push(`<div>To get started, add members to your team by pressing the edit button above</div>`);
    hide = " superhidden";
  }

  memberList.push(`<div id="select-all" class="selection-button set-check ${hide}">Select All</div>
  <div id="deselect-all" class="selection-button set-check hidden ${hide}">Deselect All</div>`);

  let listElement = document.getElementById('team-members');
  let editListElement = document.getElementById('team-editor-list');

  listElement.innerHTML = memberList.join('');
  editListElement.innerHTML = editList.join('');
}

function setUpTeamEdit() {
  teamModal = document.getElementById('team-modal');
  teamModalList = document.getElementById('team-editor-list');
  teamModalInput = document.getElementById('member-name-input');

  teamModalInput.addEventListener('keypress', function (e) {
    let value = teamModalInput.value;

    if (!['Enter', ' '].includes(e.key)) {
      return;
    }

    Page.flashMessage(`Team member \"${teamModalInput.value}\" added to team`, 'success');

    teamModalInput.value = '';

    if (['', ' '].includes(value)) {
      return;
    }

    value = value.trim();

    TeamMembers.add(value);

    buildTeamSections(true);
  });

  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('remove-member')) {
      return;
    }

    const removee = e.target.id.split('remove-')[1];
    TeamMembers.remove(removee);

    Page.flashMessage(`Team member \"${removee}\" removed from team`, 'success');

    buildTeamSections(true);
  });

  let close = document.getElementById('team-modal-close');

  close.addEventListener('click', function (e) {
    closeTeamModal();
  });
}

function setUpPepTalk () {
  pepModal = document.getElementById('pep-talk-modal');

  document.addEventListener('click', function (e) {
    if (e.target.id != 'pep-talk-modal-close') {
      return;
    }
    closePepTalk();
  });

  document.addEventListener('click', function (e) {
    if (e.target.id != 'pep-talk-respin') {
      return;
    }
    randomisePepTalker();
  });
}

function openPepTalk () {
  pep.classList.add('hidden');
  pepModal.classList.remove('hidden')
}

function closePepTalk () {
  pepModal.classList.add('hidden');
  pep.classList.remove('hidden');
}

function setUpSaveLoad() {
  saveModal = document.getElementById('save-modal');
  saveInput = document.getElementById('save-name-input');
  saveSettingsButton = document.getElementById('save-settings-button');
  loadModal = document.getElementById('load-modal');
  loadList = document.getElementById('load-editor-list');

  let saveClose = document.getElementById('save-modal-close');
  let loadClose = document.getElementById('load-modal-close');

  saveClose.addEventListener('click', function (e) {
    closeSaveModal();
  });
  loadClose.addEventListener('click', function (e) {
    closeLoadModal();
  });

  saveSettingsButton.addEventListener('click', function (e) {
    if (saveInput.value == '') { // More robust 
      Page.flashMessage(`Please provide a name for the meeting profile`, 'notice');
      return;
    }

    let name = encodeURI(saveInput.value)

    let fullOptions = options;

    fullOptions.duration = timeSlider.value;

    const selected = document.querySelectorAll('#team-members input:checked');
    let i = 0;

    fullOptions.team = [];

    for (i = 0; i < selected.length; i += 1) {
      fullOptions.team.push(selected[i].name);
    }

    let message = `Meeting profile saved as \"${saveInput.value}\"`;

    if (Memory.exists(`save-${name}`)) {
      message = `Meeting profile replaced existing \"${saveInput.value}\"`;
    }

    Memory.setObject(`save-${name}`, fullOptions);

    Page.flashMessage(message, 'success');

    saveInput.value = '';

    closeSaveModal();
  });

  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('load-selection')) {
      return;
    }

    let loadname = e.target.getAttribute('data-loadname');

    setOptions(false, loadname);

    Page.flashMessage(`Meeting profile \"${e.target.innerHTML}\" loaded successfully`, 'success');

    checkSetButton();
    closeLoadModal();
  });

  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('remove-save')) {
      return;
    }

    const removee = e.target.id.split('remove-')[1];

    Memory.remove(removee);

    Page.flashMessage(`Meeting profile \"${e.target.parentNode.getElementsByClassName('load-selection')[0].innerHTML}\" successfully removed`, 'success');

    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
  });
}

function recordTime(element) {
  element.setAttribute('data-time', subtimer.getElapsedTimer());
}

function setUpTeamButtons() {
  let teamButtons = document.getElementsByClassName('team-button');
  let i = 0;
  let j = 0;

  for (i = 0; i < teamButtons.length; i += 1) {

    teamButtons[i].addEventListener("click", function (e) {
      if (timer.isPaused() || event.target.classList.contains('active') || event.target.classList.contains('done')) {
        return;
      }

      if (timer.start === null) {
        for (j = 0; j < teamButtons.length; j += 1) {
          teamButtons[j].classList.remove('active');
        };
      } else {
        for (j = 0; j < teamButtons.length; j += 1) {
          if (teamButtons[j].classList.contains('active')) {
            recordTime(teamButtons[j]);
            teamButtons[j].classList.add('done');
            teamButtons[j].classList.remove('active');
          }
        };
      }

      event.target.classList.add('active');

      if (timer.start != null) {

        subtimerRebuild();
      }
      updateClients();
    });
  };
}

function checkTimes() {
  const teamMembers = document.getElementsByClassName("team-button");

  let i = 0;
  let fastest = stringtoms(teamMembers[i].getAttribute('data-time'));
  let slowest = stringtoms(teamMembers[i].getAttribute('data-time'));
  let highScores = [];
  let lowScores = [];


  for (i = 0; i < teamMembers.length; i += 1) {
    const thisTime = stringtoms(teamMembers[i].getAttribute('data-time'));

    if (thisTime === fastest) {
      highScores.push(i);
    } else if (thisTime < fastest) {
      fastest = thisTime;
      highScores = [i];
    }

    if (thisTime === slowest) {
      lowScores.push(i);
    } else if (thisTime > slowest) {
      slowest = thisTime;
      lowScores = [i];
    }
  }

  for (i = 0; i < highScores.length; i += 1) {
    teamMembers[highScores[i]].classList.add('time-green');
  }

  for (i = 0; i < lowScores.length; i += 1) {
    teamMembers[lowScores[i]].classList.add('time-red');
  }
}

function fadeTimer() {
  subtimer.fade();
  timer.fade();
}

function setFinish() {
  timer.green();
  subtimer.green();
  if (timer.getMilliseconds() <= 0) {
    endScreen.classList.add('orange');
  } else {
    endScreen.classList.add('green');
  }
  fadeTimer();
  checkTimes();
  showEndScreen();

  if (!finishSent) {
    sendFinished();
    finishSent = true;
  }
}

function manageSelectionButtons() {
  const allMembers = document.getElementsByClassName("team-member");
  let i = 0;
  let all = true;

  for (i = 0; i < allMembers.length; i += 1) {
    if (!allMembers[i].checked) {
      all = false;
    }
  }

  if (all) {
    selectAll.classList.add("hidden");
    deselectAll.classList.remove("hidden");
  } else {
    deselectAll.classList.add("hidden");
    selectAll.classList.remove("hidden");
  }
}

function setStage(stage, finish = false) {
  nameWheel.classList.remove('stage-0', 'stage-1', 'stage-2');
  nameWheel.classList.add(`stage-${stage}`);
  nameWheel.style.transform = `translate(-50%, -50%) rotate3d(0, 0, 1, ${getNextRotation()}deg)`;
  if (finish) {
    nameWheelFinished = true;
  }
}

function getNextRotation() {
  wheelRot += 120;
  return wheelRot - 120;
}

function checkNameWheel() {
  if (timer.start == null || nameWheelFinished) {
    return;
  }

  if (timer.isFinished()) {
    setStage(0, true);
  }

  const letters = document.getElementsByClassName('letter');
  const members = document.getElementsByClassName('active');

  let currentName = '';

  if (members.length > 0) {
    currentName = members[0].innerHTML;
  }

  let name = '';
  let i = 0;

  for (i = 0; i < letters.length; i += 1) {
    name += letters[i].innerHTML;
  }

  if (!nameWheel.classList.contains('stage-0') && name != currentName) {
    setStage(0);
    setTimeout(function () {
      setStage(1);
      newSpeaker();
      setTimeout(function () {
        nameWheel.style.transitionDuration = `${(Math.floor(subtimer.full / 1000))}s`;
        setStage(2);
      }, 250);
    }, 250);
  }
}

function update() {
  timer.update();
  subtimer.update();

  if (timer.state === 0) {
    manageSelectionButtons();
  }

  if (subtimer.isFinished()) {
    randomSelectMember();
    subtimerRebuild();
  }

  let currentTeamMember = "";
  if (timer.start != null) {
    currentTeamMember = `${(team.length - teamRemaining) + 1} / ${team.length}`;
  }
  teamCount.innerHTML = currentTeamMember;

  if (timer.start != null) {
    settings.classList.add("lock");
    if (timer.isFinished()) {
      end.classList.add("hidden");
      subtimer.element.classList.remove("end");
      next.classList.add("hidden");
      pause.classList.add("hidden");
      pep.classList.remove("hidden");
    } else if (teamRemaining > 1) {
      end.classList.add("hidden");
      subtimer.element.classList.remove("end");
      pause.classList.remove("hidden");
      if (!timer.isPaused()) {
        next.classList.remove("hidden");
      } else {
        next.classList.add("hidden");
      }
    } else {
      pause.classList.remove("hidden");
      next.classList.add("hidden");
      if (!timer.isPaused()) {
        end.classList.remove("hidden");
        subtimer.element.classList.add("end");
      } else {
        end.classList.add("hidden");
        subtimer.element.classList.remove("end");
      }
    }
  } else {
    settings.classList.remove("lock");
    end.classList.add("hidden");
    subtimer.element.classList.remove("end");
    next.classList.add("hidden");
    if (timer.isReady()) {
      pause.classList.remove("hidden");
    } else {
      pause.classList.add("hidden");
    }
  }

  checkNameWheel();

  if (timer.isFinished(true)) {
    setFinish();
  }
}

function startUpdates() {
  setInterval(function () {
    update();
  }, updateSpeed);
}

function buildTeamSections(maintainOrder = false) {
  setUpTeamMembers(maintainOrder);
  setUpTeamEdit();
  setSelectionButtons();
}

function setTeamName(name = null) {
  if (!name) {
    if (Memory.exists('standup_teamname')) {
      teamname = Memory.get('standup_teamname');
    } else {
      teamname = "Super Awesome Team"
    }
  } else {
    teamname = name;
    Memory.set('standup_teamname', teamname);
  }

  title.innerHTML = teamname;
}

function setOptions(save = false, memorySlot = 'standup_options') {
  if (!save) {
    if (Memory.exists(memorySlot)) {
      options = Memory.getObject(memorySlot);
    }
  } else {
    Memory.setObject(memorySlot, options);
  }
  for (let option in options) {
    if (optionInputs.hasOwnProperty(option)) {
      optionInputs[option].checked = options[option];
      checkFunc(optionInputs[option]);
    }
  }

  if (options.hasOwnProperty('duration')) {
    timeSlider.value = options['duration'];
  }

  if (options.hasOwnProperty('team')) {
    const teamInputs = document.querySelectorAll('#team-members input');
    let i = 0;

    for (i = 0; i < teamInputs.length; i += 1) {
      let value = false;

      console.log(options);
      console.log(options.team);

      if (options.team.includes(teamInputs[i].getAttribute('name'))) {
        value = true;
      }

      teamInputs[i].checked = value;
    }
  }

  updateDurationDisplay();
}

function getMemory() {
  setTeamName();

  let optionElements = document.getElementsByClassName('option-control');
  let i = 0;

  optionInputs = {};

  for (i = 0; i < optionElements.length; i += 1) {
    optionInputs[optionElements[i].getAttribute('name')] = optionElements[i];
    optionElements[i].addEventListener("input", function (e) {

      let name  = e.target.getAttribute('name');

      options[name] = e.target.checked;

      checkFunc(e.target);

      let linkType = 'data-linked-off';

      if (e.target.checked) {
        linkType = 'data-linked-on';
      }

      for(let option in optionInputs) {
        if (optionInputs[option].getAttribute(linkType) == name) {
          optionInputs[option].checked = e.target.checked;
          options[option] = e.target.checked;
        }
      }

      setOptions(true);
    });
  }

  setOptions();
}

function checkFunc(element) {
  if (element.getAttribute('func')) {
    window[element.getAttribute('func')](element.checked);
  }
}

function checkOptionLinks() {
  let types = [
    'data-linked-off',
    'data-linked-on'
  ];

  for(let option in optionInputs) {
    for(i=0;i<types.length;i+=1) {
      let link = optionInputs[option].getAttribute(types[i]);
      if (link != undefined && optionInputs[link].checked == (types[i] == 'data-linked-on')) {
        optionInputs[option].checked = optionInputs[link].checked;
        options[option] = optionInputs[link].checked;
      }
    }
  }
}

function setRegister(value) {
  if (value) {
    tabs[0].classList.add("hidden");
    tabs[1].classList.remove("hidden");
    return;
  }
  tabs[0].classList.remove("hidden");
  tabs[1].classList.add("hidden");
}



function handleReciept(input) {
  console.log(input, input._getPayloadString());

  let message = input._getPayloadString();

  try {
    message = JSON.parse(message);

    let type = message.type.split('.');

    console.log(type);
    console.log(type[0] == 'Master');
    if (type[0] == 'Master') {
      switch (type[1]) {
        case 'Message':
          console.log(message.body);
          break;
        case 'Check':
          handleCheck(message.client, message.body);
          break;
        case 'Nomination':
          handleNomination(message.client, message.body);
          break;
        case 'Register':
          handleRegistration(message.client, message.body);
          break;
        case 'ControlAction':
          handleControlAction(message.client, message.body);
          break;
        case 'WordVote':
          handleWordVote(message.client, message.body);
          break;
        case 'Emote':
          handleEmote(message.client, message.body);
          break;
        default:
          console.log(`Could not handle message type: "${message.type}"`);
      }
    }
  }
  catch (err) {
    console.log('FAIL!', err);
  }

}

function handleCheck(sender, body) {
  sendEvent({
    target: sender,
    status: 'exists'
  }
    , 'Client.CheckResponse');
}

function handleNomination(sender, nomination) {
  const currentSpeaker = document.querySelector('.team-button.active').innerHTML;
  if (sender != currentSpeaker) {
    return;
  }
  let target = document.getElementById(`team-button-${nomination}`);
  target.click();

  Page.flashMessage(`${sender} nominated ${nomination}`, 'success');
}

function handleControlAction(sender, action) {
  const currentSpeaker = document.querySelector('.team-button.active').innerHTML;
  if (sender != currentSpeaker) {
    return;
  }
  let targetId;

  switch (action) {
    case 'play':
      targetId = 'pause-button';
      break;
    case 'pause':
      targetId = 'pause-button';
      break;
    case 'skip':
      targetId = 'next-button';
      break;
    case 'stop':
      targetId = 'end-button';
      break;
  }

  let target = document.getElementById(targetId);

  if (target.classList.contains('hidden')) {
    return;
  }

  if ((action == 'play' && !timer.isPaused()) || (action == 'pause' && timer.isPaused())) {
    return;
  }

  target.click();
  updateClients();
}

function handleWordVote(client, word) {
  if (!options.wordVote || !register.hasOwnProperty(client) || !wordOptions.hasOwnProperty(word)) {
    return;
  }

  wordOptions[word] = wordOptions[word] + 1;

  wordVotes += 1;
  showVotes(wordVotes);

  Page.flashMessage(`${client} has voted`, 'success');

  Emotes.spawnEmote(`check-to-slot`, client, `green`)

  if (wordVotes == team.length - 1) {
    getVoteResults();
  }
}

function handleEmote(client, emote) {
  if (!options.emotable || !register.hasOwnProperty(client) || !Emotes.emoteOptions.hasOwnProperty(emote)) {
     return;
  }
  console.log(client,emote);

  Emotes.spawnEmote(Emotes.emoteOptions[emote].tag, client, Emotes.emoteOptions[emote].colour)
}

function showVotes(votes) {
  voteCount.innerHTML = `<i class="fa fa-check-to-slot"></i><span>${votes}/${team.length - 1}</span><a id="close-vote-button" class="button hidden"><i class="fa fa-times"></i></a>`;
}

function getVoteResults() {
  let currentWord = ['ERROR', -1];

  for(let option in wordOptions) {
    if (wordOptions[option] > currentWord[1]) {
      currentWord = [option, wordOptions[option]];
    }
  }

  voteCount.innerHTML = `"${currentWord[0]}"`;
  voteCount.classList.add('green');

  playSound('found');
}


function handleRegistration(client, uniqueCode) {
  if (register.hasOwnProperty(client)) {

    if (register[client] == uniqueCode) {
      sendEvent({
        target: client,
        status: 'success',
        error: 'none'
      }
        , 'Client.RegisterResponse');

      if (timer.hasStarted() && !timer.isFinished()) {
        updateClients();
      }
      return;
    }

    // If so, return an error
    sendEvent({
      target: client,
      status: 'failure',
      error: 'Name already exists in meeting'
    }
      , 'Client.RegisterResponse');
    return;
  }

  if (!registrationOpen) {
    sendEvent({
      target: client,
      status: 'failure',
      error: 'Registration for this meeting is not currently open'
    }, 'Client.RegisterResponse');
    return;
  }

  if (restrictedNames.includes(client)) {
    sendEvent({
      target: client,
      status: 'failure',
      error: `"${client}" is a restricted name`
    }, 'Client.RegisterResponse');
    return;
  }

  for (let person in register) {
    if (register[person] == uniqueCode) {
      delete register[person];
    }
  }

  //If not, add to new team list
  register[client] = uniqueCode;

  //Send registration success
  sendEvent({
    target: client,
    status: 'success',
    error: 'none'
  }
    , 'Client.RegisterResponse');

  Page.flashMessage(`"${client}" has joined the meeting`, 'success')
  updateRegister();
  updateClients();
}

function updateRegister() {
  console.log('UPDATING REGISTER');
  console.log(register);
  let registerMembers = [];
  for (let member in register) {
    console.log(member);
    registerMembers.push(
      `<div class="register-lozenge"><i class="fa fa-minus deregister remove" id="deregister-${member}"></i>${member}</div>`
    );
  }

  registerDisplay.innerHTML = registerMembers.join('');
  checkSetButton();
}

function updateClients() {
  sendSpeaker();

  sendMemberList();
}

function sendSpeaker() {
  if (timer.isReady()) {
    sendEvent('READY', 'Client.UpdateSpeaker');
    return;
  }

  let currentSpeaker = document.querySelector('.team-button.active');

  if (currentSpeaker == null) {
    return;
  }

  sendEvent(currentSpeaker.innerHTML, 'Client.UpdateSpeaker');
}

function sendMemberList() {
  let currentMemberList = document.getElementsByClassName('team-button');
  let membersObject = [];
  let i;

  for (i = 0; i < currentMemberList.length; i += 1) {
    membersObject.push({
      name: currentMemberList[i].innerHTML,
      active: currentMemberList[i].classList.contains('active'),
      done: currentMemberList[i].classList.contains('done')
    });
  }

  const meetingPackage = {
    buttons: {
      play: timer.isPaused(),
      pause: options.pausable && !timer.isPaused(),
      skip: options.skipable,
    },
    members: membersObject,
  };

  if (options.emotable) {
    meetingPackage.emotes = Emotes.emoteOptions;
  }

  sendEvent(meetingPackage, 'Client.MemberList');
}

function sendDeregister(removee) {
  sendEvent({
    deregister: register[removee],
  }, 'Client.Deregister');

  delete register[removee];

  Page.flashMessage(`Team member \"${removee}\" removed from register`, 'success');

  updateRegister();
  checkSetButton();
}

function sendFinished() {
  sendEvent({}, 'Client.TimerFinish');
}

function connectHandler() {
  Page.flashMessage(`Successfully created meeting "${Comms.params.meetingCode}"`, 'success');
  registerDisplay.setAttribute('code', Comms.params.meetingCode);
  meetingCodeDisplay.innerHTML = `${Comms.params.meetingCode}<i class="fa fa-qrcode qr-code-button"></i><i class="fa fa-clipboard copy-code"></i>`;
  meetingCodeDisplay.classList.add('connected');
  qrMeetingCodeDisplay.innerHTML = `${Comms.params.meetingCode}<i class="fa fa-clipboard copy-code"></i>`;
  registerDisplay.classList.add('connected');
  setRegisterOpen(true);
}

function sendEvent(_body, _type = "Message") {
  if (!options.useRegister) {
    return;
  }

  Comms.sendEvent(_body, _type);
}

document.addEventListener("DOMContentLoaded", function () {
  buildTeamSections();

  setCollapser();
  setCollapseButton();
  setUpForm();

  getMemory();

  setUpSaveLoad();

  setUpSounds();

  setUpTimers();

  setEndScreen();
  setSpeaker();

  setUpPepTalk();

  setSetButton();

  Page.setUpModals();

  Page.setUpFlash();

  Emotes.setUpEmotes();

  startUpdates();
});

