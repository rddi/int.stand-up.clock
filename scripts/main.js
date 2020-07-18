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

    // let value  = this.milliseconds();
    // if(time != null) {
    //   value = time;
    // }

    this.display.innerHTML = this.getTimer();
  }

  isReady() {
    return this.state == 0 && this.full != 0;
  }

  isFinished() {
    return this.state == 2;
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

let timer,
  subtimer,
  collapser,
  selectAll,
  deselectAll,
  endScreen,
  setButton,
  settings,
  speaker,
  form,
  time = 0,
  team = 0,
  ready = false,
  start,
  end,
  reset,
  updateSpeed = 100,
  teamRemaining = 0;

function setCollapser() {
  collapser = document.getElementsByClassName("collapser")[0]; 
}

function setSetButton() {
  setButton = document.getElementById("set-button");
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
  speaker = document.getElementById('speaker');
}

function mintosentence(time) {
  let quantifier = 'minute';

  if (stringtoms(time) <  60000) {
    time = time.split(':')[1];
    quantifier = 'second';
  }

  // let timeArray = time.split();

  // if (timeArray[0] === "0"){
  //   timeArray.shift();
  // }

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

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const results = document.querySelectorAll('input:checked');
    let formData = {};

    for (let i = 0;i < results.length;i++) {
      formData[results[i].getAttribute('name')] = results[i].value;
    }

    team = 0;
    let teamList = [];
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

        const teamButton = `<div class="team-button ${extraClass}">${breakdown[1]}</div>`;

        activeList[target].innerHTML = activeList[target].innerHTML + teamButton;
      }
    });

    setUpTeamButtons();

    teamRemaining = team;
    timer.setTimer(formData['duration']);
    subtimer.setTimer(formData['duration'] / team);
    toggleTray(true);
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

function setupTimers() {
  timer = new Timer('timer');
  subtimer = new Timer('sub-timer');

  start = document.getElementById("start-button");
  end = document.getElementById("end-button");
  reset = document.getElementById("reset-button");
  teamCount = document.getElementById("team-remaining");

  start.addEventListener("click", function(e) {
    timer.startTimer();
    subtimer.startTimer();
    newSpeaker();
  });

  end.addEventListener("click", function(e) {
    timer.stopTimer();
    subtimer.stopTimer();
  });

  reset.addEventListener("click", function(e) {
    timer.resetTimer();
    subtimer.resetTimer();
  });
}

function subtimerRebuild() {
  if (teamRemaining > 1) {
    teamRemaining--;
    subtimer.setTimer(mstodec((timer.full - timer.current) / teamRemaining));
    subtimer.startTimer();
    newSpeaker();
  }
}

function newSpeaker() {
  const currentSpeaker = document.querySelector('.team-button.active')

  speaker.innerHTML = currentSpeaker.innerHTML;
  speaker.classList.add("play");
  setTimeout(function() {
    speaker.classList.remove("play")
  }, 2000);
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

function setUpTeamMembers() {
  const members = [
    'Nidhal',
    'Nick',
    'Frank',
    'Matt',
    'Jordan',
    'Luke',
    'Conran',
    'Karim',
    'Joe',
    'Julien',
    'Leo',
    'Jacques',
    'Slimane',
    'Xuan'
  ];

  let randomOrder = randomiseArray(members);

  let memberList = [];
  let i = 0;
  for (i = 0;i < randomOrder.length;i += 1){
    memberList.push(`<input id="member-${i}" type="checkbox" class="team-member" name="team-${randomOrder[i]}" />
    <label for="member-${i}">${randomOrder[i]}</label>`)
  }

  memberList.push(`<div id="select-all" class="selection-button">Select All</div>
  <div id="deselect-all" class="selection-button hidden">Deselect All</div>`);

  let listElement = document.getElementById('team-members');

  listElement.innerHTML = memberList.join('');
}

function recordTime(element) {
    element.setAttribute('data-time', subtimer.getElapsedTimer());
}

function setUpTeamButtons() {
  let teamButtons = document.getElementsByClassName('team-button');
  let i=0;
  let j=0;

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

        console.log("REBUILD!");
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
    if(teamRemaining > 1 || timer.isFinished()) {
      end.classList.add("hidden");
    } else {
      end.classList.remove("hidden");
    }
  } else {
    settings.classList.remove("lock");
    end.classList.add("hidden");
  }

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

  setupTimers();

  setEndScreen();
  setSpeaker();

  startUpdates();
});

