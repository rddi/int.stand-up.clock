class Timer {
  constructor(id, main = false) {
    this.element = document.getElementById(id);

    let hands = this.element.getElementsByClassName("hand");

    this.left = hands[0];
    this.right = hands[1];
    this.display = this.element.getElementsByClassName("timer-display")[0];
    this.main = main;

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
    this.pause = null;

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
    this.pause = new Date().getTime();
  }

  resumeTimer() {
    let timeDiff = (new Date().getTime() - this.pause);
    this.start += timeDiff;
    this.pause = null;
  }

  stopTimer() {
    this.state = 2;
    if (this.main) {
      playSound('tada');
    }
  }

  orange() {
    this.display.classList.add('orange');
  }

  green() {
    this.display.classList.add('green');
  }

  update() {
    if (this.state != 1 || this.isPaused()) {
      return;
    }

    this.current = new Date().getTime() - this.start;

    if (this.current >= this.full) {
      this.stopTimer();
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
      let milliseconds = parseInt(key,10);
      if (!this.notices[key] && (timeLeft < (milliseconds + 1000))) {
        this.notices[key] = true;
        playSound('beep');
        Comms.sendEvent(milliseconds/1000, 'Client.Notify');
      }
    }
  }

  isReady() {
    return this.state == 0 && this.full != 0;
  }

  hasStarted() {
    return this.state >= 1;
  }

  isFinished() {
    return this.state == 2;
  }

  isPaused() {
    return this.pause != null;
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