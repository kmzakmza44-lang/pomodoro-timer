// DOM Elements
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
const statusNumber = document.querySelector(".status-box span");
const reportBtn = document.querySelector(".top-btn.report-btn");
const reportPage = document.querySelector("#report-page");
const reportCloseBtn = document.querySelector(".report-close-btn");
const clearReportBtn = document.querySelector(".clear-report-btn");
const prevMonthBtn = document.querySelector("#prev-month");
const nextMonthBtn = document.querySelector("#next-month");
const heatmapMonthYear = document.querySelector("#heatmap-month-year");

// Global Variables
let reportData = null;
let weeklyChart = null;
let taskChart = null;
let currentHeatmapMonth = new Date().getMonth();
let currentHeatmapYear = new Date().getFullYear();

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

function updateStatusNumber() {
    if (!statusNumber) return;

    const activeIndex = tasks.findIndex((task) => task.id === activeTaskId);
    statusNumber.textContent = activeIndex >= 0 ? `#${activeIndex + 1}` : "#0";
}

function loadReportState() {
    const stored = localStorage.getItem("pomodoroReportData");
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            reportData = {
                totalFocusMinutes: parsed.totalFocusMinutes || 0,
                totalPomodoros: parsed.totalPomodoros || 0,
                focusDays: parsed.focusDays || [],
                weeklyFocus: parsed.weeklyFocus || [0, 0, 0, 0, 0, 0, 0],
                monthlyHeatmap: parsed.monthlyHeatmap || Array.from({ length: 30 }, () => 0),
                sessionHistory: parsed.sessionHistory || [],
                currentStreak: parsed.currentStreak || 0,
                longestStreak: parsed.longestStreak || 0,
                totalCompletedTasks: parsed.totalCompletedTasks || 0,
            };
        } catch (error) {
            reportData = null;
        }
    }

    if (!reportData) {
        reportData = {
            totalFocusMinutes: 0,
            totalPomodoros: 0,
            focusDays: [],
            weeklyFocus: [0, 0, 0, 0, 0, 0, 0],
            monthlyHeatmap: Array.from({ length: 30 }, () => 0),
            sessionHistory: [],
            currentStreak: 0,
            longestStreak: 0,
            totalCompletedTasks: 0,
        };
    }
}

function saveReportState() {
    localStorage.setItem("pomodoroReportData", JSON.stringify(reportData));
}

function getDayIndex(date) {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
}

function getDateKey(date) {
    return date.toISOString().split("T")[0];
}

function updateStreaks() {
    const uniqueDates = Array.from(new Set(reportData.focusDays)).sort();
    reportData.focusDays = uniqueDates;
    reportData.longestStreak = 0;
    reportData.currentStreak = 0;

    let lastDate = null;
    let streak = 0;

    uniqueDates.forEach((dateString) => {
        const currentDate = new Date(dateString);
        if (!lastDate) {
            streak = 1;
        } else {
            const diff = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                streak += 1;
            } else if (diff > 1) {
                reportData.longestStreak = Math.max(reportData.longestStreak, streak);
                streak = 1;
            }
        }
        lastDate = currentDate;
    });

    reportData.longestStreak = Math.max(reportData.longestStreak, streak);
    if (uniqueDates.length > 0) {
        const lastFocusDate = new Date(uniqueDates[uniqueDates.length - 1]);
        const today = new Date();
        const dateDiff = Math.floor((today - lastFocusDate) / (1000 * 60 * 60 * 24));
        reportData.currentStreak = dateDiff === 0 ? streak : dateDiff === 1 ? streak : 0;
    } else {
        reportData.currentStreak = 0;
    }
}

function addFocusSession(minutes) {
    const validMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
    if (validMinutes <= 0) return;

    const now = new Date();
    const dateKey = getDateKey(now);

    reportData.totalFocusMinutes += validMinutes;
    reportData.totalPomodoros += 1;

    const weekdayIndex = getDayIndex(now);
    reportData.weeklyFocus[weekdayIndex] += validMinutes;

    const dayOfMonth = now.getDate() - 1;
    reportData.monthlyHeatmap[dayOfMonth] += minutes;

    if (!reportData.focusDays.includes(dateKey)) {
        reportData.focusDays.push(dateKey);
    }

    reportData.sessionHistory.unshift({
        label: "Focus Session",
        description: `${minutes}m focus`,
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "focus",
    });

    if (reportData.sessionHistory.length > 14) {
        reportData.sessionHistory.pop();
    }

    updateStreaks();
    saveReportState();
}

function addBreakSession(mode) {
    const now = new Date();
    const duration = mode === "long" ? 15 : 5;
    reportData.sessionHistory.unshift({
        label: mode === "long" ? "Long Break" : "Short Break",
        description: `${duration}m break`,
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "break",
    });

    if (reportData.sessionHistory.length > 14) {
        reportData.sessionHistory.pop();
    }

    saveReportState();
}

function getTaskAnalytics() {
    const completed = tasks.filter((task) => task.completed).length;
    const incomplete = tasks.length - completed;
    const estimated = tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0);
    const completedPomodoros = tasks.reduce((sum, task) => sum + task.completedPomodoros, 0);

    return { completed, incomplete, estimated, completedPomodoros };
}

function getMostProductiveDay() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const maxMinutes = Math.max(...reportData.weeklyFocus);
    const index = reportData.weeklyFocus.indexOf(maxMinutes);
    return `${days[index] || "N/A"}`;
}

function getAverageSession() {
    if (reportData.totalPomodoros === 0) return 0;
    return Math.round(reportData.totalFocusMinutes / reportData.totalPomodoros);
}

function getCompletionPercentage() {
    const analytics = getTaskAnalytics();
    if (analytics.estimated === 0) return 0;
    return Math.round((analytics.completedPomodoros / analytics.estimated) * 100);
}

// Chart Logic
function buildWeeklyChart() {
    const ctx = document.getElementById("weekly-focus-chart");
    if (!ctx) return;
    const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, "rgba(123, 193, 255, 0.95)");
    gradient.addColorStop(1, "rgba(96, 73, 255, 0.4)");

    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                label: "Focus minutes",
                data: reportData.weeklyFocus,
                backgroundColor: gradient,
                borderRadius: 16,
                maxBarThickness: 32,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgba(16, 24, 52, 0.95)",
                    titleColor: "#f8fbff",
                    bodyColor: "#e8e8ff",
                    borderColor: "rgba(255,255,255,0.12)",
                    borderWidth: 1,
                    padding: 12,
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: "rgba(255,255,255,0.72)" },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255,255,255,0.08)" },
                    ticks: { color: "rgba(255,255,255,0.72)", stepSize: 20 },
                },
            },
        },
    });
}

function buildTaskChart() {
    const ctx = document.getElementById("task-analytics-chart");
    if (!ctx) return;

    const analytics = getTaskAnalytics();
    const completed = analytics.completed;
    const incomplete = analytics.incomplete;

    if (taskChart) {
        taskChart.destroy();
    }

    taskChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Completed", "Incomplete"],
            datasets: [{
                data: [completed, incomplete],
                backgroundColor: ["#5ec9ff", "rgba(255,255,255,0.16)"],
                borderWidth: 0,
                hoverOffset: 10,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "rgba(255,255,255,0.75)" },
                },
                tooltip: {
                    backgroundColor: "rgba(16, 24, 52, 0.95)",
                    titleColor: "#f8fbff",
                    bodyColor: "#e8e8ff",
                    borderColor: "rgba(255,255,255,0.12)",
                    borderWidth: 1,
                    padding: 12,
                },
            },
        },
    });
}

function updateHeatmapHeader() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (heatmapMonthYear) {
        heatmapMonthYear.textContent = `${monthNames[currentHeatmapMonth]} ${currentHeatmapYear}`;
    }
}

// Heatmap Logic
function renderHeatmap() {
    const container = document.getElementById("report-heatmap");
    if (!container) return;
    container.innerHTML = "";

    const firstDay = new Date(currentHeatmapYear, currentHeatmapMonth, 1);
    const lastDay = new Date(currentHeatmapYear, currentHeatmapMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const today = new Date();
    const currentMonthKey = `${currentHeatmapYear}-${String(currentHeatmapMonth + 1).padStart(2, '0')}`;

    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const square = document.createElement("div");
        square.className = "heatmap-day";
        square.textContent = day;

        if (month !== currentHeatmapMonth) {
            square.classList.add("empty");
        } else {
            const minutes = reportData.monthlyHeatmap[day - 1] || 0;
            const level = Math.min(4, Math.floor(minutes / 15));
            const shades = ["#252535", "#353545", "#454555", "#555565", "#656575"];
            square.style.background = shades[level];

            const isFuture = date > today;
            if (isFuture) {
                square.classList.add("future");
            }

            square.title = `${minutes} mins focused on ${date.toLocaleDateString()}`;
        }

        container.appendChild(square);
    }
}

// Report Logic
function renderReportPage() {
    const focusLabel = document.getElementById("report-focus-time");
    const pomodoroLabel = document.getElementById("report-pomodoro-count");
    const taskLabel = document.getElementById("report-tasks-completed");
    const streakLabel = document.getElementById("report-current-streak");
    const insightMost = document.getElementById("insight-most-productive");
    const insightAverage = document.getElementById("insight-average-session");
    const insightMonth = document.getElementById("insight-month-hours");
    const insightCompletion = document.getElementById("insight-completion");
    const sessionHistory = document.getElementById("session-history");
    const streakCurrent = document.getElementById("streak-current");
    const streakLongest = document.getElementById("streak-longest");
    const streakConsistency = document.getElementById("streak-consistency");

    const analytics = getTaskAnalytics();
    const completion = getCompletionPercentage();

    const completedTaskCount = tasks.length > 0 ? tasks.filter((task) => task.completed).length : reportData.totalCompletedTasks;

    if (focusLabel) focusLabel.textContent = `${reportData.totalFocusMinutes}m`;
    if (pomodoroLabel) pomodoroLabel.textContent = `${reportData.totalPomodoros}`;
    if (taskLabel) taskLabel.textContent = `${completedTaskCount}`;
    if (streakLabel) streakLabel.textContent = `${reportData.currentStreak} days`;
    if (insightMost) insightMost.textContent = `You focused most on ${getMostProductiveDay()}.`;
    if (insightAverage) insightAverage.textContent = `Your average session is ${getAverageSession()} minutes.`;
    if (insightMonth) insightMonth.textContent = `This month you focused ${Math.floor(reportData.totalFocusMinutes / 60)} hours.`;
    if (insightCompletion) insightCompletion.textContent = `Completion percentage is ${completion}%`;
    if (streakCurrent) streakCurrent.textContent = `${reportData.currentStreak} day streak`;
    if (streakLongest) streakLongest.textContent = `Longest streak: ${reportData.longestStreak} days`;

    if (streakConsistency) {
        const activeDays = reportData.weeklyFocus.filter((minutes) => minutes > 0).length;
        const consistency = Math.round((activeDays / 7) * 100);
        streakConsistency.textContent = `Weekly consistency: ${consistency}%`;
    }

    if (sessionHistory) {
        sessionHistory.innerHTML = "";
        reportData.sessionHistory.forEach((entry) => {
            const item = document.createElement("div");
            item.className = "session-item";
            item.innerHTML = `
                <span class="session-status">${entry.label}</span>
                <div>
                    <p class="session-label">${entry.description}</p>
                    <p class="session-time">${entry.time}</p>
                </div>
            `;
            sessionHistory.appendChild(item);
        });
    }

    buildWeeklyChart();
    buildTaskChart();
    updateHeatmapHeader();
    renderHeatmap();
}

function openReportPage() {
    if (!reportPage) return;
    reportPage.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    renderReportPage();
}

function closeReportPage() {
    if (!reportPage) return;
    reportPage.classList.add("hidden");
    document.body.style.overflow = "auto";
}

function clearReportData() {
    if (!confirm("Are you sure you want to clear all report data?")) return;

    reportData.totalFocusMinutes = 0;
    reportData.totalPomodoros = 0;
    reportData.focusDays = [];
    reportData.weeklyFocus = [0, 0, 0, 0, 0, 0, 0];
    reportData.monthlyHeatmap = Array.from({ length: 30 }, () => 0);
    reportData.sessionHistory = [];
    reportData.currentStreak = 0;
    reportData.longestStreak = 0;
    reportData.totalCompletedTasks = 0;

    saveReportState();
    renderReportPage();
}

function changeHeatmapMonth(delta) {
    currentHeatmapMonth += delta;
    if (currentHeatmapMonth < 0) {
        currentHeatmapMonth = 11;
        currentHeatmapYear--;
    } else if (currentHeatmapMonth > 11) {
        currentHeatmapMonth = 0;
        currentHeatmapYear++;
    }
    updateHeatmapHeader();
    renderHeatmap();
}

function syncReportTaskMetrics() {
    reportData.totalCompletedTasks = tasks.filter((task) => task.completed).length;
    saveReportState();
}

function initReportSystem() {
    loadReportState();
    updateStreaks();
    updateHeatmapHeader();
    saveReportState();
}

initReportSystem();

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
        addFocusSession(Math.round(pomodoroTime / 60));
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
        syncReportTaskMetrics();
    }

    pendingTaskAfterBreak = false;
    pendingTaskId = null;
    renderTasks();
    if (reportPage && !reportPage.classList.contains("hidden")) {
        renderReportPage();
    }
}

function chooseBreakMode(mode) {
    breakOverlay.classList.add("hidden");
    addBreakSession(mode);
    changeMode(mode);
}

// Timer Logic
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

// Event Listeners
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

if (reportBtn) {
    reportBtn.addEventListener("click", openReportPage);
}
if (reportCloseBtn) {
    reportCloseBtn.addEventListener("click", closeReportPage);
}
if (clearReportBtn) {
    clearReportBtn.addEventListener("click", clearReportData);
}
if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => changeHeatmapMonth(-1));
}
if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => changeHeatmapMonth(1));
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

    updateStatusNumber();
}

// Task Management
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

    updateStatusNumber();
    if (reportPage && !reportPage.classList.contains("hidden")) {
        renderReportPage();
    }
}


// Popup Logic
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
    syncReportTaskMetrics();
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

const taskDotsButton = document.querySelector(".dots-btn");
const taskMenu = document.querySelector("#task-menu");
const clearFinishedBtn = document.querySelector("[data-action='clear-finished']");
const clearAllBtn = document.querySelector("[data-action='clear-all']");

if (taskDotsButton && taskMenu) {
    taskDotsButton.addEventListener("click", (event) => {
        event.stopPropagation();
        taskMenu.classList.toggle("hidden");
    });
}

document.addEventListener("click", (event) => {
    if (!taskMenu || !taskDotsButton) return;
    if (taskMenu.classList.contains("hidden")) return;
    if (event.target === taskDotsButton || taskMenu.contains(event.target)) return;
    taskMenu.classList.add("hidden");
});

if (clearFinishedBtn) {
    clearFinishedBtn.addEventListener("click", () => {
        tasks = tasks.filter((task) => !task.completed);
        if (activeTaskId !== null && !tasks.some((task) => task.id === activeTaskId)) {
            activeTaskId = null;
        }
        syncReportTaskMetrics();
        renderTasks();
        if (taskMenu) taskMenu.classList.add("hidden");
    });
}

if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
        tasks = [];
        activeTaskId = null;
        syncReportTaskMetrics();
        renderTasks();
        if (taskMenu) taskMenu.classList.add("hidden");
    });
}

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

    syncReportTaskMetrics();
    renderTasks();
    if (reportPage && !reportPage.classList.contains("hidden")) {
        renderReportPage();
    }
    closePopup();
});

updateStatusNumber();
