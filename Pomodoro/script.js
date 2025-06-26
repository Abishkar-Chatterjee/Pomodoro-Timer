const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const modeButtons = document.querySelectorAll('.mode-btn');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const indicator = document.getElementById('indicator');
const alarmSound = document.getElementById('alarm-sound');
const iconToggle = document.getElementById('icon-toggle');
const iconPath = document.getElementById('playpause-path');
const clickSound = document.getElementById('click-sound');

const inputPomodoro = document.getElementById('pomodoro-time');
const inputShort = document.getElementById('short-time');
const inputLong = document.getElementById('long-time');
const saveSettingsBtn = document.getElementById('save-settings');

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskEstimate = document.getElementById('task-estimate');
const taskList = document.getElementById('task-list');
let xp = parseInt(localStorage.getItem('xp') || '0');
let level = parseInt(localStorage.getItem('level') || '1');

const xpFill = document.getElementById('xp-fill');
const levelDisplay = document.getElementById('level-display');

function getXPRequired(level) {
    return 5 + (level - 1) * 2;
}

function updateXPBar() {
    const needed = getXPRequired(level);
    const percent = Math.min(100, (xp / needed) * 100);
    xpFill.style.width = percent + '%';
    levelDisplay.textContent = `Level ${level}`;
}


let durations = JSON.parse(localStorage.getItem('durations')) || {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};

let currentMode = 'pomodoro';
let totalSeconds = durations[currentMode];
let timer, running = false;

function updateDisplay() {
    const min = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const sec = String(totalSeconds % 60).padStart(2, '0');
    minutesDisplay.textContent = min;
    secondsDisplay.textContent = sec;
}

function startTimer() {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    iconPath.setAttribute("d", "M 30 20 H 40 V 80 H 30 Z M 60 20 H 70 V 80 H 60 Z");

    timer = setInterval(() => {
        if (totalSeconds > 0) {
            totalSeconds--;
            updateDisplay();
        } else {
            clearInterval(timer);
            running = false;
            iconPath.setAttribute("d", "M 30 20 L 70 50 L 30 80 Z");
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            alarmSound.play();
            notify("Time's up!", `${currentMode} session finished`);
        }
    }, 1000);
}

function pauseTimer() {
    if (!running) return;
    clearInterval(timer);
    running = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    iconPath.setAttribute("d", "M 30 20 L 70 50 L 30 80 Z");
}

function resetTimer() {
    pauseTimer();
    totalSeconds = durations[currentMode];
    updateDisplay();
}

function switchMode(mode) {
    pauseTimer();
    currentMode = mode;
    totalSeconds = durations[mode];
    updateDisplay();

    modeButtons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
    activeBtn.classList.add('active');

    const index = Array.from(modeButtons).indexOf(activeBtn);
    indicator.style.transform = `translateX(${index * 100}%)`;

    document.body.className = mode;

    const colorMap = {
        pomodoro: 'var(--color-pomodoro)',
        short: 'var(--color-short)',
        long: 'var(--color-long)'
    };

    document.querySelectorAll('.controls button').forEach(btn => {
        btn.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(colorMap[mode]);
    });
}

function playClick() {
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.play();
    }
  }
  

function saveDurations() {
    durations = {
        pomodoro: parseInt(inputPomodoro.value || 25) * 60,
        short: parseInt(inputShort.value || 5) * 60,
        long: parseInt(inputLong.value || 15) * 60
    };
    localStorage.setItem('durations', JSON.stringify(durations));
    switchMode(currentMode);
}

function notify(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

function saveTasks() {
    const tasks = Array.from(taskList.children).map(li => ({
        text: li.dataset.text,
        est: parseInt(li.dataset.est),
        done: parseInt(li.dataset.done)
    }));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = JSON.parse(localStorage.getItem('tasks') || '[]');
    taskList.innerHTML = '';
    saved.forEach(({ text, est, done }) => {
        addTask(text, est, done);
    });
}

function addTask(text, est = 1, done = 0) {
    const li = document.createElement('li');
    li.dataset.text = text;
    li.dataset.est = est;
    li.dataset.done = done;

    const taskSpan = document.createElement('span');
    taskSpan.textContent = `${done}/${est} Pomodoros`;

    const taskName = document.createElement('span');
    taskName.className = 'task-name';
    taskName.textContent = text;
  
    if (done >= est) li.style.textDecoration = 'line-through';

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const plusBtn = document.createElement('button');
    plusBtn.textContent = '+1';
    plusBtn.onclick = () => markPomodoroDone(plusBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.onclick = () => {
        li.remove();
        saveTasks();
    };

    actions.appendChild(plusBtn);
    actions.appendChild(delBtn);

    li.appendChild(taskName);
    li.appendChild(taskSpan);
    li.appendChild(actions);
    taskList.appendChild(li);
    if (done >= est) {
        li.style.textDecoration = 'line-through';
        addIncompleteButton(li);
    }
      

    saveTasks();
}


window.markPomodoroDone = function (btn) {
    const li = btn.closest('li');
    let done = parseInt(li.dataset.done);
    const est = parseInt(li.dataset.est);
    if (done < est) {
        done++;
        li.dataset.done = done;
        li.querySelector('span').textContent = `${done}/${est} Pomodoros`;

        xp++;
        const needed = getXPRequired(level);
        if (xp >= needed) {
            xp -= needed;
            level++;
            levelDisplay.classList.add('bounce');
            setTimeout(() => levelDisplay.classList.remove('bounce'), 500);
        }

        if (done >= est) {
            li.style.textDecoration = 'line-through';
            addIncompleteButton(li);
        }

        saveTasks();
        saveXP();
        updateXPBar();
    }
};

function addIncompleteButton(li) {
    const btn = document.createElement('button');
    btn.textContent = '↩️';
    btn.onclick = () => {
        li.style.textDecoration = '';
        li.dataset.done = li.dataset.est - 1;
        li.querySelector('span').textContent = `${li.dataset.done}/${li.dataset.est} Pomodoros`;
        btn.remove();
        saveTasks();
        saveXP();
        updateXPBar();
    };
    li.querySelector('.task-actions').appendChild(btn);
}
  
function saveXP() {
    localStorage.setItem('xp', xp);
    localStorage.setItem('level', level);
}
  

taskForm.onsubmit = e => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const est = parseInt(taskEstimate.value) || 1;
    if (!text) return;
    addTask(text, est);
    taskInput.value = '';
    taskEstimate.value = '';
};

modeButtons.forEach(btn => {
    btn.onclick = () => switchMode(btn.dataset.mode);
});
startBtn.onclick = () => {
    playClick();
    startTimer();
};

pauseBtn.onclick = () => {
    playClick();
    pauseTimer();
};

resetBtn.onclick = () => {
    playClick();
    resetTimer();
};
  
saveSettingsBtn.onclick = saveDurations;

iconToggle.onclick = () => {
    running ? pauseTimer() : startTimer();
};

function init() {
    updateDisplay();
    inputPomodoro.value = durations.pomodoro / 60;
    inputShort.value = durations.short / 60;
    inputLong.value = durations.long / 60;
    loadTasks();
    switchMode(currentMode);
    Notification.requestPermission();
    updateXPBar();
    saveXP();

}

init();
