class Timer {
  constructor(id) {
    this.element = document.getElementById(id);

    let hands = this.element.getElementsByClassName("hand");

    this.left = hands[0];
    this.right = hands[1];
    this.display = this.element.getElementsByClassName("timer-display")[0];

    this.resetTimer();
  }

  setTimer(time) {
    this.resetTimer();
    this.full = mintoms(time);
    this.current = mintoms(time);
    this.display.innerHTML = mstomin(this.full);

    for(let key in this.notices) {
      if (this.full <= parseInt(key, 10)) {
        this.notices[key] = true;
      }
    }
  }

  startTimer() {
    if (this.full == 0) {
      return;
    }
    this.start = new Date().getTime();
    this.state = 1;
  }

  resetTimer() {
    this.full = 0;
    this.current = 0;
    this.state = 0;
    this.start = null;
    this.pause = false;

    this.notices = {
      '10000':false,
      '5000':false,
      '4000':false,
      '3000':false,
      '2000':false,
      '1000':false,
      '0':false 
    }
  }

  pauseTimer() {
    this.pause = true;
  }

  stopTimer() {
    this.state = 2;
  }

  orange() {
    this.display.classList.add('orange');
  }

  green() {
    this.display.classList.add('green');
  }

  update() {
    if (this.state != 1) {
      return;
    }

    this.current = new Date().getTime() - this.start;


    if (this.current >= this.full) {
      this.state = 2;
      this.display.innerHTML = "00:00";
      this.right.style.transform = "rotate(180deg)";
      this.left.style.transform = "rotate(180deg)";
      return;
    }

    let half = this.full / 2;
    let angle = 360 * (this.current / this.full);

    if (this.current >= half) {
      this.right.style.transform = "rotate(180deg)";
      this.left.style.transform = `rotate(${angle - 180}deg)`;
    } else {
      this.right.style.transform = `rotate(${angle}deg)`;
      this.left.style.transform = `rotate(0deg)`;
    }

    this.display.innerHTML = this.getTimer();

    const timeLeft = this.full - this.current;

    for (let key in this.notices) {
      if (!this.notices[key] && (timeLeft < (parseInt(key, 10) + 1000))) {
        this.notices[key] = true;
        playSound('beep');
      }
    }
  }

  isReady() {
    return this.state == 0 && this.full != 0;
  }

  isFinished() {
    return this.state == 2;
  }

  isPaused() {
    return this.pause;
  }

  getMilliseconds() {
    return this.full - this.current;
  }

  getElapsedMilliseconds() {
    return this.current;
  }

  getTimer() {
    return mstomin(this.getMilliseconds());
  }

  getElapsedTimer() {
    return mstomin(this.getElapsedMilliseconds());
  }

  fade() {
    this.left.classList.add('fade');
    this.right.classList.add('fade');
  }
}

class Sound {
  constructor(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute('preload', 'auto');
    this.sound.setAttribute('controls', 'none');
    this.sound.style.display = 'none';
    document.body.appendChild(this.sound);
  }
 
  play() {
    this.sound.currentTime = 0
    this.sound.play();
  }

  stop() {
    this.sound.stop();
  }
}

let Storage = window.localStorage,
  muted,
  timer,
  subtimer,
  collapser,
  selectAll,
  deselectAll,
  endScreen,
  setButton,
  settings,
  nameWheel,
  nameWheelFinished = false,
  form,
  time = 0,
  team = 0,
  ready = false,
  start,
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
  sounds = [];

function setCollapser() {
  collapser = document.getElementsByClassName("collapser")[0]; 
}

function setSetButton() {
  setButton = document.getElementById("set-button");

  let formInputs = document.getElementsByClassName('set-check');

  for(i = 0;i < formInputs.length;i += 1){
    formInputs[i].addEventListener('click', function(e) {
      checkSetButton();
    });
  }
}

function checkSetButton() {
  const checked = document.querySelectorAll('input:checked');
  let i = 0;
  let durSet = false;
  let memSet = false;


  for(i = 0;i < checked.length;i += 1) {
    if (checked[i].id.match(/dur-/g)) {
      durSet = true;
    }
    if (checked[i].id.match(/member-/g)) {
      memSet = true;
    }
  }
  
  if (durSet && memSet) {
    setButton.classList.remove('disabled');
    return;
  }

  setButton.classList.add('disabled');
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
  settings.addEventListener("click", function(e) {
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

  if (stringtoms(time) <  60000) {
    time = time.split(':')[1];
    quantifier = 'second';
  }

  time = time.replace(/^0/, '');

  return time + " " + quantifier;
}

function showEndScreen() {
  let endTime = mintosentence(timer.getElapsedTimer());
  let avgTime  = mintosentence(mstomin(timer.getElapsedMilliseconds() / team));
  document.getElementById('end-time').innerHTML = endTime;
  document.getElementById('avg-time').innerHTML = `${avgTime}s`;
  endScreen.classList.remove("hidden");
}

function setSelectionButtons() {
  selectAll = document.getElementById("select-all");
  deselectAll = document.getElementById("deselect-all");

  selectAll.addEventListener("click", function(e) {
    const allMembers = document.getElementsByClassName("team-member");
    let i = 0;

    for(i = 0;i < allMembers.length;i += 1) {
      allMembers[i].checked = true;
    }
  });

  deselectAll.addEventListener("click", function(e) {
    const allMembers = document.getElementsByClassName("team-member");
    let i = 0;

    for(i = 0;i < allMembers.length;i += 1) {
      allMembers[i].checked = false;
    }
  });
}

function setForm() {
  form = document.getElementById("input-form");
  muteInput = document.getElementById("mute-input");

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    if (setButton.classList.contains('disabled')) {
      return;
    }
    const results = document.querySelectorAll('input:checked');
    let formData = {};

    for (let i = 0;i < results.length;i++) {
      formData[results[i].getAttribute('name')] = results[i].value;
    }

    team = 0;
    let flipflop = false;
    const activeList = document.getElementsByClassName('active-team-list');

    activeList[0].innerHTML = '';
    activeList[1].innerHTML = '';

    let first = true;

    Object.keys(formData).forEach(function(item) {
      let breakdown = item.split("-");

      if (breakdown[0] === "team") {
        team += 1;
        target = 0;
        if(flipflop) {
          target = 1;
        }
        flipflop = !flipflop;

        let extraClass = '';

        if (first) {
          extraClass = 'active';
          first = false;
        }

        breakdown.shift();

        const teamButton = `<div class="team-button ${extraClass}">${breakdown.join("-")}</div>`;

        activeList[target].innerHTML = activeList[target].innerHTML + teamButton;
      }
    });

    setUpTeamButtons();

    teamRemaining = team;

    let duration = formData['duration'];

    if (formData['duration'] == 1) {
      duration = team;
    }

    timer.setTimer(duration);
    subtimer.setTimer(duration / team);
    toggleTray(true);
  });
  console.log(muteInput);

  muteInput.addEventListener("click", function(e) {
    console.log(muteInput.checked);
    muted = muteInput.checked;
    Storage.setItem("standup_mute", muted);
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
  let paddingM = (minutes < 10)?"0":"";
  let seconds = Math.floor((ms / 1000) % 60);
  let paddingS = (seconds < 10)?"0":"";
  
  return `${paddingM}${minutes}:${paddingS}${seconds}`;
}

function mstodec(ms) {
  return (ms / 1000) / 60;
}

function playSound(name) {
  console.log(muted);
  if (muted) {
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

function setupSounds() {
  const memory = Storage.getItem('standup_mute');
  console.log(typeof memory);
  if(memory != null) {
    muted = (memory == "true");
  } else {
    muted = false;
  }

  muteInput.checked = muted;

  sounds['beep'] = new Sound('sounds/beep.mp3');
  sounds['end'] = new Sound('sounds/end.mp3');
  sounds['spin'] = new Sound('sounds/spin.mp3');
  sounds['found'] = new Sound('sounds/found.mp3');
}

function setupTimers() {
  timer = new Timer('timer');
  subtimer = new Timer('sub-timer');

  start = document.getElementById("start-button");
  pause = document.getElementById("pause-button");
  end = document.getElementById("end-button");
  reset = document.getElementById("reset-button");
  next = document.getElementById("next-button");
  pep = document.getElementById("pep-button");
  pepDisplay = document.getElementById("pep-display");
  teamCount = document.getElementById("team-remaining");

  start.addEventListener("click", function(e) {
    timer.startTimer();
    subtimer.startTimer();
  });

  pause.addEventListener("click", function(e) {
    if (timer.isPaused()) {
      timer.resume();
      subtimer.resume();
    } else {
      timer.pause();
      subtimer.pause();
    }
    timer.startTimer();
    subtimer.startTimer();
  });

  end.addEventListener("click", function(e) {
    timer.stopTimer();
    subtimer.stopTimer();
  });

  next.addEventListener("click", function(e) {
    randomSelectMember();
    subtimerRebuild();
  });

  reset.addEventListener("click", function(e) {
    timer.resetTimer();
    subtimer.resetTimer();
  });

  pep.addEventListener("click", function (e) {
    pep.classList.add("spinning");
    pepDisplay.classList.remove("green");
    spinPep(100);
  })
}

function subtimerRebuild() {
  if (teamRemaining > 1) {
    playSound('end');
    teamRemaining--;
    subtimer.setTimer(mstodec((timer.full - timer.current) / teamRemaining));
    subtimer.startTimer();
  }
}

function newSpeaker() {
  const currentSpeaker = document.querySelector('.team-button.active').innerHTML;

  nameWheel.innerHTML = '';

  const name = currentSpeaker.split('');
  let i = 0;

  let nameElement = '';
  let type = 'even';

  let offset = name.length / 2; //3.5

  if (name.length % 2 != 0) { //true
    type = 'odd';
    offset -= 0.5; //3  
  }

  offset = 0 - offset; //-3


  for(i = 0;i < name.length;i += 1) {
    nameElement += `<div class="letter" id="${type}${offset}">${name[i]}</div>`;
    offset += 1;
  }

  nameWheel.innerHTML = nameElement;
}

function randomSelectMember() {
  const members = document.getElementsByClassName('team-button');
  let i = 0;
  let remaining = [];

  for (i = 0;i < members.length;i += 1) {
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

  members[selection].classList.add("highlight")
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

function spinPep(time, stop = false) {
  randomSelectPep();

  if (stop) {
    pepDisplay.classList.add('green');
    pep.classList.remove('spinning');
    playSound('found');
  } else {
    playSound('spin');
    setTimeout(function(e) {
      spinPep(time + (time * 0.1), time > 500);
    }, time);
  }
}
function setUpTeamMembers() {
  let randomOrder = randomiseArray(members);

  let memberList = [];
  let i = 0;
  for (i = 0;i < randomOrder.length;i += 1){
    memberList.push(`<input id="member-${i}" type="checkbox" class="team-member set-check" name="team-${randomOrder[i]}" />
    <label for="member-${i}">${randomOrder[i]}</label>`)
  }

  memberList.push(`<div id="select-all" class="selection-button set-check">Select All</div>
  <div id="deselect-all" class="selection-button set-check hidden">Deselect All</div>`);

  let listElement = document.getElementById('team-members');

  listElement.innerHTML = memberList.join('');
}

function recordTime(element) {
    element.setAttribute('data-time', subtimer.getElapsedTimer());
}

function setUpTeamButtons() {
  let teamButtons = document.getElementsByClassName('team-button');
  let i = 0;
  let j = 0;

    for(i=0;i<teamButtons.length;i+=1) {
      
      teamButtons[i].addEventListener("click", function(e) {
      if (event.target.classList.contains('active') || event.target.classList.contains('done')) {
        return;
      }

      if (timer.start === null) {
        for(j = 0;j < teamButtons.length;j += 1) {
          teamButtons[j].classList.remove('active');
        };
      } else {
        for(j = 0;j < teamButtons.length;j += 1) {
          if(teamButtons[j].classList.contains('active')) {
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
    });
  };
}

function checkTimes(){
  const teamMembers = document.getElementsByClassName("team-button");
  
  let i = 0;
  let fastest = stringtoms(teamMembers[i].getAttribute('data-time'));
  let slowest = stringtoms(teamMembers[i].getAttribute('data-time'));
  let highScores = [];
  let lowScores = [];


  for (i = 0;i < teamMembers.length;i += 1) {
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

  for (i = 0;i < highScores.length;i += 1) {
    teamMembers[highScores[i]].classList.add('time-green');
  }

  for (i = 0;i < lowScores.length;i += 1) {
    teamMembers[lowScores[i]].classList.add('time-red');
  }
}

function fadeTimer(){
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
}

function manageSelectionButtons() {
  const allMembers = document.getElementsByClassName("team-member");
  let i = 0;
  let all = true;

  for(i = 0;i < allMembers.length;i += 1) {
    if(!allMembers[i].checked) {
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
  return wheelRot -120;
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
    currentName= members[0].innerHTML;
  }

  let name = '';
  let i = 0;
  
  for(i = 0;i < letters.length;i += 1) {
    name += letters[i].innerHTML;
  }

  if (!nameWheel.classList.contains('stage-0') && name != currentName) {
    setStage(0);
    setTimeout(function() {
      setStage(1);
      newSpeaker();
      setTimeout(function() {
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

  if (timer.isReady()) {
    start.classList.remove("hidden");
  } else {
    start.classList.add("hidden");
  }

  if (subtimer.isFinished()) {
    randomSelectMember();
    subtimerRebuild();
  }

  let currentTeamMember = "";
  if (timer.start != null) {
    currentTeamMember = `${(team - teamRemaining) + 1} / ${team}`;
  }
  teamCount.innerHTML = currentTeamMember;

  if (timer.start != null) {
    settings.classList.add("lock");
    if(timer.isFinished()) {
      end.classList.add("hidden");
      next.classList.add("hidden");
      pep.classList.remove("hidden");
    } else if (teamRemaining > 1) {
      end.classList.add("hidden");
      next.classList.remove("hidden");
    } else {
      end.classList.remove("hidden");
      next.classList.add("hidden");
    }
  } else {
    settings.classList.remove("lock");
    end.classList.add("hidden");
    next.classList.add("hidden");
  }

  checkNameWheel();

  if (timer.isFinished()) {
    setFinish();
  }
}

function startUpdates() {
  setInterval(function() {
    update(); 
  }, updateSpeed);
}

document.addEventListener("DOMContentLoaded", function () {
  setUpTeamMembers();

  setCollapser();
  setCollapseButton();
  setForm();
  
  setSelectionButtons();

  setupSounds();

  setupTimers();

  setEndScreen();
  setSpeaker();

  setSetButton();

  startUpdates();
});

