const timerDisplay = document.querySelector(".display h1");
const startBtn = document.querySelector(".start-btn");
const taskBox = document.querySelector(".task-box");
const taskPopup = document.querySelector(".task-popup");
const cancelPopupBtn = document.querySelector(".cancel-popup-btn");
const savePopupBtn = document.querySelector(".save-popup-btn");
const page = document.querySelector(".page");
const pomodoroBtn = document.querySelector(".active-btn");
const breakBtns = document.querySelectorAll(".main-btn");
const modeBtns = document.querySelectorAll(".active-btn, .main-btn");
const breakOverlay = document.querySelector(".break-modal-overlay");
const shortBreakBtn = document.querySelector(".short-break-btn");
const longBreakBtn = document.querySelector(".long-break-btn");
const nextBtn = document.querySelector(".next-btn");

breakOverlay.classList.add("hidden");

function setNextButtonVisibility(visible) {
    if (!nextBtn) return;
    nextBtn.classList.toggle("visible", visible);
}

function handleNextButton() {
    if (currentMode === "pomodoro") {
        handleTimerFinish();
        return;
    }

    if (isBreakMode()) {
        clearInterval(timer);
        isRunning = false;
        startBtn.textContent = "Start";
        pendingTaskAfterBreak = true;
        pendingTaskId = activeTaskId;
        completePendingTaskAfterBreak();
        changeMode("pomodoro");
        setNextButtonVisibility(false);
    }
}

// Task system variables
let tasks = [];
let taskIdCounter = 0;
let editingTaskId = null;
let activeTaskId = null;
let pendingTaskAfterBreak = false;
let pendingTaskId = null;


let timeLeft = 25 * 60; // 25 minutes in seconds
let timer;
let isRunning = false;
let currentMode = "pomodoro";

function updateDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    timerDisplay.textContent = `${minutes}:${seconds}`;
}

function getTaskById(taskId) {
    return tasks.find((task) => task.id === taskId);
}

function isBreakMode() {
    return currentMode !== "pomodoro";
}

function updateTaskCompletionStatus(task) {
    task.completed = task.completedPomodoros >= task.estimatedPomodoros;
}

function handleTimerFinish() {
    clearInterval(timer);
    isRunning = false;
    startBtn.textContent = "Start";
    setNextButtonVisibility(false);

    if (currentMode === "pomodoro") {
        showBreakSelector();
        return;
    }

    if (isBreakMode()) {
        completePendingTaskAfterBreak();
        changeMode("pomodoro");
    }
}

function showBreakSelector() {
    if (activeTaskId === null) {
        pendingTaskId = null;
    } else {
        pendingTaskId = activeTaskId;
    }

    pendingTaskAfterBreak = true;
    breakOverlay.classList.remove("hidden");
}

function completePendingTaskAfterBreak() {
    if (!pendingTaskAfterBreak || pendingTaskId === null) {
        pendingTaskAfterBreak = false;
        pendingTaskId = null;
        return;
    }

    const task = getTaskById(pendingTaskId);
    if (!task) {
        pendingTaskAfterBreak = false;
        pendingTaskId = null;
        return;
    }

    if (!task.completed) {
        task.completedPomodoros = Math.min(task.estimatedPomodoros, task.completedPomodoros + 1);
        updateTaskCompletionStatus(task);
    }

    pendingTaskAfterBreak = false;
    pendingTaskId = null;
    renderTasks();
}

function chooseBreakMode(mode) {
    breakOverlay.classList.add("hidden");
    changeMode(mode);
}

function startTimer() {

    if (!isRunning) {

        isRunning = true;
        startBtn.textContent = "Pause";
        setNextButtonVisibility(true);

        timer = setInterval(() => {

            timeLeft--;

            updateDisplay();

            if (timeLeft <= 0) {

                handleTimerFinish();
            }

        }, 1000);

    } else {

        clearInterval(timer);

        isRunning = false;

        startBtn.textContent = "Resume";
        setNextButtonVisibility(false);
    }
}

const pomodoroTime = 25 * 60;
const shortBreakTime = 5 * 60;
const longBreakTime = 15 * 60;

// change mode
function changeMode(mode) {

    clearInterval(timer);

    isRunning = false;

    currentMode = mode;

    startBtn.textContent = "Start";

    modeBtns.forEach((btn) => {
        btn.classList.remove("mode-active");
    });

    if (mode === "pomodoro") {

        timeLeft = pomodoroTime;
        document.body.className = "";
        pomodoroBtn.classList.add("mode-active");
    }

    if (mode === "short") {

        timeLeft = shortBreakTime;

        document.body.className = "short-mode";
        breakBtns[0].classList.add("mode-active");
    }

    if (mode === "long") {

        timeLeft = longBreakTime;

        document.body.className = "long-mode";
        breakBtns[1].classList.add("mode-active");
    }

    updateDisplay();
}
    
// connect buttons to change mode
pomodoroBtn.addEventListener("click", () => {
    changeMode("pomodoro");
});

breakBtns[0].addEventListener("click", () => {
    changeMode("short");
});

breakBtns[1].addEventListener("click", () => {
    changeMode("long");
});
startBtn.addEventListener("click", startTimer);

if (nextBtn) {
    nextBtn.addEventListener("click", handleNextButton);
}

shortBreakBtn.addEventListener("click", () => {
    chooseBreakMode("short");
});

longBreakBtn.addEventListener("click", () => {
    chooseBreakMode("long");
});

// increasing or decreasing est pomodoro time

const up_btn = document.querySelector(".up-btn");
const down_btn = document.querySelector(".down-btn");
const count_input = document.querySelector(".count-input");

up_btn.addEventListener("click", () => {
    count_input.value = parseInt(count_input.value) + 1;
});

down_btn.addEventListener("click", () => {
    if (parseInt(count_input.value) > 1) {
        count_input.value = parseInt(count_input.value) - 1;
    }
});

// ===== TASK SYSTEM =====

function createTaskCard(task) {
    const taskCard = document.createElement("div");
    taskCard.className = `task-card${task.completed ? " completed" : ""}`;
    taskCard.dataset.taskId = task.id;
    
    taskCard.innerHTML = `
        <div class="task-card-left-bar"></div>
        <div class="task-card-content">
            <h3>${task.title}</h3>
            <div class="task-progress">${task.completedPomodoros}/${task.estimatedPomodoros}</div>
        </div>
        ${task.completed ? '<span class="task-completed-label">Completed</span>' : ""}
        <button class="task-dots-btn" type="button">⋮</button>
    `;
    
    // Task card click - set active
    taskCard.addEventListener("click", (e) => {
        if (e.target.classList.contains("task-dots-btn")) return;
        setActiveTask(task.id);
    });
    
    // Three-dot button - open edit popup
    const dotsBtn = taskCard.querySelector(".task-dots-btn");
    dotsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditPopup(task.id);
    });
    
    return taskCard;
}

function setActiveTask(taskId) {
    activeTaskId = taskId;
    document.querySelectorAll(".task-card").forEach((card) => {
        card.classList.remove("active");
    });
    
    const activeCard = document.querySelector(`[data-task-id="${taskId}"]`);
    if (activeCard) {
        activeCard.classList.add("active");
    }
}

function renderTasks() {
    const taskList = document.querySelector(".task-list");
    taskList.innerHTML = "";
    
    tasks.forEach((task) => {
        taskList.appendChild(createTaskCard(task));
    });

    if (activeTaskId !== null) {
        const activeCard = document.querySelector(`[data-task-id="${activeTaskId}"]`);
        if (activeCard) {
            setActiveTask(activeTaskId);
        } else {
            activeTaskId = null;
        }
    }
}

function openAddPopup() {
    editingTaskId = null;
    document.querySelector(".popup-task-input").value = "";
    document.querySelector(".count-input").value = "1";
    taskPopup.classList.remove("hidden");
    taskBox.style.display = "none";
    page.classList.add("page-expanded");
    
    // Hide delete button in add mode
    const deleteBtn = document.querySelector(".delete-popup-btn");
    if (deleteBtn) deleteBtn.style.display = "none";
}

function openEditPopup(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    document.querySelector(".popup-task-input").value = task.title;
    document.querySelector(".count-input").value = task.estimatedPomodoros;
    taskPopup.classList.remove("hidden");
    taskBox.style.display = "none";
    page.classList.add("page-expanded");
    
    // Show delete button in edit mode
    let deleteBtn = document.querySelector(".delete-popup-btn");
    if (!deleteBtn) {
        deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-popup-btn";
        deleteBtn.type = "button";
        
        const deleteImg = document.createElement("img");
        deleteImg.src = "delete-black.png";
        deleteImg.alt = "Delete";
        deleteImg.style.width = "20px";
        deleteImg.style.height = "20px";
        deleteBtn.appendChild(deleteImg);
        
        document.querySelector(".popup-footer").insertBefore(deleteBtn, document.querySelector(".cancel-popup-btn"));
        
        deleteBtn.addEventListener("click", () => {
            deleteTask(editingTaskId);
            closePopup();
        });
    }
    deleteBtn.style.display = "flex";
}

function deleteTask(taskId) {
    tasks = tasks.filter((t) => t.id !== taskId);
    if (activeTaskId === taskId) {
        activeTaskId = null;
    }
    renderTasks();
}

function closePopup() {
    taskPopup.classList.add("hidden");
    taskBox.style.display = "flex";
    page.classList.remove("page-expanded");
    editingTaskId = null;
    document.querySelector(".popup-task-input").value = "";
    document.querySelector(".count-input").value = "1";
}

// Task Box click - open add popup
taskBox.addEventListener("click", () => {
    openAddPopup();
});

// Cancel button
cancelPopupBtn.addEventListener("click", () => {
    closePopup();
});

// Save button
savePopupBtn.addEventListener("click", () => {
    const taskName = document.querySelector(".popup-task-input").value.trim();
    const estimatedPomodoros = parseInt(document.querySelector(".count-input").value) || 1;
    
    if (!taskName) {
        alert("Please enter a task name");
        return;
    }
    
    if (editingTaskId !== null) {
        // Update existing task
        const task = tasks.find((t) => t.id === editingTaskId);
        if (task) {
            task.title = taskName;
            task.estimatedPomodoros = estimatedPomodoros;
            updateTaskCompletionStatus(task);
        }
    } else {
        // Create new task
        const newTask = {
            id: taskIdCounter++,
            title: taskName,
            estimatedPomodoros: estimatedPomodoros,
            completedPomodoros: 0,
            completed: false,
        };
        tasks.push(newTask);
        if (activeTaskId === null) {
            activeTaskId = newTask.id;
        }
    }
    
    renderTasks();
    closePopup();
});
